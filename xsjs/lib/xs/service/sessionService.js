const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const MessageCode = MessageLibrary.Code;
const PlcException = MessageLibrary.PlcException;

async function logError(msg) {
    await helpers.logError(msg);
}

/**
 * Checks if the session for current user is opened.
 */
/* exported checkSessionIsOpened */
module.exports.checkSessionIsOpened = async function (oPersistency, sSessionId, sUserId) {
    if (!oPersistency.Session.isSessionOpened(sSessionId, sUserId)) {
        const sClientMsg = 'Session does not exist.';
        const sServerMsg = `${ sClientMsg } Session ${ sSessionId } for user ${ sUserId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
    }
};
export default {helpers,MessageLibrary,MessageCode,PlcException,logError};
