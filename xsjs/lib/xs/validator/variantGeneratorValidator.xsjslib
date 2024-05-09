const MessageLibrary = $.require("../util/message");
const PlcException = MessageLibrary.PlcException;
const helpers = $.require("../util/helpers");
const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;

function VariantGeneratorValidator(oPersistency, oMetadataProvider, oUtils) {
    this.validate = function validate(oRequest) {
        function validatePostRequest() {
            const oRequestBody = oUtils.tryParseJson(oRequest.body.asString());
            const genericSyntaxValidator = new GenericSyntaxValidator();
            // The body should contain only the TARGET_CALCULATION_ID and CALCULATION_VERSION_NAME
            oUtils.checkInvalidProperties(oRequestBody, ["TARGET_CALCULATION_ID", "CALCULATION_VERSION_NAME"]);
            if (!helpers.isNullOrUndefined(oRequestBody.TARGET_CALCULATION_ID)) {
                oRequestBody.TARGET_CALCULATION_ID = genericSyntaxValidator.validateValue(oRequestBody.TARGET_CALCULATION_ID, "PositiveInteger", null, false);  //eslint-disable-line
            }
            if (!helpers.isNullOrUndefined(oRequestBody.CALCULATION_VERSION_NAME)) {
                oRequestBody.CALCULATION_VERSION_NAME = genericSyntaxValidator.validateValue(oRequestBody.CALCULATION_VERSION_NAME, "String", "length=500", false);  //eslint-disable-line
            }
            return oRequestBody;
        }

        switch (oRequest.method) {
            case $.net.http.POST:
                return validatePostRequest();
            default:
            {
                const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
                $.trace.error(sLogMessage);
                throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    };
}
VariantGeneratorValidator.prototype = Object.create(VariantGeneratorValidator.prototype);
VariantGeneratorValidator.prototype.constructor = VariantGeneratorValidator;
