var PlcSchema = $.require("../../../lib/xs/db/connection/connection").getContainerSchema($);

function getTableDetails(schema, table){
    var shortTableName = table.substring(table.lastIndexOf(".t_")+3).toUpperCase();
    var s = '<PARAM NAME="' + shortTableName + '" DIRECTION="in" TYPE="HANATABLE">\n';
    var connection = $.hdb.getConnection();
    var tableColumns = connection.executeQuery('select column_name, data_type_name, cs_data_type_name, length from sys.table_columns where schema_name=? and table_name=? order by position', schema, table);

    for (var i=0; i<tableColumns.length; i++) {
        s += '  <COLUMN NAME="' + tableColumns[i].COLUMN_NAME + '" CSTYPE="';
        if (tableColumns[i].DATA_TYPE_NAME === 'BIGINT') {
            s+='FIXED8_19_0';
        } else {
            s+=tableColumns[i].CS_DATA_TYPE_NAME;
        }
        
        s += '" SQLTYPE="' + tableColumns[i].DATA_TYPE_NAME + '"';
        if (tableColumns[i].DATA_TYPE_NAME === 'VARCHAR' || tableColumns[i].DATA_TYPE_NAME === 'NVARCHAR') {
            s+=' DIMENSION="' + tableColumns[i].LENGTH + '"';
        }
        s += '/>\n';
    }
    s += '</PARAM>';
    connection.close();

    return s;
}

function getTables(schema){
    var s = "";
    var connection = $.hdb.getConnection();
    var tables = connection.executeQuery('select table_name from sys.tables where schema_name=?', schema);

    for (var i=0; i<tables.length; i++) {
        s += '<a href="afl_generate.xsjs?schema=' + schema + '&table=' + tables[i].TABLE_NAME + '">'+tables[i].TABLE_NAME+'</a><br/>';
    }
    connection.close();

    return s;
}


var schema = $.request.parameters.get("schema") || PlcSchema;
var tableName = $.request.parameters.get("table");
var result = "";

if (tableName !== undefined && tableName !== null && tableName.length > 0) {
    result = getTableDetails(schema, tableName);
    $.response.contentType = "text/plain";
} else {
    result = "<html><head><title>HANA AFL Template Generator</title></head><body><h1>Select table in schema "+schema+"</h1></body></html>";
    result += getTables(schema);
    $.response.contentType = "text/html";
}

$.response.setBody(result);
