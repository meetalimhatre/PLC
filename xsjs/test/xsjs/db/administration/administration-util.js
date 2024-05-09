var hQueryLib = require("../../../../lib/xs/xslib/hQuery");
var AdministrationImport = $.import("xs.db", "persistency-administration");
var Administration = AdministrationImport.Administration;
var _ = require("lodash");

/**
 * Initialise administration object for tests
 * @param oMockstar
 * @param oMockstarRepl
 * @returns {Administration}
 */
function getAdministrationObject(oMockstar,oMockstarRepl){
	var hQueryPlc = new hQueryLib.HQuery(jasmine.dbConnection);
	var hQueryPlcRepl = new hQueryLib.HQuery(jasmine.dbConnection);
	var oAdministration = new Administration(jasmine.dbConnection, hQueryPlc, hQueryPlcRepl, hQueryPlc);
	return oAdministration
}

/**
 * Prepare Administration Request
 * @param sMethod - method GET/POST
 * @param oItemsPayload - payload used on POST
 * @param aParams - url parameters
 * @returns {oRequest}
 */
function prepareAdministrationRequest(sMethod, oItemsPayload, aParams) {
	
	aParams.get = function(sArgument) {
		var foundParameter = _.find(aParams, function(oParam) {
			return sArgument === oParam.name;
		});
		
		if(foundParameter === undefined)
		    return foundParameter;
		else
		    return foundParameter.value;
	};
	
	var oRequest = {
			queryPath : "administration",
			method : sMethod,
			parameters : aParams
	};
	
	if(!_.isEmpty(oItemsPayload)){
		oRequest.body = {
			asString : function() {
				return JSON.stringify(oItemsPayload);
			}
		}
	}

	return oRequest;
}

module.exports = {
	getAdministrationObject,
	prepareAdministrationRequest
};
