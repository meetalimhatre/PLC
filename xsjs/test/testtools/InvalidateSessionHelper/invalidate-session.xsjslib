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
    	
    	var Tables = Object.freeze({
    		session : "sap.plc.db::basis.t_session",
    		appTimeOut : "sap.plc.db::basis.t_application_timeout"
    	});
    	
    	// get and validate given user id
    	var sAppUserId = oRequest.queryPath;
        if (sAppUserId === undefined || sAppUserId === null || sAppUserId === "") {
        	sAppUserId = sUserId;
        }

        // ======================================================
        // prepare invalidate session
        // ======================================================
        var hQuery = hQueryLib.hQuery($.hdb.getConnection());
        try {
        	var sUpdateStatement = 'update "' + Tables.session
			+ '" set LAST_ACTIVITY_TIME = add_seconds(LAST_ACTIVITY_TIME, (select 0 - VALUE_IN_SECONDS - 1 from "' 
			+ Tables.appTimeOut + '" where APPLICATION_TIMEOUT_ID = \'SessionTimeout\')) where SESSION_ID = ? ';
        	
        	var oCheckStatement = hQuery.statement(sUpdateStatement);
    		var aResults = oCheckStatement.execute(sAppUserId);
            oResponse.setBody("Invalidate of Session succeded.");
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
