const _ = $.require('lodash');
const helpers = $.require('../util/helpers');
const Helper = $.require('./persistency-helper').Helper;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;


var Tables = await Object.freeze({ frontend_settings: 'sap.plc.db::basis.t_frontend_settings' });

const Sequences = await Object.freeze({ frontend_settings: 'sap.plc.db.sequence::s_frontend_settings' });

/**
 * Provides persistency operations with frontend settings.
 */
async function FrontendSettings(dbConnection, hQuery) {
    var helper = await new Helper($, hQuery, dbConnection);
    /**
	 * Gets all the corporate frontend settings and the user defined frontend settings
	 * @param {string}
	 *            sType - the frontend setting type
	 * @param {string}
	 *            sUserId - the current user or null if is_corporate = true
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {oReturnObject} -  all corporate frontend settings and the user defined ones
	 */
    this.getFrontendSettings = async function (sType, sUserId) {
        try {
            var stmtFrontendSettings = `select SETTING_ID, SETTING_NAME, SETTING_TYPE, USER_ID, SETTING_CONTENT from 
				"${ Tables.frontend_settings }" where SETTING_TYPE = ?
				and (USER_ID = ? OR USER_ID is null)`;
            var oReturnObject = dbConnection.executeQuery(stmtFrontendSettings, sType, sUserId);
        } catch (e) {
            const sLogMessage = `Error when reading frontend settings.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
        }
        return oReturnObject;
    };

    /**
	 * Gets the setting IDs from the defined frontend settings that have SETTING_TYPE set to 'MASSCHANGE'
	 * @param {array}
	 *            sIds - the frontend settings ids
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {oReturnObject} - the frontend settings ids for the entities that have SETTING_TYPE set to 'MASSCHANGE'
	 */
    this.getFrontendSettingsMassChangeIds = async function (sIds) {
        var sStmtFrontendSettings = `select SETTING_ID from 
			"${ Tables.frontend_settings }" where SETTING_TYPE = 'MASSCHANGE' AND (`;

        if (!helpers.isNullOrUndefined(sIds) && sIds.length > 0) {
            _.each(sIds, function (sId, iIndex) {
                sStmtFrontendSettings += ' SETTING_ID = ' + sId;
                if (iIndex < sIds.length - 1) {
                    sStmtFrontendSettings += ' OR';
                } else {
                    sStmtFrontendSettings += ' )';
                }
            });
        }

        try {
            var oReturnObject = dbConnection.executeQuery(sStmtFrontendSettings);
        } catch (e) {
            const sLogMessage = `Error when reading frontend settings.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
        }
        return oReturnObject;
    };

    /**
	 * Creates new frontend settings, corporate or personal
	 * @param {array}
	 *            aSettings - the array of frontend settings that will be created
	 *            			- the array contains objects that have SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT as properties
	 *            sUserId   - the current user or null if is_corporate = true
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {object} object containing inserted frontend settings and any resulting errors
	 */
    this.insertFrontendSettings = async function (aSettings, sUserId) {
        var aSettingsInsert = [];
        var aSettingsResponseWithHandleIds = [];

        _.each(aSettings, function (oSetting) {
            var iSettingId = helper.getNextSequenceID(Sequences.frontend_settings);
            var oSettingsColumn = [
                iSettingId,
                oSetting.SETTING_NAME,
                oSetting.SETTING_TYPE.toUpperCase(),
                sUserId,
                oSetting.SETTING_CONTENT
            ];
            aSettingsInsert.push(oSettingsColumn);

            oSetting.HANDLE_ID = oSetting.SETTING_ID;
            oSetting.SETTING_ID = iSettingId;
            oSetting.USER_ID = sUserId;
            aSettingsResponseWithHandleIds.push(oSetting);
        });

        try {
            var aInsertResult = dbConnection.executeUpdate(`INSERT INTO "${ Tables.frontend_settings }" 
			                    (SETTING_ID, SETTING_NAME, SETTING_TYPE, USER_ID, SETTING_CONTENT) VALUES (?,?,?,?,?)`, aSettingsInsert);
        } catch (e) {
            const sLogMessage = `Error during insertion of frontend settings with ID ${ aSettings.HANDLE_ID }.`;
            $.trace.error(sLogMessage);

            var oMessageDetails = new MessageDetails();
            oMessageDetails.addSettingsObj({
                SETTING_ID: aSettings[0].HANDLE_ID,
                SETTING_NAME: aSettings[0].SETTING_NAME
            });
            throw new PlcException(Code.WRITE_FRONTEND_SETTING_NAMING_CONFLICT, sLogMessage, oMessageDetails);
        }

        return {
            ERRORS: await helpers.unsuccessfulItemsDbOperation(aSettings, aInsertResult),
            SETTINGS: aSettingsResponseWithHandleIds
        };
    };

    /**
	 * Updates existing frontend settings, corporate or personal
	 * @param {object}
	 *            aSettings - the frontend settings array of objects that should be updated
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {object} object containing updated frontend settings and any resulting errors
	 */
    this.updateFrontendSettings = async function (aSettings) {
        var aSettingsUpdate = [];

        _.each(aSettings, function (oSetting) {
            var oSettingsColumn = [
                oSetting.SETTING_NAME,
                oSetting.SETTING_CONTENT,
                oSetting.SETTING_ID
            ];
            aSettingsUpdate.push(oSettingsColumn);
        });

        try {
            var aUpdateResult = dbConnection.executeUpdate(`update "${ Tables.frontend_settings }"
		                                                set SETTING_NAME = ?, SETTING_CONTENT = ?
		                                                where SETTING_ID = ?`, aSettingsUpdate);
        } catch (e) {
            const sLogMessage = `Error during update of frontend settings with ID ${ aSettings[0].SETTING_ID }.`;
            $.trace.error(sLogMessage);

            var oMessageDetails = new MessageDetails();
            oMessageDetails.addSettingsObj({
                SETTING_ID: aSettings[0].SETTING_ID,
                SETTING_NAME: aSettings[0].SETTING_NAME
            });
            throw new PlcException(Code.WRITE_FRONTEND_SETTING_NAMING_CONFLICT, sLogMessage, oMessageDetails);
        }

        return {
            ERRORS: await helpers.unsuccessfulItemsDbOperation(aSettings, aUpdateResult),
            SETTINGS: aSettings
        };
    };

    /**
	 * Gets all frontend settings by Ids
	 * @param {string}
	 *          aSettings - the frontend settings
	 * @returns {array} aDbSettings
	 *              all corporate frontend settings and the user defined ones corresponding to the ids in aSettings
	 */
    this.getDbSettings = function (aSettings, sUserId) {
        var selectStmt = `select SETTING_ID, SETTING_NAME, SETTING_TYPE, USER_ID, SETTING_CONTENT from "${ Tables.frontend_settings }"
	                        where SETTING_ID = '${ aSettings[0].SETTING_ID }' and USER_ID `;
        if (sUserId != null) {
            selectStmt += ` = '${ sUserId }'`;
            for (let i = 1; i < aSettings.length; i++) {
                selectStmt = selectStmt + ` or SETTING_ID = '${ aSettings[i].SETTING_ID }' and USER_ID = '${ sUserId }'`;
            }
        } else {
            selectStmt += ` is null`;
            for (let i = 1; i < aSettings.length; i++) {
                selectStmt = selectStmt + ` or SETTING_ID = '${ aSettings[i].SETTING_ID }' and USER_ID is null`;
            }
        }
        var aDbSettings = dbConnection.executeQuery(selectStmt);
        return aDbSettings;
    };

    /**
	 * Deletes settings from the input array
	 * @param {array}
	 *          aSettings - the array of settings that will be deleted
	 * @returns {array} - an array of objects that could not be deleted from the table
	 */
    this.deleteFrontendSettings = async function (aSettings) {
        var aSettingsIds = [];
        _.each(aSettings, function (oSetting) {
            var oSettingsIds = [oSetting.SETTING_ID];
            aSettingsIds.push(oSettingsIds);
        });

        var aDeleteResult = dbConnection.executeUpdate(`delete from "${ Tables.frontend_settings }" where SETTING_ID = ?`, aSettingsIds);

        //returns an array with the objects that could not be deleted, 1 means delete was successful and 0 not successful
        return await helpers.unsuccessfulItemsDbOperation(aSettings, aDeleteResult);
    };
}

FrontendSettings.prototype = await Object.create(FrontendSettings.prototype);
FrontendSettings.prototype.constructor = FrontendSettings;
export default {_,helpers,Helper,MessageLibrary,PlcException,Code,MessageDetails,Tables,Sequences,FrontendSettings};
