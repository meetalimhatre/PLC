var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var constants = require("../../../../lib/xs/util/constants");
var testData = require("../../../testdata/testdata").data;
var sDefaultExchangeRateType = constants.sDefaultExchangeRateType;

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('db.administration:p_masterdata_read',function() {
		
		var oMockstarPlc = null;
		
		var sMasterdataTimestamp = new Date().toJSON();
		var sValidFrom = '2015-01-01T15:39:09.691Z';
			
		var sLanguage = 'EN';

		var aMasterdataTimestamp = [sMasterdataTimestamp, sMasterdataTimestamp];
		var aValuationDate = [sMasterdataTimestamp, sMasterdataTimestamp];
		
		var sControllingAreaId = '2000';
		var aSingleControllingArea = [{"CONTROLLING_AREA_ID":sControllingAreaId, "MASTER_DATA_TIMESTAMP":sMasterdataTimestamp}];
		
		var sCompanyCodeId = 'CC2'
		var aCompanyCode = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			COMPANY_CODE_ID: ['CC1', sCompanyCodeId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var sPlantId = 'PL3'
		var aPlant = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			PLANT_ID: ['PL1', sPlantId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var sComponentSplitId = '2'; 
		var aComponentSplit = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			COMPONENT_SPLIT_ID: ['1', sComponentSplitId],
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var sCostingSheetId = 'COGM1';
		var aCostingSheet = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			COSTING_SHEET_ID: ['COGM', sCostingSheetId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var iAccountGroupId = 16;
		var aAccountGroups = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			ACCOUNT_GROUP_ID: [15, iAccountGroupId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
	
		var sWorkCenterId = 'WC2';
		var sPlantId = 'PL3'
		var aWorkCenter = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			WORK_CENTER_ID: ['WC1', sWorkCenterId], 
			PLANT_ID: ['PL1', sPlantId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var sProcessId = 'B3'
		var aProcess = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			PROCESS_ID: ['B2', sProcessId], 
			CONTROLLING_AREA_ID: ['1000', sControllingAreaId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var sCostCenterId = 'CC3'
		var aCostCenter = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			COST_CENTER_ID: ['CC2', sCostCenterId], 
			CONTROLLING_AREA_ID: ['1000', sControllingAreaId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		}); 
		
		var sProfitCenterId = 'P2';
		var aProfitCenter = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			PROFIT_CENTER_ID: ['P1', sProfitCenterId], 
			CONTROLLING_AREA_ID: ['1000', sControllingAreaId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var sActivityTypeId = 'A2';
		var aActivityType = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			ACTIVITY_TYPE_ID: ['A1', sActivityTypeId], 
			CONTROLLING_AREA_ID: ['1000', sControllingAreaId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var aAccountId = 'C3';
		var aAccount = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			ACCOUNT_ID: ['C2', aAccountId], 
			CONTROLLING_AREA_ID: ['1000', sControllingAreaId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var sMaterialId = 'MAT2';
		var aMaterialPlant = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			MATERIAL_ID: ['MAT1', sMaterialId], 
			PLANT_ID: ['PL1', sPlantId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var aMaterial = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			MATERIAL_ID: ['MAT1', 'MAT2'], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});
		
		var sOverheadGroupId = 'O4' ;
		var aOverheadGroup = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			OVERHEAD_GROUP_ID: ['O1', sOverheadGroupId], 
			PLANT_ID: ['PL1', sPlantId], 
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp
		});

		var aPriceComponentId = mockstar_helpers.convertObjectWithArraysToArrayOfObjects({
			PRICE_ID: ['280000E0B2BDB9671600A4000936462B','280000E0B2BDB9671600A4000936462C'],
			MASTER_DATA_TIMESTAMP: aMasterdataTimestamp,
			VALUATION_DATE: aValuationDate
		});
		
		var oControllingArea = {
				"CONTROLLING_AREA_ID" : ['1000', '2000'],
				"CONTROLLING_AREA_CURRENCY_ID" : ['EUR', 'USD'],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};		
		
		var oCompanyCode = {
				"COMPANY_CODE_ID" : ['CC1', 'CC2'],
				"CONTROLLING_AREA_ID" : ['1000', '2000'],
				"COMPANY_CODE_CURRENCY_ID" : ['EUR', 'USD'],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};
		
		var oPlant = {
				"PLANT_ID" : ['PL1', 'PL3'],
				"COMPANY_CODE_ID" : ['CC1', 'CC2'],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" :[1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};

		var oComponentSplit = {
				"COMPONENT_SPLIT_ID" : [ '1', '2' ],
				"CONTROLLING_AREA_ID" : ["1000", "2000"],
				"_VALID_FROM": [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ["U000001", "U000001"]

		};

		var oCostingSheet = {
				"COSTING_SHEET_ID" : [ 'COGM', 'COGM1' ],
				"CONTROLLING_AREA_ID" : [ '1000', '2000' ],
				"IS_TOTAL_COST2_ENABLED": [0,0],
				"IS_TOTAL_COST3_ENABLED": [0,0],
				"_VALID_FROM" : [ sValidFrom, sValidFrom ],
				"_VALID_TO" :[ null, null ],
				"_SOURCE" : [ 1, 1 ],
				"_CREATED_BY" : [ 'U000001', 'U000001']
		};

		var oCostingSheetRow = {
				"COSTING_SHEET_ROW_ID" : ["MEK", "MGK", "FEK", "FGK", "HK", "HH", "KK"],
				"COSTING_SHEET_ID" : ["COGM", "COGM", "COGM", "COGM", "COGM", "COGM", "COGM1"],
				"COSTING_SHEET_ROW_TYPE":[1,3,1,3,4,2,1],
				"COSTING_SHEET_BASE_ID":[,,,,,1,2],
				"ACCOUNT_GROUP_AS_BASE_ID": [ 13,, 15,,,,],
				"COSTING_SHEET_OVERHEAD_ID": [ , 4,, 5,,,6],
				"CALCULATION_ORDER": [0, 1, 2, 3, 4, 5, 6],
				"_VALID_FROM": [ sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
				"_VALID_TO": [ null, null, null, null, null, null, null],
				"_SOURCE": [ 1, 1, 1, 1, 1, 1, 1],
				"_CREATED_BY": [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
		};

		var oCostingSheetBase = {
				"COSTING_SHEET_BASE_ID": [1, 2],
				"COST_PORTION": [3, 3],
				"_VALID_FROM": [sValidFrom, sValidFrom],
				"_VALID_TO": [null, null],
				"_SOURCE": [1, 1],
				"_CREATED_BY": [ 'U000001', 'U000001']
		};

		var oCostingSheetBaseRow = {
				"COSTING_SHEET_BASE_ID": [1, 2],
				"ITEM_CATEGORY_ID": [1, 1],
				"SUBITEM_STATE":[1, 1],
				"_VALID_FROM": [sValidFrom, sValidFrom],
				"_VALID_TO": [null, null],
				"_SOURCE": [1, 1],
				"_CREATED_BY": [ 'U000001', 'U000001'],
				"CHILD_ITEM_CATEGORY_ID": [1, 1]
		};

		var oCostingSheetOverhead = {
				"COSTING_SHEET_OVERHEAD_ID" : [4, 5, 6],
				"CREDIT_ACCOUNT_ID" : ["655100", "655200", "655200"],
				"IS_ROLLED_UP" : [1, 1, 1],
				"_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null, null],
				"_SOURCE" : [1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000001', 'U000001']
		};

		var oCostingSheetOverheadRow = {
				"COSTING_SHEET_OVERHEAD_ROW_ID" : [1, 1, 2],
				"COSTING_SHEET_OVERHEAD_ID" : [4, 5, 6],
				"VALID_FROM" : ['2013-01-01', '2020-12-31', '2020-12-31'],
				"VALID_TO" : ['2013-01-01', '2020-12-31', '2020-12-31'],
				"CONTROLLING_AREA_ID" : ["1000", "1000", "2000"], 
				"BUSINESS_AREA_ID" : ['B10', 'B11', 'B12'], 
				"PROFIT_CENTER_ID" : ['P1', 'P1', 'P2'],
				"_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null, null],
				"_SOURCE" : [1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000001', 'U000001']
		};

		var oCostingSheetRowDependencies = {
				"SOURCE_ROW_ID" : ["MGK", "FGK", "HK", "HK", "HK", "HK", "KK"],
				"TARGET_ROW_ID" : ["MEK", "FEK", "MEK", "MGK", "FEK", "FGK", "FGK"],
				"COSTING_SHEET_ID" : ["COGM", "COGM", "COGM", "COGM", "COGM", "COGM", "COGM1"],
				"_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
				"_VALID_TO" : [null, "2015-08-08T00:00:00.000Z", null, "2015-08-08T00:00:00.000Z", null, null, null],
				"_SOURCE" : [1, 1, 1, 1, 1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
		};

		var oAccountGroup = {
				"ACCOUNT_GROUP_ID": [ 13, 15, 16],
				"CONTROLLING_AREA_ID" : [ '1000', '1000', '2000'],
				"_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom],
				"COST_PORTION" : [ 2, 3, 3],
				"_VALID_TO" : [ null, null, null],
				"_SOURCE" : [ 1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000001', 'U000001']
		};

		var oComponentSplitAccountGroup = {
				"ACCOUNT_GROUP_ID" : [ '15', '16' ],
				"COMPONENT_SPLIT_ID": [ '1', '2' ],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ["U000001", "U000001"]
		};
		
		var oDocumentTestDataPlc = {
				"DOCUMENT_TYPE_ID" :['DT1'],
				"DOCUMENT_ID": ['D1'],
				"DOCUMENT_VERSION": ['1'],
				"DOCUMENT_PART": ['1'],
				"DOCUMENT_STATUS_ID" :['S1'],
				"DESIGN_OFFICE_ID" : ['L1'],
				"_VALID_FROM" : [sValidFrom],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};
		
		var oDocumentTypeTestDataPlc = {
				"DOCUMENT_TYPE_ID" :['DT1'],
				"_VALID_FROM" : [sValidFrom],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};
		
		var oDocumentStatusTestDataPlc = {
				"DOCUMENT_TYPE_ID" :['DT1'],
				"DOCUMENT_STATUS_ID": ['S1'],
				"_VALID_FROM" : [sValidFrom],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};

		var oWorkCenter = {
				"WORK_CENTER_ID": ['WC1', 'WC2'],
				"PLANT_ID": ['PL1', 'PL3'], 
				"WORK_CENTER_CATEGORY": ['1', '2'], 
				"COST_CENTER_ID": ['CC2', 'CC3'],
				"CONTROLLING_AREA_ID": ['1000', '2000'],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" :['U000001', 'U000001']
		};
				
		var oProcess = {
				"PROCESS_ID" : ['B1', 'B2', 'B3'],
				"CONTROLLING_AREA_ID": ['1000', '1000', '2000'],
				"ACCOUNT_ID": ['C1', 'C2', 'C3'],
				"_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom],
				"_VALID_TO": [null, null, null],
				"_SOURCE": [1,1,1],
				"_CREATED_BY": ['U000001', 'U000001', 'U000001']
		};
		
		var oBusinessArea = {
				"BUSINESS_AREA_ID" : ['B10', 'B11', 'B12'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
		        "_VALID_TO" : [null, null, null],
				"_SOURCE" : [1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000001', 'U000002']
		}
		
		var oCostCenter = {
				"COST_CENTER_ID" : ['CC2', 'CC3'],
				"CONTROLLING_AREA_ID" : ['1000', '2000'],			
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" :['U000001', 'U000001']
		};
		
		var oProfitCenter = {
				"PROFIT_CENTER_ID" : ['P1', 'P2'],
				"CONTROLLING_AREA_ID" : ['1000', '2000',],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};
		
		var oActivityType = {
				"ACTIVITY_TYPE_ID" :['A1', 'A2'],
				"CONTROLLING_AREA_ID" : ['1000', '2000'],
				"ACCOUNT_ID" : ['C2', 'C3'],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
		        "_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};
		
		var oAccount = {
				"ACCOUNT_ID": ['C2', 'C3', "#AC11", "0", "625000"],
				"CONTROLLING_AREA_ID" : ['1000', '2000', '2000', '2000', '2000'],
				"_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null, null, null, null],
				"_SOURCE" : [1, 1, 1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000001', 'U000001', 'U000001', 'U000001']
		};

		var oMaterialTestDataPlc = {
				"MATERIAL_ID" : ['MAT1', 'MAT2'],
				"MATERIAL_GROUP_ID": ['MG2', 'MG2'],
				"MATERIAL_TYPE_ID": ['MT2', 'MT2'],
				"IS_PHANTOM_MATERIAL" : [1, 1],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_SOURCE" : [1],
				"_CREATED_BY" :['U000001']
		};
		
		var oMaterialType = {
				"MATERIAL_TYPE_ID" :['MT2'],
				"_VALID_FROM" : [sValidFrom],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};

		var oMaterialGroup = {
				"MATERIAL_GROUP_ID" :['MG2'],
				"_VALID_FROM" : [sValidFrom],
				"_VALID_TO" : [null],
				"_SOURCE" : [1],
				"_CREATED_BY" : ['U000001']
		};

		var oPriceComponent = {
			"PRICE_ID":[ '280000E0B2BDB9671600A4000936462B', '280000E0B2BDB9671600A4000936462B',  '280000E0B2BDB9671600A4000936462B'],
			"_VALID_FROM":[sValidFrom,sValidFrom,sValidFrom],
			"ACCOUNT_ID":["0","#AC11","625000"],
			"PRICE_FIXED":[ "13.0000000", "2.0000000", "6.0000000"],
			"PRICE_VARIABLE":[ "14.0000000", "3.0000000", "7.0000000"],
			"CONTROLLING_AREA_ID":['2000', '2000', '2000']
		};

		var oActivityPriceTestData = {
			"PRICE_ID": ["280000E0B2BDB9671600A4000936462B","280000E0B2BDB9671600A4000936462B","280000E0B2BDB9671600A4000936462B"],
			"PRICE_SOURCE_ID": ["301","301","301"],
			"CONTROLLING_AREA_ID": ['#CA1','2000','1000'],
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
			"_VALID_FROM": ["2015-08-08T00:00:00.000Z",sValidFrom,"2016-08-08T00:00:00.000Z"],
			"_VALID_TO":["2016-08-08T00:00:00.000Z", null, sValidFrom],
			"_SOURCE": [1,1,1],
			"_CREATED_BY": ["I305778","U0001","U0001"]
	};

		
		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.administration.procedures/p_masterdata_read", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{	
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
								name: "sap.plc.db::basis.t_component_split_account_group",
								data: oComponentSplitAccountGroup
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
							account_group: {
								name: "sap.plc.db::basis.t_account_group",
								data: oAccountGroup
							},
							work_center: {
								name: "sap.plc.db::basis.t_work_center", 
								data: oWorkCenter
							},
							process: {
								name: "sap.plc.db::basis.t_process", 
								data: oProcess
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
								name: "sap.plc.db::basis.t_profit_center", 
								data: oProfitCenter
							},
							activity_type: {
								name: "sap.plc.db::basis.t_activity_type", 
								data: oActivityType
							},
							account: {
								name: "sap.plc.db::basis.t_account", 
								data: oAccount
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
								name: "sap.plc.db::basis.t_business_area",
								data: oBusinessArea
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
								data: testData.oMaterialPlantTestDataPlc   
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
							currency: {
								name: "sap.plc.db::basis.t_currency",
								data: testData.mCsvFiles.currency
							},
							unit_of_measure: {
								name: "sap.plc.db::basis.t_uom",
								data: testData.mCsvFiles.uom
							},
							exchange_rate_type: {
								name: "sap.plc.db::basis.t_exchange_rate_type",
								data: testData.mCsvFiles.exchange_rate_type
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
		
		it('should return document, document type, document status, design office', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
					[{"DOCUMENT_TYPE_ID":'DT1',"DOCUMENT_ID":'D1',"DOCUMENT_VERSION":'1',"DOCUMENT_PART":'1',"MASTER_DATA_TIMESTAMP":sMasterdataTimestamp}],
					[],[],[],[],[],[],[],[],[]);

			//assert
			expect(Array.slice(result.OT_DOCUMENT[0])).not.toBe(null);	
			expect(Array.slice(result.OT_DOCUMENT_TYPE[0])).not.toBe(null);
			expect(Array.slice(result.OT_DOCUMENT_STATUS[0])).not.toBe(null);
			expect(Array.slice(result.OT_DESIGN_OFFICE[0])).not.toBe(null);
			
			//assert
			var oEntity = Array.slice(result.OT_DESIGN_OFFICE);	
			expect(oEntity).toMatchData({
				DESIGN_OFFICE_ID: 		  [  testData.oDesignOfficeTestDataPlc.DESIGN_OFFICE_ID[0]],
				DESIGN_OFFICE_DESCRIPTION: [  testData.oDesignOfficeTextTestDataPlc.DESIGN_OFFICE_DESCRIPTION[0]]
			}, ["DESIGN_OFFICE_ID"]);
			
		});
		
		it('should return material, material type, material group', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
					[{"MATERIAL_ID":'MAT1',"MASTER_DATA_TIMESTAMP":sMasterdataTimestamp} ],[],[],
					[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing Materials");
			expect(Array.slice(result.OT_MATERIAL).length).toBe(1);
			expect(Array.slice(result.OT_MATERIAL[0])).not.toBe(null);
			expect(result.OT_MATERIAL[0].MATERIAL_ID).toBe('MAT1'); 
			jasmine.log("testing MaterialType");
			expect(Array.slice(result.OT_MATERIAL_TYPE).length).toBe(1);
			expect(Array.slice(result.OT_MATERIAL_TYPE[0])).not.toBe(null);
			expect(result.OT_MATERIAL_TYPE[0].MATERIAL_TYPE_ID).toBe('MT2'); 
			jasmine.log("testing MaterialGroup");
			expect(Array.slice(result.OT_MATERIAL_GROUP).length).toBe(1);
			expect(Array.slice(result.OT_MATERIAL_GROUP[0])).not.toBe(null);
			expect(result.OT_MATERIAL_GROUP[0].MATERIAL_GROUP_ID).toBe('MG2'); 
		});

		it('should NOT return material plant, plant, material, overhead group, valuation class, company code without any controlling area supplied, but only material_plant', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],[],[],[],[],[],[],[],
					[{"MATERIAL_ID":'MAT1',"PLANT_ID":'PL1',"MASTER_DATA_TIMESTAMP":sMasterdataTimestamp} ],[],[],[],[],[],
					[],[],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			//all these are dependent on material_plant (that is dependent on controlling area) or directly on controlling area
			expect(Array.slice(result.OT_MATERIAL_PLANT).length).toBe(0);
			expect(Array.slice(result.OT_PLANT).length).toBe(0);
			expect(Array.slice(result.OT_MATERIAL).length).toBe(0);
			expect(Array.slice(result.OT_OVERHEAD_GROUP).length).toBe(0);
			expect(Array.slice(result.OT_VALUATION_CLASS).length).toBe(0);
			expect(Array.slice(result.OT_COMPANY_CODE).length).toBe(0);
		});
		
		it('should NOT return component split or controlling area, without any controlling area supplied', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[{"COMPONENT_SPLIT_ID":'1',"MASTER_DATA_TIMESTAMP":sMasterdataTimestamp}],[],[],[],[],[],[],[],[],
					[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			expect(Array.slice(result.OT_COMPONENT_SPLIT).length).toBe(0);
			expect(Array.slice(result.OT_CONTROLLING_AREA).length).toBe(0);
		});

		it('should NOT return costing sheet, costing sheet rows, costing sheet base, costing sheet base rows, costing sheet overhead, costing sheet overhead rows, costing sheet row dependencies, without any controlling area supplied', function() {		
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[{"COSTING_SHEET_ID":'COGM',"MASTER_DATA_TIMESTAMP":sMasterdataTimestamp}],[],[],[],[],[],[],[],
					[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			expect(Array.slice(result.OT_COSTING_SHEET).length).toBe(0);	
			expect(Array.slice(result.OT_COSTING_SHEET_ROW).length).toBe(0);
			expect(Array.slice(result.OT_COSTING_SHEET_BASE).length).toBe(0);
			expect(Array.slice(result.OT_COSTING_SHEET_BASE_ROW).length).toBe(0);
			expect(Array.slice(result.OT_COSTING_SHEET_OVERHEAD).length).toBe(0);
			expect(Array.slice(result.OT_COSTING_SHEET_OVERHEAD_ROW).length).toBe(0);
			expect(Array.slice(result.OT_COSTING_SHEET_ROW_DEPENDENCIES).length).toBe(0);
		});
		
		it('should return unit of measures and currencies', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],[],[],[],[],[],[],[],
					[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
					[{"UOM_ID":"PC","MASTER_DATA_TIMESTAMP":sMasterdataTimestamp}],[{"CURRENCY_ID":"EUR","MASTER_DATA_TIMESTAMP":sMasterdataTimestamp}],[]);

			//assert
			expect(Array.slice(result.OT_UOM[0])).not.toBe(null);
			expect(Array.slice(result.OT_CURRENCY[0])).not.toBe(null);	
		});
		
		it('should return only correct controlling area, company code and plant, related to same controlling area', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, [], [],[], [],[], [], [], [], [], [], [], [], 
					aPlant, 
					aCompanyCode, 
					aSingleControllingArea, [], [], [],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing ControllingArea");
			expect(Array.slice(result.OT_CONTROLLING_AREA).length).toBe(1);
			expect(Array.slice(result.OT_CONTROLLING_AREA[0])).not.toBe(null);
			expect(result.OT_CONTROLLING_AREA[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId); 
			
			jasmine.log("testing CompanyCode");
			expect(Array.slice(result.OT_COMPANY_CODE).length).toBe(1);
			expect(Array.slice(result.OT_COMPANY_CODE[0])).not.toBe(null);
			expect(result.OT_COMPANY_CODE[0].COMPANY_CODE_ID).toBe(sCompanyCodeId);
			expect(result.OT_COMPANY_CODE[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);
			
			jasmine.log("testing Plant");
			expect(Array.slice(result.OT_PLANT).length).toBe(1);
			expect(Array.slice(result.OT_PLANT[0])).not.toBe(null);
			expect(result.OT_PLANT[0].PLANT_ID).toBe(sPlantId);
			expect(result.OT_PLANT[0].COMPANY_CODE_ID).toBe(sCompanyCodeId);			
		});
		
		it('should return only correct component split and costing sheet, related to same controlling area', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,
					aComponentSplit,
					aCostingSheet, [], [], [], [],[], [], [], [], [], [], [], [], 
					aSingleControllingArea, [], [], [],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing ComponentSplit");
			expect(Array.slice(result.OT_COMPONENT_SPLIT).length).toBe(1);
			expect(Array.slice(result.OT_COMPONENT_SPLIT[0])).not.toBe(null);
			expect(result.OT_COMPONENT_SPLIT[0].COMPONENT_SPLIT_ID).toBe(sComponentSplitId);
			expect(result.OT_COMPONENT_SPLIT[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);
			
			jasmine.log("testing CostingSheet");
			expect(Array.slice(result.OT_COSTING_SHEET).length).toBe(1);
			expect(Array.slice(result.OT_COSTING_SHEET[0])).not.toBe(null);
			expect(result.OT_COSTING_SHEET[0].COSTING_SHEET_ID).toBe(sCostingSheetId);
			expect(result.OT_COSTING_SHEET[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);			
		});
		
		it('should return only correct costing sheet row, base, base row, overhead, overhead row and dependencies related to same controlling area', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, [],
					aCostingSheet, [], [], [], [], [],[], [], [], [], [], [], [], 
					aSingleControllingArea, [], [], [],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing CostingSheetRow");
			expect(Array.slice(result.OT_COSTING_SHEET_ROW).length).toBe(1);
			expect(Array.slice(result.OT_COSTING_SHEET_ROW[0])).not.toBe(null);
			expect(result.OT_COSTING_SHEET_ROW[0].COSTING_SHEET_ID).toBe(sCostingSheetId);
			
			jasmine.log("testing CostingSheetBase");
			expect(Array.slice(result.OT_COSTING_SHEET_BASE).length).toBe(1);
			expect(Array.slice(result.OT_COSTING_SHEET_BASE[0])).not.toBe(null);
			expect(result.OT_COSTING_SHEET_BASE[0].COSTING_SHEET_BASE_ID).toBe(2);
			
			jasmine.log("testing CostingSheetBaseRow");
			expect(Array.slice(result.OT_COSTING_SHEET_BASE_ROW).length).toBe(1);
			expect(Array.slice(result.OT_COSTING_SHEET_BASE_ROW[0])).not.toBe(null);
			expect(result.OT_COSTING_SHEET_BASE_ROW[0].COSTING_SHEET_BASE_ID).toBe(2);
			
			jasmine.log("testing CostingSheetOverhead");
			expect(Array.slice(result.OT_COSTING_SHEET_OVERHEAD).length).toBe(1);
			expect(Array.slice(result.OT_COSTING_SHEET_OVERHEAD[0])).not.toBe(null);
			expect(result.OT_COSTING_SHEET_OVERHEAD[0].COSTING_SHEET_OVERHEAD_ID).toBe(6);
			
			jasmine.log("testing CostingSheetOverheadRow");
			expect(Array.slice(result.OT_COSTING_SHEET_OVERHEAD_ROW).length).toBe(1);
			expect(Array.slice(result.OT_COSTING_SHEET_OVERHEAD_ROW[0])).not.toBe(null);
			expect(result.OT_COSTING_SHEET_OVERHEAD_ROW[0].COSTING_SHEET_OVERHEAD_ID).toBe(6);
			expect(result.OT_COSTING_SHEET_OVERHEAD_ROW[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);
			
			jasmine.log("testing CostingSheetDependencies");
			expect(Array.slice(result.OT_COSTING_SHEET_ROW_DEPENDENCIES).length).toBe(1);
			expect(Array.slice(result.OT_COSTING_SHEET_ROW_DEPENDENCIES[0])).not.toBe(null);
			expect(result.OT_COSTING_SHEET_ROW_DEPENDENCIES[0].COSTING_SHEET_ID).toBe(sCostingSheetId);
		});
		
		it('should return only correct account, account group and account group cost component related to same controlling area', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, 
					aComponentSplit, [], 
					aAccountGroups, [],[], [], [], [], [], 
					aAccount, [], [], [], [], 
					aSingleControllingArea,
					[], [], [],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing Accounts");
			expect(Array.slice(result.OT_ACCOUNTS).length).toBe(1);
			expect(Array.slice(result.OT_ACCOUNTS[0])).not.toBe(null);
			expect(result.OT_ACCOUNTS[0].ACCOUNT_ID).toBe(aAccountId); 
			expect(result.OT_ACCOUNTS[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);

			jasmine.log("testing AccountGroup");
			expect(Array.slice(result.OT_ACCOUNT_GROUPS).length).toBe(1);
			expect(Array.slice(result.OT_ACCOUNT_GROUPS[0])).not.toBe(null);
			expect(result.OT_ACCOUNT_GROUPS[0].ACCOUNT_GROUP_ID).toBe(iAccountGroupId);
			expect(result.OT_ACCOUNT_GROUPS[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);
			
			jasmine.log("testing ComponentSplitAccountGroup");
			expect(Array.slice(result.OT_COMPONENT_SPLIT_ACCOUNT_GROUP).length).toBe(1);
			expect(Array.slice(result.OT_COMPONENT_SPLIT_ACCOUNT_GROUP[0])).not.toBe(null);
			expect(result.OT_COMPONENT_SPLIT_ACCOUNT_GROUP[0].ACCOUNT_GROUP_ID).toBe(iAccountGroupId);
		});
		
		it('should return only correct work center and work center category related to same controlling area', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, [], [], [], [], 
					aWorkCenter, [], [], [], [], [], [], [], [], [], 
					aSingleControllingArea, [], [], [],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing WorkCenter");
			expect(Array.slice(result.OT_WORK_CENTER).length).toBe(1);
			expect(Array.slice(result.OT_WORK_CENTER[0])).not.toBe(null);
			expect(result.OT_WORK_CENTER[0].WORK_CENTER_ID).toBe(sWorkCenterId);
			expect(result.OT_WORK_CENTER[0].PLANT_ID).toBe(sPlantId);
			expect(result.OT_WORK_CENTER[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);
		});
		
		it('should return only correct process and business area related to same controlling area', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, [], 
					aCostingSheet, [],[], [],
					aProcess, [], [], [], [], [], [], [], [], 
					aSingleControllingArea, [], [], [],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing Process");
			expect(Array.slice(result.OT_PROCESS).length).toBe(1);
			expect(Array.slice(result.OT_PROCESS[0])).not.toBe(null);
			expect(result.OT_PROCESS[0].PROCESS_ID).toBe(sProcessId); 
			expect(result.OT_PROCESS[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId); 
			
			jasmine.log("testing BusinessArea");
			expect(Array.slice(result.OT_BUSINESS_AREA).length).toBe(1);
			expect(Array.slice(result.OT_BUSINESS_AREA[0])).not.toBe(null);
			expect(result.OT_BUSINESS_AREA[0].BUSINESS_AREA_ID).toBe('B12'); 
		});
		
		it('should return only correct cost center and profit center related to same controlling area', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, [], [], [],[], [], [], [], 
					aCostCenter, 
					aProfitCenter, [], [], [], [], [], 
					aSingleControllingArea, [], [], [],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing CostCenter");
			expect(Array.slice(result.OT_COST_CENTER).length).toBe(1);
			expect(Array.slice(result.OT_COST_CENTER[0])).not.toBe(null);
			expect(result.OT_COST_CENTER[0].COST_CENTER_ID).toBe(sCostCenterId); 
			expect(result.OT_COST_CENTER[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);
			
			jasmine.log("testing ProfitCenter");
			expect(Array.slice(result.OT_PROFIT_CENTER).length).toBe(1);
			expect(Array.slice(result.OT_PROFIT_CENTER[0])).not.toBe(null);
			expect(result.OT_PROFIT_CENTER[0].PROFIT_CENTER_ID).toBe(sProfitCenterId); 
			expect(result.OT_PROFIT_CENTER[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId);
		});
		
		it('should return only correct activity type, material plant, valuation class and overhead group related to same controlling area', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, [], [], [], [],[], [], 
					aActivityType, [], 
					aProfitCenter, [], 
					aMaterialPlant, 
					aOverheadGroup, [], [], 
					aSingleControllingArea, [], [], [],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			jasmine.log("testing ActivityType");
			expect(Array.slice(result.OT_ACTIVITY_TYPE).length).toBe(1);
			expect(Array.slice(result.OT_ACTIVITY_TYPE[0])).not.toBe(null);
			expect(result.OT_ACTIVITY_TYPE[0].ACTIVITY_TYPE_ID).toBe(sActivityTypeId); 
			expect(result.OT_ACTIVITY_TYPE[0].CONTROLLING_AREA_ID).toBe(sControllingAreaId); 
			
			
			jasmine.log("testing MaterialPlant");
			expect(Array.slice(result.OT_MATERIAL_PLANT).length).toBe(1);
			expect(Array.slice(result.OT_MATERIAL_PLANT[0])).not.toBe(null);
			expect(result.OT_MATERIAL_PLANT[0].MATERIAL_ID).toBe(sMaterialId); 
			expect(result.OT_MATERIAL_PLANT[0].PLANT_ID).toBe(sPlantId); 
			
			jasmine.log("testing OverheadGroup");
			expect(Array.slice(result.OT_OVERHEAD_GROUP).length).toBe(1);
			expect(Array.slice(result.OT_OVERHEAD_GROUP[0])).not.toBe(null);
			expect(result.OT_OVERHEAD_GROUP[0].OVERHEAD_GROUP_ID).toBe(sOverheadGroupId); 
			expect(result.OT_OVERHEAD_GROUP[0].PLANT_ID).toBe(sPlantId); 
			
			jasmine.log("testing ValuationClass");
			expect(Array.slice(result.OT_VALUATION_CLASS).length).toBe(1);
			expect(Array.slice(result.OT_VALUATION_CLASS[0])).not.toBe(null);
			expect(result.OT_VALUATION_CLASS[0].VALUATION_CLASS_ID).toBe('V2');
		});
		
		it('should return exchange rate types', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],[],[],[],[],[],[],[],
					[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
					[],[],[{"EXCHANGE_RATE_TYPE_ID":sDefaultExchangeRateType}]);

			//assert
			expect(Array.from(result.OT_EXCHANGE_RATE_TYPE).length).toBe(1);
			expect(Array.from(result.OT_EXCHANGE_RATE_TYPE[0])).not.toBe(null);
			expect(result.OT_EXCHANGE_RATE_TYPE[0].EXCHANGE_RATE_TYPE_ID).toBe(sDefaultExchangeRateType);
		});
		
		it('should not return invalid exchange rate types', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],[],[],[],[],[],[],[],
					[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
					[],[],[{"EXCHANGE_RATE_TYPE_ID":"BUY"}]);

			//assert
			expect(Array.from(result.OT_EXCHANGE_RATE_TYPE).length).toBe(0);
		});


		it('should return price components', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],aPriceComponentId,[],[],[],[],[],
			[],[],[],[],[],aSingleControllingArea,[],[],[],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			expect(Array.from(result.OT_PRICE_COMPONENTS).length).toBe(3);
			expect(Array.from(result.OT_PRICE_COMPONENTS[0])).not.toBe(null);
		});

		it('should return accounts for the price component', function() {
			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],aPriceComponentId,[],[],[],[],[],
				[],[],[],[],[],aSingleControllingArea,[],[],[],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			expect(Array.from(result.OT_ACCOUNTS).length).toBe(3);
			expect(Array.from(result.OT_ACCOUNTS[0])).not.toBe(null);
		});

		it('should not return price components if controlling area input does not match', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],aPriceComponentId,[],[],[],[],[],
			[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			expect(Array.from(result.OT_PRICE_COMPONENTS).length).toBe(0);
		});

		it('should not return price components if valuation date is smaller than valid from', function() {
			//act 
			aPriceComponentId[0].VALUATION_DATE = new Date(2000, 05,  05).toJSON();
			aPriceComponentId[1].VALUATION_DATE = new Date(2000, 05,  05).toJSON();
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage,[],[],[],aPriceComponentId,[],[],[],[],[],
			[],[],[],[],[],aSingleControllingArea,[],[],[],[],[],[],[],[],[],[],[],[],[],[]);

			//assert
			expect(Array.from(result.OT_PRICE_COMPONENTS).length).toBe(0);
		});
		
		

		
	}).addTags(["All_Unit_Tests"]);
}