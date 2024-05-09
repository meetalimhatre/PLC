var plcCFFLoader = $.import("testtools.testrunner", "cffloader").PLCCFFLoader;
var DbArtefactController = $.require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;

var oConnection = $.hdb.getConnection({"treatDateAsUTC" : true});
var oConnectionFactory = new ($.require("../../../lib/xs/db/connection/connection")).ConnectionFactory($);
var oController = new DbArtefactController($, oConnectionFactory.getConnection());

var CFFLoader = new plcCFFLoader($.request, $.response, oController, oConnection);
$.getPlcUsername = () => ($.session.getUsername() || 'TECHNICAL_USER');
CFFLoader.setup();
