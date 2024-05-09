const _ = require('lodash');
const GenericSyntaxValidator = require('./genericSyntaxValidator').GenericSyntaxValidator;
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const Helpers = require('../util/helpers');
const HttpMethodMapping = require('../util/constants').HttpMethodMapping;

async function logError(msg) {
    await Helpers.logError(msg);
}

/**
 * Validates the values of path variables (calculations/1) and request parameters (calculations?search=...). Instances 
 * of the class are initialized with a resource definition. This definition is used to gather the necessary metadata 
 * to validate the parameters and variables of requests. 
 * 
 * An instance of GenericSyntaxValidator is used to check the parameter values against syntactial
 * correctness.
 * 
 * @param {object} mResources Object working as map containing all the valid resource definitions. In production this is
 * 							  the Resources object defined in dispatcher.xsjslib. Is made injectable for testing.
 * 
 * @constructor
 */
async function UrlValidator(mResources) {

    const genericSyntaxValidator = await new GenericSyntaxValidator();

    /**
     * Validates a request if provided path variables and parameters are correct. In order to compare the correct 
     * metadata from the resource definition, the definition path and method of the request must be specified. 
     * 
     * @param {object} oRequest The $.request object which to access the present parameters for the request
     * @param {string} sResourceDefinitionKey The name of the resource definition in the Resource object. For a request
     * 								   towards calculations/1 it would be calculations/{calculation-id} for example
     * @returns {object} Returns a map with the validated parameter values (parameter name = key, parameter value =
     *          value)
     * @throws {ValidationException}  If unknown parameters or different values for a parameter are detected. It also raises the exception
     *             if the value of a parameter cannot be validated against the specified data type of the parameter
     *             value
     */
    this.validateUrl = async function (oRequest, sResourceDefinitionKey) {
        const oDefinition = mResources[sResourceDefinitionKey];
        if (await Helpers.isNullOrUndefined(oDefinition)) {
            const sLogMessage = `Cannot find resource definition for definition path ${ sResourceDefinitionKey }.`;
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
        }



        const mAllowedParameters = new Map();
        if (_.isArray(oDefinition.pathVariables)) {
            oDefinition.pathVariables.forEach(oParameterInfo => mAllowedParameters.set(oParameterInfo.name, oParameterInfo));
        }
        const sMethod = HttpMethodMapping[oRequest.method];
        oDefinition[sMethod].parameters.forEach(oParameterInfo => mAllowedParameters.set(oParameterInfo.name, oParameterInfo));



        const aRequestParameterTuples = [];
        const aRequestSegments = oRequest.queryPath.split('/');
        sResourceDefinitionKey.split('/').forEach((sSegment, iIndex) => {
            const bIsPathVariable = sSegment.startsWith('{') && sSegment.endsWith('}');
            if (bIsPathVariable) {

                const sVariableName = sSegment.replace(/\{|\}/g, '');
                aRequestParameterTuples.push([
                    sVariableName,
                    aRequestSegments[iIndex]
                ]);
            }
        });


        _.each(oRequest.parameters, function (oParameter, iIndex) {
            var oRequestParameter = oRequest.parameters[iIndex];
            aRequestParameterTuples.push([
                oRequestParameter.name,
                oRequestParameter.value
            ]);
        });

        const mRequestParameters = new Map();
        aRequestParameterTuples.forEach(aTuple => {
            if (mRequestParameters.has(aTuple[0])) {
                const sLogMessage = `Duplicated parameter ${ aTuple[0] }.`;
                await logError(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }

            mRequestParameters.set(aTuple[0], aTuple[1]);
        });

        return await validateParameterValues(mRequestParameters, mAllowedParameters);
    };

    async function validateParameterValues(mRequestParameters, mAllowedParameters) {
        const mValidatedParameters = {};
        const aMandatoryParameters = Array.from(mAllowedParameters.values()).filter(oParameterInfo => oParameterInfo.isMandatory);
        const aParametersInRequest = aMandatoryParameters.map(oMandatoryParameterInfo => mRequestParameters.has(oMandatoryParameterInfo.name));
        const iMissingMandatoryParameterIndex = aParametersInRequest.indexOf(false);
        if (iMissingMandatoryParameterIndex > -1) {
            const sLogMessage = `Missing mandatory parameter ${ aMandatoryParameters[iMissingMandatoryParameterIndex].name }.`;
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
        }

        Array.from(mRequestParameters.keys()).forEach(sRequestParameterName => {
            if (!mAllowedParameters.has(sRequestParameterName)) {
                const sLogMessage = `Request parameter ${ sRequestParameterName } is not allowed.`;
                await logError(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }

            const vParameterValue = mRequestParameters.get(sRequestParameterName);
            const oParameterInfo = mAllowedParameters.get(sRequestParameterName);
            const vValidatedValue = await genericSyntaxValidator.validateValue(vParameterValue, oParameterInfo.dataType, null, oParameterInfo.isMandatory);


            if (!_.isEmpty(oParameterInfo.validValues) && _.values(oParameterInfo.validValues).indexOf(vValidatedValue) < 0) {
                const sLogMessage = `The value ${ vValidatedValue } is not valid for for parameter ${ oParameterInfo.name }. Valid values are: ${ oParameterInfo.validValues.toString() }`;
                await logError(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }

            mValidatedParameters[oParameterInfo.name] = vValidatedValue;
        });
        return mValidatedParameters;
    }
}

UrlValidator.prototype = await Object.create(UrlValidator.prototype);
UrlValidator.prototype.constructor = UrlValidator;

module.exports.UrlValidator = UrlValidator;
export default {_,GenericSyntaxValidator,MessageLibrary,PlcException,Code,Helpers,HttpMethodMapping,logError,UrlValidator};
