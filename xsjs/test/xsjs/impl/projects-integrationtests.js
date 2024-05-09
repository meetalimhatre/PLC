var _                        = require("lodash");
var helpers                  = require("../../../lib/xs/util/helpers");
var mockstarHelpers          = require("../../testtools/mockstar_helpers");
var testData                 = require("../../testdata/testdata").data;
var testHelpers              = require("../../testtools/test_helpers");
var TestDataUtility          = require("../../testtools/testDataUtility").TestDataUtility;

var PersistencyImport        = $.import("xs.db", "persistency");
var CalculationImport        = $.import("xs.db", "persistency-calculation");
var ProjectService           = require("../../../lib/xs/service/projectService");
var MockstarFacade           = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency              = PersistencyImport.Persistency;
var DispatcherLibrary        = require("../../../lib/xs/impl/dispatcher");
var Dispatcher               = DispatcherLibrary.Dispatcher;
var oCtx                     = DispatcherLibrary.prepareDispatch($);
const Constants              = require("../../../lib/xs/util/constants");
const ServiceParameters      = Constants.ServiceParameters;
const TaskType               = Constants.TaskType;
const TaskStatus             = Constants.TaskStatus;
const FollowUp               = Constants.FollowUp;
const InstancePrivileges     = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const LifecycleInterval      = Constants.LifecycleInterval;
const oCostText              = [{"oneTimeCostItemDescription":"Verteilte Kosten"}];

var MessageLibrary           = require("../../../lib/xs/util/message");
const { test } = require("xregexp");
var messageCode              = MessageLibrary.Code;
const sDefaultPriceDeterminationStrategy = testData.sStandardPriceStrategy;


describe('xsjs.impl.projects-integrationtests', function() {
	var oMockstar = null;

	var oDefaultResponseMock = null;
	var oPersistency = null;
	var sUserId = testData.sTestUser;
	var sSessionId = testData.sSessionId;

	var oTestCalculation = mockstarHelpers.convertToObject(testData.oCalculationTestData, 0);
	var oTestCalculationVersion = mockstarHelpers.convertToObject(testData.oCalculationVersionTestData, 0);

	let dTimestamp = new Date();
	let oLifecycleYearlyPeriodTypesForProject = {
		"PROJECT_ID": ["PR1", "PR1", "PR1", "PR1", "PR1", "PR1"],
		"YEAR": [2020, 2021, 2022, 2023, 2024, 2025],
		"PERIOD_TYPE": ["CUSTOM", "YEARLY", "YEARLY", "YEARLY", "YEARLY", "QUARTERLY"],
		"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
		"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId, sUserId]
	};
	let oLifecycleMonthlyPeriod = {
		"PROJECT_ID": ["PR1", "PR1", "PR1", "PR1", "PR1", "PR1"],
		"YEAR": [2020, 2020, 2025, 2025, 2025, 2025, 2025],
		"SELECTED_MONTH": [1, 6, 1, 3, 6, 9, 12],
		"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
		"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId, sUserId]
	};
	let oLifecyclePeriodValue = {
		"PROJECT_ID": ["PR1", "PR1", "PR1", "PR1", "PR1", "PR1"],
		"CALCULATION_ID": [1978, 1978, 1978, 1978, 1978, 1978],
		"LIFECYCLE_PERIOD_FROM": [1440, 1445, 1500, 1502, 1505, 1508],
		"VALUE": [1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000],
		"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
		"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId, sUserId]
	};

	let oLifecyclePeriodValue2 = {
		"PROJECT_ID": ["PR1", "PR1", "PR1"],
		"CALCULATION_ID": [ 2809, 2809, 2809],
		"LIFECYCLE_PERIOD_FROM": [ 1445, 1500, 1502],
		"VALUE": [ 1.0000000, 1.0000000, 1.0000000],
		"LAST_MODIFIED_ON": [ dTimestamp, dTimestamp, dTimestamp],
		"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
	};

	beforeOnce(function() {

		oMockstar = new MockstarFacade(
				{
					testmodel : {
						"project_delete" : "sap.plc.db.calculationmanager.procedures/p_project_delete",
						"project_read" : "sap.plc.db.calculationmanager.procedures/p_project_read",
					},
					substituteViews : {
						entity_relation_view:{
							name: 'sap.plc.db.views::entity_relation_view',
							testTable: 'sap.plc.db.views::entity_relation_view'
						} 	
					},
					substituteTables : {
						project : 'sap.plc.db::basis.t_project',
						folder: {
							name : 'sap.plc.db::basis.t_folder',
							data : testData.oFoldersTestData
						},
						entity_relation: {
							name : 'sap.plc.db::basis.t_entity_relation',
							data : testData.oEntityRelationTestData
						},
						total_quantities : 'sap.plc.db::basis.t_project_lifecycle_configuration',
						authorization: "sap.plc.db::auth.t_auth_project",
						open_projects : 'sap.plc.db::basis.t_open_projects',
						activity_price: 'sap.plc.db::basis.t_activity_price',
						default_settings : "sap.plc.db::basis.t_default_settings",	
	                    calculation: "sap.plc.db::basis.t_calculation",
	                    calculation_version: "sap.plc.db::basis.t_calculation_version",
	                    item: "sap.plc.db::basis.t_item",
	                    item_temporary: "sap.plc.db::basis.t_item_temporary",
	                    item_ext: "sap.plc.db::basis.t_item_ext",
	                    open_calculation_version : "sap.plc.db::basis.t_open_calculation_versions",
	                    calculation_version_temporary : "sap.plc.db::basis.t_calculation_version_temporary",
						task : "sap.plc.db::basis.t_task",
						timeout: "sap.plc.db::basis.t_application_timeout",
						user_authorization: "sap.plc.db::auth.t_auth_user",
						session : {
							name : CalculationImport.Tables.session,
							data : {
								SESSION_ID : [ sSessionId ],
								USER_ID : [ sUserId ],
								LANGUAGE : [ testData.sDefaultLanguage ],
								LAST_ACTIVITY_TIME : [ testData.sExpectedDate]
							}
						},
						metadata : {
							name : "sap.plc.db::basis.t_metadata",
							data : testData.mCsvFiles.metadata
						},
						metadata_text : "sap.plc.db::basis.t_metadata__text",
						metadata_item_attributes : {
							name : "sap.plc.db::basis.t_metadata_item_attributes",
							data : testData.mCsvFiles.metadata_item_attributes
						},
						customer : {
							name: "sap.plc.db::basis.t_customer",
							data : testData.oCustomerTestDataPlc
						},						
						component_split: {
							name: "sap.plc.db::basis.t_component_split",
							data : testData.oComponentSplitTest
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
						account_group : {
							name: 'sap.plc.db::basis.t_account_group'
						},
						account_group__text: {
							name: "sap.plc.db::basis.t_account_group__text"
						},
						account_account_group : {
							name: 'sap.plc.db::basis.t_account_account_group',
							data: testData.oAccountAccountGroupTestData
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
						plant: {
							name: "sap.plc.db::basis.t_plant",
							data: testData.oPlantTestDataPlc
						},
						cost_center: {
							name: "sap.plc.db::basis.t_cost_center",
							data: testData.oCostCenterTestDataPlc
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
						exchange_rate_type : {
							name: "sap.plc.db::basis.t_exchange_rate_type",
							data : testData.oExchangeRateTypeTestDataPlc
						},	
						account_group__text : 				"sap.plc.db::basis.t_account_group__text",
						activity_type:{
							name: "sap.plc.db::basis.t_activity_type",
							data: testData.oActivityTypeTestDataPlc
						},
						activity_type__text : 				"sap.plc.db::basis.t_activity_type__text",
						material_group :{
							name: "sap.plc.db::basis.t_material_group",
							data: testData.oMaterialGroupTestDataPlc
						},
						material_group__text : 				"sap.plc.db::basis.t_material_group__text",
						material_type: {
							name: "sap.plc.db::basis.t_material_type",
							data: testData.oMaterialTypeTestDataPlc
						},
						material_type__text : 				"sap.plc.db::basis.t_material_type__text",
						material_price :                    "sap.plc.db::basis.t_material_price",						
						cost_center__text : 				"sap.plc.db::basis.t_cost_center__text",					
						plant__text : 						"sap.plc.db::basis.t_plant__text",							
						project_lifecycle_configuration: 				"sap.plc.db::basis.t_project_lifecycle_configuration",
						lifecycle_period_value: 				"sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
						lifecycle_period_type: 				"sap.plc.db::basis.t_project_lifecycle_period_type",
						lifecycle_monthly_period: 				"sap.plc.db::basis.t_project_monthly_lifecycle_period",
						project_activity_price_surcharges: 		"sap.plc.db::basis.t_project_activity_price_surcharges",
						project_activity_price_surcharge_values:"sap.plc.db::basis.t_project_activity_price_surcharge_values",
						project_material_price_surcharges: 		"sap.plc.db::basis.t_project_material_price_surcharges",
						project_material_price_surcharge_values:"sap.plc.db::basis.t_project_material_price_surcharge_values",
						price_determination_strategy: {
							name: "sap.plc.db::basis.t_price_determination_strategy",
							data: testData.oPriceDeterminationStrategyTestData
						}, 	
						material: {
							name: "sap.plc.db::basis.t_material",
							data: testData.oMaterialTestDataPlc							
						},
						material_text: {
							name: "sap.plc.db::basis.t_material__text",
							data: testData.oMaterialTextTestDataPlc
						}					
					},
					csvPackage : testData.sCsvPackage
				});
	});

	beforeEach(function() {
		oMockstar.clearAllTables();
		oMockstar.initializeData();

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status", "followUp" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;
	});
	
	function buildRequest(params, iHttpMethod, aProjects, sQueryPath) {
		// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
		params.get = function(sArgument) {
			var oSearchedParam = _.find(params, function(oParam) {
				return sArgument === oParam.name
			});

			return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
		};
		
		var oBody = {
				asString : function() {
					return aProjects ? JSON.stringify(aProjects) : "";
				}
		};
		
		var oRequest = {
				queryPath : helpers.isNullOrUndefined(sQueryPath) ? "projects" : sQueryPath,
				method : iHttpMethod,
				parameters : params,
				body : oBody
		};
		return oRequest;
	}

	function prepareRequest(iTaskId) {
		var params = [{
			name: "id",
			value: iTaskId
		}];
		params.get = function(sParameterName) {
			if (helpers.isNullOrUndefined(sParameterName)) {
				return null;
			} else {
				if (sParameterName === "id") {
					return iTaskId;
				}
			}
		};
		var oRequest = {
				queryPath: "tasks",
				method: $.net.http.GET,
				parameters: params
		};
		return oRequest;
	}
	
	function enterPrivilege(sProjectId, sUserId, sPrivilege){
        oMockstar.insertTableData("authorization",{
           PROJECT_ID   : [sProjectId],
           USER_ID      : [sUserId],
           PRIVILEGE    : [sPrivilege]
        });
    }
	
	if(jasmine.plcTestRunParameters.mode === 'all'){
		
		describe('get (GET)', function() {
		
			beforeEach(function() {
				oMockstar.clearTables(["project", "calculation", "calculation_version", "customer", "authorization", "folder", "entity_relation"]);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("folder", testData.oFoldersTestData);
				oMockstar.insertTableData("entity_relation", testData.oEntityRelationTestData);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				oMockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
				enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
			});

			var params = [];
			
			params.get = function(sArgument) {
				var oSearchedParam = _.find(params, function(oParam) {
					return sArgument === oParam.name;
				});

				return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
			};
			const createRequest = aParams => {
				aParams.get = function(sArgument) {
					var oSearchedParam = _.find(params, function(oParam) {
						return sArgument === oParam.name;
					});
					return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
				};
				return {
					queryPath : "projects",
					method : $.net.http.GET,
					parameters : aParams
				}
			}


			it('should read all the projects in the system and count the number of calculations for each project', function() {
				// arrange
				var oExpectedResponse = _.extend(new TestDataUtility(testData.oProjectTestData).getObject(0), {"CALCULATION_NO": 2, "PATH": "1"});
				
				// act
				new Dispatcher(oCtx, createRequest([]), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body.transactionaldata;
				expect(oReturnedObject).toEqualObject([oExpectedResponse], ["PROJECT_ID"]);
			});

			it('should return the customer objects referenced in projects', function() {				
				// act
				new Dispatcher(oCtx, createRequest([]), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedCustomer = oResponseObject.body.masterdata.CUSTOMER_ENTITIES[0];

				expect(oReturnedCustomer.CUSTOMER_ID).toEqual(testData.oCustomerTestDataPlc.CUSTOMER_ID[0]);
			});
			
			it('should filter the returned projects using additional criteria in autocomplete', function() {
				// arrange
				var sCustomerId = "C2"
				var oProjectC2 = new TestDataUtility(testData.oProjectTestData).getObject(1);
				var oEntityRelationC2 = new TestDataUtility(testData.oEntityRelationTestData).getObject(1);
				oProjectC2.PROJECT_ID = "PROJECT_CUSTOMER_C2";
				oProjectC2.CUSTOMER_ID = sCustomerId;
				oProjectC2.ENTITY_ID = oEntityRelationC2.ENTITY_ID = 99;
				oMockstar.insertTableData("project", oProjectC2);
				oMockstar.insertTableData("entity_relation", oEntityRelationC2);
				enterPrivilege(oProjectC2.PROJECT_ID, sUserId, InstancePrivileges.READ);
				
				params = [ {
					name : "filter",
					value : `CUSTOMER_ID=${sCustomerId}`
				}, {
					name : "searchAutocomplete",
					value : oProjectC2.PROJECT_ID
				} ];
				var oExpectedResponse = _.extend({}, oProjectC2, {"CALCULATION_NO": 0, "PATH" : "4/99"});
				
				// act
				new Dispatcher(oCtx, createRequest(params), oDefaultResponseMock).dispatch();
				
				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body.transactionaldata;
				
				expect(oReturnedObject).toEqualObject([oExpectedResponse], ["PROJECT_ID"]);
			});
			
			it('should not return any entries for an invalid customer (filter)', function() {
				// arrange
				params = [ {
					name : "filter",
					value : "CUSTOMER_ID=X9"
				} ];
				
				// act
				new Dispatcher(oCtx, createRequest(params), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body.transactionaldata;
				
				expect(oReturnedObject.length).toBe(0);
				expect(oResponseObject.body.masterdata['CONTROLLING_AREA_ENTITIES'].length).toBe(0);
				expect(oResponseObject.body.masterdata['CUSTOMER_ENTITIES'].length).toBe(0);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR if value is greater than 2147483647 (max Integer supported by SQL-numeric overflow)', function() {
				// arrange
				params = [ {
					name : "top",
					value : 2147483648
				} ];
				
				// act
				new Dispatcher(oCtx, createRequest(params), oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should read all the projects in the system which are part of a specified folder', function() {
				// arrange
				enterPrivilege(testData.oProjectTestData.PROJECT_ID[1], sUserId, InstancePrivileges.READ);
				enterPrivilege(testData.oProjectTestData.PROJECT_ID[2], sUserId, InstancePrivileges.READ);
				var oExpectedResponse = new TestDataUtility(testData.oProjectTestData).getObjects([1,2]);
				oExpectedResponse[0].CALCULATION_NO = 0;
				oExpectedResponse[1].CALCULATION_NO = 0;
				oExpectedResponse[0].PATH = "4/2";
				oExpectedResponse[1].PATH = "4/3";
				params = [{
					name : "folderId",
					value : 4
				}];
				// act
				new Dispatcher(oCtx, createRequest(params), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body.transactionaldata;
				expect(oReturnedObject).toMatchData(oExpectedResponse, ["PROJECT_ID"]);
			});

			it('should read all the projects in the root folder', function() {
				// arrange
				enterPrivilege(testData.oProjectTestData.PROJECT_ID[2], sUserId, InstancePrivileges.READ);
				enterPrivilege(testData.oProjectTestData.PROJECT_ID[1], sUserId, InstancePrivileges.READ);
				var oExpectedResponse = _.extend(new TestDataUtility(testData.oProjectTestData).getObject(0), {"CALCULATION_NO": 2, "PATH" : "1"});
				params = [{
					name : "folderId",
					value : 0
				}];
				// act
				new Dispatcher(oCtx, createRequest(params), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body.transactionaldata;
				expect(oReturnedObject).toMatchData(oExpectedResponse, ["PROJECT_ID"]);
			});
		});
	}
	
	describe('create (POST)', function() {
		
		beforeEach(function() {
			oMockstar.clearTables(["project", "open_projects", "authorization", "folder", "entity_relation"]);
			oMockstar.insertTableData("folder", testData.oFoldersTestData);
			oMockstar.insertTableData("entity_relation", testData.oEntityRelationTestData);
		});
		
		var params = [ {"name" : "action",	"value" : ServiceParameters.Create} ];
	

		if(jasmine.plcTestRunParameters.mode === 'all'){
			it('should create project for valid input -> create and open project by inserting data in t_project and t_open_projects', function(){
				//arrange
				const iEntityId = 20;
				var currentdate = new Date();
				var oNewProject = {
					"PROJECT_ID":  'PRJ1',
					"PROJECT_NAME":  'PROJECT_NAME',
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0],
					"REPORT_CURRENCY_ID" : 'EUR',
					"EXCHANGE_RATE_TYPE_ID": testData.oExchangeRateTypeTestDataPlc.EXCHANGE_RATE_TYPE_ID[0],
					"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        			"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
					"PATH": "4/5"
				};
				//since there is a problem with the user that creates the hierarchy view and the test user 
				//for the check in, we add manually the privilege in t_auth_project
				var oAdminPrivilege = {
						"PROJECT_ID":  'PRJ1',
						"USER_ID":  testData.sSessionId,
						"PRIVILEGE": 'ADMINISTRATE'
					};
				oMockstar.insertTableData("authorization", oAdminPrivilege);

				var oRequest = buildRequest(params, $.net.http.POST, oNewProject);
				
				spyOn(oPersistency.Project, "createAdminUserPrivilege");
				oPersistency.Project.createAdminUserPrivilege.and.returnValue({});
				spyOn(oPersistency.Project, "getNextSequence");
				oPersistency.Project.getNextSequence.and.returnValue(iEntityId);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// create the expected response object based on the test data, so that changes to project table let not 
				// fail this test (if the testdata is adapted accordingly of course)
				var oProjectTestData = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var aProjectKeys = _.keys(oProjectTestData);
				var aProjectValues = _.map(aProjectKeys, () => null);
				var oExpected = _.extend(_.zipObject(aProjectKeys, aProjectValues), {
					"PROJECT_ID": oNewProject.PROJECT_ID,
					"PROJECT_NAME": oNewProject.PROJECT_NAME,
					"CONTROLLING_AREA_ID": oNewProject.CONTROLLING_AREA_ID,
					"REPORT_CURRENCY_ID": "EUR",
					"CREATED_ON": currentdate,
					"CREATED_BY": sUserId,
					"LAST_MODIFIED_ON": currentdate,
					"LAST_MODIFIED_BY": sUserId,
					"LIFECYCLE_PERIOD_INTERVAL": 12,
					"EXCHANGE_RATE_TYPE_ID": oNewProject.EXCHANGE_RATE_TYPE_ID,
					"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        			"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				});
				
				var aPropertiesToOmitForComparison = ["CREATED_ON", "LAST_MODIFIED_ON", "ENTITY_ID", "PATH"];
				var oReturnedObject = oResponseObject.body.transactionaldata[0];
				var oComparableExpected = JSON.parse(JSON.stringify( _.omit(oExpected, aPropertiesToOmitForComparison) ));
				var oComparableResult = _.omit(oReturnedObject, aPropertiesToOmitForComparison);

				expect(oComparableExpected).toEqualObject(oComparableResult, [ "PROJECT_ID" ]);
				testHelpers.checkDatesUpdated(oReturnedObject, ["CREATED_ON", "LAST_MODIFIED_ON"]);
				
				//Check that data has been written in db
				var result = oMockstar.execQuery("select * from {{project}}");
				expect(result).toMatchData(_.omit(oReturnedObject, ["CREATED_ON", "LAST_MODIFIED_ON", "PATH"]), ["PROJECT_ID"]);	
								
				//Check that project has been opened
				var resultOpenProjects = oMockstar.execQuery("select * from {{open_projects}}");
				expect(resultOpenProjects).toMatchData( {
						"PROJECT_ID" : oReturnedObject.PROJECT_ID,
						"SESSION_ID" : sSessionId,
						"IS_WRITEABLE" : 1
					}, 
				["PROJECT_ID"]);
				// Check that the project was saved under folder id 5 (parent entity ID)
				const oEntityResult = oMockstar.execQuery(`select ENTITY_ID, PARENT_ENTITY_ID, ENTITY_TYPE from {{entity_relation}} where ENTITY_ID = ${iEntityId}`);
				expect(oEntityResult.columns.ENTITY_ID.rows[0]).toBe(iEntityId);
				expect(oEntityResult.columns.PARENT_ENTITY_ID.rows[0]).toBe(testData.oEntityRelationTestData.ENTITY_ID[4]);
				expect(oEntityResult.columns.ENTITY_TYPE.rows[0]).toBe(Constants.EntityTypes.Project);
			});
			
			it('should create project for valid input -> create and open project by inserting data in t_project and t_open_projects when exchange rate type is null', function(){
				//arrange
				var currentdate = new Date();
				var oNewProject = {
					"PROJECT_ID":  'PRJ1',
					"PROJECT_NAME":  'PROJECT_NAME',
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0],
					"REPORT_CURRENCY_ID" : 'EUR',
					"EXCHANGE_RATE_TYPE_ID": null,
					"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        			"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
					"PATH": "4/5"
				};
				//since there is a problem with the user that creates the hierarchy view and the test user 
				//for the check in, we add manually the privilege in t_auth_project
				var oAdminPrivilege = {
						"PROJECT_ID":  'PRJ1',
						"USER_ID":  testData.sSessionId,
						"PRIVILEGE": 'ADMINISTRATE'
					};
				oMockstar.insertTableData("authorization", oAdminPrivilege);

				var oRequest = buildRequest(params, $.net.http.POST, oNewProject);
				
				spyOn(oPersistency.Project, "createAdminUserPrivilege");
				oPersistency.Project.createAdminUserPrivilege.and.returnValue({});
				spyOn(oPersistency.Project, "getNextSequence");
				oPersistency.Project.getNextSequence.and.returnValue(21);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// create the expected response object based on the test data, so that changes to project table let not 
				// fail this test (if the testdata is adapted accordingly of course)
				var oProjectTestData = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var aProjectKeys = _.keys(oProjectTestData);
				var aProjectValues = _.map(aProjectKeys, () => null);
				var oExpected = _.extend(_.zipObject(aProjectKeys, aProjectValues), {
					"PROJECT_ID": oNewProject.PROJECT_ID,
					"PROJECT_NAME": oNewProject.PROJECT_NAME,
					"CONTROLLING_AREA_ID": oNewProject.CONTROLLING_AREA_ID,
					"REPORT_CURRENCY_ID": "EUR",
					"CREATED_ON": currentdate,
					"CREATED_BY": sUserId,
					"LAST_MODIFIED_ON": currentdate,
					"LAST_MODIFIED_BY": sUserId,
					"LIFECYCLE_PERIOD_INTERVAL": 12,
					"EXCHANGE_RATE_TYPE_ID": null,
					"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        			"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				});
				
				var aPropertiesToOmitForComparison = ["CREATED_ON", "LAST_MODIFIED_ON", "ENTITY_ID", "PATH"];
				var oReturnedObject = oResponseObject.body.transactionaldata[0];
				var oComparableExpected = JSON.parse(JSON.stringify( _.omit(oExpected, aPropertiesToOmitForComparison) ));
				var oComparableResult = _.omit(oReturnedObject, aPropertiesToOmitForComparison);

				expect(oComparableExpected).toEqualObject(oComparableResult, [ "PROJECT_ID" ]);
				testHelpers.checkDatesUpdated(oReturnedObject, ["CREATED_ON", "LAST_MODIFIED_ON"]);
				
				//Check that data has been written in db
				var result = oMockstar.execQuery("select * from {{project}}");
				expect(result).toMatchData(_.omit(oReturnedObject, ["CREATED_ON", "LAST_MODIFIED_ON", "PATH"]), ["PROJECT_ID"]);	
								
				//Check that project has been opened
				var resultOpenProjects = oMockstar.execQuery("select * from {{open_projects}}");
				expect(resultOpenProjects).toMatchData( {
						"PROJECT_ID" : oReturnedObject.PROJECT_ID,
						"SESSION_ID" : sSessionId,
						"IS_WRITEABLE" : 1
					}, 
				["PROJECT_ID"]);	
				
			});
			
			it('should create project for valid input -> create and open project by inserting data in t_project and t_open_projects when specific price strategies are given', function(){
				//arrange
				var currentdate = new Date();

				var oNewMaterialPriceDeterminationStrategy = {
					"PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_MATERIAL_STR", "PLC_ACTIVITY_STR"], 
					"PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 2],
					"CREATED_ON" : [currentdate, currentdate],
					"CREATED_BY" :[testData.sSessionId, testData.sSessionId],
					"LAST_MODIFIED_ON" : [currentdate, currentdate],
					"LAST_MODIFIED_BY" :[testData.sSessionId, testData.sSessionId]
				};

				oMockstar.insertTableData("price_determination_strategy", oNewMaterialPriceDeterminationStrategy);

				var oNewProject = {
					"PROJECT_ID":  'PRJ1',
					"PROJECT_NAME":  'PROJECT_NAME',
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0],
					"REPORT_CURRENCY_ID" : 'EUR',
					"EXCHANGE_RATE_TYPE_ID": testData.oExchangeRateTypeTestDataPlc.EXCHANGE_RATE_TYPE_ID[0],
					"MATERIAL_PRICE_STRATEGY_ID":'PLC_MATERIAL_STR',
					"ACTIVITY_PRICE_STRATEGY_ID":'PLC_ACTIVITY_STR',
					"PATH": "4/5"
				};
				//since there is a problem with the user that creates the hierarchy view and the test user 
				//for the check in, we add manually the privilege in t_auth_project
				var oAdminPrivilege = {
						"PROJECT_ID":  'PRJ1',
						"USER_ID":  testData.sSessionId,
						"PRIVILEGE": 'ADMINISTRATE'
					};
				oMockstar.insertTableData("authorization", oAdminPrivilege);

				var oRequest = buildRequest(params, $.net.http.POST, oNewProject);
				
				spyOn(oPersistency.Project, "createAdminUserPrivilege");
				oPersistency.Project.createAdminUserPrivilege.and.returnValue({});
				spyOn(oPersistency.Project, "getNextSequence");
				oPersistency.Project.getNextSequence.and.returnValue(22);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// create the expected response object based on the test data, so that changes to project table let not 
				// fail this test (if the testdata is adapted accordingly of course)
				var oProjectTestData = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var aProjectKeys = _.keys(oProjectTestData);
				var aProjectValues = _.map(aProjectKeys, () => null);
				var oExpected = _.extend(_.zipObject(aProjectKeys, aProjectValues), {
					"PROJECT_ID": oNewProject.PROJECT_ID,
					"PROJECT_NAME": oNewProject.PROJECT_NAME,
					"CONTROLLING_AREA_ID": oNewProject.CONTROLLING_AREA_ID,
					"REPORT_CURRENCY_ID": "EUR",
					"CREATED_ON": currentdate,
					"CREATED_BY": sUserId,
					"LAST_MODIFIED_ON": currentdate,
					"LAST_MODIFIED_BY": sUserId,
					"LIFECYCLE_PERIOD_INTERVAL": 12,
					"EXCHANGE_RATE_TYPE_ID": oNewProject.EXCHANGE_RATE_TYPE_ID,
					"MATERIAL_PRICE_STRATEGY_ID":"PLC_MATERIAL_STR",
        			"ACTIVITY_PRICE_STRATEGY_ID":"PLC_ACTIVITY_STR"
				});
				
				var aPropertiesToOmitForComparison = ["CREATED_ON", "LAST_MODIFIED_ON", "ENTITY_ID", "PATH"];
				var oReturnedObject = oResponseObject.body.transactionaldata[0];
				var oComparableExpected = JSON.parse(JSON.stringify( _.omit(oExpected, aPropertiesToOmitForComparison) ));
				var oComparableResult = _.omit(oReturnedObject, aPropertiesToOmitForComparison);

				expect(oComparableExpected).toEqualObject(oComparableResult, [ "PROJECT_ID" ]);
				testHelpers.checkDatesUpdated(oReturnedObject, ["CREATED_ON", "LAST_MODIFIED_ON"]);
				
				//Check that data has been written in db
				var result = oMockstar.execQuery("select * from {{project}}");
				expect(result).toMatchData(_.omit(oReturnedObject, ["CREATED_ON", "LAST_MODIFIED_ON", "ENTITY_ID", "PATH"]), ["PROJECT_ID"]);	
								
				//Check that project has been opened
				var resultOpenProjects = oMockstar.execQuery("select * from {{open_projects}}");
				expect(resultOpenProjects).toMatchData( {
						"PROJECT_ID" : oReturnedObject.PROJECT_ID,
						"SESSION_ID" : sSessionId,
						"IS_WRITEABLE" : 1
					}, 
				["PROJECT_ID"]);	
				
			});
				
			it('should not create project if id is not unique -> throw GENERAL_ENTITY_ALREADY_EXISTS_ERROR', function() {
				// arrange
				var oNewProject = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0],
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0],
						"REPORT_CURRENCY_ID" : 'EUR',
						"VALUATION_DATE" : "2011-08-20",
						"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
						"PATH": "4/5"
					};
				
				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);
				
				var oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ENTITY_ALREADY_EXISTS_ERROR.code);
			});	

			it('should not create project if PARENT.PATH is invalid -> throw GENERAL_VALIDATION_ERROR', function() {
				// arrange
				const oNewProject = {
					"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0],
					"PROJECT_NAME":	"PROJECT_NAME",
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0],
					"REPORT_CURRENCY_ID" : 'EUR',
					"VALUATION_DATE" : "2011-08-20",
					"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
					"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
					"PATH": "11/22/33INVALID/42"
				};
				
				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);
				
				const oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should not create project if entity id does not exist -> throw GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
				// arrange
				const iInvalidFolderId = 100;
				const oNewProject = {
					"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0],
					"PROJECT_NAME":	"PROJECT_NAME",
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0],
					"REPORT_CURRENCY_ID" : 'EUR',
					"VALUATION_DATE" : "2011-08-20",
					"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
					"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
					"PATH": `4/${iInvalidFolderId}`
				};
				
				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);
				
				const oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it('should not create project if request path does not exist for the given entity_id -> throw GENERAL_ENTITY_NOT_CURRENT_ERROR', function() {
				// arrange
				const sInvalidPath = "2/4";
				const iValidFolderiD = 5;
				const oNewProject = {
					"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0],
					"PROJECT_NAME":	"PROJECT_NAME",
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0],
					"REPORT_CURRENCY_ID" : 'EUR',
					"VALUATION_DATE" : "2011-08-20",
					"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
					"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
					"PATH": `${sInvalidPath}/${iValidFolderiD}`
				};
				
				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);
				
				const oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});

			it('should not create project if a mandatory property (e.g. CONTROLLING_AREA_ID) not set -> throw GENERAL_VALIDATION_ERROR', function() {
				// arrange
				var oNewProject = {
						"PROJECT_ID":  'PRJ2',
						"PROJECT_NAME":	"PROJECT_NAME",
						"REPORT_CURRENCY_ID" : 'EUR',
						"VALUATION_DATE" : "2011-08-20",
						"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
					};
				
				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);
				
				var oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should not create project if a mandatory property (e.g. MATERIAL_PRICE_STRATEGY_ID) not set -> throw GENERAL_VALIDATION_ERROR', function () {
				// arrange
				const oNewProject = {
					"PROJECT_ID": 'PRJ2',
					"PROJECT_NAME": "PROJECT_NAME",
					"CONTROLLING_AREA_ID": "#CA1",
					"REPORT_CURRENCY_ID": 'EUR',
					"VALUATION_DATE": "2011-08-20",
					"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				};

				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);

				const oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should not create project if a mandatory property (e.g. ACTIVITY_PRICE_STRATEGY_ID) not set -> throw GENERAL_VALIDATION_ERROR', function () {
				// arrange
				const oNewProject = {
					"PROJECT_ID": 'PRJ2',
					"PROJECT_NAME": "PROJECT_NAME",
					"CONTROLLING_AREA_ID": "#CA1",
					"REPORT_CURRENCY_ID": 'EUR',
					"VALUATION_DATE": "2011-08-20",
					"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0]
				};

				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);

				const oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should not create project if a material price strategy id does not exist -> throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR', function() {
				// arrange
				const oNewProject = {
						"PROJECT_ID": "1111",
                        "PROJECT_NAME": "111",
                        "CONTROLLING_AREA_ID": "#CA1",
                        "COMPANY_CODE_ID": "#CC1",
                        "PLANT_ID": "#PT1",
                        "REPORT_CURRENCY_ID": "EUR",
						"EXCHANGE_RATE_TYPE_ID": testData.oExchangeRateTypeTestDataPlc.EXCHANGE_RATE_TYPE_ID[0],
						"MATERIAL_PRICE_STRATEGY_ID":"WRONG_ID",
        				"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
						"PATH": "4/5"
					};
				
				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);
				
				let oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
			});	

			it('should not create project if a activity price strategy id does not exist -> throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR', function() {
				// arrange
				const oNewProject = {
						"PROJECT_ID": "1111",
                        "PROJECT_NAME": "111",
                        "CONTROLLING_AREA_ID": "#CA1",
                        "COMPANY_CODE_ID": "#CC1",
                        "PLANT_ID": "#PT1",
                        "REPORT_CURRENCY_ID": "EUR",
						"EXCHANGE_RATE_TYPE_ID": testData.oExchangeRateTypeTestDataPlc.EXCHANGE_RATE_TYPE_ID[0],
						"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID":"WRONG_ID",
						"PATH": "4/5"
					};
				
				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);
				
				let oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
			});	

			it('should not create project if a property has invalid characters -> throw GENERAL_VALIDATION_ERROR', function() {
				// arrange
				const oNewProject = {
						"PROJECT_ID": "1111",
                        "PROJECT_NAME": "111",
                        "CONTROLLING_AREA_ID": "#CA1",
                        "COMPANY_CODE_ID": "#CC1",
                        "PLANT_ID": "#PT1",
                        "REPORT_CURRENCY_ID": "EUR",
						"EXCHANGE_RATE_TYPE_ID": "$##@",
						"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
					};
				
				// open the project
				oMockstar.insertTableData("project", testData.oProjectTestData);
				
				let oRequest = buildRequest(params, $.net.http.POST, oNewProject);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});	
		}
		
	});
	
	describe('open (POST)', function() {
		var oProjectToOpen = {
				"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0]
			};
		var oSessionTestData = {
				"SESSION_ID":  			[sSessionId, 	"anotherUserSession"],
				"USER_ID":  			[sUserId, 		"anotherUser"],
				"LANGUAGE": 			[testData.sDefaultLanguage,testData.sDefaultLanguage],
				"LAST_ACTIVITY_TIME": 	[testData.sExpectedDate, testData.sExpectedDate]
			}
		
		var params = [ {"name" : "action",	"value" : ServiceParameters.Open} ];

		
		beforeEach(function() {
			oMockstar.clearTables(["project", "open_projects", "session", "authorization", "exchange_rate_type"]);
			
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("session", oSessionTestData);
			oMockstar.insertTableData("exchange_rate_type", testData.oExchangeRateTypeTestDataPlc);
			enterPrivilege(oProjectToOpen.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
			
		});

		if(jasmine.plcTestRunParameters.mode === 'all'){
			it('should open existing project with given id -> open as writable, update t_open_projects and return 200 OK response code with project and master data', function() {
				// arrange
				var oRequest = buildRequest(params, $.net.http.POST, oProjectToOpen);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);

				//Check that project has been opened as writeable
				var result = oMockstar.execQuery("select session_id, project_id, is_writeable from {{open_projects}}");
				expect(result).toMatchData( {
						"SESSION_ID" : sSessionId,
						"PROJECT_ID" : oProjectToOpen.PROJECT_ID,
						"IS_WRITEABLE" : 1
					}, 
				["PROJECT_ID"]);
				
				//Check project properties
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseProject = oResponseObject.body.transactionaldata[0];
				var oComparableExpected = _.extend(mockstarHelpers.convertToObject(testData.oProjectTestData, 0), {"PATH" : "1"});
				expect(oResponseProject).toEqualObject(oComparableExpected, [ "PROJECT_ID" ]);
				
				// Check master data
				var oReturnedMasterData = oResponseObject.body.masterdata;

				expect(oReturnedMasterData.BUSINESS_AREA_ENTITIES[0].BUSINESS_AREA_ID).toEqual(testData.oBusinessAreaTestDataPlc.BUSINESS_AREA_ID[0]);
				expect(oReturnedMasterData.COSTING_SHEET_ENTITIES[0].COSTING_SHEET_ID).toEqual(testData.oCostingSheetTestData.COSTING_SHEET_ID[0]);
				expect(oReturnedMasterData.COMPANY_CODE_ENTITIES[0].COMPANY_CODE_ID).toEqual(testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0]);
				expect(oReturnedMasterData.COMPONENT_SPLIT_ENTITIES[0].COMPONENT_SPLIT_ID).toEqual(testData.oComponentSplitTest.COMPONENT_SPLIT_ID[0]);
				expect(oReturnedMasterData.CONTROLLING_AREA_ENTITIES[0].CONTROLLING_AREA_ID).toEqual(testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3]);
				expect(oReturnedMasterData.CUSTOMER_ENTITIES[0].CUSTOMER_ID).toEqual(testData.oCustomerTestDataPlc.CUSTOMER_ID[0]);
				expect(oReturnedMasterData.PLANT_ENTITIES[0].PLANT_ID).toEqual(testData.oPlantTestDataPlc.PLANT_ID[0]);
				expect(oReturnedMasterData.PROFIT_CENTER_ENTITIES[0].PROFIT_CENTER_ID).toEqual(testData.oProfitCenterTestDataPlc.PROFIT_CENTER_ID[3]);
				expect(oReturnedMasterData.EXCHANGE_RATE_TYPE_ENTITIES[0].EXCHANGE_RATE_TYPE_ID).toEqual(testData.oExchangeRateTypeTestDataPlc.EXCHANGE_RATE_TYPE_ID[2]);

			});

			it('should not open project if id does not exist -> throw GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
				// arrange
				var sInvalidProjectId = "PR_1111";

				expect(mockstarHelpers.getRowCount(oMockstar, "project", "project_id= '"+sInvalidProjectId+"'")).toEqual(0);
				var oInvalidProjectRequest = buildRequest(params, $.net.http.POST, {"PROJECT_ID": sInvalidProjectId});
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oInvalidProjectRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});		
			
			it('should open project as read-only if it is locked by another user and return project with ENTITY_NOT_WRITEABLE_INFO message', function() {
				// arrange
				
				// open the project as writeable by another user
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  oSessionTestData.SESSION_ID[1],
							"PROJECT_ID":  oProjectToOpen.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);

				var oRequest = buildRequest(params, $.net.http.POST, oProjectToOpen);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				
				// check the response message
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				var oResponseMessage = oResponseObject.head.messages[0];
				expect(oResponseMessage.code).toEqual(messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
				expect(oResponseMessage.details).toEqualObject(
						{projectObjs:[
							{
								id: oProjectToOpen.PROJECT_ID,
								openingUsers: [{
									id:  oSessionTestData.USER_ID[1]
								}]
							}
						]}
				);

				// check that project has been opened and other project in session is unchanged
				var result = oMockstar.execQuery("select session_id, project_id, is_writeable from {{open_projects}}");
				expect(result).toMatchData( {
						"SESSION_ID" : [oSessionTestData.SESSION_ID[1], 		sSessionId],
						"PROJECT_ID" : [oProjectToOpen.PROJECT_ID,	oProjectToOpen.PROJECT_ID],
						"IS_WRITEABLE" :[1, 						0]
					}, 
				["PROJECT_ID", "SESSION_ID"]);
				
			});		
			
			it('should open project as writeable if project opened by another user as readonly', function() {
				// arrange
				
				// open the project as read-only by another user
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  "anotherUserSession",
							"PROJECT_ID":  oProjectToOpen.PROJECT_ID,
							"IS_WRITEABLE": 0
						}
				);		
				
				var oRequest = buildRequest(params, $.net.http.POST, oProjectToOpen);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);

				//Check that project has been opened as writeable
				var result = oMockstar.execQuery("select session_id, project_id, is_writeable from {{open_projects}}");
				expect(result).toMatchData( {
						"SESSION_ID" : [oSessionTestData.SESSION_ID[1], 		sSessionId],
						"PROJECT_ID" : [oProjectToOpen.PROJECT_ID,	oProjectToOpen.PROJECT_ID],
						"IS_WRITEABLE" :[0, 						1]
					}, 
				["PROJECT_ID", "SESSION_ID"]);
				
			});	
		}
	});

	describe('close (POST)', function() {
		var oProjectToClose = {
				"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0] 
			};
		var params = [ {"name" : "action",	"value" : ServiceParameters.Close} ];

		
		beforeEach(function() {
			oMockstar.clearTables(["project", "open_projects", "authorization"]);
			
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
			oMockstar.insertTableData("project", testData.oProjectTestData);
		});

		if(jasmine.plcTestRunParameters.mode === 'all'){
			it('should close project with given id -> remove lock by updating t_open_projects and return 200 OK response code', function() {
				// arrange
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToClose.PROJECT_ID,
							"IS_WRITEABLE": 0
						}
				);
				
				var oRequest = buildRequest(params, $.net.http.POST, oProjectToClose);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);

				//Check that project has been closed
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects", "session_id='" + sSessionId + "' and project_id='" + oProjectToClose.PROJECT_ID + "'")).toEqual(0);
			});
			
			it('should close project with given id which is open as writeable -> remove lock by updating t_open_projects and return 200 OK response code', function() {
				// arrange
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToClose.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				
				var oRequest = buildRequest(params, $.net.http.POST, oProjectToClose);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);

				//Check that project has been closed
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects", "session_id='" + sSessionId + "' and project_id='" + oProjectToClose.PROJECT_ID + "'")).toEqual(0);
			});

			it('should not close project if id does not exist -> throw GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
				// arrange
				var sInvalidProjectId = "PR_1111";

				expect(mockstarHelpers.getRowCount(oMockstar, "project", "project_id= '"+sInvalidProjectId+"'")).toEqual(0);
				var oInvalidProjectRequest = buildRequest(params, $.net.http.POST, {"PROJECT_ID": sInvalidProjectId});
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oInvalidProjectRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});		
			
			it('should not close project which is not open -> throw GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
				// arrange
				
				//  check that project is not opened
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects", "session_id='" + sSessionId + "' and project_id='" + oProjectToClose.PROJECT_ID+"'")).toEqual(0);
				
				var oInvalidProjectRequest = buildRequest(params, $.net.http.POST, oProjectToClose);
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oInvalidProjectRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});	
			
			it('should not close project opened by another user -> throw GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
				// arrange
				// open the project as writeable by another user
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  "anotherUserSession",
							"PROJECT_ID":  oProjectToClose.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				
				//  check that project is not opened
				expect(mockstarHelpers.getRowCount(oMockstar, "open_projects", "session_id='" + sSessionId + "' and project_id='" + oProjectToClose.PROJECT_ID+"'")).toEqual(0);
				
				var oInvalidProjectRequest = buildRequest(params, $.net.http.POST, oProjectToClose);
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oInvalidProjectRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});	
		}
	});	
	
	describe('action=calculate_lifecycle_versions (POST)', function() {

		var fCreateParams = (pId, bOverWriteManualVersions = false) => {
			return [{
					name: Constants.ProjectServiceParameters.id.name,
					value: pId
			},
					{
						name: Constants.ProjectServiceParameters.action.name,
						value: Constants.ProjectServiceParameters.action.values.calculate_lifecycle_versions
			},
			{
				name:  Constants.ProjectServiceParameters.overwriteManualVersions.name,
				value: bOverWriteManualVersions
	        }
		];
		};
		
		var oTotalQuantitiesData = {
			PROJECT_ID                 : ["PR1"],
			CALCULATION_ID          : [testData.oCalculationVersionTestData.CALCULATION_ID[0]],
			CALCULATION_VERSION_ID  : [testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]],
			LAST_MODIFIED_ON        : [new Date()],
			LAST_MODIFIED_BY: [sSessionId]
		}

		var oTotalQuantitiesData2 = {
			PROJECT_ID                 : ["PR1","PR1"],
			CALCULATION_ID          : [2809,testData.oCalculationVersionTestData.CALCULATION_ID[0]],
			CALCULATION_VERSION_ID  : [2809,testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]],
			LAST_MODIFIED_ON        : [new Date(),new Date()],
			LAST_MODIFIED_BY: [sSessionId,sSessionId]
		}
		
		beforeEach(function() {
			oMockstar.clearTables(["project", "calculation", "calculation_version", "calculation_version_temporary", "item", "total_quantities", "authorization"]);

			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("item", testData.oItemTestData);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
			
			// open by default the first project for the current user
			let sProjectId = testData.oProjectTestData.PROJECT_ID[0];
			oMockstar.insertTableData("open_projects", 
					{
						"SESSION_ID":  sSessionId,
						"PROJECT_ID":  sProjectId,
						"IS_WRITEABLE": 1
					}
			);
			oMockstar.insertTableData("total_quantities", oTotalQuantitiesData);
		});

		if(jasmine.plcTestRunParameters.mode === 'all'){
			
			it("should not create calculation task if project for the specified id cannot be found -> throw GENERAL_ENTITY_NOT_FOUND_ERROR", function(){
				// arrange 
				oMockstar.clearTable("project"); // remove all entries in project table => nothing can be found
				var sProjectId = "DOES_NOT_EXIST"
				var oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});
			
			it("should not create calculation task if project is opened by another user -> throw PROJECT_NOT_WRITABLE_ERROR", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				oMockstar.clearTable("open_projects"); // remove all entries in project table => nothing can be found
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  "other_user",
							"PROJECT_ID":  sProjectId,
							"IS_WRITEABLE": 1
						}
				);
				var oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_NOT_WRITABLE_ERROR.code);
			});

			it("should not create calculation task if a lifecycle version is opened by another user -> throw PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR", function(){
				// arrange 
				oMockstar.clearTable('calculation_version');
				oMockstar.clearTable('open_calculation_version');
				let sProjectId = testData.oProjectTestData.PROJECT_ID[0];

				let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0,1]);
		        _.extend(aExistingCalculationVersionTestData[1],  {
				"BASE_VERSION_ID" : 2809,
				"CALCULATION_VERSION_ID" : 123,
				"CALCULATION_VERSION_TYPE" : 16,});			
				oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);
                
				oMockstar.insertTableData("open_calculation_version", {
					SESSION_ID : [ sSessionId ],
					CALCULATION_VERSION_ID : [ 123 ],
					IS_WRITEABLE : [ 1 ]
				});
					
				let oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR.code);
			});

			it("should not create calculation task if the user has not at least privilege CREATE_EDIT -> throw GENERAL_ACCESS_DENIED", function() {
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				oMockstar.clearTable("authorization"); // remove all entries in project table => nothing can be found
				enterPrivilege(sProjectId, sUserId, InstancePrivileges.READ);

				var oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ACCESS_DENIED.code);
			});
			
			it("should not create calculation task if a non-completed task for the same project already exist -> throw PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				oMockstar.insertTableData("task", {
					TASK_ID: 12345678,
					SESSION_ID : "other_user",
					TASK_TYPE: TaskType.CALCULATE_LIFECYCLE_VERSIONS,
					PARAMETERS: JSON.stringify({
						PROJECT_ID: sProjectId
					}),
					STATUS: TaskStatus.ACTIVE
				});
				
				var oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				
				// act and assert
				var oResponseObject = requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR.code);
			});
			
			
			it("should create task for if calculation of lifecycle version can be started -> return created task", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				
				// act and assert
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedTask = oResponseObject.body.transactionaldata[0];
				expect(oReturnedTask.TASK_ID).toBeGreaterThan(0);
				expect(oReturnedTask.TASK_TYPE).toEqual(TaskType.CALCULATE_LIFECYCLE_VERSIONS);
				var oParameters = JSON.parse(oReturnedTask.PARAMETERS); // note: oReturnedTask.PARAMETERS only contains a JSON string to this time
				expect(oParameters.PROJECT_ID).toEqual(sProjectId);
			});
			
			it("should set followUp of response if calculation of lifecycle version can be started -> response has correct follow up set", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				
				// act and assert
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oFollowUp = oDefaultResponseMock.followUp.calls.mostRecent().args[0];
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedTask = oResponseObject.body.transactionaldata[0];

				expect(oFollowUp.uri).toEqual(FollowUp.CALCULATE_LIFECYCLE_VERSIONS.URI);
				expect(oFollowUp.functionName).toEqual(FollowUp.CALCULATE_LIFECYCLE_VERSIONS.FUNCTION_NAME);
				var oFollowUpParameter = oFollowUp.parameter;
				expect(oFollowUpParameter.TASK_ID).toEqual(oReturnedTask.TASK_ID);
			});

			it("should set inactive and active project requests to canceled for calculate lifecycle if another call is made by the same user", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oProjectRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				var oTaskRequest = prepareRequest(null);
				var taskParameters = '{"PROJECT_ID":"' + sProjectId + '"}'; 
				var sUserId = $.session.getUsername();
				
				oMockstar.clearTable("task");
				oMockstar.insertTableData("task",{
					"TASK_ID" : [1, 2],
					"SESSION_ID": [sUserId, sUserId],
					"STATUS": ['INACTIVE', 'INACTIVE'],
					"CREATED_ON": [new Date(),  new Date()],
					"TASK_TYPE": ["PROJECT_CALCULATE_LIFECYCLE_VERSIONS","PROJECT_CALCULATE_LIFECYCLE_VERSIONS"],
					"PARAMETERS": [taskParameters, taskParameters]
				});
				oMockstar.insertTableData("timeout",{
					"APPLICATION_TIMEOUT_ID": ["0"],
					"VALUE_IN_SECONDS": [5000000]
				});
				
				// act and assert
				new Dispatcher(oCtx, oProjectRequest, oDefaultResponseMock).dispatch();
				new Dispatcher(oCtx, oTaskRequest,  oDefaultResponseMock).dispatch();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseObject.body).toBeDefined(); 
				expect(oResponseObject.body.transactionaldata.length).toBe(3);
				
				// the new task which is created by the calculate call is deleted since is not relevant for this test
				var aTasks = _.dropRight(oResponseObject.body.transactionaldata); 
				expect(aTasks[0].STARTED).toBeDefined();
				expect(aTasks[1].STARTED).toBeDefined();
				var oExpectedValues = {
					"TASK_ID":  [1, 2],
					"TASK_TYPE":  ['PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS'],
					"STATUS":  ['CANCELED','INACTIVE']
				}
				expect(aTasks).toMatchData(oExpectedValues, ["TASK_ID"]);
			});

			it("should not set inactive and active tasks requests to canceled for calculate lifecycle if another task request is called before", function(){
				// arrange
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oTaskRequest = prepareRequest(null); 
				var taskParameters = '{"PROJECT_ID":"' + sProjectId + '"}'; 
				var sUserId = $.session.getUsername();
				
				oMockstar.clearTable("task");
				oMockstar.insertTableData("task",{
					"TASK_ID" : [1, 2],
					"SESSION_ID": [sUserId, sUserId],
					"STATUS": ['INACTIVE', 'INACTIVE'],
					"CREATED_ON": [new Date(),  new Date()],
					"TASK_TYPE": ["PROJECT_CALCULATE_LIFECYCLE_VERSIONS","PROJECT_CALCULATE_LIFECYCLE_VERSIONS"],
					"PARAMETERS": [taskParameters, taskParameters]
				});
				oMockstar.clearTable("timeout");
				oMockstar.insertTableData("timeout",{
					"APPLICATION_TIMEOUT_ID": ["0"],
					"VALUE_IN_SECONDS": [5000000]
				});
				
				// act and assert
				new Dispatcher(oCtx, oTaskRequest, oDefaultResponseMock).dispatch();
				new Dispatcher(oCtx, oTaskRequest,  oDefaultResponseMock).dispatch();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseObject.body).toBeDefined(); 
				expect(oResponseObject.body.transactionaldata.length).toBe(2);
				
				var aTasks = oResponseObject.body.transactionaldata; 
				expect(aTasks[0].STARTED).toBeDefined();
				expect(aTasks[1].STARTED).toBeDefined();
				var oExpectedValues = {
					"TASK_ID":  [1, 2],
					"TASK_TYPE":  ['PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS'],
					"STATUS":  ['INACTIVE','INACTIVE']
				}
				expect(aTasks).toMatchData(oExpectedValues, ["TASK_ID"]);
			});

			it("should set inactive and active tasks to canceled for calculate lifecycle if another call is made by other user and the timeout time passed", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oProjectRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				var taskParameters = '{"PROJECT_ID":"' + sProjectId + '"}'; 
		
				oMockstar.clearTable("task");
				oMockstar.insertTableData("task",{
					"TASK_ID" : [1, 2],
					"SESSION_ID": ["other_user", "other_user"],
					"STATUS": ['INACTIVE', 'INACTIVE'],
					"CREATED_ON": [new Date(),  new Date()],
					"TASK_TYPE": ["PROJECT_CALCULATE_LIFECYCLE_VERSIONS","PROJECT_CALCULATE_LIFECYCLE_VERSIONS"],
					"PARAMETERS": [taskParameters, taskParameters]
				});
				oMockstar.insertTableData("timeout",{
					"APPLICATION_TIMEOUT_ID": ["0"],
					"VALUE_IN_SECONDS": [-1]
				});
				
				// act and assert
				new Dispatcher(oCtx, oProjectRequest, oDefaultResponseMock).dispatch();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseObject.body).toBeDefined(); 
				expect(oResponseObject.body.transactionaldata.length).toBe(1); // the created task is returned
			});

			it("should not set inactive and active tasks to canceled for calculate lifecycle if another call is made by other user and the timeout time did not pass", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oProjectRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST);
				var oTaskRequest = prepareRequest(null);
				var taskParameters = '{"PROJECT_ID":"' + sProjectId + '"}'; 
				var sUserId = $.session.getUsername();
				
				oMockstar.clearTable("task");
				oMockstar.insertTableData("task",{
					"TASK_ID" : [1, 2],
					"SESSION_ID": ["other user", "other user"],
					"STATUS": ['INACTIVE', 'INACTIVE'],
					"CREATED_ON": [new Date(),  new Date()],
					"TASK_TYPE": ["PROJECT_CALCULATE_LIFECYCLE_VERSIONS","PROJECT_CALCULATE_LIFECYCLE_VERSIONS"],
					"PARAMETERS": [taskParameters, taskParameters]
				});
				oMockstar.insertTableData("timeout",{
					"APPLICATION_TIMEOUT_ID": [0],
					"VALUE_IN_SECONDS": [500000]
				});
				
				// act and assert
				new Dispatcher(oCtx, oProjectRequest, oDefaultResponseMock).dispatch();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oDefaultResponseMock.status).toBe(409);
				expect(oResponseObject.head).toBeDefined(); 
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe("PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR");
			});

			it("should not throw error if the body of the request has oneTimeCostItemDescription text", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				
				var oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST, oCostText);
				// act and assert
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedTask = oResponseObject.body.transactionaldata[0];
				expect(oReturnedTask.TASK_ID).toBeGreaterThan(0);
				expect(oReturnedTask.TASK_TYPE).toEqual(TaskType.CALCULATE_LIFECYCLE_VERSIONS);
				var oParameters = JSON.parse(oReturnedTask.PARAMETERS); 
				expect(oParameters.PROJECT_ID).toEqual(sProjectId);
			});

			it("should not throw error if the body of the request is empty {}", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				
				var oRequest = {
						queryPath :  "projects",
						method : $.net.http.POST,
						parameters : fCreateParams(sProjectId),
						body : {}
				};
				// act and assert
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			});

			it("should not throw error if the body of the request is not sent", function(){
				// arrange 
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				
				var oRequest = {
						queryPath :  "projects",
						method : $.net.http.POST,
						parameters : fCreateParams(sProjectId)
				};
				// act and assert
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			});

			it("should not create calculation task if a lifecycle version is referenced -> throw CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR", function(){
				// arrange 
	
				oMockstar.clearTable("calculation_version");
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData2);
				oMockstar.clearTable("total_quantities");
				oMockstar.insertTableData("total_quantities", oTotalQuantitiesData2);
				oMockstar.clearTable("lifecycle_period_value");
				oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValue2);
				oMockstar.execSingle("update {{item}} set REFERENCED_CALCULATION_VERSION_ID='1006' where CALCULATION_VERSION_ID='5809';");
				oMockstar.execSingle("update {{calculation}} set CALCULATION_ID='2809' where CALCULATION_NAME='Kalkulation Pumpe P-100';");

				let sProjectId = testData.oProjectTestData.PROJECT_ID[0];

				// act and assert
				var oRequest = buildRequest(fCreateParams(sProjectId), $.net.http.POST, oCostText);
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR.code);
			});
		}
		
	});
	
	describe('update (PUT)', function() {
		var params = [ ];
		const iFirstProjectTestDataIndex = 0;
		const iSecondProjectTestDataIndex = 1;

		beforeEach(function() {
			oMockstar.clearTables(["project", "open_projects", "authorization", "entity_relation"]);
			
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("entity_relation", testData.oEntityRelationTestData);
		});
		
		function runUpdateProjectTest(oChangedProperties, iProjectTestDataIndex){
			var oProjectTestData = new TestDataUtility(testData.oProjectTestData).getObject(iProjectTestDataIndex)
			var oProjectToUpdate = _.pick(oProjectTestData, ["PROJECT_ID", "PROJECT_NAME", "CONTROLLING_AREA_ID", "REPORT_CURRENCY_ID", "MATERIAL_PRICE_STRATEGY_ID", "ACTIVITY_PRICE_STRATEGY_ID"]);
			_.extend(oProjectToUpdate, oChangedProperties);
						
			// open project as writeable
			oMockstar.insertTableData("open_projects",{
				"SESSION_ID":  sSessionId,
				"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
				"IS_WRITEABLE": 1
			});
			enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.FULL_EDIT);

			var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			return oResponseObject;
		}

		if(jasmine.plcTestRunParameters.mode === 'all'){
			it('should update opened project with given id -> update t_project and return OK response code with project and master data (user has CREATE_EDIT instance-based privilege)', function() {
				// arrange
				var aPropertiesToOmitForComparison = ["PATH", "ENTITY_ID", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY",
										 "START_OF_PROJECT", "END_OF_PROJECT", "START_OF_PRODUCTION", "END_OF_PRODUCTION", "VALUATION_DATE", "LIFECYCLE_VALUATION_DATE" ];
				var oProjectToUpdate = _.omit( mockstarHelpers.convertToObject(testData.oProjectTestData,0), aPropertiesToOmitForComparison);
				
				_.extend(oProjectToUpdate, 
						{
							// Properties that have been changed
							"SALES_DOCUMENT" : "SD1_NEW",
							"CUSTOMER_ID": testData.oCustomerTestDataPlc.CUSTOMER_ID[3],
							"EXCHANGE_RATE_TYPE_ID": testData.oExchangeRateTypeTestDataPlc.EXCHANGE_RATE_TYPE_ID[3]
						}
							
				);
				
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);

				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
							
				//Check project properties
				var oReturnedObject = oResponseObject.body.transactionaldata[0];
				var oComparableResult = _.omit(oReturnedObject, aPropertiesToOmitForComparison);
				
				var oExpected = oProjectToUpdate;
				var oComparableExpected = JSON.parse(JSON.stringify( _.omit(oExpected, aPropertiesToOmitForComparison) ));

				expect(oComparableResult).toEqualObject(oComparableExpected, [ "PROJECT_ID" ]);
				testHelpers.checkDatesUpdated(oReturnedObject, ["LAST_MODIFIED_ON"]);
				
				// Check master data
				var oReturnedMasterData = oResponseObject.body.masterdata;
				expect(oReturnedMasterData.CONTROLLING_AREA_ENTITIES[0].CONTROLLING_AREA_ID).toEqual(testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3]);
				expect(oReturnedMasterData.CUSTOMER_ENTITIES[0].CUSTOMER_ID).toEqual(testData.oCustomerTestDataPlc.CUSTOMER_ID[3]);
				expect(oReturnedMasterData.COMPANY_CODE_ENTITIES[0].COMPANY_CODE_ID).toEqual(testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0]);
				expect(oReturnedMasterData.PLANT_ENTITIES[0].PLANT_ID).toEqual(testData.oPlantTestDataPlc.PLANT_ID[0]);
				expect(oReturnedMasterData.BUSINESS_AREA_ENTITIES[0].BUSINESS_AREA_ID).toEqual(testData.oBusinessAreaTestDataPlc.BUSINESS_AREA_ID[0]);
				expect(oReturnedMasterData.PROFIT_CENTER_ENTITIES[0].PROFIT_CENTER_ID).toEqual(testData.oProfitCenterTestDataPlc.PROFIT_CENTER_ID[3]);
				expect(oReturnedMasterData.COSTING_SHEET_ENTITIES[0].COSTING_SHEET_ID).toEqual(testData.oCostingSheetTestData.COSTING_SHEET_ID[0]);
				expect(oReturnedMasterData.COMPONENT_SPLIT_ENTITIES[0].COMPONENT_SPLIT_ID).toEqual(testData.oComponentSplitTest.COMPONENT_SPLIT_ID[0]);
				expect(oReturnedMasterData.EXCHANGE_RATE_TYPE_ENTITIES[0].EXCHANGE_RATE_TYPE_ID).toEqual(testData.oExchangeRateTypeTestDataPlc.EXCHANGE_RATE_TYPE_ID[3]);
				
				// Check that data has been written in db
				var result = oMockstar.execQuery("select * from {{project}} where project_id = '" + oProjectToUpdate.PROJECT_ID + "';");
				expect(result).toMatchData(_.omit(oReturnedObject, aPropertiesToOmitForComparison),
				                                   ["PROJECT_ID"]);	
				
			});

			it('should update start and end of project also if the values in the db are null currently', function() {
				// arrange
				var oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var sProjectId = oDbProject.PROJECT_ID;
				oDbProject.START_OF_PROJECT = null;
				oDbProject.END_OF_PROJECT = null;
				oMockstar.clearTable("project");
				oMockstar.insertTableData("project", oDbProject);
								
				var oChangedProperties = {
					START_OF_PROJECT: "2020-08-20",
					END_OF_PROJECT: "2025-08-20"
				}
				
				// act 
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);
				
				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				var oDbPeriodTypesCreated = oMockstar.execQuery(`select * from {{lifecycle_period_type}} where project_id = '${sProjectId}' order by year`);
				expect(oDbPeriodTypesCreated.columns.PROJECT_ID.rows.length).toEqual(6);
				expect(oDbPeriodTypesCreated.columns.YEAR.rows).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
				expect(oDbResult.columns.START_OF_PROJECT.rows[0].getFullYear()).toEqual(2020); // only compare year to avoid any timezone issues
				expect(oDbResult.columns.END_OF_PROJECT.rows[0].getFullYear()).toEqual(2025); // only compare year to avoid any timezone issues
			});

			it('should create one lifecycle period when new dates for start and end of project are in the same year if the values in the db are null currently', function() {
				// arrange
				var oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var sProjectId = oDbProject.PROJECT_ID;
				oDbProject.START_OF_PROJECT = null;
				oDbProject.END_OF_PROJECT = null;
				oMockstar.clearTable("project");
				oMockstar.insertTableData("project", oDbProject);

				var oChangedProperties = {
					START_OF_PROJECT: "2020-01-01",
					END_OF_PROJECT: "2020-12-31"
				}

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				var oDbPeriodTypesCreated = oMockstar.execQuery(`select * from {{lifecycle_period_type}} where project_id = '${sProjectId}' order by year`);
				expect(oDbPeriodTypesCreated.columns.PROJECT_ID.rows.length).toEqual(1);
				expect(oDbPeriodTypesCreated.columns.YEAR.rows).toEqual([2020]);
				expect(oDbResult.columns.START_OF_PROJECT.rows[0].getFullYear()).toEqual(2020); // only compare year to avoid any timezone issues
				expect(oDbResult.columns.END_OF_PROJECT.rows[0].getFullYear()).toEqual(2020); // only compare year to avoid any timezone issues
			});

			it('should create lifecycle periods if lower bound was null before save', function() {
				// arrange
				var oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var sProjectId = oDbProject.PROJECT_ID;
				oDbProject.START_OF_PROJECT = null;
				oDbProject.END_OF_PROJECT = new Date(2025, 11, 31);
				oMockstar.clearTable("project");
				oMockstar.insertTableData("project", oDbProject);

				var oChangedProperties = {
					START_OF_PROJECT: "2020-01-01",
					END_OF_PROJECT: "2025-12-31"
				};

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				var oDbPeriodTypesCreated = oMockstar.execQuery(`select * from {{lifecycle_period_type}} where project_id = '${sProjectId}' order by year`);
				expect(oDbPeriodTypesCreated.columns.PROJECT_ID.rows.length).toEqual(6);
				expect(oDbPeriodTypesCreated.columns.YEAR.rows).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
				expect(oDbResult.columns.START_OF_PROJECT.rows[0].getFullYear()).toEqual(2020); // only compare year to avoid any timezone issues
				expect(oDbResult.columns.END_OF_PROJECT.rows[0].getFullYear()).toEqual(2025); // only compare year to avoid any timezone issues
			});

			it('should create lifecycle periods if upper bound was null before save', function() {
				// arrange
				var oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var sProjectId = oDbProject.PROJECT_ID;
				oDbProject.START_OF_PROJECT = new Date(2020, 0, 1);
				oDbProject.END_OF_PROJECT = null;
				oMockstar.clearTable("project");
				oMockstar.insertTableData("project", oDbProject);

				var oChangedProperties = {
					START_OF_PROJECT: "2020-01-01",
					END_OF_PROJECT: "2025-12-31"
				};

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				var oDbPeriodTypesCreated = oMockstar.execQuery(`select * from {{lifecycle_period_type}} where project_id = '${sProjectId}' order by year`);
				expect(oDbPeriodTypesCreated.columns.PROJECT_ID.rows.length).toEqual(6);
				expect(oDbPeriodTypesCreated.columns.YEAR.rows).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
				expect(oDbResult.columns.START_OF_PROJECT.rows[0].getFullYear()).toEqual(2020); // only compare year to avoid any timezone issues
				expect(oDbResult.columns.END_OF_PROJECT.rows[0].getFullYear()).toEqual(2025); // only compare year to avoid any timezone issues
			});

			it('should correctly create periods on updating the dates and when the start year is of type quarterly and the end year is of type monthly', () => {
				// arrange
				let oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				let sDummyProject = oDbProject.PROJECT_ID;
				let sUserId = testData.sTestUser;
				let dTimestamp = new Date();
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

				oMockstar.clearTable("lifecycle_period_type");
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesTestData);
				oMockstar.insertTableData("lifecycle_monthly_period", oMonthlyPeriodTestData);
				oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-06-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-06-01T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sDummyProject}';`);
				oMockstar.insertTableData("open_projects", {
					"SESSION_ID": sSessionId,
					"PROJECT_ID": sDummyProject,
					"IS_WRITEABLE": 1
				});
				enterPrivilege(sDummyProject, sUserId, InstancePrivileges.FULL_EDIT);

				let oChangedProperties = {
					START_OF_PROJECT: '2020-02-01', //1st of February 2020
					END_OF_PROJECT: '2022-10-01' //1st of October 2022
				};

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];

				// assert
				let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{lifecycle_monthly_period}} WHERE PROJECT_ID = '${sDummyProject}' ORDER BY year, selected_month;`);
				expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([1, 4, 7, 10, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
				expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2020, 2020, 2020, 2020, 2021, 2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022]);
			});

			it('should correctly create periods on updating the dates and when the start year is of type monthly and the end year is of type quarterly', () => {
				// arrange
				let oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				let sDummyProject = oDbProject.PROJECT_ID;
				let sUserId = testData.sTestUser;
				let dTimestamp = new Date();
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

				oMockstar.clearTable("lifecycle_period_type");
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesTestData);
				oMockstar.insertTableData("lifecycle_monthly_period", oMonthlyPeriodTestData);
				oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-06-10T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-06-10T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sDummyProject}';`);
				oMockstar.insertTableData("open_projects", {
					"SESSION_ID": sSessionId,
					"PROJECT_ID": sDummyProject,
					"IS_WRITEABLE": 1
				});
				enterPrivilege(sDummyProject, sUserId, InstancePrivileges.FULL_EDIT);

				let oChangedProperties = {
					START_OF_PROJECT: '2020-02-01', //1st of February 2020
					END_OF_PROJECT: '2022-10-01' //1st of October 2022
				};

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];

				// assert
				let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{lifecycle_monthly_period}} WHERE PROJECT_ID = '${sDummyProject}' ORDER BY year, selected_month;`);
				expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 1, 4, 7, 10]);
				expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2021, 2022, 2022, 2022, 2022]);
			});

			it('should correctly create periods on updating the year of the dates and when the start year is of type monthly and the end year is of type quarterly', () => {
				// arrange
				let oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				let sDummyProject = oDbProject.PROJECT_ID;
				let sUserId = testData.sTestUser;
				let dTimestamp = new Date();
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

				oMockstar.clearTable("lifecycle_period_type");
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesTestData);
				oMockstar.insertTableData("lifecycle_monthly_period", oMonthlyPeriodTestData);
				oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-06-10T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2022-06-10T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sDummyProject}';`);
				oMockstar.insertTableData("open_projects", {
					"SESSION_ID": sSessionId,
					"PROJECT_ID": sDummyProject,
					"IS_WRITEABLE": 1
				});
				enterPrivilege(sDummyProject, sUserId, InstancePrivileges.FULL_EDIT);

				let oChangedProperties = {
					START_OF_PROJECT: '2019-02-01', //1st of February 2019
					END_OF_PROJECT: '2023-10-01' //1st of October 2023
				};

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];

				// assert
				let oMonthlyPeriods = oMockstar.execQuery(`SELECT * FROM {{lifecycle_monthly_period}} WHERE PROJECT_ID = '${sDummyProject}' ORDER BY year, selected_month;`);
				expect(oMonthlyPeriods.columns.SELECTED_MONTH.rows).toEqual([1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 1, 4, 7, 10, 1]);
				expect(oMonthlyPeriods.columns.YEAR.rows).toEqual([2019, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2021, 2022, 2022, 2022, 2022, 2023]);
			});

			it('should update lifecycle period types when the start/end date change - scenario 1', function() {
				// arrange
				var oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var sProjectId = oDbProject.PROJECT_ID;
				oDbProject.START_OF_PROJECT = new Date(2020, 1, 1);
				oDbProject.END_OF_PROJECT = new Date(2025, 1, 1);
				oMockstar.clearTable("project");
				oMockstar.clearTable("lifecycle_period_value");
				oMockstar.insertTableData("project", oDbProject);
				oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValue);
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);

				oMockstar.insertTableData("open_projects",{
					"SESSION_ID":  sSessionId,
					"PROJECT_ID":  oDbProject.PROJECT_ID,
					"IS_WRITEABLE": 1
				});
				enterPrivilege(oDbProject.PROJECT_ID, sUserId, InstancePrivileges.FULL_EDIT);

				var oChangedProperties = {
					START_OF_PROJECT: "2021-01-01",
					END_OF_PROJECT: "2024-01-01"
				}

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				var oDbPeriodValues = oMockstar.execQuery(`select * from {{lifecycle_period_value}} where project_id = '${sProjectId}' and calculation_id = 1978 and (lifecycle_period_from < 1452 or lifecycle_period_from > 1488);`);
				var oDbPeriodMonthly = oMockstar.execQuery(`select * from {{lifecycle_monthly_period}} where project_id = '${sProjectId}' and year < 2021;`);
				var oDbPeriodTypes = oMockstar.execQuery(`select * from {{lifecycle_period_type}} where project_id = '${sProjectId}' order by year`);

				expect(oDbPeriodValues.columns.PROJECT_ID.rows.length).toEqual(0);
				expect(oDbPeriodMonthly.columns.PROJECT_ID.rows.length).toEqual(0);
				expect(oDbPeriodTypes.columns.PROJECT_ID.rows.length).toEqual(4);
				expect(oDbPeriodTypes.columns.YEAR.rows).toEqual([2021, 2022, 2023, 2024]);
				expect(oDbResult.columns.START_OF_PROJECT.rows[0].getFullYear()).toEqual(2021); // only compare year to avoid any timezone issues
				expect(oDbResult.columns.END_OF_PROJECT.rows[0].getFullYear()).toEqual(2024); // only compare year to avoid any timezone issues
			});

			it('should update lifecycle period types when the start/end date change - scenario 2', function() {
				// arrange
				var oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var sProjectId = oDbProject.PROJECT_ID;
				oDbProject.START_OF_PROJECT = new Date(2020, 8, 20);
				oDbProject.END_OF_PROJECT = new Date(2025, 8, 20);
				oMockstar.clearTable("project");
				oMockstar.clearTable("lifecycle_period_value");
				oMockstar.insertTableData("project", oDbProject);
				oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValue);
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);

				oMockstar.insertTableData("open_projects",{
					"SESSION_ID":  sSessionId,
					"PROJECT_ID":  oDbProject.PROJECT_ID,
					"IS_WRITEABLE": 1
				});
				enterPrivilege(oDbProject.PROJECT_ID, sUserId, InstancePrivileges.FULL_EDIT);

				var oChangedProperties = {
					START_OF_PROJECT: "2019-08-20",
					END_OF_PROJECT: "2026-08-20"
				}

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				var oDbPeriodTypes = oMockstar.execQuery(`select * from {{lifecycle_period_type}} where project_id = '${sProjectId}' order by year`);

				expect(oDbPeriodTypes.columns.PROJECT_ID.rows.length).toEqual(8);
				expect(oDbPeriodTypes.columns.YEAR.rows).toEqual([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
				expect(oDbResult.columns.START_OF_PROJECT.rows[0].getFullYear()).toEqual(2019); // only compare year to avoid any timezone issues
				expect(oDbResult.columns.END_OF_PROJECT.rows[0].getFullYear()).toEqual(2026); // only compare year to avoid any timezone issues
			});

			it('should update lifecycle period types when the start/end date change - scenario 3', function() {
				// arrange
				var oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var sProjectId = oDbProject.PROJECT_ID;
				oDbProject.START_OF_PROJECT = new Date(2020, 8, 20);
				oDbProject.END_OF_PROJECT = new Date(2025, 8, 20);
				oMockstar.clearTable("project");
				oMockstar.clearTable("lifecycle_period_value");
				oMockstar.insertTableData("project", oDbProject);
				oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValue);
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);

				var oChangedProperties = {
					START_OF_PROJECT: "2021-08-20",
					END_OF_PROJECT: "2026-08-20"
				}

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				var oDbPeriodTypes = oMockstar.execQuery(`select * from {{lifecycle_period_type}} where project_id = '${sProjectId}' order by year`);
				var oDbPeriodValues = oMockstar.execQuery(`select * from {{lifecycle_period_value}} where project_id = '${sProjectId}' and calculation_id = 1978 and lifecycle_period_from < 1452;`);
				var oDbPeriodMonthly = oMockstar.execQuery(`select * from {{lifecycle_monthly_period}} where project_id = '${sProjectId}' and year < 2021;`);

				expect(oDbPeriodValues.columns.PROJECT_ID.rows.length).toEqual(0);
				expect(oDbPeriodMonthly.columns.PROJECT_ID.rows.length).toEqual(0);
				expect(oDbPeriodTypes.columns.PROJECT_ID.rows.length).toEqual(6);
				expect(oDbPeriodTypes.columns.YEAR.rows).toEqual([2021, 2022, 2023, 2024, 2025, 2026]);
				expect(oDbResult.columns.START_OF_PROJECT.rows[0].getFullYear()).toEqual(2021); // only compare year to avoid any timezone issues
				expect(oDbResult.columns.END_OF_PROJECT.rows[0].getFullYear()).toEqual(2026); // only compare year to avoid any timezone issues
			});

			it('should update lifecycle period types when the start/end date change -scenario 4', function() {
				// arrange
				var oDbProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				var sProjectId = oDbProject.PROJECT_ID;
				oDbProject.START_OF_PROJECT = new Date(2020, 8, 20);
				oDbProject.END_OF_PROJECT = new Date(2025, 8, 20);
				oMockstar.clearTable("project");
				oMockstar.clearTable("lifecycle_period_value");
				oMockstar.insertTableData("project", oDbProject);
				oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValue);
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);

				var oChangedProperties = {
					START_OF_PROJECT: "2021-08-21"					
				}

				// act
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);

				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				var oDbPeriodTypes = oMockstar.execQuery(`select * from {{lifecycle_period_type}} where project_id = '${sProjectId}' order by year`);
				var oDbPeriodValues = oMockstar.execQuery(`select * from {{lifecycle_period_value}} where project_id = '${sProjectId}' and calculation_id = 1978 and lifecycle_period_from < 1452;`);
				var oDbPeriodMonthly = oMockstar.execQuery(`select * from {{lifecycle_monthly_period}} where project_id = '${sProjectId}' and year < 2021;`);

				expect(oDbPeriodValues.columns.PROJECT_ID.rows.length).toEqual(0);
				expect(oDbPeriodMonthly.columns.PROJECT_ID.rows.length).toEqual(0);
				expect(oDbPeriodTypes.columns.PROJECT_ID.rows.length).toEqual(0);
				expect(oDbPeriodTypes.columns.YEAR.rows.length).toEqual(0);
				expect(oDbResult.columns.START_OF_PROJECT.rows[0].getFullYear()).toEqual(2021); 
				expect(oDbResult.columns.END_OF_PROJECT.rows[0]).toEqual(null); 
			});

			it('should update start and end of project to null', function() {
				// arrange								
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oChangedProperties = {
					START_OF_PROJECT: null,
					END_OF_PROJECT: null
				}
				
				// act 
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);
				
				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select start_of_project, end_of_project from {{project}} where project_id = '${sProjectId}'`);
				
				expect(oDbResult.columns.START_OF_PROJECT.rows[0]).toEqual(null); 
				expect(oDbResult.columns.END_OF_PROJECT.rows[0]).toEqual(null); 
			});

            it('should update exchange rate type of project to null', function() {
				// arrange								
				var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
				var oChangedProperties = {
					EXCHANGE_RATE_TYPE_ID: null
				}
				
				// act 
				var oResponseObject = runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);
				
				// assert
				var oReturnedProject = oResponseObject.body.transactionaldata[0];
				var oDbResult = oMockstar.execQuery(`select exchange_rate_type_id from {{project}} where project_id = '${sProjectId}'`);
				
				expect(oDbResult.columns.EXCHANGE_RATE_TYPE_ID.rows[0]).toEqual(null); 
			});

			it('should update the project location from the root to a folder', function() {
				// arrange
				const iTargetFolder = testData.oEntityRelationTestData.ENTITY_ID[4];
				const iProjectEntityId = testData.oEntityRelationTestData.ENTITY_ID[0];
								
				const oChangedProperties = {
					TARGET_PATH: `4/${iTargetFolder}`,
					PATH: `${iProjectEntityId}`
				}
				
				// act
				runUpdateProjectTest(oChangedProperties, iFirstProjectTestDataIndex);
				// assert
				const iDbParentEntity = oMockstar.execQuery(`select PARENT_ENTITY_ID from {{entity_relation}} where ENTITY_ID = ${iProjectEntityId}`).columns.PARENT_ENTITY_ID.rows[0];
				const iProjectId = testData.oProjectTestData.PROJECT_ID[0];
				const iProjectEntity = oMockstar.execQuery(`select ENTITY_ID from {{project}} where PROJECT_ID = '${iProjectId}'`).columns.ENTITY_ID.rows[0];
				expect(iProjectEntityId).toBe(iProjectEntity);
				expect(iDbParentEntity).toEqual(iTargetFolder);
			});

			it('should update the project location from a folder to the root', function() {
				// arrange
				const iProjectEntityId = testData.oEntityRelationTestData.ENTITY_ID[1];
								
				var oChangedProperties = {
					TARGET_PATH: "0",
					PATH: `4/${iProjectEntityId}`
				}
				
				// act
				runUpdateProjectTest(oChangedProperties, iSecondProjectTestDataIndex);
				// assert
				const iDbParentEntity = oMockstar.execQuery(`select PARENT_ENTITY_ID from {{entity_relation}} where ENTITY_ID = ${iProjectEntityId}`).columns.PARENT_ENTITY_ID.rows[0];
				
				expect(iDbParentEntity).toEqual(null);
			});
			
			it('should not update project if id does not exist -> throw GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
				// arrange
				var oInvalidProject = {
						"PROJECT_ID":  "PR_1111",
						"PROJECT_NAME":	"PROJECT_NAME", 
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"MATERIAL_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID":testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]

				};

				expect(mockstarHelpers.getRowCount(oMockstar, "project", "project_id= '" + oInvalidProject.PROJECT_ID + "'")).toEqual(0);
				var oInvalidProjectRequest = buildRequest(params, $.net.http.PUT, oInvalidProject);
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oInvalidProjectRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});		
			
			it('should not update project opened as read-only -> return PROJECT_NOT_WRITABLE_ERROR message', function() {
				// arrange
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				};

				// open project as read-only
				oMockstar.insertTableData("open_projects", {
					"SESSION_ID":  sSessionId,
					"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
					"IS_WRITEABLE": 0
				});		
				oMockstar.execQuery("select session_id, project_id, is_writeable from {{open_projects}}");
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);
				
				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_NOT_WRITABLE_ERROR.code);
				
			});			
			
			it('should not update project if start of production in request is later than end of production in db -> throw GENERAL_VALIDATION_ERROR', function() {
				// arrange
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"START_OF_PRODUCTION" : "2017-08-20",
						"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
					};
				
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});	
			
			it('should not update project if start of project in request is later than end of project in db -> throw GENERAL_VALIDATION_ERROR', function() {
				// arrange
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"START_OF_PROJECT" : "2017-08-20",
						"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
					};
				
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it(`should not move the project if the user is trying to move the project in a folder that no longer exists -> throw GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR`, function() {
				// arrange
				const iDeletedFolderId = 911;
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"TARGET_PATH": `${iDeletedFolderId}`,
						"PATH": "1",
						"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				};
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR.code);
			});

			it(`should not move the project if the user is trying to move the project in a folder that exists but it's path has changed -> throw GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR`, function() {
				// arrange
				const iFolderLocationNotCurrent = "5/4";
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"TARGET_PATH": `${iFolderLocationNotCurrent}`,
						"PATH": "1",
						"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				};
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR.code);
			});

			it(`should not move the project if the user is trying to move the project but the project's location has changed -> throw GENERAL_ENTITY_NOT_CURRENT_ERROR`, function() {
				// arrange
				const iProjectLocationNotCurrent = "4/1";
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"TARGET_PATH": "4",
						"PATH": iProjectLocationNotCurrent,
						"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				};
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});

			it(`should not move the project if the user is requesting to move a project with a missmatched source entity id -> throw GENERAL_VALIDATION_ERROR`, function() {
				// arrange
				const iWrongProjectEntityId = 100;
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"TARGET_PATH": "0",
						"PATH": `4/${iWrongProjectEntityId}`,
						"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				};
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it(`should not move the project if the user is requesting to move a project inside another project -> throw GENERAL_VALIDATION_ERROR`, function() {
				// arrange
				const iTargetProjectEntityId = testData.oProjectTestData.ENTITY_ID[0];
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"TARGET_PATH": `4/${iTargetProjectEntityId}`,
						"PATH": "0",
						"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				};
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should not update project to a material price strategy that does not exist -> throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR', function() {
				// arrange
				var oProjectToUpdate = {
						"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
						"PROJECT_NAME":	"PROJECT_NAME",
						"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
						"REPORT_CURRENCY_ID" : 'EUR',
						"START_OF_PROJECT": "2020-08-20",
						"END_OF_PROJECT": "2025-08-20",
						"MATERIAL_PRICE_STRATEGY_ID": "WRONG_ID",
        				"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
					};
				
				// open project as writeable
				oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  sSessionId,
							"PROJECT_ID":  oProjectToUpdate.PROJECT_ID,
							"IS_WRITEABLE": 1
						}
				);
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
				
				var oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
			});	

			it('should not update project to a activity price strategy that does not exist -> throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR', function () {
				// arrange
				const oProjectToUpdate = {
					"PROJECT_ID": testData.oProjectTestData.PROJECT_ID[0],
					"PROJECT_NAME": "PROJECT_NAME",
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
					"REPORT_CURRENCY_ID": 'EUR',
					"START_OF_PROJECT": "2020-08-20",
					"END_OF_PROJECT": "2025-08-20",
					"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
					"ACTIVITY_PRICE_STRATEGY_ID": "INVALID_ENTRY"
				};

				// open project as writeable
				oMockstar.insertTableData("open_projects", {
					"SESSION_ID": sSessionId,
					"PROJECT_ID": oProjectToUpdate.PROJECT_ID,
					"IS_WRITEABLE": 1
				});
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);

				const oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
			});
						
			var runDeleteLifecyclePeriodsTest = function(oChangedProjectProperties, aExpectedPeriods){
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
				oMockstar.insertTableData("lifecycle_period_value", testData.oLifecyclePeriodValues);

				// act
				runUpdateProjectTest(oChangedProjectProperties, 0);

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				// rule_id 1 and 2 is used for calculation of the updated project; 
				var oResult = oMockstar.execQuery(`select distinct lifecycle_period_from from {{lifecycle_period_value}} where project_id = 'PR1'`);
				var aDbPeriods = oResult.columns.LIFECYCLE_PERIOD_FROM.rows;
				expect(aDbPeriods.length).toBe(aExpectedPeriods.length);
				_.each(aExpectedPeriods, iPeriodValue => {
					jasmine.log(`Expect ${iPeriodValue} in database`);
					expect(_.includes(aDbPeriods, iPeriodValue)).toBe(true);
				});
			}
			
			it('should delete values of lifecycle periods not valid anymore if start and end of project are changed', function() {
				// arrange
				var oChangedProjectProperties = {
					START_OF_PROJECT : "2018-08-20",
					END_OF_PROJECT : "2019-08-20"
				};
				let sProjectId = "PR1";
				let sUserId = testData.sTestUser;
				let dTimestamp = new Date();
				let oLifecycleYearlyPeriodTypesForProject = {
					"PROJECT_ID": [sProjectId, sProjectId, sProjectId],
					"YEAR": [2017, 2018, 2019],
					"PERIOD_TYPE": ["YEARLY", "YEARLY", "YEARLY"],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
				};
				let oLifecycleMonthlyPeriod = {
					"PROJECT_ID": [sProjectId, sProjectId, sProjectId],
					"YEAR": [2017, 2018, 2019],
					"SELECTED_MONTH": [1, 1, 1],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId]
				};
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
				oMockstar.insertTableData("lifecycle_monthly_period", oLifecycleMonthlyPeriod);
				oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2017-01-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2019-12-31T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sProjectId}';`);

				// periods in test data [1404, 1416, 1428]; 1404 = 2017; if the project starts later, the defined quantity need to be removed
				var aValidPeriods = [1416, 1428];
				
				runDeleteLifecyclePeriodsTest(oChangedProjectProperties, aValidPeriods)
			});

			it('should not delete values of lifecycle periods if start of project is changed within the same year', function() {
				// arrange
				// if the start of the project is changed within the same year and the lifecycle interval is 12 there is no change for
				// the periods to expect since this period starts with the first month of the year; test added after the calculation of 
				// periods to delete didn't take the lifecycle interval into account
				var oChangedProjectProperties = {
					START_OF_PROJECT : "2016-02-14",
					END_OF_PROJECT : "2019-08-20"
				};
				let sProjectId = "PR1";
				let sUserId = testData.sTestUser;
				let dTimestamp = new Date();
				let oLifecycleYearlyPeriodTypesForProject = {
					"PROJECT_ID": [sProjectId, sProjectId, sProjectId, sProjectId],
					"YEAR": [2016, 2017, 2018, 2019],
					"PERIOD_TYPE": ["CUSTOM", "YEARLY", "YEARLY", "YEARLY"],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId]
				};
				let oLifecycleMonthlyPeriod = {
					"PROJECT_ID": [sProjectId, sProjectId, sProjectId, sProjectId, sProjectId],
					"YEAR": [2016, 2016, 2017, 2018, 2019],
					"SELECTED_MONTH": [1, 2, 1, 1, 1],
					"LAST_MODIFIED_ON": [dTimestamp, dTimestamp, dTimestamp, dTimestamp, dTimestamp],
					"LAST_MODIFIED_BY": [sUserId, sUserId, sUserId, sUserId, sUserId]
				};
				oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
				oMockstar.insertTableData("lifecycle_monthly_period", oLifecycleMonthlyPeriod);
				oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2016-01-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2019-12-31T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sProjectId}';`);
				// 1404 = 2017; if the project starts later, the defined quantity need to be removed
				var aValidPeriods = [1404, 1416, 1428];
				
				runDeleteLifecyclePeriodsTest(oChangedProjectProperties, aValidPeriods)
			});


			it('should not update project MATERIAL_PRICE_STRATEGY_ID to null -> throw GENERAL_VALIDATION_EXCEPTION', function () {
				// arrange
				const oProjectToUpdate = {
					"PROJECT_ID": testData.oProjectTestData.PROJECT_ID[0],
					"PROJECT_NAME": "PROJECT_NAME",
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
					"REPORT_CURRENCY_ID": 'EUR',
					"START_OF_PROJECT": "2020-08-20",
					"END_OF_PROJECT": "2025-08-20",
					"MATERIAL_PRICE_STRATEGY_ID": null,
					"ACTIVITY_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1]
				};

				// open project as writeable
				oMockstar.insertTableData("open_projects", {
					"SESSION_ID": sSessionId,
					"PROJECT_ID": oProjectToUpdate.PROJECT_ID,
					"IS_WRITEABLE": 1
				});
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);

				const oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});

			it('should not update project ACTIVITY_PRICE_STRATEGY_ID to null -> throw GENERAL_VALIDATION_EXCEPTION', function () {
				// arrange
				const oProjectToUpdate = {
					"PROJECT_ID": testData.oProjectTestData.PROJECT_ID[0],
					"PROJECT_NAME": "PROJECT_NAME",
					"CONTROLLING_AREA_ID": testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
					"REPORT_CURRENCY_ID": 'EUR',
					"START_OF_PROJECT": "2020-08-20",
					"END_OF_PROJECT": "2025-08-20",
					"MATERIAL_PRICE_STRATEGY_ID": testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0],
					"ACTIVITY_PRICE_STRATEGY_ID": null
				};

				// open project as writeable
				oMockstar.insertTableData("open_projects", {
					"SESSION_ID": sSessionId,
					"PROJECT_ID": oProjectToUpdate.PROJECT_ID,
					"IS_WRITEABLE": 1
				});
				enterPrivilege(oProjectToUpdate.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);

				const oRequest = buildRequest(params, $.net.http.PUT, oProjectToUpdate);

				// act and assert
				requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
			});
		}
	});
	
	describe('delete (DEL)', function() {
		var oProjectToDelete = {
				"PROJECT_ID":  testData.oProjectTestData.PROJECT_ID[0], 
			};
		var oRequest = buildRequest([], $.net.http.DEL, oProjectToDelete);
		
		beforeEach(function() {
			oMockstar.clearTables(["project", "calculation", "calculation_version", "item", "activity_price", "authorization"]);
			
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("item", testData.oItemTestData);
			oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
			oMockstar.insertTableData("lifecycle_period_value", testData.oLifecyclePeriodValues);
			oMockstar.insertTableData("project_activity_price_surcharges",  testData.oProjectActivityPriceSurcharges);
			oMockstar.insertTableData("project_activity_price_surcharge_values",  testData.oProjectActivityPriceSurchargeValues);
			oMockstar.insertTableData("project_material_price_surcharges",  testData.oProjectMaterialPriceSurcharges);
			oMockstar.insertTableData("project_material_price_surcharge_values",  testData.oProjectMaterialPriceSurchargeValues);
	        
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.FULL_EDIT);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.clearTable("item_ext");
				oMockstar.insertTableData("item_ext", testData.oItemExtData);	
			}

		});

		if(jasmine.plcTestRunParameters.mode === 'all'){
		it('should delete existing project with given id -> all assigned entities are deleted; 200 OK as response code', function() {
			// arrange
			var iOriginalCount_Project = mockstarHelpers.getRowCount(oMockstar, "project");
			var iOriginalCount_Calculation = mockstarHelpers.getRowCount(oMockstar, "calculation");
			var iOriginalCount_CalculationVersion = mockstarHelpers.getRowCount(oMockstar, "calculation_version");
			var iOriginalCount_ItemAll = mockstarHelpers.getRowCount(oMockstar, "item");
			var iOriginalCount_ItemCalcVersion = mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id=" + oTestCalculationVersion.CALCULATION_VERSION_ID);
			var iOriginalCount_Auth = mockstarHelpers.getRowCount(oMockstar, "authorization");
			var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
	    	var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");
	        var iOriginalCount_ActivityPriceSurcharges = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges");
	        var iOriginalCount_ActivityPriceSurchargeValues= mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values");
	        var iOriginalCount_MaterialPriceSurcharges = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharges");
	        var iOriginalCount_MaterialPriceSurchargeValues= mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values"); 	    	
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var iOriginalCount_ItemExtAll = mockstarHelpers.getRowCount(oMockstar, "item_ext");
				var iOriginalCount_ItemExtCalcVersion = mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id="
						+ oTestCalculationVersion.CALCULATION_VERSION_ID);
			}

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			expect(mockstarHelpers.getRowCount(oMockstar, "project")).toEqual(iOriginalCount_Project - 1);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation", "calculation_id=" + oTestCalculation.CALCULATION_ID)).toEqual(0);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_id=" + oTestCalculation.CALCULATION_ID)).toEqual(0);
			expect(mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id=" + oTestCalculationVersion.CALCULATION_VERSION_ID)).toEqual(0);

			expect(mockstarHelpers.getRowCount(oMockstar, "calculation")).toEqual(iOriginalCount_Calculation - 2);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version")).toEqual(iOriginalCount_CalculationVersion - 2);
			expect(mockstarHelpers.getRowCount(oMockstar, "item")).toEqual(iOriginalCount_ItemAll - iOriginalCount_ItemCalcVersion - 1);
			expect(mockstarHelpers.getRowCount(oMockstar, "authorization")).toBe(iOriginalCount_Auth - 1);
			// check if project lifecycle details (total quantities, activity and material price surcharges) and associated values are deleted
			expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities - 2);
		    expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues - 6);
	        expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges")).toBe(iOriginalCount_ActivityPriceSurcharges - 1);
	        expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values")).toBe(iOriginalCount_ActivityPriceSurchargeValues - 3);  
	        expect(mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharges")).toBe(iOriginalCount_MaterialPriceSurcharges - 1);
	        expect(mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values")).toBe(iOriginalCount_MaterialPriceSurchargeValues - 3); 
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				expect(mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id=" + oTestCalculationVersion.CALCULATION_VERSION_ID)).toEqual(0);
				//only items of one calculation should be left, since 2 versions belong to the deleted project (2809, 4809): see testdata
				expect(mockstarHelpers.getRowCount(oMockstar, "item_ext")).toEqual(iOriginalCount_ItemExtAll - iOriginalCount_ItemExtCalcVersion-1);
			}

		});

		it('should not delete project if id does not exist -> return GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
			// arrange
			var sInvalidProjectId = "PR_1111";

			expect(mockstarHelpers.getRowCount(oMockstar, "project", "project_id= '"+sInvalidProjectId+"'")).toEqual(0);
			var oInvalidProjectRequest = buildRequest([], $.net.http.DEL, {"PROJECT_ID": sInvalidProjectId});

			// act and assert
			requestAndCheckDbNotChangedAndException(oInvalidProjectRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
		});	
		
		it('should not delete project if a user wants to delete a project without having FULL_EDIT -> return GENERAL_ACCESS_DENIED', function() {
			// arrange
			oMockstar.clearTable("authorization");
			enterPrivilege(oProjectToDelete.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);

			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ACCESS_DENIED.code);
		});
		
		it('should not delete project if it is open as writeable -> return PROJECT_IS_STILL_OPENED_ERROR', function() {
			// arrange
			
			// open the project
			oMockstar.insertTableData("open_projects", 
					{
						"SESSION_ID":  sSessionId,
						"PROJECT_ID":  oProjectToDelete.PROJECT_ID,
						"IS_WRITEABLE": 1
					}
			);

			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_IS_STILL_OPENED_ERROR.code);
		});		
		
		it('should not delete project if it is open as read-only -> return PROJECT_IS_STILL_OPENED_ERROR', function() {
			// arrange
		
			// open the project
			oMockstar.insertTableData("open_projects", 
					{
						"SESSION_ID":  sSessionId,
						"PROJECT_ID":  oProjectToDelete.PROJECT_ID,
						"IS_WRITEABLE": 0
					}
			);

			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_IS_STILL_OPENED_ERROR.code);
		});	
		
		it('should not delete project if any of assigned versions is open -> return CALCULATIONVERSION_IS_STILL_OPENED_ERROR', function() {
			// arrange
			oMockstar.insertTableData("open_calculation_version", {
				SESSION_ID : [ sSessionId ],
				CALCULATION_VERSION_ID : [ oTestCalculationVersion.CALCULATION_VERSION_ID ],
				IS_WRITEABLE : [ 1 ]
			});
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation", "calculation_id=" + oTestCalculation.CALCULATION_ID)).toEqual(1);
			expect(
					mockstarHelpers.getRowCount(oMockstar, "open_calculation_version", "calculation_version_id="
							+ oTestCalculationVersion.CALCULATION_VERSION_ID)).toEqual(1);

			// act and assert
			let oResponse = requestAndCheckDbNotChangedAndException(oRequest, messageCode.CALCULATIONVERSION_IS_STILL_OPENED_ERROR.code);
			
			// check message details
			expect(oResponse.head.messages[0].details.projectObjs[0].id).toBe(oProjectToDelete.PROJECT_ID);
			expect(oResponse.head.messages[0].details.calculationVersionObjs[0]).toEqual(
			        {id: oTestCalculationVersion.CALCULATION_VERSION_ID,
			         name: testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_NAME[0],
			         openingUsers: [
			                {id: sUserId}
			             ]
			        });
		});

		it('should not delete project if it has an open version, the version was created but not saved -> return CALCULATIONVERSION_IS_STILL_OPENED_ERROR', function() {
			// arrange
			let iNewVersionId = 4444;
			oMockstar.insertTableData("open_calculation_version", {
				SESSION_ID : [ sSessionId ],
				CALCULATION_VERSION_ID : [ iNewVersionId ],
				IS_WRITEABLE : [ 1 ]
			});
			oMockstar.insertTableData("calculation_version_temporary", {
						SESSION_ID : [ sSessionId ],
						CALCULATION_VERSION_ID : [iNewVersionId],
						CALCULATION_ID : [ 1978],
						CALCULATION_VERSION_NAME : [ "Baseline Version1"],
						ROOT_ITEM_ID : [ 3001],
						REPORT_CURRENCY_ID : [ "EUR"],
						VALUATION_DATE : [ new Date("2011-08-20T00:00:00.000Z").toJSON() ],
						MATERIAL_PRICE_STRATEGY_ID: [sDefaultPriceDeterminationStrategy],
                		ACTIVITY_PRICE_STRATEGY_ID: [sDefaultPriceDeterminationStrategy]
			});
			
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation", "calculation_id=" + oTestCalculation.CALCULATION_ID)).toEqual(1);
			expect(mockstarHelpers.getRowCount(oMockstar, "open_calculation_version", "calculation_version_id=" + iNewVersionId)).toEqual(1);
		
			// act and assert
			let oResponse = requestAndCheckDbNotChangedAndException(oRequest, messageCode.CALCULATIONVERSION_IS_STILL_OPENED_ERROR.code);
			expect(oResponse.head.messages[0].details.projectObjs[0].id).toBe(oProjectToDelete.PROJECT_ID);
		});
		
		it('should not delete project if any assigned calculation version is frozen -> return CALCULATIONVERSION_IS_FROZEN_ERROR', function() {
			
			var oCalculationVersionTestDataClone = _.cloneDeep(testData.oCalculationVersionTestData);
			
			//set the is_frozen flag
			oCalculationVersionTestDataClone.IS_FROZEN = [ 0, 1, 0 ];
            //fill calculation version table
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oCalculationVersionTestDataClone);	
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, messageCode.CALCULATIONVERSION_IS_FROZEN_ERROR.code);
		});
		
		it('should not delete project that is under lifecycle calculation -> return GENERAL_ENTITY_PART_OF_CALCULATION_ERROR', function() {
			// arrange: insert lifecycle calculation task for this project 
			let oTaskData = new TestDataUtility(testData.oTask).getObject(0);
			oTaskData.PARAMETERS = JSON.stringify({PROJECT_ID : oProjectToDelete.PROJECT_ID});
			oTaskData.STATUS = TaskStatus.ACTIVE;
			oMockstar.insertTableData("task", oTaskData);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ENTITY_PART_OF_CALCULATION_ERROR.code);
		});
		
		it('should not delete project if any assigned calculation version is frozen -> return CALCULATIONVERSION_IS_FROZEN_ERROR', function() {
			
			var oCalculationVersionTestDataClone = _.cloneDeep(testData.oCalculationVersionTestData);
			
			//set the is_frozen flag
			oCalculationVersionTestDataClone.IS_FROZEN = [ 0, 1, 0 ];
            //fill calculation version table
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oCalculationVersionTestDataClone);	
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, messageCode.CALCULATIONVERSION_IS_FROZEN_ERROR.code);
		});
		
		it('should not delete project if it has source versions that are referenced from another project -> throw CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR', function() {
			// arrange
			var sExpectedDate = new Date().toJSON();
			oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
			oMockstar.insertTableData("item",testData.oItemTestData);
			oMockstar.insertTableData("item", {
				"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
				"CALCULATION_VERSION_ID" : [2810, 2810, 2, 6809, 6809],
				"PARENT_ITEM_ID" : [ null, 3001, 3001, null, 5001],
				"PREDECESSOR_ITEM_ID" : [ null, 3001, null, null, 5001],
				"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
				"ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
				"CHILD_ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
				"REFERENCED_CALCULATION_VERSION_ID": [null, 4811, 4, null, 2809],
				"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
				"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
				"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
				"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
			});	
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, messageCode.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR.code);
		});
		
		}
	});
	
	describe("get project lifecycle details (GET)", function() {
		var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
		var oProject;
		var sServiceName;
		var params = [{ "name" : "id", "value" : sProjectId }];
		
		// The common tests for similar methods are put within this function to reuse them. The test context is then inserted over the parameters of this function. 
	    function executeCommonGetTests(fnSetupTest, sServiceName){
	    	
	        describe(`common tests for ${sServiceName}`, function(){
        	
	            beforeEach(function(){
	            	fnSetupTest();
	            });
	            
	    		it('should throw exception for project if id does not exist -> return GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
	    			// arrange
	    			var sInvalidProjectId = "PR_1111";

	    			// Ensure that this project does not exist indeed
	    			expect(mockstarHelpers.getRowCount(oMockstar, "project", "project_id= '"+sInvalidProjectId+"'")).toEqual(0);
	    			let params = [{ "name" : "id", "value" : sInvalidProjectId }];
	    			
	    			// act and assert
	    			var oRequest = buildRequest(params, $.net.http.GET, null, sServiceName);
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
	    		});
	    		
	    		
	    		it('should throw exception for project if user has no READ instance privilege for project -> return GENERAL_ACCESS_DENIED', function() {
	    			// arrange
	    			oMockstar.clearTable("authorization"); // remove all entries in project table => nothing can be found
	    			
	    			// act and assert
	    			var oRequest = buildRequest(params, $.net.http.GET, null, sServiceName);
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ACCESS_DENIED.code);
	    		});			
	    		
	        });
	    }		

	describe("getActivityPriceSurcharges (GET)", function() {

		function setupTest(){
			oMockstar.clearTables(["project", "authorization", "company_code", "plant", "plant__text", "session", "project_activity_price_surcharges", "project_activity_price_surcharge_values"]);
			
			// Insert master data
			oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
			oMockstar.insertTableData("plant", testData.oPlantTestDataPlc);
			oMockstar.insertTableData("plant__text", testData.oPlantTextTestDataPlc);
			oMockstar.insertTableData("account_group__text", testData.oAccountGroupTextTest);
			oMockstar.insertTableData("activity_type__text", testData.oActivityTypeTextTestDataPlc);
			oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
			oMockstar.insertTableData("cost_center__text", testData.oCostCenterTextTestDataPlc);
			oMockstar.insertTableData("plant__text", testData.oPlantTextTestDataPlc);		
			
			// Insert surcharges
			oMockstar.insertTableData("project_activity_price_surcharges", testData.oProjectActivityPriceSurcharges);
			oMockstar.insertTableData("project_activity_price_surcharge_values", testData.oProjectActivityPriceSurchargeValues);
			
			// Insert a user with language 'EN' since for this the master data descriptions are available
			oMockstar.insertTableData("session", 
			{
				SESSION_ID : [ sSessionId ],
				USER_ID : [ sUserId ],
				LANGUAGE : [ testData.sEnLanguage ],
				LAST_ACTIVITY_TIME : [ testData.sExpectedDate]
			});
			
			oMockstar.insertTableData("project", testData.oProjectTestData);
			enterPrivilege(sProjectId, sUserId, InstancePrivileges.READ);
		}
		
		beforeEach(function() {
			setupTest();
		});
						
		var aExpectedActivityPriceSurcharges = [{
			"PLANT_ID":             		testData.oPlantTextTestDataPlc.PLANT_ID[0],
			"PLANT_DESCRIPTION":    		testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0],
			"ACCOUNT_GROUP_ID":     		testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0],
			"ACCOUNT_GROUP_DESCRIPTION": 	testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0],
			"COST_CENTER_ID":       		testData.oCostCenterTextTestDataPlc.COST_CENTER_ID[0],
			// Not compared since the test data are not consistent for this case
            "COST_CENTER_DESCRIPTION":      null, // [testData.oCostCenterTextTestDataPlc.COST_CENTER_DESCRIPTION[0],
			"ACTIVITY_TYPE_ID":     		testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_ID[0],
            "ACTIVITY_TYPE_DESCRIPTION":	testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_DESCRIPTION[0],
            "PERIOD_VALUES":[
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2017-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[0].toString()
            	},
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2018-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[1].toString()
            	},
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2019-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[2].toString()
            	}
            ]
		}];
		
		//////////////////////////////////////////////////////////////
		// Execute common tests related to getting project lifecycle details 
		//////////////////////////////////////////////////////////////
		executeCommonGetTests(setupTest, "projects/activity-price-surcharges");
		
		it("should get defined surcharge values for the project", function() {
			// act
			var oRequest = buildRequest(params, $.net.http.GET, null, "projects/activity-price-surcharges");
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			var aResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var aReturnedSurcharges = aResponse.body.transactionaldata;
			
			expect(aReturnedSurcharges).toEqualObject(aExpectedActivityPriceSurcharges);
		});
			
		it("should get empty surcharge definitions for project if no surcharges defined yet", () => {
			// arrange
			// clear all tables for surcharges to set up the situation that no surcharges defined yet
			oMockstar.clearTables(["project_activity_price_surcharges", "project_activity_price_surcharge_values"]);

			var aExpectedResponse = [];
			
			// act
			var oRequest = buildRequest(params, $.net.http.GET, null, "projects/activity-price-surcharges");
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			var aResponse= JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var aReturnedSurcharges = aResponse.body.transactionaldata;
			
			expect(aReturnedSurcharges).toEqualObject(aExpectedResponse);
		});
		
		it("should get surcharge definitions and empty surcharge values for project if no surcharge values defined yet", () => {
			// arrange
			// clear surcharge values
			oMockstar.clearTables(["project_activity_price_surcharge_values"]);

			var aExpectedResponse = new TestDataUtility(aExpectedActivityPriceSurcharges).build();
			aExpectedResponse[0].PERIOD_VALUES = [];
			
			// act
			var oRequest = buildRequest(params, $.net.http.GET, null, "projects/activity-price-surcharges");
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			var aResponse= JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var aReturnedSurcharges = aResponse.body.transactionaldata;
			
			expect(aReturnedSurcharges).toEqualObject(aExpectedResponse);
		});
		
	});
	
	
	describe("getMaterialPriceSurcharges (GET)", function() {

		function setupTest(){
			oMockstar.clearTables(["project", "authorization", "company_code", "plant", "plant__text", "session", "project_material_price_surcharges", "project_material_price_surcharge_values"]);
			
			// Insert master data
			oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
			oMockstar.insertTableData("plant", testData.oPlantTestDataPlc);
			oMockstar.insertTableData("plant__text", testData.oPlantTextTestDataPlc);
			oMockstar.insertTableData("account_group__text", testData.oAccountGroupTextTest);
			oMockstar.insertTableData("material_group__text", testData.oMaterialGroupTextTestDataPlc);
			oMockstar.insertTableData("material_type__text", testData.oMaterialTypeTextTestDataPlc);
			oMockstar.insertTableData("plant__text", testData.oPlantTextTestDataPlc);		
			
			// Insert surcharges
			oMockstar.insertTableData("project_material_price_surcharges", testData.oProjectMaterialPriceSurcharges);
			oMockstar.insertTableData("project_material_price_surcharge_values", testData.oProjectMaterialPriceSurchargeValues);
			
			// Insert a user with language 'EN' since for this the master data descriptions are available
			oMockstar.insertTableData("session", 
			{
				SESSION_ID : [ sSessionId ],
				USER_ID : [ sUserId ],
				LANGUAGE : [ testData.sEnLanguage ],
				LAST_ACTIVITY_TIME : [ testData.sExpectedDate]
			});
			
			oMockstar.insertTableData("project", testData.oProjectTestData);
			enterPrivilege(sProjectId, sUserId, InstancePrivileges.READ);
		}
		
		beforeEach(function() {
			setupTest();
		});
						
		var aExpectedMaterialPriceSurcharges = [{
			"PLANT_ID":             		testData.oPlantTextTestDataPlc.PLANT_ID[0],
			"PLANT_DESCRIPTION":    		testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0],
			"ACCOUNT_GROUP_ID":     		testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0],
			"ACCOUNT_GROUP_DESCRIPTION": 	testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0],			
			"MATERIAL_GROUP_ID":     		testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_ID[0],
			"MATERIAL_GROUP_DESCRIPTION": 	testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_DESCRIPTION[0],
			"MATERIAL_TYPE_ID":       		testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_ID[0],
            "MATERIAL_TYPE_DESCRIPTION":      testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_DESCRIPTION[0],
            "PERIOD_VALUES":[
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2017-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[0].toString()
            	},
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2018-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[1].toString()
            	},
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2019-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[2].toString()
            	}
			],
			"MATERIAL_ID":                   testData.oMaterialTestDataPlc.MATERIAL_ID[0],
			"MATERIAL_DESCRIPTION":          testData.oMaterialTextTestDataPlc.MATERIAL_DESCRIPTION[0]
		}];
		
		//////////////////////////////////////////////////////////////
		// Execute common tests related to getting project lifecycle details 
		//////////////////////////////////////////////////////////////
		executeCommonGetTests(setupTest, "projects/material-price-surcharges");
		
		it("should get defined surcharge values for the project", function() {
			// act
			var oRequest = buildRequest(params, $.net.http.GET, null, "projects/material-price-surcharges");
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			var aResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var aReturnedSurcharges = aResponse.body.transactionaldata;
			
			expect(aReturnedSurcharges).toEqualObject(aExpectedMaterialPriceSurcharges);
		});
			
		it("should get empty surcharge definitions for project if no surcharges defined yet", () => {
			// arrange
			// clear all tables for surcharges to set up the situation that no surcharges defined yet
			oMockstar.clearTables(["project_material_price_surcharges", "project_material_price_surcharge_values"]);

			var aExpectedResponse = [];
			
			// act
			var oRequest = buildRequest(params, $.net.http.GET, null, "projects/material-price-surcharges");
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			var aResponse= JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var aReturnedSurcharges = aResponse.body.transactionaldata;
			
			expect(aReturnedSurcharges).toEqualObject(aExpectedResponse);
		});
		
		it("should get surcharge definitions and empty surcharge values for project if no surcharge values defined yet", () => {
			// arrange
			// clear surcharge values
			oMockstar.clearTables(["project_material_price_surcharge_values"]);

			var aExpectedResponse = new TestDataUtility(aExpectedMaterialPriceSurcharges).build();
			aExpectedResponse[0].PERIOD_VALUES = [];
			
			// act
			var oRequest = buildRequest(params, $.net.http.GET, null, "projects/material-price-surcharges");
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			var aResponse= JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var aReturnedSurcharges = aResponse.body.transactionaldata;
			
			expect(aReturnedSurcharges).toEqualObject(aExpectedResponse);
		});
		
	});	
});
	
	describe("update project lifecycle details (PUT)", function() {
		var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
		var oProject;
		var params = [{ "name" : "id", "value" : sProjectId }];
		
		// The common tests for similar methods are put within this function to reuse them. The test context is then inserted over the parameters of this function. 
	    function executeCommonUpdateTests(fnSetupTest, sServiceName, aRequestObjects, aEmptyLifecyclePeriodValuesRequest, sValueProperty){
	        describe(`common tests for ${sServiceName}`, function(){

	            beforeEach(function(){
	            	fnSetupTest();
	            });
	            
	    		function runOutsideOfProjectTest(iLifecyclePeriodFrom){
	    			// arrange		
	    			var aRequestBody = new TestDataUtility(aRequestObjects).build();
	    			
	    			aRequestBody[0][sValueProperty] = [{
	    				LIFECYCLE_PERIOD_FROM : iLifecyclePeriodFrom,
	    				VALUE : 1
	    			}];

	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act and assert
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_VALIDATION_ERROR.code);
	    		}	

	    		it("should throw exception if project does not exist", () => {
	    			// arrange
	    			oMockstar.clearTables(["project", "open_projects"])
	    			var aRequestBody = new TestDataUtility(aRequestObjects).build();
	    			
	    			// arrange
	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act and assert
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
	    		});
	    		
	    		it("should throw exception if project is not opened", () => {
	    			// arrange
	    			oMockstar.clearTable("open_projects");
	    			var aRequestBody = new TestDataUtility(aRequestObjects).build();
	    			
	    			// arrange
	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act and assert
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_NOT_WRITABLE_ERROR.code);
	    		});
	    		
	    		it("should throw exception if project is not opened in write mode", () => {
	    			// arrange
	    			oMockstar.clearTable("open_projects");
	    			oMockstar.insertTableData("open_projects", {
	    				"SESSION_ID": sUserId,
	    				"PROJECT_ID": oProject.PROJECT_ID,
	    				"IS_WRITEABLE": 0
	    			});
	    			var aRequestBody = new TestDataUtility(aRequestObjects).build();
	    			
	    			// arrange
	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act and assert
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_NOT_WRITABLE_ERROR.code);
	    		});
	    		
				
	    		it("should throw exception if project is opened by other user in write mode", () => {
	    			// arrange
	    			oMockstar.clearTable("open_projects");
	    			oMockstar.insertTableData("open_projects", {
	    				"SESSION_ID": "other_user",
	    				"PROJECT_ID": oProject.PROJECT_ID,
	    				"IS_WRITEABLE": 1
	    			});
	    			var aRequestBody = new TestDataUtility(aRequestObjects).build();
	    			
	    			// arrange
	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act and assert
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.PROJECT_NOT_WRITABLE_ERROR.code);
	    		});		

	    		it("should throw exception if START_OF_PROJECT is not defined", () => {
	    			oProject.START_OF_PROJECT = null;
	    			oMockstar.clearTable("project");
	    			oMockstar.insertTableData("project", oProject);
	    			var oRequest = buildRequest(params, $.net.http.PUT, aEmptyLifecyclePeriodValuesRequest, sServiceName);
	    			
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_UNEXPECTED_EXCEPTION.code);
	    		});
	    		
	    		it("should throw exception if END_OF_PROJECT is not defined", () => {
	    			oProject.END_OF_PROJECT = null;
	    			oMockstar.clearTable("project");
	    			oMockstar.insertTableData("project", oProject);
	    			var oRequest = buildRequest(params, $.net.http.PUT, aEmptyLifecyclePeriodValuesRequest, sServiceName);
	    			
	    			requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_UNEXPECTED_EXCEPTION.code);
	    		});
	    		
	    		it("should throw exception if user does not have at least CREATE_EDIT instance privilege for project", () => {
	    			oMockstar.clearTable("authorization");
	    			enterPrivilege(oProject.PROJECT_ID, sUserId, InstancePrivileges.READ);  // Set READ privilege for project and user
	    			
	    			var aRequestBody = new TestDataUtility(aRequestObjects).build();
	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
					// act and assert
					requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_ACCESS_DENIED.code);
	    		});
	    				
	    		it("should throw exception if lifecycle periods of surcharge values are before project start", () => {
	    			var iLowestValidPeriodFrom = ProjectService.calculateLifecyclePeriodFrom(oProject.START_OF_PROJECT, LifecycleInterval.YEARLY);
	    			runOutsideOfProjectTest(iLowestValidPeriodFrom - 1);
	    		});
	    		
	    		it("should throw exception if lifecycle periods of surcharge values are after project end", () => {
	    			var iHighestValidPeriodFrom = ProjectService.calculateLifecyclePeriodFrom(oProject.END_OF_PROJECT, LifecycleInterval.YEARLY);
	    			runOutsideOfProjectTest(iHighestValidPeriodFrom + 1);
	    		});
	    		
	        });
	    }
	    
		// The common tests for similar methods are put within this function to reuse them. The test context is then inserted over the parameters of this function. 
	    function executeSurchargeUpdateTests(fnSetupTest, fnCheckDatabase, sServiceName, aRequestSurcharges){
	        describe(`surcharge-specific tests for ${sServiceName}`, function(){

	            beforeEach(function(){
	            	fnSetupTest();
	            });
	            
	    		it("should set surcharges for a project if no surcharge definition exists yet", () => {
	    			// arrange
	    			// clear all surcharge tables to set up the situation for setting values initially
	    			oMockstar.clearTables(["project_activity_price_surcharges", "project_activity_price_surcharge_values", "project_material_price_surcharges", "project_material_price_surcharge_values"]);
	    			var aRequestBody = new TestDataUtility(aRequestSurcharges).build();

	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act
	    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	    			
	    			// assert
	    			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
	    			var oResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	    			expect(oResponse.body.transactionaldata).toEqualObject(aRequestSurcharges);
	    			
	    			fnCheckDatabase(oResponse.body.transactionaldata);
	    		});
	    		
	    		it("should set 2 surcharge definitions with two different values for same period", () => {
	    			// arrange
	    			// clear all surcharge tables to set up the situation for setting values initially
	    			oMockstar.clearTables(["project_activity_price_surcharges", "project_activity_price_surcharge_values", "project_material_price_surcharges", "project_material_price_surcharge_values"]);
	    			var aRequestBody = new TestDataUtility(aRequestSurcharges).build();
	    			var aSecondDefinion = new TestDataUtility(aRequestSurcharges).build();
	    			aSecondDefinion[0].PLANT_ID = 'PL4';
	    			aSecondDefinion[0].PLANT_DESCRIPTION = null;
	    			aSecondDefinion[0].PERIOD_VALUES[0].VALUE = '100.0000000';
	    			aSecondDefinion[0].PERIOD_VALUES[1].VALUE = '200.0000000';
	    			aSecondDefinion[0].PERIOD_VALUES[2].VALUE = '300.0000000';
	    				
	    			aRequestBody.push(aSecondDefinion[0]);

	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act
	    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	    			
	    			// assert
	    			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
	    			var oResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	    			expect(oResponse.body.transactionaldata).toEqualObject(aRequestBody);
	    		});
	    		    		
	    		it("should set surcharges and return null PLANT_DESCRIPTION for PLANT_ID = ''", () => {
	    			// arrange
	    			var aRequestBody = new TestDataUtility(aRequestSurcharges).build();
	    			// Set definition to blank
	    			aRequestBody[0].PLANT_ID = "";
	    			var aExpectedBody = new TestDataUtility(aRequestBody).build();
	    			aExpectedBody[0].PLANT_DESCRIPTION = null;

	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act
	    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	    			
	    			// assert
	    			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
	    			var oResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	    			expect(oResponse.body.transactionaldata).toEqualObject(aExpectedBody);
	    			
	    			fnCheckDatabase(oResponse.body.transactionaldata);
	    		});
	    		
	    		it("should set surcharges and return null PLANT_DESCRIPTION for PLANT_ID = '*'", () => {
	    			// arrange
	    			var aRequestBody = new TestDataUtility(aRequestSurcharges).build();
	    			// Set definition to blank
	    			aRequestBody[0].PLANT_ID = "*";
	    			var aExpectedBody = new TestDataUtility(aRequestBody).build();
	    			aExpectedBody[0].PLANT_DESCRIPTION = null;

	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act
	    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	    			
	    			// assert
	    			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
	    			var oResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	    			expect(oResponse.body.transactionaldata).toEqualObject(aExpectedBody);
	    			
	    			fnCheckDatabase(oResponse.body.transactionaldata);
	    		});
	    		
	    		
	    		it("should update existing surcharge definitions and values for a project", () => {
	    			// arrange
	    			var aRequestBody = new TestDataUtility(aRequestSurcharges).build();
	    			
	    			// Change surcharge values in request
	    			aRequestBody[0].PERIOD_VALUES = [{
	    				"LIFECYCLE_PERIOD_FROM": 1404,
	    				"LIFECYCLE_PERIOD_FROM_DATE":	'2017-01-01T00:00:00.000Z',
	    				"VALUE": '7.0000000'
	    						}, {
	    				"LIFECYCLE_PERIOD_FROM": 1416,
	    				"LIFECYCLE_PERIOD_FROM_DATE":	'2018-01-01T00:00:00.000Z',
	    				"VALUE": '10.0000000'
	    						}, {
	    				"LIFECYCLE_PERIOD_FROM": 1428,
	    				"LIFECYCLE_PERIOD_FROM_DATE":	'2019-01-01T00:00:00.000Z',
	    				"VALUE": '20.0000000'
	    			}];

	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act
	    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	    					
	    			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
	    			var oResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	    			expect(oResponse.body.transactionaldata).toEqualObject(aRequestBody);
	    			
	    			fnCheckDatabase(aRequestBody);
	    		});
	    		
	    		it("should delete all existing surcharge definitions and values if no surcharges in request", () => {
	    			// arrange
	    			var aRequestBody = []; //new TestDataUtility(aRequestSurcharges).build();

	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act
	    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	    					
	    			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
	    			var oResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	    			expect(oResponse.body.transactionaldata).toEqualObject(aRequestBody);
	    			
	    			fnCheckDatabase(aRequestBody);
	    		});
	    		
	    		it("should update surcharge values to null for a project if they existed before", () => {
	    			// arrange
	    			var aRequestBody = new TestDataUtility(aRequestSurcharges).build();
	    			aRequestBody[0].PERIOD_VALUES = [];
	    			
	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act
	    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	    			
	    			// assert
	    			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
	    			var oResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	    			expect(oResponse.body.transactionaldata).toEqualObject(aRequestBody);
	    			
	    			fnCheckDatabase(aRequestBody);
	    		});
	    			
	    		it("should update surcharge values and return PROJECT_SURCHARGES_ACCOUNT_GROUPS_OVERLAPPING_WARNING if account groups have overlapping accounts", () => {
	    			// arrange
	    			// Insert account groups with overlapping account 
	    			let aAccountGroupsTest = {
	    					"ACCOUNT_GROUP_ID" : [700, 900],
	    					"CONTROLLING_AREA_ID" : ['1000', '1000'],
	    					"COST_PORTION" : [7, 7],
	    					"_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
	    					"_VALID_TO" : [null, null],
	    					"_SOURCE" : [1, 1],
	    					"_CREATED_BY" : [sUserId, sUserId]
	    			};
	    			oMockstar.insertTableData("account_group", aAccountGroupsTest);

	    			oMockstar.insertTableData("account_account_group", testData.oAccountAccountGroupTestData);
	    			let oAccountWithOverlap = new TestDataUtility(testData.oAccountAccountGroupTestData).getObject(0); 
	    			oAccountWithOverlap.ACCOUNT_GROUP_ID = 900;
	    			oAccountWithOverlap.FROM_ACCOUNT_ID = "0",
	    			oAccountWithOverlap.TO_ACCOUNT_ID = "1",
	    			oMockstar.insertTableData("account_account_group", oAccountWithOverlap);
	    			
	    			oMockstar.insertTableData("account", testData.oAccountTestDataPlc);
	    			
	    			let aRequestBody = [];
	    			let oSurchargeDefinition = new TestDataUtility(aRequestSurcharges[0]).build();
	    			oSurchargeDefinition.PERIOD_VALUES = [];
	    			aRequestBody.push(oSurchargeDefinition);
	    			// Add to request the surcharge definition with an account group that has an overlapping account
	    			let oSurchargeDefinitionWithOverlappingAccount = new TestDataUtility(oSurchargeDefinition).build();
	    			oSurchargeDefinitionWithOverlappingAccount.ACCOUNT_GROUP_ID = 900;
	    			aRequestBody.push(oSurchargeDefinitionWithOverlappingAccount);

	    			let oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);
	    			
	    			// act
	    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	    			
	    			// assert
	    			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
	    			let oResponse = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);		
	    			expect(oResponse.body.transactionaldata.length).toBe(2);

	    			// Check response message
	    			expect(oResponse.head.messages.length).toEqual(1);
	    			expect(oResponse.head.messages[0].code).toEqual("PROJECT_SURCHARGES_ACCOUNT_GROUPS_OVERLAPPING_WARNING");
	    			expect(oResponse.head.messages[0].details.lifecycleSurchargeDetailsObj.ACCOUNT_GROUPS_WITH_OVERLAPS).toEqual(['700', '900']);
	    		});		    				    		
	    		
	    		it("should throw exception if request has non-unique surcharge definitions -> throw GENERAL_UNIQUE_CONSTRAINT_VIOLATED_ERROR", () => {
	    			// arrange
	    			// clear all surcharge tables to set up the situation for setting values initially
	    			oMockstar.clearTables(["project_activity_price_surcharges", "project_activity_price_surcharge_values", "project_material_price_surcharges", "project_material_price_surcharge_values"]);
	    			var aRequestBody = new TestDataUtility(aRequestSurcharges).build();
	    			var aDuplicatedDefinion = new TestDataUtility(aRequestSurcharges).build();
	    			aRequestBody.push(aDuplicatedDefinion[0]);

	    			var oRequest = buildRequest(params, $.net.http.PUT, aRequestBody, sServiceName);

					// act and assert
					requestAndCheckDbNotChangedAndException(oRequest, messageCode.GENERAL_UNIQUE_CONSTRAINT_VIOLATED_ERROR.code);
	    		});
	        });
	    }	    
		

	describe("updateActivityPriceSurcharges (PUT)", function() {	
		var aRequestSurcharges = [{
			"PLANT_ID":             		testData.oPlantTextTestDataPlc.PLANT_ID[0],
			"PLANT_DESCRIPTION":    		testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0],
			"ACCOUNT_GROUP_ID":     		testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0],
			"ACCOUNT_GROUP_DESCRIPTION": 	testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0],
			// all referenced master data must exists; COST_CENTER[0] and other master data at index 0 is not valid anymore
			"COST_CENTER_ID": 				testData.oCostCenterTestDataPlc.COST_CENTER_ID[1],
			// Not compared since the test data are not consistent for this case
            "COST_CENTER_DESCRIPTION":      null, // [testData.oCostCenterTextTestDataPlc.COST_CENTER_DESCRIPTION[0],
			"ACTIVITY_TYPE_ID": 			testData.oActivityTypeTestDataPlc.ACTIVITY_TYPE_ID[1],
            "ACTIVITY_TYPE_DESCRIPTION":	testData.oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_DESCRIPTION[2],
            "PERIOD_VALUES":[
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2017-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[0].toString()
            	},
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2018-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[1].toString()
            	},
            	{
            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2],
            		"LIFECYCLE_PERIOD_FROM_DATE":	'2019-01-01T00:00:00.000Z',
            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[2].toString()
            	}
			],
		}];		
		var aEmptyLifecyclePeriodValuesRequest = [{
			"PLANT_ID":             		testData.oPlantTextTestDataPlc.PLANT_ID[0],
			"ACCOUNT_GROUP_ID":     		testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0],
			"COST_CENTER_ID": 				testData.oCostCenterTestDataPlc.COST_CENTER_ID[1],
			"ACTIVITY_TYPE_ID":				testData.oActivityTypeTestDataPlc.ACTIVITY_TYPE_ID[1],
			"PERIOD_VALUES": []
		}];
		
		function setupTest(){
			oMockstar.clearTables(["project", "open_projects", "authorization", "company_code", "plant", "plant__text", "session", "project_activity_price_surcharges", "project_activity_price_surcharge_values"]);
			
			// Insert master data
			oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
			oMockstar.insertTableData("plant", testData.oPlantTestDataPlc);
			oMockstar.insertTableData("plant__text", testData.oPlantTextTestDataPlc);
			oMockstar.insertTableData("account_group", testData.oAccountGroupTestDataPlc);
			oMockstar.insertTableData("account_group__text", testData.oAccountGroupTextTest);
			oMockstar.insertTableData("activity_type__text", testData.oActivityTypeTextTestDataPlc);
			oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
			oMockstar.insertTableData("cost_center__text", testData.oCostCenterTextTestDataPlc);
			oMockstar.insertTableData("plant__text", testData.oPlantTextTestDataPlc);		
			
			// Insert surcharges
			oMockstar.insertTableData("project_activity_price_surcharges", testData.oProjectActivityPriceSurcharges);
			oMockstar.insertTableData("project_activity_price_surcharge_values", testData.oProjectActivityPriceSurchargeValues);
			
			// Insert a user with language 'EN' since for this the master data descriptions are available
			oMockstar.insertTableData("session", 
			{
				SESSION_ID : [ sSessionId ],
				USER_ID : [ sUserId ],
				LANGUAGE : [ testData.sEnLanguage ],
				LAST_ACTIVITY_TIME : [ testData.sExpectedDate]
			});
			
		
			// the project defined in testData has no reasonable set START_OF_PROJECT and END_OF_PROJECT, for which quantities could be defined (can only be defined between start and end);
			// this is fixed by modifying the test data here
			oProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
			oProject.START_OF_PROJECT = new Date("2017-01-01");
			oProject.END_OF_PROJECT = new Date("2019-01-01");
			oMockstar.insertTableData("project", oProject);
			oMockstar.insertTableData("open_projects", {
				"SESSION_ID": sUserId,
				"PROJECT_ID": oProject.PROJECT_ID,
				"IS_WRITEABLE": 1
			});
			
			enterPrivilege(oProject.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
        }
		
		function checkDatabaseTables(aExpectedSurcharges) {
			_.each(aExpectedSurcharges, oExpectedSurcharges => {
				var aDbSurcharges = oMockstar.execQuery(
					`	select PLANT_ID, ACCOUNT_GROUP_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID
						from {{project_activity_price_surcharges}} 
						where project_id = '${sProjectId}';`
				);
				expect(aDbSurcharges).toMatchData(
				        _.pick(oExpectedSurcharges, ["PLANT_ID", "ACCOUNT_GROUP_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID"] ),
				        		["PLANT_ID", "ACCOUNT_GROUP_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID"]);

				var aDbSurchargeValues = oMockstar.execQuery(
					`select surcharge_values.LIFECYCLE_PERIOD_FROM, surcharge_values.VALUE
						from {{project_activity_price_surcharge_values}} as surcharge_values 
						inner join {{project_activity_price_surcharges}} as definitions 
							on definitions.RULE_ID = surcharge_values.RULE_ID
						where definitions.project_id = '${sProjectId}';`
				);
				var aResponseLifecyclePeriods = []; 
				_.each(oExpectedSurcharges.PERIOD_VALUES, oLifecyclePeriod => {
				    aResponseLifecyclePeriods.push( _.pick(oLifecyclePeriod, ["LIFECYCLE_PERIOD_FROM", "VALUE"]));
				});
            
				expect(aDbSurchargeValues).toMatchData(aResponseLifecyclePeriods, ["LIFECYCLE_PERIOD_FROM", "VALUE"]);
			});
			
			// checking if values got cleaned up; means that all the values not referenced from project_activity_price_surcharges should be removed from the table;
			// this must be done in a separate statement since the used inner join above cannot detect additional rule_ids in project_activity_price_surcharge_values (only missing rule_ids)
			var iInvalidValuesCount = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values", `rule_id not in (select rule_id from {{project_activity_price_surcharges}})`)
			expect(iInvalidValuesCount).toBe(0);
		}
		
		beforeEach(function() {
			setupTest();
		});	
		
		//////////////////////////////////////////////////////////////
		// Execute common tests related to project lifecycle details update
		//////////////////////////////////////////////////////////////
		executeCommonUpdateTests(setupTest, "projects/activity-price-surcharges", aRequestSurcharges, aEmptyLifecyclePeriodValuesRequest, "LIFECYCLE_PERIODS");
		
		//////////////////////////////////////////////////////////////
		// Execute tests specific to surcharge update
		//////////////////////////////////////////////////////////////		
		executeSurchargeUpdateTests(setupTest, checkDatabaseTables, "projects/activity-price-surcharges", aRequestSurcharges);				
	});
				
		describe("updateMaterialPriceSurcharges (PUT)", function() {	
		
			var aRequestSurcharges = [{
				"PLANT_ID":             		testData.oPlantTextTestDataPlc.PLANT_ID[0],
				"PLANT_DESCRIPTION":    		testData.oPlantTextTestDataPlc.PLANT_DESCRIPTION[0],
				"ACCOUNT_GROUP_ID":     		testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0],
				"ACCOUNT_GROUP_DESCRIPTION": 	testData.oAccountGroupTextTest.ACCOUNT_GROUP_DESCRIPTION[0],
				// all referenced master data must exists; MATERIAL_GROUP_ID[0] and other master data at index 0 is not valid anymore
				"MATERIAL_GROUP_ID": 			testData.oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[1],
	            "MATERIAL_GROUP_DESCRIPTION":   testData.oMaterialGroupTextTestDataPlc.MATERIAL_GROUP_DESCRIPTION[2],
				"MATERIAL_TYPE_ID": 			testData.oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[1],
	            "MATERIAL_TYPE_DESCRIPTION":	testData.oMaterialTypeTextTestDataPlc.MATERIAL_TYPE_DESCRIPTION[2],
	            "PERIOD_VALUES":[
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[0],
	            		"LIFECYCLE_PERIOD_FROM_DATE":	'2017-01-01T00:00:00.000Z',
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[0].toString()
	            	},
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[1],
	            		"LIFECYCLE_PERIOD_FROM_DATE":	'2018-01-01T00:00:00.000Z',
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[1].toString()
	            	},
	            	{
	            		"LIFECYCLE_PERIOD_FROM": 		testData.oProjectActivityPriceSurchargeValues.LIFECYCLE_PERIOD_FROM[2],
	            		"LIFECYCLE_PERIOD_FROM_DATE":	'2019-01-01T00:00:00.000Z',
	            		"VALUE":                		testData.oProjectActivityPriceSurchargeValues.VALUE[2].toString()
	            	}
				],
				"MATERIAL_ID":                   testData.oMaterialTestDataPlc.MATERIAL_ID[0],
				"MATERIAL_DESCRIPTION":          testData.oMaterialTextTestDataPlc.MATERIAL_DESCRIPTION[0]
			}];		
			var aEmptyLifecyclePeriodValuesRequest = [{
				"PLANT_ID":             		testData.oPlantTextTestDataPlc.PLANT_ID[0],
				"ACCOUNT_GROUP_ID":     		testData.oAccountGroupTextTest.ACCOUNT_GROUP_ID[0],
				"MATERIAL_GROUP_ID": 			testData.oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[1],
				"MATERIAL_TYPE_ID": 			testData.oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[1],
				"PERIOD_VALUES": 				[],
				"MATERIAL_ID":                  testData.oMaterialTestDataPlc.MATERIAL_ID[0]
			}];
			
			function setupTest(){
				oMockstar.clearTables(["project", "open_projects", "authorization", "company_code", "material_group__text", "material_type__text", "plant", "plant__text", "session", 
					"project_material_price_surcharges", "project_material_price_surcharge_values"]);
				
				// Insert master data
				oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				oMockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				oMockstar.insertTableData("plant__text", testData.oPlantTextTestDataPlc);

				oMockstar.insertTableData("account_group", testData.oAccountGroupTestDataPlc);
				oMockstar.insertTableData("account_group__text", testData.oAccountGroupTextTest);
				oMockstar.insertTableData("material_group__text", testData.oMaterialGroupTextTestDataPlc);
				oMockstar.insertTableData("material_type__text", testData.oMaterialTypeTextTestDataPlc);
				oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				oMockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
				
				// Insert surcharges
				oMockstar.insertTableData("project_material_price_surcharges", testData.oProjectMaterialPriceSurcharges);
				oMockstar.insertTableData("project_material_price_surcharge_values", testData.oProjectMaterialPriceSurchargeValues);
				
				// Insert a user with language 'EN' since for this the master data descriptions are available
				oMockstar.insertTableData("session", 
				{
					SESSION_ID : [ sSessionId ],
					USER_ID : [ sUserId ],
					LANGUAGE : [ testData.sEnLanguage ],
					LAST_ACTIVITY_TIME : [ testData.sExpectedDate]
				});
				
			
				// the project defined in testData has no reasonable set START_OF_PROJECT and END_OF_PROJECT, for which quantities could be defined (can only be defined between start and end);
				// this is fixed by modifying the test data here
				oProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
				oProject.START_OF_PROJECT = new Date("2017-01-01");
				oProject.END_OF_PROJECT = new Date("2019-01-01");
				oMockstar.insertTableData("project", oProject);
				oMockstar.insertTableData("open_projects", {
					"SESSION_ID": sUserId,
					"PROJECT_ID": oProject.PROJECT_ID,
					"IS_WRITEABLE": 1
				});
				
				enterPrivilege(oProject.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
	        }
			
			function checkDatabaseTables(aExpectedSurcharges) {
				_.each(aExpectedSurcharges, oExpectedSurcharges => {
					var aDbSurcharges = oMockstar.execQuery(
						`	select PLANT_ID, ACCOUNT_GROUP_ID, MATERIAL_GROUP_ID, MATERIAL_TYPE_ID
							from {{project_material_price_surcharges}} 
							where project_id = '${sProjectId}';`
					);
					expect(aDbSurcharges).toMatchData(
					        _.pick(oExpectedSurcharges, ["PLANT_ID", "ACCOUNT_GROUP_ID", "MATERIAL_GROUP_ID", "MATERIAL_TYPE_ID"] ),
					        		["PLANT_ID", "ACCOUNT_GROUP_ID", "MATERIAL_GROUP_ID", "MATERIAL_TYPE_ID"]);

					var aDbSurchargeValues = oMockstar.execQuery(
						`select surcharge_values.LIFECYCLE_PERIOD_FROM, surcharge_values.VALUE
							from {{project_material_price_surcharge_values}} as surcharge_values 
							inner join {{project_material_price_surcharges}} as definitions 
								on definitions.RULE_ID = surcharge_values.RULE_ID
							where definitions.project_id = '${sProjectId}';`
					);
					var aResponseLifecyclePeriods = []; ;
					_.each(oExpectedSurcharges.PERIOD_VALUES, oLifecyclePeriod => {
					    aResponseLifecyclePeriods.push( _.pick(oLifecyclePeriod, ["LIFECYCLE_PERIOD_FROM", "VALUE"]));
					});
	            
					expect(aDbSurchargeValues).toMatchData(aResponseLifecyclePeriods, ["LIFECYCLE_PERIOD_FROM", "VALUE"]);
				});
				
				// checking if values got cleaned up; means that all the values not referenced from project_activity_price_surcharges should be removed from the table;
				// this must be done in a separate statement since the used inner join above cannot detect additional rule_ids in pprice_surcharge_values table (only missing rule_ids)
				var iInvalidValuesCount = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values", `rule_id not in (select rule_id from {{project_material_price_surcharges}})`)
				expect(iInvalidValuesCount).toBe(0);
			}
			
			beforeEach(function() {
				setupTest();
			});	
			
			//////////////////////////////////////////////////////////////
			// Execute common tests related to project lifecycle details update
			//////////////////////////////////////////////////////////////
			executeCommonUpdateTests(setupTest, "projects/material-price-surcharges", aRequestSurcharges, aEmptyLifecyclePeriodValuesRequest, "PERIOD_VALUES");
			
			//////////////////////////////////////////////////////////////
			// Execute tests specific to surcharge update
			//////////////////////////////////////////////////////////////		
			executeSurchargeUpdateTests(setupTest, checkDatabaseTables, "projects/material-price-surcharges", aRequestSurcharges);				
		});				
});

	

	/**
	 * Helper that acts and checks for tests in which the projects and assigned entities should not be deleted
	 */
	function requestAndCheckDbNotChangedAndException(oRequest, sExpectedMessageCode) {
		var iOriginalCount_Project = mockstarHelpers.getRowCount(oMockstar, "project");
		var iOriginalCount_OpenProjects = mockstarHelpers.getRowCount(oMockstar, "open_projects");
		var iOriginalCount_Calculation = mockstarHelpers.getRowCount(oMockstar, "calculation");
		var iOriginalCount_CalculationVersion = mockstarHelpers.getRowCount(oMockstar, "calculation_version");
		var iOriginalCount_ItemAll = mockstarHelpers.getRowCount(oMockstar, "item");
		var iOriginalCount_Auth = mockstarHelpers.getRowCount(oMockstar, "authorization");
		var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
    	var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");
		var iOriginalCount_ActivityPriceSurcharges = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges");
    	var iOriginalCount_ActivityPriceSurchargeValues = mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values");
		var iOriginalCount_MaterialPriceSurcharges = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharges");
    	var iOriginalCount_MaterialPriceSurchargeValues = mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values");    	
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			var iOriginalCount_ItemExtAll = mockstarHelpers.getRowCount(oMockstar, "item_ext");
		}

		// act
		new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

		// assert
		
		//Check that no entity was deleted
		expect(mockstarHelpers.getRowCount(oMockstar, "project")).toEqual(iOriginalCount_Project);
		expect(mockstarHelpers.getRowCount(oMockstar, "open_projects")).toEqual(iOriginalCount_OpenProjects);
		expect(mockstarHelpers.getRowCount(oMockstar, "calculation")).toEqual(iOriginalCount_Calculation);
		expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version")).toEqual(iOriginalCount_CalculationVersion);
		expect(mockstarHelpers.getRowCount(oMockstar, "item")).toEqual(iOriginalCount_ItemAll);
		expect(mockstarHelpers.getRowCount(oMockstar, "authorization")).toEqual(iOriginalCount_Auth);
		expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
	    expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);
		expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharges")).toBe(iOriginalCount_ActivityPriceSurcharges);
		expect(mockstarHelpers.getRowCount(oMockstar, "project_activity_price_surcharge_values")).toBe(iOriginalCount_ActivityPriceSurchargeValues);
		expect(mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharges")).toBe(iOriginalCount_MaterialPriceSurcharges);
		expect(mockstarHelpers.getRowCount(oMockstar, "project_material_price_surcharge_values")).toBe(iOriginalCount_MaterialPriceSurchargeValues);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(mockstarHelpers.getRowCount(oMockstar, "item_ext")).toEqual(iOriginalCount_ItemExtAll);
		}

		// Check response
		var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		expect(oResponseObject.head.messages.length).toEqual(1);
		expect(oResponseObject.head.messages[0].code).toEqual(sExpectedMessageCode);
		
		return oResponseObject;
	}
	
}).addTags(["Project_Calculation_Version_Integration"]);