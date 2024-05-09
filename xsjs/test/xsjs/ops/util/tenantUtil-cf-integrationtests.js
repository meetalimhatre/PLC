const testUtil = require("../../../utils/testUtil.js");
if (testUtil.isCloud()) {
    const tenantUtil = require("../../../../lib/xs/ops/util/tenantUtil-cf");

    const oXsEnv = require("@sap/xsenv");
    const fClientGen = require("../../../../lib/xs/ops/util/postgres-cf").postgres;
    const oPostgresConfig = oXsEnv.cfServiceCredentials({ label: 'postgresql-db' });

    describe('xs.ops.util.tenantUtil-cf-integrationtests', function () {
        const sTestTable = "t_tenant";
        

        it("getProvisionedTenants should return right data", function() {

            const sInsertSql1 =`INSERT INTO ${sTestTable} ("global_account_id", "sub_account_id", "sub_domain", "database_id", "hdi_container_id", "state", "created_on", "last_modified_on")
            VALUES ('test1', 'testsub1', 'test3', '$4', '$5', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
            const sInsertSql2 =`INSERT INTO ${sTestTable} ("global_account_id", "sub_account_id", "sub_domain", "database_id", "hdi_container_id", "state", "created_on", "last_modified_on")
            VALUES ('test2', 'testsub2', '$3', '$4', '$5', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
            const sInsertSql3 =`INSERT INTO ${sTestTable} ("global_account_id", "sub_account_id", "sub_domain", "database_id", "hdi_container_id", "state", "created_on", "last_modified_on")
            VALUES ('test3', 'testsub3', 'testdomain', '$4', '$5', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

            const sDeleteSql = `DELETE FROM ${sTestTable}`;

            let oPostgres = fClientGen(oPostgresConfig, false);
            spyOn(tenantUtil, "getConnection").and.returnValue(oPostgres);
            oPostgres.executeUpdate(sDeleteSql);
            oPostgres.executeQuery(sInsertSql1);
            oPostgres.executeQuery(sInsertSql2);
            oPostgres.executeQuery(sInsertSql3);
            var oResult = tenantUtil.getProvisionedTenants();
            expect(oResult.length).toEqual(2);
            expect(oResult[0].sub_account_id).toEqual("testsub1");
            expect(oResult[1].sub_account_id).toEqual("testsub2");
            expect(oResult[0].sub_domain).toEqual("test3");
            expect(oResult[1].sub_domain).toEqual("$3");

        });

    }).addTags(["All_Unit_Tests"]);
}