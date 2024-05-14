const _ = $.require('lodash');
const BusinessObjectTypes = $.require('../../../util/constants').BusinessObjectTypes;
const BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
const MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
const MessageCode = $.require('../../../util/message').Code;

function ActivityType(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    ActivityType.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        let oFilters = [
            [
                'ACTIVITY_TYPE_ID',
                'plcTable.ACTIVITY_TYPE_ID'
            ],
            [
                'CONTROLLING_AREA_ID',
                'plcTable.CONTROLLING_AREA_ID'
            ],
            [
                'ACCOUNT_ID',
                'plcTable.ACCOUNT_ID'
            ],
            [
                'ACTIVITY_TYPE_DESCRIPTION',
                'plcTextTable.ACTIVITY_TYPE_DESCRIPTION'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];

        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);

            oReturnObject[BusinessObjectsEntities.ACTIVITY_TYPE_ENTITIES] = Array.slice(result.OT_ACTIVITY_TYPE);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_ENTITIES] = Array.slice(result.OT_ACCOUNTS);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
            oReturnObject[BusinessObjectsEntities.ACTIVITY_TYPE_TEXT_ENTITIES] = Array.slice(result.OT_ACTIVITY_TYPE_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();

            let stmt = `select  
						plcTable.ACTIVITY_TYPE_ID,
						plcTable.CONTROLLING_AREA_ID,
						plcTable.ACCOUNT_ID,
						plcTable._SOURCE,
						plcTextTable.ACTIVITY_TYPE_DESCRIPTION 
					from "sap.plc.db::basis.t_activity_type" as plcTable 					
					left outer join "sap.plc.db::basis.t_activity_type__text" as plcTextTable 
						on  plcTable.ACTIVITY_TYPE_ID = plcTextTable.ACTIVITY_TYPE_ID 
						and plcTable.CONTROLLING_AREA_ID = plcTextTable.CONTROLLING_AREA_ID 
						and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }' 
						and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
						and ( plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null )  
					where plcTable._VALID_FROM <= '${ masterdataTimestamp }' 
						and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null ) 
						and ( LOWER(plcTable.ACTIVITY_TYPE_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
						or LOWER(plcTextTable.ACTIVITY_TYPE_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%'))`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by plcTable.ACTIVITY_TYPE_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.ACTIVITY_TYPE_ENTITIES] = _.values(await dbConnection.executeQuery(stmt));
        }
        return oReturnObject;
    };

    ActivityType.prototype.validateAfter = async function () {
        // Check if the cost center is used in the project activity price surcharges. Necessary because we resolve the CONTROLLING_AREA_ID via project, which is not possible using the general master data validation.
        let sSql = `update temp_table
						set	temp_table.ERROR_CODE = '${ MessageCode.GENERAL_VALIDATION_ERROR.code }',
						temp_table.ERROR_DETAILS = '{"validationObj": { "dependencyObjects": [{"businessObj":"'|| result.business_objects ||'"}],
							"validationInfoCode": "DEPENDENCY_ERROR"}}'
						from "sap.plc.db.administration::maintemporarytables.gtt_batch_activity_type" as temp_table,
						(select STRING_AGG( business_object, '"},{"businessObj":"') as business_objects, ACTIVITY_TYPE_ID, CONTROLLING_AREA_ID, _VALID_FROM
						  from (
						  	  select '${ BusinessObjectTypes.ProjectActivityPriceSurcharges }' as business_object,  temp_table.ACTIVITY_TYPE_ID,  temp_table.CONTROLLING_AREA_ID, temp_table._VALID_FROM
						        from "sap.plc.db.administration::maintemporarytables.gtt_batch_activity_type" as temp_table
								inner join "sap.plc.db::basis.t_project_activity_price_surcharges" as main_table
								on (  temp_table.ACTIVITY_TYPE_ID = main_table.ACTIVITY_TYPE_ID)
								inner join "sap.plc.db::basis.t_project" as project_table
									on ( project_table.PROJECT_ID = main_table.PROJECT_ID and project_table.CONTROLLING_AREA_ID = temp_table.CONTROLLING_AREA_ID  )
								and temp_table.operation in ('Delete')
								and (temp_table.error_code = '' or  temp_table.error_code is null)
						   ) group by ACTIVITY_TYPE_ID, CONTROLLING_AREA_ID, _VALID_FROM
						) as result
						where  temp_table.ACTIVITY_TYPE_ID = result.ACTIVITY_TYPE_ID and  temp_table.CONTROLLING_AREA_ID = result.CONTROLLING_AREA_ID
						and temp_table._VALID_FROM = result._VALID_FROM
						and temp_table.operation in ('Delete')
						and (temp_table.error_code = '' or  temp_table.error_code is null)`;

        await dbConnection.executeUpdate(sSql);
    };
}

ActivityType.prototype = Object.create(MasterDataBaseObject.prototype);
ActivityType.prototype.constructor = ActivityType;
export default {_,BusinessObjectTypes,BusinessObjectsEntities,MasterDataBaseObject,MessageCode,ActivityType};
