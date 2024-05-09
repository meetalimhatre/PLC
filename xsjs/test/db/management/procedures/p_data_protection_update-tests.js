var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var testData = require("../../../testdata/testdata").data;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;

describe("p_data_protection_update_user_ids", function(){
	
	var testPackage = $.session.getUsername().toLowerCase();
	var oMockstar = null;
	var sTestUser  = 'Test';
	var sTestUser2 = 'Test2';
	var sTestUserDeleted = 'DELETED';
	var sTestUserThatDoesntExistInTables = 'NoUser';
	var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON();
	var sComponentSplitId = "1";
	
	var oAccountTestDataPlc ={
			"ACCOUNT_ID":["200"],
			"CONTROLLING_AREA_ID":[testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3]],
			"_VALID_FROM":["2014-04-23 08:00:00"],
			"_VALID_TO":["2018-04-23 08:00:00"],
			"_SOURCE":[1],
			"_CREATED_BY":[sTestUser]
	   };
	var oPriceSourceTestDataPlc={
			"PRICE_SOURCE_ID":["300"],
			"PRICE_SOURCE_TYPE_ID":[1],
			"CONFIDENCE_LEVEL_ID":[3],
			"DETERMINATION_SEQUENCE":[1],
			"CREATED_ON":["2014-04-23 08:00:00"],
			"CREATED_BY":[sTestUser],
			"LAST_MODIFIED_ON":["2017-04-23 08:00:00"],
			"LAST_MODIFIED_BY":[sTestUser2]
			
	   };
	var oProjectTestData={
			"PROJECT_ID":				["PR1",						"PR2"],
			"ENTITY_ID":   				[1,                           2],
			"REFERENCE_PROJECT_ID":		["0",						"0"],
			"PROJECT_NAME":				["Prj 1",					"Prj 2"],
			"PROJECT_RESPONSIBLE":		[sTestUser,					sTestUser2],
			"CONTROLLING_AREA_ID":		[testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3], testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3]],
			"CUSTOMER_ID":				['C1',						'C1'],
			"SALES_DOCUMENT":			["SD1",						"SD1"],
			"SALES_PRICE":				['20',						'10'],
			"SALES_PRICE_CURRENCY_ID":	["EUR",						"EUR"],
			"COMMENT":					["Comment 1",				"Comment 2"],
			"COMPANY_CODE_ID":			["CC1",						"CC1"],
			"PLANT_ID":					["PL1",						"PL1"],
			"BUSINESS_AREA_ID":			["B1",						"B1"],
			"PROFIT_CENTER_ID":			["P4",						"P4"],
			"REPORT_CURRENCY_ID":		["EUR",						"EUR"],
			"COSTING_SHEET_ID":			["COGM",					"COGM"],
			"COMPONENT_SPLIT_ID":		[sComponentSplitId,			sComponentSplitId],
			"START_OF_PROJECT":			[sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
			"END_OF_PROJECT":			[sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
			"START_OF_PRODUCTION":		[sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
			"END_OF_PRODUCTION":		[sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
			"VALUATION_DATE":			[sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
			"LIFECYCLE_VALUATION_DATE":[sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
			"LIFECYCLE_PERIOD_INTERVAL":[12,						12],
			"CREATED_ON":				[sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
			"CREATED_BY":		[sTestUser, 				sTestUser2],
			"LAST_MODIFIED_ON":			[sExpectedDateWithoutTime,	sExpectedDateWithoutTime],
			"LAST_MODIFIED_BY":	[sTestUser2, 				sTestUser],
			"MATERIAL_PRICE_STRATEGY_ID":[sStandardPriceStrategy,            sStandardPriceStrategy],
			"ACTIVITY_PRICE_STRATEGY_ID":[sStandardPriceStrategy,            sStandardPriceStrategy]
	   };
	var oCalculationVersionTestData = {
            "CALCULATION_VERSION_ID":[2809,4809,5809],
            "CALCULATION_ID":[1978,2078,5078],
            "CALCULATION_VERSION_NAME":["Baseline Version","Baseline Version","Baseline Version"],
            "ROOT_ITEM_ID":[3001,5001,7001],
            "REPORT_CURRENCY_ID":["EUR","USD","EUR"],
            "VALUATION_DATE":["2014-06-01","2014-06-01","2014-06-01"],
            "LAST_MODIFIED_ON":["2014-04-23 08:00:00","2014-04-23 08:00:00","2018-04-25 08:00:00"],
            "LAST_MODIFIED_BY":[sTestUser, sTestUser2, sTestUser],
			"MASTER_DATA_TIMESTAMP" : ["2014-04-23 08:00:00","2014-04-23 08:00:00","2018-04-25 08:00:00"],
			"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
            "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
		};
	 var oCalculationTestData = { 
	            "CALCULATION_ID":[1978,2078,5078],
	            "CALCULATION_NAME":["Kalkulation Pumpe P-100","Calculation Pump P-100","Calc Key Finder"],
	            "CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
	            "CREATED_BY":[sTestUser, sTestUser, sTestUser],
	            "LAST_MODIFIED_ON":["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
	            "LAST_MODIFIED_BY":[sTestUser2, sTestUser2, sTestUser2]
		  };
	 var oFolderTestData = {
				"ENTITY_ID": [111,222,333],
				"FOLDER_NAME":  ["Folder 1", "Folder 2", "Folder 3"],
				"CREATED_BY":  [sTestUser, sTestUser2, sTestUser],
				"MODIFIED_BY": [sTestUser2, sTestUser, sTestUser2],
				"CREATED_ON":  ["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
				"MODIFIED_ON": ["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-06-19 08:00:00.2340000"]
	 };
	 var oActivityPriceTestData = {
				"PRICE_ID": ["280000E0B2BDB9671600A4000936462B","280000E0B2BDB9671600A4000936462C","280000E0B2BDB9671600A4000936462D"],
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
				"_VALID_FROM": ["2015-08-08T00:00:00.000Z","2015-08-08T00:00:00.000Z","2016-08-08T00:00:00.000Z"],
				"_VALID_TO":[null, null, null],
				"_SOURCE": [1,1,1],
				"_CREATED_BY": [sTestUser, sTestUser2, sTestUser],
				"_CREATED_BY_FIRST_VERSION": [sTestUser, sTestUser, sTestUser2]
	 };	 
	var oMaterialPriceTestData = {
			"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["101","201","101","101"],
			"MATERIAL_ID": ["MAT1","MATEN","MAT1","MAT1"],
			"PLANT_ID": ["PL1","","","PL2"],
			"VENDOR_ID": ["*","*","*","*"],
			"PROJECT_ID": ["*", "*", "*", "*"],
			"CUSTOMER_ID": ["*", "*", "*", "*"],
			"VALID_FROM": ["2015-06-19","2010-01-01","2010-01-01","2010-01-01"],
			"VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
			"PRICE_FIXED_PORTION": ["123.4500000", "123.8800000", "121.2500000", "121.2500000"],
			"PRICE_VARIABLE_PORTION": ["234.5600000", "234.9800000", "200.5500000", "234.9900000"],
			"TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
			"PRICE_UNIT": ["1.0000000", '100.0000000', "1.0000000", '2.0000000'],
			"PRICE_UNIT_UOM_ID": ["H","H","H","H"],
			"IS_PRICE_SPLIT_ACTIVE": [0,0,0,0],
			"IS_PREFERRED_VENDOR": [0,0,0,0],
			"_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
			"_SOURCE": [1,2,1,1],
			"_CREATED_BY": [sTestUser, sTestUser2, sTestUser, sTestUser2],
			"_CREATED_BY_FIRST_VERSION": [sTestUser2, sTestUser, sTestUser2, sTestUser]
	};
	var oPriceFirstVersionTestData = {
			"PRICE_ID": ["280000E0B2BDB9671600A4000936462B","280000E0B2BDB9671600A4000936462C","280000E0B2BDB9671600A4000936462D"],
			"_VALID_FROM": ["2015-01-02","2010-01-03","2010-01-04"],
			"_CREATED_BY": [sTestUser2, sTestUser, sTestUser2]
	 };
	 var oItemCategoryTestData={
			"ITEM_CATEGORY_ID":[0,1,2,3,4,5,6,7,8,9,10],
			"DISPLAY_ORDER":[0,1,2,3,4,5,6,7,8,9,10],
			"CHILD_ITEM_CATEGORY_ID":[0,1,2,3,4,5,6,7,8,9,10],
			"ITEM_CATEGORY_CODE":['CODE0','CODE1','CODE2','CODE3','CODE4','CODE5','CODE6','CODE7','CODE8','CODE9','CODE10'],
			"ICON":['icon0','icon1','icon2','icon3','icon4','icon5','icon6','icon7','icon8','icon9','icon10'],
			"CREATED_BY":[sTestUser, sTestUser, sTestUser, sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser],
			"LAST_MODIFIED_BY":[sTestUser, sTestUser, sTestUser, sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser]
	};
	var oMetadataStaging={
			"PATH":["Project","Project.Customer","Project.Plant"],
			"BUSINESS_OBJECT":["Project","Customer","Plant"],
			"COLUMN_ID":["PROJECT_ID","CUSTOMER_ID","PLANT_ID"],
			"IS_CUSTOM":[0,0,0],
			"ROLLUP_TYPE_ID":[0,0,0],
			"SIDE_PANEL_GROUP_ID":[401,401,402],
			"DISPLAY_ORDER":[1,6,1],
			"TABLE_DISPLAY_ORDER":[null,null,null],
			"REF_UOM_CURRENCY_PATH":[null,null,null],
			"REF_UOM_CURRENCY_BUSINESS_OBJECT":[null,null,null],
			"REF_UOM_CURRENCY_COLUMN_ID":[null,null,null],
			"UOM_CURRENCY_FLAG":[null,null,null],
			"SEMANTIC_DATA_TYPE":["String","String","String"],
			"SEMANTIC_DATA_TYPE_ATTRIBUTES":["length=35; uppercase=1","length=10; uppercase=1","length=8; uppercase=1"],
			"VALIDATION_REGEX_ID":["MASTERDATA","MASTERDATA","MASTERDATA"],
			"PROPERTY_TYPE":[3,8,8],
			"IS_IMMUTABLE_AFTER_SAVE":[1,null,null],
			"IS_REQUIRED_IN_MASTERDATA":[null,null,null],
			"IS_WILDCARD_ALLOWED":[null,null,null],
			"IS_USABLE_IN_FORMULA":[null,null,null],
			"RESOURCE_KEY_DISPLAY_NAME":["XFLD_Project_ProjectId","XFLD_Project_Customer","XFLD_Project_Plant"],
			"RESOURCE_KEY_DISPLAY_DESCRIPTION":["XTOL_Project_ProjectId","XTOL_Project_Customer","XTOL_Project_Plant"],
			"CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
			"CREATED_BY":[sTestUser, sTestUser2, sTestUser],
			"LAST_MODIFIED_ON":["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
			"LAST_MODIFIED_BY":[sTestUser2, sTestUser, sTestUser2],
	};
	var oMetadataTextStaging={
		"PATH":["Project","Project.Customer","Project.Plant"],
		"COLUMN_ID":["PROJECT_ID","CUSTOMER_ID","PLANT_ID"],
		"LANGUAGE":["EN","DE","FR"],
		"DISPLAY_NAME":["Name 1","Name 2","Name 3"],
		"DISPLAY_DESCRIPTION":["Description 1","Description 2","Description 3"],
		"CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
		"CREATED_BY":[sTestUser2, sTestUser, sTestUser2],
		"LAST_MODIFIED_ON":["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
		"LAST_MODIFIED_BY":[sTestUser, sTestUser2, sTestUser],
};
	 
		beforeOnce(function() {
			oMockstar = new MockstarFacade({ // Initialize Mockstar
				testmodel: "sap.plc.db.management.procedures/p_data_protection_update_user_ids",
				substituteTables: // substitute all used tables in the procedure or view
				{
					account: {
						name: "sap.plc.db::basis.t_account",
						data: oAccountTestDataPlc
					},
					account_account_group: {
						name: "sap.plc.db::basis.t_account_account_group"
					},
					account_group: {
						name: "sap.plc.db::basis.t_account_group"
					},
					component_split_account_group: {
						name: "sap.plc.db::basis.t_component_split_account_group"
					},
					account_group__text: {
						name: "sap.plc.db::basis.t_account_group__text"
					},
					account__text: {
						name: "sap.plc.db::basis.t_account__text"
					},
					activity_price: {
						name: "sap.plc.db::basis.t_activity_price",
						data: oActivityPriceTestData
					},
					activity_price_first_version: {
						name: "sap.plc.db::basis.t_activity_price__first_version",
						data: oPriceFirstVersionTestData
					},
					activity_type: {
						name: "sap.plc.db::basis.t_activity_type"
					},
					activity_type__text: {
						name: "sap.plc.db::basis.t_activity_type__text"
					},
					addin_configuration_header: {
						name: "sap.plc.db::basis.t_addin_configuration_header"
					},
					addin_version: {
						name: "sap.plc.db::basis.t_addin_version"
					},
					business_area: {
						name: "sap.plc.db::basis.t_business_area"
					},
					business_area__text: {
						name: "sap.plc.db::basis.t_business_area__text"
					},
					process: {
						name: "sap.plc.db::basis.t_process"
					},
					process__text: {
						name: "sap.plc.db::basis.t_process__text"
					},
					calculation: {
						name: "sap.plc.db::basis.t_calculation",
						data: oCalculationTestData
					},
					calculation_version: {
						name: "sap.plc.db::basis.t_calculation_version",
						data: oCalculationVersionTestData
					},
					calculation_version_temporary: {
						name: "sap.plc.db::basis.t_calculation_version_temporary"
					},
					company_code: {
						name: "sap.plc.db::basis.t_company_code"
					},
					company_code__text: {
						name: "sap.plc.db::basis.t_company_code__text"
					},
					component_split: {
						name: "sap.plc.db::basis.t_component_split"
					},
					component_split__text: {
						name: "sap.plc.db::basis.t_component_split__text"
					},
					controlling_area: {
						name: "sap.plc.db::basis.t_controlling_area"
					},
					controlling_area__text: {
						name: "sap.plc.db::basis.t_controlling_area__text"
					},
					costing_sheet: {
						name: "sap.plc.db::basis.t_costing_sheet"
					},
					costing_sheet_base: {
						name: "sap.plc.db::basis.t_costing_sheet_base"
					},
					costing_sheet_base_row: {
						name: "sap.plc.db::basis.t_costing_sheet_base_row"
					},
					costing_sheet_overhead: {
						name: "sap.plc.db::basis.t_costing_sheet_overhead"
					},
					costing_sheet_overhead_row: {
						name: "sap.plc.db::basis.t_costing_sheet_overhead_row"
					},
					costing_sheet_row: {
						name: "sap.plc.db::basis.t_costing_sheet_row"
					},
					costing_sheet_row_dependencies: {
						name: "sap.plc.db::basis.t_costing_sheet_row_dependencies"
					},
					costing_sheet_row__text: {
						name: "sap.plc.db::basis.t_costing_sheet_row__text"
					},
					costing_sheet__text: {
						name: "sap.plc.db::basis.t_costing_sheet__text"
					},
					cost_center: {
						name: "sap.plc.db::basis.t_cost_center"
					},
					cost_center__text: {
						name: "sap.plc.db::basis.t_cost_center__text"
					},
					currency: {
						name: "sap.plc.db::basis.t_currency"
					},
					currency_conversion: {
						name: "sap.plc.db::basis.t_currency_conversion"
					},
					currency__text: {
						name: "sap.plc.db::basis.t_currency__text"
					},
					customer: {
						name: "sap.plc.db::basis.t_customer"
					},
					dimension: {
						name: "sap.plc.db::basis.t_dimension"
					},
					dimension__text: {
						name: "sap.plc.db::basis.t_dimension__text"
					},
					document: {
						name: "sap.plc.db::basis.t_document"
					},
					document_material: {
						name: "sap.plc.db::basis.t_document_material"
					},
					document_status: {
						name: "sap.plc.db::basis.t_document_status"
					},
					document_status__text: {
						name: "sap.plc.db::basis.t_document_status__text"
					},
					document_type: {
						name: "sap.plc.db::basis.t_document_type"
					},
					document_type__text: {
						name: "sap.plc.db::basis.t_document_type__text"
					},
					document__text: {
						name: "sap.plc.db::basis.t_document__text"
					},
					item: {
						name: "sap.plc.db::basis.t_item"
					},
					item_category :{
						name: "sap.plc.db::basis.t_item_category",
						data: oItemCategoryTestData

					},
					item_temporary: {
						name: "sap.plc.db::basis.t_item_temporary"
					},
					design_office: {
						name: "sap.plc.db::basis.t_design_office"
					},
					design_office__text: {
						name: "sap.plc.db::basis.t_design_office__text"
					},
					language: {
						name: "sap.plc.db::basis.t_language"
					},
					material: {
						name: "sap.plc.db::basis.t_material"
					},
					material_account_determination: {
						name: "sap.plc.db::basis.t_material_account_determination"
					},
					material_group: {
						name: "sap.plc.db::basis.t_material_group"
					},
					material_group__text: {
						name: "sap.plc.db::basis.t_material_group__text"
					},
					material_plant: {
						name: "sap.plc.db::basis.t_material_plant"
					},
					material_type: {
						name: "sap.plc.db::basis.t_material_type"
					},
					material_type__text: {
						name: "sap.plc.db::basis.t_material_type__text"
					},
					material__text: {
						name: "sap.plc.db::basis.t_material__text"
					},
					metadata: {
						name: "sap.plc.db::basis.t_metadata"
					},
					metadata_item_attributes: {
						name: "sap.plc.db::basis.t_metadata_item_attributes"
					},
					metadata_staging: {
						name: "sap.plc.db::basis.t_metadata_staging",
						data: oMetadataStaging
					},
					metadata__text: {
						name: "sap.plc.db::basis.t_metadata__text"
					},
					metadata__text_staging: {
						name: "sap.plc.db::basis.t_metadata__text_staging",
						data: oMetadataTextStaging
					},
					overhead_group: {
						name: "sap.plc.db::basis.t_overhead_group"
					},
					overhead_group__text: {
						name: "sap.plc.db::basis.t_overhead_group__text"
					},
					plant: {
						name: "sap.plc.db::basis.t_plant"
					},
					plant__text: {
						name: "sap.plc.db::basis.t_plant__text"
					},
					material_price: {
						name: "sap.plc.db::basis.t_material_price",
						data: oMaterialPriceTestData
					},
					material_price_first_version: {
						name: "sap.plc.db::basis.t_material_price__first_version",
						data: oPriceFirstVersionTestData
					},
					price_source: {
						name: "sap.plc.db::basis.t_price_source",
						data: oPriceSourceTestDataPlc
					},
					profit_center: {
						name: "sap.plc.db::basis.t_profit_center"
					},
					profit_center__text: {
						name: "sap.plc.db::basis.t_profit_center__text"
					},
					project: {
						name: "sap.plc.db::basis.t_project",
						data: oProjectTestData
					},
					project_lifecycle_configuration: {
						name: "sap.plc.db::basis.t_project_lifecycle_configuration"
					},
					uom: {
						name: "sap.plc.db::basis.t_uom"
					},
					uom__text: {
						name: "sap.plc.db::basis.t_uom__text"
					},
					valuation_class: {
						name: "sap.plc.db::basis.t_valuation_class"
					},
					valuation_class__text: {
						name: "sap.plc.db::basis.t_valuation_class__text"
					},
					vendor: {
						name: "sap.plc.db::basis.t_vendor"
					},
					work_center: {
						name: "sap.plc.db::basis.t_work_center"
					},
					work_center_activity_type: {
						name: "sap.plc.db::basis.t_work_center_activity_type"
					},
					work_center__text: {
						name: "sap.plc.db::basis.t_work_center__text"
					},
					folder: {
						name: "sap.plc.db::basis.t_folder",
						data: oFolderTestData
					}
				}
			});
		});
		
		beforeEach(function() {
			oMockstar.clearAllTables(); // clear all specified substitute tables and views
			oMockstar.initializeData();
		});

		afterOnce(function() {
			oMockstar.cleanup(testPackage+"sap.plc.db.management.procedures");
		});

		afterEach(function() {  });

		describe('Replace user id', function() {	
		    
			it('Should replace exiting user id with placeholder', function() {
				// act 
			     var procedure = oMockstar.loadProcedure();
				 var result = procedure(sTestUser);

				// assert				
				expect(mockstar_helpers.getRowCount(oMockstar, "project", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(1);	
				expect(mockstar_helpers.getRowCount(oMockstar, "project", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(1);
				expect(mockstar_helpers.getRowCount(oMockstar, "account", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(1);
				expect(mockstar_helpers.getRowCount(oMockstar, "price_source", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(1);
				expect(mockstar_helpers.getRowCount(oMockstar, "price_source", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "calculation_version", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(2);
				expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(3);
				expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "folder", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(2);
				expect(mockstar_helpers.getRowCount(oMockstar, "folder", "MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(1);
				expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(2);	
				expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "_CREATED_BY_FIRST_VERSION = '"+ sTestUserDeleted +"'")).toBe(2);	
				expect(mockstar_helpers.getRowCount(oMockstar, "activity_price_first_version", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(1);	
				expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(2);	
				expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY_FIRST_VERSION = '"+ sTestUserDeleted +"'")).toBe(2);	
				expect(mockstar_helpers.getRowCount(oMockstar, "material_price_first_version", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(1);	
				expect(mockstar_helpers.getRowCount(oMockstar, "item_category", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(11);	
				expect(mockstar_helpers.getRowCount(oMockstar, "item_category", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(11);
				expect(mockstar_helpers.getRowCount(oMockstar, "metadata_staging", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(2);
				expect(mockstar_helpers.getRowCount(oMockstar, "metadata_staging", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(1);
				expect(mockstar_helpers.getRowCount(oMockstar, "metadata__text_staging", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(1);
				expect(mockstar_helpers.getRowCount(oMockstar, "metadata__text_staging", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(2);
			});	
		
			it('Should not replace the user id with placeholder if it does not exist', function(){
				//act
			     var procedure = oMockstar.loadProcedure();
				 var result = procedure(sTestUserThatDoesntExistInTables);
	
				// assert
				expect(mockstar_helpers.getRowCount(oMockstar, "project", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "project", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "account", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "price_source", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "price_source", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "calculation_version", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);	
				expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "_CREATED_BY_FIRST_VERSION = '"+ sTestUserDeleted +"'")).toBe(0);	
				expect(mockstar_helpers.getRowCount(oMockstar, "activity_price_first_version", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);	
				expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);	
				expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY_FIRST_VERSION = '"+ sTestUserDeleted +"'")).toBe(0);	
				expect(mockstar_helpers.getRowCount(oMockstar, "material_price_first_version", "_CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);	
				expect(mockstar_helpers.getRowCount(oMockstar, "item_category", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);	
				expect(mockstar_helpers.getRowCount(oMockstar, "item_category", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "metadata_staging", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);	
				expect(mockstar_helpers.getRowCount(oMockstar, "metadata_staging", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "metadata__text_staging", "CREATED_BY = '"+ sTestUserDeleted +"'")).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "metadata__text_staging", "LAST_MODIFIED_BY = '"+ sTestUserDeleted +"'")).toBe(0);	
			});
			
		});
	
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);