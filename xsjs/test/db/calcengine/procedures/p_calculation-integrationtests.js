/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;

describe('db.calcengine.procedures.p_calculation',function() {

		var mockstar = null;
		var sessionId = "test";
		var calcVersionId = 1;
		var sDate = "2015-01-01T00:00:00.000Z";
		var sTestUser = "TestUser";
		var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON(); //"2011-08-20";
		var oItemData = {
				"SESSION_ID": [ sessionId, sessionId, sessionId ],
				"ITEM_ID" :                             [     1,       2,     3 ],
				"CALCULATION_VERSION_ID" :              [     1,       1,     1 ],
				"PARENT_ITEM_ID" :                      [  null,       1,     1 ],
				"IS_ACTIVE" :                           [     1,       1,     1 ],
				"ITEM_CATEGORY_ID" :                    [     0,       1,     3 ],
				"CHILD_ITEM_CATEGORY_ID" :                    [     0,       1,     3 ],
				"ACCOUNT_ID" :                          [   "0", "#AC11",   "0" ],
				"TOTAL_QUANTITY_DEPENDS_ON":             [     1,       1,     1 ],
				"LOT_SIZE":                     ['1.0000000', '2.0000000', '3.0000000'],
				"LOT_SIZE_CALCULATED":          ['99.0000000', '99.0000000', '99.0000000'],
				"QUANTITY":            [  null, '2.0000000', '3.0000000'],
				"QUANTITY_CALCULATED": ['99.0000000', '99.0000000', '99.0000000'],
		        "QUANTITY_UOM_ID":     [  "PC",    "PC",  "PC" ],
				"TOTAL_QUANTITY" :                      ['1.0000000',    null,  null ],
				"TOTAL_QUANTITY_UOM_ID" :               [  "PC",    null,  null ],
				"PRICE_FIXED_PORTION":                  [  null,'2.0000000', '3.0000000'],
				"PRICE_FIXED_PORTION_CALCULATED":       ['99.0000000', '99.0000000', '99.0000000'],
				"PRICE_VARIABLE_PORTION":               [  null,'4.0000000', '6.0000000'],
				"PRICE_VARIABLE_PORTION_CALCULATED":    ['99.0000000', '99.0000000', '99.0000000'],
				"PRICE":                                [  null, '6.0000000', '9.0000000'],
				"TRANSACTION_CURRENCY_ID":        [ "EUR",   "EUR", "EUR" ],
				"PRICE_UNIT":                           ['1.0000000', '1.0000000', '1.0000000'],
				"PRICE_UNIT_CALCULATED":                ['99.0000000', '99.0000000', '99.0000000'],
				"PRICE_UNIT_UOM_ID":                    [  "PC",    "PC",  "PC" ],
			    "IS_PRICE_SPLIT_ACTIVE":                [    0,       0,     0],
				"PRICE_ID" :                            [ null, null,  '280000E0B2BDB9671600A4000936462B'],// unchanged
				"TARGET_COST":                          ['1.0000000','2.0000000', '3.0000000']
		};

		var oActivityPriceTestDataPlc = {
			"PRICE_ID": ["280000E0B2BDB9671600A4000936462B","2E0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["301","301","301"],
			"CONTROLLING_AREA_ID": ['#CA1','1000','1000'],
			"COST_CENTER_ID": ['CC2','CC2',"CC4"],
			"ACTIVITY_TYPE_ID": ["A4","*","*"],
			"PROJECT_ID": ["*","*","*"],
			"VALID_FROM": ["2015-01-01","2010-01-01","2010-01-01"],
			"CUSTOMER_ID": ['*', '*', '*'],
	
			"VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000"],
			"PRICE_FIXED_PORTION": ["135.98","135.98","150"],
			"PRICE_VARIABLE_PORTION": ["123.4500000", "123.4500000", "200"],
			"TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR"],
			"PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000"],
			"PRICE_UNIT_UOM_ID": ["PC","PC","PC"],
			"IS_PRICE_SPLIT_ACTIVE": [0,0,0],
			"_VALID_FROM": ["2014-01-01T15:39:09.691Z","2014-01-01T15:39:09.691Z","2014-01-01T15:39:09.691Z"],
			"_SOURCE": [1,1,1],
			"_CREATED_BY": ["I305778","U0001","U0001"]
	};

		beforeOnce(function() {
			mockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel: "sap.plc.db.calcengine.procedures/p_calculation",  // procedure or view under test
						substituteTables: // substitute all used tables in the procedure or view
						{
							calculation: {
								name: "sap.plc.db::basis.t_calculation",
								data: {
									"CALCULATION_ID" : [ 1, 2 ],
									"PROJECT_ID" : [ 1, 2 ],
									"CALCULATION_NAME" : [ "Calculation 1", "Calculation 2" ],
									"CREATED_ON" : [ sDate, sDate ],
									"CREATED_BY" : [ sTestUser, sTestUser ],
									"LAST_MODIFIED_ON" : [ sDate, sDate ],
									"LAST_MODIFIED_BY" : [ sTestUser, sTestUser ]
								}
							},
							project: {
								name: "sap.plc.db::basis.t_project",
								data: {
									"PROJECT_ID" : [ 1, 2 ],
									"ENTITY_ID"  : [1, 2],
									"CONTROLLING_AREA_ID" : [ "#CA1", "#CA1" ],
									"REPORT_CURRENCY_ID": ["EUR", "EUR"],
									"VALUATION_DATE": [sExpectedDateWithoutTime, sExpectedDateWithoutTime],
									"CREATED_ON" : [ sDate, sDate ],
									"CREATED_BY" : [ sTestUser, sTestUser ],
									"LAST_MODIFIED_ON" : [ sDate, sDate ],
									"LAST_MODIFIED_BY" : [ sTestUser, sTestUser ],
									"MATERIAL_PRICE_STRATEGY_ID":[sStandardPriceStrategy, sStandardPriceStrategy],
									"ACTIVITY_PRICE_STRATEGY_ID":[sStandardPriceStrategy, sStandardPriceStrategy]
								}
							},
							version: {
								name: "sap.plc.db::basis.t_calculation_version_temporary",
								data: {
									"SESSION_ID" : [ sessionId, sessionId],
									"CALCULATION_VERSION_ID" : [ 1, 2],
									"CALCULATION_ID" : [ 1, 2 ],
									"CALCULATION_VERSION_NAME" : [ "Version1", "Version2" ],
									"ROOT_ITEM_ID" : [ 1, 11 ],
									"REPORT_CURRENCY_ID" : [ "EUR", "EUR" ],
									"COSTING_SHEET_ID" : [ "#COGSL", "#COGSL" ],
									"COMPONENT_SPLIT_ID" : [ "#SPLIT_DETAILED", "#SPLIT_DETAILED" ],
									"VALUATION_DATE" : [ sDate, sDate ],
									"LAST_MODIFIED_ON" : [ sDate, sDate ],
									"LAST_MODIFIED_BY" : [ sTestUser, sTestUser ],
									"MASTER_DATA_TIMESTAMP" : [ sDate, sDate ],
									"IS_FROZEN" : [ 0, 0 ],
									"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy],
									"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy]
								}
							},
							item: {
								name: "sap.plc.db::basis.t_item_temporary"
							},
							price_component: {
								name: "sap.plc.db::basis.t_price_component",
								data: {
									"PRICE_ID":[ '280000E0B2BDB9671600A4000936462B', '280000E0B2BDB9671600A4000936462B',  '280000E0B2BDB9671600A4000936462B'],
									"_VALID_FROM":['2014-01-01T15:39:09.691Z', '2014-01-01T15:39:09.691Z', '2014-01-01T15:39:09.691Z'],
									"ACCOUNT_ID":["0","#AC11","625000"],
									"PRICE_FIXED":[ "13.0000000", "2.0000000", "6.0000000"],
									"PRICE_VARIABLE":[ "14.0000000", "3.0000000", "7.0000000"],
									"CONTROLLING_AREA_ID":['#CA1', '#CA1', '#CA1']
								}
							},
							resultCostingSheet : "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
							resultComponentSplit : "sap.plc.db::basis.t_item_calculated_values_component_split",
							material: {
								name: "sap.plc.db::basis.t_material",
								data: "t_material.csv"
							},
							material_plant: {
								name: "sap.plc.db::basis.t_material_plant",
								data: "t_material_plant.csv"
							},
							account: {
								name: "sap.plc.db::basis.t_account",
                                data: testData.oAccountForItemTestData
							},
							account_group: {
								name: "sap.plc.db::basis.t_account_group",
								data: "t_account_group.csv"
							},
							account_account_group: {
								name: "sap.plc.db::basis.t_account_account_group",
								data: "t_account_account_group.csv"
							},
							activity_price: {
								name: "sap.plc.db::basis.t_activity_price",
								data: oActivityPriceTestDataPlc
							},
							costing_sheet: {
								name: "sap.plc.db::basis.t_costing_sheet",
								data: "t_costing_sheet.csv"
							},
							costing_sheet_row: {
								name: "sap.plc.db::basis.t_costing_sheet_row",
								data: "t_costing_sheet_row.csv"
							},
							costing_sheet_row_dependencies: {
								name: "sap.plc.db::basis.t_costing_sheet_row_dependencies",
								data: "t_costing_sheet_row_dependencies.csv"
							},
							costing_sheet_base: {
								name: "sap.plc.db::basis.t_costing_sheet_base"
							},
							costing_sheet_base_row: {
								name: "sap.plc.db::basis.t_costing_sheet_base_row"
							},
							costing_sheet_overhead: {
								name: "sap.plc.db::basis.t_costing_sheet_overhead",
								data: "t_costing_sheet_overhead.csv"
							},
							costing_sheet_overhead_row: {
								name: "sap.plc.db::basis.t_costing_sheet_overhead_row",
								data: "t_costing_sheet_overhead_row.csv"
							},
							component_split: {
								name: "sap.plc.db::basis.t_component_split",
								data: "t_component_split.csv"
							},
							component_split_account_group: {
								name: "sap.plc.db::basis.t_component_split_account_group",
								data: "t_component_split_account_group.csv"
							},
							uom: {
								name: "sap.plc.db::basis.t_uom",
								data: "t_uom.csv"
							},
							currency_conversion: {
								name: "sap.plc.db::basis.t_currency_conversion",
								data: "t_currency_conversion.csv"
							},
							item_temporary_ext : 'sap.plc.db::basis.t_item_temporary_ext',
							item_ext : 'sap.plc.db::basis.t_item_ext'
						},
						csvPackage: "db.content"
					}
			);
		});

		afterOnce(function(){				
			mockstar.cleanup(); // clean up all test artefacts
		});

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			mockstar.initializeData();
		});

		afterEach(function() {
		});
		
	if (jasmine.plcTestRunParameters.generatedFields === false) {
		it('should calculate correctly', function() {
			//arrange
			mockstar.insertTableData("item", oItemData);

			//act
			var result = mockstar.call(calcVersionId, sessionId, null, null, null, null);

			//assert
			//item calculated items
		   expect(result[0]).toMatchData({
				ITEM_ID:                                   [   1,    2,    3],
				QUANTITY:                                  [null, null, null],
				TOTAL_QUANTITY:                            ['1.0000000', '2.0000000', '3.0000000'],
				TOTAL_QUANTITY_UOM_ID:                     ["PC", "PC", "PC"],
				PRICE_UNIT:                                ['1.0000000', null, null],
				TARGET_COST:                               [null, null, null],
				LOT_SIZE:                                  [null, null, null],
				PRICE_FIXED_PORTION:                       ['13.0000000', null, null],
				PRICE_VARIABLE_PORTION:                    ['26.0000000', null, null],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    ['13.0000000', '4.0000000', '9.0000000'],
        PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION:  ['26.0000000', '8.0000000', '18.0000000'],
				OTHER_COST_FIXED_PORTION:                  ['9.0000000', '0.0000000', '9.0000000'],
				OTHER_COST_VARIABLE_PORTION:               ['18.0000000', '0.0000000', '18.0000000'],
				TOTAL_COST_FIXED_PORTION:                  ['13.0000000', '4.0000000', '9.0000000'],
				TOTAL_COST_VARIABLE_PORTION:               ['26.0000000', '8.0000000', '18.0000000'],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   ['13.0000000', '2.0000000', '3.0000000'],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   ['26.0000000', '4.0000000', '6.0000000'],
			}, ["ITEM_ID"]);
			
			//item calculated values costing sheet
			 expect(result[1]).toMatchData({
				ITEM_ID:                    [   1,       1,      1,     2,      2,     2,      2],
				COSTING_SHEET_ROW_ID:       ['DMC', 'COGM', 'COGS', 'DMC', 'COGM', 'SAO', 'COGS'],
				COST_FIXED_PORTION:         ['4.0000000', '4.0000000', '4.0000000', '4.0000000', '4.0000000', '0.4000000', '4.4000000'],
				COST_VARIABLE_PORTION:      ['8.0000000', '8.0000000', '8.0000000', '8.0000000', '8.0000000', '0.8000000', '8.8000000'],
				HAS_SUBITEMS:               [    1,      1,      1,     0,      0,     0,      0],
				IS_ROLLED_UP_VALUE:         [    1,      1,      1,     0,      0,     0,      0]
			}, ["ITEM_ID", "COSTING_SHEET_ROW_ID"]);
			
			//item calculated values component split
			 expect(result[2]).toMatchData({
				ITEM_ID:                    [   1,       1,      2,		2,    3],
				COMPONENT_SPLIT_ID:         ['#SPLIT_DETAILED','#SPLIT_DETAILED', '#SPLIT_DETAILED', '#SPLIT_DETAILED', '#SPLIT_DETAILED'],
				COST_COMPONENT_ID:          [  111,     -1,    111,		133,   -1],
				COST_FIXED_PORTION:         ['4.0000000', '9.0000000', '4.0000000', '0.0000000', '9.0000000'],
				COST_VARIABLE_PORTION:      ['8.0000000', '18.0000000', '8.0000000', '0.0000000', '18.0000000']
			}, ["ITEM_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID"]);
			
		});

		it('should calculate correctly the item costs when IS_PRICE_SPLIT_ACTIVE is true', function() {
			//arrange
			oItemData.IS_PRICE_SPLIT_ACTIVE[2] = 1;
			mockstar.insertTableData("item", oItemData);

			//act
			var result = mockstar.call(calcVersionId, sessionId, null, null, null, null);

			//assert
			//item calculated items
		   expect(result[0]).toMatchData({
				ITEM_ID:                                   [   1,    2,    3],
				QUANTITY:                                  [null, null, null],
				TOTAL_QUANTITY:                            ['1.0000000', '2.0000000', '3.0000000'],
				TOTAL_QUANTITY_UOM_ID:                     ["PC", "PC", "PC"],
				PRICE_UNIT:                                ['1.0000000', null, null],
				TARGET_COST:                               [null, null, null],
				LOT_SIZE:                                  [null, null, null],
				PRICE_FIXED_PORTION:                       ['67.0000000', null, '21.0000000'],
				PRICE_VARIABLE_PORTION:                    ['80.0000000', null, '24.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    ['67.0000000', '4.0000000', '63.0000000'],
        PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION:  ['80.0000000', '8.0000000', '72.0000000'],
				OTHER_COST_FIXED_PORTION:                  ['57.0000000', '0.0000000', '57.0000000'],
				OTHER_COST_VARIABLE_PORTION:               ['63.0000000', '0.0000000', '63.0000000'],
				TOTAL_COST_FIXED_PORTION:                  ['67.0000000', '4.0000000', '63.0000000'],
				TOTAL_COST_VARIABLE_PORTION:               ['80.0000000', '8.0000000', '72.0000000'],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   ['67.0000000', '2.0000000', '21.0000000'],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   ['80.0000000', '4.0000000', '24.0000000'],
			}, ["ITEM_ID"]);
			
			//item calculated values costing sheet
			 expect(result[1]).toMatchData({
				ITEM_ID:                    [   1,       1,      1,     2,      2,     2,      2,     3,      3,     3,      3],
				COSTING_SHEET_ROW_ID:       ['DMC', 'COGM', 'COGS', 'DMC', 'COGM', 'SAO', 'COGS', 'DMC', 'COGM', 'SAO', 'COGS'],
				COST_FIXED_PORTION:         ['10.0000000', '10.0000000', '10.0000000', '4.0000000', '4.0000000', '0.4000000', '4.4000000', '6.0000000', '6.0000000', '0.6000000', '6.6000000'],
				COST_VARIABLE_PORTION:      ['17.0000000', '17.0000000', '17.0000000', '8.0000000', '8.0000000', '0.8000000', '8.8000000', '9.0000000', '9.0000000', '0.9000000', '9.9000000'],
				HAS_SUBITEMS:               [    1,      1,      1,     0,      0,     0,      0,     0,      0,     0,      0],
				IS_ROLLED_UP_VALUE:         [    1,      1,      1,     0,      0,     0,      0,     0,      0,     0,      0]
			}, ["ITEM_ID", "COSTING_SHEET_ROW_ID"]);
			
			//item calculated values component split
			 expect(result[2]).toMatchData({
				ITEM_ID:                    [   1,       1,      2,		2,    3, 	3,		3],
				COMPONENT_SPLIT_ID:         ['#SPLIT_DETAILED','#SPLIT_DETAILED', '#SPLIT_DETAILED', '#SPLIT_DETAILED', '#SPLIT_DETAILED', '#SPLIT_DETAILED', '#SPLIT_DETAILED'],
				COST_COMPONENT_ID:          [  111,     -1,    111,		133,   111,		133,   -1],
				COST_FIXED_PORTION:         ['10.0000000', '57.0000000', '4.0000000', '0.0000000', '6.0000000',	'0.0000000', '57.0000000'],
				COST_VARIABLE_PORTION:      ['17.0000000', '63.0000000', '8.0000000', '0.0000000', '9.0000000',	'0.0000000', '63.0000000']
			}, ["ITEM_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID"]);
			
		});
		
		it('should throw exception when the referenced controlling_area_id from project level is not defined', function() {
			//arrange
			mockstar.insertTableData("item", oItemData);
			mockstar.clearTable("project");
			var exception;

			//act
			try {
			    mockstar.call(calcVersionId, sessionId);
			} catch(e) {
			    exception = e;
			}

			//assert
			//check exception code is 2048 - AFL exception
			expect(exception.code).toBe(2048);
		});
	}
		
	if (jasmine.plcTestRunParameters.generatedFields === false) {
		it('should calculate if TOTAL_QUANTITY is 0 for assembly items', function() {
			//arrange
			var oModifiedItemData = _.clone(oItemData);
			oModifiedItemData.TOTAL_QUANTITY = [0, 0, 0]; // TOTAL_QUANTIY 0 for assembly
			oItemData.IS_PRICE_SPLIT_ACTIVE[2] = 0;

			mockstar.insertTableData("item", oModifiedItemData);

			//act
			var result = mockstar.call(calcVersionId, sessionId, null, null, null, null);

		    //assert
			//item calculated items
			expect(result[0]).toMatchData({
				ITEM_ID:                                   [   1,    2,    3],
				QUANTITY:                                  [null, null, null],
				TOTAL_QUANTITY:                            ['0.0000000', '0.0000000', '0.0000000'],
				TOTAL_QUANTITY_UOM_ID:                     ["PC", "PC", "PC"],
				PRICE_UNIT:                                [null, null, null],
				TARGET_COST:                               [null, null, null],
				LOT_SIZE:                                  [null, null, null],
				PRICE_FIXED_PORTION:                       [null, null, null],
				PRICE_VARIABLE_PORTION:                    [null, null, null],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    ['0.0000000', '0.0000000', '0.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: ['0.0000000', '0.0000000', '0.0000000'],
				OTHER_COST_FIXED_PORTION:                  ['0.0000000', '0.0000000', '0.0000000'],
				OTHER_COST_VARIABLE_PORTION:               ['0.0000000', '0.0000000', '0.0000000'],
				TOTAL_COST_FIXED_PORTION:                  ['0.0000000', '0.0000000', '0.0000000'],
				TOTAL_COST_VARIABLE_PORTION:               ['0.0000000', '0.0000000', '0.0000000'],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   ['0.0000000', '0.0000000', '0.0000000'],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   ['0.0000000', '0.0000000', '0.0000000'],
			}, ["ITEM_ID"]);
		});
	}
	
	if (jasmine.plcTestRunParameters.generatedFields === true) {
		it('should calculate and save results to extension table', function() {
			//arrange
			var oItemTemporaryExtData =  {
				"SESSION_ID":                           [ sessionId, sessionId, sessionId ],
				"ITEM_ID" :                             [     1,       2,     3 ],
				"CALCULATION_VERSION_ID" :              [     1,       1,     1 ],
				"CUST_DECIMAL_WITHOUT_REF_MANUAL" :     [	 10,	  30,	  20],
				"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL" :  [	  1,	   1,	   1],
				"CUST_INT_FORMULA_CALCULATED": 			[   111, 	  111,	 111]
		};
			mockstar.insertTableData("item", oItemData);
			mockstar.insertTableData("item_temporary_ext", oItemTemporaryExtData);
			
			//act
			var result = mockstar.call(calcVersionId, sessionId, null, null, null, null);

			//assert
			expect(result[0][0].CUST_INT_FORMULA).toBe(null);
			expect(result[0][1].CUST_INT_FORMULA).toBe(60);
			expect(result[0][2].CUST_INT_FORMULA).toBe(null);
		});
	}
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);