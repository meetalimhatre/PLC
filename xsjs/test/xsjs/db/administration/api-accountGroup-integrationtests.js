var testData = require("../../../testdata/testdata").data;
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;

var ApiAccountGroupImport 	= $.import("xs.db.administration", "api-accountGroup");
var Administration 			= require("./administration-util");
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;

var Resources 				= require("../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 			= require("../../../../lib/xs/util/message");
var MessageCode    			= MessageLibrary.Code;
var ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../lib/xs/util/constants").BusinessObjectTypes;

var userId = $.session.getUsername().toUpperCase();
var originalProcedures = ApiAccountGroupImport.Procedures;
var oLock = {
		"LOCK_OBJECT": "Account_Group",
		"USER_ID": userId,
		"LAST_UPDATED_ON": new Date()
};

var oAccountRangeValidTo = {
		"FROM_ACCOUNT_ID": ["40000", "21000", "41000", "20000"],
		"TO_ACCOUNT_ID" : ["40010", "22000", "41010", "21000"],
		"ACCOUNT_GROUP_ID" : [700, 700, 700, 700],
		"_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
		"_VALID_TO" : [null, "2015-05-05T00:00:00.000Z", "2015-05-05T00:00:00.000Z", null],
		"_SOURCE" : [1, 1, 1, 1],
		"_CREATED_BY" : ["U0001", "U0001", "U0001", "U0001"]
};

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.api-accountGroup-integrationtests', function() {
	
		
		var mockstar = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel : {
							"procAGRead" : "sap.plc.db.administration.procedures/p_account_group_read",
							"procAcRead" : "sap.plc.db.administration.procedures/p_ref_accounts_read",
							"procCARead" : "sap.plc.db.administration.procedures/p_ref_controlling_area_read"
						},
						substituteTables : {
							account_group : {
								name : Resources["Account_Group"].dbobjects.plcTable
							},
							account_group_text : {
								name : Resources["Account_Group"].dbobjects.plcTextTable
							},
							account_account_group : {
								name : Resources["Account_Account_Group"].dbobjects.plcTable
							},
							account : {
								name : Resources["Account"].dbobjects.plcTable
							},
							account_text : {
								name : Resources["Account"].dbobjects.plcTextTable
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
							lock_table : "sap.plc.db::basis.t_lock",
							project : ProjectTables.project,
							project_activity_price_surcharges: ProjectTables.project_activity_price_surcharges,
							project_material_price_surcharges: ProjectTables.project_material_price_surcharges,	
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
	
			if (!mockstar.disableMockstar) {
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '.sap.plc.db.administration.procedures::';
				ApiAccountGroupImport.Procedures = Object.freeze({
					account_group_read : procedurePrefix + 'p_account_group_read',
					account_read : procedurePrefix + 'p_ref_accounts_read',
					controlling_area_read :  procedurePrefix + 'p_ref_controlling_area_read'
				});
			}
	
		});
	
		afterOnce(function() {
			ApiAccountGroupImport.Procedures = originalProcedures;
			mockstar.cleanup();
		});
	
		describe ("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("account_group", testData.oAccountGroupValidTo);
				mockstar.insertTableData("account_group_text", testData.oAccountGroupTextValidTo);
				mockstar.insertTableData("account_account_group", testData.oAccountRangeValidTo);
				mockstar.insertTableData("account", testData.oAccountValidTo);
				mockstar.insertTableData("account_text", testData.oAccountTextValidTo);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});
	
			it('should return valid account groups, account ranges, accounts, controlling_areas, chart_of_accounts and all corresponding texts', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oReturnedObject.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(2);
				expect(oReturnedObject.ACCOUNT_ENTITIES.length).toBeGreaterThan(0);
				expect(oReturnedObject.ACCOUNT_RANGES_ENTITIES.length).toBeGreaterThan(0);
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES.length).toBeGreaterThan(0);
			});
	
			it('should return valid account groups, account ranges, accounts, controlling_areas, chart_of_accounts and all corresponding texts for a valid controling area (filter)', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
				oGetParameters["filter"] = "CONTROLLING_AREA_ID=#CA1";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oReturnedObject.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(2);
				expect(oReturnedObject.ACCOUNT_ENTITIES.length).toBeGreaterThan(0);
				expect(oReturnedObject.ACCOUNT_RANGES_ENTITIES.length).toBeGreaterThan(0);
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES.length).toBeGreaterThan(0);
			});
	
			it('should not return any entries for an invalid controlling area (filter)', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
				oGetParameters["filter"] = "CONTROLLING_AREA_ID=5";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(0);
				expect(oReturnedObject.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(0);
				expect(oReturnedObject.ACCOUNT_ENTITIES.length).toBe(0);
				expect(oReturnedObject.ACCOUNT_RANGES_ENTITIES.length).toBe(0);
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES.length).toBe(0);
			});
	
			it('should return an exception for a invalid filter', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var exception = null;
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
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
			
			it('should correctly filter entries (search autocomplete from project-surcharges)', () => {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var exception = null;
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
				oGetParameters["filter"] = "CONTROLLING_AREA_ID=#CA1&ACCOUNT_GROUP_ID=701%";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oReturnedObject.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(2);
				expect(oReturnedObject.ACCOUNT_ENTITIES.length).toBe(1);
				expect(oReturnedObject.ACCOUNT_RANGES_ENTITIES.length).toBe(1);
				expect(oReturnedObject.CONTROLLING_AREA_ENTITIES.length).toBe(1);
			});
			
			it('should not return data if no entry matches the string from autocomplete', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
				oGetParameters["searchAutocomplete"] = "xyz";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(0);
				expect(oReturnedObject.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should filter data using autocomplete when 1 entry matches the string', function() {
				// arrange
				mockstar.insertTableData("account_group", testData.oAccountGroupTest);
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
				oGetParameters["searchAutocomplete"] = "8";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oReturnedObject.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should filter data using autocomplete when multiple entries match the string', function() {
				// arrange
				mockstar.insertTableData("account_group", testData.oAccountGroupTest);
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
				oGetParameters["searchAutocomplete"] = "7";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(2);
				expect(oReturnedObject.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(2);
			});
			it('should return valid account groups when integers appear in the filter (compare the value as numbers not as strings) --> no results', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
				oGetParameters["filter"] = "ACCOUNT_GROUP_ID<=9";

				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());

				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(0);
				expect(oReturnedObject.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(0);
			});
			it('should return valid account groups when integers appear in the filter (compare the value as numbers not as strings)', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters = {};
				oGetParameters["business_object"] = "Account_Group";
				oGetParameters["filter"] = "ACCOUNT_GROUP_ID<=701";

				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());

				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oReturnedObject.ACCOUNT_GROUP_ENTITIES[0].ACCOUNT_GROUP_ID).toBe(701);
			});
		});
	
		describe ("remove", function (){
			const sObjectName = "Account_Group";
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("account_group", testData.oAccountGroupTest);
				mockstar.insertTableData("account_group_text", testData.oAccountGroupTextTest);
				mockstar.insertTableData("account_account_group", testData.oAccountRangeTest);
				mockstar.insertTableData("account", testData.oAccountTest);
				mockstar.insertTableData("account_text", testData.oAccountTextTest);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});
	
			it('should deactivate the current versions of the account groups and texts', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7,
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_ENTITIES[0]._VALID_TO).not.toBe(null);
				var oTestAccount = mockstar.execQuery("select * from {{account_group}} where ACCOUNT_GROUP_ID = '700' and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
				expect(oReturnedObject.entities.ACCOUNT_GROUP_ENTITIES[0]._VALID_FROM.toJSON()).toEqual(oBatchItem.ACCOUNT_GROUP_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account group for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
	            expect(oReturnedObject.hasErrors).toBe(true);
	            expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
	            expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account group for which mandatory fields are null or empty', function() {
				// arrange
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : null,
							"CONTROLLING_AREA_ID" : "#CA1",
							"_VALID_FROM": null
						}]
				};
	
				// act
				let oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
	            expect(oReturnedObject.hasErrors).toBe(true);
	            expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
	            expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("ACCOUNT_GROUP_ID");
	            expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account group which is used in other business objects', function() {
				// arrange
				var oComponentSplitAccountGroup = {
						"ACCOUNT_GROUP_ID" : 700,
						"COMPONENT_SPLIT_ID" : "1",
						"_VALID_FROM" : "2015-05-24T15:39:09.691Z"	
				};
				mockstar.insertTableData("component_split_account_group", oComponentSplitAccountGroup);
	
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oBatchItem = {
						"ACCOUNT_RANGES_ENTITIES" : [{
							"FROM_ACCOUNT_ID" : "778",
							"TO_ACCOUNT_ID" : "778",
							"ACCOUNT_GROUP_ID" : 800,
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}],
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7,
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
	            expect(oReturnedObject.errors[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ComponentSplit);
	            expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account group used in project activity price surcharges', function() {
				// arrange
				mockstar.insertTableData("project_activity_price_surcharges",  testData.oProjectActivityPriceSurcharges);
				mockstar.insertTableData("project",  testData.oProjectTestData);
				// insert an account group that exists in the surcharges
				mockstar.clearTable("account_group");
				mockstar.insertTableData("account_group", 
		                {
		                		"ACCOUNT_GROUP_ID" : [testData.oProjectActivityPriceSurcharges.ACCOUNT_GROUP_ID[0]],
		                		"CONTROLLING_AREA_ID" : [testData.oProjectTestData.CONTROLLING_AREA_ID[0]],
		                		"COST_PORTION" : [6],
		                		"_VALID_FROM" : ["2015-01-01T00:00:00.000Z"],
		                		"_VALID_TO" : [null],
		                		"_SOURCE" : [1]
		                });
				
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : testData.oProjectActivityPriceSurcharges.ACCOUNT_GROUP_ID[0],
							"CONTROLLING_AREA_ID" : testData.oProjectTestData.CONTROLLING_AREA_ID[0],
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
	            expect(oReturnedObject.errors[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ProjectActivityPriceSurcharges);
	            expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});		
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account group used in project material price surcharges', function() {
				// arrange
				mockstar.insertTableData("project_material_price_surcharges",  testData.oProjectMaterialPriceSurcharges);
				mockstar.insertTableData("project",  testData.oProjectTestData);
				// insert an account group that exists in the surcharges
				mockstar.clearTable("account_group");
				mockstar.insertTableData("account_group", 
		                {
		                		"ACCOUNT_GROUP_ID" : [testData.oProjectMaterialPriceSurcharges.ACCOUNT_GROUP_ID[0]],
		                		"CONTROLLING_AREA_ID" : [testData.oProjectTestData.CONTROLLING_AREA_ID[0]],
		                		"COST_PORTION" : [6],
		                		"_VALID_FROM" : ["2015-01-01T00:00:00.000Z"],
		                		"_VALID_TO" : [null],
		                		"_SOURCE" : [1]
		                });
				
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : testData.oProjectMaterialPriceSurcharges.ACCOUNT_GROUP_ID[0],
							"CONTROLLING_AREA_ID" : testData.oProjectTestData.CONTROLLING_AREA_ID[0],
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
	            expect(oReturnedObject.errors[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ProjectMaterialPriceSurcharges);
	            expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});				
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete an account group that does not exist', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 999,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7,
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]
				};
				
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
				
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
	
			it('should deactivate the current versions of the removed account groups and all corresponding account ranges', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7,
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z",
							"_SOURCE" : 1,
							"_CREATED_BY" : userId
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_ENTITIES[0]._VALID_TO).not.toBe(null);
				var oTestAccount = mockstar.execQuery("select * from {{account_group}} where ACCOUNT_GROUP_ID = '700' and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
				expect(oReturnedObject.entities.ACCOUNT_GROUP_ENTITIES[0]._VALID_FROM.toJSON()).toEqual(oBatchItem.ACCOUNT_GROUP_ENTITIES[0]._VALID_FROM);
				expect(oTestAccount.columns._VALID_TO.rows[0]).not.toBe(null);
				var oTestRanges = mockstar.execQuery("select * from {{account_account_group}} where ACCOUNT_GROUP_ID = '700' and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
				expect(oTestRanges.columns._VALID_TO.rows[0]).not.toBe(null);
			});
		});
	
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("account_group", testData.oAccountGroupValidTo);
				mockstar.insertTableData("account_group_text", testData.oAccountGroupTextValidTo);
				mockstar.insertTableData("account_account_group", testData.oAccountRangeValidTo);
				mockstar.insertTableData("account", testData.oAccountTest);
				mockstar.insertTableData("account_text", testData.oAccountTextTest);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});
	
			it('should insert account group, account group texts and account ranges ', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oTestBefore = mockstar.execQuery("select * from {{account_group}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_group_text}}");
				var sObjectName = "Account_Group";
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7
						}],
						"ACCOUNT_GROUP_TEXT_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"LANGUAGE" : "DE",
							"ACCOUNT_GROUP_DESCRIPTION" : "DE Test 700"
						},{
							"ACCOUNT_GROUP_ID" : 700,
							"LANGUAGE" : "EN",
							"ACCOUNT_GROUP_DESCRIPTION" : "EN Test 700"
						}],
						"ACCOUNT_RANGES_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"FROM_ACCOUNT_ID" : "ACR1",
							"TO_ACCOUNT_ID" : "ACR2"
						}]
				};
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				var oTest = mockstar.execQuery("select * from {{account_group}}");
				var oTestText = mockstar.execQuery("select * from {{account_group_text}}");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oTest.columns.ACCOUNT_GROUP_ID.rows.length).toBe(oTestBefore.columns.ACCOUNT_GROUP_ID.rows.length + 1);
				expect(oTestText.columns.ACCOUNT_GROUP_ID.rows.length).toBe(oTestTextBefore.columns.ACCOUNT_GROUP_ID.rows.length + 2);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.ACCOUNT_GROUP_TEXT_ENTITIES[0]._VALID_FROM);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_ENTITIES[0]._VALID_FROM).toBe(oReturnedObject.entities.ACCOUNT_RANGES_ENTITIES[0]._VALID_FROM);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for an account group that does not exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Account_Group";
				var oBatchItem = { 
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7
						}],
						"ACCOUNT_GROUP_TEXT_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 705,
							"LANGUAGE" : "DE",
							"ACCOUNT_GROUP_DESCRIPTION" : "DE Test 700"
						},{
							"ACCOUNT_GROUP_ID" : 705,
							"LANGUAGE": "EN",
							"ACCOUNT_GROUP_DESCRIPTION" : "EN Test 700"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
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
				var sObjectName = "Account_Group";
				var oBatchItem = { 
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CCC",
							"COST_PORTION" : 7
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
				expect(oReturnedObject.errors[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert an account group that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Account_Group";
				var oBatchItem = { 
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 701,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert an account group text that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Account_Group";
				var oBatchItem = { 
						"ACCOUNT_GROUP_TEXT_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 701,
							"LANGUAGE" : "DE",
							"ACCOUNT_GROUP_DESCRIPTION" : "DE Test 701"
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert an account group for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Account_Group";
				var oBatchItem = { 
						"ACCOUNT_GROUP_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7
						}]			                    
				};			
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
	            expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("ACCOUNT_GROUP_ID");
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
		});
	
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("account_group", testData.oAccountGroupTest);
				mockstar.insertTableData("account_group_text", testData.oAccountGroupTextTest);
				mockstar.insertTableData("account_account_group", oAccountRangeValidTo);
				mockstar.insertTableData("account", testData.oAccountTest);
				mockstar.insertTableData("account_text", testData.oAccountTextTest);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("lock_table", oLock);
				mockstar.initializeData();
			});
	
			it('should return updated entities for account group and account group texts', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oTestBefore = mockstar.execQuery("select * from {{account_group}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_group_text}}");
				var sObjectName = "Account_Group";
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7,
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z",
							"_SOURCE" : 1,
							"_CREATED_BY" : userId
						}],
						"ACCOUNT_GROUP_TEXT_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"LANGUAGE" : "DE",
							"ACCOUNT_GROUP_DESCRIPTION" : "DE Test 700 updated",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z",
							"_SOURCE" : 1,
							"_CREATED_BY" : userId
						},{
							"ACCOUNT_GROUP_ID" : 700,
							"LANGUAGE" : "EN",
							"ACCOUNT_GROUP_DESCRIPTION" : "EN Test 700 updated",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z",
							"_SOURCE" : 1,
							"_CREATED_BY" : userId
						}]
				};
	
				// act
				var oLock = mockstar.execQuery("select * from {{lock_table}}");
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				var oTest = mockstar.execQuery("select * from {{account_group}}");
				var oTestText = mockstar.execQuery("select * from {{account_group_text}}");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oTest.columns.ACCOUNT_GROUP_ID.rows.length).toBe(oTestBefore.columns.ACCOUNT_GROUP_ID.rows.length + 1);
				expect(oTestText.columns.ACCOUNT_GROUP_ID.rows.length).toBe(oTestTextBefore.columns.ACCOUNT_GROUP_ID.rows.length + 2);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update an account group for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oTestBefore = mockstar.execQuery("select * from {{account_group}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_group_text}}");
				var sObjectName = "Account_Group";
				var oBatchItem = {
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7
						}]
				};
	
				// act
				var oLock = mockstar.execQuery("select * from {{lock_table}}");
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				var oTest = mockstar.execQuery("select * from {{account_group}}");
				var oTestText = mockstar.execQuery("select * from {{account_group_text}}");
				expect(oReturnedObject.hasErrors).toBe(true);
	            expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
		    it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update an account group text for which mandatory fields are missing', function() {
				// arrange
		    	var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oTestBefore = mockstar.execQuery("select * from {{account_group}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_group_text}}");
				var sObjectName = "Account_Group";
				var oBatchItem = {
						"ACCOUNT_GROUP_TEXT_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"ACCOUNT_GROUP_DESCRIPTION" : "DE Test 700 updated"
						}]
				};
	
				// act
				var oLock = mockstar.execQuery("select * from {{lock_table}}");
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				var oTest = mockstar.execQuery("select * from {{account_group}}");
				var oTestText = mockstar.execQuery("select * from {{account_group_text}}");
				expect(oReturnedObject.hasErrors).toBe(true);
	            expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("LANGUAGE");
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an account group and the account group is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Account_Group";
				var oBatchItem = { 
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 755,
							"CONTROLLING_AREA_ID" : "#CA1",
							"COST_PORTION" : 7,
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]	
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			    expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an account group text and the account group text is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Account_Group";
				var oBatchItem = { 
						"ACCOUNT_GROUP_TEXT_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"LANGUAGE": "DE",
							"ACCOUNT_GROUP_DESCRIPTION" : "DE Test 700",
							"_VALID_FROM" : "2015-01-02T00:00:00.000Z"
						},{
							"ACCOUNT_GROUP_ID" : 700,
							"LANGUAGE" : "EN",
							"ACCOUNT_GROUP_DESCRIPTION" : "EN Test 700",
							"_VALID_FROM" : "2015-01-02T00:00:00.000Z"
						}]	
				};			
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				// assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
				expect(oReturnedObject.errors[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[1].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
	
			it('should deactivate the active account ranges and create the ones on the request', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var oTesta = mockstar.execQuery("select * from {{account_account_group}} WHERE ACCOUNT_GROUP_ID = '700' and _VALID_TO is not null");
				var sObjectName = "Account_Group";
	
				var oBatchItem = { 
						"ACCOUNT_GROUP_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"CONTROLLING_AREA_ID" : "#CA1",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z",
							"_SOURCE" : 1,
							"_CREATED_BY" : userId
						}],
						"ACCOUNT_RANGES_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"FROM_ACCOUNT_ID": 10000,
							"TO_ACCOUNT_ID": 11000
						},{
							"ACCOUNT_GROUP_ID" : 700,
							"FROM_ACCOUNT_ID": 20000,
							"TO_ACCOUNT_ID": 21000
						}]
				};
	
				//act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				var oTestb = mockstar.execQuery("select * from {{account_account_group}} WHERE ACCOUNT_GROUP_ID = '700' and _VALID_TO is null");
				var oTestc = mockstar.execQuery("select * from {{account_account_group}} WHERE ACCOUNT_GROUP_ID = '700' and _VALID_TO is not null AND _VALID_TO < '2015-09-01T00:00:00Z'");
				expect(oTestb.columns.ACCOUNT_GROUP_ID.rows.length).toBe(2);
				expect(oTestc).toEqual(oTesta);
				expect(oReturnedObject.hasErrors).toBe(false);
			});	
			
			it('should return all text entities for account group texts and account group', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Account_Group";
				var oBatchItem = {
						"ACCOUNT_GROUP_TEXT_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"LANGUAGE" : "DE",
							"ACCOUNT_GROUP_DESCRIPTION" : "DE Test 700 updated",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z",
							"_SOURCE" : 1,
							"_CREATED_BY" : userId
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(2);
			});
			
			it('should return all text entities for account group texts having the same value for VALID_FROM', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Account_Group";
				var oBatchItem = {
						"ACCOUNT_GROUP_TEXT_ENTITIES" : [{
							"ACCOUNT_GROUP_ID" : 700,
							"LANGUAGE" : "DE",
							"ACCOUNT_GROUP_DESCRIPTION" : "DE Test 700 updated",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z",
							"_SOURCE" : 1,
							"_CREATED_BY" : userId
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				var oTestAfterText = mockstar.execQuery("select * from {{account_group_text}}");
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_ENTITIES[0].ACCOUNT_GROUP_ID).toBe(oTestAfterText.columns.ACCOUNT_GROUP_ID.rows[5]);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_TEXT_ENTITIES[0]._VALID_FROM).toEqual(oTestAfterText.columns._VALID_FROM.rows[5]);
				expect(oReturnedObject.entities.ACCOUNT_GROUP_TEXT_ENTITIES[1]._VALID_FROM).toEqual(oTestAfterText.columns._VALID_FROM.rows[5]);
			});
		});
	}).addTags(["Administration_NoCF_Integration"]);
}