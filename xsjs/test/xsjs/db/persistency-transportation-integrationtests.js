var _ = require("lodash");
//import constructors
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;
var Message = require("../../../lib/xs/util/message");
var Transportation = $.import("xs.db", "persistency-transportation").Transportation;
var origDate = Date;


/**
 * to convert exported data from format which client receives to format which uses as test data
 * Example: [ 
 *              ["ItemId","Calculation_version_id"],
 *              [1,1],
 *              [2,2]
 *          ] 
 * to {
 *      "Itemid": [1,2], 
 *      "Calculation_version_id":[1,2]
 *      }
 */
function convertExportedData(aInput) {

	var oOutput = {};

	_.each(aInput[0], function(columnName) {
		var indexColumn = _.indexOf(aInput[0], columnName)
		oOutput[columnName] = [];
		_.each(_.rest(aInput), function(aValues) {
			oOutput[columnName].push(aValues[indexColumn]);
		})
	})
	return oOutput;
}

function tableDataToImportData(oTableDataObject, sIndexColumnName){
	var aReturnArray = [];
	var aColumnNames = _.keys(oTableDataObject);
	aReturnArray.push(aColumnNames);
	
	var iNumberOfValues = oTableDataObject[sIndexColumnName].length;
	for(let i = 0; i < iNumberOfValues; i++){
		let aValueArray = [];
		_.each(aColumnNames, function(sColumnName){
			// in f**king JavaScript 0 is handled as undefined => 0 || null -> null
			var vValue = oTableDataObject[sColumnName][i];
			if(vValue === undefined){
				vValue = null;
			}
			aValueArray.push(vValue);
		});
		aReturnArray.push(aValueArray);
	}
	return aReturnArray;
}

function pickFromTableData(oTableDataObject, aIndices){
	var oReturnObject = {};
	_.each(oTableDataObject, function(aValues, sColumnName){
		// since _.pick returns an object, the result must be converted back to an array
		oReturnObject[sColumnName] = _.toArray(_.pick(aValues, aIndices));
	});
	return oReturnObject;
}



describe('xsjs.db.persistency-transportation-integrationtests', function() {

	// mockstar import & settings
	var userId = $.session.getUsername().toUpperCase();
	var mockstar = null;
	var oTransportation = null;
	var iSource = 1 //for PLC
	var oDbArtefactControllerMock = null;
	var oMetadataMock = null;
	var sCustomField = "CUST_TEST";

	var oMetadataTableData = {
		"PATH":                             ["Item",					"Item", 	"Item", 		"Item", 					"Item"],
		"BUSINESS_OBJECT":                  ["Item",					"Item", 	"Item", 		"Item", 					"Item"],
		"COLUMN_ID":                        ["PRICE_FIXED_PORTION", 	"PLANT_ID", "CUST_TEST", 	"CUST_TEST2", 				"CUST_TEST2_UNIT"],
		"IS_CUSTOM":                        [0, 						0, 			1, 				1, 							1],
		"ROLLUP_TYPE_ID":                   [0, 						0,			0, 				0, 							0],
		"SIDE_PANEL_GROUP_ID":              [101, 						102,		103,			104,						null],
		"DISPLAY_ORDER":                    [1, 						2,			3, 				4, 							null],
		"TABLE_DISPLAY_ORDER":              [1, 						2,			3, 				4, 							null],
		"SEMANTIC_DATA_TYPE":               ["Decimal", 				"String", 	"String", 		"Decimal", 					"String"],
		"SEMANTIC_DATA_TYPE_ATTRIBUTES":    ["precision=24; scale=7",	null, 		"length=10", 	"precision=24; scale=7", 	"length=3"],
		"REF_UOM_CURRENCY_PATH":            [null, 						null, 		null, 			"Item", 					null],
		"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null, 						null, 		null, 			"Item", 					null],
		"REF_UOM_CURRENCY_COLUMN_ID":       [null, 						null, 		null, 			"CUST_TEST2_UNIT", 			null],
		"UOM_CURRENCY_FLAG":                [null, 						null, 		null, 			0, 							1],
		"PROPERTY_TYPE":                    [6, 						6, 			6, 				2, 							6],
		"IS_USABLE_IN_FORMULA":             [1, 						1, 			1, 				1, 							1]
	};
	
    // langauges EN and DE are both required for CFF
    // CUSTOM _unit-fields do not have any language related description
	var oMetadataTextTableData = {
		"PATH"               : ["Item", 				"Item", 	"Item", 		"Item", 		"Item", 		"Item"],
		"COLUMN_ID"          : ["PRICE_FIXED_PORTION", 	"PLANT_ID", "CUST_TEST",	"CUST_TEST", 	"CUST_TEST2",	"CUST_TEST2"],
		"LANGUAGE"           : ["DE", 					"DE", 		"DE", 			"EN", 			"DE", 			"EN"],
		"DISPLAY_NAME"       : ["Preis", 				"Plant", 	"Test_DE", 		"Test_EN", 		"Test2_DE", 	"Test2_EN"],
		"DISPLAY_DESCRIPTION": ["Der Preis ist heiß", 	"Plant", 	"Test_DE", 		"Test_EN", 		"Test2_DE", 	"Test2_EN"]
	};
	
	var oMetadataItemAttributesTableData = {
		"PATH":                         ["Item",				"Item",     "Item",      "Item",      "Item",       "Item"],
		"BUSINESS_OBJECT":              ["Item",				"Item",     "Item",      "Item",      "Item",       "Item"],
		"COLUMN_ID":                    ["PRICE_FIXED_PORTION",	"PLANT_ID", "CUST_TEST", "CUST_TEST", "CUST_TEST2", "CUST_TEST2_UNIT"],
		"ITEM_CATEGORY_ID":             [1,						-1,         2,           3,           2,            2],
		"SUBITEM_STATE":                 [-1,					-1,        -1,           -1,          -1,           -1],
		"IS_MANDATORY":                 [1, 					0,          0,         	 0,           0,            0],
		"IS_READ_ONLY":                 [0, 					0,          0,         	 1,           0,            0],
		"DEFAULT_VALUE":                [null, 					null,       "test",      null,        "42",         null]
	};
	
	var oFormulaTableData = {
		"FORMULA_ID": [1, 2, 3],
		"PATH": ["Item", "Item", "Item"],
		"BUSINESS_OBJECT": ["Item", "Item", "Item"],
		"COLUMN_ID": ["PRICE_FIXED_PORTION", "CUST_TEST", "CUST_TEST"],
		"ITEM_CATEGORY_ID": [1, 2, 3],
		"IS_FORMULA_USED": [1, 1, 1],
		"FORMULA_STRING": ["1+1", "2+2", "3+3"],
		"FORMULA_DESCRIPTION": ["Price Formula", "Cust Formula1", "Cust Formula2"]
	};

	var oLayoutColumns = {
        "LAYOUT_ID":            [1,    1,      1,      2,    2,      2,      2 ],
        "DISPLAY_ORDER":        [0,    1,      2,      0,    1,      2,      3 ],
        "PATH":                 [null, "Item", "Item", null, null,   "Item", "Item" ],
        "BUSINESS_OBJECT":      [null, "Item", null,   null, "Item", "Item", "Item" ],
        "COLUMN_ID":            [null, sCustomField, "ColB", null, null,   sCustomField, "ColB" ],
        "COSTING_SHEET_ROW_ID": [null, null,   null,   null, 2,      null,   null ],
        "COST_COMPONENT_ID":    [null, null,   null,   null, 2,      null,   null ],
        "COLUMN_WIDTH":         [430,  5,      10,     430,  5,      8,      10 ]
	};
    var oLayoutHiddenFields = {
        "LAYOUT_ID": [1, 1, 2],
        "PATH": ["Item", "Item", "Item"],
        "BUSINESS_OBJECT": ["Item", "Item", "Item" ],
        "COLUMN_ID": [sCustomField, "ColE", sCustomField ]
	};

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables: {
				businessArea: {
					name: "sap.plc.db::basis.t_business_area",
					data: {
						"BUSINESS_AREA_ID": ["1"],
						"_VALID_FROM": [new Date(2014, 1, 1).toJSON()],
						"_VALID_TO": [null],
						"_SOURCE": [iSource],
						"_CREATED_BY": [userId]
					}
				},
				controllingArea: {
					name: "sap.plc.db::basis.t_controlling_area",
					data: {
						"CONTROLLING_AREA_ID": ["1", "1", "2"],
						"CONTROLLING_AREA_CURRENCY_ID": ["EUR", "EUR", "EUR"],
						"_VALID_FROM": [new Date(2014, 1, 1).toJSON(), new Date(2015, 1, 1).toJSON(), new Date(2015, 2, 2).toJSON()],
						"_VALID_TO": [new Date(2015, 1, 1).toJSON(), null, null],
						"_SOURCE": [iSource, iSource, iSource],
						"_CREATED_BY": [userId, userId, userId]
					}
				},
				controllingArea_text: {
					name: "sap.plc.db::basis.t_controlling_area__text",
					data: {
						"CONTROLLING_AREA_ID":          ["1", "1", "2"],
						"LANGUAGE":                     ["DE", "DE", "DE"],
						"CONTROLLING_AREA_DESCRIPTION": ["Old 1", "New 1", "CA2"],
						"_VALID_FROM":                  [new Date(2014, 1, 1).toJSON(), new Date(2015, 1, 1).toJSON(), new Date(2015, 2, 2).toJSON()],
						"_VALID_TO":                    [new Date(2015, 1, 1).toJSON(), null, null],
						"_SOURCE":                      [iSource, iSource, iSource],
						"_CREATED_BY":          [userId, userId, userId]
					}
				},
				currency: {
					name: "sap.plc.db::basis.t_currency",
					data: {
						"CURRENCY_ID": ["EUR", "USD"],
						"_VALID_FROM": [new Date(2014, 1, 1).toJSON(), new Date(2014, 1, 1).toJSON()],
						"_VALID_TO": [null, null],
						"_SOURCE": [iSource, iSource],
						"_CREATED_BY": [userId, userId]
					},
				},
				metadata: {
					name: "sap.plc.db::basis.t_metadata",
					data: oMetadataTableData
				},
				metadata_text: {
					name: "sap.plc.db::basis.t_metadata__text",
					data: oMetadataTextTableData
				},
				metadata_item_attributes: {
					name: "sap.plc.db::basis.t_metadata_item_attributes",
					data: oMetadataItemAttributesTableData
				},
				formula: {
					name: "sap.plc.db::basis.t_formula",
					data: oFormulaTableData
				},
				account: {
					name: "sap.plc.db::basis.t_account",
					data: {
						"ACCOUNT_ID": ["AC1"],
						"CONTROLLING_AREA_ID": ["1"],
						"_VALID_FROM": [new Date(2014, 1, 1).toJSON()]
					}
				},
				defaultSettings: {
					name: "sap.plc.db::basis.t_default_settings",
					data: {
						"USER_ID":                ["",     "U1"],
						"CONTROLLING_AREA_ID":    ["1000", null],
						"COMPANY_CODE_ID":        ["SAP",  null],
						"PLANT_ID":               ["DRS",  "WDF"],
						"REPORT_CURRENCY_ID":     ["EUR",  null],
						"COMPONENT_SPLIT_ID":     [null,   null],
						"COSTING_SHEET_ID":       [null,   null]
					}
				},
				lock: {
					name: "sap.plc.db::basis.t_lock"
				},
				layout_columns: {
					name: "sap.plc.db::basis.t_layout_column",
					data: oLayoutColumns
				},
				layout_hidden_field: {
					name: "sap.plc.db::basis.t_layout_hidden_field",
					data: oLayoutHiddenFields
				},
				session: {
					name: "sap.plc.db::basis.t_session"
				},
				application_timeout: {
					name: "sap.plc.db::basis.t_application_timeout"
				}
			}
		});
	});

	beforeEach(function() {
		oDbArtefactControllerMock = jasmine.createSpyObj("oDbArtefactControllerMock", ["createAndGenerate", "generateAllFiles", "generateAllFilesExt"]);
		oMetadataMock = jasmine.createSpyObj("oMetadataMock", ["updateManualField", "updateUnitField", "copyItemsToItemExt", "copyMasterdataToMasterdataExt", "updateManualField", "updateFieldWithDefaultValue"]);		
	});
	
	afterOnce(function() {
		Date = origDate;
		mockstar.cleanup();
	});

	describe('import Data', function() {
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.initializeData();
						
			oTransportation = new Transportation(jasmine.dbConnection, oDbArtefactControllerMock, oMetadataMock);
		});

		it('Import single table, all contraints ok, only new keys --> old rows replaced, new rows added', function() {
			// arrange
			const mTables = {
				"t_formula": [
								["FORMULA_ID", "PATH", "BUSINESS_OBJECT", "COLUMN_ID", "ITEM_CATEGORY_ID", "IS_FORMULA_USED", "FORMULA_STRING", "FORMULA_DESCRIPTION"],
								[4, "Item", "Item", "CUST_TEST2", 2, 1, "2+5", "CUST_TEST2 formula"],
								[5, "Item", "Item", "CUST_TEST2_UNIT", 2, 1, "12+2+5", "CUST_TEST2_UNIT formula"]
							 ]
			};
			
			const mParameters = {
				mode : "replace"
			}

			// act
			oTransportation.importData(mTables, mParameters);

			// assert
			const importedData = mockstar.execQuery("select FORMULA_ID, PATH, BUSINESS_OBJECT, COLUMN_ID, ITEM_CATEGORY_ID, IS_FORMULA_USED, FORMULA_STRING, FORMULA_DESCRIPTION from {{formula}}");
			expect(importedData).toMatchData({
				"PATH": ["Item", "Item"],
				"BUSINESS_OBJECT": ["Item", "Item"],
				"COLUMN_ID": ["CUST_TEST2", "CUST_TEST2_UNIT"],
				"ITEM_CATEGORY_ID": [2, 2],
				"IS_FORMULA_USED": [1, 1],
				"FORMULA_STRING": ["2+5", "12+2+5"],
				"FORMULA_DESCRIPTION": ["CUST_TEST2 formula", "CUST_TEST2_UNIT formula"]
			}, ["PATH", "BUSINESS_OBJECT"]);
		});

		it('Import single table, table contains no data --> do nothing, no error', function() {
			// arrange
			const mTables = {
				"t_formula": [
					["FORMULA_ID", "PATH", "BUSINESS_OBJECT", "COLUMN_ID", "ITEM_CATEGORY_ID", "IS_FORMULA_USED", "FORMULA_STRING", "FORMULA_DESCRIPTION"]
				]
			};
			
			const mParameters = {
				mode : "replace"
			}

			// act
			const oResultObject = oTransportation.importData(mTables, mParameters);

			// assert
			const importedData = mockstar.execQuery(
				"select FORMULA_ID, PATH, BUSINESS_OBJECT, COLUMN_ID, ITEM_CATEGORY_ID, IS_FORMULA_USED, FORMULA_STRING, FORMULA_DESCRIPTION from {{formula}}"
			);
			expect(importedData).toMatchData({
				"FORMULA_ID": [],
				"PATH": [],
				"BUSINESS_OBJECT": [],
				"COLUMN_ID": [],
				"ITEM_CATEGORY_ID": [],
				"IS_FORMULA_USED": [],
				"FORMULA_STRING": [],
				"FORMULA_DESCRIPTION": []
			}, ["FORMULA_ID"]);
			
			expect(oResultObject.t_formula).toEqual(["imported successfully"]);
		});

		describe("custom fields and formula", function () {
			
			// base object for the import of custom fields; is extend by tests to construct the desired scenario
			var oCustomFieldMetadataImport = {
				"PATH": "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID": "not_null",  // should not be null due to table key constraint
				"IS_CUSTOM": 1,
				"ROLLUP_TYPE_ID": 0,
				"SIDE_PANEL_GROUP_ID": 101,
				"DISPLAY_ORDER": 2,
				"TABLE_DISPLAY_ORDER": 3,
				"SEMANTIC_DATA_TYPE": "String",
				"SEMANTIC_DATA_TYPE_ATTRIBUTES": "length=10",
				"REF_UOM_CURRENCY_PATH": null,
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
				"REF_UOM_CURRENCY_COLUMN_ID": null,
				"UOM_CURRENCY_FLAG": null,
				"PROPERTY_TYPE": 6,
				"IS_USABLE_IN_FORMULA": 1,
				"CREATED_ON": null,
				"CREATED_BY": null,
				"LAST_MODIFIED_ON": null,
				"LAST_MODIFIED_BY": null
			};
			
			describe("validation", function() {
		
				it('change existing fields with mode=append --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED', function () {
					// arrange
					var oExisitngCustomFieldMetadata = _.extend({}, oCustomFieldMetadataImport, {
						"COLUMN_ID": "CUST_TEST",
						"REF_UOM_CURRENCY_PATH": "Item" // modification this property compared to the original test data
					});

					var mTables = {
						"t_metadata": [
							_.keys(oExisitngCustomFieldMetadata),
							_.values(oExisitngCustomFieldMetadata)
						]
					};
					var mParameters = {
						mode: "append"
					}

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED)
				});
				
				it('delete existing fields with mode=append --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED', function () {
					// arrange
					var mTables = {
						// passing an empty object means that the target system shall be reset; this includes custom fields, which would be removed
						// this is not possible with mode=append
					};
					var mParameters = {
						mode: "append"
					}

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_DELETED)
				});

				it('remove existing fields with mode=append --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_DELETED', function () {
					// arrange
					// construct only new custom fields; means the old custom fields are deleted
					var oNewCustomFieldMetadata = _.extend({}, oCustomFieldMetadataImport, {
						"COLUMN_ID": "CUST_NEW"
					});
					var mTables = {
						"t_metadata": [
							_.keys(oNewCustomFieldMetadata),
							_.values(oNewCustomFieldMetadata)
						]
					};
					var mParameters = {
						mode: "append"
					}

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_DELETED)
				});
				
				it('change only data type of existing custom field (mode=append) --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED', function () {
					// arrange
					var oNewCustomFieldMetadata = _.extend({}, oCustomFieldMetadataImport, {
						"COLUMN_ID": "CUST_TEST",
						"SEMANTIC_DATA_TYPE": "Decimal",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES": "length=10",
					});
					var mTables = {
						"t_metadata": [
							_.keys(oNewCustomFieldMetadata),
							_.values(oNewCustomFieldMetadata)
						]
					};
					var mParameters = {
						mode: "append"
					}

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED)
				});
				
				it('change only data type of existing custom field (mode=replace) --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED', function () {
					// arrange
					var oNewCustomFieldMetadata = _.extend({}, oCustomFieldMetadataImport, {
						"COLUMN_ID": "CUST_TEST",
						"SEMANTIC_DATA_TYPE": "Decimal",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES": "length=10",
					});
					var mTables = {
						"t_metadata": [
							_.keys(oNewCustomFieldMetadata),
							_.values(oNewCustomFieldMetadata)
						]
					};
					var mParameters = {
						mode: "replace"
					}

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED)
				});
				
				it('change only data type attributes of existing custom field (mode=replace) --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED', function () {

					// arrange
					var oNewCustomFieldMetadata = _.extend({}, oCustomFieldMetadataImport, {
						"COLUMN_ID": "CUST_TEST",
						"SEMANTIC_DATA_TYPE": "String",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES": "precision=24; scale=7",
					});
					var mTables = {
						"t_metadata": [
							_.keys(oNewCustomFieldMetadata),
							_.values(oNewCustomFieldMetadata)
						]
					};
					var mParameters = {
						mode: "replace"
					}

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED)
				});
				
				it('change data type AND data type attributes of existing custom field (mode=replace) --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED', function () {
					// arrange
					var oNewCustomFieldMetadata = _.extend({}, oCustomFieldMetadataImport, {
						"COLUMN_ID": "CUST_TEST",
						"SEMANTIC_DATA_TYPE": "Decimal",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES": "length=10",
					});
					var mTables = {
						"t_metadata": [
							_.keys(oNewCustomFieldMetadata),
							_.values(oNewCustomFieldMetadata)
						]
					};
					var mParameters = {
						mode: "replace"
					}

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED)
				});
				
				it('import invalid custom field metadata (mode=replace)--> throw CALCULATIONENGINE_SYNTAX_ERROR_WARNING', function(){
					// arrange
					var oInvalidMetadataProperties = {
						"PATH": "Not_Item", // only Item allowed
						"BUSINESS_OBJECT": "Not_Item", // only Item allowed
						"COLUMN_ID": "INVALID", // only CUST_* allowed
						"IS_CUSTOM": 0, // only 1 allowed
						"DISPLAY_ORDER": -1, // only positive integers allowed
						"TABLE_DISPLAY_ORDER": -1, // only positive integers allowed
						"ROLLUP_TYPE_ID": 7, // only between 0 and 5 allowed
						"SEMANTIC_DATA_TYPE": "PositiveInteger", // only 'Integer', 'Decimal', 'UTCTimestamp', 'LocalDate', 'BooleanInt', 'String' allowed
						"SEMANTIC_DATA_TYPE_ATTRIBUTES": "scale", // only length=* or precision=24; scale=7 allowed
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Not Item", // only Item allowed
						"REF_UOM_CURRENCY_COLUMN_ID": "no column", // only a column in t_metadata_staging or t_metadata allowed
						"UOM_CURRENCY_FLAG": 2, // only 0 or 1 allowed
						"PROPERTY_TYPE": 16, // only 2,3,5,6,7,11,12 allowed
					};
					
					_.each(_.keys(oInvalidMetadataProperties), function(sMetadataColumn){
						jasmine.log(`Checking invalid data for column ${sMetadataColumn}`);
						
						var oImportObjectWithInvalidMetadata = _.extend({}, oCustomFieldMetadataImport, _.pick(oInvalidMetadataProperties, sMetadataColumn));
						var mTables = {
							"t_metadata": [
								_.keys(oImportObjectWithInvalidMetadata),
								_.values(oImportObjectWithInvalidMetadata)
							]
						};
						var mParameters = {
							mode: "replace"
						};
						
						// act
						var exception;
						try {
							oTransportation.importData(mTables, mParameters);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception.code).toEqual(Message.Code.GENERAL_VALIDATION_ERROR);
					});
					
				});
				
				it('should import fields with missing descriptions in any languages (except Unit/UoM fields) --> successful', function() {					
					// arrange					
					//  pick the data for CUST_TEST, CUST_TEST2, CUST_TEST2_UNIT
					var aMetadataImportData = tableDataToImportData(pickFromTableData(oMetadataTableData, [2,3,4]), "COLUMN_ID");
					// Do not select EN nor DE for CUST_TEST
					var aMetadataTextImportData = tableDataToImportData(pickFromTableData(oMetadataTextTableData, [4,5]), "COLUMN_ID");
					var aMetadataAttributesImportData = tableDataToImportData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), "COLUMN_ID");
					var aFormulaImportData = tableDataToImportData(pickFromTableData(oFormulaTableData, [1,2]), "COLUMN_ID");
					var mTables = {
						t_metadata: aMetadataImportData,
						t_metadata__text : aMetadataTextImportData,
						t_metadata_item_attributes : aMetadataAttributesImportData,
						t_formula : aFormulaImportData
					};
					
					var mParameters = {
						mode: "replace"
					}
					
					// act
						oTransportation.importData(mTables, mParameters);

					// assert
					// no exception was thrown
				});
				
				it('should import fields with missing descriptions in languages EN or DE (except Unit/UoM fields) --> successful', function() {
					// arrange					
					//  pick the data for CUST_TEST, CUST_TEST2, CUST_TEST2_UNIT
					var aMetadataImportData = tableDataToImportData(pickFromTableData(oMetadataTableData, [2,3,4]), "COLUMN_ID");
					// Do not select EN for CUST_TEST, not DE for CUST_TEST2
					var aMetadataTextImportData = tableDataToImportData(pickFromTableData(oMetadataTextTableData, [2,5]), "COLUMN_ID");
					var aMetadataAttributesImportData = tableDataToImportData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), "COLUMN_ID");
					var aFormulaImportData = tableDataToImportData(pickFromTableData(oFormulaTableData, [1,2]), "COLUMN_ID");
					var mTables = {
						t_metadata: aMetadataImportData,
						t_metadata__text : aMetadataTextImportData,
						t_metadata_item_attributes : aMetadataAttributesImportData,
						t_formula : aFormulaImportData
					};
					
					var mParameters = {
						mode: "replace"
					}
					
						oTransportation.importData(mTables, mParameters);

					// assert
					// no exception was thrown
				});
				
				
				it('import invalid custom field metadata attributes (mode=replace)--> throw CALCULATIONENGINE_SYNTAX_ERROR_WARNING', function(){
					// arrange
					var oValidMetadataAttributes = {
						"PATH":             "Item", 
						"BUSINESS_OBJECT":  "Item",  
						"COLUMN_ID":      "CUST_TEST", 
						"ITEM_CATEGORY_ID": -1,
						"SUBITEM_STATE":     -1,
						"DEFAULT_VALUE":    null,
					};
					var oInvalidMetadataAttributesProperties = {
						"ITEM_CATEGORY_ID": 99, // item category id that is not included in valid range (as defined in t_item_category)
						"SUBITEM_STATE": 2, // only -1, 0 or 1 allowed
					};
					
					_.each(_.keys(oInvalidMetadataAttributesProperties), function(sMetadataAttributeColumn){
						jasmine.log(`Checking invalid data for column ${sMetadataAttributeColumn}`);
						
						var oImportObjectWithInvalidMetadata = _.extend({}, oValidMetadataAttributes, _.pick(oInvalidMetadataAttributesProperties, sMetadataAttributeColumn));
						var mTables = {
							"t_metadata_item_attributes": [
								_.keys(oImportObjectWithInvalidMetadata),
								_.values(oImportObjectWithInvalidMetadata)
							]
						};
						var mParameters = {
							mode: "replace"
						};
						
						// act
						var exception;
						try {
							oTransportation.importData(mTables, mParameters);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception.code).toEqual(Message.Code.GENERAL_VALIDATION_ERROR);
					});
				});
				
				it('import metadata for custom field without metadata attributes (mode=replace)--> throw GENERAL_VALIDATION_ERROR', function () {
					// arrange
					var oMetadataImport = pickFromTableData(oMetadataTableData, [2]);
					
					var mTables = {
						"t_metadata": tableDataToImportData(oMetadataImport, "COLUMN_ID"),
					};
					var mParameters = {
						mode: "replace"
					};

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.GENERAL_VALIDATION_ERROR);
				});
	

				it('import invalid formular for existing custom field --> throw CALCULATIONENGINE_SYNTAX_ERROR_WARNING', function () {
					// arrange
					var oInvalidFormula = {
						"FORMULA_ID": 1,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST",
						"ITEM_CATEGORY_ID": 1,
						"IS_FORMULA_USED": 1,
						"FORMULA_STRING": "invalid_formula",
						"FORMULA_DESCRIPTION": "invalid Formula"
					}
					var mTables = {
						t_formula: [
							_.keys(oInvalidFormula),
							_.values(oInvalidFormula)
						]
					};
					var mParameters = {
						mode: "replace"
					}

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.CALCULATIONENGINE_SYNTAX_ERROR_WARNING);
				});
				
				it('should not override existing formula for custom field in append mode --> throw TRANSPORT_FORMULA_CANNOT_BE_MODIFIED', function () {
					// arrange
					var oImportedFormula = {
						"FORMULA_ID": 42, // intentionally use different formula_id as it must not used for comparison
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST",
						"ITEM_CATEGORY_ID": 1,
						"IS_FORMULA_USED": 1,
						"FORMULA_STRING": "42",
						"FORMULA_DESCRIPTION": "Overriden formula"
					};
					
					var oExistingCFMetadata = pickFromTableData(oMetadataTableData, [2,3,4]);
					var oExistingCFMetadataText = pickFromTableData(oMetadataTextTableData, [2,3,4,5]);
					var oExistingCFMetadataAttributes = pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]);

					var oReplacedFormula = mockstar_helpers.addRowToTableData(pickFromTableData(oFormulaTableData, [0,1]), {
						"FORMULA_ID": 42, // intentionally use different formula_id as it must not used for comparison
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST",
						"ITEM_CATEGORY_ID": 3,
						"IS_FORMULA_USED": 1,
						"FORMULA_STRING": "42",
						"FORMULA_DESCRIPTION": "Overriden formula"
					});

					var mTables = {
						t_metadata: tableDataToImportData(oExistingCFMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oExistingCFMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oExistingCFMetadataAttributes, "COLUMN_ID"),
						t_formula: tableDataToImportData(oReplacedFormula, "COLUMN_ID")
					};
					var mParameters = {
						mode: "append"
					};

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_FORMULA_CANNOT_BE_MODIFIED);
				});

				it('should not override existing formula for standard field in append mode --> throw TRANSPORT_FORMULA_CANNOT_BE_MODIFIED', function () {
					// arrange
					
					var oExistingCFMetadata = pickFromTableData(oMetadataTableData, [2,3,4]);
					var oExistingCFMetadataText = pickFromTableData(oMetadataTextTableData, [2,3,4,5]);
					var oExistingCFMetadataAttributes = pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]);
					
					var oReplacedFormula = mockstar_helpers.addRowToTableData(pickFromTableData(oFormulaTableData, [1,2]), {
						"FORMULA_ID": 42, // intentionally use different formula_id as it must not used for comparison
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "PRICE_FIXED_PORTION",
						"ITEM_CATEGORY_ID": 1,
						"IS_FORMULA_USED": 1,
						"FORMULA_STRING": "42",
						"FORMULA_DESCRIPTION": "Overriden formula"
					});

					var mTables = {
						t_metadata: tableDataToImportData(oExistingCFMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oExistingCFMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oExistingCFMetadataAttributes, "COLUMN_ID"),
						t_formula: tableDataToImportData(oReplacedFormula, "COLUMN_ID")
					};
					var mParameters = {
						mode: "append"
					};

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_FORMULA_CANNOT_BE_MODIFIED);
				});
				
				it('should not override existing texts (display name / description) for custom field in append mode --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED', function () {
			
					var oExistingCFMetadata = pickFromTableData(oMetadataTableData, [2,3,4]);
					var oExistingCFMetadataAttributes = pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]);
					var oExistingFormula = pickFromTableData(oFormulaTableData, [0,1,2]);
					
					var oModifiedCFMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,4,5]), {
						"PATH": "Item", 
						"COLUMN_ID": "CUST_TEST",
						"LANGUAGE": "EN",
						"DISPLAY_NAME": "Change_Name", // intentionally use different display_name to provoke validation excpetion
						"DISPLAY_DESCRIPTION": "Test_EN"
					});

					var mTables = {
						t_metadata: tableDataToImportData(oExistingCFMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oModifiedCFMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oExistingCFMetadataAttributes, "COLUMN_ID"),
						t_formula: tableDataToImportData(oExistingFormula, "COLUMN_ID")
					};
					var mParameters = {
						mode: "append"
					};

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED);

				});
				
				it('should not override existing item attributes for custom field in append mode --> throw TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED', function () {
			
					var oExistingCFMetadata = pickFromTableData(oMetadataTableData, [0,1,2,3,4]);
					var oExistingCFMetadataText = pickFromTableData(oMetadataTextTableData, [0,1,2,3,4,5]);
					var oExistingFormula = pickFromTableData(oFormulaTableData, [0,1,2]);
					
					// intentionally add new item categories to the CF to provoke validation excpetion
					var oModifiedCFMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
							"PATH":             "Item",
							"BUSINESS_OBJECT":  "Item",
							"COLUMN_ID":        "CUST_TEST",
							"ITEM_CATEGORY_ID": 4,
							"SUBITEM_STATE":    -1,
							"DEFAULT_VALUE":    null
					});

					var mTables = {
						t_metadata: tableDataToImportData(oExistingCFMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oExistingCFMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oModifiedCFMetadataAttributes, "COLUMN_ID"),
						t_formula: tableDataToImportData(oExistingFormula, "COLUMN_ID")
					};
					var mParameters = {
						mode: "append"
					};

					// act
					var exception;
					try {
						oTransportation.importData(mTables, mParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code).toEqual(Message.Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED);

				});
				
			});
			
			describe('import actual data', function(){
				
				// helper function to check if specific values are contained for a specific column of a result set			 
				function expectIsContainedInResultSet(oResultSet, sColumnName, mProperties){
					_.each(mProperties, function(bIsContained, sValue){
						jasmine.log(`Checking if the value ${sValue} is ${bIsContained === false ? " NOT " : ""} contained in result set for column ${sColumnName}`);
						expect(_.includes(oResultSet.columns[sColumnName].rows, sValue)).toBe(bIsContained);
					});
				}
								
				it('import with added CUST_ADDED and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
					var oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
						"PATH":                             "Item",
						"BUSINESS_OBJECT":                  "Item",
						"COLUMN_ID":                        "CUST_ADDED",
						"IS_CUSTOM":                        1,
						"ROLLUP_TYPE_ID":                   0,
						"SIDE_PANEL_GROUP_ID":              101,
						"DISPLAY_ORDER":                    2,
						"TABLE_DISPLAY_ORDER":              3,
						"SEMANTIC_DATA_TYPE":               "Decimal",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "precision=24; scale=7",
						"REF_UOM_CURRENCY_PATH":            null,
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
						"REF_UOM_CURRENCY_COLUMN_ID":       null,
						"UOM_CURRENCY_FLAG":                null,
						"PROPERTY_TYPE":                    6,
						"IS_USABLE_IN_FORMULA":             1
					});
					
					var oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
						"PATH"               : "Item",
						"COLUMN_ID"          : "CUST_ADDED",
						"LANGUAGE"           : "DE",
						"DISPLAY_NAME"       : "Hinzugefügt",
						"DISPLAY_DESCRIPTION": "Bestes CF wo gibt"
					});
					oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(oAddedFieldMetadataText, {
						"PATH"               : "Item",
						"COLUMN_ID"          : "CUST_ADDED",
						"LANGUAGE"           : "EN",
						"DISPLAY_NAME"       : "added",
						"DISPLAY_DESCRIPTION": "Best CF ever"
					});
					
					var oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
						"PATH":             "Item",
						"BUSINESS_OBJECT":  "Item",
						"COLUMN_ID":        "CUST_ADDED",
						"ITEM_CATEGORY_ID": 2,
						"SUBITEM_STATE":     -1,
						"DEFAULT_VALUE":    null,
						"IS_READ_ONLY":     0,
						"IS_MANDATORY":		0
					});
					
					var mTables = {
						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
					};
					var mParameters = {
						mode: "append"
					};
					
					// act
					oTransportation.importData(mTables, mParameters);
					
					// assert
					jasmine.log("Checking t_metadata");
					var oMetadataDbData = mockstar.execQuery("select path,business_object,column_id,is_custom,rollup_type_id, \
																	side_panel_group_id, display_order, table_display_order, \
																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,\
																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, \
																	property_type,is_usable_in_formula from {{metadata}} \
																	where path = 'Item' and business_object = 'Item' and is_custom = 1");
					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
					expect(oMetadataDbDataArray).toEqualObject(oAddedFieldMetadata);
					
					jasmine.log("Checking t_metadata__text");
					var oMetadataTextDbData = mockstar.execQuery("	select path, column_id, language, display_name, display_description \
																	from {{metadata_text}} where (path, column_id) in ( \
																		select path, column_id from {{metadata}}  \
																		where path = 'Item' and business_object = 'Item' and is_custom = 1\
																	)");
					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
					expect(oMetadataTextDbDataArray).toEqualObject(oAddedFieldMetadataText);															
					
					
					jasmine.log("Checking t_metadata_item_attributes");
					var oMetadataAttributesDbData = mockstar.execQuery("select path,business_object,column_id,item_category_id,subitem_state,default_value,\
																		is_read_only,is_mandatory \
																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( \
																			select path, business_object, column_id from {{metadata}}  \
																			where path = 'Item' and business_object = 'Item' and is_custom = 1\
																		)");
					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
					expect(oMetadataAttributesDbDataArray).toEqualObject(oAddedFieldMetadataAttributes);		
				});

				it('import with added CUST_ADDED and mode=append --> check that the delete of layout data for custom fields is NOT done', function () {
					var oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
						"PATH":                             "Item",
						"BUSINESS_OBJECT":                  "Item",
						"COLUMN_ID":                        "CUST_ADDED",
						"IS_CUSTOM":                        1,
						"ROLLUP_TYPE_ID":                   0,
						"SIDE_PANEL_GROUP_ID":              101,
						"DISPLAY_ORDER":                    2,
						"TABLE_DISPLAY_ORDER":              3,
						"SEMANTIC_DATA_TYPE":               "Decimal",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "precision=24; scale=7",
						"REF_UOM_CURRENCY_PATH":            null,
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
						"REF_UOM_CURRENCY_COLUMN_ID":       null,
						"UOM_CURRENCY_FLAG":                null,
						"PROPERTY_TYPE":                    6,
						"IS_USABLE_IN_FORMULA":             1
					});

					var oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
						"PATH"               : "Item",
						"COLUMN_ID"          : "CUST_ADDED",
						"LANGUAGE"           : "DE",
						"DISPLAY_NAME"       : "Hinzugefügt",
						"DISPLAY_DESCRIPTION": "Bestes CF wo gibt"
					});
					oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(oAddedFieldMetadataText, {
						"PATH"               : "Item",
						"COLUMN_ID"          : "CUST_ADDED",
						"LANGUAGE"           : "EN",
						"DISPLAY_NAME"       : "added",
						"DISPLAY_DESCRIPTION": "Best CF ever"
					});

					var oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
						"PATH":             "Item",
						"BUSINESS_OBJECT":  "Item",
						"COLUMN_ID":        "CUST_ADDED",
						"ITEM_CATEGORY_ID": 2,
						"SUBITEM_STATE":     -1,
						"DEFAULT_VALUE":    null,
						"IS_READ_ONLY":     0,
						"IS_MANDATORY":		0
					});

					var mTables = {
						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
					};
					var mParameters = {
						mode: "append"
					};

					const oLayoutColumnsAllBeforeImport = mockstar.execQuery("select * from {{layout_columns}}");
					expect(oLayoutColumnsAllBeforeImport.columns.COLUMN_ID.rows.length).toBe(7);

					const oLayoutHiddenFieldsAllBeforeImport = mockstar.execQuery("select * from {{layout_hidden_field}}");
					expect(oLayoutHiddenFieldsAllBeforeImport.columns.COLUMN_ID.rows.length).toBe(3);	

					const oLayoutColumnsBeforeImport = mockstar.execQuery("select * from {{layout_columns}} where COLUMN_ID = '" +sCustomField+ "'");
					expect(oLayoutColumnsBeforeImport.columns.COLUMN_ID.rows.length).toBe(2);

					const oLayoutHiddenFieldsBeforeImport = mockstar.execQuery("select * from {{layout_hidden_field}} where COLUMN_ID = '" +sCustomField+ "'");
					expect(oLayoutHiddenFieldsBeforeImport.columns.COLUMN_ID.rows.length).toBe(2);

					// act
					oTransportation.importData(mTables, mParameters);

					// assert
					const oLayoutColumnsAllAfterImport = mockstar.execQuery("select * from {{layout_columns}}");
					expect(oLayoutColumnsAllAfterImport.columns.COLUMN_ID.rows.length).toBe(7);

					const oLayoutHiddenFieldsAllAfterImport = mockstar.execQuery("select * from {{layout_hidden_field}}");
					expect(oLayoutHiddenFieldsAllAfterImport.columns.COLUMN_ID.rows.length).toBe(3);

					const oLayoutColumnsAfterImport = mockstar.execQuery("select * from {{layout_columns}} where COLUMN_ID = '" +sCustomField+ "'");
					expect(oLayoutColumnsAfterImport.columns.COLUMN_ID.rows.length).toBe(2);

					const oLayoutHiddenFieldsAfterImport = mockstar.execQuery("select * from {{layout_hidden_field}} where COLUMN_ID = '" +sCustomField+ "'");
					expect(oLayoutHiddenFieldsAfterImport.columns.COLUMN_ID.rows.length).toBe(2);
				});
				
				it('import with modified custom field CUST_TEST and mode=replace --> custom field modified in t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
					var oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [3,4]), {
						"PATH":                             "Item",
						"BUSINESS_OBJECT":                  "Item",
						"COLUMN_ID":                        "CUST_TEST",
						"IS_CUSTOM":                        1,
						"ROLLUP_TYPE_ID":                   0,
						"SIDE_PANEL_GROUP_ID":              101,
						"DISPLAY_ORDER":                    2,
						"TABLE_DISPLAY_ORDER":              3,
						"SEMANTIC_DATA_TYPE":               "String",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "length=10",
						"REF_UOM_CURRENCY_PATH":            "", // empty string should also work
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "", // empty string should also work
						"REF_UOM_CURRENCY_COLUMN_ID":       "", // empty string should also work
						"UOM_CURRENCY_FLAG":                null,
						"PROPERTY_TYPE":                    5, // modification
						"IS_USABLE_IN_FORMULA":             1,
					});
					
					// Preselect EN for CUST_TEST && EN+DE for CUST_TEST2; Add DE for CUST_TEST with modified description
					var oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [3,4,5]), {
						"PATH"               : "Item",
						"COLUMN_ID"          : "CUST_TEST",
						"LANGUAGE"           : "DE",
						"DISPLAY_NAME"       : "Hinzugefügt",
						"DISPLAY_DESCRIPTION": "modifiziert" // modification
					});
					
					var oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [4,5]), {
						"PATH":             "Item",
						"BUSINESS_OBJECT":  "Item",
						"COLUMN_ID":        "CUST_TEST",
						"ITEM_CATEGORY_ID": 1, // modification
						"SUBITEM_STATE":     -1,
						"DEFAULT_VALUE":    null,
						"IS_READ_ONLY":     0,
						"IS_MANDATORY":		0
					});
					
					var mTables = {
						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID")
					};
					
					var mParameters = {
						mode: "replace"
					}
					
					// act
					oTransportation.importData(mTables, mParameters);
					
					// assert
					jasmine.log("Checking t_metadata");
					var oMetadataDbData = mockstar.execQuery("select path,business_object,column_id,is_custom,rollup_type_id, \
																	side_panel_group_id, display_order, table_display_order, \
																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,\
																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, \
																	property_type,is_usable_in_formula from {{metadata}} \
																	where path = 'Item' and business_object = 'Item' and is_custom = 1");
					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);
					// have to rely on toMatchData matcher since the row order is random and it cannot guranteed that CUST_TEST is in the last row
					// as in the test data										
					expect(oMetadataDbDataArray).toMatchData(oAddedFieldMetadata, ["PATH", "BUSINESS_OBJECT", "COLUMN_ID"]);
					
					jasmine.log("Checking t_metadata__text");
					var oMetadataTextDbData = mockstar.execQuery("	select path, column_id, language, display_name, display_description \
					 												from {{metadata_text}} where (path, column_id) in ( \
																		select path, column_id from {{metadata}}  \
																		where path = 'Item' and business_object = 'Item' and is_custom = 1\
																	)");
					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
					expect(oMetadataTextDbDataArray).toMatchData(oAddedFieldMetadataText, ["PATH", "COLUMN_ID", "LANGUAGE"]);															
					
					
					jasmine.log("Checking t_metadata_item_attributes");
					var oMetadataAttributesDbData = mockstar.execQuery("select path,business_object,column_id,item_category_id,subitem_state,default_value, \
																		is_read_only,is_mandatory \
					 													from {{metadata_item_attributes}} where (path, business_object, column_id) in ( \
																			select path, business_object, column_id from {{metadata}}  \
																			where path = 'Item' and business_object = 'Item' and is_custom = 1\
																		)");
					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
					expect(oMetadataAttributesDbDataArray).toMatchData(oAddedFieldMetadataAttributes, ["PATH", "BUSINESS_OBJECT", "COLUMN_ID"]);									
				});
				
				it('import with modified custom field CUST_TEST and mode=replace --> check that the delete of layout data for custom fields is done', function () {
					const oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [3,4]), {
						"PATH":                             "Item",
						"BUSINESS_OBJECT":                  "Item",
						"COLUMN_ID":                        "CUST_TEST",
						"IS_CUSTOM":                        1,
						"ROLLUP_TYPE_ID":                   0,
						"SIDE_PANEL_GROUP_ID":              101,
						"DISPLAY_ORDER":                    2,
						"TABLE_DISPLAY_ORDER":              3,
						"SEMANTIC_DATA_TYPE":               "String",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "length=10",
						"REF_UOM_CURRENCY_PATH":            "", // empty string should also work
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "", // empty string should also work
						"REF_UOM_CURRENCY_COLUMN_ID":       "", // empty string should also work
						"UOM_CURRENCY_FLAG":                null,
						"PROPERTY_TYPE":                    5, // modification
						"IS_USABLE_IN_FORMULA":             1,
					});

					// Preselect EN for CUST_TEST && EN+DE for CUST_TEST2; Add DE for CUST_TEST with modified description
					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [3,4,5]), {
						"PATH"               : "Item",
						"COLUMN_ID"          : "CUST_TEST",
						"LANGUAGE"           : "DE",
						"DISPLAY_NAME"       : "Hinzugefügt",
						"DISPLAY_DESCRIPTION": "modifiziert" // modification
					});

					const oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [4,5]), {
						"PATH":             "Item",
						"BUSINESS_OBJECT":  "Item",
						"COLUMN_ID":        "CUST_TEST",
						"ITEM_CATEGORY_ID": 1, // modification
						"SUBITEM_STATE":     -1,
						"DEFAULT_VALUE":    null,
						"IS_READ_ONLY":     0,
						"IS_MANDATORY":		0
					});

					const mTables = {
						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID")
					};

					const mParameters = {
						mode: "replace"
					}
					// assert
					const oLayoutColumnsBeforeImport = mockstar.execQuery("select * from {{layout_columns}} where COLUMN_ID = '" +sCustomField+ "'");
					expect(oLayoutColumnsBeforeImport.columns.COLUMN_ID.rows.length).toBe(2);

					const oLayoutHiddenFieldsBeforeImport = mockstar.execQuery("select * from {{layout_hidden_field}} where COLUMN_ID = '" +sCustomField+ "'");
					expect(oLayoutHiddenFieldsBeforeImport.columns.COLUMN_ID.rows.length).toBe(2);	

					const oLayoutColumnsAllBeforeImport = mockstar.execQuery("select * from {{layout_columns}}");
					expect(oLayoutColumnsAllBeforeImport.columns.COLUMN_ID.rows.length).toBe(7);

					const oLayoutHiddenFieldsAllBeforeImport = mockstar.execQuery("select * from {{layout_hidden_field}}");
					expect(oLayoutHiddenFieldsAllBeforeImport.columns.COLUMN_ID.rows.length).toBe(3);

					// act
					oTransportation.importData(mTables, mParameters);

					// assert
					const oLayoutColumnsAfterImport = mockstar.execQuery("select * from {{layout_columns}} where COLUMN_ID = '" +sCustomField+ "'");
					expect(oLayoutColumnsAfterImport.columns.COLUMN_ID.rows.length).toBe(0);

					const oLayoutHiddenFieldsAfterImport = mockstar.execQuery("select * from {{layout_hidden_field}} where COLUMN_ID = '" +sCustomField+ "'");
					expect(oLayoutHiddenFieldsAfterImport.columns.COLUMN_ID.rows.length).toBe(0);

					const oLayoutColumnsAllAfterImport = mockstar.execQuery("select * from {{layout_columns}}");
					expect(oLayoutColumnsAllAfterImport.columns.COLUMN_ID.rows.length).toBe(5);

					const oLayoutHiddenFieldsAllAfterImport = mockstar.execQuery("select * from {{layout_hidden_field}}");
					expect(oLayoutHiddenFieldsAllAfterImport.columns.COLUMN_ID.rows.length).toBe(1);
				});
				
				it('import with added formula for CUST_TEST2 and mode=append --> formula added to t_formula; existing formula kept', function () {
					// arrange
					var oExistingCFMetadata = pickFromTableData(oMetadataTableData, [2,3,4]);
					var oExistingCFMetadataText = pickFromTableData(oMetadataTextTableData, [2,3,4,5]);
					var oExistingCFMetadataAttributes = pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]);
					var oAddedFormula = mockstar_helpers.addRowToTableData(oFormulaTableData, {
						"FORMULA_ID": 42, // formula_id must be ignored
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST2",
						"ITEM_CATEGORY_ID": 2,
						"IS_FORMULA_USED": 1,
						"FORMULA_STRING": "if('foo'='foo'; 1; 3)",
						"FORMULA_DESCRIPTION": "Formula added",
					});
					
					var mTables = {
						t_metadata: tableDataToImportData(oExistingCFMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oExistingCFMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oExistingCFMetadataAttributes, "COLUMN_ID"),
						t_formula : tableDataToImportData(oAddedFormula, "COLUMN_ID")
					};
					
					var mParameters = {
						mode: "append"
					}
					
					// act
					oTransportation.importData(mTables, mParameters);
					
					// assert
					var oFormulaDbData = mockstar.execQuery("select * from {{formula}} where path = 'Item' and business_object = 'Item' order by formula_id");
					var oFormulaDbDataArray = mockstar_helpers.convertResultToArray(oFormulaDbData);
					
					// omit formula id for the comparison, since that one is re-generated during import
					expect(_.omit(oFormulaDbDataArray, "FORMULA_ID")).toEqualObject(_.omit(oAddedFormula, "FORMULA_ID"));
				});
				
				it('import with only one new formula for CUST_TEST2 and mode=replace --> formula replaces all existing formulas in t_formula', function () {
					// arrange
					var oNewFormula = {
						"FORMULA_ID": [1],
						"PATH": ["Item"],
						"BUSINESS_OBJECT": ["Item"],
						"COLUMN_ID": ["CUST_TEST2"],
						"ITEM_CATEGORY_ID": [2],
						"IS_FORMULA_USED": [1],
						"FORMULA_STRING": ["1+1"],
						"FORMULA_DESCRIPTION": ["new formula"],
					};
					
					var mTables = {
						t_formula : tableDataToImportData(oNewFormula, "COLUMN_ID")
					};
					var mParameters = {
						mode: "replace"
					}
					
					// act
					oTransportation.importData(mTables, mParameters);
					
					// assert
					var oFormulaDbData = mockstar.execQuery("select * from {{formula}} where path = 'Item' and business_object = 'Item'");
					var oFormulaDbDataArray = mockstar_helpers.convertResultToArray(oFormulaDbData);
					
					expect(oFormulaDbData.columns.FORMULA_ID.rows.length).toBe(1);
					// omit formula id for the comparison, since that one is re-generated during import
					expect(_.omit(oFormulaDbDataArray, "FORMULA_ID")).toEqualObject(_.omit(oNewFormula, "FORMULA_ID"));
				});
				
				it('import modified formula for CUST_TEST and mode=replace --> formula contains modified data; formula_id stays the same', function () {
					// arrange
					var oExistingCFMetadata = pickFromTableData(oMetadataTableData, [2,3,4]);
					var oExistingCFMetadataText = pickFromTableData(oMetadataTextTableData, [2,3,4,5]);
					var oExistingCFMetadataAttributes = pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]);
					var oModifiedFormula = _.extend({}, pickFromTableData(oFormulaTableData, [1]), {
						"FORMULA_DESCRIPTION": ["modified description"]
					}); 
					
					var mTables = {
						t_metadata: tableDataToImportData(oExistingCFMetadata, "COLUMN_ID"),
						t_metadata__text : tableDataToImportData(oExistingCFMetadataText, "COLUMN_ID"),
						t_metadata_item_attributes : tableDataToImportData(oExistingCFMetadataAttributes, "COLUMN_ID"),
						t_formula : tableDataToImportData(oModifiedFormula, "COLUMN_ID")
					};
					
					var mParameters = {
						mode: "replace"
					}
					
					// act
					oTransportation.importData(mTables, mParameters);
					
					// assert
					var oFormulaDbData = mockstar.execQuery("select * from {{formula}} where path = 'Item' and business_object = 'Item'");
					var oFormulaDbDataArray = mockstar_helpers.convertResultToArray(oFormulaDbData);
					
					expect(oFormulaDbData.columns.FORMULA_ID.rows.length).toBe(1);
					expect(oFormulaDbDataArray).toEqualObject(oModifiedFormula);
				});
				
				it('import with removed CUST_TEST and mode=replace --> custom field removed from t_metadata, t_metadata__text, t_metadata_item_attributes, t_formula', function () {
						// arrange
						
						// only pick the data for CUST_TEST2 and CUST_TEST2_UNIT; => CUST_TEST should be removed; PLANT_ID must be stay unchanged, since it is no custom field
						var aMetadataImportData = tableDataToImportData(pickFromTableData(oMetadataTableData, [3, 4]), "COLUMN_ID");
						var aMetadataTextImportData = tableDataToImportData(pickFromTableData(oMetadataTextTableData, [4, 5]), "COLUMN_ID");
						var aMetadataAttributesImportData = tableDataToImportData(pickFromTableData(oMetadataItemAttributesTableData, [4, 5]), "COLUMN_ID");
						var aFormulaImportData = tableDataToImportData(pickFromTableData(oFormulaTableData, [0]), "COLUMN_ID");
						var mTables = {
							t_metadata: aMetadataImportData,
							t_metadata__text : aMetadataTextImportData,
							t_metadata_item_attributes : aMetadataAttributesImportData,
							t_formula : aFormulaImportData
						};
						
						var mParameters = {
							mode: "replace"
						}
						
						// act
						oTransportation.importData(mTables, mParameters);
						
						// assert
						jasmine.log("Checking t_metadata");
						var oMetadataDbData = mockstar.execQuery("select column_id from {{metadata}} where path = 'Item' and business_object = 'Item'");
						expectIsContainedInResultSet(oMetadataDbData, "COLUMN_ID", {
							"PLANT_ID" : true,
							"PRICE_FIXED_PORTION" : true,
							"CUST_TEST2" : true,
							"CUST_TEST2_UNIT" : true,
							"CUST_TEST" : false
						});

						
						jasmine.log("Checking t_metadata__text");
						var oMetadataTextDbData = mockstar.execQuery("select column_id from {{metadata_text}} where path = 'Item'");
						expectIsContainedInResultSet(oMetadataTextDbData, "COLUMN_ID", {
							"PLANT_ID" : true,
							"PRICE_FIXED_PORTION" : true,
							"CUST_TEST2" : true,
							"CUST_TEST" : false
						});						
						
						jasmine.log("Checking t_metadata_item_attributes");
						var oMetadataAttributesDbData = mockstar.execQuery("select column_id from {{metadata_item_attributes}} where path = 'Item' and business_object = 'Item'");
						expectIsContainedInResultSet(oMetadataAttributesDbData, "COLUMN_ID", {
							"PLANT_ID" : true,
							"PRICE_FIXED_PORTION" : true,
							"CUST_TEST2" : true,
							"CUST_TEST2_UNIT" : true,
							"CUST_TEST" : false
						});	
						
						jasmine.log("Checking t_formula");
						var oFormulaDbData = mockstar.execQuery("select column_id from {{formula}} where path = 'Item' and business_object = 'Item'");
						expectIsContainedInResultSet(oFormulaDbData, "COLUMN_ID", {
							"PRICE_FIXED_PORTION" : true,
							"CUST_TEST" : false
						});
					});

                describe('masterdata custom fields', function(){
                    it('import with added CMAT_ADDED and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					const oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Material",
    						"BUSINESS_OBJECT":                  "Material",
    						"COLUMN_ID":                        "CMAT_ADDED",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "Decimal",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "precision=24; scale=7",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                null,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Material",
    						"COLUMN_ID"          : "CMAT_ADDED",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Material custom cff",
    						"DISPLAY_DESCRIPTION": "Material CFF"
    					});
    					
    					const oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Material",
    						"BUSINESS_OBJECT":  "Material",
    						"COLUMN_ID":        "CMAT_ADDED",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Material"],
    						"BUSINESS_OBJECT":                  ["Material"],
    						"COLUMN_ID":                        ["CMAT_ADDED"],
    						"IS_CUSTOM":                        [1],
    						"ROLLUP_TYPE_ID":                   [0],
    						"SIDE_PANEL_GROUP_ID":              [101],
    						"DISPLAY_ORDER":                    [2],
    						"TABLE_DISPLAY_ORDER":              [3],
    						"SEMANTIC_DATA_TYPE":               ["Decimal"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    ["precision=24; scale=7"],
    						"REF_UOM_CURRENCY_PATH":            [null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       [null],
    						"UOM_CURRENCY_FLAG":                [null],
    						"PROPERTY_TYPE":                    [6],
    						"IS_USABLE_IN_FORMULA":             [1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Material"],
    						"COLUMN_ID"          : ["CMAT_ADDED"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Material custom cff"],
    						"DISPLAY_DESCRIPTION": ["Material CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Material"],
    						"BUSINESS_OBJECT":  ["Material"],
    						"COLUMN_ID":        ["CMAT_ADDED"],
    						"ITEM_CATEGORY_ID": [2],
    						"SUBITEM_STATE":     [-1],
    						"DEFAULT_VALUE":    [null],
    						"IS_READ_ONLY":     [0],
    						"IS_MANDATORY":		[0]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Material' and business_object = 'Material' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Material' and business_object = 'Material' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Material' and business_object = 'Material' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CMPL_ADDED and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					const oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Material_Plant",
    						"BUSINESS_OBJECT":                  "Material_Plant",
    						"COLUMN_ID":                        "CMPL_ADDED",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "Decimal",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "precision=24; scale=7",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                null,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Material_Plant",
    						"COLUMN_ID"          : "CMPL_ADDED",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Material Plant custom cff",
    						"DISPLAY_DESCRIPTION": "Material Plant CFF"
    					});
    					
    					const oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Material_Plant",
    						"BUSINESS_OBJECT":  "Material_Plant",
    						"COLUMN_ID":        "CMPL_ADDED",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Material_Plant"],
    						"BUSINESS_OBJECT":                  ["Material_Plant"],
    						"COLUMN_ID":                        ["CMPL_ADDED"],
    						"IS_CUSTOM":                        [1],
    						"ROLLUP_TYPE_ID":                   [0],
    						"SIDE_PANEL_GROUP_ID":              [101],
    						"DISPLAY_ORDER":                    [2],
    						"TABLE_DISPLAY_ORDER":              [3],
    						"SEMANTIC_DATA_TYPE":               ["Decimal"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    ["precision=24; scale=7"],
    						"REF_UOM_CURRENCY_PATH":            [null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       [null],
    						"UOM_CURRENCY_FLAG":                [null],
    						"PROPERTY_TYPE":                    [6],
    						"IS_USABLE_IN_FORMULA":             [1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Material_Plant"],
    						"COLUMN_ID"          : ["CMPL_ADDED"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Material Plant custom cff"],
    						"DISPLAY_DESCRIPTION": ["Material Plant CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Material_Plant"],
    						"BUSINESS_OBJECT":  ["Material_Plant"],
    						"COLUMN_ID":        ["CMPL_ADDED"],
    						"ITEM_CATEGORY_ID": [2],
    						"SUBITEM_STATE":     [-1],
    						"DEFAULT_VALUE":    [null],
    						"IS_READ_ONLY":     [0],
    						"IS_MANDATORY":		[0]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Material_Plant' and business_object = 'Material_Plant' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Material_Plant' and business_object = 'Material_Plant' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Material_Plant' and business_object = 'Material_Plant' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CMPR_ADDED and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					const oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Material_Price",
    						"BUSINESS_OBJECT":                  "Material_Price",
    						"COLUMN_ID":                        "CMPR_ADDED",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "Decimal",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "precision=24; scale=7",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                null,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Material_Price",
    						"COLUMN_ID"          : "CMPR_ADDED",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Material Price custom cff",
    						"DISPLAY_DESCRIPTION": "Material Price CFF"
    					});
    					
    					const oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Material_Price",
    						"BUSINESS_OBJECT":  "Material_Price",
    						"COLUMN_ID":        "CMPR_ADDED",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Material_Price"],
    						"BUSINESS_OBJECT":                  ["Material_Price"],
    						"COLUMN_ID":                        ["CMPR_ADDED"],
    						"IS_CUSTOM":                        [1],
    						"ROLLUP_TYPE_ID":                   [0],
    						"SIDE_PANEL_GROUP_ID":              [101],
    						"DISPLAY_ORDER":                    [2],
    						"TABLE_DISPLAY_ORDER":              [3],
    						"SEMANTIC_DATA_TYPE":               ["Decimal"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    ["precision=24; scale=7"],
    						"REF_UOM_CURRENCY_PATH":            [null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       [null],
    						"UOM_CURRENCY_FLAG":                [null],
    						"PROPERTY_TYPE":                    [6],
    						"IS_USABLE_IN_FORMULA":             [1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Material_Price"],
    						"COLUMN_ID"          : ["CMPR_ADDED"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Material Price custom cff"],
    						"DISPLAY_DESCRIPTION": ["Material Price CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Material_Price"],
    						"BUSINESS_OBJECT":  ["Material_Price"],
    						"COLUMN_ID":        ["CMPR_ADDED"],
    						"ITEM_CATEGORY_ID": [2],
    						"SUBITEM_STATE":     [-1],
    						"DEFAULT_VALUE":    [null],
    						"IS_READ_ONLY":     [0],
    						"IS_MANDATORY":		[0]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Material_Price' and business_object = 'Material_Price' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Material_Price' and business_object = 'Material_Price' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Material_Price' and business_object = 'Material_Price' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CCEN_ADDED and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					const oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Cost_Center",
    						"BUSINESS_OBJECT":                  "Cost_Center",
    						"COLUMN_ID":                        "CCEN_ADDED",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "Decimal",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "precision=24; scale=7",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                null,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Cost_Center",
    						"COLUMN_ID"          : "CCEN_ADDED",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Cost Center custom cff",
    						"DISPLAY_DESCRIPTION": "Cost Center CFF"
    					});
    					
    					const oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Cost_Center",
    						"BUSINESS_OBJECT":  "Cost_Center",
    						"COLUMN_ID":        "CCEN_ADDED",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Cost_Center"],
    						"BUSINESS_OBJECT":                  ["Cost_Center"],
    						"COLUMN_ID":                        ["CCEN_ADDED"],
    						"IS_CUSTOM":                        [1],
    						"ROLLUP_TYPE_ID":                   [0],
    						"SIDE_PANEL_GROUP_ID":              [101],
    						"DISPLAY_ORDER":                    [2],
    						"TABLE_DISPLAY_ORDER":              [3],
    						"SEMANTIC_DATA_TYPE":               ["Decimal"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    ["precision=24; scale=7"],
    						"REF_UOM_CURRENCY_PATH":            [null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       [null],
    						"UOM_CURRENCY_FLAG":                [null],
    						"PROPERTY_TYPE":                    [6],
    						"IS_USABLE_IN_FORMULA":             [1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Cost_Center"],
    						"COLUMN_ID"          : ["CCEN_ADDED"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Cost Center custom cff"],
    						"DISPLAY_DESCRIPTION": ["Cost Center CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Cost_Center"],
    						"BUSINESS_OBJECT":  ["Cost_Center"],
    						"COLUMN_ID":        ["CCEN_ADDED"],
    						"ITEM_CATEGORY_ID": [2],
    						"SUBITEM_STATE":     [-1],
    						"DEFAULT_VALUE":    [null],
    						"IS_READ_ONLY":     [0],
    						"IS_MANDATORY":		[0]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Cost_Center' and business_object = 'Cost_Center' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Cost_Center' and business_object = 'Cost_Center' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Cost_Center' and business_object = 'Cost_Center' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
                        
                    it('import with added CWCE_ADDED and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					const oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Work_Center",
    						"BUSINESS_OBJECT":                  "Work_Center",
    						"COLUMN_ID":                        "CWCE_ADDED",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "Decimal",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "precision=24; scale=7",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                null,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Work_Center",
    						"COLUMN_ID"          : "CWCE_ADDED",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added work center",
    						"DISPLAY_DESCRIPTION": "Best CF ever"
    					});
    					
    					const oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Work_Center",
    						"BUSINESS_OBJECT":  "Work_Center",
    						"COLUMN_ID":        "CWCE_ADDED",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Work_Center"],
    						"BUSINESS_OBJECT":                  ["Work_Center"],
    						"COLUMN_ID":                        ["CWCE_ADDED"],
    						"IS_CUSTOM":                        [1],
    						"ROLLUP_TYPE_ID":                   [0],
    						"SIDE_PANEL_GROUP_ID":              [101],
    						"DISPLAY_ORDER":                    [2],
    						"TABLE_DISPLAY_ORDER":              [3],
    						"SEMANTIC_DATA_TYPE":               ["Decimal"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    ["precision=24; scale=7"],
    						"REF_UOM_CURRENCY_PATH":            [null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       [null],
    						"UOM_CURRENCY_FLAG":                [null],
    						"PROPERTY_TYPE":                    [6],
    						"IS_USABLE_IN_FORMULA":             [1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Work_Center"],
    						"COLUMN_ID"          : ["CWCE_ADDED"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added work center"],
    						"DISPLAY_DESCRIPTION": ["Best CF ever"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Work_Center"],
    						"BUSINESS_OBJECT":  ["Work_Center"],
    						"COLUMN_ID":        ["CWCE_ADDED"],
    						"ITEM_CATEGORY_ID": [2],
    						"SUBITEM_STATE":     [-1],
    						"DEFAULT_VALUE":    [null],
    						"IS_READ_ONLY":     [0],
    						"IS_MANDATORY":		[0]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Work_Center' and business_object = 'Work_Center' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Work_Center' and business_object = 'Work_Center' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Work_Center' and business_object = 'Work_Center' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CAPR_ADDED and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					const oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Activity_Price",
    						"BUSINESS_OBJECT":                  "Activity_Price",
    						"COLUMN_ID":                        "CAPR_ADDED",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "Decimal",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "precision=24; scale=7",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                null,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Activity_Price",
    						"COLUMN_ID"          : "CAPR_ADDED",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added activity price custom cff",
    						"DISPLAY_DESCRIPTION": "Activity Price CFF"
    					});
    					
    					const oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Activity_Price",
    						"BUSINESS_OBJECT":  "Activity_Price",
    						"COLUMN_ID":        "CAPR_ADDED",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Activity_Price"],
    						"BUSINESS_OBJECT":                  ["Activity_Price"],
    						"COLUMN_ID":                        ["CAPR_ADDED"],
    						"IS_CUSTOM":                        [1],
    						"ROLLUP_TYPE_ID":                   [0],
    						"SIDE_PANEL_GROUP_ID":              [101],
    						"DISPLAY_ORDER":                    [2],
    						"TABLE_DISPLAY_ORDER":              [3],
    						"SEMANTIC_DATA_TYPE":               ["Decimal"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    ["precision=24; scale=7"],
    						"REF_UOM_CURRENCY_PATH":            [null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       [null],
    						"UOM_CURRENCY_FLAG":                [null],
    						"PROPERTY_TYPE":                    [6],
    						"IS_USABLE_IN_FORMULA":             [1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Activity_Price"],
    						"COLUMN_ID"          : ["CAPR_ADDED"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added activity price custom cff"],
    						"DISPLAY_DESCRIPTION": ["Activity Price CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Activity_Price"],
    						"BUSINESS_OBJECT":  ["Activity_Price"],
    						"COLUMN_ID":        ["CAPR_ADDED"],
    						"ITEM_CATEGORY_ID": [2],
    						"SUBITEM_STATE":     [-1],
    						"DEFAULT_VALUE":    [null],
    						"IS_READ_ONLY":     [0],
    						"IS_MANDATORY":		[0]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Activity_Price' and business_object = 'Activity_Price' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Activity_Price' and business_object = 'Activity_Price' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Activity_Price' and business_object = 'Activity_Price' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CMAT_BOOLEAN and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					let oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Material",
    						"BUSINESS_OBJECT":                  "Material",
    						"COLUMN_ID":                        "CMAT_BOOLEAN",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "BooleanInt",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    null,
    						"REF_UOM_CURRENCY_PATH":            "Material",
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Material",
    						"REF_UOM_CURRENCY_COLUMN_ID":       "CMAT_BOOLEAN_UNIT",
    						"UOM_CURRENCY_FLAG":                0,
    						"PROPERTY_TYPE":                    2,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					oAddedFieldMetadata = mockstar_helpers.addRowToTableData(oAddedFieldMetadata, {
    					    "PATH":                             "Material",
    						"BUSINESS_OBJECT":                  "Material",
    						"COLUMN_ID":                        "CMAT_BOOLEAN_UNIT",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              null,
    						"DISPLAY_ORDER":                    null,
    						"TABLE_DISPLAY_ORDER":              null,
    						"SEMANTIC_DATA_TYPE":               "String",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "length=3",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                1,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Material",
    						"COLUMN_ID"          : "CMAT_BOOLEAN",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Material custom cff",
    						"DISPLAY_DESCRIPTION": "Material CFF"
    					});
    					
    					let oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Material",
    						"BUSINESS_OBJECT":  "Material",
    						"COLUMN_ID":        "CMAT_BOOLEAN",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(oAddedFieldMetadataAttributes,{
    						"PATH":             "Material",
    						"BUSINESS_OBJECT":  "Material",
    						"COLUMN_ID":        "CMAT_BOOLEAN_UNIT",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    0,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		null
    					});
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Material", "Material"],
    						"BUSINESS_OBJECT":                  ["Material", "Material"],
    						"COLUMN_ID":                        ["CMAT_BOOLEAN", "CMAT_BOOLEAN_UNIT"],
    						"IS_CUSTOM":                        [1, 1],
    						"ROLLUP_TYPE_ID":                   [0, 0],
    						"SIDE_PANEL_GROUP_ID":              [101, null],
    						"DISPLAY_ORDER":                    [2, null],
    						"TABLE_DISPLAY_ORDER":              [3, null],
    						"SEMANTIC_DATA_TYPE":               ["BooleanInt", "String"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    [null, "length=3"],
    						"REF_UOM_CURRENCY_PATH":            ["Material", null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": ["Material", null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       ["CMAT_BOOLEAN_UNIT", null],
    						"UOM_CURRENCY_FLAG":                [0, 1],
    						"PROPERTY_TYPE":                    [2, 6],
    						"IS_USABLE_IN_FORMULA":             [1, 1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Material"],
    						"COLUMN_ID"          : ["CMAT_BOOLEAN"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Material custom cff"],
    						"DISPLAY_DESCRIPTION": ["Material CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Material", "Material"],
    						"BUSINESS_OBJECT":  ["Material", "Material"],
    						"COLUMN_ID":        ["CMAT_BOOLEAN", "CMAT_BOOLEAN_UNIT"],
    						"ITEM_CATEGORY_ID": [2, 2],
    						"SUBITEM_STATE":     [-1, -1],
    						"DEFAULT_VALUE":    [null, "0"],
    						"IS_READ_ONLY":     [0, 0],
    						"IS_MANDATORY":		[0, null]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Material' and business_object = 'Material' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Material' and business_object = 'Material' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Material' and business_object = 'Material' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CMPL_BOOLEAN and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					let oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Material_Plant",
    						"BUSINESS_OBJECT":                  "Material_Plant",
    						"COLUMN_ID":                        "CMPL_BOOLEAN",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "BooleanInt",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    null,
    						"REF_UOM_CURRENCY_PATH":            "Material_Plant",
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Material_Plant",
    						"REF_UOM_CURRENCY_COLUMN_ID":       "CMPL_BOOLEAN_UNIT",
    						"UOM_CURRENCY_FLAG":                0,
    						"PROPERTY_TYPE":                    2,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					oAddedFieldMetadata = mockstar_helpers.addRowToTableData(oAddedFieldMetadata, {
    					    "PATH":                             "Material_Plant",
    						"BUSINESS_OBJECT":                  "Material_Plant",
    						"COLUMN_ID":                        "CMPL_BOOLEAN_UNIT",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              null,
    						"DISPLAY_ORDER":                    null,
    						"TABLE_DISPLAY_ORDER":              null,
    						"SEMANTIC_DATA_TYPE":               "String",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "length=3",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                1,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Material_Plant",
    						"COLUMN_ID"          : "CMPL_BOOLEAN",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Material Plant custom cff",
    						"DISPLAY_DESCRIPTION": "Material CFF"
    					});
    					
    					let oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Material_Plant",
    						"BUSINESS_OBJECT":  "Material_Plant",
    						"COLUMN_ID":        "CMPL_BOOLEAN",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(oAddedFieldMetadataAttributes,{
    						"PATH":             "Material_Plant",
    						"BUSINESS_OBJECT":  "Material_Plant",
    						"COLUMN_ID":        "CMPL_BOOLEAN_UNIT",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    0,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		null
    					});
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Material_Plant", "Material_Plant"],
    						"BUSINESS_OBJECT":                  ["Material_Plant", "Material_Plant"],
    						"COLUMN_ID":                        ["CMPL_BOOLEAN", "CMPL_BOOLEAN_UNIT"],
    						"IS_CUSTOM":                        [1, 1],
    						"ROLLUP_TYPE_ID":                   [0, 0],
    						"SIDE_PANEL_GROUP_ID":              [101, null],
    						"DISPLAY_ORDER":                    [2, null],
    						"TABLE_DISPLAY_ORDER":              [3, null],
    						"SEMANTIC_DATA_TYPE":               ["BooleanInt", "String"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    [null, "length=3"],
    						"REF_UOM_CURRENCY_PATH":            ["Material_Plant", null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": ["Material_Plant", null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       ["CMPL_BOOLEAN_UNIT", null],
    						"UOM_CURRENCY_FLAG":                [0, 1],
    						"PROPERTY_TYPE":                    [2, 6],
    						"IS_USABLE_IN_FORMULA":             [1, 1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Material_Plant"],
    						"COLUMN_ID"          : ["CMPL_BOOLEAN"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Material Plant custom cff"],
    						"DISPLAY_DESCRIPTION": ["Material CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Material_Plant", "Material_Plant"],
    						"BUSINESS_OBJECT":  ["Material_Plant", "Material_Plant"],
    						"COLUMN_ID":        ["CMPL_BOOLEAN", "CMPL_BOOLEAN_UNIT"],
    						"ITEM_CATEGORY_ID": [2, 2],
    						"SUBITEM_STATE":     [-1, -1],
    						"DEFAULT_VALUE":    [null, "0"],
    						"IS_READ_ONLY":     [0, 0],
    						"IS_MANDATORY":		[0, null]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Material_Plant' and business_object = 'Material_Plant' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Material_Plant' and business_object = 'Material_Plant' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Material_Plant' and business_object = 'Material_Plant' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CMPR_BOOLEAN and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					let oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Material_Price",
    						"BUSINESS_OBJECT":                  "Material_Price",
    						"COLUMN_ID":                        "CMPR_BOOLEAN",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "BooleanInt",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    null,
    						"REF_UOM_CURRENCY_PATH":            "Material_Price",
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Material_Price",
    						"REF_UOM_CURRENCY_COLUMN_ID":       "CMPR_BOOLEAN_UNIT",
    						"UOM_CURRENCY_FLAG":                0,
    						"PROPERTY_TYPE":                    2,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					oAddedFieldMetadata = mockstar_helpers.addRowToTableData(oAddedFieldMetadata, {
    					    "PATH":                             "Material_Price",
    						"BUSINESS_OBJECT":                  "Material_Price",
    						"COLUMN_ID":                        "CMPR_BOOLEAN_UNIT",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              null,
    						"DISPLAY_ORDER":                    null,
    						"TABLE_DISPLAY_ORDER":              null,
    						"SEMANTIC_DATA_TYPE":               "String",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "length=3",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                1,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Material_Price",
    						"COLUMN_ID"          : "CMPR_BOOLEAN",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Material Price custom cff",
    						"DISPLAY_DESCRIPTION": "Material_Price CFF"
    					});
    					
    					let oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Material_Price",
    						"BUSINESS_OBJECT":  "Material_Price",
    						"COLUMN_ID":        "CMPR_BOOLEAN",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(oAddedFieldMetadataAttributes,{
    						"PATH":             "Material_Price",
    						"BUSINESS_OBJECT":  "Material_Price",
    						"COLUMN_ID":        "CMPR_BOOLEAN_UNIT",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    0,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		null
    					});
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Material_Price", "Material_Price"],
    						"BUSINESS_OBJECT":                  ["Material_Price", "Material_Price"],
    						"COLUMN_ID":                        ["CMPR_BOOLEAN", "CMPR_BOOLEAN_UNIT"],
    						"IS_CUSTOM":                        [1, 1],
    						"ROLLUP_TYPE_ID":                   [0, 0],
    						"SIDE_PANEL_GROUP_ID":              [101, null],
    						"DISPLAY_ORDER":                    [2, null],
    						"TABLE_DISPLAY_ORDER":              [3, null],
    						"SEMANTIC_DATA_TYPE":               ["BooleanInt", "String"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    [null, "length=3"],
    						"REF_UOM_CURRENCY_PATH":            ["Material_Price", null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": ["Material_Price", null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       ["CMPR_BOOLEAN_UNIT", null],
    						"UOM_CURRENCY_FLAG":                [0, 1],
    						"PROPERTY_TYPE":                    [2, 6],
    						"IS_USABLE_IN_FORMULA":             [1, 1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Material_Price"],
    						"COLUMN_ID"          : ["CMPR_BOOLEAN"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Material Price custom cff"],
    						"DISPLAY_DESCRIPTION": ["Material_Price CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Material_Price", "Material_Price"],
    						"BUSINESS_OBJECT":  ["Material_Price", "Material_Price"],
    						"COLUMN_ID":        ["CMPR_BOOLEAN", "CMPR_BOOLEAN_UNIT"],
    						"ITEM_CATEGORY_ID": [2, 2],
    						"SUBITEM_STATE":     [-1, -1],
    						"DEFAULT_VALUE":    [null, "0"],
    						"IS_READ_ONLY":     [0, 0],
    						"IS_MANDATORY":		[0, null]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Material_Price' and business_object = 'Material_Price' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Material_Price' and business_object = 'Material_Price' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Material_Price' and business_object = 'Material_Price' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CCEN_BOOLEAN and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					let oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Cost_Center",
    						"BUSINESS_OBJECT":                  "Cost_Center",
    						"COLUMN_ID":                        "CCEN_BOOLEAN",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "BooleanInt",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    null,
    						"REF_UOM_CURRENCY_PATH":            "Cost_Center",
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Cost_Center",
    						"REF_UOM_CURRENCY_COLUMN_ID":       "CCEN_BOOLEAN_UNIT",
    						"UOM_CURRENCY_FLAG":                0,
    						"PROPERTY_TYPE":                    2,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					oAddedFieldMetadata = mockstar_helpers.addRowToTableData(oAddedFieldMetadata, {
    					    "PATH":                             "Cost_Center",
    						"BUSINESS_OBJECT":                  "Cost_Center",
    						"COLUMN_ID":                        "CCEN_BOOLEAN_UNIT",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              null,
    						"DISPLAY_ORDER":                    null,
    						"TABLE_DISPLAY_ORDER":              null,
    						"SEMANTIC_DATA_TYPE":               "String",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "length=3",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                1,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Cost_Center",
    						"COLUMN_ID"          : "CCEN_BOOLEAN",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Cost_Center custom cff",
    						"DISPLAY_DESCRIPTION": "Cost_Center CFF"
    					});
    					
    					let oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Cost_Center",
    						"BUSINESS_OBJECT":  "Cost_Center",
    						"COLUMN_ID":        "CCEN_BOOLEAN",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(oAddedFieldMetadataAttributes,{
    						"PATH":             "Cost_Center",
    						"BUSINESS_OBJECT":  "Cost_Center",
    						"COLUMN_ID":        "CCEN_BOOLEAN_UNIT",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    0,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		null
    					});
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Cost_Center", "Cost_Center"],
    						"BUSINESS_OBJECT":                  ["Cost_Center", "Cost_Center"],
    						"COLUMN_ID":                        ["CCEN_BOOLEAN", "CCEN_BOOLEAN_UNIT"],
    						"IS_CUSTOM":                        [1, 1],
    						"ROLLUP_TYPE_ID":                   [0, 0],
    						"SIDE_PANEL_GROUP_ID":              [101, null],
    						"DISPLAY_ORDER":                    [2, null],
    						"TABLE_DISPLAY_ORDER":              [3, null],
    						"SEMANTIC_DATA_TYPE":               ["BooleanInt", "String"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    [null, "length=3"],
    						"REF_UOM_CURRENCY_PATH":            ["Cost_Center", null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": ["Cost_Center", null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       ["CCEN_BOOLEAN_UNIT", null],
    						"UOM_CURRENCY_FLAG":                [0, 1],
    						"PROPERTY_TYPE":                    [2, 6],
    						"IS_USABLE_IN_FORMULA":             [1, 1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Cost_Center"],
    						"COLUMN_ID"          : ["CCEN_BOOLEAN"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Cost_Center custom cff"],
    						"DISPLAY_DESCRIPTION": ["Cost_Center CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Cost_Center", "Cost_Center"],
    						"BUSINESS_OBJECT":  ["Cost_Center", "Cost_Center"],
    						"COLUMN_ID":        ["CCEN_BOOLEAN", "CCEN_BOOLEAN_UNIT"],
    						"ITEM_CATEGORY_ID": [2, 2],
    						"SUBITEM_STATE":     [-1, -1],
    						"DEFAULT_VALUE":    [null, "0"],
    						"IS_READ_ONLY":     [0, 0],
    						"IS_MANDATORY":		[0, null]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Cost_Center' and business_object = 'Cost_Center' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Cost_Center' and business_object = 'Cost_Center' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Cost_Center' and business_object = 'Cost_Center' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
    				
    				it('import with added CWCE_BOOLEAN and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					let oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Work_Center",
    						"BUSINESS_OBJECT":                  "Work_Center",
    						"COLUMN_ID":                        "CWCE_BOOLEAN",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "BooleanInt",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    null,
    						"REF_UOM_CURRENCY_PATH":            "Work_Center",
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Work_Center",
    						"REF_UOM_CURRENCY_COLUMN_ID":       "CWCE_BOOLEAN_UNIT",
    						"UOM_CURRENCY_FLAG":                0,
    						"PROPERTY_TYPE":                    2,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					oAddedFieldMetadata = mockstar_helpers.addRowToTableData(oAddedFieldMetadata, {
    					    "PATH":                             "Work_Center",
    						"BUSINESS_OBJECT":                  "Work_Center",
    						"COLUMN_ID":                        "CWCE_BOOLEAN_UNIT",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              null,
    						"DISPLAY_ORDER":                    null,
    						"TABLE_DISPLAY_ORDER":              null,
    						"SEMANTIC_DATA_TYPE":               "String",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "length=3",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                1,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Work_Center",
    						"COLUMN_ID"          : "CWCE_BOOLEAN",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Work_Center custom cff",
    						"DISPLAY_DESCRIPTION": "Work_Center CFF"
    					});
    					
    					let oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Work_Center",
    						"BUSINESS_OBJECT":  "Work_Center",
    						"COLUMN_ID":        "CWCE_BOOLEAN",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(oAddedFieldMetadataAttributes,{
    						"PATH":             "Work_Center",
    						"BUSINESS_OBJECT":  "Work_Center",
    						"COLUMN_ID":        "CWCE_BOOLEAN_UNIT",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    0,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		null
    					});
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Work_Center", "Work_Center"],
    						"BUSINESS_OBJECT":                  ["Work_Center", "Work_Center"],
    						"COLUMN_ID":                        ["CWCE_BOOLEAN", "CWCE_BOOLEAN_UNIT"],
    						"IS_CUSTOM":                        [1, 1],
    						"ROLLUP_TYPE_ID":                   [0, 0],
    						"SIDE_PANEL_GROUP_ID":              [101, null],
    						"DISPLAY_ORDER":                    [2, null],
    						"TABLE_DISPLAY_ORDER":              [3, null],
    						"SEMANTIC_DATA_TYPE":               ["BooleanInt", "String"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    [null, "length=3"],
    						"REF_UOM_CURRENCY_PATH":            ["Work_Center", null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": ["Work_Center", null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       ["CWCE_BOOLEAN_UNIT", null],
    						"UOM_CURRENCY_FLAG":                [0, 1],
    						"PROPERTY_TYPE":                    [2, 6],
    						"IS_USABLE_IN_FORMULA":             [1, 1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Work_Center"],
    						"COLUMN_ID"          : ["CWCE_BOOLEAN"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Work_Center custom cff"],
    						"DISPLAY_DESCRIPTION": ["Work_Center CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Work_Center", "Work_Center"],
    						"BUSINESS_OBJECT":  ["Work_Center", "Work_Center"],
    						"COLUMN_ID":        ["CWCE_BOOLEAN", "CWCE_BOOLEAN_UNIT"],
    						"ITEM_CATEGORY_ID": [2, 2],
    						"SUBITEM_STATE":     [-1, -1],
    						"DEFAULT_VALUE":    [null, "0"],
    						"IS_READ_ONLY":     [0, 0],
    						"IS_MANDATORY":		[0, null]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Work_Center' and business_object = 'Work_Center' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Work_Center' and business_object = 'Work_Center' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Work_Center' and business_object = 'Work_Center' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
					});
					
					it('import with added CAPR_BOOLEAN and mode=append --> custom field added to t_metadata, t_metadata__text, t_metadata_item_attributes', function () {
    					let oAddedFieldMetadata = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTableData, [2,3,4]), {
    						"PATH":                             "Activity_Price",
    						"BUSINESS_OBJECT":                  "Activity_Price",
    						"COLUMN_ID":                        "CAPR_BOOLEAN",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              101,
    						"DISPLAY_ORDER":                    2,
    						"TABLE_DISPLAY_ORDER":              3,
    						"SEMANTIC_DATA_TYPE":               "BooleanInt",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    null,
    						"REF_UOM_CURRENCY_PATH":            "Activity_Price",
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Activity_Price",
    						"REF_UOM_CURRENCY_COLUMN_ID":       "CAPR_BOOLEAN_UNIT",
    						"UOM_CURRENCY_FLAG":                0,
    						"PROPERTY_TYPE":                    2,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					oAddedFieldMetadata = mockstar_helpers.addRowToTableData(oAddedFieldMetadata, {
    					    "PATH":                             "Activity_Price",
    						"BUSINESS_OBJECT":                  "Activity_Price",
    						"COLUMN_ID":                        "CAPR_BOOLEAN_UNIT",
    						"IS_CUSTOM":                        1,
    						"ROLLUP_TYPE_ID":                   0,
    						"SIDE_PANEL_GROUP_ID":              null,
    						"DISPLAY_ORDER":                    null,
    						"TABLE_DISPLAY_ORDER":              null,
    						"SEMANTIC_DATA_TYPE":               "String",
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    "length=3",
    						"REF_UOM_CURRENCY_PATH":            null,
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
    						"REF_UOM_CURRENCY_COLUMN_ID":       null,
    						"UOM_CURRENCY_FLAG":                1,
    						"PROPERTY_TYPE":                    6,
    						"IS_USABLE_IN_FORMULA":             1
    					});
    					
    					const oAddedFieldMetadataText = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataTextTableData, [2,3,4,5,6]), {
    						"PATH"               : "Activity_Price",
    						"COLUMN_ID"          : "CAPR_BOOLEAN",
    						"LANGUAGE"           : "EN",
    						"DISPLAY_NAME"       : "Added Activity_Price custom cff",
    						"DISPLAY_DESCRIPTION": "Activity_Price CFF"
    					});
    					
    					let oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(pickFromTableData(oMetadataItemAttributesTableData, [2,3,4,5]), {
    						"PATH":             "Activity_Price",
    						"BUSINESS_OBJECT":  "Activity_Price",
    						"COLUMN_ID":        "CAPR_BOOLEAN",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    null,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		0
    					});
    					oAddedFieldMetadataAttributes = mockstar_helpers.addRowToTableData(oAddedFieldMetadataAttributes,{
    						"PATH":             "Activity_Price",
    						"BUSINESS_OBJECT":  "Activity_Price",
    						"COLUMN_ID":        "CAPR_BOOLEAN_UNIT",
    						"ITEM_CATEGORY_ID": 2,
    						"SUBITEM_STATE":     -1,
    						"DEFAULT_VALUE":    0,
    						"IS_READ_ONLY":     0,
    						"IS_MANDATORY":		null
    					});
    					const mTables = {
    						t_metadata: tableDataToImportData(oAddedFieldMetadata, "COLUMN_ID"),
    						t_metadata__text : tableDataToImportData(oAddedFieldMetadataText, "COLUMN_ID"),
    						t_metadata_item_attributes : tableDataToImportData(oAddedFieldMetadataAttributes, "COLUMN_ID"),
    						t_formula: tableDataToImportData(oFormulaTableData, "COLUMN_ID")
    					};
    					const mParameters = {
    						mode: "append"
    					};
    					
    					//expected data
    					
    					const oExpectedMetadataDbData = {
    						"PATH":                             ["Activity_Price", "Activity_Price"],
    						"BUSINESS_OBJECT":                  ["Activity_Price", "Activity_Price"],
    						"COLUMN_ID":                        ["CAPR_BOOLEAN", "CAPR_BOOLEAN_UNIT"],
    						"IS_CUSTOM":                        [1, 1],
    						"ROLLUP_TYPE_ID":                   [0, 0],
    						"SIDE_PANEL_GROUP_ID":              [101, null],
    						"DISPLAY_ORDER":                    [2, null],
    						"TABLE_DISPLAY_ORDER":              [3, null],
    						"SEMANTIC_DATA_TYPE":               ["BooleanInt", "String"],
    						"SEMANTIC_DATA_TYPE_ATTRIBUTES":    [null, "length=3"],
    						"REF_UOM_CURRENCY_PATH":            ["Activity_Price", null],
    						"REF_UOM_CURRENCY_BUSINESS_OBJECT": ["Activity_Price", null],
    						"REF_UOM_CURRENCY_COLUMN_ID":       ["CAPR_BOOLEAN_UNIT", null],
    						"UOM_CURRENCY_FLAG":                [0, 1],
    						"PROPERTY_TYPE":                    [2, 6],
    						"IS_USABLE_IN_FORMULA":             [1, 1]
    					};
    					
    					const oExpectedMetadataTextDbData = {
    						"PATH"               : ["Activity_Price"],
    						"COLUMN_ID"          : ["CAPR_BOOLEAN"],
    						"LANGUAGE"           : ["EN"],
    						"DISPLAY_NAME"       : ["Added Activity_Price custom cff"],
    						"DISPLAY_DESCRIPTION": ["Activity_Price CFF"]
    					}
    					
    					const oExpectedMetadataItemAttributesDbData = {
    						"PATH":             ["Activity_Price", "Activity_Price"],
    						"BUSINESS_OBJECT":  ["Activity_Price", "Activity_Price"],
    						"COLUMN_ID":        ["CAPR_BOOLEAN", "CAPR_BOOLEAN_UNIT"],
    						"ITEM_CATEGORY_ID": [2, 2],
    						"SUBITEM_STATE":     [-1, -1],
    						"DEFAULT_VALUE":    [null, "0"],
    						"IS_READ_ONLY":     [0, 0],
    						"IS_MANDATORY":		[0, null]
    					}
    					
    					// act
    					oTransportation.importData(mTables, mParameters);
    					
    					// assert
    					jasmine.log("Checking t_metadata");
    					var oMetadataDbData = mockstar.execQuery(`select path,business_object,column_id,is_custom,rollup_type_id, 
    																	side_panel_group_id, display_order, table_display_order, 
    																	semantic_data_type,semantic_data_type_attributes,ref_uom_currency_path,
    																	ref_uom_currency_business_object, ref_uom_currency_column_id,uom_currency_flag, 
    																	property_type,is_usable_in_formula from {{metadata}} 
    																	where path = 'Activity_Price' and business_object = 'Activity_Price' and is_custom = 1`);
    					var oMetadataDbDataArray = mockstar_helpers.convertResultToArray(oMetadataDbData);										
    					expect(oMetadataDbDataArray).toEqualObject(oExpectedMetadataDbData);
    					
    					jasmine.log("Checking t_metadata__text");
    					var oMetadataTextDbData = mockstar.execQuery(`select path, column_id, language, display_name, display_description 
    																	from {{metadata_text}} where (path, column_id) in ( 
    																		select path, column_id from {{metadata}}  
    																		where path = 'Activity_Price' and business_object = 'Activity_Price' and is_custom = 1
    																	)`);
    					var oMetadataTextDbDataArray = mockstar_helpers.convertResultToArray(oMetadataTextDbData);
    					expect(oMetadataTextDbDataArray).toEqualObject(oExpectedMetadataTextDbData);															
    					
    					
    					jasmine.log("Checking t_metadata_item_attributes");
    					var oMetadataAttributesDbData = mockstar.execQuery(`select path,business_object,column_id,item_category_id,subitem_state,default_value,\
    																		is_read_only,is_mandatory 
    																		from {{metadata_item_attributes}} where (path, business_object, column_id) in ( 
    																			select path, business_object, column_id from {{metadata}}  
    																			where path = 'Activity_Price' and business_object = 'Activity_Price' and is_custom = 1
    																		)`);
    					var oMetadataAttributesDbDataArray = mockstar_helpers.convertResultToArray(oMetadataAttributesDbData);
    					expect(oMetadataAttributesDbDataArray).toEqualObject(oExpectedMetadataItemAttributesDbData);
    					
    				});
                })
                
			});
		});
	});

	describe('exception cases for import data ', function() {
		
		var oTransportation = null;		
		
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.initializeData();

			oTransportation = new Transportation(jasmine.dbConnection, oDbArtefactControllerMock, oMetadataMock);
		});

		it('foreign key does not exist', function() {
			// arrange
			//data is not integrity because BUSINESS_OBJECT=INVALID does not exist
			const mTables = {
				"t_metadata__text": [
								["PATH", "COLUMN_ID", "LANGUAGE", "DISPLAY_NAME", "DISPLAY_DESCRIPTION"],
								["Invalid", "INVALID_ID", "EN", "A", "Invalid"],
							]
			};
			var mParameters = {
				mode : "replace"
			};

			// act
			var exception;
			try {
				oTransportation.importData(mTables, mParameters);
			} catch (e) {
				exception = e;
			}
			
			// assert
			expect(exception.code.code).toBe("GENERAL_VALIDATION_ERROR");
			expect(exception.details).toBeDefined();
		});

		it('exception GENERAL_ENTITY_NOT_FOUND_ERROR when request is null', function() {
			// act
			var exception;
			try {
				var mTables = null;
				var oResultObject = oTransportation.importData(mTables);
			} catch (e) {
				exception = e;
			}
			
			// assert
			expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
		});

		it('exception GENERAL_UNEXPECTED_EXCEPTION when column name is not correct', function() {
			// arrange
			var mTables = {
				"t_controlling_area": [
				                       ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID_D"],
				                       ["3", null],
				                       ["4", null]
				                       ]
			};
			
			// act
			var exception;
			try {
				var oResultObject = oTransportation.importData(mTables);
			} catch (e) {
				exception = e;
			}
			
			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

		it('exception GENERAL_UNEXPECTED_EXCEPTION when there is not enough primary key in the table needed to import', function() {
			// arrange
			var mTables = {
				"t_account": [
				              ["ACCOUNT_ID", "_CREATED_BY"],
				              ["AC2", userId],
				              ["AC3", userId]
				              ]
			};
			
			// act
			var exception;
			try {
				var oResultObject = oTransportation.importData(mTables);
			} catch (e) {
				exception = e;
			}
			
			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

		it('exception when user(s) logged in the app', function() {
			// arrange
			var mParameters = {
				"businessObjects": "cff"
			};
			mockstar.insertTableData("session", testData.oSessionTestData);
			mockstar.insertTableData("application_timeout", testData.oApplicationTimeout);

			// act
			var oExportedData = oTransportation.exportData(mParameters);
			var exception;
			try {
				var oResultObject = oTransportation.importData(oExportedData);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_METHOD_NOT_ALLOWED_ERROR");
		});
        
	});

	describe('export data', function() {
		
		var oTransportation = null;
		
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.initializeData();
			oTransportation = new Transportation(jasmine.dbConnection, oDbArtefactControllerMock, oMetadataMock);
		});

		it('export data for controllingArea business object', function() {
			// arrange
			var aParameters = {
				"businessObjects": "controlling_area"
			};
			
			// act
			var oResultObject = oTransportation.exportData(aParameters);
			// assert

			var oExpectedData = {
				"t_controlling_area": [
					    ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID", "_CREATED_BY"],
					    ["1", "EUR", userId],
					    ["2", "EUR", userId]
				    ],
				"t_controlling_area__text": [
	       			    ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_CREATED_BY"],
	       			    ["1", "DE", "New 1", userId],
	       			    ["2", "DE", "CA2", userId]
       			    ]
			};
			expect(oResultObject).toEqual(oExpectedData);
		});

		it('export data for cff tables', function() {
			// arrange
			var mParameters = {
				"businessObjects": "cff"
			};
			
			// act
			var oResultObject = oTransportation.exportData(mParameters);
			
			// assert
			var oExpectedData = {
				"t_metadata": [
								["PATH", "BUSINESS_OBJECT", "COLUMN_ID", "IS_CUSTOM", "ROLLUP_TYPE_ID", "SIDE_PANEL_GROUP_ID", "DISPLAY_ORDER", "TABLE_DISPLAY_ORDER", "REF_UOM_CURRENCY_PATH",
									"REF_UOM_CURRENCY_BUSINESS_OBJECT", "REF_UOM_CURRENCY_COLUMN_ID", "UOM_CURRENCY_FLAG", "SEMANTIC_DATA_TYPE", "SEMANTIC_DATA_TYPE_ATTRIBUTES",
									"VALIDATION_REGEX_ID", "PROPERTY_TYPE", "IS_IMMUTABLE_AFTER_SAVE", "IS_REQUIRED_IN_MASTERDATA", "IS_WILDCARD_ALLOWED", "IS_USABLE_IN_FORMULA",
									"RESOURCE_KEY_DISPLAY_NAME", "RESOURCE_KEY_DISPLAY_DESCRIPTION"
								],
								["Item", "Item", "CUST_TEST",  1, 0, 103, 3, 3, null, null, null, null, "String", "length=10", null, 6, null, null, null, 1, null, null],
								["Item", "Item", "CUST_TEST2", 1, 0, 104, 4, 4, "Item", "Item", "CUST_TEST2_UNIT", 0, "Decimal", "precision=24; scale=7", null, 2, null, null, null, 1, null, null],
								["Item", "Item", "CUST_TEST2_UNIT", 1, 0, null, null, null, null, null, null, 1, "String", "length=3", null, 6, null, null, null, 1, null, null]
							],
				"t_metadata__text": [
				                     [ 'PATH', 'COLUMN_ID', 'LANGUAGE', 'DISPLAY_NAME', 'DISPLAY_DESCRIPTION' ],
				                     [ 'Item', 'CUST_TEST', 'DE', 'Test_DE', 'Test_DE'],
				                     [ 'Item', 'CUST_TEST', 'EN', 'Test_EN', 'Test_EN'],
				                     [ 'Item', 'CUST_TEST2', 'DE', 'Test2_DE', 'Test2_DE'],
				                     [ 'Item', 'CUST_TEST2', 'EN', 'Test2_EN', 'Test2_EN']
				                   ],
		       	"t_metadata_item_attributes": [
		       			                    [ 'PATH', 'BUSINESS_OBJECT', 'COLUMN_ID', 'ITEM_CATEGORY_ID', 'SUBITEM_STATE', 'IS_MANDATORY', 'IS_READ_ONLY', 'IS_TRANSFERABLE', 'DEFAULT_VALUE' ],
		       			                    [ 'Item', 'Item', 'CUST_TEST', 2, -1, 0, 0, null, "test" ],
		       			                    [ 'Item', 'Item', 'CUST_TEST', 3, -1, 0, 1, null, null ], 
		       			                    [ 'Item', 'Item', 'CUST_TEST2', 2, -1, 0, 0, null, "42" ],
		       			                    [ 'Item', 'Item', 'CUST_TEST2_UNIT', 2, -1, 0, 0, null, null ]
		       	                   ],
                   "t_formula": [
                            [ "FORMULA_ID","PATH","BUSINESS_OBJECT","COLUMN_ID","ITEM_CATEGORY_ID","IS_FORMULA_USED","FORMULA_STRING","FORMULA_DESCRIPTION"],
                            [ 1, "Item", "Item", "PRICE_FIXED_PORTION", 1, 1, "1+1", "Price Formula"],
                            [ 2, "Item", "Item", "CUST_TEST", 2, 1, "2+2", "Cust Formula1"],
                            [ 3, "Item", "Item", "CUST_TEST", 3, 1, "3+3", "Cust Formula2"],
                   ]
			};
			expect(oResultObject.t_metadata).toEqual(oExpectedData.t_metadata);
			expect(oResultObject.t_metadata__text).toEqual(oExpectedData.t_metadata__text);
			expect(oResultObject.t_metadata_item_attributes).toEqual(oExpectedData.t_metadata_item_attributes);
			expect(oResultObject.t_formula).toEqual(oExpectedData.t_formula);
		});
		
		it('export data for empty table of business object', function() {
			// arrange
			var aParameters = {
				"businessObjects": "controlling_area"
			};
			mockstar.clearTables(["controllingArea", "controllingArea_text"]);
			
			// act
			var oResultObject = oTransportation.exportData(aParameters);

			// assert
			// Only table column names should be exported
			var oExpectedData = {
				"t_controlling_area": [
					    ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID", "_CREATED_BY"]
				    ],
				"t_controlling_area__text": [
	       			    ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_CREATED_BY"]
       			    ]
			};
			expect(oResultObject).toEqual(oExpectedData);
		});
	});
	
	describe('getTableColumns', function() {
		
		var oTransportation = null;
		
		beforeEach(function() {		
			oTransportation = new Transportation(jasmine.dbConnection, oDbArtefactControllerMock, oMetadataMock);
		});
		
		it('should return the table columns excluding the following:_VALID_FROM, _VALID_TO, _SOURCE', function() {
			//arrange
			var tableName = 't_controlling_area';
			var tableColumns = ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID", 'DELETED_FROM_SOURCE', "_CREATED_BY"]
			
			//act
			var result = oTransportation.getTableColumns(tableName);
			
			//assert
			expect(result.sort()).toEqual(tableColumns.sort());
		});
		
		it('should return empty array when table not found', function() {
			//arrange
			var tableName = 't_controlling_areaa';
			
			//act
			var result = oTransportation.getTableColumns(tableName);
			
			//assert
			expect(result).toEqual([]);
		});
	})	
	
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);