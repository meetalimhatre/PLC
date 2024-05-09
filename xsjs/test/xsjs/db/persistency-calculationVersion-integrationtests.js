var _ = require("lodash");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var PersistencyImport = $.import("xs.db", "persistency");
var PersistencyItemImport = require("../../../lib/xs/db/persistency-item");
var Persistency = PersistencyImport.Persistency;
var CalculationVersionImport = require("../../../lib/xs/db/persistency-calculationVersion");
var Constants = require("../../../lib/xs/util/constants");
var mTableNames = CalculationVersionImport.Tables;
var testData = require("../../testdata/testdata").data;
var testDataGenerator = require("../../testdata/testdataGenerator");
var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var test_helpers = require("../../testtools/test_helpers");
var InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
var sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;
describe(
		"xsjs.db.persistency-calculationVersion-integrationtests",
		function() {

			var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase();
			var sUserId = $.session.getUsername();

			/**
			 * Helper function to compare a row from db with the expected one.
			 */
			function compareDbResultWithExpected(result, oExpectedResult, aPropertiesToExclude) {
				expect(result).toBeDefined();

				if (aPropertiesToExclude !== undefined) {
					oExpectedResult = _.omit(oExpectedResult, aPropertiesToExclude);
				}
				var aKeysToCheck = _.keys(oExpectedResult);
				// compare the values from db with expected ones
				_.each(aKeysToCheck, function(sKey, iIndex) {
					var oDbValue = result.columns[sKey].rows[0];
					var oExpectedValue = oExpectedResult[sKey];
					if (oDbValue instanceof Date) {
						expect((new Date(oDbValue)).getTime() - (new Date(oExpectedValue)).getTime()).toBeLessThan(86400000);
					} else {
						expect(oDbValue).toEqual(oExpectedValue);
					}
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('create', function() {

					var persistency = null;
					var oMockstar = null;
					var itemOriginalProcedures = null;

					var iCalculationId = 1234;
					var sLanguage = "DE";
					var sSessionId = "sessionID";
					var sDateString = new Date().toJSON();
					var sComponent_structure_description = "Test Structure Description";
					var sComponentSplitId = "01";
					var sCalculationName = "CalculationName";
					var iFirstAccountComponentId = 10;
					var iSecondAccountComponentId = 20;
					var sFirstAccountComponentDescription = "FirstDescription";
					var sSecondAccountComponentDescription = "SecondDescription";

					var aCalculationVersionTestData = [ {
						SESSION_ID : sSessionId,
						CALCULATION_ID : iCalculationId,
						CALCULATION_VERSION_NAME : sCalculationName,
						ROOT_ITEM_ID : 3001,
						COMPONENT_SPLIT_ID : sComponentSplitId,
						REPORT_CURRENCY_ID : "EUR",
						VALUATION_DATE : sDateString,
						MASTER_DATA_TIMESTAMP : sDateString,
						MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy,
						ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy,
						ITEMS : [ {
							CALCULATION_VERSION_ID : -1,
							ITEM_ID : -1,
							IS_ACTIVE : 1,
							ITEM_CATEGORY_ID : 0,
							CHILD_ITEM_CATEGORY_ID : 0,
							IS_DIRTY : 1,
							IS_DELETED : 0
						} ]
					} ];

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							testmodel : {
								create_item : "sap.plc.db.calculationmanager.procedures/p_item_create",
							},
							substituteTables : {
								calculation_version_temporary : mTableNames.calculation_version_temporary,
								open_calculation_versions : mTableNames.open_calculation_versions,
								item_temporary : "sap.plc.db::basis.t_item_temporary",
								item : "sap.plc.db::basis.t_item",
								recent_calculation_versions : mTableNames.recent_calculation_versions
							}
						});

						if (!oMockstar.disableMockstar) {
							itemOriginalProcedures = PersistencyItemImport.Procedures;

							PersistencyItemImport.Procedures = Object.freeze({
								create_item : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_item_create'
							});
						}
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.initializeData();

						persistency = new Persistency(jasmine.dbConnection);
					});

					afterOnce(function() {
						if (!oMockstar.disableMockstar) {
							PersistencyItemImport.Procedures = itemOriginalProcedures;

							oMockstar.cleanup();
						}
					});

					it('should create Calculation Version when validInput --> new CalculationVersion returned', function() {
						// arrange
						var oBodyCalculationVersion = _.clone(aCalculationVersionTestData[0]);

						// act
						var oResultObject = persistency.CalculationVersion.create(oBodyCalculationVersion, sSessionId, sUserId);

						// assert

						// check the object returned
						expect(oResultObject).toBeDefined();
						expect(_.isObject(oResultObject)).toBeTruthy();
						var iCreatedCalculationVersionId = oResultObject.CALCULATION_VERSION_ID;
						expect(iCreatedCalculationVersionId).toBeGreaterThan(0); // check if the value is
						// taken from the db sequence

						// check the values inserted
						var result = oMockstar.execQuery("select * from {{calculation_version_temporary}} where calculation_version_id="
								+ iCreatedCalculationVersionId);
						compareDbResultWithExpected(result, oBodyCalculationVersion, [ "ITEMS" ]);

						result = oMockstar.execQuery("select * from {{open_calculation_versions}} where calculation_version_id="
								+ iCreatedCalculationVersionId + " and session_id='" + aCalculationVersionTestData[0].SESSION_ID + "'");
						expect(result).toBeDefined();
					});

					it('should not create Calculation Version when valid calculation input and no Db sequence available'
							+ '--> exception is thrown', function() {
						// arrange
						var oBodyCalculationVersion = _.clone(aCalculationVersionTestData[0]);

						var oHQueryMock = jasmine.createSpyObj("oHQueryMock", [ "statement" ]);
						oHQueryMock.statement.and.callFake(function() {
							if (oHQueryMock.statement.calls.mostRecent().args[0].indexOf('nextval') !== -1) {
								return {
									execute : function() {
										return [];
									}
								};
							} else {
								throw new Error("corrupted test");
							}
						});
						persistency.CalculationVersion.helper.setHQuery(oHQueryMock);

						var exception = null;
						// act
						try {
							persistency.CalculationVersion.create(oBodyCalculationVersion, sSessionId, sUserId);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					});

					it('should not create Calculation Version when valid calculation input and negative db sequence value'
							+ ' --> exceptionThrown', function() {
						// arrange
						var oBodyCalculationVersion = _.clone(aCalculationVersionTestData[0]);

						var oHQueryMock = jasmine.createSpyObj("oHQueryMock", [ "statement" ]);
						oHQueryMock.statement.and.callFake(function() {
							if (oHQueryMock.statement.calls.mostRecent().args[0].indexOf('nextval') !== -1) {
								return {
									execute : function() {
										return [ -1 ];
									}
								};
							} else {
								throw new Error("corrupted test");
							}
						});
						persistency.CalculationVersion.helper.setHQuery(oHQueryMock);

						var exception = null;
						// act
						try {
							persistency.CalculationVersion.create(oBodyCalculationVersion, sSessionId, sUserId);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('exists', function() {
					var oMockstar = null;

					var aCalcVersionsTestData = [ {
						CALCULATION_VERSION_ID : 1000,
						CALCULATION_ID : 5000,
						CALCULATION_VERSION_NAME : "Baseline",
						ROOT_ITEM_ID : 1,
						REPORT_CURRENCY_ID : "EUR",
						COSTING_SHEET_ID : "CS_ID",
						COMPONENT_SPLIT_ID : "CP_ID",
						LAST_MODIFIED_ON : "2015-01-01 00:00:00",
						LAST_MODIFIED_BY : "User",
						VALUATION_DATE : new Date().toJSON(),
						MASTER_DATA_TIMESTAMP : new Date().toJSON(),
						MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy,
						ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy
					} ];

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version : mTableNames.calculation_version,
							}
						});
					});
					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.initializeData();
					});
					afterOnce(function() {
						oMockstar.cleanup();
					});

					it("should return false when calculation version table empty", function() {
						// arrange
						var iCalcVersionId = 4711;
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var result = unitUnderTest.CalculationVersion.exists(iCalcVersionId);

						// assert
						expect(result).toBe(false);
					});

					it("should return true when calculation version id exists in calculation version table", function() {
						// arrange
						var iCalcVersionId = 1001;
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						oMockstar.insertTableData("calculation_version", aCalcVersionsTestData);

						// act
						var result = unitUnderTest.CalculationVersion.exists(iCalcVersionId);

						// assert
						expect(result).toBe(false);
					});

					it("should return false when calculation version id does not exists in calculation version table", function() {
						// arrange
						var iCalcVersionId = 1000;
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						oMockstar.insertTableData("calculation_version", aCalcVersionsTestData);

						// act
						var result = unitUnderTest.CalculationVersion.exists(iCalcVersionId);

						// assert
						expect(result).toBe(true);
					});
				});
			}
		
			describe('Open Version', function() {

				var oMockstar;
				var sLanguage = "EN";
				// var oMockstarCust = null;
				var testPackage = $.session.getUsername().toLowerCase();
				var originalProcedures = null;
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase();
				var unitUnderTest;

				var oTimeoutValues = {
					APPLICATION_TIMEOUT_ID : [ "SessionTimeout" ],
					VALUE_IN_SECONDS : [ 600 ]
				};

				var oSessionValues = {
					SESSION_ID : [ "Session_A", "Session_B" ],
					USER_ID : [ "User_1", "User_2" ],
					LANGUAGE : [ "EN", "EN" ],
					LAST_ACTIVITY_TIME : [ '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z' ]
				};
				var oOpenedCalculationVersions = {
					"SESSION_ID" : [ "Session_A" ],
					"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
					"IS_WRITEABLE" : [ 1 ]
				};

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel : {
							"procCopy" : "sap.plc.db.calculationmanager.procedures/p_calculation_open_copy_to_temporary_tables",
							"procSave" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_save"
						},
						substituteTables : // substitute all used tables in the procedure or view
						{
							gtt_calculation_ids: "sap.plc.db::temp.gtt_calculation_ids",
							open_calculation_versions : "sap.plc.db::basis.t_open_calculation_versions",
							calculation_version_temporary : "sap.plc.db::basis.t_calculation_version_temporary",
							calculation_version : "sap.plc.db::basis.t_calculation_version",
							item_temporary : "sap.plc.db::basis.t_item_temporary",
							item : "sap.plc.db::basis.t_item",
							item_referenced_version_component_split : "sap.plc.db::basis.t_item_referenced_version_component_split",
							item_referenced_version_component_split_temporary : "sap.plc.db::basis.t_item_referenced_version_component_split_temporary",
							costing_sheet : "sap.plc.db::basis.t_costing_sheet",
							costing_sheet__text : "sap.plc.db::basis.t_costing_sheet__text",
							costing_sheet_row : "sap.plc.db::basis.t_costing_sheet_row",
							costing_sheet_row__text : "sap.plc.db::basis.t_costing_sheet_row__text",
							component_split__text : "sap.plc.db::basis.t_component_split__text",
							session : "sap.plc.db::basis.t_session",
							calculation : "sap.plc.db::basis.t_calculation",
							project : "sap.plc.db::basis.t_project",							
							application_timeout : "sap.plc.db::basis.t_application_timeout",
							item_temporary_ext : "sap.plc.db::basis.t_item_temporary_ext",
							item_ext : "sap.plc.db::basis.t_item_ext",
							recent_calculation_versions : mTableNames.recent_calculation_versions,
							component_split: "sap.plc.db::basis.t_component_split",
							component_split__text: "sap.plc.db::basis.t_component_split__text",
							costing_sheet: "sap.plc.db::basis.t_costing_sheet",
							costing_sheet__text: "sap.plc.db::basis.t_costing_sheet__text",
							costing_sheet_row: "sap.plc.db::basis.t_costing_sheet_row",
							costing_sheet_row__text: "sap.plc.db::basis.t_costing_sheet_row__text",
							costing_sheet_base:"sap.plc.db::basis.t_costing_sheet_base",
							costing_sheet_base_row: "sap.plc.db::basis.t_costing_sheet_base_row",
							costing_sheet_overhead:  "sap.plc.db::basis.t_costing_sheet_overhead",
							costing_sheet_overhead_row: "sap.plc.db::basis.t_costing_sheet_overhead_row",
							costing_sheet_row_dependencies: "sap.plc.db::basis.t_costing_sheet_row_dependencies",
						    currency: "sap.plc.db::basis.t_currency",
							unit_of_measure: "sap.plc.db::basis.t_uom",
							authorization : "sap.plc.db::auth.t_auth_project"
						}
					});

					if (!oMockstar.disableMockstar) {
						originalProcedures = CalculationVersionImport.Procedures;
						CalculationVersionImport.Procedures = Object.freeze({
							calculation_copy_temporary : procedurePrefix
									+ '.sap.plc.db.calculationmanager.procedures::p_calculation_open_copy_to_temporary_tables',
							calculation_open : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_version_open'

						});
					}
				});

				afterOnce(function() {
					oMockstar.cleanup(testPackage + "sap.plc.db.calculationmanager.procedures");
				});

				beforeEach(function() {
					oMockstar.clearAllTables(); // clear all specified substitute tables and views
					oMockstar.insertTableData("calculation", testData.oCalculationTestData);
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
					oMockstar.insertTableData("item_referenced_version_component_split", testData.oReferencedVersionComponentSplitTestData);
					oMockstar.insertTableData("item", testData.oItemTestData);
					oMockstar.insertTableData("session", testData.oSessionTestData);
					if (jasmine.plcTestRunParameters.generatedFields === true) {
						oMockstar.insertTableData("item_ext", testData.oItemExtData);
					}
					oMockstar.initializeData();

					unitUnderTest = new Persistency(jasmine.dbConnection,
							oMockstar.userSchema);
				});

				it('should copy items from source tables to temporary item table --> copy successful', function() {
					// assemble
					expect(mockstar_helpers.getRowCount(oMockstar, "item", "calculation_version_id=" + testData.iCalculationVersionId))
							.toBe(3);
					expect(
							mockstar_helpers.getRowCount(oMockstar, "item_temporary", "calculation_version_id="
									+ testData.iCalculationVersionId)).toBe(0);

					if (jasmine.plcTestRunParameters.generatedFields === true) {
						expect(
								mockstar_helpers.getRowCount(oMockstar, "item_ext", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBe(3);
						expect(
								mockstar_helpers.getRowCount(oMockstar, "item_temporary_ext", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBe(0);
					}

					var oExpectedData = JSON.parse(JSON.stringify(testData.oItemTemporaryTestData));
					_.each(oExpectedData, function(value, key) {
						oExpectedData[key] = value.splice(0, value.length - 2);
					});

					if (jasmine.plcTestRunParameters.generatedFields === true) {
						var oExpectedCustData = JSON.parse(JSON.stringify(testData.oItemTemporaryExtData));
						_.each(oExpectedCustData, function(value, key) {
							oExpectedCustData[key] = value.splice(0, value.length - 2);
						});
					}

					// act
					unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);

					// assert
					expect(
							mockstar_helpers.getRowCount(oMockstar, "item_temporary", "calculation_version_id="
									+ testData.iCalculationVersionId)).toBe(3);
					var result = oMockstar.execQuery("SELECT * FROM {{item_temporary}}");
					result = mockstar_helpers.convertResultToArray(result);
					expect(result).toMatchData(oExpectedData, [ "SESSION_ID", "ITEM_ID", "CALCULATION_VERSION_ID" ]);

					if (jasmine.plcTestRunParameters.generatedFields === true) {
						expect(
								mockstar_helpers.getRowCount(oMockstar, "item_temporary_ext", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBe(3);
						var resultCust = oMockstar.execQuery("SELECT * FROM {{item_temporary_ext}}");
						resultCust = mockstar_helpers.convertResultToArray(resultCust);
						expect(resultCust).toMatchData(oExpectedCustData, [ "SESSION_ID", "ITEM_ID", "CALCULATION_VERSION_ID" ]);
					}

					result = oMockstar.execQuery("SELECT * FROM {{item_referenced_version_component_split_temporary}}");
					expect(result).toMatchData(testData.oReferencedVersionComponentSplitTemporaryTestData, 
							[ "SESSION_ID", "MASTER_CALCULATION_VERSION_ID", "REFERENCED_CALCULATION_VERSION_ID", "COMPONENT_SPLIT_ID", "COST_COMPONENT_ID" ]);

				});

				it('should copy not items from source tables to temporary item table if specified', function() {
					// arrange
					// no data in temporary tables, already done in beforeOnce()

					// act
					unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, false);

					// assert
					// all temporary tables still need to be empty as data must not be copied
					expect(
							mockstar_helpers.getRowCount(oMockstar, "item_temporary", "calculation_version_id="
									+ testData.iCalculationVersionId)).toBe(0);

					if (jasmine.plcTestRunParameters.generatedFields === true) {
						expect(
								mockstar_helpers.getRowCount(oMockstar, "item_temporary_ext", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBe(0);
					}

					expect(
							mockstar_helpers.getRowCount(oMockstar, "item_referenced_version_component_split_temporary", "master_calculation_version_id="
									+ testData.iCalculationVersionId)).toBe(0);
				});
				
				it('should copy items from source tables to temporary item table if they are already there but with '
						+ 'another session id --> copy successful', function() {
					// assemble
					var iExpectedItemCount = 6;

					// act
					unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);
					unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSecondSessionId, testData.sSecondUser, sLanguage, true);

					// assert
					expect(
							mockstar_helpers.getRowCount(oMockstar, "item_temporary", "calculation_version_id="
									+ testData.iCalculationVersionId)).toBe(iExpectedItemCount);

					if (jasmine.plcTestRunParameters.generatedFields === true) {
						expect(
								mockstar_helpers.getRowCount(oMockstar, "item_temporary_ext", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBe(iExpectedItemCount);
					}

				});

				it('should copy items from source tables to temporary item table if other items are there with the same '
						+ 'session id (e.g. different version open) --> copy successful', function() {
					// assemble
					var iNewCalculationVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1];
					var iExpectedItemCount = 3;
					var iExpectedNewItemCount = 1;
					var iNewItemId = testData.oCalculationVersionTestData.ROOT_ITEM_ID[1];

					// act
					unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage);
					unitUnderTest.CalculationVersion.open(iNewCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage);

					// assert
					expect(
							mockstar_helpers.getRowCount(oMockstar, "item_temporary", "calculation_version_id="
									+ testData.iCalculationVersionId)).toBe(iExpectedItemCount);
					expect(mockstar_helpers.getRowCount(oMockstar, "item_temporary", "calculation_version_id=" + iNewCalculationVersionId))
							.toBe(iExpectedNewItemCount);
					expect(mockstar_helpers.getRowCount(oMockstar, "item", "item_id=" + iNewItemId)).toBe(1);

					if (jasmine.plcTestRunParameters.generatedFields === true) {
						expect(
								mockstar_helpers.getRowCount(oMockstar, "item_temporary_ext", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBe(iExpectedItemCount);
						expect(
								mockstar_helpers.getRowCount(oMockstar, "item_temporary_ext", "calculation_version_id="
										+ iNewCalculationVersionId)).toBe(iExpectedNewItemCount);
						expect(mockstar_helpers.getRowCount(oMockstar, "item_ext", "item_id=" + iNewItemId)).toBe(1);
					}

				});

				it('should not copy items from source tables to temporary item table that are already there with the '
						+ 'same session id --> not copied', function() {
					// assemble
					var iItemID = testData.oCalculationVersionTestData.ROOT_ITEM_ID[0];
					var iExpectedChangedQuantityValue = 666;

					// act
					unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);
					
					oMockstar.execSingle("UPDATE {{item_temporary}} SET TOTAL_QUANTITY = " + iExpectedChangedQuantityValue
							+ " WHERE ITEM_ID = " + iItemID + " AND CALCULATION_VERSION_ID = " + testData.iCalculationVersionId
							+ " AND SESSION_ID = '" + testData.sSessionId + "'");
					if (jasmine.plcTestRunParameters.generatedFields === true) {
						var iExpectedChangedCustManualStringValue = "Changed";
						oMockstar.execSingle("UPDATE {{item_temporary_ext}} SET CUST_STRING_MANUAL = '"
								+ iExpectedChangedCustManualStringValue + "' WHERE ITEM_ID = " + iItemID + " AND CALCULATION_VERSION_ID = "
								+ testData.iCalculationVersionId + " AND SESSION_ID = '" + testData.sSessionId + "'");
					}
					unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);

					// assert
					var result = oMockstar.execQuery("select TOTAL_QUANTITY from {{item_temporary}} WHERE ITEM_ID = " + iItemID
							+ " AND CALCULATION_VERSION_ID = " + testData.iCalculationVersionId + " AND SESSION_ID = '"
							+ testData.sSessionId + "'");
					expect(result).toBeDefined();
					// item temporary table should contain items now
					expect(parseFloat(result.columns.TOTAL_QUANTITY.rows[0]).toString()).toEqual(iExpectedChangedQuantityValue.toString());

					if (jasmine.plcTestRunParameters.generatedFields === true) {
						var result = oMockstar.execQuery("select CUST_STRING_MANUAL from {{item_temporary_ext}} WHERE ITEM_ID = " + iItemID
								+ " AND CALCULATION_VERSION_ID = " + testData.iCalculationVersionId + " AND SESSION_ID = '"
								+ testData.sSessionId + "'");
						expect(result).toBeDefined();
						// item temporary table should contain items now
						expect(result.columns.CUST_STRING_MANUAL.rows[0]).toEqual(iExpectedChangedCustManualStringValue);
					}

				});

				if (jasmine.plcTestRunParameters.mode === 'all') {
					it('should copy calculation version from source tables to temporary calculation version tables'
							+ ' --> copy successful', function() {
						// assemble
						var iExpectedCalculationVersionCount = 1;

						var oExpectedData = JSON.parse(JSON.stringify(testData.oCalculationVersionTemporaryTestData));
						_.each(oExpectedData, function(value, key) {
							oExpectedData[key] = value.splice(0, value.length - 2);
						});

						// act
						unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);

						// assert
						expect(
								mockstar_helpers.getRowCount(oMockstar, "calculation_version_temporary", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBe(iExpectedCalculationVersionCount);
						expect(
								mockstar_helpers.getRowCount(oMockstar, "item_temporary", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBeGreaterThan(0); // item temporary table
						// should contain items now

						var result = oMockstar.execQuery("SELECT * FROM {{calculation_version_temporary}}");
						result = mockstar_helpers.convertResultToArray(result);

						expect(result).toMatchData(oExpectedData, [ "SESSION_ID", "CALCULATION_VERSION_ID" ]);
					});

					it('should copy calculation version from source tables to temporary calculation version tables if it '
							+ 'is already there but with another session id  --> copy successful', function() {
						// assemble
						var iExpectedCalculationVersionCount = 2;

						// act
						unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);
						unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSecondSessionId, testData.sSecondUser, sLanguage, true);

						// assert
						expect(
								mockstar_helpers.getRowCount(oMockstar, "calculation_version_temporary", "calculation_version_id="
										+ testData.iCalculationVersionId)).toBe(iExpectedCalculationVersionCount);
					});

					it('should not copy calculation version from source tables to temporary calculation version tables if it '
							+ 'is already there with the same session id  --> not copied', function() {
						// assemble
						var iExpectedChangedQuantityValue = 666;

						// act
						unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);
						
						oMockstar.execSingle("UPDATE {{calculation_version_temporary}} SET SALES_PRICE = " + iExpectedChangedQuantityValue
								+ " WHERE CALCULATION_VERSION_ID = " + testData.iCalculationVersionId + " AND SESSION_ID = '"
								+ testData.sSessionId + "'");
						
						unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);

						// assert
						var result = oMockstar
								.execQuery("select SALES_PRICE from {{calculation_version_temporary}} WHERE CALCULATION_VERSION_ID = "
										+ testData.iCalculationVersionId + " AND SESSION_ID = '" + testData.sSessionId + "'");
						expect(result).toBeDefined();
						// calculation version temporary table should still contain changed value
						expect(parseFloat(result.columns.SALES_PRICE.rows[0]).toString()).toEqual(iExpectedChangedQuantityValue.toString());
					});


					it('should open a calculation version and return an object containing, version and items', function() {
						// act
						var oOpenedVersion = unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId,
								testData.sSessionId, testData.sTestUser, sLanguage, true);

						// assert
						expect(oOpenedVersion.version).toBeDefined();
						expect(oOpenedVersion.items).toBeDefined();
					});

					
					
					it('should update recently used calculation versions table when open is succesfull', function() {
						// assemble
						var queryResultBefore = oMockstar.execQuery("select count(*) as count from {{recent_calculation_versions}}");

						// act
						unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, sLanguage, true);

						// assert
						var queryResultAfter = oMockstar.execQuery("select count(*) as count from {{recent_calculation_versions}}");
                        expect(queryResultBefore).toBeDefined();
                        expect(queryResultBefore.columns.COUNT.rows[0].toString()).toBe('0');
                        expect(queryResultAfter).toBeDefined();
                        expect(queryResultAfter.columns.COUNT.rows[0].toString()).toBe('1');                        
					});			
					
				    it('should return all the information about referenced calculation versions if they are in calculation', function() {
				        //arrange
				    	//insert into tables calculation version with items that are of type reference version
				    	//and all the information about the version: calculation, project, root item, masterdata
				        oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			            oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			            oMockstar.insertTableData("project", testData.oProjectTestData);
			            var sExpectedDate = new Date().toJSON();
			            oMockstar.insertTableData("item", {
            					"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
            					"CALCULATION_VERSION_ID" : [2810, 2810, 2, 4811, 4811], //calculation 2810 has one referenced version 2809
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
            			//masterdata
            		    oMockstar.insertTableData("currency", testData.mCsvFiles.currency);
            		    oMockstar.insertTableData("unit_of_measure", testData.mCsvFiles.uom);
            		    oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
            		    oMockstar.insertTableData("costing_sheet__text", testData.oCostingSheetTextTestData);
            		    oMockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
            		    oMockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
            		    oMockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
            		    oMockstar.insertTableData("costing_sheet_overhead", testData.oCostingSheetOverheadTestData);
            		    oMockstar.insertTableData("component_split", testData.oComponentSplitTest);
            			
            			// act
						var result = unitUnderTest.CalculationVersion.open(2810, testData.sSessionId, testData.sTestUser, sLanguage, true);

						// assert
						expect(result.referencesdata.CALCULATIONS.length).toBe(1);
						expect(result.referencesdata.CALCULATIONS[0].CALCULATION_ID).toBe(1978);
						expect(result.referencesdata.CALCULATIONS[0].PROJECT_ID).toBe("PR1");
						expect(result.referencesdata.PROJECTS.length).toBe(1);
						expect(result.referencesdata.PROJECTS[0].PROJECT_ID).toBe("PR1");
						expect(result.referencesdata.CALCULATION_VERSIONS.length).toBe(1);
						expect(result.referencesdata.CALCULATION_VERSIONS[0].ITEMS.length).toBe(1);
						expect(result.referencesdata.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID).toBe(result.referencesdata.CALCULATION_VERSIONS[0].ITEMS[0].CALCULATION_VERSION_ID);
						//masterdata
						expect(result.referencesdata.MASTERDATA.CURRENCY_ENTITIES.length).toBe(1);
						expect(result.referencesdata.MASTERDATA.UNIT_OF_MEASURE_ENTITIES.length > 0).toBeTruthy();
						expect(result.referencesdata.MASTERDATA.COMPONENT_SPLIT_ENTITIES.length).toBe(1);
						expect(result.referencesdata.MASTERDATA.COSTING_SHEET_ENTITIES.length).toBe(1);
						expect(result.referencesdata.MASTERDATA.COSTING_SHEET_ROW_ENTITIES.length).toBe(6);
				    });
				}
                
                describe('SetVersionLock', function() {
                	
        		    function enterPrivilege(sProjectId, sUserId, sPrivilege){
        		        oMockstar.insertTableData("authorization",{
        		           PROJECT_ID   : [sProjectId],
        		           USER_ID      : [sUserId],
        		           PRIVILEGE    : [sPrivilege]
        		        });
        		    }
				   
				    it('should open a calculation version that is not opened yet and set the write lock --> lock successful ' 
				    		+ '(user has CREATE_EDIT instance-based privilege)', function() {
	                	// assemble
						var iExpectedLock = 1;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	var result = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE, CONTEXT from {{open_calculation_versions}}");
	                	expect(result).toBeDefined();
	                	var expectedResultJsonData = {
	                		"SESSION_ID" : [ testData.sSessionId ],
	                		"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
							"IS_WRITEABLE" : [ iExpectedLock ],
							"CONTEXT" : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION ]
	                	};
	                	expect(result).toMatchData(expectedResultJsonData, [ 'SESSION_ID' ]);
	                });
				    
				    it('should open a calculation version that is not opened yet and set the read lock --> open successful in read-only because ' 
				    		+ 'user has only READ instance-based privilege', function() {
	                	// assemble
	                	var iExpectedLock = 0;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	var result = oMockstar
	                			.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE, CONTEXT from {{open_calculation_versions}}");
	                	expect(result).toBeDefined();
	                	var expectedResultJsonData = {
	                		"SESSION_ID" : [ testData.sSessionId ],
	                		"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
							"IS_WRITEABLE" : [ iExpectedLock ],
							"CONTEXT" : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION ]
	                	};
	                	expect(result).toMatchData(expectedResultJsonData, [ 'SESSION_ID' ]);
	                });
	                
	                it('should open a calculation version that is already opened by somebody else in read-write mode '
	                			+ '--> open successful in read-only (user has CREATE_EDIT instance-based privilege)', function() {
	                	// assemble
	                	var iFirstExpectedLock = 1;
	                	var iSecondExpectedLock = 0;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                	
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE=" + iFirstExpectedLock + " AND CONTEXT = '" + Constants.CalculationVersionLockContext.CALCULATION_VERSION + "'")).toBe(1);
	                	
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSecondSessionId, testData.sSecondUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE=" + iFirstExpectedLock + " AND CONTEXT = '" + Constants.CalculationVersionLockContext.CALCULATION_VERSION + "'")).toBe(1);
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE=" + iSecondExpectedLock + " AND CONTEXT = '" + Constants.CalculationVersionLockContext.CALCULATION_VERSION + "'")).toBe(1);
	                });
	                
	                it('should open a calculation version that is already opened by somebody else in read-only mode'
	                		+ ' --> open successful in read-write (user has CREATE_EDIT instance-based privilege)', function() {
	                	// assemble
	                	var iFirstExpectedLock = 0;
	                	var iSecondExpectedLock = 1;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                	
	                	// set read-only mode to first result
	                	oMockstar.execSingle("UPDATE {{open_calculation_versions}} SET IS_WRITEABLE = " + iFirstExpectedLock
	                			+ " WHERE SESSION_ID = '" + testData.sSessionId + "' AND CALCULATION_VERSION_ID = '"
	                			+ testData.iCalculationVersionId + "'");
	                	
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSecondSessionId, testData.sSecondUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE='" + iFirstExpectedLock
	                					+ "' AND SESSION_ID = '" + testData.sSessionId + "'")).toBe(1);
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE='" + iSecondExpectedLock
	                					+ "' AND SESSION_ID = '" + testData.sSecondSessionId + "'")).toBe(1);
	                });
	                
	                it('should open a calculation version that is already opened by the same user in the same session '
	                							+ '--> not done anything (user has CREATE_EDIT instance-based privilege)', function() {
	                	// assemble
	                	var iFirstExpectedLock = 1;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE='" + iFirstExpectedLock
	                					+ "' AND SESSION_ID = '" + testData.sSessionId + "'")).toBe(1);
					});
					
					it('should open a calculation version that is already opened by the same user in the same session in a different lock context '
	                							+ '--> opened in read-only (user has CREATE_EDIT instance-based privilege)', function() {
	                	// assemble
	                	var iFirstExpectedLock = 1;
	                	var iSecondExpectedLock = 0;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.VARIANT_MATRIX);
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
						// assert
	                	expect(
							mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
									+ testData.iCalculationVersionId + " AND IS_WRITEABLE='" + iFirstExpectedLock
									+ "' AND SESSION_ID = '" + testData.sSessionId + "'"
									+ " AND CONTEXT = '" + Constants.CalculationVersionLockContext.VARIANT_MATRIX + "'"
								)).toBe(1);
						expect(
							mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
									+ testData.iCalculationVersionId + " AND IS_WRITEABLE='" + iSecondExpectedLock
									+ "' AND SESSION_ID = '" + testData.sSessionId + "'"
									+ " AND CONTEXT = '" + Constants.CalculationVersionLockContext.CALCULATION_VERSION + "'"
								)).toBe(1);
	                });
	                	                
	                it('should open a calculation version that is already opened by the same user in read only in the same session'
	                		+ ' --> reopened in read-only (user has READ instance-based privilege)', function() {
	                	// assemble
	                	var iFirstExpectedLock = 0;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// set read-only mode to first result
	                	oMockstar.execSingle("UPDATE {{open_calculation_versions}} SET IS_WRITEABLE = '0' WHERE SESSION_ID = '"
	                			+ testData.sSessionId + "' AND CALCULATION_VERSION_ID = '" + testData.iCalculationVersionId + "'");
	                
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "IS_WRITEABLE='" + iFirstExpectedLock
	                					+ "'")).toBe(1);
	                });	                
	                
	                it('should open a calculation version that is already opened by the same user and someone else in read only '
	                		+ 'in the same session --> reopened in read-only (user has READ instance-based privilege)', function() {
	                	// assemble
	                	var iFirstExpectedLock = 0;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], testData.sSecondUser, InstancePrivileges.READ);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSecondSessionId, testData.sSecondUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// make sure to have only all versions not locked (writable)
	                	oMockstar.execSingle("UPDATE {{open_calculation_versions}} SET IS_WRITEABLE = '0'");
	                
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "IS_WRITEABLE='" + iFirstExpectedLock
	                					+ "'" + "AND CALCULATION_VERSION_ID = '" + testData.iCalculationVersionId + "' and SESSION_ID = '"
	                					+ testData.sSessionId + "'")).toBe(1);
	                });	                
	                
	                it('should open a calculation version that is already opened by the same user read-only and someone else '
	                		+ 'in read-write in the same session --> reopened in read-only (user has CREATE_EDIT instance-based privilege)', function() {
	                	// assemble
	                	var iFirstExpectedLock = 1;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], testData.sSecondUser, InstancePrivileges.READ);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSecondSessionId, testData.sSecondUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                	
	                	// re-open
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "IS_WRITEABLE='" + iFirstExpectedLock
	                					+ "'" + "AND CALCULATION_VERSION_ID = '" + testData.iCalculationVersionId + "' and SESSION_ID = '"
	                					+ testData.sSessionId + "'")).toBe(0);
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "IS_WRITEABLE='" + iFirstExpectedLock
	                					+ "'" + "AND CALCULATION_VERSION_ID = '" + testData.iCalculationVersionId + "' and SESSION_ID = '"
	                					+ testData.sSecondSessionId + "'")).toBe(1);
	                });
	                
	                it('should open a calculation version in read mode if calculation version opened in timedout session (user has READ instance-based privilege)', function() {
	                	// arrange
	                	oMockstar.insertTableData("session", oSessionValues);
	                	oMockstar.insertTableData("application_timeout", oTimeoutValues);
	                	oMockstar.insertTableData("open_calculation_versions", oOpenedCalculationVersions);
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
	                
	                	// act
	                	var oOpenedVersion = unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId,
	                			testData.sSessionId, testData.sTestUser, 'EN', true);
	                    unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId,
	                			testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                    expect(mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE = 0 AND SESSION_ID = '"
	                					+ testData.sSessionId + "'")).toBe(1);
	                	expect(oOpenedVersion.version.CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
	                });
	                
	                it('should open a calculation version in write mode if calculation version opened in timedout session (user has CREATE_EDIT instance-based privilege)', function() {
	                	// arrange
	                	oMockstar.insertTableData("session", oSessionValues);
	                	oMockstar.insertTableData("application_timeout", oTimeoutValues);
	                	oMockstar.insertTableData("open_calculation_versions", oOpenedCalculationVersions);
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	// act
	                	var oOpenedVersion = unitUnderTest.CalculationVersion.open(testData.iCalculationVersionId,
	                			testData.sSessionId, testData.sTestUser, 'EN', true);
	                    unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId,
	                			testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                    expect(mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
            					+ testData.iCalculationVersionId + " AND IS_WRITEABLE = 1 AND SESSION_ID = '"
            					+ testData.sSessionId + "'")).toBe(1);
	                	expect(oOpenedVersion.version.CALCULATION_VERSION_ID).toBe(testData.iCalculationVersionId);
	                });
	                
	                it('should open a calculation version that is already opened by somebody else, and session is '
	                		+ 'not timedout, in read-only mode (user has CREATE_EDIT instance-based privilege)', function() {
	                	// arrange
	                	var oSessionValuesCurrent = {
	                		SESSION_ID : [ "Session_A" ],
	                		USER_ID : [ "User_1" ],
	                		LANGUAGE : [ "EN" ],
	                		LAST_ACTIVITY_TIME : [ new Date() ]
	                	};
	                	oMockstar.insertTableData("session", oSessionValuesCurrent);
	                	oMockstar.insertTableData("application_timeout", oTimeoutValues);
	                	oMockstar.insertTableData("open_calculation_versions", oOpenedCalculationVersions);
	                
	                	var iFirstExpectedLock = 0;
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	// act
	                	unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	var iExpectedLock = 0;
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE='" + iExpectedLock + "' AND SESSION_ID = '"
	                					+ testData.sSessionId + "'")).toBe(1);
	                	expect(
	                			mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                					+ testData.iCalculationVersionId + " AND IS_WRITEABLE='" + 1 + "' AND SESSION_ID = 'Session_A'"))
	                			.toBe(1);
					});
	                
	                it('should not release the lock of the Calculation Version even if in timedout session if it is '
	                		+ 'not requested by someone else (user has CREATE_EDIT instance-based privilege)', function() {
	                	// arrange
	                	var iRequestedCalcVersionId = 1212;
	                	var oOpenedCalcVers = {
	                		"SESSION_ID" : [ "Session_A", "Session_B" ],
	                		"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId, iRequestedCalcVersionId ],
	                		"IS_WRITEABLE" : [ 1, 1 ]
	                	};
	                
	                	oMockstar.insertTableData("session", oSessionValues);
	                	oMockstar.insertTableData("application_timeout", oTimeoutValues);
	                	oMockstar.insertTableData("open_calculation_versions", oOpenedCalcVers);
	                	var queryResultBefore = mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions",
	                			"calculation_version_id=" + iRequestedCalcVersionId + " AND IS_WRITEABLE='" + 1
	                					+ "' AND SESSION_ID = 'Session_B'");
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	// act
	                	var oOpenedVersion = unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId,
	                			testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	var queryResult = mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "calculation_version_id="
	                			+ iRequestedCalcVersionId + " AND IS_WRITEABLE='" + 1 + "' AND SESSION_ID = 'Session_B'");
	                	expect(queryResult).toEqual(queryResultBefore);
	                	expect(queryResult).toBe(1);
	                });
	                
	                it('should release the locks for all calculation versions from a timedout session (user has CREATE_EDIT instance-based privilege)', function() {
	                	// arrange
	                	var iRequestedCalcVersionId = 1212;
	                
	                	var oOpenedCalcVers = {
	                		"SESSION_ID" : [ "Session_A", "Session_A" ],
	                		"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId, iRequestedCalcVersionId ],
	                		"IS_WRITEABLE" : [ 1, 1 ]
	                	};
	                	enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
	                
	                	oMockstar.insertTableData("session", oSessionValues);
	                	oMockstar.insertTableData("application_timeout", oTimeoutValues);
	                	oMockstar.insertTableData("open_calculation_versions", oOpenedCalcVers);
	                
	                	// act
	                	var oOpenedVersion = unitUnderTest.CalculationVersion.setVersionLock(testData.iCalculationVersionId,
	                			testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);
	                
	                	// assert
	                	var queryResult = mockstar_helpers.getRowCount(oMockstar, "open_calculation_versions", "IS_WRITEABLE='" + 1
	                			+ "' AND SESSION_ID = 'Session_A'");
	                	expect(queryResult).toBe(0);
	                });
			    });
            });

			describe('getWithoutItems', function() {
				var oMockstar;
				var persistency = null;
				var oCalculationVersionTemporaryTestData = new TestDataUtility(testData.oCalculationVersionTemporaryTestData).build();

				beforeOnce(function() {
					oMockstar = new MockstarFacade(
							{
								substituteTables: {
									calculation_version_temporary: {
										name: mTableNames.calculation_version_temporary,
										data: oCalculationVersionTemporaryTestData
									}
								}
							});
				});

				beforeEach(function() {
					persistency = new Persistency(jasmine.dbConnection); 
					oMockstar.clearAllTables();
					oMockstar.initializeData();
				});

				afterOnce(function() {
					oMockstar.cleanup();
				});

				it("should return a calculation version without items", function() {
					// arrange
					const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === testData.iCalculationVersionId;
					let oCalculationVersion = new TestDataUtility(oCalculationVersionTemporaryTestData).getObjects(fPredicate)[0];
					const aOmit = ["START_OF_PRODUCTION", "END_OF_PRODUCTION", "VALUATION_DATE", "LAST_MODIFIED_ON", "MASTER_DATA_TIMESTAMP"];
					oCalculationVersion = _.omit(oCalculationVersion, aOmit);
					// act
					var result = persistency.CalculationVersion.getWithoutItems([testData.iCalculationVersionId], testData.sSessionId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(1);
					const oResutlVersion = _.omit(result[0], aOmit);
					expect(oResutlVersion).toMatchData(oCalculationVersion, ["CALCULATION_VERSION_ID"]);
					expect(oResutlVersion.ITEMS).toBeUndefined();
				});

				it("should return an empty array if no calculation version is found in t_calculation_version_temporary", function() {
					// arrange
					oMockstar.clearTable("calculation_version_temporary")
					// act
					var result = persistency.CalculationVersion.getWithoutItems([testData.iCalculationVersionId], testData.sSessionId);

					// assert
					expect(result).toBeDefined();
        			expect(result.length).toBe(0);
				});

				it("should throw GENERAL_UNEXPECTED_EXCEPTION if the requested variant ids are not send inside an array", function() {
					// arrange
					var exception = null;

					// act
					try {
						persistency.CalculationVersion.getWithoutItems(testData.iCalculationVersionId, testData.sSessionId);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					expect(exception.developerMessage).toBe("aCalculationVersionIds must be an array.");
				});

				it("should throw GENERAL_UNEXPECTED_EXCEPTION if the requested array of variant ids contain negative numbers", function() {
					// arrange
					var exception = null;

					// act
					try {
						persistency.CalculationVersion.getWithoutItems([-5], testData.sSessionId);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					expect(exception.developerMessage).toBe("aCalculationVersionIds can only contain positive numbers.");
				});

				it("should throw GENERAL_UNEXPECTED_EXCEPTION if the requested array of variant ids contain strings", function() {
					// arrange
					var exception = null;

					// act
					try {
						persistency.CalculationVersion.getWithoutItems(["a"], testData.sSessionId);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					expect(exception.developerMessage).toBe("aCalculationVersionIds can only contain positive numbers.");
				});
				
				it("should throw GENERAL_UNEXPECTED_EXCEPTION if the sSessionId is not a string", function() {
					// arrange
					var exception = null;

					// act
					try {
						persistency.CalculationVersion.getWithoutItems([testData.iCalculationVersionId], 1234);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					expect(exception.developerMessage).toBe("sSessionId must be a string.");
				});
			});

			describe('getWithoutItemsPersistent', function() {
				var oMockstar;
				var persistency = null;
				var oCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).build();

				beforeOnce(function() {
					oMockstar = new MockstarFacade(
							{
								substituteTables: {
									calculation_version: {
										name: mTableNames.calculation_version,
										data: oCalculationVersionTestData
									}
								}
							});
				});

				beforeEach(function() {
					persistency = new Persistency(jasmine.dbConnection); 
					oMockstar.clearAllTables();
					oMockstar.initializeData();
				});

				afterOnce(function() {
					oMockstar.cleanup();
				});

				it("should return a calculation version without items", function() {
					// arrange
					const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === testData.iCalculationVersionId;
					let oCalculationVersion = new TestDataUtility(oCalculationVersionTestData).getObjects(fPredicate)[0];
					const aOmit = ["START_OF_PRODUCTION", "END_OF_PRODUCTION", "VALUATION_DATE", "LAST_MODIFIED_ON", "MASTER_DATA_TIMESTAMP"];
					oCalculationVersion = _.omit(oCalculationVersion, aOmit);
					// act
					var result = persistency.CalculationVersion.getWithoutItemsPersistent([testData.iCalculationVersionId], testData.sSessionId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(1);
					const oResutlVersion = _.omit(result[0], aOmit);
					expect(oResutlVersion).toMatchData(oCalculationVersion, ["CALCULATION_VERSION_ID"]);
					expect(oResutlVersion.ITEMS).toBeUndefined();
				});

				it("should return an empty array if no calculation version is found in t_calculation_version", function() {
					// arrange
					oMockstar.clearTable("calculation_version")
					// act
					var result = persistency.CalculationVersion.getWithoutItems([testData.iCalculationVersionId], testData.sSessionId);

					// assert
					expect(result).toBeDefined();
        			expect(result.length).toBe(0);
				});

				it("should throw GENERAL_UNEXPECTED_EXCEPTION if the requested variant ids are not send inside an array", function() {
					// arrange
					var exception = null;

					// act
					try {
						persistency.CalculationVersion.getWithoutItemsPersistent(testData.iCalculationVersionId, testData.sSessionId);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					expect(exception.developerMessage).toBe("aCalculationVersionIds must be an array.");
				});

				it("should throw GENERAL_UNEXPECTED_EXCEPTION if the requested array of variant ids contain negative numbers", function() {
					// arrange
					var exception = null;

					// act
					try {
						persistency.CalculationVersion.getWithoutItemsPersistent([-5], testData.sSessionId);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					expect(exception.developerMessage).toBe("aCalculationVersionIds can only contain positive numbers.");
				});

				it("should throw GENERAL_UNEXPECTED_EXCEPTION if the requested array of variant ids contain strings", function() {
					// arrange
					var exception = null;

					// act
					try {
						persistency.CalculationVersion.getWithoutItemsPersistent(["a"], testData.sSessionId);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					expect(exception.developerMessage).toBe("aCalculationVersionIds can only contain positive numbers.");
				});
			});

			if (jasmine.plcTestRunParameters.mode === 'all') {

				describe("getSaveRelevantFields", function() {

					var sSessionId = null;
					var iCvId = null;
					var aAuditFields = [ "CALCULATION_VERSION_ID", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY",  "IS_FROZEN", 
										 "CALCULATION_VERSION_NAME", "CALCULATION_VERSION_TYPE", "BASE_VERSION_ID", "LIFECYCLE_PERIOD_FROM" ];
					var oItemIdsOfVersion = [];

					var oMockstar = null;

					beforeOnce(function() {
						sSessionId = testData.oCalculationVersionTemporaryTestData.SESSION_ID[0];
						iCvId = testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0];
					});

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								calculation_version_temporary : mTableNames.calculation_version_temporary,
							}
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it("should contain only the specified version", function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);

						// act
						var oVersions = persistency.CalculationVersion.getSaveRelevantFields(sSessionId, iCvId);

						// assert
						expect(oVersions.CALCULATION_VERSION_ID).toEqual(iCvId);
					});

					it("should contain only audit fields", function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var aItemIds = testData.oItemTemporaryTestData.ITEM_ID;

						// act
						var oVersion = persistency.CalculationVersion.getSaveRelevantFields(sSessionId, iCvId);

						// assert
						var aOtherProperties = _.keys(_.omit(oVersion, aAuditFields));
						if (aOtherProperties.length > 0) {
							jasmine.log(`Calculation version ${oVersion.CALCULATION_VERSION_ID} does contain the following additional properties: ${aOtherProperties.join(", ")}
							 			(only ${aAuditFields.join(", ")} are allowed)`);
						}
						expect(aOtherProperties.length).toBe(0);
					});
				});
				
				
				describe("getOpenVersionsForProject", function() {

					var oMockstar = null;
					var persistency = null;
					var sExpectedDate = testData.sExpectedDate;
					var sTestUser = testData.sTestUser;

					var oOpenCalcVersionData = {
							SESSION_ID : [ "Session_A", "Session_B", "Session_C" ],
							CALCULATION_VERSION_ID : [ 1, 1, 2 ],
							IS_WRITEABLE : [ 1, 0, 1 ]
					};
					var oSessionData = {
							SESSION_ID : [ "Session_A", "Session_B", "Session_C", "Session_D" ],
							USER_ID : [ "USER_A", "USER_B", "USER_A", "USER_C" ],
							LANGUAGE : [ "DE", "EN", "DE", "EN" ],
							LAST_ACTIVITY_TIME : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate]
					};
					var oCalculationsVersionData = {
							CALCULATION_VERSION_ID : [ 1, 2, 3 ],
							CALCULATION_ID : [ 100, 100, 200 ],
							CALCULATION_VERSION_NAME : [ "Calculation Version Name 1", "Calculation Version Name 2", "Calculation Version Name 3" ],
							ROOT_ITEM_ID : [ 1, 2, 1 ],
							REPORT_CURRENCY_ID : [ "EUR", "EUR", "EUR" ],
							COSTING_SHEET_ID : [ "COGM", "COGM", "COGM" ],
							VALUATION_DATE : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
							LAST_MODIFIED_ON : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
							MASTER_DATA_TIMESTAMP : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
							LAST_MODIFIED_BY : [ "UserA", "UserB", "UserC" ],
							MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
							ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
					};

					var oCalculationsVersionsTemporaryData = {
					        SESSION_ID: ['USER_A', 'USER_B'],
							CALCULATION_VERSION_ID : [ 1, 2],
							CALCULATION_ID : [ 100, 100],
							CALCULATION_VERSION_NAME : [ "Calculation Version Name 1", "Calculation Version Name 2"],
							ROOT_ITEM_ID : [ 1, 2 ],
							REPORT_CURRENCY_ID : [ "EUR", "EUR"],
							COSTING_SHEET_ID : [ "COGM", "COGM"],
							VALUATION_DATE : [ new Date().toJSON(), new Date().toJSON()],
							LAST_MODIFIED_ON : [ new Date().toJSON(), new Date().toJSON()],
							MASTER_DATA_TIMESTAMP : [ new Date().toJSON(), new Date().toJSON()],
							LAST_MODIFIED_BY : [ "UserA", "UserB"],
							MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy],
							ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy]
					};
					
					var oCalculationData = {
							"CALCULATION_ID" : [ 100, 100, 200 ],
							"PROJECT_ID" : [ "1", "1", "1" ],
							"CALCULATION_NAME" : [ "Kalkulation Pumpe P-100", "Calculation Pump P-100", "Kalkulation Schluesselfinder" ],
							"CURRENT_CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ],
							"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
							"CREATED_BY" : [ sTestUser, sTestUser, sTestUser ],
							"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
							"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ]
						};

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								sessionTable : {
									name : mTableNames.session,
									data : oSessionData
								},
								openCalculationVersionsTable : {
									name : mTableNames.open_calculation_versions,
									data : oOpenCalcVersionData
								},
								calculationVersionTable : {
									name : mTableNames.calculation_version,
									data : oCalculationsVersionData
								},
								calculationVersionTableTemporary : {
									name : mTableNames.calculation_version_temporary,
									data : oCalculationsVersionsTemporaryData
								},
								calculation : {
									name : mTableNames.calculation,
									data : oCalculationData
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

					it("should return users when any calculation version of project is open in session", function() {
						// arrange
						var aExpectedUsers = [ {
							USER_ID : 'USER_A',
							CALCULATION_VERSION_ID : 1,
							CALCULATION_VERSION_NAME : "Calculation Version Name 1"
						}, {
							USER_ID : 'USER_B',
							CALCULATION_VERSION_ID : 1,
							CALCULATION_VERSION_NAME : "Calculation Version Name 1"
						}, {
							USER_ID : 'USER_A',
							CALCULATION_VERSION_ID : 2,
							CALCULATION_VERSION_NAME : "Calculation Version Name 2"
						} ];

						var sProjectId = "1";
						// act
						var result = persistency.CalculationVersion.getOpenVersionsForProject(sProjectId);
						// assert
						expect(result).toMatchData(aExpectedUsers, [ "USER_ID", "CALCULATION_VERSION_ID", "CALCULATION_VERSION_NAME"]);
					});

					it("should return empty if no calculation version belonging to project exists", function() {
						// arrange
						var aExpectedUsers = [];
						var sProjectId = "3";

						// act
						var result = persistency.CalculationVersion.getOpenVersionsForProject(sProjectId);
						// assert
						expect(result).toEqualObject(aExpectedUsers);
					});
					

				});

			}
			
			
			describe("getOpenLifecycleVersionsForBaseVersion", function() {

				var oMockstar = null;
				var persistency = null;
				var sSessionId = testData.sSessionId;
				let iBaseVersionId = testData.iCalculationVersionId;

				beforeOnce(function() {
					oMockstar = new MockstarFacade({
						substituteTables : {
						    calculation : {
								name : mTableNames.calculation,
								data : testData.oCalculationTestData
							},
							calculation_version : {
								name : mTableNames.calculation_version,
								data : testData.oCalculationVersionTestData
							},
							calculation_version_temporary : mTableNames.calculation_version_temporary,
							open_calculation_versions :mTableNames.open_calculation_versions,							
							session : {
								name : mTableNames.session,
								data : testData.oSessionTestData
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

				it("should return lifecycle versions if any lifecycle calculation version of base version is open in session", function() {
					// arrange
					
					//insert lifecycle version
					let iLifecycleVersionId = 4810;
					let oLifecycleCalculationVersion = mockstar_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
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
					
					// act
					let result = persistency.CalculationVersion.getOpenLifecycleVersionsForBaseVersion(iBaseVersionId);
					// assert
					// check result
					expect(result).toMatchData([
					        {
					            CALCULATION_VERSION_ID: iLifecycleVersionId,
					            CALCULATION_VERSION_NAME: oLifecycleCalculationVersion.CALCULATION_VERSION_NAME,
					            USER_ID: sUserId
					        }
					        ], ["CALCULATION_VERSION_ID", "CALCULATION_VERSION_NAME"]);
				});

				it("should return empty if no lifecycle version is opened", function() {
					// act
					let result = persistency.CalculationVersion.getOpenLifecycleVersionsForBaseVersion(iBaseVersionId);
					// assert
					expect(result).toEqualObject([]);
				});
				
				it("should return empty if lifecycle versions from other base versions are opened", function() {
				    // arrange
				    
				    let iOtherBaseVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2];
				    //insert lifecycle version
					let iLifecycleVersionId = 4810;
					let oLifecycleCalculationVersion = mockstar_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
					oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iLifecycleVersionId;
					oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = 2; 
					oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_1440'; 
					oLifecycleCalculationVersion.BASE_VERSION_ID = iOtherBaseVersionId; 
					oLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1440; 
					oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	
					oMockstar.insertTableData("calculation_version_temporary", _.extend(oLifecycleCalculationVersion, {SESSION_ID: sSessionId}));	
					
					// open lifecycle version
					oMockstar.insertTableData("open_calculation_versions", {
						SESSION_ID : [ sSessionId ],
						CALCULATION_VERSION_ID : [ iLifecycleVersionId ],
						IS_WRITEABLE : [ 0 ]
					});

					// act
					let result = persistency.CalculationVersion.getOpenLifecycleVersionsForBaseVersion(iBaseVersionId);
					// assert
					expect(result).toEqualObject([]);
				});
				
			  });


		describe('getCalculationResults', function() {
				// TODO:implement
			var oMockstar;
			var persistency;
			var oCostingSheetForOverheadCustom = {
				"COSTING_SHEET_ID" : "CS_TEST",
				"CONTROLLING_AREA_ID" : '#CA1',
				"IS_TOTAL_COST2_ENABLED" : 0,
				"IS_TOTAL_COST3_ENABLED" : 0,
				"_VALID_FROM" : '2015-01-01T00:00:00.000Z' ,
				"_VALID_TO" :null,
				"_SOURCE" : 1,
				"_CREATED_BY" : testData.sTestUser
			};
			
			var oCostingSheetRowForOverheadCustom = {
					"COSTING_SHEET_ROW_ID" : ["BASE", "OVHCF"],
					"COSTING_SHEET_ID" : ["CS_TEST", "CS_TEST"],
					"COSTING_SHEET_ROW_TYPE":[2,3],
					"COSTING_SHEET_BASE_ID":[9988,null],
					"ACCOUNT_GROUP_AS_BASE_ID": [ null,null],
					"COSTING_SHEET_OVERHEAD_ID": [ null , 8899],
					"CALCULATION_ORDER": [1, 2],
					"IS_RELEVANT_FOR_TOTAL": [1,1],
					"IS_RELEVANT_FOR_TOTAL2": [1,0],
					"IS_RELEVANT_FOR_TOTAL3": [1,0],
					"_VALID_FROM": [ '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
					"_VALID_TO": [ null, null],
					"_SOURCE": [ 1, 1],
					"_CREATED_BY": [ testData.sTestUser, testData.sTestUser ]
			};
			
			var oCostingSheetBaseForOverheadCustom =_.cloneDeep(testData.oCostingSheetBaseTestData);
			oCostingSheetBaseForOverheadCustom.COSTING_SHEET_BASE_ID[0] = 9988;

			var oCostingSheetBaseRowForOverheadCustom = _.cloneDeep(testData.oCostingSheetBaseRowTestData);
			oCostingSheetBaseRowForOverheadCustom.COSTING_SHEET_BASE_ID[0] = 9988;
			oCostingSheetBaseRowForOverheadCustom.ITEM_CATEGORY_ID[0] = 2;
			oCostingSheetBaseRowForOverheadCustom.SUBITEM_STATE[0] = -1;
			oCostingSheetBaseRowForOverheadCustom.CHILD_ITEM_CATEGORY_ID[0] = 2;
			oCostingSheetBaseRowForOverheadCustom._CREATED_BY = testData.sTestUser;

			var oCostingSheetOverheadForOverheadCustom = {
				"COSTING_SHEET_OVERHEAD_ID" : 8899,
				"CREDIT_ACCOUNT_ID" : null,
				"CREDIT_FIXED_COST_PORTION" : null,
				"IS_ROLLED_UP" : 1,
				"_VALID_FROM" : '2015-01-01T00:00:00.000Z',
				"_VALID_TO" : null,
				"_SOURCE" : 1,
				"_CREATED_BY" : testData.sTestUser,
				"USE_DEFAULT_FIXED_COST_PORTION" : 1
			}

			var oCostingSheetOverheadRowForOverheadCustom = {
				"COSTING_SHEET_OVERHEAD_ROW_ID" : 1,
				"COSTING_SHEET_OVERHEAD_ID" : 8899,
				"VALID_FROM" : '2010-01-01',
				"VALID_TO" :'2099-12-31',
				"CONTROLLING_AREA_ID" : "#CA1",
				"COMPANY_CODE_ID":  null,
				"BUSINESS_AREA_ID":  null,
				"PROFIT_CENTER_ID":  null,
				"PLANT_ID":  null,
				"OVERHEAD_GROUP_ID":  null,
				"OVERHEAD_PERCENTAGE":  null,
				"PROJECT_ID":  null,
				"ACTIVITY_TYPE_ID":  null,
				"COST_CENTER_ID":  null,
				"WORK_CENTER_ID":  null,
				"OVERHEAD_QUANTITY_BASED":  null,
				"OVERHEAD_CURRENCY_ID": null,
				"OVERHEAD_PRICE_UNIT": null,
				"OVERHEAD_PRICE_UNIT_UOM_ID": null,
				"CREDIT_FIXED_COST_PORTION" : null,
				"FORMULA_ID" : 1000,
				"_VALID_FROM" : '2015-01-01T00:00:00.000Z',
				"_VALID_TO" : null,
				"_SOURCE" : 1,
				"_CREATED_BY" : testData.sTestUser
			};

			var oCostingSheetOverheadRowFormulForOverheadCustom = {
				"FORMULA_ID" : 1000,
				"FORMULA_STRING" : "3=3",
				"FORMULA_DESCRIPTION" : "3=3",
				"OVERHEAD_CUSTOM" : "CUST_DECIMAL_WITHOUT_REF"
			}

			
			var oCostingSheetRowDependenciesForOverheadCustom = {
				"SOURCE_ROW_ID" : "OVHCF",
				"TARGET_ROW_ID" : "BASE",
				"COSTING_SHEET_ID" : "CS_TEST",
				"_VALID_FROM" : '2015-01-01T00:00:00.000Z',
				"_VALID_TO" : null,
				"_SOURCE" : 1,
				"_CREATED_BY" : testData.sTestUser
			};

			 var oCalculationVersionForOverheadCustom = _.cloneDeep(testData.oCalculationVersionTestData)
			 oCalculationVersionForOverheadCustom.COSTING_SHEET_ID[0] = "CS_TEST";
			 oCalculationVersionForOverheadCustom.COMPONENT_SPLIT_ID[0] = null;
			 var oCalculationVersionTemporaryForOverheadCustom = _.extend(JSON.parse(JSON.stringify(oCalculationVersionForOverheadCustom)), 
			 {
				"SESSION_ID" : [ testData.sTestUser, testData.sTestUser, testData.sTestUser ]
			 });
			 

			 var oItemExtDataForOverheadCustom = {
				"ITEM_ID" : [ 3001, 3002, 3003 ],
				"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId,testData.iCalculationVersionId, testData.iCalculationVersionId ],
				"CUST_DECIMAL_WITHOUT_REF_MANUAL":[10.0000000, 15.5000000, 20.0000000],
				"CUST_DECIMAL_WITHOUT_REF_CALCULATED":[null,null,null],
				"CUST_DECIMAL_WITHOUT_REF_UNIT":[null,null,null],
				"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":[null,null,null]
			};

			var oItemTemporaryExtData = _.extend(JSON.parse(JSON.stringify(oItemExtDataForOverheadCustom)), {
				"SESSION_ID" : [ testData.sSessionId, testData.sSessionId, testData.sSessionId, testData.sSessionId, testData.sSessionId ]
			});

			let oItemTestDataForOverheadCustom = _.cloneDeep(testData.oItemTestData);
			oItemTestDataForOverheadCustom.ITEM_CATEGORY_ID = [ 0, 2, 2, 0, 0 ];
			oItemTestDataForOverheadCustom.CHILD_ITEM_CATEGORY_ID = [ 0, 2, 2, 0, 0 ];
			oItemTestDataForOverheadCustom.PRICE_FIXED_PORTION = ['0.0000000', '10.0000000', '20.0000000', '371.1100000', '0.0000000']
			oItemTestDataForOverheadCustom.PRICE_VARIABLE_PORTION = ['0.0000000', '0.0000000', '30.0000000', '371.1100000', '0.0000000']
			oItemTestDataForOverheadCustom.PRICE_UNIT = ['0.0000000', '10.0000000', '10.0000000', '100.0000000', '0.0000000']

			let oItemTempDataForOverheadCustom = _.extend(JSON.parse(JSON.stringify(oItemTestDataForOverheadCustom)), {
				"SESSION_ID" : [ testData.sSessionId, testData.sSessionId, testData.sSessionId, testData.sSessionId, testData.sSessionId ]
			});

				beforeOnce(function(){
					oMockstar = new MockstarFacade(
						{
						testmodel : "sap.plc.db.calcengine.procedures/p_calculation",
						 substituteTables : // substitute all used tables in the procedure or view
						 {
							project : {
								name : "sap.plc.db::basis.t_project",
								data : testData.oProjectTestData
							},
							calculation : {
								name : mTableNames.calculation,
								data : testData.oCalculationTestData
							},
							calculation_version : {
								name : mTableNames.calculation_version,
								data : oCalculationVersionForOverheadCustom
							},
							calculation_version_temporary : {
								name : mTableNames.calculation_version_temporary,
								data : oCalculationVersionTemporaryForOverheadCustom
							},
							item : {
								name : mTableNames.item,
								data : oItemTestDataForOverheadCustom
							},

							item_temporary : {
								name: mTableNames.item_temporary,
								data : oItemTempDataForOverheadCustom
							},
							costing_sheet : {
								name : "sap.plc.db::basis.t_costing_sheet",
								data : oCostingSheetForOverheadCustom
							},
							costing_sheet_row : {
								name : "sap.plc.db::basis.t_costing_sheet_row",
								data : oCostingSheetRowForOverheadCustom
							},
							costing_sheet_base : {
								name :"sap.plc.db::basis.t_costing_sheet_base",
								data : oCostingSheetBaseForOverheadCustom

							},
							costing_sheet_base_row :  {
								name : "sap.plc.db::basis.t_costing_sheet_base_row",
								data : oCostingSheetBaseRowForOverheadCustom
							},
							costing_sheet_overhead : {
								name : "sap.plc.db::basis.t_costing_sheet_overhead",
								data : oCostingSheetOverheadForOverheadCustom
							},
							costing_sheet_overhead_row : {
								name : "sap.plc.db::basis.t_costing_sheet_overhead_row",
								data : oCostingSheetOverheadRowForOverheadCustom
							},
							costing_sheet_overhead_row_formula : {
								name : "sap.plc.db::basis.t_costing_sheet_overhead_row_formula",
								data : oCostingSheetOverheadRowFormulForOverheadCustom
							},
							costing_sheet_row_dependencies : {
								name : "sap.plc.db::basis.t_costing_sheet_row_dependencies",
								data : oCostingSheetRowDependenciesForOverheadCustom
							},
							item_temporary_ext : {
								name : mTableNames.item_temporary_ext,
								data : oItemTemporaryExtData
							},
							item_ext : {
								name : mTableNames.item_ext,
							},
							metadata : {
								name : "sap.plc.db::basis.t_metadata",
								data : testData.mCsvFiles.metadata
							},
							metadata_item_attributes : {
								name : "sap.plc.db::basis.t_metadata_item_attributes",
								data : testData.mCsvFiles.metadata_item_attributes
							},
							account : {
								name : "sap.plc.db::basis.t_account",
								data : testData.oAccountForItemTestData
							},
							account_group : {
								name : "sap.plc.db::basis.t_account_group",
								data : testData.oAccountGroupTest
							},
							account_account_group : {
								name : "sap.plc.db::basis.t_account_account_group",
								data : testData.oAccountAccountGroupTestData
							},
							material_price : {
								name : "sap.plc.db::basis.t_material_price",
								data : testData.oMaterialPriceTestDataPlc
							},
							recent_calculation_versions : mTableNames.recent_calculation_versions
						},
						substituteProcs : [ {
							name : "PLC_AREA_CALCULATE_FOR_DISPLAY_PROC",
							schema : "_SYS_AFL",
							testProc : "sap.plc_test.db.calcengine.procedures::afl_calculate_for_display"
						} ]
						 });
				})

				beforeEach(function(){
					persistency = new Persistency(jasmine.dbConnection);
					oMockstar.clearAllTables(); // clear all specified substitute tables and views
					oMockstar.initializeData();

					if(jasmine.plcTestRunParameters.generatedFields === true){
						oMockstar.insertTableData("item_ext", oItemExtDataForOverheadCustom);
						oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
					}

					
				})

				if(jasmine.plcTestRunParameters.generatedFields === true){
					it("should display Calculated Prices using a costing sheet with an overhead custom", function(){
	
						//arange
					oMockstar.execSingle(`UPDATE {{project}} SET CONTROLLING_AREA_ID = '#CA1' , END_OF_PROJECT = '2022-01-01', END_OF_PRODUCTION = '2022-01-01'`);
						var procedure = oMockstar.loadProcedure();
						//act

						var result = persistency.CalculationVersion.getCalculationResults(testData.iCalculationVersionId,testData.sTestUser);

						//assert
						expect(result).toBeDefined();

						var oSavedCostingSheetActualResults = mockstar_helpers.convertResultToArray(result.ITEM_CALCULATED_VALUES_COSTING_SHEET);
						let oItemCalculatedPrices = mockstar_helpers.convertResultToArray(result.ITEM_CALCULATED_PRICES);

						//checking if the arrays exist
						expect(oSavedCostingSheetActualResults).toBeDefined();
						expect(oItemCalculatedPrices).toBeDefined();

						//checking if the base and overhead rows contains the right values
						expect(oSavedCostingSheetActualResults).toMatchData({
							ITEM_ID: [3001,3001,3002,3002,3002,3002,3003,3003],
							COSTING_SHEET_ROW_ID: ["BASE","OVHCF","BASE","BASE","OVHCF","OVHCF","BASE","OVHCF"],
							IS_ROLLED_UP_VALUE: [1,1,0,1,0,1,0,0],
							HAS_SUBITEMS: [1,1,1,1,1,1,0,0],
							COST_FIXED_PORTION: ["2.0000000","0.7720000","2.4000000","2.0000000","0.3720000","0.7720000","2.0000000","0.4000000"],
							COST_VARIABLE_PORTION: ["3.0000000","1.1580000","3.6000000","3.0000000","0.5580000","1.1580000","3.0000000","0.6000000"],
							COST2_FIXED_PORTION: ["0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000"],
							COST2_VARIABLE_PORTION: ["0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000"],
							COST3_FIXED_PORTION: ["0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000"],
							COST3_VARIABLE_PORTION: ["0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000","0.0000000"]
						},["ITEM_ID","COSTING_SHEET_ROW_ID","IS_ROLLED_UP_VALUE","HAS_SUBITEMS","COST_FIXED_PORTION","COST_VARIABLE_PORTION","COST2_FIXED_PORTION","COST3_FIXED_PORTION","COST3_VARIABLE_PORTION"]);

						//The subitem price will replace the parent price
						
						//checking if the right fixed price calculated with the overhead custom field is saved
						expect (oItemCalculatedPrices).toMatchData({
							TOTAL_COST_FIXED_PORTION: ["2.7720000","2.7720000","2.4000000"]
						},["TOTAL_COST_FIXED_PORTION"]);

						//checking if the right fixed price calculated with the overhead custom field is saved
						expect (oItemCalculatedPrices).toMatchData({
							TOTAL_COST_VARIABLE_PORTION: ["4.1580000","4.1580000","3.6000000"]
						},["TOTAL_COST_VARIABLE_PORTION"]);

					})
				}
			});


			describe('getSavedCalculationResults', function() {
				var iCalcVersionId = testData.iCalculationVersionId;
				var oMockstar;
				var persistency;
				

				var oItemCalculatedValues = new TestDataUtility(testData.oItemCalculatedTestData).getObject(0); 			
				var oItemCalculatedValuesCostingSheet = {
						"ITEM_ID" : [1, 1, 1],
						"CALCULATION_VERSION_ID" : [iCalcVersionId, iCalcVersionId, iCalcVersionId],
						"COSTING_SHEET_ROW_ID" : ["CSR_1", "CSR_1", "CSR_1"],
						"COSTING_SHEET_OVERHEAD_ROW_ID" : [1, 1, 2],
						"ACCOUNT_ID" : ["40", "50", "40"],
						"IS_ROLLED_UP_VALUE" : [1, 1, 1],
						"HAS_SUBITEMS" : [1, 1, 1],
						"COST" : ['5', '7', '9'],
						"COST_FIXED_PORTION" : ['2', '3', '4'],
						"COST_VARIABLE_PORTION" : ['3', '4', '5']
				};
				var oItemCalculatedValuesComponentSplit = {
						"ITEM_ID" : [1, 1],
						"CALCULATION_VERSION_ID" : [iCalcVersionId, iCalcVersionId],
						"COMPONENT_SPLIT_ID" : ["100", "100"],
						"COST_COMPONENT_ID" : [2, 2],
						"ACCOUNT_ID" : ["40", "50"],
						"COST" : ['7', '9'],
						"COST_FIXED_PORTION" : ['3', '4'],
						"COST_VARIABLE_PORTION" : ['4', '5']
				};
				if(jasmine.plcTestRunParameters.generatedFields === true){
					var oItemExtData = new TestDataUtility(testData.oItemExtData).getObject(0);
				}

				beforeOnce(function() {
					oMockstar = new MockstarFacade(
					{
						substituteTables : 
						{
							item : "sap.plc.db::basis.t_item",
							item_calculated_values_costing_sheet : "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
							item_calculated_values_component_split : "sap.plc.db::basis.t_item_calculated_values_component_split",
							item_ext : "sap.plc.db::basis.t_item_ext",
							metadata : {
								name : "sap.plc.db::basis.t_metadata",
								data : testData.mCsvFiles.metadata
							},
							metadata_text : "sap.plc.db::basis.t_metadata__text",
							metadata_item_attributes : {
								name : "sap.plc.db::basis.t_metadata_item_attributes",
								data : testData.mCsvFiles.metadata_item_attributes
							}
						}
					});
				});

				beforeEach(function() {
					oMockstar.clearAllTables(); // clear all specified substitute tables and views
					oMockstar.initializeData();
					oMockstar.insertTableData("item", oItemCalculatedValues);
					oMockstar.insertTableData("item_calculated_values_costing_sheet", oItemCalculatedValuesCostingSheet);
					oMockstar.insertTableData("item_calculated_values_component_split", oItemCalculatedValuesComponentSplit);

					if(jasmine.plcTestRunParameters.generatedFields === true){
						oMockstar.insertTableData("item_ext", oItemExtData);
						oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
						
					}

					persistency = new Persistency(jasmine.dbConnection);
				});

				it('should return saved calculated data', function() {
					var oResultObject = persistency.CalculationVersion.getSavedCalculationResults(iCalcVersionId);
				    const oResultArray = {
					        ITEM_CALCULATED_FIELDS : Array.slice(oResultObject.ITEM_CALCULATED_FIELDS),
					        ITEM_CALCULATED_VALUES_COMPONENT_SPLIT : Array.slice(oResultObject.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT),
					        ITEM_CALCULATED_VALUES_COSTING_SHEET : Array.slice(oResultObject.ITEM_CALCULATED_VALUES_COSTING_SHEET)
					};
					
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

					var oExpectedCalculatedFields = _.pick(oItemCalculatedValuesClone, ['ITEM_ID', 'BASE_QUANTITY', 'QUANTITY', 'TOTAL_QUANTITY', 'TOTAL_QUANTITY_UOM_ID', 'PRICE_UNIT', 'TARGET_COST', 
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
			        if(jasmine.plcTestRunParameters.generatedFields === true){
			          	// calculated custom fields should be returned, but without postfix "_CALCULATED"
			          	var oCustomFields =  _.pick(oItemExtData, testData.aCalculatedCustomFields);
			          	var oExpectedCustomFieldsWoCalculated = {};
			          	for (var property in oCustomFields) {
                            if (oCustomFields.hasOwnProperty(property)) {
                                oExpectedCustomFieldsWoCalculated[property.substring(0, property.length - 11)] = oCustomFields[property];
                            }
                        }
                        // Formulas should also be included
                        oExpectedCustomFieldsWoCalculated = _.extend(oExpectedCustomFieldsWoCalculated, 
                                                { 
                                                  CUST_DECIMAL_FORMULA :    null, 
                                                  CUST_INT_FORMULA:         null, 
												  CUST_STRING_FORMULA:      null,
												  CUST_ROLLUP_CURRENCY:		null
                                                });
			          	oExpectedCalculatedFields = _.extend(oExpectedCalculatedFields, oExpectedCustomFieldsWoCalculated);
			        }
			        
					// Only selected properties from the tables should be returned	
					expect(JSON.parse(JSON.stringify(oResultArray.ITEM_CALCULATED_FIELDS[0]))).toEqualObject(oExpectedCalculatedFields, ['ITEM_ID']);
			                
					// For costing sheet results all costs for the same costing sheet row but with different account_id and costing_sheet_overhead_row_id
					// must be aggregated (sum) before delivering them to the client.
					// Conversion via JSON is required because the comparison fails otherwise
					expect(JSON.parse(JSON.stringify(oResultArray.ITEM_CALCULATED_VALUES_COSTING_SHEET))).toEqualObject([{
							"ITEM_ID" : 1,
							"COSTING_SHEET_ROW_ID" : "CSR_1",
							"IS_ROLLED_UP_VALUE" : 1,
							"HAS_SUBITEMS" : 1,
							"COST_FIXED_PORTION" : '9.0000000', // 2+3+4 (sum of the three different accounts and overhead rows of the same costing sheet row)
							"COST_VARIABLE_PORTION" : '12.0000000', // 3+4+5
							"COST2_FIXED_PORTION" : '0.0000000',
							"COST2_VARIABLE_PORTION" : '0.0000000',
							"COST3_FIXED_PORTION" : '0.0000000',
							"COST3_VARIABLE_PORTION" : '0.0000000'
						}], ['ITEM_ID']);
							
					// For component split results all costs for the same cost component but with different account_id
					// must be aggregated (sum) before delivering them to the client.
					// Conversion via JSON is required because the comparison fails otherwise.
					expect(JSON.parse(JSON.stringify(oResultArray.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT))).toEqualObject([{
							"ITEM_ID" : 1,
							"COMPONENT_SPLIT_ID" : "100",
							"COST_COMPONENT_ID" : 2,
							"COST_FIXED_PORTION" : '7.0000000', // 3+4 (sum of the two different accounts of the same cost component)
							"COST_VARIABLE_PORTION" : '9.0000000', // 4+5
							"COST2_FIXED_PORTION" : '0.0000000',
							"COST2_VARIABLE_PORTION" : '0.0000000',
							"COST3_FIXED_PORTION" : '0.0000000',
							"COST3_VARIABLE_PORTION" : '0.0000000'
						}], ['ITEM_ID']);
				 });
			});
			//TODO: fix issue about substituteProcs in test framework
			xdescribe('saveCalculationResults', function() {
				// TODO: mockstar does not substitute call to AFL function
				var iCalcVersionId = 2809;
				var sSessionId = $.session.getUsername();

				var oMockstar;
				var testPackage = $.session.getUsername().toLowerCase();
				var originalProcedures = null;
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase();
				var unitUnderTest;

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel : "sap.plc.db.calcengine.procedures/p_calculation_save_results",
						substituteTables : // substitute all used tables in the procedure or view
						{
							calculation : "sap.plc.db::basis.t_calculation",
							calculation_version : "sap.plc.db::basis.t_calculation_version",
							calculation_version_temporary : "sap.plc.db::basis.t_calculation_version_temporary",
							item : "sap.plc.db::basis.t_item",
							item_temporary : "sap.plc.db::basis.t_item_temporary",
							costingSheetResults : "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
							componentSplitResults : "sap.plc.db::basis.t_item_calculated_values_component_split",
							item_temporary_ext : "sap.plc.db::basis.t_item_temporary_ext",
							item_ext : "sap.plc.db::basis.t_item_ext",
							recent_calculation_versions : mTableNames.recent_calculation_versions
						},
						substituteProcs : [ {
							name : "PLC_AREA_CALCULATE_FOR_SAVE_PROC",
							schema : "_SYS_AFL",
							testProc : "sap.plc_test.db.calcengine.procedures::afl_calculate_for_save"
						} ]
					});
					if (!oMockstar.disableMockstar) {
						originalProcedures = CalculationVersionImport.Procedures;
						CalculationVersionImport.Procedures = Object.freeze({
							calculation_save_results : procedurePrefix + '.sap.plc.db.calcengine.procedures::p_calculation_save_results'
						});
					}
				});

				afterOnce(function() {
					oMockstar.cleanup(testPackage + "sap.plc.db.calcengine.procedures");
				});

				beforeEach(function() {
					oMockstar.clearAllTables(); // clear all specified substitute tables and views
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
					oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
					oMockstar.insertTableData("item", testData.oItemTestData);
					oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
					if (jasmine.plcTestRunParameters.generatedFields === true) {
						oMockstar.insertTableData("item_ext", testData.oItemExtData);
						oMockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
					}
					oMockstar.initializeData();

					unitUnderTest = new Persistency(jasmine.dbConnection);
				});

				xit('should call the CalcEngine, update item costs, save costing sheet and component split results', function() {
					oMockstar.call(iCalcVersionId, sSessionId);

					var queryResult = oMockstar.execQuery("select * from {{costingSheetResults}}");
					expect(queryResult).toBeDefined;
					// Check result of procedure Call
					expect(queryResult).toMatchData({
						"ITEM_ID" : [ 1 ],
						"COSTING_SHEET_ROW_ID" : [ "bla" ],
						"COSTING_SHEET_OVERHEAD_ROW_ID" : [ -1 ],
						"ACCOUNT_ID" : [ "40" ],
						"IS_ROLLED_UP" : [ 1 ],
						"HAS_SUBITEMS" : [ 1 ],
						"COST" : [ 5 ],
						"COST_FIXED_PORTION" : [ 2 ],
						"COST_VARIABLE_PORTION" : [ 3 ]
					}, [ 'ITEM_ID' ]);

					queryResult = oMockstar.execQuery("select * from {{componentSplitResults}}");
					expect(queryResult).toBeDefined;
					// Check result of procedure Call
					expect(queryResult).toMatchData({
						"ITEM_ID" : [ 1 ],
						"COMPONENT_SPLIT_ID" : [ "100" ],
						"COST_COMPONENT_ID" : [ 2 ],
						"ACCOUNT_ID" : [ "40" ],
						"COST" : [ 7 ],
						"COST_FIXED_PORTION" : [ 3 ],
						"COST_VARIABLE_PORTION" : [ 4 ]
					}, [ 'ITEM_ID' ]);
				});
			});

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe("getOpeningUsers", function() {
					var oMockstar = null;

					var oOpenCalcVersionData = {
						SESSION_ID : [ "INITIAL_SESSION", "INITIAL_SESSION_B" ],
						CALCULATION_VERSION_ID : [ 12345, 12345 ],
						IS_WRITEABLE : [ 1, 0 ]
					};
					var oSessionData = {
						SESSION_ID : [ "INITIAL_SESSION", "INITIAL_SESSION_B" ],
						USER_ID : [ "USER_A", "USER_B" ],
						LANGUAGE : [ "DE", "DE" ],
						LAST_ACTIVITY_TIME : [ testData.sExpectedDate, testData.sExpectedDate ]
					};

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								sessionTable : mTableNames.session,
								calculationVersionTable : mTableNames.open_calculation_versions
							},
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("sessionTable", oSessionData);
						oMockstar.insertTableData("calculationVersionTable", oOpenCalcVersionData);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it("should return users when calculation version is open in session", function() {
						// arrange
						var aExpectedUsers = [ {
							USER_ID : "USER_A"
						}, {
							USER_ID : "USER_B"
						}, ];

						var iCalcVersionId = oOpenCalcVersionData.CALCULATION_VERSION_ID[0];
						var unitUnderTest = new Persistency(jasmine.dbConnection);
						// act
						var result = unitUnderTest.CalculationVersion.getOpeningUsers(iCalcVersionId);
						// assert
						expect(result).toEqualObject(aExpectedUsers);
					});

					it("should return empty when calculation version does not exist in session", function() {
						// arrange
						var aExpectedUsers = [];
						var iCalcVersionId = 1;
						var unitUnderTest = new Persistency(jasmine.dbConnection);
						// act
						var result = unitUnderTest.CalculationVersion.getOpeningUsers(iCalcVersionId);
						// assert
						expect(result).toEqualObject(aExpectedUsers);
					});

					it("should throw Exception when calculation version id is not a number", function() {
						// arrange
						var aInvalidArrayValues = [ 1.1, -1, "1a", undefined, null ];
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						_.each(aInvalidArrayValues, function(iCalcVersionId, iIndex) {
							var exception = null;

							// act
							try {
								unitUnderTest.CalculationVersion.getOpeningUsers(iCalcVersionId);
							} catch (e) {
								exception = e;
							}

							// assert
							expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
						});
					});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('getSessionRecord', function() {
					var oMockstar = null;
					var oCorrectSessionValues = {
						SESSION_ID : [ "Session_A", "Session_B", "Session_C" ],
						CALCULATION_VERSION_ID : [ 1, 1, 2 ],
						IS_WRITEABLE : [ 1, 0, 1 ],
						CONTEXT : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION, 
									Constants.CalculationVersionLockContext.CALCULATION_VERSION, 
									Constants.CalculationVersionLockContext.CALCULATION_VERSION
								]
					};

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								openCalcTable : mTableNames.open_calculation_versions
							},
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("openCalcTable", oCorrectSessionValues);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it("should return open calculation when calculation version exists in session", function() {
						// arrange
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[0];
						var persistency = new Persistency(jasmine.dbConnection);

						// act
						var result = persistency.CalculationVersion.getSessionRecord(sSessionId, iCalcVersionId);

						var oExpectedResultJsonData = {
							SESSION_ID : "Session_A",
							CALCULATION_VERSION_ID : 1,
							IS_WRITEABLE : 1
						};

						// assert
						expect(result).toBeDefined();
						expect(result.SESSION_ID).toEqual(oExpectedResultJsonData.SESSION_ID);
						expect(result.CALCULATION_VERSION_ID).toBe(oExpectedResultJsonData.CALCULATION_VERSION_ID);
						expect(result.IS_WRITEABLE).toEqual(oExpectedResultJsonData.IS_WRITEABLE);

					});

					it("should return empty result when calculation version does not exists in session", function() {
						// arrange
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[2];
						var persistency = new Persistency(jasmine.dbConnection);

						// act
						var result = persistency.CalculationVersion.getSessionRecord(sSessionId, iCalcVersionId);

						// assert
						expect(result).toBeUndefined();
					});

					it("should return empty result when calculation version is opened in session, but in different context", function() {
						// arrange
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[2];
						var persistency = new Persistency(jasmine.dbConnection);

						// act
						var result = persistency.CalculationVersion.getSessionRecord(sSessionId, iCalcVersionId, Constants.CalculationVersionLockContext.VARIANT_MATRIX);

						// assert
						expect(result).toBeUndefined();
					});

					it("should return empty result when session does not exists", function() {
						// arrange
						var sSessionId = "SESSION_UNDEFINED";
						var iCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[0];
						var persistency = new Persistency(jasmine.dbConnection);

						// act
						var result = persistency.CalculationVersion.getSessionRecord(sSessionId, iCalcVersionId);

						// assert
						expect(result).toBeUndefined();
					});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('isOpenedInSessionAndContext', function() {

					var oMockstar = null;
					var oCorrectSessionValues = {
						SESSION_ID : [ "Session_A", "Session_B", "Session_C" ],
						CALCULATION_VERSION_ID : [ 1, 1, 2 ],
						IS_WRITEABLE : [ 1, 0, 1 ],
						CONTEXT : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION, 
									Constants.CalculationVersionLockContext.CALCULATION_VERSION, 
									Constants.CalculationVersionLockContext.CALCULATION_VERSION
								]
					};

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								openCalcTable : mTableNames.open_calculation_versions
							},
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("openCalcTable", oCorrectSessionValues);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it('should return true when calculation version exists for current session', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[0];

						// act
						var resultObject = persistency.CalculationVersion.isOpenedInSessionAndContext(sSessionId, iCalcVersionId, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

						// assert
						expect(resultObject).toBeTruthy();
					});

					it('should return false when calculation version does not exists', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iFalseCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[0] + 10;

						// act
						var resultObject = persistency.CalculationVersion.isOpenedInSessionAndContext(sSessionId, iFalseCalcVersionId, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

						// assert
						expect(resultObject).toBeFalsy();
					});

					it('should return false when calculation version does not exist in session', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iFalseCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[2];

						// act
						var resultObject = persistency.CalculationVersion.isOpenedInSessionAndContext(sSessionId, iFalseCalcVersionId, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

						// assert
						expect(resultObject).toBeFalsy();
					});

					it('should return false when calculation version is opened in different context within session', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iFalseCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[0];

						// act
						var resultObject = persistency.CalculationVersion.isOpenedInSessionAndContext(sSessionId, iFalseCalcVersionId, Constants.CalculationVersionLockContext.VARIANT_MATRIX);

						// assert
						expect(resultObject).toBeFalsy();
					});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('isOpenedAndLockedInSessionAndContext', function() {
					var oMockstar = null;
					var oCorrectSessionValues = {
						SESSION_ID : [ "Session_A", "Session_B", "Session_C" ],
						CALCULATION_VERSION_ID : [ 1, 1, 2 ],
						IS_WRITEABLE : [ 1, 0, 1 ],
						CONTEXT : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION, 
									Constants.CalculationVersionLockContext.CALCULATION_VERSION, 
									Constants.CalculationVersionLockContext.CALCULATION_VERSION
								]
					};

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								openCalcTable : mTableNames.open_calculation_versions
							},
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.initializeData();

						oMockstar.insertTableData("openCalcTable", oCorrectSessionValues);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it('should return true when calculation version is opened and writeable in current session', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[0];

						// act
						var resultObject = persistency.CalculationVersion.isOpenedAndLockedInSessionAndContext(sSessionId, iCalcVersionId, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

						// assert
						expect(resultObject).toBeTruthy();
					});

					it('should return false when calculation version is opened and writeable in different context in current session', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[0];

						// act
						var resultObject = persistency.CalculationVersion.isOpenedAndLockedInSessionAndContext(sSessionId, iCalcVersionId, Constants.CalculationVersionLockContext.VARIANT_MATRIX);

						// assert
						expect(resultObject).toBeFalsy();
					});

					it('should return false when calculation version is opened and NOT writeable in current session', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[1];
						var iCalcVersionId = oCorrectSessionValues.CALCULATION_VERSION_ID[1];

						// act
						var resultObject = persistency.CalculationVersion.isOpenedAndLockedInSessionAndContext(sSessionId, iCalcVersionId, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

						// assert
						expect(resultObject).toBeFalsy();
					});

					it('should return false when calculation version does not exist at all', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[0];
						var iFalseCalcVersionId = 666;

						// act
						var resultObject = persistency.CalculationVersion.isOpenedAndLockedInSessionAndContext(sSessionId, iFalseCalcVersionId, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

						// assert
						expect(resultObject).toBeFalsy();
					});

					it('should return false when calculation version does not exist in session', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						var sSessionId = oCorrectSessionValues.SESSION_ID[2];
						var iFalseCalcVersionId = 1;

						// act
						var resultObject = persistency.CalculationVersion.isOpenedAndLockedInSessionAndContext(sSessionId, iFalseCalcVersionId, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

						// assert
						expect(resultObject).toBeFalsy();
					});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('isNameUnique', function() {
					var oMockstar = null;
					var oCalcVersionTestData = {
						CALCULATION_VERSION_ID : [ 1000, 1001, 1002 ],
						CALCULATION_ID : [ 5000, 5000, 5500 ],
						CALCULATION_VERSION_NAME : [ "Baseline", "DummyVersion", "Baseline" ],
						ROOT_ITEM_ID : [ 1, 1, 1 ],
						REPORT_CURRENCY_ID : [ "EUR", "EUR", "EUR" ],
						COSTING_SHEET_ID : [ "CS_ID", "CS_ID", "CS_ID" ],
						COMPONENT_SPLIT_ID : [ "CP_ID", "CS_ID", "CS_ID" ],
						LAST_MODIFIED_ON : [ "2015-01-01 00:00:00", "2015-01-01 00:00:00", "2015-01-01 00:00:00" ],
						LAST_MODIFIED_BY : [ "User", "User", "User" ],
						VALUATION_DATE : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
						MASTER_DATA_TIMESTAMP : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
						MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
						ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
					};

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version : mTableNames.calculation_version
							}
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.initializeData();
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it("should return true when calculation version table is empty",
							function() {
								// arrange
								var iCalculationId = 5000;
								var sCalcVersionName = "Baseline";
								var iCalculationVersionId = 1003;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								// act
								var result = unitUnderTest.CalculationVersion.isNameUnique(iCalculationId, iCalculationVersionId,
										sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(true);
							});

					it("should return true when calculation version name is not in other calculation versions under same calculation",
							function() {
								// arrange
								var iCalculationId = 5000;
								var sCalcVersionName = "UnknownVersion";
								var iCalculationVersionId = 1003;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

								// act
								var result = unitUnderTest.CalculationVersion.isNameUnique(iCalculationId, iCalculationVersionId,
										sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(true);
							});

					it("should return true when calculation version name exists under other calculations, but not under given calculation",
							function() {
								/*
								 * CalcID:5000 contains CVID:1000 (Baseline) and 1001 (DummyVersion) CalcID:5500 contains CVID:1002
								 * (Baseline)
								 */

								// arrange
								var iCalculationId = 5500;
								var sCalcVersionName = "DummyVersion";
								var iCalculationVersionId = 1003;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

								// act
								var result = unitUnderTest.CalculationVersion.isNameUnique(iCalculationId, iCalculationVersionId,
										sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(true);
							});

					it("should return false when calculation version name exists in calculation versions under calculation",
							function() {
								/*
								 * CalcID:5000 contains CVID:1000 (Baseline) and 1001 (DummyVersion) CalcID:5500 contains CVID:1002
								 * (Baseline)
								 */

								// arrange
								var iCalculationId = 5000;
								var sCalcVersionName = "Baseline";
								var iCalculationVersionId = 1003;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

								// act
								var result = unitUnderTest.CalculationVersion.isNameUnique(iCalculationId, iCalculationVersionId,
										sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(false);
							});

					it("should return false when calculation version name exists in calculation versions under calculation in UPPER case",
							function() {
								/*
								 * CalcID:5000 contains CVID:1000 (Baseline) and 1001 (DummyVersion) CalcID:5500 contains CVID:1002
								 * (Baseline)
								 */

								// arrange
								var iCalculationId = 5000;
								var sCalcVersionName = "BASELINE";
								var iCalculationVersionId = 1003;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

								// act
								var result = unitUnderTest.CalculationVersion.isNameUnique(iCalculationId, iCalculationVersionId,
										sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(false);
							});

					it("should return true when calculation version name exists because the same version (same id) has been saved before",
							function() {
								/*
								 * CalcID:5000 contains CVID:1000 (Baseline) and 1001 (DummyVersion) CalcID:5500 contains CVID:1002
								 * (Baseline)
								 */

								// arrange
								var iCalculationId = 5000;
								var sCalcVersionName = "Baseline";
								var iCalculationVersionId = 1000;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

								// act
								var result = unitUnderTest.CalculationVersion.isNameUnique(iCalculationId, iCalculationVersionId,
										sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(true);
							});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('doesNameNotExist', function() {
					var oMockstar = null;
					var oCalcVersionTestData = {
						CALCULATION_VERSION_ID : [ 1000, 1001, 1002 ],
						CALCULATION_ID : [ 5000, 5000, 5500 ],
						CALCULATION_VERSION_NAME : [ "Baseline", "DummyVersion", "Baseline" ],
						ROOT_ITEM_ID : [ 1, 1, 1 ],
						REPORT_CURRENCY_ID : [ "EUR", "EUR", "EUR" ],
						COSTING_SHEET_ID : [ "CS_ID", "CS_ID", "CS_ID" ],
						COMPONENT_SPLIT_ID : [ "CP_ID", "CS_ID", "CS_ID" ],
						LAST_MODIFIED_ON : [ "2015-01-01 00:00:00", "2015-01-01 00:00:00", "2015-01-01 00:00:00" ],
						LAST_MODIFIED_BY : [ "User", "User", "User" ],
						VALUATION_DATE : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
						MASTER_DATA_TIMESTAMP : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
						MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
						ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
					};

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version : mTableNames.calculation_version
							}
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.initializeData();
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it("should return true when calculation version table is empty", function() {
						// arrange
						var iCalculationId = 5000;
						var sCalcVersionName = "Baseline";
						var iCalculationVersionId = 1003;
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var result = unitUnderTest.CalculationVersion.doesNameNotExist(iCalculationId, sCalcVersionName);

						// assert
						expect(result).toBeDefined();
						expect(result).toBe(true);
					});

					it("should return true when calculation version name is not in other calculation versions under same calculation",
							function() {
								// arrange
								var iCalculationId = 5000;
								var sCalcVersionName = "UnknownVersion";
								var iCalculationVersionId = 1003;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

								// act
								var result = unitUnderTest.CalculationVersion.doesNameNotExist(iCalculationId, sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(true);
							});

					it("should return true when calculation version name exists under other calculations, but not under given calculation",
							function() {
								/*
								 * CalcID:5000 contains CVID:1000 (Baseline) and 1001 (DummyVersion) CalcID:5500 contains CVID:1002
								 * (Baseline)
								 */

								// arrange
								var iCalculationId = 5500;
								var sCalcVersionName = "DummyVersion";
								var iCalculationVersionId = 1003;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

								// act
								var result = unitUnderTest.CalculationVersion.doesNameNotExist(iCalculationId, sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(true);
							});

					it("should return false when calculation version name exists in calculation versions under calculation", function() {
						/*
						 * CalcID:5000 contains CVID:1000 (Baseline) and 1001 (DummyVersion) CalcID:5500 contains CVID:1002 (Baseline)
						 */

						// arrange
						var iCalculationId = 5000;
						var sCalcVersionName = "Baseline";
						var iCalculationVersionId = 1003;
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

						// act
						var result = unitUnderTest.CalculationVersion.doesNameNotExist(iCalculationId, sCalcVersionName);

						// assert
						expect(result).toBeDefined();
						expect(result).toBe(false);
					});

					it("should return false if a lifecycle version and a normal version have the same name", function() {
						// if a version was named exactly like a lifecycle version before the project lifecycle was calculated, it can be that 2 versions have the same name:
						// the newly generated lifecycle version and the normal version; this is okay, since Daniela specified it that in this case it's okay to have 2 versions
						// with the same name; 
						var iCalculationId = 5000;
						var sCalcVersionName = "Baseline - 2017";
						var aVersions = [ {
							CALCULATION_VERSION_ID : 1000,
							CALCULATION_ID : iCalculationId,
							CALCULATION_VERSION_NAME : sCalcVersionName,
							CALCULATION_VERSION_TYPE : 1, // normal version
							ROOT_ITEM_ID : 1,
							REPORT_CURRENCY_ID : "EUR",
							COSTING_SHEET_ID : "CS_ID",
							COMPONENT_SPLIT_ID : "CP_ID",
							LAST_MODIFIED_ON : "2015-01-01 00:00:00",
							LAST_MODIFIED_BY : "User",
							VALUATION_DATE : new Date().toJSON(),
							MASTER_DATA_TIMESTAMP : new Date().toJSON(),
							MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy,
							ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy
						}, {
							CALCULATION_VERSION_ID : 1001,
							CALCULATION_ID : iCalculationId,
							CALCULATION_VERSION_NAME : "Baseline1 - 2017",
							CALCULATION_VERSION_TYPE : 2, // lifecycle version
							ROOT_ITEM_ID : 1,
							REPORT_CURRENCY_ID : "EUR",
							COSTING_SHEET_ID : "CS_ID",
							COMPONENT_SPLIT_ID : "CP_ID",
							LAST_MODIFIED_ON : "2015-01-01 00:00:00",
							LAST_MODIFIED_BY : "User",
							VALUATION_DATE : new Date().toJSON(),
							MASTER_DATA_TIMESTAMP : new Date().toJSON(),
							MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy,
							ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy
						} ];

						// arrange
						
						var iCalculationVersionId = 1003;
						var unitUnderTest = new Persistency(jasmine.dbConnection);
						var exception = null;

						oMockstar.insertTableData("calculation_version", aVersions);

						// act
						var result = unitUnderTest.CalculationVersion.doesNameNotExist(iCalculationId, sCalcVersionName);
						
						// assert
						expect(result).toBeDefined();
						expect(result).toBe(false);
					});

					it("should return false when calculation version name exists because the same version (same id) has been saved before",
							function() {
								/*
								 * CalcID:5000 contains CVID:1000 (Baseline) and 1001 (DummyVersion) CalcID:5500 contains CVID:1002
								 * (Baseline)
								 */

								// arrange
								var iCalculationId = 5000;
								var sCalcVersionName = "Baseline";
								var iCalculationVersionId = 1000;
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								oMockstar.insertTableData("calculation_version", oCalcVersionTestData);

								// act
								var result = unitUnderTest.CalculationVersion.doesNameNotExist(iCalculationId, sCalcVersionName);

								// assert
								expect(result).toBeDefined();
								expect(result).toBe(false);
							});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('isSingle', function() {
					var oMockstar = null;
					var aCalculationsVersionTestData = [ {
						CALCULATION_VERSION_ID : 1000,
						CALCULATION_ID : 5000,
						CALCULATION_VERSION_NAME : "Baseline",
						CUSTOMER_ID : "CUS",
						COSTING_SHEET_ID : "CS_ID",
						COMPONENT_SPLIT_ID : "CP_ID",
						ROOT_ITEM_ID : 1,
						REPORT_CURRENCY_ID : "EUR",
						LAST_MODIFIED_ON : "2015-01-01 00:00:00",
						LAST_MODIFIED_BY : "User",
						VALUATION_DATE : new Date().toJSON(),
						MASTER_DATA_TIMESTAMP : new Date().toJSON(),
						MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy,
						ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy
					} ];

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								calculationVersionTable : mTableNames.calculation_version
							},
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("calculationVersionTable", aCalculationsVersionTestData);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it('should return true when calculation version exists and is single', function() {

						// arrange
						var iCalcVersionId = aCalculationsVersionTestData[0].CALCULATION_VERSION_ID;
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var result = unitUnderTest.CalculationVersion.isSingle(iCalcVersionId);

						// assert
						expect(result).toBe(true);
					});

					it('should return false when calculation version does not exists', function() {

						// arrange
						var iCalcVersionId = 1003;
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var result = unitUnderTest.CalculationVersion.isSingle(iCalcVersionId);

						// assert
						expect(result).toBe(false);
					});

					it('should return false when calculation version is not single', function() {

						// arrange
						var iCalcVersionId = 1000;
						var secondCalcVersions = _.clone(aCalculationsVersionTestData);
						secondCalcVersions[0].CALCULATION_VERSION_ID = 1001;
						secondCalcVersions[0].CALCULATION_VERSION_NAME = "Second calc vers";
						oMockstar.insertTableData("calculationVersionTable", secondCalcVersions);
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var result = unitUnderTest.CalculationVersion.isSingle(iCalcVersionId);

						// assert
						expect(result).toBe(false);
					});

					it("should throw Exception if calculation version id is not a number", function() {
						// arrange
						var iCalcVersionId;
						var aInvalidArrayValues = [ 1.1, -1, "1a", undefined, null ];
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						_.each(aInvalidArrayValues, function(iCalcVersionId, iIndex) {
							var exception = null;

							// act
							try {
								unitUnderTest.CalculationVersion.isSingle(iCalcVersionId);
							} catch (e) {
								exception = e;
							}

							// assert
							expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
						});
					});
				});
			}
			
			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('isDirty', function() {
					var oMockstar = null;
					var iCalcVersionId = testData.iCalculationVersionId;
					var sSessionId = testData.sSessionId;
					var sTestUser = testData.sTestUser;
					var unitUnderTest;
					
					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								session : {
									name : mTableNames.session,
									data : testData.oSessionTestData
								},
								item_temporary : {
									name : mTableNames.item_temporary
								}
							},
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.initializeData();
						
						 unitUnderTest = new Persistency(jasmine.dbConnection);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});
					
					it('should return false when calculation version is not dirty', function() {

						// arrange
						oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);

						// act
						var result = unitUnderTest.CalculationVersion.isDirty(iCalcVersionId, sSessionId, sTestUser);

						// assert
						expect(result).toBe(false);
					});

					it('should return true when calculation version is dirty', function() {

						// arrange
						// "deep clone" testData Objects to avoid Object dependencies
						var oItemTempData = JSON.parse(JSON.stringify(testData.oItemTemporaryTestData));
						oItemTempData.IS_DIRTY[0] = 1;
						oMockstar.insertTableData("item_temporary", oItemTempData);

						// act
						var result = unitUnderTest.CalculationVersion.isDirty(iCalcVersionId, sSessionId, sTestUser);

						// assert
						expect(result).toBe(true);
					});

					it("should throw Exception if calculation version id is not a number", function() {
						// arrange
						var aInvalidArrayValues = [ 1.1, -1, "1a", undefined, null ];

						_.each(aInvalidArrayValues, function(iCalcVersionId, iIndex) {
							var exception = null;

							// act
							try {
								unitUnderTest.CalculationVersion.isDirty(iCalcVersionId, sSessionId, sTestUser);
							} catch (e) {
								exception = e;
							}

							// assert
							expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
						});
					});

				});
			}

			describe('setDirty', function() {
				// TODO:implement
			});

			describe("setNewId", function() {
				var oMockstar = null;

				var sSessionID = "TestSession";
				var iOldCalculationVersionID = 1000;
				var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON();
				var testPackage = $.session.getUsername().toLowerCase();
				var originalProcedures = null;
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase();

				var aCalcVersions = [ {
					SESSION_ID : sSessionID,
					CALCULATION_VERSION_ID : iOldCalculationVersionID,
					CALCULATION_ID : 5000,
					CALCULATION_VERSION_NAME : "Baseline",
					ROOT_ITEM_ID : 1,
					REPORT_CURRENCY_ID : "EUR",
					LAST_MODIFIED_ON : new Date().toJSON(),
					LAST_MODIFIED_BY : "User",
					VALUATION_DATE : new Date().toJSON(),
					MASTER_DATA_TIMESTAMP : new Date().toJSON()
				} ];

				var aItems = [ {
					SESSION_ID : sSessionID,
					ITEM_ID : 1,
					CALCULATION_VERSION_ID : iOldCalculationVersionID,
					ITEM_CATEGORY_ID : 1,
					CHILD_ITEM_CATEGORY_ID : 1,
					IS_ACTIVE : 1,
					TOTAL_QUANTITY_DEPENDS_ON : 1,
					TOTAL_QUANTITY : 1337,
					IS_DIRTY : 0,
					IS_DELETED : 0,
					PRICE_FIXED_PORTION : 1,
					PRICE_VARIABLE_PORTION : 0,
					TRANSACTION_CURRENCY_ID : 'EUR',
					PRICE_UNIT : 1,
					PRICE_UNIT_UOM_ID : 'EUR'
				}, {
					SESSION_ID : sSessionID,
					ITEM_ID : 2,
					CALCULATION_VERSION_ID : iOldCalculationVersionID,
					ITEM_CATEGORY_ID : 1,
					IS_ACTIVE : 1,
					TOTAL_QUANTITY_DEPENDS_ON : 1,
					TOTAL_QUANTITY : 1337,
					IS_DIRTY : 0,
					IS_DELETED : 0,
					PRICE_FIXED_PORTION : 1,
					PRICE_VARIABLE_PORTION : 0,
					TRANSACTION_CURRENCY_ID : 'EUR',
					PRICE_UNIT : 1,
					PRICE_UNIT_UOM_ID : 'EUR'
				}, {
					SESSION_ID : sSessionID,
					ITEM_ID : 3,
					CALCULATION_VERSION_ID : iOldCalculationVersionID,
					ITEM_CATEGORY_ID : 1,
					IS_ACTIVE : 1,
					TOTAL_QUANTITY_DEPENDS_ON : 1,
					TOTAL_QUANTITY : 1337,
					IS_DIRTY : 0,
					IS_DELETED : 0,
					PRICE_FIXED_PORTION : 1,
					PRICE_VARIABLE_PORTION : 0,
					TRANSACTION_CURRENCY_ID : 'EUR',
					PRICE_UNIT : 1,
					PRICE_UNIT_UOM_ID : 'EUR'
				} ];

				var aOpenCalculationVersions = [ {
					SESSION_ID : sSessionID,
					CALCULATION_VERSION_ID : iOldCalculationVersionID,
					IS_WRITEABLE : 1
				}, {
					SESSION_ID : 'SecondSession',
					CALCULATION_VERSION_ID : iOldCalculationVersionID,
					IS_WRITEABLE : 0
				}, {
					SESSION_ID : 'sSessionID',
					CALCULATION_VERSION_ID : 12345,
					IS_WRITEABLE : 0
				} ];

				if (jasmine.plcTestRunParameters.generatedFields === true) {
					var oItemsCust = testDataGenerator.createItemTempExtObjectFromObject([ 1, 2, 3 ], [ iOldCalculationVersionID,
							iOldCalculationVersionID, iOldCalculationVersionID ], [ sSessionID, sSessionID, sSessionID ],
							testData.oItemExtData, 3);
				}

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel : {
							"procSetId" : "sap.plc.db.calculationmanager.procedures/p_calculation_version_set_new_id"
						},
						substituteTables : // substitute all used tables in the procedure or view
						{
							calculation_version_temporary : mTableNames.calculation_version_temporary,
							item_temporary : mTableNames.item_temporary,
							open_calculation_versions : mTableNames.open_calculation_versions,
							item_temporary_ext : "sap.plc.db::basis.t_item_temporary_ext",
							item_ext : "sap.plc.db::basis.t_item_ext"
						}
					});

					if (!oMockstar.disableMockstar) {
						originalProcedures = CalculationVersionImport.Procedures;
						CalculationVersionImport.Procedures = Object.freeze({
							calculation_set_id : procedurePrefix
									+ '.sap.plc.db.calculationmanager.procedures::p_calculation_version_set_new_id'

						});
					}
				});

				beforeEach(function() {
					oMockstar.clearAllTables();
					oMockstar.insertTableData("calculation_version_temporary", aCalcVersions);
					oMockstar.insertTableData("item_temporary", aItems);
					oMockstar.insertTableData("open_calculation_versions", aOpenCalculationVersions);
					if (jasmine.plcTestRunParameters.generatedFields === true) {
						oMockstar.insertTableData("item_temporary_ext", oItemsCust);
					}
				});

				afterOnce(function() {
					oMockstar.cleanup();
					oMockstar.cleanup(testPackage + "sap.plc.db.calculationmanager.procedures");
				});

				if (jasmine.plcTestRunParameters.mode === 'all') {
					it("should set a new calculation version id in the calculation_version_temporary table", function() {

						// arrange
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						unitUnderTest.CalculationVersion.setNewId(iOldCalculationVersionID, sSessionID);

						// assert
						var queryResult = oMockstar
								.execQuery("select CALCULATION_VERSION_ID from {{calculation_version_temporary}} where SESSION_ID = '"
										+ sSessionID + "'");

						expect(queryResult.columns.CALCULATION_VERSION_ID.rows[0] !== iOldCalculationVersionID).toBeTruthy();
					});
				}

				it("should set new calculation version id in the t_item_temporary table", function() {

					// arrange
					var unitUnderTest = new Persistency(jasmine.dbConnection);

					// act
					unitUnderTest.CalculationVersion.setNewId(iOldCalculationVersionID, sSessionID);

					// assert
					var queryResult = oMockstar.execQuery("select CALCULATION_VERSION_ID from {{item_temporary}} where SESSION_ID = '"
							+ sSessionID + "'");

					expect(queryResult.columns.CALCULATION_VERSION_ID.rows[0] !== iOldCalculationVersionID).toBeTruthy();

					if (jasmine.plcTestRunParameters.generatedFields === true) {
						var queryResult = oMockstar
								.execQuery("select CALCULATION_VERSION_ID from {{item_temporary_ext}} where SESSION_ID = '" + sSessionID
										+ "'");
						expect(queryResult.columns.CALCULATION_VERSION_ID.rows[0] !== iOldCalculationVersionID).toBeTruthy();
					}
				});

				if (jasmine.plcTestRunParameters.mode === 'all') {
					it("should set the flag IS_DIRTY to 1 for all items in the t_item_temporary table", function() {

						// arrange
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						unitUnderTest.CalculationVersion.setNewId(iOldCalculationVersionID, sSessionID);

						// assert
						var queryResult = oMockstar
								.execQuery("select CALCULATION_VERSION_ID, IS_DIRTY from {{item_temporary}} where SESSION_ID = '"
										+ sSessionID + "'");

						expect(queryResult.columns.IS_DIRTY.rows[0]).toBe(1);

					});
				}

				if (jasmine.plcTestRunParameters.mode === 'all') {
					it("should set a new calculation version id in the open_calculation_version table and do not set in in other sessions",
							function() {

								// arrange
								var unitUnderTest = new Persistency(jasmine.dbConnection);

								// act
								unitUnderTest.CalculationVersion.setNewId(iOldCalculationVersionID, sSessionID);

								// assert
								var queryResult = oMockstar
										.execQuery("select CALCULATION_VERSION_ID from {{open_calculation_versions}} where SESSION_ID = '"
												+ sSessionID + "'");

								expect(queryResult.columns.CALCULATION_VERSION_ID.rows[0] !== iOldCalculationVersionID).toBeTruthy();

								queryResult = oMockstar
										.execQuery("select CALCULATION_VERSION_ID from {{open_calculation_versions}} where SESSION_ID != '"
												+ sSessionID + "'");
								expect(queryResult.columns.CALCULATION_VERSION_ID.rows[0]).toEqual(iOldCalculationVersionID);
								expect(queryResult.columns.CALCULATION_VERSION_ID.rows[1]).toEqual(12345);

							});
				}
			});

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('update', function() {
					var persistency = null;
					var oMockstar = null;

					var oCalculationVersionTempTestData = [ {
						SESSION_ID : "10101",
						CALCULATION_ID : 5001,
						CALCULATION_VERSION_ID : 1001,
						CALCULATION_VERSION_NAME : "TEST_CALCULATION_VERSION",
						CALCULATION_VERSION_TYPE : 1,
						ROOT_ITEM_ID : 3001,
						REPORT_CURRENCY_ID : "EUR",
						VALUATION_DATE : (new Date()).toJSON(),
						MASTER_DATA_TIMESTAMP : new Date().toJSON(),
						MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy,
						ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy
					} ];

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version_temporary : mTableNames.calculation_version_temporary,
								recent_calculation_versions : mTableNames.recent_calculation_versions
							}
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("calculation_version_temporary", oCalculationVersionTempTestData[0]);
						oMockstar.initializeData();

						persistency = new Persistency(jasmine.dbConnection);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it('should update Calculation Version when Version Quantity was changed -> Version Quantity updated in db', function() {
						// arrange
						var oCalculationVersionToUpdate = _.clone(oCalculationVersionTempTestData[0]);
						oCalculationVersionToUpdate.SALES_PRICE = '31.0000000';

						// act
						var iAffectedRows = persistency.CalculationVersion.update(oCalculationVersionToUpdate, [],
								oCalculationVersionToUpdate.SESSION_ID);

						expect(iAffectedRows).toEqual(1);
						// check the values inserted into test table
						var result = oMockstar.execQuery("select * from {{calculation_version_temporary}} where calculation_version_id="
								+ oCalculationVersionToUpdate.CALCULATION_VERSION_ID + " and session_id="
								+ oCalculationVersionToUpdate.SESSION_ID);
						compareDbResultWithExpected(result, oCalculationVersionToUpdate);
					});

					it('should not update Calculation Version when invalid CalculationVersionId -> no rows affected', function() {
						// arrange
						var oCalculationVersionToUpdate = _.clone(oCalculationVersionTempTestData[0]);
						oCalculationVersionToUpdate.CALCULATION_VERSION_ID = 1002;

						// act
						var iAffectedRows = persistency.CalculationVersion.update(oCalculationVersionToUpdate, [],
								oCalculationVersionToUpdate.SESSION_ID);

						// assert
						expect(iAffectedRows).toEqual(0);
					});

					it('should not update Calculation Version when invalid invalidSessionId -> no rows affected', function() {
						// arrange
						var oCalculationVersionToUpdate = _.clone(oCalculationVersionTempTestData[0]);

						// act
						var iAffectedRows = persistency.CalculationVersion.update(oCalculationVersionToUpdate, [], "invalid_session_id");

						// assert
						expect(iAffectedRows).toEqual(0);
					});
				});
			}

            if (jasmine.plcTestRunParameters.mode === 'all') {
                describe('getExistingNonTemporaryMasterdata', () => {
                    let oMockstar = null;
                    let oPersistency = null;

                    const oProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
                    const oExpectedCostingSheets = _.pick(new TestDataUtility(testData.oCostingSheetTestData)
                                                                .pickValues(oCs => oCs.CONTROLLING_AREA_ID === oProject.CONTROLLING_AREA_ID), "COSTING_SHEET_ID");
                    const oExpectedComponentSplits = _.pick(new TestDataUtility(testData.oComponentSplitTest)
                                                                .pickValues(oCs => oCs.CONTROLLING_AREA_ID == oProject.CONTROLLING_AREA_ID), "COMPONENT_SPLIT_ID");
                    const oExpectedAccounts = _.pick(new TestDataUtility(testData.oAccountTestDataPlc)
                                                                .pickValues(account => account.CONTROLLING_AREA_ID == oProject.CONTROLLING_AREA_ID), "ACCOUNT_ID");
                                                            
                    const oExpectedCurrencies = _.pick(testData.oCurrency, "CURRENCY_ID");
                    const oExpectedExchangeRateTypes = _.pick(testData.oExchangeRateTypeTestDataPlc, "EXCHANGE_RATE_TYPE_ID");
                    const oExpectedPriceSources = _.pick(testData.oPriceSourceTestDataPlc, "PRICE_SOURCE_ID");
                    const oExpectedUnitOfMeasures = _.pick(new TestDataUtility(testData.oUOM).build(), "UOM_ID");
                    oExpectedUnitOfMeasures.UOM_ID.push(testData.oUOMTestDataErp.MSEHI);

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
                                project: {
                                    name: "sap.plc.db::basis.t_project",
                                    data: testData.oProjectTestData
                                },
                                account: {
                                    name: "sap.plc.db::basis.t_account",
                                    data: testData.oAccountTestDataPlc
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
                                uom: {
                                    name: "sap.plc.db::basis.t_uom",
                                    data: testData.oUOM
                                },
                                // replicated unit of measure table from ERP
                                t006: {
                                    name: "sap.plc.db::repl.t006",
                                    data: testData.oUOMTestDataErp
                                },
                                exchange_rate_type: {
                                    name: "sap.plc.db::basis.t_exchange_rate_type",
                                    data: testData.oExchangeRateTypeTestDataPlc
                                },
                                price_source: {
                                    name: "sap.plc.db::basis.t_price_source",
                                    data: testData.oPriceSourceTestDataPlc
                                },
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

                    it('should return ids of existing non-temporary masterdata for given version and session id',() => {
                        // arrange
                        const iCvId = testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0];
                        const sSessionId = testData.oCalculationVersionTemporaryTestData.SESSION_ID[0];
                        
                        // act
                        var results = oPersistency.CalculationVersion.getExistingNonTemporaryMasterdata({
                            calculation_version_id: iCvId,
                            session_id: sSessionId
                        });

                        // assert
                        expectMasterdata(results);
                    });
                    

                    it('should return ids of existing non-temporary masterdata for given version and session id', () => {
                        // arrange
                        const iCalculationId = testData.oCalculationVersionTemporaryTestData.CALCULATION_ID[0];

                        // act
                        var results = oPersistency.CalculationVersion.getExistingNonTemporaryMasterdata({
                            calculation_id: iCalculationId,
                        });

                        // assert
                        expectMasterdata(results);
                    });

                    it('should return ids of of existing non-temporary masterdata for given project id', () => {
                        // act
                        var results = oPersistency.CalculationVersion.getExistingNonTemporaryMasterdata({
                            project_id: oProject.PROJECT_ID
                        });

                        // assert
                        expectMasterdata(results);
                    });

                    function expectMasterdata(results){
                        expect(results.ACCOUNTS).toMatchData(oExpectedAccounts, ["ACCOUNT_ID"]);
                        expect(results.COSTING_SHEETS).toMatchData(oExpectedCostingSheets, ["COSTING_SHEET_ID"]);
                        expect(results.COMPONENT_SPLITS).toMatchData(oExpectedComponentSplits, ["COMPONENT_SPLIT_ID"]);
                        expect(results.CURRENCIES).toMatchData(oExpectedCurrencies, ["CURRENCY_ID"]);
                        expect(results.UNIT_OF_MEASURES).toMatchData(oExpectedUnitOfMeasures, ["UOM_ID"]);
                        expect(results.EXCHANGE_RATE_TYPES).toMatchData(oExpectedExchangeRateTypes, ["EXCHANGE_RATE_TYPE_ID"]);
                        expect(results.PRICE_SOURCES).toMatchData(oExpectedPriceSources, ["PRICE_SOURCE_ID"]);
                    }
                });
            }

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('existsCVTemp', function() {
					var oTestCalculationVersionTemporary = mockstar_helpers.convertToObject(testData.oCalculationVersionTemporaryTestData,
							0);
					var sSessionId = $.session.getUsername();
					var persistency = null;
					var oMockstar = null;

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version_temporary : mTableNames.calculation_version_temporary
							}
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("calculation_version_temporary", oTestCalculationVersionTemporary);
						oMockstar.initializeData();

						persistency = new Persistency(jasmine.dbConnection);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it('should return true if the temporary calculation version exists', function() {
						// act
						var bResult = persistency.CalculationVersion.existsCVTemp(oTestCalculationVersionTemporary.CALCULATION_VERSION_ID,
								sSessionId);

						// assert
						expect(bResult).toBe(true);
					});

					it('should return false if the temporary calculation version does not exist', function() {
						// arrange
						var iCalcVersId = 123;

						// act
						var bResult = persistency.CalculationVersion.existsCVTemp(iCalcVersId, sSessionId);

						// assert
						expect(bResult).toBe(false);
					});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('findNameWithPrefix', function() {
					var oTestCalculationVersionTemporary = mockstar_helpers.convertToObject(testData.oCalculationVersionTemporaryTestData,
							0);
					oTestCalculationVersionTemporary.CALCULATION_VERSION_NAME = oTestCalculationVersionTemporary.CALCULATION_VERSION_NAME
							+ ' (1)';
					var sSessionId = $.session.getUsername();
					var persistency = null;
					var oMockstar = null;

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version_temporary : mTableNames.calculation_version_temporary
							}
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("calculation_version_temporary", oTestCalculationVersionTemporary);
						oMockstar.initializeData();

						persistency = new Persistency(jasmine.dbConnection);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});
					it('should return the calculation version name with the specified prefix', function() {
						// arrange
						var sName = "Baseline Version1";

						// act
						var aResult = persistency.CalculationVersion.findNameWithPrefix(sName,
								oTestCalculationVersionTemporary.CALCULATION_ID);

						// assert
						expect(aResult[0]).toBe(oTestCalculationVersionTemporary.CALCULATION_VERSION_NAME);
					});
				});
			}

			if (jasmine.plcTestRunParameters.mode === 'all') {
				describe('isNameUniqueInBothTables', function() {
					var oTestCalculationVersionTemporary = mockstar_helpers.convertToObject(testData.oCalculationVersionTemporaryTestData,
							0);
					var oTestCalculationVersion = mockstar_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
					var sSessionId = $.session.getUsername();
					var persistency = null;
					var oMockstar = null;

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version_temporary : mTableNames.calculation_version_temporary,
								calculation_version : mTableNames.calculation_version
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

					it('should return false if the temporary calculation version exists with the specified name', function() {
						// arrange
						var sName = "Baseline Version1";
						oMockstar.insertTableData("calculation_version_temporary", oTestCalculationVersionTemporary);

						// act
						var bResult = persistency.CalculationVersion.isNameUniqueInBothTables(sName,
								oTestCalculationVersionTemporary.CALCULATION_ID);

						// assert
						expect(bResult).toBe(false);
					});

					it('should return false if the calculation version exists with the specified name in calculation version table',
							function() {
								// arrange
								var sName = "Baseline Version1";
								oMockstar.insertTableData("calculation_version", oTestCalculationVersion);

								// act
								var bResult = persistency.CalculationVersion.isNameUniqueInBothTables(sName,
										oTestCalculationVersion.CALCULATION_ID);

								// assert
								expect(bResult).toBe(false);
							});

					it('should return true if calculation version does not exist with the specified name in both tables', function() {
						// arrange
						oMockstar.insertTableData("calculation_version_temporary", oTestCalculationVersionTemporary);
						oMockstar.insertTableData("calculation_version", oTestCalculationVersion);
						var sName = "Other Name";

						// act
						var bResultTemp = persistency.CalculationVersion.isNameUniqueInBothTables(sName,
								oTestCalculationVersionTemporary.CALCULATION_ID);
						var bResult = persistency.CalculationVersion
								.isNameUniqueInBothTables(sName, oTestCalculationVersion.CALCULATION_ID);

						// assert
						expect(bResultTemp).toBe(true);
						expect(bResult).toBe(true);
					});
				});

				describe('getOrDetermineNewCalculationVersionName', function() {
					var oTestCalculationVersionTemporary = mockstar_helpers.convertToObject(testData.oCalculationVersionTemporaryTestData,
							0);
					var oTestCalculationVersion = mockstar_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
					var sSessionId = $.session.getUsername();
					var persistency = null;
					var oMockstar = null;

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version_temporary : mTableNames.calculation_version_temporary,
								calculation_version : mTableNames.calculation_version
							}
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("calculation_version", oTestCalculationVersion);
						oMockstar.initializeData();

						persistency = new Persistency(jasmine.dbConnection);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it('should return new calculation version name (with a counter) if calculation version exists with the specified name',
							function() {
								// arrange
								var sName = oTestCalculationVersion.CALCULATION_VERSION_NAME + ' (2)';

								// act
								var sResult = persistency.CalculationVersion
										.getOrDetermineNewCalculationVersionName(oTestCalculationVersion);

								// assert
								expect(sResult).toEqual(sName);
							});
					it('should return new calculation version name (with a counter) if calculation version exists with the specified name and contains square brackets (1)',
					function() {
						// arrange
						oTestCalculationVersion.CALCULATION_VERSION_NAME = 'Baseline Version 1 [2020-01-01]';
						oMockstar.clearTable("calculation_version");
						oMockstar.insertTableData("calculation_version", oTestCalculationVersion);
						var sName = oTestCalculationVersion.CALCULATION_VERSION_NAME + ' (2)';

						// act
						var sResult = persistency.CalculationVersion.getOrDetermineNewCalculationVersionName(oTestCalculationVersion);

						// assert
						expect(sResult).toEqual(sName);
					});
					it('should return new calculation version name (with a counter) if calculation version exists with the specified name and contains square brackets (2)',
					function() {
						// arrange
						oTestCalculationVersion.CALCULATION_VERSION_NAME = 'Baseline Version 1 1 [2020-01-01] base 1 [2020-01-01]';
						oMockstar.clearTable("calculation_version");
						oMockstar.insertTableData("calculation_version", oTestCalculationVersion);
						var sName = oTestCalculationVersion.CALCULATION_VERSION_NAME + ' (2)';

						// act
						var sResult = persistency.CalculationVersion.getOrDetermineNewCalculationVersionName(oTestCalculationVersion);

						// assert
						expect(sResult).toEqual(sName);
					});
				});
			}

			describe('copy', function() {

						var oMockstar = null;
						var persistency = null;
						var sSessionId = testData.sSessionId;
						var oCalculationData = mockstar_helpers.convertToObject(testData.oCalculationTestData, 0);
						var oCalculationVersionData = mockstar_helpers.convertToObject(testData.oCalculationVersionTestData, 0);
						var sExpectedDateWithoutTime = testData.sExpectedDateWithoutTime;
						var sExpectedDate = testData.sExpectedDate;
						var sMasterdataTimestampDate = testData.sMasterdataTimestampDate;
						var sLanguage = "EN";
											
						beforeOnce(function() {
							oMockstar = new MockstarFacade({
								testmodel : {
									calculation_version_copy : "sap.plc.db.calculationmanager.procedures/p_calculation_version_copy"
								},
								substituteTables : {
									calculation : mTableNames.calculation,
									calculation_version : mTableNames.calculation_version,
									calculation_version_temporary : "sap.plc.db::basis.t_calculation_version_temporary",
									open_calculation_versions : mTableNames.open_calculation_versions,
									item : "sap.plc.db::basis.t_item",
									item_temporary : "sap.plc.db::basis.t_item_temporary",
									item_ext : "sap.plc.db::basis.t_item_ext",
									item_temporary_ext : "sap.plc.db::basis.t_item_temporary_ext",
									session : mTableNames.session,
									metadata : {
										name : "sap.plc.db::basis.t_metadata",
										data : testData.mCsvFiles.metadata
									},
									metadata_text : "sap.plc.db::basis.t_metadata__text",
									metadata_item_attributes : {
										name : "sap.plc.db::basis.t_metadata_item_attributes",
										data : testData.mCsvFiles.metadata_item_attributes
									}
								}
							});
						});

						beforeEach(function() {
							if (!oMockstar.disableMockstar) {
								var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '::';
								originalProcedures = CalculationImport.Procedures;
								CalculationImport.Procedures = Object.freeze({
									calculation_version_copy : procedurePrefix
											+ '.sap.plc.db.calculationmanager.procedures::p_calculation_version_copy'
								});
							}
							;
							oMockstar.clearAllTables();
							oMockstar.insertTableData("calculation", testData.oCalculationTestData);
							oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
							oMockstar.insertTableData("item", testData.oItemTestData);
							if (jasmine.plcTestRunParameters.generatedFields === true) {
								oMockstar.insertTableData("item_ext", testData.oItemExtData);
							}
							oMockstar.initializeData();
							
							persistency = new Persistency(jasmine.dbConnection);
						});

						afterOnce(function() {
							oMockstar.cleanup();
							if (!oMockstar.disableMockstar) {
								CalculationImport.Procedures = originalProcedures;
							}
							;
						});

						it('should create a copy for valid version id --> new calculation version returned', function() {
									// arrange
									var iCalcVersionId = oCalculationVersionData.CALCULATION_VERSION_ID;
									var sCvName = oCalculationVersionData.CALCULATION_VERSION_NAME + ' (2)';

									// act
									var oResultObject = persistency.CalculationVersion.copy(iCalcVersionId, sSessionId, sUserId, sLanguage);

									// assert

									// check calculation data in oResultObject
									var oResultCalculationVersionTempTable = mockstar_helpers.convertResultToArray(oMockstar
											.execQuery("select * from {{calculation_version_temporary}}"));
									var oResultItemTempTable = mockstar_helpers.convertResultToArray(oMockstar
											.execQuery("select * from {{item_temporary}}"));

									// check calculation version in oResultObject
									expect(oResultObject.calculation_version.CALCULATION_ID)
											.toEqual(oCalculationVersionData.CALCULATION_ID);
									expect(
											oResultObject.calculation_version.CALCULATION_VERSION_ID !== oCalculationVersionData.CALCULATION_VERSION_ID)
											.toBeTruthy();
                                    expect(oResultObject.calculation_version.CALCULATION_VERSION_NAME).toEqual(sCvName);											
									expect(oResultObject.calculation_version.CALCULATION_VERSION_NAME).toEqual(oResultCalculationVersionTempTable.CALCULATION_VERSION_NAME[0]);
									expect(oResultObject.calculation_version.COSTING_SHEET_ID).toBe(oCalculationVersionData.COSTING_SHEET_ID);
									expect(oResultObject.calculation_version.COMPONENT_SPLIT_ID).toBe(oCalculationVersionData.COMPONENT_SPLIT_ID);

									// check items in oResultObject
									_.each(oResultObject.items, function(oItem, iIndex){
									    expect(oResultObject.items[iIndex].ITEM_ID).toEqual(testData.oItemTestData.ITEM_ID[iIndex]);
									    expect(oResultObject.items[iIndex].CALCULATION_VERSION_ID === oResultObject.calculation_version.CALCULATION_VERSION_ID);
									});
									if (jasmine.plcTestRunParameters.generatedFields === true) {
										var resultItemTempExt = oMockstar.execQuery("select count(*) as count from {{item_temporary_ext}} "
												+ "where calculation_version_id="
												+ oResultObject.calculation_version.CALCULATION_VERSION_ID);
										expect(resultItemTempExt.columns.COUNT.rows[0].toString()).toBe("3");
									}
								});

						it('should create a copy for valid version id --> CREATED_ON and LAST_MODIFIED_ON updated to current time, CREATED_BY__USER_ID and LAST_MODIFIED_BY updated to current user', function() {
							// arrange
							var iCalcVersionId = oCalculationVersionData.CALCULATION_VERSION_ID;
							// act
							var oResultObject = persistency.CalculationVersion.copy(iCalcVersionId, sSessionId, sUserId, sLanguage);

							// assert

							// check for all items in oResultObject that CREATED_ and LAST_MODIFIED_ fields have been updated
							_.each(oResultObject.items, function(oItem, iIndex){
							    test_helpers.checkDatesUpdated(oResultObject.items[iIndex], ["CREATED_ON", "LAST_MODIFIED_ON"]);
						    	expect(oResultObject.items[iIndex].CREATED_BY).toBe(sSessionId);
						    	expect(oResultObject.items[iIndex].LAST_MODIFIED_BY).toBe(sSessionId);
							});
						});
								
						it('should create an unfrozen calculation version when copying a frozen version with validInput --> new calculation version returned with IS_FROZEN field set to null', function() {
							// arrange
							var oCalculationVersionDataFrozen = {
									"CALCULATION_VERSION_ID" : [ 2810 ],
									"CALCULATION_ID" : [ 1978 ],
									"CALCULATION_VERSION_NAME" : [ "Baseline Version111"],
									"ROOT_ITEM_ID" : [ 3001 ],
									"SALES_PRICE_CURRENCY_ID" : [ "EUR" ],
									"REPORT_CURRENCY_ID" : [ "EUR" ],
									"VALUATION_DATE" : [ testData.sExpectedDateWithoutTime ],
									"LAST_MODIFIED_ON" : [ testData.sExpectedDate ],
									"LAST_MODIFIED_BY" : [ testData.sTestUser ],
									"MASTER_DATA_TIMESTAMP" : [ testData.sMasterdataTimestampDate ],
									"IS_FROZEN" : [ 1 ],
									"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy],
									"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy]
								};
							oMockstar.insertTableData("calculation_version", oCalculationVersionDataFrozen);
							
							var iCalcVersionId = oCalculationVersionDataFrozen.CALCULATION_VERSION_ID[0];

							// act
							var oResultObject = persistency.CalculationVersion.copy(iCalcVersionId, sSessionId, sUserId, sLanguage);

							// assert: check oResultObject
							expect(oResultObject.calculation_version.IS_FROZEN).toBeNull();
							expect(oResultObject.calculation_version.CALCULATION_VERSION_ID !== iCalcVersionId).toBeTruthy();
							
							// assert: perform checks against database to ensure copy procedure was executed
							var oResultCalculationVersionTempTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{calculation_version_temporary}}"));							
							expect(oResultObject.calculation_version.CALCULATION_VERSION_ID).toEqual(oResultCalculationVersionTempTable.CALCULATION_VERSION_ID[0]);
							expect(oResultObject.calculation_version.CALCULATION_VERSION_NAME).toEqual(oResultCalculationVersionTempTable.CALCULATION_VERSION_NAME[0]);
						});
						
						it('should create a base calculation version when copying a lifecycle version --> return new base calculation version and update PRICE_SOURCE properties for items with OUTDATED_PRICE', function() {
							// arrange
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
							
							// act
							var oResultObject = persistency.CalculationVersion.copy(oLifecycleCalcVersion.CALCULATION_VERSION_ID, sSessionId, sUserId, sLanguage);

							// assert

							// validate changes in version header
							expect(oResultObject.calculation_version.CALCULATION_VERSION_ID !== oLifecycleCalcVersion.CALCULATION_VERSION_ID).toBeTruthy();
							expect(oResultObject.calculation_version.BASE_VERSION_ID).toBeNull();
							expect(oResultObject.calculation_version.CALCULATION_VERSION_TYPE).toBe(Constants.CalculationVersionType.Base);
							expect(oResultObject.calculation_version.LIFECYCLE_PERIOD_FROM).toBeNull();

							
					        // check that PRICE_SOURCE properties for items with OUTDATED_PRICE have been updated
							expect(oResultObject.items[2].PRICE_SOURCE_ID).toBe('MANUAL_PRICE');
							expect(oResultObject.items[2].PRICE_SOURCE_TYPE_ID).toBe(3);
						});

						if (jasmine.plcTestRunParameters.mode === 'all') {
							it(
									'should create when validInput and put a counter at the name if it already existed --> new version calculation returned',
									function() {
										// arrange
										var iCalcVersionId = oCalculationVersionData.CALCULATION_VERSION_ID;

										// act
										var oResultObject = persistency.CalculationVersion.copy(iCalcVersionId, sSessionId, sUserId, sLanguage);

										// assert
										var sCvName = oCalculationVersionData.CALCULATION_VERSION_NAME + ' (2)';
										expect(oResultObject.calculation_version.CALCULATION_VERSION_NAME).toEqual(sCvName);
									});
						}
						describe("getVersionType", () => {
							const oCalculationVersionForType = {
								CALCULATION_ID: [1, 1],
								CALCULATION_VERSION_NAME: ["A", "B"],
								ROOT_ITEM_ID: [1, 1],
								CALCULATION_VERSION_ID: [1, 2],
								CALCULATION_VERSION_TYPE: [1, 4],
								REPORT_CURRENCY_ID: ["EUR", "EUR"],
								VALUATION_DATE: [testData.sExpectedDate, testData.sExpectedDate],
								LAST_MODIFIED_ON: [testData.sExpectedDate, testData.sExpectedDate],
								LAST_MODIFIED_BY: [sUserId, sUserId],
								MASTER_DATA_TIMESTAMP: [testData.sExpectedDate, testData.sExpectedDate],
								MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy],
								ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy]
							};
							beforeEach(() => {
								oMockstar.clearAllTables();
								oMockstar.insertTableData("calculation_version", oCalculationVersionForType);
								oMockstar.insertTableData("calculation_version_temporary", oCalculationVersionForTypeTemporary);
							});
							const sSessionId = $.session.getUsername();
							const oCalculationVersionForTypeTemporary = _.clone(oCalculationVersionForType);
							oCalculationVersionForTypeTemporary.SESSION_ID = [ sSessionId, sSessionId ];
					
							it("should return 1 if the given version is of type normal (t_calculation_version)", () => {
								const iVersionType = persistency.CalculationVersion.getVersionType(1);
								expect(iVersionType).toBe(oCalculationVersionForType.CALCULATION_VERSION_TYPE[0]);
							});
							it("should return 4 if the given version is of type generated from version (t_calculation_version)", () => {
								const iVersionType = persistency.CalculationVersion.getVersionType(2);
								expect(iVersionType).toBe(oCalculationVersionForType.CALCULATION_VERSION_TYPE[1]);
							});
							it("should return 1 if the given version is of type normal (t_calculation_version_temporary)", () => {
								const iVersionType = persistency.CalculationVersion.getVersionType(1, sSessionId);
								expect(iVersionType).toBe(oCalculationVersionForType.CALCULATION_VERSION_TYPE[0]);
							});
							it("should return 4 if the given version is of type generated from version (t_calculation_version_temporary)", () => {
								const iVersionType = persistency.CalculationVersion.getVersionType(2, sSessionId);
								expect(iVersionType).toBe(oCalculationVersionForType.CALCULATION_VERSION_TYPE[1]);
							});
						});
			});
			
			if(jasmine.plcTestRunParameters.mode === 'all'){
				describe('checkSavedVersion', function() {
					var oMockstar = null;
					var persistency = null;
					
					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							testmodel : {
								calculation_version_copy : "sap.plc.db.calculationmanager.procedures/p_calculation_version_copy"
							},
							substituteTables : {
								calculation : mTableNames.calculation,
								calculation_version : mTableNames.calculation_version,
								metadata : {
									name : "sap.plc.db::basis.t_metadata",
									data : testData.mCsvFiles.metadata
								},
								metadata_text : "sap.plc.db::basis.t_metadata__text",
								metadata_item_attributes : {
									name : "sap.plc.db::basis.t_metadata_item_attributes",
									data : testData.mCsvFiles.metadata_item_attributes
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

					it("should return 1 when a calculation version is saved for the calculation", function() {
						// arrange
						var iCalcId = 2078;
						oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);

						// act
						var result = persistency.CalculationVersion.checkSavedVersion(iCalcId);

						// assert
						expect(result).toBe(1);
					});

					it("should return 0 when there is no saved calculation version for the calculation", function() {
						// arrange
						var iCalcId = 12;
						oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);

						// act
						var result = persistency.CalculationVersion.checkSavedVersion(iCalcId);

						// assert
						expect(result).toBe(0);
					});

					it("should return general_unexpected_exception when calculation id is not a number", function() {
						// arrange
						var iCalcId = 'aaa';

						var exception = null;
						// act
						try {
							persistency.CalculationVersion.checkSavedVersion(iCalcId);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					});
				});
			}

        	describe('getCalculationVersion', function() {
        		var oMockstar = null;
				var persistency = null;
				const bReturnLifecycle = 1;
				const bGetOnlyLifecycles = 0;
        		beforeOnce(function() {
        			oMockstar = new MockstarFacade({
        				testmodel : {
							"procRead": "sap.plc.db.calculationmanager.procedures/p_calculations_versions_read"
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
        					calculationVersion : {
        						name : mTableNames.calculation_version,
        						data : testData.oCalculationVersionTestData
        					},
        					item : {
        					    name : mTableNames.item,
        					    data : testData.oItemTestData
        					},
        					recent_calculation_versions : {
        					    name : mTableNames.recent_calculation_versions,
        					    data : testData.oRecentCalculationTestData
        					},
        					component_split : {
        					    name : 'sap.plc.db::basis.t_component_split',
        					    data : testData.oComponentSplitTest
        					},
        					costing_sheet : {
        					    name : 'sap.plc.db::basis.t_costing_sheet',
        					    data : testData.oCostingSheetTestData
        					},
        					costing_sheet_row : {
        					    name : 'sap.plc.db::basis.t_costing_sheet_row',
        					    data : testData.oCostingSheetRowTestData
        					},
        					costing_sheet_base : {
        					    name : 'sap.plc.db::basis.t_costing_sheet_base',
        					    data : testData.oCostingSheetBaseTestData
        					},
        					process : {
        					    name : 'sap.plc.db::basis.t_process',
        					    data : testData.oProcessTestDataPlc
        					},
        					overhead_group : {
        					    name : 'sap.plc.db::basis.t_overhead_group',
        					    data : testData.oOverheadGroupTestDataPlc
        					},
        					plant : {
        					    name : 'sap.plc.db::basis.t_plant',
        					    data : testData.oPlantTestDataPlc
        					},
        					cost_center : {
        					    name : 'sap.plc.db::basis.t_cost_center',
        					    data : testData.oCostCenterTestDataPlc
        					},
        					profit_center : {
        					    name : 'sap.plc.db::basis.t_profit_center',
        					    data : testData.oProfitCenterTestDataPlc
        					},
        					item_ext : "sap.plc.db::basis.t_item_ext",
        					unit_of_measure: "sap.plc.db::basis.t_uom",
        					currency: "sap.plc.db::basis.t_currency",
        					authorization : {
        						name : 'sap.plc.db::auth.t_auth_project',
        						data : {
        							PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0]],
        							USER_ID      : [sUserId],
        							PRIVILEGE    : [InstancePrivileges.READ]
        						}
        					}
        				}
        			});
        		});
        
        		beforeEach(function() {
        			if (!oMockstar.disableMockstar) {
    					var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '::';
    					originalProcedures = CalculationImport.Procedures;
    					CalculationImport.Procedures = Object.freeze({
    						p_calculations_versions_read : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculations_versions_read'
    					});
    				};
        			oMockstar.clearAllTables();
        			if (jasmine.plcTestRunParameters.generatedFields === true) {
        				oMockstar.insertTableData("item_ext", testData.oItemExtData);
					}
        			oMockstar.initializeData();
        			persistency = new Persistency(jasmine.dbConnection);
        		});
        
        		afterOnce(function() {
        			oMockstar.cleanup();
        			if (!oMockstar.disableMockstar) {
						CalculationImport.Procedures = originalProcedures;
					}
        		});
        
        		it('should get all calculations versions for a calculation', function(){
        			//arrange
        			var iTop = null;
        			var iRecentlyUsed = 0; 
        			var sCalculationId = "1978";
        			var iId =  null;
        			var iLoadMasterdata = 0;
        			var iCurrent = 0;

        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(sCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        			expect(oReturnedObject.CALCULATION_VERSIONS.length).toBe(1);
        			expect(oReturnedObject.ITEMS.length).toBe(1);
        			expect(oReturnedObject.CALCULATIONS.length).toBe(0);
        			expect(oReturnedObject.PROJECTS.length).toBe(0);
        		});
        		
        		it('should 1 calculation version with all items', function(){
        			//arrange
        			var iTop = null;
        			var iRecentlyUsed = 0; 
        			var iCalculationId = null;
        			var iId =  testData.iCalculationVersionId;
        			var iLoadMasterdata = 0;
					var iCurrent = 0;
					

        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(iCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        			expect(oReturnedObject.CALCULATION_VERSIONS.length).toBe(1);
        			expect(oReturnedObject.ITEMS.length).toBeGreaterThan(0);
        			expect(oReturnedObject.CALCULATIONS.length).toBe(0);
        			expect(oReturnedObject.PROJECTS.length).toBe(0);
        		});
        		
        		it('should get top 1 calculations versions for a calculation', function(){
        			//arrange
        			var iTop = 1;
        			var iRecentlyUsed = 0; 
        			var sCalculationId = "1978";
        			var iId =  null;
        			var iLoadMasterdata = 0;
        			var iCurrent = 0;
        			
        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(sCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        			expect(oReturnedObject.CALCULATION_VERSIONS.length).toBe(1);
        			expect(oReturnedObject.ITEMS.length).toBe(1);
        			expect(oReturnedObject.ITEMS[0].ITEM_ID).toBe(oReturnedObject.CALCULATION_VERSIONS[0].ROOT_ITEM_ID);
        			expect(oReturnedObject.CALCULATIONS.length).toBe(0);
        			expect(oReturnedObject.PROJECTS.length).toBe(0);
        		});

        		it('should get all recently used calculations versions', function(){
        			//arrange
        			var iTop = null;
        			var iRecentlyUsed = 1; 
        			var iCalculationId = null;
        			var oRecentCelcVersion = JSON.parse(JSON.stringify(testData.oRecentCalculationTestData));
        			var iId =  null;
        			var iLoadMasterdata = 0;
        			var iCurrent = 0;
        			
        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(iCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        			expect(oReturnedObject.CALCULATION_VERSIONS.length).toBe(2);
        			expect(oReturnedObject.ITEMS.length).toBe(2);
        			expect(oReturnedObject.CALCULATIONS.length).toBe(2);
        			expect(oReturnedObject.PROJECTS.length).toBe(1);
        			
        		});
        		
        		it('should get top 1 recently used calculations versions', function(){
        			//arrange
        			var iTop = 1;
        			var iRecentlyUsed = 1; 
        			var iCalculationId = null;
        			var iId =  null;
        			var iLoadMasterdata = 0;
        			var iCurrent = 0;
        			
        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(iCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        			expect(oReturnedObject.CALCULATION_VERSIONS.length).toBe(1);
        			expect(oReturnedObject.ITEMS.length).toBe(1);
        			expect(oReturnedObject.CALCULATIONS.length).toBe(1);
        			expect(oReturnedObject.PROJECTS.length).toBe(1);
        			
        		}); 
        		
        		it('should get MASTERDATA (uom + currency) for recently used calculations versions', function(){
        			//arrange
        			oMockstar.insertTableData("unit_of_measure", testData.mCsvFiles.uom);
        			oMockstar.insertTableData("currency", testData.mCsvFiles.currency);
        			var iTop = null;
        			var iRecentlyUsed = 1; 
        			var iCalculationId = null;
        			var iId =  null;
        			var iLoadMasterdata = 1;
        			var iCurrent = 0;
        			
        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(iCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        		    expect(oReturnedObject.MASTERDATA.UNIT_OF_MEASURE_ENTITIES.length).toBeGreaterThan(0);
                    expect(oReturnedObject.MASTERDATA.CURRENCY_ENTITIES.length).toBeGreaterThan(0);
        		});  

        		it('should NOT get MASTERDATA (uom + currency) for recently used calculations versions', function(){
        			//arrange
        			var iTop = null;
        			var iRecentlyUsed = 1; 
        			var iCalculationId = null;
        			var iId =  null;
        			var iLoadMasterdata = 0;
        			var iCurrent = 0;
        			
        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(iCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        		    expect(oReturnedObject.MASTERDATA.UNIT_OF_MEASURE_ENTITIES.length).toBe(0);
                    expect(oReturnedObject.MASTERDATA.CURRENCY_ENTITIES.length).toBe(0);
        		}); 
        		
        		it('should not return any entries if calculation no longer exists', function(){
        			//arrange
        			var exception = null;
        			var iTop = null;
        			var iRecentlyUsed = 0; 
        			var iCalculationId = '00740074';
        			var iId =  null;
        			var iLoadMasterdata = 0;
        			var iCurrent = 0;
        			
        			//act
        		    var oReturnedObject = persistency.CalculationVersion.get(iCalculationId, iTop
                						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			// assert
        			expect(oReturnedObject.CALCULATION_VERSIONS.length).toBe(0);
        			expect(oReturnedObject.ITEMS.length).toBe(0);
        			expect(oReturnedObject.CALCULATIONS.length).toBe(0);
        			expect(oReturnedObject.PROJECTS.length).toBe(0);
        		});        		
        		
        		it('should return only one calculation version for calculation_id (current is true) and only the root item for the version', function(){
        			//arrange
        			var iTop = null;
        			var iRecentlyUsed = 0; 
        			var sCalculationId = "1978";
        			var iId =  null;
        			var iLoadMasterdata = 0; 
        			var iCurrent = 1;

        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(sCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        			expect(oReturnedObject.CALCULATION_VERSIONS.length).toBe(1);
        			expect(oReturnedObject.ITEMS.length).toBe(1);
        			expect(oReturnedObject.CALCULATIONS.length).toBe(1);
        			expect(oReturnedObject.PROJECTS.length).toBe(0);
        		});   
        		
        		it('should get all references data for a calculation version', function(){
        			//arrange
        			const iTop = null, sCalculationId = testData.iCalculationId.toString(), iId = null;
        			const iRecentlyUsed = 0, iLoadMasterdata = 0, iCurrent = 0; 
        			oMockstar.clearTable("item");
                    const iReferenceVersionId = testData.iSecondVersionId;
    				let oItemWithReferences = new TestDataUtility(testData.oItemTestData).build();
    				oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID = [];
    				oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID.push(iReferenceVersionId);
    				oMockstar.insertTableData("item", oItemWithReferences);
        			//act
        			const oReturnedObject = persistency.CalculationVersion.get(sCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);

        			//assert
        			expect(oReturnedObject.referencesdata).toBeDefined();
        			expect(oReturnedObject.referencesdata.PROJECTS.length).toBe(1);
        			expect(oReturnedObject.referencesdata.CALCULATIONS.length).toBe(1);
        			expect(oReturnedObject.referencesdata.CALCULATION_VERSIONS.length).toBe(1);
        			expect(oReturnedObject.referencesdata.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID).toBe(iReferenceVersionId);
        			expect(oReturnedObject.referencesdata.MASTERDATA).toBeDefined();
        		});
        		it('should get only the uoms valid for calculations versions', function(){
        			//arrange
        			oMockstar.clearTable("unit_of_measure");
        			const oValidInvalidUoms = {
        			    "UOM_ID": ["PC","WWW"],
                		"DIMENSION_ID": ["D2","TIME"],
                		"NUMERATOR": [1,60],
                		"DENOMINATOR": [1,1],
                		"EXPONENT_BASE10": [0,0],
                		"SI_CONSTANT": [0,0],
                		"_VALID_FROM": ["2015-06-02T14:45:50.096Z","2015-06-02T14:45:50.096Z"],
                		"_VALID_TO": [null, "2015-06-02T14:45:50.096Z"],
                		"_SOURCE": [1,2],
                		"_CREATED_BY": ["U000", "U000"]
        			};
        			oMockstar.insertTableData("unit_of_measure", oValidInvalidUoms);
        			const iTop = null, iCalculationId = null, iId =  null;
        			const iCurrent = 0, iRecentlyUsed = 1, iLoadMasterdata = 1;
        			
        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(iCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);
        			//assert
        		    expect(oReturnedObject.MASTERDATA.UNIT_OF_MEASURE_ENTITIES.length).toBe(1);
        		    expect(oReturnedObject.MASTERDATA.UNIT_OF_MEASURE_ENTITIES[0].UOM_ID).toBe(oValidInvalidUoms.UOM_ID[0]);
        		}); 
                it('should not get uoms and currencies invalid for calculations versions', function(){
        			//arrange
        			oMockstar.clearTable("currency");
        			const oValidInvalidCurrencies = {
        			    "CURRENCY_ID": ["EUR","WWW"],
                		"_VALID_FROM": ["2015-06-02T14:45:50.096Z", "2015-06-02T14:45:50.096Z"],
                		"_VALID_TO": [null, "2015-06-02T14:45:50.096Z"],
                		"_SOURCE": [1,2],
                		"_CREATED_BY": ["U000", "U000"]
        			};
        			oMockstar.insertTableData("currency", oValidInvalidCurrencies);
        			const iTop = null, iCalculationId = null, iId =  null;
        			const iCurrent = 0, iRecentlyUsed = 1, iLoadMasterdata = 1;
        			//act
        			var oReturnedObject = persistency.CalculationVersion.get(iCalculationId, iTop
            						, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, testData.sDefaultLanguage, iCurrent, bReturnLifecycle, bGetOnlyLifecycles);
        			//assert
        		    expect(oReturnedObject.MASTERDATA.CURRENCY_ENTITIES.length).toBe(1);
        		    expect(oReturnedObject.MASTERDATA.CURRENCY_ENTITIES[0].CURRENCY_ID).toBe(oValidInvalidCurrencies.CURRENCY_ID[0]);
        		}); 
        	});
        	
        	if (jasmine.plcTestRunParameters.mode === 'all') {
        		describe("getControllingAreasForCalculationVersions", function() {

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
        						calculation_version : {
        							name : mTableNames.calculation_version,
        							data : testData.oCalculationVersionTestData
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

        			it("should return all distinct controlling areas for an array of calculation version id", function() {
        				// arrange
        				var aCalculationVersionId = [ 2809, 4809, 5809 ];

        				// act
        				var result = persistency.CalculationVersion.getControllingAreasForCalculationVersions(aCalculationVersionId);

        				// assert
        				expect(result).toBeDefined();
        				expect(result.length).toBe(1);
        				expect(result[0]).toBe('1000');

        			});

        			it("should return an empty array if calculation version does not exist in the table", function() {
        				// arrange
        				var aCalculationVersionId = [ 9999 ];

        				// act
        				var result = persistency.CalculationVersion.getControllingAreasForCalculationVersions(aCalculationVersionId);

        				// assert
        				expect(result).toBeDefined();
        				expect(result.length).toBe(0);
        			});
        			
        			it("should throw exception when calculation version id is not a number", function() {
        				// arrange
        				var aInvalidArrayValues = [ 1.1, -1, "1a", undefined, null ];
        				var exception = null;

        				// act
        				try {
        					persistency.CalculationVersion.getControllingAreasForCalculationVersions(aInvalidArrayValues);
        				} catch (e) {
        					exception = e;
        				}

        				// assert
        				expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
        				expect(exception.developerMessage).toBe("iCalculationVersionId must be a positive integer.");
        			});

        			it("should throw exception when the parameter is not an array", function() {
        				// arrange
        				var aInvalidArray = {};
        				var exception = null;

        				// act
        				try {
        					persistency.CalculationVersion.getControllingAreasForCalculationVersions(aInvalidArray);
        				} catch (e) {
        					exception = e;
        				}

        				// assert
        				expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
        				expect(exception.developerMessage).toBe("aCalculationVersionIds must be an array.");
        			});
        			
        		});
        	}
        	describe("getProjectPropertiesForCalculationVersion", function() {

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
							calculation_version_temporary : {
								name : mTableNames.calculation_version_temporary,
								data : testData.oCalculationVersionTemporaryTestData
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


				it("should return project properties", function() {
					// arrange
					var iCalculationVersionId = 2809;
					
					// act
					var result = persistency.CalculationVersion.getProjectPropertiesForCalculationVersion(iCalculationVersionId);

					// assert
					expect(result).toBeDefined();
					expect(result.REPORT_CURRENCY_ID).toBe(testData.oProjectTestData.REPORT_CURRENCY_ID[0]);
					expect(result.CONTROLLING_AREA_ID).toBe(testData.oProjectTestData.CONTROLLING_AREA_ID[0]);
					
				});

				it("should return null if calculation version does not exist in the table", function() {
					// arrange
					var iCalculationVersionId = 9999;

					// act
					var result = persistency.CalculationVersion.getProjectPropertiesForCalculationVersion(iCalculationVersionId);

					// assert
					expect(result).toBe(null);
				});
			});
        	
        	describe("getCalculationVersionsToBeReferenced", function() {

				var oMockstar = null;
				var persistency = null;
				var aResultProperties = ["CALCULATION_VERSION_ID", "CALCULATION_VERSION_NAME", "CUSTOMER_ID", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY",
				                         "CALCULATION_ID", "CALCULATION_NAME", "PROJECT_ID", "PROJECT_NAME", "PROJECT_RESPONSIBLE", "REPORT_CURRENCY_ID", "EXCHANGE_RATE_TYPE_ID",
				                         "TOTAL_COST", "TOTAL_QUANTITY", "TOTAL_QUANTITY_UOM_ID", "MATERIAL_ID", "PLANT_ID",
				                         "PROJECT_CUSTOMER_NAME", "CALCULATION_VERSION_CUSTOMER_NAME"];
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
							calculation_version: {
								name : mTableNames.calculation_version,
								data : testData.oCalculationVersionTestData
							},
							item: {
								name : mTableNames.item,
								data : testData.oItemTestData
							},
							plant_text: {
								name : mTableNames.plant_text,
								data : testData.oPlantTextTestDataPlc
							},
							material_text: {
								name : mTableNames.material_text,
								data : testData.oMaterialTextTestDataPlc
							},
							customer: {
								name : mTableNames.customer,
								data : testData.oCustomerTestDataPlc
							},
							calculation_version_temporary: {
								name : mTableNames.calculation_version_temporary,
								data : testData.oCalculationVersionTemporaryTestData
							},
							authorization : {
        						name : 'sap.plc.db::auth.t_auth_project',
        						data : {
        							PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1], testData.oProjectTestData.PROJECT_ID[2]],
        							USER_ID      : [sUserId, sUserId, sUserId],
        							PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ, InstancePrivileges.READ]
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


				it("should be empty when no data found in the table for the filters", function() {
					// arrange
					var sFilters = 'MATERIAL=ma,PLANT=p,CALCULATION=1';
					var sSortedColumnId = 'CALCULATION_ID';
					var sSortedDirection = 'Desc';
					var iTop = 100;
					var iCalcVersId = 2809;
					var sLanguage = 'EN';
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(0);
				});
				
				it("should return current calculation versions and all related information for the existing filters", function() {
					// arrange
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
					var sFilters = 'CALCULATION_VERSION=VERsiOn2';
					var sSortedColumnId = 'CALCULATION_VERSION_ID';
					var sSortedDirection = 'Desc';
					var iTop = 100;
					var iCalcVersId = 2809;
					var sLanguage = 'EN';
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(1);
					expect(_.keys(result[0])).toEqual(aResultProperties);
					//check the information
					expect(result[0]).toMatchData( { "PROJECT_ID": "PR1",
														"PROJECT_NAME": "Prj 1",
														"PROJECT_RESPONSIBLE": sUserId,
														"CALCULATION_ID": 2078,
														"CALCULATION_NAME": 'Calculation Pump P-100',
														"CALCULATION_VERSION_ID": 4809,
														"CALCULATION_VERSION_NAME": "Baseline Version2",
														"LAST_MODIFIED_BY": sUserId,
														"REPORT_CURRENCY_ID": "USD",
														"EXCHANGE_RATE_TYPE_ID": sDefaultExchangeRateType,
														"TOTAL_QUANTITY" : "1.0000000",
														"TOTAL_QUANTITY_UOM_ID" : "PC"
					                                }, ["CALCULATION_ID"]);
				});
				
				it("should return current calculation versions and all related information for the existing filters, for the newly created version", function() {
					// arrange
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
					var sFilters = 'CALCULATION_VERSION=VERsiOn2';
					var sSortedColumnId = 'CALCULATION_VERSION_ID';
					var sSortedDirection = 'Desc';
					var iTop = 100;
					var iCalcVersId = 8888;
					var sLanguage = 'EN';
					var sProjectReportCurrencyID= testData.oProjectTestData.REPORT_CURRENCY_ID[0];
					var sReportCurrencyId = 'USD';
					var sProjectId = 'PR1';
					oMockstar.insertTableData("calculation_version_temporary", {
					            "SESSION_ID": sUserId,
                        		"CALCULATION_VERSION_ID" : 8888,
                        		"CALCULATION_ID" : 1978,
                        		"CALCULATION_VERSION_NAME" : "Baseline Version test",
                        		"ROOT_ITEM_ID" : 9946,
                        		"CUSTOMER_ID" : "",
                        		"SALES_PRICE" : 10,
                        		"SALES_PRICE_CURRENCY_ID" : "EUR",
                        		"REPORT_CURRENCY_ID" : sReportCurrencyId,
                        		"SALES_DOCUMENT" : "DOC",
                        		"START_OF_PRODUCTION" : testData.sExpectedDateWithoutTime,
                        		"END_OF_PRODUCTION" : testData.sExpectedDateWithoutTime,
                        		"VALUATION_DATE" : testData.sExpectedDateWithoutTime,
                        		"LAST_MODIFIED_ON" : testData.sExpectedDate,
                        		"LAST_MODIFIED_BY" : sUserId,
                        		"MASTER_DATA_TIMESTAMP" : testData.sMasterdataTimestampDate,
								"IS_FROZEN" : 0,
								"MATERIAL_PRICE_STRATEGY_ID": sStandardPriceStrategy,
								"ACTIVITY_PRICE_STRATEGY_ID": sStandardPriceStrategy
					});

		    		// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);
					var prjResultReportCurrencyId = oMockstar.execQuery(`select REPORT_CURRENCY_ID from {{project}} where project_id =  '${sProjectId}';`).columns.REPORT_CURRENCY_ID.rows[0];

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(1);
					expect(_.keys(result[0])).toEqual(aResultProperties);
					expect(prjResultReportCurrencyId).toBe(sProjectReportCurrencyID);
					//check the information
					expect(result[0]).toMatchData( { "PROJECT_ID": "PR1",
														"PROJECT_NAME": "Prj 1",
														"PROJECT_RESPONSIBLE": sUserId,
														"CALCULATION_ID": 2078,
														"CALCULATION_NAME": 'Calculation Pump P-100',
														"CALCULATION_VERSION_ID": 4809,
														"CALCULATION_VERSION_NAME": "Baseline Version2",
														"LAST_MODIFIED_BY": sUserId,
														"REPORT_CURRENCY_ID": "USD",
														"EXCHANGE_RATE_TYPE_ID": sDefaultExchangeRateType,
														"TOTAL_QUANTITY" : "1.0000000",
														"TOTAL_QUANTITY_UOM_ID" : "PC"}, ["CALCULATION_ID"]);
				});
				
				it("should return only the current versions that are in a project with the same controlling area", function() {
					// arrange
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
					oMockstar.insertTableData("item", testData.oItemTestData1);
					oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
					var sFilters = 'CALCULATION_VERSION=VERsiOn';
					var sSortedColumnId = 'CALCULATION_VERSION_ID';
					var sSortedDirection = 'Asc';
					var iTop = 100;
					var iCalcVersId = 9193;
					var sLanguage = 'EN';
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(2);
					expect(_.keys(result[0])).toEqual(aResultProperties);
					//check the information
					expect(result[0]).toMatchData( { "PROJECT_ID": "PRR",
														"PROJECT_NAME": "Prj 3",
														"PROJECT_RESPONSIBLE": sUserId,
														"PROJECT_CUSTOMER_NAME": "N1",
														"CALCULATION_ID": 191,
														"CALCULATION_NAME": "Calculation pump 91",
														"CALCULATION_VERSION_ID": 9191,
														"CALCULATION_VERSION_NAME": "Baseline Version41",
														"CALCULATION_VERSION_CUSTOMER_NAME": "N2",
														"LAST_MODIFIED_BY": sUserId,
														"REPORT_CURRENCY_ID": "EUR",
														"EXCHANGE_RATE_TYPE_ID": sDefaultExchangeRateType,
														"TOTAL_QUANTITY" : "1.0000000",
														"TOTAL_QUANTITY_UOM_ID" : "PC"}, ["CALCULATION_ID"]);
					expect(result[1]).toMatchData( { "PROJECT_ID": "PRR",
														"PROJECT_NAME": "Prj 3",
														"PROJECT_RESPONSIBLE": sUserId,
														"PROJECT_CUSTOMER_NAME": "N1",
														"CALCULATION_ID": 222,
														"CALCULATION_NAME": "Calculation pump 92",
														"CALCULATION_VERSION_ID": 9192,
														"CALCULATION_VERSION_NAME": "Baseline Version51",
														"CALCULATION_VERSION_CUSTOMER_NAME": "N3",
														"LAST_MODIFIED_BY": sUserId,
														"REPORT_CURRENCY_ID": "USD",
														"EXCHANGE_RATE_TYPE_ID": sDefaultExchangeRateType,
														"TOTAL_QUANTITY" : "1.0000000",
														"TOTAL_QUANTITY_UOM_ID" : "PC"}, ["CALCULATION_ID"]);
				});
				
				it("should not return all the current versions from the project that match the customer filter if the user does not have the read privilege for project", function() {
					// arrange
					//same test data as above but without the read privilege for project
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
					oMockstar.insertTableData("item", testData.oItemTestData1);
					oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
					var sFilters = 'CUSTOMER=1';
					var sSortedColumnId = 'CALCULATION_VERSION_ID';
					var sSortedDirection = 'Asc';
					var iTop = 100;
					var iCalcVersId = 9193;
					var sLanguage = 'EN';
					oMockstar.clearTable("authorization");					
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(0);
				});
				
				it("should return all the current versions that match the version customer filter", function() {
					// arrange
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
					oMockstar.insertTableData("item", testData.oItemTestData1);
					oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
					var sFilters = 'CALCULATION_VERSION=VERsiOn,Customer=2';
					var sSortedColumnId = 'CALCULATION_VERSION_ID';
					var sSortedDirection = 'Asc';
					var iTop = 100;
					var iCalcVersId = 9193;
					var sLanguage = 'EN';
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(1);
					expect(_.keys(result[0])).toEqual(aResultProperties);
					//check the information from the response
					expect(result[0]).toMatchData( { "PROJECT_ID": "PRR",
														"PROJECT_NAME": "Prj 3",
														"PROJECT_RESPONSIBLE": sUserId,
														"PROJECT_CUSTOMER_NAME": "N1",
														"CALCULATION_ID": 191,
														"CALCULATION_NAME": "Calculation pump 91",
														"CALCULATION_VERSION_ID": 9191,
														"CALCULATION_VERSION_NAME": "Baseline Version41",
														"CALCULATION_VERSION_CUSTOMER_NAME": "N2",
														"LAST_MODIFIED_BY": sUserId,
														"REPORT_CURRENCY_ID": "EUR",
														"EXCHANGE_RATE_TYPE_ID": sDefaultExchangeRateType,
														"TOTAL_QUANTITY" : "1.0000000",
														"TOTAL_QUANTITY_UOM_ID" : "PC"}, ["CALCULATION_ID"]);
				});
				
				it("should return all the sortedv (by column id and direction) current versions that match the filter", function() {
					// arrange
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
					oMockstar.insertTableData("item", testData.oItemTestData1);
					oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
					var sFilters = 'CALCULATION_VERSION=VERsiOn,CUSTOMER=1';
					var sSortedColumnId = 'CALCULATION_ID';
					var sSortedDirection = 'Desc';
					var iTop = 100;
					var iCalcVersId = 9193;
					var sLanguage = 'EN';
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result[0].CALCULATION_ID).toBeGreaterThan(result[1].CALCULATION_ID);
				});
				
				it("should return all current calculation versions from projects that have the same controlling area when filter is not defined", function() {
					// arrange
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
					oMockstar.insertTableData("item", testData.oItemTestData1);
					oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
					var sFilters = null;
					var sSortedColumnId = 'CALCULATION_VERSION_ID';
					var sSortedDirection = 'Asc';
					var iTop = 100;
					var iCalcVersId = 9193;
					var sLanguage = 'EN';
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(2);
				});
				
				it("should return all current calculation versions that match filter when wildcards exist in filter", function() {
					// arrange
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
					oMockstar.insertTableData("item", testData.oItemTestData1);
					oMockstar.insertTableData("calculation", testData.oCalculationTestData1);
					var sFilters = 'CALCULATION_VERSION=Ve+Si*4';
					var sSortedColumnId = 'CALCULATION_VERSION_ID';
					var sSortedDirection = 'Asc';
					var iTop = 100;
					var iCalcVersId = 9193;
					var sLanguage = 'EN';
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(1);
				});
				
				it("should return empty when only current opened calculation version exists in the tables (self-reference not allowed)", function() {
					// arrange
					oMockstar.clearAllTables();
					
					var oTestCalcVersion = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
					oMockstar.insertTableData("calculation_version", oTestCalcVersion);
					var oTestItem = new TestDataUtility(testData.oItemTestData).getObject(0);
					oMockstar.insertTableData("item", oTestItem);
					var oTestCalc = new TestDataUtility(testData.oCalculationTestData).getObject(0);
					oMockstar.insertTableData("calculation", oTestCalc);
					var oTestProject = new TestDataUtility(testData.oProjectTestData).getObject(0);
					oMockstar.insertTableData("project", oTestProject);

					var sFilters = null;
					var sSortedColumnId = 'CALCULATION_VERSION_ID';
					var sSortedDirection = 'Asc';
					var iTop = 100;
					var iCalcVersId = 2809;
					var sLanguage = 'EN';
					
					// act
					var result = persistency.CalculationVersion.getCalculationVersionsToBeReferenced(iCalcVersId, sFilters, sSortedColumnId, sSortedDirection, iTop, sLanguage, sUserId);

					// assert
					expect(result).toBeDefined();
					expect(result.length).toBe(0);
				});

			});        	
        	
        	describe("setFrozenFlags", function() {
        		var oMockstar = null;
				var persistency = null;
							
				beforeOnce(function() {
					oMockstar = new MockstarFacade({
						substituteTables : {
							open_calculation_versions : {
								name : mTableNames.open_calculation_versions,
								data : testData.oOpenCalculationVersionsTestData
							},
							calculation_version_temporary : {
								name : mTableNames.calculation_version_temporary,
								data : testData.oCalculationVersionTemporaryTestData
							},
							calculation_version : {
								name : mTableNames.calculation_version,
								data : testData.oCalculationVersionTestData
							},
							session : "sap.plc.db::basis.t_session"							
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
				
				it('should set IS_FROZEN flag for a calculation version and for lifecycle versions in t_calculation_version and t_calculation_version_temporary', function() {						
					//act
					persistency.CalculationVersion.setFrozenFlags(testData.iCalculationVersionId, testData.sSessionId, [testData.iSecondVersionId, 5809]);
					
					//assert: Check if the calculation version with the specified id has been frozen
					var resultCV = oMockstar.execQuery(`select CALCULATION_VERSION_ID, IS_FROZEN from {{calculation_version}} where CALCULATION_VERSION_ID in (${testData.oCalculationVersionTestData.CALCULATION_VERSION_ID})`);
					var resultCVTemp = oMockstar.execQuery(`select SESSION_ID, CALCULATION_VERSION_ID, IS_FROZEN from {{calculation_version_temporary}} where CALCULATION_VERSION_ID = ${testData.iCalculationVersionId}`);
					var expectedCVData = {
							"CALCULATION_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID,
							"IS_FROZEN" : [ 1, 1, 1 ]
						};
					var expectedCVTempData = {
						"SESSION_ID" : [ testData.sSessionId ],
						"CALCULATION_VERSION_ID" : [ testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0] ],
						"IS_FROZEN" : [ 1 ]
					};
					
					expect(resultCV).toBeDefined();
					expect(resultCVTemp).toBeDefined();					
					expect(resultCV).toMatchData(expectedCVData, [ 'CALCULATION_VERSION_ID', 'IS_FROZEN' ]);
					expect(resultCVTemp).toMatchData(expectedCVTempData, [ 'SESSION_ID', 'CALCULATION_VERSION_ID', 'IS_FROZEN' ]);
					
				});
				
				it('should set IS_FROZEN flag only for a calculation version in t_calculation_version and t_calculation_version_temporary if lifecycle versions are not assigned', function() {						
					//act
					persistency.CalculationVersion.setFrozenFlags(testData.iCalculationVersionId, testData.sSessionId, []);
					
					//assert: Check if the calculation version with the specified id has been frozen
					var resultCV = oMockstar.execQuery(`select CALCULATION_VERSION_ID, IS_FROZEN from {{calculation_version}} where CALCULATION_VERSION_ID in (${testData.oCalculationVersionTestData.CALCULATION_VERSION_ID})`);
					var resultCVTemp = oMockstar.execQuery(`select SESSION_ID, CALCULATION_VERSION_ID, IS_FROZEN from {{calculation_version_temporary}} where CALCULATION_VERSION_ID = ${testData.iCalculationVersionId}`);
					var expectedCVData = {
							"CALCULATION_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID,
							"IS_FROZEN" : [ 1, 0, 0 ]
						};
					var expectedCVTempData = {
						"SESSION_ID" : [ testData.sSessionId ],
						"CALCULATION_VERSION_ID" : [ testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0] ],
						"IS_FROZEN" : [ 1 ]
					};
					
					expect(resultCV).toBeDefined();
					expect(resultCVTemp).toBeDefined();					
					expect(resultCV).toMatchData(expectedCVData, [ 'CALCULATION_VERSION_ID', 'IS_FROZEN' ]);
					expect(resultCVTemp).toMatchData(expectedCVTempData, [ 'SESSION_ID', 'CALCULATION_VERSION_ID', 'IS_FROZEN' ]);
					
				});
				
				it('should set IS_WRITEABLE flag for an opened calculation version', function() {						
					//act
					persistency.CalculationVersion.setFrozenFlags(testData.iCalculationVersionId, testData.sSessionId, []);
					
					//assert: Check if IS_WRITEABLE flag has been changed in the database
					var resultOpenCV = oMockstar.execQuery(`select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}} where CALCULATION_VERSION_ID = ${testData.iCalculationVersionId}`);
					var expectedFrozenCV = {
						"SESSION_ID" : [ testData.sSessionId ],
						"CALCULATION_VERSION_ID" : [ testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0] ],
						"IS_WRITEABLE" : [ 0 ]
					};
					
					expect(resultOpenCV).toBeDefined();
					expect(resultOpenCV).toMatchData(expectedFrozenCV, [ 'SESSION_ID', 'CALCULATION_VERSION_ID', 'IS_WRITEABLE' ]);
				});
				
			});
        	
			describe('isFrozen', function() {
				
				var oMockstar;
				var persistency = null;

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables: // substitute all used tables in the procedure or view
							{
								calculation_version: "sap.plc.db::basis.t_calculation_version"
							}
						});

				});

				beforeEach(function() {
				
					persistency = new Persistency(jasmine.dbConnection); 
					
					// "deep clone" testData Objects to avoid Object dependencies
					var oCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));

					// Modify test data set to represent all valid states for DB column is_frozen
					oCalculationVersionTestData.IS_FROZEN[0] = 0;
					oCalculationVersionTestData.IS_FROZEN[1] = null;
					oCalculationVersionTestData.IS_FROZEN[2] = 1;

					// Load modified test data into mocked data set
					oMockstar.clearTable("calculation_version");
					oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);

				});

				it('should return false for non-frozen calculation version (db value "0")', function() {
					//act
					var bResult = persistency.CalculationVersion.isFrozen(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);

					//assert
					expect(bResult).toBe(false);
				});

				it('should return false for non-frozen calculation_version (db value "null")', function() {
					//act
					var bResult = persistency.CalculationVersion.isFrozen(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1]);

					//assert
					expect(bResult).toBe(false);
				});

				it('should return true for frozen calculation version (db value "1")', function() {
					//act
					var bResult = persistency.CalculationVersion.isFrozen(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2]);

					//assert
					expect(bResult).toBe(true);
				});

				it('should return false for calculation_version with unexpected values in frozen flag column (db column value "7")', function() {
					// "deep clone" testData Objects to avoid Object dependencies
					var oInvalidFrozenCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));

					// Modify default test data to an invalid value for is_frozen (valid values are: 0, null, 1)
					oInvalidFrozenCalculationVersionTestData.IS_FROZEN[0] = 7;

					// Load modified test data into mocked data set
					oMockstar.clearTable("calculation_version");
					oMockstar.insertTableData("calculation_version", oInvalidFrozenCalculationVersionTestData);

					//act
					var bResult = persistency.CalculationVersion.isFrozen(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);

					//assert
					expect(bResult).toBe(false);
				});

			});
			
			describe('areFrozen', function() {
				
				var oMockstar;
				var persistency = null;
				var aCvIds = _.map(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID, iCvId => iCvId);

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables: // substitute all used tables in the procedure or view
							{
								calculation_version: "sap.plc.db::basis.t_calculation_version"
							}
						});

				});

				beforeEach(function() {
					persistency = new Persistency(jasmine.dbConnection); 
					oMockstar.clearTable("calculation_version");
				});

				it('should return empty array if no version is frozen (db value 0)', function() {
					// arrange
					var aIsFrozenValues = _.map(aCvIds, iCvId => 0);
					var oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("IS_FROZEN", aIsFrozenValues).build();
					oMockstar.insertTableData("calculation_version", oCvTestData);
										
					//act
					var aFrozenVersionIds = persistency.CalculationVersion.areFrozen(aCvIds);

					//assert
					expect(aFrozenVersionIds).toEqual([]);
				});

				it('should return empty array if no version is frozen (db value null)', function() {
					// arrange
					var aIsFrozenValues = _.map(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID, iCvId => null);
					var oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("IS_FROZEN", aIsFrozenValues).build();
					oMockstar.insertTableData("calculation_version", oCvTestData);
										
					//act
					var aFrozenVersionIds = persistency.CalculationVersion.areFrozen(aCvIds);

					//assert
					expect(aFrozenVersionIds).toEqual([]);
				});
				
				it('should return empty array if no version is frozen (db values mixed 0 and null)', function() {
					// arrange
					var aIsFrozenValues = _.map(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID, (iCvId, iIndex)=> iIndex % 2 === 0 ? 0 : null);
					var oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("IS_FROZEN", aIsFrozenValues).build();
					oMockstar.insertTableData("calculation_version", oCvTestData);
										
					//act
					var aFrozenVersionIds = persistency.CalculationVersion.areFrozen(aCvIds);

					//assert
					expect(aFrozenVersionIds).toEqual([]);
				});

				it('should return first and second version id when they are marked as frozen (db value 1)', function() {
					// arrange
					var aIsFrozenValues = [];
					var aExpectedFrozenVersions = [];

					_.each(aCvIds, (iCvId, iIndex) => {
						if(iIndex < 1){
							aIsFrozenValues.push(1);
							aExpectedFrozenVersions.push(iCvId);
						} else {
							aIsFrozenValues.push(0);
						}
					});
					var oCvTestData = new TestDataUtility(testData.oCalculationVersionTestData).replaceValue("IS_FROZEN", aIsFrozenValues).build();
					oMockstar.insertTableData("calculation_version", oCvTestData);

					//act
					var aFrozenVersionIds = persistency.CalculationVersion.areFrozen(aCvIds);

					//assert
					expect(_.difference(aExpectedFrozenVersions, aFrozenVersionIds)).toEqual([]);
				});
			});
			
			describe('isLifecycleVersion', function() {

				var oMockstar;
				var persistency = null;

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
							{
								substituteTables: {
									calculation_version: "sap.plc.db::basis.t_calculation_version"
								}
							});
				});

				beforeEach(function() {

					persistency = new Persistency(jasmine.dbConnection); 

					var oCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
					oCalculationVersionTestData.CALCULATION_VERSION_TYPE[0] = 1;
					oCalculationVersionTestData.CALCULATION_VERSION_TYPE[1] = 2;
					oCalculationVersionTestData.CALCULATION_VERSION_TYPE[2] = 3; //invalid value

					oMockstar.clearTable("calculation_version");
					oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);

				});

				it('should return false if calculation version is a base version (db value "1")', function() {
					//act
					var bResult = persistency.CalculationVersion.isLifecycleVersion(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);

					//assert
					expect(bResult).toBe(false);
				});

				it('should return true if calculation version is a lifecycle version (db value "2")', function() {
					//act
					var bResult = persistency.CalculationVersion.isLifecycleVersion(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1]);

					//assert
					expect(bResult).toBe(true);
				});

				it('should return false for a calculation version with unexpected value in calculation version type column (db column value "3")', function() {
					//act
					var bResult = persistency.CalculationVersion.isLifecycleVersion(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2]);

					//assert
					expect(bResult).toBe(false);
				});
			});

			describe('isManualLifecycleVersion', function() {

				var oMockstar;
				var persistency = null;

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
							{
								substituteTables: {
									calculation_version: "sap.plc.db::basis.t_calculation_version"
								}
							});
				});

				beforeEach(function() {

					persistency = new Persistency(jasmine.dbConnection); 

					var oCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
					oCalculationVersionTestData.CALCULATION_VERSION_TYPE[0] = 1;
					oCalculationVersionTestData.CALCULATION_VERSION_TYPE[1] = 16;
					oCalculationVersionTestData.CALCULATION_VERSION_TYPE[2] = 3; //invalid value

					oMockstar.clearTable("calculation_version");
					oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);

				});

				it('should return false if calculation version is a base version (db value "1")', function() {
					//act
					var bResult = persistency.CalculationVersion.isManualLifecycleVersion(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);

					//assert
					expect(bResult).toBe(false);
				});

				it('should return true if calculation version is a manual lifecycle version (db value "16")', function() {
					//act
					var bResult = persistency.CalculationVersion.isManualLifecycleVersion(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1]);

					//assert
					expect(bResult).toBe(true);
				});

				it('should return false for a calculation version with unexpected value in calculation version type column (db column value "3")', function() {
					//act
					var bResult = persistency.CalculationVersion.isManualLifecycleVersion(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2]);

					//assert
					expect(bResult).toBe(false);
				});
			});

			describe('setVersionLock', function() {
				
				var oMockstar;
				var persistency;
				var oCalculationVersionTestData;

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables: // substitute all used tables in the procedure or view
							{
								open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions",
								calculation_version: "sap.plc.db::basis.t_calculation_version",
								item: "sap.plc.db::basis.t_item",
								item_temporary: "sap.plc.db::basis.t_item_temporary",
								calculation : "sap.plc.db::basis.t_calculation",
								authorization : "sap.plc.db::auth.t_auth_project"
							}
						});

				});

				beforeEach(function() { 
					persistency = new Persistency(jasmine.dbConnection); 
					
					// "deep clone" testData Objects to avoid Object dependencies
					oCalculationVersionTestData = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));

					// Modify test data set to represent all valid states for DB column is_frozen
					oCalculationVersionTestData.IS_FROZEN[0] = 0;
					oCalculationVersionTestData.IS_FROZEN[1] = null;
					oCalculationVersionTestData.IS_FROZEN[2] = 1;

					// Clear Tables under test
					oMockstar.clearTable("open_calculation_versions");
					oMockstar.clearTable("calculation_version");
					
					// Load modified test data into mocked data set
					oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
					oMockstar.insertTableData("calculation", testData.oCalculationTestData);

				});
				
				function enterPrivilege(sProjectId, sUserId, sPrivilege){
        		        oMockstar.insertTableData("authorization",{
        		           PROJECT_ID   : [sProjectId],
        		           USER_ID      : [sUserId],
        		           PRIVILEGE    : [sPrivilege]
        		        });
        		}

				it('should set a write lock for a non-frozen calculation version (is_frozen = null) - user has CREATE_EDIT instance-based privilege', function() {
					//arrange
					enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
					
					//act
					persistency.CalculationVersion.setVersionLock(oCalculationVersionTestData.CALCULATION_VERSION_ID[1], testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

					//assert: Check if calculation has been locked in the database
					var result = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(result).toBeDefined();
					var expectedLockingResult = {
						"SESSION_ID": [testData.sSessionId],
						"CALCULATION_VERSION_ID": [oCalculationVersionTestData.CALCULATION_VERSION_ID[1]],
						"IS_WRITEABLE": [1]
					};
					expect(result).toMatchData(expectedLockingResult, ['SESSION_ID']);
				});

				it('should set a write lock for a non-frozen calculation version (is_frozen = 0) - user has CREATE_EDIT instance-based privilege', function() {
					//arrange
					enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
					
					//act
					persistency.CalculationVersion.setVersionLock(oCalculationVersionTestData.CALCULATION_VERSION_ID[0], testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

					//assert: Check if calculation has been locked in the database
					var result = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(result).toBeDefined();
					var expectedLockingResult = {
						"SESSION_ID": [testData.sSessionId],
						"CALCULATION_VERSION_ID": [oCalculationVersionTestData.CALCULATION_VERSION_ID[0]],
						"IS_WRITEABLE": [1]
					};
					expect(result).toMatchData(expectedLockingResult, ['SESSION_ID']);
				});
				
				it('should set a read-only lock for a frozen calculation version (is_frozen = 1) - user has CREATE_EDIT instance-based privilege', function() {
					//arrange
					enterPrivilege(testData.oProjectCurrencyTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
					
					//act
					persistency.CalculationVersion.setVersionLock(oCalculationVersionTestData.CALCULATION_VERSION_ID[2], testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

					//assert: Check if calculation has been locked in the database
					var result = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(result).toBeDefined();
					var expectedLockingResult = {
						"SESSION_ID": [testData.sSessionId],
						"CALCULATION_VERSION_ID": [oCalculationVersionTestData.CALCULATION_VERSION_ID[2]],
						"IS_WRITEABLE": [0]
					};
					expect(result).toMatchData(expectedLockingResult, ['SESSION_ID']);
				});

				it('should set a write mode for a lifecycle version (calculation_version_type = 2) - user has CREATE_EDIT instance-based privilege', function() {
					//arrange
					var oCvTestData = new TestDataUtility(oCalculationVersionTestData).replaceValue("CALCULATION_VERSION_TYPE", [1, 1, 2])
																					  .replaceValue("IS_FROZEN", [0, 0, 0])
																					  .build();
					oMockstar.clearTable("calculation_version");
					oMockstar.insertTableData("calculation_version", oCvTestData);
					var iCvId = oCvTestData.CALCULATION_VERSION_ID[2];
					enterPrivilege(testData.oProjectCurrencyTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
					//act
					persistency.CalculationVersion.setVersionLock(iCvId, testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

					//assert: Check if calculation has been locked in the database
					var result = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(result).toBeDefined();
					var expectedLockingResult = {
						"SESSION_ID": [testData.sSessionId],
						"CALCULATION_VERSION_ID": [iCvId],
						"IS_WRITEABLE": [1]
					};
					expect(result).toMatchData(expectedLockingResult, ['SESSION_ID']);
				});	
				
				it('should set a read-only lock for a source version (user has CREATE_EDIT instance-based privilege)', function() {
					//arrange
					enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.CREATE_EDIT);
					//create a new item of type referenced calculation version 
					//by converting the record with index 1 of oItemTestData into a plain object and adjusting the data
					var oReferencedItem = mockstar_helpers.convertToObject(testData.oItemTestData, 1);
					oReferencedItem.ITEM_ID = 4444;
					oReferencedItem.REFERENCED_CALCULATION_VERSION_ID = oCalculationVersionTestData.CALCULATION_VERSION_ID[1];
					oReferencedItem.ITEM_CATEGORY_ID = 10;
					oMockstar.insertTableData("item", oReferencedItem);
										
					//act
					persistency.CalculationVersion.setVersionLock(oCalculationVersionTestData.CALCULATION_VERSION_ID[1], testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

					//assert: Check if calculation has been locked in the database
					var result = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(result).toBeDefined();
					var expectedLockingResult = {
						"SESSION_ID": [testData.sSessionId],
						"CALCULATION_VERSION_ID": [oCalculationVersionTestData.CALCULATION_VERSION_ID[1]],
						"IS_WRITEABLE": [0]
					};
					expect(result).toMatchData(expectedLockingResult, ['SESSION_ID']);
				});
				
				it('should set a read-only lock for a non-frozen calculation version (is_frozen = null) if user has READ instance-based privilege', function() {
					//arrange
					enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], sUserId, InstancePrivileges.READ);
					
					//act
					persistency.CalculationVersion.setVersionLock(oCalculationVersionTestData.CALCULATION_VERSION_ID[1], testData.sSessionId, testData.sTestUser, Constants.CalculationVersionLockContext.CALCULATION_VERSION);

					//assert: Check if calculation has been locked in the database
					var result = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(result).toBeDefined();
					var expectedLockingResult = {
						"SESSION_ID": [testData.sSessionId],
						"CALCULATION_VERSION_ID": [oCalculationVersionTestData.CALCULATION_VERSION_ID[1]],
						"IS_WRITEABLE": [0]
					};
					expect(result).toMatchData(expectedLockingResult, ['SESSION_ID']);
				});

			});

			describe('unlockVersion', function() {
				
				let oMockstar;
				let persistency;
				let oOpenCalculationVersionsTestData

				beforeOnce(function() {
					oMockstar = new MockstarFacade(
						{
							substituteTables:
							{
								open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions",
								calculation_version: "sap.plc.db::basis.t_calculation_version",
								calculation : "sap.plc.db::basis.t_calculation",
								project : "sap.plc.db::basis.t_project"
							}
						});

				});

				beforeEach(function() { 
					persistency = new Persistency(jasmine.dbConnection);

					oOpenCalculationVersionsTestData = new TestDataUtility(testData.oOpenCalculationVersionsTestData);
					oOpenCalculationVersionsTestData.addObject(
						{
							"SESSION_ID" : 'UserX',
							"CALCULATION_VERSION_ID" : testData.iCalculationVersionId,
							"CONTEXT" : Constants.CalculationVersionLockContext.CALCULATION_VERSION,
							"IS_WRITEABLE" : 0
						}
					);

					oMockstar.clearTable("open_calculation_versions");
					oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionsTestData.build());
					oMockstar.clearTable("calculation_version");
					oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				});

				it('should remove a write lock for a calculation version', function() {
					
					var iUnlockResult = persistency.CalculationVersion.unlockVersion(
						oOpenCalculationVersionsTestData.getObject(0).CALCULATION_VERSION_ID,
						oOpenCalculationVersionsTestData.getObject(0).SESSION_ID,
						oOpenCalculationVersionsTestData.getObject(0).CONTEXT
					);

					expect(iUnlockResult).toBe(1);

					var oResult = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(oResult).toBeDefined();
					expect(oResult.columns.SESSION_ID.rows.length).toBe(oOpenCalculationVersionsTestData.getObjectCount() - 1);
				});

				it('should not remove a write lock for a calculation version if unlock is requested for a different context (variant matrix)', function() {
					
					var iUnlockResult = persistency.CalculationVersion.unlockVersion(
						oOpenCalculationVersionsTestData.getObject(0).CALCULATION_VERSION_ID,
						oOpenCalculationVersionsTestData.getObject(0).SESSION_ID,
						Constants.CalculationVersionLockContext.VARIANT_MATRIX
					);

					expect(iUnlockResult).toBe(0);

					var oResult = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(oResult).toBeDefined();
					expect(oResult.columns.SESSION_ID.rows.length).toBe((oOpenCalculationVersionsTestData.getObjectCount()));
				});

				it('should remove a read-lock (session info record) for a calculation version', function() {
					
					var iUnlockResult = persistency.CalculationVersion.unlockVersion(
						oOpenCalculationVersionsTestData.getObject(2).CALCULATION_VERSION_ID,
						oOpenCalculationVersionsTestData.getObject(2).SESSION_ID,
						oOpenCalculationVersionsTestData.getObject(2).CONTEXT
					);

					expect(iUnlockResult).toBe(1);

					var oResult = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(oResult).toBeDefined();
					expect(oResult.columns.SESSION_ID.rows.length).toBe(oOpenCalculationVersionsTestData.getObjectCount() - 1);
				});
				
				it('should not modify lock table if requested calculation version to unlock is not opened at all (neither read nor write lock)', function() {
					
					var iUnlockResult = persistency.CalculationVersion.unlockVersion(
						999, // request unlock for non-opened calculation version
						oOpenCalculationVersionsTestData.getObject(2).SESSION_ID,
						oOpenCalculationVersionsTestData.getObject(2).CONTEXT
					);

					expect(iUnlockResult).toBe(0);

					var oResult = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
					expect(oResult).toBeDefined();
					expect(oResult.columns.SESSION_ID.rows.length).toBe((oOpenCalculationVersionsTestData.getObjectCount()));
				});

			});

			describe('getLockingContext', function() {
				
				let oMockstar;
				let persistency;
				let oOpenCalculationVersionsTestData;

				beforeOnce(function() {
					oMockstar = new MockstarFacade(
						{
							substituteTables:
							{
								open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions"
							}
						});

				});

				beforeEach(function() { 
					persistency = new Persistency(jasmine.dbConnection);

					oOpenCalculationVersionsTestData = new TestDataUtility(testData.oOpenCalculationVersionsTestData);
					oOpenCalculationVersionsTestData.addObject(
						{
							"SESSION_ID" : 'UserX',
							"CALCULATION_VERSION_ID" : 99,
							"CONTEXT" : Constants.CalculationVersionLockContext.CALCULATION_VERSION,
							"IS_WRITEABLE" : 0
						}
					);

					oMockstar.clearTable("open_calculation_versions");
					oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionsTestData.build());
				});

				it('should return locking context for a calculation version that is locked for write-access', function() {					
					var sLockingContext = persistency.CalculationVersion.getLockingContext(oOpenCalculationVersionsTestData.getObject(0).CALCULATION_VERSION_ID);
					expect(sLockingContext).toBe(oOpenCalculationVersionsTestData.getObject(0).CONTEXT);
				});

				it('should return null in for a calculation version that is locked with read-access only', function() {
					var sLockingContext = persistency.CalculationVersion.getLockingContext(oOpenCalculationVersionsTestData.getObject(2).CALCULATION_VERSION_ID);
					expect(sLockingContext).toBe(null);
				});

			});
			

			describe('getLifecycleVersionsIds', function() {
				var oMockstar;
				var persistency = null;
				var sTestUser = $.session.getUsername();
				var sExpectedDate = new Date().toJSON();
				var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON();
				//add test data for calculation version with lifecycle versions
				var oCalculationVersionTestData = {
						"CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ],
						"CALCULATION_ID" : [ 1978, 1978, 1978 ],
						"CALCULATION_VERSION_NAME" : [ "Baseline Version1", "Baseline Version2", "Baseline Version3" ],
						"CALCULATION_VERSION_TYPE" : [ 1, 2, 2 ],
						"BASE_VERSION_ID" : [ null, 2809, 2809 ],
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
						"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ],
						"MASTER_DATA_TIMESTAMP" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
						"IS_FROZEN" : [ 0, 0, 0 ],
						"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
						"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
				};

				beforeOnce(function() {
					oMockstar = new MockstarFacade( // Initialize Mockstar
							{
								substituteTables: {
									calculation_version: {
										name: mTableNames.calculation_version,
										data: oCalculationVersionTestData
									}
								}
							});
				});

				beforeEach(function() {
					persistency = new Persistency(jasmine.dbConnection); 
					oMockstar.clearAllTables();
					oMockstar.initializeData();
				});

				afterOnce(function() {
					oMockstar.cleanup();
				});

				it("should return all lifecycle versions ids assigned to a calculation version", function() {
					// arrange
					var iCalcVersionId = oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
					var aExpectedCalculationVersionIds = [ 4809, 5809 ];

					// act
					var result = persistency.CalculationVersion.getLifecycleVersionsIds(iCalcVersionId);

					// assert
					expect(result.length).toBe(2);
					expect(result).toEqual(aExpectedCalculationVersionIds);
				});

				it("should return empty array when a calculation version does not have lifecycle versions assigned", function() {
					// arrange
					var iCalcVersionId = oCalculationVersionTestData.CALCULATION_VERSION_ID[1];
					var aExpectedCalculationVersionIds = [ ];

					// act
					var result = persistency.CalculationVersion.getLifecycleVersionsIds(iCalcVersionId);

					// assert
					expect(result.length).toBe(0);
					expect(result).toEqual(aExpectedCalculationVersionIds);
				});

				describe("updateCalculationVersionType", () => {
					const oBaseCalculationVersionTestData = {
						CALCULATION_VERSION_ID: [1, 2],
						CALCULATION_ID: [99, 99],
						CALCULATION_VERSION_NAME: ["CalculationVersion1", "CalculationVersion2"],
						CALCULATION_VERSION_TYPE: [1, 4],
						VARIANT_ID: [null, null],
						ROOT_ITEM_ID: [1111, 1111],
						REPORT_CURRENCY_ID: ["EUR", "EUR"],
						VALUATION_DATE: [testData.sExpectedDate, testData.sExpectedDate],
						LAST_MODIFIED_ON: [testData.sExpectedDate, testData.sExpectedDate],
						LAST_MODIFIED_BY: [testData.sTestUser, testData.sTestUser],
						MASTER_DATA_TIMESTAMP: [testData.sExpectedDate, testData.sExpectedDate],
						MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy],
						ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy]
					};
					beforeEach(() => {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("calculation_version", oBaseCalculationVersionTestData);
					});
			
					it("should update the calculation version type to variant base for the given id", () => {
						// act
						const sStmt = `select * from {{calculation_version}} where CALCULATION_VERSION_ID = 1`;
						const oCalculationVersionBefore = oMockstar.execQuery(sStmt).columns;
						const iResult = persistency.CalculationVersion.updateCalculationVersionType(1, Constants.CalculationVersionType.VariantBase);
						const oCalculationVersionAfter = oMockstar.execQuery(sStmt).columns;
						// assert
						expect(oCalculationVersionBefore.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.Base);
						expect(oCalculationVersionAfter.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.VariantBase);
						expect(iResult).toBe(1);
					});
					it("should update the calculation version type to base for the given id", () => {
						// act
						const sStmt = `select * from {{calculation_version}} where CALCULATION_VERSION_ID = 2`;
						const oCalculationVersionBefore = oMockstar.execQuery(sStmt).columns;
						const iResult = persistency.CalculationVersion.updateCalculationVersionType(2, Constants.CalculationVersionType.Base);
						const oCalculationVersionAfter = oMockstar.execQuery(sStmt).columns;
						// assert
						expect(oCalculationVersionBefore.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.VariantBase);
						expect(oCalculationVersionAfter.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.Base);
						expect(iResult).toBe(1);
					});
					it("should not update any calculation version if the given id does not exist", () => {
						// act
						const iResult = persistency.CalculationVersion.updateCalculationVersionType(123456, Constants.CalculationVersionType.VariantBase);
						// assert
						expect(iResult).toBe(0);
					});
				});
			});

if(jasmine.plcTestRunParameters.mode === 'all'){
				describe('getMasterVersions', function() {
					var oMockstar = null;
					var persistency = null;
					var sExpectedDate = new Date().toJSON();
					//add test data for item and item temporary table with items of type referenced calculation version
					var oItemTestData = {
							"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
							"CALCULATION_VERSION_ID" : [ 2, 2, 2, 1, 1],
							"PARENT_ITEM_ID" : [ null, 3001, 3001, null, 5001],
							"PREDECESSOR_ITEM_ID" : [ null, 3001, null, 3003, 5001],
							"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
							"ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
							"CHILD_ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
							"REFERENCED_CALCULATION_VERSION_ID": [null, 3, 4, 5, 3, 3],
							"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
							"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
							"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
							"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
						};
					
					var oItemTemporaryTestData = {
							"SESSION_ID": ["TestUser", "TestUser", "TestUser", "TestUser", "TestUser"],
							"ITEM_ID" : [ 7001, 8001, 8002, 8003, 8004 ],
							"CALCULATION_VERSION_ID" : [ 1, 2, 6, 6, 6],
							"PARENT_ITEM_ID" : [ 5001, 5001, null, 8001, 8002],
							"PREDECESSOR_ITEM_ID" : [ 5001, 7001, null, 8001, 8002],
							"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
							"ITEM_CATEGORY_ID" : [ 2, 10, 3, 4, 10],
							"CHILD_ITEM_CATEGORY_ID" : [ 2, 10, 3, 4, 10],
							"REFERENCED_CALCULATION_VERSION_ID": [null, 3, null, null, 3],
							"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
							"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
							"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
							"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
						};
					
					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								item: {
									name : mTableNames.item,
									data : oItemTestData,
								},
								item_temporary: {
									name : mTableNames.item_temporary,
									data : oItemTemporaryTestData,
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

					it("should return all the distinct versions where the calculation version is referenced", function() {
						// arrange
						var aExpectedCalculationVersionIds = [ {
							CALCULATION_VERSION_ID : 2
						}, {
							CALCULATION_VERSION_ID : 1
						},{
							CALCULATION_VERSION_ID : 6
						}];
						var iCalcVersionId = 3;

						// act
						var result = persistency.CalculationVersion.getMasterVersions(iCalcVersionId);

						// assert
						expect(result.length).toBe(3);
						//check the return calculation version ids
						// custom sort function for CalculationVersionIds since default sort function can't sort an object array
						function sortCalculationVersionIds(calVersion1, calVersion2) {
						    return calVersion1.CALCULATION_VERSION_ID < calVersion2.CALCULATION_VERSION_ID;
						}
						expect(result.sort(sortCalculationVersionIds)).toEqualObject(aExpectedCalculationVersionIds.sort(sortCalculationVersionIds));
						
					});
					
					it("should return empty when the calculation version is not referenced in another calculation", function() {
						// arrange
						var iCalcId = 10;

						// act
						var result = persistency.CalculationVersion.getMasterVersions(iCalcId);

						// assert
						expect(result.length).toBe(0);
					});
				});
						
				describe('getLifecycleMasterVersionsForBaseVersion', function() {
					let oMockstar = null;
					let persistency = null;
					let sSessionId = testData.sSessionId;
					let iBaseVersionId = testData.iCalculationVersionId;
					let iLifecycleVersionId = 4810;
					let oLifecycleCalculationVersion;

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables : {
								calculation_version: {
									name : mTableNames.calculation_version,
									data : testData.oCalculationVersionTestData,
								},	
								calculation_version_temporary: {
									name : mTableNames.calculation_version_temporary,
									data : testData.oCalculationVersionTemporaryTestData,
								},									
								item: {
									name : mTableNames.item,
									data : testData.oItemTestData,
								},
								item_temporary: {
									name : mTableNames.item_temporary,
									data : testData.oItemTemporaryTestData,
								}
							}
						});
					});
					

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.initializeData();
						
						//insert lifecycle version
						oLifecycleCalculationVersion = mockstar_helpers.convertToObject(testData.oCalculationVersionTestData, 1);
						oLifecycleCalculationVersion.CALCULATION_VERSION_ID = iLifecycleVersionId;
			            oLifecycleCalculationVersion.CALCULATION_VERSION_TYPE = 2; 
			            oLifecycleCalculationVersion.CALCULATION_VERSION_NAME = 'LC_1440'; 
			            oLifecycleCalculationVersion.BASE_VERSION_ID = iBaseVersionId; 
			            oLifecycleCalculationVersion.LIFECYCLE_PERIOD_FROM = 1440; 	

			            oMockstar.insertTableData("calculation_version", oLifecycleCalculationVersion);	
			            oMockstar.insertTableData("calculation_version_temporary", _.extend(oLifecycleCalculationVersion, {SESSION_ID: sSessionId}));

						persistency = new Persistency(jasmine.dbConnection);
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it("should return all versions where the lifecycle versions of base calculation version are referenced", function() {
						// arrange

            			// insert referencing item
			            let oReferencingItem = mockstar_helpers.convertToObject(testData.oItemTestData, 4);
			            oReferencingItem.ITEM_ID = 4444;
			            oReferencingItem.REFERENCED_CALCULATION_VERSION_ID = iLifecycleVersionId;
			            oReferencingItem.ITEM_CATEGORY_ID = 10;
			            oMockstar.insertTableData("item", oReferencingItem);
			            
			            let iReferencingBaseVersionId = 4801;
			            oMockstar.execSingle(`update {{calculation_version}} set base_version_id = ${iReferencingBaseVersionId} where calculation_version_id = ${oReferencingItem.CALCULATION_VERSION_ID}`);
			            
						// act
						var result = persistency.CalculationVersion.getLifecycleMasterVersionsForBaseVersion(iBaseVersionId);

						// assert
						expect(result).toMatchData([
					        {
					            LIFECYCLE_VERSION_ID: iLifecycleVersionId,
					            REFERENCING_VERSION_ID: oReferencingItem.CALCULATION_VERSION_ID,
					            REFERENCING_BASE_VERSION_ID: iReferencingBaseVersionId,
					        }
					        ], ["LIFECYCLE_VERSION_ID", "REFERENCING_VERSION_ID"]);
						
					});
					
					it("should return empty if the calculation version is not referenced in another calculation", function() {
						// act
						var result = persistency.CalculationVersion.getLifecycleMasterVersionsForBaseVersion(iBaseVersionId);

						// assert
						expect(result).toEqualObject([]);
					});
					
					it("should return empty if another calculation version is referenced", function() {
						// arrange

            			// insert referencing item
			            let oReferencingItem = mockstar_helpers.convertToObject(testData.oItemTestData, 1);
			            oReferencingItem.ITEM_ID = 4444;
			            oReferencingItem.REFERENCED_CALCULATION_VERSION_ID = 222222;
			            oReferencingItem.ITEM_CATEGORY_ID = 10;
			            oMockstar.insertTableData("item", oReferencingItem);

						// act
						var result = persistency.CalculationVersion.getLifecycleMasterVersionsForBaseVersion(iBaseVersionId);

						// assert
						expect(result).toEqualObject([]);
					});

					
				});

				describe("getVersionRootItemId", () => {
					const oCalculationVersionTestData = {
						CALCULATION_VERSION_ID: [100, 200],
						CALCULATION_ID: [99, 99],
						CALCULATION_VERSION_NAME: ["CalculationVersion1", "CalculationVersion2"],
						CALCULATION_VERSION_TYPE: [1, 4],
						VARIANT_ID: [null, null],
						ROOT_ITEM_ID: [1, 10],
						REPORT_CURRENCY_ID: ["EUR", "EUR"],
						VALUATION_DATE: [testData.sExpectedDate, testData.sExpectedDate],
						LAST_MODIFIED_ON: [testData.sExpectedDate, testData.sExpectedDate],
						LAST_MODIFIED_BY: [testData.sTestUser, testData.sTestUser],
						MASTER_DATA_TIMESTAMP: [testData.sExpectedDate, testData.sExpectedDate],
						MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy],
						ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy]
					};
					var oMockstar = null;
					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
								{
									substituteTables: {
										calculation_version: {
											name: mTableNames.calculation_version,
											data: oCalculationVersionTestData
										}
									}
								});
					});
					beforeEach(() => {
						persistency = new Persistency(jasmine.dbConnection);

						oMockstar.clearAllTables();
						oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
					});
			
					it("should return the item of the root item for the given version id", () => {
						// act
						const aRootItemId = persistency.CalculationVersion.getVersionRootItemId(oCalculationVersionTestData.CALCULATION_VERSION_ID[0]);
						// assert
						expect(aRootItemId.length).toBe(1);
						expect(aRootItemId[0].ROOT_ITEM_ID).toBe(oCalculationVersionTestData.ROOT_ITEM_ID[0]);
					});
					it("should return an empty array if the given version id does not exist", () => {
						// act
						const aRootItemId = persistency.CalculationVersion.getVersionRootItemId(12345);
						// assert
						expect(aRootItemId.length).toBe(0);
					});
				});

				describe('Get Lifecycle Period Description', function() {
	
					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables : // substitute all used tables in the procedure or view
							{
								calculation_version : "sap.plc.db::basis.t_calculation_version",
								calculation : "sap.plc.db::basis.t_calculation",
								project : "sap.plc.db::basis.t_project",			
								lifecycle_period_types: "sap.plc.db::basis.t_project_lifecycle_period_type",
								lifecycle_period_months: "sap.plc.db::basis.t_project_monthly_lifecycle_period"

							}
						});
					});
	
					beforeEach(function() {
						persistency = new Persistency(jasmine.dbConnection);

						oMockstar.clearAllTables(); // clear all specified substitute tables and views
						oMockstar.insertTableData("calculation", testData.oCalculationTestData);
						oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
						oMockstar.insertTableData("project", testData.oProjectTestData);
						oMockstar.insertTableData("lifecycle_period_types", testData.oProjectLifecyclePeriodTypeTestData);
						oMockstar.insertTableData("lifecycle_period_months", testData.oProjectMonthlyLifecyclePeriodTestData);

					});

					it("should return the lifecycle period description when lifecycle period from is not null", () => {
						//arrange
						let iVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
						oMockstar.execSingle(`update {{calculation_version}} set LIFECYCLE_PERIOD_FROM = 1440  where CALCULATION_VERSION_ID = ${iVersionId}`);
						oMockstar.execSingle(`update {{calculation_version}} set CALCULATION_VERSION_TYPE = 2  where CALCULATION_VERSION_ID = ${iVersionId}`);
						// act
						const sResult = persistency.CalculationVersion.getLifecyclePeriodDescription(iVersionId);
						// assert
						expect(sResult).toBe('2020');
					});

					it("should return empty string when lifecycle period from is null", () => {
						//arrange
						let iVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
						oMockstar.execSingle(`update {{calculation_version}} set CALCULATION_VERSION_TYPE = 2  where CALCULATION_VERSION_ID = ${iVersionId}`);
						// act
						const sResult = persistency.CalculationVersion.getLifecyclePeriodDescription(iVersionId);
						// assert
						expect(sResult).toBe('');
					});

					it("should return the lifecycle period description when lifecycle period from is not null and period_type is monthly", () => {
						//arrange
						let iVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
						let iProjectId = testData.oProjectTestData.PROJECT_ID[0];
						oMockstar.execSingle(`update {{calculation_version}} set LIFECYCLE_PERIOD_FROM = 1440  where CALCULATION_VERSION_ID = ${iVersionId}`);
						oMockstar.execSingle(`update {{calculation_version}} set CALCULATION_VERSION_TYPE = 2  where CALCULATION_VERSION_ID = ${iVersionId}`);
						oMockstar.execSingle(`update {{lifecycle_period_types}} set PERIOD_TYPE = 'MONTHLY'  where PROJECT_ID = '${iProjectId}'`);
						// act
						const sResult = persistency.CalculationVersion.getLifecyclePeriodDescription(iVersionId);
						// assert
						expect(sResult).toBe("2020 - first month");
					});


					it("should return the lifecycle period description when lifecycle period from is not null and period_type is monthly and month description is null", () => {
						//arrange
						let iVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
						let iProjectId = testData.oProjectTestData.PROJECT_ID[0];
						oMockstar.execSingle(`update {{calculation_version}} set LIFECYCLE_PERIOD_FROM = 1440  where CALCULATION_VERSION_ID = ${iVersionId}`);
						oMockstar.execSingle(`update {{calculation_version}} set CALCULATION_VERSION_TYPE = 2  where CALCULATION_VERSION_ID = ${iVersionId}`);
						oMockstar.execSingle(`update {{lifecycle_period_types}} set PERIOD_TYPE = 'MONTHLY'  where PROJECT_ID = '${iProjectId}'`);
						oMockstar.execSingle(`update {{lifecycle_period_months}} set MONTH_DESCRIPTION = null  where PROJECT_ID = '${iProjectId}'`);
						// act
						const sResult = persistency.CalculationVersion.getLifecyclePeriodDescription(iVersionId);
						// assert
						expect(sResult).toBe("2020 - M1");
					});

					it("should not return a description when lifecycle period does not find a month to match the value of lifecycle_period_from of calculation version", () => {
						//arrange
						let iVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
						let iProjectId = testData.oProjectTestData.PROJECT_ID[0];
						oMockstar.execSingle(`update {{calculation_version}} set LIFECYCLE_PERIOD_FROM = 1444  where CALCULATION_VERSION_ID = ${iVersionId}`);
						oMockstar.execSingle(`update {{calculation_version}} set CALCULATION_VERSION_TYPE = 2  where CALCULATION_VERSION_ID = ${iVersionId}`);
						oMockstar.execSingle(`update {{lifecycle_period_types}} set PERIOD_TYPE = 'MONTHLY'  where PROJECT_ID = '${iProjectId}'`);
						oMockstar.execSingle(`update {{lifecycle_period_months}} set MONTH_DESCRIPTION = null  where PROJECT_ID = '${iProjectId}'`);
						// act
						const sResult = persistency.CalculationVersion.getLifecyclePeriodDescription(iVersionId);
						// assert
						expect(sResult).toBe("");
					});
	
				})
			}
		}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);