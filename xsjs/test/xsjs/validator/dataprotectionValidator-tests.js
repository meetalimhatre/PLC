const DataProtectionValidator = $.import("xs.validator", "dataProtectionValidator").DataProtectionValidator;
const MessageLibrary = require("../../../lib/xs/util/message");
const BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
const BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
const oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
const _ = require("lodash");

describe("xsjs.impl.dataprotectionValidator-tests", () => {
    let oDataProtectionValidator;
    let businessObjectValidatorUtils;
    beforeEach(() => {
        businessObjectValidatorUtils = new BusinessObjectValidatorUtils(BusinessObjectTypes.DataProtection);
        oDataProtectionValidator = new DataProtectionValidator(businessObjectValidatorUtils);
    });
    describe("DELETE requests", () => {
        function RequestBody() {
            this.setUserId = (sUserIdBodyValue) => {
                this.USER_ID = sUserIdBodyValue;
                return this;
            };
            this.setCustomerId = (sCustomerIdBodyValue) => {
                this.CUSTOMER_ID = sCustomerIdBodyValue;
                return this;
            };
            this.setVendorId = (sVendorIdBodyValue) => {
                this.VENDOR_ID = sVendorIdBodyValue;
                return this;
            };
            this.setProjectId = (sProjectIdBodyValue) => {
                this.PROJECT_ID = sProjectIdBodyValue;
                return this;
            };
            this.setInvalidField = () => {
                this.INVALID_FIELD = "ERROR";
                return this;
            };
            this.asString = () => JSON.stringify(this);
        }
        RequestBody.prototype = Object.create(RequestBody.prototype);
        RequestBody.prototype.constructor = RequestBody;

        function prepareRequest(oRequestBody) {
            const oRequest = {
                queryPath: "data-protection",
                method: $.net.http.DEL,
                body: oRequestBody,
            };
            return oRequest;
        }

        function invokeAndExpectError(oRequest) {
            let oExpectedException;
            try {
                oDataProtectionValidator.validate(oRequest);
            } catch (error) {
                oExpectedException = error;
            }
            // assert
            expect(oExpectedException).toBeDefined();
            expect(oExpectedException.code).toEqual(oExpectedErrorCode);
        }

        describe("Valid Requests", () => {
            it("should return the validated request if it contains a valid user entry", () => {
                // arrange
                let oExpectedException;
                const oRequestBody = new RequestBody().setUserId("TestUser");
                const oRequest = prepareRequest(oRequestBody);
                let oResult;


                // act
                try {
                    oResult = oDataProtectionValidator.validate(oRequest);
                } catch (error) {
                    oExpectedException = error;
                }
                // assert
                expect(oExpectedException).toBeUndefined();
                expect(oResult).toBeDefined();
            });

            it("should return the validated request if it contains a valid customer entry", () => {
                // arrange
                let oExpectedException;
                const oRequestBody = new RequestBody().setCustomerId("someCustomer");
                const oRequest = prepareRequest(oRequestBody);
                let oResult;


                // act
                try {
                    oResult = oDataProtectionValidator.validate(oRequest);
                } catch (error) {
                    oExpectedException = error;
                }
                // assert
                expect(oExpectedException).toBeUndefined();
                expect(oResult).toBeDefined();
            });
        });
        describe("Invalid Requests", () => {
            it("should throw an exception if the http request method is invalid (not http DELETE)", () => {
                // arrange
                const oRequest = prepareRequest();
                oRequest.method = $.net.http.GET;

                // act
                try {
                    oDataProtectionValidator.validate(oRequest);
                } catch (error) {
                    oExpectedException = error;
                }
                // assert
                expect(oExpectedException).toBeDefined();
                expect(oExpectedException.code).toEqual(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION);
            });

            it("should throw an exception if the request body does not contain a valid JSON format", () => {
                // arrange
                const oRequestBody = new RequestBody();
                oRequestBody.asString = () => "{([ invalid json }}";
                const oRequest = prepareRequest(oRequestBody);

                // act + assert
                invokeAndExpectError(oRequest);
            });

            it("should throw an exception if the request body is empty", () => {
                // arrange
                const oRequestBody = new RequestBody();
                const oRequest = prepareRequest(oRequestBody);

                // act + assert
                invokeAndExpectError(oRequest);
            });

            it("should throw an exception if the request body contains an invalid entry", () => {
                // arrange
                const oRequestBody = new RequestBody();
                oRequestBody.INVALID_FIELD = "ValueOfInvalidField";
                const oRequest = prepareRequest(oRequestBody);

                // act + assert
                invokeAndExpectError(oRequest);
            });

            it("should throw an exception if the request body contains an invalid USER_ID entry having an invalid property", () => {
                // arrange
                const oRequestBody = new RequestBody().setUserId("UserId");
                oRequestBody.INVALID_FIELD = "ValueOfInvalidField";
                const oRequest = prepareRequest(oRequestBody);

                // act + assert
                invokeAndExpectError(oRequest);
            });

            it("should throw an exception if the request body doesn't contain USER_ID", () => {
                // arrange
                const oRequestBody = new RequestBody().setUserId("UserId");
                delete oRequestBody.USER_ID;
                const oRequest = prepareRequest(oRequestBody);

                // act + assert
                invokeAndExpectError(oRequest);
            });

            it("should throw an exception if the request body contains an empty USER object", () => {
                // arrange
                const oRequestBody = new RequestBody().setUserId("UserId");
                oRequestBody.USER = {};
                const oRequest = prepareRequest(oRequestBody);

                // act + assert
                invokeAndExpectError(oRequest);
            });

            it("should throw an exception if the request USER property is not an object", () => {
                // arrange
                const oRequestBody = new RequestBody().setUserId("UserId");
                oRequestBody.USER = {};
                const oRequest = prepareRequest(oRequestBody);

                // act + assert
                invokeAndExpectError(oRequest);
            });
        });
    });

    describe("POST requests", () => {
        const oValidEntity = {
            ENTITY: "Tester1",
            ENTITY_TYPE: "CUSTOMER",
        };
        function createRequest(oBody, sHTTPMethod) {
            const oRequest = {
                queryPath: "data-protection",
                method: sHTTPMethod,
                body: {
                    asString() {
                        return JSON.stringify(oBody);
                    },
                },
                parameters: [],
            };
            return oRequest;
        }
        it("should return a validated entity if the request is valid", () => {
            // arrange
            const oReqEntity = _.clone(oValidEntity);

            // act
            const result = oDataProtectionValidator.validate(createRequest(oReqEntity, $.net.http.POST));

            // assert
            expect(result).toEqualObject(oReqEntity);
        });
        it("should not validate request if the body doesn't contain ENTITY_TYPE", () => {
            // arrange
            const oReqEntity = { ENTITY: "Tester1" };
            let exception = null;

            // act
            try {
                oDataProtectionValidator.validate(createRequest(oReqEntity, $.net.http.POST));
            } catch (e) {
                exception = e;
            }

            // assert
            expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
        });
        it("should not validate request if the ENTITY_TYPE is not CUSTOMER, VENDOR or USER", () => {
            // arrange
            const oReqEntity = _.clone(oValidEntity);
            oReqEntity.ENTITY_TYPE = "MATERIAL";
            let exception = null;

            // act
            try {
                oDataProtectionValidator.validate(createRequest(oReqEntity, $.net.http.POST));
            } catch (e) {
                exception = e;
            }

            // assert
            expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
        });
        it("should not validate request if the body is empty", () => {
            // arrange
            const oReqEntity = {};
            let exception = null;

            // act
            try {
                oDataProtectionValidator.validate(createRequest(oReqEntity, $.net.http.POST));
            } catch (e) {
                exception = e;
            }

            // assert
            expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
        });
        it("should not validate request if the body contains anything except entity_id", () => {
            // arrange
            const oReqEntity = _.clone(oValidEntity);
            oReqEntity.INVALID_FIELD = "INVALID_VALUE";
            let exception = null;

            // act
            try {
                oDataProtectionValidator.validate(createRequest(oReqEntity, $.net.http.POST));
            } catch (e) {
                exception = e;
            }

            // assert
            expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
        });
        it("should not validate request if the body contains the field entity with the value null", () => {
            // arrange
            const oReqEntity = _.clone(oValidEntity);
            oReqEntity.ENTITY = null;
            let exception = null;

            // act
            try {
                oDataProtectionValidator.validate(createRequest(oReqEntity, $.net.http.POST));
            } catch (e) {
                exception = e;
            }

            // assert
            expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
        });
    });
}).addTags(["All_Unit_Tests"]);

