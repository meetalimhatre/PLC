const _ = require('lodash');
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

var Tables = await Object.freeze({
    item_temporary: 'sap.plc.db::basis.t_item_temporary',
    item_temporary_ext: 'sap.plc.db::basis.t_item_temporary_ext',
    calculation_version_temporary: 'sap.plc.db::basis.t_calculation_version_temporary',
    calculation_version: 'sap.plc.db::basis.t_calculation_version',
    open_projects: 'sap.plc.db::basis.t_open_projects',
    calculation: 'sap.plc.db::basis.t_calculation',
    open_calculation_versions: 'sap.plc.db::basis.t_open_calculation_versions',
    session: 'sap.plc.db::basis.t_session',
    application_timeout: 'sap.plc.db::basis.t_application_timeout',
    lock: 'sap.plc.db::basis.t_lock',
    gtt_item_temporary: 'sap.plc.db::basis.gtt_item_temporary',
    gtt_item_changed_active_state: 'sap.plc.db::temp.gtt_item_changed_active_state',
    gtt_item_temporary_with_masterdata_custom_fields: 'sap.plc.db::basis.gtt_item_temporary_with_masterdata_custom_fields',
    gtt_reference_calculation_version_items: 'sap.plc.db::temp.gtt_reference_calculation_version_items',
    gtt_changed_items: 'sap.plc.db::temp.gtt_changed_items',
    t_item_ids: 'sap.plc.db::temp.t_item_ids',
    gtt_calculation_ids: 'sap.plc.db::temp.gtt_calculation_ids',
    gtt_calculation_version_ids: 'sap.plc.db::temp.gtt_calculation_version_ids',
    gtt_item_ids: 'sap.plc.db::temp.gtt_item_ids',
    user_activity: 'sap.plc.db::basis.t_user_activity',
    gtt_masterdata_validator: 'sap.plc.db::temp.gtt_masterdata_validator'
});

function Session($, dbConnection, hQuery) {
    var oMessageDetails = new MessageDetails();

    /**
     * Gets the session details for of a given session and user.
     *
     * @param {string}
     *            sSessionId - the id of the session for which the details shall be retrieved
     * @param {string}
     *            sUserId - the id of the user for which the session details shall be retrieved
     * @throws {@link PlcException}
     *             if sSessionId or sUserId are not strings
     * @returns {object} sessionData - the session details encapsulated in an anonymous object
     * @returns {string} sessionData.userId - the userId of the session data
     * @returns {string} sessionData.sessionId - the sessionId of the session data
     * @returns {string} sessionData.language - the language defined by the user for the session
     */

    this.getSessionDetails = async function (sSessionId, sUserId) {
        oMessageDetails.addUserObj({ id: sUserId });

        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        const oSessionDetailsStmt = hQuery.statement(`select user_id, session_id, "LANGUAGE", "LAST_ACTIVITY_TIME",
                    seconds_between(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP) as LIFETIME
                    from "${ Tables.session }"
                    where user_id = ? and session_id = ?
        `);
        var aSessionDetailsResult = await oSessionDetailsStmt.execute(sUserId, sSessionId);

        if (aSessionDetailsResult.length === 0) {
            const sLogMessage = 'No session record found (session not initialized?).';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_SESSION_NOT_FOUND_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (aSessionDetailsResult.length > 1) {
            const found = 'Found more than one session record (corrupted query or database?).';
            $.trace.error(found);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, found, oMessageDetails);
        }

        var oReturnObject = {
            userId: aSessionDetailsResult[0].USER_ID,
            sessionId: aSessionDetailsResult[0].SESSION_ID,
            language: aSessionDetailsResult[0].LANGUAGE,
            lastActivityTime: aSessionDetailsResult[0].LAST_ACTIVITY_TIME,
            lifetime: aSessionDetailsResult[0].LIFETIME
        };
        return oReturnObject;
    };

    /**
     * Checks whether a session is opened
     *
     * @param {string}
     *            sSessionId - the id of the session that should be checked
     * @param {string}
     *            sUserId - the id of the user that should be checked
     * @param {string}
     *            sSessionId - the session id
     * @returns {Boolean} true if session is opened, otherwise false
     */
    this.isSessionOpened = async function (sSessionId, sUserId) {
        oMessageDetails.addUserObj({ id: sUserId });

        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        // we expect only one session for one user
        var oCheckSessionStatement = hQuery.statement([
            'select count(*)  as rowcount from  "' + Tables.session + '"',
            '  where session_id = ? and user_id = ?'
        ].join(' '));
        var aCount = await oCheckSessionStatement.execute(sSessionId, sUserId);

        // check if no other entries found
        var iRowCount = parseInt(aCount[0].ROWCOUNT, 10);
        if (aCount.length === 0 || aCount.length > 1 || iRowCount > 1) {
            const sClientMsg = 'Corrupted query or database state: found more than 1 session entries for session.';
            const sServerMsg = `${ sClientMsg } Session id: ${ sSessionId }, user id: ${ sUserId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        return iRowCount === 1;
    };

    /**
     * Updates the session identifier and take over the session data whenever the current user had data (e.g.
     * Calculation Version) open in another session.
     *
     * @param {string}
     *            sSessionId - the current session identifier
     * @param {string}
     *            sUserId - the current user identifier
     * @throws {PlcException} -
     *             whenever sSessionId or sUserId is not a string
     */
    this.updateSessionForOpenCalculationVersion = async function (sSessionId, sUserId) {
        oMessageDetails.addUserObj({ id: sUserId });

        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        // updates the session data in specific tables whenever an old session exist for the given user
        var oUpdateStatement = hQuery.statement('update "' + Tables.item_temporary + '"' + ' set SESSION_ID = ? WHERE session_id IN ( ' + ' SELECT session_id FROM "' + Tables.session + '"  WHERE UCASE(user_id) = ?)');
        await oUpdateStatement.execute(sSessionId, sUserId.toUpperCase());

        oUpdateStatement = hQuery.statement('update "' + Tables.calculation_version_temporary + '"' + ' set SESSION_ID = ? WHERE session_id IN ( ' + ' SELECT session_id FROM "' + Tables.session + '" WHERE UCASE(user_id) = ?)');
        await oUpdateStatement.execute(sSessionId, sUserId.toUpperCase());

        oUpdateStatement = hQuery.statement('update "' + Tables.open_calculation_versions + '"' + ' set SESSION_ID = ? WHERE session_id IN ( ' + ' SELECT session_id FROM "' + Tables.session + '" WHERE UCASE(user_id) = ?)');
        await oUpdateStatement.execute(sSessionId, sUserId.toUpperCase());

    };

    this.releaseLockTable = sObject => {
        dbConnection.executeUpdate(`DELETE FROM "${ Tables.lock }"
                               WHERE LOCK_OBJECT = ?`, sObject);
    };

    /**
     * Inserts new session details for the given user when no session for the current user exists. Otherwise the session
     * details will be updated, so that only one active session must exist per user.
     *
     * @param {string}
     *            sSessionId - the current session identifier
     * @param {string}
     *            sUserId - the current user identifier
     * @param {string}
     *            sIsoLanguage - the preferred user language
     * @throws {PlcException} -
     *             whenever sSessionId or sUserId or sIsoLanguage is not a string
     */
    this.upsertSession = async function (sSessionId, sUserId, sIsoLanguage) {
        oMessageDetails.addUserObj({ id: sUserId });
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sIsoLanguage)) {
            const sLogMessage = 'sIsoLanguage must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        var oUpsertStatement = hQuery.statement('upsert "' + Tables.session + '" values (?, ?, ?, ?) where UCASE(USER_ID) = ?');
        try {
            await oUpsertStatement.execute(sSessionId, sUserId, sIsoLanguage.toUpperCase(), new Date(), sUserId);
        } catch (e) {
            const sClientMsg = 'Updating or inserting session failed.';
            const sServerMsg = `${ sClientMsg } Session id: ${ sSessionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
        }

    };

    /**
     * Deletes session. Also deletes the locks associated with the session.
     *
     * @param {string}
     *            sSessionId - the current session identifier
     * @throws {PlcException} -
     *             whenever sSessionId is not a string
     * @throws {PlcException} -
     *             there are opened calculation versions in the session
     */
    this.deleteSession = async function (sSessionId, sUserId) {
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        //check if opened calculation versions exist
        var oCheckCalVersionStatement = hQuery.statement('select session_id, calculation_version_id, is_writeable from "' + Tables.open_calculation_versions + '" where session_id=?');
        var aOpenCalculation = await oCheckCalVersionStatement.execute(sSessionId);
        if (aOpenCalculation.length > 0) {
            // only log this warning
            const sLogMessage = `Found 1 or more opened calculation versions for session ${ sSessionId }`;
            await $.trace.info(sLogMessage);
        }

        var sessionDeleteStmt = hQuery.statement('delete  from  "' + Tables.session + '" where session_id = ?');
        var iSessionDeleteResult = await sessionDeleteStmt.execute(sSessionId);

        //delete locks
        await hQuery.statement('delete  from  "' + Tables.lock + '" where user_id = ?').execute(sUserId);

        return iSessionDeleteResult;
    };

    /**
     * Updates the LAST ACTIVITY TIME for a given session and user id.
     *
     * @param {string}
     *            sSessionId - the current session identifier
     * @param {string}
     *            sUserId - the current user identifier
     * @throws {PlcException} -
     *             whenever sSessionId or sUserId is not a string
     * @throws {PlcException} -
     *             if no session was found in the session table
     */
    this.updateLastActivity = async function (sSessionId, sUserId) {
        oMessageDetails.addUserObj({ id: sUserId });
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        const iAffectedRows = dbConnection.executeUpdate(`update "${ Tables.session }" set LAST_ACTIVITY_TIME = CURRENT_UTCTIMESTAMP where SESSION_ID = ? and USER_ID = ?`, sSessionId, sUserId);
        if (iAffectedRows === 0) {
            const sClientMsg = 'Session not found in the database.';
            const sServerMsg = `${ sClientMsg } Session id: ${ sSessionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        } else if (iAffectedRows > 1) {
            const sClientMsg = 'Corrupted query or database state: update LAST_ACTIVITY_TIME for session failed.';
            const sServerMsg = `${ sClientMsg } Session id: ${ sSessionId }, user id: ${ sUserId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }
        return;
    };

    /**
     * Updates the LAST User ACTIVITY TIME for a given user id.
     *
     * @param {string}
     *            sUserId - the current user identifier
     * @throws {PlcException} -
     *             whenever sSessionId or sUserId is not a string
     */
    this.updateLastUserActivity = async function (sUserId, sCurrentDate) {
        oMessageDetails.addUserObj({ id: sUserId });
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        const iAffectedRows = dbConnection.executeUpdate(`upsert "${ Tables.user_activity }" (USER_ID, LAST_ACTIVITY_TIME)
            values (?, ?) 
            where USER_ID = ? and LAST_ACTIVITY_TIME between (ADD_MONTHS(NEXT_DAY(LAST_DAY(?)),-1))
            and (ADD_NANO100(NEXT_DAY(LAST_DAY(?)),-1))`, sUserId, sCurrentDate, sUserId, sCurrentDate, sCurrentDate);
        if (iAffectedRows !== 1) {
            const sClientMsg = 'Corrupted query or database state: update LAST_ACTIVITY_TIME for user failed.';
            const sServerMsg = `${ sClientMsg } User id: ${ sUserId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }
        return;
    };

    /**
     * Deletes all the temporary data (locks and opened calculation versions) with no session in the session table.
     *
     * @param {string}
     *            sSessionId - the current session identifier
     * @param {string}
     *            sUserId - the current user identifier
     * @throws {PlcException} -
     *             whenever sSessionId or sUserId is not a string
     */
    this.deleteOutdatedEntries = function () {
        dbConnection.executeUpdate(`delete from "${ Tables.lock }" where USER_ID not in (select USER_ID FROM "${ Tables.session }")`);
        dbConnection.executeUpdate(`delete from "${ Tables.open_projects }" where SESSION_ID not in (select SESSION_ID FROM "${ Tables.session }")`);
        dbConnection.executeUpdate(`delete from "${ Tables.open_calculation_versions }" where SESSION_ID not in (select SESSION_ID FROM "${ Tables.session }")`);
        dbConnection.executeUpdate(`delete from "${ Tables.item_temporary }" where SESSION_ID not in (select SESSION_ID FROM "${ Tables.session }")`);
        dbConnection.executeUpdate(`delete from "${ Tables.calculation_version_temporary }" where SESSION_ID not in (select SESSION_ID FROM "${ Tables.session }")`);

        // this function is removing all temporary versions without a valid session_id; if a new calculation was created but clients don't close nor save the initially  
        // created temporary version, a calculation without any version is remaining in t_calculation; this happens if calculations get created but clients don't call
        // "close" for the initial version (external clients/AddIns); it's important to check t_calculation_version_temporary because if now, intial versions of calculations
        // created by other user, will also be deleted
        dbConnection.executeUpdate(`delete from "${ Tables.calculation }" 
		            where CALCULATION_ID not in (
		                select CALCULATION_ID from "${ Tables.calculation_version }"
		                union
		                select CALCULATION_ID from "${ Tables.calculation_version_temporary }"
		           )`);

        var bItemExtExists = dbConnection.executeQuery(`select table_name from "SYS"."TABLES" where schema_name=CURRENT_SCHEMA and table_name=? and is_user_defined_type=?`, Tables.item_temporary_ext, 'FALSE').length === 1;
        if (bItemExtExists) {
            dbConnection.executeUpdate(`delete from "${ Tables.item_temporary_ext }" where SESSION_ID not in (select SESSION_ID FROM "${ Tables.session }")`);
        }
    };


    /**
     * Deletes data from all the temporary tables
     *
     * @param {string}
     *            sSessionId - the current session identifier
     * @throws {PlcException} -
     *             whenever sSessionId is not a string
     */
    this.clearTemporaryTables = async function (sSessionId) {

        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        try {
            var deleteGttItemTemporaryStatement = hQuery.statement(`delete from "${ Tables.gtt_item_temporary }" where SESSION_ID = ?`);
            await deleteGttItemTemporaryStatement.execute(sSessionId);

            var deleteGttItemTemporaryWithMasterDataCustomFieldsStatement = hQuery.statement(`delete from "${ Tables.gtt_item_temporary_with_masterdata_custom_fields }" WHERE SESSION_ID = ?`);
            await deleteGttItemTemporaryWithMasterDataCustomFieldsStatement.execute(sSessionId);

            dbConnection.executeUpdate(`delete from "${ Tables.gtt_item_changed_active_state }"`);
            dbConnection.executeUpdate(`delete from "${ Tables.gtt_reference_calculation_version_items }"`);
            dbConnection.executeUpdate(`delete from "${ Tables.gtt_changed_items }"`);
            dbConnection.executeUpdate(`delete from "${ Tables.t_item_ids }"`);
            dbConnection.executeUpdate(`delete from "${ Tables.gtt_calculation_ids }"`);
            dbConnection.executeUpdate(`delete from "${ Tables.gtt_calculation_version_ids }"`);
            dbConnection.executeUpdate(`delete from "${ Tables.gtt_item_ids }"`);
            dbConnection.executeUpdate(`delete from "${ Tables.gtt_masterdata_validator }"`);
        } catch (e) {
            // when running fresh installation from web interface
            // it will throw an error since the tables do not exist   
            $.trace.error(e.message);
        }
    };
}

Session.prototype = await Object.create(Session.prototype);
Session.prototype.constructor = Session;


module.exports.Tables = Tables;
module.exports.Session = Session;
export default {_,MessageLibrary,PlcException,Code,MessageDetails,Tables,Session};
