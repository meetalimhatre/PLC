const oInstanceMananger = require('instance-manager');
const async = require('async');
const oXsEnv = require('@sap/xsenv');
const options = oXsEnv.getServices({ 'hana': { tag: 'hana' } });
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
function getProvisionedTenants() {
    var postGresClient = module.exports.getConnection(); // "module.exports." is for easy mock in testing
    const sSql = `SELECT sub_account_id, sub_domain, created_on FROM ${ tables.database } WHERE STATE = 3`;
    var aTenants = [];
    try {
        aTenants = postGresClient.executeQuery(sSql);
    } catch (err) {
        console.log(err);
    } finally {
        postGresClient.close();
    }
    return aTenants;
}

/**
 * update tenant status according to tenant id
 * @param:
 * sTenantID: tenant subaccount id
 * status: update satus
 */
function updateTenantStatus(sTenantID, sStatus) {
    if (!sTenantID) {
        throw new Error('emtpy tenant id input for tenant status update');
    }
    var postGresClient = module.exports.getConnection();
    let sUpdateSql = `UPDATE ${ tables.database } SET STATE = ${ sStatus } WHERE SUB_ACCOUNT_ID = '${ sTenantID }'`;
    try {
        postGresClient.executeUpdate(sUpdateSql);
    } catch (err) {
        throw new Error('update tenant status failed, check the tenant id and status' + err.message);
    } finally {
        postGresClient.close();
    }
}

function getConnection() {
    var oPostgresConfig = oXsEnv.cfServiceCredentials({ label: 'postgresql-db' });
    return postgres(oPostgresConfig);
}

/**
 * Get all tenants credentials
 * @returns {aTenantInfo} array of tenant info: [{tenant_id, credentials}]
 */
function getAllTenantRelatedInfo() {
    let aTenantInfo = [];
    try {
        aTenantInfo = async.waterfall.sync([
            function (callback) {
                oInstanceMananger.create(options.hana, callback);
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
function getConnectionByTenantID(sTenantID) {
    let oInstance = async.waterfall.sync([
        callback => {
            oInstanceMananger.create(options['hana'], callback);
        },
        (oInstMananger, callback) => {
            oInstMananger.get(sTenantID, callback);
        }
    ]);
    return oTenantQuery.tenantQuery(oInstance.credentials);
}

/**
 * get clients for all provisioned tenant DB 
 * @returns object {message, client: [{tenantId, tenantName, client}]}
 */
function getAllProvisionedTenantDBClients() {
    let oResult = {
        message: '',
        clients: []
    };

    // "module.exports." is for easy mock in testing
    const aTenants = module.exports.getProvisionedTenants();
    if (aTenants.length === 0) {
        console.info('no provisioned tenant');
        oResult.message = 'no provisioned tenant';
        return oResult;
    }

    const aTenantInfos = module.exports.getAllTenantRelatedInfo();

    aTenants.forEach( function (tenant) {
        let sTenantId = tenant.sub_account_id;
        let dCreatedOn = tenant.created_on;
        let tenantInfo = aTenantInfos.find(o => o.tenant_id === sTenantId);
        if (tenantInfo === undefined) {
            console.error('can not find tenant ' + sTenantId + ' in HDI container');
            oResult.message = 'can not find tenant ' + sTenantId + ' in HDI container';
            oResult.clients.push({
                tenantId: sTenantId,
                tenantName: tenant.sub_domain,
                subscriptionDate: null,
                client: null
            });
            return;
        }

        let oTenantDBClient = oTenantQuery.tenantQuery(tenantInfo.credentials);
        oResult.clients.push({
            tenantId: sTenantId,
            tenantName: tenant.sub_domain,
            subscriptionDate: dCreatedOn,
            client: oTenantDBClient
        });
    });

    return oResult;
}
//export default {oInstanceMananger,async,oXsEnv,options,postgres,oTenantQuery,tables,getProvisionedTenants,updateTenantStatus,getConnection,getAllTenantRelatedInfo,getConnectionByTenantID,getAllProvisionedTenantDBClients};
module.exports = {oInstanceMananger,async,oXsEnv,options,postgres,oTenantQuery,tables,getProvisionedTenants,updateTenantStatus,getConnection,getAllTenantRelatedInfo,getConnectionByTenantID,getAllProvisionedTenantDBClients};