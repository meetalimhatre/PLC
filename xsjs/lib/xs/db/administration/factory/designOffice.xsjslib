var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function DesignOffice(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    DesignOffice.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var oFilters = [
            [
                'DESIGN_OFFICE_ID',
                'plcTable.DESIGN_OFFICE_ID'
            ],
            [
                'DESIGN_OFFICE_DESCRIPTION',
                'plcTextTable.DESIGN_OFFICE_DESCRIPTION'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];
        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.DESIGN_OFFICE_ENTITIES] = Array.slice(result.OT_DESIGN_OFFICE);
            oReturnObject[BusinessObjectsEntities.DESIGN_OFFICE_TEXT_ENTITIES] = Array.slice(result.OT_DESIGN_OFFICE_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `select
 							plcTable.DESIGN_OFFICE_ID,
 							plcTable._SOURCE,
 							plcTextTable.DESIGN_OFFICE_DESCRIPTION
 						from "sap.plc.db::basis.t_design_office" as plcTable
						left outer join "sap.plc.db::basis.t_design_office__text" as plcTextTable
							on  plcTable.DESIGN_OFFICE_ID = plcTextTable.DESIGN_OFFICE_ID
							and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }'
							and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null )
						where plcTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)
						 	and (( LOWER(plcTable.DESIGN_OFFICE_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')) OR
						 	(LOWER(plcTextTable.DESIGN_OFFICE_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')))`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);

                }
                stmt += ` and ${ filter }`;
            }

            stmt += ` order by DESIGN_OFFICE_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.DESIGN_OFFICE_ENTITIES] = _.values(await dbConnection.executeQuery(stmt));
        }

        return oReturnObject;
    };
}

DesignOffice.prototype = Object.create(MasterDataBaseObject.prototype);
DesignOffice.prototype.constructor = DesignOffice;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,DesignOffice};
