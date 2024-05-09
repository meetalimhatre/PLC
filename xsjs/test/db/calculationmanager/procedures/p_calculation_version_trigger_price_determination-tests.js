/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;
var testData = require("../../../testdata/testdata").data;
var constants = require("../../../../lib/xs/util/constants");
var _ = require("lodash");
const oPriceDeterminationScenarios = constants.PriceDeterminationScenarios;

describe('db.calculationmanager.procedures:p_calculation_version_trigger_price_determination',function() {

	var oMockstarPlc = null;
	var iCalculationVersionId = testData.iCalculationVersionId;
	var sSessionId = $.session.getUsername();

	const sUpdateScenario = oPriceDeterminationScenarios.AllCategoriesScenario;
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oItemTemporaryExtData = {
			"SESSION_ID" : [ testData.sSessionId, testData.sSessionId, testData.sSessionId, testData.sSessionId, testData.sSessionId ],
			"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
		    "CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iSecondVersionId, 5809 ],
		    "CMPR_BOOLEAN_INT_MANUAL" : [1, 1, null, 1, 1],
			"CMPR_BOOLEAN_INT_UNIT" : [null,  null, null, null, null],
			"CMPR_DECIMAL_MANUAL": ["123.4500000","121.2500000",null, "121.2500000", "121.2500000"],
			"CMPR_DECIMAL_UNIT" : [null,  null, null, null, null],
			"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["234.5600000","200.5500000",null,"456.7700000", "987.6600000"],
			"CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR","EUR",null,"EUR","EUR"],
			"CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000", "1.0000000",null,"2.0000000","3.0000000"],
			"CMPR_DECIMAL_WITH_UOM_UNIT": ["H","H",null,"H","H"]
		};
	}
	
	beforeOnce(function() {

		oMockstarPlc = new MockstarFacade(
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_trigger_price_determination", // procedure or view under test
					substituteTables:                                           // substitute all used tables in the procedure or view
					{
						item_temporary: {
							name: "sap.plc.db::basis.t_item_temporary",
							data: testData.oItemTemporaryTestData
						},
						calculation_version_temporary: {
							name: "sap.plc.db::basis.t_calculation_version_temporary",
							data: testData.oCalculationVersionTemporaryTestData
						},
						calculation: {
							name: "sap.plc.db::basis.t_calculation",
							data: testData.oCalculationTestData
						},
						project: {
							name: "sap.plc.db::basis.t_project",
							data: testData.oProjectTestData
						},
						material: {
							name: Resources["Material"].dbobjects.plcTable,
							data: testData.oMaterialTestDataPlc
						},
						material_price_plc :{
							name: Resources["Material_Price"].dbobjects.plcTable,
							data: testData.oMaterialPriceTestDataPlc
						},
						activity_price:{
							name: Resources["Activity_Price"].dbobjects.plcTable,
							data:  testData.oActivityPriceTestDataPlc
						},
						price_source:{
							name: Resources["Price_Source"].dbobjects.plcTable,
							data: testData.oPriceSourceTestDataPlc
						},
						price_determination_strategy: {
							name: "sap.plc.db::basis.t_price_determination_strategy",
							data: testData.oPriceDeterminationStrategyTestData
						},
						price_determination_strategy_price_source: {
							name: "sap.plc.db::basis.t_price_determination_strategy_price_source",
							data: testData.oPriceDeterminationStrategyPriceSource
						},
						price_determination_strategy_rule: {
							name: "sap.plc.db::basis.t_price_determination_strategy_rule",
							data: testData.oPriceDeterminationStrategyRuleTestData
						},
						item_temporary_ext: "sap.plc.db::basis.t_item_temporary_ext",
						activity_price_ext: "sap.plc.db::basis.t_activity_price_ext"
					}
				}
		);

	});

	afterOnce(function(){				
		oMockstarPlc.cleanupMultiple(["sap.plc.db.calculationmanager.procedures", "sap.plc.db.calculationmanager.views"]);
	});

	beforeEach(function() {
		oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
		oMockstarPlc.initializeData();
	});

	afterEach(function() {
	});


	it('should set price source to [Calculated Price] for a parent and should set automatically price fields,price source, confidence level for a leave', function() {
		// arrange
		if(jasmine.plcTestRunParameters.generatedFields === true){
			oMockstarPlc.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
		}
		
		// act
		var result = oMockstarPlc.call(iCalculationVersionId, sSessionId, sUpdateScenario, null, null);
        
		// assert
        var oEntity = mockstar_helpers.convertResultToArray(result[0]);
        var oMessages = mockstar_helpers.convertResultToArray(result[1]);

		var oPriceSourceCalc = oMockstarPlc.execQuery("select CONFIDENCE_LEVEL_ID, PRICE_SOURCE_ID from " +
				"{{price_source}} where PRICE_SOURCE_ID = '" + constants.PriceSource.CalculatedPrice + "'");

		var oPriceSource = oMockstarPlc.execQuery("select CONFIDENCE_LEVEL_ID, PRICE_SOURCE_ID from " +
				"{{price_source}} where PRICE_SOURCE_ID = '" + constants.PriceSource.ManualPrice + "'");

		expect(oEntity).toMatchData({
			"ITEM_ID":           	[testData.oItemTemporaryTestData.ITEM_ID[0],testData.oItemTemporaryTestData.ITEM_ID[1],
			                     	 testData.oItemTemporaryTestData.ITEM_ID[2]],
         	"PRICE_FIXED_PORTION": 	[null,null,testData.oItemTemporaryTestData.PRICE_FIXED_PORTION[2]],
         	"PRICE_VARIABLE_PORTION":[null,null,testData.oItemTemporaryTestData.PRICE_VARIABLE_PORTION[2]],
         	"TRANSACTION_CURRENCY_ID":[testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
			                                  testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
			                                  testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[2]],
            "PRICE_UNIT":["1.0000000","1.0000000",testData.oItemTemporaryTestData.PRICE_UNIT[2]],
            "PRICE_UNIT_UOM_ID":[testData.oItemTemporaryTestData.TOTAL_QUANTITY_UOM_ID[0],testData.oItemTemporaryTestData.TOTAL_QUANTITY_UOM_ID[1],
		                     	testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[2]],
		    "CONFIDENCE_LEVEL_ID":[oPriceSourceCalc.columns.CONFIDENCE_LEVEL_ID.rows[0],oPriceSourceCalc.columns.CONFIDENCE_LEVEL_ID.rows[0],
		                     	   oPriceSource.columns.CONFIDENCE_LEVEL_ID.rows[0]],
		    "PRICE_SOURCE_ID":[oPriceSourceCalc.columns.PRICE_SOURCE_ID.rows[0],oPriceSourceCalc.columns.PRICE_SOURCE_ID.rows[0],
		                        oPriceSource.columns.PRICE_SOURCE_ID.rows[0]],
		    "TOTAL_COST_PER_UNIT":[testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT[0], testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT[1], testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT[2]],
		    "TOTAL_COST_PER_UNIT_VARIABLE_PORTION": [testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0], testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[1], testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[2]],
		    "TOTAL_COST_PER_UNIT_FIXED_PORTION": [testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_FIXED_PORTION[0], testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_FIXED_PORTION[1], testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_FIXED_PORTION[2]]
		}, ["ITEM_ID"]);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
		    var expectedObject = {};
			var aFields = testData.aNotCalculatedCustomFields.concat("ITEM_ID");
			_.each(aFields, function(fieldName,index){
				if(_.has(testData.oItemTemporaryExtData, fieldName)){
				    var oItem1 = testData.oItemTemporaryExtData[fieldName][0];
				    var oItem2 = testData.oItemTemporaryExtData[fieldName][1];
				    var oItem3 = testData.oItemTemporaryExtData[fieldName][2];
					var aItemFiledsValue = [oItem1, oItem2, oItem3];
					var custObject = _.zipObject([fieldName],[aItemFiledsValue]);
					expectedObject = _.extend(expectedObject,custObject);
				}
			});
			expect(oEntity).toMatchData(expectedObject,["ITEM_ID"]);
		}

	});

	it('should change fixed and variable price when material price strategy is changed for calculation version', function() {
		// arrange
		oMockstarPlc.clearTable("item_temporary");
		oMockstarPlc.clearTable("calculation_version_temporary");
		oMockstarPlc.clearTable("calculation");
		oMockstarPlc.clearTable("project");
		oMockstarPlc.clearTable("material");
		oMockstarPlc.clearTable("price_source");
		oMockstarPlc.clearTable("material_price_plc");

		oMockstarPlc.insertTableData("item_temporary", testData.oItemTemporaryPriceData);
		oMockstarPlc.insertTableData("calculation_version_temporary", testData.oCalculationVersionTempPriceData);
		oMockstarPlc.insertTableData("calculation", testData.oCalculationPriceData);
		oMockstarPlc.insertTableData("project", testData.oProjectPriceData);
		oMockstarPlc.insertTableData("material", testData.oMaterial);
		oMockstarPlc.insertTableData("price_source", testData.oPriceSourceTestDataPlc1);
		oMockstarPlc.insertTableData("material_price_plc", testData.oMaterialPriceDataPlc);

		const sMaterialUpdateScenario =  oPriceDeterminationScenarios.MaterialPriceDeterminationScenario;
		// act
		var result = oMockstarPlc.call(1039, sSessionId, sMaterialUpdateScenario, null, null);
        
		// assert
		var oEntity = mockstar_helpers.convertResultToArray(result[0]);
		
		expect(oEntity).toMatchData({
			"ITEM_ID":[ testData.oItemTemporaryPriceData.ITEM_ID[1], testData.oItemTemporaryPriceData.ITEM_ID[0]],
			"PRICE_FIXED_PORTION": [ testData.oMaterialPriceDataPlc.PRICE_FIXED_PORTION[2], null],
			"PRICE_VARIABLE_PORTION": [ testData.oMaterialPriceDataPlc.PRICE_VARIABLE_PORTION[2], null],
			"PRICE_SOURCE_ID": [ testData.oMaterialPriceDataPlc.PRICE_SOURCE_ID[2], testData.oPriceSourceTestDataPlc1.PRICE_SOURCE_ID[12]]
	}, ["ITEM_ID"]);
	});	

	it('should change fixed and variable price when activity price strategy is changed for calculation version', function() {
		// arrange
		oMockstarPlc.clearTable("item_temporary");
		oMockstarPlc.clearTable("calculation_version_temporary");
		oMockstarPlc.clearTable("calculation");
		oMockstarPlc.clearTable("project");
		oMockstarPlc.clearTable("material");
		oMockstarPlc.clearTable("price_source");
		oMockstarPlc.clearTable("activity_price");

		oMockstarPlc.insertTableData("item_temporary", testData.oItemTemporaryPriceData);
		oMockstarPlc.insertTableData("calculation_version_temporary", testData.oCalculationVersionTempPriceData);
		oMockstarPlc.insertTableData("calculation", testData.oCalculationPriceData);
		oMockstarPlc.insertTableData("project", testData.oProjectPriceData);
		oMockstarPlc.insertTableData("material", testData.oMaterial);
		oMockstarPlc.insertTableData("price_source", testData.oPriceSourceTestDataPlc1);
		oMockstarPlc.insertTableData("activity_price", testData.oActivityPriceDataPlc);

		const sActivityUpdateScenario =  oPriceDeterminationScenarios.ActivityPriceDeterminationScenario;
		// act
		var result = oMockstarPlc.call(1040, sSessionId, sActivityUpdateScenario, null, null);
        
		// assert
		var oEntity = mockstar_helpers.convertResultToArray(result[0]);
		
		expect(oEntity).toMatchData({
			"ITEM_ID":[ testData.oItemTemporaryPriceData.ITEM_ID[1], testData.oItemTemporaryPriceData.ITEM_ID[0]],
			"PRICE_FIXED_PORTION": [ testData.oActivityPriceDataPlc.PRICE_FIXED_PORTION[0], null],
			"PRICE_VARIABLE_PORTION": [ testData.oActivityPriceDataPlc.PRICE_VARIABLE_PORTION[0], null],
			"PRICE_SOURCE_ID": [ testData.oActivityPriceDataPlc.PRICE_SOURCE_ID[0], testData.oPriceSourceTestDataPlc1.PRICE_SOURCE_ID[12]]
	}, ["ITEM_ID"]);
	});	

	it('should change fixed and variable price when activity and material price strategy are changed for calculation version', function() {
		// arrange
		oMockstarPlc.clearTable("item_temporary");
		oMockstarPlc.clearTable("calculation_version_temporary");
		oMockstarPlc.clearTable("calculation");
		oMockstarPlc.clearTable("project");
		oMockstarPlc.clearTable("material");
		oMockstarPlc.clearTable("price_source");
		oMockstarPlc.clearTable("activity_price");
		oMockstarPlc.clearTable("material_price_plc");

		oMockstarPlc.insertTableData("item_temporary", testData.oItemTemporaryPriceData);
		oMockstarPlc.insertTableData("calculation_version_temporary", testData.oCalculationVersionTempPriceData);
		oMockstarPlc.insertTableData("calculation", testData.oCalculationPriceData);
		oMockstarPlc.insertTableData("project", testData.oProjectPriceData);
		oMockstarPlc.insertTableData("material", testData.oMaterial);
		oMockstarPlc.insertTableData("price_source", testData.oPriceSourceTestDataPlc1);
		oMockstarPlc.insertTableData("activity_price", testData.oActivityPriceDataPlc);
		oMockstarPlc.insertTableData("material_price_plc", testData.oMaterialPriceDataPlc);

		const sAllCategoriesUpdateScenario =  oPriceDeterminationScenarios.AllCategoriesScenario;
		// act
		var result = oMockstarPlc.call(1041, sSessionId, sAllCategoriesUpdateScenario, null, null);
        
		// assert
		var oEntity = mockstar_helpers.convertResultToArray(result[0]);
		
		expect(oEntity).toMatchData({
			"ITEM_ID":[ testData.oItemTemporaryPriceData.ITEM_ID[5], testData.oItemTemporaryPriceData.ITEM_ID[6], testData.oItemTemporaryPriceData.ITEM_ID[4]],
			"PRICE_FIXED_PORTION": [ testData.oMaterialPriceDataPlc.PRICE_FIXED_PORTION[3], testData.oActivityPriceDataPlc.PRICE_FIXED_PORTION[3], null],
			"PRICE_VARIABLE_PORTION": [ testData.oMaterialPriceDataPlc.PRICE_VARIABLE_PORTION[3], testData.oActivityPriceDataPlc.PRICE_VARIABLE_PORTION[3], null],
			"PRICE_SOURCE_ID": [ testData.oMaterialPriceDataPlc.PRICE_SOURCE_ID[3], testData.oActivityPriceDataPlc.PRICE_SOURCE_ID[3], testData.oPriceSourceTestDataPlc1.PRICE_SOURCE_ID[12]]
	}, ["ITEM_ID"]);
	});	

	if(jasmine.plcTestRunParameters.generatedFields === true){
		it("should not change masterdata custom fields for a parent and should determine custom fields values for a leave", function() {
			// arrange
			var iIndex = 2;
			oMockstarPlc.insertTableData("item_temporary_ext", oItemTemporaryExtData);

			// act
			var result = oMockstarPlc.call(iCalculationVersionId, sSessionId, sUpdateScenario, null, null);

			// assert
			var oEntity = mockstar_helpers.convertResultToArray(result[0]);
			
			//the third item had item category = internal activity; no values for custom fields will be determined
			expect(oEntity).toMatchData({
				 "ITEM_ID":           	[testData.oItemTemporaryTestData.ITEM_ID[0],testData.oItemTemporaryTestData.ITEM_ID[1],
				                     	 testData.oItemTemporaryTestData.ITEM_ID[iIndex]],
	         	 "CMPR_BOOLEAN_INT_MANUAL" : [oItemTemporaryExtData.CMPR_BOOLEAN_INT_MANUAL[0],oItemTemporaryExtData.CMPR_BOOLEAN_INT_MANUAL[1], oItemTemporaryExtData.CMPR_BOOLEAN_INT_MANUAL[iIndex]],
	         	 "CMPR_BOOLEAN_INT_UNIT" : [oItemTemporaryExtData.CMPR_BOOLEAN_INT_UNIT[0],oItemTemporaryExtData.CMPR_BOOLEAN_INT_UNIT[1], oItemTemporaryExtData.CMPR_BOOLEAN_INT_UNIT[iIndex]],
	         	 "CMPR_DECIMAL_MANUAL": [oItemTemporaryExtData.CMPR_DECIMAL_MANUAL[0],oItemTemporaryExtData.CMPR_DECIMAL_MANUAL[1], oItemTemporaryExtData.CMPR_DECIMAL_MANUAL[iIndex]],
	         	 "CMPR_DECIMAL_UNIT" : [oItemTemporaryExtData.CMPR_DECIMAL_UNIT[0],oItemTemporaryExtData.CMPR_DECIMAL_UNIT[1], oItemTemporaryExtData.CMPR_DECIMAL_UNIT[iIndex]],
	         	 "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemTemporaryExtData.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[0],oItemTemporaryExtData.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[1], oItemTemporaryExtData.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndex]],
	         	 "CMPR_DECIMAL_WITH_CURRENCY_UNIT": [oItemTemporaryExtData.CMPR_DECIMAL_WITH_CURRENCY_UNIT[0],oItemTemporaryExtData.CMPR_DECIMAL_WITH_CURRENCY_UNIT[1], oItemTemporaryExtData.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndex]],
	         	 "CMPR_DECIMAL_WITH_UOM_MANUAL": [oItemTemporaryExtData.CMPR_DECIMAL_WITH_UOM_MANUAL[0],oItemTemporaryExtData.CMPR_DECIMAL_WITH_UOM_MANUAL[1], oItemTemporaryExtData.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndex]],
	         	 "CMPR_DECIMAL_WITH_UOM_UNIT": [oItemTemporaryExtData.CMPR_DECIMAL_WITH_UOM_UNIT[0],oItemTemporaryExtData.CMPR_DECIMAL_WITH_UOM_UNIT[1], oItemTemporaryExtData.CMPR_DECIMAL_WITH_UOM_UNIT[iIndex]]
			}, ["ITEM_ID"]);
		});
		
		it('should determine and set the custom fields for activity price', function() {
			// arrange
			oMockstarPlc.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
			//Set only one price in the system, and set the activity prices to be valid for all controlling ares, cost centers, etc.
			oMockstarPlc.clearTable("price_source");
			oMockstarPlc.insertTableData("price_source", mockstar_helpers.convertToObject(testData.oPriceSourceTestDataPlc,3));
			oMockstarPlc.insertTableData("activity_price", {  
																	"PRICE_ID": ["290000E0B2BDB9671600A4000936462B","2A0000E0B2BDB9671600A4000936462B"],
																	"PRICE_SOURCE_ID": ["301","301"],
																	"CONTROLLING_AREA_ID": ['*','*'],
																	"COST_CENTER_ID": ['*','*'],
																	"ACTIVITY_TYPE_ID": ['*','*'],
																	"PROJECT_ID": ["*","*"],
																	"VALID_FROM": ["2015-01-01","2010-01-01"],
																	"CUSTOMER_ID": ['*', '*'],
																	"VALID_FROM_QUANTITY": ["1.0000000","1.0000000"],
																	"PRICE_FIXED_PORTION": ["135.9800000","15000000"],
																	"PRICE_VARIABLE_PORTION": ["123.4500000","200.0000000"],
																	"TRANSACTION_CURRENCY_ID": ["EUR","EUR"],
																	"PRICE_UNIT": ["1.0000000","1.0000000"],
																	"PRICE_UNIT_UOM_ID": ["PC","PC"],
																	"_VALID_FROM": ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
																	"_SOURCE": [1,1],
																	"_CREATED_BY": ["I305778","U0001"]});			
			oMockstarPlc.insertTableData("activity_price_ext", {   
																	"PRICE_ID": ["290000E0B2BDB9671600A4000936462B","2A0000E0B2BDB9671600A4000936462B"],																	
                                                                    "_VALID_FROM": ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
                                                                    "CAPR_DECIMAL_MANUAL": ["20.0000000", "30.0000000"],
																	"CAPR_DECIMAL_UNIT": ["EUR", "CAD"]});
			const newValuationDate = "2015-01-01";
			oMockstarPlc.execSingle(`update {{calculation_version_temporary}} set VALUATION_DATE = '${newValuationDate}' where CALCULATION_VERSION_ID = '${testData.iCalculationVersionId}'`);												
			const sUpdateScenario =  oPriceDeterminationScenarios.AllCategoriesScenario;	

			// act
			var result = oMockstarPlc.call(iCalculationVersionId, sSessionId, sUpdateScenario, null, null);

			// assert
			var oEntity = mockstar_helpers.convertResultToArray(result[0]);
    		expect(oEntity).toMatchData({  "ITEM_ID": [ 3001, 3002, 3003],
    			                           "CAPR_DECIMAL_MANUAL": [ null, null, "20.0000000" ],
    			                           "CAPR_DECIMAL_UNIT": [ null, null, "EUR" ]
    			                        },["ITEM_ID"]);
		});
	}
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);