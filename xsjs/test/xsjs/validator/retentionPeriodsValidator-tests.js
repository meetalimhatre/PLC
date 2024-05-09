const BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
const constants = require("../../../lib/xs/util/constants");
const BusinessObjectTypes = constants.BusinessObjectTypes;
const MessageLibrary = require("../../../lib/xs/util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const retentionPeriodsValidatorLibrary = require("../../../lib/xs/validator/retentionPeriodsValidator");
const RetentionPeriodsValidator = retentionPeriodsValidatorLibrary.RetentionPeriodsValidator;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
const oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('xsjs.validator.retentionPeriodsValidator-tests', function() {
	
		var oRetentionPeriodsValidator;
	
		var BusinessObjectValidatorUtilsMock = null;
		var mValidatedParameters = null;
		
        beforeEach(function () {

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.RetentionPeriods);
			spyOn(BusinessObjectValidatorUtilsMock, "checkMandatoryProperties", "checkInvalidProperties");

			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

            oRetentionPeriodsValidator = new RetentionPeriodsValidator($, BusinessObjectValidatorUtilsMock);
		});

		var params = [];
		params.get = function() {
			return undefined;
		};

		function createRequest(aBody, oHTTPMethod) {
			var oRequest = {
					queryPath : "retention-periods",
					method : oHTTPMethod,
					body : {
						asString : function() {
							return JSON.stringify(aBody);
						}
					},
					parameters : params
			};
			return oRequest;
		}

        it('should throw exception on POST if the request object contains invalid properties', function() {
			//arrange
			let aRetentionPeriodsTestData = [{
                                "ENTITY": "VENDOR",
                                "SUBJECT": "*",
                                "VALID_FROM": 20,
                                "VALID_TO": null
                            }, {
                                "ENTITY": "USER",
                                "SUBJECT": "USRN",
                                "VALID_TO": "2021-01-14 08:00:00.0000000"
                            },
                            {
                                "ENTITY": "CUSTOMER",
                                "SUBJECT": "CUSTN",
                                "VALID_FOR": null,
                                "VALID_TO": "2021-01-14 08:00:00.0000000"
                            }];
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.POST);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	

        it('should throw exception on POST if valid_to is not a utctimestamp', function() {
			//arrange
			let aRetentionPeriodsTestData = [
                            {
                                "ENTITY": "CUSTOMER",
                                "SUBJECT": "*",
                                "VALID_TO": "2021-01-14"
                            }];
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.POST);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	

        it('should throw exception on POST if for USER for SUBJECT * is set', function() {
			//arrange
			let aRetentionPeriodsTestData = [{                                
                                "ENTITY": "USER",
                                "SUBJECT": "*",
                                "VALID_FOR": 20
                            }];
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.POST);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	

        it('should throw exception on POST if both valid for and valid to are set', function() {
			//arrange
			let aRetentionPeriodsTestData = [{
                                "ENTITY": "VENDOR",
                                "SUBJECT": "*",
                                "VALID_FOR": 20,
                                "VALID_TO": "2021-01-14 08:00:00.0000000"
                            }];
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.POST);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	

        it('should throw exception on POST if entity is not one of the defined 3: customer, vendor, user', function() {
			//arrange
			let aRetentionPeriodsTestData = [{
                                "ENTITY": "TESTT",
                                "SUBJECT": "*",
                                "VALID_FOR": 20
                            }];
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.POST);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	

        it('should throw exception on POST if the body is an object', function() {
			//arrange
			let aRetentionPeriodsTestData = {
                                "ENTITY": "TESTT",
                                "SUBJECT": "*",
                                "VALID_FOR": 20
                            };
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.POST);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	

        it('should throw exception on POST if the body an empty array', function() {
			//arrange
			let aRetentionPeriodsTestData = [];
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.POST);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	

		it('should throw exception on DELETE if the body is an empty array', function() {
			//arrange
			let aRetentionPeriodsTestData = [];
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.DEL);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	

		it('should throw exception on DELETE if there are other properties beside the mandatory ones', function() {
			//arrange
			let aRetentionPeriodsTestData = [{
                                "ENTITY": "TESTT",
                                "SUBJECT": "*",
                                "VALID_FOR": 20
                            }];
			let exception;
			let oRequestBody = createRequest(aRetentionPeriodsTestData, $.net.http.DEL);
			//act
			try {
				oRetentionPeriodsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
		});	
        	
	}).addTags(["All_Unit_Tests"]);
}