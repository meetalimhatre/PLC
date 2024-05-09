// This test file only run in cf env

const { isCloud } = require("../../../utils/testUtil");

if(jasmine.plcTestRunParameters.mode === 'all' && isCloud()) {
    const ResponseObjectStub = require("../../../testtools/responseObjectStub").ResponseObjectStub;
    const checkAvailability = require("../../../../lib/xs/ops/lib/availabilityCheck-cf").checkAvailability;
    const tenantUtil = require("../../../../lib/xs/ops/util/tenantUtil-cf");

    describe('xs.ops.availabilityCheck-cf-integrationtests', () => {
        const oRequest = {
            headers: {
                get: () => {}
            }
        };
        let oResponseStub = null;
        beforeEach(() => {
            oResponseStub = new ResponseObjectStub();
        });

        it("should return $.net.http.OK because all tenant db connections are OK", () => {
            const oTenantDBClients = {
                clients: [{
                    tenantId: "tenantId1",
                    tenantName: "tenantName1",
                    client: jasmine.dbConnection
                }]
            };
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue(oTenantDBClients)
            checkAvailability($, oRequest, oResponseStub);
            expect(oResponseStub.status).toBe(200);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody).toEqual({
                message: "Success. Could connect to all tenant HDI containers",
            });
        });

        it("should return $.net.http.OK because no provisioned tenant", () => {
            const oTenantDBClients = {
                message: 'no provisioned tenant',
                clients: []
            };
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue(oTenantDBClients);
            checkAvailability($, oRequest, oResponseStub);
            expect(oResponseStub.status).toBe(200);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody).toEqual({
                message: oTenantDBClients.message,
            });
        });
        
        it("should return $.net.http.INTERNAL_SERVER_ERROR because there has tenant db connections disconnected", () => {            
            const oTenantDBClients = {
                message: 'success',
                clients: [
                    {
                        tenantId: "tenantId1",
                        tenantName: "tenantName1",
                        client: null
                    },
                    {
                        tenantId: "tenantId2",
                        tenantName: "tenantName2",
                        client: null
                    }
                ]
            };
            spyOn(tenantUtil, "getAllProvisionedTenantDBClients").and.returnValue(oTenantDBClients);
            checkAvailability($, oRequest, oResponseStub);
            expect(oResponseStub.status).toBe(500);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody).toEqual({
                errorCode: "DB_FAILURE_ERROR",
                errorMessage: "Database access error happens.",
                disconnectedTenants: [
                    {
                        tenantId: "tenantId1",
                        tenantName: "tenantName1"
                    },
                    {
                        tenantId: "tenantId2",
                        tenantName: "tenantName2"
                    }
                ]
            });
        })

    }).addTags(["All_Unit_Tests"]);
}