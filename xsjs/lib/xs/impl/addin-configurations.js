const _ = require('lodash');
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

module.exports.AddinConfigurations = function ($) {

    /**
 * Handles a GET request towards the addin-configurations.xsjs resource to get the addin configuration.
 * It only can return the configuration for one addin at the same time
 */
    this.get = async function (oBodyData, oParameters, oServiceOutput, oPersistency) {
        var sGuid = oParameters.guid;
        var sVersion = oParameters.version;
        var aVersions = sVersion.split('.');

        // Set default value (false) to use_previous_version
        var bPreviousVersion = oParameters.use_previous_version || false;

        // check if addin exists
        if (oPersistency.Addin.versionExists(sGuid, aVersions) === false) {
            const sLogMessage = `The addin with guid ${ sGuid } and version ${ aVersions.join('.') } does not exist, therefore no config can be fetched`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        // Fetch and return add-in configuration
        var oAddinConfigurationDBObject = oPersistency.Addin.getAddinConfiguration(sGuid, aVersions, bPreviousVersion);

        // if no configuration entity exists for the specified add-in, the servic replies with GENERAL_ENTITY_NOT_FOUND_ERROR (404)
        if (oAddinConfigurationDBObject === undefined) {
            const sLogMessage = `Cannot find any configuration for addin guid ${ sGuid } and version ${ sVersion } (use_previous_version parameter: ${ bPreviousVersion })`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        oServiceOutput.setBody(await prepareAddinConfigurationObject(oAddinConfigurationDBObject));
    };


    /**
 * Handles HTTP POST requests. The implementation creates an addin configuration.
 * It only can create the configuration for one addin at the same time
 */
    this.create = async function (oAddinConfigToCreate, oParameters, oServiceOutput, oPersistency) {

        var sGuid = oAddinConfigToCreate.ADDIN_GUID;
        var sVersion = oAddinConfigToCreate.ADDIN_VERSION;
        var aVersions = oAddinConfigToCreate.ADDIN_VERSION.split('.');

        // Check if addin version is available for update
        if (!oPersistency.Addin.versionExists(sGuid, aVersions)) {
            const sLogMessage = `Addin with guid ${ sGuid } and version ${ sVersion } does not exist.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        // Get current addin configuration stored in DB
        var oAddinConfigurationDBObject = oPersistency.Addin.getAddinConfiguration(sGuid, aVersions);

        // Does configuration already exist?
        if (oAddinConfigurationDBObject !== undefined) {
            const sLogMessage = `Addin Configuration for guid ${ sGuid } and version ${ sVersion } does already exist.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR, sLogMessage);
        }


        // Create new configuration header if does not exist yet
        oPersistency.Addin.createConfigurationHeader(sGuid, aVersions);
        oPersistency.Addin.updateConfigurationItems(oAddinConfigToCreate.CONFIG_DATA, sGuid, aVersions);

        // Fetch and return add-in configuration
        var oResultConfiguration = oPersistency.Addin.getAddinConfiguration(sGuid, aVersions);

        if (oResultConfiguration !== undefined) {
            oServiceOutput.setBody(await prepareAddinConfigurationObject(oResultConfiguration));
        }
    };


    /**
 * Handles HTTP PUT requests. The implementation updates addin configuration.
 * It only can update the configuration for one addin at the same time
 */
    this.update = async function (oAddinConfigToUpdate, oParameters, oServiceOutput, oPersistency) {

        var sGuid = oAddinConfigToUpdate.ADDIN_GUID;
        var sVersion = oAddinConfigToUpdate.ADDIN_VERSION;
        var aVersions = oAddinConfigToUpdate.ADDIN_VERSION.split('.');

        // Check if addin version is available for update
        if (!oPersistency.Addin.versionExists(sGuid, aVersions)) {
            const sLogMessage = `Addin with guid ${ sGuid } and version ${ sVersion } does not exist.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);

        }

        // Get current addin configuration stored in DB
        var oAddinConfigurationDBObject = oPersistency.Addin.getAddinConfiguration(sGuid, aVersions);

        // Does configuration already exist?
        if (oAddinConfigurationDBObject === undefined) {
            const sLogMessage = `Addin with guid ${ sGuid } and version ${ sVersion } does not exist.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        // check if the addin configuration can be updated (based on its date)
        if (oAddinConfigToUpdate.LAST_MODIFIED_ON === undefined || oAddinConfigToUpdate.LAST_MODIFIED_ON === null) {
            const sLogMessage = `Configuration request for addin with guid '${ sGuid }' and version '${ sVersion }' has no LAST_MODIFIED_ON field. Configuration will not be updated.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);

        }

        // check if the addin has been modified by others after the client has received configuration
        if (oAddinConfigurationDBObject.ConfigurationHeader.LAST_MODIFIED_ON.getTime() !== oAddinConfigToUpdate.LAST_MODIFIED_ON.getTime()) {
            const sLogMessage = `Configuration for addin with guid ${ sGuid } and version ${ sVersion } is not current. It has been updated by others after having requested it.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage);
        }

        oPersistency.Addin.updateConfigurationHeader(sGuid, aVersions);
        oPersistency.Addin.updateConfigurationItems(oAddinConfigToUpdate.CONFIG_DATA, sGuid, aVersions);

        // Fetch and return add-in configuration
        var oResultConfiguration = oPersistency.Addin.getAddinConfiguration(sGuid, aVersions);

        if (oResultConfiguration !== undefined) {
            oServiceOutput.setBody(await prepareAddinConfigurationObject(oResultConfiguration));
        }
    };


    /**
 * Helper to prepare addin configuration object from db object
 * for service output
 *
 * @param {object}
 *            oAddinConfigurationDBObject - Addin Config DB Oject including
 			  properties ConfigurationHeader and ConfigurationItems
 * @returns {object} 
 *            object - Addin Configuration object prepared for Service Output
 */
    function prepareAddinConfigurationObject(oAddinConfigurationDBObject) {

        // Prepare header data
        var oAddinConfiguration = {
            ADDIN_GUID: oAddinConfigurationDBObject.ConfigurationHeader.ADDIN_GUID,
            ADDIN_VERSION: [
                oAddinConfigurationDBObject.ConfigurationHeader.ADDIN_MAJOR_VERSION,
                oAddinConfigurationDBObject.ConfigurationHeader.ADDIN_MINOR_VERSION,
                oAddinConfigurationDBObject.ConfigurationHeader.ADDIN_REVISION_NUMBER,
                oAddinConfigurationDBObject.ConfigurationHeader.ADDIN_BUILD_NUMBER
            ].join('.'),
            CREATED_ON: oAddinConfigurationDBObject.ConfigurationHeader.CREATED_ON,
            CREATED_BY: oAddinConfigurationDBObject.ConfigurationHeader.CREATED_BY,
            LAST_MODIFIED_ON: oAddinConfigurationDBObject.ConfigurationHeader.LAST_MODIFIED_ON,
            LAST_MODIFIED_BY: oAddinConfigurationDBObject.ConfigurationHeader.LAST_MODIFIED_BY,
            CONFIG_DATA: []
        };

        // Merge Configuration Items into object
        _.each(oAddinConfigurationDBObject.ConfigurationItems, function (oConfigItem, iIndex) {
            oAddinConfiguration.CONFIG_DATA.push({
                CONFIG_KEY: oConfigItem.CONFIG_KEY,
                CONFIG_VALUE: oConfigItem.CONFIG_VALUE
            });
        });

        return oAddinConfiguration;

    }

};
export default {_,MessageLibrary,PlcException,Code};
