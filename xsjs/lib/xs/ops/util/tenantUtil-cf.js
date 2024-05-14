const oInstanceMananger = require('@sap/instance-manager');
const async = require('@sap/xsjs/node_modules/async');
const oXsEnv = require('@sap/xsenv');
const options = oXsEnv.getServices({ 'hana': { label: 'service-manager' } });
const postgres = require('./postgres-cf').postgres;
const oTenantQuery = require('./tenantQuery-cf');


module.exports = {
    getProvisionedTenants,
    updateTenantStatus,
    getConnection,
    getAllTenantRelatedInfo,
    getConnectionByTenantID,
    getAllProvisionedTenantDBClients
};


var tables = Object.freeze({ database: 't_tenant' });

/**
 * get all active tenant id which subscribe app
 * @returns {aTenants} array of provisioned tenants: 
 * [{sub_account_id, global_account_id, sub_domain, database_id, hdi_container_id, state, created_on, last_modified_on}]
 */
async function getProvisionedTenants() {
    var postGresClient = await module.exports.getConnection(); // "module.exports." is for easy mock in testing
    const sSql = `SELECT sub_account_id, sub_domain, created_on FROM ${ tables.database } WHERE STATE = 3`;
    var aTenants = [];
    try {
        aTenants = postGresClient.executeQuery(sSql);
    } catch (err) {
        console.log(err);
    } finally {
        await postGresClient.close();
    }
    return aTenants;
}

/**
 * update tenant status according to tenant id
 * @param:
 * sTenantID: tenant subaccount id
 * status: update satus
 */
async function updateTenantStatus(sTenantID, sStatus) {
    if (!sTenantID) {
        throw new Error('emtpy tenant id input for tenant status update');
    }
    var postGresClient = await module.exports.getConnection();
    let sUpdateSql = `UPDATE ${ tables.database } SET STATE = ${ sStatus } WHERE SUB_ACCOUNT_ID = '${ sTenantID }'`;
    try {
        postGresClient.executeUpdate(sUpdateSql);
    } catch (err) {
        throw new Error('update tenant status failed, check the tenant id and status' + err.message);
    } finally {
        await postGresClient.close();
    }
}

async function getConnection() {
    var oPostgresConfig = oXsEnv.cfServiceCredentials({ label: 'postgresql-db' });
    return await postgres(oPostgresConfig);
}

/**
 * Get all tenants credentials
 * @returns {aTenantInfo} array of tenant info: [{tenant_id, credentials}]
 */
async function getAllTenantRelatedInfo() {
    let aTenantInfo = [];
    try {
        aTenantInfo = async.waterfall.sync([
            async function (callback) {
                await oInstanceMananger.create(options.hana, callback);
            },
            function (oInstMananger, callback) {
                oInstMananger.getAll(function (err, result) {
                    callback(err, result);
                });
            }
        ]);
    } catch (err) {
        console.log(err);
    }
    return aTenantInfo;
}

/*
* get connection for a specific tenant ID 
* @returns hdb connection
*/
async function getConnectionByTenantID(sTenantID) {
    let oInstance = async.waterfall.sync([
        callback => {
            await oInstanceMananger.create(options['hana'], callback);
        },
        (oInstMananger, callback) => {
            oInstMananger.get(sTenantID, callback);
        }
    ]);
    return await oTenantQuery.tenantQuery(oInstance.credentials);
}

/**
 * get clients for all provisioned tenant DB 
 * @returns object {message, client: [{tenantId, tenantName, client}]}
 */
async function getAllProvisionedTenantDBClients() {
    let oResult = {
        message: '',
        clients: []
    };

    // "module.exports." is for easy mock in testing
    const aTenants = await module.exports.getProvisionedTenants();
    if (aTenants.length === 0) {
        await console.info('no provisioned tenant');
        oResult.message = 'no provisioned tenant';
        return oResult;
    }

    const aTenantInfos = await module.exports.getAllTenantRelatedInfo();

    aTenants.forEach(async function (tenant) {
        let sTenantId = tenant.sub_account_id;
        let dCreatedOn = tenant.created_on;
        let tenantInfo = aTenantInfos.find(o => o.tenant_id === sTenantId);
        if (tenantInfo === undefined) {
            await console.error('can not find tenant ' + sTenantId + ' in HDI container');
            oResult.message = 'can not find tenant ' + sTenantId + ' in HDI container';
            oResult.clients.push({
                tenantId: sTenantId,
                tenantName: tenant.sub_domain,
                subscriptionDate: null,
                client: null
            });
            return;
        }

        let oTenantDBClient = await oTenantQuery.tenantQuery(tenantInfo.credentials);
        oResult.clients.push({
            tenantId: sTenantId,
            tenantName: tenant.sub_domain,
            subscriptionDate: dCreatedOn,
            client: oTenantDBClient
        });
    });

    return oResult;
}
export default {oInstanceMananger,async,oXsEnv,options,postgres,oTenantQuery,tables,getProvisionedTenants,updateTenantStatus,getConnection,getAllTenantRelatedInfo,getConnectionByTenantID,getAllProvisionedTenantDBClients};
