/*jslint undef:true*/
/**
 * These are the integration tests for calculations.xsjslib. Here we test the end-to-end runs.
 *
 */
var _ = require("lodash");
var helpers = require("../../../lib/xs/util/helpers");
var mockstarHelpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;
var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

var PersistencyImport = $.import("xs.db", "persistency");
var CalculationImport = $.import("xs.db", "persistency-calculation");
var AdministrationImport = $.import("xs.db", "persistency-administration");
var CalculationVersionImport = require("../../../lib/xs/db/persistency-calculationVersion");
var ItemImport = require("../../../lib/xs/db/persistency-item");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency = PersistencyImport.Persistency;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var MetaInformation = require("../../../lib/xs/util/constants").ServiceMetaInformation;
var MessageLibrary = require("../../../lib/xs/util/message");
var messageCode = MessageLibrary.Code;
var InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const TaskStatus             = require("../../../lib/xs/util/constants").TaskStatus;
var sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;
describe('xsjs.impl.calculations-integrationtests', function() {
	var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase();
	var oMockstar = null;

	var oDefaultResponseMock = null;
	var oPersistency = null;

	var sUserId = testData.sTestUser;
	var sSessionId = testData.sSessionId;

	var oTestCalculation = mockstarHelpers.convertToObject(testData.oCalculationTestData, 0);
	var oTestCalculationVersion = mockstarHelpers.convertToObject(testData.oCalculationVersionTestData, 0);
	var oTestTemporaryCalculationVersion = mockstarHelpers.convertToObject(testData.oCalculationVersionTemporaryTestData, 1);
	var oTestItem = mockstarHelpers.convertToObject(testData.oItemTestData, 0);

	var cOriginalProcedures = null;
	var mdOriginalProcedures = null;

	// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
	var params = [];
	params.get = function() {
		return undefined;
	};

	beforeOnce(function() {

		oMockstar = new MockstarFacade(
				{
					testmodel : {
						"create_item" : "sap.plc.db.calculationmanager.procedures/p_item_create",
						"get_items" : "sap.plc.db.calculationmanager.procedures/p_item_get_items",
						"delete_items" : "sap.plc.db.calculationmanager.procedures/p_item_delete_items_marked_for_deletion",
						"procSave" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_save",
						"procReadV" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_read",
						"procDelete" : "sap.plc.db.calculationmanager.procedures/p_calculation_delete",
						"calculation_configuration_masterdata_read" : "sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read",
						"calculation_create_as_copy" : "sap.plc.db.calculationmanager.procedures/p_calculation_create_as_copy",
						"calculate_one_time_costs": "sap.plc.db.calculationmanager.procedures/p_project_calculate_one_time_costs"
					},
					substituteTables : {
						gtt_calculation_version_ids: "sap.plc.db::temp.gtt_calculation_version_ids",
						authorization: "sap.plc.db::auth.t_auth_project",
						calculation : CalculationImport.Tables.calculation,
						open_calculation : CalculationImport.Tables.open_calculations,
						calculation_version : CalculationVersionImport.Tables.calculation_version,
						tag : {
							name : "sap.plc.db::basis.t_tag",
							data : testData.oTagTestData
						},
						entity_tags : {
							name : "sap.plc.db::basis.t_entity_tags",
							data : testData.oEntityTagsTestData
						},
						calculation_version_temporary : CalculationVersionImport.Tables.calculation_version_temporary,
						open_calculation_version : CalculationVersionImport.Tables.open_calculation_versions,
						item_temporary : ItemImport.Tables.item_temporary,
						item_temporary_ext : ItemImport.Tables.item_temporary_ext,
						item : ItemImport.Tables.item,
						item_ext : ItemImport.Tables.item_ext,
						metadata : {
							name : "sap.plc.db::basis.t_metadata",
							data : testData.mCsvFiles.metadata
						},
						metadata_text : "sap.plc.db::basis.t_metadata__text",
						metadata_item_attributes : {
							name : "sap.plc.db::basis.t_metadata_item_attributes",
							data : testData.mCsvFiles.metadata_item_attributes
						},
						session : {
							name : CalculationImport.Tables.session,
							data : {
								SESSION_ID : [ sSessionId ],
								USER_ID : [ sUserId ],
								LANGUAGE : [ testData.sDefaultLanguage ],
								LAST_ACTIVITY_TIME : [ testData.sExpectedDate]
							}
						},
						costing_sheet: {
							name: "sap.plc.db::basis.t_costing_sheet",
							data: testData.oCostingSheetTestData
						},
						costing_sheet__text : "sap.plc.db::basis.t_costing_sheet__text",
						costing_sheet_row : "sap.plc.db::basis.t_costing_sheet_row",
						costing_sheet_row__text : "sap.plc.db::basis.t_costing_sheet_row__text",
						costing_sheet_base:"sap.plc.db::basis.t_costing_sheet_base",
						costing_sheet_base_row: "sap.plc.db::basis.t_costing_sheet_base_row",
						costing_sheet_overhead:  "sap.plc.db::basis.t_costing_sheet_overhead",
						costing_sheet_overhead_row: "sap.plc.db::basis.t_costing_sheet_overhead_row",
						costing_sheet_row_dependencies: "sap.plc.db::basis.t_costing_sheet_row_dependencies",
						component_split: {
							name: "sap.plc.db::basis.t_component_split",
							data: testData.oComponentSplitTest
						},
						status: {
							name: "sap.plc.db::basis.t_status",
							data: testData.oStatusTestData
						},
						status__text: {
							name: "sap.plc.db::basis.t_status__text",
							data: testData.oStatusTextTestData
						},
						component_split__text : "sap.plc.db::basis.t_component_split__text",
						component_split_account_group : "sap.plc.db::basis.t_component_split_account_group",
						account_group : "sap.plc.db::basis.t_account_group",
						account_group__text : "sap.plc.db::basis.t_account_group__text",	
						task : "sap.plc.db::basis.t_task",
						project: 'sap.plc.db::basis.t_project',
						default_settings : {
							name : "sap.plc.db::basis.t_default_settings",
							data : {
								"USER_ID" : [ "" ],
								"CONTROLLING_AREA_ID" : [ "1000" ],
								"COMPANY_CODE_ID" : [ "CC1" ],
								"PLANT_ID" : [ "PL1" ],
								"REPORT_CURRENCY_ID" : [ "EUR" ],
								"COMPONENT_SPLIT_ID" : [ "1" ],
								"COSTING_SHEET_ID" : [ "COGM" ]
							}
						},
						uom : {
							name : "sap.plc.db::basis.t_uom",
							data : {
								UOM_ID : [ "ST", "PC" ],
								DIMENSION_ID : [ "", "" ],
								NUMERATOR : [ 1, 1 ],
								DENOMINATOR : [ 1, 1 ],
								EXPONENT_BASE10 : [ 1, 1 ],
								SI_CONSTANT : [ "1.1", "1.1" ],
								_VALID_FROM: [testData.sValidFromDate, testData.sValidFromDate ],
							}
						},
						t006 : {
							name : "sap.plc.db::repl.t006",
							data : {
								MSEHI : [ "KG" ],
								DIMID : [ "" ],
								ZAEHL : [ 1 ],
								NENNR : [ 1 ],
								EXP10 : [ 1 ],
								ADDKO : [ "1.1" ]

							}
						},
						currency : {
							name : "sap.plc.db::basis.t_currency",
							data :  {
								CURRENCY_ID : [ "EUR", "USD" ],
								_VALID_FROM : [ testData.sValidFromDate, testData.sValidFromDate]
							}
						},
						exchange_rate_type : {
							name : "sap.plc.db::basis.t_exchange_rate_type",
							data :  {
								EXCHANGE_RATE_TYPE_ID : [ sDefaultExchangeRateType, "AVG" ]
								}
						},
						controlling_area : {
							name : "sap.plc.db::basis.t_controlling_area",
							data : {
								CONTROLLING_AREA_ID : [ "1000"],
								_VALID_FROM : [testData.sValidFromDate]
							}
						},
						tka01 : {
							name : "sap.plc.db::repl.tka01",
							data : {
								KOKRS : [ "2000"],
								WAERS : ["1"],
								KTOPL : [ "1"],
								LMONA : ["1"]
							}
						},
						project_lifecycle_configuration: {
							name: "sap.plc.db::basis.t_project_lifecycle_configuration",
						},
						lifecycle_period_value: {
							name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
						},
						price_determination_strategy: {
							name: "sap.plc.db::basis.t_price_determination_strategy",
							data: testData.oPriceDeterminationStrategyTestData
						},
						one_time_project_cost:{ 
							name: "sap.plc.db::basis.t_one_time_project_cost",
							data: testData.oProjectOneTimeProjectCost
						}, 
						one_time_product_cost: {
							name: "sap.plc.db::basis.t_one_time_product_cost", 
							data: testData.oProjectOneTimeProductCost
						},
						one_time_cost_lifecycle_value: {
							name: "sap.plc.db::basis.t_one_time_cost_lifecycle_value",
							data: testData.oProjectOneTimeCostLifecycleValue
						},
						lifecycle_period_type: "sap.plc.db::basis.t_project_lifecycle_period_type",
						lifecycle_monthly_period: "sap.plc.db::basis.t_project_monthly_lifecycle_period"
					},
					csvPackage : testData.sCsvPackage
				});

		if (!oMockstar.disableMockstar) {
			cOriginalProcedures = CalculationImport.Procedures;
			CalculationImport.Procedures = Object.freeze({
				calculation_delete : procedurePrefix + "." + CalculationImport.Procedures.calculation_delete,
				calculation_version_save : procedurePrefix + "." + CalculationVersionImport.Procedures.calculation_version_save,
				calculation : procedurePrefix + '.sap.plc.db.calcengine.procedures::p_calculation',
				delete_item : procedurePrefix + "." + ItemImport.Procedures.delete_item,
				delete_items : procedurePrefix + "." + ItemImport.Procedures.delete_items_marked_for_deletion,
				get_items : procedurePrefix + "." + ItemImport.Procedures.get_items,
				calculation_create_as_copy : procedurePrefix = "." + CalculationImport.Procedures.calculation_create_as_copy
			});
			mdOriginalProcedures = AdministrationImport.Procedures;
			AdministrationImport.Procedures = Object.freeze({
				calculation_configuration_masterdata_read : procedurePrefix
				+ '.sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read'

			});
			ItemImport.Procedures = Object.freeze({
				create_item : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_item_create'
			});
		}
	});

	afterOnce(function() {
		if (!oMockstar.disableMockstar) {
			CalculationImport.Procedures = cOriginalProcedures;
			AdministrationImport.Procedures = mdOriginalProcedures;
			oMockstar.cleanupMultiple([ "sap.plc.db.calculationmanager.procedures", "sap.plc.db.calcengine.procedures", "sap.plc.db.calcengine.views" ]);
			oMockstar.cleanup();
		}
	});

	beforeEach(function() {
		oMockstar.clearAllTables();
		oMockstar.initializeData();

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;
	});
	
	function enterPrivilege(sProjectId, sUserId, sPrivilege){
        oMockstar.insertTableData("authorization",{
           PROJECT_ID   : [sProjectId],
           USER_ID      : [sUserId],
           PRIVILEGE    : [sPrivilege]
        });
    }

	describe('create calculation as copy', function() {
		beforeEach(function() {
			oMockstar.clearAllTables();
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("calculation", oTestCalculation);
			oMockstar.insertTableData("calculation_version", oTestCalculationVersion);
			oMockstar.insertTableData("calculation_version_temporary", oTestTemporaryCalculationVersion);
			oMockstar.insertTableData("status", testData.oStatusTestData);
			oMockstar.insertTableData("status__text", testData.oStatusTextTestData);
			oMockstar.insertTableData("item", testData.oItemTestData);
			oMockstar.insertTableData("tag", testData.oTagTestData);
			oMockstar.insertTableData("entity_tags", testData.oEntityTagsTestData);
			enterPrivilege(oTestCalculation.PROJECT_ID, sUserId, InstancePrivileges.CREATE_EDIT);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_ext", testData.oItemExtData);
			}
			oMockstar.initializeData();
			
			spyOn($.trace, "error").and.callThrough();
			spyOn(helpers, "logError").and.callFake(function (msg) { $.trace.error(msg); });
		});

		var params = [ {
			"name" : "action",
			"value" : "copy-version"
		},
		{
			"name" : "calculate",
			"value" : false
		},
		{
			"name" : "id",
			"value" : testData.iCalculationVersionId
		} ];

		params.get = function(sArgument) {
			var value;
			_.each(this, function(oParameter) {
				if (oParameter.name === sArgument) {
					value = oParameter.value;
				}
			});
			return value;
		};

		function prepareRequest(sProjectId) {
			var oBody = {
					asString : function() {
						return JSON.stringify(
								{	
									PROJECT_ID : sProjectId
								});
					}};
			return mockstarHelpers.buildRequest("calculations", params, $.net.http.POST, oBody);
		}

		it('should create calculation with existing calculation version under same project and copy also the status that is copyable and active --> return valid calculation', function() {
			// arrange
			let oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkCopiedCalculation(oDefaultResponseMock, oTestCalculation.PROJECT_ID, oTestCalculationVersion.COSTING_SHEET_ID, oTestCalculationVersion.COMPONENT_SPLIT_ID, "ACTIVE");

		});

		function updateCalculationVersionStatusId(sNewStatusId) {

			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", {
				"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
				"CALCULATION_ID" : [ testData.iCalculationId ],
				"CALCULATION_VERSION_NAME" : [ "Baseline Version1" ],
				"STATUS_ID" : [sNewStatusId],
				"CALCULATION_VERSION_TYPE" : [ 1 ],
				"ROOT_ITEM_ID" : [ 3001 ],
				"CUSTOMER_ID" : [ "", "", "", "" ],
				"SALES_PRICE" : ["20.0000000" ],
				"SALES_PRICE_CURRENCY_ID" : [ "EUR" ],
				"REPORT_CURRENCY_ID" : [ "EUR" ],
				"COSTING_SHEET_ID" : [ "COGM" ],
				"COMPONENT_SPLIT_ID" : [ testData.sComponentSplitId ],
				"SALES_DOCUMENT" : ["DOC"],
				"START_OF_PRODUCTION" : [ testData.sExpectedDateWithoutTime ],
				"END_OF_PRODUCTION" : [ testData.sExpectedDateWithoutTime],
				"VALUATION_DATE" : [ testData.sExpectedDateWithoutTime ],
				"LAST_MODIFIED_ON" : [ testData.sExpectedDate ],
				"LAST_MODIFIED_BY" : [ testData.sTestUser ],
				"MASTER_DATA_TIMESTAMP" : [ testData.sMasterdataTimestampDate],
				"IS_FROZEN" : [ 0 ],
				"MATERIAL_PRICE_STRATEGY_ID": [ testData.sStandardPriceStrategy ],
				"ACTIVITY_PRICE_STRATEGY_ID": [ testData.sStandardPriceStrategy ]
			});
		}

		it('should create copy of existing calculation and set the default status because current status is active, but not copyable', function() {

			updateCalculationVersionStatusId("PENDING");

			// arrange
			let oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkCopiedCalculation(oDefaultResponseMock, oTestCalculation.PROJECT_ID, oTestCalculationVersion.COSTING_SHEET_ID, oTestCalculationVersion.COMPONENT_SPLIT_ID, "ACTIVE");

		});

		it('should create copy of existing calculation and set the default status because current status is copyable, but deactivated', function() {

			updateCalculationVersionStatusId("DRAFT");

			// arrange
			let oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkCopiedCalculation(oDefaultResponseMock, oTestCalculation.PROJECT_ID, oTestCalculationVersion.COSTING_SHEET_ID, oTestCalculationVersion.COMPONENT_SPLIT_ID, "ACTIVE");

		});

		it('should create copy of existing calculation and set the default status because there is no current status', function() {

			updateCalculationVersionStatusId(null);

			// arrange
			let oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkCopiedCalculation(oDefaultResponseMock, oTestCalculation.PROJECT_ID, oTestCalculationVersion.COSTING_SHEET_ID, oTestCalculationVersion.COMPONENT_SPLIT_ID, "ACTIVE");

		});

		it('should create copy of existing calculation and set the default status because current status is not copyable and deactivated', function() {

			updateCalculationVersionStatusId("INACTIVE");

			// arrange
			let oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkCopiedCalculation(oDefaultResponseMock, oTestCalculation.PROJECT_ID, oTestCalculationVersion.COSTING_SHEET_ID, oTestCalculationVersion.COMPONENT_SPLIT_ID, "ACTIVE");

		});

		it('should create copy of existing calculation and set no status because current status is not copyable and deactivated, also there is no default status', function() {

			updateCalculationVersionStatusId("INACTIVE");

			oMockstar.clearTable("status");
			oMockstar.insertTableData("status", {
				"STATUS_ID":['active','inactive','pending','draft'],
				"IS_DEFAULT":[0,0,0,0],
				"IS_ACTIVE":[1,0,1,1],
				"IS_STATUS_COPYABLE":[1,0,0,1],
				"DISPLAY_ORDER":[1,2,3,4],
				"CREATED_ON":["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
				"CREATED_BY":['activeUser','inactiveUser','pendingUser','draftUser'],
				"LAST_MODIFIED_ON":[,,,],
				"LAST_MODIFIED_BY":[,,,]
			});

			// arrange
			let oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkCopiedCalculation(oDefaultResponseMock, oTestCalculation.PROJECT_ID, oTestCalculationVersion.COSTING_SHEET_ID, oTestCalculationVersion.COMPONENT_SPLIT_ID, null);
		
		});
        
		it('should create calculation with existing calculation version under same project with compressed result--> return valid calculation', function() {
			const params = [ {
					"name" : "action",
					"value" : "copy-version"
				},
				{
					"name" : "calculate",
					"value" : true
				},
				{
					"name" : "id",
					"value" : testData.iCalculationVersionId
				},
				{
					"name" : "compressedResult",
					"value" : true
				}
				];

				params.get = function(sArgument) {
					let value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};
				const oBody = {
						asString : function() {
							return JSON.stringify(
									{	
										PROJECT_ID : oTestCalculation.PROJECT_ID
									});
						}};
				
				// arrange
				oMockstar.clearTable("item");
				let oItemTestData = new TestDataUtility(testData.oItemTestData).build();
				oItemTestData.ACCOUNT_ID = ["#AC11", "#AC11", "#AC11"];
				oMockstar.insertTableData("item", oItemTestData);
				const oRequest = mockstarHelpers.buildRequest("calculations", params, $.net.http.POST, oBody);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

    			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
    
                //Check transactionaldata
    			expect(oResponseObject.body.transactionaldata.length).toBe(1);
    
    			const oResponseCalculation = oResponseObject.body.transactionaldata[0];
    			expect(oResponseCalculation.CALCULATION_VERSIONS[0][MetaInformation.IsDirty]).toBeTruthy();
    			expect(oResponseCalculation.CALCULATION_NAME !== oTestCalculation.CALCULATION_NAME).toBeTruthy();
    			expect(oResponseCalculation.CALCULATION_VERSIONS.length).toBe(1);
    			expect(oResponseCalculation.PROJECT_ID).toBe(oTestCalculation.PROJECT_ID);
    
    			const oResponseCv = oResponseCalculation.CALCULATION_VERSIONS[0];
    			expect(oResponseCv.CALCULATION_ID !== oTestCalculation.CALCULATION_ID).toBeTruthy();
    			expect(oResponseCv.CALCULATION_VERSION_NAME).toBe(oTestCalculationVersion.CALCULATION_VERSION_NAME);
                
    			expect(oResponseCv.ITEMS_COMPRESSED.ITEM_ID.length).toBe(3);
    				
    			const oFields = _.pick(oResponseCv.ITEMS_COMPRESSED, ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'CALCULATION_VERSION_ID']);
    			    
    			expect(oFields).toMatchData(
    					   {'ITEM_ID': [3001, 3002, 3003],
    						'PARENT_ITEM_ID': [null, 3001, 3002],
    						'PREDECESSOR_ITEM_ID': [null, 3001, 3002],
    					    'CALCULATION_VERSION_ID': [oResponseCv.CALCULATION_VERSION_ID, oResponseCv.CALCULATION_VERSION_ID, oResponseCv.CALCULATION_VERSION_ID]
    					   }, ['ITEM_ID']);

    			//Check calculated fields
    			const oResponseCalculated = oResponseObject.body.calculated;
    			expect(oResponseCalculated.ITEM_CALCULATED_FIELDS_COMPRESSED.ITEM_ID.length).toBe(3);
    			const oCalculatedFields = _.pick(oResponseCalculated.ITEM_CALCULATED_FIELDS_COMPRESSED, ['ITEM_ID']);
    			
    			expect(oCalculatedFields).toMatchData(
    			    {
    			        'ITEM_ID' : [3001, 3002, 3003]
    			    }, ['ITEM_ID']
    			    );

		});

		if(jasmine.plcTestRunParameters.mode === 'all') {
			it('should create calculation with existing calculation version under same project --> insert correct data in t_calculation', function() {
				// arrange
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation}}"));

				expect(oTableData.CALCULATION_ID[1]).toBe(oResponseCalculation.CALCULATION_ID);
				expect(oTableData.PROJECT_ID[1]).toBe(oResponseCalculation.PROJECT_ID);
				expect(oTableData.CALCULATION_NAME[1]).toBe(oResponseCalculation.CALCULATION_NAME);
				expect(_.isNaN(Date.parse(oTableData.CREATED_ON[1]))).toBe(false);
				expect(oTableData.CREATED_BY[1]).toBe(oResponseCalculation.CREATED_BY);
				expect(_.isNaN(Date.parse(oTableData.LAST_MODIFIED_ON[1]))).toBe(false);
				expect(oTableData.LAST_MODIFIED_BY[1]).toBe(oResponseCalculation.LAST_MODIFIED_BY);
			});

			it('should create calculation with existing calculation version under same project --> insert correct data in t_calculation_version_temporary', function() {
				// arrange
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));

				expect(oTableData.CALCULATION_VERSION_ID.length).toBe(2);
				expect(oTableData.CALCULATION_VERSION_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				expect(oTableData.CALCULATION_VERSION_NAME[1]).toBe(oTestCalculationVersion.CALCULATION_VERSION_NAME);
				expect(oTableData.ROOT_ITEM_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].ROOT_ITEM_ID);
				expect(oTableData.CUSTOMER_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].CUSTOMER_ID);
				expect(oTableData.SALES_PRICE[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].SALES_PRICE);
				expect(oTableData.SALES_PRICE_CURRENCY_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].SALES_PRICE_CURRENCY_ID);
				expect(oTableData.REPORT_CURRENCY_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].REPORT_CURRENCY_ID);
				expect(oTableData.COSTING_SHEET_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].COSTING_SHEET_ID);
				expect(oTableData.COMPONENT_SPLIT_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].COMPONENT_SPLIT_ID);
				expect(oTableData.VALUATION_DATE[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].VALUATION_DATE);
				expect(oTableData.MASTER_DATA_TIMESTAMP[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].MASTER_DATA_TIMESTAMP);
				expect(oTableData.IS_FROZEN[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].IS_FROZEN);
				expect(oTableData.EXCHANGE_RATE_TYPE_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].EXCHANGE_RATE_TYPE_ID);
			});

			it('should create calculation with existing calculation version under same project --> insert correct data in t_item_temporary', function() {
				// arrange
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				var aResponseItems = oResponseCalculation.CALCULATION_VERSIONS[0].ITEMS;
				var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{item_temporary}}"));

				expect(oTableData.ITEM_ID.length).toBe(3);
				expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(aResponseItems[0].CALCULATION_VERSION_ID);
				expect(oTableData.CALCULATION_VERSION_ID[1]).toBe(aResponseItems[1].CALCULATION_VERSION_ID);
				expect(oTableData.CALCULATION_VERSION_ID[2]).toBe(aResponseItems[2].CALCULATION_VERSION_ID);
				expect(oTableData.ITEM_ID).toContain(aResponseItems[0].ITEM_ID);
				expect(oTableData.ITEM_ID).toContain(aResponseItems[1].ITEM_ID);
				expect(oTableData.ITEM_ID).toContain(aResponseItems[2].ITEM_ID);
			});
			
			it('should create calculation with existing calculation version and return information about referenced versions', function() {
				// arrange
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
				oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
				oMockstar.clearTable("item");
				var sExpectedDate = new Date().toJSON();
				oMockstar.insertTableData("item", {
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001, 3001, 7001],
					"CALCULATION_VERSION_ID" : [2809, 2809, 2, 4811, 2809, 2810, 5809],
					"PARENT_ITEM_ID" : [ null, 3001, 3001, null, 3001, null, null],
					"PREDECESSOR_ITEM_ID" : [ null, 3001, null, null, 3002, null, null],
					"IS_ACTIVE" : [ 1, 1, 1, 1, 1, 1, 1],
					"ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10, 0, 0],
					"CHILD_ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10, 0, 0],
					"REFERENCED_CALCULATION_VERSION_ID": [null, 2810, 4, null, 5809, null, null],
					"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
					"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser", "TestUser","TestUser"],
					"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
					"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser", "TestUser", "TestUser"]
				});
				//masterdata
				oMockstar.insertTableData("currency", testData.mCsvFiles.currency);
				oMockstar.insertTableData("uom", testData.mCsvFiles.uom);
				oMockstar.insertTableData("costing_sheet__text", testData.oCostingSheetTextTestData);
				oMockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
				oMockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
				oMockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
				oMockstar.insertTableData("costing_sheet_overhead", testData.oCostingSheetOverheadTestData);
				oMockstar.insertTableData("component_split", testData.oComponentSplitTest);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert

				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(helpers.isPlainObject(oResponseObject)).toBe(true);
				expect(oResponseObject.body.referencesdata.PROJECTS.length).toBe(2);
				expect(oResponseObject.body.referencesdata.CALCULATIONS.length).toBe(2);
				expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS.length).toBe(2);
				expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
				expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS[1].ITEMS.length).toBe(1);
				expect(oResponseObject.body.referencesdata.MASTERDATA.COSTING_SHEET_ENTITIES.length).toBe(1);
				expect(oResponseObject.body.referencesdata.MASTERDATA.COMPONENT_SPLIT_ENTITIES.length).toBe(1);
			});

			it('should not copy calculation if calculation version does not exist --> return error', function() {
				var params = [ {
					"name" : "action",
					"value" : "copy-version"
				},
				{
					"name" : "calculate",
					"value" : false
				},
				{
					"name" : "id",
					"value" : "11111111"
				} ];

				params.get = function(sArgument) {
					var value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};
				var oBody = {
						asString : function() {
							return JSON.stringify(
									{	
										PROJECT_ID : oTestCalculation.PROJECT_ID
									});
						}};
				
				// arrange
				var oRequest = mockstarHelpers.buildRequest("calculations", params, $.net.http.POST, oBody);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				// Check response
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect($.trace.error).toHaveBeenCalled(); 
			});
			
			it('should not copy calculation if target project does not exist --> return error', function() {
				// arrange
				enterPrivilege('PR_NonExisting', sUserId, InstancePrivileges.CREATE_EDIT);
				var oRequest = prepareRequest('PR_NonExisting');
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				
				// Check response
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect($.trace.error).toHaveBeenCalled(); 
			});
			
			it('should create calculation as copy under another project --> return valid calculation under another project', function() {
				// arrange
				var sAnotherProjectId = testData.oProjectTestData.PROJECT_ID[1];
				var oRequest = prepareRequest(sAnotherProjectId);
				enterPrivilege(sAnotherProjectId, sUserId, InstancePrivileges.CREATE_EDIT);

				var oCheckEntityTagsExists = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + testData.iCalculationId + " and entity_type = 'C'");
				expect(oCheckEntityTagsExists.columns.TAG_ID.rows[0]).toBe(2);
				oCheckEntityTagsExists = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + testData.iCalculationVersionId + " and entity_type = 'V'");
				expect(oCheckEntityTagsExists.columns.TAG_ID.rows[0]).toBe(1);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				checkCopiedCalculation(oDefaultResponseMock, sAnotherProjectId, oTestCalculationVersion.COSTING_SHEET_ID, oTestCalculationVersion.COMPONENT_SPLIT_ID, "ACTIVE");
			});
			
			it('should create calculation as copy under project within another controlling area --> reset non-existing master data, run account determination and return calculation with reset warnings', function() {
				// arrange
				var sAnotherProjectId = testData.oProjectTestData.PROJECT_ID[2];
				var oRequest = prepareRequest(sAnotherProjectId);
				enterPrivilege(sAnotherProjectId, sUserId, InstancePrivileges.CREATE_EDIT);

				if (jasmine.plcTestRunParameters.generatedFields === true) {
					// load metadata for custom fields, which are needed for successful test execution
					oMockstar.fillFromCsvFile("metadata", testData.oMetadataCustTestData);
				}
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				checkCopiedCalculation(oDefaultResponseMock, sAnotherProjectId, null, null, "ACTIVE");
				
				// check if warnings to reset master data are delivered
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var aMessages = oResponseObject.head.messages;
				expect(aMessages.length).toBe(3);
				expect(aMessages[0].code).toBe(messageCode.CALCULATIONVERSION_COSTING_SHEET_SET_TO_NULL_WARNING.code);
				expect(aMessages[1].code).toBe(messageCode.CALCULATIONVERSION_COMPONENT_SPLIT_SET_TO_NULL_WARNING.code);
				expect(aMessages[2].code).toBe(messageCode.CALCULATIONVERSION_ACCOUNTS_SET_TO_NULL_WARNING.code);
				
				var oReturnedItems = oResponseObject.body.transactionaldata[0].CALCULATION_VERSIONS[0].ITEMS;
				expect(oReturnedItems[0].ACCOUNT_ID).toBe(null);
				expect(oReturnedItems[1].ACCOUNT_ID).toBe(null);
				expect(oReturnedItems[2].ACCOUNT_ID).toBe(null);
				
	            // check non-existing master data have been set to null in db
				var iCopiedCalculationVersionId = oResponseObject.body.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID;
	    		var oUpdatedCalculationVersion = oMockstar.execQuery("select CALCULATION_VERSION_ID, COSTING_SHEET_ID, COMPONENT_SPLIT_ID from " +
	    				"{{calculation_version_temporary}} where calculation_version_id = " + iCopiedCalculationVersionId);

	    		expect(oUpdatedCalculationVersion).toMatchData(
	    				{
	    	    			"CALCULATION_VERSION_ID":  iCopiedCalculationVersionId,
	    	    			"COSTING_SHEET_ID":  null,
	    	    			"COMPONENT_SPLIT_ID":  null
	    	    		} , ["CALCULATION_VERSION_ID"]);
	    		
	    		var oUpdatedItems = oMockstar.execQuery("select ITEM_ID, ACCOUNT_ID from " +
	    				"{{item_temporary}} where calculation_version_id = " + iCopiedCalculationVersionId);

	    		expect(oUpdatedItems).toMatchData(
	    				{
	    					"ITEM_ID":  [testData.oItemTemporaryTestData.ITEM_ID[0], testData.oItemTemporaryTestData.ITEM_ID[1], testData.oItemTemporaryTestData.ITEM_ID[2]],
	    					"ACCOUNT_ID":  [null, null, null]
	    				} , ["ITEM_ID"]);
			});
			
			it('should create calculation as copy with compressed result under project within another controlling area --> reset non-existing master data, run account determination and return calculation with reset warnings', function() {
				const params = [ {
					"name" : "action",
					"value" : "copy-version"
				},
				{
					"name" : "calculate",
					"value" : false
				},
				{
					"name" : "id",
					"value" : testData.iCalculationVersionId
				},
				{
					"name" : "compressedResult",
					"value" : true
				}
				];

				params.get = function(sArgument) {
					let value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};
				const oBody = {
						asString : function() {
							return JSON.stringify(
									{	
										PROJECT_ID : testData.oProjectTestData.PROJECT_ID[2]
									});
						}};
				
				// arrange
				var sAnotherProjectId = testData.oProjectTestData.PROJECT_ID[2];
				const oRequest = mockstarHelpers.buildRequest("calculations", params, $.net.http.POST, oBody);
				enterPrivilege(sAnotherProjectId, sUserId, InstancePrivileges.CREATE_EDIT);
				
				if (jasmine.plcTestRunParameters.generatedFields === true) {
					// load metadata for custom fields, which are needed for successful test execution
					oMockstar.fillFromCsvFile("metadata", testData.oMetadataCustTestData);
				}
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			    expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			    
			    var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    
			    //check messages
			    var aMessages = oResponseObject.head.messages;
				expect(aMessages.length).toBe(3);
				expect(aMessages[0].code).toBe(messageCode.CALCULATIONVERSION_COSTING_SHEET_SET_TO_NULL_WARNING.code);
				expect(aMessages[1].code).toBe(messageCode.CALCULATIONVERSION_COMPONENT_SPLIT_SET_TO_NULL_WARNING.code);
				expect(aMessages[2].code).toBe(messageCode.CALCULATIONVERSION_ACCOUNTS_SET_TO_NULL_WARNING.code);
			    
			    //check calculation
			    var oResponseCalculation = oResponseObject.body.transactionaldata[0];
			    expect(oResponseCalculation.PROJECT_ID).toBe(sAnotherProjectId);
			    expect(oResponseCalculation.CALCULATION_VERSIONS[0][MetaInformation.IsDirty]).toBeTruthy();
    			expect(oResponseCalculation.CALCULATION_NAME !== oTestCalculation.CALCULATION_NAME).toBeTruthy();
    			expect(oResponseCalculation.CALCULATION_VERSIONS.length).toBe(1);
			    
			    //check calculation versions
			    var oResponseCv = oResponseCalculation.CALCULATION_VERSIONS[0];
			    expect(oResponseCv.CALCULATION_ID !== oTestCalculation.CALCULATION_ID).toBeTruthy();
    			expect(oResponseCv.CALCULATION_VERSION_NAME).toBe(oTestCalculationVersion.CALCULATION_VERSION_NAME);
				
				//check compressed items
				var oReturnedItems = oResponseCv.ITEMS_COMPRESSED;
				expect(oReturnedItems.ITEM_ID.length).toBe(3);

	            // check non-existing master data have been set to null in db
				var iCopiedCalculationVersionId = oResponseObject.body.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID;
	    		var oUpdatedCalculationVersion = oMockstar.execQuery("select CALCULATION_VERSION_ID, COSTING_SHEET_ID, COMPONENT_SPLIT_ID from " +
	    				"{{calculation_version_temporary}} where calculation_version_id = " + iCopiedCalculationVersionId);
	    		expect(oUpdatedCalculationVersion).toMatchData(
	    				{"CALCULATION_VERSION_ID":  iCopiedCalculationVersionId,
	    	    			"COSTING_SHEET_ID":  null,
	    	    			"COMPONENT_SPLIT_ID":  null
	    	    		} , ["CALCULATION_VERSION_ID"]);
	    	    		
	    		var oUpdatedItems = oMockstar.execQuery("select ITEM_ID, PARENT_ITEM_ID, PREDECESSOR_ITEM_ID, CALCULATION_VERSION_ID  from " +
	    				"{{item_temporary}} where calculation_version_id = " + iCopiedCalculationVersionId);
	    		expect(oUpdatedItems).toMatchData(
	    				{'ITEM_ID':  [testData.oItemTemporaryTestData.ITEM_ID[0], testData.oItemTemporaryTestData.ITEM_ID[1], testData.oItemTemporaryTestData.ITEM_ID[2]],
    					 'PARENT_ITEM_ID': [testData.oItemTemporaryTestData.PARENT_ITEM_ID[0], testData.oItemTemporaryTestData.PARENT_ITEM_ID[1], testData.oItemTemporaryTestData.PARENT_ITEM_ID[2]],
    					 'PREDECESSOR_ITEM_ID': [testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[0], testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1], testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[2]],
    					 'CALCULATION_VERSION_ID': [oResponseCv.CALCULATION_VERSION_ID, oResponseCv.CALCULATION_VERSION_ID, oResponseCv.CALCULATION_VERSION_ID]
    				 }, ['ITEM_ID']);
			});

			it('should throw GENERAL_VALIDATION_ERROR when copying a calculation with a name bigger than 500 characters', function() {
				// arrange
				const sName500Chars = "w3zFIsI9n4HWBaaKJqUe25OooVv9LlUfr3aMdLYY4KAAuimmbyIaEkvhffPL2RaeCh0HYBPaMdMJjKZuBARYXOFJFJXCqU0gIRFJU19MzO2L19zZcQQLyZcQcQXJXBMnEJsO79zzRGfYfUU61kbdP46GEPrPjxH5S1iV5wtH4Caq9bkR45WZ668IBIBwKOl4WWPcGCndMFXrlg4SbUSkvPCadSK62LgXZsuMpWBKiOJrFRcct9eM01jhgYQCPMB7usfRj83GSljCdFo7ZQfJoSEHypUXAyxjn2fVusQnGtSguV2gxmXcoMpZHvAxgTk8UIscsXlvt23d35UinELSGHU0x2jU7kcSzvGpbDKDtyGDFqmSUxOYBicldTRCq6CRrKefp7623654CSLkIdkYIBJwkUIeuHnPGESi0FZBVCXBmbjx1f5UokKMwJEFcEf3eLK6cYCDV4YmJWaZDJcnwUMKQALE1TwAObFDZ6g6yJRZM7oyuJIT";
				oMockstar.execSingle(`UPDATE {{calculation}} SET CALCULATION_NAME = '${sName500Chars}' WHERE CALCULATION_ID = ${testData.iCalculationId};`);

				const params = [
					{
						"name" : "action",
						"value" : "copy-version"
					},
					{
						"name" : "calculate",
						"value" : true
					},
					{
						"name" : "id",
						"value" : testData.iCalculationVersionId
					},
					{
						"name" : "compressedResult",
						"value" : true
					}
				];
				params.get = function(sArgument) {
					let value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};
				const oBody = {
					asString : function() {
						return JSON.stringify({
							PROJECT_ID : testData.oProjectTestData.PROJECT_ID[0]
						});
					}
				};
				const oRequest = mockstarHelpers.buildRequest("calculations", params, $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_VALIDATION_ERROR.code)
				expect(oResponseObject.head.messages.length).toBe(1);
			});

		}
		
		function checkCopiedCalculation(oDefaultResponseMock, sTargetProjectId, sExpectedCostingSheetId, sExpectedComponentSplitId, sStatus) {
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);
			expect(_.isObject(oResponseObject.head)).toBe(true);

			expect(oResponseObject.body.transactionaldata.length).toBe(1);

			var oResponseCalculation = oResponseObject.body.transactionaldata[0];
			expect(helpers.isPositiveInteger(oResponseCalculation.CALCULATION_ID)).toBe(true);
			expect(oResponseCalculation.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID > 0).toBeTruthy();
			expect(oResponseCalculation.CALCULATION_VERSIONS[0][MetaInformation.IsDirty]).toBeTruthy();
			expect(oResponseCalculation.CALCULATION_NAME !== oTestCalculation.CALCULATION_NAME).toBeTruthy();
			expect(_.isNaN(Date.parse(oResponseCalculation.CREATED_ON))).toBe(false);
			expect(oResponseCalculation.CREATED_BY).toBe($.session.getUsername());
			expect(_.isNaN(Date.parse(oResponseCalculation.LAST_MODIFIED_ON))).toBe(false);
			expect(oResponseCalculation.LAST_MODIFIED_BY).toBe($.session.getUsername());
			expect(oResponseCalculation.CALCULATION_VERSIONS.length).toBe(1);
			
			//check that project id is set 
			expect(oResponseCalculation.PROJECT_ID).toBe(sTargetProjectId);

			var oResponseCv = oResponseCalculation.CALCULATION_VERSIONS[0];
			expect(helpers.isPositiveInteger(oResponseCv.CALCULATION_VERSION_ID)).toBe(true);
			expect(oResponseCv.CALCULATION_ID !== oTestCalculation.CALCULATION_ID).toBeTruthy();
			expect(oResponseCv.CALCULATION_VERSION_NAME).toBe(oTestCalculationVersion.CALCULATION_VERSION_NAME);
			expect(oResponseCv.STATUS_ID).toBe(sStatus);
			expect(oResponseCv.CUSTOMER_ID).toBe(oTestCalculationVersion.CUSTOMER_ID);
			expect(oResponseCv.SALES_PRICE).toBe(oTestCalculationVersion.SALES_PRICE.toString());
			expect(oResponseCv.SALES_PRICE_CURRENCY_ID).toBe(oTestCalculationVersion.SALES_PRICE_CURRENCY_ID);
			expect(oResponseCv.REPORT_CURRENCY_ID).toBe(oTestCalculationVersion.REPORT_CURRENCY_ID);
			expect(oResponseCv.COSTING_SHEET_ID).toBe(sExpectedCostingSheetId);
			expect(oResponseCv.COMPONENT_SPLIT_ID).toBe(sExpectedComponentSplitId);
			expect(helpers.isPositiveInteger(oResponseCv.ROOT_ITEM_ID)).toBe(true);
			expect(oResponseCv.EXCHANGE_RATE_TYPE_ID).toBe(sDefaultExchangeRateType);
			expect(oResponseCv.MATERIAL_PRICE_STRATEGY_ID).toBe(oTestCalculationVersion.MATERIAL_PRICE_STRATEGY_ID);
			expect(oResponseCv.ACTIVITY_PRICE_STRATEGY_ID).toBe(oTestCalculationVersion.ACTIVITY_PRICE_STRATEGY_ID);

			expect(oResponseCv.ITEMS.length).toBe(3);
			expect(oResponseCv.ITEMS[0].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);
			expect(oResponseCv.ITEMS[1].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);
			expect(oResponseCv.ITEMS[2].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);
			expect(helpers.isPositiveInteger(oResponseCv.ITEMS[0].ITEM_ID)).toBe(true);
			expect(helpers.isPositiveInteger(oResponseCv.ITEMS[1].ITEM_ID)).toBe(true);
			expect(helpers.isPositiveInteger(oResponseCv.ITEMS[2].ITEM_ID)).toBe(true);
			
			
			// make sure that original version is not affected by copy
			expect(mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id=" + testData.iCalculationVersionId)).toBe(3);	
			expect(mockstarHelpers.getRowCount(oMockstar, "item_temporary", "calculation_version_id=" + testData.iCalculationVersionId)).toBe(0);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				expect(mockstarHelpers.getRowCount(oMockstar, "item_temporary_ext", "calculation_version_id=" + testData.iCalculationVersionId)).toBe(0);
			}

			var oCheckEntityTagsAfterCopy = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + oResponseCv.CALCULATION_ID + " and entity_type = 'C'");
			expect(oCheckEntityTagsAfterCopy.columns.TAG_ID.rows[0]).toBe(2);
			expect(oCheckEntityTagsAfterCopy.columns.CREATED_ON.rows[0]).not.toBeNull();
			expect(oCheckEntityTagsAfterCopy.columns.CREATED_BY.rows[0]).toBe(sSessionId);
			oCheckEntityTagsAfterCopy = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + oResponseCv.CALCULATION_VERSION_ID + " and entity_type = 'V'");
			expect(oCheckEntityTagsAfterCopy.columns.TAG_ID.rows[0]).toBe(1);
			expect(oCheckEntityTagsAfterCopy.columns.CREATED_ON.rows[0]).not.toBeNull();
			expect(oCheckEntityTagsAfterCopy.columns.CREATED_BY.rows[0]).toBe(sSessionId);
		}
	});


	if(jasmine.plcTestRunParameters.mode === 'all'){
		describe("update", function() {
		    
		    var oCalculationVersionTestData = mockstarHelpers.convertToObject(testData.oCalculationVersionTestData, 0);
		    oCalculationVersionTestData.CALCULATION_VERSION_ID = 666;
		    oCalculationVersionTestData.CALCULATION_VERSION_NAME = 'Calc vers name';

			beforeEach(function() {
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				oMockstar.insertTableData("status", testData.oStatusTestData);
				oMockstar.insertTableData("status__text", testData.oStatusTextTestData);

				enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);

				spyOn($.trace, "error").and.callThrough();
				spyOn(helpers, "logError").and.callFake(function (msg) { $.trace.error(msg); });
			});

			var params = [];
			params.get = function() {
				return undefined;
			};

			function prepareUpdateCalculationRequest(oCalculation) {

				var oRequest = {
						queryPath : "calculations",
						method : $.net.http.PUT,
						body : {
							asString : function() {
								return JSON.stringify(oCalculation);
							}
						},
						parameters : params
				};
				return oRequest;
			}

			it('should update a calculation with valid input --> updated entry in data base', function() {
				// arrange

				// read-only properties must be omitted due to the validation; remember LAST_MODIFIED_ON is read-only but
				// transferable, since it is needed to check if the calculation is current
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);

				oCalculation.CURRENT_CALCULATION_VERSION_ID = 666;
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				// really updated?
				var result = oMockstar.execQuery("select CURRENT_CALCULATION_VERSION_ID from {{calculation}} where calculation_id=" + oCalculation.CALCULATION_ID);
				expect(result).toBeDefined();
				expect(result.columns.CURRENT_CALCULATION_VERSION_ID.rows[0]).toEqual(666);
			});

			it('should update a calculation with valid input --> updated calculation in response body', function() {
				// arrange
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CURRENT_CALCULATION_VERSION_ID = 666;
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.transactionaldata[0].CALCULATION_ID).toBe(oCalculation.CALCULATION_ID);
				expect(oResponseObject.body.transactionaldata[0].CURRENT_CALCULATION_VERSION_ID).toBe(oCalculation.CURRENT_CALCULATION_VERSION_ID);
			});

			it('should update a calculation with valid input --> calculation has updated LAST_MODIFIED fields', function() {
				// arrange
				var oFunctionStartDate = new Date();
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CURRENT_CALCULATION_VERSION_ID = 666;
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oNewLastModifiedOn = new Date(Date.parse(oResponseObject.body.transactionaldata[0].LAST_MODIFIED_ON));
				expect(oNewLastModifiedOn > oFunctionStartDate).toBe(true);
				expect(oResponseObject.body.transactionaldata[0].LAST_MODIFIED_BY).toBe($.session.getUsername());
			});

			it('should update a calculation with valid input and new name => returns 200 OK', function() {
				// arrange
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CALCULATION_NAME = "NewName";
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseObject.head)).toBe(true);

				// really updated?
				var result = oMockstar.execQuery("select CALCULATION_NAME from {{calculation}} where calculation_id=" + oCalculation.CALCULATION_ID);
				expect(result).toBeDefined();
				expect(result.columns.CALCULATION_NAME.rows[0]).toEqual("NewName");
			});
			
			it('should update a calculation if current calculation version is changed and is not a lifecycle version => returns 200 OK', function() {
				// arrange
				var oCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
				// Modify test data set more calculation version to one calculation to be able to set other version as current version
				oCalculationVersionTestData.CALCULATION_ID[1] = testData.iCalculationId;
				oCalculationVersionTestData.CALCULATION_ID[2] = testData.iCalculationId;
				oMockstar.clearTable("calculation_version");
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CURRENT_CALCULATION_VERSION_ID = testData.iSecondVersionId;
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				
				var resultBefore = oMockstar.execQuery(`select CURRENT_CALCULATION_VERSION_ID from {{calculation}} where calculation_id = ${oCalculation.CALCULATION_ID}`);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseObject.head)).toBe(true);

				// check CURRENT_CALCULATION_VERSION_ID field before and after
				expect(resultBefore.columns.CURRENT_CALCULATION_VERSION_ID.rows[0]).toEqual(testData.iCalculationVersionId);
				var resultAfter = oMockstar.execQuery(`select CURRENT_CALCULATION_VERSION_ID from {{calculation}} where calculation_id = ${oCalculation.CALCULATION_ID}`);
				expect(resultAfter).toBeDefined();
				expect(resultAfter.columns.CURRENT_CALCULATION_VERSION_ID.rows[0]).toEqual(testData.iSecondVersionId);
			});
			
			it('should not update a calculation if current calculation version is changed to a lifecycle version => return error CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR', function() {
				// arrange
				var oCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
				// Modify test data set more calculation version to one calculation to be able to set other version as current version
				oCalculationVersionTestData.CALCULATION_ID[1] = testData.iCalculationId;
				oCalculationVersionTestData.CALCULATION_ID[2] = testData.iCalculationId;
				// Modify test data set calculation version as a lifecycle version
				oCalculationVersionTestData.CALCULATION_VERSION_TYPE[1] = 2;
				oMockstar.clearTable("calculation_version");
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CURRENT_CALCULATION_VERSION_ID = testData.iSecondVersionId;
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR.code);
				expect($.trace.error).toHaveBeenCalled();
			});

			it('should not update a calculation when current calculation version is not part of it', function() {
				// arrange
				var oCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
				// Modify test data set more calculation version to one calculation to be able to set other version as current version
				oCalculationVersionTestData.CALCULATION_ID[1] = testData.iSecondCalculationId;
				oCalculationVersionTestData.CALCULATION_ID[2] = testData.iSecondCalculationId;
				oMockstar.clearTable("calculation_version");
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CURRENT_CALCULATION_VERSION_ID = testData.iSecondVersionId;
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_PART_OF_CALCULATION_ERROR.code);
				expect($.trace.error).toHaveBeenCalled();
			});

			it('should not update a calculation when the given calculation version id does not belong to it', function() {
				// arrange
				oMockstar.clearTable("calculation_version");
				oMockstar.clearTable("calculation_version_temporary");

				const oCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
				// Modify test data set more calculation version to one calculation to be able to set other version as current version
				oCalculationVersionTestData.CALCULATION_ID[1] = testData.iSecondCalculationId;
				oCalculationVersionTestData.CALCULATION_ID[2] = testData.iSecondCalculationId;
				
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				const oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_BY" ]);
				oCalculation.CURRENT_CALCULATION_VERSION_ID = testData.iSecondVersionId;
				const oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_PART_OF_CALCULATION_ERROR.code);
				expect($.trace.error).toHaveBeenCalled();
			});

			
			it('should update a calculation with valid input and new name when its first version was not saved yet', function() {
				// arrange
				oMockstar.clearTable("calculation_version");
				oMockstar.clearTable("calculation_version_temporary");
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
				
				const oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CALCULATION_NAME = "NewName";
				const oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseObject.head)).toBe(true);

				// check if the update was done
				const result = oMockstar.execQuery("select CALCULATION_NAME from {{calculation}} where calculation_id = " + oCalculation.CALCULATION_ID);
				expect(result).toBeDefined();
				expect(result.columns.CALCULATION_NAME.rows[0]).toEqual("NewName");
			});

			it('should not update a calculation with a duplicated name (case insensitive) => returns 409 CONFLICT', function() {
				// arrange
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CALCULATION_NAME = testData.oCalculationTestData.CALCULATION_NAME[1].toUpperCase();
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CONFLICT);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toEqual(1);
                expect(oResponseObject.head.messages[0].code).toEqual(messageCode.CALCULATION_NAME_NOT_UNIQUE_ERROR.code);				
				expect($.trace.error).toHaveBeenCalled();
			});

			it('should not update a calculation with valid input that has been edited by others in between => returns 400 Bad Request', function() {
				// arrange
				var oDbCalculation = mockstarHelpers.convertToObject(testData.oCalculationTestData, 0);

				var oRequestCalculation = _.omit(oDbCalculation, [ "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_BY" ]);
				var dLastModified = oRequestCalculation.LAST_MODIFIED_ON;
				// set a more current date in the db
				oDbCalculation.LAST_MODIFIED_ON = new Date().toJSON();
				oMockstar.upsertTableData("calculation", oDbCalculation, "CALCULATION_ID = " + oRequestCalculation.CALCULATION_ID);

				oRequestCalculation.LAST_MODIFIED_ON = dLastModified;
				var oRequest = prepareUpdateCalculationRequest([ oRequestCalculation ]);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseObject.head)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);

				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				expect(oResponseCalculation.LAST_MODIFIED_ON).not.toEqual(oRequestCalculation.LAST_MODIFIED_ON);
				expect($.trace.error).toHaveBeenCalled();
			});

			it('should not update a calculation that has already been deleted => returns 404 NOT FOUND', function() {
				// arrange
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);
				oCalculation.CALCULATION_ID = 666;
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
				expect($.trace.error).toHaveBeenCalled();
			});
			
			it('should not update calculations current version if the version has already been deleted => returns 404 NOT FOUND', function() {
				// arrange
			    var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);

				oCalculation.CURRENT_CALCULATION_VERSION_ID = 666;
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
                
                // check that the correct error details are set in the response
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseObject.head)).toBe(true);
                var oHeaderObject = oResponseObject.head;
                expect(oHeaderObject).toEqual({
                    "messages":[{
                        "code":"GENERAL_ENTITY_NOT_FOUND_ERROR",
                        "severity":"Error",
                        "details":{
                            "messageTextObj" : 'Calculation version has been deleted. Update not possible.',
                            "calculationVersionObjs":[{"id":666}]
                        }
                    }]
                });
                expect($.trace.error).toHaveBeenCalled();
			});
			
			it('should not move calculation to another project if target project not found => returns 404 NOT FOUND', function() {
				// arrange
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);

				oCalculation.PROJECT_ID = 'PPP';
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
				expect($.trace.error).toHaveBeenCalled();
			});
			
			it('should not move calculation to another project if target project has different controlling area => returns 400 BAD_REQUEST', function() {
				// arrange
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);

				oCalculation.PROJECT_ID = 'PRR';
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect($.trace.error).toHaveBeenCalled();
			});
			
			it('should not move calculation to another project if target project contains a calculation with same name => returns 409 CONFLICT', function() {
				oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
				// arrange
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);

				oCalculation.PROJECT_ID = 'PR3'
				oCalculation.CALCULATION_NAME = testData.oCalculationTestData.CALCULATION_NAME[2];
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CONFLICT);
				expect($.trace.error).toHaveBeenCalled();

				// check table
				var result = oMockstar.execQuery("select PROJECT_ID from {{calculation}} where calculation_id=" + oCalculation.CALCULATION_ID);
				expect(result).toBeDefined();
				expect(result.columns.PROJECT_ID.rows[0]).toEqual('PR1');
			});

			it('should move calculation to another project if target project has the same controlling area', function() {
				// arrange
				oMockstar.clearTable("open_calculation_version");
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);

				oCalculation.PROJECT_ID = 'PR2';
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				// check table
				var result = oMockstar.execQuery("select PROJECT_ID from {{calculation}} where calculation_id=" + oCalculation.CALCULATION_ID);
				expect(result).toBeDefined();
				expect(result.columns.PROJECT_ID.rows[0]).toEqual('PR2');
			});

			it('should remove one time product costs data when a calculation is moved to another project', function() {
				// arrange
				oMockstar.clearTable("project_lifecycle_configuration");
				oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectLifecycleConfigurationTestData);
				oMockstar.clearTable("lifecycle_period_value");
				oMockstar.insertTableData("lifecycle_period_value", testData.oProjectLifecyclePeriodQuantityValueTestData);
				oMockstar.clearTable("open_calculation_version");
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);

				oCalculation.PROJECT_ID = 'PR2';
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				var result = oMockstar.execQuery("select PROJECT_ID from {{calculation}} where calculation_id=" + oCalculation.CALCULATION_ID);
				var iCountOneTimeProductCosts = mockstarHelpers.getRowCount(oMockstar,"one_time_product_cost","calculation_id=" + oTestCalculation.CALCULATION_ID);
				var iCountOneTimeLifecycleValues = mockstarHelpers.getRowCount(oMockstar,"one_time_cost_lifecycle_value","calculation_id=" + oTestCalculation.CALCULATION_ID);
				var iCountLifecylePerioqQuantities = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value", "calculation_id=" + oTestCalculation.CALCULATION_ID, "project_id = 'PR1'");
				var iCountLifecyleConfigurations = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration", "calculation_id=" + oTestCalculation.CALCULATION_ID, "project_id = 'PR1'");
				var aCostNotDistributedProject = oMockstar.execQuery("select COST_NOT_DISTRIBUTED from {{one_time_project_cost}} where project_id= 'PR1' ORDER BY ONE_TIME_COST_ID");
				var aCostDistributedProduct = oMockstar.execQuery("select COST_TO_DISTRIBUTE from {{one_time_product_cost}} where calculation_id = " + testData.iSecondCalculationId + " ORDER BY ONE_TIME_COST_ID");
				var aOneTimeCostValues = oMockstar.execQuery("select VALUE from {{one_time_cost_lifecycle_value}} where calculation_id = " + testData.iSecondCalculationId + " ORDER BY ONE_TIME_COST_ID");

				var aExpectedCostsNotDistributedForProject = ['0.0000000', '4200.0000000', '6300.0000000'];
				var aExpectedCostsToDistributeForProduct = ['100.0000000', '7000.0000000'];
				var aExpectedOneTimeCostValues = ['100.0000000', '5000.0000000', '7000.0000000'];

				expect(result).toBeDefined();
				expect(result.columns.PROJECT_ID.rows[0]).toEqual('PR2');
				expect(iCountOneTimeProductCosts).toBe(0);
				expect(iCountOneTimeLifecycleValues).toBe(0);
				expect(iCountLifecylePerioqQuantities).toBe(0);
				expect(iCountLifecyleConfigurations).toBe(0);
				expect(aCostNotDistributedProject.columns.COST_NOT_DISTRIBUTED.rows).toEqual(aExpectedCostsNotDistributedForProject);
				expect(aCostDistributedProduct.columns.COST_TO_DISTRIBUTE.rows).toEqual(aExpectedCostsToDistributeForProduct);
				expect(aOneTimeCostValues.columns.VALUE.rows).toEqual(aExpectedOneTimeCostValues);
			});
			
			it('should delete calculation total quantity and associated values when calculation was moved to another project', function() {
				// arrange
				oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
				oMockstar.insertTableData("lifecycle_period_value", testData.oLifecyclePeriodValues);
				var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
				var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");
				oMockstar.clearTable("open_calculation_version");
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
				                                                                                               "LAST_MODIFIED_BY" ]);

				oCalculation.PROJECT_ID = 'PR2';
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				// check table
				var result = oMockstar.execQuery("select PROJECT_ID from {{calculation}} where calculation_id=" + oCalculation.CALCULATION_ID);
				expect(result).toBeDefined();
				expect(result.columns.PROJECT_ID.rows[0]).toEqual('PR2');
				// check if calculation total quantity and associated values are deleted
				expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities - 1);
			    expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues - 3);
			});
			
			it('should not delete calculation total quantity and associated values when calculation was not moved to another project', function() {
				// arrange
				oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
				oMockstar.insertTableData("lifecycle_period_value", testData.oLifecyclePeriodValues);
				oMockstar.clearTable("open_calculation_version");
				var oCalculation = _.omit(new TestDataUtility(testData.oCalculationTestData).getObject(0), [ "CREATED_ON", "CREATED_BY",
																											   "LAST_MODIFIED_BY" ]);
				
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				// check table
				var oQuantityResult = oMockstar.execQuery(`select * from {{project_lifecycle_configuration}} where calculation_id = ${oCalculation.CALCULATION_ID}`);
				expect(oQuantityResult.columns.PROJECT_ID.rows.length).toBe(1);
				var iProjectId = oQuantityResult.columns.PROJECT_ID.rows[0];
				var oValueResult = oMockstar.execQuery(`select * from {{lifecycle_period_value}} where project_id = '${iProjectId}'`);
				expect(oValueResult.columns.PROJECT_ID.rows.length).toBeGreaterThan(0);
			});
			
			it('should not move calculation to another project if calculation has open versions => returns 400 BAD_REQUEST', function() {
				// arrange
				oMockstar.insertTableData("open_calculation_version", testData.oOpenCalculationVersionsTestData);
				oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
				var oCalculation = _.omit(mockstarHelpers.convertToObject(testData.oCalculationTestData, 0), [ "CREATED_ON", "CREATED_BY",
			                                                                       						       "LAST_MODIFIED_BY" ]);

				oCalculation.PROJECT_ID = 'PR2';
				var oRequest = prepareUpdateCalculationRequest([ oCalculation ]);
				oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// check table
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect($.trace.error).toHaveBeenCalled();
			});
		});
	}

	describe('create', function() {

		beforeEach(function() {
			oMockstar.clearAllTables();
			oMockstar.initializeData();
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
			oMockstar.insertTableData("status", testData.oStatusTestData);
			oMockstar.insertTableData("status__text", testData.oStatusTextTestData);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
			}

			spyOn($.trace, "error").and.callThrough();
			spyOn(helpers, "logError").and.callFake(function (msg) { $.trace.error(msg); });
		});

		function getRequestObject(projectId) {
			// create a new calculation object as payload of the request; use data from testData.xsjslib as basis
			var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z");
			var oNewCalculation = _.omit(_.cloneDeep(oTestCalculation), [ "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_BY" ]);
			oNewCalculation.CALCULATION_ID = -1;
			oNewCalculation.PROJECT_ID = projectId;
			var oNewCv = _.omit(_.cloneDeep(oTestCalculationVersion), [ "CALCULATION_VERSION_TYPE", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY",
			                                                        "SALES_DOCUMENT", "START_OF_PRODUCTION", "END_OF_PRODUCTION", "MASTER_DATA_TIMESTAMP",
			                                                        "BUSINESS_AREA_ID", "CUSTOMER_ID", "SALES_PRICE_CURRENCY_ID"]);
			oNewCv.CALCULATION_ID = -1;
			oNewCv.CALCULATION_VERSION_ID = -1;
			oNewCv.ROOT_ITEM_ID = -1;
			oNewCv.VALUATION_DATE = "2011-08-20";
			oNewCv.ACTIVITY_PRICE_STRATEGY_ID = sStandardPriceStrategy;
			oNewCv.MATERIAL_PRICE_STRATEGY_ID = sStandardPriceStrategy;

			oNewCalculation.CALCULATION_VERSIONS = [ oNewCv ];
			var oNewItem = {};
			oNewItem.CALCULATION_VERSION_ID = -1;
			oNewItem.ITEM_ID = -1;
			oNewItem.IS_ACTIVE = oTestItem.IS_ACTIVE;
			oNewItem.TOTAL_QUANTITY = oTestItem.TOTAL_QUANTITY;
			oNewItem.TOTAL_QUANTITY_UOM_ID = oTestItem.TOTAL_QUANTITY_UOM_ID;
			oNewItem.PRICE_FIXED_PORTION = 0;
			oNewItem.PRICE_VARIABLE_PORTION = 0;
			oNewItem.TRANSACTION_CURRENCY_ID = oTestCalculationVersion.REPORT_CURRENCY_ID;
			oNewItem.PRICE_UNIT = 1;
			oNewItem.PRICE_UNIT_UOM_ID = "ST";
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oNewItem.CUST_BOOLEAN_INT_MANUAL =  1;
				oNewItem.CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL = 20;
				oNewItem.CUST_DECIMAL_WITHOUT_REF_MANUAL = 30;
				oNewItem.CUST_INT_WITHOUT_REF_MANUAL =  30;
				oNewItem.CUST_LOCAL_DATE_MANUAL =  sExpectedDateWithoutTime;
				oNewItem.CUST_STRING_MANUAL =  "Test 1";
			}
			oNewCv.ITEMS = [ oNewItem ];

			return [ oNewCalculation ];
		}

		var params = [ {
			"name" : "action",
			"value" : "create"
		}];

		params.get = function(sArgument) {
			var value;
			_.each(this, function(oParameter) {
				if (oParameter.name === sArgument) {
					value = oParameter.value;
				}
			});
			return value;
		};

		function prepareCalculationVersionsRequest(oRequestObjectParam) {
			var oRequest = {
				queryPath : "calculation-versions",
				method : $.net.http.POST,
				body : {
					asString : function() {
						return JSON.stringify(oRequestObjectParam);
					}
				},
				parameters : [ {
					"name" : "action",
					"value" : "save"
				}]
			};
			return oRequest;
		}

		function prepareRequest(projectId) {
			var oRequest = {
					queryPath : "calculations",
					method : $.net.http.POST,
					body : {
						asString : function() {
							return JSON.stringify(getRequestObject(projectId));
						}
					},
					parameters : params
			};
			return oRequest;
		}
		
		function runAndCheckCalculationCreated(oRequest, sStatus) {
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata.length).toBe(1);
			var oResponseCalculation = oResponseObject.body.transactionaldata[0];
			expect(helpers.isPositiveInteger(oResponseCalculation.CALCULATION_ID)).toBeTruthy();
			expect(oResponseCalculation.CALCULATION_VERSIONS[0][MetaInformation.IsDirty]).toBeTruthy();
			expect(helpers.isPositiveInteger(oResponseCalculation.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID)).toBeTruthy();
			expect(oResponseCalculation.PROJECT_ID).toBe(oTestCalculation.PROJECT_ID);
			expect(oResponseCalculation.CALCULATION_NAME === oTestCalculation.CALCULATION_NAME).toBeTruthy();
			expect(oResponseCalculation.CURRENT_CALCULATION_VERSION_ID).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
			expect(oResponseCalculation.CONTROLLING_AREA_ID).toBe(oTestCalculation.CONTROLLING_AREA_ID);
			expect(_.isNaN(Date.parse(oResponseCalculation.CREATED_ON))).toBe(false);
			expect(oResponseCalculation.CREATED_BY).toBe($.session.getUsername());
			expect(_.isNaN(Date.parse(oResponseCalculation.LAST_MODIFIED_ON))).toBe(false);
			expect(oResponseCalculation.LAST_MODIFIED_BY).toBe($.session.getUsername());
			expect(oResponseCalculation.CALCULATION_VERSIONS.length).toBe(1);

			var oResponseCv = oResponseCalculation.CALCULATION_VERSIONS[0];
			expect(helpers.isPositiveInteger(oResponseCv.CALCULATION_VERSION_ID)).toBe(true);
			expect(oResponseCv.CALCULATION_ID).toBe(oResponseCalculation.CALCULATION_ID);
			expect(oResponseCv.CALCULATION_VERSION_NAME).toBe(oTestCalculationVersion.CALCULATION_VERSION_NAME);
			expect(oResponseCv.STATUS_ID).toBe(sStatus);
			expect(helpers.isPositiveInteger(oResponseCv.ROOT_ITEM_ID)).toBe(true);
			expect(oResponseCv.ITEMS.length).toBe(1);
			expect(oResponseCv.MATERIAL_PRICE_STRATEGY_ID).toBe(oTestCalculationVersion.MATERIAL_PRICE_STRATEGY_ID);
			expect(oResponseCv.ACTIVITY_PRICE_STRATEGY_ID).toBe(oTestCalculationVersion.ACTIVITY_PRICE_STRATEGY_ID);

			var oResponseItem = oResponseCv.ITEMS[0];
			expect(oResponseItem.ITEM_ID).toBe(oResponseCv.ROOT_ITEM_ID);
			expect(oResponseItem.CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);

			if(jasmine.plcTestRunParameters.generatedFields === true){
			    expect(oResponseItem["CUST_BOOLEAN_INT_MANUAL"]).toBe(1);
			    //all other custom fields should be reset to null because they have item_category_id <> 0
				var aManualCustomFields = ["CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL",
				                           "CUST_DECIMAL_WITHOUT_REF_MANUAL",
				                           "CUST_INT_WITHOUT_REF_MANUAL","CUST_LOCAL_DATE_MANUAL","CUST_STRING_MANUAL"];
				_.each(aManualCustomFields, function(fieldName,index){
					expect(oResponseItem[fieldName]).toBe(null);
				});

			}
		}

		it('should create (post) calculation with validInput --> valid calculation object returned and add default status', function() {
			// arrange
			var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);
			
			// act & assert
			runAndCheckCalculationCreated(oRequest, "ACTIVE");
		});

		it('should create (post) calculation and save calculation version with default status', function() {
			// arrange
			var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata.length).toBe(1);
			var oResponseCalculation = oResponseObject.body.transactionaldata[0];
			var oResponseCv = oResponseCalculation.CALCULATION_VERSIONS[0];

			var oCalculationVersion = [
				{
				  "CALCULATION_ID": oResponseCv.CALCULATION_ID,
				  "CALCULATION_VERSION_NAME": oResponseCv.CALCULATION_VERSION_NAME,
				  "CALCULATION_VERSION_ID": oResponseCv.CALCULATION_VERSION_ID
				}
			  ];

			var oSaveCalculationVersionsRequest = prepareCalculationVersionsRequest(oCalculationVersion);

			// act
			new Dispatcher(oCtx, oSaveCalculationVersionsRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);

			var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version}} WHERE calculation_version_id = " + oResponseCv.CALCULATION_VERSION_ID + " AND calculation_version_name = '" + oResponseCv.CALCULATION_VERSION_NAME + "'"));

			expect(oTableData.STATUS_ID[0]).toBe("ACTIVE");
		});

		it('should create (post) calculation with validInput --> valid calculation object returned and add no status because there is no default', function() {

			oMockstar.clearTable("status");
			oMockstar.insertTableData("status", {
				"STATUS_ID":['active','inactive','pending','draft'],
				"IS_DEFAULT":[0,0,0,0],
				"IS_ACTIVE":[1,0,1,1],
				"IS_STATUS_COPYABLE":[1,0,0,1],
				"DISPLAY_ORDER":[1,2,3,4],
				"CREATED_ON":["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
				"CREATED_BY":['activeUser','inactiveUser','pendingUser','draftUser'],
				"LAST_MODIFIED_ON":[,,,],
				"LAST_MODIFIED_BY":[,,,]
			});

			// arrange
			var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

			// act & assert
			runAndCheckCalculationCreated(oRequest, null);
		});
		
		it('should create (post) calculation with validInput and id = -2 (e.g. when several calculations are created) --> valid calculation object returned', function() {
			// arrange
			var oCalculation = getRequestObject(oTestCalculation.PROJECT_ID);
			oCalculation[0].CALCULATION_ID = -2;
			oCalculation[0].CALCULATION_VERSIONS[0].CALCULATION_ID = -2;
			oCalculation[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID = -2;
			var oRequest = {
					queryPath : "calculations",
					method : $.net.http.POST,
					body : {
						asString : function() {
							return JSON.stringify(oCalculation);
						}
					},
					parameters : params
			};
			
			// act & assert
			runAndCheckCalculationCreated(oRequest, "ACTIVE");
		});		

		if(jasmine.plcTestRunParameters.mode === 'all'){
			it('should create (post) calculation with validInput --> insert correct data in t_calculation', function() {
				// arrange
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation}}"));

				expect(oTableData.CALCULATION_ID[0]).toBe(oResponseCalculation.CALCULATION_ID);
				expect(oTableData.PROJECT_ID[0]).toBe(oResponseCalculation.PROJECT_ID);
				expect(oTableData.CALCULATION_NAME[0]).toBe(oResponseCalculation.CALCULATION_NAME);
				expect(oTableData.CURRENT_CALCULATION_VERSION_ID[0]).toBe(oResponseCalculation.CURRENT_CALCULATION_VERSION_ID);
				expect(_.isNaN(Date.parse(oTableData.CREATED_ON[0]))).toBe(false);
				expect(oTableData.CREATED_BY[0]).toBe(oResponseCalculation.CREATED_BY);
				expect(_.isNaN(Date.parse(oTableData.LAST_MODIFIED_ON[0]))).toBe(false);
				expect(oTableData.LAST_MODIFIED_BY[0]).toBe(oResponseCalculation.LAST_MODIFIED_BY);
			});
		}

		if(jasmine.plcTestRunParameters.mode === 'all'){
			it('should create (post) calculation with validInput --> insert correct data in t_calculation_version_temporary', function() {
				// arrange
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));

				// not all properties are checked since a complete check is part of the
				// calculation-versions-integrationtests
				expect(oTableData.CALCULATION_VERSION_ID.length).toBe(1);
				expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				expect(oTableData.CALCULATION_VERSION_NAME[0]).toBe(oTestCalculationVersion.CALCULATION_VERSION_NAME);
				expect(oTableData.ROOT_ITEM_ID[0]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].ROOT_ITEM_ID);
			});
			
			it('should create calculation, version with standard exchange rate type when this is not defined in project', function() {
				// arrange
				oMockstar.clearTable("project");
				oMockstar.insertTableData("project", {
											  "PROJECT_ID": oTestCalculation.PROJECT_ID,
											  "ENTITY_ID" : 20,
                                              "PROJECT_NAME": "TEST 1",
                                              "CONTROLLING_AREA_ID": "1000",
                                              "REPORT_CURRENCY_ID": "EUR",
                                              "EXCHANGE_RATE_TYPE_ID": null,
                                              "CREATED_BY": "TESTER",
                                              "LAST_MODIFIED_BY": "TESTER",
                                              "LAST_MODIFIED_ON": new Date("2011-08-20T00:00:00.000Z").toJSON(),
                                              "LIFECYCLE_PERIOD_INTERVAL": 12,
											  "MATERIAL_PRICE_STRATEGY_ID":    sStandardPriceStrategy,
											  "ACTIVITY_PRICE_STRATEGY_ID":    sStandardPriceStrategy
                                            });
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));

				// not all properties are checked since a complete check is part of the
				// calculation-versions-integrationtests
				expect(oTableData.CALCULATION_VERSION_ID.length).toBe(1);
				expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				expect(oTableData.EXCHANGE_RATE_TYPE_ID[0]).toBe("STANDARD");
				expect(oResponseCalculation.CALCULATION_VERSIONS[0].EXCHANGE_RATE_TYPE_ID).toBe("STANDARD");
			});

			it('should create a new calculation version and set MATERIAL_PRICE_STRATEGY_ID and ACTIVITY_PRICE_STRATEGY_ID found in body', function() {
				// arrange
				const aPriceDeterminationStrategy = testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID;
				const oVersionTestData = getRequestObject(oTestCalculation.PROJECT_ID)[0];
				oVersionTestData.CALCULATION_VERSIONS[0].MATERIAL_PRICE_STRATEGY_ID = aPriceDeterminationStrategy[2];
				oVersionTestData.CALCULATION_VERSIONS[0].ACTIVITY_PRICE_STRATEGY_ID = aPriceDeterminationStrategy[3];
				const oRequest = {
						queryPath : "calculations",
						method : $.net.http.POST,
						body : {
							asString : function() {
								return JSON.stringify([ oVersionTestData ]);
							}
						},
						parameters : params
				};
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				const oResponseCalculation = oResponseObject.body.transactionaldata[0];
				const oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));

				expect(oTableData.CALCULATION_VERSION_ID.length).toBe(1);
				expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(oResponseCalculation.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				expect(oTableData.MATERIAL_PRICE_STRATEGY_ID[0]).toBe(aPriceDeterminationStrategy[2]);
				expect(oResponseCalculation.CALCULATION_VERSIONS[0].MATERIAL_PRICE_STRATEGY_ID).toBe(aPriceDeterminationStrategy[2]);
				expect(oTableData.ACTIVITY_PRICE_STRATEGY_ID[0]).toBe(aPriceDeterminationStrategy[3]);
				expect(oResponseCalculation.CALCULATION_VERSIONS[0].ACTIVITY_PRICE_STRATEGY_ID).toBe(aPriceDeterminationStrategy[3]);
			});
		}

		if(jasmine.plcTestRunParameters.mode === 'all'){
			it('should create (post) calculation with validInput --> insert default data for calculation version in t_calculation_version_temporary',
					function() {
				// arrange
				// construct a request object without properties that have to have default values
				var oNewCalc = getRequestObject(oTestCalculation.PROJECT_ID)[0];
				oNewCalc.CALCULATION_VERSIONS = [ _.omit(oNewCalc.CALCULATION_VERSIONS[0], [ "COSTING_SHEET_ID", "COMPONENT_SPLIT_ID",
				                                                                             "MASTER_DATA_TIMESTAMP" ]) ];
				var oRequest = {
						queryPath : "calculations",
						method : $.net.http.POST,
						body : {
							asString : function() {
								return JSON.stringify([ oNewCalc ]);
							}
						},
						parameters : params
				};

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));

				// not all properties are checked since a complete check is part of the
				// calculation-versions-integrationtests
				expect(oTableData.CALCULATION_VERSION_ID.length).toBe(1);
				expect(oTableData.COSTING_SHEET_ID[0].length).toBeGreaterThan(0);
				expect(oTableData.COMPONENT_SPLIT_ID[0].length).toBeGreaterThan(0);
				expect(oTableData.MASTER_DATA_TIMESTAMP[0].length).toBeGreaterThan(0);
			});
		}

		it('should create (post) calculation with validInput --> insert correct data in t_item_temporary (and t_item_temporary_ext)', function() {
			// arrange
			var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oResponseCalculation = oResponseObject.body.transactionaldata[0];
			var oResponseItem = oResponseCalculation.CALCULATION_VERSIONS[0].ITEMS[0];
			var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{item_temporary}}"));

			// not all properties are checked since a complete check is part of the items-integrationtests
			expect(oTableData.ITEM_ID.length).toBe(1);
			expect(oTableData.ITEM_ID[0]).toBe(oResponseItem.ITEM_ID);
			expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(oResponseItem.CALCULATION_VERSION_ID);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTableData = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{item_temporary_ext}}"));
				expect(oTableData.ITEM_ID.length).toBe(1);
				expect(oTableData.ITEM_ID[0]).toBe(oResponseItem.ITEM_ID);
				expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(oResponseItem.CALCULATION_VERSION_ID);
			    expect(oTableData.CUST_BOOLEAN_INT_MANUAL[0]).toBe(1);
			    //all other custom fields should be reset to null because they have item_category_id <> 0
				var aManualCustomFields = ["CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL",
				                           "CUST_DECIMAL_WITHOUT_REF_MANUAL",
				                           "CUST_INT_WITHOUT_REF_MANUAL","CUST_LOCAL_DATE_MANUAL","CUST_STRING_MANUAL"];
				_.each(aManualCustomFields, function(fieldName,index){
					expect(oTableData[fieldName][0]).toBe(null);
				});
			}
		});

		if(jasmine.plcTestRunParameters.mode === 'all'){
			it('should contain costing sheet and component split for created version -> are contained in return object', function() {
				// arrange
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				var oCalculation = oResponseObject.body;
				expect(oCalculation.masterdata.COMPONENT_SPLIT_ENTITIES).toBeDefined();
				expect(oCalculation.masterdata.SELECTED_ACCOUNT_GROUPS_ENTITIES).toBeDefined();
				expect(oCalculation.masterdata.COSTING_SHEET_ENTITIES).toBeDefined();
				expect(oCalculation.masterdata.COSTING_SHEET_ROW_ENTITIES).toBeDefined();
				expect(oCalculation.masterdata.COSTING_SHEET_BASE_ENTITIES).toBeDefined();
				expect(oCalculation.masterdata.COSTING_SHEET_BASE_ROW_ENTITIES).toBeDefined();
				expect(oCalculation.masterdata.COSTING_SHEET_OVERHEAD_ENTITIES).toBeDefined();
				expect(oCalculation.masterdata.COSTING_SHEET_OVERHEAD_ROW_ENTITIES).toBeDefined();
				expect(oCalculation.masterdata.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES).toBeDefined();
			});

			it('should set correct default settings taken from the project when a new calculation is created', function() {
				// arrange
				var oRequest = prepareRequest(oTestCalculation.PROJECT_ID);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.head)).toBe(true);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);

				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				expect(oResponseCalculation.CALCULATION_VERSIONS.length).toBe(1);

				var oResponseCv = oResponseCalculation.CALCULATION_VERSIONS[0];
				expect(helpers.isPositiveInteger(oResponseCv.CALCULATION_VERSION_ID)).toBe(true);
				expect(oResponseCv.CALCULATION_ID).toBe(oResponseCalculation.CALCULATION_ID);
				expect(helpers.isPositiveInteger(oResponseCv.ROOT_ITEM_ID)).toBe(true);
				expect(oResponseCv.ITEMS.length).toBe(1);

				var oResponseItem = oResponseCv.ITEMS[0];
				expect(oResponseItem.ITEM_ID).toBe(oResponseCv.ROOT_ITEM_ID);
				expect(oResponseItem.CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);

				// checks for user-specific / global default settings
				var defaultSettings = oMockstar.execQuery("select * from {{project}} where PROJECT_ID= '" + testData.oProjectTestData.PROJECT_ID[0] + "'");

				// calculation version
				var oCalcVersion = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));
				var oExpectedDefaultSettings = JSON.parse(JSON.stringify( defaultSettings.columns ));
				
				expect(oCalcVersion.COSTING_SHEET_ID[0]).toEqual(oExpectedDefaultSettings.COSTING_SHEET_ID.rows[0]);
				expect(oCalcVersion.COMPONENT_SPLIT_ID[0]).toEqual(oExpectedDefaultSettings.COMPONENT_SPLIT_ID.rows[0]);
				expect(oCalcVersion.CUSTOMER_ID[0]).toEqual(defaultSettings.columns.CUSTOMER_ID.rows[0]);
				expect(oCalcVersion.REPORT_CURRENCY_ID[0]).toEqual(oExpectedDefaultSettings.REPORT_CURRENCY_ID.rows[0]);
				expect(oCalcVersion.EXCHANGE_RATE_TYPE_ID[0]).toEqual(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]);
				expect(oCalcVersion.SALES_DOCUMENT[0]).toEqual(oExpectedDefaultSettings.SALES_DOCUMENT.rows[0]);
				expect(oCalcVersion.START_OF_PRODUCTION[0]).toEqual(oExpectedDefaultSettings.START_OF_PRODUCTION.rows[0]);
				expect(oCalcVersion.END_OF_PRODUCTION[0]).toEqual(oExpectedDefaultSettings.END_OF_PRODUCTION.rows[0]);
				expect(oCalcVersion.VALUATION_DATE[0]).toEqual(oExpectedDefaultSettings.VALUATION_DATE.rows[0]);

				// root item
				var oRootItem = mockstarHelpers.convertResultToArray(oMockstar.execQuery("select * from {{item_temporary}}"));
				expect(oRootItem.BUSINESS_AREA_ID[0]).toEqual(oExpectedDefaultSettings.BUSINESS_AREA_ID.rows[0]);
				expect(oRootItem.COMPANY_CODE_ID[0]).toEqual(oExpectedDefaultSettings.COMPANY_CODE_ID.rows[0]);
				expect(oRootItem.PLANT_ID[0]).toEqual(oExpectedDefaultSettings.PLANT_ID.rows[0]);
				expect(oRootItem.PROFIT_CENTER_ID[0]).toEqual(oExpectedDefaultSettings.PROFIT_CENTER_ID.rows[0]);
				expect(oRootItem.ITEM_CATEGORY_ID[0]).toBe(0);
			});
			
			it('should set the SALES_PRICE_CURRENCY_ID to the one of the project if is defined' +
			    ' and  TARGET_COST_CURRENCY_ID to the report currency of the project when a new calculation is created', function() {
				// arrange
				var oRequest = prepareRequest("PR3");
				enterPrivilege("PR3", sUserId, InstancePrivileges.CREATE_EDIT);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.head)).toBe(true);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);

				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				expect(oResponseCalculation.CALCULATION_VERSIONS.length).toBe(1);

				var oResponseCv = oResponseCalculation.CALCULATION_VERSIONS[0];
				expect(helpers.isPositiveInteger(oResponseCv.CALCULATION_VERSION_ID)).toBe(true);
				expect(oResponseCv.SALES_PRICE_CURRENCY_ID).toBe("CAD");
				expect(oResponseCv.ITEMS[0].TARGET_COST_CURRENCY_ID).toBe("USD");
			});
			
			it('should set the SALES_PRICE_CURRENCY_ID to the REPORT_CURRENCY_ID of the project when project SALES_PRICE_CURRENCY_ID is not defined for new calculation', function() {
				// arrange
				var oRequest = prepareRequest("PR4");
				enterPrivilege("PR4", sUserId, InstancePrivileges.CREATE_EDIT);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.head)).toBe(true);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);

				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				expect(oResponseCalculation.CALCULATION_VERSIONS.length).toBe(1);

				var oResponseCv = oResponseCalculation.CALCULATION_VERSIONS[0];
				expect(helpers.isPositiveInteger(oResponseCv.CALCULATION_VERSION_ID)).toBe(true);
				expect(oResponseCv.SALES_PRICE_CURRENCY_ID).toBe("USD");
			});
			
			it('should not create calculation if project does not exist -> throw exception', function() {
				// arrange
				var oInvalidCalculation = getRequestObject(oTestCalculation.PROJECT_ID);
				oInvalidCalculation[0].PROJECT_ID = "PR_FALSE";
				// if the project does not exist, a validation of the costing sheet and component splits cannot be done; if the ids
				// would be left in the request object, the test would fail with another exception
				delete oInvalidCalculation[0].CALCULATION_VERSIONS[0].COSTING_SHEET_ID;
				delete oInvalidCalculation[0].CALCULATION_VERSIONS[0].COMPONENT_SPLIT_ID;
				var oRequest = {
						queryPath : "calculations",
						method : $.net.http.POST,
						body : {
							asString : function() {
								return JSON.stringify(oInvalidCalculation);
							}
						},
						parameters : params
				};
				enterPrivilege("PR_FALSE", sUserId, InstancePrivileges.CREATE_EDIT);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				// Check response
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect($.trace.error).toHaveBeenCalled();
			});
		}
	});


	describe('delete', function() {
		var oRequest = null;

		beforeEach(function() {
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("item", testData.oItemTestData);
			oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
			oMockstar.insertTableData("lifecycle_period_value", testData.oLifecyclePeriodValues);
			oMockstar.insertTableData("tag", testData.oTagTestData);
			oMockstar.insertTableData("entity_tags", testData.oEntityTagsTestData);
			enterPrivilege(testData.oCalculationTestData.PROJECT_ID[0], sUserId, InstancePrivileges.FULL_EDIT);
			spyOn($.trace, "error").and.callThrough();
			spyOn(helpers, "logError").and.callFake(function (msg) { $.trace.error(msg); });

			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_ext", testData.oItemExtData);
			}

			oRequest = {
					queryPath : "calculations",
					method : $.net.http.DEL,
					parameters : params,

					body : {
						asString : function() {
							return JSON.stringify([ {
								CALCULATION_ID : testData.oCalculationTestData.CALCULATION_ID[0]
							} ]);
						}
					}
			};
		});

		it('should recalculate one time costs when deleting a calculation', function() {
			// arrange
			let sProjectId = "PR1";
			let sAccountId = "ACC10";
			let iCalculationId1 = 1978;
			let iCalculationId2 = 2078;
			let oLifecycleYearlyPeriodTypesForProject = {
				"PROJECT_ID": [sProjectId, sProjectId],
				"YEAR": [2020, 2021],
				"PERIOD_TYPE": ["YEARLY", "YEARLY"],
				"LAST_MODIFIED_ON": [testData.sExpectedDate, testData.sExpectedDate],
				"LAST_MODIFIED_BY": [testData.sTestUser, testData.sTestUser]
			};
			let oLifecycleMonthlyPeriod = {
				"PROJECT_ID": [sProjectId, sProjectId],
				"YEAR": [2020, 2021],
				"SELECTED_MONTH": [1, 1],
				"LAST_MODIFIED_ON": [testData.sExpectedDate, testData.sExpectedDate],
				"LAST_MODIFIED_BY": [testData.sTestUser, testData.sTestUser]
			};
			var oLifecyclePeriodValueTestData = {
				"PROJECT_ID":				[ sProjectId, sProjectId, sProjectId, sProjectId],
				"CALCULATION_ID" : 		    [ iCalculationId1,iCalculationId1,iCalculationId2,iCalculationId2],
				"LIFECYCLE_PERIOD_FROM" : 	[ 1440, 1452, 1440, 1452],
				"VALUE" : 					['500.0000000','500.0000000','500.0000000','500.0000000'],
				"LAST_MODIFIED_ON" : 		[ testData.sExpectedDate, testData.sExpectedDate,testData.sExpectedDate, testData.sExpectedDate],
				"LAST_MODIFIED_BY":         [ testData.sTestUser, testData.sTestUser,testData.sTestUser, testData.sTestUser]
			};
			var oOneTimeProjectCost = {
				"ONE_TIME_COST_ID": 				[1000],
				"PROJECT_ID":						[sProjectId],
				"ACCOUNT_ID":						[sAccountId],
				"COST_DESCRIPTION":					['Investment'],
				"COST_TO_DISTRIBUTE":				['10000.0000000'],
				"COST_NOT_DISTRIBUTED":				['10000.0000000'],
				"COST_CURRENCY_ID":					['EUR'],
				"FIXED_COST_PORTION":				[100],
				"DISTRIBUTION_TYPE":				[1],
				"LAST_MODIFIED_BY":					[testData.sTestUser],
				"LAST_MODIFIED_ON":					[testData.sExpectedDate]
			};
			var oOneTimeProductCost = {
				"ONE_TIME_COST_ID": [1000, 1000],
				"CALCULATION_ID": [iCalculationId1,iCalculationId2],
				"COST_TO_DISTRIBUTE": ['5000.0000000','5000.0000000'],
				"COST_NOT_DISTRIBUTED": ['5000.0000000','5000.0000000'],
				"DISTRIBUTION_TYPE": [1,1],
				"LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate],
				"LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser]
			};
			var oOneTimeCostLifecycle = {
				"ONE_TIME_COST_ID": [1000, 1000, 1000, 1000],
				"CALCULATION_ID": [iCalculationId1, iCalculationId1, iCalculationId2, iCalculationId2],
				"LIFECYCLE_PERIOD_FROM": [1440, 1452, 1440, 1452], 
				"VALUE": ['2500.0000000', '2500.0000000', '2500.0000000', '2500.0000000']
			};
			oMockstar.clearTables(["lifecycle_period_value", "one_time_project_cost", "one_time_product_cost", "one_time_cost_lifecycle_value"]);
			oMockstar.insertTableData("lifecycle_period_type", oLifecycleYearlyPeriodTypesForProject);
			oMockstar.insertTableData("lifecycle_monthly_period", oLifecycleMonthlyPeriod);
			oMockstar.insertTableData("one_time_project_cost", oOneTimeProjectCost);
			oMockstar.insertTableData("one_time_product_cost", oOneTimeProductCost);
			oMockstar.insertTableData("one_time_cost_lifecycle_value", oOneTimeCostLifecycle);
			oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValueTestData);
			oMockstar.execSingle(`UPDATE {{project}} SET START_OF_PROJECT = '${new Date('2020-01-01T00:00:00').toISOString()}', END_OF_PROJECT = '${new Date('2021-12-31T00:00:00').toISOString()}' WHERE PROJECT_ID = '${sProjectId}';`);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			
			let oOneTimeCostLifecycleValues = oMockstar.execQuery(`SELECT * FROM {{one_time_cost_lifecycle_value}} ORDER BY one_time_cost_id, calculation_id;`);
			expect(oOneTimeCostLifecycleValues.columns.LIFECYCLE_PERIOD_FROM.rows).toEqual([1440, 1452]);
			expect(oOneTimeCostLifecycleValues.columns.ONE_TIME_COST_ID.rows).toEqual([1000, 1000]);
			expect(oOneTimeCostLifecycleValues.columns.CALCULATION_ID.rows).toEqual([iCalculationId2, iCalculationId2]);
			expect(oOneTimeCostLifecycleValues.columns.VALUE.rows).toEqual(['5000.0000000', '5000.0000000']);

			let oOneTimeCostProduct = oMockstar.execQuery(`SELECT * FROM {{one_time_product_cost}};`);
			expect(oOneTimeCostProduct.columns.ONE_TIME_COST_ID.rows).toEqual([1000]);
			expect(oOneTimeCostProduct.columns.COST_TO_DISTRIBUTE.rows).toEqual(['10000.0000000']);
			expect(oOneTimeCostProduct.columns.CALCULATION_ID.rows).toEqual([iCalculationId2]);
		});

		it('should delete a calculation identified by its id -> all assosiated versions are deleted; 200 OK as response code', function() {
			// arrange
			let iOriginalCount_Calculation = mockstarHelpers.getRowCount(oMockstar, "calculation");
			let iOriginalCount_CalculationVersion = mockstarHelpers.getRowCount(oMockstar, "calculation_version");
			let iOriginalCount_ItemAll = mockstarHelpers.getRowCount(oMockstar, "item");
			let iOriginalCount_ItemCalcVersion = mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id="
					+ oTestCalculationVersion.CALCULATION_VERSION_ID);
			let iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
			let iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");

			if(jasmine.plcTestRunParameters.generatedFields === true){
				var iOriginalCount_ItemExtAll = mockstarHelpers.getRowCount(oMockstar, "item_ext");
				var iOriginalCount_ItemExtCalcVersion = mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id="
						+ oTestCalculationVersion.CALCULATION_VERSION_ID);
			}

			var oCheckEntityTagsExists = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + oTestCalculationVersion.CALCULATION_ID + " and entity_type = 'C'");
			expect(oCheckEntityTagsExists.columns.TAG_ID.rows[0]).toBe(2);
			oCheckEntityTagsExists = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + testData.iCalculationVersionId + " and entity_type = 'V'");
			expect(oCheckEntityTagsExists.columns.TAG_ID.rows[0]).toBe(1);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			expect(mockstarHelpers.getRowCount(oMockstar, "calculation", "calculation_id=" + oTestCalculation.CALCULATION_ID)).toBe(0);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_id=" + oTestCalculation.CALCULATION_ID)).toBe(0);
			expect(mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id=" + oTestCalculationVersion.CALCULATION_VERSION_ID)).toBe(0);

			expect(mockstarHelpers.getRowCount(oMockstar, "calculation")).toBe(iOriginalCount_Calculation - 1);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version")).toBe(iOriginalCount_CalculationVersion - 1);
			expect(mockstarHelpers.getRowCount(oMockstar, "item")).toBe(iOriginalCount_ItemAll - iOriginalCount_ItemCalcVersion);
			// check if calculation total quantity and associated values are deleted
			expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities - 1);
		    expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues - 3);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				expect(mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id=" + oTestCalculationVersion.CALCULATION_VERSION_ID)).toBe(0);
				expect(mockstarHelpers.getRowCount(oMockstar, "item_ext")).toBe(iOriginalCount_ItemExtAll - iOriginalCount_ItemExtCalcVersion);
			}

			var oCheckEntityTagsAfterDelete = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + oTestCalculationVersion.CALCULATION_ID + " and entity_type = 'C'");
			expect(oCheckEntityTagsAfterDelete.columns.TAG_ID.rows.length).toBe(0);
			oCheckEntityTagsAfterDelete = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + testData.iCalculationVersionId + " and entity_type = 'V'");
			expect(oCheckEntityTagsAfterDelete.columns.TAG_ID.rows.length).toBe(0);
		});

		it('should not delete a calculation if any of its versions is open and return 400 Bad Request', function() {
			// arrange
			oMockstar.insertTableData("open_calculation_version", {
				SESSION_ID : [ sSessionId ],
				CALCULATION_VERSION_ID : [ oTestCalculationVersion.CALCULATION_VERSION_ID ],
				IS_WRITEABLE : [ 1 ]
			});
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);

			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, oTestCalculation.CALCULATION_ID, messageCode.CALCULATIONVERSION_IS_STILL_OPENED_ERROR);
		});

		it('should not delete a calculation if calculation id does not exists -> return GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR', function() {
			// arrange
			// open the calculation
			let iInvalidCalculationId = 1111;

			oRequest = {
					method : $.net.http.DEL,
					queryPath : "",
					parameters : {
						get : function() {
							return undefined;
						}
					},
					body : {
						asString : function() {
							return JSON.stringify([ iInvalidCalculationId ]);
						}
					}
			};

			expect(mockstarHelpers.getRowCount(oMockstar, "calculation", "calculation_id=" + iInvalidCalculationId)).toBe(0);

			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, null, messageCode.GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR);
		});

		it('should not delete a calculation if it has an open version, the version was only created but not saved -> return CALCULATIONVERSION_IS_STILL_OPENED_ERROR', function() {
			// arrange
			let oNewlyCreatedVersion = 4444;
			oMockstar.insertTableData("open_calculation_version", {
				SESSION_ID : [ sSessionId ],
				CALCULATION_VERSION_ID : [ oNewlyCreatedVersion ],
				IS_WRITEABLE : [ 1 ]
			});
			oMockstar.insertTableData("calculation_version_temporary", {
						SESSION_ID : [ sSessionId ],
						CALCULATION_VERSION_ID : [oNewlyCreatedVersion],
						CALCULATION_ID : [ 1978],
						CALCULATION_VERSION_NAME : [ "Baseline Version1"],
						ROOT_ITEM_ID : [ 3001],
						REPORT_CURRENCY_ID : [ "EUR"],
						VALUATION_DATE : [ new Date("2011-08-20T00:00:00.000Z").toJSON() ],
						MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy],
						ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy]
			});

			// act
			requestAndCheckDbNotChangedAndException(oRequest, null, messageCode.CALCULATIONVERSION_IS_STILL_OPENED_ERROR);
		});
		
		it('should not delete a calculation if any version is frozen -> return CALCULATIONVERSION_IS_FROZEN_ERROR', function() {
			// arrange		
			// set first calculation version to frozen
			let oCalculationVersionTestDataClone = _.cloneDeep(testData.oCalculationVersionTestData);
			oCalculationVersionTestDataClone.IS_FROZEN = [1, 0, 0];
			oMockstar.clearTables("calculation_version");
			oMockstar.insertTableData("calculation_version", oCalculationVersionTestDataClone);

			// act
			requestAndCheckDbNotChangedAndException(oRequest, oCalculationVersionTestDataClone.CALCULATION_ID[0], messageCode.CALCULATIONVERSION_IS_FROZEN_ERROR);
		});

		it('should not delete a calculation that has source version used in other calculations -> return CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR', function() {
			// arrange
			oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
			let sExpectedDate = new Date().toJSON();
			oMockstar.insertTableData("item", {
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [2810, 2810, 2, 4811, 4811],
					"PARENT_ITEM_ID" : [ null, 3001, 3001, null, 5001],
					"PREDECESSOR_ITEM_ID" : [ null, 3001, null, null, 5001],
					"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
					"ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
					"CHILD_ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
					"REFERENCED_CALCULATION_VERSION_ID": [null, 2809, 4, null, 2810],
					"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
					"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
					"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
					"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
				});
		
			// act
			requestAndCheckDbNotChangedAndException(oRequest, testData.oCalculationTestData1.CALCULATION_ID[0], messageCode.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR);
		});
		
		
		it('should not delete calculation the project of which that is under lifecycle calculation -> return GENERAL_ENTITY_PART_OF_CALCULATION_ERROR', function() {
			// arrange: insert lifecycle calculation task for this project 
			let oTaskData = new TestDataUtility(testData.oTask).getObject(0);
			oTaskData.PARAMETERS = JSON.stringify({PROJECT_ID : testData.oCalculationTestData.PROJECT_ID[0]});
			oTaskData.STATUS = TaskStatus.ACTIVE;
			oMockstar.insertTableData("task", oTaskData);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, testData.oCalculationTestData.CALCULATION_ID[0], messageCode.GENERAL_ENTITY_PART_OF_CALCULATION_ERROR);
		});
		
		/**
		 * Help function to act and check for tests in which the calculation should not be deleted
		 */
		function requestAndCheckDbNotChangedAndException(oRequest, iCalculationId, oExpectedMessageCode) {
			let iOriginalCount_Calculation = mockstarHelpers.getRowCount(oMockstar, "calculation");
			let iOriginalCount_GivenCalculation = mockstarHelpers.getRowCount(oMockstar, "calculation",  "calculation_id=" +iCalculationId);
			let iOriginalCount_CalculationVersion = mockstarHelpers.getRowCount(oMockstar, "calculation_version");
			let iOriginalCount_CalculationVersionForCalculation = mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_id=" + iCalculationId);
			let iOriginalCount_ItemAll = mockstarHelpers.getRowCount(oMockstar, "item");
			let iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration");
			let iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value");

			if(jasmine.plcTestRunParameters.generatedFields === true){
				var iOriginalCount_ItemExtAll = mockstarHelpers.getRowCount(oMockstar, "item_ext");
			}

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation", "calculation_id=" +iCalculationId)).toBe(iOriginalCount_GivenCalculation);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation")).toBe(iOriginalCount_Calculation);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_id=" + iCalculationId)).toBe(iOriginalCount_CalculationVersionForCalculation);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version")).toBe(iOriginalCount_CalculationVersion);
			expect(mockstarHelpers.getRowCount(oMockstar, "item")).toBe(iOriginalCount_ItemAll);
			expect(mockstarHelpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
		    expect(mockstarHelpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				expect(mockstarHelpers.getRowCount(oMockstar, "item_ext")).toBe(iOriginalCount_ItemExtAll);
			}

			// Check response
			expect(oDefaultResponseMock.status).toBe(oExpectedMessageCode.responseCode);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toEqual(1);
			expect(oResponseObject.head.messages[0].code).toEqual(oExpectedMessageCode.code);
			expect($.trace.error).toHaveBeenCalled();
			
			return oResponseObject;
		}

	});

	if(jasmine.plcTestRunParameters.mode === 'all'){
		describe('get', function() {

            function prepareGetRequest(sProjectIds, sCalculationIds, iTopPerProject, sSearchCriteria, iTopCalculations){
                
                var params = [];
                if(!helpers.isNullOrUndefined(sProjectIds)){
                    params.push({
					    "name" : "project_id",
					    "value" : sProjectIds
				    });
                }
                
                if(!helpers.isNullOrUndefined(sCalculationIds)){
                    params.push({
					    "name" : "calculation_id",
					    "value" : sCalculationIds
				    });
                }
                
                if(!helpers.isNullOrUndefined(iTopPerProject)){
                    params.push({
					    "name" : "topPerProject",
					    "value" : iTopPerProject
				    });
                }
                
                if(!helpers.isNullOrUndefined(sSearchCriteria)){
                    params.push({
					    "name" : "searchAutocomplete",
					    "value" : sSearchCriteria
				    });
                }
                
                if(!helpers.isNullOrUndefined(iTopCalculations)){
                    params.push({
					    "name" : "top",
					    "value" : iTopCalculations
				    });
                }
                
				params.get = function(sArgument) {
					var value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};
                
    			var oRequest = {
    					queryPath : "calculations",
    					method : $.net.http.GET,
    					parameters : params
    			};
    			return oRequest;
            }
			

			function prepareCreateNewCalculationRequest(sCalculationName) {
				// create a new calculation object as payload of the request; use data from testData.xsjslib as basis
				var oNewCalculation = _.omit(_.cloneDeep(oTestCalculation), [ "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_BY" ]);
				oNewCalculation.CALCULATION_ID = -1;
				
				if(!helpers.isNullOrUndefined(sCalculationName)){
					oNewCalculation.CALCULATION_NAME = sCalculationName
				}
				// omit read-only properties, since otherwise the request will be invalid
				var oNewCv = _.omit(_.cloneDeep(oTestCalculationVersion), [ "CALCULATION_VERSION_TYPE", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY",
				                                                        "SALES_DOCUMENT", "START_OF_PRODUCTION", "END_OF_PRODUCTION", "MASTER_DATA_TIMESTAMP" ]);
				oNewCv.CALCULATION_ID = -1;
				oNewCv.CALCULATION_VERSION_ID = -1;
				oNewCv.ROOT_ITEM_ID = -1;
				oNewCv.VALUATION_DATE = "2011-08-20";
				oNewCalculation.CALCULATION_VERSIONS = [ oNewCv ];
				var oNewItem = {};
				oNewItem.CALCULATION_VERSION_ID = -1;
				oNewItem.ITEM_ID = -1;
				oNewItem.IS_ACTIVE = oTestItem.IS_ACTIVE;
				oNewItem.TOTAL_QUANTITY = oTestItem.TOTAL_QUANTITY;
				oNewItem.TOTAL_QUANTITY_UOM_ID = oTestItem.TOTAL_QUANTITY_UOM_ID;
				oNewItem.PRICE_FIXED_PORTION = 0;
				oNewItem.PRICE_VARIABLE_PORTION = 0;
				oNewItem.TRANSACTION_CURRENCY_ID = oTestCalculationVersion.REPORT_CURRENCY_ID;
				oNewItem.PRICE_UNIT = 1;
				oNewItem.PRICE_UNIT_UOM_ID = "ST";
				oNewCv.ITEMS = [ oNewItem ];

				var postParams = [ {
					"name" : "action",
					"value" : "create"
				}];

				postParams.get = function(sArgument) {
					var value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};

				var oRequest = {
						queryPath : "calculations",
						method : $.net.http.POST,
						body : {
							asString : function() {
								return JSON.stringify([ oNewCalculation ]);
							}
						},
						parameters : postParams
				};
				return oRequest;
			}

			beforeEach(function() {
				oMockstar.clearAllTables();
				// oMockstarCust.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
				oMockstar.insertTableData("status", testData.oStatusTestData);
				oMockstar.insertTableData("status__text", testData.oStatusTextTestData);
				oMockstar.insertTableData("item", testData.oItemTestData);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
				enterPrivilege(testData.oProjectCurrencyTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
				// oMockstarCust.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
				
				spyOn($.trace, "error").and.callThrough();
				spyOn(helpers, "logError").and.callFake(function (msg) { $.trace.error(msg); });
			});


			it('should return all calculations', function(){
				
				// act
				new Dispatcher(oCtx, prepareGetRequest(), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();

				expect(oResponseObject.body.transactionaldata.length).toBe(3);
				//check that the current_calculation_version is on the response
				expect(oResponseObject.body.transactionaldata[1].CURRENT_CALCULATION_VERSION_ID).toBe(2809);
				expect(oResponseObject.body.transactionaldata[0].CURRENT_CALCULATION_VERSION_ID).toBe(4809);
				expect(oResponseObject.body.transactionaldata[2].CURRENT_CALCULATION_VERSION_ID).toBe(5809);

			});

			it('should return a list of calculations excluding the one newly created by another user', function() {
				// arrange
				// create new calculation
				var oCreateRequest = prepareCreateNewCalculationRequest("CALCULATION_NAME_TEST_1");
				new Dispatcher(oCtx, oCreateRequest, oDefaultResponseMock).dispatch();
				// change user of newly created calculation
				// open_versions; version_temporary; item_temporary
				var oVersion = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]).body.transactionaldata[0].CALCULATION_VERSIONS[0];
				var iVersionId = oVersion.CALCULATION_VERSION_ID;
				oMockstar.upsertTableData("open_calculation_version", {
					SESSION_ID : "otherId",
					CALCULATION_VERSION_ID : iVersionId,
					IS_WRITEABLE : 1
				}, "SESSION_ID='" + testData.sSessionId + "' AND CALCULATION_VERSION_ID =" + iVersionId);
				oVersion.SESSION_ID = "otherId";
				delete oVersion.ITEMS;
				delete oVersion.MASTERDATA;
				delete oVersion.IS_DIRTY;
				oMockstar.upsertTableData("calculation_version_temporary", oVersion, "SESSION_ID='" + testData.sSessionId + "' AND CALCULATION_VERSION_ID ="
						+ iVersionId);

				// act
				new Dispatcher(oCtx, prepareGetRequest(), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();
				// should return only the three "old" calculations, but not the newly created since its version has not been
				// saved
				//according to commit 2eb7e63 -> get service now return also calculations_version_temporary
				expect(oResponseObject.body.transactionaldata.length).toBe(4);
			});

			it('should return a list of calculations excluding the one newly created by the same user', function() {
				// arrange
				// create new calculation
				var oCreateRequest = prepareCreateNewCalculationRequest("CALCULATION_NAME_TEST_1");
				new Dispatcher(oCtx, oCreateRequest, oDefaultResponseMock).dispatch();
				var oCreateRequest = prepareCreateNewCalculationRequest("CALCULATION_NAME_TEST_2");
				new Dispatcher(oCtx, oCreateRequest, oDefaultResponseMock).dispatch();
				// act
				new Dispatcher(oCtx, prepareGetRequest(), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();
				// should return the three "old" calculations
				//according to commit 2eb7e63 -> get service now return also calculations_version_temporary
				expect(oResponseObject.body.transactionaldata.length).toBe(5);
			});
			
			it("should return all calculations belonging a given project id", function(){
			    //arrange
			    var oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1]);
			    
			    // act
				new Dispatcher(oCtx, prepareGetRequest(testData.oProjectTestData.PROJECT_ID[0]), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();

                expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
			
			it("should return all calculations belonging to a list of given project ids", function(){
			    //arrange
				var oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1]);
				enterPrivilege("PRR", sUserId, InstancePrivileges.CREATE_EDIT);
			    
			    // act
				new Dispatcher(oCtx, prepareGetRequest(testData.oProjectTestData.PROJECT_ID[0] + ",PRR"), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();

				expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});

			it("should return ENTITY_NOT_FOUND_ERROR when requesting calculations from a project you are not authorized to see", function(){
			    // act
				new Dispatcher(oCtx, prepareGetRequest(testData.oProjectTestData.PROJECT_ID[0] + ",PRR"), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				
				//check that the  project exists in the database but we are getting NOT FOUND because the  user  is not authorized to read it
				expect(oMockstar.execQuery(`select PROJECT_ID from {{project}} where project_id = 'PRR'`).columns.PROJECT_ID.rows.length).toBe(1);
			});

			it("should return general entity not found error when given project id doesn t exist", function(){
			    //arrange
			    
			    // act
				new Dispatcher(oCtx, prepareGetRequest('XYZ'), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it("should return general entity not found error when given project ids doesn t exist (multiple project ids)", function(){
			    //arrange
			    
			    // act
				new Dispatcher(oCtx, prepareGetRequest('XYZ,PJ1,PJ2'), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});
			
			it("should return the calculation with the given calculation id", function(){
			    //arrange
			    var oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([0]);
			    
			    // act
				new Dispatcher(oCtx, prepareGetRequest(undefined, testData.iCalculationId), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();

				expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
				
			});
			
			it("should return all calculations having one of the given calculation ids", function(){
			    //arrange
			    var oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([0]);
			    
			    // act
				new Dispatcher(oCtx, prepareGetRequest(undefined, testData.iCalculationId), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();

				expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
			
			it('should return no calculations for each project if topPerProject parameter is set to 0', function(){
				// act
				new Dispatcher(oCtx, prepareGetRequest(null, null, 0), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();

				expect(oResponseObject.body.transactionaldata.length).toBe(0);
			});
			
			it('should return first calculations for each project if topPerProject parameter is set to 1', function(){
				//arrange
			    var oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([1,2]);
			    
				// act
				new Dispatcher(oCtx, prepareGetRequest(null, null, 1), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();

				expect(oResponseObject.body.transactionaldata.length).toBe(2);
				//check that the current_calculation_version is on the response
				expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
			
			it('should return first calculations (2 from a project and 1 from another) ordered by Calculation Name for each project if topPerProject parameter is set to 2', function(){
				//arrange
			    var oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([0, 1,2]);
			    
				// act
				new Dispatcher(oCtx, prepareGetRequest(null, null, 2), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();

				expect(oResponseObject.body.transactionaldata.length).toBe(3);
				//check that the current_calculation_version is on the response
				expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR if value is greater than 2147483647 (max Integer supported by SQL-numeric overflow)', function(){
				//arrange
			    var oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([1,2]);
			    
				// act
				new Dispatcher(oCtx, prepareGetRequest(null, null, 2147483648), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
				expect($.trace.error).toHaveBeenCalled();
			});
			
			it("should return all calculations for which the CALCULATION_NAME contain a given string", function(){
			    //arrange
			    const oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([0, 1]);
			    const aProjectIds = null, aCalculationIds = null, iTopPerProject = null, sSearchCriteria = "ump";
			    // act
				new Dispatcher(oCtx, prepareGetRequest(aProjectIds, aCalculationIds, iTopPerProject, sSearchCriteria), oDefaultResponseMock).dispatch();
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();
                expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
            it("should return all calculations for which the CALCULATION_ID contain a given string", function(){
			    //arrange
			    const oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([1, 2]);
			    const aProjectIds = null, aCalculationIds = null, iTopPerProject = null, sSearchCriteria = "078";
			    // act
				new Dispatcher(oCtx, prepareGetRequest(aProjectIds, aCalculationIds, iTopPerProject, sSearchCriteria), oDefaultResponseMock).dispatch();
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();
                expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
			it("should return no calculation if the search criteria does not correspond to any id or calculation name", function(){
			    //arrange
			    const aProjectIds = null, aCalculationIds = null, iTopPerProject = null, sSearchCriteria = "search-search";
			    // act
				new Dispatcher(oCtx, prepareGetRequest(aProjectIds, aCalculationIds, iTopPerProject, sSearchCriteria), oDefaultResponseMock).dispatch();
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();
                expect(oResponseObject.body.transactionaldata.length).toBe(0);
			});
			xit("should return 2 calculations when top parameter is 2", function(){
			    //arrange
			    const oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([0, 1]);
			    const aProjectIds = null, aCalculationIds = null, iTopPerProject = null, sSearchCriteria = null, iTopCalculations = 2;
			    // act
				new Dispatcher(oCtx, prepareGetRequest(aProjectIds, aCalculationIds, iTopPerProject, sSearchCriteria, iTopCalculations), oDefaultResponseMock).dispatch();
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();
                expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
			
			it("should return 1 calculation when top parameter is 2 but search criteria finds only one result", function(){
			    //arrange
			    const oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([0]);
			    const aProjectIds = null, aCalculationIds = null, iTopPerProject = null, sSearchCriteria = "Pumpe P-100", iTopCalculations = 2;
			    // act
				new Dispatcher(oCtx, prepareGetRequest(aProjectIds, aCalculationIds, iTopPerProject, sSearchCriteria, iTopCalculations), oDefaultResponseMock).dispatch();
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();
                expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
			it("should return 1 calculation when top parameter is 2 calculation_id parameter is only 1", function(){
			    //arrange
			    const oExpectedResponse = new TestDataUtility(testData.oCalculationTestData).getObjects([1]);
			    const aProjectIds = null, aCalculationIds = testData.oCalculationTestData.CALCULATION_ID[1], iTopPerProject = null, sSearchCriteria = null, iTopCalculations = 2;
			    // act
				new Dispatcher(oCtx, prepareGetRequest(aProjectIds, aCalculationIds, iTopPerProject, sSearchCriteria, iTopCalculations), oDefaultResponseMock).dispatch();
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject).toBeDefined();
                expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
			});
		});
	}
	
}).addTags(["Project_Calculation_Version_Integration"]);