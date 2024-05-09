/*jslint undef:true*/
var _ = require("lodash");

var helpers = require("../../../lib/xs/util/helpers");
var constants = require("../../../lib/xs/util/constants");
var ServiceParameters = constants.ServiceParameters;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
var PersistencyImport = $.import("xs.db", "persistency");
var PersistencyItemImport = require("../../../lib/xs/db/persistency-item");
var AdministrationImport = $.import("xs.db", "persistency-administration");
var AuthorizationManager = require("../../../lib/xs/authorization/authorization-manager");

var MessageLibrary = require("../../../lib/xs/util/message");
var Code = MessageLibrary.Code;

var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

var Persistency = PersistencyImport.Persistency;

var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var test_helpers = require("../../testtools/test_helpers");
var testData = require("../../testdata/testdata").data;
var testDataGenerator = require("../../testdata/testdataGenerator");
var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase();

var oMockstar = null;

var oDefaultResponseMock = null;
var oPersistency = null;
var iCvId = testData.iCalculationVersionId;
var iCalculationId = testData.iCalculationId;
var sMasterDataDateTime = new Date().toJSON();

var sSessionId = testData.sSessionId;
const ResponseObjectStub = require("../../testtools/responseObjectStub").ResponseObjectStub;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;
describe("xsjs.impl.items-integrationtests", function() {

	var originalProcedures = null;
	var mdOriginalProcedures = null;
	let oResponseStub = null;
	const emptyArray = [];

	var oItemTemporaryTestData = JSON.parse(JSON.stringify(testData.oItemTemporaryTestData));
	_.each(oItemTemporaryTestData, function(value, key) {
		oItemTemporaryTestData[key] = value.splice(0, 3);
	});
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oItemTemporaryExtTestData = JSON.parse(JSON.stringify(testData.oItemTemporaryExtData));
		_.each(oItemTemporaryExtTestData, function(value, key) {
			oItemTemporaryExtTestData[key] = value.splice(0, 3);
		});
	}

	var oCalculationVersion = {
			SESSION_ID : [ sSessionId ],
			CALCULATION_VERSION_ID : [ iCvId ],
			CALCULATION_ID : [ iCalculationId ],
			CALCULATION_VERSION_NAME : [ "Version" ],
			ROOT_ITEM_ID : [ 3001 ],
			REPORT_CURRENCY_ID : [ "EUR" ],
			COSTING_SHEET_ID : [ "COGS" ],
			VALUATION_DATE : [ "2014-01-01" ],
			MASTER_DATA_TIMESTAMP : [ sMasterDataDateTime ],
			MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy],
			ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy]
	};

	beforeOnce(function() {
		oMockstar = new MockstarFacade({
			testmodel : {
				create_item : "sap.plc.db.calculationmanager.procedures/p_item_create",
				delete_item : "sap.plc.db.calculationmanager.procedures/p_item_delete_item_with_children",
				get_items : "sap.plc.db.calculationmanager.procedures/p_item_get_items",
				delete_items : "sap.plc.db.calculationmanager.procedures/p_item_delete_items_marked_for_deletion",
				masterdata_read : "sap.plc.db.administration.procedures/p_calculation_configuration_masterdata_read",
				set_is_active_to_parents : "sap.plc.db.calculationmanager.procedures/p_item_set_is_activate_to_parents",
				set_is_active_to_children : "sap.plc.db.calculationmanager.procedures/p_item_set_is_active_to_children"
			},
			substituteTables : {
				gtt_calculation_version_ids: "sap.plc.db::temp.gtt_calculation_version_ids",
				gtt_changed_items: "sap.plc.db::temp.gtt_changed_items",
				calculation : "sap.plc.db::basis.t_calculation",
				calculationVersion : "sap.plc.db::basis.t_calculation_version",
				item : "sap.plc.db::basis.t_item",
				item_ext : "sap.plc.db::basis.t_item_ext",
				itemTemporary : "sap.plc.db::basis.t_item_temporary",
				itemTemporaryExt : "sap.plc.db::basis.t_item_temporary_ext",
				gtt_item_temporary: {
					name: "sap.plc.db::basis.gtt_item_temporary"
				},
				openCalculationVersion : "sap.plc.db::basis.t_open_calculation_versions",
				session : {
					name : "sap.plc.db::basis.t_session",
					data : testData.oSessionTestData
				},
				calculationVersionTemporary : "sap.plc.db::basis.t_calculation_version_temporary",
				calculation_version : "sap.plc.db::basis.t_calculation_version",
				priceSource : Resources["Price_Source"].dbobjects.plcTable,
				activity_type : {
					name: Resources["Activity_Type"].dbobjects.plcTable,
				},
				activityPrice : Resources["Activity_Price"].dbobjects.plcTable,
				activity_price_ext : Resources["Activity_Price"].dbobjects.plcExtensionTable,
				currency : {
					name : Resources["Currency"].dbobjects.plcTable,
					data :  testData.mCsvFiles.currency
				},
				priceComponents: "sap.plc.db::basis.t_price_component",
				currencyText : Resources["Currency"].dbobjects.plcTextTable,
				uom : {
					name : Resources["Unit_Of_Measure"].dbobjects.plcTable,
					data : testData.mCsvFiles.uom
				},
				uomText : Resources["Unit_Of_Measure"].dbobjects.plcTextTable,
				materialPricePlc : Resources["Material_Price"].dbobjects.plcTable,
				metadata : {
					name : "sap.plc.db::basis.t_metadata",
					data : testData.mCsvFiles.metadata
				},
				formula : "sap.plc.db::basis.t_formula",
				metadata_text : "sap.plc.db::basis.t_metadata__text",
				metadata_item_attributes : {
					name : "sap.plc.db::basis.t_metadata_item_attributes",
					data : testData.mCsvFiles.metadata_item_attributes
				},
				document_type : Resources["Document_Type"].dbobjects.plcTable,
				document_type_text : Resources["Document_Type"].dbobjects.plcTextTable,
				document : Resources["Document"].dbobjects.plcTable,
				costing_sheet : "sap.plc.db::basis.t_costing_sheet",
				item_category : {
					name: "sap.plc.db::basis.t_item_category",
					data: testData.oItemCategoryTestData
				},
				cost_center : {
					name : Resources["Cost_Center"].dbobjects.plcTable,
					data :  testData.oCostCenterTestDataPlc
				},
				costing_sheet__text : "sap.plc.db::basis.t_costing_sheet__text",
				costing_sheet_row : "sap.plc.db::basis.t_costing_sheet_row",
				costing_sheet_row__text : "sap.plc.db::basis.t_costing_sheet_row__text",
				component_split : "sap.plc.db::basis.t_component_split",
				component_split__text : "sap.plc.db::basis.t_component_split__text",
				account: {
					name: "sap.plc.db::basis.t_account",
					data: testData.oAccountForItemTestData
				},
				component_split_account_group : "sap.plc.db::basis.t_component_split_account_group",
				account_group : "sap.plc.db::basis.t_account_group",
				account_account_group : "sap.plc.db::basis.t_account_account_group",
				account_group__text : "sap.plc.db::basis.t_account_group__text",
				material_plant : "sap.plc.db::basis.t_material_plant",
				business_area : "sap.plc.db::basis.t_business_area",
				process: "sap.plc.db::basis.t_process",
				material : {
                    name: "sap.plc.db::basis.t_material",
                    data: testData.oMaterialTestDataPlc
                },
                material_ext : "sap.plc.db::basis.t_material_ext",
                plant : {
                    name: "sap.plc.db::basis.t_plant",
                    data: testData.oPlantTestDataPlc
                },
                company_code : {
                    name: "sap.plc.db::basis.t_company_code",
                    data: testData.oCompanyCodeTestDataPlc
                },
				costing_sheet_row_dependencies : "sap.plc.db::basis.t_costing_sheet_row_dependencies",
				costing_sheet_base : "sap.plc.db::basis.t_costing_sheet_base",
				costing_sheet_base_row : "sap.plc.db::basis.t_costing_sheet_base_row",
				costing_sheet_overhead : "sap.plc.db::basis.t_costing_sheet_overhead",
				costing_sheet_overhead_row : "sap.plc.db::basis.t_costing_sheet_overhead_row",
				currency_conversion : "sap.plc.db::basis.t_currency_conversion",
				controlling_area : "sap.plc.db::basis.t_controlling_area",
				item_calculated_values_costing_sheet : "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
				item_calculated_values_component_split : "sap.plc.db::basis.t_item_calculated_values_component_split",
				project : "sap.plc.db::basis.t_project",
				price_determination_strategy: {
					name: "sap.plc.db::basis.t_price_determination_strategy",
					data: testData.oPriceDeterminationStrategyTestData
				},
				price_determination_strategy_price_source: {
					name: "sap.plc.db::basis.t_price_determination_strategy_price_source",
					data: testData.oPriceDeterminationStrategyPriceSource
				},
				defaultSettings : {
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
				authorization: {
				    name : "sap.plc.db::auth.t_auth_project",
				    data : {
				        PROJECT_ID: testData.oProjectTestData.PROJECT_ID.concat(testData.oProjectCurrencyTestData.PROJECT_ID),
				        USER_ID: new Array(testData.oProjectTestData.PROJECT_ID.length + testData.oProjectCurrencyTestData.PROJECT_ID.length).fill(testData.sTestUser),
				        PRIVILEGE:new Array(testData.oProjectTestData.PROJECT_ID.length + testData.oProjectCurrencyTestData.PROJECT_ID.length).fill(AuthorizationManager.Privileges.ADMINISTRATE)
				    }
				}
			},
			csvPackage : testData.sCsvPackage
		});

		if (!oMockstar.disableMockstar) {
			originalProcedures = PersistencyItemImport.Procedures;
			PersistencyItemImport.Procedures = Object.freeze({
				create_item : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_item_create',
				delete_item : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_item_delete_item_with_children',
				delete_items : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_item_delete_items_marked_for_deletion',
				get_items : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_item_get_items',
				value_determination : procedurePrefix + ".sap.plc.db.calculationmanager.procedures::p_item_automatic_value_determination",
				calculation_configuration_masterdata_read : procedurePrefix + '.sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read',
				set_is_active_to_parents : procedurePrefix + ".sap.plc.db.calculationmanager.procedures::p_item_set_is_activate_to_parents",
				set_is_active_to_children : procedurePrefix + ".sap.plc.db.calculationmanager.procedures::p_item_set_is_active_to_children"
			});

			mdOriginalProcedures = AdministrationImport.Procedures;

			AdministrationImport.Procedures = Object.freeze({
				calculation_configuration_masterdata_read : procedurePrefix + '.sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read'
			});
		}
	});

	beforeEach(function() {
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
		
		spyOn($.trace, "error").and.returnValue(null);
		spyOn(helpers, "logError").and.callFake(function (msg) { $.trace.error(msg); });
	});

	afterOnce(function() {
		if (!oMockstar.disableMockstar) {
			PersistencyItemImport.Procedures = originalProcedures;
			AdministrationImport.Procedures = mdOriginalProcedures;
			oMockstar.cleanup();
		}
	});

	function getItem(aItems, iItemId) {
		return _.find(aItems, function(oItemCandidate) {
			return oItemCandidate.ITEM_ID === iItemId;
		});
	}

	function getItemByHandleId(aItems, iHandleId) {
		return _.find(aItems, function(oItemCandidate) {
			return oItemCandidate.HANDLE_ID === iHandleId;
		});
	}

	function getResponse(oResponseMock){
		var sJsonBody = oResponseMock.setBody.calls.mostRecent().args[0];
		var oResponseBody = JSON.parse(sJsonBody);
		return oResponseBody;
	}

	function getItemsFromResponse(oResponseMock) {
		return getResponse(oResponseMock).body.transactionaldata;
	}

	function getMasterdataFromResponse(oResponseMock) {
		return getResponse(oResponseMock).body.masterdata;
	}

	function checkCalculationVersionSetDirty(bShouldBeDirty, oResponseMock, iCalculationVersionId) {
		var iExpectedDirtyValue = bShouldBeDirty === true ? 1 : 0;

		var after = oMockstar.execQuery(`select IS_DIRTY from {{itemTemporary}} where PARENT_ITEM_ID is null and CALCULATION_VERSION_ID = ${iCalculationVersionId} and SESSION_ID = '${sSessionId}'`);
		expect(after.columns.IS_DIRTY.rows[0]).toBe(iExpectedDirtyValue);
	}
	
	function enterPrivilege(sProjectId, sUserId, sPrivilege){
        oMockstar.insertTableData("authorization",{
           PROJECT_ID   : [sProjectId],
           USER_ID      : [sUserId],
           PRIVILEGE    : [sPrivilege]
        });
    }

    function removeTrailingZeros(value){
        var result;
        if(Number(value)){
            result = Number(value).toString();
        } else if(value !== null){
            result = value.toString();
        }else{
            result = null;
        }
        return result;
    }

    const checkIsManualFlags = function (iItemId, oExpectedValues, bUseItemExtTable) {
        bUseItemExtTable = bUseItemExtTable || false;
        const oDbItem = oMockstar.execQuery(`select * from ${bUseItemExtTable ? "{{itemTemporaryExt}}" : "{{itemTemporary}}"} where calculation_version_id = ${iCvId} and session_id = '${sSessionId}' and item_id = ${iItemId}`);
        _.each(oExpectedValues, (iExpectedValue, sFieldName) => {
            jasmine.log(`Checking ${sFieldName} for item id ${iItemId}`);
            expect(oDbItem.columns[sFieldName].rows[0]).toEqual(iExpectedValue)
        });
    };

    const oMetadataIsManualData = {
        PATH:               ["Item", "Item", "Item", "Item", "Item"],
        BUSINESS_OBJECT:    ["Item", "Item", "Item", "Item", "Item"],
        COLUMN_ID:          ["CUST_INT_FORMULA", "CUST_INT_WITHOUT_REF", "CUST_STRING_FORMULA", "CUST_STRING", "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY"],
        IS_CUSTOM:          [1, 1, 1, 1, 1],
        ROLLUP_TYPE_ID:     [1, 1, 0, 0, 1],
        SEMANTIC_DATA_TYPE: ["Integer", "Integer", "String", "String" ,"String"],
    };
    const oMetadataItemAttributesIsManualData = {
        PATH:             ["Item", "Item", "Item", "Item", "Item"],
        BUSINESS_OBJECT:  ["Item", "Item", "Item", "Item", "Item"],
        COLUMN_ID:        ["CUST_INT_FORMULA", "CUST_INT_WITHOUT_REF", "CUST_STRING_FORMULA", "CUST_STRING", "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY"],
        ITEM_CATEGORY_ID: [1, 1, 1, 1, 1],
        SUBITEM_STATE:     [-1, -1, -1, -1, -1],
    };
    const oFormulaIsManualData = {
        FORMULA_ID:       [1, 2, 3, 4 ],
        PATH:             ["Item", "Item", "Item", "Item"],
        BUSINESS_OBJECT:  ["Item", "Item", "Item", "Item"],
        COLUMN_ID:        ["PRICE_UNIT", "LOT_SIZE", "CUST_INT_FORMULA", "CUST_STRING_FORMULA"],
        ITEM_CATEGORY_ID: [1, 1, 1, 1],
        IS_FORMULA_USED:  [1, 1, 1, 1],
        FORMULA_STRING:   ["1+1", "1+1", "1+1", "1+1"],
    };
    
    const aUsedIsManualFields = _.union(oMetadataIsManualData.COLUMN_ID, oFormulaIsManualData.COLUMN_ID).map(sFieldName => sFieldName + "_IS_MANUAL");


	describe("update item", function() {

		var params = [ {
			name : "calculate",
			value : "false"
		},{
			name : "omitItems",
			value : "false"
		} ];
		params.get = function(sParameterName) {
			if (helpers.isNullOrUndefined(sParameterName)) {
				return null;
			} else {
				if (sParameterName === "calculate") {
					return "false";
				}
				if (sParameterName === "omitItems") {
					return "false";
				}
			}
		};

		beforeEach(function() {
		    oResponseStub = new ResponseObjectStub();
			oMockstar.clearAllTables(); // clear all specified substitute tables and views
			oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData);
			oMockstar.insertTableData("item", testData.oItemTestData);
			
			oMockstar.insertTableData("calculationVersionTemporary", testData.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc);
			oMockstar.insertTableData("priceComponents", testData.oPriceComponentDataPlc);
			oMockstar.insertTableData("activityPrice", testData.oActivityPriceTestDataPlc);
			oMockstar.insertTableData("materialPricePlc", testData.oMaterialPriceTestDataPlc);
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("calculationVersion", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("document_type", testData.oDocumentTypeTestDataPlc);
			oMockstar.insertTableData("document_type_text", testData.oDocumentTypeTextTestDataPlc);
			oMockstar.insertTableData("openCalculationVersion", testData.oOpenCalculationVersionsTestData);
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.initializeData();
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				oMockstar.insertTableData("itemTemporaryExt", oItemTemporaryExtTestData);
			}

			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
		});

		function prepareRequest(aItems) {

			var oRequest = {
					queryPath : "items",
					method : $.net.http.PUT,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify(aItems);
						}
					}
			};

			return oRequest;
		}

		if(jasmine.plcTestRunParameters.generatedFields === true){
			
			it("should update item with custom data and return a new calculation when the input is valid", function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
				var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				var oldItems = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + oItemTemporaryTestData.ITEM_ID[1] + " or item_id="
						+ oItemTemporaryTestData.ITEM_ID[2]);

				var oModifiedTestItem1 = {
						ITEM_ID : testData.oItemTestData.ITEM_ID[0],
						CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
						CUST_BOOLEAN_INT_MANUAL : 1
				};

				var oModifiedTestItem2 = {
						ITEM_ID : testData.oItemTestData.ITEM_ID[1],
						CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					    CUST_BOOLEAN_INT_MANUAL : 1
				};

				// act
				new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2 ]), oDefaultResponseMock).dispatch();

				// assert
				// HTTP body and status have been set
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				result = oMockstar.execQuery("select count(*) from {{itemTemporaryExt}}");
				expect(result).toBeDefined();
				var expectedResultJsonData = {
						'COUNT(*)' : [ iOriginalItemCount ]
				};
				expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

				var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id= ${oModifiedTestItem1.ITEM_ID} or item_id= ${oModifiedTestItem2.ITEM_ID} order by item_id`);

				var newItemsCust = oMockstar.execQuery(`select * from {{itemTemporaryExt}} where item_id= ${oModifiedTestItem1.ITEM_ID} or item_id= ${oModifiedTestItem2.ITEM_ID} order by item_id`);

				expect(newItems.columns.IS_DELETED.rows[0]).toEqual(0);
				expect(newItems.columns.IS_DIRTY.rows[0]).toEqual(1);
				expect(newItems.columns.IS_DELETED.rows[1]).toEqual(0);
				expect(newItems.columns.IS_DIRTY.rows[1]).toEqual(1);

				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem1.CALCULATION_VERSION_ID);

				expect(newItemsCust).not.toMatchData(oldItems, [ "ITEM_ID" ]);
				expect(newItemsCust.columns.CUST_BOOLEAN_INT_MANUAL.rows[0]).toBe(oModifiedTestItem1.CUST_BOOLEAN_INT_MANUAL);
				expect(newItemsCust.columns.CUST_BOOLEAN_INT_MANUAL.rows[1]).toBe(oModifiedTestItem2.CUST_BOOLEAN_INT_MANUAL);

			});

			it("should not update item with custom data when the input is invalid", function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
				//TODO: the test seems to be not complete; the condition in the test description should be checked
				var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				var oldItems = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + oItemTemporaryTestData.ITEM_ID[1]);

				var oModifiedTestItem1 = {
						ITEM_ID : testData.oItemTestData.ITEM_ID[1],
						CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
						CUST_BOOLEAN_INT : 1 //invalid field name
				};

				// act
				new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1 ]), oDefaultResponseMock).dispatch();

				// assert
				// HTTP body and status have been set
				expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			});
			
			it("should update item with custom data for masterdata and return a new calculation when the input is valid", function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
				var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				var oldItems = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + oItemTemporaryTestData.ITEM_ID[1] + " or item_id="
						+ oItemTemporaryTestData.ITEM_ID[2]);

				var oModifiedTestItem1 = {
						ITEM_ID : testData.oItemTestData.ITEM_ID[2],
						CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
						CWCE_DECIMAL_MANUAL : '44.0000000'
				};

				// act
				new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1]), oDefaultResponseMock).dispatch();

				// assert
				// HTTP body and status have been set
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				result = oMockstar.execQuery("select count(*) from {{itemTemporaryExt}}");
				expect(result).toBeDefined();
				var expectedResultJsonData = {
						'COUNT(*)' : [ iOriginalItemCount ]
				};
				expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

				var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id= ${oModifiedTestItem1.ITEM_ID}`);

				var newItemsCust = oMockstar.execQuery(`select * from {{itemTemporaryExt}} where item_id= ${oModifiedTestItem1.ITEM_ID}`);

				expect(newItems.columns.IS_DELETED.rows[0]).toEqual(0);
				expect(newItems.columns.IS_DIRTY.rows[0]).toEqual(1);

				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem1.CALCULATION_VERSION_ID);

				expect(newItemsCust).not.toMatchData(oldItems, [ "ITEM_ID" ]);
				expect(newItemsCust.columns.CWCE_DECIMAL_MANUAL.rows[0]).toBe(oModifiedTestItem1.CWCE_DECIMAL_MANUAL);
			});
			
			it("should update item with custom data for masterdata [Activity Price] and return a new calculation when the input is valid", function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
				var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				var oldItems = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + oItemTemporaryTestData.ITEM_ID[1] + " or item_id="
						+ oItemTemporaryTestData.ITEM_ID[2]);

				var oModifiedTestItem1 = {
						ITEM_ID : testData.oItemTestData.ITEM_ID[2],
						CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
						CAPR_DECIMAL_MANUAL : '35.0000000'
				};

				// act
				new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1]), oDefaultResponseMock).dispatch();

				// assert
				// HTTP body and status have been set
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				result = oMockstar.execQuery("select count(*) from {{itemTemporaryExt}}");
				expect(result).toBeDefined();
				var expectedResultJsonData = {
						'COUNT(*)' : [ iOriginalItemCount ]
				};
				expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

				var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id= ${oModifiedTestItem1.ITEM_ID}`);

				var newItemsCust = oMockstar.execQuery(`select * from {{itemTemporaryExt}} where item_id= ${oModifiedTestItem1.ITEM_ID}`);

				expect(newItems.columns.IS_DELETED.rows[0]).toEqual(0);
				expect(newItems.columns.IS_DIRTY.rows[0]).toEqual(1);

				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem1.CALCULATION_VERSION_ID);

				expect(newItemsCust).not.toMatchData(oldItems, [ "ITEM_ID" ]);
				expect(newItemsCust.columns.CAPR_DECIMAL_MANUAL.rows[0]).toBe(oModifiedTestItem1.CAPR_DECIMAL_MANUAL);
			});

		}

		if(jasmine.plcTestRunParameters.generatedFields === true){
			it("should not be able to change the currency of the custom field for an assembly item with rollup", function() {
				// arange
				var oItemExt = {
					CALCULATION_VERSION_ID: [iCvId, iCvId],
					ITEM_ID: [3001, 3002],
					CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL: [null, 10],
					CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_CALCULATED: [10, null],
					CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL: [0, 1],
					CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT: ["EUR", "EUR"]
				};
				oMockstar.insertTableData("item_ext", oItemExt);
				oItemExt["SESSION_ID"] = ["TEST_USER_1", "TEST_USER_1"];
				oMockstar.insertTableData("itemTemporaryExt", oItemExt);
				var oModifiedTestItem = {
					ITEM_ID : oItemExt.ITEM_ID[0],
					CALCULATION_VERSION_ID : iCvId,
					CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT : "USD"
				};

				// act
				new Dispatcher(oCtx, prepareRequest([oModifiedTestItem]), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.transactionaldata[0].CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT).toBe("EUR");

				// Check the table too to see if the response is in sync
				var oTableResult = oMockstar.execQuery(`SELECT "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT" from {{itemTemporaryExt}} WHERE "ITEM_ID" = ${oItemExt.ITEM_ID[0]} AND "CALCULATION_VERSION_ID" = ${iCvId}`);
				var sCurrencyFromTable = oTableResult.columns.CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT.rows[0];
				expect(sCurrencyFromTable).toBe("EUR");
			});
		}

		it("should update calculated fields to null when when item category is changed to text item", function(){

			const aTextItemsInputDecimalList = ["LOT_SIZE", "BASE_QUANTITY", "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TARGET_COST"];
			const aCalculatedValues = ["OTHER_COST", "OTHER_COST_FIXED_PORTION", "OTHER_COST_VARIABLE_PORTION", "PRICE", "PRICE_FOR_TOTAL_QUANTITY", "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION", "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION",
							   "TOTAL_COST", "TOTAL_COST_FIXED_PORTION", "TOTAL_COST_PER_UNIT", "TOTAL_COST_PER_UNIT_FIXED_PORTION", "TOTAL_COST_PER_UNIT_VARIABLE_PORTION", "TOTAL_COST_VARIABLE_PORTION"];

			var oModifiedTestItem = {
				ITEM_ID : testData.oItemTestData.ITEM_ID[1],
				CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
				ITEM_CATEGORY_ID: 9,
				CHILD_ITEM_CATEGORY_ID: 9
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var updatedItem = oMockstar.execQuery(`select ${aTextItemsInputDecimalList.join() + ", " + aTextItemsInputDecimalList.map(column => column + "_IS_MANUAL").join() + "," + aCalculatedValues.join()}  
												   from {{itemTemporary}} where item_id = ${oModifiedTestItem.ITEM_ID}`);

			aTextItemsInputDecimalList.forEach(column => {
				expect(updatedItem.columns[column].rows[0]).toEqual(null);
				expect(updatedItem.columns[column + "_IS_MANUAL"].rows[0]).toEqual(0);
			});

			aCalculatedValues.forEach(column => {
				expect(updatedItem.columns[column].rows[0]).toEqual(null);
			});
		});
		
		it("should update QUANTITY_UOM_ID and PRICE_UNIT_UOM_ID with BASE_UOM_ID of the material when MATERIAL_ID is updated", function() {

			var oModifiedTestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					MATERIAL_ID: 'MAT1'
			}; 

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var updatedItem = oMockstar.execQuery(`select material_id,quantity_uom_id,price_unit_uom_id from {{itemTemporary}} where item_id = ${oModifiedTestItem.ITEM_ID}`);
            
			expect(updatedItem.columns.MATERIAL_ID.rows[0]).toEqual("MAT1");
			expect(updatedItem.columns.QUANTITY_UOM_ID.rows[0]).toEqual("ML");
			expect(updatedItem.columns.PRICE_UNIT_UOM_ID.rows[0]).toEqual("ML");

		});

		it("should update QUANTITY_UOM_ID and PRICE_UNIT_UOM_ID with H for internal activity", function() {

			var oModifiedTestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					ITEM_CATEGORY_ID : 3,
					CHILD_ITEM_CATEGORY_ID: 3,
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1]
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var updatedItem = oMockstar.execQuery(`select material_id,quantity_uom_id,price_unit_uom_id from {{itemTemporary}} where item_id = ${oModifiedTestItem.ITEM_ID}`);

			expect(updatedItem.columns.QUANTITY_UOM_ID.rows[0]).toEqual("H");
			expect(updatedItem.columns.PRICE_UNIT_UOM_ID.rows[0]).toEqual("H");

		});

		it("should update QUANTITY_UOM_ID with the value in the request when MATERIAL_ID is updated", function() {

			var oModifiedTestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					MATERIAL_ID: 'MAT1',
					QUANTITY_UOM_ID: 'H'
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var updatedItem = oMockstar.execQuery(`select material_id,quantity_uom_id,price_unit_uom_id from {{itemTemporary}} where item_id = ${oModifiedTestItem.ITEM_ID}`);

			expect(updatedItem.columns.MATERIAL_ID.rows[0]).toEqual("MAT1");
			expect(updatedItem.columns.QUANTITY_UOM_ID.rows[0]).toEqual("H");
			expect(updatedItem.columns.PRICE_UNIT_UOM_ID.rows[0]).toEqual("H");

		});

		it("should update QUANTITY_UOM_ID and PRICE_UNIT_UOM_ID with the default value if material has no BASE_UOM_ID when MATERIAL_ID is updated", function() {

			var oModifiedTestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					MATERIAL_ID: 'MAT4'
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var updatedItem = oMockstar.execQuery(`select material_id,quantity_uom_id,price_unit_uom_id from {{itemTemporary}} where item_id = ${oModifiedTestItem.ITEM_ID}`);

			expect(updatedItem.columns.MATERIAL_ID.rows[0]).toEqual("MAT4");
			expect(updatedItem.columns.QUANTITY_UOM_ID.rows[0]).toEqual("PC");
			expect(updatedItem.columns.PRICE_UNIT_UOM_ID.rows[0]).toEqual("PC");

		});
		
		it("should update multiple items with different properties and return a new calculation when the input is valid", function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
			var oldItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id in
				(${oItemTemporaryTestData.ITEM_ID[0]}, ${oItemTemporaryTestData.ITEM_ID[1]}, ${oItemTemporaryTestData.ITEM_ID[2]})`);

			// Three items shall be modified with the update and each item contains different properties to be changed
			// Different logic (e.g., price determination) must be executed for each item.
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					ITEM_DESCRIPTION : 'MODIFIED TEST ITEM',
					DOCUMENT_TYPE_ID : null,
					MATERIAL_ID: 'MAT1',
					PLANT_ID: 'PL1'
			}; // leaf item where price determination should find and set a new price

			var oModifiedTestItem2 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : 5,
					CHILD_ITEM_CATEGORY_ID: 5
			}; // leaf item where item category is changed

			var oModifiedTestItem3 = {
				ITEM_ID : testData.oItemTestData.ITEM_ID[0],
				CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
				COMMENT : "Test"
			}; // root item where only comment is changed

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2, oModifiedTestItem3 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id in
				(${oModifiedTestItem1.ITEM_ID}, ${oModifiedTestItem2.ITEM_ID}, ${oModifiedTestItem3.ITEM_ID}) order by item_id`);

			// STATUS and QUANTITY must be different after the update
			expect(newItems).not.toMatchData(oldItems, [ "ITEM_ID" ]);
			expect(newItems.columns.ITEM_DESCRIPTION.rows[1]).toBe(null);
			expect(newItems.columns.ITEM_CATEGORY_ID.rows[2]).toBe(oModifiedTestItem2.ITEM_CATEGORY_ID);
			expect(newItems.columns.COMMENT.rows[0]).toBe(oModifiedTestItem3.COMMENT);

            // should return null for DOCUMENT_TYPE_ID as 'XXX' does not exist in masterdata
            expect(newItems.columns.DOCUMENT_TYPE_ID.rows[1]).toBe(null);
            
			expect(newItems.columns.IS_DELETED.rows[0]).toEqual(0);
			expect(newItems.columns.IS_DIRTY.rows[0]).toEqual(1);

			expect(newItems.columns.IS_DELETED.rows[1]).toEqual(0);
			expect(newItems.columns.IS_DIRTY.rows[1]).toEqual(1);

			expect(newItems.columns.IS_DELETED.rows[2]).toEqual(0);
			expect(newItems.columns.IS_DIRTY.rows[2]).toEqual(1);

			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem1.CALCULATION_VERSION_ID);
		});

		it("should update IS_DISABLING_ACCOUNT_DETERMINATION to 1 when account is changed", function() {

			// arrange
			var oAccounts = new TestDataUtility(testData.oAccountForItemTestData).extend({
				ACCOUNT_ID : "#AC22",
				CONTROLLING_AREA_ID : "1000",
				_VALID_FROM: "2000-01-01T00:00:00.000Z"
			}).build();
			oMockstar.insertTableData("account", oAccounts);

			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
			var oldItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id = ${oItemTemporaryTestData.ITEM_ID[1]}`);

			// One item has the account changed and the field IS_DISABLING_ACCOUNT_DETERMINATION should be set to true automatically
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					ACCOUNT_ID: "#AC22"
			}; // leaf item where Account is changed

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id = ${oModifiedTestItem1.ITEM_ID}`);

			// IS_DISABLING_ACCOUNT_DETERMINATION
			expect(newItems).not.toMatchData(oldItems, [ "ITEM_ID" ]);
			expect(newItems.columns.DETERMINED_ACCOUNT_ID.rows[0]).toBe(oldItems.columns.DETERMINED_ACCOUNT_ID.rows[0]);
			expect(newItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]).not.toBe(oldItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]);
			expect(newItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]).toBe(1);
		});

		it("should update IS_DISABLING_ACCOUNT_DETERMINATION to 0 when the field is unchecked", function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);

			 oMockstar.execSingle(`update {{itemTemporary}} SET IS_DISABLING_ACCOUNT_DETERMINATION = 1 where item_id = ${oItemTemporaryTestData.ITEM_ID[1]}`);
			var oldItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id = ${oItemTemporaryTestData.ITEM_ID[1]}`);

			// One item has the account changed and the field IS_DISABLING_ACCOUNT_DETERMINATION should be set to true automatically
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					IS_DISABLING_ACCOUNT_DETERMINATION: 0
			}; // leaf item where Account is changed

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id = ${oModifiedTestItem1.ITEM_ID}`);

			// IS_DISABLING_ACCOUNT_DETERMINATION
			expect(newItems).not.toMatchData(oldItems, [ "ITEM_ID" ]);
			expect(newItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]).not.toBe(oldItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]);
			expect(newItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]).toBe(0);
		});

		it("should update IS_DISABLING_ACCOUNT_DETERMINATION to 1 when the field is checked", function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);

			var oldItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id = ${oItemTemporaryTestData.ITEM_ID[1]}`);

			// One item has the account changed and the field IS_DISABLING_ACCOUNT_DETERMINATION should be set to true automatically
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					IS_DISABLING_ACCOUNT_DETERMINATION: 1
			}; // leaf item where Account is changed

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id = ${oModifiedTestItem1.ITEM_ID}`);

			// IS_DISABLING_ACCOUNT_DETERMINATION
			expect(newItems).not.toMatchData(oldItems, [ "ITEM_ID" ]);
			expect(newItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]).not.toBe(oldItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]);
			expect(newItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]).toBe(1);
		});

		it("should not calculate price when IS_DISABLING_PRICE_DETERMINATION =1 and material or activity type is changed", function() {

			// arrange
			oMockstar.clearTable("priceSource");
			oMockstar.clearTable("itemTemporary");
			oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc1);
			oMockstar.insertTableData("materialPricePlc", testData.oMaterialPriceDataPlc);
			oMockstar.insertTableData("activityPrice", testData.oActivityPriceDataPlc);
			oMockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
			var aTempItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0,1]);
			aTempItems[1].IS_DISABLING_PRICE_DETERMINATION = 1;
			var aActivityItem = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([2])
			var oActivityItem = _.extend(_.clone(aActivityItem[0]), {
				"PARENT_ITEM_ID" : 3001,
				"PREDECESSOR_ITEM_ID" : 3001
			});
			aTempItems.push(oActivityItem);
			aTempItems[2].IS_DISABLING_PRICE_DETERMINATION = 1;
			oMockstar.insertTableData("itemTemporary", aTempItems);
			var boboItems = oMockstar.execQuery(`select * from {{itemTemporary}} `);

			// price determination must not be executed for item.
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					ITEM_DESCRIPTION : 'MODIFIED TEST ITEM',
					MATERIAL_ID: 'P-TEST'
			}; // leaf item where price determination could find and set a new price but it will not set it because of field IS_DISABLING_PRICE_DETERMINATION
			var oModifiedTestItem2 = {
				ITEM_ID : testData.oItemTestData.ITEM_ID[2],
				CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
				ACTIVITY_TYPE_ID : 'A5',
				COST_CENTER_ID : 'CC2'
		}; // leaf item where price determination could find and set a new price but it will not set it because of field IS_DISABLING_PRICE_DETERMINATION

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id in
			(${oModifiedTestItem1.ITEM_ID}, ${oModifiedTestItem2.ITEM_ID}) order by item_id`);

			//Material item should not have the new price set
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[0]).toEqual(testData.oItemTestData.PRICE_VARIABLE_PORTION[1]);
			expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(testData.oItemTestData.PRICE_FIXED_PORTION[1]);
			//Activity item should not have the new price set
			expect(newItems.columns.PRICE_FIXED_PORTION.rows[1]).toEqual(testData.oItemTestData.PRICE_FIXED_PORTION[2]);
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[1]).toEqual(testData.oItemTestData.PRICE_VARIABLE_PORTION[2]);

		});

		it("should not calculate price when IS_DISABLING_PRICE_DETERMINATION is updated to 1", function() {

			// arrange
			oMockstar.clearTable("priceSource");
			oMockstar.clearTable("itemTemporary");
			oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc1);
			oMockstar.insertTableData("materialPricePlc", testData.oMaterialPriceDataPlc);
			oMockstar.insertTableData("activityPrice", testData.oActivityPriceDataPlc);
			oMockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
			var aTempItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0,1]);
			var aActivityItem = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([2])
			var oActivityItem = _.extend(_.clone(aActivityItem[0]), {
				"PARENT_ITEM_ID" : 3001,
				"PREDECESSOR_ITEM_ID" : 3001
			});
			aTempItems.push(oActivityItem);
			oMockstar.insertTableData("itemTemporary", aTempItems);

			// price determination must not be executed for item.
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					ITEM_DESCRIPTION : 'MODIFIED TEST ITEM',
					MATERIAL_ID: 'P-TEST',
					IS_DISABLING_PRICE_DETERMINATION: 1
			}; // leaf item where price determination could find and set a new price but it will not set it because of field IS_DISABLING_PRICE_DETERMINATION
			var oModifiedTestItem2 = {
				ITEM_ID : testData.oItemTestData.ITEM_ID[2],
				CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
				ACTIVITY_TYPE_ID : 'A5',
				COST_CENTER_ID : 'CC2',
				IS_DISABLING_PRICE_DETERMINATION: 1
		}; // leaf item where price determination could find and set a new price but it will not set it because of field IS_DISABLING_PRICE_DETERMINATION

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id in
			(${oModifiedTestItem1.ITEM_ID}, ${oModifiedTestItem2.ITEM_ID}) order by item_id`);

			//Material item should not have the new price set
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[0]).toEqual(testData.oItemTestData.PRICE_VARIABLE_PORTION[1]);
			expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(testData.oItemTestData.PRICE_FIXED_PORTION[1]);
			//Activity item should not have the new price set
			expect(newItems.columns.PRICE_FIXED_PORTION.rows[1]).toEqual(testData.oItemTestData.PRICE_FIXED_PORTION[2]);
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[1]).toEqual(testData.oItemTestData.PRICE_VARIABLE_PORTION[2]);
		});

		it("should calculate price for material and activity when IS_DISABLING_PRICE_DETERMINATION is set to 0", function() {

			// arrange
			oMockstar.clearTable("priceSource");
			oMockstar.clearTable("itemTemporary");
			oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc1);
			oMockstar.insertTableData("materialPricePlc", testData.oMaterialPriceDataPlc);
			oMockstar.insertTableData("activityPrice", testData.oActivityPriceDataPlc);
			oMockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
			var aTempItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0,1]);
			aTempItems[1].IS_DISABLING_PRICE_DETERMINATION = 1;
			aTempItems[1].MATERIAL_ID = 'P-TEST';
			var aActivityItem = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([2])
			var oActivityItem = _.extend(_.clone(aActivityItem[0]), {
				"PARENT_ITEM_ID" : 3001,
				"PREDECESSOR_ITEM_ID" : 3001
			});
			aTempItems.push(oActivityItem);
			aTempItems[2].IS_DISABLING_PRICE_DETERMINATION = 1;
			aTempItems[2].ACTIVITY_TYPE_ID = 'ACTIVITY5555';
			aTempItems[2].COST_CENTER_ID = 'CC2';
			oMockstar.insertTableData("itemTemporary", aTempItems);

			// price determination must be executed for item.
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					IS_DISABLING_PRICE_DETERMINATION : 0
			}; // leaf item where price determination should find and set a new price
			var oModifiedTestItem2 = {
				ITEM_ID : testData.oItemTestData.ITEM_ID[2],
				CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
				IS_DISABLING_PRICE_DETERMINATION : 0
		}; // leaf item where price determination should find and set a new price

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id in
			(${oModifiedTestItem1.ITEM_ID}, ${oModifiedTestItem2.ITEM_ID}) order by item_id`);

			//Material item should have the new price after IS_DISABLING_PRICE_DETERMINATION is set to 0
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[0]).toEqual(testData.oMaterialPriceDataPlc.PRICE_VARIABLE_PORTION[4]);
			expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(testData.oMaterialPriceDataPlc.PRICE_FIXED_PORTION[4]);
			//Activity item should have the new price set after IS_DISABLING_PRICE_DETERMINATION is set to 0
			expect(newItems.columns.PRICE_FIXED_PORTION.rows[1]).toEqual(testData.oActivityPriceDataPlc.PRICE_FIXED_PORTION[4]);
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[1]).toEqual(testData.oActivityPriceDataPlc.PRICE_VARIABLE_PORTION[4]);
		});

		it("should calculate price for material item when IS_DISABLING_PRICE_DETERMINATION is set to 0 but not for activity item", function() {

			// arrange
			oMockstar.clearTable("priceSource");
			oMockstar.clearTable("itemTemporary");
			oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc1);
			oMockstar.insertTableData("materialPricePlc", testData.oMaterialPriceDataPlc);
			oMockstar.insertTableData("activityPrice", testData.oActivityPriceDataPlc);
			oMockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
			var aTempItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0,1]);
			aTempItems[1].IS_DISABLING_PRICE_DETERMINATION = 1;
			aTempItems[1].MATERIAL_ID = 'P-TEST';
			var aActivityItem = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([2])
			var oActivityItem = _.extend(_.clone(aActivityItem[0]), {
				"PARENT_ITEM_ID" : 3001,
				"PREDECESSOR_ITEM_ID" : 3001
			});
			aTempItems.push(oActivityItem);
			aTempItems[2].IS_DISABLING_PRICE_DETERMINATION = "1";
			oMockstar.insertTableData("itemTemporary", aTempItems);

			// price determination must be executed for item.
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					IS_DISABLING_PRICE_DETERMINATION : 0
			}; // leaf item where price determination should find and set a new price
			var oModifiedTestItem2 = {
				ITEM_ID : testData.oItemTestData.ITEM_ID[2],
				CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
				ACTIVITY_TYPE_ID : 'A5',
				COST_CENTER_ID : 'CC2'
		}; // leaf item where price determination could find and set a new price but it will not because IS_DISABLING_PRICE_DETERMINATION = 1

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id in
			(${oModifiedTestItem1.ITEM_ID}, ${oModifiedTestItem2.ITEM_ID}) order by item_id`);

			//Material item should have the new price after IS_DISABLING_PRICE_DETERMINATION is set to 0
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[0]).toEqual(testData.oMaterialPriceDataPlc.PRICE_VARIABLE_PORTION[4]);
			expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(testData.oMaterialPriceDataPlc.PRICE_FIXED_PORTION[4]);
			//Activity item should not have the new price set because IS_DISABLING_PRICE_DETERMINATION = 1
			expect(newItems.columns.PRICE_FIXED_PORTION.rows[1]).toEqual(testData.oItemTestData.PRICE_FIXED_PORTION[2]);
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[1]).toEqual(testData.oItemTestData.PRICE_VARIABLE_PORTION[2]);
		});

		it("should set IS_PRICE_SPLIT_ACTIVE to 0 because the material item and activity item does not have a valid price component for the controlling area", function() {

			// arrange
			oMockstar.clearTable("priceSource");
			oMockstar.clearTable("itemTemporary");
			oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc1);
			oMockstar.insertTableData("materialPricePlc", testData.oMaterialPriceDataPlc);
			oMockstar.insertTableData("activityPrice", testData.oActivityPriceDataPlc);
			oMockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);	
			var aTempItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0,1]);
			var aActivityItem = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([2])
			var oActivityItem = _.extend(_.clone(aActivityItem[0]), {
				"PARENT_ITEM_ID" : 3001,
				"PREDECESSOR_ITEM_ID" : 3001
			});
			aTempItems.push(oActivityItem);
			oMockstar.insertTableData("itemTemporary", aTempItems);

			// price determination must be executed for item.
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					ITEM_DESCRIPTION : 'MODIFIED TEST ITEM',
					MATERIAL_ID: 'P-TEST'
			}; // leaf item where price determination should find and set a new price
			var oModifiedTestItem2 = {
				ITEM_ID : testData.oItemTestData.ITEM_ID[2],
				CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
				ACTIVITY_TYPE_ID : 'ACTIVITY5555',
				COST_CENTER_ID : 'CC2'
		}; // leaf item where price determination should find and set a new price

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id in
			(${oModifiedTestItem1.ITEM_ID}, ${oModifiedTestItem2.ITEM_ID}) order by item_id`);

			// IS_PRICE_SPLIT_ACTIVE must be 0 because no valid price component exist for the controlling area
			//Material item
			expect(newItems.columns.IS_PRICE_SPLIT_ACTIVE.rows[0]).toEqual(0);
			expect(newItems.columns.PRICE_SOURCE_ID.rows[0]).toEqual(testData.oMaterialPriceDataPlc.PRICE_SOURCE_ID[4]);
			//Activity item
			expect(newItems.columns.IS_PRICE_SPLIT_ACTIVE.rows[1]).toEqual(0);
			expect(newItems.columns.PRICE_SOURCE_ID.rows[1]).toEqual(testData.oActivityPriceDataPlc.PRICE_SOURCE_ID[4]);
		});

		it("should return item when same IS_ACTIVE is sent on update request", function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
			var oldItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[0]);

			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					IS_ACTIVE : testData.oItemTestData.IS_ACTIVE[1]
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id= ${oModifiedTestItem1.ITEM_ID} order by item_id`);

			// IS_ACTIVE should not change after the update
			expect(newItems.columns.IS_ACTIVE.rows[0]).toBe(oModifiedTestItem1.IS_ACTIVE);

			expect(newItems.columns.IS_DELETED.rows[0]).toEqual(0);
		});

		it("should update IS_PRICE_SPLIT_ACTIVE when it is set to true on update request", function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
			var oldItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[0]);

			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					IS_PRICE_SPLIT_ACTIVE : 1
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);
			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id= ${oModifiedTestItem1.ITEM_ID} order by item_id`);

			// IS_ACTIVE should not change after the update
			expect(newItems.columns.IS_PRICE_SPLIT_ACTIVE.rows[0]).toBe(oModifiedTestItem1.IS_PRICE_SPLIT_ACTIVE);

			expect(newItems.columns.IS_DELETED.rows[0]).toEqual(0);
		});
		
		it("should set the id's of the changed items in the global table used in AFL", function() {
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					ITEM_DESCRIPTION : 'MODIFIED TEST ITEM'
			};

			var oModifiedTestItem2 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : 5,
					CHILD_ITEM_CATEGORY_ID: 5
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2 ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items", "ITEM_ID= " + testData.oItemTestData.ITEM_ID[1])).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items", "ITEM_ID= " + testData.oItemTestData.ITEM_ID[2])).toBe(1);			
		});
		
		it("should activeate all parent items if the leaf item 3003 is activated if the entire hierarchy was inactive before", function(){
			// arrange
			// construct inactive items; item structure: 3001 <- 3002 <- 3003
			oMockstar.clearTable("itemTemporary");
			var aIsActiveValues = _.map(oItemTemporaryTestData.ITEM_ID, function(){
				return 0;
			});
			var oInactivateItems = new TestDataUtility(oItemTemporaryTestData).extend({
				IS_ACTIVE : aIsActiveValues
			}).build();
			oMockstar.insertTableData("itemTemporary", oInactivateItems);
			
			// create JS object to activate item 3003 for the request
			var oActivateItemPayload = {
					ITEM_ID : oInactivateItems.ITEM_ID[2], // 3003
					CALCULATION_VERSION_ID : oInactivateItems.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : oInactivateItems.ITEM_CATEGORY_ID[2],
					IS_ACTIVE : 1
			};
			
			// act
			new Dispatcher(oCtx, prepareRequest([oActivateItemPayload]), oDefaultResponseMock).dispatch();
			
			// assert; check the t_item_temporary if item 3001 and 3002 are activated
			var oDbResult = oMockstar.execQuery("select * from {{itemTemporary}} order by item_id");
			_.each(oDbResult.columns.ITEM_ID.rows, function(iItemId, iIndex){
				var iIsActive = oDbResult.columns.IS_ACTIVE.rows[iIndex];
				jasmine.log(`checking if item ${iItemId} is activated. IS_ACTIVE should be 1 and is ${iIsActive}`);
				expect(iIsActive).toEqual(1);
			});
		});

		it("should add the activated item to the global table send to AFL", function(){
			// arrange
			// construct inactive items; item structure: 3001 <- 3002 <- 3003
			oMockstar.clearTable("itemTemporary");
			var aIsActiveValues = _.map(oItemTemporaryTestData.ITEM_ID, function(){
				return 0;
			});
			var oInactivateItems = new TestDataUtility(oItemTemporaryTestData).extend({
				IS_ACTIVE : aIsActiveValues
			}).build();
			oMockstar.insertTableData("itemTemporary", oInactivateItems);
			
			// create JS object to activate item 3003 for the request
			var oActivateItemPayload = {
					ITEM_ID : oInactivateItems.ITEM_ID[2], // 3003
					CALCULATION_VERSION_ID : oInactivateItems.CALCULATION_VERSION_ID[2],
					IS_ACTIVE : 1
			};
			
			// act
			new Dispatcher(oCtx, prepareRequest([oActivateItemPayload]), oDefaultResponseMock).dispatch();
			
			// assert; 
			
			//check the item ids that are send to AFL
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items", "ITEM_ID= '" + oInactivateItems.ITEM_ID[2] + "'")).toBe(1);
			
		});

		it('should update item if item category is changed to text and item has children', function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
			var oldItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[0] + " or item_id="
					+ oItemTemporaryTestData.ITEM_ID[1]);
			var oRequestItem = {
					ITEM_ID : oItemTemporaryTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
					ITEM_CATEGORY_ID : 9,
					CHILD_ITEM_CATEGORY_ID: 9
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[0] + " or item_id="
					+ oItemTemporaryTestData.ITEM_ID[1] + " order by item_id");

			// item category has changed
			expect(newItems.columns.ITEM_CATEGORY_ID.rows[1]).toBe(9);
		});

		it('should not update (esp. not set to null) item properties which are marked as read-only in metadata', function() {

			// arrange
			var iItemCategoryId = testData.oItemTestData.ITEM_CATEGORY_ID[2];
			var oInactiveItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					IS_ACTIVE : 0,
					PARENT_ITEM_ID : testData.oItemTestData.PARENT_ITEM_ID[2],
					PREDECESSOR_ITEM_ID : testData.oItemTestData.PREDECESSOR_ITEM_ID[2]
			};

			var oOriginalItem = oPersistency.Item.getItem(oInactiveItem.ITEM_ID, oInactiveItem.CALCULATION_VERSION_ID, sSessionId);

			var oMetadataQueryResult = oMockstar.execQuery(`select column_id from {{metadata_item_attributes}} where path = '${constants.BusinessObjectTypes.Item}' and business_object = '${constants.BusinessObjectTypes.Item}' and item_category_id = ${iItemCategoryId} and subitem_state = 0 and is_read_only = 1`);
			var aReadOnlyProperties = oMetadataQueryResult.columns.COLUMN_ID.rows;

			// HACK FOR 1.0.1. since PRICE_UNIT_UOM_ID is read-only but needs to be updated from the XS service; can be removed if we have finally a viable concept
			// to update items...
			aReadOnlyProperties = _.reject(aReadOnlyProperties, function(sPropName){
				return sPropName === "PRICE_UNIT_UOM_ID";
			});

			// act
			new Dispatcher(oCtx, prepareRequest([ oInactiveItem ]), oDefaultResponseMock).dispatch();

			// assert
			var oItemAfterUpdate = oPersistency.Item.getItem(oInactiveItem.ITEM_ID, oInactiveItem.CALCULATION_VERSION_ID, sSessionId);
			_.each(aReadOnlyProperties, function(sReadOnlyProperty) {
				jasmine.log(`testing if read-only property ${sReadOnlyProperty} was not modified after update`);
				expect(oItemAfterUpdate[sReadOnlyProperty]).toEqual(oOriginalItem[sReadOnlyProperty]);
			});

			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oInactiveItem.CALCULATION_VERSION_ID);
		});

		it('should update all properties of item of category 0 (active, with children) which are not marked as read-only in metadata', function() {
			// arrange
			var oRequestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[0],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[0],
                TOTAL_QUANTITY : (parseFloat(testData.oItemTemporaryTestData.TOTAL_QUANTITY[0]) + 1).toFixed(7),
					TOTAL_QUANTITY_UOM_ID : "PC"
			};

			if(jasmine.plcTestRunParameters.generatedFields === true){
			    oRequestItem.CUST_BOOLEAN_INT_MANUAL = 0;
			}

			var iIsActive = 1;
			var oMetadataQueryResult = oMockstar.execQuery(`select column_id from {{metadata_item_attributes}} 
			where path = '${constants.BusinessObjectTypes.Item}' 
			and business_object = '${constants.BusinessObjectTypes.Item}' 
			and item_category_id = ${constants.ItemCategory.CalculationVersion} 
			and (subitem_state = 1 or subitem_state = -1) 
			and (is_read_only = 0 or is_read_only is null)`);
			var aModifiableProperties = oMetadataQueryResult.columns.COLUMN_ID.rows;

			// act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

			// assert
			var oItemAfterUpdate = oPersistency.Item.getItem(oRequestItem.ITEM_ID, oRequestItem.CALCULATION_VERSION_ID, sSessionId);
			checkIfPropertiesAreModifiedOrReset(oRequestItem, oItemAfterUpdate, aModifiableProperties);
			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oRequestItem.CALCULATION_VERSION_ID);
		});

		it('should update all properties of item of category 5 which are not marked as read-only in metadata', function() {
			// arrange
			var oRequestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : 5,
					CHILD_ITEM_CATEGORY_ID: 5
			};

			var oMetadataQueryResult = oMockstar.execQuery(`select column_id from {{metadata_item_attributes}} where path = '${constants.BusinessObjectTypes.Item}' and business_object = '${constants.BusinessObjectTypes.Item}' 
			and item_category_id = ${5} and (subitem_state = 0 or subitem_state = -1) and (is_read_only = 0 or is_read_only is null)`);
			var aModifiableProperties = oMetadataQueryResult.columns.COLUMN_ID.rows;
			
			var oItemBeforeUpdate = oPersistency.Item.getItem(oRequestItem.ITEM_ID, oRequestItem.CALCULATION_VERSION_ID, sSessionId);
			
			// act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

			// assert
			var oItemAfterUpdate = oPersistency.Item.getItem(oRequestItem.ITEM_ID, oRequestItem.CALCULATION_VERSION_ID, sSessionId);
			aModifiableProperties = _.difference(aModifiableProperties, [ "CONFIDENCE_LEVEL_ID" ]);
			checkIfPropertiesAreModifiedOrReset(oRequestItem, oItemAfterUpdate, aModifiableProperties);
			expect(oItemAfterUpdate.CONFIDENCE_LEVEL_ID).toBe(oItemBeforeUpdate.CONFIDENCE_LEVEL_ID);
			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oRequestItem.CALCULATION_VERSION_ID);
		});

		it("should remove all values for invalid properties when changing the item category from 1 (Document) to 3 (InternalActivity)", function() {
			// arrange
			var aInvalidPropertiesForInternalActivity = ["IS_RELEVANT_TO_COSTING_IN_ERP","MATERIAL_ID", "VENDOR_ID"];
			var oDbMaterialItem = mockstar_helpers.convertToObject(oItemTemporaryTestData, 1);

			if(jasmine.plcTestRunParameters.generatedFields === true){
			   var aInvalidCustPropertiesForInternalActivity = ["CUST_BOOLEAN_INT_MANUAL",
			                                                    "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL","CUST_DECIMAL_WITHOUT_REF_MANUAL",
			                                                    "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT"];
                aInvalidPropertiesForInternalActivity = aInvalidPropertiesForInternalActivity.concat(aInvalidCustPropertiesForInternalActivity);
    			oDbMaterialItem = _.extend(oDbMaterialItem,mockstar_helpers.convertToObject(oItemTemporaryExtTestData, 1));
			}

			// check test precondition: for item of category Document, every property in aInvalidPropertiesForInternalActivity is not null
			_.each(aInvalidPropertiesForInternalActivity, function(sProperty){
				jasmine.log(`Checking if property ${sProperty} is not null or undefined for item of category material`);
				var value = oDbMaterialItem[sProperty];
				expect(value !== undefined && value !== null).toBe(true);
			});

			var iInternalActivityId = 3;
			var oRequestItem = {
					ITEM_ID : oDbMaterialItem.ITEM_ID,
					CALCULATION_VERSION_ID : oDbMaterialItem.CALCULATION_VERSION_ID,
					ITEM_CATEGORY_ID : iInternalActivityId,
					CHILD_ITEM_CATEGORY_ID: iInternalActivityId
			};

			// act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

			// assert
			var oItemDbState = mockstar_helpers.convertResultToArray(oMockstar.execQuery(`select * from {{itemTemporary}} where item_id = ${oDbMaterialItem.ITEM_ID} and calculation_version_id = ${oDbMaterialItem.CALCULATION_VERSION_ID}`));
			var oItemDb = mockstar_helpers.convertToObject(oItemDbState, 0);

			if(jasmine.plcTestRunParameters.generatedFields === true){
			    var oItemDbStateExt = mockstar_helpers.convertResultToArray(oMockstar.execQuery(`select * from {{itemTemporaryExt}} where item_id = ${oDbMaterialItem.ITEM_ID} and calculation_version_id = ${oDbMaterialItem.CALCULATION_VERSION_ID}`));
    			oItemDb =  _.extend(oItemDb,mockstar_helpers.convertToObject(oItemDbStateExt, 0));
			}

			jasmine.log("Checking if category id is 3");
			expect(oItemDb.ITEM_CATEGORY_ID).toEqual(3);

			_.each(aInvalidPropertiesForInternalActivity, function(sInvalidProperty){
				jasmine.log(`Checking if property ${sInvalidProperty} is null after switching the category id`);
				expect(oItemDb[sInvalidProperty]).toBe(null);
			});
		});

		function checkIfPropertiesAreModifiedOrReset(oRequestItem, oDbItem, aModifiableProperties) {
			_.each(aModifiableProperties,
					function(sModifiableProperty) {
				if (_.has(oRequestItem, sModifiableProperty)) {
					jasmine.log(`"testing if modifiable property ${sModifiableProperty} was updated to ${oRequestItem[sModifiableProperty]}`);
					var dbValueToCompare = oDbItem[sModifiableProperty] !== null ? oDbItem[sModifiableProperty].toString() : null;
					var requestValueValueToCompare = oRequestItem[sModifiableProperty] !== null ? oRequestItem[sModifiableProperty].toString() : null;

					expect(dbValueToCompare).toEqual(requestValueValueToCompare);
				}
			});
		}
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			
			it("should set all default values for new valid custom properties (*_MANUAL & *_UNIT) when changing the item category from 3 (InternalActivity) to 1 (Document)", function() {
				// arrange
				let oDbMaterialItem = mockstar_helpers.convertToObject(oItemTemporaryTestData, 2);
    			oDbMaterialItem = _.extend(oDbMaterialItem,mockstar_helpers.convertToObject(oItemTemporaryExtTestData, 2));
			
				const iDocumentItemCategory = 1;
				const oRequestItem = {
						ITEM_ID : oDbMaterialItem.ITEM_ID,
						CALCULATION_VERSION_ID : oDbMaterialItem.CALCULATION_VERSION_ID,
						ITEM_CATEGORY_ID : iDocumentItemCategory,
						CHILD_ITEM_CATEGORY_ID : iDocumentItemCategory
				};

				// act
				new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

				// assert
				const oItemDbStateExt = mockstar_helpers.convertResultToArray(oMockstar.execQuery(`select * from {{itemTemporaryExt}} where item_id = ${oDbMaterialItem.ITEM_ID} and calculation_version_id = ${oDbMaterialItem.CALCULATION_VERSION_ID}`));
				const oItemDbExt =  mockstar_helpers.convertToObject(oItemDbStateExt, 0);
	
				//get all custom fields that are valid for category 1 and were not valid for category 3 with their default values
				const oMetadataQueryResult = oMockstar.execQuery(
    				`select 
						case when uom_currency_flag != 1 then column_id||'_MANUAL'
	            		else column_id
	            		end as complete_column_name,	            		
	            		case when property_type = 7 and column_id like 'CUST__%' escape '_' then '${testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0]}'
	            		else default_value
	            		end as complete_default_value	
	            	from
        				(select distinct 
                		item.column_id, item.default_value, header.uom_currency_flag, header.property_type
                		from {{metadata_item_attributes}} as item
                		inner join {{metadata}} as header
                		on item.path = header.path
                		and item.business_object = header.business_object
                		and item.column_id = header.column_id
                		where item.path = '${constants.BusinessObjectTypes.Item}' and item.business_object = '${constants.BusinessObjectTypes.Item}'
                		and header.is_custom = 1
                		and item_category_id = ${constants.ItemCategory.Document} 
                		    minus 
                		select distinct 
                		item.column_id, item.default_value, header.uom_currency_flag, header.property_type
                		from {{metadata_item_attributes}} as item
                		inner join {{metadata}} as header
                		on item.path = header.path
                		and item.business_object = header.business_object
                		and item.column_id = header.column_id
                		where item.path = '${constants.BusinessObjectTypes.Item}' and item.business_object = '${constants.BusinessObjectTypes.Item}'
                		and header.is_custom = 1
                		and item_category_id = ${constants.ItemCategory.InternalActivity})`);
		
			    const aNewCustomProperties = oMetadataQueryResult.columns.COMPLETE_COLUMN_NAME.rows;
			    const aNewCustomDefaultValues = oMetadataQueryResult.columns.COMPLETE_DEFAULT_VALUE.rows;
			    
			    aNewCustomProperties.forEach((sCustomProperty, index) => {
			        jasmine.log(`Checking if property ${sCustomProperty} is ${aNewCustomDefaultValues[index]} after switching the category id`);
			        //let dbValueToCompare = oItemDbExt[sCustomProperty] !== null ? oItemDbExt[sCustomProperty].toString() : null;
			        //let expectedValueValueToCompare = aNewCustomDefaultValues[index] !== null ? aNewCustomDefaultValues[index].toString() : null;
			        //expected DEFAULT_VALUE of COLUMN type is NVARCHAR, Actual COLUMN type can be DECIMAL with trailing zeros or other types, remove trailing zeros before comparing the values
			        let dbValueToCompare = removeTrailingZeros(oItemDbExt[sCustomProperty]);
			        let expectedValueValueToCompare = removeTrailingZeros(aNewCustomDefaultValues[index]);
			        expect(dbValueToCompare).toEqual(expectedValueValueToCompare);
			    });
			});
			
			it("should not set default values for new valid custom properties (*_MANUAL & *_UNIT) when changing the item category from 3 (InternalActivity) to 1 (Document) and the new valid custom properies are on the request", function() {
				// arrange
				let oDbMaterialItem = mockstar_helpers.convertToObject(oItemTemporaryTestData, 2);
    			oDbMaterialItem = _.extend(oDbMaterialItem,mockstar_helpers.convertToObject(oItemTemporaryExtTestData, 2));
			
				const iDocumentItemCategory = 1;
				const oRequestItem = {
						ITEM_ID : oDbMaterialItem.ITEM_ID,
						CALCULATION_VERSION_ID : oDbMaterialItem.CALCULATION_VERSION_ID,
						ITEM_CATEGORY_ID : iDocumentItemCategory,
						CHILD_ITEM_CATEGORY_ID: iDocumentItemCategory,
						CMAT_STRING_MANUAL: "ABC",
						CMPL_INTEGER_MANUAL: 70,
						CMPR_DECIMAL_MANUAL: "90.5000000",
						CUST_DECIMAL_WITHOUT_REF_MANUAL: "50.8900000"
				};
				const aNewCustomProperties = ["CMAT_STRING_MANUAL", "CMPL_INTEGER_MANUAL", "CMPR_DECIMAL_MANUAL", "CUST_DECIMAL_WITHOUT_REF_MANUAL"];

				// act
				new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

				// assert
				const oItemDbStateExt = mockstar_helpers.convertResultToArray(oMockstar.execQuery(`select * from {{itemTemporaryExt}} where item_id = ${oDbMaterialItem.ITEM_ID} and calculation_version_id = ${oDbMaterialItem.CALCULATION_VERSION_ID}`));
				const oItemDbExt =  mockstar_helpers.convertToObject(oItemDbStateExt, 0);
	
			   aNewCustomProperties.forEach((sCustomProperty, index) => {
			        jasmine.log(`Checking if property ${sCustomProperty} is ${oRequestItem[sCustomProperty]} after switching the category id`);
			        let dbValueToCompare = oItemDbExt[sCustomProperty] !== null ? oItemDbExt[sCustomProperty].toString() : null;
					let expectedValueValueToCompare = oRequestItem[sCustomProperty] !== null ? oRequestItem[sCustomProperty].toString() : null;
					expect(dbValueToCompare).toEqual(expectedValueValueToCompare);
			    });
			});

		}

		it("should deliver masterdata with response when a masterdata related field is changed", function() {
			// arrange
			// maps  masterdata related fields to a valid item category in order to pass validation during test
			var mMasterdataRealtedFieldToItemCategory = {
					"ACCOUNT_ID" : 7,
					"DOCUMENT_ID" : 1,
					"MATERIAL_ID" : 2,
					"ACTIVITY_TYPE_ID" : 3,
					"PROCESS_ID" : 5,
					"COMPANY_CODE_ID" : 1,
					"COST_CENTER_ID" : 3,
					"PLANT_ID" : 1,
					"WORK_CENTER_ID" : 3,
					"BUSINESS_AREA_ID" : 1,
					"PROFIT_CENTER_ID" : 1,
					"VENDOR_ID" : 1
			};

			var oMasterdataEntities = {
					MATERIAL_ENTITIES : [{ MATERIAL_ID : "DUMMY"}]
			};
			spyOn(oPersistency.Administration, "getMasterdataOnItemLevel");
			oPersistency.Administration.getMasterdataOnItemLevel.and.returnValue(oMasterdataEntities);

			// needed to pass validation; for some masterdata references no temporary values are allowed; this mocks the valid references
			// in order to pass validation
			spyOn(oPersistency.CalculationVersion, "getExistingNonTemporaryMasterdata");
			oPersistency.CalculationVersion.getExistingNonTemporaryMasterdata.and.returnValue({
				ACCOUNTS: [{
					ACCOUNT_ID: "NEW"
				}],
				PRICE_SOURCES: [],
				UNIT_OF_MEASURES: [],
				CURRENCIES: [],
				DOCUMENT_TYPES: [],
    			DOCUMENT_STATUSES: [],
    			DESIGN_OFFICES: [],
    			MATERIAL_TYPES: [],
    			MATERIAL_GROUPS: [],
    			OVERHEADS: [],
    			VALUATION_CLASSES: []
			});

			// for the sake of performance, replace value determination with mock function
			spyOn(oPersistency.Item, "automaticValueDetermination");
			oPersistency.Item.automaticValueDetermination.and.returnValue({});

			var oDbMaterialItem = mockstar_helpers.convertToObject(oItemTemporaryTestData, 1);
			_.each(_.keys(mMasterdataRealtedFieldToItemCategory), function(sMasterdataRealtedField){
				jasmine.log(`Checking if masterdata is delivered if ${sMasterdataRealtedField} is updated`);
				var oRequestItem = {
					ITEM_ID : oDbMaterialItem.ITEM_ID,
					CALCULATION_VERSION_ID : oDbMaterialItem.CALCULATION_VERSION_ID,
					ITEM_CATEGORY_ID : mMasterdataRealtedFieldToItemCategory[sMasterdataRealtedField],
					CHILD_ITEM_CATEGORY_ID: mMasterdataRealtedFieldToItemCategory[sMasterdataRealtedField]

				};
				oRequestItem[sMasterdataRealtedField] = "NEW";

				// act
				new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

				// assert
				var oResponse = getResponse(oDefaultResponseMock);
				expect(oResponse).toBeDefined();
				expect(oResponse.body.masterdata).toBeDefined();
				expect(oResponse.body.masterdata.MATERIAL_ENTITIES[0].MATERIAL_ID).toEqual(oMasterdataEntities.MATERIAL_ENTITIES[0].MATERIAL_ID);
			});
		});

		it('should set price source and confidence level to Manual Price/Rate when a price is changed manualy', function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);

			var oModifiedTestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					PRICE_FIXED_PORTION : '5000.0000000',
					PRICE_VARIABLE_PORTION : '0.0000000',
					PRICE_UNIT : '0.0000000',
					PRICE_UNIT_UOM_ID : 'H',
					TRANSACTION_CURRENCY_ID : 'EUR'
			};

			var oRequest = {
					queryPath : "items",
					method : $.net.http.PUT,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify([ oModifiedTestItem ]);
						}
					}
			};

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[2]);
            expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(oModifiedTestItem.PRICE_FIXED_PORTION);
            expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[0]).toEqual(oModifiedTestItem.PRICE_VARIABLE_PORTION);
			expect(newItems.columns.TRANSACTION_CURRENCY_ID.rows[0]).toEqual(oModifiedTestItem.TRANSACTION_CURRENCY_ID);
            expect(newItems.columns.PRICE_UNIT.rows[0]).toEqual(oModifiedTestItem.PRICE_UNIT);
			expect(newItems.columns.PRICE_UNIT_UOM_ID.rows[0]).toEqual(oModifiedTestItem.PRICE_UNIT_UOM_ID);
			expect(newItems.columns.PRICE_SOURCE_ID.rows[0]).toBe(constants.PriceSource.ManualPrice);
			expect(newItems.columns.CONFIDENCE_LEVEL_ID.rows[0]).toBe(2);

			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem.CALCULATION_VERSION_ID);

		});
		
        it('should set price for item which has only deleted children, i.e. became a leaf again', function() {
            // arrange           
            const iIModifiedItemId = testData.oItemTestData.ITEM_ID[2];
            
            const oDeletedItem = new TestDataUtility(testData.oItemTemporaryTestData).getObject(0);
            oDeletedItem.ITEM_ID = 3004;
            oDeletedItem.PARENT_ITEM_ID = iIModifiedItemId;
            oDeletedItem.IS_DELETED = 1;
            oMockstar.insertTableData("itemTemporary", oDeletedItem);

            var oModifiedItem = {
                    ITEM_ID : iIModifiedItemId,
                    CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
                    PRICE_FIXED_PORTION : "5000.0000000"
            };

            var oRequest = {
                    queryPath : "items",
                    method : $.net.http.PUT,
                    parameters : params,
                    body : {
                        asString : function() {
                            return JSON.stringify([ oModifiedItem ]);
                        }
                    }
            };

            // act
            new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

            // assert
            expect(oDefaultResponseMock.status).toBe($.net.http.OK);
            
            // check that manual price was set correctly for the item with deleted children
            var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id = ${iIModifiedItemId}`);
            expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(oModifiedItem.PRICE_FIXED_PORTION);
        });		

		it("should set automatically price fields,price source, confidence level when a field (e.g COST_CENTER_ID) is" + "changed and the price is determined", function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);

			var oModifiedTestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					PRICE_FIXED_PORTION : testData.oItemTemporaryTestData.PRICE_FIXED_PORTION[2],
					PRICE_VARIABLE_PORTION : testData.oItemTemporaryTestData.PRICE_VARIABLE_PORTION[2],
					TRANSACTION_CURRENCY_ID : testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[2],
					PRICE_UNIT : testData.oItemTemporaryTestData.PRICE_UNIT[2],
					PRICE_UNIT_UOM_ID : testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[2],
					COST_CENTER_ID : 'CC2'
			};

			var oRequest = {
					queryPath : "items",
					method : $.net.http.PUT,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify([ oModifiedTestItem ]);
						}
					}
			};

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[2]);
				var headerInfo = oMockstar.execQuery("select version.valuation_date as VALUATION_DATE, version.master_data_timestamp as MASTER_DATA_TIMESTAMP, prj.controlling_area_id as CONTROLLING_AREA_ID from "
					+ "{{calculationVersionTemporary}} as version inner join {{calculation}} as calc on version.calculation_id = calc.calculation_id "
					+ "inner join {{project}} as prj on prj.project_id = calc.project_id "
					+ " where version.calculation_version_id = '" + testData.oItemTestData.CALCULATION_VERSION_ID[2] + "' and version.session_id = '" + sSessionId + "'");
				
			var activityPriceEntry = oMockstar.execQuery("select * from {{activityPrice}} where PRICE_SOURCE_ID=" + constants.PriceSource.PlcStandardRate
					+ " and CONTROLLING_AREA_ID = '" + headerInfo.columns.CONTROLLING_AREA_ID.rows[0]
			+ "' and COST_CENTER_ID = 'CC2' and ACTIVITY_TYPE_ID = '*'" + " and PROJECT_ID = '*' and VALID_FROM <= '"
			+ headerInfo.columns.VALUATION_DATE.rows[0].toJSON() + "'");

			expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(activityPriceEntry.columns.PRICE_FIXED_PORTION.rows[0]);
			expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[0]).toEqual(activityPriceEntry.columns.PRICE_VARIABLE_PORTION.rows[0]);
			expect(newItems.columns.TRANSACTION_CURRENCY_ID.rows[0]).toEqual(activityPriceEntry.columns.TRANSACTION_CURRENCY_ID.rows[0]);
			expect(newItems.columns.PRICE_UNIT.rows[0]).toEqual(activityPriceEntry.columns.PRICE_UNIT.rows[0]);
			expect(newItems.columns.PRICE_UNIT_UOM_ID.rows[0]).toEqual(activityPriceEntry.columns.PRICE_UNIT_UOM_ID.rows[0]);
			expect(newItems.columns.PRICE_SOURCE_ID.rows[0]).toBe(constants.PriceSource.PlcStandardRate);
			expect(newItems.columns.CONFIDENCE_LEVEL_ID.rows[0]).toBe(3);

			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem.CALCULATION_VERSION_ID);
		});
		
		it("should set the automatically material group and material type when material is changed", function() {

			// arrange
			//add new material in the material table
			var oMaterial = {  "MATERIAL_ID" : ['MAT1'],
	                           "MATERIAL_GROUP_ID": ['MG1'],
	                           "MATERIAL_TYPE_ID": ['MT1'],
	                           "IS_PHANTOM_MATERIAL" : [1],
		                       "_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
	                           "_VALID_TO" : [null],
	                           "_SOURCE" : [1],
	                           "_CREATED_BY" :['U000001']
				    };
			oMockstar.clearTable("material");
            oMockstar.insertTableData("material", oMaterial);

			//insert the item that will be updated in the item temporary table
		  	var oMaterialItem = mockstar_helpers.convertToObject(testData.oItemTemporaryTestData, 2);
		  	oMaterialItem.ITEM_CATEGORY_ID = 2;
		  	oMaterialItem.ITEM_ID = 1111;
		  	oMockstar.insertTableData("itemTemporary", oMaterialItem);
		  	
		  //prepare the request, set the material for an existing item
			var oModifiedTestItem = {
					ITEM_ID : oMaterialItem.ITEM_ID,
					CALCULATION_VERSION_ID : oMaterialItem.CALCULATION_VERSION_ID,
					MATERIAL_ID: 'MAT1'
			};
            
            var parameters =  [ {
    			name : "calculate",
    			value : "false"
		    },
		    {
		        name : "compressedResult",
		        value : "false"
		    }
		    ];
            
			var oRequest = {
					queryPath : "items",
					method : $.net.http.PUT,
					parameters : parameters,
					body : {
						asString : function() {
							return JSON.stringify([ oModifiedTestItem ]);
						}
					}
			};
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			
			//check that the properties set in the item temporary table are correct
			//when the material is changed, the material group and material type
			// are determined using the t_material table and set in the temporary table
			var newItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id= 1111");
			
			expect(newItems.columns.MATERIAL_GROUP_ID.rows[0]).toEqual(oMaterial.MATERIAL_GROUP_ID[0]);
			expect(newItems.columns.MATERIAL_TYPE_ID.rows[0]).toEqual(oMaterial.MATERIAL_TYPE_ID[0]);
			
			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem.CALCULATION_VERSION_ID);
		});

		it('should set price source and confidence level to Manual Price/Rate when a field (e.g COST_CENTER_ID) is changed and the price is not determined', function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);

			var oModifiedTestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					PRICE_FIXED_PORTION : testData.oItemTemporaryTestData.PRICE_FIXED_PORTION[2],
					PRICE_VARIABLE_PORTION : testData.oItemTemporaryTestData.PRICE_VARIABLE_PORTION[2],
					TRANSACTION_CURRENCY_ID : testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[2],
					PRICE_UNIT : testData.oItemTemporaryTestData.PRICE_UNIT[2],
					PRICE_UNIT_UOM_ID : testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[2],
					COST_CENTER_ID : 'CC3'
			};

			var oRequest = {
					queryPath : "items",
					method : $.net.http.PUT,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify([ oModifiedTestItem ]);
						}
					}
			};

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[2]);
            expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(oModifiedTestItem.PRICE_FIXED_PORTION);
            expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[0]).toEqual(oModifiedTestItem.PRICE_VARIABLE_PORTION);
			expect(newItems.columns.TRANSACTION_CURRENCY_ID.rows[0]).toEqual(oModifiedTestItem.TRANSACTION_CURRENCY_ID);
            expect(newItems.columns.PRICE_UNIT.rows[0]).toEqual(oModifiedTestItem.PRICE_UNIT);
			expect(newItems.columns.PRICE_UNIT_UOM_ID.rows[0]).toEqual(oModifiedTestItem.PRICE_UNIT_UOM_ID);
			expect(newItems.columns.PRICE_SOURCE_ID.rows[0]).toBe(constants.PriceSource.ManualPrice);
			expect(newItems.columns.CONFIDENCE_LEVEL_ID.rows[0]).toBe(2);

			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem.CALCULATION_VERSION_ID);
		});

		it('should set price source and confidence level to [Manual Price] when item category is changed to Material and the price is not determined',	function() {

			// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
			var oldItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[2]);

			var oModifiedTestItem = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : constants.ItemCategory.Material,
					CHILD_ITEM_CATEGORY_ID: constants.ItemCategory.Material,
					PRICE_FIXED_PORTION : testData.oItemTemporaryTestData.PRICE_FIXED_PORTION[2],
					PRICE_VARIABLE_PORTION : testData.oItemTemporaryTestData.PRICE_VARIABLE_PORTION[2],
					TRANSACTION_CURRENCY_ID : testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[2],
					PRICE_UNIT : testData.oItemTemporaryTestData.PRICE_UNIT[2],
					PRICE_UNIT_UOM_ID : testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[2]
			};

			var oRequest = {
					queryPath : "items",
					method : $.net.http.PUT,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify([ oModifiedTestItem ]);
						}
					}
			};

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[2]);
            expect(newItems.columns.PRICE_FIXED_PORTION.rows[0]).toEqual(oModifiedTestItem.PRICE_FIXED_PORTION);
            expect(newItems.columns.PRICE_VARIABLE_PORTION.rows[0]).toEqual(oModifiedTestItem.PRICE_VARIABLE_PORTION);
			expect(newItems.columns.TRANSACTION_CURRENCY_ID.rows[0]).toEqual(oModifiedTestItem.TRANSACTION_CURRENCY_ID);
            expect(newItems.columns.PRICE_UNIT.rows[0]).toEqual(oModifiedTestItem.PRICE_UNIT);
			expect(newItems.columns.PRICE_UNIT_UOM_ID.rows[0]).toEqual(oModifiedTestItem.PRICE_UNIT_UOM_ID);
			expect(newItems.columns.PRICE_SOURCE_ID.rows[0]).toBe(constants.PriceSource.ManualPrice);
			expect(newItems.columns.CONFIDENCE_LEVEL_ID.rows[0]).toBe(oldItems.columns.CONFIDENCE_LEVEL_ID.rows[0]);

			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oModifiedTestItem.CALCULATION_VERSION_ID);
		});
		
		if(jasmine.plcTestRunParameters.generatedFields !== true){
    		it('should set PRICE_UOM and TotalQuantityUOM when QuantityForOneAssemblyUOM changed on assembly item',	function() {
    
    			// arrange
    			var oRequestItem = {
    					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
    					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
    					QUANTITY_UOM_ID : "L"
    			};
    
    			// act
    			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();
    
    			// assert
    			var oItemAfterUpdate = oMockstar.execQuery("select ITEM_ID, QUANTITY_UOM_ID, TOTAL_QUANTITY_UOM_ID, PRICE_UNIT_UOM_ID from {{itemTemporary}} where item_id=" + oRequestItem.ITEM_ID);
    			
    			expect(oItemAfterUpdate).toMatchData({
    			    "ITEM_ID" : [oRequestItem.ITEM_ID],
					"QUANTITY_UOM_ID" : [oRequestItem.QUANTITY_UOM_ID],
					"TOTAL_QUANTITY_UOM_ID" : [oRequestItem.QUANTITY_UOM_ID],
					"PRICE_UNIT_UOM_ID" : [oRequestItem.QUANTITY_UOM_ID]
				}, ["ITEM_ID"]);	
    			
    		});
    		
    		it('should not set PRICE_UOM and TotalQuantityUOM when QuantityForOneAssemblyUOM changed on leaf item',	function() {
    
    			// arrange
    			var iItemTestIndex = 2; 
    			var oRequestItem = {
    					ITEM_ID : testData.oItemTestData.ITEM_ID[iItemTestIndex],
    					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[iItemTestIndex],
    					QUANTITY_UOM_ID : "L"
    			};
    
    			// act
    			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();
    
    			// assert
    			var oItemAfterUpdate = oMockstar.execQuery("select ITEM_ID, QUANTITY_UOM_ID, TOTAL_QUANTITY_UOM_ID, PRICE_UNIT_UOM_ID from {{itemTemporary}} where item_id=" + oRequestItem.ITEM_ID);
    			
    			expect(oItemAfterUpdate).toMatchData({
    			    "ITEM_ID" : [oRequestItem.ITEM_ID],
					"QUANTITY_UOM_ID" : [oRequestItem.QUANTITY_UOM_ID],
					"TOTAL_QUANTITY_UOM_ID" : [testData.oItemTestData.TOTAL_QUANTITY_UOM_ID[iItemTestIndex]],
					"PRICE_UNIT_UOM_ID" : [testData.oItemTestData.PRICE_UNIT_UOM_ID[iItemTestIndex]]
				}, ["ITEM_ID"]);
			});
			
			it("should do nothing if not field was changed in the request", function() {
				// the request just contains required ITEM_ID and CALCULATION_VERSION_ID but no changed item field
				var oModifiedTestItem1 = {
						ITEM_ID : testData.oItemTestData.ITEM_ID[1],
						CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1]
				};
	
				// act
				new Dispatcher(oCtx, prepareRequest([oModifiedTestItem1]), oDefaultResponseMock).dispatch();
	
				// assert
				// HTTP body and status have been set
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	
				// although nothing was changed, still only get calculation results of the item in the request (delta update)
				expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items")).toBe(1);
				expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items", "ITEM_ID= " + testData.oItemTestData.ITEM_ID[1])).toBe(1);
	
				// no change --> calculation version must not be set to dirty
				checkCalculationVersionSetDirty(false, oDefaultResponseMock, oModifiedTestItem1.CALCULATION_VERSION_ID);
	
				var oResponse = getResponse(oDefaultResponseMock);
				expect(oResponse).toEqual({body: {}, head: {}}); // expect empty body and head
			});
		}
		
		//Referenced Calculation Version
		it('should not update item - set referenced calculation version and throw an exception if the reference calculation version to be set does not exist', function() {

			// arrange
			var iRefCvId = 5810;	//does not exist in testData.oCalculationVersionTestData
			
			var iItemId = oItemTemporaryTestData.ITEM_ID[1]; 	//3002
			var iCalculationVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];	//2809
			var iRefCalcVerItemCategoryId = constants.ItemCategory.ReferencedVersion;
			
			var iOldItemsMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporary", "CALCULATION_VERSION_ID='" + iCalculationVersionId + "'"); 
			expect(iOldItemsMasterCalcVerCount).toBe(3);	// 3 items in calc ver
			
			var oOldItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where calculation_version_id=" + iCalculationVersionId );
			
			var oRequestItem = {
					ITEM_ID : iItemId, 	//3002
					CALCULATION_VERSION_ID : iCvId, 	//2809
					ITEM_CATEGORY_ID : iRefCalcVerItemCategoryId, 	//ReferencedVersion
					REFERENCED_CALCULATION_VERSION_ID : iRefCvId	//reference calculation version set
			};
			
			// act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set + correct exception code
			expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			
			//check that message details are set
			expect(oResponseObject.head.messages[0].details.calculationVersionObjs).toBeDefined();
			expect(oResponseObject.head.messages[0].details.calculationVersionObjs.length).toBe(1);
			expect(oResponseObject.head.messages[0].details.calculationVersionObjs[0].id).toBe(iRefCvId);
						
			//no update has been performed - same data in mocked tables
			var iNewItemsMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporary", "CALCULATION_VERSION_ID='" + iCalculationVersionId + "'"); 
			expect(iNewItemsMasterCalcVerCount).toBe(iOldItemsMasterCalcVerCount);	// 3 items in calc ver, as before
			
			var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where calculation_version_id=" + iCalculationVersionId );

			// nothing has changed
			expect(oNewItemsMasterCalcVer).toMatchData(oOldItemsMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
		});
		
		it('should update item - set referenced calc version, delete all sub-items and set the values from root item of the source calculation if input is valid', function() {
			
			//arrange
			//	clear all necessary tables first
			oMockstar.clearTable("calculation");
			oMockstar.clearTable("calculationVersion");
			oMockstar.clearTable("item");
			oMockstar.clearTable("itemTemporary");
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.clearTable("item_ext");
				oMockstar.clearTable("itemTemporaryExt");
			}
			
			//generate new test data & insert into necessary tables
			var oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedCalcVer(jasmine.plcTestRunParameters.generatedFields);
			
			oMockstar.insertTableData("calculation", oBuiltTestData.CalcTestData);	//"CURRENT_CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ]
			oMockstar.insertTableData("calculationVersion", oBuiltTestData.CalcVerTestData);	//[ 2809, 4809, 5809 ]
			oMockstar.insertTableData("item", oBuiltTestData.ItemSourceTestData);	// "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001, 3004 ]
																					// "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 4809, 5809 ]
			
			// we need only "ITEM_ID" : [ 3001, 3002, 3003, 3004 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809, 3002 and 3004 are sub-items of 3001 (3003 is subitem of 3002)
			oMockstar.insertTableData("itemTemporary", oBuiltTestData.ItemMasterTempTestData);	

			if(jasmine.plcTestRunParameters.generatedFields === true){
			    //"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ]	
				oMockstar.insertTableData("item_ext", oBuiltTestData.ItemExtTestData); 	
				// we need only "ITEM_ID" : [ 3001, 3002, 3003 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
				oMockstar.insertTableData("itemTemporaryExt", oBuiltTestData.ItemTempExtTestData); 	
			}
			
			var oSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.CalcVerTestData, 1);
			var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemSourceTestData, 3);
			var oItemMasterCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemMasterTempTestData, 1);	//the item in master calc ver before update

			var iItemId = oBuiltTestData.ItemMasterTempTestData.ITEM_ID[1]; 	//3002
			var iCalculationVersionId = oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[0];	//2809
			var iRefCvId = oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1];	//4809 with root item 5001	
			var iRefCalcVerItemCategoryId = constants.ItemCategory.ReferencedVersion;
			
			var oRequestItem = {
					ITEM_ID : iItemId,		//3001
					CALCULATION_VERSION_ID : iCalculationVersionId,	//2809
					ITEM_CATEGORY_ID : iRefCalcVerItemCategoryId, 	// = 10 
					CHILD_ITEM_CATEGORY_ID: iRefCalcVerItemCategoryId,
					REFERENCED_CALCULATION_VERSION_ID : iRefCvId	//4809 with root item 5001
			};

			//act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();
			
			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			
			var iNewItemsMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporary", "CALCULATION_VERSION_ID='" + iCalculationVersionId + "' AND IS_DELETED = 0"); 
			expect(iNewItemsMasterCalcVerCount).toBe(3);	//sub-item of item 3002 (3003) should be gone
		
			//values of non-identical fields
			var oExpectedNonIdenticalFieldsValues = {
					"ITEM_ID" : [ iItemId ], 
					"CALCULATION_VERSION_ID" : [ iCvId ], 
					"PARENT_ITEM_ID" : [ oItemMasterCalcVer.PARENT_ITEM_ID ], 
					"PREDECESSOR_ITEM_ID" : [ oItemMasterCalcVer.PREDECESSOR_ITEM_ID ],
					"REFERENCED_CALCULATION_VERSION_ID" : [ iRefCvId ],
					"ITEM_CATEGORY_ID" : [ iRefCalcVerItemCategoryId ],
					"CHILD_ITEM_CATEGORY_ID" : [ iRefCalcVerItemCategoryId ],
					"BASE_QUANTITY" : [ oItemMasterCalcVer.BASE_QUANTITY ], 
					"BASE_QUANTITY_IS_MANUAL" : [ oItemMasterCalcVer.BASE_QUANTITY_IS_MANUAL ], 
					"QUANTITY" : [ oItemMasterCalcVer.QUANTITY ], 
					"QUANTITY_IS_MANUAL" : [ oItemMasterCalcVer.QUANTITY_IS_MANUAL ], 
					"QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID ],
					"TOTAL_QUANTITY" : [ oItemMasterCalcVer.TOTAL_QUANTITY ],
					"TOTAL_QUANTITY_DEPENDS_ON" : [ oItemMasterCalcVer.TOTAL_QUANTITY_DEPENDS_ON ],
					"PRICE_FIXED_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION ],
					"PRICE_VARIABLE_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION ],
					"PRICE" : [ oRootItemSourceCalcVer.TOTAL_COST ],
					"TRANSACTION_CURRENCY_ID" : [ oSourceCalcVer.REPORT_CURRENCY_ID ],
					"PRICE_UNIT" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY ],
					"PRICE_SOURCE_ID" : [ oRootItemSourceCalcVer.PRICE_SOURCE_ID ],	//Calculated Costs
					"PRICE_SOURCE_TYPE_ID" : [ 4 ],	//Calculated Costs
					"LOT_SIZE" : [ oItemMasterCalcVer.LOT_SIZE ],
					"LOT_SIZE_IS_MANUAL" : [ oItemMasterCalcVer.LOT_SIZE_IS_MANUAL ],
					"IS_ACTIVE" : [ 1 ],
					"HIGHLIGHT_GREEN" : [ oItemMasterCalcVer.HIGHLIGHT_GREEN ],
					"HIGHLIGHT_ORANGE" : [ oItemMasterCalcVer.HIGHLIGHT_ORANGE ],
					"HIGHLIGHT_YELLOW" : [ oItemMasterCalcVer.HIGHLIGHT_YELLOW ],
					"PRICE_UNIT_UOM_ID" : [oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID],
					"ACCOUNT_ID": [oRootItemSourceCalcVer.ACCOUNT_ID],
					"COMPANY_CODE_ID": [oRootItemSourceCalcVer.COMPANY_CODE_ID],
					"PLANT_ID": [oRootItemSourceCalcVer.PLANT_ID],
					"BUSINESS_AREA_ID": [oRootItemSourceCalcVer.BUSINESS_AREA_ID],
					"PROFIT_CENTER_ID": [oRootItemSourceCalcVer.PROFIT_CENTER_ID],				
		            "DOCUMENT_TYPE_ID": [oRootItemSourceCalcVer.DOCUMENT_TYPE_ID],
		            "DOCUMENT_ID": [oRootItemSourceCalcVer.DOCUMENT_ID],
		            "DOCUMENT_VERSION": [oRootItemSourceCalcVer.DOCUMENT_VERSION],
		            "DOCUMENT_PART": [oRootItemSourceCalcVer.DOCUMENT_PART],
		            "MATERIAL_ID": [oRootItemSourceCalcVer.MATERIAL_ID],
		            "ENGINEERING_CHANGE_NUMBER_ID": [oRootItemSourceCalcVer.ENGINEERING_CHANGE_NUMBER_ID],
		            "COMMENT" : [oRootItemSourceCalcVer.COMMENT],
		            "WORK_CENTER_ID" : [oRootItemSourceCalcVer.WORK_CENTER_ID]
			}
			
			// expected values = identical fields values and non-identical fields values copied from source (referenced) calc ver root item to item in master calc ver
			var oExpectedNewItemsMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemSourceCalcVer]), oExpectedNonIdenticalFieldsValues);

			var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + iItemId);
			
			// dates are not relevant
			delete oExpectedNewItemsMasterCalcVer.CREATED_ON;
			delete oExpectedNewItemsMasterCalcVer.LAST_MODIFIED_ON;
			
			delete oNewItemsMasterCalcVer.columns.CREATED_ON;
			delete oNewItemsMasterCalcVer.columns.LAST_MODIFIED_ON;
			
			oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY = null;
			oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION = null;
			oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION = null;
			oExpectedNewItemsMasterCalcVer.OTHER_COST = null;
			oExpectedNewItemsMasterCalcVer.OTHER_COST_FIXED_PORTION = null;
			oExpectedNewItemsMasterCalcVer.OTHER_COST_VARIABLE_PORTION = null;
			oExpectedNewItemsMasterCalcVer.TOTAL_COST = null;
			oExpectedNewItemsMasterCalcVer.TOTAL_COST_FIXED_PORTION = null;
			oExpectedNewItemsMasterCalcVer.TOTAL_COST_VARIABLE_PORTION = null;
						 
			oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_CALCULATED = null;
			oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_IS_MANUAL = 1;
			oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_CALCULATED = null;
			oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_IS_MANUAL = 1;
			oExpectedNewItemsMasterCalcVer.PRICE_UNIT_CALCULATED = null;
			oExpectedNewItemsMasterCalcVer.PRICE_UNIT_IS_MANUAL = 1;
			
            oExpectedNewItemsMasterCalcVer.ACTIVITY_TYPE_ID = null;
            oExpectedNewItemsMasterCalcVer.PROCESS_ID = null;
            oExpectedNewItemsMasterCalcVer.COST_CENTER_ID = null;
            oExpectedNewItemsMasterCalcVer.CREATED_BY = 'SecondTestUser';
            oExpectedNewItemsMasterCalcVer.ITEM_DESCRIPTION = null;
			
			
			expect(oNewItemsMasterCalcVer).toMatchData(oExpectedNewItemsMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
    			 var iNewItemsExtMasterCalcVerCount = oMockstar.execQuery('select count(*) as count '+
                                        'from {{itemTemporary}} as item '+
                                        'right outer join {{itemTemporaryExt}} as ext '+
                                        'on item.item_id = ext.item_id and item.calculation_version_id = ext.calculation_version_id '+
                                        'where item.is_deleted = 0 and ext.calculation_version_id = '+iCvId);
                                        
    			//var iNewItemsExtMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporaryExt", "CALCULATION_VERSION_ID='" + iCvId + "'"); 
    			//only root item + item_id = 3002 should be in master calculation version (sub-item 3003 should be marked as deleted)
    			expect(parseInt(iNewItemsExtMasterCalcVerCount.columns.COUNT.rows[0],10)).toBe(3);	
    			
				//root item's custom fields values
				var oReferencedVersionRootItem = mockstar_helpers.convertToObject(oBuiltTestData.ItemExtTestData, 3);
				oReferencedVersionRootItem.CUST_STRING_FORMULA_IS_MANUAL = 1;
				oReferencedVersionRootItem.CUST_STRING_FORMULA_MANUAL = 'T4';
				var oExpectedNewItemsExtMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oReferencedVersionRootItem]), 
				    {"ITEM_ID" : [ iItemId ], "CALCULATION_VERSION_ID" : [ iCalculationVersionId ]});
				
				var oNewItemsExtMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + iItemId);
				
				expect(oNewItemsExtMasterCalcVer).toMatchData(oExpectedNewItemsExtMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			}	
		});

		it('should update item (account included) - set referenced calc version, delete all sub-items and set the values from root item of the source calculation if input is valid', function() {
			
			//arrange
			//	clear all necessary tables first
			oMockstar.clearTable("calculation");
			oMockstar.clearTable("calculationVersion");
			oMockstar.clearTable("item");
			oMockstar.clearTable("itemTemporary");
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.clearTable("item_ext");
				oMockstar.clearTable("itemTemporaryExt");
			}
			
			//generate new test data & insert into necessary tables
			var oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedCalcVer(jasmine.plcTestRunParameters.generatedFields);
			
			oMockstar.insertTableData("calculation", oBuiltTestData.CalcTestData);	//"CURRENT_CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ]
			oMockstar.insertTableData("calculationVersion", oBuiltTestData.CalcVerTestData);	//[ 2809, 4809, 5809 ]
			oMockstar.insertTableData("item", oBuiltTestData.ItemSourceTestData);	// "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001, 3004 ]
																					// "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 4809, 5809 ]
			
			// we need only "ITEM_ID" : [ 3001, 3002, 3003, 3004 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809, 3002 and 3004 are sub-items of 3001 (3003 is subitem of 3002)
			oMockstar.insertTableData("itemTemporary", oBuiltTestData.ItemMasterTempTestData);	
			oMockstar.insertTableData("account", {
				ACCOUNT_ID: ["#AC11"],
				CONTROLLING_AREA_ID: ["1000"],
				_VALID_FROM: ["2000-01-01T00:00:00.000Z"]
			});

			if(jasmine.plcTestRunParameters.generatedFields === true){
			    //"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ]	
				oMockstar.insertTableData("item_ext", oBuiltTestData.ItemExtTestData); 	
				// we need only "ITEM_ID" : [ 3001, 3002, 3003 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
				oMockstar.insertTableData("itemTemporaryExt", oBuiltTestData.ItemTempExtTestData); 	
			}
			
			var oSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.CalcVerTestData, 1);
			var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemSourceTestData, 3);
			var oItemMasterCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemMasterTempTestData, 1);	//the item in master calc ver before update

			var iItemId = oBuiltTestData.ItemMasterTempTestData.ITEM_ID[1]; 	//3002
			var iCalculationVersionId = oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[0];	//2809
			var iRefCvId = oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1];	//4809 with root item 5001	
			var iRefCalcVerItemCategoryId = constants.ItemCategory.ReferencedVersion;
			var sAccountId = '#AC11';
			
			var oRequestItem = {
					ITEM_ID : iItemId,		//3001
					CALCULATION_VERSION_ID : iCalculationVersionId,	//2809
					ITEM_CATEGORY_ID : iRefCalcVerItemCategoryId, 	// = 10 
					CHILD_ITEM_CATEGORY_ID: iRefCalcVerItemCategoryId,
					REFERENCED_CALCULATION_VERSION_ID : iRefCvId,	//4809 with root item 5001
					ACCOUNT_ID: sAccountId
			};

			//act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();
			
			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			
			var iNewItemsMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporary", "CALCULATION_VERSION_ID='" + iCalculationVersionId + "' AND IS_DELETED = 0"); 
			expect(iNewItemsMasterCalcVerCount).toBe(3);	//sub-item of item 3002 (3003) should be gone
		
			//values of non-identical fields
			var oExpectedNonIdenticalFieldsValues = {
					"ITEM_ID" : [ iItemId ], 
					"CALCULATION_VERSION_ID" : [ iCvId ], 
					"PARENT_ITEM_ID" : [ oItemMasterCalcVer.PARENT_ITEM_ID ], 
					"PREDECESSOR_ITEM_ID" : [ oItemMasterCalcVer.PREDECESSOR_ITEM_ID ],
					"REFERENCED_CALCULATION_VERSION_ID" : [ iRefCvId ],
					"ITEM_CATEGORY_ID" : [ iRefCalcVerItemCategoryId ],
					"CHILD_ITEM_CATEGORY_ID" : [ iRefCalcVerItemCategoryId ],
					"BASE_QUANTITY" : [ oItemMasterCalcVer.BASE_QUANTITY ], 
					"BASE_QUANTITY_IS_MANUAL" : [ oItemMasterCalcVer.BASE_QUANTITY_IS_MANUAL ], 
					"QUANTITY" : [ oItemMasterCalcVer.QUANTITY ], 
					"QUANTITY_IS_MANUAL" : [ oItemMasterCalcVer.QUANTITY_IS_MANUAL ], 
					"QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID ],
					"TOTAL_QUANTITY" : [ oItemMasterCalcVer.TOTAL_QUANTITY ],
					"TOTAL_QUANTITY_DEPENDS_ON" : [ oItemMasterCalcVer.TOTAL_QUANTITY_DEPENDS_ON ],
					"PRICE_FIXED_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION ],
					"PRICE_VARIABLE_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION ],
					"PRICE" : [ oRootItemSourceCalcVer.TOTAL_COST ],
					"TRANSACTION_CURRENCY_ID" : [ oSourceCalcVer.REPORT_CURRENCY_ID ],
					"PRICE_UNIT" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY ],
					"PRICE_SOURCE_ID" : [ oRootItemSourceCalcVer.PRICE_SOURCE_ID ],	//Calculated Costs
					"PRICE_SOURCE_TYPE_ID" : [ 4 ],	//Calculated Costs
					"LOT_SIZE" : [ oItemMasterCalcVer.LOT_SIZE ],
					"LOT_SIZE_IS_MANUAL" : [ oItemMasterCalcVer.LOT_SIZE_IS_MANUAL ],
					"IS_ACTIVE" : [ 1 ],
					"HIGHLIGHT_GREEN" : [ oItemMasterCalcVer.HIGHLIGHT_GREEN ],
					"HIGHLIGHT_ORANGE" : [ oItemMasterCalcVer.HIGHLIGHT_ORANGE ],
					"HIGHLIGHT_YELLOW" : [ oItemMasterCalcVer.HIGHLIGHT_YELLOW ],
					"PRICE_UNIT_UOM_ID" : [oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID],
					"ACCOUNT_ID": [sAccountId],
					"DETERMINED_ACCOUNT_ID": [sAccountId],
					"COMPANY_CODE_ID": [oRootItemSourceCalcVer.COMPANY_CODE_ID],
					"PLANT_ID": [oRootItemSourceCalcVer.PLANT_ID],
					"BUSINESS_AREA_ID": [oRootItemSourceCalcVer.BUSINESS_AREA_ID],
					"PROFIT_CENTER_ID": [oRootItemSourceCalcVer.PROFIT_CENTER_ID],				
		            "DOCUMENT_TYPE_ID": [oRootItemSourceCalcVer.DOCUMENT_TYPE_ID],
		            "DOCUMENT_ID": [oRootItemSourceCalcVer.DOCUMENT_ID],
		            "DOCUMENT_VERSION": [oRootItemSourceCalcVer.DOCUMENT_VERSION],
		            "DOCUMENT_PART": [oRootItemSourceCalcVer.DOCUMENT_PART],
		            "MATERIAL_ID": [oRootItemSourceCalcVer.MATERIAL_ID],
		            "ENGINEERING_CHANGE_NUMBER_ID": [oRootItemSourceCalcVer.ENGINEERING_CHANGE_NUMBER_ID],
		            "COMMENT" : [oRootItemSourceCalcVer.COMMENT],
		            "WORK_CENTER_ID" : [oRootItemSourceCalcVer.WORK_CENTER_ID]
			}
			
			// expected values = identical fields values and non-identical fields values copied from source (referenced) calc ver root item to item in master calc ver
			var oExpectedNewItemsMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemSourceCalcVer]), oExpectedNonIdenticalFieldsValues);

			var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + iItemId);
			
			// dates are not relevant
			delete oExpectedNewItemsMasterCalcVer.CREATED_ON;
			delete oExpectedNewItemsMasterCalcVer.LAST_MODIFIED_ON;
			
			delete oNewItemsMasterCalcVer.columns.CREATED_ON;
			delete oNewItemsMasterCalcVer.columns.LAST_MODIFIED_ON;
			
			oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY = null;
			oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION = null;
			oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION = null;
			oExpectedNewItemsMasterCalcVer.OTHER_COST = null;
			oExpectedNewItemsMasterCalcVer.OTHER_COST_FIXED_PORTION = null;
			oExpectedNewItemsMasterCalcVer.OTHER_COST_VARIABLE_PORTION = null;
			oExpectedNewItemsMasterCalcVer.TOTAL_COST = null;
			oExpectedNewItemsMasterCalcVer.TOTAL_COST_FIXED_PORTION = null;
			oExpectedNewItemsMasterCalcVer.TOTAL_COST_VARIABLE_PORTION = null;
						 
			oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_CALCULATED = null;
			oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_IS_MANUAL = 1;
			oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_CALCULATED = null;
			oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_IS_MANUAL = 1;
			oExpectedNewItemsMasterCalcVer.PRICE_UNIT_CALCULATED = null;
			oExpectedNewItemsMasterCalcVer.PRICE_UNIT_IS_MANUAL = 1;
			
            oExpectedNewItemsMasterCalcVer.ACTIVITY_TYPE_ID = null;
            oExpectedNewItemsMasterCalcVer.PROCESS_ID = null;
            oExpectedNewItemsMasterCalcVer.COST_CENTER_ID = null;
            oExpectedNewItemsMasterCalcVer.CREATED_BY = 'SecondTestUser';
            oExpectedNewItemsMasterCalcVer.ITEM_DESCRIPTION = null;
			
			
			expect(oNewItemsMasterCalcVer).toMatchData(oExpectedNewItemsMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
    			 var iNewItemsExtMasterCalcVerCount = oMockstar.execQuery('select count(*) as count '+
                                        'from {{itemTemporary}} as item '+
                                        'right outer join {{itemTemporaryExt}} as ext '+
                                        'on item.item_id = ext.item_id and item.calculation_version_id = ext.calculation_version_id '+
                                        'where item.is_deleted = 0 and ext.calculation_version_id = '+iCvId);
                                        
    			//var iNewItemsExtMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporaryExt", "CALCULATION_VERSION_ID='" + iCvId + "'"); 
    			//only root item + item_id = 3002 should be in master calculation version (sub-item 3003 should be marked as deleted)
    			expect(parseInt(iNewItemsExtMasterCalcVerCount.columns.COUNT.rows[0],10)).toBe(3);	
    			
				//root item's custom fields values
				var oReferencedVersionRootItem = mockstar_helpers.convertToObject(oBuiltTestData.ItemExtTestData, 3);
				oReferencedVersionRootItem.CUST_STRING_FORMULA_IS_MANUAL = 1;
				oReferencedVersionRootItem.CUST_STRING_FORMULA_MANUAL = 'T4';
				var oExpectedNewItemsExtMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oReferencedVersionRootItem]), 
				    {"ITEM_ID" : [ iItemId ], "CALCULATION_VERSION_ID" : [ iCalculationVersionId ]});
				
				var oNewItemsExtMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + iItemId);
				
				expect(oNewItemsExtMasterCalcVer).toMatchData(oExpectedNewItemsExtMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			}	
		});
		
		it('should set the id to the global table send to the Afl when the item category is changed to referenced version', function() {
			
			//arrange
			//	clear all necessary tables first
			oMockstar.clearTable("calculation");
			oMockstar.clearTable("calculationVersion");
			oMockstar.clearTable("item");
			oMockstar.clearTable("itemTemporary");
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.clearTable("item_ext");
				oMockstar.clearTable("itemTemporaryExt");
			}
			
			//generate new test data & insert into necessary tables
			var oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedCalcVer(jasmine.plcTestRunParameters.generatedFields);
			
			oMockstar.insertTableData("calculation", oBuiltTestData.CalcTestData);	//"CURRENT_CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ]
			oMockstar.insertTableData("calculationVersion", oBuiltTestData.CalcVerTestData);	//[ 2809, 4809, 5809 ]
			oMockstar.insertTableData("item", oBuiltTestData.ItemSourceTestData);	// "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001, 3004 ]
																					// "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 4809, 5809 ]
			
			// we need only "ITEM_ID" : [ 3001, 3002, 3003, 3004 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809, 3002 and 3004 are sub-items of 3001 (3003 is subitem of 3002)
			oMockstar.insertTableData("itemTemporary", oBuiltTestData.ItemMasterTempTestData);	
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
			    //"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ]	
				oMockstar.insertTableData("item_ext", oBuiltTestData.ItemExtTestData); 	
				// we need only "ITEM_ID" : [ 3001, 3002, 3003 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
				oMockstar.insertTableData("itemTemporaryExt", oBuiltTestData.ItemTempExtTestData); 	
			}

			var iItemId = oBuiltTestData.ItemMasterTempTestData.ITEM_ID[1]; 	//3002
			var iCalculationVersionId = oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[0];	//2809
			var iRefCvId = oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1];	//4809 with root item 5001	
			var iRefCalcVerItemCategoryId = constants.ItemCategory.ReferencedVersion;
			
			var oRequestItem = {
					ITEM_ID : iItemId,		//3001
					CALCULATION_VERSION_ID : iCalculationVersionId,	//2809
					ITEM_CATEGORY_ID : iRefCalcVerItemCategoryId, 	// = 10 
					CHILD_ITEM_CATEGORY_ID: iRefCalcVerItemCategoryId,
					REFERENCED_CALCULATION_VERSION_ID : iRefCvId	//4809 with root item 5001
			};

			//act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();
			
			// assert
			//check the item ids that are send to AFL
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items", "ITEM_ID= 3002")).toBe(1);
		});
		
		it('should return information about referenced version', function() {
			oMockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
			//masterdata
		    oMockstar.insertTableData("currency", testData.mCsvFiles.currency);
		    oMockstar.insertTableData("uom", testData.mCsvFiles.uom);
		    oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
		    oMockstar.insertTableData("costing_sheet__text", testData.oCostingSheetTextTestData);
		    oMockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
		    oMockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
		    oMockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
		    oMockstar.insertTableData("costing_sheet_overhead", testData.oCostingSheetOverheadTestData);
		    oMockstar.insertTableData("component_split", testData.oComponentSplitTest);
			var oRequestItem = {
					ITEM_ID : 3002,		
					CALCULATION_VERSION_ID : 2809,	
					ITEM_CATEGORY_ID : 10,  
					CHILD_ITEM_CATEGORY_ID: 10,
					REFERENCED_CALCULATION_VERSION_ID : 5809
			};

			//act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();
			
			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.body.referencesdata.PROJECTS.length).toBe(1);
			expect(oResponseObject.body.referencesdata.CALCULATIONS.length).toBe(1);
			expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS.length).toBe(1);
			expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
			expect(oResponseObject.body.referencesdata.MASTERDATA.COSTING_SHEET_ENTITIES.length).toBe(1);
			expect(oResponseObject.body.referencesdata.MASTERDATA.COMPONENT_SPLIT_ENTITIES.length).toBe(1);
			    
		});

		it('should return the updated referenced version with IS_ACTIVE disabled (referenced is last child) - all items should return with IS_ACTIVE 0', function() {
			//arrange
			oMockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
			oMockstar.insertTableData("currency", testData.mCsvFiles.currency);
			oMockstar.insertTableData("uom", testData.mCsvFiles.uom);
			oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
			oMockstar.insertTableData("costing_sheet__text", testData.oCostingSheetTextTestData);
			oMockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
			oMockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
			oMockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
			oMockstar.insertTableData("costing_sheet_overhead", testData.oCostingSheetOverheadTestData);
			oMockstar.insertTableData("component_split", testData.oComponentSplitTest);
			oMockstar.clearTable("itemTemporary");
			
			const oItemTemporaryTestData2 = _.extend(_.clone(oItemTemporaryTestData), {
				REFERENCED_CALCULATION_VERSION_ID : [null, null, 5809]
			});
			oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData2);
			const aRequestItems = [{
				ITEM_ID: testData.oItemTestData.ITEM_ID[2],		
				CALCULATION_VERSION_ID: testData.oItemTestData.CALCULATION_VERSION_ID[1],	
				REFERENCED_CALCULATION_VERSION_ID: 5809,
				IS_ACTIVE: 0
			}];

			//act
			new Dispatcher(oCtx, prepareRequest(aRequestItems), oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.body.transactionaldata[0].IS_ACTIVE).toBe(0);
			expect(oResponseObject.body.transactionaldata[1].IS_ACTIVE).toBe(0);
			expect(oResponseObject.body.transactionaldata[2].IS_ACTIVE).toBe(0);
			expect(oResponseObject.body.transactionaldata.length).toBe(3);
		});

		it('should return the updated referenced version with IS_ACTIVE (referenced has items on the same level) - Only the referenced should change IS_ACTIVE', function() {
			//arrange
			oMockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
			oMockstar.insertTableData("currency", testData.mCsvFiles.currency);
			oMockstar.insertTableData("uom", testData.mCsvFiles.uom);
			oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
			oMockstar.insertTableData("costing_sheet__text", testData.oCostingSheetTextTestData);
			oMockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
			oMockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
			oMockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
			oMockstar.insertTableData("costing_sheet_overhead", testData.oCostingSheetOverheadTestData);
			oMockstar.insertTableData("component_split", testData.oComponentSplitTest);
			oMockstar.clearTable("itemTemporary");
			
			const oItemTemporaryTestData2 = _.extend(_.clone(oItemTemporaryTestData), {
				PARENT_ITEM_ID: [null, 3001, 3001],
				REFERENCED_CALCULATION_VERSION_ID: [null, null, 5809]
			});
			oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData2);
			const aRequestItems = [{
				ITEM_ID: testData.oItemTestData.ITEM_ID[2],		
				CALCULATION_VERSION_ID: testData.oItemTestData.CALCULATION_VERSION_ID[1],	
				REFERENCED_CALCULATION_VERSION_ID: 5809,
				IS_ACTIVE: 0
			}];

			//act
			new Dispatcher(oCtx, prepareRequest(aRequestItems), oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			const oDatabaseItemsResult = oMockstar.execQuery(`select IS_ACTIVE from {{itemTemporary}} where ITEM_ID <> ${testData.oItemTestData.ITEM_ID[2]}`);
			expect(oResponseObject.body.transactionaldata[0].IS_ACTIVE).toBe(0);
			expect(oDatabaseItemsResult.columns.IS_ACTIVE.rows[0]).toBe(1);
			expect(oDatabaseItemsResult.columns.IS_ACTIVE.rows[1]).toBe(1);
			expect(oResponseObject.body.transactionaldata.length).toBe(1);
		});

		it('should return the updated referenced version with IS_ACTIVE (referenced has another reference on the same level) - Only the requested referenced should change IS_ACTIVE', function() {
			//arrange
			oMockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
			oMockstar.insertTableData("currency", testData.mCsvFiles.currency);
			oMockstar.insertTableData("uom", testData.mCsvFiles.uom);
			oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
			oMockstar.insertTableData("costing_sheet__text", testData.oCostingSheetTextTestData);
			oMockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
			oMockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
			oMockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
			oMockstar.insertTableData("costing_sheet_overhead", testData.oCostingSheetOverheadTestData);
			oMockstar.insertTableData("component_split", testData.oComponentSplitTest);
			oMockstar.clearTable("itemTemporary");
			
			const oItemTemporaryTestData2 = _.extend(_.clone(oItemTemporaryTestData), {
				PARENT_ITEM_ID: [null, 3001, 3001],
				REFERENCED_CALCULATION_VERSION_ID: [null, 5809, 5809]
			});
			oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData2);
			const aRequestItems = [{
				ITEM_ID: testData.oItemTestData.ITEM_ID[2],		
				CALCULATION_VERSION_ID: testData.oItemTestData.CALCULATION_VERSION_ID[1],	
				REFERENCED_CALCULATION_VERSION_ID: 5809,
				IS_ACTIVE: 0
			}];

			//act
			new Dispatcher(oCtx, prepareRequest(aRequestItems), oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			const oDatabaseItemsResult = oMockstar.execQuery(`select IS_ACTIVE from {{itemTemporary}} where ITEM_ID <> ${testData.oItemTestData.ITEM_ID[2]}`);
			expect(oResponseObject.body.transactionaldata[0].IS_ACTIVE).toBe(0);
			expect(oDatabaseItemsResult.columns.IS_ACTIVE.rows[0]).toBe(1);
			expect(oDatabaseItemsResult.columns.IS_ACTIVE.rows[1]).toBe(1);
			expect(oResponseObject.body.transactionaldata.length).toBe(1);
		});
		
		it('should not update a reference calculation item if the user does not have the instance-based READ privilege for the referenced version', function() {

			//arrange
			//remove all instance-based privileges
			oMockstar.clearTable("authorization");
			//add privilege for current version (project PR1), but not for referenced version (PR3)
            enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], testData.sTestUser, AuthorizationManager.Privileges.ADMINISTRATE);

			//generate new test data 
			var oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedCalcVer(jasmine.plcTestRunParameters.generatedFields);
			
			var oRequestItem = {
					ITEM_ID : oBuiltTestData.ItemMasterTempTestData.ITEM_ID[1],		//3002
					CALCULATION_VERSION_ID : oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[0],	//2809
					ITEM_CATEGORY_ID : constants.ItemCategory.ReferencedVersion, 	// = 10 
					REFERENCED_CALCULATION_VERSION_ID : oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[2]	//5809 belongs to project PR3
			};

			//act
			new Dispatcher(oCtx, prepareRequest([ oRequestItem ]), oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
			expect(oDefaultResponseMock.status).toBe($.net.http.FORBIDDEN);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_ACCESS_DENIED.code);
		});
		
		it('should update an item and return a compressed result', function(){
		    	// arrange
			var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
			var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
			var oldItems = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + oItemTemporaryTestData.ITEM_ID[0] + " or item_id="
					+ oItemTemporaryTestData.ITEM_ID[1]);

			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					ITEM_DESCRIPTION : 'MODIFIED TEST ITEM',
					DOCUMENT_TYPE_ID : null
			};

			var oModifiedTestItem2 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : 5,
					CHILD_ITEM_CATEGORY_ID: 5
			};
			
			var aItemsToModify = [oModifiedTestItem1 , oModifiedTestItem2];
			//try
			
		var oCalculateParameter = ServiceParameters.calculate;
		var oCompressedResultParameter = ServiceParameters.compressedResult;

			var oRequest = {
					queryPath : "items",
					method : $.net.http.PUT,
					parameters : [ {
				name : oCalculateParameter.name,
				value : "false"
			}, {
			    name:  oCompressedResultParameter.name,
			    value : "true"
			}],
					body : {
						asString : function() {
							return JSON.stringify(aItemsToModify);
						}
					}
			};
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			// HTTP body and status have been set
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			result = oMockstar.execQuery("select count(*) from {{itemTemporary}}");
			expect(result).toBeDefined();
			var expectedResultJsonData = {
					'COUNT(*)' : [ iOriginalItemCount ]
			};
			expect(result).toMatchData(expectedResultJsonData, [ 'COUNT(*)' ]);

			var newItems = oMockstar.execQuery(`select * from {{itemTemporary}} where item_id= ${oModifiedTestItem1.ITEM_ID} or item_id= ${oModifiedTestItem2.ITEM_ID} order by item_id`);

			// STATUS and QUANTITY must be different after the update
			expect(newItems).not.toMatchData(oldItems, [ "ITEM_ID" ]);
			expect(newItems.columns.ITEM_DESCRIPTION.rows[0]).toBe(oModifiedTestItem1.ITEM_DESCRIPTION);
			expect(newItems.columns.ITEM_CATEGORY_ID.rows[1]).toBe(oModifiedTestItem2.ITEM_CATEGORY_ID);

            // should return null for DOCUMENT_TYPE_ID as 'XXX' does not exist in masterdata
            expect(newItems.columns.DOCUMENT_TYPE_ID.rows[0]).toBe(null);
            
			expect(newItems.columns.IS_DELETED.rows[0]).toEqual(0);
			expect(newItems.columns.IS_DIRTY.rows[0]).toEqual(1);

			expect(newItems.columns.IS_DELETED.rows[1]).toEqual(0);
			expect(newItems.columns.IS_DIRTY.rows[1]).toEqual(1);
			
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oResponseBodyTransactional = oResponseObject.body.transactionaldata[0];
				
			var oFields = _.pick(oResponseBodyTransactional, ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'ITEM_CATEGORY_ID']);
			    
	                
			expect(oFields).toMatchData(
					   {'ITEM_ID': [3002, 3003],
						'PARENT_ITEM_ID': [3001, 3002],
						'PREDECESSOR_ITEM_ID': [3001, 3002],
						'ITEM_CATEGORY_ID': [1, 5]}, ['ITEM_ID']);
		});
		
		it("should return an empty array for transactionaldata if omitItems is set to true", function() {

			// arrange
			var oModifiedTestItem1 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[1],
					ITEM_DESCRIPTION : 'MODIFIED TEST ITEM',
					DOCUMENT_TYPE_ID : null
			};

			var oModifiedTestItem2 = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : 5,
					CHILD_ITEM_CATEGORY_ID: 5
			};
			
			// set omitItems to true
			params[1].value = true;

			// act
			new Dispatcher(oCtx, prepareRequest([ oModifiedTestItem1, oModifiedTestItem2 ]), oResponseStub).dispatch();

			// assert
			expect(oResponseStub.status).toBe($.net.http.OK);

			const oResponseBody = oResponseStub.getParsedBody();
			expect(oResponseBody.body.transactionaldata).toEqual(emptyArray);
        });
        
        describe("handling for _IS_MANUAL fields", () => {

            let oChildToUpdate = null;
            let oAssemblyToUpdate = null;

            beforeEach(() => {
                oAssemblyToUpdate = {
                    ITEM_ID: 3002,
                    CALCULATION_VERSION_ID: iCvId
                };
                oChildToUpdate = {
                    ITEM_ID: 3003,
                    CALCULATION_VERSION_ID: iCvId,
        
                };

                oMockstar.clearTable("itemTemporary");
                oMockstar.insertTableData("itemTemporary", testData.oItemTemporaryTestData);
            });

            const checkIsManualFlagsForStandardFieldsAssembly = function() {
                checkIsManualFlags(oAssemblyToUpdate.ITEM_ID, {
                    // expects for assembly item:
                    // for fields with no roll-up defined; values must be entered manually (IS_MANUAL must be 1)
                    BASE_QUANTITY_IS_MANUAL: 1,
                    LOT_SIZE_IS_MANUAL: 1,
                    TARGET_COST_IS_MANUAL: 1,
                    QUANTITY_IS_MANUAL: 1,

                    // for the fields below, a roll-up is defined; values must NOT be entered manually, since the 
                    // values are calculated (IS_MANUAL must be 0)
                    PRICE_UNIT_IS_MANUAL: 0,
                    PRICE_VARIABLE_PORTION_IS_MANUAL: 0,
                    PRICE_FIXED_PORTION_IS_MANUAL: 0,
                });
            };

            const checkIsManualFlagsForStandardFieldsLeaf = function () {
                checkIsManualFlags(oChildToUpdate.ITEM_ID, {
                    // expects for leaf item:
                    // since for no field a formula is defined, all values must be entered manually (IS_MANUAL must be 1);
                    // for leaf items it does not matter if a roll-up is defined
                    BASE_QUANTITY_IS_MANUAL: 1,
                    LOT_SIZE_IS_MANUAL: 1,
                    TARGET_COST_IS_MANUAL: 1,
                    QUANTITY_IS_MANUAL: 1,
                    PRICE_UNIT_IS_MANUAL: 1,
                    PRICE_VARIABLE_PORTION_IS_MANUAL: 1,
                    PRICE_FIXED_PORTION_IS_MANUAL: 1,
                });
            };

            it("should initialize *_IS_MANUAL fields of standard fields if the category is changed for assembly item", () => {             
                // arrange
                oAssemblyToUpdate.ITEM_CATEGORY_ID = 2;

                // act
                new Dispatcher(oCtx, prepareRequest([oAssemblyToUpdate]), oResponseStub).dispatch();

                // assert
                checkIsManualFlagsForStandardFieldsAssembly();
            });
            
            [null, 1, 0].forEach(vClientValue => {
                it(`should set _IS_MANUAL flag correctly for standard fields regardless if request sets them to ${vClientValue} for assembly item`, () => {
                    // in this test the client sends the values for *_IS_MANUAL fields of standard fields; the tested values contain correct and incorrect values;
                    // since the expected result is the same, both cases are handled in this test

                    // arrange
                    for (let sIsManualField of constants.mapStandardFieldsWithFormulas.values()) {
                        oAssemblyToUpdate[sIsManualField] = vClientValue;
                    }

                    // act
                    new Dispatcher(oCtx, prepareRequest([oAssemblyToUpdate]), oResponseStub).dispatch();

                    // assert
                    checkIsManualFlagsForStandardFieldsAssembly();
                });
            });

            it("should initialize *_IS_MANUAL fields of standard fields if the category is changed for leaf item", () => {
                // arrange
                oChildToUpdate.ITEM_CATEGORY_ID = 2;
                
                // act
                new Dispatcher(oCtx, prepareRequest([oChildToUpdate]), oResponseStub).dispatch();

                // assert
                checkIsManualFlagsForStandardFieldsLeaf();
            });

            [null, 1, 0].forEach(vClientValue => {
                it(`should set _IS_MANUAL flag correctly for standard fields regardless if request sets them to ${vClientValue} for leaf item`, () => {
                    // in this test the client sends the values for *_IS_MANUAL fields of standard fields; the tested values contain correct and incorrect values;
                    // since the expected result is the same, both cases are handled in this test

                    // arrange
                    for (let sIsManualField of constants.mapStandardFieldsWithFormulas.values()) {
                        oChildToUpdate[sIsManualField] = vClientValue;
                    }

                    // act
                    new Dispatcher(oCtx, prepareRequest([oChildToUpdate]), oResponseStub).dispatch();

                    // assert
                    checkIsManualFlagsForStandardFieldsLeaf();
                });
            });

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                
                describe("_IS_MANUAL handling for custom fields and formulas", () => {
                    beforeEach(() => {
                        oMockstar.execSingle(`delete from {{metadata}} where is_custom = 1 and column_id like 'CUST__%' escape '_'`)
                        oMockstar.execSingle(`delete from {{metadata_item_attributes}} where (path, business_object, column_id) not in 
                                                                        (select path, business_object, column_id from {{metadata}} where is_custom = 0)`)
                        oMockstar.insertTableData("metadata", oMetadataIsManualData);

                        oMockstar.insertTableData("metadata_item_attributes", oMetadataItemAttributesIsManualData);

                        oMockstar.clearTable("formula");
                        oMockstar.insertTableData("formula", oFormulaIsManualData);

                        const oItemsInDifferentCategory = new TestDataUtility(testData.oItemTemporaryTestData)
						.replaceValue("ITEM_CATEGORY_ID", testData.oItemTemporaryTestData.ITEM_ID.map(() => 1))
						.replaceValue("PRICE_UNIT_IS_MANUAL", testData.oItemTemporaryTestData.ITEM_ID.map(id => 0))
						.replaceValue("LOT_SIZE_IS_MANUAL", testData.oItemTemporaryTestData.ITEM_ID.map(id => 0))
						.build();
                        oMockstar.clearTable("itemTemporary");
                        oMockstar.insertTableData("itemTemporary", oItemsInDifferentCategory);
                    });

                    const checkIsManualFlagsDefaultAssembly = function () {
                        checkIsManualFlags(oAssemblyToUpdate.ITEM_ID, {
                            PRICE_UNIT_IS_MANUAL: 0,
                            LOT_SIZE_IS_MANUAL: 0,
                        });
                        checkIsManualFlags(oAssemblyToUpdate.ITEM_ID, {
                            // expects for assembly item:
                            // CUST_INT_FORMULA and CUST_STRING_FORMULA have a formula defined => default value 0 is expected
                            CUST_INT_FORMULA_IS_MANUAL: 0,
                            CUST_STRING_FORMULA_IS_MANUAL: 0,

                            // CUST_INT_WITHOUT_REF has a roll-up defined => value 0 is expected for assemblies
                            CUST_INT_WITHOUT_REF_IS_MANUAL: 0,

                            // CUST_STRING has neither roll-up nor formula => value 1 is expected
                            CUST_STRING_IS_MANUAL: 1
                        }, true);

                    };

                    const checkIsManualFlagsDefaultLeaf = function(){
                        checkIsManualFlags(oChildToUpdate.ITEM_ID, {
                            PRICE_UNIT_IS_MANUAL: 0,
                            LOT_SIZE_IS_MANUAL: 0,
                        });
                        checkIsManualFlags(oChildToUpdate.ITEM_ID, {
                            // expects for leaf item:
                            // CUST_INT_FORMULA and CUST_STRING_FORMULA have a formula defined => default value 0 is expected
                            CUST_INT_FORMULA_IS_MANUAL: 0,
                            CUST_STRING_FORMULA_IS_MANUAL: 0,

                            // CUST_INT_WITHOUT_REF has a roll-up defined => value 1 is expected for leafs
                            CUST_INT_WITHOUT_REF_IS_MANUAL: 1,

                            // CUST_STRING has neither roll-up nor formula => value 1 is expected
                            CUST_STRING_IS_MANUAL: 1
                        }, true);
                    };

                    it("should initialize *_IS_MANUAL fields of custom fields and standard fields with formula if they are not part of the request for assembly item", () => {
                        // arrange
                        const oItemsInDifferentCategory = new TestDataUtility(testData.oItemTemporaryTestData)
                            .replaceValue("ITEM_CATEGORY_ID", testData.oItemTemporaryTestData.ITEM_ID.map(() => 2))
                            .build();
                        oMockstar.clearTable("itemTemporary");
                        oMockstar.insertTableData("itemTemporary", oItemsInDifferentCategory);
                        oAssemblyToUpdate.ITEM_CATEGORY_ID = 1;
						oAssemblyToUpdate.CHILD_ITEM_CATEGORY_ID = 1;

                        // act
                        new Dispatcher(oCtx, prepareRequest([oAssemblyToUpdate]), oResponseStub).dispatch();

                        // assert
                        checkIsManualFlagsDefaultAssembly(oResponseStub);
                    });

                    it("should initialize *_IS_MANUAL fields of custom fields and standard fields with formula if they are not part of the request for leaf item", () => {
                        // arrange
                        const oItemsInDifferentCategory = new TestDataUtility(testData.oItemTemporaryTestData)
                            .replaceValue("ITEM_CATEGORY_ID", testData.oItemTemporaryTestData.ITEM_ID.map(() => 2))
                            .replaceValue("CHILD_ITEM_CATEGORY_ID", testData.oItemTemporaryTestData.ITEM_ID.map(() => 2))
                            .build();
                        oMockstar.clearTable("itemTemporary");
                        oMockstar.insertTableData("itemTemporary", oItemsInDifferentCategory);
                        oChildToUpdate.ITEM_CATEGORY_ID = 1;
						oChildToUpdate.CHILD_ITEM_CATEGORY_ID = 1;

                        // act
                        new Dispatcher(oCtx, prepareRequest([oChildToUpdate]), oResponseStub).dispatch();

                        // assert
                        checkIsManualFlagsDefaultLeaf(oResponseStub);
                    });

                    it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to null for assembly item", () => {
                        // arrange
                        aUsedIsManualFields.forEach(sFieldName => {
                            oAssemblyToUpdate[sFieldName] = null;
                        });

                        // act
                        new Dispatcher(oCtx, prepareRequest([oAssemblyToUpdate]), oResponseStub).dispatch();

                        // assert
                        checkIsManualFlagsDefaultAssembly(oResponseStub);
                    });

                    it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to null for leaf item", () => {
                        // arrange
                        aUsedIsManualFields.forEach(sFieldName => {
                            oChildToUpdate[sFieldName] = null;
                        });

                        // act
                        new Dispatcher(oCtx, prepareRequest([oChildToUpdate]), oResponseStub).dispatch();

                        // assert
                        checkIsManualFlagsDefaultLeaf(oResponseStub);
                    });

                    it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to 1 for assembly", () => {
                        // arrange
                        aUsedIsManualFields.forEach(sFieldName => {
                            oAssemblyToUpdate[sFieldName] = 1;
                        });

                        // act
                        new Dispatcher(oCtx, prepareRequest([oAssemblyToUpdate]), oResponseStub).dispatch();

                        // assert
                        checkIsManualFlags(oAssemblyToUpdate.ITEM_ID, {
                            // PRICE_UNIT has a roll-up defined => on assembly level are no manual values allowed
                            PRICE_UNIT_IS_MANUAL: 0,
                            // LOT_SIZE has a formula defined, but this can be overridden if clients request it (request contained LOT_SIZE_IS_MANUAL)
                            // request values MUST be preserved
                            LOT_SIZE_IS_MANUAL: 1,
                        });
                        // checking custom fields
                        checkIsManualFlags(oAssemblyToUpdate.ITEM_ID, {
                            // CUST_INT_FORMULA and CUST_INT_WITHOUT_REF have roll-up; no manual values for assemblies
                            CUST_INT_FORMULA_IS_MANUAL: 0,
                            CUST_INT_WITHOUT_REF_IS_MANUAL: 0,

                            // request values must be preserved
                            CUST_STRING_FORMULA_IS_MANUAL: 1,
                            CUST_STRING_IS_MANUAL: 1
                        }, true);
                    });


                    it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to 1 for leaf", () => {
                        // arrange
                        aUsedIsManualFields.forEach(sFieldName => {
                            oChildToUpdate[sFieldName] = 1;
                        });

                        // act
                        new Dispatcher(oCtx, prepareRequest([oChildToUpdate]), oResponseStub).dispatch();

                        // assert
                        checkIsManualFlags(oChildToUpdate.ITEM_ID, {
                            // roll-up of PRICE_UNIT has no effect on leaf level; request values MUST be preserved
                            PRICE_UNIT_IS_MANUAL: 1,
                            LOT_SIZE_IS_MANUAL: 1,
                        });
                        // checking custom fields
                        checkIsManualFlags(oChildToUpdate.ITEM_ID, {
                            // request values must be preserved
                            CUST_INT_FORMULA_IS_MANUAL: 1,
                            CUST_STRING_FORMULA_IS_MANUAL: 1,
                            CUST_INT_WITHOUT_REF_IS_MANUAL: 1,
                            CUST_STRING_IS_MANUAL: 1
                        }, true);
                    });

                    it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to 0 for assembly", () => {
                        // arrange
                        aUsedIsManualFields.forEach(sFieldName => {
                            oAssemblyToUpdate[sFieldName] = 0;
                        });

                        // act
                        new Dispatcher(oCtx, prepareRequest([oAssemblyToUpdate]), oResponseStub).dispatch();

                        // assert
                        checkIsManualFlags(oAssemblyToUpdate.ITEM_ID, {
                            PRICE_UNIT_IS_MANUAL: 0,
                            LOT_SIZE_IS_MANUAL: 0,
                        });

                        checkIsManualFlags(oAssemblyToUpdate.ITEM_ID, {
                            CUST_INT_FORMULA_IS_MANUAL: 0,
                            CUST_INT_WITHOUT_REF_IS_MANUAL: 0,
                            CUST_STRING_FORMULA_IS_MANUAL: 0,
                            // CUST_STRING has no formula and no roll-up, for this reason 0 is not possible for _IS_MANUAL, even the request contains it that way
                            CUST_STRING_IS_MANUAL: 1
                        }, true);
                    });

                    it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to 0 for leaf", () => {
                        // arrange
                        aUsedIsManualFields.forEach(sFieldName => {
                            oChildToUpdate[sFieldName] = 0;
                        });

                        // act
                        new Dispatcher(oCtx, prepareRequest([oChildToUpdate]), oResponseStub).dispatch();

                        // assert
                        checkIsManualFlags(oChildToUpdate.ITEM_ID, {
                                PRICE_UNIT_IS_MANUAL: 0,
                                LOT_SIZE_IS_MANUAL: 0,
                            });

                        checkIsManualFlags(oChildToUpdate.ITEM_ID, {
                            CUST_INT_FORMULA_IS_MANUAL: 0,
                            CUST_STRING_FORMULA_IS_MANUAL: 0,
                            // CUST_INT_WITHOUT_REF has no formula but a roll-up; on leaf level a manual value is not possible though even the request 
                            // contains it that way
                            CUST_INT_WITHOUT_REF_IS_MANUAL: 1,
                            // CUST_STRING has no formula and no roll-up, for this reason 0 is not possible for _IS_MANUAL, even the request contains it that way
                            CUST_STRING_IS_MANUAL: 1
                        }, true);
                    });
                });
            }
        });

		describe("child item category", function() {
			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.initializeData();
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData);
				oMockstar.insertTableData("openCalculationVersion", testData.oOpenCalculationVersionsTestData);
				oMockstar.insertTableData("calculationVersionTemporary", testData.oCalculationVersionTemporaryTestData);
				oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc);
				
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});

			it('should set child item category correctly if valid', function() {
				// arrange
				var oItemRequest = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : 3,
					CHILD_ITEM_CATEGORY_ID : 3
				};

				if(jasmine.plcTestRunParameters.generatedFields === true){
					oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
					oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
					//"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ]	
					oMockstar.insertTableData("item_ext", testData.oItemExtData); 	
					// we need only "ITEM_ID" : [ 3001, 3002, 3003 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
					oMockstar.insertTableData("itemTemporaryExt", testData.oItemTemporaryExtData); 	
				}
	
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemRequest ]), oResponseStub).dispatch();
	
				// assert
				expect(oResponseStub.status).toBe($.net.http.OK);
			});

			it('should set child item category correctly if exists', function() {
				// arrange
				var oItemRequest = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID : 2,
					CHILD_ITEM_CATEGORY_ID : 31
				};

				if(jasmine.plcTestRunParameters.generatedFields === true){
					oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
					oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
					//"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ]	
					oMockstar.insertTableData("item_ext", testData.oItemExtData); 	
					// we need only "ITEM_ID" : [ 3001, 3002, 3003 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
					oMockstar.insertTableData("itemTemporaryExt", testData.oItemTemporaryExtData); 	
				}

				oMockstar.execSingle(`insert into {{item_category}} (ITEM_CATEGORY_ID, DISPLAY_ORDER, CHILD_ITEM_CATEGORY_ID, ICON, ITEM_CATEGORY_CODE)
										VALUES (2, 31, 31, 'icon31', 'code31');`);
	
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemRequest ]), oResponseStub).dispatch();
	
				// assert
				expect(oResponseStub.status).toBe($.net.http.OK);
			});

			it('should throw general validation error when non-existent child item category is sent', function() {
				// arrange
				var oItemRequest = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					CHILD_ITEM_CATEGORY_ID: 1234
				};
	
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemRequest ]), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});

			it('should throw general validation error when invalid child item category is sent', function() {
				// arrange
				var oItemRequest = {
					ITEM_ID : testData.oItemTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : testData.oItemTestData.CALCULATION_VERSION_ID[2],
					ITEM_CATEGORY_ID: 2,
					CHILD_ITEM_CATEGORY_ID: 3,
				};
	
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemRequest ]), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});
		});
    });

	describe('create item', function() {

		var oModeParemeter = ServiceParameters.mode;
		var oCalculateParameter = ServiceParameters.calculate;
		var oCompressedResultParameter = ServiceParameters.compressedResult;
        
		function prepareRequest(aItems, sMode, bOmitItems, bCompressedResult, bCalculate, noResponseBody) {
			var params = [ {
				name : oModeParemeter.name,
				value : sMode
			}, {
				name : oCalculateParameter.name,
				value : helpers.isNullOrUndefined(bCalculate) ? "false" : bCalculate
			}, {
				name : "omitItems",
				value : bOmitItems
			}, {
			    name:  oCompressedResultParameter.name,
			    value : helpers.isNullOrUndefined(bCompressedResult) ? "false" : bCompressedResult
			}, {
			    name:  "noResponseBody",
			    value : noResponseBody
			}];
			params.get = function(sParameterName) {
				return _.find(params, function(oParam) {
					return oParam.name === sParameterName;
				}).value;
			};
			var oRequest = {
					queryPath : "items",
					method : $.net.http.POST,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify(aItems);
						}
					}
			};
			return oRequest;
		}

		var oItemToCreateTemplate = {
				ITEM_ID : -1,
				CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
				PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
				IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
				ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
				CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
				QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
				QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
				TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
				PRICE_FIXED_PORTION : testData.oItemTemporaryTestData.PRICE_FIXED_PORTION[1],
				PRICE_VARIABLE_PORTION : testData.oItemTemporaryTestData.PRICE_VARIABLE_PORTION[1],
				TRANSACTION_CURRENCY_ID : testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[1],
				PRICE_UNIT : testData.oItemTemporaryTestData.PRICE_UNIT[1],
				PRICE_UNIT_UOM_ID : testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[1],
				ITEM_DESCRIPTION : 'INSERTED TEST ITEM',
				BASE_QUANTITY : 1,
				IS_PRICE_SPLIT_ACTIVE: 0,
				CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1]
		};

		describe("append items to existing parent", function() {

			beforeEach(function() {
			    oResponseStub = new ResponseObjectStub();
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.initializeData();
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData);
				oMockstar.insertTableData("item", testData.oItemTestData);
				oMockstar.insertTableData("openCalculationVersion", testData.oOpenCalculationVersionsTestData);
				oMockstar.insertTableData("calculationVersionTemporary", testData.oCalculationVersionTemporaryTestData);
    				oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
    				oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				
    			if(jasmine.plcTestRunParameters.generatedFields === true){
    				oMockstar.insertTableData("itemTemporaryExt", oItemTemporaryExtTestData);
    			}

				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});

			it('should add a new item and return it when input is valid', function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
				var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3002
				});

				if(jasmine.plcTestRunParameters.generatedFields === true){
				    var resultExt = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
				    var iOriginalItemExtCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				    oItemToCreate.CUST_BOOLEAN_INT_MANUAL = 1;
				}

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				result = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporary}}");
				expect(result).toBeDefined();
				expect(parseInt(result.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemCount + 1);

				if(jasmine.plcTestRunParameters.generatedFields === true){
    				resultExt = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporaryExt}}");
    				expect(resultExt).toBeDefined();
    				expect(parseInt(resultExt.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemExtCount + 1);
				}

				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				// check that there are no couples of items which have the same parent_item_id and
				// predecessor_item_id -> this would be an error
				result = oMockstar.execQuery("select count(*) as duplicate_count from ("
						+ "select parent_item_id, predecessor_item_id, count(*) from {{itemTemporary}}" + " where session_id='" + sSessionId
						+ "' and calculation_version_id=" + oItemTemporaryTestData.CALCULATION_VERSION_ID[0]
						+ " GROUP BY parent_item_id, predecessor_item_id having count(*)>1)");
				expect(result).toBeDefined();
				expect(result).toMatchData({
					'DUPLICATE_COUNT' : [ 0 ]
				}, [ 'DUPLICATE_COUNT' ]);

				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oItemToCreate.CALCULATION_VERSION_ID);
			});
			
			it('should add a new item and return it having a compressed result', function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
				var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3001
				});

				if(jasmine.plcTestRunParameters.generatedFields === true){
				    var resultExt = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
				    var iOriginalItemExtCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				    oItemToCreate.CUST_BOOLEAN_INT_MANUAL = 1;
				}

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, false, true), oDefaultResponseMock).dispatch();

				// assert
				result = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporary}}");
				expect(result).toBeDefined();
				expect(parseInt(result.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemCount + 1);

				if(jasmine.plcTestRunParameters.generatedFields === true){
    				resultExt = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporaryExt}}");
    				expect(resultExt).toBeDefined();
    				expect(parseInt(resultExt.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemExtCount + 1);
				}
                //expect(helpers.isNullOrUndefined(jasmine.plcTestRunParameters.compressedResult)).toBe(false);
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseBodyTransactional = oResponseObject.body.transactionaldata;
				
				var oFields = _.pick(oResponseBodyTransactional[0], ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'ITEM_CATEGORY_ID', 'IS_DISABLING_ACCOUNT_DETERMINATION']);
	            Object.keys(oFields).forEach(key => {
                     oFields[key].splice(1);
                 });
                 
			    expect(oFields).toMatchData(
					   {'ITEM_ID': [3004],
						'PARENT_ITEM_ID': [3001],
						'PREDECESSOR_ITEM_ID': [3001],
						'ITEM_CATEGORY_ID': [1],
					    'IS_DISABLING_ACCOUNT_DETERMINATION': [0]}, ['ITEM_ID']);

				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oItemToCreate.CALCULATION_VERSION_ID);
			});
			
			it('should throw general non temporary masterdata error when invalid master data is sent', function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3001,
					OVERHEAD_GROUP_ID : 'XXX'
				});

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, false, true), oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseBodyTransactional = oResponseObject.body.transactionaldata;
				expect(oResponseObject.head.messages[0].code).toBe(Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
				expect(oResponseObject.head.messages[0].details.invalidNonTemporaryMasterdataObj).toBeDefined();
				expect(oResponseObject.head.messages[0].details.invalidNonTemporaryMasterdataObj[0].columnId).toBe('OVERHEAD_GROUP_ID');
			});
			
			it('should add a new item having parameter calculate set to true and return it having a compressed result', function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
				var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3001
				});

				if(jasmine.plcTestRunParameters.generatedFields === true){
				    var resultExt = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
				    var iOriginalItemExtCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				    oItemToCreate.CUST_BOOLEAN_INT_MANUAL = 1;
				}

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, false, true, true), oDefaultResponseMock).dispatch();

				// assert
				result = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporary}}");
				expect(result).toBeDefined();
				expect(parseInt(result.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemCount + 1);

				if(jasmine.plcTestRunParameters.generatedFields === true){
    				resultExt = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporaryExt}}");
    				expect(parseInt(resultExt.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemExtCount + 1);
				}
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResponseBodyTransactional = oResponseObject.body.transactionaldata;
				
				var oFields = _.pick(oResponseBodyTransactional[0], ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'ITEM_CATEGORY_ID']);
	            Object.keys(oFields).forEach(key => {
                     oFields[key].splice(1);
                 });
                 
			    expect(oFields).toMatchData(
					   {'ITEM_ID': [3004],
						'PARENT_ITEM_ID': [3001],
						'PREDECESSOR_ITEM_ID': [3001],
						'ITEM_CATEGORY_ID': [1]}, ['ITEM_ID']);

				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oItemToCreate.CALCULATION_VERSION_ID);
			});
	
			
			it('should add a new item to a parent that is inactive (the root item is also inactive) and return it having a compressed result', function() {
				// arrange
				oMockstar.clearTable("itemTemporary");
				let oItemTemporaryData = new TestDataUtility(testData.oItemTemporaryTestData).build();
				oItemTemporaryData.IS_ACTIVE = [ 0,0,0,0,0];
				oMockstar.insertTableData("itemTemporary", oItemTemporaryData);
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3003,
					PREDECESSOR_ITEM_ID : 3003
				});

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, false, true), oResponseStub).dispatch();

				// assert
			    expect(oResponseStub.status).toBe($.net.http.CREATED);
				var oResponseBodyTransactional = oResponseStub.getParsedBody();
				var oItems = _.pick(oResponseBodyTransactional.body.transactionaldata[0], ['ITEM_ID','CALCULATION_VERSION_ID','PARENT_ITEM_ID','PREDECESSOR_ITEM_ID','ITEM_CATEGORY_ID',"HANDLE_ID"]);
	           
			    expect(oItems).toMatchData(
					   {'ITEM_ID': [3001, 3002, 3003, 3004],
					    'CALCULATION_VERSION_ID':[2809, 2809, 2809, 2809],
						'PARENT_ITEM_ID': [null, 3001, 3002, 3003],
						'PREDECESSOR_ITEM_ID': [null, 3001, 3002, 3003],
						'ITEM_CATEGORY_ID': [0, 1, 3, 1],
					    'HANDLE_ID': [null, null, null, -1]   
					   }, ['ITEM_ID', 'CALCULATION_VERSION_ID']);
			});
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				it('should add a new item together with the custom field for masterdata and return it when input is valid', function() {
					// arrange
					var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
					var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
					var resultExt = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
					var iOriginalItemExtCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
					var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
						PARENT_ITEM_ID : 3002,
						CWCE_DECIMAL_MANUAL : '66'
					});
					oItemToCreate.ITEM_CATEGORY_ID = 3; //Internal Activity
					oItemToCreate.CHILD_ITEM_CATEGORY_ID = 3; 
		
					// act
					new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();
	
					// assert
					result = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporary}}");
					expect(result).toBeDefined();
					expect(parseInt(result.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemCount + 1);
	   				resultExt = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporaryExt}}");
	    			expect(resultExt).toBeDefined();
	    			expect(parseInt(resultExt.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemExtCount + 1);
	
					expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
					expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
					
					resultExt = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporaryExt}} where CWCE_DECIMAL_MANUAL = 66");
					expect(parseInt(resultExt.columns.ROWCOUNT.rows[0], 10)).toBe(1);
				});
			}
			it('should add the new item to the global table sent to afl', function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3002
				});

				if(jasmine.plcTestRunParameters.generatedFields === true){
				    var resultExt = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporaryExt}}");
				    var iOriginalItemExtCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				    oItemToCreate.CUST_BOOLEAN_INT_MANUAL = 1;
				}

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items")).toBe(1);
			});
			
			it('should add a new item of type referenced version and set values for fields from the referenced version', function() {
				// arrange
				var result = oMockstar.execQuery("select count(*) as rowcount from {{itemTemporary}}");
				var iOriginalItemCount = parseInt(result.columns.ROWCOUNT.rows[0], 10);
				var oItemToCreate = {
						ITEM_ID : -1,
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
						PARENT_ITEM_ID : 3002,
						PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
						REFERENCED_CALCULATION_VERSION_ID: 5809,
						QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
						IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
						ITEM_CATEGORY_ID : 10,
						PRICE_FIXED_PORTION_IS_MANUAL: 1,
						TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
						ITEM_DESCRIPTION : 'INSERTED TEST ITEM',
						BASE_QUANTITY : 1,
						CHILD_ITEM_CATEGORY_ID : 10
				};
								
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				result = oMockstar.execQuery("select count(*) as rowcount from  {{itemTemporary}}");
		        var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(result).toBeDefined();
				expect(parseInt(result.columns.ROWCOUNT.rows[0], 10)).toBe(iOriginalItemCount + 1);

				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oItemToCreate.CALCULATION_VERSION_ID);
				
				//check that the fields ware set from the referenced version
				var oSourceCalcVer = mockstar_helpers.convertToObject(testData.oCalculationVersionTestData, 2);
				var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(testData.oItemTestData, 4);
				
				expect(oResponseObject.body.transactionaldata[0].QUANTITY_UOM_ID).toBe(oRootItemSourceCalcVer.QUANTITY_UOM_ID);
				expect(oResponseObject.body.transactionaldata[0].PRICE_FIXED_PORTION).toBe(oRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION);
				expect(oResponseObject.body.transactionaldata[0].PRICE_VARIABLE_PORTION).toBe(oRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION);
				expect(oResponseObject.body.transactionaldata[0].PRICE).toBe(oRootItemSourceCalcVer.TOTAL_COST);
				expect(oResponseObject.body.transactionaldata[0].TRANSACTION_CURRENCY_ID).toBe(oSourceCalcVer.REPORT_CURRENCY_ID);
				expect(oResponseObject.body.transactionaldata[0].PRICE_UNIT).toBe(oRootItemSourceCalcVer.TOTAL_QUANTITY);
				expect(oResponseObject.body.transactionaldata[0].PRICE_UNIT_UOM_ID).toBe(oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID);
				expect(oResponseObject.body.transactionaldata[0].PRICE_SOURCE_ID).toBe(oRootItemSourceCalcVer.PRICE_SOURCE_ID);				
			});
			
			it('should return the information about the referenced version if an item of this type is added', function() {
				// arrange
				//add related data for the referenced version 
				oMockstar.insertTableData("project", testData.oProjectCurrencyTestData);
				oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
				oMockstar.insertTableData("component_split", testData.oComponentSplitTest);
				var oItemToCreate = {
						ITEM_ID : -1,
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
						PARENT_ITEM_ID : 3002,
						PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
						REFERENCED_CALCULATION_VERSION_ID: 5809,
						QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
						IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
						ITEM_CATEGORY_ID : 10,
						PRICE_FIXED_PORTION_IS_MANUAL: 1,
						TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
						ITEM_DESCRIPTION : 'INSERTED TEST ITEM',
						BASE_QUANTITY : 1,
						CHILD_ITEM_CATEGORY_ID : 10
				};
								
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert		
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				
				//check that information about the referend version is returned
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.referencesdata.PROJECTS.length).toBe(1);
				expect(oResponseObject.body.referencesdata.CALCULATIONS.length).toBe(1);
				expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS.length).toBe(1);
				expect(oResponseObject.body.referencesdata.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
				expect(oResponseObject.body.referencesdata.MASTERDATA.COSTING_SHEET_ENTITIES.length).toBe(1);
				expect(oResponseObject.body.referencesdata.MASTERDATA.COMPONENT_SPLIT_ENTITIES.length).toBe(1);
			});
			
			it('should return error if the referenced calculation version does not exist', function() {
				// arrange
				var oItemToCreate = {
						ITEM_ID : -1,
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
						PARENT_ITEM_ID : 3002,
						PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
						REFERENCED_CALCULATION_VERSION_ID: 5555,
						QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
						IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
						ITEM_CATEGORY_ID : 10,
						PRICE_FIXED_PORTION_IS_MANUAL: 1,
						TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
						ITEM_DESCRIPTION : 'INSERTED TEST ITEM',
						BASE_QUANTITY : 1,
						CHILD_ITEM_CATEGORY_ID : 10
				};
								
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		    	expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
		    	expect($.trace.error).toHaveBeenCalled();
			});
			
			it('should return error if items are added to a parent of type text or referenced version', function() {
				// arrange
				var oItemToCreate = {
						ITEM_ID : -1,
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
						PARENT_ITEM_ID : 9999,
						PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
						REFERENCED_CALCULATION_VERSION_ID: testData.iSecondVersionId,
						QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
						IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
						ITEM_CATEGORY_ID : 10,
						PRICE_FIXED_PORTION_IS_MANUAL: 1,
						TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
						BASE_QUANTITY : 1,
						CHILD_ITEM_CATEGORY_ID : 10
				};
				
				var oNewItem = mockstar_helpers.convertToObject(testData.oItemTemporaryTestData, 1);
		    	oNewItem.ITEM_ID = 9999;
		    	oNewItem.ITEM_CATEGORY_ID = 10;
		    	oMockstar.insertTableData("itemTemporary", oNewItem);
								
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect($.trace.error).toHaveBeenCalled(); 
			});
			
			it('should not add a new item of type referenced version if the user does not have the instance-based READ privilege for the referenced version', function() {
				// arrange
				var oItemToCreate = { //a valid request item
						ITEM_ID : -1,
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
						PARENT_ITEM_ID : 3002,
						PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
						REFERENCED_CALCULATION_VERSION_ID: 5809, // belongs to project 5078
						QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
						IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
						ITEM_CATEGORY_ID : 10,
						PRICE_FIXED_PORTION_IS_MANUAL: 1,
						TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
						ITEM_DESCRIPTION : 'INSERTED TEST ITEM',
						BASE_QUANTITY : 1,
						CHILD_ITEM_CATEGORY_ID : 10
				};
				//remove users instance based privileges
                oMockstar.clearTable("authorization");
                //add privilege for current version (project PR1), but not for referenced version (PR3)
                enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], testData.sTestUser, AuthorizationManager.Privileges.ADMINISTRATE);
                								
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
		        var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe($.net.http.FORBIDDEN);
				expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_ACCESS_DENIED.code);
				
			});
			
			function createAdditionalItems() {
            	let oAdditionalItemTestData = [];
            	oAdditionalItemTestData[0] = _.extend({}, _.clone(oItemToCreateTemplate), {
            	    SESSION_ID: testData.sSessionId,
            	    ITEM_ID: 8000,
            	    ITEM_CATEGORY_ID: 2,
            	    PARENT_ITEM_ID : 3002,
            	    CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
            	    BUSINESS_AREA_ID: 'B3',
            		PROCESS_ID: 'B2',
            		COMPANY_CODE_ID: "CC2",
            		MATERIAL_ID: "MAT6",
            		MATERIAL_GROUP_ID: "MG3",
            		CREATED_ON: testData.sExpectedDate,
            	    CREATED_BY: testData.sTestUser,
            	    LAST_MODIFIED_ON: testData.sExpectedDate,
            	    LAST_MODIFIED_BY: testData.sTestUser
            	});
            
            	oAdditionalItemTestData[1] = _.extend({}, _.clone(oItemToCreateTemplate), {
            	    ITEM_ID: 8001,
            	    SESSION_ID: testData.sSessionId,
            		ITEM_CATEGORY_ID: 2,
            		PARENT_ITEM_ID : 3002,
            		BUSINESS_AREA_ID: 'B1',
            		PROCESS_ID: 'B1',
            	    COMPANY_CODE_ID: "CC3",
            		MATERIAL_GROUP_ID: "MG2",
            		MATERIAL_ID: "MAT4",
            	    CREATED_ON: testData.sExpectedDate,
            	    CREATED_BY: testData.sTestUser,
            	    LAST_MODIFIED_ON: testData.sExpectedDate,
            	    LAST_MODIFIED_BY: testData.sTestUser
            	});

            	return oAdditionalItemTestData;
            };
            
			it("should contain master if request contains a masterdata reference", function() {
				// arrange
				oMockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				oMockstar.insertTableData("business_area", testData.oBusinessAreaTestDataPlc);
                // add some other items in order to test that only the masterdata corresponding to the created item is returned
				oMockstar.insertTableData("itemTemporary", createAdditionalItems());
	
				const oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
				    ITEM_CATEGORY_ID: 2,
					CHILD_ITEM_CATEGORY_ID: 2,
					PARENT_ITEM_ID : 3002,
				    BUSINESS_AREA_ID: 'B5',
            		COMPANY_CODE_ID: "CC2",
                    MATERIAL_ID: "MAT1",
					PLANT_ID: "PL3"
				});
				const oRequest = prepareRequest([ oItemToCreate ], oModeParemeter.values.normal);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				const oResponseMasterData = oResponseObject.body.masterdata;
				// Test if some properties of the master data are set. The detailed check of the delivered master data should be made in corresponding persistency* method
				// Test if only the needed masterdata values are returned, but not the whole masterdata corresponding to the calculation version
				expect(oResponseMasterData).toBeDefined();
                const bBusinessAreaContained = _.some(oResponseMasterData.BUSINESS_AREA_ENTITIES, oBusinessAreaContained => oBusinessAreaContained.BUSINESS_AREA_ID == oItemToCreate.BUSINESS_AREA_ID);
                expect(bBusinessAreaContained).toBe(true);
                expect(oResponseMasterData.BUSINESS_AREA_ENTITIES.length).toBe(1);
                const bCompanyCodeContained = _.some(oResponseMasterData.COMPANY_CODE_ENTITIES, oCompanyCodeContained => oCompanyCodeContained.COMPANY_CODE_ID == oItemToCreate.COMPANY_CODE_ID);
                expect(bCompanyCodeContained).toBe(true);
                expect(oResponseMasterData.COMPANY_CODE_ENTITIES.length).toBe(1);
                const bMaterialCotnained = _.some(oResponseMasterData.MATERIAL_ENTITIES, oContainedMaterial => oContainedMaterial.MATERIAL_ID == oItemToCreate.MATERIAL_ID);
                expect(bMaterialCotnained).toBe(true);
                expect(oResponseMasterData.MATERIAL_ENTITIES.length).toBe(1);
                const bPlantContained = _.some(oResponseMasterData.PLANT_ENTITIES, oPlantContained => oPlantContained.PLANT_ID == oItemToCreate.PLANT_ID);
                expect(bPlantContained).toBe(true);
                expect(oResponseMasterData.PLANT_ENTITIES.length).toBe(1);
                expect(oResponseMasterData.PROCESS_ENTITIES.length).toBe(0);
			});
			
			it("should return LAST_MODIFIED_ON in UTC after successful update request", function(){
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3002
				});
				var dStart = new Date();

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(helpers.isPlainObject(oResponseObject)).toBe(true);

				var dEnd = new Date();
				jasmine.log("Checking if LAST_MODIFIED_ON is in UTC");
				var dLastModified = new Date(Date.parse(oResponseObject.body.transactionaldata[0].LAST_MODIFIED_ON));
				test_helpers.checkDateIsBetween(dLastModified, dStart, dEnd);

				jasmine.log("Checking if CREATED_ON is in UTC");
				var dCreated = new Date(Date.parse(oResponseObject.body.transactionaldata[0].CREATED_ON));
				test_helpers.checkDateIsBetween(dCreated, dStart, dEnd);

				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oItemToCreate.CALCULATION_VERSION_ID);
			});
			
			it("should return set the TARGET_COST_CURRENCY_ID to the REPORTING_CURRENCY_ID of the project", function(){
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3002
				});
				
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(helpers.isPlainObject(oResponseObject)).toBe(true);
				expect(oResponseObject.body.transactionaldata[0].TARGET_COST_CURRENCY_ID).toBe('EUR');	
			});
			
			it("should run value determintion (on example of account determination) for created item", function(){
				// for newly created items the value determintion must be executed to set dependent fields, price, accounts...
				// to ensure this, this tests checks if the account determination was executed for an activity type item (easiest setup)
				// it is assumed, that the other value determination steps are performed as well				
				// arrange
				oMockstar.clearTable("activity_type");
				const oActivityTypeData = new TestDataUtility(testData.oActivityTypeTestDataPlc).getObject(1); // this is AT is still valid (_VALID_TO = null)
				oMockstar.insertTableData("activity_type", oActivityTypeData)
				
				const oItemToCreate = new TestDataUtility(oItemToCreateTemplate).extend( {
					PARENT_ITEM_ID : 3002,
					ITEM_CATEGORY_ID : constants.ItemCategory.InternalActivity,
					CHILD_ITEM_CATEGORY_ID : constants.ItemCategory.InternalActivity,
					ACTIVITY_TYPE_ID : oActivityTypeData.ACTIVITY_TYPE_ID,
				}).build();
				
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);
				const oCreatedItem = oResponseObject.body.transactionaldata[0];
				expect(oCreatedItem.ACCOUNT_ID).toEqual(oActivityTypeData.ACCOUNT_ID);
				expect(oCreatedItem.DETERMINED_ACCOUNT_ID).toEqual(oActivityTypeData.ACCOUNT_ID);
			});

			it('should set parent hierachy to active after an item was added as child to an inactive parent', function() {
				// arrange
				oMockstar.clearTable("itemTemporary");
				var oInactiveParents = JSON.parse(JSON.stringify(oItemTemporaryTestData));
				var aDeactivatedItemIds = [];
				for (var i = 0; i < oInactiveParents.IS_ACTIVE.length; i++) {
					// set the all items of the test item hierarchy to inactive, except the root item
					if (oInactiveParents.PARENT_ITEM_ID[i] !== null) {
						oInactiveParents.IS_ACTIVE[i] = 0;
						aDeactivatedItemIds.push(oInactiveParents.ITEM_ID[i]);
					}
				}
				oMockstar.insertTableData("itemTemporary", oInactiveParents);

				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3003
				});

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				checkCalculationVersionSetDirty(true, oDefaultResponseMock, oItemToCreate.CALCULATION_VERSION_ID);

				var aItems = getItemsFromResponse(oDefaultResponseMock);
				_.each(aDeactivatedItemIds, function(iDeactivatedItemId) {
					var oResponseItem = getItem(aItems, iDeactivatedItemId);
					expect(oResponseItem).toBeDefined();
					jasmine.log(`Checking if item with id ${iDeactivatedItemId} was activated: expected IS_ACITIVE == ${1}, actual IS_ACTIVE == ${oResponseItem.IS_ACTIVE}`);
					expect(oResponseItem.IS_ACTIVE).toEqual(1);
				});
			});
			
			it('should add a new item (with one inactive sub-item + one active sub-item) and return it in case of a copy-paste operation in the same calculation version', function() {
				// arrange
				//IS_ACTIVE = 1
				var oParentItemToCreate = {
        				ITEM_ID : -1,
        				CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
        				IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1], //1
        				ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
        			    QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
				        QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
			            TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
        				ITEM_DESCRIPTION : 'INSERTED Parent TEST ITEM',
        				PARENT_ITEM_ID : 3001,
        				PREDECESSOR_ITEM_ID : null,
						BASE_QUANTITY: 1,
						IS_PRICE_SPLIT_ACTIVE: 0,
						CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1]
        		};
				
				//IS_ACTIVE = 1
				var oSubItemActiveToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : oParentItemToCreate.ITEM_ID
				});
				oSubItemActiveToCreate.PREDECESSOR_ITEM_ID = null;
				oSubItemActiveToCreate.ITEM_ID = -2;
				oSubItemActiveToCreate.ITEM_DESCRIPTION = "Inserted (one) active sub-item"
				
				//IS_ACTIVE = 0
				var oSubItemInActiveToCreate = _.extend(_.clone(oSubItemActiveToCreate), {
					PARENT_ITEM_ID : oParentItemToCreate.ITEM_ID
				});
				oSubItemInActiveToCreate.PREDECESSOR_ITEM_ID = -2;
				oSubItemInActiveToCreate.ITEM_ID = -3;
				oSubItemInActiveToCreate.ITEM_DESCRIPTION = "Inserted (one) in-active sub-item"
					oSubItemInActiveToCreate.IS_ACTIVE = 0;
				
				// act
				//copy-paste in same calculation version
				new Dispatcher(oCtx, prepareRequest([ oParentItemToCreate, oSubItemActiveToCreate, oSubItemInActiveToCreate ], oModeParemeter.values.noUpdateMasterDataAndPrices), oDefaultResponseMock).dispatch();

				// assert
				var aItems = getItemsFromResponse(oDefaultResponseMock);
				expect(aItems.length).toEqual(3);	//3 items added
				
				//find the in-active item - should be only one
				var aNewSubItemInActive = _.filter(aItems, function(oItemCandidate) { return oItemCandidate.IS_ACTIVE === 0; });
				expect(aNewSubItemInActive.length).toEqual(1);
				//check if this is the one in-active inserted item
				expect(aNewSubItemInActive[0]).toBeDefined();
				expect(aNewSubItemInActive[0].ITEM_DESCRIPTION).toEqual(oSubItemInActiveToCreate.ITEM_DESCRIPTION);
				
				//find the active items - should be only two
				var aNewItemsActive = _.filter(aItems, function(oItemCandidate) { return oItemCandidate.IS_ACTIVE === 1; });
				expect(aNewItemsActive.length).toEqual(2);
				//check if the active items are the correct ones
				for (var index = 0; index < aNewItemsActive.length; index++) {
					if (aNewItemsActive[index].PARENT_ITEM_ID === oParentItemToCreate.PARENT_ITEM_ID) {
						expect(aNewItemsActive[index].ITEM_DESCRIPTION).toEqual(oParentItemToCreate.ITEM_DESCRIPTION)
					} else {
						expect(aNewItemsActive[index].ITEM_DESCRIPTION).toEqual(oSubItemActiveToCreate.ITEM_DESCRIPTION)
					}
				}
			});

			it('should return an empty array for transactionaldata if omitItems is set to true', function() {
				//arrange
				var oItemToCreate = {
						ITEM_ID : -1,
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
						IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
						ITEM_CATEGORY_ID : 10,
						PARENT_ITEM_ID : 3002,
						QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
						REFERENCED_CALCULATION_VERSION_ID: 5809,
						BASE_QUANTITY : 1,
						CHILD_ITEM_CATEGORY_ID : 10
				};
								
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, true), oResponseStub).dispatch();

				// assert		
				expect(oResponseStub.status).toBe($.net.http.OK);
				const oResponseBody = oResponseStub.getParsedBody();
				expect(oResponseBody.body.transactionaldata).toEqual(emptyArray);
			});
			
			it('should add a new item and return it with compressed result in case of a copy-paste operation in the same calculation version', function() {
				// arrange
				var oParentItemToCreate = {
        				ITEM_ID : -1,
        				CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
        				IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1], //1
        				ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
        			    QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
				        QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
			            TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
        				ITEM_DESCRIPTION : 'INSERTED Parent TEST ITEM',
        				PARENT_ITEM_ID : 3001,
        				PREDECESSOR_ITEM_ID : null,
						BASE_QUANTITY: 1,
						IS_PRICE_SPLIT_ACTIVE: 0,
						CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1]
        		};
			
				var oSubItemToCreate1 = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : oParentItemToCreate.ITEM_ID
				});
				oSubItemToCreate1.PREDECESSOR_ITEM_ID = null;
				oSubItemToCreate1.ITEM_ID = -2;
				oSubItemToCreate1.ITEM_DESCRIPTION = "Inserted first sub-item"
				
				var oSubItemToCreate2 = _.extend(_.clone(oSubItemToCreate1), {
					PARENT_ITEM_ID : oParentItemToCreate.ITEM_ID
				});
				oSubItemToCreate2.PREDECESSOR_ITEM_ID = null;
				oSubItemToCreate2.ITEM_ID = -3;
				oSubItemToCreate2.ITEM_DESCRIPTION = "Inserted second sub-item"
				
				// act
				//copy-paste in same calculation version
				new Dispatcher(oCtx, prepareRequest([ oParentItemToCreate, oSubItemToCreate1, oSubItemToCreate2 ], oModeParemeter.values.noUpdateMasterDataAndPrices, false, true), oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResonseTransactionalData= oResponseObject.body.transactionaldata[0];
				var oFields = _.pick(oResonseTransactionalData,  ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'ITEM_CATEGORY_ID', 'ITEM_DESCRIPTION', 'IS_DISABLING_ACCOUNT_DETERMINATION']);
				
				expect(oFields).toMatchData(
				     {  'ITEM_ID': [3004, 3005, 3006],
 						'PARENT_ITEM_ID': [3001, 3004, 3004],
 						'PREDECESSOR_ITEM_ID': [null, 3006, 3005],
 						'ITEM_CATEGORY_ID': [1, 1, 1],
						 'ITEM_DESCRIPTION' : ['INSERTED Parent TEST ITEM', "Inserted first sub-item", "Inserted second sub-item" ],
						 'IS_DISABLING_ACCOUNT_DETERMINATION' : [0, 0, 0]
				     }, ['ITEM_ID']);
			});

			it('should add a new item and return it with compressed result in case of a copy-paste operation in the same calculation version with IS_DISABLING_ACCOUNT_DETERMINATION = 1', function() {
				// arrange
				var oParentItemToCreate = {
        				ITEM_ID : -1,
        				CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
        				IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1], //1
        				ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
        			    QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
				        QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
			            TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
        				ITEM_DESCRIPTION : 'INSERTED Parent TEST ITEM',
        				PARENT_ITEM_ID : 3001,
        				PREDECESSOR_ITEM_ID : null,
						BASE_QUANTITY: 1,
						IS_PRICE_SPLIT_ACTIVE: 0,
						IS_DISABLING_ACCOUNT_DETERMINATION: 1,
						CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1]
        		};

				var oSubItemToCreate1 = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : oParentItemToCreate.ITEM_ID
				});
				oSubItemToCreate1.PREDECESSOR_ITEM_ID = null;
				oSubItemToCreate1.ITEM_ID = -2;
				oSubItemToCreate1.ITEM_DESCRIPTION = "Inserted first sub-item"

				var oSubItemToCreate2 = _.extend(_.clone(oSubItemToCreate1), {
					PARENT_ITEM_ID : oParentItemToCreate.ITEM_ID
				});
				oSubItemToCreate2.PREDECESSOR_ITEM_ID = null;
				oSubItemToCreate2.ITEM_ID = -3;
				oSubItemToCreate2.ITEM_DESCRIPTION = "Inserted second sub-item"

				// act
				//copy-paste in same calculation version
				new Dispatcher(oCtx, prepareRequest([ oParentItemToCreate, oSubItemToCreate1, oSubItemToCreate2 ], oModeParemeter.values.noUpdateMasterDataAndPrices, false, true), oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oResonseTransactionalData= oResponseObject.body.transactionaldata[0];
				var oFields = _.pick(oResonseTransactionalData,  ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'ITEM_CATEGORY_ID', 'ITEM_DESCRIPTION', 'IS_DISABLING_ACCOUNT_DETERMINATION']);

				expect(oFields).toMatchData(
				     {  'ITEM_ID': [3004, 3005, 3006],
 						'PARENT_ITEM_ID': [3001, 3004, 3004],
 						'PREDECESSOR_ITEM_ID': [null, 3006, 3005],
 						'ITEM_CATEGORY_ID': [1, 1, 1],
						'ITEM_DESCRIPTION' : ['INSERTED Parent TEST ITEM', "Inserted first sub-item", "Inserted second sub-item" ],
					    'IS_DISABLING_ACCOUNT_DETERMINATION' : [1, 0, 0]
				     }, ['ITEM_ID']);
			});

			it("should add new item with a structure", function() {
				// arrange
			let aItemsToCreate = [
				{
					ITEM_ID : -1,
					PARENT_ITEM_ID: testData.oItemTemporaryTestData.ITEM_ID[1],
					CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
					PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
					IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
					ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
					QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1], 
					QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
					TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1], 
					ITEM_DESCRIPTION : 'INSERTED TEST ITEM 1',
					BASE_QUANTITY : 1,
					IS_PRICE_SPLIT_ACTIVE: 0,
					CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.CHILD_ITEM_CATEGORY_ID[1]
				},
				{
					ITEM_ID : -2,
					PARENT_ITEM_ID: -1,
					CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
					PREDECESSOR_ITEM_ID : -1,
					IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
					ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
					QUANTITY : 10, 
					QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
					TOTAL_QUANTITY_DEPENDS_ON : 2, 
					ITEM_DESCRIPTION : 'INSERTED TEST ITEM 2',
					BASE_QUANTITY : 1,
					IS_PRICE_SPLIT_ACTIVE: 0,
					CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.CHILD_ITEM_CATEGORY_ID[1]
				},
				{
					ITEM_ID : -3,
					PARENT_ITEM_ID: -2,
					CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
					PREDECESSOR_ITEM_ID : -2,
					IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
					ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
					QUANTITY : 5, 
					QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
					TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1], 
					PRICE_FIXED_PORTION : 10,
					PRICE_VARIABLE_PORTION : 5,
					TRANSACTION_CURRENCY_ID : testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[1],
					PRICE_UNIT : testData.oItemTemporaryTestData.PRICE_UNIT[1],
					PRICE_UNIT_UOM_ID : testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[1],
					ITEM_DESCRIPTION : 'INSERTED TEST ITEM 3',
					BASE_QUANTITY : 1,
					IS_PRICE_SPLIT_ACTIVE: 0,
					CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.CHILD_ITEM_CATEGORY_ID[1]
				}		
			]
			
				new Dispatcher(oCtx, prepareRequest(aItemsToCreate, oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
				const aProperties = ['ITEM_ID', 'PARENT_ITEM_ID', 'PREDECESSOR_ITEM_ID', 'TOTAL_QUANTITY_DEPENDS_ON', 'ITEM_DESCRIPTION'];
				let oValues = _.map(aProperties, function(value, key){
					return _.map(aResponseItems, value);
				});
				let oFields = _.zipObject(aProperties, oValues)
				expect(oFields).toMatchData(
					 {  'ITEM_ID': [3006, 3004, 3005],
						 'PARENT_ITEM_ID': [3005, 3002, 3004],
						 'PREDECESSOR_ITEM_ID': [3005, 3001, 3004],
						 'TOTAL_QUANTITY_DEPENDS_ON': [1, 1, 2],
						 'ITEM_DESCRIPTION' : ['INSERTED TEST ITEM 3', "INSERTED TEST ITEM 1", "INSERTED TEST ITEM 2" ]
					 }, ['ITEM_ID']);
			});
		
		it("should throw an error of creating an item with structure not attached to an existing item", function() {
				// arrange
			let aItemsToCreate = [
				{
					ITEM_ID : -1,
					PARENT_ITEM_ID: -2,
					CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
					PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
					IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
					ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
					QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1], 
					QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
					TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1], 
					ITEM_DESCRIPTION : 'INSERTED TEST ITEM 1',
					BASE_QUANTITY : 1
				},
				{
					ITEM_ID : -2,
					PARENT_ITEM_ID: -1,
					CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
					PREDECESSOR_ITEM_ID : -1,
					IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
					ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
					QUANTITY : 10, 
					QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
					TOTAL_QUANTITY_DEPENDS_ON : 2, 
					ITEM_DESCRIPTION : 'INSERTED TEST ITEM 2',
					BASE_QUANTITY : 1
				},
				{
					ITEM_ID : -3,
					PARENT_ITEM_ID: -2,
					CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
					PREDECESSOR_ITEM_ID : -2,
					IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
					ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
					QUANTITY : 5, 
					QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
					TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1], 
					PRICE_FIXED_PORTION : 10,
					PRICE_VARIABLE_PORTION : 5,
					TRANSACTION_CURRENCY_ID : testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[1],
					PRICE_UNIT : testData.oItemTemporaryTestData.PRICE_UNIT[1],
					PRICE_UNIT_UOM_ID : testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[1],
					ITEM_DESCRIPTION : 'INSERTED TEST ITEM 3',
					BASE_QUANTITY : 1
				}		
			]
			
				new Dispatcher(oCtx, prepareRequest(aItemsToCreate, oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect($.trace.error).toHaveBeenCalled();
			});

            describe("handling for _IS_MANUAL fields", () => {
                let oChildToCreate = null;
                let oAssemblyToCreate = null;
                
                beforeEach(() => {                    
                    // preparing the times to create
                    //   3003
                    //		\ 
                    //		-1  <- assembly item
                    //		  \
                    //		   -2 <- leaf item
                    const oBuilder = new TestDataUtility(oItemToCreateTemplate)
                        .replaceValue("PREDECESSOR_ITEM_ID", null)
                        .replaceValue("ITEM_CATEGORY_ID", 1);
                    oChildToCreate = oBuilder
                        .addProperty("PARENT_ITEM_ID", oItemToCreateTemplate.ITEM_ID)
                        .replaceValue("ITEM_ID", -2)
                        .build();
                    oAssemblyToCreate = oBuilder
                        .replaceValue("ITEM_ID", oItemToCreateTemplate.ITEM_ID)
                        .replaceValue("PARENT_ITEM_ID", 3003)
                        // delete properties that are read-only for assemblies
                        .deleteProperty("PRICE_FIXED_PORTION") 
                        .deleteProperty("PRICE_VARIABLE_PORTION")
                        .deleteProperty("TRANSACTION_CURRENCY_ID")
                        .deleteProperty("PRICE_UNIT_UOM_ID")
                        .deleteProperty("PRICE_UNIT")
                        .build();
                });

                const checkIsManualFlagsLocal = function (oResponseStub, oExpectedAssembly, oExpectedLeaf, bUseItemExtTable) {
                    bUseItemExtTable = bUseItemExtTable || false;
                    const oResponse = oResponseStub.getParsedBody();
                    const iAssemblyId = oResponse.body.transactionaldata.find(oItem => oItem.HANDLE_ID === -1).ITEM_ID;
                    const iLeafId = oResponse.body.transactionaldata.find(oItem => oItem.HANDLE_ID === -2).ITEM_ID;

                    checkIsManualFlags(iAssemblyId, oExpectedAssembly, bUseItemExtTable);
                    checkIsManualFlags(iLeafId, oExpectedLeaf, bUseItemExtTable);
                };


                const checkIsManualForStandardFieldsWithoutFormula = function (oResponseStub) {
                    checkIsManualFlagsLocal(oResponseStub, {
                        // expects for assembly item:
                        // for fields with no roll-up defined; values must be entered manually (IS_MANUAL must be 1)
                        BASE_QUANTITY_IS_MANUAL: 1,
                        LOT_SIZE_IS_MANUAL: 1,
                        TARGET_COST_IS_MANUAL: 1,
                        QUANTITY_IS_MANUAL: 1,

                        // for the fields below, a roll-up is defined; values must NOT be entered manually, since the 
                        // values are calculated (IS_MANUAL must be 0)
                        PRICE_UNIT_IS_MANUAL: 0,
                        PRICE_VARIABLE_PORTION_IS_MANUAL: 0,
                        PRICE_FIXED_PORTION_IS_MANUAL: 0,
                    }, {
                            // expects for leaf item:
                            // since for no field a formula is defined, all values must be entered manually (IS_MANUAL must be 1);
                            // for leaf items it does not matter if a roll-up is defined
                            BASE_QUANTITY_IS_MANUAL: 1,
                            LOT_SIZE_IS_MANUAL: 1,
                            TARGET_COST_IS_MANUAL: 1,
                            QUANTITY_IS_MANUAL: 1,
                            PRICE_UNIT_IS_MANUAL: 1,
                            PRICE_VARIABLE_PORTION_IS_MANUAL: 1,
                            PRICE_FIXED_PORTION_IS_MANUAL: 1,
                        });
                };

                it("should initialize *_IS_MANUAL fields of standard fields if they are not part of the request", () => {
                    // in this test the items to create do not contain any values for the *_IS_MANUAL fields; it is expected that the back-end logic correctly 
                    // initializes the fields for standard fields usable in formula with and without a roll-up
                    
                    // act
                    new Dispatcher(oCtx, prepareRequest([oAssemblyToCreate, oChildToCreate], oModeParemeter.values.noUpdateMasterDataAndPrices), oResponseStub).dispatch();

                    // assert
                    checkIsManualForStandardFieldsWithoutFormula(oResponseStub);
                });

                [null, 1, 0].forEach(vClientValue => {
                    it(`should set _IS_MANUAL flag correctly for standard fields regardless if request sets them to ${vClientValue}`, () => {
                        // in this test the client sends the values for *_IS_MANUAL fields of standard fields; the tested values contain correct and incorrect values;
                        // since the expected result is the same, both cases are handled in this test

                        // arrange
                        for (let sIsManualField of constants.mapStandardFieldsWithFormulas.values()) {
                            oChildToCreate[sIsManualField] = vClientValue;
                            oAssemblyToCreate[sIsManualField] = vClientValue;
                        }

                        // act
                        new Dispatcher(oCtx, prepareRequest([oAssemblyToCreate, oChildToCreate], oModeParemeter.values.noUpdateMasterDataAndPrices), oResponseStub).dispatch();

                        // assert
                        checkIsManualForStandardFieldsWithoutFormula(oResponseStub);
                    });
                });

                if (jasmine.plcTestRunParameters.generatedFields === true) {
                   
                    describe("_IS_MANUAL handling for custom fields and formulas", () => {
                        beforeEach(() => {
                            oMockstar.execSingle(`delete from {{metadata}} where is_custom = 1 and column_id like 'CUST__%' escape '_'`)
                            oMockstar.execSingle(`delete from {{metadata_item_attributes}} where (path, business_object, column_id) not in 
                                                                        (select path, business_object, column_id from {{metadata}} where is_custom = 0)`)
                            oMockstar.insertTableData("metadata", oMetadataIsManualData);

                            oMockstar.insertTableData("metadata_item_attributes", oMetadataItemAttributesIsManualData);

                            oMockstar.clearTable("formula");
                            oMockstar.insertTableData("formula", oFormulaIsManualData);
                        });

                        const checkCustomFieldDefaults = function (oResponseStub){
                            // checking standard fields with formulas; PRICE_UNIT has a roll-up, LOT_SIZE has no formula;
                            // since both fields have a formula defined, 0 is the expected default value for IS_MANUAL
                            checkIsManualFlagsLocal(oResponseStub, {
                                PRICE_UNIT_IS_MANUAL: 0,
                                LOT_SIZE_IS_MANUAL: 0,
                            }, {
                                PRICE_UNIT_IS_MANUAL: 0,
                                LOT_SIZE_IS_MANUAL: 0,
                            });
                            // checking custom fields
                            checkIsManualFlagsLocal(oResponseStub, {
                                // expects for assembly item:
                                // CUST_INT_FORMULA and CUST_STRING_FORMULA have a formula defined => default value 0 is expected
                                CUST_INT_FORMULA_IS_MANUAL: 0,
                                CUST_STRING_FORMULA_IS_MANUAL: 0,

                                // CUST_INT_WITHOUT_REF has a roll-up defined => value 0 is expected for assemblies
                                CUST_INT_WITHOUT_REF_IS_MANUAL: 0,

                                // CUST_STRING has neither roll-up nor formula => value 1 is expected
                                CUST_STRING_IS_MANUAL: 1
                            }, {
                                    // expects for leaf item:
                                    // CUST_INT_FORMULA and CUST_STRING_FORMULA have a formula defined => default value 0 is expected
                                    CUST_INT_FORMULA_IS_MANUAL: 0,
                                    CUST_STRING_FORMULA_IS_MANUAL: 0,

                                    // CUST_INT_WITHOUT_REF has a roll-up defined => value 1 is expected for leafs
                                    CUST_INT_WITHOUT_REF_IS_MANUAL: 1,

                                    // CUST_STRING has neither roll-up nor formula => value 1 is expected
                                    CUST_STRING_IS_MANUAL: 1
                                }, true);
                        };

                        it("should initialize *_IS_MANUAL fields of custom fields and standard fields with formula if they are not part of the request", () => {
                            // in this test the items to create do not contain any values for the *_IS_MANUAL fields; it is expected that the back-end logic correctly 
                            // initializes the fields for standard fields usable in formula with and without a roll-up

                            // act
                            new Dispatcher(oCtx, prepareRequest([oAssemblyToCreate, oChildToCreate], oModeParemeter.values.noUpdateMasterDataAndPrices), oResponseStub).dispatch();

                            // assert
                            checkCustomFieldDefaults(oResponseStub);
                        });

                        it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to null", () => {
                            // arrange
                            aUsedIsManualFields.forEach(sFieldName => {
                                oAssemblyToCreate[sFieldName] = null;
                                oChildToCreate[sFieldName] = null;
                            });
                            
                            // act
                            new Dispatcher(oCtx, prepareRequest([oAssemblyToCreate, oChildToCreate], oModeParemeter.values.noUpdateMasterDataAndPrices), oResponseStub).dispatch();

                            //assert
                            checkCustomFieldDefaults(oResponseStub);
                        });

                        it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to 1", () => {
                            // arrange
                            aUsedIsManualFields.forEach(sFieldName => {
                                oAssemblyToCreate[sFieldName] = 1;
                                oChildToCreate[sFieldName] = 1;
                            });

                            // act
                            new Dispatcher(oCtx, prepareRequest([oAssemblyToCreate, oChildToCreate], oModeParemeter.values.noUpdateMasterDataAndPrices), oResponseStub).dispatch();

                            // assert
                            checkIsManualFlagsLocal(oResponseStub, {
                                // PRICE_UNIT has a roll-up defined => on assembly level are no manual values allowed
                                PRICE_UNIT_IS_MANUAL: 0,
                                // LOT_SIZE has a formula defined, but this can be overridden if clients request it (request contained LOT_SIZE_IS_MANUAL)
                                // request values MUST be preserved
                                LOT_SIZE_IS_MANUAL: 1,
                            }, {
                                // roll-up of PRICE_UNIT has no effect on leaf level; request values MUST be preserved
                                PRICE_UNIT_IS_MANUAL: 1,
                                LOT_SIZE_IS_MANUAL: 1,
                            });
                            // checking custom fields
                            checkIsManualFlagsLocal(oResponseStub, {
                                // CUST_INT_FORMULA and CUST_INT_WITHOUT_REF have roll-up; no manual values for assemblies
                                CUST_INT_FORMULA_IS_MANUAL: 0,
                                CUST_INT_WITHOUT_REF_IS_MANUAL: 0,

                                // request values must be preserved
                                CUST_STRING_FORMULA_IS_MANUAL: 1,
                                CUST_STRING_IS_MANUAL: 1
                            }, {
                                // request values must be preserved
                                CUST_INT_FORMULA_IS_MANUAL: 1,
                                CUST_STRING_FORMULA_IS_MANUAL: 1,
                                CUST_INT_WITHOUT_REF_IS_MANUAL: 1,
                                CUST_STRING_IS_MANUAL: 1
                            }, true);
                        });

                        it("should correctly set *_IS_MANUAL fields for custom fields and standard fields with formula if request sets them to 0", () => {
                            // arrange
                            aUsedIsManualFields.forEach(sFieldName => {
                                oAssemblyToCreate[sFieldName] = 0;
                                oChildToCreate[sFieldName] = 0;
                            });

                            // act
                            new Dispatcher(oCtx, prepareRequest([oAssemblyToCreate, oChildToCreate], oModeParemeter.values.noUpdateMasterDataAndPrices), oResponseStub).dispatch();

                            // assert
                            checkIsManualFlagsLocal(oResponseStub, {
                                PRICE_UNIT_IS_MANUAL: 0,
                                LOT_SIZE_IS_MANUAL: 0,
                            }, {
                                PRICE_UNIT_IS_MANUAL: 0,
                                LOT_SIZE_IS_MANUAL: 0,
                            });

                            checkIsManualFlagsLocal(oResponseStub, {
                                CUST_INT_FORMULA_IS_MANUAL: 0,
                                CUST_INT_WITHOUT_REF_IS_MANUAL: 0,
                                CUST_STRING_FORMULA_IS_MANUAL: 0,
                                // CUST_STRING has no formula and no roll-up, for this reason 0 is not possible for _IS_MANUAL, even the request contains it that way
                                CUST_STRING_IS_MANUAL: 1
                            }, {

                                CUST_INT_FORMULA_IS_MANUAL: 0,
                                CUST_STRING_FORMULA_IS_MANUAL: 0,
                                // CUST_INT_WITHOUT_REF has no formula but a roll-up; on leaf level a manual value is not possible though even the request 
                                // contains it that way
                                CUST_INT_WITHOUT_REF_IS_MANUAL: 1,
                                // CUST_STRING has no formula and no roll-up, for this reason 0 is not possible for _IS_MANUAL, even the request contains it that way
                                CUST_STRING_IS_MANUAL: 1
                            }, true);
                        });
                    });
                }
			});
		});

		describe("replace child item and update existing parents", function() {

			// the following item structure is used to test the import functionality against:
			// 			 	   0
			// 		___________|___________
			// 		/ 		/		\	  \
			// 		1 		4 		6 	  10
			// 	   / \ 		| 		|
			// 	   2 3 		5 		7
			// 					   / \
			// 					   8 9
			//
			// different import scenarios are tested, where as each scenario is encapsualted in an own sub-describe

			var oLastYearDate = new Date();
			oLastYearDate.setFullYear(oLastYearDate.getFullYear() - 1);

			var sLastYearDate = oLastYearDate.toJSON();
			var oImportTestData = {
					"SESSION_ID" : [ sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId,
					                 sSessionId ],
					                 "ITEM_ID" : [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
					                 "CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId ],
					                 "PARENT_ITEM_ID" : [ null, 0, 1, 1, 0, 4, 0, 6, 7, 7, 0 ],
					                 "PREDECESSOR_ITEM_ID" : [ null, null, null, 2, 1, null, 4, null, null, 8, 6 ],
									 "ITEM_CATEGORY_ID" : [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
									 "CHILD_ITEM_CATEGORY_ID" : [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
					                 "IS_ACTIVE" : [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
					                 "CREATED_ON" : [ sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate,
					                                  sLastYearDate, sLastYearDate, sLastYearDate ],
					                                  "CREATED_BY" : [ "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user",
					                                                           "some_user", "some_user" ],
					                                                           "LAST_MODIFIED_ON" : [ sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate, sLastYearDate,
					                                                                                  sLastYearDate, sLastYearDate, sLastYearDate ],
					                                                                                  "LAST_MODIFIED_BY" : [ "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user",
					                                                                                                                 "some_user", "some_user", "some_user" ],
					                                                                                                                 'PRICE_FIXED_PORTION' : [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
					                                                                                                                 'PRICE_VARIABLE_PORTION' : [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
					                                                                                                                 'TRANSACTION_CURRENCY_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR' ],
					                                                                                                                 'PRICE_UNIT' : [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
					                                                                                                                 'PRICE_UNIT_UOM_ID' : [ 'PC', 'PC', 'PC', 'PC', 'PC', 'PC', 'PC', 'PC', 'PC', 'PC', 'PC' ]
			};

			if(jasmine.plcTestRunParameters.generatedFields === true){
			    var oImportExtTestData = {
					"SESSION_ID" : [ sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId,
					                 sSessionId ],
					 "ITEM_ID" : [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
					 "CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId, iCvId],
					 "CUST_BOOLEAN_INT_MANUAL":[1,0,1,1,0,1,0,1,0,1, 0],
					 "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL":[null,'300.5000000','40.8800000','50.9600000','600.0000000','20.0000000','300.5000000','40.8800000','50.9600000','600.0000000','20.0000000'],
					 "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT":[null, 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR', 'EUR']
			    };
			}

			beforeOnce(function() {

			});

			beforeEach(function() {
				var oItemsPersistency = oPersistency.Item;
				spyOn(oItemsPersistency, "markItemForDeletion");

				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("itemTemporary", oImportTestData);
				oMockstar.insertTableData("calculationVersionTemporary", oCalculationVersion);

				oMockstar.insertTableData("item", testData.oItemTestData);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				oMockstar.insertTableData("openCalculationVersion", testData.oOpenCalculationVersionsTestData);
				oMockstar.insertTableData("costing_sheet__text", testData.oCostingSheetTextTestData);
				oMockstar.insertTableData("document", testData.oDocumentTestDataPlc);
                oMockstar.insertTableData("document_type", testData.oDocumentTypeTestDataPlc);
                oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc);

				if(jasmine.plcTestRunParameters.generatedFields === true){
				    oMockstar.insertTableData("itemTemporaryExt", oImportExtTestData);
				    oMockstar.insertTableData("item_ext", testData.oItemExtData);
				    oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				    oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				}

			});

			describe("scenario 1 - basic import functionality", function() {
				// first simple scenario is used to ensure most of the basic functionality; updates item 1 and replaces
				// its old children (2 and 3) by 3 new items.

				// Graph: 	   1
				// 			 / | \
				// 		   -1 -2 -3
				var oScenarioOneRequestItems = {
						"ITEM_ID" : [ 1, -1, -2, -3 ],
						"CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId, iCvId ],
						"PARENT_ITEM_ID" : [ 0, 1, 1, 1 ],
						"PREDECESSOR_ITEM_ID" : [ null, null, -1, -2 ],
						"ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
						"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
						"IS_ACTIVE" : [ 1, 1, 1, 1 ],
						"QUANTITY" : [ 1, 1, 1, 1 ],
						"QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC" ],
						"TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1, 1 ],
						'PRICE_FIXED_PORTION' : [ null, 1, 1, 1 ],
						'PRICE_VARIABLE_PORTION' : [ null, 0, 0, 0 ],
						'TRANSACTION_CURRENCY_ID' : [ null, 'EUR', 'EUR', 'EUR' ],
						'PRICE_UNIT' : [ null, 1, 1, 1 ],
						'PRICE_UNIT_UOM_ID' : [ null, 'PC', 'PC', 'PC' ],
						'BASE_QUANTITY' : [ 1, 1, 1, 1],
                        'MATERIAL_ID' : ['MAT1', 'MAT2', 'MAT2', 'MAT4' ],
                        'PURCHASING_GROUP' : [null, 123456789, 123456789, 123456789],
                        'PURCHASING_DOCUMENT' : [null, 123456789, 123456789, 123456789],
                        'IS_DISABLING_PRICE_DETERMINATION' : [null,0,null,1],
						"CONFIDENCE_LEVEL_ID" : [null, null, 3, 3],
						"IS_PRICE_SPLIT_ACTIVE":[0,0,0,0]
				};

				if(jasmine.plcTestRunParameters.generatedFields === true){
					 oScenarioOneRequestItems.CUST_BOOLEAN_INT_MANUAL = [1,0,1,1];
					 oScenarioOneRequestItems.CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL = ['20.0000000','300.5000000','40.8800000','50.9600000'];
					 oScenarioOneRequestItems.CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT = ['USD', 'USD', 'USD', 'USD'];
			         var aCustomFields = ["CUST_BOOLEAN_INT_MANUAL",
										  "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL",
										  "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT"];
				}

				it("should set confidence level id to input values when disable price determination is true", function() {
					// arrange
                    var oScenarioRequestItems = {
						"ITEM_ID" : [ 1, -1, -2],
						"CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId],
						"PARENT_ITEM_ID" : [ 0, 1, 1],
						"PREDECESSOR_ITEM_ID" : [ null, 1, -1,],
						"ITEM_CATEGORY_ID" : [ 1, 3, 4],
						"CHILD_ITEM_CATEGORY_ID" : [ 1, 3, 4],
						"IS_ACTIVE" : [ 1, 1, 1],
						"QUANTITY" : [ 1, 5, 5],
						"QUANTITY_UOM_ID" : [ "PC", "PC", "PC"],
						"TOTAL_QUANTITY_DEPENDS_ON" : [ 0, 0, 0],
						'PRICE_FIXED_PORTION' : [ null, 1, 1],
						'PRICE_VARIABLE_PORTION' : [ null, 0, 0],
						'TRANSACTION_CURRENCY_ID' : [ null, 'EUR', 'EUR'],
						'PRICE_UNIT' : [ null, 1, 1],
						'PRICE_UNIT_UOM_ID' : [ null, 'PC', 'PC'],
						'BASE_QUANTITY' : [ 1, 1, 1],
                        'IS_DISABLING_PRICE_DETERMINATION' : [null, 1, 1],
                        'CONFIDENCE_LEVEL_ID' : [null, 4, 3],
						"IS_PRICE_SPLIT_ACTIVE":[0,0,0]
				    };
					
				    var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
                    
					expect(getItemByHandleId(aResponseItems, -1).CONFIDENCE_LEVEL_ID).toBe(4);
					expect(getItemByHandleId(aResponseItems, -2).CONFIDENCE_LEVEL_ID).toBe(3);
					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should set IS_DISABLING_ACCOUNT_DETERMINATION = 1 after import", function() {
					// arrange
                    var oScenarioRequestItems = {
						"ITEM_ID" : [ 1, -1, -2],
						"CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId],
						"PARENT_ITEM_ID" : [ 0, 1, 1],
						"PREDECESSOR_ITEM_ID" : [ null, 1, -1,],
						"ITEM_CATEGORY_ID" : [ 1, 3, 4],
						"CHILD_ITEM_CATEGORY_ID" : [ 1, 3, 4],
						"IS_ACTIVE" : [ 1, 1, 1],
						"QUANTITY" : [ 1, 5, 5],
						"QUANTITY_UOM_ID" : [ "PC", "PC", "PC"],
						"TOTAL_QUANTITY_DEPENDS_ON" : [ 0, 0, 0],
						'PRICE_FIXED_PORTION' : [ null, 1, 1],
						'PRICE_VARIABLE_PORTION' : [ null, 0, 0],
						'TRANSACTION_CURRENCY_ID' : [ null, 'EUR', 'EUR'],
						'PRICE_UNIT' : [ null, 1, 1],
						'PRICE_UNIT_UOM_ID' : [ null, 'PC', 'PC'],
						'BASE_QUANTITY' : [ 1, 1, 1],
                        'IS_DISABLING_PRICE_DETERMINATION' : [null, 1, 1],
                        'CONFIDENCE_LEVEL_ID' : [null, 4, 3],
						"IS_PRICE_SPLIT_ACTIVE":[0,0,0],
						"IS_DISABLING_ACCOUNT_DETERMINATION": [0, 1, 1]
				    };

				    var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);

					expect(getItemByHandleId(aResponseItems, -1).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(1);
					expect(getItemByHandleId(aResponseItems, -2).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(1);
					expect(getItem(aResponseItems, 1).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(0);
					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should set IS_DISABLING_ACCOUNT_DETERMINATION = 0 after import", function() {
					// arrange
                    var oScenarioRequestItems = {
						"ITEM_ID" : [ 1, -1, -2],
						"CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId],
						"PARENT_ITEM_ID" : [ 0, 1, 1],
						"PREDECESSOR_ITEM_ID" : [ null, 1, -1,],
						"ITEM_CATEGORY_ID" : [ 1, 3, 4],
						"CHILD_ITEM_CATEGORY_ID" : [ 1, 3, 4],
						"IS_ACTIVE" : [ 1, 1, 1],
						"QUANTITY" : [ 1, 5, 5],
						"QUANTITY_UOM_ID" : [ "PC", "PC", "PC"],
						"TOTAL_QUANTITY_DEPENDS_ON" : [ 0, 0, 0],
						'PRICE_FIXED_PORTION' : [ null, 1, 1],
						'PRICE_VARIABLE_PORTION' : [ null, 0, 0],
						'TRANSACTION_CURRENCY_ID' : [ null, 'EUR', 'EUR'],
						'PRICE_UNIT' : [ null, 1, 1],
						'PRICE_UNIT_UOM_ID' : [ null, 'PC', 'PC'],
						'BASE_QUANTITY' : [ 1, 1, 1],
                        'IS_DISABLING_PRICE_DETERMINATION' : [null, 1, 1],
                        'CONFIDENCE_LEVEL_ID' : [null, 4, 3],
						"IS_PRICE_SPLIT_ACTIVE":[0,0,0],
						"IS_DISABLING_ACCOUNT_DETERMINATION": [0, 0, 0]
				    };

				    var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);

					expect(getItemByHandleId(aResponseItems, -1).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(0);
					expect(getItemByHandleId(aResponseItems, -2).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(0);
					expect(getItem(aResponseItems, 1).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(0);
					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should successfully import root item from excel when array is empty", function() {
					// arrange
                    var oScenarioRequestItems = {
						"ITEM_ID" : [ 1 ],
						"CALCULATION_VERSION_ID" : [ iCvId ],
						"PARENT_ITEM_ID" : [ 0 ],
						"PREDECESSOR_ITEM_ID" : [ null ],
						"ITEM_CATEGORY_ID" : [ 1 ],
						"CHILD_ITEM_CATEGORY_ID" : [ 1 ],
						"IS_ACTIVE" : [ 1 ],
						"QUANTITY" : [ 1 ],
						"QUANTITY_UOM_ID" : [ "PC" ],
						"TOTAL_QUANTITY_DEPENDS_ON" : [ 0 ],
						'PRICE_FIXED_PORTION' : [ 0 ],
						'PRICE_VARIABLE_PORTION' : [ 0 ],
						'TRANSACTION_CURRENCY_ID' : [ "USD" ],
						'PRICE_UNIT' : [ 1 ],
						'PRICE_UNIT_UOM_ID' : [ "PC" ],
						'BASE_QUANTITY' : [ 1 ],
                        'IS_DISABLING_PRICE_DETERMINATION' : [ null ],
                        'CONFIDENCE_LEVEL_ID' : [ null ],
						"IS_PRICE_SPLIT_ACTIVE":[ 0 ]
				    };
					
				    var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioRequestItems, false), oModeParemeter.values.replace, undefined, true);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
					expect(aResponseItems.length).toBeGreaterThan(0);
					var transactionaldata = getResponse(oDefaultResponseMock);
					expect(transactionaldata.body.transactionaldata[0].ITEM_ID).toBeDefined();
				});

				it("should keep correct dependent fields for root item when an import is done multiple times", function() {
					// arrange
					var oExpectedData = {
					    "MATERIAL_TYPE_ID": "MT1",
					    "MATERIAL_GROUP_ID": "MG1",
					    "MATERIAL_ID": "MAT1",
					    "IS_CONFIGURABLE_MATERIAL": 1,
					    "IS_PHANTOM_MATERIAL": 1,
					    "ITEM_ID": 1,
					    "DOCUMENT_ID": "D1",
					    "DOCUMENT_TYPE_ID" : "DT1",
					    "DOCUMENT_PART" : "1",
					    "DOCUMENT_VERSION" : "1",
					    "DESIGN_OFFICE_ID" : "L1",
					    "DOCUMENT_STATUS_ID" : "S1",
					    "ITEM_DESCRIPTION" : "TEST TEST TEST"
					}
					let oScenarioRequestItemsCopy = JSON.parse(JSON.stringify(oScenarioOneRequestItems));
					oScenarioRequestItemsCopy.DOCUMENT_ID = ["D1", null, null, null];
					oScenarioRequestItemsCopy.DOCUMENT_TYPE_ID = ["DT1", null, null, null];
					oScenarioRequestItemsCopy.DOCUMENT_VERSION = ["1", null, null, null];
					oScenarioRequestItemsCopy.DOCUMENT_PART = ["1", null, null, null];
					oScenarioRequestItemsCopy.ITEM_DESCRIPTION = ["TEST TEST TEST", null, null, null]
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioRequestItemsCopy, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
					var oParentItem = getItem(aResponseItems, 1);
					expect(oParentItem).toMatchData(oExpectedData, ["ITEM_ID"]);
					
					// arrange
					oMockstar.clearTable("itemTemporary");
					oMockstar.clearTable("itemTemporaryExt");
					oMockstar.insertTableData("itemTemporary", oImportTestData);
					if(jasmine.plcTestRunParameters.generatedFields === true){
						oMockstar.clearTable("itemTemporaryExt");
						oMockstar.insertTableData("itemTemporaryExt", oItemTemporaryExtTestData);
					}
					oScenarioRequestItemsCopy.ITEM_ID = [1, -4, -5, -6];
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioRequestItemsCopy, true), oModeParemeter.values.replace);
					
					//act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
					var oParentItem = getItem(aResponseItems, 1);
					expect(oParentItem).toMatchData(oExpectedData, ["ITEM_ID"]);
				});

				it("should put root item into response with updated modification time stamps", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
					var oParentItem = getItem(aResponseItems, 1);

					// check if the modification timestamps were updated
					var oNewLastModifiedOn = new Date(Date.parse(oParentItem.LAST_MODIFIED_ON));
					var oNewCreatedOn = new Date(Date.parse(oParentItem.CREATED_ON));
					expect(oNewLastModifiedOn > oLastYearDate).toBe(true);
					expect(oNewCreatedOn > oLastYearDate).toBe(true);

					// check if the new user was set
					expect(oParentItem.CREATED_BY).toEqual(oMockstar.currentUser);
					expect(oParentItem.LAST_MODIFIED_BY).toEqual(oMockstar.currentUser);

					// ensure that the ITEM_CATEGORY_ID is part of the response (it's not part of the request
					// object anymore!)
					expect(oParentItem.ITEM_CATEGORY_ID).toEqual(oScenarioOneRequestItems.ITEM_CATEGORY_ID[0]);

					if(jasmine.plcTestRunParameters.generatedFields === true){
					    _.each(aCustomFields,function(sFieldName, iIndex){
					        expect(oParentItem[sFieldName]).toEqual(oScenarioOneRequestItems[sFieldName][0]);
					    });
					}
					checkCalculationVersionSetDirty(true, oDefaultResponseMock, oParentItem.CALCULATION_VERSION_ID);
				});

				it("should send the new root item's ITEM_CATEGORY_ID in the response", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
					var oParentItem = getItem(aResponseItems, 1);

					// ensure that the ITEM_CATEGORY_ID is part of the response (it's not part of the request
					// object anymore!)
					expect(oParentItem.ITEM_CATEGORY_ID).toEqual(oScenarioOneRequestItems.ITEM_CATEGORY_ID[0]);
					checkCalculationVersionSetDirty(true, oDefaultResponseMock, oParentItem.CALCULATION_VERSION_ID);
				});
				
				it("should update calculation version also if its ITEM_CATEGORY_ID was empty in request", function() {
					// arrange
					
					// Root item w/o ITEM_CATEGORY_ID, since it is not accepted by itemValidator
					var oRootItem = [{
							"ITEM_ID" : 1,
							"CALCULATION_VERSION_ID" : iCvId,
							//"PARENT_ITEM_ID" : null,
							"PREDECESSOR_ITEM_ID" : null,
							"IS_ACTIVE" : 1,
							"PRICE_FIXED_PORTION" : 0,
							"PRICE_VARIABLE_PORTION" : 0,
							"TRANSACTION_CURRENCY_ID" : 'EUR',
							"PRICE_UNIT" : 1,
							"PRICE_UNIT_UOM_ID" : 'PC',
							"TOTAL_QUANTITY" : '12.0000000',
							"TOTAL_QUANTITY_UOM_ID" : 'PC'
					}];
					
					var oRequest = prepareRequest(oRootItem, oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					// Response should be OK, since only root item is updated and no items are created
					expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
					
					// Check that changed properties have been updated
					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
					var oParentItem = getItem(aResponseItems, 1);
					expect(oParentItem.TOTAL_QUANTITY).toEqual(oRootItem[0].TOTAL_QUANTITY);
				});

				it("should update the root item's data base record in accordance with the imported data", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					var oParentItemDb = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{itemTemporary}} where item_id = 1"));
					var oParentItem = mockstar_helpers.convertToObject(oParentItemDb, 0);

					// check if the modification timestamps were updated
					var oNewLastModifiedOn = new Date(Date.parse(oParentItem.LAST_MODIFIED_ON));
					var oNewCreatedOn = new Date(Date.parse(oParentItem.CREATED_ON));
					expect(oNewLastModifiedOn > oLastYearDate).toBe(true);
					expect(oNewCreatedOn > oLastYearDate).toBe(true);

					// check if the new user was set
					expect(oParentItem.CREATED_BY).toEqual(oMockstar.currentUser);
					expect(oParentItem.LAST_MODIFIED_BY).toEqual(oMockstar.currentUser);

					// transmitted predecessor and parent are maintained
					expect(oParentItem.PARENT_ITEM_ID).toEqual(0);
					expect(oParentItem.PREDECESSOR_ITEM_ID).toBe(null);

					if(jasmine.plcTestRunParameters.generatedFields === true){
						var oParentItemExtDb = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id = 1"));
						var oParentItemExt = mockstar_helpers.convertToObject(oParentItemExtDb, 0);
					    _.each(aCustomFields,function(sFieldName, iIndex){
					        expect(oParentItemExt[sFieldName]).toEqual(oScenarioOneRequestItems[sFieldName][0]);
					    });
					}

					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
                });
                
                it("should set purchasing group/document to input value and confidence level to input value if it exists or masterdata value if it is null when disable price determination is set to true", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
                    
					expect(getItemByHandleId(aResponseItems, -3).PURCHASING_GROUP).toBe('123456789');
					expect(getItemByHandleId(aResponseItems, -3).PURCHASING_DOCUMENT).toBe('123456789');
					expect(getItemByHandleId(aResponseItems, -3).CONFIDENCE_LEVEL_ID).toBe(3);
					expect(getItemByHandleId(aResponseItems, -2).PURCHASING_GROUP).toBe('123456789');
					expect(getItemByHandleId(aResponseItems, -2).PURCHASING_DOCUMENT).toBe('123456789');
					expect(getItemByHandleId(aResponseItems, -2).CONFIDENCE_LEVEL_ID).toBe(3);
					expect(getItemByHandleId(aResponseItems, -1).PURCHASING_GROUP).toBe('123456789');
					expect(getItemByHandleId(aResponseItems, -1).PURCHASING_DOCUMENT).toBe('123456789');
					expect(getItemByHandleId(aResponseItems, -1).CONFIDENCE_LEVEL_ID).toBe(2);//for this item, input value of confidence level id is null so it should take the price source masterdata value
					

					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should put new items for handles -1, -2, -3 into the service response", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);

					expect(getItemByHandleId(aResponseItems, -1).ITEM_ID).toBeGreaterThan(0);
					expect(getItemByHandleId(aResponseItems, -2).ITEM_ID).toBeGreaterThan(0);
					expect(getItemByHandleId(aResponseItems, -3).ITEM_ID).toBeGreaterThan(0);

					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should create new items in t_item_temporary (and t_item_temporary_ext) for items with handles -1, -2, -3", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert

					// determine new created item ids from http response and then check if there is an entry for
					// this id in
					// item_temporary
					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);

					var aCreatedItemsResponse = [ getItemByHandleId(aResponseItems, -1), getItemByHandleId(aResponseItems, -2),
					                              getItemByHandleId(aResponseItems, -3) ];

					_.each(aCreatedItemsResponse, function(oCreatedItem) {
						var oCreatedItemDb = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{itemTemporary}} where item_id = "
								+ oCreatedItem.ITEM_ID));
						expect(oCreatedItemDb.ITEM_ID.length).toEqual(1);
						if(jasmine.plcTestRunParameters.generatedFields === true){
							var oCreatedItemExtDb = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id = "
									+ oCreatedItem.ITEM_ID));
							_.each(aCustomFields,function(sFieldName, iIndex){
						        expect(oCreatedItemExtDb[sFieldName][0]).toEqual(oCreatedItem[sFieldName]);
						    });
						}
					});

					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should set parent_ and precedessor_item_id correctly with generated ids to maintain correct relationship among new items", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);

					expect(getItemByHandleId(aResponseItems, -1).PARENT_ITEM_ID).toEqual(1);
					expect(getItemByHandleId(aResponseItems, -2).PARENT_ITEM_ID).toEqual(1);
					expect(getItemByHandleId(aResponseItems, -3).PARENT_ITEM_ID).toEqual(1);

					expect(getItemByHandleId(aResponseItems, -2).PREDECESSOR_ITEM_ID).toEqual(getItemByHandleId(aResponseItems, -1).ITEM_ID);
					expect(getItemByHandleId(aResponseItems, -3).PREDECESSOR_ITEM_ID).toEqual(getItemByHandleId(aResponseItems, -2).ITEM_ID);

					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should call persistency.Item.markItemForDeletion for item 1 with parameter FALSE to delete the children of item 1", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oPersistency.Item.markItemForDeletion).toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 1
					}), false);

					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should not modify items that are not affected by the replace (item 4, 5, 6, 7, 8, 9, 10 are untouched)", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					var oOtherItemsDb = mockstar_helpers.convertResultToArray(oMockstar
							.execQuery("select * from  {{itemTemporary}} where item_id not in (1, 2, 3) and item_id < 11"));
					var aOtherItems = [];
					for (var i = 0; i < oOtherItemsDb.ITEM_ID.length; i++) {
						aOtherItems.push(mockstar_helpers.convertToObject(oOtherItemsDb, i));
					}

					expect(getItem(aOtherItems, 4).PARENT_ITEM_ID).toEqual(0);
					expect(getItem(aOtherItems, 4).PREDECESSOR_ITEM_ID).toEqual(1);

					expect(getItem(aOtherItems, 5).PARENT_ITEM_ID).toEqual(4);
					expect(getItem(aOtherItems, 5).PREDECESSOR_ITEM_ID).toBe(null);

					expect(getItem(aOtherItems, 6).PARENT_ITEM_ID).toEqual(0);
					expect(getItem(aOtherItems, 6).PREDECESSOR_ITEM_ID).toEqual(4);

					expect(getItem(aOtherItems, 7).PARENT_ITEM_ID).toEqual(6);
					expect(getItem(aOtherItems, 7).PREDECESSOR_ITEM_ID).toBe(null);

					expect(getItem(aOtherItems, 8).PARENT_ITEM_ID).toEqual(7);
					expect(getItem(aOtherItems, 8).PREDECESSOR_ITEM_ID).toBe(null);

					expect(getItem(aOtherItems, 9).PARENT_ITEM_ID).toEqual(7);
					expect(getItem(aOtherItems, 9).PREDECESSOR_ITEM_ID).toEqual(8);

					expect(getItem(aOtherItems, 10).PARENT_ITEM_ID).toEqual(0);
					expect(getItem(aOtherItems, 10).PREDECESSOR_ITEM_ID).toEqual(6);

					if(jasmine.plcTestRunParameters.generatedFields === true){
						var oOtherItemsExtDb = mockstar_helpers.convertResultToArray(oMockstar
								.execQuery("select * from  {{itemTemporaryExt}} where item_id not in (1, 2, 3) and item_id < 11"));
						var aOtherItemsExt = [];
						for (var i = 0; i < oOtherItemsExtDb.ITEM_ID.length; i++) {
							aOtherItemsExt.push(mockstar_helpers.convertToObject(oOtherItemsExtDb, i));
						}
						for (var i = 4; i < 11; i++) {
							_.each(aCustomFields,function(sFieldName, iIndex){
						        expect(getItem(aOtherItemsExt, i)[sFieldName]).toEqual(oImportExtTestData[sFieldName][i]);
						    });
						}
					}

					expect(oPersistency.Item.markItemForDeletion).not.toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 1
					}));
					expect(oPersistency.Item.markItemForDeletion).not.toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 4
					}));
					expect(oPersistency.Item.markItemForDeletion).not.toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 5
					}));
					expect(oPersistency.Item.markItemForDeletion).not.toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 6
					}));
					expect(oPersistency.Item.markItemForDeletion).not.toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 7
					}));
					expect(oPersistency.Item.markItemForDeletion).not.toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 8
					}));
					expect(oPersistency.Item.markItemForDeletion).not.toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 9
					}));
					expect(oPersistency.Item.markItemForDeletion).not.toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 10
					}));
				});

				it("should contain master data for updated calculation", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioOneRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

					// assert
					var oResponseMasterData = oResponseObject.body.masterdata;
					// Test if some properties of the master data are set. The detailed check of the delivered master data should be made in corresponding persistency* method
					expect(oResponseMasterData).toBeDefined();
                    var aExpectedMaterialIds = oScenarioOneRequestItems.MATERIAL_ID;
                    var aActualMaterialIds = oResponseMasterData.MATERIAL_ENTITIES.map(oMaterial => oMaterial.MATERIAL_ID);
                    expect(_.difference(aExpectedMaterialIds, aActualMaterialIds).length).toBe(0);
				});
				
				if(jasmine.plcTestRunParameters.generatedFields === true){
        			it("should set CMAT_STRING_MANUAL dependent on input and master data", function() {
        				// arrange
        			    oMockstar.insertTableData("material", testData.oMaterialTestDataPlc);
                        oMockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
        			    
        				let aItems = mockstar_helpers.transpose(oScenarioOneRequestItems, true);

        				// Custom field value set in request => return custom field value from request
        				const sCustomFieldValue = "Custom value";
        				aItems[1].CMAT_STRING_MANUAL = sCustomFieldValue;
        				aItems[1].ITEM_CATEGORY_ID = 2; // material
						aItems[1].CHILD_ITEM_CATEGORY_ID = 2; // material
        				
        				// Custom field value set to null in request => return null for custom field
                        aItems[2].CMAT_STRING_MANUAL = null;
                        aItems[2].ITEM_CATEGORY_ID = 2;
						aItems[2].CHILD_ITEM_CATEGORY_ID = 2;
                        
        				// Custom field property not present in request => return managed value for material custom field
        				delete aItems[3].CMAT_STRING_MANUAL;
        				aItems[3].ITEM_CATEGORY_ID = 2;
						aItems[3].CHILD_ITEM_CATEGORY_ID = 2;
        				
        				var oRequest = prepareRequest(aItems, oModeParemeter.values.replace, false, true, false);
        
        				// act
        				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
        
        				// assert
        				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

        				// Check master data in response
        				var oResponseMasterData = oResponseObject.body.masterdata;
                        var aExpectedCustomFieldValues = [
                                    testData.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0],
                                    testData.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[1],
                                    testData.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[3]
                                ];
                        var aActualCustomFieldValues = oResponseMasterData.MATERIAL_ENTITIES.map(oMaterial => oMaterial.CMAT_STRING_MANUAL);
                        expect(_.difference(aExpectedCustomFieldValues, aActualCustomFieldValues).length).toBe(0);

                        // Check master data custom fields of items 
                        var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
                        const aActualCustomFields = _.pick(aResponseItems[0], ["ITEM_ID", "CMAT_STRING_MANUAL"]);
                        expect(aActualCustomFields).toMatchData(
                            {   ITEM_ID: [1, 11, 12, 13],
                                CMAT_STRING_MANUAL: [
                                    testData.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0],
                                    sCustomFieldValue,
                                    null,
                                    testData.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[3]
                                ]
                            }, ["ITEM_ID"]
                        );
        			});
        			
        			it("should set Master Data Custom Fields to null if they are null in request", function() {
                        // arrange
                        oMockstar.insertTableData("material", testData.oMaterialTestDataPlc);
                        oMockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
                        
                        let aItems = mockstar_helpers.transpose(oScenarioOneRequestItems, true);
                        
                        const oMasterdataCustomFields = oPersistency.Metadata.getMasterdataCustomFields();
                        // Do not include some fields since they are removed from request by validator 
                        // TODO: check why these fields are removed in validator
                        const aFilteredMasterdataCustomFields = _.without(oMasterdataCustomFields.COLUMNS, 
                            'CAPR_DECIMAL_MANUAL', 'CWCE_DECIMAL_MANUAL', 'CCEN_DATE_MANUAL');
                        // Custom field value set to null in request => return null for custom field
                        _.each(aFilteredMasterdataCustomFields, function(fieldName) {
                            aItems[1][fieldName] = null;
			            });
                        const aFieldsThatShouldBeNotNull = ['CMPR_BOOLEAN_INT_MANUAL','CMPR_DECIMAL_WITH_CURRENCY_UNIT','CMPR_DECIMAL_WITH_UOM_UNIT'];

                        var oRequest = prepareRequest(aItems, oModeParemeter.values.replace, false, true, false);
        
                        // act
                        new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
        
                        // assert
                        var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

                        // Check master data custom fields of items 
                        var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
                        _.each(aFilteredMasterdataCustomFields, function(fieldName) {
                        	if(_.includes(aFieldsThatShouldBeNotNull,fieldName)){
                        		expect(aResponseItems[0][fieldName][0]).not.toBe(null);
                        	}else{
                        		expect(aResponseItems[0][fieldName][0]).toBe(null);
                        	}
                        });
			});
				}
			});

			describe("scenario 2 - import multiple item levels", function() {
				// a more complex structure to ensure that not only one level ofnew items can replace the children of an updated item

				// Graph: 	  1
				// 			 /  \
				// 			-1  -2
				//          / \
				// 		   -3 -4

				var oScenarioTwoRequestItems = {
						"ITEM_ID" : [ 1, -1, -2, -3, -4 ],
						"CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId, iCvId, iCvId ],
						"PARENT_ITEM_ID" : [ 0, 1, 1, -1, -1 ],
						"PREDECESSOR_ITEM_ID" : [ null, null, -1, null, -3 ],
						"ITEM_CATEGORY_ID" : [ 1, 1, 1, 1, 1 ],
						"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1, 1, 1 ],
						"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
						'PRICE_FIXED_PORTION' : [ null, null, 1, 1, 1 ],
						'PRICE_VARIABLE_PORTION' : [ null, null, 0, 0, 0 ],
						'TRANSACTION_CURRENCY_ID' : [ null, null, "EUR", "EUR", "EUR" ],
						'PRICE_UNIT' : [ null, null, 1, 1, 1 ],
						'PRICE_UNIT_UOM_ID' : [ null, null, "PC", "PC", "PC" ],
						"QUANTITY" : [ 1, 1, 1, 1, 1 ],
						"QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC", "PC" ],
						"TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1, 1, 1 ],
						"BASE_QUANTITY" : [1, 1, 1, 1, 1],
						"IS_PRICE_SPLIT_ACTIVE":[0,0,0,0,0]
				};

				if(jasmine.plcTestRunParameters.generatedFields === true){
					it("should set reporting currency to items with currency custom fields and rollup", function() {
						// arrange	
						var oScenarioRequestItems = {
							"ITEM_ID" : [ 1, -1, -2, -3, -4 ],
							"CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId, iCvId, iCvId ],
							"PARENT_ITEM_ID" : [ 0, 1, 1, -1, -1 ],
							"PREDECESSOR_ITEM_ID" : [ null, null, -1, null, -3 ],
							"ITEM_CATEGORY_ID" : [ 1, 1, 1, 1, 1 ],
							"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1, 1, 1 ],
							"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
							'PRICE_FIXED_PORTION' : [ null, null, 1, 1, 1 ],
							'PRICE_VARIABLE_PORTION' : [ null, null, 0, 0, 0 ],
							'TRANSACTION_CURRENCY_ID' : [ null, null, "EUR", "EUR", "EUR" ],
							'PRICE_UNIT' : [ null, null, 1, 1, 1 ],
							'PRICE_UNIT_UOM_ID' : [ null, null, "PC", "PC", "PC" ],
							"QUANTITY" : [ 1, 2, 3, 4, 5 ],
							"QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC", "PC" ],
							"TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1, 1, 1 ],
							"BASE_QUANTITY" : [1, 1, 1, 1, 1],
							"IS_PRICE_SPLIT_ACTIVE" : [0, 0, 0, 0, 0],
							"CUST_ROLLUP_CURRENCY_MANUAL" : ['350.00', '120.00', '450.00', '890.00', '230.00'],
							"CUST_ROLLUP_CURRENCY_IS_MANUAL" : ['0', '0', '1', '1', '1'],
							"CUST_ROLLUP_CURRENCY_UNIT" : ['USD', 'USD', 'USD', 'USD', 'USD']
						};
						var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioRequestItems, true), oModeParemeter.values.replace);
	
						// act
						new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	
						// assert
						expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
	
						var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
	
						var iItemKey = Object.keys(aResponseItems).filter(function(key) {return aResponseItems[key]["ITEM_ID"] === 11})[0];
						
						expect(aResponseItems[iItemKey]["CUST_ROLLUP_CURRENCY_UNIT"]).toBe("EUR");
						checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
					});
				}

				it("should set parent_ and precedessor_item_id correctly with generated ids to maintain correct relationship among new items", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioTwoRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);

					expect(getItemByHandleId(aResponseItems, -1).PARENT_ITEM_ID).toEqual(1);
					expect(getItemByHandleId(aResponseItems, -2).PARENT_ITEM_ID).toEqual(1);
					expect(getItemByHandleId(aResponseItems, -3).PARENT_ITEM_ID).toEqual(getItemByHandleId(aResponseItems, -1).ITEM_ID);
					expect(getItemByHandleId(aResponseItems, -4).PARENT_ITEM_ID).toEqual(getItemByHandleId(aResponseItems, -1).ITEM_ID);

					expect(getItemByHandleId(aResponseItems, -2).PREDECESSOR_ITEM_ID).toEqual(getItemByHandleId(aResponseItems, -1).ITEM_ID);
					expect(getItemByHandleId(aResponseItems, -4).PREDECESSOR_ITEM_ID).toEqual(getItemByHandleId(aResponseItems, -3).ITEM_ID);

					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});

				it("should set IS_DISABLING_ACCOUNT_DETERMINATION = 1 for items -2, -3 and IS_DISABLING_ACCOUNT_DETERMINATION = 0 for items 1, -4,-5", function() {
					// arrange
					var oScenarioTwoRequestItemsAccountDetermination = {
						"ITEM_ID" : [ 1, -1, -2, -3, -4 ],
						"CALCULATION_VERSION_ID" : [ iCvId, iCvId, iCvId, iCvId, iCvId ],
						"PARENT_ITEM_ID" : [ 0, 1, 1, -1, -1 ],
						"PREDECESSOR_ITEM_ID" : [ null, null, -1, null, -3 ],
						"ITEM_CATEGORY_ID" : [ 1, 1, 1, 1, 1 ],
						"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1, 1, 1 ],
						"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
						'PRICE_FIXED_PORTION' : [ null, null, 1, 1, 1 ],
						'PRICE_VARIABLE_PORTION' : [ null, null, 0, 0, 0 ],
						'TRANSACTION_CURRENCY_ID' : [ null, null, "EUR", "EUR", "EUR" ],
						'PRICE_UNIT' : [ null, null, 1, 1, 1 ],
						'PRICE_UNIT_UOM_ID' : [ null, null, "PC", "PC", "PC" ],
						"QUANTITY" : [ 1, 1, 1, 1, 1 ],
						"QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC", "PC" ],
						"TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1, 1, 1 ],
						"BASE_QUANTITY" : [1, 1, 1, 1, 1],
						"IS_PRICE_SPLIT_ACTIVE":[0,0,0,0,0],
						"IS_DISABLING_ACCOUNT_DETERMINATION": [0,0,1,1,0]
					};
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioTwoRequestItemsAccountDetermination, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);

					expect(getItemByHandleId(aResponseItems, -3).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(1);
					expect(getItemByHandleId(aResponseItems, -2).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(1);
					expect(getItemByHandleId(aResponseItems, -1).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(0);
					expect(getItemByHandleId(aResponseItems, -4).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(0);
					expect(getItem(aResponseItems, 1).IS_DISABLING_ACCOUNT_DETERMINATION).toBe(0);
					checkCalculationVersionSetDirty(true, oDefaultResponseMock, iCvId);
				});
		    });

			describe("scenario 3 - import single (parent) item", function() {
				// checks that business logic behaves correctly if only one (parent) item is imported; this case all the previous children of
				// item 6 needs to be removed; response status should be OK and not CREATED

				// Graph: 	  6
				var oScenarioThreeRequestItems = {
						"ITEM_ID" : [ 6 ],
						"CALCULATION_VERSION_ID" : [ iCvId ],
						"PARENT_ITEM_ID" : [ 0 ],
						"PREDECESSOR_ITEM_ID" : [ 4 ],
						"ITEM_CATEGORY_ID" : [ 1 ],
						"CHILD_ITEM_CATEGORY_ID" : [ 1 ],
						"IS_ACTIVE" : [ 1 ],
						'PRICE_FIXED_PORTION' : [ 1 ],
						'PRICE_VARIABLE_PORTION' : [ 0 ],
						'TRANSACTION_CURRENCY_ID' : [ "EUR" ],
						'PRICE_UNIT' : [ 1 ],
						'PRICE_UNIT_UOM_ID' : [ "PC" ],
						"QUANTITY" : [ 1 ],
						"QUANTITY_UOM_ID" : [ "PC" ],
						"TOTAL_QUANTITY_DEPENDS_ON" : [ 1 ],
						"BASE_QUANTITY": [ 1 ],
						"IS_PRICE_SPLIT_ACTIVE":[0]
				};

				it("should update item 6 and put it into response and status is OK and not CREATED", function() {
					// arrange
					var obj = mockstar_helpers.transpose(oScenarioThreeRequestItems, true);
					var oRequest = prepareRequest(obj, oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.OK);

					var aResponseItems = getItemsFromResponse(oDefaultResponseMock);
					var oParentItem = getItem(aResponseItems, 6);

					// check if the modification timestamps were updated
					var oNewLastModifiedOn = new Date(Date.parse(oParentItem.LAST_MODIFIED_ON));
					var oNewCreatedOn = new Date(Date.parse(oParentItem.CREATED_ON));
					expect(oNewLastModifiedOn > oLastYearDate).toBe(true);
					expect(oNewCreatedOn > oLastYearDate).toBe(true);

					// check if the new user was set
					expect(oParentItem.CREATED_BY).toEqual(oMockstar.currentUser);
					expect(oParentItem.LAST_MODIFIED_BY).toEqual(oMockstar.currentUser);

					// transmitted predecessor and parent are maintainted
					expect(oParentItem.PARENT_ITEM_ID).toEqual(0);
					expect(oParentItem.PREDECESSOR_ITEM_ID).toEqual(4);

					checkCalculationVersionSetDirty(false, oDefaultResponseMock, iCvId);
				});

				it("should return no body on response if noResponseBody url parameter is set to true", function() {
					// arrange
					var obj = mockstar_helpers.transpose(oScenarioThreeRequestItems, true);
					var oRequest = prepareRequest(obj, oModeParemeter.values.replace, null, null, null, true);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.OK);

					let aResponseItems = getItemsFromResponse(oDefaultResponseMock);
					let aMasterdata = getMasterdataFromResponse(oDefaultResponseMock);
					expect(aResponseItems).toBeUndefined();
					expect(aMasterdata).toBeUndefined();
				});

				it("should call markItemsForDeletion for item 6 and parameter false to delete children of item 6", function() {
					// arrange
					var oRequest = prepareRequest(mockstar_helpers.transpose(oScenarioThreeRequestItems, true), oModeParemeter.values.replace);

					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					expect(oPersistency.Item.markItemForDeletion).toHaveBeenCalledWith(oMockstar.currentUser, jasmine.objectContaining({
						ITEM_ID : 6
					}), false);
				});
			});
		});

		describe("price determination", function() {

			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.initializeData();
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData);
				oMockstar.insertTableData("openCalculationVersion", testData.oOpenCalculationVersionsTestData);
				oMockstar.insertTableData("calculationVersionTemporary", testData.oCalculationVersionTemporaryTestData);
				oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc);
				
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
			    it("should set custom field default value on a new created item [Activity Price]", function() {
			        // arrange
				    var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
				    	PARENT_ITEM_ID : 3003,
				    	ITEM_CATEGORY_ID : 3,
						CHILD_ITEM_CATEGORY_ID : 3
				    });
			        
			        // act
				    new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();
			        var aItems = getItemsFromResponse(oDefaultResponseMock);
			        
                    // Notes: Because of different values of Object.keys in different engines,
                    // The created items (3004) will be aItems[1].
                    expect(aItems[1].CAPR_DECIMAL_MANUAL).toBe('99999999999.9999900');
			    });
			}

			it("should set price unit of new parent to 1 after a child item was added", function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3003
				});

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				var aItems = getItemsFromResponse(oDefaultResponseMock);
				var oNewParent = getItem(aItems, oItemToCreate.PARENT_ITEM_ID);

				expect(oNewParent.PRICE_UNIT === 1 || oNewParent.PRICE_UNIT === "1" || oNewParent.PRICE_UNIT === "1.0000000").toBeTruthy();
			});

			it("price unit UoM and total quantity UoM of new parent item should be equal", function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3003,
					ITEM_CATEGORY_ID : 2,
					CHILD_ITEM_CATEGORY_ID : 2
				});

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				// assert

				var aItems = getItemsFromResponse(oDefaultResponseMock);
				var oNewParent = getItem(aItems, oItemToCreate.PARENT_ITEM_ID);
				var iParentItemTestDataIndex = _.indexOf(testData.oItemTemporaryTestData.ITEM_ID, oNewParent.PARENT_ITEM_ID);

				expect(oNewParent.PRICE_UNIT_UOM_ID).toEqual(testData.oItemTemporaryTestData.TOTAL_QUANTITY_UOM_ID[iParentItemTestDataIndex]);
			});

			it("should set transaction currency of parent item to report curreny of version", function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3003
				});

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				var aItems = getItemsFromResponse(oDefaultResponseMock);
				var oNewParent = getItem(aItems, oItemToCreate.PARENT_ITEM_ID);

				var iCvIndexInTestdata = _.indexOf(testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID, oNewParent.CALCULATION_VERSION_ID);
				expect(oNewParent.TRANSACTION_CURRENCY_ID).toEqual(testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[iCvIndexInTestdata]);
			});
			
			it("should set price source to calculated price for parent item after an item was added to a leaf item", function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3003
				});

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				var aItems = getItemsFromResponse(oDefaultResponseMock);
				var oNewParentItem = getItem(aItems, oItemToCreate.PARENT_ITEM_ID);

				expect(oNewParentItem.PRICE_SOURCE_ID).toEqual(constants.PriceSource.CalculatedPrice);
			});
			
			it("should set price source to calculated price for assembly item which is pasted", function() {
				// arrange
				var oItem1ToCreate = {
        				ITEM_ID : -1,
        				CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
        				IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
        				ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
        			    QUANTITY : testData.oItemTemporaryTestData.QUANTITY[1],
				        QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[1],
			            TOTAL_QUANTITY_DEPENDS_ON : testData.oItemTemporaryTestData.TOTAL_QUANTITY_DEPENDS_ON[1],
        				ITEM_DESCRIPTION : 'INSERTED TEST ITEM',
        				PARENT_ITEM_ID : 3001,
        				PREDECESSOR_ITEM_ID :-2,
						BASE_QUANTITY: 1,
						IS_PRICE_SPLIT_ACTIVE: 0,
						CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.CHILD_ITEM_CATEGORY_ID[1]
        		};
				
				var oItem2ToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : oItem1ToCreate.ITEM_ID
				});
				
				oItem2ToCreate.PREDECESSOR_ITEM_ID = null;
				oItem2ToCreate.ITEM_ID = -2;				

				// act
				new Dispatcher(oCtx, prepareRequest([ oItem1ToCreate, oItem2ToCreate ], oModeParemeter.values.noUpdateMasterDataAndPrices), oDefaultResponseMock).dispatch();
				
				var aItems = getItemsFromResponse(oDefaultResponseMock);
				var oNewParentItem = _.find(aItems, function(oItemCandidate) { return oItemCandidate.PARENT_ITEM_ID === oItem1ToCreate.PARENT_ITEM_ID; });
				var iCvIndexInTestdata = _.indexOf(testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID, oNewParentItem.CALCULATION_VERSION_ID);
				var iParentItemTestDataIndex = _.indexOf(testData.oItemTemporaryTestData.ITEM_ID, oNewParentItem.PARENT_ITEM_ID);

				expect(oNewParentItem.PRICE_SOURCE_ID).toEqual(constants.PriceSource.CalculatedPrice);
				expect(oNewParentItem.TRANSACTION_CURRENCY_ID).toEqual(testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[iCvIndexInTestdata]);
				expect(oNewParentItem.PRICE_UNIT_UOM_ID).toEqual(testData.oItemTemporaryTestData.TOTAL_QUANTITY_UOM_ID[iParentItemTestDataIndex]);
			});

			it("should reset price related fields of the new parent after a child was added to a leaf item", function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3003
				});
				if(jasmine.plcTestRunParameters.generatedFields === true){
				    oMockstar.insertTableData("itemTemporaryExt", testData.oItemTemporaryExtWithMasterData);
				    var iParentIndex = 2;
				    var aCustPriceProperties = [ "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"];
				}
				var aPropertiesSetToBeNull = [ "PRICE", "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "PRICE_FOR_TOTAL_QUANTITY",
				                               "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION", "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" ];

				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal), oDefaultResponseMock).dispatch();

				var aItems = getItemsFromResponse(oDefaultResponseMock);
				var oNewParentItem = getItem(aItems, oItemToCreate.PARENT_ITEM_ID);

				jasmine.log("checking response object");
				_.each(aPropertiesSetToBeNull, function(sPropToBeNull) {
					jasmine.log(`testing ${sPropToBeNull} if null or undefined`);
					expect(oNewParentItem[sPropToBeNull] === undefined || oNewParentItem[sPropToBeNull] === null).toBeTruthy();
				});

				var oParentItemDb = oMockstar.execQuery(`select * from {{itemTemporary}} where ITEM_ID = ${oItemToCreate.PARENT_ITEM_ID} and CALCULATION_VERSION_ID = ${oItemToCreate.CALCULATION_VERSION_ID} and SESSION_ID = '${sSessionId}'`);
				jasmine.log("checking data base");
				_.each(aPropertiesSetToBeNull, function(sPropToBeNull) {
					jasmine.log(`testing ${sPropToBeNull} if null `);
					expect(oParentItemDb.columns[sPropToBeNull].rows[0] === null).toBeTruthy();
				});
				if(jasmine.plcTestRunParameters.generatedFields === true){
					//the old value should be preserved, for the custom fields that are related to prices
					const oParentItemExtDb = oMockstar.execQuery(`select * from {{itemTemporaryExt}} where ITEM_ID = ${oItemToCreate.PARENT_ITEM_ID} and CALCULATION_VERSION_ID = ${oItemToCreate.CALCULATION_VERSION_ID} and SESSION_ID = '${sSessionId}'`);
				    _.each(aCustPriceProperties, function(sProp) {
    					jasmine.log(`testing ${sProp} if old value is preserved `);
    					const dbValueToCompare = oParentItemExtDb.columns[sProp].rows[0] !== null ? oParentItemExtDb.columns[sProp].rows[0].toString() : null;
    					const oldValueToCompare = testData.oItemTemporaryExtWithMasterData[sProp][iParentIndex] !== null ? testData.oItemTemporaryExtWithMasterData[sProp][iParentIndex].toString() : null;
    					expect(dbValueToCompare).toEqual(oldValueToCompare);
    				});
    			}
			});
		});

		describe("child item category", function() {
			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.initializeData();
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData);
				oMockstar.insertTableData("openCalculationVersion", testData.oOpenCalculationVersionsTestData);
				oMockstar.insertTableData("calculationVersionTemporary", testData.oCalculationVersionTemporaryTestData);
				oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc);
				
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});

			it('should set child item category correctly if valid', function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3002,
					ITEM_CATEGORY_ID : 3,
					CHILD_ITEM_CATEGORY_ID : 3
				});
	
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, false, true), oDefaultResponseMock).dispatch();
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			});

			it('should set child item category correctly if exists', function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3002,
					ITEM_CATEGORY_ID : 2,
					CHILD_ITEM_CATEGORY_ID : 31
				});
				oMockstar.execSingle(`insert into {{item_category}} (ITEM_CATEGORY_ID, DISPLAY_ORDER, CHILD_ITEM_CATEGORY_ID, ICON, ITEM_CATEGORY_CODE)
										VALUES (2, 31, 31, 'icon31', 'code31');`);
	
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, false, true), oDefaultResponseMock).dispatch();
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			});

			it('should throw general validation error when non-existent child item category is sent', function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3002,
					CHILD_ITEM_CATEGORY_ID: 1234
				});
	
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, false, true), oDefaultResponseMock).dispatch();
	
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe(Code.GENERAL_VALIDATION_ERROR.code);
			});

			it('should throw general validation error when invalid child item category is sent', function() {
				// arrange
				var oItemToCreate = _.extend(_.clone(oItemToCreateTemplate), {
					PARENT_ITEM_ID : 3002,
					ITEM_CATEGORY_ID: 2,
					CHILD_ITEM_CATEGORY_ID: 3,
				});
	
				// act
				new Dispatcher(oCtx, prepareRequest([ oItemToCreate ], oModeParemeter.values.normal, false, true), oDefaultResponseMock).dispatch();
	
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe(Code.GENERAL_VALIDATION_ERROR.code);
			});
		});
	});

    describe('remove(delete) item', function() {

		beforeEach(function() {
			oMockstar.clearAllTables(); // clear all specified substitute tables and views
			oMockstar.insertTableData("itemTemporary", oItemTemporaryTestData);
			oMockstar.insertTableData("openCalculationVersion", testData.oOpenCalculationVersionsTestData);
			oMockstar.insertTableData("calculationVersionTemporary", testData.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("priceSource", testData.oPriceSourceTestDataPlc);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				oMockstar.insertTableData("itemTemporaryExt", oItemTemporaryExtTestData);
		    }

			oMockstar.initializeData();

			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
		});

		function prepareRequest(oRequestItem) {
			var params = [ {
				name : "calculate",
				value : "false"
			} ];
			params.get = function(sParameterName) {
				if (helpers.isNullOrUndefined(sParameterName)) {
					return null;
				} else {
					if (sParameterName === "calculate") {
						return "false";
					}
				}
			};
			var oRequest = {
					queryPath : "items",
					method : $.net.http.DEL,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify([ oRequestItem ]);
						}
					}
			};

			return oRequest;
		}

		it("(price determination) should set price source to manual price for former parent (material) after the last child was deleted", function() {
			// arrange
			var iItemIdToDelete = oItemTemporaryTestData.ITEM_ID[2];
			var iParentItemId = oItemTemporaryTestData.PARENT_ITEM_ID[2];
			var oItemToDelete = {
					ITEM_ID : iItemIdToDelete,
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();
			// assert
			var aItems = getItemsFromResponse(oDefaultResponseMock);
			var oNewLeafItem = getItem(aItems, iParentItemId);

			expect(oNewLeafItem.PRICE_SOURCE_ID).toEqual(constants.PriceSource.ManualPrice);
		});

		it("(price determination) should set price source to manual price for root item after the last child was deleted", function() {
			// arrange
			var iItemIdToDelete = oItemTemporaryTestData.ITEM_ID[1];
			var iParentItemId = oItemTemporaryTestData.PARENT_ITEM_ID[1];
			var oItemToDelete = {
					ITEM_ID : iItemIdToDelete,
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();
			// assert
			var aItems = getItemsFromResponse(oDefaultResponseMock);
			var oNewLeafItem = getItem(aItems, iParentItemId);

			expect(oNewLeafItem.PRICE_SOURCE_ID).toEqual(constants.PriceSource.ManualPrice);
		});
		
		it("(price determination) should set price source to manual rate for former parent (internal activity) after the last child was deleted", function() {
			// arrange
			var iItemIdToDelete = oItemTemporaryTestData.ITEM_ID[2];
			var iParentItemId = oItemTemporaryTestData.PARENT_ITEM_ID[2];
			oMockstar.execSingle(`update {{itemTemporary}} set ITEM_CATEGORY_ID = 3 where item_id = ${iParentItemId} and calculation_version_id = ${oItemTemporaryTestData.CALCULATION_VERSION_ID[2]}`);

			var oItemToDelete = {
					ITEM_ID : iItemIdToDelete,
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			var aItems = getItemsFromResponse(oDefaultResponseMock);
			var oNewLeafItem = getItem(aItems, iParentItemId);

			expect(oNewLeafItem.PRICE_SOURCE_ID).toEqual(constants.PriceSource.ManualPrice);
		});

		it("(price determination) should reset price related fields of the former parent after last child was deleted", function() {
			// arrange
			var iItemIdToDelete = oItemTemporaryTestData.ITEM_ID[2];
			var iParentItemId = oItemTemporaryTestData.PARENT_ITEM_ID[2];
			var oItemToDelete = {
					ITEM_ID : iItemIdToDelete,
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};
			// calculation related price are set to 0 (calculation error if set to null!); others could be null
			var aPropertiesSetToBeNullOrZero = [ "PRICE", "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "PRICE_FOR_TOTAL_QUANTITY",
			                                     "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION", "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" ];

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			var aItems = getItemsFromResponse(oDefaultResponseMock);
			var oNewLeafItem = getItem(aItems, iParentItemId);

			jasmine.log("checking response object");
			_.each(aPropertiesSetToBeNullOrZero, function(sPropToBeNull) {
				jasmine.log(`testing ${sPropToBeNull} if null or zero`);
				expect(oNewLeafItem[sPropToBeNull] == null || oNewLeafItem[sPropToBeNull] == 0).toBeTruthy();
			});

			var oParentItemDb = oMockstar.execQuery(`select * from {{itemTemporary}} where ITEM_ID = ${oNewLeafItem.ITEM_ID} and CALCULATION_VERSION_ID = ${oNewLeafItem.CALCULATION_VERSION_ID} and SESSION_ID = '${sSessionId}'`);
			jasmine.log("checking data base");
			_.each(aPropertiesSetToBeNullOrZero, function(sPropToBeNull) {
				jasmine.log(`testing ${sPropToBeNull} if null or zero`);
				expect(oParentItemDb.columns[sPropToBeNull].rows[0] == null || oNewLeafItem[sPropToBeNull] == 0).toBeTruthy();
			});
		});

		it("(price determination) should set price unit of former parent to 1 after last child item was deleted", function() {
			// arrange
			var iItemIdToDelete = oItemTemporaryTestData.ITEM_ID[2];
			var iParentItemId = oItemTemporaryTestData.PARENT_ITEM_ID[2];
			var oItemToDelete = {
					ITEM_ID : iItemIdToDelete,
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			var aItems = getItemsFromResponse(oDefaultResponseMock);
			var oNewLeafItem = getItem(aItems, iParentItemId);

			expect(oNewLeafItem.PRICE_UNIT === 1 || oNewLeafItem.PRICE_UNIT === "1" || oNewLeafItem.PRICE_UNIT === "1.0000000").toBeTruthy();
		});

		it("(price determination) should set confidence level to very low of former parent after last child item was deleted", function() {
			// arrange
			var iItemIdToDelete = oItemTemporaryTestData.ITEM_ID[2];
			var iParentItemId = oItemTemporaryTestData.PARENT_ITEM_ID[2];
			var oItemToDelete = {
					ITEM_ID : iItemIdToDelete,
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			var aItems = getItemsFromResponse(oDefaultResponseMock);
			var oNewLeafItem = getItem(aItems, iParentItemId);

			expect(oNewLeafItem.CONFIDENCE_LEVEL_ID === 1 || oNewLeafItem.CONFIDENCE_LEVEL_ID === "1").toBeTruthy();
		});

		it('should mark item for deletion and return calculation when item exists', function() {
			// arrange
			var oItemToDelete = {
					ITEM_ID : oItemTemporaryTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};
			var before = oMockstar.execQuery(`select IS_DELETED from {{itemTemporary}} where ITEM_ID = ${oItemToDelete.ITEM_ID} and CALCULATION_VERSION_ID = ${oItemToDelete.CALCULATION_VERSION_ID} and SESSION_ID = '${sSessionId}'`);

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			var after = oMockstar.execQuery(`select IS_DELETED from {{itemTemporary}} where ITEM_ID = ${oItemToDelete.ITEM_ID} and CALCULATION_VERSION_ID = ${oItemToDelete.CALCULATION_VERSION_ID} and SESSION_ID = '${sSessionId}'`);

			expect(before.columns.IS_DELETED.rows[0]).toBe(0);
			expect(after.columns.IS_DELETED.rows[0]).toBe(1);
		});
		
		it('should throw general entity not found error when item does not exist', function() {
			// arrange
			var oItemToDelete = {
					ITEM_ID : oItemTemporaryTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};
			
			spyOn(oPersistency.Item, "markItemForDeletion");
			oPersistency.Item.markItemForDeletion.and.returnValue({DELETED_ITEM_COUNT: 0});
			
			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			
			//check that message details are set
			expect(oResponseObject.head.messages[0].details.itemObjs).toBeDefined();
			expect(oResponseObject.head.messages[0].details.itemObjs.length).toBe(1);
			expect(oResponseObject.head.messages[0].details.itemObjs[0].id).toBe(oItemTemporaryTestData.ITEM_ID[2]);
			expect(oResponseObject.head.messages[0].details.messageTextObj).toBe("Could not find item to delete.");
			expect($.trace.error).toHaveBeenCalled();
		});

		it('should set calculation version to dirty', function() {
			// arrange
			var oItemToDelete = {
					ITEM_ID : oItemTemporaryTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			checkCalculationVersionSetDirty(true, oDefaultResponseMock, oItemToDelete.CALCULATION_VERSION_ID);
		});
		
		it('should add the parent item id of the deleted item to the global table send to AFL if item deleted is the last child', function() {
			// arrange
			var oItemToDelete = {
					ITEM_ID : oItemTemporaryTestData.ITEM_ID[2],
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			//check the item ids that are send to AFL
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items", "ITEM_ID= '" + oItemTemporaryTestData.PARENT_ITEM_ID[2] + "'")).toBe(1);
		});
		
		it('should add the parent item id of the deleted item to the global table send to AFL if item deleted is not the last child', function() {
			// arrange
			var oExistingItem = mockstar_helpers.convertToObject(testData.oItemTemporaryTestData, 1); 
			oExistingItem.ITEM_ID = 3005;
			oExistingItem.PARENT_ITEM_ID = 3001;
			oMockstar.insertTableData("itemTemporary", oExistingItem);  
			
			var oItemToDelete = {
					ITEM_ID : 3005,
					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert
			//check the item ids that are send to AFL
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "gtt_changed_items", "ITEM_ID= '" + oExistingItem.PARENT_ITEM_ID + "'")).toBe(1);
		});
		
		it("should deactivate all assemblies without any activate children if the last activate child is removed from an assembly", function() {
			// arrange	
			// construct item structure: 3001 <- 3002 <- 3003, 3004; 3003 is deactivated; if item 3004 is removed then 3002 has no active children
			// anymore and should be deactivated; after deactivating 3002 also 3001 has no active children and should be deactivated as well
			oMockstar.clearTable("itemTemporary");
			var oItemStructure = {
				SESSION_ID: [sSessionId, sSessionId, sSessionId, sSessionId],
				ITEM_ID: [3001, 3002, 3003, 3004],
				PARENT_ITEM_ID: [null, 3001, 3002, 3002],
				CALCULATION_VERSION_ID: [iCvId, iCvId, iCvId, iCvId],
				IS_ACTIVE: [1, 1, 0, 1],
				ITEM_CATEGORY_ID: [1, 1, 1, 1],
				CHILD_ITEM_CATEGORY_ID: [1, 1, 1, 1],
				IS_DIRTY: [0, 0, 0, 0],
				IS_DELETED: [0, 0, 0, 0]
			};
			oMockstar.insertTableData("itemTemporary", oItemStructure);

			// create JS object to delete item 3004 for the request
			var oItemToDelete = {
				ITEM_ID: 3004,
				CALCULATION_VERSION_ID: iCvId
			};

			// act
			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

			// assert; check the t_item_temporary if item 3001 and 3002 are activated
			var oDbResult = oMockstar.execQuery("select * from {{itemTemporary}} where is_deleted = 0 order by item_id");
			_.each(oDbResult.columns.ITEM_ID.rows, function(iItemId, iIndex) {
				var iIsActive = oDbResult.columns.IS_ACTIVE.rows[iIndex];
				jasmine.log(`checking if item ${iItemId} is deactivated. IS_ACTIVE should be 0 and is ${iIsActive}`);
				expect(iIsActive).toEqual(0);
			});
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
    		it("should set 1 for *IS_MANUAL custom field, when the custom field has rollup and becomes leaf (from parent)", function() {
    			// arrange
    			var iItemIdToDelete = oItemTemporaryTestData.ITEM_ID[2];
    			var oItemToDelete = {
    					ITEM_ID : iItemIdToDelete,
    					CALCULATION_VERSION_ID : oItemTemporaryTestData.CALCULATION_VERSION_ID[2]
    			};

    			var oParentItemExtDb = oMockstar.execQuery(`select * from {{itemTemporaryExt}} where ITEM_ID = ${oItemTemporaryTestData.PARENT_ITEM_ID[2]} and CALCULATION_VERSION_ID = ${oItemTemporaryTestData.CALCULATION_VERSION_ID[2]} and SESSION_ID = '${oItemTemporaryTestData.SESSION_ID[2]}'`);
    			var oParentItemExtDbObj = mockstar_helpers.convertToObject(mockstar_helpers.convertResultToArray(oParentItemExtDb), 0);

				// act
    			new Dispatcher(oCtx, prepareRequest(oItemToDelete), oDefaultResponseMock).dispatch();

    			// assert
    			var oLeafItemExtDb = oMockstar.execQuery(`select * from {{itemTemporaryExt}} where ITEM_ID = ${oItemTemporaryTestData.PARENT_ITEM_ID[2]} and CALCULATION_VERSION_ID = ${oItemTemporaryTestData.CALCULATION_VERSION_ID[2]} and SESSION_ID = '${oItemTemporaryTestData.SESSION_ID[2]}'`);
    			var oLeafItemExtDbObj = mockstar_helpers.convertToObject(mockstar_helpers.convertResultToArray(oLeafItemExtDb), 0);

				//assert custom fields for parent
    			expect(oParentItemExtDbObj.CUST_INT_FORMULA_IS_MANUAL).toEqual(null);

    			//assert custom fields for the parent that becomes leaf (after deletion)
    			expect(oLeafItemExtDbObj.CUST_INT_FORMULA_IS_MANUAL).toEqual(1);

    		});
		}

    });
    
}).addTags(["Items_Integration"]);