var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function Process(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    Process.prototype.getDataUsingSqlProcedure = function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var oFilters = [
            [
                'ACCOUNT_ID',
                'plcTable.ACCOUNT_ID'
            ],
            [
                'PROCESS_DESCRIPTION',
                'plcTextTable.PROCESS_DESCRIPTION'
            ],
            [
                'PROCESS_ID',
                'plcTable.PROCESS_ID'
            ],
            [
                'COMMENT',
                'plcTable.COMMENT'
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
            var result = fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.PROCESS_ENTITIES] = Array.slice(result.OT_PROCESS);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_ENTITIES] = Array.slice(result.OT_ACCOUNTS);
            oReturnObject[BusinessObjectsEntities.PROCESS_TEXT_ENTITIES] = Array.slice(result.OT_PROCESS_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `select
						plcTable.PROCESS_ID,
						plcTable.CONTROLLING_AREA_ID,
						plcTable.ACCOUNT_ID,
						plcTable.COMMENT,
						plcTable._SOURCE,
						plcTextTable.PROCESS_DESCRIPTION
					from "sap.plc.db::basis.t_process" as plcTable 
					left outer join "sap.plc.db::basis.t_process__text" as plcTextTable		
						on 	plcTable.PROCESS_ID = plcTextTable.PROCESS_ID
						and plcTable.CONTROLLING_AREA_ID = plcTextTable.CONTROLLING_AREA_ID
						and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }'
						and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }'
						and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)
					where plcTable._VALID_FROM <= '${ masterdataTimestamp }'
						and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null )
						and (LOWER(plcTable.PROCESS_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
						or LOWER(plcTextTable.PROCESS_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);

                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by plcTable.PROCESS_ID, plcTable.CONTROLLING_AREA_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.PROCESS_ENTITIES] = _.values(dbConnection.executeQuery(stmt));
        }

        return oReturnObject;
    };
}

Process.prototype = await Object.create(MasterDataBaseObject.prototype);
Process.prototype.constructor = Process;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,Process};
