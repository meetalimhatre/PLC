const helpers = require("../util/helpers");
const _ = require("lodash");
const constants = require("../util/constants");
const ServiceParameters = constants.ServiceParameters;

const GenericSyntaxValidator = require("./genericSyntaxValidator").GenericSyntaxValidator;
const BusinessObjectTypes = require("../util/constants").BusinessObjectTypes;

const MessageLibrary = require("../util/message");
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const PlcException = MessageLibrary.PlcException;
const aMandatoryProperties = ["ENTITY", "SUBJECT"];
const aValidProperties = ["ENTITY", "SUBJECT", "VALID_TO", "VALID_FOR"];
const aValidEntities = ["VENDOR", "CUSTOMER", "USER", "PROJECT"];

function RetentionPeriodsValidator($, utils) {	
    var genericSyntaxValidator = new GenericSyntaxValidator();

	/**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 *
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *            Validated request parameters.
	 * @returns
	 *			{aRetentionPeriods} 
	 *				Validated  array
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
	this.validate = function(oRequest, mValidatedParameters) {
		switch (oRequest.method) {
			case $.net.http.GET:
				return utils.checkEmptyBody(oRequest.body);
			case $.net.http.POST:
				return validatePostPutRequest();
			case $.net.http.PUT:
				return validatePostPutRequest();
			case $.net.http.DEL:
				return validateDeleteRequest();
			default: {
				let sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		function validatePostPutRequest() {
			let aBody = utils.tryParseJson(oRequest.body.asString());
			checkArray(aBody);
            aBody.forEach(oRetentionPeriod => {
                utils.checkMandatoryProperties(oRetentionPeriod, aMandatoryProperties);
			    utils.checkInvalidProperties(oRetentionPeriod, aValidProperties);
                if((oRetentionPeriod.VALID_TO && oRetentionPeriod.VALID_FOR) ||
                   (!oRetentionPeriod.VALID_TO && !oRetentionPeriod.VALID_FOR)) {
                    let sLogMessage = `One (and only one) validity need to be set.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
                if(!aValidEntities.includes(oRetentionPeriod.ENTITY)) {
                    let sLogMessage = `Entity can only be one of the: customer, vendor, project or user.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
                if(oRetentionPeriod.ENTITY === "USER") {
                    if(oRetentionPeriod.SUBJECT === "*") {
                        let sLogMessage = `For entity user no general subject is accepted.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                    if(oRetentionPeriod.VALID_FOR) {
                        let sLogMessage = `For entity user only valid to can be defined.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                }
                genericSyntaxValidator.validateValue(oRetentionPeriod.VALID_TO, "UTCTimestamp", undefined, false);
                genericSyntaxValidator.validateValue(oRetentionPeriod.VALID_FOR, "PositiveInteger", undefined, false);
            });

			return aBody;
		}

		function validateDeleteRequest() {
			let aBody = utils.tryParseJson(oRequest.body.asString());
			checkArray(aBody);
			aBody.forEach(oRetentionPeriod => {
                utils.checkMandatoryProperties(oRetentionPeriod, aMandatoryProperties);
			    utils.checkInvalidProperties(oRetentionPeriod, aMandatoryProperties);
			});
			return aBody;
		}

		function checkArray(aBody) {
			if(!Array.isArray(aBody) || aBody.length === 0) {
                let sLogMessage = `Body is not an array or is an empty array.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }
		}
	};
}
RetentionPeriodsValidator.prototype = Object.create(RetentionPeriodsValidator.prototype);
RetentionPeriodsValidator.prototype.constructor = RetentionPeriodsValidator;

module.exports.RetentionPeriodsValidator = RetentionPeriodsValidator;