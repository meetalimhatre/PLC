const _ = $.require("lodash");

const Constants = $.require("../util/constants");
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;
const helpers = $.require("../util/helpers");
const AddinStates = Constants.AddinStates;
const AddinServiceParameters = Constants.AddinServiceParameters;

const MessageLibrary = $.require("../util/message");
const Code = MessageLibrary.Code;
const PlcException = MessageLibrary.PlcException;

/**
 * This class constructs BusinessObjectValidator instances for the Addin business object type. It validates the
 * data in the body of a request. For this, the validation distinguishes the different CRUD operations which can be done
 * upon the business object.
 * @constructor
 */

function AddinValidator(oPersistency, sSessionId, metadataProvider, utils) {

	var genericSyntaxValidator = new GenericSyntaxValidator();

	var aRegisterMandatoryPropertiesStatic = [
			"FULL_QUALIFIED_NAME",
			"ADDIN_GUID",
			"ADDIN_VERSION",
			"NAME",
			"CERTIFICATE_ISSUER",
			"CERTIFICATE_SUBJECT",
			"CERTIFICATE_VALID_FROM",
			"CERTIFICATE_VALID_TO"
		];
	var aRegisterOptionalPropertiesStatic = [
			"DESCRIPTION",
			"PUBLISHER"
		];

	var aUnregisterMandatoryPropertiesStatic = [
			"ADDIN_GUID",
			"ADDIN_VERSION"
		];

	var aUpdateMandatoryPropertiesStatic = [
			"ADDIN_GUID",
			"ADDIN_VERSION",
			"LAST_MODIFIED_ON",
			"STATUS"
	];

	this.validate = function(oRequest, mValidatedParameters) {
		switch (oRequest.method) {
			case $.net.http.GET:
				return validateGetRequest();
			case $.net.http.POST:
				return validateRegisterRequest();
			case $.net.http.PUT:
				return validateUpdateRequest();
			case $.net.http.DEL:
				return validateUnregisterRequest();
			default: {
				const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		function validateGetRequest() {
			// Check if request body is empty
			utils.checkEmptyBody(oRequest.body);
		}

		function validateRegisterRequest() {
			var oAddin = utils.tryParseJson(oRequest.body.asString());

			// Perform generic field checks and transformations
			return validateAddinFields(oAddin, aRegisterMandatoryPropertiesStatic, aRegisterOptionalPropertiesStatic);
		}

		function validateUnregisterRequest() {
			var oAddin = utils.tryParseJson(oRequest.body.asString());

			// Perform generic field checks and transformations
			return validateAddinFields(oAddin, aUnregisterMandatoryPropertiesStatic, []);
		}

		function validateUpdateRequest() {
			var oAddin = utils.tryParseJson(oRequest.body.asString());

			// Status Activated|Registered is mandatory for update requests
			if(oAddin.STATUS === undefined || !_.includes(_.values(AddinStates), oAddin.STATUS.toLowerCase())) {
				const sLogMessage = `Addin status '${oAddin.STATUS}'is invalid.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			// Transform STATUS to lowercase for return object
			oAddin.STATUS = oAddin.STATUS.toLowerCase();

			// Perform generic field checks and transformations
			var oValidatedAddinVersion = validateAddinFields(oAddin, aUpdateMandatoryPropertiesStatic, []);

			return oValidatedAddinVersion;
		}

		// Generic Addin Item validation method: field checks / use of helpers to check for addin version / metadata conversion
		function validateAddinFields(oAddinFields, aMandatoryFields, aOptionalFields) {
			// Fetch Addin Metadata
			var oMetadata = metadataProvider.get(BusinessObjectTypes.AddinVersion, BusinessObjectTypes.AddinVersion, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());

			// Check if only mandatory and optional properties are available
			utils.checkMandatoryProperties(oAddinFields, aMandatoryFields);
			utils.checkInvalidProperties(oAddinFields, aMandatoryFields.concat(aOptionalFields));

			// Check if version matches definition
			helpers.validateAddinVersionString(oAddinFields.ADDIN_VERSION);

			// Make general field checks and convert the field value based on metadata
			var oValidatedAddin = utils.checkEntity({
				entity : oAddinFields,
				categoryId : -1,
				subitemState : -1,
				metadata : oMetadata
			});

			return oValidatedAddin;
		}

	};
}
AddinValidator.prototype = Object.create(AddinValidator.prototype);
AddinValidator.prototype.constructor = AddinValidator;
