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
	describe('xsjs.db.administration.confidenceLevel-integrationtests', function() {
	
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel : {
							"procConfidenceLevelRead": "sap.plc.db.administration.procedures/p_confidence_level_read",
						},
						substituteTables : {
							confidenceLevel : Resources["Confidence_Level"].dbobjects.plcTable,
							confidenceLevelText : Resources["Confidence_Level"].dbobjects.plcTextTable,
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Confidence_Level"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Confidence_Level": procedureXsunit
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
				mockstar.insertTableData("confidenceLevel", testData.oConfidenceLevelTestDataPlc);
				mockstar.insertTableData("confidenceLevelText", testData.oConfidenceLevelTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid confidence levels', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Confidence_Level"
				} ];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CONFIDENCE_LEVEL_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.CONFIDENCE_LEVEL_TEXT_ENTITIES.length).toBe(1);
			});
		});
	}).addTags(["Administration_NoCF_Integration"]);
}