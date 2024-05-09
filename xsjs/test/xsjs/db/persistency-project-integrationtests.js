const _ = require("lodash");
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../testtools/mockstar_helpers");
const PersistencyImport = $.import("xs.db", "persistency");
const Persistency = PersistencyImport.Persistency;
const Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
const ProjectImport = $.import("xs.db", "persistency-project");
const mTableNames = ProjectImport.Tables;
const MessageLibrary = require("../../../lib/xs/util/message");
const messageCode = MessageLibrary.Code;

const Constants = require("../../../lib/xs/util/constants");
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;

const testData = require("../../testdata/testdata").data;
const testHelpers = require("../../testtools/test_helpers");
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

const iCalculationId = testData.iCalculationId;
const sExpectedDate = testData.sExpectedDate;
const sTestUser = testData.sTestUser;

if (jasmine.plcTestRunParameters.mode === 'all') {
	describe("xsjs.db.persistency-project-integrationtests", function() {

		describe("remove", function() {
			var oMockstar = null;
			var persistency = null;

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
                        activity_price : Resources["Activity_Price"].dbobjects.plcTable,
                        activity_price_ext : Resources["Activity_Price"].dbobjects.plcExtensionTable,
                        activity_price_first_version : "sap.plc.db::basis.t_activity_price__first_version",
                        material_price : Resources["Material_Price"].dbobjects.plcTable,
                        material_price_ext : Resources["Material_Price"].dbobjects.plcExtensionTable,
                        material_price_first_version : "sap.plc.db::basis.t_activity_price__first_version",
                        price_component : "sap.plc.db::basis.t_price_component",
						price : Resources["Material_Price"].dbobjects.plcTable,
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						authorization : {
							name : mTableNames.authorization,
							data : {
								PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[0]],
								USER_ID      : [testData.sTestUser, testData.sSecondUser],
								PRIVILEGE    : [InstancePrivileges.ADMINISTRATE, InstancePrivileges.CREATE_EDIT]
							}
						},
						entity_relation : {
							name: mTableNames.entity_relation,
							data: testData.oEntityRelationTestData
						},
						project_lifecycle_period_type : {
							name: 'sap.plc.db::basis.t_project_lifecycle_period_type',
							data: testData.oProjectLifecyclePeriodTypeTestData
						},
						project_monthly_lifecycle_period : {
							name: 'sap.plc.db::basis.t_project_monthly_lifecycle_period',
							data: testData.oProjectMonthlyLifecyclePeriodTestData
						},
						project_lifecycle_period_quantity_value : {
							name: 'sap.plc.db::basis.t_project_lifecycle_period_quantity_value',
							data: testData.oProjectLifecyclePeriodQuantityValueTestData
						},
						project_lifecycle_configuration : {
							name: 'sap.plc.db::basis.t_project_lifecycle_configuration',
							data: testData.oProjectLifecycleConfigurationTestData
						},
						one_time_cost_lifecycle_value : {
							name: 'sap.plc.db::basis.t_one_time_cost_lifecycle_value',
							data: testData.oOneTimeCostLifecycleValueTestData
						},
						one_time_product_cost : {
							name: 'sap.plc.db::basis.t_one_time_product_cost',
							data: testData.oOneTimeProductCostTestData
						},
						one_time_project_cost : {
							name: 'sap.plc.db::basis.t_one_time_project_cost',
							data: testData.oOneTimeProjectCostTestData
						},
						calculation : {
							name: 'sap.plc.db::basis.t_calculation',
							data: testData.oCalculationTestData
						}
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
            });
            
			
			it("should remove a project, all Project assosicated Activity Prices and Material Prices, and all instance-based privileges of the project", function() {
                // arrange
                var oActivityPriceTestDataClone = new TestDataUtility(testData.oActivityPriceTestDataPlc).getObjects();
				var aProjectsPlcActivityPrice = [ "PR1", "PR1", "PR1"];
				_.each(oActivityPriceTestDataClone,function(oPrice,iIndex){
					oPrice.PROJECT_ID = aProjectsPlcActivityPrice[iIndex];
				});
                oMockstar.insertTableData("activity_price", oActivityPriceTestDataClone);

                var oActivityPriceFirstVersionTestDataClone = new TestDataUtility(testData.oActivityPriceFirstVersionTestDataPlc).getObjects();
                oMockstar.insertTableData("activity_price_first_version", oActivityPriceFirstVersionTestDataClone);

                var oMaterialPriceTestDataClone = new TestDataUtility(testData.oMaterialPriceTestDataPlc).getObjects();
				var aProjectsPlcMaterialPrice = [ "PR1", "PR1", "PR1", "PR1" ];
				_.each(oMaterialPriceTestDataClone,function(oPrice,iIndex){
                    oPrice.PROJECT_ID = aProjectsPlcMaterialPrice[iIndex];
                });
                oMockstar.insertTableData("material_price", oMaterialPriceTestDataClone);

                var oMaterialPriceFirstVersionTestDataClone = new TestDataUtility(testData.oMaterialPriceFirstVersionTestDataPlc).getObjects();
                oMockstar.insertTableData("material_price_first_version", oMaterialPriceFirstVersionTestDataClone);

                var oPriceComponentTestDataPlcClone = new TestDataUtility(testData.oPriceComponentTestDataPlc).getObjects();
                oMockstar.insertTableData("price_component", oPriceComponentTestDataPlcClone);
                
                var iOriginalCount_Activity_Price_EXT=0;
                var iOriginalCount_Material_Price_EXT=0;
                if(jasmine.plcTestRunParameters.generatedFields === true){   
                    var oMaterialPriceExtTestDataClone = new TestDataUtility(testData.oMaterialPriceExtTestDataPlc).getObjects();
                    oMockstar.insertTableData("material_price_ext", oMaterialPriceExtTestDataClone);
                    var oActivityPriceExtTestDataClone = new TestDataUtility(testData.oActivityPriceExtTestDataPlc).getObjects();
                    oMockstar.insertTableData("activity_price_ext", oActivityPriceExtTestDataClone);
                    iOriginalCount_Activity_Price_EXT = mockstarHelpers.getRowCount(oMockstar, "activity_price_ext");
                    iOriginalCount_Material_Price_EXT = mockstarHelpers.getRowCount(oMockstar, "material_price_ext");
                }
                var iOriginalCount_Activity_Price = mockstarHelpers.getRowCount(oMockstar, "activity_price");
                var iOriginalCount_Material_Price = mockstarHelpers.getRowCount(oMockstar, "material_price");
				var iOriginalCount_Project = mockstarHelpers.getRowCount(oMockstar, "project");
                var iOriginalCount_Auth = mockstarHelpers.getRowCount(oMockstar, "authorization");
                var iOriginalCount_Activity_Price_first = mockstarHelpers.getRowCount(oMockstar, "activity_price_first_version");
                var iOriginalCount_Material_Price_first = mockstarHelpers.getRowCount(oMockstar, "material_price_first_version");
                var iOriginalCount_Price_Component = mockstarHelpers.getRowCount(oMockstar, "price_component");
            
				// act
				var iAffectedRows = persistency.Project.remove(testData.oProjectTestData.PROJECT_ID[0]);
				
				// assert
				expect(iOriginalCount_Project).toBe(3);
				expect(mockstarHelpers.getRowCount(oMockstar, "project")).toBe(iOriginalCount_Project - 1);
				expect(iOriginalCount_Auth).toBe(2);
                expect(mockstarHelpers.getRowCount(oMockstar, "authorization")).toBe(0);
                expect(iOriginalCount_Activity_Price).toBe(3);
                expect(mockstarHelpers.getRowCount(oMockstar, "activity_price")).toBe(0);
                expect(iOriginalCount_Material_Price).toBe(4);
                expect(mockstarHelpers.getRowCount(oMockstar, "material_price")).toBe(0);
                expect(iOriginalCount_Activity_Price_first).toBe(7);
                expect(mockstarHelpers.getRowCount(oMockstar, "activity_price_first_version")).toBe(4);
                expect(iOriginalCount_Material_Price_first).toBe(7);
                expect(mockstarHelpers.getRowCount(oMockstar, "material_price_first_version")).toBe(4);
                expect(iOriginalCount_Price_Component).toBe(4);
                expect(mockstarHelpers.getRowCount(oMockstar, "price_component")).toBe(2);
                if(jasmine.plcTestRunParameters.generatedFields === true){   
                    expect(iOriginalCount_Material_Price_EXT).toBe(3);
                    expect(mockstarHelpers.getRowCount(oMockstar, "material_price_ext")).toBe(0);
                    expect(iOriginalCount_Activity_Price_EXT).toBe(2);
                    expect(mockstarHelpers.getRowCount(oMockstar, "activity_price_ext")).toBe(0);
                }
				const oResultCount = oMockstar.execQuery(`select count(ENTITY_ID) as count from {{entity_relation}}`);
            	expect(oResultCount.columns.COUNT.rows[0]).toBe(testData.oEntityRelationTestData.ENTITY_ID.length - 1);
				const oResultCount1 = oMockstar.execQuery(`select count(PROJECT_ID) as count from {{project_lifecycle_period_type}}`);
            	expect(oResultCount1.columns.COUNT.rows[0]).toBe(1);
				const oResultCount2 = oMockstar.execQuery(`select count(PROJECT_ID) as count from {{project_lifecycle_configuration}}`);
            	expect(oResultCount2.columns.COUNT.rows[0]).toBe(1);
				const oResultCount3 = oMockstar.execQuery(`select count(PROJECT_ID) as count from {{project_lifecycle_period_quantity_value}}`);
            	expect(oResultCount3.columns.COUNT.rows[0]).toBe(1);
				const oResultCount4 = oMockstar.execQuery(`select count(PROJECT_ID) as count from {{project_monthly_lifecycle_period}}`);
            	expect(oResultCount4.columns.COUNT.rows[0]).toBe(1);
				const oResultCount5 = oMockstar.execQuery(`select count(ONE_TIME_COST_ID) as count from {{one_time_project_cost}}`);
            	expect(oResultCount5.columns.COUNT.rows[0]).toBe(1);
				const oResultCount6 = oMockstar.execQuery(`select count(ONE_TIME_COST_ID) as count from {{one_time_product_cost}}`);
            	expect(oResultCount6.columns.COUNT.rows[0]).toBe(0);
				const oResultCount7 = oMockstar.execQuery(`select count(ONE_TIME_COST_ID) as count from {{one_time_cost_lifecycle_value}}`);
                expect(oResultCount7.columns.COUNT.rows[0]).toBe(0);
			});
		});

		describe("close", function() {

			var oMockstar = null;
			var persistency = null;

			var sProjectId = "PR1";
			var sSessionId = "Session1";

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						open_projects : mTableNames.open_projects						
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should close project (open as writeable) by removing it from open_projects", function() {
				// arrange
				var oOpenProjectsData = {
						SESSION_ID : 	[ sSessionId ],
						PROJECT_ID : 	[ sProjectId ],
						IS_WRITEABLE : 	[ 1 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				persistency.Project.close(sProjectId, sSessionId);

				// assert
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects", "session_id='" + sSessionId + "' and project_id='" + sProjectId + "'")).toBe(0);
			});

			it("should close project (open as read-only) by removing it from open_projects", function() {
				// arrange
				var oOpenProjectsData = {
						SESSION_ID : 	[ sSessionId ],
						PROJECT_ID : 	[ sProjectId ],
						IS_WRITEABLE : 	[ 0 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				persistency.Project.close(sProjectId, sSessionId);

				// assert
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects", "session_id='" + sSessionId + "' and project_id='" + sProjectId + "'")).toBe(0);
			});

			it("should not close another project in same session", function() {
				// arrange
				var oOpenProjectsData = {
						SESSION_ID : 	[ sSessionId, sSessionId ],
						PROJECT_ID : 	[ sProjectId,   "PR_444" ],
						IS_WRITEABLE : 	[ 		   0,          0 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				persistency.Project.close(sProjectId, sSessionId);

				// assert
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects", "session_id='" + sSessionId + "' and project_id='" + oOpenProjectsData.PROJECT_ID[1] + "'")).toBe(1);
			});

			it("should not close same project in another session", function() {
				// arrange
				var oOpenProjectsData = {
						SESSION_ID : 	[ sSessionId, "Session_444" ],
						PROJECT_ID : 	[ sProjectId,   sProjectId ],
						IS_WRITEABLE : 	[ 		   0,          0 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				persistency.Project.close(sProjectId, sSessionId);

				// assert
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects",
						"session_id='" + oOpenProjectsData.SESSION_ID[1] + "' and project_id='" + oOpenProjectsData.PROJECT_ID[1] + "'")).toBe(1);
			});

			it("should not close another project in another session", function() {
				// arrange
				var oOpenProjectsData = {
						SESSION_ID : 	[ sSessionId, "Session_444" ],
						PROJECT_ID : 	[ sProjectId,   "PR_444" ],
						IS_WRITEABLE : 	[ 		   0,          0 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				persistency.Project.close(sProjectId, sSessionId);

				// assert
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects",
						"session_id='" + oOpenProjectsData.SESSION_ID[1] + "' and project_id='" + oOpenProjectsData.PROJECT_ID[1] + "'")).toBe(1);
			});
		});

		describe('create', function() {

			var persistency = null;
			var oMockstar = null;
			var sSessionId = "sessionID";
			var sUserId = $.session.getUsername();

			var aProjectTestData = [ {
				"ENTITY_ID" : 9,
				"PROJECT_ID" : 'PR1',
				"PROJECT_NAME" : 'Project 1',
				"CONTROLLING_AREA_ID": "1",
				"VALUATION_DATE" : testData.sExpectedDate,
				"EXCHANGE_RATE_TYPE_ID" : 'BUY',
				"MATERIAL_PRICE_STRATEGY_ID":    testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
				"ACTIVITY_PRICE_STRATEGY_ID":    testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
			} ];

			beforeOnce(function() {
				oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							testmodel : {
							},
							substituteTables : {
								user_authorization: mTableNames.user_authorization,
								project : mTableNames.project,
								open_projects : mTableNames.open_projects,
								entity_relation : mTableNames.entity_relation,
								project_lifecycle_period_type: "sap.plc.db::basis.t_project_lifecycle_period_type"
							}
						});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
				spyOn(persistency.Project, "getNextSequence");
				persistency.Project.getNextSequence.and.returnValue(1);
			});

			afterEach(() => {
				oMockstar.clearAllTables();
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it('should create project --> db updated', function() {
				// arrange
				var oBodyProject = _.cloneDeep(_.omit(aProjectTestData[0], ["ENTITY_ID"]));
				oBodyProject.PATH = "0";

				// act
				var oResultObject = persistency.Project.create(oBodyProject, sSessionId, sUserId);

				// assert

				// check the object returned
				expect(oResultObject).toBeDefined();
				expect(_.isObject(oResultObject)).toBeTruthy();

				// check the values inserted
				var currentdate = new Date();
				var sProjectId = aProjectTestData[0].PROJECT_ID;
				var oExpected = {
						"PROJECT_ID" : sProjectId,
						"PROJECT_NAME" : aProjectTestData[0].PROJECT_NAME,
						"CREATED_ON": currentdate,
						"CREATED_BY": sUserId,
						"LAST_MODIFIED_ON": currentdate,
						"LAST_MODIFIED_BY": sUserId,
						"EXCHANGE_RATE_TYPE_ID" : aProjectTestData[0].EXCHANGE_RATE_TYPE_ID,
						"MATERIAL_PRICE_STRATEGY_ID":    testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
						"ACTIVITY_PRICE_STRATEGY_ID":    testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]

				};
				var result = oMockstar.execQuery("select * from {{project}} where project_id = '" + sProjectId + "';");
				const resultEntity = oMockstar.execQuery(`select PARENT_ENTITY_ID from {{entity_relation}} where ENTITY_ID = ${result.columns.ENTITY_ID.rows[0]};`);
				testHelpers.compareDbResultWithExpected(result, oExpected, [ ]);
				
				//check if ADMINISTRATE instance-based privilege granted to current user
				var resultAuth = oMockstar.execQuery("select * from {{user_authorization}}");
				var expectedAuthData = [ {
				    "OBJECT_TYPE": 'PROJECT',
					"OBJECT_ID" : oExpected.PROJECT_ID,
					"USER_ID" : sSessionId.toUpperCase(),
					"PRIVILEGE" : InstancePrivileges.ADMINISTRATE
				} ];
				expect(resultAuth).toMatchData(expectedAuthData, [ "OBJECT_TYPE", "OBJECT_ID", "USER_ID", "PRIVILEGE" ]);
				// The parent of the project should be null as the oBodyProject.PATH was not send in the request
				expect(resultEntity.columns.PARENT_ENTITY_ID.rows[0]).toBe(null);
			});

			it('should create lifecycle periods when creating project from Project View', () => {
				// arrange
				let oProjectTestData = aProjectTestData[0];
				oProjectTestData["START_OF_PROJECT"] = '2020-09-01T00:00:00';
				oProjectTestData["END_OF_PROJECT"] = '2023-09-30T00:00:00';
				let sProjectId = oProjectTestData.PROJECT_ID;
				let currentdate = new Date();
				let oBodyProject = _.cloneDeep(_.omit(oProjectTestData, ["ENTITY_ID"]));
				oBodyProject.PATH = "0";

				// act
				let oResultObject = persistency.Project.create(oBodyProject, sSessionId, sUserId);

				// assert
				let oExpected = {
					"PROJECT_ID" : sProjectId,
					"PROJECT_NAME" : oProjectTestData.PROJECT_NAME,
					"CREATED_ON": currentdate,
					"CREATED_BY": sUserId,
					"LAST_MODIFIED_ON": currentdate,
					"LAST_MODIFIED_BY": sUserId,
					"EXCHANGE_RATE_TYPE_ID" : oProjectTestData.EXCHANGE_RATE_TYPE_ID,
					"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
					"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
					"START_OF_PROJECT": '2020-09-01T00:00:00',
					"END_OF_PROJECT": '2023-09-30T00:00:00'
				};	
				let result = oMockstar.execQuery(`select * from {{project}} where project_id = '${sProjectId}';`);
				testHelpers.compareDbResultWithExpected(result, oExpected, [ ]);
				var oResult = oMockstar.execQuery(`select * from {{project_lifecycle_period_type}} where project_id = '${sProjectId}' order by year;`);
				expect(oResult.columns.YEAR.rows).toEqual([2020, 2021, 2022, 2023]);
				expect(oResult.columns.PERIOD_TYPE.rows).toEqual(['YEARLY', 'YEARLY', 'YEARLY', 'YEARLY']);
				expect(oResult.columns.IS_YEAR_SELECTED.rows).toEqual([1, 1, 1, 1]);
			});

			it('should valuation date set to null when no validation date in input', function() {
				// arrange
				var oBodyProject = _.cloneDeep(_.omit(aProjectTestData[0], ["ENTITY_ID"]));
				delete oBodyProject.VALUATION_DATE;
				const iFolderID = 5;
				oBodyProject.PATH = `4/${iFolderID}`;

				// act
				var oResultObject = persistency.Project.create(oBodyProject, sSessionId, sUserId);

				// assert
				// check the values inserted
				var currentdate = new Date();
				var sProjectId = aProjectTestData[0].PROJECT_ID;
				var oExpected = {
						"PROJECT_ID" : sProjectId,
						"PROJECT_NAME" : aProjectTestData[0].PROJECT_NAME,
						"VALUATION_DATE" : null,
						"CREATED_ON": currentdate,
						"CREATED_BY": sUserId,
						"LAST_MODIFIED_ON": currentdate,
						"LAST_MODIFIED_BY": sUserId,
						"MATERIAL_PRICE_STRATEGY_ID":    testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
				        "ACTIVITY_PRICE_STRATEGY_ID":    testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]

				};
				var result = oMockstar.execQuery("select * from {{project}} where project_id = '" + sProjectId + "';");
				testHelpers.compareDbResultWithExpected(result, oExpected, [ ]);
				
				//check if ADMINISTRATE instance-based privilege granted to current user
				var resultAuth = oMockstar.execQuery("select * from {{user_authorization}}");
				var expectedAuthData = [ {
					"OBJECT_TYPE": 'PROJECT',
					"OBJECT_ID" : oExpected.PROJECT_ID,
					"USER_ID" : sSessionId.toUpperCase(),
					"PRIVILEGE" : InstancePrivileges.ADMINISTRATE
				} ];
				const resultEntity = oMockstar.execQuery(`select PARENT_ENTITY_ID from {{entity_relation}} where ENTITY_ID = ${result.columns.ENTITY_ID.rows[0]};`);
				expect(resultAuth).toMatchData(expectedAuthData, [ "OBJECT_TYPE", "OBJECT_ID", "USER_ID", "PRIVILEGE" ]);
				// The parent of the project should be iFolderID (5) as the oBodyProject.PATH was send in the request
				expect(resultEntity.columns.PARENT_ENTITY_ID.rows[0]).toBe(iFolderID);
			});
			
			it('should insert into authorization table for projects the ADMINISTRATE instance-based privilege for the newly created project ', function() {
				// arrange
				var oBodyProject = _.cloneDeep(_.omit(aProjectTestData[0], ["ENTITY_ID"]));
				oBodyProject.PATH = "4/5";

				// act
				var oResultObject = persistency.Project.create(oBodyProject, sSessionId, sUserId);

				// assert
				var resultAuth = oMockstar.execQuery("select * from {{user_authorization}}");
				var expectedAuthData = [ {
					"OBJECT_TYPE": 'PROJECT',
					"OBJECT_ID" : oResultObject.PROJECT_ID,
					"USER_ID" : sSessionId.toUpperCase(),
					"PRIVILEGE" : InstancePrivileges.ADMINISTRATE
				} ];
				expect(resultAuth).toMatchData(expectedAuthData, [ "OBJECT_TYPE", "OBJECT_ID", "USER_ID", "PRIVILEGE" ]);
			});
		});

		describe("isOpenedInSession", function() {

			var oMockstar = null;
			var persistency = null;

			var sProjectId = "PR1";

			var oSessionData = {
					SESSION_ID : [ "INITIAL_SESSION", "INITIAL_SESSION_B" ],
					USER_ID : [ "USER_A", "USER_B" ],
					LANGUAGE : [ "DE", "DE" ],
					LAST_ACTIVITY_TIME : [ testData.sExpectedDate, testData.sExpectedDate ]
			};					

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						session : mTableNames.session,
						open_projects : mTableNames.open_projects						
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();

				oMockstar.insertTableData("session", oSessionData);

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should return false when open_projects is empty", function() {
				// arrange
				sProjectId =  "NewName";

				// act
				var result = persistency.Project.isOpenedInSession(sProjectId, oSessionData.SESSION_ID[0]);

				// assert
				expect(result).toBe(false);
			});

			it("should return true when bCheckWriteable=true and project is opened as writeable by current user", function() {
				// arrange

				var oOpenProjectsData = {
						SESSION_ID : [  oSessionData.SESSION_ID[0] ],
						PROJECT_ID : [ sProjectId ],
						IS_WRITEABLE : [ 1 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				var result = persistency.Project.isOpenedInSession(sProjectId, oSessionData.SESSION_ID[0], true);

				// assert
				expect(result).toBe(true);
			});

			it("should return false when bCheckWriteable=true and project is opened as read-only by current user", function() {
				// arrange

				var oOpenProjectsData = {
						SESSION_ID : [  oSessionData.SESSION_ID[0] ],
						PROJECT_ID : [ sProjectId ],
						IS_WRITEABLE : [ 0 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				var result = persistency.Project.isOpenedInSession(sProjectId, oSessionData.SESSION_ID[0], true);

				// assert
				expect(result).toBe(false);
			});

			it("should return true when bCheckWriteable=false and project is opened as read-only by current user", function() {
				// arrange

				var oOpenProjectsData = {
						SESSION_ID : [  oSessionData.SESSION_ID[0] ],
						PROJECT_ID : [ sProjectId ],
						IS_WRITEABLE : [ 0 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				var result = persistency.Project.isOpenedInSession(sProjectId, oSessionData.SESSION_ID[0], false);

				// assert
				expect(result).toBe(true);
			});

			it("should return false when bCheckWriteable=false and project is opened as writeable by current user", function() {
				// arrange

				var oOpenProjectsData = {
						SESSION_ID : [  oSessionData.SESSION_ID[0] ],
						PROJECT_ID : [ sProjectId ],
						IS_WRITEABLE : [ 1 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				var result = persistency.Project.isOpenedInSession(sProjectId, oSessionData.SESSION_ID[0], false);

				// assert
				expect(result).toBe(false);
			});

			it("should return true when bCheckWriteable is undefined and project is opened", function() {
				// arrange

				var oOpenProjectsData = {
						SESSION_ID : [  oSessionData.SESSION_ID[0] ],
						PROJECT_ID : [ sProjectId ],
						IS_WRITEABLE : [ 1 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				var result = persistency.Project.isOpenedInSession(sProjectId, oSessionData.SESSION_ID[0]);

				// assert
				expect(result).toBe(true);
			});

			it("should return false when project is opened as writeable by another user", function() {
				// arrange

				var oOpenProjectsData = {
						SESSION_ID : [  oSessionData.SESSION_ID[1] ],
						PROJECT_ID : [ sProjectId ],
						IS_WRITEABLE : [ 1 ]
				};
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				// act
				var result = persistency.Project.isOpenedInSession(sProjectId, oSessionData.SESSION_ID[0]);

				// assert
				expect(result).toBe(false);
			});
		});
		
		describe("isLifecycleCalculationRunningForProject", function() {

			var oMockstar = null;
			var persistency = null;

			var sProjectId = "PR1";
			var oTaskData;
		
			
			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						task: 'sap.plc.db::basis.t_task'				
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				
				// Create default test data for task and default project
				oTaskData = new TestDataUtility(testData.oTask).getObject(0);
				oTaskData.PARAMETERS = JSON.stringify({
					PROJECT_ID : sProjectId
				});

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should return true when project has 'active' task", function() {
				// arrange
				oTaskData.STATUS = 'active';
				oMockstar.insertTableData("task", oTaskData);

				// act
				let result = persistency.Project.isLifecycleCalculationRunningForProject(sProjectId);
				// assert
				expect(result).toBe(true);
			});
			
			it("should return true when project has 'inactive' task", function() {
				// arrange
				oTaskData.STATUS = 'inactive';
				oMockstar.insertTableData("task", oTaskData);

				// act
				let result = persistency.Project.isLifecycleCalculationRunningForProject(sProjectId);
				// assert
				expect(result).toBe(true);
			});
			
			it("should return false when project has 'complete' task", function() {
				// arrange
				oTaskData.STATUS = 'complete';
				oMockstar.insertTableData("task", oTaskData);

				// act
				let result = persistency.Project.isLifecycleCalculationRunningForProject(sProjectId);
				// assert
				expect(result).toBe(false);
			});

			it("should return false when project is not under tasks", function() {
				// arrange
				oMockstar.insertTableData("task", oTaskData);

				// act
				let result = persistency.Project.isLifecycleCalculationRunningForProject("another_project");
				// assert
				expect(result).toBe(false);
			});
			
			it("should return false when project has task another then PROJECT_CALCULATE_LIFECYCLE_VERSIONS", function() {
				// arrange
				oTaskData.TASK_TYPE = 'ANOTHER_TASK_TYPE';
				oMockstar.insertTableData("task", oTaskData);

				// act
				let result = persistency.Project.isLifecycleCalculationRunningForProject("sProjectId");
				// assert
				expect(result).toBe(false);
			});
			
		});		
		
		describe('getCalculationsWithVersions', function() {
			var mockstar = null;
			var persistency = null;
			var sProjectId = testData.oCalculationTestData.PROJECT_ID[0];

			beforeOnce(() => {
				mockstar = new MockstarFacade({
					substituteTables: {
						calculation: {
							name: "sap.plc.db::basis.t_calculation",
							data: testData.oCalculationTestData
						},
						calculation_version: {
							name: "sap.plc.db::basis.t_calculation_version",
							data: testData.oCalculationVersionTestData
						}
					}
				});
			});

			beforeEach(() => {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(() => {
				mockstar.cleanup();
			});

			it('should return all calculations with all versions in a project', () => {
				// act
				var aResult = persistency.Project.getCalculationsWithVersions(sProjectId);
				
				// assert
				var oExpected = [
					{
						CALCULATION_ID: 1978,
						CALCULATION_VERSION_ID: 2809
					},
					{
						CALCULATION_ID: 2078,
						CALCULATION_VERSION_ID: 4809
					}];
				expect(aResult).toMatchData(oExpected, ["CALCULATION_ID", "CALCULATION_VERSION_ID"]);
			});
		});
		
        describe('getExistingNonTemporaryMasterdata', function() {

            let oMockstar = null;
            let oPersistency = null;

            const oProject = new TestDataUtility(testData.oProjectTestData).getObject(0);

            const oExpectedCostingSheets = _.pick(new TestDataUtility(testData.oCostingSheetTestData)
                .pickValues(oCs => oCs.CONTROLLING_AREA_ID === oProject.CONTROLLING_AREA_ID), "COSTING_SHEET_ID");
            const oExpectedComponentSplits = _.pick(new TestDataUtility(testData.oComponentSplitTest)
                .pickValues(oCs => oCs.CONTROLLING_AREA_ID == oProject.CONTROLLING_AREA_ID), "COMPONENT_SPLIT_ID");
            const oExpectedCurrencies = _.pick(testData.oCurrency, "CURRENCY_ID");
            const oExpectedExchangeRateTypes = _.pick(testData.oExchangeRateTypeTestDataPlc, "EXCHANGE_RATE_TYPE_ID");
            // use TestDataUtility to deep clone the controlling area data, since it's modified later
            const oExpectedControllingAreas = _.pick(new TestDataUtility(testData.oControllingAreaTestDataPlc).build(), "CONTROLLING_AREA_ID");
            oExpectedControllingAreas.CONTROLLING_AREA_ID.push("2000");

            beforeOnce(() => {
                oMockstar = new MockstarFacade({
                    substituteTables: {
                        calculation_version_temporary: {
                            name: "sap.plc.db::basis.t_calculation_version_temporary",
                            data: testData.oCalculationVersionTemporaryTestData
                        },
                        calculation: {
                            name: "sap.plc.db::basis.t_calculation",
                            data: testData.oCalculationTestData
                        },
                        controlling_area_id: {
                            name: "sap.plc.db::basis.t_controlling_area",
                            data: testData.oControllingAreaTestDataPlc
                        },
                        // replicated controlling area table from ERP
                        tka01: {
                            name: "sap.plc.db::repl.tka01",
                            data: {
                                KOKRS: ["2000"],
                                WAERS: ["1"],
                                KTOPL: ["1"],
                                LMONA: ["1"]
                            }
                        },
                        costing_sheet: {
                            name: "sap.plc.db::basis.t_costing_sheet",
                            data: testData.oCostingSheetTestData
                        },
                        component_split: {
                            name: "sap.plc.db::basis.t_component_split",
                            data: testData.oComponentSplitTest
                        },
                        currency: {
                            name: "sap.plc.db::basis.t_currency",
                            data: testData.oCurrency
                        },
                        exchange_rate_type: {
                            name: "sap.plc.db::basis.t_exchange_rate_type",
                            data: testData.oExchangeRateTypeTestDataPlc
                        },
                        project: {
                            name: "sap.plc.db::basis.t_project",
                            data: testData.oProjectTestData
                        }
                    }
                });
            });

            afterOnce(() => {
                oMockstar.cleanup();
            });

            beforeEach(() => {
                oMockstar.clearAllTables();
                oMockstar.initializeData();

                oPersistency = new Persistency(jasmine.dbConnection);
            });

            it('should return ids of existing costing sheet, component splits, currencies, exchange rate types and controlling areas for given project id', () => {
                // act
                var results = oPersistency.Project.getExistingNonTemporaryMasterdata({
                    project_id : oProject.PROJECT_ID
                });

                // assert
                expectMasterdata(results);
            });

            it('should return ids of existing costing sheet, component splits, currencies, exchange rate types and controlling areas for given controlling area id', () => {
                // act
                var results = oPersistency.Project.getExistingNonTemporaryMasterdata({
                    controlling_area_id: oProject.CONTROLLING_AREA_ID
                });

                // assert
                expectMasterdata(results);
            });

            function expectMasterdata(results) {
                expect(results.COSTING_SHEETS).toMatchData(oExpectedCostingSheets, ["COSTING_SHEET_ID"]);
                expect(results.COMPONENT_SPLITS).toMatchData(oExpectedComponentSplits, ["COMPONENT_SPLIT_ID"]);
                expect(results.CURRENCIES).toMatchData(oExpectedCurrencies, ["CURRENCY_ID"]);
                expect(results.EXCHANGE_RATE_TYPES).toMatchData(oExpectedExchangeRateTypes, ["EXCHANGE_RATE_TYPE_ID"]);
                expect(results.CONTROLLING_AREAS).toMatchData(oExpectedControllingAreas, ["CONTROLLING_AREA_ID"]);
               
            }
        });

		describe("getOpeningUsers", function() {
			var oMockstar = null;
			var persistency = null;
			var sSessionId = "Session1";

			var oOpenProjectsData = {
					SESSION_ID : [ "INITIAL_SESSION", "INITIAL_SESSION_B" ],
					PROJECT_ID : [ "PR1", "PR1" ],
					IS_WRITEABLE : [ 1, 0 ]
			};
			var oSessionData = {
					SESSION_ID : [ "INITIAL_SESSION", "INITIAL_SESSION_B", sSessionId],
					USER_ID : [ "USER_A", "USER_B", sSessionId ],
					LANGUAGE : [ "DE", "DE", "DE" ],
					LAST_ACTIVITY_TIME : [ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate ]
			};

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						session : mTableNames.session,
						open_projects : mTableNames.open_projects
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();

				oMockstar.insertTableData("session", oSessionData);
				oMockstar.insertTableData("open_projects", oOpenProjectsData);

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should return users when project is opened in session", function() {
				// arrange
				var sProjectId = oOpenProjectsData.PROJECT_ID[0];

				// act
				var result = persistency.Project.getOpeningUsers(sProjectId, sSessionId);
				// assert
				var aExpectedResult = [ 
				                       { USER_ID : oSessionData.USER_ID[0] }, 
				                       { USER_ID : oSessionData.USER_ID[1] } 
				                       ];
				expect(result).toEqualObject(aExpectedResult);							
			});

			it("should return empty when project does not exist in session", function() {
				// arrange
				var sProjectId = "PR4321";

				// act
				var result = persistency.Project.getOpeningUsers(sProjectId, sSessionId);

				// assert
				var aExpectedUsers = [];
				expect(result).toEqualObject(aExpectedUsers);
			});

			it("should return locking users when bCheckWriteable=true", function() {
				// arrange
				var sProjectId = oOpenProjectsData.PROJECT_ID[0];

				// act
				var result = persistency.Project.getOpeningUsers(sProjectId, sSessionId, true);
				// assert
				var aExpectedUsers = [ 
				                      { USER_ID : oSessionData.USER_ID[0] }
				                      ];
				expect(result).toEqualObject(aExpectedUsers);
			});

			it("should return users that opened project as readonly when bCheckWriteable=false", function() {
				// arrange
				var sProjectId = oOpenProjectsData.PROJECT_ID[0];

				// act
				var result = persistency.Project.getOpeningUsers(sProjectId, sSessionId, false);
				// assert
				var aExpectedUsers = [ 
				                      { USER_ID : oSessionData.USER_ID[1] }
				                      ];
				expect(result).toEqualObject(aExpectedUsers);
			});
			
			it("should throw an exception if a project is locked by more than one user", function(){
			    // arrange
				var sProjectId = oOpenProjectsData.PROJECT_ID[0];
				var sErrorSessionId = "ERROR_SESSION";
				oMockstar.insertTableData("open_projects", {
					SESSION_ID : [ sErrorSessionId],
					PROJECT_ID : [ "PR1" ],
					IS_WRITEABLE : [ 1 ]
			    });
			    oMockstar.insertTableData("session", {
				    "SESSION_ID": sErrorSessionId,
				    "USER_ID" : sErrorSessionId,
				    "LANGUAGE" : "EN",
				    "LAST_ACTIVITY_TIME" : new Date().toJSON()
				});
                var expectedException;
               
				// act
				try{
				    var result = persistency.Project.getOpeningUsers(sProjectId, sSessionId, true);    
				}catch(e){
				    expectedException = e;
				}
				
				// assert
				expect(expectedException).toBeDefined();
			});
		});

		describe("exists", function() {

			var oMockstar = null;
			var persistency = null;

			var oProjectTestData = testData.oProjectTestData;
			var oValidProject = {
					ENTITY_ID : oProjectTestData.ENTITY_ID[0],
					PROJECT_ID : oProjectTestData.PROJECT_ID[0],
					PROJECT_NAME : oProjectTestData.PROJECT_NAME[0],
					CONTROLLING_AREA_ID :  oProjectTestData.CONTROLLING_AREA_ID[0],
					VALUATION_DATE :  oProjectTestData.VALUATION_DATE[0],
					CREATED_ON: oProjectTestData.CREATED_ON[0],
					CREATED_BY: oProjectTestData.CREATED_BY[0],
					LAST_MODIFIED_ON: oProjectTestData.LAST_MODIFIED_ON[0],
					LAST_MODIFIED_BY: oProjectTestData.LAST_MODIFIED_BY[0],
					MATERIAL_PRICE_STRATEGY_ID: oProjectTestData.MATERIAL_PRICE_STRATEGY_ID[0],
					ACTIVITY_PRICE_STRATEGY_ID: oProjectTestData.ACTIVITY_PRICE_STRATEGY_ID[0]
			};

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : oProjectTestData
						}
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should return true when project id exists in project table", function() {
				// arrange
				oMockstar.insertTableData("project", oValidProject);

				// act
				var result = persistency.Project.exists(oValidProject.PROJECT_ID);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});

			it("should return false when project table is empty", function() {
				// act
				var result = persistency.Project.exists(oValidProject.PROJECT_ID);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(false);
			});

			it("should return false when project id does not exists in project table", function() {
				// arrange
				oMockstar.insertTableData("project", oValidProject);

				// act
				var result = persistency.Project.exists(oValidProject.PROJECT_ID + '___XXX');

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(false);
			});
		});

		describe("open", function() {
			var oMockstar = null;
			var persistency = null;					

			var sSessionId;
			var sUserId;
			sSessionId = sUserId = $.session.getUsername();
			
			var oProjectTestData = testData.oProjectTestData;
			var oValidProject = {
					PROJECT_ID : oProjectTestData.PROJECT_ID[0],
					PROJECT_NAME : oProjectTestData.PROJECT_NAME[0],
					CONTROLLING_AREA_ID :  oProjectTestData.CONTROLLING_AREA_ID[0],
					VALUATION_DATE :  oProjectTestData.VALUATION_DATE[0],
					CREATED_ON: oProjectTestData.CREATED_ON[0],
					CREATED_BY: oProjectTestData.CREATED_BY[0],
					LAST_MODIFIED_ON: oProjectTestData.LAST_MODIFIED_ON[0],
					LAST_MODIFIED_BY: oProjectTestData.LAST_MODIFIED_BY[0]
			};

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						open_projects : mTableNames.open_projects,
						session : {
									name : mTableNames.session,
									data : testData.oSessionTestData
								}, 
						authorization : {
							name : mTableNames.authorization,
							data : {
								PROJECT_ID   : [oValidProject.PROJECT_ID],
								USER_ID      : [sUserId],
								PRIVILEGE    : [InstancePrivileges.CREATE_EDIT]
							}
						}
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});
			
			//Locks the project for a user. Used to test open in read-only for a second user.
			function openProject(sProjectID, sUser, isWriteable){
			    oMockstar.insertTableData("session", {
				    "SESSION_ID": sUser,
				    "USER_ID" : sUser,
				    "LANGUAGE" : "EN",
				    "LAST_ACTIVITY_TIME" : new Date().toJSON()
				});
				persistency.Project.open(sProjectID, sUser,isWriteable);
			}

			it("project will be open in witeable mode and should create a lock entry for a project", function() {
				// arrange
				var oExpected = {
					PROJECT_ID: [oValidProject.PROJECT_ID],
					SESSION_ID: [sSessionId],
					IS_WRITEABLE: [1]
				};

				oMockstar.insertTableData("open_projects", oExpected);

				var sessionCount = oMockstar.execQuery(`SELECT * FROM {{session}}`);
				expect(sessionCount.columns.SESSION_ID.rows.length).toBe(3);

				//invalidate session	
				oMockstar.execSingle(`update {{session}} set LAST_ACTIVITY_TIME = '${testData.sExpectedDateWithoutTime}'`);
				// act
				persistency.Project.open(oValidProject.PROJECT_ID, sSessionId,1);
				sessionCount = oMockstar.execQuery(`SELECT * FROM {{session}}`);

				// assert
				var result = oMockstar.execQuery(`SELECT * FROM {{open_projects}} WHERE project_id = '${oValidProject.PROJECT_ID}'`);
				expect(result).toMatchData(oExpected, [ 'SESSION_ID', 'PROJECT_ID',"IS_WRITEABLE" ]);
				expect(sessionCount.columns.SESSION_ID.rows.length).toBe(2);
			});

			it("project will be open in read mode. should not create a lock entry for a project", function() {
				// arrange
				var oExpected = {
					PROJECT_ID: [oValidProject.PROJECT_ID],
					SESSION_ID: [sSessionId],
					IS_WRITEABLE: [0]
				};
				// act
				persistency.Project.open(oValidProject.PROJECT_ID, sSessionId, 0);

				// assert
				var result = oMockstar.execQuery(`SELECT * FROM {{open_projects}} WHERE project_id = '${oValidProject.PROJECT_ID}'`);
				expect(result).toMatchData(oExpected, ['SESSION_ID', 'PROJECT_ID',"IS_WRITEABLE" ]);
			});

			it("should get one user that lock the project", function() {
				// arrange
				var oExpected = {
						USER_ID: "somebodyElse",
				};

				openProject(oValidProject.PROJECT_ID, "somebodyElse",1);

				// act
				var result = persistency.Project.getOpeningUsers(oValidProject.PROJECT_ID, sSessionId, true);

				// assert
				expect(result).toMatchData(oExpected, ['USER_ID']); 
			});

			it("project can be open in edit mode", function() {
				// arrange
				openProject(oValidProject.PROJECT_ID, "somebodyElse", 0);

				// act
				var result = persistency.Project.getOpeningUsers(oValidProject.PROJECT_ID, sSessionId, true);

				// assert
				expect(result.length).toBe(0); 
			});

		});

		describe("getProjectProperties", function() {

			var oMockstar = null;
			var persistency = null;

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						}
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should return the controlling_area_id, component_split_id, costing_sheet_id, report_currency_id, exchange_rate_type_id, material_price_strategy_id, activity_price_strategy_id for the project", function() {
				// arrange
				var sProjectId = "PR1";

				// act
				var result = persistency.Project.getProjectProperties(sProjectId);

				// assert
				expect(result).toBeDefined();
				expect(result.CONTROLLING_AREA_ID).toBe('1000');
				expect(result.COMPONENT_SPLIT_ID).toBe('1');
				expect(result.COSTING_SHEET_ID).toBe('COGM');
				expect(result.REPORT_CURRENCY_ID).toBe('EUR');
				expect(result.EXCHANGE_RATE_TYPE_ID).toBe('BUY');
				expect(result.MATERIAL_PRICE_STRATEGY_ID).toBe(testData.oProjectTestData.MATERIAL_PRICE_STRATEGY_ID[0]);
				expect(result.ACTIVITY_PRICE_STRATEGY_ID).toBe(testData.oProjectTestData.ACTIVITY_PRICE_STRATEGY_ID[0]);
			});

			it("should return null if the project does not exist in the table", function() {
				// arrange
				var sProjectId = "test";

				// act
				var result = persistency.Project.getProjectProperties(sProjectId);

				// assert
				expect(result).toBe(null);
			});
		});

		describe("update", function() {

			var oMockstar = null;
			var persistency = null;
			var sUserId = $.session.getUsername();

			var oOpenProjectsData = {
					SESSION_ID : 	[ sUserId ],
					PROJECT_ID : 	[ testData.oProjectTestData.PROJECT_ID[0] ],
					IS_WRITEABLE : 	[ 1]
			};

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						open_projects : {
							name : mTableNames.open_projects,
							data : oOpenProjectsData
						},
						entity_relation : {
							name : mTableNames.entity_relation,
							data : testData.oEntityRelationTestData
						}
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should update project -> update changed project properties, set LAST_MODIFIED_ON and update db", function() {
				// arrange
				var oProjectToUpdate = _.omit(mockstarHelpers.convertToObject(testData.oProjectTestData, 0), ["CREATED_ON", "CREATED_BY"]);
				oProjectToUpdate.REPORT_CURRENCY_ID = "CHF";

				// act
				var result = persistency.Project.update(oProjectToUpdate);

				// assert
				var currentdate = new Date();
				var oExpected = _.extend(oProjectToUpdate, {
					"REPORT_CURRENCY_ID" : 	"CHF",
					"LAST_MODIFIED_BY": sUserId
				});
				oExpected = _.omit(oExpected, ["LAST_MODIFIED_ON"]);
				result = _.omit(result, ["LAST_MODIFIED_ON"]);
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpected)));

				result = oMockstar.execQuery("select * from {{project}} where project_id = '"
						+ oProjectToUpdate.PROJECT_ID + "';");
				result = _.omit(result, ["LAST_MODIFIED_ON"]);
				testHelpers.compareDbResultWithExpected(result, oExpected, [ ]);
			});

			it("should update project with missing columns-> set missing columns to null", function() {
				// arrange
				var oProjectToUpdate = _.omit(mockstarHelpers.convertToObject(testData.oProjectTestData, 0), ["CREATED_ON", "CREATED_BY"]);
				delete oProjectToUpdate.SALES_DOCUMENT;

				// act
				var result = persistency.Project.update(oProjectToUpdate);

				// assert
				var currentdate = new Date();
				var oExpected = _.extend(oProjectToUpdate, {
					"SALES_DOCUMENT" : 	null,
					"LAST_MODIFIED_BY":sUserId
				});
				oExpected = _.omit(oExpected, ["LAST_MODIFIED_ON"]);
				result = _.omit(result, ["LAST_MODIFIED_ON"]);
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpected)));

				result = oMockstar.execQuery("select * from {{project}} where project_id = '"
						+ oProjectToUpdate.PROJECT_ID + "';");
				result = _.omit(result, ["LAST_MODIFIED_ON"]);
				testHelpers.compareDbResultWithExpected(result, oExpected, [ ]);
			});

			it("should update the project parent from null (root) to a folder", function() {
				// arrange
				const iTargetFolder = testData.oEntityRelationTestData.ENTITY_ID[4];
				const oProjectToUpdate = mockstarHelpers.convertToObject(testData.oProjectTestData, 0);
				oProjectToUpdate.TARGET_PATH = `4/${iTargetFolder}`;
				oProjectToUpdate.PATH = `${testData.oProjectTestData.ENTITY_ID[0]}`;

				// act
				persistency.Project.update(oProjectToUpdate);

				// assert
				const iProjectToUpdateEntityId = testData.oEntityRelationTestData.ENTITY_ID[0];
				const iUpdatedParentEntity = oMockstar.execQuery(`select PARENT_ENTITY_ID from {{entity_relation}} where ENTITY_ID = ${iProjectToUpdateEntityId}`).columns.PARENT_ENTITY_ID.rows[0];
				expect(iUpdatedParentEntity).toBe(iTargetFolder);
				const iProjectId = testData.oProjectTestData.PROJECT_ID[0];
				const iProjectEntity = oMockstar.execQuery(`select ENTITY_ID from {{project}} where PROJECT_ID = '${iProjectId}'`).columns.ENTITY_ID.rows[0];
				expect(iProjectToUpdateEntityId).toBe(iProjectEntity);
			});

			it("should update not change the project parent if one of TARGET_PATH or PATH is missing", function() {
				// arrange
				const iTargetFolder = testData.oEntityRelationTestData.ENTITY_ID[4];
				const iSourceFolderParent = testData.oEntityRelationTestData.PARENT_ENTITY_ID[0];
				const oProjectToUpdate = mockstarHelpers.convertToObject(testData.oProjectTestData, 0);
				oProjectToUpdate.TARGET_PATH = `4/${iTargetFolder}`;

				// act
				persistency.Project.update(oProjectToUpdate);

				// assert
				const iProjectToUpdateEntityId = testData.oEntityRelationTestData.ENTITY_ID[0];
				const iDbParententity = oMockstar.execQuery(`select PARENT_ENTITY_ID from {{entity_relation}} where ENTITY_ID = ${iProjectToUpdateEntityId}`).columns.PARENT_ENTITY_ID.rows[0];
				expect(iDbParententity).toBe(iSourceFolderParent);
				const iProjectId = testData.oProjectTestData.PROJECT_ID[0];
				const iProjectEntity = oMockstar.execQuery(`select ENTITY_ID from {{project}} where PROJECT_ID = '${iProjectId}'`).columns.ENTITY_ID.rows[0];
				expect(iProjectToUpdateEntityId).toBe(iProjectEntity);
			});
		});

		describe("getFrozenVersions", function() {

			var oMockstar = null;
			var persistency = null;

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						calculation : {
							name : mTableNames.calculation,
							data : testData.oCalculationTestData
						},
						calculationVersion : {
							name : mTableNames.calculation_version
						}

					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should return object with ids of frozen versions assigned to a project (i.e. with is_frozen = 1)", function() {

				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oCalculationVersionTestDataClone = _.cloneDeep(testData.oCalculationVersionTestData);

				//set the is_version flag
				oCalculationVersionTestDataClone.IS_FROZEN = [ 1, 1, 0 ];

				//fill the calculation version table
				oMockstar.insertTableData("calculationVersion", oCalculationVersionTestDataClone);

				//act and assert						
				var result = persistency.Project.getFrozenVersions(sProjectId);
				expect(result.length).toBe(2);

				// check if frozen versions are included in result object returned by getFrozenVersions
				expect(_.filter(result, {"CALCULATION_VERSION_ID":oCalculationVersionTestDataClone.CALCULATION_VERSION_ID[0]}).length).toBe(1);
				expect(_.filter(result, {"CALCULATION_VERSION_ID":oCalculationVersionTestDataClone.CALCULATION_VERSION_ID[1]}).length).toBe(1);

			});

			it("should return object with ids of frozen versions assigned to project, where some other versions have is_frozen = null", function() {

				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oCalculationVersionTestDataClone = _.cloneDeep(testData.oCalculationVersionTestData);

				//set the is_version flag
				oCalculationVersionTestDataClone.IS_FROZEN = [ 1, null, 0 ];

				//fill the calculation version table
				oMockstar.insertTableData("calculationVersion", oCalculationVersionTestDataClone);

				//act and assert
				var result = persistency.Project.getFrozenVersions(sProjectId);
				expect(result.length).toBe(1);

				// check if frozen version is included in result object returned by getFrozenVersions
				expect(_.filter(result, {"CALCULATION_VERSION_ID":oCalculationVersionTestDataClone.CALCULATION_VERSION_ID[0]}).length).toBe(1);

			});

			it("should return an empty object if no frozen versions assigned to project", function() {

				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];//PR1;
				var oCalculationVersionTestDataClone = _.cloneDeep(testData.oCalculationVersionTestData);

				//set the is_version flag
				oCalculationVersionTestDataClone.IS_FROZEN = [ 0, null, 0 ];

				//fill the calculation version table
				oMockstar.insertTableData("calculationVersion", oCalculationVersionTestDataClone);

				//act and assert						
				var result = persistency.Project.getFrozenVersions(sProjectId);
				expect(result.length).toBe(0);

			});
		});

		describe("getSourceVersionsWithMasterVersionsFromDifferentProjects", function() {

			var oMockstar = null;
			var persistency = null;
			var sUserId = $.session.getUsername();
			var sExpectedDate = new Date().toJSON();
			//add test data for item and item temporary table with items of type referenced calculation version
			var oItemTestData = {
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [2810, 2810, 2, 4811, 4811],
					"PARENT_ITEM_ID" : [ null, 3001, 3001, null, 5001],
					"PREDECESSOR_ITEM_ID" : [ null, 3001, null, null, 5001],
					"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
					"ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
					"CHILD_ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
					"REFERENCED_CALCULATION_VERSION_ID": [null, 4811, 4, null, 6809],
					"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
					"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
					"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
					"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
			};

			var oItemTemporaryTestData = {
					"SESSION_ID": ["TestUser", "TestUser", "TestUser", "TestUser", "TestUser"],
					"ITEM_ID" : [ 7001, 8001, 8002, 8003, 8004 ],
					"CALCULATION_VERSION_ID" : [ 1, 5809, 6809, 6809, 6809],
					"PARENT_ITEM_ID" : [ 5001, 5001, null, 8001, 8002],
					"PREDECESSOR_ITEM_ID" : [ 5001, 7001, null, 8001, 8002],
					"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
					"ITEM_CATEGORY_ID" : [ 2, 10, 3, 4, 10],
					"CHILD_ITEM_CATEGORY_ID" : [ 2, 10, 3, 4, 10],
					"REFERENCED_CALCULATION_VERSION_ID": [null, 2809, null, null, 2810],
					"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
					"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
					"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
					"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
			};

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						calculation : {
							name : mTableNames.calculation,
							data : testData.oCalculationTestData
						},
						calculation_version : {
							name : mTableNames.calculation_version,
							data : testData.oCalculationVersionTestData
						},
						item : {
							name : mTableNames.item,
							data : testData.oItemTestData
						},									
						item_temporary : {
							name : mTableNames.item_temporary,
							data : testData.oItemTemporaryTestData
						}
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
				oMockstar.insertTableData("item", oItemTestData);

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should get all versions from the project that have master versions in other projects", function() {
				// arrange
				var sProjectId = 'PR3';

				// act
				var aResult = persistency.Project.getSourceVersionsWithMasterVersionsFromDifferentProjects(sProjectId);

				// assert
				expect(aResult.length).toBe(1);
			});

			it("should return empty if the source version from the project have the master versions also in the project", function() {
				// arrange
				var sProjectId = 'PR1';

				// act
				var aResult = persistency.Project.getSourceVersionsWithMasterVersionsFromDifferentProjects(sProjectId);

				// assert
				expect(aResult.length).toBe(0);
			});

			it("should get all versions from the project that have master versions in other projects, even if the reference is set in the temporary table", function() {
				// arrange
				oMockstar.insertTableData("item_temporary", oItemTemporaryTestData);
				var sProjectId = 'PR1';

				// act
				var aResult = persistency.Project.getSourceVersionsWithMasterVersionsFromDifferentProjects(sProjectId);

				// assert
				expect(aResult.length).toBe(2);
			});					
		});
		
		describe('createTotalQuantities', function() {

			var persistency = null;
			var oMockstar = null;
			var sProject = 'PR1';

			var aBodyTotalQuantity = [{
				"CALCULATION_ID": testData.iCalculationId,
				"CALCULATION_VERSION_ID": testData.iCalculationVersionId,
				"MATERIAL_PRICE_SURCHARGE_STRATEGY": Constants.ProjectSurchargeStrategies.NoSurcharges,
				"ACTIVITY_PRICE_SURCHARGE_STRATEGY": Constants.ProjectSurchargeStrategies.NoSurcharges,
				"LAST_MODIFIED_ON": testData.sExpectedDate,
				"LAST_MODIFIED_BY": testData.sTestUser,
				"PERIOD_VALUES":[{
					"LIFECYCLE_PERIOD_FROM": 1404,
					"VALUE": '3000.0000000'
				},{
					"LIFECYCLE_PERIOD_FROM": 1416,
					"VALUE": '4000.0000000'
				},{
					"LIFECYCLE_PERIOD_FROM": 1428,
					"VALUE": '5000.0000000'
				}]
			},{
				"CALCULATION_ID": 2078,
				"CALCULATION_VERSION_ID": null,
				"MATERIAL_PRICE_SURCHARGE_STRATEGY": Constants.ProjectSurchargeStrategies.NoSurcharges,
				"ACTIVITY_PRICE_SURCHARGE_STRATEGY": Constants.ProjectSurchargeStrategies.NoSurcharges,
				"LAST_MODIFIED_ON": testData.sExpectedDate,
				"LAST_MODIFIED_BY": testData.sTestUser,
				"PERIOD_VALUES":[]
			}];

			beforeOnce(function() {
				oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							testmodel : {
							},
							substituteTables : {
								project_lifecycle_configuration: {
									name: "sap.plc.db::basis.t_project_lifecycle_configuration"
								},
								lifecycle_period_value: {
									name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value"
								}
							}
						});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it('should create total quantities --> db updated', function() {
				// arrange
				var aExpectedTotalQuantities = _.map(aBodyTotalQuantity, function(oTQ){ return _.omit(oTQ, ['LAST_MODIFIED_ON','PERIOD_VALUES'])});
				var aExpectedTQValues = _.map(aBodyTotalQuantity[0].PERIOD_VALUES, _.cloneDeep);

				// act
				var aResultObject = persistency.Project.createTotalQuantities(aBodyTotalQuantity, sProject);

				// assert
				expect(aResultObject).toBeDefined();
				expect(_.isArray(aResultObject)).toBeTruthy();
				expect(aResultObject.length).toBe(2);
				// check the values inserted
				var resultTq = oMockstar.execQuery(
					`select CALCULATION_ID, CALCULATION_VERSION_ID,
						MATERIAL_PRICE_SURCHARGE_STRATEGY, ACTIVITY_PRICE_SURCHARGE_STRATEGY, LAST_MODIFIED_BY
						from {{project_lifecycle_configuration}} where calculation_id in
						('${aBodyTotalQuantity[0].CALCULATION_ID}', '${aBodyTotalQuantity[1].CALCULATION_ID}');`);
				expect(resultTq).toMatchData(aExpectedTotalQuantities, ["CALCULATION_ID", "CALCULATION_VERSION_ID", "LAST_MODIFIED_BY" ]);
				var resultValues = oMockstar.execQuery(`select LPV.LIFECYCLE_PERIOD_FROM, LPV.VALUE
						from {{lifecycle_period_value}} as LPV inner join {{project_lifecycle_configuration}} as PTQ on PTQ.PROJECT_ID = LPV.PROJECT_ID and PTQ.CALCULATION_ID = LPV.CALCULATION_ID
						where PTQ.calculation_id = '${aBodyTotalQuantity[0].CALCULATION_ID}';`);
				expect(resultValues).toMatchData(aExpectedTQValues, [ "LIFECYCLE_PERIOD_FROM", "VALUE" ]);
			});

			it('should not create values for total quantities if PERIOD_VALUES is an empty for a calculation', function() {
				// arrange
				var aExpectedTotalQuantities = _.map(aBodyTotalQuantity, function(oTQ){ return _.omit(oTQ, ['LAST_MODIFIED_ON','PERIOD_VALUES'])});
				var aExpectedTQValues = [];

				// act
				var aResultObject = persistency.Project.createTotalQuantities(aBodyTotalQuantity, sProject);

				// assert
				expect(aResultObject).toBeDefined();
				expect(_.isArray(aResultObject)).toBeTruthy();
				expect(aResultObject.length).toBe(2);
				// check the values inserted
				var resultTq = oMockstar.execQuery(
						`select CALCULATION_ID, CALCULATION_VERSION_ID,
							MATERIAL_PRICE_SURCHARGE_STRATEGY, ACTIVITY_PRICE_SURCHARGE_STRATEGY, LAST_MODIFIED_BY
							from {{project_lifecycle_configuration}} where calculation_id in
							(${aBodyTotalQuantity[0].CALCULATION_ID}, ${aBodyTotalQuantity[1].CALCULATION_ID});`);
				expect(resultTq).toMatchData(aExpectedTotalQuantities, ["CALCULATION_ID", "CALCULATION_VERSION_ID", "LAST_MODIFIED_BY" ]);
				var resultValues = oMockstar.execQuery(`select LPV.LIFECYCLE_PERIOD_FROM, LPV.VALUE
						from {{lifecycle_period_value}} as LPV inner join {{project_lifecycle_configuration}} as PTQ on PTQ.PROJECT_ID = LPV.PROJECT_ID and PTQ.CALCULATION_ID = LPV.CALCULATION_ID
						where PTQ.calculation_id = '${aBodyTotalQuantity[1].CALCULATION_ID}';`);
				expect(resultValues).toMatchData(aExpectedTQValues, [ "LIFECYCLE_PERIOD_FROM", "VALUE" ]);
			});

			it('should set default value for MATERIAL_PRICE_SURCHARGE_STRATEGY and ACTIVITY_PRICE_SURCHARGE_STRATEGY if those were empty', function() {
				// arrange
				var aExpectedTotalQuantities = _.map(aBodyTotalQuantity, function(oTQ){ return _.omit(oTQ, ['LAST_MODIFIED_ON','PERIOD_VALUES'])});
				var aExpectedTQValues = _.map(aBodyTotalQuantity[0].PERIOD_VALUES, _.cloneDeep);

				// remove MATERIAL_PRICE_SURCHARGE_STRATEGY and ACTIVITY_PRICE_SURCHARGE_STRATEGY from request
				var aBodyTotalQuantityWithoutStrategies = new TestDataUtility(_.map(aBodyTotalQuantity, function(oTQ){ return _.omit(oTQ, ['MATERIAL_PRICE_SURCHARGE_STRATEGY', 'ACTIVITY_PRICE_SURCHARGE_STRATEGY'])})).build();

				// act
				var aResultObject = persistency.Project.createTotalQuantities(aBodyTotalQuantityWithoutStrategies, sProject);

				// assert
				// The default values for MATERIAL_PRICE_SURCHARGE_STRATEGY and ACTIVITY_PRICE_SURCHARGE_STRATEGY should be set
				var resultTq = oMockstar.execQuery(
					`select CALCULATION_ID, CALCULATION_VERSION_ID,
						MATERIAL_PRICE_SURCHARGE_STRATEGY, ACTIVITY_PRICE_SURCHARGE_STRATEGY, LAST_MODIFIED_BY
						from {{project_lifecycle_configuration}} where calculation_id in
						('${aBodyTotalQuantity[0].CALCULATION_ID}', '${aBodyTotalQuantity[1].CALCULATION_ID}');`);
				expect(resultTq).toMatchData(aExpectedTotalQuantities, [ "CALCULATION_ID", "CALCULATION_VERSION_ID", "LAST_MODIFIED_BY" ]);
				var resultValues = oMockstar.execQuery(`select LPV.LIFECYCLE_PERIOD_FROM, LPV.VALUE
						from {{lifecycle_period_value}} as LPV inner join {{project_lifecycle_configuration}} as PTQ on PTQ.PROJECT_ID = LPV.PROJECT_ID and PTQ.CALCULATION_ID = LPV.CALCULATION_ID
						where PTQ.calculation_id = '${aBodyTotalQuantity[0].CALCULATION_ID}';`);
				expect(resultValues).toMatchData(aExpectedTQValues, [ "LIFECYCLE_PERIOD_FROM", "VALUE" ]);
			});

		});
		
		describe('delete total quantities related tests', function() {

			var persistency = null;
			var oMockstar = null;
			var sUserId = $.session.getUsername();
			var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
			var iCalculationId = testData.iCalculationId;

			beforeOnce(function() {
				oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							testmodel : {
							},
							substituteTables : {
								authorization : {
									name : 'sap.plc.db::auth.t_auth_project',
									data : {
										PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1]],
										USER_ID      : [sUserId, sUserId],
										PRIVILEGE    : [InstancePrivileges.FULL_EDIT, InstancePrivileges.FULL_EDIT]
									}
								},
								project : {
									name : mTableNames.project,
									data : testData.oProjectTestData
								},
								calculation : {
									name : mTableNames.calculation,
									data : testData.oCalculationTestData
								},
								calculation_version : {
									name : mTableNames.calculation_version,
									data : testData.oCalculationVersionTestData
								},
								project_lifecycle_configuration: {
									name: "sap.plc.db::basis.t_project_lifecycle_configuration",
									data: testData.oProjectTotalQuantities
								},
								lifecycle_period_value: {
									name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
									data: testData.oLifecyclePeriodValues
								},
								project_activity_price_surcharges: {
									name: "sap.plc.db::basis.t_project_activity_price_surcharges",
									data: testData.oProjectActivityPriceSurcharges
								},
								project_activity_price_surcharge_values: {
									name: "sap.plc.db::basis.t_project_activity_price_surcharge_values",
									data: testData.oProjectActivityPriceSurchargeValues
								},
								project_material_price_surcharges: {
									name: "sap.plc.db::basis.t_project_material_price_surcharges",
									data: testData.oProjectMaterialPriceSurcharges
								},
								project_material_price_surcharge_values: {
									name: "sap.plc.db::basis.t_project_material_price_surcharge_values",
									data: testData.oProjectMaterialPriceSurchargeValues
								},
								lifecycle_period_type: {
									name: "sap.plc.db::basis.t_project_lifecycle_period_type"
								},
								lifecycle_monthly_period: {
									name: "sap.plc.db::basis.t_project_monthly_lifecycle_period"
								},
								lifecycle_period_quantities: {
									name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value"
								},
								one_time_project_cost: "sap.plc.db::basis.t_one_time_project_cost", 
								one_time_product_cost: "sap.plc.db::basis.t_one_time_product_cost", 
								one_time_cost_lifecycle_value: "sap.plc.db::basis.t_one_time_cost_lifecycle_value"
							}
						});
			});
			
			afterOnce(function() {
				oMockstar.cleanup();
			});
			
			describe("deleteLifecyclePeriodsForProject", () => {

				beforeEach(() => {
					oMockstar.clearAllTables();
					oMockstar.initializeData();
					persistency = new Persistency(jasmine.dbConnection);
				});
				
				function runAndCheckForPeriods(sConstraint, iStartPeriodId, iEndPeriodId){
					// rule_id for sProjectId = (1 or 2) for quantities, 1 for activity price surcharges, 11 for material price surcharges, compare testData
					let iQuantitiesPeriodCountBefore = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value", `${sConstraint} and project_id = 'PR1'`);
					let iActivityPSPeriodCountBefore = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values", `${sConstraint} and rule_id in (1)`);
					let iMaterialPSPeriodCountBefore = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values", `${sConstraint} and rule_id in (11)`);
					
					let dStartOfProject = iStartPeriodId === null ? null : new Date(iStartPeriodId / 12 + 1900, 0, 1);
					let dEndOfProject = iEndPeriodId === null ? null : new Date(iEndPeriodId / 12 + 1900, 0, 1);

					// act
					persistency.Project.deleteLifecyclePeriodsForProject(sProjectId, dStartOfProject, dEndOfProject);

					// assert       
					expect(iQuantitiesPeriodCountBefore).toBeGreaterThan(0);
					let iQuantitiesPeriodCountAfter = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value", `${sConstraint} and project_id = 'PR1'`);
					expect(iQuantitiesPeriodCountAfter).toEqual(0);
					
					expect(iActivityPSPeriodCountBefore).toBeGreaterThan(0);
					let iActivityPSPeriodCountAfter = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values", `${sConstraint} and rule_id in (1)`);
					expect(iActivityPSPeriodCountAfter).toEqual(0);
					
					expect(iMaterialPSPeriodCountBefore).toBeGreaterThan(0);
					let iMaterialPSPeriodCountAfter = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values", `${sConstraint} and rule_id in (11)`);
					expect(iMaterialPSPeriodCountAfter).toEqual(0);
				}

				it('should delete one time costs lifecycle values when project dates change', () => {
					// arrange
					var sProjectId = "PR1";
					var sSecondProjectId = "PR3";
					var iCalculationId1 = 1000;
					var iCalculationId2 = 1001;
					var iCalculationId3 = 1002;
					var iCalculationId4 = 1003;
					var sAccountId = "ACC10";

					let oLifecycleYearlyPeriodTypesForProject = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId, sSecondProjectId, sSecondProjectId, sSecondProjectId],
						"YEAR": [2020, 2021, 2022, 2020, 2021, 2022],
						"PERIOD_TYPE": ["YEARLY", "YEARLY", "YEARLY", "YEARLY", "YEARLY", "YEARLY"],
						"LAST_MODIFIED_ON": [testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate],
						"LAST_MODIFIED_BY": [testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser]
					};
					let oLifecycleMonthlyPeriod = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId, sSecondProjectId, sSecondProjectId, sSecondProjectId],
						"YEAR": [2020, 2021, 2022, 2020, 2021, 2022],
						"SELECTED_MONTH": [1, 1, 1, 1, 1, 1],
						"LAST_MODIFIED_ON": [testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate],
						"LAST_MODIFIED_BY": [testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser]
					};
					var oLifecyclePeriodValueTestData = {
						"PROJECT_ID":				[ sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sSecondProjectId, sSecondProjectId, sSecondProjectId, sSecondProjectId, sSecondProjectId, sSecondProjectId],
						"CALCULATION_ID" : 		    [ iCalculationId1,iCalculationId1,iCalculationId1,iCalculationId2,iCalculationId2,iCalculationId2,iCalculationId3,iCalculationId3,iCalculationId3,iCalculationId4,iCalculationId4,iCalculationId4],
						"LIFECYCLE_PERIOD_FROM" : 	[ 1440, 1452, 1464, 1440, 1452, 1464, 1440, 1452, 1464, 1440, 1452, 1464],
						"VALUE" : 					['1000.0000000', '1000.0000000','500.0000000', '2000.0000000', '2000.0000000', '1000.0000000', '1000.0000000', '1000.0000000','500.0000000', '2000.0000000', '2000.0000000', '1000.0000000'],
						"LAST_MODIFIED_ON" : 		[ testData.sExpectedDate, testData.sExpectedDate,testData.sExpectedDate, testData.sExpectedDate,testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate,testData.sExpectedDate, testData.sExpectedDate,testData.sExpectedDate, testData.sExpectedDate],
						"LAST_MODIFIED_BY":         [ testData.sTestUser, testData.sTestUser,testData.sTestUser, testData.sTestUser,testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser,testData.sTestUser, testData.sTestUser,testData.sTestUser, testData.sTestUser]
					};
					var oOneTimeProjectCost = {
						"ONE_TIME_COST_ID": 				[1000, 1001, 1002, 1003],
						"PROJECT_ID":						[sProjectId, sProjectId, sSecondProjectId, sSecondProjectId],
						"ACCOUNT_ID":						[sAccountId, sAccountId, sAccountId, sAccountId],
						"COST_DESCRIPTION":					['Investment', 'Process', 'Investment', 'Process'],
						"COST_TO_DISTRIBUTE":				['30000.0000000', '20000.0000000', '30000.0000000', '20000.0000000'],
						"COST_NOT_DISTRIBUTED":				['30000.0000000', '20000.0000000', '30000.0000000', '20000.0000000'],
						"COST_CURRENCY_ID":					['EUR','EUR','EUR','EUR'],
						"FIXED_COST_PORTION":				[20,    50,    20,    50],
						"DISTRIBUTION_TYPE":				[ 0,     0,     0,     0],
						"LAST_MODIFIED_BY":					[testData.sTestUser ,  testData.sTestUser, testData.sTestUser ,  testData.sTestUser],
						"LAST_MODIFIED_ON":					[testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate]
					};
					var oOneTimeProductCost = {
						"ONE_TIME_COST_ID": [1000, 1000, 1001, 1002, 1002, 1003],
						"CALCULATION_ID": [iCalculationId1,iCalculationId2,iCalculationId1,iCalculationId3,iCalculationId4,iCalculationId3],
						"COST_TO_DISTRIBUTE": ['1000.0000000','1000.0000000','1000.0000000','1000.0000000','1000.0000000','1000.0000000'],
						"COST_NOT_DISTRIBUTED": ['1000.0000000','1000.0000000','1000.0000000','1000.0000000','1000.0000000','1000.0000000'],
						"DISTRIBUTION_TYPE": [0,1,2,0,1,2],
						"LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate],
						"LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser,testData.sTestUser,testData.sTestUser,testData.sTestUser]
					};
					var oOneTimeCostLifecycle = {
						"ONE_TIME_COST_ID": [1000, 1000, 1000, 1000, 1000, 1000, 1001, 1001, 1001, 1001, 1001, 1001, 1002, 1002, 1002, 1003, 1003, 1003],
						"CALCULATION_ID": [iCalculationId1, iCalculationId1, iCalculationId1, iCalculationId1, iCalculationId1, iCalculationId1, iCalculationId2, iCalculationId2, iCalculationId2, iCalculationId2, iCalculationId2, iCalculationId2, iCalculationId3, iCalculationId3, iCalculationId3, iCalculationId4, iCalculationId4, iCalculationId4],
						"LIFECYCLE_PERIOD_FROM": [1440, 1452, 1464, 1440, 1452, 1464, 1440, 1452, 1464, 1440, 1452, 1464, 1440, 1452, 1464, 1440, 1452, 1464], 
						"VALUE": ['10.0000000', '20.0000000', '30.0000000', '40.0000000', '50.0000000', '60.0000000', '10.0000000', '20.0000000', '30.0000000', '40.0000000', '50.0000000', '60.0000000', '10.0000000', '20.0000000', '30.0000000', '10.0000000', '20.0000000', '30.0000000']
					};
					
					oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
					oMockstar.insertTableData("lifecycle_monthly_period", oLifecycleMonthlyPeriod);
					oMockstar.insertTableData("one_time_project_cost", oOneTimeProjectCost);
					oMockstar.insertTableData("one_time_product_cost", oOneTimeProductCost);
					oMockstar.insertTableData("one_time_cost_lifecycle_value", oOneTimeCostLifecycle);
					oMockstar.insertTableData("lifecycle_period_quantities", oLifecyclePeriodValueTestData);
					oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-01-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-12-31T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sProjectId}';`);

					// act
					let oResultObject = persistency.Project.deleteLifecyclePeriodsForProject(sProjectId, new Date('2021-01-01T00:00:00'), new Date('2022-12-31T00:00:00'));

					// assert
					let oOneTimeCostLifecycleValues = oMockstar.execQuery(`SELECT * FROM {{one_time_cost_lifecycle_value}} WHERE one_time_cost_id IN (1000, 1001) ORDER BY one_time_cost_id, calculation_id;`);
					expect(oOneTimeCostLifecycleValues.columns.LIFECYCLE_PERIOD_FROM.rows.length).toEqual(6);
					expect(oOneTimeCostLifecycleValues.columns.ONE_TIME_COST_ID.rows.length).toEqual(6);
					expect(oOneTimeCostLifecycleValues.columns.CALCULATION_ID.rows.length).toEqual(6);
					
					// make sure the values of the other projects aren't deleted
					let oOneTimeCostLifecycleValuesNotDeleted = oMockstar.execQuery(`SELECT * FROM {{one_time_cost_lifecycle_value}} WHERE one_time_cost_id IN (1002, 1003);`);
					expect(oOneTimeCostLifecycleValuesNotDeleted.columns.LIFECYCLE_PERIOD_FROM.rows.length).toEqual(6);
					expect(oOneTimeCostLifecycleValuesNotDeleted.columns.ONE_TIME_COST_ID.rows.length).toEqual(6);
					expect(oOneTimeCostLifecycleValuesNotDeleted.columns.CALCULATION_ID.rows.length).toEqual(6);
				});

				it('should delete yearly entries from monthly periods table', () => {
					// arrange
					let sUserId = testData.sTestUser;
					let dTimestamp = new Date();
					let iLowestPeriodId = 1452;
					let iHighestPeriodId = 1464;
					let oLifecycleYearlyPeriodTypesForProject = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId],
						"YEAR": [2020, 2021, 2022],
						"PERIOD_TYPE": ["YEARLY", "YEARLY", "YEARLY"],
						"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
					};
					let oLifecycleMonthlyPeriod = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId],
						"YEAR": [2020, 2021, 2022],
						"SELECTED_MONTH": [1, 1, 1],
						"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
					};
					var oLifecyclePeriodValues = {
						"PROJECT_ID": [ "PR1", "PR1", "PR1"],
						"CALCULATION_ID": [iCalculationId, iCalculationId, iCalculationId],
						"LIFECYCLE_PERIOD_FROM": [ 1440, 1452, 1464],
						"VALUE": [ 100, 200, 300],
						"LAST_MODIFIED_ON": [ sExpectedDate, sExpectedDate, sExpectedDate],
						"LAST_MODIFIED_BY": [ sTestUser, sTestUser, sTestUser]
					};
					oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
					oMockstar.insertTableData("lifecycle_monthly_period", oLifecycleMonthlyPeriod);
					oMockstar.clearTable("lifecycle_period_quantities");
					oMockstar.insertTableData("lifecycle_period_quantities", oLifecyclePeriodValues);
					oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-01-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-12-31T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sProjectId}';`);

					// act
					let oResultObject = persistency.Project.deleteLifecyclePeriodsForProject(sProjectId, new Date('2021-05-01T00:00:00'), new Date('2022-05-31T00:00:00'));

					// assert
					let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{lifecycle_monthly_period}} WHERE PROJECT_ID = '${sProjectId}' ORDER BY year, selected_month;`);
					expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([1, 1]);
					expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2021, 2022]);

					let oPeriodQuantityValues = oMockstar.execQuery(`SELECT * FROM {{lifecycle_period_quantities}} WHERE PROJECT_ID = '${sProjectId}' AND CALCULATION_ID = ${iCalculationId} ORDER BY LIFECYCLE_PERIOD_FROM;`);
					expect(oPeriodQuantityValues.columns.VALUE.rows).toEqual(['200.0000000', '300.0000000']);
					expect(oPeriodQuantityValues.columns.LIFECYCLE_PERIOD_FROM.rows).toEqual([1452, 1464]);
				});

				it('should delete the months before the new start date and after the new end date', () => {
					// arrange
					let sUserId = testData.sTestUser;
					let dTimestamp = new Date();
					let iLowestPeriodId = 1440;
					let iHighestPeriodId = 1464;
					let oLifecycleYearlyPeriodTypesForProject = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId],
						"YEAR": [2020, 2021, 2022],
						"PERIOD_TYPE": ["MONTHLY", "YEARLY", "CUSTOM"],
						"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
					};
					let oLifecycleMonthlyPeriod = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId],
						"YEAR": [2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2022, 2022, 2022],
						"SELECTED_MONTH": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 3, 5, 7],
						"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId]
					};
					var oLifecyclePeriodValues = {
						"PROJECT_ID": [ "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR1" ],
						"CALCULATION_ID": [iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId],
						"LIFECYCLE_PERIOD_FROM": [ 1440, 1441, 1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1450, 1451, 1452, 1466, 1468, 1470],
						"VALUE": [ 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 100, 300, 500, 700],
						"LAST_MODIFIED_ON": [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
						"LAST_MODIFIED_BY": [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ]
					};
					oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
					oMockstar.insertTableData("lifecycle_monthly_period", oLifecycleMonthlyPeriod);
					oMockstar.clearTable("lifecycle_period_quantities");
					oMockstar.insertTableData("lifecycle_period_quantities", oLifecyclePeriodValues);
					oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-01-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-12-31T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sProjectId}';`);

					// act
					let oResultObject = persistency.Project.deleteLifecyclePeriodsForProject(sProjectId, new Date('2020-05-01T00:00:00'), new Date('2022-05-30T00:00:00'));

					// assert
					let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{lifecycle_monthly_period}} WHERE PROJECT_ID = '${sProjectId}' ORDER BY year, selected_month;`);
					expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 3, 5]);
					expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2022, 2022]);
					
					let oPeriodQuantityValues = oMockstar.execQuery(`SELECT * FROM {{lifecycle_period_quantities}} WHERE PROJECT_ID = '${sProjectId}' AND CALCULATION_ID = ${iCalculationId} ORDER BY LIFECYCLE_PERIOD_FROM;`);
					expect(oPeriodQuantityValues.columns.VALUE.rows).toEqual(['500.0000000', '600.0000000', '700.0000000', '800.0000000', '900.0000000', '1000.0000000', '1100.0000000', '1200.0000000', '300.0000000', '500.0000000']);
					expect(oPeriodQuantityValues.columns.LIFECYCLE_PERIOD_FROM.rows).toEqual([1444, 1445, 1446, 1447, 1448, 1449, 1450, 1451, 1466, 1468]);
				});

				it('should delete the quarters before the new start date and leave the one with the new month', () => {
					// arrange
					let sUserId = testData.sTestUser;
					let dTimestamp = new Date();
					let iLowestPeriodId = 1440;
					let iHighestPeriodId = 1464;
					let oLifecycleYearlyPeriodTypesForProject = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId],
						"YEAR": [2020, 2021, 2022],
						"PERIOD_TYPE": ["QUARTERLY", "YEARLY", "YEARLY"],
						"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
					};
					let oLifecycleMonthlyPeriod = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId, sProjectId],
						"YEAR": [2020, 2020, 2020, 2020],
						"SELECTED_MONTH": [1, 4, 7, 10],
						"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId]
					};
					var oLifecyclePeriodValues = {
						"PROJECT_ID": [ "PR1", "PR1", "PR1", "PR1"],
						"CALCULATION_ID": [iCalculationId, iCalculationId, iCalculationId, iCalculationId],
						"LIFECYCLE_PERIOD_FROM": [ 1440, 1443, 1446, 1449],
						"VALUE": [ 100, 400, 700, 1000],
						"LAST_MODIFIED_ON": [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
						"LAST_MODIFIED_BY": [ sTestUser, sTestUser, sTestUser, sTestUser]
					};
					oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
					oMockstar.insertTableData("lifecycle_monthly_period", oLifecycleMonthlyPeriod);
					oMockstar.clearTable("lifecycle_period_quantities");
					oMockstar.insertTableData("lifecycle_period_quantities", oLifecyclePeriodValues);
					oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-01-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-12-31T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sProjectId}';`);

					// act
					let oResultObject = persistency.Project.deleteLifecyclePeriodsForProject(sProjectId, new Date('2020-08-01T00:00:00'), new Date('2022-12-31T00:00:00'));

					// assert
					let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{lifecycle_monthly_period}} WHERE PROJECT_ID = '${sProjectId}' ORDER BY year, selected_month;`);
					expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([7, 10]);
					expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2020, 2020]);

					let oPeriodQuantityValues = oMockstar.execQuery(`SELECT * FROM {{lifecycle_period_quantities}} WHERE PROJECT_ID = '${sProjectId}' AND CALCULATION_ID = ${iCalculationId} ORDER BY LIFECYCLE_PERIOD_FROM;`);
					expect(oPeriodQuantityValues.columns.VALUE.rows).toEqual(['700.0000000', '1000.0000000']);
					expect(oPeriodQuantityValues.columns.LIFECYCLE_PERIOD_FROM.rows).toEqual([1446, 1449]);
				});
				
				it('should delete all lifecycle periods when highest period is null', () => {
					// arrange
					let iStartPeriodId = 1416;
					// => means all period values <1416  must be deleted from lifecycle_period_value for calculation of project with id sProjectId
					let  sConstraint = "1=1"; 

					// act & assert
					runAndCheckForPeriods(sConstraint, iStartPeriodId, null);
				});
				
				it('should delete all lifecycle periods when lowest period id is null', () => {
					// arrange
					let iEndPeriodId = 1416;
					// => means all period values <1416  must be deleted from lifecycle_period_value for calculation of project with id sProjectId
					let  sConstraint = "1=1"; 
					
					// act & assert
					runAndCheckForPeriods(sConstraint, null, iEndPeriodId);
				});
				
				it('should delete all lifecycle periods if lowest and and highest period id are null', () => {
					// arrange
					let  sConstraint = "1=1"; // dummy constraint to use the utility function for this test

					// act & assert
					runAndCheckForPeriods(sConstraint, null, null);
				});

				it('should delete lifecycle periods not between lowest and highest period id', () => {
					// arrange
					var iLowestPeriodId = 1404; // 2017
					var iHighestPeriodId = 1416; // 2018
					let sUserId = testData.sTestUser;
					let dTimestamp = new Date();
					let oLifecycleYearlyPeriodTypesForProject = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId, sProjectId],
						"YEAR": [2016, 2017, 2018, 2019],
						"PERIOD_TYPE": ["YEARLY", "YEARLY", "YEARLY", "YEARLY"],
						"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId]
					};
					let oLifecycleMonthlyPeriod = {
						"PROJECT_ID": [sProjectId, sProjectId, sProjectId, sProjectId],
						"YEAR": [2016, 2017, 2018, 2019],
						"SELECTED_MONTH": [1, 1, 1, 1],
						"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId]
					};
					var oLifecyclePeriodValues = {
						"PROJECT_ID": [ sProjectId, sProjectId, sProjectId, sProjectId],
						"CALCULATION_ID": [iCalculationId, iCalculationId, iCalculationId, iCalculationId],
						"LIFECYCLE_PERIOD_FROM": [ 1404, 1416, 1428, 1440],
						"VALUE": [ 100, 400, 700, 1000],
						"LAST_MODIFIED_ON": [ dTimestamp, dTimestamp, dTimestamp, dTimestamp],
						"LAST_MODIFIED_BY": [ sUserId, sUserId, sUserId, sUserId]
					};
					oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
					oMockstar.insertTableData("lifecycle_monthly_period", oLifecycleMonthlyPeriod);
					oMockstar.clearTable("lifecycle_period_quantities");
					oMockstar.insertTableData("lifecycle_period_quantities", oLifecyclePeriodValues);
					// => means all period values <1404 and >1416 must be deleted from lifecycle_period_value for calculation of project with id sProjectId
					var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
					var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");
					var iOriginalCount_ActivityPriceSurcharges = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges");
					var iOriginalCount_ActivityPriceSurchargeValues = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values");
					var iOriginalCount_MaterialPriceSurcharges = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharges");
					var iOriginalCount_MaterialPriceSurchargeValues = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values");

					// act
					var oResultObject = persistency.Project.deleteLifecyclePeriodsForProject(sProjectId, new Date('2017-01-01T00:00:00'), new Date('2018-01-01T00:00:00'));

					// assert       
					expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
					expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues - 2);
					expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges")).toBe(iOriginalCount_ActivityPriceSurcharges);
					expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values")).toBe(iOriginalCount_ActivityPriceSurchargeValues - 3);
					expect(mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharges")).toBe(iOriginalCount_MaterialPriceSurcharges);
					expect(mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values")).toBe(iOriginalCount_MaterialPriceSurchargeValues - 3);
					
				});
			});
			
			describe("deleteOneTimeCostRelatedData", () => {

				beforeEach(() => {
					oMockstar.clearAllTables();
					oMockstar.initializeData();
					persistency = new Persistency(jasmine.dbConnection);
					oMockstar.insertTableData("one_time_project_cost", testData.oProjectOneTimeProjectCost);
					oMockstar.insertTableData("one_time_product_cost", testData.oProjectOneTimeProductCost);
					oMockstar.insertTableData("one_time_cost_lifecycle_value", testData.oProjectOneTimeCostLifecycleValue);
				});

				
			
				it('should delete one time costs when deleting a calculation is moved to another project', function(){
					
					//arrange
					var iOriginalCount_Configurations = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
					var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");
					var iOriginalCount_OneTimeProducts = mockstarHelpers.getRowCount(oMockstar, "one_time_product_cost");
					var iOriginalCount_OneTimeLifecyleValues = mockstarHelpers.getRowCount(oMockstar, "one_time_cost_lifecycle_value");

					// act
					var oResultObject = persistency.Project.deleteOneTimeCostRelatedDataForProjectIdAndCalculationId(sProjectId, iCalculationId);

					// assert       
					expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_Configurations - 1);
					expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantities - 3);
					expect(mockstarHelpers.getRowCount(oMockstar, "one_time_product_cost")).toBe(iOriginalCount_OneTimeProducts - 3);
					expect(mockstarHelpers.getRowCount(oMockstar, "one_time_cost_lifecycle_value")).toBe(iOriginalCount_OneTimeLifecyleValues - 2);
				});

				it('should update cost not distributed for project when a calculation is moved to another project', function(){

					//arange
					var aExpectedCostNotDistributed = ['5100.0000000', '4200.0000000', '6300.0000000'];

					// act
					var oResultObject = persistency.Project.updateCostNotDistributedForOneTimeProjectCostWhenCalculationGetsDeleted(sProjectId, iCalculationId);
					
					//assert
					var aCostNotDistributed = oMockstar.execQuery(`SELECT COST_NOT_DISTRIBUTED from {{one_time_project_cost}} WHERE PROJECT_ID = '${sProjectId}'`).columns.COST_NOT_DISTRIBUTED.rows;
					expect(aCostNotDistributed).toEqual(aExpectedCostNotDistributed);
				});
			});
			
			describe("deleteTotalQuantitiesForProject", () => {
				
				beforeEach(() => {
					oMockstar.clearAllTables();
					oMockstar.initializeData();
					persistency = new Persistency(jasmine.dbConnection);
				});
				
				it('should delete project total quantities and associated values', function() {
					// arrange
					var iOriginalCount_Calculation = mockstarHelpers.getRowCount(oMockstar, "calculation", "project_id='"+sProjectId+"'");
					var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
					var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");

					// act
					var oResultObject = persistency.Project.deleteTotalQuantitiesForProject(sProjectId);

					// assert
					expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities - iOriginalCount_Calculation);
					expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues - 6);
				});

				it('should not delete project total quantities and associated values if user has no access rights for project', function() {
					// arrange
					oMockstar.clearTable("authorization");
					var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
					var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");

					// act
					var oResultObject = persistency.Project.deleteTotalQuantitiesForProject(sProjectId);

					// assert
					expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toEqual(iOriginalCount_TotalQuantities);
					expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toEqual(iOriginalCount_TotalQuantitiesValues);
				});

				it('should not delete total quantities if are not defined for a project', function() {
					// arrange
					var sProjectIdWithNoQuantities = testData.oProjectTestData.PROJECT_ID[2];
					var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
					var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");

					// act
					var oResultObject = persistency.Project.deleteTotalQuantitiesForProject(sProjectIdWithNoQuantities);

					// assert
					expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
					expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);
				});

			});

		});

		describe("getTotalQuantities", function() {

			var oMockstar = null;
			var persistency = null;
			var sUserId = $.session.getUsername();

			var oExpectedResultForCalculation = {
					"PROJECT_ID": [ "PR1", "PR1", "PR1" ],
					"CALCULATION_ID": [ testData.iCalculationId, testData.iCalculationId, testData.iCalculationId ],
					"CALCULATION_VERSION_ID": [ testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iCalculationVersionId ],
					"LAST_MODIFIED_ON": [ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate ],
					"LAST_MODIFIED_BY": [ testData.sTestUser, testData.sTestUser, testData.sTestUser ],
					"LIFECYCLE_PERIOD_FROM": [ 1404, 1416, 1428 ],
					"VALUE": [ '3000', '4000', '5000' ]
			};

			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						calculation : {
							name : mTableNames.calculation,
							data : testData.oCalculationTestData
						},
						calculation_version : {
							name : mTableNames.calculation_version,
							data : testData.oCalculationVersionTestData
						},
						calculation_version_temporary : {
							name : mTableNames.calculation_version_temporary,
							data : testData.oCalculationVersionTemporaryTestData
						},
						item : {
							name : mTableNames.item
						},
						authorization : {
							name : 'sap.plc.db::auth.t_auth_project',
							data : {
								PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1]],
								USER_ID      : [sUserId, sUserId],
								PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ]
							}
						},
						project_lifecycle_configuration: {
							name: "sap.plc.db::basis.t_project_lifecycle_configuration",
							data: testData.oProjectTotalQuantities
						},
						lifecycle_period_value: {
							name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
							data: testData.oLifecyclePeriodValues
						}
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				oMockstar.cleanup();
			});

			it("should get all defined total quantities for all calculations from a project", function() {
				// arrange
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var aExpectedCalculationIds =  [testData.iCalculationId, testData.iCalculationId, testData.iCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId];

				// act
				var aResult = persistency.Project.getTotalQuantities(sProjectId);

				// assert
				expect(aResult.length).toBe(6);
				expect(_.map(aResult, "CALCULATION_ID").sort()).toEqual([...aExpectedCalculationIds].sort());
			});

			it("should not return total quantities if are not defined for a project", function() {
				// arrange
				var sProjectId = testData.oProjectTestData.PROJECT_ID[2];

				// act
				var aResult = persistency.Project.getTotalQuantities(sProjectId);

				// assert
				expect(aResult.length).toBe(0);
			});

			it('should return only calculations/versions and UoMs of total quantities if the values of total quantities are not defined', function() {
				// arrange
				oMockstar.clearTable("lifecycle_period_value");
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var aExpectedCalculationIds = [ testData.iCalculationId, testData.iSecondCalculationId ];

				// act
				var aResult = persistency.Project.getTotalQuantities(sProjectId);

				// assert
				expect(aResult.length).toBe(2);
				expect(_.map(aResult, "CALCULATION_ID").sort()).toEqual([...aExpectedCalculationIds].sort());
			});

			it('should not return CALCULATION_VERSION_ID/NAME if total quantites are not assigned to a specific version', function() {
				// arrange
				oMockstar.clearTable("project_lifecycle_configuration");
				var oProjectTotalQuantities = {
						"PROJECT_ID": [ "PR1", "PR1", "PR3" ],
						"CALCULATION_ID": [ testData.iCalculationId, 2078, 5078 ],
						"CALCULATION_VERSION_ID": [ null, null, null ],
						"LAST_MODIFIED_ON": [ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate ],
						"LAST_MODIFIED_BY": [ sUserId, sUserId, sUserId ]
				};
				oMockstar.insertTableData("project_lifecycle_configuration", oProjectTotalQuantities);
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var aExpectedCalculationIds =  [testData.iCalculationId, testData.iCalculationId, testData.iCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId];
				var aExpectedCV = [ null, null, null, null, null, null ];

				// act
				var aResult = persistency.Project.getTotalQuantities(sProjectId);

				// assert
				expect(aResult.length).toBe(6);
                expect(_.map(aResult, "CALCULATION_ID").sort()).toEqual([...aExpectedCalculationIds].sort());
                expect(_.map(aResult, "CALCULATION_VERSION_ID").sort()).toEqual([...aExpectedCV].sort());
                expect(_.map(aResult, "CALCULATION_VERSION_NAME").sort()).toEqual([...aExpectedCV].sort());
			});

			it('should return TOTAL_QUANTITY_UOM_ID of the root item if CALCULATION_VERSION_ID is defined else return PC', function() {
				// arrange
				oMockstar.clearTable("project_lifecycle_configuration");
				var oProjectTotalQuantities = {
						"PROJECT_ID": [ "PR1", "PR1", "PR3" ],
						"CALCULATION_ID": [ testData.iCalculationId, 2078, 5078 ],
						"CALCULATION_VERSION_ID": [ testData.iCalculationVersionId, null, null ],
						"LAST_MODIFIED_ON": [ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate ],
						"LAST_MODIFIED_BY": [ sUserId, sUserId, sUserId ]
				};
				oMockstar.insertTableData("project_lifecycle_configuration", oProjectTotalQuantities);
				var oInsertItems = _.extend(_.omit(testData.oItemTestData, "TOTAL_QUANTITY_UOM_ID"), {
					"TOTAL_QUANTITY_UOM_ID" : ["H","H","H","H","H"]
				});
				oMockstar.insertTableData("item", oInsertItems);
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var aExpectedCalculationIds =  [testData.iCalculationId, testData.iCalculationId, testData.iCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId];
				var aExpectedCV = [ testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iCalculationVersionId, null, null, null ];
				var aExpectedUOMIds = [ 'H', 'H', 'H', 'PC', 'PC', 'PC' ];

				// act
				var aResult = persistency.Project.getTotalQuantities(sProjectId);

				// assert
				expect(aResult.length).toBe(6);
                expect(_.map(aResult, "CALCULATION_ID").sort()).toEqual([...aExpectedCalculationIds].sort());
                expect(_.map(aResult, "CALCULATION_VERSION_ID").sort()).toEqual([...aExpectedCV].sort());
                expect(_.map(aResult, "TOTAL_QUANTITY_UOM_ID").sort()).toEqual([...aExpectedUOMIds].sort());
			});
			
			it('should not return total quantities for a calculation that does not have a saved version yet', function() {
				// if a user creates a new calculation, the calculation is immediately inserted into t_calculation; but the inital version is only in
				// t_calculation_version_temporary until it's saved for the first time; such calculation shall not be delivered when getting total
				// quantities because the calculation might be discarded by user without saving it
				
				// arrange
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oTemporaryCalculation = new TestDataUtility(testData.oCalculationTestData).getObject(0);
				oTemporaryCalculation.CALCULATION_ID = 987654321;
				oTemporaryCalculation.CALCULATION_NAME = 'Temp CalculationName Without Version';
				oMockstar.insertTableData("calculation", oTemporaryCalculation);
				
				var oCvTemp = new TestDataUtility(testData.oCalculationVersionTemporaryTestData).getObject(0);
				oCvTemp.CALCULATION_VERSION_ID = 1234;
				oCvTemp.CALCULATION_ID = oTemporaryCalculation.CALCULATION_ID;
				oMockstar.insertTableData("calculation_version_temporary", oCvTemp);
				
				// act 
				var aResult = persistency.Project.getTotalQuantities(sProjectId);
				
				// assert
				expect(aResult.length).toBeGreaterThan(0);
				expect(_.includes(_.map(aResult, "CALCULATION_ID"), oTemporaryCalculation.CALCULATION_ID)).toBe(false);
			});
			
			it("should return a unique combination of CALCULATION_ID and LIFECYCLE_PERIOD_FROM", function(){
				// arrange
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				// add a calculation version to each calculation in the project, since this led to duplications 
				// in values
				var oVersionBuilder = new TestDataUtility(testData.oCalculationVersionTestData);
				var oCvFor1978 = oVersionBuilder.getObject(0);
				oCvFor1978.CALCULATION_ID = testData.oCalculationTestData.CALCULATION_ID[0];
				oCvFor1978.CALCULATION_VERSION_ID = 4347487;
				oCvFor1978.CALCULATION_VERSION_NAME = "Uniq calc vers name 1";
				var oCvFor2078 = oVersionBuilder.getObject(0);
				oCvFor2078.CALCULATION_ID = testData.oCalculationTestData.CALCULATION_ID[0];
				oCvFor2078.CALCULATION_VERSION_ID = 4332323;
				oCvFor2078.CALCULATION_VERSION_NAME = "Uniq calc vers name 2";
				oMockstar.insertTableData("calculation_version", [oCvFor1978, oCvFor2078]);
				
				// act
				var aResult = persistency.Project.getTotalQuantities(sProjectId);

				// assert
				var aLifecyclePeriodCalculationCombinations = [];
				_.each(aResult, (oResult) => {
					var oCombination = _.pick(oResult, ["CALCULATION_ID", "LIFECYCLE_PERIOD_FROM"]);
					var bCombinationAlreadyContained = _.some(aLifecyclePeriodCalculationCombinations, (oContained) =>{
							return 	oContained.CALCULATION_ID == oCombination.CALCULATION_ID 
									&& oContained.LIFECYCLE_PERIOD_FROM == oCombination.LIFECYCLE_PERIOD_FROM;
					});
					jasmine.log(`Expect ${JSON.stringify(oCombination)} to be unique`);
					expect(bCombinationAlreadyContained).toBe(false);
					aLifecyclePeriodCalculationCombinations.push(oCombination);
				});
			});
		});
		
		describe('createSurcharges', function() {

			var persistency = null;
			var oMockstar = null;
			var sUserId = $.session.getUsername();
			var sProjectId  = testData.oProjectTestData.PROJECT_ID[0];
			
			var aRequestActivityPriceSurcharges = [{
				"PLANT_ID":             		testData.oPlantTextTestDataPlc.PLANT_ID[0],
				"ACCOUNT_GROUP_ID":     		testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0],
				"COST_CENTER_ID":       		testData.oCostCenterTextTestDataPlc.COST_CENTER_ID[0],
				"ACTIVITY_TYPE_ID":     		testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_ID[0],
	            "PERIOD_VALUES":[
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0],
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[0].toString()
	            	},
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1],
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[1].toString()
	            	},
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2],
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[2].toString()
	            	}
	            ]
			}];	
			
			var aRequestMaterialPriceSurcharges = [{
				"PLANT_ID":             		testData.oPlantTextTestDataPlc.PLANT_ID[0],
				"ACCOUNT_GROUP_ID":     		testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0],
				"MATERIAL_GROUP_ID":       		testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_ID[0],
				"MATERIAL_TYPE_ID":     		testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_ID[0],
	            "PERIOD_VALUES":[
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0],
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[0].toString()
	            	},
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1],
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[1].toString()
	            	},
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2],
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[2].toString()
	            	}
				],
				"MATERIAL_ID":                   testData.oMaterialTestDataPlc.MATERIAL_ID[0]
			}];	


			beforeOnce(function() {
				oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							testmodel : {
							},
							substituteTables : {
								project : {
									name : mTableNames.project,
									data : testData.oProjectTestData
								},
								authorization : {
									name : 'sap.plc.db::auth.t_auth_project',
									data : {
										PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1]],
										USER_ID      : [sUserId, sUserId],
										PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ]
									}
								},
								project_activity_price_surcharges: {
									name: "sap.plc.db::basis.t_project_activity_price_surcharges",
									data: testData.oProjectActivityPriceSurcharges
								},
								project_activity_price_surcharge_values: {
									name: "sap.plc.db::basis.t_project_activity_price_surcharge_values",
									data: testData.oProjectActivityPriceSurchargeValues
								},
								project_material_price_surcharges: {
									name: "sap.plc.db::basis.t_project_material_price_surcharges",
									data: testData.oProjectMaterialPriceSurcharges
								},
								project_material_price_surcharge_values: {
									name: "sap.plc.db::basis.t_project_material_price_surcharge_values",
									data: testData.oProjectMaterialPriceSurchargeValues
								},								
							}
						});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				persistency = new Persistency(jasmine.dbConnection);
			});

			it('should create activity price surcharges --> db updated', function() {
				// arrange
				var aExpectedDefinitions = _.map(aRequestActivityPriceSurcharges, function(oDefinition){ return _.omit(oDefinition, ['PERIOD_VALUES'])});
				var aExpectedValues = _.map(aRequestActivityPriceSurcharges[0].PERIOD_VALUES, _.cloneDeep);
			
				// act
				var aResultObject = persistency.Project.createSurcharges(sProjectId, aRequestActivityPriceSurcharges, BusinessObjectTypes.ProjectActivityPriceSurcharges);

				// assert
				// check the values inserted
				var resultDefinitions = oMockstar.execQuery(`select PLANT_ID, ACCOUNT_GROUP_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID
						from {{project_activity_price_surcharges}} where project_id =  '${sProjectId}';`);
				expect(resultDefinitions).toMatchData(aExpectedDefinitions, [ "PLANT_ID", "ACCOUNT_GROUP_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID" ]);
					
				var resultValues = oMockstar.execQuery(`select surcharge_values.LIFECYCLE_PERIOD_FROM, surcharge_values.VALUE 
						from {{project_activity_price_surcharge_values}} as surcharge_values 
						inner join {{project_activity_price_surcharges}} as definitions 
							on surcharge_values.RULE_ID = definitions.RULE_ID  
						where definitions.project_id =  '${sProjectId}';`);
				expect(resultValues).toMatchData(aExpectedValues, [ "LIFECYCLE_PERIOD_FROM", "VALUE" ]);
			});
					
		it('should create different values for surcharge definitions with same periods --> db updated', function() {
			// arrange
			
			var aRequestBody = new TestDataUtility(aRequestActivityPriceSurcharges).build();
			var aSecondDefinion = new TestDataUtility(aRequestActivityPriceSurcharges).build();
			aSecondDefinion[0].PLANT_ID = '#PT9';
			aSecondDefinion[0].PERIOD_VALUES[0].VALUE = '100.0000000';
			aSecondDefinion[0].PERIOD_VALUES[1].VALUE = '200.0000000';
			aSecondDefinion[0].PERIOD_VALUES[2].VALUE = '300.0000000';
				
			aRequestBody.push(aSecondDefinion[0]);
			
			var aExpectedDefinitions = _.map(aRequestBody, function(oDefinition){ return _.omit(oDefinition, ['PERIOD_VALUES'])});
			var aExpectedValues = _.map(aRequestBody[0].PERIOD_VALUES, _.cloneDeep);
			aExpectedValues = aExpectedValues.concat(_.map(aRequestBody[1].PERIOD_VALUES, _.cloneDeep));
		
			// act
			var aResultObject = persistency.Project.createSurcharges(sProjectId, aRequestBody, BusinessObjectTypes.ProjectActivityPriceSurcharges);

			// assert
			// check the values inserted
			var resultDefinitions = oMockstar.execQuery(`select PLANT_ID, ACCOUNT_GROUP_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID
					from {{project_activity_price_surcharges}} where project_id =  '${sProjectId}';`);
			expect(resultDefinitions).toMatchData(aExpectedDefinitions, [ "PLANT_ID", "ACCOUNT_GROUP_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID" ]);
				
			var resultValues = oMockstar.execQuery(`select surcharge_values.LIFECYCLE_PERIOD_FROM, surcharge_values.VALUE 
					from {{project_activity_price_surcharge_values}} as surcharge_values 
					inner join {{project_activity_price_surcharges}} as definitions 
						on surcharge_values.RULE_ID = definitions.RULE_ID  
					where definitions.project_id =  '${sProjectId}';`);
			expect(resultValues).toMatchData(aExpectedValues, [ "LIFECYCLE_PERIOD_FROM", "VALUE" ]);
		});
					
		it('should create material price surcharges --> db updated', function() {
			// arrange
			var aExpectedDefinitions = _.map(aRequestMaterialPriceSurcharges, function(oDefinition){ return _.omit(oDefinition, ['PERIOD_VALUES'])});
			var aExpectedValues = _.map(aRequestMaterialPriceSurcharges[0].PERIOD_VALUES, _.cloneDeep);
		
			// act
			var aResultObject = persistency.Project.createSurcharges(sProjectId, aRequestMaterialPriceSurcharges, BusinessObjectTypes.ProjectMaterialPriceSurcharges);
			
			// assert
			// check the values inserted
			var resultDefinitions = oMockstar.execQuery(`select PLANT_ID, ACCOUNT_GROUP_ID, MATERIAL_GROUP_ID, MATERIAL_TYPE_ID, MATERIAL_ID
					from {{project_material_price_surcharges}} where project_id =  '${sProjectId}';`);
			expect(resultDefinitions).toMatchData(aExpectedDefinitions, [ "PLANT_ID", "ACCOUNT_GROUP_ID", "MATERIAL_GROUP_ID", "MATERIAL_TYPE_ID", "MATERIAL_ID" ]);
				
			var resultValues = oMockstar.execQuery(`select surcharge_values.LIFECYCLE_PERIOD_FROM, surcharge_values.VALUE 
					from {{project_material_price_surcharge_values}} as surcharge_values 
					inner join {{project_material_price_surcharges}} as definitions 
						on surcharge_values.RULE_ID = definitions.RULE_ID  
					where definitions.project_id =  '${sProjectId}';`);
			expect(resultValues).toMatchData(aExpectedValues, [ "LIFECYCLE_PERIOD_FROM", "VALUE" ]);
		});
			
		it('should not create surcharge definitions if surcharge definitions are empty', function() {
			// arrange
			var aEmptyDefinitions = [];
			
			// act
			var aResultObject = persistency.Project.createSurcharges(sProjectId, aEmptyDefinitions, BusinessObjectTypes.ProjectActivityPriceSurcharges);

			// assert

			// check the values inserted
			var resultDefinitions = oMockstar.execQuery(`select PLANT_ID, ACCOUNT_GROUP_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID
				from {{project_activity_price_surcharges}} where project_id =  '${sProjectId}';`);
			expect(resultDefinitions).toMatchData(aEmptyDefinitions, [ "PLANT_ID", "ACCOUNT_GROUP_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID" ]);
		
			var resultValues = oMockstar.execQuery(`select surcharge_values.LIFECYCLE_PERIOD_FROM, surcharge_values.VALUE 
				from {{project_activity_price_surcharge_values}} as surcharge_values 
				inner join {{project_activity_price_surcharges}} as definitions 
					on surcharge_values.RULE_ID = definitions.RULE_ID  
				where definitions.project_id =  '${sProjectId}';`);
			expect(resultValues).toMatchData([], [ "LIFECYCLE_PERIOD_FROM", "VALUE" ]);
		});			

		it('should not create surcharge values if PERIOD_VALUES is empty', function() {
				// arrange
				var aDefinitionsWithoutValues = _.map(aRequestActivityPriceSurcharges, function(oDefinition){ return _.omit(oDefinition, ['PERIOD_VALUES'])});
				var aExpectedDefinitions = aDefinitionsWithoutValues;
				var aExpectedValues = [];
				
				// act
				var aResultObject = persistency.Project.createSurcharges(sProjectId, aDefinitionsWithoutValues, BusinessObjectTypes.ProjectActivityPriceSurcharges);

				// assert

				// check the values inserted
				var resultDefinitions = oMockstar.execQuery(`select PLANT_ID, ACCOUNT_GROUP_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID
					from {{project_activity_price_surcharges}} where project_id =  '${sProjectId}';`);
				expect(resultDefinitions).toMatchData(aExpectedDefinitions, [ "PLANT_ID", "ACCOUNT_GROUP_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID" ]);
			
				var resultValues = oMockstar.execQuery(`select surcharge_values.LIFECYCLE_PERIOD_FROM, surcharge_values.VALUE 
					from {{project_activity_price_surcharge_values}} as surcharge_values 
					inner join {{project_activity_price_surcharges}} as definitions 
						on surcharge_values.RULE_ID = definitions.RULE_ID  
					where definitions.project_id =  '${sProjectId}';`);
				expect(resultValues).toMatchData(aExpectedValues, [ "LIFECYCLE_PERIOD_FROM", "VALUE" ]);
		});
	});

					
		describe('deleteSurchargesForProject', function() {
			var oMockstar = null;
			var persistency = null;
			var sUserId = $.session.getUsername();
			var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
			
			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						authorization : {
							name : 'sap.plc.db::auth.t_auth_project',
							data : {
								PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1]],
								USER_ID      : [sUserId, sUserId],
								PRIVILEGE    : [InstancePrivileges.FULL_EDIT, InstancePrivileges.FULL_EDIT]
							}
						},
						project_activity_price_surcharges: {
							name: "sap.plc.db::basis.t_project_activity_price_surcharges",
							data: testData.oProjectActivityPriceSurcharges
						},
						project_activity_price_surcharge_values: {
							name: "sap.plc.db::basis.t_project_activity_price_surcharge_values",
							data: testData.oProjectActivityPriceSurchargeValues
						},
						project_material_price_surcharges: {
							name: "sap.plc.db::basis.t_project_material_price_surcharges",
							data: testData.oProjectMaterialPriceSurcharges
						},
						project_material_price_surcharge_values: {
							name: "sap.plc.db::basis.t_project_material_price_surcharge_values",
							data: testData.oProjectMaterialPriceSurchargeValues
						}										
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				persistency = new Persistency(jasmine.dbConnection);
			});

			
			it('should delete activity price surcharge definitions and values for project', function() {
				// arrange
				let iOriginalCount_SurchargeDefinitions = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges");
				let iOriginalCount_SurchargeValues = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values");
				
				// act
				let oResultObject = persistency.Project.deleteSurchargesForProject(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges);
				
				// assert       
				expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges")).toBe(iOriginalCount_SurchargeDefinitions - 1);
				expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values")).toBe(iOriginalCount_SurchargeValues - 3);  
			});
			
			it('should delete material price surcharge definitions and values for project', function() {
				// arrange
				let iOriginalCount_SurchargeDefinitions = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharges");
				let iOriginalCount_SurchargeValues = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values");
				
				// act
				let oResultObject = persistency.Project.deleteSurchargesForProject(sProjectId, BusinessObjectTypes.ProjectMaterialPriceSurcharges);
				
				// assert       
				expect(mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharges")).toBe(iOriginalCount_SurchargeDefinitions - 1);
				expect(mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values")).toBe(iOriginalCount_SurchargeValues - 3);  
			});			
			
			it('should not delete project surcharge definitions and values if user has no access rights for project', function() {
				// arrange
				oMockstar.clearTable("authorization");
				let iOriginalCount_SurchargeDefinitions = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges");
				let iOriginalCount_SurchargeValues = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values");
				
				// act
				let oResultObject = persistency.Project.deleteSurchargesForProject(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges);
				
				// assert       
				expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges")).toEqual(iOriginalCount_SurchargeDefinitions);
				expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values")).toEqual(iOriginalCount_SurchargeValues);  
			});	
		});
			

		describe("getActivityPriceSurcharges", function() {
			var oMockstar = null;
			var persistency = null;
			var sUserId = $.session.getUsername();
			var sLanguage = 'EN';
			var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
			
			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						authorization : {
							name : 'sap.plc.db::auth.t_auth_project',
							data : {
								PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1]],
								USER_ID      : [sUserId, sUserId],
								PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ]
							}
						},
						project_activity_price_surcharges: {
							name: "sap.plc.db::basis.t_project_activity_price_surcharges",
							data: testData.oProjectActivityPriceSurcharges
						},
						project_activity_price_surcharge_values: {
							name: "sap.plc.db::basis.t_project_activity_price_surcharge_values",
							data: testData.oProjectActivityPriceSurchargeValues
						},
						account_group__text : {
							name: 'sap.plc.db::basis.t_account_group__text',
							data: testData.oAccountGroupTextTest
						},
						activity_type__text : {
							name: 'sap.plc.db::basis.t_activity_type__text',
							data: testData.oActivityTypeTextTestDataPlc
						},
						company_code : {
							name: 'sap.plc.db::basis.t_company_code',
							data: testData.oCompanyCodeTestDataPlc
						},							
						cost_center__text : {
							name: 'sap.plc.db::basis.t_cost_center__text',
							data: testData.oCostCenterTextTestDataPlc
						},
						plant : {
							name: 'sap.plc.db::basis.t_plant',
							data: testData.oPlantTestDataPlc
						},							
						plant__text : {
							name: 'sap.plc.db::basis.t_plant__text',
							data: testData.oPlantTextTestDataPlc
						}											
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				persistency = new Persistency(jasmine.dbConnection);
			});

			it("should get all defined surcharge values for the project", function() {
				// arrange
				// act
				let aResult = persistency.Project.getActivityPriceSurcharges(sProjectId, sLanguage);

				// assert
				let aExpectedActivityPriceSurcharges = {
					"PLANT_ID":             [testData.oPlantTextTestDataPlc.PLANT_ID[0], testData.oPlantTextTestDataPlc.PLANT_ID[0], testData.oPlantTextTestDataPlc.PLANT_ID[0]],
					"PLANT_DESCRIPTION":    [testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0], testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0], testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0]],
					"ACCOUNT_GROUP_ID":     [testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0]],
					"ACCOUNT_GROUP_DESCRIPTION": [testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0]],
					"COST_CENTER_ID":       [testData.oCostCenterTextTestDataPlc.COST_CENTER_ID[0], testData.oCostCenterTextTestDataPlc.COST_CENTER_ID[0], testData.oCostCenterTextTestDataPlc.COST_CENTER_ID[0]],
					// Not compared since the test data are not consistent for this case
               //     "COST_CENTER_DESCRIPTION":       [testData.oCostCenterTextTestDataPlc.COST_CENTER_DESCRIPTION[0], testData.oCostCenterTextTestDataPlc.COST_CENTER_DESCRIPTION[0], testData.oCostCenterTextTestDataPlc.COST_CENTER_DESCRIPTION[0]],
					"ACTIVITY_TYPE_ID":     [testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_ID[0],  testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_ID[0],  testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_ID[0]],
                    "ACTIVITY_TYPE_DESCRIPTION":     [testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_DESCRIPTION[0],  testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_DESCRIPTION[0],  testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_DESCRIPTION[0]],
					"LIFECYCLE_PERIOD_FROM": [testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0], testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1], testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2]],
					"VALUE":                [testData.oProjectActivityPriceSurchargeValues.VALUE[0], testData.oProjectActivityPriceSurchargeValues.VALUE[1], testData.oProjectActivityPriceSurchargeValues.VALUE[2]],
				};
				expect(aResult).toMatchData(aExpectedActivityPriceSurcharges, ["PLANT_ID", "LIFECYCLE_PERIOD_FROM"]);
			});
			
			function runEmptyDefinitionTest(sDefinitionValue){
				// arrange
				let aSurchargesWithEmptyDefinitions = new TestDataUtility(testData.oProjectActivityPriceSurcharges).build();
				// Set definition id to '*' for some definitions 
				aSurchargesWithEmptyDefinitions.PLANT_ID[0] = sDefinitionValue;
				aSurchargesWithEmptyDefinitions.ACTIVITY_TYPE_ID[0] = sDefinitionValue;
				aSurchargesWithEmptyDefinitions.COST_CENTER_ID[0] = sDefinitionValue;
				oMockstar.clearTable("project_activity_price_surcharges");
				oMockstar.insertTableData("project_activity_price_surcharges", aSurchargesWithEmptyDefinitions);

				// act
				let aResult = persistency.Project.getActivityPriceSurcharges(sProjectId, sLanguage);

				// assert
				let aExpectedActivityPriceSurcharges = {
					"PLANT_ID":             [aSurchargesWithEmptyDefinitions.PLANT_ID[0], aSurchargesWithEmptyDefinitions.PLANT_ID[0], aSurchargesWithEmptyDefinitions.PLANT_ID[0]],
					"PLANT_DESCRIPTION":    [null, null, null],
					"ACCOUNT_GROUP_ID":     [testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0]],
					"ACCOUNT_GROUP_DESCRIPTION": [testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0]],
					"COST_CENTER_ID":       [aSurchargesWithEmptyDefinitions.COST_CENTER_ID[0], aSurchargesWithEmptyDefinitions.COST_CENTER_ID[0], aSurchargesWithEmptyDefinitions.COST_CENTER_ID[0]],
                    "COST_CENTER_DESCRIPTION":[null, null, null],
					"ACTIVITY_TYPE_ID":     [aSurchargesWithEmptyDefinitions.ACTIVITY_TYPE_ID[0],  aSurchargesWithEmptyDefinitions.ACTIVITY_TYPE_ID[0],  aSurchargesWithEmptyDefinitions.ACTIVITY_TYPE_ID[0]],
                    "ACTIVITY_TYPE_DESCRIPTION":     [null,  null,  null],
					"LIFECYCLE_PERIOD_FROM": [testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0], testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1], testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2]],
					"VALUE":                [testData.oProjectActivityPriceSurchargeValues.VALUE[0], testData.oProjectActivityPriceSurchargeValues.VALUE[1], testData.oProjectActivityPriceSurchargeValues.VALUE[2]],
				};
				expect(aResult).toMatchData(aExpectedActivityPriceSurcharges, ["PLANT_ID", "LIFECYCLE_PERIOD_FROM"]);
			}
				
			it("should return definition description = null for definition id = '*'", function() {
				runEmptyDefinitionTest('*');
			});				
			
			it("should return definition description = null for definition id = ''", function() {
				runEmptyDefinitionTest('');
			});	
			
			it("should not return surcharge values if they are not defined for a project", function() {
				// arrange
				let sProjectId = testData.oProjectTestData.PROJECT_ID[2];

				// act
				let aResult = persistency.Project.getActivityPriceSurcharges(sProjectId, sLanguage);

				// assert
				expect(aResult.length).toBe(0);
			});				
		});	

		describe("getMaterialPriceSurcharges", function() {

			var oMockstar = null;
			var persistency = null;
			var sUserId = $.session.getUsername();
			var sLanguage = 'EN';
			var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
			
			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						authorization : {
							name : 'sap.plc.db::auth.t_auth_project',
							data : {
								PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1]],
								USER_ID      : [sUserId, sUserId],
								PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ]
							}
						},
						project_material_price_surcharges: {
							name: "sap.plc.db::basis.t_project_material_price_surcharges",
							data: testData.oProjectMaterialPriceSurcharges
						},
						project_material_price_surcharge_values: {
							name: "sap.plc.db::basis.t_project_material_price_surcharge_values",
							data: testData.oProjectMaterialPriceSurchargeValues
						},
						account_group__text : {
							name: 'sap.plc.db::basis.t_account_group__text',
							data: testData.oAccountGroupTextTest
						},
						material_type__text : {
							name: 'sap.plc.db::basis.t_material_type__text',
							data: testData.oMaterialTypeTextTestDataPlc
						},
						company_code : {
							name: 'sap.plc.db::basis.t_company_code',
							data: testData.oCompanyCodeTestDataPlc
						},							
						material_group__text : {
							name: 'sap.plc.db::basis.t_material_group__text',
							data: testData.oMaterialGroupTextTestDataPlc
						},
						plant : {
							name: 'sap.plc.db::basis.t_plant',
							data: testData.oPlantTestDataPlc
						},							
						plant__text : {
							name: 'sap.plc.db::basis.t_plant__text',
							data: testData.oPlantTextTestDataPlc
						}											
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				persistency = new Persistency(jasmine.dbConnection);
			});

			it("should get all defined surcharge values for the project", function() {
				// arrange
				// act
				var aResult = persistency.Project.getMaterialPriceSurcharges(sProjectId, sLanguage);
				
				// assert
				var aExpectedPriceSurcharges = {
					"PLANT_ID":             	[testData.oPlantTextTestDataPlc.PLANT_ID[0], testData.oPlantTextTestDataPlc.PLANT_ID[0], testData.oPlantTextTestDataPlc.PLANT_ID[0]],
					"PLANT_DESCRIPTION":    	[testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0], testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0], testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0]],
					"ACCOUNT_GROUP_ID":     	[testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0]],
					"ACCOUNT_GROUP_DESCRIPTION":[testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0]],
					"MATERIAL_GROUP_ID":       	[testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_ID[0],testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_ID[0],testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_ID[0]],
                    "MATERIAL_GROUP_DESCRIPTION":[testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_DESCRIPTION[0],testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_DESCRIPTION[0],testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_DESCRIPTION[0]],
					"MATERIAL_TYPE_ID":     	[testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_ID[0], testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_ID[0], testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_ID[0]],
                    "MATERIAL_TYPE_DESCRIPTION":[testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_DESCRIPTION[0], testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_DESCRIPTION[0], testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_DESCRIPTION[0]],
					"LIFECYCLE_PERIOD_FROM": 	[testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0], testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1], testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2]],
					"VALUE":                	[testData.oProjectActivityPriceSurchargeValues.VALUE[0], testData.oProjectActivityPriceSurchargeValues.VALUE[1], testData.oProjectActivityPriceSurchargeValues.VALUE[2]],
				};
				expect(aResult).toMatchData(aExpectedPriceSurcharges, ["PLANT_ID", "LIFECYCLE_PERIOD_FROM"]);
			});
			
			function runEmptyDefinitionTest(sDefinitionValue){
				// arrange
				let aSurchargesWithEmptyDefinitions = new TestDataUtility(testData.oProjectMaterialPriceSurcharges).build();
				// Set definition id to '*' for some definitions 
				aSurchargesWithEmptyDefinitions.PLANT_ID[0] = sDefinitionValue;
				aSurchargesWithEmptyDefinitions.MATERIAL_GROUP_ID[0] = sDefinitionValue;
				aSurchargesWithEmptyDefinitions.MATERIAL_TYPE_ID[0] = sDefinitionValue;
				oMockstar.clearTable("project_material_price_surcharges");
				oMockstar.insertTableData("project_material_price_surcharges", aSurchargesWithEmptyDefinitions);

				// act
				let aResult = persistency.Project.getMaterialPriceSurcharges(sProjectId, sLanguage);

				// assert
				let aExpectedActivityPriceSurcharges = {
					"PLANT_ID":             [aSurchargesWithEmptyDefinitions.PLANT_ID[0], aSurchargesWithEmptyDefinitions.PLANT_ID[0], aSurchargesWithEmptyDefinitions.PLANT_ID[0]],
					"PLANT_DESCRIPTION":    [null, null, null],
					"ACCOUNT_GROUP_ID":     [testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0]],
					"ACCOUNT_GROUP_DESCRIPTION": [testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0], testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0]],
					"MATERIAL_GROUP_ID":       [aSurchargesWithEmptyDefinitions.MATERIAL_GROUP_ID[0], aSurchargesWithEmptyDefinitions.MATERIAL_GROUP_ID[0], aSurchargesWithEmptyDefinitions.MATERIAL_GROUP_ID[0]],
                    "MATERIAL_GROUP_DESCRIPTION":[null, null, null],
					"MATERIAL_TYPE_ID":     [aSurchargesWithEmptyDefinitions.MATERIAL_TYPE_ID[0],  aSurchargesWithEmptyDefinitions.MATERIAL_TYPE_ID[0],  aSurchargesWithEmptyDefinitions.MATERIAL_TYPE_ID[0]],
                    "MATERIAL_TYPE_DESCRIPTION":     [null,  null,  null],
					"LIFECYCLE_PERIOD_FROM": [testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0], testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1], testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2]],
					"VALUE":                [testData.oProjectActivityPriceSurchargeValues.VALUE[0], testData.oProjectActivityPriceSurchargeValues.VALUE[1], testData.oProjectActivityPriceSurchargeValues.VALUE[2]],
				};
				expect(aResult).toMatchData(aExpectedActivityPriceSurcharges, ["PLANT_ID", "LIFECYCLE_PERIOD_FROM"]);
			}
				
			it("should return definition description = null for definition id = '*'", function() {
				runEmptyDefinitionTest('*');
			});				
			
			it("should return definition description = null for definition id = ''", function() {
				runEmptyDefinitionTest('');
			});	
			
			it("should not return surcharge values if they are not defined for a project", function() {
				// arrange
				let sProjectId = testData.oProjectTestData.PROJECT_ID[2];

				// act
				let aResult = persistency.Project.getMaterialPriceSurcharges(sProjectId, sLanguage);

				// assert
				expect(aResult.length).toBe(0);
			});				
		});					

		describe("getOverlappingAccountsInProjectSurcharges", function() {

			var oMockstar = null;
			var persistency = null;
			var sUserId = $.session.getUsername();
			var sProjectId  = testData.oProjectTestData.PROJECT_ID[0];
			
			var oAccountGroupTest = {
					"ACCOUNT_GROUP_ID" : [700],
					"CONTROLLING_AREA_ID" : ['1000'],
					"COST_PORTION" : [7],
					"_VALID_FROM" : ["2015-01-01T00:00:00.000Z"],
					"_VALID_TO" : [null],
					"_SOURCE" : [1],
					"_CREATED_BY" : [sUserId]
			};
			
			beforeOnce(function() {
				oMockstar = new MockstarFacade({
					substituteTables : {
							project : {
								name : mTableNames.project,
								data : testData.oProjectTestData
							},
							authorization : {
								name : 'sap.plc.db::auth.t_auth_project',
								data : {
									PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1]],
									USER_ID      : [sUserId, sUserId],
									PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ]
								}
							},
							project_activity_price_surcharges: {
								name: "sap.plc.db::basis.t_project_activity_price_surcharges",
								data: testData.oProjectActivityPriceSurcharges
							},
							project_material_price_surcharges: {
								name: "sap.plc.db::basis.t_project_material_price_surcharges",
								data: testData.oProjectMaterialPriceSurcharges
							},								
							account_group : {
								name: 'sap.plc.db::basis.t_account_group',
								data: oAccountGroupTest
							},							
							account_account_group : {
								name: 'sap.plc.db::basis.t_account_account_group',
								data: testData.oAccountAccountGroupTestData
							},
							account : {
								name: 'sap.plc.db::basis.t_account',
								data: testData.oAccountTestDataPlc
							}										
						}
					});
				});

				beforeEach(function() {
					oMockstar.clearAllTables();
					oMockstar.initializeData();
					persistency = new Persistency(jasmine.dbConnection);
				});

				afterOnce(function() {
					oMockstar.cleanup();
				});

				it("should return no rows if no overlapping account groups for the project", function() {
					// act
					var aResult = persistency.Project.getOverlappingAccountsInProjectSurcharges(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges);

					// assert
					
					expect(aResult.length).toBe(0);
				});
				
				it("should return no rows if no overlapping account groups for the project for ProjectMaterialPriceSurcharges business object", function() {
					// act
					var aResult = persistency.Project.getOverlappingAccountsInProjectSurcharges(sProjectId, BusinessObjectTypes.ProjectMaterialPriceSurcharges);

					// assert
					
					expect(aResult.length).toBe(0);
				});
					
				function createOverlappingAccounts(){
					// Insert surcharge definition containing account group with overlapping account 
					let oAccountGroupWithOverlap = new TestDataUtility(oAccountGroupTest).build(); 
					oAccountGroupWithOverlap.ACCOUNT_GROUP_ID[0] = 900;
					oMockstar.insertTableData("account_group", oAccountGroupWithOverlap);
					
					let oAccountWithOverlap = new TestDataUtility(testData.oAccountAccountGroupTestData).getObject(0); 
					oAccountWithOverlap.ACCOUNT_GROUP_ID = 900;
					oAccountWithOverlap.FROM_ACCOUNT_ID = "0",
					oAccountWithOverlap.TO_ACCOUNT_ID = "1",
					oMockstar.insertTableData("account_account_group", oAccountWithOverlap);
					
					let oProjectActivityPriceSurchargeOverlap = new TestDataUtility(testData.oProjectActivityPriceSurcharges).getObject(0); 
					oProjectActivityPriceSurchargeOverlap.ACCOUNT_GROUP_ID = 900;
					oMockstar.insertTableData("project_activity_price_surcharges", oProjectActivityPriceSurchargeOverlap);
				}
				
				it("should return overlapping account groups and accounts", function() {
					// arrange
					createOverlappingAccounts();

					// act
					var aResult = persistency.Project.getOverlappingAccountsInProjectSurcharges(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges);

					// assert
					// assert
					var aExpectedOverlappingAccountAndGroups = {
						"ACCOUNT_ID":       ["0", "0"],
						"ACCOUNT_GROUP_ID": [testData.oAccountGroupTest.ACCOUNT_GROUP_ID[0], 900],
					};
					expect(aResult).toMatchData(aExpectedOverlappingAccountAndGroups, ["ACCOUNT_ID", "ACCOUNT_GROUP_ID"]);
				});	
					
				it("should return overlapping account groups and accounts only for project and current user", function() {
					// arrange
					createOverlappingAccounts();
					
					// Insert another user for a project
					oMockstar.insertTableData("authorization", {
						PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0]],
						USER_ID      : ["User_A"],
						PRIVILEGE    : [InstancePrivileges.READ]
					});

					// act
					var aResult = persistency.Project.getOverlappingAccountsInProjectSurcharges(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges);

					// assert
					var aExpectedOverlappingAccountAndGroups = {
						"ACCOUNT_ID":       ["0", "0"],
						"ACCOUNT_GROUP_ID": [testData.oAccountGroupTest.ACCOUNT_GROUP_ID[0], 900],
					};
					expect(aResult).toMatchData(aExpectedOverlappingAccountAndGroups, ["ACCOUNT_ID", "ACCOUNT_GROUP_ID"]);
				});		
				
				it("should return overlapping account groups and accounts if account_account_group.to_account_id is null", function() {
					// arrange
					createOverlappingAccounts();
					oMockstar.execSingle(`update {{account_account_group}} set to_account_id = null where account_group_id = 900`);

					// act
					var aResult = persistency.Project.getOverlappingAccountsInProjectSurcharges(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges);

					// assert
					// assert
					var aExpectedOverlappingAccountAndGroups = {
						"ACCOUNT_ID":       ["0", "0"],
						"ACCOUNT_GROUP_ID": [testData.oAccountGroupTest.ACCOUNT_GROUP_ID[0], 900],
					};
					expect(aResult).toMatchData(aExpectedOverlappingAccountAndGroups, ["ACCOUNT_ID", "ACCOUNT_GROUP_ID"]);
				});	
		});

		describe("checkProjectIdSameAsSourceEntityId", () => {
			let oMockstar = null;
			let oPersistency = null;
			const iWrongProjectEntityId = 100;

			beforeOnce(() => {
				oMockstar = new MockstarFacade({
					substituteTables: {
						folder: {
							name: mTableNames.folder,
							data: testData.oFoldersTestData,
						},
						project : {
							name : mTableNames.project,
							data : testData.oProjectTestData
						},
						entity_relation : {
							name : mTableNames.entity_relation,
							data : testData.oEntityRelationTestData
						}
					},
					csvPackage : testData.sCsvPackage
				});
			});
	
			beforeEach(() => {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oPersistency = new Persistency(jasmine.dbConnection);
			});
	
			it("should throw an exception if the project entity id does not match the requested source entity id", () => {
				let exception;
				// act
				try {
					oPersistency.Project.checkProjectIdSameAsSourceEntityId(testData.oProjectTestData.PROJECT_ID[0], iWrongProjectEntityId);
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
		});

		describe("createYearlyLifecyclePeriodTypesForProject", () => {
			let oMockstar = null;
			let oPersistency = null;
			beforeOnce(() => {
				oMockstar = new MockstarFacade({
					substituteTables: {
						project_lifecycle_period_type: {
							name: "sap.plc.db::basis.t_project_lifecycle_period_type"
						},
						project_monthly_lifecycle_period: {
							name: "sap.plc.db::basis.t_project_monthly_lifecycle_period"
						}
					}
				});
			});

			beforeEach(() => {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oPersistency = new Persistency(jasmine.dbConnection);
			});

			it("should create valid YEARLY entries", () => {
				// arrange
				let sDummyProject = "#PJ1";

				// act
				oPersistency.Project.createYearlyLifecyclePeriodTypesForProject(sDummyProject, 2020, 2022);

				// assert
				var oResult = oMockstar.execQuery(`select * from {{project_lifecycle_period_type}} where project_id = '${sDummyProject}' order by year;`);
				expect(oResult.columns.YEAR.rows).toEqual([2020, 2021, 2022]);
				expect(oResult.columns.PERIOD_TYPE.rows).toEqual(['YEARLY', 'YEARLY', 'YEARLY']);
				expect(oResult.columns.IS_YEAR_SELECTED.rows).toEqual([1, 1, 1]);

				var oResultMonthlyPeriods = oMockstar.execQuery(`select * from {{project_monthly_lifecycle_period}} where project_id = '${sDummyProject}' order by year;`);
				expect(oResultMonthlyPeriods.columns.YEAR.rows).toEqual([2020, 2021, 2022]);
				expect(oResultMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([1, 1, 1]);
				expect(oResultMonthlyPeriods.columns.MONTH_DESCRIPTION.rows).toEqual(['01', '01', '01']);
			});
		});

		describe("addLifecyclePeriodTypeForProject", () => {
			let oMockstar = null;
			let oPersistency = null;

			let dTimestamp = new Date();
			let sUserId = $.session.getUsername();
			let sDummyProject = "#PJ1";
			let iDbStartYear  = 1440; //2020
			let iDbEndYear = 1500; //2025

			let oLifecycleYearlyPeriodTypesForProject = {
				"PROJECT_ID": [sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject],
				"YEAR": [2020, 2021, 2022, 2023, 2024, 2025],
				"PERIOD_TYPE": ["YEARLY", "YEARLY", "YEARLY", "YEARLY", "YEARLY", "YEARLY"],
				"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
				"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId, sUserId]
			};

			beforeOnce(() => {
				oMockstar = new MockstarFacade({
					substituteTables: {
						project_lifecycle_period_type: {
							name: "sap.plc.db::basis.t_project_lifecycle_period_type",
							data: oLifecycleYearlyPeriodTypesForProject
						},
						project_monthly_lifecycle_period: {
							name: 'sap.plc.db::basis.t_project_monthly_lifecycle_period'
						},
						project: {
							name: 'sap.plc.db::basis.t_project'
						}
					}
				});
			});

			beforeEach(() => {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oPersistency = new Persistency(jasmine.dbConnection);
			});

			it('should update lifecycle period types when the start/end date change - scenario 1', () => {
				// arrange
				let newStartYear = 1428; //2019
				let newEndYear = 1488; //2024

				let oProject = {
					PROJECT_ID: sDummyProject,
					START_OF_PROJECT: new Date(newStartYear / 12 + 1900, 0, 1),
					END_OF_PROJECT: new Date(newEndYear / 12 + 1900, 0, 1)
				};

				// act
				oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, newStartYear, newEndYear, iDbStartYear, iDbEndYear);

				// assert
				var oResult = oMockstar.execQuery(`select * from {{project_lifecycle_period_type}} where project_id = '${sDummyProject}' order by year;`);
				expect(oResult.columns.YEAR.rows).toEqual([2019, 2020, 2021, 2022, 2023, 2024, 2025]);
			});
			it('should update lifecycle period types when the start/end date change - scenario 2', () => {
				// arrange
				let newStartYear = 1440; //2020
				let newEndYear = 1512; //2026

				let oProject = {
					PROJECT_ID: sDummyProject,
					START_OF_PROJECT: new Date(newStartYear / 12 + 1900, 0, 1),
					END_OF_PROJECT: new Date(newEndYear / 12 + 1900, 0, 1)
				};

				// act
				oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, newStartYear, newEndYear, iDbStartYear, iDbEndYear);

				// assert
				var oResult = oMockstar.execQuery(`select * from {{project_lifecycle_period_type}} where project_id = '${sDummyProject}' order by year;`);
				expect(oResult.columns.YEAR.rows).toEqual([2020, 2021, 2022, 2023, 2024, 2025, 2026]);
			});
			it('should update lifecycle period types when the start/end date change - scenario 3', () => {
				// arrange
				let newStartYear = 1452; //2021
				let newEndYear = 1488; //2024

				let oProject = {
					PROJECT_ID: sDummyProject,
					START_OF_PROJECT: new Date(newStartYear / 12 + 1900, 0, 1),
					END_OF_PROJECT: new Date(newEndYear / 12 + 1900, 0, 1)
				};

				// act
				oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, newStartYear, newEndYear, iDbStartYear, iDbEndYear);

				// assert
				var oResult = oMockstar.execQuery(`select * from {{project_lifecycle_period_type}} where project_id = '${sDummyProject}' order by year;`);
				expect(oResult.columns.YEAR.rows).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
			});
			it('should update lifecycle period types when the start/end date change - scenario 4', () => {
				// arrange
				let newStartYear = 1428; //2019
				let newEndYear = 1512; //2026

				let oProject = {
					PROJECT_ID: sDummyProject,
					START_OF_PROJECT: new Date(newStartYear / 12 + 1900, 0, 1),
					END_OF_PROJECT: new Date(newEndYear / 12 + 1900, 0, 1)
				};

				// act
				oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, newStartYear, newEndYear, iDbStartYear, iDbEndYear);

				// assert
				var oResult = oMockstar.execQuery(`select * from {{project_lifecycle_period_type}} where project_id = '${sDummyProject}' order by year;`);
				expect(oResult.columns.YEAR.rows).toEqual([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
			});
			it('should correctly create periods on updating the dates and when the start year is of type quarterly and the end year is of type monthly', () => {
				// arrange
				let oLifecycleYearlyPeriodTypesTestData = {
					"PROJECT_ID": [sDummyProject, sDummyProject, sDummyProject],
					"YEAR": [2020, 2021, 2022],
					"PERIOD_TYPE": ["QUARTERLY", "YEARLY", "MONTHLY"],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
				};
				let oMonthlyPeriodTestData = {
					"PROJECT_ID": [sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject],
					"YEAR": [2020, 2020, 2020, 2021, 2022, 2022, 2022, 2022, 2022, 2022],
					"SELECTED_MONTH": [4, 7, 10, 1, 1, 2, 3, 4, 5, 6],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId]
				};
				
				oMockstar.clearTable("project_lifecycle_period_type");
				oMockstar.insertTableData("project_lifecycle_period_type", oLifecycleYearlyPeriodTypesTestData);
				oMockstar.insertTableData("project_monthly_lifecycle_period", oMonthlyPeriodTestData);
				oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-06-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-06-01T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sDummyProject}';`);

				let oProject = {
					PROJECT_ID: sDummyProject,
					START_OF_PROJECT: new Date(2020, 1, 1), //1st of February 2020
					END_OF_PROJECT: new Date(2022, 9, 1) //1st of October 2022
				};
				let newStartYear = 1440 + 1; // 2020, february
				let newEndYear = 1464 + 9; // 2022, october
				let iDbStartYear = 1440 + 5; // 2020, june
				let iDbEndYear = 1464 + 5; // 2022, june

				// act
				oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, newStartYear, newEndYear, iDbStartYear, iDbEndYear);

				// assert
				let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{project_monthly_lifecycle_period}} WHERE PROJECT_ID = '${sDummyProject}' ORDER BY year, selected_month;`);
				expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([1, 4, 7, 10, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
				expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2020, 2020, 2020, 2020, 2021, 2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022]);
			});
			it('should correctly create periods on updating the dates and when the start year is of type monthly and the end year is of type quarterly', () => {
				// arrange
				let oLifecycleYearlyPeriodTypesTestData = {
					"PROJECT_ID": [sDummyProject, sDummyProject, sDummyProject],
					"YEAR": [2020, 2021, 2022],
					"PERIOD_TYPE": ["MONTHLY", "YEARLY", "QUARTERLY"],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
				};
				let oMonthlyPeriodTestData = {
					"PROJECT_ID": [sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject],
					"YEAR": [2020, 2020, 2020, 2020, 2020, 2020, 2020, 2021, 2022, 2022],
					"SELECTED_MONTH": [6, 7, 8, 9, 10, 11, 12, 1, 1, 4],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId]
				};
				
				oMockstar.clearTable("project_lifecycle_period_type");
				oMockstar.insertTableData("project_lifecycle_period_type", oLifecycleYearlyPeriodTypesTestData);
				oMockstar.insertTableData("project_monthly_lifecycle_period", oMonthlyPeriodTestData);
				oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-06-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-06-01T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sDummyProject}';`);

				let oProject = {
					PROJECT_ID: sDummyProject,
					START_OF_PROJECT: new Date(2020, 1, 1), //1st of February 2020
					END_OF_PROJECT: new Date(2022, 9, 1) //1st of October 2022
				};
				let newStartYear = 1440 + 1; // 2020, february
				let newEndYear = 1464 + 9; // 2022, october
				let iDbStartYear = 1440 + 5; // 2020, june
				let iDbEndYear = 1464 + 5; // 2022, june

				// act
				oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, newStartYear, newEndYear, iDbStartYear, iDbEndYear);

				// assert
				let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{project_monthly_lifecycle_period}} WHERE PROJECT_ID = '${sDummyProject}' ORDER BY year, selected_month;`);
				expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 1, 4, 7, 10]);
				expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2021, 2022, 2022, 2022, 2022]);
			});
			it('should correctly create periods on updating the year of the dates and when the start year is of type monthly and the end year is of type quarterly', () => {
				// arrange
				let oLifecycleYearlyPeriodTypesTestData = {
					"PROJECT_ID": [sDummyProject, sDummyProject, sDummyProject],
					"YEAR": [2020, 2021, 2022],
					"PERIOD_TYPE": ["MONTHLY", "YEARLY", "QUARTERLY"],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
				};
				let oMonthlyPeriodTestData = {
					"PROJECT_ID": [sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject, sDummyProject],
					"YEAR": [2020, 2020, 2020, 2020, 2020, 2020, 2020, 2021, 2022, 2022],
					"SELECTED_MONTH": [6, 7, 8, 9, 10, 11, 12, 1, 1, 4],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId, sUserId]
				};
				
				oMockstar.clearTable("project_lifecycle_period_type");
				oMockstar.insertTableData("project_lifecycle_period_type", oLifecycleYearlyPeriodTypesTestData);
				oMockstar.insertTableData("project_monthly_lifecycle_period", oMonthlyPeriodTestData);
				oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-06-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-06-01T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sDummyProject}';`);

				let oProject = {
					PROJECT_ID: sDummyProject,
					START_OF_PROJECT: new Date(2019, 1, 1), //1st of February 2019
					END_OF_PROJECT: new Date(2023, 9, 1) //1st of October 2023
				};
				let newStartYear = 1428 + 1; // 2019, february
				let newEndYear = 1476 + 9; // 2023, october
				let iDbStartYear = 1440 + 5; // 2020, june
				let iDbEndYear = 1464 + 5; // 2022, june

				// act
				oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, newStartYear, newEndYear, iDbStartYear, iDbEndYear);

				// assert
				let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{project_monthly_lifecycle_period}} WHERE PROJECT_ID = '${sDummyProject}' ORDER BY year, selected_month;`);
				expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 1, 4, 7, 10, 1]);
				expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2019, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2021, 2022, 2022, 2022, 2022, 2023]);
			});
		});
	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}