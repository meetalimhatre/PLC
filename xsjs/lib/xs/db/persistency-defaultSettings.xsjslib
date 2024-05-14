const Helper = $.require('./persistency-helper').Helper;
const _ = $.require('lodash');
const helpers = $.require('../util/helpers');
const apiHelpers = $.import('xs.db.administration', 'api-helper');
const DefaultSettingsEntities = $.require('../util/constants').DefaultSettings;
const BusinessObjectTypes = $.require('../util/constants').BusinessObjectTypes;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;
const Code = MessageLibrary.Code;

var Tables = Object.freeze({ defaultSettings: 'sap.plc.db::basis.t_default_settings' });

const Procedures = Object.freeze({ default_settings_read: 'sap.plc.db.defaultsettings.procedures::p_default_settings_read' });

async function DefaultSettings(dbConnection, hQuery, hQueryRepl) {
    var that = this;
    this.helper = new Helper($, hQuery, dbConnection);

    async function throwWrongSettingException() {
        const sLogMessage = `The type of default settings can be only default or user.`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
    }

    /**
     * Check if CONTROLLING_AREA_ID property is defined in the request object
     *
     * @param oDefaultSettings {object} - object passed in request
     * @throws {PlcException} - if the property is missing
     */
    async function checkDefaultSettingsEntity(oDefaultSettings) {
        if (!helpers.isPlainObject(oDefaultSettings)) {
            const sClientMsg = 'oDefaultSettings must be an object.';
            const sServerMsg = `${ sClientMsg } oDefaultSettings: ${ oDefaultSettings }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
    }

    /**
	 * Function to read default settings
	 *
	 * @param sType {string} - the type of default_settings (global or user)
	 * @param sUserId {string} - the logged user
	 * @param sLanguage {string}- the language of the instance
	 * @param sMasterDataDate {string} - current date
	 * 
	 * @throws {PlcException} - if the call of read procedure fails
	 *
	 * @returns {object} oReturnObject - object containing all the default_settings
	 */
    this.get = async function (sType, sUserId, sLanguage, sMasterDataDate) {
        var oReturnObject = {};
        var iEntryExists = await checkEntryExists(sType, sUserId);

        if (iEntryExists == 1) {
            try {
                var procedure = dbConnection.loadProcedure(Procedures.default_settings_read);
                var result = procedure(sLanguage, sMasterDataDate, sUserId);

                oReturnObject[DefaultSettingsEntities.CONTROLLING_AREA] = Array.slice(result.TT_CONTROLLING_AREA)[0];
                oReturnObject[DefaultSettingsEntities.COMPANY_CODE] = Array.slice(result.TT_COMPANY_CODE)[0];
                oReturnObject[DefaultSettingsEntities.PLANT] = Array.slice(result.TT_PLANT)[0];
                oReturnObject[DefaultSettingsEntities.CURRENCY] = Array.slice(result.TT_REPORT_CURRENCY)[0];
                oReturnObject[DefaultSettingsEntities.COMPONENT_SPLIT] = Array.slice(result.TT_COMPONENT_SPLIT)[0];
                oReturnObject[DefaultSettingsEntities.COSTING_SHEET] = Array.slice(result.TT_COSTING_SHEET)[0];

            } catch (e) {
                const sLogMessage = `Error when procedure ${ Procedures.default_settings_read } is called.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
            }
        }

        return oReturnObject;
    };

    /**
	 * Function to create default settings
	 *
	 * @param oDefaultSettings {object} - object passed in request
	 * @param sType {string} - the type of default_settings (global or user)
	 * @param sUserId {string} - the logged user
	 * 
	 * @throws {PlcException} - if the type is unknown
	 *
	 * @returns {object} oReturnObject - object containing the created default_settings
	 */
    this.create = async function (oDefaultSettings, sType, sUserId) {

        var oResult = {};
        await checkDefaultSettingsEntity(oDefaultSettings);

        var oEntity = _.clone(oDefaultSettings);
        var oSettings = {
            TABLE: Tables.defaultSettings,
            PROPERTIES_TO_EXCLUDE: [],
            GENERATED_PROPERTIES: []
        };

        //for masterdata columns - check existence in the relevant table
        await checkAllRelevantMasterdataEntriesExist(oEntity);

        switch (sType) {
        case 'global':
            oEntity.USER_ID = '';
            oResult = that.helper.insertNewEntity(oEntity, oSettings);
            break;
        case 'user':
            oEntity.USER_ID = sUserId;
            oResult = that.helper.insertNewEntity(oEntity, oSettings);
            break;
        default: {
                await throwWrongSettingException();
            }
        }

        return oDefaultSettings;
    };

    /**
 	 * Delete default settings
 	 *
 	 * @param   {string} sMasterDataDate  - master data timestamp
 	 * @returns {string} sUserId          - return userid
 	 */
    this.removeDefaultSettings = async function (sType, sUserId) {

        switch (sType) {
        case 'global': {
                const oDeleteStatement = hQuery.statement('delete from "' + Tables.defaultSettings + "\" where USER_ID = ''");
                await oDeleteStatement.execute();
                break;
            }
        case 'user': {
                const oDeleteStatement = hQuery.statement('delete from "' + Tables.defaultSettings + '" where USER_ID = ?');
                await oDeleteStatement.execute(sUserId);
                break;
            }
        default: {
                await throwWrongSettingException();
            }
        }

        return sUserId;

    };

    /**
	 * Function to update default settings
	 *
	 * @param oDefaultSettings {object} - object passed in request
	 * @param sType {string} - the type of default_settings (global or user)
	 * @param sUserId {string} - the logged user
	 * 
	 * @throws {PlcException} - if the type is unknown
	 * @throws {PlcException} - if update does not succeed
	 *
	 * @returns {object} oReturnObject - object containing the updated default_settings
	 */
    this.update = async function (oDefaultSettings, sType, sUserId) {

        var iAffectedRows;

        await checkDefaultSettingsEntity(oDefaultSettings);

        var oEntity = _.clone(oDefaultSettings);

        //for masterdata columns - check existence in the relevant table
        await checkAllRelevantMasterdataEntriesExist(oEntity);

        oDefaultSettings.CONTROLLING_AREA_ID = oDefaultSettings.CONTROLLING_AREA_ID || '';
        oDefaultSettings.COMPANY_CODE_ID = oDefaultSettings.COMPANY_CODE_ID || '';
        oDefaultSettings.PLANT_ID = oDefaultSettings.PLANT_ID || '';
        oDefaultSettings.REPORT_CURRENCY_ID = oDefaultSettings.REPORT_CURRENCY_ID || '';
        oDefaultSettings.COMPONENT_SPLIT_ID = oDefaultSettings.COMPONENT_SPLIT_ID || '';
        oDefaultSettings.COSTING_SHEET_ID = oDefaultSettings.COSTING_SHEET_ID || '';

        switch (sType) {
        case 'global': {
                const oUpdateStatement = hQuery.statement('update "' + Tables.defaultSettings + "\" set CONTROLLING_AREA_ID = ?, COMPANY_CODE_ID = ?, PLANT_ID = ?, REPORT_CURRENCY_ID = ?, COMPONENT_SPLIT_ID = ?, COSTING_SHEET_ID = ? where USER_ID = ''");
                iAffectedRows = await oUpdateStatement.execute(oDefaultSettings.CONTROLLING_AREA_ID, oDefaultSettings.COMPANY_CODE_ID, oDefaultSettings.PLANT_ID, oDefaultSettings.REPORT_CURRENCY_ID, oDefaultSettings.COMPONENT_SPLIT_ID, oDefaultSettings.COSTING_SHEET_ID);
                break;
            }
        case 'user': {
                const oUpdateStatement = hQuery.statement('update "' + Tables.defaultSettings + '" set CONTROLLING_AREA_ID = ?, COMPANY_CODE_ID = ?, PLANT_ID = ?, REPORT_CURRENCY_ID = ?, COMPONENT_SPLIT_ID = ?, COSTING_SHEET_ID = ? where USER_ID = ?');
                iAffectedRows = await oUpdateStatement.execute(oDefaultSettings.CONTROLLING_AREA_ID, oDefaultSettings.COMPANY_CODE_ID, oDefaultSettings.PLANT_ID, oDefaultSettings.REPORT_CURRENCY_ID, oDefaultSettings.COMPONENT_SPLIT_ID, oDefaultSettings.COSTING_SHEET_ID, sUserId);
                break;
            }
        default: {
                const sLogMessage = `The type of default settings can be only global or user.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        if (iAffectedRows != 1) {
            const sLogMessage = `Entry does not exist or corrupted query/database state: modified ${ iAffectedRows } database records in ${ Tables.defaultSettings }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        return oDefaultSettings;
    };

    /**
	 * Check if there exists an entry for the specified type/user - used in the read function
	 *
	 * @param sType {string} - the type of default_settings (global or user)
	 * @param sUserId {string} - the logged user
	 * 
	 * @throws {PlcException} - if the type is unknown
	 *
	 * @returns {integer} - number of found entries
	 */
    async function checkEntryExists(sType, sUserId) {
        var aEntryExists = null;

        switch (sType) {
        case 'global':
            aEntryExists = await hQuery.statement('select count(*) as COUNT from "' + Tables.defaultSettings + "\" where USER_ID = ''").execute();
            break;
        case 'user':
            aEntryExists = await hQuery.statement('select count(*) as COUNT from "' + Tables.defaultSettings + '" where USER_ID = ?').execute(sUserId);
            break;
        default: {
                await throwWrongSettingException();
            }
        }

        return aEntryExists[0].COUNT;
    }

    /**
	 * Check if all valid masterdata entries from entity table exist in the corresponding tables
	 *
	 * @param oEntity {object} 	 - object passed in request
	 * 
	 */
    async function checkAllRelevantMasterdataEntriesExist(oDefaultSettings) {
        var sMasterDataDate = new Date();

        if (!helpers.isNullOrUndefined(oDefaultSettings.CONTROLLING_AREA_ID) && oDefaultSettings.CONTROLLING_AREA_ID !== '') {
            const aFieldsMainPlcTable = ['CONTROLLING_AREA_ID'];
            const aKeyFieldsRefObjectPlcTable = ['CONTROLLING_AREA_ID'];
            const aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oDefaultSettings);
            const oControllingArea = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);

            apiHelpers.checkObjectExists(oControllingArea, sMasterDataDate, BusinessObjectTypes.ControllingArea, hQuery);
        }

        if (!helpers.isNullOrUndefined(oDefaultSettings.COMPANY_CODE_ID) && oDefaultSettings.COMPANY_CODE_ID !== '') {
            const aFieldsMainPlcTable = ['COMPANY_CODE_ID'];
            const aKeyFieldsRefObjectPlcTable = ['COMPANY_CODE_ID'];
            const aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oDefaultSettings);
            const oCompanyCode = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);

            apiHelpers.checkObjectExists(oCompanyCode, sMasterDataDate, BusinessObjectTypes.CompanyCode, hQuery);
        }

        if (!helpers.isNullOrUndefined(oDefaultSettings.PLANT_ID) && oDefaultSettings.PLANT_ID !== '') {
            const aFieldsMainPlcTable = ['PLANT_ID'];
            const aKeyFieldsRefObjectPlcTable = ['PLANT_ID'];
            const aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oDefaultSettings);
            const oPlant = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);

            apiHelpers.checkObjectExists(oPlant, sMasterDataDate, BusinessObjectTypes.Plant, hQuery);
        }

        if (!helpers.isNullOrUndefined(oDefaultSettings.COSTING_SHEET_ID) && oDefaultSettings.COSTING_SHEET_ID !== '') {
            const aFieldsMainPlcTable = ['COSTING_SHEET_ID'];
            const aKeyFieldsRefObjectPlcTable = ['COSTING_SHEET_ID'];
            const aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oDefaultSettings);
            const oCostingSheet = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);

            apiHelpers.checkObjectExists(oCostingSheet, sMasterDataDate, BusinessObjectTypes.CostingSheet, hQuery);
        }

        if (!helpers.isNullOrUndefined(oDefaultSettings.COMPONENT_SPLIT_ID) && oDefaultSettings.COMPONENT_SPLIT_ID !== '') {
            const aFieldsMainPlcTable = ['COMPONENT_SPLIT_ID'];
            const aKeyFieldsRefObjectPlcTable = ['COMPONENT_SPLIT_ID'];
            const aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oDefaultSettings);
            const oComponentSplit = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);

            apiHelpers.checkObjectExists(oComponentSplit, sMasterDataDate, BusinessObjectTypes.ComponentSplit, hQuery);
        }
    }
}

DefaultSettings.prototype = Object.create(DefaultSettings.prototype);
DefaultSettings.prototype.constructor = DefaultSettings;
export default {Helper,_,helpers,apiHelpers,DefaultSettingsEntities,BusinessObjectTypes,MessageLibrary,PlcException,Message,Code,Tables,Procedures,DefaultSettings};
