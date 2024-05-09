var testData         = require("../../../../testdata/testdata").data;
var MockstarFacade   = require("../../../../testtools/mockstar_facade").MockstarFacade;
var Administration      = require("../administration-util");
var PersistencyImport   = $.import("xs.db", "persistency");
var Persistency         = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	        = require("../../../../../lib/xs/util/message");
var MessageCode    	        = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.language-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procLanguageRead" : "sap.plc.db.administration.procedures/p_language_read"
				},
				substituteTables : {
					language : {
						name : Resources["Language"].dbobjects.plcTable
					},
					gtt_language: Resources["Language"].dbobjects.tempTable,
					session : {
						name : "sap.plc.db::basis.t_session"
					},
					metadata : {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestData
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Language"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Language": procedureXsunit
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
				mockstar.insertTableData("language", testData.oLanguage);
				mockstar.initializeData();
			});
	
			it('should return valid languages', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Language"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.LANGUAGE_ENTITIES.length).toBe(3);
			});
		});
	
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("language", testData.oLanguage);
				mockstar.initializeData();
			});
	
			it('should returned updated entities for language', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Language"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"LANGUAGE_ENTITIES" : [{
													"LANGUAGE" : "ZZ",
													"TEXTS_MAINTAINABLE" : 0,
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
                expect(oResponseBody.body.masterdata.UPDATE.LANGUAGE_ENTITIES.length).toBe(1);
             });
	
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when language is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Language"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"LANGUAGE_ENTITIES" : [{
													"LANGUAGE" : "XY",
													"TEXTS_MAINTAINABLE" : 1,
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

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a language for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Language"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"LANGUAGE_ENTITIES" : [{
													"LANGUAGE" : "XY",
													"TEXTS_MAINTAINABLE" : 1
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
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});	
	
			it('should throw error when default language is deselected', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Language"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"LANGUAGE_ENTITIES" : [{
													"LANGUAGE" : "DE",
													"TEXTS_MAINTAINABLE" : 0,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]		
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
               
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			});	
	
			it('should throw error when english language is deselected', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Language"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"LANGUAGE_ENTITIES" : [{
													"LANGUAGE" : "EN",
													"TEXTS_MAINTAINABLE" : 0,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]		
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
               
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			});
		});
		
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("language", testData.oLanguage);
				mockstar.initializeData();
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a new language', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Language"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"LANGUAGE_ENTITIES" : [{
													"LANGUAGE" : "XY",
													"TEXTS_MAINTAINABLE" : 1
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
			});	

		});
		
	}).addTags(["Administration_NoCF_Integration"]);
}