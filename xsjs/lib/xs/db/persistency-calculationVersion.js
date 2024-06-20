const _ = require('lodash');
const helpers = require('../util/helpers');
const Helper = require('./persistency-helper').Helper;
const Misc = require('./persistency-misc').Misc;
const Session = require('./persistency-session').Session;
const BusinessObjectsEntities = require('../util/masterdataResources').BusinessObjectsEntities;
const BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;
const Metadata = require('./persistency-metadata').Metadata;
const constants = require('../util/constants');
const authorizationManager = require('../authorization/authorization-manager');
const InstancePrivileges = authorizationManager.Privileges;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

module.exports.Tables = Object.freeze({
    calculation: 'sap.plc.db::basis.t_calculation',
    calculation_version_temporary: 'sap.plc.db::basis.t_calculation_version_temporary',
    calculation_version: 'sap.plc.db::basis.t_calculation_version',
    component_split__text: 'sap.plc.db::basis.t_component_split__text',
    item: 'sap.plc.db::basis.t_item',
    status: 'sap.plc.db::basis.t_status',
    item_ext: 'sap.plc.db::basis.t_item_ext',
    item_temporary: 'sap.plc.db::basis.t_item_temporary',
    item_temporary_ext: 'sap.plc.db::basis.t_item_temporary_ext',
    item_calculated_values_costing_sheet: 'sap.plc.db::basis.t_item_calculated_values_costing_sheet',
    item_calculated_values_component_split: 'sap.plc.db::basis.t_item_calculated_values_component_split',
    open_calculation_versions: 'sap.plc.db::basis.t_open_calculation_versions',
    session: 'sap.plc.db::basis.t_session',
    application_timeout: 'sap.plc.db::basis.t_application_timeout',
    recent_calculation_versions: 'sap.plc.db::basis.t_recent_calculation_versions',
    project: 'sap.plc.db::basis.t_project',
    plant_text: 'sap.plc.db::basis.t_plant__text',
    material_text: 'sap.plc.db::basis.t_material__text',
    customer: 'sap.plc.db::basis.t_customer',
    gtt_calculation_ids: 'sap.plc.db::temp.gtt_calculation_ids',
    gtt_calculation_version_ids: 'sap.plc.db::temp.gtt_calculation_version_ids',
    variant_temporary: 'sap.plc.db::basis.t_variant_temporary',
    variant_item_temporary: 'sap.plc.db::basis.t_variant_item_temporary'
});

const Views = Object.freeze({ calculation_version_with_privileges: 'sap.plc.db.authorization::privileges.v_calculation_version_read' });

module.exports.Procedures = Object.freeze({
    calculation_version_copy: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_copy',
    calculation_version_open: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_open',
    calculations_versions_read: 'sap.plc.db.calculationmanager.procedures::p_calculations_versions_read',
    calculation_version_set_new_id: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_set_new_id',
    calculation_version_close: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_close',
    calculation_version_delete: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_delete',
    calculation_version_save: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_save',
    calculation_version_trigger_price_determination: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_trigger_price_determination',
    calculation_version_masterdata_timestamp_update: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_masterdata_timestamp_update',
    calculation: 'sap.plc.db.calcengine.procedures::p_calculation',
    calculation_save_results: 'sap.plc.db.calcengine.procedures::p_calculation_save_results',
    calculate_saved_calculation_version: 'sap.plc.db.calcengine.procedures::p_calculate_saved_calculation_version',
    calculation_version_reset_missing_nontemporary_masterdata: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_reset_missing_nontemporary_masterdata',
    referenced_calculation_version_read: 'sap.plc.db.calculationmanager.procedures::p_referenced_calculation_version_data_read',
    calculations_version_recover: 'sap.plc.db.calculationmanager.procedures::p_calculations_versions_recover',
    calculation_version_price_determination: 'sap.plc.db.calculationmanager.procedures::p_lifecycle_calculation_version_price_determination',
    item_custom_fields_currency_get: 'sap.plc.db.calculationmanager.procedures::p_item_custom_fields_currency_get'
});

const Sequences = Object.freeze({ calculation_version: 'sap.plc.db.sequence::s_calculation_version' });

const DefaultValues = Object.freeze({
    newEntityIsDirty: 1,
    newEntityIsWriteable: 1
});

async function CalculationVersion($, dbConnection, hQuery, sUserId) {
    const Tables = module.exports.Tables; // for easy mock in testing
    const Procedures = module.exports.Procedures; // for easy mock in testing

    this.sUserId = sUserId;
    this.helper = new Helper($, hQuery, dbConnection);
    this.misc = new Misc($, hQuery, sUserId);
    this.session = await new Session($, dbConnection, hQuery);

    // to avoid unnecessary import callings to improve performance, delay loading and creating of below objects
    Object.defineProperties(this, {
        item: {
            get: () => {
                return (async () => {
                    if (undefined === this._item) {
                        var Item = require('./persistency-item').Item;
                        this._item = await new Item($, dbConnection, hQuery, sUserId);
                    }
                    return this._item;
                })();
            }
        },
        administration: {
            get: () => {
                return (async () => {
                    if (undefined === this._administration) {
                        var Administration = $.import('xs.db', 'persistency-administration').Administration;
                        this._administration = await new Administration(dbConnection, hQuery);
                    }
                    return this._administration;
                })();
            }
        },
        variant: {
            get: () => {
                return (async () => {
                    if (undefined === this._variant) {
                        var Variant = require('./persistency-variant').Variant;
                        this._variant = await new Variant($, dbConnection, hQuery);
                    }
                    return this._variant;
                })();
            }
        }
    });

    var metadata = new Metadata($, hQuery, null, sUserId);
    var oMessageDetails = new MessageDetails();
    var sessionTimeout = constants.ApplicationTimeout.SessionTimeout;
    var that = this;

    async function checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId) {
        if (!helpers.isPositiveInteger(iCalculationVersionId)) {
            oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });
            const sLogMessage = 'iCalculationVersionId must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
    }

    /**
	 * Closes a calculation version by calling p_calculation_version_close.
	 *
	 * @param {int}
	 *            iCalculationVersionId - ID of the calculation version to close
	 * @param {string}
	 *            sSessionId - ID of the session, in which the calculation version to close is opened
	 * @throws {PlcException} -
	 *             If iCalculationVersionId or sSessionId are not set correctly
	 * @throws {PlcException} -
	 *             If the execution of the call statement to execute p_calculation_version_close fails.
	 */
    this.close = async function (iCalculationVersionId, sSessionId) {
        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        try {
            var procedure = dbConnection.loadProcedure(Procedures.calculation_version_close);
            procedure(iCalculationVersionId, sSessionId);
        } catch (e) {
            const sClientMsg = 'Error during closing calculation version.';
            const sServerMsg = `${ sClientMsg } Calculation version id:${ iCalculationVersionId }, session ${ sSessionId }.`;
            $.trace.error(sClientMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sServerMsg, undefined, undefined, e);
        }
    };

    /**
	 * Create new calculation version in database
	 *
	 * @param {object}
	 *            oCalculationVersion - the object with the properties of the new calculation version from request
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {string}
	 *            sUserId - the user id
	 * @returns {object} oResultSet - created calculation version
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.create = async function (oCalculationVersion, sSessionId, sUserId) {
        if (!_.isObject(oCalculationVersion)) {
            const sLogMessage = 'oCalculationVersion must be a valid object.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        // Exclude the properties that are not plain objects and which are protected with regard to internal logic
        var aPropertiesToExclude = _.filter(_.keys(oCalculationVersion), function (sKey) {
            return _.isArray(oCalculationVersion[sKey]);
        });
        aPropertiesToExclude.push('IS_DIRTY');

        var sCalculationVersionName = this.getOrDetermineNewCalculationVersionName(oCalculationVersion);
        let sStatusId = this.getDefaultStatusId();
        var iCalculationVersionId = this.helper.getNextSequenceID(Sequences.calculation_version);

        var oGeneratedValues = {
            'SESSION_ID': sSessionId,
            'CALCULATION_VERSION_ID': iCalculationVersionId,
            'CALCULATION_VERSION_NAME': sCalculationVersionName,
            'STATUS_ID': sStatusId
        };
        var oSettings = {
            TABLE: Tables.calculation_version_temporary,
            PROPERTIES_TO_EXCLUDE: aPropertiesToExclude,
            GENERATED_PROPERTIES: oGeneratedValues
        };

        var oResultSet = this.helper.insertNewEntity(oCalculationVersion, oSettings);

        var iIsWriteable = DefaultValues.newEntityIsWriteable;
        var sUpsertOpenCv = `upsert "${ Tables.open_calculation_versions }" (session_id, calculation_version_id, is_writeable)
			values (?, ?, ?) where session_id = ? and calculation_version_id = ?`;
        await dbConnection.executeUpdate(sUpsertOpenCv, sSessionId, iCalculationVersionId, iIsWriteable, sSessionId, iCalculationVersionId);

        // Create items from nested item objects and update their CalculationVersionId
        var oItemCreateResult = await this.item.create(oCalculationVersion.ITEMS, sSessionId, iCalculationVersionId, 0, 1, 0);
        //(aItems, sSessionId, iCvId, iImport, iSetDefaultValues, iUpdateMasterDataAndPrices)
        // TODO: refactor create calculation version? it's a little bit awkward how result objects are updated;
        // difference between item (procedure) and calculation version (insertEntity)
        oCalculationVersion.ITEMS = Array.from(oItemCreateResult.OT_NEW_ITEMS);

        var oUpdateStatement = hQuery.statement('update "' + Tables.calculation_version_temporary + '" set ROOT_ITEM_ID = ? ' + ' where session_id = ? and calculation_version_id = ?');
        await oUpdateStatement.execute(oCalculationVersion.ITEMS[0].ITEM_ID, sSessionId, iCalculationVersionId);

        oResultSet.ROOT_ITEM_ID = oCalculationVersion.ITEMS[0].ITEM_ID;
        return oResultSet;
    };

    /**
	 * Function to check whether the calculation version id exists in calculation version table.
	 *
	 * @param {integer}
	 *            iCalcVersionId - the id of the calculation version
	 * @returns {boolean} - true if the calculation version id exists, otherwise false
	 */
    this.exists = async function (iCalculationVersionId) {
        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

        var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation_version + '" where calculation_version_id=?');
        var aCount = await oCheckStatement.execute(iCalculationVersionId);

        var bExists = false;
        // check if one entries found
        return parseInt(aCount[0].ROWCOUNT) === 1;
    };

    /**
	 * Function to check whether the calculation version id exists in calculation version temporary table.
	 *
	 * @param {integer}
	 *            iCalcVersionId - the id of the calculation version
	 * @returns {boolean} - true if the calculation version id exists, otherwise false
	 */
    this.existsCVTemp = async function (iCalculationVersionId, sSessionId) {
        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

        var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation_version_temporary + '" where session_id=? and calculation_version_id=?');
        var aCount = await oCheckStatement.execute(sSessionId, iCalculationVersionId);

        var bExists = false;
        // check if one entries found
        return parseInt(aCount[0].ROWCOUNT) === 1;
    };

    /**
	 * Find first available name the follows the pattern: "<sCalculationVersionPrefix> <sUserId> .
	 *
	 * @param {string}
	 *            sCalculationVersionName - the name of the calculation version to be checked for existence
	 * @param {integer}
	 *            iCalculationId - the id of the calculation (integer literal)
	 * @throws {@link PlcException}
	 *             if database content is corrupt due to duplicated calculation version names
	 * @returns {boolean} - true if the calculation version name is unique, otherwise false
	 */
    this.isNameUniqueInBothTables = async function (sCalculationVersionName, iCalculationId) {
        var aStmtBuilder = ['SELECT calculation_version_name FROM "' + Tables.calculation_version_temporary + '"'];
        aStmtBuilder.push('WHERE calculation_version_name = ?');
        aStmtBuilder.push('AND calculation_id = ?');
        aStmtBuilder.push('UNION');
        aStmtBuilder.push('SELECT calculation_version_name FROM "' + Tables.calculation_version + '"');
        aStmtBuilder.push('WHERE calculation_version_name = ?');
        aStmtBuilder.push('AND calculation_id = ?');

        var sQuery = aStmtBuilder.join(' ');
        var oStatement = hQuery.statement(sQuery);
        var aResult = await oStatement.execute(sCalculationVersionName, iCalculationId, sCalculationVersionName, iCalculationId);

        if (aResult.length > 0)
            return false;

        return true;
    };

    /**
	 * Find first available name the follows the pattern: "<sCalculationVersionPrefix> (number)" .
	 *
	 * @param {string}
	 *            sCalculationVersionPrefix - the name of the calculation version to be checked for uniqueness (string literal)
	 * @param {integer}
	 *            iCalculationId - the id of the calculation
	 * @throws {@link PlcException}
	 *             if database content is corrupt due to duplicated calculation version names
	 * @returns {array} - array of calculation version names
	 */
    this.findNameWithPrefix = async function (sCalculationVersionPrefix, iCalculationId) {
        var aStmtBuilder = ['SELECT calculation_version_name FROM "' + Tables.calculation_version_temporary + '"'];
        aStmtBuilder.push("WHERE calculation_version_name LIKE concat(?, ' (%)')");
        aStmtBuilder.push('AND calculation_id = ?');
        aStmtBuilder.push('UNION');
        aStmtBuilder.push('SELECT calculation_version_name FROM "' + Tables.calculation_version + '"');
        aStmtBuilder.push("WHERE calculation_version_name LIKE concat(?, ' (%)')");
        aStmtBuilder.push('AND calculation_id = ?');

        var sQuery = aStmtBuilder.join(' ');
        var oStatement = hQuery.statement(sQuery);
        var aResult = await oStatement.execute(sCalculationVersionPrefix, iCalculationId, sCalculationVersionPrefix, iCalculationId);

        if (aResult.length > 0)
            return _.map(aResult, 'CALCULATION_VERSION_NAME');

        return [];

    };

    /**
	 * Determine name for new calculation version
	 *
	 * @param {object}
	 *            oCalculationVersion - new calculation version object
	 * @returns {string} - calculation version name
	 */
    this.getOrDetermineNewCalculationVersionName = async function (oCalculationVersion) {

        var sCalculationVersionName;

        // check if the name exist in t_calculation_version and t_calculation_version_temporary
        if (this.isNameUniqueInBothTables(oCalculationVersion.CALCULATION_VERSION_NAME, oCalculationVersion.CALCULATION_ID)) {
            sCalculationVersionName = oCalculationVersion.CALCULATION_VERSION_NAME;
        } else {
            /*
			 * Check if the input calculation name ends in "<space><open_bracket><number><close_bracket>", that is, " (1)", " (2)" and
			 * so on. If it doesn't, we'll attempt to add this suffix to the input name. If it does, we'll attempt to increase the number
			 * until an available combination is found.
			 */
            var oSplitedCalculationVersionName = helpers.splitIncrementalString(oCalculationVersion.CALCULATION_VERSION_NAME);

            /*
			 * Extract all calculation version names which follow the "<prefix> (<something>)" pattern inside the same parent calculation.
			 * Note: SQL can't easily check for "<prefix> (<number>)", so we relaxed this to "<name> (<something>)".
			 */
            var aNamesWithPrefix = this.findNameWithPrefix(oSplitedCalculationVersionName.Prefix, oCalculationVersion.CALCULATION_ID);
            /* Find first unused numeric suffix. */
            var iSuffix = helpers.findFirstUnusedSuffixInStringArray(oSplitedCalculationVersionName.Prefix, oSplitedCalculationVersionName.StartSuffix, aNamesWithPrefix);

            sCalculationVersionName = oSplitedCalculationVersionName.Prefix + ' (' + iSuffix.toString() + ')';
        }

        return sCalculationVersionName;

    };

    /**
	 * Gets the default STATUS_ID
	 *
	 * @returns {string} - default STATUS_ID or null if it does not exist
	 */
    this.getDefaultStatusId = async function () {
        let sStmt = `SELECT STATUS_ID FROM "${ Tables.status }" WHERE IS_DEFAULT = 1`;
        let result = dbConnection.executeQuery(sStmt);
        return _.get(_.find(result, 'STATUS_ID'), 'STATUS_ID', null);
    };

    /**
	 * Sets properties of copied Manual or Lifecycle Version to make it a base ("normal") version
	 */
    this.setLifecycleVersionPropertiesToBaseProperties = async function (oUpdatedVersion, oOldVersion, aProtectedColumns, sSessionId) {
        if (oOldVersion.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.Lifecycle || oOldVersion.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.ManualLifecycleVersion) {
            // Proceed only with a lifecycle version

            // reset all lifecycle-related properties to make it a base version
            oUpdatedVersion.BASE_VERSION_ID = null;
            oUpdatedVersion.CALCULATION_VERSION_TYPE = constants.CalculationVersionType.Base;
            oUpdatedVersion.LIFECYCLE_PERIOD_FROM = null;

            // remove the defined fields from protected columns since they have to be overwritten
            aProtectedColumns = _.difference(aProtectedColumns, [
                'BASE_VERSION_ID',
                'CALCULATION_VERSION_TYPE',
                'LIFECYCLE_PERIOD_FROM'
            ]);

            // update item fields with OUTDATED_PRICE
            var sStmt = `
			    UPDATE "sap.plc.db::basis.t_item_temporary" item
				    SET 
					    PRICE_SOURCE_ID = 'MANUAL_PRICE',
   						PRICE_SOURCE_TYPE_ID = 3
    				FROM "sap.plc.db::basis.t_item_temporary" item
	    				INNER JOIN "sap.plc.db::basis.t_calculation_version_temporary" calcVersion								
		    			ON calcVersion.calculation_version_id = item.calculation_version_id and calcVersion.session_id = item.session_id
			    	WHERE calcVersion.calculation_version_id = ? and calcVersion.session_id = ? 
				    	AND calcVersion.CALCULATION_VERSION_TYPE = 2 OR calcVersion.CALCULATION_VERSION_TYPE = 16
					    AND item.PRICE_SOURCE_ID = 'OUTDATED_PRICE';
			`;
            var aOpenVersions = await dbConnection.executeUpdate(sStmt, oUpdatedVersion.CALCULATION_VERSION_ID, sSessionId);
        }
        return aProtectedColumns;
    };

    /**
	 * When a lifecycle version is saved it changes its type to manual lifecycle version (16).
	 */
    this.setLifecycleVersionTypeToManual = async function (oCalculationVersion, sSessionId) {
        const iCalculationVersionType = this.getVersionType(oCalculationVersion.CALCULATION_VERSION_ID, sSessionId);
        if (iCalculationVersionType === constants.CalculationVersionType.Lifecycle) {
            // Proceed only with a lifecycle version and set calculation version type as Manual lifecycle version
            const sUpdateStatement = `  UPDATE "sap.plc.db::basis.t_calculation_version_temporary" 
				                        SET 
				                              "CALCULATION_VERSION_TYPE" = ?
				                        WHERE "CALCULATION_VERSION_ID" = ?  AND SESSION_ID =? ;
			                        `;
            await dbConnection.executeUpdate(sUpdateStatement, constants.CalculationVersionType.ManualLifecycleVersion, oCalculationVersion.CALCULATION_VERSION_ID, sSessionId);
        }
    };

    /**
	 * Gets the list of users ids for all opened calculation versions of the project.
	 * @param {string}
	 *            sProjectId - the id of the project that should be checked
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {array} ids of users that opened the calculation versions of the project
	 */
    this.getOpenVersionsForProject = async function (sProjectId) {
        var sStmt = `	select 	sessions.user_id, 
								open_versions.calculation_version_id, 
								versions.calculation_version_name,
								versions.calculation_version_type,			-- columns version_type and base_version_id needed
								versions.base_version_id					-- to determine if a lifecycle or a base version is open
						from 	"${ Tables.session }" as sessions
							inner join "${ Tables.open_calculation_versions }" as open_versions
								on sessions.session_id = open_versions.session_id
							inner join "${ Tables.calculation_version_temporary }" as versions
								on open_versions.calculation_version_id = versions.calculation_version_id
							inner join "${ Tables.calculation }" as calculations
								on versions.calculation_id = calculations.calculation_id 
						where calculations.project_id = ?;
					`;
        var aOpenVersions = dbConnection.executeQuery(sStmt, sProjectId);
        return Array.slice(aOpenVersions);
    };

    /**
	 * Gets the list of users ids for all opened lifecycle calculation versions of the base calculation version.
	 * @param {integer}
	 *            iCalculationVersionId - the id of the base version that should be checked
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {array} ids of users and users that opened the lifecycle calculation versions of the given base version
	 */
    this.getOpenLifecycleVersionsForBaseVersion = async function (iCalculationVersionId) {
        var sStmt = `	select 	sessions.user_id, 
								versions.calculation_version_name,
								versions.calculation_version_id
						from 	"${ Tables.session }" as sessions
							inner join "${ Tables.open_calculation_versions }" as open_versions
								on sessions.session_id = open_versions.session_id
							inner join "${ Tables.calculation_version_temporary }" as versions
								on open_versions.calculation_version_id = versions.calculation_version_id
						where ( versions.calculation_version_type = 2  
						 or versions.calculation_version_type = 16 )     -- both lifecycle and manual versions needed 
								and versions.base_version_id = ?;
					`;
        var aOpenVersions = dbConnection.executeQuery(sStmt, iCalculationVersionId);
        return Array.slice(aOpenVersions);
    };
    /**
	 * Check if a calculation for lifecycle versions is in progress.
	 * @param {integer}
	 *            iCalculationVersionId - the id of the base version that should be checked
	 * @throws {PlcException} -
	 *             If the version is pending to be re-generated it will throw an error
	 */
    this.checkLockCalculatingLifecycle = async iCalculationVersionId => {
        let stmt = `select versions.CALCULATION_VERSION_ID,
                           versions.CALCULATION_VERSION_NAME,
                           calculation.PROJECT_ID
                    from "sap.plc.db::basis.t_calculation_version" versions
                    inner join "sap.plc.db::basis.t_calculation" calculation 
                      on versions.CALCULATION_ID = calculation.CALCULATION_ID and (versions.CALCULATION_VERSION_type = ? or versions.CALCULATION_VERSION_type = ? ) 
					where versions.CALCULATION_VERSION_ID = ?     
                    `;
        let aLifecycleVersionsLock = dbConnection.executeQuery(stmt, constants.CalculationVersionType.Lifecycle, constants.CalculationVersionType.ManualLifecycleVersion, iCalculationVersionId);
        if (aLifecycleVersionsLock && aLifecycleVersionsLock.length > 0) {
            let sLockedVersionId = aLifecycleVersionsLock[0].CALCULATION_VERSION_ID;
            let sLockedProject = aLifecycleVersionsLock[0].PROJECT_ID;
            let sLockedVersionName = aLifecycleVersionsLock[0].CALCULATION_VERSION_NAME;

            const sParameterName = `{"PROJECT_ID":"${ sLockedProject }"}`;
            let sGetTaskstmt = `select status, parameters
 	                        from "sap.plc.db::basis.t_task"
						    where TASK_TYPE = ?
						    and parameters = ?
    	                    and status not in (?, ?, ?);  
						`;
            let aLifecycleTask = dbConnection.executeQuery(sGetTaskstmt, constants.TaskType.CALCULATE_LIFECYCLE_VERSIONS, sParameterName, constants.TaskStatus.COMPLETED, constants.TaskStatus.FAILED, constants.TaskStatus.CANCELED);
            if (aLifecycleTask && aLifecycleTask.length > 0) {

                let oMessageDetails = new MessageDetails().addCalculationVersionObjs({ name: sLockedVersionName });
                const sClientMsg = `The lifecycle version ${ sLockedVersionId } cannot be opened because it is pending to be re-generated.`;
                await $.trace.info(sClientMsg);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sClientMsg, oMessageDetails);
            }
            ;
        }
        ;
    };
    /**
	 * Function to read all data of a calculation version. The function first cleans-up invalid data in temporary tables, then sets the
	 * correct mode (read-only or r/w) for the user opening the calculation version and finally calls
	 *
	 * @param iCalculationVersionId -
	 *            id of the calculation version that shall be retrieved
	 * @param sSessionId -
	 *            current session id of the request
	 * @param sUserId -
	 *            current user id of the request
	 * @param bCopyData -
	 *            flag to determine if data from permanent tables should be copied to temporary tables
	 * @param bCompressedResult - bCompressedResult
	 *            flag to determine if the returned data is compressed
	 * @throws {PlcException}
	 *             if the given arguments are undefined or of wrong type
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 *
	 * @returns {object} oReturnObject - an object containing all data of the calculation version
	 * @returns {object} oReturnObject.version - the version head data
	 * @returns {array} oReturnObject.items - an array of all item objects contained in this version
	 */
    this.open = async function (iCalculationVersionId, sSessionId, sUserId, sLanguage, bCopyData, bCompressedResult) {
        // REVIEW (RF): I really don't like that you instantiate and fill the message details preemptively; this object
        // with this functions is shared among one request, in which multiple calls from the business logic can occur;
        // if you fill the message details even without having an error, this could have some side-effects to a
        // subsequent call and lead to misleading details
        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });
        oMessageDetails.addUserObj({ id: sUserId });

        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
        if (!_.isString(sSessionId) || !_.isString(sUserId)) {
            const sLogMessage = 'sSessionId or sUserId are not a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        // delete all data where session_id does not exists in session table anymore to make sure data is consistent

        var oReturnObject = {
            version: {},
            items: [],
            itemsCompressed: {},
            referencesdata: {
                PROJECTS: [],
                CALCULATIONS: [],
                CALCULATION_VERSIONS: [],
                MASTERDATA: {}
            }
        };

        // read calculation version data and related items
        try {
            var procedure = dbConnection.loadProcedure(Procedures.calculation_version_open);
            var iCopyFlag = bCopyData === false ? 0 : 1; // by default copy data during open, only skip when explicitly specified 
            var result = procedure(iCalculationVersionId, sSessionId, sUserId, iCopyFlag);
        } catch (e) {
            const sClientMsg = `Error when procedure ${ Procedures.calculation_version_open } is called.`;
            const sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }
        var aCalculationVersions = result.CALCVERSION;
        if (aCalculationVersions.length > 1) {
 // there should be exactly one result row
            const sLogMessage = 'More than one version found during opening calculation version.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        } else {
            oReturnObject.version = _.clone(aCalculationVersions[0]);
            // update recent calculations table
            if (_.isEmpty(oReturnObject.version))
                await updateRecentlyUsed(iCalculationVersionId, sUserId, true);
            else
                await updateRecentlyUsed(iCalculationVersionId, sUserId, false);
        }

        if (bCompressedResult) {
            let output = helpers.transposeResultArray(result.ITEMS);
            //delete calculated fields
            Object.keys(output).forEach(key => {
                if (key.indexOf('_CALCULATED') > -1) {
                    delete output[key];
                }
            });
            //delete session_id and calculation_version_id since it is already available in the calculation version
            delete output['SESSION_ID'];
            delete output['CALCULATION_VERSION_ID'];
            oReturnObject.itemsCompressed = output;
        } else {
            oReturnObject.items = Array.slice(result.ITEMS);
        }

        //take information about the referenced calculations if they exist
        oReturnObject = this.getReferencedVersionDetails(oReturnObject, sLanguage);

        return oReturnObject;
    };

    /**
	 * Function to read all the information about the referenced(source) calculation versions. 
	 * @param oReturnObject - object with the following structure 
	 * 		{	PROJECTS: [], CALCULATIONS: [], CALCULATION_VERSIONS: [], MASTERDATA: {} } 
	 * @param sLanguage -
	 *            the login language
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {array} oReturnObject - object with all the information about the source versions
	 */
    this.getReferencedVersionDetails = async function (oReturnObject, sLanguage) {
        var sSelectStmt = `select count(*) as rowcount from "${ Tables.gtt_calculation_version_ids }"`;
        var aCountReferences = dbConnection.executeQuery(sSelectStmt);
        //check if there are refrences, and if yes return all the related information
        if (parseInt(aCountReferences[0].ROWCOUNT) > 0) {
            try {
                var procedure = dbConnection.loadProcedure(Procedures.referenced_calculation_version_read);
                var result = procedure(sLanguage);
            } catch (e) {
                const sClientMsg = `Error when procedure ${ Procedures.referenced_calculation_version_read } is called.`;
                const sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
            }
            //reference version information		    
            const aRefCalcVersWithRootItem = Array.slice(result.OT_CALCULATION_VERSIONS);
            if (aRefCalcVersWithRootItem.length > 0) {
                oReturnObject.referencesdata = oReturnObject.referencesdata || {};

                var aRefCalculationVersions = [];
                oReturnObject.referencesdata.PROJECTS = Array.slice(result.OT_PROJECTS);
                oReturnObject.referencesdata.CALCULATIONS = Array.slice(result.OT_CALCULATIONS);

                var aRootItems = Array.slice(result.OT_ITEMS);
                _.each(aRefCalcVersWithRootItem, function (oCalcVers) {
                    var oCalcVersItem = {};
                    oCalcVersItem = _.clone(oCalcVers);
                    oCalcVersItem.ITEMS = _.filter(aRootItems, function (oItem) {
                        return oItem.CALCULATION_VERSION_ID === oCalcVers.CALCULATION_VERSION_ID;
                    });
                    aRefCalculationVersions.push(oCalcVersItem);
                });
                oReturnObject.referencesdata.CALCULATION_VERSIONS = aRefCalculationVersions;
                oReturnObject.referencesdata.MASTERDATA = this.administration.fillResultContainer(result);
            }
        }
        return oReturnObject;
    };

    /**
	 * Sets the IS_WRITEABLE flag in the t_open_calculation_version table for a calculation version that is being opened
	 * or is being required to be locked as it is opened as a base version in a variant matrix with write access
	 *
	 * @param {integer}
	 *            iCalculationVersionId - id of the calculation version id which will be opened
	 * @param {string}
	 *            sSessionId - The id of the session in which the version is opened
	 * @param {string}
	 *            sUserId - The id of user who opens the version
	 * @param {string}
	 *            sLockContext - application context that asks for locking a calculation version (e.g. calculation view or variant matrix)
	 * @return {string}
	 * 			 lockingUser - the user that has the write lock (either the current user or someone else or null if the version is frozen or a lifecycle version
	 */
    this.setVersionLock = async function (iCalculationVersionId, sSessionId, sUserId, sRequestedLockContext) {

        var bIsReadOnly = null;
        var sLockingUser = null;
        var sLockingContext = null;
        var sPrivilege = null;
        var bIsVersionFrozen = null;
        var aVersionsWhereReferenced = this.getMasterVersions(iCalculationVersionId);

        if (!this.isOpenedInSessionAndContext(sSessionId, iCalculationVersionId, sRequestedLockContext)) {
            // lock requesting user has not opened the calculation version in the specific context yet

            bIsVersionFrozen = this.isFrozen(iCalculationVersionId);
            await cleanupSessions(iCalculationVersionId);



            sLockingUser = this.getLockingUser(iCalculationVersionId);
            sLockingContext = this.getLockingContext(iCalculationVersionId);

            sPrivilege = await authorizationManager.getUserPrivilege(authorizationManager.BusinessObjectTypes.CalculationVersion, iCalculationVersionId, dbConnection, this.sUserId);


            bIsReadOnly = sLockingUser !== null || bIsVersionFrozen || aVersionsWhereReferenced.length !== 0 && sRequestedLockContext !== constants.CalculationVersionLockContext.VARIANT_MATRIX || sPrivilege === InstancePrivileges.READ;

            let stmtInsertOpenVersion = null;
            const aValues = [];





            if (sLockingUser === sSessionId && sLockingContext !== null && sLockingContext !== sRequestedLockContext) {
                stmtInsertOpenVersion = `upsert "${ Tables.open_calculation_versions }" (session_id, calculation_version_id, is_writeable, context) values(?,?,?,?) with primary key`;
                aValues.push([
                    sSessionId,
                    iCalculationVersionId,
                    0,
                    constants.CalculationVersionLockContext.CALCULATION_VERSION
                ]);

                let bIsVariantLocked = this.variant.isLockedInAConcurrentVariantContext(iCalculationVersionId);
                if (sLockingUser !== null) {
                    bIsVariantLocked |= sLockingUser !== sSessionId;
                }
                aValues.push([
                    sSessionId,
                    iCalculationVersionId,
                    bIsVariantLocked ? 0 : 1,
                    constants.CalculationVersionLockContext.VARIANT_MATRIX
                ]);
                bIsReadOnly = bIsVariantLocked;
            } else {
                stmtInsertOpenVersion = `insert into "${ Tables.open_calculation_versions }" (session_id, calculation_version_id, is_writeable, context) values(?,?,?,?)`;
                aValues.push([
                    sSessionId,
                    iCalculationVersionId,
                    bIsReadOnly ? 0 : 1,
                    sRequestedLockContext
                ]);
            }
            await dbConnection.executeUpdate(stmtInsertOpenVersion, aValues);
        } else {


            sLockingUser = this.getLockingUser(iCalculationVersionId);

            if (sLockingUser === sUserId) {


                sLockingContext = this.getLockingContext(iCalculationVersionId);
            }

            bIsReadOnly = sLockingUser === sUserId && sLockingContext === sRequestedLockContext ? false : true;
            bIsVersionFrozen = sLockingUser === null ? this.isFrozen(iCalculationVersionId) : false;
        }

        return {
            LockingUser: sLockingUser !== null ? sLockingUser : sUserId,
            LockingContext: sLockingContext !== null ? sLockingContext : sRequestedLockContext,
            LockMode: bIsReadOnly ? 'read' : 'write',
            IsReference: aVersionsWhereReferenced.length > 0 ? true : false,
            IsFrozen: bIsVersionFrozen,
            IsNotPrivileged: sPrivilege === InstancePrivileges.READ ? true : false
        };
    };










    this.unlockVersion = async function (iCalculationVersionId, sSessionId, sRequestedUnlockContext) {
        var sStmt = `delete from "${ Tables.open_calculation_versions }" 
			where SESSION_ID = ? and CALCULATION_VERSION_ID = ? and CONTEXT = ? `;
        var iUpdatedCount = await dbConnection.executeUpdate(sStmt, sSessionId, iCalculationVersionId, sRequestedUnlockContext);





        if (sRequestedUnlockContext === 'variant_matrix') {
            this.emptyVariantMatrixTemporaryTables(iCalculationVersionId);
        }

        return iUpdatedCount;
    };





    this.emptyVariantMatrixTemporaryTables = async iCalcVersionId => {
        const sStmtDeleteVariantTemp = `DELETE FROM "${ Tables.variant_temporary }" WHERE "CALCULATION_VERSION_ID" = ${ iCalcVersionId };`;
        await dbConnection.executeUpdate(sStmtDeleteVariantTemp);
        const sStmtDeleteItemsTemp = `DELETE FROM "${ Tables.variant_item_temporary }" WHERE "VARIANT_ID" NOT IN (SELECT VARIANT_ID FROM "${ Tables.variant_temporary }");`;
        await dbConnection.executeUpdate(sStmtDeleteItemsTemp);
    };







    this.unlockVariantMatrixVersionsForSession = async function (sSessionId) {
        const sStmt = `delete from "${ Tables.open_calculation_versions }" 
                            where SESSION_ID = ? and CONTEXT = '${ constants.CalculationVersionLockContext.VARIANT_MATRIX }' `;
        await dbConnection.executeUpdate(sStmt, sSessionId);
    };







    this.unlockVariantMatrixVersionsForSession = async function (sSessionId) {
        const sStmt = `delete from "${ Tables.open_calculation_versions }" 
                            where SESSION_ID = ? and CONTEXT = '${ constants.CalculationVersionLockContext.VARIANT_MATRIX }' `;
        await dbConnection.executeUpdate(sStmt, sSessionId);
    };




    async function cleanupSessions(iCalcVersionId) {




        var oStatementDelete = hQuery.statement([
            'delete from  "' + Tables.session + '"',
            ' where session_id in (select "SESSION_ID" from "' + Tables.open_calculation_versions + '"',
            ' where calculation_version_id = ? and IS_WRITEABLE = 1) and SECONDS_BETWEEN(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP)> ',
            '( select "VALUE_IN_SECONDS" from "' + Tables.application_timeout + '" where APPLICATION_TIMEOUT_ID =?)'
        ].join(' '));
        var iRows = await oStatementDelete.execute(iCalcVersionId, sessionTimeout);

        that.session.deleteOutdatedEntries();
    }








    this.getLockingUser = async function (iCalculationVersionId) {
        var aUserIds;
        var oStatement = hQuery.statement([
            'select user_id from  "' + Tables.session + '"',
            ' where session_id in (select "SESSION_ID" from "' + Tables.open_calculation_versions + '"',
            ' where calculation_version_id = ? and IS_WRITEABLE = 1)'
        ].join(' '));

        aUserIds = await oStatement.execute(iCalculationVersionId);
        if (aUserIds.length > 1) {
            oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });
            const sClientMsg = 'Corrupted database state: Calculation Version is locked by more than one user.';
            const sServerMsg = `${ sClientMsg } Calculation Version id: ${ iCalculationVersionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_NOT_WRITABLE_ERROR, sClientMsg, oMessageDetails);
        }

        if (aUserIds.length === 1) {
            return aUserIds[0].USER_ID;
        }
        return null;
    };







    this.getLockingContext = async function (iCalculationVersionId) {
        var sStmt = `select CONTEXT from "${ Tables.open_calculation_versions }" 
				where CALCULATION_VERSION_ID = ? and IS_WRITEABLE = 1 LIMIT 1`;
        var oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);

        if (oResult.length === 1) {
            return oResult[0].CONTEXT;
        }
        return null;
    };










    this.isFrozen = function (iCalculationVersionId) {
        var aFrozenVersions = this.areFrozen([iCalculationVersionId]);
        if (aFrozenVersions.length > 0) {
            return aFrozenVersions[0] === iCalculationVersionId;
        }
        return false;
    };








    this.areFrozen = async aCvIds => {
        var sIdPlaceHolder = _.map(aCvIds, () => '?').join(', ');

        var sStmt = `
			select calculation_version_id 
			from "${ Tables.calculation_version }"
			where 		calculation_version_id in (${ sIdPlaceHolder })
					and is_frozen = ?;
		`;

        var aQueryParameters = [sStmt].concat(aCvIds, [constants.isFrozen]);
        var oResult = dbConnection.executeQuery.apply(dbConnection, aQueryParameters);

        var aFrozenCvIds = _.map(oResult, oFrozenCv => oFrozenCv.CALCULATION_VERSION_ID);
        return aFrozenCvIds;
    };










    this.isLifecycleVersion = async function (iCalculationVersionId, bCheckTemporaryTable) {
        bCheckTemporaryTable = bCheckTemporaryTable ? bCheckTemporaryTable : false;
        let sTable;
        if (bCheckTemporaryTable === true) {
            sTable = Tables.calculation_version_temporary;
        } else {
            sTable = Tables.calculation_version;
        }

        var iLifecycleVersionTypeId = 2;
        var sStmt = `select count(*) as rowcount from "${ sTable }" 
						where CALCULATION_VERSION_ID = ? and CALCULATION_VERSION_TYPE = 2`;
        var oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);

        return parseInt(oResult[0].ROWCOUNT) === 1;
    };










    this.isManualLifecycleVersion = async function (iCalculationVersionId, bCheckTemporaryTable) {
        bCheckTemporaryTable = bCheckTemporaryTable ? bCheckTemporaryTable : false;
        let sTable;
        if (bCheckTemporaryTable === true) {
            sTable = Tables.calculation_version_temporary;
        } else {
            sTable = Tables.calculation_version;
        }
        let sStmt = `select count(*) as rowcount from "${ sTable }" 
						where CALCULATION_VERSION_ID = ? and CALCULATION_VERSION_TYPE = ?`;
        let oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId, constants.CalculationVersionType.ManualLifecycleVersion);

        return parseInt(oResult[0].ROWCOUNT) === 1;
    };










    this.getVersionType = async (iCalculationVersionId, sSessionId) => {
        let oResult = null;
        if (!helpers.isNullOrUndefined(sSessionId)) {
            let sStmt = `select calculation_version_type from "${ Tables.calculation_version_temporary }" where calculation_version_id = ? and session_id = ?;`;
            oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId, sSessionId);
        } else {
            let sStmt = `select calculation_version_type from "${ Tables.calculation_version }" where calculation_version_id = ?;`;
            oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);
        }

        return parseInt(oResult[0].CALCULATION_VERSION_TYPE);
    };

    async function getWithoutItemsInternal(aCalculationVersionIds, sSessionId, sTable) {
        if (!_.isArray(aCalculationVersionIds)) {
            const sLogMessage = 'aCalculationVersionIds must be an array.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        var bContainsOnlyNumbers = _.every(aCalculationVersionIds, function (iCalcId) {
            return _.isNumber(iCalcId) && iCalcId % 1 === 0 && iCalcId >= 0;
        });
        if (!bContainsOnlyNumbers) {
            const sLogMessage = 'aCalculationVersionIds can only contain positive numbers.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        if (sTable === Tables.calculation_version_temporary && !_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        var stmtBuilder = ['select'];
        if (sTable === Tables.calculation_version_temporary) {
            stmtBuilder.push(' session_id, ');
        }
        stmtBuilder.push(' calculation_version_id, calculation_id, calculation_version_name, calculation_version_type, root_item_id, customer_id,' + ' sales_price, sales_price_currency_id, report_currency_id, costing_sheet_id, component_split_id,' + ' sales_document, start_of_production, end_of_production, valuation_date, last_modified_on, last_modified_by,' + ' master_data_timestamp, lifecycle_period_from, base_version_id, is_frozen, exchange_rate_type_id, material_price_strategy_id, activity_price_strategy_id from ', '"' + sTable + '" where (');
        _.each(aCalculationVersionIds, function (iCalcId, iIndex) {
            stmtBuilder.push('calculation_version_id = ?');
            if (iIndex < aCalculationVersionIds.length - 1) {
                stmtBuilder.push('or');
            }
        });
        stmtBuilder.push(')');
        if (sTable === Tables.calculation_version_temporary) {
            stmtBuilder.push('and session_id = ?');
        }

        var stmt = hQuery.statement(stmtBuilder.join(' '));
        if (sTable === Tables.calculation_version_temporary) {
            return await stmt.execute(aCalculationVersionIds.concat(sSessionId));
        } else {
            return await stmt.execute(aCalculationVersionIds);
        }

    }













    this.getWithoutItems = async function (aCalculationVersionIds, sSessionId) {
        var aCalculationVersions = await getWithoutItemsInternal(aCalculationVersionIds, sSessionId, Tables.calculation_version_temporary);
        return aCalculationVersions;
    };











    this.getWithoutItemsPersistent = async function (aCalculationVersionIds) {
        var aCalculationVersions = await getWithoutItemsInternal(aCalculationVersionIds, null, Tables.calculation_version);
        return aCalculationVersions;
    };

    this.getCalculationResults = function (iCalculationVersionId, sSessionId) {
        var calculation = dbConnection.loadProcedure(Procedures.calculation);
        var result = calculation({
            'IV_CALCULATION_VERSION_ID': iCalculationVersionId,
            'IV_SESSION_ID': sSessionId
        });

        return result;
    };







    this.getSavedCalculationResults = async function (iCalculationVersionId) {



        var aCustomMetadataFields = metadata.getMetadataFields(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null, true);
        var sCustomFieldsStatement = '';
        _.each(aCustomMetadataFields, function (oMetadataField, iIndex) {

            if (oMetadataField.UOM_CURRENCY_FLAG !== 1 && oMetadataField.COLUMN_ID.startsWith('CUST_')) {
                sCustomFieldsStatement += ', itemExt.' + oMetadataField.COLUMN_ID + '_CALCULATED as ' + oMetadataField.COLUMN_ID;
            }
        });


        var oResultCalculatedFields = dbConnection.executeQuery(`SELECT item.item_id, item.base_quantity_calculated as base_quantity, item.quantity_calculated as quantity, item.total_quantity, item.total_quantity_uom_id,
				 item.price_unit_calculated as price_unit, item.target_cost_calculated as target_cost, item.lot_size_calculated as lot_size,
		         item.price_fixed_portion_calculated as price_fixed_portion, item.price_variable_portion_calculated as price_variable_portion,
				 item.price_for_total_quantity, item.price_for_total_quantity_fixed_portion, item.price_for_total_quantity_variable_portion,
				 item.price_for_total_quantity2, item.price_for_total_quantity2_fixed_portion, item.price_for_total_quantity2_variable_portion,
				 item.price_for_total_quantity3, item.price_for_total_quantity3_fixed_portion, item.price_for_total_quantity3_variable_portion,
		         item.other_cost, item.other_cost_fixed_portion, item.other_cost_variable_portion,
				 item.total_cost, item.total_cost_fixed_portion, item.total_cost_variable_portion,
				 item.total_cost2, item.total_cost2_fixed_portion, item.total_cost2_variable_portion,
				 item.total_cost3, item.total_cost3_fixed_portion, item.total_cost3_variable_portion,
				 item.total_cost_per_unit_fixed_portion, item.total_cost_per_unit_variable_portion, item.total_cost_per_unit,
				 item.total_cost2_per_unit_fixed_portion, item.total_cost2_per_unit_variable_portion, item.total_cost2_per_unit,
				 item.total_cost3_per_unit_fixed_portion, item.total_cost3_per_unit_variable_portion, item.total_cost3_per_unit
		         ${ sCustomFieldsStatement }
		         FROM "${ Tables.item }" as item
		         LEFT OUTER JOIN "${ Tables.item_ext }" as itemExt on item.item_id = itemExt.item_id and item.calculation_version_id = itemExt.calculation_version_id
		         WHERE item.calculation_version_id = ?`, iCalculationVersionId);


        var oResultCostingSheetValues = dbConnection.executeQuery(`SELECT item_id, costing_sheet_row_id, is_rolled_up_value, has_subitems, 
						sum(cost_fixed_portion) as cost_fixed_portion, sum(cost_variable_portion) as cost_variable_portion,
						sum(cost2_fixed_portion) as cost2_fixed_portion, sum(cost2_variable_portion) as cost2_variable_portion,
						sum(cost3_fixed_portion) as cost3_fixed_portion, sum(cost3_variable_portion) as cost3_variable_portion
		         FROM "${ Tables.item_calculated_values_costing_sheet }" WHERE calculation_version_id = ? GROUP BY item_id, costing_sheet_row_id, is_rolled_up_value, has_subitems`, iCalculationVersionId);


        var oResultComponentSplitValues = dbConnection.executeQuery(`SELECT item_id, component_split_id, cost_component_id, 
						sum(cost_fixed_portion) as cost_fixed_portion, sum(cost_variable_portion) as cost_variable_portion,
						sum(cost2_fixed_portion) as cost2_fixed_portion, sum(cost2_variable_portion) as cost2_variable_portion,
						sum(cost3_fixed_portion) as cost3_fixed_portion, sum(cost3_variable_portion) as cost3_variable_portion
		         FROM "${ Tables.item_calculated_values_component_split }" WHERE calculation_version_id = ? GROUP BY item_id, component_split_id, cost_component_id`, iCalculationVersionId);

        return {
            ITEM_CALCULATED_FIELDS: oResultCalculatedFields,
            ITEM_CALCULATED_VALUES_COSTING_SHEET: oResultCostingSheetValues,
            ITEM_CALCULATED_VALUES_COMPONENT_SPLIT: oResultComponentSplitValues
        };
    };











    this.getSaveRelevantFields = async function (sSessionId, iCvId) {
        var aSaveRelevantProperties = [
            'CALCULATION_VERSION_ID',
            'LAST_MODIFIED_ON',
            'LAST_MODIFIED_BY',
            'IS_FROZEN',
            'CALCULATION_VERSION_TYPE',
            'BASE_VERSION_ID',
            'LIFECYCLE_PERIOD_FROM'
        ];
        var sStmt = `
			select ${ aSaveRelevantProperties.join(', ') }
			from "${ Tables.calculation_version_temporary }"
			where session_id = ? and calculation_version_id = ?;
		`;
        var oResult = dbConnection.executeQuery(sStmt, sSessionId, iCvId);
        if (oResult.length !== 1) {
            const sLogMessage = `Reading updated fields for saved (or saved-as) calculation versions failed. Reason: Found ${ oResult.length } calculation versions with the given id opened in the current session.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }


        return _.clone(oResult[0]);
    };












    this.saveCalculationResults = async function (iCalculationVersionId, sSessionId) {
        var oSaveCalculationResults = hQuery.procedure(Procedures.calculation_save_results);
        await oSaveCalculationResults.execute({
            'IV_CALCULATION_VERSION_ID': iCalculationVersionId,
            'IV_SESSION_ID': sSessionId
        });
    };








    this.calculatePersistent = function (iCvId) {
        const fCalculation = dbConnection.loadProcedure(Procedures.calculate_saved_calculation_version);
        fCalculation(iCvId);
    };













    this.getOpeningUsers = async function (iCalculationVersionId) {
        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

        var aUserIds;
        var oStatement = hQuery.statement([
            'select user_id from  "' + Tables.session + '"',
            ' where session_id in (select "SESSION_ID" from "' + Tables.open_calculation_versions + '"',
            ' where calculation_version_id = ?)'
        ].join(' '));
        try {
            aUserIds = await oStatement.execute(iCalculationVersionId);
        } catch (e) {
            oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });
            const sClientMsg = 'Error during getting opening users for the calculation version.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }. error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
        }
        return aUserIds;
    };












    this.getSessionRecord = async function (sSessionId, iCalcVersionId, sLockContext = constants.CalculationVersionLockContext.CALCULATION_VERSION) {
        oMessageDetails.addCalculationVersionObjs({ id: iCalcVersionId });


        var aOpenCalculation = dbConnection.executeQuery(`select session_id, calculation_version_id, is_writeable from "${ Tables.open_calculation_versions }" 
			where session_id = ? and calculation_version_id = ? and context = ?`, sSessionId, iCalcVersionId, sLockContext);
        if (aOpenCalculation.length > 1) {
            const sClientMsg = 'Corrupted query or database state: found more than 1 open calculation version.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalcVersionId }, session ${ sSessionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }
        return aOpenCalculation.length === 1 ? aOpenCalculation[0] : undefined;
    };















    this.isNameUnique = async function (iCalculationId, iCalculationVersionId, sCalcVersionName) {
        oMessageDetails.addCalculationVersionObjs({
            name: sCalcVersionName,
            id: iCalculationId
        });

        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
        if (! _.isNumber(iCalculationId)) {
            const sLogMessage = 'iCalculationId must be a number.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        if (!_.isString(sCalcVersionName)) {
            const sLogMessage = 'sCalcVersionName must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        var aVersions = await getVersionsWithNameInCalculation(sCalcVersionName, iCalculationId);

        if (aVersions.length > 1) {
            const sClientMsg = 'Corrupted query or database state: found more than 1 entry for calculation version name.';
            const sServerMsg = `${ sClientMsg } Calculation version name: ${ sCalcVersionName }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        var existingVersion = _.find(aVersions, function (entry) {
            return entry.CALCULATION_VERSION_ID !== iCalculationVersionId;
        });
        if (existingVersion !== undefined) {
            return false;
        }
        return true;

    };













    this.doesNameNotExist = async function (iCalculationId, sCalcVersionName) {
        oMessageDetails.addCalculationVersionObjs({
            name: sCalcVersionName,
            id: iCalculationId
        });

        if (!await _.isNumber(iCalculationId)) {
            const sLogMessage = 'iCalculationId must be a number.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sCalcVersionName)) {
            const sLogMessage = 'sCalcVersionName must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        var aVersions = await getVersionsWithNameInCalculation(sCalcVersionName, iCalculationId);



        return aVersions.length < 1;
    };









    async function getVersionsWithNameInCalculation(sCalcVersionName, iCalculationId) {
        var oCheckNameStatement = hQuery.statement('select CALCULATION_VERSION_NAME, CALCULATION_VERSION_ID from "' + Tables.calculation_version + '"' + ' where upper(calculation_version_name)=? and calculation_id =?');
        var aVersions = await oCheckNameStatement.execute(sCalcVersionName.toUpperCase(), iCalculationId);

        return aVersions;
    }













    this.isOpenedAndLockedInSessionAndContext = function (sSessionId, iCalculationVersionId, sLockContext = constants.CalculationVersionLockContext.CALCULATION_VERSION) {
        var oOpenCalculationVersion = this.getSessionRecord(sSessionId, iCalculationVersionId, sLockContext);

        return oOpenCalculationVersion !== undefined && _.has(oOpenCalculationVersion, 'IS_WRITEABLE') && oOpenCalculationVersion.IS_WRITEABLE === 1;
    };













    this.isOpenedInSessionAndContext = function (sSessionId, iCalcVersionId, sLockContext = constants.CalculationVersionLockContext.CALCULATION_VERSION) {
        var oOpenCalculationVersion = this.getSessionRecord(sSessionId, iCalcVersionId, sLockContext);
        if (oOpenCalculationVersion === undefined) {
            return false;
        }
        return true;
    };












    this.isSingle = async function (iCalculationVersionId) {
        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);


        var oStatement = hQuery.statement([
            'select count(*)  as rowcount from  "' + Tables.calculation_version + '"',
            ' where calculation_id in ',
            ' (select calculation_id from "' + Tables.calculation_version + '" where calculation_version_id=?)'
        ].join(' '));
        var aCount = await oStatement.execute(iCalculationVersionId);


        if (aCount.length === 0 || aCount.length > 1) {
            oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

            const sClientMsg = 'Corrupted query or database state during checking if calculation version is single.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }
        var iRowCount = parseInt(aCount[0].ROWCOUNT, 10);
        return iRowCount === 1;
    };













    this.remove = async function (iCalculationVersionId, sUserId) {
        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

        try {
            var procedure = dbConnection.loadProcedure(Procedures.calculation_version_delete);
            var result = procedure(iCalculationVersionId);

            await updateRecentlyUsed(iCalculationVersionId, sUserId, true);

            return result.AFFECTEDROWS;
        } catch (e) {
            oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

            const sClientMsg = 'Error during deleting the calculation version.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
        }
    };












    this.save = async function (iCalculationVersionId, sSessionId, sUserId) {
        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        try {
            var procedure = dbConnection.loadProcedure(Procedures.calculation_version_save);
            procedure(iCalculationVersionId, sSessionId);

            await updateRecentlyUsed(iCalculationVersionId, sUserId, false);
        } catch (e) {
            if (e.code === 301) {
                const sClientMsg = 'Error during saving the calculation version: name already exists.';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }, Error: ${ e.message || e.msg }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR, sClientMsg, oMessageDetails, undefined, e);
            } else {
                const sClientMsg = 'Error during saving the calculation version.';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }, Error message: ${ e.message || e.msg }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
            }
        }
    };












    this.setFrozenFlag = async function (iCalculationVersionId, sSessionId) {
        var sUpdateCalcVers = 'update "' + Tables.calculation_version + '" set IS_FROZEN = 1 where calculation_version_id = ?';
        await dbConnection.executeUpdate(sUpdateCalcVers, iCalculationVersionId);

        var sUpdateCalcVersTemp = 'update "' + Tables.calculation_version_temporary + '" set IS_FROZEN = 1 where session_id = ? and calculation_version_id = ?';
        await dbConnection.executeUpdate(sUpdateCalcVersTemp, sSessionId, iCalculationVersionId);

        var sUpdateOpenCalcVers = 'update "' + Tables.open_calculation_versions + '" set IS_WRITEABLE = 0 where session_id = ? and calculation_version_id = ?';
        await dbConnection.executeUpdate(sUpdateOpenCalcVers, sSessionId, iCalculationVersionId);
    };















    this.setFrozenFlags = async function (iCalculationVersionId, sSessionId, aLifecycleVersionsIds) {
        var sUpdateCalcVers = `update "${ Tables.calculation_version }" set IS_FROZEN = 1 where calculation_version_id = ?`;
        await dbConnection.executeUpdate(sUpdateCalcVers, iCalculationVersionId);

        var sUpdateCalcVersTemp = `update "${ Tables.calculation_version_temporary }" set IS_FROZEN = 1 where session_id = ? and calculation_version_id = ?`;
        await dbConnection.executeUpdate(sUpdateCalcVersTemp, sSessionId, iCalculationVersionId);

        var sUpdateOpenCalcVers = `update "${ Tables.open_calculation_versions }" set IS_WRITEABLE = 0 where session_id = ? and calculation_version_id = ?`;
        await dbConnection.executeUpdate(sUpdateOpenCalcVers, sSessionId, iCalculationVersionId);

        if (aLifecycleVersionsIds.length > 0) {
            var sUpdateLifecycleVers = `update "${ Tables.calculation_version }" set IS_FROZEN = 1 
				where calculation_version_id in ( ${ _.map(aLifecycleVersionsIds, iId => ' ? ').join(',') } )`;
            await dbConnection.executeUpdate(sUpdateLifecycleVers, [aLifecycleVersionsIds]);

            var sUpdateLifecycleVersTemp = `update "${ Tables.calculation_version_temporary }" set IS_FROZEN = 1 
				where calculation_version_id in ( ${ _.map(aLifecycleVersionsIds, iId => ' ? ').join(',') } )`;
            await dbConnection.executeUpdate(sUpdateLifecycleVersTemp, [aLifecycleVersionsIds]);
        }
    };















    this.isDirty = async function (iCalculationVersionId, sSessionId, sUserId) {
        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a string';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        var oStatement = hQuery.statement('select IS_DIRTY from "' + Tables.item_temporary + '"' + ' WHERE calculation_version_id = ? ' + ' AND PARENT_ITEM_ID is null ' + ' AND session_id IN (SELECT session_id FROM "' + Tables.session + '"  WHERE UCASE(user_id) = ? AND session_id = ? )');

        var aIsDirty = await oStatement.execute(iCalculationVersionId, sUserId.toUpperCase(), sSessionId);

        if (aIsDirty.length === 0 || aIsDirty.length > 1) {
            const sClientMsg = 'Corrupted query or database state during checking if calculation version is dirty.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        return aIsDirty[0].IS_DIRTY === 1 ? true : false;
    };

















    this.setDirty = async function (iCalculationVersionId, sSessionId, sUserId, bIsDirty) {
        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });
        oMessageDetails.addUserObj({ name: sUserId });

        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a string';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!await _.isNumber(bIsDirty) || bIsDirty % 1 !== 0 || bIsDirty < 0 || bIsDirty > 1) {
            const sLogMessage = 'bIsDirty must be 0 or 1.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }


        var oUpdateRootItemStatement = hQuery.statement('update "' + Tables.item_temporary + '"' + ' set is_dirty = ? WHERE calculation_version_id = ? ' + ' AND PARENT_ITEM_ID is null' + ' AND session_id IN (SELECT session_id FROM "' + Tables.session + '"  WHERE UCASE(user_id) = ? AND session_id = ? )');
        await oUpdateRootItemStatement.execute(bIsDirty, iCalculationVersionId, sUserId.toUpperCase(), sSessionId);
    };












    this.setNewId = async function (iOldCalcVersionId, sSessionId) {
        oMessageDetails.addCalculationVersionObjs({ id: iOldCalcVersionId });

        if (!await _.isNumber(iOldCalcVersionId)) {
            const sLogMessage = 'iOldCalcVersionId must be a number.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        var sSequence = Sequences.calculation_version;
        var iNewID = this.helper.getNextSequenceID(sSequence);


        try {
            var procedure = dbConnection.loadProcedure(Procedures.calculation_version_set_new_id);
            var result = procedure(sSessionId, iNewID, iOldCalcVersionId);
        } catch (e) {
            const sClientMsg = 'Error when setting new id for calculation version.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        return iNewID;
    };
















    this.update = async function (oCalculationVersion, aProtectedColumns, sSessionId) {
        if (!helpers.isPlainObject(oCalculationVersion)) {
            const sLogMessage = 'oCalculationVersion must be an object.';
            $.trace.error(sLogMessage);
            oMessageDetails.addCalculationVersionObjs(oCalculationVersion);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!helpers.isPositiveInteger(oCalculationVersion.CALCULATION_VERSION_ID)) {
            const sLogMessage = 'oCalculationVersion.CALCULATION_VERSION_ID must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        var iCalculationVersionId = helpers.toPositiveInteger(oCalculationVersion.CALCULATION_VERSION_ID);

        var aStmtBuilder = ['update "' + Tables.calculation_version_temporary + '" set '];


        var oCompleteUpdateSet = this.helper.setMissingPropertiesToNull(oCalculationVersion, Tables.calculation_version_temporary, aProtectedColumns);

        var aColumnNames = _.keys(oCompleteUpdateSet);
        _.each(aColumnNames, function (sColumnName, iIndex) {
            aStmtBuilder.push(sColumnName + ' = ?');
            if (iIndex < aColumnNames.length - 1) {
                aStmtBuilder.push(', ');
            }
        });
        aStmtBuilder.push(' where session_id = ? and calculation_version_id = ?');
        var aValues = _.values(oCompleteUpdateSet);
        aValues.push(sSessionId);
        aValues.push(iCalculationVersionId);
        var updateStmt = hQuery.statement(aStmtBuilder.join(''));
        var iAffectedRows = await updateStmt.execute(aValues);
        if (iAffectedRows > 1) {
            const sClientMsg = `Corrupted query or database state: modified ${ iAffectedRows } database records in ${ Tables.calculation_version_temporary } during the update of calculation version.`;
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }, data: ${ JSON.stringify(oCalculationVersion) }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        return iAffectedRows;
    };










    this.persistUpdatedColumns = async (iCvId, sSessionId, mTriggerColumnsChanged) => {
        const aUpdatedColums = [...mTriggerColumnsChanged.keys()];
        const aValuesAfterUpdate = [...mTriggerColumnsChanged.values()];
        aValuesAfterUpdate.push(iCvId);
        aValuesAfterUpdate.push(sSessionId);
        const sUpdateStmt = `update  "${ Tables.calculation_version_temporary }"
								set ${ aUpdatedColums.join(' = ?, ') } = ? where CALCULATION_VERSION_ID = ? and SESSION_ID = ?`;
        await dbConnection.executeUpdate(sUpdateStmt, [aValuesAfterUpdate]);
    };


















    this.triggerPriceDetermination = async function (iCvId, sSessionId, sUpdateScenario) {
        try {
            var func = dbConnection.loadProcedure(Procedures.calculation_version_trigger_price_determination);
            var oResult = func(iCvId, sSessionId, sUpdateScenario);

            return { UPDATED_ITEMS: Array.slice(oResult.OT_UPDATED_ITEMS) };
        } catch (e) {
            const sClientMsg = `Error while running automatic value determination for updated valuation date ${ dValuationDate.toString() }.`;
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCvId }, Session id: ${ sSessionId }), Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
    };

    this.updateMasterdataTimestamp = async function (iCvId, sSessionId, dMasterdataTimestamp) {
        try {
            var func = dbConnection.loadProcedure(Procedures.calculation_version_masterdata_timestamp_update);
            var oResult = func(iCvId, sSessionId, dMasterdataTimestamp);
            return oResult;
        } catch (e) {
            const sClientMsg = `Error while setting masterdata timestamp ${ dMasterdataTimestamp.toString() }.`;
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCvId }, Session id: ${ sSessionId }), Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
    };

    this.getExistingNonTemporaryMasterdata = async function (mParameters) {
        let dMasterdataTimestamp = null;
        let sControllingAreaId = null;

        if (mParameters['calculation_version_id'] && mParameters['session_id']) {
            let oResult = dbConnection.executeQuery(`
                    select  prj.controlling_area_id as controlling_area_id,
                            cvTemp.master_data_timestamp as master_data_timestamp
                    from "sap.plc.db::basis.t_project" as prj
                        inner join "sap.plc.db::basis.t_calculation" as calc
                            on prj.project_id = calc.project_id
                        inner join "sap.plc.db::basis.t_calculation_version_temporary" as cvTemp
                        on cvTemp.calculation_id = calc.calculation_id
                    where   cvTemp.session_id = ?
                        and cvTemp.calculation_version_id = ?
            `, mParameters['session_id'], mParameters['calculation_version_id']);




            sControllingAreaId = oResult[0] ? oResult[0].CONTROLLING_AREA_ID : '';
            dMasterdataTimestamp = oResult[0] ? oResult[0].MASTER_DATA_TIMESTAMP : new Date();
        } else if (mParameters['calculation_id']) {
            let oResult = dbConnection.executeQuery(`
                select controlling_area_id
                from "sap.plc.db::basis.t_project" as project 
                    inner join "sap.plc.db::basis.t_calculation"  as calculation
                        on project.project_id = calculation.project_id
                where   calculation.calculation_id = ?
            `, mParameters['calculation_id']);
            sControllingAreaId = oResult[0] ? oResult[0].CONTROLLING_AREA_ID : '';
            dMasterdataTimestamp = new Date();
        } else if (mParameters['project_id']) {
            let oResult = dbConnection.executeQuery(`
                    select controlling_area_id
                    from "sap.plc.db::basis.t_project" 
                    where   project_id = ? 
            `, mParameters['project_id']);
            sControllingAreaId = oResult[0] ? oResult[0].CONTROLLING_AREA_ID : '';
            dMasterdataTimestamp = new Date();
        } else {
            const sClientMsg = `Unknown parameter or unknown combination of parameters: ${ Object.keys(mParameters) }`;
            $.trace.error(sClientMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }




















        return this.helper.getExistingNonTemporaryMasterdataCombined(dMasterdataTimestamp, sControllingAreaId);
    };

    this.resetMissingNontemporaryMasterdata = async function (iCalculationVersionId, sSessionId) {
        try {
            var fnProcedure = dbConnection.loadProcedure(Procedures.calculation_version_reset_missing_nontemporary_masterdata);
            var oResult = fnProcedure(iCalculationVersionId, sSessionId);

            return {
                CHANGED_COSTING_SHEET_COUNT: oResult.OV_CHANGED_COSTING_SHEET_COUNT,
                CHANGED_COMPONENT_SPLIT_COUNT: oResult.OV_CHANGED_COMPONENT_SPLIT_COUNT,
                CHANGED_ITEMS_WITH_RESET_ACCOUNTS: oResult.OT_ITEMS_WITH_RESET_ACCOUNTS
            };

        } catch (e) {
            const sClientMsg = 'Error while trying to reset missing non-temporary masterdata for calculation version.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }, Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, null, null, e);
        }
    };








    this.getStatusById = async function (sStatusId) {
        var sStmt = `SELECT * FROM "${ Tables.status }" WHERE STATUS_ID = ?`;
        return dbConnection.executeQuery(sStmt, sStatusId)[0];
    };



















    this.copy = async function (iCalculationVersionId, sSessionId, sUserId, sLanguage, bCompressedResult) {

        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });
        oMessageDetails.addUserObj({ id: sUserId });

        await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
        if (!_.isString(sSessionId) || !_.isString(sUserId)) {
            const sLogMessage = 'Wrong parameters found during calculation version copy: sSessionId and sUserId must be strings.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        var oReturnObject = {
            version: {},
            items: [],
            itemsCompressed: {},
            referencesdata: {
                PROJECTS: [],
                CALCULATIONS: [],
                CALCULATION_VERSIONS: [],
                MASTERDATA: {}
            }
        };


        var sSequenceCV = Sequences.calculation_version;
        var iNewCalculationVersionID = this.helper.getNextSequenceID(sSequenceCV);


        try {
            var procedure = dbConnection.loadProcedure(Procedures.calculation_version_copy);
            var result = procedure(iCalculationVersionId, iNewCalculationVersionID, sSessionId);
        } catch (e) {
            const sClientMsg = `Error when procedure ${ Procedures.calculation_version_copy } is called.`;
            const sServerMsg = `${ sClientMsg } Error message: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        var aCalculationVersion = result.OT_NEW_CALCULATION_VERSION;
        if (aCalculationVersion.length === 1) {
            oReturnObject.calculation_version = _.clone(aCalculationVersion[0]);


            oReturnObject.calculation_version.CALCULATION_VERSION_NAME = this.getOrDetermineNewCalculationVersionName(oReturnObject.calculation_version);
            if (oReturnObject.calculation_version.CALCULATION_VERSION_NAME.length > constants.CalculationNameMaxLength) {
                const sClientMsg = `The calculation version name has more than ${ constants.CalculationNameMaxLength } characters.`;
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
            }
            var aProtectedColumnsUpdate = [
                'SESSION_ID',
                'CALCULATION_VERSION_ID',
                'CALCULATION_ID',
                'MASTER_DATA_TIMESTAMP',
                'LAST_MODIFIED_ON',
                'LAST_MODIFIED_BY',
                'IS_DIRTY',
                'STATUS_ID'
            ];

            await this.update(oReturnObject.calculation_version, aProtectedColumnsUpdate, sSessionId);
        } else {
            const sLogMessage = 'More than one version found during calculation version copy.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        if (bCompressedResult) {
            oReturnObject.itemsCompressed = helpers.transposeResultArray(result.OT_NEW_ITEMS, false);
        } else {
            oReturnObject.items = Array.slice(result.OT_NEW_ITEMS);
        }

        oReturnObject = this.getReferencedVersionDetails(oReturnObject, sLanguage);

        return oReturnObject;
    };









    this.checkSavedVersion = async function (iCalculationId) {
        oMessageDetails.addCalculationObjs({ id: iCalculationId });

        if (!helpers.isPositiveInteger(iCalculationId)) {
            const sLogMessage = 'iCalculationId must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }


        var oSelectedVersion = await hQuery.statement('select top 1 CALCULATION_ID from "' + Tables.calculation_version + '"' + 'where CALCULATION_ID = ?').execute(iCalculationId);
        if (oSelectedVersion.length > 0) {
            return 1;
        } else {
            return 0;
        }
    };


























    this.get = async function (aCalculationId, iTop, bRecentlyUsed, iId, bLoadMasterdata, sUserId, sLanguage, bCurrent, bReturnLifecycle, bGetOnlyLifecycles, bReturnOnlyRoot) {

        var calculationVersionGet = dbConnection.loadProcedure(Procedures.calculations_versions_read);
        if (iTop == null) {
            var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation_version + '"');
            var aCount = await oCheckStatement.execute();
            iTop = parseInt(aCount[0].ROWCOUNT);
        }

        if (!helpers.isNullOrUndefined(aCalculationId)) {
            var aCalcIds = aCalculationId.split(',');
            const aCalculation = _.map(aCalcIds, function (oCalcId) {
                return [parseInt(oCalcId)];
            });
            var sInsertStmt = `insert into "${ Tables.gtt_calculation_ids }" values(?)`;
            await dbConnection.executeUpdate(sInsertStmt, aCalculation);
        }

        var result = calculationVersionGet(iTop, bRecentlyUsed, iId, bLoadMasterdata, sUserId, sLanguage, bCurrent, bReturnLifecycle, bGetOnlyLifecycles, bReturnOnlyRoot);

        const oReturnObject = {
            CALCULATION_VERSIONS: {},
            CALCULATIONS: [],
            PROJECTS: [],
            ITEMS: [],
            MASTERDATA: {}
        };

        oReturnObject.CALCULATION_VERSIONS = Array.slice(result.OT_CALCULATION_VERSIONS);
        oReturnObject.PROJECTS = Array.slice(result.OT_PROJECTS);
        oReturnObject.ITEMS = Array.slice(result.OT_ITEMS);
        oReturnObject.CALCULATIONS = Array.slice(result.OT_CALCULATIONS);

        var mMasterdataContainer = {};
        mMasterdataContainer[BusinessObjectsEntities.UOM_ENTITIES] = Array.slice(result.OT_UOM);
        mMasterdataContainer[BusinessObjectsEntities.CURRENCY_ENTITIES] = Array.slice(result.OT_CURRENCY);
        mMasterdataContainer[BusinessObjectsEntities.EXCHANGE_RATE_TYPE_ENTITIES] = Array.from(result.OT_EXCHANGE_RATE_TYPE);

        this.getReferencedVersionDetails(oReturnObject, sLanguage);
        oReturnObject.MASTERDATA = mMasterdataContainer;
        return oReturnObject;
    };













    this.recover = async function (iTop, sUserId) {
        var calculationVersionRecover = dbConnection.loadProcedure(Procedures.calculations_version_recover);
        if (iTop == null) {
            var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation_version + '"');
            var aCount = await oCheckStatement.execute();
            iTop = parseInt(aCount[0].ROWCOUNT);
        }

        var result = calculationVersionRecover(iTop, sUserId);

        var oReturnObject = {
            CALCULATION_VERSIONS: [],
            CALCULATIONS: [],
            PROJECTS: [],
            ITEMS: []
        };

        oReturnObject.CALCULATION_VERSIONS = Array.slice(result.OT_CALCULATION_VERSIONS);
        oReturnObject.PROJECTS = Array.slice(result.OT_PROJECTS);
        oReturnObject.ITEMS = Array.slice(result.OT_ITEMS);
        oReturnObject.CALCULATIONS = Array.slice(result.OT_CALCULATIONS);

        return oReturnObject;
    };











    async function updateRecentlyUsed(iCalculationVersionId, sUserId, bDelete) {
        if (bDelete == true) {
            const oUpdateRecentCalculationVersion = hQuery.statement('DELETE from  "' + Tables.recent_calculation_versions + '"' + ' where CALCULATION_VERSION_ID =? and USER_ID =?');
            await oUpdateRecentCalculationVersion.execute(iCalculationVersionId, sUserId);
        } else {
            const oUpdateRecentCalculationVersion = hQuery.statement('upsert "' + Tables.recent_calculation_versions + '"' + ' values (?, ?, current_utctimestamp) where CALCULATION_VERSION_ID = ? and USER_ID = ?');
            await oUpdateRecentCalculationVersion.execute(iCalculationVersionId, sUserId, iCalculationVersionId, sUserId);
        }

    }








    this.getControllingAreasForCalculationVersions = async function (aCalculationVersionIds) {

        if (!_.isArray(aCalculationVersionIds)) {
            const sLogMessage = 'aCalculationVersionIds must be an array.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        var aValues = [];
        var aStmtBuilder = [];

        _.each(aCalculationVersionIds, async function (iCalculationVersionId, iIndex) {
            await checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

            aValues.push(iCalculationVersionId);
            aStmtBuilder.push('?');
        });
        var sInValues = aStmtBuilder.join(', ');

        var aResult = await hQuery.statement(`select distinct prj.CONTROLLING_AREA_ID 
					from "${ Tables.project }" prj 
				inner join "${ Tables.calculation }" calc 
					on calc.PROJECT_ID = prj.PROJECT_ID 
				inner join "${ Tables.calculation_version }" calcVers 
					on calcVers.CALCULATION_ID = calc.CALCULATION_ID 
				where calculation_version_id in ( ${ sInValues } );`).execute(aValues);

        if (aResult.length > 0)
            return _.map(aResult, 'CONTROLLING_AREA_ID');

        return [];
    };










    this.getProjectPropertiesForCalculationVersion = async function (iCalculationVersionId, bTemporary) {
        bTemporary = bTemporary === undefined ? true : bTemporary;

        var sCalculationVersionTable = Tables.calculation_version_temporary;
        if (bTemporary === false) {
            sCalculationVersionTable = Tables.calculation_version;
        }

        var result = await hQuery.statement(`select prj.PROJECT_ID, prj.REPORT_CURRENCY_ID, prj.CONTROLLING_AREA_ID 
							from "${ Tables.project }" prj 
							inner join "${ Tables.calculation }" calc 
								on calc.PROJECT_ID = prj.PROJECT_ID 
							inner join "${ sCalculationVersionTable }" calcVers 
								on calcVers.CALCULATION_ID = calc.CALCULATION_ID where calculation_version_id = ?`).execute(iCalculationVersionId);
        return result[0] || null;
    };
















    this.getCalculationVersionsToBeReferenced = async function (iCalcVersionId, sFilters, sSortingColumn, sSortingDirection, iTop, sLanguage, sUserId) {

        var aValues = [];



        let sStmt = `select top ?  
	    		distinct cv.CALCULATION_VERSION_ID, cv.CALCULATION_VERSION_NAME, cv.CUSTOMER_ID, cv.LAST_MODIFIED_ON, cv.LAST_MODIFIED_BY,
	    		calc.CALCULATION_ID, calc.CALCULATION_NAME, prj.PROJECT_ID, prj.PROJECT_NAME, prj.PROJECT_RESPONSIBLE, cv.REPORT_CURRENCY_ID, cv.EXCHANGE_RATE_TYPE_ID, 
	    		item.TOTAL_COST, item.TOTAL_QUANTITY, item.TOTAL_QUANTITY_UOM_ID, item.MATERIAL_ID, item.PLANT_ID, 
	    		cust.CUSTOMER_NAME as PROJECT_CUSTOMER_NAME, cust1.CUSTOMER_NAME as CALCULATION_VERSION_CUSTOMER_NAME 
	    	from "${ Views.calculation_version_with_privileges }" cv 
	    		inner join "${ Tables.calculation }" calc on calc.calculation_id=cv.calculation_id 
	    		inner join "${ Tables.project }" prj on prj.project_id=calc.project_id 
	    		inner join "${ Tables.item }" item on item.item_id=cv.root_item_id and item.CALCULATION_VERSION_ID = cv.CALCULATION_VERSION_ID 
	    		left outer join "${ Tables.customer }" cust on cust.CUSTOMER_ID=prj.CUSTOMER_ID 
	    		left outer join "${ Tables.customer }" cust1 on cust1.CUSTOMER_ID=cv.CUSTOMER_ID 
	    		left outer join "${ Tables.plant_text }" plant on plant.PLANT_ID=item.PLANT_ID and plant.LANGUAGE = ? 
	    		left outer join "${ Tables.material_text }" mat on mat.MATERIAL_ID=item.MATERIAL_ID and mat.LANGUAGE = ? 
	    	where cv.USER_ID = ? and calc.CURRENT_CALCULATION_VERSION_ID = cv.CALCULATION_VERSION_ID and cv.CALCULATION_VERSION_ID <> ? 
	    		and prj.CONTROLLING_AREA_ID in 
	    			(select prj1.controlling_area_id from "${ Tables.project }" prj1 
	    				inner join "${ Tables.calculation }" calc1 on calc1.project_id=prj1.project_id 
	    				inner join  
	    					(select calculation_id, calculation_version_id from "${ Tables.calculation_version }" 
	    					 union 
	    					 select calculation_id, calculation_version_id from "${ Tables.calculation_version_temporary }"
	    					 ) cv1 
	    				on cv1.calculation_id = calc1.calculation_id and cv1.CALCULATION_VERSION_ID = ?)
	    `;

        aValues.push(iTop, sLanguage, sLanguage, sUserId, iCalcVersionId, iCalcVersionId);

        if (!helpers.isNullOrUndefined(sFilters)) {
            sFilters = sFilters.replace('+', '*');
            var aObjectsList = sFilters.split(',');
            aObjectsList.forEach(async function (obj) {
                sStmt += ` and `;
                var sFilter = '*' + obj.substr(obj.indexOf('=') + 1) + '*';
                var sFilterType = obj.substr(0, obj.indexOf('='));
                switch (sFilterType.toUpperCase()) {
                case 'CALCULATION_VERSION':
                    sStmt += `(contains(cv.CALCULATION_VERSION_ID, ?) or contains(cv.CALCULATION_VERSION_NAME, ?))`;
                    aValues.push(sFilter);
                    aValues.push(sFilter);
                    break;
                case 'CALCULATION':
                    sStmt += `(contains(calc.CALCULATION_ID, ?) or contains(calc.CALCULATION_NAME, ?))`;
                    aValues.push(sFilter);
                    aValues.push(sFilter);
                    break;
                case 'PROJECT':
                    sStmt += `(contains(prj.PROJECT_ID, ?) or contains( prj.PROJECT_NAME, ?))`;
                    aValues.push(sFilter);
                    aValues.push(sFilter);
                    break;
                case 'PLANT':
                    sStmt += `(contains(item.PLANT_ID, ?) or contains(plant.PLANT_DESCRIPTION, ?))`;
                    aValues.push(sFilter);
                    aValues.push(sFilter);
                    break;
                case 'CUSTOMER':
                    sStmt += `(contains((prj.CUSTOMER_ID, cv.CUSTOMER_ID, cust1.CUSTOMER_NAME, cust.CUSTOMER_NAME), ?))`;
                    aValues.push(sFilter);
                    break;
                case 'MATERIAL':
                    sStmt += `(contains(item.MATERIAL_ID, ?) or contains(mat.MATERIAL_DESCRIPTION, ?))`;
                    aValues.push(sFilter);
                    aValues.push(sFilter);
                    break;
                default: {
                        const sLogMessage = `Invalid filter object: ${ sFilterType }.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                    }
                }
            });
        }
        sStmt += ` order by ${ sSortingColumn }  ${ sSortingDirection };`;

        try {
            var oStatement = hQuery.statement(sStmt);
            var aResult = await oStatement.execute(aValues);
        } catch (e) {
            const sClientMsg = 'Error while executing the selection of versions that can be referenced.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

        return aResult;

    };









    this.getLifecycleVersionsIds = async function (iCalculationVersionId) {
        var sStmt = `select CALCULATION_VERSION_ID from "${ Tables.calculation_version }" where BASE_VERSION_ID = ?`;
        var oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);

        return _.map(oResult, 'CALCULATION_VERSION_ID');
    };











    this.getMasterVersions = async function (iCalcVersionId) {
        try {
            var oStatement = hQuery.statement(`select distinct CALCULATION_VERSION_ID 
						from "${ Tables.item }" 
					  where REFERENCED_CALCULATION_VERSION_ID = ?
					  union 
					  select calculation_version_id 
					  	from "${ Tables.item_temporary }"
					  where REFERENCED_CALCULATION_VERSION_ID = ?;`);
            var aVersionsIds = await oStatement.execute(iCalcVersionId, iCalcVersionId);
        } catch (e) {
            const sClientMsg = 'Error during selecting the versions where the calculation version is referenced.';
            const sServerMsg = `${ sClientMsg } Calculation Version Id: ${ iCalcVersionId }, Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
        return aVersionsIds;
    };












    this.priceDetermination = function (iCvId) {
        var fProcedure = dbConnection.loadProcedure(Procedures.calculation_version_price_determination);
        fProcedure(iCvId);
    };











    this.getLifecycleMasterVersionsForBaseVersion = async function (iCalculationVersionId) {
        var sStmt = `	select  
							item.calculation_version_id as referencing_version_id,
							versions.calculation_version_id as lifecycle_version_id,
							referencing_versions.base_version_id as referencing_base_version_id
						from 	"${ Tables.item }" as item
							inner join "${ Tables.calculation_version }" as versions
								on item.referenced_calculation_version_id = versions.calculation_version_id
							inner join "${ Tables.calculation_version }" as referencing_versions
								on referencing_versions.calculation_version_id = item.calculation_version_id 
						where versions.base_version_id = ?
						union
						select  
							item_temp.calculation_version_id  as referencing_version_id,
							versions.calculation_version_id as lifecycle_version_id,
							referencing_versions.base_version_id as referencing_base_version_id
						from 	"${ Tables.item_temporary }" as item_temp
							inner join "${ Tables.calculation_version }" as versions
								on item_temp.referenced_calculation_version_id = versions.calculation_version_id
							inner join "${ Tables.calculation_version }" as referencing_versions
								on referencing_versions.calculation_version_id = item_temp.calculation_version_id 
						where versions.base_version_id = ?;
					`;
        var aOpenVersions = dbConnection.executeQuery(sStmt, iCalculationVersionId, iCalculationVersionId);
        return Array.slice(aOpenVersions);
    };






    this.updateCalculationVersionType = async (iCalculationVersionId, iCalculationVersionType) => {
        const sStmt = ` UPDATE "${ Tables.calculation_version }"
					SET CALCULATION_VERSION_TYPE = ?
					WHERE CALCULATION_VERSION_ID = ?`;
        return await dbConnection.executeUpdate(sStmt, iCalculationVersionType, iCalculationVersionId);
    };





    this.getVersionRootItemId = async iCalculationVersionId => {
        const sStmt = ` SELECT ROOT_ITEM_ID FROM "${ Tables.calculation_version }"
					WHERE CALCULATION_VERSION_ID = ?`;
        return Array.from(dbConnection.executeQuery(sStmt, iCalculationVersionId));

    };










    this.addCurrencyUnitsToCalculationResults = async (iCalculationVersionId, oItemCalc, oPersistency, bCompressed) => {
        if (oPersistency.Metadata.getAllCustomFieldsNamesAsArray().length > 0) {

            const fnDetermination = dbConnection.loadProcedure(Procedures.item_custom_fields_currency_get);
            const oResult = fnDetermination(iCalculationVersionId);
            const aItemCFsCurrency = helpers.transposeResultArrayOfObjects(oResult.OT_ITEMS_CUSTOM_FIELDS_CURRENCY);






            if (Object.keys(aItemCFsCurrency).length > 2) {
                for (let sItemExtProperty in aItemCFsCurrency) {
                    if (sItemExtProperty !== 'ITEM_ID') {
                        if (bCompressed === true) {
                            let aItemsToPush = [];
                            oItemCalc['ITEM_ID'].forEach(element => {
                                let indexOfItemId = aItemCFsCurrency['ITEM_ID'].indexOf(element);
                                if (aItemCFsCurrency['CALCULATION_VERSION_ID'][indexOfItemId] === iCalculationVersionId) {
                                    aItemsToPush.push(aItemCFsCurrency[sItemExtProperty][indexOfItemId]);
                                }
                            });
                            oItemCalc[sItemExtProperty] = aItemsToPush;
                        } else {
                            oItemCalc.forEach(oItem => {
                                let indexOfItemId = aItemCFsCurrency['ITEM_ID'].indexOf(oItem.ITEM_ID);
                                oItem[sItemExtProperty] = aItemCFsCurrency[sItemExtProperty][indexOfItemId];
                            });
                        }
                    }
                }
            }
        }
    };






    this.getLifecyclePeriodDescription = async iCalculationVersionId => {

        let sGetStmt = `select 
		case
			when upper(lc_types.period_type) = 'YEARLY' then
					to_varchar(to_integer(calc_vers.lifecycle_period_from/12) + 1900)
			when lc_months.month_description is not null then
				concat(to_varchar(to_integer(calc_vers.lifecycle_period_from/12) + 1900), concat(' - ', lc_months.month_description))
			else
				concat(to_varchar(to_integer(calc_vers.lifecycle_period_from/12) + 1900), concat(' - M', lc_months.selected_month))
		end as LIFECYCLE_PERIOD_FROM_DESCRIPTION
		from "sap.plc.db::basis.t_calculation_version" calc_vers
		inner join 	"sap.plc.db::basis.t_calculation" calc on  calc_vers.CALCULATION_ID =  calc.CALCULATION_ID
		inner join "sap.plc.db::basis.t_project"  proj on proj.PROJECT_ID = calc.PROJECT_ID
		inner join "sap.plc.db::basis.t_project_lifecycle_period_type" lc_types 
			on lc_types.PROJECT_ID = proj.PROJECT_ID
			and lc_types.YEAR = to_varchar(to_integer(calc_vers.lifecycle_period_from/12) + 1900)
		inner join "sap.plc.db::basis.t_project_monthly_lifecycle_period" lc_months 
			 on lc_months.PROJECT_ID = proj.PROJECT_ID
			 and lc_months.SELECTED_MONTH = month(add_months(to_date('1900', 'YYYY'), calc_vers.lifecycle_period_from))
			 and lc_months.YEAR  = to_varchar(to_integer(calc_vers.lifecycle_period_from/12) + 1900)
		where calc_vers.CALCULATION_VERSION_ID = ${ iCalculationVersionId }
		and calc_vers.CALCULATION_VERSION_TYPE in (${ constants.CalculationVersionType.Lifecycle }, ${ constants.CalculationVersionType.ManualLifecycleVersion });`;

        let aResult = dbConnection.executeQuery(sGetStmt);

        if (aResult.length === 1) {
            return aResult[0].LIFECYCLE_PERIOD_FROM_DESCRIPTION;
        } else {
            return '';
        }
    };
}
CalculationVersion.prototype = Object.create(CalculationVersion.prototype);
CalculationVersion.prototype.constructor = CalculationVersion;

module.exports.CalculationVersion = CalculationVersion;
export default {_,helpers,Helper,Misc,Session,BusinessObjectsEntities,BusinessObjectTypes,Metadata,constants,authorizationManager,InstancePrivileges,MessageLibrary,PlcException,Code,MessageDetails,Views,Sequences,DefaultValues,CalculationVersion};
