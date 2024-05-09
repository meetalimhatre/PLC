const _ = require("lodash");
const BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
const BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
const MessageLibrary = require("../../../lib/xs/util/message");
const variantGeneratorValidatorLibrary = $.import("xs.validator", "variantGeneratorValidator");
const VariantValidator = variantGeneratorValidatorLibrary.VariantGeneratorValidator;
const Persistency = $.import("xs.db", "persistency").Persistency;
const testData = require("../../testdata/testdata").data;

if (jasmine.plcTestRunParameters.mode === "all") {
    describe("xsjs.validator.variantGeneratorValidator-tests", () => {
        let oVariantValidator;
        let oMetadataProviderMock = null;
        let oPersistencyMock = null;
        let BusinessObjectValidatorUtilsMock = null;
        const iVariantId = testData.iValidVariantId;
        const iCalculationId = testData.iCalculationId;
        const iCalculationVersionId = testData.iCalculationVersionId;
        const sVersionName = "S-Engine Petrol";

        beforeEach(() => {
            oMetadataProviderMock = jasmine.createSpyObj("metadataProvider", ["get"]);

            oPersistencyMock = new Persistency({});
            BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.VariantGenerator);
            spyOn(BusinessObjectValidatorUtilsMock, "checkEntity");
            BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(() => {
                const oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
                return oLastCallEntity;
            });
            spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

            oVariantValidator = new VariantValidator(oPersistencyMock, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);
        });


        function prepareGenerateRequest(nVersionId, oHTTPMethod, nVariantId, nTargetCalculationId, sCalculationVersionName, bInvalidField) {
            const oRequest = {
                queryPath: `calculation-versions/${nVersionId}/variant-generator/${nVariantId}`,
                method: oHTTPMethod,
                body: {},
            };

            const oBody = {};
            if (nTargetCalculationId) {
                oBody.TARGET_CALCULATION_ID = nTargetCalculationId;
            }
            if (sCalculationVersionName) {
                oBody.CALCULATION_VERSION_NAME = sCalculationVersionName;
            }
            if (bInvalidField) {
                oBody.INVALID_FIELD = "Invalid field";
            }
            oRequest.body = {
                asString() {
                    return JSON.stringify(oBody);
                },
            };

            return oRequest;
        }


        describe("POST: validatePostRequest()", () => {
            it("should return a validated request empty body if the request is valid", () => {
                // act
                const oRequest = prepareGenerateRequest(iCalculationVersionId, $.net.http.POST, iVariantId);
                const oResult = oVariantValidator.validate(oRequest);

                // assert
                expect(oResult).toEqual({});
            });
            it("should return a validated request with the body containing the target calculation id if the request is valid", () => {
                // act
                const oRequest = prepareGenerateRequest(iCalculationVersionId, $.net.http.POST, iVariantId, iCalculationId);
                const oResult = oVariantValidator.validate(oRequest);

                // assert
                expect(oResult).toEqual({
                    TARGET_CALCULATION_ID: iCalculationId,
                });
            });
            it("should return a validated request with the body containing the calculation version name if the request is valid", () => {
                // act
                const oRequest = prepareGenerateRequest(iCalculationVersionId, $.net.http.POST, iVariantId, null, sVersionName);
                const oResult = oVariantValidator.validate(oRequest);

                // assert
                expect(oResult).toEqual({
                    CALCULATION_VERSION_NAME: sVersionName,
                });
            });
            it("should return a validated request with the body containing both the version name and target id if the request is valid", () => {
                // act
                const oRequest = prepareGenerateRequest(iCalculationVersionId, $.net.http.POST, iVariantId, iCalculationId, sVersionName);
                const oResult = oVariantValidator.validate(oRequest);

                // assert
                expect(oResult).toEqual({
                    TARGET_CALCULATION_ID: iCalculationId,
                    CALCULATION_VERSION_NAME: sVersionName,
                });
            });
            it("should return a GENERAL_VALIDATION_ERROR if the body contains invalid fields", () => {
                // arrange
                const oRequest = prepareGenerateRequest(iCalculationVersionId, $.net.http.POST, iVariantId, iCalculationId, sVersionName, true);
                let exception = null;

                // act
                try {
                    oVariantValidator.validate(oRequest);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
            it("should return a GENERAL_VALIDATION_ERROR if the target calculation id is a string", () => {
                // arrange
                const oRequest = prepareGenerateRequest(iCalculationVersionId, $.net.http.POST, iVariantId, "TargetCalculation", sVersionName, true);
                let exception = null;

                // act
                try {
                    oVariantValidator.validate(oRequest);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
        });
    }).addTags(["All_Unit_Tests"]);
}
