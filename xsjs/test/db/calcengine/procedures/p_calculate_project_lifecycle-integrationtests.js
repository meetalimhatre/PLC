/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../../testdata/testdata").data;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;
describe('db.calcengine.procedures.p_calculate_project_lifecycle',function() {

		var mockstar = null;
		var sTestUser = 'tester';
		var sDate = "2015-01-01T00:00:00.000Z";
		var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON(); //"2011-08-20";

		beforeOnce(function() {
			mockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel: "sap.plc.db.calcengine.procedures/p_calculate_project_lifecycle",   // procedure under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{
							calculation: {
								name: "sap.plc.db::basis.t_calculation",
								data: {
									"CALCULATION_ID" : [ 1 ],
									"PROJECT_ID" : [ "P1" ],
									"CALCULATION_NAME" : [ "Calculation 1" ],
									"CREATED_ON" : [ sDate, sDate ],
									"CREATED_BY" : [ sTestUser, sTestUser ],
									"LAST_MODIFIED_ON" : [ sDate, sDate ],
									"LAST_MODIFIED_BY" : [ sTestUser, sTestUser ]
								}
							},
							project: {
								name: "sap.plc.db::basis.t_project",
								data: {
									"PROJECT_ID" : [ "P1", "P2" ],
									"ENTITY_ID"  : [1  ,  2],
									"CONTROLLING_AREA_ID" : [ "#CA1", "#CA1" ],
									"REPORT_CURRENCY_ID": ["EUR", "EUR"],
									"VALUATION_DATE": [sExpectedDateWithoutTime, sExpectedDateWithoutTime],
									"CREATED_ON" : [ sDate, sDate ],
									"CREATED_BY" : [ sTestUser, sTestUser ],
									"LAST_MODIFIED_ON" : [ sDate, sDate ],
									"LAST_MODIFIED_BY" : [ sTestUser, sTestUser ],
									"MATERIAL_PRICE_STRATEGY_ID":[sStandardPriceStrategy,sStandardPriceStrategy],
									"ACTIVITY_PRICE_STRATEGY_ID":[sStandardPriceStrategy,sStandardPriceStrategy]
								}
							},
							version: {
								name: "sap.plc.db::basis.t_calculation_version",
								data: {
									"CALCULATION_VERSION_ID" : [ 1, 11, 12 ],
									"BASE_VERSION_ID": [null, 1, 1 ],
									"CALCULATION_VERSION_TYPE": [1, 2, 16 ],
									"CALCULATION_ID" : [ 1, 1, 1 ],
									"CALCULATION_VERSION_NAME" : [ "Version1", "Version11", "Version12" ],
									"ROOT_ITEM_ID" : [ 1, 1, 1 ],
									"REPORT_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
									"COSTING_SHEET_ID" : [ "#COGSL", "#COGSL", "#COGSL" ],
									"COMPONENT_SPLIT_ID" : [ "#SPLIT_DETAILED", "#SPLIT_DETAILED", "#SPLIT_DETAILED" ],
									"VALUATION_DATE" : [ sDate, sDate, sDate ],
									"LAST_MODIFIED_ON" : [ sDate, sDate, sDate ],
									"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ],
									"MASTER_DATA_TIMESTAMP" : [ sDate, sDate, sDate ],
									"IS_FROZEN" : [ 0, 0, 0 ],
									"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
									"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
								}
							},
							item: "sap.plc.db::basis.t_item",
							item_ext : 'sap.plc.db::basis.t_item_ext',
							formula: "sap.plc.db::basis.t_formula",
							itemReferencedComponentSplit: "sap.plc.db::basis.t_item_referenced_version_component_split",
							resultCostingSheet : "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
							resultComponentSplit : "sap.plc.db::basis.t_item_calculated_values_component_split",
							projectTotalQuantities: {
								name: "sap.plc.db::basis.t_project_lifecycle_configuration",
								data: {
									"PROJECT_ID": ['P1'],
									"CALCULATION_ID": [1],
									"CALCULATION_VERSION_ID": [1],
									"LAST_MODIFIED_ON": [sDate],
									"LAST_MODIFIED_BY": [sTestUser]
								}
							},
							lifecyclePeriodValue: {
								name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
								data: {
									"PROJECT_ID": ['P1', 'P1'],
									"CALCULATION_ID":[1, 1],
									"LIFECYCLE_PERIOD_FROM": [1, 2],
									"VALUE": [1, 2]
								}
							},
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
							}
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
		
		it('should calculate lifecycle versions and save results with the parameter overwriteManualVersions false', function() {
			//arrange
			// This test case only tests lifecycle versions without references. Only lifecycle versions of type 2 are calculated.
			// Version 1 = base version, total_quantity = 1
			// Version 11 = lifecycle version 1, total_quantity = 2
			// Version 12 = manual lifecycle version 16, total_quantity = 4
			let oItemData = {
					"ITEM_ID" :                             [     1,       2,     1,       2,     1,       2],
					"CALCULATION_VERSION_ID" :              [     1,       1,    11,      11,    12,      12],
					"PARENT_ITEM_ID" :                      [  null,       1,  null,       1,  null,       1],
					"IS_ACTIVE" :                           [     1,       1,     1,       1,     1,       1],
					"ITEM_CATEGORY_ID" :                    [     0,       3,     0,       3,     0,       3],
					"CHILD_ITEM_CATEGORY_ID" :              [     0,       3,     0,       3,     0,       3],
					"ACCOUNT_ID" :                          [   "0", "#AC11",   "0", "#AC11",   "0", "#AC11"],
					"TOTAL_QUANTITY_DEPENDS_ON":            [     1,       1,     1,       1,     1,       1],
					"LOT_SIZE":                             ['1.0000000', '2.0000000', '1.0000000', '2.0000000', '1.0000000', '2.0000000'],
					"LOT_SIZE_CALCULATED":                  ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"QUANTITY":                             [  null, '2.0000000',  null, '2.0000000',  null, '2.0000000'],
					"QUANTITY_CALCULATED":                  ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
			        "QUANTITY_UOM_ID":                      [  "PC",    "PC",  "PC",    "PC",  "PC",    "PC"],
			        "BASE_QUANTITY":                        ['1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000'],
			        "BASE_QUANTITY_CALCULATED":             ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"TOTAL_QUANTITY" :                      ['1.0000000',    null,'2.0000000',    null, '4.0000000',    null],
					"TOTAL_QUANTITY_UOM_ID" :               [  "PC",    null,  "PC",    null,  "PC",    null],
					"PRICE_FIXED_PORTION":                  [  null, '2.0000000',  null,'2.0000000',  null, '2.0000000'],
					"PRICE_FIXED_PORTION_CALCULATED":       ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"PRICE_VARIABLE_PORTION":               [  null, '4.0000000',  null, '4.0000000',  null, '4.0000000'],
					"PRICE_VARIABLE_PORTION_CALCULATED":    ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"PRICE":                                [  null,'6.0000000',  null,'6.0000000',  null, '6.0000000'],
					"TRANSACTION_CURRENCY_ID":              [ "EUR",   "EUR", "EUR",   "EUR", "EUR",   "EUR"],
					"PRICE_UNIT":                           ['1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000'],
					"PRICE_UNIT_CALCULATED":                ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"PRICE_UNIT_UOM_ID":                    [  "PC",    "PC",  "PC",    "PC",  "PC",    "PC"],
					"IS_PRICE_SPLIT_ACTIVE":                [    0,       0,     0,       0,     0,       0],
					"PRICE_ID" :                            [  null,       null,  null,      null,  null,      null],
					"TARGET_COST":                          ['1.0000000', '2.0000000', '1.0000000', '2.0000000', '1.0000000', '2.0000000'],
					"CREATED_ON" :                          [ sDate, sDate, sDate, sDate, sDate, sDate ],
					"CREATED_BY" :                          [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ],
					"LAST_MODIFIED_ON" :                    [ sDate, sDate, sDate, sDate, sDate, sDate ],
					"LAST_MODIFIED_BY" :                    [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ]
			};
			mockstar.insertTableData("item", oItemData);
			let projectId = 'P1';

			//act
			mockstar.call(projectId, false);

			//assert
			// Check that total quantities, prices, other costs, and total costs have been saved to item table
			// Version 1 must not be changed because only lifecycle versions 11 is calculated and saved
			let result = mockstar.execQuery("select * from {{item}}");
			expect(result).toMatchData({
				CALCULATION_VERSION_ID :                   [   1,    1,  12,   12,  11,   11],
				ITEM_ID:                                   [   1,    2,   1,    2,   1,    2],
				TOTAL_QUANTITY:                            ['1.0000000', null, '4.0000000', null, '2.0000000', '4.0000000'],
				TOTAL_QUANTITY_UOM_ID:                     ["PC", null,"PC", null,"PC", "PC"],
		        BASE_QUANTITY:                             ['1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000'], // unchanged
		        BASE_QUANTITY_CALCULATED:                  ['99.0000000', '99.0000000','99.0000000', '99.0000000', null, null],
				PRICE_UNIT:                                ['1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000'], // unchanged
				PRICE_UNIT_CALCULATED:                     ['99.0000000', '99.0000000','99.0000000', '99.0000000','1.0000000', null],
				PRICE_UNIT_UOM_ID:                         ["PC", "PC","PC", "PC","PC", "PC"], // unchanged
				IS_PRICE_SPLIT_ACTIVE:                     [    0,       0,     0,       0,     0,       0],// unchanged
				PRICE_ID :                                 [  null,       null,  null,      null,  null,      null],// unchanged
				TARGET_COST:                               ['1.0000000', '2.0000000', '1.0000000', '2.0000000', '1.0000000', '2.0000000'], // unchanged
				TARGET_COST_CALCULATED:                    [null, null, null, null, null, null],
				LOT_SIZE:                                  ['1.0000000', '2.0000000', '1.0000000', '2.0000000', '1.0000000', '2.0000000'], // unchanged
				LOT_SIZE_CALCULATED:                       ['99.0000000', '99.0000000','99.0000000', '99.0000000',null, null],
				PRICE:                                     [null, '6.0000000',null, '6.0000000', null, '6.0000000'], // unchanged
				PRICE_FIXED_PORTION:                       [null, '2.0000000', null, '2.0000000',null, '2.0000000'], // unchanged
				PRICE_FIXED_PORTION_CALCULATED:            ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '4.0000000', null],
				PRICE_VARIABLE_PORTION:                    [null, '4.0000000',null, '4.0000000', null, '4.0000000'], // unchanged
				PRICE_VARIABLE_PORTION_CALCULATED:         ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '8.0000000', null],
				PRICE_FOR_TOTAL_QUANTITY:                  [null, null, null, null, '24.0000000', '24.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    [null, null, null, null, '8.0000000', '8.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: [null, null, null, null, '16.0000000', '16.0000000'],
				OTHER_COST:                                [null, null, null, null, '0.0000000', '0.0000000'],
				OTHER_COST_FIXED_PORTION:                  [null, null, null, null, '0.0000000', '0.0000000'],
				OTHER_COST_VARIABLE_PORTION:               [null, null, null, null, '0.0000000', '0.0000000'],
				TOTAL_COST:                                [null, null, null, null, '24.0000000', '24.0000000'],
				TOTAL_COST_FIXED_PORTION:                  [null, null, null, null, '8.0000000', '8.0000000'],
				TOTAL_COST_VARIABLE_PORTION:               [null, null, null, null, '16.0000000', '16.0000000'],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   [null, null, null, null, '4.0000000', '2.0000000'],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   [null, null, null, null, '8.0000000', '4.0000000'],
				TOTAL_COST_PER_UNIT:					   [null, null, null, null, '12.0000000', '6.0000000']
			}, ["CALCULATION_VERSION_ID", "ITEM_ID"]);

			// Check that costing sheet results have been saved to t_item_calculated_values_costing_sheet table
			result = mockstar.execQuery("select * from {{resultCostingSheet}}");
			expect(result).toMatchData({
				ITEM_ID:                       [      1,      1,      1,      2,      2,      2,      2,      2],
				CALCULATION_VERSION_ID:        [     11,     11,     11,     11,     11,     11,     11,     11],
				COSTING_SHEET_ROW_ID:          [  "DMC", "COGM", "COGS",  "DMC", "COGM",  "SAO", "COGS", "COGS"],
				COSTING_SHEET_OVERHEAD_ROW_ID: [     -1,     -1,     -1,     -1,     -1,     14,     -1,     -1],
				ACCOUNT_ID:                    [     "",     "",     "","#AC11","#AC11","#AC33","#AC11","#AC33"],
				IS_ROLLED_UP_VALUE:            [      1,      1,      1,      0,      0,      0,      0,      0],
				HAS_SUBITEMS:                  [      1,      1,      1,      0,      0,      0,      0,      0],
				COST:                          ['24.0000000', '24.0000000', '24.0000000', '24.0000000', '24.0000000', '2.4000000', '24.0000000', '2.4000000'],
				COST_FIXED_PORTION:            ['8.0000000', '8.0000000', '8.0000000', '8.0000000', '8.0000000', '0.8000000', '8.0000000', '0.8000000'],
				COST_VARIABLE_PORTION:         ['16.0000000', '16.0000000', '16.0000000', '16.0000000', '16.0000000', '1.6000000', '16.0000000', '1.6000000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COSTING_SHEET_ROW_ID", "COSTING_SHEET_OVERHEAD_ROW_ID", "ACCOUNT_ID"]);

			// Check that component split results have been saved to t_item_calculated_values_component_split table
			let cs = "#SPLIT_DETAILED";
			result = mockstar.execQuery("select * from {{resultComponentSplit}}");
			expect(result).toMatchData({
				ITEM_ID:                [      1,       2],
				CALCULATION_VERSION_ID: [     11,      11],
				COMPONENT_SPLIT_ID:     [     cs,      cs],
				COST_COMPONENT_ID:      [    111,     111],
				ACCOUNT_ID:             ["#AC11", "#AC11"],
				COST:                   ['24.0000000', '24.0000000'],
				COST_FIXED_PORTION:     ['8.0000000', '8.0000000'],
				COST_VARIABLE_PORTION:  ['16.0000000', '16.0000000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID", "ACCOUNT_ID"]);
		});

		it('should calculate lifecycle versions and save results with the parameter overwriteManualVersions true', function() {
			//arrange
			// This test case only tests lifecycle versions without references. Manual and lifecycle versions are calculated
			// Version 1 = base version, total_quantity = 1
			// Version 11 = lifecycle version 1, total_quantity = 2
			// Version 12 = manual lifecycle version 16, total_quantity = 4
			let oItemData = {
					"ITEM_ID" :                             [     1,       2,     1,       2,     1,       2],
					"CALCULATION_VERSION_ID" :              [     1,       1,    11,      11,    12,      12],
					"PARENT_ITEM_ID" :                      [  null,       1,  null,       1,  null,       1],
					"IS_ACTIVE" :                           [     1,       1,     1,       1,     1,       1],
					"ITEM_CATEGORY_ID" :                    [     0,       3,     0,       3,     0,       3],
					"CHILD_ITEM_CATEGORY_ID" :                    [     0,       3,     0,       3,     0,       3],
					"ACCOUNT_ID" :                          [   "0", "#AC11",   "0", "#AC11",   "0", "#AC11"],
					"TOTAL_QUANTITY_DEPENDS_ON":            [     1,       1,     1,       1,     1,       1],
					"LOT_SIZE":                             ['1.0000000', '2.0000000', '1.0000000', '2.0000000', '1.0000000', '2.0000000'],
					"LOT_SIZE_CALCULATED":                  ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"QUANTITY":                             [  null, '2.0000000',  null, '2.0000000',  null, '2.0000000'],
					"QUANTITY_CALCULATED":                  ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
			        "QUANTITY_UOM_ID":                      [  "PC",    "PC",  "PC",    "PC",  "PC",    "PC"],
			        "BASE_QUANTITY":                        ['1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000'],
			        "BASE_QUANTITY_CALCULATED":             ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"TOTAL_QUANTITY" :                      ['1.0000000',    null,'2.0000000',    null, '4.0000000',    null],
					"TOTAL_QUANTITY_UOM_ID" :               [  "PC",    null,  "PC",    null,  "PC",    null],
					"PRICE_FIXED_PORTION":                  [  null, '2.0000000',  null,'2.0000000',  null, '2.0000000'],
					"PRICE_FIXED_PORTION_CALCULATED":       ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"PRICE_VARIABLE_PORTION":               [  null, '4.0000000',  null, '4.0000000',  null, '4.0000000'],
					"PRICE_VARIABLE_PORTION_CALCULATED":    ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"PRICE":                                [  null,'6.0000000',  null,'6.0000000',  null, '6.0000000'],
					"TRANSACTION_CURRENCY_ID":              [ "EUR",   "EUR", "EUR",   "EUR", "EUR",   "EUR"],
					"PRICE_UNIT":                           ['1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000'],
					"PRICE_UNIT_CALCULATED":                ['99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000', '99.0000000'],
					"PRICE_UNIT_UOM_ID":                    [  "PC",    "PC",  "PC",    "PC",  "PC",    "PC"],
					"IS_PRICE_SPLIT_ACTIVE":                [    0,       0,     0,       0,     0,       0],
					"PRICE_ID" :                            [  null,       null,  null,      null,  null,      null],
					"TARGET_COST":                          ['1.0000000', '2.0000000', '1.0000000', '2.0000000', '1.0000000', '2.0000000'],
					"CREATED_ON" :                          [ sDate, sDate, sDate, sDate, sDate, sDate ],
					"CREATED_BY" :                          [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ],
					"LAST_MODIFIED_ON" :                    [ sDate, sDate, sDate, sDate, sDate, sDate ],
					"LAST_MODIFIED_BY" :                    [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ]
			};
			mockstar.insertTableData("item", oItemData);
			let projectId = 'P1';

			//act
			mockstar.call(projectId, true);

			//assert
			// Check that total quantities, prices, other costs, and total costs have been saved to item table
			// Version 1 must not be changed because only lifecycle versions 11 and 12 are calculated and saved
			let result = mockstar.execQuery("select * from {{item}}");
			expect(result).toMatchData({
				CALCULATION_VERSION_ID :                   [   1,    1,  11,   11,  12,   12],
				ITEM_ID:                                   [   1,    2,   1,    2,   1,    2],
				TOTAL_QUANTITY:                            ['1.0000000', null, '2.0000000', '4.0000000', '4.0000000', '8.0000000'],
				TOTAL_QUANTITY_UOM_ID:                     ["PC", null,"PC", "PC","PC", "PC"],
		        BASE_QUANTITY:                             ['1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000'], // unchanged
		        BASE_QUANTITY_CALCULATED:                  ['99.0000000', '99.0000000',null, null, null, null],
				PRICE_UNIT:                                ['1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000', '1.0000000'], // unchanged
				PRICE_UNIT_CALCULATED:                     ['99.0000000', '99.0000000','1.0000000', null,'1.0000000', null],
				PRICE_UNIT_UOM_ID:                         ["PC", "PC","PC", "PC","PC", "PC"], // unchanged
				IS_PRICE_SPLIT_ACTIVE:                     [    0,       0,     0,       0,     0,       0],// unchanged
				PRICE_ID :                                 [  null,       null,  null,      null,  null,      null],// unchanged
				TARGET_COST:                               ['1.0000000', '2.0000000', '1.0000000', '2.0000000', '1.0000000', '2.0000000'], // unchanged
				TARGET_COST_CALCULATED:                    [null, null,null, null,null, null],
				LOT_SIZE:                                  ['1.0000000', '2.0000000', '1.0000000', '2.0000000', '1.0000000', '2.0000000'], // unchanged
				LOT_SIZE_CALCULATED:                       ['99.0000000', '99.0000000',null, null, null, null],
				PRICE:                                     [null, '6.0000000',null, '6.0000000', null, '6.0000000'], // unchanged
				PRICE_FIXED_PORTION:                       [null, '2.0000000',null, '2.0000000', null, '2.0000000'], // unchanged
				PRICE_FIXED_PORTION_CALCULATED:            ['99.0000000', '99.0000000', '4.0000000', null, '4.0000000', null],
				PRICE_VARIABLE_PORTION:                    [null, '4.0000000', null, '4.0000000',null, '4.0000000'], // unchanged
				PRICE_VARIABLE_PORTION_CALCULATED:         ['99.0000000', '99.0000000', '8.0000000', null, '8.0000000', null],
				PRICE_FOR_TOTAL_QUANTITY:                  [null, null, '24.0000000', '24.0000000', '48.0000000', '48.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    [null, null,  '8.0000000', '8.0000000', '16.0000000', '16.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: [null, null,   '16.0000000', '16.0000000', '32.0000000', '32.0000000'],
				OTHER_COST:                                [null, null,  '0.0000000', '0.0000000', '0.0000000', '0.0000000'],
				OTHER_COST_FIXED_PORTION:                  [null, null,  '0.0000000', '0.0000000', '0.0000000', '0.0000000'],
				OTHER_COST_VARIABLE_PORTION:               [null, null,  '0.0000000', '0.0000000', '0.0000000', '0.0000000'],
				TOTAL_COST:                                [null, null,  '24.0000000', '24.0000000', '48.0000000', '48.0000000'],
				TOTAL_COST_FIXED_PORTION:                  [null, null,  '8.0000000', '8.0000000', '16.0000000', '16.0000000'],
				TOTAL_COST_VARIABLE_PORTION:               [null, null,   '16.0000000', '16.0000000', '32.0000000', '32.0000000'],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   [null, null,   '4.0000000', '2.0000000', '4.0000000', '2.0000000'],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   [null, null,   '8.0000000', '4.0000000', '8.0000000', '4.0000000'],
				TOTAL_COST_PER_UNIT:					   [null, null,   '12.0000000', '6.0000000', '12.0000000', '6.0000000']
			}, ["CALCULATION_VERSION_ID", "ITEM_ID"]);

			// Check that costing sheet results have been saved to t_item_calculated_values_costing_sheet table
			result = mockstar.execQuery("select * from {{resultCostingSheet}}");
			expect(result).toMatchData({
				ITEM_ID:                       [      1,      1,      1,      2,      2,      2,      2,      2,     1,      1,      1,      2,      2,      2,      2,      2],
				CALCULATION_VERSION_ID:        [     11,     11,     11,     11,     11,     11,     11,     11,    12,     12,     12,     12,     12,     12,     12,     12],
				COSTING_SHEET_ROW_ID:          [  "DMC", "COGM", "COGS",  "DMC", "COGM",  "SAO", "COGS", "COGS", "DMC", "COGM", "COGS",  "DMC", "COGM",  "SAO", "COGS", "COGS"],
				COSTING_SHEET_OVERHEAD_ROW_ID: [     -1,     -1,     -1,     -1,     -1,     14,     -1,     -1,    -1,     -1,     -1,     -1,     -1,     14,     -1,     -1],
				ACCOUNT_ID:                    [     "",     "",     "","#AC11","#AC11","#AC33","#AC11","#AC33",    "",     "",     "","#AC11","#AC11","#AC33","#AC11","#AC33"],
				IS_ROLLED_UP_VALUE:            [      1,      1,      1,      0,      0,      0,      0,      0,     1,      1,      1,      0,      0,      0,      0,      0],
				HAS_SUBITEMS:                  [      1,      1,      1,      0,      0,      0,      0,      0,     1,      1,      1,      0,      0,      0,      0,      0],
				COST:                          ['24.0000000', '24.0000000', '24.0000000', '24.0000000', '24.0000000', '2.4000000', '24.0000000', '2.4000000', '48.0000000', '48.0000000', '48.0000000', '48.0000000', '48.0000000', '4.8000000', '48.0000000', '4.8000000'],
				COST_FIXED_PORTION:            ['8.0000000', '8.0000000', '8.0000000', '8.0000000', '8.0000000', '0.8000000', '8.0000000', '0.8000000', '16.0000000', '16.0000000', '16.0000000', '16.0000000', '16.0000000', '1.6000000', '16.0000000', '1.6000000'],
				COST_VARIABLE_PORTION:         ['16.0000000', '16.0000000', '16.0000000', '16.0000000', '16.0000000', '1.6000000', '16.0000000', '1.6000000', '32.0000000', '32.0000000', '32.0000000', '32.0000000', '32.0000000', '3.2000000', '32.0000000', '3.2000000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COSTING_SHEET_ROW_ID", "COSTING_SHEET_OVERHEAD_ROW_ID", "ACCOUNT_ID"]);

			// Check that component split results have been saved to t_item_calculated_values_component_split table
			let cs = "#SPLIT_DETAILED";
			result = mockstar.execQuery("select * from {{resultComponentSplit}}");
			expect(result).toMatchData({
				ITEM_ID:                [      1,       2,       1,       2],
				CALCULATION_VERSION_ID: [     11,      11,      12,      12],
				COMPONENT_SPLIT_ID:     [     cs,      cs,      cs,      cs],
				COST_COMPONENT_ID:      [    111,     111,     111,     111],
				ACCOUNT_ID:             ["#AC11", "#AC11", "#AC11", "#AC11"],
				COST:                   ['24.0000000', '24.0000000', '48.0000000', '48.0000000'],
				COST_FIXED_PORTION:     ['8.0000000', '8.0000000', '16.0000000', '16.0000000'],
				COST_VARIABLE_PORTION:  ['16.0000000', '16.0000000', '32.0000000', '32.0000000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID", "ACCOUNT_ID"]);
		});

}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);