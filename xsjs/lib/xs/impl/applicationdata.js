const _ = require("lodash");
const ApplicationDataService = require("../service/applicationdataService");

module.exports.Applicationdata = function($) {

/**
 * Handles a HTTP GET request to get the logged on session user.
 */
this.getCurrentUser = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
	//although there is always only one current user, we return an array to comply to other responses
	let aCurrentUsers = 
		[
			{USER_ID: $.getPlcUsername()}
		];
	oServiceOutput.setBody(aCurrentUsers);
}

/**
 * Handles a HTTP GET request to get all languages available.
 */
this.getLanguages = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
	
	// The parameter "en" is needed for complying the signature of the function
	const aLanguages = ApplicationDataService.getLanguages("en", oPersistency);

	let aLanguageCodes = [];
	_.each(aLanguages, function(oLanguageLong) {
		const oLanguageShort = _.pick(oLanguageLong,"LANGUAGE");
		aLanguageCodes.push(oLanguageShort);
	 });

	oServiceOutput.setBody(aLanguageCodes);
}

}; // end of module.exports.Applicationdata