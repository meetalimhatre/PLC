// This script deletes the content (truncate) of all tables in SAP_PLC_REPL schema

var connection = $.hdb.getConnection();
var tables = connection.executeQuery('select table_name from "SYS"."TABLES" where schema_name = \'SAP_PLC_REPL\'');

for (var i=0; i<tables.length; i++) {
	connection.executeUpdate('truncate table "SAP_PLC_REPL"."' + tables[i].TABLE_NAME + '"');
}
connection.close();

var result = "<html><head><title>Truncate SAP_PLC_REPL</title></head><body>All tables in SAP_PLC_REPL have been successfully truncated.</body></html>";
$.response.contentType = "text/html";

$.response.setBody(result);
