var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function MaterialType(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    MaterialType.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        var oFilters = [
            [
                'MATERIAL_TYPE_ID',
                'plcTable.MATERIAL_TYPE_ID'
            ],
            [
                'MATERIAL_TYPE_DESCRIPTION',
                'plcTextTable.MATERIAL_TYPE_DESCRIPTION'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];

        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.MATERIAL_TYPE_ENTITIES] = Array.slice(result.OT_MATERIAL_TYPE);
            oReturnObject[BusinessObjectsEntities.MATERIAL_TYPE_TEXT_ENTITIES] = Array.slice(result.OT_MATERIAL_TYPE_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `select  
		                    plcTable.MATERIAL_TYPE_ID,
		                    plcTable._SOURCE,
		                    plcTextTable.MATERIAL_TYPE_DESCRIPTION 
	                    from "sap.plc.db::basis.t_material_type" as plcTable
	                    left outer join "sap.plc.db::basis.t_material_type__text" as plcTextTable 
	                        on  plcTable.MATERIAL_TYPE_ID = plcTextTable.MATERIAL_TYPE_ID 
	                        and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }' 
	                        and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
	                        and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)  
	                    where plcTable._VALID_FROM <= '${ masterdataTimestamp }' 
	                        and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null) 
	                        and (LOWER(plcTable.MATERIAL_TYPE_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
							or LOWER(plcTextTable.MATERIAL_TYPE_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by MATERIAL_TYPE_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.MATERIAL_TYPE_ENTITIES] = _.values(await dbConnection.executeQuery(stmt));

        }

        return oReturnObject;
    };
}

MaterialType.prototype = Object.create(MasterDataBaseObject.prototype);
MaterialType.prototype.constructor = MaterialType;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,MaterialType};
