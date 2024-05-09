const _ = $.require('lodash');

const Constants = $.require('../util/constants');
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const GenericSyntaxValidator = $.require('./genericSyntaxValidator').GenericSyntaxValidator;
const helpers = $.require('../util/helpers');
const AddinStates = Constants.AddinStates;
const AddinServiceParameters = Constants.AddinServiceParameters;

const MessageLibrary = $.require('../util/message');
const Code = MessageLibrary.Code;
const PlcException = MessageLibrary.PlcException;

/**
 * This class constructs BusinessObjectValidator instances for the Addin business object type. It validates the
 * data in the body of a request. For this, the validation distinguishes the different CRUD operations which can be done
 * upon the business object.
 * @constructor
 */

async function AddinValidator(oPersistency, sSessionId, metadataProvider, utils) {

    var genericSyntaxValidator = await new GenericSyntaxValidator();

    var aRegisterMandatoryPropertiesStatic = [
        'FULL_QUALIFIED_NAME',
        'ADDIN_GUID',
        'ADDIN_VERSION',
        'NAME',
        'CERTIFICATE_ISSUER',
        'CERTIFICATE_SUBJECT',
        'CERTIFICATE_VALID_FROM',
        'CERTIFICATE_VALID_TO'
    ];
    var aRegisterOptionalPropertiesStatic = [
        'DESCRIPTION',
        'PUBLISHER'
    ];

    var aUnregisterMandatoryPropertiesStatic = [
        'ADDIN_GUID',
        'ADDIN_VERSION'
    ];

    var aUpdateMandatoryPropertiesStatic = [
        'ADDIN_GUID',
        'ADDIN_VERSION',
        'LAST_MODIFIED_ON',
        'STATUS'
    ];

    this.validate = async function (oRequest, mValidatedParameters) {
        switch (oRequest.method) {
        case $.net.http.GET:
            return await validateGetRequest();
        case $.net.http.POST:
            return await validateRegisterRequest();
        case $.net.http.PUT:
            return await validateUpdateRequest();
        case $.net.http.DEL:
            return await validateUnregisterRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        async function validateGetRequest() {
            // Check if request body is empty
            utils.checkEmptyBody(oRequest.body);
        }

        async function validateRegisterRequest() {
            var oAddin = utils.tryParseJson(oRequest.body.asString());

            // Perform generic field checks and transformations
            return await validateAddinFields(oAddin, aRegisterMandatoryPropertiesStatic, aRegisterOptionalPropertiesStatic);
        }

        async function validateUnregisterRequest() {
            var oAddin = utils.tryParseJson(oRequest.body.asString());

            // Perform generic field checks and transformations
            return await validateAddinFields(oAddin, aUnregisterMandatoryPropertiesStatic, []);
        }

        async function validateUpdateRequest() {
            var oAddin = utils.tryParseJson(oRequest.body.asString());

            // Status Activated|Registered is mandatory for update requests
            if (oAddin.STATUS === undefined || !_.includes(_.values(AddinStates), oAddin.STATUS.toLowerCase())) {
                const sLogMessage = `Addin status '${ oAddin.STATUS }'is invalid.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }
            // Transform STATUS to lowercase for return object
            oAddin.STATUS = oAddin.STATUS.toLowerCase();

            // Perform generic field checks and transformations
            var oValidatedAddinVersion = await validateAddinFields(oAddin, aUpdateMandatoryPropertiesStatic, []);

            return oValidatedAddinVersion;
        }

        // Generic Addin Item validation method: field checks / use of helpers to check for addin version / metadata conversion
        async function validateAddinFields(oAddinFields, aMandatoryFields, aOptionalFields) {
            // Fetch Addin Metadata
            var oMetadata = metadataProvider.get(BusinessObjectTypes.AddinVersion, BusinessObjectTypes.AddinVersion, null, null, oPersistency, $.getPlcUsername(), $.getPlcUsername());

            // Check if only mandatory and optional properties are available
            await utils.checkMandatoryProperties(oAddinFields, aMandatoryFields);
            utils.checkInvalidProperties(oAddinFields, aMandatoryFields.concat(aOptionalFields));

            // Check if version matches definition
            await helpers.validateAddinVersionString(oAddinFields.ADDIN_VERSION);


            var oValidatedAddin = utils.checkEntity({
                entity: oAddinFields,
                categoryId: -1,
                subitemState: -1,
                metadata: oMetadata
            });

            return oValidatedAddin;
        }

    };
}
AddinValidator.prototype =  Object.create(AddinValidator.prototype);
AddinValidator.prototype.constructor = AddinValidator;
export default {_,Constants,BusinessObjectTypes,GenericSyntaxValidator,helpers,AddinStates,AddinServiceParameters,MessageLibrary,Code,PlcException,AddinValidator};
