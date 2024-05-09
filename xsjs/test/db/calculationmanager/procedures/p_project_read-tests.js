/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;
var InstancePrivileges = require("../../../../lib/xs/authorization/authorization-manager").Privileges;

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('p_project_read', function() {

		var testPackage = $.session.getUsername().toLowerCase();
		var mockstar = null;
		// TestData
		var sSessionLanguage = "DE";
		var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON(); //"2011-08-20";
        var sComponentSplitId = "1";
		var sTestUser = $.session.getUsername();
		const sDefaultPriceStrategy = "PLC_STANDARD";
		
		var oProjectTestData={
		"PROJECT_ID":				["PR1",						"PR2"],
		"ENTITY_ID": 				[101,                       102],
		"REFERENCE_PROJECT_ID":		["0",						"0"],
		"PROJECT_NAME":				["Prj 1",					"Prj 2"],
		"PROJECT_RESPONSIBLE":		[sTestUser,					sTestUser],
		"CONTROLLING_AREA_ID":		[testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3], testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3]],
		"CUSTOMER_ID":				['C1',						'C1'],
		"SALES_DOCUMENT":			["SD1",						"SD1"],
		"SALES_PRICE":				['20.0000000',				'10.0000000'],
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
		"CREATED_ON":				[sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
		"CREATED_BY":		[sTestUser, 				sTestUser],
		"LAST_MODIFIED_ON":			[sExpectedDateWithoutTime,	sExpectedDateWithoutTime],
		"LAST_MODIFIED_BY":	        [sTestUser, 				sTestUser],
        "MATERIAL_PRICE_STRATEGY_ID":[sDefaultPriceStrategy,            sDefaultPriceStrategy],
        "ACTIVITY_PRICE_STRATEGY_ID":[sDefaultPriceStrategy,            sDefaultPriceStrategy]
		}
		var oFoldersTestData = {
			"ENTITY_ID":               [4,                                        5,                          6],
			"FOLDER_NAME":             ["SAP Example: Folder 1","SAP Example: Folder 2","SAP Example: Folder 3"],
			"CREATED_BY":              [sTestUser,                        sTestUser,                  sTestUser],
			"MODIFIED_BY":             [sTestUser,                        sTestUser,                  sTestUser],
			"CREATED_ON":              [sExpectedDateWithoutTime,sExpectedDateWithoutTime,sExpectedDateWithoutTime],
			"MODIFIED_ON":             [sExpectedDateWithoutTime,sExpectedDateWithoutTime,sExpectedDateWithoutTime]
		}
	
		var oEntityRelationTestData = {
				"ENTITY_ID" : [4, 5, 6, 7, 8, 101, 102],
				"PARENT_ENTITY_ID":[null, 4, 4, 4, 5, 4, null],
				"ENTITY_TYPE": ['F', 'F', 'F', 'P', 'P', 'P', 'P']
		}

		beforeOnce(function() {
			mockstar = new MockstarFacade({ // Initialize Mockstar
				testmodel: "sap.plc.db.calculationmanager.procedures/p_project_read",
				substituteViews : {
					entity_relation_view:{
						name: 'sap.plc.db.views::entity_relation_view',
						testTable: 'sap.plc.db.views::entity_relation_view'
					} 	
				},
				substituteTables: // substitute all used tables in the procedure or view
				{
					authorization : {
						name : 'sap.plc.db::auth.t_auth_project',
						data : {
							PROJECT_ID   : [oProjectTestData.PROJECT_ID[0], oProjectTestData.PROJECT_ID[1]],
							USER_ID      : [sTestUser, sTestUser],
							PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ]
						}
					},
					project: {
						name: "sap.plc.db::basis.t_project",
						data: oProjectTestData
					},
					folder: {
						name: 'sap.plc.db::basis.t_folder',
						data: oFoldersTestData
					},
					entity_relation: {
						name: 'sap.plc.db::basis.t_entity_relation',
						data: oEntityRelationTestData
					},
					calculation: {
						name: "sap.plc.db::basis.t_calculation",
						data: testData.oCalculationTestData
					},
                    calculation_version: {
                        name: "sap.plc.db::basis.t_calculation_version",
                        data: testData.oCalculationVersionTestData
                    },					
					document: {
						name: "sap.plc.db::basis.t_document"
					},
					document_type: {
						name: "sap.plc.db::basis.t_document_type"
					},
					document_status: {
						name: "sap.plc.db::basis.t_document_status"
					},							
					component_split: {
						name: "sap.plc.db::basis.t_component_split",
						data: testData.oComponentSplitTest
					},
					component_split__text: {
						name: "sap.plc.db::basis.t_component_split__text"
					},
					component_split_account_group: {
						name: "sap.plc.db::basis.t_component_split_account_group"
					},
					costing_sheet: {
						name: "sap.plc.db::basis.t_costing_sheet",
						data: testData.oCostingSheetTestData
					},
					costing_sheet__text: {
						name: "sap.plc.db::basis.t_costing_sheet__text"
					},
					account_group__text: {
						name: "sap.plc.db::basis.t_account_group__text"
					},
					costing_sheet_row: {
						name: "sap.plc.db::basis.t_costing_sheet_row"
					},
					costing_sheet_row__text: {
						name: "sap.plc.db::basis.t_costing_sheet_row__text"
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
					costing_sheet_row_dependencies: {
						name: "sap.plc.db::basis.t_costing_sheet_row_dependencies"
					},
					account_group: {
						name: "sap.plc.db::basis.t_account_group"
					},
					work_center: {
						name: "sap.plc.db::basis.t_work_center"
					},
					process: {
						name: "sap.plc.db::basis.t_process"
					},
					overhead_group: {
						name: "sap.plc.db::basis.t_overhead_group"
					},		
					overhead_group__text: {
						name: "sap.plc.db::basis.t_overhead_group__text"
					},		
					plant: {
						name: "sap.plc.db::basis.t_plant",
						data: testData.oPlantTestDataPlc
					},
					cost_center: {
						name: "sap.plc.db::basis.t_cost_center"
					},
					profit_center: {
						name: "sap.plc.db::basis.t_profit_center",
						data: testData.oProfitCenterTestDataPlc
					},
					activity_type: {
						name: "sap.plc.db::basis.t_activity_type"
					},
					account: {
						name: "sap.plc.db::basis.t_account"
					},
					company_code: {
						name: "sap.plc.db::basis.t_company_code",
						data: testData.oCompanyCodeTestDataPlc
					},
					controlling_area: {
						name: "sap.plc.db::basis.t_controlling_area",
						data: testData.oControllingAreaTestDataPlc
					},
					business_area: {
						name: "sap.plc.db::basis.t_business_area",
						data: testData.oBusinessAreaTestDataPlc
					},
					design_office: {
						name: "sap.plc.db::basis.t_design_office"
					},
					design_office__text: {
						name: "sap.plc.db::basis.t_design_office__text"
					},				        
					material: {
						name: "sap.plc.db::basis.t_material"
					},
					material_group: {
						name: "sap.plc.db::basis.t_material_group"
					},
					material_plant: {
						name: "sap.plc.db::basis.t_material_plant"
					},
					material_type: {
						name: "sap.plc.db::basis.t_material_type"
					},
					valuation_class: {
						name:"sap.plc.db::basis.t_valuation_class"
					},
					valuation_class__text: {
						name:"sap.plc.db::basis.t_valuation_class__text"
					},				        
					vendor: {
						name: "sap.plc.db::basis.t_vendor"
					},
					customer: {
						name: "sap.plc.db::basis.t_customer",
						data: testData.oCustomerTestDataPlc
					}
				}
			});
		});
		
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			mockstar.initializeData();
		});

		afterOnce(function() {
			mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
		});

		afterEach(function() {  });

		describe('all projects (project_id is empty)', function() {	
		    
			it('should read all projects and count the number of calculations in each project -> values returned', function() {
				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, '', '', 10, '', null, null, null, null, null, null,null, null, null, null);

				// assert
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
	
				var oExpectedProjects = _.extend(_.clone(oProjectTestData), {"CALCULATION_NO": [2, 0], "PATH" : ["4/101", "102"]});
				expect(resultProjects).toMatchData(oExpectedProjects, ["PROJECT_ID"]);
			});
			
            it('should return number of calculations only for saved calculations', function() {
                // arrange - insert new calculation that is not saved, i.e. it has no saved calculation versions
                 mockstar.insertTableData("calculation",{
                     "CALCULATION_ID" : [ 5079 ],
                     "PROJECT_ID" : [ oProjectTestData.PROJECT_ID[1] ],
                     "CALCULATION_NAME" : [ "New calculation" ],
                     "CREATED_ON" : [ testData.sExpectedDate ],
                     "CREATED_BY" : [ sTestUser ],
                     "LAST_MODIFIED_ON" : [ testData.sExpectedDate ],
                     "LAST_MODIFIED_BY" : [ sTestUser ]
                 }); 
                 
                // act
                const result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, '', '', 10, '', null, null, null, null, null, null,null, null, null, null);

                // assert
                const resultProjects = mockstar_helpers.convertResultToArray(result[0]);
    
                const oExpectedProjects = _.extend(_.clone(oProjectTestData), {"CALCULATION_NO": [2, 0], "PATH" : ["4/101", "102"]});
                expect(resultProjects).toMatchData(oExpectedProjects, ["PROJECT_ID"]);
            });
	
			it('should return the customer objects referenced in projects', function() {				
				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, '', '', 10, '', null, null, null, null, null, null,null, null, null, null);
	
				// assert
				var oReturnedCustomer = mockstar_helpers.convertResultToArray(result[1]);
	
				expect(oReturnedCustomer.CUSTOMER_ID[0]).toBe(testData.oCustomerTestDataPlc["CUSTOMER_ID"][0]);
				
			});
			
			it('should return the controlling area objects referenced in projects', function() {				
				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, '', '', 10, '', null, null, null, null, null, null,null, null, null, null);
	
				// assert
				var oReturnedControllingArea = mockstar_helpers.convertResultToArray(result[2]);
	
				expect(oReturnedControllingArea.CONTROLLING_AREA_ID[0]).toBe(testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3]);
				
			});
		
		});
		
		describe('one project (project_id is given)', function() {
		    
			it('should read one project if project_id is given -> project properties returned', function() {
				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, oProjectTestData.PROJECT_ID[0], '', 10, '', null, null, null, null, null, null,null, null, null, null);
				// assert				
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
				var oExpectedProject = _.extend(mockstar_helpers.convertToObject(oProjectTestData, 0), {"CALCULATION_NO": [2], "PATH" : ["4/101"]});
	
				expect(resultProjects).toMatchData(oExpectedProject, ["PROJECT_ID"]);
			});
			
			it('should read one project if project_id is given -> project-relevant master data returned', function() {
				// act
				var procedure = mockstar.loadProcedure();
				var result = procedure(sSessionLanguage, sTestUser, testData.sExpectedDate,oProjectTestData.PROJECT_ID[0], '', 10, '');
				
				// assert				
				expect(Array.slice(result.OT_CONTROLLING_AREA)).toMatchData({
					CONTROLLING_AREA_ID: 			[  testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3]],
					CONTROLLING_AREA_CURRENCY_ID: 	[  testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_CURRENCY_ID[3]]
				}, ["CONTROLLING_AREA_ID"]);

				expect(Array.slice(result.OT_CUSTOMER)).toMatchData({
					CUSTOMER_ID: 			[  testData.oCustomerTestDataPlc.CUSTOMER_ID[0]]
				}, ["CUSTOMER_ID"]);
				
				expect(Array.slice(result.OT_COMPANY_CODE)).toMatchData({
					COMPANY_CODE_ID: 			[  testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0]]
				}, ["COMPANY_CODE_ID"]);
				
				expect(Array.slice(result.OT_PLANT)).toMatchData({
					PLANT_ID: 			[  testData.oPlantTestDataPlc.PLANT_ID[0]]
				}, ["PLANT_ID"]);
				
				expect(Array.slice(result.OT_BUSINESS_AREA)).toMatchData({
					BUSINESS_AREA_ID: 			[  testData.oBusinessAreaTestDataPlc.BUSINESS_AREA_ID[0]]
				}, ["BUSINESS_AREA_ID"]);
				
				expect(Array.slice(result.OT_PROFIT_CENTER)).toMatchData({
					PROFIT_CENTER_ID: 			[  testData.oProfitCenterTestDataPlc.PROFIT_CENTER_ID[3]]
				}, ["PROFIT_CENTER_ID"]);
				
				expect(Array.slice(result.OT_COSTING_SHEET)).toMatchData({
					COSTING_SHEET_ID: 			[  testData.oCostingSheetTestData.COSTING_SHEET_ID[0]]
				}, ["COSTING_SHEET_ID"]);			
				
				expect(Array.slice(result.OT_COMPONENT_SPLIT)).toMatchData({
					COMPONENT_SPLIT_ID: 			[  testData.oComponentSplitTest.COMPONENT_SPLIT_ID[0]]
				}, ["COMPONENT_SPLIT_ID"]);		
				
			});
		});
		
		describe('projects with instanced based privileges for users', function() {	
		    
			it('should read all projects for which the user has read or higher privilege and count the number of calculations in each project -> values returned', function() {
			    //arrange
				mockstar.clearTable("authorization");
			    mockstar.insertTableData("authorization",{
			    	PROJECT_ID   : [oProjectTestData.PROJECT_ID[0]],
					USER_ID      : [sTestUser],
					PRIVILEGE    : [InstancePrivileges.READ]
                });
				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, '', '', 10, '', null, null, null, null, null, null,null, null, null, null);

				// assert
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
	
				var oExpectedProjects = _.extend(mockstar_helpers.convertToObject(oProjectTestData, 0), {"CALCULATION_NO": [2], "PATH" : ["4/101"]});
				expect(resultProjects).toMatchData(oExpectedProjects, ["PROJECT_ID"]);
			});
			
			it('should return empty list if the user has no read authorization for the project with the given id', function() {
			    //arrange
				mockstar.clearTable("authorization");
			    mockstar.insertTableData("authorization",{
			    	PROJECT_ID   : [oProjectTestData.PROJECT_ID[1]],
					USER_ID      : [sTestUser],
					PRIVILEGE    : [InstancePrivileges.READ]
                });
				// act
	            var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, oProjectTestData.PROJECT_ID[0], '', 10, '', null, null, null, null, null, null,null, null, null, null);
			
				// assert
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
				expect(resultProjects.PROJECT_ID.length).toBe(0);
			});
		});
		
		describe('projects inside folders', function() {
			
			var project_auth = {
				PROJECT_ID   : [testData.oProjectTestData1.PROJECT_ID[0], testData.oProjectTestData1.PROJECT_ID[1]],
				USER_ID      : [sTestUser, sTestUser],
				PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ]
			}

			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.initializeData();
				mockstar.insertTableData("project", testData.oProjectTestData1);
				mockstar.insertTableData("authorization", project_auth);
			});
		    
			it('should return all projects inside a folder if folder_id is given -> project properties returned', function() {
				//arrange
				var iFolderId = 4;
				var aExpected =  mockstar.execQuery(`select PROJECT_ID from {{project}} proj inner join {{entity_relation}} entity on  
								proj.ENTITY_ID = entity.ENTITY_ID where entity.PARENT_ENTITY_ID = ${iFolderId} order by PROJECT_ID`);
				var aExpectedPaths = ["4/101", "4/7"];

				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, '', '', 10, '', iFolderId, null, null, null, null, null, null,null, null, null, null);
				// assert				
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
				expect(resultProjects.PROJECT_ID.length).toBe(2);
				expect(resultProjects.PROJECT_ID).toEqual(aExpected.columns.PROJECT_ID.rows);
				expect(resultProjects.PATH).toEqual(aExpectedPaths);
			});
			
			it('should not return any project if the folder id does not contain any project', function() {
				//arrange
				var iFolderId = 100;
				var aExpected =  mockstar.execQuery(`select PROJECT_ID from {{project}} proj inner join {{entity_relation}} entity on  
								proj.ENTITY_ID = entity.ENTITY_ID where entity.PARENT_ENTITY_ID = ${iFolderId} order by PROJECT_ID`);

				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, '', '', 10, '', iFolderId, null, null, null, null, null, null,null, null, null, null);
				// assert				
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
				expect(resultProjects.PROJECT_ID.length).toBe(0);
				expect(resultProjects.PROJECT_ID).toEqual(aExpected.columns.PROJECT_ID.rows);
			});

			it('should return all projects inside the root folder', function() {
				//arrange
				var iFolderId = 0;
				var aExpected =  mockstar.execQuery(`select PROJECT_ID from {{project}} proj inner join {{entity_relation}} entity on  
								proj.ENTITY_ID = entity.ENTITY_ID where entity.PARENT_ENTITY_ID is null order by PROJECT_ID`);

				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, '', '', 10, '', iFolderId, null, null, null, null, null, null,null, null, null, null);
				// assert				
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
				expect(resultProjects.PROJECT_ID.length).toBe(1);
				expect(resultProjects.PROJECT_ID).toEqual(aExpected.columns.PROJECT_ID.rows);
			});

			it('should read one project if project_id is given and project is inside the specified folder -> project properties returned', function() {
				//arrange
				var iFolderId = 4;
				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, oProjectTestData.PROJECT_ID[0], '', 10, '',  iFolderId, null, null, null, null, null, null,null, null, null, null);
				// assert				
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
				var oExpectedProject = _.extend(mockstar_helpers.convertToObject(oProjectTestData, 0), {"CALCULATION_NO": [2], "PATH": ["4/101"]});
	
				expect(resultProjects).toMatchData(oExpectedProject, ["PROJECT_ID"]);
			});

			it('should not return the project if project_id is given but it is not inside the specified folder', function() {
				//arrange
				var iFolderId = 5;
				var aExpected =  mockstar.execQuery(`select PROJECT_ID from {{project}} proj inner join {{entity_relation}} entity on  
								proj.ENTITY_ID = entity.ENTITY_ID where proj.PROJECT_ID = '${oProjectTestData.PROJECT_ID[0]}'  and entity.PARENT_ENTITY_ID = ${iFolderId} order by PROJECT_ID`);
				// act
				var result = mockstar.call(sSessionLanguage, sTestUser, testData.sExpectedDate, oProjectTestData.PROJECT_ID[0], '', 10, '', iFolderId, null, null, null, null, null, null,null, null, null, null);
				// assert				
				var resultProjects = mockstar_helpers.convertResultToArray(result[0]);
				expect(resultProjects.PROJECT_ID.length).toBe(0);
				expect(resultProjects.PROJECT_ID).toEqual(aExpected.columns.PROJECT_ID.rows);
			});
		});
		
	}).addTags(["All_Unit_Tests"]);
}