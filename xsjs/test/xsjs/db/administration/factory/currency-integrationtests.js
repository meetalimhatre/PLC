var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;
var HelperObjectTypes = require("../../../../../lib/xs/util/constants").HelperObjectTypes
var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 			= require("../../../../../lib/xs/util/message");
var MessageCode    			= MessageLibrary.Code;
var ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;
const TestDataUtility = require("../../../../testtools/testDataUtility").TestDataUtility;

const oCurrencyText = {
		"CURRENCY_ID": "EUR",
		"LANGUAGE": "EN",
		"CURRENCY_CODE": "EUR",
		"CURRENCY_DESCRIPTION": "Test currency",
		"_SOURCE": 1,
		"_CREATED_BY": "I305774",
		"_VALID_FROM": "2015-06-02T14:45:50.096Z"
};

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('xsjs.db.administration.currency-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procCurrencyRead" : "sap.plc.db.administration.procedures/p_currency_read"
				},
				substituteTables : {
					currency : {
						name : Resources["Currency"].dbobjects.plcTable
					},
					currency_text : {
						name : Resources["Currency"].dbobjects.plcTextTable
					},
					gtt_currency: Resources["Currency"].dbobjects.tempTable,
					gtt_currency_text : Resources["Currency"].dbobjects.tempTextTable,
					company_code : {
						name : Resources["Company_Code"].dbobjects.plcTable
					},
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.plcTable
					},
					currency_conversion : {
						name : Resources["Currency_Conversion"].dbobjects.plcTable
					},
					project : {
						name : ProjectTables.project
					},
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguageTestData
					},
					metadata : {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					calculation_version : {
						name : "sap.plc.db::basis.t_calculation_version"
					},
					calculation_version_temp : {
						name : "sap.plc.db::basis.t_calculation_version_temporary"
					},
					item : {
						name : "sap.plc.db::basis.t_item"
					},
					item_temp : {
						name : "sap.plc.db::basis.t_item_temporary"
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestData
					},
					variant : {
						name : "sap.plc.db::basis.t_variant"
					},
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Currency"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Currency": procedureXsunit
                });
			}
	
		});
	
		afterOnce(function() {
			if (!mockstar.disableMockstar) {
				MasterdataReadProcedures = originalProcedures;
				mockstar.cleanup();
			}
		});
	
		beforeEach(function() {
			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
		});
	
		describe ("get", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currency", testData.oCurrency);
				mockstar.insertTableData("currency_text", testData.oCurrencyText);
				mockstar.initializeData();
			});
	
			it('should return valid currencies and currency_texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.CURRENCY_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CURRENCY_TEXT_ENTITIES.length).toBe(1);
			});
		});
	
		describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currency", testData.oCurrency);
				mockstar.insertTableData("currency_text", testData.oCurrencyText);
				mockstar.initializeData();
			});
	
			it('should deactivate currencies and currency texts', function() {
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : "TST",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DELETE.CURRENCY_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw an error (GENERAL_VALIDATION_ERROR) when CURRENCY_ID is used in Calculation_Version business object', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : "USD",
													"_VALID_FROM": "2015-06-02T14:45:50.096Z"
												}]	
                    				        }
                    				};

				var oCurrencyUSD = {
						"CURRENCY_ID": "USD",
						"_SOURCE": 1,
						"_CREATED_BY": "I305774",
						"_VALID_FROM": "2015-06-02T14:45:50.096Z"
				};
				var oCurrencyUSDText = {
						"CURRENCY_ID": "USD",
						"LANGUAGE": "EN",
						"CURRENCY_CODE": "USD",
						"CURRENCY_DESCRIPTION": "USD Test currency",
						"_SOURCE": 1,
						"_CREATED_BY": "I305774",
						"_VALID_FROM": "2015-06-02T14:45:50.096Z"
				};
				
				mockstar.insertTableData("currency", oCurrencyUSD);
				mockstar.insertTableData("currency_text", oCurrencyUSDText);
				mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.CalculationVersion);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw an error (GENERAL_VALIDATION_ERROR) when CURRENCY_ID is Standard (EUR)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : "EUR",
													"_VALID_FROM": "2015-06-02T14:45:50.096Z"
												}]		
                    				        }
                    				};

				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toEqual(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toEqual(ValidationInfoCode.DEPENDENCY_ERROR);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toEqual(HelperObjectTypes.Standard);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to delete a REPORT_CURRENCY_ID used in Variant business object', function() {
				// arrange
				mockstar.clearAllTables();
				const oVariantTestData = new TestDataUtility(testData.oVariantTestData).build();
				const oCurrencyTestData = new TestDataUtility(testData.oCurrency).build();
				oVariantTestData.REPORT_CURRENCY_ID[0] = oCurrencyTestData.CURRENCY_ID;
				mockstar.insertTableData("currency", oCurrencyTestData);
				mockstar.insertTableData("variant", oVariantTestData);
				mockstar.initializeData();
				const aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				const oItemsPayload = {"DELETE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : oCurrencyTestData.CURRENCY_ID,
													"_VALID_FROM": oCurrencyTestData._VALID_FROM
												}]	
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                const oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Variant);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			it('should throw GENERAL_VALIDATION_ERROR when trying to delete a SALES_PRICE_CURRENCY_ID used in Variant business object', function() {
				// arrange
				mockstar.clearAllTables();
				const oVariantTestData = new TestDataUtility(testData.oVariantTestData).build();
				const oCurrencyTestData = new TestDataUtility(testData.oCurrency).build();
				oVariantTestData.SALES_PRICE_CURRENCY_ID[0] = oCurrencyTestData.CURRENCY_ID;
				mockstar.insertTableData("currency", oCurrencyTestData);
				mockstar.insertTableData("variant", oVariantTestData);
				mockstar.initializeData();
				const aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				const oItemsPayload = {"DELETE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : oCurrencyTestData.CURRENCY_ID,
													"_VALID_FROM": oCurrencyTestData._VALID_FROM
												}]	
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                const oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Variant);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
		});
	
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views	
				mockstar.insertTableData("currency", testData.oCurrencySecond);
				mockstar.insertTableData("currency_text", oCurrencyText);
				mockstar.initializeData();
			});
		
			it('should create entries in currency and currency_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oTestBefore = mockstar.execQuery("select * from {{currency}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{currency_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : "TST"
												}],
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID": "TST",
													"LANGUAGE": "EN",
													"CURRENCY_CODE": "TST",
													"CURRENCY_DESCRIPTION": "Test currency 1"
												},{
													"CURRENCY_ID": "TST",
													"LANGUAGE": "DE",
													"CURRENCY_CODE": "TST",
													"CURRENCY_DESCRIPTION": "Test currency 2"
												}]                   
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{currency}}");
				var oTestText = mockstar.execQuery("select * from {{currency_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.CURRENCY_ID.rows.length).toBe(oTestBefore.columns.CURRENCY_ID.rows.length + 1);
				expect(oTestText.columns.CURRENCY_ID.rows.length).toBe(oTestTextBefore.columns.CURRENCY_ID.rows.length + 2);
				expect(oResponseBody.body.masterdata.CREATE.CURRENCY_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.CURRENCY_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a currencies that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"CURRENCY_TEXT_ENTITIES" : [{
												"CURRENCY_ID": "TST",
												"LANGUAGE": "EN",
												"CURRENCY_CODE": "TST",
												"CURRENCY_DESCRIPTION": "Test currency 1"
											},{
												"CURRENCY_ID": "TST",
												"LANGUAGE": "DE",
												"CURRENCY_CODE": "TST",
												"CURRENCY_DESCRIPTION": "Test currency 2"
											}]			        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);	
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a currency that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID": "EUR"
												}],
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID": "EUR",
													"LANGUAGE": "EN",
													"CURRENCY_CODE": "EUR",
													"CURRENCY_DESCRIPTION": "Test currency"
												},{
													"CURRENCY_ID" : "EUR",
													"LANGUAGE" : "DE",
													"CURRENCY_CODE": "EUR",
													"CURRENCY_DESCRIPTION": "Test currency"
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);	
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a currency text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID": "EUR",
													"LANGUAGE": "EN",
													"CURRENCY_CODE": "EUR",
													"CURRENCY_DESCRIPTION": "Test currency"
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY": "EUR"
												}],
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID": "EUR",
													"LANGUAGE": "EN",
													"CURRENCY_CODE": "EUR",
													"CURRENCY_DESCRIPTION": "Test currency"
												},
												{
													"CURRENCY_ID": "EUR",
													"LANGUAGE": "DE",
													"CURRENCY_CODE": "EUR",
													"CURRENCY_DESCRIPTION": "Test currency 2"
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CURRENCY");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a currency for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"CURRENCY_ENTITIES" : [{
											}],
											"CURRENCY_TEXT_ENTITIES" : [{
												"LANGUAGE": "EN",
												"CURRENCY_CODE": "EUR",
												"CURRENCY_DESCRIPTION": "Test currency"
											},
											{
												"LANGUAGE": "DE",
												"CURRENCY_CODE": "EUR",
												"CURRENCY_DESCRIPTION": "Test currency 2"
											}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CURRENCY_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a currency for which mandatory fields are null', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				let oItemsPayload = {"CREATE":
                    				       { 
											"CURRENCY_ENTITIES" : [{
												"CURRENCY_ID": null
											}]    
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CURRENCY_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
		});
		
		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views	
				mockstar.insertTableData("currency", testData.oCurrencySecond);
				mockstar.insertTableData("currency_text", oCurrencyText);
				mockstar.initializeData();
			});
		
			it('should create entries in currency and currency_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oTestBefore = mockstar.execQuery("select * from {{currency}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{currency_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : "TST"
												}],
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID": "TST",
													"LANGUAGE": "EN",
													"CURRENCY_CODE": "TST",
													"CURRENCY_DESCRIPTION": "Test currency 1"
												},{
													"CURRENCY_ID": "TST",
													"LANGUAGE": "DE",
													"CURRENCY_CODE": "TST",
													"CURRENCY_DESCRIPTION": "Test currency 2"
												}]                   
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{currency}}");
				var oTestText = mockstar.execQuery("select * from {{currency_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.CURRENCY_ID.rows.length).toBe(oTestBefore.columns.CURRENCY_ID.rows.length + 1);
				expect(oTestText.columns.CURRENCY_ID.rows.length).toBe(oTestTextBefore.columns.CURRENCY_ID.rows.length + 2);
				expect(oResponseBody.body.masterdata.UPSERT.CURRENCY_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.CURRENCY_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a currencies that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"CURRENCY_TEXT_ENTITIES" : [{
												"CURRENCY_ID": "TST",
												"LANGUAGE": "EN",
												"CURRENCY_CODE": "TST",
												"CURRENCY_DESCRIPTION": "Test currency 1"
											},{
												"CURRENCY_ID": "TST",
												"LANGUAGE": "DE",
												"CURRENCY_CODE": "TST",
												"CURRENCY_DESCRIPTION": "Test currency 2"
											}]			        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);	
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});

			
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY": "EUR"
												}],
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID": "EUR",
													"LANGUAGE": "EN",
													"CURRENCY_CODE": "EUR",
													"CURRENCY_DESCRIPTION": "Test currency"
												},
												{
													"CURRENCY_ID": "EUR",
													"LANGUAGE": "DE",
													"CURRENCY_CODE": "EUR",
													"CURRENCY_DESCRIPTION": "Test currency 2"
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CURRENCY");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a controlling area for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"CURRENCY_ENTITIES" : [{
											}],
											"CURRENCY_TEXT_ENTITIES" : [{
												"CURRENCY_ID": "",
												"LANGUAGE": "EN",
												"CURRENCY_CODE": "EUR",
												"CURRENCY_DESCRIPTION": "Test currency"
											},
											{
												"CURRENCY_ID": "",
												"LANGUAGE": "DE",
												"CURRENCY_CODE": "EUR",
												"CURRENCY_DESCRIPTION": "Test currency 2"
											}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CURRENCY_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should returned updated entities for currency and currency_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{currency}} WHERE CURRENCY_ID = 'TST'");
				var oTestTextBefore = mockstar.execQuery("select * from {{currency_text}} WHERE CURRENCY_ID = 'TST'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : "TST"
												}],
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID" : "TST",
													"LANGUAGE" : "EN",
													"CURRENCY_CODE" : "TST",
													"CURRENCY_DESCRIPTION" : "Updated currency 1"
												}]          
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{currency}} WHERE CURRENCY_ID = 'TST'");
				var oTestText = mockstar.execQuery("select * from {{currency_text}} WHERE CURRENCY_ID = 'TST'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.CURRENCY_ID.rows.length).toBe(oTestMainBefore.columns.CURRENCY_ID.rows.length + 1);
				expect(oTestText.columns.CURRENCY_ID.rows.length).toBe(oTestTextBefore.columns.CURRENCY_ID.rows.length + 1);
			});
		});
		
	
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currency", testData.oCurrency);
				mockstar.insertTableData("currency_text", testData.oCurrencyText);
				mockstar.initializeData();
			});
	
			it('should returned updated entities for currency and currency_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{currency}} WHERE CURRENCY_ID = 'TST'");
				var oTestTextBefore = mockstar.execQuery("select * from {{currency_text}} WHERE CURRENCY_ID = 'TST'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : "TST",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}],
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID" : "TST",
													"LANGUAGE" : "EN",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z",
													"CURRENCY_CODE" : "TST",
													"CURRENCY_DESCRIPTION" : "Updated currency 1"
												}]          
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{currency}} WHERE CURRENCY_ID = 'TST'");
				var oTestText = mockstar.execQuery("select * from {{currency_text}} WHERE CURRENCY_ID = 'TST'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.CURRENCY_ID.rows.length).toBe(oTestMainBefore.columns.CURRENCY_ID.rows.length + 1);
				expect(oTestText.columns.CURRENCY_ID.rows.length).toBe(oTestTextBefore.columns.CURRENCY_ID.rows.length + 1);
			});
	
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when currency is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CURRENCY_ENTITIES" : [{
													"CURRENCY_ID" : "ZZZ",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}] 	          
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
						
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an currency text which is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID" : "TST",
													"LANGUAGE" : "EN",
													"_VALID_FROM" : "2015-10-02T14:45:50.096Z",
													"CURRENCY_CODE" : "TST",
													"CURRENCY_DESCRIPTION" : "Test currency"
												}]          
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
			
			it('should throw error (GENERAL_VALIDATION_ERROR) when try to update a currency text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CURRENCY_TEXT_ENTITIES" : [{
													"CURRENCY_ID" : "TST"
												}]         
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("LANGUAGE");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
		});
	}).addTags(["Administration_NoCF_Integration"]);
}