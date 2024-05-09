// This is a helper script to initialize PLC and generate dynamic DB artefacts.
// It should be called by developers after any change to templates or metadata (e.g., after git pull)

var Connection = new ($.require("../../../lib/xs/db/connection/connection")).ConnectionFactory($);
var DbArtefactController = $.require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;
var Persistency = $.import("xs.db", "persistency").Persistency;
var Constants = $.require("../../../lib/xs/util/constants");

var dbConnection = Connection.getConnection();

var sOutput = "";
var bHadException = false;

try {
    var oPersistency = new Persistency(dbConnection);
	var sDuVersionId = oPersistency.ApplicationManagement.getApplicationVersion(Constants.DeliveryUnitName.PlcDeliverUnitName);
	
	var oController = new DbArtefactController($, dbConnection);
	oController.createExtensionTable('Item');
	
	// generate all DB artefacts
	oController.createDeleteAndGenerate();
	// generate all Analytic Views
	oController.generateAllFiles();
	
	//write back successful system initialization
	oPersistency.ApplicationManagement.writePlcInitializationState(sDuVersionId);
} catch (e) {
	sOutput += "\nException: " + e + "\nSQL error code: " + e.code;
	bHadException = true;
}

if (!bHadException) {
	dbConnection.commit();
	sOutput += '\n\nGeneration was successful.\n';
}

$.response.setBody(sOutput);
$.response.contentType = "text/plain";
