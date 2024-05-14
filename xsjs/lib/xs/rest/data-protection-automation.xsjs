const cfenv = $.require('cfenv');
const axios = $.require('axios');
const cloudUtil = $.require('../util/cloudUtil');
const isCloud = $.require('../../platform/platformSpecificImports.js').isCloud;
const btoa = $.require('btoa');
var Persistency = await $.import('xs.db', 'persistency-dataProtection').DataProtection;

async function erasePersonalDataAfterEndOfValidity(aParameters) {
    try {
        if (isCloud()) {
            const tenantUtil = $.require('../ops/util/tenantUtil-cf');
            const aTenantDBClients = await tenantUtil.getAllProvisionedTenantDBClients();
            if (aTenantDBClients.clients.length === 0) {
                console.log(aTenantDBClients.message);
                return;
            }
            aTenantDBClients.clients.forEach(client => {
                persistency = await new Persistency(client.client);
                await persistency.erasePersonalDataAfterEndOfValidity();
            });

        } else {
            const DispatcherLib = $.require('../impl/dispatcher');
            const ctx = DispatcherLib.prepareDispatch($);
            await ctx.persistency.DataProtection.erasePersonalDataAfterEndOfValidity();
        }
        const appEnv = cfenv.getAppEnv();
        if (appEnv.isLocal) {
            return true;
        }
        const servicesEnv = appEnv.services['jobscheduler'][0];
        const jobschedulerCredentials = servicesEnv.credentials;
        let authToken = servicesEnv.plan === 'standard' && isCloud() ? await cloudUtil.getAuthorizationToken(jobschedulerCredentials) : 'Basic ' + btoa(`${ jobschedulerCredentials.user }:${ jobschedulerCredentials.password }`);

        axios({
            method: 'PUT',
            url: `${ aParameters.schedulerUrl }/scheduler/jobs/${ aParameters.jobId }/schedules/${ aParameters.scheduleId }/runs/${ aParameters.runId }`,
            headers: {
                Authorization: authToken,
                Accept: 'application/json'
            },
            json: true,
            data: {
                'success': true,
                'message': 'Successful finished erasing personal data'
            }
        }).then(response => console.log(response)).catch(error => console.log(error));

    } catch (e) {
        console.log('error:', e.message);
        throw new Error(`Failed to execute job: ${ e.message }`);
    }
}
export default {cfenv,axios,cloudUtil,isCloud,btoa,Persistency,erasePersonalDataAfterEndOfValidity};
