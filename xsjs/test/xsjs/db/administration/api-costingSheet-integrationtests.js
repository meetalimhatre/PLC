var testData = require("../../../testdata/testdata").data;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;

var ApiCostingSheetImport = $.import("xs.db.administration", "api-costingSheet");
var Administration = require("./administration-util");

var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	    = require("../../../../lib/xs/util/message");
var MessageCode    	    = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../lib/xs/util/constants").BusinessObjectTypes;
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;

var userId = $.session.getUsername().toUpperCase();

var oLock = {
		"LOCK_OBJECT": "Costing_Sheet",
		"USER_ID": userId,
		"LAST_UPDATED_ON": NewDateAsISOString()
};

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.api-costingSheet-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procCSRead" : "sap.plc.db.administration.procedures/p_costing_sheet_read",
					"procCARead" : "sap.plc.db.administration.procedures/p_ref_controlling_area_read"
				},
				substituteTables : {
					costing_sheet : {
						name : Resources["Costing_Sheet"].dbobjects.plcTable,
						data : testData.oCostingSheetTestData
					},
					costing_sheet_text : {
						name : Resources["Costing_Sheet"].dbobjects.plcTextTable,
						data : testData.oCostingSheetTextTestData
					},
					controlling_area : Resources["Controlling_Area"].dbobjects.plcTable,
					controlling_area_text : Resources["Controlling_Area"].dbobjects.plcTextTable,
					costing_sheet_row : {
						name : Resources["Costing_Sheet_Row"].dbobjects.plcTable,
						data : testData.oCostingSheetRowTestData
					},
					costing_sheet_row_text : {
						name : Resources["Costing_Sheet_Row"].dbobjects.plcTextTable,
						data : testData.oCostingSheetRowTextTestData
					},				
					costing_sheet_overhead : {
						name : Resources["Costing_Sheet_Overhead"].dbobjects.plcTable,
						data : testData.oCostingSheetOverheadTestData
					},
					costing_sheet_overhead_row : {
						name : Resources["Costing_Sheet_Overhead_Row"].dbobjects.plcTable,
						data : testData.oCostingSheetOverheadRowTestData
					},
					costing_sheet_overhead_row_formula : {
						name : Resources["Costing_Sheet_Overhead_Row_Formula"].dbobjects.plcTable,
						data : testData.oCostingSheetOverheadRowFormulaTestData
					},
					costing_sheet_base : Resources["Costing_Sheet_Base"].dbobjects.plcTable,
					costing_sheet_base_row : Resources["Costing_Sheet_Base_Row"].dbobjects.plcTable,
					costing_sheet_row_dependencies: "sap.plc.db::basis.t_costing_sheet_row_dependencies", 
					lock_table : "sap.plc.db::basis.t_lock",
					project : {
						name : ProjectTables.project
					},
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguage
					},
					metadata :  {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					profit_center: {
						name : Resources["Profit_Center"].dbobjects.plcTable,
						data : testData.oProfitCenterTestDataPlc
					},
					account : {
						name : Resources["Account"].dbobjects.plcTable,
						data : testData.oAccountTestDataPlc
					},
					item_category : {
						name: "sap.plc.db::basis.t_item_category",
						data: testData.oItemCategoryTestData
					}
				},
				csvPackage : testData.sCsvPackage,
			});
	
			if (!mockstar.disableMockstar) {
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '.sap.plc.db.administration.procedures::';
				originalProcedures = ApiCostingSheetImport.Procedures;
				ApiCostingSheetImport.Procedures = Object.freeze({
					costing_sheet_read : procedurePrefix + 'p_costing_sheet_read',
					controlling_area_read :  procedurePrefix + 'p_ref_controlling_area_read'
				});
			}
	
		});
	
		afterOnce(function() {
			if (!mockstar.disableMockstar) {
				ApiCostingSheetImport.Procedures = originalProcedures;
				mockstar.cleanup();
			}
		});
	
		describe ("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});

			it('should return correctly IS_TOTAL_COST flags and TOTAL_COST descriptions', function(){
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, NewDateAsISOString());
				expect(oReturnedObject.COSTING_SHEET_ENTITIES.length).toBe(1);
				expect(oReturnedObject.COSTING_SHEET_ENTITIES[0].IS_TOTAL_COST2_ENABLED).toBe(0);
				expect(oReturnedObject.COSTING_SHEET_ENTITIES[0].IS_TOTAL_COST3_ENABLED).toBe(0);
				expect(oReturnedObject.COSTING_SHEET_ENTITIES[0].TOTAL_COST2_DESCRIPTION).toEqual('Cost 22');
				expect(oReturnedObject.COSTING_SHEET_ENTITIES[0].TOTAL_COST3_DESCRIPTION).toEqual('Cost 33');

				expect(oReturnedObject.COSTING_SHEET_TEXT_ENTITIES.length).toBe(2);	
				expect(oReturnedObject.COSTING_SHEET_TEXT_ENTITIES[0].TOTAL_COST2_DESCRIPTION).toEqual('Cost 2');
				expect(oReturnedObject.COSTING_SHEET_TEXT_ENTITIES[0].TOTAL_COST3_DESCRIPTION).toEqual('Cost 3');
				expect(oReturnedObject.COSTING_SHEET_TEXT_ENTITIES[1].TOTAL_COST2_DESCRIPTION).toEqual('Cost 22');
				expect(oReturnedObject.COSTING_SHEET_TEXT_ENTITIES[1].TOTAL_COST3_DESCRIPTION).toEqual('Cost 33');
			});
	
			it('should return valid costing_sheets,costing_sheet_texts, controlling_areas', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.COSTING_SHEET_ENTITIES.length).toBe(1);
				expect(oReturnedObject.COSTING_SHEET_TEXT_ENTITIES.length).toBe(2);	
			});
	
			it('should return valid costing_sheets,costing_sheet_texts for a valid filter', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet";
				oGetParameters["filter"] = "CONTROLLING_AREA_ID=1000";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.COSTING_SHEET_ENTITIES.length).toBe(1);
				expect(oReturnedObject.COSTING_SHEET_TEXT_ENTITIES.length).toBe(2);
			});
	
			it('should return an exception for a invalid filter', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var exception = null;
				var oGetParameters= {};
				oGetParameters["business_object"] = "Costing_Sheet";
				oGetParameters["filter"] = "CONTROLLING_AREA_ID=DROP TABLE";
	
				// act
				try {
					var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, NewDateAsISOString());
				} catch (e) {
					exception = e;
				}
	
				// assert
				expect(exception.code.code).toBe("GENERAL_VALIDATION_ERROR");
			});
		});
	
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});
	
			it('should deactivate costing sheet and costing sheet texts and delete also costing sheet row formula', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]
				};
				
				const costing_sheet1 = mockstar.execQuery("select * from {{costing_sheet}} ");
				const costing_sheet_row1 = mockstar.execQuery("select * from {{costing_sheet_row}} ");
				const costing_sheet_overhead_row1 = mockstar.execQuery("select * from {{costing_sheet_overhead_row}} ");
				const costing_sheet_overhead_row_formula1 = mockstar.execQuery("select * from {{costing_sheet_overhead_row_formula}} ");
				
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);

                const costing_sheet_overhead_row = mockstar.execQuery("select * from {{costing_sheet_overhead_row}} WHERE COSTING_SHEET_OVERHEAD_ID IN (4,6,7) and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
                expect(costing_sheet_overhead_row).toMatchData({
                    FORMULA_ID:             [1, 2, 3]
                }, ["FORMULA_ID"]);
                const costing_sheet_overhead_row_formula = mockstar.execQuery("select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID IN (1, 2, 3)");
                expect(costing_sheet_overhead_row_formula).toMatchData({
                    FORMULA_ID:             [1, 2, 3],
                    FORMULA_STRING: 		[null, null, null],
                    FORMULA_DESCRIPTION:	[null, null, null]
                }, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION"]);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a costing sheet for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
	//						"COSTING_SHEET_ID" : ""
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("COSTING_SHEET_ID");		
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});

			it('should delete the overhead row formula if overhead row is deleted making FORMULA_STRING and FORMULA_DESCRIPTION null, but the actual formula entry will not be deleted', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 7,
						"VALID_FROM": "2013-01-02T00:00:00.000Z",
						"VALID_TO": "2099-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
					}]
				};

				// act
				const oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
				const costing_sheet_overhead_row = mockstar.execQuery("select * from {{costing_sheet_overhead_row}} WHERE COSTING_SHEET_OVERHEAD_ROW_ID = 1 and COSTING_SHEET_OVERHEAD_ID = 7 and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
				expect(costing_sheet_overhead_row).toMatchData({
					FORMULA_ID:             [3]
				}, ["FORMULA_ID"]);
				const costing_sheet_overhead_row_formula = mockstar.execQuery("select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID = 3");
				expect(costing_sheet_overhead_row_formula).toMatchData({
					FORMULA_ID:             [3],
					FORMULA_STRING: 		[null],
					FORMULA_DESCRIPTION:	[null]
				}, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION"]);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a costing sheet that does not exist', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"_VALID_FROM" : "2015-05-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
	
			it('should deactivate costing sheet row and costing sheet row texts', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ROW_ENTITIES" : [{
							"COSTING_SHEET_ROW_ID" : "MEK",
							"COSTING_SHEET_ID" : "COGM",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a costing sheet row for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ROW_ENTITIES" : [{
							"COSTING_SHEET_ROW_ID" : "MEK",
							"COSTING_SHEET_ID" : ""
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a costing sheet row for which mandatory fields are null or empty string', function() {
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = { 
						"COSTING_SHEET_ROW_ENTITIES" : [{
							"COSTING_SHEET_ROW_ID" : "MEK",
							"COSTING_SHEET_ID" : "",
							"_VALID_FROM" : null
						}]
				};
	
				// act
				const oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("COSTING_SHEET_ID");		
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a costing sheet row that does not exist', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ROW_ENTITIES" : [{
							"COSTING_SHEET_ROW_ID" : "MEK",
							"COSTING_SHEET_ID" : "COGM",
							"_VALID_FROM" : "2015-05-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
		});
	
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("costing_sheet_overhead_row", testData.oCostingSheetOverheadRowTestData);
				mockstar.insertTableData("costing_sheet_overhead_row_formula", testData.oCostingSheetOverheadRowFormulaTestData);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});;
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for some costing sheets that does not exist', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID" : "1A",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "10",
							"LANGUAGE" : "DE",
							"COSTING_SHEET_DESCRIPTION" : "Test1",
							"TOTAL_COST2_DESCRIPTION" : "Test1_TotalCost2",
							"TOTAL_COST3_DESCRIPTION" : "Test1_TotalCost3",
						},{
							"COSTING_SHEET_ID" : "100",
							"LANGUAGE" : "EN",
							"COSTING_SHEET_DESCRIPTION" : "Test2",
							"TOTAL_COST2_DESCRIPTION" : "Test2_TotalCost2",
							"TOTAL_COST3_DESCRIPTION" : "Test2_TotalCost3",
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);	
				expect(oReturnedObject.errors[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
				expect(oReturnedObject.errors[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID" : "1A",
							"CONTROLLING_AREA_ID" : "#CAA",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oReturnedObject.errors[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a costing sheet for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID" : "1A",
	//						"CONTROLLING_AREA_ID" : ""
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a costing sheet that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID":"COGM",
							"CONTROLLING_AREA_ID":"1000",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});

			it('should successfully create entries in costing_sheet_overhead_row and costing_sheet_overhead_row_formula', function() {
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": 144,
							"COSTING_SHEET_OVERHEAD_ID": 177,
							"VALID_FROM": "2015-01-01T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00.000Z",
							"FORMULA_STRING": "IS_MATERIAL()",
							"_SOURCE": 1,
							"_CREATED_BY": "XSA_ADMIN"
						}]
				};

				// act
				const oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_STRING).toBe(oBatchItem.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_STRING);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID).not.toBe(null);
				const costing_sheet_overhead_row = mockstar.execQuery("select FORMULA_ID from {{costing_sheet_overhead_row}} WHERE COSTING_SHEET_OVERHEAD_ID = 177 and _VALID_TO is null");
				const costing_sheet_overhead_row_formula = mockstar.execQuery("select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID = " + costing_sheet_overhead_row.columns.FORMULA_ID.rows[0]);
				expect(costing_sheet_overhead_row_formula).toMatchData({
					FORMULA_ID:             [costing_sheet_overhead_row.columns.FORMULA_ID.rows[0]],
					FORMULA_STRING: 		["IS_MATERIAL()"],
					FORMULA_DESCRIPTION:	null
				}, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION"]);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a costing sheet text that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"LANGUAGE" : "EN",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1",
							"TOTAL_COST2_DESCRIPTION": "Total Cost 2 Description",
							"TOTAL_COST3_DESCRIPTION": "Total Cost 3 Description"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when using invalid types for IS_TOTAL_COST2_ENABLED/IS_TOTAL_COST_3_ENABLED',function(){
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 124214,
							"IS_TOTAL_COST3_ENABLED": 12142141
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : '',
							"TOTAL_COST3_DESCRIPTION" : '',
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : '',
							"TOTAL_COST3_DESCRIPTION" : '',
						}]            
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
				
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should throw exeception (GENERAL_VALIDATION_ERROR) when TOTAL_COST2/3_DESCRIPTION exceed 50 characters', function(){
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var sDescription = `50description50description50description50description50description50description50description50description`;
									
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 1,
							"IS_TOTAL_COST3_ENABLED": 1
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": sDescription,
							"TOTAL_COST2_DESCRIPTION" : sDescription,
							"TOTAL_COST3_DESCRIPTION" : sDescription
						}]            
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
				
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
	
			it('should create entries in costing_sheet, costing_sheet__text with valid IS_TOTAL_COST_ENABLED flags and with valid TOTAL_COST descriptions', function(){
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var totalDescription2En = 'test en totalCost2';
				var totalDescription3En = 'test en totalCost3';
				var totalDescription2De = 'test de totalCost2';
				var totalDescription3De = 'test de totalCost3';
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : totalDescription2En,
							"TOTAL_COST3_DESCRIPTION" : totalDescription3En,
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : totalDescription2De,
							"TOTAL_COST3_DESCRIPTION" : totalDescription3De,
						}]            
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES.length).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0].IS_TOTAL_COST2_ENABLED).toBe(0);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0].IS_TOTAL_COST3_ENABLED).toBe(0);

				expect(oReturnedObject.entities.COSTING_SHEET_TEXT_ENTITIES.length).toBe(2);	
				expect(oReturnedObject.entities.COSTING_SHEET_TEXT_ENTITIES[0].TOTAL_COST2_DESCRIPTION).toEqual(totalDescription2En);
				expect(oReturnedObject.entities.COSTING_SHEET_TEXT_ENTITIES[0].TOTAL_COST3_DESCRIPTION).toEqual(totalDescription3En);
				expect(oReturnedObject.entities.COSTING_SHEET_TEXT_ENTITIES[1].TOTAL_COST2_DESCRIPTION).toEqual(totalDescription2De);
				expect(oReturnedObject.entities.COSTING_SHEET_TEXT_ENTITIES[1].TOTAL_COST3_DESCRIPTION).toEqual(totalDescription3De);
			});

			
			it('should throw error (GENERAL_VALIDATION_ERROR) if IS_RELEVANT_FOR_TOTAL fields for costing_sheet_row have invalid types', function(){
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 1,
							"IS_TOTAL_COST3_ENABLED": 1
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1,
							"IS_RELEVANT_FOR_TOTAL": "test",
							"IS_RELEVANT_FOR_TOTAL2": false,
							"IS_RELEVANT_FOR_TOTAL3": false
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [],
						"COSTING_SHEET_BASE_ENTITIES": [],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": []		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should throw error (GENERAL_VALIDATION_ERROR) if IS_RELEVANT_FOR_TOTAL fields are set for base rows (READONLY)', function(){
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED":1,
							"IS_TOTAL_COST3_ENABLED": 1
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1,
							"IS_RELEVANT_FOR_TOTAL": 1,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 1,
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						},{
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER": 3,
							"IS_RELEVANT_FOR_TOTAL": 1,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 1,
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"USE_DEFAULT_FIXED_COST_PORTION": 1,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": []		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
				var oExpectedValidationObject = {
					"columnIds": [
						{"columnId" : "IS_RELEVANT_FOR_TOTAL"},
						{"columnId" : "IS_RELEVANT_FOR_TOTAL2"},
						{"columnId" : "IS_RELEVANT_FOR_TOTAL3"}
					],
					"validationInfoCode": "READONLY_FIELD_ERROR"
				};
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				var error = oReturnedObject.errors[0];

				expect(error.code).toBe('GENERAL_VALIDATION_ERROR');
				expect(error.operation).toBe('Create');
				expect(error.details.validationObj).toEqual(oExpectedValidationObject);
			});

			it('should throw error (GENERAL_VALIDATION_ERROR) if CHILD_ITEM_CATEGORY_ID is non-existent', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3",
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : "test de totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test de totalCost3",
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						},{
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER": 3
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "base en"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "base de"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum en"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum de"
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"ITEM_CATEGORY_ID": 1,
							"CHILD_ITEM_CATEGORY_ID": 123,
							"SUBITEM_STATE": 0
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [{
							"SOURCE_ROW_ID": "O1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC"
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"USE_DEFAULT_FIXED_COST_PORTION": 1,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"PROFIT_CENTER_ID":"P4",
							"CREDIT_FIXED_COST_PORTION": 22,
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				var error = oReturnedObject.errors[0];

				expect(error.code).toBe('GENERAL_VALIDATION_ERROR');
				expect(error.operation).toBe('Create');
			});

			it('should throw error (GENERAL_VALIDATION_ERROR) if CHILD_ITEM_CATEGORY_ID is invalid', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3",
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : "test de totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test de totalCost3",
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						},{
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER": 3
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "base en"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "base de"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum en"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum de"
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"ITEM_CATEGORY_ID": 1,
							"CHILD_ITEM_CATEGORY_ID": 2,
							"SUBITEM_STATE": 0
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [{
							"SOURCE_ROW_ID": "O1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC"
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"USE_DEFAULT_FIXED_COST_PORTION": 1,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"PROFIT_CENTER_ID":"P4",
							"CREDIT_FIXED_COST_PORTION": 22,
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				var error = oReturnedObject.errors[0];

				expect(error.code).toBe('GENERAL_VALIDATION_ERROR');
				expect(error.operation).toBe('Create');
			});

			it('should set child item category correctly if exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3",
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : "test de totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test de totalCost3",
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						},{
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER": 3
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "base en"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "base de"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum en"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum de"
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"ITEM_CATEGORY_ID": 2,
							"CHILD_ITEM_CATEGORY_ID": 31,
							"SUBITEM_STATE": 0
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [{
							"SOURCE_ROW_ID": "O1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC"
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"USE_DEFAULT_FIXED_COST_PORTION": 1,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"PROFIT_CENTER_ID":"P4",
							"CREDIT_FIXED_COST_PORTION": 22,
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};
				mockstar.execSingle(`insert into {{item_category}} (ITEM_CATEGORY_ID, DISPLAY_ORDER, CHILD_ITEM_CATEGORY_ID, ICON, ITEM_CATEGORY_CODE)
										VALUES (2, 31, 31, 'icon31', 'CODE31');`);	
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
			});

			it('should create entries in costing_sheet, costing_sheet_row with with valid IS_RELEVANT_FOR_TOTAL flags', function(){

				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 1,
							"IS_TOTAL_COST3_ENABLED": 1
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2,
							"IS_RELEVANT_FOR_TOTAL": 1,
							"IS_RELEVANT_FOR_TOTAL2": 0,
							"IS_RELEVANT_FOR_TOTAL3": 1
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"USE_DEFAULT_FIXED_COST_PORTION": 1,
							"IS_ROLLED_UP": 1
						}]                 
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
					
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL2).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL3).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[1].IS_RELEVANT_FOR_TOTAL).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[1].IS_RELEVANT_FOR_TOTAL2).toBe(0);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[1].IS_RELEVANT_FOR_TOTAL3).toBe(1);

			});

			it('should create entries in costing_sheet, costing_sheet_row, costing_sheet_base, costing_sheet_overhead, costing_sheet_base_row, costing_sheet_overhead_row', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3",
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : "test de totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test de totalCost3",
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						},{
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER": 3
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "base en"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "base de"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum en"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum de"
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"ITEM_CATEGORY_ID": 1,
							"CHILD_ITEM_CATEGORY_ID": 1,
							"SUBITEM_STATE": 0
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [{
							"SOURCE_ROW_ID": "O1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC"
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"USE_DEFAULT_FIXED_COST_PORTION": 1,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"PROFIT_CENTER_ID":"P4",
							"CREDIT_FIXED_COST_PORTION": 22,
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				var oTest = mockstar_helpers.getRowCount(mockstar, "costing_sheet", "COSTING_SHEET_ID = 'ZAMC' and _VALID_TO is null");
				var oTestText = mockstar_helpers.getRowCount(mockstar, "costing_sheet_text", "COSTING_SHEET_ID = 'ZAMC' and _VALID_TO is null");
				var oTestRow = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row", "COSTING_SHEET_ID = 'ZAMC' and _VALID_TO is null");
				var oTestRowText = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_text", "COSTING_SHEET_ID = 'ZAMC' and _VALID_TO is null");
				var oTestDependencies = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_dependencies", "COSTING_SHEET_ID = 'ZAMC' and _VALID_TO is null");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oTest).toBe(1);
				expect(oTestText).toBe(2);
				expect(oTestRow).toBe(3);
				expect(oTestRowText).toBe(4);
				expect(oTestDependencies).toBe(3);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].COSTING_SHEET_OVERHEAD_ID).toBe(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES[0].COSTING_SHEET_OVERHEAD_ID);
				expect(oReturnedObject.entities.COSTING_SHEET_BASE_ROW_ENTITIES[0].COSTING_SHEET_BASE_ID).toBe(oReturnedObject.entities.COSTING_SHEET_BASE_ENTITIES[0].COSTING_SHEET_BASE_ID);
	
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_BASE_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_ROW_TEXT_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_TEXT_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].CREDIT_FIXED_COST_PORTION).toBe(22);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES[0].USE_DEFAULT_FIXED_COST_PORTION).toBe(1);
			});
			
			it('should create entries in costing_sheet, costing_sheet_row, costing_sheet_base, costing_sheet_overhead, costing_sheet_base_row, costing_sheet_overhead_row having COSTING_SHEET_ID set to 15 charachters', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0							
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3",
						},{
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : "test de totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test de totalCost3",
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						},{
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER": 3
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "base en"
						},{
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "base de"
						},{
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum en"
						},{
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum de"
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"ITEM_CATEGORY_ID": 1,
							"CHILD_ITEM_CATEGORY_ID": 1,
							"SUBITEM_STATE": 0
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [{
							"SOURCE_ROW_ID": "O1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMCTESTPOSITIV"
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"PROFIT_CENTER_ID":"P4",
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				var oTest = mockstar_helpers.getRowCount(mockstar, "costing_sheet", "COSTING_SHEET_ID = 'ZAMCTESTPOSITIV' and _VALID_TO is null");
				var oTestText = mockstar_helpers.getRowCount(mockstar, "costing_sheet_text", "COSTING_SHEET_ID = 'ZAMCTESTPOSITIV' and _VALID_TO is null");
				var oTestRow = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row", "COSTING_SHEET_ID = 'ZAMCTESTPOSITIV' and _VALID_TO is null");
				var oTestRowText = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_text", "COSTING_SHEET_ID = 'ZAMCTESTPOSITIV' and _VALID_TO is null");
				var oTestDependencies = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_dependencies", "COSTING_SHEET_ID = 'ZAMCTESTPOSITIV' and _VALID_TO is null");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oTest).toBe(1);
				expect(oTestText).toBe(2);
				expect(oTestRow).toBe(3);
				expect(oTestRowText).toBe(4);
				expect(oTestDependencies).toBe(3);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].COSTING_SHEET_OVERHEAD_ID).toBe(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES[0].COSTING_SHEET_OVERHEAD_ID);
				expect(oReturnedObject.entities.COSTING_SHEET_BASE_ROW_ENTITIES[0].COSTING_SHEET_BASE_ID).toBe(oReturnedObject.entities.COSTING_SHEET_BASE_ENTITIES[0].COSTING_SHEET_BASE_ID);
	
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_BASE_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_ROW_TEXT_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COSTING_SHEET_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COSTING_SHEET_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when insert entries with invalid CREDIT_ACCOUNT_ID for COSTING_SHEET_OVERHEAD_ENTITIES', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3"
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": "3",
							"COSTING_SHEET_OVERHEAD_ID": "9999",
							"CALCULATION_ORDER": "1"
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "9999",
							"CREDIT_FIXED_COST_PORTION": "20",
							"IS_ROLLED_UP": "1",
							"CREDIT_ACCOUNT_ID" : "AAA"
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": "-1",
							"COSTING_SHEET_OVERHEAD_ID": "9999",
							"PROFIT_CENTER_ID":"P4",
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": "22"
						}]		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors.length).toBe(1);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it('should not throw exception if main entities are not in the batch request', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = {
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": 9999,
							"CALCULATION_ORDER": 1
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": 9999,
							"CREDIT_FIXED_COST_PORTION": 20,
							"IS_ROLLED_UP": 1,
							"CREDIT_ACCOUNT_ID" : "625000"
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": 9999,
							"PROFIT_CENTER_ID":"P4",
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES.length).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES[0].CREDIT_ACCOUNT_ID).toBe('625000');
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES[0].CONTROLLING_AREA_ID).toBe('1000');
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when insert valid credit_account_id but referenced account has different CONTROLLING_AREA_ID', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0							
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3",
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": -2,
							"CALCULATION_ORDER": 1
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": -2,
							"CREDIT_FIXED_COST_PORTION": 20,
							"IS_ROLLED_UP": 1,
							"CREDIT_ACCOUNT_ID" : "625000"
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": -2,
							"PROFIT_CENTER_ID":"P4",
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors.length).toBe(1);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when insert entries in costing_sheet, costing_sheet_row, costing_sheet_base, costing_sheet_overhead, costing_sheet_base_row, costing_sheet_overhead_row having COSTING_SHEET_ID set to 16 charachters or more', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0

						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3"
						},{
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : "test de totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test de totalCost3"
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						},{
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER": 3
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "base en"
						},{
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"COSTING_SHEET_ROW_ID": "B1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "base de"
						},{
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum en"
						},{
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE",
							"COSTING_SHEET_ROW_ID": "S1",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "sum de"
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"ITEM_CATEGORY_ID": 1,
							"CHILD_ITEM_CATEGORY_ID": 1,
							"SUBITEM_STATE": 0
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [{
							"SOURCE_ROW_ID": "O1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMCTESTNEGATIVE"
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"PROFIT_CENTER_ID":"P4",
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors.length).toBe(13);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				
			});
	
			it('should throw exception when more than one attribute for row type determination is set', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test en",
							"TOTAL_COST2_DESCRIPTION" : "test en totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test en totalCost3"
						},{
							"COSTING_SHEET_ID": "ZAMC",
							"LANGUAGE": "DE",
							"COSTING_SHEET_DESCRIPTION": "test de",
							"TOTAL_COST2_DESCRIPTION" : "test de totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test de totalCost3"
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 1,
							"COSTING_SHEET_BASE_ID": "-1",
							"ACCOUNT_GROUP_AS_BASE_ID": 110,
							"CALCULATION_ORDER": 1
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"ITEM_CATEGORY_ID": 1,
							"SUBITEM_STATE": 0,
							"CHILD_ITEM_CATEGORY_ID": 1,
						}]
				};				
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
			});
	
			it('should send the old_id in the response for the costing_sheet_overhead_row',function () {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES": [{
							"COSTING_SHEET_ID": "TEST2",
							"CONTROLLING_AREA_ID": "1000",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_TEXT_ENTITIES": [ {
							"COSTING_SHEET_ID": "TEST2",
							"LANGUAGE": "EN",
							"COSTING_SHEET_DESCRIPTION": "test",
							"TOTAL_COST2_DESCRIPTION" : "test totalCost2",
							"TOTAL_COST3_DESCRIPTION" : "test totalCost3"
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "TEST2",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O2",
							"COSTING_SHEET_ID": "TEST2",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-1",
							"CREDIT_FIXED_COST_PORTION": 22,
							"IS_ROLLED_UP": 1
						},{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 33,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": "-1",
							"VALID_FROM": "2015-09-07T06:25:41.388Z",
							"VALID_TO": "2099-12-30T22:00:00Z",
							"CONTROLLING_AREA_ID": "1000"
						},{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -2,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"VALID_FROM": "2015-09-07T06:26:10.849Z",
							"VALID_TO": "2099-12-30T22:00:00Z",
							"CONTROLLING_AREA_ID": "1000"
						}]
				};
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].COSTING_SHEET_OVERHEAD_ROW_OLD_ID).toBe(-1);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].COSTING_SHEET_OVERHEAD_OLD_ID).toBe('-1');
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[1].COSTING_SHEET_OVERHEAD_ROW_OLD_ID).toBe(-2);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[1].COSTING_SHEET_OVERHEAD_OLD_ID).toBe('-2');
			});
	
			it('should throw exception when costing sheet (GENERAL_ENTITY_NOT_FOUND_ERROR) is not found for dependencies', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "ZAMC",
							"CONTROLLING_AREA_ID" : "#CA1",
							"IS_TOTAL_COST2_ENABLED": 0,
							"IS_TOTAL_COST3_ENABLED": 0							
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 2,
							"COSTING_SHEET_BASE_ID": "-1",
							"CALCULATION_ORDER": 1
						},{
							"COSTING_SHEET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 3,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CALCULATION_ORDER": 2
						},{
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ID": "ZAMC",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER": 3
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"COST_PORTION": 3
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": "-1",
							"ITEM_CATEGORY_ID": 1,
							"CHILD_ITEM_CATEGORY_ID": 1,
							"SUBITEM_STATE": 0
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [{
							"SOURCE_ROW_ID": "O1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "B1",
							"COSTING_SHEET_ID": "ZAMC"
						},{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "O1",
							"COSTING_SHEET_ID": "ZZZ"
						}],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"CREDIT_FIXED_COST_PORTION": 20,
							"IS_ROLLED_UP": 1
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
							"COSTING_SHEET_OVERHEAD_ID": "-2",
							"PROFIT_CENTER_ID":"P4",
							"VALID_FROM": "2015-09-30T00:00:00.000Z",
							"VALID_TO": "2099-12-31T00:00:00",
							"CONTROLLING_AREA_ID": "1000",
							"OVERHEAD_PERCENTAGE": 22
						}]		                    
				};	
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
	
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a costing sheet row for which mandatory fields are missing', function() {
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ROW_ID":"FGK",
							"COSTING_SHEET_OVERHEAD_ID":"5",
							"CALCULATION_ORDER":4
						}]	                    
				};			
	
				// act
				const oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("COSTING_SHEET_ID");	
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("COSTING_SHEET_ROW_TYPE");	
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a costing sheet row for which mandatory fields are null or empty', function() {
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ROW_ID":"FGK",
							"COSTING_SHEET_ID":"",
							"COSTING_SHEET_ROW_TYPE": null,
							"COSTING_SHEET_OVERHEAD_ID":"5",
							"CALCULATION_ORDER":4
						}]	                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.INVALID_CHARACTERS_ERROR);
			});
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a costing sheet row that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ROW_ID":"FGK",
							"COSTING_SHEET_ID":"COGM",
							"COSTING_SHEET_ROW_TYPE":"3",
							"COSTING_SHEET_OVERHEAD_ID":"5",
							"CALCULATION_ORDER":4
						}]	                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a costing sheet row text that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ROW_TEXT_ENTITIES":[{
							"COSTING_SHEET_ID":"COGM",
							"COSTING_SHEET_ROW_ID":"FEK",
							"LANGUAGE":"EN",
							"COSTING_SHEET_ROW_DESCRIPTION":"Production Overhead"
						},{
							"COSTING_SHEET_ID":"COGM",
							"COSTING_SHEET_ROW_ID":"FEK",
							"LANGUAGE":"DE",
							"COSTING_SHEET_ROW_DESCRIPTION":"Fertigungsgemeinkosten"
						}]                 
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});
	
		});
	
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
				mockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
				mockstar.insertTableData("costing_sheet_overhead_row", testData.oCostingSheetOverheadRowTestData);
				mockstar.insertTableData("costing_sheet_overhead_row_formula", testData.oCostingSheetOverheadRowFormulaTestData);
				mockstar.insertTableData("costing_sheet_row_dependencies", testData.oCostingSheetRowDependenciesTestData);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});


			it('should return updated entities for costing_sheet and costing_sheet_text with new IS_TOTAL_COST2/3 flags and TOTAL_COST2/3_DESCRIPTION', function(){
				
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oInitialCostingSheet = mockstar.execQuery("select IS_TOTAL_COST2_ENABLED, IS_TOTAL_COST3_ENABLED from {{costing_sheet}} WHERE COSTING_SHEET_ID = 'COGM'");
				var oInitialCostingSheetText = mockstar.execQuery("select TOTAL_COST2_DESCRIPTION, TOTAL_COST3_DESCRIPTION from {{costing_sheet_text}} WHERE COSTING_SHEET_ID = 'COGM'");
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "COGM",
							"CONTROLLING_AREA_ID" : "#CA1",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"IS_TOTAL_COST2_ENABLED": 1,
							"IS_TOTAL_COST3_ENABLED": 1
						}],
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"LANGUAGE" : "EN",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1",
							"TOTAL_COST2_DESCRIPTION" : "UpdateTotal2Test1",
							"TOTAL_COST3_DESCRIPTION" : "UpdateTotal3Test1",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				var oUpdatedCostingSheet = mockstar.execQuery("select IS_TOTAL_COST2_ENABLED, IS_TOTAL_COST3_ENABLED from {{costing_sheet}} WHERE COSTING_SHEET_ID = 'COGM' and _VALID_TO is null");
				var oUpdatedCostingSheetText = mockstar.execQuery("select TOTAL_COST2_DESCRIPTION, TOTAL_COST3_DESCRIPTION from {{costing_sheet_text}} WHERE COSTING_SHEET_ID = 'COGM' and LANGUAGE = 'EN' and _VALID_TO is null");
				
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oUpdatedCostingSheet.columns.IS_TOTAL_COST2_ENABLED.rows[0]).not.toBe(oInitialCostingSheet.columns.IS_TOTAL_COST2_ENABLED.rows[0]);
				expect(oUpdatedCostingSheet.columns.IS_TOTAL_COST2_ENABLED.rows[0]).toBe(1);
				expect(oUpdatedCostingSheet.columns.IS_TOTAL_COST3_ENABLED.rows[0]).not.toBe(oInitialCostingSheet.columns.IS_TOTAL_COST3_ENABLED.rows[0]);
				expect(oUpdatedCostingSheet.columns.IS_TOTAL_COST3_ENABLED.rows[0]).toBe(1);

				expect(oUpdatedCostingSheetText.columns.TOTAL_COST2_DESCRIPTION.rows[0]).not.toEqual(oInitialCostingSheetText.columns.TOTAL_COST2_DESCRIPTION.rows[0]);
				expect(oUpdatedCostingSheetText.columns.TOTAL_COST2_DESCRIPTION.rows[0]).toEqual('UpdateTotal2Test1');
				expect(oUpdatedCostingSheetText.columns.TOTAL_COST3_DESCRIPTION.rows[0]).not.toEqual(oInitialCostingSheetText.columns.TOTAL_COST3_DESCRIPTION.rows[0]);
				expect(oUpdatedCostingSheetText.columns.TOTAL_COST3_DESCRIPTION.rows[0]).toEqual('UpdateTotal3Test1');
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when updating to invalid types for IS_TOTAL_COST2_ENABLED/IS_TOTAL_COST_3_ENABLED', function(){
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "COGM",
							"CONTROLLING_AREA_ID" : "#CA1",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"IS_TOTAL_COST2_ENABLED": 21,
							"IS_TOTAL_COST3_ENABLED": 13
						}],
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"LANGUAGE" : "EN",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1",
							"TOTAL_COST2_DESCRIPTION" : "",
							"TOTAL_COST3_DESCRIPTION" : "",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when updated TOTAL_COST2/3_DESCRIPTION exceed 250 chars', function(){
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sDescription = `250description250description250description250description250description250description250description250description250description250description
									250description250description250description250description250description250description250description250description250`;
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ENTITIES" : [{
							"COSTING_SHEET_ID": "COGM",
							"CONTROLLING_AREA_ID" : "#CA1",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"IS_TOTAL_COST2_ENABLED": 1,
							"IS_TOTAL_COST3_ENABLED": 1
						}],
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"LANGUAGE" : "EN",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1",
							"TOTAL_COST2_DESCRIPTION" : sDescription,
							"TOTAL_COST3_DESCRIPTION" : sDescription,
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should throw error (GENERAL_VALIDATION_ERROR) when try to update IS_RELEVANT_FOR_TOTAL fields for base rows (READONLY)', function(){
				
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);					
				var sObjectName = "Costing_Sheet";			
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES":[{
							"COSTING_SHEET_ID":"COGM",
							"CONTROLLING_AREA_ID":"1000",
							"_VALID_FROM":"2015-01-01T00:00:00.000Z",
							"IS_TOTAL_COST2_ENABLED":0,
							"IS_TOTAL_COST3_ENABLED": 0
						}],
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ROW_ID": "MEK",
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_TYPE": 1,
							"CALCULATION_ORDER": 3,
							"ACCOUNT_GROUP_AS_BASE_ID": 110,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"IS_RELEVANT_FOR_TOTAL": 0,
							"IS_RELEVANT_FOR_TOTAL2": 0,
							"IS_RELEVANT_FOR_TOTAL3": 1,
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES":[],
						"COSTING_SHEET_OVERHEAD_ENTITIES":[{
							"COSTING_SHEET_OVERHEAD_ID":"5",
							"CREDIT_ACCOUNT_ID":"655200",
							"CREDIT_FIXED_COST_PORTION":0,
							"USE_DEFAULT_FIXED_COST_PORTION": 1,
							"IS_ROLLED_UP":1,
							"_VALID_FROM":"2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES":[]
				};
				
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
				var oExpectedValidationObject = {
					"columnIds": [
						{"columnId" : "IS_RELEVANT_FOR_TOTAL"},
						{"columnId" : "IS_RELEVANT_FOR_TOTAL2"},
						{"columnId" : "IS_RELEVANT_FOR_TOTAL3"}
					],
					"validationInfoCode": "READONLY_FIELD_ERROR"
				};

				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oReturnedObject.errors[0].operation).toBe('Update');
				expect(oReturnedObject.errors[0].details.validationObj).toEqual(oExpectedValidationObject);		
			});
			
			it('should update costing_sheet_rows with valid IS_RELEVANT_FOR_TOTAL flags', function(){
				
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);					
				var sObjectName = "Costing_Sheet";			
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES":[{
							"COSTING_SHEET_ID":"COGM",
							"CONTROLLING_AREA_ID":"1000",
							"_VALID_FROM":"2015-01-01T00:00:00.000Z",
							"IS_TOTAL_COST2_ENABLED":1,
							"IS_TOTAL_COST3_ENABLED":1
						}],
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ROW_ID": "MGK",
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_TYPE": 3,
							"CALCULATION_ORDER": 2,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"IS_RELEVANT_FOR_TOTAL": 0,
							"IS_RELEVANT_FOR_TOTAL2": 0,
							"IS_RELEVANT_FOR_TOTAL3": 1,
						},
						{
							"COSTING_SHEET_ROW_ID": "HK",
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_TYPE": 4,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"CALCULATION_ORDER": 6,
							"IS_RELEVANT_FOR_TOTAL": 0,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 0,
						}],
				};
				
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
		
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL).toBe(0);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL2).toBe(0);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL3).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[1].IS_RELEVANT_FOR_TOTAL).toBe(0);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[1].IS_RELEVANT_FOR_TOTAL2).toBe(1);
				expect(oReturnedObject.entities.COSTING_SHEET_ROW_ENTITIES[1].IS_RELEVANT_FOR_TOTAL3).toBe(0);
			});

			it('should returned updated entities for costing_sheet_text', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				//var oTesta = mockstar.execQuery("select * from {{costing_sheet}} WHERE COSTING_SHEET_ID = '3'");
				var oTestTexta = mockstar.execQuery("select * from {{costing_sheet_text}} WHERE COSTING_SHEET_ID = 'COGM'");
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"LANGUAGE" : "EN",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1",
							"TOTAL_COST2_DESCRIPTION" : "UpdateTotal2Test1",
							"TOTAL_COST3_DESCRIPTION" : "UpdateTotal3Test1",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				var oTestText = mockstar.execQuery("select * from {{costing_sheet_text}} WHERE COSTING_SHEET_ID = 'COGM'");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oTestText.columns.COSTING_SHEET_ID.rows.length).toBe(oTestTexta.columns.COSTING_SHEET_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a costing sheet text and the costing sheet is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"LANGUAGE" : "EN",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]			                    
				};		
				mockstar.clearTable("costing_sheet");
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when updating a formula when overhead row does not have a formula', function() {
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
							"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
							"COSTING_SHEET_OVERHEAD_ID": 5,
							"VALID_FROM": "2020-12-31T00:00:00.000Z",
							"VALID_TO": "2020-12-31T00:00:00.000Z",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"FORMULA_ID": 2,
							"FORMULA_STRING": "IS_NOT_MATERIAL()",
							"FORMULA_DESCRIPTION": "updated description",
							"_SOURCE": 1,
							"_CREATED_BY": "U000001"
						}]
				};
				mockstar.clearTable("costing_sheet");

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a costing sheet text and the costing sheet text is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"LANGUAGE" : "EN",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1",
							"_VALID_FROM" : "2015-05-01T00:00:00.000Z"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a costing sheet text for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("LANGUAGE");		
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a costing sheet text for which mandatory fields are null or empty', function() {
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
						"COSTING_SHEET_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_DESCRIPTION" : "UpdateTest1",
							"LANGUAGE": "", 
							"_VALID_FROM": null
						}]			                    
				};			
	
				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("LANGUAGE");		
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a costing sheet row text and the costing sheet row is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";
				var oBatchItem = { 
						"COSTING_SHEET_ROW_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID":"1234",
							"COSTING_SHEET_ROW_ID":"FGK",
							"LANGUAGE":"EN",
							"_VALID_FROM":"2015-01-01T00:00:00.000Z",
							"COSTING_SHEET_ROW_DESCRIPTION":"Production Overhead"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
					
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a costing sheet row text for which mandatory fields are empty', function() {
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
				        "COSTING_SHEET_ROW_TEXT_ENTITIES" : [{
							"COSTING_SHEET_ID":"COGM",
							"COSTING_SHEET_ROW_ID":"FGK",
							"LANGUAGE":"",
							"_VALID_FROM":"2015-01-01T00:00:00.000Z",
							"COSTING_SHEET_ROW_DESCRIPTION":"Production Overhead"
						}]				                    
				};			
	
				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("LANGUAGE");				
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
	
			it('should update a costing sheet overhead row setting the profit center', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
	
				var sObjectName = "Costing_Sheet";			
				var oBatchItem = {
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
						"COSTING_SHEET_ROW_TEXT_ENTITIES":[{
							"COSTING_SHEET_ID":"COGM",
							"COSTING_SHEET_ROW_ID":"FGK",
							"LANGUAGE":"EN",
							"_VALID_FROM":"2015-01-01T00:00:00.000Z",
							"COSTING_SHEET_ROW_DESCRIPTION":"Production Overhead"
						},{
							"COSTING_SHEET_ID":"COGM",
							"COSTING_SHEET_ROW_ID":"FGK",
							"LANGUAGE":"DE",
							"_VALID_FROM":"2015-01-01T00:00:00.000Z",
							"COSTING_SHEET_ROW_DESCRIPTION":"Fertigungsgemeinkosten"
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
							"PROFIT_CENTER_ID":"P4",
							"CREDIT_FIXED_COST_PORTION":11,
							"OVERHEAD_PERCENTAGE":15.0,
							"_VALID_FROM":"2015-01-01T00:00:00.000Z"
						}]
				};
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].CREDIT_FIXED_COST_PORTION).toBe(11);
				expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ENTITIES[0].USE_DEFAULT_FIXED_COST_PORTION).toBe(1);

				var updatedCreditFixedCostPortion = mockstar.execQuery("select CREDIT_FIXED_COST_PORTION from {{costing_sheet_overhead_row}} WHERE COSTING_SHEET_OVERHEAD_ID = 5 and COSTING_SHEET_OVERHEAD_ROW_ID = 1 and _VALID_TO is null");
				expect(updatedCreditFixedCostPortion.columns.CREDIT_FIXED_COST_PORTION.rows[0]).toEqual(11);

				var updatedUseDefaultCreditFixedCostPortion = mockstar.execQuery("select USE_DEFAULT_FIXED_COST_PORTION from {{costing_sheet_overhead}} WHERE COSTING_SHEET_OVERHEAD_ID = 5 and _VALID_TO is null");
				expect(updatedUseDefaultCreditFixedCostPortion.columns.USE_DEFAULT_FIXED_COST_PORTION.rows[0]).toEqual(1);
	
				expect(oReturnedObject.hasErrors).toBe(false);
			});
	
			it('should recreate the texts for all the rows of the updated costing sheet', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
	
				var sObjectName = "Costing_Sheet";			
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES":[{
							"COSTING_SHEET_ID":"COGM",
							"CONTROLLING_AREA_ID":"1000",
							"_VALID_FROM":"2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_ROW_TEXT_ENTITIES":[{
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_ID": "MGK",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "Materialzuschlag",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"_SOURCE": 1,
							"_CREATED_BY": "U000"
						},{
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_ID": "MEK",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "Materialeinzelkosten",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"_SOURCE": 1,
							"_CREATED_BY": "U000"
						},{
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_ID": "MEK",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "Direct Material Cost",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"_SOURCE": 1,
							"_CREATED_BY": "U000"
						},{
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_ID": "FEK",
							"LANGUAGE": "EN",
							"COSTING_SHEET_ROW_DESCRIPTION": "Updated Direct Production Cost",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"_SOURCE": 1,
							"_CREATED_BY": "U000"
						},{
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_ID": "FEK",
							"LANGUAGE": "DE",
							"COSTING_SHEET_ROW_DESCRIPTION": "Fertigungseinzelkosten",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"_SOURCE": 1,
							"_CREATED_BY": "U000"
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				var oTestb = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_text", "COSTING_SHEET_ID = 'COGM' and _VALID_TO is null");
				expect(oTestb).toBe(5);
				expect(oReturnedObject.hasErrors).toBe(false);
			});	
	
			it('should update the reference field for the costing sheet rows', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oTesta = mockstar.execQuery("select * from {{costing_sheet_row_dependencies}} WHERE COSTING_SHEET_ID = 'COGM' and _VALID_TO is not null");
				var sObjectName = "Costing_Sheet";	
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES": [{
							"COSTING_SHEET_ID": "COGM",
							"CONTROLLING_AREA_ID": "1000",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "MEK",
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_TYPE": 1,
							"CALCULATION_ORDER": 3,
							"ACCOUNT_GROUP_AS_BASE_ID": 110,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [{
							"SOURCE_ROW_ID": "MGK",
							"TARGET_ROW_ID": "MEK",
							"COSTING_SHEET_ID": "COGM"
						},{
							"SOURCE_ROW_ID": "HK",
							"TARGET_ROW_ID": "MEK",
							"COSTING_SHEET_ID": "COGM"
						},{
							"SOURCE_ROW_ID": "HK",
							"TARGET_ROW_ID": "MGK",
							"COSTING_SHEET_ID": "COGM"
						},{
							"SOURCE_ROW_ID": "HK",
							"TARGET_ROW_ID": "FEK",
							"COSTING_SHEET_ID": "COGM"
						},{
							"SOURCE_ROW_ID": "HK",
							"TARGET_ROW_ID": "FGK",
							"COSTING_SHEET_ID": "COGM"
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				var oTestb = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_dependencies", "COSTING_SHEET_ID = 'COGM' and _VALID_TO is null");
				var oTestc = mockstar.execQuery("select * from {{costing_sheet_row_dependencies}} WHERE COSTING_SHEET_ID = 'COGM' and _VALID_TO is not null AND _VALID_TO < '2015-09-01T00:00:00Z'");
				expect(oTestb).toBe(5);
				expect(oTestc).toEqual(oTesta);
				expect(oReturnedObject.hasErrors).toBe(false);
			});

			it('should delete the overhead row formula if FORMULA_STRING, FORMULA_ID and FORMULA_DESCRIPTION are missing from UPDATE request payload', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 7,
						"VALID_FROM": "2013-01-02T00:00:00.000Z",
						"VALID_TO": "2099-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						"_SOURCE": 1,
						"_CREATED_BY": "U000001"
					}]
				};

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_STRING).toBeUndefined();
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID).toBeUndefined();
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_DESCRIPTION).toBeUndefined();
				const costing_sheet_overhead_row = mockstar.execQuery("select * from {{costing_sheet_overhead_row}} WHERE COSTING_SHEET_OVERHEAD_ROW_ID = 1 and COSTING_SHEET_OVERHEAD_ID = 7 and _VALID_TO is null");
				expect(costing_sheet_overhead_row).toMatchData({
					FORMULA_ID:             [null]
				}, ["FORMULA_ID"]);
				const costing_sheet_overhead_row_formula = mockstar.execQuery("select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID = 3");
				expect(costing_sheet_overhead_row_formula).toMatchData({
					FORMULA_ID:             [3],
					FORMULA_STRING: 		[null],
					FORMULA_DESCRIPTION:	[null]
				}, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION"]);
			});

			it('should create an overhead row formula in case none exists for given overhead row', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 5,
						"VALID_FROM": "2020-12-31T00:00:00.000Z",
						"VALID_TO": "2020-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						"FORMULA_STRING": "IS_MATERIAL()",
						"FORMULA_DESCRIPTION": "created formula for existent overhead row",
						"_SOURCE": 1,
						"_CREATED_BY": "U000001"
					}]
				};

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_STRING).toBe(oBatchItem.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_STRING);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID).not.toBe(null);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_DESCRIPTION).toBe(oBatchItem.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_DESCRIPTION);
				const costing_sheet_overhead_row = mockstar.execQuery("select FORMULA_ID from {{costing_sheet_overhead_row}} WHERE COSTING_SHEET_OVERHEAD_ROW_ID = 1 and COSTING_SHEET_OVERHEAD_ID = 5 and _VALID_TO is null");
				const costing_sheet_overhead_row_formula = mockstar.execQuery("select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID = " + costing_sheet_overhead_row.columns.FORMULA_ID.rows[0]);
				expect(costing_sheet_overhead_row_formula).toMatchData({
					FORMULA_ID:             [costing_sheet_overhead_row.columns.FORMULA_ID.rows[0]],
					FORMULA_STRING: 		["IS_MATERIAL()"],
					FORMULA_DESCRIPTION:	["created formula for existent overhead row"]
				}, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION"]);
			});

			it('should throw CALCULATIONENGINE_SYNTAX_ERROR_WARNING for invalid formula syntax', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 5,
						"VALID_FROM": "2020-12-31T00:00:00.000Z",
						"VALID_TO": "2020-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						"FORMULA_STRING": "true(",
						"FORMULA_DESCRIPTION": "invalid formula",
						"_SOURCE": 1,
						"_CREATED_BY": "U000001"
					}]
				};

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
                expect(oReturnedObject.hasErrors).toBe(true);
                expect(oReturnedObject.errors[0].code).toBe(MessageCode.CALCULATIONENGINE_SYNTAX_ERROR_WARNING.code);
			});

			it('should throw CALCULATIONENGINE_FIELD_IS_CALCULATED for calculated field ised in formula', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 5,
						"VALID_FROM": "2020-12-31T00:00:00.000Z",
						"VALID_TO": "2020-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						"FORMULA_STRING": "$BASE_QUANTITY = 300",
						"FORMULA_DESCRIPTION": "calculated field error",
						"_SOURCE": 1,
						"_CREATED_BY": "U000001"
					}]
				};

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
                expect(oReturnedObject.hasErrors).toBe(true);
                expect(oReturnedObject.errors[0].code).toBe(MessageCode.CALCULATIONENGINE_FIELD_IS_CALCULATED.code);
			});

			it('should throw CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING for non existing field used in formula', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 5,
						"VALID_FROM": "2020-12-31T00:00:00.000Z",
						"VALID_TO": "2020-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						"FORMULA_STRING": "$MY_NON_EXISTING_FIELD = 500",
						"FORMULA_DESCRIPTION": "this field does not exist",
						"_SOURCE": 1,
						"_CREATED_BY": "U000001"
					}]
				};

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
                expect(oReturnedObject.hasErrors).toBe(true);
                expect(oReturnedObject.errors[0].code).toBe(MessageCode.CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING.code);
			});

			it('should throw CALCULATIONENGINE_FUNCTION_NOT_FOUND_WARNING for function not existing', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 5,
						"VALID_FROM": "2020-12-31T00:00:00.000Z",
						"VALID_TO": "2020-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						"FORMULA_STRING": "MY_UNDEFINED_FUNCTION()",
						"FORMULA_DESCRIPTION": "this field does not exist",
						"_SOURCE": 1,
						"_CREATED_BY": "U000001"
					}]
				};

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
                expect(oReturnedObject.hasErrors).toBe(true);
                expect(oReturnedObject.errors[0].code).toBe(MessageCode.CALCULATIONENGINE_FUNCTION_NOT_FOUND_WARNING.code);
			});

			it('should throw FORMULA_RESULT_NOT_BOOLEAN for formula that is not returning an boolean value', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 5,
						"VALID_FROM": "2020-12-31T00:00:00.000Z",
						"VALID_TO": "2020-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						"FORMULA_STRING": "ANCESTOR(true();$IS_ACTIVE;$CREATED_BY)",
						"FORMULA_DESCRIPTION": "this field does not exist",
						"_SOURCE": 1,
						"_CREATED_BY": "U000001"
					}]
				};

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
                expect(oReturnedObject.hasErrors).toBe(true);
                expect(oReturnedObject.errors[0].code).toBe(MessageCode.FORMULA_RESULT_NOT_BOOLEAN.code);
			});

			it('should update FORMULA_DESCRIPTION', function() {
				// the active references for the costing sheet are deactivated, and the references from the request are created
				// on the request it is send the current state of the dependencies
				// arrange
				const administration = Administration.getAdministrationObject(mockstar,mockstar);
				const sObjectName = "Costing_Sheet";
				const oBatchItem = {
					"COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
						"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
						"COSTING_SHEET_OVERHEAD_ID": 6,
						"VALID_FROM": "2020-12-31T00:00:00.000Z",
						"VALID_TO": "2020-12-31T00:00:00.000Z",
						"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						"FORMULA_ID": 2,
						"FORMULA_STRING": "TRUE()",
						"FORMULA_DESCRIPTION": "updated the formula with value TRUE()",
						"_SOURCE": 1,
						"_CREATED_BY": "U000001"
					}]
				};

				// act
				const oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());

				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_STRING).toBe(oBatchItem.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_STRING);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID).toBe(oBatchItem.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_ID);
			    expect(oReturnedObject.entities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_DESCRIPTION).toBe(oBatchItem.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].FORMULA_DESCRIPTION);

				const costing_sheet_overhead_row = mockstar.execQuery("select * from {{costing_sheet_overhead_row}} WHERE COSTING_SHEET_OVERHEAD_ROW_ID = 1 and COSTING_SHEET_OVERHEAD_ID = 6 and _VALID_TO is null");
				expect(costing_sheet_overhead_row).toMatchData({
					FORMULA_ID:             [2]
				}, ["FORMULA_ID"]);

				const costing_sheet_overhead_row_formula = mockstar.execQuery("select * from {{costing_sheet_overhead_row_formula}} WHERE FORMULA_ID = 2");
				expect(costing_sheet_overhead_row_formula).toMatchData({
					FORMULA_ID:             [2],
					FORMULA_STRING: 		["TRUE()"],
					FORMULA_DESCRIPTION:	["updated the formula with value TRUE()"]
				}, ["FORMULA_ID", "FORMULA_STRING", "FORMULA_DESCRIPTION"]);
			});

			it('should throw exception when account group as base id is not sent', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Costing_Sheet";	
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES": [{
							"COSTING_SHEET_ID": "COGM",
							"CONTROLLING_AREA_ID": "1000",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "MEK",
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_TYPE": 1,
							"CALCULATION_ORDER": 3,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObj.COSTING_SHEET_ROW_ENTITIES.length).toBe(1);
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe('MISSING_MANDATORY_ENTRY');
			});
	
			it('should update the costing_sheet_base_row', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oTestBefore = mockstar_helpers.getRowCount(mockstar, "costing_sheet_base_row", "COSTING_SHEET_BASE_ID = 1");
				var sObjectName = "Costing_Sheet";	
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES": [{
							"COSTING_SHEET_ID": "COGM",
							"CONTROLLING_AREA_ID": "1000",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "HH",
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_TYPE": 2,
							"CALCULATION_ORDER": 5,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": 1,
							"COST_PORTION": 3,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": 1,
							"ITEM_CATEGORY_ID": 1,
							"CHILD_ITEM_CATEGORY_ID": 1,
							"SUBITEM_STATE": 3,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"CHILD_ITEM_CATEGORY_ID": 1,
						}],
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				var oTest = mockstar_helpers.getRowCount(mockstar, "costing_sheet_base_row", "COSTING_SHEET_BASE_ID = 1");
				var oTesta = mockstar_helpers.getRowCount(mockstar, "costing_sheet_base_row", "COSTING_SHEET_BASE_ID = 1 and _VALID_TO is null");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oTest).toBe(oTestBefore + 1);
				expect(oTesta).toBe(1);
			});
	
			it('should delete the base row using only part of key -costing_sheet_base_id- and create a new one from the request', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oTestBeforeDelete = mockstar_helpers.getRowCount(mockstar, "costing_sheet_base_row", "COSTING_SHEET_BASE_ID = 1 and ITEM_CATEGORY_ID = 1 and CHILD_ITEM_CATEGORY_ID = 1 and _VALID_TO is null");
				var oTestBeforeCreate = mockstar_helpers.getRowCount(mockstar, "costing_sheet_base_row", "COSTING_SHEET_BASE_ID = 1 and ITEM_CATEGORY_ID = 3 and CHILD_ITEM_CATEGORY_ID = 3 and _VALID_TO is null");
				var sObjectName = "Costing_Sheet";	
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES": [{
							"COSTING_SHEET_ID": "COGM", 
							"CONTROLLING_AREA_ID": "1000",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_ROW_ENTITIES": [{
							"COSTING_SHEET_ROW_ID": "HH",
							"COSTING_SHEET_ID": "COGM",
							"COSTING_SHEET_ROW_TYPE": 2,
							"CALCULATION_ORDER": 5,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_BASE_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": 1,
							"COST_PORTION": 3,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [{
							"COSTING_SHEET_BASE_ID": 1,
							"ITEM_CATEGORY_ID": 3,
							"CHILD_ITEM_CATEGORY_ID": 3,
							"SUBITEM_STATE": 1,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
							"CHILD_ITEM_CATEGORY_ID": 3,
						}],
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				// assert
				var oTestDeleted = mockstar_helpers.getRowCount(mockstar, "costing_sheet_base_row", "COSTING_SHEET_BASE_ID = 1 and ITEM_CATEGORY_ID = 1 and CHILD_ITEM_CATEGORY_ID = 1 and _VALID_TO is null");
				var oTestCreated = mockstar_helpers.getRowCount(mockstar, "costing_sheet_base_row", "COSTING_SHEET_BASE_ID = 1 and ITEM_CATEGORY_ID = 3 and CHILD_ITEM_CATEGORY_ID = 3 and _VALID_TO is null");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oTestBeforeDelete).toBe(1);
				expect(oTestBeforeCreate).toBe(0)
				expect(oTestDeleted).toBe(0);
				expect(oTestCreated).toBe(1)
			});
			
			it('should not invalidate all dependencies and all costing sheet rows when only costing sheet is updated', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				
				var oTestDepBefore = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_dependencies", "COSTING_SHEET_ID = 'COGM' and _VALID_TO is null");
				var oTestTextsBefore = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_text", "COSTING_SHEET_ID = 'COGM' and _VALID_TO is null");
	
				var sObjectName = "Costing_Sheet";			
				var oBatchItem = {
						"COSTING_SHEET_ENTITIES":[{
							"COSTING_SHEET_ID":"COGM",
							"CONTROLLING_AREA_ID":"1000",
							"_VALID_FROM":"2015-01-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, NewDateAsISOString());
	
				var oTestDepAfter = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_dependencies", "COSTING_SHEET_ID = 'COGM' and _VALID_TO is null");
				var oTestTextsAfter = mockstar_helpers.getRowCount(mockstar, "costing_sheet_row_text", "COSTING_SHEET_ID = 'COGM' and _VALID_TO is null");
				expect(oTestDepAfter).toBe(oTestDepBefore);
				expect(oTestTextsAfter).toBe(oTestTextsBefore);
				expect(oReturnedObject.hasErrors).toBe(false);
			});	
			
		});
	}).addTags(["Administration_NoCF_Integration"]);
}