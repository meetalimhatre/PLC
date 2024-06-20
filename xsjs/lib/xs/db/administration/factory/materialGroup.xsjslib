var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function MaterialGroup(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    MaterialGroup.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};


        var oFilters = [
            [
                'MATERIAL_GROUP_ID',
                'plcTable.MATERIAL_GROUP_ID'
            ],
            [
                'MATERIAL_GROUP_DESCRIPTION',
                'plcTextTable.MATERIAL_GROUP_DESCRIPTION'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];

        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);

            oReturnObject[BusinessObjectsEntities.MATERIAL_GROUP_ENTITIES] = Array.slice(result.OT_MATERIAL_GROUP);
            oReturnObject[BusinessObjectsEntities.MATERIAL_GROUP_TEXT_ENTITIES] = Array.slice(result.OT_MATERIAL_GROUP_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `select  
		                    plcTable.MATERIAL_GROUP_ID, 
		                    plcTable._SOURCE,
		                    plcTextTable.MATERIAL_GROUP_DESCRIPTION 
	                    from "sap.plc.db::basis.t_material_group" as plcTable 
	                    left outer join "sap.plc.db::basis.t_material_group__text" as plcTextTable 
	                        on  plcTable.MATERIAL_GROUP_ID = plcTextTable.MATERIAL_GROUP_ID 
	                        and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }' 
	                        and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
	                        and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)  
	                    where plcTable._VALID_FROM <= '${ masterdataTimestamp }' 
	                        and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null) 
	                        and (LOWER(plcTable.MATERIAL_GROUP_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
							or LOWER(plcTextTable.MATERIAL_GROUP_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by MATERIAL_GROUP_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.MATERIAL_GROUP_ENTITIES] = _.values( await dbConnection.executeQuery(stmt));
        }

        return oReturnObject;
    };
}

MaterialGroup.prototype = Object.create(MasterDataBaseObject.prototype);
MaterialGroup.prototype.constructor = MaterialGroup;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,MaterialGroup};
