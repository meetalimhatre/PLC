const _ = require('lodash');
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const messageCode = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

module.exports.FrontendSettings = function ($) {

    /**
 * Handles a HTTP GET requests to get all personal and corporate frontend settings.
 *
 */
    this.get = async function (aBodyItems, oParameters, oServiceOutput, oPersistency) {
        var sUserId = $.getPlcUsername();
        var sType = oParameters.type.toUpperCase();
        var oFrontendSettingsInformation = await oPersistency.FrontendSettings.getFrontendSettings(sType, sUserId);

        oServiceOutput.setBody({ 'SETTINGS': _.values(oFrontendSettingsInformation) });
    };

    /**
 * Handles a HTTP POST request to add a new frontend setting *
 */
    this.create = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        var sUserId = aParameters.is_corporate === true ? null : $.getPlcUsername();
        var oResult = await oPersistency.FrontendSettings.insertFrontendSettings(aBodyItems, sUserId);
        if (oResult.ERRORS.length > 0) {
            namingConflictError(oResult.ERRORS);
        }
        oServiceOutput.setBody({ 'SETTINGS': _.values(oResult.SETTINGS) }).setStatus($.net.http.CREATED);
        return oServiceOutput;
    };


    /**
 * Handles a HTTP PUT request to modify an existing frontend setting
 *
 */
    this.update = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        var aMappingResults = mapSettingsUpdates(aBodyItems, await getExistentSettings(aBodyItems, aParameters.is_corporate, oPersistency));
        var oResult = await oPersistency.FrontendSettings.updateFrontendSettings(aMappingResults);
        if (oResult.ERRORS.length > 0) {
            namingConflictError(oResult.ERRORS);
        }
        oServiceOutput.setBody({ 'SETTINGS': _.values(oResult.SETTINGS) }).setStatus($.net.http.OK);
        return oServiceOutput;
    };

    /**
 * Handles a HTTP DELETE request to delete an existing frontend settings
 *
 */
    this.remove = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        var aFrontendSettingsNotDeleted = oPersistency.FrontendSettings.deleteFrontendSettings(await getExistentSettings(aBodyItems, aParameters.is_corporate, oPersistency));
        if (aFrontendSettingsNotDeleted.length > 0) {
            const sClientMsg = 'Error during removal of frontend settings';
            let sServerMsg = `${ sClientMsg } with Id(s):`;

            let oMessageDetails = new MessageDetails();
            _.each(aFrontendSettingsNotDeleted, function (oFrontendSettingsNotDeleted) {
                sServerMsg += ` ${ oFrontendSettingsNotDeleted.SETTING_ID }`;
                oMessageDetails.addSettingsObj({ SETTING_ID: oFrontendSettingsNotDeleted.SETTING_ID });
            });
            $.trace.error(sServerMsg);
            throw new PlcException(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        }
        oServiceOutput.setStatus($.net.http.OK);
        return oServiceOutput;
    };

    /**
 * Handles frontend settings existence checks
 * @param {array}
 *          aBodyItems - array with frontend settings to check
 * @param {boolean}
 *          isCorporate - true if corporate, false otherwise
 * @param {object}
 *          oPersistency - persistency object from the request
 * @throws {PlcException} frontend settings entity not found error
 */
    async function getExistentSettings(aBodyItems, isCorporate, oPersistency) {
        var sUserId = isCorporate === true ? null : $.getPlcUsername();
        var aDbSettings = await oPersistency.FrontendSettings.getDbSettings(aBodyItems, sUserId);
        if (aDbSettings.length != aBodyItems.length) {
            const aErrors = _.difference(_.map(aBodyItems, 'SETTING_ID'), _.map(aDbSettings, 'SETTING_ID'));
            let oMessageDetails = new MessageDetails();
            const sClientMsg = 'The frontend settings do not exist.';
            let sServerMsg = `${ sClientMsg } Ids:`;

            _.each(aErrors, function (iError) {
                sServerMsg += ` ${ iError }`;
                oMessageDetails.addSettingsObj({ SETTING_ID: iError });
            });
            $.trace.error(sServerMsg);
            throw new PlcException(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        }
        return aDbSettings;
    }

    /**
 * Function to map existing db settings with the settings to be updated
 * @param   {array}
 *              aSettingsUpdate - settings to be updated
 * @param   {array}
 *              aDbSettings - existent settings in db
 * @returns {array}
 *              aSettings - array of settings to be updated
 **/
    function mapSettingsUpdates(aSettingsUpdate, aDbSettings) {
        var aSettings = _.map(aDbSettings, function (oResult, key) {
            if (!_.has(aSettingsUpdate[key], 'SETTING_CONTENT')) {
                aSettingsUpdate[key].SETTING_CONTENT = oResult.SETTING_CONTENT;
            }
            // adding SETTING_TYPE and USER_ID for the response
            aSettingsUpdate[key].SETTING_TYPE = oResult.SETTING_TYPE;
            aSettingsUpdate[key].USER_ID = oResult.USER_ID;
            return aSettingsUpdate[key];
        });
        return aSettings;
    }

    /**
 * Handles frontend settings naming conflict errors
 * @param {array}
 *          aErrors - array with objects with naming conflict error
 * @throws {PlcException} frontend settings naming conflict error
 */
    function namingConflictError(aErrors) {
        let oMessageDetails = new MessageDetails();
        const sClientMsg = 'The frontend settings have naming conflict.';
        let sServerMsg = `${ sClientMsg } Ids: `;

        _.each(aErrors, function (oError) {
            sServerMsg += _.has(oError, 'HANDLE_ID') ? ` ${ oError.HANDLE_ID }` : ` ${ oError.SETTING_ID }`;
            oMessageDetails.addSettingsObj({
                SETTING_ID: _.has(oError, 'HANDLE_ID') ? oError.HANDLE_ID : oError.SETTING_ID,
                SETTING_NAME: oError.SETTING_NAME
            });
        });
        $.trace.error(sServerMsg);
        throw new PlcException(messageCode.WRITE_FRONTEND_SETTING_NAMING_CONFLICT, sClientMsg, oMessageDetails);
    }

};
export default {_,MessageLibrary,PlcException,messageCode,MessageDetails};
