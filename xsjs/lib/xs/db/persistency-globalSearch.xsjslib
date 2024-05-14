const Helper = $.require('./persistency-helper').Helper;
const _ = $.require('lodash');
const helpers = $.require('../util/helpers');

const GlobalSearchDefaultValues = $.require('../util/constants').globalSearchDefaultValues;
const GlobalSearchTypeValues = $.require('../util/constants').globalSearchTypeValues;
const GlobalSearchDirection = $.require('../util/constants').globalSearchDirection;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;
const Code = MessageLibrary.Code;

var Tables = Object.freeze({
    calculation: 'sap.plc.db::basis.t_calculation',
    calculation_version: 'sap.plc.db::basis.t_calculation_version',
    project: 'sap.plc.db::basis.t_project',
    customer: 'sap.plc.db::basis.t_customer',
    item: 'sap.plc.db::basis.t_item'
});

const Views = Object.freeze({
    calculation_with_privileges: 'sap.plc.db.authorization::privileges.v_calculation_read',
    calculation_version_with_privileges: 'sap.plc.db.authorization::privileges.v_calculation_version_read',
    project_with_privileges: 'sap.plc.db.authorization::privileges.v_project_read',
    entity_relation: 'sap.plc.db.views::v_entity_relation'
});

/**
 * Search in Projects, Calculations or Calculations Version or in "All Objects"
 * for a specific string or string combinations
 * Ex: test1 test2 OR test3 is equivalent with test1 AND test2 OR test3 
 * 	   - will search for objects that contains test1 and test 2 OR test3 string
 */
async function GlobalSearch(dbConnection, hQueryPlc) {
    var that = this;
    this.helper = await new Helper($, hQueryPlc, dbConnection);

    /**
	 * Function to search in Projects, Calculations or Calculations Version or in "All Objects"
	 * for a specific string or string combinations 
	 *
	 * @param sSortedColumnId {string} - column id to be sorted by -  default LAST_MODIFIED_ON
	 * @param sSortedDirection {string} - sorted direction DESC, ASC - default ASC
	 * @param sFilter {string} - search string
	 * @param sType {string} - the type of object searched by, All, Calculation, CalculationVersion, Project
	 * @param iTop {int} - first top records
	 * 
	 * @throws {PlcException} - if executing sql statement fails
	 *
	 * @returns {object} oReturnObject - object containing all the search objects
	 * 
	 * Implemented as SQL query and no as stored procedure since parameter order by and direction are not supported there - I309362
	 * To be changed when functionality dynamic order by column and order by direction will be introduced in SAP HANA 
	 *  
	 */
    this.get = async function (sSortedColumnId, sSortedDirection, sFilter, sType, iTop, sUserId) {
        iTop = !helpers.isNullOrUndefined(iTop) ? iTop : GlobalSearchDefaultValues.MaxQueryResults;
        sSortedColumnId = !helpers.isNullOrUndefined(sSortedColumnId) ? sSortedColumnId : GlobalSearchDefaultValues.SortedColumnId;
        sSortedDirection = !helpers.isNullOrUndefined(sSortedDirection) ? await getSortedDirection(sSortedDirection) : GlobalSearchDefaultValues.SortedDirection;
        sFilter = await getFilter(sFilter);

        if (helpers.isNullOrUndefinedOrEmpty(sFilter)) {
            return [];
        }

        try {

            let sWhereClause = await buildWhereClause(sType);
            let sStmt = `select top ?
					entityData.PROJECT_ID as PROJECT_ID, entityData.PROJECT_NAME as PROJECT_NAME, entityData.STATUS_ID as STATUS_ID, entityData.CALCULATION_ID as CALCULATION_ID, entityData.CALCULATION_NAME as CALCULATION_NAME, 
					entityData.CALCULATION_VERSION_ID as CALCULATION_VERSION_ID, entityData.CALCULATION_VERSION_NAME as CALCULATION_VERSION_NAME, 
					entityData.ENTITY_TYPE,  entityData.ENTITY_NAME, entityData.ENTITY_ID, entityData.BASE_VERSION_ID, entityData.BASE_VERSION_NAME, entityData.CALCULATION_VERSION_TYPE, entityData.CUSTOMER_NAME, entityData.CUSTOMER_ID, 
					entityData.TOTAL_COST, entityData.TOTAL_COST_UOM_ID , entityData.TOTAL_QUANTITY, entityData.TOTAL_QUANTITY_UOM_ID, 
					entityData.CREATED_ON, entityData.CREATED_BY, entityData.LAST_MODIFIED_ON, entityData.LAST_MODIFIED_BY, entityData.PROJECT_PATH as PROJECT_PATH
				from 
					(
					-- select calculations
					select distinct prj.PROJECT_ID as PROJECT_ID, prj.PROJECT_NAME as PROJECT_NAME, null as STATUS_ID, calc.CALCULATION_ID as CALCULATION_ID,
							calc.CALCULATION_NAME as CALCULATION_NAME, NULL as CALCULATION_VERSION_ID, null as CALCULATION_VERSION_NAME, 
							'${ GlobalSearchTypeValues.Calculation }' as ENTITY_TYPE,  calc.CALCULATION_NAME as ENTITY_NAME, 
							CAST(calc.CALCULATION_ID as NVARCHAR) as ENTITY_ID , NULL as BASE_VERSION_ID, NULL as BASE_VERSION_NAME,  NULL as CALCULATION_VERSION_TYPE, '' as CUSTOMER_NAME, '' as CUSTOMER_ID, 
							null as TOTAL_COST, null as TOTAL_COST_UOM_ID, 
							null as TOTAL_QUANTITY, null as TOTAL_QUANTITY_UOM_ID, calc.CREATED_ON as CREATED_ON, calc.CREATED_BY as CREATED_BY,
							calc.LAST_MODIFIED_ON as LAST_MODIFIED_ON, calc.LAST_MODIFIED_BY as LAST_MODIFIED_BY,  entity.PATH as PROJECT_PATH
						from "${ Views.calculation_with_privileges }" as calc 
						inner join "${ Tables.project }"  as prj 
							ON prj.PROJECT_ID = calc.PROJECT_ID
						inner join "${ Views.entity_relation }" as entity
							ON entity.QUERY_NODE = prj.ENTITY_ID	
						inner join "${ Tables.calculation_version }" as calcVersion 
							ON calcVersion.CALCULATION_ID = calc.CALCULATION_ID
						where (calc.CALCULATION_NAME LIKE_REGEXPR ? FLAG 'i' 
								or calc.CALCULATION_ID LIKE_REGEXPR ? FLAG 'i' 
								or calc.CREATED_BY LIKE_REGEXPR ? FLAG 'i' 
								or calc.LAST_MODIFIED_BY LIKE_REGEXPR ? FLAG 'i' ) 
							and calc.USER_ID = ?
					union all 
					-- select calculation versions
						select distinct prj.PROJECT_ID as PROJECT_ID, prj.PROJECT_NAME as PROJECT_NAME, calcV.STATUS_ID as STATUS_ID, calc.CALCULATION_ID as CALCULATION_ID, calc.CALCULATION_NAME as CALCULATION_NAME, 
							calcV.CALCULATION_VERSION_ID as CALCULATION_VERSION_ID , calcV.CALCULATION_VERSION_NAME as CALCULATION_VERSION_NAME, 
							'${ GlobalSearchTypeValues.CalculationVersion }' as ENTITY_TYPE,  calcV.CALCULATION_VERSION_NAME as ENTITY_NAME,
							CAST(calcV.CALCULATION_VERSION_ID as NVARCHAR) as ENTITY_ID , calcV.BASE_VERSION_ID, base_version.CALCULATION_VERSION_NAME as BASE_VERSION_NAME, calcV.CALCULATION_VERSION_TYPE, cust.CUSTOMER_NAME as CUSTOMER_NAME, calcV.CUSTOMER_ID as CUSTOMER_ID, 
							itm.TOTAL_COST as TOTAL_COST, calcV.REPORT_CURRENCY_ID as TOTAL_COST_UOM_ID,
							itm.TOTAL_QUANTITY as TOTAL_QUANTITY, itm.TOTAL_QUANTITY_UOM_ID as TOTAL_QUANTITY_UOM_ID, 
							itm.CREATED_ON as CREATED_ON, itm.CREATED_BY as CREATED_BY,
							calcV.LAST_MODIFIED_ON as LAST_MODIFIED_ON, calcV.LAST_MODIFIED_BY as LAST_MODIFIED_BY, entity.PATH as PROJECT_PATH
						from "${ Views.calculation_version_with_privileges }" as calcV 
						inner join "${ Tables.calculation }" as calc on calc.CALCULATION_ID = calcV.CALCULATION_ID 
						inner join "${ Tables.project }"  as prj on prj.PROJECT_ID = calc.PROJECT_ID 
						inner join "${ Views.entity_relation }" as entity 
							ON entity.QUERY_NODE = prj.ENTITY_ID	
						left outer join "${ Tables.customer }" as cust on cust.CUSTOMER_ID = calcV.CUSTOMER_ID 
						left outer join "${ Views.calculation_version_with_privileges }" as base_version on base_version.CALCULATION_VERSION_ID = calcV.BASE_VERSION_ID 
						inner join 
			 				( select TOTAL_COST, TOTAL_QUANTITY, TOTAL_QUANTITY_UOM_ID, CALCULATION_VERSION_ID, CREATED_ON, CREATED_BY 
			 						from "${ Tables.item }" where PARENT_ITEM_ID is null ) as itm 
							on itm.CALCULATION_VERSION_ID = calcV.CALCULATION_VERSION_ID  
						where ( calcV.CALCULATION_VERSION_NAME LIKE_REGEXPR ? FLAG 'i' 
								or calcV.CALCULATION_VERSION_ID LIKE_REGEXPR ? FLAG 'i' 
								or calcV.LAST_MODIFIED_BY LIKE_REGEXPR ? FLAG 'i'
								or calcV.LAST_MODIFIED_ON LIKE_REGEXPR ? FLAG 'i' 
								or calcV.STATUS_ID LIKE_REGEXPR ? FLAG 'i'
								or cust.CUSTOMER_NAME LIKE_REGEXPR ? FLAG 'i' )
							and calcV.USER_ID = ? 
							and calcV.CALCULATION_VERSION_TYPE in (1, 2, 4, 8, 16)		-- deliver: base versions (1), variant base (4) and version generated from variant (8)
					union all 
					-- select projects
						select prj.PROJECT_ID as PROJECT_ID, prj.PROJECT_NAME as PROJECT_NAME, null as STATUS_ID, null as CALCULATION_ID, null as CALCULATION_NAME, 
							null as CALCULATION_VERSION_ID , null as CALCULATION_VERSION_NAME, 
							'${ GlobalSearchTypeValues.Project }' as ENTITY_TYPE,  prj.PROJECT_NAME as ENTITY_NAME, 
							prj.PROJECT_ID as ENTITY_ID, NULL as BASE_VERSION_ID, NULL as BASE_VERSION_NAME, NULL as CALCULATION_VERSION_TYPE, cust.CUSTOMER_NAME as CUSTOMER_NAME, prj.CUSTOMER_ID as CUSTOMER_ID, 
							null as TOTAL_COST, null as TOTAL_COST_UOM_ID, 
							null as TOTAL_QUANTITY, null as TOTAL_QUANTITY_UOM_ID, prj.CREATED_ON as CREATED_ON, prj.CREATED_BY as CREATED_BY, 
							prj.LAST_MODIFIED_ON as LAST_MODIFIED_ON, prj.LAST_MODIFIED_BY as LAST_MODIFIED_BY, entity.PATH  as PROJECT_PATH
						from "${ Views.project_with_privileges }" as prj 
						inner join "${ Views.entity_relation }" as entity
					       on entity.QUERY_NODE = prj.ENTITY_ID
						left outer join "${ Tables.customer }" as cust 
							on cust.CUSTOMER_ID = prj.CUSTOMER_ID 
						where ( prj.PROJECT_NAME LIKE_REGEXPR ? FLAG 'i' 
								or prj.PROJECT_ID LIKE_REGEXPR ? FLAG 'i' 
								or prj.CREATED_BY LIKE_REGEXPR ? FLAG 'i' 
								or prj.LAST_MODIFIED_BY LIKE_REGEXPR ? FLAG 'i' 
								or cust.CUSTOMER_NAME LIKE_REGEXPR ? FLAG 'i' )
							and prj.USER_ID = ?
					) as entityData
					where ${ sWhereClause } order by entityData.${ sSortedColumnId } ${ sSortedDirection }; 
			`;

            var oGlobalSearchStatement = hQueryPlc.statement(sStmt);

            let aReturnObject = await oGlobalSearchStatement.execute(iTop, sFilter, sFilter, sFilter, sFilter, sUserId, sFilter, sFilter, sFilter, sFilter, sFilter, sFilter, sUserId, sFilter, sFilter, sFilter, sFilter, sFilter, sUserId);
            return aReturnObject;
        } catch (e) {
            const sClientMsg = 'Error while executing global search statement.';
            const sServerMsg = `${ sClientMsg } Search statement: ${ oGlobalSearchStatement }. Error message: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

    };

    /**
	 * Function parse the filter selection and prepare output for sql contains function
	 *
	 * @param sFilter {string} - search string
	 * 
	 * @returns {string} prepared string for contains function
	 */
    async function getFilter(sFilter) {
        if (helpers.isNullOrUndefined(sFilter)) {
            return '';
        }

        sFilter = sFilter.replace(/\s\s+/g, ' ');

        sFilter = await helpers.replaceSpecialCharsForSQLLikeRegexpr(sFilter);

        let aSplittedFilter = sFilter.split(' ');
        let iSplittedFilterLength = aSplittedFilter.length;
        let aSplittedFilterToBeReturned = [];



        if (iSplittedFilterLength === 1) {
            aSplittedFilterToBeReturned.push(aSplittedFilter[0]);
        } else {
            _.each(aSplittedFilter, function (oSplittedFilter, iIndex) {
                var oSplittedFilterUpper = oSplittedFilter.toUpperCase();

                if (oSplittedFilterUpper === 'OR') {

                    if (iIndex + 1 !== iSplittedFilterLength) {
                        aSplittedFilterToBeReturned.push('|');
                    }
                } else if (oSplittedFilterUpper !== 'AND') {


                    if (iIndex - 1 >= 0 && aSplittedFilter[iIndex - 1].toUpperCase() === 'OR') {
                        aSplittedFilterToBeReturned.push(aSplittedFilter[iIndex]);
                    } else {
                        aSplittedFilterToBeReturned.push('(?=.*(' + aSplittedFilter[iIndex] + ').*)');
                    }
                }
            });
        }

        return aSplittedFilterToBeReturned.join('');
    }








    function getSortedDirection(sSortedDirection) {
        switch (sSortedDirection) {
        case GlobalSearchDirection[1]:
            return 'DESC';
        default:
            return 'ASC';
        }
    }








    function buildWhereClause(sType) {
        var whereClause = ' 1 = 1 ';

        switch (sType) {
        case GlobalSearchTypeValues.Calculation:
        case GlobalSearchTypeValues.CalculationVersion:
        case GlobalSearchTypeValues.Project:
            whereClause += " and entityData.ENTITY_TYPE = '" + sType + "'";
            break;
        default:
            break;
        }

        return whereClause;
    }
}

GlobalSearch.prototype = Object.create(GlobalSearch.prototype);
GlobalSearch.prototype.constructor = GlobalSearch;
export default {Helper,_,helpers,GlobalSearchDefaultValues,GlobalSearchTypeValues,GlobalSearchDirection,MessageLibrary,PlcException,Message,Code,Tables,Views,GlobalSearch};
