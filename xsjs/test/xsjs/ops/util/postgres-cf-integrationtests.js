// These unit test cases run only on cloud foundry environment
// If these test cases run locally, config the postgres env first 
const oXsEnv = require("@sap/xsenv");
const { isCloud } = require("../../../utils/testUtil");

if (jasmine.plcTestRunParameters.mode === 'all' && isCloud()) {
    describe('xs.ops.util.postgres', function () {
        const oPostgresConfig = oXsEnv.cfServiceCredentials({ label: 'postgresql-db' });
        const fClientGen = require("../../../../lib/xs/ops/util/postgres-cf").postgres;
        const sTestSchema = "sap_test_plc";
        const sTestTable = "t_test_database";
        let oPostgres = null;
        const oTestData = {
            GLOBAL_ACCOUNT_ID: 'globalAccountId1',
            SUBACCOUNT_ID: 'subAccountId1',
            SUBDOMAIN: 'subdomain1',
            DATABASE_ID: 'databaseId1',
            HDI_CONTAINER_ID: 'hdiContainerId1',
            STATE: 'created',
        }

        const sInsertSql =
            `INSERT INTO ${sTestSchema}.${sTestTable} ("GLOBAL_ACCOUNT_ID", "SUBACCOUNT_ID", "SUBDOMAIN", "DATABASE_ID", "HDI_CONTAINER_ID", "STATE", "CREATED_ON", "LAST_MODIFIED_ON")
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
        const sQuerySql = `select "GLOBAL_ACCOUNT_ID", "SUBACCOUNT_ID", "SUBDOMAIN", "DATABASE_ID", "HDI_CONTAINER_ID", "STATE"
            from ${sTestSchema}.${sTestTable} where "GLOBAL_ACCOUNT_ID" = $1 and "SUBACCOUNT_ID" = $2`;

        const aInsertValues = [
            oTestData.GLOBAL_ACCOUNT_ID,
            oTestData.SUBACCOUNT_ID,
            oTestData.SUBDOMAIN,
            oTestData.DATABASE_ID,
            oTestData.HDI_CONTAINER_ID,
            oTestData.STATE
        ];

        const aQueryValues = [
            oTestData.GLOBAL_ACCOUNT_ID,
            oTestData.SUBACCOUNT_ID
        ];

        function createTestSchema(oClient) {
            const sSql = `CREATE SCHEMA IF NOT EXISTS ${sTestSchema}`;
            oClient.executeUpdate(sSql);
        }

        function createTestTable(oClient) {
            const sSql = `CREATE TABLE IF NOT EXISTS ${sTestSchema}.${sTestTable} (
                "GLOBAL_ACCOUNT_ID" character varying(36) NOT NULL,
                "SUBACCOUNT_ID" character varying(36) NOT NULL,
                "SUBDOMAIN" character varying(50) NOT NULL,
                "DATABASE_ID" character varying(36) NOT NULL,
                "HDI_CONTAINER_ID" character varying(36),
                "STATE" character varying(20) NOT NULL,
                "CREATED_ON" timestamp without time zone,
                "LAST_MODIFIED_ON" timestamp without time zone,
                CONSTRAINT t_database_pkey PRIMARY KEY ("GLOBAL_ACCOUNT_ID", "SUBACCOUNT_ID")
            )`;
            oClient.executeUpdate(sSql);
        }

        function dropTestSchema(oClient) {
            const sSql = `DROP SCHEMA IF EXISTS ${sTestSchema} CASCADE`;
            oClient.executeUpdate(sSql);
        }

        function dropTestTable(oClient) {
            const sSql = `DROP TABLE IF EXISTS ${sTestTable}`;
            oClient.executeUpdate(sSql);
        }
        
        beforeOnce(function() {
            oPostgres = fClientGen(oPostgresConfig, true);
            createTestSchema(oPostgres);
            createTestTable(oPostgres);
            oPostgres.close();
		});

		afterOnce(function() {
            oPostgres = fClientGen(oPostgresConfig, true);
            dropTestTable(oPostgres);
            dropTestSchema(oPostgres);
            oPostgres.close();
		});

        beforeEach(function () {
            oPostgres = fClientGen(oPostgresConfig, false);
        });

        afterEach(function () {
            oPostgres.close();
        });

        it("shoud executeUpdate success", function () {
            oPostgres.executeUpdate(sInsertSql, aInsertValues);
            const aResult = oPostgres.executeQuery(sQuerySql, aQueryValues);
            expect(aResult.length).toEqual(1);
            expect(aResult[0]).toEqual(oTestData);
        });

        it("should rollback success", function () {
            oPostgres.executeUpdate(sInsertSql, aInsertValues);
            oPostgres.rollback();
            const aResult = oPostgres.executeQuery(sQuerySql, aQueryValues);
            expect(aResult.length).toEqual(0);
        });

    }).addTags(["All_Unit_Tests"]);
}