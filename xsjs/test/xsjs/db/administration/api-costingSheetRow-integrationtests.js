var testData 			= require("../../../testdata/testdata").data;
var MockstarFacade 		= require("../../../testtools/mockstar_facade").MockstarFacade;
var Administration 		= require("./administration-util");
var Resources 			= require("../../../../lib/xs/util/masterdataResources").MasterdataResource;
var MessageLibrary 	    = require("../../../../lib/xs/util/message");
var MessageCode    	    = MessageLibrary.Code;
const TestDataUtility 	= require("../../../testtools/testDataUtility").TestDataUtility;
const _ 				= require("lodash");

var oCustomFieldsOverheads = {
	VALID_CUSTOM_FIELD : "CUST_OVERHEAD_CS",
	CUSTOM_FIELD_WITH_UOM : "CUST_OVERHEAD_UOM",
	CUSTOM_FIELD_WITH_FORMULA: "CUST_OVERHEAD_FORMULA",
	CUSTOM_FIELD_NOT_NUMERIC: "CUST_OVERHEAD_TEXT",
	CUSTOM_FIELD_NOT_FOUND: "CUST_OVERHEAD_NOT_FOUND"
};

var userSchema = $.session.getUsername().toUpperCase();

var oLock = {
		"LOCK_OBJECT": "Costing_Sheet_Row",
		"USER_ID": userSchema,
		"LAST_UPDATED_ON": new Date()
};

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.api-costingSheetRow-integrationtests', function() {
	
		var mockstar = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				substituteTables : {
					costing_sheet : {
						name : Resources["Costing_Sheet"].dbobjects.plcTable,
						data : testData.oCostingSheetTestData
					},
					costing_sheet_text : {
						name : Resources["Costing_Sheet"].dbobjects.plcTextTable,
						data : testData.oCostingSheetTextTestData
					},
					costing_sheet_row : {
						name : Resources["Costing_Sheet_Row"].dbobjects.plcTable,
						data : testData.oCostingSheetRowTestData
					},
	
					costing_sheet_row_text : {
						name : Resources["Costing_Sheet_Row"].dbobjects.plcTextTable,
						data : testData.oCostingSheetRowTextTestData
					},
					controlling_area: {
						name: Resources["Controlling_Area"].dbobjects.plcTable,
						data: testData.oControllingAreaTestDataPlc
					},
					controlling_area_text: {
						name: Resources["Controlling_Area"].dbobjects.plcTextTable,
						data: testData.oControllingAreaTextTestDataPlc
					},
					costing_sheet_overhead: {
						name: Resources["Costing_Sheet_Overhead"].dbobjects.plcTable,
						data: testData.oCostingSheetOverheadTestData
					},
					costing_sheet_overhead_row: {
						name: Resources["Costing_Sheet_Overhead_Row"].dbobjects.plcTable,
						data: testData.oCostingSheetOverheadRowTestData
					},
					costing_sheet_overhead_row_formula: {
						name: Resources["Costing_Sheet_Overhead_Row_Formula"].dbobjects.plcTable,
						data: testData.oCostingSheetOverheadRowFormulaTestData	
					},
					costing_sheet_base : Resources["Costing_Sheet_Base"].dbobjects.plcTable,
					costing_sheet_base_row : Resources["Costing_Sheet_Base_Row"].dbobjects.plcTable,
					costing_sheet_row_dependencies: "sap.plc.db::basis.t_costing_sheet_row_dependencies", 
					company_code: {
						name: Resources["Company_Code"].dbobjects.plcTable,
						data: testData.oCompanyCodeTestDataPlc
					},
					company_code_text: {
						name: Resources["Company_Code"].dbobjects.plcTextTable,
						data: testData.oCompanyCodeTextTestDataPlc
					},
					business_area: {
						name: Resources["Business_Area"].dbobjects.plcTable,
						data: testData.oBusinessAreaTestDataPlc
					},
					business_area_text: {
						name: Resources["Business_Area"].dbobjects.plcTextTable,
						data: testData.oBusinessAreaTextTestDataPlc
					},
					overhead_group: {
						name: Resources["Overhead_Group"].dbobjects.plcTable,
						data: testData.oOverheadGroupTestDataPlc
					},
					overhead_group_text: {
						name: Resources["Overhead_Group"].dbobjects.plcTextTable,
						data: testData.oOverheadGroupTextTestDataPlc
					},
					profit_center: {
						name: Resources["Profit_Center"].dbobjects.plcTable,
						data: testData.oProfitCenterTestDataPlc
					},
					profit_center_text: {
						 name: Resources["Profit_Center"].dbobjects.plcTextTable,
						 data: testData.oProfitCenterTextTestDataPlc
						},
					plant: {
						name: Resources["Plant"].dbobjects.plcTable,
						data: testData.oPlantTestDataPlc
					},
					plant_text: {
						name: Resources["Plant"].dbobjects.plcTextTable,
						data: testData.oPlantTextTestDataPlc
					},
					activity_type: {
						name: Resources["Activity_Type"].dbobjects.plcTable,
						data: testData.oActivityTypeTestDataPlc
					},
					activity_type_text: {
						name: Resources["Activity_Type"].dbobjects.plcTextTable,
						data: testData.oActivityTypeTextTestDataPlc
					},
					cost_center: {
						name: Resources["Cost_Center"].dbobjects.plcTable,
						data: testData.oCostCenterTestDataPlc
					},
					cost_center_text: {
						name: Resources["Cost_Center"].dbobjects.plcTextTable,
						data: testData.oCostCenterTextTestDataPlc
					},
					work_center: {
						name: Resources["Work_Center"].dbobjects.plcTable,
						data: testData.oWorkCenterTestDataPlc
					},
					work_center_text: {
						name: Resources["Work_Center"].dbobjects.plcTextTable,
						data: testData.oWorkCenterTextTestDataPlc
					},
					lock_table: {
						name: "sap.plc.db::basis.t_lock",
						data: oLock
					},
					metadata :  {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					formula : {
						name: "sap.plc.db::basis.t_formula",
						data: testData.oCustomField4CostingSheetFormulaData
					}
				},
				csvPackage : testData.sCsvPackage
			});
		});
	
		describe ("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.initializeData();
			});

			it('should return IS_RELEVANT_FOR_TOTAL fields on costing_sheet_row for costing sheet row type = 3 and 4', function(){
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet_Row";
				oGetParameters["filter"] = "COSTING_SHEET_ID=COGM";

				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());

				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.COSTING_SHEET_ROW_ENTITIES.length).toBe(6);
				oReturnedObject.COSTING_SHEET_ROW_ENTITIES.forEach(oRow => {
					expect(oRow.IS_RELEVANT_FOR_TOTAL).toBe(1);
					expect(oRow.IS_RELEVANT_FOR_TOTAL2).toBe(1);
					expect(oRow.IS_RELEVANT_FOR_TOTAL3).toBe(1);
				});

			});
	
			it('should return valid costing_sheets_row,costing_sheet_row_texts, costing_sheet_overhead, costing_sheet_base', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet_Row";
				oGetParameters["filter"] = "COSTING_SHEET_ID=COGM";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.COSTING_SHEET_ROW_ENTITIES.length).toBe(6);
				expect(oReturnedObject.COSTING_SHEET_ROW_TEXT_ENTITIES.length).toBe(4);
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ENTITIES.length).toBe(2);
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES.length).toBe(4);

				// Check that master data referenced by costing sheet overhead rows is returned
				expect(oReturnedObject.ACTIVITY_TYPE_ENTITIES.length).toBe(1, "activity_type missing");
				expect(oReturnedObject.BUSINESS_AREA_ENTITIES.length).toBe(1, "business_area missing");
				expect(oReturnedObject.COMPANY_CODE_ENTITIES.length).toBe(1, "company_code missing");
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES.length).toBe(1, "controlling_area missing");
				expect(oReturnedObject.COST_CENTER_ENTITIES.length).toBe(1, "cost_center missing");
				expect(oReturnedObject.OVERHEAD_GROUP_ENTITIES.length).toBe(1, "overhead_group missing");
				expect(oReturnedObject.PLANT_ENTITIES.length).toBe(1, "plant missing");
				expect(oReturnedObject.PROFIT_CENTER_ENTITIES.length).toBe(1, "profit_center missing");
				expect(oReturnedObject.WORK_CENTER_ENTITIES.length).toBe(1, "work_center missing");

				// Check the the correct master data is returned
				const oOverheadRow = testData.oCostingSheetOverheadRowTestData;
				const sActivityTypeDescription = testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_DESCRIPTION[2];
				const sBusinessAreaDescription = testData.oBusinessAreaTextTestDataPlc.BUSINESS_AREA_DESCRIPTION[0];
				const sCompanyCodeDescription = testData.oCompanyCodeTextTestDataPlc.COMPANY_CODE_DESCRIPTION[0];
				const sControllingAreaDescription = testData.oControllingAreaTextTestDataPlc.CONTROLLING_AREA_DESCRIPTION[3];
				const sCostCenterDescription = null; // not defined in test data for controlling area
				const sOverheadGroupDescription = testData.oOverheadGroupTextTestDataPlc.OVERHEAD_GROUP_DESCRIPTION[0];
				const sPlantDescription = testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0];
				const sProfitCenterDescription = null; // not defined in test data for controlling area
				const sWorkCenterDescription = testData.oWorkCenterTextTestDataPlc.WORK_CENTER_DESCRIPTION[0];
				
				expect(oReturnedObject.ACTIVITY_TYPE_ENTITIES[0].ACTIVITY_TYPE_ID).toBe(oOverheadRow.ACTIVITY_TYPE_ID[0], "activity_type missing");
				expect(oReturnedObject.ACTIVITY_TYPE_ENTITIES[0].ACTIVITY_TYPE_DESCRIPTION).toBe(sActivityTypeDescription, "activity_type missing");
				expect(oReturnedObject.BUSINESS_AREA_ENTITIES[0].BUSINESS_AREA_ID).toBe(oOverheadRow.BUSINESS_AREA_ID[0], "business_area missing");
				expect(oReturnedObject.BUSINESS_AREA_ENTITIES[0].BUSINESS_AREA_DESCRIPTION).toBe(sBusinessAreaDescription, "business_area missing");
				expect(oReturnedObject.COMPANY_CODE_ENTITIES[0].COMPANY_CODE_ID).toBe(oOverheadRow.COMPANY_CODE_ID[0], "company_code missing");
				expect(oReturnedObject.COMPANY_CODE_ENTITIES[0].COMPANY_CODE_DESCRIPTION).toBe(sCompanyCodeDescription, "company_code missing");
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES[0].CONTROLLING_AREA_ID).toBe(oOverheadRow.CONTROLLING_AREA_ID[0], "controlling_area missing");
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES[0].CONTROLLING_AREA_DESCRIPTION).toBe(sControllingAreaDescription, "controlling_area missing");
				expect(oReturnedObject.COST_CENTER_ENTITIES[0].COST_CENTER_ID).toBe(oOverheadRow.COST_CENTER_ID[0], "cost_center missing");
				expect(oReturnedObject.COST_CENTER_ENTITIES[0].COST_CENTER_DESCRIPTION).toBe(sCostCenterDescription, "cost_center missing");
				expect(oReturnedObject.OVERHEAD_GROUP_ENTITIES[0].OVERHEAD_GROUP_ID).toBe(oOverheadRow.OVERHEAD_GROUP_ID[0], "overhead_group missing");
				expect(oReturnedObject.OVERHEAD_GROUP_ENTITIES[0].OVERHEAD_GROUP_DESCRIPTION).toBe(sOverheadGroupDescription, "overhead_group missing");
				expect(oReturnedObject.PLANT_ENTITIES[0].PLANT_ID).toBe(oOverheadRow.PLANT_ID[0], "plant missing");
				expect(oReturnedObject.PLANT_ENTITIES[0].PLANT_DESCRIPTION).toBe(sPlantDescription, "plant missing");
				expect(oReturnedObject.PROFIT_CENTER_ENTITIES[0].PROFIT_CENTER_ID).toBe(oOverheadRow.PROFIT_CENTER_ID[0], "profit_center missing");
				expect(oReturnedObject.PROFIT_CENTER_ENTITIES[0].PROFIT_CENTER_DESCRIPTION).toBe(sProfitCenterDescription, "profit_center missing");
				expect(oReturnedObject.WORK_CENTER_ENTITIES[0].WORK_CENTER_ID).toBe(oOverheadRow.WORK_CENTER_ID[0], "work_center missing");
				expect(oReturnedObject.WORK_CENTER_ENTITIES[0].WORK_CENTER_DESCRIPTION).toBe(sWorkCenterDescription, "work_center missing");
				expect(oReturnedObject.WORK_CENTER_ENTITIES[0].WORK_CENTER_DESCRIPTION).toBe(sWorkCenterDescription, "work_center missing");
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ENTITIES[0].USE_DEFAULT_FIXED_COST_PORTION).toBe(oReturnedObject.COSTING_SHEET_OVERHEAD_ENTITIES[0].USE_DEFAULT_FIXED_COST_PORTION);
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ENTITIES[1].USE_DEFAULT_FIXED_COST_PORTION).toBe(oReturnedObject.COSTING_SHEET_OVERHEAD_ENTITIES[1].USE_DEFAULT_FIXED_COST_PORTION);
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].CREDIT_FIXED_COST_PORTION).toBe(oOverheadRow.CREDIT_FIXED_COST_PORTION[0]);
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[1].CREDIT_FIXED_COST_PORTION).toBe(oOverheadRow.CREDIT_FIXED_COST_PORTION[1]);
			});
			
			it('should send the _VALID_FROM_FIRST_VERSION and _CREATED_BY_FIRST_VERSION for costing_sheet_overhead_row', function() {
				// arrange
				var oCostingSheetOverheadRowTestData1 = {
						"COSTING_SHEET_OVERHEAD_ROW_ID" : [1, 1],
						"COSTING_SHEET_OVERHEAD_ID" : [4, 5],
						"VALID_FROM" : ['2013-01-01', '2020-12-31'],
						"VALID_TO" : ['2013-01-01', '2020-12-31'],
						"CONTROLLING_AREA_ID" : ["1000", "1000"],
						"_VALID_FROM" : ['2014-01-01T00:00:00.000Z', '2014-01-02T00:00:00.000Z'],
						"_VALID_TO" : ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
						"_SOURCE" : [1, 1],
						"_CREATED_BY" : ['U000001', 'U000001']
				};
				mockstar.insertTableData("costing_sheet_overhead_row", oCostingSheetOverheadRowTestData1);
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet_Row";
				oGetParameters["filter"] = "COSTING_SHEET_ID=COGM";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]._CREATED_BY_FIRST_VERSION).toBe('U000001');
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[1]._CREATED_BY_FIRST_VERSION).toBe('U000001');
				expect(Date.parse(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]._VALID_FROM_FIRST_VERSION)).toBe(Date.parse('2014-01-01T00:00:00.000Z'));
				expect(Date.parse(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[1]._VALID_FROM_FIRST_VERSION)).toBe(Date.parse('2014-01-02T00:00:00.000Z'));
			});
			
			it('should have the same information for first version and last changed by when there is only 1 costing sheet overhead row', function() {
				// arrange
				mockstar.clearTable("costing_sheet_overhead_row");
				var oCostingSheetOverheadRowTestData1 = {
						"COSTING_SHEET_OVERHEAD_ROW_ID" : [1],
						"COSTING_SHEET_OVERHEAD_ID" : [4],
						"VALID_FROM" : ['2013-01-01'],
						"VALID_TO" : ['2016-01-01',],
						"CONTROLLING_AREA_ID" : ["1000"],
						"_VALID_FROM" : ['2014-01-01T00:00:00.000Z'],
						"_VALID_TO" : [null],
						"_SOURCE" : [1],
						"_CREATED_BY" : ['T000001']
				};
				mockstar.insertTableData("costing_sheet_overhead_row", oCostingSheetOverheadRowTestData1);
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet_Row";
				oGetParameters["filter"] = "COSTING_SHEET_ID=COGM";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]._CREATED_BY_FIRST_VERSION).toBe(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]._CREATED_BY);
				expect(Date.parse(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]._VALID_FROM_FIRST_VERSION)).toBe(Date.parse(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]._VALID_FROM));
			});
			
			it('should return no costing_sheet_overhead_row when no records are in the table', function() {
				// arrange
				mockstar.clearTable("costing_sheet_overhead_row");
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet_Row";
				oGetParameters["filter"] = "COSTING_SHEET_ID=COGM";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES.length).toBe(0);
			});

			it('should return the defined formula ids, strings and descriptions on the costing sheet overhead rows', function(){

				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet_Row";
				oGetParameters["filter"] = "COSTING_SHEET_ID=COGM";
	
				mockstar.clearTable("costing_sheet_overhead_row");
				var oCostingSheetOverheadRowTestData1 = {
						"COSTING_SHEET_OVERHEAD_ROW_ID" : [1,1],
						"COSTING_SHEET_OVERHEAD_ID" : [4,5],
						"VALID_FROM" : [new Date('2013-01-01'),new Date('2016-01-01')],
						"VALID_TO" : [new Date('2016-01-01'),new Date('2018-01-01')],
						"FORMULA_ID" : [1,null],
						"_VALID_FROM" : [new Date('2013-01-01'),new Date('2016-01-01')],
						"_VALID_TO" : [null,null],
						"_CREATED_BY" : ['#CONTROLLER', "#CONTROLLER"]
				};
				mockstar.insertTableData("costing_sheet_overhead_row", oCostingSheetOverheadRowTestData1);
	
				const oExpectedCostingSheetOverheadRowResult =_.extend(oCostingSheetOverheadRowTestData1,{
														"FORMULA_STRING": ["IS_MATERIAL()", null],
														"FORMULA_DESCRIPTION": ["Overhead will be used only if the type is material",null]
													});
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());	
				const fPredicate = oObject => oObject.COSTING_SHEET_OVERHEAD_ID === oExpectedCostingSheetOverheadRowResult.COSTING_SHEET_OVERHEAD_ID[0] || 
											  oObject.COSTING_SHEET_OVERHEAD_ID === oExpectedCostingSheetOverheadRowResult.COSTING_SHEET_OVERHEAD_ID[1];
				const oTestObject = new TestDataUtility(oExpectedCostingSheetOverheadRowResult).getObjects(fPredicate); 
				const pickColumns = ["COSTING_SHEET_OVERHEAD_ROW_ID","COSTING_SHEET_OVERHEAD_ID","FORMULA_ID","FORMULA_STRING","FORMULA_DESCRIPTION","VALID_FROM","VALID_TO","_VALID_FROM","_VALID_TO","_CREATED_BY"];
	
				//assert
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]).toMatchData(oTestObject[0],pickColumns);
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[1]).toMatchData(oTestObject[1],pickColumns);
			});
	
			it('should return the valid version of overhead row with the corresponding formula', function(){
	
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet_Row";
				oGetParameters["filter"] = "COSTING_SHEET_ID=COGM";
				oGetParameters[""]
	
				mockstar.clearTable("costing_sheet_overhead_row");
				var oCostingSheetOverheadRowTestData1 = {
						"COSTING_SHEET_OVERHEAD_ROW_ID" : [1,1],
						"COSTING_SHEET_OVERHEAD_ID" : [4,5],
						"VALID_FROM" : [new Date('2013-01-01'),new Date('2016-01-01')],
						"VALID_TO" : [new Date('2016-01-01'),new Date('2018-01-01')],
						"FORMULA_ID" : [1,1],
						"_VALID_FROM" : [new Date('2013-01-01'),new Date('2016-01-01')],
						"_VALID_TO" : [new Date('2016-01-01'),null],
						"_CREATED_BY" : ['#CONTROLLER', "#CONTROLLER"]
				};
				mockstar.insertTableData("costing_sheet_overhead_row", oCostingSheetOverheadRowTestData1);
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
				const fPredicate = oObject => oObject.COSTING_SHEET_OVERHEAD_ID === oCostingSheetOverheadRowTestData1.COSTING_SHEET_OVERHEAD_ID[1];
				const oTestObject = new TestDataUtility(oCostingSheetOverheadRowTestData1).getObjects(fPredicate)[0]; 
				const pickColumns = ["COSTING_SHEET_OVERHEAD_ROW_ID","COSTING_SHEET_OVERHEAD_ID","FORMULA_ID","VALID_FROM","VALID_TO","_VALID_FROM","_VALID_TO","_CREATED_BY"];
	
				// assert
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES.length).toBe(1);
				expect(oReturnedObject.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]).toMatchData(oTestObject, pickColumns);
			});
		});
		describe("check dependencies", function(){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.initializeData();
			});

			it('should return no errors when updating costing sheet row entities without dependencies', function(){
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = 'Costing_Sheet';
				var oBatchItem = { 
					"COSTING_SHEET_ROW_ENTITIES":[{
						"COSTING_SHEET_ID" : "COGM",
						"COSTING_SHEET_ROW_ID": "MGK",
						"COSTING_SHEET_ROW_TYPE": 4,
						"CALCULATION_ORDER":7,
						"_VALID_TO": null,
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
					}]
				};					
				
				// act
				var oReturnedObject = administration.checkIfTotalFieldsAreValidForCostingSheetRows(sObjectName, {}, oBatchItem, NewDateAsISOString());
				
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
			});

			it('should return no errors when updating costing sheet row entities without valid dependencies', function(){
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = 'Costing_Sheet';
				var oBatchItem = { 
					"COSTING_SHEET_ROW_ENTITIES":[{
						"COSTING_SHEET_ID" : "COGM",
						"COSTING_SHEET_ROW_ID": "MGK",
						"COSTING_SHEET_ROW_TYPE": 4,
						"CALCULATION_ORDER":7,
						"_VALID_TO": null,
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
					}]
				};			
				var oCostingSheetRowDependencies = {
					"SOURCE_ROW_ID": ['MGK'],
					"TARGET_ROW_ID": ['EX'],
					"COSTING_SHEET_ID": ['COGM'],
					"_VALID_TO": ['1900-01-01T00:00:00.000Z'],
					"_VALID_FROM": ['1900-01-01T00:00:00.000Z']
				};				
			
				mockstar.insertTableData("costing_sheet_row_dependencies", oCostingSheetRowDependencies);
				// act
				var oReturnedObject = administration.checkIfTotalFieldsAreValidForCostingSheetRows(sObjectName, {}, oBatchItem, NewDateAsISOString());
				
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
			});

		});

		describe("insert", function(){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.initializeData();
				mockstar.insertTableData("metadata",testData.oMetadata4CustomFieldCostingSheetTestData);
			});
			it('should create a new overhead row containing a valid overhead custom field', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oExpectedResult = {
					OVERHEAD_PERCENTAGE : 22,
					FORMULA_DESCRIPTION :"Custom field used"
				}
				let oBatchItem = { 
					"COSTING_SHEET_ENTITIES" : [{
						"COSTING_SHEET_ID": "CSCF",
						"CONTROLLING_AREA_ID" : "#CA1",
						"IS_TOTAL_COST2_ENABLED": 0,
						"IS_TOTAL_COST3_ENABLED": 0
					}],
					"COSTING_SHEET_ROW_ENTITIES": [{
						"COSTING_SHEET_ROW_ID": "OVH",
						"COSTING_SHEET_ID": "CSCF",
						"COSTING_SHEET_ROW_TYPE": 3,
						"CALCULATION_ORDER": 1
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP": 1
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"VALID_FROM": "2022-01-01T00:00:00.000Z",
						"VALID_TO": "2099-12-31T00:00:00",
						"OVERHEAD_PERCENTAGE": oExpectedResult.OVERHEAD_PERCENTAGE,
						"OVERHEAD_CUSTOM":oCustomFieldsOverheads.VALID_CUSTOM_FIELD,
						"FORMULA_DESCRIPTION": oExpectedResult.FORMULA_DESCRIPTION
					}]		                    
				};
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES.length).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES.length).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID).not.toBe(null);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].OVERHEAD_PERCENTAGE).toEqual(oExpectedResult.OVERHEAD_PERCENTAGE);

				const aFormulaId = oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID;
                const costing_sheet_overhead_row_formula_record = mockstar.execQuery(`select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID = ${aFormulaId}`);
                expect(costing_sheet_overhead_row_formula_record).toMatchData({
					FORMULA_ID:				aFormulaId,
                    FORMULA_STRING: 		null,
                    FORMULA_DESCRIPTION:	oExpectedResult.FORMULA_DESCRIPTION,
					OVERHEAD_CUSTOM: 		oCustomFieldsOverheads.VALID_CUSTOM_FIELD
                }, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION","OVERHEAD_CUSTOM"]);
			});
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when creating a new overhead row containing a non-existing overhead custom field', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = { 
					"COSTING_SHEET_ENTITIES" : [{
						"COSTING_SHEET_ID": "CSCF",
						"CONTROLLING_AREA_ID" : "#CA1",
						"IS_TOTAL_COST2_ENABLED": 0,
						"IS_TOTAL_COST3_ENABLED": 0
					}],
					"COSTING_SHEET_ROW_ENTITIES": [{
						"COSTING_SHEET_ROW_ID": "OVH",
						"COSTING_SHEET_ID": "CSCF",
						"COSTING_SHEET_ROW_TYPE": 3,
						"CALCULATION_ORDER": 1
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP": 1
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"VALID_FROM": "2022-01-01T00:00:00.000Z",
						"VALID_TO": "2099-12-31T00:00:00",
						"OVERHEAD_CUSTOM": oCustomFieldsOverheads.CUSTOM_FIELD_NOT_FOUND,
					}]		                    
				};
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});
			it('should throw exception (CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR) when creating a new overhead row containing a non-numerical overhead custom field', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = { 
					"COSTING_SHEET_ENTITIES" : [{
						"COSTING_SHEET_ID": "CSCF",
						"CONTROLLING_AREA_ID" : "#CA1",
						"IS_TOTAL_COST2_ENABLED": 0,
						"IS_TOTAL_COST3_ENABLED": 0
					}],
					"COSTING_SHEET_ROW_ENTITIES": [{
						"COSTING_SHEET_ROW_ID": "OVH",
						"COSTING_SHEET_ID": "CSCF",
						"COSTING_SHEET_ROW_TYPE": 3,
						"CALCULATION_ORDER": 1
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP": 1
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"VALID_FROM": "2022-01-01T00:00:00.000Z",
						"VALID_TO": "2099-12-31T00:00:00",
						"OVERHEAD_CUSTOM": oCustomFieldsOverheads.CUSTOM_FIELD_NOT_NUMERIC,
					}]		                    
				};
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR.code);
			});
			it('should throw exception (CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR) when creating a new overhead row containing a decimal overhead custom field with UOM/Currency', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = { 
					"COSTING_SHEET_ENTITIES" : [{
						"COSTING_SHEET_ID": "CSCF",
						"CONTROLLING_AREA_ID" : "#CA1",
						"IS_TOTAL_COST2_ENABLED": 0,
						"IS_TOTAL_COST3_ENABLED": 0
					}],
					"COSTING_SHEET_ROW_ENTITIES": [{
						"COSTING_SHEET_ROW_ID": "OVH",
						"COSTING_SHEET_ID": "CSCF",
						"COSTING_SHEET_ROW_TYPE": 3,
						"CALCULATION_ORDER": 1
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP": 1
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"VALID_FROM": "2022-01-01T00:00:00.000Z",
						"VALID_TO": "2099-12-31T00:00:00",
						"OVERHEAD_CUSTOM": oCustomFieldsOverheads.CUSTOM_FIELD_WITH_UOM,
					}]		                    
				};
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR.code);
			});
			it('should throw exception (CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR) when creating a new overhead row containing an overhead custom field with that uses a formula', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = { 
					"COSTING_SHEET_ENTITIES" : [{
						"COSTING_SHEET_ID": "CSCF",
						"CONTROLLING_AREA_ID" : "#CA1",
						"IS_TOTAL_COST2_ENABLED": 0,
						"IS_TOTAL_COST3_ENABLED": 0
					}],
					"COSTING_SHEET_ROW_ENTITIES": [{
						"COSTING_SHEET_ROW_ID": "OVH",
						"COSTING_SHEET_ID": "CSCF",
						"COSTING_SHEET_ROW_TYPE": 3,
						"CALCULATION_ORDER": 1
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP": 1
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
						"COSTING_SHEET_OVERHEAD_ID": "-1",
						"VALID_FROM": "2022-01-01T00:00:00.000Z",
						"VALID_TO": "2099-12-31T00:00:00",
						"OVERHEAD_CUSTOM": oCustomFieldsOverheads.CUSTOM_FIELD_WITH_FORMULA,
					}]		                    
				};
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR.code);
			});
		});
		describe( "update", function(){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.initializeData();
				mockstar.insertTableData("metadata",testData.oMetadata4CustomFieldCostingSheetTestData);
			});
			it('should update an overhead row with a valid overhead custom field', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = {
					"COSTING_SHEET_ENTITIES":[{
						"COSTING_SHEET_ID":"COGM",
						"CONTROLLING_AREA_ID":"1000",
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_ROW_ENTITIES":[{
						"COSTING_SHEET_ROW_ID":"FGK",
						"COSTING_SHEET_ID":"COGM",
						"COSTING_SHEET_ROW_TYPE": 3,
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CALCULATION_ORDER":4,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CREDIT_ACCOUNT_ID":"655200",
						"CREDIT_FIXED_COST_PORTION":0,
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP":1,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"COSTING_SHEET_OVERHEAD_ROW_ID":1,
						"VALID_FROM":"2013-01-01T00:00:00Z",
						"VALID_TO":"2015-12-31T00:00:00Z",
						"CONTROLLING_AREA_ID":"1000",
						"OVERHEAD_CUSTOM" : oCustomFieldsOverheads.VALID_CUSTOM_FIELD,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}]
				};
				let oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES.length).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES.length).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID).not.toBe(null);

				
				const aFormulaId = oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID;
                const costing_sheet_overhead_row_formula_record = mockstar.execQuery(`select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID = ${aFormulaId}`);
                expect(costing_sheet_overhead_row_formula_record).toMatchData({
					FORMULA_ID:				aFormulaId,
                    FORMULA_STRING: 		null,
                    FORMULA_DESCRIPTION:	null,
					OVERHEAD_CUSTOM: 		oCustomFieldsOverheads.VALID_CUSTOM_FIELD
                }, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION","OVERHEAD_CUSTOM"]);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when updating an overhead row with a non-existing overhead custom field', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = {
					"COSTING_SHEET_ENTITIES":[{
						"COSTING_SHEET_ID":"COGM",
						"CONTROLLING_AREA_ID":"1000",
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_ROW_ENTITIES":[{
						"COSTING_SHEET_ROW_ID":"FGK",
						"COSTING_SHEET_ID":"COGM",
						"COSTING_SHEET_ROW_TYPE": 3,
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CALCULATION_ORDER":4,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CREDIT_ACCOUNT_ID":"655200",
						"CREDIT_FIXED_COST_PORTION":0,
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP":1,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"COSTING_SHEET_OVERHEAD_ROW_ID":1,
						"VALID_FROM":"2013-01-01T00:00:00Z",
						"VALID_TO":"2015-12-31T00:00:00Z",
						"CONTROLLING_AREA_ID":"1000",
						"OVERHEAD_CUSTOM" : oCustomFieldsOverheads.CUSTOM_FIELD_NOT_FOUND,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}]
				};
				let oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it('should throw exception (CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR) when updating an overhead row with a non-numerical overhead custom field', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = {
					"COSTING_SHEET_ENTITIES":[{
						"COSTING_SHEET_ID":"COGM",
						"CONTROLLING_AREA_ID":"1000",
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_ROW_ENTITIES":[{
						"COSTING_SHEET_ROW_ID":"FGK",
						"COSTING_SHEET_ID":"COGM",
						"COSTING_SHEET_ROW_TYPE": 3,
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CALCULATION_ORDER":4,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CREDIT_ACCOUNT_ID":"655200",
						"CREDIT_FIXED_COST_PORTION":0,
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP":1,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"COSTING_SHEET_OVERHEAD_ROW_ID":1,
						"VALID_FROM":"2013-01-01T00:00:00Z",
						"VALID_TO":"2015-12-31T00:00:00Z",
						"CONTROLLING_AREA_ID":"1000",
						"OVERHEAD_CUSTOM" : oCustomFieldsOverheads.CUSTOM_FIELD_NOT_NUMERIC,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}]
				};
				let oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR.code);
			});

			it('should throw exception (CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR) when updating an overhead row containing a decimal overhead custom field with UOM/Currency', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = {
					"COSTING_SHEET_ENTITIES":[{
						"COSTING_SHEET_ID":"COGM",
						"CONTROLLING_AREA_ID":"1000",
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_ROW_ENTITIES":[{
						"COSTING_SHEET_ROW_ID":"FGK",
						"COSTING_SHEET_ID":"COGM",
						"COSTING_SHEET_ROW_TYPE": 3,
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CALCULATION_ORDER":4,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CREDIT_ACCOUNT_ID":"655200",
						"CREDIT_FIXED_COST_PORTION":0,
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP":1,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"COSTING_SHEET_OVERHEAD_ROW_ID":1,
						"VALID_FROM":"2013-01-01T00:00:00Z",
						"VALID_TO":"2015-12-31T00:00:00Z",
						"CONTROLLING_AREA_ID":"1000",
						"OVERHEAD_CUSTOM" : oCustomFieldsOverheads.CUSTOM_FIELD_WITH_UOM,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}]
				};
				let oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR.code);
			});

			it('should throw exception (CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR) when updating an overhead row with an overhead custom field with that uses a formula', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				let oBatchItem = {
					"COSTING_SHEET_ENTITIES":[{
						"COSTING_SHEET_ID":"COGM",
						"CONTROLLING_AREA_ID":"1000",
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_ROW_ENTITIES":[{
						"COSTING_SHEET_ROW_ID":"FGK",
						"COSTING_SHEET_ID":"COGM",
						"COSTING_SHEET_ROW_TYPE": 3,
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CALCULATION_ORDER":4,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"CREDIT_ACCOUNT_ID":"655200",
						"CREDIT_FIXED_COST_PORTION":0,
						"USE_DEFAULT_FIXED_COST_PORTION": 1,
						"IS_ROLLED_UP":1,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}],
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES":[{
						"COSTING_SHEET_OVERHEAD_ID":"5",
						"COSTING_SHEET_OVERHEAD_ROW_ID":1,
						"VALID_FROM":"2013-01-01T00:00:00Z",
						"VALID_TO":"2015-12-31T00:00:00Z",
						"CONTROLLING_AREA_ID":"1000",
						"OVERHEAD_CUSTOM" : oCustomFieldsOverheads.CUSTOM_FIELD_WITH_FORMULA,
						"_VALID_FROM":"2015-01-01T00:00:00.000Z"
					}]
				};
				let oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR.code);
			});
		});

		describe( "delete", function(){
			beforeEach(function() {
				let oExistingCostingSheetOverheadRowWithCustomField = {
					"COSTING_SHEET_OVERHEAD_ROW_ID" : 1,
					"COSTING_SHEET_OVERHEAD_ID" : 5,
					"VALID_FROM" : '2020-12-31',
					"VALID_TO" : '2020-12-31',
					"CONTROLLING_AREA_ID" : "1000",
					"COMPANY_CODE_ID": null,
					"BUSINESS_AREA_ID": null,
					"PROFIT_CENTER_ID":null,
					"PLANT_ID":null,
					"OVERHEAD_GROUP_ID": null,
					"OVERHEAD_PERCENTAGE": null,
					"PROJECT_ID": null,
					"ACTIVITY_TYPE_ID": null,
					"COST_CENTER_ID": null,
					"WORK_CENTER_ID": null,
					"OVERHEAD_QUANTITY_BASED": null,
					"OVERHEAD_CURRENCY_ID": null,
					"OVERHEAD_PRICE_UNIT": null,
					"OVERHEAD_PRICE_UNIT_UOM_ID": null,
					"CREDIT_FIXED_COST_PORTION" :null,
					"FORMULA_ID" : 99,
					"_VALID_FROM" : '2015-01-01T00:00:00.000Z',
					"_VALID_TO" : null,
					"_SOURCE" : 1,
					"_CREATED_BY" : 'U000001'
			};

			let oOverheadRowFormulaCFEntry = {
				"FORMULA_ID" : 99,
        		"FORMULA_STRING" : null,
        		"FORMULA_DESCRIPTION" : "Formula with created custom field",
				"OVERHEAD_CUSTOM" : "CUST_OVERHEAD_CS"
			};

			let aWhereClause = `COSTING_SHEET_OVERHEAD_ROW_ID = 1 AND COSTING_SHEET_OVERHEAD_ID = 5`; 
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.initializeData();
				mockstar.insertTableData("metadata",testData.oMetadata4CustomFieldCostingSheetTestData);
				mockstar.insertTableData("costing_sheet_overhead_row_formula",oOverheadRowFormulaCFEntry);
				mockstar.upsertTableData("costing_sheet_overhead_row",oExistingCostingSheetOverheadRowWithCustomField,aWhereClause);
			});

			it('should succesfully delete an overhead row that has an overhead custom and keep the formula id', function(){
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = 'Costing_Sheet';
				
				let oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [
						{
							"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
							"COSTING_SHEET_OVERHEAD_ID": "5",
							"FORMULA_ID": 99,
							"VALID_FROM" : '2020-12-31T00:00:00.000Z',
							"VALID_TO" : '2020-12-31T00:00:00.000Z',
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}
					]
				};


				let oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				expect(oReturnedObject.hasErrors).toBe(false);

				const costing_sheet_overhead_row_record = mockstar.execQuery("select FORMULA_ID from {{costing_sheet_overhead_row}} WHERE COSTING_SHEET_OVERHEAD_ID = 5 and COSTING_SHEET_OVERHEAD_ROW_ID = 1 and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
                expect(costing_sheet_overhead_row_record).toMatchData({
                    FORMULA_ID: 99
                }, ["FORMULA_ID"]);
                const costing_sheet_overhead_row_formula_record = mockstar.execQuery("select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID = 99");
                expect(costing_sheet_overhead_row_formula_record).toMatchData({
                    FORMULA_ID:             99,
                    FORMULA_STRING: 		null,
                    FORMULA_DESCRIPTION:	null,
					OVERHEAD_CUSTOM: 		null
                }, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION","OVERHEAD_CUSTOM"]);
			})
		})
	}).addTags(["Administration_NoCF_Integration"]);
}