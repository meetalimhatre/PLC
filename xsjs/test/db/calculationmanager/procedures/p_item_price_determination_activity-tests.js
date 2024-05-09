var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;
var testData = require("../../../testdata/testdata").data;
var _ = require("lodash");

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('db.calculationmanager.procedures:p_item_price_determination_activity',function() {
		var oMockstarPlc = null;
		var sTestUser = $.session.getUsername();
		
		var sMasterdataTimestampDate = new Date().toJSON();
		var sExpectedDateWithoutTime = new Date(2015, 8, 20).toJSON(); //"2011-08-20";
		var sExpectedDate = new Date().toJSON();
		var sValuationDate = sExpectedDateWithoutTime;
		var sControllingArea = "#CA1";
		var sProject = "#P1";
		
		var oPriceSourceTestDataPlc ={
				"PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_ERP_PRICE","PLC_PROJECT_PRICE","PLC_PLANNED_PRICE","PLC_STANDARD_PRICE","PLC_MANUAL_PRICE","PLC_CALCULATED_PRICE"],
				"PRICE_SOURCE_TYPE_ID": [1,1,1,1,2,2,2,3,4],
				"CONFIDENCE_LEVEL_ID": [5,4,3,2,5,4,3,null,null],
				"DETERMINATION_SEQUENCE": [1,2,3,4,1,2,3,0,0],
				"CREATED_ON": [sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
				"CREATED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser, sTestUser],
				"LAST_MODIFIED_ON":[sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
				"LAST_MODIFIED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser]
	};

		var oPriceDeterminationStrategyPriceSource = {
				"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD" ],
				"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 2, 2, 2, 3, 4 ],
				"PRICE_SOURCE_ID" : [ "PLC_PROJECT_PRICE", "PLC_VENDOR_PRICE", "PLC_STANDARD_PRICE", "PLC_ERP_PRICE", "PLC_PROJECT_PRICE", "PLC_PLANNED_PRICE", "PLC_STANDARD_PRICE", "PLC_MANUAL_PRICE","PLC_CALCULATED_PRICE"],
				"PRICE_SOURCE_TYPE_ID" : [ 1, 1, 1, 1, 2, 2, 2, 3, 4 ],
				"DETERMINATION_SEQUENCE" : [ 1, 2, 3, 4, 1, 2, 3, 0, 0]
		};

		var oActivityPriceTestDataPlc = {
				"PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B"],
		        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE","PLC_PLANNED_PRICE","PLC_PLANNED_PRICE","PLC_PLANNED_PRICE","PLC_PLANNED_PRICE","PLC_STANDARD_PRICE"],
		        "CONTROLLING_AREA_ID": ['#CA1','#CA1','#CA1','#CA1',"#CA2","#CA1"],
		        "COST_CENTER_ID": ['#CC1','#CC1',"#CC1","#CC1","*","#CC1"],
		        "ACTIVITY_TYPE_ID": ["#AT2","#AT2","*","#AT2","*","#AT2"],
		        "PROJECT_ID": ["#P1","*","*","*","*","*"],
		        "CUSTOMER_ID": ["*","*","*","*","*","*"],
		        "VALID_FROM": ["2015-01-01","2015-01-01","2015-01-01","2018-01-01","2015-01-01","2015-01-01"],
		        "VALID_TO": ["2017-12-31","2017-12-31","2017-12-31","2019-12-31","2999-12-31","2999-12-31"],
		        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
		        "PRICE_FIXED_PORTION": ["65.5000000","65.5000000","65.5000000","65.0000000","100.0000000","65.0000000"],
		        "PRICE_VARIABLE_PORTION": ["100.0000000","90.0000000","95.0000000","55.0000000","120.0000000","120.0000000"],
		        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR","EUR","EUR"],
		        "PRICE_UNIT": ["1.0000000","1.0000000","1.0000000","30","1.0000000","1.0000000"],
				"PRICE_UNIT_UOM_ID": ["H","H","H","MIN","H","H"],
				"IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0, 0, 1],
		        "_VALID_FROM": ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
		        "_SOURCE": [1,1,1,1,1,1],
		        "_CREATED_BY": ["I055799","U0001","U0001","I055799","I055799","I055799"]
		};
		
	    if(jasmine.plcTestRunParameters.generatedFields === true){
		    var oActivityPriceExtTestDataPlc = {
				"PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B"],
		        "_VALID_FROM": ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
		        "CAPR_DECIMAL_MANUAL": ["20.0000000", "30.0000000", "35.0000000", "40.0000000", "45.0000000", "50.0000000"],
                "CAPR_DECIMAL_UNIT": ["EUR", "CAD", "RON", "EUR", "CAD", "RON"]
		    };
	    };
		
		var oCostCenterTestDataPlc = {
				"COST_CENTER_ID" : ['#CC1', 'CC2', 'CC3'],
				"CONTROLLING_AREA_ID" : ['#CA1', '#CA1', '#CA1'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null, null, null],
				"_SOURCE" : [1, 1, 1],
				"_CREATED_BY" :['U000001', 'U000002', 'U000001']
		};
			
		var oActivityTypeTestDataPlc = {
				"ACTIVITY_TYPE_ID" :['#AT2', 'A2', 'A3','A4'],
				"CONTROLLING_AREA_ID" : ['#CA1', '1000', '1000','#CA1'],
				"ACCOUNT_ID" : ['CE1', 'CE2', 'CE1','11000'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
		        "_VALID_TO" : [null, null, '2015-04-30T15:39:09.691Z', null],
				"_SOURCE" : [1, 1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000002', 'U000001','U000001']
		};
		const oVersionInput = {
				MASTER_DATA_TIMESTAMP: [sMasterdataTimestampDate],
				VALUATION_DATE: [sValuationDate],
				REPORT_CURRENCY_ID: ["EUR"],
				CONTROLLING_AREA_ID: [sControllingArea],
				PROJECT_ID: [sProject],
				CUSTOMER_ID: [null],
				MATERIAL_PRICE_STRATEGY_ID: ["PLC_STANDARD"],
				ACTIVITY_PRICE_STRATEGY_ID: ["PLC_STANDARD"]
		}

		var oItemInput = {
				"ITEM_ID" : 		[ 3001, 3002, 3003, 3004, 5001, 5002, 5003 ],
				"PARENT_ITEM_ID" :  [ null, 3001, 3002, 3002,null, 5001, 5001 ],
				"ITEM_CATEGORY_ID": [ 0, 1, 3, 2, 0, 2, 2 ],
				"MATERIAL_ID" :		[ "", "", "", "#100-110", "", "#100-110","MAT4" ],
				"VENDOR_ID":		[null,null,null,null,null, null, null],
				"PLANT_ID" : 		[ "", "", "", "", "", "", "" ],
				"ACTIVITY_TYPE_ID": [ "#AT2", "", "", "", "", "", "" ],
				"COST_CENTER_ID" :  [ "#CC1", "", "", "", "", "", "" ],
				"PRICE_SOURCE_ID":  ["","","","","", "",""],
				"PRICE_FIXED_PORTION":			["0.0000000","2772.360000","2246.880000","900.0000000","0.0000000","2590.960000","120.5000000"],
				"PRICE_VARIABLE_PORTION":		["0.0000000","0.0000000","415.660000","231.0000000","0.0000000","371.1100000", "100.4500000"],
				"TRANSACTION_CURRENCY_ID":["EUR","EUR","EUR","EUR","EUR","EUR","EUR"],
				"PRICE_UNIT":					["0.0000000","100.0000000","100.0000000","100.0000000","0.0000000","100.0000000","10.0000000"],
				"PRICE_UNIT_UOM_ID": 			["H","H","H","H","H","H","H"],
				"IS_DISABLING_PRICE_DETERMINATION":[null,null,null,null,null, null, null],
				"PURCHASING_GROUP" : 			[ null, null, null, null, null, null, null],
				"PURCHASING_DOCUMENT" : 		[ null, null, null, null, null, null, null],
				"LOCAL_CONTENT" : 				[ null, null, null, null, null, null, null],
				"PRICE_SOURCE_TYPE_ID":[null,null,null,null,null, null, null],
				"CONFIDENCE_LEVEL_ID":[null,null,null,null,null, null,null]
		};

		var oPriceDeterminationStrategyTestData = {
				"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_TEST_ST_MAT", "PLC_TEST_ST_ACT",],
				"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 2, 1, 2],
				"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
				"CREATED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser ],
				"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
				"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser ]
		};

		var oPriceComponentDataPlc = {
			"PRICE_ID":[ '290000E0B2BDB9671600A4000936462B', '2B0000E0B2BDB9671600A4000936462B',  '2E0000E0B2BDB9671600A4000936462B'],
			"_VALID_FROM":["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
			"ACCOUNT_ID":["11000","21000","625000"],
			"PRICE_FIXED":[ "2.0000000", "3.0000000", "4.0000000"],
			"PRICE_VARIABLE":[ "14.0000000", "3.0000000", "7.0000000"],
			"CONTROLLING_AREA_ID":['1000', '1000', '#CA1']
		};
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
		    oItemInput = _.extend(oItemInput, {
			    "ITEM_ID": [oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[1], oItemInput.ITEM_ID[2], oItemInput.ITEM_ID[3], oItemInput.ITEM_ID[4], oItemInput.ITEM_ID[5], oItemInput.ITEM_ID[6]],
			    "CMPR_BOOLEAN_INT_MANUAL": [0, 0, null, null, 0, 0, 0],
			    "CMPR_BOOLEAN_INT_UNIT": [null, null, null, null, null, null, null],
			    "CMPR_DECIMAL_MANUAL": ["111.4500000","222.2500000", null, null, "322.2500000", null, null],
			    "CMPR_DECIMAL_UNIT": [null, null, null, null, null, null, null],
			    "CMPR_DECIMAL_WITH_UOM_MANUAL": ["444.5600000","555.5500000", null, null, null, null, null],
			    "CMPR_DECIMAL_WITH_UOM_UNIT": ["USD","USD", null, null, null, null, null],
			    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["60.0000000","60.0000000", null, null, null, null, null],
			    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["Min","Min", null, null, null, null, null],
			    "CAPR_DECIMAL_MANUAL": ["10.0000000", "20.0000000", "30.0000000", "40.0000000", "50.0000000", null, null],
			    "CAPR_DECIMAL_UNIT": ["EUR", "EUR", "USD", "RON", "USD", null, null],
		    });
	    }
		
		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.calculationmanager.procedures/p_item_price_determination_activity", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{
							activity_price:{
								name: Resources["Activity_Price"].dbobjects.plcTable,
								data:  oActivityPriceTestDataPlc
							},
							price_source:{
								name: Resources["Price_Source"].dbobjects.plcTable,
								data: oPriceSourceTestDataPlc
							},
							activity_type:{
								name: Resources["Activity_Type"].dbobjects.plcTable,
								data: oActivityTypeTestDataPlc
							},
							cost_center:{
								name: Resources["Cost_Center"].dbobjects.plcTable,
								data:  oCostCenterTestDataPlc
							},
							price_determination_strategy: {
								name: "sap.plc.db::basis.t_price_determination_strategy",
								data: oPriceDeterminationStrategyTestData
							},
							price_determination_strategy_price_source: {
								name: "sap.plc.db::basis.t_price_determination_strategy_price_source",
								data: oPriceDeterminationStrategyPriceSource
							},
							price_determination_strategy_rule: {
								name:"sap.plc.db::basis.t_price_determination_strategy_rule",
								data: testData.oPriceDeterminationStrategyRuleDefault
							},
							price_components : {
								name: "sap.plc.db::basis.t_price_component",
								data: oPriceComponentDataPlc
							},
							activity_price_ext: Resources["Activity_Price"].dbobjects.plcExtensionTable
						}
					}
			);

		});
		
		beforeEach(function() {
			oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
			oMockstarPlc.initializeData();
			if (jasmine.plcTestRunParameters.generatedFields === true) {
			    oMockstarPlc.insertTableData("activity_price_ext", oActivityPriceExtTestDataPlc);
			}
		});
		
		it('should determine prices for several items of type internal activity', function() {
			var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0),
			                      mockstar_helpers.convertToObject(oItemInput, 1),
			                      mockstar_helpers.convertToObject(oItemInput, 2)];
			const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(lt_items_input, lt_version_input);
					
			//assert
			var oEntity = Array.slice(result.OT_ALL_PRICES);
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_SOURCE_ID":      [oActivityPriceTestDataPlc.PRICE_SOURCE_ID[0],oActivityPriceTestDataPlc.PRICE_SOURCE_ID[2],oActivityPriceTestDataPlc.PRICE_SOURCE_ID[5]],
				"CONTROLLING_AREA_ID":  [oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[0],oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[2],oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[5]],
				"COST_CENTER_ID":       [oActivityPriceTestDataPlc.COST_CENTER_ID[0],oActivityPriceTestDataPlc.COST_CENTER_ID[2],oActivityPriceTestDataPlc.COST_CENTER_ID[5]],
				"ACTIVITY_TYPE_ID":     [oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[0],oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[2],oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[5]],
				"PROJECT_ID": 			[oActivityPriceTestDataPlc.PROJECT_ID[0],oActivityPriceTestDataPlc.PROJECT_ID[2],oActivityPriceTestDataPlc.PROJECT_ID[5]],
				"VALID_FROM":		    [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[0])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[2])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[5]))],
				"VALID_TO": 		    [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[0])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[2])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[5]))],
				"VALID_FROM_QUANTITY":  [oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[0],oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[2],oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[5]],
				"VALID_TO_QUANTITY":   	 [null,null,null],
				"PRICE_FIXED_PORTION": 	[oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[0],oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[2],oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[5]],
				"PRICE_VARIABLE_PORTION":[oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[0],oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[5]],
				"TRANSACTION_CURRENCY_ID":[oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[0],oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2],oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[5]],
				"PRICE_UNIT":			[oActivityPriceTestDataPlc.PRICE_UNIT[0],oActivityPriceTestDataPlc.PRICE_UNIT[2],oActivityPriceTestDataPlc.PRICE_UNIT[5]],
				"PRICE_UNIT_UOM_ID":	[oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[0],oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[2],oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[5]],
				"_VALID_FROM":          [new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[0])),new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[2])),new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[5]))],
				"_VALID_TO":  			[null,null,null],
				"_SOURCE":    			[oActivityPriceTestDataPlc._SOURCE[0],oActivityPriceTestDataPlc._SOURCE[2],oActivityPriceTestDataPlc._SOURCE[5]],
				"CONFIDENCE_LEVEL_ID":  [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[4],oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[5],oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[6]],
				"DETERMINATION_SEQUENCE":[oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[4],oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[5],oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[6]],
				"PRICE_SOURCE_TYPE_ID":    [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[4],oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[5],oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[6]]
	
			}, ["ITEM_ID","CONTROLLING_AREA_ID","COST_CENTER_ID","ACTIVITY_TYPE_ID","PROJECT_ID","VALID_FROM_QUANTITY" ]);
			
			if (jasmine.plcTestRunParameters.generatedFields === true) {
			    	expect(oEntity).toMatchData({
				        "ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
        				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
        				"PRICE_SOURCE_ID":      [oActivityPriceTestDataPlc.PRICE_SOURCE_ID[0],oActivityPriceTestDataPlc.PRICE_SOURCE_ID[2],oActivityPriceTestDataPlc.PRICE_SOURCE_ID[5]],
        				"CONTROLLING_AREA_ID":  [oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[0],oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[2],oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[5]],
        				"COST_CENTER_ID":       [oActivityPriceTestDataPlc.COST_CENTER_ID[0],oActivityPriceTestDataPlc.COST_CENTER_ID[2],oActivityPriceTestDataPlc.COST_CENTER_ID[5]],
        				"ACTIVITY_TYPE_ID":     [oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[0],oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[2],oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[5]],
        				"PROJECT_ID": 			[oActivityPriceTestDataPlc.PROJECT_ID[0],oActivityPriceTestDataPlc.PROJECT_ID[2],oActivityPriceTestDataPlc.PROJECT_ID[5]],
        				"VALID_FROM":		    [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[0])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[2])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[5]))],
        				"VALID_TO": 		    [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[0])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[2])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[5]))],
        				"VALID_FROM_QUANTITY":  [oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[0],oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[2],oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[5]],
        				"VALID_TO_QUANTITY":   	 [null,null,null],
        				"PRICE_FIXED_PORTION": 	[oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[0],oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[2],oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[5]],
        				"PRICE_VARIABLE_PORTION":[oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[0],oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[5]],
        				"TRANSACTION_CURRENCY_ID":[oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[0],oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2],oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[5]],
        				"PRICE_UNIT":			[oActivityPriceTestDataPlc.PRICE_UNIT[0],oActivityPriceTestDataPlc.PRICE_UNIT[2],oActivityPriceTestDataPlc.PRICE_UNIT[5]],
        				"PRICE_UNIT_UOM_ID":	[oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[0],oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[2],oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[5]],
        				"_VALID_FROM":          [new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[0])),new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[2])),new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[5]))],
        				"_VALID_TO":  			[null,null,null],
        				"_SOURCE":    			[oActivityPriceTestDataPlc._SOURCE[0],oActivityPriceTestDataPlc._SOURCE[2],oActivityPriceTestDataPlc._SOURCE[5]],
        				"CONFIDENCE_LEVEL_ID":  [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[4],oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[5],oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[6]],
        				"DETERMINATION_SEQUENCE":[oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[4],oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[5],oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[6]],
        				"PRICE_SOURCE_TYPE_ID":    [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[4],oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[5],oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[6]],
        				"CAPR_DECIMAL_MANUAL": [oActivityPriceExtTestDataPlc.CAPR_DECIMAL_MANUAL[0], oActivityPriceExtTestDataPlc.CAPR_DECIMAL_MANUAL[2], oActivityPriceExtTestDataPlc.CAPR_DECIMAL_MANUAL[5]],
        			    "CAPR_DECIMAL_UNIT": [oActivityPriceExtTestDataPlc.CAPR_DECIMAL_UNIT[0], oActivityPriceExtTestDataPlc.CAPR_DECIMAL_UNIT[2], oActivityPriceExtTestDataPlc.CAPR_DECIMAL_UNIT[5]]
			    	}, ["ITEM_ID","CONTROLLING_AREA_ID","COST_CENTER_ID","ACTIVITY_TYPE_ID","PROJECT_ID","VALID_FROM_QUANTITY" ]);
			}
		});

		it('should receive IS_PRICE_SPLIT_ACTIVE with the value 0 if the material does not have a price component for the controlling area of the version', function() {
			var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0),
			                      mockstar_helpers.convertToObject(oItemInput, 1),
			                      mockstar_helpers.convertToObject(oItemInput, 2)];
			const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(lt_items_input, lt_version_input);
					
			//assert
			var oEntity = Array.slice(result.OT_ALL_PRICES);
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_SOURCE_ID":      [oActivityPriceTestDataPlc.PRICE_SOURCE_ID[0],oActivityPriceTestDataPlc.PRICE_SOURCE_ID[2],oActivityPriceTestDataPlc.PRICE_SOURCE_ID[5]],
				"CONTROLLING_AREA_ID":  [oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[0],oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[2],oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[5]],
				"COST_CENTER_ID":       [oActivityPriceTestDataPlc.COST_CENTER_ID[0],oActivityPriceTestDataPlc.COST_CENTER_ID[2],oActivityPriceTestDataPlc.COST_CENTER_ID[5]],
				"ACTIVITY_TYPE_ID":     [oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[0],oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[2],oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[5]],
				"PROJECT_ID": 			[oActivityPriceTestDataPlc.PROJECT_ID[0],oActivityPriceTestDataPlc.PROJECT_ID[2],oActivityPriceTestDataPlc.PROJECT_ID[5]],
				"VALID_FROM":		    [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[0])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[2])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[5]))],
				"VALID_TO": 		    [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[0])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[2])),new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[5]))],
				"VALID_FROM_QUANTITY":  [oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[0],oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[2],oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[5]],
				"VALID_TO_QUANTITY":   	 [null,null,null],
				"PRICE_FIXED_PORTION": 	[oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[0],oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[2],oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[5]],
				"PRICE_VARIABLE_PORTION":[oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[0],oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[5]],
				"TRANSACTION_CURRENCY_ID":[oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[0],oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2],oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[5]],
				"PRICE_UNIT":			[oActivityPriceTestDataPlc.PRICE_UNIT[0],oActivityPriceTestDataPlc.PRICE_UNIT[2],oActivityPriceTestDataPlc.PRICE_UNIT[5]],
				"PRICE_UNIT_UOM_ID":	[oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[0],oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[2],oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[5]],
				"IS_PRICE_SPLIT_ACTIVE": [oActivityPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[1], oActivityPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[1], oActivityPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[5]], //The first two prices don`t have a valid price component for the controlling area
				"_VALID_FROM":          [new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[0])),new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[2])),new Date(Date.parse(oActivityPriceTestDataPlc._VALID_FROM[5]))],
				"_VALID_TO":  			[null,null,null],
				"_SOURCE":    			[oActivityPriceTestDataPlc._SOURCE[0],oActivityPriceTestDataPlc._SOURCE[2],oActivityPriceTestDataPlc._SOURCE[5]],
				"CONFIDENCE_LEVEL_ID":  [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[4],oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[5],oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[6]],
				"DETERMINATION_SEQUENCE":[oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[4],oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[5],oPriceSourceTestDataPlc.DETERMINATION_SEQUENCE[6]],
				"PRICE_SOURCE_TYPE_ID":    [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[4],oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[5],oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[6]]
	
			}, ["ITEM_ID","CONTROLLING_AREA_ID","COST_CENTER_ID","ACTIVITY_TYPE_ID","PROJECT_ID","VALID_FROM_QUANTITY" ]);
		});

		const parametersSortActivityPrices = [
			{description: "should sort by controlling area first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultCA], result: {
					"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
					"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
					"PRICE_ID": 			[testData.oActivityPriceTestDataPlcDefaultCA.PRICE_ID[0], testData.oActivityPriceTestDataPlcDefaultCA.PRICE_ID[1], testData.oActivityPriceTestDataPlcDefaultCA.PRICE_ID[2]],
					"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcDefaultCA.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcDefaultCA.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcDefaultCA.CONTROLLING_AREA_ID[2]],
					"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcDefaultCA.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcDefaultCA.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcDefaultCA.COST_CENTER_ID[2]],
					"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcDefaultCA.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcDefaultCA.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcDefaultCA.ACTIVITY_TYPE_ID[2]],
					"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcDefaultCA.PROJECT_ID[0],testData.oActivityPriceTestDataPlcDefaultCA.PROJECT_ID[1],testData.oActivityPriceTestDataPlcDefaultCA.PROJECT_ID[2]],
					"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcDefaultCA.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcDefaultCA.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcDefaultCA.PRICE_FIXED_PORTION[2]],
					"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcDefaultCA.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcDefaultCA.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcDefaultCA.PRICE_VARIABLE_PORTION[2]],
					"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcDefaultCA.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcDefaultCA.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcDefaultCA.TRANSACTION_CURRENCY_ID[2]],
					"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcDefaultCA.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcDefaultCA.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcDefaultCA.PRICE_UNIT[2]]
			}},
			{description: "should sort by newest first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultNew], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcDefaultNew.PRICE_ID[1], testData.oActivityPriceTestDataPlcDefaultNew.PRICE_ID[2], testData.oActivityPriceTestDataPlcDefaultNew.PRICE_ID[0]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcDefaultNew.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcDefaultNew.CONTROLLING_AREA_ID[2],testData.oActivityPriceTestDataPlcDefaultNew.CONTROLLING_AREA_ID[0]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcDefaultNew.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcDefaultNew.COST_CENTER_ID[2],testData.oActivityPriceTestDataPlcDefaultNew.COST_CENTER_ID[0]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcDefaultNew.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcDefaultNew.ACTIVITY_TYPE_ID[2],testData.oActivityPriceTestDataPlcDefaultNew.ACTIVITY_TYPE_ID[0]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcDefaultNew.PROJECT_ID[1],testData.oActivityPriceTestDataPlcDefaultNew.PROJECT_ID[2],testData.oActivityPriceTestDataPlcDefaultNew.PROJECT_ID[0]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcDefaultNew.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcDefaultNew.PRICE_FIXED_PORTION[2],testData.oActivityPriceTestDataPlcDefaultNew.PRICE_FIXED_PORTION[0]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcDefaultNew.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcDefaultNew.PRICE_VARIABLE_PORTION[2],testData.oActivityPriceTestDataPlcDefaultNew.PRICE_VARIABLE_PORTION[0]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcDefaultNew.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcDefaultNew.TRANSACTION_CURRENCY_ID[2],testData.oActivityPriceTestDataPlcDefaultNew.TRANSACTION_CURRENCY_ID[0]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcDefaultNew.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcDefaultNew.PRICE_UNIT[2],testData.oActivityPriceTestDataPlcDefaultNew.PRICE_UNIT[0]]
			}},
			{description: "should sort by cost center first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultCC], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcDefaultCC.PRICE_ID[1], testData.oActivityPriceTestDataPlcDefaultCC.PRICE_ID[0], testData.oActivityPriceTestDataPlcDefaultCC.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcDefaultCC.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcDefaultCC.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcDefaultCC.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcDefaultCC.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcDefaultCC.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcDefaultCC.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcDefaultCC.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcDefaultCC.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcDefaultCC.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcDefaultCC.PROJECT_ID[1],testData.oActivityPriceTestDataPlcDefaultCC.PROJECT_ID[0],testData.oActivityPriceTestDataPlcDefaultCC.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcDefaultCC.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcDefaultCC.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcDefaultCC.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcDefaultCC.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcDefaultCC.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcDefaultCC.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcDefaultCC.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcDefaultCC.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcDefaultCC.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcDefaultCC.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcDefaultCC.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcDefaultCC.PRICE_UNIT[2]]
			}},
			{description: "should sort by activity type first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultAT], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcDefaultAT.PRICE_ID[0], testData.oActivityPriceTestDataPlcDefaultAT.PRICE_ID[2], testData.oActivityPriceTestDataPlcDefaultAT.PRICE_ID[1]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcDefaultAT.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcDefaultAT.CONTROLLING_AREA_ID[2],testData.oActivityPriceTestDataPlcDefaultAT.CONTROLLING_AREA_ID[1]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcDefaultAT.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcDefaultAT.COST_CENTER_ID[2],testData.oActivityPriceTestDataPlcDefaultAT.COST_CENTER_ID[1]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcDefaultAT.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcDefaultAT.ACTIVITY_TYPE_ID[2],testData.oActivityPriceTestDataPlcDefaultAT.ACTIVITY_TYPE_ID[1]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcDefaultAT.PROJECT_ID[0],testData.oActivityPriceTestDataPlcDefaultAT.PROJECT_ID[2],testData.oActivityPriceTestDataPlcDefaultAT.PROJECT_ID[1]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcDefaultAT.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcDefaultAT.PRICE_FIXED_PORTION[2],testData.oActivityPriceTestDataPlcDefaultAT.PRICE_FIXED_PORTION[1]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcDefaultAT.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcDefaultAT.PRICE_VARIABLE_PORTION[2],testData.oActivityPriceTestDataPlcDefaultAT.PRICE_VARIABLE_PORTION[1]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcDefaultAT.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcDefaultAT.TRANSACTION_CURRENCY_ID[2],testData.oActivityPriceTestDataPlcDefaultAT.TRANSACTION_CURRENCY_ID[1]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcDefaultAT.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcDefaultAT.PRICE_UNIT[2],testData.oActivityPriceTestDataPlcDefaultAT.PRICE_UNIT[1]]
			}},
			{description: "should sort by project first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultProject], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcDefaultProject.PRICE_ID[2], testData.oActivityPriceTestDataPlcDefaultProject.PRICE_ID[1], testData.oActivityPriceTestDataPlcDefaultProject.PRICE_ID[0]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcDefaultProject.CONTROLLING_AREA_ID[2],testData.oActivityPriceTestDataPlcDefaultProject.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcDefaultProject.CONTROLLING_AREA_ID[0]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcDefaultProject.COST_CENTER_ID[2],testData.oActivityPriceTestDataPlcDefaultProject.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcDefaultProject.COST_CENTER_ID[0]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcDefaultProject.ACTIVITY_TYPE_ID[2],testData.oActivityPriceTestDataPlcDefaultProject.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcDefaultProject.ACTIVITY_TYPE_ID[0]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcDefaultProject.PROJECT_ID[2],testData.oActivityPriceTestDataPlcDefaultProject.PROJECT_ID[1],testData.oActivityPriceTestDataPlcDefaultProject.PROJECT_ID[0]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcDefaultProject.PRICE_FIXED_PORTION[2],testData.oActivityPriceTestDataPlcDefaultProject.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcDefaultProject.PRICE_FIXED_PORTION[0]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcDefaultProject.PRICE_VARIABLE_PORTION[2],testData.oActivityPriceTestDataPlcDefaultProject.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcDefaultProject.PRICE_VARIABLE_PORTION[0]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcDefaultProject.TRANSACTION_CURRENCY_ID[2],testData.oActivityPriceTestDataPlcDefaultProject.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcDefaultProject.TRANSACTION_CURRENCY_ID[0]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcDefaultProject.PRICE_UNIT[2],testData.oActivityPriceTestDataPlcDefaultProject.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcDefaultProject.PRICE_UNIT[0]]
			}},
			{description: "should sort by customer first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultCustomer], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_ID[0], testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_ID[1]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcDefaultCustomer.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcDefaultCustomer.CONTROLLING_AREA_ID[1]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcDefaultCustomer.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcDefaultCustomer.COST_CENTER_ID[1]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcDefaultCustomer.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcDefaultCustomer.ACTIVITY_TYPE_ID[1]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcDefaultCustomer.PROJECT_ID[0],testData.oActivityPriceTestDataPlcDefaultCustomer.PROJECT_ID[1]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_FIXED_PORTION[1]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_VARIABLE_PORTION[1]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcDefaultCustomer.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcDefaultCustomer.TRANSACTION_CURRENCY_ID[1]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_UNIT[1]]
			}},
			{description: "should match on controlling area (activity type second)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATSecond], inputPrices: [testData.oActivityPriceTestDataPlcATSecondMatchCA], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_ID[1], testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSecondMatchCA.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchCA.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchCA.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSecondMatchCA.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchCA.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchCA.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSecondMatchCA.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchCA.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchCA.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSecondMatchCA.PROJECT_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchCA.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchCA.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSecondMatchCA.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchCA.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchCA.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSecondMatchCA.PRICE_UNIT[2]]
			}},
			{description: "should match on activity type (activity type second)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATSecond], inputPrices: [testData.oActivityPriceTestDataPlcATSecondMatchAT], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_ID[1], testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSecondMatchAT.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchAT.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchAT.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSecondMatchAT.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchAT.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchAT.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSecondMatchAT.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchAT.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchAT.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSecondMatchAT.PROJECT_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchAT.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchAT.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSecondMatchAT.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcATSecondMatchAT.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSecondMatchAT.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_UNIT[2]]
			}},
			{description: "should not match on AT, CA (activity type second)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATSecond], inputPrices: [testData.oActivityPriceTestDataPlcATSecondNoMatch], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_ID[1], testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSecondNoMatch.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSecondNoMatch.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcATSecondNoMatch.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSecondNoMatch.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSecondNoMatch.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcATSecondNoMatch.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSecondNoMatch.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSecondNoMatch.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcATSecondNoMatch.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSecondNoMatch.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSecondNoMatch.PROJECT_ID[1],testData.oActivityPriceTestDataPlcATSecondNoMatch.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSecondNoMatch.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSecondNoMatch.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcATSecondNoMatch.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_UNIT[2]]
			}},
			{description: "should match on activity type (activity type first)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirst], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstMatchAT], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_ID[1], testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSFirstMatchAT.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchAT.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchAT.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSFirstMatchAT.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchAT.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchAT.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSFirstMatchAT.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchAT.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchAT.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSFirstMatchAT.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchAT.PROJECT_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchAT.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSFirstMatchAT.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchAT.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchAT.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_UNIT[2]]
			}},
			{description: "should match on controlling area (activity type first)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirst], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstMatchCA], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_ID[1], testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSFirstMatchCA.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchCA.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchCA.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSFirstMatchCA.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchCA.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchCA.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSFirstMatchCA.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchCA.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchCA.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSFirstMatchCA.PROJECT_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchCA.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchCA.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSFirstMatchCA.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcATSFirstMatchCA.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSFirstMatchCA.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_UNIT[2]]
			}},
			{description: "should not match on AT, CA (activity type first)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirst], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstNoMatch], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_ID[2], testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_ID[1]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSFirstNoMatch.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSFirstNoMatch.CONTROLLING_AREA_ID[2],testData.oActivityPriceTestDataPlcATSFirstNoMatch.CONTROLLING_AREA_ID[1]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSFirstNoMatch.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSFirstNoMatch.COST_CENTER_ID[2],testData.oActivityPriceTestDataPlcATSFirstNoMatch.COST_CENTER_ID[1]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSFirstNoMatch.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSFirstNoMatch.ACTIVITY_TYPE_ID[2],testData.oActivityPriceTestDataPlcATSFirstNoMatch.ACTIVITY_TYPE_ID[1]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSFirstNoMatch.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSFirstNoMatch.PROJECT_ID[2],testData.oActivityPriceTestDataPlcATSFirstNoMatch.PROJECT_ID[1]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_FIXED_PORTION[2],testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_FIXED_PORTION[1]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_VARIABLE_PORTION[2],testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_VARIABLE_PORTION[1]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSFirstNoMatch.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSFirstNoMatch.TRANSACTION_CURRENCY_ID[2],testData.oActivityPriceTestDataPlcATSFirstNoMatch.TRANSACTION_CURRENCY_ID[1]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_UNIT[2],testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_UNIT[1]]
			}},
			{description: "should match on activity type (activity type first, new second)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirstNewSec], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_ID[1], testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PROJECT_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_UNIT[2]]
			}},
			{description: "should match on new (activity type first, new second)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirstNewSec], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_ID[1], testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PROJECT_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_UNIT[2]]
			}},
			{description: "should not match on AT, new (activity type first, new second)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirstNewSec], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch], result: {
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0],oItemInput.ITEM_ID[0]],
				"IS_DISABLING_PRICE_DETERMINATION":[oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
				"PRICE_ID": 			[testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_ID[0], testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_ID[1], testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_ID[2]],
				"CONTROLLING_AREA_ID":  [testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.CONTROLLING_AREA_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.CONTROLLING_AREA_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.CONTROLLING_AREA_ID[2]],
				"COST_CENTER_ID":       [testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.COST_CENTER_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.COST_CENTER_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.COST_CENTER_ID[2]],
				"ACTIVITY_TYPE_ID":     [testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.ACTIVITY_TYPE_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.ACTIVITY_TYPE_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.ACTIVITY_TYPE_ID[2]],
				"PROJECT_ID": 			[testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PROJECT_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PROJECT_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PROJECT_ID[2]],
				"PRICE_FIXED_PORTION": 	[testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_FIXED_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_FIXED_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_FIXED_PORTION[2]],
				"PRICE_VARIABLE_PORTION":[testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_VARIABLE_PORTION[0],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_VARIABLE_PORTION[1],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_VARIABLE_PORTION[2]],
				"TRANSACTION_CURRENCY_ID":[testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.TRANSACTION_CURRENCY_ID[0],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.TRANSACTION_CURRENCY_ID[1],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.TRANSACTION_CURRENCY_ID[2]],
				"PRICE_UNIT":			[testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_UNIT[0],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_UNIT[1],testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_UNIT[2]]
			}},

		];

		parametersSortActivityPrices.forEach((p) => {
			it(p.description, function() {
				oMockstarPlc.clearTable('price_determination_strategy_rule');
				oMockstarPlc.insertTableData('price_determination_strategy_rule', p.inputStrategy);

				oMockstarPlc.clearTable('activity_price');
				oMockstarPlc.insertTableData('activity_price', p.inputPrices);

				var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0)];

				oVersionInput.CUSTOMER_ID[0] = "#CU1";

				const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
				
				var procedure = oMockstarPlc.loadProcedure();
				var result = procedure(lt_items_input, lt_version_input);

				var oEntity = Array.slice(result.OT_ALL_PRICES);
				expect(oEntity).toMatchData(p.result, ["ITEM_ID", "IS_DISABLING_PRICE_DETERMINATION", "PRICE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID", "PROJECT_ID", "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID", "PRICE_UNIT"]);
			})
		})

	}).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}