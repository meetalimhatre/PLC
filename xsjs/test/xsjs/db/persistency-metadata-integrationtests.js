describe('xsjs.db.persistency-metadata-integrationtests', function() {
	var _ = require("lodash");
	var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
	var mockstar_helpers = require("../../testtools/mockstar_helpers");
	var testData = require("../../testdata/testdata").data;
	var PersistencyImport = $.import("xs.db", "persistency");
	var metadataImport = require("../../../lib/xs/db/persistency-metadata");
	var constants = require("../../../lib/xs/util/constants"); 
	var MessageLibrary = require("../../../lib/xs/util/message");
	var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
	var Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
	
	var PlcException = MessageLibrary.PlcException;
	var oMockstar = null;
	var oPersistency = null;

	var oMetadataTestData = 
	{"PATH" :["Item", "Item", "Item"],
			"BUSINESS_OBJECT": ["Item", "Item", "Item"],
			"COLUMN_ID" : ["CUST_TEST_UNIT", "CUST_TEST", "CUST_TEST1"],
			"SEMANTIC_DATA_TYPE": ["String","Integer", "Integer"],
			"SEMANTIC_DATA_TYPE_ATTRIBUTES": ["length=3",null, null],
			"REF_UOM_CURRENCY_COLUMN_ID": [null,"CUST_TEST_UNIT", null],
			"SIDE_PANEL_GROUP_ID" : [1,1, 1],
			"ROLLUP_TYPE_ID" : [0,0, 0],
			"REF_UOM_CURRENCY_PATH": [null,"Item", null],
			"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null,"Item", null],
			"UOM_CURRENCY_FLAG": [1,0, 0],
			"IS_CUSTOM": [1, 1, 1],
			"PROPERTY_TYPE": [3,1,1],
			"IS_USABLE_IN_FORMULA": [1, 1, 1]
	};
	var oMetadataTextTestData = {
			"PATH" : ["Item", "Item", "Item", "Item", "Item" ],
			"COLUMN_ID" : ["CUST_TEST_UNIT", "CUST_TEST_UNIT", "CUST_TEST", "CUST_TEST", "CUST_TEST1"],
			"LANGUAGE" : ["EN", "DE", "EN", "DE", "EN"],
			"DISPLAY_NAME" : ["Testing Unit EN", "Testing Unit DE", "Testing EN", "Testing DE", "Testing EN"] 
	};
	var oMetaDataAttributesTestData = {
			"PATH" : ["Item", "Item", "Item", "Item", "Item", "Item"],
			"BUSINESS_OBJECT": ["Item", "Item", "Item", "Item", "Item", "Item"],
			"COLUMN_ID" : ["CUST_TEST_UNIT", "CUST_TEST_UNIT", "CUST_TEST", "CUST_TEST", "CUST_TEST1", "CUST_TEST1"],
			"ITEM_CATEGORY_ID" : [1, 1, 1, 1, 1, 1],
			"DEFAULT_VALUE": [1, 1, 1, 1, 1, 1],
			"SUBITEM_STATE": [-1, -1, -1, -1, -1, -1],
			"IS_READ_ONLY": [1,0, 1,0, 1,0] 
	};

	var oMetaDataFormulasTestData = {
			"PATH" : "Item",
			"BUSINESS_OBJECT": "Item",
			"COLUMN_ID" : "CUST_TEST",
			"ITEM_CATEGORY_ID" : 1,
			"FORMULA_ID" : 11,
			"IS_FORMULA_USED": 1,
			"FORMULA_STRING": "1+1",
			"FORMULA_DESCRIPTION": "equals 2"
	};


	beforeOnce(function() {
		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					substituteTables:
					{
						metadata: metadataImport.Tables.metadata,
						metadataText: metadataImport.Tables.metadataText,
						metadataItemAttributes: metadataImport.Tables.metadataItemAttributes,
						formula: metadataImport.Tables.formula,
						itemExt:metadataImport.Tables.itemExt,
						item:metadataImport.Tables.item,
						calculationVersion: metadataImport.Tables.calculationVersion,
						layout_columns: metadataImport.Tables.layout_columns,
						layout_hidden_fields: metadataImport.Tables.layout_hidden_fields,
						materialPrice : Resources["Material_Price"].dbobjects.plcTable,
						materialPriceExt : Resources["Material_Price"].dbobjects.plcExtensionTable,
						field_mapping: metadataImport.Tables.field_mapping,
						costingSheetOverheadRow:metadataImport.Tables.costingSheetOverheadRow,
						costingSheetOverheadRowFormula:metadataImport.Tables.costingSheetOverheadRowFormula
					}
				});
	});

	afterOnce(function() {
		oMockstar.cleanup();
	});

	beforeEach(function(){
		oMockstar.clearAllTables();
		oMockstar.initializeData();

		oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
	});
	
	if(jasmine.plcTestRunParameters.mode === 'all'){
		
		describe('get', function() {
			beforeEach(function() {                 
				oMockstar.insertTableData("metadata", testData.oMetadataTestData);
				oMockstar.insertTableData("metadataText", testData.oMetaTextTestData);
				oMockstar.insertTableData("metadataItemAttributes", testData.oMetaAttributesTestData);
				oMockstar.insertTableData("formula", testData.oMetaFormulasTestData);
			});

			it('should get metadata fields when valid input', function() {
				// arrange
				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;

				// act
				var aResult = oPersistency.Metadata.getMetadataFields(sPath, sBusinessObject, sColumnId);

				// assert
				expect(aResult).toMatchData([testData.oMetadataTestData], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
			});

			it('should get metadata text when valid input', function() {
				// arrange
				var sPath = testData.oMetaTextTestData.PATH;
				var sColumnId = testData.oMetaTextTestData.COLUMN_ID;

				// act
				var aResult = oPersistency.Metadata.getMetadataText(sPath, sColumnId);

				// assert
				expect(aResult).toMatchData([testData.oMetaTextTestData], ['PATH', 'COLUMN_ID']);
			});

			it('should get metadata attributes when valid input', function() {
				// arrange
				var sPath = testData.oMetaAttributesTestData.PATH;
				var sBusinessObject = testData.oMetaAttributesTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetaAttributesTestData.COLUMN_ID;

				// act
				var aResult = oPersistency.Metadata.getMetadataItemAttributes(sPath, sBusinessObject, sColumnId);

				// assert
				expect(aResult).toMatchData([testData.oMetaAttributesTestData], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
			});

			it('should get formulas when valid input', function() {
				// arrange
				var sPath = testData.oMetaFormulasTestData.PATH;
				var sBusinessObject = testData.oMetaFormulasTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetaFormulasTestData.COLUMN_ID;

				// act
				var aResult = oPersistency.Metadata.getMetadataFormulas(sPath, sBusinessObject, sColumnId);

				// assert
				expect(aResult).toMatchData([testData.oMetaFormulasTestData], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
			});

			it('getColumnsForCategories - should get column ids and category ids from metadata ', function() {
				// arrange
				var sPath = testData.oMetaAttributesTestData.PATH;
				var sBusinessObject = testData.oMetaAttributesTestData.BUSINESS_OBJECT;

				// act
				var aResult = oPersistency.Metadata.getColumnsForCategories(sPath, sBusinessObject);

				// assert
				expect(aResult[0].ITEM_CATEGORY_ID).toEqual(testData.oMetaAttributesTestData.ITEM_CATEGORY_ID);
				expect(aResult[0].COLUMN_ID).toEqual(testData.oMetaAttributesTestData.COLUMN_ID);
			});

			it('getRollupCustomFieldsWithoutFormulas - should get custom column ids that have rollup type > 0 ', function() {
				// arrange
				var oMetadataTestData1 = _.clone(oMetadataTestData);
				oMetadataTestData1.ROLLUP_TYPE_ID = [0,0,1];
				oMockstar.insertTableData("metadata", oMetadataTestData1);
				oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				oMockstar.insertTableData("formula", oMetaDataFormulasTestData);				
				oMockstar.insertTableData("metadataText", oMetadataTextTestData);

				var sPath = oMetadataTestData1.PATH[2];
				var sBusinessObject = oMetadataTestData1.BUSINESS_OBJECT[2];
				var iItemCategory = oMetaDataAttributesTestData.ITEM_CATEGORY_ID[4];

				// act
				var aResult = oPersistency.Metadata.getRollupCustomFieldsWithoutFormulas(sPath, sBusinessObject, iItemCategory);

				// assert
				expect(aResult[0].COLUMN_ID).toEqual(oMetadataTestData1.COLUMN_ID[2]);
			});

			it('getRollupCustomFieldsWithoutFormulas - should not get custom column ids if rolltype = 0 for all custom fields ', function() {
				// arrange
				oMockstar.insertTableData("metadata", oMetadataTestData);
				oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				oMockstar.insertTableData("formula", oMetaDataFormulasTestData);				
				oMockstar.insertTableData("metadataText", oMetadataTextTestData);

				var sPath = oMetadataTestData.PATH[2];
				var sBusinessObject = oMetadataTestData.BUSINESS_OBJECT[2];
				var iItemCategory = oMetaDataAttributesTestData.ITEM_CATEGORY_ID[4];

				// act
				var aResult = oPersistency.Metadata.getRollupCustomFieldsWithoutFormulas(sPath, sBusinessObject, iItemCategory);

				// assert
				expect(aResult.length).toEqual(0);
			});

			it('getMasterdataCustomFields - should get masterdata custom columns ids ', function() {
			    //arrange
			    var oMetadataTestdata = 
			        {
			         "PATH" :["Item", "Item", "Item"],
        			"BUSINESS_OBJECT": ["Item", "Item", "Item"],
        			"COLUMN_ID" : ["CMAT_TEST1", "CMAT_TEST2", "CUST_TEST1"],
        			"SEMANTIC_DATA_TYPE": ["String","Integer", "Integer"],
        			"SEMANTIC_DATA_TYPE_ATTRIBUTES": ["length=3",null, null],
        			"REF_UOM_CURRENCY_COLUMN_ID": [null,"CUST_TEST_UNIT", null],
        			"SIDE_PANEL_GROUP_ID" : [1,1, 1],
        			"ROLLUP_TYPE_ID" : [0,0, 0],
        			"REF_UOM_CURRENCY_PATH": [null,"Item", null],
        			"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null,"Item", null],
        			"UOM_CURRENCY_FLAG": [0, 0, 0],
        			"IS_CUSTOM": [1, 1, 1],
        			"PROPERTY_TYPE": [3,1,1],
        			"IS_USABLE_IN_FORMULA": [1, 1, 1]
                };
                
                var oMetaDataAttributesTestData = {
        			"PATH" : ["Item", "Item", "Item"],
        			"BUSINESS_OBJECT": ["Item", "Item", "Item"],
        			"COLUMN_ID" : ["CMAT_TEST1", "CMAT_TEST2", "CUST_TEST1"],
        			"ITEM_CATEGORY_ID" : [1, 1, 1],
        			"DEFAULT_VALUE": [1, 1, 1],
        			"SUBITEM_STATE": [-1, -1, -1],
        			"IS_READ_ONLY": [0,0,0],
        			"DEFAULT_VALUE" : ["aas", 123, 321]
        	    };
			    oMockstar.insertTableData("metadata", oMetadataTestdata);
			    oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				
				const aExpectedColumns = [ 'CMAT_TEST1_MANUAL', 'CMAT_TEST2_MANUAL'];
				const aExpectedDataTypes = [ 'String', 'Integer'];
				const aExpectedDefaultValues = [ 'aas', '123'];
				// act
				var aResult = oPersistency.Metadata.getMasterdataCustomFields();

				// assert
				expect(aResult.COLUMNS).toEqual(aExpectedColumns);
				expect(aResult.DATA_TYPES).toEqual(aExpectedDataTypes);
				expect(aResult.DEFAULT_VALUES).toEqual(aExpectedDefaultValues);
			});

			it('getSemanticDataTypeAttribute - should return the right attribute for a semantic data type', function(){
				// act
				var sResult = oPersistency.Metadata.getSemanticDataTypeAttribute ("Link");

				// assert
				expect(sResult).toEqual(constants.SemanticDataTypeAttributes.Link);
			});

			it('getSemanticDataTypeAttribute - should return an exception if semantic data type is invalid', function(){
				// act
				try {
					var oResult = oPersistency.Metadata.getSemanticDataTypeAttribute ("Test");
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("GENERAL_UNEXPECTED_EXCEPTION");	
			});

			it('getPropertyType  - should return the right property type for a semantic data type', function(){
				// act
				var sResult = oPersistency.Metadata.getPropertyType ("Link",null);

				// assert
				expect(sResult).toEqual(constants.PropertyTypes.Link);
			});

			it('getPropertyType  - should return an exception if semantic data type is invalid', function(){
				// act
				try {
					var oResult = oPersistency.Metadata.getPropertyType ("Test",null);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("GENERAL_UNEXPECTED_EXCEPTION");	
			});

			it('getMetadataGeneratedProperties - should fill VALIDATION_REGEX_ID if semantic data type is Link', function(){
				//arrange
				var oMetadata = {	"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_LINK",
									"SEMANTIC_DATA_TYPE": "Link",
									"SIDE_PANEL_GROUP_ID" : 100,
									"ROLLUP_TYPE_ID" : 0,
									"UOM_CURRENCY_FLAG" : 0,
									"TEXT": [],
									"ATTRIBUTES": [{
										"PATH" : "Item",
										"BUSINESS_OBJECT": "Item",
										"COLUMN_ID" : "CUST_Link",
										"ITEM_CATEGORY_ID" : 1,
										"DEFAULT_VALUE": "https://www.sap.com"
									}]
								};
				
				// act
				var oGeneratedValues = oPersistency.Metadata.getMetadataGeneratedProperties (oMetadata,null);

				// assert
				expect(oGeneratedValues.VALIDATION_REGEX_ID).toBe(constants.RegexIds["LINK"]);
			});

			it('getMetadataGeneratedProperties - should not fill VALIDATION_REGEX_ID if semantic data type is other than Link', function(){
				//arrange
				var oMetadata = {	"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_STRING",
									"SEMANTIC_DATA_TYPE": "String",
									"SIDE_PANEL_GROUP_ID" : 101,
									"ROLLUP_TYPE_ID" : 0,
									"UOM_CURRENCY_FLAG" : 0,
									"TEXT": [],
									"ATTRIBUTES": [{
										"PATH" : "Item",
										"BUSINESS_OBJECT": "Item",
										"COLUMN_ID" : "CUST_STRING",
										"ITEM_CATEGORY_ID" : 1,
										"DEFAULT_VALUE": "Testing"
									}]
								};
				// act
				var oGeneratedValues = oPersistency.Metadata.getMetadataGeneratedProperties (oMetadata,null);

				// assert
				expect(oGeneratedValues.VALIDATION_REGEX_ID).toBe(null);
			});

		});

		describe('create', function() {

			var oMetadataTestDataCreateUnit =
			{"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST_UNIT",
					"SEMANTIC_DATA_TYPE": "String",
					"SIDE_PANEL_GROUP_ID" : 1,
					"ROLLUP_TYPE_ID" : 0,
					"UOM_CURRENCY_FLAG" : 1,
					"PROPERTY_TYPE": 6,
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST_UNIT",
						"LANGUAGE" : "EN",
						"DISPLAY_NAME" : "Testing"},
						{"PATH" : "Item",
							"COLUMN_ID" : "CUST_TEST_UNIT",
							"LANGUAGE" : "DE",
							"DISPLAY_NAME" : "Testing"}
						],
						"ATTRIBUTES": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST_UNIT",
							"ITEM_CATEGORY_ID" : 1,
							"DEFAULT_VALUE": 1
						}]};
			var oMetadataTestDataCreate = 
			{"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST",
					"SEMANTIC_DATA_TYPE": "Integer",
					"REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_UNIT",
					"SIDE_PANEL_GROUP_ID" : 1,
					"ROLLUP_TYPE_ID" : 0,
					"REF_UOM_CURRENCY_PATH": "Item",
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
					"UOM_CURRENCY_FLAG": 0,
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST",
						"LANGUAGE" : "EN",
						"DISPLAY_NAME" : "Testing"},
						{"PATH" : "Item",
							"COLUMN_ID" : "CUST_TEST",
							"LANGUAGE" : "DE",
							"DISPLAY_NAME" : "Testing"}
						],
						"ATTRIBUTES": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"ITEM_CATEGORY_ID" : 1,
							"DEFAULT_VALUE": 1
						}],
						"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : -1,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "1+1",
							"FORMULA_DESCRIPTION": "equals 2"
						}]};

			var oMetadataTestDataCreateErrorInFormula = 
			{"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST",
					"SEMANTIC_DATA_TYPE": "Integer",
					"REF_UOM_CURRENCY_COLUMN_ID": "",
					"SIDE_PANEL_GROUP_ID" : 1,
					"ROLLUP_TYPE_ID" : 0,
					"REF_UOM_CURRENCY_PATH": "",
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
					"UOM_CURRENCY_FLAG": 0,
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST",
						"LANGUAGE" : "EN",
						"DISPLAY_NAME" : "Testing"},
						{"PATH" : "Item",
							"COLUMN_ID" : "CUST_TEST",
							"LANGUAGE" : "DE",
							"DISPLAY_NAME" : "Testing"}
						],
						"ATTRIBUTES": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"ITEM_CATEGORY_ID" : 1,
							"DEFAULT_VALUE": 1
						}],
						"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : -1,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "$CUST_NAME_WILL_NEVER_EXISTS_1+1",
							"FORMULA_DESCRIPTION": "equals 2"
						}]};
			beforeEach(function(){
				oMockstar.clearAllTables();

				oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
			});   

			beforeEach(function() {
				oMockstar.clearAllTables(); 
			});

			it('should throw CUSTOM_FIELDS_TEXT_ERROR if the custom field description contains illegal characters', () => {
				// arrange
				var oMetadataCreate ={
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST",
					"SIDE_PANEL_GROUP_ID": 101,
					"PATH": "Item",
					"ATTRIBUTES": [
								   {
									   "BUSINESS_OBJECT": "Item",
									   "COLUMN_ID": "CUST_TEST",
									   "PATH": "Item",
									   "ITEM_CATEGORY_ID": 0
								   },
								   {
									   "BUSINESS_OBJECT": "Item",
									   "COLUMN_ID": "CUST_TEST",
									   "PATH": "Item",
									   "ITEM_CATEGORY_ID": 10
								   }],
								   "TEXT": [{
									   "PATH": "Item",
									   "COLUMN_ID": "CUST_TEST",
									   "LANGUAGE": "EN",
									   "DISPLAY_NAME": "test",
									   "DISPLAY_DESCRIPTION": "test&test1"
								   },
								   {
									   "PATH": "Item",
									   "COLUMN_ID": "CUST_TEST",
									   "LANGUAGE": "DE",
									   "DISPLAY_NAME": "test",
									   "DISPLAY_DESCRIPTION": "test"
								   }],
								   "REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
								   "REF_UOM_CURRENCY_COLUMN_ID": "",
								   "REF_UOM_CURRENCY_PATH": "",
								   "ROLLUP_TYPE_ID": 0,
								   "SEMANTIC_DATA_TYPE": "Integer",
								   "UOM_CURRENCY_FLAG": 0,
								   "FORMULAS": []
				};
				var exception;

				// act
				try {
					var aResultCF = oPersistency.Metadata.create(oMetadataCreate);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("CUSTOM_FIELDS_TEXT_ERROR");
			});

			it('should throw CUSTOM_FIELDS_TEXT_ERROR if the custom field display name contains illegal characters', () => {
				// arrange
				var oMetadataCreate ={
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST",
					"SIDE_PANEL_GROUP_ID": 101,
					"PATH": "Item",
					"ATTRIBUTES": [
								   {
									   "BUSINESS_OBJECT": "Item",
									   "COLUMN_ID": "CUST_TEST",
									   "PATH": "Item",
									   "ITEM_CATEGORY_ID": 0
								   },
								   {
									   "BUSINESS_OBJECT": "Item",
									   "COLUMN_ID": "CUST_TEST",
									   "PATH": "Item",
									   "ITEM_CATEGORY_ID": 10
								   }],
								   "TEXT": [{
									   "PATH": "Item",
									   "COLUMN_ID": "CUST_TEST",
									   "LANGUAGE": "EN",
									   "DISPLAY_NAME": "test&",
									   "DISPLAY_DESCRIPTION": "test test1"
								   },
								   {
									   "PATH": "Item",
									   "COLUMN_ID": "CUST_TEST",
									   "LANGUAGE": "DE",
									   "DISPLAY_NAME": "test",
									   "DISPLAY_DESCRIPTION": "test"
								   }],
								   "REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
								   "REF_UOM_CURRENCY_COLUMN_ID": "",
								   "REF_UOM_CURRENCY_PATH": "",
								   "ROLLUP_TYPE_ID": 0,
								   "SEMANTIC_DATA_TYPE": "Integer",
								   "UOM_CURRENCY_FLAG": 0,
								   "FORMULAS": []
				};
				var exception;

				// act
				try {
					var aResultCF = oPersistency.Metadata.create(oMetadataCreate);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("CUSTOM_FIELDS_TEXT_ERROR");
			});

			it('should create metadata when valid input', function() {
				var oExpectedMetadataAttributesUnitCF = 
				{
					"PATH" : [oMetadataTestDataCreateUnit.PATH],
					"BUSINESS_OBJECT": [oMetadataTestDataCreateUnit.BUSINESS_OBJECT],
					"COLUMN_ID" : [oMetadataTestDataCreateUnit.COLUMN_ID],
					"SUBITEM_STATE" : [-1],
					"IS_READ_ONLY" : [0]
				};

				// arrange

				// act
				//creation of UNIT for CF
				var aResultCFUnit = oPersistency.Metadata.create(oMetadataTestDataCreateUnit);
				//creation of CF
				var aResultCF = oPersistency.Metadata.create(oMetadataTestDataCreate);

				// assert
				expect(aResultCFUnit).not.toBe(null);
				expect(aResultCF).not.toBe(null);
				var iCountUnit = mockstar_helpers.getRowCount(oMockstar, "metadata", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST_UNIT'");
				var iCount = mockstar_helpers.getRowCount(oMockstar, "metadata", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST'");
				expect(iCountUnit).toBe(1);
				expect(iCount).toBe(1);
				//attributes
				//should create 2 item attributes if rollup type is 0
				var iCountAttrUnit = mockstar_helpers.getRowCount(oMockstar, "metadataItemAttributes", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST_UNIT'");
				var iCountAttr = mockstar_helpers.getRowCount(oMockstar, "metadataItemAttributes", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST'");

				expect(iCountAttrUnit).toBe(1);
				expect(iCountAttr).toBe(1);
				expect(aResultCFUnit.ATTRIBUTES.length).toBe(1);
				expect(aResultCF.ATTRIBUTES.length).toBe(1);

				//attributes - 2 entries with correct values for field IS_READ_ONLY
				expect(aResultCFUnit.ATTRIBUTES).toMatchData(oExpectedMetadataAttributesUnitCF, ['PATH', 'COLUMN_ID', 'IS_READ_ONLY']);

				//texts
				expect(aResultCFUnit.TEXT[0]).toMatchData([oMetadataTestDataCreateUnit.TEXT[0]], ['PATH', 'COLUMN_ID']);
				expect(aResultCFUnit.TEXT[1]).toMatchData([oMetadataTestDataCreateUnit.TEXT[1]], ['PATH', 'COLUMN_ID']);
				expect(aResultCF.TEXT[0]).toMatchData([oMetadataTestDataCreate.TEXT[0]], ['PATH', 'COLUMN_ID']);
				expect(aResultCF.TEXT[1]).toMatchData([oMetadataTestDataCreate.TEXT[1]], ['PATH', 'COLUMN_ID']);

				//formula
				expect(aResultCF.FORMULAS[0]).toMatchData([oMetadataTestDataCreate.FORMULAS[0]], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
				expect(aResultCF.FORMULAS[0].FORMULA_ID).toBeGreaterThan(0); // check if the value is taken from the db sequence
			});
			
			it('should create metadata and set semantic data type attribute to "length=5000" for text data type custom field', function() {
			    //arrange
			    const oMetadataCreate = 
        			{ 
        			    "PATH" : "Item",
        			    "REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
                		"REF_UOM_CURRENCY_COLUMN_ID": "",
                		"REF_UOM_CURRENCY_PATH": "",
                		"ROLLUP_TYPE_ID": 0,
                		"SEMANTIC_DATA_TYPE": "String",
                		"UOM_CURRENCY_FLAG": 0,
                		"FORMULAS": [],
                		"BUSINESS_OBJECT": "Item",
                		"COLUMN_ID": "CUST_TEST2",
                		"SIDE_PANEL_GROUP_ID": 101,
                		"ATTRIBUTES": [{
                			"ITEM_CATEGORY_ID": 2,
                			"BUSINESS_OBJECT": "Item",
                			"COLUMN_ID": "CUST_TEST2",
                			"PATH": "Item"
                		}],
                		"TEXT": [{
                			"LANGUAGE": "DE",
                			"COLUMN_ID": "CUST_TEST2",
                			"PATH": "Item"
                		}, {
                			"LANGUAGE": "EN",
                			"COLUMN_ID": "CUST_TEST2",
                			"PATH": "Item"
                		}]};
                
                //act
				
				var aResult = oPersistency.Metadata.create(oMetadataCreate);
				//data type text to be 5000 characters
				expect(aResult).not.toBe(null);
				var iCount = mockstar_helpers.getRowCount(oMockstar, "metadata", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST2'");
				expect(iCount).toBe(1);
				
				var result =  jasmine.dbConnection.executeQuery(`select * from "sap.plc.db::basis.t_metadata"`);
				expect(result[0].SEMANTIC_DATA_TYPE_ATTRIBUTES).toBe("length=5000");
				
			});

			it('should create metadata and set the read_only of item attribute to 1 for item category 10 (refrenced version)', function() {
				// arrange
				var oMetadataCreate ={
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST",
						"SIDE_PANEL_GROUP_ID": 101,
						"PATH": "Item",
						"ATTRIBUTES": [
						               {
						            	   "BUSINESS_OBJECT": "Item",
						            	   "COLUMN_ID": "CUST_TEST",
						            	   "PATH": "Item",
						            	   "ITEM_CATEGORY_ID": 0
						               },
						               {
						            	   "BUSINESS_OBJECT": "Item",
						            	   "COLUMN_ID": "CUST_TEST",
						            	   "PATH": "Item",
						            	   "ITEM_CATEGORY_ID": 10
						               }],
						               "TEXT": [{
						            	   "PATH": "Item",
						            	   "COLUMN_ID": "CUST_TEST",
						            	   "LANGUAGE": "EN",
						            	   "DISPLAY_NAME": "test",
						            	   "DISPLAY_DESCRIPTION": "test"
						               },
						               {
						            	   "PATH": "Item",
						            	   "COLUMN_ID": "CUST_TEST",
						            	   "LANGUAGE": "DE",
						            	   "DISPLAY_NAME": "test",
						            	   "DISPLAY_DESCRIPTION": "test"
						               }],
						               "REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
						               "REF_UOM_CURRENCY_COLUMN_ID": "",
						               "REF_UOM_CURRENCY_PATH": "",
						               "ROLLUP_TYPE_ID": 0,
						               "SEMANTIC_DATA_TYPE": "Integer",
						               "UOM_CURRENCY_FLAG": 0,
						               "FORMULAS": []
				};

				// act
				//creation of metadata and metadata attribute
				var aResult = oPersistency.Metadata.create(oMetadataCreate);

				// assert
				expect(aResult).not.toBe(null);
				var iCount = mockstar_helpers.getRowCount(oMockstar, "metadata", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST'");
				expect(iCount).toBe(1);
				//attributes
				//should create 2 item attributes if rollup type is 0 and 2 for 10
				var iCountAttrZero = mockstar_helpers.getRowCount(oMockstar, "metadataItemAttributes", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST' and ITEM_CATEGORY_ID = 0");
				var iCountAttrTen = mockstar_helpers.getRowCount(oMockstar, "metadataItemAttributes", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST' and ITEM_CATEGORY_ID = 10");
				expect(iCountAttrZero).toBe(1);
				expect(iCountAttrTen).toBe(1);

				//attributes - 2 entries for each category, with correct values for field IS_READ_ONLY
				expect(aResult.ATTRIBUTES).toMatchData({	"PATH" : ['Item', 'Item'],  
					"BUSINESS_OBJECT": ['Item', 'Item'], 
					"COLUMN_ID" : ['CUST_TEST', 'CUST_TEST'], 
					"SUBITEM_STATE" : [-1, -1],  
					"IS_READ_ONLY" : [0, 1],
					"ITEM_CATEGORY_ID": [0, 10]
				}, ['PATH', 'COLUMN_ID', 'IS_READ_ONLY', 'ITEM_CATEGORY_ID']);
			});
			
			it('should create metadata and set the read_only of item attribute to 1 for item category 10 if the rollup is sum and formula is defined', function() {
				// arrange
				var oMetadataCreate ={
					      "BUSINESS_OBJECT": "Item",
					      "COLUMN_ID": "CUST_TEST1",
					      "SIDE_PANEL_GROUP_ID": 101,
					      "PATH": "Item",
					      "ATTRIBUTES": [
					        {
					          "BUSINESS_OBJECT": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "PATH": "Item",
					          "ITEM_CATEGORY_ID": 10
					        }
					      ],
					      "TEXT": [
					        {
					          "PATH": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "LANGUAGE": "EN"
					        }],
					      "REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
					      "REF_UOM_CURRENCY_PATH": "Item",
					      "ROLLUP_TYPE_ID": 1,
					      "SEMANTIC_DATA_TYPE": "Decimal",
					      "UOM_CURRENCY_FLAG": 0,
					      "FORMULAS": [
					        {
					          "FORMULA_ID": 0,
					          "PATH": "Item",
					          "BUSINESS_OBJECT": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "ITEM_CATEGORY_ID": 0,
					          "IS_FORMULA_USED": 0,
					          "FORMULA_STRING": "1+1",
					          "FORMULA_DESCRIPTION": ""
					        }
					      ]
					    };

				// act
				//creation of metadata and metadata attribute
				var aResult = oPersistency.Metadata.create(oMetadataCreate);

				// assert
				expect(aResult).not.toBe(null);
				var iCount = mockstar_helpers.getRowCount(oMockstar, "metadata", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST1'");
				expect(iCount).toBe(1);
				//attributes
				//should create 2 item attributes if rollup type is 1 for item 
				var iCountAttrTen = mockstar_helpers.getRowCount(oMockstar, "metadataItemAttributes", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST1' and ITEM_CATEGORY_ID = 10");
				expect(iCountAttrTen).toBe(2);

				//attributes - 2 entries for with correct values for field IS_READ_ONLY
				expect(aResult.ATTRIBUTES).toMatchData({	"PATH" : ['Item', 'Item'],  
					"BUSINESS_OBJECT": ['Item', 'Item'], 
					"COLUMN_ID" : ['CUST_TEST1', 'CUST_TEST1'], 
					"SUBITEM_STATE" : [0, 1],  
					"IS_READ_ONLY" : [1, 1],
					"ITEM_CATEGORY_ID": [10, 10]
				}, ['PATH', 'COLUMN_ID', 'IS_READ_ONLY', 'ITEM_CATEGORY_ID']);
			});

			it('should throw exception if referenced currency or uom does not exist', function() {
				//arrange
				var exception;

				try {
					var aResultCF = oPersistency.Metadata.create(oMetadataTestDataCreate);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("GENERAL_REF_UOM_CURRENCY_ENTITY_NOT_FOUND_ERROR");
			});

			it('should throw exception if formula string refers to a field that does not exists', function() {
				//arrange
				var exception;

				try {
					var aResultCF = oPersistency.Metadata.create(oMetadataTestDataCreateErrorInFormula);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING");
			});
			
			
			it('should create formula with formula string empty if is_formula_used = 0', function() {
				var oMetadataTestDataCreateErrorInFormula ={
					      "BUSINESS_OBJECT": "Item",
					      "COLUMN_ID": "CUST_TEST1",
					      "SIDE_PANEL_GROUP_ID": 101,
					      "PATH": "Item",
					      "ATTRIBUTES": [
					        {
					          "BUSINESS_OBJECT": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "PATH": "Item",
					          "ITEM_CATEGORY_ID": 10
					        }
					      ],
					      "REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
					      "REF_UOM_CURRENCY_PATH": "Item",
					      "ROLLUP_TYPE_ID": 1,
					      "SEMANTIC_DATA_TYPE": "Decimal",
					      "UOM_CURRENCY_FLAG": 0,
					      "FORMULAS": [
					        {
					          "FORMULA_ID": 0,
					          "PATH": "Item",
					          "BUSINESS_OBJECT": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "ITEM_CATEGORY_ID": 0,
					          "IS_FORMULA_USED": 0,
					          "FORMULA_STRING": "",
					          "FORMULA_DESCRIPTION": ""
					        }
					      ]
					    };
				var exception;
	
				//act
				try {
					var aResultCF = oPersistency.Metadata.create(oMetadataTestDataCreateErrorInFormula);
				} catch(e) {
					exception = e;
				}
	
				// assert
				expect(aResultCF.FORMULAS[0].IS_FORMULA_USED).toBe(0);
				expect(aResultCF.FORMULAS[0].FORMULA_STRING).toBe('');
			});
			
			it('should throw exception if formula string is empty with is_formula_used = 1', function() {
				var oMetadataTestDataCreateErrorInFormula ={
					      "BUSINESS_OBJECT": "Item",
					      "COLUMN_ID": "CUST_TEST1",
					      "SIDE_PANEL_GROUP_ID": 101,
					      "PATH": "Item",
					      "ATTRIBUTES": [
					        {
					          "BUSINESS_OBJECT": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "PATH": "Item",
					          "ITEM_CATEGORY_ID": 10
					        }
					      ],
					      "REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
					      "REF_UOM_CURRENCY_PATH": "Item",
					      "ROLLUP_TYPE_ID": 1,
					      "SEMANTIC_DATA_TYPE": "Decimal",
					      "UOM_CURRENCY_FLAG": 0,
					      "FORMULAS": [
					        {
					          "FORMULA_ID": 0,
					          "PATH": "Item",
					          "BUSINESS_OBJECT": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "ITEM_CATEGORY_ID": 0,
					          "FORMULA_STRING": "",
					          "IS_FORMULA_USED": 1,
					          "FORMULA_DESCRIPTION": ""
					        }
					      ]
					    };
				var exception;
	
				//act
				try {
					var aResultCF = oPersistency.Metadata.create(oMetadataTestDataCreateErrorInFormula);
				} catch(e) {
					exception = e;
				}
	
				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("CALCULATIONENGINE_SYNTAX_ERROR_WARNING");
			});

			
			
			it('should set is_formula_used to 1 if it is not sent in the request', function() {
				var oMetadataTestDataCreateErrorInFormula ={
					      "BUSINESS_OBJECT": "Item",
					      "COLUMN_ID": "CUST_TEST1",
					      "SIDE_PANEL_GROUP_ID": 101,
					      "PATH": "Item",
					      "ATTRIBUTES": [
					        {
					          "BUSINESS_OBJECT": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "PATH": "Item",
					          "ITEM_CATEGORY_ID": 10
					        }
					      ],
					      "REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
					      "REF_UOM_CURRENCY_PATH": "Item",
					      "ROLLUP_TYPE_ID": 1,
					      "SEMANTIC_DATA_TYPE": "Decimal",
					      "UOM_CURRENCY_FLAG": 0,
					      "FORMULAS": [
					        {
					          "FORMULA_ID": 0,
					          "PATH": "Item",
					          "BUSINESS_OBJECT": "Item",
					          "COLUMN_ID": "CUST_TEST1",
					          "ITEM_CATEGORY_ID": 0,
					          "FORMULA_STRING": "1+1",
					          "FORMULA_DESCRIPTION": ""
					        }
					      ]
					    };
				var exception;
	
				//act
				try {
					var aResultCF = oPersistency.Metadata.create(oMetadataTestDataCreateErrorInFormula);
				} catch(e) {
					exception = e;
				}
	
				// assert
				expect(exception).toBeUndefined();
				expect(aResultCF.FORMULAS[0].IS_FORMULA_USED).toBe(1);
			});
		});
		
		describe('update', function() {

			var oMetadataTestDataUpdateUnit =
			{"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST_UNIT",
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST_UNIT",
						"LANGUAGE" : "EN",
						"DISPLAY_NAME" : "Changed Testing En"}],
						"ATTRIBUTES": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST_UNIT",
							"ITEM_CATEGORY_ID" : 1,
							"DEFAULT_VALUE": "Kg"
						}]};
            
            var oMetadataTestDataUpdateUnitExpected =
			{
            	"PATH": "Item",
            	"BUSINESS_OBJECT": "Item",
            	"COLUMN_ID": "CUST_TEST_UNIT",
            	"IS_CUSTOM": 1,
            	"ROLLUP_TYPE_ID": 0,
            	"SIDE_PANEL_GROUP_ID": 1,
            	"DISPLAY_ORDER": null,
            	"TABLE_DISPLAY_ORDER": null,
            	"REF_UOM_CURRENCY_PATH": null,
            	"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
            	"REF_UOM_CURRENCY_COLUMN_ID": null,
            	"UOM_CURRENCY_FLAG": 1,
            	"SEMANTIC_DATA_TYPE": "String",
            	"SEMANTIC_DATA_TYPE_ATTRIBUTES": "length=3",
            	"PROPERTY_TYPE": 3,
            	"IS_IMMUTABLE_AFTER_SAVE": null,
            	"IS_REQUIRED_IN_MASTERDATA": null,
            	"IS_WILDCARD_ALLOWED": null,
            	"IS_USABLE_IN_FORMULA": 1,
            	"RESOURCE_KEY_DISPLAY_NAME": null,
            	"RESOURCE_KEY_DISPLAY_DESCRIPTION": null,
            	"VALIDATION_REGEX_ID": null,
            	"VALIDATION_REGEX_VALUE": null
            };
						
			var oMetadataTestDataUpdate = {
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST",
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST",
						"LANGUAGE" : "EN",
						"DISPLAY_NAME" : "Testing changed 1"}],
						"ATTRIBUTES": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"ITEM_CATEGORY_ID" : 1,
							"DEFAULT_VALUE": 2
						}],
						"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : 11,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "1+3",
							"FORMULA_DESCRIPTION": "equals 4"
						}]};
            
            var oMetadataTestDataUpdateExpected = {
                "PATH": "Item",
            	"BUSINESS_OBJECT": "Item",
            	"COLUMN_ID": "CUST_TEST",
            	"IS_CUSTOM": 1,
            	"ROLLUP_TYPE_ID": 0,
            	"SIDE_PANEL_GROUP_ID": 1,
            	"DISPLAY_ORDER": null,
            	"TABLE_DISPLAY_ORDER": null,
            	"REF_UOM_CURRENCY_PATH": "Item",
            	"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
            	"REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_UNIT",
            	"UOM_CURRENCY_FLAG": 0,
            	"SEMANTIC_DATA_TYPE": "Integer",
            	"SEMANTIC_DATA_TYPE_ATTRIBUTES": null,
            	"PROPERTY_TYPE": 1,
            	"IS_IMMUTABLE_AFTER_SAVE": null,
            	"IS_REQUIRED_IN_MASTERDATA": null,
            	"IS_WILDCARD_ALLOWED": null,
            	"IS_USABLE_IN_FORMULA": 1,
            	"RESOURCE_KEY_DISPLAY_NAME": null,
            	"RESOURCE_KEY_DISPLAY_DESCRIPTION": null,
            	"VALIDATION_REGEX_ID": null,
            	"VALIDATION_REGEX_VALUE": null
            };
            
			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.insertTableData("metadata", oMetadataTestData);
				oMockstar.insertTableData("metadataText", oMetadataTextTestData);
				oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				oMockstar.insertTableData("formula", oMetaDataFormulasTestData);
			});

			it("should update the metadata when valid input", function() {
				// arrange			
				// act
				var aResultCFUnit = oPersistency.Metadata.update(oMetadataTestDataUpdateUnit);
				var aResultCF = oPersistency.Metadata.update(oMetadataTestDataUpdate);

				// assert
				expect(aResultCFUnit).not.toBe(null);
				expect(aResultCF).not.toBe(null);
				expect(aResultCFUnit.ATTRIBUTES.length).toBe(2);
				expect(aResultCF.ATTRIBUTES.length).toBe(2);
				expect(aResultCFUnit.TEXT.length).toBe(1);
				expect(aResultCFUnit.TEXT[0]).toMatchData([oMetadataTestDataUpdateUnit.TEXT[0]], ['PATH', 'COLUMN_ID']);
				expect(aResultCF.TEXT.length).toBe(1);
				expect(aResultCF.TEXT[0]).toMatchData([oMetadataTestDataUpdate.TEXT[0]], ['PATH', 'COLUMN_ID']);
				expect(aResultCF.FORMULAS.length).toBe(1);
				expect(aResultCF.FORMULAS[0]).toMatchData([oMetadataTestDataUpdate.FORMULAS[0]], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
			});
			
			it("should update the metadata when valid input and return all properties of metadata object", function() {
				// arrange	
				// act
				var aResultCFUnit = oPersistency.Metadata.update(oMetadataTestDataUpdateUnit);
				var aResultCF = oPersistency.Metadata.update(oMetadataTestDataUpdate);

				// assert
				expect(aResultCFUnit).not.toBe(null);
				expect(aResultCF).not.toBe(null);
				var responseaResultCFUnit = JSON.stringify(aResultCF);
				var responseaResultCF = JSON.stringify(aResultCF);
				expect(aResultCFUnit.ATTRIBUTES.length).toBe(2);
				expect(aResultCF.ATTRIBUTES.length).toBe(2);
				expect(aResultCFUnit.TEXT.length).toBe(1);
				expect(_.omit(aResultCF, ["TEXT", "FORMULAS", "ATTRIBUTES", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY", "CREATED_ON", "CREATED_BY", "FORMULAS_TRIGGERS_IS_MANUAL_CHANGE"])).toMatchData([oMetadataTestDataUpdateExpected], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
				expect(_.omit(aResultCFUnit, ["TEXT", "FORMULAS", "ATTRIBUTES", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY", "CREATED_ON", "CREATED_BY", "FORMULAS_TRIGGERS_IS_MANUAL_CHANGE"])).toMatchData([oMetadataTestDataUpdateUnitExpected], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
				expect(aResultCFUnit.TEXT[0]).toMatchData([oMetadataTestDataUpdateUnit.TEXT[0]], ['PATH', 'COLUMN_ID']);
				expect(aResultCF.TEXT.length).toBe(1);
				expect(aResultCF.TEXT[0]).toMatchData([oMetadataTestDataUpdate.TEXT[0]], ['PATH', 'COLUMN_ID']);
				expect(aResultCF.FORMULAS.length).toBe(1);
				expect(aResultCF.FORMULAS[0]).toMatchData([oMetadataTestDataUpdate.FORMULAS[0]], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
			});
			
			it("should create formula for updated custom field if formula does not exist", function() {
				//arrange
				var oMetadataTestDataFormulaUpdate = {
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_TEST1",
						"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST1",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : -1,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "1+3",
							"FORMULA_DESCRIPTION": "equals 4"
						}]};

				//act
				var aResult = oPersistency.Metadata.update(oMetadataTestDataFormulaUpdate);

				//assert
				expect(aResult.FORMULAS[0].FORMULA_ID).toBeGreaterThan(0);
				expect(aResult.FORMULAS[0]).toMatchData([oMetadataTestDataFormulaUpdate.FORMULAS[0]], ['PATH', 'BUSINESS_OBJECT', 'COLUMN_ID']);
				var iCount = mockstar_helpers.getRowCount(oMockstar, "formula", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST1'");
				expect(iCount).toBe(1);
			});
			
			it("should update formula for standard fields if formula exists for item category and create formula for new item categories", function() {
				//arrange
				//insert test data for target cost formula
				oMockstar.clearTables("metadata", "formula");
				oMockstar.insertTableData("metadata", testData.mCsvFiles.metadata);
				oMockstar.insertTableData("formula", { "PATH" : "Item",
													   "BUSINESS_OBJECT": "Item",
													   "COLUMN_ID" : "TARGET_COST",
													   "ITEM_CATEGORY_ID" : 1,
													   "FORMULA_ID" : 11,
													   "IS_FORMULA_USED": 1,
													   "FORMULA_STRING": "1+1",
													   "FORMULA_DESCRIPTION": "equals 2"
								});
				var oMetadataTestDataFormulaUpdate = {
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "TARGET_COST",
						"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "TARGET_COST",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : 0,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "14",
							"FORMULA_DESCRIPTION": "equals 14"
						}, {
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "TARGET_COST",
							"ITEM_CATEGORY_ID" : 2,
							"FORMULA_ID" : 0,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "14",
							"FORMULA_DESCRIPTION": "equals 14"
					}]};

				//act
				var aResult = oPersistency.Metadata.update(oMetadataTestDataFormulaUpdate);

				//assert
				var aFormulas = oMockstar.execQuery("select FORMULA_STRING from {{formula}} where PATH = 'Item' and COLUMN_ID = 'TARGET_COST'");
				expect(aFormulas.columns.FORMULA_STRING.rows.length).toBe(2);
				expect(aFormulas.columns.FORMULA_STRING.rows[0]).toBe('14');
				expect(aFormulas.columns.FORMULA_STRING.rows[1]).toBe('14');
			});

			it("should create text for updated custom field if text does not exist", function() {
				//arrange
				var oMetadataTestDataTextUpdate = {
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_TEST1",
						"TEXT": [{
							"PATH" : "Item",
							"COLUMN_ID" : "CUST_TEST1",
							"LANGUAGE" : "DE",
							"DISPLAY_NAME" : "Testing changed 1"
						}]};

				//act
				var aResult = oPersistency.Metadata.update(oMetadataTestDataTextUpdate);

				//assert
				expect(aResult.TEXT.length).toBe(1);
				expect(aResult.TEXT[0]).toMatchData([oMetadataTestDataTextUpdate.TEXT[0]], ['PATH', 'COLUMN_ID', 'LANGUAGE']);
				var iCount = mockstar_helpers.getRowCount(oMockstar, "metadataText", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST1'");
				expect(iCount).toBe(2);
			});
		});

		describe('remove', function() {

			var oMetadataTestDataDelete =
			{"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST"
			};

			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.insertTableData("metadata", oMetadataTestData);
				oMockstar.insertTableData("metadataText", oMetadataTextTestData);
				oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				oMockstar.insertTableData("formula", oMetaDataFormulasTestData);
			});

			it("should remove metadata, metadata texts, attributes, formulas including unit reference when valid input", function() {
				// arrange
				// act
				var iResult = oPersistency.Metadata.remove(oMetadataTestDataDelete);

				// assert
				expect(iResult).toBeGreaterThan(0);
				//check tables
				var iCountMetadata = mockstar_helpers.getRowCount(oMockstar, "metadata", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST'");
				var iCountAttr = mockstar_helpers.getRowCount(oMockstar, "metadataItemAttributes", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST'");
				var iCountText = mockstar_helpers.getRowCount(oMockstar, "metadataText", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST'");
				var iCountFormulas = mockstar_helpers.getRowCount(oMockstar, "formula", "PATH = 'Item' and COLUMN_ID = 'CUST_TEST'");
				expect(iCountMetadata).toBe(0);
				expect(iCountAttr).toBe(0);
				expect(iCountText).toBe(0);
				expect(iCountFormulas).toBe(0);
			});
			
			it("should throw exception if metadata field not found in table", function() {
				// arrange
				oMockstar.clearAllTables();
				var exception;
				// act
				try {
					var iResult = oPersistency.Metadata.remove(oMetadataTestDataDelete);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("GENERAL_ENTITY_NOT_FOUND_ERROR");
			});
		});
		
		describe('getMetadata', function() {
			beforeEach(function() {                 
				oMockstar.insertTableData("metadata", testData.mCsvFiles.metadata);
			});

			it('should get all metadata records that match the ids from the input array', function() {
				// arrange
				var aBody = [{
								"PATH" : "Item",
								"BUSINESS_OBJECT" : "Item",
								"COLUMN_ID" : "QUANTITY"
							  },
							  {
									"PATH" : "Item.Vendor",
									"BUSINESS_OBJECT" : "Vendor",
									"COLUMN_ID" : "VENDOR_ID"
							   }];
				// act
				var aResult = oPersistency.Metadata.getMetadata(aBody);

				// assert
				expect(aResult.length).toBe(2);
			});
			
			it('should get 1 metadata record, the one that matches the id from the input array', function() {
				// arrange
				var aBody = [{
								"PATH" : "Item",
								"BUSINESS_OBJECT" : "Item",
								"COLUMN_ID" : "QUANTITY"
							  },
							  {
									"PATH" : "Item.Vendo",
									"BUSINESS_OBJECT" : "Vendor",
									"COLUMN_ID" : "VENDOR_ID"
							   }];
				// act
				var aResult = oPersistency.Metadata.getMetadata(aBody);

				// assert
				expect(aResult.length).toBe(1);
			});
			
			it('should return an empty array if the data is not found in the metadata table', function() {
				// arrange
				var aBody = [{
								"PATH" : "ItemT1",
								"BUSINESS_OBJECT" : "Item",
								"COLUMN_ID" : "QUANTITY"
							  },
							  {
									"PATH" : "Item.Vendor",
									"BUSINESS_OBJECT" : "VendorTest",
									"COLUMN_ID" : "VENDOR_ID"
							   }];
				// act
				var aResult = oPersistency.Metadata.getMetadata(aBody);

				// assert
				expect(aResult.length).toBe(0);
			});
		});
		
		describe('updateManualFieldForStandardFields', function() {
			
			var oForumula = { "FORMULA_ID": [1234,1235,1236,1237],
							   "PATH": ["Item","Item","Item","Item"],
							   "BUSINESS_OBJECT": ["Item","Item","Item","Item"],
							   "COLUMN_ID": ["PRICE_VARIABLE_PORTION","PRICE_VARIABLE_PORTION","PRICE_VARIABLE_PORTION","PRICE_VARIABLE_PORTION"],
							   "ITEM_CATEGORY_ID": [0,2,3,8],
							   "IS_FORMULA_USED": [0,0,0,0],
							   "FORMULA_STRING": ["1+1","1+1","1+1","1+1"],
							   "FORMULA_DESCRIPTION": ["","","",""]
							 };
			var oForumula1 = { "FORMULA_ID": [1234,1235,1236,1237],
							   "PATH": ["Item","Item","Item","Item"],
							   "BUSINESS_OBJECT": ["Item","Item","Item","Item"],
							   "COLUMN_ID": ["LOT_SIZE","LOT_SIZE","LOT_SIZE","LOT_SIZE"],
							   "ITEM_CATEGORY_ID": [1,2,3,8],
							   "IS_FORMULA_USED": [0,0,0,0],
							   "FORMULA_STRING": ["1+1","1+1","1+1","1+1"],
							   "FORMULA_DESCRIPTION": ["","","",""]
							 };
			
			
			var oItemTestData = new TestDataUtility(testData.oItemTestData).build();
			oItemTestData.ITEM_CATEGORY_ID = [0,1,2,3,8];
			oItemTestData.PRICE_FIXED_PORTION_IS_MANUAL = [0,0,0,0,0];
			oItemTestData.PRICE_VARIABLE_PORTION_IS_MANUAL = [0,0,0,0,0];
			oItemTestData.LOT_SIZE_IS_MANUAL = [1,0,0,0,0];
			
			beforeEach(function() {
				oMockstar.clearTables(["formula", "item"]);
				oMockstar.insertTableData("formula",oForumula);
				oMockstar.insertTableData("formula",oForumula1);
				oMockstar.insertTableData("item", oItemTestData);
				oMockstar.insertTableData("metadataItemAttributes", testData.mCsvFiles.metadata_item_attributes);
				oMockstar.insertTableData("metadata",testData.mCsvFiles.metadata);
			});

			it('should update the is_manual for the standard field when the formula is deleted', function() {
				// arrange
				var oMetaStandardField = {
								"PATH" : "Item",
								"BUSINESS_OBJECT" : "Item",
								"COLUMN_ID" : "PRICE_VARIABLE_PORTION"
							  };
				// act
				oPersistency.Metadata.updateManualFieldForStandardFields(oMetaStandardField);

				// assert
				// check that when formula is deleted for price variable portion
				// the IS_MANUAL is set to 0 for parents, and 1 to children items
				var oItemsUpdated = oMockstar.execQuery("select ITEM_ID, PRICE_VARIABLE_PORTION_IS_MANUAL from {{item}} ");
				expect(oItemsUpdated).toMatchData({ "ITEM_ID":[3001,3002,3003,5001,7001],
				                                    "PRICE_VARIABLE_PORTION_IS_MANUAL":[0,0,1,1,1]
			                                	}, ["ITEM_ID"]);
			});
			
			it('should update the is_manual for the standard field when the formula is deleted', function() {
				// arrange
				var oMetaStandardField = {
								"PATH" : "Item",
								"BUSINESS_OBJECT" : "Item",
								"COLUMN_ID" : "LOT_SIZE"
							  };
				// act
				oPersistency.Metadata.updateManualFieldForStandardFields(oMetaStandardField);

				// assert
				// check that when costing lot size formula is deleted the is_manual
				// is set to 1 for the items with categories for which is defined
				var oItemsUpdated = oMockstar.execQuery("select ITEM_ID, LOT_SIZE_IS_MANUAL from {{item}} ");
				expect(oItemsUpdated).toMatchData({ "ITEM_ID":[3001,3002,3003,5001,7001],
				                                    "LOT_SIZE_IS_MANUAL":[1,1,1,1,1]
			                                	}, ["ITEM_ID"]);
			});
		});

		describe('getAllCustomFieldsNamesAsArray', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
			});
	
			it("should return all custom fields names as an array)", function() {
				//arrange
				var oMetadataTestdata = 
				{
					"PATH" :["Item", "Item", "Item","Item", "Item", "Item"],
					"BUSINESS_OBJECT": ["Item", "Item", "Item", "Item", "Item", "Item"],
					"COLUMN_ID" : ["CUST_BOOLEAN_INT", "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY", "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM", "CMPR_DECIMAL_WITH_UOM_UNIT", "MATERIAL_ID"],
					"SEMANTIC_DATA_TYPE": ["BooleanInt", "Decimal", "String", "Decimal", "String", "String"],
					"SEMANTIC_DATA_TYPE_ATTRIBUTES": [null, "precision=24; scale=7", "length=3", "precision=24; scale=7", "length=3", "length=40"],
					"REF_UOM_CURRENCY_COLUMN_ID": [null, "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT", null, "CMPR_DECIMAL_WITH_UOM_UNIT", null, null],
					"SIDE_PANEL_GROUP_ID" : [1, 1, 1, 1, 1, 1],
					"REF_UOM_CURRENCY_PATH": [null, "Item", null, "Item", null, null],
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null, "Item", null, "Item", null, null],
					"UOM_CURRENCY_FLAG": [0, 0, 1, 0, 1, 0],
					"IS_CUSTOM": [1, 1, 1, 1, 1, 0],
					"PROPERTY_TYPE": [5, 2, 7, 2, 6, 3]
				};
			
				oMockstar.insertTableData("metadata", oMetadataTestdata);
		
				const aExpectedColumns = ["CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT",
				"CUST_BOOLEAN_INT_MANUAL", "CUST_BOOLEAN_INT_CALCULATED", "CUST_BOOLEAN_INT_IS_MANUAL", "CUST_BOOLEAN_INT_UNIT", 
				"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL", "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_CALCULATED", "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL", "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT"
				];
				// act
				var aResult = oPersistency.Metadata.getAllCustomFieldsNamesAsArray();
	
				// assert
				expect(aResult).toEqual(aExpectedColumns);
			});
	
		});
		
		describe('createCustomFieldEntriesForReplicationTool', () => {
			let aCreatedCFs = [{
				"SIDE_PANEL_GROUP_ID": 501,
				"ATTRIBUTES": {
					"ITEM_CATEGORY_ID": -1,
					"BUSINESS_OBJECT": "Activity_Price",
					"COLUMN_ID": "CAPR_TEST",
					"PATH": "Activity_Price",
					"SUBITEM_STATE": -1,
					"IS_READ_ONLY": 0,
					"CREATED_ON": "2020-11-11T07:15:09.565Z",
					"CREATED_BY": "I518545",
					"LAST_MODIFIED_ON": "2020-11-11T07:15:09.565Z",
					"LAST_MODIFIED_BY": "TEST_USER_1"
				},
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Activity_Price",
				"REF_UOM_CURRENCY_COLUMN_ID": "CAPR_TEST_UNIT",
				"REF_UOM_CURRENCY_PATH": "Activity_Price",
				"ROLLUP_TYPE_ID": 0,
				"SEMANTIC_DATA_TYPE": "Decimal",
				"UOM_CURRENCY_FLAG": 0,
				"BUSINESS_OBJECT": "Activity_Price",
				"COLUMN_ID": "CAPR_TEST",
				"PATH": "Activity_Price",
				"TABLE_DISPLAY_ORDER": 520,
				"IS_CUSTOM": 1,
				"DISPLAY_ORDER": 518,
				"SEMANTIC_DATA_TYPE_ATTRIBUTES": "precision=24; scale=7",
			}, {
				"SIDE_PANEL_GROUP_ID": 501,
				"ATTRIBUTES": {
					"ITEM_CATEGORY_ID": -1,
					"BUSINESS_OBJECT": "Activity_Price",
					"COLUMN_ID": "CAPR_TEST_UNIT",
					"PATH": "Activity_Price",
					"SUBITEM_STATE": -1,
					"IS_READ_ONLY": 0,
					"CREATED_ON": "2020-11-11T07:15:09.565Z",
					"CREATED_BY": "I518545",
					"LAST_MODIFIED_ON": "2020-11-11T07:15:09.565Z",
					"LAST_MODIFIED_BY": "TEST_USER_1"
				},
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Activity_Price",
				"REF_UOM_CURRENCY_COLUMN_ID": null,
				"REF_UOM_CURRENCY_PATH": "Activity_Price",
				"ROLLUP_TYPE_ID": 0,
				"SEMANTIC_DATA_TYPE": "String",
				"UOM_CURRENCY_FLAG": 1,
				"BUSINESS_OBJECT": "Activity_Price",
				"COLUMN_ID": "CAPR_TEST_UNIT",
				"PATH": "Activity_Price",
				"TABLE_DISPLAY_ORDER": 520,
				"IS_CUSTOM": 1,
				"DISPLAY_ORDER": 518,
				"SEMANTIC_DATA_TYPE_ATTRIBUTES": "length=3",
			}];

			var oMetadataTestdata = {
				"PATH" :["Activity_Price", "Activity_Price"],
				"BUSINESS_OBJECT": ["Activity_Price", "Activity_Price"],
				"COLUMN_ID" : ["CAPR_TEST", "CAPR_TEST_UNIT"],
				"SEMANTIC_DATA_TYPE": ["Decimal", "String"],
				"SEMANTIC_DATA_TYPE_ATTRIBUTES": ["precision=24; scale=7", "length=3"],
				"REF_UOM_CURRENCY_COLUMN_ID": ["CAPR_TEST_UNIT", null],
				"SIDE_PANEL_GROUP_ID" : [1, 1],
				"REF_UOM_CURRENCY_PATH": ["Activity_Price", null],
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": ["Activity_Price", null],
				"UOM_CURRENCY_FLAG": [0, 1],
				"IS_CUSTOM": [1, 1],
				"PROPERTY_TYPE": [2, 7],
				"VALIDATION_REGEX_ID": ["DUMMY", "DUMMY"],
				"TABLE_DISPLAY_ORDER": [1, 2],
				"DISPLAY_ORDER": [1, 2]
			};
	
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("metadata", oMetadataTestdata);
			});

			function createSpyOnFieldMappingSequence(oPersistency) {
				startId = 1000;
				spyOn(oPersistency.Metadata.helper, 'getNextSequenceID').and.callFake(function() {
					startId += 1;
					return startId;
				});
			}
	
			it('should create two entries for the custom field: _MANUAL and _UNIT', () => {
				//arrange
				let aFilteredCreatedCFs = _.filter(aCreatedCFs, oCustomField => (oCustomField.BUSINESS_OBJECT !== 'Item' && oCustomField.UOM_CURRENCY_FLAG === 0));
				createSpyOnFieldMappingSequence(oPersistency);

				// act
				oPersistency.Metadata.createCustomFieldEntriesForReplicationTool(aFilteredCreatedCFs);
	
				// assert
				let oEntriesCreated = oMockstar.execQuery(`select * from {{field_mapping}} where TABLE_NAME = 't_activity_price' AND IS_CUSTOM = 1;`);
				let oExpectedItems = {
					"COLUMN_NAME": ["CAPR_TEST_MANUAL", "CAPR_TEST_UNIT"],
					"IS_PK": [0, 0],
					"IS_MANDATORY": [0, 0],
					"IS_NULLABLE": [1, 1],
					"IS_UPPERCASE": [0, 0],
					"FIELD_TYPE": ["DECIMAL", "STRING"],
					"LENGTH": [null, 3],
					"SCALE": [28, null],
					"PRECISION": [7, null]
				};
				expect(oEntriesCreated).toMatchData(oExpectedItems, ["COLUMN_NAME", "IS_PK", "IS_MANDATORY", "IS_NULLABLE", "IS_UPPERCASE", "FIELD_TYPE", "LENGTH", "SCALE", "PRECISION"]);
			});

			it('should create only one entry for custom fields that are not decimal', () => {
				//arrange

				var oMetadataTestdata = {
					"PATH" :["Activity_Price"],
					"BUSINESS_OBJECT": ["Activity_Price", "Activity_Price"],
					"COLUMN_ID" : ["CAPR_TEST", "CAPR_TEST_UNIT"],
					"SEMANTIC_DATA_TYPE": ["Integer", "String"],
					"SEMANTIC_DATA_TYPE_ATTRIBUTES": [null, "length=3"],
					"REF_UOM_CURRENCY_COLUMN_ID": ["CAPR_TEST_UNIT", null],
					"SIDE_PANEL_GROUP_ID" : [1, 1],
					"REF_UOM_CURRENCY_PATH": ["Activity_Price", null],
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": ["Activity_Price", null],
					"UOM_CURRENCY_FLAG": [0, 1],
					"IS_CUSTOM": [1, 1],
					"PROPERTY_TYPE": [2, 7],
					"VALIDATION_REGEX_ID": ["DUMMY", "DUMMY"],
					"TABLE_DISPLAY_ORDER": [1, 2],
					"DISPLAY_ORDER": [1, 2]
				};

				oMockstar.clearTable("metadata");
				oMockstar.insertTableData("metadata", oMetadataTestdata);

				let aFilteredCreatedCFs = _.filter(aCreatedCFs, oCustomField => (oCustomField.BUSINESS_OBJECT !== 'Item' && oCustomField.UOM_CURRENCY_FLAG === 0));
				aFilteredCreatedCFs[0].SEMANTIC_DATA_TYPE = 'Integer';
				aFilteredCreatedCFs[0].SEMANTIC_DATA_TYPE_ATTRIBUTES = null;
				createSpyOnFieldMappingSequence(oPersistency);

				// act
				oPersistency.Metadata.createCustomFieldEntriesForReplicationTool(aFilteredCreatedCFs);
	
				// assert
				let oEntriesCreated = oMockstar.execQuery(`select * from {{field_mapping}} where TABLE_NAME = 't_activity_price' AND IS_CUSTOM = 1;`);
				let oExpectedItems = {
					"COLUMN_NAME": ["CAPR_TEST_MANUAL"],
					"IS_PK": [0],
					"IS_MANDATORY": [0],
					"IS_NULLABLE": [1],
					"IS_UPPERCASE": [0],
					"FIELD_TYPE": ["INTEGER"],
					"LENGTH": [null],
					"SCALE": [null],
					"PRECISION": [null]
				};
				expect(oEntriesCreated).toMatchData(oExpectedItems, ["COLUMN_NAME", "IS_PK", "IS_MANDATORY", "IS_NULLABLE", "IS_UPPERCASE", "FIELD_TYPE", "LENGTH", "SCALE", "PRECISION"]);
			});
	
			it('should create two entries for the custom field (even if it hasn`t UOM): _MANUAL and _UNIT', () => {
				// arrange
				let aCreatedCFsWithoutUnit = [{
					"SIDE_PANEL_GROUP_ID": 501,
					"ATTRIBUTES": {
						"ITEM_CATEGORY_ID": -1,
						"BUSINESS_OBJECT": "Activity_Price",
						"COLUMN_ID": "CAPR_TEST",
						"PATH": "Activity_Price",
						"SUBITEM_STATE": -1,
						"IS_READ_ONLY": 0,
						"CREATED_ON": "2020-11-11T07:15:09.565Z",
						"CREATED_BY": "I518545",
						"LAST_MODIFIED_ON": "2020-11-11T07:15:09.565Z",
						"LAST_MODIFIED_BY": "TEST_USER_1"
					},
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Activity_Price",
					"REF_UOM_CURRENCY_COLUMN_ID": "CAPR_TEST_UNIT",
					"REF_UOM_CURRENCY_PATH": "Activity_Price",
					"ROLLUP_TYPE_ID": 0,
					"SEMANTIC_DATA_TYPE": "Decimal",
					"UOM_CURRENCY_FLAG": 0,
					"BUSINESS_OBJECT": "Activity_Price",
					"COLUMN_ID": "CAPR_TEST",
					"PATH": "Activity_Price",
					"TABLE_DISPLAY_ORDER": 520,
					"IS_CUSTOM": 1,
					"DISPLAY_ORDER": 518,
					"SEMANTIC_DATA_TYPE_ATTRIBUTES": "precision=24; scale=7",
				}];
				let aFilteredCreatedCFs = _.filter(aCreatedCFsWithoutUnit, oCustomField => (oCustomField.BUSINESS_OBJECT !== 'Item' && oCustomField.UOM_CURRENCY_FLAG === 0));
				createSpyOnFieldMappingSequence(oPersistency);
	
				// act
				oPersistency.Metadata.createCustomFieldEntriesForReplicationTool(aFilteredCreatedCFs);
	
				// assert
				let oEntriesCreated = oMockstar.execQuery(`select * from {{field_mapping}} where TABLE_NAME = 't_activity_price' AND IS_CUSTOM = 1;`);
				let oExpectedItems = {
					"COLUMN_NAME": ["CAPR_TEST_MANUAL", "CAPR_TEST_UNIT"],
					"IS_PK": [0, 0],
					"IS_MANDATORY": [0, 0],
					"IS_NULLABLE": [1, 1],
					"IS_UPPERCASE": [0, 0],
					"FIELD_TYPE": ["DECIMAL", "STRING"],
					"LENGTH": [null, 3],
					"SCALE": [28, null],
					"PRECISION": [7, null]
				};
				expect(oEntriesCreated).toMatchData(oExpectedItems, ["COLUMN_NAME", "IS_PK", "IS_MANDATORY", "IS_NULLABLE", "IS_UPPERCASE", "FIELD_TYPE", "LENGTH", "SCALE", "PRECISION"]);
			});
		});
	
		describe('deleteCustomFieldEntriesFromReplicationTool', () => {
			let oExistingCFs = {
				"ID": [1000, 1001, 1002, 1003],
				"TABLE_NAME": ["t_activity_price", "t_activity_price", "t_activity_price", "t_activity_price"],
				"COLUMN_NAME": ["CAPR_TEST_D_MANUAL", "CAPR_TEST_D_UNIT", "CAPR_TEST_D_2_MANUAL", "CAPR_TEST_D_3_MANUAL"],
				"FIELD_TYPE": ["DECIMAL", "STRING", "INTEGER", "INTEGER"],
				"FIELD_ORDER": [1000, 1001, 1002, 1003],
				"IS_CUSTOM": [1, 1, 1, 1]
			};
	
			let aCFsForDeletion = [{
				"BUSINESS_OBJECT":"Activity_Price",
				"COLUMN_ID":"CAPR_TEST_D",
				"PATH":"Activity_Price"
			},{
				"BUSINESS_OBJECT":"Activity_Price",
				"COLUMN_ID":"CAPR_TEST_D_2",
				"PATH":"Activity_Price"
			}];
	
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("field_mapping", oExistingCFs);
			});
	
			it('should delete only the provided custom fields', () => {
				// act
				oPersistency.Metadata.deleteCustomFieldEntriesFromReplicationTool(aCFsForDeletion);
	
				// assert
				let oEntriesDb = oMockstar.execQuery(`select * from {{field_mapping}} where TABLE_NAME = 't_activity_price' AND IS_CUSTOM = 1;`);
				let oExpectedItems = {
					"COLUMN_NAME": ["CAPR_TEST_D_3_MANUAL"]
				};
				expect(oEntriesDb).toMatchData(oExpectedItems, ["COLUMN_NAME"]);
			});
	
			
		});

	}
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		describe('updateFieldWithDefaultValue', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("metadataItemAttributes",testData.oMetadataItemAttributesCustTestData);
				oMockstar.insertTableData("item",testData.oItemTestData);
			});

			it("should set the value of the existing boolean custom fields to the default value", function() {
				// arrange
				oMockstar.insertTableData("itemExt",{
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CUST_BOOLEAN_INT_MANUAL":[0, null, null, null, 1],
					"CUST_BOOLEAN_INT_CALCULATED":[null,null,null,null,null],
					"CUST_BOOLEAN_INT_UNIT":[null,null,null,null,null],
					"CUST_BOOLEAN_INT_IS_MANUAL":[1,null,null, null,1]
				});
				var oMetadataUpdateBool = {
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_BOOLEAN_INT"
				};	
				// act
				var iResult = oPersistency.Metadata.updateFieldWithDefaultValue(oMetadataUpdateBool);

				// assert
				//check the table
				var result = oMockstar.execQuery("select item_id, calculation_version_id, cust_boolean_int_manual, cust_boolean_int_calculated," +
				" cust_boolean_int_unit, cust_boolean_int_is_manual from {{itemExt}}");
				expect(result).toMatchData({
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CUST_BOOLEAN_INT_MANUAL":[0, 1, null, 1, 1],
					"CUST_BOOLEAN_INT_CALCULATED":[null,null,null,null,null],
					"CUST_BOOLEAN_INT_UNIT":[null,null,null,null,null],
					"CUST_BOOLEAN_INT_IS_MANUAL":[1,1,null, 1,1]			
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			});
			
			it("should set the value of the existing boolean masterdata custom fields to the default value(in masterdata extension table and item table)", function() {
				// arrange		
				oMockstar.insertTableData("itemExt",{
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CMPR_BOOLEAN_INT_MANUAL":[0, null, null, null, 1],
					"CMPR_BOOLEAN_INT_UNIT":[null, null, null, null, null]
				});

				const oMaterialPriceTestDataPlc = new TestDataUtility(testData.oMaterialPriceTestDataPlc).addProperty("_VALID_TO", [null,null,null,"2018-01-19T12:27:23.197Z"]).build();
				oMockstar.insertTableData("materialPrice", oMaterialPriceTestDataPlc);

				oMockstar.insertTableData("materialPriceExt",{
					"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
			        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
			        "CMPR_BOOLEAN_INT_MANUAL" : [1, null, null, 0],
		    		"CMPR_BOOLEAN_INT_UNIT" : [null,  null, null, null]
				});

				const oMetadataBool = {
					"PATH" : constants.BusinessObjectTypes.MaterialPrice,
					"BUSINESS_OBJECT": constants.BusinessObjectTypes.MaterialPrice,
					"COLUMN_ID" : "CMPR_BOOLEAN_INT"
				};	
				// act
				const iResult = oPersistency.Metadata.updateFieldWithDefaultValue(oMetadataBool);

				// assert
				//check the table - the default value is set only for items with item category 1/2/4/6
				const aResultItemExt = oMockstar.execQuery(`select ITEM_ID, CALCULATION_VERSION_ID, CMPR_BOOLEAN_INT_MANUAL, CMPR_BOOLEAN_INT_UNIT from {{itemExt}}`);
				expect(aResultItemExt).toMatchData({
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CMPR_BOOLEAN_INT_MANUAL":[0, 1, null, null, 1],
					"CMPR_BOOLEAN_INT_UNIT":[null,null,null,null,null],		
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
				
				//the boolean default value is set for all masterdata entries (even outdated ones) that were having CMPR_BOOLEAN_INT_MANUAL = null
				const aResultMdExt = oMockstar.execQuery(`select PRICE_ID, CMPR_BOOLEAN_INT_MANUAL, CMPR_BOOLEAN_INT_UNIT from {{materialPriceExt}}`);
				expect(aResultMdExt).toMatchData({
					"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
			        "CMPR_BOOLEAN_INT_MANUAL" : [1, 1, 1, 0],
		    		"CMPR_BOOLEAN_INT_UNIT" : [null,  null, null, null]	
				}, ["PRICE_ID"]);
			});
		});
	}
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		describe('updateManualField', function() {
			
			var oMetadataItemAttributesTestData = {
        			"PATH" : ["Item", "Item"],
        			"BUSINESS_OBJECT": ["Item", "Item"],
        			"COLUMN_ID" : ["CUST_DECIMAL_WITHOUT_REF", "CUST_DECIMAL_WITHOUT_REF"],
        			"ITEM_CATEGORY_ID" : [3, 3],
        			"DEFAULT_VALUE": [1, 1],
        			"SUBITEM_STATE": [-1, -1],
        			"IS_READ_ONLY": [1,0] 
        	};
			var oItemExtTestData = {
					"ITEM_ID" : [ 3003 ],
					"CALCULATION_VERSION_ID" : [ 2809 ],
					"CUST_DECIMAL_WITHOUT_REF_MANUAL":[1],
					"CUST_DECIMAL_WITHOUT_REF_CALCULATED":[2],
					"CUST_DECIMAL_WITHOUT_REF_UNIT":[null],
					"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":[1]
			};
			var oFormulaNotUsedTestData = {
					"PATH" : [ "Item" ],
					"BUSINESS_OBJECT" : [ "Item" ],
					"COLUMN_ID":["CUST_DECIMAL_WITHOUT_REF"],
					"ITEM_CATEGORY_ID":[3],
					"FORMULA_ID":[1],
					"IS_FORMULA_USED":[0],
					"FORMULA_STRING":["1+1"],
					"FORMULA_STRING":["equals 2"]
			};
			var oFormulaUsedTestData = {
					"PATH" : [ "Item" ],
					"BUSINESS_OBJECT" : [ "Item" ],
					"COLUMN_ID":["CUST_DECIMAL_WITHOUT_REF"],
					"ITEM_CATEGORY_ID":[3],
					"FORMULA_ID":[1],
					"IS_FORMULA_USED":[1],
					"FORMULA_STRING":["1+1"],
					"FORMULA_STRING":["equals 2"]
			};
			var oMetadataUpdateWhitoutFormula = {
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_DECIMAL_WITHOUT_REF",
					"ROLLUP_TYPE_ID" : 1,
					"FORMULAS": []
			};
			var oMetadataUpdateWithFormula = {
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_DECIMAL_WITHOUT_REF",
					"ROLLUP_TYPE_ID" : 1,
					"FORMULAS": [{
					    "PATH" : "Item",
    					"BUSINESS_OBJECT" : "Item",
    					"COLUMN_ID":"CUST_DECIMAL_WITHOUT_REF",
    					"ITEM_CATEGORY_ID":3,
    					"FORMULA_ID":1,
    					"IS_FORMULA_USED":1,
    					"FORMULA_STRING":"1+2",
    					"FORMULA_STRING":"equals 3"
					}]
            };
            
            var oMetadataUpdateWhitoutFormulaAndNoRollup = {
                    "PATH" : "Item",
                    "BUSINESS_OBJECT": "Item",
                    "COLUMN_ID" : "CUST_DECIMAL_WITHOUT_REF",
                    "ROLLUP_TYPE_ID" : 0,
                    "FORMULAS": []
            };
			
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("metadataItemAttributes",testData.oMetadataItemAttributesCustTestData);
				oMockstar.insertTableData("metadataItemAttributes", oMetadataItemAttributesTestData);
				oMockstar.insertTableData("itemExt", oItemExtTestData);
				oMockstar.insertTableData("item", testData.oItemTestData);
			});

			it("should not update value to 0 (calculated) of the IS_MANUAL field of an existing decimal custom fields if no formula is defined ", function() {
				
				//arrange
				
				// act
				var iResult = oPersistency.Metadata.updateManualField(oMetadataUpdateWhitoutFormula);

				// assert
				//check that CUST_DECIMAL_WITHOUT_REF_IS_MANUAL field was not updated to 0 (calculated)
				var result = oMockstar.execQuery("select item_id, calculation_version_id, CUST_DECIMAL_WITHOUT_REF_MANUAL, CUST_DECIMAL_WITHOUT_REF_CALCULATED," +
				" CUST_DECIMAL_WITHOUT_REF_UNIT, CUST_DECIMAL_WITHOUT_REF_IS_MANUAL from {{itemExt}} where item_id = 3003");
				expect(result).toMatchData({
					"ITEM_ID" : [ 3003 ],
					"CALCULATION_VERSION_ID" : [ 2809 ],
					"CUST_DECIMAL_WITHOUT_REF_MANUAL":['1.0000000'],
					"CUST_DECIMAL_WITHOUT_REF_CALCULATED":['2.0000000'],
					"CUST_DECIMAL_WITHOUT_REF_UNIT":[null],
					"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":[1]			
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
            });
            
            it("should not update value to _CALCULATED of the _MANUAL field of an existing custom field", function() {
				
				//arrange
				
				// act
				var iResult = oPersistency.Metadata.updateManualField(oMetadataUpdateWhitoutFormulaAndNoRollup);

				// assert
				//check that CUST_DECIMAL_WITHOUT_REF_IS_MANUAL field was not updated to 0 (calculated)
				var result = oMockstar.execQuery("select item_id, calculation_version_id, CUST_DECIMAL_WITHOUT_REF_MANUAL, CUST_DECIMAL_WITHOUT_REF_CALCULATED," +
                " CUST_DECIMAL_WITHOUT_REF_UNIT, CUST_DECIMAL_WITHOUT_REF_IS_MANUAL from {{itemExt}} where item_id = 3003");
				expect(result).toMatchData({
					"ITEM_ID" : [ 3003 ],
					"CALCULATION_VERSION_ID" : [ 2809 ],
					"CUST_DECIMAL_WITHOUT_REF_MANUAL":['1.0000000'],
					"CUST_DECIMAL_WITHOUT_REF_CALCULATED":[null ],
					"CUST_DECIMAL_WITHOUT_REF_UNIT":[null],
					"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":[1]			
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			});
			
			it("should not update value to 0 (calculated) of the IS_MANUAL field of an existing decimal custom fields if formula is defined and it is not used", function() {
				
				//arrange
				oMockstar.insertTableData("formula", oFormulaNotUsedTestData);

    			// act
				var iResult = oPersistency.Metadata.updateManualField(oMetadataUpdateWithFormula);

				// assert
				//check that CUST_DECIMAL_WITHOUT_REF_IS_MANUAL field was not updated to 0 (calculated)
				var result = oMockstar.execQuery("select item_id, calculation_version_id, CUST_DECIMAL_WITHOUT_REF_MANUAL, CUST_DECIMAL_WITHOUT_REF_CALCULATED," +
				" CUST_DECIMAL_WITHOUT_REF_UNIT, CUST_DECIMAL_WITHOUT_REF_IS_MANUAL from {{itemExt}} where item_id = 3003");
				expect(result).toMatchData({
					"ITEM_ID" : [ 3003 ],
					"CALCULATION_VERSION_ID" : [ 2809 ],
					"CUST_DECIMAL_WITHOUT_REF_MANUAL":['1.0000000'],
					"CUST_DECIMAL_WITHOUT_REF_CALCULATED":['2.0000000'],
					"CUST_DECIMAL_WITHOUT_REF_UNIT":[null],
					"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":[1]			
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			});
			
			it("should update value to 0 (calculated) of the IS_MANUAL field of an existing decimal custom fields if formula is defined and formula is used", function() {

				//arrange
				oMockstar.insertTableData("formula", oFormulaUsedTestData);
	
    			// act
				var iResult = oPersistency.Metadata.updateManualField(oMetadataUpdateWithFormula);

				// assert
				//check that CUST_DECIMAL_WITHOUT_REF_IS_MANUAL field is updated to 0 (calculated)
				var result = oMockstar.execQuery("select item_id, calculation_version_id, CUST_DECIMAL_WITHOUT_REF_MANUAL, CUST_DECIMAL_WITHOUT_REF_CALCULATED," +
				" CUST_DECIMAL_WITHOUT_REF_UNIT, CUST_DECIMAL_WITHOUT_REF_IS_MANUAL from {{itemExt}} where item_id = 3003");
				expect(result).toMatchData({
					"ITEM_ID" : [ 3003 ],
					"CALCULATION_VERSION_ID" : [ 2809 ],
					"CUST_DECIMAL_WITHOUT_REF_MANUAL":['1.0000000'],
					"CUST_DECIMAL_WITHOUT_REF_CALCULATED":['2.0000000'],
					"CUST_DECIMAL_WITHOUT_REF_UNIT":[null],
					"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":[0]			
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			});
		});
	}
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		describe('copyMasterdataToMasterdataExt', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
			});

			it("should copy all the entries(only the keys) from masterdata main table to the extension table", function() {
				// arrange
				const oMaterialPriceTestDataPlc = new TestDataUtility(testData.oMaterialPriceTestDataPlc).addProperty("_VALID_TO", [null,null,null,"2018-01-19T12:27:23.197Z"]).build();
				oMockstar.insertTableData("materialPrice", oMaterialPriceTestDataPlc);
				const iTestBeforeMain = mockstar_helpers.getRowCount(oMockstar, "materialPrice");
				const iTestBeforeExt = mockstar_helpers.getRowCount(oMockstar, "materialPriceExt");

				// act
				const iResult = oPersistency.Metadata.copyMasterdataToMasterdataExt(constants.BusinessObjectTypes.MaterialPrice);

				// assert
				//check the table
				const iTestAfterExt = mockstar_helpers.getRowCount(oMockstar, "materialPriceExt");
				expect(iTestAfterExt).toBe(iTestBeforeExt+iTestBeforeMain);
			});
			
			it("should not copy entries from masterdata main table to the extension table", function() {
				// arrange
				const oMaterialPriceTestDataPlc = new TestDataUtility(testData.oMaterialPriceTestDataPlc).addProperty("_VALID_TO", [null,null,null,"2018-01-19T12:27:23.197Z"]).build();
				oMockstar.insertTableData("materialPrice", oMaterialPriceTestDataPlc);
				oMockstar.insertTableData("materialPriceExt",{
					"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
			        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
			        "CMPR_BOOLEAN_INT_MANUAL" : [1, null, null, 0],
		    		"CMPR_BOOLEAN_INT_UNIT" : [null,  null, null, null]
				});
				const iTestBeforeExt = mockstar_helpers.getRowCount(oMockstar, "materialPriceExt");

				// act
				const iResult = oPersistency.Metadata.copyMasterdataToMasterdataExt(constants.BusinessObjectTypes.MaterialPrice);

				// assert
				//check the table
				const iTestAfterExt = mockstar_helpers.getRowCount(oMockstar, "materialPriceExt");
				expect(iTestAfterExt).toBe(iTestBeforeExt);
			});
		});
	}

	if(jasmine.plcTestRunParameters.generatedFields === true){
		
		describe('updateUnitField', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("metadataItemAttributes",testData.oMetadataItemAttributesCustTestData);
				oMockstar.insertTableData("metadata",testData.oMetadataCustTestData);
				oMockstar.insertTableData("calculationVersion",testData.oCalculationVersionTestData);
				oMockstar.insertTableData("item",testData.oItemTestData);
			});

			it("should set the value of a currency custom field(for item) to the reporting currency)", function() {
				// arrange
				oMockstar.insertTableData("itemExt",{
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL":[20,300.5,40.88,50.96,600],
			    	"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_CALCULATED":[null,null,null,null,null],
			    	"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT":[null,null,null,"EUR","USD"],
			    	"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL":[null,null,null,null,null]
				});
								
				var oMetadataCurrency = {
						"PATH" : constants.BusinessObjectTypes.Item,
						"BUSINESS_OBJECT": constants.BusinessObjectTypes.Item,
						"COLUMN_ID": "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY",
						"UOM_CURRENCY_FLAG" : 0,
						"REF_UOM_CURRENCY_PATH": constants.BusinessObjectTypes.Item,
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": constants.BusinessObjectTypes.Item,
						"REF_UOM_CURRENCY_COLUMN_ID": "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT"
				};	
				// act
				var iResult = oPersistency.Metadata.updateUnitField(oMetadataCurrency);

				// assert
				//check the table
				var result = oMockstar.execQuery(`select item_id, calculation_version_id, CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT from {{itemExt}}`);
				expect(result).toMatchData({
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT":[null,testData.oCalculationVersionTestData.REPORT_CURRENCY_ID[0],null,"EUR","USD"],			
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			});
			
			it("should set the value of a UOM custom field(for item) to the default value", function() {
				// arrange
				oMockstar.insertTableData("itemExt",{
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
			    	"CUST_DECIMAL_FORMULA_MANUAL":[30,400.5,50.88,60.96,700],
			    	"CUST_DECIMAL_FORMULA_CALCULATED":[null,null,null,null,null],
			    	"CUST_DECIMAL_FORMULA_UNIT":[null,null,null,null,"G"],
			    	"CUST_DECIMAL_FORMULA_IS_MANUAL":[null,null,null,null,null]
				});
				const sDefaultValue = "KG";
				//change the item category to 2 for item 3003 in order to be able to set default value
				oMockstar.execSingle(`update {{item}} set item_category_id = 2 where item_id = 3003`);
				
				//set property_type = 6 (UOM)
				oMockstar.execSingle(`update {{metadata}} set PROPERTY_TYPE = 6
				                     where path = '${constants.BusinessObjectTypes.Item}' and business_object = '${constants.BusinessObjectTypes.Item}' 
				            	     and column_id = 'CUST_DECIMAL_FORMULA_UNIT'`);
				
				//set default value in metadata item for CUST_DECIMAL_FORMULA_UNIT
				oMockstar.execSingle(`update {{metadataItemAttributes}} set default_value = '${sDefaultValue}'
				                     where path = '${constants.BusinessObjectTypes.Item}' and business_object = '${constants.BusinessObjectTypes.Item}' 
				            	     and column_id = 'CUST_DECIMAL_FORMULA_UNIT' and item_category_id = 2`);
								
				var oMetadataUnit = {
						"PATH" : constants.BusinessObjectTypes.Item,
						"BUSINESS_OBJECT": constants.BusinessObjectTypes.Item,
						"COLUMN_ID" : "CUST_DECIMAL_FORMULA",
						"UOM_CURRENCY_FLAG" : 0,
						"REF_UOM_CURRENCY_PATH": constants.BusinessObjectTypes.Item,
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": constants.BusinessObjectTypes.Item,
						"REF_UOM_CURRENCY_COLUMN_ID": "CUST_DECIMAL_FORMULA_UNIT"
				};	
				// act
				var iResult = oPersistency.Metadata.updateUnitField(oMetadataUnit);

				// assert
				//check the table
				var result = oMockstar.execQuery(`select item_id, calculation_version_id, CUST_DECIMAL_FORMULA_UNIT from {{itemExt}}`);
				expect(result).toMatchData({
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CUST_DECIMAL_FORMULA_UNIT":[null,null,sDefaultValue,null,"G"],			
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			});
			
			it("should set the value of a UoM masterdata custom field to the default value(in masterdata extension table and item table)", function() {
				// arrange		
				oMockstar.insertTableData("itemExt",{
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CMPR_DECIMAL_WITH_UOM_MANUAL":[30,400.5,50.88,60.96,700],
					"CMPR_DECIMAL_WITH_UOM_UNIT":[null,null,null,null,"G"]
				});
	
				const oMaterialPriceTestDataPlc = new TestDataUtility(testData.oMaterialPriceTestDataPlc).addProperty("_VALID_TO", [null,null,null,"2018-01-19T12:27:23.197Z"]).build();
				oMockstar.insertTableData("materialPrice", oMaterialPriceTestDataPlc);

				oMockstar.insertTableData("materialPriceExt",{
					"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
			        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
			        "CMPR_DECIMAL_WITH_UOM_MANUAL" : [null, null, null, null],
		    		"CMPR_DECIMAL_WITH_UOM_UNIT" : [null,  null, null, null]
				});
				const sDefaultValue = "KG";
				//set default value in metadata for CMPR_DECIMAL_WITH_UOM_UNIT
				oMockstar.execSingle(`update {{metadataItemAttributes}} set default_value = '${sDefaultValue}'
				                     where path = '${constants.BusinessObjectTypes.Item}' and business_object = '${constants.BusinessObjectTypes.Item}' 
				            	     and column_id = 'CMPR_DECIMAL_WITH_UOM_UNIT' and item_category_id in (1,2,4,6)`);
				oMockstar.execSingle(`update {{metadataItemAttributes}} set default_value = '${sDefaultValue}'
					                 where path = '${constants.BusinessObjectTypes.MaterialPrice}' and business_object = '${constants.BusinessObjectTypes.MaterialPrice}' 
					           	     and column_id = 'CMPR_DECIMAL_WITH_UOM_UNIT'`);

				const oMetadataUnit = {
					"PATH" : constants.BusinessObjectTypes.MaterialPrice,
					"BUSINESS_OBJECT": constants.BusinessObjectTypes.MaterialPrice,
					"COLUMN_ID" : "CMPR_DECIMAL_WITH_UOM",
					"UOM_CURRENCY_FLAG" : 0,
					"REF_UOM_CURRENCY_PATH": constants.BusinessObjectTypes.MaterialPrice,
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": constants.BusinessObjectTypes.MaterialPrice,
					"REF_UOM_CURRENCY_COLUMN_ID": "CMPR_DECIMAL_WITH_UOM_UNIT"
				};	
				// act
				const iResult = oPersistency.Metadata.updateUnitField(oMetadataUnit);

				// assert
				//check the table - the default value is set only for items with item category 1/2/4/6
				const aResultItemExt = oMockstar.execQuery(`select ITEM_ID, CALCULATION_VERSION_ID, CMPR_DECIMAL_WITH_UOM_UNIT from {{itemExt}}`);
				expect(aResultItemExt).toMatchData({
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 4809, 5809 ],
					"CMPR_DECIMAL_WITH_UOM_UNIT":[null,sDefaultValue,null,null,"G"],		
				}, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
				
				//the boolean default value is set for all masterdata entries (even outdated ones) that were having CMPR_BOOLEAN_INT_MANUAL = null
				const aResultMdExt = oMockstar.execQuery(`select PRICE_ID, CMPR_DECIMAL_WITH_UOM_UNIT from {{materialPriceExt}}`);
				expect(aResultMdExt).toMatchData({
					"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
		    		"CMPR_DECIMAL_WITH_UOM_UNIT" : [sDefaultValue,  sDefaultValue, sDefaultValue, sDefaultValue]	
				}, ["PRICE_ID"]);
			});
		});

		describe('updateManualFieldForCustomFields', function() {
			
			let oForumula = { "FORMULA_ID": 1234,
							   "PATH": "Item",
							   "BUSINESS_OBJECT": "Item",
							   "COLUMN_ID": "CUST_DECIMAL_WITHOUT_REF",
							   "ITEM_CATEGORY_ID": 3,
							   "IS_FORMULA_USED": 0,
							   "FORMULA_STRING": "1+1",
							   "FORMULA_DESCRIPTION": ""
							 };
							 
			let oItemExt = {
					"ITEM_ID" :  3003,
					"CALCULATION_VERSION_ID" :  2809,
					"CUST_DECIMAL_WITHOUT_REF_MANUAL":null,
					"CUST_DECIMAL_WITHOUT_REF_CALCULATED":50,
					"CUST_DECIMAL_WITHOUT_REF_UNIT":null,
					"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":1
			};

			
			var oItemTestData = new TestDataUtility(testData.oItemTestData).build();
			
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("metadataItemAttributes", testData.oMetadataItemAttributesCustTestData);
				oMockstar.insertTableData("metadata",testData.oMetadataCustTestData);
				oMockstar.insertTableData("item", testData.oItemTestData);
				oMockstar.insertTableData("itemExt",testData.oItemExtTestData);
				oMockstar.upsertTableData("itemExt",oItemExt);
				oMockstar.insertTableData("formula",testData.oFormulaTestData);
				oMockstar.upsertTableData("formula",oForumula);
				
				
			});

			it('should maintain the null manual value when the formula is deleted', function() {
				// arrange
				var oMetaCustomField = {
								"PATH" : "Item",
								"BUSINESS_OBJECT" : "Item",
								"COLUMN_ID" : "CUST_DECIMAL_WITHOUT_REF",
								"ROLLUP_TYPE_ID" : 0
							  };
				// act
				oPersistency.Metadata.updateManualField(oMetaCustomField);

				// assert
				// check if the manual value of the custom field is still null
				var oItemsUpdated = oMockstar.execQuery("select ITEM_ID, CUST_DECIMAL_WITHOUT_REF_MANUAL, CUST_DECIMAL_WITHOUT_REF_CALCULATED, CUST_DECIMAL_WITHOUT_REF_IS_MANUAL from {{itemExt}}");
				const expectedItems = { ITEM_ID: [3003],
										CUST_DECIMAL_WITHOUT_REF_MANUAL:[null],
										CUST_DECIMAL_WITHOUT_REF_CALCULATED: ["50.0000000"],
										CUST_DECIMAL_WITHOUT_REF_IS_MANUAL: [1]
				}
				
				expect(oItemsUpdated).toMatchData(expectedItems, ["ITEM_ID", "CUST_DECIMAL_WITHOUT_REF_MANUAL", "CUST_DECIMAL_WITHOUT_REF_CALCULATED", "CUST_DECIMAL_WITHOUT_REF_IS_MANUAL"]);
			});
		});
	}

	describe('checkIsUsedAsOverheadCustom', function () {

		var oMetaTestData =
		{
			"PATH": "Item",
			"BUSINESS_OBJECT": "Item",
			"COLUMN_ID": "CUST_OVERHEAD",
			"IS_CUSTOM": 1,
			"ROLLUP_TYPE_ID": 0,
			"SIDE_PANEL_GROUP_ID": 101,
			"DISPLAY_ORDER": 1,
			"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
			"REF_UOM_CURRENCY_COLUMN_ID": null,
			"UOM_CURRENCY_FLAG": null,
			"SEMANTIC_DATA_TYPE": "Integer",
			"SEMANTIC_DATA_TYPE_ATTRIBUTES": null,
			"IS_REQUIRED_IN_MASTERDATA": null,
			"IS_WILDCARD_ALLOWED": null,
			"RESOURCE_KEY_DISPLAY_NAME": null,
			"RESOURCE_KEY_DISPLAY_DESCRIPTION": null

		};

		var oCostingCostingSheetOverheadRowTestData =
		{
			"COSTING_SHEET_OVERHEAD_ROW_ID": [55, 56],
			"COSTING_SHEET_OVERHEAD_ID": [24, 25],
			"VALID_FROM": ['2015-01-01T15:39:09.691Z', '2014-01-01T15:39:09.691Z'],
			"VALID_TO": ["2015-08-08T00:00:00.000Z", "2016-08-08T00:00:00.000Z"],
			"CONTROLLING_AREA_ID": ['#CA1', '#CA1'],
			"COMPANY_CODE_ID": [null, null],
			"BUSINESS_AREA_ID": [null, null],
			"PROFIT_CENTER_ID": [null, null],
			"PLANT_ID": [null, null],
			"OVERHEAD_GROUP_ID": [null, null],
			"OVERHEAD_PERCENTAGE": [null, null],
			"PROJECT_ID": [null, null],
			"ACTIVITY_TYPE_ID": [null, null],
			"COST_CENTER_ID": [null, null],
			"WORK_CENTER_ID": [null, null],
			"OVERHEAD_QUANTITY_BASED": [null, null],
			"OVERHEAD_CURRENCY_ID": [null, null],
			"OVERHEAD_PRICE_UNIT": [null, null],
			"OVERHEAD_PRICE_UNIT_UOM_ID": [null, null],
			"CREDIT_FIXED_COST_PORTION": [10, 10],
			"FORMULA_ID": [1, 1],
			"_VALID_FROM": ['2000-01-01T15:39:09.691Z', '2001-01-01T15:39:09.691Z'],
			"_VALID_TO": [null, null],
			"_SOURCE": [1, 1],
			"_CREATED_BY": ['#CONTROLLER', '#CONTROLLER']
		};

		var oCostingSheetOverheadRowFormulaTestData = {
			"FORMULA_ID": 1,
			"FORMULA_STRING": "1+1",
			"FORMULA_DESCRIPTION": null,
			"OVERHEAD_CUSTOM": "CUST_OVERHEAD"
		};

		beforeEach(function () {
			oMockstar.clearAllTables();
			oMockstar.insertTableData("metadata", oMetaTestData);
			oMockstar.insertTableData("costingSheetOverheadRow", oCostingCostingSheetOverheadRowTestData);
			oMockstar.insertTableData("costingSheetOverheadRowFormula", oCostingSheetOverheadRowFormulaTestData);
		});

		it('should return array containing name of custom field if it is used as overhead custom in valid costing sheet', function () {
			// arrange

			// act
			var aResult = oPersistency.Metadata.checkIsUsedAsOverheadCustom(oMetaTestData);

			// assert
			expect(aResult[0].OVERHEAD_CUSTOM).toEqual("CUST_OVERHEAD");
		});

        it('should return empty array if custom field is not used as overhead custom in valid costing sheet', function () {
			// arrange
			var oMetaTestData =
			{
				"PATH": "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID": "CUST_NOT_OVERHEAD_CUSTOM",
				"IS_CUSTOM": 1,
				"ROLLUP_TYPE_ID": 0,
				"SIDE_PANEL_GROUP_ID": 101,
				"DISPLAY_ORDER": 1,
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
				"REF_UOM_CURRENCY_COLUMN_ID": null,
				"UOM_CURRENCY_FLAG": null,
				"SEMANTIC_DATA_TYPE": "Integer",
				"SEMANTIC_DATA_TYPE_ATTRIBUTES": null,
				"IS_REQUIRED_IN_MASTERDATA": null,
				"IS_WILDCARD_ALLOWED": null,
				"RESOURCE_KEY_DISPLAY_NAME": null,
				"RESOURCE_KEY_DISPLAY_DESCRIPTION": null
			};
			// act
			var aResult = oPersistency.Metadata.checkIsUsedAsOverheadCustom(oMetaTestData);

			// assert
			expect(aResult.length).toEqual(0);
		});
		
	});
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
