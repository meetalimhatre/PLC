const _ = $.require("lodash");
const MessageLibrary = $.require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;

function DataProtectionValidator(utils) {
    function propagateError(sMessage) {
        $.trace.error(sMessage);
        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sMessage);
    }

    function validateDeleteRequest(oRequest) {
        const requestBodyContent = utils.tryParseJson(oRequest.body.asString());

        if (_.isEmpty(requestBodyContent)) {
            propagateError("Request body of the data protection deletion service must not be empty.");
        }

        const aValidProperties = ["USER_ID", "CUSTOMER_ID", "VENDOR_ID", "PROJECT_ID"];
        utils.checkInvalidProperties(requestBodyContent, aValidProperties);

        return requestBodyContent;
    }

    function validatePostRequest(oRequest) {
        const requestBodyContent = utils.tryParseJson(oRequest.body.asString());
        if (_.isEmpty(requestBodyContent)) {
            propagateError("Request body must not be empty.");
        }
        const aValidProperties = ["ENTITY", "ENTITY_TYPE"];
        utils.checkMandatoryProperties(requestBodyContent, aValidProperties);
        utils.checkInvalidProperties(requestBodyContent, aValidProperties);
        const genericSyntaxValidator = new GenericSyntaxValidator();
        requestBodyContent.ENTITY = genericSyntaxValidator.validateValue(requestBodyContent.ENTITY, "String", null, true);
        requestBodyContent.ENTITY_TYPE = genericSyntaxValidator.validateValue(requestBodyContent.ENTITY_TYPE, "String", null, true);
        const aValidEntityTypes = ["USER", "CUSTOMER", "VENDOR"];
        if (!aValidEntityTypes.includes(requestBodyContent.ENTITY_TYPE.toUpperCase())) {
            propagateError("Entity type is invalid.");
        }
        return requestBodyContent;
    }

    this.validate = function validate(oRequest) {
        switch (oRequest.method) {
            case $.net.http.DEL:
                return validateDeleteRequest(oRequest);
            case $.net.http.POST:
                return validatePostRequest(oRequest);
            default: {
                const sClientMsg = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
                $.trace.error(sClientMsg);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
            }
        }
    };
}
DataProtectionValidator.prototype = Object.create(DataProtectionValidator.prototype);
DataProtectionValidator.prototype.constructor = DataProtectionValidator;
