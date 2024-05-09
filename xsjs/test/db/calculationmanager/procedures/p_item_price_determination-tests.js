/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;
var _ = require("lodash");

describe('db.calculationmanager.procedures:p_item_price_determination',function() {

	var oMockstarPlc = null;
	var sSessionId1 = 'testsession1';
	var sSessionId2 = 'testsession2';
	var iCalculationVersionId1 = 1;
	var iCalculationVersionId2 = 2;
	var sTestUser = $.session.getUsername();
	var sSecondUser = "SecondTestUser";

	var sMasterdataTimestampDate = new Date().toJSON();
	var sExpectedDate = new Date().toJSON();
	var sExpectedDateWithoutTime = new Date(2015, 8, 20).toJSON(); //"2015-08-20";
	var sValuationDate = sExpectedDateWithoutTime;
	var sControllingArea = "#CA1";
	var sProjectId = "#P1";
	var sReportingCurrency = "EUR";

	var oItemTemporary = {
			"ITEM_ID" : [ 3001, 3002, 3003, 3004, 5001, 5002, 5003 ],
			"CALCULATION_VERSION_ID" : [ iCalculationVersionId1, iCalculationVersionId1, iCalculationVersionId1, iCalculationVersionId1, iCalculationVersionId2, iCalculationVersionId2, iCalculationVersionId2 ],
			"PARENT_ITEM_ID" : [ null, 3001, 3002, 3002,null, 5001, 5001 ],
			"PREDECESSOR_ITEM_ID" : [ 0, 3001, 3002, 3003, 0, 5001, 5002 ],
			"IS_ACTIVE" : [ 1, 1, 1, 1, 1, 1, 1 ],
			"ITEM_CATEGORY_ID" : [ 0, 1, 3, 2, 0, 2, 2 ],
			"CHILD_ITEM_CATEGORY_ID" : [ 0, 1, 3, 2, 0, 2, 2 ],
			"ACCOUNT_ID" : [ "0", "0", "625000", "0", "0", "0", "0"],
			"DOCUMENT_TYPE_ID" : [ "", "", "", "", "", "", "" ],
			"DOCUMENT_ID" : [ "", "", "", "", "", "", "" ],
			"DOCUMENT_VERSION" : [ "", "", "", "", "", "", "" ],
			"DOCUMENT_PART" : [ "", "", "", "", "", "","" ],
			"MATERIAL_ID" : [ "", "", "", "#100-110", "", "#100-110","MAT4" ],
			"ACTIVITY_TYPE_ID" : [ "", "", "", "", "", "", "" ],
			"PROCESS_ID" : [ "", "", "", "", "", "","" ],
			"LOT_SIZE" : [ null, null, null, null, null, null, null ],
			"LOT_SIZE_IS_MANUAL" : [ null, null, null, null, null, null, null ],
			"ENGINEERING_CHANGE_NUMBER_ID" : [ "", "", "", "", "", "", "" ],
			"COMPANY_CODE_ID" : [ "", "", "", "", "", "", "" ],
			"COST_CENTER_ID" : [ "", "", "", "", "", "", "" ],
			"PLANT_ID" : [ "", "", "", "", "", "", "" ],
			"WORK_CENTER_ID" : [ "", "", "", "", "", "", "" ],
			"BUSINESS_AREA_ID" : [ "", "", "", "", "", "", "" ],
			"PROFIT_CENTER_ID" : [ "", "", "", "", "", "", "" ],
			"PURCHASING_GROUP" : [ null, null, null, null, null, null, null],
			"PURCHASING_DOCUMENT" : [ null, null, null, null, null, null, null],
			"LOCAL_CONTENT" : [ null, null, null, null, null, null, null],
			"QUANTITY" : [ null, null, null, null, null, null, null ],
			"QUANTITY_IS_MANUAL" : [ null, null, null, null, null, null, null ],
			"QUANTITY_UOM_ID" : [ "", "", "", "", "", "", "" ],
			"TOTAL_QUANTITY" : [ null, null, null, null, null, null, null ],
			"TOTAL_QUANTITY_UOM_ID" : [ "", "", "", "", "", "", "" ],
		    "TOTAL_QUANTITY_DEPENDS_ON" : [ null, null, null, null, null, null, null ],
			"PRICE_FIXED_PORTION":["0.0000000","2772.3600000","2246.8800000","900.0000000","0.0000000","2590.9600000","120.50000000"],
			"PRICE_FIXED_PORTION_IS_MANUAL":[null,null,null,null,null, null, null],
			"PRICE_VARIABLE_PORTION":["0.0000000","0.0000000","415.6600000","231.0000000","0.0000000","371.1100000", "100.4500000"],
			"PRICE_VARIABLE_PORTION_IS_MANUAL":[null,null,null,null,null, null, null],
			"PRICE":[null,"2772.3600000","2662.5400000","200.0000000",null,"2962.0700000", "100.7000000"],
			"TRANSACTION_CURRENCY_ID":["EUR","EUR","EUR","EUR","EUR","EUR","EUR"],
			"PRICE_UNIT":["0.0000000","100.0000000","100.0000000","100.0000000","0.0000000","100.0000000","10.0000000"],
			"PRICE_UNIT_IS_MANUAL":[null,null,null,null,null,null,null],
			"PRICE_UNIT_UOM_ID":["H","H","H","H","H","H","H"],
			"CONFIDENCE_LEVEL_ID":[null,null,null,null,null, null,null],
			"PRICE_SOURCE_ID":["","","","","", "",""],
			"PRICE_SOURCE_TYPE_ID":[null,null,null,null,null, null, null],
			"IS_DISABLING_PRICE_DETERMINATION":[null,null,null,null,null, null, null],
			"VENDOR_ID":[null,null,null,null,null, null, null],
			"TARGET_COST" : [ null, null, null, null, null, null, null ],
			"TARGET_COST_IS_MANUAL" : [ null, null, null, null, null, null, null ],
			"TARGET_COST_CURRENCY_ID":["EUR","EUR","EUR","EUR","EUR","EUR","EUR"],
			"PRICE_FOR_TOTAL_QUANTITY" : [ null, null, null, null, null, null, null ],
			"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION" : [ null, null, null, null, null, null, null ],
			"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" : [ null, null, null, null, null, null, null ],
			"OTHER_COST" : [ null, null, null, null, null, null, null ],
			"OTHER_COST_FIXED_PORTION" : [ null, null, null, null, null, null, null ],
			"OTHER_COST_VARIABLE_PORTION" : [ null, null, null, null, null, null, null ],
			"TOTAL_COST" : [ null, null, null, null, null, null, null ],
			"TOTAL_COST_FIXED_PORTION" : [ null, null, null, null, null, null, null ],
			"TOTAL_COST_VARIABLE_PORTION" : [ null, null, null, null, null, null, null ],
			"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
			"CREATED_BY" : [ sTestUser, sSecondUser, sSecondUser, sTestUser, sTestUser, sTestUser, sTestUser ],
			"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
			"LAST_MODIFIED_BY" : [ sTestUser, sSecondUser, sSecondUser, sTestUser, sTestUser, sTestUser, sTestUser ],
			"SESSION_ID" : [ sSessionId1, sSessionId1, sSessionId1, sSessionId1,sSessionId2, sSessionId2, sSessionId2 ],
			"ITEM_DESCRIPTION" : [ "", "", "", "", "","","" ],
			"COMMENT" : [ "1. Comment", "", "", "","2. Comment", "3. Comment","Comment" ],
			"IS_DIRTY" : [ 0, 0, 0, 0, 0, 0, 0 ],
			"IS_DELETED" : [ 0, 0, 0, 0, 0, 0, 0 ]
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

	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oItemExtTemporary = {
				"ITEM_ID" : [ 3001, 3002, 3003, 3004, 5001, 5002, 5003 ],
				"CALCULATION_VERSION_ID" : [ iCalculationVersionId1, iCalculationVersionId1, iCalculationVersionId1, iCalculationVersionId1, iCalculationVersionId2, iCalculationVersionId2, iCalculationVersionId2 ],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [0, 0, null, 0, 0, 0, 0],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [null,  null, null, null,  null, null, null],
	    		"CMPR_DECIMAL_MANUAL"              : ["111.4500000","222.2500000",null, "111.4500000", "222.2500000", "111.4500000", "222.2500000"],
	    		"CMPR_DECIMAL_UNIT"                : [null,  null, null, null,  null, null, null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["444.5600000","555.5500000",null, "444.5600000","555.5500000", "444.5600000","555.5500000"],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : ["USD","USD",null, "USD","USD", "USD","USD"],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : ["60.0000000","60.0000000",null, "60.0000000","60.0000000", "60.0000000","60.0000000"],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : ["Min","Min",null, "Min","Min", "Min","Min"],
	    		"CAPR_DECIMAL_MANUAL"              : [null, null, "60.0000000", null, null, null, null],
	    		"CAPR_DECIMAL_UNIT"                : [null, null, "Min",null, null, null, null],
		}
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
			"PLANT_ID" : ['#PT1' , 'PL2', 'PL3', 'PL4'],
			"COMPANY_CODE_ID" : ['#C1', 'CC2','CC2', 'CC1'],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
			"_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, null],
			"_SOURCE" :[1, 1, 1, 1],
			"_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003']
	};
	
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
			"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_ERP_PRICE"],
			"MATERIAL_ID": ["#100-110","#100-110","#100-110","#100-110","#100-110","MATEN"],
			"PLANT_ID": ["#PT1","#PT1","#PT1","#PT1","#PT1","*"],
			"VENDOR_ID": ["#VD01","#VD02","#VD03","#VD01","*","*"],
			"PURCHASING_GROUP":["123","456","789","123","",""],
			"PURCHASING_DOCUMENT":["1234","5678","5679","5670","",""],
			"LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000",null,null],
			"PROJECT_ID": ["*","*","*","*","*","*"],
			"CUSTOMER_ID": ["*","*","*","*","*","*"],
			"VALID_FROM": ["2015-01-01T00:00:00Z","2015-01-01T00:00:00Z","2015-01-01T00:00:00Z","2018-01-01T00:00:00Z","2015-01-01T00:00:00Z","2010-01-01T00:00:00Z"],
			"VALID_TO": ["2017-12-31T00:00:00Z","2017-12-31T00:00:00Z","2017-12-31T00:00:00Z","2019-12-31T00:00:00Z","2999-12-31T00:00:00Z","2999-12-31T00:00:00Z"],
			"VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000"],
			"PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","123.8800000"],
			"PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000","10.0000000","234.9900000"],
			"TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR","EUR","EUR"],
			"PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000","1.0000000","10.0000000"],
			"PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC","PC","PC"],
	        "_VALID_FROM": ["2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
	        "_SOURCE": [1,1,1,1,1,2],
			"_CREATED_BY": ["I055799","I055799","I055799","I055799","I055799","U000920"]
	};
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oMaterialPriceExtTestDataPlc = {
				"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
	    		"CMPR_BOOLEAN_INT_MANUAL" : [1, 1, 1, 1, 1],
	    		"CMPR_BOOLEAN_INT_UNIT" : [null,  null, null, null,  null],
	    		"CMPR_DECIMAL_MANUAL": ["123.4500000","121.2500000","121.2500000", "123.4500000","121.2500000"],
	    		"CMPR_DECIMAL_UNIT" : [null,  null, null, null,  null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["234.5600000","200.5500000","234.9900000","234.5600000","200.5500000"],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR","EUR","EUR","EUR","EUR"],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000","1.0000000","2.0000000","1.0000000","1.0000000"],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT": ["H","H","H","H","H"],	
	    		"_VALID_FROM": ["2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"]
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
	        "VALID_FROM": ["2015-01-01T00:00:00Z","2015-01-01T00:00:00Z","2015-01-01T00:00:00Z","2018-01-01","2015-01-01T00:00:00Z","2015-01-01T00:00:00Z"],
	        "VALID_TO": ["2017-12-31T00:00:00Z","2017-12-31T00:00:00Z","2017-12-31T00:00:00Z","2019-12-31T00:00:00Z","2999-12-31T00:00:00Z","2999-12-31T00:00:00Z"],
	        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
	        "PRICE_FIXED_PORTION": ["65.5000000","65.5000000","65.5000000","65.0000000","10.0000000","65.0000000"],
	        "PRICE_VARIABLE_PORTION": ["10.0000000","90.0000000","95.0000000","55.0000000","120.0000000","120.0000000"],
	        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR","EUR","EUR"],
	        "PRICE_UNIT": ["1.0000000","1.0000000","1.0000000","30.0000000","1.0000000","1.0000000"],
	        "PRICE_UNIT_UOM_ID": ["H","H","H","MIN","H","H"],
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
			
	beforeOnce(function() {

		oMockstarPlc = new MockstarFacade(
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_item_price_determination", // procedure or view under test
					substituteTables:                                           // substitute all used tables in the procedure or view
					{
						item_temporary: {
							name: "sap.plc.db::basis.t_item_temporary",
							data: oItemTemporary
						},
						item_temporary_ext: {
							name: "sap.plc.db::basis.t_item_temporary_ext"
						},
						material: {
							name: Resources["Material"].dbobjects.plcTable,
							data: oMaterialTestDataPlc
						},
						plant: {
							name: Resources["Plant"].dbobjects.plcTable,
							data: oPlantTestDataPlc
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
						material_price_ext: {
							name: Resources["Material_Price"].dbobjects.plcExtensionTable
						}, 
						activity_price_ext:{
						    name: Resources["Activity_Price"].dbobjects.plcExtensionTable
						}
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
		if(jasmine.plcTestRunParameters.generatedFields === true){
			oMockstarPlc.insertTableData("material_price_ext", oMaterialPriceExtTestDataPlc);
			oMockstarPlc.insertTableData("activity_price_ext", oActivityPriceExtTestDataPlc);
		}
	});

	afterEach(function() {
	});

	function createTestInputObject(iItemIndex,oItemTemporary,oExtension){

		var oBaseObject = {
				"ITEM_ID":          [oItemTemporary.ITEM_ID[iItemIndex]],
				"PARENT_ITEM_ID":   [oItemTemporary.PARENT_ITEM_ID[iItemIndex]],
				"ITEM_CATEGORY_ID": [oItemTemporary.ITEM_CATEGORY_ID[iItemIndex]],
				"MATERIAL_ID":      [oItemTemporary.MATERIAL_ID[iItemIndex]],
				"PLANT_ID": 		[oItemTemporary.PLANT_ID[iItemIndex]],
				"VENDOR_ID": 		[oItemTemporary.VENDOR_ID[iItemIndex]],
				"ACTIVITY_TYPE_ID": [oItemTemporary.ACTIVITY_TYPE_ID[iItemIndex]],
				"COST_CENTER_ID": 	[oItemTemporary.COST_CENTER_ID[iItemIndex]],
				"PRICE_SOURCE_ID": 	[oItemTemporary.PRICE_SOURCE_ID[iItemIndex]],
				"PRICE_SOURCE_TYPE_ID": 	[oItemTemporary.PRICE_SOURCE_TYPE_ID[iItemIndex]],
				"CONFIDENCE_LEVEL_ID": 	[oItemTemporary.CONFIDENCE_LEVEL_ID[iItemIndex]],
				"PRICE_FIXED_PORTION": 			    [oItemTemporary.PRICE_FIXED_PORTION[iItemIndex]],
				"PRICE_VARIABLE_PORTION": 		    [oItemTemporary.PRICE_VARIABLE_PORTION[iItemIndex]],	
				"TRANSACTION_CURRENCY_ID":    [oItemTemporary.TRANSACTION_CURRENCY_ID[iItemIndex]],
				"PRICE_UNIT": 					    [oItemTemporary.PRICE_UNIT[iItemIndex]],
				"PRICE_UNIT_UOM_ID": 			    [oItemTemporary.PRICE_UNIT_UOM_ID[iItemIndex]],
				"IS_DISABLING_PRICE_DETERMINATION": [oItemTemporary.IS_DISABLING_PRICE_DETERMINATION[iItemIndex]],
				"PURCHASING_GROUP": 			    [oItemTemporary.PURCHASING_GROUP[iItemIndex]],
				"PURCHASING_DOCUMENT": 			    [oItemTemporary.PURCHASING_DOCUMENT[iItemIndex]],
				"LOCAL_CONTENT": 			        [oItemTemporary.LOCAL_CONTENT[iItemIndex]]
		};
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			var oBaseObjectExt = {
				"ITEM_ID"                          : [oItemExtTemporary.ITEM_ID[iItemIndex]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemExtTemporary.CMPR_BOOLEAN_INT_MANUAL[iItemIndex]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemExtTemporary.CMPR_BOOLEAN_INT_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemExtTemporary.CMPR_DECIMAL_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemExtTemporary.CMPR_DECIMAL_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_UNIT[iItemIndex]],
	    		"CAPR_DECIMAL_MANUAL"              : [oItemExtTemporary.CAPR_DECIMAL_MANUAL[iItemIndex]],
	    		"CAPR_DECIMAL_UNIT"                : [oItemExtTemporary.CAPR_DECIMAL_UNIT[iItemIndex]]
			};
			return _.extend({}, oBaseObject, oBaseObjectExt, oExtension)
		}

		return _.extend({}, oBaseObject, oExtension)

	}

	it('should set price source to [Calculated Price] (and not change custom fields) for a parent', function() {
		// arrange
		var iItemIndex = 1;
		var oItemInput = {};
		oItemInput = createTestInputObject(iItemIndex,oItemTemporary,{});
		
		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];
		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(lt_items_input, iCalculationVersionId1, sSessionId1, lt_version_input, '');

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexPriceSource = 8;
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemTemporary.ITEM_ID[iItemIndex]],
			"VENDOR_ID":            [null],
			"PRICE_FIXED_PORTION": 	[null],
			"PRICE_VARIABLE_PORTION":[null],
			"TRANSACTION_CURRENCY_ID":[sReportingCurrency],
			"PRICE_UNIT":["1.0000000"],
			"PRICE_UNIT_UOM_ID":[oItemTemporary.TOTAL_QUANTITY_UOM_ID[iItemIndex]],
			"CONFIDENCE_LEVEL_ID":[oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSource]],
			"PRICE_SOURCE_ID":[oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource]],
			"PRICE_SOURCE_TYPE_ID":[oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSource]],
		    "PURCHASING_GROUP":[null],
		    "PURCHASING_DOCUMENT":[null],
		    "LOCAL_CONTENT":[oItemTemporary.LOCAL_CONTENT[iItemIndex]]
		}, ["ITEM_ID"]);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemTemporary.ITEM_ID[iItemIndex]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemExtTemporary.CMPR_BOOLEAN_INT_MANUAL[iItemIndex]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemExtTemporary.CMPR_BOOLEAN_INT_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemExtTemporary.CMPR_DECIMAL_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemExtTemporary.CMPR_DECIMAL_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_MANUAL[iItemIndex]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_UNIT[iItemIndex]],
	    		"CAPR_DECIMAL_MANUAL"              : [oItemExtTemporary.CAPR_DECIMAL_MANUAL[iItemIndex]],
	    		"CAPR_DECIMAL_UNIT"                : [oItemExtTemporary.CAPR_DECIMAL_UNIT[iItemIndex]]
			}, ["ITEM_ID"]);
		}
	});

	it('should set price source to [Calculated Price] for a parent and should set automatically price fields,price source, confidence level when a field (e.g COST_CENTER_ID) is changed and the price is determined for a leave', function() {
    	var iItemIndex1 = 1;
		var oItemInput1 = createTestInputObject(iItemIndex1,oItemTemporary,{});
		var iItemIndex2 = 2;
		var oItemInput2 = createTestInputObject(iItemIndex2,oItemTemporary,{
			"COST_CENTER_ID" : ['#CC1'],
			"ACTIVITY_TYPE_ID" : ['#AT2']
		});

		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput1, 0),
		                      mockstar_helpers.convertToObject(oItemInput2, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(lt_items_input, iCalculationVersionId1, sSessionId1, lt_version_input, '');

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexActivityPrice = 0;
		var iIndexPriceSourceActivity = 4;
		var iIndexPriceSource = 8;
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemTemporary.ITEM_ID[iItemIndex1],oItemTemporary.ITEM_ID[iItemIndex2]],
			"VENDOR_ID":            [null,null],
			"PRICE_FIXED_PORTION": 	[null,oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexActivityPrice]],
			"PRICE_VARIABLE_PORTION":[null,oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexActivityPrice]],
			"TRANSACTION_CURRENCY_ID":[sReportingCurrency,oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexActivityPrice]],
			"PRICE_UNIT":["1.0000000",oActivityPriceTestDataPlc.PRICE_UNIT[iIndexActivityPrice]],
			"PRICE_UNIT_UOM_ID":[oItemTemporary.TOTAL_QUANTITY_UOM_ID[iItemIndex1],oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexActivityPrice]],
			"CONFIDENCE_LEVEL_ID":[oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSource],oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSourceActivity]],
			"PRICE_SOURCE_ID":[oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource],oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSourceActivity]],
			"PRICE_SOURCE_TYPE_ID":[oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSource], oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSourceActivity]],
		    "PURCHASING_GROUP":[null,null],
		    "PURCHASING_DOCUMENT":[null,null],
		    "LOCAL_CONTENT":[oItemTemporary.LOCAL_CONTENT[iItemIndex1],null]
		}, ["ITEM_ID"]);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemTemporary.ITEM_ID[iItemIndex1], oItemTemporary.ITEM_ID[iItemIndex2]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemExtTemporary.CMPR_BOOLEAN_INT_MANUAL[iItemIndex1], oItemExtTemporary.CMPR_BOOLEAN_INT_MANUAL[iItemIndex2]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemExtTemporary.CMPR_BOOLEAN_INT_UNIT[iItemIndex1], oItemExtTemporary.CMPR_BOOLEAN_INT_UNIT[iItemIndex2]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemExtTemporary.CMPR_DECIMAL_MANUAL[iItemIndex1], oItemExtTemporary.CMPR_DECIMAL_MANUAL[iItemIndex2]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemExtTemporary.CMPR_DECIMAL_UNIT[iItemIndex1], oItemExtTemporary.CMPR_DECIMAL_UNIT[iItemIndex2]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iItemIndex1], oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iItemIndex2]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iItemIndex1], oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iItemIndex2]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_MANUAL[iItemIndex1], oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_MANUAL[iItemIndex2]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_UNIT[iItemIndex1], oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_UNIT[iItemIndex2]],
	    		"CAPR_DECIMAL_MANUAL"              : [oItemExtTemporary.CAPR_DECIMAL_MANUAL[iItemIndex1], oActivityPriceExtTestDataPlc.CAPR_DECIMAL_MANUAL[0]],
	    		"CAPR_DECIMAL_UNIT"                : [oItemExtTemporary.CAPR_DECIMAL_UNIT[iItemIndex1], oActivityPriceExtTestDataPlc.CAPR_DECIMAL_UNIT[0]]
			}, ["ITEM_ID"]);
		}

	});
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		it('should set price source for Internal Activity to [Calculated Price] for a parent (should preserve the old values when a field (e.g COST_CENTER_ID) is changed for parent)', function() {
          var oInsertItem = mockstar_helpers.convertToObject(oItemTemporary, 2);
	    oInsertItem.ITEM_ID = 3010;
        oInsertItem.PARENT_ITEM_ID = 3003;
	    oMockstarPlc.insertTableData("item_temporary", oInsertItem);

		var iItemIndex2 = 2;
		var oItemInput2 = createTestInputObject(iItemIndex2,oItemTemporary,{
			"COST_CENTER_ID" : ['#CC1'],
			"ACTIVITY_TYPE_ID" : ['#AT2']
		});

		var lt_items_input = [mockstar_helpers.convertToObject(oItemInput2, 0)];
		const lt_version_input = [mockstar_helpers.convertToObject(oVersionInput, 0)];

		//act
		var procedure = oMockstarPlc.loadProcedure();
		var result = procedure(lt_items_input, iCalculationVersionId1, sSessionId1, lt_version_input, '');

		//assert
		var oEntity = Array.slice(result.OT_DETERMINED_PRICES);	
		var oMessages = Array.slice(result.OT_MESSAGES);
		var iIndexActivityPrice = 0;
		var iIndexPriceSourceActivity = 4;
		var iIndexPriceSource = 8;
		expect(oEntity).toMatchData({
			"ITEM_ID":           	[oItemTemporary.ITEM_ID[iItemIndex2]],
			"VENDOR_ID":            [null],
			"PRICE_FIXED_PORTION": 	[null],
			"PRICE_VARIABLE_PORTION":[null],
			"TRANSACTION_CURRENCY_ID":[sReportingCurrency],
			"PRICE_UNIT":["1.0000000"],
			"CONFIDENCE_LEVEL_ID":[oPriceSourceTestDataPlc.CONFIDENCE_LEVEL_ID[iIndexPriceSource]],
			"PRICE_SOURCE_ID":[oPriceSourceTestDataPlc.PRICE_SOURCE_ID[iIndexPriceSource]],
			"PRICE_SOURCE_TYPE_ID":[oPriceSourceTestDataPlc.PRICE_SOURCE_TYPE_ID[iIndexPriceSource]],
		    "PURCHASING_GROUP":[null],
		    "PURCHASING_DOCUMENT":[null],
		    "LOCAL_CONTENT":[oItemTemporary.LOCAL_CONTENT[iItemIndex2]]
		}, ["ITEM_ID"]);
		
		//for parents, masterdata custom fields are set to null; custom fields for item with item_category = internal activity are set to null also
	    expect(oEntity).toMatchData({
				"ITEM_ID":           	[oItemTemporary.ITEM_ID[iItemIndex2]],
	    		"CMPR_BOOLEAN_INT_MANUAL"          : [oItemExtTemporary.CMPR_BOOLEAN_INT_MANUAL[iItemIndex2]],
	    		"CMPR_BOOLEAN_INT_UNIT"            : [oItemExtTemporary.CMPR_BOOLEAN_INT_UNIT[iItemIndex2]],
	    		"CMPR_DECIMAL_MANUAL"              : [oItemExtTemporary.CMPR_DECIMAL_MANUAL[iItemIndex2]],
	    		"CMPR_DECIMAL_UNIT"                : [oItemExtTemporary.CMPR_DECIMAL_UNIT[iItemIndex2]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iItemIndex2]],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT"  : [oItemExtTemporary.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iItemIndex2]],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL"     : [oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_MANUAL[iItemIndex2]],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT"       : [oItemExtTemporary.CMPR_DECIMAL_WITH_UOM_UNIT[iItemIndex2]],
	    		"CAPR_DECIMAL_MANUAL"              : [oItemExtTemporary.CAPR_DECIMAL_MANUAL[iItemIndex2]],
	    		"CAPR_DECIMAL_UNIT"                : [oItemExtTemporary.CAPR_DECIMAL_UNIT[iItemIndex2]]
			}, ["ITEM_ID"]);
	});
	}

}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);