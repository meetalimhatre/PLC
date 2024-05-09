/*jslint undef:true*/

var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var oTestdata = require("../../../testdata/testdata").data;
var testDataGenerator = require("../../../testdata/testdataGenerator");
const TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;
const Constants = require("../../../../lib/xs/util/constants");
const sStandardPriceStrategy = oTestdata.sStandardPriceStrategy;

describe('sap.plc.db.calculationmanager.procedures::p_calculation_version_close', function() {

	var testPackage = $.session.getUsername().toLowerCase();
	var oMockstar = null;
	var iCalculationVersionId = 2809;
	var iInvalidCalculationVersionId = 0;
	var sSessionId = oTestdata.sSessionId;
	var sInvalidSessionId = "InvalidSession";
	const sVersionContext = Constants.CalculationVersionLockContext.CALCULATION_VERSION;
	const sVariantContext = Constants.CalculationVersionLockContext.VARIANT_MATRIX;

	var oOpenCalculationVersionTestData = {
			"SESSION_ID": [sSessionId],
			"CALCULATION_VERSION_ID": [iCalculationVersionId],
			"IS_WRITEABLE": [1],
			"CONTEXT": [sVersionContext]
	};
	
	const oOpenVariantTestData = {
		"SESSION_ID": [sSessionId],
		"CALCULATION_VERSION_ID": [iCalculationVersionId],
		"IS_WRITEABLE": [1],
		"CONTEXT": [sVariantContext]
	};

	var oCalculationVersionTemporaryTestdata = { 
			"SESSION_ID" : [ sSessionId, sSessionId ],
			"CALCULATION_VERSION_ID":[iCalculationVersionId,4809],
			"CALCULATION_ID":[1978,2078],
			"CALCULATION_VERSION_NAME":["Baseline Version","Baseline Version"],
			"ROOT_ITEM_ID":[3001,5001],
			"REPORT_CURRENCY_ID":["EUR","USD"],
			"VALUATION_DATE":["2014-06-01 00:00:00.2340000","2014-06-01 00:00:00.2340000"],
			"LAST_MODIFIED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
			"LAST_MODIFIED_BY":["Torsten","Detlef"],
			"MASTER_DATA_TIMESTAMP" : ["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
			"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy],
			"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy]
	};

	var oItemTestData = {
			"SESSION_ID": [sSessionId, sSessionId, sSessionId, sSessionId],
			"ITEM_ID":[3001,3002,3003,5001],
			"CALCULATION_VERSION_ID":[iCalculationVersionId,iCalculationVersionId,iCalculationVersionId,4809],
			"PARENT_ITEM_ID":[0,3001,3002,0],
			"IS_ACTIVE":[1,1,1,1],
			"ITEM_CATEGORY_ID":[1,1,3,1],
			"CHILD_ITEM_CATEGORY_ID":[1,1,3,1],
			"ACCOUNT_ID":[0,0,625000,0],
			"CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
			"CREATED_BY":["D043604","D043604","D043604","D043604"],
			"LAST_MODIFIED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
			"LAST_MODIFIED_BY":["User1","User1","User1","User1"],
			"PRICE_FIXED_PORTION":                    ["1.0000000","1.0000000","1.0000000","1.0000000"],
			"PRICE_VARIABLE_PORTION":                 ["0.0000000","0.0000000","0.0000000","0.0000000"],
			"TRANSACTION_CURRENCY_ID":          ['EUR','EUR','EUR','EUR'],
			"PRICE_UNIT":                             ["1.0000000","1.0000000","1.0000000","1.0000000"],
			"PRICE_UNIT_UOM_ID":                      ['EUR','EUR','EUR','EUR']
	};
	
	var oBuiltTestData = testDataGenerator.buildTestDataForReferencedCalcVer();
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oItemTempTestDataExt = testDataGenerator.createItemTempExtObjectFromObject(
									[3001,3002,3003,5001], 
									[iCalculationVersionId,iCalculationVersionId,iCalculationVersionId,4809], 
									[sSessionId, sSessionId, sSessionId, sSessionId], oTestdata.oItemExtData,4);
	}
	
	beforeOnce(function() {
		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_close", // procedure or view under test
					substituteTables: // substitute all used tables in the procedure or view
					{
						open_calculation_versions : "sap.plc.db::basis.t_open_calculation_versions",
						calculation_version_temporary : "sap.plc.db::basis.t_calculation_version_temporary",
						item_temporary : "sap.plc.db::basis.t_item_temporary",                
						calculations: "sap.plc.db::basis.t_calculation",
						item_temporary_ext: "sap.plc.db::basis.t_item_temporary_ext",
						referenced_version_component_split_temporary: "sap.plc.db::basis.t_item_referenced_version_component_split_temporary",
						variant: "sap.plc.db::basis.t_variant",
						variant_item: "sap.plc.db::basis.t_variant_item",
					}
				});
	});

	afterOnce(function() {
		//oMockstar.cleanup(); // clean up all test artefacts
		oMockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
	});

	beforeEach(function() {	
		oMockstar.clearAllTables(); // clear all specified substitute tables and views
		oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionTestData);
		oMockstar.insertTableData("calculation_version_temporary", oCalculationVersionTemporaryTestdata);        
		oMockstar.insertTableData("item_temporary", oItemTestData);
		oMockstar.insertTableData("calculations", oTestdata.oCalculationTestData);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			oMockstar.insertTableData("item_temporary_ext", oItemTempTestDataExt);
		}
		oMockstar.insertTableData("referenced_version_component_split_temporary", oBuiltTestData.ReferenceVersionComponentSplitTemporary);
		oMockstar.initializeData();
	});

	afterEach(function() {
	});

	it('should close a calculation version identified by valid given calculation version id and session id', function() {
		//arrange
		checkRowCount(1, "open_calculation_versions");
		checkRowCount(1, "open_calculation_versions", iCalculationVersionId, sSessionId);
		checkRowCount(4, "item_temporary");
		checkRowCount(3,  "item_temporary", iCalculationVersionId, sSessionId);
		checkRowCount(2, "calculation_version_temporary");
		checkRowCount(1,  "calculation_version_temporary", iCalculationVersionId, sSessionId);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			checkRowCount(4, "item_temporary_ext");
			checkRowCount(3,  "item_temporary_ext", iCalculationVersionId, sSessionId);
		}
		checkRowCount(1, "referenced_version_component_split_temporary");

		//act
		oMockstar.call(iCalculationVersionId, sSessionId);

		//assert
		checkRowCount(0, "open_calculation_versions");
		checkRowCount(0, "open_calculation_versions", iCalculationVersionId, sSessionId);
		checkRowCount(1, "item_temporary");
		checkRowCount(0,  "item_temporary", iCalculationVersionId, sSessionId);
		checkRowCount(1, "calculation_version_temporary");
		checkRowCount(0,  "calculation_version_temporary", iCalculationVersionId, sSessionId);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			checkRowCount(1, "item_temporary_ext");
			checkRowCount(0,  "item_temporary_ext", iCalculationVersionId, sSessionId);
		}
		checkRowCount(0, "referenced_version_component_split_temporary");
	});


	it('should not close a calculation version because the given calculation version id is invalid', function() {
		//arrange
		checkRowCount(1, "open_calculation_versions");
		checkRowCount(1, "open_calculation_versions", iCalculationVersionId, sSessionId);
		checkRowCount(4, "item_temporary");
		checkRowCount(3,  "item_temporary", iCalculationVersionId, sSessionId);
		checkRowCount(2, "calculation_version_temporary");
		checkRowCount(1,  "calculation_version_temporary", iCalculationVersionId, sSessionId);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			checkRowCount(4, "item_temporary_ext");
			checkRowCount(3,  "item_temporary_ext", iCalculationVersionId, sSessionId);
		}
		checkRowCount(1, "referenced_version_component_split_temporary");

		//act
		oMockstar.call(iInvalidCalculationVersionId, sSessionId);

		//assert
		checkRowCount(1, "open_calculation_versions");
		checkRowCount(1, "open_calculation_versions", iCalculationVersionId, sSessionId);
		checkRowCount(4, "item_temporary");
		checkRowCount(3,  "item_temporary", iCalculationVersionId, sSessionId);
		checkRowCount(2, "calculation_version_temporary");
		checkRowCount(1,  "calculation_version_temporary", iCalculationVersionId, sSessionId);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			checkRowCount(4, "item_temporary_ext");
			checkRowCount(3,  "item_temporary_ext", iCalculationVersionId, sSessionId);
		}
		checkRowCount(1, "referenced_version_component_split_temporary");
	});

	it('should not close a calculation version because the given session id is invalid', function() {
		//arrange
		checkRowCount(1, "open_calculation_versions");
		checkRowCount(1, "open_calculation_versions", iCalculationVersionId, sSessionId);
		checkRowCount(4, "item_temporary");
		checkRowCount(3,  "item_temporary", iCalculationVersionId, sSessionId);
		checkRowCount(2, "calculation_version_temporary");
		checkRowCount(1,  "calculation_version_temporary", iCalculationVersionId, sSessionId);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			checkRowCount(4, "item_temporary_ext");
			checkRowCount(3,  "item_temporary_ext", iCalculationVersionId, sSessionId);
		}
		checkRowCount(1, "referenced_version_component_split_temporary");

		//act
		oMockstar.call(iCalculationVersionId, sInvalidSessionId);

		//assert
		checkRowCount(1, "open_calculation_versions");
		checkRowCount(1, "open_calculation_versions", iCalculationVersionId, sSessionId);
		checkRowCount(4, "item_temporary");
		checkRowCount(3,  "item_temporary", iCalculationVersionId, sSessionId);
		checkRowCount(2, "calculation_version_temporary");
		checkRowCount(1,  "calculation_version_temporary", iCalculationVersionId, sSessionId);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			checkRowCount(4, "item_temporary_ext");
			checkRowCount(3, "item_temporary_ext", iCalculationVersionId, sSessionId);
		}
		checkRowCount(1, "referenced_version_component_split_temporary");
	});

	if(jasmine.plcTestRunParameters.mode === 'all'){
		it('should delete a calculation if its version is closed and has never been saved', function(){
			//arrange    	
			var iVersionId = 6809;
			oMockstar.insertTableData("calculation_version_temporary", {
				"SESSION_ID" : sSessionId,
				"CALCULATION_VERSION_ID":iVersionId,
				"CALCULATION_ID":oTestdata.oCalculationTestData.CALCULATION_ID[2],
				"CALCULATION_VERSION_NAME":"Baseline Version",
				"ROOT_ITEM_ID":3001,
				"REPORT_CURRENCY_ID":"EUR",
				"VALUATION_DATE":"2014-06-01 00:00:00.2340000",
				"MASTER_DATA_TIMESTAMP" : "2014-04-23 08:00:00.2340000"
			});

			//act
			oMockstar.call(iVersionId, sSessionId);

			//assert
			var result = oMockstar.execQuery("select count(calculation_id) as VERSIONS from {{calculations}} where calculation_id = "+oTestdata.oCalculationTestData.CALCULATION_ID[2]);
			expect(parseInt(result.columns.VERSIONS.rows[0])).toBe(0);    	
		})
   
		it('should not delete a calculation if no version is saved yet and another version is closed by the same user', function(){
			//arrange    	
			var iVersionId = 6809;
			oMockstar.insertTableData("calculation_version_temporary", {
				"SESSION_ID" : sSessionId,
				"CALCULATION_VERSION_ID":iVersionId,
				"CALCULATION_ID":oTestdata.oCalculationTestData.CALCULATION_ID[2],
				"CALCULATION_VERSION_NAME":"Baseline Version",
				"ROOT_ITEM_ID":3001,
				"REPORT_CURRENCY_ID":"EUR",
				"VALUATION_DATE":"2014-06-01 00:00:00.2340000",
				"MASTER_DATA_TIMESTAMP" : "2014-04-23 08:00:00.2340000",
				"MATERIAL_PRICE_STRATEGY_ID": sStandardPriceStrategy,
				"ACTIVITY_PRICE_STRATEGY_ID": sStandardPriceStrategy
			});

			//act
			oMockstar.call(iCalculationVersionId, sSessionId);

			//assert
			var result = oMockstar.execQuery("select count(calculation_id) as VERSIONS from {{calculations}} where calculation_id = "+oTestdata.oCalculationTestData.CALCULATION_ID[2]);
			expect(parseInt(result.columns.VERSIONS.rows[0])).toBe(1);    
		})
  
		it('should not delete a calculation if no version is saved yet and another version is closed by another user', function(){
			//arrange    	
			var iVersionId = 6809;
			oMockstar.insertTableData("calculation_version_temporary", {
				"SESSION_ID" : "AnotherSession",
				"CALCULATION_VERSION_ID":iVersionId,
				"CALCULATION_ID":oTestdata.oCalculationTestData.CALCULATION_ID[2],
				"CALCULATION_VERSION_NAME":"Baseline Version",
				"ROOT_ITEM_ID":3001,
				"REPORT_CURRENCY_ID":"EUR",
				"VALUATION_DATE":"2014-06-01 00:00:00.2340000",
				"MASTER_DATA_TIMESTAMP" : "2014-04-23 08:00:00.2340000",
				"MATERIAL_PRICE_STRATEGY_ID": sStandardPriceStrategy,
				"ACTIVITY_PRICE_STRATEGY_ID": sStandardPriceStrategy
			});

			//act
			oMockstar.call(iCalculationVersionId, sSessionId);

			//assert
			var result = oMockstar.execQuery("select count(calculation_id) as VERSIONS from {{calculations}} where calculation_id = "+oTestdata.oCalculationTestData.CALCULATION_ID[2]);
			expect(parseInt(result.columns.VERSIONS.rows[0])).toBe(1);    
		})

		it('should delete the variant matrix of a calculation version that was never saved', function(){
			//arrange    	
			const iVersionId = oTestdata.iCalculationVersionId;
			oMockstar.insertTableData("calculation_version_temporary", oTestdata.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("variant", new TestDataUtility(oTestdata.oVariantTestData).build());
            const sVariantsStmt = `select count(VARIANT_ID) as VARIANTS from {{variant}} where calculation_version_id = ${oTestdata.iCalculationVersionId}`;
			const oVariantsBeforeClose = oMockstar.execQuery(sVariantsStmt);
			//act
			oMockstar.call(iVersionId, sSessionId);

			//assert
			const oVariantsAferClose = oMockstar.execQuery(sVariantsStmt);
			expect(parseInt(oVariantsBeforeClose.columns.VARIANTS.rows[0])).toBe(2);    
			expect(parseInt(oVariantsAferClose.columns.VARIANTS.rows[0])).toBe(0);    	
		});
		
		it('should delete the variant matrix items of a variant base calculation version that was never saved', function(){
			//arrange    	
			const iVersionId = oTestdata.iCalculationVersionId;
			oMockstar.insertTableData("calculation_version_temporary", oTestdata.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("variant", new TestDataUtility(oTestdata.oVariantTestData).build());
			oMockstar.insertTableData("variant_item", new TestDataUtility(oTestdata.oVariantItemTestData).build());
			const fPredicate = oObject => oObject.VARIANT_ID === oTestdata.iVariantId ||oObject.VARIANT_ID === oTestdata.iSecondVariantId;
            const aVariantItems = new TestDataUtility(oTestdata.oVariantItemTestData).getObjects(fPredicate);
            const sVariantItemsStmt = `select count(ITEM_ID) as VARIANT_ITEMS from {{variant_item}} where variant_id in (${oTestdata.iVariantId}, ${oTestdata.iSecondVariantId})`;
			const oVariantItemsBeforeClose = oMockstar.execQuery(sVariantItemsStmt);
			//act
			oMockstar.call(iVersionId, sSessionId);

			//assert
			const oVariantItesmsAferClose = oMockstar.execQuery(sVariantItemsStmt);
			const sOtherItemsStmt = `select count(ITEM_ID) as VARIANT_ITEMS from {{variant_item}} where variant_id not in (${oTestdata.iVariantId}, ${oTestdata.iSecondVariantId})`;
			const oOtherVariantItems = oMockstar.execQuery(sOtherItemsStmt);
			expect(parseInt(oVariantItemsBeforeClose.columns.VARIANT_ITEMS.rows[0])).toBe(aVariantItems.length);    
			expect(parseInt(oVariantItesmsAferClose.columns.VARIANT_ITEMS.rows[0])).toBe(0);   
			expect(parseInt(oOtherVariantItems.columns.VARIANT_ITEMS.rows[0])).not.toBe(0);  
		});
		
		it('should only close a calculation version open in the context of calculation_version and not in the context of variant_matrix', function() {
    		//arrange
    		oMockstar.insertTableData("open_calculation_versions", oOpenVariantTestData);
    		checkRowCount(2, "open_calculation_versions");
    		checkRowCount(1, "open_calculation_versions", iCalculationVersionId, sSessionId, sVersionContext);
    		checkRowCount(1, "open_calculation_versions", iCalculationVersionId, sSessionId, sVariantContext);
    		//act
    		oMockstar.call(iCalculationVersionId, sSessionId);
    		//assert
   	    	checkRowCount(1, "open_calculation_versions");
    		checkRowCount(0, "open_calculation_versions", iCalculationVersionId, sSessionId, sVersionContext);
    		checkRowCount(1, "open_calculation_versions", iCalculationVersionId, sSessionId, sVariantContext);
    	});

	}

	/**
	 * This function retrieves the row count of a given table (sTableId) and compares it to the given
	 * expected value (iExpectedCount).
	 * 
	 * The second way to call the function is to additionally give calculation version id and session
	 * id, so that row counts are retrieved for the given combination.
	 */
	function checkRowCount(iExpectedCount, sTableId, iCalculationVersionId, sSessionId, sContext) {
		expect(iExpectedCount).toBeDefined();
		expect(iExpectedCount).toBeGreaterThan(-1);
		expect(sTableId).toBeDefined();
		expect(sTableId).not.toEqual("");

		var result = null;
		if (iCalculationVersionId === undefined || sSessionId === undefined)
		{
			result = oMockstar.execQuery(`SELECT COUNT(*) AS COUNT FROM {{${sTableId}}}`);
		}
		else
		{
			let sGetRowsStmt = `SELECT COUNT(*) AS COUNT FROM {{${sTableId}}} WHERE session_id = '${sSessionId}' AND calculation_version_id = ${iCalculationVersionId}`;
			if (sContext !== undefined) {
				sGetRowsStmt += ` AND context = '${sContext}'`;
			}
			result = oMockstar.execQuery(sGetRowsStmt);
		}

		expect(result).toBeDefined;
		var expectedResultJsonData = {
				COUNT: [iExpectedCount]
		};
		expect(result).toMatchData(expectedResultJsonData, ['COUNT']);
	}

}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);