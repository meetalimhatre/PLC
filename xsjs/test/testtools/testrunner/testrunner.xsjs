var plcTestrunner = $.import("testtools.testrunner", "testrunner").PLCTestRunner;
var DbArtefactController = $.require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;

//load the jasmine module globally
var module = $.import("sap.hana.testtools.unit.jasminexs.lib", "module");
module.install("sap.hana.testtools.unit.jasminexs.lib", "core2");
module.install("sap.hana.testtools.unit.jasminexs.lib.extensions", "all");

var oConnection = $.hdb.getConnection({"treatDateAsUTC" : true});
var oController = new DbArtefactController($, oConnection);

var testrunner = new plcTestrunner($.request, $.response, oController, oConnection);
testrunner.run();