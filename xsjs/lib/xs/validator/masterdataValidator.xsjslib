const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;

function MasterdataValidator(oPersistency, oUtils) {
    this.validate = async function validate(oRequest) {
        async function validateGetRequest() {
            oUtils.checkEmptyBody(oRequest.body);
        }

        switch (oRequest.method) {
        case $.net.http.GET:
            return await validateGetRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    };
}
MasterdataValidator.prototype = Object.create(MasterdataValidator.prototype);
MasterdataValidator.prototype.constructor = MasterdataValidator;
export default {MessageLibrary,PlcException,MasterdataValidator};
