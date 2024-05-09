const testUtil = require("../../../utils/testUtil.js");
if (testUtil.isCloud()) {

    const tenantUtil = require("../../../../lib/xs/ops/util/tenantUtil-cf");
    const licenseMetering = require("../../../../lib/xs/ops/lib/license-metering-cf");
    const ResponseObjectStub = require("../../../testtools/responseObjectStub").ResponseObjectStub;

    describe('xs.ops.license-metering-cf-integrationtests', function () {

        const oRequest = {
            headers: {
                get: () => {}
            }
        };
        let oResponseStub = null;

        beforeEach(function () {
            oResponseStub = new ResponseObjectStub();
        });

        it("should return $.net.http.OK because no provisioned tenant", () => {
            const oTenantDBClients = {
                message: 'no provisioned tenant',
                clients: []
            };
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue(oTenantDBClients);
            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            expect(oResponseStub.status).toBe(200);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody).toEqual({
                message: oTenantDBClients.message,
            });
        });

        it("should return $.net.http.OK when send data success", function () {
            spyOn(licenseMetering, "sendUsageData").and.returnValue(
                {
                    "statusCode": 200
                }
            );

            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            expect(oResponseStub.status).toBe(200);
        });

        it("should return $.net.http.INTERNAL_SERVER_ERROR when send data fail", function () {
            spyOn(licenseMetering, "sendUsageData").and.returnValue(
                {
                    "statusCode": 500,
                    "body": {
                        "error": "unexpected error"
                    }
                }
            );

            licenseMetering.collectUsageData($, oRequest, oResponseStub);
            expect(oResponseStub.status).toBe(500);

        });

    }).addTags(["All_Unit_Tests"]);
}