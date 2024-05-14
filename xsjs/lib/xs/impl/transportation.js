const Helpers = require("../util/helpers");
const TaskService = require("../service/taskService").TaskService;
const TaskStatus = require("../util/constants").TaskStatus;
const _ = require("lodash");

const MessageLibrary = require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

const Constants = require("../util/constants");
const TaskType = Constants.TaskType;
const FollowUp = Constants.FollowUp;

module.exports.Transportation = function($) {
const oConnectionFactory  = new (require("../db/connection/connection").ConnectionFactory)($);

var sUserId = $.getPlcUsername();

	/**
	 * Imports data into PLC tables via staging tables and checks integrity
	 *
	 * @param iTaskID {Integer} - Primary identifier of the Task
	 * @param oBodyData {object} - Data to be transported
	 * @param oParameters {object} - Object of parameters
	 * @param oPersistency {object} - Instance of persistency
	 */
	this.importData = function (iTaskId, oBodyData, oParameters, oPersistency) {

		let oTaskService = new TaskService($, oPersistency);
		let oTaskToUpdate = oTaskService.getById(iTaskId);

		updateTask(oTaskService, oTaskToUpdate, 2, TaskStatus.ACTIVE, null, null, oConnectionFactory);

		try {
			let oOutput = oPersistency.Transportation.importData(oBodyData, oParameters);

			if (Object.values(oOutput).every(value => value[0] === 'imported successfully')) {
				oPersistency.Metadata.generateAllFiles();
				oPersistency.getConnection().commit();
				updateTask(oTaskService, oTaskToUpdate, 4, TaskStatus.COMPLETED, null, null, oConnectionFactory);
			}

			else {
				const sErrorMessageFromOutput = "Import data failed with unexpected output result";
				updateTask(oTaskService, oTaskToUpdate, 4, TaskStatus.FAILED, Code.GENERAL_UNEXPECTED_EXCEPTION.code, sErrorMessageFromOutput, oConnectionFactory);
			}
		}
		catch (e) {
			$.trace.error(e);
		if (e instanceof PlcException) {
			    updateTask(oTaskService, oTaskToUpdate, 4, TaskStatus.FAILED, e.code.code, e.developerMessage, oConnectionFactory);
			}
		}
		return;
	}

/**
 * Exports data of PLC tables as JSON (array of arrays, similar to CSV)
 *
 * @param aBodyMeta {array} - empty
 * @param oParameters {object} - tableNames parameter must contain list of tables to be exported
 * @param oServiceOutput - instance of ServiceOutput
 * @param oPersistency {object} - instance of persistency
 *
 * @returns oServiceOutput {object} - arrays of exported table data
 */
this.exportData = function(oBodyData, aParameters, oServiceOutput, oPersistency){
    var oExportData=oPersistency.Transportation.exportData(aParameters);
    $.trace.error(`[INFO] Transportation tool: User [${sUserId}] started export of data on [${new Date().toString()}]`);
    auditLog.read({ type: 'Transportation tool', id: { key: `TimeStamp: [${new Date().toString()}]` } })
			.attribute({ name: 'TimeStamp', successful: true })
			.dataSubject({ type: 'SAP', id: { key: 'PLC' }, role: 'TransExp' })
			.accessChannel('UI')
			.by(`[${sUserId}]`)
			.log(function (err) {
				if (err) {
					$.trace.error(`Transportation tool export. Error when logging using AuditLog`);
				}
			});
    oServiceOutput.setStatus($.net.http.OK).setBody(oExportData);
}

this.createTaskAndProvideFollowUp = function (aBodyMeta, oParameters, oServiceOutput, oPersistency) {
	let oTaskService = new TaskService($, oPersistency);
	let aExistingTransportationTask = oTaskService.getByTypeAndStatus(TaskType.TRANSPORTATION_IMPORT, TaskStatus.INACTIVE);
	oTaskService.lock();

	if (aExistingTransportationTask.length > 0) {
		_.each(aExistingTransportationTask, (oExistingCFFTask) => {
			updateTask(oTaskService, oExistingCFFTask, 4, TaskStatus.CANCELED, null, null, null);
		});
	}

	let oTask = oTaskService.createInactiveTaskForCurrentUser({
		TASK_TYPE : TaskType.TRANSPORTATION_IMPORT,
		PROGRESS_TOTAL: 4,
		CREATED_ON: new Date(),
		PARAMETERS: JSON.stringify(oParameters)
	});
	oServiceOutput.setTransactionalData(oTask);
	
	let oFollowUp = {
		uri : FollowUp.TRANSPORTATION_IMPORT.URI,
		functionName : FollowUp.TRANSPORTATION_IMPORT.FUNCTION_NAME,
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
 * @param oConnectionFactory {Object} - Persistency object that the Task should be updated using.
 */
function updateTask(oTaskService, oTaskToUpdate, iProgressStep, sTaskStatus, sErrorCode, sErrorDetails, oConnectionFactory) {
	oTaskService.updateTask(oTaskToUpdate, {
		...(!Helpers.isNullOrUndefined(sErrorCode) && {ERROR_CODE: sErrorCode}),
		...(!Helpers.isNullOrUndefined(sErrorDetails) && {ERROR_DETAILS: sErrorDetails}),
		...(!Helpers.isNullOrUndefined(iProgressStep) && {PROGRESS_STEP: iProgressStep}),
		...(!Helpers.isNullOrUndefined(sTaskStatus) && {STATUS: sTaskStatus}),
	}, oConnectionFactory);
}

}; // end of module.exports.Transportation
