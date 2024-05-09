var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var testHelpers = require("../../testtools/test_helpers");
var defaultSettingsValidatorLibrary = $.import("xs.validator", "defaultSettingsValidator");
var DefaultSettingsValidator = defaultSettingsValidatorLibrary.DefaultSettingsValidator;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.defaultSettingsValidator-tests', function() {
		var oDefaultSettingsValidator;
		var BusinessObjectValidatorUtilsMock = null;

		var mValidParameters = null;
		mValidParameters = [{
			type : "USER",
			lock : true
		}];
		var oQueryPath = "default-settings"

		var exception;
		var oExpectedErrorCodeValidationError = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
		var oExpectedErrorCodeUnexpectedException=  MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION;

		var oValidDefaultSettings = {
				CONTROLLING_AREA_ID: 1000,
				COMPANY_CODE_ID: "0005",
				PLANT_ID: 1000,
				REPORT_CURRENCY_ID: "GBP",
				COMPONENT_SPLIT_ID: 1,
				COSTING_SHEET_ID: ""
		};

		beforeEach(function() {

			oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.DefaultSettings);
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

			oDefaultSettingsValidator = new DefaultSettingsValidator(BusinessObjectValidatorUtilsMock);
		});

		function createRequest(oBody, oHTTPMethod, params) {
			var oRequest = {
					queryPath : "default-settings",
					method : oHTTPMethod,
					body : {
						asString : function() {
							return JSON.stringify(oBody);
						}
					},
					parameters : params
			};
			return oRequest;
		}

		it("should validate if the call is correct (for POST)", function(){
			//act
			var result = oDefaultSettingsValidator.validate(testHelpers.createRequest(oQueryPath, oValidDefaultSettings, $.net.http.POST, mValidParameters), mValidParameters);

			// assert
			expect(result.CONTROLLING_AREA_ID).toEqual(oValidDefaultSettings.CONTROLLING_AREA_ID);
			expect(result.COMPANY_CODE_ID).toEqual(oValidDefaultSettings.COMPANY_CODE_ID);
			expect(result.PLANT_ID).toEqual(oValidDefaultSettings.PLANT_ID);
			expect(result.REPORT_CURRENCY_ID).toEqual(oValidDefaultSettings.REPORT_CURRENCY_ID);
			expect(result.COMPONENT_SPLIT_ID).toEqual(oValidDefaultSettings.COMPONENT_SPLIT_ID);
			expect(result.COSTING_SHEET_ID).toEqual(oValidDefaultSettings.COSTING_SHEET_ID);
		})

		it("should raise an exception if the call is done with parameter without type set - USER or GLOBAL (for GET)", function(){
			//arrange
			var mInvalidParametersTypeWrong = null;
			mInvalidParametersTypeWrong = [{
				type : "",
				lock : true
			}];
			var exception;

			//act
			try {
				var result = oDefaultSettingsValidator.validate(createRequest(null, $.net.http.GET, mInvalidParametersTypeWrong), mInvalidParametersTypeWrong);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCodeValidationError);
		})

		it("should raise an exception if the call is done with parameter without lock set, for type GLOBAL (for GET)", function(){
			//arrange
			var mInvalidParametersTypeGlobalNoLock = null;
			mInvalidParametersTypeGlobalNoLock = [{
				type : "GLOBAL"
			}];

			//act
			try {
				var result = oDefaultSettingsValidator.validate(createRequest([], $.net.http.GET, mInvalidParametersTypeGlobalNoLock), mInvalidParametersTypeGlobalNoLock);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCodeValidationError);
		})

		it("should raise an exception if the call is done with body (for DEL)", function(){
			//act
			try {
				var result = oDefaultSettingsValidator.validate(createRequest(oValidDefaultSettings, $.net.http.DEL, mValidParameters), mValidParameters);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCodeValidationError);
		})

		it("should raise an exception if the call is done with incorrect tuple in body - COMPANY_CODE_ID and PLANT_ID without CONTROLLING_AREA_ID (for POST)", function(){
			//arrange
			var oInvalidDefaultSettingsIncorrectTuple = {
					COMPANY_CODE_ID: "0005",
					PLANT_ID: 1000,
					REPORT_CURRENCY_ID: "GBP"
			};

			//act
			try {
				var result = oDefaultSettingsValidator.validate(createRequest(oInvalidDefaultSettingsIncorrectTuple, $.net.http.POST, mValidParameters), mValidParameters);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCodeValidationError);
		})

		it("should raise an exception if the call is done without a HTTP method", function(){
			//act
			try {
				var result = oDefaultSettingsValidator.validate(createRequest(oValidDefaultSettings, "", mValidParameters), mValidParameters);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCodeUnexpectedException);
		})

	}).addTags(["All_Unit_Tests"]);
}