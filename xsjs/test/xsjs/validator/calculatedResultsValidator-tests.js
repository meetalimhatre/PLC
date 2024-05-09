var _ = require("lodash");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var testData = require("../../testdata/testdata").data;
var calculatedResultsValidatorLibrary = $.import("xs.validator", "calculatedResultsValidator");
var CalculatedResultsValidator = calculatedResultsValidatorLibrary.CalculatedResultsValidator;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.calculatedResultsValidator-tests', function() {

		var oCalculatedResultsValidator;
		var sSessionID = "TestSessionID";
		var oMetadataProviderMock = null;
		var oConnectionMock = null;
		var oPersistencyMock = null;
		var BusinessObjectValidatorUtilsMock = null;
		var oCalculationVersionMock = null;

		beforeEach(function() {
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', [ 'get' ]);
			oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "getConnection" ]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Item);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEntity", "checkMandatoryProperties");
			// arrange the mock of checkEntity that to return the entity with which it was called; bypasses any validation, but keeps the 
			// contract of the method
			BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(function() {
				var oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
				return oLastCallEntity;
			});
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();
			
			oCalculationVersionMock = jasmine.createSpyObj('oCalculationVersionMock', 
					['isOpenedInSessionAndContext', 'existsCVTemp']);
			
			oPersistencyMock.CalculationVersion = oCalculationVersionMock;

			oCalculatedResultsValidator = new CalculatedResultsValidator(oPersistencyMock, sSessionID, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);

		});

		function createRequest() {
			var oRequest = {
					queryPath : "calculated-results",
					method : $.net.http.GET
			};
			return oRequest;
		}

		describe("GET", function() {
			
			it("should return validated calculation version", function() {
				//arrange
				var oValidatedParameters = {
					"id" : testData.iCalculationVersionId, 
					"calculate" : true
				};
					
				//act
				var result = oCalculatedResultsValidator.validate(createRequest(), oValidatedParameters);

				// assert	
				expect(result.length).toBe(0);
			});
			
			it("should throw an exception if calculation version does not exist => return GENERAL_ENTITY_NOT_FOUND_ERROR", function() {
				//arrange
				var oValidatedParameters = {
						"id" : testData.iCalculationVersionId, 
						"calculate" : true
				};

				oCalculationVersionMock.existsCVTemp.and.returnValue(false);
				
				//act
				var exception;
				try {
					var result = oCalculatedResultsValidator.validate(createRequest(), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR);
			});
			
			it("should throw an exception if calculation version is not opened => return CALCULATION_VERSION_NOT_OPEN_ERROR", function() {
				//arrange
				var oValidatedParameters = {
						"id" : testData.iCalculationVersionId, 
						"calculate" : true
				};

				oCalculationVersionMock.existsCVTemp.and.returnValue(true);
				oCalculationVersionMock.isOpenedInSessionAndContext.and.returnValue(false);
				
				//act
				var exception;
				try {
					var result = oCalculatedResultsValidator.validate(createRequest(), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.CALCULATION_VERSION_NOT_OPEN_ERROR);
			});
			
		});
		
	}).addTags(["All_Unit_Tests"]);
}