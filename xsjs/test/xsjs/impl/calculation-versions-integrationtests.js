/*jslint undef:true*/

//These are the integration tests for selected case of calculation-versions.xsjslib. Here we test the end-to-end runs.
var _ = require("lodash");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Constants = require("../../../lib/xs/util/constants");
const TaskStatus = Constants.TaskStatus;
const CalculationVersionParameters = Constants.CalculationVersionParameters;
const ResponseObjectStub = require("../../testtools/responseObjectStub").ResponseObjectStub;
const TaskType = Constants.TaskType;
var mockstart_helpers = require("../../testtools/mockstar_helpers");
var test_helpers = require("../../testtools/test_helpers");
var testData = require("../../testdata/testdata").data;
var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

var PersistencyImport = $.import("xs.db", "persistency");
var CalculationVersionImport = require("../../../lib/xs/db/persistency-calculationVersion");
var AdministrationImport = $.import("xs.db", "persistency-administration");
var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase();

var oMockstar = null;

var Persistency = PersistencyImport.Persistency;

var helpers = require("../../../lib/xs/util/helpers");
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var MessageLibrary = require("../../../lib/xs/util/message");
var messageCode = MessageLibrary.Code;
var severity = MessageLibrary.Severity;

var oDefaultResponseMock = null;

var sSessionId = testData.sSessionId;
var mTableNames = CalculationVersionImport.Tables;

var testDataGenerator = require("../../testdata/testdataGenerator");
var InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const aEmptyArray = [];
var sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;
describe('xsjs.impl.calculation-versions-integrationtests',	function() {

	var oModifiedCalculationVersion1 = null;
	var oModifiedCalculationVersion1a = null;
	var oModifiedCalculationVersion2 = null;
	var oModifiedPriceStrategyCalculationVers = null;
	var oModifiedCalculationVersValuationDateUnchanged = null;
	var oExpectedCustObject = null;

	var cvOriginalProcedures = null;
	var mdOriginalProcedures = null;
	var sUserId = testData.sTestUser;
	var oPersistency = null;

	var oTestCalculation = mockstart_helpers.convertToObject(testData.oCalculationTestData, 0);
	var oTestCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
	var oTestTemporaryCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTemporaryTestData, 1);
	var oTestItem = mockstart_helpers.convertToObject(testData.oItemTestData, 0);
	let oResponseStub = null;

	const oOpenCalcVersionsTestData = {
        SESSION_ID: ["SOMEONE"],
        CALCULATION_VERSION_ID: [testData.iCalculationVersionId],
        CONTEXT: ["variant_matrix"],
        IS_WRITEABLE: [1]
    };

	beforeOnce(function() {

		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel : {
						"procSetId" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_set_new_id",
						"procCopy" : "sap.plc.db.calculationmanager.procedures/p_calculation_open_copy_to_temporary_tables",
						"procSave" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_save",
						"procSaveResults" : "sap.plc.db.calcengine.procedures::p_calculation_save_results",
						"calculations_versions_read" : "sap.plc.db.calculationmanager.procedures/p_calculations_versions_read",
						"calculation_version_open" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
						"calculation_version_close" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_close",
						"calculation_version_delete" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_delete",
						"calculation_configuration_masterdata_read" : "sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read",
						"calculation_version_trigger_price_determination": "sap.plc.db.calculationmanager.procedures/p_calculation_version_trigger_price_determination",
						"calculation_version_masterdata_timestamp_update" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_masterdata_timestamp_update",
						"calculation_version_copy" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_copy"
					},
					substituteTables : // substitute all used tables in the procedure or view
					{
						gtt_calculation_version_ids: "sap.plc.db::temp.gtt_calculation_version_ids",
						open_calculation_versions: {
							name: "sap.plc.db::basis.t_open_calculation_versions",
							data: oOpenCalcVersionsTestData
						},
						open_projects : "sap.plc.db::basis.t_open_projects",
						calculation_version_temporary : "sap.plc.db::basis.t_calculation_version_temporary",
						calculation_version : "sap.plc.db::basis.t_calculation_version",
						tag : {
							name : "sap.plc.db::basis.t_tag",
							data : testData.oTagTestData
						},
						entity_tags : {
							name : "sap.plc.db::basis.t_entity_tags",
							data : testData.oEntityTagsTestData
						},
						item_temporary : "sap.plc.db::basis.t_item_temporary",
						item_temporary_ext : "sap.plc.db::basis.t_item_temporary_ext",
						item : "sap.plc.db::basis.t_item",
						item_ext : "sap.plc.db::basis.t_item_ext",
						costing_sheet : {
							name : "sap.plc.db::basis.t_costing_sheet",
							data : testData.oCostingSheetTestData
						},
						costing_sheet__text : "sap.plc.db::basis.t_costing_sheet__text",
						costing_sheet_row : "sap.plc.db::basis.t_costing_sheet_row",
						costing_sheet_row__text : "sap.plc.db::basis.t_costing_sheet_row__text",
						component_split : {
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
						controlling_area :  "sap.plc.db::basis.t_controlling_area",
						component_split__text : "sap.plc.db::basis.t_component_split__text",
						account: {
							name: "sap.plc.db::basis.t_account",
							data: testData.oAccountForItemTestData
						},
						component_split_account_group : "sap.plc.db::basis.t_component_split_account_group",
						account_group : "sap.plc.db::basis.t_account_group",
						account_account_group : "sap.plc.db::basis.t_account_account_group",
						account_group__text : "sap.plc.db::basis.t_account_group__text",
						session : "sap.plc.db::basis.t_session",
						task: 'sap.plc.db::basis.t_task',
						calculation : "sap.plc.db::basis.t_calculation",
						project_lifecycle_configuration: "sap.plc.db::basis.t_project_lifecycle_configuration",
						lifecycle_period_value: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
						project: "sap.plc.db::basis.t_project",
						authorization: "sap.plc.db::auth.t_auth_project",
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
						recent_calculation_versions: "sap.plc.db::basis.t_recent_calculation_versions",
						material_plant : "sap.plc.db::basis.t_material_plant",
						material_text : "sap.plc.db::basis.t_material__text",
						plant_text : "sap.plc.db::basis.t_plant__text",
						material : "sap.plc.db::basis.t_material",
						metadata : {
							name : "sap.plc.db::basis.t_metadata",
							data : testData.mCsvFiles.metadata
						},
						metadata_text : "sap.plc.db::basis.t_metadata__text",
						metadata_item_attributes : {
							name : "sap.plc.db::basis.t_metadata_item_attributes",
							data : testData.mCsvFiles.metadata_item_attributes
						},

						costing_sheet_row_dependencies : "sap.plc.db::basis.t_costing_sheet_row_dependencies",

						costing_sheet_base : "sap.plc.db::basis.t_costing_sheet_base",

						costing_sheet_base_row : "sap.plc.db::basis.t_costing_sheet_base_row",

						costing_sheet_overhead : "sap.plc.db::basis.t_costing_sheet_overhead",

						costing_sheet_overhead_row : "sap.plc.db::basis.t_costing_sheet_overhead_row",

						uom : {
							name: "sap.plc.db::basis.t_uom",
							data: {
								"UOM_ID": ["ST", "PC"],
								"DIMENSION_ID": ["D2", "NONE"],
								"NUMERATOR": [1, 1],
								"DENOMINATOR": [1, 1],
								"EXPONENT_BASE10": [0, 0],
								"SI_CONSTANT": [0,0],
								"_VALID_FROM": ["2015-06-02T14:45:50.096Z", "2015-06-02T14:45:50.096Z"],
								"_SOURCE": [1, 1],
								"_CREATED_BY": ["U000", "U000"]
							}
						},
						
						exchange_rate_type : {
							name:"sap.plc.db::basis.t_exchange_rate_type",
							data: testData.oExchangeRateTypeTestDataPlc
						},

						currency_conversion : "sap.plc.db::basis.t_currency_conversion",

						item_calculated_values_costing_sheet : "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
						application_timeout: 'sap.plc.db::basis.t_application_timeout',

						item_calculated_values_component_split : "sap.plc.db::basis.t_item_calculated_values_component_split",

						customer : "sap.plc.db::basis.t_customer",
						currency : {
							name : "sap.plc.db::basis.t_currency",
							data :  {
								CURRENCY_ID : [  testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
												 testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[1],
												 testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0]],
								                 _VALID_FROM : [ testData.sValidFromDate, testData.sValidFromDate, "2019-05-30T01:39:09.691Z"]
							}
						},
                        referenced_version_component_split: "sap.plc.db::basis.t_item_referenced_version_component_split",
						referenced_version_component_split_temporary: "sap.plc.db::basis.t_item_referenced_version_component_split_temporary",
						variant: "sap.plc.db::basis.t_variant",
						variant_temporary: "sap.plc.db::basis.t_variant_temporary",
						variant_item: "sap.plc.db::basis.t_variant_item",
						variant_item_temporary: "sap.plc.db::basis.t_variant_item_temporary",
						price_determination_strategy: {
							name: "sap.plc.db::basis.t_price_determination_strategy",
							data: testData.oPriceDeterminationStrategyTestData
						},
						price_determination_strategy_price_source: {
							name: "sap.plc.db::basis.t_price_determination_strategy_price_source",
							data: testData.oPriceDeterminationStrategyPriceSource
						},
						price_determination_strategy_rule: {
							name: "sap.plc.db::basis.t_price_determination_strategy_rule",
							data: testData.oPriceDeterminationStrategyRuleTestData
						},
						material_price: {
							name: "sap.plc.db::basis.t_material_price",
							data: testData.oMaterialPriceDataPlc
						},
						activity_price: {
							name: "sap.plc.db::basis.t_activity_price",
							data: testData.oActivityPriceDataPlc
						},
						price_source: {
							name: "sap.plc.db::basis.t_price_source",
							data: testData.oPriceSourceTestDataPlc1
						},
						price_component: {
							name: "sap.plc.db::basis.t_price_component",
							data: testData.oPriceComponentTestDataPlc
						},
						session: "sap.plc.db::basis.t_session"
					},
					csvPackage : testData.sCsvPackage
				});

		if (!oMockstar.disableMockstar) {
			cvOriginalProcedures = CalculationVersionImport.Procedures;
			CalculationVersionImport.Procedures = Object.freeze({
				calculation_version_open : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_open',
				calculations_versions_read : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculations_versions_read',
				calculation_version_set_id : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_set_new_id',
				calculation_version_save : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_save',
				calculation_save_results : procedurePrefix + '.sap.plc.db.calcengine.procedures::p_calculation_save_results',
				calculation_version_close : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_close',
				calculation_version_delete : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_delete',
				calculation_version_trigger_price_determination : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_trigger_price_determination',
				calculation_version_masterdata_timestamp_update : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_masterdata_timestamp_update',
				calculation : procedurePrefix + '.sap.plc.db.calcengine.procedures::p_calculation_components_only',
				delete_item : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_item_delete_item_with_children',
				calculation_copy_temporary : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_open_copy_to_temporary_tables',
				calculation_configuration_masterdata_read : procedurePrefix
				+ '.sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read',
				calculation_version_copy : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_copy'

			});
			mdOriginalProcedures = AdministrationImport.Procedures;
			AdministrationImport.Procedures = Object.freeze({
				calculation_configuration_masterdata_read : procedurePrefix
				+ '.sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read'

			});
		}
	});

	afterOnce(function() {
		if (!oMockstar.disableMockstar) {
			CalculationVersionImport.Procedures = cvOriginalProcedures;
			AdministrationImport.Procedures = mdOriginalProcedures;
			oMockstar.cleanupMultiple([ "sap.plc.db.calculationmanager.procedures", "sap.plc.db.calcengine.procedures", "sap.plc.db.calcengine.views" ]);
			oMockstar.cleanup();
		}
	});

	beforeEach(function() {
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
	
	function checkSaveOrCopyOfLifecycleVersion(oRequest, iCalculationVersionID){
		// act
		new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

		// assert

		// validate response body
		let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);			
		expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).not.toBe(iCalculationVersionID);
		expect(oResponseObject.body.transactionaldata[0].BASE_VERSION_ID).toBe(null);
		expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_TYPE).toBe(Constants.CalculationVersionType.Base);
		expect(oResponseObject.body.transactionaldata[0].LIFECYCLE_PERIOD_FROM).toBe(null);
		
        // check that PRICE_SOURCE properties for items with OUTDATED_PRICE have been updated
		expect(oResponseObject.body.transactionaldata[0].ITEMS[2].PRICE_SOURCE_ID).toBe('MANUAL_PRICE');
		expect(oResponseObject.body.transactionaldata[0].ITEMS[2].PRICE_SOURCE_TYPE_ID).toBe(3);

		//check if there is no entry in calculation_version_temporary with id iCalculationVersionID
		expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version_temporary", "calculation_version_id=" + iCalculationVersionID + " and session_id='" + sSessionId+"'")).toBe(0);
		
		// check if there is an entry in calculation_version with id calculation_version and LIFECYCLE_PERIOD_FROM
		expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id=" + iCalculationVersionID + " and lifecycle_period_from=" +555)).toBe(1);
    }

	describe('Update Calculation Versions',	function() {

        var oBuiltTestData = testDataGenerator.buildTestDataForReferencedCalcVer();
        
		beforeEach(function() {
			oMockstar.clearAllTables();
			oMockstar.initializeData();
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oResponseStub = new ResponseObjectStub();

			oMockstar.insertTableData("session", testData.oSessionTestData);
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
			if(jasmine.plcTestRunParameters.generatedFields === true) {
				oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				oMockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
			}
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
			oMockstar.insertTableData("costing_sheet__text", testData.oCostingSheetTextTestData);
			oMockstar.insertTableData("referenced_version_component_split", oBuiltTestData.ReferenceVersionComponentSplit);
			oMockstar.insertTableData("referenced_version_component_split_temporary", oBuiltTestData.ReferenceVersionComponentSplitTemporary);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
			enterPrivilege(testData.oProjectPriceData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);

			oModifiedCalculationVersion1 = {
					CALCULATION_VERSION_ID : testData.iCalculationVersionId,
					CALCULATION_VERSION_NAME : "New Test 2809",
					CALCULATION_ID : 1408,
					CUSTOMER_ID: "",
					COSTING_SHEET_ID : testData.oCostingSheetTestData.COSTING_SHEET_ID[0],
					VALUATION_DATE : "2011-08-20",
					ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
					REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
					ACTIVITY_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[3],
					MATERIAL_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[2]
			};

			oModifiedCalculationVersValuationDateUnchanged = {
				CALCULATION_VERSION_ID : testData.iCalculationVersionId,
				CALCULATION_VERSION_NAME : "New Test 2809",
				CALCULATION_ID : 1408,
				CUSTOMER_ID: "",
				COSTING_SHEET_ID : testData.oCostingSheetTestData.COSTING_SHEET_ID[0],
				VALUATION_DATE : "2011-08-20",
				ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
				REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
				ACTIVITY_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[1],
				MATERIAL_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0]
		};

			oModifiedPriceStrategyCalculationVers = {
				CALCULATION_VERSION_ID : 1039,
				CALCULATION_VERSION_NAME : "Material Version1",
				CALCULATION_ID : 1002,
				CUSTOMER_ID: "",
				COSTING_SHEET_ID : null,
				VALUATION_DATE : "2019-05-30",
				ROOT_ITEM_ID : 1,
				REPORT_CURRENCY_ID : "EUR",
				ACTIVITY_PRICE_STRATEGY_ID: "PLC_TEST_ST_ACT",
				MATERIAL_PRICE_STRATEGY_ID: "PLC_STANDARD"
		};

			// what is this needed for? aRne
			oModifiedCalculationVersion1a = {
					CALCULATION_VERSION_ID : testData.iCalculationVersionId,
					CALCULATION_VERSION_NAME : "New Test 2809",
					CALCULATION_ID : 1408,
					CUSTOMER_ID: "CC",
					VALUATION_DATE : "2011-08-20",
					ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
					REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
					ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy,
					MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy
			};
			oModifiedCalculationVersion2 = {
					CALCULATION_VERSION_ID : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1],
					COSTING_SHEET_ID : testData.oCostingSheetTestData.COSTING_SHEET_ID[0],
					CALCULATION_VERSION_NAME : "New Test 4809",
					CALCULATION_ID : testData.oCalculationVersionTestData.CALCULATION_ID[1],
					VALUATION_DATE : "2011-08-20",
					ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
					REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
					ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy,
					MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy
			};
			oModifiedCalculationVersionDuplicatedName = {
					CALCULATION_VERSION_ID : testData.iCalculationVersionId,
					COSTING_SHEET_ID : testData.oCostingSheetTestData.COSTING_SHEET_ID[0],
					CALCULATION_VERSION_NAME : "NewName",
					CALCULATION_ID : testData.iCalculationId,
					VALUATION_DATE : "2011-08-20",
					ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
					REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0]

			};
			oModifiedManualLifecycleVersion = {
				CALCULATION_VERSION_ID : testData.oCalculationLifecycleVersionTestData.CALCULATION_VERSION_ID[1],
				CALCULATION_VERSION_NAME : "New Test 2809",
				CALCULATION_ID : 1408,
				CUSTOMER_ID: "",
				COSTING_SHEET_ID : testData.oCostingSheetTestData.COSTING_SHEET_ID[0],
				VALUATION_DATE : "2011-08-20",
				ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
				REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
				ACTIVITY_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[3],
				MATERIAL_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[2]
			};

			if(jasmine.plcTestRunParameters.generatedFields === true){
				//prepare expected object in case of custom fields
				oExpectedCustObject = {};
			    var aFields = testData.aNotCalculatedCustomFields.concat("ITEM_ID");
    			_.each(aFields, function(fieldName,index){
    				if(_.has(testData.oItemTemporaryExtData, fieldName)){
    				    var oItem1 = testData.oItemTemporaryExtData[fieldName][0];
    				    var oItem2 = testData.oItemTemporaryExtData[fieldName][1];
    				    var oItem3 = testData.oItemTemporaryExtData[fieldName][2];
    					var aItemFiledsValue = [oItem1, oItem2, oItem3];
    					var oCustObject = _.zipObject([fieldName],[aItemFiledsValue]);
    					oExpectedCustObject = _.extend(oExpectedCustObject,oCustObject);
    				}
    			});
			}
		});

		function buildUpdateRequest(oCalculationVersion, bOmitItems, bCompressedResult, bCalculate) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "calculate",
				"value" : bCalculate || "false"
			}, {
				"name": "omitItems",
				"value": bOmitItems
			}, {
				"name": "compressedResult",
				"value": bCompressedResult
			}, {
				"name": "loadMasterdata",
				"value": "true"
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

			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.PUT,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify(oCalculationVersion);
						}
					}
			};
			return oRequest;
		}

		if(jasmine.plcTestRunParameters.generatedFields === true) {
			it("should add the currency units for the custom fields with the calculated values from AFL", function() {
				// arrange
				var oModifiedCalcVersion = {
					CALCULATION_ID: oModifiedCalculationVersion1.CALCULATION_ID,
					CALCULATION_VERSION_ID: oModifiedCalculationVersion1.CALCULATION_VERSION_ID,
					CALCULATION_VERSION_NAME: oModifiedCalculationVersion1.CALCULATION_VERSION_NAME,
					COMPONENT_SPLIT_ID: oModifiedCalculationVersion1.COMPONENT_SPLIT_ID,
					CUSTOMER_ID: oModifiedCalculationVersion1.CUSTOMER_ID,
					END_OF_PRODUCTION: oModifiedCalculationVersion1.END_OF_PRODUCTION,
					REPORT_CURRENCY_ID: "USD",
					EXCHANGE_RATE_TYPE_ID: oModifiedCalculationVersion1.EXCHANGE_RATE_TYPE_ID,
					ROOT_ITEM_ID: oModifiedCalculationVersion1.ROOT_ITEM_ID,
					SALES_PRICE_CURRENCY_ID: oModifiedCalculationVersion1.SALES_PRICE_CURRENCY_ID,
					SALES_DOCUMENT: oModifiedCalculationVersion1.SALES_DOCUMENT,
					START_OF_PRODUCTION: oModifiedCalculationVersion1.START_OF_PRODUCTION,
					VALUATION_DATE: oModifiedCalculationVersion1.VALUATION_DATE,
					MATERIAL_PRICE_STRATEGY_ID: oModifiedCalculationVersion1.MATERIAL_PRICE_STRATEGY_ID,
					ACTIVITY_PRICE_STRATEGY_ID: oModifiedCalculationVersion1.ACTIVITY_PRICE_STRATEGY_ID,
				};
				oMockstar.clearTable("item_temporary_ext");
				oMockstar.insertTableData("item_temporary_ext",{
					"ITEM_ID" : [ 3001, 3002, 3003 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809 ],
					"CUST_ROLLUP_CURRENCY_MANUAL":[null, null, 10],
			    	"CUST_ROLLUP_CURRENCY_CALCULATED":[10, 10, null],
			    	"CUST_ROLLUP_CURRENCY_UNIT":["USD", "USD", "EUR"],
					"CUST_ROLLUP_CURRENCY_IS_MANUAL":[0, 0, 1],
					"SESSION_ID":["TEST_USER_1", "TEST_USER_1", "TEST_USER_1"]
				});

				// act
				var oRequest = buildUpdateRequest([ oModifiedCalcVersion ], false, true, true);
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// Check results from DB
				var oResultFromDb = oMockstar.execQuery(`SELECT "ITEM_ID", "CUST_ROLLUP_CURRENCY_UNIT" FROM {{item_temporary_ext}} WHERE CALCULATION_VERSION_ID = 2809`);
				var iDbItemId3001 = Object.keys(oResultFromDb.columns.ITEM_ID.rows).filter(function(key) {return oResultFromDb.columns.ITEM_ID.rows[key] === 3001})[0];
				var iDbItemId3002 = Object.keys(oResultFromDb.columns.ITEM_ID.rows).filter(function(key) {return oResultFromDb.columns.ITEM_ID.rows[key] === 3002})[0];
				var iDbItemId3003 = Object.keys(oResultFromDb.columns.ITEM_ID.rows).filter(function(key) {return oResultFromDb.columns.ITEM_ID.rows[key] === 3003})[0];
				expect(oResultFromDb.columns.CUST_ROLLUP_CURRENCY_UNIT.rows[iDbItemId3001]).toBe("USD");
				expect(oResultFromDb.columns.CUST_ROLLUP_CURRENCY_UNIT.rows[iDbItemId3002]).toBe("USD");
				expect(oResultFromDb.columns.CUST_ROLLUP_CURRENCY_UNIT.rows[iDbItemId3003]).toBe("EUR");

				// Check results from response
				var oItemIDs = oResponseObject.body.calculated.ITEM_CALCULATED_FIELDS_COMPRESSED.ITEM_ID;
				var itemId3001 = Object.keys(oItemIDs).filter(function(key) {return oItemIDs[key] === 3001})[0];
				var itemId3002 = Object.keys(oItemIDs).filter(function(key) {return oItemIDs[key] === 3002})[0];
				var itemId3003 = Object.keys(oItemIDs).filter(function(key) {return oItemIDs[key] === 3003})[0];
				expect(oResponseObject.body.calculated.ITEM_CALCULATED_FIELDS_COMPRESSED.CUST_ROLLUP_CURRENCY_UNIT[itemId3001]).toBe("USD");
				expect(oResponseObject.body.calculated.ITEM_CALCULATED_FIELDS_COMPRESSED.CUST_ROLLUP_CURRENCY_UNIT[itemId3002]).toBe("USD");
				expect(oResponseObject.body.calculated.ITEM_CALCULATED_FIELDS_COMPRESSED.CUST_ROLLUP_CURRENCY_UNIT[itemId3003]).toBe("EUR");
			});
			it("should add the currency units for the custom fields with the calculated values from AFL when results are not compressed", function() {
				// arrange
				var oModifiedCalcVersion = {
					CALCULATION_ID: oModifiedCalculationVersion1.CALCULATION_ID,
					CALCULATION_VERSION_ID: oModifiedCalculationVersion1.CALCULATION_VERSION_ID,
					CALCULATION_VERSION_NAME: oModifiedCalculationVersion1.CALCULATION_VERSION_NAME,
					COMPONENT_SPLIT_ID: oModifiedCalculationVersion1.COMPONENT_SPLIT_ID,
					CUSTOMER_ID: oModifiedCalculationVersion1.CUSTOMER_ID,
					END_OF_PRODUCTION: oModifiedCalculationVersion1.END_OF_PRODUCTION,
					REPORT_CURRENCY_ID: "USD",
					EXCHANGE_RATE_TYPE_ID: oModifiedCalculationVersion1.EXCHANGE_RATE_TYPE_ID,
					ROOT_ITEM_ID: oModifiedCalculationVersion1.ROOT_ITEM_ID,
					SALES_PRICE_CURRENCY_ID: oModifiedCalculationVersion1.SALES_PRICE_CURRENCY_ID,
					SALES_DOCUMENT: oModifiedCalculationVersion1.SALES_DOCUMENT,
					START_OF_PRODUCTION: oModifiedCalculationVersion1.START_OF_PRODUCTION,
					VALUATION_DATE: oModifiedCalculationVersion1.VALUATION_DATE,
					MATERIAL_PRICE_STRATEGY_ID: oModifiedCalculationVersion1.MATERIAL_PRICE_STRATEGY_ID,
					ACTIVITY_PRICE_STRATEGY_ID: oModifiedCalculationVersion1.ACTIVITY_PRICE_STRATEGY_ID,
				};
				oMockstar.clearTable("item_temporary_ext");
				oMockstar.insertTableData("item_temporary_ext",{
					"ITEM_ID" : [ 3001, 3002, 3003 ],
					"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809 ],
					"CUST_ROLLUP_CURRENCY_MANUAL":[null, null, 10],
			    	"CUST_ROLLUP_CURRENCY_CALCULATED":[10, 10, null],
			    	"CUST_ROLLUP_CURRENCY_UNIT":["USD", "USD", "EUR"],
					"CUST_ROLLUP_CURRENCY_IS_MANUAL":[0, 0, 1],
					"SESSION_ID":["TEST_USER_1", "TEST_USER_1", "TEST_USER_1"]
				});

				// act
				var oRequest = buildUpdateRequest([ oModifiedCalcVersion ], false, false, true);
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// Check results from DB
				var oResultFromDb = oMockstar.execQuery(`SELECT "ITEM_ID", "CUST_ROLLUP_CURRENCY_UNIT" FROM {{item_temporary_ext}} WHERE CALCULATION_VERSION_ID = 2809`);
				var iDbItemId3001 = Object.keys(oResultFromDb.columns.ITEM_ID.rows).filter(function(key) {return oResultFromDb.columns.ITEM_ID.rows[key] === 3001})[0];
				var iDbItemId3002 = Object.keys(oResultFromDb.columns.ITEM_ID.rows).filter(function(key) {return oResultFromDb.columns.ITEM_ID.rows[key] === 3002})[0];
				var iDbItemId3003 = Object.keys(oResultFromDb.columns.ITEM_ID.rows).filter(function(key) {return oResultFromDb.columns.ITEM_ID.rows[key] === 3003})[0];
				expect(oResultFromDb.columns.CUST_ROLLUP_CURRENCY_UNIT.rows[iDbItemId3001]).toBe("USD");
				expect(oResultFromDb.columns.CUST_ROLLUP_CURRENCY_UNIT.rows[iDbItemId3002]).toBe("USD");
				expect(oResultFromDb.columns.CUST_ROLLUP_CURRENCY_UNIT.rows[iDbItemId3003]).toBe("EUR");

				// Check results from response
				var oItems = oResponseObject.body.calculated.ITEM_CALCULATED_FIELDS;
				var oItemWithId3001 = _.filter(oItems, oItem => { return oItem.ITEM_ID === 3001; });
				var oItemWithId3002 = _.filter(oItems, oItem => { return oItem.ITEM_ID === 3002; });
				var oItemWithId3003 = _.filter(oItems, oItem => { return oItem.ITEM_ID === 3003; });
				expect(oItemWithId3001[0].CUST_ROLLUP_CURRENCY_UNIT).toBe("USD");
				expect(oItemWithId3002[0].CUST_ROLLUP_CURRENCY_UNIT).toBe("USD");
				expect(oItemWithId3003[0].CUST_ROLLUP_CURRENCY_UNIT).toBe("EUR");
			});
		}

		it('should update CalculationVersion for new valuation date --> calculationVersion updated and response contains entire calc version and masterdata price components', function() {
			// arrange
			oModifiedCalculationVersion1.VALUATION_DATE = "2012-08-20";

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//check if response contains calculation version with items
			expect(_.isObject(oResponseObject)).toBe(true);
			expect(_.isObject(oResponseObject.body)).toBe(true);
			expect(_.isObject(oResponseObject.body.transactionaldata)).toBe(true);
			expect(oResponseObject.body.transactionaldata.length).toEqual(1);
			expect(oResponseObject.body.transactionaldata[0].ITEMS).toBeDefined();
			expect(oResponseObject.body.masterdata.PRICE_COMPONENT_ENTITIES).toBeDefined();
			expect(oResponseObject.body.masterdata.ACCOUNT_ENTITIES).toBeDefined();

			//check response for updated valuation date
			expect(new Date(oResponseObject.body.transactionaldata[0].VALUATION_DATE).getTime()).toEqual(new Date(oModifiedCalculationVersion1.VALUATION_DATE).getTime());

			//check database for updated valuation date
			var result = oMockstar.execQuery("select valuation_date from {{calculation_version_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID + " AND session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			expect(result.columns).toBeDefined();
			expect(result.columns.VALUATION_DATE).toBeDefined();
			expect(result.columns.VALUATION_DATE.rows[0]).toBeDefined();
			expect(result.columns.VALUATION_DATE.rows[0].getTime()).toEqual(new Date(oModifiedCalculationVersion1.VALUATION_DATE).getTime());

			//custom fields should be contained in ITEMS
			if(jasmine.plcTestRunParameters.generatedFields === true){
    			expect(oResponseObject.body.transactionaldata[0].ITEMS).toMatchData(oExpectedCustObject,["ITEM_ID"]);
			}
		});

		it('should not call valuation update methodes if no new valuation date was sent --> response contains no calc version', function() {
			// arrange
			spyOn(oCtx.persistency.CalculationVersion, "triggerPriceDetermination").and.callThrough();

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersValuationDateUnchanged ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oCtx.persistency.CalculationVersion.triggerPriceDetermination).not.toHaveBeenCalled();
		});

		it('should update CalculationVersion for reset masterdata timestamp --> calculationVersion updated and response contains entire calc version', function() {
			// arrange
			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);
			oRequest.parameters.push({
				"name" : "updateMasterdataTimestamp",
				"value" : "true"
			});

			//get current masterdata timestamp of calculation version
			var old_master_data_timestamp = oMockstar.execQuery("select master_data_timestamp from {{calculation_version_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID + " AND session_id='" + sSessionId + "'")
					.columns.MASTER_DATA_TIMESTAMP.rows[0];

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//check if response contains calculation version with items
			expect(_.isObject(oResponseObject)).toBe(true);
			expect(_.isObject(oResponseObject.body)).toBe(true);
			expect(_.isObject(oResponseObject.body.transactionaldata)).toBe(true);
			expect(oResponseObject.body.transactionaldata.length).toEqual(1);
			expect(oResponseObject.body.transactionaldata[0].ITEMS).toBeDefined();

			//check response for updated masterdata timestamp
			expect(new Date(oResponseObject.body.transactionaldata[0].MASTER_DATA_TIMESTAMP).getTime()).not.toEqual(old_master_data_timestamp.getTime());

			//check database for updated masterdata timestamp
			var result = oMockstar.execQuery("select master_data_timestamp from {{calculation_version_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID + " AND session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			expect(result.columns).toBeDefined();
			expect(result.columns.MASTER_DATA_TIMESTAMP).toBeDefined();
			expect(result.columns.MASTER_DATA_TIMESTAMP.rows[0]).toBeDefined();
			expect(result.columns.MASTER_DATA_TIMESTAMP.rows[0].getTime()).not.toEqual(old_master_data_timestamp.getTime());

			//custom fields should be contained in ITEMS
			if(jasmine.plcTestRunParameters.generatedFields === true){
				expect(oResponseObject.body.transactionaldata[0].ITEMS).toMatchData(oExpectedCustObject,["ITEM_ID"]);
			}
			
			//check if component split temporary data has been deleted
			var oComponentSplitTempCount = oMockstar.execQuery("select count(*) as COUNT from {{referenced_version_component_split_temporary}} where MASTER_CALCULATION_VERSION_ID="
					+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID + " AND SESSION_ID='" + sSessionId + "'");
			expect(parseInt(oComponentSplitTempCount.columns.COUNT.rows[0],10)).toBe(0);
			
		});
		
		it('should update masterdata, for item category variable item it should not change description when material is set', function() {
			// arrange
			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);
			oRequest.parameters.push({
				"name" : "updateMasterdataTimestamp",
				"value" : "true"
			});
			
			var oItemsTemporaryClone = _.cloneDeep(testData.oItemTemporaryTestData);
			oItemsTemporaryClone.ITEM_DESCRIPTION = [ "test1", "test2", "test3", "test4", "test5"];
			oItemsTemporaryClone.ITEM_CATEGORY_ID = [ 1, 2, 6, 4, 5];
			oItemsTemporaryClone.MATERIAL_ID = ['', 'MAT1', 'MAT2', 'MAT3', 'MAT4'];
			oMockstar.clearTable("item_temporary");
			oMockstar.insertTableData("item_temporary",oItemsTemporaryClone);
			oMockstar.insertTableData("material", testData.oMaterialTestDataPlc);
	

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			
			//check database for updated masterdata timestamp
			var result = oMockstar.execQuery("select item_id, item_description from {{item_temporary}} where session_id='" + sSessionId + "'");
			expect(result).toMatchData({
										"ITEM_ID":[ 3001, 3002, 3003, 5001, 7001 ],
										"ITEM_DESCRIPTION": [ "test1", null, null, "test4", "test5"]
								}, ["ITEM_ID"]);			
		});

		it('should not call valuation update methodes if no new valuation date was sent --> response contains no calc version', function() {
			// arrange
			spyOn(oCtx.persistency.CalculationVersion, "updateMasterdataTimestamp").and.callThrough();

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oCtx.persistency.CalculationVersion.updateMasterdataTimestamp).not.toHaveBeenCalled();
		});
		
		it('should call valuation update methodes if customer id was changed', function() {
			// arrange
			var oModifiedCalculationVersion = _.cloneDeep(oModifiedCalculationVersion1);
			oModifiedCalculationVersion.CUSTOMER_ID = "C1";
			oMockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
			spyOn(oCtx.persistency.CalculationVersion, "triggerPriceDetermination").and.callThrough();

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oCtx.persistency.CalculationVersion.triggerPriceDetermination).toHaveBeenCalled();
		});
		
		it('should call valuation update methodes if customer id was changed and is temporary', function() {
			// arrange
			oMockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
			spyOn(oCtx.persistency.CalculationVersion, "triggerPriceDetermination").and.callThrough();

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1a]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oCtx.persistency.CalculationVersion.triggerPriceDetermination).toHaveBeenCalled();
		});

		it('should update CalculationVersion with validInput --> calculationVersion updated', function() {
			// arrange
			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);
			
			expect(oResponseObject.body.transactionaldata.length).toEqual(1);
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toEqual(oModifiedCalculationVersion1.CALCULATION_VERSION_ID);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toEqual(1);

			var result = oMockstar.execQuery("select calculation_version_id, calculation_version_name, costing_sheet_id "
					+ "from {{calculation_version_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1a.CALCULATION_VERSION_ID + " AND session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1a.CALCULATION_VERSION_ID ],
					CALCULATION_VERSION_NAME : [ oModifiedCalculationVersion1.CALCULATION_VERSION_NAME ],
					COSTING_SHEET_ID : [ oModifiedCalculationVersion1.COSTING_SHEET_ID ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'CALCULATION_VERSION_ID' ]);

			result = oMockstar.execQuery("select calculation_version_id, IS_DIRTY from {{item_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1a.CALCULATION_VERSION_ID + " AND session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			expectedResultJsonData = {
					CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1a.CALCULATION_VERSION_ID ],
					IS_DIRTY : [ 1 ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'CALCULATION_VERSION_ID' ]);
		});

		function testUpdateStatusIdFail(sErrornousStatusId, sExpectedErrorCode, sExpectedStatusCode) {

			oCalculationVersionStatusUpdate = [{
					CALCULATION_VERSION_ID : testData.iCalculationVersionId,
					CALCULATION_VERSION_NAME : "New Test 2809",
					STATUS_ID : sErrornousStatusId,
					CALCULATION_ID : 1408,
					CUSTOMER_ID: "",
					COSTING_SHEET_ID : testData.oCostingSheetTestData.COSTING_SHEET_ID[0],
					VALUATION_DATE : "2011-08-20",
					ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
					REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
					ACTIVITY_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[3],
					MATERIAL_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[2]
			}];

			// act
			var oRequest = buildUpdateRequest(oCalculationVersionStatusUpdate);
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe(sExpectedStatusCode);

			let response = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(response.head.messages.length).toBeGreaterThan(0);
			expect(response.head.messages[0].code).toBe(sExpectedErrorCode);

			let result = oMockstar.execQuery("select STATUS_ID from {{calculation_version_temporary}} where calculation_version_id=" + testData.iCalculationVersionId + " and session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			expect(result.columns).toBeDefined();
			expect(result.columns.STATUS_ID).toBeDefined();
			expect(result.columns.STATUS_ID.rows[0]).toBeDefined();
			expect(result.columns.STATUS_ID.rows[0]).toBeNull();
		}

		it("should throw STATUS_NOT_ACTIVE_ERROR if user tries to set a deactivated status", function() {

			testUpdateStatusIdFail("INACTIVE", MessageLibrary.Code.STATUS_NOT_ACTIVE_ERROR.code, $.net.http.INTERNAL_SERVER_ERROR);
		});

		it("should throw GENERAL_ENTITY_NOT_FOUND_ERROR if user tries to set a non existent status", function() {

			testUpdateStatusIdFail("NOTEXIST", MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, $.net.http.NOT_FOUND);
		});

		it("should throw GENERAL_VALIDATION_ERROR if user tries to set a status that does not match the masterdata regex", function() {

			testUpdateStatusIdFail("INVALID!!", MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code, $.net.http.INTERNAL_SERVER_ERROR);
		});

		it("should throw GENERAL_VALIDATION_ERROR if user tries to set a status that is lowercase", function() {

			testUpdateStatusIdFail("lowercase", MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code, $.net.http.INTERNAL_SERVER_ERROR);
		});

		it('should update calculation version status and save the calculation version', function() {
			// arrange
			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version}} WHERE calculation_version_id = " + testData.iCalculationVersionId + " AND calculation_version_name = 'New Test 2809'"));
			expect(oTableData.STATUS_ID[0]).toBeUndefined();
			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version_temporary}} WHERE calculation_version_id = " + testData.iCalculationVersionId + " AND session_id = '" + sSessionId + "'"));
			expect(oTableData.STATUS_ID[0]).toBeNull();

			oStatusUpdate = [{
				CALCULATION_VERSION_ID : testData.iCalculationVersionId,
				CALCULATION_VERSION_NAME : "New Test 2809",
				STATUS_ID : "ACTIVE",
				CALCULATION_ID : 1978,
				CUSTOMER_ID: "",
				COSTING_SHEET_ID : testData.oCostingSheetTestData.COSTING_SHEET_ID[0],
				VALUATION_DATE : "2011-08-20",
				ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
				REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
				ACTIVITY_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[3],
				MATERIAL_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[2]
			}];
			var oUpdateStatusRequest = buildUpdateRequest(oStatusUpdate);

			new Dispatcher(oCtx, oUpdateStatusRequest, oDefaultResponseMock).dispatch();
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);

			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version_temporary}} WHERE calculation_version_id = " + testData.iCalculationVersionId + " AND session_id = '" + sSessionId + "'"));
			expect(oTableData.STATUS_ID[0]).toBe("ACTIVE");

			var oCalculationVersionSave = [ {
    			"CALCULATION_VERSION_ID" : testData.iCalculationVersionId,
    			"CALCULATION_ID" : 1978,
    			"CALCULATION_VERSION_NAME" : "New Test 2809"
			} ]

			var oSaveCalculationVersionRequest = {
				queryPath : "calculation-versions",
				method : $.net.http.POST,
				parameters : [ {
								"name" : "action",
								"value" : "save"
							}],
				body : {
					asString : function() {
						return JSON.stringify(oCalculationVersionSave);
					}
				}
			};

			// act
			new Dispatcher(oCtx, oSaveCalculationVersionRequest, oDefaultResponseMock).dispatch();
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);

			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version}} WHERE calculation_version_id = " + testData.iCalculationVersionId + " AND calculation_version_name = 'New Test 2809'"));
			expect(oTableData.STATUS_ID[0]).toBe("ACTIVE");
		});

		it('should update calculation version status and use save-as option to save the calculation version -> new calculation version is created with the new status', function() {

			// arrange
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version}} WHERE calculation_version_id = " + testData.iCalculationVersionId + " AND calculation_version_name = 'New Test 2809'"));
			expect(oTableData.STATUS_ID[0]).toBeUndefined();
			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version_temporary}} WHERE calculation_version_id = " + testData.iCalculationVersionId + " AND session_id = '" + sSessionId + "'"));
			expect(oTableData.STATUS_ID[0]).toBeNull();

			oStatusUpdate = [{
				CALCULATION_VERSION_ID : testData.iCalculationVersionId,
				CALCULATION_VERSION_NAME : "New Test 2809",
				STATUS_ID : "ACTIVE",
				CALCULATION_ID : 1978,
				CUSTOMER_ID: "",
				COSTING_SHEET_ID : testData.oCostingSheetTestData.COSTING_SHEET_ID[0],
				VALUATION_DATE : "2011-08-20",
				ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
				REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
				ACTIVITY_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[3],
				MATERIAL_PRICE_STRATEGY_ID: testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[2]
			}];
			var oUpdateStatusRequest = buildUpdateRequest(oStatusUpdate);

			new Dispatcher(oCtx, oUpdateStatusRequest, oDefaultResponseMock).dispatch();
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);

			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version_temporary}} WHERE calculation_version_id = " + testData.iCalculationVersionId + " AND session_id = '" + sSessionId + "'"));
			expect(oTableData.STATUS_ID[0]).toBe("ACTIVE");

			var oCalculationVersionSave = [ {
    			"CALCULATION_VERSION_ID" : testData.iCalculationVersionId,
    			"CALCULATION_ID" : 1978,
    			"CALCULATION_VERSION_NAME" : "New Test 1111"
			} ]

			var oSaveCalculationVersionRequest = {
				queryPath : "calculation-versions",
				method : $.net.http.POST,
				parameters : [ {
								"name" : "action",
								"value" : "save-as"
							}],
				body : {
					asString : function() {
						return JSON.stringify(oCalculationVersionSave);
					}
				}
			};

			// act
			new Dispatcher(oCtx, oSaveCalculationVersionRequest, oDefaultResponseMock).dispatch();
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata.length).toBe(1);
			var oResponseCalculation = oResponseObject.body.transactionaldata[0];

			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version}} WHERE calculation_version_id = " + oResponseCalculation.CALCULATION_VERSION_ID + " AND calculation_version_name = 'New Test 1111'"));
			expect(oTableData.STATUS_ID[0]).toBe("ACTIVE");
			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("SELECT STATUS_ID FROM {{calculation_version}} WHERE calculation_version_id = " + testData.iCalculationVersionId + " AND calculation_version_name = 'New Test 2809'"));
			expect(oTableData.STATUS_ID[0]).toBeUndefined();
		});

		it('should update prices for items when material price strategy has changed for calculation version', function() {
			// arrange
			oMockstar.clearTable("item_temporary");
			oMockstar.clearTable("item");

			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryPriceData);
			oMockstar.insertTableData("item", testData.oItemPriceData);
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTempPriceData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionPriceData);
			oMockstar.insertTableData("calculation", testData.oCalculationPriceData);
			oMockstar.insertTableData("project", testData.oProjectPriceData);
			oMockstar.insertTableData("material", testData.oMaterial);

			const oRequest = buildUpdateRequest([ oModifiedPriceStrategyCalculationVers ]);
			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();

			// assert
			expect(oResponseBody.body.transactionaldata.length).toBeGreaterThan(0);
			const oUpdatedItems = oMockstar.execQuery("select * from {{item_temporary}}");
			
			expect(oUpdatedItems.columns.PRICE_SOURCE_ID.rows[5]).toEqual(testData.oMaterialPriceDataPlc.PRICE_SOURCE_ID[3]);
			expect(oUpdatedItems.columns.PRICE_FIXED_PORTION.rows[5]).toEqual(testData.oMaterialPriceDataPlc.PRICE_FIXED_PORTION[3]);
			expect(oUpdatedItems.columns.PRICE_VARIABLE_PORTION.rows[5]).toEqual(testData.oMaterialPriceDataPlc.PRICE_VARIABLE_PORTION[3]);

			expect(oUpdatedItems.columns.PRICE_SOURCE_ID.rows[6]).toEqual(testData.oPriceSourceTestDataPlc1.PRICE_SOURCE_ID[12]);
			expect(oUpdatedItems.columns.PRICE_FIXED_PORTION.rows[6]).toEqual(null);
			expect(oUpdatedItems.columns.PRICE_VARIABLE_PORTION.rows[6]).toEqual(null);
		});

		it('should update prices for items when activity price strategy has changed for calculation version', function() {
			// arrange
			oMockstar.clearTable("item_temporary");
			oMockstar.clearTable("item");

			oModifiedPriceStrategyCalculationVers.CALCULATION_VERSION_ID = testData.oCalculationVersionPriceData.CALCULATION_VERSION_ID[1];
			oModifiedPriceStrategyCalculationVers.CALCULATION_VERSION_NAME = testData.oCalculationVersionPriceData.CALCULATION_VERSION_ID[1];
			oModifiedPriceStrategyCalculationVers.ACTIVITY_PRICE_STRATEGY_ID = "PLC_STANDARD";
			oModifiedPriceStrategyCalculationVers.MATERIAL_PRICE_STRATEGY_ID = "PLC_TEST_ST_MAT";

			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryPriceData);
			oMockstar.insertTableData("item", testData.oItemPriceData);
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTempPriceData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionPriceData);
			oMockstar.insertTableData("calculation", testData.oCalculationPriceData);
			oMockstar.insertTableData("project", testData.oProjectPriceData);

			const oRequest = buildUpdateRequest([ oModifiedPriceStrategyCalculationVers ]);
			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();

			// assert
			expect(oResponseBody.body.transactionaldata.length).toBeGreaterThan(0);
			const oUpdatedItems = oMockstar.execQuery("select * from {{item_temporary}}");
			
			expect(oUpdatedItems.columns.PRICE_SOURCE_ID.rows[5]).toEqual(testData.oActivityPriceDataPlc.PRICE_SOURCE_ID[3]);
			expect(oUpdatedItems.columns.PRICE_FIXED_PORTION.rows[5]).toEqual(testData.oActivityPriceDataPlc.PRICE_FIXED_PORTION[3]);
			expect(oUpdatedItems.columns.PRICE_VARIABLE_PORTION.rows[5]).toEqual(testData.oActivityPriceDataPlc.PRICE_VARIABLE_PORTION[3]);

			expect(oUpdatedItems.columns.PRICE_SOURCE_ID.rows[6]).toEqual(testData.oPriceSourceTestDataPlc1.PRICE_SOURCE_ID[12]);
			expect(oUpdatedItems.columns.PRICE_FIXED_PORTION.rows[6]).toEqual(null);
			expect(oUpdatedItems.columns.PRICE_VARIABLE_PORTION.rows[6]).toEqual(null);
		});

		it('should update prices for items when activity and material price strategy has changed for calculation version', function() {
			// arrange
			oMockstar.clearTable("item_temporary");
			oMockstar.clearTable("item");

			oModifiedPriceStrategyCalculationVers.CALCULATION_VERSION_ID = testData.oCalculationVersionPriceData.CALCULATION_VERSION_ID[2];
			oModifiedPriceStrategyCalculationVers.CALCULATION_VERSION_NAME = testData.oCalculationVersionPriceData.CALCULATION_VERSION_NAME[2];
			oModifiedPriceStrategyCalculationVers.ACTIVITY_PRICE_STRATEGY_ID = "PLC_TEST_ST_ACT";
			oModifiedPriceStrategyCalculationVers.MATERIAL_PRICE_STRATEGY_ID = "PLC_TEST_ST_MAT";

			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryPriceData);
			oMockstar.insertTableData("item", testData.oItemPriceData);
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTempPriceData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionPriceData);
			oMockstar.insertTableData("calculation", testData.oCalculationPriceData);
			oMockstar.insertTableData("project", testData.oProjectPriceData);
			oMockstar.insertTableData("material", testData.oMaterial);

			const oRequest = buildUpdateRequest([ oModifiedPriceStrategyCalculationVers ]);
			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();

			// assert
			expect(oResponseBody.body.transactionaldata.length).toBeGreaterThan(0);
			const oUpdatedItems = oMockstar.execQuery("select * from {{item_temporary}}");
			
			expect(oUpdatedItems.columns.PRICE_SOURCE_ID.rows[5]).toEqual(testData.oActivityPriceDataPlc.PRICE_SOURCE_ID[0]);  
			expect(oUpdatedItems.columns.PRICE_FIXED_PORTION.rows[5]).toEqual(testData.oActivityPriceDataPlc.PRICE_FIXED_PORTION[0]);
			expect(oUpdatedItems.columns.PRICE_VARIABLE_PORTION.rows[5]).toEqual(testData.oActivityPriceDataPlc.PRICE_VARIABLE_PORTION[0]);

			expect(oUpdatedItems.columns.PRICE_SOURCE_ID.rows[4]).toEqual(testData.oMaterialPriceDataPlc.PRICE_SOURCE_ID[2]);      
			expect(oUpdatedItems.columns.PRICE_FIXED_PORTION.rows[4]).toEqual(testData.oMaterialPriceDataPlc.PRICE_FIXED_PORTION[2]);
			expect(oUpdatedItems.columns.PRICE_VARIABLE_PORTION.rows[4]).toEqual(testData.oMaterialPriceDataPlc.PRICE_VARIABLE_PORTION[2]);

			expect(oUpdatedItems.columns.PRICE_SOURCE_ID.rows[6]).toEqual(testData.oPriceSourceTestDataPlc1.PRICE_SOURCE_ID[12]);
			expect(oUpdatedItems.columns.PRICE_FIXED_PORTION.rows[6]).toEqual(null);
			expect(oUpdatedItems.columns.PRICE_VARIABLE_PORTION.rows[6]).toEqual(null);
		});
		
		it('should update (PUT) Manual Lifecycle versions when changing name and keep base version and lifecycle period', function() {
			// arrange
			oMockstar.clearTable("calculation_version_temporary");
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationLifecycleVersionTestData);
			// arrange
			const oRequest = buildUpdateRequest([ oModifiedManualLifecycleVersion ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			const queryResult = oMockstar.execQuery("select * from {{calculation_version_temporary}}");
			expect(queryResult.columns.BASE_VERSION_ID.rows[1]).toBe(testData.iCalculationVersionId);
			expect(queryResult.columns.LIFECYCLE_PERIOD_FROM.rows[1]).toBe(testData.oCalculationLifecycleVersionTestData.LIFECYCLE_PERIOD_FROM[1]);
		});

		it('should update (PUT) two CalculationVersions with validInput --> calculationVersions updated', function() {
			// arrange
			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1, oModifiedCalculationVersion2 ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);
			
			expect(oResponseObject.body.transactionaldata.length).toEqual(2);
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toEqual(oModifiedCalculationVersion1.CALCULATION_VERSION_ID);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toEqual(1);
			expect(oResponseObject.body.transactionaldata[1].CALCULATION_VERSION_ID).toEqual(oModifiedCalculationVersion2.CALCULATION_VERSION_ID);
			expect(oResponseObject.body.transactionaldata[1].IS_DIRTY).toEqual(1);
			
			var result = oMockstar.execQuery("select calculation_version_id, calculation_version_name, costing_sheet_id from "
					+ "{{calculation_version_temporary}} where (calculation_version_id=" + oModifiedCalculationVersion1.CALCULATION_VERSION_ID
					+ " OR calculation_version_id=" + oModifiedCalculationVersion2.CALCULATION_VERSION_ID + ") AND session_id='" + sSessionId
					+ "'");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1.CALCULATION_VERSION_ID,
					                           oModifiedCalculationVersion2.CALCULATION_VERSION_ID ],
					                           CALCULATION_VERSION_NAME : [ oModifiedCalculationVersion1.CALCULATION_VERSION_NAME,
					                                                        oModifiedCalculationVersion2.CALCULATION_VERSION_NAME ],
					                                                        COSTING_SHEET_ID : [ oModifiedCalculationVersion1.COSTING_SHEET_ID, oModifiedCalculationVersion2.COSTING_SHEET_ID ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'CALCULATION_VERSION_ID' ]);

			result = oMockstar.execQuery("select calculation_version_id, is_dirty from {{item_temporary}} where (calculation_version_id="
					+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID + " OR calculation_version_id="
					+ oModifiedCalculationVersion2.CALCULATION_VERSION_ID + ") AND session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			expectedResultJsonData = {
					CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1.CALCULATION_VERSION_ID,
					                           oModifiedCalculationVersion2.CALCULATION_VERSION_ID ],
					                           IS_DIRTY : [ 1, 1 ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'CALCULATION_VERSION_ID' ]);
		});

		it('should not update (PUT) CalculationVersion with invalid input as body --> Validation Exception', function() {
			// arrange
			var oRequest = buildUpdateRequest(oModifiedCalculationVersion1);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var result = oMockstar.execQuery("select calculation_version_id, calculation_version_name, costing_sheet_id from "
					+ "{{calculation_version_temporary}} " + "where calculation_version_id="
					+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID + " AND session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1.CALCULATION_VERSION_ID ],
					CALCULATION_VERSION_NAME : [ "Baseline Version1" ],
					COSTING_SHEET_ID : [ "COGM" ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'CALCULATION_VERSION_ID' ]);

			result = oMockstar.execQuery("select calculation_version_id, is_dirty from {{item_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID + " AND session_id = '" + sSessionId + "'");
			expect(result).toBeDefined();
			expectedResultJsonData = {
					CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1.CALCULATION_VERSION_ID ],
					IS_DIRTY : [ 0 ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'CALCULATION_VERSION_ID' ]);
		});

		it('should not update a calculation version with an invalid MATERIAL_PRICE_STRATEGY_ID', function() {
			// arrange
			const oInvalidMaterialPriceVersion = new TestDataUtility(oModifiedCalculationVersion1).build();
			oInvalidMaterialPriceVersion.MATERIAL_PRICE_STRATEGY_ID = "INVALID_PRICE";
			const oRequest = buildUpdateRequest([oInvalidMaterialPriceVersion]);

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();
			// assert
			expect(oResponseBody.head.messages.length).toBeGreaterThan(0);
			expect(oResponseBody.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
			expect(oResponseBody.head.messages[0].details.messageTextObj).toContain("MATERIAL_PRICE_STRATEGY_ID");
		});

		it('should not update a calculation version with an invalid ACTIVITY_PRICE_STRATEGY_ID', function() {
			// arrange
			const oInvalidActivityPriceVersion = new TestDataUtility(oModifiedCalculationVersion1).build();
			oInvalidActivityPriceVersion.ACTIVITY_PRICE_STRATEGY_ID = "INVALID_PRICE";
			const oRequest = buildUpdateRequest([oInvalidActivityPriceVersion]);

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();
			// assert
			expect(oResponseBody.head.messages.length).toBeGreaterThan(0);
			expect(oResponseBody.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
			expect(oResponseBody.head.messages[0].details.messageTextObj).toContain("ACTIVITY_PRICE_STRATEGY_ID");
		});

		it('should not update MATERIAL_PRICE_STRATEGY_ID on calculation version with a PRICE_DETERMINATION_STRATEGY_ID of type 2 (activity)', function() {
			// arrange
			const oInvalidMaterialPriceVersion = new TestDataUtility(oModifiedCalculationVersion1).build();
			oInvalidMaterialPriceVersion.MATERIAL_PRICE_STRATEGY_ID = testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[3];
			const oRequest = buildUpdateRequest([oInvalidMaterialPriceVersion]);

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();
			// assert
			expect(oResponseBody.head.messages.length).toBeGreaterThan(0);
			expect(oResponseBody.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
			expect(oResponseBody.head.messages[0].details.messageTextObj).toContain("MATERIAL_PRICE_STRATEGY_ID");
		});

		it('should not update ACTIVITY_PRICE_STRATEGY_ID on calculation version with a PRICE_DETERMINATION_STRATEGY_ID of type 1 (material)', function() {
			// arrange
			const oInvalidActivityPriceVersion = new TestDataUtility(oModifiedCalculationVersion1).build();
			oInvalidActivityPriceVersion.ACTIVITY_PRICE_STRATEGY_ID = testData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[2];
			const oRequest = buildUpdateRequest([oInvalidActivityPriceVersion]);
			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();
			// assert
			expect(oResponseBody.head.messages.length).toBeGreaterThan(0);
			expect(oResponseBody.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
			expect(oResponseBody.head.messages[0].details.messageTextObj).toContain("ACTIVITY_PRICE_STRATEGY_ID");
		});

		it('should not update MATERIAL_PRICE_STRATEGY_ID to null', function() {
			// arrange
			const oInvalidMaterialPriceVersion = new TestDataUtility(oModifiedCalculationVersion1).build();
			oInvalidMaterialPriceVersion.MATERIAL_PRICE_STRATEGY_ID = null;
			const oRequest = buildUpdateRequest([oInvalidMaterialPriceVersion]);

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();
			// assert
			expect(oResponseBody.head.messages.length).toBeGreaterThan(0);
			expect(oResponseBody.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
			expect(oResponseBody.head.messages[0].details.messageTextObj).toContain("MATERIAL_PRICE_STRATEGY_ID");
		});

		it('should not update ACTIVITY_PRICE_STRATEGY_ID to null', function() {
			// arrange
			const oInvalidActivityPriceVersion = new TestDataUtility(oModifiedCalculationVersion1).build();
			oInvalidActivityPriceVersion.ACTIVITY_PRICE_STRATEGY_ID = null;
			const oRequest = buildUpdateRequest([oInvalidActivityPriceVersion]);
			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
			const oResponseBody = oResponseStub.getParsedBody();
			// assert
			expect(oResponseBody.head.messages.length).toBeGreaterThan(0);
			expect(oResponseBody.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
			expect(oResponseBody.head.messages[0].details.messageTextObj).toContain("ACTIVITY_PRICE_STRATEGY_ID");
		});

		it('should update (PUT) CalculationVersion with read-only session --> calculationVersions updated',	function() {
			// arrange
			oMockstar.upsertTableData("open_calculation_versions", {
				SESSION_ID : [ sSessionId ],
				CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1.CALCULATION_VERSION_ID ],
				IS_WRITEABLE : [ 0 ]
			}, "SESSION_ID='" + testData.sSessionId + "' AND CALCULATION_VERSION_ID ="
			+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID);

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata.length).toEqual(1);
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toEqual(oModifiedCalculationVersion1.CALCULATION_VERSION_ID);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toEqual(1);
            
            /*
			expect(_.isObject(oResponseObject.head)).toBe(true);

			expect(_.isArray(oResponseObject.head.metadata.CalculationVersions)).toBe(true);
			expect(oResponseObject.head.metadata.CalculationVersions.length).toEqual(1);
			expect(oResponseObject.head.metadata.CalculationVersions[0].CALCULATION_VERSION_ID).toEqual(
					oModifiedCalculationVersion1.CALCULATION_VERSION_ID);
			expect(oResponseObject.head.metadata.CalculationVersions[0].IS_DIRTY).toEqual(1);
			*/

			var result = oMockstar
			.execQuery("select calculation_version_id, calculation_version_name, costing_sheet_id from {{calculation_version_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1a.CALCULATION_VERSION_ID + " AND session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1a.CALCULATION_VERSION_ID ],
					CALCULATION_VERSION_NAME : [ oModifiedCalculationVersion1.CALCULATION_VERSION_NAME ],
					COSTING_SHEET_ID : [ oModifiedCalculationVersion1.COSTING_SHEET_ID ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'CALCULATION_VERSION_ID' ]);

			result = oMockstar
			.execQuery("select calculation_version_id, is_dirty from {{item_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1a.CALCULATION_VERSION_ID + " AND session_id='" + sSessionId + "'");
			expect(result).toBeDefined();
			expectedResultJsonData = {
					CALCULATION_VERSION_ID : [ oModifiedCalculationVersion1a.CALCULATION_VERSION_ID ],
					IS_DIRTY : [ 1 ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'CALCULATION_VERSION_ID' ]);
		});

		it('should not update (PUT) a calculation-version with a duplicated name --> error returned', function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			// Create additional calculation version with duplicate name
			var oCvAlreadyExisting = {
					"CALCULATION_VERSION_ID" : 111,
					"CALCULATION_ID" : 1978,
					"CALCULATION_VERSION_NAME" : "Test",
					"ROOT_ITEM_ID" : 8001,
					"REPORT_CURRENCY_ID" : "EUR",
					"VALUATION_DATE" : "2015-01-01",
					"LAST_MODIFIED_ON" : "2015-01-01 00:05:00",
					"LAST_MODIFIED_BY" : "TestUser",
					"MASTER_DATA_TIMESTAMP" : "2015-01-01 00:05:00",
					"MATERIAL_PRICE_STRATEGY_ID": sStandardPriceStrategy,
					"ACTIVITY_PRICE_STRATEGY_ID": sStandardPriceStrategy
			};

			oMockstar.insertTableData("calculation_version", oCvAlreadyExisting);

			var oModifiedCalculationVersion = {
					CALCULATION_VERSION_ID : testData.iCalculationVersionId,
					CALCULATION_VERSION_NAME : "Test", // use duplicate name
					CALCULATION_ID : 1978,
					ROOT_ITEM_ID : 8001,
					REPORT_CURRENCY_ID : "EUR",
					VALUATION_DATE : "2015-01-01",
					MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy,
					ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy
			};

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion ]);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		});

		it('should update CalculationVersion for new report currency --> calculationVersion updated and all of the assambly items are updated', function() {
			// arrange
			oModifiedCalculationVersion1.REPORT_CURRENCY_ID = "USD";

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//check if TRANSACTION_CURRENCY_ID field for assembly items is updated in t_item_temporary
			var result = oMockstar.execQuery("select TRANSACTION_CURRENCY_ID from {{item_temporary}} where session_id = '" + testData.sSessionId +
					"' and calculation_version_id = " + testData.iCalculationVersionId + " and item_id = " + testData.oItemTemporaryTestData.ITEM_ID[0]);
			expect(result.columns.TRANSACTION_CURRENCY_ID.rows[0]).toEqual("USD");

			//check database for updated report currency
			var result = oMockstar.execQuery("select REPORT_CURRENCY_ID from {{calculation_version_temporary}} where calculation_version_id="
					+ oModifiedCalculationVersion1.CALCULATION_VERSION_ID + " AND session_id='" + testData.sSessionId + "'");
			expect(result.columns.REPORT_CURRENCY_ID.rows[0]).toEqual("USD");
		});

		it('should not call price transaction currency update method if no new report currency date was sent --> response contains no calc version', function() {
			// arrange
			spyOn(oCtx.persistency.Item, "setPriceTransactionCurrencyForAssemblyItems");

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oCtx.persistency.Item.setPriceTransactionCurrencyForAssemblyItems).not.toHaveBeenCalled();
		});
		
		it('should return an empty array for ITEMS if omitItems is set to true', function() {
			// arrange
			oModifiedCalculationVersion1.VALUATION_DATE = "2012-08-20";

			var oRequest = buildUpdateRequest([oModifiedCalculationVersion1], true);

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

			// assert
			expect(oResponseStub.status).toBe($.net.http.OK);
			const oResponseBody = oResponseStub.getParsedBody();
			expect(oResponseBody.body.transactionaldata[0].ITEMS).toEqual(aEmptyArray);
		});

		it('should return three ITEMS if omitItems is set to false', function() {
			// arrange
			oModifiedCalculationVersion1.VALUATION_DATE = "2012-08-20";

			var oRequest = buildUpdateRequest([oModifiedCalculationVersion1], false);

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

			// assert
			expect(oResponseStub.status).toBe($.net.http.OK);

			const oResponseBody = oResponseStub.getParsedBody();
				
			expect(oResponseBody.body.transactionaldata[0].ITEMS.length).toBe(3);
			expect(oResponseBody.body.transactionaldata[0].ITEMS).toMatchData({
				"ITEM_ID": [3001, 3002, 3003],
				"CALCULATION_VERSION_ID": [2809, 2809, 2809],
				"PARENT_ITEM_ID": [null, 3001, 3002],
				"PREDECESSOR_ITEM_ID": [null, 3001, 3002],
				"IS_ACTIVE": [1, 1, 1],
				"ITEM_CATEGORY_ID": [0, 1, 3],
				"ACCOUNT_ID": ["0", "0", "625000"],
				"DOCUMENT_TYPE_ID": [null, null, null],
				"DOCUMENT_ID": ["", "", ""],
				"QUANTITY": ["1.0000000", "1.0000000", "1.0000000"],
				"QUANTITY_UOM_ID": ["PC", "PC", "H"],
				"TOTAL_QUANTITY": ["1.0000000", "1.0000000", "1.0000000"],
				"TOTAL_QUANTITY_UOM_ID": ["PC", "PC", "H"],
				"TOTAL_QUANTITY_DEPENDS_ON": [1, 1, 1],
				"IS_RELEVANT_TO_COSTING_IN_ERP": [null, 1, null],
				"BASE_QUANTITY": ["1.0000000", "1.0000000", "1.0000000"],
				"TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR"],
				"PRICE_UNIT_IS_MANUAL": [0, 0, 1],
				"CONFIDENCE_LEVEL_ID": [null, null, null],
				"TARGET_COST_CURRENCY_ID": ["EUR", "EUR", "EUR"],
				"TOTAL_COST_PER_UNIT_FIXED_PORTION": ['13.0000000', '6.0000000', '6.0000000'],
				"TOTAL_COST_PER_UNIT_VARIABLE_PORTION": ['26.0000000', '3.0000000', '3.0000000'],
				"TOTAL_QUANTITY_OF_VARIANTS": ['10.0000000', '12.0000000', '13.0000000'],
				"TOTAL_COST_PER_UNIT": ['39.0000000', '9.0000000', '9.0000000']
			}, ["ITEM_ID", "CALCULATION_VERSION_ID"]);

		});

		it('should return an empty array for ITEMS if both omitItems and updateMasterdataTimestamp are set to true', function() {
			// arrange
			oModifiedCalculationVersion1.VALUATION_DATE = "2012-08-20";

			var oRequest = buildUpdateRequest([oModifiedCalculationVersion1], true);
			oRequest.parameters.push({
				"name": "updateMasterdataTimestamp",
				"value": "true"
			});

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

			// assert
			expect(oResponseStub.status).toBe($.net.http.OK);
			const oResponseBody = oResponseStub.getParsedBody();
			expect(oResponseBody.body.transactionaldata[0].ITEMS).toEqual(aEmptyArray);
		});
		
		it('should return the updated items in a compressed result if the valuation date is changed', function(){
		    oModifiedCalculationVersion1.VALUATION_DATE = "2012-08-20";

			var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ], false, true);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//check if response contains calculation version with items
			expect(_.isObject(oResponseObject)).toBe(true);
			expect(_.isObject(oResponseObject.body)).toBe(true);
			expect(_.isObject(oResponseObject.body.transactionaldata)).toBe(true);
			expect(oResponseObject.body.transactionaldata.length).toEqual(1);
			expect(oResponseObject.body.transactionaldata[0].ITEMS_COMPRESSED).toBeDefined();

			//check response for updated valuation date
			expect(new Date(oResponseObject.body.transactionaldata[0].VALUATION_DATE).getTime()).toEqual(new Date(oModifiedCalculationVersion1.VALUATION_DATE).getTime());
			
			//items should come in compressed mode
			const oResponseCv = oResponseObject.body.transactionaldata[0];
			expect(oResponseCv.ITEMS_COMPRESSED.ITEM_ID.length).toBe(3);
			
    		const oFields = _.pick(oResponseCv.ITEMS_COMPRESSED, ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID']);
        			    
    		expect(oFields).toMatchData(
    				   {'ITEM_ID': [3003, 3001, 3002],
    				   'PARENT_ITEM_ID': [3002, null, 3001],
    		  		   'PREDECESSOR_ITEM_ID': [3002, null, 3001]
    				   }, ['ITEM_ID']);
			
		});

		const parametersCostingSheetTotals = [
			{ description: "should update (PUT) a calculation-version with SELECTED_TOTAL_COSTING_SHEET=TOTAL_COST", property: "SELECTED_TOTAL_COSTING_SHEET", input: "TOTAL_COST", result: true },
			{ description: "should update (PUT) a calculation-version with SELECTED_TOTAL_COSTING_SHEET=TOTAL_COST2", property: "SELECTED_TOTAL_COSTING_SHEET", input: "TOTAL_COST2", result: true },
			{ description: "should update (PUT) a calculation-version with SELECTED_TOTAL_COSTING_SHEET=TOTAL_COST3", property: "SELECTED_TOTAL_COSTING_SHEET", input: "TOTAL_COST3", result: true },
			{ description: "should update (PUT) a calculation-version with SELECTED_TOTAL_COMPONENT_SPLIT=TOTAL_COST", property: "SELECTED_TOTAL_COMPONENT_SPLIT", input: "TOTAL_COST", result: true },
			{ description: "should update (PUT) a calculation-version with SELECTED_TOTAL_COMPONENT_SPLIT=TOTAL_COST2", property: "SELECTED_TOTAL_COMPONENT_SPLIT", input: "TOTAL_COST2", result: true },
			{ description: "should update (PUT) a calculation-version with SELECTED_TOTAL_COMPONENT_SPLIT=TOTAL_COST3", property: "SELECTED_TOTAL_COMPONENT_SPLIT", input: "TOTAL_COST3", result: true },
			{ description: "should NOT update (PUT) a calculation-version with SELECTED_TOTAL_COSTING_SHEET invalid", property: "SELECTED_TOTAL_COSTING_SHEET", input: "TOTAL_tt", result: false, msg: "Property SELECTED_TOTAL_COSTING_SHEET has an invalid value" },
			{ description: "should NOT update (PUT) a calculation-version with SELECTED_TOTAL_COMPONENT_SPLIT invalid", property: "SELECTED_TOTAL_COMPONENT_SPLIT", input: "dasdad", result: false, msg: "Property SELECTED_TOTAL_COMPONENT_SPLIT has an invalid value" },]

		parametersCostingSheetTotals.forEach((p) => {
			it(p.description, function () {

				oModifiedCalculationVersion1[p.property] = p.input;

				var oRequest = buildUpdateRequest([oModifiedCalculationVersion1]);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				if (p.result) {
					expect(oDefaultResponseMock.status).toBe($.net.http.OK);
					expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				}
				else {
					const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
					expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_VALIDATION_ERROR.code)
					expect(oResponseObject.head.messages.length).toBe(1);
					expect(oResponseObject.head.messages[0].details.messageTextObj).toBe(p.msg);
				}
			});
		});

		const parametersCostingSheetTotalsReset = [
			{ description: "should default SELECTED_TOTAL_COSTING_SHEET to TOTAL_COST if costing sheet changes",property:"COSTING_SHEET_ID", tProperty: "SELECTED_TOTAL_COSTING_SHEET", input: "COGSL"},
			{ description: "should default SELECTED_TOTAL_COSTING_SHEET to TOTAL_COST if costing sheet is null",property:"COSTING_SHEET_ID", tProperty: "SELECTED_TOTAL_COSTING_SHEET", input: null },			
			{ description: "should default SELECTED_TOTAL_COMPONENT_SPLIT to TOTAL_COST if component split changes",property:"COMPONENT_SPLIT_ID", tProperty: "SELECTED_TOTAL_COMPONENT_SPLIT", input: "2"},
			{ description: "should default SELECTED_TOTAL_COMPONENT_SPLIT to TOTAL_COST if costing sheet is null",property:"COMPONENT_SPLIT_ID", tProperty: "SELECTED_TOTAL_COMPONENT_SPLIT", input: null }]			
		
			parametersCostingSheetTotalsReset.forEach((p) => {
		it(p.description, function(){			

			// arrange			
			oMockstar.execSingle("insert into {{costing_sheet}}  values ('COGSL','1000',0,0,'2015-01-01T00:00:00.000Z',null,1,'U000001')");
			oMockstar.execSingle("insert into {{component_split}}  values ('2','1000','2015-01-01T00:00:00.000Z',null,1,'U000001')");
			oMockstar.execSingle(`update {{calculation_version_temporary}} set ${p.tProperty} = '${Constants.CalculationVersionCostingSheetTotals[2]}' where calculation_version_id=${testData.iCalculationVersionId}`);			

			if (p.input === null)	{
               delete oModifiedCalculationVersion1[p.property];
			}
			else {
				oModifiedCalculationVersion1[p.property] = p.input;
			}
			oRequest = buildUpdateRequest([oModifiedCalculationVersion1]);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
		    expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0])
			expect(oResponseObject.body.transactionaldata[0][p.tProperty]).toBe(Constants.CalculationVersionCostingSheetTotals[0]);
		});
	});
	
	it("should default SELECTED_TOTAL_COSTING_SHEET and SELECTED_TOTAL_COMPONENT_SPLIT to TOTAL_COST on update master data", function(){			

		// arrange		
		oMockstar.execSingle(`update {{calculation_version_temporary}} set SELECTED_TOTAL_COSTING_SHEET = '${Constants.CalculationVersionCostingSheetTotals[2]}', 
		SELECTED_TOTAL_COMPONENT_SPLIT = '${Constants.CalculationVersionCostingSheetTotals[2]}'
		 where calculation_version_id=${testData.iCalculationVersionId}`);

		 var oRequest = buildUpdateRequest([ oModifiedCalculationVersion1 ]);
		 oRequest.parameters.push({
			 "name" : "updateMasterdataTimestamp",
			 "value" : "true"
		 });
		
		 // act
		new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
		// assert
		expect(oDefaultResponseMock.status).toBe($.net.http.OK);
		expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0])
		expect(oResponseObject.body.transactionaldata[0].SELECTED_TOTAL_COSTING_SHEET).toBe(Constants.CalculationVersionCostingSheetTotals[0]);
		expect(oResponseObject.body.transactionaldata[0].SELECTED_TOTAL_COMPONENT_SPLIT).toBe(Constants.CalculationVersionCostingSheetTotals[0]);
	});
});

	describe('Closing Calculation Versions', function() {

		afterOnce(function() {
			oMockstar.cleanup(); // clean up all test artefacts
		});

		beforeEach(function() {
			oMockstar.clearAllTables(); // clear all specified substitute tables and views

			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;

			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
			}
			oMockstar.insertTableData("calculation_version_temporary", testData.ocalculation_version_temporaryTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
			oMockstar.insertTableData("session", testData.oSessionTestData);
			oMockstar.insertTableData("tag", testData.oTagTestData);
			oMockstar.insertTableData("entity_tags", testData.oEntityTagsTestData);

			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);

			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
		});

		function buildCloseRequest() {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "action",
				"value" : "close"
			}, {
				"name" : "calculate",
				"value" : "false"
			} , {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
				"name" : "compressedResult",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				if (sArgument === "calculate") {
					return "false";
				}
				if (sArgument === "id") {
					return undefined;
				}
				if (sArgument === "loadMasterdata") {
					return "false";
				}
				if (sArgument === "compressedResult") {
					return "false";
				}
				return "close";
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify([ {
								CALCULATION_VERSION_ID : testData.iCalculationVersionId,
							}, {
								CALCULATION_VERSION_ID : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1],
							} ]);
						}
					}
			};
			return oRequest;
		}

		afterEach(function() {
		});

		it('should close a calculation version if calculation version is single and calculation version and session are correct', function() {
			// arrange
			var oRequest = buildCloseRequest();
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkRowCount(0, "open_calculation_versions");
			checkRowCount(0, "open_calculation_versions", testData.iCalculationVersionId, testData.sSessionId);
			checkRowCount(89, "item_temporary");
			checkRowCount(0, "item_temporary", testData.iCalculationVersionId, testData.sSessionId);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				checkRowCount(89, "item_temporary_ext");
				checkRowCount(0, "item_temporary_ext", testData.iCalculationVersionId, testData.sSessionId);
			}
			checkRowCount(2, "calculation_version_temporary");
			checkRowCount(0, "calculation_version_temporary", testData.iCalculationVersionId, testData.sSessionId);
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		});

		it('should delete the variants from a calculation version that was never saved (only existed in the temporary table)', function() {
			// arrange
			oMockstar.clearAllTables();
			const oVariantTestData = new TestDataUtility(testData.oVariantTestData).getObject(0);
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("variant", new TestDataUtility(oVariantTestData).build());
			oMockstar.insertTableData("variant_item", new TestDataUtility(testData.oVariantItemTestData).build());
			var oRequest = buildCloseRequest();
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkRowCount(0, "variant");
		});

		it('should delete the tag relations from a calculation version that was never saved (only existed in the temporary table)', function() {
			// arrange
			oMockstar.clearAllTables();
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			var oRequest = buildCloseRequest();
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oCheckEntityTagsAfterSave = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + testData.iCalculationVersionId + " and entity_type = 'V'");
			expect(oCheckEntityTagsAfterSave.columns.TAG_ID.rows.length).toBe(0);

		});

		it('should not delete the tag relations from a calculation version that was saved before', function() {
			// arrange

			oMockstar.clearTable("calculation_version");
			oMockstar.clearTable("calculation_version_temporary");
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			var oRequest = buildCloseRequest();
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oCheckEntityTagsAfterCloseWithoutSave = oMockstar.execQuery("select * from {{entity_tags}}");
            expect(oCheckEntityTagsAfterCloseWithoutSave).toMatchData(
                    {
                        "TAG_ID" : [1, 2],
                        "ENTITY_TYPE" : ["V", "C"],
                        "ENTITY_ID" : [testData.iCalculationVersionId, testData.iCalculationId]
                    } , ["TAG_ID", "ENTITY_TYPE", "ENTITY_ID"]);

		});

		it('should not close the calculation version if invalid calculation version id and sessionId', function() {
			// arrange
			var oRequest = buildCloseRequest();
			oRequest.body = {
					asString : function() {
						return JSON.stringify([ {
							CALCULATION_VERSION_ID : 4711,
						} ]);
					}
			};
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkRowCount(1, "open_calculation_versions");
			checkRowCount(1, "open_calculation_versions", testData.iCalculationVersionId, testData.sSessionId);
			checkRowCount(5, "item_temporary");
			checkRowCount(3, "item_temporary", testData.iCalculationVersionId, testData.sSessionId);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				checkRowCount(5, "item_temporary_ext");
				checkRowCount(3, "item_temporary_ext", testData.iCalculationVersionId, testData.sSessionId);
			}
			checkRowCount(3, "calculation_version_temporary");
			checkRowCount(1, "calculation_version_temporary", testData.iCalculationVersionId, testData.sSessionId);
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		});

		it('should close the version based of context calculation_version and not remove lock on variants (context: variant_matrix)', function() {
			// arrange
			const oOpenVariantData = {
            	"SESSION_ID" : [ sSessionId ],
            	"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId],
            	"CONTEXT" : [ Constants.CalculationVersionLockContext.VARIANT_MATRIX],
            	"IS_WRITEABLE" : [ 1]
            };
			oMockstar.insertTableData("open_calculation_versions", oOpenVariantData);
			checkRowCount(2, "open_calculation_versions", testData.iCalculationVersionId, testData.sSessionId);
			var oRequest = buildCloseRequest();
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			checkRowCount(1, "open_calculation_versions", testData.iCalculationVersionId, testData.sSessionId);
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		});

		function checkRowCount(iExpectedCount, sTableId, iCalculationVersionId, sSessionId) {
			var result = null;
			if (iCalculationVersionId === undefined || sSessionId === undefined) {
				result = oMockstar.execQuery("SELECT COUNT(*) AS COUNT FROM {{" + sTableId + "}}");
			} else {
				result = oMockstar.execQuery("SELECT COUNT(*) AS COUNT FROM {{" + sTableId + "}} WHERE session_id = '" + sSessionId
						+ "' AND calculation_version_id = " + iCalculationVersionId);
			}

			expect(result).toBeDefined;
			var expectedResultJsonData = {
					COUNT : [ iExpectedCount ]
			};
			expect(expectedResultJsonData).toMatchData(expectedResultJsonData, [ 'COUNT' ]);
		}
	});

	describe('Deleting Calculation Versions', function() {

		var testPackage = $.session.getUsername().toLowerCase();
		var iCalculationVersionId = 2809;
		var iCalculationId = 1978;
		var sSessionId = testData.sSessionId;
		var sSecondSessionId = testData.sSecondSessionId;
		var oRequest = null;
		var oResponse = null;

		beforeEach(function() {
			oMockstar.clearAllTables(); // clear all specified substitute tables and views
			oMockstar.insertTableData("item", testData.oItemTestData);
			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_ext", testData.oItemExtData);
				oMockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
			}
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("session", testData.oSessionTestData);
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
			oMockstar.insertTableData("lifecycle_period_value", testData.oLifecyclePeriodValues);
			oMockstar.insertTableData("variant", new TestDataUtility (testData.oVariantTestData).build());
			oMockstar.insertTableData("variant_item", new TestDataUtility (testData.oVariantItemTestData).build());
			oMockstar.insertTableData("tag", testData.oTagTestData);
			oMockstar.insertTableData("entity_tags", testData.oEntityTagsTestData);

			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.FULL_EDIT);

			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;

			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
		});

		function buildDeleteRequest(iCalculationVersionId) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [];
			params.get = function() {
				return "false";
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.DEL,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify([ {
								CALCULATION_VERSION_ID : iCalculationVersionId
							} ]);
						}
					}
			};
			return oRequest;
		}
		
		/**
		 * Adds a second calculation version to the calculation of the version under test. Otherwise the test version cannot be deleted if it is single under calculation. 
		 */
		function addSecondCalculationVersion() {
			oMockstar.clearTable("calculation");
			// Adjustment of test data as Authorization Manager to return an instance based-privilege.
			oMockstar.insertTableData("calculation", {
				"CALCULATION_ID" : [ iCalculationId ],
				"PROJECT_ID" : [ "PR1" ],
				"CALCULATION_NAME" : [ "Test Calculation" ],
				"CURRENT_CALCULATION_VERSION_ID" : [ 5809 ],
				"CREATED_ON" : [ testData.sExpectedDate ],
				"CREATED_BY" : [ testData.sTestUser ],
				"LAST_MODIFIED_ON" : [ testData.sExpectedDate ],
				"LAST_MODIFIED_BY" : [ testData.sTestUser ]
			});

			// Add another calculation version under the calculation of the version that has to be deleted.
			// In this way the version to be deleted will not be the single version under its parent calculation.
			oMockstar.execSingle("update {{calculation_version}} set calculation_id = " + iCalculationId + " where calculation_version_id=5809");
		}

		it('should delete a calculation version with valid calculation version id and return 200 OK', function() {
			// arrange
			addSecondCalculationVersion();

			let iOriginalCount_CalculationVersion = mockstart_helpers.getRowCount(oMockstar, "calculation_version");
			let iOriginalCount_ItemAll = mockstart_helpers.getRowCount(oMockstar, "item");
			let iOriginalCount_ItemCalcVersion = mockstart_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + iCalculationVersionId);
			let iOriginalCount_TotalQuantities = mockstart_helpers.getRowCount(oMockstar, "project_lifecycle_configuration");
			let iOriginalCount_TotalQuantitiesValues = mockstart_helpers.getRowCount(oMockstar, "lifecycle_period_value");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var iOriginalCount_ItemExtAll = mockstart_helpers.getRowCount(oMockstar, "item_ext");
				var iOriginalCount_ItemExtCalcVersion = mockstart_helpers.getRowCount(oMockstar, "item_ext", "calculation_version_id=" + iCalculationVersionId);
			}

			var oCheckEntityTagsExists = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = 2809 and entity_type = 'V'");
			expect(oCheckEntityTagsExists.columns.TAG_ID.rows[0]).toBe(1);

			var oRequest = buildDeleteRequest(testData.iCalculationVersionId);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id=" + iCalculationVersionId)).toBe(0);
			expect(mockstart_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + iCalculationVersionId)).toBe(0);

			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version")).toBe(iOriginalCount_CalculationVersion - 1);
			expect(mockstart_helpers.getRowCount(oMockstar, "item")).toBe(iOriginalCount_ItemAll - iOriginalCount_ItemCalcVersion);
			// check if calculation version total quantity and associated values are deleted
			expect(mockstart_helpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
		    expect(mockstart_helpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				expect(mockstart_helpers.getRowCount(oMockstar, "item_ext", "calculation_version_id=" + iCalculationVersionId)).toBe(0);
				expect(mockstart_helpers.getRowCount(oMockstar, "item_ext")).toBe(iOriginalCount_ItemExtAll - iOriginalCount_ItemExtCalcVersion);
			}

			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oDeletedEntityTags = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = 2809 and entity_type = 'V'");
			expect(oDeletedEntityTags.columns.TAG_ID.rows.length).toBe(0);

		});
		it("should not delete the generated versions when deleting their base version", () => {
				// arrange
				addSecondCalculationVersion();

				// insert a version of type generated version
				const iBaseVersionId = testData.iCalculationVersionId;
				const iGeneratedVersionId = 99999;
				const oGeneratedCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
				oGeneratedCalculationVersion.CALCULATION_VERSION_ID = iGeneratedVersionId;
				oGeneratedCalculationVersion.CALCULATION_VERSION_TYPE = 8;
				oGeneratedCalculationVersion.CALCULATION_VERSION_NAME = "Generated";
				oGeneratedCalculationVersion.BASE_VERSION_ID = iBaseVersionId;
				oMockstar.insertTableData("calculation_version", oGeneratedCalculationVersion);

				const oGeneratedVersionItems = mockstart_helpers.convertToObject(testData.oItemTestData, 0);
				oGeneratedVersionItems.CALCULATION_VERSION_ID = iGeneratedVersionId;
				oMockstar.insertTableData("item", oGeneratedVersionItems);

				const iAllVersionsBefore = mockstart_helpers.getRowCount(oMockstar, "calculation_version");
				const iAllItemsBefore = mockstart_helpers.getRowCount(oMockstar, "item");
				const iAllDeletedVersionItemsBefore = mockstart_helpers.getRowCount(oMockstar, "item", `calculation_version_id=${  iBaseVersionId}`);
				const iAllGeneratedVersionItemsBefore = mockstart_helpers.getRowCount(oMockstar, "item", `calculation_version_id=${  oGeneratedCalculationVersion.CALCULATION_VERSION_ID}`);

				let oRequest = buildDeleteRequest(iBaseVersionId);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				// check that only base versions have been removed and not its generated version
				expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", `calculation_version_id=${  iBaseVersionId}`)).toBe(0);
				expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", `calculation_version_id=${  oGeneratedCalculationVersion.CALCULATION_VERSION_ID}`)).toBe(1);
				expect(mockstart_helpers.getRowCount(oMockstar, "item", `calculation_version_id=${  iBaseVersionId}`)).toBe(0);
				expect(mockstart_helpers.getRowCount(oMockstar, "item", `calculation_version_id=${  oGeneratedCalculationVersion.CALCULATION_VERSION_ID}`)).toBe(iAllGeneratedVersionItemsBefore);

				expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version")).toBe(iAllVersionsBefore - 1);
				expect(mockstart_helpers.getRowCount(oMockstar, "item")).toBe(iAllItemsBefore - iAllDeletedVersionItemsBefore);
			});	
		it('should delete a calculation version with valid calculation version id and its lifecycle versions', function() {
			// arrange
			addSecondCalculationVersion();
			
			//insert lifecycle version and its items
			let iBaseVersionId = testData.iCalculationVersionId;
			let iLifecycleVersionId = 4810;
			let oLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
			oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iLifecycleVersionId;
			oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = 2; 
			oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_1440'; 
			oLifecycleCalculationVersion.BASE_VERSION_ID = iBaseVersionId; 
			oLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1440; 
			oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	
			
			let oLifecycleVersionItems = mockstart_helpers.convertToObject(testData.oItemTestData, 0);
			oLifecycleVersionItems.CALCULATION_VERSION_ID = iLifecycleVersionId;
			oMockstar.insertTableData("item", oLifecycleVersionItems);	
			

			let iOriginalCount_CalculationVersion = mockstart_helpers.getRowCount(oMockstar, "calculation_version");
			let iOriginalCount_ItemAll = mockstart_helpers.getRowCount(oMockstar, "item");
			let iOriginalCount_ItemCalcVersion = mockstart_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + iBaseVersionId + " or calculation_version_id=" + iLifecycleVersionId);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var iOriginalCount_ItemExtAll = mockstart_helpers.getRowCount(oMockstar, "item_ext");
				var iOriginalCount_ItemExtCalcVersion = mockstart_helpers.getRowCount(oMockstar, "item_ext", "calculation_version_id=" + iBaseVersionId + " or calculation_version_id=" + iLifecycleVersionId);
			}

			var oRequest = buildDeleteRequest(iBaseVersionId);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			
			// check that base versions and its lifecycle version have been removed
			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id=" + iBaseVersionId + " or base_version_id=" + iBaseVersionId)).toBe(0);
			expect(mockstart_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + iBaseVersionId + " or calculation_version_id=" + iLifecycleVersionId)).toBe(0);

			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version")).toBe(iOriginalCount_CalculationVersion - 2);
			expect(mockstart_helpers.getRowCount(oMockstar, "item")).toBe(iOriginalCount_ItemAll - iOriginalCount_ItemCalcVersion);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				expect(mockstart_helpers.getRowCount(oMockstar, "item_ext", "calculation_version_id=" + iBaseVersionId + " or calculation_version_id=" + iLifecycleVersionId)).toBe(0);
				expect(mockstart_helpers.getRowCount(oMockstar, "item_ext")).toBe(iOriginalCount_ItemExtAll - iOriginalCount_ItemExtCalcVersion);
			}
		});

		it('should delete a calculation version with valid calculation version id and its manual and lifecycle versions', function() {
			// arrange
			addSecondCalculationVersion();
			
			//insert lifecycle version and its items
			let iBaseVersionId = testData.iCalculationVersionId;
			let iLifecycleVersionId = 4810;
			let iManualLifecycleVersionId = 4866;
			let oLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
			oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iLifecycleVersionId;
			oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.Lifecycle; 
			oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_1440'; 
			oLifecycleCalculationVersion.BASE_VERSION_ID = iBaseVersionId; 
			oLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1440; 
			oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	

			let oManualLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
			oManualLifecycleCalculationVersion.CALCULATION_VERSION_ID = iManualLifecycleVersionId;
			oManualLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.ManualLifecycleVersion; 
			oManualLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_144023'; 
			oManualLifecycleCalculationVersion.BASE_VERSION_ID = iBaseVersionId;
			oManualLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1452;
			oMockstar.insertTableData("calculation_version", oManualLifecycleCalculationVersion);

			let oLifecycleVersionItems = mockstart_helpers.convertToObject(testData.oItemTestData, 1);
			oLifecycleVersionItems.CALCULATION_VERSION_ID = iLifecycleVersionId;
			oMockstar.insertTableData("item", oLifecycleVersionItems);	

			let oManualLifecycleVersionItems = mockstart_helpers.convertToObject(testData.oItemTestData, 1);
			oManualLifecycleVersionItems.CALCULATION_VERSION_ID = iManualLifecycleVersionId;
			oMockstar.insertTableData("item", oManualLifecycleVersionItems);	
			

			let iOriginalCount_CalculationVersion = mockstart_helpers.getRowCount(oMockstar, "calculation_version");
			let iOriginalCount_ItemAll = mockstart_helpers.getRowCount(oMockstar, "item");
			let iOriginalCount_ItemCalcVersion = mockstart_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + iBaseVersionId + " or calculation_version_id=" + iLifecycleVersionId + " or calculation_version_id=" + iManualLifecycleVersionId);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var iOriginalCount_ItemExtAll = mockstart_helpers.getRowCount(oMockstar, "item_ext");
				var iOriginalCount_ItemExtCalcVersion = mockstart_helpers.getRowCount(oMockstar, "item_ext", "calculation_version_id=" + iBaseVersionId + " or calculation_version_id=" + iLifecycleVersionId + " or calculation_version_id=" + iManualLifecycleVersionId);
			}

			let oRequest = buildDeleteRequest(iBaseVersionId);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			
			// check that base versions and its manual lifecycle version have been removed
			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id=" + iBaseVersionId + " or base_version_id=" + iBaseVersionId)).toBe(0);
			expect(mockstart_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + iBaseVersionId + " or calculation_version_id=" + iLifecycleVersionId + " or calculation_version_id=" + iManualLifecycleVersionId)).toBe(0);

			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version")).toBe(iOriginalCount_CalculationVersion - 3);
			expect(mockstart_helpers.getRowCount(oMockstar, "item")).toBe(iOriginalCount_ItemAll - iOriginalCount_ItemCalcVersion);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				expect(mockstart_helpers.getRowCount(oMockstar, "item_ext", "calculation_version_id=" + iBaseVersionId + " or calculation_version_id=" + iLifecycleVersionId + " or calculation_version_id=" + iManualLifecycleVersionId)).toBe(0);
				expect(mockstart_helpers.getRowCount(oMockstar, "item_ext")).toBe(iOriginalCount_ItemExtAll - iOriginalCount_ItemExtCalcVersion);
			}
		});

		it('should not delete a calculation version if it is single version under calculation and return CALCULATIONVERSION_IS_SINGLE_ERROR', function() {

			// arrange
			let iVersionId = testData.iCalculationVersionId;
			
			// Do not arrange anything, since the calc version is already the single one
			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_id=" + iCalculationId)).toBe(1);

			var oRequest = buildDeleteRequest(iVersionId);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, iVersionId, messageCode.CALCULATIONVERSION_IS_SINGLE_ERROR);
		});

		it('should not delete a calculation version if it is open and return CALCULATIONVERSION_IS_STILL_OPENED_ERROR', function() {

			// arrange
			let iVersionId = testData.iCalculationVersionId;
			
			// open the calculation
			oMockstar.insertTableData("open_calculation_versions", {
				SESSION_ID : [ sSessionId ],
				CALCULATION_VERSION_ID : [ iVersionId ],
				IS_WRITEABLE : [ 1 ]
			});

			var oRequest = buildDeleteRequest(iVersionId);
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, iVersionId, messageCode.CALCULATIONVERSION_IS_STILL_OPENED_ERROR);
		});

		it('should not delete a calculation version if id does not exist and return GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
			// arrange
			let iInvalidCalculationVersionId = 1111;
			// ensure that the version does not exist indeed in the db before running test
			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_id=" + iInvalidCalculationVersionId)).toBe(0);

			let oRequest = buildDeleteRequest(iInvalidCalculationVersionId);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, iInvalidCalculationVersionId, messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR);
		});

		it('should not delete a calculation version if it is the current version and return DELETE_CURRENT_VERSION_ERROR', function() {
			// arrange
			let iVersionId = testData.iCalculationVersionId;
			oMockstar.execSingle("update {{calculation_version}} set calculation_id = " + iCalculationId + " where calculation_version_id=5809");
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);

			let oRequest = buildDeleteRequest(iVersionId);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, iVersionId, messageCode.DELETE_CURRENT_VERSION_ERROR);
		});
		
		it('should not delete a calculation version if it is frozen and return CALCULATIONVERSION_IS_FROZEN_ERROR', function() {
			// arrange: prepare calculation version data
			let iVersionId = 4810;
			let oFrozenCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oFrozenCalculationVersion.CALCULATION_VERSION_ID = iVersionId;
			oFrozenCalculationVersion.CALCULATION_VERSION_NAME = "Frozen Version";
			oFrozenCalculationVersion.IS_FROZEN = 1;
			oMockstar.insertTableData("calculation_version", oFrozenCalculationVersion);	

			let oRequest = buildDeleteRequest(iVersionId);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, iVersionId, messageCode.CALCULATIONVERSION_IS_FROZEN_ERROR);
		});
			
		it('should not delete a calculation version if it is lifecycle version and return CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR', function() {
			// arrange: prepare calculation version data
			let iVersionId = 4810;
			let oLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iVersionId;
			oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = "Lifecycle Version";
			oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.Lifecycle;
			oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	

			let oRequest = buildDeleteRequest(iVersionId);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, iVersionId, messageCode.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR);
		});

		it('should not delete a calculation version if it is manual lifecycle version and return CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR', function() {
			// arrange: prepare calculation version data
			let iVersionId = 4810;
			let oLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iVersionId;
			oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = "Manual Lifecycle Version";
			oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.ManualLifecycleVersion;
			oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	

			let oRequest = buildDeleteRequest(iVersionId);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, iVersionId, messageCode.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR);
		});		
	
		it('should not delete a base calculation version if it has open lifecycle versions and return LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR', function() {
			// arrange
			addSecondCalculationVersion();
			
			//insert lifecycle version
			let iBaseVersionId = testData.iCalculationVersionId;
			let iLifecycleVersionId = 4810;
			let oLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iLifecycleVersionId;
			oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = 2; 
			oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_1440'; 
			oLifecycleCalculationVersion.BASE_VERSION_ID = iBaseVersionId; 
			oLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1440; 
			oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	
			
			// open lifecycle version
			oMockstar.insertTableData("open_calculation_versions", {
				SESSION_ID : [ sSessionId ],
				CALCULATION_VERSION_ID : [ iLifecycleVersionId ],
				IS_WRITEABLE : [ 0 ]
			});
			oMockstar.insertTableData("calculation_version_temporary", _.extend(oLifecycleCalculationVersion, {SESSION_ID: sSessionId}));	
			

			let oRequest = buildDeleteRequest(iBaseVersionId);
			
			// act and assert
			let oResponse = requestAndCheckDbNotChangedAndException(oRequest, iBaseVersionId, messageCode.LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR);
			
			// check message details
			expect(oResponse.head.messages[0].details.calculationVersionObjs[0]).toEqual(
			        {id: iLifecycleVersionId,
			         name: oLifecycleCalculationVersion.CALCULATION_VERSION_NAME,
			         openingUsers: [
			                {id: sUserId}
			             ]
			        });
		});	

		it('should not delete a base calculation version if it has open manual lifecycle versions and return LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR', function() {
			// arrange
			addSecondCalculationVersion();
			
			//insert manual lifecycle version
			let iBaseVersionId = testData.iCalculationVersionId;
			let iLifecycleVersionId = 4810;
			let oLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iLifecycleVersionId;
			oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.ManualLifecycleVersion; 
			oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_1440'; 
			oLifecycleCalculationVersion.BASE_VERSION_ID = iBaseVersionId; 
			oLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1440; 
			oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	
			
			// open lifecycle version
			oMockstar.insertTableData("open_calculation_versions", {
				SESSION_ID : [ sSessionId ],
				CALCULATION_VERSION_ID : [ iLifecycleVersionId ],
				IS_WRITEABLE : [ 0 ]
			});
			oMockstar.insertTableData("calculation_version_temporary", _.extend(oLifecycleCalculationVersion, {SESSION_ID: sSessionId}));	
			

			let oRequest = buildDeleteRequest(iBaseVersionId);
			
			// act and assert
			let oResponse = requestAndCheckDbNotChangedAndException(oRequest, iBaseVersionId, messageCode.LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR);
			
			// check message details
			expect(oResponse.head.messages[0].details.calculationVersionObjs[0]).toEqual(
			        {id: iLifecycleVersionId,
			         name: oLifecycleCalculationVersion.CALCULATION_VERSION_NAME,
			         openingUsers: [
			                {id: sUserId}
			             ]
			        });
		});		
		
		it('should not delete a base calculation version if its lifecycle version is referenced and return LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR', function() {
			// arrange
			addSecondCalculationVersion();
			
			//insert lifecycle version
			let iBaseVersionId = testData.iCalculationVersionId;
			let iLifecycleVersionId = 4810;
			let oLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iLifecycleVersionId;
			oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = 2; 
			oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_1440'; 
			oLifecycleCalculationVersion.BASE_VERSION_ID = iBaseVersionId; 
			oLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1440; 
			oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	
			
			oMockstar.insertTableData("calculation_version_temporary", _.extend(oLifecycleCalculationVersion, {SESSION_ID: sSessionId}));
			
			// insert referencing item
			let iReferencingBaseVersionId = 4801;
			let oReferencingItem = mockstart_helpers.convertToObject(testData.oItemTestData, 4);
			oReferencingItem.ITEM_ID = 4444;
			oReferencingItem.REFERENCED_CALCULATION_VERSION_ID = iLifecycleVersionId;
			oReferencingItem.ITEM_CATEGORY_ID = 10;
			oMockstar.insertTableData("item", oReferencingItem);
			
			
			oMockstar.execSingle(`update {{calculation_version}} set base_version_id = ${iReferencingBaseVersionId} where calculation_version_id = ${oReferencingItem.CALCULATION_VERSION_ID}`);
			
			let oRequest = buildDeleteRequest(iBaseVersionId);
			
			// act and assert
			let oResponse = requestAndCheckDbNotChangedAndException(oRequest, iBaseVersionId, messageCode.LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR);
			
			// check message details
			expect(oResponse.head.messages[0].details.lifecycleCalculationVersionReferenceObjs[0]).toEqual(
			        {
			        	id: iBaseVersionId,
			        	lifecycleVersions: [ iLifecycleVersionId ],
				        referencingLifecycleVersions: [ oReferencingItem.CALCULATION_VERSION_ID ],
		                referencingBaseVersions: [iReferencingBaseVersionId]			         
			        });
			
		});		

		it('should not delete a base calculation version if its manual lifecycle version is referenced and return LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR', function() {
			// arrange
			addSecondCalculationVersion();
			
			//insert manual lifecycle version
			let iBaseVersionId = testData.iCalculationVersionId;
			let iLifecycleVersionId = 4810;
			let oLifecycleCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iLifecycleVersionId;
			oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.ManualLifecycleVersion; 
			oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_1440'; 
			oLifecycleCalculationVersion.BASE_VERSION_ID = iBaseVersionId; 
			oLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1440; 
			oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	
			
			oMockstar.insertTableData("calculation_version_temporary", _.extend(oLifecycleCalculationVersion, {SESSION_ID: sSessionId}));
			
			// insert referencing item
			let iReferencingBaseVersionId = 4801;
			let oReferencingItem = mockstart_helpers.convertToObject(testData.oItemTestData, 4);
			oReferencingItem.ITEM_ID = 4444;
			oReferencingItem.REFERENCED_CALCULATION_VERSION_ID = iLifecycleVersionId;
			oReferencingItem.ITEM_CATEGORY_ID = 10;
			oMockstar.insertTableData("item", oReferencingItem);
			
			
			oMockstar.execSingle(`update {{calculation_version}} set base_version_id = ${iReferencingBaseVersionId} where calculation_version_id = ${oReferencingItem.CALCULATION_VERSION_ID}`);
			
			let oRequest = buildDeleteRequest(iBaseVersionId);
			
			// act and assert
			let oResponse = requestAndCheckDbNotChangedAndException(oRequest, iBaseVersionId, messageCode.LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR);
			
			// check message details
			expect(oResponse.head.messages[0].details.lifecycleCalculationVersionReferenceObjs[0]).toEqual(
			        {
			        	id: iBaseVersionId,
			        	lifecycleVersions: [ iLifecycleVersionId ],
				        referencingLifecycleVersions: [ oReferencingItem.CALCULATION_VERSION_ID ],
		                referencingBaseVersions: [iReferencingBaseVersionId]			         
			        });
			
		});		
		
		it('should not delete a calculation version if its project is under lifecycle calculation and return GENERAL_ENTITY_PART_OF_CALCULATION_ERROR', function() {
			// arrange: prepare calculation version data
			addSecondCalculationVersion();

			let iVersionId = testData.iCalculationVersionId;
			let oTaskData = new TestDataUtility(testData.oTask).getObject(0);
			let sProjectId = testData.oCalculationTestData.PROJECT_ID[0];
			oTaskData.PARAMETERS = JSON.stringify({PROJECT_ID : sProjectId});
			oTaskData.STATUS = TaskStatus.ACTIVE;
			oMockstar.insertTableData("task", oTaskData);
			
			let oRequest = buildDeleteRequest(iVersionId);
			
			// act and assert
			requestAndCheckDbNotChangedAndException(oRequest, iVersionId, messageCode.GENERAL_ENTITY_PART_OF_CALCULATION_ERROR);
		});
		
		it('should not delete a calculation version if it is a source version for 2 master versions and return CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR with 2 versions in message details', function() {

			// arrange			
			let iVersionId = 4810;
			let oReferencedCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oReferencedCalculationVersion.CALCULATION_VERSION_ID = iVersionId;
			oReferencedCalculationVersion.CALCULATION_ID = 1978;
			oMockstar.insertTableData("calculation_version", oReferencedCalculationVersion);
			
			let oReferencedItem = mockstart_helpers.convertToObject(testData.oItemTestData, 1);
			oReferencedItem.ITEM_ID = 4444;
			oReferencedItem.REFERENCED_CALCULATION_VERSION_ID = iVersionId;
			oReferencedItem.ITEM_CATEGORY_ID = 10;
			oMockstar.insertTableData("item", oReferencedItem);
			
			oReferencedItem.ITEM_ID = 4445;
			oReferencedItem.CALCULATION_VERSION_ID = 4809;
			oReferencedItem.REFERENCED_CALCULATION_VERSION_ID = iVersionId;
			oReferencedItem.ITEM_CATEGORY_ID = 10;
			oMockstar.insertTableData("item", oReferencedItem);
			
			let oRequest = buildDeleteRequest(iVersionId);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			// Check response
			expect(oDefaultResponseMock.status).toBe(messageCode.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR.responseCode);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toEqual(1);
			expect(oResponseObject.head.messages[0].code).toEqual(messageCode.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR.code);

			//check that in the response the id's of versions where the version is referenced exists
			expect(oResponseObject.head.messages[0].details.calculationVersionReferenceObjs[0].masterVersionsDetails.length).toBe(2);
		});
		
		it('should delete a calculation version from recent calculation versions table when calculation version is deleted', function() {
			// arrange
			// Adjustment of test data as Authorization Manager to return an instance based-privilege.
			oMockstar.clearTable("calculation");
			oMockstar.insertTableData("calculation", {
				"CALCULATION_ID" : [ iCalculationId ],
				"PROJECT_ID" : [ "PR1" ],
				"CALCULATION_NAME" : [ "Test Calculation" ],
				"CURRENT_CALCULATION_VERSION_ID" : [ 5809 ],
				"CREATED_ON" : [ testData.sExpectedDate ],
				"CREATED_BY" : [ testData.sTestUser ],
				"LAST_MODIFIED_ON" : [ testData.sExpectedDate ],
				"LAST_MODIFIED_BY" : [ testData.sTestUser ]
			});
			//we cannot delete all the versions for a calculation. We should have at least one calculation version in calculation
			oMockstar.execSingle("update {{calculation_version}} set calculation_id = " + iCalculationId + " where calculation_version_id=5809");
			oMockstar.execSingle("insert into {{recent_calculation_versions}} values (" + testData.iCalculationVersionId + " , '" + testData.sTestUser + "' , current_utctimestamp )");
			var iOriginalCount_TotalQuantities = mockstart_helpers.getRowCount(oMockstar, "project_lifecycle_configuration");
	    	var iOriginalCount_TotalQuantitiesValues = mockstart_helpers.getRowCount(oMockstar, "lifecycle_period_value");
			
			var oRequest = buildDeleteRequest(testData.iCalculationVersionId);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id=" + iCalculationVersionId)).toBe(0);
			expect(mockstart_helpers.getRowCount(oMockstar, "recent_calculation_versions")).toBe(0);
			// check if calculation total quantity and associated values are deleted
			expect(mockstart_helpers.getRowCount(oMockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
		    expect(mockstart_helpers.getRowCount(oMockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);
		});	
		
		it('should delete the variant matrix when the deleted calculation version has one', function() {
			// arrange
			addSecondCalculationVersion();
			const sVariantStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${testData.iCalculationVersionId}`;
            const aVariantBefore = oMockstar.execQuery(sVariantStmt).columns.VARIANT_ID.rows;
            const oRequest = buildDeleteRequest(testData.iCalculationVersionId);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
            const aVariantAfter = oMockstar.execQuery(sVariantStmt).columns.VARIANT_ID.rows;
			expect(aVariantBefore.length).not.toBe(0);
			expect(aVariantAfter.length).toBe(0);
			expect(mockstart_helpers.getRowCount(oMockstar, "variant_item", `variant_id in (${aVariantBefore})`)).toBe(0);
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		});
	});

	describe('Copy Calculation Version',	function() {
		beforeEach(function() {
		    oResponseStub = new ResponseObjectStub();
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oMockstar.clearAllTables();
			oMockstar.insertTableData("session", testData.oSessionTestData);
			oMockstar.insertTableData("calculation", oTestCalculation);
			oMockstar.insertTableData("calculation_version", oTestCalculationVersion);
			oMockstar.insertTableData("calculation_version_temporary", oTestTemporaryCalculationVersion);
			oMockstar.insertTableData("item", testData.oItemTestData);
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("variant", new TestDataUtility (testData.oVariantTestData).build());
			oMockstar.insertTableData("variant_item", new TestDataUtility (testData.oVariantItemTestData).build());
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_ext", testData.oItemExtData);
			}
			oMockstar.initializeData();
		});

		afterEach(function() {
			oMockstar.cleanup();
		});

		function buildRequest(sAction, bOmitItems, bCompressedResult) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "action",
				"value" : sAction
			},
			{
				"name" : "id",
				"value" : testData.iCalculationVersionId
			},
			{
				"name" : "calculate",
				"value" : "false"
			},
			{
				"name": "omitItems",
				"value": bOmitItems
			},
			{
				"name": "compressedResult",
				"value": bCompressedResult
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
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
			return oRequest;
		}

		function testCopySuccess(sExpectedStatusId) {
			// arrange
			var oRequest = buildRequest('copy');
			var sCvName = oTestCalculationVersion.CALCULATION_VERSION_NAME + " (2)";

			var oCheckEntityTagsExists = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = 2809 and entity_type = 'V'");
			expect(oCheckEntityTagsExists.columns.TAG_ID.rows[0]).toBe(1);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			var oResponseCv = oResponseObject.body.transactionaldata[0];

			expect(helpers.isPositiveInteger(oResponseCv.CALCULATION_VERSION_ID)).toBe(true);
			expect(oResponseCv.CALCULATION_VERSION_ID).not.toBe(oTestCalculationVersion.CALCULATION_VERSION_ID);
			expect(oResponseCv.CALCULATION_VERSION_NAME).toBe(sCvName);
			expect(oResponseCv.STATUS_ID).toBe(sExpectedStatusId);
			expect(oResponseCv.CUSTOMER_ID).toBe(oTestCalculationVersion.CUSTOMER_ID);
			expect(oResponseCv.SALES_PRICE).toBe(oTestCalculationVersion.SALES_PRICE.toString());
			expect(oResponseCv.SALES_PRICE_CURRENCY_ID).toBe(oTestCalculationVersion.SALES_PRICE_CURRENCY_ID);
			expect(oResponseCv.REPORT_CURRENCY_ID).toBe(oTestCalculationVersion.REPORT_CURRENCY_ID);
			expect(oResponseCv.COSTING_SHEET_ID).toBe(oTestCalculationVersion.COSTING_SHEET_ID);
			expect(oResponseCv.COMPONENT_SPLIT_ID).toBe(oTestCalculationVersion.COMPONENT_SPLIT_ID);
			expect(oResponseCv.MATERIAL_PRICE_STRATEGY_ID).toBe(oTestCalculationVersion.MATERIAL_PRICE_STRATEGY_ID);
			expect(oResponseCv.ACTIVITY_PRICE_STRATEGY_ID).toBe(oTestCalculationVersion.ACTIVITY_PRICE_STRATEGY_ID);
			expect(helpers.isPositiveInteger(oResponseCv.ROOT_ITEM_ID)).toBe(true);

			expect(oResponseCv.ITEMS.length).toBe(3);
			expect(oResponseCv.ITEMS[0].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);
			expect(oResponseCv.ITEMS[1].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);
			expect(oResponseCv.ITEMS[2].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);
			expect(helpers.isPositiveInteger(oResponseCv.ITEMS[0].ITEM_ID)).toBe(true);
			expect(helpers.isPositiveInteger(oResponseCv.ITEMS[1].ITEM_ID)).toBe(true);
			expect(helpers.isPositiveInteger(oResponseCv.ITEMS[2].ITEM_ID)).toBe(true);

			// make sure that originial version is not affected by copy
			var result = oMockstar.execQuery("select count(*) as count from {{item}} " + "where calculation_version_id="
					+ testData.iCalculationVersionId);
			expect(helpers.toPositiveInteger(result.columns.COUNT.rows[0])).toBe(3);

			result = oMockstar.execQuery("select count(*) as count from {{item_temporary}} " + "where calculation_version_id="
					+ testData.iCalculationVersionId);
			expect(result.columns.COUNT.rows[0].toString()).toBe("0");

			if(jasmine.plcTestRunParameters.generatedFields === true){
				result = oMockstar.execQuery("select count(*) as count from {{item_temporary_ext}} " + "where calculation_version_id="
						+ testData.iCalculationVersionId);
				expect(result.columns.COUNT.rows[0].toString()).toBe("0");
			}

			var oCheckEntityTagsAfterCopy = oMockstar.execQuery("select * from {{entity_tags}} where entity_id = " + oResponseCv.CALCULATION_VERSION_ID + " and entity_type = 'V'");
			expect(oCheckEntityTagsAfterCopy.columns.TAG_ID.rows[0]).toBe(1);
			expect(oCheckEntityTagsAfterCopy.columns.CREATED_ON.rows[0]).not.toBeNull();
			expect(oCheckEntityTagsAfterCopy.columns.CREATED_BY.rows[0]).toBe(sSessionId);
		}

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

		it('should create (post) calculation version and copy also the default status for copyable and active status --> valid calculation version object returned with new id', function() {
			testCopySuccess("ACTIVE");
		});

		it('should create (post) calculation version and set the default status because current status is active, but not copyable', function() {

			updateCalculationVersionStatusId("pending");
			testCopySuccess("ACTIVE");
		});

		it('should create (post) calculation version and set the default status because current status is copyable, but deactivated', function() {

			updateCalculationVersionStatusId("draft");
			testCopySuccess("ACTIVE");
		});

		it('should create (post) calculation version and set the default status because current status is not copyable and deactivated', function() {

			updateCalculationVersionStatusId("INACTIVE");
			testCopySuccess("ACTIVE");
		});

		it('should create (post) calculation version and set the default status because there is no current status', function() {

			updateCalculationVersionStatusId(null);
			testCopySuccess("ACTIVE");
		});

		it('should create (post) calculation version and set no status because current status is not copyable and deactivated and there is no default status', function() {

			updateCalculationVersionStatusId("INACTIVE");

			oMockstar.clearTable("status");
			oMockstar.insertTableData("status", {
				"STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT'],
				"IS_DEFAULT":[0,0,0,0],
				"IS_ACTIVE":[1,0,1,1],
				"IS_STATUS_COPYABLE":[1,0,0,1],
				"DISPLAY_ORDER":[1,2,3,4],
				"CREATED_ON":["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
				"CREATED_BY":['activeUser','inactiveUser','pendingUser','draftUser'],
				"LAST_MODIFIED_ON":[,,,],
				"LAST_MODIFIED_BY":[,,,]
			});

			testCopySuccess(null);
		});

		it('should throw GENERAL_VALIDATION_ERROR when copying a calculation version with a name bigger than 500 characters', function() {
			// arrange
			const sName500Chars = "w3zFIsI9n4HWBaaKJqUe25OooVv9LlUfr3aMdLYY4KAAuimmbyIaEkvhffPL2RaeCh0HYBPaMdMJjKZuBARYXOFJFJXCqU0gIRFJU19MzO2L19zZcQQLyZcQcQXJXBMnEJsO79zzRGfYfUU61kbdP46GEPrPjxH5S1iV5wtH4Caq9bkR45WZ668IBIBwKOl4WWPcGCndMFXrlg4SbUSkvPCadSK62LgXZsuMpWBKiOJrFRcct9eM01jhgYQCPMB7usfRj83GSljCdFo7ZQfJoSEHypUXAyxjn2fVusQnGtSguV2gxmXcoMpZHvAxgTk8UIscsXlvt23d35UinELSGHU0x2jU7kcSzvGpbDKDtyGDFqmSUxOYBicldTRCq6CRrKefp7623654CSLkIdkYIBJwkUIeuHnPGESi0FZBVCXBmbjx1f5UokKMwJEFcEf3eLK6cYCDV4YmJWaZDJcnwUMKQALE1TwAObFDZ6g6yJRZM7oyuJIT";
			oMockstar.execSingle(`UPDATE {{calculation_version}} SET CALCULATION_VERSION_NAME = '${sName500Chars}' WHERE CALCULATION_VERSION_ID = ${testData.iCalculationVersionId};`);
			var oRequest = buildRequest('copy');

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// assert
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_VALIDATION_ERROR.code)
			expect(oResponseObject.head.messages.length).toBe(1);
		});

		it('should create (post) calculation version --> valid calculation version object returned with new id and compressedResult', function() {
			// arrange
			const oRequest = buildRequest('copy', false, true);
			const sCvName = oTestCalculationVersion.CALCULATION_VERSION_NAME + " (2)";

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			const oResponseCv = oResponseObject.body.transactionaldata[0];

			expect(oResponseCv.CALCULATION_VERSION_ID).not.toBe(oTestCalculationVersion.CALCULATION_VERSION_ID);
			expect(oResponseCv.CALCULATION_VERSION_NAME).toBe(sCvName);
			expect(helpers.isPositiveInteger(oResponseCv.ROOT_ITEM_ID)).toBe(true);

			expect(oResponseCv.ITEMS_COMPRESSED.ITEM_ID.length).toBe(3);
			
    		const oFields = _.pick(oResponseCv.ITEMS_COMPRESSED, ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'CALCULATION_VERSION_ID']);
        			    
    		expect(oFields).toMatchData(
    				   {'ITEM_ID': [3001, 3002, 3003],
    				   'PARENT_ITEM_ID': [null, 3001, 3002],
    		  		   'PREDECESSOR_ITEM_ID': [null, 3001, 3002],
    				   'CALCULATION_VERSION_ID': [oResponseCv.CALCULATION_VERSION_ID, oResponseCv.CALCULATION_VERSION_ID, oResponseCv.CALCULATION_VERSION_ID]
    				   }, ['ITEM_ID']);
		});

		if(jasmine.plcTestRunParameters.mode === 'all') {
			it('should create (post) calculation version --> insert correct data in t_calculation_version_temporary', function() {
				// arrange
				var oRequest = buildRequest('copy');
				var sCvName = oTestCalculationVersion.CALCULATION_VERSION_NAME + " " + sUserId;

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));

				expect(oTableData.CALCULATION_VERSION_ID.length).toBe(2);
				expect(oTableData.CALCULATION_VERSION_ID[1]).toBe(oResponseCalculation.CALCULATION_VERSION_ID);
				expect(oTableData.CALCULATION_VERSION_NAME[1]).toBe(oResponseCalculation.CALCULATION_VERSION_NAME);
				expect(oTableData.ROOT_ITEM_ID[1]).toBe(oResponseCalculation.ROOT_ITEM_ID);
				expect(oTableData.CUSTOMER_ID[1]).toBe(oResponseCalculation.CUSTOMER_ID);
				expect(oTableData.SALES_PRICE[1]).toBe(oResponseCalculation.SALES_PRICE);
				expect(oTableData.SALES_PRICE_CURRENCY_ID[1]).toBe(oResponseCalculation.SALES_PRICE_CURRENCY_ID);
				expect(oTableData.REPORT_CURRENCY_ID[1]).toBe(oResponseCalculation.REPORT_CURRENCY_ID);
				expect(oTableData.COSTING_SHEET_ID[1]).toBe(oResponseCalculation.COSTING_SHEET_ID);
				expect(oTableData.COMPONENT_SPLIT_ID[1]).toBe(oResponseCalculation.COMPONENT_SPLIT_ID);
				expect(oTableData.VALUATION_DATE[1]).toBe(oResponseCalculation.VALUATION_DATE);
				expect(oTableData.MASTER_DATA_TIMESTAMP[1]).toBe(oResponseCalculation.MASTER_DATA_TIMESTAMP);
				expect(oTableData.IS_FROZEN[1]).toBe(oResponseCalculation.IS_FROZEN);
				expect(oTableData.MATERIAL_PRICE_STRATEGY_ID[1]).toBe(oResponseCalculation.MATERIAL_PRICE_STRATEGY_ID);
				expect(oTableData.ACTIVITY_PRICE_STRATEGY_ID[1]).toBe(oResponseCalculation.ACTIVITY_PRICE_STRATEGY_ID);
			});

			it('should create (post) calculation with existing calculation version --> insert correct data in t_item_temporary', function() {
				// arrange
				var oRequest = buildRequest('copy');

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseCalculation = oResponseObject.body.transactionaldata[0];
				var aResponseItems = oResponseCalculation.ITEMS;
				var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{item_temporary}}"));

				expect(oTableData.ITEM_ID.length).toBe(3);
				expect(oTableData.ITEM_ID[0]).toBe(aResponseItems[0].ITEM_ID);
				expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(aResponseItems[0].CALCULATION_VERSION_ID);
				expect(oTableData.ITEM_ID[1]).toBe(aResponseItems[1].ITEM_ID);
				expect(oTableData.CALCULATION_VERSION_ID[1]).toBe(aResponseItems[1].CALCULATION_VERSION_ID);
				expect(oTableData.ITEM_ID[2]).toBe(aResponseItems[2].ITEM_ID);
				expect(oTableData.CALCULATION_VERSION_ID[2]).toBe(aResponseItems[2].CALCULATION_VERSION_ID);
			});	
			
			it('should return the referenced version related information', function() {
			    // arrange
			    oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
			    oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			    oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
			    oMockstar.insertTableData("project",testData.oProjectCurrencyTestData);
			    oMockstar.insertTableData("controlling_area",testData.oControllingAreaTestDataPlc);
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
		        
			    var oRequest = buildRequest('copy');
			    var sCvName = oTestCalculationVersion.CALCULATION_VERSION_NAME + " (2)";

			    // act
			    new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			    // assert
			    expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			    expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

		    	var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    expect(oResponseObject.body.referencesdata.PROJECTS.length).toBe(2);
			    expect(oResponseObject.body.referencesdata.CALCULATIONS.length).toBe(2);
			    expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS.length).toBe(2);
			    expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
			    expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS[1].ITEMS.length).toBe(1);
			    expect(oResponseObject.body.referencesdata.MASTERDATA.CONTROLLING_AREA_ENTITIES.length).toBe(1);
			    expect(oResponseObject.body.referencesdata.MASTERDATA.COSTING_SHEET_ENTITIES.length).toBe(1);
			    expect(oResponseObject.body.referencesdata.MASTERDATA.COMPONENT_SPLIT_ENTITIES.length).toBe(1);
			    expect(oResponseObject.body.referencesdata.MASTERDATA.EXCHANGE_RATE_TYPE_ENTITIES.length).toBe(1);
			});
			
			it("should create copy of existing lifecycle calculation version -> return new base version and update PRICE_SOURCE properties for items with OUTDATED_PRICE", function() {
			    //set lifecycle properties and fill calculation_version_temporary table
				oMockstar.clearTables("calculation_version_temporary", "item", "calculation_version");
				
				let oLifecycleCalcVersion = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
				oLifecycleCalcVersion.BASE_VERSION_ID = 333;
				oLifecycleCalcVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.Lifecycle; 
				oLifecycleCalcVersion.LIFECYCLE_PERIOD_FROM = 555;		
				oMockstar.insertTableData("calculation_version", oLifecycleCalcVersion);

		        let oLifecycleCalcVersionItems = new TestDataUtility(testData.oItemTestData).getObjects([0, 1, 2]);
				oLifecycleCalcVersionItems[2].PRICE_SOURCE_ID = 'OUTDATED_PRICE';
				oLifecycleCalcVersionItems[2].PRICE_SOURCE_TYPE_ID = 4;
				oMockstar.insertTableData("item", oLifecycleCalcVersionItems);	

				var oRequest = buildRequest('copy');
				checkSaveOrCopyOfLifecycleVersion(oRequest, testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);
			});
			
			it("should create copy of existing manual lifecycle calculation version -> return new base version and update PRICE_SOURCE properties for items with OUTDATED_PRICE", function() {
			    //set manual lifecycle properties and fill calculation_version_temporary table
				oMockstar.clearTables("calculation_version_temporary", "item", "calculation_version");
				
				let oLifecycleCalcVersion = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
				oLifecycleCalcVersion.BASE_VERSION_ID = 333;
				oLifecycleCalcVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.ManualLifecycleVersion; 
				oLifecycleCalcVersion.LIFECYCLE_PERIOD_FROM = 555;		
				oMockstar.insertTableData("calculation_version", oLifecycleCalcVersion);

		        let oLifecycleCalcVersionItems = new TestDataUtility(testData.oItemTestData).getObjects([0, 1, 2]);
				oLifecycleCalcVersionItems[2].PRICE_SOURCE_ID = 'OUTDATED_PRICE';
				oLifecycleCalcVersionItems[2].PRICE_SOURCE_TYPE_ID = 4;
				oMockstar.insertTableData("item", oLifecycleCalcVersionItems);	

				var oRequest = buildRequest('copy');
				checkSaveOrCopyOfLifecycleVersion(oRequest, testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);
			});

			it('should return an empty array for ITEMS if omitItems is set to true', function() {
				// arrange
				var oRequest = buildRequest('copy', true);

				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

				// assert
				expect(oResponseStub.status).toBe($.net.http.CREATED);
				const oResponseBody = oResponseStub.getParsedBody();
				expect(oResponseBody.body.transactionaldata[0].ITEMS).toEqual(aEmptyArray);

			});

			it('should copy the variants and the variant items that belong to the copied version', function() {
				// arrange
				oMockstar.clearTable("calculation_version");
				const oVariantBaseVersion = new TestDataUtility(oTestCalculationVersion).build();
				oVariantBaseVersion.CALCULATION_VERSION_TYPE = 4;
				oMockstar.insertTableData("calculation_version", oVariantBaseVersion);
				var oRequest = buildRequest('copy');
				var sCvName = oVariantBaseVersion.CALCULATION_VERSION_NAME + " (2)";

				const sGetVariantsStmt = "select * from {{variant}}";
				const sGetVersionVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${oVariantBaseVersion.CALCULATION_VERSION_ID}`;	
				const iAllVariantsBeforeCopy = oMockstar.execQuery(sGetVariantsStmt).columns.VARIANT_ID.rows.length;
				const aVersionVariants = oMockstar.execQuery(sGetVersionVariantsStmt).columns.VARIANT_ID.rows;

				const sGetVariantItemsStmt = "select * from {{variant_item}}";
				const sGetVersionVariantItemsStmt = `select * from {{variant_item}} where VARIANT_ID IN (${aVersionVariants})`;
				const iAllVariantItemsBeforeCopy = oMockstar.execQuery(sGetVariantItemsStmt).columns.VARIANT_ID.rows.length;
				const iVersionVariantItems = oMockstar.execQuery(sGetVersionVariantItemsStmt).columns.ITEM_ID.rows.length;
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				const iAllVariantsAfterCopy = oMockstar.execQuery(sGetVariantsStmt).columns.VARIANT_ID.rows.length;
				const iAllVariantItemsAfterCopy = oMockstar.execQuery(sGetVariantItemsStmt).columns.ITEM_ID.rows.length;

				// assert
				expect(iAllVariantsAfterCopy).toBe(iAllVariantsBeforeCopy + aVersionVariants.length);
				expect(iAllVariantItemsAfterCopy).toBe(iAllVariantItemsBeforeCopy + iVersionVariantItems);
			});
			
			it("should set CALCULATION_VERSION_TYPE=1 when the copied version is of type 8 (Generated from variant)", function() {
    		    oMockstar.clearTable("calculation_version");
    			const oGeneratedFromVariantVersion = new TestDataUtility(oTestCalculationVersion).build();
    			oGeneratedFromVariantVersion.CALCULATION_VERSION_TYPE = 8;
    			oMockstar.insertTableData("calculation_version", oGeneratedFromVariantVersion);
    			const oRequest = buildRequest('copy');
    			const sCvName = oGeneratedFromVariantVersion.CALCULATION_VERSION_NAME + " (2)";
    			// act
    			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
    
    			// assert
    			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
    			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
    
    			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);			
    			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_TYPE).toBe(1);
		});
		}
	});

	describe('Saving Calculation Versions',	function() {

		beforeEach(function() {
		    oResponseStub = new ResponseObjectStub();
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oMockstar.clearAllTables();
			oMockstar.initializeData();
			oMockstar.insertTableData("item", testData.oItemTestData);
			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("session", testData.oSessionTestData);
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("exchange_rate_type", testData.oExchangeRateTypeTestDataPlc);
			oMockstar.insertTableData("variant", testData.oVariantTestData);
			oMockstar.insertTableData("variant_item", new TestDataUtility (testData.oVariantItemTestData).build());
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_ext", testData.oItemExtData);
				oMockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
			}
		});

		afterEach(function() {
			oMockstar.cleanup();
		});

		var iCalculationVersionID = testData.iCalculationVersionId;

		function getCalculationVersionToSave() {
		    return [ {
    			"CALCULATION_VERSION_ID" : testData.iCalculationVersionId,
    			"CALCULATION_ID" : 1978,
    			"CALCULATION_VERSION_NAME" : "A Newly Saved Version"
    		} ]
		};

		function buildRequest(sAction, oCalculationVersion, bOmitItems) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "action",
				"value" : sAction
			}, {
				"name" : "calculate",
				"value" : "false"
			}, {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
				"name" : "compressedResult",
				"value" : "false"
			}, {
				"name" : "omitItems",
				"value" : bOmitItems
			}];
			params.get = function(sArgument) {
				if (sArgument === "calculate") {
					return "false";
				}
				if (sArgument === "id") {
					return undefined;
				}
				if (sArgument === "loadMasterdata") {
					return "false";
				}
				if (sArgument === "compressedResult") {
					return "false";
				}
				if (sArgument === "omitItems") {
					return "false";
				}
				return sAction;
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify(oCalculationVersion);
						}
					}
			};
			return oRequest;
		}
		
		it('should update recent calculation versions when succesfully saves a new calculation version with valid input', function() {
			// arrange
			var oRequest = buildRequest('save', getCalculationVersionToSave());
			expect(mockstart_helpers.getRowCount(oMockstar, "recent_calculation_versions")).toBe(0);			
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(mockstart_helpers.getRowCount(oMockstar, "recent_calculation_versions")).toBe(1);			
		});	

		it("should set the LAST_MODIFIED* and LAST_ACCEPTED* fields for the copied variants when first saving a version that was created as a copy from another version", () => {
            // arrange
			oMockstar.clearTable("variant");
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === testData.iCalculationVersionId;
            const aVariantToUpdateTestData = new TestDataUtility(testData.oVariantTestData).getObjects(fPredicate);
            aVariantToUpdateTestData.forEach(oVariant => {
                oVariant.LAST_MODIFIED_ON = null;
                oVariant.LAST_REMOVED_MARKINGS_ON = null;
            });

            oMockstar.insertTableData("variant", aVariantToUpdateTestData);

            const oRequest = buildRequest("save", getCalculationVersionToSave());
            // act
            new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

            // assert
            const sGetVariantsStmt = `select LAST_MODIFIED_ON, LAST_MODIFIED_BY, LAST_REMOVED_MARKINGS_BY, LAST_REMOVED_MARKINGS_ON 
                                        from {{variant}} where CALCULATION_VERSION_ID = ${testData.iCalculationVersionId}`;
            const aVersionVariants = oMockstar.execQuery(sGetVariantsStmt).columns;
            expect(oDefaultResponseMock.status).toBe($.net.http.OK);
            expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]).body.transactionaldata[0];
			expect(new Date(oResponseObject.LAST_MODIFIED_ON).getTime()).toBe(aVersionVariants.LAST_MODIFIED_ON.rows[0].getTime());
			expect(new Date(oResponseObject.LAST_MODIFIED_ON).getTime()).toBe(aVersionVariants.LAST_REMOVED_MARKINGS_ON.rows[0].getTime());
			expect(oResponseObject.LAST_MODIFIED_BY).toBe(aVersionVariants.LAST_MODIFIED_BY.rows[0]);
			expect(oResponseObject.LAST_MODIFIED_BY).toBe(aVersionVariants.LAST_REMOVED_MARKINGS_BY.rows[0]);
        });

		it('should save a new calculation version with valid input (POST Request+Version in Body) -> returns saved calculation version with same ID', function() {
			// arrange
			var oRequest = buildRequest('save', getCalculationVersionToSave());
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(iCalculationVersionID);
		});

		it('should save an existing calculation version with valid input (POST Request+Version Body) -> returns saved calculation version', function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oExistingVersion = JSON.parse(JSON.stringify(getCalculationVersionToSave()));
			oExistingVersion[0].CALCULATION_VERSION_NAME = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];

			var oRequest = buildRequest('save', oExistingVersion);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(iCalculationVersionID);
		});

		it("should save an existing calculation version with valid input (POST Request+Version Body) -> LAST_MODIFIED_ON is in UTC", function(){
			// arrange
			var dStart = new Date();
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oExistingVersion = JSON.parse(JSON.stringify(getCalculationVersionToSave()));
			oExistingVersion[0].CALCULATION_VERSION_NAME = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];

			var oRequest = buildRequest('save', oExistingVersion);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			var dEnd = new Date();
			jasmine.log("Checking if LAST_MODIFIED_ON is in UTC");
			var dLastSaved = new Date(Date.parse(oResponseObject.body.transactionaldata[0].LAST_MODIFIED_ON));
			test_helpers.checkDateIsBetween(dLastSaved, dStart, dEnd);
		});

		it('should save an existing calculation version as another version with valid input (POST Request+Version in Body) -> returns saved calculation version with new ID', function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oRequest = buildRequest('save-as', getCalculationVersionToSave());
			// act

			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).not.toBe(iCalculationVersionID);

			// make sure that originial version is not affected by save-as
			var result = oMockstar.execQuery("select count(*) as count from {{item}} " + "where calculation_version_id="
					+ iCalculationVersionID);
			expect(helpers.toPositiveInteger(result.columns.COUNT.rows[0])).toBe(3);

			result = oMockstar.execQuery("select count(*) as count from {{item_temporary}} " + "where calculation_version_id="
					+ iCalculationVersionID);
			expect(result.columns.COUNT.rows[0].toString()).toBe("0");

			if(jasmine.plcTestRunParameters.generatedFields === true){
				result = oMockstar.execQuery("select count(*) as count from {{item_temporary_ext}} " + "where calculation_version_id="
						+ iCalculationVersionID);
				expect(result.columns.COUNT.rows[0].toString()).toBe("0");
			}
		});

		it('should keep MATERIAL_PRICE_STRATEGY_ID and ACTIVITY_PRICE_STRATEGY_ID unchanged when saving existing calculation version as another version', function () {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			const oVersionToSaveAS = getCalculationVersionToSave();
			const iVersionToSaveAsId = oVersionToSaveAS[0].CALCULATION_VERSION_ID;
			const oOldVersionPriceStrategy = oMockstar.execQuery(`select MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID from {{calculation_version}}
																	where calculation_version_id = ${iVersionToSaveAsId}`);
			const iMaterialPriceStrategyId = oOldVersionPriceStrategy.columns.MATERIAL_PRICE_STRATEGY_ID.rows[0];
			const iActivityPriceStrategyId = oOldVersionPriceStrategy.columns.ACTIVITY_PRICE_STRATEGY_ID.rows[0];
	
			const oRequest = buildRequest('save-as', oVersionToSaveAS);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			const iNewVersionId = oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID;
			const oNewVersionPriceStrategy = oMockstar.execQuery(`select MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID from {{calculation_version}}
																	where calculation_version_id = ${iNewVersionId}`);
			expect(oNewVersionPriceStrategy.columns.MATERIAL_PRICE_STRATEGY_ID.rows[0]).toBe(iMaterialPriceStrategyId);
			expect(oNewVersionPriceStrategy.columns.ACTIVITY_PRICE_STRATEGY_ID.rows[0]).toBe(iActivityPriceStrategyId);
		});
	
		it("should save an existing calculation version as another version -> returns saved calculation version with new ID and valid values in audit fields", function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oRequest = buildRequest('save-as', getCalculationVersionToSave());
			oMockstar.execSingle("update {{item}} SET CREATED_BY = '" + testData.sSecondUser + "'");
			var oUpdateResult = oMockstar.execQuery("select CREATED_BY from {{item}} ");
			// act

			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).not.toBe(iCalculationVersionID);

			// make sure that originial version is not affected by save-as
			var result = oMockstar.execQuery("select CREATED_BY from {{item}} " + "where calculation_version_id="
					+ oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID);
			expect(result.columns.CREATED_BY.rows[0]).toBe(testData.sTestUser);
		});
		
		it("should save an existing calculation version as another version -> returns saved calculation version with new ID and unset is_frozen field", function() {
		    //set IS_FROZEN flag and fill calculation_version_temporary table
			oMockstar.clearTable("calculation_version_temporary");
			var oCalcVersionTempTestDataFrozen = _.cloneDeep(testData.oCalculationVersionTemporaryTestData);
			oCalcVersionTempTestDataFrozen.IS_FROZEN[0] = 1;						
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			
			//set IS_FROZEN flag and fill calculation_version table
			oMockstar.clearTable("calculation_version");
			var oCalculationVersionTestDataClone = _.cloneDeep(testData.oCalculationVersionTestData);
			oCalculationVersionTestDataClone.IS_FROZEN = [ 1, 0, 0 ];
			oMockstar.insertTableData("calculation_version",oCalculationVersionTestDataClone);
			
			var oRequest = buildRequest('save-as', getCalculationVersionToSave());

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			// Validate response body
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);			
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).not.toBe(iCalculationVersionID);
			expect(oResponseObject.body.transactionaldata[0].IS_FROZEN).toBe(0);
			
			//check if there is no entry in calculation_version_temporary with id iCalculationVersionID
			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version_temporary", "calculation_version_id=" + iCalculationVersionID + " and session_id='" + sSessionId+"'")).toBe(0);
			
			//check if there is an entry in calculation_version with id calculation_version and is_frozen='X'
			expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id=" + iCalculationVersionID + " and is_frozen=1")).toBe(1);

		});

		it("should set CALCULATION_VERSION_TYPE=1 when the version saved as another version is of type 8 (Generated from variant)", function() {
		    //set CALCULATION_VERSION_TYPE = 8 and fill calculation_version_temporary table
		    const oVersionTestData = testData.oCalculationVersionForVariantTestData;
		    oVersionTestData.CALCULATION_VERSION_TYPE[0] = 8;
		    const oCalculationVersionForTypeTemporary = _.cloneDeep(oVersionTestData);
		    oCalculationVersionForTypeTemporary.SESSION_ID = Array(oVersionTestData.CALCULATION_VERSION_ID.length).fill(testData.sSessionId);
			oMockstar.insertTableData("calculation_version_temporary", oCalculationVersionForTypeTemporary);
			oMockstar.insertTableData("calculation_version", oVersionTestData);
			
			const iGeneratedVersionId = oVersionTestData.CALCULATION_VERSION_ID[0];
			const aGeneratedVersionSaveAs = [{
    			"CALCULATION_VERSION_ID" : iGeneratedVersionId,
    			"CALCULATION_ID" : oVersionTestData.CALCULATION_ID[0],
    			"CALCULATION_VERSION_NAME" : "Generated-save-as"
    		}];
			const oRequest = buildRequest('save-as', aGeneratedVersionSaveAs);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);			
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).not.toBe(iGeneratedVersionId);
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).not.toBe(oVersionTestData.CALCULATION_VERSION_ID[0]);
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_TYPE).toBe(1);
		});

		it("should save an existing calculation version as another version with valid input even if it is locked -> returns saved calculation version with new ID", function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oRequest = buildRequest('save-as', getCalculationVersionToSave());

			// change session for opened versions
			oMockstar.execSingle("update {{item_temporary}} SET SESSION_ID = 'test' " + "where SESSION_ID = '" + testData.sSessionId + "'");
			oMockstar.execSingle("update {{open_calculation_versions}} SET SESSION_ID = 'test' " + "where SESSION_ID = '" + testData.sSessionId
					+ "'");
			oMockstar.execSingle("update {{calculation_version_temporary}} SET SESSION_ID = 'test' " + "where SESSION_ID = '"
					+ testData.sSessionId + "'");
			oMockstar.execSingle("insert into {{session}} values('test','tester','DE','" + testData.sExpectedDate + "')");

			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.execSingle("update {{item_temporary_ext}} SET SESSION_ID = 'test' " + "where SESSION_ID = '" + testData.sSessionId + "'");
			}

			// open the version in read only
			var params = [ {
				"name" : "action",
				"value" : "open"
			},
			{
				"name" : "id",
				"value" : testData.iCalculationVersionId
			},
			{
				"name" : "calculate",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				var oSearchedParam = _.find(params, function(oParam) {
					return sArgument === oParam.name
				});

				return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
			};
			var oOpenRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
			new Dispatcher(oCtx, oOpenRequest, oDefaultResponseMock).dispatch();

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).not.toBe(iCalculationVersionID);

			// make sure that original version is not affected by save-as
			var result = oMockstar.execQuery("select count(*) as count from {{item}} " + "where calculation_version_id="
					+ iCalculationVersionID);
			expect(helpers.toPositiveInteger(result.columns.COUNT.rows[0])).toBe(3);

			// versions opened by others are not affected
			result = oMockstar.execQuery("select count(*) as count from {{item_temporary}} " + "where calculation_version_id="
					+ iCalculationVersionID);
			expect(result.columns.COUNT.rows[0].toString()).toBe("3");
			// new version is also open
			result = oMockstar.execQuery("select count(*) as count from {{item_temporary}} " + "where calculation_version_id="
					+ oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID);
			expect(result.columns.COUNT.rows[0].toString()).toBe("3");

			if(jasmine.plcTestRunParameters.generatedFields === true){
				// make sure that original version is not affected by save-as
				var result = oMockstar.execQuery("select count(*) as count from {{item_ext}} " + "where calculation_version_id="
						+ iCalculationVersionID);
				expect(helpers.toPositiveInteger(result.columns.COUNT.rows[0])).toBe(3);
				// versions opened by others are not affected
				result = oMockstar.execQuery("select count(*) as count from {{item_temporary_ext}} " + "where calculation_version_id="
						+ iCalculationVersionID);
				expect(result.columns.COUNT.rows[0].toString()).toBe("3");
				// new version is also open
				result = oMockstar.execQuery("select count(*) as count from {{item_temporary_ext}} " + "where calculation_version_id="
						+ oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID);
				expect(result.columns.COUNT.rows[0].toString()).toBe("3");
			}
		});
		
		it("should save an existing lifecycle calculation version as another version -> return new base version and update PRICE_SOURCE properties for items with OUTDATED_PRICE", function() {
			
		    //set lifecycle properties and fill calculation_version_temporary table
			oMockstar.clearTables("calculation_version_temporary", "item_temporary", "calculation_version");
			
			let oLifecycleCalcVersion = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
			oLifecycleCalcVersion.BASE_VERSION_ID = 333;
			oLifecycleCalcVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.Lifecycle; 
			oLifecycleCalcVersion.LIFECYCLE_PERIOD_FROM = 555;		
			oMockstar.insertTableData("calculation_version", oLifecycleCalcVersion);
	        
	        let oLifecycleCalcVersionTemp = _.extend(oLifecycleCalcVersion, {SESSION_ID:sSessionId});
	        oMockstar.insertTableData("calculation_version_temporary", oLifecycleCalcVersionTemp);
	        
	        let oLifecycleCalcVersionItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0, 1, 2]);
			oLifecycleCalcVersionItems[2].PRICE_SOURCE_ID = 'OUTDATED_PRICE';
			oLifecycleCalcVersionItems[2].PRICE_SOURCE_TYPE_ID = 4;
			oMockstar.insertTableData("item_temporary", oLifecycleCalcVersionItems);	

			var oRequest = buildRequest('save-as', getCalculationVersionToSave());
			checkSaveOrCopyOfLifecycleVersion(oRequest, iCalculationVersionID);
		});

		it("should save an existing manaual lifecycle calculation version as another version -> return new base version and update PRICE_SOURCE properties for items with OUTDATED_PRICE", function() {
			
		    //set lifecycle properties and fill calculation_version_temporary table
			oMockstar.clearTables("calculation_version_temporary", "item_temporary", "calculation_version");
			
			let oLifecycleCalcVersion = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
			oLifecycleCalcVersion.BASE_VERSION_ID = 333;
			oLifecycleCalcVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.ManualLifecycleVersion; 
			oLifecycleCalcVersion.LIFECYCLE_PERIOD_FROM = 555;		
			oMockstar.insertTableData("calculation_version", oLifecycleCalcVersion);
	        
	        let oLifecycleCalcVersionTemp = _.extend(oLifecycleCalcVersion, {SESSION_ID:sSessionId});
	        oMockstar.insertTableData("calculation_version_temporary", oLifecycleCalcVersionTemp);
	        
	        let oLifecycleCalcVersionItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0, 1, 2]);
			oLifecycleCalcVersionItems[2].PRICE_SOURCE_ID = 'OUTDATED_PRICE';
			oLifecycleCalcVersionItems[2].PRICE_SOURCE_TYPE_ID = 4;
			oMockstar.insertTableData("item_temporary", oLifecycleCalcVersionItems);	

			let oRequest = buildRequest('save-as', getCalculationVersionToSave());
			checkSaveOrCopyOfLifecycleVersion(oRequest, iCalculationVersionID);
		});

		it('should save an existing calculation version with valid input and delete items marked for deletion -> returns saved calculation version without the deleted items', function() {
			// arrange
			const oCalculationVersionToSave = getCalculationVersionToSave();
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
            oMockstar.execSingle("update {{item_temporary}} SET IS_DIRTY = 1 " + "where calculation_version_id="
					+ oCalculationVersionToSave[0].CALCULATION_VERSION_ID);
			oMockstar.execSingle("update {{item_temporary}} SET IS_DELETED = 1 " + "where item_id = 3003 and calculation_version_id="
					+ oCalculationVersionToSave[0].CALCULATION_VERSION_ID);

			var oRequest = buildRequest('save', oCalculationVersionToSave);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].ITEMS.length).toBe(2);
			var result = oMockstar.execQuery("select count(*) as count from {{item}} " + "where calculation_version_id="
					+ oCalculationVersionToSave[0].CALCULATION_VERSION_ID);
			expect(helpers.toPositiveInteger(result.columns.COUNT.rows[0])).toBe(2);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				var result = oMockstar.execQuery("select count(*) as count from {{item_ext}} " + "where calculation_version_id="
						+ oCalculationVersionToSave[0].CALCULATION_VERSION_ID);
				expect(helpers.toPositiveInteger(result.columns.COUNT.rows[0])).toBe(2);
			}
		});

		it('should not save a new calculation version with duplicated version name -> returns error message', function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oClonedVersion = getCalculationVersionToSave();
			oClonedVersion[0].CALCULATION_VERSION_NAME = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];

			var oTestCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
			oTestCalculationVersion.CALCULATION_VERSION_ID = 666;
			oMockstar.upsertTableData("calculation_version", oTestCalculationVersion, "CALCULATION_VERSION_ID ="
					+ oClonedVersion[0].CALCULATION_VERSION_ID);

			var oRequest = buildRequest('save-as', oClonedVersion);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
		});

		it('should not save a new calculation version with duplicated version name -> does not save', function() {
			// arrange
			const oCalculationVersionToSave = getCalculationVersionToSave();
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var result = oMockstar.execQuery("select count(*) as count from {{calculation_version}}");
			var iExistingCalculationVersions = result.columns.COUNT.rows[0];

			var oTestCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
			oTestCalculationVersion.CALCULATION_VERSION_ID = 666;
			oMockstar.upsertTableData("calculation_version", oTestCalculationVersion, "CALCULATION_VERSION_ID ="
					+ oCalculationVersionToSave[0].CALCULATION_VERSION_ID);

			oCalculationVersionToSave[0].CALCULATION_VERSION_NAME = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];
			var oRequest = buildRequest('save-as', oCalculationVersionToSave);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			result = oMockstar.execQuery("select count(*) as count from {{calculation_version}}");
			var iExistingCalculationVersionsAfterFail = result.columns.COUNT.rows[0];
			expect(iExistingCalculationVersions).toEqual(iExistingCalculationVersionsAfterFail);
		});

		it('should not save a new calculation version with invalid calculation id referenced -> does not save', function() {
			// arrange
			var result = oMockstar.execQuery("select count(*) as count from {{calculation_version}}");
			var iExistingCalculationVersions = result.columns.COUNT.rows[0];
            const oCalculationVersionToSave = getCalculationVersionToSave()
			oCalculationVersionToSave[0].CALCULATION_ID = 666;
			var oRequest = buildRequest('save-as', oCalculationVersionToSave);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			result = oMockstar.execQuery("select count(*) as count from {{calculation_version}}");
			var iExistingCalculationVersionsAfterFail = result.columns.COUNT.rows[0];
			expect(iExistingCalculationVersions).toEqual(iExistingCalculationVersionsAfterFail);
		});

		it('should not save an existing calculation version with duplicated version name -> returns error', function() {
			// arrange
			// fill calcualtion version table and calculation version temporary with two different
			// version with the same
			// name
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oTestCalculationVersionTemp = mockstart_helpers.convertToObject(testData.oCalculationVersionTemporaryTestData, 0);
			oTestCalculationVersionTemp.CALCULATION_VERSION_ID = 666;
			oMockstar.insertTableData("calculation_version_temporary", oTestCalculationVersionTemp);

			var oTestItemTemp = mockstart_helpers.convertToObject(testData.oItemTemporaryTestData, 0);
			oTestItemTemp.CALCULATION_VERSION_ID = 666;
			oMockstar.insertTableData("item_temporary", oTestItemTemp);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestItemTempExt = mockstart_helpers.convertToObject(testData.oItemTemporaryExtData, 0);
				oTestItemTempExt.CALCULATION_VERSION_ID = 666;
				oMockstar.insertTableData("item_temporary_ext", oTestItemTempExt);
			}

			var oTestCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
			oTestCalculationVersion.CALCULATION_VERSION_ID = 666;
			oTestCalculationVersion.CALCULATION_VERSION_NAME = 'ValidName';
			oMockstar.insertTableData("calculation_version", oTestCalculationVersion);

			oMockstar.insertTableData("open_calculation_versions", {
				SESSION_ID : oTestCalculationVersionTemp.SESSION_ID,
				CALCULATION_VERSION_ID : oTestCalculationVersionTemp.CALCULATION_VERSION_ID,
				IS_WRITEABLE : 1
			});

			var oRequestCvDuplicatedName = _.pick(oTestCalculationVersionTemp, [ "CALCULATION_ID", "CALCULATION_VERSION_ID",
			                                                                     "CALCULATION_VERSION_NAME" ]);
			var oRequest = buildRequest('save', [ oRequestCvDuplicatedName ]);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
		});

		it('should not save (save-as) an existing calculation version with its original version name -> returns error', function() {
			// arrange
			// fill calcualtion version table and calculation version temporary with two different
			// version with the same name
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oTestCalculationVersionTemp = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);

			var oRequestCvSameName = _.pick(oTestCalculationVersionTemp, [ "CALCULATION_ID", "CALCULATION_VERSION_ID",
			                                                               "CALCULATION_VERSION_NAME" ]);
			var oRequest = buildRequest('save-as', [ oRequestCvSameName ]);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
		});
		
		it('should not save a calculation version if it is frozen and return CALCULATIONVERSION_IS_FROZEN_ERROR', function() {
            // prepare calculation version data:
			// the calculation version must be opened in write mode and have the frozen flag set
			// arrange
			var oOpenCalculationVersionsTestData = {
					"SESSION_ID" : sSessionId,
					"CALCULATION_VERSION_ID" : 4810,
					"IS_WRITEABLE" : 1
				};				
			oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionsTestData);
				
			var oFrozenCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
			oFrozenCalculationVersion.CALCULATION_VERSION_ID = 4810;
			oFrozenCalculationVersion.IS_FROZEN = 1;
			oFrozenCalculationVersion.CALCULATION_VERSION_NAME = "Test";
			oMockstar.insertTableData("calculation_version", oFrozenCalculationVersion);
			
			var oRequestCvName = _.pick(oFrozenCalculationVersion, [ "CALCULATION_ID", "CALCULATION_VERSION_ID",
			                                                               "CALCULATION_VERSION_NAME" ]);
			var oRequest = buildRequest('save', [ oRequestCvName ]);
			
			// act: simulate the save operation
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
            
			// assert: check whether the bad request was thrown
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toEqual(1);
			expect(oResponseObject.head.messages[0].code).toEqual("CALCULATIONVERSION_IS_FROZEN_ERROR"); 

		});
		
		it('should save a calculation version of type lifecycle(2) and set calculation_version_type to manual lifecycle(16)', function() {
			// arrange
		   oMockstar.clearTable("calculation_version_temporary");
		   oMockstar.clearTable("open_calculation_versions");
			// prepare calculation version data:
			// the calculation version must be opened in write mode
			let oOpenCalculationVersionsTestData = {
					"SESSION_ID" : sSessionId,
					"CALCULATION_VERSION_ID" : testData.iCalculationVersionId,
					"IS_WRITEABLE" : 1
				};				
			oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionsTestData);
			
			// insert a lifecycle version
			let oLifecycleCalcVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
			oLifecycleCalcVersion.CALCULATION_VERSION_ID = testData.iCalculationVersionId;
			oLifecycleCalcVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.Lifecycle;
			oLifecycleCalcVersion.CALCULATION_VERSION_NAME = "Test";
			oLifecycleCalcVersion.SESSION_ID = sSessionId;
			oLifecycleCalcVersion.MASTER_DATA_TIMESTAMP = testData.sMasterdataTimestampDate;
			oMockstar.insertTableData("calculation_version_temporary", oLifecycleCalcVersion);
			let oRequestCvHeader = _.pick(oLifecycleCalcVersion, [ "CALCULATION_ID", "CALCULATION_VERSION_ID",
			                                                               "CALCULATION_VERSION_NAME" ]);
			let oRequest = buildRequest('save', [ oRequestCvHeader ]);
			
			// act: simulate the save operation
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
            
			// assert: check the error in response 
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages).toBeUndefined();
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_TYPE).toEqual(Constants.CalculationVersionType.ManualLifecycleVersion);
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toEqual(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].LAST_MODIFIED_BY).toEqual(sSessionId);
		});

		it('should save a calculation version of type manual lifecycle(16)', function() {
			// arrange
		   oMockstar.clearTable("calculation_version_temporary");
		   oMockstar.clearTable("open_calculation_versions");
			// prepare calculation version data:
			// the calculation version must be opened in write mode
			let oOpenCalculationVersionsTestData = {
					"SESSION_ID" : sSessionId,
					"CALCULATION_VERSION_ID" : testData.iCalculationVersionId,
					"IS_WRITEABLE" : 1
				};				
			oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionsTestData);
			
			// insert a lifecycle version
			let oLifecycleCalcVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
			oLifecycleCalcVersion.CALCULATION_VERSION_ID = testData.iCalculationVersionId;
			oLifecycleCalcVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.ManualLifecycleVersion;
			oLifecycleCalcVersion.CALCULATION_VERSION_NAME = "Test";
			oLifecycleCalcVersion.SESSION_ID = sSessionId;
			oLifecycleCalcVersion.MASTER_DATA_TIMESTAMP = testData.sMasterdataTimestampDate;
			oMockstar.insertTableData("calculation_version_temporary", oLifecycleCalcVersion);
			let oRequestCvHeader = _.pick(oLifecycleCalcVersion, [ "CALCULATION_ID", "CALCULATION_VERSION_ID",
			                                                               "CALCULATION_VERSION_NAME" ]);
																		   let oRequest = buildRequest('save', [ oRequestCvHeader ]);
			
			// act: simulate the save operation
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
            
			// assert: check the error in response 
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages).toBeUndefined();
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_TYPE).toEqual(Constants.CalculationVersionType.ManualLifecycleVersion);
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toEqual(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].LAST_MODIFIED_BY).toEqual(sSessionId);
		});
		
		it('should not save a calculation version that is a source -> returns error', function() {
			// arrange			
			var iReferenceCalculationVersionId = 4810;
			var oReferencedCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTemporaryTestData, 1);
			oReferencedCalculationVersion.CALCULATION_VERSION_ID = iReferenceCalculationVersionId;
			oReferencedCalculationVersion.CALCULATION_ID = 1978;
			oMockstar.insertTableData("calculation_version_temporary", oReferencedCalculationVersion);
			
			var oReferencedItem = mockstart_helpers.convertToObject(testData.oItemTestData, 1);
			oReferencedItem.ITEM_ID = 4444;
			oReferencedItem.REFERENCED_CALCULATION_VERSION_ID = iReferenceCalculationVersionId;
			oReferencedItem.ITEM_CATEGORY_ID = 10;
			oMockstar.insertTableData("item", oReferencedItem);
			
			var oOpenCalculationVersionsTestData = {
					"SESSION_ID" : sSessionId,
					"CALCULATION_VERSION_ID" : iReferenceCalculationVersionId,
					"IS_WRITEABLE" : 1
				};	
			oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionsTestData);
			
			
			var oRequestCvSource = _.pick(oReferencedCalculationVersion, [ "CALCULATION_ID", "CALCULATION_VERSION_ID",
			                                                                     "CALCULATION_VERSION_NAME" ]);
			var oRequest = buildRequest('save', [ oRequestCvSource ]);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			//check that the error code is the expected one
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toEqual(1);
			expect(oResponseObject.head.messages[0].code).toEqual("CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR");
		});
		
		it('should return an empty array for ITEM if omitItems is set to true (save)', function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oExistingVersion = JSON.parse(JSON.stringify(getCalculationVersionToSave()));
			oExistingVersion[0].CALCULATION_VERSION_NAME = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];
			var oRequest = buildRequest('save', oExistingVersion, true);
			oRequest.parameters = oRequest.parameters.filter(function(obj) {
				return obj.name !== "compressedResult";
			});

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

			// assert
			expect(oResponseStub.status).toBe($.net.http.OK);
			const oResponseBody = oResponseStub.getParsedBody();
			expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(iCalculationVersionID);
			expect(oResponseBody.body.transactionaldata[0].ITEMS).toEqual(aEmptyArray);
		});

		it('should return an empty array for ITEM if omitItems is set to true (save-as)', function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			var oExistingVersion = JSON.parse(JSON.stringify(getCalculationVersionToSave()));
			oExistingVersion[0].CALCULATION_VERSION_NAME = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0] + "(2)";
			oExistingVersion[0].CALCULATION_ID = testData.iCalculationId;
			var oRequest = buildRequest('save-as', oExistingVersion, true);
			oRequest.parameters = oRequest.parameters.filter(function(obj) {
				return obj.name !== "compressedResult";
			});

			// act
			new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

			// assert
			expect(oResponseStub.status).toBe($.net.http.OK);
			const oResponseBody = oResponseStub.getParsedBody();
			expect(oResponseBody.body.transactionaldata[0].ITEMS).toEqual(aEmptyArray);
		});
		
		it("should not add new variants when save-as an existing calculation version of other type than variant base", function() {
			// arrange
			const oCalculationVersionVariantBase = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
			const oVariantBaseVersion = new TestDataUtility(oCalculationVersionVariantBase).build();
			oVariantBaseVersion.CALCULATION_VERSION_TYPE = 1;
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oVariantBaseVersion);

			const sGetVariantsStmt = "select * from {{variant}}";
			const iAllVariantsBeforeCopy = oMockstar.execQuery(sGetVariantsStmt).columns.VARIANT_ID.rows.length;
			const sGetVariantItemsStmt = "select * from {{variant_item}}";
			const iAllVariantItemsBeforeCopy = oMockstar.execQuery(sGetVariantItemsStmt).columns.VARIANT_ID.rows.length;
			
			const oRequest = buildRequest('save-as', getCalculationVersionToSave());
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			// assert
			const iAllVariantsAfterCopy = oMockstar.execQuery(sGetVariantsStmt).columns.VARIANT_ID.rows.length;
			const iAllVariantItemsAfterCopy = oMockstar.execQuery(sGetVariantItemsStmt).columns.ITEM_ID.rows.length;
			expect(iAllVariantsAfterCopy).toBe(iAllVariantsBeforeCopy);
			expect(iAllVariantItemsAfterCopy).toBe(iAllVariantItemsBeforeCopy);
		});
		
		it("should not add new variants when save-as an existing calculation version that has variants", function() {
			// arrange
			const oCalculationVersionVariantBase = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
			const oVariantBaseVersion = new TestDataUtility(oCalculationVersionVariantBase).build();
			oVariantBaseVersion.CALCULATION_VERSION_TYPE = 4;
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oVariantBaseVersion);

			const sGetVariantsStmt = "select * from {{variant}}";
			const iAllVariantsBeforeCopy = oMockstar.execQuery(sGetVariantsStmt).columns.VARIANT_ID.rows.length;
			const sGetVariantItemsStmt = "select * from {{variant_item}}";
			const iAllVariantItemsBeforeCopy = oMockstar.execQuery(sGetVariantItemsStmt).columns.VARIANT_ID.rows.length;

			const oRequest = buildRequest('save-as', getCalculationVersionToSave());
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			// assert
			const iAllVariantsAfterCopy = oMockstar.execQuery(sGetVariantsStmt).columns.VARIANT_ID.rows.length;
			const iAllVariantItemsAfterCopy = oMockstar.execQuery(sGetVariantItemsStmt).columns.ITEM_ID.rows.length;
			expect(iAllVariantsBeforeCopy).toBeGreaterThan(0);
			expect(iAllVariantsAfterCopy).toBe(iAllVariantsBeforeCopy);
			expect(iAllVariantItemsAfterCopy).toBe(iAllVariantItemsBeforeCopy);
		});
		
		it("should save-as a new version with CALCULATION_VERSION_TYPE normal(1) if the source version is of type variant base (4)", function() {
			// arrange
			const oCalculationVersionVariantBase = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
			const oVariantBaseVersion = new TestDataUtility(oCalculationVersionVariantBase).build();
			oVariantBaseVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.VariantBase;
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oVariantBaseVersion);

			const oRequest = buildRequest('save-as', getCalculationVersionToSave());
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			// assert
		    const oResponseVersion = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]).body.transactionaldata[0];
			expect(oResponseVersion.CALCULATION_VERSION_TYPE).toBe(Constants.CalculationVersionType.Base);
		});
	});

	describe('Open Calculation Versions', function() {

		beforeEach(function() {
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oMockstar.clearAllTables();
			oMockstar.insertTableData("item", testData.oItemTestData);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("session", testData.oSessionTestData);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_ext", testData.oItemExtData);
			}

			oMockstar.initializeData();
		});

		afterEach(function() {
		});

		function buildOpenRequest(iCalculationVersionId) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : iCalculationVersionId
			}, {
				"name" : "calculate",
				"value" : "false"
			}, {
				"name" : "loadMasterdata",
				"value" : "true"
			}, {
				"name" : "compressedResult",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name
				}).value;
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
			return oRequest;
		}

		it('should open a calculation version that is not opened by others already -> returns calculation version incl. prices', function() {

			oMockstar.clearTable("calculation_version");
			const calculationVersionData = _.extend(JSON.parse(JSON.stringify(testData.oCalculationVersionTestData)), {
				"STATUS_ID" : [ 'ACTIVE', 'ACTIVE', 'ACTIVE' ]
			});
			oMockstar.insertTableData("calculation_version", calculationVersionData);

			// arrange
			var oRequest = buildOpenRequest(testData.iCalculationVersionId);
			var iExpectedDirtyFlag = 0;
			var iExpectedLockFlag = 1;
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);
			// TODO: enable checks after checks for all required fields (D051458)
			
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].STATUS_ID).toBe('ACTIVE');
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toBe(iExpectedDirtyFlag);
			expect(oResponseObject.body.transactionaldata[0].IS_WRITEABLE).toBe(iExpectedLockFlag);
			expect(oResponseObject.body.transactionaldata[0].MATERIAL_PRICE_STRATEGY_ID).toBe(testData.oCalculationVersionTestData.MATERIAL_PRICE_STRATEGY_ID[0]);
			expect(oResponseObject.body.transactionaldata[0].ACTIVITY_PRICE_STRATEGY_ID).toBe(testData.oCalculationVersionTestData.ACTIVITY_PRICE_STRATEGY_ID[0]);
			// check if prices are delivered
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE).toEqual(testData.oItemTestData.PRICE[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_FIXED_PORTION).toEqual(
					testData.oItemTestData.PRICE_FIXED_PORTION[1].toString());

			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_VARIABLE_PORTION).toEqual(
					testData.oItemTestData.PRICE_VARIABLE_PORTION[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].TRANSACTION_CURRENCY_ID).toEqual(
					testData.oItemTestData.TRANSACTION_CURRENCY_ID[1]);
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_UNIT).toEqual(testData.oItemTestData.PRICE_UNIT[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_UNIT_UOM_ID).toEqual(testData.oItemTestData.PRICE_UNIT_UOM_ID[1]);

			// check if TOTAL_COST, TOTAL_QUANTITY and TOTAL_QUANTITY_UOM_ID are delivered (required only in Backend API)
			expect(oResponseObject.body.transactionaldata[0].TOTAL_COST).toBe(testData.oItemTestData.TOTAL_COST[1]);
			expect(oResponseObject.body.transactionaldata[0].TOTAL_QUANTITY).toBe(testData.oItemTestData.TOTAL_QUANTITY[1]);
			expect(oResponseObject.body.transactionaldata[0].TOTAL_QUANTITY_UOM_ID).toBe(testData.oItemTestData.TOTAL_QUANTITY_UOM_ID[1]);
		});
				
		it('should open a calculation version that is not opened by others already in read mode because user has only READ instance-based privilege', function() {
			// arrange
			var oRequest = buildOpenRequest(testData.iCalculationVersionId);
			var iExpectedDirtyFlag = 0;
			var iExpectedLockFlag = 0;
			// change instance-based privilege of the user from CREATE_EDIT to READ
			oMockstar.clearTable("authorization");
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toBe(iExpectedDirtyFlag);
			expect(oResponseObject.body.transactionaldata[0].IS_WRITEABLE).toBe(iExpectedLockFlag);

			// check if prices are delivered
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE).toEqual(testData.oItemTestData.PRICE[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_FIXED_PORTION).toEqual(
					testData.oItemTestData.PRICE_FIXED_PORTION[1].toString());

			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_VARIABLE_PORTION).toEqual(
					testData.oItemTestData.PRICE_VARIABLE_PORTION[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].TRANSACTION_CURRENCY_ID).toEqual(
					testData.oItemTestData.TRANSACTION_CURRENCY_ID[1]);
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_UNIT).toEqual(testData.oItemTestData.PRICE_UNIT[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_UNIT_UOM_ID).toEqual(testData.oItemTestData.PRICE_UNIT_UOM_ID[1]);

			// check if TOTAL_COST, TOTAL_QUANTITY and TOTAL_QUANTITY_UOM_ID are delivered (required only in Backend API)
			expect(oResponseObject.body.transactionaldata[0].TOTAL_COST).toBe(testData.oItemTestData.TOTAL_COST[1]);
			expect(oResponseObject.body.transactionaldata[0].TOTAL_QUANTITY).toBe(testData.oItemTestData.TOTAL_QUANTITY[1]);
			expect(oResponseObject.body.transactionaldata[0].TOTAL_QUANTITY_UOM_ID).toBe(testData.oItemTestData.TOTAL_QUANTITY_UOM_ID[1]);
		});
		
		it('should not open a calculation version because the user does not have an instance-based privilege => throw GENERAL_ACCESS_DENIED', function() {
			// arrange
			var oRequest = buildOpenRequest(testData.iCalculationVersionId);
			var iExpectedDirtyFlag = 0;
			var iExpectedLockFlag = 0;
			// delete all instance-based privileges
			oMockstar.clearTable("authorization");
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe(messageCode.GENERAL_ACCESS_DENIED.responseCode);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		});

		it('should re-open a calculation version that is opened by others in R/W and by the current user in read-only -> returns calculation version', function() {
			// arrange
			var oRequest = buildOpenRequest(testData.iCalculationVersionId);
			var iExpectedDirtyFlag = 0;
			var iExpectedLockFlag = 0;
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			oMockstar.execSingle("UPDATE {{open_calculation_versions}} SET SESSION_ID = 'test'");
			oMockstar.execSingle("UPDATE {{calculation_version_temporary}} SET SESSION_ID = 'test'");
			oMockstar.execSingle("UPDATE {{item_temporary}} SET SESSION_ID = 'test'");
			oMockstar.execSingle("insert into {{session}} values('test','tester','DE','" + testData.sExpectedDate + "')");
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.execSingle("UPDATE {{item_temporary_ext}} SET SESSION_ID = 'test'");
			}

			var atemp = oMockstar.execQuery("select * from {{open_calculation_versions}}");
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			var btemp = oMockstar.execQuery("select * from {{open_calculation_versions}}");

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
			// TODO: enable checks after checks for all required fields (D051458)

			// check version properties
			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toBe(iExpectedDirtyFlag);
			expect(oResponseObject.body.transactionaldata[0].IS_WRITEABLE).toBe(iExpectedLockFlag);
            
            // check messages
			expect(oResponseObject.head.messages[0].code).toBe("ENTITY_NOT_WRITEABLE_INFO");
			expect(oResponseObject.head.messages[0].details.notWriteableEntityDetailsObj).toBe(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_BY_ANOTHER_USER);
		});
		
		it('should open a calculation version that is a source version in read-only -> returns calculation version', function() {
			// arrange
			var oItemReferencedVersion = mockstart_helpers.convertToObject(testData.oItemTestData, 4);
			oItemReferencedVersion.ITEM_ID = 7777;
			oItemReferencedVersion.REFERENCED_CALCULATION_VERSION_ID = testData.iCalculationVersionId;
			oMockstar.insertTableData("item", oItemReferencedVersion);
			var oRequest = buildOpenRequest(testData.iCalculationVersionId);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].IS_WRITEABLE).toBe(0);
			// check header field
			expect(oResponseObject.head.messages[0].code).toBe("ENTITY_NOT_WRITEABLE_INFO");
			expect(oResponseObject.head.messages[0].details.notWriteableEntityDetailsObj).toBe(MessageLibrary.NotWriteableEntityDetailsCode.IS_SOURCE);

		});

		it('should open a calculation version -> the custom fields should be in response', function() {
			// arrange
			var oRequest = buildOpenRequest(testData.iCalculationVersionId);
			var iExpectedDirtyFlag = 0;
			var iExpectedLockFlag = 1;
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toBe(iExpectedDirtyFlag);
			expect(oResponseObject.body.transactionaldata[0].IS_WRITEABLE).toBe(iExpectedLockFlag);

            var oItemTemporaryTestDataClone = _.cloneDeep(testData.oItemTemporaryTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
	    		oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone,testData.oItemTemporaryExtData),testData.aCalculatedCustomFields);
            }
            var oExpectedItemData = JSON.parse(JSON.stringify(oItemTemporaryTestDataClone));
            _.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-2);});

            expect(oResponseObject.body.transactionaldata[0].ITEMS).toMatchData(oExpectedItemData, ["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID"]);

		});

		it('should contain costing sheet and component split in the opened version -> are contained in return object', function() {
			// arrange
			oMockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
			oMockstar.insertTableData("component_split", testData.oComponentSplitTest);
			oMockstar.insertTableData("component_split_account_group", testData.componentSplitAccountGroupTestDataPlc);
			var oRequest = buildOpenRequest(testData.iCalculationVersionId);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// assert
			var oCalculationVersion = oResponseObject.body;
			expect(oCalculationVersion.masterdata.COSTING_SHEET_ENTITIES[0].COSTING_SHEET_ID).toBe(oCalculationVersion.transactionaldata[0].COSTING_SHEET_ID);
			expect(_.isArray(oCalculationVersion.masterdata.COSTING_SHEET_ROW_ENTITIES)).toBe(true);
			expect(oCalculationVersion.masterdata.COSTING_SHEET_ROW_ENTITIES.length).toBeGreaterThan(0);
			expect(oCalculationVersion.masterdata.COMPONENT_SPLIT_ENTITIES[0].COMPONENT_SPLIT_ID).toBe(oCalculationVersion.transactionaldata[0].COMPONENT_SPLIT_ID);
			expect(_.isArray(oCalculationVersion.masterdata.SELECTED_ACCOUNT_GROUPS_ENTITIES)).toBe(true);
			expect(oCalculationVersion.masterdata.SELECTED_ACCOUNT_GROUPS_ENTITIES.length).toBeGreaterThan(0);
		});
		
		it('should insert in recent calculation versions table when opening a calculation version', function() {
			// arrange
			var oRequest = buildOpenRequest(testData.iCalculationVersionId);
            expect(mockstart_helpers.getRowCount(oMockstar, "recent_calculation_versions")).toBe(0);
            
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
            expect(mockstart_helpers.getRowCount(oMockstar, "recent_calculation_versions")).toBe(1);
		});	

		it('should open a frozen calculation version => return version in read-only mode with transactional data', function() {
			// arrange
			var oRequest = buildOpenRequest(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);

			var oFrozenCalculationVersionTestData =  new TestDataUtility(testData.oCalculationVersionTestData).build();
			
			// Freeze the first calculation version
			oFrozenCalculationVersionTestData.IS_FROZEN[0] = 1;
			
			// Load modified test data into mocked data set
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oFrozenCalculationVersionTestData);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toBe(0);
			expect(oResponseObject.body.transactionaldata[0].IS_WRITEABLE).toBe(0);

			// check header fields
			expect(oResponseObject.head.messages[0].code).toBe("ENTITY_NOT_WRITEABLE_INFO");
			expect(oResponseObject.head.messages[0].details.notWriteableEntityDetailsObj).toBe(MessageLibrary.NotWriteableEntityDetailsCode.IS_FROZEN);

			// check if prices are delivered correctly
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE).toEqual(testData.oItemTestData.PRICE[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_FIXED_PORTION).toEqual(
					testData.oItemTestData.PRICE_FIXED_PORTION[1].toString());

			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_VARIABLE_PORTION).toEqual(
					testData.oItemTestData.PRICE_VARIABLE_PORTION[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].TRANSACTION_CURRENCY_ID).toEqual(
					testData.oItemTestData.TRANSACTION_CURRENCY_ID[1]);
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_UNIT).toEqual(testData.oItemTestData.PRICE_UNIT[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS[1].PRICE_UNIT_UOM_ID).toEqual(testData.oItemTestData.PRICE_UNIT_UOM_ID[1]);

			// check if TOTAL_COST, TOTAL_QUANTITY and TOTAL_QUANTITY_UOM_ID are delivered (required only in Backend API)
			expect(oResponseObject.body.transactionaldata[0].TOTAL_COST).toBe(testData.oItemTestData.TOTAL_COST[1]);
			expect(oResponseObject.body.transactionaldata[0].TOTAL_QUANTITY).toBe(testData.oItemTestData.TOTAL_QUANTITY[1]);
			expect(oResponseObject.body.transactionaldata[0].TOTAL_QUANTITY_UOM_ID).toBe(testData.oItemTestData.TOTAL_QUANTITY_UOM_ID[1]);
		});
		
		it('should open a frozen calculation version => return saved calculation results for version', function() {
			// arrange
			var iCalcVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
			// prepare request with calculating results for frozen version
			var params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : iCalcVersionId
			}, {
				"name" : "calculate",
				"value" : "true"
			}, {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
			    "name" : "compressedResult",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name;
				}).value;
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
			

			var oFrozenCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);		
			// Freeze calculation version
			oFrozenCalculationVersionTestData.IS_FROZEN = 1;
			
			var oItemCalculatedValues = new TestDataUtility(testData.oItemCalculatedTestData).getObject(0); 			
			var oItemCalculatedValuesCostingSheet = new TestDataUtility(testData.oItemCalculatedValuesCostingSheet).getObject(0);
			var oItemCalculatedValuesComponentSplit = new TestDataUtility(testData.oItemCalculatedValuesComponentSplit).getObject(0);
					
			// Load modified test data into mocked data set
			oMockstar.clearTables("calculation_version", "item", "item_calculated_values_costing_sheet", "item_calculated_values_component_split", "item_ext");
			oMockstar.insertTableData("calculation_version", oFrozenCalculationVersionTestData);
			
			oMockstar.insertTableData("item", oItemCalculatedValues);
			oMockstar.insertTableData("item_calculated_values_costing_sheet", oItemCalculatedValuesCostingSheet);
			oMockstar.insertTableData("item_calculated_values_component_split", oItemCalculatedValuesComponentSplit);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			var oResponseCalculated = oResponseObject.body.calculated;
            // Only selected properties of saved calculation results should be returned in "calculated" section of response
            let oItemCalculatedValuesClone = _.extend(oItemCalculatedValues, {
                PRICE_FOR_TOTAL_QUANTITY2: null,
                PRICE_FOR_TOTAL_QUANTITY2_FIXED_PORTION: null,
                PRICE_FOR_TOTAL_QUANTITY2_VARIABLE_PORTION: null,
                PRICE_FOR_TOTAL_QUANTITY3: null,
                PRICE_FOR_TOTAL_QUANTITY3_FIXED_PORTION: null,
                PRICE_FOR_TOTAL_QUANTITY3_VARIABLE_PORTION: null,
                TOTAL_COST2: null,
                TOTAL_COST2_FIXED_PORTION: null,
                TOTAL_COST2_VARIABLE_PORTION: null,
                TOTAL_COST3: null,
                TOTAL_COST3_FIXED_PORTION: null,
                TOTAL_COST3_VARIABLE_PORTION: null,
                TOTAL_COST2_PER_UNIT_FIXED_PORTION: null,
                TOTAL_COST2_PER_UNIT_VARIABLE_PORTION: null,
                TOTAL_COST2_PER_UNIT: null,
                TOTAL_COST3_PER_UNIT_FIXED_PORTION: null,
                TOTAL_COST3_PER_UNIT_VARIABLE_PORTION: null,
                TOTAL_COST3_PER_UNIT: null
            });	
			var oExpectedCalculatedFields = _.pick(oItemCalculatedValuesClone, ['ITEM_ID', 'BASE_QUANTITY' ,'QUANTITY', 'TOTAL_QUANTITY', 'TOTAL_QUANTITY_UOM_ID', 'PRICE_UNIT', 'TARGET_COST', 
			           					                                'LOT_SIZE', 'PRICE_FIXED_PORTION', 'PRICE_VARIABLE_PORTION', 
																		'PRICE_FOR_TOTAL_QUANTITY', 'PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION', 'PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION', 
																		'PRICE_FOR_TOTAL_QUANTITY2', 'PRICE_FOR_TOTAL_QUANTITY2_FIXED_PORTION', 'PRICE_FOR_TOTAL_QUANTITY2_VARIABLE_PORTION', 
																		'PRICE_FOR_TOTAL_QUANTITY3', 'PRICE_FOR_TOTAL_QUANTITY3_FIXED_PORTION', 'PRICE_FOR_TOTAL_QUANTITY3_VARIABLE_PORTION',
			        					                                'OTHER_COST', 'OTHER_COST_FIXED_PORTION', 'OTHER_COST_VARIABLE_PORTION', 
																		'TOTAL_COST', 'TOTAL_COST_FIXED_PORTION', 'TOTAL_COST_VARIABLE_PORTION',
                                                                        'TOTAL_COST2', 'TOTAL_COST2_FIXED_PORTION', 'TOTAL_COST2_VARIABLE_PORTION',
																		'TOTAL_COST3', 'TOTAL_COST3_FIXED_PORTION', 'TOTAL_COST3_VARIABLE_PORTION',
																		'TOTAL_COST_PER_UNIT', 'TOTAL_COST_PER_UNIT_FIXED_PORTION', 'TOTAL_COST_PER_UNIT_VARIABLE_PORTION',
																		'TOTAL_COST2_PER_UNIT', 'TOTAL_COST2_PER_UNIT_FIXED_PORTION', 'TOTAL_COST2_PER_UNIT_VARIABLE_PORTION',
																		'TOTAL_COST3_PER_UNIT', 'TOTAL_COST3_PER_UNIT_FIXED_PORTION', 'TOTAL_COST3_PER_UNIT_VARIABLE_PORTION']);
			expect(oResponseCalculated.ITEM_CALCULATED_FIELDS[0]).toEqualObject(oExpectedCalculatedFields, ['ITEM_ID']);
                    
            let oItemCalculatedValuesCostingSheetClone = _.extend(oItemCalculatedValuesCostingSheet, {
                "COST2_FIXED_PORTION" : '0.0000000',
                "COST2_VARIABLE_PORTION" : '0.0000000',
                "COST3_FIXED_PORTION" : '0.0000000',
                "COST3_VARIABLE_PORTION" : '0.0000000'
            });
			expect(oResponseCalculated.ITEM_CALCULATED_VALUES_COSTING_SHEET).toEqualObject(
					[_.pick(oItemCalculatedValuesCostingSheetClone, ['ITEM_ID', 'COSTING_SHEET_ROW_ID', 'IS_ROLLED_UP_VALUE', 'HAS_SUBITEMS', 'COST_FIXED_PORTION', 'COST_VARIABLE_PORTION', 'COST2_FIXED_PORTION', 'COST2_VARIABLE_PORTION', 'COST3_FIXED_PORTION', 'COST3_VARIABLE_PORTION'])
					], ['ITEM_ID']);
            
            let oItemCalculatedValuesComponentSplitClone = _.extend(oItemCalculatedValuesComponentSplit, {
                "COST2_FIXED_PORTION" : '0.0000000',
                "COST2_VARIABLE_PORTION" : '0.0000000',
                "COST3_FIXED_PORTION" : '0.0000000',
                "COST3_VARIABLE_PORTION" : '0.0000000'
            });
			expect(oResponseCalculated.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT).toEqualObject(
					[_.pick(oItemCalculatedValuesComponentSplitClone, ['ITEM_ID', 'COMPONENT_SPLIT_ID', 'COST_COMPONENT_ID', 'COST_FIXED_PORTION', 'COST_VARIABLE_PORTION', 'COST2_FIXED_PORTION', 'COST2_VARIABLE_PORTION', 'COST3_FIXED_PORTION', 'COST3_VARIABLE_PORTION'])
			        ], ['ITEM_ID']);
		});
		
		it('should open a frozen calculation version with item compressed', function() {
			// arrange
			var iCalcVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
			// prepare request with calculating results for frozen version
			var params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : iCalcVersionId
			}, {
				"name" : "calculate",
				"value" : "true"
			}, {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
			    "name" : "compressedResult",
				"value" : "true"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name;
				}).value;
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
			

			var oFrozenCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);		
			// Freeze calculation version
			oFrozenCalculationVersionTestData.IS_FROZEN = 1;
			var oItemTestData = testData.oItemTestData;
			oItemTestData.TOTAL_COST[0] = 20;
			oMockstar.clearTables("calculation_version", "item");
			oMockstar.insertTableData("calculation_version", oFrozenCalculationVersionTestData);
			oMockstar.insertTableData("item", oItemTestData);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			var oResponseBodyTransactional = oResponseObject.body.transactionaldata;
			// Only selected properties of saved calculation results should be returned in "calculated" section of response	
			var oFields = _.pick(oResponseBodyTransactional[0].ITEMS_COMPRESSED, ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'ITEM_CATEGORY_ID']);
			expect(oResponseBodyTransactional[0].ITEMS.length).toBe(0);
	                
			expect(oFields).toEqualObject(
					   {'ITEM_ID': [3001, 3002, 3003],
						'PARENT_ITEM_ID': [null, 3001, 3002],
						'PREDECESSOR_ITEM_ID': [null, 3001, 3002],
						'ITEM_CATEGORY_ID': [0, 1, 3]}, ['ITEM_ID']);
		});
		
		it('should open a lifecyle calculation version in write mode', function() {
			// arrange
		    const iLifecycleCvId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
			let aVersionTypes = _.map(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID, (iCvId, iIndex) => iCvId === iLifecycleCvId ? 2 : 1);
			let oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("CALCULATION_VERSION_TYPE", aVersionTypes).build();
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oCvTestData);
			
			// prepare request with calculating results for frozen version
			let params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : iLifecycleCvId
			}, {
				"name" : "calculate",
				"value" : "true"
			}, {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
				"name" : "compressedResult",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name;
				}).value;
			};
			let oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
					
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			
			let bContainsNotWritableInfo = _.some(oResponseObject.head.messages, oMessage => oMessage.code === messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
			expect(bContainsNotWritableInfo).toBe(false);			
		});

		it('should open a manual lifecyle calculation version in write mode', function() {
			// arrange
			const iLifecycleCvId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
			let aVersionTypes = _.map(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID, (iCvId, iIndex) => iCvId === iLifecycleCvId ? 16 : 1);
			let oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("CALCULATION_VERSION_TYPE", aVersionTypes).build();
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oCvTestData);
			
			// prepare request with calculating results for frozen version
			let params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : iLifecycleCvId
			}, {
				"name" : "calculate",
				"value" : "true"
			}, {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
				"name" : "compressedResult",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name;
				}).value;
			};
			let oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
					
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			
			let bContainsNotWritableInfo = _.some(oResponseObject.head.messages, oMessage => oMessage.code === messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
			expect(bContainsNotWritableInfo).toBe(false);			
		});

		it('should not open a manual lifecyle calculation version if a re-generation is in progress and the project is not editable, throw error GENERAL_ENTITY_NOT_CURRENT_ERROR', function() {
			// arrange
			let iLifecycleCvId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
			let aVersionTypes = _.map(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID, (iCvId, iIndex) => iCvId === iLifecycleCvId ? 16 : 1);
			let oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("CALCULATION_VERSION_TYPE", aVersionTypes).build();
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oCvTestData);
            oMockstar.insertTableData("calculation", testData.oCalculationTestData[0]);
			oMockstar.insertTableData("task", {
				TASK_ID: 12345678,
				SESSION_ID : "other_user",
				TASK_TYPE: TaskType.CALCULATE_LIFECYCLE_VERSIONS,
				PARAMETERS: JSON.stringify({
					PROJECT_ID: "PR1"
				}),
				STATUS: TaskStatus.ACTIVE
			});

			oMockstar.insertTableData("open_projects", 
						{
							"SESSION_ID":  "other_user",
							"PROJECT_ID":  "PR1",
							"IS_WRITEABLE": 1
						}
				);
			// prepare request 
			let params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : iLifecycleCvId
			}, {
				"name" : "calculate",
				"value" : "true"
			}, {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
				"name" : "compressedResult",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name;
				}).value;
			};
			let oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
					
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			
			let bContainsNotWritableInfo = _.some(oResponseObject.head.messages, oMessage => oMessage.code === messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
			expect(bContainsNotWritableInfo).toBe(false);
			
			requestAndCheckDbNotChangedAndException(oRequest, iLifecycleCvId, messageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR);
		});

		it('should not open a manual lifecyle calculation version if a re-generation is in progress and the project is editable, throw error GENERAL_ENTITY_NOT_CURRENT_ERROR', function() {
			// arrange
			let iLifecycleCvId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
			let aVersionTypes = _.map(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID, (iCvId, iIndex) => iCvId === iLifecycleCvId ? 16 : 1);
			let oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("CALCULATION_VERSION_TYPE", aVersionTypes).build();
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oCvTestData);
            oMockstar.insertTableData("calculation", testData.oCalculationTestData[0]);
			oMockstar.insertTableData("task", {
				TASK_ID: 12345678,
				SESSION_ID : "other_user",
				TASK_TYPE: TaskType.CALCULATE_LIFECYCLE_VERSIONS,
				PARAMETERS: JSON.stringify({
					PROJECT_ID: "PR1"
				}),
				STATUS: TaskStatus.ACTIVE
			});

			// prepare request 
			let params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : iLifecycleCvId
			}, {
				"name" : "calculate",
				"value" : "true"
			}, {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
				"name" : "compressedResult",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name;
				}).value;
			};
			let oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
					
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			
			let bContainsNotWritableInfo = _.some(oResponseObject.head.messages, oMessage => oMessage.code === messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
			expect(bContainsNotWritableInfo).toBe(false);
			
			requestAndCheckDbNotChangedAndException(oRequest, iLifecycleCvId, messageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR);
		});

		it('should not open a lifecyle calculation version if a re-generation is in progress and the project is editable, throw error GENERAL_ENTITY_NOT_CURRENT_ERROR', function() {
			// arrange
			let iLifecycleCvId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
			let aVersionTypes = _.map(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID, (iCvId, iIndex) => iCvId === iLifecycleCvId ? 2 : 1);
			let oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("CALCULATION_VERSION_TYPE", aVersionTypes).build();
			oMockstar.clearTable("calculation_version");
			oMockstar.insertTableData("calculation_version", oCvTestData);
            oMockstar.insertTableData("calculation", testData.oCalculationTestData[0]);
			oMockstar.insertTableData("task", {
				TASK_ID: 12345678,
				SESSION_ID : "other_user",
				TASK_TYPE: TaskType.CALCULATE_LIFECYCLE_VERSIONS,
				PARAMETERS: JSON.stringify({
					PROJECT_ID: "PR1"
				}),
				STATUS: TaskStatus.ACTIVE
			});

			// prepare request 
			let params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : iLifecycleCvId
			}, {
				"name" : "calculate",
				"value" : "true"
			}, {
				"name" : "loadMasterdata",
				"value" : "false"
			}, {
				"name" : "compressedResult",
				"value" : "false"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name;
				}).value;
			};
			let oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
					
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			
			let bContainsNotWritableInfo = _.some(oResponseObject.head.messages, oMessage => oMessage.code === messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
			expect(bContainsNotWritableInfo).toBe(false);
			
			requestAndCheckDbNotChangedAndException(oRequest, iLifecycleCvId, messageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR);
		});
		
		it('should return all the referenced version related data for a master version', function() {
			// arrange
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
			oMockstar.insertTableData("project",testData.oProjectCurrencyTestData);
			oMockstar.insertTableData("controlling_area",testData.oControllingAreaTestDataPlc);
			var sExpectedDate = new Date().toJSON();
            oMockstar.insertTableData("item", {
					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
					"CALCULATION_VERSION_ID" : [2810, 2810, 2, 4811, 2810],
					"PARENT_ITEM_ID" : [ null, 3001, 3001, null, 3001],
					"PREDECESSOR_ITEM_ID" : [ null, 3001, null, null, 3002],
					"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
					"ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
					"CHILD_ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
					"REFERENCED_CALCULATION_VERSION_ID": [null, 2809, 4, null, 5809],
					"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
					"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
					"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
					"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
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
			
		    var oRequest = buildOpenRequest(2810);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);
			expect(oResponseObject.body.referencesdata.PROJECTS.length).toBe(2);
			expect(oResponseObject.body.referencesdata.CALCULATIONS.length).toBe(2);
			expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS.length).toBe(2);
			expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
			expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS[1].ITEMS.length).toBe(1);
			expect(oResponseObject.body.referencesdata.MASTERDATA.CONTROLLING_AREA_ENTITIES.length).toBe(1);
			expect(oResponseObject.body.referencesdata.MASTERDATA.COSTING_SHEET_ENTITIES.length).toBe(1);
			expect(oResponseObject.body.referencesdata.MASTERDATA.COMPONENT_SPLIT_ENTITIES.length).toBe(1);
		});
		
		it('should open a calculation version that is not opened by others already and return the items compressed', function() {
			// arrange
			var params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : testData.iCalculationVersionId
			}, {
				"name" : "calculate",
				"value" : "false"
			}, {
				"name" : "loadMasterdata",
				"value" : "true"
			}, {
				"name" : "compressedResult",
				"value" : "true"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name
				}).value;
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
			var oItemTestData = testData.oItemTestData;
			oItemTestData.TOTAL_COST[0] = '20.0000000';
			oMockstar.clearTables("item");
			oMockstar.insertTableData("item", oItemTestData);
			var iExpectedDirtyFlag = 0;
			var iExpectedLockFlag = 0;
			// change instance-based privilege of the user from CREATE_EDIT to READ
			oMockstar.clearTable("authorization");
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toBe(iExpectedDirtyFlag);
			expect(oResponseObject.body.transactionaldata[0].IS_WRITEABLE).toBe(iExpectedLockFlag);
			expect(oResponseObject.body.transactionaldata[0].ITEMS.length).toBe(0);

			// check if prices are delivered
			expect(oResponseObject.body.transactionaldata[0].ITEMS_COMPRESSED.PRICE[1]).toEqual(oItemTestData.PRICE[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS_COMPRESSED.PRICE_FIXED_PORTION[1]).toEqual(
					oItemTestData.PRICE_FIXED_PORTION[1].toString());

			expect(oResponseObject.body.transactionaldata[0].ITEMS_COMPRESSED.PRICE_VARIABLE_PORTION[1]).toEqual(
					oItemTestData.PRICE_VARIABLE_PORTION[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS_COMPRESSED.TRANSACTION_CURRENCY_ID[1]).toEqual(
					oItemTestData.TRANSACTION_CURRENCY_ID[1]);
			expect(oResponseObject.body.transactionaldata[0].ITEMS_COMPRESSED.PRICE_UNIT[1]).toEqual(oItemTestData.PRICE_UNIT[1].toString());
			expect(oResponseObject.body.transactionaldata[0].ITEMS_COMPRESSED.PRICE_UNIT_UOM_ID[1]).toEqual(oItemTestData.PRICE_UNIT_UOM_ID[1]);

			// check if TOTAL_COST, TOTAL_QUANTITY and TOTAL_QUANTITY_UOM_ID are delivered (required only in Backend API)
			expect(oResponseObject.body.transactionaldata[0].TOTAL_COST).toBe(oItemTestData.TOTAL_COST[0]);
			expect(oResponseObject.body.transactionaldata[0].TOTAL_QUANTITY).toBe(oItemTestData.TOTAL_QUANTITY[0]);
			expect(oResponseObject.body.transactionaldata[0].TOTAL_QUANTITY_UOM_ID).toBe(oItemTestData.TOTAL_QUANTITY_UOM_ID[0]);
		});

		it('should set is dirty to true for calculation version which has a dirty item in t_item_temporary', function() {
			// arrange
			var params = [ {
				"name" : "action",
				"value" : "open"
			}, {
				"name" : "id",
				"value" : testData.iCalculationVersionId
			}, {
				"name" : "calculate",
				"value" : "false"
			}, {
				"name" : "loadMasterdata",
				"value" : "true"
			}, {
				"name" : "compressedResult",
				"value" : "true"
			} ];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name
				}).value;
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params
			};
			var oItemTestData = testData.oItemTestData;
			oMockstar.clearTables("item");
			oMockstar.insertTableData("item", oItemTestData);
			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
			
			//set is_dirty flag of second item to true in order to check if the root item will also be set to true
			oMockstar.execSingle(`update {{item_temporary}} set IS_DIRTY = 1 where item_id = ${testData.oItemTestData.ITEM_ID[1]}`);
			var iExpectedDirtyFlag = 1;
			var iExpectedLockFlag = 0;
			// change instance-based privilege of the user from CREATE_EDIT to READ
			oMockstar.clearTable("authorization");
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(helpers.isPlainObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
			expect(oResponseObject.body.transactionaldata[0].IS_DIRTY).toBe(iExpectedDirtyFlag);
			expect(oResponseObject.body.transactionaldata[0].IS_WRITEABLE).toBe(iExpectedLockFlag);
			expect(oResponseObject.body.transactionaldata[0].ITEMS.length).toBe(0);
		});
	});

	describe('create', function() {

		beforeEach(function() {
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oMockstar.clearAllTables();
			oMockstar.insertTableData("session", testData.oSessionTestData);
			oMockstar.insertTableData("calculation", oTestCalculation);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("project", testData.oProjectTestData);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
			oMockstar.initializeData();
		});

		function getRequestObject() {
			// create a new calculation version object as payload of the request; use data from testData.xsjslib as basis
			var oCalculationVersion = JSON.parse(JSON.stringify(oTestCalculationVersion));
			var oNewCv = _.omit(oCalculationVersion, [ "CALCULATION_VERSION_TYPE", "CUSTOMER_ID", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY",
					"SALES_DOCUMENT", "START_OF_PRODUCTION", "END_OF_PRODUCTION", "MASTER_DATA_TIMESTAMP" ]);
			oNewCv.CALCULATION_ID = oTestCalculation.CALCULATION_ID;
			oNewCv.CALCULATION_VERSION_ID = -1;
			oNewCv.ROOT_ITEM_ID = -1;
			oNewCv.VALUATION_DATE = "2011-08-20";
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
			oNewItem.PRICE_UNIT_IS_MANUAL = null;
			oNewItem.PRICE_FIXED_PORTION_IS_MANUAL = null;
			oNewItem.PRICE_VARIABLE_PORTION_IS_MANUAL = null;
			oNewItem.TARGET_COST_IS_MANUAL = null;
			oNewCv.ITEMS = [ oNewItem ];

			return [ oNewCv ];
		}

		var params = [ {
			"name" : "action",
			"value" : "create"
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

		function prepareRequest(oRequestObjectParam) {
		    var oRequestObject = oRequestObjectParam || getRequestObject();
			var oRequest = {
				queryPath : "calculation-versions",
				method : $.net.http.POST,
				body : {
					asString : function() {
						return JSON.stringify(oRequestObject);
					}
				},
				parameters : params
			};
			return oRequest;
		}
		
		function getExpectedDefaultSettings(sProjectId)
		{
		    var defaultSettings = oMockstar.execQuery("select * from {{project}} where PROJECT_ID= '"  + sProjectId + "'");
			var oExpectedDefaultSettings = JSON.parse(JSON.stringify( defaultSettings.columns ));
			
			return oExpectedDefaultSettings;
		}
		
		function testCreateSuccess(sStatusId)
		{
		    			// arrange
			var oRequest = prepareRequest();
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata.length).toBe(1);

			var oResponseCv = oResponseObject.body.transactionaldata[0];
			expect(helpers.isPositiveInteger(oResponseCv.CALCULATION_VERSION_ID)).toBe(true);
			expect(oResponseCv.IS_DIRTY).toBe(1);
			expect(oResponseCv.CALCULATION_ID).toBe(oTestCalculationVersion.CALCULATION_ID);
			expect(oResponseCv.STATUS_ID).toBe(sStatusId);
			expect(oResponseCv.EXCHANGE_RATE_TYPE_ID).toBe("BUY");
			expect(helpers.isPositiveInteger(oResponseCv.ROOT_ITEM_ID)).toBe(true);
			expect(oResponseCv.ITEMS.length).toBe(1);

			var oResponseItem = oResponseCv.ITEMS[0];
			expect(oResponseItem.ITEM_ID).toBe(oResponseCv.ROOT_ITEM_ID);
			expect(oResponseItem.CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);
			if(jasmine.plcTestRunParameters.generatedFields === true){
			    var oItemCustomFields = _.pick(oResponseCv.ITEMS[0], ['ITEM_ID', 'CALCULATION_VERSION_ID', 'CUST_BOOLEAN_INT_MANUAL', 'CUST_BOOLEAN_INT_IS_MANUAL',
			                                            'BASE_QUANTITY_IS_MANUAL','LOT_SIZE_IS_MANUAL','PRICE_UNIT_IS_MANUAL','PRICE_FIXED_PORTION_IS_MANUAL',
			                                            'PRICE_VARIABLE_PORTION_IS_MANUAL','QUANTITY_IS_MANUAL','TARGET_COST_IS_MANUAL']);
			    expect(oItemCustomFields).toMatchData({'ITEM_ID': oResponseCv.ROOT_ITEM_ID,
			                                            'CALCULATION_VERSION_ID': oResponseCv.CALCULATION_VERSION_ID,
			                                            'CUST_BOOLEAN_INT_MANUAL': 1,
			                                            'CUST_BOOLEAN_INT_IS_MANUAL': 1,
			                                            'BASE_QUANTITY_IS_MANUAL': null,
			            	            				'LOT_SIZE_IS_MANUAL': null,
			            	            				'PRICE_UNIT_IS_MANUAL': 1,
			            	            				'PRICE_FIXED_PORTION_IS_MANUAL': 1,
			            	            				'PRICE_VARIABLE_PORTION_IS_MANUAL': 1,
			            	            				'QUANTITY_IS_MANUAL': null,
			            	            				'TARGET_COST_IS_MANUAL': 1
			                                            }, ['ITEM_ID', 'CALCULATION_VERSION_ID']);
			}
		}


		it('should create (post) calculation version with validInput and set the default status --> valid calculation version object returned', function() {
			testCreateSuccess("ACTIVE");
		});


		it('should create (post) calculation version with validInput and set no status because there is no default one --> valid calculation version object returned', function() {

			oMockstar.clearTable("status");
			oMockstar.insertTableData("status", {
				"STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT'],
				"IS_DEFAULT":[0,0,0,0],
				"IS_ACTIVE":[1,0,1,1],
				"IS_STATUS_COPYABLE":[1,0,0,1],
				"DISPLAY_ORDER":[1,2,3,4],
				"CREATED_ON":["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
				"CREATED_BY":['activeUser','inactiveUser','pendingUser','draftUser'],
				"LAST_MODIFIED_ON":[,,,],
				"LAST_MODIFIED_BY":[,,,]
			});

			testCreateSuccess(null);
		});
		
		it ('should create calculation version and set the exchange rate type to standard if this is not set on project level', function () {
		    //arrange
		     oMockstar.clearTable("project");
			oMockstar.insertTableData("project", {
											  "PROJECT_ID": "PR1",
											  "ENTITY_ID" : 1,
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
			var oRequest = prepareRequest();

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);

			expect(oResponseObject.body.transactionaldata.length).toBe(1);

			var oResponseCv = oResponseObject.body.transactionaldata[0];
			expect(helpers.isPositiveInteger(oResponseCv.CALCULATION_VERSION_ID)).toBe(true);
			expect(oResponseCv.IS_DIRTY).toBe(1);
			expect(oResponseCv.CALCULATION_ID).toBe(oTestCalculationVersion.CALCULATION_ID);
			expect(oResponseCv.EXCHANGE_RATE_TYPE_ID).toBe("STANDARD");
			expect(helpers.isPositiveInteger(oResponseCv.ROOT_ITEM_ID)).toBe(true);
			expect(oResponseCv.ITEMS.length).toBe(1);

			var oResponseItem = oResponseCv.ITEMS[0];
			expect(oResponseItem.ITEM_ID).toBe(oResponseCv.ROOT_ITEM_ID);
			expect(oResponseItem.CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSION_ID);
		});

		it('should create (post) calculation validation with validInput --> insert correct data in t_calculation_version_temporary', function() {
			// arrange
			var oRequest = prepareRequest();

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oResponseCv = oResponseObject.body.transactionaldata[0];
			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));

			// TODO: add more properties
			expect(oTableData.CALCULATION_VERSION_ID.length).toBe(1);
			expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(oResponseCv.CALCULATION_VERSION_ID);
//			expect(oTableData.CALCULATION_VERSION_NAME[0]).toBe(oTestCalculationVersion.CALCULATION_VERSION_NAME);
			expect(oTableData.ROOT_ITEM_ID[0]).toBe(oResponseCv.ROOT_ITEM_ID);
		});

		it('should create (post) calculation version with validInput --> insert default data from project for calculation version in t_calculation_version_temporary',
				function() {
					// arrange
					// construct a request object without properties that have to have default values
					var oCv = getRequestObject()[0];

					var oNewCv = [ _.omit(oCv, [ "COSTING_SHEET_ID", "COMPONENT_SPLIT_ID",
							"MASTER_DATA_TIMESTAMP" ]) ];
					var oRequest = {
						queryPath : "calculation-versions",
						method : $.net.http.POST,
						body : {
							asString : function() {
								return JSON.stringify(oNewCv);
							}
						},
						parameters : params
					};

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));

					// TODO: add more properties
					expect(oTableData.CALCULATION_VERSION_ID.length).toBe(1);
					expect(oTableData.COSTING_SHEET_ID[0].length).toBeGreaterThan(0);
					expect(oTableData.COMPONENT_SPLIT_ID[0].length).toBeGreaterThan(0);
					expect(oTableData.MASTER_DATA_TIMESTAMP[0].length).toBeGreaterThan(0);
					
					// checks for project default settings
					var defaultSettings = oMockstar.execQuery("select * from {{project}} where PROJECT_ID= '" + testData.oProjectTestData.PROJECT_ID[0] + "'");

					// calculation version
					var oCalcVersion = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));
					var oExpectedDefaultSettings = JSON.parse(JSON.stringify( defaultSettings.columns ));
					
					expect(oCalcVersion.COSTING_SHEET_ID[0]).toEqual(oExpectedDefaultSettings.COSTING_SHEET_ID.rows[0]);
					expect(oCalcVersion.COMPONENT_SPLIT_ID[0]).toEqual(oExpectedDefaultSettings.COMPONENT_SPLIT_ID.rows[0]);
					expect(oCalcVersion.CUSTOMER_ID[0]).toEqual(defaultSettings.columns.CUSTOMER_ID.rows[0]);
					expect(oCalcVersion.REPORT_CURRENCY_ID[0]).toEqual(oExpectedDefaultSettings.REPORT_CURRENCY_ID.rows[0]);
					expect(oCalcVersion.SALES_DOCUMENT[0]).toEqual(oExpectedDefaultSettings.SALES_DOCUMENT.rows[0]);
					expect(oCalcVersion.START_OF_PRODUCTION[0]).toEqual(oExpectedDefaultSettings.START_OF_PRODUCTION.rows[0]);
					expect(oCalcVersion.END_OF_PRODUCTION[0]).toEqual(oExpectedDefaultSettings.END_OF_PRODUCTION.rows[0]);
					expect(oCalcVersion.VALUATION_DATE[0]).toEqual(oExpectedDefaultSettings.VALUATION_DATE.rows[0]);
					expect(oCalcVersion.MATERIAL_PRICE_STRATEGY_ID[0]).toEqual(oExpectedDefaultSettings.MATERIAL_PRICE_STRATEGY_ID.rows[0]);
					expect(oCalcVersion.ACTIVITY_PRICE_STRATEGY_ID[0]).toEqual(oExpectedDefaultSettings.ACTIVITY_PRICE_STRATEGY_ID.rows[0]);

					// root item
					var oRootItem = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{item_temporary}}"));
					expect(oRootItem.BUSINESS_AREA_ID[0]).toEqual(oExpectedDefaultSettings.BUSINESS_AREA_ID.rows[0]);
					expect(oRootItem.COMPANY_CODE_ID[0]).toEqual(oExpectedDefaultSettings.COMPANY_CODE_ID.rows[0]);
					expect(oRootItem.PLANT_ID[0]).toEqual(oExpectedDefaultSettings.PLANT_ID.rows[0]);
					expect(oRootItem.PROFIT_CENTER_ID[0]).toEqual(oExpectedDefaultSettings.PROFIT_CENTER_ID.rows[0]);
					expect(oRootItem.ITEM_CATEGORY_ID[0]).toBe(0);
				});

		it('should create (post) calculation version with validInput --> insert correct data in t_item_temporary', function() {
			// arrange
			var oRequest = prepareRequest();

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oResponseCv = oResponseObject.body.transactionaldata[0];
			var oResponseItem = oResponseCv.ITEMS[0];
			var oTableData = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{item_temporary}}"));

			// not all properties are checked since a complete check is part of the items-integrationtests
			expect(oTableData.ITEM_ID.length).toBe(1);
			expect(oTableData.ITEM_ID[0]).toBe(oResponseItem.ITEM_ID);
			expect(oTableData.CALCULATION_VERSION_ID[0]).toBe(oResponseItem.CALCULATION_VERSION_ID);
		});

		it('should contain costing sheet and component split for created version -> are contained in return object', function() {
			// arrange
			var oRequest = prepareRequest();

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// assert
			var oCalculationVersion = oResponseObject.body;
			expect(oCalculationVersion.masterdata.COMPONENT_SPLIT_ENTITIES).toBeDefined();
			expect(oCalculationVersion.masterdata.SELECTED_ACCOUNT_GROUPS_ENTITIES).toBeDefined();
			expect(oCalculationVersion.masterdata.COSTING_SHEET_ENTITIES).toBeDefined();
			expect(oCalculationVersion.masterdata.COSTING_SHEET_ROW_ENTITIES).toBeDefined();
			expect(oCalculationVersion.masterdata.COSTING_SHEET_BASE_ENTITIES).toBeDefined();
			expect(oCalculationVersion.masterdata.COSTING_SHEET_BASE_ROW_ENTITIES).toBeDefined();
			expect(oCalculationVersion.masterdata.COSTING_SHEET_OVERHEAD_ENTITIES).toBeDefined();
			expect(oCalculationVersion.masterdata.COSTING_SHEET_OVERHEAD_ROW_ENTITIES).toBeDefined();
			expect(oCalculationVersion.masterdata.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES).toBeDefined();
		});

		it("should throw exception if a new version is created and the first was not yet saved", function() {
			// arrange
			oMockstar.clearTable("calculation_version");
			var oRequest = prepareRequest();

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages[0].code).toBe('FIRST_CALCULATIONVERSION_NOT_SAVED');
		});
		
		it('should create (post) calculation version with validInput --> insert default data from project for calculation version in t_calculation_version_temporary when exchange_rate_type_id is null in request', () => {
			// arrange
			// construct a request object without properties that have to have default values
			var oNewCv = getRequestObject();
			//adapt the object in order to send EXCHANGE_RATE_TYPE_ID = null
			oNewCv[0].EXCHANGE_RATE_TYPE_ID = null;		
		
            var oRequest = prepareRequest(oNewCv);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oCalcVersionTemporary = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));
			// checks for project default settings
			var oExpectedDefaultSettings = getExpectedDefaultSettings(testData.oProjectTestData.PROJECT_ID[0]);

			expect(oCalcVersionTemporary.CALCULATION_VERSION_ID.length).toBe(1);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0].length).toBeGreaterThan(0);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).toEqual(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]);
		});
				
		it('should create (post) calculation version with validInput --> insert default data from project for calculation version in t_calculation_version_temporary when exchange_rate_type_id is undefined in request', () => {
			// arrange
			// construct a request object without properties that have to have default values
			//Do not send EXCHANGE_RATE_TYPE_ID into request
			var oCalculationVersion = getRequestObject();
			var oNewCv = [ _.omit(oCalculationVersion[0], "EXCHANGE_RATE_TYPE_ID")];
            var oRequest = prepareRequest(oNewCv);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oCalcVersionTemporary = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));
			// checks for project default settings
            var oExpectedDefaultSettings = getExpectedDefaultSettings(testData.oProjectTestData.PROJECT_ID[0]);
			expect(oCalcVersionTemporary.CALCULATION_VERSION_ID.length).toBe(1);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0].length).toBeGreaterThan(0);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).toEqual(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]);
		});
				
        it('should create (post) calculation version with validInput --> Should not take the default EXCHANGE_RATE_TYPE_ID from the project when there is another EXCHANGE_RATE_TYPE_ID sent into request', () => {
			// arrange
			// construct a request object without properties that have to have default values
			var oNewCv = getRequestObject();
			//adapt the object in order to send EXCHANGE_RATE_TYPE_ID = SELL
			oNewCv[0].EXCHANGE_RATE_TYPE_ID = 'SELL';		
			var oRequest = prepareRequest(oNewCv);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oCalcVersionTemporary = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));
			
			// checks for project default settings
            var oExpectedDefaultSettings = getExpectedDefaultSettings(testData.oProjectTestData.PROJECT_ID[0]);
			expect(oCalcVersionTemporary.CALCULATION_VERSION_ID.length).toBe(1);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0].length).toBeGreaterThan(0);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).toBe('SELL');
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).not.toEqual(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]);
		});
				
		it('should create (post) calculation version with validInput --> Project has defined exchange rate type null -> new calculation versions should get exchange rate type "STANDARD" if EXCHANGE_RATE_TYPE_ID is not defined', () => {
			// arrange
			//adapt test data in order to have a project with exchange rate type set to null
			var oProject = new TestDataUtility(testData.oProjectTestData).build();
			oProject.EXCHANGE_RATE_TYPE_ID[0] = null;
			oMockstar.clearTable("project");
			oMockstar.insertTableData("project", oProject);
			var oCalculationVersion = getRequestObject();
			var oNewCv = [ _.omit(oCalculationVersion[0], "EXCHANGE_RATE_TYPE_ID")];
			var oRequest = prepareRequest(oNewCv);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oCalcVersionTemporary = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));
			
			// checks for project default settings
            var oExpectedDefaultSettings = getExpectedDefaultSettings(testData.oProjectTestData.PROJECT_ID[0]);
			expect(oCalcVersionTemporary.CALCULATION_VERSION_ID.length).toBe(1);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0].length).toBeGreaterThan(0);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).toBe(sDefaultExchangeRateType);
			expect(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]).toBeNull();
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).not.toEqual(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]);
		});
				
		it('should create (post) calculation version with validInput --> Project has defined exchange rate type null -> new calculation versions should get exchange rate type "STANDARD" if EXCHANGE_RATE_TYPE_ID is null', () => {
			// arrange
			var oProject = new TestDataUtility(testData.oProjectTestData).build();
			oProject.EXCHANGE_RATE_TYPE_ID[0] = null;
			oMockstar.clearTable("project");
			oMockstar.insertTableData("project", oProject);
			var oNewCv = getRequestObject();
			oNewCv[0].EXCHANGE_RATE_TYPE_ID = null;
			var oRequest = prepareRequest(oNewCv);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oCalcVersionTemporary = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));
			
			// checks for project default settings
            var oExpectedDefaultSettings = getExpectedDefaultSettings(testData.oProjectTestData.PROJECT_ID[0]);
			expect(oCalcVersionTemporary.CALCULATION_VERSION_ID.length).toBe(1);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0].length).toBeGreaterThan(0);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).toBe(sDefaultExchangeRateType);
			expect(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]).toBeNull();
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).not.toEqual(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]);
		});
				
		it('should create (post) calculation version with validInput --> Project has defined exchange rate type null ->  new calculations get exchange rate type "SELL" if EXCHANGE_RATE_TYPE_ID is SELL in request', () => {
			// arrange
			var oProject = new TestDataUtility(testData.oProjectTestData).build();
			oProject.EXCHANGE_RATE_TYPE_ID[0] = null;
			oMockstar.clearTable("project");
			oMockstar.insertTableData("project", oProject);
			var oNewCv = getRequestObject();
			oNewCv[0].EXCHANGE_RATE_TYPE_ID = 'SELL';
            var oRequest = prepareRequest(oNewCv);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oCalcVersionTemporary = mockstart_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));
			
			// checks for project default settings
            var oExpectedDefaultSettings = getExpectedDefaultSettings(testData.oProjectTestData.PROJECT_ID[0]);

			expect(oCalcVersionTemporary.CALCULATION_VERSION_ID.length).toBe(1);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0].length).toBeGreaterThan(0);
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).toBe('SELL');
			expect(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]).toBeNull();
			expect(oCalcVersionTemporary.EXCHANGE_RATE_TYPE_ID[0]).not.toEqual(oExpectedDefaultSettings.EXCHANGE_RATE_TYPE_ID.rows[0]);

		});
		
		it('should throw GENERAL_VALIDATION_ERROR when creating a calculation version with more than one item', () => {
		    // arrange 
		    let oRequestPayload = [];
		    let oItem = new TestDataUtility(testData.oItemTestData).getObject(0);
			oRequestPayload.push(getRequestObject()[0]);
			oRequestPayload[0].ITEMS.push(oItem);
			const oRequest = prepareRequest(oRequestPayload);
            
            //act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			//assert
            const sClientMsg = 'Inital calculation version does not contain an array with 1 entry named ITEMS. Cannot validate.';
			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		    expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_VALIDATION_ERROR.code)
		    expect(oResponseObject.head.messages.length).toBe(1);
		    expect(oResponseObject.head.messages[0].details.messageTextObj).toBe(sClientMsg);		    
		});

		it('should throw GENERAL_VALIDATION_ERROR when trying to create a version with null MATERIAL_PRICE_STRATEGY_ID', () => {
			// arrange 
			const oVersion = getRequestObject();
			oVersion[0].MATERIAL_PRICE_STRATEGY_ID = null;
            const oRequest = prepareRequest(oVersion);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_VALIDATION_ERROR.code)
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].details.messageTextObj).toContain("MATERIAL_PRICE_STRATEGY_ID");
		});

		it('should throw GENERAL_VALIDATION_ERROR when trying to create a version with null ACTIVITY_PRICE_STRATEGY_ID', () => {
			// arrange 
			const oVersion = getRequestObject();
			oVersion[0].ACTIVITY_PRICE_STRATEGY_ID = null;
            const oRequest = prepareRequest(oVersion);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_VALIDATION_ERROR.code)
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].details.messageTextObj).toContain("ACTIVITY_PRICE_STRATEGY_ID");
		});
	});
	
	describe('Recover Calculation Versions', function() {

		var mockstar = null;
		var persistency = null;
		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
        var oTwoDaysAgo = new Date();
        oTwoDaysAgo.setDate(oTwoDaysAgo.getDate() -2);
        var sTwoDaysAgo = oTwoDaysAgo.toJSON();

		beforeOnce(function() {
			mockstar = new MockstarFacade({
				testmodel : {
					"calculations_versions_read" : "sap.plc.db.calculationmanager.procedures/p_calculations_versions_recover"
				},
				substituteTables : {
					calculation : {
						name : mTableNames.calculation,
						data : testData.oCalculationTestData
					},
					project : {
						name : mTableNames.project,
						data : testData.oProjectTestData
					},
					calculationVersionTemporary : {
						name : mTableNames.calculation_version_temporary,
						data : testData.oCalculationVersionTemporaryTestData
					},
					open_calculation_versions : {
						name : mTableNames.open_calculation_versions,
						data : testData.oOpenCalculationVersionsTestData
					},
					item : {
					    name : mTableNames.item,
					    data : testData.oItemTestData
					},
					session : {
					    name : 'sap.plc.db::basis.t_session',
					    data : testData.oSessionTestData
					},
					item_ext : "sap.plc.db::basis.t_item_ext",
					authorization: "sap.plc.db::auth.t_auth_project"
				}
			});
		});

		function buildGetRequest(iTop) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "top",
				"value" : iTop
			}];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name
				}).value;
			};
			var oRequest = {
					queryPath : "recover-calculation-versions",
					method : $.net.http.GET,
					parameters : params
			};
			return oRequest;
		}

		beforeEach(function() {
			mockstar.clearAllTables();
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				mockstar.insertTableData("item_ext", testData.oItemExtData);
			}
			mockstar.initializeData();
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);

			persistency = new Persistency(jasmine.dbConnection);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should return all calculation versions that must be recovered ', function(){

			oMockstar.clearTable("calculation_version_temporary");
			const calculationVersionTemporaryData = _.extend(JSON.parse(JSON.stringify(testData.oCalculationVersionTemporaryTestData)), {
				"STATUS_ID" : [ 'ACTIVE', 'ACTIVE', 'ACTIVE' ]
			});
			oMockstar.insertTableData("calculation_version_temporary", calculationVersionTemporaryData);
			//arrange
			var oRequest = buildGetRequest(null);
            // build sorted list for CV - first in list most recent
            var aRecentCV = oMockstar.execQuery("select * from {{open_calculation_versions}} where SESSION_ID = '" + testData.sSessionId + "'");
            var aExpectedSortedCV = aRecentCV.columns.CALCULATION_VERSION_ID.rows;
            var aResultCV = [];
			// act
		    new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
            
			//assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oResponseCv = oResponseObject.body;
			expect(oResponseCv.transactionaldata[0].CALCULATIONS.length).toBeGreaterThan(0);
			expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS.length).toBe(aExpectedSortedCV.length);
			expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].STATUS_ID).toBe('ACTIVE');
			expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[1].STATUS_ID).toBe('ACTIVE');
			expect(oResponseCv.transactionaldata[0].PROJECTS.length).toBeGreaterThan(0);
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			// check that calculation versions are sorted by recently used
			aResultCV.push(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
			aResultCV.push(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[1].CALCULATION_VERSION_ID);
			expect(aResultCV).toEqual(aExpectedSortedCV);
		});	
		
		it('should return TOP 1 of calculation versions that must be recovered', function(){
			//arrange
			var oRequest = buildGetRequest(1);
            // build sorted list for CV - first in list most recent
            var aRecentCV = oMockstar.execQuery("select * from {{open_calculation_versions}} where SESSION_ID = '" + testData.sSessionId + "'");
            var aExpectedSortedCV = aRecentCV.columns.CALCULATION_VERSION_ID.rows;
            var aResultCV = [];
			
			// act
		    new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
            
			//assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oResponseCv = oResponseObject.body;
			expect(oResponseCv.transactionaldata[0].CALCULATIONS.length).toBe(1);
			expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS.length).toBe(1);
			expect(oResponseCv.transactionaldata[0].PROJECTS.length).toBe(1);
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			aResultCV.push(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
			expect(aResultCV[0]).toEqual(aExpectedSortedCV[0]);
		});		
		
          it('should remove all locks for variant matrix context in session', function(){
                //arrange
                var oRequest = buildGetRequest(1);
                oMockstar.clearTable("open_calculation_versions");
                const context = Constants.CalculationVersionLockContext;
                // Insert locks
                oMockstar.insertTableData("open_calculation_versions", {
                    "SESSION_ID" :              [ testData.sSessionId,              testData.sSessionId,            "ANOTHER_USER"],
                    "CALCULATION_VERSION_ID" :  [ testData.iCalculationVersionId,   testData.iSecondVersionId,      testData.iCalculationVersionId ],
                    "CONTEXT" :                 [ context.VARIANT_MATRIX,           context.VARIANT_MATRIX,         context.VARIANT_MATRIX ],
                    "IS_WRITEABLE" :            [ 1,                                0,                              1 ]
                });	            
                
                	            
                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
                
                //assert
                
                // Check that variant matrix locks were removed for all versions and is_writeable values
                expect(mockstart_helpers.getRowCount(oMockstar, "open_calculation_versions",                         
                        "SESSION_ID = '" + testData.sSessionId + "' and CONTEXT = '" + context.VARIANT_MATRIX + "'")).toEqual(0);
                
                // Check that other sessions with variant matrix context were not removed
                expect(mockstart_helpers.getRowCount(oMockstar, "open_calculation_versions",                         
                        "SESSION_ID = 'ANOTHER_USER' and CONTEXT = '" + context.VARIANT_MATRIX + "'")).toEqual(1);
            });     
    });
	
	describe('get calculation versions', function () {
		let mockstar = null;
		let oResponseStub = null;

		let oTwoDaysAgo = new Date();
		oTwoDaysAgo.setDate(oTwoDaysAgo.getDate() - 2);
		let sTwoDaysAgo = oTwoDaysAgo.toJSON();

		beforeOnce(function () {
			mockstar = new MockstarFacade({
				testmodel: {
					"calculations_versions_read": "sap.plc.db.calculationmanager.procedures/p_calculations_versions_read"
				},
				substituteTables: {
					calculation: {
						name: mTableNames.calculation,
						data: testData.oCalculationTestData
					},
					project: {
						name: mTableNames.project,
						data: testData.oProjectTestData
					},
					calculationVersion: {
						name: mTableNames.calculation_version,
						data: testData.oCalculationVersionTestData
					},
					item: {
						name: mTableNames.item,
						data: testData.oItemTestData
					},
					recent_calculation_versions: {
						name: mTableNames.recent_calculation_versions,
						data: testData.oRecentCalculationTestData
					},
					session: {
						name: 'sap.plc.db::basis.t_session',
						data: testData.oSessionTestData
					},
					component_split: {
						name: 'sap.plc.db::basis.t_component_split',
						data: testData.oComponentSplitTest
					},
					costing_sheet: {
						name: 'sap.plc.db::basis.t_costing_sheet',
						data: testData.oCostingSheetTestData
					},
					costing_sheet_row: {
						name: 'sap.plc.db::basis.t_costing_sheet_row',
						data: testData.oCostingSheetRowTestData
					},
					costing_sheet_base: {
						name: 'sap.plc.db::basis.t_costing_sheet_base',
						data: testData.oCostingSheetBaseTestData
					},
					process: {
						name: 'sap.plc.db::basis.t_process',
						data: testData.oProcessTestDataPlc
					},
					overhead_group: {
						name: 'sap.plc.db::basis.t_overhead_group',
						data: testData.oOverheadGroupTestDataPlc
					},
					plant: {
						name: 'sap.plc.db::basis.t_plant',
						data: testData.oPlantTestDataPlc
					},
					cost_center: {
						name: 'sap.plc.db::basis.t_cost_center',
						data: testData.oCostCenterTestDataPlc
					},
					profit_center: {
						name: 'sap.plc.db::basis.t_profit_center',
						data: testData.oProfitCenterTestDataPlc
					},
					item_ext: "sap.plc.db::basis.t_item_ext",
					authorization: "sap.plc.db::auth.t_auth_project"
				}
			});
		});

		beforeEach(function () {
			mockstar.clearAllTables();
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				mockstar.insertTableData("item_ext", testData.oItemExtData);
			}
			mockstar.initializeData();
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[1], sUserId, InstancePrivileges.READ);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[2], sUserId, InstancePrivileges.READ);

			oResponseStub = new ResponseObjectStub();
		});

		afterOnce(function () {
			mockstar.cleanup();
		});

		describe("get calculation versions for cockpit and search", () => {
			function buildGetRequest(iCalculationId, iProjectId, iTop, bRecentlyUsed, iId, bLoadMasterdata, bCurrent, bSearch, sFilter, sSortingColumn, sSortingDirection, bOmitItems, bReturnLifecycle) {
				// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
				var params = [{
					"name": "calculation_id",
					"value": iCalculationId
				}, {
					"name": "project_id",
					"value": iProjectId
				},				
				{
					"name": "top",
					"value": iTop
				}, {
					"name": "recently_used",
					"value": bRecentlyUsed
				}, {
					"name": "id",
					"value": iId
				}, {
					"name": "loadMasterdata",
					"value": bLoadMasterdata
				}, {
					"name": "current",
					"value": bCurrent
				}, {
					"name": "search",
					"value": bSearch
				}, {
					"name": "filter",
					"value": sFilter
				}, {
					"name": "sortingColumn",
					"value": sSortingColumn
				}, {
					"name": "sortingDirection",
					"value": sSortingDirection
				}, {
					"name": "omitItems",
					"value": bOmitItems
				}, {
					"name": "returnLifecycle",
					"value": bReturnLifecycle
				}];
				params.get = function (sArgument) {
					return _.find(params, function (oParam) {
						return sArgument === oParam.name
					}).value;
				};
				var oRequest = {
					queryPath: "calculation-versions",
					method: $.net.http.GET,
					parameters: params
				};
				return oRequest;
			}

			function buildGetLifecycleRequest(iCalculationVersionId, iId) {
				let oRequest = {
					queryPath: `calculation-versions/${iCalculationVersionId}/lifecycles`,
					method: $.net.http.GET
				};
				if(iId){
					oRequest.parameters = [{
						"name": "id",
						"value": iId
					}];
				}
				return oRequest;
			}
			
			it('should throw GENERAL_VALIDATION_ERROR if value is greater than 2147483647 (max Integer supported by SQL-numeric overflow)', function () {
				//arrange
				var iInvalidIntegerTop = 2147483648;
				var oRequest = buildGetRequest(null, null, iInvalidIntegerTop, null, null, null, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_VALIDATION_ERROR');
			});
			
			it('should throw GENERAL_VALIDATION_ERROR if value is greater than 2147483647 (max Integer supported by SQL-numeric overflow)', function () {
				//arrange
				var iInvalidIntegerTop = 21474836777;
				var oRequest = buildGetRequest(testData.iCalculationId, null, iInvalidIntegerTop, null, null, null, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_VALIDATION_ERROR');    
			});
			
			it('should return GENERAL_ENTITY_NOT_FOUND_ERROR not found when calculation does not exists', function () {
				//arrange
				var iInvalidCalculation = 999999;
				var oRequest = buildGetRequest(iInvalidCalculation, null, null, null, null, null, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseCv.details.calculationObjs[0].id).toBe(iInvalidCalculation);
				expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
			});
			
			it('should return GENERAL_ENTITY_NOT_FOUND_ERROR not found when calculation version does not exists', function () {
				//arrange
				var iInvalidCalculationId = 999999;
				var oRequest = buildGetRequest(null, null, null, null, iInvalidCalculationId, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseCv.details.calculationVersionObjs[0].id).toBe(iInvalidCalculationId);
				expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
			});

			it('should return GENERAL_ENTITY_NOT_FOUND_ERROR not found when project does not exists', function () {
				//arrange
				var iInvalidProjectId = 999999;
				var oRequest = buildGetRequest(null, iInvalidProjectId, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseCv.details.messageTextObj).toBe('At least one of the projects does not exist.')
				expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
			});
			
			it('should return GENERAL_VALIDATION_ERROR when mandatory parameter is missing', function () {
				//arrange
				var oRequest = buildGetRequest(null, null, 10, null, null, true, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_VALIDATION_ERROR');
			});
			
			it('should return GENERAL_VALIDATION_ERROR when all parameters are missing', function () {
				//arrange
				var oRequest = buildGetRequest(null, null, null, null, null, null, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_VALIDATION_ERROR');
			});
			
			it('should return all calculation versions for existing calculation', function () {
				//arrange
				var oRequest = buildGetRequest(testData.iCalculationId, null, null, null, null, null, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body.transactionaldata[0];
				expect(oResponseCv.CALCULATIONS.length).toBe(0);
				expect(oResponseCv.CALCULATION_VERSIONS.length).toBe(1);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
				expect(oResponseCv.PROJECTS.length).toBe(0);
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS[0].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS[0].ITEM_ID).toBe(oResponseCv.CALCULATION_VERSIONS[0].ROOT_ITEM_ID);
			});

			it('should return all calculation versions for existing project', function () {
				//arrange
				var oRequest = buildGetRequest(null, testData.iProjectId, null, null, null, null, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body.transactionaldata[0];
				expect(oResponseCv.CALCULATIONS.length).toBe(0);
				expect(oResponseCv.CALCULATION_VERSIONS.length).toBe(2);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
				expect(oResponseCv.PROJECTS.length).toBe(0);
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS[0].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS[0].ITEM_ID).toBe(oResponseCv.CALCULATION_VERSIONS[0].ROOT_ITEM_ID);
			});
			
			it('should return no calculation versions for existing calculations if the user has no READ instance-based-privilege', function () {
				//arrange
				//creating a GET request with the the following parameters: calculation_id=1978, loadMasterdata=true, current=true
				var oRequest = buildGetRequest(testData.iCalculationId, null, null, null, null, true, true, null, null, null, null);
				oMockstar.clearTable("authorization");
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body.transactionaldata[0];
				//response should not contain any calculation, -version or project
				expect(oResponseCv.CALCULATIONS.length).toBe(0);
				expect(oResponseCv.CALCULATION_VERSIONS.length).toBe(0);
				expect(oResponseCv.PROJECTS.length).toBe(0);
				expect(oResponseStub.status).toBe($.net.http.OK);
			});
			
			it('should return only calculation versions for existing calculations for which the user has the READ instance-based-privilege', function () {
				//arrange
				var calculationIds = testData.oCalculationTestData.CALCULATION_ID.join(",");
				//creating a GET request with the the following parameters: calculation_id=1978,2078,5078, loadMasterdata=true, current=true
				var oRequest = buildGetRequest(calculationIds, null, null, null, null, true, true, null, null, null, null);
				//assign instance-based privilege for project "PR1"
				oMockstar.clearTable("authorization");
				enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
				//assign each existing test-calculation to a separate project
				oMockstar.clearTables("calculation");
				let oCalculations = new TestDataUtility(testData.oCalculationTestData)
				oCalculations = oCalculations.replaceValue("PROJECT_ID", ["PR1", "PR2", "PR3"]).build();
				oMockstar.insertTableData("calculation", oCalculations);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body.transactionaldata[0];
				expect(oResponseCv.CALCULATIONS.length).toBe(1); //only the calculation belonging to project PR1
				expect(oResponseCv.CALCULATION_VERSIONS.length).toBe(1);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
				expect(oResponseCv.PROJECTS.length).toBe(0);
				expect(oResponseStub.status).toBe($.net.http.OK);
			});
			
			it('should return one calculation version', function () {
				//arrange
				var oRequest = buildGetRequest(null, null, null, null, testData.iCalculationVersionId, null, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert

				var oResponseCv = oResponseStub.getParsedBody().body.transactionaldata[0];
				expect(oResponseCv.CALCULATIONS.length).toBe(0);
				expect(oResponseCv.CALCULATION_VERSIONS.length).toBe(1);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS.length).toBeGreaterThan(0);
				expect(oResponseCv.PROJECTS.length).toBe(0);
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS[0].CALCULATION_VERSION_ID).toBe(oResponseCv.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				expect(oResponseCv.CALCULATION_VERSIONS[0].ITEMS[0].ITEM_ID).toBe(oResponseCv.CALCULATION_VERSIONS[0].ROOT_ITEM_ID);
			});
			
			it('should get MASTERDATA when loadMasterdata is true', function () {
				//arrange
				var oRequest = buildGetRequest(testData.iCalculationId, null, null, null, null, true, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body;
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS.length).toBeGreaterThan(0);
				expect(oResponseCv.masterdata.CURRENCY_ENTITIES.length).toBeGreaterThan(0);
				expect(oResponseCv.masterdata.UNIT_OF_MEASURE_ENTITIES.length).toBeGreaterThan(0);
				expect(oResponseStub.status).toBe($.net.http.OK);
			});
			it('should NOT get MASTERDATA when loadMasterdata is false', function () {
				//arrange
				var oRequest = buildGetRequest(testData.iCalculationId, null, null, null, null, false, null, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body;
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS.length).toBeGreaterThan(0);
				expect(oResponseCv.masterdata.CURRENCY_ENTITIES.length).toBe(0);
				expect(oResponseCv.masterdata.UNIT_OF_MEASURE_ENTITIES.length).toBe(0);
				expect(oResponseStub.status).toBe($.net.http.OK);
			});
			
			it('should return all recent calculation versions SORTED by recently used including MASTERDATA', function () {
				//arrange
				var oRequest = buildGetRequest(null, null, null, true, null, true, null, null, null, null, null);
				// build sorted list for CV - first in list most recent
				var aRecentCV = oMockstar.execQuery("select * from {{recent_calculation_versions}} where USER_ID = '" + testData.sTestUser + "' ORDER BY LAST_USED_ON DESC");
				var aExpectedSortedCV = aRecentCV.columns.CALCULATION_VERSION_ID.rows;
				var aResultCV = [];
				
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body;
				expect(oResponseCv.transactionaldata[0].CALCULATIONS.length).toBeGreaterThan(0);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS.length).toBe(aExpectedSortedCV.length);
				expect(oResponseCv.transactionaldata[0].PROJECTS.length).toBeGreaterThan(0);
				// return MASTERDATA
				expect(oResponseCv.masterdata.CURRENCY_ENTITIES.length).toBeGreaterThan(0);
				expect(oResponseCv.masterdata.UNIT_OF_MEASURE_ENTITIES.length).toBeGreaterThan(0);
				expect(oResponseStub.status).toBe($.net.http.OK);
				// check that calculation versions are sorted by recently used
				aResultCV.push(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				aResultCV.push(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[1].CALCULATION_VERSION_ID);
				expect(aResultCV).toEqual(aExpectedSortedCV);
			});
			it('should return TOP 1 most recent calculation versions', function () {
				//arrange
				var oRequest = buildGetRequest(null, null, 1, true, null, null, null, null, null, null, null);
				// build sorted list for CV - first in list most recent
				var aRecentCV = oMockstar.execQuery("select * from {{recent_calculation_versions}} where USER_ID = '" + testData.sTestUser + "' ORDER BY LAST_USED_ON DESC");
				var aExpectedSortedCV = aRecentCV.columns.CALCULATION_VERSION_ID.rows;
				var aResultCV = [];
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body;
				expect(oResponseCv.transactionaldata[0].CALCULATIONS.length).toBe(1);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS.length).toBe(1);
				expect(oResponseCv.transactionaldata[0].PROJECTS.length).toBe(1);
				expect(oResponseStub.status).toBe($.net.http.OK);
				aResultCV.push(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID);
				expect(aResultCV[0]).toEqual(aExpectedSortedCV[0]);
			});
			
			it('should return top 10 calculation versions that match the search filter', function () {
				//arrange
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
				oMockstar.insertTableData("item", testData.oItemTestData1);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
				var oRequest = buildGetRequest(null, null, 10, null, 9193, null, null, true, 'CALCULATION_VERSION=Ve+Si*4', null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body;
				expect(oResponseCv.transactionaldata.length).toBe(1);
			});
			
			it('should return top 10 calculation versions that have the same related controlling area as the version from request, ordered by verison name desc', function () {
				//arrange
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
				oMockstar.insertTableData("item", testData.oItemTestData1);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
				var oRequest = buildGetRequest(null, null, 10, null, 9193, null, null, true, null, null, 'desc');
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body;
				expect(oResponseCv.transactionaldata.length).toBe(2);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSION_NAME).toBe('Baseline Version51');
				expect(oResponseCv.transactionaldata[1].CALCULATION_VERSION_NAME).toBe('Baseline Version41');
			});
			
			it('should return top 10 calculation versions for search if the sorting column and order is missing the default one is taken', function () {
				//arrange
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
				oMockstar.insertTableData("item", testData.oItemTestData1);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
				var oRequest = buildGetRequest(null, null, 10, null, 9193, null, null, true, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body;
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSION_NAME).toBe('Baseline Version41');
				expect(oResponseCv.transactionaldata[1].CALCULATION_VERSION_NAME).toBe('Baseline Version51');
			});
			
			it('should return all the calculations from the list with the current version and the root item for current=true', function () {
				//arrange
				var sCalculationIds = "1978, 2078";
				var iCurrent = true;
				var oRequest = buildGetRequest(sCalculationIds, null, null, null, null, null, true, null, null, null, null);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				var oResponseCv = oResponseStub.getParsedBody().body;
				expect(oResponseCv.transactionaldata[0].CALCULATIONS.length).toBe(2);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS.length).toBe(2);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].ITEMS).toBeDefined;
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[1].ITEMS).toBeDefined;
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID).toBe(oResponseCv.transactionaldata[0].CALCULATIONS[0].CURRENT_CALCULATION_VERSION_ID);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[1].CALCULATION_VERSION_ID).toBe(oResponseCv.transactionaldata[0].CALCULATIONS[1].CURRENT_CALCULATION_VERSION_ID);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].ITEMS[0].CALCULATION_VERSION_ID).toBe(2809);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[1].ITEMS[0].CALCULATION_VERSION_ID).toBe(4809);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[0].ITEMS[0].PARENT_ITEM_ID).toBe(null);
				expect(oResponseCv.transactionaldata[0].CALCULATION_VERSIONS[1].ITEMS[0].PARENT_ITEM_ID).toBe(null);
			});

			it('should return an empty array for ITEMS if omitItems is set to true', function() {
				//arrange
				var oRequest = buildGetRequest(testData.iCalculationId, null, null, null, null, null, null, null, null, null, null, true);

				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

				//assert
				const oResponseBody = oResponseStub.getParsedBody();
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[0].ITEMS).toEqual(aEmptyArray);
			});
			
			it('should return a calculation version and its lifecycle version if returnLifecycle is set to true', function() {
				//arrange
				oMockstar.clearTable("calculation_version");
				oMockstar.insertTableData("calculation_version", testData.oCalculationLifecycleVersionTestData2);
				var oRequest = buildGetRequest(testData.iCalculationId, null, null, null, null, null, null, null, null, null, null, null, true);

				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

				//assert
				const oResponseBody = oResponseStub.getParsedBody();
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS.length).toEqual(testData.oCalculationLifecycleVersionTestData2.CALCULATION_VERSION_ID.length);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_TYPE).toEqual(Constants.CalculationVersionType.Base);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[0].HAS_LIFECYCLES).toEqual(1);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[1].CALCULATION_VERSION_TYPE).toEqual(Constants.CalculationVersionType.Lifecycle);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[2].CALCULATION_VERSION_TYPE).toEqual(Constants.CalculationVersionType.Lifecycle);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[3].CALCULATION_VERSION_TYPE).toEqual(Constants.CalculationVersionType.Base);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[3].HAS_LIFECYCLES).toEqual(0);
				expect(Object.keys(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[1])).not.toContain("HAS_LIFECYCLES");
				expect(Object.keys(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[2])).not.toContain("HAS_LIFECYCLES");
			});

			it('should return a calculation version without its lifecycle version if returnLifecycle is set to false', function() {
				//arrange
				oMockstar.clearTable("calculation_version");
				oMockstar.insertTableData("calculation_version", testData.oCalculationLifecycleVersionTestData2);
				var oRequest = buildGetRequest(testData.iCalculationId, null, null, null, null, null, null, null, null, null, null, null, false);

				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

				//assert
				const oResponseBody = oResponseStub.getParsedBody();
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS.length).toEqual(2);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_TYPE).toEqual(Constants.CalculationVersionType.Base);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[0].HAS_LIFECYCLES).toEqual(1);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[1].CALCULATION_VERSION_TYPE).toEqual(Constants.CalculationVersionType.Base);
				expect(oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[1].HAS_LIFECYCLES).toEqual(0);
			});

			it('should return all lifecycle versions for existing calculation version', function () {
				//arrange
				oMockstar.clearTable("calculation_version");
				oMockstar.insertTableData("calculation_version", testData.oCalculationLifecycleVersionTestData2);
				const oRequest = buildGetLifecycleRequest(testData.iCalculationVersionId);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				const oResponseCv = oResponseStub.getParsedBody().body.transactionaldata[0];
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseCv.CALCULATION_VERSIONS.length).toBe(2);
				expect(oResponseCv.CALCULATION_VERSIONS[0].BASE_VERSION_ID).toBe(testData.iCalculationVersionId);
				expect(oResponseCv.CALCULATION_VERSIONS[1].BASE_VERSION_ID).toBe(testData.iCalculationVersionId);
				expect(oResponseCv.CALCULATION_VERSIONS[0].CALCULATION_VERSION_TYPE).toBe(Constants.CalculationVersionType.Lifecycle);
				expect(oResponseCv.CALCULATION_VERSIONS[1].CALCULATION_VERSION_TYPE).toBe(Constants.CalculationVersionType.Lifecycle);
			});

			it('should return an empty array for existing calculation version without lifecycles', function () {
				//arrange
				oMockstar.clearTable("calculation_version");
				oMockstar.insertTableData("calculation_version", testData.oCalculationLifecycleVersionTestData2);
				const oRequest = buildGetLifecycleRequest(testData.iSecondVersionId);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				const oResponseCv = oResponseStub.getParsedBody().body.transactionaldata[0];
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseCv.CALCULATION_VERSIONS.length).toBe(0);
			});

			it('should throw an entity not found error if the requested calculation version does not exist', function () {
				//arrange
				const iInvalidCalculationId = 999999;
				const oRequest = buildGetLifecycleRequest(iInvalidCalculationId);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				const oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseCv.details.calculationVersionObjs[0].id).toBe(iInvalidCalculationId);
				expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
			});

			it('should throw general validation error if there are invalid url parameters sent on the request', function () {
				//arrange
				const iId = testData.iSecondVersionId;
				const oRequest = buildGetLifecycleRequest(testData.iSecondVersionId, iId);
				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
				//assert
				const oResponseCv = oResponseStub.getParsedBody().head.messages[0];
				expect(oResponseCv.code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseCv.details.messageTextObj).toBe("Request parameter id is not allowed.");
			});
		});

		describe("get single versions", () => {

			const buildRequest = (iCvId, aAdditionalParameters) => {
				iCvId = iCvId || testData.iCalculationVersionId;
				aAdditionalParameters = aAdditionalParameters || [];
				const aDefaultParameters = [
					[CalculationVersionParameters.expand.name, CalculationVersionParameters.expand.values.items]
				];
				const oParameterMap = new Map(aDefaultParameters.concat(aAdditionalParameters));
				const aParameters = Array.from(oParameterMap).map(aKeyValuePair => {
					return {
						name: aKeyValuePair[0],
						value: aKeyValuePair[1]
					}
				});

				aParameters.get = oParameterMap.get;
				var oRequest = {
					queryPath: `calculation-versions/${iCvId}`,
					method: $.net.http.GET,
					parameters: aParameters
				};
				return oRequest;
			}

			it('should respond with complete calculation version if it exists and the user has the necessary privileges', function () {
				// act
				new Dispatcher(oCtx, buildRequest(), oResponseStub).dispatch();

				//assert
				expect(oResponseStub.status).toBe($.net.http.OK);
				const oCalculationVersion = oResponseStub.getParsedBody().body.transactionaldata[0];
				expect(oCalculationVersion).toBeDefined();
				expect(oCalculationVersion.CALCULATION_VERSION_ID).toEqual(testData.iCalculationVersionId);
				expect(oCalculationVersion.ITEMS.length).toBe(3)
			});
			
			it('should return single references data for the read calculation version', function () {
				// act
				const iReferenceVersionId = testData.iSecondVersionId;
				oMockstar.clearTable("item");
				let oItemWithReferences = new TestDataUtility(testData.oItemTestData).build();
				oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID = [];
				oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID.push(iReferenceVersionId);
				oMockstar.insertTableData("item", oItemWithReferences);
				new Dispatcher(oCtx, buildRequest(), oResponseStub).dispatch();

				//assert
				expect(oResponseStub.status).toBe($.net.http.OK);
				const oReferenceData = oResponseStub.getParsedBody().body.referencesdata;
				expect(oReferenceData).toBeDefined();

                // check the returned reference version
				const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iReferenceVersionId;
                const oReferenceVersion = new TestDataUtility(testData.oCalculationVersionTestData).getObjects(fPredicate)[0];
				expect(oReferenceData.CALCULATION_VERSIONS.length).toBe(1);
				expect(oReferenceData.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID).toEqual(iReferenceVersionId);
				expect(oReferenceData.CALCULATION_VERSIONS[0]).toMatchData(oReferenceVersion, [ 'CALCULATION_VERSION_ID']);
				// check the returned reference calculation
				const fPredicateCalculation = oObject => oObject.CALCULATION_ID === oReferenceVersion.CALCULATION_ID;
                const oReferenceCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects(fPredicateCalculation)[0];
				expect(oReferenceData.CALCULATIONS.length).toBe(1);
				expect(oReferenceData.CALCULATIONS[0]).toMatchData(oReferenceCalculation, [ 'CALCULATION_ID']);
				// check the returned reference project
				const fPredicateProject = oObject => oObject.PROJECT_ID === oReferenceCalculation.PROJECT_ID;
                const oReferenceProject = new TestDataUtility(testData.oProjectTestData).getObjects(fPredicateProject)[0];
				expect(oReferenceData.PROJECTS.length).toBe(1);
				expect(oReferenceData.PROJECTS[0]).toMatchData(oReferenceProject, [ 'PROJECT_ID']);
			});
			
			it('should not return the references data if the calculation version does not have any', function () {
				// act
				oMockstar.clearTable("item");
				let oItemWithoutReferences = new TestDataUtility(testData.oItemTestData).build();
				oItemWithoutReferences.REFERENCED_CALCULATION_VERSION_ID = Array(oItemWithoutReferences.ITEM_ID.length).fill(null);
				oMockstar.insertTableData("item", oItemWithoutReferences);
				new Dispatcher(oCtx, buildRequest(), oResponseStub).dispatch();

				//assert
				expect(oResponseStub.status).toBe($.net.http.OK);
				const oReferenceData = oResponseStub.getParsedBody().body.referencesdata;
				expect(oReferenceData).not.toBeDefined();
			});

            it('should return multiple references data for the read calculation version', function () {
				// act
				// enter extra privilege and projects since version 5809 belongs to project PR3
				oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
				enterPrivilege(testData.oProjectCurrencyTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
				const iFirstReferenceVersionId = testData.iSecondVersionId;
				const iSecondReferenceVersionId = 5809;

				oMockstar.clearTable("item");
				let oItemWithReferences = new TestDataUtility(testData.oItemTestData).build();
				oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID = [];
				oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID.push(iFirstReferenceVersionId);
				oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID.push(iSecondReferenceVersionId);
				oMockstar.insertTableData("item", oItemWithReferences);
				new Dispatcher(oCtx, buildRequest(), oResponseStub).dispatch();

				//assert
				expect(oResponseStub.status).toBe($.net.http.OK);
				const oReferenceData = oResponseStub.getParsedBody().body.referencesdata;
				expect(oReferenceData).toBeDefined();

				expect(oReferenceData.CALCULATION_VERSIONS.length).toBe(2);
				expect(oReferenceData.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID).toEqual(iFirstReferenceVersionId);
				expect(oReferenceData.CALCULATIONS.length).toBe(2);
				expect(oReferenceData.PROJECTS.length).toBe(2);
			});

			it('should return GENERAL_ENTITY_NOT_FOUND_ERROR not found when calculation version does not exists', function () {
				//arrange
				var iInvalidCalculationId = 999999;
				
				// act
				new Dispatcher(oCtx, buildRequest(iInvalidCalculationId), oResponseStub).dispatch();
				
				//assert
				var oFirstMessage = oResponseStub.getParsedBody().head.messages[0];
				expect(oFirstMessage.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
			});

			it('should throw GENERAL_ACCESS_DENIED if the user has no READ instance-based-privilege', function () {
				// arrange
				// remove privileges of all versions => user should not be allowed to read any version 
				oMockstar.clearTable("authorization");

				// act
				new Dispatcher(oCtx, buildRequest(), oResponseStub).dispatch();
				
				//assert
				var oFirstMessage = oResponseStub.getParsedBody().head.messages[0];
				expect(oFirstMessage.code).toBe(messageCode.GENERAL_ACCESS_DENIED.code);
				expect(oResponseStub.status).toBe($.net.http.FORBIDDEN);
			});

		});
	});

	describe('Freezing Calculation Versions', function() {
		afterOnce(function() {
			oMockstar.cleanup(); // clean up all test artefacts
		});

		beforeEach(function() {
		    oResponseStub = new ResponseObjectStub();
			oMockstar.clearAllTables(); // clear all specified substitute tables and views

			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;

			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
			}
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
			oMockstar.insertTableData("session", testData.oSessionTestData);
			
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.FULL_EDIT);

			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
		});

		function buildFreezeRequest(bOmitItems) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "action",
				"value" : "freeze"
			}, {
				"name": "omitItems",
				"value": bOmitItems
			}];
			params.get = function(sArgument) {
				if(sArgument === "action") return "freeze";
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.POST,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify([{
								CALCULATION_VERSION_ID: testData.iCalculationVersionId
							}]);
						}
					}
			};
			return oRequest;
		}

		if(jasmine.plcTestRunParameters.mode === 'all') {
			it('should freeze a valid calculation version => calculation version should be frozen and non-writeable in response', function() {
				// arrange
				var oRequest = buildFreezeRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				
				// The response should contain the frozen calculation version 
				// and a message that says the version is not writeable anymore
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResult = oResponseObject.body;
				
				expect(oResult.transactionaldata[0].CALCULATION_VERSION_ID).toEqual(testData.iCalculationVersionId);
				expect(oResult.transactionaldata[0].IS_FROZEN).toEqual(1);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
				expect(oResponseObject.head.messages[0].severity).toBe(severity.INFO);
				expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);
				
			});
			
			it('should return CALCULATIONVERSION_NOT_WRITABLE_ERROR if calculation version is not open', function() {
				// arrange
				// set no calculation versions are open
				oMockstar.clearTable("open_calculation_versions");
				var oRequest = buildFreezeRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(_.filter(oResponseObject.head.messages[0].details.calculationVersionObjs, {"id":testData.iCalculationVersionId}).length).toBe(1);
				
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.CALCULATIONVERSION_NOT_WRITABLE_ERROR.code);
				expect(oResponseObject.head.messages[0].severity).toBe(severity.ERROR);
				expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);
			});		
			
			it('should return CALCULATIONVERSION_NOT_WRITABLE_ERROR if calculation version is not open as writeable', function() {
				// arrange
				// set calculation versions to open as read-only
				oMockstar.clearTable("open_calculation_versions");
				oMockstar.insertTableData("open_calculation_versions",
						{
							SESSION_ID : [ testData.sSessionId ],
							CALCULATION_VERSION_ID : [ testData.iCalculationVersionId ],
							IS_WRITEABLE : [ 0 ],
						}
				);
				
				var oRequest = buildFreezeRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(_.filter(oResponseObject.head.messages[0].details.calculationVersionObjs, {"id":testData.iCalculationVersionId}).length).toBe(1);
				
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.CALCULATIONVERSION_NOT_WRITABLE_ERROR.code);
				expect(oResponseObject.head.messages[0].severity).toBe(severity.ERROR);
				expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);
			});	

			it('should return CALCULATIONVERSION_NOT_SAVED_ERROR if calculation version is not saved', function() {
				// arrange
				// set calculation version to not saved ("dirty")
				oMockstar.clearTable("item_temporary");
				var oItemTempData = JSON.parse(JSON.stringify(testData.oItemTemporaryTestData));
				oItemTempData.IS_DIRTY[0] = 1;
				oMockstar.insertTableData("item_temporary", oItemTempData);
				
				var oRequest = buildFreezeRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(_.filter(oResponseObject.head.messages[0].details.calculationVersionObjs, {"id":testData.iCalculationVersionId}).length).toBe(1);
				
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.CALCULATIONVERSION_NOT_SAVED_ERROR.code);
				expect(oResponseObject.head.messages[0].severity).toBe(severity.ERROR);
				expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);
			});	
			
			it('should return CALCULATIONVERSION_ALREADY_FROZEN_INFO if calculation version is already frozen', function() {
				// arrange
				// insert calculation version with IS_FROZEN = 1
				var oCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
				oCalculationVersion.IS_FROZEN = 1;
				var oCalculationVersionTemporary = _.extend(_.cloneDeep(oCalculationVersion), {"SESSION_ID": testData.sSessionId});
				
				oMockstar.clearTable("calculation_version");
				oMockstar.clearTable("calculation_version_temporary");
				oMockstar.insertTableData("calculation_version", oCalculationVersion);
				oMockstar.insertTableData("calculation_version_temporary", oCalculationVersionTemporary);
			
				var oRequest = buildFreezeRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				// The response should contain a message that says the version is already frozen
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(_.filter(oResponseObject.head.messages[0].details.calculationVersionObjs, {"id":testData.iCalculationVersionId}).length).toBe(1);
				
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.CALCULATIONVERSION_ALREADY_FROZEN_INFO.code);
				expect(oResponseObject.head.messages[0].severity).toBe(severity.INFO);
				expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);

			});
			
			it('should return CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR if calculation version is a lifecycle version', function() {
				// arrange
				// insert calculation version with CALCULATION_VERSION_TYPE = 2
				var oCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
				oCalculationVersion.CALCULATION_VERSION_TYPE = 2;
				var oCalculationVersionTemporary = _.extend(_.cloneDeep(oCalculationVersion), {"SESSION_ID": testData.sSessionId});
				
				oMockstar.clearTable("calculation_version");
				oMockstar.clearTable("calculation_version_temporary");
				oMockstar.insertTableData("calculation_version", oCalculationVersion);
				oMockstar.insertTableData("calculation_version_temporary", oCalculationVersionTemporary);
			
				var oRequest = buildFreezeRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				// The response should contain a message that says the version is already frozen
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(_.filter(oResponseObject.head.messages[0].details.calculationVersionObjs, {"id":testData.iCalculationVersionId}).length).toBe(1);
				
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR.code);
				expect(oResponseObject.head.messages[0].severity).toBe(severity.ERROR);
				expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);

			});

			it('should return CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR if calculation version is a manual lifecycle version', function() {
				// arrange
				// insert calculation version with CALCULATION_VERSION_TYPE = 16
				var oCalculationVersion = mockstart_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
				oCalculationVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.ManualLifecycleVersion;
				var oCalculationVersionTemporary = _.extend(_.cloneDeep(oCalculationVersion), {"SESSION_ID": testData.sSessionId});
				
				oMockstar.clearTable("calculation_version");
				oMockstar.clearTable("calculation_version_temporary");
				oMockstar.insertTableData("calculation_version", oCalculationVersion);
				oMockstar.insertTableData("calculation_version_temporary", oCalculationVersionTemporary);
			
				var oRequest = buildFreezeRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				// The response should contain a message that says the version is already frozen
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(_.filter(oResponseObject.head.messages[0].details.calculationVersionObjs, {"id":testData.iCalculationVersionId}).length).toBe(1);
				
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR.code);
				expect(oResponseObject.head.messages[0].severity).toBe(severity.ERROR);
				expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);

			});

			it('should freeze a valid calculation version with lifecycle version assigned => lifecycle versions are frozen as well', function() {
				// arrange
				var sExpectedDate = new Date().toJSON();
				var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON();
				var oCalculationVersion = {
						"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId, 4809, 5809 ],
						"CALCULATION_ID" : [ 1978, 1978, 1978 ],
						"CALCULATION_VERSION_NAME" : [ "Baseline Version1", "Baseline Version2", "Baseline Version3" ],
						"CALCULATION_VERSION_TYPE" : [ 1, 2, 2 ],
						"BASE_VERSION_ID" : [ null, testData.iCalculationVersionId, testData.iCalculationVersionId ],
						"ROOT_ITEM_ID" : [ 3001, 5001, 7001 ],
						"CUSTOMER_ID" : [ "", "", "" ],
						"SALES_PRICE" : [ 20,10,10 ],
						"SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
						"REPORT_CURRENCY_ID" : [ "EUR", "USD", "EUR" ],
						"COSTING_SHEET_ID" : [ "COGM", "COGM", "COGM" ],
						"COMPONENT_SPLIT_ID" : [ "1", "1", "1" ],
						"SALES_DOCUMENT" : ["DOC", "DOC", "DOC"],
						"START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
						"END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
						"VALUATION_DATE" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
						"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
						"LAST_MODIFIED_BY" : [ sUserId, sUserId, sUserId ],
						"MASTER_DATA_TIMESTAMP" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
						"IS_FROZEN" : [ 0, 0, 0 ],
						"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
						"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
				};
				var oCalculationVersionTemporary = _.extend(_.cloneDeep(oCalculationVersion), {"SESSION_ID": testData.sSessionId});
				oMockstar.clearTable("calculation_version");
				oMockstar.clearTable("calculation_version_temporary");
				oMockstar.insertTableData("calculation_version", oCalculationVersion);
				oMockstar.insertTableData("calculation_version_temporary", oCalculationVersionTemporary);
				var aCalculationVersionsIds = [ testData.iCalculationVersionId, 4809, 5809 ];
    			var resultFlagsBefore = oMockstar.execQuery(`select CALCULATION_VERSION_ID, IS_FROZEN from {{calculation_version}} where CALCULATION_VERSION_ID in (${aCalculationVersionsIds})`);
	    		var expectedFlagsBefore = {
	    				"CALCULATION_VERSION_ID" : aCalculationVersionsIds,
	    				"IS_FROZEN" : [ 0, 0, 0 ]
	    		};	
	    		var expectedFlagsAfter = {
	    				"CALCULATION_VERSION_ID" : aCalculationVersionsIds,
	    				"IS_FROZEN" : [ 1, 1, 1 ]
	    		};
				var oRequest = buildFreezeRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				
				// The response should contain the frozen calculation version 
				// and a message that says the version is not writeable anymore
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResult = oResponseObject.body;
				
				expect(oResult.transactionaldata[0].CALCULATION_VERSION_ID).toEqual(testData.iCalculationVersionId);
				expect(oResult.transactionaldata[0].IS_FROZEN).toEqual(1);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
				expect(oResponseObject.head.messages[0].severity).toBe(severity.INFO);
				expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);
				
				// Check if all lifecycle versions are frozen
				expect(resultFlagsBefore).toMatchData(expectedFlagsBefore, [ 'CALCULATION_VERSION_ID', 'IS_FROZEN' ]);
        		var resultFlagsAfter = oMockstar.execQuery(`select CALCULATION_VERSION_ID, IS_FROZEN from {{calculation_version}} where CALCULATION_VERSION_ID in (${aCalculationVersionsIds})`);
	        	expect(resultFlagsAfter).toMatchData(expectedFlagsAfter, [ 'CALCULATION_VERSION_ID', 'IS_FROZEN' ]);
				
			});
			
			it('should return an empty array for ITEMS if omitItems is set to true', function() {
				// arrange
				var oRequest = buildFreezeRequest(true);

				// act
				new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

				// assert
				expect(oResponseStub.status).toBe($.net.http.OK);
				const oResponseBody = oResponseStub.getParsedBody();
				expect(oResponseBody.body.transactionaldata[0].ITEMS).toEqual(aEmptyArray);
			});
		}
	});

	describe('patch single calculation version', function () {

		let mockstar = null;
		let oResponseStub = null;

		beforeOnce(function () {
			mockstar = new MockstarFacade({
				testmodel: {
					"calculations_versions_read": "sap.plc.db.calculationmanager.procedures/p_calculations_versions_read"
				},
				substituteTables: {
					calculation: {
						name: mTableNames.calculation,
						data: testData.oCalculationTestData
					},
					project: {
						name: mTableNames.project,
						data: testData.oProjectTestData
					},
					calculationVersion: {
						name: mTableNames.calculation_version,
						data: testData.oCalculationVersionTestData
					},
					open_calculation_versions: mTableNames.open_calculation_versions,
					session: {
						name: 'sap.plc.db::basis.t_session',
						data: testData.oSessionTestData
					},
					authorization: "sap.plc.db::auth.t_auth_project"
				}
			});
		});

		beforeEach(function () {
			mockstar.clearAllTables();
			mockstar.initializeData();
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[1], sUserId, InstancePrivileges.READ);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[2], sUserId, InstancePrivileges.READ);
			oResponseStub = new ResponseObjectStub();
		});

		afterOnce(function () {
			mockstar.cleanup();
		});

		describe("lock and unlock calculation version", () => {

			const iValidCalculationVersionId = testData.iCalculationVersionId;
			const oValidLockRequestObjectForCalculationVersion = { 
				LOCK: {
					IS_WRITEABLE: 1,
					CONTEXT: Constants.CalculationVersionLockContext.CALCULATION_VERSION
				}
			};
			const oValidLockRequestObjectForVariantMatrix = { 
				LOCK: {
					IS_WRITEABLE: 1,
					CONTEXT: Constants.CalculationVersionLockContext.VARIANT_MATRIX
				}
			};
			const oValidUnlockRequestObjectForVariantMatrix = { 
				LOCK: {
					IS_WRITEABLE: 0,
					CONTEXT: Constants.CalculationVersionLockContext.VARIANT_MATRIX
				}
			};

			const oTableDataSessions = {
				"SESSION_ID" : [ sSessionId, 'UserX' ],
				"USER_ID" : [ sSessionId, 'UserX' ],
				"LANGUAGE" : [ testData.sDefaultLanguage, testData.sEnLanguage ],
				"LAST_ACTIVITY_TIME" : [ testData.sExpectedDate, testData.sExpectedDate]
			};

			const buildRequest = (iCvId, oRequestObject) => {
				var oRequest = {
					queryPath: `calculation-versions/${iCvId}`,
					method: $.net.http.PATCH,
					body : {
						asString : function() {
							return JSON.stringify(oRequestObject);
						}
					},
					parameters: []
				};
				return oRequest;
			}

			it(`should return GENERAL_ENTITY_NOT_FOUND_ERROR if calculation version does not exist`, function() {
				var iInvalidCalculationId = 999999;

				new Dispatcher(oCtx, buildRequest(iInvalidCalculationId, oValidLockRequestObjectForCalculationVersion), oResponseStub).dispatch();

				expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);

				var oFirstMessage = oResponseStub.getParsedBody().head.messages[0];
				expect(oFirstMessage.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
			});

			it(`should lock a calculation version for write access for use as base version within a variant matrix`, function() {
				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForVariantMatrix), oResponseStub).dispatch();

				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseStub.getParsedBody().body).toEqual({});
				expect(oResponseStub.getParsedBody().head).toEqual({});
			});

			it(`should unlock a calculation version from write access that is being used as base version within a variant matrix`, function() {
				let oTableDataOpenCalculationVersions = {
					"SESSION_ID" : [ sSessionId ],
					"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
					"CONTEXT" : [ Constants.CalculationVersionLockContext.VARIANT_MATRIX ],
					"IS_WRITEABLE" : [ 1 ]
				};

				oMockstar.clearTable("open_calculation_versions");
				oMockstar.insertTableData("open_calculation_versions", oTableDataOpenCalculationVersions);
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oTableDataSessions);

				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidUnlockRequestObjectForVariantMatrix), oResponseStub).dispatch();

				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseStub.getParsedBody().body).toEqual({});
				expect(oResponseStub.getParsedBody().head).toEqual({});
			});

			it(`should return success if calculation version already is locked for write access by the same user in the same lock context`, function() {
				let oTableDataOpenCalculationVersions = {
					"SESSION_ID" : [ sSessionId, sSessionId ],
					"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId, testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1] ],
					"CONTEXT" : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION, Constants.CalculationVersionLockContext.VARIANT_MATRIX ],
					"IS_WRITEABLE" : [ 1, 1 ]
				};

				oMockstar.clearTable("open_calculation_versions");
				oMockstar.insertTableData("open_calculation_versions", oTableDataOpenCalculationVersions);
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oTableDataSessions);

				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForCalculationVersion), oResponseStub).dispatch();
				
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseStub.getParsedBody().body).toEqual({});
				expect(oResponseStub.getParsedBody().head).toEqual({});
			});

			it(`should empty the t_variant_temporary and t_variant_item_temporary tables when unlock a VM`, () => {
				//arrange
				let oTableDataOpenCalculationVersions = {
					"SESSION_ID" : [ sSessionId ],
					"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
					"CONTEXT" : [ Constants.CalculationVersionLockContext.VARIANT_MATRIX ],
					"IS_WRITEABLE" : [ 1 ]
				};
				oMockstar.clearTable("open_calculation_versions");
				oMockstar.insertTableData("open_calculation_versions", oTableDataOpenCalculationVersions);
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oTableDataSessions);
				oMockstar.insertTableData("variant", testData.oVariantTestData);
				oMockstar.insertTableData("variant_item", testData.oVariantItemTestData);
				const oResult = oMockstar.execQuery(`SELECT VARIANT_ID FROM {{variant}} WHERE "CALCULATION_VERSION_ID" = ${testData.iCalculationVersionId};`);
				const aVariantIds = oResult.columns.VARIANT_ID.rows;
				oMockstar.execSingle(`INSERT INTO {{variant_temporary}} SELECT * FROM {{variant}} WHERE "CALCULATION_VERSION_ID" = ${testData.iCalculationVersionId};`);
				oMockstar.execSingle(`INSERT INTO {{variant_item_temporary}} SELECT VARIANT_ID, ITEM_ID, ${testData.iCalculationVersionId} as CALCULATION_VERSION_ID, IS_INCLUDED, QUANTITY, QUANTITY_CALCULATED, QUANTITY_STATE, QUANTITY_UOM_ID, TOTAL_QUANTITY, TOTAL_COST FROM {{variant_item}} WHERE "VARIANT_ID" IN (${aVariantIds});`);
				
				//act
				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidUnlockRequestObjectForVariantMatrix), oResponseStub).dispatch();

				//assert
				const oCountVariantTemp = oMockstar.execQuery(`SELECT COUNT(*) AS COUNTER FROM {{variant_temporary}} WHERE "CALCULATION_VERSION_ID" = ${testData.iCalculationVersionId};`);
				const oCountItemVariantTemp = oMockstar.execQuery(`SELECT COUNT(*) AS COUNTER FROM {{variant_item_temporary}} WHERE "VARIANT_ID" IN (${aVariantIds});`);
				expect(oCountVariantTemp.columns.COUNTER.rows[0]).toBe(0);
				expect(oCountItemVariantTemp.columns.COUNTER.rows[0]).toBe(0);
			});

			it(`should return GENERAL_ACCESS_DENIED if user does not have sufficient privileges to lock a calculation version`, function() {
				// Calculation version id from project with only read privileges
				new Dispatcher(oCtx, buildRequest(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2], oValidLockRequestObjectForVariantMatrix), oResponseStub).dispatch();

				expect(oResponseStub.status).toBe($.net.http.FORBIDDEN);
				expect(oResponseStub.getParsedBody().head.messages[0].code).toBe('GENERAL_ACCESS_DENIED');
			});

			it(`should return ENTITY_NOT_WRITEABLE_INFO if calculation version is locked for write access by another user in the same lock context`, function() {
				let oTableDataOpenCalculationVersions = {
					"SESSION_ID" : [ 'UserX' ],
					"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
					"CONTEXT" : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION ],
					"IS_WRITEABLE" : [ 1 ]
				};

				oMockstar.clearTable("open_calculation_versions");
				oMockstar.insertTableData("open_calculation_versions", oTableDataOpenCalculationVersions);
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oTableDataSessions);

				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForCalculationVersion), oResponseStub).dispatch();

				expect(oResponseStub.status).toBe($.net.http.EXPECTATION_FAILED);

				var oFirstMessage = oResponseStub.getParsedBody().head.messages[0];
				expect(oFirstMessage.code).toBe('ENTITY_NOT_WRITEABLE_INFO');
				expect(oFirstMessage.details.userObjs[0].id).toBe(oTableDataSessions.USER_ID[1]);
				expect(oFirstMessage.details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);
				expect(oFirstMessage.details.notWriteableEntityDetailsObj).toBe(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_BY_ANOTHER_USER);
			});
			
			it(`should return ENTITY_NOT_WRITEABLE_INFO if calculation version is locked for write access by another user in a different lock context`, function() {
				let oTableDataOpenCalculationVersions = {
					"SESSION_ID" : [ 'UserX' ],
					"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId],
					"CONTEXT" : [ Constants.CalculationVersionLockContext.VARIANT_MATRIX ],
					"IS_WRITEABLE" : [ 1 ]
				};

				oMockstar.clearTable("open_calculation_versions");
				oMockstar.insertTableData("open_calculation_versions", oTableDataOpenCalculationVersions);
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oTableDataSessions);

				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForCalculationVersion), oResponseStub).dispatch();

				expect(oResponseStub.status).toBe($.net.http.EXPECTATION_FAILED);

				var oFirstMessage = oResponseStub.getParsedBody().head.messages[0];
				expect(oFirstMessage.code).toBe('ENTITY_NOT_WRITEABLE_INFO');
				expect(oFirstMessage.details.userObjs[0].id).toBe(oTableDataSessions.USER_ID[1]);
				expect(oFirstMessage.details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);
				expect(oFirstMessage.details.notWriteableEntityDetailsObj).toBe(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_BY_ANOTHER_USER);
			});

			it(`should set writable calculation version to read-only if the variant matrix is opened for it`, () => {
				let oTableDataOpenCalculationVersions = {
					"SESSION_ID" : [ sSessionId ],
					"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
					"CONTEXT" : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION ],
					"IS_WRITEABLE" : [ 1 ]
				};

				oMockstar.clearTable("open_calculation_versions");
				oMockstar.insertTableData("open_calculation_versions", oTableDataOpenCalculationVersions);
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oTableDataSessions);

				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForVariantMatrix), oResponseStub).dispatch();

				expect(oResponseStub.status).toBe($.net.http.OK);

				const oOpenCalculationVersionDataAfter = oMockstar.execQuery("select * from {{open_calculation_versions}}");
				expect(oOpenCalculationVersionDataAfter).toMatchData({
					"SESSION_ID": [sSessionId, sSessionId],
					"CALCULATION_VERSION_ID": [testData.iCalculationVersionId, testData.iCalculationVersionId],
					"CONTEXT": [Constants.CalculationVersionLockContext.CALCULATION_VERSION, Constants.CalculationVersionLockContext.VARIANT_MATRIX],
					"IS_WRITEABLE": [0, 1],
				}, ["SESSION_ID", "CALCULATION_VERSION_ID", "CONTEXT"]);
			});

			
			it(`should return GENERAL_ACCESS_DENIED if user does not have any instance based privileges for the version is trying to lock`, function() {
                oMockstar.clearTable("authorization");
                new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForVariantMatrix), oResponseStub).dispatch();
				expect(oResponseStub.status).toBe($.net.http.FORBIDDEN);
				expect(oResponseStub.getParsedBody().head.messages[0].code).toBe('GENERAL_ACCESS_DENIED');
			});
			it(`should return ENTITY_NOT_WRITEABLE_INFO if calculation version is source version and the lock context is calculation_version`, function() {
				const oMasterVersionsCalculationVersions = new TestDataUtility(testData.oItemTestData).build();
                oMasterVersionsCalculationVersions.REFERENCED_CALCULATION_VERSION_ID = Array(oMasterVersionsCalculationVersions.ITEM_ID.length).fill(testData.iCalculationVersionId);
                oMockstar.clearTable("item");
				oMockstar.insertTableData("item", oMasterVersionsCalculationVersions);
				
				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForCalculationVersion), oResponseStub).dispatch();

				expect(oResponseStub.status).toBe($.net.http.EXPECTATION_FAILED);

				var oFirstMessage = oResponseStub.getParsedBody().head.messages[0];
				expect(oFirstMessage.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITEABLE_INFO.code);
				expect(oFirstMessage.details.calculationVersionObjs[0].id).toBe(testData.iCalculationVersionId);
				expect(oFirstMessage.details.notWriteableEntityDetailsObj).toBe(MessageLibrary.NotWriteableEntityDetailsCode.IS_SOURCE);
			});
			
			it(`should correctly set the lock if calculation version is source version and the lock context is variant_matrix`, function() {  
				const oMasterVersionsCalculationVersions = new TestDataUtility(testData.oItemTestData).build();
                oMasterVersionsCalculationVersions.REFERENCED_CALCULATION_VERSION_ID = Array(oMasterVersionsCalculationVersions.ITEM_ID.length).fill(testData.iCalculationVersionId);
                oMockstar.clearTable("item");
				oMockstar.insertTableData("item", oMasterVersionsCalculationVersions);
				
				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForVariantMatrix), oResponseStub).dispatch();
				
				expect(oResponseStub.status).toBe($.net.http.OK);
				expect(oResponseStub.getParsedBody().body).toEqual({});
				expect(oResponseStub.getParsedBody().head).toEqual({});
			});

			it(`should correctly move into temporary tables the variant header and variant items to temporary tables if lock context is variant_matrix`, function() {  
				//arrange
				oMockstar.clearTable("variant");
                oMockstar.clearTable("variant_item");
                oMockstar.clearTable("variant_temporary");
                oMockstar.clearTable("variant_item_temporary");
				oMockstar.insertTableData("variant", testData.oVariantTestData);
				oMockstar.insertTableData("variant_item", testData.oVariantItemTestData);
				
				//act
				new Dispatcher(oCtx, buildRequest(testData.iCalculationVersionId, oValidLockRequestObjectForVariantMatrix), oResponseStub).dispatch();
				
				//assert
				const aParentVariantHeaders = oMockstar.execQuery(`select * from {{variant}} where calculation_version_id = ${testData.iCalculationVersionId}`);
            	const aParentVariantItems = oMockstar.execQuery(`select * from {{variant_item}} where VARIANT_ID = ${testData.iVariantId}`);
            	const aMovedVariantHeaders = oMockstar.execQuery(`select * from {{variant_temporary}} where calculation_version_id = ${testData.iCalculationVersionId}`);
				const aMovedVariantItems = oMockstar.execQuery(`select * from {{variant_item_temporary}} where VARIANT_ID = ${testData.iVariantId}`);
				
				// not necessary
				delete aMovedVariantItems.columns.CALCULATION_VERSION_ID;

				expect(oResponseStub.status).toBe($.net.http.OK);
            	expect(aParentVariantHeaders).toMatchData(aMovedVariantHeaders, ["VARIANT_ID", "CALCULATION_VERSION_ID"]);
            	expect(aParentVariantItems).toMatchData(aMovedVariantItems, ["VARIANT_ID"]);
			});

			it(`should not move into temporary tables the variant header and variant items to temporary tables if lock context is variant_matrix if calculation version does not exist`, function() {  
				//arrange
				oMockstar.clearTable("variant");
                oMockstar.clearTable("variant_item");
                oMockstar.clearTable("variant_temporary");
                oMockstar.clearTable("variant_item_temporary");
				oMockstar.insertTableData("variant", testData.oVariantTestData);
				oMockstar.insertTableData("variant_item", testData.oVariantItemTestData);
				
				//act
				new Dispatcher(oCtx, buildRequest(999, oValidLockRequestObjectForVariantMatrix), oResponseStub).dispatch();
				
				//assert
            	const aVariantHeaders = oMockstar.execQuery(`select VARIANT_ID from {{variant_temporary}} where calculation_version_id = ${testData.iCalculationVersionId}`).columns.VARIANT_ID.rows;
            	const aVariantItems = oMockstar.execQuery(`select ITEM_ID from {{variant_item_temporary}} where VARIANT_ID = ${testData.iVariantId}`).columns.ITEM_ID.rows;
				expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            	expect(Array.from(aVariantHeaders).length).toBe(0);
            	expect(Array.from(aVariantItems).length).toBe(0);
			});

			it(`should not move into temporary tables the variant header and variant items to temporary tables if lock context is variant_matrix and if calculation version does not have a variant matrix`, function() {  
				//arrange
				oMockstar.clearTable("variant");
                oMockstar.clearTable("variant_item");
                oMockstar.clearTable("variant_temporary");
                oMockstar.clearTable("variant_item_temporary");
				oMockstar.insertTableData("variant", testData.oVariantTestData);
				oMockstar.insertTableData("variant_item", testData.oVariantItemTestData);
				
				//act
				new Dispatcher(oCtx, buildRequest(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2], oValidLockRequestObjectForVariantMatrix), oResponseStub).dispatch();
				
				//assert
            	const aVariantHeaders = oMockstar.execQuery(`select VARIANT_ID from {{variant_temporary}} where calculation_version_id = ${testData.iCalculationVersionId}`).columns.VARIANT_ID.rows;
            	const aVariantItems = oMockstar.execQuery(`select ITEM_ID from {{variant_item_temporary}} where VARIANT_ID = ${testData.iVariantId}`).columns.ITEM_ID.rows;
				expect(oResponseStub.status).toBe($.net.http.FORBIDDEN);
            	expect(Array.from(aVariantHeaders).length).toBe(0);
            	expect(Array.from(aVariantItems).length).toBe(0);
			});
		});
	});

	
	/**
	 * Helper that acts and checks for tests in which the versions and assigned entities should not be deleted
	 */
	function requestAndCheckDbNotChangedAndException(oRequest, iCalculationVersionId, oExpectedMessageCode) {
		let iOriginalCount_Calculation = mockstart_helpers.getRowCount(oMockstar, "calculation");
		let iOriginalCount_CalculationVersion = mockstart_helpers.getRowCount(oMockstar, "calculation_version");
		let iOriginalCount_GivenCalculationVersion = mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id=" + iCalculationVersionId);
		let iOriginalCount_ItemAll = mockstart_helpers.getRowCount(oMockstar, "item");
		let iOriginalCount_ItemForGivenCalcVersion = mockstart_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + iCalculationVersionId);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			var iOriginalCount_ItemExtAll = mockstart_helpers.getRowCount(oMockstar, "item_ext");
		}

		// act
		new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

		// assert
		//Check that no entity was deleted
		expect(mockstart_helpers.getRowCount(oMockstar, "calculation")).toEqual(iOriginalCount_Calculation);
		expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version")).toEqual(iOriginalCount_CalculationVersion);
		expect(mockstart_helpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id=" + iCalculationVersionId)).toEqual(iOriginalCount_GivenCalculationVersion);
		expect(mockstart_helpers.getRowCount(oMockstar, "item")).toEqual(iOriginalCount_ItemAll);
		expect(mockstart_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + iCalculationVersionId)).toEqual(iOriginalCount_ItemForGivenCalcVersion);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(mockstart_helpers.getRowCount(oMockstar, "item_ext")).toEqual(iOriginalCount_ItemExtAll);
		}

		// Check response
	    expect(oDefaultResponseMock.status).toBe(oExpectedMessageCode.responseCode);
		expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
		let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		expect(oResponseObject.head.messages.length).toEqual(1);
		expect(oResponseObject.head.messages[0].code).toEqual(oExpectedMessageCode.code);
		
		return oResponseObject;
	}

}).addTags(["Project_Calculation_Version_Integration"]);