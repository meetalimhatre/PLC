const _ = require("lodash");
const BusinessObjectTypes = require("../util/constants").BusinessObjectTypes;
const Provider = require("../metadata/metadataProvider").MetadataProvider;
const ServiceMetaInformation  = require("../util/constants").ServiceMetaInformation;

const MessageLibrary = require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const Helpers = require("../util/helpers");

const Constants = require("../util/constants");
const TaskStatus = require("../util/constants").TaskStatus;
const TaskService = require("../service/taskService").TaskService;
const TaskType = Constants.TaskType;
const FollowUp = Constants.FollowUp;

module.exports.Metadata = function($) {

let oConnectionFactory = new (require("../db/connection/connection")).ConnectionFactory($);
let lPersistency = await $.import("xs.db", "persistency").Persistency;
let localPersistency = new lPersistency(oConnectionFactory.getConnection());

var metadataProvider = new Provider();
var sUserId = $.getPlcUsername();

/**
 * Gets the metadata for all the categories - through the metadataProvider
 *
 * @param aBodyMeta {array} - array of one or more objects which contain the metadata information
 * @param oParameters {object} - object of parameters
 * @param oServiceOutput - instance of ServiceOutput
 * @param oPersistency {object} - instance of persistency
 * 
 * @returns oServiceOutput {object} - the response
 */
this.get = async function(aBodyMeta, oParameters, oServiceOutput, oPersistency) {	
	var oBody = {};
	var oLockActiveUsersStatus = {};
	var sPath = oParameters.path;
	var sBusinessObject = oParameters.business_object;
	var sColumnId = oParameters.column;
	var isCustom = oParameters.is_custom;
	
    
	oBody.METADATA = metadataProvider.get(sPath, sBusinessObject, sColumnId, isCustom, oPersistency, sUserId, sUserId);

	if(oParameters.lock === true || oParameters.lock === 'true'){
	    // get active users 
		var aActiveUsers = oPersistency.Misc.getActiveUsers();
		var aActiveJobs = oPersistency.Misc.getActiveJobs();
	    if(aActiveUsers.length === 0 && aActiveJobs.length === 0){
        // set lock
			oPersistency.Misc.setLock(BusinessObjectTypes.Metadata, sUserId);
			$.trace.error(`[INFO] Custom fields and formulas are maintained by user: [${sUserId}] on [${new Date().toString()}]`);
			const message = auditLog.update({ type: 'Custom fields and formula Locking', id: { key: `TimeStamp: [${new Date().toString()}]` } })
							.attribute({ name: 'TimeStamp', old: 'oldValue', new: `[${new Date().toString()}]`})
							.dataSubject({ type: 'SAP', id: { key: 'PLC' }, role: 'CFFCreateUpdt' })
							.by(`[${sUserId}]`);
			message.logPrepare(function (err) {
				message.logSuccess(function (err) { 
					if (err) { 
						$.trace.error(`Custom fields and formula Locking. Error when logging success using AuditLog`);
					}
				});

				message.logFailure(function(err) { 
					if (err) { 
						$.trace.error(`Custom fields and formula Locking. Error when logging failure using AuditLog`);
					}
				});
			});
	        oLockActiveUsersStatus.IS_LOCKED = 0;
	    }
	    else{
			// add locking users to Body
				oLockActiveUsersStatus.IS_LOCKED = 1;
			}
			oLockActiveUsersStatus.ACTIVE_JOBS = aActiveJobs;
			oLockActiveUsersStatus.ACTIVE_USERS = aActiveUsers;
	}	
	
	oBody[ServiceMetaInformation.LockActiveStatus] = oLockActiveUsersStatus;

	oServiceOutput.setBody(oBody);
}

/**
 * Creates, updates, deletes metadata objects through the metadataProvider.
 *
 * @param iTaskID {Integer} - Primary identifier of the Task
 * @param aBodyMeta {array} - array of one or more objects which contain the metadata information
 * @param oParameters {object} - object of parameters
 * @param oPersistency {object} - instance of persistency
 * 
 * @returns oServiceOutput {object} - the response
 */
this.batchCreateUpdateDelete = function(iTaskID, aBodyMeta, oParameters, oPersistency, oConnection) {
		var oPersistencyToUse = Helpers.isNullOrUndefined(oPersistency) ? localPersistency : oPersistency;
		var oConnectionToUse = Helpers.isNullOrUndefined(oConnection) ? oConnectionFactory : oConnection;
		
		var oTaskService = new TaskService($, oPersistencyToUse);
		let oTaskToUpdate = oTaskService.getById(iTaskID);

		updateTask(oTaskService, oTaskToUpdate, 2, TaskStatus.ACTIVE, null, null, oConnectionToUse);

		try{
			var oResult = metadataProvider.batchCreateUpdateDelete(aBodyMeta, oPersistencyToUse, oParameters.checkCanExecute);
			
			if(oResult.isBatchSuccess === true) {

				// Update t_field_mapping for Replication Tool when custom fields for masterdata are created/delted
				// Exclude _UNIT fields or those with Path = 'Item'
				let aCreatedCFs = _.filter(oResult.batchResults.CREATE, oCustomField => (oCustomField.BUSINESS_OBJECT !== 'Item' && oCustomField.UOM_CURRENCY_FLAG === 0));
				oPersistencyToUse.Metadata.createCustomFieldEntriesForReplicationTool(aCreatedCFs);
				let aDeletedCFs = aBodyMeta.DELETE;
				oPersistencyToUse.Metadata.deleteCustomFieldEntriesFromReplicationTool(aDeletedCFs);

				oPersistencyToUse.Metadata.generateAllFiles();
				oPersistencyToUse.getConnection().commit();

				updateTask(oTaskService, oTaskToUpdate, 4, TaskStatus.COMPLETED, null, null, oConnectionToUse);
			} else {
				oPersistencyToUse.getConnection().rollback();
				var aBatchResultsError = [];

				_.each(oResult.batchResults, function(oMsg){ 
					$.trace.error(oMsg);
					aBatchResultsError.push(oMsg);
				});
				updateTask(oTaskService, oTaskToUpdate, 4, TaskStatus.FAILED, Code.BATCH_OPPERATION_ERROR.code, JSON.stringify(aBatchResultsError), oConnectionToUse);
			} 
		}
		catch(ex){
			updateTask(oTaskService, oTaskToUpdate, 4, TaskStatus.FAILED, Code.BATCH_OPPERATION_ERROR.code, null, oConnectionToUse);
			$.trace.error(ex);
		} finally {
			var conn = oPersistencyToUse.getConnection();
			
			if (conn && _.isFunction(conn.close)) {
				conn.close();
			}
		}
}

/**
 * Sets the lock on the Persistency and creates the task and follow up for the Custom Field creation.
 *
 * @param aBodyMeta {array} - array of one or more objects which contain the metadata information
 * @param oParameters {object} - object of parameters
 * @param oServiceOutput - instance of ServiceOutput
 * @param oPersistency {object} - instance of persistency
 * 
 * @returns oServiceOutput {object} - the response
 */
this.setLockOnMetadataObj = function(aBodyMeta, oParameters, oServiceOutput, oPersistency){
	var oBody = {};
	var oLockActiveUsersStatus = {};
	
	var aActiveUsers = oPersistency.Misc.getActiveUsers();
    if(aActiveUsers.length === 0 ){
    	// set lock.  create/delete/update is possible only if the metadata is not locked by another user
		oPersistency.Misc.setLock(BusinessObjectTypes.Metadata, sUserId);
		$.trace.error(`[INFO] Custom fields and formulas are maintained by user: [${sUserId}] on [${new Date().toString()}]`);
		const message = auditLog.update({ type: 'Custom fields and formula Locking', id: { key: `TimeStamp: [${new Date().toString()}]` } })
							.attribute({ name: 'TimeStamp', old: 'oldValue', new: `[${new Date().toString()}]`})
							.dataSubject({ type: 'SAP', id: { key: 'PLC' }, role: 'CFFCreateUpdt' })
							.by(`[${sUserId}]`);
			message.logPrepare(function (err) {
				message.logSuccess(function (err) { 
					if (err) { 
						$.trace.error(`Custom fields and formula Locking. Error when logging success using AuditLog`);
					}
				});

			message.logFailure(function(err) { 
				if (err) { 
					$.trace.error(`Custom fields and formula Locking. Error when logging failure using AuditLog`);
				}
			});
		});
		createTaskAndProvideFollowUp(aBodyMeta, oParameters, oServiceOutput, oPersistency);
    }
    else {
        // add locking users to Body
        oLockActiveUsersStatus.IS_LOCKED = 1;
        oBody = {"CREATE": [], "UPDATE": [], "DELETE" : [] };
		oServiceOutput.setStatus($.net.http.BAD_REQUEST);
		
		oLockActiveUsersStatus.ACTIVE_USERS = aActiveUsers;
		oBody[ServiceMetaInformation.LockActiveStatus] = oLockActiveUsersStatus;
		oServiceOutput.setBody(oBody);
    }
}

/**
 * Creates the task for the CFF implementation and also provides the followUp to the Service output so that the CFF process gets kicked off.
 *
 * @param aBodyMeta {array} - array of one or more objects which contain the metadata information
 * @param oParameters {object} - object of parameters
 * @param oServiceOutput - instance of ServiceOutput
 * @param oPersistency {object} - instance of persistency
 * 
 * @returns oServiceOutput {object} - the response
 */
function createTaskAndProvideFollowUp(aBodyMeta, oParameters, oServiceOutput, oPersistency) {

	var oTaskService = new TaskService($, oPersistency);
	
	let aExistingCFFTask = oTaskService.getByTypeAndStatus(TaskType.METADATA_CUSTOM_FIELDS, TaskStatus.INACTIVE);

	oTaskService.lock();

	if(aExistingCFFTask.length > 0){
		_.each(aExistingCFFTask, function(oExistingCFFTask){ 
			updateTask(oTaskService, oExistingCFFTask, 4, TaskStatus.CANCELED, null, null, null);
		});
	}
	
	let oTask = oTaskService.createInactiveTaskForCurrentUser({
		TASK_TYPE : TaskType.METADATA_CUSTOM_FIELDS,
		PROGRESS_TOTAL: 4,
		CREATED_ON: new Date()
	});
	oServiceOutput.setTransactionalData(oTask);

	let oFollowUp = {
		uri : FollowUp.METADATA.URI,
		functionName : FollowUp.METADATA.FUNCTION_NAME,
		parameter: {
			TASK_ID: oTask.TASK_ID,
			A_BODY_META: aBodyMeta,
			PARAMETERS: oParameters,
			SERVICE_OUTPUT: oServiceOutput,
		}
	};
	oServiceOutput.setFollowUp(oFollowUp);
}

/**
 * Creates, updates, deletes metadata objects through the metadataProvider.
 *
 * @param oTaskService {Object} - Service used to update the task object.
 * @param oTaskToUpdate {Object} - Object containing he task to be updated.
 * @param iProgressStep {Interger} - Progress Step the current task should be updated to.
 * @param sTaskStatus {String} - Status the current task should be updated to.
 * @param sErrorCode {String} - Error Code the current task should be updated with.
 * @param aErrorDetails {Array} - All error details that have orruced while process the task.
 * @param oConnectionToUse {Object} - Persistency object that the Task should be updated using.
 */
function updateTask(oTaskService, oTaskToUpdate, iProgressStep, sTaskStatus, sErrorCode, aErrorDetails, oConnectionToUse){
	oTaskService.updateTask(oTaskToUpdate, {
		...(!Helpers.isNullOrUndefined(sErrorCode) && {ERROR_CODE: sErrorCode}),
		...(!Helpers.isNullOrUndefined(aErrorDetails) && {ERROR_DETAILS: aErrorDetails}),
		...(!Helpers.isNullOrUndefined(iProgressStep) && {PROGRESS_STEP: iProgressStep}),
		...(!Helpers.isNullOrUndefined(sTaskStatus) && {STATUS: sTaskStatus}),
	}, oConnectionToUse);
}

}; // end of module.exports.Metadata