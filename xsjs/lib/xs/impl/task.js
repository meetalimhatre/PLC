const helpers        = require("../util/helpers");
const TaskService    = require("../service/taskService").TaskService;
const MessageLibrary = require("../util/message");
const PlcException   = MessageLibrary.PlcException;
const Code           = MessageLibrary.Code;
const constants = require("../util/constants");

module.exports.Task = function($) {

const sUserId = $.getPlcUsername();
const sSessionId = $.getPlcUsername();

/**
 * Handles a HTTP GET requests to get long running tasks.
 *
 */
this.get = function(aBodyItems, mParameters, oServiceOutput, oPersistency) {
	var taskService = new TaskService($, oPersistency);
	updateActivityTimeNoSessionRequired(sSessionId,sUserId,oPersistency);
	// first we eliminate every task that of the user reached timeout
	taskService.updateInactiveTasksOnTimeout(sUserId, null);

	var aTasks;
	if(!helpers.isNullOrUndefined(mParameters.id)) {
		let oTask = taskService.getById(mParameters.id);
		if(helpers.isNullOrUndefined(oTask)) {
			const sLogMessage = `No tasks exsits for the id ${mParameters.Id}, or the task does not belong to the requesting user.`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);	
		}
		aTasks = [oTask];
	} else {
		aTasks = taskService.getByUser(sUserId);
	}
	
	oServiceOutput.setTransactionalData(aTasks);
	return oServiceOutput;
}

function updateActivityTimeNoSessionRequired(sSessionId,sUserId,oPersistency) 
{
	let bCheckSessionIsOpened = oPersistency.Session.isSessionOpened(sSessionId, sUserId);
	if (bCheckSessionIsOpened) {
		const details = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
		if (details.lifetime > constants.ActivityTimeUpdateFrequency) {
			oPersistency.Session.updateLastActivity(sSessionId, sUserId);
		}
	}
}

}; // end of module.exports.Task