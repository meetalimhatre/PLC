const PlcSchema = $.require("../../lib/xs/db/connection/connection").getContainerSchema($);

function getTableDetails(format){
    var s = "";
    var connection = $.hdb.getConnection();
    var query = 'select column_name, data_type_name, is_nullable from sys.table_columns where schema_name=? and table_name=? order by position';

    var rs = connection.executeQuery(query, schema, table);
    var first = true;
    for (var row in rs) {
        s += format(rs[row], first);
        if (first) {
            first = false;
        }
    }
    connection.close();

    return s;
}

function getTableAsJson() {
    var s = 'name: "' + table + '",\ndata: {\n\t';
    s += getTableDetails(function(row, first) {
        var s = "";
        if (!first) {
            s += '],\n\t';
        }
        s += '"' + row.COLUMN_NAME + '": [';
        if (row.DATA_TYPE_NAME !== "INTEGER" && row.DATA_TYPE_NAME !== "DECIMAL") {
            s += '""';
        }
        return s;
    });
    s += ']\n}\n';
    return s;
}

function getTableAsSelect() {
    var s = 'SELECT ';
    s += getTableDetails(function(row, first) {
        var s = "";
        if (!first) {
            s += ', ';
        }
        s += row.COLUMN_NAME.toLowerCase();
        return s;
    });
    s += ' FROM "' + schema + '"."' + table + '";\n';
    return s;
}

function getTableAsPropertyArray() {
    var s = '\nattributes for: "' + table + '",\ndata: [';
    s += getTableDetails(function(row, first) {
        var s = "";
        if (!first) {
            s += ',';
        }
        
        s += '"' + row.COLUMN_NAME + '"';
        return s;
    });
    s += ']\n';
    return s;
}

function getTableAsNonNullablePropertyArray() {
    var s = '\nattributes for: "' + table + '",\ndataNonNullable: [';
    s += getTableDetails(function(row, first) {
        var s = "";
        if (row.IS_NULLABLE === "FALSE") {
            if (!first) {
                s += ',';
            }
            s += '"' + row.COLUMN_NAME + '"';
        }
        return s;
    });
    s += ']\n';
    return s;
}


var schema = $.request.parameters.get("schema") || PlcSchema;
var table = $.request.parameters.get("table") || 'sap.plc.db::basis.t_item';
var result = getTableAsJson();
result += "\n\n";
result += getTableAsSelect();
result += getTableAsPropertyArray();
result += getTableAsNonNullablePropertyArray();
$.response.setBody(result);
$.response.contentType = "text/plain";
