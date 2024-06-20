const _ = require('lodash');
const Task = require('../db/persistency-task').Task;
const TaskStatus = require('../util/constants').TaskStatus;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const helpers = require('../util/helpers');


/**
 * TaskService - description
 *  
 * @constructor
 * @return {type}  description 
 */
function TaskService($, oPersistency) {
    var sCurrentUserId = $.getPlcUsername();
    var oDefaultPersistency = oPersistency.Task;


    /**
	 * Get all tasks of a specific user.
	 */
    this.getByUser = async (sUserId, oDbConnection) => {
        let oPersistencyToUse = oDbConnection !== undefined ? await createPersistency(oDbConnection) : oDefaultPersistency;
        return _.values(oPersistencyToUse.get(sUserId, null, null, null));
    };

    /**
	 * Get all tasks for a certain type (ex. project).
	 */
    this.getByType =async (sType, oDbConnection) => {
        let oPersistencyToUse = oDbConnection !== undefined ? await createPersistency(oDbConnection) : oDefaultPersistency;
        return _.values(oPersistencyToUse.get(null, sType, null, null));
    };

    /**
	 * Get all tasks for a certain type (ex. project) with a certain status (ex. Active).
	 */
    this.getByTypeAndStatus = async (sType, sTaskStatus, oDbConnection) => {
        let oPersistencyToUse = oDbConnection !== undefined ? await createPersistency(oDbConnection) : oDefaultPersistency;
        return _.values(oPersistencyToUse.get(null, sType, null, sTaskStatus));
    };

    /**
	 * Get a certain task by id for the current user.
	 */
    this.getById = async (iTypeId, oDbConnection) => {
        let oPersistencyToUse = oDbConnection !== undefined ? await createPersistency(oDbConnection) : oDefaultPersistency;
        return oPersistencyToUse.get(null, null, iTypeId, null)[0];
    };

    /**
	 * If there are running tasks and server timeouts, the db will remain in an unconsitent state.
	 * This function removes any task that is active or inactive and the CURRENT_TIMESTAMP - START DATE > TIMEOUT_TIME
	 */

    this.updateInactiveTasksOnTimeout = async (sUserId, oProjectParameters, oDbConnection) => {
        let oPersistencyToUse = oDbConnection !== undefined ? await createPersistency(oDbConnection) : oDefaultPersistency;
        oPersistencyToUse.updateInactiveTasksOnTimeout(sUserId, oProjectParameters);
    };


    /** 
	 * Create a new long running tasks for the current user. The function requires a dbConnection to operate on. This is done in order 
	 * to give clients a way the modify tasks outside of the normal transaction context (e.g. used by persistency). By this, modifications 
	 * to the task shall be committed independently and so visible for other HTTP requests.
	 *   
	 * @param  {type} oTask         The task to create for the current user
	 * @param  {type} oDbConnection The connection the SQL statement is executed on
	 * @return {type}               The created task  
	 */
    this.createInactiveTaskForCurrentUser = (oTask, oDbConnection) => {
        let oPersistencyToUse = oDbConnection !== undefined ?  createPersistency(oDbConnection) : oDefaultPersistency;

        oTask.SESSION_ID = $.getPlcUsername();
        oTask.STATUS = TaskStatus.INACTIVE;
        oTask.PROGRESS_STEP = 0;
        return  oPersistencyToUse.create(oTask);
    };

    /** 
	 * Updates an existing task of the current user.  The function requires a dbConnection to operate on. This is done in order 
	 * to give clients a way the modify tasks outside of the normal transaction context (e.g. used by persistency).
	 * @param  {type} oTask         The task to update
	 * @param  {type} mPropertiesToUpdate The list of properties which should be updated
	 * @param  {type} oConnectionFactory the factory with db connection
	*/
    this.updateTask = (oTask, mPropertiesToUpdate, oConnectionFactory) => {
        var oUpdateSet = _.pick(oTask, [
            'TASK_ID',
            'SESSION_ID',
            'TASK_TYPE'
        ]);
        _.extend(oUpdateSet, mPropertiesToUpdate);

        var oConnectionToUpdateTask =  helpers.isNullOrUndefined(oConnectionFactory) ?  oPersistency.getConnection() :  oConnectionFactory.getConnection();
         update(oUpdateSet, oConnectionToUpdateTask);
         oConnectionToUpdateTask.commit();
    };

    /**
	 * Locks all task-related tables for the passed transaction. Clients have to specify the dbConnection, which acquires the lock. This 
	 * is needed to let clients prevent dead-locks if the lock can only be acquired by the default connection, but Tasks shall be modified
	 * by other connections (see {@link update} and {@link createForCurrentUser}).
	 * 
	 * @param  {type} oDbConnection   The connection acquiring the lock
	 */
    this.lock = oDbConnection => {
        let oPersistencyToUse = oDbConnection == null ? oDefaultPersistency :  createPersistency(oDbConnection);

        oPersistencyToUse.lockTaskTable();
    };

    /**
	 * Updates an existing task of the current user.  The function requires a dbConnection to operate on. This is done in order 
	 * to give clients a way the modify tasks outside of the normal transaction context (e.g. used by persistency). By this, modifications 
	 * to the task shall be committed independently and so visible for other HTTP requests.
	 *   
	 * @param  {type} oTask         The task to update
	 * @param  {type} oDbConnection The connection the SQL statement is executed on
	 * @return {type}               The created task  
	 */
    async function update(oTask, oDbConnection) {
        let oPersistencyToUse = oDbConnection == null ? oDefaultPersistency : await createPersistency(oDbConnection);

        //check if the tasks belonging to user exists
        var aTaskExists = oPersistencyToUse.get(sCurrentUserId, oTask.TASK_TYPE, oTask.TASK_ID);
        if (aTaskExists.length === 0) {
            const sClientMsg = 'Could not find task with such id belonging to the user.';
            const sServerMsg = `${ sClientMsg } Task id: ${ oTask.TASK_ID }, user id: ${ sCurrentUserId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }
        oTask.LAST_UPDATED_ON = new Date();
        await oPersistencyToUse.update(oTask);
    }
    ;

    async function createPersistency(oDbConnection) {
        return await new Task(oDbConnection);
    }

}
TaskService.prototype =  Object.create(TaskService.prototype);
TaskService.prototype.constructor = TaskService;

module.exports.TaskService = TaskService;
export default {_,Task,TaskStatus,MessageLibrary,PlcException,Code,helpers,TaskService};
