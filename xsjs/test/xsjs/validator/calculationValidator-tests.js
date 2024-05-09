var _ = require("lodash");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var calculationValidatorLibrary = $.import("xs.validator", "calculationValidator");
var CalculationValidator = calculationValidatorLibrary.CalculationValidator;
const Persistency = $.import("xs.db", "persistency").Persistency;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
var sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;
const sStandardPriceStrategy = "PLC_STANDARD";
const CalculationVersionCostingSheetTotals = require("../../../lib/xs/util/constants").CalculationVersionCostingSheetTotals;
if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.calculationValidator-tests', function() {

		var oCalculationValidator;

		var sSessionID = "TestSessionID";
		var oMetadataProviderMock = null;
		var oPersistencyMock = null;
		var BusinessObjectValidatorUtilsMock = null;
		var mValidatedParameters = null;
		var iID = 1234;

		var oExistingMasterdata = {	
			COSTING_SHEETS: [{
				COSTING_SHEET_ID : "CS1"
			}],
			COMPONENT_SPLITS: [{
				COMPONENT_SPLIT_ID: "CS1"
			}],
			CURRENCIES: [{
				CURRENCY_ID: "CUR1"
			}],
			EXCHANGE_RATE_TYPES: [{
				EXCHANGE_RATE_TYPE_ID: sDefaultExchangeRateType
			}],
			ACCOUNTS: [{
				ACCOUNT_ID: "AC1"
			}],
			PRICE_SOURCES: [{
				PRICE_SOURCE_ID: "1"
			}],
			UNIT_OF_MEASURES: [{
				"UOM_ID": "PC"
			}],
            DOCUMENT_STATUSES: [{
                DOCUMENT_STATUS_ID: "#R"
            }],
            DOCUMENT_TYPES: [{
                DOCUMENT_TYPE_ID: "#DR"
            }],
            DESIGN_OFFICES: [{
                DESIGN_OFFICE_ID: "#L1"
            }],
            MATERIAL_TYPES: [{
                MATERIAL_TYPE_ID: "RAW"
            }],
            OVERHEADS: [{
                OVERHEAD_GROUP_ID: "#OG1"
            }],
            VALUATION_CLASSES: [{
                VALUATION_CLASS_ID: "#VC1"
            }],
            MATERIAL_GROUPS: [{
                MATERIAL_GROUP_ID: "#MG1"
            }],
            MATERIAL_PRICE_STRATEGIES:[{
                MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy
            }],
            ACTIVITY_PRICE_STRATEGIES:[{
                ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy
            }]
		};

		beforeEach(function() {
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', [ 'get' ]);

			// since some functions (esp. utilities of the persistency library must be executed, it is only partially mocked)
			oPersistencyMock = new Persistency({});
			spyOn(oPersistencyMock.CalculationVersion, "getExistingNonTemporaryMasterdata");
			oPersistencyMock.CalculationVersion.getExistingNonTemporaryMasterdata.and.returnValue(oExistingMasterdata);
			
			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Item);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEntity", "checkMandatoryProperties");
			// arrange the mock of checkEntity that to return the entity with which it was called; bypasses any validation, but keeps the 
			// contract of the method
			BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(function() {
				var oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
				return oLastCallEntity;
			});
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

			oCalculationValidator = new CalculationValidator(oPersistencyMock, sSessionID, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);

			mValidatedParameters = {
					"action" : "create", 
					"calculate" : true,
					'mode' : 'replace'
			};
		});

		var params = [];
		params.get = function() {
			return undefined;
		};

		function createRequest(oBody, oHTTPMethod) {
			var oRequest = {
					queryPath : "calculation",
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

		describe("tests for non-temporary masterdata", function() {

            var oExpectedErrorCode = MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR;
            var oValidCalculation = {			
                    CALCULATION_ID: 1,
                    CALCULATION__NAME: "test",
                    CONTROLLING_AREA_ID: "1000",
                    CALCULATION_VERSIONS : [{
                        CALCULATION_VERSION_ID : 100,
                        EXCHANGE_RATE_TYPE_ID: oExistingMasterdata.EXCHANGE_RATE_TYPES[0].EXCHANGE_RATE_TYPE_ID,
                        COSTING_SHEET_ID: oExistingMasterdata.COSTING_SHEETS[0].COSTING_SHEET_ID,
                        COMPONENT_SPLIT_ID: oExistingMasterdata.COMPONENT_SPLITS[0].COMPONENT_SPLIT_ID,
                        REPORT_CURRENCY_ID: oExistingMasterdata.CURRENCIES[0].CURRENCY_ID,
                        MATERIAL_PRICE_STRATEGY_ID: oExistingMasterdata.MATERIAL_PRICE_STRATEGIES[0].MATERIAL_PRICE_STRATEGY_ID,
			            ACTIVITY_PRICE_STRATEGY_ID: oExistingMasterdata.ACTIVITY_PRICE_STRATEGIES[0].ACTIVITY_PRICE_STRATEGY_ID,
                        ITEMS : [{
                            ITEM_ID : 100,
                            ACCOUNT_ID: oExistingMasterdata.ACCOUNTS[0].ACCOUNT_ID, 
                            PRICE_SOURCE_ID: oExistingMasterdata.PRICE_SOURCES[0].PRICE_SOURCE_ID, 
                            QUANTITY_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID, 
                            TOTAL_QUANTITY_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID, 
                            PRICE_UNIT_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID, 
                            TRANSACTION_CURRENCY_ID: oExistingMasterdata.CURRENCIES[0].CURRENCY_ID, 
                        }]
                    }]
            };

            it("should validate successfully a valid create calculation request", () => {
                // act
                var oValidatedCalculation = oCalculationValidator.validate(createRequest([oValidCalculation], $.net.http.POST), mValidatedParameters);

                //assert
                expect(oValidatedCalculation).toEqualObject([oValidCalculation]);
            });

            it("should throw GENERAL_VALIDATION_ERROR when more than 1 item is created at the same time with a calculation version", () => {
                //prepare
                let exception = null;
                let oItem = oValidCalculation.CALCULATION_VERSIONS[0].ITEMS[0];
                const oInvalidCalculation = new TestDataUtility(oValidCalculation).build();
                oInvalidCalculation.CALCULATION_VERSIONS[0].ITEMS.push(oItem);
                // act
                try{
                    var oValidatedCalculation = oCalculationValidator.validate(createRequest([oInvalidCalculation], $.net.http.POST), mValidatedParameters);
                } catch(e){
                    exception = e;
                }

                //assert
                const sClientMsg = 'Inital calculation version does not contain an array with 1 entry named ITEMS. Cannot validate.';
                expect(exception.code.code).toEqual('GENERAL_VALIDATION_ERROR');
                expect(exception.developerMessage).toBe(sClientMsg);
            });
            
            it("should throw GENERAL_VALIDATION_ERROR when more than 1 calculation version is created at the same time with a calculation", () => {
                //prepare
                let exception = null;
                let oCalculationVersion = oValidCalculation.CALCULATION_VERSIONS[0];
                const oInvalidCalculation = new TestDataUtility(oValidCalculation).build();
                oInvalidCalculation.CALCULATION_VERSIONS.push(oCalculationVersion);
                // act
                try{
                    var oValidatedCalculation = oCalculationValidator.validate(createRequest([oInvalidCalculation], $.net.http.POST), mValidatedParameters);
                } catch(e){
                    exception = e;
                }

                //assert
                const sClientMsg = 'Calculation does not contain an array with 1 entry named CALCULATION_VERSIONS. Cannot validate.';
                expect(exception.code.code).toEqual('GENERAL_VALIDATION_ERROR');
                expect(exception.developerMessage).toBe(sClientMsg);
            });

            function checkMasterdataDoesNotExistsException(oInvalidCalculation) {
                var exception = null;
                // act
                try {
                    oCalculationValidator.validate(createRequest([oInvalidCalculation], $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(oExpectedErrorCode);
            }

            ["COSTING_SHEET_ID", "COMPONENT_SPLIT_ID", "REPORT_CURRENCY_ID", "EXCHANGE_RATE_TYPE_ID"].forEach(sNonTemporaryMasterdata => {
                it(`should throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if version contains unknown master data reference for ${sNonTemporaryMasterdata}`, () => {
                    // arrange
                    const oInvalidCalculation = new TestDataUtility(oValidCalculation).build();
                    oInvalidCalculation.CALCULATION_VERSIONS[0][sNonTemporaryMasterdata] = "ABC";

                    // act + assert
                    checkMasterdataDoesNotExistsException(oInvalidCalculation);
                });
            });

            ["ACCOUNT_ID", "PRICE_SOURCE_ID", "QUANTITY_UOM_ID", "TOTAL_QUANTITY_UOM_ID",
                "PRICE_UNIT_UOM_ID", "TRANSACTION_CURRENCY_ID"
            ].forEach(sNonTemporaryMasterdata => {
                it(`should throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if root item contains unknown master data reference for ${sNonTemporaryMasterdata}`, () => {
                    // arrange
                    const oInvalidCalculation = new TestDataUtility(oValidCalculation).build();
                    oInvalidCalculation.CALCULATION_VERSIONS[0].ITEMS[0][sNonTemporaryMasterdata] = "ABC";

                    // act + assert
                    checkMasterdataDoesNotExistsException(oInvalidCalculation);
                });
            });

			it("should throw an exception if the calculation contains a reference to non existing exchange rate type", () => {
				// arrange
				var oInvalidCalculation = _.extend({}, oValidCalculation, {
					CALCULATION_VERSIONS : [{
						EXCHANGE_RATE_TYPE_ID : "ABC",
						CALCULATION_VERSION_ID : 100,
						ITEMS : [{
							ITEM_ID : 100
						}]
					}]
				});
				var exception = null;

				// act
				try {
					var result = oCalculationValidator.validate(createRequest([ oInvalidCalculation ],  $.net.http.POST), mValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);
				exception.developerMessage.indexOf("EXCHANGE_RATE_TYPE_ID") !== -1;
			    exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
            });
            
            it("should throw an exception if the calculation version contains a reference to non existing material price strategy", () => {
                // arrange
                const oInvalidCalculation = _.extend({}, oValidCalculation, {
                    CALCULATION_VERSIONS: [{
                        MATERIAL_PRICE_STRATEGY_ID: "ABC",
                        CALCULATION_VERSION_ID: 100,
                        ITEMS: [{
                            ITEM_ID: 100
                        }]
                    }]
                });
                // act
                try {
                    oCalculationValidator.validate(createRequest([oInvalidCalculation], $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    var exception = e;
                }

                // assert
                expect(exception).toBeDefined();
                expect(exception.code).toEqual(oExpectedErrorCode);
                exception.developerMessage.indexOf("MATERIAL_PRICE_STRATEGY_ID") !== -1;
                exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
            });

            it("should throw an exception if the calculation version contains a reference to non existing activity price strategy", () => {
                // arrange
                const oInvalidCalculation = _.extend({}, oValidCalculation, {
                    CALCULATION_VERSIONS: [{
                        ACTIVITY_PRICE_STRATEGY_ID: "ABC",
                        CALCULATION_VERSION_ID: 100,
                        ITEMS: [{
                            ITEM_ID: 100
                        }]
                    }]
                });
                // act
                try {
                    oCalculationValidator.validate(createRequest([oInvalidCalculation], $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    var exception = e;
                }

                // assert
                expect(exception).toBeDefined();
                expect(exception.code).toEqual(oExpectedErrorCode);
                exception.developerMessage.indexOf("ACTIVITY_PRICE_STRATEGY_ID") !== -1;
                exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
            });

            it("should throw an exception if the calculation version with SELECTED_TOTAL_COSTING_SHEET different than null or TOTAL_COST", () => {
                
                // arrange
                const oInvalidCalculation = _.cloneDeep(oValidCalculation);
                oInvalidCalculation.CALCULATION_VERSIONS[0].SELECTED_TOTAL_COSTING_SHEET = CalculationVersionCostingSheetTotals[1];

                // act
                try {
                    var oValidatedCalculation = oCalculationValidator.validate(createRequest([oInvalidCalculation], $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    var exception = e;
                }

                //assert
                expect(exception.code.code).toEqual("GENERAL_VALIDATION_ERROR");
            });

            it("should throw an exception if the calculation version with SELECTED_TOTAL_COMPONENT_SPLIT different than null or TOTAL_COST", () => {
                
                // arrange
                const oInvalidCalculation = _.cloneDeep(oValidCalculation);
                oInvalidCalculation.CALCULATION_VERSIONS[0].SELECTED_TOTAL_COMPONENT_SPLIT = CalculationVersionCostingSheetTotals[1];

                // act
                try {
                    var oValidatedCalculation = oCalculationValidator.validate(createRequest([oInvalidCalculation], $.net.http.POST), mValidatedParameters);
                } catch (e) {
                    var exception = e;
                }

                //assert
                expect(exception.code.code).toEqual("GENERAL_VALIDATION_ERROR");
            });
		});
		
	}).addTags(["All_Unit_Tests"]);
}