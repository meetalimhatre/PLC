const tenantUtil = require("../../ops/util/tenantUtil-cf");

function checkAvailability($, oRequest, oResponse) {
    oResponse.contentType = "application/json";

    // privilege checks
    if (!$.session.hasAppPrivilege("CFAdmR")) {
        oResponse.status = $.net.http.FORBIDDEN;
        return;
    }

    const oTenantDBClients = tenantUtil.getAllProvisionedTenantDBClients();
    const aDBClients = oTenantDBClients.clients;
    if (aDBClients.length === 0 ) {
        oResponse.status = $.net.http.OK;
        return oResponse.setBody(JSON.stringify({
            message: oTenantDBClients.message
        }));
    }
    
    const aDisconnectedTenants = [];
    aDBClients.forEach(function({ tenantId, tenantName, client }) {
        try {
            if ("X" !== client.executeQuery(`SELECT * FROM DUMMY`)[0].DUMMY) {
                aDisconnectedTenants.push({
                    tenantId: tenantId,
                    tenantName: tenantName,
                    error: `${tenantId} DB availability check err: DUMMY not equal to X` 
                });
            }
        } catch(e) {
            aDisconnectedTenants.push({
                tenantId: tenantId,
                tenantName: tenantName,
                error: e.message
            });
        } finally {
            client && client.close();
        }
    });
    if (aDisconnectedTenants.length > 0) {
        console.log({
            message: "Connection to some tenant HDI container failed",
            disconnectedTenants: aDisconnectedTenants
        })
        oResponse.status = $.net.http.INTERNAL_SERVER_ERROR;
        return oResponse.setBody(JSON.stringify({
            errorCode: "DB_FAILURE_ERROR",
            errorMessage: "Database access error happens.",
            disconnectedTenants: aDisconnectedTenants.map((oItem) => {
                return {
                    tenantId: oItem.tenantId,
                    tenantName: oItem.tenantName
                };
            })
        }))
    }
    oResponse.status = $.net.http.OK
    oResponse.setBody(JSON.stringify({
        message: "Success. Could connect to all tenant HDI containers"
    }));
}

module.exports = {
    checkAvailability
};
