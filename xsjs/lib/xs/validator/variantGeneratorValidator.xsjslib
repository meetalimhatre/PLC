const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const helpers = $.require('../util/helpers');
const GenericSyntaxValidator = $.require('./genericSyntaxValidator').GenericSyntaxValidator;

function VariantGeneratorValidator(oPersistency, oMetadataProvider, oUtils) {
    this.validate = async function validate(oRequest) {
        async function validatePostRequest() {
            const oRequestBody = oUtils.tryParseJson(oRequest.body.asString());
            const genericSyntaxValidator = await new GenericSyntaxValidator();
            // The body should contain only the TARGET_CALCULATION_ID and CALCULATION_VERSION_NAME
            oUtils.checkInvalidProperties(oRequestBody, [
                'TARGET_CALCULATION_ID',
                'CALCULATION_VERSION_NAME'
            ]);
            if (!helpers.isNullOrUndefined(oRequestBody.TARGET_CALCULATION_ID)) {
                oRequestBody.TARGET_CALCULATION_ID = await genericSyntaxValidator.validateValue(oRequestBody.TARGET_CALCULATION_ID, 'PositiveInteger', null, false);
            }
            if (!helpers.isNullOrUndefined(oRequestBody.CALCULATION_VERSION_NAME)) {
                oRequestBody.CALCULATION_VERSION_NAME = await genericSyntaxValidator.validateValue(oRequestBody.CALCULATION_VERSION_NAME, 'String', 'length=500', false);
            }
            return oRequestBody;
        }

        switch (oRequest.method) {
        case $.net.http.POST:
            return await validatePostRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    };
}
VariantGeneratorValidator.prototype = Object.create(VariantGeneratorValidator.prototype);
VariantGeneratorValidator.prototype.constructor = VariantGeneratorValidator;
export default {MessageLibrary,PlcException,helpers,GenericSyntaxValidator,VariantGeneratorValidator};
