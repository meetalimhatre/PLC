let dbArtefactControllerLibrary = require("../../../lib/xs/db/generation/hdi-db-artefact-controller");
let DbArtefactController = dbArtefactControllerLibrary.DbArtefactController;
let oPersistency = null;
let oDbArtefactController = null;
let oHdiController = $.import("xs.preupgrade", "dispatch");
const Persistency = $.import("xs.db", "persistency").Persistency;

if (jasmine.plcTestRunParameters.mode === 'all') {
    describe('xsjs.preupgrade.hdi-controller-integrationtests', function () {

        beforeEach(function () {
            oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
            oPersistency = new Persistency(jasmine.dbConnection);
            oDbArtefactController.generateAllFiles();
            oDbArtefactController.commit();
        });

        afterEach(function () {
            oDbArtefactController.generateAllFiles();
            oDbArtefactController.commit();
        });

        function prepareRequest(sVersion) {      
            let oRequest = {
                queryPath: "prepareUpgrade",
                method: $.net.http.POST
            };
            return oRequest;
        }

        /**
         * Check if the given db artifact already exists in the database.
         */
        function doesArtifactExist(sFileName, sType) {
            let result = jasmine.dbConnection.executeQuery(`select * from ${sType}s where ${sType}_name=? and schema_name=CURRENT_SCHEMA`, sFileName);
            return result.length > 0;
        }

        it("should return ok when the dynamic db artifact was deleted", function () {
            // arrange
            let oRequest = prepareRequest();

            spyOn(oHdiController, "getConnection").and.returnValue(jasmine.dbConnection);
            // act
            let oResponse = {};
            oHdiController.run(oRequest, oResponse,{hasAppPrivilege:function () {
                return true;
            }});

            // assert
            expect(oResponse.status).toBe($.net.http.OK);

            let bExist = doesArtifactExist("sap.plc.analytics.viewsCF.base::v_bas_meas_component_split_cust", "view");
            expect(bExist).toBe(false);
            bExist = doesArtifactExist("sap.plc.db.calculationmanager.procedures::p_item_price_determination", "procedure");
            expect(bExist).toBe(false);
            bExist = doesArtifactExist("sap.plc.db.authorization.views::auth.V_GROUP_HIERARCHY", "view");
            expect(bExist).toBe(false);
            bExist = doesArtifactExist("sap.plc.analytics.viewsCF.base::TABLE_FUNCTION_v_bas_meas_component_split_cust", "function");
            expect(bExist).toBe(false);
        });

    }).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}