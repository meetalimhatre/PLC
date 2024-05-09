const _ = require("lodash");
const BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
const BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
const MessageLibrary = require("../../../lib/xs/util/message");
const variantCalculatorValidatorLibrary = $.import("xs.validator", "variantCalculatorValidator");
const VariantValidator = variantCalculatorValidatorLibrary.VariantCalculatorValidator;
const Persistency = $.import("xs.db", "persistency").Persistency;
const sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

if (jasmine.plcTestRunParameters.mode === "all") {
    describe("xsjs.validator.variantCalculatorValidator-tests", () => {
        let oVariantValidator;
        let oMetadataProviderMock = null;
        let oPersistencyMock = null;
        let BusinessObjectValidatorUtilsMock = null;

        const iIdOfVersionWithVariants = 111;
        const iValidVariantId = 11;

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

        const aValidExistingVariantWithItemsCompressed = [{
            VARIANT_ID: iValidVariantId,
            REPORT_CURRENCY_ID: "EUR",
            VARIANT_NAME: "Variant",
            ITEMS: {
                ITEM_ID: [1, 2, 3, 4, 5],
                QUANTITY_UOM_ID: ["PC", "PC", "PC", "PC", "PC"],
                IS_INCLUDED: [1, 0, 1, 0, 1],
                QUANTITY: [10, 20, 30, 40, 50],
                TOTAL_QUANTITY: [10, 20, 30, 40, 50],
                TOTAL_COST: [100, 200, 300, 400, 500],
            },
        }];

        const mValidatedParameters = {
            calculation_version_id: iIdOfVersionWithVariants,
        };

        function createCalculateVariantRequest(oBody, oHTTPMethod, iVersionId, iVariantId) {
            let sQuery = null;
            if (iVariantId) {
                sQuery = `calculation-versions/${iVersionId || iIdOfVersionWithVariants}/variant-calculator/${iVersionId}`;
            } else {
                sQuery = `calculation-versions/${iVersionId || iIdOfVersionWithVariants}/variant-calculator`;
            }
            const oRequest = {
                queryPath: sQuery,
                method: oHTTPMethod,
                body: {
                    asString() {
                        return JSON.stringify(oBody || null);
                    },
                },
                parameters: [],
            };
            return oRequest;
        }

        describe("POST: validatePostRequest()", () => {
            it("should return a validated variant if the request is valid", () => {
                // act
                const oRequest = createCalculateVariantRequest(aValidExistingVariantWithItemsCompressed, $.net.http.POST);
                const result = oVariantValidator.validate(oRequest, mValidatedParameters);

                // assert
                const oActualVariant = _.omit(aValidExistingVariantWithItemsCompressed[0], "ITEMS");
                expect(result.VARIANT_ITEMS[0].ITEM_ID).toBe(aValidExistingVariantWithItemsCompressed[0].ITEMS.ITEM_ID[0]);
                expect(result.VARIANT_ITEMS[0].QUANTITY_UOM_ID).toBe(aValidExistingVariantWithItemsCompressed[0].ITEMS.QUANTITY_UOM_ID[0]);
                expect(result.VARIANT_ITEMS[0].IS_INCLUDED).toBe(aValidExistingVariantWithItemsCompressed[0].ITEMS.IS_INCLUDED[0]);
                expect(result.VARIANT_ITEMS[0].QUANTITY).toBe(aValidExistingVariantWithItemsCompressed[0].ITEMS.QUANTITY[0]);
                expect(result.VARIANT_ITEMS[0].TOTAL_COST).toBe(aValidExistingVariantWithItemsCompressed[0].ITEMS.TOTAL_COST[0]);
                expect(result.VARIANTS[0]).toMatchData(oActualVariant, ["VARIANT_ID", "REPORT_CURRENCY_ID", "VARIANT_NAME"]);
            });

            it("should return a GENERAL_VALIDATION_ERROR if one of the variants requested to calculate doesn't contain the ITEMS", () => {
                // arrange
                const aVariantsToCalculate = [];
                aVariantsToCalculate.push(oValidExistingVariant);
                aVariantsToCalculate.push(oValidExistingVariantWithItem);
                let exception = null;

                // act
                try {
                    oVariantValidator.validate(createCalculateVariantRequest(aVariantsToCalculate, $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
            it("should return a GENERAL_VALIDATION_ERROR if variant items attributes don't have the same length", () => {
                // arrange
                const aItemsInvalid = new TestDataUtility(aValidExistingVariantWithItemsCompressed).build();
                aItemsInvalid[0].ITEMS.ITEM_ID.pop();
                let exception = null;

                // act
                try {
                    oVariantValidator.validate(createCalculateVariantRequest(aItemsInvalid, $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
            it("should return a GENERAL_VALIDATION_ERROR if the variant items requested to be calculated don't have the correct structure", () => {
                // arrange
                let exception = null;
                const aItemsInvalid = [new TestDataUtility(oValidExistingVariant).build()];
                aItemsInvalid[0].ITEMS = [{}];

                // act
                try {
                    oVariantValidator.validate(createCalculateVariantRequest(aItemsInvalid, $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
            it("should return a GENERAL_VALIDATION_ERROR if the variant items requested to be calculated are not compressed", () => {
                // arrange
                const oItemNotCompressed = {
                    ITEM_ID: 1,
                    TOTAL_COST: 200,
                };
                let exception = null;
                const aItemsInvalid = [new TestDataUtility(oValidExistingVariant).build()];
                aItemsInvalid[0].ITEMS = oItemNotCompressed;

                // act
                try {
                    oVariantValidator.validate(createCalculateVariantRequest(aItemsInvalid, $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
            it("should return a GENERAL_VALIDATION_ERROR if variant items request body contains the VARIANT_ID field", () => {
                // arrange
                const aItemsInvalid = new TestDataUtility(aValidExistingVariantWithItemsCompressed).build();
                aItemsInvalid[0].ITEMS.VARIANT_ID = [1, 2, 3, 4, 5];
                let exception = null;

                // act
                try {
                    oVariantValidator.validate(createCalculateVariantRequest(aItemsInvalid, $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });

            it("should return a GENERAL_VALIDATION_ERROR if the variant needed to be calculated are not into an array", () => {
                // arrange
                let exception = null;
                // act
                try {
                    oVariantValidator.validate(createCalculateVariantRequest(oValidExistingVariantWithItem, $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
        });
        describe("PUT: validatePutRequest()", () => {
            it("should return a empty body if the request is valid", () => {
                // arrange
                const oReq = createCalculateVariantRequest(_.clone(oValidExistingVariant), $.net.http.PUT);
                delete oReq.body;
                let exception = null;
                // act
                try {
                    oVariantValidator.validate(oReq, mValidatedParameters);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception).toBe(null);
            });
            it("should return a GENERAL_VALIDATION_ERROR if the request has a body", () => {
                // arrange
                const oReq = createCalculateVariantRequest(_.clone(oValidExistingVariant), $.net.http.PUT);
                let exception = null;
                // act
                try {
                    oVariantValidator.validate(oReq, mValidatedParameters);
                } catch (e) {
                    exception = e;
                } finally {
                    // assert
                    expect(exception).not.toBe(null);
                    expect(exception.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
                }
            });
        });
    }).addTags(["All_Unit_Tests"]);
}
