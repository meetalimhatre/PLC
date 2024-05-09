const testUtil = require("../../../utils/testUtil.js");
if (testUtil.isCloud()) {
    const tenantUtil = require("../../../../lib/xs/ops/util/tenantUtil-cf");
    const tenantQuery = require("../../../../lib/xs/ops/util/tenantQuery-cf");

    describe('xs.ops.util.tenantUtil-cf-tests', function () {
        const sTestTable = "t_tenant";

        it("no provisioned tenant", function () {
            spyOn(tenantUtil, "getProvisionedTenants").and.returnValue([]);

            var oResult = tenantUtil.getAllProvisionedTenantDBClients();
            expect(oResult.clients.length).toEqual(0);
            expect(oResult.message).toEqual("no provisioned tenant");
        });

        it("should return right tenant clients", function () {
            spyOn(tenantUtil, "getProvisionedTenants").and.returnValue([{
                "sub_account_id": "testTenant1",
                "global_account_id": "testGlobalAccount",
                "sub_domain": "testSubDomain1",
                "database_id": "testDBID",
                "hdi_container_id": "testContainerID",
                "state": 3,
                "created_on": "testDate",
                "last_modified_on": "testDate"
            },{
                "sub_account_id": "testTenant2",
                "global_account_id": "testGlobalAccount",
                "sub_domain": "testSubDomain2",
                "database_id": "testDBID",
                "hdi_container_id": "testContainerID",
                "state": 3,
                "created_on": "testDate",
                "last_modified_on": "testDate"
            }]);
            spyOn(tenantUtil, "getAllTenantRelatedInfo").and.returnValue([{
                "tenant_id": "testTenant1",
                "credentials": "testCredentials"
            },{
                "tenant_id": "testTenant2",
                "credentials": "testCredentials"
            }]);

            spyOn(tenantQuery,"tenantQuery").and.returnValue("testClient");
            var oResult = tenantUtil.getAllProvisionedTenantDBClients();
            expect(oResult.clients.length).toEqual(2);
            expect(oResult.clients[0].tenantId).toEqual("testTenant1");
            expect(oResult.clients[0].tenantName).toEqual("testSubDomain1");
            expect(oResult.clients[0].client).toEqual("testClient");
            expect(oResult.clients[0].subscriptionDate).toEqual("testDate");
            expect(oResult.clients[1].tenantId).toEqual("testTenant2");
            expect(oResult.clients[1].tenantName).toEqual("testSubDomain2");
            expect(oResult.clients[1].client).toEqual("testClient");
            expect(oResult.clients[1].subscriptionDate).toEqual("testDate");
        });

        it("should have one hdi container not found", function () {
            spyOn(tenantUtil, "getProvisionedTenants").and.returnValue([{
                "sub_account_id": "testTenant1",
                "global_account_id": "testGlobalAccount",
                "sub_domain": "testSubDomain1",
                "database_id": "testDBID",
                "hdi_container_id": "testContainerID",
                "state": 3,
                "created_on": "testDate",
                "last_modified_on": "testDate"
            },{
                "sub_account_id": "testTenant2",
                "global_account_id": "testGlobalAccount",
                "sub_domain": "testSubDomain2",
                "database_id": "testDBID",
                "hdi_container_id": "testContainerID",
                "state": 3,
                "created_on": "testDate",
                "last_modified_on": "testDate"
            }]);
            spyOn(tenantUtil, "getAllTenantRelatedInfo").and.returnValue([{
                "tenant_id": "testTenant1",
                "credentials": "testCredentials"
            }]);
            spyOn(tenantQuery,"tenantQuery").and.returnValue("testClient");

            var oResult = tenantUtil.getAllProvisionedTenantDBClients();
            expect(oResult.clients.length).toEqual(2);
            expect(oResult.clients[0].tenantId).toEqual("testTenant1");
            expect(oResult.clients[0].tenantName).toEqual("testSubDomain1");
            expect(oResult.clients[0].client).toEqual("testClient");
            expect(oResult.clients[0].subscriptionDate).toEqual("testDate");
            expect(oResult.clients[1].tenantId).toEqual("testTenant2");
            expect(oResult.clients[1].tenantName).toEqual("testSubDomain2");
            expect(oResult.clients[1].client).toEqual(null);
            expect(oResult.clients[1].subscriptionDate).toEqual(null);
        });

    }).addTags(["All_Unit_Tests"]);
}