var _ = require("lodash");
var helpers = require("../../../lib/xs/util/helpers");
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;

var PersistencyImport = $.import("xs.db", "persistency");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency = PersistencyImport.Persistency;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

let sSessionId = testData.sSessionId;

describe('xsjs.impl.task-integrationtests', function() {

	var oMockstar = null;

	var oDefaultResponseMock = null;
	var oPersistency = null;

	function prepareRequest(iTaskId) {
		var params = [{
			name: "id",
			value: iTaskId
		}];
		params.get = function(sParameterName) {
			if (helpers.isNullOrUndefined(sParameterName)) {
				return null;
			} else {
				if (sParameterName === "id") {
					return iTaskId;
				}
			}
		};
		var oRequest = {
				queryPath: "tasks",
				method: $.net.http.GET,
				parameters: params
		};
		return oRequest;
	}

	beforeOnce(function() {

		oMockstar = new MockstarFacade(
				{
					substituteTables : {
						task: 'sap.plc.db::basis.t_task',
						session : {
							name : "sap.plc.db::basis.t_session",
							data : testData.oSessionTestData
						},
						timeout: 'sap.plc.db::basis.t_application_timeout',
					}
				});
	});

	beforeEach(function() {
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;

		oMockstar.clearAllTables(); // clear all specified substitute tables
		oMockstar.initializeData();
		oMockstar.insertTableData("task", testData.oTask);
		oMockstar.insertTableData("timeout", testData.oApplicationTimeout);
	});

	if(jasmine.plcTestRunParameters.mode === 'all'){

		it('get should not mark all the tasks with TASK_TYPE = PROJECT_CALCULATE_LIFECYCLE_VERSIONS as CANCELED', function(){

			//arrange
			var oRequest = prepareRequest(null);
			var sUserId = $.session.getUsername();
		
			oMockstar.clearTable("task");
			oMockstar.insertTableData("task",{
				"TASK_ID" : [1, 2],
				"SESSION_ID": [sUserId, sUserId],
				"TASK_TYPE": ["PROJECT_CALCULATE_LIFECYCLE_VERSIONS","PROJECT_CALCULATE_LIFECYCLE_VERSIONS"],

				"STATUS": ['INACTIVE', 'INACTIVE'],
				"CREATED_ON": [new Date(),  new Date()],				
			});
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);
			expect(_.isObject(oResponseObject.head)).toBe(true);
			expect(oResponseObject.body).toBeDefined(); 
			
			expect(oResponseObject.body.transactionaldata.length).toBe(2);
			expect(oResponseObject.body.transactionaldata[0].STARTED).toBeDefined();
			expect(oResponseObject.body.transactionaldata[1].STARTED).toBeDefined();
			
			var oExpectedValues = {
				"TASK_ID":  [1, 2],
				"TASK_TYPE":  ['PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS'],
				"STATUS":  ['INACTIVE','INACTIVE'],
			}
			expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedValues, ["TASK_ID"]);
		});

		it('get should mark all the tasks with TASK_TYPE = PROJECT_CALCULATE_LIFECYCLE_VERSIONS as CANCELED if those timeout', function(){

			//arrange
			var oRequest = prepareRequest(null);
			var sUserId = $.session.getUsername();
			
			var sDate = new Date();
			sDate.setMinutes(sDate.getMinutes() - 30);
			oMockstar.clearTable("task");
			oMockstar.insertTableData("task",{
				"TASK_ID" : [1, 2],
				"SESSION_ID": [sUserId, sUserId],
				"TASK_TYPE": ["PROJECT_CALCULATE_LIFECYCLE_VERSIONS","PROJECT_CALCULATE_LIFECYCLE_VERSIONS"],
				"STATUS": ['INACTIVE', 'INACTIVE'],
				"CREATED_ON": [sDate,  sDate],				
			});

			oMockstar.clearTable("timeout");
			oMockstar.insertTableData("timeout",{
				"APPLICATION_TIMEOUT_ID": ["0"],
				"VALUE_IN_SECONDS": [30]
			});

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);
			expect(_.isObject(oResponseObject.head)).toBe(true);
			expect(oResponseObject.body).toBeDefined(); 
			
			expect(oResponseObject.body.transactionaldata.length).toBe(2);
			expect(oResponseObject.body.transactionaldata[0].STARTED).toBeDefined();
			expect(oResponseObject.body.transactionaldata[1].STARTED).toBeDefined();
			
			var oExpectedValues = {
				"TASK_ID":  [1, 2],
				"TASK_TYPE":  ['PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS'],
				"STATUS":  ['CANCELED','CANCELED'],
			}
			expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedValues, ["TASK_ID"]);
		});

		it('get should read all tasks for the requesting user', function() {
			//arrange
			var oRequest = prepareRequest(null);

			// act
			let sessionTimestamp1 = oMockstar.execQuery("select * from {{session}} where session_id = '" + sSessionId + "'").columns.LAST_ACTIVITY_TIME.rows[0];
			setTimeout(function(){console.log('Wait before execution')}, 60000);
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			let sessionTimestamp2 = oMockstar.execQuery("select * from {{session}} where session_id = '" + sSessionId + "'").columns.LAST_ACTIVITY_TIME.rows[0];
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);
			expect(_.isObject(oResponseObject.head)).toBe(true);
			expect(oResponseObject.body).toBeDefined();   
			
			expect(oResponseObject.body.transactionaldata.length).toBe(3);
			var oExpectedValues = {
					"TASK_ID":  [100, 103, 104],
					"SESSION_ID":  [testData.sSessionId, testData.sSessionId, testData.sSessionId],
					"TASK_TYPE":  ['PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS'],
					"STATUS":  ['active','inactive','active'],
					"PARAMETERS":  ['par1', 'par4', 'par5'],
					"PROGRESS_STEP":  [6, 0, 7],
					"PROGRESS_TOTAL":  [12, 15, 11],
					"ERROR_CODE": [null, 'stopped', null],
					"ERROR_DETAILS":  [null, 'terminated', null]				
			};
			expect(oResponseObject.body.transactionaldata).toMatchData(oExpectedValues, ["TASK_ID"]);
			expect(sessionTimestamp1).not.toEqual(sessionTimestamp2);
		});
		
		it('get should read the requested task belonging to the user', function() {
			//arrange
			var oRequest = prepareRequest(100);

			// act
			let sessionTimestamp1 = oMockstar.execQuery("select * from {{session}} where session_id = '" + sSessionId + "'").columns.LAST_ACTIVITY_TIME.rows[0];
			setTimeout(function(){console.log('Wait before execution')}, 60000);
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			let sessionTimestamp2 = oMockstar.execQuery("select * from {{session}} where session_id = '" + sSessionId + "'").columns.LAST_ACTIVITY_TIME.rows[0];
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(_.isObject(oResponseObject)).toBe(true);
			expect(_.isObject(oResponseObject.head)).toBe(true);
			expect(oResponseObject.body).toBeDefined();   
			
			expect(oResponseObject.body.transactionaldata.length).toBe(1);
			expect(oResponseObject.body.transactionaldata[0]).toMatchData(mockstar_helpers.convertToObject(testData.oTask, 0), [ "TASK_ID", "SESSION_ID" ]);			
			expect(sessionTimestamp1).not.toEqual(sessionTimestamp2);
		});
		
		it('get should return general_entity_not_found when the task id does not exist in the table', function() {
			//arrange
			var oRequest = prepareRequest(111);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');			
		});
		
		it('get should return general_entity_not_found when the task id does not belong to the requesting user', function() {
			//arrange
			var oRequest = prepareRequest(111);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');			
		});

	}
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);