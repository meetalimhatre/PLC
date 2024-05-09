const axios = require('axios');
const cfenv = require('cfenv');
const tenantUtil = require('../../ops/util/tenantUtil-cf');
var btoa = require('btoa');

module.exports = {
    getTenantUserCount,
    sendUsageData,
    getCFEnv,
    collectUsageData,
    getAuthorizationToken
};

/**
 * Get count(*) from t_user_activity in one tenant schema for all active users during previous calendar month
 * @param oClient {object} one tenant DB client
 */
async function getTenantUserCount(oClient) {
    let result = null;
    const sqlStatement = `SELECT COUNT(USER_ID) as USERCOUNT FROM  "sap.plc.db::basis.t_user_activity" 
                                    WHERE LAST_ACTIVITY_TIME between (ADD_MONTHS(NEXT_DAY(LAST_DAY(CURRENT_UTCTIMESTAMP)),-2))
                                    AND (ADD_NANO100(ADD_MONTHS(NEXT_DAY(LAST_DAY(CURRENT_UTCTIMESTAMP)),-1),-1))
                                    AND (USER_ID NOT LIKE '%@sap.com%')`;

    try {
        result = oClient.executeQuery(sqlStatement);
    } catch (e) {
        await console.log(e);
    }
    // Because of DPP/GDPR the personal data is deleted after 3 years 
    let resultDeleteData = null;
    const sRetentionDate = new Date();
    const iRetentionYears = 3;
    sRetentionDate.setFullYear(sRetentionDate.getFullYear() - iRetentionYears);
    const sqlStatementDeleteData = `delete from  "sap.plc.db::basis.t_user_activity"
                                            where  LAST_ACTIVITY_TIME <= '${ sRetentionDate.toISOString() }'`;

    try {
        resultDeleteData = oClient.executeQuery(sqlStatementDeleteData);
    } catch (e) {
        await console.log(e);
    }

    if (Array.isArray(result) && result[0].hasOwnProperty('USERCOUNT')) {
        return result[0]['USERCOUNT'];
    } else {
        return result;
    }
}

/**
 * call MaaS API to send data
 * @param oParameters {object} contains many parameters API needs
 *                    {usageToken, meteringURL, sTenantId, iUserCount}
 */
async function sendUsageData(oParameters) {

    return axios({
        method: 'PUT',
        url: `${ oParameters.meteringURL }/usage/v2/usage/documents`,
        headers: {
            Authorization: `Bearer ${ oParameters.sAuthToken }`,
            Accept: 'application/json'
        },
        data: {
            usage: [{
                    timestamp: new Date().toISOString().replace(/Z/, ''),
                    service: {
                        id: 'xsac-plc-xsjs',
                        plan: 'metering-service-plan'
                    },
                    consumer: {
                        environment: 'CF',
                        region: oParameters.region,
                        subAccount: oParameters.sTenantId
                    },
                    measures: [{
                            id: 'user_record_count',
                            value: oParameters.iUserCount
                        }]
                }]
        },
        json: true
    }).then(response => response).catch(error => await console.log(error));
}

/**
 * get environment parameter in cloud foundry
 */
function getCFEnv() {
    const cfEnv = cfenv.getAppEnv();
    return cfEnv;
}

/**
 * Get authorization token for MaaS
 */
async function getAuthorizationToken(clientId, clientSecret, tokenURL) {

    let encodedUserPass = btoa(`${ clientId }:${ clientSecret }`);

    return axios({
        method: 'GET',
        url: `${ tokenURL }/oauth/token?grant_type=client_credentials`,
        headers: {
            Authorization: `Basic ${ encodedUserPass }`,
            Accept: 'application/json'
        },
        json: true
    }).then(response => response.body.access_token).catch(error => await console.log(error));
}

/**
 *job schedule entry
 */
async function collectUsageData($, req, res) {

    if (!$.session.hasAppPrivilege('JOBSCHEDULER')) {
        res.status = $.net.http.FORBIDDEN;
        res.setBody(JSON.stringify({ err_message: 'not authorized, missing privilege JOBSCHEDULER' }));
        return;
    }

    const cfEnv = await module.exports.getCFEnv(); // module.exports is for mocking in testing
    if (!cfEnv.services.hasOwnProperty('metering-service')) {
        throw new Error('metering service is not create or bind to app');
    }

    const servicesEnv = cfEnv.services['metering-service'];
    const meteringServiceCredentials = servicesEnv[0].credentials;

    const clientId = meteringServiceCredentials.clientid;
    const clientSecret = meteringServiceCredentials.clientsecret;
    const tokenURL = meteringServiceCredentials.token_url;
    const sAuthToken = await getAuthorizationToken(clientId, clientSecret, tokenURL);

    const meteringURL = meteringServiceCredentials.metering_url;
    const region = meteringServiceCredentials.region;

    const aTenantDBClients = await tenantUtil.getAllProvisionedTenantDBClients();
    if (aTenantDBClients.clients.length === 0) {
        await console.log(aTenantDBClients.message);
        res.status = $.net.http.OK;
        res.setBody(JSON.stringify({ message: aTenantDBClients.message }));
        return;
    }

    const aFailedTenantInfo = [];   //used to store failed tenant info
    aTenantDBClients.clients.filter(function (oClient) {
        return oClient.client !== null;
    }).map(async function (oClient) {
        let sTenantId = oClient.tenantId;
        let sTenantName = oClient.tenantName;

        let iUserCount = await module.exports.getTenantUserCount(oClient.client); // module.exports is for mocking in testing
        await oClient.client.close();

        if (iUserCount === null) {
            aFailedTenantInfo.push({
                tenantId: sTenantId,
                tenantName: sTenantName,
                message: 'can not get the user count from tenant DB'
            });
        } else {
            await console.log('tenantId and UserCount: ', sTenantId, iUserCount);
            try {
                let oResult = await module.exports.sendUsageData({
                    'sAuthToken': sAuthToken,
                    'meteringURL': meteringURL,
                    'sTenantId': sTenantId,
                    'iUserCount': iUserCount,
                    'region': region
                });

                if (oResult.statusCode !== 200) {
                    aFailedTenantInfo.push({
                        tenantId: sTenantId,
                        tenantName: sTenantName,
                        statusCode: oResult.statusCode,
                        message: 'Error meesage from submit usage API: ' + oResult.body.error
                    });
                }
            } catch (e) {
                aFailedTenantInfo.push({
                    tenantId: sTenantId,
                    tenantName: sTenantName,
                    message: e
                });
            }
        }
    });


    if (aFailedTenantInfo.length === 0) {
        await console.log('all tenants usage data sent successfully');
        res.status = $.net.http.OK;
        res.setBody(JSON.stringify({ message: 'all tenants usage data sent successfully' }));
    } else {
        await console.log('some tenants usage data sent failed :', aFailedTenantInfo);
        res.status = $.net.http.INTERNAL_SERVER_ERROR;
        res.setBody(JSON.stringify({
            err_message: 'some tenants usage data sent failed ',
            failedTenants: aFailedTenantInfo
        }));
    }
}
export default {axios,cfenv,tenantUtil,btoa,getTenantUserCount,sendUsageData,getCFEnv,getAuthorizationToken,collectUsageData};
