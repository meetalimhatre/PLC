const MessageLibrary = require("../util/message");
const Severity = MessageLibrary.Severity;
const Code = MessageLibrary.Code;

module.exports.Lock = function($) {

/**
 * This function is used to release/unlock all the objects for the current user
 *
 * @param aBodyMeta {array} - array of one or more objects which contain the metadata information
 * @param oParameters {object} - object of parameters
 * @param oServiceOutput - instance of ServiceOutput
 * @param oPersistency {object} - instance of persistency
 * 
 * @returns oServiceOutput {object} - the response
 */
this.remove = function(oBodyData, oParameters, oServiceOutput, oPersistency) {	
	
	var oMsg = {}, oMsgDetails = {};
	var sUserId = $.getPlcUsername();	
	
	oPersistency.Misc.releaseLock(sUserId);	
	
	oMsg.code      = Code.GENERAL_SYSTEMMESSAGE_INFO.code;
	oMsg.severity  = Severity.INFO;
	oMsg.details   = oMsgDetails;
	
	oServiceOutput.addMessage(oMsg);
}

}; // end of module.exports.Lock