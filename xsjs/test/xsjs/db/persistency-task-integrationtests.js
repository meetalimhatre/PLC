var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;
var constants = require("../../../lib/xs/util/constants"); 
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

describe('xsjs.impl.persistency-task-integrationtests', function() {
	
	var originalProcedures = null;
	var mockstar = null;

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables : {
				task: 'sap.plc.db::basis.t_task'
			}
		});
	});

	afterOnce(function() {
		mockstar.cleanup();
	});

	beforeEach(function() {
		mockstar.clearAllTables(); // clear all specified substitute tables
		mockstar.insertTableData("task", testData.oTask);
	});

	if(jasmine.plcTestRunParameters.mode === 'all'){

		it('getTask should return the task for the specified id from the database', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var result = persistency.Task.get(testData.sSessionId, null, 100);

			// assert
			expect(result.length).toEqual(1);
		});

		it('getTask should return an empty object when the task is not found in the database', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var result = persistency.Task.get(testData.sSessionId, null, 22);

			// assert
			expect(result.length).toEqual(0);
		});

		it('getTasks should return the tasks for the specified user id from the database', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var result = persistency.Task.get(testData.sSessionId, null, null);

			// assert
			expect(result.length).toEqual(3);
		});
		
		it('getTasks should return the tasks for a certain type from the database', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var result = persistency.Task.get(null, 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS', null);

			// assert
			expect(result.length).toEqual(4);
		});

		it('getTasks should return an empty array when no tasks for the user are found in the database', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var result = persistency.Task.get("session");

			// assert
			expect(result.length).toEqual(0);
		});

		it('getTasks should return an empty array if the task does not exist for the user', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var result = persistency.Task.get("Session2", 1);

			// assert
			expect(result.length).toEqual(0);
		});

		it('createTask should create a task in the database', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			var oCreateTask = {
					"SESSION_ID":  testData.sSessionId,
					"TASK_TYPE": 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS',
					"STATUS":  'active',
					"PARAMETERS":  'par5',
					"PROGRESS_STEP":  0,
					"PROGRESS_TOTAL":  18,
					"STARTED":  null,
					"LAST_UPDATED_ON": null,
					"ERROR_CODE": null,
					"ERROR_DETAILS":  null
			};
			var rowCountBefore = mockstar_helpers.getRowCount(mockstar, "task");

			//act
			var result = persistency.Task.create(oCreateTask);

			// assert
			expect(mockstar_helpers.getRowCount(mockstar, "task")).toBe(rowCountBefore+1);
			var oResult = mockstar.execQuery("select * from {{task}} where task_id = " + result.TASK_ID);
			oCreateTask.TASK_ID = result.TASK_ID;
			expect(oResult).toMatchData(oCreateTask, ["TASK_ID"]);
		});

		it('updateTask should create a task in the database', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			var oUpdateTask = {
					"TASK_ID":  100,
					"SESSION_ID":  testData.sSessionId,
					"STATUS":  'inactive',
					"PARAMETERS":  'par6',
					"ERROR_CODE": 'terminate'
			};
			
			//act
			persistency.Task.update(oUpdateTask);

			// assert
			var oResult = mockstar.execQuery("select * from {{task}} where task_id = 100");
			var oExpectedResult = mockstar_helpers.convertToObject(testData.oTask, 0);
			oExpectedResult.STATUS = 'inactive';
			oExpectedResult.PARAMETERS = 'par6';
			oExpectedResult.ERROR_CODE = 'terminate';
			expect(oResult).toMatchData(oExpectedResult, ["TASK_ID"]);
		});

		it('should check if a task is active', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			var oTask = {
					"TASK_ID":  1001,
					"SESSION_ID":  testData.sSessionId,
					"TASK_TYPE": 'METADATA_CUSTOM_FIELDS',
					"STATUS":  'ACTIVE',
					"PARAMETERS":  'par5',
					"PROGRESS_STEP":  0,
					"PROGRESS_TOTAL":  18,
					"STARTED":  null,
					"LAST_UPDATED_ON": null,
					"ERROR_CODE": null,
					"ERROR_DETAILS":  null
			};

			mockstar.insertTableData("task", oTask);

			//act
			var result = persistency.Task.isTaskInProgress("METADATA_CUSTOM_FIELDS");

			// assert
			expect(result).toBeTruthy();
		});


		it('Should set all existing METADATA_CUSTOM_FIELDS task that are INACTIVE and older than 30 minutes to Cancelled', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			let oDateTimeLess25Minutes = new Date(Date.now() - 1000 * (60 * 25));
			let oDateTimeLess35Minutes = new Date(Date.now() - 1000 * (60 * 35));
			let oDateTimeLess1Day = new Date(Date.now() - 1000 * (60 * 1440));
			
			var oTaskData = [{
				"TASK_ID" : 1,
				"SESSION_ID" : $.session.getUsername(),
				"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
				"STATUS" : 'INACTIVE',
				"PARAMETERS" : null,
				"PROGRESS_STEP" : 0,
				"PROGRESS_TOTAL" : 4,
				"CREATED_ON" : new Date(),
				"STARTED" : null,
				"LAST_UPDATED_ON" : new Date(),
				"ERROR_CODE" : null,
				"ERROR_DETAILS" : null
			},{
				"TASK_ID" : 2,
				"SESSION_ID" : $.session.getUsername(),
				"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
				"STATUS" : 'INACTIVE',
				"PARAMETERS" : null,
				"PROGRESS_STEP" : 0,
				"PROGRESS_TOTAL" : 4,
				"CREATED_ON" : oDateTimeLess25Minutes,
				"STARTED" : null,
				"LAST_UPDATED_ON" : oDateTimeLess25Minutes,
				"ERROR_CODE" : null,
				"ERROR_DETAILS" : null
			},{
				"TASK_ID" : 3,
				"SESSION_ID" : $.session.getUsername(),
				"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
				"STATUS" : 'INACTIVE',
				"PARAMETERS" : null,
				"PROGRESS_STEP" : 0,
				"PROGRESS_TOTAL" : 4,
				"CREATED_ON" : oDateTimeLess35Minutes,
				"STARTED" : null,
				"LAST_UPDATED_ON" : oDateTimeLess35Minutes,
				"ERROR_CODE" : null,
				"ERROR_DETAILS" : null
			},{
				"TASK_ID" : 4,
				"SESSION_ID" : $.session.getUsername(),
				"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
				"STATUS" : 'INACTIVE',
				"PARAMETERS" : null,
				"PROGRESS_STEP" : 0,
				"PROGRESS_TOTAL" : 4,
				"CREATED_ON" : oDateTimeLess1Day,
				"STARTED" : null,
				"LAST_UPDATED_ON" : oDateTimeLess1Day,
				"ERROR_CODE" : null,
				"ERROR_DETAILS" : null
			}];
			mockstar.insertTableData("task", oTaskData);

			persistency.Task.cancelTasksWithStatusAndLastUpdatedOlderThan(constants.TaskStatus.INACTIVE, constants.TaskType.METADATA_CUSTOM_FIELDS, 30) ;
			
			//assertions
			var oInactiveTask1 = mockstar.execQuery("select * from {{task}} WHERE TASK_ID = 1");
			var oInactiveTask2 = mockstar.execQuery("select * from {{task}} WHERE TASK_ID = 2");
			var oCancelledTask1 = mockstar.execQuery("select * from {{task}} WHERE TASK_ID = 3");
			var oCancelledTask2 = mockstar.execQuery("select * from {{task}} WHERE TASK_ID = 4");
			
			expect(oInactiveTask1.columns.STATUS.rows[0]).toEqual('INACTIVE');
			expect(oInactiveTask1.columns.STATUS.rows.length).toEqual(1);
			expect(oInactiveTask2.columns.STATUS.rows[0]).toEqual('INACTIVE');
			expect(oInactiveTask2.columns.STATUS.rows.length).toEqual(1);
			expect(oCancelledTask1.columns.STATUS.rows[0]).toEqual('CANCELED');
			expect(oCancelledTask1.columns.STATUS.rows.length).toEqual(1);
			expect(oCancelledTask2.columns.STATUS.rows[0]).toEqual('CANCELED');
			expect(oCancelledTask2.columns.STATUS.rows.length).toEqual(1);
		});

	}

}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);