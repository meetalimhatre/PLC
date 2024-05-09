var _ = require("lodash");
var helpers = require("../../../lib/xs/util/helpers");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var MessageLibrary = require("../../../lib/xs/util/message");
var PlcException = MessageLibrary.PlcException;
var Code = MessageLibrary.Code;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe("xsjs.validator.businessObjectValidatorUtils-tests", function() {

		var oSyntaxValidatorMock;
		var utils;
		var sDummyBusinessObject = "DummyBusinessObject";

		beforeEach(function() {
			oSyntaxValidatorMock = jasmine.createSpyObj("oSyntaxValidatorMock", [ "validateValue" ]);

			oSyntaxValidatorMock.validateValue.and.callFake(function() {
				return oSyntaxValidatorMock.validateValue.calls.mostRecent().args[0];
			});

			utils = new BusinessObjectValidatorUtils(sDummyBusinessObject, oSyntaxValidatorMock);

			spyOn($.trace, 'error');
			spyOn(helpers, 'logError').and.callFake(function(msg) {
				$.trace.error(msg);
			});
		});

		function checkException(exception, code) {
			code = code || Code.GENERAL_VALIDATION_ERROR;

			expect(exception).toBeDefined();
			/**
			 * TODO: toEqual in XSA, it compare the json.stringified actual and expected value, causes error here
			 * Use instanceof as a walkaround solution
			 */
			//expect(exception).toEqual(jasmine.any(PlcException));
			expect(exception instanceof PlcException).toBe(true);
			expect(exception.code).toEqual(code);
		}

		describe("tryParseJson", function() {

			it("should return JS object if valid JSON string was passed", function() {
				// arrange
				var oInput = {
						PROP : "value"
				};
				var sValidJsonString = JSON.stringify(oInput);

				// act
				var oOutput = utils.tryParseJson(sValidJsonString);

				// assert
				expect(oOutput).toEqual(oInput);
			});

			it("should raise GENERAL_VALIDATION_ERROR if a invalid JSON string is passed", function() {
				// arrange
				var sInValidJsonString = "foobar";
				var exception;

				// act
				try {
					utils.tryParseJson(sInValidJsonString);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
				expect($.trace.error).toHaveBeenCalledWith(
				        `Cannot parse string during validation of ${sDummyBusinessObject}. Error: Unexpected token o in JSON at position 1`);
			});
		});

		describe("checkEmptyBody", function() {

			it("should pass check if body is undefined, null or an empty string", function() {
				// arrange
				_.each([ undefined, null, "" ], function(body) {
					// act (assert = no exception occurs)
					try {
						utils.checkEmptyBody(body);
					} catch (e) {
						// should not be reached
						jasmine.log("There should no exception occur");
						expect(false).toBe(true);
					}
				});
			});

			it("should pass check if body is empty string or body is of type $.web.Body and asString() returns empty string", function() {
				var aBodies = [ "", {
					asString : function() {
						return "";
					}
				} ]
				_.each(aBodies, function(body) {
					// act (assert = no exception occurs)
					try {
						utils.checkEmptyBody(body);
					} catch (e) {
						// should not be reached
						jasmine.log("There should no exception occur");
						expect(false).toBe(true);
					}
				});
			});

			it("should raise GENERAL_VALIDATION_ERROR if body is non-empty string or body is of type $.web.Body and asString() "
					+ "returns non-empty string", function() {
						var aBodies = [ "foo", {
							asString : function() {
								return "bar";
							}
						} ]
						_.each(aBodies, function(body) {
							// act
							var exception;

							try {
								utils.checkEmptyBody(body);
							} catch (e) {
								exception = e;
							}

							// assert
							checkException(exception);
						});
						expect($.trace.error).toHaveBeenCalledWith(
				            `Expected an empty body during validation of ${sDummyBusinessObject}, but the body contained 3 characters.`);
					});
		});

		describe("checkMandatoryProperties", function() {

			it("should raise GENERAL_UNEXPECTED_EXCEPTION if mode is neither 'notNull' nor 'included'", function() {
				// arrange
				var sInvalidMode = "invalid";
				var exception;

				try {
					utils.checkMandatoryProperties({}, [], sInvalidMode);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception, Code.GENERAL_UNEXPECTED_EXCEPTION);
			});

			it("should pass if mandatory properties are included and not null for mode 'notNull' and 'included'", function() {
				// arrange
				var aMandatoryProperties = [ "M1", "M2" ];
				var oInput = {
						M1 : 1,
						M2 : 2,
						foo : "bar"
				};

				// act (assert = no exception occurs)
				_.each([ "included", "notNull" ], function(sMode) {
					try {
						utils.checkMandatoryProperties(oInput, aMandatoryProperties, sMode);
					} catch (e) {
						// should not be reached
						jasmine.log("There should no exception occur");
						expect(false).toBe(true);
					}
				});
			});

			it("should raise GENERAL_VALIDATION_ERROR if mandatory property is set to null for mode 'notNull' and 'included'", function() {
				// arrange
				var aMandatoryProperties = [ "M1" ];
				var oInput = {
						M1 : null
				};

				// act (assert = no exception occurs)
				_.each([ "included", "notNull" ], function(sMode) {
					var exception;
					try {
						utils.checkMandatoryProperties(oInput, aMandatoryProperties, sMode);
					} catch (e) {
						exception = e;
					}

					// assert
					checkException(exception);
				});
			});

			it("should pass if mandatory properties are not included for mode 'notNull'", function() {
				// arrange
				var aMandatoryProperties = [ "M1", "M2" ];
				var oInput = {
						foo : "bar"
				};

				// act (assert = no exception occurs)
				try {
					utils.checkMandatoryProperties(oInput, aMandatoryProperties, "notNull");
				} catch (e) {
					// should not be reached
					jasmine.log("There should no exception occur");
					expect(false).toBe(true);
				}
			});

			it("should raise GENERAL_VALIDATION_ERROR if mandatory property are not included for mode 'included'", function() {
				// arrange
				var aMandatoryProperties = [ "M1" ];
				var oInput = {
						foo : "bar"
				};
				var exception;

				// act
				try {
					utils.checkMandatoryProperties(oInput, aMandatoryProperties, "included");
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
			});
		});

		describe("checkInvalidProperties", function() {

			it("should pass check if object only contains valid properties", function() {
				// arrange
				var aValidProperties = [ "M1" ];
				var oInput = {
						M1 : 1
				};

				// act (assert = no exception occurs)
				try {
					utils.checkInvalidProperties(oInput, aValidProperties);
				} catch (e) {
					// should not be reached
					jasmine.log("There should no exception occur");
					expect(false).toBe(true);
				}

			});

			it("should raise GENERAL_VALIDATION_ERROR if input object contain invalid property", function() {
				// arrange
				var oInput = {
						foo : "bar"
				};
				var exception;

				// act
				try {
					utils.checkInvalidProperties(oInput, []);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
			});
		});

		describe("checkEntity", function() {

			beforeEach(function() {
				oSyntaxValidatorMock.validateValue.calls.reset();
			});

			function createInput(iReadOnly, iTransferable, iMandatory) {
				var aMetadata = [ {
					COLUMN_ID : "property1",
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES : "length=260;",
					ATTRIBUTES : [ {
						ITEM_CATEGORY_ID : 1,
						SUBITEM_STATE : 1,
						IS_READ_ONLY : iReadOnly,
						IS_MANDATORY : iMandatory,
						IS_TRANSFERABLE : iTransferable
					} ]
				} ];

				var oInputEntity = {
						property1 : "foobar"
				}

				var oFunctionInput = {
						entity : oInputEntity,
						categoryId : 1,
						subitemState : 1,
						metadata : aMetadata
				}
				return oFunctionInput;
			}

            it("should return validated object if input object correspond to given metadata when metadata has more than one attribute", function() {
				// arrange
				const oMetadata = {
					COLUMN_ID : "property1",
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES : "length=260;",
					ATTRIBUTES : [ {
						ITEM_CATEGORY_ID : 1,
						SUBITEM_STATE : 1,
						IS_READ_ONLY : 0,
						IS_MANDATORY : 0,
						IS_TRANSFERABLE : 0
					}, {
						ITEM_CATEGORY_ID : -1,
						SUBITEM_STATE : -1,
						IS_READ_ONLY : 0,
						IS_MANDATORY : 0,
						IS_TRANSFERABLE : 0
					}, {
						ITEM_CATEGORY_ID : -1,
						SUBITEM_STATE : -1,
						IS_READ_ONLY : 0,
						IS_MANDATORY : 0,
						IS_TRANSFERABLE : 0
					} ]
				}
				const oInputCreated = createInput(0, 0, 0);
                let oInput = _.clone(oInputCreated);
                delete oInput.metadata[0];
                oInput.metadata[0] = oMetadata;
				// act
				const oOutputEntity = utils.checkEntity(oInput);

				// assert
				expect(oOutputEntity).toEqual(oInput.entity);
				expect(oSyntaxValidatorMock.validateValue.calls.allArgs()).toEqual(
						[ [ oInput.entity.property1, oInput.metadata[0].SEMANTIC_DATA_TYPE, oInput.metadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES,
						    false , undefined ] ]);
			});
			
            it("should return validated object if input object correspond to given metadata when metadata has more than one attribute when using caching", function() {
				// arrange
				const aMetadata = [{
				    COLUMN_ID: "property1",
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES : "length=260;",
					ATTRIBUTES : [{
                		ITEM_CATEGORY_ID : 1,
                		SUBITEM_STATE : 0,
                		IS_READ_ONLY : 1,
                		IS_MANDATORY : 1,
                		IS_TRANSFERABLE : 1
                	},{
                		ITEM_CATEGORY_ID : 0,
                		SUBITEM_STATE : 1,
                		IS_READ_ONLY : 0,
                		IS_MANDATORY : 0,
                		IS_TRANSFERABLE : 0
                	}]
				},{
				    COLUMN_ID: "property2",
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES : "length=50;",
					ATTRIBUTES : [{
                		ITEM_CATEGORY_ID : 1,
                		SUBITEM_STATE : 0,
                		IS_READ_ONLY : 1,
                		IS_MANDATORY : 1,
                		IS_TRANSFERABLE : 1
                	},{
                		ITEM_CATEGORY_ID : 0,
                		SUBITEM_STATE : 1,
                		IS_READ_ONLY : 0,
                		IS_MANDATORY : 0,
                		IS_TRANSFERABLE : 0
                	}]
				}];
				const oInputCreated = createInput(0, 0, 0);
                let oInput = new TestDataUtility(oInputCreated).build();
                let aMetadataProperties = new TestDataUtility(aMetadata).build();
                oInput.metadata[0] = aMetadataProperties[0];
                oInput.subitemState = 0;

                let oOtherInput = new TestDataUtility(oInputCreated).build();
                oOtherInput.metadata[0] = aMetadataProperties[1];
                delete oOtherInput.entity.property1;
                oOtherInput.entity.property2 = "foo";
                oOtherInput.categoryId = 0;
				// act
				let i = 5;
				while(i > 0) {
    				const oOutputEntity = utils.checkEntity(oInput);
    				expect(oOutputEntity).toEqual(oInput.entity);
    				expect(oSyntaxValidatorMock.validateValue.calls.mostRecent().args).toEqual(
    					[ oInput.entity.property1, oInput.metadata[0].SEMANTIC_DATA_TYPE, oInput.metadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES, false , undefined]
					);
                    const oOutputOtherEntity = utils.checkEntity(oOtherInput);
    				expect(oOutputOtherEntity).toEqual(oOtherInput.entity);
					expect(oSyntaxValidatorMock.validateValue.calls.mostRecent().args).toEqual(
						[oOtherInput.entity.property2, oOtherInput.metadata[0].SEMANTIC_DATA_TYPE, oOtherInput.metadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES, false , undefined]
					);
    			    i--;			    
				}
			});
			
            it("should return the validated object without the attribute that is not in sync with any metadata attributes", function() {
				// arrange
				const oMetadata = {
					COLUMN_ID : "property1",
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES : "length=260;",
					ATTRIBUTES : [ {
						ITEM_CATEGORY_ID : -1,
						SUBITEM_STATE : -1,
						IS_READ_ONLY : 0,
						IS_MANDATORY : 0,
						IS_TRANSFERABLE : 0
					} ]
				}
				const oInputCreated = createInput(0, 0, 0);
                let oInput = _.clone(oInputCreated);
                delete oInput.metadata[0];
                oInput.metadata[0] = oMetadata;
				// act
				const oOutputEntity = utils.checkEntity(oInput);

				// assert
				expect(oOutputEntity.hasOwnProperty("property1")).toBeFalsy();
			});
			
			it("should raise GENERAL_VALIDATION_ERROR if a given attribute has multiple matches in the metadata attributes", function() {
				// arrange
				let exception = null;
				const oMetadata = {
					COLUMN_ID : "property1",
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES : "length=260;",
					ATTRIBUTES : [ {
						ITEM_CATEGORY_ID : -1,
						SUBITEM_STATE : -1,
						IS_READ_ONLY : 0,
						IS_MANDATORY : 0,
						IS_TRANSFERABLE : 0
					} ]
				}
				const oInputCreated = createInput(0, 0, 0);
                let oInput = _.clone(oInputCreated);
                delete oInput.metadata[0];
                oInput.metadata[0] = oMetadata;
                oInput.metadata[1] = oMetadata;
				// act
				try {
					utils.checkEntity(oInput);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
			});
			
			it("should return validated objects if input object correspond to given metadata using caching maps", function() {
				// arrange
				const oInput = createInput(0, 0, 0);
                const aOutputEntities = [];
                let i = 5;
				// act
				while(i > 0) {
				    aOutputEntities.push(utils.checkEntity(oInput));
                    i--;
				}

				// assert
				aOutputEntities.forEach(oOutputEntity => {
				  	expect(oOutputEntity).toEqual(oInput.entity);
				});
			});
			
			it("should return validated object if input object correspond to given metadata", function() {
				// arrange
				var oInput = createInput(0, 0, 0);

				// act
				var oOutputEntity = utils.checkEntity(oInput);

				// assert
				expect(oOutputEntity).toEqual(oInput.entity);
				expect(oSyntaxValidatorMock.validateValue.calls.allArgs()).toEqual(
						[ [ oInput.entity.property1, oInput.metadata[0].SEMANTIC_DATA_TYPE, oInput.metadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES,
						    false , undefined ] ]);
			});

			it("should return validated object if input object contains a read-only but transferable property", function() {
				// arrange
				var oInput = createInput(1, 1, 0);

				// act
				var oOutputEntity = utils.checkEntity(oInput);

				// assert
				expect(oOutputEntity).toEqual(oInput.entity);
				expect(oSyntaxValidatorMock.validateValue.calls.allArgs()).toEqual(
						[ [ oInput.entity.property1, oInput.metadata[0].SEMANTIC_DATA_TYPE, oInput.metadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES,
						    false, undefined ] ]);
			});

			it("should raise GENERAL_VALIDATION_ERROR if input object contains read-only property", function() {
				// arrange
				var oInput = createInput(1, 0, 0);
				var exception;

				// act
				try {
					utils.checkEntity(oInput);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
			});

			it("should not raise GENERAL_VALIDATION_ERROR if input object contains read-only custom property like CUST_<>_IS_MANUAL which has rollup type, has children and has value 0", function() {
				// arrange
                var aMetadata = [ {
					COLUMN_ID : "CUST_TEST_IS_MANUAL",
					SEMANTIC_DATA_TYPE : "BooleanInt",
					IS_CUSTOM : 1,
					ROLLUP_TYPE_ID : 4,
					ATTRIBUTES : [ {
						ITEM_CATEGORY_ID : 1,
						SUBITEM_STATE : 1,
						IS_READ_ONLY : 1,
						IS_MANDATORY : 0
					} ]
				} ];

				var oInputEntity = {
					CUST_TEST_IS_MANUAL : 0
				};

				var oInput = {
					entity : oInputEntity,
					categoryId : 1,
					subitemState : 1,
					metadata : aMetadata
				};

				// act
                var oOutputEntity = utils.checkEntity(oInput);

				// assert
				expect(oOutputEntity).toEqual(oInput.entity);
				expect(oSyntaxValidatorMock.validateValue.calls.allArgs()).toEqual(
						[ [ oInput.entity.CUST_TEST_IS_MANUAL, oInput.metadata[0].SEMANTIC_DATA_TYPE, undefined, false, undefined ] ]);
			});

			it("should raise GENERAL_VALIDATION_ERROR if input object a syntactical incorrect value", function() {
				// arrange
				var oInput = createInput(0, 0, 0);

				var oFailingSyntaxValidatorMock = jasmine.createSpyObj("oSyntaxValidatorMock", [ "validateValue" ]);

				oFailingSyntaxValidatorMock.validateValue.and.callFake(function() {
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR);
				});

				var otherUtils = new BusinessObjectValidatorUtils("DummyBusinessObject", oFailingSyntaxValidatorMock);
				var exception

				// act
				try {
					otherUtils.checkEntity(oInput);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
			});

			it("should raise GENERAL_VALIDATION_ERROR if input object contains a invalid property", function() {
				var oInput = createInput(0, 0, 0);
				oInput.entity["invalidProperty"] = null;

				var exception;

				// act
				try {
					utils.checkEntity(oInput);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
			});

			// TODO (RF): Test can be enabled if Vladimir's workaround to delete invalid properties from the object is removed from production
			// code
			xit("should raise GENERAL_VALIDATION_ERROR if input object contains a invalid property for the current object context", function() {
				var oInput = createInput(0, 0, 0);
				// removing the attributes array means that there is no object context that allows this property
				oInput.metadata.ATTRIBUTES = [];

				var exception;

				// act
				try {
					utils.checkEntity(oInput);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
			});

			it("should raise GENERAL_VALIDATION_ERROR if input object misses a mandatory property", function() {
				// arrange
				var oInput = createInput(0, 0, 1);
				delete oInput.entity["property1"];
				var exception;

				// act
				try {
					utils.checkEntity(oInput);
				} catch (e) {
					exception = e;
				}

				// assert
				checkException(exception);
			});
			
			it("should raise GENERAL_VALIDATION_ERROR if the input object has a read only field (caching available for another PATH with the same field but not read only)",() => {
				// arrange
				let oExceptionFirstCase = null;
				let oExceptionSecondCase = null;
				const oMetadataProperty1Resource1 = {
					COLUMN_ID: "property1",
					SEMANTIC_DATA_TYPE: "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES: "length=260;",
					PATH: "Resource1",
					ATTRIBUTES: [{
						ITEM_CATEGORY_ID: 1,
						SUBITEM_STATE: 1,
						IS_READ_ONLY:0,
						IS_MANDATORY: 0,
						IS_TRANSFERABLE: 0,
					}],
				};
				const oMetadataProperty1Resource2 = {
					COLUMN_ID: "property1",
					SEMANTIC_DATA_TYPE: "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES: "length=260;",
					PATH: "Resource2",
					ATTRIBUTES: [{
						ITEM_CATEGORY_ID: 1,
						SUBITEM_STATE: 1,
						IS_READ_ONLY: 1,
						IS_MANDATORY: 0,
						IS_TRANSFERABLE: 0,
					}],
				};
				const oInputCreated = createInput(1, 0, 0);
				const oFirstInput = new TestDataUtility(oInputCreated).build();
				oFirstInput.metadata[0] = oMetadataProperty1Resource1;
				const oSecondInput = new TestDataUtility(oInputCreated).build();
				oSecondInput.metadata[0] = oMetadataProperty1Resource2;
				// act
				try {
					utils.checkEntity(oFirstInput);
				} catch (e) {
					oExceptionFirstCase = e;
				}
			
				try {
					utils.checkEntity(oSecondInput);
				} catch (e) {
					oExceptionSecondCase = e;
				}
			
				// assert
				checkException(oExceptionSecondCase);
				expect(oExceptionSecondCase.developerMessage).toContain("read-only");
				expect(oExceptionFirstCase).toBe(null);
			});
		});

		describe("checkNonTemporaryMasterdataReferences", function() {

			it("should pass the check of entity has only references to valid masterdata values", function() {
				// arrange
				var oEntity = {
						MD : "validValue"
				};
				var aMdProperties = [ "MD" ];
				var oValidValues = new Set(["validValue"]);

				// act (assert = no exception occurs)
				try {
					utils.checkNonTemporaryMasterdataReferences(oEntity, aMdProperties, oValidValues);
				} catch (e) {
					// should not be reached
					jasmine.log("There should no exception occur");
					expect(false).toBe(true);
				}
			});

			it("should pass the check of entity has no references to masterdata", function() {
				// arrange
				var oEntity = {
						non_md_prop : "validValue"
				};
				var aMdProperties = [];
				var oValidValues = new Set();

				// act (assert = no exception occurs)
				try {
					utils.checkNonTemporaryMasterdataReferences(oEntity, aMdProperties, oValidValues);
				} catch (e) {
					// should not be reached
					jasmine.log("There should no exception occur");
					expect(false).toBe(true);
				}
			});

			it("should raise GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if entity references invalid masterdata values", function() {
				// arrange
				var oEntity = {
						MD : "validValue"
				};
				var aMdProperties = [ "MD" ];
				var oValidValues = new Set();
				var exception;

				// act
				try {
					utils.checkNonTemporaryMasterdataReferences(oEntity, aMdProperties, oValidValues);
				} catch (e) {
					exception = e;
				}
			});

		});
		
	}).addTags(["All_Unit_Tests"]);
}