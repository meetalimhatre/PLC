const _ = require('lodash');
const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const TaskStatus = require('../util/constants.js').TaskStatus;

var Tables = await Object.freeze({ task: 'sap.plc.db::basis.t_task' });

var Sequences = await Object.freeze({ task_id: 'sap.plc.db.sequence::s_task_id' });

/**
 * Provides persistency operations with tasks.
 */

async function Task(dbConnection) {

    /**
	 * Gets all running tasks for a user, a specific type, or a specified running task for the user.
	 *
	 * @param {string}
	 *            sUserId - the user id
	 * @param {string}
	 *            sTaskType - the task type
	 * @param {integer}
	 *            iTaskId - the task id
	 *
	 * @param {string}
	 *            sTaskStatus - the status of the task
	 *
	 * @returns {oReturnObject} -  Returns an array containing all the task objects found in the database for the user, or 
	 * 								a specific running task for a user, or a task type or s task with a specific status.
	 *
	 */
    this.get = async function (sUserId, sTaskType, iTaskId, sTaskStatus) {
        var aWhereContraints = [];
        var aQueryParameters = [];
        if (!helpers.isNullOrUndefined(sUserId)) {
            aWhereContraints.push('SESSION_ID = ?');
            aQueryParameters.push(sUserId);
        }

        if (!helpers.isNullOrUndefined(sTaskType)) {
            aWhereContraints.push('TASK_TYPE = ?');
            aQueryParameters.push(sTaskType);

        }
        if (!helpers.isNullOrUndefined(iTaskId)) {
            aWhereContraints.push('TASK_ID = ?');
            aQueryParameters.push(iTaskId);
        }
        if (!helpers.isNullOrUndefined(sTaskStatus)) {
            aWhereContraints.push('STATUS = ?');
            aQueryParameters.push(sTaskStatus);
        }

        var sStmt = `select TASK_ID, SESSION_ID, TASK_TYPE, STATUS, PARAMETERS, PROGRESS_STEP, PROGRESS_TOTAL, STARTED, LAST_UPDATED_ON, ERROR_CODE, ERROR_DETAILS 
					from "${ Tables.task }"`;
        if (aWhereContraints.length > 0) {
            sStmt += ` where ${ aWhereContraints.join(' and ') }`;
        }

        // unshift (=add as first element) sStmt in order to use apply() to pass all arguments as array to the JS function
        aQueryParameters.unshift(sStmt);

        return dbConnection.executeQuery.apply(dbConnection, aQueryParameters);
    };

    /**
	 * Creates a task.
	 *
	 * @param {oTask}
	 *            oTask - the object with the properties of the task
	 *
	 * @returns {iTaskId} -  Returns an array containing all the task objects found in the database for the user, or 
	 * 								a specific running task for a user.
	 *
	 */
    this.create = async function (oTask) {

        var oSafeTask = _.omit(oTask, 'TASK_ID');
        var aModifiableColumns = _.keys(oSafeTask);
        var aValues = _.values(oSafeTask);
        // it's in-lined here in order to cut of dependency to persistency-helper, since this would cause dependency issues for TaskService (RF)
        var sequenceTaskId = await helpers.toPositiveInteger(dbConnection.executeQuery(`select "${ Sequences.task_id }".nextval as task_id from dummy`)[0].TASK_ID);
        var maxTaskId = await helpers.toPositiveInteger(dbConnection.executeQuery(`select ifnull(max(TASK_ID)+1, 1) as task_id from "${ Tables.task }"`)[0].TASK_ID);
        var iTaskId = await _.max([
            sequenceTaskId,
            maxTaskId
        ]);
        aValues.unshift(iTaskId);

        var stmt = `INSERT INTO "${ Tables.task }" (TASK_ID, ${ aModifiableColumns.join(',') }) VALUES (?, ${ _.map(aModifiableColumns, c => '?').join(',') })`;
        dbConnection.executeUpdate(stmt, [aValues]);

        oTask.TASK_ID = iTaskId;
        return oTask;
    };

    /**
	 * Updates a task from the table belonging to a user.
	 *
	 * @param {oTask}
	 *            oTask - the object with the properties of the task
	 *
	 */
    this.update = oTask => {
        var oUpdateSet = _.omit(oTask, [
            'TASK_ID',
            'SESSION_ID'
        ]);
        var aColumnNames = _.keys(oUpdateSet);
        var aValues = [];
        var stmt = `update "${ Tables.task }" set `;

        _.each(aColumnNames, function (sColumnName, iIndex) {
            stmt = stmt + `${ sColumnName } = ? `;
            aValues.push(oTask[sColumnName]);
            if (iIndex < aColumnNames.length - 1) {
                stmt = stmt + `, `;
            }
        });

        stmt = stmt + ` where TASK_ID = ? and SESSION_ID = ?`;
        aValues.push(oTask.TASK_ID);
        aValues.push(oTask.SESSION_ID);
        try {
            dbConnection.executeUpdate(stmt, [aValues]);
        } catch (e) {
            const sClientMsg = 'Error during the update of task.';
            const sServerMsg = `${ sClientMsg } Error:  ${ e.msg || e.message }`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        return oTask;
    };

    this.updateInactiveTasksOnTimeout = (sUserId, oProjectParameters) => {

        try {
            var iTimeoutSeconds = dbConnection.executeQuery(`SELECT VALUE_IN_SECONDS FROM "sap.plc.db::basis.t_application_timeout"`)[0].VALUE_IN_SECONDS;
            if (!helpers.isNullOrUndefined(oProjectParameters)) {

                var sStmt = `UPDATE "` + Tables.task + `" SET STATUS='CANCELED', STARTED = CURRENT_UTCTIMESTAMP
						 WHERE CREATED_ON IS NOT NULL AND
						 TASK_TYPE =  ? AND
						 PARAMETERS = ? AND
						 (STATUS = 'ACTIVE' OR STATUS = 'INACTIVE') AND
						 seconds_between(CREATED_ON, CURRENT_UTCTIMESTAMP) > ?`;

                dbConnection.executeUpdate(sStmt, oProjectParameters.TASK_TYPE, oProjectParameters.PARAMETERS, iTimeoutSeconds);
            }
            if (!helpers.isNullOrUndefined(sUserId)) {
                var sStmt = `UPDATE "` + Tables.task + `" SET STATUS='CANCELED', STARTED = CURRENT_UTCTIMESTAMP
						 WHERE CREATED_ON IS NOT NULL AND
						 TASK_TYPE = 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS' AND
						 SESSION_ID = ? AND
						 STATUS = 'INACTIVE' AND
						 seconds_between(CREATED_ON, CURRENT_UTCTIMESTAMP) > ?`;

                dbConnection.executeUpdate(sStmt, sUserId, iTimeoutSeconds);
            }


        } catch (e) {
            const sClientMsg = 'Error during the update of task.';
            const sServerMsg = `${ sClientMsg } Error:  ${ e.msg || e.message }`;
            await logError(sServerMsg);
        }
    };

    this.lockTaskTable = () => {
        dbConnection.executeUpdate(`lock table "${ Tables.task }" in exclusive mode`);
    };

    /**
	 * Checks to see if there are any running tasks for the current session.
	 * 
	 * @param {type} taskType 
	 * @returns {oReturnObject} Returns a booleand value indicating if there are any active tasks for the current session 
	 * and the session of the task in progress
	 */
    this.isTaskInProgress = taskType => {
        var countTasksInProgress = dbConnection.executeQuery(`SELECT SESSION_ID as sessionID, count(*) as taskcount
									FROM "${ Tables.task }"
									WHERE STATUS = 'ACTIVE'
									AND TASK_TYPE = ? GROUP BY SESSION_ID`, taskType);

        var bIsThereAnyActiveTask = countTasksInProgress.length !== 0 ? parseInt(countTasksInProgress[0].TASKCOUNT, 10) > 0 : false;
        var oActiveTaskSessionId = bIsThereAnyActiveTask === true ? countTasksInProgress[0].SESSIONID : null;

        return {
            bIsThereAnyActiveTask,
            oActiveTaskSessionId
        };
    };

    /**
	 * Will set the tasks that are found with the provided status and task type to a status of cancelled.
	 *
	 * @param {string} sStatus 	 Is the status of the task(s) to be cancelled 
	 * @param {string} sTaskType Is the type of the task(s) to be cancelled 
	 * @param  {type} iMinutes 	 The number of minutes that will be subtracted from the current datetime and all tasks last updated before this date, will be affected.
	 *
	 */
    this.cancelTasksWithStatusAndLastUpdatedOlderThan = (sStatus, sTaskType, iMinutes) => {
        let sLastUpdatedBefore = new Date(Date.now() - 1000 * (60 * iMinutes));
        let aInactiveTasks = dbConnection.executeQuery(`SELECT TASK_ID, SESSION_ID, TASK_TYPE, STATUS, PARAMETERS, PROGRESS_STEP, PROGRESS_TOTAL, STARTED, LAST_UPDATED_ON, ERROR_CODE, ERROR_DETAILS 
										from "${ Tables.task }"
									WHERE STATUS = ?
									AND TASK_TYPE = ? AND LAST_UPDATED_ON <= ?`, sStatus, sTaskType, sLastUpdatedBefore);

        _.each(aInactiveTasks, async function (oInactiveTask) {
            oInactiveTask.STATUS = TaskStatus.CANCELED;
            oInactiveTask.PROGRESS_STEP = 4;
            await this.update(oInactiveTask);
        }.bind(this));
    };
}

Task.prototype = await Object.create(Task.prototype);
Task.prototype.constructor = Task;

async function logError(msg) {
    await helpers.logError(msg);
}

module.exports.Task = Task;
export default {_,helpers,MessageLibrary,PlcException,Code,TaskStatus,Tables,Sequences,Task,logError};
