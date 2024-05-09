var testData         = require("../../../../testdata/testdata").data;
var MockstarFacade   = require("../../../../testtools/mockstar_facade").MockstarFacade;
var Administration      = require("../administration-util");
var PersistencyImport   = $.import("xs.db", "persistency");
var Persistency         = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	        = require("../../../../../lib/xs/util/message");
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.factory.documentStatus-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_document_status_read"
				},
				substituteTables : {
					document_status : {
						name : Resources["Document_Status"].dbobjects.plcTable
					},
					gtt_document_status: Resources["Document_Status"].dbobjects.tempTable,
					document_status_text : {
						name : Resources["Document_Status"].dbobjects.plcTextTable
					},
					gtt_document_status_text : Resources["Document_Status"].dbobjects.tempTextTable,
					document : {
						name : Resources["Document"].dbobjects.plcTable
					},
					document_type : {
						name : Resources["Document_Type"].dbobjects.plcTable
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Document_Status"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Document_Status": procedureXsunit
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
				mockstar.insertTableData("document_status", testData.oDocumentStatusTestDataPlc);
				mockstar.insertTableData("document_status_text", testData.oDocumentStatusTextTestDataPlc);
				mockstar.insertTableData("document_type", testData.oDocumentTypeTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid document statuses and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Status"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DOCUMENT_STATUS_ENTITIES.length).toBe(3);
			});
			
			it('should return the valid filtered entities using search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Status"
				},{
					name : "filter",
					value : "DOCUMENT_TYPE_ID=DT1"
				},{
				     name : "searchAutocomplete",
				     value : "S1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DOCUMENT_STATUS_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.DOCUMENT_STATUS_ENTITIES[0]).toMatchData(
        	                    {'DOCUMENT_STATUS_ID': 'S1',
        	                     'DOCUMENT_STATUS_DESCRIPTION' : null,
        	                     'DOCUMENT_TYPE_ID': 'DT1',
                                '_SOURCE': 1
                                }, ['DOCUMENT_TYPE_ID']);
                expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES[0]).toMatchData(
        	                    {'DOCUMENT_TYPE_ID': 'DT1',
        	                     'DOCUMENT_TYPE_DESCRIPTION' : null,
                                '_SOURCE': 1
                                }, ['DOCUMENT_TYPE_ID']);
			});
			
			it('should return the valid entities using multiple filteres and search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Status"
				},{
					name : "filter",
					value : "DOCUMENT_TYPE_ID=DT1&DOCUMENT_STATUS_ID=S1"
				},{
				     name : "searchAutocomplete",
				     value : "S1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DOCUMENT_STATUS_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.DOCUMENT_STATUS_ENTITIES[0]).toMatchData(
        	                    {'DOCUMENT_STATUS_ID': 'S1',
        	                     'DOCUMENT_STATUS_DESCRIPTION' : null,
        	                     'DOCUMENT_TYPE_ID': 'DT1',
                                '_SOURCE': 1
                                }, ['DOCUMENT_TYPE_ID']);
                expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES[0]).toMatchData(
        	                    {'DOCUMENT_TYPE_ID': 'DT1',
        	                     'DOCUMENT_TYPE_DESCRIPTION' : null,
                                '_SOURCE': 1
                                }, ['DOCUMENT_TYPE_ID']);
			});
			
			it('should return no document statuses using search autocomplete that does not match the data', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Document_Status"
				},{
					name : "filter",
					value : "DOCUMENT_TYPE_ID=DT1"
				},{
				     name : "searchAutocomplete",
				     value : "L"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DOCUMENT_STATUS_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.DOCUMENT_TYPE_ENTITIES.length).toBe(0);
			});
			
		});
	}).addTags(["Administration_NoCF_Integration"]);
}