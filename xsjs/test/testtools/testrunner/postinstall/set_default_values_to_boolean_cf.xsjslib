/* Set the _MANUAL of boolean custom fields to the default value, also set the _IS_MANUAL to 1 in case is not already set (if it does not have defined a formula)
 * If the default value is null in metadata item attributes, then set manual field to 0.
 */

const trace = $.import("xs.xslib", "trace");
const whoAmI = "testtools.testrunner.postinstall.set_default_values_to_boolean_cf.xsjslib";

var Tables = Object.freeze({
	metadata : "sap.plc.db::basis.t_metadata",
	metadataItemAttributes: "sap.plc.db::basis.t_metadata_item_attributes",
	item: "sap.plc.db::basis.t_item",
	itemExt: "sap.plc.db::basis.t_item_ext"
});

function check(oConnection) {
	return true;   
}

function info(line) {
    trace.info(whoAmI, line);
}

function run(oConnection) {
	var iIndex = 0;

	//select the custom fields of boolean type
	var aBooleanCustomFields = oConnection.executeQuery('select COLUMN_ID from "' + Tables.metadata + 
			'" where IS_CUSTOM = ? and SEMANTIC_DATA_TYPE = ? and BUSINESS_OBJECT = ? and COLUMN_ID like ?;', 1, 'BooleanInt', 'Item', 'CUST_%');	
	
	// change the manual and is_manual properties of the boolean custom fields to the default values
	if (aBooleanCustomFields.length > 0) {
		//set 
		for (var row in aBooleanCustomFields) {
			var oUpdate = 'update itemExt set '
			+ 'itemExt.'+ aBooleanCustomFields[row].COLUMN_ID + '_IS_MANUAL =IFNULL(itemExt.' + aBooleanCustomFields[row].COLUMN_ID + '_IS_MANUAL, 1), '
			+'itemExt.' + aBooleanCustomFields[row].COLUMN_ID + '_MANUAL = IFNULL((select distinct DEFAULT_VALUE from "' + Tables.metadataItemAttributes 
			+ '" where PATH = \'Item\' and BUSINESS_OBJECT = \'Item\' and COLUMN_ID = \'' + aBooleanCustomFields[row].COLUMN_ID + '\' and ITEM_CATEGORY_ID = item.ITEM_CATEGORY_ID ),0)'
			+' from "' + Tables.itemExt + '" itemExt, "' + Tables.item + '" item,  "' 
			+ Tables.metadataItemAttributes + '" metitemattr'
			+ ' where item.CALCULATION_VERSION_ID = itemExt.CALCULATION_VERSION_ID '
			+ ' and item.ITEM_ID = itemExt.ITEM_ID and item.ITEM_CATEGORY_ID in (select distinct ITEM_CATEGORY_ID from "' 
			+ Tables.metadataItemAttributes + '" where PATH= \'Item\' and BUSINESS_OBJECT= \'Item\' and COLUMN_ID = \'' + aBooleanCustomFields[row].COLUMN_ID + '\') and itemExt.' + aBooleanCustomFields[row].COLUMN_ID + '_MANUAL IS NULL';	
			
			oConnection.executeUpdate(oUpdate);
		}
		info('Custom fields updated.');
	} else {
		info('No boolean custom fields had to be updated.');
	}

	return true;
} 

function clean(oConnection) { 
	//The Run is either committed as a unit or rolled back, hence their is no dirty data.
	return true;
}