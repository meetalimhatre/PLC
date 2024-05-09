module.exports.Ping = function($) {

/**
 * Method calls Persistency which in turn executes a select on the DUMMY table. This is done as a ping
 * database round trip test, through XS, the RequestWrapper, the Persistency and the indexserver.
 * 
 * @returns HTTP 200 OK in case of success, otherwise HTTP 500 Internal Server Error
 */
this.get = function (oBodyData, aParameters, oServiceOutput, oPersistency) {
	oServiceOutput.setStatus($.net.http.INTERNAL_SERVER_ERROR);

	try {
		if ("X" == oPersistency.Misc.ping()[0].DUMMY) {
			oServiceOutput.setStatus($.net.http.OK);
		}
	}
	catch (e) {
		// Do nothing
	}

	return oServiceOutput;
}

}; // end of module.exports