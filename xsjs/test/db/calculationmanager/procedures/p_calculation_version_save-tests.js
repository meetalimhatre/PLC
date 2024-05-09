/*jslint undef:true*/

var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var test_helpers = require("../../../testtools/test_helpers");
var testdata = require("../../../testdata/testdata").data;
var _ = require("lodash");
const TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;
const sStandardPriceStrategy = testdata.sStandardPriceStrategy;
describe('p_calculation_version_save', function() {

	var mockstar = null;

	beforeOnce(function() {

		mockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_save", // procedure or view under test
					substituteTables: // substitute all used tables in the procedure or view
					{
						item_temporary: {
							name: "sap.plc.db::basis.t_item_temporary"                        
						},
						item: {
							name: "sap.plc.db::basis.t_item"
						},
						calculation_version_temporary: {
							name: "sap.plc.db::basis.t_calculation_version_temporary"                        
						},
						calculation_version: {
							name: "sap.plc.db::basis.t_calculation_version"
						},
						session: {
							name: "sap.plc.db::basis.t_session"                        
						},
						item_ext: "sap.plc.db::basis.t_item_ext",
						item_temporary_ext: "sap.plc.db::basis.t_item_temporary_ext"
					}
				});
	});

	afterOnce(function() {
		//mockstar.cleanup(); // clean up all test artefacts
		mockstar.cleanup(testdata.testPackage+"sap.plc.db.calculationmanager.procedures");
	});

	beforeEach(function() {
		mockstar.clearAllTables(); // clear all specified substitute tables and views
		//mockstar.initializeData();
		mockstar.insertTableData("item_temporary", testdata.oItemTemporaryTestData);
		mockstar.insertTableData("calculation_version_temporary", testdata.oCalculationVersionTemporaryTestData);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			mockstar.insertTableData("item_temporary_ext", testdata.oItemTemporaryExtData);
		}
		mockstar.insertTableData("session", testdata.oSessionTestData);
	});

	afterEach(function() {

	});

	it('copyTemporaryItemsAndVersion_CalculationVersionIDSessionIDLanguage_valuesInsertedInItemTable(_andInItemExtensionTableInCaseOfCustomFields)', function() {
		//arrange
		var iCalculationVersionID = 2809;
		var iExpectedItemCount = 3;

		var oExpectedData = JSON.parse(JSON.stringify(testdata.oItemTestData)); 
		_.each(oExpectedData, function(value, key){ oExpectedData[key] = value.splice(0, value.length-2);});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
		    var oExpectedCustData = JSON.parse(JSON.stringify(testdata.oItemExtData)); 
		    _.each(oExpectedCustData, function(value, key){ oExpectedCustData[key] = value.splice(0, value.length-2);});
		}
		
		//dates will be set new after save and thus cannot be equal
		delete oExpectedData.CREATED_ON;
		delete oExpectedData.LAST_MODIFIED_ON;
		oExpectedData.CREATED_BY = [testdata.sTestUser,testdata.sTestUser,testdata.sTestUser];
		oExpectedData.LAST_MODIFIED_BY  = [testdata.sTestUser,testdata.sTestUser,testdata.sTestUser];

		//act
		var result = mockstar.call(iCalculationVersionID, testdata.sSessionId);

		//assert
		// Execute query and check result	
		var queryResult = mockstar.execQuery("select count(*) as C from {{item}}");
		expect(queryResult).toBeDefined();
		// Check result of procedure Call
		var expectedResultJsonData = {
				'C': [iExpectedItemCount]
		};
		expect(queryResult).toMatchData(expectedResultJsonData, ['C']);
		
	    queryResult = mockstar.execQuery("select * from {{item}} where ITEM_ID = 3001 OR ITEM_ID = 3002 OR ITEM_ID=3003");
		queryResult = mockstar_helpers.convertResultToArray(queryResult);
		delete queryResult.CREATED_ON;
		delete queryResult.LAST_MODIFIED_ON;
		
		expect(queryResult).toMatchData(oExpectedData, ['ITEM_ID']);

		if(jasmine.plcTestRunParameters.generatedFields === true){
			queryResult = mockstar.execQuery("select * from {{item_ext}} where ITEM_ID = 3001 OR ITEM_ID = 3002 OR ITEM_ID=3003");
			queryResult = mockstar_helpers.convertResultToArray(queryResult);
			expect(queryResult).toMatchData(oExpectedCustData, ['ITEM_ID']);
		}
	});

	if(jasmine.plcTestRunParameters.mode === 'all'){
		it('copyTemporaryItemsAndVersion_CalculationVersionIDSessionIDLanguage_valuesInsertedInItemAndCalculationVersionTable', function() {
			//arrange
			var iCalculationVersionID = 2809;
			var iExpectedVersionCount = 1;

			var oExpectedData = JSON.parse(JSON.stringify(testdata.oCalculationVersionTestData)); 
			_.each(oExpectedData, function(value, key){ oExpectedData[key]= value.splice(0, value.length-2);});
			//dates will be set new after save and thus cannot be equal
			delete oExpectedData.LAST_MODIFIED_ON;
			delete oExpectedData.MASTER_DATA_TIMESTAMP;        
			oExpectedData.LAST_MODIFIED_BY  = [testdata.sTestUser];


			//act
			var result = mockstar.call(iCalculationVersionID, testdata.sSessionId);

			//assert
			// Execute query and check result
			var queryResult = mockstar.execQuery("select count(*) as C from {{calculation_version}}");
			expect(queryResult).toBeDefined();
			// Check result of procedure Call
			var expectedResultJsonData = {
					'C': [iExpectedVersionCount]
			};
			expect(queryResult).toMatchData(expectedResultJsonData, ['C']);

			queryResult = mockstar.execQuery("SELECT * from {{calculation_version}} where calculation_version_id = " + iCalculationVersionID);
			queryResult = mockstar_helpers.convertResultToArray(queryResult);
			delete queryResult.LAST_MODIFIED_ON;

			var iQueryMasterdataTimestampMillis = Date.parse(queryResult.MASTER_DATA_TIMESTAMP);
			var iQriginalMasterdataTimestampMillis = Date.parse(testdata.oCalculationVersionTestData.MASTER_DATA_TIMESTAMP[0]);
			expect(iQueryMasterdataTimestampMillis).toEqual(iQriginalMasterdataTimestampMillis);
			delete queryResult.MASTER_DATA_TIMESTAMP;

			expect(queryResult).toMatchData(oExpectedData, ['CALCULATION_VERSION_ID']);
		});
	}

	it('copyChangedTemporaryItemsAndVersion_CalculationVersionIDSessionIDLanguage_valuesUpdatedInItemTable(_andInItemExtensionTableInCaseOfCustomFields)', function() {
		//arrange
		var iCalculationVersionID = 2809;
		var iExpectedItemCount = 156;
		var iItemID = 3001;

		if(jasmine.plcTestRunParameters.generatedFields === true){
			var oExpectedCustData = JSON.parse(JSON.stringify(testdata.oItemExtData)); 
			_.each(oExpectedCustData, function(value, key){ oExpectedCustData[key] = value.splice(0, value.length-4);});
			oExpectedCustData.CUST_STRING_MANUAL = "Test_Change";
			mockstar.insertTableData("item_ext", testdata.oItemExtData);
			mockstar.upsertTableData("item_temporary_ext", {
				"SESSION_ID": testdata.sSessionId,
				"ITEM_ID": iItemID,
				"CALCULATION_VERSION_ID": iCalculationVersionID,
				"CUST_STRING_MANUAL": "Test_Change"
			},  "ITEM_ID = 3001 AND SESSION_ID = '" + testdata.sSessionId + "'");
		}

		var oExpectedData = JSON.parse(JSON.stringify(testdata.oItemTestData)); 
		_.each(oExpectedData, function(value, key){ oExpectedData[key] = value.splice(0, value.length-4);});
		//dates will be set new after save and thus cannot be equal
		delete oExpectedData.CREATED_ON;
		delete oExpectedData.LAST_MODIFIED_ON;
		oExpectedData.IS_ACTIVE = [0];

		mockstar.insertTableData("item", testdata.oItemTestData);
		mockstar.upsertTableData("item_temporary", {
			"SESSION_ID": testdata.sSessionId,
			"ITEM_ID": iItemID,
			"CALCULATION_VERSION_ID": iCalculationVersionID,
			"IS_ACTIVE": 0,
			"ITEM_CATEGORY_ID": 0,
			"CHILD_ITEM_CATEGORY_ID": 0,
			"IS_DIRTY": 1,
			"PRICE_FIXED_PORTION": "0.0000000",
			"PRICE_VARIABLE_PORTION": "0.0000000",
			"TRANSACTION_CURRENCY_ID": 'EUR',
			"PRICE_UNIT" :"0.0000000",
			"PRICE_UNIT_UOM_ID": 'H'
		}, "ITEM_ID = 3001 AND SESSION_ID = '" + testdata.sSessionId + "'");

		//act
		var result = mockstar.call(iCalculationVersionID, testdata.sSessionId);

		//assert
		var queryResult = mockstar.execQuery("select * from {{item}} where ITEM_ID = " + iItemID);
		expect(queryResult).toMatchData(oExpectedData, ['ITEM_ID']);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			queryResult = mockstar.execQuery("select * from {{item_ext}} where ITEM_ID = " + iItemID);
			queryResult = mockstar_helpers.convertResultToArray(queryResult);
			expect(queryResult).toMatchData(oExpectedCustData, ['ITEM_ID']);
		}
	});

	if(jasmine.plcTestRunParameters.mode === 'all'){
		it('copyChangedTemporaryItemsAndVersion_CalculationVersionIDSessionIDLanguage_valuesUpdatedInCalculationVersionTable', function() {
			//arrange
			var iCalculationVersionID = 2809;
			var iExpectedVersionCount = 3;
			var iCalculationID = 1978;
			var dValuationDate = new Date(Date.UTC(2011,8,20)).toJSON();

			var oExpectedData = JSON.parse(JSON.stringify(testdata.oCalculationVersionTestData)); 
			_.each(oExpectedData, function(value, key){ oExpectedData[key] = value.splice(0, value.length-2);});
			//dates will be set new after save and thus cannot be equal
			delete oExpectedData.LAST_MODIFIED_ON;        
			oExpectedData.LAST_MODIFIED_BY  = [testdata.sTestUser];
			oExpectedData.VALUATION_DATE = [dValuationDate];

			mockstar.insertTableData("calculation_version", testdata.oCalculationVersionTestData);
			//update lotsize to 1
			mockstar.upsertTableData("calculation_version_temporary", {
				"SESSION_ID": testdata.sSessionId,
				"CALCULATION_VERSION_ID": iCalculationVersionID,
				"CALCULATION_ID": iCalculationID,            
				"CALCULATION_VERSION_NAME": "Baseline Version1",
				"ROOT_ITEM_ID": 3001,   
				"REPORT_CURRENCY_ID": "EUR",
				"VALUATION_DATE": dValuationDate,
				"MATERIAL_PRICE_STRATEGY_ID": sStandardPriceStrategy,
				"ACTIVITY_PRICE_STRATEGY_ID": sStandardPriceStrategy
			}, "CALCULATION_VERSION_ID = " + iCalculationVersionID + " AND SESSION_ID =  '" + testdata.sSessionId + "'");

			//act
			var result = mockstar.call(iCalculationVersionID, testdata.sSessionId);

			//assert
			// Execute query and check result
			var queryResult = mockstar.execQuery("select count(*) as C from {{calculation_version}}");
			expect(queryResult).toBeDefined();
			// Check result of procedure Call
			var expectedResultJsonData = {
					'C': [iExpectedVersionCount]
			};
			expect(queryResult).toMatchData(expectedResultJsonData, ['C']);

			queryResult = mockstar.execQuery("SELECT * from {{calculation_version}} where calculation_version_id = " + iCalculationVersionID);
			queryResult = mockstar_helpers.convertResultToArray(queryResult);
			delete queryResult.LAST_MODIFIED_ON;

			expect(queryResult).toMatchData(oExpectedData, ['CALCULATION_VERSION_ID']);
		});
	}

	it('copyTemporaryItemsAndVersion_CalculationVersionIDSessionIDLanguage_valuesCopiedFromCorrectSessionIfOpenedMultipleTimes(_AlsoInItemExtensionTableInCaseOfCustomFields)', function() {
		//arrange
		var iCalculationVersionID = 1234;
		var iExpectedItemCount = 1;
		var dDate = (new Date()).toJSON();

		mockstar.upsertTableData("item_temporary", {
			"SESSION_ID": testdata.sSessionId,
			"ITEM_ID": 3001,
			"CALCULATION_VERSION_ID": iCalculationVersionID,
			"IS_ACTIVE": 1,
			"ITEM_CATEGORY_ID": 1,
			"CHILD_ITEM_CATEGORY_ID": 1,
			"CREATED_ON": dDate,
			"CREATED_BY": testdata.sTestUser,
			"LAST_MODIFIED_ON": dDate,
			"LAST_MODIFIED_BY": testdata.sTestUser,
			"PRICE_FIXED_PORTION": "1.0000000",
			"PRICE_VARIABLE_PORTION": "0.0000000",
			"TRANSACTION_CURRENCY_ID": 'EUR',
			"PRICE_UNIT" : "1.0000000",
			"PRICE_UNIT_UOM_ID": 'EUR'
		}, "ITEM_ID = 3001 AND SESSION_ID = '" + testdata.sSessionId + "'");

		mockstar.upsertTableData("item_temporary", {
			"SESSION_ID": testdata.sSecondSessionId,
			"ITEM_ID": 3001,
			"CALCULATION_VERSION_ID": iCalculationVersionID,
			"IS_ACTIVE": 0,
			"ITEM_CATEGORY_ID": 0,
			"CHILD_ITEM_CATEGORY_ID": 0,
			"CREATED_ON": dDate,
			"CREATED_BY": testdata.sTestUser,
			"LAST_MODIFIED_ON": dDate,
			"LAST_MODIFIED_BY": testdata.sTestUser,
			"PRICE_FIXED_PORTION": "1.0000000",
			"PRICE_VARIABLE_PORTION": "0.0000000",
			"TRANSACTION_CURRENCY_ID": 'EUR',
			"PRICE_UNIT" : "1.0000000",
			"PRICE_UNIT_UOM_ID": 'EUR'
		}, "ITEM_ID = 3001 AND SESSION_ID = '" + testdata.sSecondSessionId + "'");
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			mockstar.upsertTableData("item_temporary_ext", {
				"SESSION_ID": testdata.sSessionId,
				"ITEM_ID": 3001,
				"CALCULATION_VERSION_ID": iCalculationVersionID,
				"CUST_STRING_MANUAL": "Test_Changed 1"
			}, "ITEM_ID = 3001 AND SESSION_ID = '" + testdata.sSessionId + "'");
			
			mockstar.upsertTableData("item_temporary_ext", {
				"SESSION_ID": testdata.sSecondSessionId,
				"ITEM_ID": 3001,
				"CALCULATION_VERSION_ID": iCalculationVersionID,
				"CUST_STRING_MANUAL": "Test_Changed 2"
			}, "ITEM_ID = 3001 AND SESSION_ID = '" + testdata.sSecondSessionId + "'");
		}

		//act
		var result = mockstar.call(iCalculationVersionID, testdata.sSecondSessionId);

		//assert
		// Execute query and check result
		var queryResult = mockstar.execQuery("select count(*) as C from {{item}}");
		expect(queryResult).toBeDefined();
		// Check result of procedure Call
		var expectedResultJsonData = {
				'C': [iExpectedItemCount]
		};
		expect(queryResult).toMatchData(expectedResultJsonData, ['C']);

		//assert
		var queryResult = mockstar.execQuery("select item_id, calculation_version_id, is_active, item_category_id" +
		" from {{item}} where ITEM_ID = 3001");
		var expectedData = {
				ITEM_ID: [3001],
				CALCULATION_VERSION_ID: [iCalculationVersionID],
				IS_ACTIVE: [0],
				ITEM_CATEGORY_ID: [0]
		};
		expect(queryResult).toMatchData(expectedData, ['ITEM_ID']);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			var queryResultExt = mockstar.execQuery("select count(*) as C from {{item_ext}}");
			expect(queryResultExt).toBeDefined();
			// Check result of procedure Call
			var expectedResultJsonDataExt = {
					'C': [iExpectedItemCount]
			};
			expect(queryResultExt).toMatchData(expectedResultJsonDataExt, ['C']);
			var queryResultExt = mockstar.execQuery("select item_id, calculation_version_id, CUST_STRING_MANUAL" +
			" from {{item_ext}} where ITEM_ID = 3001");
			var expectedDataExt = {
					ITEM_ID: [3001],
					CALCULATION_VERSION_ID: [iCalculationVersionID],
					CUST_STRING_MANUAL: ["Test_Changed 2"]
			};
			expect(queryResultExt).toMatchData(expectedDataExt, ['ITEM_ID']);
		}
	});

	if(jasmine.plcTestRunParameters.mode === 'all'){
		it('setChangedAtChangedByFields_CalculationVersionIDSessionIDLanguage_FieldsSetCorrectly', function() {
			//arrange
			var iCalculationVersionID = 2809;
			var iItemID = 3001;
			var iUnchangedItemID = 3002;
			var notExpectedDate = new Date(0);
			var dDate = (notExpectedDate).toJSON();

			mockstar.insertTableData("item", testdata.oItemTestData);
			mockstar.upsertTableData("item_temporary", {
				"SESSION_ID": testdata.sSessionId,
				"ITEM_ID": iItemID,
				"CALCULATION_VERSION_ID": iCalculationVersionID,
				"IS_ACTIVE": 1,
				"ITEM_CATEGORY_ID": 1,
				"CHILD_ITEM_CATEGORY_ID": 1,
				"IS_DIRTY": 1,
				"LAST_MODIFIED_ON": dDate,
				"PRICE_FIXED_PORTION":  "1.0000000",
				"PRICE_VARIABLE_PORTION": "0.0000000",
				"TRANSACTION_CURRENCY_ID": 'EUR',
				"PRICE_UNIT" : "1.0000000",
				"PRICE_UNIT_UOM_ID": 'EUR'
			}, "ITEM_ID = " + iItemID + " AND SESSION_ID = '" + testdata.sSessionId + "'");

			//act
			var result = mockstar.call(iCalculationVersionID, testdata.sSessionId);

			//assert
			var queryResult = mockstar.execQuery("select item_id, calculation_version_id, is_active, item_category_id, last_modified_by" +
					" from {{item}} where ITEM_ID = " + iItemID);
			var expectedData = {
					ITEM_ID: [iItemID],
					CALCULATION_VERSION_ID: [iCalculationVersionID],
					IS_ACTIVE: [1],
					ITEM_CATEGORY_ID: [1],
					LAST_MODIFIED_BY: [testdata.sTestUser]
			};
			expect(queryResult).toMatchData(expectedData, ['ITEM_ID']);

			queryResult = mockstar.execQuery("select LAST_MODIFIED_ON from {{item}} where ITEM_ID =" + iItemID);
			var dModifiedAt = queryResult.columns.LAST_MODIFIED_ON.rows[0];
			expect(dModifiedAt != notExpectedDate).toBeTruthy();

			//unchanged items should not be updated
			queryResult = mockstar.execQuery("select item_id, calculation_version_id, is_active, item_category_id, last_modified_by" +
					" from {{item}} where ITEM_ID = " + iUnchangedItemID);
			var expectedData = {
					ITEM_ID: [iUnchangedItemID],
					CALCULATION_VERSION_ID: [iCalculationVersionID],
					IS_ACTIVE: [1],
					ITEM_CATEGORY_ID: [1],
					LAST_MODIFIED_BY: [testdata.sSecondUser]
			};
			expect(queryResult).toMatchData(expectedData, ['ITEM_ID']);

			queryResult = mockstar.execQuery("select LAST_MODIFIED_ON from {{item}} where ITEM_ID =" + iUnchangedItemID);
			var dUnchangedModifiedAt = queryResult.columns.LAST_MODIFIED_ON.rows[0];
			expect(dModifiedAt != dUnchangedModifiedAt).toBeTruthy();

		});

		it('setCreatedOnCreatedByFields_CalculationVersionIDSessionIDLanguage_FieldsSetCorrectly', function() {
			//arrange
			var iCalculationVersionID = 2809;
			var iItemID = 666;
			var notExpectedDate = new Date(0);
			var dDate = (notExpectedDate).toJSON();

			mockstar.insertTableData("item", testdata.oItemTestData);
			mockstar.upsertTableData("item_temporary", {
				"SESSION_ID": testdata.sSessionId,
				"ITEM_ID": iItemID,
				"CALCULATION_VERSION_ID": iCalculationVersionID,
				"IS_ACTIVE": 1,
				"ITEM_CATEGORY_ID": 1,
				"CHILD_ITEM_CATEGORY_ID": 1,
				"IS_DIRTY": 1,
				"LAST_MODIFIED_ON": dDate,
				"PRICE_FIXED_PORTION": "1.0000000",
				"PRICE_VARIABLE_PORTION": "0.0000000",
				"TRANSACTION_CURRENCY_ID": 'EUR',
				"PRICE_UNIT" : "1.0000000",
				"PRICE_UNIT_UOM_ID": 'EUR'
			}, "ITEM_ID = " + iItemID + " AND SESSION_ID = '" + testdata.sSessionId + "'");

			//act
			var result = mockstar.call(iCalculationVersionID, testdata.sSessionId);

			//assert
			var queryResult = mockstar.execQuery("select item_id, calculation_version_id, is_active, item_category_id, created_by" +
					" from {{item}} where ITEM_ID = " + iItemID);
			var expectedData = {
					ITEM_ID: [iItemID],
					CALCULATION_VERSION_ID: [iCalculationVersionID],
					IS_ACTIVE: [1],
					ITEM_CATEGORY_ID: [1],
					CREATED_BY: [testdata.sTestUser]
			};
			expect(queryResult).toMatchData(expectedData, ['ITEM_ID']);

			queryResult = mockstar.execQuery("select CREATED_ON from {{item}} where ITEM_ID =" + iItemID);
			var dCreatedOn = queryResult.columns.CREATED_ON.rows[0];
			expect(dCreatedOn != notExpectedDate).toBeTruthy();


			//check if last modified fields have also been set 
			queryResult = mockstar.execQuery("select item_id, calculation_version_id, is_active, item_category_id, last_modified_by" +
					" from {{item}} where ITEM_ID = " + iItemID);
			var expectedData = {
					ITEM_ID: [iItemID],
					CALCULATION_VERSION_ID: [iCalculationVersionID],
					IS_ACTIVE: [1],
					ITEM_CATEGORY_ID: [1],
					LAST_MODIFIED_BY: [testdata.sTestUser]
			};
			expect(queryResult).toMatchData(expectedData, ['ITEM_ID']);

			queryResult = mockstar.execQuery("select LAST_MODIFIED_ON from {{item}} where ITEM_ID =" + iItemID);
			var dModifiedOn = queryResult.columns.LAST_MODIFIED_ON.rows[0];
			expect(dModifiedOn).toEqual(dCreatedOn);

			//check that created_by and last_modified_by were set for calculation_version_item
			queryResult = mockstar.execQuery("select item_id,created_by, last_modified_by from {{item}} where ITEM_ID = 3001");
			var expectedData = {
					ITEM_ID: [3001],
					CREATED_BY: [testdata.sTestUser],
					LAST_MODIFIED_BY: [testdata.sTestUser]
			};
			expect(queryResult).toMatchData(expectedData, ['ITEM_ID']);
		});

		it('setCreatedOnCreatedByFieldsAndSaveAs_CalculationVersionIDSessionIDLanguage_FieldsSetCorrectly', function() {
			//arrange
			var iNewCalculationVersionID = 3909;
			var iOldCalculationVersionID = 2809;
			var iRootItemId = 3001;


			var oModifiedItemTestData = JSON.parse(JSON.stringify(testdata.oItemTestData)); 
			oModifiedItemTestData.CREATED_BY=[testdata.sSecondUser,testdata.sSecondUser,testdata.sSecondUser,testdata.sSecondUser,testdata.sSecondUser];
			oModifiedItemTestData.LAST_MODIFIED_BY=[testdata.sSecondUser,testdata.sSecondUser,testdata.sSecondUser,testdata.sSecondUser,testdata.sSecondUser];

			mockstar.insertTableData("item", oModifiedItemTestData);

			mockstar.upsertTableData("item_temporary", {
				"SESSION_ID": testdata.sSessionId,
				"ITEM_ID": iRootItemId,
				"CALCULATION_VERSION_ID": iNewCalculationVersionID,
				"IS_ACTIVE": 1,
				"ITEM_CATEGORY_ID": 1,
				"CHILD_ITEM_CATEGORY_ID": 1,
				"ITEM_DESCRIPTION": "Descr",
				"COMMENT": "remark",
				"PRICE_FIXED_PORTION": "1.0000000",
				"PRICE_VARIABLE_PORTION": "0.0000000",
				"TRANSACTION_CURRENCY_ID": 'EUR',
				"PRICE_UNIT" : "1.0000000",
				"PRICE_UNIT_UOM_ID": 'EUR'
			}, "ITEM_ID = " + iRootItemId + " AND CALCULATION_VERSION_ID = " + iOldCalculationVersionID + " AND SESSION_ID =  '" + testdata.sSessionId + "'");


			//act
			var result = mockstar.call(iNewCalculationVersionID, testdata.sSessionId);

			//assert
			// Check that created_by field of root item id for saveAs calculation has been changed
			var queryResult = mockstar.execQuery("select item_id, calculation_version_id, is_active, item_category_id, created_by, last_modified_by" +
					" from {{item}} where ITEM_ID = " + iRootItemId + " and calculation_version_id = " + iNewCalculationVersionID);
			var expectedData = {
					ITEM_ID: [iRootItemId],
					CALCULATION_VERSION_ID: [iNewCalculationVersionID],
					CREATED_BY: [testdata.sTestUser],
					LAST_MODIFIED_BY: [testdata.sTestUser]
			};
			expect(queryResult).toMatchData(expectedData, ['ITEM_ID']);

			//assert
			// Check that created_by field of root item id for old calculation have not been changed
			var queryResult = mockstar.execQuery("select item_id, calculation_version_id, is_active, item_category_id, created_by, last_modified_by" +
					" from {{item}} where ITEM_ID = " + iRootItemId + " and calculation_version_id = " + iOldCalculationVersionID);
			var expectedData = {
					ITEM_ID: [iRootItemId],
					CALCULATION_VERSION_ID: [iOldCalculationVersionID],
					CREATED_BY: [testdata.sSecondUser],
					LAST_MODIFIED_BY: [testdata.sSecondUser]
			};
			expect(queryResult).toMatchData(expectedData, ['ITEM_ID']);
		});

		it('should not modify the master_data_timestamp during save', function(){
			//arrange
			var iCvIndexInTestData = _.indexOf(testdata.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID, testdata.iCalculationVersionId);
			var iOriginalMasterDataTimestampMillis =  Date.parse(testdata.oCalculationVersionTemporaryTestData.MASTER_DATA_TIMESTAMP[iCvIndexInTestData]);

			//act
			mockstar.call(testdata.iCalculationVersionId, testdata.sSessionId);

			//assert
			var queryResult = mockstar.execQuery("select master_data_timestamp" +
					" from {{calculation_version}} where CALCULATION_VERSION_ID = " + testdata.iCalculationVersionId);

			expect(queryResult.columns.MASTER_DATA_TIMESTAMP.rows[0].getTime()).toEqual(iOriginalMasterDataTimestampMillis);
		});

		it('should not set the master_data_timestamp again at save (unless it has been set explicitely during edit)', function(){
			//arrange
			//save initially
			mockstar.call(testdata.iCalculationVersionId, testdata.sSessionId);
			var queryResult = mockstar.execQuery("select master_data_timestamp" +
					" from {{calculation_version}} where CALCULATION_VERSION_ID = " + testdata.iCalculationVersionId);
			var dTimeStamp = queryResult.columns.MASTER_DATA_TIMESTAMP.rows[0];

			//act
			mockstar.call(testdata.iCalculationVersionId, testdata.sSessionId);
			//assert
			queryResult = mockstar.execQuery("select master_data_timestamp" +
					" from {{calculation_version}} where CALCULATION_VERSION_ID = " + testdata.iCalculationVersionId);
			expect(queryResult.columns.MASTER_DATA_TIMESTAMP.rows[0]).toEqual(dTimeStamp);
		});

		it('should set the LAST_MODIFIED_ON and LAST_MODIFIED_BY at save ', function(){
			//arrange
			//save initially
			mockstar.call(testdata.iCalculationVersionId, testdata.sSessionId);
			var queryResult = mockstar.execQuery("select LAST_MODIFIED_ON" +
					" from {{calculation_version}} where CALCULATION_VERSION_ID = " + testdata.iCalculationVersionId);
			var dTimeStamp = queryResult.columns.LAST_MODIFIED_ON.rows[0];

			//act
			mockstar.call(testdata.iCalculationVersionId, testdata.sSessionId);
			//assert
			queryResult = mockstar.execQuery("select LAST_MODIFIED_ON, LAST_MODIFIED_BY" +
					" from {{calculation_version}} where CALCULATION_VERSION_ID = " + testdata.iCalculationVersionId);
			expect(queryResult.columns.LAST_MODIFIED_ON.rows[0]).toBeGreaterThan(dTimeStamp);
			expect(queryResult.columns.LAST_MODIFIED_BY.rows[0]).toBe(testdata.sTestUser);
		});

		it("should insert UTC time for all LAST_MODIFIED_ON, LAST_MODIFIED_ON, CREATED_ON", function(){
			//arrange
			var dStart = new Date();

			//act
			mockstar.call(testdata.iCalculationVersionId, testdata.sSessionId);

			// assert
			var oVersionTimeStampResult = mockstar.execQuery("select LAST_MODIFIED_ON, LAST_MODIFIED_BY" +
					" from {{calculation_version}} where CALCULATION_VERSION_ID = " + testdata.iCalculationVersionId);
			var oItemTimestampResult = mockstar.execQuery("select LAST_MODIFIED_ON, CREATED_ON" +
					" from {{item_temporary}} where CALCULATION_VERSION_ID = " + testdata.iCalculationVersionId);
			var dEnd = new Date();

			jasmine.log("Checking if LAST_MODIFIED_ON (t_calculation_version_temporary) is in UTC");
			test_helpers.checkDateIsBetween(oVersionTimeStampResult.columns.LAST_MODIFIED_ON.rows[0], dStart, dEnd);
			jasmine.log("Checking if LAST_MODIFIED_ON (t_item_temporary) is in UTC");
			test_helpers.checkDateIsBetween(oItemTimestampResult.columns.LAST_MODIFIED_ON.rows[0], dStart, dEnd);
			jasmine.log("Checking if CREATED_ON (t_item_temporary) is in UTC");
			test_helpers.checkDateIsBetween(oItemTimestampResult.columns.CREATED_ON.rows[0], dStart, dEnd);
		}); 

		it('copyChangedTemporaryItemsAndVersion_CalculationVersionIDSessionIDLanguage_DirtyFlagReset', function() {
			//arrange
			var iCalculationVersionID = 2809;
			var iExpectedItemCount = 67;

			var sTestDescription = "TestDescription";
			var sTestRemark = "TestRemark";

			mockstar.upsertTableData("item_temporary", {
				"SESSION_ID": testdata.sSessionId,
				"ITEM_ID": 3001,
				"CALCULATION_VERSION_ID": iCalculationVersionID,
				"IS_ACTIVE": 1,
				"ITEM_CATEGORY_ID": 1,
				"CHILD_ITEM_CATEGORY_ID": 1,
				"ITEM_DESCRIPTION": sTestDescription,
				"COMMENT": sTestRemark,
				"IS_DIRTY": 1,
				"PRICE_FIXED_PORTION": "1.0000000",
				"PRICE_VARIABLE_PORTION": "0.0000000",
				"TRANSACTION_CURRENCY_ID": 'EUR',
				"PRICE_UNIT" : "1.0000000",
				"PRICE_UNIT_UOM_ID": 'EUR'
			}, "ITEM_ID = 3001 AND SESSION_ID =  '" + testdata.sSessionId + "'");

			//act
			var result = mockstar.call(iCalculationVersionID, testdata.sSessionId);

			//assert    
			var queryResult = mockstar.execQuery("SELECT count(*) from {{item_temporary}} where IS_DIRTY = 1 and SESSION_ID = '" + testdata.sSessionId + "'");
			var expectedData = {
					'COUNT(*)': [0]
			};
			expect(queryResult).toMatchData(expectedData, ['COUNT(*)']);
		});
	}

	it('copyTemporaryItemsAndVersionForSaveAs_CalculationVersionIDSessionIDLanguage_additionalItemsInsertedIntoItemTable(_AlsoInItemExtensionTableInCaseOfCustomFields)', function() {
		//arrange
		var iCalculationVersionID = 666;
		var iItemID = 3001;

		mockstar.insertTableData("item", testdata.oItemTestData);
		mockstar.upsertTableData("item_temporary", {
			"SESSION_ID": testdata.sSessionId,
			"ITEM_ID": iItemID,
			"CALCULATION_VERSION_ID": iCalculationVersionID,
			"IS_ACTIVE": 0,
			"ITEM_CATEGORY_ID": 1,
			"CHILD_ITEM_CATEGORY_ID": 1,
			"IS_DIRTY": 1,
			"PRICE_FIXED_PORTION": "1.0000000",
			"PRICE_VARIABLE_PORTION":  "0.0000000",
			"TRANSACTION_CURRENCY_ID": 'EUR',
			"PRICE_UNIT" : "1.0000000",
			"PRICE_UNIT_UOM_ID": 'EUR'
		}, "ITEM_ID = 3001 AND SESSION_ID = '" + testdata.sSessionId + "'");
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			mockstar.insertTableData("item_ext", testdata.oItemExtData);
			mockstar.upsertTableData("item_temporary_ext", {
				"SESSION_ID": testdata.sSessionId,
				"ITEM_ID": iItemID,
				"CALCULATION_VERSION_ID": iCalculationVersionID,
				"CUST_STRING_MANUAL": "Test_Changed"				
			}, "ITEM_ID = 3001 AND SESSION_ID = '" + testdata.sSessionId + "'");
		}		

		//act
		var result = mockstar.call(iCalculationVersionID, testdata.sSessionId);

		//assert

		var queryResult = mockstar.execQuery("select count(*) as items from {{item}} where ITEM_ID = " + iItemID);
		var expectedData = {
				ITEMS: [2]
		};
		expect(queryResult).toMatchData(expectedData, ['ITEMS']);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			var queryResult = mockstar.execQuery("select count(*) as items from {{item_ext}} where ITEM_ID = " + iItemID);
			var expectedData = {
					ITEMS: [2]
			};
			expect(queryResult).toMatchData(expectedData, ['ITEMS']);
		}
	});
	
	it("should copy SURCHARGE to saved version", () => {
		// arrange
		mockstar.clearTable("item_temporary")
		// construct item temporary data, where the value of SURCHARGE correspond to the item id
		const oItemTemporaryData = new TestDataUtility(testdata.oItemTemporaryTestData)
										.addProperty("SURCHARGE", testdata.oItemTemporaryTestData.ITEM_ID)
										.build();
		mockstar.insertTableData("item_temporary", oItemTemporaryData);
		
		// act 
		var result = mockstar.call(testdata.iCalculationVersionId, testdata.sSessionId);
		
		// assert
		var queryResult = mockstar.execQuery(`select item_id, surcharge from {{item}} where CALCULATION_VERSION_ID = ${testdata.iCalculationVersionId}`);
		expect(queryResult).toMatchData({
			ITEM_ID                : [3001, 3002, 3003],
			SURCHARGE: ["3001.0000000", "3002.0000000", "3003.0000000"]
		}, ["ITEM_ID"])
	});				

}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);