var _ = $.require('lodash');
var helpers = $.require('../../../util/helpers');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
var ConstrollingArea = $.import('xs.db.administration.factory', 'controllingArea');

function CompanyCode(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    CompanyCode.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var oFilters = [
            [
                'COMPANY_CODE_CURRENCY_ID',
                'plcTable.COMPANY_CODE_CURRENCY_ID'
            ],
            [
                'COMPANY_CODE_DESCRIPTION',
                'plcTextTable.COMPANY_CODE_DESCRIPTION'
            ],
            [
                'COMPANY_CODE_ID',
                'plcTable.COMPANY_CODE_ID'
            ],
            [
                'CONTROLLING_AREA_ID',
                'plcTable.CONTROLLING_AREA_ID'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];
        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(result.OT_COMPANY_CODE);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
            oReturnObject[BusinessObjectsEntities.COMPANY_CODE_TEXT_ENTITIES] = Array.slice(result.OT_COMPANY_CODE_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let sLanguage = oProcedureParameters.sLanguage;
            let stmt = `
    	     select  
	 				 plcTable.COMPANY_CODE_ID, 
	 				 plcTable.CONTROLLING_AREA_ID, 
	 				 plcTable.COMPANY_CODE_CURRENCY_ID,
	 				 plcTable._SOURCE,
	 				 plcTextTable.COMPANY_CODE_DESCRIPTION 
 				 from "sap.plc.db::basis.t_company_code" as plcTable	
 				 left outer join "sap.plc.db::basis.t_company_code__text" as plcTextTable 
 				 	on  plcTable.COMPANY_CODE_ID = plcTextTable.COMPANY_CODE_ID 
 				 	and plcTextTable.LANGUAGE = '${ sLanguage }'  
 				 	and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
 				 	and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)  
 				 where plcTable._VALID_FROM <= '${ masterdataTimestamp }' and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)
 				 	and ( LOWER(plcTable.COMPANY_CODE_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
					or LOWER(plcTextTable.COMPANY_CODE_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by plcTable.COMPANY_CODE_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            const rsCompanyCodes = await dbConnection.executeQuery(stmt);
            oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = _.values(rsCompanyCodes);


            const dependentBusinessObject = helpers.transposeResultArray(rsCompanyCodes, true);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = await ConstrollingArea.getControllingAreaEntities(dependentBusinessObject.CONTROLLING_AREA_ID, masterdataTimestamp, sLanguage, dbConnection);
        }

        return oReturnObject;
    };
}
/**
    * This function returns the comapany code ids of the company codes from a given controlling area
    * 
	* @param   {string} sControllingAreaId - the id of the controlling area for which the company codes are needed
	* @param   {date} masterdataTimestamp - current masterdata timestamp
    * @param   {object} dbConnection - the db connection used
*/
async function getCompanyCodeEntitiesForControllingArea(sControllingAreaId, masterdataTimestamp, dbConnection) {
    if (!helpers.isNullOrUndefined(sControllingAreaId)) {
        let stmt = `select  
	 				 plcTable.COMPANY_CODE_ID
 				 from "sap.plc.db::basis.t_company_code" as plcTable 
 				 where plcTable._VALID_FROM <= '${ masterdataTimestamp }' and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)
 				 	and  ( plcTable.CONTROLLING_AREA_ID = '${ sControllingAreaId }' )`;

        const rsCompanyCodesIds = _.values(dbConnection.executeQuery(stmt));
        return (helpers.transposeResultArrayOfObjects(rsCompanyCodesIds, false)).COMPANY_CODE_ID;
    }
    return [];
}
/**
	 * Returns company codes entities for dependent masterdata objects
	 * 
	 * @param   {array} aCompanyCodesIds - contains all company codes ids that need to be retrieved
	 * @param   {date} masterdataTimestamp - current masterdata timestamp
     * @param   {string} sLanguage - current masterdata language
     * @param   {object} dbConnection - the db connection used
     */
async function getCompanyCodeEntities(aCompanyCodesIds, masterdataTimestamp, sLanguage, dbConnection) {
    if (!helpers.isNullOrUndefined(aCompanyCodesIds) && aCompanyCodesIds.length > 0) {
        //We use filter in order to have a company codes ids only once in our array, and join in order to use it in SQL IN operator
        aCompanyCodesIds = aCompanyCodesIds.filter((sCode, index) => aCompanyCodesIds.indexOf(sCode) === index).join("','");
        const stmt = `select  
	 				 plcTable.COMPANY_CODE_ID, 
	 				 plcTable.CONTROLLING_AREA_ID, 
	 				 plcTable.COMPANY_CODE_CURRENCY_ID, 
	 				 plcTable._SOURCE,
	 				 plcTextTable.COMPANY_CODE_DESCRIPTION 
 				 from "sap.plc.db::basis.t_company_code" as plcTable 
 				 left outer join "sap.plc.db::basis.t_company_code__text" as plcTextTable 
 				 	on  plcTable.COMPANY_CODE_ID = plcTextTable.COMPANY_CODE_ID 
 				 	and plcTextTable.LANGUAGE = '${ sLanguage }'  
 				 	and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
 				 	and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)  
 				 where plcTable._VALID_FROM <= '${ masterdataTimestamp }' and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)
 				 	and  ( plcTable.COMPANY_CODE_ID in ('${ aCompanyCodesIds }') )`;
        return _.values(await dbConnection.executeQuery(stmt));
    }
    return [];
}



CompanyCode.prototype = Object.create(MasterDataBaseObject.prototype);
CompanyCode.prototype.constructor = CompanyCode;
export default {_,helpers,BusinessObjectsEntities,MasterDataBaseObject,ConstrollingArea,CompanyCode,getCompanyCodeEntitiesForControllingArea,getCompanyCodeEntities};
