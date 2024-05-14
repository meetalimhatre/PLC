var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function Document(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    Document.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        const oFilters = [
            [
                'DOCUMENT_ID',
                'plcTable.DOCUMENT_ID'
            ],
            [
                'DOCUMENT_TYPE_ID',
                'plcTable.DOCUMENT_TYPE_ID'
            ],
            [
                'DOCUMENT_VERSION',
                'plcTable.DOCUMENT_VERSION'
            ],
            [
                'DOCUMENT_PART',
                'plcTable.DOCUMENT_PART'
            ],
            [
                'DOCUMENT_STATUS_ID',
                'plcTable.DOCUMENT_STATUS_ID'
            ]
        ];
        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);

            oReturnObject[BusinessObjectsEntities.DOCUMENT_ENTITIES] = Array.slice(result.OT_DOCUMENT);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_TYPE_ENTITIES] = Array.slice(result.OT_DOCUMENT_TYPE);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_STATUS_ENTITIES] = Array.slice(result.OT_DOCUMENT_STATUS);
            oReturnObject[BusinessObjectsEntities.DESIGN_OFFICE_ENTITIES] = Array.slice(result.OT_DESIGN_OFFICE);
            oReturnObject[BusinessObjectsEntities.DOCUMENT_TEXT_ENTITIES] = Array.slice(result.OT_DOCUMENT_TEXT);
        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();

            let sStmt = ` select
    	                    plcTable.DOCUMENT_TYPE_ID,
 							plcTable.DOCUMENT_ID,
 							plcTable.DOCUMENT_VERSION,
 							plcTable.DOCUMENT_PART,
 							plcTable.IS_CREATED_VIA_CAD_INTEGRATION,
 							plcTable.DOCUMENT_STATUS_ID,
 							plcTable.DESIGN_OFFICE_ID,
 							plcTable._VALID_FROM,
 							plcTable._VALID_TO,
 							plcTable._SOURCE,
 							plcTable._CREATED_BY,
 							plcTextTable.DOCUMENT_DESCRIPTION
 								from "sap.plc.db::basis.t_document" as plcTable
 						inner join
							(   select A._VALID_FROM, A.DOCUMENT_ID, A.DOCUMENT_TYPE_ID, A.DOCUMENT_VERSION, A.DOCUMENT_PART, A._CREATED_BY 
								from "sap.plc.db::basis.t_document" AS A 
									inner join 
									( select MIN(_VALID_FROM) AS _VALID_FROM, DOCUMENT_ID, DOCUMENT_TYPE_ID, DOCUMENT_VERSION, DOCUMENT_PART
										from "sap.plc.db::basis.t_document" 
										group by DOCUMENT_ID, DOCUMENT_TYPE_ID, DOCUMENT_VERSION, DOCUMENT_PART
									) AS B
									ON A._VALID_FROM = B._VALID_FROM AND A.DOCUMENT_ID = B.DOCUMENT_ID AND A.DOCUMENT_TYPE_ID = B.DOCUMENT_TYPE_ID
									AND A.DOCUMENT_VERSION = B.DOCUMENT_VERSION AND A.DOCUMENT_PART = B.DOCUMENT_PART
							) AS minValues
							on plcTable.DOCUMENT_ID = minValues.DOCUMENT_ID and plcTable.DOCUMENT_TYPE_ID = minValues.DOCUMENT_TYPE_ID and
							plcTable.DOCUMENT_VERSION = minValues.DOCUMENT_VERSION and plcTable.DOCUMENT_PART = minValues.DOCUMENT_PART
						left outer join "sap.plc.db::basis.t_document__text" as plcTextTable
							on  plcTable.DOCUMENT_ID = plcTextTable.DOCUMENT_ID and plcTable.DOCUMENT_TYPE_ID = plcTextTable.DOCUMENT_TYPE_ID
							and plcTable.DOCUMENT_VERSION = plcTextTable.DOCUMENT_VERSION and plcTable.DOCUMENT_PART = plcTextTable.DOCUMENT_PART
							and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }'
							and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null )
						where plcTable._VALID_FROM <= '${ masterdataTimestamp }'
							and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null)
						 	and ( LOWER(plcTable.DOCUMENT_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
						 	or LOWER(plcTextTable.DOCUMENT_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%'))`;


            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                sStmt += ` and ${ filter }`;
            }
            sStmt += ` order by plcTable.DOCUMENT_TYPE_ID, plcTable.DOCUMENT_ID, plcTable.DOCUMENT_VERSION, plcTable.DOCUMENT_PART`;
            sStmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.DOCUMENT_ENTITIES] = _.values(await dbConnection.executeQuery(sStmt));
        }
        return oReturnObject;
    };
}

Document.prototype = Object.create(MasterDataBaseObject.prototype);
Document.prototype.constructor = Document;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,Document};
