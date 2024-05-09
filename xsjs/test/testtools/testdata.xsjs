const hQueryLib = $.require("../../lib/xs/xslib/hQuery");
var _ = $.require("lodash");
const PlcSchema = $.require("../../lib/xs/db/connection/connection").getContainerSchema($);

var schema = $.request.parameters.get("schema") || PlcSchema;
var table = $.request.parameters.get("table") || 'sap.plc.db::basis.t_item';
var size = $.request.parameters.get("size") || 3;

var hQuery = new hQueryLib.HQuery($.hdb.getConnection());

function getTableData(){
    var oStatement = hQuery.statement('select column_name, data_type_name, is_nullable from sys.table_columns where schema_name=? and table_name=? order by position');
    var result = oStatement.execute(schema,table);
    
    var testDataObject = {
        columnNames : []
    };
    _.each(result, function(attribute){
        testDataObject.columnNames.push(attribute.COLUMN_NAME);
        
        testDataObject[attribute.COLUMN_NAME] = [];
    });
    
    return testDataObject;
}

function getTestData(){
    var testDataObject = getTableData();
    var oStatement = hQuery.statement('select TOP ? * from  "'+schema+'"."' + table + '"');
    var result = oStatement.execute(size);
    var testData = {};
    
    _.each(result, function(object, index){
       _.each(testDataObject.columnNames, function(attribute){
          testDataObject[attribute].push(object[attribute]);
       });
    });
    delete testDataObject.columnNames;
    return testDataObject;
}

var result = JSON.stringify(getTestData());
$.response.setBody(result);
$.response.contentType = "text/plain";

