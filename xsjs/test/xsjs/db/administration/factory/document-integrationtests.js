var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	    = require("../../../../../lib/xs/util/message");
var MessageCode    	    = MessageLibrary.Code;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.document-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({ // Initialize Mockstar
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_document_read"
				},
				substituteTables : {
					document_type : {
						name : Resources["Document_Type"].dbobjects.plcTable
					},
					document_status : {
						name : Resources["Document_Status"].dbobjects.plcTable
					},
					document : {
						name : Resources["Document"].dbobjects.plcTable
					},
					document_text : {
						name : Resources["Document"].dbobjects.plcTextTable
					},
					design_office : {
						name : Resources["Design_Office"].dbobjects.plcTable
					},
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguage
					},
					metadata :  {
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Document"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Document": procedureXsunit
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
				mockstar.insertTableData("document_type", testData.oDocumentTypeTestDataPlc);
				mockstar.insertTableData("document_status", testData.oDocumentStatusTestDataPlc);
				mockstar.insertTableData("document", testData.oDocumentTestDataPlc);
				mockstar.insertTableData("document_text", testData.oDocumentTextTestDataPlc);
				mockstar.insertTableData("design_office", testData.oDesignOfficeTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid documents and texts', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
        			name : "business_object",
        			value : "Document"
        		}];
        		
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_ENTITIES.length).toBe(4);
			});
	
			it('should return the valid filtered entries', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
            			name : "business_object",
            			value : "Document"
            		},{
            		    name : "filter",
            			value : "DOCUMENT_ID=D1"
            		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.DOCUMENT_TEXT_ENTITIES.length).toBe(1);
			});
	
			it('should not return any entries for an invalid document (filter)', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
            			name : "business_object",
            			value : "Document"
            		},{
            		    name : "filter",
            			value : "DOCUMENT_ID=DD"
            		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.DOCUMENT_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should return the valid documents that start with the string from autocomplete and are filtered by document type id', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
            			name : "business_object",
            			value : "Document"
            		},{
            		    name : "filter",
            			value : "DOCUMENT_TYPE_ID=DT1"
            		},{
             		    name : "searchAutocomplete",
             		    value : "D"
             		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_ENTITIES.length).toBe(2);
			});
			
			it('should return the valid documents that start with the string from autocomplete and are filtered by document version', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
            			name : "business_object",
            			value : "Document"
            		},{
            		    name : "filter",
            			value : "DOCUMENT_VERSION=1"
            		},{
             		    name : "searchAutocomplete",
             		    value : "D1"
             		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_ENTITIES.length).toBe(1);
			});
			
			it('should not return duplicate entries when multiple filteres are used', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
            			name : "business_object",
            			value : "Document"
            		},{
            		    name : "filter",
            			value : "DOCUMENT_VERSION=1&DOCUMENT_PART=1"
            		},{
             		    name : "searchAutocomplete",
             		    value : "D"
             		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_ENTITIES.length).toBe(4);
			});
		});
		
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("document_type", testData.oDocumentTypeTestDataPlc);
				mockstar.insertTableData("document_status", testData.oDocumentStatusTestDataPlc);
				mockstar.insertTableData("document", testData.oDocumentTestDataPlc);
				mockstar.insertTableData("document_text", testData.oDocumentTextTestDataPlc);
				mockstar.insertTableData("design_office", testData.oDesignOfficeTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a new document', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"DOCUMENT_ENTITIES" : [{
												}]	
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
               
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});	

		});
		
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("document_type", testData.oDocumentTypeTestDataPlc);
				mockstar.insertTableData("document_status", testData.oDocumentStatusTestDataPlc);
				mockstar.insertTableData("document", testData.oDocumentTestDataPlc);
				mockstar.insertTableData("document_text", testData.oDocumentTextTestDataPlc);
				mockstar.insertTableData("design_office", testData.oDesignOfficeTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a new document', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"DOCUMENT_ENTITIES" : [{
												}]	
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
               
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});	

		});

	}).addTags(["Administration_NoCF_Integration"]);
}