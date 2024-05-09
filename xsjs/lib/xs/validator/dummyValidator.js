const _ = require('lodash');
const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

async function logError(msg) {
    await helpers.logError(msg);
}

async function DummyValidator(aHttpMethods) {

    if (!_.isArray(aHttpMethods)) {
        const sLogMessage = 'aHttpMethods needs to be an array';
        await logError(sLogMessage);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
    }

    this.validate = async function (oRequest) {
        var oBody = null;
        if (oRequest.body !== undefined) {
            try {
                oBody = JSON.parse(oRequest.body.asString());
            } catch (e) {
                const sClientMsg = 'Cannot parse string to JSON.';
                const sServerMsg = `${ sClientMsg } Tried to parse: ${ oRequest.body.asString() }`;
                await logError(sServerMsg);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }
        }
        return oBody;
    };
}
DummyValidator.prototype =  Object.create(DummyValidator.prototype);
DummyValidator.prototype.constructor = DummyValidator;

module.exports.DummyValidator = DummyValidator;
export default {_,helpers,MessageLibrary,PlcException,Code,logError,DummyValidator};
