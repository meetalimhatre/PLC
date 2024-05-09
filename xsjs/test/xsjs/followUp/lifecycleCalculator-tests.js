const _ = require("lodash");
const LifecycleVersionCalculator = $.import("xs.followUp", "lifecycleCalculator").LifecycleVersionCalculator;
const Message = require("../../../lib/xs/util/message").Code;
const TaskStatus = require("../../../lib/xs/util/constants").TaskStatus;
const TaskType = require("../../../lib/xs/util/constants").TaskType;

if (jasmine.plcTestRunParameters.mode === 'all') {

	describe('xsjs.followUp.lifecycleCalculator-tests', () => {

		var oPersistencyMock;
		var oTaskServiceMock;
		var oConnectionFactoryMock;
		var sProjectId = "sProjectId";
		var iTaskId = 1;
		var oTask;
		var aCreatedLifecycleVersions = [
			{
				CALCULATION_VERSION_ID: 1,
				LIFECYCLE_PERIOD_FROM: 1404
			},
			{
				CALCULATION_VERSION_ID: 2,
				LIFECYCLE_PERIOD_FROM: 1416
			},
			{
				CALCULATION_VERSION_ID: 3,
				LIFECYCLE_PERIOD_FROM: 1428
			}, {
				CALCULATION_VERSION_ID: 4,
				LIFECYCLE_PERIOD_FROM: 1440
			}];

		var lifecycleVersionCalculator;
		var _createTask = () => {
			return {
				"TASK_ID": iTaskId,
				"SESSION_ID": $.session.getUsername(),
				"TASK_TYPE": TaskType.CALCULATE_LIFECYCLE_VERSIONS,
				"STATUS": TaskStatus.INACTIVE,
				"PARAMETERS": JSON.stringify({
					PROJECT_ID: sProjectId
				}),
				"PROGRESS_STEP": 0,
				"PROGRESS_TOTAL": 4,
				"STARTED": new Date(),
				"LAST_UPDATED_ON": new Date(),
				"ERROR_CODE": null,
				"ERROR_DETAILS": null
			}
		};

		function _createConnectionMock() {
			return jasmine.createSpyObj("oConnectionMock", ["commit", "rollback"]);
		}

		function _checkTaskSetToFailed(iErrorCode) {
			jasmine.log("Checking if the error code/details for the task were set");
			expect(oTaskServiceMock.updateTask).toHaveBeenCalled()
			var oTaskForUpdate = oTaskServiceMock.updateTask.calls.mostRecent().args[0];
			var oTaskForUpdateLastStatus = oTaskServiceMock.updateTask.calls.mostRecent().args[1];

			expect(oTaskForUpdate.TASK_ID).toEqual(iTaskId);
			expect(oTaskForUpdateLastStatus.ERROR_CODE).toEqual((iErrorCode === null || iErrorCode ===undefined) ? Message.PROJECT_CALCULATE_LIFECYCLEVERSION_ERROR.code:iErrorCode);
			expect(typeof(oTaskForUpdateLastStatus.ERROR_DETAILS) === "string").toBe(true);

			jasmine.log("Checking if the modification on t_task was commited");
		}

		function _checkCalculationNotExecuted() {
			jasmine.log("Checking if no further steps of the calculation were executed");
			expect(oPersistencyMock.Project.createLifecycleVersions).not.toHaveBeenCalled();
		}

		/**		
		 * Utility method to set-up, execute and basic assert a test on {@link TaskService#update}. Tests for this function have a similar structure and are needed 
		 * frequently within this test suite. It does some basic checks needed for all 
		 * 		 
		 * @param  {type} iIndexOfUpdateCall 	Because {@link TaskService#update} is called several times by the {@link LifecycleCalculator} this index specifies 
		 * 										the index of the call during the execution of {@link LifecycleCalculator#calculate}, which shall be tested
		 * @return {type}                    	Returns the passed Task object to {@link TaskService#update} for further asserts in the particular tests		 
		 */
		function _runTaskServiceUpdateTest(iIndexOfUpdateCall) {
			// act
			lifecycleVersionCalculator.calculate();

			// assert
			jasmine.log("Checking if TaskService was called with the correct parameters");

			// make sure update was called at least the number of time specified by the given index; 
			expect(oTaskServiceMock.updateTask.calls.count() >= (iIndexOfUpdateCall - 1)).toBe(true);

			var oTaskObj = oTaskServiceMock.updateTask.calls.argsFor(iIndexOfUpdateCall)[0];
			var oTaskObjAfterUpdate = oTaskServiceMock.updateTask.calls.argsFor(iIndexOfUpdateCall)[1];
			// do some default checks on the task
			expect(oTaskObj.TASK_ID).toEqual(oTask.TASK_ID);
			expect(oTaskObj.SESSION_ID).toEqual(oTask.SESSION_ID);

			oTaskObj.PROGRESS_TOTAL = oTaskObjAfterUpdate.PROGRESS_TOTAL;
			oTaskObj.PROGRESS_STEP = oTaskObjAfterUpdate.PROGRESS_STEP;
			oTaskObj.STATUS = oTaskObjAfterUpdate.STATUS;

			return oTaskObj;
		}

		beforeEach(() => {
			oTask = _createTask();

			var oProjectPersistencyMock = jasmine.createSpyObj("oProjectPersistencyMock", ["createLifecycleVersions", "calculteLifecycleVersions", "exists", "checkManualOneTimeCosts"]);
			oProjectPersistencyMock.exists.and.returnValue(true);
			oProjectPersistencyMock.createLifecycleVersions.and.returnValue(aCreatedLifecycleVersions);
			oProjectPersistencyMock.checkManualOneTimeCosts.and.returnValue(true);

			var oCalculationVersionPersistencyMock = jasmine.createSpyObj("oCalculationVersionPersistencyMock", ["priceDetermination"]);

			oTaskServiceMock = jasmine.createSpyObj("oTaskServiceMock", ["getById", "updateTask"]);
			oTaskServiceMock.getById.and.returnValue(oTask);

			oConnectionFactoryMock = jasmine.createSpyObj("oConnectionFactoryMock", ["getConnection"]);
			var oDefaultConnection = _createConnectionMock();
			oConnectionFactoryMock.getConnection.and.returnValue(oDefaultConnection);

			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
			oPersistencyMock.getConnection.and.returnValue(oDefaultConnection);
			oPersistencyMock.Project = oProjectPersistencyMock;
			oPersistencyMock.CalculationVersion = oCalculationVersionPersistencyMock;


			lifecycleVersionCalculator = new LifecycleVersionCalculator(iTaskId, oPersistencyMock, oConnectionFactoryMock, oTaskServiceMock);
		});

		it("should set error code/details for task and abort execution if project cannot be found", () => {
			// arrange
			oPersistencyMock.Project.exists.and.returnValue(false);

			// act
			lifecycleVersionCalculator.calculate();

			// assert
			_checkTaskSetToFailed();
			_checkCalculationNotExecuted();
		});

		it("should set error code/details for task and abort execution if task cannot be found", () => {
			var aTaskServiceReturnValuesToCheck = [null, undefined];
			_.each(aTaskServiceReturnValuesToCheck, vValue => {
				jasmine.log(`Checking if ${vValue} is handled correctly`);

				// arrange
				oTaskServiceMock.getById.and.returnValue(vValue);

				// act	
				lifecycleVersionCalculator.calculate();

				// assert
				_checkCalculationNotExecuted();
			});
		});

		it("should set error code/details for task and abort execution if task is not inactive", () => {
			// arrange
			oTask.STATUS = TaskStatus.ACTIVE;

			// act	
			lifecycleVersionCalculator.calculate();

			// assert
			_checkTaskSetToFailed();
			_checkCalculationNotExecuted();
		});

		it("should set error code/details for task and abort execution if task type is not PROJECT_CALCULATE_LIFECYCLE_VERSIONS", () => {
			// arrange
			oTask.TASK_TYPE = TaskStatus.CALCULATE_LIFECYCLE_VERSIONS;

			// act	
			lifecycleVersionCalculator.calculate();

			// assert
			_checkTaskSetToFailed();
			_checkCalculationNotExecuted();
		});

		it("should set error code/details for task and abort execution if task parameters has no value", () => {
			// arrange
			oTask.PARAMETERS = null;

			// act	
			lifecycleVersionCalculator.calculate();

			// assert
			_checkTaskSetToFailed();
			_checkCalculationNotExecuted();
		});

		it("should set error code/details for task and abort execution if task parameters contain invalid JSON string", () => {
			// arrange
			oTask.PARAMETERS = `{ "INVALID" : "JSON"`;

			// act	
			lifecycleVersionCalculator.calculate();

			// assert
			_checkTaskSetToFailed();
			_checkCalculationNotExecuted();
		});

		it("should set error code/details for task and abort execution if task parameters contain no PROJECT_ID JSON property", () => {
			// arrange
			oTask.PARAMETERS = JSON.stringify({
				NO_PROJECT_ID: "defined"
			})

			// act	
			lifecycleVersionCalculator.calculate();

			// assert
			_checkTaskSetToFailed();
			_checkCalculationNotExecuted();
		});

		it("should set error code/details for taks and abort execution if manual one time costs does not sum up to the declared cost in one time project/product costs", () =>{

			oPersistencyMock.Project.checkManualOneTimeCosts.and.returnValue(false);

			// act
			lifecycleVersionCalculator.calculate();

			// assert
			_checkTaskSetToFailed(Message.PROJECT_CALCULATE_LIFECYCLE_MAN_DISTRIB_ERROR.code);
			_checkCalculationNotExecuted();

		});

		it("should set task to failed and rollback transaction if an error occurs during createLifecycleVersions", () => {
			// arrange
			oPersistencyMock.Project.createLifecycleVersions.and.throwError(new Error());

			// act
			lifecycleVersionCalculator.calculate();

			// assert
			expect(oPersistencyMock.Project.createLifecycleVersions.calls.count()).toEqual(1);
			_checkTaskSetToFailed();
			expect(oPersistencyMock.getConnection).toHaveBeenCalled();
			expect(oPersistencyMock.getConnection().rollback).toHaveBeenCalled();
		});

		it("should initially set the task to active before start calculation", () => {
			// arrange
			var iIndexOfUpdateCall = 0;
			var iExpectedProgressTotal = 3;

			// act + basic assert
			var oTaskPassedToService = _runTaskServiceUpdateTest(iIndexOfUpdateCall);

			// additional assert specific to test
			expect(oTaskPassedToService.STATUS).toEqual(TaskStatus.ACTIVE);
			// expect(oTaskPassedToService.STARTED).toEqual(jasmine.any(Date));
			expect(oTaskPassedToService.STARTED instanceof Date).toBe(true);
			expect(oTaskPassedToService.PROGRESS_TOTAL).toEqual(iExpectedProgressTotal);
		});


		it("should call createLifecycleVersions for given project id", () => {
			// act
			lifecycleVersionCalculator.calculate();

			// assert
			expect(oPersistencyMock.Project.createLifecycleVersions.calls.count()).toEqual(1);
			expect(oPersistencyMock.Project.createLifecycleVersions.calls.first().args[0]).toEqual(sProjectId);
		});

		it("should update task progress after creating lifecycle versions", () => {
			// arrange
			var iIndexOfUpdateCall = 1;
			var iExpectedProgressStep = 1;

			// act + basic assert
			var oTaskPassedToService = _runTaskServiceUpdateTest(iIndexOfUpdateCall);

			// additional assert specific to test
			expect(oPersistencyMock.Project.createLifecycleVersions.calls.count()).toEqual(1);
			expect(oTaskPassedToService.PROGRESS_STEP).toEqual(iExpectedProgressStep);
		});

		it("should call price determination for every created lifecylce version in ascending order of lifecylce_period_from", () => {
			// arrange
			var oIdToPeriodFrom = new Map(aCreatedLifecycleVersions.map(oCreatedVersion => [oCreatedVersion.CALCULATION_VERSION_ID, oCreatedVersion.LIFECYCLE_PERIOD_FROM]));

			// act
			lifecycleVersionCalculator.calculate();

			// assert
			expect(oPersistencyMock.CalculationVersion.priceDetermination.calls.count()).toEqual(aCreatedLifecycleVersions.length);
			var aAllArgs = oPersistencyMock.CalculationVersion.priceDetermination.calls.allArgs();
			var iLastValueOfLifecyclePeriodFrom = -1;
			_.each(aAllArgs, (aArgsPerCallIndex, iCallIndex) => {
				var iCreatedCvId = aArgsPerCallIndex[0];
				expect(oIdToPeriodFrom.has(iCreatedCvId)).toBe(true);
				var iLifecyclePeriodFrom = oIdToPeriodFrom.get(iCreatedCvId);
				jasmine.log(
					`Checking if price determination was called for lifeycle version ${iCreatedCvId} with lifecylce_period_from ${iLifecyclePeriodFrom} (call index ${iCallIndex})`);
				expect(iLifecyclePeriodFrom).toBeGreaterThan(iLastValueOfLifecyclePeriodFrom);
				iLastValueOfLifecyclePeriodFrom = iLifecyclePeriodFrom;
			});
		});

		it("should update task progress after price determination", () => {
			// arrange
			var iIndexOfUpdateCall = 2;
			var iExpectedProgressStep = 2;

			// act + basic assert
			var oTaskPassedToService = _runTaskServiceUpdateTest(iIndexOfUpdateCall);

			// additional assert specific to test
			expect(oPersistencyMock.CalculationVersion.priceDetermination).toHaveBeenCalled();
			expect(oTaskPassedToService.PROGRESS_STEP).toEqual(iExpectedProgressStep);
		});

		it("should execute calculation engine for project with created lifecycle versions", () => {
			// act
			lifecycleVersionCalculator.calculate();

			// additional assert specific to test
			expect(oPersistencyMock.Project.calculteLifecycleVersions.calls.count()).toEqual(1);
			var sProjectIdPassed = oPersistencyMock.Project.calculteLifecycleVersions.calls.first().args[0];
			expect(sProjectIdPassed).toEqual(sProjectId);
		});

		it("should update task progress and set to completed after calculation engine executed", () => {
			// arrange
			var iIndexOfUpdateCall = 3;
			var iExpectedProgressStep = 3;

			// act + basic assert
			var oTaskPassedToService = _runTaskServiceUpdateTest(iIndexOfUpdateCall);

			// additional assert specific to test
			expect(oPersistencyMock.Project.calculteLifecycleVersions).toHaveBeenCalled();
			expect(oTaskPassedToService.PROGRESS_STEP).toEqual(iExpectedProgressStep);
			expect(oTaskPassedToService.STATUS).toEqual(TaskStatus.COMPLETED);
		});

		it("should commit the transaction after creating lifecycle versions", () => {
			// act
			lifecycleVersionCalculator.calculate();

			// assert
			expect(oPersistencyMock.Project.createLifecycleVersions.calls.count()).toEqual(1);
			expect(oPersistencyMock.Project.createLifecycleVersions.calls.first().args[0]).toEqual(sProjectId);
			expect(oPersistencyMock.getConnection).toHaveBeenCalled();
			expect(oPersistencyMock.getConnection().commit).toHaveBeenCalled();
		});

	}).addTags(["All_Unit_Tests"]);
}