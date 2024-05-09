var _ = require("lodash");
var maxQueryResults = require("../util/constants").maxQueryResults; 

module.exports.PlcUsers = function($) {

/**
 * Handles a HTTP GET requests to get the user groups.
 * Get parameters:
 *  - searchAutoComplete - return the users who's USER_ID starts with the string
 *  - top - maximum number of results
 *  
 * @param {array}
 *            aBodyItems - An array containing JS objects. (empty for get method)
 * @param {array}
 *            aParameters - List of request parameters.
 * @param {object}
 *            oServiceOutput - Object encapsulating any payload of the response (also status).
 * @param {object}
 *            oPersistency - Instance of Persistency to access data base.
 */

this.get = function(aBodyItems, aParameters, oServiceOutput, oPersistency) {
 
	var aUsers = [];
	
	var iTop = _.has(aParameters, "top") ? aParameters.top : maxQueryResults;
	
	var sSearchAutoComplete = _.has(aParameters, "searchAutocomplete") ? aParameters.searchAutocomplete : '';
	
	aUsers = oPersistency.Misc.getPLCUsers(sSearchAutoComplete,iTop);
	
	var oReturnObject = {
	    "PLC_USERS": _.values(aUsers)
	};
	
	oServiceOutput.setBody(oReturnObject);
	return oServiceOutput;
}

}; // end of module.exports.PlcUsers