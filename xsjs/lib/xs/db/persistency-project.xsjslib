const _ = $.require("lodash");
const Helper = $.require("./persistency-helper").Helper;
const Misc = $.require("./persistency-misc").Misc;
const Session = $.require("./persistency-session").Session;
const Metadata = $.require("./persistency-metadata").Metadata;
const helpers = $.require("../util/helpers");
const MasterdataResources 	= $.require("../util/masterdataResources").MasterdataResource;
const BusinessObjectsEntities = $.require("../util/masterdataResources").BusinessObjectsEntities;
const Constants = $.require("../util/constants");
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const UrlToSqlConverter = $.require("../util/urlToSqlConverter").UrlToSqlConverter;
const Limits = $.require("../util/masterdataResources").Limits;
const Privilege = $.import("xs.db", "persistency-privilege").Privilege;

const AuthorizationManager = $.require("../authorization/authorization-manager");
const InstancePrivileges = AuthorizationManager.Privileges;

const MessageLibrary = $.require("../util/message");
const PlcException = MessageLibrary.PlcException;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

var Tables = {
	authorization : 'sap.plc.db::auth.t_auth_project',
	user_authorization: "sap.plc.db::auth.t_auth_user",
	project : 'sap.plc.db::basis.t_project',
	open_projects : 'sap.plc.db::basis.t_open_projects',
	session : 'sap.plc.db::basis.t_session',
	calculation : 'sap.plc.db::basis.t_calculation',
	calculation_version : 'sap.plc.db::basis.t_calculation_version',
	calculation_version_temporary : 'sap.plc.db::basis.t_calculation_version_temporary',
	open_calculation_versions : 'sap.plc.db::basis.t_open_calculation_versions',
	item : 'sap.plc.db::basis.t_item',
	item_temporary : 'sap.plc.db::basis.t_item_temporary',
	project_lifecycle_configuration : 'sap.plc.db::basis.t_project_lifecycle_configuration',
	project_lifecycle_period_type : 'sap.plc.db::basis.t_project_lifecycle_period_type',
	project_monthly_periods: 'sap.plc.db::basis.t_project_monthly_lifecycle_period',
	project_activity_price_surcharges : 'sap.plc.db::basis.t_project_activity_price_surcharges',
	project_activity_price_surcharge_values : 'sap.plc.db::basis.t_project_activity_price_surcharge_values',
	project_material_price_surcharges : 'sap.plc.db::basis.t_project_material_price_surcharges',
	project_material_price_surcharge_values : 'sap.plc.db::basis.t_project_material_price_surcharge_values',
	project_one_time_cost_lifecycle_value: 'sap.plc.db::basis.t_one_time_cost_lifecycle_value',
	project_one_time_cost: 'sap.plc.db::basis.t_one_time_project_cost',
	product_one_time_cost: 'sap.plc.db::basis.t_one_time_product_cost',
	task: 'sap.plc.db::basis.t_task',
	lifecycle_period_value : 'sap.plc.db::basis.t_project_lifecycle_period_quantity_value',
	lifecycle_monthly_period : 'sap.plc.db::basis.t_project_monthly_lifecycle_period',
	application_timeout : 'sap.plc.db::basis.t_application_timeout',
	folder: "sap.plc.db::basis.t_folder",
	entity_relation : 'sap.plc.db::basis.t_entity_relation',
	gtt_masterdata_validator: 'sap.plc.db::temp.gtt_masterdata_validator'
};

const Procedures = {
	project_read : 'sap.plc.db.calculationmanager.procedures::p_project_read',
	project_delete : 'sap.plc.db.calculationmanager.procedures::p_project_delete',
	create_lifecycle_versions : 'sap.plc.db.calculationmanager.procedures::p_project_create_lifecycle_versions',
	calculate_lifecycle_versions : 'sap.plc.db.calcengine.procedures::p_calculate_project_lifecycle',
	materdata_references_validator: 'sap.plc.db.administration.procedures::p_materdata_references_validator',
	check_manual_one_time_costs: 'sap.plc.db.calculationmanager.procedures::p_project_check_manual_one_time_costs',
	project_calculate_one_time_costs: 'sap.plc.db.calculationmanager.procedures::p_project_calculate_one_time_costs'
};

const Views = {
	project_with_privileges : 'sap.plc.db.authorization::privileges.v_project_read'
};

const Sequences = {
	rule_id : 'sap.plc.db.sequence::s_rule_id',
	project_entity_sequance: 'sap.plc.db.sequence::s_entity_id'
};


/**
 * Provides persistency operations with projects.
 */

function Project(dbConnection, hQuery) {
	this.helper = new Helper($, hQuery, dbConnection);
	this.misc = new Misc($, hQuery, $.getPlcUsername());
	this.session = new Session($, dbConnection, hQuery);
	this.metadata = new Metadata($, hQuery, null, $.getPlcUsername());
	this.converter = new UrlToSqlConverter();
	var sBusinessObjectName = BusinessObjectTypes.Project;
	this.privilege = new Privilege(dbConnection);
	var sessionTimeout = Constants.ApplicationTimeout.SessionTimeout;
	var that = this;

	/**
	 * Gets all projects along with master data and counts the number of calculation for each project
	 * @param {string}
	 *            sLanguage - the language code for which descriptions should be returned
	 * @returns {object} oReturnObject - An object containing an array of projects + masterdata
	 */
	this.getAll = function(sLanguage, sUserId, mParameters) {
		var sProjectId = '';
		var sMasterDataDate = new Date();
		var sSQLstring = '';
		var sTextFromAutocomplete = '';
		var noRecords = Limits.Top;
		var iFolderId = null;
		var aMetadataFields = this.metadata.getMetadataFields(sBusinessObjectName, sBusinessObjectName, null);

 		if(!helpers.isNullOrUndefined(mParameters.searchAutocomplete)){
			sTextFromAutocomplete = mParameters.searchAutocomplete;
		}

		if(!helpers.isNullOrUndefined(mParameters.top)){
			noRecords = parseInt(mParameters.top);
		}

		if(!helpers.isNullOrUndefined(mParameters.folderId)){
			iFolderId = mParameters.folderId
		}

		if(!helpers.isNullOrUndefined(mParameters.filter)){
			sSQLstring = this.converter.convertToSqlFormat(mParameters.filter, aMetadataFields);
 		}

		var fnReadProcedure = dbConnection.loadProcedure(Procedures.project_read);
		var oReadResult = fnReadProcedure(sLanguage, sUserId, sMasterDataDate, sProjectId, sTextFromAutocomplete, noRecords, sSQLstring, iFolderId);
		
		var oReturnObject = {};
		oReturnObject.aProjects = Array.slice(oReadResult.OT_PROJECTS);

		// Due to performance reasons, only the controlling area & customer will be read
		var mMasterdataContainer = {};
		mMasterdataContainer[BusinessObjectsEntities.CUSTOMER_ENTITIES] = Array.slice(oReadResult.OT_CUSTOMER);
		mMasterdataContainer[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(oReadResult.OT_CONTROLLING_AREA);

		oReturnObject.mMasterdata = mMasterdataContainer;

		return oReturnObject;
	};

	/**
	 * Gets specific project along with master data and counts the number of project's calculations
	 * @param {string}
	 *            sLanguage - the language code for which descriptions should be returned
	 * @param {string}
	 *            sProjectId - the id of the project that should be retrieved.
	 * @returns {object} oReturnObject - An object containing an array of project + masterdata
	 */
	this.get = function(sLanguage, sUserId, sProjectId) {
		var sMasterDataDate = new Date();
		var fnReadProcedure = dbConnection.loadProcedure(Procedures.project_read);
		var oReadResult = fnReadProcedure(sLanguage, sUserId, sMasterDataDate, sProjectId, '', 1, '');

		var oReturnObject = {};
		oReturnObject.aProjects = Array.slice(oReadResult.OT_PROJECTS);

		// deliver all project-relevant master data for one project
		var mMasterdataContainer = {};
		mMasterdataContainer[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(oReadResult.OT_CONTROLLING_AREA);
		mMasterdataContainer[BusinessObjectsEntities.CUSTOMER_ENTITIES] = Array.slice(oReadResult.OT_CUSTOMER);
		mMasterdataContainer[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(oReadResult.OT_COMPANY_CODE);
		mMasterdataContainer[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(oReadResult.OT_PLANT);
		mMasterdataContainer[BusinessObjectsEntities.BUSINESS_AREA_ENTITIES] = Array.slice(oReadResult.OT_BUSINESS_AREA);
		mMasterdataContainer[BusinessObjectsEntities.PROFIT_CENTER_ENTITIES] = Array.slice(oReadResult.OT_PROFIT_CENTER);
		mMasterdataContainer[BusinessObjectsEntities.COSTING_SHEET_ENTITIES] = Array.slice(oReadResult.OT_COSTING_SHEET);
		mMasterdataContainer[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES] = Array.slice(oReadResult.OT_COMPONENT_SPLIT);
	    mMasterdataContainer[BusinessObjectsEntities.EXCHANGE_RATE_TYPE_ENTITIES] = Array.from(oReadResult.OT_EXCHANGE_RATE_TYPE);
	    
		oReturnObject.mMasterdata = mMasterdataContainer;

		return oReturnObject;
	};
	
	
	/**	
	 * Gets all existing calculations with their versions. Currently only the ids of calculation and version are selected, because only this is needed so far.
	 * If future use cases need more data, additional columns can be added to the select stmt.
	 * 
	 * NOTE: This is done with a inner join from Tables.calculation with Tables.calculation_version. For each combination of calculation and version id,
	 * 		 a row in the result set is materialized. Hence, the calculation id is n times in the result set, if the calculation has n versions.
	 * 	 
	 * @param  {string} sProjectId The id of the project for which all the calculations with versions shall be retrieved.	 
	 * @return {array}            A result set containing object with the properties CALCULATION_ID and CALCULATION_VERSION_ID.
	 */
	this.getCalculationsWithVersions = function(sProjectId) {
		var sStmt =
			`
			select  versions.calculation_id,
					versions.calculation_version_id 
			from "${Tables.calculation}" as calculations
				inner join "${Tables.calculation_version}" as versions
					on versions.calculation_id = calculations.calculation_id
			where calculations.project_id = ?;
		`;

		return dbConnection.executeQuery(sStmt, sProjectId);
	};

	/**
	 * Closes a project for a user by removing it from open_projects table.
	 *
	 * @param {string}
	 *            sProjectId - ID of the project to close
	 * @param {string}
	 *            sSessionId - ID of the session, in which the project to close is opened
	 * @returns {void}
	 */
	this.close = function(sProjectId, sSessionId) {

		var sCloseStatement = 'delete from "' + Tables.open_projects
		+ '" where session_id = ? and project_id = ?';

		dbConnection.executeUpdate(sCloseStatement, sSessionId, sProjectId);
		dbConnection.commit();
	};

	/**
	 * Gets and returns the next ID from 'sap.plc.db.sequence::s_entity_id' sequence.
	 * @returns {integer} the next ID taken from 'sap.plc.db.sequence::s_entity_id' sequence
	 */
	this.getNextSequence = () => {
		return this.helper.getNextSequenceID(Sequences.project_entity_sequance);
	}

	/**
	 * Creates new project in database
	 * @param {object}
	 *            oProject - the project object that should be created
	 * @param {string}
	 *            sSessionId - session id
	 * @param {string}
	 *            sUserId - user id
	 * @returns {object} oResultSet - created project
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
	this.create = function(oProject, sSessionId, sUserId) {
		const iEntityId = this.getNextSequence();
		const oEntityRelation = {
			"PARENT_ENTITY_ID": oProject.PATH !== "0" ? helpers.getEntityIdFromPath(oProject.PATH) : null
		};
		const oEntityRelationSettings = {
			TABLE : Tables.entity_relation,
			PROPERTIES_TO_EXCLUDE : [],
			GENERATED_PROPERTIES : {
				"ENTITY_ID": iEntityId,
				"ENTITY_TYPE": Constants.EntityTypes.Project
			}
		};
		this.helper.insertNewEntity(oEntityRelation, oEntityRelationSettings);
		// Exclude the properties that are not plain objects and which are protected with regard to internal logic
		var aPropertiesToExclude = _.filter(_.keys(oProject), function(sKey) {
			return _.isArray(oProject[sKey]);
		});

		var currentdate = new Date();
		var oGeneratedValues = {
				"CREATED_ON": currentdate,
				"CREATED_BY": sUserId,
				"LAST_MODIFIED_ON": currentdate,
				"LAST_MODIFIED_BY": sUserId,
				"ENTITY_ID": iEntityId
		};

		var oSettings = {
				TABLE : Tables.project,
				PROPERTIES_TO_EXCLUDE : aPropertiesToExclude,
				GENERATED_PROPERTIES : oGeneratedValues
		};
		// PATH is removed as it's not part of the Project Model.
		const oResultSet = this.helper.insertNewEntity(_.omit(oProject, ["PATH"]), oSettings);

		// check for start/end date of project in order to create lifecycle periods
		const bStartOfProjectExists = !helpers.isNullOrUndefined(oProject.START_OF_PROJECT) && oProject.START_OF_PROJECT !== null;
		const bEndOfProjectExists = !helpers.isNullOrUndefined(oProject.END_OF_PROJECT) && oProject.END_OF_PROJECT !== null;
		if (bStartOfProjectExists && bEndOfProjectExists) {
			this.createYearlyLifecyclePeriodTypesForProject(oProject.PROJECT_ID, new Date(oProject.START_OF_PROJECT).getFullYear(), new Date(oProject.END_OF_PROJECT).getFullYear());
		}

		// Grant ADMINISTRATE instance-based privilege to current user for newly created project
		this.createAdminUserPrivilege(oProject.PROJECT_ID, sSessionId);

		return oResultSet;
	};
	
	/**
	 * Creates administration role for the creating user
	 * @param {string}
	 *            sProjectId - the project id for which the privilege is created
	 */
	this.createAdminUserPrivilege = function (sProjectId, sSessionId) {
		var aUserPrivilege = [{
									"USER_ID": sSessionId,
									"PRIVILEGE": InstancePrivileges.ADMINISTRATE
							}];
		this.privilege.insertUserPrivileges(aUserPrivilege, 'PROJECT', sProjectId);
	};

	/**
	 * Checks whether the project id exists in project table. The string matching
	 * is made in a case-insensitive manner.
	 * @param {string}
	 *            sProjectId - the id of the project that should be opened
	 * @returns {boolean} - true if the calculation version id exists, otherwise false
	 */
	this.exists = function(sProjectId) {
		return this.helper.exists([sProjectId], Tables.project, "project_id");
	};

	/**
	 * Deletes all data where session_id does not exists in session table anymore to make sure data is consistent *
	 */
	function cleanupSessions(sProjectId) {
		// delete outdated session if it locks a required calculation version

		// CURRENT_UTCTIMESTAMP MUST be used in SQL stmt, since CURRENT_TIMESTAMP would lead cleanup a session every time this method is called
		// if the server is not running in UTC (due to time offset)
		var oStatementDelete = hQuery.statement([ 'delete from  "' + Tables.session + '"',
				' where session_id in (select "SESSION_ID" from "' + Tables.open_projects + '"',
				' where project_id = ? and IS_WRITEABLE = 1) and SECONDS_BETWEEN(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP)> ',
				'( select "VALUE_IN_SECONDS" from "' + Tables.application_timeout + '" where APPLICATION_TIMEOUT_ID =?)' ].join(" "));
		oStatementDelete.execute(sProjectId, sessionTimeout);
		// delete all temporary data if session is not found in t_session
		that.session.deleteOutdatedEntries();
	}

	/**
	 * Opens the project in read-only or read-write
	 * @param {string}
	 *            sProjectId - the id of the project that should be opened
	 * @param {string}
	 *            sSessionId - the id of the session for which the project should be opened	 
	 * @param {integer}
	 *            iIsWriteable - read or write mode
	 */
	this.open = function (sProjectId, sSessionId, iIsWriteable) {
		// cleanup session_id does not exists in session table anymore
		cleanupSessions(sProjectId);

		var sUpsertStatement = 'upsert "' + Tables.open_projects
			+ '" values (?, ?, ?) where session_id = ? and project_id = ?';
		dbConnection.executeUpdate(sUpsertStatement, sSessionId, sProjectId, iIsWriteable, sSessionId, sProjectId);
		dbConnection.commit();
	};

	this.hasReadPrivilege = function (sProjectId) {
		var sPrivilege = AuthorizationManager.getUserPrivilege(AuthorizationManager.BusinessObjectTypes.Project, sProjectId, dbConnection,
			$.getPlcUsername());
		return sPrivilege === InstancePrivileges.READ ? true : false;
	};

    const getControllingAreaForParameter = function(mParameters){
        let sControllingAreaId = null;
        if (mParameters["controlling_area_id"]) {
            sControllingAreaId = mParameters.controlling_area_id;
        } else if (mParameters["project_id"]) {
            let result = dbConnection.executeQuery(`
                    select controlling_area_id
                    from "sap.plc.db::basis.t_project" 
                    where   project_id = ? 
            `, mParameters["project_id"]);
            // fallback to default values, in case the version or session does exist; normally this shouldn't 
            // happen however, doe to the structure of validation it cannot be made 100% sure (checking if 
            // if a version exists is done in business logic; this function is called from validation logic
            // => validator design must be changed)
            sControllingAreaId = result[0] ? result[0].CONTROLLING_AREA_ID : "";
        } else {
            const sLogMessage = `Unknown parameter or unknown combination of parameters during getting controlling area: ${Object.keys(mParameters)}`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        return sControllingAreaId;
    };

    /**
     * Gets existing non temporary master data for projects(all currency Ids, costing sheets, component splits and all controlling area IDs).
     * @return {object} all CONTROLLING_AREA_ID, COSTING_SHEET_ID, COMPONENT_SPLIT_ID and CURRENCY_ID for projects as maps to be used in businessObjectValidatorUtils.
     */
    this.getExistingNonTemporaryMasterdata = function(mParameters) {
        const dMasterdataTimestamp = new Date();
        const sControllingAreaId = getControllingAreaForParameter(mParameters);

        return {
            CURRENCIES: this.helper.getExistingCurrencies(dMasterdataTimestamp),
            COSTING_SHEETS: this.helper.getExistingCostingSheets(sControllingAreaId, dMasterdataTimestamp),
            COMPONENT_SPLITS: this.helper.getExistingComponentSplits(sControllingAreaId, dMasterdataTimestamp),
            EXCHANGE_RATE_TYPES: this.helper.getExistingExchangeRateTypes(),
			CONTROLLING_AREAS: this.helper.getExistingControllingAreas(),
			MATERIAL_PRICE_STRATEGIES: this.helper.getExistingMaterialPriceStrategies(),
			ACTIVITY_PRICE_STRATEGIES: this.helper.getExistingActivityPriceStrategies(),
        };
	};
	
	this.getExistingNonTemporaryMasterdataForSurcharges = function (mParameters, oProjectSurcharges) {
        const dMasterdataTimestamp = new Date();
        const sControllingAreaId = getControllingAreaForParameter(mParameters);

        return {
            ACCOUNT_GROUPS: !helpers.isNullOrUndefined(oProjectSurcharges.ACCOUNT_GROUP_ID)? this.helper.getExistingAccountGroups(sControllingAreaId, dMasterdataTimestamp,oProjectSurcharges.ACCOUNT_GROUP_ID) : [],
            MATERIAL_GROUPS: !helpers.isNullOrUndefined(oProjectSurcharges.MATERIAL_GROUP_ID)? this.helper.getExistingMaterialGroups(dMasterdataTimestamp, oProjectSurcharges.MATERIAL_GROUP_ID) : [],
            MATERIAL_TYPES: !helpers.isNullOrUndefined(oProjectSurcharges.MATERIAL_TYPE_ID)? this.helper.getExistingMaterialTypes(dMasterdataTimestamp, oProjectSurcharges.MATERIAL_TYPE_ID) : [],
            PLANTS: !helpers.isNullOrUndefined(oProjectSurcharges.PLANT_ID)? this.helper.getExistingPlants(dMasterdataTimestamp,oProjectSurcharges.PLANT_ID) : [],
            COST_CENTERS: !helpers.isNullOrUndefined(oProjectSurcharges.COST_CENTER_ID)? this.helper.getExistingCostCenter(sControllingAreaId,  dMasterdataTimestamp, oProjectSurcharges.COST_CENTER_ID) : [],
			ACTIVITY_TYPES: !helpers.isNullOrUndefined(oProjectSurcharges.ACTIVITY_TYPE_ID)? this.helper.getExistingActivityTypes(sControllingAreaId,  dMasterdataTimestamp, oProjectSurcharges.ACTIVITY_TYPE_ID) : [],
			MATERIALS: !helpers.isNullOrUndefined(oProjectSurcharges.MATERIAL_ID)? this.helper.getExistingMaterials( dMasterdataTimestamp, oProjectSurcharges.MATERIAL_ID) : []
        };
	};

	/**
	 * Gets the list of users that opened the project.
	 *
	 * @param {string}
	 *            sProjectId - the id of the project that should be checked
	 * @param {string}
	 *            sSessionId - the id of the session that should be checked. It is checked only if bCheckWriteable is defined
	 * @param {bool}
	 *            bCheckWriteable - if true return uses with is_writeable=1, if false return uses with is_writeable=0, if undefined return users with any is_writeable
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {array} ids of users that opened the project
	 */
	this.getOpeningUsers = function(sProjectId, sSessionId, bCheckWriteable) {
		var sWriteableCondition;
		var bCheckSession = false;

		if (bCheckWriteable === undefined) {
			sWriteableCondition = '';
			sSessionId = null;
		} else {
			sWriteableCondition = bCheckWriteable ? 'and is_writeable = 1 and session_id <> ?' : 'and is_writeable = 0 and session_id <> ?';
			bCheckSession = true;
		}

		//TODO: switch from hQuery to dbConnection?
		var oStatement = hQuery.statement([ 'select user_id from  "' + Tables.session + '"',
		                                    ' where session_id in (select session_id from "' + Tables.open_projects + '"',
		                                    ' where project_id = ? ' + sWriteableCondition + ')' ].join(" "));

		var result;
		try {
			if (bCheckSession === true) {
				result = oStatement.execute(sProjectId, sSessionId);
			} else {
				result = oStatement.execute(sProjectId);
			}

		} catch (e) {
			var oMessageDetails = new MessageDetails();
			oMessageDetails.addProjectObjs({
				id : sProjectId
			});
			const sClientMsg = "Error during checking the project for opening users.";
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}, Error: ${e.msg || e.message}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
		}
		
		if(result.length>1 && bCheckSession){
		    const sClientMsg = "Project is opened in write mode by more than one user.";
		    const sServerMsg = `${sClientMsg} Project id: ${sProjectId}.`;
		    $.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg); 
		}
		
		return result;
	};

	/**
	 * Returns if the project is opened by any user (read-only or writeable)
	 *
	 * @param {string}
	 *            sProjectId - the id of the project that should be checked
	 * @param {string}
	 *            sSessionId - the id of the session that should be checked
	 * @param {bool}
	 *            bCheckWriteable - if true then check if project is opened as writeable by any other user, if undefined then writeable status and user do not matter
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {bool} true if open, false if not
	 */
	this.isOpenedInSession = function(sProjectId, sSessionId, bCheckWriteable) {
		var sWriteableCondition;
		if (bCheckWriteable === undefined) {
			sWriteableCondition = '';
		} else {
			sWriteableCondition = bCheckWriteable ? 'and is_writeable = 1' : 'and is_writeable = 0';
		}

		var sStatement = [ 'select count(*) as count from  "' + Tables.open_projects + '"',
		                   ' where project_id = ? and session_id = ? ',
		                   sWriteableCondition].join(" ");

		var result = dbConnection.executeQuery(sStatement, sProjectId, sSessionId);
		var iOpened = parseInt(result[0].COUNT.toString(), 10);

		if(iOpened > 1){
			var oMessageDetails = new MessageDetails();
			oMessageDetails.addProjectObjs({
				id : sProjectId
			});
	
			const sClientMsg = `Error during checking if project is opened: ${iOpened} projects instances are opened by user.`;
			const sServerMsg = `${sClientMsg} Project id: ${sProjectId}, session id: ${sSessionId}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
		}

		return iOpened === 1;
	};


	/**
	 * Deletes one project and associated entities by calling p_project_delete. The check "if the project
	 * and associated entities are closed" is done in business logic.
	 *
	 * @param {string}
	 *            sProjectId - ID of the project to delete
	 * @throws {PlcException} -
	 *             If the execution of the call statement to execute procedure fails.
	 * @returns {integer} - the number of affected rows
	 */
	this.remove = function(sProjectId) {
        try {
            var fnProcedure = dbConnection.loadProcedure(Procedures.project_delete);
            var result = fnProcedure(sProjectId);
            
            return result.affectedRows;
        } catch (e) {
            const sClientMsg = "Error during deleting the project.";
            const sServerMsg = `${sClientMsg} Project id: ${sProjectId}, Error: ${e.message || e.msg}`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

	};


	/**
	 * Updates project properties.
	 *
	 * @param {object}
	 *            oProjectToUpdate - project which has to be updated
	 * @throws {PlcException} -
	 *             If the execution of the update statement would affect more that 1 row. This indicates a corrupted
	 *             query or illegal database state.
	 * @returns {oResultProject} - updated project object
	 */
	this.update = function(oProjectToUpdate) {
		//set last_modifed at and by
		oProjectToUpdate.LAST_MODIFIED_ON = new Date();
		oProjectToUpdate.LAST_MODIFIED_BY = $.getPlcUsername();

		var oSettings = {
				TABLE : Tables.project,
				WHERE_PROPERTIES : {
					PROJECT_ID: oProjectToUpdate.PROJECT_ID
				}
		};
		// Update the entity relation
		if(oProjectToUpdate.TARGET_PATH && oProjectToUpdate.PATH){
			const iParentEntityId = oProjectToUpdate.TARGET_PATH !== "0" ? helpers.getEntityIdFromPath(oProjectToUpdate.TARGET_PATH) : null;
			const iProjectEntityId = helpers.getEntityIdFromPath(oProjectToUpdate.PATH)
			this.helper.updateEntityRelation(iProjectEntityId, iParentEntityId);
		}

		var oCompleteUpdateSet = this.helper.setMissingPropertiesToNull(_.omit(oProjectToUpdate,["TARGET_PATH", "PATH"]), Tables.project, ["CREATED_ON", "CREATED_BY"]);

		// Update project
		var oUpdatedProject = this.helper.updateEntity(oCompleteUpdateSet, oSettings);
		
		return oUpdatedProject;
	};
	
	/**
	 * Creates lifecycle versions for the given project.
	 * @param {string}
	 *            sProjectId - id of the project.
	 * @param {string}
	 *            sUserId - id of the user
	 * @param {bool}
	 *            bOverWriteManualVersions - is a flag, true means that the manual lifecycle versions can be overwritten, false means that the manual lifecycle versions are not to be overwritten
	* @param {string}
	 *            sOneTimeCostItemDescription - Translated text for "Distributed Costs"
	 * @returns an array containing object with the id and the lifecycle_period_from value for all created lifecycle versions
	 */
	this.createLifecycleVersions = function(sProjectId, sUserId, bOverWriteManualVersions, sOneTimeCostItemDescription) {
		let fnCreateLifecycleVersions = dbConnection.loadProcedure(Procedures.create_lifecycle_versions);
		let oResult = fnCreateLifecycleVersions(sProjectId, sUserId, bOverWriteManualVersions, sOneTimeCostItemDescription);
		var aCreatedLifecycleVersions = oResult.OT_CREATED_LIFECYCLE_VERSIONS;
		return aCreatedLifecycleVersions;
	};
	
	/**
	 * Check whether the one time costs with manual distribution match the exact amount from the one time cost per project/product
	 * @param {string}
	 * 		sProjectId - id of the project
	 * @returns true/false
	 */
	this.checkManualOneTimeCosts = function(sProjectId){
		let fnCheckManualOneTimeCosts = dbConnection.loadProcedure(Procedures.check_manual_one_time_costs);
		var result = fnCheckManualOneTimeCosts(sProjectId);
		return result.OV_IS_VALID === 0 
	}

	/**
	 * Verifies if one or more users have a manual or lifecycle version opened from the given project.
	 * @param {string}
	 *            sProjectId - id of the project.
	 * @returns objects with the id of the lifecycle version, name of the version and the user that has the version opened
	 */
	this.getOpenedLifecycleVersions = (sProjectId) => {
		let stmt = `select versions.CALCULATION_VERSION_ID,
		                   versions.CALCULATION_VERSION_NAME, 
 	                       open_calc.SESSION_ID
 	                    from "sap.plc.db::basis.t_calculation" calculation
                        inner join "sap.plc.db::basis.t_calculation_version" versions
 		                    on versions.CALCULATION_ID = calculation.CALCULATION_ID and 
					           (versions.CALCULATION_VERSION_type = ? or versions.CALCULATION_VERSION_type = ? )
                        inner join "sap.plc.db::basis.t_open_calculation_versions" open_calc
                            on open_calc.CALCULATION_VERSION_ID = versions.CALCULATION_VERSION_ID and context = ? and IS_WRITEABLE = '1'
            	        where calculation.project_id = ?;	  
	         	    `;  
  		let aLockedLifecycleVersions = dbConnection.executeQuery(stmt, Constants.CalculationVersionType.Lifecycle, Constants.CalculationVersionType.ManualLifecycleVersion, Constants.CalculationVersionLockContext.CALCULATION_VERSION, sProjectId)  
		return aLockedLifecycleVersions;
	};


	this.getReferencedVersions = (sProjectId) => {
		let stmt = `SELECT DISTINCT
							calculation.calculation_id,
							lifecycleConfiguration.calculation_version_id AS base_calculation_version_id,
							calculationVersion.calculation_version_id AS calculation_version_id,
							calculationVersion.CALCULATION_VERSION_NAME
					FROM 
						"sap.plc.db::basis.t_item" AS item
						INNER JOIN
						"sap.plc.db::basis.t_calculation_version" AS calculationVersion
						ON item.REFERENCED_CALCULATION_VERSION_ID = calculationVersion.calculation_version_id
						INNER JOIN
						"sap.plc.db::basis.t_project_lifecycle_configuration" AS lifecycleConfiguration
						ON calculationVersion.base_version_id = lifecycleConfiguration.calculation_version_id
							AND (calculationVersion.calculation_version_type IN (2, 16))
						INNER JOIN
						"sap.plc.db::basis.t_calculation" AS calculation
						ON lifecycleConfiguration.calculation_id = calculation.calculation_id
							AND (calculation.project_id ='${sProjectId}')
					WHERE (calculationVersion.lifecycle_period_from NOT IN (SELECT lifecycle_period_from
					FROM "sap.plc.db::basis.t_project_lifecycle_period_quantity_value"
					WHERE ((project_id ='${sProjectId}')
						AND calculation_id = calculation.calculation_id)));`;
  		let aReferencedVersions = dbConnection.executeQuery(stmt)
		return aReferencedVersions;
	};

	/**
	 *  Executes the calculation engine and save the (re-)calculated results for lifecycle versions in the project. The base version of the affected lifecycle version 
	 *  must be currently definded in t_project_lifecycle_configuration. If the base version is not defined in this table, lifecycle versions are not re-calculated (this happens
	 *  if the lifecycle definition in t_project_lifecycle_configuration changed after creating lifecycle versions).
	 * 
	 *  If a lifecycle version already has calculation results (can happen if the defined lifecycle quantities changed), calling this function will override the existing 
	 * 	ones.
	 * 
	 * @param  {string} sProjectId Id of the project containing the lifecycle versions, for which the calculation engine shall be executed.
	 * @param  {bool}   bOverWriteManualVersions is a flag, true means that the manual lifecycle versions can be overwritten, false means that the manual lifecycle versions are not to be overwritten
	 */	 
	this.calculteLifecycleVersions = function(sProjectId, bOverWriteManualVersions) {
		let fnCalculateLifecycleVersions = dbConnection.loadProcedure(Procedures.calculate_lifecycle_versions);
		fnCalculateLifecycleVersions(sProjectId, bOverWriteManualVersions);
	};

	this.recalculateOneTimeCostForProject = function(sProjectId) {
		let fnRecalculateOneTimeCosts  = dbConnection.loadProcedure(Procedures.project_calculate_one_time_costs);
		fnRecalculateOneTimeCosts(sProjectId);
	}

	this.updateCostNotDistributedForOneTimeProjectCostWhenCalculationGetsDeleted = function(sProjectId, iCalculationId){
		
		const sUpdateCostNotDistributedForProject = `
			UPDATE otpc
			SET otpc.COST_NOT_DISTRIBUTED = otpc.COST_NOT_DISTRIBUTED + product.COST_TO_DISTRIBUTE 
			FROM "${Tables.project_one_time_cost}" otpc
			INNER JOIN "${Tables.product_one_time_cost}" product
				ON otpc.ONE_TIME_COST_ID = product.ONE_TIME_COST_ID
				AND product.CALCULATION_ID = ?
			WHERE otpc.project_id = ?
		`;

		dbConnection.executeUpdate(sUpdateCostNotDistributedForProject,iCalculationId,sProjectId);
	}

	/**
	 * Function that deletes the one time product cost and values when a calculation is moved to another project
	 * @param {string} sProjectId Id of the project for which we should delete the one time costs associated with the calculation id 
	 * @param {integer} iCalculationId 
	 */
	this.deleteOneTimeCostRelatedDataForProjectIdAndCalculationId = function(sProjectId, iCalculationId){
		
		const sDeleteProjectLifecycleConfig = `
			delete from "${Tables.project_lifecycle_configuration}" 
			where calculation_id = ? and project_id = ?
		`;

		const sHeader = `DELETE FROM "`;
		const sDeleteProductsAndValues = `" 
			WHERE CALCULATION_ID = ?
			AND ONE_TIME_COST_ID IN 
				(SELECT ONE_TIME_COST_ID 
				 FROM "${Tables.project_one_time_cost}"
				 WHERE PROJECT_ID = ?
				)
		`; 
		const sDeleteLifecyclePeriodQuantity = `
			DELETE FROM "${Tables.lifecycle_period_value}"
			WHERE CALCULATION_ID = ? AND PROJECT_ID = ?
		`;
		
		dbConnection.executeUpdate(sDeleteProjectLifecycleConfig, iCalculationId, sProjectId);
		dbConnection.executeUpdate(sHeader + Tables.product_one_time_cost + sDeleteProductsAndValues, iCalculationId, sProjectId);
		dbConnection.executeUpdate(sHeader + Tables.project_one_time_cost_lifecycle_value + sDeleteProductsAndValues, iCalculationId, sProjectId);
		dbConnection.executeUpdate(sDeleteLifecyclePeriodQuantity, iCalculationId, sProjectId);
	}
	
	/**
	 * Function to read all data of a project, that needs to be set as default for the calculation.
	 * @param {string}
	 *            sProjectId - id of the project.
	 * @returns {object} - an object containing ids of frozen versions or null
	 */
	this.getProjectProperties = function(sProjectId) {

		var result = hQuery.statement('select PROJECT_ID, BUSINESS_AREA_ID, COMPANY_CODE_ID, COSTING_SHEET_ID, CONTROLLING_AREA_ID, COMPONENT_SPLIT_ID, CUSTOMER_ID, '
				+ 'REPORT_CURRENCY_ID, SALES_PRICE_CURRENCY_ID, SALES_DOCUMENT, PLANT_ID, PROFIT_CENTER_ID, START_OF_PROJECT, END_OF_PROJECT, START_OF_PRODUCTION, '
				+ 'END_OF_PRODUCTION, VALUATION_DATE, LIFECYCLE_VALUATION_DATE, LIFECYCLE_PERIOD_INTERVAL, EXCHANGE_RATE_TYPE_ID, MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID from "' + Tables.project + '" where project_id = ?').execute(sProjectId);
		return result[0] || null;
	};

	/**
	 * Function to get ids of all frozen calculation versions of a project
	 * @param {string}
	 *            sProjectId - id of the project
	 * @returns {object} oFrozenCalculationVersions - an enumeration of frozen calculation version ids
	 */
	this.getFrozenVersions = function(sProjectId) {
    	var sStatement = [ 'select calcVersion.calculation_version_id from  "' + Tables.calculation_version + '" as calcVersion',
    		                   ' inner join "' + Tables.calculation + '" as calc',
    		                      ' on calcVersion.calculation_id = calc.calculation_id',
    		                   ' where calc.project_id = ? and calcVersion.is_frozen = 1'
    		             ].join(" ");
		return dbConnection.executeQuery(sStatement, sProjectId);

	};

	/**
	 * Gets all versions that are source versions and have master versions in a different project.
	 *
	 * @param {integer}
	 *            iProjectId - the id of the project
	 * @throws {PlcException} -
	 *             If the execution of the select statement fails.
	 * @returns @returns {array} - list of calculation versions that are source versions and have master versions in different project
	 */
	this.getSourceVersionsWithMasterVersionsFromDifferentProjects = function(sProjectId) {

		try {
			//select all the source versions from the project
			//search for master versions for the selected source versions that are in different projects
			var oStatement = hQuery.statement(
			        `select distinct calcVers.CALCULATION_VERSION_ID, calcVers.CALCULATION_ID, calcVers.CALCULATION_VERSION_NAME 
			            from "${Tables.calculation_version}" calcVers 
			            inner join 
			                (select REFERENCED_CALCULATION_VERSION_ID, CALCULATION_VERSION_ID from "${Tables.item}"
					         union 
					         select REFERENCED_CALCULATION_VERSION_ID, CALCULATION_VERSION_ID from "${Tables.item_temporary}"
					         ) item 
					         on item.REFERENCED_CALCULATION_VERSION_ID = calcVers.CALCULATION_VERSION_ID 
					    inner join "${Tables.calculation}" calc 
					        on calc.CALCULATION_ID = calcVers.CALCULATION_ID and calc.PROJECT_ID = ? 
					    inner join "${Tables.calculation_version}" calcVers1 
					        on item.CALCULATION_VERSION_ID = calcVers1.CALCULATION_VERSION_ID 
					    inner join "${Tables.calculation}" calc1 
					        on calc1.CALCULATION_ID = calcVers1.CALCULATION_ID and calc1.PROJECT_ID != ?`);
        	var aCalculationVersions = oStatement.execute(sProjectId, sProjectId);

		} catch (e) {
			const sClientMsg = "Error during the selection of source versions that have master versions in a different project.";
			const sServerMsg = `${sClientMsg} Project id: {sProjectId}.`;
			$.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
		}

		return aCalculationVersions;
	};
	
	
	/**
	 * Returns true if any lifecycle calculation (in all users) is running for the project.
	 *
	 * @param {string}
	 *            iProjectId - the id of the project
	 * @throws {PlcException} -
	 *             If the execution of the select statement fails.
	 * @returns {bool} - true if lifecycle calculation is running for the project
	 */
	this.isLifecycleCalculationRunningForProject = function(sProjectId) {
		let sParameters = JSON.stringify( {
			PROJECT_ID : sProjectId
		});
		let sStmt = `select count(*) as rowcount
						from "${Tables.task}" 
						where 
							task_type = 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS'
							and (status = 'inactive' or status = 'active')
							and parameters = ?         -- the parameters indicate the given project
					`;
		
		let oResult = dbConnection.executeQuery(sStmt, sParameters);

		return parseInt(oResult[0].ROWCOUNT, 10) > 0;
	};	
	
	/**
	 * Create new total quantities and associated values for a project. 
	 *
	 * @param {array}
	 *			aTotalQuantities - the array with the total quantities per calculation for each lifecycle period from request
	 * @returns {array} 
	 *			oResultSet - created total quantities with generated values
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
	this.createTotalQuantities = function(aTotalQuantities, sProjectId) {

		var aTQValues = [];
		var aCalculationIds = [];
		_.each(aTotalQuantities, oTotalQuantity => {
			var aQuantityValues = [];
			aQuantityValues.push(sProjectId);
			aQuantityValues.push(oTotalQuantity.CALCULATION_ID);
			aQuantityValues.push(oTotalQuantity.CALCULATION_VERSION_ID || null);
			aQuantityValues.push(oTotalQuantity.MATERIAL_PRICE_SURCHARGE_STRATEGY || Constants.ProjectSurchargeStrategies.NoSurcharges);
			aQuantityValues.push(oTotalQuantity.ACTIVITY_PRICE_SURCHARGE_STRATEGY || Constants.ProjectSurchargeStrategies.NoSurcharges);
			aTQValues.push(aQuantityValues);
			aCalculationIds.push(oTotalQuantity.CALCULATION_ID);
		});

		var sTotalQuantityStmt = `insert into "${Tables.project_lifecycle_configuration}"
			( PROJECT_ID, CALCULATION_ID, CALCULATION_VERSION_ID, MATERIAL_PRICE_SURCHARGE_STRATEGY, ACTIVITY_PRICE_SURCHARGE_STRATEGY, LAST_MODIFIED_ON, LAST_MODIFIED_BY )
			values (?, ?, ?, ?, ?, current_utctimestamp, '${$.getPlcUsername()}' )
		`;
		dbConnection.executeUpdate(sTotalQuantityStmt, aTQValues);

		var sRuleIdStmt = `select project_id, calculation_id from "${Tables.project_lifecycle_configuration}" where ${_.map(aCalculationIds, iId => "calculation_id = ?").join(" or ")}`;
		aCalculationIds.unshift(sRuleIdStmt);
		// The .executeQuery() does not support directly passing an array with values.
		// Instead we need to pass an array of arguments with .apply().
		// The first argument from the array needs to be the query string.
		var aRuleIdResult = dbConnection.executeQuery.apply(dbConnection, aCalculationIds);

		var aLifecycleValues = [];
		_.each(aTotalQuantities, oTotalQuantity => {
			_.each(oTotalQuantity.PERIOD_VALUES, oPeriod => {
				var aValues = [];
				aValues.push(oPeriod.LIFECYCLE_PERIOD_FROM);
				aValues.push(oPeriod.VALUE);
				aValues.push(sProjectId);
				aValues.push(oTotalQuantity.CALCULATION_ID);// that's the rule_id for the calculation
				aLifecycleValues.push(aValues);
			});
		});
		if (aLifecycleValues.length > 0) {
			var sLifecycleStmt = `insert into "${Tables.lifecycle_period_value}" (LIFECYCLE_PERIOD_FROM, VALUE, PROJECT_ID, CALCULATION_ID, LAST_MODIFIED_ON, LAST_MODIFIED_BY) values ( ?, ?, ?, ?, current_utctimestamp, '${$.getPlcUsername()}')`;
			dbConnection.executeUpdate(sLifecycleStmt, aLifecycleValues);
		}

		return aTotalQuantities;
	};
	
	/**
	 * Create new surcharge definitions and values for a project. 
	 *
	 * @param {String}
	 * 			sProjectId - id of the project for which the surcharges are created
	 * @param {array}
	 *			aSurchargeDefinitions - the array with the surcharge definitions and values for each lifecycle period
	 * @returns {array} 
	 *			oResultSet - created surcharge definitions with values
	 * @returns {string} 
	 *			sBusinessObjectType - business object for which the surcharges will be created, e.g. ProjectActivityPriceSurcharges
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
	this.createSurcharges = function(sProjectId, aSurchargeDefinitions, sBusinessObjectType) {		
		var aDefinitionProperties;
		var sSurchargeDefinitionTable;
		var sSurchargeValueTable;
		
		if(aSurchargeDefinitions.length == 0){
			return aSurchargeDefinitions;
		}
		
		switch (sBusinessObjectType) {
			case BusinessObjectTypes.ProjectActivityPriceSurcharges:
				aDefinitionProperties = ["PLANT_ID", "ACCOUNT_GROUP_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID"];
				sSurchargeDefinitionTable = Tables.project_activity_price_surcharges;
				sSurchargeValueTable = Tables.project_activity_price_surcharge_values;
				break;
			case BusinessObjectTypes.ProjectMaterialPriceSurcharges:
				aDefinitionProperties = ["PLANT_ID", "ACCOUNT_GROUP_ID", "MATERIAL_GROUP_ID", "MATERIAL_TYPE_ID", "MATERIAL_ID"];
				sSurchargeDefinitionTable = Tables.project_material_price_surcharges;
				sSurchargeValueTable = Tables.project_material_price_surcharge_values;
				break;			
			default: {
				const sLogMessage = `The business object type '${sBusinessObjectType}' is not supported by createSurcharges`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		var aDefinitionEntries = [];
		var aValueEntries = [];
		_.each(aSurchargeDefinitions, oSurchargeDefinition => {
			// Create array with definitions
			var aDefinitionEntryValues = [];
			var iRuleId = this.helper.getNextSequenceID(Sequences.rule_id);
			aDefinitionEntryValues.push(iRuleId);
			_.each(aDefinitionProperties, sDefinitionProperty => {
					aDefinitionEntryValues.push(oSurchargeDefinition[sDefinitionProperty]);
				});
			aDefinitionEntries.push(aDefinitionEntryValues);	

			// Create array with values
			_.each(oSurchargeDefinition.PERIOD_VALUES, oValue => {
				let aValues = [];
				aValues.push(oValue.LIFECYCLE_PERIOD_FROM);
				aValues.push(oValue.VALUE);
				aValues.push(iRuleId);
				aValueEntries.push(aValues);
			});
		});
		
		// Create definitions in db
		let sDefinitionStmt = `insert into "${sSurchargeDefinitionTable}" 
					( RULE_ID, ${aDefinitionProperties.join(", ")}, PROJECT_ID )
			values  ( ?, ${_.map(aDefinitionProperties, iId => "?").join(", ")}, '${sProjectId}' )
		`;
		dbConnection.executeUpdate(sDefinitionStmt, aDefinitionEntries);
		
		// Create value in db
		if (aValueEntries.length > 0) {
			let sValueStmt = `insert into "${sSurchargeValueTable}" (LIFECYCLE_PERIOD_FROM, VALUE, RULE_ID) values ( ?, ?, ? )`;
			dbConnection.executeUpdate(sValueStmt, aValueEntries);
		}

		return aSurchargeDefinitions;
	};	
	
	/**
	 * Creates yearly lifecycle periods types for the project and add the required information to `t_project_monthly_lifecycle_period` table
	 * @param {string}
	 * 		sProjectId : The id of the project
	 * @param {number}
	 * 		iLowestValidPeriodFrom : The lowest value for lifecycle_period_from.
	 * @param {number}
	 * 		iHighestValidPeriodFrom : The hightest value for lifecycle_period_from.
	 * @returns {void}
	 */
	this.createYearlyLifecyclePeriodTypesForProject = function(sProjectId, iLowestValidPeriodFrom, iHighestValidPeriodFrom) {
		let sStmt = `insert into "${Tables.project_lifecycle_period_type}" (PROJECT_ID, YEAR, PERIOD_TYPE, IS_YEAR_SELECTED, LAST_MODIFIED_ON, LAST_MODIFIED_BY) values ('${sProjectId}', ?, 'YEARLY', 1, current_utctimestamp, '${$.getPlcUsername()}');`;
		/**
		 * For `SELECTED_MONTH` will insert `1` (January) no matter what is the month of the start date to simulate 
		 * the behavior before Monthly Lifecycle Feature.
		 */
		let sStmtForMonthlyPeriods = `insert into "${Tables.project_monthly_periods}" (PROJECT_ID, YEAR, SELECTED_MONTH, MONTH_DESCRIPTION, LAST_MODIFIED_ON, LAST_MODIFIED_BY) values ('${sProjectId}', ?, 1, '01', current_utctimestamp, '${$.getPlcUsername()}');`;
		let aYearsToBeInserted = _.range(iLowestValidPeriodFrom, iHighestValidPeriodFrom + 1);
		aYearsToBeInserted.forEach(iYear => {
			dbConnection.executeUpdate(sStmt, iYear);
			dbConnection.executeUpdate(sStmtForMonthlyPeriods, iYear);
		});
	};

	/**
	 * Add lifecycle periods of type `monthly` or `quarterly` when the start/end date of the project changes.
	 * 
	 * @param sProjectId - id of the project
	 * @param sPeriodType - period type of the year to be updated
	 * @param iFrom - start value of the new interval
	 * @param iTo - end value of the new interval
	 * @param bTriggeredForStarDate - `true` if the function is called to change the periods before the old start date,
	 * 								  `false` if the function is called to change the periods after the old end date
	 * Note: We need the `bTriggeredForStarDate` variable in order to do some subtractions or additions to the interval
	 * 	values. For example in case we update the periods before the start date we need to substract one to not override
	 *  the old values and when we update the periods after the end we need add one for the same reason.
	 */
	this.createMonthlyAndQuarterlyPeriods = function(sProjectId, sPeriodType, iFrom, iTo, bTriggeredForStarDate) {
		let iYearDb = bTriggeredForStarDate === true ? Math.trunc(iFrom / 12 + 1900) : Math.trunc(iTo  / 12 + 1900);
		let sInsertPeriodsStmt = `insert into "${Tables.project_monthly_periods}" (PROJECT_ID, YEAR, SELECTED_MONTH, MONTH_DESCRIPTION, LAST_MODIFIED_ON, LAST_MODIFIED_BY) values ('${sProjectId}', ?, ?, ?, current_utctimestamp, '${$.getPlcUsername()}');`;
		if (sPeriodType === 'MONTHLY') {
			// For March 2020 we have 1442 => 1442 % 12 + 1 = 3.
			let iRangeStartValue = bTriggeredForStarDate === true ? iFrom % 12 + 1 : iFrom % 12 + 2;
			let iRangeStopValue = bTriggeredForStarDate === true ? (iTo % 12 + 1) : (iTo % 12 + 1) + 1;
			let aMonthsToBeInserted = _.range(iRangeStartValue, iRangeStopValue);
			let aValues = _.map(aMonthsToBeInserted, function(iMonth) { return [iYearDb, iMonth, (iMonth < 10 ? '0' + iMonth : iMonth)]; });
			dbConnection.executeUpdate(sInsertPeriodsStmt, aValues);
		}
		if (sPeriodType === 'QUARTERLY') {
			/**
			 * For March we have Q1 (month 1st) => (3 + 2)/3 = 1 == first quarter
			 * For May we have Q2 (month 4th) => (5 + 2)/3 = 2 == second quarter
			 * For August we have Q3 (month 7th) => (8 + 2)/3 = 3 == third quarter
			 * For November we have Q4 (month 10th) => (11 + 2)/3 = 4 == fourth quarter
			 * To find the start month we can use the formula 3n-2, where n is the quarter.
			 * */
			let iRequestMonth = iFrom % 12 + 1;
			let iDbMonth = iTo % 12 + 1;
			let iFromQuarter = bTriggeredForStarDate === true ? Math.trunc((iRequestMonth + 2)/3) : Math.trunc((iRequestMonth + 2)/3 + 1);
			let iToQuarter = bTriggeredForStarDate === true ? Math.trunc((iDbMonth + 2)/3 - 1) : Math.trunc((iDbMonth + 2)/3);
			let aMonthsToBeInserted = _.range(3 * iFromQuarter - 2, 3 * iToQuarter - 2 + 1, 3);
			let aValues = _.map(aMonthsToBeInserted, function(iMonth) { return [iYearDb, iMonth, 'Q'+ Math.trunc((iMonth+2)/3)]; });
			dbConnection.executeUpdate(sInsertPeriodsStmt, aValues);
		}
	}

	/**
	 * Add lifecycle yearly period type only for the upper and lower limit.
	 *
	 * @param {string}
	 * 		oProject : The object containing project properties
	 * @param {number}
	 * 		iLowestValidPeriodFrom : The lowest value for lifecycle_period_from.
	 * @param {number}
	 * 		iHighestValidPeriodFrom : The hightest value for lifecycle_period_from.
	 * @param {number}
	 * 		iDbLowestPeriod : The lowest value for lifecycle_period_from from database.
	 * @param {number}
	 * 		iDbHighestPeriod : The hightest value for lifecycle_period_from from database.
	 * @returns {void}
	 */
	this.addLifecyclePeriodTypeForProject = function(oProject, iLowestValidPeriodFrom, iHighestValidPeriodFrom, iDbLowestPeriod, iDbHighestPeriod) {
		let iLowestYearDb = Math.trunc(iDbLowestPeriod / 12 + 1900);
		let iHighestYearDb = Math.trunc(iDbHighestPeriod / 12 + 1900);

		// check for changes in the year of the start/end date of the project
		if (oProject.START_OF_PROJECT.getFullYear() < iLowestYearDb) {
			// We substract 1 from iYearDb because `createYearlyLifecyclePeriodTypesForProject` add 1 to the upper limit
			// in order to generate the whole intervale, but because the upper limit already exists we need to substract 1.
			let sPeriodType = dbConnection.executeQuery(`select upper(period_type) as PERIOD_TYPE from "${Tables.project_lifecycle_period_type}" where project_id = ? and year = ?;`, oProject.PROJECT_ID, iLowestYearDb)[0].PERIOD_TYPE;
			if (sPeriodType === 'QUARTERLY' || sPeriodType === 'MONTHLY') {
				this.createMonthlyAndQuarterlyPeriods(oProject.PROJECT_ID, sPeriodType, (iLowestYearDb-1900)*12, iDbLowestPeriod, true);
			}
			this.createYearlyLifecyclePeriodTypesForProject(oProject.PROJECT_ID, oProject.START_OF_PROJECT.getFullYear(), iLowestYearDb - 1);
		}
		if (oProject.END_OF_PROJECT.getFullYear() > iHighestYearDb) {
			let sPeriodType = dbConnection.executeQuery(`select upper(period_type) as PERIOD_TYPE from "${Tables.project_lifecycle_period_type}" where project_id = ? and year = ?;`, oProject.PROJECT_ID, iHighestYearDb)[0].PERIOD_TYPE;
			if (sPeriodType === 'QUARTERLY' || sPeriodType === 'MONTHLY') {
				this.createMonthlyAndQuarterlyPeriods(oProject.PROJECT_ID, sPeriodType, iDbHighestPeriod, (iHighestYearDb-1900)*12 + 11, false);
			}
			this.createYearlyLifecyclePeriodTypesForProject(oProject.PROJECT_ID, oProject.END_OF_PROJECT.getFullYear(), iHighestYearDb - 1);
		}

		// check for changes in the month of the start/end date of the project when the year remains the same
		if (oProject.START_OF_PROJECT.getFullYear() === iLowestYearDb && iLowestValidPeriodFrom < iDbLowestPeriod) {
			let sPeriodType = dbConnection.executeQuery(`select upper(period_type) as PERIOD_TYPE from "${Tables.project_lifecycle_period_type}" where project_id = ? and year = ?;`, oProject.PROJECT_ID, iLowestYearDb)[0].PERIOD_TYPE;
			this.createMonthlyAndQuarterlyPeriods(oProject.PROJECT_ID, sPeriodType, iLowestValidPeriodFrom, iDbLowestPeriod, true);
		}
		if (oProject.END_OF_PROJECT.getFullYear() === iHighestYearDb && iHighestValidPeriodFrom > iDbHighestPeriod) {
			let sPeriodType = dbConnection.executeQuery(`select upper(period_type) as PERIOD_TYPE from "${Tables.project_lifecycle_period_type}" where project_id = ? and year = ?;`, oProject.PROJECT_ID, iHighestYearDb)[0].PERIOD_TYPE;
			this.createMonthlyAndQuarterlyPeriods(oProject.PROJECT_ID, sPeriodType, iDbHighestPeriod, iHighestValidPeriodFrom, false);
		}
	}

	/**
	 * Delete all related data to a project lifecycle periods: quantities, periods, periods type, material and activity surcharges
	 * @param {string} - sProjectId: The id of the project
	 * @returns {void}
	 */
	this.deleteAllLifecyclePeriodsForProject = function(sProjectId) {
		let aActivityPriceSurchargesStmt = `
			delete 
			from "${Tables.project_activity_price_surcharge_values}"
			where (rule_id, lifecycle_period_from) in
		        (
		            select  period_values.rule_id,												-- since delete does not support join directly
		                    period_values.lifecycle_period_from									-- it need to be done in a sub-select
		            from "${Tables.project_activity_price_surcharge_values}" as period_values
		                inner join "${Tables.project_activity_price_surcharges}" as surcharges
				            on period_values.rule_id = surcharges.rule_id
			            inner join "${Views.project_with_privileges}" as auth
				            on surcharges.project_id = auth.project_id
		            where	auth.project_id = ? and auth.user_id = ?
				);`;
		
		let aMaterialPriceSurchargesStmt = `
			delete 
			from "${Tables.project_material_price_surcharge_values}"
			where (rule_id, lifecycle_period_from) in
		        (
		            select  period_values.rule_id,												-- since delete does not support join directly
		                    period_values.lifecycle_period_from									-- it need to be done in a sub-select
		            from "${Tables.project_material_price_surcharge_values}" as period_values
		                inner join "${Tables.project_material_price_surcharges}" as surcharges
				            on period_values.rule_id = surcharges.rule_id
			            inner join "${Views.project_with_privileges}" as auth
				            on surcharges.project_id = auth.project_id
		            where	auth.project_id = ? and auth.user_id = ?
				);`;
			let aStmtDeleteLifecyclePeriodTypeStmt = `
				delete
				from "${Tables.project_lifecycle_period_type}"
				where (project_id, year) in (
					select periods.project_id, periods.year
					from "${Tables.project_lifecycle_period_type}" as periods
					inner join "${Views.project_with_privileges}" as auth
						on periods.project_id = auth.project_id
					where auth.project_id = ? and auth.user_id = ?
				);`;
			let aStmtDeleteMonthlyLifecyclePeriodStmt = `
				delete 
				from "${Tables.lifecycle_monthly_period}"
				where (project_id, year, selected_month) in (
					select periods.project_id, periods.year, periods.selected_month
					from "${Tables.lifecycle_monthly_period}" as periods
					inner join "${Views.project_with_privileges}" as auth
						on periods.project_id = auth.project_id
					where auth.project_id = ? and auth.user_id = ?
				);`;
			let aQuantitiesStmt = `
				delete 
				from "${Tables.lifecycle_period_value}"
				where (project_id, calculation_id, lifecycle_period_from) in
					(
						select  period_values.project_id,
								period_values.calculation_id,										-- since delete does not support join directly
								period_values.lifecycle_period_from									-- it need to be done in a sub-select
						from "${Tables.lifecycle_period_value}" as period_values
							inner join "${Views.project_with_privileges}" as auth
								on auth.project_id = period_values.project_id
						where	auth.project_id = ? and auth.user_id = ?
					);`;
			let aValuesToDeleteAll = [sProjectId, $.getPlcUsername()];
			dbConnection.executeUpdate(aQuantitiesStmt, [aValuesToDeleteAll]);
			dbConnection.executeUpdate(aStmtDeleteMonthlyLifecyclePeriodStmt, [aValuesToDeleteAll]);
			dbConnection.executeUpdate(aStmtDeleteLifecyclePeriodTypeStmt, [aValuesToDeleteAll]);
			dbConnection.executeUpdate(aMaterialPriceSurchargesStmt, [aValuesToDeleteAll]);
			dbConnection.executeUpdate(aActivityPriceSurchargesStmt, [aValuesToDeleteAll]);
	};

	/**
	 * Delete monthly period entries and period types
	 * @param {string} 	- sProjectId: Id of the project
	 * @param {date} 	- dStartDate: Start of project
	 * @param {date}	- dEndDate: End of project
	 * @returns {void}
	 */
	this.deleteLifecyclePeriodsData = function(sProjectId, dStartDate, dEndDate) {
		let aStmtDeleteLifecyclePeriodTypeStmt = `
			delete
			from "${Tables.project_lifecycle_period_type}"
			where (project_id, year) in(
				select periods.project_id, periods.year
				from "${Tables.project_lifecycle_period_type}" as periods
				inner join "${Views.project_with_privileges}" as auth
					on periods.project_id = auth.project_id
				where auth.project_id = ? and auth.user_id = ?
				and (periods.year < ? or periods.year > ?)
			);`;

		let aStmtDeleteMonthlyLifecyclePeriodStmt = `
			delete 
			from "${Tables.lifecycle_monthly_period}"
			where (project_id, year, selected_month) in (
				select periods.project_id, periods.year, periods.selected_month
				from "${Tables.lifecycle_monthly_period}" as periods
				inner join "${Views.project_with_privileges}" as auth
					on periods.project_id = auth.project_id
				inner join "${Tables.project_lifecycle_period_type}" as types
					on periods.project_id = types.project_id
					and periods.year = types.year
				where auth.project_id = ? and auth.user_id = ? and upper(types.period_type) = ? 
				and (
					((periods.year = ? and periods.selected_month < ?) or periods.year < ?)
					or 
					((periods.year = ? and periods.selected_month > ?) or periods.year > ?)
				)
			);`;
		
		/** If we need to delete entries from `t_project_monthly_lifecycle_period` table of type QUARTER
		 *  we need to find the quarter in which the new date resides and delete all the entries below that date.
		 *  To calculate this quarter we substract the modulo 3 from the month and add 1 (month no. 0-11 in JavaScript => 1-12 in PLC)
		 *  E.g. for September (8 in JS, 9 in PLC) we'll have 8 - 8 mod 3 + 1 = 7 (July - Q3)
		 *  Q1: 01-03        Q2: 04-06        Q3: 07-09        Q4: 10-12
		 */
		let iLowerMonthFirstQuarter = dStartDate.getMonth() - dStartDate.getMonth() % 3 + 1;
		
		let aPeriodValues = [sProjectId, $.getPlcUsername()];
		let aPeriodValuesForMonthlyEntries = [sProjectId, $.getPlcUsername(), 'CUSTOM'];
		let aPeriodValuesForCustomEntries = [sProjectId, $.getPlcUsername(), 'MONTHLY'];
		let aPeriodValuesForQuarterlyEntries = [sProjectId, $.getPlcUsername(), 'QUARTERLY'];
		let aPeriodValuesForYearlyEntries = [sProjectId, $.getPlcUsername(), 'YEARLY'];
		let aValues = [];

		// New start date
		aPeriodValues.push(dStartDate.getFullYear());
		aValues.push(dStartDate.getFullYear(), dStartDate.getMonth() + 1, dStartDate.getFullYear());
		aPeriodValuesForQuarterlyEntries.push(dStartDate.getFullYear(), iLowerMonthFirstQuarter, dStartDate.getFullYear());
		aPeriodValuesForYearlyEntries.push(dStartDate.getFullYear(), 1, dStartDate.getFullYear());

		// New end date
		aPeriodValues.push(dEndDate.getFullYear());
		aValues.push(dEndDate.getFullYear(), dEndDate.getMonth() + 1, dEndDate.getFullYear());
		aPeriodValuesForQuarterlyEntries.push(dEndDate.getFullYear(), dEndDate.getMonth() + 1, dEndDate.getFullYear());
		aPeriodValuesForYearlyEntries.push(dEndDate.getFullYear(), 1, dEndDate.getFullYear());

		aPeriodValuesForMonthlyEntries = aPeriodValuesForMonthlyEntries.concat(aValues);
		aPeriodValuesForCustomEntries = aPeriodValuesForCustomEntries.concat(aValues);

		// Delete lifecycle periods from `t_project_monthly_lifecycle_period`
		dbConnection.executeUpdate(aStmtDeleteMonthlyLifecyclePeriodStmt, [aPeriodValuesForMonthlyEntries, aPeriodValuesForCustomEntries, aPeriodValuesForQuarterlyEntries, aPeriodValuesForYearlyEntries]);
		// Delete lifecucle period types from `t_project_lifecycle_period_type`
		dbConnection.executeUpdate(aStmtDeleteLifecyclePeriodTypeStmt, [aPeriodValues]);
	};

	/**
	 * Delete monthly period entries and period types
	 * @param {string} 	- sProjectId: Id of the project
	 * @returns {void}
	 * Note: this function can be called only after `deleteLifecyclePeriodsData` was called
	 */
	this.deleteLifecycleQuantitiesData = function(sProjectId) {
		let aQuantitiesStmt = `
			delete 
			from "${Tables.lifecycle_period_value}"
			where (project_id, calculation_id, lifecycle_period_from) not in
				(
					select  period_values.project_id,
							period_values.calculation_id,										-- since delete does not support join directly
							period_values.lifecycle_period_from									-- it need to be done in a sub-select
					from "${Tables.lifecycle_period_value}" as period_values
						inner join "${Tables.lifecycle_monthly_period}" as periods
							on period_values.project_id = periods.project_id
							and to_integer(period_values.lifecycle_period_from / 12 + 1900) = periods.year
							and mod(period_values.lifecycle_period_from, 12) + 1 = periods.selected_month
						inner join "${Views.project_with_privileges}" as auth
							on auth.project_id = periods.project_id
					where	auth.project_id = ?
							and auth.user_id = ?
				)
			and project_id = ?;`;
		let aValues = [sProjectId, $.getPlcUsername(), sProjectId];
		dbConnection.executeUpdate(aQuantitiesStmt, [aValues]);
	};

	/**
	 * Delete monthly period entries and period types
	 * @param {string} 	- sProjectId: Id of the project
	 * @returns {void}
	 * Note: this function can be called only after `deleteLifecyclePeriodsData` was called
	 */
	this.deleteLifecycleOneTimeCostData = function(sProjectId) {
		// Delete the values for onetime cost for outdated start/end of project
		let aOneTimeCostDeleteStmt = `
			delete 
			from "${Tables.project_one_time_cost_lifecycle_value}"
			where (one_time_cost_id, calculation_id, lifecycle_period_from) not in
				(
					select  onetimecost.one_time_cost_id,
							onetimecost.calculation_id,										    -- since delete does not support join directly
							onetimecost.lifecycle_period_from									-- it need to be done in a sub-select
					from "${Tables.project_one_time_cost_lifecycle_value}" as onetimecost
						inner join "${Tables.lifecycle_monthly_period}" as periods
							on to_integer(onetimecost.lifecycle_period_from / 12 + 1900) = periods.year
							and mod(onetimecost.lifecycle_period_from, 12) + 1 = periods.selected_month
						inner join "${Tables.project_one_time_cost}" as projectonetimecost
							on projectonetimecost.project_id = periods.project_id
							and projectonetimecost.one_time_cost_id = onetimecost.one_time_cost_id
						inner join "${Views.project_with_privileges}" as auth
							on auth.project_id = periods.project_id
					where	auth.project_id = ?
							and auth.user_id = ?
				)
			and one_time_cost_id in (
				select one_time_cost_id
				from "${Tables.project_one_time_cost}"
				where project_id = ?
			);`;
		let aValues = [sProjectId, $.getPlcUsername(), sProjectId];
		dbConnection.executeUpdate(aOneTimeCostDeleteStmt, [aValues]);

		// Recalculate the onetime costs
		let fnRecalculateOneTimeCosts  = dbConnection.loadProcedure(Procedures.project_calculate_one_time_costs);
		fnRecalculateOneTimeCosts(sProjectId);
	};

	/**
	 * Delete activity and material surcharges for project lifecycle
	 * @param {string} 	- sProjectId: Id of the project
	 * @param {date} 	- dStartDate: Start of project
	 * @param {date}	- dEndDate: End of project
	 * @returns {void}
	 */
	this.deleteLifecycleSurchargesData = function(sProjectId, dStartDate, dEndDate) {
		let aActivityPriceSurchargesStmt = `
			delete 
			from "${Tables.project_activity_price_surcharge_values}"
			where (rule_id, lifecycle_period_from) in
		        (
		            select  period_values.rule_id,												-- since delete does not support join directly
		                    period_values.lifecycle_period_from									-- it need to be done in a sub-select
		            from "${Tables.project_activity_price_surcharge_values}" as period_values
		                inner join "${Tables.project_activity_price_surcharges}" as surcharges
				            on period_values.rule_id = surcharges.rule_id
			            inner join "${Views.project_with_privileges}" as auth
				            on surcharges.project_id = auth.project_id
		            where	auth.project_id = ?
							and auth.user_id = ?
							and (period_values.lifecycle_period_from < ? or period_values.lifecycle_period_from > ?)
				);`;
		
		let aMaterialPriceSurchargesStmt = `
			delete 
			from "${Tables.project_material_price_surcharge_values}"
			where (rule_id, lifecycle_period_from) in
		        (
		            select  period_values.rule_id,												-- since delete does not support join directly
		                    period_values.lifecycle_period_from									-- it need to be done in a sub-select
		            from "${Tables.project_material_price_surcharge_values}" as period_values
		                inner join "${Tables.project_material_price_surcharges}" as surcharges
				            on period_values.rule_id = surcharges.rule_id
			            inner join "${Views.project_with_privileges}" as auth
				            on surcharges.project_id = auth.project_id
		            where	auth.project_id = ?
							and auth.user_id = ?
							and (period_values.lifecycle_period_from < ? or period_values.lifecycle_period_from > ?)
				);`;
		let aValues = [sProjectId, $.getPlcUsername(), dStartDate.getFullYear() + dStartDate.getMonth(), dEndDate.getFullYear() + dEndDate.getMonth()];
		dbConnection.executeUpdate(aMaterialPriceSurchargesStmt, [aValues]);
		dbConnection.executeUpdate(aActivityPriceSurchargesStmt, [aValues]);
	};

	/**
	 * Deletes lifecycle period values for quantities as well as activity and material price surcharges, for which lifecycle_period_from is not inside the specified lowest and highest period. 
	 * The function is meant to be used after an update or the projects START and END_OF_PROJECT. For this case period values outside of the projects
	 * start and end shall be deleted. 
	 * 
	 * The function also handles the following special cases:
	 * 	- if {@link iLowestValidPeriodFrom} and {@link iHighestValidPeriodFrom} are null or undefined all period values are deleted
	 *  - if only {@link iLowestValidPeriodFrom} is defined, all period values below the project start are deleted
	 *  - if only {@link iHighestValidPeriodFrom} is defined, all period value above the project end are deleted
	 * 
	 * @param {string}
	 * 		sProjectId : The id of the project
	 * @param {date}
	 * 		dStartDate : The new start date. We need this parameter in order to mantain correctly the monthly periods
	 * @param {date}
	 * 		dEndDate : The new end date. We need this parameter in order to mantain correctly the monthly periods
	 * @returns {void}
	 */
	this.deleteLifecyclePeriodsForProject = function(sProjectId, dStartDate = null, dEndDate = null) {
		// If at least one of the project date (start/end) is null, all periods, quantities and surcharges should be deleted
		if (dStartDate === null || dEndDate === null) {
			this.deleteAllLifecyclePeriodsForProject(sProjectId);
			return;
		}

		this.deleteLifecyclePeriodsData(sProjectId, dStartDate, dEndDate);
		this.deleteLifecycleQuantitiesData(sProjectId);
		this.deleteLifecycleOneTimeCostData(sProjectId);
		this.deleteLifecycleSurchargesData(sProjectId, dStartDate, dEndDate);
	};
	
	
	/**	
	 * Remove all quantities definitions in t_project_lifecycle_configuration and t_project_lifecycle_period_quantity_value for a project.
	 * Meant to be used when updating a project
	 *
	 * @param  {type} sProjectId The id of the project for which the entries shall be removed
	 */
	this.deleteTotalQuantitiesForProject = function(sProjectId){
		var sStmt = `
				delete from "${Tables.project_lifecycle_configuration}"
				where calculation_id in
					(
						select calculation_id
						from "${Tables.calculation}" as calculations
							inner join "${Views.project_with_privileges}" as auth
								on calculations.project_id = auth.project_id
						where auth.project_id = ?
					)
		`;

		dbConnection.executeUpdate(sStmt, sProjectId);

		// remove all row from lifecycle_period_value for rule_ids not existing in t_project_lifecycle_configuration
		this.cleanUpLifecyclePeriodsValues(Tables.project_lifecycle_configuration, Tables.lifecycle_period_value);
	};	
	
	/**	
	 * Remove all surcharge definitions and values for a project. 
	 * 	 
	 * @param  {String} sProjectId - The id of the project for which the entries shall be removed
	 * @param  {object} oBusinessObjectType -  the business object of type BusinessObjectTypes. The values ProjectActivityPriceSurcharges and ProjectMaterialPriceSurcharges are acceptable
	 */	 
	this.deleteSurchargesForProject = function(sProjectId, sBusinessObjectType){
		var sDefinitionTable;
		var sValueTable;
		
		switch (sBusinessObjectType) {
			case BusinessObjectTypes.ProjectActivityPriceSurcharges:
				sDefinitionTable = 	Tables.project_activity_price_surcharges;
				sValueTable = 		Tables.project_activity_price_surcharge_values;
				break;
			case BusinessObjectTypes.ProjectMaterialPriceSurcharges:
				sDefinitionTable = 	Tables.project_material_price_surcharges;
				sValueTable = 		Tables.project_material_price_surcharge_values;
				break;			
			default: {
				const sLogMessage = `The business object type '${sBusinessObjectType}' is not supported by deleteSurchargesForProject.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}
		
		var sStmt = `
				delete from "${sDefinitionTable}" 
				where project_id in 
					( 
						select project_id 
						from "${Views.project_with_privileges}"
						where project_id = ? 
					)
		`;
		
		dbConnection.executeUpdate(sStmt, sProjectId);
		
		// remove all surcharge values for rule_ids not existing in surcharge definition table
		this.cleanUpLifecyclePeriods(sDefinitionTable, sValueTable);
	};
	
	
	/**	
	 * Utility to remove all row from lifecycle_period_value for rule_ids not existing in t_project_lifecycle_configuration. Is meant
	 * to be used after deleting entries from t_project_lifecycle_configuration and is made centrally available since it is needed by
	 * {@link persistency-calculation#deleteTotalQuantitiesForCalculation} and {@link deleteTotalQuantitiesForProject}. Is not 
	 * tested separately, but as part of the calling functions.  Was introduced to avoid code duplication.
	 * 	
	 */	 
	this.cleanUpLifecyclePeriods = function(sDefinitionTable, sValueTable) {
		var sStmt = `
				delete from "${sValueTable}" 
				where rule_id not in 
					( select rule_id from "${sDefinitionTable}" )
		`;
		dbConnection.executeUpdate(sStmt);
	};

	/**
	 * Utility to remove all row from lifecycle_period_value for rule_ids not existing in t_project_lifecycle_configuration. Is meant
	 * to be used after deleting entries from t_project_lifecycle_configuration and is made centrally available since it is needed by
	 * {@link deleteTotalQuantitiesForProject}. Is not
	 * tested separately, but as part of the calling functions.  Was introduced to avoid code duplication.
	 *
	 */
	this.cleanUpLifecyclePeriodsValues = function(sDefinitionTable, sValueTable) {
		var sStmt = `
				delete from "${sValueTable}" a
				where not exists
					( select project_id, calculation_id from "${sDefinitionTable}" b where a.project_id = b.project_id and a.calculation_id = b.calculation_id )
		`;
		dbConnection.executeUpdate(sStmt);
	};

	/**
	 * Gets the defined total quantities for all calculations in the project, even when no quantity for a calculation is defined in t_project_lifecycle_configuration.
	 * In case t_project_lifecycle_configuration does not contain a definition for a calculation, the quantity-specific values are null (RULE_ID, LAST_MODIFIED_ON,
	 * LAST_MODIFIED_BY, LIFECYCLE_PERIOD_FROM, VALUE). If values are defined in t_lifecycle_values, those are also contained in the
	 * returned objects.
	 *
	 * The used SQL query is joining with Views.project_with_privileges and uses the $.getPlcUsername(). So, calling this function will lead to an empty result
	 * if requesting users have insufficient privileges for the project.
	 *
	 * @param {string}
	 *            sProjectId - The id of the project
	 * @returns {array} - list of all defined total quantities per lifecycle period for all calculations from a project
	 */
	this.getTotalQuantities = function(sProjectId) {
		var sStatement = `
				select	project.project_id,
						calculation.calculation_id,
						calculation.calculation_name,
						calculation.current_calculation_version_id,
						total_quantities.calculation_version_id,
						calculation_version.calculation_version_name,
						case
							when total_quantities.calculation_version_id is not null 							-- if total quantity is defined for a calculation version
								then item.TOTAL_QUANTITY_UOM_ID													-- the UoM for this total quantity is the UoM of root item
							else 'PC' 																			-- otherwise 'PC' is returned as a fallback value
						end as TOTAL_QUANTITY_UOM_ID,
						total_quantities.MATERIAL_PRICE_SURCHARGE_STRATEGY,
						total_quantities.ACTIVITY_PRICE_SURCHARGE_STRATEGY,
						total_quantities.LAST_MODIFIED_ON,
						total_quantities.LAST_MODIFIED_BY,
						period_values.LIFECYCLE_PERIOD_FROM,
						period_values.VALUE,
						add_months(to_date('1900-01-01', 'YYYY-MM-DD'), period_values.lifecycle_period_from) as LIFECYCLE_PERIOD_FROM_DATE
				from "${Tables.calculation}" as calculation
					inner join "${Views.project_with_privileges}" as project
						on calculation.project_id = project.project_id
					left outer join "${Tables.project_lifecycle_configuration}" as total_quantities
						on total_quantities.calculation_id = calculation.calculation_id
					left outer join "${Tables.calculation_version}" as calculation_version
						on total_quantities.calculation_version_id = calculation_version.calculation_version_id
							and calculation_version.calculation_id = calculation.calculation_id
					left outer join "${Tables.item}" as item
						on item.calculation_version_id = total_quantities.calculation_version_id
					left outer join "${Tables.lifecycle_period_value}" as period_values
						on total_quantities.project_id = period_values.project_id
						and total_quantities.calculation_id = period_values.calculation_id
					left outer join (																			-- join with a sub-select in order to determine the number of saved versions
						select 	to_int(count(calculation_version_id)) as calculation_version_count,				-- of a calculation; quantities shall only be delivered for a calculation
								calculation_id																	-- with min. 1 saved version
						from "${Tables.calculation_version}"													-- this is done via the sub-select in order to avoid producing additional 
						group by calculation_id																	-- rows in the result set if a calculation has more than 1 version; 
					) as cv_count																				-- normal left outer joins would do this since calculation_id is not unique 
						on calculation.calculation_id = cv_count.calculation_id									-- in t_calculation_version
				where 		parent_item_id is null 
						and (cv_count.calculation_id is not null or  cv_count.calculation_version_count > 0)
						and project.project_id = ? 
						and project.user_id = ?;
		`;

		var aResult = dbConnection.executeQuery(sStatement, sProjectId, $.getPlcUsername());

		return aResult;
	};
	
	/**
	 * Gets the activity price surcharges of the project.
	 * 
	 * The used SQL query is joining with Views.project_with_privileges and uses the $.getPlcUsername(). So, calling this function will lead to an empty result
	 * if requesting users have insufficient privileges for the project.
	 * The descriptions are retrieved for current date.
	 * 
	 * @param {string}
	 *            sProjectId - id of the project	 
	 * @param {string}
	 *            sLanguage -  language for which the descriptions should be retrieved
	 * @returns {array} - list of all defined surcharges per lifecycle period for the project
	 */
	this.getActivityPriceSurcharges = function(sProjectId, sLanguage) {

		var sStatement = ` 
				select	surcharges.rule_id, 
						surcharges.plant_id, 
						planttext.plant_description,
						surcharges.account_group_id,
						accountgrouptext.account_group_description,
						surcharges.cost_center_id,
						costcentertext.cost_center_description,
						surcharges.activity_type_id,
						activitytypetext.activity_type_description,
						surcharge_values.LIFECYCLE_PERIOD_FROM, 
						surcharge_values.VALUE,
						add_months(to_date('1900-01-01', 'YYYY-MM-DD'), surcharge_values.lifecycle_period_from) as LIFECYCLE_PERIOD_FROM_DATE 
				from "${Views.project_with_privileges}" as project
				inner join "${Tables.project_activity_price_surcharges}" as surcharges
					on surcharges.project_id = project.project_id
				left outer join "${Tables.project_activity_price_surcharge_values}" as surcharge_values 	-- join on values if those exist
					on surcharges.rule_id = surcharge_values.rule_id
					
				-- add descriptions from master data for given language and current date if those exist
				left outer join "sap.plc.db::basis.t_plant__text" planttext
                	on planttext.plant_id = surcharges.plant_id 
                	and surcharges.plant_id in
                		(select plant_id from "sap.plc.db::basis.t_plant" plant
							inner join "sap.plc.db::basis.t_company_code" companycode 
								on plant.company_code_id = companycode.company_code_id 
								and companycode.controlling_area_id = project.controlling_area_id)  
                	and current_utctimestamp >= planttext._valid_from 
                	and (planttext._valid_to is null or current_utctimestamp < planttext._valid_to)             
                	and planttext.language = ?
            	left outer join "sap.plc.db::basis.t_cost_center__text" costcentertext
                	on costcentertext.cost_center_id = surcharges.cost_center_id 
                	and costcentertext.controlling_area_id = project.controlling_area_id
					and current_utctimestamp >= costcentertext._valid_from 
					and (costcentertext._valid_to is null or current_utctimestamp < costcentertext._valid_to)                                
                	and costcentertext.language = ?
            	left outer join "sap.plc.db::basis.t_activity_type__text" activitytypetext
                	on activitytypetext.activity_type_id = surcharges.activity_type_id 
					and activitytypetext.controlling_area_id = project.controlling_area_id
					and activitytypetext.language = ?
                	and current_utctimestamp >= activitytypetext._valid_from
                	and (activitytypetext._valid_to is null or current_utctimestamp < activitytypetext._valid_to) 				
				left outer join "sap.plc.db::basis.t_account_group__text" accountgrouptext
			    	on accountgrouptext.account_group_id = surcharges.account_group_id 
					and accountgrouptext.language = ?
                	and current_utctimestamp >= accountgrouptext._valid_from
                	and (accountgrouptext._valid_to is null or current_utctimestamp < accountgrouptext._valid_to) 
                	
				where 	project.project_id = ? 
						and project.user_id = ?;	
		`;
		
		var aResult = dbConnection.executeQuery(sStatement, sLanguage, sLanguage, sLanguage, sLanguage, sProjectId, $.getPlcUsername());

		return aResult;
	};	

	/**
	 * Gets material price surcharges of the project.
	 * 
	 * The used SQL query is joining with Views.project_with_privileges and uses the $.getPlcUsername(). So, calling this function will lead to an empty result
	 * if requesting users have insufficient privileges for the project.
	 * The descriptions are retrieved for current date.
	 * 
	 * @param {string}
	 *            sProjectId - id of the project	 
	 * @param {string}
	 *            sLanguage -  language for which the descriptions should be retrieved
	 * @returns {array} - list of all defined surcharges per lifecycle period for the project
	 */
	this.getMaterialPriceSurcharges = function(sProjectId, sLanguage) {

		var sStatement = ` 
				select	surcharges.rule_id, 
						surcharges.plant_id, 
						planttext.plant_description,
						surcharges.account_group_id,
						accountgrouptext.account_group_description,
						surcharges.material_group_id,
						materialgrouptext.material_group_description,
						surcharges.material_type_id,
						materialtypetext.material_type_description,
						surcharges.material_id,
						materialtext.material_description,
						surcharge_values.LIFECYCLE_PERIOD_FROM, 
						surcharge_values.VALUE,
						add_months(to_date('1900-01-01', 'YYYY-MM-DD'), surcharge_values.lifecycle_period_from) as LIFECYCLE_PERIOD_FROM_DATE 
				from "${Views.project_with_privileges}" as project
				inner join "${Tables.project_material_price_surcharges}" as surcharges
					on surcharges.project_id = project.project_id
				left outer join "${Tables.project_material_price_surcharge_values}" as surcharge_values 	-- join on values if those exist
					on surcharges.rule_id = surcharge_values.rule_id
					
				-- add descriptions from master data for given language and current date if those exist
				left outer join "sap.plc.db::basis.t_plant__text" planttext
                	on planttext.plant_id = surcharges.plant_id 
                	and surcharges.plant_id in
                		(select plant_id from "sap.plc.db::basis.t_plant" plant
							inner join "sap.plc.db::basis.t_company_code" companycode 
								on plant.company_code_id = companycode.company_code_id 
								and companycode.controlling_area_id = project.controlling_area_id)  
                	and current_utctimestamp >= planttext._valid_from 
                	and (planttext._valid_to is null or current_utctimestamp < planttext._valid_to)             
                	and planttext.language = ?
            	left outer join "sap.plc.db::basis.t_material_group__text" materialgrouptext
                	on materialgrouptext.material_group_id = surcharges.material_group_id 
 					and current_utctimestamp >= materialgrouptext._valid_from 
					and (materialgrouptext._valid_to is null or current_utctimestamp < materialgrouptext._valid_to)                                
                	and materialgrouptext.language = ?
            	left outer join "sap.plc.db::basis.t_material_type__text" materialtypetext
                	on materialtypetext.material_type_id = surcharges.material_type_id 
					and materialtypetext.language = ?
                	and current_utctimestamp >= materialtypetext._valid_from
                	and (materialtypetext._valid_to is null or current_utctimestamp < materialtypetext._valid_to) 				
				left outer join "sap.plc.db::basis.t_account_group__text" accountgrouptext
			    	on accountgrouptext.account_group_id = surcharges.account_group_id 
					and accountgrouptext.language = ?
                	and current_utctimestamp >= accountgrouptext._valid_from
                	and (accountgrouptext._valid_to is null or current_utctimestamp < accountgrouptext._valid_to) 
                left outer join "sap.plc.db::basis.t_material__text" materialtext
					on materialtext.material_id = surcharges.material_id
					and materialtext.language = ?
					and current_utctimestamp >= materialtext._valid_from
					and (materialtext._valid_to is null or current_utctimestamp < materialtext._valid_to) 
                			
				where 	project.project_id = ? 
						and project.user_id = ?;	
		`;
		
		var aResult = dbConnection.executeQuery(sStatement, sLanguage, sLanguage, sLanguage, sLanguage, sLanguage, sProjectId, $.getPlcUsername());

		return aResult;
	};
	
	/**
	 * Returns list of overlapping accounts for given project.
	 * 
	 * Overlapping account groups means that same account(s) with same cost portions are contained in two different surcharge rows and that the other dependencies (e.g. plant) are the same. 
	 * 
	 * 
	 * @param {string}
	 *            sProjectId - project id
	 * @param {string}
	 * 			  sBusinessObjectType - name of business object to which the method will apply
	 * @returns {array} - list of overlapping accounts for given project
	 */
	this.getOverlappingAccountsInProjectSurcharges = (sProjectId, sBusinessObjectType) => {
		var sDefinitionTable;
		var sGroupingStatement;
		let sUserId = $.getPlcUsername();
		
		switch (sBusinessObjectType) {
			case BusinessObjectTypes.ProjectActivityPriceSurcharges:
				sDefinitionTable = 	Tables.project_activity_price_surcharges;
				sGroupingStatement = 'account.account_id, surcharges.plant_id, surcharges.cost_center_id, surcharges.activity_type_id';
				break;
			case BusinessObjectTypes.ProjectMaterialPriceSurcharges:
				sDefinitionTable = 	Tables.project_material_price_surcharges;
				sGroupingStatement = 'account.account_id, surcharges.plant_id, surcharges.material_group_id, surcharges.material_type_id, surcharges.material_id';
				break;			
			default: {
				const sLogMessage = `The business object type '${sBusinessObjectType}' is not supported by getOverlappingAccountsInProjectSurcharges.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}
		
		let sStatement = ` 
		select	account.account_id,																		-- selects the accounts of account groups from surcharge definition for given project
				account_group.account_group_id
				from "${Views.project_with_privileges}" as project
				inner join "${sDefinitionTable}" as surcharges
					on surcharges.project_id = project.project_id
				inner join "sap.plc.db::basis.t_account_group" as account_group
					on account_group.account_group_id = surcharges.account_group_id
						and account_group.controlling_area_id = project.controlling_area_id
						and account_group._valid_to is null
				inner join "sap.plc.db::basis.t_account_account_group" as account_account_group
					on account_account_group.account_group_id = surcharges.account_group_id
						and account_account_group._valid_to is null
				inner join "sap.plc.db::basis.t_account" as account
					on account.account_id >= account_account_group.from_account_id 
						-- if to_account_id is null, then only the account from from_account_id should be taken
						and (account.account_id <= ifnull(account_account_group.to_account_id, account_account_group.from_account_id ))
						and account.controlling_area_id = project.controlling_area_id
						and account._valid_to is null
				inner join 
					-- take only overlapping accounts
					(select account_id from 
					
						-- subselect returning the count of accounts in respective account groups. The accounts with count > 1 are overlapping accounts
						(select	account.account_id,														-- selects the account of account groups grouped by definitions
							count(surcharges.account_group_id) as account_group_count
							from "${Views.project_with_privileges}" as project
							inner join "${sDefinitionTable}" as surcharges
								on surcharges.project_id = project.project_id
							inner join "sap.plc.db::basis.t_account_group" as account_group
								on account_group.account_group_id = surcharges.account_group_id
									and account_group.controlling_area_id = project.controlling_area_id
									and account_group._valid_to is null
							inner join "sap.plc.db::basis.t_account_account_group" as account_account_group
								on account_account_group.account_group_id = surcharges.account_group_id
									and account_account_group._valid_to is null
							inner join "sap.plc.db::basis.t_account" as account
								on account.account_id >= account_account_group.from_account_id 
									-- if to_account_id is null, then only the account from from_account_id should be taken
									and (account.account_id <= ifnull(account_account_group.to_account_id, account_account_group.from_account_id )) 
									and account.controlling_area_id = project.controlling_area_id
									and account._valid_to is null
							where 	project.project_id = ? and project.user_id = ?
							group by ${sGroupingStatement}
						) where account_group_count > 1
					) overlapping_accounts
					on overlapping_accounts.account_id = account.account_id
				
				where 	project.project_id = ? and project.user_id = ?;	
		`;

		var aResult = dbConnection.executeQuery(sStatement, sProjectId, sUserId, sProjectId, sUserId);

		return aResult;
	};	
	
	/** TODO_VV: check with Rene if this function is or will be used anywhere	
	 * Get the all defined total quantities for a project. In contrast to {@link getTotalQuantities} this function only returns defined total quantities in 
	 * t_project_lifecycle_configuration. If for a calculation in the project no quantities are defined yet, the calculation is not contained in the returned array.
	 * Also no values from t_lifecycle_values are contained there.
	 *
	 * The function is intended to be used to find out for which calculations in a project quantities are defined.
	 *
	 *  @param {string}
	 *            sProjectId - The id of the project
	 *  @returns {array} - list defined quantities for calculations within the project with the given id
	 */
	this.getTotalQuantityDefinitions = (sProjectId) => {
		let sStmt = `
			select 	total_quantities.calculation_id,
					total_quantities.calculation_version_id,
					total_quantities.last_modified_on,
					total_quantities.last_modified_by
			from "${Tables.project_lifecycle_configuration}" as total_quantities
				inner join "${Tables.calculation}" as calculation
					on total_quantities.calculation_id = calculation.calculation_id
				inner join "${Views.project_with_privileges}" as project
					on calculation.project_id = project.project_id
			where project.project_id = ? and project.user_id = ?;
		`;
		var aResult = dbConnection.executeQuery(sStmt, sProjectId, $.getPlcUsername());
		return aResult;
	};

	/**
	 * Function that checks if the project entity id is the same as the source entity id
	 * @param sProjectId - id of the project that needs to be checked
	 * @param iSourceEntityId - id of the source entity id
	 * @throws PlcException - is thrown if the project entity id is not the same as the source entity id
	 */
	this.checkProjectIdSameAsSourceEntityId = (sProjectId, iSourceEntityId) => {
		const iEntityIdCount = parseInt(dbConnection.executeQuery(`select count(ENTITY_ID) as COUNT from "sap.plc.db::basis.t_project" where PROJECT_ID = ? and ENTITY_ID = ?`, sProjectId, iSourceEntityId)[0].COUNT);
		if(iEntityIdCount === 0){
			const sClientMsg = "Missmatch between project entity id and requested source entity id";
		    const sServerMsg = `${sClientMsg}. Project id: [${sProjectId}], Source entity id:[${iSourceEntityId}]`;
		    $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
		}
	}

	/**
	 * Function that checks if list of projects ids is exist and throw entity not found otherwise
	 * @param aProjectsIds - array of project ids
	 * @throws PlcException - is thrown if the project entity id is not the same as the source entity id
	 */
	this.checkProjectsExist = (aProjectsIds, sUserId) => {
		const aExistingProjects = dbConnection.executeQuery(`select project_id from "sap.plc.db.authorization::privileges.v_project_read" where project_id in ('${aProjectsIds.join("','")}') and USER_ID = '${sUserId}'`).map(project => project.PROJECT_ID);
		const aInvalidIds = aProjectsIds.filter(id => !aExistingProjects.includes(id));
		if(aInvalidIds.length > 0){
			const sClientMsg = "At least one of the projects does not exist.";
		    const sServerMsg = `${sClientMsg} : [${aInvalidIds.toString()}]`;
		    $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
		}
	}

	/**
     * Function to check the validity of referenced master data
	 * 
	 * @params oProjectMasterdata - object with project surcharges properties
	 * @params mParameters - object with project id
	 * @params aPropertiesToBeChecked - array with properties to be checked
	 * @throws PlcException - is thrown if non-temporary masterdata doesn't exist
     */
    this.checkMasterdataReferences = function(oProjectMasterdata, mParameters, aPropertiesToBeChecked) {
		const dTimestamp = new Date();
		const oProject = {"project_id": mParameters.id};
		const sControllingAreaId = getControllingAreaForParameter(oProject);
		const sStmtInsert = `insert into "${Tables.gtt_masterdata_validator}" 
								("COLUMN_ID", "VALUE") 
								values (?, ?);`;
		// prepare temporary data for the procedure which verifies if the masterdata is non temporary
		for (property in oProjectMasterdata) {
			oProjectMasterdata[property].forEach(value => {
				dbConnection.executeUpdate(sStmtInsert, property, value);
			});
		}
		
		const procedure = dbConnection.loadProcedure(Procedures.materdata_references_validator);
		procedure(dTimestamp, sControllingAreaId);

		const sStmtCheckErrors = `select * from "${Tables.gtt_masterdata_validator}" where
									"COLUMN_ID" IN ('${aPropertiesToBeChecked.join("','")}');`;
		const aErrors = dbConnection.executeQuery(sStmtCheckErrors);

		if (aErrors.length > 0) {
			let sLogMessage= `Error while checking masterdata references. `;
			aErrors.forEach(err => {
				sLogMessage += `Property '${err.COLUMN_ID}' with the value '${err.VALUE}' is not valid. `;
			});
			sLogMessage += `Temporary values are not allowed.`
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR, sLogMessage);
		}

		// delete temporary data
		const sStmtDelete = `DELETE FROM "${Tables.gtt_masterdata_validator}";`;
		dbConnection.executeUpdate(sStmtDelete);
	}
}
Project.prototype = Object.create(Project.prototype);
Project.prototype.constructor = Project;
