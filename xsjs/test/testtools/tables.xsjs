const PlcSchema = $.require("../../lib/xs/db/connection/connection").getContainerSchema($);

function getTables(schema){
    var s = "";
    var connection = $.hdb.getConnection();
    var query = 'select table_name from sys.tables where schema_name=?';

    var rs = connection.executeQuery(query, schema);
    var tableName;
    for (var row in rs) {
        tableName = rs[row]["TABLE_NAME"];
        s += '<a href="table_details.xsjs?schema=' + schema + '&table=' + tableName + '">'+tableName+'</a><br/>';
    }
    connection.close();

    return s;
}

var schema = $.request.parameters.get("schema") || PlcSchema;

var result = "<html><head><title>HANA Template Generator</title></head><body><h1>Select table in schema "+schema+"</h1></body></html>";
result += getTables(schema);

$.response.setBody(result);
$.response.contentType = "text/html";
