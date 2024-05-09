var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../testdata/testdata").data;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;

if(jasmine.plcTestRunParameters.mode === 'all'){

	describe('db.administration:p_calculation_configuration_masterdata_read',function() {
		var oMockstarPlc = null;
		var sSessionId1 = $.session.getUsername();
		var sTestUser = $.session.getUsername();
		var sValidFrom = '2015-01-01T15:39:09.691Z';

		var sMasterdataTimestampDate = new Date().toJSON();
		var sExpectedDate = new Date().toJSON();
		var sExpectedDateWithoutTime = new Date(2016, 8, 20).toJSON(); //"2011-08-20";

		var oCalculation = {
				"CALCULATION_ID" : [ 1978],
				"PROJECT_ID" : [ "PR1"],
				"CALCULATION_NAME" : [ "Kalkulation Pumpe P-100"],
				"CURRENT_CALCULATION_VERSION_ID" : [ 2809],
				"CREATED_ON" : [ sExpectedDate],
				"CREATED_BY" : [ sTestUser],
				"LAST_MODIFIED_ON" : [ sExpectedDate],
				"LAST_MODIFIED_BY" : [ sTestUser]
		};

		var oCalculationVersionTemporary = {
				"SESSION_ID" : [ sSessionId1],
				"CALCULATION_VERSION_ID" : [ 1],
				"CALCULATION_ID" : [ 1978 ],
				"CALCULATION_VERSION_NAME" : [ "Baseline Version"],
				"ROOT_ITEM_ID" : [ 3001],
				"CUSTOMER_ID" : [ ""],
				"SALES_PRICE" : [ 20 ],
				"SALES_PRICE_CURRENCY_ID" : [ "EUR" ],
				"REPORT_CURRENCY_ID" : [ "EUR"],
				"COSTING_SHEET_ID" : [ "COGM"],
				"COMPONENT_SPLIT_ID" : [ 1],
				"SALES_DOCUMENT" : ["DOC"],
				"START_OF_PRODUCTION" : [ sExpectedDateWithoutTime],
				"END_OF_PRODUCTION" : [ sExpectedDateWithoutTime],
				"VALUATION_DATE" : [ sExpectedDateWithoutTime],
				"LAST_MODIFIED_ON" : [ sExpectedDate],
				"LAST_MODIFIED_BY" : [ sTestUser],
				"MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate],
				"IS_FROZEN" : [ 0],
				"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy],
				"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy]
		};

		var oItemTemporary = {
				"ITEM_ID" : [ 3001, 3002, 3003, 3004],
				"CALCULATION_VERSION_ID" : [ 1,1,1,1],
				"PARENT_ITEM_ID" : [ null, 3001, 3002, 3002],
				"PREDECESSOR_ITEM_ID" : [ 0, 3001, 3002, 3003],
				"IS_ACTIVE" : [ 1, 1, 1, 1],
				"ITEM_CATEGORY_ID" : [ 0, 1, 3, 2],
				"ACCOUNT_ID" : [ "0", "0", "625000", "0"],
				"DOCUMENT_TYPE_ID" : [ "", "DT1", "", ""],
				"DOCUMENT_ID" : [ "", "D1", "", "", "", "" ],
				"DOCUMENT_VERSION" : [ "", "1", "", ""],
				"DOCUMENT_PART" : [ "", "1", "", ""],
				"MATERIAL_ID" : [ "", "", "MAT1", ""],
				"ACTIVITY_TYPE_ID" : [ "", "", "", ""],
				"PROCESS_ID" : [ "", "", "", ""],
				"LOT_SIZE" : [ null, null, null, null],
				"LOT_SIZE_IS_MANUAL" : [ null, null, null, null],
				"ENGINEERING_CHANGE_NUMBER_ID" : [ "", "", "", ""],
				"COMPANY_CODE_ID" : [ "", "", "CC1", ""],
				"COST_CENTER_ID" : [ "", "", "CC2", ""],
				"PLANT_ID" : [ "", "", "PL1", ""],
				"WORK_CENTER_ID" : [ "", "", "WC1", ""],
				"BUSINESS_AREA_ID" : [ "", "", "", ""],
				"PROFIT_CENTER_ID" : [ "", "", "", ""],
				"QUANTITY" : [ null, null, null, null],
				"QUANTITY_IS_MANUAL" : [ null, null, null, null],
				"QUANTITY_UOM_ID" : [ "", "", "", ""],
				"TOTAL_QUANTITY" : [ null, null, null, null],
				"TOTAL_QUANTITY_UOM_ID" : [ "", "", "", ""],
				"TOTAL_QUANTITY_DEPENDS_ON" : [ null, null, null, null],
				"PRICE_FIXED_PORTION":[0,2772.36,2246.88,900],
				"PRICE_FIXED_PORTION_IS_MANUAL":[null,null,null,null],
				"PRICE_VARIABLE_PORTION":[0,0,415.66,231],
				"PRICE_VARIABLE_PORTION_IS_MANUAL":[null,null,null,null],
				"PRICE":[null,2772.36,2662.54,200],
				"TRANSACTION_CURRENCY_ID":["EUR","EUR","EUR","EUR"],
				"PRICE_UNIT":[0,100,100,100],
				"PRICE_UNIT_IS_MANUAL":[null,null,null,null],
				"PRICE_UNIT_UOM_ID":["H","H","H","H"],
				"CONFIDENCE_LEVEL_ID":[null,null,null,null],
				"PRICE_SOURCE_ID":["","","",""],
				"IS_PRICE_SPLIT_ACTIVE":[0,0,1,1],
				"IS_DISABLING_ACCOUNT_DETERMINATION":[0,0,1,1],
				"PRICE_ID":[null,null,'280000E0B2BDB9671600A4000936462B','280000E0B2BDB9671600A4000936462B'],
				"VENDOR_ID":[null,null,null,null],
				"TARGET_COST" : [ null, null, null, null],
				"TARGET_COST_IS_MANUAL" : [ null, null, null, null],
				"TARGET_COST_CURRENCY_ID":["EUR","EUR","EUR","EUR"],
				"PRICE_FOR_TOTAL_QUANTITY" : [ null, null, null, null],
				"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION" : [ null, null, null, null],
				"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" : [ null, null, null, null],
				"OTHER_COST" : [ null, null, null, null],
				"OTHER_COST_FIXED_PORTION" : [ null, null, null, null],
				"OTHER_COST_VARIABLE_PORTION" : [ null, null, null, null],
				"TOTAL_COST" : [ null, null, null, null],
				"TOTAL_COST_FIXED_PORTION" : [ null, null, null, null],
				"TOTAL_COST_VARIABLE_PORTION" : [ null, null, null, null],
				"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
				"CREATED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser],
				"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
				"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser],
				"SESSION_ID" : [ sSessionId1, sSessionId1, sSessionId1, sSessionId1],
				"ITEM_DESCRIPTION" : [ "", "", "", ""],
				"COMMENT" : [ "1. Comment", "", "", ""],
				"IS_DIRTY" : [ 0, 0, 0, 0],
				"IS_DELETED" : [ 0, 0, 0, 0],
				"CHILD_ITEM_CATEGORY_ID" : [ 0, 1, 3, 2]
		};

		var oDocumentTestDataPlc = {
				"DOCUMENT_TYPE_ID" :['DT1'],
				"DOCUMENT_ID": ['D1'],
				"DOCUMENT_VERSION": ['1'],
				"DOCUMENT_PART": ['1'],
				"DOCUMENT_STATUS_ID" :['S1'],
				"DESIGN_OFFICE_ID" : ['L1'],
				"_VALID_FROM" : [sMasterdataTimestampDate],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};
		var oDocumentTypeTestDataPlc = {
				"DOCUMENT_TYPE_ID" :['DT1'],
				"_VALID_FROM" : [sMasterdataTimestampDate],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};
		var oDocumentStatusTestDataPlc = {
				"DOCUMENT_TYPE_ID" :['DT1'],
				"DOCUMENT_STATUS_ID": ['S1'],
				"_VALID_FROM" : [sMasterdataTimestampDate],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};

		var oMaterialTestDataPlc = {
				"MATERIAL_ID" : ['MAT1'],
				"MATERIAL_GROUP_ID": ['MG2'],
				"MATERIAL_TYPE_ID": ['MT2'],
				"IS_PHANTOM_MATERIAL" : [1],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_SOURCE" : [1],
				"_CREATED_BY" :['U000001']
		}

		var oWorkCenter ={
				"WORK_CENTER_ID": ['WC1]'],
				"PLANT_ID": ['PL1'],
				"COST_CENTER_ID": ['CC2'],
				"CONTROLLING_AREA_ID": ['1000'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_SOURCE" : [1],
				"_CREATED_BY" :['U000001']
		}

		var oCostCenter = {
				"COST_CENTER_ID" : ['CC2'],
				"CONTROLLING_AREA_ID" : ['1000'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null],
				"_SOURCE" : [11],
				"_CREATED_BY" :['U000001']
		};

		var oMaterialType = {
				"MATERIAL_TYPE_ID" :['MT2'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};

		var oMaterialGroup = {
				"MATERIAL_GROUP_ID" :['MG2'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};

		var oMaterialPlant = {
				"MATERIAL_ID" : ['MAT1'],
				"PLANT_ID" : ['PL1'],
				"OVERHEAD_GROUP_ID": ['O1'],
				"VALUATION_CLASS_ID": ['V1'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" :['U000001']
		};

		var oPlant = {
				"PLANT_ID" : ['PL1'],
				"COMPANY_CODE_ID" : ['CC1'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null],
				"_SOURCE" :[1],
				"_CREATED_BY" : ['U000001']
		};

		var oCompanyCode = {
				"COMPANY_CODE_ID" : ['CC1'],
				"CONTROLLING_AREA_ID" : ['1000'],
				"COMPANY_CODE_CURRENCY_ID" : ['EUR'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};

		var oControllingArea = {
				"CONTROLLING_AREA_ID" : ['1000'],
				"CONTROLLING_AREA_CURRENCY_ID" : ['EUR'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};

		var oCostingSheet = {
				"COSTING_SHEET_ID" : [ "COGM" ],
				"CONTROLLING_AREA_ID" : [ '1000' ],
				"IS_TOTAL_COST2_ENABLED" : [ 0 ],
				"IS_TOTAL_COST3_ENABLED": [ 0 ],
				"_VALID_FROM" : [ '2015-01-01T00:00:00.000Z' ],
				"_VALID_TO" :[ null ],
				"_SOURCE" : [ 1 ],
				"_CREATED_BY" : [ 'U000001' ]
		};

		var oCostingSheetRow = {
				"COSTING_SHEET_ROW_ID" : ["MEK", "MGK", "FEK", "FGK", "HK", "HH"],
				"COSTING_SHEET_ID" : ["COGM", "COGM", "COGM", "COGM", "COGM", "COGM"],
				"COSTING_SHEET_ROW_TYPE":[1,3,1,3,4,2],
				"COSTING_SHEET_BASE_ID":[,,,,,1],
				"ACCOUNT_GROUP_AS_BASE_ID": [ 13,, 15,,,],
				"COSTING_SHEET_OVERHEAD_ID": [ , 4,, 5,,],
				"CALCULATION_ORDER": [0, 1, 2, 3, 4, 5],
				"_VALID_FROM": [ '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
				"_VALID_TO": [ null, null, null, null, null,null],
				"_SOURCE": [ 1, 1, 1, 1, 1, 1],
				"_CREATED_BY": [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
		};

		var oCostingSheetBase = {
				"COSTING_SHEET_BASE_ID": [1],
				"COST_PORTION": [3],
				"_VALID_FROM": [ '2015-01-01T00:00:00.000Z'],
				"_VALID_TO": [null],
				"_SOURCE": [1],
				"_CREATED_BY": [ 'U000001']
		};

		var oCostingSheetBaseRow = {
				"COSTING_SHEET_BASE_ID": [1],
				"ITEM_CATEGORY_ID": [1],
				"SUBITEM_STATE":[1],
				"_VALID_FROM": [ '2015-01-01T00:00:00.000Z'],
				"_VALID_TO": [null],
				"_SOURCE": [1],
				"_CREATED_BY": [ 'U000001'],
				"CHILD_ITEM_CATEGORY_ID": [1]
		};

		var oCostingSheetOverhead = {
				"COSTING_SHEET_OVERHEAD_ID" : [4, 5],
				"CREDIT_ACCOUNT_ID" : ["655100", "655200"],
				"IS_ROLLED_UP" : [1, 1],
				"_VALID_FROM" : ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};

		var oCostingSheetOverheadRow = {
				"COSTING_SHEET_OVERHEAD_ROW_ID" : [1, 1],
				"COSTING_SHEET_OVERHEAD_ID" : [4, 5],
				"VALID_FROM" : ['2013-01-01', '2020-12-31'],
				"VALID_TO" : ['2013-01-01', '2020-12-31'],
				"CONTROLLING_AREA_ID" : ["1000", "1000"],
				"_VALID_FROM" : ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};

		var oCostingSheetRowDependencies = {
				"SOURCE_ROW_ID" : ["MGK", "FGK", "HK", "HK", "HK", "HK"],
				"TARGET_ROW_ID" : ["MEK", "FEK", "MEK", "MGK", "FEK", "FGK"],
				"COSTING_SHEET_ID" : ["COGM", "COGM", "COGM", "COGM", "COGM", "COGM"],
				"_VALID_FROM" : ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
				"_VALID_TO" : [null, "2015-08-08T00:00:00.000Z", null, "2015-08-08T00:00:00.000Z", null, null],
				"_SOURCE" : [1, 1, 1, 1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
		};

		var oAccountGroup = {
				"ACCOUNT_GROUP_ID": [ 13, 15],
				"CONTROLLING_AREA_ID" : [ '1000', '1000'],
				"_VALID_FROM": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
				"COST_PORTION" : [ 2, 3],
				"_VALID_TO" : [ null, null],
				"_SOURCE" : [ 1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};

		var oComponentSplit = {
				"COMPONENT_SPLIT_ID" : [ 1 ],
				"CONTROLLING_AREA_ID" : ["1000"],
				"_VALID_FROM": ["2015-01-01T00:00:00.000Z"],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ["U000001"]

		};

		var oItemTempId = {
				"ITEM_ID" : [ 3003 ]
		};

		var oPriceComponent = {
			"PRICE_ID":[ '280000E0B2BDB9671600A4000936462B', '280000E0B2BDB9671600A4000936462B',  '280000E0B2BDB9671600A4000936462B'],
			"_VALID_FROM":[sValidFrom, sValidFrom, sValidFrom],
			"ACCOUNT_ID":["0","#AC11","625000"],
			"PRICE_FIXED":[ "13.0000000", "2.0000000", "6.0000000"],
			"PRICE_VARIABLE":[ "14.0000000", "3.0000000", "7.0000000"],
			"CONTROLLING_AREA_ID":['1000', '1000', '1000']
		};

		var oActivityPriceTestData = {
			"PRICE_ID": ["280000E0B2BDB9671600A4000936462B","280000E0B2BDB9671600A4000936462B","280000E0B2BDB9671600A4000936462B"],
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
			"_VALID_FROM": [sValidFrom,"2015-08-08T00:00:00.000Z","2016-08-08T00:00:00.000Z"],
			"_VALID_TO":[null, "2016-08-08T00:00:00.000Z", sValidFrom],
			"_SOURCE": [1,1,1],
			"_CREATED_BY": ["I305778","U0001","U0001"]
	};

		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.administration.procedures/p_calculation_configuration_masterdata_read", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{
							calculation: {
								name: "sap.plc.db::basis.t_calculation",
								data: oCalculation
							},
							project: {
								name: "sap.plc.db::basis.t_project",
								data: testData.oProjectTestData
							},
							calculation_version_temporary: {
								name: "sap.plc.db::basis.t_calculation_version_temporary",
								data: oCalculationVersionTemporary
							},
							item_temporary: {
								name: "sap.plc.db::basis.t_item_temporary",
								data: oItemTemporary
							},
							document: {
								name: "sap.plc.db::basis.t_document",
								data: oDocumentTestDataPlc
							},
							document_type: {
								name: "sap.plc.db::basis.t_document_type",
								data: oDocumentTypeTestDataPlc
							},
							document_status: {
								name: "sap.plc.db::basis.t_document_status",
								data: oDocumentStatusTestDataPlc
							},
							component_split: {
								name: "sap.plc.db::basis.t_component_split",
								data: oComponentSplit
							},
							component_split__text: {
								name: "sap.plc.db::basis.t_component_split__text"
							},
							component_split_account_group: {
								name: "sap.plc.db::basis.t_component_split_account_group"
							},
							costing_sheet: {
								name: "sap.plc.db::basis.t_costing_sheet",
								data: oCostingSheet
							},
							costing_sheet__text: {
								name: "sap.plc.db::basis.t_costing_sheet__text"
							},
							account_group__text: {
								name: "sap.plc.db::basis.t_account_group__text"
							},
							costing_sheet_row: {
								name: "sap.plc.db::basis.t_costing_sheet_row",
								data: oCostingSheetRow
							},
							costing_sheet_row__text: {
								name: "sap.plc.db::basis.t_costing_sheet_row__text"
							},
							costing_sheet_base: {
								name: "sap.plc.db::basis.t_costing_sheet_base",
								data: oCostingSheetBase
							},
							costing_sheet_base_row: {
								name: "sap.plc.db::basis.t_costing_sheet_base_row",
								data: oCostingSheetBaseRow
							},
							costing_sheet_overhead: {
								name: "sap.plc.db::basis.t_costing_sheet_overhead",
								data: oCostingSheetOverhead
							},
							costing_sheet_overhead_row: {
								name: "sap.plc.db::basis.t_costing_sheet_overhead_row",
								data: oCostingSheetOverheadRow
							},
							costing_sheet_row_dependencies: {
								name: "sap.plc.db::basis.t_costing_sheet_row_dependencies",
								data: oCostingSheetRowDependencies
							},
							currency: {
								name: "sap.plc.db::basis.t_currency",
								data: testData.mCsvFiles.currency
							},
							unit_of_measure: {
								name: "sap.plc.db::basis.t_uom",
								data: testData.mCsvFiles.uom
							},
							account_group: {
								name: "sap.plc.db::basis.t_account_group",
								data: oAccountGroup
							},
							work_center: {
								name: "sap.plc.db::basis.t_work_center"
							},
							process: {
								name: "sap.plc.db::basis.t_process"
							},
							overhead_group: {
								name: "sap.plc.db::basis.t_overhead_group",
								data: testData.oOverheadGroupTestDataPlc
							},
							overhead_group__text: {
								name: "sap.plc.db::basis.t_overhead_group__text",
								data: testData.oOverheadGroupTextTestDataPlc
							},
							plant: {
								name: "sap.plc.db::basis.t_plant",
								data: oPlant
							},
							cost_center: {
								name: "sap.plc.db::basis.t_cost_center",
								data: oCostCenter
							},
							profit_center: {
								name: "sap.plc.db::basis.t_profit_center"
							},
							activity_type: {
								name: "sap.plc.db::basis.t_activity_type"
							},
							account: {
								name: "sap.plc.db::basis.t_account"
							},
							company_code: {
								name: "sap.plc.db::basis.t_company_code",
								data: oCompanyCode
							},
							controlling_area: {
								name: "sap.plc.db::basis.t_controlling_area",
								data: oControllingArea
							},
							business_area: {
								name: "sap.plc.db::basis.t_business_area"
							},
							design_office: {
								name: "sap.plc.db::basis.t_design_office",
								data: testData.oDesignOfficeTestDataPlc
							},
							design_office__text: {
								name: "sap.plc.db::basis.t_design_office__text",
								data: testData.oDesignOfficeTextTestDataPlc
							},
							material: {
								name: "sap.plc.db::basis.t_material",
								data: oMaterialTestDataPlc
							},
							material_group: {
								name: "sap.plc.db::basis.t_material_group",
								data: oMaterialGroup
							},
							material_plant: {
								name: "sap.plc.db::basis.t_material_plant",
								data: testData.oMaterialPlantTestDataPlc   // testData.oMaterialPlantTestDataPlc oMaterialPlant
							},
							material_type: {
								name: "sap.plc.db::basis.t_material_type",
								data: oMaterialType
							},
							valuation_class: {
								name:"sap.plc.db::basis.t_valuation_class",
								data: testData.oValuationClassTestDataPlc
							},
							valuation_class__text: {
								name:"sap.plc.db::basis.t_valuation_class__text",
								data: testData.oValuationClassTextTestDataPlc
							},
							vendor: {
								name: "sap.plc.db::basis.t_vendor"
							},
							customer: {
								name: "sap.plc.db::basis.t_customer"
							},
							temp_ids: {
								name: "sap.plc.db::temp.t_item_ids"
							},
							price_component: {
								name: "sap.plc.db::basis.t_price_component",
								data: oPriceComponent
							},
							activity_price: {
								name: "sap.plc.db::basis.t_activity_price",
								data: oActivityPriceTestData
							}
						}
					});
		});
		beforeEach(function() {
			oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
			oMockstarPlc.initializeData();
		});

		afterEach(function() {
		});

		it('should return document, document type, document status', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			expect(Array.slice(result.OT_DOCUMENT[0])).not.toBe(null);
			expect(Array.slice(result.OT_DOCUMENT_TYPE[0])).not.toBe(null);
			expect(Array.slice(result.OT_DOCUMENT_STATUS[0])).not.toBe(null);
		});

		it('should return material, material type, material group', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			expect(Array.slice(result.OT_MATERIAL[0])).not.toBe(null);
			expect(Array.slice(result.OT_MATERIAL_TYPE[0])).not.toBe(null);
			expect(Array.slice(result.OT_MATERIAL_GROUP[0])).not.toBe(null);
		});

		it('should return plant, material plant, cost center', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			expect(Array.slice(result.OT_PLANT[0])).not.toBe(null);
			expect(Array.slice(result.OT_MATERIAL_PLANT[0])).not.toBe(null);
			expect(Array.slice(result.OT_COST_CENTER[0])).not.toBe(null);
		});

		it('should return controlling area, company code, component split', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			expect(Array.slice(result.OT_CONTROLLING_AREA[0])).not.toBe(null);
			expect(Array.slice(result.OT_COMPANY_CODE[0])).not.toBe(null);
			expect(Array.slice(result.OT_COMPONENT_SPLIT[0])).not.toBe(null);
		});

		it('should return master data dependent on material_plant (overhead group, valuation class)', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			var oEntity = Array.slice(result.OT_OVERHEAD_GROUP);
			expect(oEntity).toMatchData({
				OVERHEAD_GROUP_ID: 			[  testData.oOverheadGroupTestDataPlc.OVERHEAD_GROUP_ID[0]],
				OVERHEAD_GROUP_DESCRIPTION: [  testData.oOverheadGroupTextTestDataPlc.OVERHEAD_GROUP_DESCRIPTION[0]]
			}, ["OVERHEAD_GROUP_ID"]);

			var oEntity = Array.slice(result.OT_VALUATION_CLASS);
			expect(oEntity).toMatchData({
				VALUATION_CLASS_ID: 		 [  testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[0]],
				VALUATION_CLASS_DESCRIPTION: [  testData.oValuationClassTextTestDataPlc.VALUATION_CLASS_DESCRIPTION[0]]
			}, ["VALUATION_CLASS_ID"]);
		});

		it('should return master data dependent on document (design office)', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			var oEntity = Array.slice(result.OT_DESIGN_OFFICE);
			expect(oEntity).toMatchData({
				DESIGN_OFFICE_ID: 		  [  testData.oDesignOfficeTestDataPlc.DESIGN_OFFICE_ID[0]],
				DESIGN_OFFICE_DESCRIPTION: [  testData.oDesignOfficeTextTestDataPlc.DESIGN_OFFICE_DESCRIPTION[0]]
			}, ["DESIGN_OFFICE_ID"]);
		});

		it('should return costing sheet, costing sheet rows, costing sheet base, costing sheet base rows, costing sheet overhead, costing sheet overhead rows, costing sheet row dependencies', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			expect(Array.slice(result.OT_COSTING_SHEET[0])).not.toBe(null);
			expect(Array.slice(result.OT_COSTING_SHEET).length).toBe(1);
			expect(Array.slice(result.OT_COSTING_SHEET_ROW).length).toBe(6);
			expect(Array.slice(result.OT_COSTING_SHEET_BASE[0])).not.toBe(null);
			expect(Array.slice(result.OT_COSTING_SHEET_BASE_ROW[0])).not.toBe(null);
			expect(Array.slice(result.OT_COSTING_SHEET_OVERHEAD).length).toBe(2);
			expect(Array.slice(result.OT_COSTING_SHEET_OVERHEAD_ROW).length).toBe(2);
			expect(Array.slice(result.OT_COSTING_SHEET_ROW_DEPENDENCIES).length).toBe(4);
		});


		it('should return material for an item and should not return costing sheet and component split', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			oMockstarPlc.insertTableData("temp_ids", oItemTempId);

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			expect(Array.slice(result.OT_COSTING_SHEET).length).toBe(0);
			expect(Array.slice(result.OT_COMPONENT_SPLIT).length).toBe(0);
			expect(Array.slice(result.OT_MATERIAL).length).toBe(1);
		});
		
		it('should return unit of measureas and currencies', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			expect(Array.slice(result.OT_UOM[0])).not.toBe(null);
			expect(Array.slice(result.OT_CURRENCY[0])).not.toBe(null);
		});

		it('should return price components', function() {
			//arrange
			var sLanguage = 'EN';
			var iCalculationVersionId = 1;
			var sSessionId = sSessionId1;

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, iCalculationVersionId, sSessionId);

			//assert
			var oEntity = Array.slice(result.OT_PRICE_COMPONENTS);
			expect(oEntity.length).toEqual(3);
		});

	}).addTags(["All_Unit_Tests"]);
}