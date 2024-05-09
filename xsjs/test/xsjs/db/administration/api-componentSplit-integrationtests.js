var testData = require("../../../testdata/testdata").data;
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;

var ApiComponentSplitImport = $.import("xs.db.administration", "api-componentSplit");
var Administration = require("./administration-util");

var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	    = require("../../../../lib/xs/util/message");
var MessageCode    	    = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../lib/xs/util/constants").BusinessObjectTypes;
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;

var oSelectedAccountGroups = {
		"ACCOUNT_GROUP_ID": ["700", "700", "800", "800"],
		"COMPONENT_SPLIT_ID": ["1","1","1","1"],
		"_VALID_FROM" : ["2015-07-07T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-07-07T00:00:00.000Z"],
		"_VALID_TO" : [null, "2015-07-07T00:00:00.000Z", "2015-07-07T00:00:00.000Z", null]
};

var userId = $.session.getUsername().toUpperCase();

var oLock = {
		"LOCK_OBJECT": "Component_Split",
		"USER_ID": userId,
		"LAST_UPDATED_ON": new Date()
};

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.api-componentSplit-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var mockstarRepl = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procCSRead"  : "sap.plc.db.administration.procedures/p_component_split_read",
					"procCARead"  : "sap.plc.db.administration.procedures/p_ref_controlling_area_read"
				},
				substituteTables : {
					component_split : {
						name : Resources["Component_Split"].dbobjects.plcTable
					},
					component_split_text : {
						name : Resources["Component_Split"].dbobjects.plcTextTable
					},
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.plcTable
					},
					controlling_area_text : {
						name : Resources["Controlling_Area"].dbobjects.plcTextTable
					},
					component_split_account_group : {
						name : Resources["Component_Split_Account_Group"].dbobjects.plcTable
					},
					account_group : {
						name : Resources["Account_Group"].dbobjects.plcTable
					}, 
					lock_table : {
						name : "sap.plc.db::basis.t_lock"
					},
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
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			mockstarRepl = new MockstarFacade({
				substituteTables : {
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.erpTable
					},
					controlling_area_text : {
						name : Resources["Controlling_Area"].dbobjects.erpTextTable
					}
				}
			});
	
			if (!mockstar.disableMockstar) {
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '.sap.plc.db.administration.procedures::';
				originalProcedures = ApiComponentSplitImport.Procedures;
				ApiComponentSplitImport.Procedures = Object.freeze({
					component_split_read : procedurePrefix + 'p_component_split_read',
					controlling_area_read :  procedurePrefix + 'p_ref_controlling_area_read'
				});
			}
	
		});
	
		afterOnce(function() {
			if (!mockstar.disableMockstar) {
				ApiComponentSplitImport.Procedures = originalProcedures;
				mockstar.cleanup();
				mockstarRepl.cleanup();
			}
		});
	
		describe ("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstarRepl.clearAllTables();
				mockstar.insertTableData("component_split", testData.componentSplit);
				mockstar.insertTableData("component_split_text", testData.componentSplitText);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstarRepl.insertTableData("controlling_area", testData.oControllingAreaTestDataErp);
				mockstarRepl.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataErp);
				mockstar.initializeData();
				mockstarRepl.initializeData();
			});
	
			it('should return valid component_splits,component_split_texts, account_groups, controlling_areas and chart_of_accounts', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Component_Split";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.COMPONENT_SPLIT_ENTITIES.length).toBe(2);
				expect(oReturnedObject.COMPONENT_SPLIT_TEXT_ENTITIES.length).toBe(2);
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES.length).toBeGreaterThan(0);
			});
	
			it('should return valid component_splits,component_split_texts, controlling_areas and chart_of_accounts for a valid filter', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sLanguage = 'EN';
				var oGetParameters= {};
				oGetParameters["business_object"] = "Component_Split";
				oGetParameters["filter"] = "CONTROLLING_AREA_ID=#CA2";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.COMPONENT_SPLIT_ENTITIES.length).toBe(1);
				expect(oReturnedObject.COMPONENT_SPLIT_TEXT_ENTITIES.length).toBe(1);
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES.length).toBeGreaterThan(0);
			});
	
			it('should return an exception for a invalid filter', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sLanguage = 'EN';
				var exception = null;
				var oGetParameters= {};
				oGetParameters["business_object"] = "Component_Split";
				oGetParameters["filter"] = "CONTROLLING_AREA_ID=DROP table";
	
				// act
				try {
					var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
				} catch (e) {
					exception = e;
				}
	
				// assert
				expect(exception.code.code).toBe("GENERAL_VALIDATION_ERROR");
			});
			
			it('should filter data using additional criteria in autocomplete', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Component_Split";
				oGetParameters["searchAutocomplete"] = "1";
				oGetParameters["filter"] = "CONTROLLING_AREA_ID=#CA1";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.COMPONENT_SPLIT_ENTITIES.length).toBe(1);
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES.length).toBe(1);
			});
		});
	
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("component_split", testData.componentSplit);
				mockstar.insertTableData("component_split_text", testData.componentSplitText);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("component_split_account_group", testData.componentSplitAccountGroupTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});
	
			it('should deactivate component splits, component split texts and selected account groups', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "1",
							"_VALID_FROM" : "2015-05-28T15:39:09.691Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.COMPONENT_SPLIT_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a component split for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
	//						"COMPONENT_SPLIT_ID" : ""
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("COMPONENT_SPLIT_ID");			
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a component split for which mandatory fields are null or empty', function() {
				// arrange
				let administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				let sObjectName = "Component_Split";
				const oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : null,
							"_VALID_FROM": null
						}]
				};
	
				// act
				let oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("COMPONENT_SPLIT_ID");			
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a component split that does not exist', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "1234",
							"_VALID_FROM" : "2015-05-28T15:39:09.691Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
		});
	
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("component_split", testData.componentSplit);
				mockstar.insertTableData("component_split_text", testData.componentSplitText);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("component_split_account_group", testData.componentSplitAccountGroupTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});;
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when when try to insert texts for a component split that does not exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"CONTROLLING_AREA_ID" : "#CA1"
						}],
						"COMPONENT_SPLIT_TEXT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "DE",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test1"
						},{
							"COMPONENT_SPLIT_ID" : "100",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test2"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
	
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when when try to assign an account group that does not exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"CONTROLLING_AREA_ID" : "#CA1"
						}],
						"COMPONENT_SPLIT_TEXT_ENTITIES" :[{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "DE",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test1"
						},{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test2"
						}],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 1,	
							"COMPONENT_SPLIT_ID" : "10"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);	
				expect(oReturnedObject.errors[0].details.businessObj).toBe(BusinessObjectTypes.AccountGroup);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when when try to assign an account group to a component split(that does not exist)', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				mockstar.insertTableData("account_group", testData.accountGroupTestDataPlc);
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"CONTROLLING_AREA_ID" : "#CA1"
						}],
						"COMPONENT_SPLIT_TEXT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "DE",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test1"
						},{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test2"
						}],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 1,	
							"COMPONENT_SPLIT_ID" : "100"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);	
			});
	
			it('should throw exception (GENERAL_UNEXPECTED_EXCEPTION) when controlling area is different in component_split and account_group', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				mockstar.insertTableData("account_group", testData.accountGroupTestDataPlc);
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"CONTROLLING_AREA_ID" : "#CA1"
						}],
						"COMPONENT_SPLIT_TEXT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "DE",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test1"
						},{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test2"
						}],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 1,	
							"COMPONENT_SPLIT_ID" : "3"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_UNEXPECTED_EXCEPTION.code);
			});
	
			it('should create entries in component_split, component_split_text and component_split_account_group', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{component_split}} WHERE COMPONENT_SPLIT_ID = '10'");
				var oTestTexta = mockstar.execQuery("select * from {{component_split_text}} WHERE COMPONENT_SPLIT_ID = '10'");
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				mockstar.insertTableData("account_group", testData.accountGroupTestDataPlc);
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"CONTROLLING_AREA_ID" : "#CA1"
						}],
						"COMPONENT_SPLIT_TEXT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "DE",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test1"
						},{
							"COMPONENT_SPLIT_ID" : "10",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "Test2"
						}],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 1,	
							"COMPONENT_SPLIT_ID" : "10"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				var oTest = mockstar.execQuery("select * from {{component_split}} WHERE COMPONENT_SPLIT_ID = '10'");
				var oTestText = mockstar.execQuery("select * from {{component_split_text}} WHERE COMPONENT_SPLIT_ID = '10'");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oTest.columns.COMPONENT_SPLIT_ID.rows.length).toBe(oTesta.columns.COMPONENT_SPLIT_ID.rows.length + 1);
				expect(oTestText.columns.COMPONENT_SPLIT_ID.rows.length).toBe(oTestTexta.columns.COMPONENT_SPLIT_ID.rows.length + 2);
				expect(oReturnedObject.entities).toEqualObject(oBatchItem);
				expect(oReturnedObject.entities.COMPONENT_SPLIT_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.COMPONENT_SPLIT_TEXT_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.COMPONENT_SPLIT_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.SELECTED_ACCOUNT_GROUPS_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a component split that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "1",
							"CONTROLLING_AREA_ID" : "#CA1"
						}]
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "1",
							"CONTROLLING_AREA" : "#CA1"
						}]
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnId).toBe("CONTROLLING_AREA");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a component split for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
	//						"COMPONENT_SPLIT_ID" : "",
						}]
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("COMPONENT_SPLIT_ID");			
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			
		});
	
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("component_split", testData.componentSplit);
				mockstar.insertTableData("component_split_text", testData.componentSplitText);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("component_split_account_group", oSelectedAccountGroups);
				mockstar.insertTableData("account_group", testData.oAccountGroupTest);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});
	
			it('should returned updated entities for component_split_text', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				//var oTesta = mockstar.execQuery("select * from {{component_split}} WHERE COMPONENT_SPLIT_ID = '3'");
				var oTestTexta = mockstar.execQuery("select * from {{component_split_text}} WHERE COMPONENT_SPLIT_ID = '1'");
				var sObjectName = "Component_Split";
				mockstar.insertTableData("account_group", testData.accountGroupTestDataPlc);
				var oBatchItem = { 
						"COMPONENT_SPLIT_TEXT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "1",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "UpdateTest1",
							"_VALID_FROM" : "2015-05-28T15:39:09.691Z"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				//var oTest = mockstar.execQuery("select * from {{component_split}} WHERE COMPONENT_SPLIT_ID = '3'");
				var oTestText = mockstar.execQuery("select * from {{component_split_text}} WHERE COMPONENT_SPLIT_ID = '1'");
				expect(oReturnedObject.hasErrors).toBe(false);
				//expect(oTest.columns.COMPONENT_SPLIT_ID.rows.length).toBe(oTesta.columns.COMPONENT_SPLIT_ID.rows.length + 1);
				expect(oTestText.columns.COMPONENT_SPLIT_ID.rows.length).toBe(oTestTexta.columns.COMPONENT_SPLIT_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a component split text and the component split text is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_TEXT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "1",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "UpdateTest1",
							"_VALID_FROM" : "2015-12-28T15:39:09.691Z"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a component split text and the component split is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";	
				var oBatchItem = { 
						"COMPONENT_SPLIT_TEXT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "1",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "UpdateTest1",
							"_VALID_FROM" : "2015-05-28T15:39:09.691Z"
						}]			                    
				};	
				mockstar.clearTable("component_split");
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
	
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a component split text for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_TEXT_ENTITIES" : [{
	//						"COMPONENT_SPLIT_ID" : "",
							"LANGUAGE" : "EN",
							"COMPONENT_SPLIT_DESCRIPTION" : "UpdateTest1"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("COMPONENT_SPLIT_ID");		
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");			
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should deactivate the selected account groups of the updated component split and create the account groups cost component from the request', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
				var oTesta = mockstar.execQuery("select * from {{component_split_account_group}} WHERE COMPONENT_SPLIT_ID = '1' and _VALID_TO is not null");
				var sObjectName = "Component_Split";
				var oBatchItem = { 
						"COMPONENT_SPLIT_ENTITIES" : [{
							"COMPONENT_SPLIT_ID" : "1",
							"CONTROLLING_AREA" : "1000",
							"_VALID_FROM" : "2015-05-28T15:39:09.691Z"
						}],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES" : [{
							"ACCOUNT_GROUP_ID": "700",
							"COMPONENT_SPLIT_ID": "1"}	
						]};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				var oTestb = mockstar.execQuery("select * from {{component_split_account_group}} WHERE COMPONENT_SPLIT_ID = '1' and _VALID_TO is null");
				var oTestc = mockstar.execQuery("select * from {{component_split_account_group}} WHERE COMPONENT_SPLIT_ID = '1' and _VALID_TO is not null AND _VALID_TO < '2015-09-01T00:00:00Z'");
				expect(oTestb.columns.COMPONENT_SPLIT_ID.rows.length).toBe(1);
				expect(oTestc).toEqual(oTesta);
				expect(oReturnedObject.hasErrors).toBe(false);
			});
		});
	}).addTags(["Administration_NoCF_Integration"]);
}