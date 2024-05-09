/*jslint undef:true*/
/**
 * These are the integration tests for transportation.xsjslib. Here we test the end-to-end runs.
 *
 */
var helpers = require("../../../lib/xs/util/helpers");

var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var Persistency = $.import("xs.db", "persistency").Persistency;
var _ = require("lodash");

describe('xsjs.impl.transportation-integrationtests', function() {

	var oMockstar = null;
	var oDefaultResponseMock = null;
	var oDefaultPostResponseMock = null;
	var oPersistency = null;
	var sSource = 1;
	var userSchema = $.session.getUsername().toUpperCase();

	beforeOnce(function() {
		oMockstar = new MockstarFacade( // Initialize Mockstar
			{
				substituteTables: {
					controllingArea: {
						name: "sap.plc.db::basis.t_controlling_area",
						data: {
							"CONTROLLING_AREA_ID": ["1", "1", "2"],
							"CONTROLLING_AREA_CURRENCY_ID": ["1", "1", "2"],
							"_VALID_FROM": [new Date(2014, 1, 1).toJSON(), new Date(2015, 1, 1).toJSON(), new Date(2015, 2, 2).toJSON()],
							"_VALID_TO": [new Date(2015, 1, 1).toJSON(), null, null],
							"_SOURCE": [sSource, sSource, sSource],
							"_CREATED_BY": [userSchema, userSchema, userSchema]
						}
					},
					businessArea: {
						name: "sap.plc.db::basis.t_business_area",
						data: {
							"BUSINESS_AREA_ID": ["1000","3000","9900"],
							"_VALID_FROM": [new Date(2015, 1, 1).toJSON(),new Date(2015, 1, 1).toJSON(),new Date(2015, 1, 1).toJSON()],
							"_VALID_TO": [null,null,null],
							"_SOURCE": [1,1,1],
							"_CREATED_BY": [userSchema,userSchema,userSchema]
						}
					},
					businessAreaText: {
						name: "sap.plc.db::basis.t_business_area__text",
						data: {
							"BUSINESS_AREA_ID": ["1000"],
							"LANGUAGE":["EN"],
							"_VALID_FROM": [new Date(2015, 1, 1).toJSON()],
							"_VALID_TO": [null],
							"_SOURCE": [1],
							"_CREATED_BY": [userSchema]
						}
					}
				}
			});
	});

	afterOnce(function() {
		oMockstar.cleanup();
	});

	beforeEach(function() {
		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
		oDefaultPostResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status","followUp"]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		var oPostResponseHeaderMock = jasmine.createSpyObj("oPostResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
		oDefaultPostResponseMock.headers = oPostResponseHeaderMock;
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;
	});

	describe('import data (post method)', function() {

		

		beforeEach(function() {
			oMockstar.clearAllTables();
			oMockstar.initializeData();
		});


		it('should return exception because of data is inconsistent', function() {
			// prepare
			var oTransportationRequest = {
					"t_business_area__text": [["BUSINESS_AREA_ID","LANGUAGE"], ["BA1","EN"]]
			};
			var params = [];
			params.get = function(sParameterName) {
				if(sParameterName === "mode"){
					return "replace";
				}
			};
			var oCreateRequest = {
				queryPath: "transportation",
				method: $.net.http.POST,
				body: {
					asString: function() {
						return JSON.stringify(oTransportationRequest);
					}
				},
				parameters: params
			};
			
			// act
			new Dispatcher(oCtx, oCreateRequest, oDefaultPostResponseMock).dispatch();
			
			// assert
			expect(oDefaultPostResponseMock.status).toBe(500);
			expect(oDefaultPostResponseMock.setBody).toHaveBeenCalled();
			

			var oResponseObject = JSON.parse(oDefaultPostResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject).toBeDefined();
			expect(oResponseObject.body).toBeDefined();
			expect(oResponseObject.head.messages).toBeDefined();
		});
		
		// RF: test deactivated since master data import not supported right now
		xit('should import successfully to table t_controlling_area', function() {
			// prepare
			var oTransportationRequest = {
				"t_controlling_area": [
										["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID"],
										["3", "USD"],
										["4", null]
									]
			};
			var params = [];
			params.get = function(sParameterName) {
				if(sParameterName === "mode"){
					return "replace";
				}
			};
			var oCreateRequest = {
				queryPath: "transportation",
				method: $.net.http.POST,
				body: {
					asString: function() {
						return JSON.stringify(oTransportationRequest);
					}
				},
				parameters: params
			};
			
			// act
			new Dispatcher(oCtx, oCreateRequest, oDefaultResponseMock).dispatch();
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject).toBeDefined();
			expect(oResponseObject.body).toBeDefined();
		});
		
		// RF: test deactivated since master data import not supported right now
		xit('should import successfully to table t_business_area', function() {
			// prepare
			var oTransportationRequest = {
				"t_business_area": [
											["BUSINESS_AREA_ID"],
											["BA1"],
											["BA2"]
										]
			};
			var params = [];
			params.get = function(sParameterName) {
				if(sParameterName === "mode"){
					return "replace";
				}
			};
			var oCreateRequest = {
				queryPath: "transportation",
				method: $.net.http.POST,
				body: {
					asString: function() {
						return JSON.stringify(oTransportationRequest);
					}
				},
				parameters: params
			};

			// act
			new Dispatcher(oCtx, oCreateRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject).toBeDefined();
			// should return only the three "old" calculations, but not the newly created since its version has not been
			// saved
			expect(oResponseObject.body).toBeDefined();
		});
	});

	describe('export data (get method)', function() {

		beforeEach(function() {
			oMockstar.clearAllTables();
			oMockstar.initializeData();
		});

		it('should return customizing tables if businessObjects=customizing', function() {
			// arrange
			var params = [{
				name : "businessObjects",
				value: "customizing"
			}];
    
			params.get = function(sParameterName) {
				if(sParameterName === "businessObjects"){
					return "customizing"
				}
			}
			
			var oExportRequest = {
				queryPath: "transportation",
				method: $.net.http.GET,
				parameters: params
			};

			// act
			new Dispatcher(oCtx, oExportRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oResponseBody = oResponseObject.body;
			
			expect(_.isArray(oResponseBody.t_metadata)).toBe(true);
			expect(_.isArray(oResponseBody.t_metadata__text)).toBe(true);
			expect(_.isArray(oResponseBody.t_metadata_item_attributes)).toBe(true);
			expect(_.isArray(oResponseBody.t_formula)).toBe(true);
			//expect(_.isArray(oResponseBody.t_default_settings)).toBe(true);
			//expect(_.isArray(oResponseBody.t_addin_version)).toBe(true);
		});

		// RF: Deactivated since no other parameter value for businessObjects than "customizing" currently supported; tableNames 
		// as parameter is not supported at all
		xit('should return data from version and non-version table', function() {
			// prepare
			var params = [{
					name: "tableNames",
					value: "t_controlling_area"
				}];
                
			params.get = function(sParameterName) {
				if (helpers.isNullOrUndefined(sParameterName)) {
					return null;
				} else {
					if (sParameterName === "tableNames") {
						return "t_controlling_area";
					}
				}
			}
			
			var oCreateRequest = {
				queryPath: "transportation",
				method: $.net.http.GET,
				parameters: params
			};

			// act
			new Dispatcher(oCtx, oCreateRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject).toBeDefined();
		    expect(oResponseObject.body["t_controlling_area"]).toBeDefined();
		});
		
		// RF: Deactivated since no other parameter value for businessObjects than "customizing" currently supported; tableNames 
		// as parameter is not supported at all
		xit('should return exception when the table name is not correct or not allowed', function() {
			// act
			var params = [{
				name: "tableNames",
				value: "t_meta"
			}];
			params.get = function(sParameterName) {
				if (helpers.isNullOrUndefined(sParameterName)) {
					return null;
				} else {
					if (sParameterName === "tableNames") {
						return "t_meta";
					}
				}
			}
			var oCreateRequest = {
				queryPath: "transportation",
				method: $.net.http.GET,
				parameters: params
			};

			new Dispatcher(oCtx, oCreateRequest, oDefaultResponseMock).dispatch();
			// assert
			expect(oDefaultResponseMock.status).toBe(403);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject).toBeDefined();
			expect(oResponseObject.head.messages).toBeDefined();

		});
	});
	
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);