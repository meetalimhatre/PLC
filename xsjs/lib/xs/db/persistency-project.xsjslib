const _ = $.require('lodash');
const Helper = $.require('./persistency-helper').Helper;
const Misc = $.require('./persistency-misc').Misc;
const Session = $.require('./persistency-session').Session;
const Metadata = $.require('./persistency-metadata').Metadata;
const helpers = $.require('../util/helpers');
const MasterdataResources = $.require('../util/masterdataResources').MasterdataResource;
const BusinessObjectsEntities = $.require('../util/masterdataResources').BusinessObjectsEntities;
const Constants = $.require('../util/constants');
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const UrlToSqlConverter = $.require('../util/urlToSqlConverter').UrlToSqlConverter;
const Limits = $.require('../util/masterdataResources').Limits;
const Privilege = $.import('xs.db', 'persistency-privilege').Privilege;

const AuthorizationManager = $.require('../authorization/authorization-manager');
const InstancePrivileges = AuthorizationManager.Privileges;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

var Tables = {
    authorization: 'sap.plc.db::auth.t_auth_project',
    user_authorization: 'sap.plc.db::auth.t_auth_user',
    project: 'sap.plc.db::basis.t_project',
    open_projects: 'sap.plc.db::basis.t_open_projects',
    session: 'sap.plc.db::basis.t_session',
    calculation: 'sap.plc.db::basis.t_calculation',
    calculation_version: 'sap.plc.db::basis.t_calculation_version',
    calculation_version_temporary: 'sap.plc.db::basis.t_calculation_version_temporary',
    open_calculation_versions: 'sap.plc.db::basis.t_open_calculation_versions',
    item: 'sap.plc.db::basis.t_item',
    item_temporary: 'sap.plc.db::basis.t_item_temporary',
    project_lifecycle_configuration: 'sap.plc.db::basis.t_project_lifecycle_configuration',
    project_lifecycle_period_type: 'sap.plc.db::basis.t_project_lifecycle_period_type',
    project_monthly_periods: 'sap.plc.db::basis.t_project_monthly_lifecycle_period',
    project_activity_price_surcharges: 'sap.plc.db::basis.t_project_activity_price_surcharges',
    project_activity_price_surcharge_values: 'sap.plc.db::basis.t_project_activity_price_surcharge_values',
    project_material_price_surcharges: 'sap.plc.db::basis.t_project_material_price_surcharges',
    project_material_price_surcharge_values: 'sap.plc.db::basis.t_project_material_price_surcharge_values',
    project_one_time_cost_lifecycle_value: 'sap.plc.db::basis.t_one_time_cost_lifecycle_value',
    project_one_time_cost: 'sap.plc.db::basis.t_one_time_project_cost',
    product_one_time_cost: 'sap.plc.db::basis.t_one_time_product_cost',
    task: 'sap.plc.db::basis.t_task',
    lifecycle_period_value: 'sap.plc.db::basis.t_project_lifecycle_period_quantity_value',
    lifecycle_monthly_period: 'sap.plc.db::basis.t_project_monthly_lifecycle_period',
    application_timeout: 'sap.plc.db::basis.t_application_timeout',
    folder: 'sap.plc.db::basis.t_folder',
    entity_relation: 'sap.plc.db::basis.t_entity_relation',
    gtt_masterdata_validator: 'sap.plc.db::temp.gtt_masterdata_validator'
};

const Procedures = {
    project_read: 'sap.plc.db.calculationmanager.procedures::p_project_read',
    project_delete: 'sap.plc.db.calculationmanager.procedures::p_project_delete',
    create_lifecycle_versions: 'sap.plc.db.calculationmanager.procedures::p_project_create_lifecycle_versions',
    calculate_lifecycle_versions: 'sap.plc.db.calcengine.procedures::p_calculate_project_lifecycle',
    materdata_references_validator: 'sap.plc.db.administration.procedures::p_materdata_references_validator',
    check_manual_one_time_costs: 'sap.plc.db.calculationmanager.procedures::p_project_check_manual_one_time_costs',
    project_calculate_one_time_costs: 'sap.plc.db.calculationmanager.procedures::p_project_calculate_one_time_costs'
};

const Views = { project_with_privileges: 'sap.plc.db.authorization::privileges.v_project_read' };

const Sequences = {
    rule_id: 'sap.plc.db.sequence::s_rule_id',
    project_entity_sequance: 'sap.plc.db.sequence::s_entity_id'
};


/**
 * Provides persistency operations with projects.
 */

async function Project(dbConnection, hQuery) {
    this.helper = await new Helper($, hQuery, dbConnection);
    this.misc = await new Misc($, hQuery, $.getPlcUsername());
    this.session = await new Session($, dbConnection, hQuery);
    this.metadata = await new Metadata($, hQuery, null, $.getPlcUsername());
    this.converter = await new UrlToSqlConverter();
    var sBusinessObjectName = BusinessObjectTypes.Project;
    this.privilege = await new Privilege(dbConnection);
    var sessionTimeout = Constants.ApplicationTimeout.SessionTimeout;
    var that = this;

    /**
	 * Gets all projects along with master data and counts the number of calculation for each project
	 * @param {string}
	 *            sLanguage - the language code for which descriptions should be returned
	 * @returns {object} oReturnObject - An object containing an array of projects + masterdata
	 */
    this.getAll = async function (sLanguage, sUserId, mParameters) {
        var sProjectId = '';
        var sMasterDataDate = new Date();
        var sSQLstring = '';
        var sTextFromAutocomplete = '';
        var noRecords = Limits.Top;
        var iFolderId = null;
        var aMetadataFields = this.metadata.getMetadataFields(sBusinessObjectName, sBusinessObjectName, null);

        if (!helpers.isNullOrUndefined(mParameters.searchAutocomplete)) {
            sTextFromAutocomplete = mParameters.searchAutocomplete;
        }

        if (!helpers.isNullOrUndefined(mParameters.top)) {
            noRecords = parseInt(mParameters.top);
        }

        if (!helpers.isNullOrUndefined(mParameters.folderId)) {
            iFolderId = mParameters.folderId;
        }

        if (!helpers.isNullOrUndefined(mParameters.filter)) {
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
    this.get = async function (sLanguage, sUserId, sProjectId) {
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
    this.getCalculationsWithVersions = function (sProjectId) {
        var sStmt = `
			select  versions.calculation_id,
					versions.calculation_version_id 
			from "${ Tables.calculation }" as calculations
				inner join "${ Tables.calculation_version }" as versions
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
    this.close = async function (sProjectId, sSessionId) {

        var sCloseStatement = 'delete from "' + Tables.open_projects + '" where session_id = ? and project_id = ?';

        dbConnection.executeUpdate(sCloseStatement, sSessionId, sProjectId);
        await dbConnection.commit();
    };

    /**
	 * Gets and returns the next ID from 'sap.plc.db.sequence::s_entity_id' sequence.
	 * @returns {integer} the next ID taken from 'sap.plc.db.sequence::s_entity_id' sequence
	 */
    this.getNextSequence = () => {
        return this.helper.getNextSequenceID(Sequences.project_entity_sequance);
    };

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
    this.create = async function (oProject, sSessionId, sUserId) {
        const iEntityId = this.getNextSequence();
        const oEntityRelation = { 'PARENT_ENTITY_ID': oProject.PATH !== '0' ? await helpers.getEntityIdFromPath(oProject.PATH) : null };
        const oEntityRelationSettings = {
            TABLE: Tables.entity_relation,
            PROPERTIES_TO_EXCLUDE: [],
            GENERATED_PROPERTIES: {
                'ENTITY_ID': iEntityId,
                'ENTITY_TYPE': Constants.EntityTypes.Project
            }
        };
        this.helper.insertNewEntity(oEntityRelation, oEntityRelationSettings);
        // Exclude the properties that are not plain objects and which are protected with regard to internal logic
        var aPropertiesToExclude = _.filter(_.keys(oProject), function (sKey) {
            return _.isArray(oProject[sKey]);
        });

        var currentdate = new Date();
        var oGeneratedValues = {
            'CREATED_ON': currentdate,
            'CREATED_BY': sUserId,
            'LAST_MODIFIED_ON': currentdate,
            'LAST_MODIFIED_BY': sUserId,
            'ENTITY_ID': iEntityId
        };

        var oSettings = {
            TABLE: Tables.project,
            PROPERTIES_TO_EXCLUDE: aPropertiesToExclude,
            GENERATED_PROPERTIES: oGeneratedValues
        };
        // PATH is removed as it's not part of the Project Model.
        const oResultSet = this.helper.insertNewEntity(_.omit(oProject, ['PATH']), oSettings);

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
                'USER_ID': sSessionId,
                'PRIVILEGE': InstancePrivileges.ADMINISTRATE
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
    this.exists = function (sProjectId) {
        return this.helper.exists([sProjectId], Tables.project, 'project_id');
    };

    /**
	 * Deletes all data where session_id does not exists in session table anymore to make sure data is consistent *
	 */
    async function cleanupSessions(sProjectId) {
        // delete outdated session if it locks a required calculation version

        // CURRENT_UTCTIMESTAMP MUST be used in SQL stmt, since CURRENT_TIMESTAMP would lead cleanup a session every time this method is called
        // if the server is not running in UTC (due to time offset)
        var oStatementDelete = hQuery.statement([
            'delete from  "' + Tables.session + '"',
            ' where session_id in (select "SESSION_ID" from "' + Tables.open_projects + '"',
            ' where project_id = ? and IS_WRITEABLE = 1) and SECONDS_BETWEEN(LAST_ACTIVITY_TIME, CURRENT_UTCTIMESTAMP)> ',
            '( select "VALUE_IN_SECONDS" from "' + Tables.application_timeout + '" where APPLICATION_TIMEOUT_ID =?)'
        ].join(' '));
        await oStatementDelete.execute(sProjectId, sessionTimeout);

        that.session.deleteOutdatedEntries();
    }










    this.open = async function (sProjectId, sSessionId, iIsWriteable) {

        await cleanupSessions(sProjectId);

        var sUpsertStatement = 'upsert "' + Tables.open_projects + '" values (?, ?, ?) where session_id = ? and project_id = ?';
        dbConnection.executeUpdate(sUpsertStatement, sSessionId, sProjectId, iIsWriteable, sSessionId, sProjectId);
        await dbConnection.commit();
    };

    this.hasReadPrivilege = async function (sProjectId) {
        var sPrivilege = await AuthorizationManager.getUserPrivilege(AuthorizationManager.BusinessObjectTypes.Project, sProjectId, dbConnection, $.getPlcUsername());
        return sPrivilege === InstancePrivileges.READ ? true : false;
    };

    const getControllingAreaForParameter = async function (mParameters) {
        let sControllingAreaId = null;
        if (mParameters['controlling_area_id']) {
            sControllingAreaId = mParameters.controlling_area_id;
        } else if (mParameters['project_id']) {
            let result = dbConnection.executeQuery(`
                    select controlling_area_id
                    from "sap.plc.db::basis.t_project" 
                    where   project_id = ? 
            `, mParameters['project_id']);




            sControllingAreaId = result[0] ? result[0].CONTROLLING_AREA_ID : '';
        } else {
            const sLogMessage = `Unknown parameter or unknown combination of parameters during getting controlling area: ${ Object.keys(mParameters) }`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        return sControllingAreaId;
    };





    this.getExistingNonTemporaryMasterdata = function (mParameters) {
        const dMasterdataTimestamp = new Date();
        const sControllingAreaId = getControllingAreaForParameter(mParameters);

        return {
            CURRENCIES: this.helper.getExistingCurrencies(dMasterdataTimestamp),
            COSTING_SHEETS: this.helper.getExistingCostingSheets(sControllingAreaId, dMasterdataTimestamp),
            COMPONENT_SPLITS: this.helper.getExistingComponentSplits(sControllingAreaId, dMasterdataTimestamp),
            EXCHANGE_RATE_TYPES: this.helper.getExistingExchangeRateTypes(),
            CONTROLLING_AREAS: this.helper.getExistingControllingAreas(),
            MATERIAL_PRICE_STRATEGIES: this.helper.getExistingMaterialPriceStrategies(),
            ACTIVITY_PRICE_STRATEGIES: this.helper.getExistingActivityPriceStrategies()
        };
    };

    this.getExistingNonTemporaryMasterdataForSurcharges = async function (mParameters, oProjectSurcharges) {
        const dMasterdataTimestamp = new Date();
        const sControllingAreaId = getControllingAreaForParameter(mParameters);

        return {
            ACCOUNT_GROUPS: !helpers.isNullOrUndefined(oProjectSurcharges.ACCOUNT_GROUP_ID) ? this.helper.getExistingAccountGroups(sControllingAreaId, dMasterdataTimestamp, oProjectSurcharges.ACCOUNT_GROUP_ID) : [],
            MATERIAL_GROUPS: !helpers.isNullOrUndefined(oProjectSurcharges.MATERIAL_GROUP_ID) ? this.helper.getExistingMaterialGroups(dMasterdataTimestamp, oProjectSurcharges.MATERIAL_GROUP_ID) : [],
            MATERIAL_TYPES: !helpers.isNullOrUndefined(oProjectSurcharges.MATERIAL_TYPE_ID) ? this.helper.getExistingMaterialTypes(dMasterdataTimestamp, oProjectSurcharges.MATERIAL_TYPE_ID) : [],
            PLANTS: !helpers.isNullOrUndefined(oProjectSurcharges.PLANT_ID) ? this.helper.getExistingPlants(dMasterdataTimestamp, oProjectSurcharges.PLANT_ID) : [],
            COST_CENTERS: !helpers.isNullOrUndefined(oProjectSurcharges.COST_CENTER_ID) ? this.helper.getExistingCostCenter(sControllingAreaId, dMasterdataTimestamp, oProjectSurcharges.COST_CENTER_ID) : [],
            ACTIVITY_TYPES: !helpers.isNullOrUndefined(oProjectSurcharges.ACTIVITY_TYPE_ID) ? this.helper.getExistingActivityTypes(sControllingAreaId, dMasterdataTimestamp, oProjectSurcharges.ACTIVITY_TYPE_ID) : [],
            MATERIALS: !helpers.isNullOrUndefined(oProjectSurcharges.MATERIAL_ID) ? this.helper.getExistingMaterials(dMasterdataTimestamp, oProjectSurcharges.MATERIAL_ID) : []
        };
    };














    this.getOpeningUsers = async function (sProjectId, sSessionId, bCheckWriteable) {
        var sWriteableCondition;
        var bCheckSession = false;

        if (bCheckWriteable === undefined) {
            sWriteableCondition = '';
            sSessionId = null;
        } else {
            sWriteableCondition = bCheckWriteable ? 'and is_writeable = 1 and session_id <> ?' : 'and is_writeable = 0 and session_id <> ?';
            bCheckSession = true;
        }


        var oStatement = hQuery.statement([
            'select user_id from  "' + Tables.session + '"',
            ' where session_id in (select session_id from "' + Tables.open_projects + '"',
            ' where project_id = ? ' + sWriteableCondition + ')'
        ].join(' '));

        var result;
        try {
            if (bCheckSession === true) {
                result = await oStatement.execute(sProjectId, sSessionId);
            } else {
                result = await oStatement.execute(sProjectId);
            }

        } catch (e) {
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addProjectObjs({ id: sProjectId });
            const sClientMsg = 'Error during checking the project for opening users.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }, Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails, undefined, e);
        }

        if (result.length > 1 && bCheckSession) {
            const sClientMsg = 'Project is opened in write mode by more than one user.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

        return result;
    };














    this.isOpenedInSession = async function (sProjectId, sSessionId, bCheckWriteable) {
        var sWriteableCondition;
        if (bCheckWriteable === undefined) {
            sWriteableCondition = '';
        } else {
            sWriteableCondition = bCheckWriteable ? 'and is_writeable = 1' : 'and is_writeable = 0';
        }

        var sStatement = [
            'select count(*) as count from  "' + Tables.open_projects + '"',
            ' where project_id = ? and session_id = ? ',
            sWriteableCondition
        ].join(' ');

        var result = dbConnection.executeQuery(sStatement, sProjectId, sSessionId);
        var iOpened = parseInt(result[0].COUNT.toString(), 10);

        if (iOpened > 1) {
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addProjectObjs({ id: sProjectId });

            const sClientMsg = `Error during checking if project is opened: ${ iOpened } projects instances are opened by user.`;
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }, session id: ${ sSessionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        return iOpened === 1;
    };












    this.remove = async function (sProjectId) {
        try {
            var fnProcedure = dbConnection.loadProcedure(Procedures.project_delete);
            var result = fnProcedure(sProjectId);

            return result.affectedRows;
        } catch (e) {
            const sClientMsg = 'Error during deleting the project.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }, Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

    };












    this.update = async function (oProjectToUpdate) {

        oProjectToUpdate.LAST_MODIFIED_ON = new Date();
        oProjectToUpdate.LAST_MODIFIED_BY = $.getPlcUsername();

        var oSettings = {
            TABLE: Tables.project,
            WHERE_PROPERTIES: { PROJECT_ID: oProjectToUpdate.PROJECT_ID }
        };

        if (oProjectToUpdate.TARGET_PATH && oProjectToUpdate.PATH) {
            const iParentEntityId = oProjectToUpdate.TARGET_PATH !== '0' ? await helpers.getEntityIdFromPath(oProjectToUpdate.TARGET_PATH) : null;
            const iProjectEntityId = await helpers.getEntityIdFromPath(oProjectToUpdate.PATH);
            this.helper.updateEntityRelation(iProjectEntityId, iParentEntityId);
        }

        var oCompleteUpdateSet = this.helper.setMissingPropertiesToNull(_.omit(oProjectToUpdate, [
            'TARGET_PATH',
            'PATH'
        ]), Tables.project, [
            'CREATED_ON',
            'CREATED_BY'
        ]);


        var oUpdatedProject = this.helper.updateEntity(oCompleteUpdateSet, oSettings);

        return oUpdatedProject;
    };













    this.createLifecycleVersions = function (sProjectId, sUserId, bOverWriteManualVersions, sOneTimeCostItemDescription) {
        let fnCreateLifecycleVersions = dbConnection.loadProcedure(Procedures.create_lifecycle_versions);
        let oResult = fnCreateLifecycleVersions(sProjectId, sUserId, bOverWriteManualVersions, sOneTimeCostItemDescription);
        var aCreatedLifecycleVersions = oResult.OT_CREATED_LIFECYCLE_VERSIONS;
        return aCreatedLifecycleVersions;
    };







    this.checkManualOneTimeCosts = function (sProjectId) {
        let fnCheckManualOneTimeCosts = dbConnection.loadProcedure(Procedures.check_manual_one_time_costs);
        var result = fnCheckManualOneTimeCosts(sProjectId);
        return result.OV_IS_VALID === 0;
    };







    this.getOpenedLifecycleVersions = sProjectId => {
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
        let aLockedLifecycleVersions = dbConnection.executeQuery(stmt, Constants.CalculationVersionType.Lifecycle, Constants.CalculationVersionType.ManualLifecycleVersion, Constants.CalculationVersionLockContext.CALCULATION_VERSION, sProjectId);
        return aLockedLifecycleVersions;
    };


    this.getReferencedVersions = sProjectId => {
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
							AND (calculation.project_id ='${ sProjectId }')
					WHERE (calculationVersion.lifecycle_period_from NOT IN (SELECT lifecycle_period_from
					FROM "sap.plc.db::basis.t_project_lifecycle_period_quantity_value"
					WHERE ((project_id ='${ sProjectId }')
						AND calculation_id = calculation.calculation_id)));`;
        let aReferencedVersions = dbConnection.executeQuery(stmt);
        return aReferencedVersions;
    };












    this.calculteLifecycleVersions = function (sProjectId, bOverWriteManualVersions) {
        let fnCalculateLifecycleVersions = dbConnection.loadProcedure(Procedures.calculate_lifecycle_versions);
        fnCalculateLifecycleVersions(sProjectId, bOverWriteManualVersions);
    };

    this.recalculateOneTimeCostForProject = function (sProjectId) {
        let fnRecalculateOneTimeCosts = dbConnection.loadProcedure(Procedures.project_calculate_one_time_costs);
        fnRecalculateOneTimeCosts(sProjectId);
    };

    this.updateCostNotDistributedForOneTimeProjectCostWhenCalculationGetsDeleted = function (sProjectId, iCalculationId) {

        const sUpdateCostNotDistributedForProject = `
			UPDATE otpc
			SET otpc.COST_NOT_DISTRIBUTED = otpc.COST_NOT_DISTRIBUTED + product.COST_TO_DISTRIBUTE 
			FROM "${ Tables.project_one_time_cost }" otpc
			INNER JOIN "${ Tables.product_one_time_cost }" product
				ON otpc.ONE_TIME_COST_ID = product.ONE_TIME_COST_ID
				AND product.CALCULATION_ID = ?
			WHERE otpc.project_id = ?
		`;

        dbConnection.executeUpdate(sUpdateCostNotDistributedForProject, iCalculationId, sProjectId);
    };






    this.deleteOneTimeCostRelatedDataForProjectIdAndCalculationId = function (sProjectId, iCalculationId) {

        const sDeleteProjectLifecycleConfig = `
			delete from "${ Tables.project_lifecycle_configuration }" 
			where calculation_id = ? and project_id = ?
		`;

        const sHeader = `DELETE FROM "`;
        const sDeleteProductsAndValues = `" 
			WHERE CALCULATION_ID = ?
			AND ONE_TIME_COST_ID IN 
				(SELECT ONE_TIME_COST_ID 
				 FROM "${ Tables.project_one_time_cost }"
				 WHERE PROJECT_ID = ?
				)
		`;
        const sDeleteLifecyclePeriodQuantity = `
			DELETE FROM "${ Tables.lifecycle_period_value }"
			WHERE CALCULATION_ID = ? AND PROJECT_ID = ?
		`;

        dbConnection.executeUpdate(sDeleteProjectLifecycleConfig, iCalculationId, sProjectId);
        dbConnection.executeUpdate(sHeader + Tables.product_one_time_cost + sDeleteProductsAndValues, iCalculationId, sProjectId);
        dbConnection.executeUpdate(sHeader + Tables.project_one_time_cost_lifecycle_value + sDeleteProductsAndValues, iCalculationId, sProjectId);
        dbConnection.executeUpdate(sDeleteLifecyclePeriodQuantity, iCalculationId, sProjectId);
    };







    this.getProjectProperties = async function (sProjectId) {

        var result = await hQuery.statement('select PROJECT_ID, BUSINESS_AREA_ID, COMPANY_CODE_ID, COSTING_SHEET_ID, CONTROLLING_AREA_ID, COMPONENT_SPLIT_ID, CUSTOMER_ID, ' + 'REPORT_CURRENCY_ID, SALES_PRICE_CURRENCY_ID, SALES_DOCUMENT, PLANT_ID, PROFIT_CENTER_ID, START_OF_PROJECT, END_OF_PROJECT, START_OF_PRODUCTION, ' + 'END_OF_PRODUCTION, VALUATION_DATE, LIFECYCLE_VALUATION_DATE, LIFECYCLE_PERIOD_INTERVAL, EXCHANGE_RATE_TYPE_ID, MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID from "' + Tables.project + '" where project_id = ?').execute(sProjectId);
        return result[0] || null;
    };







    this.getFrozenVersions = function (sProjectId) {
        var sStatement = [
            'select calcVersion.calculation_version_id from  "' + Tables.calculation_version + '" as calcVersion',
            ' inner join "' + Tables.calculation + '" as calc',
            ' on calcVersion.calculation_id = calc.calculation_id',
            ' where calc.project_id = ? and calcVersion.is_frozen = 1'
        ].join(' ');
        return dbConnection.executeQuery(sStatement, sProjectId);

    };










    this.getSourceVersionsWithMasterVersionsFromDifferentProjects = async function (sProjectId) {

        try {


            var oStatement = hQuery.statement(`select distinct calcVers.CALCULATION_VERSION_ID, calcVers.CALCULATION_ID, calcVers.CALCULATION_VERSION_NAME 
			            from "${ Tables.calculation_version }" calcVers 
			            inner join 
			                (select REFERENCED_CALCULATION_VERSION_ID, CALCULATION_VERSION_ID from "${ Tables.item }"
					         union 
					         select REFERENCED_CALCULATION_VERSION_ID, CALCULATION_VERSION_ID from "${ Tables.item_temporary }"
					         ) item 
					         on item.REFERENCED_CALCULATION_VERSION_ID = calcVers.CALCULATION_VERSION_ID 
					    inner join "${ Tables.calculation }" calc 
					        on calc.CALCULATION_ID = calcVers.CALCULATION_ID and calc.PROJECT_ID = ? 
					    inner join "${ Tables.calculation_version }" calcVers1 
					        on item.CALCULATION_VERSION_ID = calcVers1.CALCULATION_VERSION_ID 
					    inner join "${ Tables.calculation }" calc1 
					        on calc1.CALCULATION_ID = calcVers1.CALCULATION_ID and calc1.PROJECT_ID != ?`);
            var aCalculationVersions = await oStatement.execute(sProjectId, sProjectId);

        } catch (e) {
            const sClientMsg = 'Error during the selection of source versions that have master versions in a different project.';
            const sServerMsg = `${ sClientMsg } Project id: {sProjectId}.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        return aCalculationVersions;
    };











    this.isLifecycleCalculationRunningForProject = function (sProjectId) {
        let sParameters = JSON.stringify({ PROJECT_ID: sProjectId });
        let sStmt = `select count(*) as rowcount
						from "${ Tables.task }" 
						where 
							task_type = 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS'
							and (status = 'inactive' or status = 'active')
							and parameters = ?         -- the parameters indicate the given project
					`;

        let oResult = dbConnection.executeQuery(sStmt, sParameters);

        return parseInt(oResult[0].ROWCOUNT, 10) > 0;
    };











    this.createTotalQuantities = function (aTotalQuantities, sProjectId) {

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

        var sTotalQuantityStmt = `insert into "${ Tables.project_lifecycle_configuration }"
			( PROJECT_ID, CALCULATION_ID, CALCULATION_VERSION_ID, MATERIAL_PRICE_SURCHARGE_STRATEGY, ACTIVITY_PRICE_SURCHARGE_STRATEGY, LAST_MODIFIED_ON, LAST_MODIFIED_BY )
			values (?, ?, ?, ?, ?, current_utctimestamp, '${ $.getPlcUsername() }' )
		`;
        dbConnection.executeUpdate(sTotalQuantityStmt, aTQValues);

        var sRuleIdStmt = `select project_id, calculation_id from "${ Tables.project_lifecycle_configuration }" where ${ _.map(aCalculationIds, iId => 'calculation_id = ?').join(' or ') }`;
        aCalculationIds.unshift(sRuleIdStmt);



        var aRuleIdResult = dbConnection.executeQuery.apply(dbConnection, aCalculationIds);

        var aLifecycleValues = [];
        _.each(aTotalQuantities, oTotalQuantity => {
            _.each(oTotalQuantity.PERIOD_VALUES, oPeriod => {
                var aValues = [];
                aValues.push(oPeriod.LIFECYCLE_PERIOD_FROM);
                aValues.push(oPeriod.VALUE);
                aValues.push(sProjectId);
                aValues.push(oTotalQuantity.CALCULATION_ID);
                aLifecycleValues.push(aValues);
            });
        });
        if (aLifecycleValues.length > 0) {
            var sLifecycleStmt = `insert into "${ Tables.lifecycle_period_value }" (LIFECYCLE_PERIOD_FROM, VALUE, PROJECT_ID, CALCULATION_ID, LAST_MODIFIED_ON, LAST_MODIFIED_BY) values ( ?, ?, ?, ?, current_utctimestamp, '${ $.getPlcUsername() }')`;
            dbConnection.executeUpdate(sLifecycleStmt, aLifecycleValues);
        }

        return aTotalQuantities;
    };















    this.createSurcharges = async function (sProjectId, aSurchargeDefinitions, sBusinessObjectType) {
        var aDefinitionProperties;
        var sSurchargeDefinitionTable;
        var sSurchargeValueTable;

        if (aSurchargeDefinitions.length == 0) {
            return aSurchargeDefinitions;
        }

        switch (sBusinessObjectType) {
        case BusinessObjectTypes.ProjectActivityPriceSurcharges:
            aDefinitionProperties = [
                'PLANT_ID',
                'ACCOUNT_GROUP_ID',
                'COST_CENTER_ID',
                'ACTIVITY_TYPE_ID'
            ];
            sSurchargeDefinitionTable = Tables.project_activity_price_surcharges;
            sSurchargeValueTable = Tables.project_activity_price_surcharge_values;
            break;
        case BusinessObjectTypes.ProjectMaterialPriceSurcharges:
            aDefinitionProperties = [
                'PLANT_ID',
                'ACCOUNT_GROUP_ID',
                'MATERIAL_GROUP_ID',
                'MATERIAL_TYPE_ID',
                'MATERIAL_ID'
            ];
            sSurchargeDefinitionTable = Tables.project_material_price_surcharges;
            sSurchargeValueTable = Tables.project_material_price_surcharge_values;
            break;
        default: {
                const sLogMessage = `The business object type '${ sBusinessObjectType }' is not supported by createSurcharges`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        var aDefinitionEntries = [];
        var aValueEntries = [];
        _.each(aSurchargeDefinitions, oSurchargeDefinition => {

            var aDefinitionEntryValues = [];
            var iRuleId = this.helper.getNextSequenceID(Sequences.rule_id);
            aDefinitionEntryValues.push(iRuleId);
            _.each(aDefinitionProperties, sDefinitionProperty => {
                aDefinitionEntryValues.push(oSurchargeDefinition[sDefinitionProperty]);
            });
            aDefinitionEntries.push(aDefinitionEntryValues);


            _.each(oSurchargeDefinition.PERIOD_VALUES, oValue => {
                let aValues = [];
                aValues.push(oValue.LIFECYCLE_PERIOD_FROM);
                aValues.push(oValue.VALUE);
                aValues.push(iRuleId);
                aValueEntries.push(aValues);
            });
        });


        let sDefinitionStmt = `insert into "${ sSurchargeDefinitionTable }" 
					( RULE_ID, ${ aDefinitionProperties.join(', ') }, PROJECT_ID )
			values  ( ?, ${ _.map(aDefinitionProperties, iId => '?').join(', ') }, '${ sProjectId }' )
		`;
        dbConnection.executeUpdate(sDefinitionStmt, aDefinitionEntries);


        if (aValueEntries.length > 0) {
            let sValueStmt = `insert into "${ sSurchargeValueTable }" (LIFECYCLE_PERIOD_FROM, VALUE, RULE_ID) values ( ?, ?, ? )`;
            dbConnection.executeUpdate(sValueStmt, aValueEntries);
        }

        return aSurchargeDefinitions;
    };











    this.createYearlyLifecyclePeriodTypesForProject = function (sProjectId, iLowestValidPeriodFrom, iHighestValidPeriodFrom) {
        let sStmt = `insert into "${ Tables.project_lifecycle_period_type }" (PROJECT_ID, YEAR, PERIOD_TYPE, IS_YEAR_SELECTED, LAST_MODIFIED_ON, LAST_MODIFIED_BY) values ('${ sProjectId }', ?, 'YEARLY', 1, current_utctimestamp, '${ $.getPlcUsername() }');`;




        let sStmtForMonthlyPeriods = `insert into "${ Tables.project_monthly_periods }" (PROJECT_ID, YEAR, SELECTED_MONTH, MONTH_DESCRIPTION, LAST_MODIFIED_ON, LAST_MODIFIED_BY) values ('${ sProjectId }', ?, 1, '01', current_utctimestamp, '${ $.getPlcUsername() }');`;
        let aYearsToBeInserted = _.range(iLowestValidPeriodFrom, iHighestValidPeriodFrom + 1);
        aYearsToBeInserted.forEach(iYear => {
            dbConnection.executeUpdate(sStmt, iYear);
            dbConnection.executeUpdate(sStmtForMonthlyPeriods, iYear);
        });
    };














    this.createMonthlyAndQuarterlyPeriods = function (sProjectId, sPeriodType, iFrom, iTo, bTriggeredForStarDate) {
        let iYearDb = bTriggeredForStarDate === true ? Math.trunc(iFrom / 12 + 1900) : Math.trunc(iTo / 12 + 1900);
        let sInsertPeriodsStmt = `insert into "${ Tables.project_monthly_periods }" (PROJECT_ID, YEAR, SELECTED_MONTH, MONTH_DESCRIPTION, LAST_MODIFIED_ON, LAST_MODIFIED_BY) values ('${ sProjectId }', ?, ?, ?, current_utctimestamp, '${ $.getPlcUsername() }');`;
        if (sPeriodType === 'MONTHLY') {

            let iRangeStartValue = bTriggeredForStarDate === true ? iFrom % 12 + 1 : iFrom % 12 + 2;
            let iRangeStopValue = bTriggeredForStarDate === true ? iTo % 12 + 1 : iTo % 12 + 1 + 1;
            let aMonthsToBeInserted = _.range(iRangeStartValue, iRangeStopValue);
            let aValues = _.map(aMonthsToBeInserted, function (iMonth) {
                return [
                    iYearDb,
                    iMonth,
                    iMonth < 10 ? '0' + iMonth : iMonth
                ];
            });
            dbConnection.executeUpdate(sInsertPeriodsStmt, aValues);
        }
        if (sPeriodType === 'QUARTERLY') {







            let iRequestMonth = iFrom % 12 + 1;
            let iDbMonth = iTo % 12 + 1;
            let iFromQuarter = bTriggeredForStarDate === true ? Math.trunc((iRequestMonth + 2) / 3) : Math.trunc((iRequestMonth + 2) / 3 + 1);
            let iToQuarter = bTriggeredForStarDate === true ? Math.trunc((iDbMonth + 2) / 3 - 1) : Math.trunc((iDbMonth + 2) / 3);
            let aMonthsToBeInserted = _.range(3 * iFromQuarter - 2, 3 * iToQuarter - 2 + 1, 3);
            let aValues = _.map(aMonthsToBeInserted, function (iMonth) {
                return [
                    iYearDb,
                    iMonth,
                    'Q' + Math.trunc((iMonth + 2) / 3)
                ];
            });
            dbConnection.executeUpdate(sInsertPeriodsStmt, aValues);
        }
    };
















    this.addLifecyclePeriodTypeForProject = function (oProject, iLowestValidPeriodFrom, iHighestValidPeriodFrom, iDbLowestPeriod, iDbHighestPeriod) {
        let iLowestYearDb = Math.trunc(iDbLowestPeriod / 12 + 1900);
        let iHighestYearDb = Math.trunc(iDbHighestPeriod / 12 + 1900);


        if (oProject.START_OF_PROJECT.getFullYear() < iLowestYearDb) {


            let sPeriodType = dbConnection.executeQuery(`select upper(period_type) as PERIOD_TYPE from "${ Tables.project_lifecycle_period_type }" where project_id = ? and year = ?;`, oProject.PROJECT_ID, iLowestYearDb)[0].PERIOD_TYPE;
            if (sPeriodType === 'QUARTERLY' || sPeriodType === 'MONTHLY') {
                this.createMonthlyAndQuarterlyPeriods(oProject.PROJECT_ID, sPeriodType, (iLowestYearDb - 1900) * 12, iDbLowestPeriod, true);
            }
            this.createYearlyLifecyclePeriodTypesForProject(oProject.PROJECT_ID, oProject.START_OF_PROJECT.getFullYear(), iLowestYearDb - 1);
        }
        if (oProject.END_OF_PROJECT.getFullYear() > iHighestYearDb) {
            let sPeriodType = dbConnection.executeQuery(`select upper(period_type) as PERIOD_TYPE from "${ Tables.project_lifecycle_period_type }" where project_id = ? and year = ?;`, oProject.PROJECT_ID, iHighestYearDb)[0].PERIOD_TYPE;
            if (sPeriodType === 'QUARTERLY' || sPeriodType === 'MONTHLY') {
                this.createMonthlyAndQuarterlyPeriods(oProject.PROJECT_ID, sPeriodType, iDbHighestPeriod, (iHighestYearDb - 1900) * 12 + 11, false);
            }
            this.createYearlyLifecyclePeriodTypesForProject(oProject.PROJECT_ID, oProject.END_OF_PROJECT.getFullYear(), iHighestYearDb - 1);
        }


        if (oProject.START_OF_PROJECT.getFullYear() === iLowestYearDb && iLowestValidPeriodFrom < iDbLowestPeriod) {
            let sPeriodType = dbConnection.executeQuery(`select upper(period_type) as PERIOD_TYPE from "${ Tables.project_lifecycle_period_type }" where project_id = ? and year = ?;`, oProject.PROJECT_ID, iLowestYearDb)[0].PERIOD_TYPE;
            this.createMonthlyAndQuarterlyPeriods(oProject.PROJECT_ID, sPeriodType, iLowestValidPeriodFrom, iDbLowestPeriod, true);
        }
        if (oProject.END_OF_PROJECT.getFullYear() === iHighestYearDb && iHighestValidPeriodFrom > iDbHighestPeriod) {
            let sPeriodType = dbConnection.executeQuery(`select upper(period_type) as PERIOD_TYPE from "${ Tables.project_lifecycle_period_type }" where project_id = ? and year = ?;`, oProject.PROJECT_ID, iHighestYearDb)[0].PERIOD_TYPE;
            this.createMonthlyAndQuarterlyPeriods(oProject.PROJECT_ID, sPeriodType, iDbHighestPeriod, iHighestValidPeriodFrom, false);
        }
    };






    this.deleteAllLifecyclePeriodsForProject = function (sProjectId) {
        let aActivityPriceSurchargesStmt = `
			delete 
			from "${ Tables.project_activity_price_surcharge_values }"
			where (rule_id, lifecycle_period_from) in
		        (
		            select  period_values.rule_id,												-- since delete does not support join directly
		                    period_values.lifecycle_period_from									-- it need to be done in a sub-select
		            from "${ Tables.project_activity_price_surcharge_values }" as period_values
		                inner join "${ Tables.project_activity_price_surcharges }" as surcharges
				            on period_values.rule_id = surcharges.rule_id
			            inner join "${ Views.project_with_privileges }" as auth
				            on surcharges.project_id = auth.project_id
		            where	auth.project_id = ? and auth.user_id = ?
				);`;

        let aMaterialPriceSurchargesStmt = `
			delete 
			from "${ Tables.project_material_price_surcharge_values }"
			where (rule_id, lifecycle_period_from) in
		        (
		            select  period_values.rule_id,												-- since delete does not support join directly
		                    period_values.lifecycle_period_from									-- it need to be done in a sub-select
		            from "${ Tables.project_material_price_surcharge_values }" as period_values
		                inner join "${ Tables.project_material_price_surcharges }" as surcharges
				            on period_values.rule_id = surcharges.rule_id
			            inner join "${ Views.project_with_privileges }" as auth
				            on surcharges.project_id = auth.project_id
		            where	auth.project_id = ? and auth.user_id = ?
				);`;
        let aStmtDeleteLifecyclePeriodTypeStmt = `
				delete
				from "${ Tables.project_lifecycle_period_type }"
				where (project_id, year) in (
					select periods.project_id, periods.year
					from "${ Tables.project_lifecycle_period_type }" as periods
					inner join "${ Views.project_with_privileges }" as auth
						on periods.project_id = auth.project_id
					where auth.project_id = ? and auth.user_id = ?
				);`;
        let aStmtDeleteMonthlyLifecyclePeriodStmt = `
				delete 
				from "${ Tables.lifecycle_monthly_period }"
				where (project_id, year, selected_month) in (
					select periods.project_id, periods.year, periods.selected_month
					from "${ Tables.lifecycle_monthly_period }" as periods
					inner join "${ Views.project_with_privileges }" as auth
						on periods.project_id = auth.project_id
					where auth.project_id = ? and auth.user_id = ?
				);`;
        let aQuantitiesStmt = `
				delete 
				from "${ Tables.lifecycle_period_value }"
				where (project_id, calculation_id, lifecycle_period_from) in
					(
						select  period_values.project_id,
								period_values.calculation_id,										-- since delete does not support join directly
								period_values.lifecycle_period_from									-- it need to be done in a sub-select
						from "${ Tables.lifecycle_period_value }" as period_values
							inner join "${ Views.project_with_privileges }" as auth
								on auth.project_id = period_values.project_id
						where	auth.project_id = ? and auth.user_id = ?
					);`;
        let aValuesToDeleteAll = [
            sProjectId,
            $.getPlcUsername()
        ];
        dbConnection.executeUpdate(aQuantitiesStmt, [aValuesToDeleteAll]);
        dbConnection.executeUpdate(aStmtDeleteMonthlyLifecyclePeriodStmt, [aValuesToDeleteAll]);
        dbConnection.executeUpdate(aStmtDeleteLifecyclePeriodTypeStmt, [aValuesToDeleteAll]);
        dbConnection.executeUpdate(aMaterialPriceSurchargesStmt, [aValuesToDeleteAll]);
        dbConnection.executeUpdate(aActivityPriceSurchargesStmt, [aValuesToDeleteAll]);
    };








    this.deleteLifecyclePeriodsData = function (sProjectId, dStartDate, dEndDate) {
        let aStmtDeleteLifecyclePeriodTypeStmt = `
			delete
			from "${ Tables.project_lifecycle_period_type }"
			where (project_id, year) in(
				select periods.project_id, periods.year
				from "${ Tables.project_lifecycle_period_type }" as periods
				inner join "${ Views.project_with_privileges }" as auth
					on periods.project_id = auth.project_id
				where auth.project_id = ? and auth.user_id = ?
				and (periods.year < ? or periods.year > ?)
			);`;

        let aStmtDeleteMonthlyLifecyclePeriodStmt = `
			delete 
			from "${ Tables.lifecycle_monthly_period }"
			where (project_id, year, selected_month) in (
				select periods.project_id, periods.year, periods.selected_month
				from "${ Tables.lifecycle_monthly_period }" as periods
				inner join "${ Views.project_with_privileges }" as auth
					on periods.project_id = auth.project_id
				inner join "${ Tables.project_lifecycle_period_type }" as types
					on periods.project_id = types.project_id
					and periods.year = types.year
				where auth.project_id = ? and auth.user_id = ? and upper(types.period_type) = ? 
				and (
					((periods.year = ? and periods.selected_month < ?) or periods.year < ?)
					or 
					((periods.year = ? and periods.selected_month > ?) or periods.year > ?)
				)
			);`;







        let iLowerMonthFirstQuarter = dStartDate.getMonth() - dStartDate.getMonth() % 3 + 1;

        let aPeriodValues = [
            sProjectId,
            $.getPlcUsername()
        ];
        let aPeriodValuesForMonthlyEntries = [
            sProjectId,
            $.getPlcUsername(),
            'CUSTOM'
        ];
        let aPeriodValuesForCustomEntries = [
            sProjectId,
            $.getPlcUsername(),
            'MONTHLY'
        ];
        let aPeriodValuesForQuarterlyEntries = [
            sProjectId,
            $.getPlcUsername(),
            'QUARTERLY'
        ];
        let aPeriodValuesForYearlyEntries = [
            sProjectId,
            $.getPlcUsername(),
            'YEARLY'
        ];
        let aValues = [];


        aPeriodValues.push(dStartDate.getFullYear());
        aValues.push(dStartDate.getFullYear(), dStartDate.getMonth() + 1, dStartDate.getFullYear());
        aPeriodValuesForQuarterlyEntries.push(dStartDate.getFullYear(), iLowerMonthFirstQuarter, dStartDate.getFullYear());
        aPeriodValuesForYearlyEntries.push(dStartDate.getFullYear(), 1, dStartDate.getFullYear());


        aPeriodValues.push(dEndDate.getFullYear());
        aValues.push(dEndDate.getFullYear(), dEndDate.getMonth() + 1, dEndDate.getFullYear());
        aPeriodValuesForQuarterlyEntries.push(dEndDate.getFullYear(), dEndDate.getMonth() + 1, dEndDate.getFullYear());
        aPeriodValuesForYearlyEntries.push(dEndDate.getFullYear(), 1, dEndDate.getFullYear());

        aPeriodValuesForMonthlyEntries = aPeriodValuesForMonthlyEntries.concat(aValues);
        aPeriodValuesForCustomEntries = aPeriodValuesForCustomEntries.concat(aValues);


        dbConnection.executeUpdate(aStmtDeleteMonthlyLifecyclePeriodStmt, [
            aPeriodValuesForMonthlyEntries,
            aPeriodValuesForCustomEntries,
            aPeriodValuesForQuarterlyEntries,
            aPeriodValuesForYearlyEntries
        ]);

        dbConnection.executeUpdate(aStmtDeleteLifecyclePeriodTypeStmt, [aPeriodValues]);
    };







    this.deleteLifecycleQuantitiesData = function (sProjectId) {
        let aQuantitiesStmt = `
			delete 
			from "${ Tables.lifecycle_period_value }"
			where (project_id, calculation_id, lifecycle_period_from) not in
				(
					select  period_values.project_id,
							period_values.calculation_id,										-- since delete does not support join directly
							period_values.lifecycle_period_from									-- it need to be done in a sub-select
					from "${ Tables.lifecycle_period_value }" as period_values
						inner join "${ Tables.lifecycle_monthly_period }" as periods
							on period_values.project_id = periods.project_id
							and to_integer(period_values.lifecycle_period_from / 12 + 1900) = periods.year
							and mod(period_values.lifecycle_period_from, 12) + 1 = periods.selected_month
						inner join "${ Views.project_with_privileges }" as auth
							on auth.project_id = periods.project_id
					where	auth.project_id = ?
							and auth.user_id = ?
				)
			and project_id = ?;`;
        let aValues = [
            sProjectId,
            $.getPlcUsername(),
            sProjectId
        ];
        dbConnection.executeUpdate(aQuantitiesStmt, [aValues]);
    };







    this.deleteLifecycleOneTimeCostData = function (sProjectId) {

        let aOneTimeCostDeleteStmt = `
			delete 
			from "${ Tables.project_one_time_cost_lifecycle_value }"
			where (one_time_cost_id, calculation_id, lifecycle_period_from) not in
				(
					select  onetimecost.one_time_cost_id,
							onetimecost.calculation_id,										    -- since delete does not support join directly
							onetimecost.lifecycle_period_from									-- it need to be done in a sub-select
					from "${ Tables.project_one_time_cost_lifecycle_value }" as onetimecost
						inner join "${ Tables.lifecycle_monthly_period }" as periods
							on to_integer(onetimecost.lifecycle_period_from / 12 + 1900) = periods.year
							and mod(onetimecost.lifecycle_period_from, 12) + 1 = periods.selected_month
						inner join "${ Tables.project_one_time_cost }" as projectonetimecost
							on projectonetimecost.project_id = periods.project_id
							and projectonetimecost.one_time_cost_id = onetimecost.one_time_cost_id
						inner join "${ Views.project_with_privileges }" as auth
							on auth.project_id = periods.project_id
					where	auth.project_id = ?
							and auth.user_id = ?
				)
			and one_time_cost_id in (
				select one_time_cost_id
				from "${ Tables.project_one_time_cost }"
				where project_id = ?
			);`;
        let aValues = [
            sProjectId,
            $.getPlcUsername(),
            sProjectId
        ];
        dbConnection.executeUpdate(aOneTimeCostDeleteStmt, [aValues]);


        let fnRecalculateOneTimeCosts = dbConnection.loadProcedure(Procedures.project_calculate_one_time_costs);
        fnRecalculateOneTimeCosts(sProjectId);
    };








    this.deleteLifecycleSurchargesData = function (sProjectId, dStartDate, dEndDate) {
        let aActivityPriceSurchargesStmt = `
			delete 
			from "${ Tables.project_activity_price_surcharge_values }"
			where (rule_id, lifecycle_period_from) in
		        (
		            select  period_values.rule_id,												-- since delete does not support join directly
		                    period_values.lifecycle_period_from									-- it need to be done in a sub-select
		            from "${ Tables.project_activity_price_surcharge_values }" as period_values
		                inner join "${ Tables.project_activity_price_surcharges }" as surcharges
				            on period_values.rule_id = surcharges.rule_id
			            inner join "${ Views.project_with_privileges }" as auth
				            on surcharges.project_id = auth.project_id
		            where	auth.project_id = ?
							and auth.user_id = ?
							and (period_values.lifecycle_period_from < ? or period_values.lifecycle_period_from > ?)
				);`;

        let aMaterialPriceSurchargesStmt = `
			delete 
			from "${ Tables.project_material_price_surcharge_values }"
			where (rule_id, lifecycle_period_from) in
		        (
		            select  period_values.rule_id,												-- since delete does not support join directly
		                    period_values.lifecycle_period_from									-- it need to be done in a sub-select
		            from "${ Tables.project_material_price_surcharge_values }" as period_values
		                inner join "${ Tables.project_material_price_surcharges }" as surcharges
				            on period_values.rule_id = surcharges.rule_id
			            inner join "${ Views.project_with_privileges }" as auth
				            on surcharges.project_id = auth.project_id
		            where	auth.project_id = ?
							and auth.user_id = ?
							and (period_values.lifecycle_period_from < ? or period_values.lifecycle_period_from > ?)
				);`;
        let aValues = [
            sProjectId,
            $.getPlcUsername(),
            dStartDate.getFullYear() + dStartDate.getMonth(),
            dEndDate.getFullYear() + dEndDate.getMonth()
        ];
        dbConnection.executeUpdate(aMaterialPriceSurchargesStmt, [aValues]);
        dbConnection.executeUpdate(aActivityPriceSurchargesStmt, [aValues]);
    };



















    this.deleteLifecyclePeriodsForProject = function (sProjectId, dStartDate = null, dEndDate = null) {

        if (dStartDate === null || dEndDate === null) {
            this.deleteAllLifecyclePeriodsForProject(sProjectId);
            return;
        }

        this.deleteLifecyclePeriodsData(sProjectId, dStartDate, dEndDate);
        this.deleteLifecycleQuantitiesData(sProjectId);
        this.deleteLifecycleOneTimeCostData(sProjectId);
        this.deleteLifecycleSurchargesData(sProjectId, dStartDate, dEndDate);
    };








    this.deleteTotalQuantitiesForProject = function (sProjectId) {
        var sStmt = `
				delete from "${ Tables.project_lifecycle_configuration }"
				where calculation_id in
					(
						select calculation_id
						from "${ Tables.calculation }" as calculations
							inner join "${ Views.project_with_privileges }" as auth
								on calculations.project_id = auth.project_id
						where auth.project_id = ?
					)
		`;

        dbConnection.executeUpdate(sStmt, sProjectId);


        this.cleanUpLifecyclePeriodsValues(Tables.project_lifecycle_configuration, Tables.lifecycle_period_value);
    };







    this.deleteSurchargesForProject = async function (sProjectId, sBusinessObjectType) {
        var sDefinitionTable;
        var sValueTable;

        switch (sBusinessObjectType) {
        case BusinessObjectTypes.ProjectActivityPriceSurcharges:
            sDefinitionTable = Tables.project_activity_price_surcharges;
            sValueTable = Tables.project_activity_price_surcharge_values;
            break;
        case BusinessObjectTypes.ProjectMaterialPriceSurcharges:
            sDefinitionTable = Tables.project_material_price_surcharges;
            sValueTable = Tables.project_material_price_surcharge_values;
            break;
        default: {
                const sLogMessage = `The business object type '${ sBusinessObjectType }' is not supported by deleteSurchargesForProject.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        var sStmt = `
				delete from "${ sDefinitionTable }" 
				where project_id in 
					( 
						select project_id 
						from "${ Views.project_with_privileges }"
						where project_id = ? 
					)
		`;

        dbConnection.executeUpdate(sStmt, sProjectId);


        this.cleanUpLifecyclePeriods(sDefinitionTable, sValueTable);
    };









    this.cleanUpLifecyclePeriods = function (sDefinitionTable, sValueTable) {
        var sStmt = `
				delete from "${ sValueTable }" 
				where rule_id not in 
					( select rule_id from "${ sDefinitionTable }" )
		`;
        dbConnection.executeUpdate(sStmt);
    };








    this.cleanUpLifecyclePeriodsValues = function (sDefinitionTable, sValueTable) {
        var sStmt = `
				delete from "${ sValueTable }" a
				where not exists
					( select project_id, calculation_id from "${ sDefinitionTable }" b where a.project_id = b.project_id and a.calculation_id = b.calculation_id )
		`;
        dbConnection.executeUpdate(sStmt);
    };














    this.getTotalQuantities = function (sProjectId) {
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
				from "${ Tables.calculation }" as calculation
					inner join "${ Views.project_with_privileges }" as project
						on calculation.project_id = project.project_id
					left outer join "${ Tables.project_lifecycle_configuration }" as total_quantities
						on total_quantities.calculation_id = calculation.calculation_id
					left outer join "${ Tables.calculation_version }" as calculation_version
						on total_quantities.calculation_version_id = calculation_version.calculation_version_id
							and calculation_version.calculation_id = calculation.calculation_id
					left outer join "${ Tables.item }" as item
						on item.calculation_version_id = total_quantities.calculation_version_id
					left outer join "${ Tables.lifecycle_period_value }" as period_values
						on total_quantities.project_id = period_values.project_id
						and total_quantities.calculation_id = period_values.calculation_id
					left outer join (																			-- join with a sub-select in order to determine the number of saved versions
						select 	to_int(count(calculation_version_id)) as calculation_version_count,				-- of a calculation; quantities shall only be delivered for a calculation
								calculation_id																	-- with min. 1 saved version
						from "${ Tables.calculation_version }"													-- this is done via the sub-select in order to avoid producing additional 
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














    this.getActivityPriceSurcharges = function (sProjectId, sLanguage) {

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
				from "${ Views.project_with_privileges }" as project
				inner join "${ Tables.project_activity_price_surcharges }" as surcharges
					on surcharges.project_id = project.project_id
				left outer join "${ Tables.project_activity_price_surcharge_values }" as surcharge_values 	-- join on values if those exist
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














    this.getMaterialPriceSurcharges = function (sProjectId, sLanguage) {

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
				from "${ Views.project_with_privileges }" as project
				inner join "${ Tables.project_material_price_surcharges }" as surcharges
					on surcharges.project_id = project.project_id
				left outer join "${ Tables.project_material_price_surcharge_values }" as surcharge_values 	-- join on values if those exist
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













    this.getOverlappingAccountsInProjectSurcharges = (sProjectId, sBusinessObjectType) => {
        var sDefinitionTable;
        var sGroupingStatement;
        let sUserId = $.getPlcUsername();

        switch (sBusinessObjectType) {
        case BusinessObjectTypes.ProjectActivityPriceSurcharges:
            sDefinitionTable = Tables.project_activity_price_surcharges;
            sGroupingStatement = 'account.account_id, surcharges.plant_id, surcharges.cost_center_id, surcharges.activity_type_id';
            break;
        case BusinessObjectTypes.ProjectMaterialPriceSurcharges:
            sDefinitionTable = Tables.project_material_price_surcharges;
            sGroupingStatement = 'account.account_id, surcharges.plant_id, surcharges.material_group_id, surcharges.material_type_id, surcharges.material_id';
            break;
        default: {
                const sLogMessage = `The business object type '${ sBusinessObjectType }' is not supported by getOverlappingAccountsInProjectSurcharges.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        let sStatement = ` 
		select	account.account_id,																		-- selects the accounts of account groups from surcharge definition for given project
				account_group.account_group_id
				from "${ Views.project_with_privileges }" as project
				inner join "${ sDefinitionTable }" as surcharges
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
							from "${ Views.project_with_privileges }" as project
							inner join "${ sDefinitionTable }" as surcharges
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
							group by ${ sGroupingStatement }
						) where account_group_count > 1
					) overlapping_accounts
					on overlapping_accounts.account_id = account.account_id
				
				where 	project.project_id = ? and project.user_id = ?;	
		`;

        var aResult = dbConnection.executeQuery(sStatement, sProjectId, sUserId, sProjectId, sUserId);

        return aResult;
    };












    this.getTotalQuantityDefinitions = sProjectId => {
        let sStmt = `
			select 	total_quantities.calculation_id,
					total_quantities.calculation_version_id,
					total_quantities.last_modified_on,
					total_quantities.last_modified_by
			from "${ Tables.project_lifecycle_configuration }" as total_quantities
				inner join "${ Tables.calculation }" as calculation
					on total_quantities.calculation_id = calculation.calculation_id
				inner join "${ Views.project_with_privileges }" as project
					on calculation.project_id = project.project_id
			where project.project_id = ? and project.user_id = ?;
		`;
        var aResult = dbConnection.executeQuery(sStmt, sProjectId, $.getPlcUsername());
        return aResult;
    };







    this.checkProjectIdSameAsSourceEntityId = (sProjectId, iSourceEntityId) => {
        const iEntityIdCount = parseInt(dbConnection.executeQuery(`select count(ENTITY_ID) as COUNT from "sap.plc.db::basis.t_project" where PROJECT_ID = ? and ENTITY_ID = ?`, sProjectId, iSourceEntityId)[0].COUNT);
        if (iEntityIdCount === 0) {
            const sClientMsg = 'Missmatch between project entity id and requested source entity id';
            const sServerMsg = `${ sClientMsg }. Project id: [${ sProjectId }], Source entity id:[${ iSourceEntityId }]`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
    };






    this.checkProjectsExist = (aProjectsIds, sUserId) => {
        const aExistingProjects = dbConnection.executeQuery(`select project_id from "sap.plc.db.authorization::privileges.v_project_read" where project_id in ('${ aProjectsIds.join("','") }') and USER_ID = '${ sUserId }'`).map(project => project.PROJECT_ID);
        const aInvalidIds = aProjectsIds.filter(id => !aExistingProjects.includes(id));
        if (aInvalidIds.length > 0) {
            const sClientMsg = 'At least one of the projects does not exist.';
            const sServerMsg = `${ sClientMsg } : [${ aInvalidIds.toString() }]`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }
    };









    this.checkMasterdataReferences = async function (oProjectMasterdata, mParameters, aPropertiesToBeChecked) {
        const dTimestamp = new Date();
        const oProject = { 'project_id': mParameters.id };
        const sControllingAreaId = getControllingAreaForParameter(oProject);
        const sStmtInsert = `insert into "${ Tables.gtt_masterdata_validator }" 
								("COLUMN_ID", "VALUE") 
								values (?, ?);`;

        for (property in oProjectMasterdata) {
            oProjectMasterdata[property].forEach(value => {
                dbConnection.executeUpdate(sStmtInsert, property, value);
            });
        }

        const procedure = dbConnection.loadProcedure(Procedures.materdata_references_validator);
        procedure(dTimestamp, sControllingAreaId);

        const sStmtCheckErrors = `select * from "${ Tables.gtt_masterdata_validator }" where
									"COLUMN_ID" IN ('${ aPropertiesToBeChecked.join("','") }');`;
        const aErrors = dbConnection.executeQuery(sStmtCheckErrors);

        if (aErrors.length > 0) {
            let sLogMessage = `Error while checking masterdata references. `;
            aErrors.forEach(err => {
                sLogMessage += `Property '${ err.COLUMN_ID }' with the value '${ err.VALUE }' is not valid. `;
            });
            sLogMessage += `Temporary values are not allowed.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR, sLogMessage);
        }


        const sStmtDelete = `DELETE FROM "${ Tables.gtt_masterdata_validator }";`;
        dbConnection.executeUpdate(sStmtDelete);
    };
}
Project.prototype = await Object.create(Project.prototype);
Project.prototype.constructor = Project;
export default {_,Helper,Misc,Session,Metadata,helpers,MasterdataResources,BusinessObjectsEntities,Constants,BusinessObjectTypes,UrlToSqlConverter,Limits,Privilege,AuthorizationManager,InstancePrivileges,MessageLibrary,PlcException,ValidationInfoCode,Code,MessageDetails,Tables,Procedures,Views,Sequences,Project};
