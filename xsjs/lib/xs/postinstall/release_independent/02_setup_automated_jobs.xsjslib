const axios = $.require("axios");
const isCloud = $.require(
    "../../../platform/platformSpecificImports.js"
).isCloud;
const cfenv = $.require("cfenv");
const btoa = $.require("btoa");
const cloudUtil = $.require("../../util/cloudUtil");
const helpers = $.require("../../util/helpers");

function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

function run(oConnection) {
    const appEnv = cfenv.getAppEnv();
    if(appEnv.isLocal) { //disable job creation when app is running locally
        return true;
    }
    try {
        const appUrl = appEnv.app.application_uris[0];
        const servicesEnv = appEnv.services["jobscheduler"][0];
        const jobschedulerCredentials = servicesEnv.credentials;

        if (servicesEnv.plan === "standard" && isCloud()) {
            let authToken = cloudUtil.getAuthorizationToken(jobschedulerCredentials);
            checkAndCreateDataDeletionJob(authToken, jobschedulerCredentials.url, appUrl);
            return checkAndCreateLicenseMeteringJob(
                authToken,
                jobschedulerCredentials.url,
                appUrl
            );
        } else {
            let authToken = "Basic "+ btoa(`${jobschedulerCredentials.user}:${jobschedulerCredentials.password}`);
            checkAndCreateDataDeletionJob(authToken, jobschedulerCredentials.url, appUrl);
        }  
    } catch(e) {
        console.log("error:", e.message);
        throw new Error(`Failed to create automated jobs: ${e.message}`);
    }
    return true;
}

function getActiveJobs(authToken, jobSchedulerUrl) {
    return axios({
        method: "GET",
        url: `${jobSchedulerUrl}/scheduler/jobs`,
        headers: {
            Authorization: authToken,
            Accept: "application/json",
        },
        json: true,
    })
        .then(response => response)
        .catch(error => console.log(error));
}

function checkAndCreateLicenseMeteringJob(authToken, jobSchedulerUrl, appUrl) {
    const activeJobs = getActiveJobs(authToken, jobSchedulerUrl);

    const jobOptions = {
        name: "plc_license_metering",
        action: `https://${appUrl}/xs/ops/license-metering-cf.xsjs`,
        active: true,
        description: "reccuring job that calls license metering",
        httpMethod: "GET",
        schedules: [
            {
                type: "recurring",
                active: true,
                description: "Monthly reporting schedule",
                cron: "* * 1 * 1 * *",
            },
        ],
    };

    if (
        !helpers.isNullOrUndefined(activeJobs.body) &&
        activeJobs.body.results.filter((job) => job.name === "plc_license_metering")
            .length === 0
    ) {
        return cloudUtil.createJob(authToken, jobSchedulerUrl, jobOptions);
    } else {
        return cloudUtil.updateJobByName(authToken, jobSchedulerUrl, jobOptions);
    }
}

function checkAndCreateDataDeletionJob(authToken, jobSchedulerUrl, appUrl) {

    const activeJobs = getActiveJobs(authToken, jobSchedulerUrl);

    const jobOptions = {
        name: "data_protection_automation",
        action: `https://${appUrl}/xs/rest/call-data-protection.xsjs`,
        active: true,
        description: "Recurringly triggers check for end of validity of personal data",
        schedules: [
            {
                type: "recurring",
                active: true,
                description: "Call function erasePersonalDataAfterEndOfValidity",
                cron: "* * * * 0 0 0",
            },
        ],
    };

    if (
        !helpers.isNullOrUndefined(activeJobs.body) &&
        activeJobs.body.results.filter((job) => job.name === "data_protection_automation")
            .length === 0
    ) {
        return cloudUtil.createJob(authToken, jobSchedulerUrl, jobOptions);
    } else {
        return cloudUtil.updateJobByName(authToken, jobSchedulerUrl, jobOptions);
    }
}
