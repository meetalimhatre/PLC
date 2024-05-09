var _ = require("lodash");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var Code = MessageLibrary.Code;
var helpers = require("../../../lib/xs/util/helpers");
var testdata = require("../../testdata/testdata").data;
var calculationVersionValidatorLibrary = $.import("xs.validator", "calculationVersionValidator");
var CalculationVersionValidator = calculationVersionValidatorLibrary.CalculationVersionValidator;
const Persistency = $.import("xs.db", "persistency").Persistency;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
var sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;
const sStandardPriceStrategy = testdata.sStandardPriceStrategy;
const CalculationVersionCostingSheetTotals = require("../../../lib/xs/util/constants").CalculationVersionCostingSheetTotals;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.calculationVersionValidator-tests', function() {

		var sSessionID = "TestSessionID";
		var oCalculationVersionValidator;

		var oMetadataProviderMock = null;
		var oPersistencyMock = null;
		var BusinessObjectValidatorUtilsMock = null;
		var mValidatedParameters = null;

        var oExistingMasterdata = {
            COSTING_SHEETS: [{
                COSTING_SHEET_ID: "CS1"
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
		
        var oValidCalculationVersion = {
            CALCULATION_VERSION_ID: 100,
            CALCULATION_ID: 123,
            EXCHANGE_RATE_TYPE_ID: oExistingMasterdata.EXCHANGE_RATE_TYPES[0].EXCHANGE_RATE_TYPE_ID,
            COSTING_SHEET_ID: oExistingMasterdata.COSTING_SHEETS[0].COSTING_SHEET_ID,
            COMPONENT_SPLIT_ID: oExistingMasterdata.COMPONENT_SPLITS[0].COMPONENT_SPLIT_ID,
			REPORT_CURRENCY_ID: oExistingMasterdata.CURRENCIES[0].CURRENCY_ID,
			MATERIAL_PRICE_STRATEGY_ID: oExistingMasterdata.MATERIAL_PRICE_STRATEGIES[0].MATERIAL_PRICE_STRATEGY_ID,
			ACTIVITY_PRICE_STRATEGY_ID: oExistingMasterdata.ACTIVITY_PRICE_STRATEGIES[0].ACTIVITY_PRICE_STRATEGY_ID,			
            ITEMS: [{
                ITEM_ID: 100,
                ACCOUNT_ID: oExistingMasterdata.ACCOUNTS[0].ACCOUNT_ID,
                PRICE_SOURCE_ID: oExistingMasterdata.PRICE_SOURCES[0].PRICE_SOURCE_ID,
                QUANTITY_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID,
                TOTAL_QUANTITY_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID,
                PRICE_UNIT_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID,
                TRANSACTION_CURRENCY_ID: oExistingMasterdata.CURRENCIES[0].CURRENCY_ID,
            }]
        };

		beforeEach(function() {
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', [ 'get' ]);

			// since some functions (esp. utilities) of the persistency library must be executed, it is only partially mocked)
			oPersistencyMock = new Persistency({});
			spyOn(oPersistencyMock.CalculationVersion, "getExistingNonTemporaryMasterdata");
			oPersistencyMock.CalculationVersion.getExistingNonTemporaryMasterdata.and.returnValue(oExistingMasterdata);

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Item);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEntity");
			// arrange the mock of checkEntity that to return the entity with which it was called; bypasses any validation, but keeps the 
			// contract of the method
			BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(function() {
				var oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
				return oLastCallEntity;
			});
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();
			spyOn($.trace, "error").and.returnValue(null);
			spyOn(helpers, 'logError').and.callFake(function(msg) {
				$.trace.error(msg);
			});

			oCalculationVersionValidator = new CalculationVersionValidator(oPersistencyMock, sSessionID, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);

			mValidatedParameters = {
				'calculate' : true,
				'mode' : 'replace',
				'omitItems' : false,
                'compressedResult' : false
			};
		});


		function createRequest(oBody, iMethod) {
			var oRequest = {
					queryPath : "calculationVersion",
					method : iMethod,
					body : {
						asString : function() {
							return JSON.stringify(oBody);
						}
                    },
                    // since validated parameters handed in, there is no need for parameters
                    parameters: []
			};
			return oRequest;
        }

		function buildReadRequest(mParameter) {
			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "calculation_id",
				"value" : mParameter.calculation_id
			}, {
				"name" : "project_id",
				"value" : mParameter.project_id
			}, {
				"name" : "top",
				"value" : mParameter.top
			}, {
				"name" : "recently_used",
				"value" : mParameter.recently_used
			}, {
				"name" : "id",
				"value" : mParameter.id
			}, {
				"name" : "loadMasterdata",
				"value" : mParameter.loadMasterdata
			},
			{
				"name" : "current",
				"value" : mParameter.current
			}];
			params.get = function(sArgument) {
				return _.find(params, function(oParam) {
					return sArgument === oParam.name;
				}).value;
			};
			var oRequest = {
					queryPath : "calculation-versions",
					method : $.net.http.GET,
					parameters : params
			};
			return oRequest;
		}

		describe("tests for non-temporary masterdata", function() {

            var oExpectedErrorCode = MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR;
            function checkMasterdataDoesNotExistsException(oInvalidCalculationVersion) {
                var exception = null;
                // act
                try {
                    oCalculationVersionValidator.validate(createRequest([oInvalidCalculationVersion], $.net.http.POST), {
                        action: "create"
                    });
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception.code).toEqual(oExpectedErrorCode);
            }

            describe("POST REQUESTS", () => {
                it("should validate successfully a valid create calculation version request", () => {
                    // act
                    var oValidatedCalculation = oCalculationVersionValidator.validate(createRequest([oValidCalculationVersion], $.net.http.POST), {
                        action: "create"
                    });

                    //assert
                    expect(oValidatedCalculation).toEqualObject([oValidCalculationVersion]);
                });
                
                it("should throw an exception if the parameter compressedResult is true and action is not open or copy", () => {
                    let exception = null;
                    // act
                    try{
                       oCalculationVersionValidator.validate(createRequest([oValidCalculationVersion], $.net.http.POST), {
                        action: "freeze",
                        compressedResult : true
                        });
                    }catch(e){
                        exception = e;
                    }
                    
                    //assert
                    expect(exception.code.code).toEqual("GENERAL_VALIDATION_ERROR");
                });

                ["COSTING_SHEET_ID", "COMPONENT_SPLIT_ID", "REPORT_CURRENCY_ID", "EXCHANGE_RATE_TYPE_ID"].forEach(sNonTemporaryMasterdata => {
                    it(`should throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if version contains unknown master data reference for ${sNonTemporaryMasterdata}`, () => {
                        // arrange
                        const oInvalidCalculationVersion = new TestDataUtility(oValidCalculationVersion).build();
                        oInvalidCalculationVersion[sNonTemporaryMasterdata] = "ABC";

                        // act + assert
                        checkMasterdataDoesNotExistsException(oInvalidCalculationVersion);
                    });
                });

                ["ACCOUNT_ID", "PRICE_SOURCE_ID", "QUANTITY_UOM_ID", "TOTAL_QUANTITY_UOM_ID",
                    "PRICE_UNIT_UOM_ID", "TRANSACTION_CURRENCY_ID"
                ].forEach(sNonTemporaryMasterdata => {
                    it(`should throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if root item contains unknown master data reference for ${sNonTemporaryMasterdata}`, () => {
                        // arrange
                        const oInvalidCalculationVersion = new TestDataUtility(oValidCalculationVersion).build();
                        oInvalidCalculationVersion.ITEMS[0][sNonTemporaryMasterdata] = "ABC";

                        // act + assert
                        checkMasterdataDoesNotExistsException(oInvalidCalculationVersion);
                    });
                });

				it("should validate successfully with SELECTED_TOTAL_COSTING_SHEET = TOTAL_COST and SELECTED_TOTAL_COMPONENT_SPLIT = TOTAL_COST", () => {
					//arrange
					let oNewValidCalculationVersion = _.cloneDeep(oValidCalculationVersion);
					oNewValidCalculationVersion.SELECTED_TOTAL_COSTING_SHEET = CalculationVersionCostingSheetTotals[0];
					oNewValidCalculationVersion.SELECTED_TOTAL_COMPONENT_SPLIT = CalculationVersionCostingSheetTotals[0];
					// act
						var oValidatedCalculation = oCalculationVersionValidator.validate(createRequest([oNewValidCalculationVersion], $.net.http.POST), {
							action: "create"
						});

					//assert
					expect(oValidatedCalculation).toEqualObject([oNewValidCalculationVersion]);
				});

				it("should throw an exception if a version is create with a SELECTED_TOTAL_COSTING_SHEET different than null or TOTAL_COST", () => {
					//arrange
					let oInvalidCalculationVersion = _.cloneDeep(oValidCalculationVersion);
					oInvalidCalculationVersion.SELECTED_TOTAL_COSTING_SHEET = CalculationVersionCostingSheetTotals[1];
					// act
					try {
						var oValidatedCalculation = oCalculationVersionValidator.validate(createRequest([oInvalidCalculationVersion], $.net.http.POST), {
							action: "create"
						});
					} catch (e) {
						exception = e;
					}
					//assert
					expect(exception.code.code).toEqual("GENERAL_VALIDATION_ERROR");
				});

				it("should throw an exception if a version is create with a SELECTED_TOTAL_COMPONENT_SPLIT different than null or TOTAL_COST", () => {
					//arrange
					let oInvalidCalculationVersion = _.cloneDeep(oValidCalculationVersion);
					oInvalidCalculationVersion.SELECTED_TOTAL_COMPONENT_SPLIT = CalculationVersionCostingSheetTotals[1];
					// act
					try {
						var oValidatedCalculation = oCalculationVersionValidator.validate(createRequest([oInvalidCalculationVersion], $.net.http.POST), {
							action: "create"
						});
					} catch (e) {
						exception = e;
					}
					//assert
					expect(exception.code.code).toEqual("GENERAL_VALIDATION_ERROR");
				});
            });

            describe("PUT requests", () => {
                // PUT requests can only contain calculation version related properties and does not contain any item
                ["COSTING_SHEET_ID", "COMPONENT_SPLIT_ID", "REPORT_CURRENCY_ID", "EXCHANGE_RATE_TYPE_ID"].forEach(sNonTemporaryMasterdata => {
                    it(`should throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if version contains unknown master data reference for ${sNonTemporaryMasterdata}`, () => {
                        // arrange
                        const oInvalidCalculationVersion = new TestDataUtility(oValidCalculationVersion).build();
                        oInvalidCalculationVersion[sNonTemporaryMasterdata] = "ABC";

                        // act + assert
                        checkMasterdataDoesNotExistsException(oInvalidCalculationVersion);
                    });
                });
			});
		});
		
		describe("tests for get calculation version requests", function() {
            function checkGetException(mParameter, oExpectedErrorCode) {
                var oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
                var exception;

                //act
                try{
                    var result = oCalculationVersionValidator.validate(buildReadRequest(mParameter), mParameter);
                } catch (e) {
                    exception = e;
                }
                // assert   
                expect(exception.code).toEqual(oExpectedErrorCode);
                expect($.trace.error).toHaveBeenCalled();
            }

			it("should return valid calculation version", function() {
                // arrange 
                var aParameters = 
                [{
            		"calculation_id" : testdata.iCalculationId, 
					"top" : 10,
					"recently_used" : null,
					"id" : null,
					"loadMasterdata" : null
    			},{
            		"calculation_id" : testdata.iCalculationId, 
					"top" : null,
					"recently_used" : null,
					"id" : null,
					"loadMasterdata" : null
			    },{
            		"calculation_id" : null, 
					"top" : null,
					"recently_used" : null,
					"id" : testdata.iCalculationVersionId,
					"loadMasterdata" : null
			    },{
            		"calculation_id" : null, 
					"top" : null,
					"recently_used" : null,
					"id" : testdata.iCalculationVersionId,
					"loadMasterdata" : true
			    },
			    {
            		"calculation_id" : null, 
					"top" : null,
					"recently_used" : true,
					"id" : null,
					"loadMasterdata" : null
			    },
			    {
            		"calculation_id" : null, 
					"top" : 2,
					"recently_used" : true,
					"id" : null,
					"loadMasterdata" : null
			     },{
            		"calculation_id" : null, 
					"top" : null,
					"recently_used" : true,
					"id" : null,
					"loadMasterdata" : true
			    },{
            		"calculation_id" : null, 
					"top" : 2,
					"recently_used" : true,
					"id" : null,
					"loadMasterdata" : true
			     },{
            		"calculation_id" : testdata.iCalculationId, 
					"top" : null,
					"recently_used" : null,
					"id" : null,
					"returnLifecycle" : true
			     }, {
					"project_id": testdata.iProjectId,
					"loadMasterdata" : true,
					"returnLifecycle": true
				 }
			    ];
                _.each(aParameters,function(mParameter){
                	//act
    				var result = oCalculationVersionValidator.validate(buildReadRequest(mParameter), mParameter);
    				// assert	
    				expect(result.length).toBe(0);
                });
			});

			it("should return error when using both calculation_id and project_id", function() {
                // arrange 
                var mParameter = {
                		"calculation_id" : testdata.iCalculationId, 
						"project_id": testdata.iProjectId,
    					"loadMasterdata" : true,
						"returnLifecycle": true
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when using calculation_id and recently_used = true", function() {
                // arrange 
                var mParameter = {
                		"calculation_id" : testdata.iCalculationId, 
    					"top" : null,
    					"recently_used" : true
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when using more than one mandatory parameters", function() {
                // arrange 
                var mParameter = {
                		"calculation_id" : testdata.iCalculationId, 
    					"top" : 10,
    					"recently_used" : true,
    					"id" : testdata.iCalculationVersionId,
					    "loadMasterdata" : true
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when no mandatory parameter is used", function() {
                // arrange 
                var mParameter = {
                		"calculation_id" : null, 
    					"top" : 2,
    					"recently_used" : null,
    					"id" : null,
					    "loadMasterdata" : true
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when search is missing or is not true and the other parameters for search are on the request", function() {
                // arrange 
                var mParameter = {
                		"search" : null, 
    					"sortingColumn" : "PROJECT_ID",
    					"id" : 1
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when id is missing for the search=true", function() {
                // arrange 
                var mParameter = {
                		"search" : true, 
    					"sortingColumn" : "PROJECT_ID",
    					"calculation_id" : 1
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when sortingDirection is not asc or desc", function() {
                // arrange 
                var mParameter = {
                		"search" : true, 
    					"sortingColumn" : "PROJECT_NAME",
    					"sortingDirection": "aasc",
    					"id" : 1
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when sortingColumn is not valid;the valid columns are: PROJECT_NAME, CALCULATION_NAME, LAST_MODIFIED_ON", function() {
                // arrange 
                var mParameter = {
                		"search" : true, 
    					"sortingColumn" : "PROJECT_ID",
    					"sortingDirection": "asc",
    					"id" : 1
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when filter contains objects that are not valid, the valid ones are: PROJECT," +
					" CALCULATION, CALCULATION_VERSION, CUSTOMER, MATERIAL, PLANT", function() {
                // arrange 
                var mParameter = {
                		"search" : true, 
    					"sortingColumn" : "PROJECT_NAME",
    					"sortingDirection": "asc",
    					"filter": "MATERIAL=6,PLANT=p*9,PRJ=9",
    					"id" : 1
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when using current is true and calculation_id is missing", function() {
                // arrange 
                var mParameter = {
                		"current" : true, 
    					"top" : null,
    					"recently_used" : true
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when using current is missing and calculation_id is list of ids", function() {
                // arrange 
                var mParameter = {
                		"calculation_id" : "1,2,3", 
    					"top" : null,
    					"recently_used" : true
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when using current is missing and calculation_id is not an integer", function() {
                // arrange 
                var mParameter = {
                		"calculation_id" : "1a", 
    					"top" : null,
    					"recently_used" : true
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return error when using current is true and and not all calculation_ids are positive integer", function() {
                // arrange 
                var mParameter = {
                		"calculation_id" : "1,-2,2", 
                		"current" : true, 
    					"top" : null,
    					"recently_used" : true
    			};
                
                // act + assert
                checkGetException(mParameter, MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
		});
		
		describe("tests for calculation version parameters", function() {
           
	    	it("should return a GENERAL_VALIDATION_ERROR if omitItems = true and compressedResult = true", function() {
	    	    // arrange 
			    var sDeveloperInfo = "Cannot use omitItems = true and compressedResult = true in the same request.";
                mValidatedParameters.omitItems = true;
                mValidatedParameters.compressedResult = true;
				let exception = null;
				// act
				try {
					oCalculationVersionValidator.validate(createRequest([ oValidCalculationVersion ],  $.net.http.PUT), mValidatedParameters);
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception).not.toBe(null);
				expect(exception.code).toBe(Code.GENERAL_VALIDATION_ERROR);
				expect(exception.developerMessage).toBe(sDeveloperInfo);
				expect($.trace.error).toHaveBeenCalled();
			});
			
			it("should return a calculation version object if omitItems = false and compressedResult = true", function() {
	    	    // arrange 
                mValidatedParameters.compressedResult = true; 
				
				oMetadataProviderMock.get.and.returnValue([{
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES: "",
					VALIDATION_REGEX_VALUE: "MASTERDATA"
				}]);
                
                //act
                var oReturnedValidCalculationVersion = oCalculationVersionValidator.validate(createRequest([ oValidCalculationVersion ],  $.net.http.PUT), mValidatedParameters);
                
				// assert	
				expect(oReturnedValidCalculationVersion).toMatchData([oValidCalculationVersion], [  "CALCULATION_VERSION_ID" ]);
			});
			
			it("should return a calculation version object if omitItems = true and compressedResult = false", function() {
	    	    // arrange 
				mValidatedParameters.omitItems = true; 
				
				oMetadataProviderMock.get.and.returnValue([{
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES: "",
					VALIDATION_REGEX_VALUE: "MASTERDATA"
				}]);
                
                //act
                var oReturnedValidCalculationVersion = oCalculationVersionValidator.validate(createRequest([ oValidCalculationVersion ],  $.net.http.PUT), mValidatedParameters);
                
				// assert	
				expect(oReturnedValidCalculationVersion).toMatchData([oValidCalculationVersion], [ "CALCULATION_VERSION_ID" ]);
			});
			
		});
			
		describe(`PATCH requests`, () => {

			const aValidPatchReqParams = [
				{
					'calculation-version-id' : '1'
				}
			];

			const PatchTestDataUtility = new TestDataUtility(
				{
					LOCK: {
						IS_WRITEABLE: 1,
						CONTEXT: "variant_matrix"
					}
				}
			);

			function createPatchRequest(aParams, oBody) {
				// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
				aParams.get = function(sArgument) {
					var oSearchedParam = _.find(aParams, function(oParam) {
						return sArgument === oParam.name;
					});
					return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
				};

				return {
						queryPath : "calculation-versions",
						method : $.net.http.PATCH,
						body : {
							asString : function() {
								return JSON.stringify(oBody);
							}
						},
						parameters: aParams
				};
			}

			it(`should successfully validate a valid lock request for a calculation version`, () => {
				let oValidLockRequest = PatchTestDataUtility.build();

				let oReturnedValidPatchRequest = oCalculationVersionValidator.validate(createPatchRequest(aValidPatchReqParams, oValidLockRequest), mValidatedParameters);

				expect(oReturnedValidPatchRequest).toEqual(oValidLockRequest);
			});

			it(`should successfully validate a valid unlock request for a calculation version`, () => {
				// in contrast to oValidLockRequest the attribute LOCK.IS_WRITEABLE is defined as a string value;
				// objective: to check if validator is able to validate integer and string values and transform it to integer
				let oValidUnlockRequest = PatchTestDataUtility.build();
				oValidUnlockRequest.LOCK.IS_WRITEABLE = "0";
				oValidUnlockRequest.LOCK.CONTEXT = "calculation_version";

				let oExpectedUnlockRequest = PatchTestDataUtility.build();
				oExpectedUnlockRequest.LOCK.IS_WRITEABLE = parseInt(oValidUnlockRequest.LOCK.IS_WRITEABLE);
				oExpectedUnlockRequest.LOCK.CONTEXT = oValidUnlockRequest.LOCK.CONTEXT;

				let oReturnedValidPatchRequest = oCalculationVersionValidator.validate(createPatchRequest(aValidPatchReqParams, oValidUnlockRequest), mValidatedParameters);

				expect(oReturnedValidPatchRequest).toEqual(oExpectedUnlockRequest);
			});

			it(`should throw GENERAL_VALIDATION_ERROR if body empty`, () => {
				let exception = null;
				
                try {
                    oCalculationVersionValidator.validate(createPatchRequest(aValidPatchReqParams, {}), mValidatedParameters);
                } catch(e) {
                    exception = e;
                }
                
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it(`should throw GENERAL_VALIDATION_ERROR if body does not contain mandatory LOCK attribute`, () => {
				let exception = null;
				let oInvalidLockRequestBody = { test : "Test"};
				
                try {
                    oCalculationVersionValidator.validate(createPatchRequest(aValidPatchReqParams, oInvalidLockRequestBody), mValidatedParameters);
                } catch(e) {
                    exception = e;
                }
                
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it(`should throw GENERAL_VALIDATION_ERROR if (un)lock request is missing mandatory attributes`, () => {
				let exception = null;
				let oValidLockRequestBody = PatchTestDataUtility.build();

				_.each(oValidLockRequestBody.LOCK, function(element, index, list) {
					let oInvalidLockRequestBody = PatchTestDataUtility.build();
					delete oInvalidLockRequestBody.LOCK[index];
					
					try {
						oCalculationVersionValidator.validate(createPatchRequest(aValidPatchReqParams, oInvalidLockRequestBody), mValidatedParameters);
					} catch(e) {
						exception = e;
					}

					expect(exception).toBeDefined();
					expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
				});
			});

			it(`should throw GENERAL_VALIDATION_ERROR if (un)lock request provides invalid properties`, () => {
				let exception = null;
				let oInvalidLockRequestBody = PatchTestDataUtility.build();
				oInvalidLockRequestBody.LOCK.TEST = `test`;
					
				try {
					oCalculationVersionValidator.validate(createPatchRequest(aValidPatchReqParams, oInvalidLockRequestBody), mValidatedParameters);
				} catch(e) {
					exception = e;
				}
				
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it(`should throw GENERAL_VALIDATION_ERROR if mandatory properties are of invalid data types`, () => {

				let aInvalidPatchRequests = [];
				for (let i = 0; i <= 5; i++) {
					aInvalidPatchRequests.push(PatchTestDataUtility.build());
				}

				aInvalidPatchRequests[0].LOCK.IS_WRITEABLE = `test`;
				aInvalidPatchRequests[1].LOCK.IS_WRITEABLE = 13.3;
				aInvalidPatchRequests[2].LOCK.IS_WRITEABLE = null;
				aInvalidPatchRequests[3].LOCK.CONTEXT = `test`;
				aInvalidPatchRequests[4].LOCK.CONTEXT = 13.3;
				aInvalidPatchRequests[5].LOCK.CONTEXT = null;

				_.each(aInvalidPatchRequests, function(oInvalidPatchRequest) {
					let exception = null;

					try {
						oCalculationVersionValidator.validate(createPatchRequest(aValidPatchReqParams, oInvalidPatchRequest), mValidatedParameters);
					} catch(e) {
						exception = e;
					}
					
					expect(exception).toBeDefined();
					expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
				});
			});
			
		});
		
	}).addTags(["All_Unit_Tests"]);
}