var hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
const exceptionsLib = $.require("../../../lib/xs/xslib/exceptions");
const DatabaseException = exceptionsLib.DatabaseException;
const InvalidRequestException = exceptionsLib.InvalidRequestException;


function handleRequest(oRequest, oResponse, sSessionId, sUserId) {
	switch (oRequest.method) {
		case $.net.http.GET:
			return handleGetRequest(oRequest, oResponse, sSessionId, sUserId);
		default:
			throw new InvalidRequestException("method not allowed", $.net.http.METHOD_NOT_ALLOWED);
	}

    function handleGetRequest() {

    	// get and validate given user id
    	var sAppUserId = oRequest.queryPath;
        if (sAppUserId === undefined || sAppUserId === null || sAppUserId === "") {
        	sAppUserId = sUserId;
        }

        // ======================================================
        // prepare cleanup procedure call
        // ======================================================
        var hQuery = hQueryLib.hQuery($.hdb.getConnection());
        try {
            var oCloseCalculationVersion = hQuery.procedure("sap.plc_test.testtools.ResetSessionHelper::p_sessions_reset");
            oCloseCalculationVersion.execute({
                "APPLICATIONUSERID": sAppUserId
            });
            oResponse.setBody("Reset of sessions successful.");
        } catch (e) {
            throw new DatabaseException(e.message);
        }

        // ======================================================
        // commit transaction
        // ======================================================
        hQuery.getConnection().commit();
    }


    //senseless return, however needed because JSLint does recognize the inner function as potential branch :'(
    return undefined;
}
