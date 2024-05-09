var testdata = require("../../testdata/testdata").data;
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;	
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Persistency = $.import("xs.db", "persistency").Persistency;
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

var oDefaultResponseMock = null;
var oPersistency = null;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.ping-integrationtests', function() {

		function prepareRequest() {
			var params = [];
			params.get = function(){
				return undefined;
			}
			var oRequest = {
					queryPath: "ping",
					method: $.net.http.GET,
					parameters:params
			};
			return oRequest;
		}
	var mockstar = null; 
	
	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables : {
				session : "sap.plc.db::basis.t_session"
			},
		});
	});

		beforeEach(function() {		
		mockstar.clearAllTables();
		mockstar.insertTableData("session", testdata.oSessionTestData);
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
		});

		it("should return 200 OK", function() {
			// arrange
			var oRequest = prepareRequest();
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
		});
		
	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}