const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const MessageCode = MessageLibrary.Code;
const PlcException = MessageLibrary.PlcException;

function logError(msg) {
    helpers.logError(msg);
}

/**
 * Checks if the session for current user is opened.
 */
/* exported checkSessionIsOpened */
module.exports.checkSessionIsOpened = function (oPersistency, sSessionId, sUserId) {
    if (!oPersistency.Session.isSessionOpened(sSessionId, sUserId)) {
        const sClientMsg = 'Session does not exist.';
        const sServerMsg = `${ sClientMsg } Session ${ sSessionId } for user ${ sUserId }.`;
        logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
    }
};
export default {helpers,MessageLibrary,MessageCode,PlcException,logError};
