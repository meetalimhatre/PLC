const _ = require("lodash");
const helpers = require("../util/helpers");
const MessageLibrary = require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

function logError(msg) {
    helpers.logError(msg);
}

/**
 * This class constructs BodylessRequestValidator instances, which can be used to validate requests which are not
 * supposed to have body content.
 * 
 * @param {array} aHttpMethods - List of $.net.http.* methods for which's requests have no body
 * 
 * @constructor
 */

function BodilessRequestValidator(aHttpMethods) {
	
    var bValidationSuccess = false;
    Object.defineProperty(this, "validationSuccess", {
        get: function() {
            return bValidationSuccess;
        }
    });
	
	if(!_.isArray(aHttpMethods)){
		const sLogMessage = "aHttpMethods needs to be an array";
		logError(sLogMessage);
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
	}

	this.validate = function(oRequest) {
		if (_.indexOf(aHttpMethods, oRequest.method) === -1) {
			const sLogMessage = `This validator is only configured to validate if an request body is empty for the following HTTP methods: ${aHttpMethods.toString()}. A validation for the request method ${oRequest.method} is not possible.`;
			logError(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}

		if (!_.isUndefined(oRequest.body)) {
			const sClientMsg = `Empty request body expected for HTTP method ${oRequest.method} on resource ${oRequest.queryPath}.`;
			const sServerMsg = `${sClientMsg} Body: ${oRequest.body.asString()}`;
			logError(sServerMsg);
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
		}
		
		bValidationSuccess = true;
	};
}
BodilessRequestValidator.prototype = Object.create(BodilessRequestValidator.prototype);
BodilessRequestValidator.prototype.constructor = BodilessRequestValidator;

module.exports.BodilessRequestValidator = BodilessRequestValidator;