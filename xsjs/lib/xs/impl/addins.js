const _ = require('lodash');
const AddinServiceParameters = require('../util/constants').AddinServiceParameters;

const MessageLibrary = require('../util/message');
const Code = MessageLibrary.Code;
const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;

module.exports.Addins = function ($) {

    /**
 * Handles a GET request towards the addin.xsjs resource to get a list of addin versions
 * It can return data for all or only activated addins, dependent on the request parameter.
 *
 * @returns {ServiceOutput} - an arry of ServiceOutput instances which encapsulates the payload produced by this method.
 */
    this.get = function (oBodyData, oParameters, oServiceOutput, oPersistency) {
        var aAddinList = [];
        var sStatus = oParameters.status || AddinServiceParameters.Status.Values.Activated;

        // Fetch Addin Versions + Configuration Headers
        var oAddins = oPersistency.Addin.getAddinsByStatus(sStatus);

        // Prepare Output
        _.each(oAddins, async function (oResult, iIndex) {
            var oAddin = prepareAddinObject(oResult);
            aAddinList.push(oAddin);
        });

        oServiceOutput.setBody(aAddinList);
    };

    /**
 * Handles HTTP POST requests to register an addin.
 */
    this.register = function (oAddinToRegister, oParameters, oServiceOutput, oPersistency) {

        var sGuid = oAddinToRegister.ADDIN_GUID;
        var sVersion = oAddinToRegister.ADDIN_VERSION;
        var aVersions = sVersion.split('.');

        if (oPersistency.Addin.versionExists(sGuid, aVersions) === true) {
            const sLogMessage = `The addin with guid ${ sGuid } and version ${ sVersion } is already registered. It was probably registered by another user.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage);
        }

        // Register addin
        oPersistency.Addin.register(oAddinToRegister);

        // Select and prepare addin for service response
        oServiceOutput.setBody( prepareAddinObject(oPersistency.Addin.getAddin(sGuid, aVersions)));
    };

    /**
 * Handles HTTP DELETE requests to unregister an addin.
 */
    this.unregister = function (oAddinToUnregister, oParameters, oServiceOutput, oPersistency) {

        var sGuid = oAddinToUnregister.ADDIN_GUID;
        var sVersion = oAddinToUnregister.ADDIN_VERSION;
        var aVersions = sVersion.split('.');

        if (oPersistency.Addin.versionExists(sGuid, aVersions) === false) {
            const sLogMessage = `The addin with guid ${ sGuid } and version ${ aVersions.join('.') } does not exist`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        oPersistency.Addin.unregister(sGuid, aVersions);
    };

    /**
 * Handles HTTP PUT requests to update the addin status (e.g. Activated)
 */
    this.updateStatus = function (oAddinToUpdate, oParameters, oServiceOutput, oPersistency) {
        var sGuid = oAddinToUpdate.ADDIN_GUID;
        var sVersion = oAddinToUpdate.ADDIN_VERSION;
        var aVersions = sVersion.split('.');

        var oAddinVersion = oPersistency.Addin.getAddinVersion(sGuid, aVersions);
        var oDBVersion = {};

        if (oAddinVersion !== undefined) {
            oDBVersion = prepareAddinVersionObject(oAddinVersion);
        }

        // Does Addin Version exist?
        if (oDBVersion.ADDIN_GUID === undefined) {
            const sLogMessage = `Addin with guid '${ sGuid }' and version '${ sVersion }' does not exist.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        // Has the addin been modified in the meantime?
        if (oDBVersion.LAST_MODIFIED_ON.getTime() !== oAddinToUpdate.LAST_MODIFIED_ON.getTime()) {
            const sLogMessage = `Addin with guid '${ sGuid }' and version '${ sVersion }' is not current. It has been updated by others.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage);
        }

        // Is Addin status already set?
        if (oDBVersion.STATUS === oAddinToUpdate.STATUS) {
            var oMessage = new Message(MessageLibrary.Code.ADDIN_STATUS_ALREADY_SET_INFO, MessageLibrary.Severity.INFO);
            oServiceOutput.addMessage(oMessage);
            return;
        }

        // Update addin version status
        oPersistency.Addin.updateVersion(oAddinToUpdate);

        // Select and prepare addin for service response
        oServiceOutput.setBody( prepareAddinObject(oPersistency.Addin.getAddin(sGuid, aVersions)));
    };

    /**
 * Helper to prepare addin object from db objects
 * from AddinVersions and ConfigurationHeader
 *
 * @param {object}
 *            oAddinVersion - Addin DB Oject which was joined from AddinVersions & AddinConfigHeader table
 * @returns {object} 
 *            object - Addin Version object prepared for Service Output
 */
    function prepareAddinObject(oAddinResult) {
        return _.extend( prepareAddinVersionObject(oAddinResult), {
            CONFIGURATION: {
                CREATED_ON: oAddinResult.HEADER_CREATED_ON,
                CREATED_BY: oAddinResult.HEADER_CREATED_BY,
                LAST_MODIFIED_ON: oAddinResult.HEADER_LAST_MODIFIED_ON,
                LAST_MODIFIED_BY: oAddinResult.HEADER_LAST_MODIFIED_BY
            }
        });
    }

    /**
 * Helper to prepare addin version object from db objects.
 *
 * @param {object}
 *            oAddinVersionObject - Addin Version DB Oject
 * @returns {object} 
 *            object - Addin Version object prepared for Service Output
 */
    function prepareAddinVersionObject(oAddinVersionObject) {

        var aMandatoryProperties = [
            'ADDIN_GUID',
            'ADDIN_MAJOR_VERSION',
            'ADDIN_MINOR_VERSION',
            'ADDIN_REVISION_NUMBER',
            'ADDIN_BUILD_NUMBER',
            'NAME',
            'FULL_QUALIFIED_NAME',
            'STATUS',
            'CERTIFICATE_ISSUER',
            'CERTIFICATE_SUBJECT',
            'CERTIFICATE_VALID_FROM',
            'CERTIFICATE_VALID_TO',
            'CREATED_ON',
            'CREATED_BY',
            'LAST_MODIFIED_ON',
            'LAST_MODIFIED_BY'
        ];
        var aOptionalProperties = [
            'DESCRIPTION',
            'PUBLISHER'
        ];

        // check for mandatory properties in resultset
        _.each(aMandatoryProperties, async function (sProperty, iIndex) {
            if (!_.has(oAddinVersionObject, sProperty)) {
                const sLogMessage = `Error while preparing addin version object: cannot find mandatory property ${ sProperty } within resultset.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
            }
        });

        // ensure, that all properties  are available though being handled optional internally
        _.each(aOptionalProperties, function (sProperty, iIndex) {
            if (!_.has(oAddinVersionObject, sProperty) || _.property(sProperty)(oAddinVersionObject) === undefined) {
                oAddinVersionObject[sProperty] = null;
            }
        });

        // Merge properties to output object
        return {
            ADDIN_GUID: oAddinVersionObject.ADDIN_GUID,
            ADDIN_VERSION: [
                oAddinVersionObject.ADDIN_MAJOR_VERSION,
                oAddinVersionObject.ADDIN_MINOR_VERSION,
                oAddinVersionObject.ADDIN_REVISION_NUMBER,
                oAddinVersionObject.ADDIN_BUILD_NUMBER
            ].join('.'),
            NAME: oAddinVersionObject.NAME,
            FULL_QUALIFIED_NAME: oAddinVersionObject.FULL_QUALIFIED_NAME,
            DESCRIPTION: oAddinVersionObject.DESCRIPTION,
            PUBLISHER: oAddinVersionObject.PUBLISHER,
            STATUS: oAddinVersionObject.STATUS,
            CERTIFICATE_ISSUER: oAddinVersionObject.CERTIFICATE_ISSUER,
            CERTIFICATE_SUBJECT: oAddinVersionObject.CERTIFICATE_SUBJECT,
            CERTIFICATE_VALID_FROM: oAddinVersionObject.CERTIFICATE_VALID_FROM,
            CERTIFICATE_VALID_TO: oAddinVersionObject.CERTIFICATE_VALID_TO,
            CREATED_ON: oAddinVersionObject.CREATED_ON,
            CREATED_BY: oAddinVersionObject.CREATED_BY,
            LAST_MODIFIED_ON: oAddinVersionObject.LAST_MODIFIED_ON,
            LAST_MODIFIED_BY: oAddinVersionObject.LAST_MODIFIED_BY
        };
    }

};
export default {_,AddinServiceParameters,MessageLibrary,Code,PlcException,Message};
