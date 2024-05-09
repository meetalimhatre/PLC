var plcTestrunner = $.import("testtools.testrunner", "testrunner").PLCTestRunner;
var DbArtefactController = $.require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;

var oConnection = $.hdb.getConnection({"treatDateAsUTC" : true});
var oConnectionFactory = new ($.require("../../../lib/xs/db/connection/connection")).ConnectionFactory($);
var oController = new DbArtefactController($, oConnectionFactory.getConnection());

var testrunner = new plcTestrunner($.request, $.response, oController, oConnection);
testrunner.cleanUp();
