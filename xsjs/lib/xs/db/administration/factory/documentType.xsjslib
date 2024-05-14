var _ = $.require('lodash');
var helpers = $.require('../../../util/helpers');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function DocumentType(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    DocumentType.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var oFilters = [
            [
                'DOCUMENT_TYPE_ID',
                'plcTable.DOCUMENT_TYPE_ID'
            ],
            [
                'DOCUMENT_TYPE_DESCRIPTION',
                'plcTextTable.DOCUMENT_TYPE_DESCRIPTION'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];
        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);

            oReturnObject[BusinessObjectsEntities.DOCUMENT_TYPE_ENTITIES] = Array.slice(result.OT_DOCUMENT_TYPE);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_TYPE_TEXT_ENTITIES] = Array.slice(result.OT_DOCUMENT_TYPE_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `select
 							plcTable.DOCUMENT_TYPE_ID,
 							plcTable._SOURCE,
 							plcTextTable.DOCUMENT_TYPE_DESCRIPTION
 						from "sap.plc.db::basis.t_document_type" as plcTable
						left outer join "sap.plc.db::basis.t_document_type__text" as plcTextTable
							on  plcTable.DOCUMENT_TYPE_ID = plcTextTable.DOCUMENT_TYPE_ID
							and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }'
							and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null )
						where plcTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)
						 	and ( LOWER(plcTable.DOCUMENT_TYPE_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
						 	or LOWER(plcTextTable.DOCUMENT_TYPE_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by DOCUMENT_TYPE_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.DOCUMENT_TYPE_ENTITIES] = _.values(dbConnection.executeQuery(stmt));
        }
        return oReturnObject;
    };
}
/**
	 * Returns document type entities for dependent masterdata objects
	 * 
	 * @param   {array} aDocumentTypeIds - contains all document type ids that need to be retrieved
	 * @param   {date} masterdataTimestamp - current masterdata timestamp
     * @param   {string} sLanguage - current masterdata language
     * @param   {object} dbConnection - the db connection used
     */
async function getDocumentTypeEntities(aDocumentTypeIds, masterdataTimestamp, oProcedureParameters, dbConnection) {
    if (!helpers.isNullOrUndefined(aDocumentTypeIds) && aDocumentTypeIds.length > 0) {
        //We use filter in order to have a document type id only once in our array, and join in order to use it in SQL IN operator
        aDocumentTypeIds = aDocumentTypeIds.filter((sType, index) => aDocumentTypeIds.indexOf(sType) === index).join("','");
        const stmt = `select
 							plcTable.DOCUMENT_TYPE_ID,
 							plcTable._SOURCE,
 							plcTextTable.DOCUMENT_TYPE_DESCRIPTION
 						from "sap.plc.db::basis.t_document_type" as plcTable
						left outer join "sap.plc.db::basis.t_document_type__text" as plcTextTable
							on  plcTable.DOCUMENT_TYPE_ID = plcTextTable.DOCUMENT_TYPE_ID
							and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }'
							and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null )
						where plcTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)
               	        AND plcTable.DOCUMENT_TYPE_ID in ('${ aDocumentTypeIds }')`;
        return _.values(await bConnection.executeQuery(stmt));
    }
    return [];
}

DocumentType.prototype = Object.create(MasterDataBaseObject.prototype);
DocumentType.prototype.constructor = DocumentType;
export default {_,helpers,BusinessObjectsEntities,MasterDataBaseObject,DocumentType,getDocumentTypeEntities};
