var _ = require("lodash");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var ValidationInfoCode = MessageLibrary.ValidationInfoCode;
var customfieldsformulaValidatorLibrary = $.import("xs.validator", "customfieldsformulaValidator");
var CustomfieldsformulaValidator = customfieldsformulaValidatorLibrary.CustomfieldsformulaValidator;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

var oConnectionMock = null;
var oPersistencyMock = null;
var oAdministrationMock = null;
var oHelperMock = null;
var BusinessObjectValidatorUtilsMock = null;
var mValidatedParameters = null;
var oMetadataProviderMock = null;
var oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
var oExpectedErrorCodeNotFound = MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR;
var oCustomfieldsformulaValidator;

var oMockstar = null;
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.customfieldsformulaValidator-tests', function() {
		var oLanguageTestData  = {
		        "LANGUAGE" : ["EN", "DE", "FR"],
				"TEXTS_MAINTAINABLE": [1, 1, 0],
				"_VALID_FROM": ["2015-06-02T14:45:50.096Z","2015-06-02T14:45:50.096Z","2015-06-02T14:45:50.096Z"],
				"_SOURCE": [1,1,1],
		        "_CREATED_BY": ["U000","U000","U000"]
		};
		
		beforeOnce(function(){
		    oMockstar = new MockstarFacade( // Initialize Mockstar
		        {
		            substituteTables: // substitute all used tables in the procedure or view
		            {
		            	session : "sap.plc.db::basis.t_session",
						language: "sap.plc.db::basis.t_language",
						regex: "sap.plc.db::basis.t_regex"
		            }
		        });
		});

		afterOnce(function() {
			oMockstar.cleanup();
		});

		beforeEach(function() {
			
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', [ 'get' ]);

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Customfieldsformula);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEntity", "checkMandatoryProperties");
			// arrange the mock of checkEntity that to return the entity with which it was called; bypasses any validation, but keeps the 
			// contract of the method
			BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(function() {
				var oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
				return oLastCallEntity;
			});

			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();
			
			oAdministrationMock = jasmine.createSpyObj("oAdministrationMock",["getAdministration"]);
			oAdministrationMock.getAdministration.and.returnValue(oLanguageTestData);

			oHelperMock = jasmine.createSpyObj("oHelperMock",["getRegexValue"]);
			var sRegex = "(?i)^((http|https|ftp|sftp)(:\/\/)[\p{L}0-9_-]+(\.[\p{L}0-9_-]+)*(:[1-9][0-9]{1,4})?(\/[\S]*)*)?$";
			oHelperMock.getRegexValue.and.returnValue(sRegex);
			
			var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "getSessionDetails" ]);
			oPersistencySessionMock.getSessionDetails.and.returnValue({
				userId : "userId",
				sessionId : "sessionId",
				language : "DE"
			});
			
			oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "getConnection" ]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);
			oPersistencyMock.Administration = oAdministrationMock;
			oPersistencyMock.Session = oPersistencySessionMock;
			oPersistencyMock.Helper = oHelperMock;
			
			oCustomfieldsformulaValidator = new CustomfieldsformulaValidator(oPersistencyMock, oMockstar.userSchema, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);

			mValidatedParameters = {
					"checkCanExecute" : true
			};
		});


		var params = [];
		params.get = function() {
			return undefined;
		};

		function createRequest(oBody, oHTTPMethod) {
			var oRequest = {
					queryPath : "customfieldsformula",
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
		
		it('should throw exception if the request object contains other properties besides the create, delete, update', function() {
			//arrange
			var oMetadataTestData1 = {
					"CREATE_TEST": [{"PATH" : "Item"}]
			};
			var exception;
			var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
			//act
			try {
				var result = oCustomfieldsformulaValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}
			
			$.trace.error("CFF Error");
			$.trace.error(JSON.stringify(exception));
			$.trace.error(exception.stack);
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		
	
		});	
	
		describe('Delete', function() {
			it('should throw exception  if on Delete mandatory properties are missing', function() {
				var oMetadataTestData1 = {
						"DELETE" : [{"PATH" : "Item",
							"COLUMN_ID" : "TEST"}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if on Delete there are some other properties besides the mandatory ones', function() {
				var oMetadataTestData1 = {
						"DELETE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "TEST"},
							{"PATH" : "Item",
								"BUSINESS_OBJECT": "Item",
								"COLUMN_ID" : "TEST1", 
								"SEMANTIC_DATA_TYPE" : "Integer"}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception  if on Delete mandatory properties are missing', function() {
				var oMetadataTestData1 = {
				        "CREATE" : [{"PATH" : "Item",
            			"BUSINESS_OBJECT": "Item",
            			"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
            			"SEMANTIC_DATA_TYPE": "String",
            			"SIDE_PANEL_GROUP_ID" : 101,
            			"ROLLUP_TYPE_ID" : 0,
            			"UOM_CURRENCY_FLAG" : 1,
            			"PROPERTY_TYPE": 6,
            			"TEXT": [{
            				"PATH" : "Item",
            				"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
            				"LANGUAGE" : "EN",
            				"DISPLAY_NAME" : "Testing"},
            				{"PATH" : "Item",
            					"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
            					"LANGUAGE" : "DE",
            					"DISPLAY_NAME" : "Testing"}
            				],
            			"ATTRIBUTES": [{
            				"PATH" : "Item",
            				"BUSINESS_OBJECT": "Item",
            				"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
            				"ITEM_CATEGORY_ID" : 1,
            				"DEFAULT_VALUE": 1
            			}]}],
						"DELETE" : [{"PATH" : "Item",
							"COLUMN_ID" : "TEST"}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody,mValidatedParameters);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});			
		});
	
		describe('Create', function() {
			it('should throw exception  if on Create the COLUMN_ID does not follows the naming convention', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"UOM_CURRENCY_FLAG": 0,
							"SIDE_PANEL_GROUP_ID" : 101}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if on Create the texts are missing', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": []}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if on Create texts are missing for available languages', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{ "PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"}
							]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if on Create there are texts for an unavailable language', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{ "PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{ "PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "RO",
									"DISPLAY_NAME" : "Testing"}
								]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if on Create there are names that have lenght more than 250 characters', function() {
				// generate a 251 chars long string
				var sLongDisplayName = "";
				for (let i=0; i<25; i++)  {
					sLongDisplayName += "0123456789";
				}
				sLongDisplayName += "0";
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{ "PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : sLongDisplayName},
								{ "PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "RO",
									"DISPLAY_NAME" : "Testing"}
								]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception  if on Create there are descriptions that have lenght more than 5000 characters', function() {
				// generate a 50001 chars long string
				var sLongDisplayDescription = "";
				for (let i=0; i<500; i++)  {
					sLongDisplayDescription += "0123456789";
				}
				sLongDisplayDescription += "0";
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{ "PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_DESCRIPTION" : sLongDisplayDescription},
								{ "PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "RO",
									"DISPLAY_NAME" : "Testing"}
								]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception  if on Create the Business Object is unknown', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Controlling",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{ "PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{ "PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if the semantic data types is not correct', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "PositiveInteger",
							"SIDE_PANEL_GROUP_ID" : 101,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{ "PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{ "PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if rollup type id does not exist for semantic data type', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "String",
							"SIDE_PANEL_GROUP_ID" : 101,
							"ROLLUP_TYPE_ID" : 1,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{"PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{ "PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if attribute key is different than of the metadata key', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"ROLLUP_TYPE_ID" : 1,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{
								"PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{"PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								],
								"ATTRIBUTES": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_TEST1",
									"ITEM_CATEGORY_ID" : 1,
									"DEFAULT_VALUE": 1
								}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});

			it('should throw exception  if attribute default value is more than 5000 characters', function() {
			    // generate a 251 chars long string
                var sLongDefaultValue = "";
                for (let i=0; i<500; i++)  {
                    sLongDefaultValue += "0123456789";
                }
				sLongDefaultValue += "0";
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "String",
							"SIDE_PANEL_GROUP_ID" : 101,
							"ROLLUP_TYPE_ID" : 1,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{
								"PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{"PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								],
								"ATTRIBUTES": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_TEST",
									"ITEM_CATEGORY_ID" : 2,
									"DEFAULT_VALUE": sLongDefaultValue
								}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);

				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);
			});
	
			it('should throw exception  if formula key is different than of the metadata key', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"ROLLUP_TYPE_ID" : 1,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{
								"PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{"PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								],
								"ATTRIBUTES": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_TEST",
									"ITEM_CATEGORY_ID" : 1,
									"DEFAULT_VALUE": 1
								}],
								"FORMULAS": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"ITEM_CATEGORY_ID" : 1,
									"COLUMN_ID" : "CUST_TEST1",
									"FORMULA_ID" : 1
								}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception  if formula is defined for an item category that is not defined in metadata attributes', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"ROLLUP_TYPE_ID" : 1,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{
								"PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{"PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								],
								"ATTRIBUTES": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_TEST",
									"ITEM_CATEGORY_ID" : 1,
									"DEFAULT_VALUE": 1
								}],
								"FORMULAS": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"ITEM_CATEGORY_ID" : 2,
									"COLUMN_ID" : "CUST_TEST1",
									"FORMULA_ID" : 1
								}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception  if formula is defined for other semantic data type than Integer, Decimal, String and Link', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "LocalDate",
							"SIDE_PANEL_GROUP_ID" : 101,
							"ROLLUP_TYPE_ID" : 0,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{
								"PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{"PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								],
								"ATTRIBUTES": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_TEST",
									"ITEM_CATEGORY_ID" : 1
								}],
								"FORMULAS": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_TEST",
									"ITEM_CATEGORY_ID" : 1,
									"FORMULA_ID" : 1
								}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception  if formula is defined for item category 10 (reference calculation version)', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{
						    "PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"ROLLUP_TYPE_ID" : 0,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{
								"PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{"PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								],
								"ATTRIBUTES": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_TEST",
									"ITEM_CATEGORY_ID" : 10
								}],
								"FORMULAS": [{
									"PATH" : "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID" : "CUST_TEST",
									"ITEM_CATEGORY_ID" : 10, //Formulas for Item Category 10 is not allowed
									"FORMULA_ID" : 1
								}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception  if property type is not defined for currency or uom', function() {
				var oMetadataTestData1 = {
						"CREATE" : [
						            {"PATH" : "Item",
						            	"BUSINESS_OBJECT": "Item",
						            	"COLUMN_ID" : "CUST_TEST_UNIT",
						            	"SEMANTIC_DATA_TYPE": "String",
						            	"SIDE_PANEL_GROUP_ID" : 101,
						            	"ROLLUP_TYPE_ID" : 0,
						            	"UOM_CURRENCY_FLAG": 1,
						            	"TEXT": [{
						            		"PATH" : "Item",
						            		"COLUMN_ID" : "CUST_TEST_UNIT",
						            		"LANGUAGE" : "EN",
						            		"DISPLAY_NAME" : "Testing"},
						            		{"PATH" : "Item",
						            			"COLUMN_ID" : "CUST_TEST_UNIT",
						            			"LANGUAGE" : "DE",
						            			"DISPLAY_NAME" : "Testing"}
						            		],
						            		"ATTRIBUTES": [{
						            			"PATH" : "Item",
						            			"BUSINESS_OBJECT": "Item",
						            			"COLUMN_ID" : "CUST_TEST_UNIT",
						            			"ITEM_CATEGORY_ID" : 1,
						            			"DEFAULT_VALUE": 1
						            		}]},  
						            		{"PATH" : "Item",
						            			"BUSINESS_OBJECT": "Item",
						            			"COLUMN_ID" : "CUST_TEST",
						            			"SEMANTIC_DATA_TYPE": "Integer",
						            			"REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_UNIT1",
						            			"SIDE_PANEL_GROUP_ID" : 101,
						            			"ROLLUP_TYPE_ID" : 0,
						            			"UOM_CURRENCY_FLAG": 0,
						            			"TEXT": [{
						            				"PATH" : "Item",
						            				"COLUMN_ID" : "CUST_TEST",
						            				"LANGUAGE" : "EN",
						            				"DISPLAY_NAME" : "Testing"},
						            				{"PATH" : "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"LANGUAGE" : "DE",
						            					"DISPLAY_NAME" : "Testing"}
						            				],
						            				"ATTRIBUTES": [{
						            					"PATH" : "Item",
						            					"BUSINESS_OBJECT": "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"ITEM_CATEGORY_ID" : 1,
						            					"DEFAULT_VALUE": 1
						            				}],
						            				"FORMULAS": [{
						            					"PATH" : "Item",
						            					"BUSINESS_OBJECT": "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"ITEM_CATEGORY_ID" : 1,
						            					"FORMULA_ID" : 1
						            				}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			
			it('should throw exception  if the Unit is not defined for Uom or Currency, property type 6 or 7', function() {
				var oMetadataTestData1 = {
							  "CREATE": [
							    {
							      "BUSINESS_OBJECT": "Item",
							      "COLUMN_ID": "CUST_TEST_UNIT",
							      "SIDE_PANEL_GROUP_ID": 101,
							      "PATH": "Item",
							      "ATTRIBUTES": [
							        {
							          "BUSINESS_OBJECT": "Item",
							          "COLUMN_ID": "CUST_TEST_UNIT",
							          "PATH": "Item",
							          "ITEM_CATEGORY_ID": 2,
							          "DEFAULT_VALUE": "DAY"
							        }
							      ],
							      "TEXT": [
							        {
							          "PATH": "Item",
							          "COLUMN_ID": "CUST_TEST_UNIT",
							          "LANGUAGE": "EN",
							          "DISPLAY_NAME": "i",
							          "DISPLAY_DESCRIPTION": "i"
							        },
							        {
							          "PATH": "Item",
							          "COLUMN_ID": "CUST_TEST_UNIT",
							          "LANGUAGE": "DE",
							          "DISPLAY_NAME": "i",
							          "DISPLAY_DESCRIPTION": "i"
							        }
							      ],
							      "PROPERTY_TYPE": 5,
							      "REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
							      "REF_UOM_CURRENCY_COLUMN_ID": "",
							      "REF_UOM_CURRENCY_PATH": "",
							      "ROLLUP_TYPE_ID": 0,
							      "SEMANTIC_DATA_TYPE": "String",
							      "UOM_CURRENCY_FLAG": 1,
							      "FORMULAS": []
							    },
							    {
							      "BUSINESS_OBJECT": "Item",
							      "COLUMN_ID": "CUST_TEST",
							      "SIDE_PANEL_GROUP_ID": 101,
							      "PATH": "Item",
							      "ATTRIBUTES": [
							        {
							          "BUSINESS_OBJECT": "Item",
							          "COLUMN_ID": "CUST_TEST",
							          "PATH": "Item",
							          "ITEM_CATEGORY_ID": 2
							        }
							      ],
							      "TEXT": [
							        {
							          "PATH": "Item",
							          "COLUMN_ID": "CUST_TEST",
							          "LANGUAGE": "EN",
							          "DISPLAY_NAME": "i",
							          "DISPLAY_DESCRIPTION": "i"
							        },
							        {
							          "PATH": "Item",
							          "COLUMN_ID": "CUST_TEST",
							          "LANGUAGE": "DE",
							          "DISPLAY_NAME": "i",
							          "DISPLAY_DESCRIPTION": "i"
							        }
							      ],
							      "REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
							      "REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_UNIT",
							      "REF_UOM_CURRENCY_PATH": "Item",
							      "ROLLUP_TYPE_ID": 0,
							      "SEMANTIC_DATA_TYPE": "Decimal",
							      "UOM_CURRENCY_FLAG": 0,
							      "FORMULAS": [
							        {
							          "FORMULA_ID": 0,
							          "PATH": "Item",
							          "BUSINESS_OBJECT": "Item",
							          "COLUMN_ID": "CUST_TEST",
							          "ITEM_CATEGORY_ID": 2,
							          "IS_FORMULA_USED": 0,
							          "FORMULA_STRING": "E()",
							          "FORMULA_DESCRIPTION": ""
							        }
							      ]
							    }
							  ],
							  "UPDATE": [],
							  "DELETE": []
							};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception if for Integer the Unit is not defined for UOM (property type 6)', function() {
				var oMetadataTestData1 = {
							  "CREATE": [
							    {
							      "BUSINESS_OBJECT": "Item",
							      "COLUMN_ID": "CUST_TEST_UNIT",
							      "SIDE_PANEL_GROUP_ID": 101,
							      "PATH": "Item",
							      "ATTRIBUTES": [
							        {
							          "BUSINESS_OBJECT": "Item",
							          "COLUMN_ID": "CUST_TEST_UNIT",
							          "PATH": "Item",
							          "ITEM_CATEGORY_ID": 2,
							          "DEFAULT_VALUE": "DAY"
							        }
							      ],
							      "TEXT": [
							        {
							          "PATH": "Item",
							          "COLUMN_ID": "CUST_TEST_UNIT",
							          "LANGUAGE": "EN",
							          "DISPLAY_NAME": "i",
							          "DISPLAY_DESCRIPTION": "i"
							        },
							        {
							          "PATH": "Item",
							          "COLUMN_ID": "CUST_TEST_UNIT",
							          "LANGUAGE": "DE",
							          "DISPLAY_NAME": "i",
							          "DISPLAY_DESCRIPTION": "i"
							        }
							      ],
							      "PROPERTY_TYPE": 7,
							      "REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
							      "REF_UOM_CURRENCY_COLUMN_ID": "",
							      "REF_UOM_CURRENCY_PATH": "",
							      "ROLLUP_TYPE_ID": 0,
							      "SEMANTIC_DATA_TYPE": "String",
							      "UOM_CURRENCY_FLAG": 1,
							      "FORMULAS": []
							    },
							    {
							      "BUSINESS_OBJECT": "Item",
							      "COLUMN_ID": "CUST_TEST",
							      "SIDE_PANEL_GROUP_ID": 101,
							      "PATH": "Item",
							      "ATTRIBUTES": [
							        {
							          "BUSINESS_OBJECT": "Item",
							          "COLUMN_ID": "CUST_TEST",
							          "PATH": "Item",
							          "ITEM_CATEGORY_ID": 2
							        }
							      ],
							      "TEXT": [
							        {
							          "PATH": "Item",
							          "COLUMN_ID": "CUST_TEST",
							          "LANGUAGE": "EN",
							          "DISPLAY_NAME": "i",
							          "DISPLAY_DESCRIPTION": "i"
							        },
							        {
							          "PATH": "Item",
							          "COLUMN_ID": "CUST_TEST",
							          "LANGUAGE": "DE",
							          "DISPLAY_NAME": "i",
							          "DISPLAY_DESCRIPTION": "i"
							        }
							      ],
							      "REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
							      "REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_UNIT",
							      "REF_UOM_CURRENCY_PATH": "Item",
							      "ROLLUP_TYPE_ID": 0,
							      "SEMANTIC_DATA_TYPE": "Integer",
							      "UOM_CURRENCY_FLAG": 0,
							      "FORMULAS": [
							        {
							          "FORMULA_ID": 0,
							          "PATH": "Item",
							          "BUSINESS_OBJECT": "Item",
							          "COLUMN_ID": "CUST_TEST",
							          "ITEM_CATEGORY_ID": 2,
							          "IS_FORMULA_USED": 0,
							          "FORMULA_STRING": "E()",
							          "FORMULA_DESCRIPTION": ""
							        }
							      ]
							    }
							  ],
							  "UPDATE": [],
							  "DELETE": []
							};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if referenced uom or currency does not exist', function() {
				var oMetadataTestData1 = {
						"CREATE" : [
						            {"PATH" : "Item",
						            	"BUSINESS_OBJECT": "Item",
						            	"COLUMN_ID" : "CUST_TEST_UNIT",
						            	"SEMANTIC_DATA_TYPE": "String",
						            	"SIDE_PANEL_GROUP_ID" : 101,
						            	"PROPERTY_TYPE" : 3,
						            	"ROLLUP_TYPE_ID" : 0,
						            	"UOM_CURRENCY_FLAG": 1,
						            	"TEXT": [{
						            		"PATH" : "Item",
						            		"COLUMN_ID" : "CUST_TEST_UNIT",
						            		"LANGUAGE" : "EN",
						            		"DISPLAY_NAME" : "Testing"},
						            		{"PATH" : "Item",
						            			"COLUMN_ID" : "CUST_TEST_UNIT",
						            			"LANGUAGE" : "DE",
						            			"DISPLAY_NAME" : "Testing"}
						            		],
						            		"ATTRIBUTES": [{
						            			"PATH" : "Item",
						            			"BUSINESS_OBJECT": "Item",
						            			"COLUMN_ID" : "CUST_TEST_UNIT",
						            			"ITEM_CATEGORY_ID" : 1,
						            			"DEFAULT_VALUE": 1
						            		}]},  
						            		{"PATH" : "Item",
						            			"BUSINESS_OBJECT": "Item",
						            			"COLUMN_ID" : "CUST_TEST",
						            			"SEMANTIC_DATA_TYPE": "Integer",
						            			"REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_UNIT1",
						            			"SIDE_PANEL_GROUP_ID" : 101,
						            			"ROLLUP_TYPE_ID" : 0,
						            			"UOM_CURRENCY_FLAG": 0,
						            			"TEXT": [{
						            				"PATH" : "Item",
						            				"COLUMN_ID" : "CUST_TEST",
						            				"LANGUAGE" : "EN",
						            				"DISPLAY_NAME" : "Testing"},
						            				{"PATH" : "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"LANGUAGE" : "DE",
						            					"DISPLAY_NAME" : "Testing"}
						            				],
						            				"ATTRIBUTES": [{
						            					"PATH" : "Item",
						            					"BUSINESS_OBJECT": "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"ITEM_CATEGORY_ID" : 1,
						            					"DEFAULT_VALUE": 1
						            				}],
						            				"FORMULAS": [{
						            					"PATH" : "Item",
						            					"BUSINESS_OBJECT": "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"ITEM_CATEGORY_ID" : 1,
						            					"FORMULA_ID" : 1
						            				}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if referenced uom or currency and the CF have different rollup types', function() {
				var oMetadataTestData1 = {
						"CREATE" : [
						            {"PATH" : "Item",
						            	"BUSINESS_OBJECT": "Item",
						            	"COLUMN_ID" : "CUST_TEST_UNIT",
						            	"SEMANTIC_DATA_TYPE": "String",
						            	"SIDE_PANEL_GROUP_ID" : 101,
						            	"PROPERTY_TYPE" : 3,
						            	"ROLLUP_TYPE_ID" : 4,
						            	"UOM_CURRENCY_FLAG": 1,
						            	"TEXT": [{
						            		"PATH" : "Item",
						            		"COLUMN_ID" : "CUST_TEST_UNIT",
						            		"LANGUAGE" : "EN",
						            		"DISPLAY_NAME" : "Testing"},
						            		{"PATH" : "Item",
						            			"COLUMN_ID" : "CUST_TEST_UNIT",
						            			"LANGUAGE" : "DE",
						            			"DISPLAY_NAME" : "Testing"}
						            		],
						            		"ATTRIBUTES": [{
						            			"PATH" : "Item",
						            			"BUSINESS_OBJECT": "Item",
						            			"COLUMN_ID" : "CUST_TEST_UNIT",
						            			"ITEM_CATEGORY_ID" : 1,
						            			"DEFAULT_VALUE": 1
						            		}]},  
						            		{"PATH" : "Item",
						            			"BUSINESS_OBJECT": "Item",
						            			"COLUMN_ID" : "CUST_TEST",
						            			"SEMANTIC_DATA_TYPE": "Integer",
						            			"REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_UNIT",
						            			"SIDE_PANEL_GROUP_ID" : 101,
						            			"ROLLUP_TYPE_ID" : 5,
						            			"UOM_CURRENCY_FLAG": 0,
						            			"TEXT": [{
						            				"PATH" : "Item",
						            				"COLUMN_ID" : "CUST_TEST",
						            				"LANGUAGE" : "EN",
						            				"DISPLAY_NAME" : "Testing"},
						            				{"PATH" : "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"LANGUAGE" : "DE",
						            					"DISPLAY_NAME" : "Testing"}
						            				],
						            				"ATTRIBUTES": [{
						            					"PATH" : "Item",
						            					"BUSINESS_OBJECT": "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"ITEM_CATEGORY_ID" : 1,
						            					"DEFAULT_VALUE": 1
						            				}],
						            				"FORMULAS": [{
						            					"PATH" : "Item",
						            					"BUSINESS_OBJECT": "Item",
						            					"COLUMN_ID" : "CUST_TEST",
						            					"ITEM_CATEGORY_ID" : 1,
						            					"FORMULA_ID" : 1
						            				}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it("should throw exception if a masterdata custom fields has ROLLUP_TYPE (ROLLUP_TYPE_ID != 0)", function() {
				// arrange
				var oMetaMaterialTestDataCreate = {
						PATH : "Material",
						BUSINESS_OBJECT : "Material",
						COLUMN_ID : "CMAT_TEST123",
						ROLLUP_TYPE_ID : 1,
						SIDE_PANEL_GROUP_ID : 501,
						REF_UOM_CURRENCY_PATH : "Material",
						REF_UOM_CURRENCY_BUSINESS_OBJECT : "Material",
						REF_UOM_CURRENCY_COLUMN_ID : "CMAT_TEST123_UNIT",
						UOM_CURRENCY_FLAG : 0,
						SEMANTIC_DATA_TYPE : "Decimal",
						SEMANTIC_DATA_TYPE_ATTRIBUTES: "precision=20; scale=5",
						PROPERTY_TYPE: 3,
						TEXT : [],
						ATTRIBUTES : [ {
							PATH : "Material",
							BUSINESS_OBJECT : "Material",
							COLUMN_ID : "CMAT_TEST123",
							ITEM_CATEGORY_ID : -1,
							IS_MANDATORY : 1,
							IS_READ_ONLY : 1
						}],
						FORMULAS : []
				};

				var exception;
				var oRequestBody = createRequest(oMetaMaterialTestDataCreate, $.net.http.POST);
		
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
				
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it("should throw exception if a custom field of type link has ROLLUP_TYPE (ROLLUP_TYPE_ID != 0)", function() {
				// arrange
				var oMetadataTestData = {
											"CREATE" : [{"PATH" : "Item",
												"BUSINESS_OBJECT": "Item",
												"COLUMN_ID" : "CUST_LINK",
												"SEMANTIC_DATA_TYPE": "Link",
												"SIDE_PANEL_GROUP_ID" : 102,
												"ROLLUP_TYPE_ID" : 1,
												"UOM_CURRENCY_FLAG": 0,
												"TEXT": [],
												"ATTRIBUTES": [{
													"PATH" : "Item",
													"BUSINESS_OBJECT": "Item",
													"COLUMN_ID" : "CUST_LINK",
													"ITEM_CATEGORY_ID" : 1
												}]}]
											};

				var exception;
				var oRequestBody = createRequest(oMetadataTestData, $.net.http.POST);
		
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
				
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});

			it("should throw exception if a masterdata custom fields has more than 1 item attribute", function() {
				// arrange
				var oMetaMaterialTestDataCreate = {
						PATH : "Material",
						BUSINESS_OBJECT : "Material",
						COLUMN_ID : "CMAT_TEST123",
						ROLLUP_TYPE_ID : 1,
						SIDE_PANEL_GROUP_ID : 501,
						REF_UOM_CURRENCY_PATH : "Material",
						REF_UOM_CURRENCY_BUSINESS_OBJECT : "Material",
						REF_UOM_CURRENCY_COLUMN_ID : "CMAT_TEST123_UNIT",
						UOM_CURRENCY_FLAG : 0,
						SEMANTIC_DATA_TYPE : "Decimal",
						SEMANTIC_DATA_TYPE_ATTRIBUTES: "precision=20; scale=5",
						PROPERTY_TYPE: 3,
						TEXT : [],
						ATTRIBUTES : [ {
							PATH : "Material",
							BUSINESS_OBJECT : "Material",
							COLUMN_ID : "CMAT_TEST123",
							ITEM_CATEGORY_ID : 1,
							IS_MANDATORY : 1,

							IS_READ_ONLY : 1
						},
						{
							PATH : "Material",
							BUSINESS_OBJECT : "Material",
							COLUMN_ID : "CMAT_TEST123",
							ITEM_CATEGORY_ID : 2,
							IS_MANDATORY : 1,
							IS_READ_ONLY : 1
						}],
						FORMULAS : []
				};

				var exception;
				var oRequestBody = createRequest(oMetaMaterialTestDataCreate, $.net.http.POST);
		
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
				
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it("should throw exception if a masterdata custom fields has FORMULAS", function() {
				// arrange
				var oMetaMaterialTestDataCreate = {
						PATH : "Material",
						BUSINESS_OBJECT : "Material",
						COLUMN_ID : "CMAT_TEST123",
						ROLLUP_TYPE_ID : 1,
						SIDE_PANEL_GROUP_ID : 501,
						REF_UOM_CURRENCY_PATH : "Material",
						REF_UOM_CURRENCY_BUSINESS_OBJECT : "Material",
						REF_UOM_CURRENCY_COLUMN_ID : "CMAT_TEST123_UNIT",
						UOM_CURRENCY_FLAG : 0,
						SEMANTIC_DATA_TYPE : "Decimal",
						SEMANTIC_DATA_TYPE_ATTRIBUTES: "precision=20; scale=5",
						PROPERTY_TYPE: 3,
						TEXT : [],
						ATTRIBUTES : [ {
							PATH : "Material",
							BUSINESS_OBJECT : "Material",
							COLUMN_ID : "CMAT_TEST123",
							ITEM_CATEGORY_ID : -1,
							IS_MANDATORY : 1,
							IS_READ_ONLY : 1
						}],
						FORMULAS : [ {
							FORMULA_ID : 123,
							PATH : "Material",
							BUSINESS_OBJECT : "Material",
							COLUMN_ID : "CMAT_TEST123",
							ITEM_CATEGORY_ID : -1,
							IS_FORMULA_USED : 1,
							FORMULA_STRING : '1+1=2'
						} ]
				};

				var exception;
				var oRequestBody = createRequest(oMetaMaterialTestDataCreate, $.net.http.POST);
		
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
				
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception if default value is not a valid decimal', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 101,
							"ROLLUP_TYPE_ID" : 1,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [],
							"ATTRIBUTES": [{
								"PATH" : "Item",
								"BUSINESS_OBJECT": "Item",
								"COLUMN_ID" : "CUST_TEST",
								"ITEM_CATEGORY_ID" : 1,
								"DEFAULT_VALUE": '1.'
							}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);
				expect(exception.details.validationObj.validationInfoCode).toEqual(ValidationInfoCode.VALUE_ERROR);
				expect(exception.details.validationObj.columnId).toEqual("DEFAULT_VALUE");
			});

			it('should throw exception if default value is not a valid link', function() {
				var oMetadataTestData = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_LINK",
							"SEMANTIC_DATA_TYPE": "Link",
							"SIDE_PANEL_GROUP_ID" : 102,
							"ROLLUP_TYPE_ID" : 0,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [],
							"ATTRIBUTES": [{
								"PATH" : "Item",
								"BUSINESS_OBJECT": "Item",
								"COLUMN_ID" : "CUST_LINK",
								"ITEM_CATEGORY_ID" : 1,
								"DEFAULT_VALUE": 'Test link'
							}]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);
				expect(exception.details.validationObj.validationInfoCode).toEqual(ValidationInfoCode.VALUE_ERROR);
				expect(exception.details.validationObj.columnId).toEqual("DEFAULT_VALUE");
			});			
			
			it('should throw exception  if the side panel group id is not correct', function() {
				var oMetadataTestData1 = {
						"CREATE" : [{"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"SEMANTIC_DATA_TYPE": "Integer",
							"SIDE_PANEL_GROUP_ID" : 0,
							"UOM_CURRENCY_FLAG": 0,
							"TEXT": [{ "PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "EN",
								"DISPLAY_NAME" : "Testing"},
								{ "PATH" : "Item",
									"COLUMN_ID" : "CUST_TEST",
									"LANGUAGE" : "DE",
									"DISPLAY_NAME" : "Testing"}
								]}]
				};
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
		
		});
	
		describe('Update', function() {
	
			var oMetadataTestDataUpdateStandard = {
					"UPDATE" : [{"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "ITEM_ID",
						"SIDE_PANEL_GROUP_ID" : 101,
						"ROLLUP_TYPE_ID" : 1,
						"TEXT": [{
							"PATH" : "Item",
							"COLUMN_ID" : "ITEM_ID",
							"LANGUAGE" : "EN",
							"DISPLAY_NAME" : "Testing"},
							{"PATH" : "Item",
								"COLUMN_ID" : "ITEM_ID",
								"LANGUAGE" : "DE",
								"DISPLAY_NAME" : "Testing"}
							],
							"ATTRIBUTES": [{
								"PATH" : "Item",
								"BUSINESS_OBJECT": "Item",
								"COLUMN_ID" : "ITEM_ID",
								"ITEM_CATEGORY_ID" : 1,
								"DEFAULT_VALUE": '1'
							}],
							"FORMULAS": [{
								"PATH" : "Item",
								"BUSINESS_OBJECT": "Item",
								"COLUMN_ID" : "ITEM_ID",
								"ITEM_CATEGORY_ID" : 1,
								"FORMULA_STRING": "1+2"
							}]}
					]
			};
	
			var oMetadataTestDataUpdateCF = {
					"UPDATE" : [{"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_TEST",
						"SIDE_PANEL_GROUP_ID" : 101,
						"ROLLUP_TYPE_ID" : 1,
						"TEXT": [{
							"PATH" : "Item",
							"COLUMN_ID" : "CUST_TEST",
							"LANGUAGE" : "EN",
							"DISPLAY_NAME" : "Testing"},
							{"PATH" : "Item",
								"COLUMN_ID" : "CUST_TEST",
								"LANGUAGE" : "DE",
								"DISPLAY_NAME" : "Testing"}
							],
							"ATTRIBUTES": [{
								"PATH" : "Item",
								"BUSINESS_OBJECT": "Item",
								"COLUMN_ID" : "CUST_TEST",
								"ITEM_CATEGORY_ID" : 1,
								"DEFAULT_VALUE": '1.2'
							}]}]
			};
	
			it('should throw exception  if default value does not match the semantic data type', function() {
	
				var exception;
				var oRequestBody = createRequest(oMetadataTestDataUpdateCF, $.net.http.POST);
				oMetadataProviderMock.get.and.callFake(function() {
					return [{"SEMANTIC_DATA_TYPE": 'Integer'}]; 
				});
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});

			it('should throw exception  if attribute default value is more than 5000 characters', function() {
                // generate a 251 chars long string
                var sLongDefaultValue = "";
                for (let i=0; i<500; i++)  {
                    sLongDefaultValue += "0123456789";
                }
                sLongDefaultValue += "0";

                var oMetadataTestDataUpdateCF = {
                        "UPDATE" : [{"PATH" : "Item",
                            "BUSINESS_OBJECT": "Item",
                            "COLUMN_ID" : "CUST_TEST",
                            "SEMANTIC_DATA_TYPE" : "String",
                            "SIDE_PANEL_GROUP_ID" : 101,
                            "ROLLUP_TYPE_ID" : 1,
                            "TEXT": [{
                                "PATH" : "Item",
                                "COLUMN_ID" : "CUST_TEST",
                                "LANGUAGE" : "EN",
                                "DISPLAY_NAME" : "Testing"},
                                {"PATH" : "Item",
                                    "COLUMN_ID" : "CUST_TEST",
                                    "LANGUAGE" : "DE",
                                    "DISPLAY_NAME" : "Testing"}
                                ],
                                "ATTRIBUTES": [{
                                    "PATH" : "Item",
                                    "BUSINESS_OBJECT": "Item",
                                    "COLUMN_ID" : "CUST_TEST",
                                    "ITEM_CATEGORY_ID" : 2,
                                    "DEFAULT_VALUE": sLongDefaultValue
                                }]}]
                };

				var exception;

				var oRequestBody = createRequest(oMetadataTestDataUpdateCF, $.net.http.POST);

				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);
			});
	
			it('should throw exception if semantic data type is updated', function() {
				let oMetadataTestData1 = new TestDataUtility(oMetadataTestDataUpdateCF).build();
				oMetadataTestData1.UPDATE[0].SEMANTIC_DATA_TYPE = "Integer";
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  if formula is changed for an invalid standard field', function() {
				//arrange
				var exception;
				var oRequestBody = createRequest(oMetadataTestDataUpdateStandard, $.net.http.POST);
				oMetadataProviderMock.get.and.callFake(function() {
					return [{"SEMANTIC_DATA_TYPE": "Integer"}]; 
				});
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
	
			it('should throw exception  the record not found in metadata table when changing rollup type', function() {
				//arrange
				var exception;
				var oRequestBody = createRequest(oMetadataTestDataUpdateStandard, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCodeNotFound);	
			});
			
			it('should throw exception if side panel group id is updated to an invalid id', function() {
				let oMetadataTestData1 = new TestDataUtility(oMetadataTestDataUpdateCF).build();
				oMetadataTestData1.UPDATE[0].SIDE_PANEL_GROUP_ID = 0;
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
			
			it('should throw exception if side panel group id is updated to null', function() {
				let oMetadataTestData1 = new TestDataUtility(oMetadataTestDataUpdateCF).build();
				oMetadataTestData1.UPDATE[0].SIDE_PANEL_GROUP_ID = null;
				var exception;
				var oRequestBody = createRequest(oMetadataTestData1, $.net.http.POST);
	
				//act
				try {
					var result = oCustomfieldsformulaValidator.validate(oRequestBody);
				} catch(e) {
					exception = e; 
				}
	
				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(oExpectedErrorCode);	
			});
		});
		
	}).addTags(["All_Unit_Tests"]);
}