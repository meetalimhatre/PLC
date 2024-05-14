module.exports.Logout = function ($) {

    /**
	 * Method calls Persistency which in turn executes a delete on the session table.
	 * 
	 * @returns HTTP 200 OK in case of success, otherwise HTTP 500 Internal Server Error
	 */
    this.logout = async function (oBodyData, aParameters, oServiceOutput, oPersistency) {
        var sSessionId = $.getPlcUsername();
        var sUserId = $.getPlcUsername();

        var iDeletedSession = oPersistency.Session.deleteSession(sSessionId, sUserId);
        if (iDeletedSession === 0) {
            const sLogMessage = 'No session found!';
            $.trace.error(sLogMessage);
        }
        oPersistency.Session.deleteOutdatedEntries();
        return oServiceOutput;
    };

};
export default {};
