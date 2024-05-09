var _ = require("lodash");
var UrlValidator = require("../../../lib/xs/validator/urlValidator").UrlValidator;
var UrlParameterInfo = require("../../../lib/xs/validator/urlParameterInfo").UrlParameterInfo;

var MessageLibrary = require("../../../lib/xs/util/message");
var PlcException = MessageLibrary.PlcException;
var Code = MessageLibrary.Code;

if (jasmine.plcTestRunParameters.mode === 'all') {
    describe("xsjs.validator.urlValidator-integrationtests", function() {

        const sMethod = "GET";
        const iMethod = 1; // $.net.http.GET == 1 
        beforeEach(function() {});

        function createRequestMockWithParameters(mParameters, sQueryPath) {
            // create a fake TupelList because $.web.TupelList cannot be instanciated! :(
            // use an array basis and extend with methods of the TupelList (get/set)
            var oTupelListFake = [];
            oTupelListFake.get = function(name) {
                for (var i = 0; i < oTupelListFake.length; i++) {
                    if (oTupelListFake[i].name === name) {
                        return oTupelListFake[i].value;
                    }
                }
                return undefined;
            };
            oTupelListFake.set = function(name, value) {
                oTupelListFake.push({
                    "name": name,
                    "value": value
                });
            };

            _.each(mParameters, function(vParaValue, sParaName) {
                if (!_.isArray(vParaValue)) {
                    vParaValue = [vParaValue]
                }
                vParaValue.forEach(vValue => {
                    oTupelListFake.set(sParaName, vValue);
                });
            });

            // return request object mock
            var oRequestMock = {
                method: iMethod,
                parameters: oTupelListFake,
                queryPath: sQueryPath
            };
            return oRequestMock;
        }

        function prepareTest(sQueryPath, sDefinitionPath, mRequestParameters, aValidParameters) {
            const mResourceDefintions = {};
            mResourceDefintions[sDefinitionPath] = {};
            mResourceDefintions[sDefinitionPath].pathVariables = aValidParameters;
            mResourceDefintions[sDefinitionPath][sMethod] = {
                parameters: aValidParameters
            };

            const oRequestMock = createRequestMockWithParameters(mRequestParameters, sQueryPath);
            return () => {
                return new UrlValidator(mResourceDefintions).validateUrl(oRequestMock, sDefinitionPath);
            }
        }

        function expectValidationException(fExecuteValidation) {
            let exception;

            // act
            try {
                fExecuteValidation();
            } catch (e) {
                exception = e;
            }

            // assert
            expect(exception instanceof PlcException).toBe(true);
            expect(exception.code).toEqual(Code.GENERAL_VALIDATION_ERROR);
        }

        function runDefaultTestSuite(oConfig) {

            it("should return validated value if parameter value of correct type is provided", () => {
                // arrange
                const fExecuteValidation = prepareTest(oConfig.queryPath, oConfig.definitionPath, oConfig.requestParameters, [new UrlParameterInfo(oConfig.validParameterName,
                    "String")]);

                // act
                var mValidatedParameters = fExecuteValidation();

                // assert
                expect(mValidatedParameters[oConfig.validParameterName]).toEqual(oConfig.expectedValue);
            });

            it("should return validated parameter value if the parameter value is listed as allowed value", () => {
                const aValidValueDefinitions = [{
                    first: oConfig.expectedValue,
                    second: "something_else"
                }, [oConfig.expectedValue, "something_else"]];
                aValidValueDefinitions.forEach(vValueDefinition => {
                    jasmine.log(`Checking value definiton ${JSON.stringify(vValueDefinition)}`);
                    // arrange
                    var sParameterName = oConfig.validParameterName;
                    const fExecuteValidation = prepareTest(oConfig.queryPath, oConfig.definitionPath, oConfig.requestParameters, [new UrlParameterInfo(
                        oConfig.validParameterName, "String", true, vValueDefinition)]);

                    // act
                    var mValidatedParameters = fExecuteValidation();

                    // assert
                    expect(mValidatedParameters[sParameterName]).toBe(oConfig.expectedValue);
                });
            });

            it("should throw validation exception if parameter value is of wrong type", () => {
                const fExecuteValidation = prepareTest(oConfig.queryPath, oConfig.definitionPath, oConfig.requestParameters, [new UrlParameterInfo(oConfig.validParameterName,
                    "Integer")]);
                expectValidationException(fExecuteValidation);
            });


            it("should throw validation exception if mandatory parameter is missing", () => {
                // arrange
                const fExecuteValidation = prepareTest(oConfig.queryPath, oConfig.definitionPath, {}, [new UrlParameterInfo(oConfig.validParameterName, "Integer",
                    true)]);
                expectValidationException(fExecuteValidation);
            });

            it("should throw validation exception if parameter value if parameter value is not listed as allowed value", () => {
                const aValidValueDefinitions = [{
                    all: "all",
                    activated: "activated"
                }, ["all", "activated"]];
                aValidValueDefinitions.forEach(vValueDefinition => {
                    jasmine.log(`Checking value definiton ${JSON.stringify(vValueDefinition)}`);
                    // arrange
                    var sParameterName = "parameterName";
                    var sParameterValue = "activated";
                    const fExecuteValidation = prepareTest(oConfig.queryPath, oConfig.definitionPath, oConfig.requestParameters, [new UrlParameterInfo(
                        sParameterName, "String", true, vValueDefinition)]);
                    expectValidationException(fExecuteValidation);
                });
            });

            it("should throw validation exception if no defintion for the resouce defintion path can be found", () => {
                const mResourceDefintions = {
                    "INVALID_PATH": {}
                };
                const mRequestParameters = {
                    "sParameterName": "sValue"
                };
                const oRequestMock = createRequestMockWithParameters(mRequestParameters);
                expectValidationException(() => {
                    return new UrlValidator(mResourceDefintions).validateUrl(oRequestMock, "sResourcePath");
                })
            })
        }

        describe("query parameter tests", () => {

            const sQueryPath = "resource";
            runDefaultTestSuite({
                definitionPath: sQueryPath,
                queryPath: sQueryPath,
                requestParameters: {
                    "sParameterName": "sValue"
                },
                validParameterName: "sParameterName",
                expectedValue: "sValue"
            });

            it("should throw validation exception if parameter is unknown", () => {
                var mRequestParameters = {
                    "sParameterName": "sValue"
                };
                const fExecuteValidation = prepareTest(sQueryPath, sQueryPath, mRequestParameters, []);
                expectValidationException(fExecuteValidation);
            });

            it("should throw validation exception if request constains the parameter twice", () => {
                // arrange
                const mRequestParameters = {
                    "sParameterName": ["firstValue", "secondValue"]
                };
                const fExecuteValidation = prepareTest(sQueryPath, sQueryPath, mRequestParameters, [new UrlParameterInfo("sParameterName", "String")]);
                expectValidationException(fExecuteValidation);
            });
        });

        describe("path variable tests", () => {
            runDefaultTestSuite({
                definitionPath: "resource/{sPathVariable}",
                queryPath: "resource/value",
                requestParameters: {},
                validParameterName: "sPathVariable",
                expectedValue: "value"
            });
        });
    }).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}