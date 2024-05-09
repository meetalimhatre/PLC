var plcTestrunner = $.import("testtools.testrunner", "testrunner").PLCTestRunner;
var DbArtefactController = $.require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;

//load the jasmine module globally
var module = $.import("sap.hana.testtools.unit.jasminexs.lib", "module");
module.install("sap.hana.testtools.unit.jasminexs.lib", "core2");
module.install("sap.hana.testtools.unit.jasminexs.lib.extensions", "all");

var oConnection = $.hdb.getConnection({"treatDateAsUTC" : true});
var oConnectionFactory = new ($.require("../../../lib/xs/db/connection/connection")).ConnectionFactory($);
var oController = new DbArtefactController($, oConnectionFactory.getConnection());


var Reporter = $.import("sap.hana.testtools.unit.jasminexs.reporter2.db", "dbReporter").Reporter;
var oReporter = new Reporter();

var testrunner = new plcTestrunner($.request, $.response, oController, oConnection);
testrunner.prepare(oReporter);


