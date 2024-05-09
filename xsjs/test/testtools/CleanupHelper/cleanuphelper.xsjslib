const hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var trace = $.trace;
var traceHelper = $.import("xs.xslib", "traceHelper");
const exceptionsLib = $.require("../../../lib/xs/xslib/exceptions");
var DatabaseException = exceptionsLib.DatabaseException;
var InvalidRequestException = exceptionsLib.InvalidRequestException;

function handleRequest(oRequest, oResponse, sSessionId, sUserId) {

	switch (oRequest.method) {
	case $.net.http.GET:
		return handleGetRequest(oRequest, oResponse, sSessionId, sUserId);

	default:
		throw new InvalidRequestException("method not allowed", $.net.http.METHOD_NOT_ALLOWED);
	}

	function handleGetRequest() {

		
			// ======================================================
			// prepare cleanup procedure call
			// ======================================================
			try {
				var hQuery = hQueryLib.hQuery($.hdb.getConnection());

				var sResponseMessage;

				
					var oCleanup= hQuery
							.procedure("sap.plc_test.testtools.CleanupHelper::p_cleanup_invalid_entries");
					var result = oCleanup.execute();
									
					sResponseMessage = "Cleanup Succesful...hopefully";
								
				hQuery.getConnection().commit();
				oResponse.setBody(sResponseMessage);

			} catch (e) {
				throw new DatabaseException(e.message);
				oResponse.setBody("Cleanup failed \n"+e.message);
			}
		
	}
	// senseless return, however needed because JSLint does recognize the inner
	// function as potential branch :'(
	return undefined;

}
