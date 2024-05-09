//const testUtil = require("../../../utils/testUtil.js");
if (/*testUtil.isCloud()*/true) { // can also be run under XSA
    const tenantQuery = require("../../../../lib/xs/ops/util/tenantQuery-cf");

    describe('xs.ops.tenantQuery-tests', function () {
        const credentials = {
            host: 'TEST_HOST',
            port: '30015',
            driver: 'com.sap.db.jdbc.Driver',
            url: 'jdbc:sap://zeus.hana.validation.eu-central-1.whitney.dbaas.ondemand.com:22999?encrypt=true&validateCertificate=true&currentschema=B88738D9184D433DAC2C3E89599B624B',
            schema: 'TEST_SCHEMA',
            hdi_user: 'TEST_HDI_USER',
            hdi_password: 'TEST_HDI_PASSWORD',
            user: 'TEST_HDI_USER',
            password: 'TEST_HDI_PASSWORD',
            certificate: "certificate"
        };

        const expectedCredentials = {
            port: "30015",
            host: "TEST_HOST",
            user: "TEST_HDI_USER",
            password: "TEST_HDI_PASSWORD",
            schema: "TEST_SCHEMA",
            cert: "certificate",
        };

        const oTenantQuery = tenantQuery.tenantQuery(credentials);

        const insertData = ["'3001'", "'2809'", "'1'", "'0'", "'0'","'2018-09-19T09:28:38.111Z'", "'123456'", "'2018-09-19T09:28:38.111Z'", "'123456'"];
        const oItemTableName = "sap.plc.db::basis.t_item";
        const sqlDeleteStatement = `Delete from "${oItemTableName}"`;
        const sqlUpdateStatement = `INSERT INTO "${oItemTableName}" (ITEM_ID, CALCULATION_VERSION_ID, IS_ACTIVE, ITEM_CATEGORY_ID,CHILD_ITEM_CATEGORY_ID, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY) 
                            VALUES (${insertData.join(",")})`;
        const sqlQueryStatement = `Select "ITEM_ID" from "${oItemTableName}"`;

        beforeEach(function () {
            jasmine.dbConnection.executeUpdate(sqlDeleteStatement);
        });


        afterEach(function () {
        });


        it("getSchema should return right schema", function () {
            var schema = oTenantQuery.getSchema();

            expect(schema).toBe(expectedCredentials.schema);
        });

        it("getCredentials should return input credentials", function () {
            var oCredentials = oTenantQuery.getCredentials();

            expect(oCredentials.host).toBe(expectedCredentials.host);
            expect(oCredentials.port).toBe(expectedCredentials.port);
            expect(oCredentials.user).toBe(expectedCredentials.user);
            expect(oCredentials.password).toBe(expectedCredentials.password);
        });

        it("getHDICredentials should return input credentials", function () {
            var oHDICredentials = oTenantQuery.getHDICredentials();
            expect(oHDICredentials.host).toBe(expectedCredentials.host);
            expect(oHDICredentials.port).toBe(expectedCredentials.port);
            expect(oHDICredentials.user).toBe(expectedCredentials.user);
            expect(oHDICredentials.password).toBe(expectedCredentials.password);
            expect(oHDICredentials.ca).toBe(expectedCredentials.cert);
        });

        it("validateAndGetParameters should return right parameters", function () {
            var sqlStatement1 = `SELECT COUNT(*) as ITEMCOUNT FROM  "sap.plc.db::basis.t_item" where ITEM_ID=? and STATUS=?`;
            var validatedParameter1 = oTenantQuery.validateAndGetParameters(sqlStatement1, 1, 2);
            var expectedParamter1 = [1, 2];
            expect(validatedParameter1).toEqual(expectedParamter1);
            var validatedParameter1Error = oTenantQuery.validateAndGetParameters(sqlStatement1, 1);
            expect(validatedParameter1Error).toBe(null);

            var sqlStatement2 = `INSERT INTO  "sap.plc.db::basis.t_item" values(?, ?)`;
            var validatedParameter2 = oTenantQuery.validateAndGetParameters(sqlStatement2, [[1, 'one'], [2, 'two'], [3, 'three']]);
            var expectedParamter2 = [[1, 'one'], [2, 'two'], [3, 'three']];
            expect(validatedParameter2).toEqual(expectedParamter2);

            var sqlStatement3 = `INSERT INTO  "sap.plc.db::basis.t_item" values(?, ?)`;
            var validatedParameter3 = oTenantQuery.validateAndGetParameters(sqlStatement3, [[1], [2, 'two'], [3, 'three']]);
            expect(validatedParameter3).toBe(null);

            var validatedParameter4 = oTenantQuery.validateAndGetParameters(sqlStatement3);
            expect(validatedParameter4).toBe(null);


            var expectDate1 = '2018-03-03 08:00:00.000';
            var expectDate2 = '2018-04-01 08:00:00.000';
            var hasDateTypeParameter = oTenantQuery.validateAndGetParameters(sqlStatement3, new Date("2018-03-03 08:00:00"), new Date("2018-04-01 08:00:00"));
            expect(hasDateTypeParameter.length).toBe(2);
            expect(hasDateTypeParameter[0]).toBe(expectDate1);
            expect(hasDateTypeParameter[1]).toBe(expectDate2);
        });

        it("executeQuery should return right result", function () {
            var oConnection = {
                executeQuery: jasmine.dbConnection.executeQuery,
                exec: {},
                prepare: {}
            };

            var oStatement = {
                exec: {}
            };

            oTenantQuery.getConnection = function () { return oConnection; };
            spyOn(oConnection, "exec").and.callFake(function (sqlStatement, callback) {
                var result = jasmine.dbConnection.executeQuery(sqlStatement);
                callback(null, result);
            });

            jasmine.dbConnection.executeUpdate(sqlUpdateStatement);
            var expectedData = 3001;
            var queryResult1 = oTenantQuery.executeQuery(sqlQueryStatement);
            expect(queryResult1[0]["ITEM_ID"]).toBe(expectedData);

            var sqlQueryStatementWithParameter = null;

            spyOn(oConnection, "prepare").and.callFake(function (sqlStatement, callback) {
                callback(null, oStatement);
            });

            spyOn(oStatement, "exec").and.callFake(function (parameters, callback) {
                var result = [{ "ITEM_ID": 3001 }];
                callback(null, result);
            });

            sqlQueryStatementWithParameter = `Select "ITEM_ID" from "${oItemTableName}" where CALCULATION_VERSION_ID=?`;
            var queryResult2 = oTenantQuery.executeQuery(sqlQueryStatementWithParameter, "2809");
            expect(queryResult2[0]["ITEM_ID"]).toBe(expectedData);

            sqlQueryStatementWithParameter = `Select "ITEM_ID" from "${oItemTableName}" where CALCULATION_VERSION_ID=? AND IS_ACTIVE=?`;
            var queryResult3 = oTenantQuery.executeQuery(sqlQueryStatementWithParameter, "2809", "1");
            expect(queryResult3[0]["ITEM_ID"]).toBe(expectedData);

        });

        it("executeUpdate should return right result", function () {
            var oConnection = {
                executeQuery: jasmine.dbConnection.executeQuery,
                exec: {},
                prepare: {}
            };

            var oStatement = {
                exec: {}
            };

            oTenantQuery.getConnection = function () { return oConnection; };
            spyOn(oConnection, "exec").and.callFake(function (sqlStatement, callback) {
                var result = jasmine.dbConnection.executeUpdate(sqlStatement);
                callback(null, result);
            });

            var expectedData = 1;
            var updateResult1 = oTenantQuery.executeUpdate(sqlUpdateStatement);
            expect(updateResult1).toBe(expectedData);

            var sqlUpdateStatementWithParameter = null;

            spyOn(oConnection, "prepare").and.callFake(function (sqlStatement, callback) {
                callback(null, oStatement);
            });

            spyOn(oStatement, "exec").and.callFake(function (parameters, callback) {
                var result = 1;
                callback(null, result);
            });

            sqlUpdateStatementWithParameter = `UPDATE "${oItemTableName}" SET ITEM_ID=? WHERE CALCULATION_VERSION_ID=?`;
            var updateResult2 = oTenantQuery.executeQuery(sqlUpdateStatementWithParameter, "2810", "2809");
            expect(updateResult2).toBe(expectedData);

        });

    }).addTags(["All_Unit_Tests"]);
}