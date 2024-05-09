const helpers = $.require('../util/helpers');

const BusinessObjectTypes = $.require('../util/constants').BusinessObjectTypes;

const GenericSyntaxValidator = $.require('./genericSyntaxValidator').GenericSyntaxValidator;
const MetadataProvider = $.require('../metadata/metadataProvider').MetadataProvider;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

/**
 * This class constructs BusinessObjectValidator instances for the Calculated Results business object type. It validates the
 * data in the body of a request. 
 * 
 * @constructor
 */

async function CalculatedResultsValidator(oPersistency, sSessionId, metadataProvider, utils) {

    var genericSyntaxValidator = await new GenericSyntaxValidator();

    /**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 * 
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *            validated parameters from URL
	 * @returns
	 * 
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
    this.validate = async function (oRequest, mValidatedParameters) {
        switch (oRequest.method) {
        case $.net.http.GET:
            return await validateGetRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        async function checkIfCalculationVersionExists(iCalculationVersionId) {
            if (oPersistency.CalculationVersion.existsCVTemp(iCalculationVersionId, sSessionId) === false) {
                const sClientMsg = 'Calculation version does not exist.';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
            }
        }

        async function checkIfCalculationVersionIsOpen(iCalculationVersionId) {
            if (oPersistency.CalculationVersion.isOpenedInSessionAndContext(sSessionId, iCalculationVersionId) === false) {
                const sClientMsg = 'Calculation version is not opened in the session.';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }, session id: ${ sSessionId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.CALCULATION_VERSION_NOT_OPEN_ERROR, sClientMsg);
            }
        }

        async function validateGetRequest() {
            utils.checkEmptyBody(oRequest.body);
            var iCalculationVersionId = await helpers.toPositiveInteger(mValidatedParameters.id);
            await checkIfCalculationVersionExists(iCalculationVersionId);
            await checkIfCalculationVersionIsOpen(iCalculationVersionId);
            return [];
        }

    };
}
CalculatedResultsValidator.prototype =  Object.create(CalculatedResultsValidator.prototype);
CalculatedResultsValidator.prototype.constructor = CalculatedResultsValidator;
export default {helpers,BusinessObjectTypes,GenericSyntaxValidator,MetadataProvider,MessageLibrary,PlcException,Code,CalculatedResultsValidator};
