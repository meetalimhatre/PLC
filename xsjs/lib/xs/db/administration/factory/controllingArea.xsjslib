var _ = $.require('lodash');
var helpers = $.require('../../../util/helpers');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function ControllingArea(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    ControllingArea.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        var oFilters = [
            [
                'CONTROLLING_AREA_ID',
                'plcTable.CONTROLLING_AREA_ID'
            ],
            [
                'CONTROLLING_AREA_CURRENCY_ID',
                'plcTable.CONTROLLING_AREA_CURRENCY_ID'
            ],
            [
                'CONTROLLING_AREA_DESCRIPTION',
                'plcTextTable.CONTROLLING_AREA_DESCRIPTION'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];

        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);

            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_TEXT_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA_TEXT);

        } else {

            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `select  
			                   plcTable.CONTROLLING_AREA_ID,
			                   plcTable.CONTROLLING_AREA_CURRENCY_ID,
			                   plcTable._SOURCE,
			                   plcTextTable.CONTROLLING_AREA_DESCRIPTION 
		                   from "sap.plc.db::basis.t_controlling_area" as plcTable 
		                   left outer join "sap.plc.db::basis.t_controlling_area__text" as plcTextTable 
		                   	    on  plcTable.CONTROLLING_AREA_ID = plcTextTable.CONTROLLING_AREA_ID 
		                        and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }' 
		                        and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }'  
		                        and (plcTextTable._VALID_TO > '${ masterdataTimestamp }'  or plcTextTable._VALID_TO is null)  
		                   where plcTable._VALID_FROM <= '${ masterdataTimestamp }'  and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null) 
		                        and ( LOWER(plcTable.CONTROLLING_AREA_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
						        or LOWER(plcTextTable.CONTROLLING_AREA_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by CONTROLLING_AREA_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = _.values(await dbConnection.executeQuery(stmt));
        }
        return oReturnObject;
    };
}

/**
	 * Returns controlling area entities for dependent masterdata objects
	 * 
	 * @param   {array} aControllingAreaIds - contains all controlling area ids that need to be retrieved
	 * @param   {date} masterdataTimestamp - current masterdata timestamp
     * @param   {string} sLanguage - current masterdata language
     * @param   {object} dbConnection - the db connection used
     */
async function getControllingAreaEntities(aControllingAreaIds, masterdataTimestamp, sLanguage, dbConnection) {
    if (!helpers.isNullOrUndefined(aControllingAreaIds) && aControllingAreaIds.length > 0) {
        //We use filter in order to have a controlling area id only once in our array, and join in order to use it in SQL IN operator
        aControllingAreaIds = aControllingAreaIds.filter((sArea, index) => aControllingAreaIds.indexOf(sArea) === index).join("','");
        const stmt = `select 
                plcTable.CONTROLLING_AREA_ID,
                   plcTable.CONTROLLING_AREA_CURRENCY_ID,
                   plcTextTable.CONTROLLING_AREA_DESCRIPTION,
                   plcTable._SOURCE
                   from "sap.plc.db::basis.t_controlling_area" as plcTable 
               left outer join "sap.plc.db::basis.t_controlling_area__text" as plcTextTable 
                   on  plcTable.CONTROLLING_AREA_ID = plcTextTable.CONTROLLING_AREA_ID 
                   and plcTextTable.LANGUAGE = '${ sLanguage }'
                   and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
                   and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)  
               where plcTable._VALID_FROM <= '${ masterdataTimestamp }' and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)   
               	   AND plcTable.CONTROLLING_AREA_ID in ('${ aControllingAreaIds }')`;
        return _.values(await dbConnection.executeQuery(stmt));
    }
    return [];
}

ControllingArea.prototype = Object.create(MasterDataBaseObject.prototype);
ControllingArea.prototype.constructor = ControllingArea;
export default {_,helpers,BusinessObjectsEntities,MasterDataBaseObject,ControllingArea,getControllingAreaEntities};
