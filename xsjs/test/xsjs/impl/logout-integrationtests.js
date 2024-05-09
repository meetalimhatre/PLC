var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;	
var PersistencySession = require("../../../lib/xs/db/persistency-session");
var mTableNames = PersistencySession.Tables;
var testdata = require("../../testdata/testdata").data;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var Persistency = $.import("xs.db", "persistency").Persistency;

var oDefaultResponseMock = null;
var oPersistency = null;

var userSchema = $.session.getUsername().toUpperCase();
var sSessionId = userSchema;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.logout-integrationtests', function() {
		var mockstar = null; 
		var userSchema = testdata.userSchema;
		var oSession = {
				SESSION_ID : [ userSchema ],
				USER_ID : [ userSchema ],
				LANGUAGE : [ "EN" ],
				LAST_ACTIVITY_TIME : [ new Date()]
		};

		beforeOnce(function() {
			mockstar = new MockstarFacade({
				substituteTables : {
					session : mTableNames.session,
					open_calculation_versions : 'sap.plc.db::basis.t_open_calculation_versions',
					lock : "sap.plc.db::basis.t_lock"
				},
			});
		});

		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.insertTableData("session", oSession);
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
		});

		afterOnce(function() { 
			mockstar.cleanup();
		});

		function prepareRequest() {
			var params = [];
			params.get = function(){
				return undefined;
			}
			var oRequest = {
					queryPath: "logout",
					method: $.net.http.POST,
					parameters:params
			};
			return oRequest;
		}

		it("should return ok when the session was deleted", function() {
			// arrange
			var oRequest = prepareRequest();
            oPersistency.Misc.setLock(BusinessObjectTypes.Metadata, sSessionId);
            var otLockBefore = mockstar.execQuery("select lock_object, user_id, last_updated_on from {{lock}}");
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
            expect(otLockBefore.columns.LAST_UPDATED_ON.rows.length).toBe(1);
            expect(otLockBefore.columns.LOCK_OBJECT.rows.length).toBe(1);
            expect(otLockBefore.columns.USER_ID.rows.length).toBe(1);
            
			// assert
			var otLockAfter = mockstar.execQuery("select lock_object, user_id, last_updated_on from {{lock}}");
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
            expect(otLockAfter.columns.LAST_UPDATED_ON.rows.length).toBe(0);
            expect(otLockAfter.columns.LOCK_OBJECT.rows.length).toBe(0);
            expect(otLockAfter.columns.USER_ID.rows.length).toBe(0);
		});
		
	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}