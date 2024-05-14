var _ = $.require('lodash');
var helpers = $.require('../../../util/helpers');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
var DocumentType = $.import('xs.db.administration.factory', 'documentType');

function DocumentStatus(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    DocumentStatus.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        var oFilters = [
            [
                'DOCUMENT_TYPE_ID',
                'plcTable.DOCUMENT_TYPE_ID'
            ],
            [
                'DOCUMENT_STATUS_DESCRIPTION',
                'plcTextTable.DOCUMENT_STATUS_DESCRIPTION'
            ],
            [
                'DOCUMENT_STATUS_ID',
                'plcTable.DOCUMENT_STATUS_ID'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];

        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_STATUS_ENTITIES] = Array.slice(result.OT_DOCUMENT_STATUS);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_TYPE_ENTITIES] = Array.slice(result.OT_DOCUMENT_TYPES);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_STATUS_TEXT_ENTITIES] = Array.slice(result.OT_DOCUMENT_STATUS_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `select
 							plcTable.DOCUMENT_TYPE_ID,
 							plcTable.DOCUMENT_STATUS_ID,
 							plcTable._SOURCE,
 							plcTextTable.DOCUMENT_STATUS_DESCRIPTION
 						from "sap.plc.db::basis.t_document_status" as plcTable
						left outer join "sap.plc.db::basis.t_document_status__text" as plcTextTable
							on  plcTable.DOCUMENT_STATUS_ID = plcTextTable.DOCUMENT_STATUS_ID
							and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }'
							and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null )
						where plcTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)
						 	and ( LOWER(plcTable.DOCUMENT_STATUS_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
						 	or LOWER(plcTextTable.DOCUMENT_STATUS_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }

            stmt += ` order by plcTable.DOCUMENT_TYPE_ID, plcTable.DOCUMENT_STATUS_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            const rsDocumentStatusEntities = dbConnection.executeQuery(stmt);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_STATUS_ENTITIES] = _.values(rsDocumentStatusEntities);

            const dependentBusinessObject = helpers.transposeResultArray(rsDocumentStatusEntities, true);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_TYPE_ENTITIES] = await DocumentType.getDocumentTypeEntities(dependentBusinessObject.DOCUMENT_TYPE_ID, masterdataTimestamp, oProcedureParameters, dbConnection);
        }

        return oReturnObject;
    };
}

DocumentStatus.prototype = Object.create(MasterDataBaseObject.prototype);
DocumentStatus.prototype.constructor = DocumentStatus;
export default {_,helpers,BusinessObjectsEntities,MasterDataBaseObject,DocumentType,DocumentStatus};
