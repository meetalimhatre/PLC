var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function Material(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    Material.prototype.getDataUsingSqlProcedure = function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var oFilters = [
            [
                'MATERIAL_ID',
                'plcTable.MATERIAL_ID'
            ],
            [
                'MATERIAL_DESCRIPTION',
                'plcTextTable.MATERIAL_DESCRIPTION'
            ],
            [
                'MATERIAL_TYPE_ID',
                'plcTable.MATERIAL_TYPE_ID'
            ],
            [
                'MATERIAL_GROUP_ID',
                'plcTable.MATERIAL_GROUP_ID'
            ],
            [
                'BASE_UOM_ID',
                'plcTable.BASE_UOM_ID'
            ],
            [
                'IS_CREATED_VIA_CAD_INTEGRATION',
                'plcTable.IS_CREATED_VIA_CAD_INTEGRATION'
            ],
            [
                'IS_PHANTOM_MATERIAL',
                'plcTable.IS_PHANTOM_MATERIAL'
            ],
            [
                'IS_CONFIGURABLE_MATERIAL',
                'plcTable.IS_CONFIGURABLE_MATERIAL'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];
        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.MATERIAL_ENTITIES] = Array.slice(result.OT_MATERIAL);
            oReturnObject[BusinessObjectsEntities.MATERIAL_GROUP_ENTITIES] = Array.slice(result.OT_MATERIAL_GROUP);
            oReturnObject[BusinessObjectsEntities.MATERIAL_TYPE_ENTITIES] = Array.slice(result.OT_MATERIAL_TYPE);
            oReturnObject[BusinessObjectsEntities.MATERIAL_TEXT_ENTITIES] = Array.slice(result.OT_MATERIAL_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            /* We use select * to take all the fields from the ext table, since we don't want
	        * to have to select the cf from metadata, or to have a generated template
	        * because this will reduce the performance.
	        * The stringify() keeps only the last material_id, this is why we select the id from
	        * the main table last.
	        * This is a temporary solution, since the services will be re-implemented.*/
            let stmt = `select
				plcTable.BASE_UOM_ID,
				plcTable.MATERIAL_GROUP_ID,
				plcTable.MATERIAL_TYPE_ID,
				plcTable.IS_CREATED_VIA_CAD_INTEGRATION,
				plcTable.IS_PHANTOM_MATERIAL,
				plcTable.IS_CONFIGURABLE_MATERIAL,
				plcTable._SOURCE,
    			plcTextTable.MATERIAL_DESCRIPTION,  
   				plcTable.MATERIAL_ID
            	 from "sap.plc.db::basis.t_material" as plcTable
            left outer join "sap.plc.db::basis.t_material__text" as plcTextTable 
                on  plcTable.MATERIAL_ID = plcTextTable.MATERIAL_ID 
                and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }' 
                and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
                and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)
			LEFT OUTER JOIN "sap.plc.db::basis.t_material_ext" as plcExtTable ON
				plcTable.MATERIAL_ID = plcExtTable.MATERIAL_ID 
                and plcTable._VALID_FROM = plcExtTable._VALID_FROM 
            where plcTable._VALID_FROM <= '${ masterdataTimestamp }' 
                and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null) 
                and (LOWER(plcTable.MATERIAL_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
				or LOWER(plcTextTable.MATERIAL_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);

                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by plcTable.MATERIAL_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.MATERIAL_ENTITIES] = _.values(dbConnection.executeQuery(stmt));
        }

        return oReturnObject;
    };
}

Material.prototype = await Object.create(MasterDataBaseObject.prototype);
Material.prototype.constructor = Material;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,Material};
