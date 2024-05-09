const _                          = require("lodash");
const helpers                    = require("../util/helpers");
const Constants                  = require("../util/constants");
const BusinessObjectTypes 	     = Constants.BusinessObjectTypes;
const ProjectServiceParameters   = Constants.ProjectServiceParameters;
const TaskType                   = Constants.TaskType;
const TaskStatus				 = Constants.TaskStatus;
const FollowUp                   = Constants.FollowUp;
const LifecycleInterval          = Constants.LifecycleInterval;

const CalculationVersionService  = require("../service/calculationVersionService");
const ProjectService             = require("../service/projectService");
const SessionService             = require("../service/sessionService");
const TaskService                = require("../service/taskService").TaskService;

const MessageLibrary = require("../util/message");
const PlcException =        MessageLibrary.PlcException;
const Message =             MessageLibrary.Message;
const Code =                MessageLibrary.Code;
const Severity =            MessageLibrary.Severity;
const MessageDetails =      MessageLibrary.Details;
const oSessions = new Map();


module.exports.Projects = function($) {

const ProjectTables = $.import("xs.db", "persistency-project").Tables;
const Tables = Object.freeze({
	folder: "sap.plc.db::basis.t_folder",
	project : 'sap.plc.db::basis.t_project',
	entity_relation : 'sap.plc.db::basis.t_entity_relation'
});

var sSessionId;
var sUserId;
sSessionId = sUserId = $.getPlcUsername();

/**
 * Function that checks the project parent information.
 * The first check is to make sure the entity id exists.
 * The second check is to make sure that for the requested entity id the requested path is the same as
 * the existing path in the database
 * If any of these checks fail, a PlcException will be thrown
 */
function checkEntityData(sPath, oPersistency, sTable, sPathType){
	const oPathCheck = {
		CODE_NOT_FOUND: sPathType === "PATH" ? Code.GENERAL_ENTITY_NOT_FOUND_ERROR :Code.GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR,
		CODE_NOT_CURRENT: sPathType === "PATH" ? Code.GENERAL_ENTITY_NOT_CURRENT_ERROR :Code.GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR
	}
	const iEntityId = helpers.getEntityIdFromPath(sPath);
	if ( !oPersistency.Helper.entityExists(iEntityId, sTable) ) {
		const sClientMsg = "Entity doesn't exists.";
		const sServerMsg = `${sClientMsg} Entity id: ${iEntityId}.`;
		$.trace.error(sServerMsg);
		throw new PlcException(oPathCheck.CODE_NOT_FOUND, sClientMsg);
	}
	const sFolderPath = oPersistency.Helper.getPath(iEntityId);
	if ( sPath !== sFolderPath ) {
		const sClientMsg = "Entity is not current.";
		const sServerMsg = `${sClientMsg} Path: ${sPath}.`;
		$.trace.error(sServerMsg);
		throw new PlcException(oPathCheck.CODE_NOT_CURRENT, sClientMsg);
	}
}


/**
 * Handles a HTTP POST requests. Can be used for creating, opening or closing of a project.
 */
this.handlePostRequest = function(oBodyData, mParameters, oServiceOutput, oPersistency) {

	var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
	var oProject = oBodyData;

	switch (mParameters.action) {
		case ProjectServiceParameters.action.values.close:
			handleCloseRequest();
			break;
		case ProjectServiceParameters.action.values.create:
			handleCreateRequest();
			break;
		case ProjectServiceParameters.action.values.open:
			handleOpenRequest();
			break;
		case ProjectServiceParameters.action.values.calculate_lifecycle_versions:
			triggerLifecycleVersionCalculation();
			break;
		default: {
			const sLogMessage = `Value ${mParameters.action} is not supported for parameter "action" for POST request`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
	}

	return oServiceOutput;

	/**
	 * Handles the create request for one project. Adds created project to the Service Output Object if
	 * creation was successful.
	 */
	function handleCreateRequest() {

	    SessionService.checkSessionIsOpened(oPersistency, sSessionId, sUserId);

		var sProjectId = oProject.PROJECT_ID;

		if (oProject.PATH && oProject.PATH !== "0") {
			checkEntityData(oProject.PATH, oPersistency, Tables.folder, "PATH");
		}
		
		if ( oPersistency.Project.exists(sProjectId) === true ) {
			var oExceptionDetails = new MessageDetails().addProjectObjs({
				id : sProjectId
			});

			const sClientMsg = "Project already exists.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR, sClientMsg, oExceptionDetails);
		}

		oPersistency.Project.create(oProject, sSessionId, sUserId);
		oPersistency.Project.open(oProject.PROJECT_ID, sSessionId, true);

		setOutputForProject(sProjectId, mSessionDetails.language, oServiceOutput, oPersistency);
		oServiceOutput.setStatus($.net.http.CREATED);

	}

	/**
	 * Handles the open request for one project. It tries at first to open the project as writable.
	 * If this is not possible (e.g. when another project is already open), then it is open as read-only and a message is set.
	 */
	function handleOpenRequest() {
		var sProjectId = oProject.PROJECT_ID;
		var iIsWriteable;

		const currentSession = {
			projectId: sProjectId,
			sessionUser: sSessionId
		}
		var oReturnObject = {
			sLockingUser: undefined
		};

	  // check for privilege
		if (oPersistency.Project.hasReadPrivilege(sProjectId) === true) {
			iIsWriteable = 0;
		} else {
			var aLockingUsers = oPersistency.Project.getOpeningUsers(sProjectId, sSessionId, true);
			if ((aLockingUsers.length > 0) ||
				(oSessions.has(sProjectId) && oSessions.get(sProjectId).sessionUser !== sSessionId)) {
				iIsWriteable = 0;
				oReturnObject.bIsWriteable = false;
				oReturnObject.sLockingUser = aLockingUsers.length > 0 && !helpers.isNullOrUndefined(aLockingUsers[0].USER_ID) ? aLockingUsers[0].USER_ID : oSessions.get(sProjectId).sessionUser;
			} else {
				oSessions.set(sProjectId, currentSession);
				iIsWriteable = 1;
				oReturnObject.bIsWriteable = true;
			}
		}
		// Open project as writable if is not opened as writable by another user, and vice versa
		oPersistency.Project.open(sProjectId, sSessionId, iIsWriteable);

		setOutputForProject(sProjectId, mSessionDetails.language, oServiceOutput, oPersistency);

		if(!helpers.isNullOrUndefined(oReturnObject.sLockingUser)){
			let oProjectLockedDetails = new MessageDetails().addProjectObjs({
				id : sProjectId,
				openingUsers : [ { id : oReturnObject.sLockingUser } ] //TODO: Convert Array to simple string
			});

			oServiceOutput.addMessage(new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.INFO, oProjectLockedDetails));
		} else {
			if (!oReturnObject.bIsWriteable) {
				let oProjectDetails = new MessageDetails().addProjectObjs({
					id : sProjectId
				});

				oServiceOutput.addMessage(new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.INFO, oProjectDetails));
			}
		}
	}

	/**
	 * Handles the close request for one project.
	 */
	function handleCloseRequest() {
		var sProjectId = oProject.PROJECT_ID;

		if ( oPersistency.Project.isOpenedInSession(sProjectId, sSessionId)  === false ) {
			const sClientMsg = "Project is not opened and cannot be processed.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
		}

		oPersistency.Project.close(sProjectId, sSessionId);
		if (oSessions.has(sProjectId) && oSessions.get(sProjectId).sessionUser === sSessionId) {
			oSessions.delete(sProjectId);
		}
	}

	function triggerLifecycleVersionCalculation(){
		var sProjectId = mParameters[ProjectServiceParameters.id.name];
		
		ProjectService.checkExists(sProjectId, oPersistency);
		ProjectService.checkIsWritable(sProjectId, sSessionId, oPersistency);
       
		handleLifecycleLock(sProjectId, oPersistency);
		checkReferencedLifecycleVersions(sProjectId, oPersistency);

		// lock the task-related tables in order to make sure that the calculation tasks for the same project cannot be inserted from 2 different transactions
		var taskService = new TaskService($, oPersistency);
		taskService.lock();

		// clear each task that should have calculated a lifecycle and it reached timeout
		var oProjectParameters = {
			TASK_TYPE: 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS',
			PARAMETERS: '{"PROJECT_ID":"' + sProjectId + '"}'
		};
		taskService.updateInactiveTasksOnTimeout(null, oProjectParameters);
		let aExistingCalculationTasks = taskService.getByType(TaskType.CALCULATE_LIFECYCLE_VERSIONS);
		let tasks = ProjectService.getCalculationTaskForProjectSplitedByUsers(aExistingCalculationTasks, sProjectId, $.getPlcUsername());
		
		if (!helpers.isNullOrUndefined(tasks) &&
			(!helpers.isNullOrUndefined(tasks.oRunningTasksForProjectStartedByCurrentUser) ||
		    !helpers.isNullOrUndefined(tasks.oRunningTasksForProjectStartedByOtherUser))){
			//if there is other task started by the current user, set it to canceled and start a new one
			if(!helpers.isNullOrUndefined(tasks.oRunningTasksForProjectStartedByCurrentUser)){ 
				{
					var oUpdateSet = _.pick(tasks.oRunningTasksForProjectStartedByCurrentUser, ["TASK_ID", "SESSION_ID", "TASK_TYPE"]);
					_.extend(oUpdateSet, {
						STATUS: TaskStatus.CANCELED,
						STARTED: new Date()
					});
					taskService.updateTask(tasks.oRunningTasksForProjectStartedByCurrentUser, oUpdateSet, oPersistency);
				}
			} 
			// if there is other task started by other user and it didnt reach timeout -> error
			else {
				const sClientMsg = "Cannot trigger lifecycle calculation since another user has already started or scheduled a calculation for this project.";
				const sServerMsg = `${sClientMsg} Another user id: ${tasks.oRunningTasksForProjectStartedByOtherUser.SESSION_ID}, project id: ${sProjectId}.`;
				$.trace.error(sServerMsg);
				throw new PlcException(Code.PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR, sClientMsg);
			}
		}
		// define and insert an inactive task; the task will be set to active by the calculation logic triggered by the follow-up; the response of the request is,
		// the task and so it's set as transactional data; the definition of the follow-up takes the task id as parameter and is also set on the ServiceOutput object;
		// the Dispatcher is taking care of invoking the follow-up
		let oParameters = {
			PROJECT_ID : sProjectId
		};
		let oTask = taskService.createInactiveTaskForCurrentUser({
			TASK_TYPE : TaskType.CALCULATE_LIFECYCLE_VERSIONS,
			PARAMETERS : JSON.stringify(oParameters),
			PROGRESS_TOTAL : 4,
			CREATED_ON: new Date()
		});
		oServiceOutput.setTransactionalData(oTask);
		
		let oFollowUp = {
			uri : FollowUp.CALCULATE_LIFECYCLE_VERSIONS.URI,
	    	functionName : FollowUp.CALCULATE_LIFECYCLE_VERSIONS.FUNCTION_NAME,
	    	parameter : {
				TASK_ID: oTask.TASK_ID,
				OVERWRITE_MANUAL_VERSION: mParameters.overwriteManualVersions,
				ONE_TIME_COST_ITEM_DESCRIPTION: helpers.isNullOrUndefined(oProject) === true ? null : helpers.isNullOrUndefined(oProject[0].oneTimeCostItemDescription) === true ? null : oProject[0].oneTimeCostItemDescription
			}
		};
		oServiceOutput.setFollowUp(oFollowUp);
	}
}
/**
 * Verifies if a Lifecycle Version is referenced in another lifecycle version
 */
function checkReferencedLifecycleVersions(sProjectId, oPersistency) {
	const aReferencedVersions = Array.from(oPersistency.Project.getReferencedVersions(sProjectId));
	if (aReferencedVersions && aReferencedVersions.length > 0) {
		let oMessageDetails = new MessageDetails();
		let aBaseVersionIds = [...new Set(aReferencedVersions.map(o => o.BASE_CALCULATION_VERSION_ID))];

		oMessageDetails.addProjectObjs({
			referencedVersions: aReferencedVersions
		});
	
		const sClientMsg = `Calculation of the lifecycle versions is not possible.`;
		const sServerMsg = `The lifecycle versions '${aBaseVersionIds.join()}' is referenced by another lifecycle versions.`;
		$.trace.info(sServerMsg);
		throw new PlcException(Code.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR, sClientMsg, oMessageDetails);
	}		
}

/**
 * Verifies if a Manual or a Lifecycle Version is opened by users in the given project
 * A list with all users that have opened a lifecycle version from the given project is sent 
 */
function handleLifecycleLock(sProjectId, oPersistency) {
	// Verifies if a version is opened by users before re-generating them
	const aLockedVersions = oPersistency.Project.getOpenedLifecycleVersions(sProjectId);
    // If at least one user has a version opened inside the given project an error messaje is sent
	if (aLockedVersions && aLockedVersions.length > 0) {
		let oMessageDetails = new MessageDetails();
		let aOpeningUsers = [];

		aLockedVersions.forEach(oLockedLifecycle => {
			let oOpeningUser = {
				id: oLockedLifecycle.SESSION_ID
			};
			aOpeningUsers.push(oLockedLifecycle.SESSION_ID);

			oMessageDetails.addProjectObjs({
					id: oLockedLifecycle.CALCULATION_VERSION_NAME,
					openingUsers: [oOpeningUser]
				});
		});

		const sClientMsg = `Calculation of the lifecycle versions is not possible.`;
		const sServerMsg = `${sClientMsg} Lifecycle version is opened by: ${aOpeningUsers.join()}`;
		$.trace.info(sServerMsg);
		throw new PlcException(Code.PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR, sClientMsg, oMessageDetails);
	};
}
/**
 * Handles a HTTP PUT request to update the project.
 * No re-calculation of results is necessary, since the project properties only provide the default values for underlying calculations and versions.
 * Thus if project properties change, they do not update the calculations and versions.
 */
this.update = function(oProject, aParameters, oServiceOutput, oPersistency) {

		function checkProjectDates(sStartProperty, sEndProperty){
			var sStart = oProject[sStartProperty];
			var sEnd = oProject[sEndProperty];
			// Check production dates only if they are defined in request
			if ( ! (helpers.isNullOrUndefined(sStart) === true && helpers.isNullOrUndefined(sEnd) === true )) {
				sStart = helpers.isNullOrUndefined(sStart) === false ? sStart : oCurrentProject[sStartProperty];
				sEnd = helpers.isNullOrUndefined(sEnd) === false ? sStart : oCurrentProject[sEndProperty];

				// Check if production dates are valid, i.e. start of production is earlier than end of production
				ProjectService.checkProjectTimes(sProjectId, sStart, sEnd);
			}
		}
		
		function checkStartEndOfProject() {
			// if the start or end of a project is changed, the defined total quantites for calculations outside of the changed project lifetime shall be
			// deleted; for this the earliest period is determined in accordance to the LifecycleInterval 
			// because START_OF_PROJECT and END_OF_PROJECT are nullable columns and non-mandatory properties; hence, undefined values must be
			// handled for data from request and database; 

			var iDbLowestPeriod       = !helpers.isNullOrUndefined(oCurrentProject.START_OF_PROJECT) ? ProjectService.calculateLifecyclePeriodFrom(oCurrentProject.START_OF_PROJECT, LifecycleInterval.YEARLY) : null;
			var iDbHighestPeriod      = !helpers.isNullOrUndefined(oCurrentProject.END_OF_PROJECT) ? ProjectService.calculateLifecyclePeriodFrom(oCurrentProject.END_OF_PROJECT, LifecycleInterval.YEARLY)     : null;

			// We also need to calculate the lifecycle_period_from by month too in order to trigger `deleteLifecyclePeriodsForProject`
			var iRequestLowestPeriodMonthlyTriggered  = !helpers.isNullOrUndefined(oProject.START_OF_PROJECT) ? ProjectService.calculateLifecyclePeriodFrom(oProject.START_OF_PROJECT, LifecycleInterval.MONTHLY)               : null;
			var iRequestHighestPeriodMonthlyTriggered = !helpers.isNullOrUndefined(oProject.END_OF_PROJECT) ? ProjectService.calculateLifecyclePeriodFrom(oProject.END_OF_PROJECT, LifecycleInterval.MONTHLY)                   : null;
			var iDbLowestPeriodMonthlyTriggered       = !helpers.isNullOrUndefined(oCurrentProject.START_OF_PROJECT) ? ProjectService.calculateLifecyclePeriodFrom(oCurrentProject.START_OF_PROJECT, LifecycleInterval.MONTHLY) : null;
			var iDbHighestPeriodMonthlyTriggered      = !helpers.isNullOrUndefined(oCurrentProject.END_OF_PROJECT) ? ProjectService.calculateLifecyclePeriodFrom(oCurrentProject.END_OF_PROJECT, LifecycleInterval.MONTHLY)     : null;
			
			var bRemoveLowerPeriods = (iRequestLowestPeriodMonthlyTriggered === null) || (iRequestLowestPeriodMonthlyTriggered !== null && iDbLowestPeriodMonthlyTriggered !== null && iRequestLowestPeriodMonthlyTriggered > iDbLowestPeriodMonthlyTriggered);
			var bRemoveHigherPeriods = (iRequestHighestPeriodMonthlyTriggered === null) || (iRequestHighestPeriodMonthlyTriggered !== null && iDbHighestPeriodMonthlyTriggered !== null && iRequestHighestPeriodMonthlyTriggered < iDbHighestPeriodMonthlyTriggered);
			if (bRemoveLowerPeriods || bRemoveHigherPeriods) {
				oPersistency.Project.deleteLifecyclePeriodsForProject(sProjectId, oProject.START_OF_PROJECT, oProject.END_OF_PROJECT);
			}

			// if the start and end of a project were null before, yearly lifecycle periods types should be created for them
			const bValidForUpdate = !helpers.isNullOrUndefined(oProject.START_OF_PROJECT) && !helpers.isNullOrUndefined(oProject.END_OF_PROJECT);
			const bValidForUpdateWhenLowerBoundWasNull = bValidForUpdate && iDbLowestPeriod === null && iDbHighestPeriod !== null;
			const bValidForUpdateWhenUpperBoundWasNull = bValidForUpdate && iDbHighestPeriod === null && iDbLowestPeriod !== null;
			const bValidWhenBothWereNull = bValidForUpdate && iDbLowestPeriod === null && iDbHighestPeriod === null;			
			if(bValidForUpdateWhenLowerBoundWasNull || bValidForUpdateWhenUpperBoundWasNull || bValidWhenBothWereNull) {
				oPersistency.Project.createYearlyLifecyclePeriodTypesForProject(sProjectId, oProject.START_OF_PROJECT.getFullYear(), oProject.END_OF_PROJECT.getFullYear());
			}

			var bAddLowerPeriod = bValidForUpdate && iRequestLowestPeriodMonthlyTriggered !== null && iDbLowestPeriodMonthlyTriggered !== null && iRequestLowestPeriodMonthlyTriggered < iDbLowestPeriodMonthlyTriggered;
			var bAddHigherPeriod = bValidForUpdate && iRequestHighestPeriodMonthlyTriggered !== null && iDbHighestPeriodMonthlyTriggered !== null && iRequestHighestPeriodMonthlyTriggered > iDbHighestPeriodMonthlyTriggered;
			if (bAddLowerPeriod || bAddHigherPeriod) {
				oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, iRequestLowestPeriodMonthlyTriggered, iRequestHighestPeriodMonthlyTriggered, iDbLowestPeriodMonthlyTriggered, iDbHighestPeriodMonthlyTriggered);
			}
		}

		var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
		var sProjectId = oProject.PROJECT_ID;
		if(oProject.TARGET_PATH && oProject.PATH){
			// Check that the entity id belongs to the project
			const iSourceEntityId = helpers.getEntityIdFromPath(oProject.PATH);
			oPersistency.Project.checkProjectIdSameAsSourceEntityId(sProjectId, iSourceEntityId);
			if(oProject.TARGET_PATH !== "0"){
				checkEntityData(oProject.TARGET_PATH, oPersistency, Tables.folder, "TARGET_PATH");
			}
			checkEntityData(oProject.PATH, oPersistency, Tables.project, "PATH");
		}

		var oCurrentProject = oPersistency.Project.getProjectProperties(sProjectId);
		// check if the project exists
		if (helpers.isNullOrUndefined(oCurrentProject)) {
			const sClientMsg = "Project does not exist and cannot be updated.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
		}

		checkProjectDates("START_OF_PRODUCTION", "END_OF_PRODUCTION");
		checkProjectDates("START_OF_PROJECT", "END_OF_PROJECT");

		// check if project is opened as writeable
		if ( oPersistency.Project.isOpenedInSession(sProjectId, sSessionId, true)  === false ) {
			const sClientMsg = "Project is not opened as writeable and cannot be updated.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.PROJECT_NOT_WRITABLE_ERROR, sClientMsg);
		}
		
		// check for a change START_OF_PROJECT or END_OF_PROJECT and delete lifecycle period values outside of the project lifetime;
		checkStartEndOfProject();
		
		// update
		oPersistency.Project.update(oProject, sSessionId);
		setOutputForProject(sProjectId, mSessionDetails.language, oServiceOutput, oPersistency);

}

/**
 * Handles a HTTP DELETE requests to delete one project and its associated calculation versions and items. Only
 * the projects can be deleted, which are closed and have all their calculation versions closed. If a project
 * or any of its versions are open, then error messages with ids of users that opened the calculation versions of the project are sent back. The
 * expected input is a JavaScript object with project id, e.g. { "PROJECT_ID":1}.
 * The returned object is:
 * 	a) if the project has been deleted, then an empty body is sent back
 * 	b) if the calculations/versions can not be deleted, then the array of messages with problematic calculations and versions is given back.
 */
this.remove = function(oProject, aParameters, oServiceOutput, oPersistency) {
		var sProjectId = oProject.PROJECT_ID;

		var aDbOpeningUsers = oPersistency.Project.getOpeningUsers(sProjectId, sSessionId);
		if (aDbOpeningUsers.length > 0) {
			// Some user have opened the project in write or read mode -> removing is not possible
			var aOpeningUserDetails = _.map(aDbOpeningUsers, function(oDbOpeningUser) {
				return {
					id : oDbOpeningUser.USER_ID
				};
			});

			var oProjectStillOpenDetails = new MessageDetails().addProjectObjs({
				id : sProjectId,
				openingUsers : aOpeningUserDetails
			});

			const sClientMsg = "Project cannot be deleted. Still opened by other users.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}, opening users: ${JSON.stringify(oProjectStillOpenDetails)}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.PROJECT_IS_STILL_OPENED_ERROR, sClientMsg, oProjectStillOpenDetails);
		}

		// project cannot be deleted if any of its version is frozen
		var aFrozenVersions = oPersistency.Project.getFrozenVersions(sProjectId);
		if(aFrozenVersions.length > 0){
            var oCalculationVersionsFrozenDetails = new MessageDetails();
            _.each(aFrozenVersions,function(oFrozenVersion,index){
                oCalculationVersionsFrozenDetails.addCalculationVersionObjs({
                        id : oFrozenVersion.CALCULATION_VERSION_ID
                });
            });		    

			const sClientMsg = "Project cannot be deleted, because it has frozen calculation versions.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.CALCULATIONVERSION_IS_FROZEN_ERROR, sClientMsg, oCalculationVersionsFrozenDetails);
		}

		// a project cannot be deleted if it has one or more calculations with calculation versions that are still opened by other
		// users;
		// the call to getOpeningUsersForVersions gets all versions and users who might have opened a version; if there
		// any, a message details object must be prepared, which allow the UI to identify the users who have opened a
		// specific version.
		// There could be multiple versions, each opened by multiple users at once.
		aDbOpeningUsers = oPersistency.CalculationVersion.getOpenVersionsForProject(sProjectId);
		if (aDbOpeningUsers.length > 0) {
			var oCvStillOpenDetails = new MessageDetails()
				.addProjectObjs({id : sProjectId});
			CalculationVersionService.addVersionStillOpenMessageDetails(oCvStillOpenDetails, aDbOpeningUsers);
			
			const sClientMsg = "Project cannot be deleted. Underlying calculation versions are opened by other users.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}, opening users: ${JSON.stringify(aDbOpeningUsers)}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.CALCULATIONVERSION_IS_STILL_OPENED_ERROR, sClientMsg, oCvStillOpenDetails);
		}

		//check if project has source versions referenced in other projects
		var aSourceVersions = oPersistency.Project.getSourceVersionsWithMasterVersionsFromDifferentProjects(sProjectId);
		if(aSourceVersions.length > 0) {
			aSourceVersions = _.map(aSourceVersions, function(oSourceVersion) {
				return { id: oSourceVersion.CALCULATION_VERSION_ID,
						 name:oSourceVersion.CALCULATION_VERSION_NAME
						};
			});
			var oSourceVersionDetails = new MessageDetails().addProjectReferenceObjs({
				id : sProjectId,
				sourceVersions: aSourceVersions
			});

			const sClientMsg = "Project cannot be deleted, because it contains source versions used in other projects.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR, sClientMsg, oSourceVersionDetails);
		}
		
		// check if lifecycle calculation is running for the project
		ProjectService.checkLifecycleCalculationRunningForProject(oPersistency, sProjectId);

		/////////////////////////////////////////////////////////
		// Remove project, its calculations and versions.
		/////////////////////////////////////////////////////////
		var affectedRows = oPersistency.Project.remove(sProjectId);
		if (affectedRows < 1) {
			const sClientMsg = "Project cannot be deleted. Delete affected 0 rows.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR, sClientMsg);
		}
		

}

/**
 * Handles a HTTP GET request to get all projects and selected master data for them.
 */
this.get = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
	var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
	var oProjects = oPersistency.Project.getAll(mSessionDetails.language, sUserId, mParameters);

	oServiceOutput.setTransactionalData(oProjects.aProjects);
	oServiceOutput.addMasterdata(oProjects.mMasterdata);

	return oServiceOutput;
}

/**
 * Handles a HTTP GET request to get all defined total quantities per lifecycle period for all calculations from a project.
 */
this.getQuantities = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
	
	var sProjectId = mParameters.id;
	
	var aProjectTotalQuantities = oPersistency.Project.getTotalQuantities(sProjectId);
	
	oServiceOutput.setTransactionalData(prepareServiceOutputForProjectLifecycleDetails(aProjectTotalQuantities, "CALCULATION_ID"));
}

/**
 * Handles a HTTP PUT request to set total quantities for calculation versions in the project for different lifecycle periods.
 * All the values of total quantities from a project are deleted and new ones are created based on the request, 
 * since PUT method should always replace the old values of project total quantities.
 */
this.updateQuantities = function(aBodyData, mParameters, oServiceOutput, oPersistency) {
	var sProjectId = mParameters.id;
	
	ProjectService.checkExists(sProjectId, oPersistency);
	ProjectService.checkIsWritable(sProjectId, sSessionId, oPersistency);
	
	// Check if calculations exists
	var aCalculationIds = _.map(aBodyData, 'CALCULATION_ID');
	if (!oPersistency.Helper.exists(aCalculationIds, ProjectTables.calculation, 'CALCULATION_ID')) {
		const sClientMsg = "One or more calculations do not exist in the given project.";
		const sServerMsg = `${sClientMsg} Calculation ids: ${aCalculationIds}.`;
		$.trace.error(sServerMsg);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
	}
	// Check if calculations belongs to the project
	var aExistingCalculationsWithVersions = oPersistency.Project.getCalculationsWithVersions(sProjectId);
	var aExistingCalculationsInProject = _.map(aExistingCalculationsWithVersions, "CALCULATION_ID");
	if (_.intersection(aExistingCalculationsInProject, aCalculationIds).length !==  aCalculationIds.length) {
		const sClientMsg = "Project does not contain the calculations.";
		const sServerMsg = `${sClientMsg} Project id: ${sProjectId}, missing calculation ids: ${aCalculationIds.join(", ")}.`;
		$.trace.error(sServerMsg);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
	}
	// Check if calculations versions exists
	var aQuantitiesWithVersionSet = _.filter(aBodyData, oQuantity => !helpers.isNullOrUndefined(oQuantity.CALCULATION_VERSION_ID));
	if (aQuantitiesWithVersionSet.length > 0) {
		// checking if the version does exists and if it does belong to the specified calculation; if this check is not done, it would be possible that total quantities
		// are defined for a versions outside of the project, to which the user might not have the access rights
		_.each(aQuantitiesWithVersionSet, oQuantityDefinition => {
			var oExistingCalcWithVersion =
				_.find(aExistingCalculationsWithVersions, oExistingCalcWithVersion => {
					return oQuantityDefinition.CALCULATION_ID === oExistingCalcWithVersion.CALCULATION_ID &&
						oQuantityDefinition.CALCULATION_VERSION_ID === oExistingCalcWithVersion.CALCULATION_VERSION_ID;
				});
			if(helpers.isNullOrUndefined(oExistingCalcWithVersion)){			
				const sClientMsg = "Version does not exist or does not belong to the specified calculation.";
				const sServerMsg = `${sClientMsg} Version: ${oQuantityDefinition.CALCULATION_VERSION_ID}, Calculation: ${oQuantityDefinition.CALCULATION_ID}.`;
				$.trace.error(sServerMsg);
				throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
			}
		});
		
		// checking if one or more versions are marked as frozen; frozen versions cannot serve as base versions for lifecycle versions, since no modifications to them are allowed;
		// hence, it makes no sense to generate lifecycle versions
		var aCvIds = _.map(aQuantitiesWithVersionSet, "CALCULATION_VERSION_ID");
		var aFrozenVersions = oPersistency.CalculationVersion.areFrozen(aCvIds);
		if (aFrozenVersions.length > 0) {
            let oCvMessageDetails = new MessageDetails();
            _.each(aFrozenVersions, iCvId => oCvMessageDetails.addCalculationVersionObjs({
                id: iCvId
            }));

			const sClientMsg = "One or more calculation versions are frozen and cannot serve as base versions.";
			const sServerMsg = `${sClientMsg} Frozen versions: ${aFrozenVersions.join(", ")}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.CALCULATIONVERSION_IS_FROZEN_ERROR, sClientMsg, oCvMessageDetails);
		}
	}
	
	
	// Checks total quantities are defined within the project lifetime
	ProjectService.checkLifetimeLimitsForProjectDetails(aBodyData, sProjectId, oPersistency);

	// Delete old total quantities of the project
	oPersistency.Project.deleteTotalQuantitiesForProject(sProjectId);
	
	// Create new total quantities
	oPersistency.Project.createTotalQuantities(aBodyData, sProjectId);

	// Get the newly created total quantities
	var aProjectTotalQuantities = oPersistency.Project.getTotalQuantities(sProjectId);
	oServiceOutput.setTransactionalData(prepareServiceOutputForProjectLifecycleDetails(aProjectTotalQuantities, "CALCULATION_ID"));
}

/**
 * Handles a HTTP GET request to get all defined activity price surcharges per lifecycle period for the project.
 */
this.getActivityPriceSurcharges = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
	let sProjectId = mParameters.id;
	
	ProjectService.checkExists(sProjectId, oPersistency);
	
	let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);	
	let aProjectSurcharges = oPersistency.Project.getActivityPriceSurcharges(sProjectId, mSessionDetails.language);

	oServiceOutput.setTransactionalData(prepareServiceOutputForProjectLifecycleDetails(aProjectSurcharges, "RULE_ID"));
}

/**
 * Handles a HTTP PUT request to set activity price surcharges the project for different lifecycle periods.
 */
this.updateActivityPriceSurcharges = function(aBodyData, mParameters, oServiceOutput, oPersistency) {
	let sProjectId = mParameters.id;
	
	ProjectService.checkExists(sProjectId, oPersistency);
	ProjectService.checkIsWritable(sProjectId, sSessionId, oPersistency);
	
	// Check that surcharge definitions are unique
	ProjectService.checkUniqueSurchargeDefinitionDependencyCombination(aBodyData, ["PLANT_ID", "ACCOUNT_GROUP_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID"]);
	
	// Check that surcharges are defined within the project lifetime
	ProjectService.checkLifetimeLimitsForProjectDetails(aBodyData, sProjectId, oPersistency);
		
	// Delete old surcharges of the project
	oPersistency.Project.deleteSurchargesForProject(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges);
	
	// Create new surcharge definitions and values
	oPersistency.Project.createSurcharges(sProjectId, aBodyData, BusinessObjectTypes.ProjectActivityPriceSurcharges);

	// Check if accounts of account groups are overlapping
	ProjectService.checkOverlappingAccountsInAccountGroups(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges, oServiceOutput, oPersistency);
	
	// Get the newly created surcharges
	let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);	
	let aProjectSurcharges = oPersistency.Project.getActivityPriceSurcharges(sProjectId, mSessionDetails.language);

	oServiceOutput.setTransactionalData(prepareServiceOutputForProjectLifecycleDetails(aProjectSurcharges, "RULE_ID"));
}

/**
 * Handles a HTTP GET request to get all defined material price surcharges per lifecycle period for the project.
 */
this.getMaterialPriceSurcharges = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
	let sProjectId = mParameters.id;
	
	ProjectService.checkExists(sProjectId, oPersistency);
	
	let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);	
	let aProjectSurcharges = oPersistency.Project.getMaterialPriceSurcharges(sProjectId, mSessionDetails.language);

	oServiceOutput.setTransactionalData(prepareServiceOutputForProjectLifecycleDetails(aProjectSurcharges, "RULE_ID"));
}

/**
 * Handles a HTTP PUT request to set material price surcharges the project for different lifecycle periods.
 */
this.updateMaterialPriceSurcharges = function(aBodyData, mParameters, oServiceOutput, oPersistency) {
	let sProjectId = mParameters.id;
	
	ProjectService.checkExists(sProjectId, oPersistency);
	ProjectService.checkIsWritable(sProjectId, sSessionId, oPersistency);
	
	// Check that surcharge definitions are unique
	ProjectService.checkUniqueSurchargeDefinitionDependencyCombination(aBodyData, ["ACCOUNT_GROUP_ID", "MATERIAL_GROUP_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "MATERIAL_ID"]);
	
	// Check that surcharges are defined within the project lifetime
	ProjectService.checkLifetimeLimitsForProjectDetails(aBodyData, sProjectId, oPersistency);
		
	// Delete old surcharges of the project
	oPersistency.Project.deleteSurchargesForProject(sProjectId, BusinessObjectTypes.ProjectMaterialPriceSurcharges);
	
	// Create new surcharge definitions and values
	oPersistency.Project.createSurcharges(sProjectId, aBodyData, BusinessObjectTypes.ProjectMaterialPriceSurcharges);

	// Check if accounts of account groups are overlapping
	ProjectService.checkOverlappingAccountsInAccountGroups(sProjectId, BusinessObjectTypes.ProjectMaterialPriceSurcharges, oServiceOutput, oPersistency);
	
	// Get the newly created surcharges
	let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);	
	let aProjectSurcharges = oPersistency.Project.getMaterialPriceSurcharges(sProjectId, mSessionDetails.language);
	
	oServiceOutput.setTransactionalData(prepareServiceOutputForProjectLifecycleDetails(aProjectSurcharges, "RULE_ID"));
}

/*****************************************************************************************************************************
 * Helpers
 *****************************************************************************************************************************/

// REVIEW (RF): you are using this function to set the output for almost all request except GET; neither the method name nor the documentation gives a hint for the reason for that;
// the method name itself indicate a general purpose method that should also be applicable for GET, which could confuse future developers;
//
// this function is omitting the CALCULATION_NO property (I think this number is needed by the Cockpit);
// 	- there is no comment why you need to do this
// 	- because you omit this property for all requests except GET you have different server responses, which I don't recommend from an API perspective


/**
 * Sets the service output for one project. The output includes:
 * 	- all project properties
 *  - project-relevant master data for given project
 */
function setOutputForProject(sProjectId, sLanguage, oServiceOutput, oPersistency) {
	var oProjectsAndMasterdata = oPersistency.Project.get(sLanguage, sUserId, sProjectId);

	var oOutputProject = _.omit(oProjectsAndMasterdata.aProjects[0], "CALCULATION_NO");

	oServiceOutput.setTransactionalData(oOutputProject);
	oServiceOutput.addMasterdata(oProjectsAndMasterdata.mMasterdata);
}

/**
 * Prepares total quantities of a project for output:
 *  - for each calculation in the project, a total quantities object is created, even when the calculation has no quantities defined yet 
 * 	- each calculation total quantities object has an array PERIOD_VALUES which contains all the quantity values for respective lifecycle periods 
 * 
 * The prepared data structure is returned by this function
 */
function prepareServiceOutputForProjectLifecycleDetails(aProjectTotalQuantities, sGroupingProperty) {
	var aTotalQuantitiesOutput = [];
	_.each(_.groupBy(aProjectTotalQuantities, sGroupingProperty), (aCalculationGroups, iCalculationId) => {
		let oCalculationOutput = _.omit(aCalculationGroups[0], ['RULE_ID', 'LIFECYCLE_PERIOD_FROM', 'VALUE', 'LIFECYCLE_PERIOD_FROM_DATE']);
		oCalculationOutput.PERIOD_VALUES = [];
		_.each(_.groupBy(aCalculationGroups, "RULE_ID"), aRuleGroups =>  {
			_.each(aRuleGroups, oRulesGroup => {
				if(!helpers.isNullOrUndefined(oRulesGroup.VALUE)) {
					oCalculationOutput.PERIOD_VALUES.push(_.pick(oRulesGroup, "LIFECYCLE_PERIOD_FROM", "VALUE", "LIFECYCLE_PERIOD_FROM_DATE"));
				}
			});
		});
		aTotalQuantitiesOutput.push(oCalculationOutput);
	});

	return aTotalQuantitiesOutput;
}
}; // end of module.exports.Projects