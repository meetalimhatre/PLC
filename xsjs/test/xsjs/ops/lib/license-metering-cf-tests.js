const testUtil = require("../../../utils/testUtil.js");

    const licenseMetering = require("../../../../lib/xs/ops/lib/license-metering-cf");
    const tenantUtil = require("../../../../lib/xs/ops/util/tenantUtil-cf");
    const testData = require("../test-config");
    const ResponseObjectStub = require("../../../testtools/responseObjectStub").ResponseObjectStub;
    const oTestData = require("../../../testdata/testdata").data;
    const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;


    describe('xs.ops.license-metering-cf-tests', function () {
    let oMockstar = null;
    const dSubscriptionDate = new Date('2011/10/10');

    let  oUserActivity={
		"USER_ID" : ["User1", "User2", "User3"],
        "LAST_ACTIVITY_TIME" : ["2015-01-20T20:00:00.000Z", "2016-12-20T15:40:00.000Z","2016-12-20T15:40:00.000Z"]
		}

        beforeOnce(() => {
            oMockstar = new MockstarFacade({
                schema: "SAP_PLC",
                substituteTables: {
                    user_activity: {
                        name: "sap.plc.db::basis.t_user_activity",
                        data: oUserActivity
                    },
                },
            });
        });
        
        const oRequest = {
            headers: {
                get: () => {}
            }
        };
        let oResponseStub = null;

        beforeEach(function () {
            spyOn(licenseMetering, "getCFEnv").and.returnValue(testData.appEnv);

            spyOn(licenseMetering, "getAuthorizationToken").and.returnValue(
                {
                    access_token: "dummy"
                }
            );
            oResponseStub = new ResponseObjectStub();
            oMockstar.initializeData();
        });

        it("getUserCount function should return right number of active users during previous month", function () {
            //arrange
            const sCurrentDate = new Date();
            const sPreviousMonthDate = new Date(sCurrentDate.setMonth(sCurrentDate.getMonth() - 1));
            const sLastDayPreviousMonth  = new Date(sPreviousMonthDate.getFullYear(), sPreviousMonthDate.getMonth()+1, 0); 
            oMockstar.execSingle(`insert into {{user_activity}} values('User_PreviousMonth1','${sLastDayPreviousMonth.toISOString()}')`);           
            oMockstar.execSingle(`insert into {{user_activity}} values('User_PreviousMonth2','${sLastDayPreviousMonth.toISOString()}')`); 
            oMockstar.execSingle(`insert into {{user_activity}} values('User_PreviousMonth3','${sLastDayPreviousMonth.toISOString()}')`);
            oMockstar.execSingle(`insert into {{user_activity}} values('User_PreviousMonth4@sap.com','${sLastDayPreviousMonth.toISOString()}')`);
            //act
            var result = licenseMetering.getTenantUserCount(jasmine.dbConnection);
            //assert
            expect(JSON.stringify(result)).toEqual('3');
        });

        it("getUserCount function should delete users with data older than 3 years", function () {
            //arrange
            const sCurrentDate = new Date();
            const sPreviousMonthDate = new Date(sCurrentDate.setMonth(sCurrentDate.getMonth() - 1));
            oMockstar.execSingle(`insert into {{user_activity}} values('User_PreviousMonth1','${sPreviousMonthDate.toISOString()}')`);
            const iCountUsersBegining = oMockstar.execQuery(`select count(*) as rowcount from {{user_activity}}`);               
            //act
            let result = licenseMetering.getTenantUserCount(jasmine.dbConnection);
            const iCountUsersEnd = oMockstar.execQuery(`select count(*) as rowcount from {{user_activity}}`);
            //assert
            expect(JSON.stringify(result)).toEqual('1');
            expect(iCountUsersEnd.columns.ROWCOUNT.rows[0]).not.toEqual(iCountUsersBegining.columns.ROWCOUNT.rows[0]);
            expect(iCountUsersBegining.columns.ROWCOUNT.rows[0]).toEqual(4);
        });

        it("send usage data success - one tenant", function () {
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue({
                message: "",
                clients: [{tenantId: "testTenantId", tenantName: "testTenantName",subscriptionDate: dSubscriptionDate, client: jasmine.dbConnection}]
            });
            spyOn(licenseMetering, "sendUsageData").and.returnValue(
                {
                    "statusCode": 200
                }
            );

            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseStub.status).toBe(200);
            expect(oResponseBody).toEqual({
                message: "all tenants usage data sent successfully"
            });

        });

        it("send usage data success - more tenants", function () {
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue({
                message: "",
                clients: [{tenantId: "testTenantId", tenantName: "testTenantName",subscriptionDate: dSubscriptionDate, client: jasmine.dbConnection},{tenantId: "testTenantId1", tenantName: "testTenantName1",subscriptionDate: dSubscriptionDate, client: jasmine.dbConnection}]
            });
            spyOn(licenseMetering, "sendUsageData").and.returnValue(
                {
                    "statusCode": 200
                }
            );

            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseStub.status).toBe(200);
            expect(oResponseBody).toEqual({
                message: "all tenants usage data sent successfully"
            });

        });

        it("send usage data fail - one tenant", function () {
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue({
                message: "",
                clients: [{tenantId: "testTenantId", tenantName: "testTenantName",subscriptionDate: dSubscriptionDate, client: jasmine.dbConnection}]
            });
            spyOn(licenseMetering, "sendUsageData").and.returnValue(
                {
                    "statusCode": 500,
                    "body":{
                        "error": "unexpected error"
                    }
                }
            );

            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseStub.status).toBe(500);
            expect(oResponseBody).toEqual({
                err_message: 'some tenants usage data sent failed ',
                failedTenants:
                    [{
                        tenantId: 'testTenantId',
                        tenantName: 'testTenantName',
                        message: 'Error meesage from submit usage API: unexpected error',
                        statusCode: 500
                    }]
            });

        });

        it("send usage data fail - more tenants", function () {
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue({
                message: "",
                clients: [{tenantId: "testTenantId", tenantName: "testTenantName",subscriptionDate: dSubscriptionDate, client: jasmine.dbConnection}, {tenantId: "testTenantId1", tenantName: "testTenantName1",subscriptionDate: dSubscriptionDate, client: jasmine.dbConnection}]
            });
            spyOn(licenseMetering, "sendUsageData").and.returnValue(
                {
                    "statusCode": 500,
                    "body":{
                        "error": "unexpected error"
                    }
                }
            );

            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseStub.status).toBe(500);
            expect(oResponseBody).toEqual({
                err_message: 'some tenants usage data sent failed ',
                failedTenants:
                    [{
                        tenantId: 'testTenantId',
                        tenantName: 'testTenantName',
                        message: 'Error meesage from submit usage API: unexpected error',
                        statusCode: 500
                    },
                    {
                        tenantId: 'testTenantId1',
                        tenantName: 'testTenantName1',
                        message: 'Error meesage from submit usage API: unexpected error',
                        statusCode: 500
                    }]
            });
        });

        it("should return right result when one client is null", function () {
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue({
                message: "",
                clients: [{tenantId: "testTenantId", tenantName: "testTenantName",subscriptionDate: dSubscriptionDate, client: jasmine.dbConnection},{tenantId: "testTenantId1", tenantName: "testTenantName1",subscriptionDate: dSubscriptionDate, client: null}]
            });
            spyOn(licenseMetering, "sendUsageData").and.returnValue(
                {
                    "statusCode": 500,
                    "body":{
                        "error": "unexpected error"
                    }
                }
            );

            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseStub.status).toBe(500);
            expect(oResponseBody).toEqual({
                err_message: 'some tenants usage data sent failed ',
                failedTenants:
                    [{
                        tenantId: 'testTenantId',
                        tenantName: 'testTenantName',
                        message: 'Error meesage from submit usage API: unexpected error',
                        statusCode: 500
                    }]
            });

        });

        it("should return right result when get user count is null", function () {
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue({
                message: "",
                clients: [{tenantId: "testTenantId", tenantName: "testTenantName", client: jasmine.dbConnection}]
            });
            spyOn(licenseMetering, "getTenantUserCount").and.returnValue(null);
            spyOn(licenseMetering, "sendUsageData").and.returnValue(
                {
                    "statusCode": 500,
                    "body":{
                        "error": "unexpected error"
                    }
                }
            );

            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseStub.status).toBe(500);
            expect(oResponseBody).toEqual({
                err_message: 'some tenants usage data sent failed ',
                failedTenants:
                    [{
                        tenantId: 'testTenantId',
                        tenantName: 'testTenantName',
                        message: 'can not get the user count from tenant DB'
                    }]
            });

        });

    }).addTags(["All_Unit_Tests"]);
