const _ = $.require("lodash");

const BusinessObjectTypes = $.require("../util/constants").BusinessObjectTypes;

const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;
const helpers = $.require("../util/helpers");
const MetadataProvider = $.require("../metadata/metadataProvider").MetadataProvider;

const MessageLibrary = $.require("../util/message");
const Code = MessageLibrary.Code;
const PlcException = MessageLibrary.PlcException;

/**
 * This class constructs BusinessObjectValidator instances for the AddinConfiguration business object type. It validates the
 * data in the body of a request. For this, the validation distinguishes the different CRUD operations which can be done
 * upon the business object.
 * @constructor
 */

function AddinConfigurationValidator(oPersistency, sSessionId, metadataProvider, utils) {

	var genericSyntaxValidator = new GenericSyntaxValidator();

		
	var aCreateMandatoryPropertiesStatic = ["ADDIN_GUID", "ADDIN_VERSION"];
	var aCreateOptionalPropertiesStatic = [];
	
	var aUpdateMandatoryPropertiesStatic = ["ADDIN_GUID", "ADDIN_VERSION", "LAST_MODIFIED_ON"];
	var aUpdateOptionalPropertiesStatic = [];

	this.validate = function(oRequest, mValidatedParameters) {
		switch (oRequest.method) {
			case $.net.http.GET:							// Read Configuration
				return validateGetRequest();
			case $.net.http.POST:						  // Update Configuration
				return validateCreateRequest();
			case $.net.http.PUT:						  // Update Configuration
				return validateUpdateRequest();
			default: {
				const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		function validateGetRequest() {
			
			// Check if Version matches definition
			helpers.validateAddinVersionString(mValidatedParameters.version);

			// Check if request body is empty
			utils.checkEmptyBody(oRequest.body);
		}

		function validateCreateRequest() {
			var oAddinConfiguration = utils.tryParseJson(oRequest.body.asString());

			// Fetch meta data for business objects
			var oMetadataForConfigurationHeader = metadataProvider.get(BusinessObjectTypes.AddinConfigurationHeader, BusinessObjectTypes.AddinConfigurationHeader, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());
			var oMetadataForConfigurationItem = metadataProvider.get(BusinessObjectTypes.AddinConfigurationItem, BusinessObjectTypes.AddinConfigurationItem, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());

			// Validate configuration header
			var oValidatedAddinConfiguration = validateAddinConfigurationFields(_.omit(oAddinConfiguration, ['CONFIG_DATA']), oMetadataForConfigurationHeader, aCreateMandatoryPropertiesStatic, aCreateOptionalPropertiesStatic);

			// Check if Version matches definition
			helpers.validateAddinVersionString(oValidatedAddinConfiguration.ADDIN_VERSION);

			// Check if CONFIG_DATA is available
			if(oAddinConfiguration.CONFIG_DATA === undefined || !_.isArray(oAddinConfiguration.CONFIG_DATA)) {
				const sLogMessage = "Mandatory property CONFIG_DATA is missing.";
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}

			// Validate configuration items
			oValidatedAddinConfiguration.CONFIG_DATA = [];
			validateAddinConfigData(oAddinConfiguration, oValidatedAddinConfiguration, oMetadataForConfigurationItem);

			return oValidatedAddinConfiguration;
		}

		function validateUpdateRequest() {
			var oAddinConfiguration = utils.tryParseJson(oRequest.body.asString());

			// Fetch meta data for business objects
			var oMetadataForConfigurationHeader = metadataProvider.get(BusinessObjectTypes.AddinConfigurationHeader, BusinessObjectTypes.AddinConfigurationHeader, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());
			var oMetadataForConfigurationItem = metadataProvider.get(BusinessObjectTypes.AddinConfigurationItem, BusinessObjectTypes.AddinConfigurationItem, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());

			// Validate configuration header
			var oValidatedAddinConfiguration = validateAddinConfigurationFields(_.omit(oAddinConfiguration, ['CONFIG_DATA']), oMetadataForConfigurationHeader, aUpdateMandatoryPropertiesStatic, aUpdateOptionalPropertiesStatic);

			// Check if Version matches definition
			helpers.validateAddinVersionString(oValidatedAddinConfiguration.ADDIN_VERSION);

			// Check if CONFIG_DATA is available
			if(oAddinConfiguration.CONFIG_DATA === undefined || !_.isArray(oAddinConfiguration.CONFIG_DATA)) {
				const sLogMessage = "Mandatory property CONFIG_DATA is missing.";
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}

			// Validate configuration items
			oValidatedAddinConfiguration.CONFIG_DATA = [];
			validateAddinConfigData(oAddinConfiguration, oValidatedAddinConfiguration, oMetadataForConfigurationItem);

			return oValidatedAddinConfiguration;
		}

		//Generic function to validate config data of an addin
		function validateAddinConfigData(oAddinConfiguration, oValidatedAddinConfiguration, oMetadataForConfigurationItem){
			_.each(oAddinConfiguration.CONFIG_DATA, function(oConfigItem, iIndex) {
				let oConfigKeyValidated = validateAddinConfigurationFields( _.omit(oConfigItem, 'CONFIG_VALUE')  , oMetadataForConfigurationItem, ['CONFIG_KEY'], [], 'included');
				let oConfigValueValidated = validateAddinConfigurationFields( _.omit(oConfigItem, 'CONFIG_KEY'), oMetadataForConfigurationItem, ['CONFIG_VALUE'], [], 'includedWithBlanks');
				oValidatedAddinConfiguration.CONFIG_DATA.push({...oConfigKeyValidated, ...oConfigValueValidated});
			});
		}

		// Generic Configuration Item validation method: field checks / metadata conversion
		function validateAddinConfigurationFields(oAddinConfigFields, oMetadata, aMandatoryFields, aOptionalFields, sMode) {

			// Check if only mandatory and optional properties are available.
			utils.checkMandatoryProperties(oAddinConfigFields, aMandatoryFields, sMode);
			utils.checkInvalidProperties(oAddinConfigFields, aMandatoryFields.concat(aOptionalFields));

			// Make general field checks and convert the field value based on metadata
			var oValidatedAddin = utils.checkEntity({
				entity : oAddinConfigFields,
				categoryId : -1,
				subitemState : -1,
				metadata : oMetadata
			});

			return oValidatedAddin;
		}
	};
}

AddinConfigurationValidator.prototype = Object.create(AddinConfigurationValidator.prototype);
AddinConfigurationValidator.prototype.constructor = AddinConfigurationValidator;
