const _ = $.require('lodash');
const BusinessObjectTypes = $.require('../../../util/constants').BusinessObjectTypes;
const BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
const MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
const MessageCode = $.require('../../../util/message').Code;

function CostCenter(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    CostCenter.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        var oFilters = [
            [
                'COST_CENTER_ID',
                'plcTable.COST_CENTER_ID'
            ],
            [
                'COST_CENTER_DESCRIPTION',
                'plcTextTable.COST_CENTER_DESCRIPTION'
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

            oReturnObject[BusinessObjectsEntities.COST_CENTER_ENTITIES] = Array.slice(result.OT_COST_CENTER);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
            oReturnObject[BusinessObjectsEntities.COST_CENTER_TEXT_ENTITIES] = Array.slice(result.OT_COST_CENTER_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `select  
							plcTable._SOURCE,
							plcTextTable.COST_CENTER_DESCRIPTION,
    	                    plcTable.COST_CENTER_ID,
    	                    plcTable.CONTROLLING_AREA_ID
						from "sap.plc.db::basis.t_cost_center" as plcTable 					
						left outer join "sap.plc.db::basis.t_cost_center__text" as plcTextTable 
							on  plcTable.COST_CENTER_ID = plcTextTable.COST_CENTER_ID 
							and plcTable.CONTROLLING_AREA_ID = plcTextTable.CONTROLLING_AREA_ID 
							and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }'  
							and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
							and ( plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null )  
						LEFT OUTER JOIN "sap.plc.db::basis.t_cost_center_ext" as plcExtTable ON
							plcTable.COST_CENTER_ID = plcExtTable.COST_CENTER_ID
							and plcTable.CONTROLLING_AREA_ID = plcExtTable.CONTROLLING_AREA_ID
			                and plcTable._VALID_FROM = plcExtTable._VALID_FROM 
						where plcTable._VALID_FROM <= '${ masterdataTimestamp }' 
							and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null ) 
							and ( LOWER(plcTable.COST_CENTER_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
							or LOWER(plcTextTable.COST_CENTER_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;
            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by plcTable.COST_CENTER_ID, plcTable.CONTROLLING_AREA_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;

            oReturnObject[BusinessObjectsEntities.COST_CENTER_ENTITIES] = _.values(await dbConnection.executeQuery(stmt));

        }

        return oReturnObject;
    };

    CostCenter.prototype.validateAfter = async function () {
        // Check if the cost center is used in the project activity price surcharges. Necessary because we resolve the CONTROLLING_AREA_ID via project, which is not possible using the general master data validation.
        let sSql = `update temp_table
						set	temp_table.ERROR_CODE = '${ MessageCode.GENERAL_VALIDATION_ERROR.code }',
						temp_table.ERROR_DETAILS = '{"validationObj": { "dependencyObjects": [{"businessObj":"'|| result.business_objects ||'"}],
							"validationInfoCode": "DEPENDENCY_ERROR"}}'
						from "sap.plc.db.administration::maintemporarytables.gtt_batch_cost_center" as temp_table,
						(select STRING_AGG( business_object, '"},{"businessObj":"') as business_objects, COST_CENTER_ID, CONTROLLING_AREA_ID, _VALID_FROM
						  from (
						  	  select '${ BusinessObjectTypes.ProjectActivityPriceSurcharges }' as business_object,  temp_table.COST_CENTER_ID,  temp_table.CONTROLLING_AREA_ID, temp_table._VALID_FROM
						        from "sap.plc.db.administration::maintemporarytables.gtt_batch_cost_center" as temp_table
								inner join "sap.plc.db::basis.t_project_activity_price_surcharges" as main_table
									on ( temp_table.COST_CENTER_ID = main_table.COST_CENTER_ID )
								inner join "sap.plc.db::basis.t_project" as project_table
									on ( project_table.PROJECT_ID = main_table.PROJECT_ID and project_table.CONTROLLING_AREA_ID = temp_table.CONTROLLING_AREA_ID  )
								and temp_table.operation in ('Delete')
								and (temp_table.error_code = '' or  temp_table.error_code is null)
						   ) group by COST_CENTER_ID, CONTROLLING_AREA_ID, _VALID_FROM
						) as result
						where  temp_table.COST_CENTER_ID = result.COST_CENTER_ID and  temp_table.CONTROLLING_AREA_ID = result.CONTROLLING_AREA_ID
						and temp_table._VALID_FROM = result._VALID_FROM
						and temp_table.operation in ('Delete')
						and (temp_table.error_code = '' or  temp_table.error_code is null)`;

        await dbConnection.executeUpdate(sSql);
    };
}

CostCenter.prototype = Object.create(MasterDataBaseObject.prototype);
CostCenter.prototype.constructor = CostCenter;
export default {_,BusinessObjectTypes,BusinessObjectsEntities,MasterDataBaseObject,MessageCode,CostCenter};
