var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	    = require("../../../../../lib/xs/util/message");
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.documentType-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_document_type_read"
				},
				substituteTables : {
					document_type : {
						name : Resources["Document_Type"].dbobjects.plcTable
					},
					document_type_text : {
						name : Resources["Document_Type"].dbobjects.plcTextTable
					},
					document : {
						name : Resources["Document"].dbobjects.plcTable
					},
					document_text : {
						name : Resources["Document"].dbobjects.plcTextTable
					},
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguage
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestData
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Document_Type"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Document_Type": procedureXsunit
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
				mockstar.insertTableData("document_type_text", testData.oDocumentTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid document types and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Type"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES.length).toBe(3);
			});
	
			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Type"
				},{
					name : "filter",
					value : "DOCUMENT_TYPE_ID=DT1"
				}];
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_TEXT_ENTITIES.length).toBe(1);
			});
			
			it('should return the valid filtered entries with search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Type"
				},{
					name : "filter",
					value : "DOCUMENT_TYPE_ID=DT1"
				},{
				     name : "searchAutocomplete",
				     value : "DT"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES[0]).toMatchData(
        	                    {'DOCUMENT_TYPE_ID': 'DT1',
        	                     'DOCUMENT_TYPE_DESCRIPTION' : null,
                                '_SOURCE': 1
                                }, ['DOCUMENT_TYPE_ID']);
			
			});
			
			it('should not return any filtered entries if search autocomplete does not match the data', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Type"
				},{
					name : "filter",
					value : "DOCUMENT_TYPE_ID=DT1"
				},{
				     name : "searchAutocomplete",
				     value : "S"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES.length).toBe(0);
			});
	
			it('should not return any entries for an invalid document type (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Type"
				},{
					name : "filter",
					value : "DOCUMENT_TYPE_ID=11"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_TEXT_ENTITIES.length).toBe(0);
			});
		});
	}).addTags(["Administration_NoCF_Integration"]);
}