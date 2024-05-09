const _ = $.require("lodash");
const MessageLibrary = $.require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;
const helpers = $.require("../util/helpers");

/**
 * This class constructs BusinessObjectValidator instances for the  business object type. It
 * validates the data in the body of a request. For this, the validation distinguishes the different CRUD operations
 * which can be done upon the business object.
 *
 * @constructor
 */

function FrontendSettingsValidator(oPersistency, utils) {
    var genericSyntaxValidator = new GenericSyntaxValidator();
    // Accept characters from other language with \w (replaces "a-zA-Z0-9_"), # and space except of leading and trailing spaces
    var sSettingsNameRegExp = "^([\\pL\\d_:#.\\/\\-][^\\S\\n\\r\\f\\t]?)*[\\pL\\d_:#.\\/\\-]$";
	// RegEx used only to validate the URL for the aplication help link
	const sURLRegEx = "^((((https?|ftps?|gopher|telnet|nntp)://)|(mailto:|news:))(%[0-9A-Fa-f]{2}|[-()_.!~*';/?:@&=+$,A-Za-z0-9])+)([).!';/?:,][[:blank:]])?$";
    var sSettingsTypeRegExp = /^[\w]+$/;
    // Accept JSON format and Base64 encoded strings
    var sSettingsContentRegExp = /^[\w\{\}\s\:\[\]\",.#$\/\\\+]*\=*$/;
    var sSettingsNameMaxLength = '250';
    var sSettingsTypeMaxLength = '50';
	const sCustomerHelpLink = "CUSTOMERPROVIDEDHELPLINK";
	/**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 *
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *            Validated request parameters.
	 * @returns
	 *			{oLayout}
	 *				Validated  object
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
	this.validate = function(oRequest, mValidatedParameters) {
		switch (oRequest.method) {
			case $.net.http.GET:
				return utils.checkEmptyBody(oRequest.body);
			case $.net.http.POST:
				return validatePostRequest();
			case $.net.http.PUT:
				return validatePutRequest();
			case $.net.http.DEL:
				return validateDeleteRequest();
			default: {
				const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		function validatePostRequest() {
			var aMandatoryAndValidProperties = ["SETTING_ID", "SETTING_NAME", "SETTING_TYPE", "SETTING_CONTENT"];
			var aFrontendSettings = utils.tryParseJson(oRequest.body.asString());
			//check mandatory properties and invalid properties for setting
			if (!_.isArray(aFrontendSettings) || _.isEmpty(aFrontendSettings)) {
				const sLogMessage = `Cannot validate HTTP method POST on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			} else {
				_.each(aFrontendSettings, function(oFrontendSetting) {
					utils.checkMandatoryProperties(oFrontendSetting, aMandatoryAndValidProperties);
					utils.checkInvalidProperties(oFrontendSetting, aMandatoryAndValidProperties);
					const bIsApplicationHelpLink = oFrontendSetting.SETTING_NAME.toUpperCase() === sCustomerHelpLink;
					const bIsNotEmpty = oFrontendSetting.SETTING_CONTENT && oFrontendSetting.SETTING_CONTENT.length > 0;
					if (bIsApplicationHelpLink && bIsNotEmpty) {
						genericSyntaxValidator.validateValue(oFrontendSetting.SETTING_CONTENT, 'String', undefined, false, sURLRegEx);
					} else {
						genericSyntaxValidator.validateValue(oFrontendSetting.SETTING_CONTENT, 'String', undefined, false, sSettingsContentRegExp);
					}
					genericSyntaxValidator.validateValue(oFrontendSetting.SETTING_NAME, 'String', 'length = ' + sSettingsNameMaxLength, false, sSettingsNameRegExp);
					genericSyntaxValidator.validateValue(oFrontendSetting.SETTING_TYPE, 'String', 'length = ' + sSettingsTypeMaxLength, false, sSettingsTypeRegExp);
					
					//check that 'CHANGE_CONFIGURATION' property is filled for 'Mass Change'
					if (oFrontendSetting.SETTING_TYPE === 'MassChange') {
						try {
							var aSettingContentDecoded = JSON.parse(helpers.arrayBufferToString($.util.codec.decodeBase64(oFrontendSetting.SETTING_CONTENT)));
						} catch (e) {
							const sLogMessage = `'SETTING_CONTENT' should be sent in valid base64 format. NAME: ${oFrontendSetting.SETTING_NAME}.`;
							$.trace.error(sLogMessage);
							throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
						}
						
						if (helpers.isNullOrUndefined(aSettingContentDecoded.CHANGE_CONFIGURATION) || 
								helpers.isNullOrUndefined(aSettingContentDecoded.CHANGE_CONFIGURATION.FIELD)) {
							const sLogMessage = `Property 'CHANGE_CONFIGURATION' of resource ${oRequest.queryPath} not filled correctly. NAME: ${oFrontendSetting.SETTING_NAME}.`;
							$.trace.error(sLogMessage);
							throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);		
						}
					}
				});
			}

			return aFrontendSettings;
		}

		function validatePutRequest() {
			var aUpdateMandatoryProperties = ["SETTING_ID", "SETTING_NAME"];
			var aUpdateValidProperties = ["SETTING_ID", "SETTING_NAME", "SETTING_CONTENT"];
			var aFrontendSettings = utils.tryParseJson(oRequest.body.asString());
			var aFrontEndSettingsIdAndContent = new Map();

			//check mandatory properties and invalid properties for setting
			if (!_.isArray(aFrontendSettings) || _.isEmpty(aFrontendSettings)) {
				const sLogMessage = `Cannot validate HTTP method PUT on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			} else {
				_.each(aFrontendSettings, function(oFrontendSetting) {
					utils.checkMandatoryProperties(oFrontendSetting, aUpdateMandatoryProperties);
					utils.checkInvalidProperties(oFrontendSetting, aUpdateValidProperties);
					const bIsApplicationHelpLink = oFrontendSetting.SETTING_NAME.toUpperCase() === sCustomerHelpLink;
					const bIsNotEmpty = oFrontendSetting.SETTING_CONTENT && oFrontendSetting.SETTING_CONTENT.length > 0;
					if (bIsApplicationHelpLink && bIsNotEmpty) {
						genericSyntaxValidator.validateValue(oFrontendSetting.SETTING_CONTENT, 'String', undefined, false, sURLRegEx);
					} else {
						genericSyntaxValidator.validateValue(oFrontendSetting.SETTING_CONTENT, 'String', undefined, false, sSettingsContentRegExp);
					}
					genericSyntaxValidator.validateValue(oFrontendSetting.SETTING_NAME, 'String', 'length = ' + sSettingsNameMaxLength, false, sSettingsNameRegExp);
					aFrontEndSettingsIdAndContent.set(oFrontendSetting.SETTING_ID, oFrontendSetting.SETTING_CONTENT);
				});
			}

			var aFrontendSettingsIds = Array.from(aFrontEndSettingsIdAndContent.keys());
			var aFrontendSettingMassChangeIds = oPersistency.FrontendSettings.getFrontendSettingsMassChangeIds(aFrontendSettingsIds);

			_.each (aFrontendSettingMassChangeIds, function(oFrontendSettingId) {
				//check that 'CHANGE_CONFIGURATION' property is filled for 'Mass Change'
				const oFrontendSettingContent = aFrontEndSettingsIdAndContent.get(oFrontendSettingId.SETTING_ID);
				try {
					var aSettingContentDecoded = JSON.parse(helpers.arrayBufferToString($.util.codec.decodeBase64(oFrontendSettingContent)));
				} catch (e) {
					const sLogMessage = `'SETTING_CONTENT' should be sent in valid base64 format. Id: ${oFrontendSettingId.SETTING_ID}.`;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
				}
				
				if (helpers.isNullOrUndefined(aSettingContentDecoded.CHANGE_CONFIGURATION) || 
						helpers.isNullOrUndefined(aSettingContentDecoded.CHANGE_CONFIGURATION.FIELD)) {
					const sLogMessage = `Property 'CHANGE_CONFIGURATION' of resource ${oRequest.queryPath} not filled correctly. Id: ${oFrontendSettingId.SETTING_ID}.`;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);		
				}
			});

			return aFrontendSettings;
		}

		function validateDeleteRequest() {
			var aDeleteMandatoryProperties = ["SETTING_ID"];
			var aFrontendSettings = utils.tryParseJson(oRequest.body.asString());
			//check mandatory properties and invalid properties for setting
			if (!_.isArray(aFrontendSettings) || _.isEmpty(aFrontendSettings)) {
				const sLogMessage = `Cannot validate HTTP method DELETE on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			} else {
				_.each(aFrontendSettings, function(oFrontendSetting) {
					utils.checkMandatoryProperties(oFrontendSetting, aDeleteMandatoryProperties);
					utils.checkInvalidProperties(oFrontendSetting, aDeleteMandatoryProperties);
				});
			}
			return aFrontendSettings;
		}
	};
}

FrontendSettingsValidator.prototype = Object.create(FrontendSettingsValidator.prototype);
FrontendSettingsValidator.prototype.constructor = FrontendSettingsValidator;