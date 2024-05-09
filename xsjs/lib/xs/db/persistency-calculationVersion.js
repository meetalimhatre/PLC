const _ = require("lodash");
const helpers = require("../util/helpers");
const Helper = require("./persistency-helper").Helper;
const Misc = require("./persistency-misc").Misc;
const Session = require("./persistency-session").Session;
const BusinessObjectsEntities = require("../util/masterdataResources").BusinessObjectsEntities;
const BusinessObjectTypes = require("../util/constants").BusinessObjectTypes;
const Metadata = require("./persistency-metadata").Metadata;
const constants = require("../util/constants");
const authorizationManager = require("../authorization/authorization-manager");
const InstancePrivileges = authorizationManager.Privileges;

const MessageLibrary = require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

module.exports.Tables = Object.freeze({
	calculation : 'sap.plc.db::basis.t_calculation',
	calculation_version_temporary : 'sap.plc.db::basis.t_calculation_version_temporary',
	calculation_version : 'sap.plc.db::basis.t_calculation_version',
	component_split__text : 'sap.plc.db::basis.t_component_split__text',
	item : 'sap.plc.db::basis.t_item',
	status : 'sap.plc.db::basis.t_status',
	item_ext : 'sap.plc.db::basis.t_item_ext',
	item_temporary : 'sap.plc.db::basis.t_item_temporary',
	item_temporary_ext : 'sap.plc.db::basis.t_item_temporary_ext',
	item_calculated_values_costing_sheet : 'sap.plc.db::basis.t_item_calculated_values_costing_sheet',
	item_calculated_values_component_split : 'sap.plc.db::basis.t_item_calculated_values_component_split',
	open_calculation_versions : 'sap.plc.db::basis.t_open_calculation_versions',
	session : 'sap.plc.db::basis.t_session',
	application_timeout : 'sap.plc.db::basis.t_application_timeout',
	recent_calculation_versions : 'sap.plc.db::basis.t_recent_calculation_versions',
	project : 'sap.plc.db::basis.t_project',
	plant_text: 'sap.plc.db::basis.t_plant__text',
	material_text: 'sap.plc.db::basis.t_material__text',
	customer: 'sap.plc.db::basis.t_customer',
	gtt_calculation_ids : 'sap.plc.db::temp.gtt_calculation_ids',
	gtt_calculation_version_ids : 'sap.plc.db::temp.gtt_calculation_version_ids',
	variant_temporary : 'sap.plc.db::basis.t_variant_temporary',
	variant_item_temporary : 'sap.plc.db::basis.t_variant_item_temporary'
});

const Views = Object.freeze({
	calculation_version_with_privileges : 'sap.plc.db.authorization::privileges.v_calculation_version_read'
});

module.exports.Procedures = Object
		.freeze({
			calculation_version_copy : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_copy',
			calculation_version_open : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_open',
			calculations_versions_read : 'sap.plc.db.calculationmanager.procedures::p_calculations_versions_read',
			calculation_version_set_new_id : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_set_new_id',
			calculation_version_close : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_close',
			calculation_version_delete : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_delete',
			calculation_version_save : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_save',
			calculation_version_trigger_price_determination  : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_trigger_price_determination',
			calculation_version_masterdata_timestamp_update : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_masterdata_timestamp_update',
			calculation : 'sap.plc.db.calcengine.procedures::p_calculation',
			calculation_save_results : 'sap.plc.db.calcengine.procedures::p_calculation_save_results',
			calculate_saved_calculation_version: 'sap.plc.db.calcengine.procedures::p_calculate_saved_calculation_version',
			calculation_version_reset_missing_nontemporary_masterdata : 'sap.plc.db.calculationmanager.procedures::p_calculation_version_reset_missing_nontemporary_masterdata',
			referenced_calculation_version_read : 'sap.plc.db.calculationmanager.procedures::p_referenced_calculation_version_data_read',
			calculations_version_recover : 'sap.plc.db.calculationmanager.procedures::p_calculations_versions_recover',
			calculation_version_price_determination : 'sap.plc.db.calculationmanager.procedures::p_lifecycle_calculation_version_price_determination',
			item_custom_fields_currency_get : 'sap.plc.db.calculationmanager.procedures::p_item_custom_fields_currency_get',
		});

const Sequences = Object.freeze({
	calculation_version : 'sap.plc.db.sequence::s_calculation_version'
});

const DefaultValues = Object.freeze({
	newEntityIsDirty : 1,
	newEntityIsWriteable : 1
});

function CalculationVersion($, dbConnection, hQuery, sUserId) {
	const Tables = module.exports.Tables; // for easy mock in testing
	const Procedures = module.exports.Procedures; // for easy mock in testing

	this.sUserId = sUserId;
	this.helper = new Helper($, hQuery, dbConnection);
	this.misc = new Misc($, hQuery, sUserId);
	this.session = new Session($, dbConnection, hQuery);

	// to avoid unnecessary import callings to improve performance, delay loading and creating of below objects
	Object.defineProperties(this, {
		item: {
			get: () => {
				return (() => {
					if (undefined === this._item) {
						var Item = require("./persistency-item").Item;
						this._item = new Item($, dbConnection, hQuery, sUserId);
					}
					return this._item;
				})()
			}
		},
		administration: {
			get: () => {
				return (() => {
					if (undefined === this._administration) {
						var Administration = $.import("xs.db", "persistency-administration").Administration;
						this._administration = new Administration(dbConnection, hQuery);
					}
					return this._administration;
				})()
			}
		},
		variant: {
			get: () => {
				return (() => {
					if (undefined === this._variant) {
						var Variant = require("./persistency-variant").Variant;
						this._variant = new Variant($, dbConnection, hQuery);
					}
					return this._variant;
				})()
			}
		}
	});
	
	var metadata = new Metadata($, hQuery, null, sUserId);
	var oMessageDetails = new MessageDetails();
	var sessionTimeout = constants.ApplicationTimeout.SessionTimeout;
	var that = this;
	
    function checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId){
        if (!helpers.isPositiveInteger(iCalculationVersionId)) {
             oMessageDetails.addCalculationVersionObjs({
                 id : iCalculationVersionId
             });
             const sLogMessage = "iCalculationVersionId must be a positive integer.";
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
	this.close = function(iCalculationVersionId, sSessionId) {
		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		
		if (!_.isString(sSessionId)) {
			const sLogMessage = "sSessionId must be a string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		try {
			var procedure = dbConnection.loadProcedure(Procedures.calculation_version_close);
			procedure(iCalculationVersionId, sSessionId);
		} catch (e) {
		    const sClientMsg = "Error during closing calculation version.";
		    const sServerMsg = `${sClientMsg} Calculation version id:${iCalculationVersionId}, session ${sSessionId}.`;
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
	this.create = function(oCalculationVersion, sSessionId, sUserId) {
		if (!_.isObject(oCalculationVersion)) {
			const sLogMessage = "oCalculationVersion must be a valid object.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		if (!_.isString(sSessionId)) {
			const sLogMessage = "sSessionId must be a string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		if (!_.isString(sUserId)) {
			const sLogMessage = "sUserId must be a string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		// Exclude the properties that are not plain objects and which are protected with regard to internal logic
		var aPropertiesToExclude = _.filter(_.keys(oCalculationVersion), function(sKey) {
			return _.isArray(oCalculationVersion[sKey]);
		});
		aPropertiesToExclude.push("IS_DIRTY");

		var sCalculationVersionName = this.getOrDetermineNewCalculationVersionName(oCalculationVersion);
		let sStatusId = this.getDefaultStatusId();
		var iCalculationVersionId = this.helper.getNextSequenceID(Sequences.calculation_version);

		var oGeneratedValues = {
			"SESSION_ID" : sSessionId,
			"CALCULATION_VERSION_ID" : iCalculationVersionId,
			"CALCULATION_VERSION_NAME" : sCalculationVersionName,
			"STATUS_ID" : sStatusId
		};
		var oSettings = {
			TABLE : Tables.calculation_version_temporary,
			PROPERTIES_TO_EXCLUDE : aPropertiesToExclude,
			GENERATED_PROPERTIES : oGeneratedValues
		};

		var oResultSet = this.helper.insertNewEntity(oCalculationVersion, oSettings);

		var iIsWriteable = DefaultValues.newEntityIsWriteable;
		var sUpsertOpenCv = `upsert "${Tables.open_calculation_versions}" (session_id, calculation_version_id, is_writeable)
			values (?, ?, ?) where session_id = ? and calculation_version_id = ?`;			
		dbConnection.executeUpdate(sUpsertOpenCv, sSessionId, iCalculationVersionId, iIsWriteable, sSessionId, iCalculationVersionId);

		// Create items from nested item objects and update their CalculationVersionId
		var oItemCreateResult = this.item.create(oCalculationVersion.ITEMS, sSessionId, iCalculationVersionId, 0, 1, 0);
		//(aItems, sSessionId, iCvId, iImport, iSetDefaultValues, iUpdateMasterDataAndPrices)
		// TODO: refactor create calculation version? it's a little bit awkward how result objects are updated;
		// difference between item (procedure) and calculation version (insertEntity)
		oCalculationVersion.ITEMS = Array.from(oItemCreateResult.OT_NEW_ITEMS);

		var oUpdateStatement = hQuery.statement('update "' + Tables.calculation_version_temporary + '" set ROOT_ITEM_ID = ? '
				+ ' where session_id = ? and calculation_version_id = ?');
		oUpdateStatement.execute(oCalculationVersion.ITEMS[0].ITEM_ID, sSessionId,iCalculationVersionId);

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
	this.exists = function(iCalculationVersionId) {
	    checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

		var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation_version
				+ '" where calculation_version_id=?');
		var aCount = oCheckStatement.execute(iCalculationVersionId);

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
	this.existsCVTemp = function(iCalculationVersionId, sSessionId) {
	    checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

		var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation_version_temporary
				+ '" where session_id=? and calculation_version_id=?');
		var aCount = oCheckStatement.execute(sSessionId, iCalculationVersionId);

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
	this.isNameUniqueInBothTables = function(sCalculationVersionName, iCalculationId) {
		var aStmtBuilder = [ 'SELECT calculation_version_name FROM "' + Tables.calculation_version_temporary + '"' ];
		aStmtBuilder.push("WHERE calculation_version_name = ?");
		aStmtBuilder.push("AND calculation_id = ?");
		aStmtBuilder.push("UNION");
		aStmtBuilder.push('SELECT calculation_version_name FROM "' + Tables.calculation_version + '"');
		aStmtBuilder.push("WHERE calculation_version_name = ?");
		aStmtBuilder.push("AND calculation_id = ?");

		var sQuery = aStmtBuilder.join(" ");
		var oStatement = hQuery.statement(sQuery);
		var aResult = oStatement.execute(sCalculationVersionName, iCalculationId, sCalculationVersionName, iCalculationId);

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
	this.findNameWithPrefix = function(sCalculationVersionPrefix, iCalculationId) {
		var aStmtBuilder = [ 'SELECT calculation_version_name FROM "' + Tables.calculation_version_temporary + '"' ];
		aStmtBuilder.push("WHERE calculation_version_name LIKE concat(?, ' (%)')");
		aStmtBuilder.push("AND calculation_id = ?");
		aStmtBuilder.push("UNION");
		aStmtBuilder.push('SELECT calculation_version_name FROM "' + Tables.calculation_version + '"');
		aStmtBuilder.push("WHERE calculation_version_name LIKE concat(?, ' (%)')");
		aStmtBuilder.push("AND calculation_id = ?");

		var sQuery = aStmtBuilder.join(" ");
		var oStatement = hQuery.statement(sQuery);
		var aResult = oStatement.execute(sCalculationVersionPrefix, iCalculationId, sCalculationVersionPrefix, iCalculationId);

		if (aResult.length > 0)
			return _.map(aResult, "CALCULATION_VERSION_NAME");

		return [];

	};

	/**
	 * Determine name for new calculation version
	 *
	 * @param {object}
	 *            oCalculationVersion - new calculation version object
	 * @returns {string} - calculation version name
	 */
	this.getOrDetermineNewCalculationVersionName = function(oCalculationVersion) {

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
			var iSuffix = helpers.findFirstUnusedSuffixInStringArray(oSplitedCalculationVersionName.Prefix,
					oSplitedCalculationVersionName.StartSuffix, aNamesWithPrefix);

			sCalculationVersionName = oSplitedCalculationVersionName.Prefix + " (" + iSuffix.toString() + ")";
		}

		return sCalculationVersionName;

	};

	/**
	 * Gets the default STATUS_ID
	 *
	 * @returns {string} - default STATUS_ID or null if it does not exist
	 */
	this.getDefaultStatusId = function() {
		let sStmt = `SELECT STATUS_ID FROM "${Tables.status}" WHERE IS_DEFAULT = 1`;
		let result = dbConnection.executeQuery(sStmt);
  		return _.get(_.find(result, 'STATUS_ID'), "STATUS_ID", null);
	};
	
	/**
	 * Sets properties of copied Manual or Lifecycle Version to make it a base ("normal") version
	 */
	this.setLifecycleVersionPropertiesToBaseProperties = function(oUpdatedVersion, oOldVersion, aProtectedColumns, sSessionId) {
		if(oOldVersion.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.Lifecycle ||
		   oOldVersion.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.ManualLifecycleVersion) {
    	    // Proceed only with a lifecycle version

		    // reset all lifecycle-related properties to make it a base version
	    	oUpdatedVersion.BASE_VERSION_ID = null;
		    oUpdatedVersion.CALCULATION_VERSION_TYPE = constants.CalculationVersionType.Base; 
		    oUpdatedVersion.LIFECYCLE_PERIOD_FROM = null;
        
		    // remove the defined fields from protected columns since they have to be overwritten
            aProtectedColumns = _.difference(aProtectedColumns, ["BASE_VERSION_ID", "CALCULATION_VERSION_TYPE", "LIFECYCLE_PERIOD_FROM"]);
        
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
		    var aOpenVersions = dbConnection.executeUpdate(sStmt, oUpdatedVersion.CALCULATION_VERSION_ID, sSessionId);
		}
		return aProtectedColumns;
	};

	/**
	 * When a lifecycle version is saved it changes its type to manual lifecycle version (16).
	 */
	this.setLifecycleVersionTypeToManual = function (oCalculationVersion, sSessionId) {
	    const iCalculationVersionType = this.getVersionType(oCalculationVersion.CALCULATION_VERSION_ID, sSessionId);
		if ( iCalculationVersionType === constants.CalculationVersionType.Lifecycle) {
			// Proceed only with a lifecycle version and set calculation version type as Manual lifecycle version
			const sUpdateStatement =`  UPDATE "sap.plc.db::basis.t_calculation_version_temporary" 
				                        SET 
				                              "CALCULATION_VERSION_TYPE" = ?
				                        WHERE "CALCULATION_VERSION_ID" = ?  AND SESSION_ID =? ;
			                        `;
			dbConnection.executeUpdate(sUpdateStatement, constants.CalculationVersionType.ManualLifecycleVersion, oCalculationVersion.CALCULATION_VERSION_ID, sSessionId);
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
	this.getOpenVersionsForProject = function(sProjectId) {
		var sStmt = `	select 	sessions.user_id, 
								open_versions.calculation_version_id, 
								versions.calculation_version_name,
								versions.calculation_version_type,			-- columns version_type and base_version_id needed
								versions.base_version_id					-- to determine if a lifecycle or a base version is open
						from 	"${Tables.session}" as sessions
							inner join "${Tables.open_calculation_versions}" as open_versions
								on sessions.session_id = open_versions.session_id
							inner join "${Tables.calculation_version_temporary}" as versions
								on open_versions.calculation_version_id = versions.calculation_version_id
							inner join "${Tables.calculation}" as calculations
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
	this.getOpenLifecycleVersionsForBaseVersion = function(iCalculationVersionId) {
		var sStmt = `	select 	sessions.user_id, 
								versions.calculation_version_name,
								versions.calculation_version_id
						from 	"${Tables.session}" as sessions
							inner join "${Tables.open_calculation_versions}" as open_versions
								on sessions.session_id = open_versions.session_id
							inner join "${Tables.calculation_version_temporary}" as versions
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
    this.checkLockCalculatingLifecycle = (iCalculationVersionId) => {
        let stmt = `select versions.CALCULATION_VERSION_ID,
                           versions.CALCULATION_VERSION_NAME,
                           calculation.PROJECT_ID
                    from "sap.plc.db::basis.t_calculation_version" versions
                    inner join "sap.plc.db::basis.t_calculation" calculation 
                      on versions.CALCULATION_ID = calculation.CALCULATION_ID and (versions.CALCULATION_VERSION_type = ? or versions.CALCULATION_VERSION_type = ? ) 
					where versions.CALCULATION_VERSION_ID = ?     
                    `;
    	let aLifecycleVersionsLock = dbConnection.executeQuery(stmt, constants.CalculationVersionType.Lifecycle, constants.CalculationVersionType.ManualLifecycleVersion, iCalculationVersionId);  
        if (aLifecycleVersionsLock && aLifecycleVersionsLock.length > 0){
			let sLockedVersionId    = aLifecycleVersionsLock[0].CALCULATION_VERSION_ID;
			let sLockedProject      = aLifecycleVersionsLock[0].PROJECT_ID;
			let sLockedVersionName  = aLifecycleVersionsLock[0].CALCULATION_VERSION_NAME;

			const sParameterName = `{"PROJECT_ID":"${sLockedProject}"}`;
			let sGetTaskstmt = `select status, parameters
 	                        from "sap.plc.db::basis.t_task"
						    where TASK_TYPE = ?
						    and parameters = ?
    	                    and status not in (?, ?, ?);  
						`;  
			let aLifecycleTask = dbConnection.executeQuery(sGetTaskstmt, constants.TaskType.CALCULATE_LIFECYCLE_VERSIONS, sParameterName, constants.TaskStatus.COMPLETED, constants.TaskStatus.FAILED, constants.TaskStatus.CANCELED);  
			if (aLifecycleTask && aLifecycleTask.length > 0){	
				
			  let oMessageDetails = new MessageDetails().addCalculationVersionObjs({
					name: sLockedVersionName
			   });	
			   const sClientMsg = `The lifecycle version ${sLockedVersionId} cannot be opened because it is pending to be re-generated.`;
			   $.trace.info(sClientMsg);
			   throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sClientMsg, oMessageDetails);
			};
		};
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
	this.open = function(iCalculationVersionId, sSessionId, sUserId, sLanguage, bCopyData, bCompressedResult) {
		// REVIEW (RF): I really don't like that you instantiate and fill the message details preemptively; this object
		// with this functions is shared among one request, in which multiple calls from the business logic can occur;
		// if you fill the message details even without having an error, this could have some side-effects to a
		// subsequent call and lead to misleading details
		oMessageDetails.addCalculationVersionObjs({
			id : iCalculationVersionId
		});
		oMessageDetails.addUserObj({
			id : sUserId
		});
		
		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		if (!_.isString(sSessionId) || !_.isString(sUserId)) {
			const sLogMessage = "sSessionId or sUserId are not a string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}

		// delete all data where session_id does not exists in session table anymore to make sure data is consistent
		
		var oReturnObject = {
			version : {},
			items : [],
			itemsCompressed : {},
			referencesdata: {PROJECTS: [],
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
			const sClientMsg = `Error when procedure ${Procedures.calculation_version_open} is called.`;
			const sServerMsg = `${sClientMsg} Error: ${e.msg || e.message}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}
		var aCalculationVersions = result.CALCVERSION;
		if (aCalculationVersions.length > 1) { // there should be exactly one result row
			const sLogMessage = "More than one version found during opening calculation version.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		} else {
		    oReturnObject.version = _.clone(aCalculationVersions[0]);
		    // update recent calculations table
		    if (_.isEmpty(oReturnObject.version))
		    	updateRecentlyUsed(iCalculationVersionId, sUserId, true);
		    else
		    	updateRecentlyUsed(iCalculationVersionId, sUserId, false);
		}
		
		if (bCompressedResult) {
			let output = helpers.transposeResultArray(result.ITEMS);
			//delete calculated fields
			Object.keys(output).forEach(key => {
				if (key.indexOf('_CALCULATED')> -1) {
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
	this.getReferencedVersionDetails = function(oReturnObject, sLanguage) {
		var sSelectStmt = `select count(*) as rowcount from "${Tables.gtt_calculation_version_ids}"`;
		var aCountReferences = dbConnection.executeQuery(sSelectStmt);
		//check if there are refrences, and if yes return all the related information
		if(parseInt(aCountReferences[0].ROWCOUNT)>0) {
		    try {
		    	var procedure = dbConnection.loadProcedure(Procedures.referenced_calculation_version_read);
		    	var result = procedure(sLanguage);
		    } catch (e) {
				const sClientMsg = `Error when procedure ${Procedures.referenced_calculation_version_read} is called.`;
				const sServerMsg = `${sClientMsg} Error: ${e.msg || e.message}`;
				$.trace.error(sServerMsg);
		    	throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		    }  
		    //reference version information		    
		    const aRefCalcVersWithRootItem = Array.slice(result.OT_CALCULATION_VERSIONS);
            if(aRefCalcVersWithRootItem.length > 0){
            	oReturnObject.referencesdata = oReturnObject.referencesdata || {};
            
            	var aRefCalculationVersions = [];
            	oReturnObject.referencesdata.PROJECTS = Array.slice(result.OT_PROJECTS);
            	oReturnObject.referencesdata.CALCULATIONS = Array.slice(result.OT_CALCULATIONS);
            	
            	var aRootItems = Array.slice(result.OT_ITEMS);
            	_.each(aRefCalcVersWithRootItem, function(oCalcVers) {
            		var oCalcVersItem = {};
            		oCalcVersItem = _.clone(oCalcVers);
            		oCalcVersItem.ITEMS = _.filter(aRootItems, function(oItem) {
            			return (oItem.CALCULATION_VERSION_ID === oCalcVers.CALCULATION_VERSION_ID);
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
	this.setVersionLock = function(iCalculationVersionId, sSessionId, sUserId, sRequestedLockContext) {

		var bIsReadOnly = null;
		var sLockingUser = null;
		var sLockingContext = null;
		var sPrivilege = null; 
		var bIsVersionFrozen = null;
		var aVersionsWhereReferenced = this.getMasterVersions(iCalculationVersionId);
    
		if (!this.isOpenedInSessionAndContext(sSessionId, iCalculationVersionId, sRequestedLockContext)) {
			// lock requesting user has not opened the calculation version in the specific context yet

			bIsVersionFrozen = this.isFrozen(iCalculationVersionId);
			cleanupSessions(iCalculationVersionId);
			
			// necessary to check for locking users as either other users lock the calculation version or
			// the user himself locks the calculation version in another context (e.g. as base version in variant matrix)
			sLockingUser = this.getLockingUser(iCalculationVersionId);
			sLockingContext = this.getLockingContext(iCalculationVersionId);
			
			sPrivilege = authorizationManager.getUserPrivilege(authorizationManager.BusinessObjectTypes.CalculationVersion, iCalculationVersionId, dbConnection, this.sUserId);
			
			// read-only mode in case of: locking user, calculation version is frozen, instance-based privilege is READ, or is source version and the the locking context is not variant matrix
			bIsReadOnly = sLockingUser !== null || bIsVersionFrozen || (aVersionsWhereReferenced.length !== 0 && sRequestedLockContext !== constants.CalculationVersionLockContext.VARIANT_MATRIX) || sPrivilege === InstancePrivileges.READ;
			
			let stmtInsertOpenVersion = null;
			const aValues = [];
			
			// HACK (RF): This hack enables that if a variant matrix is open, for which the base version is already opened in write mode, can be opened writable and the base version is set to read-only
			// The logic is really hard to understand. Extensive tests (calculation-version-lock-integrationtests) ensure that it's working correctly;
			// HOWEVER, the locking should be completely re-designed: the original version determined the write-mode during the openingn of a calculation version. Now, the locking is an explicit request
			// and the implementation could be drastically simplified. Unfornunately, 1 week before ECC that's not an option.
			if (sLockingUser === sSessionId && sLockingContext !== null && sLockingContext !== sRequestedLockContext) {
				stmtInsertOpenVersion = `upsert "${Tables.open_calculation_versions}" (session_id, calculation_version_id, is_writeable, context) values(?,?,?,?) with primary key`;
				aValues.push([sSessionId, iCalculationVersionId, 0, constants.CalculationVersionLockContext.CALCULATION_VERSION]);
				
				let bIsVariantLocked = this.variant.isLockedInAConcurrentVariantContext(iCalculationVersionId);
				if(sLockingUser !== null){
					bIsVariantLocked |= sLockingUser !== sSessionId;
				}
				aValues.push([sSessionId, iCalculationVersionId, bIsVariantLocked ? 0 : 1, constants.CalculationVersionLockContext.VARIANT_MATRIX]);
				bIsReadOnly = bIsVariantLocked;
			} else {
				stmtInsertOpenVersion = `insert into "${Tables.open_calculation_versions}" (session_id, calculation_version_id, is_writeable, context) values(?,?,?,?)`;
				aValues.push([sSessionId, iCalculationVersionId, bIsReadOnly ? 0 : 1, sRequestedLockContext]);
			}
			dbConnection.executeUpdate(stmtInsertOpenVersion, aValues);
		} else {
			// At this stage the lock-requesting user already has opened the calculation version with either read- or write-access.
			// Therefore, it is necessary to check the locking user and his lock context
			sLockingUser = this.getLockingUser(iCalculationVersionId);
			
			if(sLockingUser === sUserId) {
				// In case locking user is the lock requesting user, it is necessary in which context the
				// calculation version is locked (e.g. calculation editing or base version lock during variant editing)
				sLockingContext = this.getLockingContext(iCalculationVersionId);
			}

			bIsReadOnly = (sLockingUser === sUserId && sLockingContext === sRequestedLockContext) ? false : true;	
		    bIsVersionFrozen = sLockingUser === null ? this.isFrozen(iCalculationVersionId) : false;
		}

		return { 
			LockingUser: sLockingUser !== null ? sLockingUser : sUserId,
			LockingContext: sLockingContext !== null ? sLockingContext : sRequestedLockContext,
			LockMode: bIsReadOnly ? "read" : "write",
		    IsReference: aVersionsWhereReferenced.length > 0 ? true: false,
			IsFrozen : bIsVersionFrozen,
			IsNotPrivileged : sPrivilege === InstancePrivileges.READ ? true : false
		};
	};

	/**
	 * Removes the lock (IS_WRITEABLE flag) for a specific calculation version in the lock specific context in table
	 * t_open_calculation_version
	 *
	 * @param {integer} iCalculationVersionId - id of the calculation version id which will be opened
	 * @param {string} sSessionId - The id of the session in which the version is opened
	 * @param {string} sRequestedUnlockContext - application context that asks for locking a calculation version (e.g. calculation view or variant matrix)
	 * @return {integer} returns the number of unlocked data sets (should either be 0 or 1)
	 */
	this.unlockVersion = function(iCalculationVersionId, sSessionId, sRequestedUnlockContext) {
		var sStmt = `delete from "${Tables.open_calculation_versions}" 
			where SESSION_ID = ? and CALCULATION_VERSION_ID = ? and CONTEXT = ? `;
		var iUpdatedCount = dbConnection.executeUpdate(sStmt, sSessionId, iCalculationVersionId, sRequestedUnlockContext);

		/**
		 * We need to empty the temporary tables `t_variant_temporary` and `t_variant_item_temporary` 
		 * if the context is `variant_matrix`.
		 */
		if (sRequestedUnlockContext === "variant_matrix") {
			this.emptyVariantMatrixTemporaryTables(iCalculationVersionId);
		}

		return iUpdatedCount;
	};

	/**
	 * We need to empty the temporary tables `t_variant_temporary` and `t_variant_item_temporary` before the VM is unlocked.
	 * @params {integer} iCalcVersionId	- id of the calculation version containing the variant matrix
	 */
	this.emptyVariantMatrixTemporaryTables = (iCalcVersionId) => {
		const sStmtDeleteVariantTemp = `DELETE FROM "${Tables.variant_temporary}" WHERE "CALCULATION_VERSION_ID" = ${iCalcVersionId};`;
		dbConnection.executeUpdate(sStmtDeleteVariantTemp);
		const sStmtDeleteItemsTemp = `DELETE FROM "${Tables.variant_item_temporary}" WHERE "VARIANT_ID" NOT IN (SELECT VARIANT_ID FROM "${Tables.variant_temporary}");`;
		dbConnection.executeUpdate(sStmtDeleteItemsTemp);
	};

	/**
     * Removes all locks for all calculation versions in the variant_matrix context in table
     * t_open_calculation_version for the given session
     *
     * @param {string} sSessionId - The id of the session, the versions of which should be unlocked
     */
    this.unlockVariantMatrixVersionsForSession = function(sSessionId) {
        const sStmt = `delete from "${Tables.open_calculation_versions}" 
                            where SESSION_ID = ? and CONTEXT = '${constants.CalculationVersionLockContext.VARIANT_MATRIX}' `;
        dbConnection.executeUpdate(sStmt, sSessionId);
    };

    /**
     * Removes all locks for all calculation versions in the variant_matrix context in table
     * t_open_calculation_version for the given session
     *
     * @param {string} sSessionId - The id of the session, the versions of which should be unlocked
     */
    this.unlockVariantMatrixVersionsForSession = function(sSessionId) {
        const sStmt = `delete from "${Tables.open_calculation_versions}" 
                            where SESSION_ID = ? and CONTEXT = '${constants.CalculationVersionLockContext.VARIANT_MATRIX}' `;
        dbConnection.executeUpdate(sStmt, sSessionId);
    };

	/**
	 * Deletes all data where session_id does not exists in session table anymore to make sure data is consistent *
	 */
	function cleanupSessions(iCalcVersionId) {
		// delete outdated session if it locks a required calculation version

		// CURRENT_UTCTIMESTAMP MUST be used in SQL stmt, since CURRENT_TIMESTAMP would lead cleanup a session every time this method is called
		// if the server is not running in UTC (due to time offset)
		var oStatementDelete = hQuery.statement([ 'delete from  "' + Tables.session + '"',
				' where session_id in (select "SESSION_ID" from "' + Tables.open_calculation_versions + '"',
				' where calculation_version_id = ? and IS_WRITEABLE = 1) and SECONDS_BETWEEN(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP)> ',
				'( select "VALUE_IN_SECONDS" from "' + Tables.application_timeout + '" where APPLICATION_TIMEOUT_ID =?)' ].join(" "));
		var iRows = oStatementDelete.execute(iCalcVersionId, sessionTimeout);
		// delete all temporary data if session is not found in t_session
		that.session.deleteOutdatedEntries();
	}

	/**
	 * Retrieves the user that has locked a calculation version for write access (IS_WRITEABLE=1)
	 *
	 * @param {integer}
	 *            iCalculationVersionId - id of the calculation version for which the user with the write-lock should be retrieved
	 * @returns {string} the user id of the locking user or null if the calculation version is not locked at all
	 */
	this.getLockingUser = function(iCalculationVersionId) {		
		var aUserIds;
		var oStatement = hQuery.statement([ 'select user_id from  "' + Tables.session + '"',
				' where session_id in (select "SESSION_ID" from "' + Tables.open_calculation_versions + '"',
				' where calculation_version_id = ? and IS_WRITEABLE = 1)' ].join(" "));

		aUserIds = oStatement.execute(iCalculationVersionId);
		if (aUserIds.length > 1) {
		    oMessageDetails.addCalculationVersionObjs({
		         id : iCalculationVersionId
		    });
			const sClientMsg = "Corrupted database state: Calculation Version is locked by more than one user.";
			const sServerMsg = `${sClientMsg} Calculation Version id: ${iCalculationVersionId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.CALCULATIONVERSION_NOT_WRITABLE_ERROR, sClientMsg, oMessageDetails);
		}

		if (aUserIds.length === 1) {
			return aUserIds[0].USER_ID;
		}
		return null;
	};

	/**
	 * Retrieves the lock context in which the calculation version is locked for write access (IS_WRITEABLE=1)
	 *
	 * @param {integer} iCalculationVersionId - id of the calculation version for which the user with the write-lock should be retrieved
	 * @returns {string} the lock context or null if the calculation version is not locked at all
	 */
	this.getLockingContext = function(iCalculationVersionId) {
		var sStmt = `select CONTEXT from "${Tables.open_calculation_versions}" 
				where CALCULATION_VERSION_ID = ? and IS_WRITEABLE = 1 LIMIT 1`;
		var oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);

		if (oResult.length === 1) {
			return oResult[0].CONTEXT;
		}
		return null;
	};

	/**
	 * Checks if the calculation version is frozen(IS_FROZEN=1). 
	 *
	 * @param {integer}
	 *            iCalculationVersionId - calculation version ID for which the frozen status should be checked
	 * @throws {PlcException}
	 *             if the given arguments are undefined or of wrong type, or query execution fails
	 * @returns {boolean} - true if the calculation version is set to frozen, otherwise false
	 */	
	this.isFrozen = function(iCalculationVersionId) {
		var aFrozenVersions = this.areFrozen([iCalculationVersionId]);
		if(aFrozenVersions.length > 0){
			return aFrozenVersions[0] === iCalculationVersionId;
		}
		return false;
	};
	
	
	/**	
	 * Checks for an array of calculation versions ids, if any of the versions is frozen (IS_FROZEN = 1). Ids of the frozen versions are returned in an array by this function.
	 * If none of the versions is frozen, the returned array is empty.
	 * 
	 * @returns {array} The ids of the versions that are frozen. If no versions are frozen the array is empty. 
	 */
	this.areFrozen = (aCvIds) => {
		var sIdPlaceHolder = _.map(aCvIds, () => "?").join(", ");
		// It is sufficient to check the frozen flag only for t_calculation_version, since the frozen flag is set always simultaneously in t_calculation_version and t_calculation_version_temporary
		var sStmt = `
			select calculation_version_id 
			from "${Tables.calculation_version}"
			where 		calculation_version_id in (${sIdPlaceHolder})
					and is_frozen = ?;
		`;
		// constructing an array of all parameters, so that .apply can be used; unfortunately, executeQuery does not support passing arguments in an array
		var aQueryParameters = [sStmt].concat(aCvIds, [constants.isFrozen]);
		var oResult = dbConnection.executeQuery.apply(dbConnection, aQueryParameters);

		var aFrozenCvIds = _.map(oResult, oFrozenCv => oFrozenCv.CALCULATION_VERSION_ID);
		return aFrozenCvIds;
	};
	
	/**
	 * Checks if the calculation version is a lifecycle version (CALCULATION_VERSION_TYPE = 2). 
	 *
	 * @param {integer}
	 *            iCalculationVersionId - calculation version ID for which the version type should be checked
	 * @param {boolean}
	 *            bTemporary - if true check for temporary versions 
	 * @returns {boolean} - true if the calculation version is a lifecycle version, otherwise false
	 */	
	this.isLifecycleVersion = function(iCalculationVersionId, bCheckTemporaryTable) {
		bCheckTemporaryTable = bCheckTemporaryTable ? bCheckTemporaryTable : false;
		let sTable;
		if (bCheckTemporaryTable === true) {
			sTable = Tables.calculation_version_temporary;
		} else {
			sTable = Tables.calculation_version;
		} 

		var iLifecycleVersionTypeId = 2;
		var sStmt = `select count(*) as rowcount from "${sTable}" 
						where CALCULATION_VERSION_ID = ? and CALCULATION_VERSION_TYPE = 2`;
		var oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);
		
		return parseInt(oResult[0].ROWCOUNT) === 1;		
	};

	/**
	 * Checks if the calculation version is a manual lifecycle version (CALCULATION_VERSION_TYPE = 16). 
	 *
	 * @param {integer}
	 *            iCalculationVersionId - calculation version ID for which the version type should be checked
	 * @param {boolean}
	 *            bTemporary - if true check for temporary versions 
	 * @returns {boolean} - true if the calculation version is a lifecycle version, otherwise false
	 */	
	this.isManualLifecycleVersion = function(iCalculationVersionId, bCheckTemporaryTable) {
		bCheckTemporaryTable = bCheckTemporaryTable ? bCheckTemporaryTable : false;
		let sTable;
		if (bCheckTemporaryTable === true) {
			sTable = Tables.calculation_version_temporary;
		} else {
			sTable = Tables.calculation_version;
		} 
		let sStmt = `select count(*) as rowcount from "${sTable}" 
						where CALCULATION_VERSION_ID = ? and CALCULATION_VERSION_TYPE = ?`;
		let oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId, constants.CalculationVersionType.ManualLifecycleVersion);
		
		return parseInt(oResult[0].ROWCOUNT) === 1;		
	};
	
	/**
	 * Get the type of the given calculation version (CALCULATION_VERSION_TYPE), e.g. base, lifecycle, generated from variant. 
     *
	 * @param {integer}
	 *            iCalculationVersionId - calculation version ID for which the type should be returned
	 * @param {string}
	 *            [sSessionId] - id of session; if present, the select is done on the temporary table
	 * @returns {int} - version type
	 */	
	this.getVersionType = (iCalculationVersionId, sSessionId) => {
		let oResult = null;
		if(!helpers.isNullOrUndefined(sSessionId)) {
		    let sStmt = `select calculation_version_type from "${Tables.calculation_version_temporary}" where calculation_version_id = ? and session_id = ?;`;
		    oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId, sSessionId);
		} else {
	   		let sStmt = `select calculation_version_type from "${Tables.calculation_version}" where calculation_version_id = ?;`;
		    oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);
		}

		return parseInt(oResult[0].CALCULATION_VERSION_TYPE);		
	};

	function getWithoutItemsInternal(aCalculationVersionIds, sSessionId, sTable){
		if (!_.isArray(aCalculationVersionIds)) {
			const sLogMessage = "aCalculationVersionIds must be an array.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		var bContainsOnlyNumbers = _.every(aCalculationVersionIds, function(iCalcId) {
			return _.isNumber(iCalcId) && iCalcId % 1 === 0 && iCalcId >= 0;
		});
		if (!bContainsOnlyNumbers) {
			const sLogMessage = "aCalculationVersionIds can only contain positive numbers.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		if (sTable === Tables.calculation_version_temporary && !_.isString(sSessionId)) {
			const sLogMessage = "sSessionId must be a string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		var stmtBuilder = ['select'];
		if(sTable === Tables.calculation_version_temporary){
			stmtBuilder.push(' session_id, ');
		}
		stmtBuilder.push(' calculation_version_id, calculation_id, calculation_version_name, calculation_version_type, root_item_id, customer_id,'
                            + ' sales_price, sales_price_currency_id, report_currency_id, costing_sheet_id, component_split_id,'
                            + ' sales_document, start_of_production, end_of_production, valuation_date, last_modified_on, last_modified_by,'
                            + ' master_data_timestamp, lifecycle_period_from, base_version_id, is_frozen, exchange_rate_type_id, material_price_strategy_id, activity_price_strategy_id from ', '"' + sTable + '" where (' );
		_.each(aCalculationVersionIds, function(iCalcId, iIndex) {
			stmtBuilder.push('calculation_version_id = ?');
			if (iIndex < aCalculationVersionIds.length - 1) {
				stmtBuilder.push("or");
			}
		});
		stmtBuilder.push(")");
		if(sTable === Tables.calculation_version_temporary){
			stmtBuilder.push("and session_id = ?");
		}
		
		var stmt = hQuery.statement(stmtBuilder.join(" "));
		if(sTable === Tables.calculation_version_temporary){
			return stmt.execute(aCalculationVersionIds.concat(sSessionId));
		} else {
			return stmt.execute(aCalculationVersionIds);
		}
		
	}
	
	/**
	 * Gets a set of calculation versions without items from t_calculation_version_temporary.
	 *
	 * @param {array}
	 *            aCalculationVersionIds - array of calculation version id which shall be retrieved from the database
	 * @param {string}
	 *            sSessionId - The session with which the item is associated
	 * @throws {PlcException} -
	 *             If aCalculationVersionIds is not an array, contains anything else that positive integers or sSessionId is null
	 * @returns {array} Returns an array containing calculation version objects for each calculation version id found in the database.
	 *          Hence, the returned array can be empty or shorter as aCalculationVersionIds if not all calculation version ids can be found.
	 */
	this.getWithoutItems = function(aCalculationVersionIds, sSessionId) {
		var aCalculationVersions = getWithoutItemsInternal(aCalculationVersionIds, sSessionId, Tables.calculation_version_temporary);
		return aCalculationVersions;
	};

	/**
	 * Gets a set of calculation versions without items from t_calculation_version.
	 *
	 * @param {array}
	 *            aCalculationVersionIds - array of calculation version id which shall be retrieved from the database
	 * @throws {PlcException} -
	 *             If aCalculationVersionIds is not an array, contains anything else that positive integers
	 * @returns {array} Returns an array containing calculation version objects for each calculation version id found in the database.
	 *          Hence, the returned array can be empty or shorter as aCalculationVersionIds if not all calculation version ids can be found.
	 */
	this.getWithoutItemsPersistent = function(aCalculationVersionIds) {
		var aCalculationVersions = getWithoutItemsInternal(aCalculationVersionIds, null, Tables.calculation_version);
		return aCalculationVersions;
	};

	this.getCalculationResults = function(iCalculationVersionId, sSessionId) {
		var calculation = dbConnection.loadProcedure(Procedures.calculation);
		var result = calculation({
			"IV_CALCULATION_VERSION_ID" : iCalculationVersionId,
			"IV_SESSION_ID" : sSessionId
		});

		return result;
		};
	
	/**
	 * Get the saved calculation results for given calculation version. Used when results should not be calculated again before sending response, e.g. in case of frozen versions.
	 *
	 * @param {integer}
	 *            iCalculationVersionId - Id of calculation version for which results should be get.
	 */
	this.getSavedCalculationResults = function(iCalculationVersionId) {
		// Get calculated item fields
		
		// prepare substatement for calculated custom fields
		var aCustomMetadataFields = metadata.getMetadataFields(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null, true);
		var sCustomFieldsStatement = "";
		_.each(aCustomMetadataFields, function (oMetadataField, iIndex) {
			// add calculated custom fields, but names of returned fields should be without postfix "_calculated"
			if ( oMetadataField.UOM_CURRENCY_FLAG !== 1 && oMetadataField.COLUMN_ID.startsWith("CUST_")) {
				sCustomFieldsStatement += ', itemExt.' + oMetadataField.COLUMN_ID + '_CALCULATED as ' + oMetadataField.COLUMN_ID;
			}
		});
		
		// some fields should be delivered without postfix "_calculated"
		var oResultCalculatedFields = dbConnection.executeQuery(
				`SELECT item.item_id, item.base_quantity_calculated as base_quantity, item.quantity_calculated as quantity, item.total_quantity, item.total_quantity_uom_id,
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
		         ${sCustomFieldsStatement}
		         FROM "${Tables.item}" as item
		         LEFT OUTER JOIN "${Tables.item_ext}" as itemExt on item.item_id = itemExt.item_id and item.calculation_version_id = itemExt.calculation_version_id
		         WHERE item.calculation_version_id = ?`, iCalculationVersionId
		);
		
		// Get calculated costing sheet values
		var oResultCostingSheetValues = dbConnection.executeQuery(
				`SELECT item_id, costing_sheet_row_id, is_rolled_up_value, has_subitems, 
						sum(cost_fixed_portion) as cost_fixed_portion, sum(cost_variable_portion) as cost_variable_portion,
						sum(cost2_fixed_portion) as cost2_fixed_portion, sum(cost2_variable_portion) as cost2_variable_portion,
						sum(cost3_fixed_portion) as cost3_fixed_portion, sum(cost3_variable_portion) as cost3_variable_portion
		         FROM "${Tables.item_calculated_values_costing_sheet}" WHERE calculation_version_id = ? GROUP BY item_id, costing_sheet_row_id, is_rolled_up_value, has_subitems`, iCalculationVersionId
		);
		
		// Get calculated component split values
		var oResultComponentSplitValues = dbConnection.executeQuery(
				`SELECT item_id, component_split_id, cost_component_id, 
						sum(cost_fixed_portion) as cost_fixed_portion, sum(cost_variable_portion) as cost_variable_portion,
						sum(cost2_fixed_portion) as cost2_fixed_portion, sum(cost2_variable_portion) as cost2_variable_portion,
						sum(cost3_fixed_portion) as cost3_fixed_portion, sum(cost3_variable_portion) as cost3_variable_portion
		         FROM "${Tables.item_calculated_values_component_split}" WHERE calculation_version_id = ? GROUP BY item_id, component_split_id, cost_component_id`, iCalculationVersionId
		);

		return {
			ITEM_CALCULATED_FIELDS : oResultCalculatedFields,
			ITEM_CALCULATED_VALUES_COSTING_SHEET : oResultCostingSheetValues,
			ITEM_CALCULATED_VALUES_COMPONENT_SPLIT : oResultComponentSplitValues
		};
	};	

	
	/**	
	 * Functions selects all fields relevant to be updated on clients after a save or save as of a version from t_calculation_version_temporary. These 
	 * fields are audit fields and IS_FROZEN (since after save-as a version is not frozen anymore) and CALCULATION_VERSION_TYPE, BASE_VERSION_ID
	 * LIFECYCLE_PERIOD_FROM (since after save-as  a former lifecycle version is a normal version).
	 * 	 
	 * @param  {string} sSessionId Id of the session the version was opened with.
	 * @param  {number} iCvId      Id of the temporary version this should be retrieved
	 * @return {object}            An object of containg the save-related fields as property and value pair. 
	 */	 
	this.getSaveRelevantFields = function(sSessionId, iCvId){
		var aSaveRelevantProperties = ["CALCULATION_VERSION_ID", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY", "IS_FROZEN", "CALCULATION_VERSION_TYPE",
		                                   "BASE_VERSION_ID", "LIFECYCLE_PERIOD_FROM"];
		var sStmt = `
			select ${aSaveRelevantProperties.join(", ")}
			from "${Tables.calculation_version_temporary}"
			where session_id = ? and calculation_version_id = ?;
		`;
		var oResult = dbConnection.executeQuery(sStmt, sSessionId, iCvId);
		if(oResult.length !== 1){
			const sLogMessage = `Reading updated fields for saved (or saved-as) calculation versions failed. Reason: Found ${oResult.length} calculation versions with the given id opened in the current session.`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);	
		}
		// the result set object is not modifiable; however clients of the method might want to add properties to the returned 
		// object 
		return _.clone(oResult[0]);
	};


	/**
	 * Calls the CalcEngine to calculate the open calculation version and saves - all costs (priceForQuantity, other, total costs) in
	 * t_item_temporary - all costing sheet results in t_item_calculated_values_costing_sheet - all component split results in
	 * t_item_calculated_values_component_split
	 *
	 * @param {int}
	 *            iCalcVersionId - the id of the calculation versions that should be calculated and saved
	 * @param {string}
	 *            sSessionID ID of the session, in which the calculation version is opened
	 */
	this.saveCalculationResults = function(iCalculationVersionId, sSessionId) {
		var oSaveCalculationResults = hQuery.procedure(Procedures.calculation_save_results);
		oSaveCalculationResults.execute({
			"IV_CALCULATION_VERSION_ID" : iCalculationVersionId,
			"IV_SESSION_ID" : sSessionId
		});
	};

	/**
	 * Triggers a calculation of an existing and saved version (contents of t_item and t_calculcation_version
	 * are used for calculation.
	 * 
	 * @param {int}
	 *	 	iCvId - the id of the calculation versions that should be calculated and saved
	 */
	this.calculatePersistent = function (iCvId) {
		const fCalculation = dbConnection.loadProcedure(Procedures.calculate_saved_calculation_version);
		fCalculation(iCvId);
	};


	/**
	 * Gets the list of users for one open calculation version
	 *
	 * @param {int}
	 *            iCalcVersionId - the id of the calculation versions that should be checked
	 * @throws {PlcException} -
	 *             If iCalcVersionId is not correctly set
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {array} ids of users that opened the calculation version
	 */
	this.getOpeningUsers = function(iCalculationVersionId) {
	    checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		
		var aUserIds;
		var oStatement = hQuery.statement([ 'select user_id from  "' + Tables.session + '"',
				' where session_id in (select "SESSION_ID" from "' + Tables.open_calculation_versions + '"',
				' where calculation_version_id = ?)' ].join(" "));
		try {
			aUserIds = oStatement.execute(iCalculationVersionId);
		} catch (e) {
		    oMessageDetails.addCalculationVersionObjs({
		         id : iCalculationVersionId
		    });
			const sClientMsg = "Error during getting opening users for the calculation version.";
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}. error: ${e.msg || e.message}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
		}
		return aUserIds;
	};

	/**
	 * Function that gets a open calculation version if it exists in table otherwise empty result set.
	 *
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 * @param {integer}
	 *            iCalcVersionId - The opened calculation version id
	 * @param {string}
	 *            sLockContext application context that requests session record (e.g. calculation view or variant matrix)
	 * @returns the opened calculation version if
	 */
	this.getSessionRecord = function(sSessionId, iCalcVersionId, sLockContext = constants.CalculationVersionLockContext.CALCULATION_VERSION) {
		oMessageDetails.addCalculationVersionObjs({
			id : iCalcVersionId
		});

		// per session we only expect one entry of the same calculation version.
		var aOpenCalculation = dbConnection.executeQuery(`select session_id, calculation_version_id, is_writeable from "${Tables.open_calculation_versions}" 
			where session_id = ? and calculation_version_id = ? and context = ?`, sSessionId, iCalcVersionId, sLockContext);
		if (aOpenCalculation.length > 1) {
			const sClientMsg = "Corrupted query or database state: found more than 1 open calculation version.";
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCalcVersionId}, session ${sSessionId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}
		return aOpenCalculation.length === 1 ? aOpenCalculation[0] : undefined;
	};

	/**
	 * Checks whether the calculation version name is unique within (in scope of) the provided calculation identified by id. The name is
	 * considered unique if it exists for the same version-id.
	 *
	 * @param {integer}
	 *            iCalculationId - the id of the calculation
	 * @param {string}
	 *            sCalcVersionName - the name of the calculation version to be checked for uniqueness
	 * @throws {@link PlcException}
	 *             if iCalculationId is not a number if sCalcVersionName is not a string
	 * @throws {@link PlcException}
	 *             if database content is corrupt due to duplicated calculation version names
	 * @returns {boolean} - true if the calculation version name is unique, otherwise false
	 */
	this.isNameUnique = function(iCalculationId, iCalculationVersionId, sCalcVersionName) {
		oMessageDetails.addCalculationVersionObjs({
			name : sCalcVersionName,
			id : iCalculationId
		});

		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		if (!_.isNumber(iCalculationId)) {
			const sLogMessage = "iCalculationId must be a number.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		
		if (!_.isString(sCalcVersionName)) {
			const sLogMessage = "sCalcVersionName must be a valid string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}

		var aVersions = getVersionsWithNameInCalculation(sCalcVersionName, iCalculationId);

		if (aVersions.length > 1) {
			const sClientMsg = "Corrupted query or database state: found more than 1 entry for calculation version name.";
			const sServerMsg = `${sClientMsg} Calculation version name: ${sCalcVersionName}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}

		var existingVersion = _.find(aVersions, function(entry) {
			return entry.CALCULATION_VERSION_ID !== iCalculationVersionId;
		});
		if (existingVersion !== undefined) {
			return false;
		}
		return true;

	};

	/**
	 * Checks whether the calculation version name already exists (for the same or some other version under the same calculation). This is
	 * used, e.g., for save-as.
	 *
	 * @param {integer}
	 *            iCalculationId - the id of the calculation
	 * @param {string}
	 *            sCalcVersionName - the name of the calculation version to be checked for uniqueness
	 * @throws {@link PlcException}
	 *             if database content is corrupt due to duplicated calculation version names
	 * @returns {boolean} - true if the calculation version name is unique, otherwise false
	 */
	this.doesNameNotExist = function(iCalculationId, sCalcVersionName) {
		oMessageDetails.addCalculationVersionObjs({
			name : sCalcVersionName,
			id : iCalculationId
		});

		if (!_.isNumber(iCalculationId)) {
			const sLogMessage = "iCalculationId must be a number.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		if (!_.isString(sCalcVersionName)) {
			const sLogMessage = "sCalcVersionName must be a valid string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}

		var aVersions = getVersionsWithNameInCalculation(sCalcVersionName, iCalculationId);
		// if a version was named exactly like a lifecycle version before the project lifecycle was calculated, it can be that 2 versions have the same name:
		// the newly generated lifecycle version and the normal version; this is okay, since Daniela specified it that in this case it's okay to have 2 versions
		// with the same name; for this reason it can be that aVersions contains more than one entry
		return aVersions.length < 1;
	};

	/**
	 * Gets all versions in a calculation that match a given name. The comparison is case-insensitive.
	 *
	 * @param {integer}
	 *            iCalculationId - the id of the calculation
	 * @param {string}
	 *            sCalcVersionName - the name of the calculation version to be checked for uniqueness
	 */
	function getVersionsWithNameInCalculation(sCalcVersionName, iCalculationId) {
		var oCheckNameStatement = hQuery.statement('select CALCULATION_VERSION_NAME, CALCULATION_VERSION_ID from "'
				+ Tables.calculation_version + '"' + ' where upper(calculation_version_name)=? and calculation_id =?');
		var aVersions = oCheckNameStatement.execute(sCalcVersionName.toUpperCase(), iCalculationId);

		return aVersions;
	}

	/**
	 * Function to check whether a calculation version is opened in writemode (lock=1) in the
	 * current session for the specified lock context
	 *
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {integer}
	 *            iCalcVersionId - the calculation id
	 * @param {string}
	 *            sLockContext application context that requests session record (e.g. calculation view or variant matrix)
	 * @returns {Boolean} true if calculation version is opened and locked in same session, otherwise false
	 */
	this.isOpenedAndLockedInSessionAndContext = function(sSessionId, iCalculationVersionId, sLockContext = constants.CalculationVersionLockContext.CALCULATION_VERSION) {
		var oOpenCalculationVersion = this.getSessionRecord(sSessionId, iCalculationVersionId, sLockContext);
		
		return oOpenCalculationVersion !== undefined && _.has(oOpenCalculationVersion, "IS_WRITEABLE")
				&& oOpenCalculationVersion.IS_WRITEABLE === 1;
	};

	/**
	 * Check whether the current session has the open calculation version in the specific context. It could be false if multiple clients of one user are running and
	 * the request is sent from the older client.
	 *
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {integer}
	 *            iCalcVersionId - the calculation id
	 * @param {string}
	 *            sLockContext application context that requests session record (e.g. calculation view or variant matrix)
	 * @returns {bool} true - calculation version exists in the session false - calculation version does not exist in the session
	 */
	this.isOpenedInSessionAndContext = function(sSessionId, iCalcVersionId, sLockContext = constants.CalculationVersionLockContext.CALCULATION_VERSION) {
		var oOpenCalculationVersion = this.getSessionRecord(sSessionId, iCalcVersionId, sLockContext);
		if (oOpenCalculationVersion === undefined) {
			return false;
		}
		return true;
	};
	
	/**
	 * Checks whether a calculation version is the only one under its parent calculation
	 *
	 * @param {int}
	 *            iCalcVersionId - the id of the calculation versions that should be checked
	 * @throws {PlcException} -
	 *             If iCalcVersionId is not correctly set
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {Boolean} true if calculation version is single, otherwise false
	 */
	this.isSingle = function(iCalculationVersionId) {
		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);

		// we expect only one session for one user
		var oStatement = hQuery.statement([ 'select count(*)  as rowcount from  "' + Tables.calculation_version + '"',
				' where calculation_id in ',
				' (select calculation_id from "' + Tables.calculation_version + '" where calculation_version_id=?)' ].join(" "));
		var aCount = oStatement.execute(iCalculationVersionId);

		// check if no other entries found
		if (aCount.length === 0 || aCount.length > 1) {
		    oMessageDetails.addCalculationVersionObjs({
		          id : iCalculationVersionId
		    });
		      
			const sClientMsg = "Corrupted query or database state during checking if calculation version is single.";
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}
		var iRowCount = parseInt(aCount[0].ROWCOUNT, 10);
		return iRowCount === 1;
	};

	/**
	 * Deletes one calculation version by calling p_calculation_version_delete. The check "if the calculation version and associated
	 * entities are closed" is done in business logic.
	 *
	 * @param {int}
	 *            iCalculationVersionId - ID of the calculation version to delete
	 * @throws {PlcException} -
	 *             If iCalculationVersionId is not set correctly
	 * @throws {PlcException} -
	 *             If the execution of the call statement to execute procedure fails.
	 * @returns {integer} - the number of affected rows
	 */
	this.remove = function(iCalculationVersionId, sUserId) {
		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		
		try {
			var procedure = dbConnection.loadProcedure(Procedures.calculation_version_delete);
			var result = procedure(iCalculationVersionId);
			// update recent calculations table
            updateRecentlyUsed(iCalculationVersionId, sUserId, true);

			return result.AFFECTEDROWS;
		} catch (e) {
		    oMessageDetails.addCalculationVersionObjs({
		         id : iCalculationVersionId
		    });

			const sClientMsg = "Error during deleting the calculation version.";
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
		}
	};

	/**
	 * Saves a calculation version and all related items, i.e. copies them to the persistent tables (t_calculation_version,
	 * t_item), resets IS_DIRTY flags and updates timestamps
	 *
	 * @param {integer}
	 *            iCalcVersionId ID of the calculation version to save
	 * @param {string}
	 *            sSessionID ID of the session, in which the calculation version to save is opened
	 * @param {string}
	 *            sSaveProcedureName Name of the procedure to use (only needed for testing, leave undefined in productive code)
	 */
	this.save = function(iCalculationVersionId, sSessionId, sUserId) {
		oMessageDetails.addCalculationVersionObjs({
			id : iCalculationVersionId
		});

		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		
		if (!_.isString(sSessionId)) {
			const sLogMessage = "sSessionId must be a string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		try {
			var procedure = dbConnection.loadProcedure(Procedures.calculation_version_save);
			procedure(iCalculationVersionId, sSessionId);
			// update recent calculations table
            updateRecentlyUsed(iCalculationVersionId, sUserId, false);
		} catch (e) {
		    if(e.code === 301) { //unique constraint violated
				const sClientMsg = "Error during saving the calculation version: name already exists.";
				const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}, Error: ${e.message || e.msg}.`;
				$.trace.error(sServerMsg);
			    throw new PlcException(Code.CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR, sClientMsg, oMessageDetails, undefined, e);
		    } else {
				const sClientMsg = "Error during saving the calculation version.";
				const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}, Error message: ${e.message|| e.msg}.`;
				$.trace.error(sServerMsg);
			    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
		    }
		}
	};
	
	/** Function to update the frozen flag for an opened calculation version based on the given calculation version id and session id.
	 * It will set the frozen flag to 1 (frozen) for calculation version in t_calculation_version and t_calculation_version_temporary.
	 * Furthermore it will update also the isWritable flag to 0 for calculation version in t_open_calculation_versions table.
	 * 
	 * @param {int}
	 *            	iCalculationVersionId - the id of the calculation version to be frozen
	 * @param {string}
	 *				sSessionId - current session id of the request
	 * @throws {PlcException}
	 *             if the given arguments are undefined or of wrong type
	 */
	this.setFrozenFlag = function(iCalculationVersionId, sSessionId) {
		var sUpdateCalcVers = 'update "' + Tables.calculation_version + '" set IS_FROZEN = 1 where calculation_version_id = ?';
		dbConnection.executeUpdate(sUpdateCalcVers, iCalculationVersionId);
		
		var sUpdateCalcVersTemp = 'update "' + Tables.calculation_version_temporary + '" set IS_FROZEN = 1 where session_id = ? and calculation_version_id = ?';
		dbConnection.executeUpdate(sUpdateCalcVersTemp, sSessionId, iCalculationVersionId);
		
		var sUpdateOpenCalcVers = 'update "' + Tables.open_calculation_versions + '" set IS_WRITEABLE = 0 where session_id = ? and calculation_version_id = ?';
		dbConnection.executeUpdate(sUpdateOpenCalcVers, sSessionId, iCalculationVersionId);
	};
	
	/** Function to update the frozen flag for an opened calculation version based on the given calculation version id and session id.
	 * It will set the frozen flag to 1 (frozen) for calculation version in t_calculation_version and t_calculation_version_temporary.
	 * Furthermore it will update also the isWritable flag to 0 for calculation version in t_open_calculation_versions table.
	 * Also will set the frozen flag to 1 (frozen) for the array of lifecycle version ids in t_calculation_version and t_calculation_version_temporary.
	 * 
	 * @param {int}
	 *            	iCalculationVersionId - the id of the calculation version to be frozen
	 * @param {string}
	 *				sSessionId - current session id of the request
	 * @param {array}
	 * 				aLifecycleVersionsIds - ids of lifecycle versions assigned to the calculation version
	 * @throws {PlcException}
	 *             if the given arguments are undefined or of wrong type
	 */
	this.setFrozenFlags = function(iCalculationVersionId, sSessionId, aLifecycleVersionsIds) {
		var sUpdateCalcVers = `update "${Tables.calculation_version}" set IS_FROZEN = 1 where calculation_version_id = ?`;
		dbConnection.executeUpdate(sUpdateCalcVers, iCalculationVersionId);
		
		var sUpdateCalcVersTemp = `update "${Tables.calculation_version_temporary}" set IS_FROZEN = 1 where session_id = ? and calculation_version_id = ?`;
		dbConnection.executeUpdate(sUpdateCalcVersTemp, sSessionId, iCalculationVersionId);
		
		var sUpdateOpenCalcVers = `update "${Tables.open_calculation_versions}" set IS_WRITEABLE = 0 where session_id = ? and calculation_version_id = ?`;
		dbConnection.executeUpdate(sUpdateOpenCalcVers, sSessionId, iCalculationVersionId);
		
		if (aLifecycleVersionsIds.length > 0) {
			var sUpdateLifecycleVers = `update "${Tables.calculation_version}" set IS_FROZEN = 1 
				where calculation_version_id in ( ${_.map(aLifecycleVersionsIds, iId => " ? ").join(",")} )`;
			dbConnection.executeUpdate(sUpdateLifecycleVers, [aLifecycleVersionsIds]);
			
			var sUpdateLifecycleVersTemp = `update "${Tables.calculation_version_temporary}" set IS_FROZEN = 1 
				where calculation_version_id in ( ${_.map(aLifecycleVersionsIds, iId => " ? ").join(",")} )`;
			dbConnection.executeUpdate(sUpdateLifecycleVersTemp, [aLifecycleVersionsIds]);
		}
	};
	
	
	/**
	 * Checks whether a calculation version has unsaved changes (is dirty)
	 *
	 * @param {int}
	 *			iCalculationVersionId - the calculation version id that should be checked
	 * @param {string}
	 *			sSessionId - current session id of the request
	 * @param {string}
	 *			sUserId - current user id of the request
	 * @throws {PlcException}
	 *             if the given arguments are undefined or of wrong type
	 * @returns {Boolean} true if calculation version is dirty, otherwise false
	 */
	this.isDirty = function(iCalculationVersionId, sSessionId, sUserId) {
		oMessageDetails.addCalculationVersionObjs({
			id : iCalculationVersionId
		});

		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		
		if (!_.isString(sSessionId)) {
			const sLogMessage = "sSessionId must be a string";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		if (!_.isString(sUserId)) {
			const sLogMessage = "sUserId must be a string";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}

		var oStatement = hQuery.statement('select IS_DIRTY from "' + Tables.item_temporary + '"'
				+ ' WHERE calculation_version_id = ? ' + ' AND PARENT_ITEM_ID is null '
				+ ' AND session_id IN (SELECT session_id FROM "' + Tables.session + '"  WHERE UCASE(user_id) = ? AND session_id = ? )');
		
		var aIsDirty = oStatement.execute(iCalculationVersionId, sUserId.toUpperCase(), sSessionId);
		
		if (aIsDirty.length === 0 || aIsDirty.length > 1) {
			const sClientMsg = "Corrupted query or database state during checking if calculation version is dirty.";
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}
		
		return aIsDirty[0].IS_DIRTY === 1 ? true : false;
	};

	/**
	 * Function to update the dirty state indicator for an opened calculation version based on the given calculation version id, session id,
	 * and user. It allows to set the dirty flag to be dirty=1 or not dirty=0 by passing the bIsDirty parameter. Furthermore it will only
	 * update the dirty state for calculations versions that are open in the given session by the given user.
	 *
	 * @param iCalcVersionId -
	 *            id of the calculation version that shall be retrieved
	 * @param sSessionId -
	 *            current session id of the request
	 * @param sUserId -
	 *            current user id of the request
	 * @param bIsDirty -
	 *            the dirty/non dirty state to be set
	 * @throws {PlcException}
	 *             if the given arguments are undefined or of wrong type
	 */
	this.setDirty = function(iCalculationVersionId, sSessionId, sUserId, bIsDirty) {
		oMessageDetails.addCalculationVersionObjs({
			id : iCalculationVersionId
		});
		oMessageDetails.addUserObj({
			name : sUserId
		});

		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		if (!_.isString(sSessionId)) {
			const sLogMessage = "sSessionId must be a string";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		if (!_.isString(sUserId)) {
			const sLogMessage = "sUserId must be a string";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		if (!_.isNumber(bIsDirty) || bIsDirty % 1 !== 0 || bIsDirty < 0 || bIsDirty > 1) {
			const sLogMessage = "bIsDirty must be 0 or 1.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		
		// update root item and set dirty flag
		var oUpdateRootItemStatement = hQuery.statement('update "' + Tables.item_temporary + '"'
				+ ' set is_dirty = ? WHERE calculation_version_id = ? ' + ' AND PARENT_ITEM_ID is null'
				+ ' AND session_id IN (SELECT session_id FROM "' + Tables.session + '"  WHERE UCASE(user_id) = ? AND session_id = ? )');
		oUpdateRootItemStatement.execute(bIsDirty, iCalculationVersionId, sUserId.toUpperCase(), sSessionId);
	};

	/**
	 * Assigns a new ID to an opened calculation version and updates all related temporary tables (t_calculation_version_temporary,
	 * t_item_temporary, t_item_temporary_ext, t_open_calculation_versions) Functionality is used for save-as, because by saving a version
	 * as another one, a new calculation version is created, thus needs a new ID
	 *
	 * @param {integer}
	 *            iOldCalcVersionId old ID of the calculation version that should be replaced by a new one
	 * @param {string}
	 *            sSessionId ID of the session, in which the calculation version that should get a new ID is opened
	 * @returns New ID of the calculation version
	 */
	this.setNewId = function(iOldCalcVersionId, sSessionId) {
		oMessageDetails.addCalculationVersionObjs({
			id : iOldCalcVersionId
		});

		if (!_.isNumber(iOldCalcVersionId)) {
			const sLogMessage = "iOldCalcVersionId must be a number.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		if (!_.isString(sSessionId)) {
			const sLogMessage = "sSessionId must be a string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		var sSequence = Sequences.calculation_version;
		var iNewID = this.helper.getNextSequenceID(sSequence);

		// set new id
		try {
			var procedure = dbConnection.loadProcedure(Procedures.calculation_version_set_new_id);
			var result = procedure(sSessionId, iNewID, iOldCalcVersionId);
		} catch (e) {
			const sClientMsg = "Error when setting new id for calculation version.";
			const sServerMsg = `${sClientMsg} Error: ${e.message|| e.msg}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}

		return iNewID;
	};

	/**
	 * Updates a calculation version (header data). Only some attributes are updated, the rest is updated in the calculation version item.
	 *
	 * @param {object}
	 *            oCalculationVersion - An object containing the columns to update as keys and the values to update as values
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 *
	 * @throws {PlcException} -
	 *             If oCalculationVersion, oCalculationVersion.CALCULATION_VERSION_ID, or sSesssioId are not correctly set
	 * @throws {PlcException} -
	 *             If the execution of the update statement would affect more that 1 row. This indicates a corrupted query or illegal
	 *             database state.
	 * @returns {integer} - 0 if now item was updated or 1 if one item was found and updated
	 */
	this.update = function(oCalculationVersion, aProtectedColumns, sSessionId) {
		if (!helpers.isPlainObject(oCalculationVersion)) {
			const sLogMessage = "oCalculationVersion must be an object.";
			$.trace.error(sLogMessage);
			oMessageDetails.addCalculationVersionObjs(oCalculationVersion);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		if (!helpers.isPositiveInteger(oCalculationVersion.CALCULATION_VERSION_ID)) {
			const sLogMessage = "oCalculationVersion.CALCULATION_VERSION_ID must be a positive integer.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
		if (!_.isString(sSessionId)) {
			const sLogMessage = "sSessionId must be a string.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}

		var iCalculationVersionId = helpers.toPositiveInteger(oCalculationVersion.CALCULATION_VERSION_ID);
		// construct and execute update query
		var aStmtBuilder = [ 'update "' + Tables.calculation_version_temporary + '" set ' ];

		
		var oCompleteUpdateSet = this.helper.setMissingPropertiesToNull(oCalculationVersion, Tables.calculation_version_temporary, aProtectedColumns);

		var aColumnNames = _.keys(oCompleteUpdateSet);
		_.each(aColumnNames, function(sColumnName, iIndex) {
			aStmtBuilder.push(sColumnName + " = ?");
			if (iIndex < aColumnNames.length - 1) {
				aStmtBuilder.push(", ");
			}
		});
		aStmtBuilder.push(" where session_id = ? and calculation_version_id = ?");
		var aValues = _.values(oCompleteUpdateSet);
		aValues.push(sSessionId);
		aValues.push(iCalculationVersionId);
		var updateStmt = hQuery.statement(aStmtBuilder.join(""));
		var iAffectedRows = updateStmt.execute(aValues);
		if (iAffectedRows > 1) {
		    const sClientMsg = `Corrupted query or database state: modified ${iAffectedRows} database records in ${Tables.calculation_version_temporary} during the update of calculation version.`;
		    const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}, data: ${JSON.stringify(oCalculationVersion)}`;
		    $.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}
		// TODO: update _text table, also in item. A concept is needed.
		return iAffectedRows;
	};

	/**
	 * Function that updates material or activity price strategy at calculation version level.
	 * @param {integer}
	 *       iCvId - the calculation version id for which the price strategy is changed
	 * @param {string}
	 *       sSessionId - the session id from temporary table
	 * @param {map}
	 *      mTriggerColumnsChanged Key-Value pairs for MATERIAL_PRICE_STRATEGY_ID and ACTIVITYL_PRICE_STRATEGY_ID
	 */
	this.persistUpdatedColumns = (iCvId, sSessionId, mTriggerColumnsChanged) => {
		const aUpdatedColums = [...mTriggerColumnsChanged.keys()];
		const aValuesAfterUpdate = [...mTriggerColumnsChanged.values()];
		aValuesAfterUpdate.push(iCvId);
		aValuesAfterUpdate.push(sSessionId);
		const sUpdateStmt = `update  "${Tables.calculation_version_temporary}"
								set ${aUpdatedColums.join(" = ?, ")} = ? where CALCULATION_VERSION_ID = ? and SESSION_ID = ?`;
		dbConnection.executeUpdate(sUpdateStmt, [aValuesAfterUpdate]);
	};

	/**
	 * Function that calls the procedure for price determination.
	 * @param {integer}
	 *       iCvId - the calculation version id for which is triggered price determination
	 * @param {string}
	 *       sSessionId - session used for temporary table
	 * @param {string}
	 *       sUpdateScenario - parameter used inside the procedure in order to filter items based on their category.
	 * 					 - Can have the following values: (MATERIAL_PRICE_DETERMINATION_SCENARIO, ACTIVITY_PRICE_DETERMINATIONSCENARIO, ALL_CATEGORIES_SCENARIO);
	 *                   - This values are determined based on the conditions below:
	 *     						- MATERIAL_PRICE_DETERMINATION_SCENARIO: only MATERIAL_PRICE_DETERMINATION_STRATEGY_ID was updated => trigger price determination for items that have one of the following categories: Document, Material, Subcontracting, ExternalActivity
	 *     						- ACTIVITY_PRICE_DETERMINATION_SCENARIO: only ACTIVITY_PRICE_DETERMINATION_STRATEGY_ID was updated => trigger price determination for items with category: InternalActivity
	 *     						- ALL_CATEGORIES_SCENARIO: VALUATION_DATE or CUSTOMER_ID are updated or any combination of columns => the price determination is triggered for all item categories
	 * @throws {PlcException} - if price determination fails for calculation version
	 * @returns{object} UPDATED_ITEMS - items with prices updated
	 *            
	 */
	this.triggerPriceDetermination = function(iCvId, sSessionId, sUpdateScenario) {
		try {
			var func = dbConnection.loadProcedure(Procedures.calculation_version_trigger_price_determination);
			var oResult = func(iCvId, sSessionId, sUpdateScenario);

			return {
				UPDATED_ITEMS : Array.slice(oResult.OT_UPDATED_ITEMS)
			};
		} catch (e) {
			const sClientMsg = `Error while running automatic value determination for updated valuation date ${dValuationDate.toString()}.`;
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCvId}, Session id: ${sSessionId}), Error: ${e.message || e.msg}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
		}
	};

	this.updateMasterdataTimestamp = function(iCvId, sSessionId, dMasterdataTimestamp) {
		try {
			var func = dbConnection.loadProcedure(Procedures.calculation_version_masterdata_timestamp_update);
			var oResult = func(iCvId, sSessionId, dMasterdataTimestamp);
			return oResult;
		} catch (e) {
			const sClientMsg = `Error while setting masterdata timestamp ${dMasterdataTimestamp.toString()}.`;
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCvId}, Session id: ${sSessionId}), Error: ${e.message || e.msg}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
		}
	};

	this.getExistingNonTemporaryMasterdata = function(mParameters) {
        let dMasterdataTimestamp = null;
        let sControllingAreaId = null;

        if (mParameters["calculation_version_id"] && mParameters["session_id"]) {
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
            `, mParameters["session_id"], mParameters["calculation_version_id"]);
            // fallback to default values, in case the version or session does exist; normally this shouldn't 
            // happen however, doe to the structure of validation it cannot be made 100% sure (checking if 
            // if a version exists is done in business logic; this function is called from validation logic
            // => validator design must be changed)
            sControllingAreaId = oResult[0] ? oResult[0].CONTROLLING_AREA_ID : "";
            dMasterdataTimestamp = oResult[0] ? oResult[0].MASTER_DATA_TIMESTAMP : new Date();
        } 
        else if (mParameters["calculation_id"]){
            let oResult = dbConnection.executeQuery(`
                select controlling_area_id
                from "sap.plc.db::basis.t_project" as project 
                    inner join "sap.plc.db::basis.t_calculation"  as calculation
                        on project.project_id = calculation.project_id
                where   calculation.calculation_id = ?
            `, mParameters["calculation_id"]);
            sControllingAreaId = oResult[0] ? oResult[0].CONTROLLING_AREA_ID : "";
            dMasterdataTimestamp = new Date();
        } else if (mParameters["project_id"]) {
            let oResult = dbConnection.executeQuery(`
                    select controlling_area_id
                    from "sap.plc.db::basis.t_project" 
                    where   project_id = ? 
            `, mParameters["project_id"]);
            sControllingAreaId = oResult[0] ? oResult[0].CONTROLLING_AREA_ID : "";
            dMasterdataTimestamp = new Date();
        } else {
            const sClientMsg = `Unknown parameter or unknown combination of parameters: ${Object.keys(mParameters)}`;
            $.trace.error(sClientMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
		}

		/*
		return {
			CURRENCIES: this.helper.getExistingCurrencies(dMasterdataTimestamp),
			UNIT_OF_MEASURES: this.helper.getExistingUnitOfMeasures(dMasterdataTimestamp),
			ACCOUNTS: this.helper.getExistingAccounts(sControllingAreaId, dMasterdataTimestamp),
			COSTING_SHEETS: this.helper.getExistingCostingSheets(sControllingAreaId, dMasterdataTimestamp),
			COMPONENT_SPLITS: this.helper.getExistingComponentSplits(sControllingAreaId, dMasterdataTimestamp),
			EXCHANGE_RATE_TYPES: this.helper.getExistingExchangeRateTypes(),
			PRICE_SOURCES: this.helper.getExistingPriceSources(),
			DOCUMENT_TYPES: this.helper.getExistingDocumentTypes(dMasterdataTimestamp),
			DOCUMENT_STATUSES: this.helper.getExistingDocumentStatuses(dMasterdataTimestamp),
			DESIGN_OFFICES: this.helper.getExistingDesignOfficess(dMasterdataTimestamp),
			MATERIAL_TYPES: this.helper.getExistingMaterialTypes(dMasterdataTimestamp),
			MATERIAL_GROUPS: this.helper.getExistingMaterialGroups(dMasterdataTimestamp),
			OVERHEADS: this.helper.getExistingOverheadGroups(dMasterdataTimestamp),
			VALUATION_CLASSES: this.helper.getExistingValuationClasses(dMasterdataTimestamp)
		};
		*/
		// the above individual DB queries are replaced to below combined one for performance
        return this.helper.getExistingNonTemporaryMasterdataCombined(dMasterdataTimestamp, sControllingAreaId);
	};

	this.resetMissingNontemporaryMasterdata = function(iCalculationVersionId, sSessionId) {
		try {
			var fnProcedure = dbConnection.loadProcedure(Procedures.calculation_version_reset_missing_nontemporary_masterdata);
			var oResult = fnProcedure(iCalculationVersionId, sSessionId);

			return {
				CHANGED_COSTING_SHEET_COUNT : oResult.OV_CHANGED_COSTING_SHEET_COUNT,
				CHANGED_COMPONENT_SPLIT_COUNT : oResult.OV_CHANGED_COMPONENT_SPLIT_COUNT,
				CHANGED_ITEMS_WITH_RESET_ACCOUNTS : oResult.OT_ITEMS_WITH_RESET_ACCOUNTS
			};

		} catch (e) {
			const sClientMsg = "Error while trying to reset missing non-temporary masterdata for calculation version.";
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}, Error: ${e.message || e.msg}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, null, null, e);
		}
	};
	
	/**
	 * Gets the status entity by STATUS_ID
	 *
	 * @param {string}
	 *            sStatusId - the id of the calculation version status
	 * @returns {object} status object
	 */
	this.getStatusById = function(sStatusId) {
		var sStmt = `SELECT * FROM "${Tables.status}" WHERE STATUS_ID = ?`;
		return dbConnection.executeQuery(sStmt, sStatusId)[0];
	};

	/**
	 * Create a new calculation version by copying another calculation version
	 *
	 * @param {integer}
	 *            iCalculationVersionId - The calculation version that will be copied
	 * @param {string}
	 *            sSessionId - The session id
	 * @param {string}
	 *            sUserId - The user id
	 * @param bCompressedResult - bCompressedResult
	 *            flag to determine if the returned data is compressed
	 * @throws {PlcException} -
	 *             If input parameters are wrong
	 * @throws {PlcException} -
	 *             If the execution of the update statement would affect more that 1 row. This indicates a corrupted query or illegal
	 *             database state.
	 * @returns {oReturnObject} - copied calculation version with items
	 */
	this.copy = function(iCalculationVersionId, sSessionId, sUserId, sLanguage, bCompressedResult) {

		oMessageDetails.addCalculationVersionObjs({
			id : iCalculationVersionId
		});
		oMessageDetails.addUserObj({
			id : sUserId
		});
		
		checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		if (!_.isString(sSessionId) || !_.isString(sUserId)) {
			const sLogMessage = "Wrong parameters found during calculation version copy: sSessionId and sUserId must be strings.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}

		var oReturnObject = {
			version : {},
			items : [],
			itemsCompressed: {},
			referencesdata: {PROJECTS: [],
			    CALCULATIONS: [],
			    CALCULATION_VERSIONS: [],
			    MASTERDATA: {}
			}
		};

		// generate new IDs for calculation version
		var sSequenceCV = Sequences.calculation_version;
		var iNewCalculationVersionID = this.helper.getNextSequenceID(sSequenceCV);

		// read calculation version data and related items
		try {
			var procedure = dbConnection.loadProcedure(Procedures.calculation_version_copy);
			var result = procedure(iCalculationVersionId, iNewCalculationVersionID, sSessionId);
		} catch (e) {
			const sClientMsg = `Error when procedure ${Procedures.calculation_version_copy} is called.`;
			const sServerMsg = `${sClientMsg} Error message: ${e.message|| e.msg}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}

		var aCalculationVersion = result.OT_NEW_CALCULATION_VERSION;
		if (aCalculationVersion.length === 1) { // there should be exactly one result row
			oReturnObject.calculation_version = _.clone(aCalculationVersion[0]);
			
			// determine name for calculation version and update it
			oReturnObject.calculation_version.CALCULATION_VERSION_NAME = this
					.getOrDetermineNewCalculationVersionName(oReturnObject.calculation_version);
			if (oReturnObject.calculation_version.CALCULATION_VERSION_NAME.length > constants.CalculationNameMaxLength) {
				const sClientMsg = `The calculation version name has more than ${constants.CalculationNameMaxLength} characters.`;
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
			}
			var aProtectedColumnsUpdate = [ "SESSION_ID", "CALCULATION_VERSION_ID", "CALCULATION_ID", "MASTER_DATA_TIMESTAMP",
					"LAST_MODIFIED_ON", "LAST_MODIFIED_BY", "IS_DIRTY", "STATUS_ID"];

			this.update(oReturnObject.calculation_version, aProtectedColumnsUpdate, sSessionId);
		} else {
			const sLogMessage = "More than one version found during calculation version copy.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
		}
        
       if(bCompressedResult){
		    oReturnObject.itemsCompressed = helpers.transposeResultArray(result.OT_NEW_ITEMS, false);
		}
		else{
		 	oReturnObject.items = Array.slice(result.OT_NEW_ITEMS);   
		}
		//take information about the referenced calculations if they exist
		oReturnObject = this.getReferencedVersionDetails(oReturnObject, sLanguage);	

		return oReturnObject;
	};
	
	/**
	 * Function to check if a calculation has a saved version.
	 * 
	 * @param iCalculationId -
	 *            id of the calculation that shall be checked
	 * @throws {PlcException}
	 *             if the given argument is of wrong type
	 */
	this.checkSavedVersion = function(iCalculationId) {
		oMessageDetails.addCalculationObjs({
			id : iCalculationId
		});

		if (!helpers.isPositiveInteger(iCalculationId)) {
            const sLogMessage = "iCalculationId must be a positive integer.";
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
		
		// select saved version
		var oSelectedVersion = hQuery.statement('select top 1 CALCULATION_ID from "' + Tables.calculation_version + '"'
				+ 'where CALCULATION_ID = ?').execute(iCalculationId);
		if(oSelectedVersion.length > 0) {
			return 1;
		} else {
			return 0;
		}
	};



	/**
	 * Get Calculation Versions: 
	 * - it will return all calculations versions from a calculation when parameter calculation_id is used or top "n" calculations when used together with parameter top
     * - it will return recently used calculation versions when parameter recently_used is "true" or top "n" calculations when used together with parameter top
     * - it will always return root item for each calculation version
     * - it will always return masterdata 
     * - it will return project and calculation only when parameter recently_used is "true"
     * - it will return current calculation versions for a list of calculation when current is true
     * 
	 * @param {array}
	 *            aCalculationId - Calculation IDs used to get calculation versions 
	 * @param {integer}
	 *            iTop - Parameter used to filter the number of results retrieved
	 * @param {boolean}
	 *            bRecently_used - When set to TRUE will get recently used calculations
	 * @param {string}
	 *            sUserId - The user id
	 * @param {string}
	 *            sLanguage - The user logon language
	 *  @param {string}
	 * 			  bReturnOnlyRoot - When set to TRUE will get only the root item from the calculation versions
	 * @returns {oReturnObject} - calculation versions and root item for each calculation version, calculations, projects and masterdata
	 */	
	this.get = function(aCalculationId, iTop, bRecentlyUsed, iId, bLoadMasterdata, sUserId, sLanguage, bCurrent, bReturnLifecycle, bGetOnlyLifecycles, bReturnOnlyRoot) {

		var calculationVersionGet = dbConnection.loadProcedure(Procedures.calculations_versions_read);
		if(iTop == null){
		    var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation_version + '"');
            var aCount = oCheckStatement.execute();
            iTop = parseInt(aCount[0].ROWCOUNT);
		}
		
		if(!helpers.isNullOrUndefined(aCalculationId)) {
		    var aCalcIds = aCalculationId.split(",");
		    const aCalculation = _.map(aCalcIds, function(oCalcId){
				return [parseInt(oCalcId)];
			});
			var sInsertStmt = `insert into "${Tables.gtt_calculation_ids}" values(?)`;
			dbConnection.executeUpdate(sInsertStmt, aCalculation); 
		}
		
		var result = calculationVersionGet(iTop, bRecentlyUsed, iId, bLoadMasterdata, sUserId, sLanguage, bCurrent, bReturnLifecycle, bGetOnlyLifecycles, bReturnOnlyRoot);
		
		const oReturnObject = {
    		CALCULATION_VERSIONS : {},
    		CALCULATIONS : [],
    		PROJECTS : [],
    		ITEMS : [],
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
		return oReturnObject ;
	};
	
	/**
	 * Recover Calculation Versions: 
	 * -  will return top "n" calculations versions that were opened in a previous session and needs to be recovered
	 * -  will always return root item for each calculation version
	 * -  will return projects and calculations that are asigned to calculation versions found
     * 
	 * @param {integer}
	 *            iTop - Parameter used to filter the number of results retrieved
	 * @param {string}
	 *            sUserId - The user id
	 * @returns {oReturnObject} - calculation versions and root item for each calculation version, calculations and projects
	 */	
	this.recover = function(iTop, sUserId) {
		var calculationVersionRecover = dbConnection.loadProcedure(Procedures.calculations_version_recover);
		if(iTop == null){
		    var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation_version + '"');
            var aCount = oCheckStatement.execute();
            iTop = parseInt(aCount[0].ROWCOUNT);
		}
		
		var result = calculationVersionRecover(iTop, sUserId);
		
		var oReturnObject = {
    		CALCULATION_VERSIONS : [],
    		CALCULATIONS : [],
    		PROJECTS : [],
    		ITEMS : []
		};
		
		oReturnObject.CALCULATION_VERSIONS = Array.slice(result.OT_CALCULATION_VERSIONS);
		oReturnObject.PROJECTS = Array.slice(result.OT_PROJECTS);
		oReturnObject.ITEMS = Array.slice(result.OT_ITEMS);
		oReturnObject.CALCULATIONS = Array.slice(result.OT_CALCULATIONS);
	
		return oReturnObject ;
	};
	
	/**
	 * Keeps updated with recent calculation versions table "sap.plc.db::basis.t_recent_calculation_version".
	 * 
	 * @param {integer}
	 *            iCalculationVersionId - the calculation version id 
	 * @param {string}
	 *            sUserId - the user id 
	 * @param {boolean}
	 *            bDelete - set to true to remove deleted calculation versions from recent calculations
	 */
	function updateRecentlyUsed (iCalculationVersionId, sUserId, bDelete) {
		if( bDelete == true ){
		    const oUpdateRecentCalculationVersion = hQuery.statement('DELETE from  "'
				+ Tables.recent_calculation_versions + '"' + ' where CALCULATION_VERSION_ID =? and USER_ID =?');
			oUpdateRecentCalculationVersion.execute(iCalculationVersionId, sUserId);
		}else{
		    const oUpdateRecentCalculationVersion = hQuery.statement('upsert "'+ Tables.recent_calculation_versions + '"' +
				' values (?, ?, current_utctimestamp) where CALCULATION_VERSION_ID = ? and USER_ID = ?');
			oUpdateRecentCalculationVersion.execute(iCalculationVersionId, sUserId, iCalculationVersionId, sUserId);
		}
        
	}
	
	/**
	 * Function to get all distinct controlling areas for an array of calculation version id.
	 * 
	 * @param {array}
	 *            aCalculationVersionIds - array of calculation version id
	 * @returns {array} aResult - an array containing distinct controlling area
	 */
	this.getControllingAreasForCalculationVersions = function(aCalculationVersionIds) {
		
		if (!_.isArray(aCalculationVersionIds)) {
			const sLogMessage = "aCalculationVersionIds must be an array.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		
		var aValues = [];
		var aStmtBuilder = [];
		
		_.each(aCalculationVersionIds, function (iCalculationVersionId, iIndex) {
		    checkCalculationVersionIdIsPositiveInteger(iCalculationVersionId);
		    
			aValues.push(iCalculationVersionId);
			aStmtBuilder.push("?");
		});
		var sInValues = aStmtBuilder.join(", ");

		var aResult = hQuery.statement(
				`select distinct prj.CONTROLLING_AREA_ID 
					from "${Tables.project}" prj 
				inner join "${Tables.calculation}" calc 
					on calc.PROJECT_ID = prj.PROJECT_ID 
				inner join "${Tables.calculation_version}" calcVers 
					on calcVers.CALCULATION_ID = calc.CALCULATION_ID 
				where calculation_version_id in ( ${sInValues} );`).execute(aValues);
		
		if (aResult.length > 0)
			return _.map(aResult, "CONTROLLING_AREA_ID");

		return [];
	};
	
	/**
	 * Function to read all data of the calculation version's project.
	 * 
	 * @param {integer}
	 *            iCalculationVersionId - the calculation version id 
	 * @param {bool}
	 *            bTemporary - if true then get properties for temporary calculation version, if false then for calculation version 
	 * @returns {object} oReturnObject - an object containing all data of the project or null
	 */
	this.getProjectPropertiesForCalculationVersion = function(iCalculationVersionId, bTemporary) {
		bTemporary = (bTemporary === undefined) ? true : bTemporary;

		var sCalculationVersionTable = Tables.calculation_version_temporary;
		if (bTemporary === false) {
			sCalculationVersionTable = Tables.calculation_version;
		}
		
		var result = hQuery.statement(
						`select prj.PROJECT_ID, prj.REPORT_CURRENCY_ID, prj.CONTROLLING_AREA_ID 
							from "${Tables.project}" prj 
							inner join "${Tables.calculation}" calc 
								on calc.PROJECT_ID = prj.PROJECT_ID 
							inner join "${sCalculationVersionTable}" calcVers 
								on calcVers.CALCULATION_ID = calc.CALCULATION_ID where calculation_version_id = ?`
					).execute(iCalculationVersionId);
		return result[0] || null;
	};
	
	/**
	 * Function to search calculation versions and all the related data according to the defined filters
	 * when we need to select a version as reference.
	 *
	 * @param {integer} iCalcVersionId - the calculation version id 
	 * @param {string} sFilters - search strings for different business objects
	 * @param {string} sSortingColumn - column id to be sorted by -  default Version Name
	 * @param {string} sSortingDirection - sorted direction DESC, ASC - default Asc
	 * @param {integer} iTop - first top records
	 * @param {string} sLanguage - The user logon language
	 * @param {string} sUserId - The logon user
	 * @throws {PlcException} - if executing sql statement fails
	 *
	 * @returns {object} oReturnObject - object containing all the search objects
	 */
	this.getCalculationVersionsToBeReferenced = function(iCalcVersionId, sFilters, sSortingColumn, sSortingDirection, iTop, sLanguage, sUserId) {

	    var aValues = [];

	    // select all calculation versions with the related information, which are under projects with the same controlling area 
	    // as the controlling area of the project of the input calculation version 
	    let sStmt = `select top ?  
	    		distinct cv.CALCULATION_VERSION_ID, cv.CALCULATION_VERSION_NAME, cv.CUSTOMER_ID, cv.LAST_MODIFIED_ON, cv.LAST_MODIFIED_BY,
	    		calc.CALCULATION_ID, calc.CALCULATION_NAME, prj.PROJECT_ID, prj.PROJECT_NAME, prj.PROJECT_RESPONSIBLE, cv.REPORT_CURRENCY_ID, cv.EXCHANGE_RATE_TYPE_ID, 
	    		item.TOTAL_COST, item.TOTAL_QUANTITY, item.TOTAL_QUANTITY_UOM_ID, item.MATERIAL_ID, item.PLANT_ID, 
	    		cust.CUSTOMER_NAME as PROJECT_CUSTOMER_NAME, cust1.CUSTOMER_NAME as CALCULATION_VERSION_CUSTOMER_NAME 
	    	from "${Views.calculation_version_with_privileges}" cv 
	    		inner join "${Tables.calculation}" calc on calc.calculation_id=cv.calculation_id 
	    		inner join "${Tables.project}" prj on prj.project_id=calc.project_id 
	    		inner join "${Tables.item}" item on item.item_id=cv.root_item_id and item.CALCULATION_VERSION_ID = cv.CALCULATION_VERSION_ID 
	    		left outer join "${Tables.customer}" cust on cust.CUSTOMER_ID=prj.CUSTOMER_ID 
	    		left outer join "${Tables.customer}" cust1 on cust1.CUSTOMER_ID=cv.CUSTOMER_ID 
	    		left outer join "${Tables.plant_text}" plant on plant.PLANT_ID=item.PLANT_ID and plant.LANGUAGE = ? 
	    		left outer join "${Tables.material_text}" mat on mat.MATERIAL_ID=item.MATERIAL_ID and mat.LANGUAGE = ? 
	    	where cv.USER_ID = ? and calc.CURRENT_CALCULATION_VERSION_ID = cv.CALCULATION_VERSION_ID and cv.CALCULATION_VERSION_ID <> ? 
	    		and prj.CONTROLLING_AREA_ID in 
	    			(select prj1.controlling_area_id from "${Tables.project}" prj1 
	    				inner join "${Tables.calculation}" calc1 on calc1.project_id=prj1.project_id 
	    				inner join  
	    					(select calculation_id, calculation_version_id from "${Tables.calculation_version}" 
	    					 union 
	    					 select calculation_id, calculation_version_id from "${Tables.calculation_version_temporary}"
	    					 ) cv1 
	    				on cv1.calculation_id = calc1.calculation_id and cv1.CALCULATION_VERSION_ID = ?)
	    `;   
	    
	    aValues.push(iTop, sLanguage, sLanguage, sUserId, iCalcVersionId, iCalcVersionId);
	    
	    if(!helpers.isNullOrUndefined(sFilters)) {
	    	sFilters = sFilters.replace('+', '*');
	    	var aObjectsList = sFilters.split(",");
		    aObjectsList.forEach(function(obj) {
		    	sStmt += ` and `;
		    	var sFilter = '*' +  obj.substr(obj.indexOf("=") + 1) + '*';
		    	var sFilterType =obj.substr(0,obj.indexOf("="));
		    	switch (sFilterType.toUpperCase()){
		    		case 'CALCULATION_VERSION':
		    			sStmt += `(contains(cv.CALCULATION_VERSION_ID, ?) or contains(cv.CALCULATION_VERSION_NAME, ?))`;
			        	aValues.push (sFilter); aValues.push(sFilter);
			        	break;
		    		case 'CALCULATION':
		    			sStmt += `(contains(calc.CALCULATION_ID, ?) or contains(calc.CALCULATION_NAME, ?))`;
			        	aValues.push (sFilter); aValues.push(sFilter);
			        	break;
		    		case 'PROJECT':
		    			sStmt += `(contains(prj.PROJECT_ID, ?) or contains( prj.PROJECT_NAME, ?))`;
			        	aValues.push (sFilter); aValues.push(sFilter);
			        	break;
		    		case 'PLANT':
		    			sStmt += `(contains(item.PLANT_ID, ?) or contains(plant.PLANT_DESCRIPTION, ?))`;
			        	aValues.push (sFilter); aValues.push(sFilter);
			        	break;
		    		case 'CUSTOMER':
		    			sStmt += `(contains((prj.CUSTOMER_ID, cv.CUSTOMER_ID, cust1.CUSTOMER_NAME, cust.CUSTOMER_NAME), ?))`;
			        	aValues.push (sFilter); 
			        	break;
		    		case 'MATERIAL':
		    			sStmt += `(contains(item.MATERIAL_ID, ?) or contains(mat.MATERIAL_DESCRIPTION, ?))`;	
			            aValues.push (sFilter); aValues.push(sFilter);
			            break;
		    		default: {
						const sLogMessage = `Invalid filter object: ${sFilterType}.`;
						$.trace.error(sLogMessage);
						throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
					}
		    	}
		    });
	    }
	    sStmt += ` order by ${sSortingColumn}  ${sSortingDirection};`;
	    
		 try {	 
			 var oStatement = hQuery.statement(sStmt);
			 var aResult = oStatement.execute(aValues);
	    } catch (e) {
		    	const sClientMsg = "Error while executing the selection of versions that can be referenced.";
		    	const sServerMsg = `${sClientMsg} Error: ${e.message || e.msg}`;
		    	$.trace.error(sServerMsg);
			    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
	    }
	    
	    return aResult;
	    
	};
	

	/**
	 * Get the list of lifecycle versions ids of a calculation version
	 *
	 * @param {int}
	 *          iCalculationVersionId - the id of the calculation versions that should be checked if has lifecycle versions
	 * @returns {array} - Ids of lifecycle versions
	 */
	this.getLifecycleVersionsIds = function(iCalculationVersionId) {
		var sStmt = `select CALCULATION_VERSION_ID from "${Tables.calculation_version}" where BASE_VERSION_ID = ?`;
		var oResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);

		return _.map(oResult, "CALCULATION_VERSION_ID");
	};	
	
	
	/**
	 * Gets the list of versions where the version is referenced
	 *
	 * @param {int}
	 *            iCalcVersionId - the id of the calculation versions that should be checked if is referenced
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {array} ids of versions where the version is referenced
	 */
	this.getMasterVersions = function(iCalcVersionId) {	
		try {
			var oStatement = hQuery.statement(
					`select distinct CALCULATION_VERSION_ID 
						from "${Tables.item}" 
					  where REFERENCED_CALCULATION_VERSION_ID = ?
					  union 
					  select calculation_version_id 
					  	from "${Tables.item_temporary}"
					  where REFERENCED_CALCULATION_VERSION_ID = ?;`
					);		
			var aVersionsIds = oStatement.execute(iCalcVersionId, iCalcVersionId);
		} catch (e) {
			const sClientMsg = "Error during selecting the versions where the calculation version is referenced.";
			const sServerMsg = `${sClientMsg} Calculation Version Id: ${iCalcVersionId}, Error: ${e.msg || e.message}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
		}
		return aVersionsIds;
	};
	
	/**	
	 * Runs a price determination for all leaf items in the calculation version for the specified id. The version does not need to be open because all prices are directly 
	 * updated in t_item.
	 * 
	 * CAUTION: It the calculation version is open, the determined prices could be overridden, if the user saves the version.
	 * 
	 * The function was initially introduced to execute a price determination for a newly created lifecycle version right after cloning and updating references.
	 * 	 
	 * @param  {type} iCvId The id of the calculation version. This id must correspond to a version in t_calculation_version. If no version exists for the id, no prices are
	 * 						are updated
	 */
	this.priceDetermination = function(iCvId) {
		var fProcedure = dbConnection.loadProcedure(Procedures.calculation_version_price_determination);
		fProcedure(iCvId);
	};
	
	/**
	 * Gets the list of versions that reference the lifecycle version of given base version (including temporary versions).
	 * @param {string} 
	 *            sSessionId - current session id of the request
	 * @param {int}
	 *            iCalculationVersionId - the id of the base version that should be checked
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {array} ids of users and users that opened the lifecycle calculation versions of the given base version
	 */
	this.getLifecycleMasterVersionsForBaseVersion = function(iCalculationVersionId) {
		var sStmt = `	select  
							item.calculation_version_id as referencing_version_id,
							versions.calculation_version_id as lifecycle_version_id,
							referencing_versions.base_version_id as referencing_base_version_id
						from 	"${Tables.item}" as item
							inner join "${Tables.calculation_version}" as versions
								on item.referenced_calculation_version_id = versions.calculation_version_id
							inner join "${Tables.calculation_version}" as referencing_versions
								on referencing_versions.calculation_version_id = item.calculation_version_id 
						where versions.base_version_id = ?
						union
						select  
							item_temp.calculation_version_id  as referencing_version_id,
							versions.calculation_version_id as lifecycle_version_id,
							referencing_versions.base_version_id as referencing_base_version_id
						from 	"${Tables.item_temporary}" as item_temp
							inner join "${Tables.calculation_version}" as versions
								on item_temp.referenced_calculation_version_id = versions.calculation_version_id
							inner join "${Tables.calculation_version}" as referencing_versions
								on referencing_versions.calculation_version_id = item_temp.calculation_version_id 
						where versions.base_version_id = ?;
					`;
		var aOpenVersions = dbConnection.executeQuery(sStmt, iCalculationVersionId, iCalculationVersionId);
		return Array.slice(aOpenVersions);
	};

    /**
    * Handles the update of the CALCULATION_VERSION_TYPE for a given calculation version based on its current functionality
    * @param iCalculationVersionId - the id of the calculation version for which the calculation version type needs to be updated
    * @param iCalculationVersionType - the new calculation version type that should replace the old one
    */
    this.updateCalculationVersionType = (iCalculationVersionId, iCalculationVersionType) => {
        const sStmt = ` UPDATE "${Tables.calculation_version}"
					SET CALCULATION_VERSION_TYPE = ?
					WHERE CALCULATION_VERSION_ID = ?`;
        return dbConnection.executeUpdate(sStmt, iCalculationVersionType, iCalculationVersionId);
	};
	
	/**
    * Returns the ITEM_ID of the root item for a given calculation version
    * @param iCalculationVersionId - the id of the calculation version for which the root item id has to be returned 
    */
   this.getVersionRootItemId = (iCalculationVersionId) => {
	const sStmt = ` SELECT ROOT_ITEM_ID FROM "${Tables.calculation_version}"
					WHERE CALCULATION_VERSION_ID = ?`;
	return Array.from(dbConnection.executeQuery(sStmt, iCalculationVersionId));
	
	};

	/**
	 * Adds the currency unit for custom fields to oCalculationResult
	 * It's used in calculationVersionService and calculated-results to add the currency units too and not only the
	 * calculated values
	 * @param iCalculationVersionId - the id of the calculation version for which the reporting currency was changed
	 * @param oItemCalc - the object returned with the calculated values by AFL where the currencies should be added
	 * @param oPersistency
	 * @param bCompressed - `true` if the results are compressed, `false` otherwise
	 */
	this.addCurrencyUnitsToCalculationResults = (iCalculationVersionId, oItemCalc, oPersistency, bCompressed) => {
		if (oPersistency.Metadata.getAllCustomFieldsNamesAsArray().length > 0) {
			// Get the custom fields currency values
			const fnDetermination = dbConnection.loadProcedure(Procedures.item_custom_fields_currency_get);
			const oResult = fnDetermination(iCalculationVersionId);
			const aItemCFsCurrency = helpers.transposeResultArrayOfObjects(oResult.OT_ITEMS_CUSTOM_FIELDS_CURRENCY);
			
			/** 
			 * Add these values to the ITEM_CALCULATED_FIELDS(_COMPRESSED) and match the ITEM_ID returned from
			 * the item_custom_fields_currency_get procedure with the ITEM_ID returned from the AFL side. This
			 * is necessary in order to guarantee the calculated values have the proper currency
			*/
			if (Object.keys(aItemCFsCurrency).length > 2) {
				for(let sItemExtProperty in aItemCFsCurrency) {
					if (sItemExtProperty !== "ITEM_ID") {
						if (bCompressed === true) {
							let aItemsToPush = [];
							oItemCalc["ITEM_ID"].forEach(element => {
								let indexOfItemId = aItemCFsCurrency["ITEM_ID"].indexOf(element);
								if (aItemCFsCurrency["CALCULATION_VERSION_ID"][indexOfItemId] === iCalculationVersionId) {
									aItemsToPush.push(aItemCFsCurrency[sItemExtProperty][indexOfItemId]);
								}
							});
							oItemCalc[sItemExtProperty] = aItemsToPush;
						} else {
							oItemCalc.forEach(oItem => {
								let indexOfItemId = aItemCFsCurrency["ITEM_ID"].indexOf(oItem.ITEM_ID);
								oItem[sItemExtProperty] = aItemCFsCurrency[sItemExtProperty][indexOfItemId];
							});
						}
					}
				}
			}
		}
	}

	/**
	 * Determine the lifecycle period description of a calculation version
	 * Lifecycle period description is determined by concatenating the YEAR and MONTH of the lifecycle
	 * @param iCalculationVersionId - the id of the calculation version for which lifecycle period is determined
	 */
	this.getLifecyclePeriodDescription = (iCalculationVersionId) => {

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
		where calc_vers.CALCULATION_VERSION_ID = ${iCalculationVersionId}
		and calc_vers.CALCULATION_VERSION_TYPE in (${constants.CalculationVersionType.Lifecycle}, ${constants.CalculationVersionType.ManualLifecycleVersion});`

		let aResult = dbConnection.executeQuery(sGetStmt);

		if(aResult.length === 1){ //check that the length of the result is exactly 1 in order to make sure we don't have more lifecycle periods that match
			return aResult[0].LIFECYCLE_PERIOD_FROM_DESCRIPTION;
		} else {
			return '';
		}
	}
}
CalculationVersion.prototype = Object.create(CalculationVersion.prototype);
CalculationVersion.prototype.constructor = CalculationVersion;

module.exports.CalculationVersion = CalculationVersion;