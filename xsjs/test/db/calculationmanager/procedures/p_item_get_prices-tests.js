/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;
var testdata = require("../../../testdata/testdata").data;
const sStandardPriceStrategy = testdata.sStandardPriceStrategy;
describe('db.calculationmanager.procedures:p_item_get_prices',function() {
	var calculationTables = $.import("xs.db", "persistency-calculation").Tables;
	
	var oMockstarPlc = null;
	var sSessionId = 'TestUser';
	var sTestUser = $.session.getUsername();
	var sMasterdataTimestampDate = new Date().toJSON();
    var sExpectedDateWithoutTime = new Date(2015, 8, 20).toJSON();
	var sExpectedDate = new Date().toJSON();
	var sComponentSplitId = "1";	
	var sSecondUser = "TestUser2";
    var sSessionLanguage = 'EN';
    		
	var oPriceSourceTestDataPlc ={
			"PRICE_SOURCE_ID": ["101","102","201","301","302","901","902","903"],
			"PRICE_SOURCE_TYPE_ID": [1,1,1,2,2,3,4,3],
			"CONFIDENCE_LEVEL_ID": [3,5,4,3,4,2,null,1],
			"DETERMINATION_SEQUENCE": [1,2,3,1,2,0,0,0],
			"CREATED_ON": [sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
			"CREATED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser],
			"LAST_MODIFIED_ON":[sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
		    "LAST_MODIFIED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser]
	};
	
	var oActivityPriceTestDataPlc = {
			"PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B"],
	        "PRICE_SOURCE_ID": ["101","102","301"],
	        "CONTROLLING_AREA_ID": ['#CA1','1000','1000'],
	        "COST_CENTER_ID": ['CC2','CC2',"*"],
	        "ACTIVITY_TYPE_ID": ["*","A2","*"],
	        "PROJECT_ID": ["*","*","*"],
	        "CUSTOMER_ID": ["*","*","*"],
	        "VALID_FROM": ["2015-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z"],
	        "VALID_TO": ["2099-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z"],
	        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000"],
	        "PRICE_FIXED_PORTION": ["135.9800000","135.9800000","150.0000000"],
	        "PRICE_VARIABLE_PORTION": ["123.4500000","123.4500000","200.0000000"],
	        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR"],
	        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000"],
	        "PRICE_UNIT_UOM_ID": ["PC","PC","H"],
	        "_VALID_FROM": ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z"],
	        "_SOURCE": [1,1,1],
	        "_CREATED_BY": ["I305778","U0001","U0001"]
	};
	
	var oCostCenterTestDataPlc = {
			"COST_CENTER_ID" : ['CC1', 'CC2', 'CC3'],
			"CONTROLLING_AREA_ID" : ['#CA1', '1000', '#CA1'],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
			"_VALID_TO" : ['2015-05-25T15:39:09.691Z', null, null],
			"_SOURCE" : [1, 1, 1],
			"_CREATED_BY" :['U000001', 'U000002', 'U000001']
	};
	
	var oActivityTypeTestDataPlc = {
			"ACTIVITY_TYPE_ID" :['A1', 'A2', 'A3','A4'],
			"CONTROLLING_AREA_ID" : ['1000', '1000', '1000','#CA1'],
			"ACCOUNT_ID" : ['CE1', 'CE2', 'CE1','11000'],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
	        "_VALID_TO" : ['2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
			"_SOURCE" : [1, 1, 1, 1],
			"_CREATED_BY" : ['U000001', 'U000002', 'U000001','U000001']
	};
	
	var oCalculationTestData = {
		"CALCULATION_ID" : [ 2809, 2078, 5078 ],
		"PROJECT_ID" : [ "PR1", "PR1", "PR1" ],
		"CALCULATION_NAME" : [ "Kalkulation Pumpe P-100", "Calculation Pump P-100", "Kalkulation Schluesselfinder" ],
		"CURRENT_CALCULATION_VERSION_ID" : [ 2314, 4809, 5809 ],
		"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
		"CREATED_BY" : [ sTestUser, sTestUser, sTestUser ],
		"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
		"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ]
		};
	
	var  oCalculationVersionTemporaryTestData = {
		"CALCULATION_VERSION_ID" : [ 2314, 4809, 5809 ],
		"CALCULATION_ID" : [ 2809, 2078, 5078 ],
		"CALCULATION_VERSION_NAME" : [ "Baseline Version1", "Baseline Version2", "Baseline Version3" ],
		"ROOT_ITEM_ID" : [ 3001, 5001, 7001 ],
		"CUSTOMER_ID" : [ "", "", "" ],
		"SALES_PRICE" : ['20.0000000','10.0000000','10.0000000'],
		"SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
		"REPORT_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
		"COSTING_SHEET_ID" : [ "COGM", "COGM", "COGM" ],
		"COMPONENT_SPLIT_ID" : [ sComponentSplitId, sComponentSplitId, sComponentSplitId ],
		"SALES_DOCUMENT" : ["DOC", "DOC", "DOC"],
		"START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
		"END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
		"VALUATION_DATE" : [ sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate ],
		"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
		"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ],
		"MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate ],
		"IS_FROZEN" : [ 0, 0, 0 ],
		"SESSION_ID" : [ sSessionId, sSessionId, sSessionId ],
		"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
		"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
	};
	
	var oItemTemporaryTestData = {
			"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
			"CALCULATION_VERSION_ID" : [ 2314, 2314, 2314, 4809, 5809 ],
			"PARENT_ITEM_ID" : [ null, 3001, 3002, null, null ],
			"PREDECESSOR_ITEM_ID" : [ null, 3001, 3002, null, null ],
			"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
			"ITEM_CATEGORY_ID" : [ 1, 3, 1, 1, 1 ],
			"CHILD_ITEM_CATEGORY_ID" : [ 1, 3, 1, 1, 1 ],
			"ACCOUNT_ID" : [ "0", "0", "625000", "0", "0" ],
			"DOCUMENT_TYPE_ID" : [ "", "", "", "", "" ],
			"DOCUMENT_ID" : [ "", "", "", "", "" ],
			"DOCUMENT_VERSION" : [ "", "", "", "", "" ],
			"DOCUMENT_PART" : [ "", "", "", "", "" ],
			"MATERIAL_ID" : [ "MAT1", "MAT1", "MAT1", "", "" ],
			"ACTIVITY_TYPE_ID" : [ "", "", "", "", "" ],
			"PROCESS_ID" : [ "", "", "", "", "" ],
			"LOT_SIZE" : [ null, null, null, null, null ],
			"LOT_SIZE_IS_MANUAL" : [ null, null, null, null, null ],
			"ENGINEERING_CHANGE_NUMBER_ID" : [ "", "", "", "", "" ],
			"COMPANY_CODE_ID" : [ "", "", "", "", "" ],
			"COST_CENTER_ID" : [ "", "", "", "", "" ],
			"PLANT_ID" : [ "PL1", "PL1", "", "", "" ],
			"WORK_CENTER_ID" : [ "", "", "", "", "" ],
			"BUSINESS_AREA_ID" : [ "", "", "", "", "" ],
			"PROFIT_CENTER_ID" : [ "", "", "", "", "" ],
			"PURCHASING_GROUP" : [ null, null, null, null, null],
			"PURCHASING_DOCUMENT" : [ null, null, null, null, null],
			"LOCAL_CONTENT" : [ null, null, null, null, null],
			"QUANTITY" : ["1.0000000","1.0000000","1.0000000","1.0000000","1.0000000"],
			"QUANTITY_IS_MANUAL" : [ null, null, null, null, null ],
			"QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC", "PC" ],
			"TOTAL_QUANTITY" : ["1.0000000","1.0000000","1.0000000","1.0000000","1.0000000" ],
			"TOTAL_QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC", "PC" ],
			"TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1, 1, 1 ],
			"IS_RELEVANT_TO_COSTING_IN_ERP" : [null,1,null,null,null],
			"BASE_QUANTITY" : ["1.0000000","1.0000000","1.0000000","1.0000000","1.0000000" ],
			"PRICE_FIXED_PORTION":[0,2772.36,2246.88,2590.96,0],
		    "PRICE_FIXED_PORTION_IS_MANUAL":[null,null,null,null,null],
		    "PRICE_VARIABLE_PORTION":[0,0,415.66,371.11,0],
		    "PRICE_VARIABLE_PORTION_IS_MANUAL":[null,null,null,null,null],
            "PRICE":[null,2772.36,2662.54,2962.07,null],
            "PRICE_ID":['170000E0B2BDB9671600A4000936462B','290000E0B2BDB9671600A4000936462B', null, null, null],
		    "TRANSACTION_CURRENCY_ID":["EUR","EUR","EUR","EUR","EUR"],
		    "PRICE_UNIT":[0,100,100,100,0],
		    "PRICE_UNIT_IS_MANUAL":[null,null,null,null,null],
		    "PRICE_UNIT_UOM_ID":["PC","PC","H","H","H"],
		    "CONFIDENCE_LEVEL_ID":[null,null,null,null,null],
		    "PRICE_SOURCE_ID":["101","101","","",""],
		    "PRICE_SOURCE_TYPE_ID":[null,null,null,null,null],
			"IS_DISABLING_PRICE_DETERMINATION":[null,null,null,null,null],
		    "VENDOR_ID":[null,"",null,null,null],
			"TARGET_COST" : [ null, null, null, null, null ],
			"TARGET_COST_IS_MANUAL" : [ null, null, null, null, null ],
			"TARGET_COST_CURRENCY_ID":["EUR","EUR","EUR","EUR","EUR"],
			"PRICE_FOR_TOTAL_QUANTITY" : [ null, null, null, null, null ],
			"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION" : [ null, null, null, null, null ],
			"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" : [ null, null, null, null, null ],
			"OTHER_COST" : [ null, null, null, null, null ],
			"OTHER_COST_FIXED_PORTION" : [ null, null, null, null, null ],
			"OTHER_COST_VARIABLE_PORTION" : [ null, null, null, null, null ],
			"TOTAL_COST" : [ null, null, null, null, null ],
			"TOTAL_COST_FIXED_PORTION" : [ null, null, null, null, null ],
			"TOTAL_COST_VARIABLE_PORTION" : [ null, null, null, null, null ],
			"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
			"CREATED_BY" : [ sTestUser, sSecondUser, sSecondUser, sTestUser, sTestUser ],
			"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
			"LAST_MODIFIED_BY" : [ sTestUser, sSecondUser, sSecondUser, sTestUser, sTestUser ],
			"ITEM_DESCRIPTION" : [ "", "", "", "", "" ],
			"COMMENT" : [ "1. Comment", "", "", "2. Comment", "3. Comment" ],
			"SESSION_ID" : [ sSessionId, sSessionId, sSessionId, sSessionId, sSessionId ],
			"ITEM_DESCRIPTION" : [ "", "", "", "", "" ],
			"COMMENT" : [ "1. Comment", "", "", "2. Comment", "3. Comment" ],
			"IS_DIRTY" : [ 0, 0, 0, 0, 0 ],
			"IS_DELETED" : [ 0, 0, 0, 0, 0 ]	
	};
	
	var oMaterialTestDataPlc = {
			"MATERIAL_ID" : ['MAT1', 'MAT2', 'MAT3', 'MAT4', 'MAT5', 'MAT6', 'MAT7', "MATEN", "MATE1"],
			"IS_PHANTOM_MATERIAL" : [1, 0, 1, 0, 1, 0, 1, 0, 0],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z','2015-01-01T15:39:09.691Z'],
			"_VALID_TO" : [null, null,'2015-06-06T15:39:09.691Z', null, null, null, null, null, null],
			"_SOURCE" : [1, 1, 1, 1, 1, 1, 1, 2, 2],
			"_CREATED_BY" :['U000001', 'U000003', 'U000002', 'U000002', 'U000003', 'U000003', 'U000003']
	}
	
	var oPlantTestDataPlc = {
			"PLANT_ID" : ['PL1' , 'PL2', 'PL3', 'PL4'],
			"COMPANY_CODE_ID" : ['CC1', 'CC2','CC2', 'CC1'],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
			"_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, null],
			"_SOURCE" :[1, 1, 1, 1],
			"_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003']
	}
	
	var oCompanyCodeTestDataPlc = {
			"COMPANY_CODE_ID" : ['CC1', 'CC2', 'CC3'],
			"CONTROLLING_AREA_ID" : ['1000', '1000', '1000'],
			"COMPANY_CODE_CURRENCY_ID" : ['EUR', 'EUR', 'EUR'],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
	        "_VALID_TO" : [null, null, null],
			"_SOURCE" : [1, 1, 1],
			"_CREATED_BY" : ['U000001', 'U000002', 'U000001']
	}

	var oVendorTestDataPlc = {
			"VENDOR_ID": ["V1", "V2", "V3"],
			"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
			"_VALID_TO" : [null, null, null],
			"_SOURCE" : [1, 1, 1],
			"_CREATED_BY" :['U000001', 'U000001', 'U000001']
	}
	
	var oMaterialPriceTestDataPlc = {
			"PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B", "120000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["101","201","101","101", "101"],
			"MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT1", "MAT1"],
			"PLANT_ID": ["PL1","PL1","*","PL3", "PL1"],
			"VENDOR_ID": ["*","*","*","*", "V1"],
			"PROJECT_ID": ["*", "*", "*", "*", "*"],
			"CUSTOMER_ID": ["*", "*", "*", "*", "*"],
			"VALID_FROM": ["2015-06-19T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z", "2010-01-01T00:00:00.000Z"],
			"VALID_TO": ["2999-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z","2999-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z", "2099-12-31T00:00:00.000Z"],
			"VALID_FROM_QUANTITY": ['1.0000000','1.0000000','1.0000000','1.0000000','1.0000000'],
			"PRICE_FIXED_PORTION": ['123.4500000','123.8800000','121.2500000','121.2500000','121.2500000'],
			"PRICE_VARIABLE_PORTION": ['234.5600000','234.9900000','200.5500000','234.9900000', '234.9900000'],
			"TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR", "EUR"],
			"PRICE_UNIT": ['1.0000000','100.0000000','1.0000000','2.0000000', '2.0000000'],
			"PRICE_UNIT_UOM_ID": ["H","H","H","H", "H"],
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
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
	    var oMaterialPriceExtTestDataPlc = {
				"PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B", "120000E0B2BDB9671600A4000936462B"],
	    		"CMPR_BOOLEAN_INT_MANUAL" : [1, 1, 1, 1, 1],
	    		"CMPR_BOOLEAN_INT_UNIT" : [null,  null, null, null, null],
	    		"CMPR_DECIMAL_MANUAL": ['123.4500000','121.2500000','121.2500000', '121.2500000', '121.2500000'],
	    		"CMPR_DECIMAL_UNIT" : [null,  null, null, null, null],
	    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ['234.5600000','200.5500000','234.9900000','456.7700000','456.7700000'],
	    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR","EUR","EUR","EUR","EUR"],
	    		"CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000","1.0000000","2.0000000","2.0000000","2.0000000"],
	    		"CMPR_DECIMAL_WITH_UOM_UNIT": ["H","H","H","H","H"],
	            "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"]
	    };
	}
	
	beforeOnce(function() {
		oMockstarPlc = new MockstarFacade(
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_item_get_prices", // procedure or view under test
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
						material: {
							name: Resources["Material"].dbobjects.plcTable,
							data: oMaterialTestDataPlc
						},
						plant : {
							name: Resources["Plant"].dbobjects.plcTable,
							data: oPlantTestDataPlc
						},
						company_code: {
							name : Resources["Company_Code"].dbobjects.plcTable,
							data : oCompanyCodeTestDataPlc
						},
						material_price : {
						    name: Resources["Material_Price"].dbobjects.plcTable,
						    data : oMaterialPriceTestDataPlc
						},
						material_price_ext: Resources["Material_Price"].dbobjects.plcExtensionTable,
						project: {
							name: calculationTables.project,
							data: testdata.oProjectTestData
						},
						calculation: {
							name: calculationTables.calculation,
							data: oCalculationTestData
						},
						calculation_version_temporary: {
							name: calculationTables.calculation_version_temporary,
							data: oCalculationVersionTemporaryTestData
						},
						item_temporary: {
							name: calculationTables.item_temporary,
							data: oItemTemporaryTestData
                        },
						price_determination_strategy: {
							name: "sap.plc.db::basis.t_price_determination_strategy",
							data: testdata.oPriceDeterminationStrategyTestData
						},
						price_determination_strategy_price_source: {
							name: "sap.plc.db::basis.t_price_determination_strategy_price_source",
							data: oPriceDeterminationStrategyPriceSource
						},	
						vendor: {
							name: Resources["Vendor"].dbobjects.plcTable,
							data: oVendorTestDataPlc
						}				
					}
				});			
	});
	
	beforeEach(function() {
		oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
		oMockstarPlc.initializeData();
		if(jasmine.plcTestRunParameters.generatedFields === true){
			oMockstarPlc.insertTableData("material_price_ext", oMaterialPriceExtTestDataPlc);
		}
	});
    
    it('should get VALID prices for item with category material', function() {
		//arrange
	     var iCalculationVersionId = "2314";
		 var iItemId = '3001';
		 var iIndexPrice0 = 4;
		 var iIndexPrice1 = 2;
		 var iIndexPrice2 = 0;
		 var iIndexPrice3 = 1;
	
		 //act
	     var procedure = oMockstarPlc.loadProcedure();
		 var result = procedure(sSessionId, iCalculationVersionId, iItemId, sSessionLanguage);
	
		//assert
	     var oMaterialPrice =  Array.slice(result.OT_ALL_PRICES_MATERIAL);
		 
	    expect(oMaterialPrice).toMatchData({
			"PRICE_SOURCE_ID":           	[oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice3]],
			"MATERIAL_ID":                  [oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice0],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice1],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice2],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice3]],
			"PLANT_ID":                     [oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice3]],
			"VENDOR_ID":                    [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice0],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice1],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice2],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice3]],
			"PURCHASING_GROUP": 			[null,null,null,null],
			"PURCHASING_DOCUMENT": 			[null,null,null,null],
			"LOCAL_CONTENT": 			    [null,null,null,null],
			"PROJECT_ID":		            [oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice3]],
			"CUSTOMER_ID":                  [oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice0],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice1],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice2],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice3]],
			"VALID_FROM": 		            [new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice0])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice1])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice3]))],
			"VALID_TO":                     [new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice0])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice2])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice3]))],
			"VALID_FROM_QUANTITY":   	    [oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice0],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice1],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice2],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice3]],
			"VALID_TO_QUANTITY": 	        [null,null,null,null],
			"PRICE_FIXED_PORTION":          [oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice3]],
			"PRICE_VARIABLE_PORTION":       [oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice3]],
			"TRANSACTION_CURRENCY_ID":      [oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice0],oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice1],oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice2],oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice3]],
			"PRICE_UNIT":	                [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice3]],
			"PRICE_ID":	                	[oMaterialPriceTestDataPlc.PRICE_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_ID[iIndexPrice3]],
			"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice3]],
			"_VALID_FROM":  			    [new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice0])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice1])), new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice3]))],
			"_VALID_TO":    			    [null,null,null,null],
			"_SOURCE":                      [oMaterialPriceTestDataPlc._SOURCE[iIndexPrice0],oMaterialPriceTestDataPlc._SOURCE[iIndexPrice1],oMaterialPriceTestDataPlc._SOURCE[iIndexPrice2],oMaterialPriceTestDataPlc._SOURCE[iIndexPrice3]],
			"_CREATED_BY":                  [null,null,null,null],
			"_VALID_FROM_FIRST_VERSION":    [null,null,null,null],
	        "_CREATED_BY_FIRST_VERSION":    [null,null,null,null],
	     }, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "CUSTOMER_ID", "_VALID_FROM", "VALID_FROM", "VALID_FROM_QUANTITY"]);
	    
	    expect(result.OT_PROJECT).toBeDefined();
		expect(Array.slice(result.OT_PROJECT).length).toBe(0);
	   
	    if(jasmine.plcTestRunParameters.generatedFields === true){
	    	expect(oMaterialPrice).toMatchData({
				"PRICE_SOURCE_ID":           	[oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice3]],
				"MATERIAL_ID":                  [oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice2],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice0],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice1],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice3]],
				"PLANT_ID":                     [oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice3]],
				"VENDOR_ID":                    [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice2],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice0],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice1],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice3]],
				"PROJECT_ID":		            [oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice3]],
				"CUSTOMER_ID":		            [oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice2],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice0],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice1],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice3]],
				"VALID_FROM": 		            [new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice0])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice1])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice3]))],
				"VALID_FROM_QUANTITY":   	    [oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice2],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice0],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice1],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice3]],
				"_VALID_FROM":  			    [new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice0])), new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice1])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice3]))],
				"CMPR_BOOLEAN_INT_MANUAL": 		[oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice2],oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice3]],
				"CMPR_BOOLEAN_INT_UNIT":		[oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice2],oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice3]],
				"CMPR_DECIMAL_MANUAL": 			[oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice2],oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice3]],
				"CMPR_DECIMAL_UNIT": 			[oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice2],oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice3]],
				"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice2],oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice3]],
				"CMPR_DECIMAL_WITH_CURRENCY_UNIT": 	 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice2],oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice3]],
				"CMPR_DECIMAL_WITH_UOM_MANUAL": 	 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice2],oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice3]],
				"CMPR_DECIMAL_WITH_UOM_UNIT": 		 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice2],oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice3]],	
	    	}, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "CUSTOMER_ID", "_VALID_FROM", "VALID_FROM", "VALID_FROM_QUANTITY"]);		
	    }
    });
    
    it('should get VALID prices for item with category activity', function() {
		//arrange
	     var iCalculationVersionId = "2314";
	     var iItemId = '3002';
	
		//act
	     var procedure = oMockstarPlc.loadProcedure();
		 var result = procedure(sSessionId, iCalculationVersionId, iItemId,sSessionLanguage);
	
		//assert
		 var oActivityPrice =  Array.slice(result.OT_ALL_PRICES_ACTIVITY);
	 
	    expect(oActivityPrice).toMatchData({
	    	"PRICE_SOURCE_ID":           	[oActivityPriceTestDataPlc.PRICE_SOURCE_ID[2]],
			"CONTROLLING_AREA_ID":          [oActivityPriceTestDataPlc.CONTROLLING_AREA_ID[2]],
			"COST_CENTER_ID":               [oActivityPriceTestDataPlc.COST_CENTER_ID[2]],
			"ACTIVITY_TYPE_ID":             [oActivityPriceTestDataPlc.ACTIVITY_TYPE_ID[2]],
			"PROJECT_ID": 			        [oActivityPriceTestDataPlc.PROJECT_ID[2]],
			"CUSTOMER_ID": 			        [oActivityPriceTestDataPlc.CUSTOMER_ID[2]],
			"VALID_FROM": 			        [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[2]))],
			"VALID_TO": 			        [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_TO[2]))],
			"VALID_FROM_QUANTITY":		    [oActivityPriceTestDataPlc.VALID_FROM_QUANTITY[0]],
			"VALID_TO_QUANTITY": 		    [null],
			"PRICE_FIXED_PORTION":          [oActivityPriceTestDataPlc.PRICE_FIXED_PORTION[2]],
			"PRICE_VARIABLE_PORTION":   	[oActivityPriceTestDataPlc.PRICE_VARIABLE_PORTION[2]],
			"TRANSACTION_CURRENCY_ID":[oActivityPriceTestDataPlc.TRANSACTION_CURRENCY_ID[2]],
			"PRICE_UNIT":                    [oActivityPriceTestDataPlc.PRICE_UNIT[2]],
            "PRICE_UNIT_UOM_ID":             [oActivityPriceTestDataPlc.PRICE_UNIT_UOM_ID[2]],
            "PRICE_ID":                     [oActivityPriceTestDataPlc.PRICE_ID[2]],
			"_VALID_FROM":                   [new Date(Date.parse(oActivityPriceTestDataPlc.VALID_FROM[2]))],
    		"_VALID_TO":	                 [null],
			"_SOURCE":                       [oActivityPriceTestDataPlc._SOURCE[2]],
			"_CREATED_BY":  		 [null],
			"_VALID_FROM_FIRST_VERSION":     [null],
			"_CREATED_BY_FIRST_VERSION":[null],
	     }, ["PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID", "VALID_FROM",  "_VALID_FROM", "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM_QUANTITY"]);
	    
	    var oProject =  Array.slice(result.OT_PROJECT);
	    expect(result.OT_PROJECT).toBeDefined();
		expect(Array.slice(result.OT_PROJECT).length).toBe(0);
	    
    }); 
    
    it('should determine prices with multiple plants if PLANT_ID is empty', function() {

         //arrange
         var iCalculationVersionId = "2314";
		 var iItemId = '3001';
		 var iIndexPrice0 = 4;
		 var iIndexPrice1 = 2;
		 var iIndexPrice2 = 0;
		 var iIndexPrice3 = 1;
         var iIndexPrice4 = 3;
         oMockstarPlc.execSingle(`update {{item_temporary}} set plant_id = null;`);
	
		//act
	     var procedure = oMockstarPlc.loadProcedure();
		 var result = procedure(sSessionId, iCalculationVersionId, iItemId,sSessionLanguage);
	
		//assert
		 var oMaterialPrice =  Array.slice(result.OT_ALL_PRICES_MATERIAL);
	 
		 expect(oMaterialPrice).toMatchData({
				"PRICE_SOURCE_ID":           	[oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice3],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice4]],
				"MATERIAL_ID":                  [oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice1],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice0],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice2],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice3],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice4]],
				"PLANT_ID":                    [oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice3],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice4]],
				"VENDOR_ID":                    [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice1],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice0],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice2],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice3],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice4]],
				"PURCHASING_GROUP": 			[null,null,null,null,null],
				"PURCHASING_DOCUMENT": 			[null,null,null,null,null],
				"LOCAL_CONTENT": 			    [null,null,null,null,null],
				"PROJECT_ID":		            [oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice3],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice4]],
				"CUSTOMER_ID":		            [oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice1],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice0],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice2],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice3],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice4]],
				"VALID_FROM": 		            [new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice1])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice0])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice3])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice4]))],
				"VALID_TO":                     [new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice2])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice0])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice3])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_TO[iIndexPrice4]))],
				"VALID_FROM_QUANTITY":   	    [oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice1],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice0],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice2],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice3],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice4]],
				"VALID_TO_QUANTITY": 	        [null,null,null,null,null],
				"PRICE_FIXED_PORTION":          [oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice3],oMaterialPriceTestDataPlc.PRICE_FIXED_PORTION[iIndexPrice4]],
				"PRICE_VARIABLE_PORTION":       [oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice3],oMaterialPriceTestDataPlc.PRICE_VARIABLE_PORTION[iIndexPrice4]],
				"TRANSACTION_CURRENCY_ID":[oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice1],oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice0],oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice2],oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice3],oMaterialPriceTestDataPlc.TRANSACTION_CURRENCY_ID[iIndexPrice4]],
	    		"PRICE_UNIT":	                [oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice3],oMaterialPriceTestDataPlc.PRICE_UNIT[iIndexPrice4]],
				"PRICE_UNIT_UOM_ID":            [oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice3],oMaterialPriceTestDataPlc.PRICE_UNIT_UOM_ID[iIndexPrice4]],
				"_VALID_FROM":  			    [new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice1])), new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice0])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice3])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice4]))],
				"_VALID_TO":    			    [null,null,null,null,null],
				"_SOURCE":                      [oMaterialPriceTestDataPlc._SOURCE[iIndexPrice1],oMaterialPriceTestDataPlc._SOURCE[iIndexPrice0],oMaterialPriceTestDataPlc._SOURCE[iIndexPrice2],oMaterialPriceTestDataPlc._SOURCE[iIndexPrice3], oMaterialPriceTestDataPlc._SOURCE[iIndexPrice4]],
				"_CREATED_BY":          [null,null,null,null,null],
				"_VALID_FROM_FIRST_VERSION":    [null,null,null,null,null],
		        "_CREATED_BY_FIRST_VERSION": [null,null,null,null,null],
		     }, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "CUSTOMER_ID", "_VALID_FROM", "VALID_FROM", "VALID_FROM_QUANTITY"]);
		  
		  if(jasmine.plcTestRunParameters.generatedFields === true){
		    	expect(oMaterialPrice).toMatchData({
					"PRICE_SOURCE_ID":           	[oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice4],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice3]],
					"MATERIAL_ID":                  [oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice1],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice0],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice2],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice4], oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice3]],
					"PLANT_ID":                     [oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice4],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice3]],
					"VENDOR_ID":                    [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice1],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice0],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice2],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice4],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice3]],
					"PROJECT_ID":		            [oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice1],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice4],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice3]],
					"CUSTOMER_ID":		            [oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice1],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice0],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice2],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice4],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice3]],
					"VALID_FROM": 		            [new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice1])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice0])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice4])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice3]))],
					"VALID_FROM_QUANTITY":   	    [oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice1],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice0],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice2],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice4],oMaterialPriceTestDataPlc.VALID_FROM_QUANTITY[iIndexPrice3]],
					"_VALID_FROM":  			    [new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice1])), new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice0])), new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice4])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice3]))],
					"CMPR_BOOLEAN_INT_MANUAL": 		[oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice1],oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice4],oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_MANUAL[iIndexPrice3]],
		    		"CMPR_BOOLEAN_INT_UNIT":		[oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice4], oMaterialPriceExtTestDataPlc.CMPR_BOOLEAN_INT_UNIT[iIndexPrice3]],
		    		"CMPR_DECIMAL_MANUAL": 			[oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_MANUAL[iIndexPrice3]],
		    		"CMPR_DECIMAL_UNIT": 			[oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_UNIT[iIndexPrice3]],
		    		"CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[iIndexPrice3]],
		    		"CMPR_DECIMAL_WITH_CURRENCY_UNIT": 	 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_CURRENCY_UNIT[iIndexPrice3]],
		    		"CMPR_DECIMAL_WITH_UOM_MANUAL": 	 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_MANUAL[iIndexPrice3]],
		    		"CMPR_DECIMAL_WITH_UOM_UNIT": 		 [oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice1], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice0], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice2], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice4], oMaterialPriceExtTestDataPlc.CMPR_DECIMAL_WITH_UOM_UNIT[iIndexPrice3]]	
		    	}, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "CUSTOMER_ID", "_VALID_FROM", "VALID_FROM", "VALID_FROM_QUANTITY"]);		
		    }
	    
    }); 

	it('should ignore vendor filters for items with category material', function() {
		
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

	     var iCalculationVersionId = "2314";
		 var iItemId = '3001';
		 var iIndexPrice0 = 0;
		 var iIndexPrice1 = 1;
		 var iIndexPrice2 = 2;
		 var iIndexPrice3 = 4;
			
		 //act
	     var procedure = oMockstarPlc.loadProcedure();
		 var result = procedure(sSessionId, iCalculationVersionId, iItemId, sSessionLanguage);
	
		//assert
	     var oMaterialPrice =  Array.slice(result.OT_ALL_PRICES_MATERIAL);
		 
	    expect(oMaterialPrice).toMatchData({
				"PRICE_SOURCE_ID":           	[oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice0], oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice3], oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_SOURCE_ID[iIndexPrice1]],
				"MATERIAL_ID":                  [oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice0],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice3],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice2],oMaterialPriceTestDataPlc.MATERIAL_ID[iIndexPrice1]],
				"PLANT_ID":                     [oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice3],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PLANT_ID[iIndexPrice1]],
				"VENDOR_ID":                    [oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice0],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice3],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice2],oMaterialPriceTestDataPlc.VENDOR_ID[iIndexPrice1]],
				"PROJECT_ID":		            [oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice3],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PROJECT_ID[iIndexPrice1]],
				"CUSTOMER_ID":                  [oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice0],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice3],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice2],oMaterialPriceTestDataPlc.CUSTOMER_ID[iIndexPrice1]],
				"VALID_FROM": 		            [new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice0])), new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice3])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc.VALID_FROM[iIndexPrice1]))],
				"PRICE_ID":	                	[oMaterialPriceTestDataPlc.PRICE_ID[iIndexPrice0],oMaterialPriceTestDataPlc.PRICE_ID[iIndexPrice3],oMaterialPriceTestDataPlc.PRICE_ID[iIndexPrice2],oMaterialPriceTestDataPlc.PRICE_ID[iIndexPrice1]],
				"_VALID_FROM":  			    [new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice0])), new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice3])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice2])),new Date(Date.parse(oMaterialPriceTestDataPlc._VALID_FROM[iIndexPrice1]))],
		}, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "PRICE_ID", "_VALID_FROM"]);
	    
	    expect(result.OT_PROJECT).toBeDefined();
		expect(Array.slice(result.OT_PROJECT).length).toBe(0);
   }); 
    
 }).addTags(["All_Unit_Tests","CF_Unit_Tests"]);