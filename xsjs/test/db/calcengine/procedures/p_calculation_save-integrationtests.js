/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;

describe('db.calcengine.procedures.p_calculation_save_results',function() {

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
		        "BASE_QUANTITY":                        ['1.0000000', '1.0000000', '1.0000000'],
		        "BASE_QUANTITY_CALCULATED":             ['99.0000000', '99.0000000', '99.0000000'],
				"TOTAL_QUANTITY" :                      ['1.0000000',    null,  null ],
				"TOTAL_QUANTITY_UOM_ID" :               [  "PC",    null,  null ],
				"PRICE_FIXED_PORTION":                  [  null, '2.0000000', '3.0000000'],
				"PRICE_FIXED_PORTION_CALCULATED":       ['99.0000000', '99.0000000', '99.0000000'],
				"PRICE_VARIABLE_PORTION":               [  null, '4.0000000', '6.0000000'],
				"PRICE_VARIABLE_PORTION_CALCULATED":    ['99.0000000', '99.0000000', '99.0000000'],
				"PRICE":                                [  null, '6.0000000', '9.0000000'],
				"TRANSACTION_CURRENCY_ID":        [ "EUR",   "EUR", "EUR" ],
				"PRICE_UNIT":                           ['1.0000000', '1.0000000', '1.0000000'],
				"PRICE_UNIT_CALCULATED":                ['99.0000000', '99.0000000', '99.0000000'],
				"PRICE_UNIT_UOM_ID":                    [  "PC",    "PC",  "PC" ],
				"IS_PRICE_SPLIT_ACTIVE":                [    0,       0,     0],
				"PRICE_ID" :                            [  null,       null,  '280000E0B2BDB9671600A4000936462B'],
				"TARGET_COST":                          ['1.0000000', '2.0000000', '3.0000000']
		};
		const cs = "#SPLIT_DETAILED";

		beforeOnce(function() {
			mockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel: "sap.plc.db.calcengine.procedures/p_calculation_save_results",                        // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
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
									"ENTITY_ID" : [1, 2],
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
							resultCostingSheet : "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
							resultComponentSplit : "sap.plc.db::basis.t_item_calculated_values_component_split",
							cachedComponentSplit : "sap.plc.db::basis.t_item_referenced_version_component_split",
							cachedComponentSplitTemp : "sap.plc.db::basis.t_item_referenced_version_component_split_temporary",
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
							costing_sheet_overhead_row_formula:{
								name: "sap.plc.db::basis.t_costing_sheet_overhead_row_formula",
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
							item_ext : 'sap.plc.db::basis.t_item_ext',
							price_component: {
								name: "sap.plc.db::basis.t_price_component",
								data: {
									"PRICE_ID":[ '280000E0B2BDB9671600A4000936462B', '280000E0B2BDB9671600A4000936462B',  '280000E0B2BDB9671600A4000936462B'],
									"_VALID_FROM":['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
									"ACCOUNT_ID":["0","#AC11","625000"],
									"PRICE_FIXED":[ "13.0000000", "2.0000000", "6.0000000"],
									"PRICE_VARIABLE":[ "14.0000000", "3.0000000", "7.0000000"],
									"CONTROLLING_AREA_ID":['#CA1', '#CA1', '#CA1']
								}
							},
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
		it('should calculate correctly and save results with USE_DEFAULT_FIXED_COST_PORTION set to 0', function() {
			//arrange
			mockstar.insertTableData("item", oItemData);
			mockstar.insertTableData("cachedComponentSplit", {
					MASTER_CALCULATION_VERSION_ID:     [      1,       1,       2,   2],
					REFERENCED_CALCULATION_VERSION_ID: [      2,       3,       4,   5],
					COMPONENT_SPLIT_ID:                [     cs,      cs,      cs,  cs],
					COST_COMPONENT_ID:                 [    333,      -1,     111,  -1],
					ACCOUNT_ID:                        ["#AC11",     "X", "#AC11", "0"],
					COST_FIXED_PORTION:                [      1,       3,       5,   7],
					COST_VARIABLE_PORTION:             [      2,       4,       6,   8]
				}
			);

			mockstar.execSingle(`update {{costing_sheet_overhead_row}} set
					PLANT_ID = null,
					COMPANY_CODE_ID = null,
					OVERHEAD_GROUP_ID = null,
					CREDIT_FIXED_COST_PORTION = 50`);
			mockstar.execSingle(`update {{costing_sheet_overhead}} set
			USE_DEFAULT_FIXED_COST_PORTION = 0`);

			//act
			mockstar.call(calcVersionId, sessionId);

			//assert
			const oResultItem = mockstar.execQuery("select * from {{item}}");
			expect(oResultItem).toMatchData({
				SESSION_ID: 							   [sessionId,       sessionId,   sessionId ],
				CALCULATION_VERSION_ID :                   [   1,                    1,  		   1],
				ITEM_ID:                                   [   1,                    2,            3],
				PRICE:                                     [null,          '6.0000000',  '9.0000000'],
				PRICE_FIXED_PORTION:                       [null,          '2.0000000',  '3.0000000'],
				PRICE_FIXED_PORTION_CALCULATED:            ['13.0000000',         null,         null],
				PRICE_VARIABLE_PORTION:                    [null, 		   '4.0000000',    '6.0000000'],
				PRICE_VARIABLE_PORTION_CALCULATED:         ['26.0000000',         null,         null],
				PRICE_FOR_TOTAL_QUANTITY:                  ['41.4000000', '12.0000000','27.0000000' ],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    ['14.2000000',  '4.0000000', '9.0000000' ],
				PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: ['27.2000000',  '8.0000000','18.0000000' ],
				TOTAL_COST:                                ['41.4000000', '14.4000000','27.0000000' ],
				TOTAL_COST_FIXED_PORTION:                  ['14.2000000',  '5.2000000', '9.0000000' ],
				TOTAL_COST_VARIABLE_PORTION:               ['27.2000000',  '9.2000000','18.0000000' ],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   ['14.2000000',  '2.6000000', '3.0000000' ],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   ['27.2000000',  '4.6000000', '6.0000000' ],
				TOTAL_COST_PER_UNIT:					   ['41.4000000',  '7.2000000', '9.0000000' ]
			}, ["SESSION_ID", "CALCULATION_VERSION_ID", "ITEM_ID"]);

			const oResultCostingSheet = mockstar.execQuery("select * from {{resultCostingSheet}}");
			expect(oResultCostingSheet).toMatchData({
				ITEM_ID:                       [          1,           1,           1,           1,           2,          2,          2,           2,          2,          2,           2,          2,          2],
				CALCULATION_VERSION_ID:        [          1,           1,           1,           1,           1,          1,          1,           1,          1,          1,           1,          1,          1],
				COSTING_SHEET_ROW_ID:          [      "DMC",       "MOC",      "COGM",      "COGS",       "DMC",      "MOC",      "MOC",      "COGM",     "COGM",      "SAO",      "COGS",     "COGS",     "COGS"],
				COSTING_SHEET_OVERHEAD_ROW_ID: [          -1,         -1,          -1,          -1,          -1,          6,          7,          -1,         -1,         14,          -1,         -1,         -1],
				COST:                          ['12.0000000','2.4000000','14.4000000','14.4000000','12.0000000','1.2000000','1.2000000','12.0000000','2.4000000','1.4400000','12.0000000','2.4000000','1.4400000'],
				COST_FIXED_PORTION:            [ '4.0000000','1.2000000', '5.2000000', '5.2000000', '4.0000000','0.6000000','0.6000000', '4.0000000','1.2000000','0.7200000', '4.0000000','1.2000000','0.7200000'],
				COST_VARIABLE_PORTION:         [ '8.0000000','1.2000000', '9.2000000', '9.2000000', '8.0000000','0.6000000','0.6000000', '8.0000000','1.2000000','0.7200000', '8.0000000','1.2000000','0.7200000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COSTING_SHEET_ROW_ID", "COSTING_SHEET_OVERHEAD_ROW_ID"]);
		});

		it('should calculate correctly and save results', function() {
			//arrange
			mockstar.insertTableData("item", oItemData);
			// store some invalid data (account_id, cost_component_id) into component split result cache
			// to test if the table is updated correctly while saving results
			mockstar.insertTableData("cachedComponentSplit", {
					MASTER_CALCULATION_VERSION_ID:     [      1,       1,       2,   2],
					REFERENCED_CALCULATION_VERSION_ID: [      2,       3,       4,   5],
					COMPONENT_SPLIT_ID:                [     cs,      cs,      cs,  cs],
					COST_COMPONENT_ID:                 [    333,      -1,     111,  -1],
					ACCOUNT_ID:                        ["#AC11",     "X", "#AC11", "0"],
					COST_FIXED_PORTION:                [      1,       3,       5,   7],
					COST_VARIABLE_PORTION:             [      2,       4,       6,   8]
				}
			);

			//act
		    mockstar.call(calcVersionId, sessionId); // calcVersionId = 1

			//assert
			// Check that prices, other costs, and total costs have been saved to item_temporary table
			var result = mockstar.execQuery("select * from {{item}}");
			expect(result).toMatchData({
				SESSION_ID: [sessionId, sessionId, sessionId ],
				CALCULATION_VERSION_ID :                   [   1,    1,    1],
				ITEM_ID:                                   [   1,    2,    3],
				TOTAL_QUANTITY:                            ['1.0000000', '2.0000000', '3.0000000'],
				TOTAL_QUANTITY_UOM_ID:                     ["PC", "PC", "PC"],
		        BASE_QUANTITY:                             ['1.0000000', '1.0000000', '1.0000000'], // unchanged
		        BASE_QUANTITY_CALCULATED:                  [null, null, null],
				PRICE_UNIT:                                ['1.0000000', '1.0000000', '1.0000000'], // unchanged
				PRICE_UNIT_CALCULATED:                     ['1.0000000', null, null],
				PRICE_UNIT_UOM_ID:                         ["PC", "PC", "PC"], // unchanged
				IS_PRICE_SPLIT_ACTIVE:                     [    0,       0,     0],// unchanged
				PRICE_ID :                                 [  null,       null,  '280000E0B2BDB9671600A4000936462B'],// unchanged
				TARGET_COST:                               ['1.0000000', '2.0000000', '3.0000000'], // unchanged
				TARGET_COST_CALCULATED:                    [null, null, null],
				LOT_SIZE:                          ['1.0000000', '2.0000000', '3.0000000'], // unchanged
				LOT_SIZE_CALCULATED:               [null, null, null],
				PRICE:                                     [null, '6.0000000', '9.0000000'], // unchanged
				PRICE_FIXED_PORTION:                       [null, '2.0000000', '3.0000000'], // unchanged
				PRICE_FIXED_PORTION_CALCULATED:            ['13.0000000', null, null],
				PRICE_VARIABLE_PORTION:                    [null, '4.0000000', '6.0000000'], // unchanged
				PRICE_VARIABLE_PORTION_CALCULATED:         ['26.0000000', null, null],
				PRICE_FOR_TOTAL_QUANTITY:                  ['39.0000000', '12.0000000', '27.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    ['13.0000000', '4.0000000', '9.0000000'], 
				PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: ['26.0000000', '8.0000000', '18.0000000'],
				OTHER_COST:                                ['27.0000000', '0.0000000', '27.0000000'],	
				OTHER_COST_FIXED_PORTION:                  ['9.0000000', '0.0000000', '9.0000000'],	
				OTHER_COST_VARIABLE_PORTION:               ['18.0000000', '0.0000000', '18.0000000'],	
				TOTAL_COST:                                ['39.0000000', '12.0000000', '27.0000000'],	
				TOTAL_COST_FIXED_PORTION:                  ['13.0000000', '4.0000000', '9.0000000'],	
				TOTAL_COST_VARIABLE_PORTION:               ['26.0000000', '8.0000000', '18.0000000'],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   ['13.0000000', '2.0000000', '3.0000000'],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   ['26.0000000', '4.0000000', '6.0000000'],
				TOTAL_COST_PER_UNIT:					   ['39.0000000', '6.0000000', '9.0000000']	
			}, ["SESSION_ID", "CALCULATION_VERSION_ID", "ITEM_ID"]);

			// Check that costing sheet results have been saved to t_item_calculated_values_costing_sheet table
			result = mockstar.execQuery("select * from {{resultCostingSheet}}");
			expect(result).toMatchData({
				ITEM_ID:                       [      1,      1,      1,      2,      2,      2,      2,      2],
				CALCULATION_VERSION_ID:        [      1,      1,      1,      1,      1,      1,      1,      1],
				COSTING_SHEET_ROW_ID:          [  "DMC", "COGM", "COGS",  "DMC", "COGM",  "SAO", "COGS", "COGS"],
				COSTING_SHEET_OVERHEAD_ROW_ID: [     -1,     -1,     -1,     -1,     -1,     14,     -1,     -1],
				ACCOUNT_ID:                    [     "",     "",     "","#AC11","#AC11","#AC33","#AC11","#AC33"],
				IS_ROLLED_UP_VALUE:                  [      1,      1,      1,      0,      0,      0,      0,      0],
				HAS_SUBITEMS:             [      1,      1,      1,      0,      0,      0,      0,      0],
				COST:                          ['12.0000000', '12.0000000', '12.0000000', '12.0000000', '12.0000000', '1.2000000', '12.0000000', '1.2000000'],
				COST_FIXED_PORTION:            ['4.0000000', '4.0000000', '4.0000000', '4.0000000', '4.0000000', '0.4000000', '4.0000000', '0.4000000'],
				COST_VARIABLE_PORTION:         ['8.0000000', '8.0000000', '8.0000000', '8.0000000', '8.0000000', '0.8000000', '8.0000000', '0.8000000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COSTING_SHEET_ROW_ID", "COSTING_SHEET_OVERHEAD_ROW_ID", "ACCOUNT_ID"]);

			// Check that component split results have been saved to t_item_calculated_values_component_split table
			result = mockstar.execQuery("select * from {{resultComponentSplit}}");
			expect(result).toMatchData({
				ITEM_ID:                [      1,       1,       2,   3],
				CALCULATION_VERSION_ID: [      1,       1,       1,   1],
				COMPONENT_SPLIT_ID:     [     cs,      cs,      cs,  cs],
				COST_COMPONENT_ID:      [    111,      -1,     111,  -1],
				ACCOUNT_ID:             ["#AC11",     "0", "#AC11", "0"],
				COST:                   ['12.0000000', '27.0000000', '12.0000000', '27.0000000'],
				COST_FIXED_PORTION:     ['4.0000000', '9.0000000', '4.0000000', '9.0000000'],
				COST_VARIABLE_PORTION:  ['8.0000000', '18.0000000', '8.0000000', '18.0000000']			
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID", "ACCOUNT_ID"]);

			// Check that referenced component split results (none in this case) are saved.
			// Calculation version 1 (=calcVersionId) does not contain any references. Thus, its cashed values must be removed.
			// Data for other calculation versions must be unchanged.
			result = mockstar.execQuery("select * from {{cachedComponentSplit}}");
			expect(result).toMatchData({
				MASTER_CALCULATION_VERSION_ID:     [      2,   2],
				REFERENCED_CALCULATION_VERSION_ID: [      4,   5],
				COMPONENT_SPLIT_ID:                [     cs,  cs],
				COST_COMPONENT_ID:                 [    111,  -1],
				ACCOUNT_ID:                        ["#AC11", "0"],
				COST_FIXED_PORTION:                [      '5.0000000',   '7.0000000'],
				COST_VARIABLE_PORTION:             [      '6.0000000',   '8.0000000']
			}, ["MASTER_CALCULATION_VERSION_ID", "REFERENCED_CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID", "ACCOUNT_ID"]);
		});

		it('should calculate correctly and save results when using costing sheet overhead formulas', function(){
			//arrange
			var cs = "#SPLIT_DETAILED";
			mockstar.insertTableData("item", oItemData);
			// store some invalid data (account_id, cost_component_id) into component split result cache
			// to test if the table is updated correctly while saving results
			mockstar.insertTableData("cachedComponentSplit", {
					MASTER_CALCULATION_VERSION_ID:     [      1,       1,       2,   2],
					REFERENCED_CALCULATION_VERSION_ID: [      2,       3,       4,   5],
					COMPONENT_SPLIT_ID:                [     cs,      cs,      cs,  cs],
					COST_COMPONENT_ID:                 [    333,      -1,     111,  -1],
					ACCOUNT_ID:                        ["#AC11",     "X", "#AC11", "0"],
					COST_FIXED_PORTION:                [      1,       3,       5,   7],
					COST_VARIABLE_PORTION:             [      2,       4,       6,   8]
				}
			);

			rowVF = "2000-01-01 00:00:00.0000000";
			rowVT = "2030-01-01 00:00:00.0000000";

			mockstar.clearTable("costing_sheet_row");
			mockstar.insertTableData("costing_sheet_row",{
				COSTING_SHEET_ROW_ID:      			   [   "DMC",   "DPC",   "MOC",   "POC"],
				COSTING_SHEET_ID:                      ["#COGSL","#COGSL","#COGSL","#COGSL"],
				COSTING_SHEET_ROW_TYPE:				   [       1,       1,       3,       3],
				ACCOUNT_GROUP_AS_BASE_ID:			   [	 110,	  110,    null,    null],
				COSTING_SHEET_OVERHEAD_ID:			   [	null,    null,      11,      16],
				CALCULATION_ORDER:					   [	   1,       3,       2,       4],
				_VALID_FROM:						   [   rowVF,   rowVF,   rowVF,   rowVF],
				_VALID_TO:				               [   rowVT,   rowVT,   rowVT,   rowVT],
				_SOURCE:							   [       1,       1,       1,       1],
				IS_RELEVANT_FOR_TOTAL: 				   [ 		1,      1,       1,       1],
				IS_RELEVANT_FOR_TOTAL2: 			   [ 		0,      0,       0,       0],
				IS_RELEVANT_FOR_TOTAL3: 			   [ 		0,      0,       0,       0],
			});

			mockstar.clearTable("costing_sheet_row_dependencies");
			mockstar.insertTableData("costing_sheet_row_dependencies",{
				SOURCE_ROW_ID:						   [   "MOC",    "POC"],
				TARGET_ROW_ID:						   [   "DMC",    "DPC"],
				COSTING_SHEET_ID:					   ["#COGSL", "#COGSL"],
				_VALID_FROM:						   [   rowVF,    rowVF],
				_VALID_TO:				               [   rowVT,    rowVT],
				_SOURCE:							   [       1,        1]
			});

			mockstar.clearTable("costing_sheet_overhead");
			mockstar.insertTableData("costing_sheet_overhead",{
				COSTING_SHEET_OVERHEAD_ID:      	   [   	  11,      16],
				CREDIT_ACCOUNT_ID:					   ['#AC31',  '#AC31'],
				IS_ROLLED_UP:						   [       1,       1],
				_VALID_FROM:						   [   rowVF,   rowVF],
				_VALID_TO:				               [   rowVT,   rowVT],
				_SOURCE:							   [       1,       1],
                USE_DEFAULT_FIXED_COST_PORTION:		   [       1,       1]
			});
			mockstar.clearTable("costing_sheet_overhead_row");
			mockstar.insertTableData("costing_sheet_overhead_row",{
				COSTING_SHEET_OVERHEAD_ROW_ID:		   [	   6,      7,     13],
				COSTING_SHEET_OVERHEAD_ID:      	   [      11,     11,     16],
				CONTROLLING_AREA_ID:				   [  '#CA1', '#CA1', '#CA1'],
				OVERHEAD_PERCENTAGE:				   [      10,     10,     10],
				FORMULA_ID:							   [	   1,   null,      2],
				VALID_FROM:							   [   rowVF,  rowVF,  rowVF],
				VALID_TO:				               [   rowVT,  rowVT,  rowVT],
				_VALID_FROM:						   [   rowVF,  rowVF,  rowVF],
				_SOURCE:							   [       1,      1,      1]
			});

			mockstar.clearTable("costing_sheet_overhead_row_formula");
			mockstar.insertTableData("costing_sheet_overhead_row_formula",{
				FORMULA_ID:							   [              1,   2],
				FORMULA_STRING:						   ["NOT(IS_MATERIAL())",  ""]
			});

			mockstar.execSingle(`update {{costing_sheet_overhead_row_formula}} set
					FORMULA_STRING = 'AND($PLANT_ID=''#P1'';$COMPANY_CODE_ID=''#C1'')'
					WHERE FORMULA_ID= 2`);

			//act
		    mockstar.call(calcVersionId, sessionId); // calcVersionId = 1

			var result = mockstar.execQuery("select * from {{item}}");
		    expect(result).toMatchData({
				SESSION_ID:                                [sessionId, sessionId, sessionId ],
				CALCULATION_VERSION_ID :                   [   1,    1,    1],
				ITEM_ID:                                   [   1,    2,    3],
				ACCOUNT_ID:								   [ "0","#AC11","0"],
				TOTAL_QUANTITY:                            ['1.0000000', '2.0000000', '3.0000000'],
				TOTAL_QUANTITY_UOM_ID:                     ["PC", "PC", "PC"],
		        BASE_QUANTITY:                             ['1.0000000', '1.0000000', '1.0000000'], // unchanged
		        BASE_QUANTITY_CALCULATED:                  [null, null, null],
				PRICE_UNIT:                                ['1.0000000', '1.0000000', '1.0000000'], // unchanged
				PRICE_UNIT_CALCULATED:                     ['1.0000000', null, null],
				PRICE_UNIT_UOM_ID:                         ["PC", "PC", "PC"], // unchanged
				IS_PRICE_SPLIT_ACTIVE:                     [    0,       0,     0],// unchanged
				PRICE_ID :                                 [  null,       null,  '280000E0B2BDB9671600A4000936462B'],// unchanged
				TARGET_COST:                               ['1.0000000', '2.0000000', '3.0000000'], // unchanged
				TARGET_COST_CALCULATED:                    [null, null, null],
				LOT_SIZE:                                  ['1.0000000', '2.0000000', '3.0000000'], // unchanged
				LOT_SIZE_CALCULATED:              		   [null, null, null],
				PRICE:                                     [null, '6.0000000', '9.0000000'], // unchanged
				PRICE_FIXED_PORTION:                       [null, '2.0000000', '3.0000000'], // unchanged
				PRICE_FIXED_PORTION_CALCULATED:            ['13.0000000', null, null],
				PRICE_VARIABLE_PORTION:                    [null, '4.0000000', '6.0000000'], // unchanged
				PRICE_VARIABLE_PORTION_CALCULATED:         ['26.0000000', null, null],
				PRICE_FOR_TOTAL_QUANTITY:                  ['41.4000000', '12.0000000','27.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    ['13.8000000', '4.0000000', '9.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: ['27.6000000', '8.0000000', '18.0000000'],
				OTHER_COST:                                ['27.0000000', '0.0000000', '27.0000000'],
				OTHER_COST_FIXED_PORTION:                  ['9.0000000', '0.0000000', '9.0000000'],
				OTHER_COST_VARIABLE_PORTION:               ['18.0000000', '0.0000000', '18.0000000'],
				TOTAL_COST:                                ['41.4000000', '14.4000000','27.0000000'],
				TOTAL_COST_FIXED_PORTION:                  ['13.8000000', '4.8000000', '9.0000000'],
				TOTAL_COST_VARIABLE_PORTION:               ['27.6000000', '9.6000000', '18.0000000'],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   ['13.8000000', '2.4000000', '3.0000000'],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   ['27.6000000', '4.8000000', '6.0000000'],
				TOTAL_COST_PER_UNIT:					   ['41.4000000', '7.2000000', '9.0000000']
			}, ["SESSION_ID", "CALCULATION_VERSION_ID", "ITEM_ID"]);

			// Check that costing sheet results have been saved to t_item_calculated_values_costing_sheet table
			result = mockstar.execQuery("select * from {{resultCostingSheet}}");
			expect(result).toMatchData({
				ITEM_ID:                       [      1,      1,      1,       2,       2,       2,      2],
				CALCULATION_VERSION_ID:        [      1,      1,      1,       1,       1,       1,      1],
				COSTING_SHEET_ROW_ID:          [  "DMC",  "MOC",  "DPC",   "DMC",   "MOC",   "MOC",  "DPC"],
				COSTING_SHEET_OVERHEAD_ROW_ID: [     -1,     -1,     -1,      -1,       6,       7,     -1],
				ACCOUNT_ID:                    [     "",     "",     "", "#AC11", "#AC31", "#AC31","#AC11"],
				IS_ROLLED_UP_VALUE:            [      1,      1,      1,	   0,       0,       0,      0],
				HAS_SUBITEMS:             	   [      1,      1,      1,       0,       0,       0,      0],
				COST:                          ['12.0000000', '2.4000000','12.0000000','12.0000000','1.2000000', '1.2000000','12.0000000'],
				COST_FIXED_PORTION:            [ '4.0000000', '0.8000000', '4.0000000', '4.0000000','0.4000000', '0.4000000', '4.0000000'],
				COST_VARIABLE_PORTION:         [ '8.0000000', '1.6000000', '8.0000000', '8.0000000','0.8000000', '0.8000000', '8.0000000'],
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COSTING_SHEET_ROW_ID", "COSTING_SHEET_OVERHEAD_ROW_ID", "ACCOUNT_ID"]);

			// Check that component split results have been saved to t_item_calculated_values_component_split table
			result = mockstar.execQuery("select * from {{resultComponentSplit}}");
			expect(result).toMatchData({
				ITEM_ID:                [      1,       1,       1,       2,      2,      3],
				CALCULATION_VERSION_ID: [      1,       1,       1,       1,      1,      1],
				COMPONENT_SPLIT_ID:     [     cs,      cs,      cs,      cs,     cs,     cs],
				COST_COMPONENT_ID:      [    111,     131,      -1,     111,    131,     -1],
				ACCOUNT_ID:             ["#AC11", "#AC31",     "0", "#AC11","#AC31",    "0"],
				COST:                   ['12.0000000', '2.4000000','27.0000000', '12.0000000', '2.4000000','27.0000000'],
				COST_FIXED_PORTION:     [ '4.0000000', '0.8000000', '9.0000000',  '4.0000000', '0.8000000', '9.0000000'],
				COST_VARIABLE_PORTION:  [ '8.0000000', '1.6000000','18.0000000',  '8.0000000', '1.6000000','18.0000000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID", "ACCOUNT_ID"]);

			// Check that referenced component split results (none in this case) are saved.
			// Calculation version 1 (=calcVersionId) does not contain any references. Thus, its cashed values must be removed.
			// Data for other calculation versions must be unchanged.
			result = mockstar.execQuery("select * from {{cachedComponentSplit}}");
			expect(result).toMatchData({
				MASTER_CALCULATION_VERSION_ID:     [      2,   2],
				REFERENCED_CALCULATION_VERSION_ID: [      4,   5],
				COMPONENT_SPLIT_ID:                [     cs,  cs],
				COST_COMPONENT_ID:                 [    111,  -1],
				ACCOUNT_ID:                        ["#AC11", "0"],
				COST_FIXED_PORTION:                [      '5.0000000',   '7.0000000'],
				COST_VARIABLE_PORTION:             [      '6.0000000',   '8.0000000']
			}, ["MASTER_CALCULATION_VERSION_ID", "REFERENCED_CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID", "ACCOUNT_ID"]);
		});

		xit('should calculate the cost correctly when price split is active and save results', function() {
			//arrange
			//oItemData.IS_PRICE_SPLIT_ACTIVE[2] = 1;
			mockstar.insertTableData("item", oItemData);
			// store some invalid data (account_id, cost_component_id) into component split result cache
			// to test if the table is updated correctly while saving results
			mockstar.insertTableData("cachedComponentSplit", {
					MASTER_CALCULATION_VERSION_ID:     [      1,       1,       2,   2],
					REFERENCED_CALCULATION_VERSION_ID: [      2,       3,       4,   5],
					COMPONENT_SPLIT_ID:                [     cs,      cs,      cs,  cs],
					COST_COMPONENT_ID:                 [    333,      -1,     111,  -1],
					ACCOUNT_ID:                        ["#AC11",     "X", "#AC11", "0"],
					COST_FIXED_PORTION:                [      1,       3,       5,   7],
					COST_VARIABLE_PORTION:             [      2,       4,       6,   8]
				}
			);

			//act
			mockstar.call(calcVersionId, sessionId); // calcVersionId = 1

			//assert
			// Check that prices, other costs, and total costs have been saved to item_temporary table
			var result = mockstar.execQuery("select * from {{item}}");
			expect(result).toMatchData({
				SESSION_ID: [sessionId, sessionId, sessionId ],
				CALCULATION_VERSION_ID :                   [   1,    1,    1],
				ITEM_ID:                                   [   1,    2,    3],
				TOTAL_QUANTITY:                            ['1.0000000', '2.0000000', '3.0000000'],
				TOTAL_QUANTITY_UOM_ID:                     ["PC", "PC", "PC"],
		        BASE_QUANTITY:                             ['1.0000000', '1.0000000', '1.0000000'], // unchanged
		        BASE_QUANTITY_CALCULATED:                  [null, null, null],
				PRICE_UNIT:                                ['1.0000000', '1.0000000', '1.0000000'], // unchanged
				PRICE_UNIT_CALCULATED:                     ['1.0000000', null, null],
				PRICE_UNIT_UOM_ID:                         ["PC", "PC", "PC"], // unchanged
				IS_PRICE_SPLIT_ACTIVE:                     [    0,       0,     0],// unchanged
				PRICE_ID :                                 [  null,       null,  '280000E0B2BDB9671600A4000936462B'],// unchanged
				TARGET_COST:                               ['1.0000000', '2.0000000', '3.0000000'], // unchanged
				TARGET_COST_CALCULATED:                    [null, null, null],
				LOT_SIZE:                                  ['1.0000000', '2.0000000', '3.0000000'], // unchanged
				LOT_SIZE_CALCULATED:               	       [null, null, null],
				PRICE:                                     [null, '6.0000000', '9.0000000'],
				PRICE_ID:								   [null, null, '280000E0B2BDB9671600A4000936462B'],
				IS_PRICE_SPLIT_ACTIVE:					   [0,0,1],
				PRICE_FIXED_PORTION:                       [null, '2.0000000', '3.0000000'], // unchanged
				PRICE_FIXED_PORTION_CALCULATED:            ['67.0000000', null, null],
				PRICE_VARIABLE_PORTION:                    [null, '4.0000000', '6.0000000'], // unchanged
				PRICE_VARIABLE_PORTION_CALCULATED:         ['80.0000000', null, null],
				PRICE_FOR_TOTAL_QUANTITY:                  ['147.0000000', '12.0000000', '135.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    ['67.0000000', '4.0000000', '63.0000000'], 
				PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: ['80.0000000', '8.0000000', '72.0000000'],
				OTHER_COST:                                ['85.0000000', '0.0000000', '85.0000000'],	
				OTHER_COST_FIXED_PORTION:                  ['40.0000000', '0.0000000', '40.0000000'],	
				OTHER_COST_VARIABLE_PORTION:               ['45.0000000', '0.0000000', '45.0000000'],	
				TOTAL_COST:                                ['147.0000000', '12.0000000', '135.0000000'],	
				TOTAL_COST_FIXED_PORTION:                  ['67.0000000', '4.0000000', '63.0000000'],	
				TOTAL_COST_VARIABLE_PORTION:               ['80.0000000', '8.0000000', '72.0000000'],
				TOTAL_COST_PER_UNIT_FIXED_PORTION:		   ['67.0000000', '2.0000000', '21.0000000'],
				TOTAL_COST_PER_UNIT_VARIABLE_PORTION:	   ['80.0000000', '4.0000000', '24.0000000'],
				TOTAL_COST_PER_UNIT:					   ['147.0000000', '6.0000000', '45.0000000']	
			}, ["SESSION_ID", "CALCULATION_VERSION_ID", "ITEM_ID"]);

			// Check that costing sheet results have been saved to t_item_calculated_values_costing_sheet table
			result = mockstar.execQuery("select * from {{resultCostingSheet}}");
			expect(result).toMatchData({
				ITEM_ID:                       [      1,      1,      1,      2,      2,      2,      2,      2],
				CALCULATION_VERSION_ID:        [      1,      1,      1,      1,      1,      1,      1,      1],
				COSTING_SHEET_ROW_ID:          [  "DMC", "COGM", "COGS",  "DMC", "COGM",  "SAO", "COGS", "COGS"],
				COSTING_SHEET_OVERHEAD_ROW_ID: [     -1,     -1,     -1,     -1,     -1,     14,     -1,     -1],
				ACCOUNT_ID:                    [     "",     "",     "","#AC11","#AC11","#AC33","#AC11","#AC33"],
				IS_ROLLED_UP_VALUE:                  [      1,      1,      1,      0,      0,      0,      0,      0],
				HAS_SUBITEMS:             [      1,      1,      1,      0,      0,      0,      0,      0],
				COST:                          ['12.0000000', '12.0000000', '12.0000000', '12.0000000', '12.0000000', '1.2000000', '12.0000000', '1.2000000'],
				COST_FIXED_PORTION:            ['4.0000000', '4.0000000', '4.0000000', '4.0000000', '4.0000000', '0.4000000', '4.0000000', '0.4000000'],
				COST_VARIABLE_PORTION:         ['8.0000000', '8.0000000', '8.0000000', '8.0000000', '8.0000000', '0.8000000', '8.0000000', '0.8000000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COSTING_SHEET_ROW_ID", "COSTING_SHEET_OVERHEAD_ROW_ID", "ACCOUNT_ID"]);

			// Check that component split results have been saved to t_item_calculated_values_component_split table
			result = mockstar.execQuery("select * from {{resultComponentSplit}}");
			expect(result).toMatchData({
				ITEM_ID:                [      1,       1,       2,   3, 3],
				CALCULATION_VERSION_ID: [      1,       1,       1,   1, 1],
				COMPONENT_SPLIT_ID:     [     cs,      cs,      cs,  cs, cs],
				COST_COMPONENT_ID:      [    111,      -1,     111,  111, -1],
				ACCOUNT_ID:             ["#AC11",     "", "#AC11", "#AC11", ""],
				COST:                   ['27.0000000', '120.0000000', '12.0000000', '20.0000000', '160.0000000'],
				COST_FIXED_PORTION:     ['10.0000000', '57.0000000', '4.0000000', '8.0000000', '76.0000000'],
				COST_VARIABLE_PORTION:  ['17.0000000', '63.0000000', '8.0000000', '12.0000000', '84.0000000']			
			}, ["ITEM_ID", "CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID", "ACCOUNT_ID"]);

			// Check that referenced component split results (none in this case) are saved.
			// Calculation version 1 (=calcVersionId) does not contain any references. Thus, its cashed values must be removed.
			// Data for other calculation versions must be unchanged.
			result = mockstar.execQuery("select * from {{cachedComponentSplit}}");
			expect(result).toMatchData({
				MASTER_CALCULATION_VERSION_ID:     [      2,   2],
				REFERENCED_CALCULATION_VERSION_ID: [      4,   5],
				COMPONENT_SPLIT_ID:                [     cs,  cs],
				COST_COMPONENT_ID:                 [    111,  -1],
				ACCOUNT_ID:                        ["#AC11", "0"],
				COST_FIXED_PORTION:                [      '5.0000000',   '7.0000000'],
				COST_VARIABLE_PORTION:             [      '6.0000000',   '8.0000000']
			}, ["MASTER_CALCULATION_VERSION_ID", "REFERENCED_CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID", "ACCOUNT_ID"]);
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
		
		it('should calculate and save results also if TOTAL_QUANTITY is 0 for assembly items', function() {
			//arrange
			var oModifiedItemData = _.clone(oItemData);
			oModifiedItemData.TOTAL_QUANTITY = [0, 0, 0]; // TOTAL_QUANTIY 0 for assembly

			mockstar.insertTableData("item", oModifiedItemData);

			//act
			mockstar.call(calcVersionId, sessionId);

			//assert
			// Check that prices, other costs, and total costs have been saved to item_temporary table
			var result = mockstar.execQuery("select * from {{item}}");
			expect(result).toMatchData({
				SESSION_ID: [sessionId, sessionId, sessionId ],
				CALCULATION_VERSION_ID :                   [ 1,    1,  1],
				ITEM_ID:                                   [ 1,    2,  3],
				PRICE_FOR_TOTAL_QUANTITY:                  ['0.0000000', '0.0000000', '0.0000000'],
				PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION:    ['0.0000000', '0.0000000', '0.0000000'], 
				PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: ['0.0000000', '0.0000000', '0.0000000'],
				OTHER_COST:                                ['0.0000000', '0.0000000', '0.0000000'],	
				OTHER_COST_FIXED_PORTION:                  ['0.0000000', '0.0000000', '0.0000000'],	
				OTHER_COST_VARIABLE_PORTION:               ['0.0000000', '0.0000000', '0.0000000'],	
				TOTAL_COST:                                ['0.0000000', '0.0000000', '0.0000000'],	
				TOTAL_COST_FIXED_PORTION:                  ['0.0000000', '0.0000000', '0.0000000'],	
				TOTAL_COST_VARIABLE_PORTION:               ['0.0000000', '0.0000000', '0.0000000'],	
			}, ["SESSION_ID", "CALCULATION_VERSION_ID", "ITEM_ID"]);
		});
	}
	
	if (jasmine.plcTestRunParameters.generatedFields === true) {
		it('should calculate and save results to extension table', function() {
			//arrange
			var oItemTemporaryExtData =  {
				"SESSION_ID": [ sessionId, sessionId, sessionId ],
				"ITEM_ID" :                             [     1,       2,     3 ],
				"CALCULATION_VERSION_ID" :              [     1,       1,     1 ],
				"CUST_DECIMAL_WITHOUT_REF_MANUAL" :     [	 10,	  30,	  20],
				"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL" :  [	  1,	   1,	   1],
				"CUST_INT_FORMULA_CALCULATED": 			[   111, 	  111,	 111]
		};
			mockstar.insertTableData("item", oItemData);
			mockstar.insertTableData("item_temporary_ext", oItemTemporaryExtData);
			
			//act
			mockstar.call(calcVersionId, sessionId);

			//assert
			// Check that calculated custom fields have been saved to item_temporary_ext table
			var result = mockstar.execQuery("select * from {{item_temporary_ext}}");
			expect(result.columns.CUST_INT_FORMULA_CALCULATED.rows).toEqual([null, 60, null]);
		});
	}
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);