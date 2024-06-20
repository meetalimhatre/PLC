/**
 * Instances of this class encapsulate inputs for the Validator#validate function.
 * @constructor
 */
function ValidatorInput(oRequest, sResourceDefinitionKey) {
    const HttpMethodMapping = $.require('../util/constants').HttpMethodMapping;

    this.request = oRequest;
    this.definitionKey = sResourceDefinitionKey;
    this.method = HttpMethodMapping[oRequest.method];
}

ValidatorInput.prototype = Object.create(ValidatorInput.prototype);
ValidatorInput.prototype.constructor = ValidatorInput;

/**
 * This constructs a validator instance, which is the central interface for client code to initiate the validation of a request (input validation).
 * The validation process has several steps which are implemented by specialized classes. This class aggregates the results of the validation
 * and return it to the calling client. If a validation step fails, an instance of ValidationException is raised.
 *
 * @property {boolean} validationSuccess - indicates if the validation was successful
 *
 * @constructor
 */
function Validator(oPersistency, sSessionId, Resources) {

    //Object.defineProperty can be used to define read-onyl properties 
    // ==> should it be done this way or with an explicit getter-function?
    var bValidationSuccess = false;
    Object.defineProperty(this, 'validationSuccess', {
        get: function () {
            return bValidationSuccess;
        }
    });

    /**
     * This function starts the validation of a request.
     *
     * @param oValdiatorInput - an instance of ValidatorInput which encapsulate inputs for this function
     * @param oPersistency - an instance of Persistency to access the persisted data from the database
     * @param sSessionId - the sessionId of the with the current request, this id is used to retrieve data from the database tables
     * @returns {object} validationResult
     * @returns {object} validationResult.parameters
     * @returns {object} validationResult.data
     *
     *  @throws {ValidationException} - if a validation step fails
     * @throws {ArgumentException} - if the given arguments are not valid for this methods.
     */
    this.validate = function (oValdiatorInput, oServiceOutput) {
        if (!(oValdiatorInput instanceof ValidatorInput)) {
            const sLogMessage = 'oValidatorInput has to be an instance of ValidatorInput.';
            $.trace.error(sLogMessage);
            const MessageLibrary = $.require('../util/message');
            const PlcException = MessageLibrary.PlcException;
            const Code = MessageLibrary.Code;
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        const UrlValidator = $.require('./urlValidator').UrlValidator;
        const mValidatedParameters = ( new UrlValidator(Resources)).validateUrl(oValdiatorInput.request, oValdiatorInput.definitionKey);
        const sBoType = Resources[oValdiatorInput.definitionKey][oValdiatorInput.method].businessObjectType;
        const BuisnessObjectValidatorFactory = $.import('xs.validator', 'businessObjectValidatorFactory').BusinessObjectValidatorFactory;
        const oBoValidator = BuisnessObjectValidatorFactory.createBusinessObjectValidator(sBoType, oPersistency, sSessionId);
        const aValidatedBusinessObjects = oBoValidator.validate(oValdiatorInput.request, mValidatedParameters, oServiceOutput);

        bValidationSuccess = true;

        var oValidationOutput = {
            parameters: mValidatedParameters,
            data: aValidatedBusinessObjects
        };
        return oValidationOutput;
    };
}
Validator.prototype =  Object.create(Validator.prototype);
Validator.prototype.constructor = Validator;
export default {ValidatorInput,Validator};
