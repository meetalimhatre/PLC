var _ = require("lodash");
var testData = require("../../testdata/testdata").data;

var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;

describe('xsjs.authorization.plc-users-integrationtests', function(){
	var Persistency = $.import("xs.db", "persistency").Persistency;
	var oCtx = DispatcherLibrary.prepareDispatch($);

	var oMockstar = null;
	var oDefaultResponseMock = null;
	
	beforeOnce(function() {

		oMockstar = new MockstarFacade(
				{
					substituteTables : {
					
						session : {
							name : "sap.plc.db::basis.t_session",
							data : testData.oSessionTestData
						},
						auto_complete_user: {
							name : "sap.plc.db::basis.t_auto_complete_user",
							data : testData.oAutoCompleteUserData
						}
					}
				});
	});
	
	
	beforeEach(function () {
		var oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
		oMockstar.clearAllTables();
		oMockstar.initializeData();
	});
	
	function buildRequest(params, iHttpMethod){
		// parameter object to simulate the list of parameters from request
		
		var oRequest = {
				queryPath: "plc-users",
				method: iHttpMethod
		};
		
		if(!_.isNull(params)){
			params.get = function(sArgument){
				var oParam = _.find(params, function(param){
					return sArgument === param.name;
				});
				
				return oParam !== undefined ? oParam.value : undefined;
			};
			oRequest.parameters = params;
		}
		return oRequest;
	}
	if(jasmine.plcTestRunParameters.mode === 'all'){
		
		describe('get', function() {
		it('should retrieve one user from table auto_complete_user', function(){
		//arrange
    	var params = [ {
						name : "top",
						value : "1"
					}];

		var oRequest = buildRequest(params, $.net.http.GET);
		
		//act
		new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		//assert
		expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
		var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		var oReturnedObject = oResponseObject.body;
		
		expect(oReturnedObject.PLC_USERS.length).toBe(1);
		
		});
		
		it('should retrieve the test user', function(){
		//arrange
    	var params = [ {
						name : "top",
						value : "1"
					},
					{
					    name: "searchAutocomplete",
					    value: testData.oAutoCompleteUserData.USER_ID[0]
					}];

		var oRequest = buildRequest(params, $.net.http.GET);
		
		//act
		new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		//assert
		expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
		var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		var oReturnedObject = oResponseObject.body;
		
		expect(oReturnedObject.PLC_USERS.length).toBe(1);
		expect(oReturnedObject.PLC_USERS[0].USER_ID).toBe(testData.oAutoCompleteUserData.USER_ID[0]);
		
		});
		
		
		it('should not retrieve any user if top = 0', function(){
		//arrange
    	var params = [{
						name : "top",
						value : "0"
					}];

		var oRequest = buildRequest(params, $.net.http.GET);
		
		//act
		new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		//assert
		expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
		var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		var oReturnedObject = oResponseObject.body;
		
		expect(oReturnedObject.PLC_USERS.length).toBe(0);
		
		});
		
		it('should not retrieve any user if given parameter does not exist', function(){
		//arrange
    	var params = [{
					    name: "searchAutocomplete",
					    value: "dummyuser"
					}];

		var oRequest = buildRequest(params, $.net.http.GET);
		
		//act
		new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		//assert
		expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
		var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		var oReturnedObject = oResponseObject.body;
		
		expect(oReturnedObject.PLC_USERS.length).toBe(0);
		
		});

	});
	}
	
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);