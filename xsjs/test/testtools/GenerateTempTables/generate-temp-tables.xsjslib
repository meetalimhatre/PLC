const hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var _ = $.require("lodash");
var MasterdataEntities = $.require("../../../lib/xs/util/masterdataResources").MasterdataResource;
var BusinessObjectsEntities = $.require("../../../lib/xs/util/masterdataResources").BusinessObjectsEntities;
var MessageLibrary = $.require("../../../lib/xs/util/message");
var PlcSchema = $.require("../../../lib/xs/db/connection/connection").getContainerSchema($);

/**
 * Helper script in order to generate the temporary tables; It will be changed and used in the future for custom fields
 * This script generates a zip file that containes all the types for temporary tables. 
 * http://dxx....:8000//sap/plc_test/testtools/GenerateTempTables/generatetemptables.xsjs
 * MK: internal URLs/information are not allowed
 **/

function generate(oRequest, oResponse, sSessionId, sUserId) {
	
	var oHq = hQueryLib.hQuery($.hdb.getConnection()).setSchema("SYS");
	var zip = new $.util.Zip(); 
	var aTextTables = [];
	var aTables = [];
	var sFileTemplate;
	
	switch (oRequest.method) {
		case $.net.http.GET:
			_.forEach(MasterdataEntities, function(content, key) {
	            if(key != "Account_Group" && key != "Component_Split" && key != "Costing_Sheet" && key != "Costing_Sheet_Row"){
	            	aTables.push("'" + content.dbobjects.plcTable + "'");  
	            	aTextTables.push("'" + content.dbobjects.plcTextTable + "'");     
	            }
			});
	}
    
    var sStatement = 'select TABLE_NAME,COLUMN_NAME,DATA_TYPE_NAME,LENGTH,SCALE,IS_NULLABLE,DEFAULT_VALUE' 
    	+ ' from "SYS"."TABLE_COLUMNS" WHERE SCHEMA_NAME = CURRENT_SCHEMA AND TABLE_NAME MEMBER OF ARRAY(' 
    	+ aTextTables.join(",") + ')';
    var oQuery = oHq.statement(sStatement);
    var resultQuery = oQuery.execute();
    
    
    // generate temporary text tables
    var oGroupedResults = _.groupBy(resultQuery, function(oObj) {
    	_.each(MasterdataEntities, function(value, key){ 
    		if(value.dbobjects.plcTextTable === oObj.TABLE_NAME) oObj.newKey = key;
    	});
    	return oObj.newKey;
    });
    
    var newFile = "namespace sap.plc.db.administration;\r\n\r\n";
    newFile = newFile + "@Schema: '" + PlcSchema + "'\r\n\r\n";
    newFile = newFile + "context texttemporarytables{\r\n";
    _.forEach(oGroupedResults, function(aColumns, key) {
        newFile = newFile + "\t" + "entity gtt_batch_" + key.toLowerCase() + "__text{\r\n";
        _.each(aColumns, function(oColumn) {
            newFile = newFile + "\t\t" + oColumn.COLUMN_NAME + ":";
            newFile = newFile + determineType(oColumn);
            newFile = newFile + ";\r\n";
        });
        newFile = newFile + "\t\tOPERATION: NVARCHAR(10);\r\n";
        newFile = newFile + "\t\tERROR_CODE: NVARCHAR(100);\r\n";
        newFile = newFile + "\t\tERROR_DETAILS: NVARCHAR(1000);\r\n";
        newFile = newFile + "\t\tORIGINAL_ENTRY: NVARCHAR(1000);\r\n";
        newFile = newFile + "\t};\r\n";
    });
    newFile = newFile + "};"
    zip["texttemporarytables.hdbdd"] = newFile;
    
    
    // generate temporary main tables
    sStatement = 'select TABLE_NAME,COLUMN_NAME,DATA_TYPE_NAME,LENGTH,SCALE,IS_NULLABLE,DEFAULT_VALUE' 
    	+ ' from "SYS"."TABLE_COLUMNS" WHERE SCHEMA_NAME = CURRENT_SCHEMA AND TABLE_NAME MEMBER OF ARRAY(' 
    	+ aTables.join(",") + ')';
    oQuery = oHq.statement(sStatement);
    resultQuery = oQuery.execute();
    
    oGroupedResults = _.groupBy(resultQuery, function(oObj) {
    	_.each(MasterdataEntities, function(value, key){ 
    		if(value.dbobjects.plcTable === oObj.TABLE_NAME) oObj.newKey = key;
    	});
        return oObj.newKey; 
     });
    var sFileName;
    _.forEach(oGroupedResults, function(aColumns, key) {
    	newFile = "CREATE GLOBAL TEMPORARY TABLE \"" + PlcSchema + "\".\"sap.plc.db.administration::maintemporarytables.gtt_batch_";
    	newFile = newFile + key.toLowerCase() + "\" (\r\n";
    	_.each(aColumns, function(oColumn, idx) {
            newFile = newFile + "\t\"" + oColumn.COLUMN_NAME + "\"";
            newFile = newFile + determineHanaType(oColumn);
            newFile = newFile + ",\r\n";
        });
    	newFile = newFile + "\t\"OPERATION\" NVARCHAR(10),\r\n";
    	newFile = newFile + "\t\"ERROR_CODE\" NVARCHAR(100),\r\n";
    	newFile = newFile + "\t\"ERROR_DETAILS\" NVARCHAR(1000),\r\n";
    	newFile = newFile + "\t\"ORIGINAL_ENTRY\" NVARCHAR(1000)\r\n";
        newFile = newFile + ") on commit delete rows;";
        sFileName = "gtt_batch_" + key.toLowerCase() + ".table.template";
        zip["maintemporarytables/" + sFileName] = newFile;
    });
    
    // set response
    oResponse.status = $.net.http.OK;
    oResponse.contentType = "application/zip";
    oResponse.headers.set("Content-Disposition", "attachement;filename='tempTables.zip'");
    oResponse.setBody(zip.asArrayBuffer());
}

function determineType(oColumn) {
 	
    switch(oColumn.DATA_TYPE_NAME) {
        case "TINYINT":
            return " hana.TINYINT";
        case "SMALLINT":
            return " hana.SMALLINT";
        case "INT":
            break; // not implemented
        case "INTEGER":
            return " Integer";
        case "BIGINT":
            break; // not implemented
        case "DECIMAL":
            return " Decimal(" + oColumn.LENGTH + ", " + oColumn.SCALE + ")";
        case "REAL":
            break; // not implemented
        case "DOUBLE":
            break; // not implemented
        case "CHAR":
            break; // not implemented
        case "VARCHAR":
            break; // not implemented
        case "NCHAR":
            break; // not implemented
        case "NVARCHAR":
            return " String(" + oColumn.LENGTH + ")";
        case "BINARY":
            break; // not implemented
        case "VARBINARY":
            break; // not implemented
        case "DATE":
            return " LocalDate";
        case "TIME":
            return " LocalTime";
        case "TIMESTAMP":
            return " UTCTimestamp";
        case "CLOB":
             break; // not implemented
        case "NCLOB":
             break; // not implemented
        case "BLOB":
             break; // not implemented
        case "SMALLDECIMAL":
             break; // not implemented
        case "TEXT":
             break; // not implemented
        case "SHORTTEXT":
             break; // not implemented
        case "SECONDDATE":
             break; // not implemented
        case "FLOAT":
             break; // not implemented
        default:
            const developerInfo = `Invalid column type name: ${oColumn.DATA_TYPE_NAME} `;
			$.trace.error(developerInfo);
			var exceptionInfo = "Invalid data format. See log for details."
    }
    
}

function determineHanaType(oColumn) {
 	
    switch(oColumn.DATA_TYPE_NAME) {
        case "TINYINT":
            return " TINYINT";
        case "SMALLINT":
            return " SMALLINT";
        case "INT":
        case "INTEGER":
            return " INT";
        case "BIGINT":
            break; // not implemented
        case "DECIMAL":
            return " DECIMAL(" + oColumn.LENGTH + ", " + oColumn.SCALE + ")";
        case "REAL":
            break; // not implemented
        case "DOUBLE":
            break; // not implemented
        case "CHAR":
            break; // not implemented
        case "VARCHAR":
            break; // not implemented
        case "NCHAR":
            break; // not implemented
        case "NVARCHAR":
            return " NVARCHAR(" + oColumn.LENGTH + ")";
        case "BINARY":
            return " BINARY(" + oColumn.LENGTH + ")";
        case "VARBINARY":
            return " VARBINARY(" + oColumn.LENGTH + ")";
        case "DATE":
            return " DATE";
        case "TIME":
            return " TIME";
        case "TIMESTAMP":
            return " TIMESTAMP";
        case "CLOB":
             break; // not implemented
        case "NCLOB":
             break; // not implemented
        case "BLOB":
             break; // not implemented
        case "SMALLDECIMAL":
             break; // not implemented
        case "TEXT":
             break; // not implemented
        case "SHORTTEXT":
             break; // not implemented
        case "SECONDDATE":
             break; // not implemented
        case "FLOAT":
             break; // not implemented
        default:
            const developerInfo = `Invalid column type name: ${oColumn.DATA_TYPE_NAME} `;
			$.trace.error(developerInfo);
			var exceptionInfo = "Invalid data format. See log for details."
				
    }
}