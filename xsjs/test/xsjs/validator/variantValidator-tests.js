const _ = require("lodash");
const BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
const BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
const MessageLibrary = require("../../../lib/xs/util/message");
const variantValidatorLibrary = $.import("xs.validator", "variantValidator");
const VariantValidator = variantValidatorLibrary.VariantValidator;
const Persistency = $.import("xs.db", "persistency").Persistency;
const sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;

if (jasmine.plcTestRunParameters.mode === "all") {
    describe("xsjs.validator.variantValidator-tests", () => {
        let oVariantValidator;
        let oMetadataProviderMock = null;
        let oPersistencyMock = null;
        let BusinessObjectValidatorUtilsMock = null;

        const iIdOfVersionWithVariants = 111;
        const iValidVariantId = 11;
        const mValidatedParameters = {
            calculation_version_id: iIdOfVersionWithVariants,
            variant_id: iValidVariantId,
        };
        const mValidatedParametersUpdateOrder = {
            calculation_version_id: iIdOfVersionWithVariants,
        };

        const oExistingMasterdata = {
            CURRENCIES: [{
                CURRENCY_ID: "EUR",
            }],
            EXCHANGE_RATE_TYPES: [{
                EXCHANGE_RATE_TYPE_ID: sDefaultExchangeRateType,
            }],
            UNIT_OF_MEASURES: [{
                UOM_ID: "PC",
            }],
        };

        beforeEach(() => {
            oMetadataProviderMock = jasmine.createSpyObj("metadataProvider", ["get"]);

            oPersistencyMock = new Persistency({});
            spyOn(oPersistencyMock.Variant, "getExistingNonTemporaryMasterdata");
            oPersistencyMock.Variant.getExistingNonTemporaryMasterdata.and.returnValue(oExistingMasterdata);
            BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Variant);
            spyOn(BusinessObjectValidatorUtilsMock, "checkEntity");
            BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(() => {
                const oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
                return oLastCallEntity;
            });
            spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

            oVariantValidator = new VariantValidator(oPersistencyMock, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);
        });

        const oValidExistingVariantWithItem = {
            VARIANT_ID: iValidVariantId,
            CALCULATION_VERSION_ID: iIdOfVersionWithVariants,
            REPORT_CURRENCY_ID: "EUR",
            VARIANT_NAME: "Variant",
            ITEMS: [{
                VARIANT_ID: iValidVariantId,
                ITEM_ID: 3998,
                QUANTITY_UOM_ID: "PC",
            }],
        };

        const oValidExistingVariant = {
            VARIANT_ID: 11,
            CALCULATION_VERSION_ID: iIdOfVersionWithVariants,
            REPORT_CURRENCY_ID: "EUR",
            VARIANT_NAME: "Variant",
        };

        function createRequest(oBody, oHTTPMethod, bUpdateOrder, iVersionId, iVariantId) {
            let sQuery;
            if (bUpdateOrder) {
                sQuery = `calculation-versions/${iVersionId || oBody.CALCULATION_VERSION_ID}/variants`;
            } else {
                sQuery = `calculation-versions/${iVersionId || oBody.CALCULATION_VERSION_ID}/variants/${iVariantId || oBody.VARIANT_ID}`;
            }
            const oRequest = {
                queryPath: sQuery,
                method: oHTTPMethod,
                body: {
                    asString() {
                        return JSON.stringify(oBody);
                    },
                },
                parameters: [],
            };
            return oRequest;
        }

        describe("PATCH: validatePatchRequest()", () => {
            it("should return a validated variant if the request is valid - variant header", () => {
                // arrange
                const oReq = _.clone(oValidExistingVariant);

                // act
                const result = oVariantValidator.validate(createRequest(oReq, $.net.http.PATCH, false), mValidatedParameters);

                // assert
                expect(result).toEqualObject(oReq);
            });

            it("should return a validated variant if the request is valid and has the optional CHANGES_ACCEPTED - variant header", () => {
                // arrange
                const oReq = _.clone(oValidExistingVariant);
                oReq.CHANGES_ACCEPTED = 1;

                // act
                const result = oVariantValidator.validate(createRequest(oReq, $.net.http.PATCH, false), mValidatedParameters);

                // assert
                expect(result).toEqualObject(oReq);
            });

            it("should return a validated variant if the request is valid - variant header and items ", () => {
                // arrange
                const oReq = _.clone(oValidExistingVariantWithItem);

                // act
                const result = oVariantValidator.validate(createRequest(oReq, $.net.http.PATCH, false), mValidatedParameters);

                // assert
                expect(result).toEqualObject(oReq);
            });

            it("should return a validated variant id if the request is valid for update variants order", () => {
                // arrange
                const aVariantId = [{ VARIANT_ID: iValidVariantId, LAST_MODIFIED_ON: new Date().toJSON() }];

                // act
                const result = oVariantValidator.validate(createRequest(aVariantId, $.net.http.PATCH, true), mValidatedParametersUpdateOrder);

                // assert
                expect(result[0].VARIANT_ID).toBe(aVariantId[0].VARIANT_ID);
                expect(result[0].LAST_MODIFIED_ON.toJSON()).toBe(aVariantId[0].LAST_MODIFIED_ON);
            });

            it("should not validate request for update order if VARIANT_ID is missing", () => {
                // arrange
                const aInvalidRequest = [{ INVALID_FIELD: iValidVariantId, LAST_MODIFIED_ON: new Date().toJSON() }];

                // act
                try {
                    oVariantValidator.validate(createRequest(aInvalidRequest, $.net.http.PATCH, true), mValidatedParametersUpdateOrder);
                } catch (e) {
                    // assert
                    expect(e.code.code).toBe("GENERAL_VALIDATION_ERROR");
                }
            });

            it("should not validate request for update order if LAST_MODIFIED_ON is missing", () => {
                // arrange
                const aInvalidRequest = [{ VARIANT_ID: iValidVariantId }];

                // act
                try {
                    oVariantValidator.validate(createRequest(aInvalidRequest, $.net.http.PATCH, true), mValidatedParametersUpdateOrder);
                } catch (e) {
                    // assert
                    expect(e.code.code).toBe("GENERAL_VALIDATION_ERROR");
                }
            });

            it("should not validate request for update order if there are additional fields on the request", () => {
                // arrange
                const aInvalidRequest = [{ VARIANT_ID: iValidVariantId, INVALID_FIELD: "ABC", LAST_MODIFIED_ON: new Date().toJSON() }];

                // act
                try {
                    oVariantValidator.validate(createRequest(aInvalidRequest, $.net.http.PATCH, true), mValidatedParametersUpdateOrder);
                } catch (e) {
                    // assert
                    expect(e.code.code).toBe("GENERAL_VALIDATION_ERROR");
                }
            });
        });

        describe("POST: validatePostRequest()", () => {
            it("should return a validated variant if the request is valid", () => {
                // arrange
                const oReq = _.clone(oValidExistingVariantWithItem);

                // act
                const result = oVariantValidator.validate(createRequest(oReq, $.net.http.POST));

                // assert
                expect(result).toEqualObject(oReq);
            });
            it("should return a GENERAL_VALIDATION_ERROR if the request doesn't contain the ITEMS field", () => {
                // arrange
                const oReq = _.clone(oValidExistingVariant);
                let exception = null;

                // act
                try {
                    oVariantValidator.validate(createRequest(oReq, $.net.http.POST));
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
            it("should return a GENERAL_VALIDATION_ERROR if the request contains the field IS_SELECTED with the value null", () => {
                // arrange
                const oReq = _.clone(oValidExistingVariantWithItem);
                oReq.IS_SELECTED = null;
                let exception = null;

                // act
                try {
                    oVariantValidator.validate(createRequest(oReq, $.net.http.POST));
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
        });

        describe("DELETE: validateDeleteRequest()", () => {
            it("should return a validated variant if the request is valid", () => {
                // arrange
                const oReq = createRequest(_.clone(oValidExistingVariant), $.net.http.DEL);
                delete oReq.body;
                let exception = null;
                // act
                try {
                    oVariantValidator.validate(oReq);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception).toBe(null);
            });
            it("should return a GENERAL_VALIDATION_ERROR if the request has a body", () => {
                // arrange
                const oReq = createRequest(_.clone(oValidExistingVariant), $.net.http.DEL);
                let exception = null;
                // act
                try {
                    oVariantValidator.validate(oReq);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception).not.toBe(null);
                expect(exception.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
        });

        describe("tests for non-temporary masterdata", () => {
            const oExpectedErrorCode = MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR;

            it("should return validated variant if it contains only references to existing non-temporary masterdata", () => {
                // arrange

                const oValidVariant = {
                    VARIANT_ID: 11,
                    CALCULATION_VERSION_ID: iIdOfVersionWithVariants,
                    REPORT_CURRENCY_ID: "EUR",
                    VARIANT_NAME: "Variant",
                    EXCHANGE_RATE_TYPE_ID: "STANDARD",
                };

                // act
                const result = oVariantValidator.validate(createRequest(oValidVariant, $.net.http.PATCH, false), mValidatedParameters);

                // assert
                expect(result).toEqualObject(oValidVariant);
            });


            it("should raise GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if variant references a non-existing REPORT_CURRENCY", () => {
                // arrange
                const oInvalidVariant = {
                    VARIANT_ID: 11,
                    CALCULATION_VERSION_ID: iIdOfVersionWithVariants,
                    REPORT_CURRENCY_ID: "ABC",
                    VARIANT_NAME: "Variant",
                    EXCHANGE_RATE_TYPE_ID: "STANDARD",
                };
                let exception;

                // act
                try {
                    oVariantValidator.validate(createRequest(oInvalidVariant, $.net.http.PATCH, false), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(oExpectedErrorCode);
                expect(exception.developerMessage.indexOf("REPORT_CURRENCY_ID")).not.toBe(-1);
                expect(exception.developerMessage.indexOf("Temporary values are not allowed")).not.toBe(-1);
            });

            it("should raise GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if variant references a non-existing EXCHANGE_RATE_TYPE", () => {
                // arrange
                const oInvalidVariant = {
                    VARIANT_ID: 11,
                    CALCULATION_VERSION_ID: iIdOfVersionWithVariants,
                    REPORT_CURRENCY_ID: "EUR",
                    VARIANT_NAME: "Variant",
                    EXCHANGE_RATE_TYPE_ID: "ABC",
                };
                let exception;

                // act
                try {
                    oVariantValidator.validate(createRequest(oInvalidVariant, $.net.http.PATCH, false), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(oExpectedErrorCode);
                expect(exception.developerMessage.indexOf("EXCHANGE_RATE_TYPE_ID")).not.toBe(-1);
                expect(exception.developerMessage.indexOf("Temporary values are not allowed")).not.toBe(-1);
            });

            it("should raise GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if variant item references a non-existing QUANTITY_UOM", () => {
                // arrange
                const oInvalidVariant = {
                    VARIANT_ID: 11,
                    CALCULATION_VERSION_ID: iIdOfVersionWithVariants,
                    REPORT_CURRENCY_ID: "EUR",
                    VARIANT_NAME: "Variant",
                    EXCHANGE_RATE_TYPE_ID: "STANDARD",
                    ITEMS: [{
                        VARIANT_ID: 1,
                        ITEM_ID: 3998,
                        QUANTITY_UOM_ID: "W",
                    }],
                };
                let exception;

                // act
                try {
                    oVariantValidator.validate(createRequest(oInvalidVariant, $.net.http.PATCH, false), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(oExpectedErrorCode);
                expect(exception.developerMessage.indexOf("QUANTITY_UOM_ID")).not.toBe(-1);
                expect(exception.developerMessage.indexOf("Temporary values are not allowed")).not.toBe(-1);
            });

            it("should raise GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR when using a non-existing REPORT_CURRENCY_ID", () => {
                // arrange
                const oInvalidVariant = {
                    VARIANT_ID: 11,
                    CALCULATION_VERSION_ID: iIdOfVersionWithVariants,
                    REPORT_CURRENCY_ID: "INV",
                    VARIANT_NAME: "Variant",
                    EXCHANGE_RATE_TYPE_ID: "STANDARD",
                };
                let exception;

                // act
                try {
                    oVariantValidator.validate(createRequest(oInvalidVariant, $.net.http.PATCH, false), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(oExpectedErrorCode);
                expect(exception.developerMessage.indexOf("REPORT_CURRENCY_ID")).not.toBe(-1);
                expect(exception.developerMessage.indexOf("Temporary values are not allowed")).not.toBe(-1);
            });
        });
    }).addTags(["All_Unit_Tests"]);
}
