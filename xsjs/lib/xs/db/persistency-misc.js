const _ = require('lodash');
const Session = require('./persistency-session').Session;
const helpers = require('../util/helpers');
const constants = require('../util/constants');
const Resources = require('../util/masterdataResources').MasterdataResource;
const BusinessObjectTypes = constants.BusinessObjectTypes;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

var Tables = Object.freeze({
    calculation: 'sap.plc.db::basis.t_calculation',
    calculation_version: 'sap.plc.db::basis.t_calculation_version',
    calculation_version_temporary: 'sap.plc.db::basis.t_calculation_version_temporary',
    costing_sheet: 'sap.plc.db::basis.t_costing_sheet',
    costing_sheet__text: 'sap.plc.db::basis.t_costing_sheet__text',
    costing_sheet_row: 'sap.plc.db::basis.t_costing_sheet_row',
    costing_sheet_row__text: 'sap.plc.db::basis.t_costing_sheet_row__text',
    component_split: 'sap.plc.db::basis.t_component_split',
    component_split__text: 'sap.plc.db::basis.t_component_split__text',
    system_message: 'sap.plc.db::basis.t_system_message',
    group: 'sap.plc.db::basis.t_side_panel_group',
    lock: 'sap.plc.db::basis.t_lock',
    language: 'sap.plc.db::basis.t_language',
    default_settings: 'sap.plc.db::basis.t_default_settings',
    application_timeout: 'sap.plc.db::basis.t_application_timeout',
    session: 'sap.plc.db::basis.t_session',
    auto_complete_user: 'sap.plc.db::basis.t_auto_complete_user'
});

async function Misc($, hQuery, sUserId, dbConnection) {
    this.session = await new Session($, dbConnection, hQuery);
    var sessionTimeout = constants.ApplicationTimeout.SessionTimeout;
    var that = this;

    /**
	 * Determines available languages in a given text table (__text table or
	 * replication table). The function looks if the given *<code>sPreferredLanguage</code>
	 * is available; if *<code>sPreferredLanguage</code> it's not available,
	 * it uses the given array of fallback languages or as last resort, the
	 * first available language.
	 * 
	 * @param {string}
	 *            sTableName - The name of the table for which the available
	 *            language shall be determined.
	 * @param {string}
	 *            sPreferredLanguage - The DIN language code (e.g., EN, DE, ...)
	 *            for the preferred language.
	 * @returns {string} - The DIN or ISO language code of the available
	 *          language in the given table
	 */
    this.determineAvailableLanguage = async function (sTableName, sPreferredLanguage) {

        var sLanguageFieldname = '';

        if (!_.isString(sPreferredLanguage) || sPreferredLanguage.length === 0) {
            const sLogMessage = `sPreferredLanguage has to be a string (length > 0), but was: ${ typeof sPreferredLanguage }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        if (!_.isString(sTableName) || sTableName.length === 0) {
            const sLogMessage = `sTableName has to be a string (length > 0), but was: ${ sTableName }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        // find which language field is used in the table(LANGU/LANGUAGE)
        sLanguageFieldname = this.determineLanguageField(sTableName);

        if (sLanguageFieldname == '') {
            const sLogMessage = `There is no language field in table ${ sTableName }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        // get all languages from the text table
        var allLanguagesStmt = null;
        if (sTableName.indexOf('"') == -1) {
            allLanguagesStmt = hQuery.statement(['select distinct ' + sLanguageFieldname + ' from "' + sTableName + '"'].join(' '));
        } else {
            // when the integration tests are done, the table has already "
            // (e.g: "I055799"."table__text")
            allLanguagesStmt = hQuery.statement(['select distinct ' + sLanguageFieldname + ' from ' + sTableName].join(' '));
        }
        var aAllLanguagesWithProperies = await allLanguagesStmt.execute();

        // create an array with the language property (from aAllLanguagesWithProperies)
        var aAllLanguages = _.map(aAllLanguagesWithProperies, sLanguageFieldname);

        // create an array with strategy languages
        var aFallbackLanguages = constants.FallbackLanguages;

        var aLanguagesConformStrategy = new Array();
        aLanguagesConformStrategy[0] = sPreferredLanguage;
        aLanguagesConformStrategy[1] = aFallbackLanguages[0];// EN
        aLanguagesConformStrategy[2] = aFallbackLanguages[1];// DE

        for (var i = 0; i < aLanguagesConformStrategy.length; i++) {
            if (_.includes(aAllLanguages, aLanguagesConformStrategy[i])) {
                return aLanguagesConformStrategy[i];
            }
        }

        // return first language, if no language was found
        return aAllLanguages[0];

    };

    /**
	 * Determines the language field used in a given text table (__text table or
	 * replication table).
	 * 
	 * @param {string}
	 *            sTableName - The name of the table for which the language
	 *            field shall be determined.
	 * @returns {string} - The the language field name
	 */
    this.determineLanguageField = async function (sTableName) {

        var aLanguageFields = constants.LanguageFields; // Array of possible language fields

        if (!_.isString(sTableName) || sTableName.length === 0) {
            const sLogMessage = `sTableName has to be a string (length > 0), but was: ${ sTableName }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        // check if it's a plc text table
        if (_.endsWith(sTableName, '__text') || _.endsWith(sTableName, '__text"')) {
            return aLanguageFields[1];
        }

        // get all erp text tables
        var aAllObjects = _.keys(Resources);
        var aTables = [];
        _.each(aAllObjects, function (sObjectName, iIndex) {
            if (Resources[sObjectName].dbobjects.erpTextTable != '') {
                aTables.push(Resources[sObjectName].dbobjects.erpTextTable);
            }
        });

        if (_.includes(aTables, sTableName)) {
            return aLanguageFields[0];
        }

        return '';

    };

    /**
	 * Gets all the system messages that exist in the table t_system_message
	 * depending on language.
	 * 
	 * @param {string}
	 *            sIsoLanguage - The user language
	 * @returns {object} systemMessage - the existing system message
	 *          encapsulated in an anonymous object
	 * @returns {string} systemMessage.message - the content of the
	 *          systemMessage
	 */
    this.getSystemMessages = async function (sIsoLanguage) {
        if (!_.isString(sIsoLanguage)) {
            const sLogMessage = `sIsoLanguage must be a string, but was: ${ sIsoLanguage }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        var sDefaultLanguage = 'EN';
        var sAvailableLanguage = sIsoLanguage;

        var stmt = hQuery.statement('select top 1 message from "' + Tables.system_message + '" where language = (select ifnull(max(language),?)' + ' from "' + Tables.system_message + '" where language = ?)');
        var result = await stmt.execute(sDefaultLanguage, sAvailableLanguage);
        return result;
    };

    /**
	 * Returns the content of SYS.DUMMY. This is used as a Persistency and
	 * database test to check if the index server is available.
	 * 
	 * @returns {object} - SYS.DUMMY contains an "X" in the first column and row
	 */
    this.ping = async function () {
        return await hQuery.statement('select * from "SYS"."DUMMY"').execute();
    };

    /**
	 * Gets all groups that exist in the table t_side_panel_group depending on login
	 * language.
	 * 
	 * @returns {array} aGroups - array of objects containing the existing
	 *          groups
	 */
    this.getSidePanelGroups = async function () {

        var stmt = hQuery.statement([
            'select SIDE_PANEL_GROUP_ID, SIDE_PANEL_GROUP_DISPLAY_ORDER, RESOURCE_KEY_GROUP_DESCRIPTION',
            '  from "' + Tables.group + '"'
        ].join(' '));
        var aGroups = await stmt.execute();
        return aGroups;
    };

    /**
	 * Returns the specified objects which are locked by any user, excluding the
	 * specified one
	 * 
	 * @param {string}
	 *            sObject - the object that needs to be verified if it's locked
	 * @param {string}
	 *            sUserId - the current user
	 * @param {boolean}
	 *            bIncludingCurrentUser - take into account the current user
	 *  
	 * @returns {array} - the locked objects and the user who locked them
	 */
    this.getLock = async function (sObject, sUserId, bIncludingCurrentUser) {

        // delete timed out session in case it locks the required resource
        var oStatementDelete = hQuery.statement([
            'delete from  "' + Tables.session + '"',
            ' where user_id in (select "USER_ID" from "' + Tables.lock + '"',
            ' where LOCK_OBJECT = ?) and SECONDS_BETWEEN(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP)> ',
            '( select "VALUE_IN_SECONDS" from "' + Tables.application_timeout + '" where APPLICATION_TIMEOUT_ID =?)'
        ].join(' '));
        await oStatementDelete.execute(sObject, sessionTimeout);


        that.session.deleteOutdatedEntries();

        var stmt = 'select LOCK_OBJECT, USER_ID, LAST_UPDATED_ON from "' + Tables.lock + '" where LOCK_OBJECT = ?';

        if (helpers.isNullOrUndefined(bIncludingCurrentUser) || bIncludingCurrentUser === false) {
            stmt += ' and USER_ID != ?';
            return await hQuery.statement(stmt).execute(sObject, sUserId);
        }

        return await hQuery.statement(stmt).execute(sObject);
    };












    this.getLockingUsers = async function (sObject, sUserId) {

        var oSelectStatement = hQuery.statement([
            'select SESSION_ID, USER_ID, LANGUAGE, LAST_ACTIVITY_TIME from  "' + Tables.session + '"',
            ' where user_id in (select "USER_ID" from "' + Tables.lock + '"',
            ' where LOCK_OBJECT = ? and USER_ID != ?) and SECONDS_BETWEEN(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP)<= ',
            '( select "VALUE_IN_SECONDS" from "' + Tables.application_timeout + '" where APPLICATION_TIMEOUT_ID =?)'
        ].join(' '));
        var aLockingUsers = await oSelectStatement.execute(sObject, sUserId, sessionTimeout);
        return aLockingUsers;
    };





    this.lockTableTLockExclusive = async function () {
        try {
            var stmt = hQuery.statement('lock table "' + Tables.lock + '" in exclusive mode ');
            await stmt.execute();
        } catch (e) {
			// TO DO , this can happened only if 2 times the lock is called for same user ( do nothing or implement some check here from M_TABLE_LOCKS ) - I309362
		        }

    };










    this.setLock = function (sObject, sUserId) {
        var oStatementDelete;

        if (sObject !== BusinessObjectTypes.Metadata) {

            oStatementDelete = `delete from  "${ Tables.session }" where USER_ID in (select USER_ID from "${ Tables.lock }" where LOCK_OBJECT = ?) 
								and SECONDS_BETWEEN(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP)> ( select VALUE_IN_SECONDS from "${ Tables.application_timeout }"  where APPLICATION_TIMEOUT_ID =?) 
								and USER_ID != ?`;
            await dbConnection.executeUpdate(oStatementDelete, sObject, sessionTimeout, sUserId);
        } else {

            oStatementDelete = `delete from  "${ Tables.session }"
								where SECONDS_BETWEEN(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP)> 
				                ( select VALUE_IN_SECONDS from "${ Tables.application_timeout }" where APPLICATION_TIMEOUT_ID = ?) and USER_ID != ?`;
            await dbConnection.executeUpdate(oStatementDelete, sessionTimeout, sUserId);
        }


        that.session.deleteOutdatedEntries();

        var stmt = `select LOCK_OBJECT, USER_ID, LAST_UPDATED_ON from "${ Tables.lock }" where LOCK_OBJECT = ?`;
        var aLock = await dbConnection.executeQuery(stmt, sObject);


        if (aLock.length === 0) {
            var stmtLock = `insert into "${ Tables.lock }" (LOCK_OBJECT, USER_ID, LAST_UPDATED_ON) values(?, ?, ?)`;
            await dbConnection.executeUpdate(stmtLock, sObject, sUserId, new Date());
        }
    };







    this.releaseLock = async function (sUserId) {

        var stmt = hQuery.statement('select count(*) as rowcount from "' + Tables.lock + '" where USER_ID = ?');
        var aCount = await stmt.execute(sUserId);
        var iRowCount = parseInt(aCount[0].ROWCOUNT, 10);
        if (iRowCount > 0) {
            try {
                stmt = `delete from "${ Tables.lock }" where USER_ID = ?`;
                await dbConnection.executeUpdate(stmt, sUserId);
            } catch (e) {
                var oMessageDetails = new MessageDetails();
                const sLogMessage = `Error during release lock.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails, undefined, e);
            }
        }
        console.log('successed release lock');
        return iRowCount;
    };









    this.getDefaultSettings = async function (sUserId) {
        try {

            var stmt = hQuery.statement('select * from "' + Tables.default_settings + '" where USER_ID = ?');
            var userSettings = await stmt.execute(sUserId);

            stmt = hQuery.statement('select * from "' + Tables.default_settings + "\" where USER_ID = ''");
            var globalSettings = await stmt.execute();

            var result = {};




            if (userSettings.length > 0 && !helpers.isNullOrUndefined(userSettings[0]) && userSettings[0].CONTROLLING_AREA_ID !== '' && !helpers.isNullOrUndefined(userSettings[0].CONTROLLING_AREA_ID)) {
                result = userSettings[0];
            } else if (globalSettings.length > 0 && !helpers.isNullOrUndefined(globalSettings[0]) && globalSettings[0].CONTROLLING_AREA_ID !== '' && !helpers.isNullOrUndefined(globalSettings[0].CONTROLLING_AREA_ID)) {
                result = globalSettings[0];
            }


            if (!helpers.isNullOrUndefined(userSettings[0]) && !helpers.isNullOrUndefined(userSettings[0].REPORT_CURRENCY_ID) && userSettings[0].REPORT_CURRENCY_ID !== '') {
                result.REPORT_CURRENCY_ID = userSettings[0].REPORT_CURRENCY_ID;
            } else if (!helpers.isNullOrUndefined(globalSettings[0]) && !helpers.isNullOrUndefined(globalSettings[0].REPORT_CURRENCY_ID) && globalSettings[0].REPORT_CURRENCY_ID !== '') {
                result.REPORT_CURRENCY_ID = globalSettings[0].REPORT_CURRENCY_ID;
            }

            return _.omit(result, 'USER_ID');
        } catch (e) {
            var oMessageDetails = new MessageDetails();
            const sClientMsg = 'Error during getting default settings.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }`;
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
        }
    };






    this.getActiveUsers = async function () {
        return await hQuery.statement('select a.USER_ID, a.LANGUAGE, TO_DOUBLE(SECONDS_BETWEEN ( a.LAST_ACTIVITY_TIME , CURRENT_UTCTIMESTAMP ) ) as SECONDS_BETWEEN' + ' FROM  "sap.plc.db::basis.t_session" AS a, ' + ' "sap.plc.db::basis.t_application_timeout" AS b ' + " WHERE   b.APPLICATION_TIMEOUT_ID = 'SessionTimeout' AND " + ' SECONDS_BETWEEN ( a.LAST_ACTIVITY_TIME , CURRENT_UTCTIMESTAMP ) < b.VALUE_IN_SECONDS AND ' + ' a.LAST_ACTIVITY_TIME < CURRENT_UTCTIMESTAMP AND' + ' a.USER_ID <> ? ').execute(sUserId);
    };

    this.getActiveJobs = () => {
        return await hQuery.statement(`select JOB_NAME, FIRED_TIME FROM "sap.plc.db::map.t_scheduler_log" where state='RUNNING'`).execute();
    };

    this.setHQuery = function (oHQuery) {
        hQuery = oHQuery;
    };


    this.getPLCUsers = function (sSearchAutoComplete, iTop) {
        var aUsers = [];
        var stmt = `select top ? DISTINCT USER_ID from  "${ Tables.auto_complete_user }" where lower(USER_ID) like lower(?) ORDER BY USER_ID`;


        aUsers = await dbConnection.executeQuery(stmt, iTop, sSearchAutoComplete + '%');

        return aUsers;
    };
}
Misc.prototype = Object.create(Misc.prototype);
Misc.prototype.constructor = Misc;


module.exports.Tables = Tables;
module.exports.Misc = Misc;
export default {_,Session,helpers,constants,Resources,BusinessObjectTypes,MessageLibrary,PlcException,Code,MessageDetails,Tables,Misc};
