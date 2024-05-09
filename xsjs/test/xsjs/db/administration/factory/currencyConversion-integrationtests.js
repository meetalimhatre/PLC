var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;
var sDefaultExchangeRateType = require("../../../../../lib/xs/util/constants").sDefaultExchangeRateType;

var MessageLibrary 	    = require("../../../../../lib/xs/util/message");
var MessageCode    	    = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('xsjs.db.administration.currencyConversion-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;

		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procCurrencyConversionRead": "sap.plc.db.administration.procedures/p_currency_conversion_read",
				},
				substituteTables:
				{
					currencyConversion : {
						name : Resources["Currency_Conversion"].dbobjects.plcTable
					},
					currency : {
						name : Resources["Currency"].dbobjects.plcTable
					},
					currency_text : {
						name : Resources["Currency"].dbobjects.plcTextTable
					},
					gtt_currency_conversion: Resources["Currency_Conversion"].dbobjects.tempTable,
					metadata : {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestDataEn
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Currency_Conversion"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Currency_Conversion": procedureXsunit
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
				mockstar.insertTableData("currencyConversion", testData.oCurrencyConversion);
				mockstar.initializeData();
			});
	
			it('should return valid currency conversions', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CURRENCY_CONVERSION_ENTITIES.length).toBe(1);
			});

			it('should return valid currency conversions without duplicates', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				} ];

				mockstar.insertTableData("currencyConversion", testData.oCurrencyConversionMultiple);
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CURRENCY_CONVERSION_ENTITIES.length).toBe(3);
			});
		});
	
		describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currencyConversion", testData.oCurrencyConversion);
				mockstar.initializeData();
			});
	
			it('should deactivate currency conversions', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST",
													"VALID_FROM" : "2015-06-02T00:00:00Z",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DELETE.CURRENCY_CONVERSION_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a currency conversion for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("EXCHANGE_RATE_TYPE_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[2].columnId).toBe("_VALID_FROM");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a currency conversion that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST",
													"VALID_FROM" : "2015-06-02T00:00:00Z",
													"_VALID_FROM" : "2015-08-02T14:45:50.096Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
		});
	
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currencyConversion", testData.oCurrencyConversion);
				mockstar.insertTableData("currency", testData.oCurrency);
				mockstar.insertTableData("currency_text", testData.oCurrencyText);
				mockstar.insertTableData("currency", testData.oCurrencySecond);
				mockstar.insertTableData("currency", testData.oCurrencyGBP);
				mockstar.initializeData();
			});
	
			it('should create entries in currency_conversion', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "GBP",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02T00:00:00Z"
												}]          
                    				        }
                    				};
				
				var oCurrencyConvBefore = mockstar.execQuery("select * from {{currencyConversion}}");
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
                var oCurrencyConvAfter = mockstar.execQuery("select * from {{currencyConversion}}");
                expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CREATE.CURRENCY_CONVERSION_ENTITIES[0]._VALID_FROM).not.toBe(null);
				expect(oCurrencyConvAfter.columns.FROM_CURRENCY_ID.rows.length).toBe(oCurrencyConvBefore.columns.FROM_CURRENCY_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (currency) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "ABC",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02T00:00:00Z"
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Currency);
			});
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a currency conversion that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02T00:00:00Z"
												}]                    
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a currency conversion for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("TO_CURRENCY_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (EXCHANGE_RATE_TYPE_ID) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : "LUC",
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02"
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ExchangeRateType);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert currency conversion with invalid columns', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				let oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : "LUC",
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02",
													"INVALID_COLUMN": "ABCD"
												}]                      
                    				        }
                    				};
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("INVALID_COLUMN");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe("METADATA_ERROR");	
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert EXCHANGE_RATE_TYPE_ID with lowercase', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				let oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : "abc",
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "UDS",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02"
												}]                      
                    				        }
                    				};
		        // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should throw exception (GENERAL_UNEXPECTED_EXCEPTION) when try to insert null as EXCHANGE_RATE_TYPE_ID', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				let oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : null,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "UDS",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02"
												}]                      
                    				        }
                    				};
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a field with not allowed characters', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				let oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : "STANDARD",
													"FROM_CURRENCY_ID" : "@@#",
													"TO_CURRENCY_ID" : "UDS",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02"
												}]                      
                    				        }
                    				};
	            // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe("INVALID_CHARACTERS_ERROR");
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a currency conversion for which the TO_CURRENCY_ID is the same as the FROM_CURRENCY_ID', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : "STANDARD",
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "EUR",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02T00:00:00Z"
												}]                    
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
                //assert
				expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
		});
	
		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currencyConversion", testData.oCurrencyConversion);
				mockstar.insertTableData("currency", testData.oCurrency);
				mockstar.insertTableData("currency_text", testData.oCurrencyText);
				mockstar.insertTableData("currency", testData.oCurrencySecond);
				mockstar.insertTableData("currency", testData.oCurrencyGBP);
				mockstar.initializeData();
			});
	
			it('should create entries in currency_conversion', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "GBP",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02T00:00:00Z"
												}]          
                    				        }
                    				};
				
				var oCurrencyConvBefore = mockstar.execQuery("select * from {{currencyConversion}}");
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
                var oCurrencyConvAfter = mockstar.execQuery("select * from {{currencyConversion}}");
                expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.UPSERT.CURRENCY_CONVERSION_ENTITIES[0]._VALID_FROM).not.toBe(null);
				expect(oCurrencyConvAfter.columns.FROM_CURRENCY_ID.rows.length).toBe(oCurrencyConvBefore.columns.FROM_CURRENCY_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (currency) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "ABC",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02T00:00:00Z"
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Currency);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a currency conversion for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("TO_CURRENCY_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should returned updated entities for currency conversion', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oTest = mockstar.execQuery("select * from {{currencyConversion}} WHERE FROM_CURRENCY_ID = 'EUR'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST",
													"FROM_FACTOR" : 20,
													"TO_FACTOR" : 5,
													"RATE" : 5.6,
													"VALID_FROM" : "2015-06-02T00:00:00Z",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]                        
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                var oTestafter = mockstar.execQuery("select * from {{currencyConversion}} WHERE FROM_CURRENCY_ID = 'EUR'");
                
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.UPSERT.CURRENCY_CONVERSION_ENTITIES[0]._VALID_FROM).not.toBe(oItemsPayload.UPSERT.CURRENCY_CONVERSION_ENTITIES[0]._VALID_FROM);
				expect(oTestafter.columns.FROM_CURRENCY_ID.rows.length).toBe(oTest.columns.FROM_CURRENCY_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (EXCHANGE_RATE_TYPE_ID) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : "LUC",
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST",
													"FROM_FACTOR" : 1,
													"TO_FACTOR" : 1,
													"RATE" : 1,
													"VALID_FROM" : "2015-06-02"
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ExchangeRateType);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to upsert a currency convertion with the same FROM_CURRENCY_ID and TO_CURRENCY_ID', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												"EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
												"FROM_CURRENCY_ID" : "EUR",
												"TO_CURRENCY_ID" : "EUR",
												"FROM_FACTOR" : 1,
												"TO_FACTOR" : 1,
												"RATE" : 1,
												"VALID_FROM" : "2015-06-02T00:00:00Z"
												}]          
                    				        }
                    				};
				
				var oCurrencyConvBefore = mockstar.execQuery("select * from {{currencyConversion}}");
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			
			});
			
		});

		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currencyConversion", testData.oCurrencyConversion);
				mockstar.insertTableData("currency", testData.oCurrency);
				mockstar.insertTableData("currency_text", testData.oCurrencyText);
				mockstar.insertTableData("currency", testData.oCurrencySecond);
				mockstar.initializeData();
			});
	
			it('should returned updated entities for currency conversion', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oTest = mockstar.execQuery("select * from {{currencyConversion}} WHERE FROM_CURRENCY_ID = 'EUR'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "TST",
													"FROM_FACTOR" : 20,
													"TO_FACTOR" : 5,
													"RATE" : 5.6,
													"VALID_FROM" : "2015-06-02T00:00:00Z",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]                        
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                var oTestafter = mockstar.execQuery("select * from {{currencyConversion}} WHERE FROM_CURRENCY_ID = 'EUR'");
                
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.UPDATE.CURRENCY_CONVERSION_ENTITIES[0]._VALID_FROM).not.toBe(oItemsPayload.UPDATE.CURRENCY_CONVERSION_ENTITIES[0]._VALID_FROM);
				expect(oTestafter.columns.FROM_CURRENCY_ID.rows.length).toBe(oTest.columns.FROM_CURRENCY_ID.rows.length + 1);
			});
	
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when currency conversion is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "USD",
													"TO_CURRENCY_ID" : "RON",
													"FROM_FACTOR" : 15,
													"TO_FACTOR" : 5,
													"RATE" : 3.7,
													"VALID_FROM" : "2015-06-02T00:00:00Z",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]                      
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);	
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a currency conversion for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "USD",
													"TO_CURRENCY_ID" : "RON",
													"FROM_FACTOR" : 15,
													"TO_FACTOR" : 5,
													"RATE" : 3.7
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VALID_FROM");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);				
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to update the TO_CURRENCY_ID to the same value as FROM_CURRENCY_ID', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Currency_Conversion"
				}];
				
				var oTest = mockstar.execQuery("select * from {{currencyConversion}} WHERE FROM_CURRENCY_ID = 'EUR'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CURRENCY_CONVERSION_ENTITIES" : [{
												    "EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
													"FROM_CURRENCY_ID" : "EUR",
													"TO_CURRENCY_ID" : "EUR",
													"FROM_FACTOR" : 20,
													"TO_FACTOR" : 5,
													"RATE" : 5.6,
													"VALID_FROM" : "2015-06-02T00:00:00Z",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]                        
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			
			});
			
		});
	}).addTags(["Administration_NoCF_Integration"]);
}