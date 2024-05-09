const axios = require("axios");
const btoa = require('btoa');

/**
 * Get authorization token for xsuaa credentials for a given service
 * @param {object}
 *            serviceCredentials - object which contains the uaa credentials of the service
 * @returns {string} authToken
 */
function getAuthorizationToken(serviceCredentials) {

    const encodedUserPass = btoa(`${serviceCredentials.uaa.clientid}:${serviceCredentials.uaa.clientSecret}`);

    return axios({
        method: 'POST',
            url: `${serviceCredentials.uaa.url}?grant_type=client_credentials`,
            headers: {
                Authorization: `Basic ${encodedUserPass}`,
                Accept: 'application/json'
            },
            json: true
        })
            .then(response => "Bearer " + response.body.access_token)
            .catch(error => console.log(error));
}

/**
 * Create a job
 * @param {string}
 *            authToken - access token
 * @param {string} 
 *            jobSchedulerUrl - url of the job scheduler service
 * @param {object} 
 *         jobOptions - object which contains job properties
 */

function createJob(authToken, jobSchedulerUrl, jobOptions) {
    return axios({
        method: "POST",
            url: `${jobSchedulerUrl}/scheduler/jobs`,
            headers: {
                Authorization: authToken,
                Accept: 'application/json'
            },
            data: jobOptions,
            json: true
        })
            .then(response => response.statusCode === 201 ? true : false)
            .catch(error => console.log(error));
};

/**
 * Update a job by name
 * @param {string}
 *            authToken - access token
 * @param {string} 
 *            jobSchedulerUrl - url of the job scheduler service
 * @param {object} 
 *         jobOptions - object which contains job properties
 */

function updateJobByName(authToken, jobSchedulerUrl, jobOptions) {
    return axios({
        method: "PUT",
            url: `${jobSchedulerUrl}/scheduler/jobs/${jobOptions.name}`,
            headers: {
                Authorization: authToken,
                Accept: 'application/json'
            },
            data: jobOptions,
            json: true
        })
            .then(response => response.statusCode === 200 ? true : false)
            .catch(error => console.log(error));
};

module.exports = {
    getAuthorizationToken,
    createJob,
    updateJobByName
}