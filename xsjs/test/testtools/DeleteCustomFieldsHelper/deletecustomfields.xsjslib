const hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var _ = $.require("lodash");
var constants = $.require("../../../lib/xs/util/constants");
const exceptionsLib = $.require("../../../lib/xs/xslib/exceptions");
const InvalidRequestException = exceptionsLib.InvalidRequestException;
const DatabaseException = exceptionsLib.DatabaseException;
var PlcSchema = $.require("../../../lib/xs/db/connection/connection").getContainerSchema($);

function handleRequest(oRequest, oResponse, sSessionId, sUserId) {

	switch (oRequest.method) {
	case $.net.http.DEL:
		return handleDeleteRequest(oRequest, oResponse, sSessionId, sUserId);

	default:
		throw new InvalidRequestException("method not allowed", $.net.http.METHOD_NOT_ALLOWED);
	}

	function handleDeleteRequest() {

		
			// ======================================================
			// logic flow
			// ======================================================
			try {
				var hQuery = $.xs.xslib.hQuery.hQuery($.hdb.getConnection()).setSchema(PlcSchema);
				var hQueryCust = $.xs.xslib.hQuery.hQuery($.hdb.getConnection()).setSchema("SAP_PLC_CUST");
				var sResponseMessage;
				var aBodyMeta;
				
				if (oRequest.body != undefined) {
					aBodyMeta = JSON.parse(oRequest.body.asString());
		        }
				var metaExists;
				_.each(aBodyMeta, function(oMeta) {
					metaExists = checkMetaExists(oMeta, hQuery); 
					if(!metaExists) {
						try {
							removeCustom(oMeta, hQuery, hQueryCust);
						} catch(e) {
							throw new InvalidRequestException("Error during delete.");
						}
					} else {
						throw new DatabaseException("Metadata Field(s) exist also in one or more standard table(s).");
					}
				});
									
					sResponseMessage = "Custom fields removed.";
				oResponse.setBody(sResponseMessage);

			} catch (e) {
				throw new DatabaseException(e.message);
				oResponse.setBody("Operation failed \n"+e.message);
			}
		
	}
	// senseless return, however needed because JSLint does recognize the inner
	// function as potential branch :'(
	return undefined;

}

function checkMetaExists(oMeta, hQuery) {
	var sPath = oMeta.PATH;
	var sObject = oMeta.BUSINESS_OBJECT;
	var sColumn = oMeta.COLUMN_ID;
	
	var oCheckStatement = hQuery.statement('select count(*) as rowcount from "sap.plc.db::basis.t_metadata" where path = ? and business_object = ? and column_id = ?');
	var aCount = oCheckStatement.execute(sPath, sObject, sColumn);
	var iMetadata = parseInt(aCount[0].ROWCOUNT, 10);
	oCheckStatement = hQuery.statement('select count(*) as rowcount from "sap.plc.db::basis.t_metadata__text" where path = ? and column_id = ?');
	aCount = oCheckStatement.execute(sPath, sColumn);
	var iText = parseInt(aCount[0].ROWCOUNT, 10);
	oCheckStatement = hQuery.statement('select count(*) as rowcount from "sap.plc.db::basis.t_metadata_item_attributes" where path = ? and business_object = ? and column_id = ?');
	aCount = oCheckStatement.execute(sPath, sObject, sColumn);
	var iAttributes = parseInt(aCount[0].ROWCOUNT, 10);
	
	if(iMetadata != 0 && iText !=0 && iAttributes !=0) {
		return true;
	} else return false;
	
};

function getKeyColumnsForTable(sSchema, sTableName, hQuery){
	var sColumnsStmt = hQuery.statement('select column_name from "SYS"."CONSTRAINTS" where schema_name = \'' +  sSchema + '\' and table_name = \'' + sTableName + '\' and IS_PRIMARY_KEY = \'TRUE\' order by POSITION ASC');
	var aKeyTableColumns = _.map(sColumnsStmt.execute(), function(oColumnResult, iIndex) {
		return oColumnResult.COLUMN_NAME;
	});
	return aKeyTableColumns;
};

function removeCustom(oMeta, hQuery, hQueryCust) {
	var sPath = oMeta.PATH;
	var sObject = oMeta.BUSINESS_OBJECT;
	var sColumnId = oMeta.COLUMN_ID;
	// I305774: remove the white spaces from concatenated variables in order to prevent SQL injections.
	// Parametrised query is not working in some cases.
	sColumnId.replace(/\s/g, "");
	sObject.replace(/\s/g, "");
	
	var sTable = "sap.plc.db::basis.t_" + sObject.toLowerCase();
	var sTableExt = "t_" + sObject.toLowerCase() + "_ext";
	var sTableTempExt = "t_" + sObject.toLowerCase() + "_temporary_ext";

	var stmt = hQuery.statement('select count(*) as columncount from "SYS"."TABLE_COLUMNS" where schema_name = ? and table_name = ?');
	var aColumnCount = stmt.execute("SAP_PLC_CUST", sTableExt);
	var iColumnCount = parseInt(aColumnCount[0].COLUMNCOUNT, 10);
	var aKeys = getKeyColumnsForTable(PlcSchema, sTable, hQuery);
	if(iColumnCount > aKeys.length + 1) {
		//remove custom field
		stmt = hQueryCust.statement('alter table "' + sTableExt + '" drop (' + sColumnId + ')');
		stmt.execute();
		if (sObject.toLowerCase() == constants.BusinessObjectTypes.Item) {
			stmt = hQueryCust.statement('alter table "' + sTableTempExt + '" drop (' + sColumnId + ')');
			stmt.execute();
		}
	} else {
		//remove custom table
		stmt = hQueryCust.statement('drop table "' + sTableExt + '"');
		stmt.execute();
		if (sObject.toLowerCase() == constants.BusinessObjectTypes.Item) {
			stmt = hQueryCust.statement('drop table "' + sTableTempExt + '"');
			stmt.execute();
		}
	}
}