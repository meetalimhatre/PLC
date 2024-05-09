var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../../testdata/testdata").data;
var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");

describe('db.calculationmanager.procedures:p_item_price_determination_material-tests', function(){
	var oMockstarPlc = null;
	var sMasterdataTimestampDate = new Date().toJSON();
	var sExpectedDateWithoutTime = new Date(2011, 8, 20).toJSON(); //"2011-08-20";
	var sValuationDate = sExpectedDateWithoutTime;
	var sControllingArea = '1000';
	var sProject = 'PR1';
	var sUseMultiplePlants = '';
	var oItemInput = {
			"ITEM_ID":          [3001,3002,3003,3004, 3005, 3006],
			"PARENT_ITEM_ID":   [1337,1337,1337,1337, 1337, 1337],
			"ITEM_CATEGORY_ID": [1,2,3,4,1, 2],
			"MATERIAL_ID":      ["MAT1","MAT1","MAT3","MATE1","MAT1", "MAT1"],
			"VENDOR_ID":        ["","","","","", "V1"],
			"PLANT_ID": 		["PL1","PL1","","PLE1","", "PL1"],
			"ACTIVITY_TYPE_ID": ["A2","*","A2","*","*", "*"],
			"COST_CENTER_ID": 	["CC2","CC2","*","CC2","CC2", "CC2"],
			"PRICE_SOURCE_ID": 	["101","102","103","101","101", "102"],
			"PRICE_SOURCE_TYPE_ID": 	[1,1,1,1,1, 1],
			"CONFIDENCE_LEVEL_ID": 	[null,null,null,null,null, null],
			"PRICE_FIXED_PORTION": 			 ["5000.0000000","200.0000000","480.4500000","500.0000000","600.0000000", "600.0000000"],
			"PRICE_VARIABLE_PORTION": 		 ["0.0000000","20.0000000","35.4500000","0.0000000","500.0000000", "500.0000000"],	
			"TRANSACTION_CURRENCY_ID": ['EUR','EUR','EUR','EUR','EUR', 'EUR'],
			"PRICE_UNIT": 					 ["0.0000000","10.0000000","100.0000000","0.0000000","1.0000000", "1.0000000"],
			"PRICE_UNIT_UOM_ID": 			 ['H','H','H','H','H', 'H'],
			"IS_DISABLING_PRICE_DETERMINATION": [0,0,null,0,0, 0],
			"PURCHASING_GROUP":          	 ["","","","","", ""],
			"PURCHASING_DOCUMENT":			 ["","","","","", ""],
			"LOCAL_CONTENT":				 ["0.0000000","0.0000000","0.0000000","0.0000000","0.0000000", "0.0000000"]
	}

	if(jasmine.plcTestRunParameters.generatedFields === true){
		oItemInput = _.extend(oItemInput, {
			"ITEM_ID": [oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[1], oItemInput.ITEM_ID[2], oItemInput.ITEM_ID[3], oItemInput.ITEM_ID[4], oItemInput.ITEM_ID[5]],
			"CMPR_BOOLEAN_INT_MANUAL": [0, 0, null, null, 0, null],
			"CMPR_BOOLEAN_INT_UNIT": [null, null, null, null, null, null],
			"CMPR_DECIMAL_MANUAL": ["111.4500000","222.2500000", null, null, "322.2500000", null],
			"CMPR_DECIMAL_UNIT": [null, null, null, null, null, null],
			"CMPR_DECIMAL_WITH_UOM_MANUAL": ["444.5600000","555.5500000", null, null, null, null],
			"CMPR_DECIMAL_WITH_UOM_UNIT": ["USD","USD", null, null, null, null],
			"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["60.0000000","60.0000000", null, null, null, null],
			"CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["Min","Min", null, null, null, null], 
			"CAPR_DECIMAL_MANUAL": ["50.0000000", "60.0000000", "70.0000000", "80.0000000", "90.0000000", null],
			"CAPR_DECIMAL_UNIT": ["USD", "USD", "USD", "USD", "USD", null]
		});
	}

	var oVendorTestDataStrategies = {
		"VENDOR_ID" : ['VD1', 'VD2', 'VD3'],
		"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
		"_VALID_TO" : [null, null, null],
		"_SOURCE" : [1, 1, 1],
		"_CREATED_BY" : ['U000001', 'U000002', 'U000001']
	};

	var oMaterialPriceTestDataPlc = {
			"PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["101","201","101","101", "102"],
			"MATERIAL_ID": ["MAT1","MATEN","MAT1","MAT1", "MAT1"],
			"PLANT_ID": ["PL1","*","*","PL3", "PL1"],
			"VENDOR_ID": ["*","*","*","*", "V1"],
			"PROJECT_ID": ["*", "*", "*", "*", "*"],
			"CUSTOMER_ID": ["*", "*", "*", "*", "*"],
			"VALID_FROM": ["2015-06-19","2010-01-01","2010-01-01","2010-01-01", "2010-01-01"],
			"VALID_TO": ["2999-12-31","2019-12-31","2999-12-31","2017-12-31", "2999-12-31"],
			"VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000", "1.0000000"],
			"PRICE_FIXED_PORTION": ["123.4500000","123.8800000","121.2500000","121.2500000", "121.2500000"],
			"PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000", "234.9900000"],
			"TRANSACTION_CURRENCY_ID": ["TST","EUR","EUR","EUR", "EUR"],
			"PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000", "2.0000000"],
			"PRICE_UNIT_UOM_ID": ["TST","H","H","H", "H"],
			"IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0, 0],
			"_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z", "2015-06-19T12:27:23.197Z"],
			"_SOURCE": [1,2,1,1, 1],
			"_CREATED_BY": ["I305774","U000920","U000920","U000920", "U000920"]
	};

	var oPriceDeterminationStrategyPriceSource = {
			"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD" ],
			"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 2, 2, 3, 4, 0 ],
			"PRICE_SOURCE_ID" : [ "101", "102", "201", "301", "302", "901", "902", "903"],
			"PRICE_SOURCE_TYPE_ID" : [ 1, 1, 1, 2, 2, 3, 4, 0 ],
			"DETERMINATION_SEQUENCE" : [ 1 ,2, 3, 1, 2, 0, 0, 0 ]
	};

	var oPriceComponentDataPlc = {
        "PRICE_ID":[ '2C0000E0B2BDB9671600A4000936462B', '2E0000E0B2BDB9671600A4000936462B',  '2F0000E0B2BDB9671600A4000936462B'],
        "_VALID_FROM":['2015-06-19T12:27:23.197Z', '2015-06-19T12:27:23.197Z', '2015-06-19T12:27:23.197Z'],
        "ACCOUNT_ID":["11000","21000","625000"],
        "PRICE_FIXED":[ "2.0000000", "3.0000000", "4.0000000"],
        "PRICE_VARIABLE":[ "14.0000000", "3.0000000", "7.0000000"],
        "CONTROLLING_AREA_ID":['1000', 'CA1', '1000']
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
	};

	const oVersionWithCustomer = {
		MASTER_DATA_TIMESTAMP: [sMasterdataTimestampDate],
		VALUATION_DATE: [sValuationDate],
		REPORT_CURRENCY_ID: ["EUR"],
		CONTROLLING_AREA_ID: [sControllingArea],
		PROJECT_ID: [sProject],
		CUSTOMER_ID: ["#CU1"],
		MATERIAL_PRICE_STRATEGY_ID: ["PLC_STANDARD"],
		ACTIVITY_PRICE_STRATEGY_ID: ["PLC_STANDARD"]
	};

	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oMaterialPriceExtTestDataPlc = {
				"PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B" ],
				"CMPR_BOOLEAN_INT_MANUAL" : [1, 1, 1, 1, null],
				"CMPR_BOOLEAN_INT_UNIT" : [null,  null, null, null, null],
				"CMPR_DECIMAL_MANUAL": ["123.4500000","121.2500000","121.2500000", "121.2500000", null],
				"CMPR_DECIMAL_UNIT" : [null,  null, null, null, null],
				"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["234.5600000","200.5500000","234.9900000","456.7700000", null],
				"CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR","EUR","EUR","EUR", null],
				"CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000","1.0000000","2.0000000","2.0000000", null],
				"CMPR_DECIMAL_WITH_UOM_UNIT": ["H","H","H","H", null],	
				"_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z", "2015-06-19T12:27:23.197Z"]
		};
	}


	beforeOnce(function() {

		oMockstarPlc = new MockstarFacade(
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_item_price_determination_material", // procedure or view under test
					substituteTables:                                           // substitute all used tables in the procedure or view
					{
						material: {
							name: Resources["Material"].dbobjects.plcTable,
							data: testData.oMaterialTestDataPlc
						},
						price_source:{
							name: Resources["Price_Source"].dbobjects.plcTable,
							data: testData.oPriceSourceTestDataPlc
						},
						plant : {
							name: Resources["Plant"].dbobjects.plcTable,
							data: testData.oPlantTestDataPlc
						},
						vendor : {
							name: Resources["Vendor"].dbobjects.plcTable,
							data: testData.oVendorTestDataPlc
						},
						company_code: {
							name : Resources["Company_Code"].dbobjects.plcTable,
							data : testData.oCompanyCodeTestDataPlc
						},
						price_determination_strategy: {
							name: "sap.plc.db::basis.t_price_determination_strategy",
							data: testData.oPriceDeterminationStrategyTestData
						},
						price_determination_strategy_price_source: {
							name: "sap.plc.db::basis.t_price_determination_strategy_price_source",
							data: oPriceDeterminationStrategyPriceSource
						},
						price_determination_strategy_rule: {
							name:"sap.plc.db::basis.t_price_determination_strategy_rule",
							data: testData.oPriceDeterminationStrategyRuleDefault
						},
						material_price : {
							name: Resources["Material_Price"].dbobjects.plcTable,
							data: oMaterialPriceTestDataPlc
						},
						price_components : {
							name: "sap.plc.db::basis.t_price_component",
							data: oPriceComponentDataPlc
						},
						material_price_ext: Resources["Material_Price"].dbobjects.plcExtensionTable
					}

				});
	}
	);

	beforeEach(function() {
		oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
		oMockstarPlc.initializeData();
		if(jasmine.plcTestRunParameters.generatedFields === true){
			oMockstarPlc.insertTableData("material_price_ext", oMaterialPriceExtTestDataPlc);
		}
	});

	it('should determine/select prices for several items of type material from plc table', function(){
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0),
		                      mockstar_helpers.convertToObject(oItemInput, 1),
		                      mockstar_helpers.convertToObject(oItemInput, 2),
							  mockstar_helpers.convertToObject(oItemInput, 5)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure (lt_items_input, lt_version_input, sUseMultiplePlants);

		//assert
		var oEntity = Array.slice(result.OT_ALL_PRICES);

		expect(oEntity).toMatchData({
			"ITEM_ID":           				[oItemInput.ITEM_ID[0],									oItemInput.ITEM_ID[0],									oItemInput.ITEM_ID[1], 									oItemInput.ITEM_ID[1],									oItemInput.ITEM_ID[5], 								oItemInput.ITEM_ID[5]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],		oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],			oItemInput.IS_DISABLING_PRICE_DETERMINATION[1], 		oItemInput.IS_DISABLING_PRICE_DETERMINATION[1], 		oItemInput.IS_DISABLING_PRICE_DETERMINATION[5], 	oItemInput.IS_DISABLING_PRICE_DETERMINATION[5]],
			"PRICE_SOURCE_ID": 					[testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0],   testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1],	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], 	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1],	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1]],
			"MATERIAL_ID": 						[oItemInput.MATERIAL_ID[0], 							oItemInput.MATERIAL_ID[0],								oItemInput.MATERIAL_ID[1], 								oItemInput.MATERIAL_ID[1],								oItemInput.MATERIAL_ID[5], 							oItemInput.MATERIAL_ID[5]],
			"PLANT_ID": 						[oMaterialPriceTestDataPlc.PLANT_ID[2],					oMaterialPriceTestDataPlc.PLANT_ID[4],					oMaterialPriceTestDataPlc.PLANT_ID[2], 					oMaterialPriceTestDataPlc.PLANT_ID[4],					oMaterialPriceTestDataPlc.PLANT_ID[2], 				oMaterialPriceTestDataPlc.PLANT_ID[4]],
			"VENDOR_ID": 						[oMaterialPriceTestDataPlc.VENDOR_ID[2],				oMaterialPriceTestDataPlc.VENDOR_ID[4],					oMaterialPriceTestDataPlc.VENDOR_ID[2], 				oMaterialPriceTestDataPlc.VENDOR_ID[4],					oMaterialPriceTestDataPlc.VENDOR_ID[2], 			oMaterialPriceTestDataPlc.VENDOR_ID[4]],
			"PROJECT_ID": 						[oMaterialPriceTestDataPlc.PROJECT_ID[2],				oMaterialPriceTestDataPlc.PROJECT_ID[4],				oMaterialPriceTestDataPlc.PROJECT_ID[2],				oMaterialPriceTestDataPlc.PROJECT_ID[4],				oMaterialPriceTestDataPlc.PROJECT_ID[2],			oMaterialPriceTestDataPlc.PROJECT_ID[4]],
			"VALID_FROM_QUANTITY": 		 		[oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], 		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], 	oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4]],
			"PRICE_VARIABLE_PORTION":			[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2], oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4]],
			"TRANSACTION_CURRENCY_ID":			[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2], 	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2], oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4]],
			"PRICE_UNIT":						[oMaterialPriceTestDataPlc.PRICE_UNIT[2],				oMaterialPriceTestDataPlc.PRICE_UNIT[4],				oMaterialPriceTestDataPlc.PRICE_UNIT[2], 				oMaterialPriceTestDataPlc.PRICE_UNIT[4],				oMaterialPriceTestDataPlc.PRICE_UNIT[2], 			oMaterialPriceTestDataPlc.PRICE_UNIT[4]],
			"PRICE_UNIT_UOM_ID":				[oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2],		oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4],			oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2], 		oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4],			oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2], 	oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4]],
		}, ["ITEM_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "VALID_FROM_QUANTITY"]);

		if (jasmine.plcTestRunParameters.generatedFields === true) {
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[1], oItemInput.ITEM_ID[1], oItemInput.ITEM_ID[5], oItemInput.ITEM_ID[5]],
				"PRICE_SOURCE_ID": 		[testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1]],
				"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[1], oItemInput.MATERIAL_ID[1], oItemInput.MATERIAL_ID[4], oItemInput.MATERIAL_ID[5]],
				"PLANT_ID": 			[oMaterialPriceTestDataPlc.PLANT_ID[2], oMaterialPriceTestDataPlc.PLANT_ID[4], oMaterialPriceTestDataPlc.PLANT_ID[2], oMaterialPriceTestDataPlc.PLANT_ID[4], oMaterialPriceTestDataPlc.PLANT_ID[2], oMaterialPriceTestDataPlc.PLANT_ID[4]],
				"VENDOR_ID": 			[oMaterialPriceTestDataPlc.VENDOR_ID[2], oMaterialPriceTestDataPlc.VENDOR_ID[4], oMaterialPriceTestDataPlc.VENDOR_ID[2], oMaterialPriceTestDataPlc.VENDOR_ID[4], oMaterialPriceTestDataPlc.VENDOR_ID[2], oMaterialPriceTestDataPlc.VENDOR_ID[4]],
				"PROJECT_ID": 			[oMaterialPriceTestDataPlc.PROJECT_ID[2], oMaterialPriceTestDataPlc.PROJECT_ID[4], oMaterialPriceTestDataPlc.PROJECT_ID[2], oMaterialPriceTestDataPlc.PROJECT_ID[4], oMaterialPriceTestDataPlc.PROJECT_ID[2],oMaterialPriceTestDataPlc.PROJECT_ID[4]],
				"VALID_FROM_QUANTITY":  [oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4], oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4], oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4]],
				"CMPR_BOOLEAN_INT_MANUAL": 		[oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[4]],
				"CMPR_BOOLEAN_INT_UNIT":		[oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[4]],
				"CMPR_DECIMAL_MANUAL": 			[oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[4]],
				"CMPR_DECIMAL_UNIT": 			[oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[4]],
				"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[4]],
				"CMPR_DECIMAL_WITH_CURRENCY_UNIT": 	 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[4]],
				"CMPR_DECIMAL_WITH_UOM_MANUAL": 	 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[4]],
				"CMPR_DECIMAL_WITH_UOM_UNIT": 		 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[4]],	
			}, ["ITEM_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "VALID_FROM_QUANTITY"]);
		}
	});

	it('should receive IS_PRICE_SPLIT_ACTIVE with the value 0 if the material does not have a price component for the controlling area of the version', function(){
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0),
		                      mockstar_helpers.convertToObject(oItemInput, 1),
		                      mockstar_helpers.convertToObject(oItemInput, 2),
							  mockstar_helpers.convertToObject(oItemInput, 5)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure (lt_items_input, lt_version_input, sUseMultiplePlants);

		//assert
		var oEntity = Array.slice(result.OT_ALL_PRICES);
		expect(oEntity).toMatchData({
			"ITEM_ID":           				[oItemInput.ITEM_ID[0],									oItemInput.ITEM_ID[0],									oItemInput.ITEM_ID[1], 									oItemInput.ITEM_ID[1],									oItemInput.ITEM_ID[5], 								oItemInput.ITEM_ID[5]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],		oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],			oItemInput.IS_DISABLING_PRICE_DETERMINATION[1], 		oItemInput.IS_DISABLING_PRICE_DETERMINATION[1], 		oItemInput.IS_DISABLING_PRICE_DETERMINATION[5], 	oItemInput.IS_DISABLING_PRICE_DETERMINATION[5]],
			"PRICE_SOURCE_ID": 					[testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0],   testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1],	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], 	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1],	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1]],
			"MATERIAL_ID": 						[oItemInput.MATERIAL_ID[0], 							oItemInput.MATERIAL_ID[0],								oItemInput.MATERIAL_ID[1], 								oItemInput.MATERIAL_ID[1],								oItemInput.MATERIAL_ID[5], 							oItemInput.MATERIAL_ID[5]],
			"PLANT_ID": 						[oMaterialPriceTestDataPlc.PLANT_ID[2],					oMaterialPriceTestDataPlc.PLANT_ID[4],					oMaterialPriceTestDataPlc.PLANT_ID[2], 					oMaterialPriceTestDataPlc.PLANT_ID[4],					oMaterialPriceTestDataPlc.PLANT_ID[2], 				oMaterialPriceTestDataPlc.PLANT_ID[4]],
			"VENDOR_ID": 						[oMaterialPriceTestDataPlc.VENDOR_ID[2],				oMaterialPriceTestDataPlc.VENDOR_ID[4],					oMaterialPriceTestDataPlc.VENDOR_ID[2], 				oMaterialPriceTestDataPlc.VENDOR_ID[4],					oMaterialPriceTestDataPlc.VENDOR_ID[2], 			oMaterialPriceTestDataPlc.VENDOR_ID[4]],
			"PROJECT_ID": 						[oMaterialPriceTestDataPlc.PROJECT_ID[2],				oMaterialPriceTestDataPlc.PROJECT_ID[4],				oMaterialPriceTestDataPlc.PROJECT_ID[2],				oMaterialPriceTestDataPlc.PROJECT_ID[4],				oMaterialPriceTestDataPlc.PROJECT_ID[2],			oMaterialPriceTestDataPlc.PROJECT_ID[4]],
			"VALID_FROM_QUANTITY": 		 		[oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], 		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], 	oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4]],
			"PRICE_VARIABLE_PORTION":			[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2], oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4]],
			"TRANSACTION_CURRENCY_ID":			[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2], 	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2], oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4]],
			"PRICE_UNIT":						[oMaterialPriceTestDataPlc.PRICE_UNIT[2],				oMaterialPriceTestDataPlc.PRICE_UNIT[4],				oMaterialPriceTestDataPlc.PRICE_UNIT[2], 				oMaterialPriceTestDataPlc.PRICE_UNIT[4],				oMaterialPriceTestDataPlc.PRICE_UNIT[2], 			oMaterialPriceTestDataPlc.PRICE_UNIT[4]],
			"PRICE_UNIT_UOM_ID":				[oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2],		oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4],			oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2], 		oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4],			oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2], 	oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4]],
			"IS_PRICE_SPLIT_ACTIVE": 			[oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0], 	oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0],		oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0], 	oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0],		oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0], oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0]],// value 0
		}, ["ITEM_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "VALID_FROM_QUANTITY"]);

	});

	it('should receive IS_PRICE_SPLIT_ACTIVE with the value 1 if the material has a price component for the controlling area of the version', function(){
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0),
		                      mockstar_helpers.convertToObject(oItemInput, 1),
		                      mockstar_helpers.convertToObject(oItemInput, 2),
							  mockstar_helpers.convertToObject(oItemInput, 5)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
		oMockstarPlc.execSingle("update {{price_components}} set CONTROLLING_AREA_ID = '1000'");
		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure (lt_items_input, lt_version_input, sUseMultiplePlants);
		

		//assert
		var oEntity = Array.slice(result.OT_ALL_PRICES);
		expect(oEntity).toMatchData({
			"ITEM_ID":           				[oItemInput.ITEM_ID[0],									oItemInput.ITEM_ID[0],									oItemInput.ITEM_ID[1], 									oItemInput.ITEM_ID[1],									oItemInput.ITEM_ID[5], 								oItemInput.ITEM_ID[5]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],		oItemInput.IS_DISABLING_PRICE_DETERMINATION[0],			oItemInput.IS_DISABLING_PRICE_DETERMINATION[1], 		oItemInput.IS_DISABLING_PRICE_DETERMINATION[1], 		oItemInput.IS_DISABLING_PRICE_DETERMINATION[5], 	oItemInput.IS_DISABLING_PRICE_DETERMINATION[5]],
			"PRICE_SOURCE_ID": 					[testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0],   testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1],	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], 	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1],	testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[0], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1]],
			"MATERIAL_ID": 						[oItemInput.MATERIAL_ID[0], 							oItemInput.MATERIAL_ID[0],								oItemInput.MATERIAL_ID[1], 								oItemInput.MATERIAL_ID[1],								oItemInput.MATERIAL_ID[5], 							oItemInput.MATERIAL_ID[5]],
			"PLANT_ID": 						[oMaterialPriceTestDataPlc.PLANT_ID[2],					oMaterialPriceTestDataPlc.PLANT_ID[4],					oMaterialPriceTestDataPlc.PLANT_ID[2], 					oMaterialPriceTestDataPlc.PLANT_ID[4],					oMaterialPriceTestDataPlc.PLANT_ID[2], 				oMaterialPriceTestDataPlc.PLANT_ID[4]],
			"VENDOR_ID": 						[oMaterialPriceTestDataPlc.VENDOR_ID[2],				oMaterialPriceTestDataPlc.VENDOR_ID[4],					oMaterialPriceTestDataPlc.VENDOR_ID[2], 				oMaterialPriceTestDataPlc.VENDOR_ID[4],					oMaterialPriceTestDataPlc.VENDOR_ID[2], 			oMaterialPriceTestDataPlc.VENDOR_ID[4]],
			"PROJECT_ID": 						[oMaterialPriceTestDataPlc.PROJECT_ID[2],				oMaterialPriceTestDataPlc.PROJECT_ID[4],				oMaterialPriceTestDataPlc.PROJECT_ID[2],				oMaterialPriceTestDataPlc.PROJECT_ID[4],				oMaterialPriceTestDataPlc.PROJECT_ID[2],			oMaterialPriceTestDataPlc.PROJECT_ID[4]],
			"VALID_FROM_QUANTITY": 		 		[oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], 		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4],		oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[2], 	oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[4]],
			"PRICE_VARIABLE_PORTION":			[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4],	oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[2], oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[4]],
			"TRANSACTION_CURRENCY_ID":			[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2], 	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4],	oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2], oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[4]],
			"PRICE_UNIT":						[oMaterialPriceTestDataPlc.PRICE_UNIT[2],				oMaterialPriceTestDataPlc.PRICE_UNIT[4],				oMaterialPriceTestDataPlc.PRICE_UNIT[2], 				oMaterialPriceTestDataPlc.PRICE_UNIT[4],				oMaterialPriceTestDataPlc.PRICE_UNIT[2], 			oMaterialPriceTestDataPlc.PRICE_UNIT[4]],
			"PRICE_UNIT_UOM_ID":				[oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2],		oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4],			oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2], 		oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4],			oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[2], 	oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[4]],
			"IS_PRICE_SPLIT_ACTIVE": 			[oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[2], 	oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0],		oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[2],		oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0], 	oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[2], oMaterialPriceTestDataPlc.IS_PRICE_SPLIT_ACTIVE[0]],// value 1
		}, ["ITEM_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "VALID_FROM_QUANTITY"]);

	});

	it('should determine/select prices with multiple plants if PLANT_ID is empty and procedure is called in mode use multiple plants)', function(){	
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 4)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
		var lv_use_multiple_plants = 'X';
		var iIndexItem = 4;
		var iIndexPrice1 = 2;
		var iIndexPrice2 = 3;
		var iIndexPriceSource = 0;

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure (lt_items_input, lt_version_input, lv_use_multiple_plants);

		//assert
		var oEntity = Array.slice(result.OT_ALL_PRICES);
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexItem],oItemInput.ITEM_ID[iIndexItem],oItemInput.ITEM_ID[iIndexItem]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[iIndexItem],oItemInput.IS_DISABLING_PRICE_DETERMINATION[iIndexItem], oItemInput.IS_DISABLING_PRICE_DETERMINATION[iIndexItem]],
			"PRICE_SOURCE_ID": [testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource],testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1]],
			"MATERIAL_ID": [ oItemInput.MATERIAL_ID[iIndexItem],oItemInput.MATERIAL_ID[iIndexItem], oItemInput.MATERIAL_ID[iIndexItem]],
			"PLANT_ID": 			[oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice2], oMaterialPriceTestDataPlc.PLANT_ID[iIndexItem]],
			"VENDOR_ID": 			[oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice1],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice2], oMaterialPriceTestDataPlc.VENDOR_ID[iIndexItem]],
			"PROJECT_ID": 			[oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice2], oMaterialPriceTestDataPlc.PROJECT_ID[iIndexItem]],
			"VALID_FROM_QUANTITY":  [oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice1],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice2], oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexItem]],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice2], oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexItem]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice1],oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice2], oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexItem]],
			"PRICE_UNIT":			[oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice2], oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexItem]],
			"PRICE_UNIT_UOM_ID":	[oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice2], oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexItem]],
		}, ["ITEM_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "VALID_FROM_QUANTITY"]);

		if (jasmine.plcTestRunParameters.generatedFields === true) {
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexItem],oItemInput.ITEM_ID[iIndexItem],oItemInput.ITEM_ID[iIndexItem]],
				"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[iIndexItem],oItemInput.IS_DISABLING_PRICE_DETERMINATION[iIndexItem], oItemInput.IS_DISABLING_PRICE_DETERMINATION[iIndexItem]],
				"PRICE_SOURCE_ID": [testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource],testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource], testData.oPriceSourceTestDataPlc.PRICE_SOURCE_ID[1]],
				"MATERIAL_ID": [ oItemInput.MATERIAL_ID[iIndexItem],oItemInput.MATERIAL_ID[iIndexItem], oItemInput.MATERIAL_ID[iIndexItem]],
				"PLANT_ID": 			[oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice2], oMaterialPriceTestDataPlc.PLANT_ID[iIndexItem]],
				"VENDOR_ID": 			[oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice1],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice2], oMaterialPriceTestDataPlc.VENDOR_ID[iIndexItem]],
				"PROJECT_ID": 			[oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice2], oMaterialPriceTestDataPlc.PROJECT_ID[iIndexItem]],
				"VALID_FROM_QUANTITY":  [oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice1],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice2], oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexItem]],
				"CMPR_BOOLEAN_INT_MANUAL": 		[oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexItem]],
				"CMPR_BOOLEAN_INT_UNIT":		[oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexItem]],
				"CMPR_DECIMAL_MANUAL": 			[oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexItem]],
				"CMPR_DECIMAL_UNIT": 			[oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexItem]],
				"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexItem]],
				"CMPR_DECIMAL_WITH_CURRENCY_UNIT": 	 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexItem]],
				"CMPR_DECIMAL_WITH_UOM_MANUAL": 	 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexItem]],
				"CMPR_DECIMAL_WITH_UOM_UNIT": 		 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexItem]],	
			}, ["ITEM_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "VALID_FROM_QUANTITY"]);
		}
	});

	const parametersSortMaterialPrices = [
		{description: "should sort by newest first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcDefault], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcDefault.PRICE_ID[2], testData.oMaterialPriceTestDataPlcDefault.PRICE_ID[1], testData.oMaterialPriceTestDataPlcDefault.PRICE_ID[0]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcDefault.PLANT_ID[2], testData.oMaterialPriceTestDataPlcDefault.PLANT_ID[1], testData.oMaterialPriceTestDataPlcDefault.PLANT_ID[0]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcDefault.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcDefault.VENDOR_ID[1], testData.oMaterialPriceTestDataPlcDefault.VENDOR_ID[0]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcDefault.PROJECT_ID[2], testData.oMaterialPriceTestDataPlcDefault.PROJECT_ID[1], testData.oMaterialPriceTestDataPlcDefault.PROJECT_ID[0]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcDefault.VALID_FROM_QUANTITY[2], testData.oMaterialPriceTestDataPlcDefault.VALID_FROM_QUANTITY[1], testData.oMaterialPriceTestDataPlcDefault.VALID_FROM_QUANTITY[0]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcDefault.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcDefault.PRICE_VARIABLE_PORTION[1], testData.oMaterialPriceTestDataPlcDefault.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcDefault.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcDefault.TRANSACTION_CURRENCY_ID[1], testData.oMaterialPriceTestDataPlcDefault.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcDefault.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcDefault.PRICE_UNIT[1], testData.oMaterialPriceTestDataPlcDefault.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcDefault.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcDefault.PRICE_UNIT_UOM_ID[1], testData.oMaterialPriceTestDataPlcDefault.PRICE_UNIT_UOM_ID[0]]
		}},
		{description: "should sort by plant first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcDefaultPlant], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_ID[1]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultPlant.PLANT_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PLANT_ID[1]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcDefaultPlant.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.VENDOR_ID[1]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultPlant.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PROJECT_ID[1]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcDefaultPlant.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcDefaultPlant.VALID_FROM_QUANTITY[1]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcDefaultPlant.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_UNIT_UOM_ID[1]]
		}},
		{description: "should sort by vendor first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcDefaultVendor], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_ID[0], testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_ID[1], testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_ID[2]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultVendor.PLANT_ID[0], testData.oMaterialPriceTestDataPlcDefaultVendor.PLANT_ID[1], testData.oMaterialPriceTestDataPlcDefaultVendor.PLANT_ID[2]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcDefaultVendor.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcDefaultVendor.VENDOR_ID[1], testData.oMaterialPriceTestDataPlcDefaultVendor.VENDOR_ID[2]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultVendor.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcDefaultVendor.PROJECT_ID[1], testData.oMaterialPriceTestDataPlcDefaultVendor.PROJECT_ID[2]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcDefaultVendor.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcDefaultVendor.VALID_FROM_QUANTITY[1], testData.oMaterialPriceTestDataPlcDefaultVendor.VALID_FROM_QUANTITY[2]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_VARIABLE_PORTION[1], testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_VARIABLE_PORTION[2]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcDefaultVendor.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcDefaultVendor.TRANSACTION_CURRENCY_ID[1], testData.oMaterialPriceTestDataPlcDefaultVendor.TRANSACTION_CURRENCY_ID[2]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_UNIT[1], testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_UNIT[2]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_UNIT_UOM_ID[1], testData.oMaterialPriceTestDataPlcDefaultVendor.PRICE_UNIT_UOM_ID[2]]
		}},
		{description: "should sort by project first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcDefaultProject], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcDefaultProject.PRICE_ID[2], testData.oMaterialPriceTestDataPlcDefaultProject.PRICE_ID[1]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultProject.PLANT_ID[2], testData.oMaterialPriceTestDataPlcDefaultProject.PLANT_ID[1]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcDefaultProject.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcDefaultProject.VENDOR_ID[1]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultProject.PROJECT_ID[2], testData.oMaterialPriceTestDataPlcDefaultProject.PROJECT_ID[1]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcDefaultProject.VALID_FROM_QUANTITY[2], testData.oMaterialPriceTestDataPlcDefaultProject.VALID_FROM_QUANTITY[1]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcDefaultProject.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcDefaultProject.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcDefaultProject.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcDefaultProject.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcDefaultProject.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcDefaultProject.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcDefaultProject.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcDefaultProject.PRICE_UNIT_UOM_ID[1]]
		}},
		{description: "should sort by customer first (default order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcDefaultCustomer], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcDefaultCustomer.PRICE_ID[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.PRICE_ID[0]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultCustomer.PLANT_ID[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.PLANT_ID[0]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcDefaultCustomer.VENDOR_ID[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.VENDOR_ID[0]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultCustomer.PROJECT_ID[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.PROJECT_ID[0]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcDefaultCustomer.VALID_FROM_QUANTITY[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.VALID_FROM_QUANTITY[0]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcDefaultCustomer.PRICE_VARIABLE_PORTION[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcDefaultCustomer.TRANSACTION_CURRENCY_ID[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcDefaultCustomer.PRICE_UNIT[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcDefaultCustomer.PRICE_UNIT_UOM_ID[1], testData.oMaterialPriceTestDataPlcDefaultCustomer.PRICE_UNIT_UOM_ID[0]]
		}},
		{description: "should match on new (vendor second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorSecond], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_ID[1], testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_ID[0], testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_ID[2]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecond.PLANT_ID[1], testData.oMaterialPriceTestDataPlcVendorSecond.PLANT_ID[0], testData.oMaterialPriceTestDataPlcVendorSecond.PLANT_ID[2]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecond.VENDOR_ID[1], testData.oMaterialPriceTestDataPlcVendorSecond.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcVendorSecond.VENDOR_ID[2]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecond.PROJECT_ID[1], testData.oMaterialPriceTestDataPlcVendorSecond.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcVendorSecond.PROJECT_ID[2]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcVendorSecond.VALID_FROM_QUANTITY[1], testData.oMaterialPriceTestDataPlcVendorSecond.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcVendorSecond.VALID_FROM_QUANTITY[2]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_VARIABLE_PORTION[1], testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_VARIABLE_PORTION[2]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorSecond.TRANSACTION_CURRENCY_ID[1], testData.oMaterialPriceTestDataPlcVendorSecond.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcVendorSecond.TRANSACTION_CURRENCY_ID[2]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_UNIT[1], testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_UNIT[2]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_UNIT_UOM_ID[1], testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcVendorSecond.PRICE_UNIT_UOM_ID[2]]
		}},
		{description: "should match on vendor (vendor second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorSecondMatchVendor], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_ID[1]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultPlant.PLANT_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PLANT_ID[1]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcDefaultPlant.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.VENDOR_ID[1]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcDefaultPlant.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PROJECT_ID[1]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcDefaultPlant.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcDefaultPlant.VALID_FROM_QUANTITY[1]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcDefaultPlant.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcDefaultPlant.PRICE_UNIT_UOM_ID[1]]
		}},
		{description: "should not match new and vendor (vendor second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorSecondNoMatch], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_ID[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_ID[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_ID[2]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PLANT_ID[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PLANT_ID[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PLANT_ID[2]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.VENDOR_ID[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.VENDOR_ID[2]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PROJECT_ID[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PROJECT_ID[2]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.VALID_FROM_QUANTITY[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.VALID_FROM_QUANTITY[2]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_VARIABLE_PORTION[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_VARIABLE_PORTION[2]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.TRANSACTION_CURRENCY_ID[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.TRANSACTION_CURRENCY_ID[2]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_UNIT[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_UNIT[2]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_UNIT_UOM_ID[1], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcVendorSecondNoMatch.PRICE_UNIT_UOM_ID[2]]
		}},
		{description: "should match on vendor (vendor first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirst], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirst], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_ID[1], testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_ID[0]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirst.PLANT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirst.PLANT_ID[1], testData.oMaterialPriceTestDataPlcVendorFirst.PLANT_ID[0]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirst.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcVendorFirst.VENDOR_ID[1], testData.oMaterialPriceTestDataPlcVendorFirst.VENDOR_ID[0]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirst.PROJECT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirst.PROJECT_ID[1], testData.oMaterialPriceTestDataPlcVendorFirst.PROJECT_ID[0]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcVendorFirst.VALID_FROM_QUANTITY[2], testData.oMaterialPriceTestDataPlcVendorFirst.VALID_FROM_QUANTITY[1], testData.oMaterialPriceTestDataPlcVendorFirst.VALID_FROM_QUANTITY[0]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_VARIABLE_PORTION[1], testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirst.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirst.TRANSACTION_CURRENCY_ID[1], testData.oMaterialPriceTestDataPlcVendorFirst.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_UNIT[1], testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_UNIT_UOM_ID[1], testData.oMaterialPriceTestDataPlcVendorFirst.PRICE_UNIT_UOM_ID[0]]
		}},
		{description: "should match on vendor and new (vendor first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirst], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstMatchNew], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_ID[1]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PLANT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PLANT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PLANT_ID[1]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.VENDOR_ID[1]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PROJECT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PROJECT_ID[1]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.VALID_FROM_QUANTITY[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.VALID_FROM_QUANTITY[1]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNew.PRICE_UNIT_UOM_ID[1]]
		}},
		{description: "should not match vendor and new (vendor first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirst], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstNoMatch], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_ID[1]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PLANT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PLANT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PLANT_ID[1]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.VENDOR_ID[1]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PROJECT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PROJECT_ID[1]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.VALID_FROM_QUANTITY[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.VALID_FROM_QUANTITY[1]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatch.PRICE_UNIT_UOM_ID[1]]
		}},
		{description: "should match on vendor (vendor first, plant second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirstPlantSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_ID[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_ID[2]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PLANT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PLANT_ID[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PLANT_ID[2]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.VENDOR_ID[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.VENDOR_ID[2]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PROJECT_ID[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PROJECT_ID[2]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.VALID_FROM_QUANTITY[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.VALID_FROM_QUANTITY[2]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_VARIABLE_PORTION[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_VARIABLE_PORTION[2]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.TRANSACTION_CURRENCY_ID[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.TRANSACTION_CURRENCY_ID[2]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_UNIT[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_UNIT[2]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_UNIT_UOM_ID[1], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecond.PRICE_UNIT_UOM_ID[2]]
		}},
		{description: "should match on vendor and plant (vendor first, plant second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirstPlantSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_ID[1]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PLANT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PLANT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PLANT_ID[1]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.VENDOR_ID[1]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PROJECT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PROJECT_ID[1]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.VALID_FROM_QUANTITY[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.VALID_FROM_QUANTITY[1]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth.PRICE_UNIT_UOM_ID[1]]
		}},
		{description: "should not match on vendor and plant (vendor first, plant second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirstPlantSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[0]],
			"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0], oItemInput.IS_DISABLING_PRICE_DETERMINATION[0]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_ID[1]],
			"MATERIAL_ID": 			[oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0], oItemInput.MATERIAL_ID[0]],
			"PLANT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PLANT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PLANT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PLANT_ID[1]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.VENDOR_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.VENDOR_ID[1]],
			"PROJECT_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PROJECT_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PROJECT_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PROJECT_ID[1]],
			"VALID_FROM_QUANTITY":  [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.VALID_FROM_QUANTITY[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.VALID_FROM_QUANTITY[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.VALID_FROM_QUANTITY[1]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_VARIABLE_PORTION[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.TRANSACTION_CURRENCY_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_UNIT[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_UNIT_UOM_ID[0], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch.PRICE_UNIT_UOM_ID[1]]
		}},
	];

	parametersSortMaterialPrices.forEach((p) => {
		it(p.description, function() {
			oMockstarPlc.clearTable('price_determination_strategy_rule');
			oMockstarPlc.insertTableData('price_determination_strategy_rule', p.inputStrategy);

			oMockstarPlc.clearTable('material_price');
			oMockstarPlc.insertTableData('material_price', p.inputPrices);

			oMockstarPlc.clearTable('vendor');
			oMockstarPlc.insertTableData('vendor', oVendorTestDataStrategies);

			var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0)];

			const lt_version_input = [mockstar_helpers.convertToObject(oVersionWithCustomer, 0)];

			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure (lt_items_input, lt_version_input, sUseMultiplePlants);

			var oEntity = Array.slice(result.OT_ALL_PRICES);
			expect(oEntity).toMatchData(p.result, ["ITEM_ID", "IS_DISABLING_PRICE_DETERMINATION", "PRICE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID","PROJECT_ID","VALID_FROM_QUANTITY","PRICE_VARIABLE_PORTION","TRANSACTION_CURRENCY_ID","PRICE_UNIT","PRICE_UNIT_UOM_ID"]);
		});
	});

}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);