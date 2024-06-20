var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function BusinessArea(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    BusinessArea.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        var oFilters = [
            [
                'BUSINESS_AREA_ID',
                'plcTable.BUSINESS_AREA_ID'
            ],
            [
                'BUSINESS_AREA_DESCRIPTION',
                'plcTextTable.BUSINESS_AREA_DESCRIPTION'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];
        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.BUSINESS_AREA_ENTITIES] = Array.slice(result.OT_BUSINESS_AREA);
            oReturnObject[BusinessObjectsEntities.BUSINESS_AREA_TEXT_ENTITIES] = Array.slice(result.OT_BUSINESS_AREA_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            /* We use select * to take all the fields from the ext table, since we don't want
	        * to have to select the cf from metadata, or to have a generated template
	        * because this will reduce the performance.
	        * The stringify() keeps only the last material_id, this is why we select the id from
	        * the main table last.
	        * This is a temporary solution, since the services will be re-implemented.*/
            let stmt = `select  
		                    plcTable.BUSINESS_AREA_ID,
		                    plcTable._SOURCE,
		                    plcTextTable.BUSINESS_AREA_DESCRIPTION 
	                    from "sap.plc.db::basis.t_business_area" as plcTable
	                    left outer join "sap.plc.db::basis.t_business_area__text" as plcTextTable 
	                        on  plcTable.BUSINESS_AREA_ID = plcTextTable.BUSINESS_AREA_ID 
	                        and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }' 
	                        and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
	                        and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)  
	                    where plcTable._VALID_FROM <= '${ masterdataTimestamp }' 
	                        and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null) 
	                        and (LOWER(plcTable.BUSINESS_AREA_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
							or LOWER(plcTextTable.BUSINESS_AREA_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);

                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by plcTable.BUSINESS_AREA_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.BUSINESS_AREA_ENTITIES] = _.values( await dbConnection.executeQuery(stmt));
        }

        return oReturnObject;
    };
}

BusinessArea.prototype = Object.create(MasterDataBaseObject.prototype);
BusinessArea.prototype.constructor = BusinessArea;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,BusinessArea};
