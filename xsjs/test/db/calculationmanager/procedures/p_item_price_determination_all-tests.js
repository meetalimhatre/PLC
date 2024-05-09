/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;
var testData = require("../../../testdata/testdata").data;
var MessageLibrary = require("../../../../lib/xs/util/message");
var _ = require("lodash");
var messageCode = MessageLibrary.Code;

describe('db.calculationmanager.procedures:p_item_price_determination_all',function() {

	var oMockstarPlc = null;
	var sTestUser = $.session.getUsername();

	var sMasterdataTimestampDate = new Date().toJSON();
	var sExpectedDateWithoutTime = new Date(2015, 8, 20).toJSON(); //"2015-08-20";
	var sExpectedDate = new Date().toJSON();
	var sValuationDate = sExpectedDateWithoutTime;
	var sControllingArea = "#CA1";
	var sProjectId = "#P1";
	var sReportingCurrency = "EUR";
	var iCalcVersId = 4809;

	var oItemInput = {
			"ITEM_ID":                          [3001,3002,3003, 3004, 3005,3006,3007],
			"PARENT_ITEM_ID":                   [1337,1337,1337,1337,1337,1337,1337],
			"ITEM_CATEGORY_ID":                 [1,2,3,1,2,2,2],
			"MATERIAL_ID":                      ["#100-110","MAT1","","MAT2","#100-110","#100-110","#100-110"],
			"PLANT_ID": 		                ["#PT1","PL2","","","#PT1","#PT1","#PT1"],
			"VENDOR_ID":                        ["","","","","V1","V1",''],
			"ACTIVITY_TYPE_ID":                 ["","","#AT2","","","",""],
			"COST_CENTER_ID": 	                ["","","#CC1","","CC1","CC1","CC1"],
			"PRICE_SOURCE_ID": 	                ["","PLC_ERP_PRICE","","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE"],
			"PRICE_SOURCE_TYPE_ID":             [1,1,2,1,1,1,1],
			"CONFIDENCE_LEVEL_ID":              [null,null,null,null,4,null,null],
			"PRICE_FIXED_PORTION": 			    ["5000.0000000","200.0000000","480.4500000","200.0000000","480.4500000","100.0000000","100.0000000"],
			"PRICE_VARIABLE_PORTION": 		    ["0.0000000","20.0000000","35.4500000","35.4500000","35.4500000","20.0000000","20.0000000"],
			"TRANSACTION_CURRENCY_ID":    		['EUR','EUR','EUR','EUR','EUR','EUR','EUR'],
			"PRICE_UNIT": 					    ["1.0000000","10.0000000","100.0000000","100.0000000","100.0000000","100.0000000","100.0000000"],
			"PRICE_UNIT_UOM_ID": 			    ['H','H','H','H','H','H','H'],
			"IS_DISABLING_PRICE_DETERMINATION": [null,null,null,null,1,null,null],
			"PURCHASING_GROUP": 			    ["p1","p2","p3","p4","","",""],
			"PURCHASING_DOCUMENT": 			    ["123","234","567","","","",""],
			"LOCAL_CONTENT": 			        ["10.0000000","50.0000000","80.0000000","80.0000000","80.0000000","80.0000000","80.0000000"]
	};

	var ItemTempTestDataPlc = {
		"SESSION_ID":["TEST_USER_1", "TEST_USER_1"],
		"ITEM_ID" : [ 3001, 3003 ],
		"CALCULATION_VERSION_ID" : [ iCalcVersId, iCalcVersId ],
		"IS_ACTIVE": [1, 1],
		"ITEM_CATEGORY_ID": [2, 3],
		"CHILD_ITEM_CATEGORY_ID": [2, 2],
		"IS_DIRTY": [0, 0],
		"IS_DELETED": [0, 0],
		"PRICE_FIXED_PORTION_CALCULATED": ["123.0000000", "321.0000000"],
		"PRICE_VARIABLE_PORTION_CALCULATED": ["456.0000000", "654.0000000"]
	};

	const oVersionInput = {
		MASTER_DATA_TIMESTAMP: [sMasterdataTimestampDate],
        VALUATION_DATE: [sValuationDate],
        REPORT_CURRENCY_ID: [sReportingCurrency],
        CONTROLLING_AREA_ID: [sControllingArea],
        PROJECT_ID: [sProjectId],
        CUSTOMER_ID: [null],
        MATERIAL_PRICE_STRATEGY_ID: ["PLC_STANDARD"],
        ACTIVITY_PRICE_STRATEGY_ID: ["PLC_STANDARD"]
	}

	const oVersionWithCustomer = {
		MASTER_DATA_TIMESTAMP: [sMasterdataTimestampDate],
		VALUATION_DATE: [sValuationDate],
		REPORT_CURRENCY_ID: ["EUR"],
		CONTROLLING_AREA_ID: [sControllingArea],
		PROJECT_ID: [sProjectId],
		CUSTOMER_ID: ["#CU1"],
		MATERIAL_PRICE_STRATEGY_ID: ["PLC_STANDARD"],
		ACTIVITY_PRICE_STRATEGY_ID: ["PLC_STANDARD"]
	};

	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oItemExtInputTestData = {
				"ITEM_ID"                          : [oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[1], oItemInput.ITEM_ID[2], oItemInput.ITEM_ID[3], oItemInput.ITEM_ID[4], oItemInput.ITEM_ID[5], oItemInput.ITEM_ID[5]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [0, 0, null, null, null, null, null],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [null,  null, null, null, null, null, null],
	    		"CMPR_DECIMAL_MANUAL"              : ["111.4500000","222.2500000",null, null, null, null, null],
	    		"CMPR_DECIMAL_UNIT"                : [null,  null, null, null, null, null, null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["444.5600000","555.5500000",null, null, null, null, null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : ["USD","USD",null, null, null, null, null],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : ["60.0000000","60.0000000",null, null, null, null, null],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : ["Min","Min",null, null, null, null, null],
	    		"CAPR_DECIMAL_MANUAL"              : [null, null, "80.0000000", null, null, null, null],
	    		"CAPR_DECIMAL_UNIT"                : [null, null, "Min", null, null, null, null]
		}
		oItemInput = _.extend(oItemInput, oItemExtInputTestData);
	}
	
	var oMaterialTestDataPlc = {
			"MATERIAL_ID" : ['#100-110', 'MAT2', 'MAT3', 'MAT4', 'MAT5', 'MAT6', 'MAT7', "MATEN", "MATE1"],
			"IS_PHANTOM_MATERIAL" : [1, 0, 1, 0, 1, 0, 1, 0, 0],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z','2015-01-01T15:39:09.691Z'],
			"_VALID_TO" : [null, null,'2015-06-06T15:39:09.691Z', null, null, null, null, null, null],
			"_SOURCE" : [1, 1, 1, 1, 1, 1, 1, 2, 2],
			"_CREATED_BY" :['U000001', 'U000003', 'U000002', 'U000002', 'U000003', 'U000003', 'U000003']
	};
	
	var oPlantTestDataPlc = {
			"PLANT_ID" : ['#PT1' , 'PL2', 'PL3', 'PL4', 'PLE1'],
			"COMPANY_CODE_ID" : ['#C1', 'CC2','CC2', 'CC1', '#C1'],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
			"_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, null, null],
			"_SOURCE" :[1, 1, 1, 1, 2],
			"_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000003']
	};

	var oVendorTestDataPlc = {
			"VENDOR_ID": ["V1"],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
			"_VALID_TO" : [null],
			"_SOURCE" : [1],
			"_CREATED_BY" :['U000001']
	}
	
	var oCompanyCodeTestDataPlc = {
			"COMPANY_CODE_ID" : ['#C1', 'CC2', 'CC3'],
			"CONTROLLING_AREA_ID" : ['#CA1', '1000', '1000'],
			"COMPANY_CODE_CURRENCY_ID" : ['EUR', 'EUR', 'EUR'],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
	        "_VALID_TO" : [null, null, null],
			"_SOURCE" : [1, 1, 1],
			"_CREATED_BY" : ['U000001', 'U000002', 'U000001']
	};
	
	var oMaterialPriceTestDataPlc = {
			"PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B", "1B0000E0B2BDB9671600A4000936462B", "1B0000E0B2BDB9671600A4000936462B", "1D0000E0B2BDB9671600A4000936462B", "1E0000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_ERP_PRICE","PLC_VENDOR_PRICE", "PLC_VENDOR_PRICE"],
			"MATERIAL_ID": ["#100-110","#100-110","#100-110","#100-110","#100-110","MATEN","#100-110", "#100-110"],
			"PLANT_ID": ["#PT1","#PT1","#PT1","#PT1","#PT1","*","#PT1", "#PT1"],
			"VENDOR_ID": ["","#VD02","#VD03","#VD01","*","*","*", "V1"],
			"PROJECT_ID": ["*", "*", "*", "*", "*", "*", "*", "*", "*"],
			"PURCHASING_GROUP":["123","456","789","123","","","123", ""],
			"PURCHASING_DOCUMENT":["1234","5678","5679","5670","","","1234",""],
			"LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000",null,null, "50.0000000", "80.0000000"],
			"PROJECT_ID": ["*","*","*","*","*","*","*", "*"],
			"VALID_FROM": ["2015-07-01T00:00:00Z","2015-05-01T00:00:00Z","2015-01-01T00:00:00Z","2018-01-01T00:00:00Z","2015-01-01T00:00:00Z","2010-01-01T00:00:00Z","2015-07-01T00:00:00Z", "2015-07-01T00:00:00Z"],
			"VALID_TO": ["2017-12-31T00:00:00Z","2017-12-31T00:00:00Z","2017-12-31T00:00:00Z","2019-12-31T00:00:00Z","2999-12-31T00:00:00Z","2999-12-31T00:00:00Z","2017-12-31T00:00:00Z", "2999-12-31T00:00:00Z"],
			"VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000", "1.0000000"],
			"PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","123.8800000","0.0000000", "480.4500000"],
			"PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000","10.0000000","234.9900000", "85.5000000", "35.4500000"],
			"TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR","EUR","EUR","EUR", "EUR"],
			"PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000","1.0000000","100.0000000","10.0000000", "100.0000000"],
			"PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC","PC","PC","PC", "H"],
	        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-02-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-07-01T12:27:23.197Z", "2015-07-01T12:27:23.197Z"],
	        "_SOURCE": [1,1,1,1,1,2,1, 1],
			"_CREATED_BY": ["I055799","I055799","I055799","I055799","I055799","U000920","I30936", "I055799"]
	};
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oMaterialPriceExtTestDataPlc = {
				"PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B", "1B0000E0B2BDB9671600A4000936462B", "1E0000E0B2BDB9671600A4000936462B"],
	    		"CMPR_BOOLEAN_INT_MANUAL" : [1, 1, 1, 1, 1, null],
	    		"CMPR_BOOLEAN_INT_UNIT" : [null,  null, null, null,  null, null],
	    		"CMPR_DECIMAL_MANUAL": ["123.4500000","121.2500000","121.2500000", "123.4500000","121.2500000", null],
	    		"CMPR_DECIMAL_UNIT" : [null,  null, null, null,  null, null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["234.5600000","200.5500000","234.9900000","234.5600000","200.5500000", null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR","EUR","EUR","EUR","EUR", null],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000","1.0000000","2.0000000","1.0000000","1.0000000", null],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT": ["H","H","H","H","H", null],	
	    		"_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-02-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"]
	    }; 
	}
					
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
	
	var oActivityPriceTestDataPlc = {
			"PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B"],
	        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE","PLC_PLANNED_PRICE","PLC_PLANNED_PRICE","PLC_PLANNED_PRICE","PLC_PLANNED_PRICE","PLC_STANDARD_PRICE"],
	        "CONTROLLING_AREA_ID": ['#CA1','#CA1','#CA1','#CA1',"#CA2","#CA1"],
	        "COST_CENTER_ID": ['#CC1','#CC1',"#CC1","#CC1","*","#CC1"],
	        "ACTIVITY_TYPE_ID": ["#AT2","#AT2","*","#AT2","*","#AT2"],
	        "PROJECT_ID": ["#P1","*","*","*","*","*"],
	        "CUSTOMER_ID": ["*","*","*","*","*","*"],
	        "VALID_FROM": ["2015-07-01T00:00:00Z","2015-05-01T00:00:00Z","2015-01-01T00:00:00Z","2018-01-01T00:00:00Z","2015-01-01T00:00:00Z","2015-01-01T00:00:00Z"],
	        "VALID_TO": ["2017-12-31T00:00:00Z","2017-12-31T00:00:00Z","2017-12-31T00:00:00Z","2019-12-31T00:00:00Z","2999-12-31T00:00:00Z","2999-12-31T00:00:00Z"],
	        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
	        "PRICE_FIXED_PORTION": ["65.5000000","65.5000000","65.5000000","65.0000000","100.0000000","65.0000000"],
	        "PRICE_VARIABLE_PORTION": ["100.0000000","90.0000000","95.0000000","55.0000000","120.0000000","120.0000000"],
	        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR","EUR","EUR"],
	        "PRICE_UNIT": ["1.0000000","1.0000000","1.0000000","30.0000000","1.0000000","1.0000000"],
	        "PRICE_UNIT_UOM_ID": ["H","H","H","MIN","H","H"],
	        "_VALID_FROM": ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
	        "_SOURCE": [1,1,1,1,1,1],
	        "_CREATED_BY": ["I055799","U0001","U0001","I055799","I055799","I055799"]
	};
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		    var oActivityPriceExtTestDataPlc = {
				"PRICE_ID": ["250000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B"],
		        "_VALID_FROM": ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
		        "CAPR_DECIMAL_MANUAL": ["20.0000000", "30.0000000", "35.0000000", "40.0000000", "45.0000000", "50.0000000"],
                "CAPR_DECIMAL_UNIT": ["EUR", "CAD", "RON", "EUR", "CAD", "RON"]
		    };
	    };
	
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

	var oPriceDeterminationStrategyTestData = {
		"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_TEST_ST_MAT", "PLC_TEST_ST_ACT",],
		"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 2, 1, 2],
		"IS_VENDOR_VALUE_FILTER": [0, 0, 0, 0],
		"IS_VENDOR_GENERIC_FILTER": [0, 0, 0, 0],
		"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
		"CREATED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser ],
		"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
		"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser ]
	};

	beforeOnce(function() {

		oMockstarPlc = new MockstarFacade(
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_item_price_determination_all", // procedure or view under test
					substituteTables:                                           // substitute all used tables in the procedure or view
					{
						item_temp: {
							name: "sap.plc.db::basis.t_item_temporary",
							data: ItemTempTestDataPlc
						},
						material: {
							name: Resources["Material"].dbobjects.plcTable,
							data: oMaterialTestDataPlc
						},
						plant: {
							name: Resources["Plant"].dbobjects.plcTable,
							data: oPlantTestDataPlc
						},
						vendor: {
							name: Resources["Vendor"].dbobjects.plcTable,
							data: oVendorTestDataPlc
						},
						company_code: {
							name: Resources["Company_Code"].dbobjects.plcTable,
							data: oCompanyCodeTestDataPlc
						},
						material_price_plc :{
							name: Resources["Material_Price"].dbobjects.plcTable,
							data: oMaterialPriceTestDataPlc
						},
						activity_type:{
							name: Resources["Activity_Type"].dbobjects.plcTable,
							data: oActivityTypeTestDataPlc
						},
						cost_center:{
							name: Resources["Cost_Center"].dbobjects.plcTable,
							data:  oCostCenterTestDataPlc
						},
						activity_price:{
							name: Resources["Activity_Price"].dbobjects.plcTable,
							data:  oActivityPriceTestDataPlc
						},
						price_source:{
							name: Resources["Price_Source"].dbobjects.plcTable,
							data: oPriceSourceTestDataPlc
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
						material_price_plc_ext: "sap.plc.db::basis.t_material_price_ext",
						activity_price_ext: Resources["Activity_Price"].dbobjects.plcExtensionTable
					}
				}
		);

	});

	afterOnce(function(){				
		oMockstarPlc.cleanupMultiple(["sap.plc.db.calculationmanager.procedures", "sap.plc.db.calculationmanager.views"]);
	});

	beforeEach(function() {
		oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
		if(jasmine.plcTestRunParameters.generatedFields === true){
			oMockstarPlc.insertTableData("material_price_plc_ext", oMaterialPriceExtTestDataPlc);
			oMockstarPlc.insertTableData("activity_price_ext", oActivityPriceExtTestDataPlc);
		}
		oMockstarPlc.initializeData();
	});

	afterEach(function() {
	});

	function createTestInputObject(iItemIndex,oItemInput,oExtension){

		var oBaseObject = {
				"ITEM_ID":          [oItemInput.ITEM_ID[iItemIndex]],
				"PARENT_ITEM_ID":   [oItemInput.PARENT_ITEM_ID[iItemIndex]],
				"ITEM_CATEGORY_ID": [oItemInput.ITEM_CATEGORY_ID[iItemIndex]],
				"MATERIAL_ID":      [oItemInput.MATERIAL_ID[iItemIndex]],
				"PLANT_ID": 		[oItemInput.PLANT_ID[iItemIndex]],
				"VENDOR_ID": 		[oItemInput.VENDOR_ID[iItemIndex]],
				"ACTIVITY_TYPE_ID": [oItemInput.ACTIVITY_TYPE_ID[iItemIndex]],
				"COST_CENTER_ID": 	[oItemInput.COST_CENTER_ID[iItemIndex]],
				"PRICE_SOURCE_ID": 	[oItemInput.PRICE_SOURCE_ID[iItemIndex]],
				"PRICE_SOURCE_TYPE_ID": 	[oItemInput.PRICE_SOURCE_TYPE_ID[iItemIndex]],
				"CONFIDENCE_LEVEL_ID": 	[oItemInput.CONFIDENCE_LEVEL_ID[iItemIndex]],
				"PRICE_FIXED_PORTION": 			    [oItemInput.PRICE_FIXED_PORTION[iItemIndex]],
				"PRICE_VARIABLE_PORTION": 		    [oItemInput.PRICE_VARIABLE_PORTION[iItemIndex]],	
				"TRANSACTION_CURRENCY_ID":    [oItemInput.TRANSACTION_CURRENCY_ID[iItemIndex]],
				"PRICE_UNIT": 					    [oItemInput.PRICE_UNIT[iItemIndex]],
				"PRICE_UNIT_UOM_ID": 			    [oItemInput.PRICE_UNIT_UOM_ID[iItemIndex]],
				"IS_DISABLING_PRICE_DETERMINATION": [oItemInput.IS_DISABLING_PRICE_DETERMINATION[iItemIndex]],
				"PURCHASING_GROUP": 			    [oItemInput.PURCHASING_GROUP[iItemIndex]],
				"PURCHASING_DOCUMENT": 			    [oItemInput.PURCHASING_DOCUMENT[iItemIndex]],
				"LOCAL_CONTENT": 			        [oItemInput.LOCAL_CONTENT[iItemIndex]]
		};
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			var oBaseObjectExt = {
				"ITEM_ID"                          : [oItemExtInputTestData.ITEM_ID[iItemIndex]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemExtInputTestData.CMPR_BOOLEAN_INT_MANUAL[iItemIndex]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemExtInputTestData.CMPR_BOOLEAN_INT_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemExtInputTestData.CMPR_DECIMAL_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemExtInputTestData.CMPR_DECIMAL_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemExtInputTestData.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemExtInputTestData.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemExtInputTestData.CMPR_DECIMAL_WITH_UOM_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemExtInputTestData.CMPR_DECIMAL_WITH_UOM_UNIT[iItemIndex]],
	    		"CAPR_DECIMAL_MANUAL"              : [oItemExtInputTestData.CAPR_DECIMAL_MANUAL[iItemIndex]],
			    "CAPR_DECIMAL_UNIT"                : [oItemExtInputTestData.CAPR_DECIMAL_UNIT[iItemIndex]]
			};
			return _.extend({}, oBaseObject, oBaseObjectExt, oExtension)
		}

		return _.extend({}, oBaseObject, oExtension)

	}

	it('should determine prices automatically for import (for item categories: Material, Internal Activity)', function() {

		var iIndexMaterial = 0;
		var iIndexActivity = 2;
		var iIndexMaterialVendor = 4;
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0),
							  mockstar_helpers.convertToObject(oItemInput, 2),
							  mockstar_helpers.convertToObject(oItemInput, 4)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexMaterialPrice = 7;
		var iIndexActivityPrice = 0;
		var iIndexMaterialVendorPrice = 7;
		var iIndexPriceSourceMaterial = 1;
		var iIndexPriceSourceActivity = 4;
		var iIndexPriceSourceMaterialVendor = 1;
		var iIndexMaterialVendorPriceExt = 5;
		
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial], oItemInput.ITEM_ID[iIndexActivity], oItemInput.ITEM_ID[iIndexMaterialVendor]],
			"VENDOR_ID":            [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexMaterialPrice], null, oMaterialPriceTestDataPlc.VENDOR_ID[iIndexMaterialVendorPrice]],
			"PRICE_FIXED_PORTION": 	[oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexMaterialPrice], oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexActivityPrice], oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexMaterialVendorPrice]],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice], oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexActivityPrice], oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialVendorPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice], oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexActivityPrice], oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialVendorPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice], oActivityPriceTestDataPlc.PRICE_UNIT[iIndexActivityPrice], oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialVendorPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice], oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexActivityPrice], oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialVendorPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial], oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceActivity], oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterialVendor]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterial], oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceActivity], oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterialVendor]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterial], oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceActivity], oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterialVendor]],
		    "PURCHASING_GROUP":             [oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialPrice], null, oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialVendorPrice]],
		    "PURCHASING_DOCUMENT":          [oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialPrice], null, oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialVendorPrice]],
		    "LOCAL_CONTENT":                [oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialPrice], null, oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialVendorPrice]]
		}, ["ITEM_ID"]);

		expect(oMessages).toMatchData({
			"ITEM_ID":  [oItemInput.ITEM_ID[iIndexMaterial], oItemInput.ITEM_ID[iIndexActivity], oItemInput.ITEM_ID[iIndexMaterialVendor]],
			"MSG_ID": 	[messageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code,messageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code, messageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code]
		}, ["MSG_ID","ITEM_ID"]);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID"                          : [oItemInput.ITEM_ID[iIndexMaterial], oItemInput.ITEM_ID[iIndexActivity], oItemInput.ITEM_ID[iIndexMaterialVendor]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexMaterialVendorPriceExt], null, oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexMaterialVendorPriceExt]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexMaterialVendorPriceExt], null, oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexMaterialVendorPriceExt]],
	    		"CMPR_DECIMAL_MANUAL"              : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexMaterialVendorPriceExt], null, oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexMaterialVendorPriceExt]],
	    		"CMPR_DECIMAL_UNIT"                : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexMaterialVendorPriceExt], null, oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexMaterialVendorPriceExt]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexMaterialVendorPriceExt], null, oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexMaterialVendorPriceExt]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexMaterialVendorPriceExt], null, oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexMaterialVendorPriceExt]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexMaterialVendorPriceExt], null, oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexMaterialVendorPriceExt]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexMaterialVendorPriceExt], null, oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexMaterialVendorPriceExt]],
	    		"CAPR_DECIMAL_MANUAL"              : [null, null, null],
                "CAPR_DECIMAL_UNIT"                : [null, null, null]
			}, ["ITEM_ID"]);
		}
		
	});

	it('should not determine prices automatically for import (set: Manual Price for Material/Internal Activity)', function() {
		//arrange	
		var iItemIndex1 = 0;
		var oItemInput1 = createTestInputObject(iItemIndex1,oItemInput,{
			"MATERIAL_ID":      ["MAT2"]
		});
		var iItemIndex2 = 2;
		var oItemInput2 = createTestInputObject(iItemIndex2,oItemInput,{
			"COST_CENTER_ID":      ["CC3"]
		});

		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput1, 0),
							  mockstar_helpers.convertToObject(oItemInput2, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexPriceSource = 7;
		expect(oEntity).toMatchData({			
			"ITEM_ID":           	[oItemInput.ITEM_ID[iItemIndex1],oItemInput.ITEM_ID[iItemIndex2]],
			"PRICE_FIXED_PORTION": 	[oItemInput.PRICE_FIXED_PORTION[iItemIndex1],oItemInput.PRICE_FIXED_PORTION[iItemIndex2]],
			"PRICE_VARIABLE_PORTION":[oItemInput.PRICE_VARIABLE_PORTION[iItemIndex1],oItemInput.PRICE_VARIABLE_PORTION[iItemIndex2]],
			"TRANSACTION_CURRENCY_ID":[oItemInput.TRANSACTION_CURRENCY_ID[iItemIndex1],oItemInput.TRANSACTION_CURRENCY_ID[iItemIndex2]],
			"PRICE_UNIT":[oItemInput.PRICE_UNIT[iItemIndex1],oItemInput.PRICE_UNIT[iItemIndex2]],
			"PRICE_UNIT_UOM_ID":[oItemInput.PRICE_UNIT_UOM_ID[iItemIndex1],oItemInput.PRICE_UNIT_UOM_ID[iItemIndex2]],
			"CONFIDENCE_LEVEL_ID":[oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSource],oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSource]],
			"PRICE_SOURCE_ID":[oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource],oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource]],
		    "PRICE_SOURCE_TYPE_ID":[oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSource],oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSource]],
		    "PURCHASING_GROUP":[oItemInput.PURCHASING_GROUP[iItemIndex1],oItemInput.PURCHASING_GROUP[iItemIndex2]],
		    "PURCHASING_DOCUMENT":[oItemInput.PURCHASING_DOCUMENT[iItemIndex1],oItemInput.PURCHASING_DOCUMENT[iItemIndex2]],
		    "LOCAL_CONTENT":[oItemInput.LOCAL_CONTENT[iItemIndex1],oItemInput.LOCAL_CONTENT[iItemIndex2]]
		}, ["ITEM_ID"]);

		expect(oMessages).toMatchData({
			"ITEM_ID":  [oItemInput.ITEM_ID[iItemIndex1],oItemInput.ITEM_ID[iItemIndex2]],
			"MSG_ID": 	[messageCode.PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING.code,
			          	 messageCode.PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING.code]
		}, ["MSG_ID","ITEM_ID"]);

		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[iItemIndex1], oItemInput.ITEM_ID[iItemIndex2]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemInput.CMPR_BOOLEAN_INT_MANUAL[iItemIndex1],null],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemInput.CMPR_BOOLEAN_INT_UNIT[iItemIndex1], null],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemInput.CMPR_DECIMAL_MANUAL[iItemIndex1], null],
	    		"CMPR_DECIMAL_UNIT"                : [oItemInput.CMPR_DECIMAL_UNIT[iItemIndex1], null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iItemIndex1], null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iItemIndex1], null],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemInput.CMPR_DECIMAL_WITH_UOM_MANUAL[iItemIndex1], null],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemInput.CMPR_DECIMAL_WITH_UOM_UNIT[iItemIndex1], null],
	    		"CAPR_DECIMAL_MANUAL"              : [null, oItemInput.CAPR_DECIMAL_MANUAL[iItemIndex2]],
                "CAPR_DECIMAL_UNIT"                : [null, oItemInput.CAPR_DECIMAL_UNIT[iItemIndex2]]
			}, ["ITEM_ID"]);
		}

		expect(1).toBeDefined();
		
	});
	
	it('should determina correct price sources for import (for item categorie: External Activity)', function() {
	    var iIndexExternalActivity = 2;
		var oItemInput1 = createTestInputObject(iIndexExternalActivity,oItemInput,{
			"ITEM_CATEGORY_ID": [4],
			"PLANT_ID": ["1000"]
		});
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput1, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexPriceSourceActivity = 7;
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexExternalActivity]],
			"VENDOR_ID":            [oItemInput.VENDOR_ID[iIndexExternalActivity]],
			"PRICE_FIXED_PORTION": 	[oItemInput.PRICE_FIXED_PORTION[iIndexExternalActivity]],
			"PRICE_VARIABLE_PORTION":[oItemInput.PRICE_VARIABLE_PORTION[iIndexExternalActivity]],
			"TRANSACTION_CURRENCY_ID":[oItemInput.TRANSACTION_CURRENCY_ID[iIndexExternalActivity]],
			"PRICE_UNIT":                   [oItemInput.PRICE_UNIT[iIndexExternalActivity]],
			"PRICE_UNIT_UOM_ID":            [oItemInput.PRICE_UNIT_UOM_ID[iIndexExternalActivity]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceActivity]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceActivity]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceActivity]],
		    "PURCHASING_GROUP":             [oItemInput.PURCHASING_GROUP[iIndexExternalActivity]],
		    "PURCHASING_DOCUMENT":          [oItemInput.PURCHASING_DOCUMENT[iIndexExternalActivity]],
		    "LOCAL_CONTENT":                [oItemInput.LOCAL_CONTENT[iIndexExternalActivity]]
		}, ["ITEM_ID"]);

		expect(oMessages).toMatchData({
			"ITEM_ID":  [oItemInput.ITEM_ID[iIndexExternalActivity]],
			"MSG_ID": 	[messageCode.PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING.code]
		}, ["MSG_ID","ITEM_ID"]);
	});
	
	it('should check if a record having IS_DISABLING_PRICE_DETERMINATION(set to X) is valid', function() {
		
		//arrange
		var iIndexMaterial = 0;
		var iIndexMaterialPrice = 0;
		var iIndexPriceSourceMaterial = 1;
		var oItemInput1 = createTestInputObject(iIndexMaterial,oItemInput,{
			"VENDOR_ID":            [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexMaterialPrice]],
			"PRICE_FIXED_PORTION": 	[oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexMaterialPrice]],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterial]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterial]],
		    "PURCHASING_GROUP":             [oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialPrice]],
		    "PURCHASING_DOCUMENT":          [oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialPrice]],
		    "LOCAL_CONTENT":                [oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialPrice]],
		    "IS_DISABLING_PRICE_DETERMINATION": [1]
		});
		
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput1, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
			"VENDOR_ID":            [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexMaterialPrice]],
			"PRICE_FIXED_PORTION": 	[oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexMaterialPrice]],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterial]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterial]],
		    "PURCHASING_GROUP":             [oItemInput1.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [oItemInput1.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [oItemInput1.LOCAL_CONTENT[0]],
		}, ["ITEM_ID"]);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemInput.CMPR_BOOLEAN_INT_MANUAL[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemInput.CMPR_BOOLEAN_INT_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemInput.CMPR_DECIMAL_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemInput.CMPR_DECIMAL_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemInput.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemInput.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexMaterial]],
	    		"CAPR_DECIMAL_MANUAL"              : [null],
	    		"CAPR_DECIMAL_UNIT"                : [null]
			}, ["ITEM_ID"]);
		}
		
	});
	
	it('should convert items with IS_PRICE_SLIT_ACTIVE = true for which a price was not found to Manual Price and change price fixed and variable', function() {
		// Items with IS_PRICE_SPLIT_ACTIVE = 1 and for which the prices were deleted, or not valid, or not determined, the following logic is tested:
		// 	-> Manual prices take the value from calculated prices. (Price Components' total prices become the manual prices)
		// 	-> is_price_split_active is set to 0, so that the manual prices are taken into account instead of the calculated prices.
		
		// arrange	

		let iItemIndex1 = 0;
		let oMaterialItemInput = createTestInputObject(iItemIndex1,oItemInput,{
			"IS_PRICE_SPLIT_ACTIVE":    [1],
			"PRICE_ID":					["ABCDE"]					
		});
		let iItemIndex2 = 2;
		let oActivityItemInput = createTestInputObject(iItemIndex2,oItemInput,{
			"IS_PRICE_SPLIT_ACTIVE":      [1],
			"PRICE_ID":					["FGHI"],
			"PRICE_SOURCE_ID":			["PLC_STANDARD_PRICE"]
		});

		let lt_items_input = [mockstar_helpers.convertToObject(oMaterialItemInput, 0),
							  mockstar_helpers.convertToObject(oActivityItemInput, 0)];

		let lv_version_adapted =  {
			MASTER_DATA_TIMESTAMP: [sMasterdataTimestampDate],
			VALUATION_DATE: [sMasterdataTimestampDate],
			REPORT_CURRENCY_ID: [sReportingCurrency],
			CONTROLLING_AREA_ID: [sControllingArea],
			PROJECT_ID: [sProjectId],
			CUSTOMER_ID: [null],
			MATERIAL_PRICE_STRATEGY_ID: ["PLC_STANDARD"],
			ACTIVITY_PRICE_STRATEGY_ID: ["PLC_STANDARD"]
		};
		let lt_version_input = [mockstar_helpers.convertToObject(lv_version_adapted, 0)];

		var sOldValidTo = new Date(2015, 8, 20, 2, 1, 2).toJSON();
		oMockstarPlc.execSingle(`UPDATE {{material_price_plc}} SET VALID_TO = '${sOldValidTo}' WHERE MATERIAL_ID = '${oMaterialItemInput.MATERIAL_ID[0]}'`);
		oMockstarPlc.execSingle(`UPDATE {{activity_price}} SET VALID_TO = '${sOldValidTo}' WHERE ACTIVITY_TYPE_ID = '${oActivityItemInput.ACTIVITY_TYPE_ID[0]}'`);

		// act
		let procedure = oMockstarPlc.loadProcedure();
		let result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		// assert
		let oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		expect(oEntity).toMatchData({			
			"ITEM_ID":           	[oItemInput.ITEM_ID[iItemIndex1],oItemInput.ITEM_ID[iItemIndex2]],
			"PRICE_FIXED_PORTION": 	[ItemTempTestDataPlc.PRICE_FIXED_PORTION_CALCULATED[0],ItemTempTestDataPlc.PRICE_FIXED_PORTION_CALCULATED[1]],
			"PRICE_VARIABLE_PORTION":[ItemTempTestDataPlc.PRICE_VARIABLE_PORTION_CALCULATED[0],ItemTempTestDataPlc.PRICE_VARIABLE_PORTION_CALCULATED[1]],
			"IS_PRICE_SPLIT_ACTIVE": [0, 0],
			"PRICE_ID": [null, null],
			"PRICE_SOURCE_ID":["PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE"],
		    "PRICE_SOURCE_TYPE_ID":[3, 3],
			"TRANSACTION_CURRENCY_ID":[oItemInput.TRANSACTION_CURRENCY_ID[iItemIndex1],oItemInput.TRANSACTION_CURRENCY_ID[iItemIndex2]],
			"PRICE_UNIT":[oItemInput.PRICE_UNIT[iItemIndex1],oItemInput.PRICE_UNIT[iItemIndex2]],
			"PRICE_UNIT_UOM_ID":[oItemInput.PRICE_UNIT_UOM_ID[iItemIndex1],oItemInput.PRICE_UNIT_UOM_ID[iItemIndex2]],
			"CONFIDENCE_LEVEL_ID":[null, null],
		    "PURCHASING_GROUP":[oItemInput.PURCHASING_GROUP[iItemIndex1],oItemInput.PURCHASING_GROUP[iItemIndex2]],
		    "PURCHASING_DOCUMENT":[oItemInput.PURCHASING_DOCUMENT[iItemIndex1],oItemInput.PURCHASING_DOCUMENT[iItemIndex2]],
		    "LOCAL_CONTENT":[oItemInput.LOCAL_CONTENT[iItemIndex1],oItemInput.LOCAL_CONTENT[iItemIndex2]]
		}, ["ITEM_ID"]);
	});
	
	it('should check if a record having IS_DISABLING_PRICE_DETERMINATION(set to X) is not valid and change the Price Source to Manual Price', function() {
		
		//arrange
		var iIndexMaterial = 0;
		var iIndexMaterialPrice = 0;
		var iIndexPriceSourceMaterial = 1;
		var oItemInput1 = createTestInputObject(iIndexMaterial,oItemInput,{
			"VENDOR_ID":            [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexMaterialPrice]],
			"PRICE_FIXED_PORTION": 	["800.0000000"],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterial]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterial]],
		    "PURCHASING_GROUP":             [oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialPrice]],
		    "PURCHASING_DOCUMENT":          [oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialPrice]],
		    "LOCAL_CONTENT":                [oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialPrice]],
		    "IS_DISABLING_PRICE_DETERMINATION": [1]
		});
		
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput1, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexPriceSource = 7;

		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
			"VENDOR_ID":            [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexMaterialPrice]],
			"PRICE_FIXED_PORTION": 	["800.0000000"],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSource]],
		    "PURCHASING_GROUP":             [oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialPrice]],
		    "PURCHASING_DOCUMENT":          [oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialPrice]],
            "LOCAL_CONTENT":                [oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialPrice]]
		}, ["ITEM_ID"]);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemInput.CMPR_BOOLEAN_INT_MANUAL[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemInput.CMPR_BOOLEAN_INT_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemInput.CMPR_DECIMAL_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemInput.CMPR_DECIMAL_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemInput.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemInput.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexMaterial]],
	    		"CAPR_DECIMAL_MANUAL"              : [oItemInput.CAPR_DECIMAL_MANUAL[iIndexMaterial]],
	    		"CAPR_DECIMAL_UNIT"                : [oItemInput.CAPR_DECIMAL_UNIT[iIndexMaterial]]
			}, ["ITEM_ID"]);
		}
		
	});

	it('should check if item with ITEM_CATEGORY_ID 5 is not valid and change the Price Source to Manual Price', function() {
		
		var oItemInput2 = {
			"ITEM_ID":                          [3001,3002,3003, 3004, 3005,3006,3007],
			"PARENT_ITEM_ID":                   [1337,1337,1337,1337,1337,1337,1337],
			"ITEM_CATEGORY_ID":                 [5,2,3,1,2,2,2],
			"MATERIAL_ID":                      ["#100-110","MAT1","","MAT2","#100-110","#100-110","#100-110"],
			"PLANT_ID": 		                ["#PT1","PL2","","","#PT1","#PT1","#PT1"],
			"VENDOR_ID":                        ["","","","","V1","V1",''],
			"ACTIVITY_TYPE_ID":                 ["","","#AT2","","","",""],
			"COST_CENTER_ID": 	                ["","","#CC1","","CC1","CC1","CC1"],
			"PRICE_SOURCE_ID": 	                ["","PLC_ERP_PRICE","","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE"],
			"PRICE_SOURCE_TYPE_ID":             [1,1,2,1,1,1,1],
			"CONFIDENCE_LEVEL_ID":              [null,null,null,null,4,null,null],
			"PRICE_FIXED_PORTION": 			    ["5000.0000000","200.0000000","480.4500000","200.0000000","480.4500000","100.0000000","100.0000000"],
			"PRICE_VARIABLE_PORTION": 		    ["0.0000000","20.0000000","35.4500000","35.4500000","35.4500000","20.0000000","20.0000000"],
			"TRANSACTION_CURRENCY_ID":    		['EUR','EUR','EUR','EUR','EUR','EUR','EUR'],
			"PRICE_UNIT": 					    ["1.0000000","10.0000000","100.0000000","100.0000000","100.0000000","100.0000000","100.0000000"],
			"PRICE_UNIT_UOM_ID": 			    ['H','H','H','H','H','H','H'],
			"IS_DISABLING_PRICE_DETERMINATION": [null,null,null,null,1,null,null],
			"PURCHASING_GROUP": 			    ["p1","p2","p3","p4","","",""],
			"PURCHASING_DOCUMENT": 			    ["123","234","567","","","",""],
			"LOCAL_CONTENT": 			        ["10.0000000","50.0000000","80.0000000","80.0000000","80.0000000","80.0000000","80.0000000"]
	};
		
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput2, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	

		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput2.ITEM_ID[0]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[7]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[7]]
		}, ["ITEM_ID","PRICE_SOURCE_ID","PRICE_SOURCE_TYPE_ID"]);
	});

	it('should check if item with ITEM_CATEGORY_ID 7 is not valid and change the Price Source to Manual Price', function() {
		
		var oItemInput2 = {
			"ITEM_ID":                          [3001,3002,3003, 3004, 3005,3006,3007],
			"PARENT_ITEM_ID":                   [1337,1337,1337,1337,1337,1337,1337],
			"ITEM_CATEGORY_ID":                 [7,2,3,1,2,2,2],
			"MATERIAL_ID":                      ["#100-110","MAT1","","MAT2","#100-110","#100-110","#100-110"],
			"PLANT_ID": 		                ["#PT1","PL2","","","#PT1","#PT1","#PT1"],
			"VENDOR_ID":                        ["","","","","V1","V1",''],
			"ACTIVITY_TYPE_ID":                 ["","","#AT2","","","",""],
			"COST_CENTER_ID": 	                ["","","#CC1","","CC1","CC1","CC1"],
			"PRICE_SOURCE_ID": 	                ["","PLC_ERP_PRICE","","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE"],
			"PRICE_SOURCE_TYPE_ID":             [1,1,2,1,1,1,1],
			"CONFIDENCE_LEVEL_ID":              [null,null,null,null,4,null,null],
			"PRICE_FIXED_PORTION": 			    ["5000.0000000","200.0000000","480.4500000","200.0000000","480.4500000","100.0000000","100.0000000"],
			"PRICE_VARIABLE_PORTION": 		    ["0.0000000","20.0000000","35.4500000","35.4500000","35.4500000","20.0000000","20.0000000"],
			"TRANSACTION_CURRENCY_ID":    		['EUR','EUR','EUR','EUR','EUR','EUR','EUR'],
			"PRICE_UNIT": 					    ["1.0000000","10.0000000","100.0000000","100.0000000","100.0000000","100.0000000","100.0000000"],
			"PRICE_UNIT_UOM_ID": 			    ['H','H','H','H','H','H','H'],
			"IS_DISABLING_PRICE_DETERMINATION": [null,null,null,null,1,null,null],
			"PURCHASING_GROUP": 			    ["p1","p2","p3","p4","","",""],
			"PURCHASING_DOCUMENT": 			    ["123","234","567","","","",""],
			"LOCAL_CONTENT": 			        ["10.0000000","50.0000000","80.0000000","80.0000000","80.0000000","80.0000000","80.0000000"]
	};
		
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput2, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	

		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput2.ITEM_ID[0]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[7]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[7]]
		}, ["ITEM_ID","PRICE_SOURCE_ID","PRICE_SOURCE_TYPE_ID"]);
	});
	
	it('should check if item with ITEM_CATEGORY_ID 8 is not valid and change the Price Source to Manual Price', function() {
		
		var oItemInput2 = {
			"ITEM_ID":                          [3001,3002,3003, 3004, 3005,3006,3007],
			"PARENT_ITEM_ID":                   [1337,1337,1337,1337,1337,1337,1337],
			"ITEM_CATEGORY_ID":                 [8,2,3,1,2,2,2],
			"MATERIAL_ID":                      ["#100-110","MAT1","","MAT2","#100-110","#100-110","#100-110"],
			"PLANT_ID": 		                ["#PT1","PL2","","","#PT1","#PT1","#PT1"],
			"VENDOR_ID":                        ["","","","","V1","V1",''],
			"ACTIVITY_TYPE_ID":                 ["","","#AT2","","","",""],
			"COST_CENTER_ID": 	                ["","","#CC1","","CC1","CC1","CC1"],
			"PRICE_SOURCE_ID": 	                ["","PLC_ERP_PRICE","","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE"],
			"PRICE_SOURCE_TYPE_ID":             [1,1,2,1,1,1,1],
			"CONFIDENCE_LEVEL_ID":              [null,null,null,null,4,null,null],
			"PRICE_FIXED_PORTION": 			    ["5000.0000000","200.0000000","480.4500000","200.0000000","480.4500000","100.0000000","100.0000000"],
			"PRICE_VARIABLE_PORTION": 		    ["0.0000000","20.0000000","35.4500000","35.4500000","35.4500000","20.0000000","20.0000000"],
			"TRANSACTION_CURRENCY_ID":    		['EUR','EUR','EUR','EUR','EUR','EUR','EUR'],
			"PRICE_UNIT": 					    ["1.0000000","10.0000000","100.0000000","100.0000000","100.0000000","100.0000000","100.0000000"],
			"PRICE_UNIT_UOM_ID": 			    ['H','H','H','H','H','H','H'],
			"IS_DISABLING_PRICE_DETERMINATION": [null,null,null,null,1,null,null],
			"PURCHASING_GROUP": 			    ["p1","p2","p3","p4","","",""],
			"PURCHASING_DOCUMENT": 			    ["123","234","567","","","",""],
			"LOCAL_CONTENT": 			        ["10.0000000","50.0000000","80.0000000","80.0000000","80.0000000","80.0000000","80.0000000"]
	};
		
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput2, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	

		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput2.ITEM_ID[0]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[7]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[7]]
		}, ["ITEM_ID","PRICE_SOURCE_ID","PRICE_SOURCE_TYPE_ID"]);
	});
	
	it('should determine the price for an item of category external activity', function() {
		oMockstarPlc.insertTableData("price_source", mockstar_helpers.convertToObject(testData.oPriceSourceTestDataPlc,0));
		oMockstarPlc.insertTableData("material_price_plc", {
														"PRICE_ID": ["5C0000E0B2BDB9671600A4000936462B"],
														"PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE"],
														"MATERIAL_ID": ["MAT2"],
														"PLANT_ID": ["*"],
														"VENDOR_ID": ["*"],
														"PROJECT_ID": ["*"],
														"CUSTOMER_ID": ["*"],
														"VALID_FROM": ["2010-06-19"],
														"VALID_FROM_QUANTITY": [1],
														"PRICE_FIXED_PORTION": [123],
														"PRICE_VARIABLE_PORTION": [234],
														"TRANSACTION_CURRENCY_ID": ["EUR"],
														"PRICE_UNIT": [1],
														"PRICE_UNIT_UOM_ID": ["MC"],
												        "_VALID_FROM": ["2010-06-19T12:27:23.197Z"],
												        "_SOURCE": [1],
														"_CREATED_BY": ["U000930"]
											});
		
	    var iIndexExternalActivity = 2;
		var oItemInput1 = createTestInputObject(iIndexExternalActivity,oItemInput,{
			"ITEM_CATEGORY_ID": [4],
			"MATERIAL_ID":["MAT2"]
		});
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput1, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		expect(oEntity).toMatchData({
                    			"ITEM_ID":           	3003,
                    			"VENDOR_ID":            '',
                    			"PRICE_FIXED_PORTION": 	'123.0000000',
                    			"PRICE_VARIABLE_PORTION": '234.0000000',
                    			"TRANSACTION_CURRENCY_ID": 'EUR',
                    			"PRICE_UNIT":           '1.0000000',
                    			"PRICE_UNIT_UOM_ID":            'MC',
                    			"PRICE_SOURCE_ID":              'PLC_PROJECT_PRICE',
                    		    "PRICE_SOURCE_TYPE_ID":            1
		}, ["ITEM_ID"]);

		expect(oMessages).toMatchData({
			"ITEM_ID":  3003,
			"MSG_ID": 	messageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code
		}, ["MSG_ID","ITEM_ID"]);
	});

	const parametersSortedMaterialPrices = [
		{description: "should determine best prices for items ordered by new", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcDefaultAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_ID[3], testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_ID[1]],
			"VENDOR_ID": 			["", ""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_VARIABLE_PORTION[3], testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcDefaultAll.TRANSACTION_CURRENCY_ID[3], testData.oMaterialPriceTestDataPlcDefaultAll.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_UNIT[3], testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_UNIT_UOM_ID[3], testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_UNIT_UOM_ID[1]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_SOURCE_ID[3], testData.oMaterialPriceTestDataPlcDefaultAll.PRICE_SOURCE_ID[1]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcDefaultAll.PURCHASING_GROUP[3], testData.oMaterialPriceTestDataPlcDefaultAll.PURCHASING_GROUP[1]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcDefaultAll.PURCHASING_DOCUMENT[3], testData.oMaterialPriceTestDataPlcDefaultAll.PURCHASING_DOCUMENT[1]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcDefaultAll.LOCAL_CONTENT[3], testData.oMaterialPriceTestDataPlcDefaultAll.LOCAL_CONTENT[1]]
		}},
		{description: "should determine best prices for items ordered by plant", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcPlantAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcPlantAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcPlantAll.PRICE_ID[0]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcPlantAll.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcPlantAll.VENDOR_ID[0]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcPlantAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcPlantAll.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcPlantAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcPlantAll.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcPlantAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcPlantAll.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcPlantAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcPlantAll.PRICE_UNIT_UOM_ID[0]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcPlantAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcPlantAll.PRICE_SOURCE_ID[0]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcPlantAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcPlantAll.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcPlantAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcPlantAll.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcPlantAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcPlantAll.LOCAL_CONTENT[0]]
		}},
		{description: "should determine best prices for items ordered by vendor", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcVendorAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorAll.PRICE_ID[0]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorAll.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcVendorAll.VENDOR_ID[0]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorAll.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorAll.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorAll.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorAll.PRICE_UNIT_UOM_ID[0]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorAll.PRICE_SOURCE_ID[0]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorAll.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorAll.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorAll.LOCAL_CONTENT[0]]
		}},
		{description: "should determine best prices for items ordered by project", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcProjectAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcProjectAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcProjectAll.PRICE_ID[1]],
			"VENDOR_ID": 			["",""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcProjectAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcProjectAll.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcProjectAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcProjectAll.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcProjectAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcProjectAll.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcProjectAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcProjectAll.PRICE_UNIT_UOM_ID[1]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcProjectAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcProjectAll.PRICE_SOURCE_ID[1]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcProjectAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcProjectAll.PURCHASING_GROUP[1]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcProjectAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcProjectAll.PURCHASING_DOCUMENT[1]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcProjectAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcProjectAll.LOCAL_CONTENT[1]]
		}},
		{description: "should determine best prices for items ordered by customer", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oMaterialPriceTestDataPlcCustomerAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_ID[3], testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_ID[0]],
			"VENDOR_ID": 			["",""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_VARIABLE_PORTION[3], testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcCustomerAll.TRANSACTION_CURRENCY_ID[3], testData.oMaterialPriceTestDataPlcCustomerAll.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_UNIT[3], testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_UNIT_UOM_ID[3], testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_UNIT_UOM_ID[0]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_SOURCE_ID[3], testData.oMaterialPriceTestDataPlcCustomerAll.PRICE_SOURCE_ID[0]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcCustomerAll.PURCHASING_GROUP[3], testData.oMaterialPriceTestDataPlcCustomerAll.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcCustomerAll.PURCHASING_DOCUMENT[3], testData.oMaterialPriceTestDataPlcCustomerAll.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcCustomerAll.LOCAL_CONTENT[3], testData.oMaterialPriceTestDataPlcCustomerAll.LOCAL_CONTENT[0]]
		}},
		{description: "should determine best prices for items, match on new (vendor second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_ID[0]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.VENDOR_ID[0]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_UNIT_UOM_ID[0]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PRICE_SOURCE_ID[0]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchNewAll.LOCAL_CONTENT[0]]
		}},
		{description: "should determine best prices for items, match on vendor (vendor second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_ID[0]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.VENDOR_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.VENDOR_ID[0]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_UNIT_UOM_ID[0]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PRICE_SOURCE_ID[0]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorSecondMatchVendorAll.LOCAL_CONTENT[0]]
		}},
		{description: "should determine best prices for items, no match on vendor&new (vendor second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_ID[1]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.VENDOR_ID[2], ""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_UNIT_UOM_ID[1]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PRICE_SOURCE_ID[1]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PURCHASING_GROUP[1]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.PURCHASING_DOCUMENT[1]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorSecondNoMatchAll.LOCAL_CONTENT[1]]
		}},
		{description: "should determine best prices for items, match on vendor (vendor first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirst], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_ID[1]],
			"VENDOR_ID": 			["", ""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_UNIT_UOM_ID[1]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PRICE_SOURCE_ID[1]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PURCHASING_GROUP[1]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.PURCHASING_DOCUMENT[1]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchVendorAll.LOCAL_CONTENT[1]]
		}},
		{description: "should determine best prices for items, match on new (vendor first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirst], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_ID[0]],
			"VENDOR_ID": 			["", ""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_UNIT_UOM_ID[0]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PRICE_SOURCE_ID[0]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorFirstMatchNewAll.LOCAL_CONTENT[0]]
		}},
		{description: "should determine best prices for items, no match on vendor&new (vendor first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirst], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_ID[0]],
			"VENDOR_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.VENDOR_ID[2], ""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_UNIT_UOM_ID[0]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PRICE_SOURCE_ID[0]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorFirstNoMatchAll.LOCAL_CONTENT[0]]
		}},
		{description: "should determine best prices for items, match on vendor (vendor first, plant second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirstPlantSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_ID[1]],
			"VENDOR_ID": 			["", ""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_UNIT_UOM_ID[1]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PRICE_SOURCE_ID[1]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PURCHASING_GROUP[1]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.PURCHASING_DOCUMENT[1]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll.LOCAL_CONTENT[1]]
		}},
		{description: "should determine best prices for items, match on plant (vendor first, plant second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirstPlantSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_ID[1]],
			"VENDOR_ID": 			["", ""],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_VARIABLE_PORTION[1]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.TRANSACTION_CURRENCY_ID[1]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_UNIT[1]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_UNIT_UOM_ID[1]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PRICE_SOURCE_ID[1]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PURCHASING_GROUP[1]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.PURCHASING_DOCUMENT[1]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll.LOCAL_CONTENT[1]]
		}},
		{description: "should determine best prices for items,no match on vendor&plant (vendor first, plant second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleVendorFirstPlantSecond], inputPrices: [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll], result: {
			"ITEM_ID":           	[oItemInput.ITEM_ID[0], oItemInput.ITEM_ID[3]],
			"PRICE_ID": 			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_ID[0]],
			"VENDOR_ID": 			["", testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.VENDOR_ID[0]],
			"PRICE_VARIABLE_PORTION":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_VARIABLE_PORTION[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_VARIABLE_PORTION[0]],
			"TRANSACTION_CURRENCY_ID":[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.TRANSACTION_CURRENCY_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.TRANSACTION_CURRENCY_ID[0]],
			"PRICE_UNIT":			[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_UNIT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_UNIT[0]],
			"PRICE_UNIT_UOM_ID":	[testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_UNIT_UOM_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_UNIT_UOM_ID[0]],
			"PRICE_SOURCE_ID":              [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_SOURCE_ID[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PRICE_SOURCE_ID[0]],
		    "PURCHASING_GROUP":             [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PURCHASING_GROUP[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PURCHASING_GROUP[0]],
		    "PURCHASING_DOCUMENT":          [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PURCHASING_DOCUMENT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.PURCHASING_DOCUMENT[0]],
		    "LOCAL_CONTENT":                [testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.LOCAL_CONTENT[2], testData.oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll.LOCAL_CONTENT[0]]
		}},
	];

	parametersSortedMaterialPrices.forEach((p) => {
		it(p.description, function() {
			oMockstarPlc.clearTable('price_determination_strategy_rule');
			oMockstarPlc.insertTableData('price_determination_strategy_rule', p.inputStrategy);

			oMockstarPlc.clearTable('material_price_plc');
			oMockstarPlc.insertTableData('material_price_plc', p.inputPrices);

			oItemInput.PRICE_SOURCE_ID[0] = "PLC_STANDARD_PRICE";

			oItemInput.VENDOR_ID[0] = "V1";
			oItemInput.VENDOR_ID[3] = null;

			var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0),
									mockstar_helpers.convertToObject(oItemInput, 3)];

			const lt_version_input = [mockstar_helpers.convertToObject(oVersionWithCustomer, 0)];

			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

			var oEntity = Array.slice(result.OT_DETERMINED_PRICES);
			expect(oEntity).toMatchData(p.result, ["ITEM_ID", "PRICE_ID", "VENDOR_ID", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID", "PRICE_UNIT", "PRICE_UNIT_UOM_ID", "PRICE_SOURCE_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT"]);
		});
	});
	const parametersSortedActivityPrices = [
			{description: "should determine best price for activity item ordered by controlling area", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultCA], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcDefaultCA.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcDefaultCA.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcDefaultCA.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcDefaultCA.PRICE_UNIT_UOM_ID[0]],
			}},
			{description: "should determine best price for activity item ordered by new", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultNew], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcDefaultNew.PRICE_ID[1]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcDefaultNew.PRICE_FIXED_PORTION[1]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcDefaultNew.PRICE_UNIT[1]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcDefaultNew.PRICE_UNIT_UOM_ID[1]],
			}},
			{description: "should determine best price for activity item ordered by cost center", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultCC], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcDefaultCC.PRICE_ID[1]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcDefaultCC.PRICE_FIXED_PORTION[1]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcDefaultCC.PRICE_UNIT[1]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcDefaultCC.PRICE_UNIT_UOM_ID[1]],
			}},
			{description: "should determine best price for activity item ordered by activity type", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultAT], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcDefaultAT.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcDefaultAT.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcDefaultAT.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcDefaultAT.PRICE_UNIT_UOM_ID[0]],
			}},
			{description: "should determine best price for activity item ordered by project", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultProject], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcDefaultProject.PRICE_ID[2]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcDefaultProject.PRICE_FIXED_PORTION[2]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcDefaultProject.PRICE_UNIT[2]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcDefaultProject.PRICE_UNIT_UOM_ID[2]],
			}},
			{description: "should determine best price for activity item ordered by customer", inputStrategy: [testData.oPriceDeterminationStrategyRuleDefault], inputPrices: [testData.oActivityPriceTestDataPlcDefaultCustomer], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcDefaultCustomer.PRICE_UNIT_UOM_ID[0]],
			}},
			{description: "should determine best price for activity item, match on CA (activity type second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATSecond], inputPrices: [testData.oActivityPriceTestDataPlcATSecondMatchCA], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcDefaultCA.PRICE_ID[1]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcDefaultCA.PRICE_FIXED_PORTION[1]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcDefaultCA.PRICE_UNIT[1]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcDefaultCA.PRICE_UNIT_UOM_ID[1]],
			}},
			{description: "should determine best price for activity item, match on AT (activity type second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATSecond], inputPrices: [testData.oActivityPriceTestDataPlcATSecondMatchAT], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_ID[1]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_FIXED_PORTION[1]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_UNIT[1]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcATSecondMatchAT.PRICE_UNIT_UOM_ID[1]],
			}},
			{description: "should determine best price for activity item, no match on CA&AT (activity type second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATSecond], inputPrices: [testData.oActivityPriceTestDataPlcATSecondNoMatch], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcATSecondNoMatch.PRICE_UNIT_UOM_ID[0]],
			}},
			{description: "should determine best price for activity item, match on AT (activity type first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirst], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstMatchAT], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcATSFirstMatchAT.PRICE_UNIT_UOM_ID[0]],
			}},
			{description: "should determine best price for activity item, match on CA (activity type first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirst], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstMatchCA], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcATSFirstMatchCA.PRICE_UNIT_UOM_ID[0]],
			}},
			{description: "should determine best price for activity item, no match on AT&CA (activity type first order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirst], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstNoMatch], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcATSFirstNoMatch.PRICE_UNIT_UOM_ID[0]],
			}},
			{description: "should determine best price for activity item, match on AT (activity type first, new second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirstNewSec], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_ID[2]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_FIXED_PORTION[2]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_UNIT[2]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchAT.PRICE_UNIT_UOM_ID[2]],
			}},
			{description: "should determine best price for activity item, match on new (activity type first, new second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirstNewSec], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcATSFirstNewSecMatchNew.PRICE_UNIT_UOM_ID[0]],
			}},
			{description: "should determine best price for activity item,no match on AT&new (activity type first, new second order)", inputStrategy: [testData.oPriceDeterminationStrategyRuleActivityATFirstNewSec], inputPrices: [testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch], result: {
				"ITEM_ID":				[oItemInput.ITEM_ID[2]],
				"PRICE_ID":				[testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_ID[0]],
				"VENDOR_ID":			[null],
				"PRICE_FIXED_PORTION":	[testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_FIXED_PORTION[0]],
				"PRICE_UNIT":           [testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_UNIT[0]],
				"PRICE_UNIT_UOM_ID":    [testData.oActivityPriceTestDataPlcATSFirstNewSecNoMatch.PRICE_UNIT_UOM_ID[0]],
			}}
	];

	parametersSortedActivityPrices.forEach((p) => {
			it(p.description, function() {
				oMockstarPlc.clearTable('price_determination_strategy_rule');
				oMockstarPlc.insertTableData('price_determination_strategy_rule', p.inputStrategy);

				oMockstarPlc.clearTable('activity_price');
				oMockstarPlc.insertTableData('activity_price', p.inputPrices);

				var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 2)];

				const lt_version_input = [mockstar_helpers.convertToObject(oVersionWithCustomer, 0)];

				var procedure = oMockstarPlc.loadProcedure();
				var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

				var oEntity = Array.slice(result.OT_DETERMINED_PRICES);
				expect(oEntity).toMatchData(p.result, ["ITEM_ID", "PRICE_ID", "VENDOR_ID", "PRICE_FIXED_PORTION", "PRICE_UNIT", "PRICE_UNIT_UOM_ID"]);
			});
	});

	it('should check if IS_VENDOR_VALUE_FILTER(set to X) determines price with specific vendor', function() {
		//arrange
		var oPriceDeterminationStrategyTestData = {
			"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD"],
			"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1],
			"IS_VENDOR_VALUE_FILTER": [1],
			"IS_VENDOR_GENERIC_FILTER": [0],
			"CREATED_ON" : [sExpectedDate],
			"CREATED_BY" : [sTestUser],
			"LAST_MODIFIED_ON" : [sExpectedDate],
			"LAST_MODIFIED_BY" : [sTestUser]
		};

		oMockstarPlc.clearTable('price_determination_strategy');
        oMockstarPlc.insertTableData('price_determination_strategy', oPriceDeterminationStrategyTestData);

		var iIndexMaterial = 5;
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, iIndexMaterial)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexMaterialPrice = 7;
		var iIndexPriceSourceMaterial = 1;

		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
			"VENDOR_ID":            [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexMaterialPrice]],
			"PRICE_FIXED_PORTION": 	[oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexMaterialPrice]],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterial]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterial]],
		    "PURCHASING_GROUP":             [oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialPrice]],
		    "PURCHASING_DOCUMENT":          [oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialPrice]],
		    "LOCAL_CONTENT":                [oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialPrice]]
		}, ["ITEM_ID"]);

		expect(oMessages).toMatchData({
			"ITEM_ID":  [oItemInput.ITEM_ID[iIndexMaterial]],
			"MSG_ID": 	[messageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code]
		}, ["MSG_ID","ITEM_ID"]);

		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemInput.CMPR_BOOLEAN_INT_MANUAL[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemInput.CMPR_BOOLEAN_INT_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemInput.CMPR_DECIMAL_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemInput.CMPR_DECIMAL_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemInput.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemInput.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexMaterial]],
	    		"CAPR_DECIMAL_MANUAL"              : [null],
	    		"CAPR_DECIMAL_UNIT"                : [null]
			}, ["ITEM_ID"]);
		}
	});

	it('should check if IS_VENDOR_VALUE_FILTER(not set) determines price with or without specific vendor', function() {
		
		//arrange
		var oPriceDeterminationStrategyTestData = {
			"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD"],
			"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1],
			"IS_VENDOR_VALUE_FILTER": [0],
			"IS_VENDOR_GENERIC_FILTER": [0],
			"CREATED_ON" : [sExpectedDate],
			"CREATED_BY" : [sTestUser],
			"LAST_MODIFIED_ON" : [sExpectedDate],
			"LAST_MODIFIED_BY" : [sTestUser]
		};

		var oMaterialPriceTestDataPlc = {
			"PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_VENDOR_PRICE"],
			"MATERIAL_ID": ["#100-110","#100-110"],
			"PLANT_ID": ["#PT1","#PT1"],
			"VENDOR_ID": ["*", "V1"],
			"PROJECT_ID": ["*", "*"],
			"PURCHASING_GROUP":["",""],
			"PURCHASING_DOCUMENT":["",""],
			"LOCAL_CONTENT":["50.0000000", "80.0000000"],
			"PROJECT_ID": ["*", "*"],
			"VALID_FROM": ["2015-07-01T00:00:00Z", "2015-07-01T00:00:00Z"],
			"VALID_TO": ["2999-12-31T00:00:00Z", "2999-12-31T00:00:00Z"],
			"VALID_FROM_QUANTITY": ["1.0000000", "1.0000000"],
			"PRICE_FIXED_PORTION": ["0.0000000", "480.4500000"],
			"PRICE_VARIABLE_PORTION": ["85.5000000", "35.4500000"],
			"TRANSACTION_CURRENCY_ID": ["EUR", "EUR"],
			"PRICE_UNIT": ["10.0000000", "100.0000000"],
			"PRICE_UNIT_UOM_ID": ["PC", "PC"],
	        "_VALID_FROM": ["2015-07-01T12:27:23.197Z", "2015-07-01T12:27:23.197Z"],
	        "_SOURCE": [1, 1],
			"_CREATED_BY": ["I30936", "I055799"]
	};

		oMockstarPlc.clearTable('price_determination_strategy');
        oMockstarPlc.insertTableData('price_determination_strategy', oPriceDeterminationStrategyTestData);
		oMockstarPlc.clearTable('material_price_plc');
        oMockstarPlc.insertTableData('material_price_plc', oMaterialPriceTestDataPlc);

		var iIndexMaterial = 5;
		oItemInput.VENDOR_ID[0] = null;

		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, iIndexMaterial)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexMaterialPrice = 0;
		var iIndexPriceSourceMaterial = 0;

		
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
			"VENDOR_ID":            [''],
			"PRICE_FIXED_PORTION": 	[oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexMaterialPrice]],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterial]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterial]],
		    "PURCHASING_GROUP":             [oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialPrice]],
		    "PURCHASING_DOCUMENT":          [oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialPrice]],
		    "LOCAL_CONTENT":                [oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialPrice]]
		}, ["ITEM_ID"]);

		expect(oMessages).toMatchData({
			"ITEM_ID":  [oItemInput.ITEM_ID[iIndexMaterial]],
			"MSG_ID": 	[messageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code]
		}, ["MSG_ID","ITEM_ID"]);

		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[0]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[0]],
	    		"CMPR_DECIMAL_MANUAL"              : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[0]],
	    		"CMPR_DECIMAL_UNIT"                : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[0]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[0]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[0]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[0]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[0]],
	    		"CAPR_DECIMAL_MANUAL"              : [null],
	    		"CAPR_DECIMAL_UNIT"                : [null]
			}, ["ITEM_ID"]);
		}
	});

	it('should check if IS_VENDOR_GENERIC_FILTER(set to X) determines price with vendor generic(*)', function() {
		
		//arrange
		var oPriceDeterminationStrategyTestData = {
			"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD"],
			"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1],
			"IS_VENDOR_VALUE_FILTER": [0],
			"IS_VENDOR_GENERIC_FILTER": [1],
			"CREATED_ON" : [sExpectedDate],
			"CREATED_BY" : [sTestUser],
			"LAST_MODIFIED_ON" : [sExpectedDate],
			"LAST_MODIFIED_BY" : [sTestUser]
		};

		oMockstarPlc.clearTable('price_determination_strategy');
        oMockstarPlc.insertTableData('price_determination_strategy', oPriceDeterminationStrategyTestData);

		var iIndexMaterial = 6;
		oItemInput.VENDOR_ID[iIndexMaterial] = null;	

		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, iIndexMaterial)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexMaterialPrice = 6;
		var iIndexPriceSourceMaterial = 1;

		
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
			"VENDOR_ID":            [''],
			"PRICE_FIXED_PORTION": 	[oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexMaterialPrice]],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterial]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterial]],
		    "PURCHASING_GROUP":             [oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialPrice]],
		    "PURCHASING_DOCUMENT":          [oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialPrice]],
		    "LOCAL_CONTENT":                [oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialPrice]]
		}, ["ITEM_ID"]);

		expect(oMessages).toMatchData({
			"ITEM_ID":  [oItemInput.ITEM_ID[iIndexMaterial]],
			"MSG_ID": 	[messageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code]
		}, ["MSG_ID","ITEM_ID"]);

		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemInput.CMPR_BOOLEAN_INT_MANUAL[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemInput.CMPR_BOOLEAN_INT_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemInput.CMPR_DECIMAL_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemInput.CMPR_DECIMAL_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemInput.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemInput.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexMaterial]],
	    		"CAPR_DECIMAL_MANUAL"              : [null],
	    		"CAPR_DECIMAL_UNIT"                : [null]
			}, ["ITEM_ID"]);
		}
	});

	it('should check if IS_VENDOR_GENERIC_FILTER(not set) determines price with or without generic vendor', function() {
		
		//arrange
		var oPriceDeterminationStrategyTestData = {
			"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD"],
			"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1],
			"IS_VENDOR_VALUE_FILTER": [0],
			"IS_VENDOR_GENERIC_FILTER": [0],
			"CREATED_ON" : [sExpectedDate],
			"CREATED_BY" : [sTestUser],
			"LAST_MODIFIED_ON" : [sExpectedDate],
			"LAST_MODIFIED_BY" : [sTestUser]
		};

		var oMaterialPriceTestDataPlc = {
			"PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE", "PLC_PROJECT_PRICE"],
			"MATERIAL_ID": ["#100-110","#100-110"],
			"PLANT_ID": ["#PT1","#PT1"],
			"VENDOR_ID": ["*", "V1"],
			"PROJECT_ID": ["*", "*"],
			"PURCHASING_GROUP":["",""],
			"PURCHASING_DOCUMENT":["",""],
			"LOCAL_CONTENT":["50.0000000", "80.0000000"],
			"PROJECT_ID": ["*", "*"],
			"VALID_FROM": ["2015-07-01T00:00:00Z", "2015-07-01T00:00:00Z"],
			"VALID_TO": ["2999-12-31T00:00:00Z", "2999-12-31T00:00:00Z"],
			"VALID_FROM_QUANTITY": ["1.0000000", "1.0000000"],
			"PRICE_FIXED_PORTION": ["0.0000000", "480.4500000"],
			"PRICE_VARIABLE_PORTION": ["85.5000000", "35.4500000"],
			"TRANSACTION_CURRENCY_ID": ["EUR", "EUR"],
			"PRICE_UNIT": ["10.0000000", "100.0000000"],
			"PRICE_UNIT_UOM_ID": ["PC", "PC"],
	        "_VALID_FROM": ["2015-07-01T12:27:23.197Z", "2015-07-01T12:27:23.197Z"],
	        "_SOURCE": [1, 1],
			"_CREATED_BY": ["I30936", "I055799"]
	};

		oMockstarPlc.clearTable('price_determination_strategy');
        oMockstarPlc.insertTableData('price_determination_strategy', oPriceDeterminationStrategyTestData);
		oMockstarPlc.clearTable('material_price_plc');
        oMockstarPlc.insertTableData('material_price_plc', oMaterialPriceTestDataPlc);

		var iIndexMaterial = 6;
		oItemInput.VENDOR_ID[iIndexMaterial] = null;

		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, iIndexMaterial)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(iCalcVersId, lt_items_input, lt_version_input);

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexMaterialPrice = 1;
		var iIndexPriceSourceMaterial = 0;

		
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
			"VENDOR_ID":            [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexMaterialPrice]],
			"PRICE_FIXED_PORTION": 	[oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexMaterialPrice]],
			"PRICE_VARIABLE_PORTION":[oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexMaterialPrice]],
			"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexMaterialPrice]],
			"PRICE_UNIT":                   [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexMaterialPrice]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexMaterialPrice]],
			"CONFIDENCE_LEVEL_ID":          [oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceMaterial]],
			"PRICE_SOURCE_ID":              [oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceMaterial]],
		    "PRICE_SOURCE_TYPE_ID":            [oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceMaterial]],
		    "PURCHASING_GROUP":             [oMaterialPriceTestDataPlc.PURCHASING_GROUP[iIndexMaterialPrice]],
		    "PURCHASING_DOCUMENT":          [oMaterialPriceTestDataPlc.PURCHASING_DOCUMENT[iIndexMaterialPrice]],
		    "LOCAL_CONTENT":                [oMaterialPriceTestDataPlc.LOCAL_CONTENT[iIndexMaterialPrice]]
		}, ["ITEM_ID"]);

		expect(oMessages).toMatchData({
			"ITEM_ID":  [oItemInput.ITEM_ID[iIndexMaterial]],
			"MSG_ID": 	[messageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code]
		}, ["MSG_ID","ITEM_ID"]);

		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemInput.ITEM_ID[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemInput.CMPR_BOOLEAN_INT_MANUAL[iIndexMaterial]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemInput.CMPR_BOOLEAN_INT_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemInput.CMPR_DECIMAL_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemInput.CMPR_DECIMAL_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemInput.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemInput.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexMaterial]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemInput.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexMaterial]],
	    		"CAPR_DECIMAL_MANUAL"              : [null],
	    		"CAPR_DECIMAL_UNIT"                : [null]
			}, ["ITEM_ID"]);
		}
	});


}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);