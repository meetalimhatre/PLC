//TODO: init tables with Mockstar (when init with different schemas is implemented) and remove green code
var constants = require("../../../lib/xs/util/constants");
var testdata = require("../../testdata/testdata").data;
const testUtil = require("../../utils/testUtil.js");

var DispatcherLibrary =  require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

var PersistencyImport = $.import("xs.db", "persistency");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency = PersistencyImport.Persistency;

var PersistencyMiscImport = require("../../../lib/xs/db/persistency-misc");
var mTableNames = PersistencyMiscImport.Tables;

var oDefaultResponseMock = null;

var oPersistency = null;

var sUserId = testdata.sTestUser;
var sSessionId = testdata.sSessionId;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.dispatcher-integrationtests', function() {

		describe("updateActivityTime", function() {
			var oMockstar = null;

			var oSession = {
					SESSION_ID : [ sSessionId ],
					USER_ID : [ sUserId ],
					LANGUAGE : [ "EN" ],
					LAST_ACTIVITY_TIME : [ new Date()]
			};

			beforeOnce(function() {

				oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables: // substitute all used tables in the procedure or view
							{
								session: mTableNames.session,
								lock : mTableNames.lock
							}
						});
			});


			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("session", oSession);
				oPersistency = new Persistency(jasmine.dbConnection);
				oCtx.persistency = oPersistency;
			});
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
			
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;

			afterOnce(function() {
				oMockstar.cleanup();
			});

			function prepareRequest() {

				// create a new calculation object as payload of the request; use data from testdata.xsjslib as basis
				var params = [];

				var oRequest = {
						queryPath: "ping",
						method: $.net.http.GET,
						parameters: params
				};
				return oRequest;
			}

			it("should update the last activity time in table t_session", function() {
				//arrange
				var oRequest = prepareRequest();
				var oSessionBefore = oMockstar.execQuery("select * from {{session}}");

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oSessionAfter = oMockstar.execQuery("select * from {{session}}");
				expect(oSessionAfter.columns.LAST_ACTIVITY_TIME.rows[0] >= oSessionBefore.columns.LAST_ACTIVITY_TIME.rows[0]).toBeTruthy();
			});  
			
			it("should not update the last activity time in table t_session when system is locked", function() {
				//arrange
			    var oLockSession = {
    				SESSION_ID : [ testdata.sSecondUser ],
    				USER_ID : [ testdata.sSecondUser ],
    				LANGUAGE : [ "EN" ],
    				LAST_ACTIVITY_TIME : [ new Date()]
			    };
			    oMockstar.insertTableData("session", oLockSession);
			    var BusinessObjectTypes = constants.BusinessObjectTypes;
			    
			    oPersistency.Misc.setLock(BusinessObjectTypes.Metadata, testdata.sSecondUser);
			    var oRequest = prepareRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oSessionAfter = oMockstar.execQuery("select * from {{session}}");
				expect(oDefaultResponseMock.status).toBe($.net.http.SERVICE_UNAVAILABLE);
			});  

		});
		describe("updateUserActivityTime", function() {
			var oMockstar = null;
			var oUserActivity = {
				"USER_ID" : ["User1", "User2", "User3"],
				"LAST_ACTIVITY_TIME" : ["2019-01-20T00:00:00.000Z", "2019-03-20T00:00:00.000Z", "2019-01-21T00:00:00.000Z"]
		}
			beforeOnce(function() {

				oMockstar = new MockstarFacade( // Initialize Mockstar
						{
							substituteTables: // substitute all used tables in the procedure or view
							{
								session: mTableNames.session,
								lock : mTableNames.lock,
								user_activity: {
									name: "sap.plc.db::basis.t_user_activity",
									data: oUserActivity
								}
							}
						});
			});


			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("session", testdata.oSessionTestData);
				oPersistency = new Persistency(jasmine.dbConnection);
				oCtx.persistency = oPersistency;
			});
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
			
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;

			afterOnce(function() {
				oMockstar.cleanup();
			});

			function prepareRequest() {

				// create a new calculation object as payload of the request; use data from testdata.xsjslib as basis
				var params = [];

				var oRequest = {
						queryPath: "ping",
						method: $.net.http.GET,
						parameters: params
				};
				return oRequest;
			}
		if (testUtil.isCloud()) {  //check that data is inserted for the on cloud systems and not for the on prem systems
				it("should insert values in t_user_activity for the on cloud systems", function() {
					//arrange
					oMockstar.clearTable("user_activity");
					
					var oRequest = prepareRequest();
					
					// act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					// assert
					var oUserActivityAfter = oMockstar.execQuery("select count(*) as rowcount from {{user_activity}}");
					expect(oUserActivityAfter.columns.ROWCOUNT.rows[0]).toBe(1);
				});  
		} else {
			it("should not insert value in t_user_activity for the on prem systems", function() {
				//arrange
				oMockstar.clearTable("user_activity");
				
				var oRequest = prepareRequest();
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oUserActivityAfter = oMockstar.execQuery("select count(*) as rowcount from {{user_activity}}");
				expect(oUserActivityAfter.columns.ROWCOUNT.rows[0]).toBe(0);
			});  

		}
		});
	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}