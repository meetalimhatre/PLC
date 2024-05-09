//
// This is a helper script to generate the analytic views with custom fields.
//
var Connection = new ($.require("../../lib/xs/db/connection/connection")).ConnectionFactory($);
var DbArtefactController = $.require("../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;

var dbConnection = Connection.getConnection();

var sOutput = "";
var bHadException = false;

try {
	var oController = new DbArtefactController($, dbConnection);

	// generate all Analytic Views
	oController.generateAllFiles();
} catch (e) {
	sOutput += "\nException: " + e;
	bHadException = true;
}

if (!bHadException) {
	dbConnection.commit();
	sOutput += '\n\nGeneration of analytic views with custom fields was successful.\n';
}

$.response.setBody(sOutput);
$.response.contentType = "text/plain";
