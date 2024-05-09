var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;
var DispatcherLibrary = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.designOffice-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel : {
							"procDesignOfficeRead": "sap.plc.db.administration.procedures/p_design_office_read"
						},
						substituteTables : {
							designOffice : Resources["Design_Office"].dbobjects.plcTable,
							designOfficeText : Resources["Design_Office"].dbobjects.plcTextTable,
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Design_Office"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Design_Office": procedureXsunit
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
				mockstar.insertTableData("designOffice", testData.oDesignOfficeTestDataPlc);
				mockstar.insertTableData("designOfficeText", testData.oDesignOfficeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid design offices', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Design_Office"
				} ];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DESIGN_OFFICE_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.DESIGN_OFFICE_TEXT_ENTITIES.length).toBe(1);
			});
			
		    it('should return any design office for existing autocomplete value', function() {
				// arrange
		    	var aParams = [ {
					name : "business_object",
					value : "Design_Office"
				},{
					name : "searchAutocomplete",
					value : "L1"
				}];
	
				// act
		    	new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DESIGN_OFFICE_ENTITIES.length).toBe(1);
			});	
			
			it('should return valid filtered design office using searchAutocomplete', function() {
				// arrange
		    	var aParams = [ {
					name : "business_object",
					value : "Design_Office"
				},{
					name : "filter",
					value : "DESIGN_OFFICE_ID=L1"
				},{
					name : "searchAutocomplete",
					value : "L1"
				}];
	
				// act
		    	new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DESIGN_OFFICE_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.DESIGN_OFFICE_ENTITIES[0]).toMatchData(
        	                    {'DESIGN_OFFICE_ID': 'L1',
        	                     'DESIGN_OFFICE_DESCRIPTION': 'L1 Description'
                                }, ['DESIGN_OFFICE_ID']);
			});	
			
		    it('should NOT return design office for invalid autocomplete value', function() {
				// arrange
		    	var aParams = [ {
					name : "business_object",
					value : "Design_Office"
				},{
					name : "searchAutocomplete",
					value : "L3"
				}  ];
	
				// act
		    	new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DESIGN_OFFICE_ENTITIES.length).toBe(0);
			});	
			
			it('should not return any design office for invalid autocomplete value(filer)', function() {
				// arrange
		    	var aParams = [ {
					name : "business_object",
					value : "Design_Office"
				},{
					name : "filter",
					value : "DESIGN_OFFICE_ID=L1"
				},{
					name : "searchAutocomplete",
					value : "XZ"
				}];
	
				// act
		    	new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DESIGN_OFFICE_ENTITIES.length).toBe(0);
			});	
		});
	}).addTags(["Administration_NoCF_Integration"]);
}