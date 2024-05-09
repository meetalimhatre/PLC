/*jslint undef:true*/

var ServiceOutput = require("../../../lib/xs/util/serviceOutput");
var _ = require("lodash");
var calculations = new (require("../../../lib/xs/impl/calculations").Calculations)($);

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.calculations-tests', function() {

		var oPersistencyMock = null;
		var oConnectionMock = null;

		var oTestCalculation;

		beforeOnce(function() {
			oConnectionMock = jasmine.createSpyObj('oConnectionMock', ['commit']);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);

		});

		describe("get", function() {

			var oTestCalculations = null;
			var oResponseCalculations = {};

			beforeEach(function() {

				initTestData();

				var oPersistencyCalculationMock = jasmine.createSpyObj("oPersistencyCalculationMock", ["get"]);
				var oPersistencyMiscMock = jasmine.createSpyObj("oPersistencyMiscMock", ["releaseLock"]);

				oPersistencyMock.Misc = oPersistencyMiscMock;
				oPersistencyMock.Calculation = oPersistencyCalculationMock;

				oPersistencyMock.Calculation.get.and.returnValue(
						oResponseCalculations
				);

			});

			function initTestData() {
				oTestCalculations = [{
					CALCULATION_ID: 1,
					CALCULATION_VERSION_ID: 1,
					V_CALCULATION_ID: 1,
					ROOT_ITEM_ID: 1,
					ITEM_ID: 1,
					I_CALCULATION_VERSION_ID: 1,
					CURRENT_CALCULATION_VERSION_ID: 1
				}, {
					CALCULATION_ID: 1,
					CALCULATION_VERSION_ID: 2,
					V_CALCULATION_ID: 1,
					ROOT_ITEM_ID: 2,
					ITEM_ID: 2,
					I_CALCULATION_VERSION_ID: 2,
					CURRENT_CALCULATION_VERSION_ID: 3
				}];
				oResponseCalculations.calculations = oTestCalculations;
			}

			it('should return emtpy array as payload if no calculations were found', function() {
				// arrange
				var oResponse = {};
				oResponse.calculations = [];
				oPersistencyMock.Calculation.get.and.returnValue(
						oResponse
				);
				var oServiceOutput = new ServiceOutput();

				// act
				calculations.get(null, {}, oServiceOutput, oPersistencyMock);

				// assert
				expect(_.isArray(oServiceOutput.payload.body.transactionaldata)).toBe(true);
				expect(oServiceOutput.payload.body.transactionaldata.length).toBe(0);
			});

			it('should return the test calculation for GET call without parameters', function() {
				// arrange
				var oServiceOutput = new ServiceOutput();

				// act
				calculations.get(null, {}, oServiceOutput, oPersistencyMock);

				// assert
				var oOutputCalclations = oServiceOutput.payload.body.transactionaldata;
				expect(oOutputCalclations[0].CALCULATION_ID).toBe(oTestCalculations[0].CALCULATION_ID);
			});

		});

		describe("create", function() {

			oTestCalculation = {
					SESSION_ID: "12345",
					CALCULATION_ID: -1,
					CONTROLLING_AREA_ID: "testArea",
					LOT_SIZE: 1.5,
					LOT_SIZE_UOM_ID: "testUom",
					REPORT_CURRENCY_ID: "testcurrency",
					CALCULATION_NAME: "testCalculation",
					CALCULATION_VERSIONS: [{
						SESSION_ID: "12345",
						CALCULATION_VERSION_ID: -1,
						CALCULATION_ID: -1,
						ROOT_ITEM_ID: -1,
						LOT_SIZE: 1.5,
						LOT_SIZE_UOM_ID: "testUom",
						REPORT_CURRENCY_ID: "testcurrency",
						CALCULATION_NAME: "testCalculation",
						CALCULATION_VERSION_NAME: "testCalculationVersion",
						ITEMS: [{
							SESSION_ID: "12345",
							ITEM_ID: -1,
							CALCULATION_VERSION_ID: -1,
							ITEM_CATEGORY_ID: "01"
						}]
					}]
			};

			beforeEach(function() {
				var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", ["isSessionOpened"]);
				var oPersistencyCalculationMock = jasmine.createSpyObj("oPersistencySessionMock", ["create"]);				

				oPersistencyMock.Calculation = oPersistencyCalculationMock;
				oPersistencyMock.Session = oPersistencySessionMock;
			});

			it('createCalculation_invalidSession_throwsException', function() {
				// arrange
				var params = {"action" : "create"};
				oPersistencyMock.Session.isSessionOpened.and.returnValue(false);
				oConnectionMock.commit.calls.reset();

				// act & assert
				expect(function() {
					calculations.handlePostRequest([oTestCalculation], params, new ServiceOutput(), oPersistencyMock);
				}).toThrow();

				expect(oConnectionMock.commit).not.toHaveBeenCalled();
				expect(oPersistencyMock.Calculation.create).not.toHaveBeenCalled();
			});
		});

		describe("delete", function() {


			beforeEach(function() {
				var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "getSessionDetails"]);
				var oPersistencyCalculationMock = jasmine.createSpyObj("oPersistencySessionMock", ["remove", "getOpeningUsersForVersions", "getOpeningUsers", "getSourceVersionsWithMasterVersionsFromDifferentCalculations"]);


				oPersistencyMock.Calculation = oPersistencyCalculationMock;
				oPersistencyMock.Session = oPersistencySessionMock;

				oPersistencyMock.Session.getSessionDetails.and.returnValue({
					userId: "userId",
					sessionId: "sessionId",
					language: "DE"
				});
				oPersistencyMock.Calculation.getSourceVersionsWithMasterVersionsFromDifferentCalculations.and.returnValue({});
				spyOn($.trace, "error").and.callThrough();
			});


			it("should throw error if one of versions under calculation is open", function() {
				// arrange
				oPersistencyMock.Calculation.getOpeningUsersForVersions.and.returnValue([{
					USER_ID: "UserId",
					CALCULATION_VERSION_ID: "CalcVersionId"
				}]);
				var oCalculationToDelete = {
						CALCULATION_ID : 1978
				};

				// act
				var exception = null;
				try {
					calculations.remove([oCalculationToDelete], [], new  ServiceOutput(), oPersistencyMock);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code.code).toBe('CALCULATIONVERSION_IS_STILL_OPENED_ERROR');
				expect($.trace.error).toHaveBeenCalled();
				expect(oPersistencyMock.Calculation.remove).not.toHaveBeenCalled();
			});

		});

		describe("createCalculationAsCopy", function() {
			beforeEach(function() {
				var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", ["isSessionOpened", "getSessionDetails"]);
				var oPersistencyCalculationMock = jasmine.createSpyObj("oPersistencyCalculationMock", ["create"]);				
				var oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", ["exists", "existsCVTemp", "get"]);

				oPersistencyMock.Calculation = oPersistencyCalculationMock;
				oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
				oPersistencyMock.Session = oPersistencySessionMock;

				oPersistencyMock.Session.getSessionDetails.and.returnValue({
					userId: "userId",
					sessionId: "sessionId",
					language: "DE"
				});
			});

			it('createCalculationAsCopy_temporaryCV_throwsException', function() {
				// arrange
				oPersistencyMock.Session.isSessionOpened.and.returnValue(true);
				oPersistencyMock.CalculationVersion.get.and.returnValue({ version : {}, items : [] });
				oPersistencyMock.CalculationVersion.exists.and.returnValue(false);
				oPersistencyMock.CalculationVersion.existsCVTemp.and.returnValue(true);
				oConnectionMock.commit.calls.reset();

				var params = {"action" : "copy-version", 
						"id" : 123, 
						"calculate" : false};

				// act
				var exception = null;
				try {
					calculations.handlePostRequest(null, params, new  ServiceOutput(), oPersistencyMock);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code.code).toBe('CALCULATIONVERSION_IS_TEMPORARY_ERROR');
				expect(exception.developerMessage).toBe('The version is a temporary calculation version. Please save the calculation version and try again.');
				expect(oPersistencyMock.Calculation.create).not.toHaveBeenCalled();
			});

			it('createCalculationAsCopy_notExistingCV_throwsException', function() {
				// arrange
				oPersistencyMock.Session.isSessionOpened.and.returnValue(true);
				oPersistencyMock.CalculationVersion.get.and.returnValue({ version : {}, items : [] });
				oPersistencyMock.CalculationVersion.exists.and.returnValue(false);
				oPersistencyMock.CalculationVersion.existsCVTemp.and.returnValue(false);
				oConnectionMock.commit.calls.reset();

				var params = {"action" : "copy-version", 
						"id" : 321, 
						"calculate" : false};

				// act
				var exception = null;
				try {
					calculations.handlePostRequest(null, params, new  ServiceOutput(), oPersistencyMock);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(exception.developerMessage).toBe('Calculation version not found.');
				expect(oPersistencyMock.Calculation.create).not.toHaveBeenCalled();
			});
		});
		
	}).addTags(["All_Unit_Tests"]);
}