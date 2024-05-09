
//This is a helper script to grant ADMINISTRATE instance-based privilege for existing projects to all PLC users.

const Connection = new ($.require("../../../lib/xs/db/connection/connection")).ConnectionFactory($);
const oConnection = Connection.getConnection();

var grantInstanceBasedPrivileges = $.import('xs.postinstall.release_2_1_0', '02_grant_instance_based_privileges');

function grantPrivileges(){

	var sOutput = "";
	var bHadException = false;

	try {
		grantInstanceBasedPrivileges.run(oConnection);
	} catch (e) {
		sOutput += "\n Exception: " + e;
		bHadException = true;
	}

	if (!bHadException) {
		oConnection.commit();
		sOutput += "\n\n Successfully granted ADMINISTRATE instance-based privilege for existing projects to all PLC users.";
	}

	return sOutput

}

if($.request.method === $.net.http.GET) {

	var sOutput = grantPrivileges();

	// send response
	$.response.contentType = "text/plain";
	$.response.setBody(sOutput);
	$.response.status = $.net.http.OK;
} else {
	// unsupported method
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
}
