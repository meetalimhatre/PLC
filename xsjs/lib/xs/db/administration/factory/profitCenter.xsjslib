var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function ProfitCenter(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    ProfitCenter.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        var oFilters = [
            [
                'PROFIT_CENTER_ID',
                'plcTable.PROFIT_CENTER_ID'
            ],
            [
                'CONTROLLING_AREA_ID',
                'plcTable.CONTROLLING_AREA_ID'
            ],
            [
                'PROFIT_CENTER_DESCRIPTION',
                'plcTextTable.PROFIT_CENTER_DESCRIPTION'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];

        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.PROFIT_CENTER_ENTITIES] = Array.slice(result.OT_PROFIT_CENTER);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
            oReturnObject[BusinessObjectsEntities.PROFIT_CENTER_TEXT_ENTITIES] = Array.slice(result.OT_PROFIT_CENTER_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `	select
 							plcTable.PROFIT_CENTER_ID,
 							plcTable.CONTROLLING_AREA_ID,
 							plcTable._SOURCE,
 							plcTextTable.PROFIT_CENTER_DESCRIPTION
 						from "sap.plc.db::basis.t_profit_center" as plcTable
 						left outer join "sap.plc.db::basis.t_profit_center__text" as plcTextTable
 							on plcTable.PROFIT_CENTER_ID = plcTextTable.PROFIT_CENTER_ID
 							and plcTable.CONTROLLING_AREA_ID = plcTextTable.CONTROLLING_AREA_ID
 							and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }'
 							and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }'
 							and ( plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null )
 						where plcTable._VALID_FROM <= '${ masterdataTimestamp }'
 							and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null )
 							and ( LOWER(plcTable.PROFIT_CENTER_ID) LIKE LOWER ('${ oProcedureParameters.sAutocompleteText }%')
 							or LOWER(plcTextTable.PROFIT_CENTER_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by PROFIT_CENTER_ID, CONTROLLING_AREA_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.PROFIT_CENTER_ENTITIES] = _.values(await dbConnection.executeQuery(stmt));
        }

        return oReturnObject;
    };
}

ProfitCenter.prototype = Object.create(MasterDataBaseObject.prototype);
ProfitCenter.prototype.constructor = ProfitCenter;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,ProfitCenter};
