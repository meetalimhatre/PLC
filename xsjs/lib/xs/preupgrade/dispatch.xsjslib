const isCloud = $.require('../../platform/platformSpecificImports.js').isCloud;
const MessageLibrary = $.require('../util/message');

const PlcException = MessageLibrary.PlcException;
const messageCode = MessageLibrary.Code;
const Persistency = $.import('xs.db', 'persistency').Persistency;
const constants = $.require('../util/constants');
const BusinessObjectTypes = constants.BusinessObjectTypes;

const sPlatformConnection = $.require('../../platform/platformSpecificImports.js').getPostinstallConnection().postInstallConnection;
const dbConnection = $.import(sPlatformConnection.substr(0, sPlatformConnection.lastIndexOf('.')), sPlatformConnection.substr(sPlatformConnection.lastIndexOf('.') + 1));
const ADMIN = 'Admin';

/** prepare-upgrade
 * execute the api by post /xs/preupgrade/run.xsjs?version=2.2.0
 * HTTP 200 OK in case of success,
 * HTTP 500 Internal Server Error if the present version is latest and shouldn't upgrade
 * HTTP 400 if version pattern is wrong
 * HTTP 404 if the http method or parameter is wrong
 */
async function run(request, response, session) {
    if (!session.hasAppPrivilege(ADMIN)) {
        response.status = $.net.http.FORBIDDEN;
        return;
    }
    $.getPlcUsername = () => $.session.getUsername() || 'TECHNICAL_USER';
    if (request.method === $.net.http.POST && (isCloud() && request.parameters.get('tenantid') || !isCloud())) {
        await PrepareUpgrade(request.parameters, response);
    } else {
        response.status = $.net.http.NOT_FOUND;
    }
}

/**
 * Method gets DB connection for XSA or Cloud Foundry
 * @param oReqParameters {object} service request parameters
 *
 */
async function getConnection(oReqParameters) {
    const oConnection = isCloud() ? await dbConnection.getConnection({ 'treatDateAsUTC': true }, oReqParameters.get('tenantid')) : await dbConnection.getConnection({ 'treatDateAsUTC': true });
    return oConnection;
}

/**
 * Method calls hdi-db-artefact-controller which executes prepare upgrade operation.
 * check if the Version is right and operation permitted,
 * then execute prepareUpgrade operation and delete the dynamic artifact
 *
 */
async function PrepareUpgrade(reqParameters, response) {

    const oPersistency = await new Persistency(await getConnection(reqParameters));
    // check if system is locked
    var aLockUsers = oPersistency.Misc.getLockingUsers(BusinessObjectTypes.Metadata, $.getPlcUsername());
    if (aLockUsers.length > 0) {
        var oMessageDetails = new MessageDetails();
        const sLogMessage = `System is locked for pregupgrade operations: ${ $.net.http.SERVICE_UNAVAILABLE }.`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.SERVICE_UNAVAILABLE_ERROR, sLogMessage, oMessageDetails);
    }

    try {
        oPersistency.DbArtefactController.prepareUpgrade('PreUpgrade');
        response.status = $.net.http.OK;
    } catch (e) {
        response.status = $.net.http.INTERNAL_SERVER_ERROR;
        response.body = 'There was an error during the installation. Please check the logs for more details.';
        $.trace.error(JSON.stringify(e));
    }
}
export default {isCloud,MessageLibrary,PlcException,messageCode,Persistency,constants,BusinessObjectTypes,sPlatformConnection,dbConnection,ADMIN,run,getConnection,PrepareUpgrade};
