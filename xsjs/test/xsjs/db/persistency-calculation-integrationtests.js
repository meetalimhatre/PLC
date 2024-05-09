describe('xsjs.db.persistency-calculation-integrationtests', function() {
	// static imports
	var _ = require("lodash");
	var helpers = require("../../../lib/xs/util/helpers");
	var mockstarHelpers = require("../../testtools/mockstar_helpers");
	var testHelpers = require("../../testtools/test_helpers");
	var testData = require("../../testdata/testdata").data;
	var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
	var InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
	const Constants = require("../../../lib/xs/util/constants");

	// import constructors
	var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
	var PersistencyImport = $.import("xs.db", "persistency");
	var CalculationImport = $.import("xs.db", "persistency-calculation");
	var Persistency = PersistencyImport.Persistency;
	var sUserId = testData.sTestUser;
    var sDefaultExchangeRateType = testData.sDefaultExchangeRateType;
    
	// mockstar import & settings
	var originalProcedures = null;
	var mTableNames = CalculationImport.Tables;
	const sStandardPriceStrategy = testData.sStandardPriceStrategy;
	
	function createSpyOnCalculationSequence(oPersistency) {
		var alreadyCalled = false;
		spyOn(oPersistency.Calculation.helper, 'getNextSequenceID').and.callFake(function() {
		    if (alreadyCalled) {
		        return 2;
		    } else {
		       alreadyCalled = true;
		       return 1;
		    }
		});
	}

	if(jasmine.plcTestRunParameters.mode === 'all'){
		describe('create', function() {

			var mockstar = null;
			var persistency = null;

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						calculation : mTableNames.calculation,
						item_temporary: mTableNames.item_temporary,
						calculation_version_temporary: mTableNames.calculation_version_temporary,
						project:'sap.plc.db::basis.t_project'
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();
				mockstar.insertTableData("project", testData.oProjectTestData);

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			var oCalculationData = mockstarHelpers.convertToObject(testData.oCalculationTestData, 0);

			it('should create when validInput --> new calculation returned', function() {
				// arrange
				var oCalculationToCreate = _.cloneDeep(oCalculationData);
				createSpyOnCalculationSequence(persistency);
				
				// act
				var oResultObject = persistency.Calculation.create(oCalculationToCreate, "sSessionId", "sUserId");

				// assert

				// check if the correct data was written to t_calculation
				var oResultCalculationTable = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation}}"));

				expect(helpers.isPositiveInteger(oResultCalculationTable.CALCULATION_ID[0])).toBe(true);
				expect(oResultCalculationTable.PROJECT_ID[0]).toEqual(oCalculationData.PROJECT_ID);
				expect(oResultCalculationTable.CALCULATION_NAME[0]===oCalculationData.CALCULATION_NAME).toBeTruthy();
				expect(oResultCalculationTable.CURRENT_CALCULATION_VERSION_ID[0]).toEqual(oCalculationData.CURRENT_CALCULATION_VERSION_ID);
				expect(oResultCalculationTable.CREATED_ON[0]).toBeDefined();
				expect(oResultCalculationTable.CREATED_BY[0]).toEqual("sUserId");
				expect(oResultCalculationTable.LAST_MODIFIED_ON[0]).toBeDefined();
				expect(oResultCalculationTable.LAST_MODIFIED_BY[0]).toEqual("sUserId");

				// check data in oResultObject
				expect(oResultObject.CALCULATION_ID).toEqual(oResultCalculationTable.CALCULATION_ID[0]);
				expect(oResultObject.PROJECT_ID).toEqual(oCalculationData.PROJECT_ID);
				expect(oResultCalculationTable.CALCULATION_NAME[0]===oCalculationData.CALCULATION_NAME).toBeTruthy();
				expect(oResultObject.CURRENT_CALCULATION_VERSION_ID).toEqual(oCalculationData.CURRENT_CALCULATION_VERSION_ID);
				expect(oResultObject.CREATED_ON).toBeDefined();
				expect(oResultObject.CREATED_BY).toEqual("sUserId");
				expect(oResultObject.LAST_MODIFIED_ON).toBeDefined();
				expect(oResultObject.LAST_MODIFIED_BY).toEqual("sUserId");
			});

			it('should create when validInput and put a counter at the name if it already existed --> new calculation returned', function() {
				// arrange
				var oFirstCalculationToCreate = _.cloneDeep(oCalculationData);
				var oCalculationToCreate = _.cloneDeep(oCalculationData);
				var alreadyCalled = false;
				createSpyOnCalculationSequence(persistency);
				
				// act
				//create one calculation
				persistency.Calculation.create(oFirstCalculationToCreate, "sSessionId", $.session.getUsername());
				
				//create another calculation
				var oResultObject = persistency.Calculation.create(oCalculationToCreate, "sSessionId", $.session.getUsername());

				// assert
				// check if the correct data was written to t_calculation
				var oResultCalculationTable = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation}} where calculation_id = "+oResultObject.CALCULATION_ID));
				expect(oResultCalculationTable.CALCULATION_NAME[0]).toBe(oCalculationData.CALCULATION_NAME + " (2)");

				// check data in oResultObject
				expect(oResultObject.CALCULATION_NAME).toBe(oCalculationData.CALCULATION_NAME + " (2)");
			});

			it('should create when validInput and set the same name if calculations are in different projects --> new calculation returned', function() {
				// arrange
				var oFirstCalculationToCreate = _.cloneDeep(oCalculationData);
				var oCalculationToCreate = _.cloneDeep(oCalculationData);
				var oProjectTestData={
						"PROJECT_ID":["PR2", "1", "2"],
						"ENTITY_ID":[10,11,12],
						"REFERENCE_PROJECT_ID":["0", "0", "0"],
						"PROJECT_NAME":["Project 0", "0", "0"],
						"PROJECT_RESPONSIBLE":[testData.sTestUser, testData.sTestUser, testData.sTestUser],
						"CONTROLLING_AREA_ID":['1000', '1000', '1000'],
						"CUSTOMER_ID":['C1', 'C1', 'C1'],
						"SALES_DOCUMENT":["SD1", "SD1", "SD1"],
						"SALES_PRICE":[20, 20, 20],
						"SALES_PRICE_CURRENCY_ID":["EUR", "EUR", "EUR"],
						"COMMENT":["Comment 0", "Comment 1", "Comment 2"],
						"COMPANY_CODE_ID":["CC1", "CC1", "CC1"],
						"PLANT_ID":['PL1', 'PL1', 'PL1'],
						"BUSINESS_AREA_ID":["BA1", "BA1", "BA1"],
						"PROFIT_CENTER_ID":["P1", "P1", "P1"],
						"REPORT_CURRENCY_ID":["EUR", "EUR", "EUR"],
						"COSTING_SHEET_ID":["COGM", "COGM", "COGM"],
						"COMPONENT_SPLIT_ID":[testData.sComponentSplitId, testData.sComponentSplitId, testData.sComponentSplitId],
						"START_OF_PROJECT":[testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
						"END_OF_PROJECT":[testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
						"START_OF_PRODUCTION":[testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
						"END_OF_PRODUCTION":[testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
						"VALUATION_DATE":[testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
						"CREATED_ON":[testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
						"CREATED_BY":[testData.sTestUser, testData.sTestUser, testData.sTestUser],
						"LAST_MODIFIED_ON":[testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
						"LAST_MODIFIED_BY":[testData.sTestUser, testData.sTestUser, testData.sTestUser],
						"MATERIAL_PRICE_STRATEGY_ID":[sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
						"ACTIVITY_PRICE_STRATEGY_ID":[sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
				};
				mockstar.insertTableData("project", oProjectTestData);
				oFirstCalculationToCreate.PROJECT_ID = "1";
				oCalculationToCreate.PROJECT_ID = "2";

				createSpyOnCalculationSequence(persistency);
				
				// act
				//create one calculation
				persistency.Calculation.create(oFirstCalculationToCreate, "sSessionId", $.session.getUsername());
				//create another calculation
				var oResultObject = persistency.Calculation.create(oCalculationToCreate, "sSessionId", $.session.getUsername());

				// assert
				// check if the correct data was written to t_calculation
				var oResultCalculationTable = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation}} where calculation_id = "+oResultObject.CALCULATION_ID));
				expect(oResultCalculationTable.CALCULATION_NAME[0]).toBe(oCalculationData.CALCULATION_NAME);

				// check data in oResultObject
				expect(oResultObject.CALCULATION_NAME).toBe(oCalculationData.CALCULATION_NAME);
			});

			it('should create when validInput and put a counter at the name if it already existed and project id is set--> new calculation returned', function() {
				// arrange
				var oFirstCalculationToCreate = _.cloneDeep(oCalculationData);
				var oCalculationToCreate = _.cloneDeep(oCalculationData);
				createSpyOnCalculationSequence(persistency);
				
				// act
				//create one calculation
				persistency.Calculation.create(oFirstCalculationToCreate, "sSessionId", $.session.getUsername());
				//create another calculation
				var oResultObject = persistency.Calculation.create(oCalculationToCreate, "sSessionId", $.session.getUsername());

				// assert
				// check if the correct data was written to t_calculation
				var oResultCalculationTable1 = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation}}"));

				var oResultCalculationTable = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation}} where calculation_id = "+oResultObject.CALCULATION_ID));
				expect(oResultCalculationTable.CALCULATION_NAME[0]).toBe(oCalculationData.CALCULATION_NAME +" (2)");

				// check data in oResultObject
				expect(oResultObject.CALCULATION_NAME).toBe(oCalculationData.CALCULATION_NAME + " (2)");
			});

			it('should not create when valid calculation input and no db sequence --> exception thrown', function() {
				// arrange
				var oBodyItem = _.cloneDeep(oCalculationData);

				spyOn(persistency.Calculation.helper, 'getNextSequenceID').and.callFake(function() {
				    return undefined;
				});

				var exception = null;
				// act
				try {
					persistency.Calculation.create(oBodyItem, "sSessionId", "sUserId");
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
			});

			it('should not create when valid calculation input and negative db sequence value --> exception thrown', function() {
				// arrange
				var oBodyItem = _.cloneDeep(oCalculationData);

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
				persistency.Calculation.helper.setHQuery(oHQueryMock);

				var exception = null;
				// act
				try {
					persistency.Calculation.create(oBodyItem, "sSessionId", "sUserId");
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
			});

			it('should not create when valid project id does not exist in table --> exception thrown', function() {
				// arrange
				var oCalculationToCreate = _.cloneDeep(oCalculationData);
				oCalculationToCreate.PROJECT_ID = "QQ";

				var exception = null;

				// act
				try {
					persistency.Calculation.create(oCalculationToCreate, "sSessionId", $.session.getUsername());
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
			});
		});

		describe("getOpeningUsersForVersions", function() {

			var mockstar = null;
			var persistency = null;

			var oOpenCalcVersionData = {
					SESSION_ID: ["Session_A", "Session_B", "Session_C", "Session_D"],
					CALCULATION_VERSION_ID : [ 1, 1, 2, 20 ],
					IS_WRITEABLE : [ 1, 0, 1, 1 ],
					CONTEXT: [
						Constants.CalculationVersionLockContext.CALCULATION_VERSION, 
						Constants.CalculationVersionLockContext.CALCULATION_VERSION,
						Constants.CalculationVersionLockContext.CALCULATION_VERSION,
						Constants.CalculationVersionLockContext.VARIANT_MATRIX,
					],
			};
			var oSessionData = {
					SESSION_ID : [ "Session_A", "Session_B", "Session_C", "Session_D" ],
					USER_ID : [ "USER_A", "USER_B", "USER_A", "USER_C" ],
					LANGUAGE : [ "DE", "EN", "DE", "EN" ],
					LAST_ACTIVITY_TIME : [ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate]
			};
			var oTestCalculationsVersions = {
					CALCULATION_VERSION_ID : [ 1, 2, 3, 20 ],
					CALCULATION_ID : [ 100, 100, 200, 100 ],
					CALCULATION_VERSION_NAME: [
						"Calculation Version Name 1",
						"Calculation Version Name 2",
						"Calculation Version Name 3", 
						"Version with Variant Matrix",
					],
					ROOT_ITEM_ID : [ 1, 2, 1 , 1],
					REPORT_CURRENCY_ID: ["EUR", "EUR", "EUR", "EUR"],
					COSTING_SHEET_ID: ["COGM", "COGM", "COGM", "COGM"],
					VALUATION_DATE: [new Date().toJSON(), new Date().toJSON(), new Date().toJSON(), new Date().toJSON()],
					LAST_MODIFIED_ON: [new Date().toJSON(), new Date().toJSON(), new Date().toJSON(), new Date().toJSON()],
					MASTER_DATA_TIMESTAMP: [new Date().toJSON(), new Date().toJSON(), new Date().toJSON(), new Date().toJSON()],
					LAST_MODIFIED_BY: ["UserA", "UserB", "UserC", "UserC"],
					EXCHANGE_RATE_TYPE_ID: [sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType],
					MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
					ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
			};

			var oTestCalculationsVersionsTemporary = {
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
					EXCHANGE_RATE_TYPE_ID : [ sDefaultExchangeRateType, sDefaultExchangeRateType ],
					MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy],
					ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy]
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
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
							data : oTestCalculationsVersions
						},
						calculationVersionTableTemporary : {
							name : mTableNames.calculation_version_temporary,
							data : oTestCalculationsVersionsTemporary
						}
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should return users when any calculation version or variant matrix of calculation is open in session", function () {
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
			    }, , {
			        USER_ID: 'USER_C',
			        CALCULATION_VERSION_ID: 20,
			        CALCULATION_VERSION_NAME: "Version with Variant Matrix"
				} ];

				var iCalcId = 100;
				var unitUnderTest = new Persistency(jasmine.dbConnection);
				// act
				var result = unitUnderTest.Calculation.getOpeningUsersForVersions(iCalcId);
				// assert
				expect(result).toMatchData(aExpectedUsers, [ "USER_ID", "CALCULATION_VERSION_ID", "CALCULATION_VERSION_NAME"]);
				});

			it("should return empty when no calculation version of calculation does exist in session", function() {
				// arrange
				var aExpectedUsers = [];
				var iCalcId = 1;

				// act
				var result = persistency.Calculation.getOpeningUsersForVersions(iCalcId);
				// assert
				expect(result).toEqualObject(aExpectedUsers);
			});

			it("should return empty f we don't have open calculation versions under one calculation", function() {
				// arrange
				var aExpectedResult = [];
				var iCalcId = 200;

				// act
				var result = persistency.Calculation.getOpeningUsersForVersions(iCalcId);
				// assert
				expect(result).toEqualObject(aExpectedResult);
			});

			it("should throw Exception when calculation id is not a number", function() {
				// arrange
				var aInvalidArrayValues = [ 1.1, -1, "1a", undefined, null ];

				_.each(aInvalidArrayValues, function(iCalcId, iIndex) {
					var exception = null;

					// act
					try {
						persistency.Calculation.getOpeningUsersForVersions(iCalcId);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
				});
			});
		});
		
		describe("getFrozenVersions", function() {

			var mockstar = null;
			var persistency = null;

			var oTestCalculationsVersions = {
					CALCULATION_VERSION_ID : [ 1, 2, 3 ],
					CALCULATION_ID : [ 100, 100, 200 ],
					CALCULATION_VERSION_NAME : [ "Calculation Version Name 1", "Calculation Version Name 2", "Calculation Version Name 3" ],
					ROOT_ITEM_ID : [ 1, 2, 1 ],
					REPORT_CURRENCY_ID : [ "EUR", "EUR", "EUR" ],
					VALUATION_DATE : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
					LAST_MODIFIED_ON : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
					MASTER_DATA_TIMESTAMP : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
					LAST_MODIFIED_BY : [ "UserA", "UserB", "UserC" ],
					IS_FROZEN : [ 1, 0, 0 ],
					EXCHANGE_RATE_TYPE_ID : [ sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType ],
					MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
					ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						calculationVersionTable : {
							name : mTableNames.calculation_version,
							data : oTestCalculationsVersions
						}
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should return list of frozen calculation version ids for a calculation", function() {
				// arrange
				var iCalcId = 100;

				// act
				var result = persistency.Calculation.getFrozenVersions(iCalcId);
				
				// assert				
				var aExpectedCalculations = [ {
					CALCULATION_VERSION_ID : 1
				} ];
				expect(result).toEqualObject(aExpectedCalculations);
			});

			it("should return empty when no frozen calculation versions for a calculation exists", function() {
				// arrange
				var iCalcId = 200;

				// act
				var result = persistency.Calculation.getFrozenVersions(iCalcId);
				
				// assert
				var aExpectedCalculations = [];
				expect(result).toEqualObject(aExpectedCalculations);
			});

		});

		describe("IsCalculationVersionInCalculation", function() {

			var mockstar = null;
			var persistency = null;

			var oTestCalculationsVersions = {
				CALCULATION_VERSION_ID : [ 1, 2, 3 ],
				CALCULATION_ID : [ 100, 100, 200 ],
				CALCULATION_VERSION_NAME : [ "Calculation Version Name 1", "Calculation Version Name 2", "Calculation Version Name 3" ],
				ROOT_ITEM_ID : [ 1, 2, 1 ],
				REPORT_CURRENCY_ID : [ "EUR", "EUR", "EUR" ],
				VALUATION_DATE : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
				LAST_MODIFIED_ON : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
				MASTER_DATA_TIMESTAMP : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
				LAST_MODIFIED_BY : [ "UserA", "UserB", "UserC" ],
				IS_FROZEN : [ 1, 0, 0 ],
				EXCHANGE_RATE_TYPE_ID : [ sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType ],
				MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
				ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
			};

			var oCalculationVersionTemporaryTestData = _.extend(JSON.parse(JSON.stringify(oTestCalculationsVersions)), {
				"SESSION_ID" : [ 'UserA', 'UserB', 'UserC' ]
			});

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						calculationVersionTable : {
							name : mTableNames.calculation_version,
							data : oTestCalculationsVersions
						},
						calculationVersionTableTemporary : {
							name : mTableNames.calculation_version_temporary
						}
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should return true if calc version is saved", function() {
				// arrange
				var iCalcVersionId = oTestCalculationsVersions.CALCULATION_VERSION_ID[0];
				var iCalcId = oTestCalculationsVersions.CALCULATION_ID[0];

				// act
				var test = mockstar.execQuery("select * from {{calculationVersionTable}}");
				var result = persistency.Calculation.IsCalculationVersionInCalculation(iCalcVersionId, iCalcId);
				
				// assert
				expect(result).toBe(true);
			});

			it("should return true if calc version is saved and opened", function() {
				// arrange
				mockstar.insertTableData("calculationVersionTableTemporary", oCalculationVersionTemporaryTestData);
				var iCalcVersionId = oTestCalculationsVersions.CALCULATION_VERSION_ID[0];
				var iCalcId = oTestCalculationsVersions.CALCULATION_ID[0];

				// act
				var result = persistency.Calculation.IsCalculationVersionInCalculation(iCalcVersionId, iCalcId);
				
				// assert
				expect(result).toBe(true);
			});

			it("should return true if calc version is not saved but it's opened", function() {
				// arrange
				mockstar.insertTableData("calculationVersionTableTemporary", oCalculationVersionTemporaryTestData);
				mockstar.clearTable("calculationVersionTable");
				var iCalcVersionId = oTestCalculationsVersions.CALCULATION_VERSION_ID[0];
				var iCalcId = oTestCalculationsVersions.CALCULATION_ID[0];

				// act
				var result = persistency.Calculation.IsCalculationVersionInCalculation(iCalcVersionId, iCalcId);
				
				// assert
				expect(result).toBe(true);
			});

			it("should return false if calc version does not exist", function() {
				// arrange
				mockstar.clearTable("calculationVersionTable");
				var iCalcVersionId = oTestCalculationsVersions.CALCULATION_VERSION_ID[0];
				var iCalcId = oTestCalculationsVersions.CALCULATION_ID[0];

				// act
				var result = persistency.Calculation.IsCalculationVersionInCalculation(iCalcVersionId, iCalcId);
				
				// assert
				expect(result).toBe(false);
			});

		});



		describe("isNameUnique", function() {

			var mockstar = null;
			var persistency = null;

			var oCalculationData = testData.oCalculationTestData;

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						calculation : {
							name : mTableNames.calculation,
							data : oCalculationData
						}					
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should return true(unique) when calculation table empty", function() {
				// arrange
				mockstar.clearTable("calculation");
				var oCalculation = {
						CALCULATION_ID:   testData.oCalculationTestData.CALCULATION_ID[0],
						CALCULATION_NAME: "NewName",
						PROJECT_ID:"0"
				}

				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});

			it("should return true(unique) when calculation table empty and no project id assigned", function() {
				// arrange
				mockstar.clearTable("calculation");
				var oCalculation = {
						CALCULATION_ID:   testData.oCalculationTestData.CALCULATION_ID[0],
						CALCULATION_NAME: "NewName"
				}
				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});

			it("should return true(unique) when calculation name unique and no project id assigned", function() {
				// arrange
				var oCalculation = {
						CALCULATION_ID:   testData.oCalculationTestData.CALCULATION_ID[0],
						CALCULATION_NAME: "NewName"
				}
				// act					
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});

			it("should return false when calculation name exists and no project id assigned", function() {
				// arrange
				var oCalculation = {
						CALCULATION_ID:   testData.oCalculationTestData.CALCULATION_ID[1],
						CALCULATION_NAME: testData.oCalculationTestData.CALCULATION_NAME[0],
						PROJECT_ID: testData.oCalculationTestData.PROJECT_ID[0]
				}

				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(false);
			});

			it("should return false when an existing calculation name is given in upper case", function() {
				//arrange
				var oCalculation = {
						CALCULATION_ID:     testData.oCalculationTestData.CALCULATION_ID[1],
						CALCULATION_NAME: 	testData.oCalculationTestData.CALCULATION_NAME[0].toUpperCase(),
						PROJECT_ID :		oCalculationData.PROJECT_ID[0]

				}

				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBe(false);
			});

			it("should return false when an existing calculation name is given in lower case", function() {
				//arrange
				var oCalculation = {
						CALCULATION_ID:     testData.oCalculationTestData.CALCULATION_ID[1],
						CALCULATION_NAME: 	testData.oCalculationTestData.CALCULATION_NAME[0].toLowerCase(),
						PROJECT_ID : 		oCalculationData.PROJECT_ID[0]
				}

				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBe(false);
			});


			it("should return true(unique) when calculation name does not exist for project id", function() {
				//arrange
				var oCalculation = {
						CALCULATION_ID:     testData.oCalculationTestData.CALCULATION_ID[0],
						CALCULATION_NAME: 	"NewName",
						PROJECT_ID:			oCalculationData.PROJECT_ID[0]
				}

				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});

			it("should return false when calculation name exist for project id", function() {
				//arrange
				var oCalculation = {
						CALCULATION_ID:     testData.oCalculationTestData.CALCULATION_ID[1],
						CALCULATION_NAME: 	testData.oCalculationTestData.CALCULATION_NAME[0],
						PROJECT_ID:			oCalculationData.PROJECT_ID[0]
				}

				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(false);
			});

			it("should return true(unique) when calculation name exists in other project id", function() {
				// arrange
				var oCalculation = {
						CALCULATION_ID:   testData.oCalculationTestData.CALCULATION_ID[0],
						CALCULATION_NAME: testData.oCalculationTestData.CALCULATION_NAME[0],
						PROJECT_ID:       oCalculationData.PROJECT_ID[2]
				}

				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});

			
			it("should return true(unique) when new calculation name is the same as the old calculation name", function() {
				//arrange
				var oCalculation = {
						CALCULATION_ID: 	2078,
						CALCULATION_NAME: 	"Calculation pump P-100",
						PROJECT_ID:			oCalculationData.PROJECT_ID[0]
				}

				// act
				var result = persistency.Calculation.isNameUnique(oCalculation);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});
		});

		describe('exists', function() {
			var mockstar = null;
			var persistency = null;

			var oCalculationData = {
					"CALCULATION_ID" : [ 1078 ],
					"PROJECT_ID" : [ "" ],
					"CALCULATION_NAME" : [ "Pumpe" ],
					"CREATED_ON" : [ "2015-01-22T13:16:10.764Z" ],
					"CREATED_BY" : [ "Horst" ],
					"LAST_MODIFIED_ON" : [ "2015-01-22T13:16:10.764Z" ],
					"LAST_MODIFIED_BY" : [ "Horst" ]
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						calculation : {
							name : mTableNames.calculation,
							data : oCalculationData
						}
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should return false when calculation table empty", function() {
				// arrange
				var iCalcId = 4711;

				// act
				var result = persistency.Calculation.exists(iCalcId);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(false);
			});

			it("should return true when calculation id exists in calculation table", function() {
				// arrange
				var iCalcId = 1078;

				// act
				var result = persistency.Calculation.exists(iCalcId);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});

			it("should return false when calculation id does not exists in calculation table", function() {
				// arrange
				var iCalcId = 9999;

				// act
				var result = persistency.Calculation.exists(iCalcId);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(false);
			});
		});

		describe('update', function() {

			var mockstar = null;
			var persistency = null;

			var oCalculationData = testData.oCalculationTestData;

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						calculation : {
							name : mTableNames.calculation,
							data : oCalculationData
						}
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			function createCalculationToUpdate(){

				var oCalculation = JSON.parse(JSON.stringify(testData.oCalculationTestData));
				_.each(oCalculation , function(value, key){ oCalculation[key] = value[0]});  
				return oCalculation;
			}

			it('should not update anything if an non-existing calculation shall be updated --> return 0 as affected rows', function() {
				// arrange
				var oCalculationToUpdate = {};
				_.each(oCalculationData, function(value, key) {
					oCalculationToUpdate[key] = value[0];
				});
				oCalculationToUpdate.CALCULATION_ID = 1002;

				// act
				var oUpdatedCalculation = persistency.Calculation.update(oCalculationToUpdate);

				// assert
				expect(oUpdatedCalculation.affectedRows).toEqual(0);
			});

			it('should set the last last modified by/at fields correctly on update', function() {
				// arrange
				var oCalculationToUpdate =createCalculationToUpdate();
				oCalculationToUpdate.LAST_MODIFIED_BY = 'SomebodyElse';
				mockstar.upsertTableData("calculation", oCalculationToUpdate, "CALCULATION_ID = "+oCalculationToUpdate.CALCULATION_ID);
				var dLastModified = oCalculationToUpdate.LAST_MODIFIED_ON;

				// act
				var oUpdatedCalculation = persistency.Calculation.update(oCalculationToUpdate);

				// assert
				var oQueryResult = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation}} where CALCULATION_ID = "+oCalculationToUpdate.CALCULATION_ID));

				expect(oUpdatedCalculation.affectedRows).toEqual(1);
				expect(oQueryResult.LAST_MODIFIED_ON[0]).not.toBe(dLastModified);
				expect(oQueryResult.LAST_MODIFIED_BY[0]).toBe(testData.sTestUser);
			});

		});

		describe('getCurrentCalculationData', function() {

			var mockstar = null;
			var persistency = null;

			var oCalculationData = testData.oCalculationTestData;

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						calculation : {
							name : mTableNames.calculation,
							data : oCalculationData
						}
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it('should get the current data of a calculation with a valid id => returns calculation', function(){
				//arrange
				var oCalculation = JSON.parse(JSON.stringify(testData.oCalculationTestData));

				_.each(oCalculation , function(value, key){ oCalculation[key] = value[0]});

				//act
				var oResult = persistency.Calculation.getCurrentCalculationData(oCalculation.CALCULATION_ID);

				//assert
				expect(oCalculation).toEqual(JSON.parse(JSON.stringify(oResult)));
			});

			it('should get the current data of a calculation with invalid id => throw exception', function(){
				//arrange
				var exception = null;

				//delete
				var res = mockstar.execQuery('select * from "sap.plc.db::basis.t_calculation" where  CALCULATION_ID = 666');
				//end delete

				// act
				try {
					var dings = persistency.Calculation.getCurrentCalculationData(666);
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
			});
		});
	}

	describe('createCalculationAsCopy', function() {

		var mockstar = null;
		var persistency = null;
		var sSessionId = testData.sSessionId;
		var sLanguage = "EN";
		var oCalculationData = mockstarHelpers.convertToObject(testData.oCalculationTestData, 0);
		var oCalculationVersionData = mockstarHelpers.convertToObject(testData.oCalculationVersionTestData, 0);

		beforeOnce(function() {
			mockstar = new MockstarFacade({
				testmodel :{
					calculation_create_as_copy : "sap.plc.db.calculationmanager.procedures/p_calculation_create_as_copy",
					calculation_version_copy : "sap.plc.db.calculationmanager.procedures/p_calculation_version_copy"
				},
				substituteTables : {
					calculation : mTableNames.calculation,
					calculation_version : mTableNames.calculation_version,
					calculation_version_temporary : "sap.plc.db::basis.t_calculation_version_temporary",
					open_calculation_versions : mTableNames.open_calculation_versions,
					item : "sap.plc.db::basis.t_item",
					item_ext : "sap.plc.db::basis.t_item_ext",
					item_temporary_ext : "sap.plc.db::basis.t_item_temporary_ext",
					item_temporary : "sap.plc.db::basis.t_item_temporary",
					project: "sap.plc.db::basis.t_project",
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
			if (!mockstar.disableMockstar) {
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '::';
				originalProcedures = CalculationImport.Procedures;
				CalculationImport.Procedures = Object.freeze({
					calculation_create_as_copy : procedurePrefix + '.sap.plc.db.calculationmanager.procedures::p_calculation_create_as_copy'
				});
			};
			mockstar.clearAllTables();
			mockstar.insertTableData("calculation", testData.oCalculationTestData);
			mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			mockstar.insertTableData("item", testData.oItemTestData);
			mockstar.insertTableData("project", testData.oProjectTestData);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("item_ext", testData.oItemExtData);
			}
			mockstar.initializeData();
						
            persistency = new Persistency(jasmine.dbConnection);
		});

		afterOnce(function() {
			mockstar.cleanup();
			if (!mockstar.disableMockstar) {
				CalculationImport.Procedures = originalProcedures;
			};	
		});

		it('should create new calculation as copy --> new calculation with copied version under same project returned', function() {
			// arrange
			var iCalcVersionId = oCalculationVersionData.CALCULATION_VERSION_ID;
            spyOn(persistency.Calculation.helper, 'getNextSequenceID').and.callFake(function() {
				    return 1;
				});
				
			// act
			var oResultObject = persistency.Calculation.createCalculationAsCopy(iCalcVersionId, null, sSessionId, sUserId, sLanguage);

			// assert

			// check if the correct data was written to t_calculation
			var oResultCalculationTable = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation}}"));
			var oResultCalculationVersionTempTable = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation_version_temporary}}"));
			var oResultItemTempTable = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{item_temporary}}"));

			expect(helpers.isPositiveInteger(oResultCalculationTable.CALCULATION_ID[0])).toBe(true);
			expect(oResultCalculationTable.CALCULATION_ID[3]!==oCalculationData.CALCULATION_ID).toBeTruthy();
			expect(oResultCalculationTable.PROJECT_ID[3]).toEqual(oCalculationData.PROJECT_ID);
			expect(oResultCalculationTable.CALCULATION_NAME[3]!==oCalculationData.CALCULATION_NAME).toBeTruthy();

			expect(oResultCalculationTable.CURRENT_CALCULATION_VERSION_ID[3]).toBeDefined();
			expect(oResultCalculationTable.CURRENT_CALCULATION_VERSION_ID[3]!==oCalculationData.CURRENT_CALCULATION_VERSION_ID).toBeTruthy();
			expect(oResultCalculationTable.CURRENT_CALCULATION_VERSION_ID[3]).toEqual(oResultObject.version.CALCULATION_VERSION_ID);

			// check calculation data in oResultObject
			expect(oResultObject.calculation.CALCULATION_ID).toEqual(oResultCalculationTable.CALCULATION_ID[3]);
			expect(oResultObject.calculation.PROJECT_ID).toEqual(oCalculationData.PROJECT_ID);
			expect(oResultCalculationTable.CALCULATION_NAME[3]!==oCalculationData.CALCULATION_NAME).toBeTruthy();
			expect(oResultObject.calculation.CALCULATION_NAME).toEqual(oResultCalculationTable.CALCULATION_NAME[3]);
			expect(oResultObject.calculation.CURRENT_CALCULATION_VERSION_ID).toEqual(oResultCalculationTable.CURRENT_CALCULATION_VERSION_ID[3]);
			expect(oResultObject.calculation.CURRENT_CALCULATION_VERSION_ID).toEqual(oResultObject.version.CALCULATION_VERSION_ID);

			// check calculation version in oResultObject
			expect(oResultObject.version.CALCULATION_VERSION_ID !== oCalculationVersionData.CALCULATION_VERSION_ID).toBeTruthy();
			expect(oResultObject.version.COSTING_SHEET_ID).toBe(oCalculationVersionData.COSTING_SHEET_ID);
			expect(oResultObject.version.COMPONENT_SPLIT_ID).toBe(oCalculationVersionData.COMPONENT_SPLIT_ID);

			// check item in oResultObject
			expect(oResultObject.items[0].ITEM_ID).toEqual(testData.oItemTestData.ITEM_ID[0]);
			expect(oResultObject.items[0].CALCULATION_VERSION_ID !== testData.oItemTestData.CALCULATION_VERSION_ID[0]);
			expect(oResultObject.items[0].TOTAL_COST_PER_UNIT).toEqual(testData.oItemTestData.TOTAL_COST_PER_UNIT[0]);
			expect(oResultObject.items[0].TOTAL_COST_PER_UNIT_VARIABLE_PORTION).toEqual(testData.oItemTestData.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0]);
			expect(oResultObject.items[0].TOTAL_COST_PER_UNIT_FIXED_PORTION).toEqual(testData.oItemTestData.TOTAL_COST_PER_UNIT_FIXED_PORTION[0]);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var resultItemTempExt = mockstar.execQuery("select count(*) as count from {{item_temporary_ext}} " + "where calculation_version_id=" + oResultObject.version.CALCULATION_VERSION_ID);
				expect(resultItemTempExt.columns.COUNT.rows[0].toString()).toBe("3");
			}				
		});
		
		it('should create new calculation as copy --> CREATED_ON and LAST_MODIFIED_ON updated to current time, CREATED_BY__USER_ID and LAST_MODIFIED_BY updated to current user', function() {
			// arrange
			var iCalcVersionId = oCalculationVersionData.CALCULATION_VERSION_ID;

			// act
			var oResultObject = persistency.Calculation.createCalculationAsCopy(iCalcVersionId, null, sSessionId, sUserId, sLanguage);

			// assert
			testHelpers.checkDatesUpdated(oResultObject.calculation, ["CREATED_ON", "LAST_MODIFIED_ON"]);
			expect(oResultObject.calculation.CREATED_BY).toEqual(sUserId);
			expect(oResultObject.calculation.LAST_MODIFIED_BY).toEqual(sUserId);		
		});

		it("should create new calculation as copy under same project and put a counter at the name if it already existed --> return different name", function() {
			// arrange
			var iCalcVersionId = oCalculationVersionData.CALCULATION_VERSION_ID;
			spyOn(persistency.Calculation.helper, 'getNextSequenceID').and.callFake(function() {
			        return 2;
			});
				
			// act
			var oResultObject = persistency.Calculation.createCalculationAsCopy(iCalcVersionId, null, sSessionId, sUserId, sLanguage);

			// assert
			var sCalculationName = oCalculationData.CALCULATION_NAME + ' (2)';
			expect(oResultObject.calculation.CALCULATION_NAME).toEqual(sCalculationName);
			
		});
		
		it("should create new calculation as copy under another project --> return new calculation under target project", function() {
			// arrange
			var iCalcVersionId = oCalculationVersionData.CALCULATION_VERSION_ID;
			persistency = new Persistency(jasmine.dbConnection);
			var sAnotherProjectId = 'PR_Another';

			// act
			var oResultObject = persistency.Calculation.createCalculationAsCopy(iCalcVersionId, sAnotherProjectId, sSessionId, sUserId, sLanguage);

			// assert
			
			// check response
			expect(oResultObject.calculation.PROJECT_ID).toEqual(sAnotherProjectId);
			
			// check if the correct data was written to t_calculation
			var oResultCalculationTable = mockstarHelpers.convertResultToArray(mockstar.execQuery("select * from {{calculation}};"));
			expect(oResultCalculationTable.PROJECT_ID[3]).toEqual(sAnotherProjectId);
		});
		
		it("should create new calculation as copy and put the IS_FROZEN to null for all calculation versions", function() {
            // arrange
			var oCalculationVersionDataFrozen = {
					"CALCULATION_VERSION_ID" : [ 2810 ],
					"CALCULATION_ID" : [ 1978 ],
					"CALCULATION_VERSION_NAME" : [ "Froze calc vers"],
					"ROOT_ITEM_ID" : [ 3001 ],
					"SALES_PRICE_CURRENCY_ID" : [ "EUR" ],
					"REPORT_CURRENCY_ID" : [ "EUR" ],
					"VALUATION_DATE" : [ testData.sExpectedDateWithoutTime ],
					"LAST_MODIFIED_ON" : [ testData.sExpectedDate ],
					"LAST_MODIFIED_BY" : [ testData.sTestUser ],
					"MASTER_DATA_TIMESTAMP" : [ testData.sMasterdataTimestampDate ],
					"IS_FROZEN" : [ 1 ],
					"EXCHANGE_RATE_TYPE_ID" : [ sDefaultExchangeRateType ],
					"MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy],
					"ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy]
				};
            mockstar.insertTableData("calculation_version", oCalculationVersionDataFrozen);

            // act
            var oResult = persistency.Calculation.createCalculationAsCopy(oCalculationVersionDataFrozen.CALCULATION_VERSION_ID[0], null, sSessionId, sUserId, sLanguage);

            // assert
            expect(oResult.version.IS_FROZEN).toBeNull();
     	});

	
	});
	
	if(jasmine.plcTestRunParameters.mode === 'all'){
		describe('isCurrentVersion', function() {
			var mockstar = null;
			var persistency = null;

			var oCalculationData = {
					"CALCULATION_ID" : [ 1 ],
					"PROJECT_ID" : [ "" ],
					"CALCULATION_NAME" : [ "Pumpe" ],
					"CURRENT_CALCULATION_VERSION_ID" : [ 11 ],
					"CREATED_ON" : [ "2015-01-22T13:16:10.764Z" ],
					"CREATED_BY" : [ "USER" ],
					"LAST_MODIFIED_ON" : [ "2015-01-22T13:16:10.764Z" ],
					"LAST_MODIFIED_BY" : [ "USER" ]
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						calculation : {
							name : mTableNames.calculation,
							data : oCalculationData
						}
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.initializeData();

				persistency = new Persistency(jasmine.dbConnection);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should return true when calculation version is the current one", function() {
				// arrange
				var iCalcVersionId = 11;

				// act
				var result = persistency.Calculation.isCurrentVersion(iCalcVersionId);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(true);
			});

			it("should return false when calculation version id is not the current one", function() {
				// arrange
				var iCalcVersionId = 12;

				// act
				var result = persistency.Calculation.isCurrentVersion(iCalcVersionId);

				// assert
				expect(result).toBeDefined();
				expect(result).toBe(false);
			});

			it("should return general_unexpected_exception when calculation version id is not a number", function() {
				// arrange
				var iCalcVersionId = 'aaa';

				var exception = null;
				// act
				try {
					persistency.Calculation.isCurrentVersion(iCalcVersionId);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
			});
		});
	}

	describe('get', function() {

		var mockstar = null;
		var persistency = null;

		beforeOnce(function() {
			mockstar = new MockstarFacade({
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
					calculationVersionTemporary : {
						name : mTableNames.calculation_version_temporary,
						data : testData.oCalculationVersionTemporaryTestData
					},
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
			mockstar.clearAllTables();
			mockstar.initializeData();

			persistency = new Persistency(jasmine.dbConnection);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should get all calculations', function(){
			//arrange
			mockstar.insertTableData("authorization",{
				PROJECT_ID   : [testData.oProjectCurrencyTestData.PROJECT_ID[0]],//PR3
				USER_ID      : [sUserId],
				PRIVILEGE    : [InstancePrivileges.READ]
			});
			var oCalculation = _.cloneDeep(testData.oCalculationTestData);
			var oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1,1,1]});

			//act
			var oReturnedObject = persistency.Calculation.get([], sUserId);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(3);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});

		it('should get a temporary calculation version with a given ID', function(){
			//arrange
			mockstar.insertTableData("authorization",{
				PROJECT_ID   : [testData.oProjectCurrencyTestData.PROJECT_ID[0]],//PR3
				USER_ID      : [sUserId],
				PRIVILEGE    : [InstancePrivileges.READ]
			});
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0]); 
			var oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1]});
			mockstar.clearTable("calculationVersion");
			
			//act
			var oReturnedObject = persistency.Calculation.get([], sUserId, ['1978']);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});

		it('should get all calculations from projects for which the user has at least read privilege', function(){
			//the same data as in previous test, but the user is missing read privilege for PR3

			//act
			var oReturnedObject = persistency.Calculation.get([], sUserId);

			//assert
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1]);
			var oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1,1]});
			expect(oReturnedCalculation.length).toBe(2);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get all calculations for a specific project', function(){
			//arrange
			var aProjects = ["PR1"];
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1]);
			var oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1,1]});

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(2);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
       	it('should return an empty list if calculations for a project that do now exists are requested', function(){
			//arrange
			var aProjects = ["ABC"];

			// act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			expect(oReturnedCalculation.length).toBe(0);
			
		});
		
		it('should get a calculation with a given ID', function(){
		    //arrange
			var aCalculationIds = [testData.iCalculationId];
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0]);
			var oExpectedResponse = oCalculation;

			//act
			var oReturnedObject = persistency.Calculation.get([], sUserId, aCalculationIds);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get multiple calculations with given IDs', function(){
		    //arrange
		    var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1]);
			var aCalculationIds = [testData.iCalculationId, oCalculation[1].CALCULATION_ID];
			var oExpectedResponse = oCalculation;

			//act
			var oReturnedObject = persistency.Calculation.get([], sUserId, aCalculationIds);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(2);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get a calculation with a given ID of a given project', function(){
		    //arrange
		    var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0]);
			var aCalculationIds = [testData.iCalculationId];
			var aProjects = ["PR1"];
			var oExpectedResponse = oCalculation;

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get one calculation with a given ID of a given project, and filter the invalid combination of calculation_id and project_id', function(){
		    //arrange
		    var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0,2]); //the third entry belongs to project PR3
			var aCalculationIds = [testData.iCalculationId,oCalculation[1].CALCULATION_ID];
			var aProjects = ["PR1"];
			var oExpectedResponse = oCalculation[0];

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should not return a calculation with a given ID and given project, if the calculation belongs to a different project', function(){
		    //arrange
			var aCalculationIds = [testData.iCalculationId]; //belongs to project PR1
			var aProjects = ["PR3"];

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(0);
		});
		
		it('should get no calculation specific project if topPerProject parameter is set to 0', function(){
			//arrange
			var aProjects = ["PR1"];

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId, null, 0);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(0);
		});
		
		it('should get first calculation ordered by Calculation Name for a specific project if topPerProject parameter is set to 1', function(){
			//arrange
			var aProjects = ["PR1"];
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1]);
			var oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1,1]});

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId, null, 1);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse[1], ["CALCULATION_ID"]);
		});
		
		it('should get first calculations ordered by Calculation Name for each project if topPerProject parameter is set to 1', function(){
			//arrange
			var aProjects = ["PR1", "PR3"];
			mockstar.insertTableData("authorization",{
				PROJECT_ID   : [testData.oProjectCurrencyTestData.PROJECT_ID[0]],//PR3
				USER_ID      : [sUserId],
				PRIVILEGE    : [InstancePrivileges.READ]
			});
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([1,2]);
			var oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1,1]});
			

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId, null, 1);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(2);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get first calculations (2 from a project and 1 from another) ordered by Calculation Name for each project if topPerProject parameter is set to 2', function(){
			//arrange
			var aProjects = ["PR1", "PR3"];
			mockstar.insertTableData("authorization",{
				PROJECT_ID   : [testData.oProjectCurrencyTestData.PROJECT_ID[0]],//PR3
				USER_ID      : [sUserId],
				PRIVILEGE    : [InstancePrivileges.READ]
			});
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1,2]);
			var oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1,1]});
			

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId, null, 2);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(3);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get first 100 calculatios for a specific project if topPerProject parameter is null', function(){
			//arrange
			var aProjects = ["PR1"];
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1]);
			var oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1,1]});

			//act
			var oReturnedObject = persistency.Calculation.get(aProjects, sUserId, null, 101);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(2);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get all calculations for which the calculation id contains the given search string - two results', function(){
			//arrange
			const oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0,1]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1,1]});
            const aProjects = null, aCalculationIds = [], itopPerProject = null;
            const sSearchCriteria = "8";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));

			//assert
			expect(oReturnedCalculation.length).toBe(2);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get all calculations for which the calculation id contains the given search string - 1 result', function(){
			//arrange
			const oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([1]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1]});
            const aProjects = null, aCalculationIds = [], itopPerProject = null;
            const sSearchCriteria = "207";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get all calculations for which the calculation name contains the given search string - 1 result', function(){
			//arrange
			const oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1]});
            const aProjects = null, aCalculationIds = [], itopPerProject = null;
            const sSearchCriteria = "umpe";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get no calculation if the search criteria is not found in the calculation name or in the calculation id', function(){
			//arrange
            const aProjects = null, aCalculationIds = [], itopPerProject = null;
            const sSearchCriteria = "search-search-search";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(oReturnedCalculation.length).toBe(0);
		});
		
		it('should get all calculations that meet the search criteria but also belong to a given project', function(){
			//arrange
			const oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1]});
            const aProjects = ["PR1"], aCalculationIds = [], itopPerProject = null;
            const sSearchCriteria = "umpe";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should get no calculation if the search criteria exists but not for the given project', function(){
			//arrange
            const aProjects = ["PR3"], aCalculationIds = [], itopPerProject = null;
            const sSearchCriteria = "umpe";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(oReturnedCalculation.length).toBe(0);
		});
		it('should get the calculation that meet the search criteria but also have the given project', function(){
			//arrange
			const oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([1]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1]});
            const aProjects = null, aCalculationIds = [2078], itopPerProject = null;
            const sSearchCriteria = "pump";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(oReturnedCalculation.length).toBe(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		it('should get no calculation if the search criteria exists but not for the given calculation id', function(){
			//arrange
            const aProjects = null, aCalculationIds = [2078], itopPerProject = null;
            const sSearchCriteria = "umpe";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(oReturnedCalculation.length).toBe(0);
		});
		it('should get the number of calculations based top parameter but that also meet the search criteria', function(){
			//arrange
			const oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([1]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1]});
            const aProjects = null, aCalculationIds = [], itopPerProject = 1;
            const sSearchCriteria = "pump";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(1);
			expect(aCalculations).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		it('should get no calculation if the search criteria exists but the top parameter is 0', function(){
			//arrange
            const aProjects = null, aCalculationIds = [], itopPerProject = 0;
            const sSearchCriteria = "ump";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(0);
		});
		it('should get two calculations based on the search criteria - 1 that corresponds for the name, 1 that corresponds for the id', function(){
			//arrange
			mockstar.clearTable("calculation");
			// adapt the test data in order to have the search criteria "978" in id for one calculation and in the name for the other
			const oCalculationTestData = new TestDataUtility(testData.oCalculationTestData).build();
			oCalculationTestData.CALCULATION_ID[0] = 1978;
			oCalculationTestData.CALCULATION_NAME[1] = "Calculation 2978";

			mockstar.insertTableData("calculation", oCalculationTestData);	
			const oCalculation = new TestDataUtility(oCalculationTestData).getObjects([0, 1]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [0, 1]});
            const aProjects = null, aCalculationIds = null, itopPerProject = null;
            const sSearchCriteria = "978";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(2);
			expect(aCalculations).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		it('should return 1 calculation if top parameter is set to 1', function(){
			//arrange
            const aProjects = [], aCalculationIds = [], iTopCalculations = 1;
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, null, null, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(1);
		});
		it('should return 0 calculations if top parameter is set to 0', function(){
			//arrange
            const aProjects = [], aCalculationIds = [], iTopCalculations = 0;
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, null, null, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(0);
		});
		it('should return 1 calculation belonging if topPerProject paramter is 4 and top parameter is set to 1', function(){
			//arrange
            const aProjects = [], aCalculationIds = [], iTopCalculations = 1, itopPerProject = 4;
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, null, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(1);
		});
		it('should return 2 calculations belonging to two different projects if top param is 2 and topPerProject is 1', function(){
			//arrange
			// authorizations for PR3
			const oExtraAuthorization = {
				PROJECT_ID   : [testData.oProjectCurrencyTestData.PROJECT_ID[0]],
				USER_ID      : [sUserId],
				PRIVILEGE    : [InstancePrivileges.READ]
			}
					
			mockstar.insertTableData("authorization", oExtraAuthorization);
            const aProjects = [], aCalculationIds = [], iTopCalculations = 2, itopPerProject = 1;
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, null, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(2);
			expect(aCalculations[0].PROJECT_ID).not.toBe(aCalculations[1].PROJECT_ID);
		});
		xit('should return 2 calculations belonging to the same project if top param is 2 and topPerProject is 2', function(){
			//arrange
			// authorizations for PR3
			const oExtraAuthorization = {
				PROJECT_ID   : [testData.oProjectCurrencyTestData.PROJECT_ID[0]],
				USER_ID      : [sUserId],
				PRIVILEGE    : [InstancePrivileges.READ]
			}
					
			mockstar.insertTableData("authorization", oExtraAuthorization);
            const aProjects = [], aCalculationIds = [], iTopCalculations = 2, itopPerProject = 2;
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, null, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(2);
			expect(aCalculations[0].PROJECT_ID).toBe(aCalculations[1].PROJECT_ID);
		});
		it('should return 1 calculation belonging to the given project if top param is 1', function(){
			//arrange
			const sGivenProject = testData.oProjectTestData.PROJECT_ID[0];
            const aProjects = [sGivenProject], aCalculationIds = [], iTopCalculations = 1;
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, null, null, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(1);
			expect(aCalculations[0].PROJECT_ID).toBe(sGivenProject);
		});
		
		it('should return 1 calculation based on top parameter but that also meet the search criteria', function(){
			//arrange
			const oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([1]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1]});
            const aProjects = null, aCalculationIds = [], iTopCalculations = 1;
            const sSearchCriteria = "pump";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, null, sSearchCriteria, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(1);
			expect(aCalculations).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});

		it('should return a calculation only once if it appears in the temporary table too', function(){
			//arange
			mockstar.execSingle('UPDATE {{calculationVersionTemporary}} SET CALCULATION_ID = 1978');
			var oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([0]);
			var oExpectedResponse = oCalculation;

			//act
			var oReturnedObject = persistency.Calculation.get([], sUserId, ['1978']);
			var oReturnedCalculation = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			const aSavedCalculations = persistency.Calculation.getSaved([], sUserId, ['1978']);
			
			//assert
			expect(aSavedCalculations.calculations.length).toEqual(1);
			expect(oReturnedCalculation).toMatchData(oExpectedResponse, ["CALCULATION_ID"]);
		});
		
		it('should return no calculations if top parameter is 5 but no the search criteria is not met', function(){
			//arrange
			const oCalculation = new TestDataUtility(testData.oCalculationTestData).getObjects([1]);
			const oExpectedResponse = _.extend(oCalculation, {"CALCULATION_VERSION_NO": [1]});
            const aProjects = null, aCalculationIds = [], iTopCalculations = 5;
            const sSearchCriteria = "ABCDEFG";
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, null, sSearchCriteria, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(0);
        });
        
        it('should set the iTopCalculations parameter to maximum default value', function(){
			//arrange
			const oExtraAuthorization = {
				PROJECT_ID   : [testData.oProjectCurrencyTestData.PROJECT_ID[0]],
				USER_ID      : [sUserId],
				PRIVILEGE    : [InstancePrivileges.READ]
			}
					
			mockstar.insertTableData("authorization", oExtraAuthorization);
            const aProjects = [], aCalculationIds = [], itopPerProject = 2;
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, null);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(3);
			expect(persistency.Calculation.iTopCalculations).toBe(Constants.SQLMaximumInteger);
		});
		
		xit('should set the iTopCalculations parameter to specified value', function(){
			//arrange
			const oExtraAuthorization = {
				PROJECT_ID   : [testData.oProjectCurrencyTestData.PROJECT_ID[0]],
				USER_ID      : [sUserId],
				PRIVILEGE    : [InstancePrivileges.READ]
			}
					
			mockstar.insertTableData("authorization", oExtraAuthorization);
            const aProjects = [], aCalculationIds = [], itopPerProject = 2, iTopCalculations = 2;
			//act
			const oReturnedObject = persistency.Calculation.get(aProjects, sUserId, aCalculationIds, itopPerProject, null, iTopCalculations);
			const aCalculations = JSON.parse(JSON.stringify(oReturnedObject.calculations));
			//assert
			expect(aCalculations.length).toBe(2);
			expect(persistency.Calculation.iTopCalculations).toBe(iTopCalculations);
		});
	});

		describe('getSourceVersionsWithMasterVersionsFromDifferentCalculations', function() {

		var mockstar = null;
		var persistency = null;
		//add test data for item and item temporary table with items of type referenced calculation version
		var sExpectedDate = new Date().toJSON();
		var oItemTestData = {
				"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
				"CALCULATION_VERSION_ID" : [2810, 2810, 2, 4811, 4811],
				"PARENT_ITEM_ID" : [ null, 3001, 3001, null, 5001],
				"PREDECESSOR_ITEM_ID" : [ null, 3001, null, null, 5001],
				"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
				"ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
				"CHILD_ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
				"REFERENCED_CALCULATION_VERSION_ID": [null, 2809, 4, null, 6809],
				"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
				"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
				"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
				"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
			};
		
		var oItemTemporaryTestData = {
				"SESSION_ID": ["TestUser", "TestUser", "TestUser", "TestUser", "TestUser"],
				"ITEM_ID" : [ 7001, 8001, 8002, 8003, 8004 ],
				"CALCULATION_VERSION_ID" : [ 1, 4811, 6809, 6809, 6809],
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
			mockstar = new MockstarFacade({
				substituteTables : {
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
			mockstar.clearAllTables();
			mockstar.initializeData();
			mockstar.insertTableData("calculation", testData.oCalculationTestData1);
			mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
			mockstar.insertTableData("item", oItemTestData);

			persistency = new Persistency(jasmine.dbConnection);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should get all versions of the calculation that have master versions in other calculations', function(){
			//arrange
			var iCalcId = 5078;
			
			//act
			var aResult = persistency.Calculation.getSourceVersionsWithMasterVersionsFromDifferentCalculations(iCalcId);
			
			//assert
			expect(aResult.length).toBe(1);
			expect(aResult[0].CALCULATION_VERSION_ID).toBe(6809);
		});
		
		it('should return empty when the source version have all the master versions in the same calculations', function(){
			//arrange
			var iCalcId = 1978;
			
			//act
			var aResult = persistency.Calculation.getSourceVersionsWithMasterVersionsFromDifferentCalculations(iCalcId);
			
			//assert
			expect(aResult.length).toBe(0);
		});
		
		it('should return also the versions referenced in the temporary table', function(){
			//arrange
			var iCalcId = 1978;
			mockstar.insertTableData("item_temporary", oItemTemporaryTestData);
			
			//act
			var aResult = persistency.Calculation.getSourceVersionsWithMasterVersionsFromDifferentCalculations(iCalcId);
			//assert
			expect(aResult.length).toBe(2);
			expect(aResult).toMatchData({
				CALCULATION_VERSION_ID: [2809, 2810]
			}, ["CALCULATION_VERSION_ID"]);
		});
		
		it('should return empty when there are no source versions in the calculation', function(){
			//arrange
			var iCalcId = 222;
			
			//act
			var aResult = persistency.Calculation.getSourceVersionsWithMasterVersionsFromDifferentCalculations(iCalcId);
			
			//assert
			expect(aResult.length).toBe(0);
		});
	});
			
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);