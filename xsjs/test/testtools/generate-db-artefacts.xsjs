// This is a helper script to generate dynamic DB artefacts.
//
// The following URL parameters are supported:
// debug=true         output send SQL statements in the browser
// create-field=true  create one custom fields for Item 

var DbArtefactController = $.require("../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;


// get URL parameters
var bSqlDebug =  $.request.parameters.get('debug') === 'true';
var bCreateCustomField = $.request.parameters.get('create-field') === 'true';

var dbConnection = $.hdb.getConnection({
//	"sqlcc" : "xs.impl.connection::defaultConnection",
	"treatDateAsUTC" : true 
});

var sOutput = "";
var bHadException = false;


// helper function do print sql statements sent to HANA 
function printExecuteUpdate(query) {
	sOutput += query;
	origExecuteUpdate.apply(dbConnection, arguments);
	sOutput += '\n>>>>>\n';
}

// add one custom field to t_metadata 
function addCustomFieldMetadata() {
	
	// add metadata about custom field
	dbConnection.executeUpdate(
			'upsert "sap.plc.db::basis.t_metadata" (path, business_object, column_id, is_custom, semantic_data_type, semantic_data_type_attributes) ' +
			'values (\'Item\', \'Item\', \'CUST_TEST\', 1, \'Integer\', null) where business_object=\'Item\' and column_id=\'CUST_TEST\''
	);

	dbConnection.executeUpdate(
			'upsert "sap.plc.db::basis.t_metadata__text" (path, column_id, language, display_name, display_description) ' +
			'values (\'Item\', \'CUST_TEST\', \'EN\', \'Test field\', \'This is a test custom field\') where path=\'Item\' and column_id=\'CUST_TEST\''
	);
	
	dbConnection.executeUpdate(
			'upsert "sap.plc.db::basis.t_metadata_item_attributes" (path, business_object, column_id, item_category_id, subitem_state, is_mandatory, is_read_only, is_transferable, default_value) ' +
			'values (\'Item\', \'Item\', \'CUST_TEST\', 2, 1, 0, 0, 0, 1, null) where business_object=\'Item\' and column_id=\'CUST_TEST\''
	);
	
}

function removeCustomFieldMetadata() {
	dbConnection.executeUpdate(
			'delete from "sap.plc.db::basis.t_metadata" where IS_CUSTOM = 1'
	);
}

// replace updateQuery function by own function
var origExecuteUpdate = dbConnection.executeUpdate;
dbConnection.executeUpdate = printExecuteUpdate;

try {
    removeCustomFieldMetadata();
    if(bCreateCustomField){
     	addCustomFieldMetadata();        
    }
    
	var oController = new DbArtefactController($, dbConnection);
	oController.createExtensionTable('Item');
	
	// generate all DB artefacts
	oController.createDeleteAndGenerate();
} catch (e) {
	sOutput += "\nException: " + e;
	bHadException = true;
}

if (!bHadException) {
	dbConnection.commit();
	sOutput += '\n\nGeneration was successful.\n';
}

$.response.setBody(sOutput);
$.response.contentType = "text/plain";
