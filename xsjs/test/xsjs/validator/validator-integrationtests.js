var _ = require("lodash");
var PersistencyImport = $.import("xs.db", "persistency");
var PersistencyItemImport = require("../../../lib/xs/db/persistency-item");
var PersistencyCalculationVersionImport = require("../../../lib/xs/db/persistency-calculationVersion");
var PersistencyMetadataImport = require("../../../lib/xs/db/persistency-metadata");
var DispatcherImport = require("../../../lib/xs/impl/dispatcher");

var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var testData = require("../../testdata/testdata").data;

var Validator = $.import("xs.validator", "validator").Validator;
var ValidatorInput = $.import("xs.validator", "validator").ValidatorInput;
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency = PersistencyImport.Persistency;

var MessageLibrary = require("../../../lib/xs/util/message");
var PlcException = MessageLibrary.PlcException;
var Code = MessageLibrary.Code;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe("xsjs.validator.validator-integrationtests", function() {

		var mockstar = null;
		var validator = null;
		var persistency = null;
		var userId = $.session.getUsername().toUpperCase();
		var sessionId = testData.sSessionId;

		function createRequestMock(oPayload, mParameters, iMethod) {
			var iHttpMethod = iMethod;
			var oBody;
			if (oPayload !== undefined && oPayload !== null) {
				var bodyContent = JSON.stringify(_.isArray(oPayload) ? oPayload : [ oPayload ]);
				oBody = {
						asString : function() {
							return bodyContent;
						}
				}
			}

			var aParameters = _.map(mParameters, (vValue, sKey) => {
			    return {
			        name: sKey,
			        value: vValue
			    }
			});
			aParameters.get = function(sParameterName) {
				return _.has(mParameters, sParameterName) ? mParameters[sParameterName] : undefined;
			}

			var oRequestMock = {
					body : oBody,
					method : iHttpMethod,
					parameters : aParameters,
					queryPath : "/items"
			};
			return oRequestMock;
		}

		/**
		 * call it like checkValues(oValidatedRequest.data[0]).against(oRequestPayload) for example
		 */
		function checkValues(oValidatedValues) {
			return {
				against : function(oInputObject) {
					_.each(oValidatedValues, function(validatedValue, sPropertyName) {
						var inputValue = oInputObject[sPropertyName];
						if (inputValue === null) {
							jasmine.log(`Testing property ${sPropertyName} to be undefined`);
							expect(validatedValue).toBe(null);
						} else {
							jasmine.log(`Testing property ${sPropertyName} for equality`);

							if (validatedValue instanceof Date) {
								expect(Date.parse(inputValue)).toEqual(validatedValue.getTime());
							} else {
								expect(inputValue).toEqual(validatedValue);
							}
						}
					});
				}
			}
		}

		function ValidationFailTestBuilder(oPayload, iMethod, sResourceDefinitionKey) {

			var mRequestParameters = {};
			var oExpectedExceptionCode = Code.GENERAL_VALIDATION_ERROR;
			var oExpectedException = PlcException;

			this.setRequestParameters = function(mParameters) {
				mRequestParameters = mParameters;
				return this;
			}

			this.setExpectedExceptionCode = function(oCode) {
				oExpectedExceptionCode = oCode;
				return this;
			}

			this.setExpectedException = function(fException) {
				oExpectedException = fException;
				return this;
			}

			this.run = function() {
				var oRequest = createRequestMock(oPayload, mRequestParameters, iMethod);
				var oValidatorInput = new ValidatorInput(oRequest, sResourceDefinitionKey);
				var exception;

				// act
				try {
					var oValidatedRequest = validator.validate(oValidatorInput);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception instanceof oExpectedException).toBe(true);
				expect(exception.code).toBe(oExpectedExceptionCode);
				expect(validator.validationSuccess).toBe(false);
			}

		}
		var oTomorrow = new Date();
		oTomorrow.setDate(oTomorrow.getDate() + 1);

		beforeOnce(function() {
			originalProcedures = PersistencyItemImport.Procedures;
			mockstar = new MockstarFacade({
				substituteTables : {
					"item" : PersistencyItemImport.Tables.item_temporary,
					"calculation_version" : {
						name : PersistencyCalculationVersionImport.Tables.calculation_version_temporary,
						data : testData.oCalculationVersionTemporaryTestData
					},
					"metadata" : {
						name : PersistencyMetadataImport.Tables.metadata,
						data : testData.mCsvFiles.metadata
					},
					"metadata_text" : {
						name : PersistencyMetadataImport.Tables.metadataText,
						data : testData.mCsvFiles.metadata__text
					},
					"metadata_item_attributes" : {
						name : PersistencyMetadataImport.Tables.metadataItemAttributes,
						data : testData.mCsvFiles.metadata_item_attributes
					},
					"session" : {
						name : "sap.plc.db::basis.t_session",
						data : {
							SESSION_ID : [ userId ],
							USER_ID : [ userId ],
							LANGUAGE : [ "DE" ],
							LAST_ACTIVITY_TIME : [ new Date()]
						}
					},
					"openCalculationVersion" : {
						name : "sap.plc.db::basis.t_open_calculation_versions",
						data : testData.oOpenCalculationVersionsTestData
					},
					"calculation" : {
						name : "sap.plc.db::basis.t_calculation",
						data : testData.oCalculationTestData
					},
					"project" : {
						name : "sap.plc.db::basis.t_project",
						data : testData.oProjectTestData
					},
					"costing_sheet" : {
						name : "sap.plc.db::basis.t_costing_sheet",
						data : {
							COSTING_SHEET_ID : [ "CS1", "CS2", "CS3" ],
							CONTROLLING_AREA_ID : [ testData.oProjectTestData.CONTROLLING_AREA_ID[0],
													testData.oProjectTestData.CONTROLLING_AREA_ID[0], "666" ],
							IS_TOTAL_COST2_ENABLED : [0,0,0],						
							IS_TOTAL_COST3_ENABLED : [0,0,0],						
							_VALID_FROM : [ testData.sValidFromDate, oTomorrow.toJSON(), testData.sValidFromDate ],
							_VALID_TO : [ null, null, null ],
							_SOURCE : [ null, null, null ],
							_CREATED_BY : [ null, null, null ]
						}
					},
					"component_split" : {
						name : "sap.plc.db::basis.t_component_split",
						data : {
							COMPONENT_SPLIT_ID : [ "CS1", "CS2", "CS3" ],
							CONTROLLING_AREA_ID : [ testData.oProjectTestData.CONTROLLING_AREA_ID[0],
							                        testData.oProjectTestData.CONTROLLING_AREA_ID[0], "666" ],
							                        _VALID_FROM : [ testData.sValidFromDate, oTomorrow.toJSON(), testData.sValidFromDate ]
						}
					},
					"currency" : {
						name : "sap.plc.db::basis.t_currency",
						data : {
							CURRENCY_ID : [ "EUR", "CU2" ],
							_VALID_FROM : [ testData.sValidFromDate, oTomorrow.toJSON() ]
						}
					},
					"uom" : {
						name : "sap.plc.db::basis.t_uom",
						data : {
							UOM_ID : [ "ST", "PC" ],
							DIMENSION_ID : [ "" ,""],
							NUMERATOR : [ 1 ,1],
							DENOMINATOR : [ 1 ,1],
							EXPONENT_BASE10 : [ 1,1 ],
							SI_CONSTANT : [ "1.1","1.1" ],
							_VALID_FROM : [ testData.sValidFromDate, testData.sValidFromDate ],
							_VALID_TO : [ null, null ],
							_SOURCE : [ null, null ],
							_CREATED_BY : [ null, null ]
						}
					},
					"t006" : {
						name : "sap.plc.db::repl.t006",
						data : {
							MSEHI : [ "H" ],
							DIMID : [ "" ],
							ZAEHL : [ 1 ],
							NENNR : [ 1 ],
							EXP10 : [ 1 ],
							ADDKO : [ "1.1" ],

						}
					},
					"controlling_area" : {
						name : "sap.plc.db::basis.t_controlling_area",
						data : {
							CONTROLLING_AREA_ID : [ "1000"],
							_VALID_FROM : [testData.sValidFromDate]							
						}
					},
					"tka01" : {
						name : "sap.plc.db::repl.tka01",
						data : {
							KOKRS : [ "2000"],
							WAERS : ["1"],
							KTOPL : [ "1"],
							LMONA : ["1"]
						}
					},
					price_determination_strategy: {
						name: "sap.plc.db::basis.t_price_determination_strategy",
						data: testData.oPriceDeterminationStrategyTestData
					}
				},
				csvPackage : testData.sCsvPackage
			});
		});

		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.initializeData();

			persistency = new Persistency(jasmine.dbConnection);
			validator = new Validator(persistency, sessionId, DispatcherImport.Resources);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		describe("validate item requests", function() {

			beforeEach(function() {
				mockstar.insertTableData("item", testData.oItemTemporaryTestData);
			});

			describe("create requests", function() {

				var oValidRequestPayload = {
						ITEM_ID : -1,
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[0],
						PARENT_ITEM_ID : testData.oItemTemporaryTestData.PARENT_ITEM_ID[1],
						PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[0],
						IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[0],
						ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.ITEM_CATEGORY_ID[1],
						CHILD_ITEM_CATEGORY_ID : testData.oItemTemporaryTestData.CHILD_ITEM_CATEGORY_ID[1],
						QUANTITY : "1.0",
						QUANTITY_UOM_ID : testData.oItemTemporaryTestData.QUANTITY_UOM_ID[0],
						TOTAL_QUANTITY_DEPENDS_ON : 1,
						PRICE_FIXED_PORTION : testData.oItemTemporaryTestData.PRICE_FIXED_PORTION[0].toString(),
						PRICE_VARIABLE_PORTION : testData.oItemTemporaryTestData.PRICE_VARIABLE_PORTION[0].toString(),
						TRANSACTION_CURRENCY_ID : testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[0],
						PRICE_UNIT : testData.oItemTemporaryTestData.PRICE_UNIT[0].toString(),
						PRICE_UNIT_UOM_ID : testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[0],
						BASE_QUANTITY : "1"

				};

				it("valid create request -> should successfully validate and return validated data with correct data types", function() {
					// arrange
					var oRequest = createRequestMock(oValidRequestPayload, {
						"calculate" : "true",
						"mode" : "replace"
					}, $.net.http.POST);

					var oValidatorInput = new ValidatorInput(oRequest, "items", "POST");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);
					expect(oValidatedRequest.parameters.calculate).toBe(true);
				});

				it("valid create request -> should successfully validate and return validated data with correct data types including CF", function() {
					// arrange
					var oValidRequestPayload1 = _.clone(oValidRequestPayload);
					oValidRequestPayload1.CUST_TEST_MANUAL = 10;
					oValidRequestPayload1.CUST_TEST_IS_MANUAL = false;
					oValidRequestPayload1.CUST_TEST_UNIT = "Kg";

					var oMetadataTestData = {
							"PATH": [ "Item", "Item"],
							"BUSINESS_OBJECT": [ "Item", "Item"],
							"COLUMN_ID": ["CUST_TEST","CUST_TEST_UNIT"],
							"IS_CUSTOM": [ 1,1],
							"UOM_CURRENCY_FLAG" :[null,1],
							"ROLLUP_TYPE_ID": [ 0,0],
							"SEMANTIC_DATA_TYPE": ["Integer", "String"],
							"SEMANTIC_DATA_TYPE_ATTRIBUTES":[ null,"length = 10"]
					};

					mockstar.insertTableData("metadata", oMetadataTestData);

					var oRequest = createRequestMock(oValidRequestPayload1, {
						"calculate" : "true",
						"mode" : "replace"
					}, $.net.http.POST);
					
					var oValidatorInput = new ValidatorInput(oRequest, "items", "POST");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);
					expect(oValidatedRequest.parameters.calculate).toBe(true);
				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});

				it("unknown property in request for CF -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload1 = _.clone(oValidRequestPayload);
					oInvalidRequestPayload1.CUST_TEST_MANUAL = 10;
					oInvalidRequestPayload1.CUST_TEST_IS_MANUAL = false;
					oInvalidRequestPayload1.CUST_TEST_UNIT_MANUAL = "Kg";

					var oMetadataTestData = {
							"PATH": [ "Item", "Item"],
							"BUSINESS_OBJECT": [ "Item", "Item"],
							"COLUMN_ID": ["CUST_TEST","CUST_TEST_UNIT"],
							"IS_CUSTOM": [ 1,1],
							"ROLLUP_TYPE_ID": [ 0,0],
							"SEMANTIC_DATA_TYPE": ["Integer", "String"],
							"SEMANTIC_DATA_TYPE_ATTRIBUTES":[ null,"length = 10"]
					};

					mockstar.insertTableData("metadata", oMetadataTestData);
					
					var aColumns = mockstar.execQuery("select * from {{metadata}}");

					new ValidationFailTestBuilder(oInvalidRequestPayload1, $.net.http.POST, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});

				it("read-only and not transferable property in request -> should raise validation error and indicate unsuccessful validation",
						function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.LAST_MODIFIED_ON = new Date().toJSON();

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST,
							DispatcherImport.Resources.items.POST.parameters, BusinessObjectTypes.Item).setRequestParameters({
								"calculate" : "true"
							}).run();
				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_VERSION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});

				it('should throw an exception if no valid item hierarchy is passed (containing orphans)', function() {
					// arrange
					var aRequest = [ oValidRequestPayload, oValidRequestPayload ];
					aRequest[0].ITEM_ID = 1;
					aRequest[1].ITEM_ID = -2;
					delete aRequest[0].PARENT_ITEM_ID;
					delete aRequest[1].PARENT_ITEM_ID;

					var oRequest = createRequestMock(aRequest, {
						"calculate" : "true"
					}, $.net.http.POST);
					var oValidatorInput = new ValidatorInput(oRequest, DispatcherImport.Resources.items.POST.parameters,
							BusinessObjectTypes.Item);
					var exception;
					// act
					try {
						var oValidatedRequest = validator.validate(oValidatorInput);
					} catch (e) {
						exception = e;
					}
					// assert
					expect(exception).toBeDefined();
				})

				it('should throw an exception if no valid item hierarchy is passed (containing loops)', function() {
					// arrange
					var aRequest = [ oValidRequestPayload, oValidRequestPayload, oValidRequestPayload, oValidRequestPayload ];
					aRequest[0].ITEM_ID = 1;
					aRequest[1].ITEM_ID = -2;
					delete aRequest[0].PARENT_ITEM_ID;
					aRequest[1].PARENT_ITEM_ID = aRequest[0].ITEM_ID;
					aRequest[2].PARENT_ITEM_ID = aRequest[1].ITEM_ID;
					aRequest[1].PARENT_ITEM_ID = aRequest[2].ITEM_ID;

					var oRequest = createRequestMock(aRequest, {
						"calculate" : "true",
						"mode" : "replace"
					}, $.net.http.POST);

					var oValidatorInput = new ValidatorInput(oRequest, "items");

					var exception;
					// act
					try {
						var oValidatedRequest = validator.validate(oValidatorInput);
					} catch (e) {
						exception = e;
					}
					// assert
					expect(exception).toBeDefined();
				})
			});

			describe("update requests", function() {

				var oValidRequestPayload = {
						ITEM_ID : testData.oItemTemporaryTestData.ITEM_ID[1],
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
						PARENT_ITEM_ID : testData.oItemTemporaryTestData.PARENT_ITEM_ID[1],
						PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[1],
						IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[1],
						ITEM_CATEGORY_ID : 2, // change of category -> 2
						CHILD_ITEM_CATEGORY_ID: 2
				};

				it("valid update request -> should successfully validate and return validated data with correct data types", function() {
					// arrange
					var oRequest = createRequestMock(oValidRequestPayload, {
						"calculate" : "true"
					}, $.net.http.PUT);
					var oValidatorInput = new ValidatorInput(oRequest, "items");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);
					expect(oValidatedRequest.parameters.calculate).toBe(true);
				});

				it("valid update request -> should successfully validate and return validated data with correct data types including CF", function() {
					// arrange
					var oValidRequestPayload1 = _.clone(oValidRequestPayload);
					oValidRequestPayload.CUST_TEST_MANUAL = 10;
					oValidRequestPayload.CUST_TEST_IS_MANUAL = false;
					oValidRequestPayload.CUST_TEST_UNIT = "Kg";
					var oMetadataTestData = {
							"PATH": [ "Item", "Item"],
							"BUSINESS_OBJECT": [ "Item", "Item"],
							"COLUMN_ID": ["CUST_TEST","CUST_TEST_UNIT"],
							"IS_CUSTOM": [ 1,1],
							"UOM_CURRENCY_FLAG" :[null,1],
							"ROLLUP_TYPE_ID": [ 0,0],
							"SEMANTIC_DATA_TYPE": ["Integer", "String"],
							"SEMANTIC_DATA_TYPE_ATTRIBUTES":[ null,"length = 10"]
					};

					mockstar.insertTableData("metadata", oMetadataTestData);

					var oRequest = createRequestMock(oValidRequestPayload1, {
						"calculate" : "true"
					}, $.net.http.PUT);
					var oValidatorInput = new ValidatorInput(oRequest, "items");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);
					expect(oValidatedRequest.parameters.calculate).toBe(true);
				});

				it("valid update request for root item -> should successfully validate and return validated data with correct data types",
						function() {
					// arrange
					var oUpdateRootRequestPayload = {
							ITEM_ID : testData.oItemTemporaryTestData.ITEM_ID[0],
							CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[0],
							PARENT_ITEM_ID : testData.oItemTemporaryTestData.PARENT_ITEM_ID[1],
							PREDECESSOR_ITEM_ID : testData.oItemTemporaryTestData.PREDECESSOR_ITEM_ID[0],
							IS_ACTIVE : testData.oItemTemporaryTestData.IS_ACTIVE[0],
							TOTAL_QUANTITY : "1",
							TOTAL_QUANTITY_UOM_ID : "PC"
					}

					var oRequest = createRequestMock(oUpdateRootRequestPayload, {
						"calculate" : "true"
					}, $.net.http.PUT);
					var oValidatorInput = new ValidatorInput(oRequest, "items");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oUpdateRootRequestPayload);
					expect(oValidatedRequest.parameters.calculate).toBe(true);
				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.PUT, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});

				it("unknown property in request including CF-> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload1 = _.clone(oValidRequestPayload);
					oInvalidRequestPayload1.CUST_TEST_MANUAL = 10;
					oInvalidRequestPayload1.CUST_TEST_IS_MANUAL = false;
					oInvalidRequestPayload1.CUST_TEST_UNIT_IS_MANUAL = "Kg";
					var oMetadataTestData = {
							"PATH": [ "Item", "Item"],
							"BUSINESS_OBJECT": [ "Item", "Item"],
							"COLUMN_ID": ["CUST_TEST","CUST_TEST_UNIT"],
							"IS_CUSTOM": [ 1,1],
							"ROLLUP_TYPE_ID": [ 0,0],
							"SEMANTIC_DATA_TYPE": ["Integer", "String"],
							"SEMANTIC_DATA_TYPE_ATTRIBUTES":[ null,"length = 10"]
					};

					mockstar.insertTableData("metadata", oMetadataTestData);

					new ValidationFailTestBuilder(oInvalidRequestPayload1, $.net.http.PUT, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});
				
				it("item category is invalid for CF -> remove attribute from the validated object", function() {
					// arrange
					var oMetadataTestData = {
							"PATH": [ "Item", "Item"],
							"BUSINESS_OBJECT": [ "Item", "Item"],
							"COLUMN_ID": ["CUST_TEST","CUST_TEST_UNIT"],
							"IS_CUSTOM": [ 1,1],
							"UOM_CURRENCY_FLAG" :[null,1],
							"ROLLUP_TYPE_ID": [ 0,0],
							"SEMANTIC_DATA_TYPE": ["Integer", "String"],
							"SEMANTIC_DATA_TYPE_ATTRIBUTES":[ null,"length = 10"]
					};

					mockstar.insertTableData("metadata", oMetadataTestData);
					
					var oCFRequestPayload = {
							ITEM_ID : testData.oItemTemporaryTestData.ITEM_ID[1],
							CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[1],
							CUST_TEST_MANUAL: 1212,
							ITEM_CATEGORY_ID : 2, // change of category -> 2
							CHILD_ITEM_CATEGORY_ID: 2
					};

					var oRequest = createRequestMock(oCFRequestPayload, {
						"calculate" : "true"
					}, $.net.http.PUT);
					var oValidatorInput = new ValidatorInput(oRequest, "items");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);
					
					//assert
					expect(oValidatedRequest.CUST_TEST_MANUAL).toBe(undefined);

				});

				it("read-only and not transferable property in request -> should raise validation error and indicate unsuccessful validation",
						function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.LAST_MODIFIED_ON = new Date().toJSON();

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.PUT, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});

				it("missing cv id in request -> should raise validation error for missing mandatory property", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_VERSION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.PUT, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});

				it("set mandatory property to null -> should raise validation error for setting a mandatory property null", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					_.extend(oInvalidRequestPayload, {
						ITEM_CATEGORY_ID : 1,
						PARENT_ITEM_ID : 1337,
						QUANTITY : null
					});

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.DEL, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});
			});

			describe("delete requests", function() {

				var oValidRequestPayload = {
						ITEM_ID : testData.oItemTemporaryTestData.ITEM_ID[0],
						CALCULATION_VERSION_ID : testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[0]
				};

				it("valid create request -> should successfully validate and return validated data with correct data types", function() {
					// arrange
					var oRequest = createRequestMock(oValidRequestPayload, {
						"calculate" : "true"
					}, $.net.http.DEL);
					var oValidatorInput = new ValidatorInput(oRequest, "items");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);
					expect(oValidatedRequest.parameters.calculate).toBe(true);
				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.DEL, "items").setRequestParameters({
								"calculate" : "true"
							}).run();
				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_VERSION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.DEL, DispatcherImport.Resources.items.DELETE.parameters,
							BusinessObjectTypes.Item).setRequestParameters({
								"calculate" : "true"
							}).run();
				});
			});

		});

		describe("validate calculation version requests", function() {

			beforeEach(function() {
			});

			describe("open requests", function() {

				it("valid get request with empty body -> should successfully validate, return no data and have correct id-parameter value",
						function() {
					// arrange
					var iCvId = 2809;
					var oRequest = createRequestMock(undefined, {
						"id" : iCvId.toString(),
						"calculate" : "true",
						"loadMasterdata" : "true",
						"action" : "open"
					}, $.net.http.POST);
					var oValidatorInput = new ValidatorInput(oRequest, "calculation-versions");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					expect(validator.data).not.toBeDefined();
					expect(oValidatedRequest.parameters.id).toBe(iCvId);
				});

				it("invalid request with body content -> should raise validation error and indicate unsuccessful validation", function() {
					new ValidationFailTestBuilder({}, $.net.http.POST, "calculation-versions").setRequestParameters({
								"calculate" : "true",
								"id" : "2809",
								"loadMasterdata" : "true",
								"action" : "open"
							}).run();
				});

				it("missing id parameter -> should raise validation error and indicate unsuccessful validation", function() {
					new ValidationFailTestBuilder({}, $.net.http.POST, "calculation-versions").setRequestParameters({
								"calculate" : "true",
								"loadMasterdata" : "true",
								"action" : "open"
							}).run();
				});
				
				it("missing action parameter -> should raise validation error and indicate unsuccessful validation", function() {
					new ValidationFailTestBuilder({}, $.net.http.POST, "calculation-versions").setRequestParameters({
								"calculate" : "true",
								"loadMasterdata" : "true",
								"id" : "2809"
							}).run();
				});

			});

			describe("update requests", function() {

				var oValidRequestPayload = {
						CALCULATION_ID : testData.oCalculationVersionTemporaryTestData.CALCULATION_ID[0],
						CALCULATION_VERSION_ID : testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0],
						CALCULATION_VERSION_NAME : testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_NAME[0],
						VALUATION_DATE : "2011-08-20",
						ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
						REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
						COSTING_SHEET_ID : "CS1",
						COMPONENT_SPLIT_ID : "CS1",
						ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy,
						MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy
				};

				it("valid get request with empty body -> should successfully validate, return no data and have correct id-parameter value",
						function() {
					// arrange
					var oRequest = createRequestMock(oValidRequestPayload, {}, $.net.http.PUT);
					var oValidatorInput = new ValidatorInput(oRequest, "calculation-versions");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);

				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.PUT, "calculation-versions")
					.setRequestParameters({
						"calculate" : "true"
					}).run();
				});

				it("read-only and not transferable property in request -> should raise validation error and indicate unsuccessful validation",
						function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.LAST_MODIFIED_ON = new Date().toJSON();

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.PUT, "calculation-versions")
					.setRequestParameters({
						"calculate" : "true"
					}).run();
				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_VERSION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, "calculation-versions")
					.setRequestParameters({
						"calculate" : "true"
					}).run();
				});

			});

			describe("save requests", function() {

				var oValidRequestPayload = {
						CALCULATION_ID : testData.oCalculationVersionTemporaryTestData.CALCULATION_ID[0],
						CALCULATION_VERSION_ID : testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0],
						CALCULATION_VERSION_NAME : testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_NAME[0]
				};

				it("valid save/save-as request -> should successfully validate and return validated data with correct data types", function() {

					_.each([ "save", "save-as" ], function(sSaveType) {
						jasmine.log(`Validating ${sSaveType}`);

						// arrange
						var oRequest = createRequestMock(oValidRequestPayload, {
							"calculate" : "true",
							"action" : sSaveType
						}, $.net.http.POST);
						var oValidatorInput = new ValidatorInput(oRequest, "calculation-versions");

						// act
						var oValidatedRequest = validator.validate(oValidatorInput);

						// assert
						expect(validator.validationSuccess).toBe(true);
						checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);
						expect(oValidatedRequest.parameters.calculate).toBe(true);
						expect(oValidatedRequest.parameters.action).toBe(sSaveType);
					});
				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					_.each([ "save", "save-as" ], function(sSaveType) {
						// arrange
						var oInvalidRequestPayload = _.clone(oValidRequestPayload);
						oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

						new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "calculation-versions")
						.setRequestParameters({
							"calculate" : "true",
							"action" : sSaveType
						}).run();
					});

				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation", function() {
					_.each([ "save", "save-as" ], function(sSaveType) {
						// arrange
						var oInvalidRequestPayload = _.clone(oValidRequestPayload);
						delete oInvalidRequestPayload.CALCULATION_VERSION_ID;

						new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "calculation-versions")
						.setRequestParameters({
							"calculate" : "true",
							"action" : sSaveType
						}).run();
					});
				});

				it("missing mandatory action parameter -> should raise validation error and indicate unsuccessful validation", function() {

					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_VERSION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "calculation-versions").run();
				});
			});

			describe("close requests", function() {

				var oValidRequestPayload = {
						CALCULATION_VERSION_ID : testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0],
				};

				it("valid create request -> should successfully validate and return validated data with correct data types", function() {
					// arrange
					var oRequest = createRequestMock(oValidRequestPayload, {
						"action" : "close"
					}, $.net.http.POST);
					var oValidatorInput = new ValidatorInput(oRequest, "calculation-versions");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);
					expect(oValidatedRequest.parameters.action).toBe("close");
				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "calculation-versions")
					.setRequestParameters({
						"action" : "close"
					}).run();
				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_VERSION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "calculation-versions")
					.setRequestParameters({
						"action" : "close"
					}).run();
				});
			});

			describe("delete requests", function() {

				var oValidRequestPayload = {
						CALCULATION_VERSION_ID : testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0],
				};

				it("valid create request -> should successfully validate and return validated data with correct data types", function() {
					// arrange
					var oRequest = createRequestMock(oValidRequestPayload, {}, $.net.http.DEL);
					var oValidatorInput = new ValidatorInput(oRequest, "calculation-versions");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);
				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation",
						function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.DEL,"calculation-versions").run();
				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation",
						function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_VERSION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.DEL, "calculation-versions").run();
				});
			});
		});

		describe("validate calculation requests", function() {

			describe("get requests", function() {

				it("valid get request with empty body -> should successfully validate, return no data and have correct id-parameter value",
						function() {
					// arrange
					var oRequest = createRequestMock(undefined, {}, $.net.http.GET);
					var oValidatorInput = new ValidatorInput(oRequest, "calculations");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					expect(validator.data).not.toBeDefined();
				});

				it("invalid request with body content -> should raise validation error and indicate unsuccessful validation", function() {
					new ValidationFailTestBuilder({}, $.net.http.GET, "calculations").run();
				});

				it("invalid parameter -> should raise validation error and indicate unsuccessful validation", function() {
					new ValidationFailTestBuilder({}, $.net.http.GET, "calculations").setRequestParameters({
								"calculate" : "true"
							}).run();
				});

			});

			describe("update requests", function() {

				var oValidRequestPayload = {
						CALCULATION_ID : testData.oCalculationTestData.CALCULATION_ID[0],
						CALCULATION_NAME : testData.oCalculationTestData.CALCULATION_NAME[0],
						PROJECT_ID : testData.oCalculationTestData.PROJECT_ID[0],
						CURRENT_CALCULATION_VERSION_ID : testData.oCalculationTestData.CURRENT_CALCULATION_VERSION_ID[0],
						LAST_MODIFIED_ON : testData.oCalculationTestData.LAST_MODIFIED_ON[0]
				};

				it("valid get request with empty body -> should successfully validate, return no data and have correct id-parameter value",
						function() {
					// arrange
					var oRequest = createRequestMock(oValidRequestPayload, {}, $.net.http.PUT);
					var oValidatorInput = new ValidatorInput(oRequest, "calculations");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidRequestPayload);

				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.PUT, "calculations").run();
				});

				it("read-only and not transferable property in request -> should raise validation error and indicate unsuccessful validation",
						function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.CREATED_ON = new Date().toJSON();

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.PUT, "calculations").run();
				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.PUT, "calculations").run();
				});

			});

			describe("create requests", function() {

				var oValidRequestPayload = {
						CALCULATION_ID : -1,
						CALCULATION_NAME : testData.oCalculationTestData.CALCULATION_NAME[0],
						PROJECT_ID : testData.oCalculationTestData.PROJECT_ID[0],
						CALCULATION_VERSIONS : [ {
							CALCULATION_ID : -1,
							CALCULATION_VERSION_ID : -1,
							CALCULATION_VERSION_NAME : testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_NAME[0],
							VALUATION_DATE : "2011-08-20",
							REPORT_CURRENCY_ID : testData.oCalculationVersionTemporaryTestData.REPORT_CURRENCY_ID[0],
							ROOT_ITEM_ID : testData.oCalculationVersionTemporaryTestData.ROOT_ITEM_ID[0],
							ACTIVITY_PRICE_STRATEGY_ID: sStandardPriceStrategy,
							MATERIAL_PRICE_STRATEGY_ID: sStandardPriceStrategy,
							ITEMS : [ {
								CALCULATION_VERSION_ID : -1,
								IS_ACTIVE : 1,
								ITEM_ID : -1,
								PRICE_FIXED_PORTION : "1",
								PRICE_VARIABLE_PORTION : "1",
								TRANSACTION_CURRENCY_ID : testData.oItemTemporaryTestData.TRANSACTION_CURRENCY_ID[0],
								PRICE_UNIT : testData.oItemTemporaryTestData.PRICE_UNIT[0],
								PRICE_UNIT_UOM_ID : testData.oItemTemporaryTestData.PRICE_UNIT_UOM_ID[0],
								TOTAL_QUANTITY : 1,
								TOTAL_QUANTITY_UOM_ID : testData.oItemTemporaryTestData.TOTAL_QUANTITY_UOM_ID[0],
							} ]
						} ]
				}

				it("valid get request with empty body -> should successfully validate, return no data and have correct id-parameter value",
						function() {
					// arrange
					var oRequest = createRequestMock(oValidRequestPayload, {"action":"create"}, $.net.http.POST);
					
					var oValidatorInput = new ValidatorInput(oRequest, "calculations");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);

					// checkValues cannot handle complex object; so the complex validated object needs to be reduced to
					// key-value-pair baed JS object (with out sub-objects and arrays)
					var oValidatedCalculation = oValidatedRequest.data[0];
					checkValues(_.omit(oValidatedCalculation, "CALCULATION_VERSIONS")).against(
							_.omit(oValidRequestPayload, "CALCULATION_VERSIONS"));
					checkValues(_.omit(oValidatedCalculation.CALCULATION_VERSIONS[0], "ITEMS")).against(
							_.omit(oValidRequestPayload.CALCULATION_VERSIONS[0], "ITEMS"));
					checkValues(oValidatedCalculation.CALCULATION_VERSIONS[0].ITEMS[0]).against(
							oValidatedCalculation.CALCULATION_VERSIONS[0].ITEMS[0]);

				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "calculations").run();
				});

				it("read-only and not transferable property in request -> should raise validation error and indicate unsuccessful validation",
						function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					oInvalidRequestPayload.CREATED_ON = new Date().toJSON();

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "calculations").run();
				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.POST, "calculations").run();
				});

			});

			describe("delete requests", function() {

				var oValidUpdateRequestPayload = {
						CALCULATION_ID : testData.oCalculationTestData.CALCULATION_ID[0]
				};

				it("valid get request with empty body -> should successfully validate, return no data and have correct id-parameter value",
						function() {
					// arrange
					var oRequest = createRequestMock(oValidUpdateRequestPayload, {}, $.net.http.DEL);
					var oValidatorInput = new ValidatorInput(oRequest, "calculations");

					// act
					var oValidatedRequest = validator.validate(oValidatorInput);

					// assert
					expect(validator.validationSuccess).toBe(true);
					checkValues(oValidatedRequest.data[0]).against(oValidUpdateRequestPayload);

				});

				it("unknown property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidUpdateRequestPayload);
					oInvalidRequestPayload.UNKNOWN_PROPERTY = "UNKNOWN_PROPERTY";

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.DEL, "calculations").run();
				});

				it("read-only and not transferable property in request -> should raise validation error and indicate unsuccessful validation",
						function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidUpdateRequestPayload);
					oInvalidRequestPayload.CALCULATION_NAME = new Date().toJSON();

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.DEL, "calculations").run();
				});

				it("missing mandatory property in request -> should raise validation error and indicate unsuccessful validation", function() {
					// arrange
					var oInvalidRequestPayload = _.clone(oValidUpdateRequestPayload);
					delete oInvalidRequestPayload.CALCULATION_ID;

					new ValidationFailTestBuilder(oInvalidRequestPayload, $.net.http.DEL,"calculations").run();
				});

			});
		});
		
	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}