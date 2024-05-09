const _ = $.require('lodash');
const Helper = $.require('./persistency-helper').Helper;
const Misc = $.require('./persistency-misc').Misc;
const helpers = $.require('../util/helpers');
const constants = $.require('../util/constants');

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

var Tables = await Object.freeze({
    calculation: 'sap.plc.db::basis.t_calculation',
    calculation_version: 'sap.plc.db::basis.t_calculation_version',
    status: 'sap.plc.db::basis.t_status',
    calculation_version_temporary: 'sap.plc.db::basis.t_calculation_version_temporary',
    open_calculation_versions: 'sap.plc.db::basis.t_open_calculation_versions',
    session: 'sap.plc.db::basis.t_session',
    project: 'sap.plc.db::basis.t_project',
    item: 'sap.plc.db::basis.t_item',
    item_temporary: 'sap.plc.db::basis.t_item_temporary',
    project_lifecycle_configuration: 'sap.plc.db::basis.t_project_lifecycle_configuration',
    lifecycle_period_value: 'sap.plc.db::basis.t_project_lifecycle_period_quantity_value'
});

const Views = await Object.freeze({ calculation_with_privileges: 'sap.plc.db.authorization::privileges.v_calculation_read' });

const Procedures = await Object.freeze({
    calculation_create_as_copy: 'sap.plc.db.calculationmanager.procedures::p_calculation_create_as_copy',
    calculation_delete: 'sap.plc.db.calculationmanager.procedures::p_calculation_delete'
});

const Sequences = await Object.freeze({
    calculation: 'sap.plc.db.sequence::s_calculation',
    calculation_version: 'sap.plc.db.sequence::s_calculation_version'
});

const DefaultValues = await Object.freeze({
    newEntityIsDirty: 1,
    newEntityLock: 1
});

/**
 * Creates a new Calculation object.
 */
async function Calculation(dbConnection, hQuery) {
    var oMessageDetails = new MessageDetails();
    this.helper = await new Helper($, hQuery, dbConnection);
    this.misc = await new Misc($, hQuery, $.getPlcUsername());

    // to avoid unnecessary $.import callings to improve performance, delay loading and creating of below objects
    Object.defineProperties(this, {
        calculationVersion: {
            get: () => {
                return (() => {
                    if (undefined === this._calculationVersion) {
                        var CalculationVersion = $.require('./persistency-calculationVersion').CalculationVersion;
                        this._calculationVersion = await new CalculationVersion($, dbConnection, hQuery, $.getPlcUsername());
                    }
                    return this._calculationVersion;
                })();
            }
        },
        project: {
            get: () => {
                return (() => {
                    if (undefined === this._project) {
                        var Project = $.import('xs.db', 'persistency-project').Project;
                        this._project = await new Project(dbConnection, hQuery);
                    }
                    return this._project;
                })();
            }
        }
    });

    async function checkCalculationIdIsPositiveInteger(iCalculationId) {
        if (!helpers.isPositiveInteger(iCalculationId)) {
            const sLogMessage = 'iCalculationId must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
    }

    this.setiTopCalculations = iTopCalculations => {
        if (!helpers.isNullOrUndefined(iTopCalculations)) {
            this.iTopCalculations = iTopCalculations;
        }
    };

    this.getiTopCalculations = () => {
        return this.iTopCalculations;
    };


    this.iTopCalculations = constants.SQLMaximumInteger;

    /**
	 * Gets all calculations or calculations for some projects. 
	 * @param {array}
	 *            aProjects - array of project ids
	 * @param {string}
	 *            sUserId - the id of the logged in user
	 * @param {array}
	 *            aCalculationIds - array of aCalculationIds
	 * @param {integer}
	 *            itopPerProject - number of calculation that must be retrieved for each project
	 *            					this limitation was introduced for one client because our front-end crashed for 40000 calculation retrieved
	 * @param {string}
	 *            sSearchCriteria - used to retrieve calculations for which the CALCULATION_NAME or CALCULATION_ID contain a given string
	 * @param {integer} 
	 * 			  iTopCalculations - total number of calculations that should be returned
	 * @returns {object} output - An object that contains all found calculations
	 */
    this.get = async function (aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria, iTopCalculations) {
        if (await helpers.isNullOrUndefined(itopPerProject)) {
            itopPerProject = constants.parameterCalculationTopValues.defaultTopPerProject;
        } else if (itopPerProject > constants.parameterCalculationTopValues.maximumTopPerProject) {
            itopPerProject = constants.parameterCalculationTopValues.maximumTopPerProject;
        }

        this.setiTopCalculations(iTopCalculations);

        var aValues = [];

        var sStmt = `select top ? CALCULATION_ID, PROJECT_ID, CALCULATION_NAME, CURRENT_CALCULATION_VERSION_ID, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY, CALCULATION_VERSION_NO from 
		    ( select ROW_NUMBER() OVER (PARTITION BY PROJECT_ID ORDER BY CALCULATION_NAME) ROW_NUMBER, calc.CALCULATION_ID, calc.PROJECT_ID, calc.CALCULATION_NAME, calc.CURRENT_CALCULATION_VERSION_ID,
            calc.CREATED_ON, calc.CREATED_BY, calc.LAST_MODIFIED_ON, calc.LAST_MODIFIED_BY, ifnull(countVersions.CALCULATION_VERSION_NO,0) as CALCULATION_VERSION_NO
            from "${ Views.calculation_with_privileges }" as calc
            LEFT OUTER JOIN
            ( select TO_INT(COUNT(CALCULATION_VERSION_ID)) AS CALCULATION_VERSION_NO, CALCULATION_ID
				from "${ Tables.calculation_version }" group by CALCULATION_ID 
				union 
                select TO_INT(COUNT(CALCULATION_VERSION_ID)) AS CALCULATION_VERSION_NO, CALCULATION_ID
                from "${ Tables.calculation_version_temporary }"   group by CALCULATION_ID	
				) AS countVersions
            ON calc.CALCULATION_ID = countVersions.CALCULATION_ID
            where calc.USER_ID = ? and calc.CURRENT_CALCULATION_VERSION_ID is not null and CALCULATION_VERSION_NO <> 0`;

        aValues.push(this.getiTopCalculations());
        aValues.push(sUserId);

        if (!helpers.isNullOrUndefined(aProjects) && aProjects.length > 0) {
            sStmt += ' and (';
            _.each(aProjects, function (sProjectId, iIndex) {
                sStmt += ' calc.PROJECT_ID = ?';
                aValues.push(sProjectId);
                if (iIndex < aProjects.length - 1) {
                    sStmt += ' OR';
                }
            });
            sStmt += ' )';
        }

        if (!helpers.isNullOrUndefined(aCalculationIds) && aCalculationIds.length > 0) {
            sStmt += ' and (';
            _.each(aCalculationIds, function (sCalculationId, iIndex) {
                sStmt += ' calc.CALCULATION_ID = ?';
                aValues.push(sCalculationId);
                if (iIndex < aCalculationIds.length - 1) {
                    sStmt += ' OR';
                }
            });
            sStmt += ' )';
        }
        if (!helpers.isNullOrUndefined(sSearchCriteria)) {
            sStmt += ` and (
							upper(calc.CALCULATION_NAME) like upper('%'|| ? || '%')
							or
							calc.CALCULATION_ID like ('%'|| ? || '%')
						)`;
            aValues.push(sSearchCriteria, sSearchCriteria);
        }

        sStmt += ' ) where ROW_NUMBER <= ?';
        aValues.push(itopPerProject);

        var selectStmt = hQuery.statement(sStmt);

        var aResult = [];
        try {
            aResult = await selectStmt.execute(aValues);
        } catch (e) {
            const sClientMsg = 'Get calculations failed. Please refer to server log.';
            const sServerMsg = `${ sClientMsg } Error message: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        return { calculations: aResult };

    };

    /**
	 * Gets only the saved calculations. 
	 * @param {array}
	 *            aProjects - array of project ids
	 * @param {string}
	 *            sUserId - the id of the logged in user
	 * @param {array}
	 *            aCalculationIds - array of aCalculationIds
	 * @param {integer}
	 *            itopPerProject - number of calculation that must be retrieved for each project
	 *            					this limitation was introduced for one client because our front-end crashed for 40000 calculation retrieved
	 * @param {string}
	 *            sSearchCriteria - used to retrieve calculations for which the CALCULATION_NAME or CALCULATION_ID contain a given string
	 * @param {integer} 
	 * 			  iTopCalculations - total number of calculations that should be returned
	 * @returns {object} output - An object that contains all found calculations
	 */
    this.getSaved = async function (aProjects, sUserId, aCalculationIds, itopPerProject, sSearchCriteria, iTopCalculations) {
        if (await helpers.isNullOrUndefined(itopPerProject)) {
            itopPerProject = 100;
        }

        this.setiTopCalculations(iTopCalculations);

        var aValues = [];

        var sStmt = `select top ? CALCULATION_ID, PROJECT_ID, CALCULATION_NAME, CURRENT_CALCULATION_VERSION_ID, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY, CALCULATION_VERSION_NO from 
		    ( select ROW_NUMBER() OVER (PARTITION BY PROJECT_ID ORDER BY CALCULATION_NAME) ROW_NUMBER, calc.CALCULATION_ID, calc.PROJECT_ID, calc.CALCULATION_NAME, calc.CURRENT_CALCULATION_VERSION_ID,
            calc.CREATED_ON, calc.CREATED_BY, calc.LAST_MODIFIED_ON, calc.LAST_MODIFIED_BY, ifnull(countVersions.CALCULATION_VERSION_NO,0) as CALCULATION_VERSION_NO
            from "${ Views.calculation_with_privileges }" as calc
            LEFT OUTER JOIN
            ( select TO_INT(COUNT(CALCULATION_VERSION_ID)) AS CALCULATION_VERSION_NO, CALCULATION_ID
				from "${ Tables.calculation_version }" group by CALCULATION_ID
				) AS countVersions
            ON calc.CALCULATION_ID = countVersions.CALCULATION_ID
            where calc.USER_ID = ? and calc.CURRENT_CALCULATION_VERSION_ID is not null and CALCULATION_VERSION_NO <> 0`;

        aValues.push(this.getiTopCalculations());
        aValues.push(sUserId);

        if (!helpers.isNullOrUndefined(aProjects) && aProjects.length > 0) {
            sStmt += ' and (';
            _.each(aProjects, function (sProjectId, iIndex) {
                sStmt += ' calc.PROJECT_ID = ?';
                aValues.push(sProjectId);
                if (iIndex < aProjects.length - 1) {
                    sStmt += ' OR';
                }
            });
            sStmt += ' )';
        }

        if (!helpers.isNullOrUndefined(aCalculationIds) && aCalculationIds.length > 0) {
            sStmt += ' and (';
            _.each(aCalculationIds, function (sCalculationId, iIndex) {
                sStmt += ' calc.CALCULATION_ID = ?';
                aValues.push(sCalculationId);
                if (iIndex < aCalculationIds.length - 1) {
                    sStmt += ' OR';
                }
            });
            sStmt += ' )';
        }
        if (!helpers.isNullOrUndefined(sSearchCriteria)) {
            sStmt += ` and (
							upper(calc.CALCULATION_NAME) like upper('%'|| ? || '%')
							or
							calc.CALCULATION_ID like ('%'|| ? || '%')
						)`;
            aValues.push(sSearchCriteria, sSearchCriteria);
        }

        sStmt += ' ) where ROW_NUMBER <= ?';
        aValues.push(itopPerProject);

        var selectStmt = hQuery.statement(sStmt);

        var aResult = [];
        try {
            aResult = await selectStmt.execute(aValues);
        } catch (e) {
            const sClientMsg = 'Get calculations failed. Please refer to server log.';
            const sServerMsg = `${ sClientMsg } Error message: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        return { calculations: aResult };

    };

    /**
	 * Deletes one calculation and associated entities by calling p_calculation_delete. The check "if the calculation
	 * and associated entities are closed" is done in business logic.
	 * 
	 * @param {int}
	 *            iCalculationId - ID of the calculation to delete
	 * @throws {PlcException} -
	 *             If iCalculationId is not set correctly
	 * @throws {PlcException} -
	 *             If the execution of the call statement to execute procedure fails.
	 * @returns {integer} - the number of affected rows
	 */
    this.remove = async function (iCalculationId) {
        await checkCalculationIdIsPositiveInteger(iCalculationId);

        try {
            var procedure = dbConnection.loadProcedure(Procedures.calculation_delete);
            var result = procedure(iCalculationId);

            return result.affectedRows;
        } catch (e) {
            const sClientMsg = 'Error during deleting the calculation.';
            const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }, error message: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }
    };

    /**
	 * Creates a new calculation object in the db from the oCalculation object.
	 * 
	 * @param {object}
	 *            oCalculation - the object with the properties of the new calculation from request
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {string}
	 *            sUserId - the user id
	 * @returns {object} oResultSet - created calculation
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.create = async function (oCalculation, sSessionId, sUserId) {
        if (!_.isObject(oCalculation)) {
            const sLogMessage = 'oCalculation must be a valid object.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        if (!_.isString(sUserId)) {
            const sLogMessage = 'sUserId must be a valid string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        // Exclude all properties that are arrays (which are e.g. nested calculation versions)
        var aPropertiesToExclude = _.filter(_.keys(oCalculation), function (sKey) {
            return _.isArray(oCalculation[sKey]);
        });

        var that = this;
        //check that the project_id exists
        if (!that.project.exists(oCalculation.PROJECT_ID)) {
            const sClientMsg = 'Project not found.';
            const sServerMsg = `${ sClientMsg } Project id: ${ oCalculation.PROJECT_ID }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        var iCalculationId = this.helper.getNextSequenceID(Sequences.calculation);
        var currentdate = new Date();
        var sCalculationName = oCalculation.CALCULATION_NAME;

        var result;
        // Create the nested calculation versions and update their calculation id
        _.each(oCalculation.CALCULATION_VERSIONS, async function (oCalculationVersion, iIndex) {
            oCalculationVersion.CALCULATION_ID = iCalculationId;
            // TODO: update also the existing calculation versions?
            if (oCalculationVersion.CALCULATION_VERSION_ID < 0) {
                // The calculation versions with id < 0 are new and have to be created first
                result = await that.calculationVersion.create(oCalculationVersion, sSessionId, sUserId);
            }
        });

        var oGeneratedValues = {
            'CALCULATION_ID': iCalculationId,
            'CALCULATION_NAME': sCalculationName,
            'CREATED_ON': currentdate,
            'CREATED_BY': sUserId,
            'LAST_MODIFIED_ON': currentdate,
            'LAST_MODIFIED_BY': sUserId
        };
        if (!helpers.isNullOrUndefined(result)) {
            oGeneratedValues.CURRENT_CALCULATION_VERSION_ID = result.CALCULATION_VERSION_ID;
        }

        var oSettings = {
            TABLE: Tables.calculation,
            PROPERTIES_TO_EXCLUDE: aPropertiesToExclude.concat(['CONTROLLING_AREA_ID']),
            GENERATED_PROPERTIES: oGeneratedValues
        };

        var oResultSet;

        try {
            oResultSet = this.helper.insertNewEntity(oCalculation, oSettings);
        } catch (e) {
            if (e instanceof PlcException && !helpers.isNullOrUndefined(e.innerException) && e.innerException.code === 301) {
                // check if initial error thrown from persistency-helper was 301 , unique constraint violated
                oGeneratedValues.CALCULATION_NAME += ' (' + iCalculationId + ')'; // generate CalculationName like: CalculatioNameRequested+UserId+(CalculationIdGeneratedFromSequence)
                oResultSet = this.helper.insertNewEntity(oCalculation, oSettings);
            } else {
                throw e;
            }
        }

        return oResultSet;
    };

    /**
	 * Updates a calculation.
	 * 
	 * @param {object}
	 *            oCalculation - An object containing the columns to update as keys and the values to update as values
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 * 
	 * @throws {PlcException} -
	 *             If oCalculation, oCalculation.CALCULATION_ID, or sSesssioId are not correctly set
	 * @throws {PlcException} -
	 *             If the execution of the update statement would affect more that 1 row. This indicates a corrupted
	 *             query or illegal database state.
	 * @returns {integer} - 0 if now item was updated or 1 if one item was found and updated
	 */
    this.update = async function (oCalculation) {
        if (!helpers.isPlainObject(oCalculation)) {
            const sLogMessage = 'oCalculation must be a valid object.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        if (!helpers.isPositiveInteger(oCalculation.CALCULATION_ID)) {
            const sLogMessage = 'oCalculation.CALCULATION_ID must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        //set last_modifed at and by 
        oCalculation.LAST_MODIFIED_ON = new Date();
        oCalculation.LAST_MODIFIED_BY = $.getPlcUsername();

        // construct and execute update query
        var aStmtBuilder = ['update "' + Tables.calculation + '" set '];
        var aColumnNames = _.keys(oCalculation);
        _.each(aColumnNames, function (sColumnName, iIndex) {
            aStmtBuilder.push(sColumnName + ' = ?');
            if (iIndex < aColumnNames.length - 1) {
                aStmtBuilder.push(', ');
            }
        });
        aStmtBuilder.push(' where calculation_id = ?; ');

        var aValues = _.values(oCalculation);
        aValues.push(oCalculation.CALCULATION_ID);

        var updateStmt = hQuery.statement(aStmtBuilder.join(''));

        var iAffectedRows = 0;
        try {
            iAffectedRows = await updateStmt.execute(aValues);
        } catch (e) {
            const sClientMsg = 'Updating calculation failed.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }
        if (iAffectedRows > 1) {
            const sClientMsg = `Corrupted query or database state: modified ${ iAffectedRows } database records during the update of calculation.`;
            const sServerMsg = `${ sClientMsg } Calculation id: ${ oCalculation.CALCULATION_ID }, data: ${ JSON.stringify(oCalculation) }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
        return {
            calculation: oCalculation,
            affectedRows: iAffectedRows
        };
    };

    /**
	 * Function to check whether the calculation id exists in calculation table.
	 * 
	 * @param {integer}
	 *            iCalculationId - the id of the calculation
	 * @returns {boolean} - true if the calculation id exists, otherwise false
	 */
    this.exists = async function (iCalculationId) {
        await checkCalculationIdIsPositiveInteger(iCalculationId);

        var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.calculation + '" where calculation_id=?');
        var aCount = await oCheckStatement.execute(iCalculationId);

        // check if one entries found
        return parseInt(aCount[0].ROWCOUNT) === 1;
    };

    /**
	 * Gets the list of users ids for all opened calculation versions of the calculation
	 * 
	 * @param {int}
	 *            iCalculationId - the id of the calculation versions that should be checked
	 * @throws {PlcException} -
	 *             If iCalculationId is not correctly set
	 * @throws {PlcException} -
	 *             If anything went wrong in database
	 * @returns {array} ids of users that opened the calculation versions
	 */
    this.getOpeningUsersForVersions = async function (iCalculationId) {
        await checkCalculationIdIsPositiveInteger(iCalculationId);
        const sStmt = `
			select distinct				-- using distinct to be sure that not more than 1 rows are selected 
					sessions.user_id, 	-- (potential duplication with t_calculation_versions + * _temporary)
					open_versions.calculation_version_id,
					coalesce(versions.calculation_version_name, versions_temporary.calculation_version_name, '') 
						as calculation_version_name	--coalesce function: returing the first non-null value; fallback to '' for safety
			from "${ Tables.session }" as sessions
				inner join "${ Tables.open_calculation_versions }" as open_versions
					on sessions.session_id = open_versions.session_id
				left outer join "${ Tables.calculation_version }" as versions
					on open_versions.calculation_version_id = versions.calculation_version_id
				left outer join "${ Tables.calculation_version_temporary }" as versions_temporary
					on open_versions.calculation_version_id = versions_temporary.calculation_version_id
			where versions.calculation_id = ? or versions_temporary.calculation_id = ?;
		`;
        const oResult = dbConnection.executeQuery(sStmt, iCalculationId, iCalculationId);
        return Array.from(oResult);
    };

    /**
	 * Checks whether the calculation name is unique within (in scope of) the provided project identified by id. The string matching
	 * is made in a case insensitive manner.
	 * 
	 * @param {integer}
	 *            iProjectId - the id of the project
	 * @param {string}
	 *            sCalcVersionName - the name of the calculation version to be checked for uniqueness
	 * @throws {@link PlcException}
	 *             if sCalcName is not a string
	 * @throws {@link PlcException}
	 *             if database content is corrupt due to duplicated calcution version names
	 * @returns {boolean} - true if the calculation version name is unique, otherwise false
	 */
    this.isNameUnique = async function (oCalculation) {
        if (!_.isString(oCalculation.CALCULATION_NAME)) {
            const sLogMessage = 'oCalculation.CALCULATION_NAME must be a string';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }


        //TODO: adapt to use only non-temp tables! ensure unique name within the project

        var oCheckNameStatement;
        var aCount;

        // using the upper() sql function to convert stored values in the table and the input calculation name
        // to upper case and enable a case insensitive comparison. 

        var aStmtBuilder = ['select count(*) as rowcount '];
        aStmtBuilder.push('from "' + Tables.calculation + '" where ');
        aStmtBuilder.push('upper(calculation_name) = upper(?) and calculation_id != ? and ');
        if (_.isString(oCalculation.PROJECT_ID)) {
            aStmtBuilder.push('project_id = ?');
            oCheckNameStatement = hQuery.statement(aStmtBuilder.join(' '));
            aCount = await oCheckNameStatement.execute(oCalculation.CALCULATION_NAME, oCalculation.CALCULATION_ID, oCalculation.PROJECT_ID);
        } else {
            aStmtBuilder.push('project_id is null');
            oCheckNameStatement = hQuery.statement(aStmtBuilder.join(' '));
            aCount = await oCheckNameStatement.execute(oCalculation.CALCULATION_NAME, oCalculation.CALCULATION_ID);
        }

        // check if no other entries found
        var iRowCount = parseInt(aCount[0].ROWCOUNT);
        if (aCount.length === 0 || aCount.length > 1 || iRowCount > 1) {
            const sClientMsg = 'Corrupted query or database state: found more than 1 entry for calculation.';
            const sServerMsg = `${ sClientMsg } Calculation name: ${ oCalculation.CALCULATION_NAME }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

        return iRowCount === 0;
    };

    /**
	 * Gets a single calculation (without versions) identified by its ID.
	 * @param {integer} the calculation id
	 * @return {object} all fields of the calculation
	 */
    this.getCurrentCalculationData = async function (iCalculationId) {
        await checkCalculationIdIsPositiveInteger(iCalculationId);

        var aStmtBuilder = ['select calculation_id, project_id, calculation_name, current_calculation_version_id, created_on,' + ' created_by, last_modified_on, last_modified_by '];
        aStmtBuilder.push('from "' + Tables.calculation + '" where ');
        aStmtBuilder.push('CALCULATION_ID = ?');

        var getCalculationStatement = hQuery.statement(aStmtBuilder.join(' '));
        var aCalculation = await getCalculationStatement.execute(iCalculationId);

        if (aCalculation.length < 1) {
            oMessageDetails.addCalculationObjs({ id: iCalculationId });

            const sClientMsg = 'No entry found for current calculation.';
            const sServerMsg = `${ sClientMsg } Calculation Id: ${ iCalculationId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        }
        if (aCalculation.length > 1) {
            const sClientMsg = 'Corrupted database state, found more than 1 entry for current calculation.';
            const sServerMsg = `${ sClientMsg } Calculation Id: ${ iCalculationId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
        return aCalculation[0];
    };

    this.IsCalculationVersionInCalculation = (iCalcVersionId, iCalcId) => {
        const rsCalculationVersion = dbConnection.executeQuery(`select CALCULATION_VERSION_ID from "${ Tables.calculation_version }" where CALCULATION_ID = ${ iCalcId } and CALCULATION_VERSION_ID = ${ iCalcVersionId } union
		                                  select CALCULATION_VERSION_ID from "${ Tables.calculation_version_temporary }" where CALCULATION_ID = ${ iCalcId } and CALCULATION_VERSION_ID = ${ iCalcVersionId }`);
        return !helpers.isNullOrUndefined(rsCalculationVersion.length) && rsCalculationVersion.length >= 1 ? true : false;
    };

    /**
	 * Create a new calculation that has a copied calculation version
	 * 
	 * @param {integer}
	 *            iCalculationVersionId - The calculation version that will be copied
	 * @param {string}
	 *            sTargetProjectId - The target project id. If it is null, then the calculation will be created within the same project.        
	 * @param {string}
	 *            sSessionId - The session id
	 * @param {string}
	 *            sUserId - The user id
	 * @throws {PlcException} -
	 *             If input parameters are wrong
	 * @throws {PlcException} -
	 *             If the execution of the update statement would affect more that 1 row. This indicates a corrupted
	 *             query or illegal database state.
	 * @returns {oReturnObject} - copied calculation version with items
	 */
    this.createCalculationAsCopy = async function (iCalculationVersionId, sTargetProjectId, sSessionId, sUserId, sLanguage) {

        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

        oMessageDetails.addUserObj({ id: sUserId });

        var oReturnObject = {
            calculation: {},
            version: {},
            items: [],
            referencesdata: {
                PROJECTS: [],
                CALCULATIONS: [],
                CALCULATION_VERSIONS: [],
                MASTERDATA: {}
            }
        };

        // generate new IDs for calculation and calculation version
        var sSequenceCalc = Sequences.calculation;
        var iNewCalcID = this.helper.getNextSequenceID(sSequenceCalc);
        var sSequenceCV = Sequences.calculation_version;
        var iNewCalculationVersionID = this.helper.getNextSequenceID(sSequenceCV);

        // need to get calculation_name
        var sStmtGetCalculationName = `
			select 
				calc.calculation_name as CALCULATION_NAME
			from 
				"${ Tables.calculation }" as calc inner join
				"${ Tables.calculation_version }" as calcVersion on calcVersion.CALCULATION_ID = calc.CALCULATION_ID
			where
				calculation_version_id = ?`;

        var oResultCalculationName = dbConnection.executeQuery(sStmtGetCalculationName, iCalculationVersionId);
        var sNewCalculationName = this.getUniqueNameForCalculation(oResultCalculationName[0].CALCULATION_NAME, iNewCalcID);

        if (sNewCalculationName.length > constants.CalculationNameMaxLength) {
            const sClientMsg = `The calculation name has more than ${ constants.CalculationNameMaxLength } characters.`;
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
        }

        //copy calculation version data and related items
        try {
            var procedure = dbConnection.loadProcedure(Procedures.calculation_create_as_copy);
            var result = procedure(iCalculationVersionId, iNewCalculationVersionID, iNewCalcID, sNewCalculationName, sTargetProjectId, sSessionId);
        } catch (e) {
            const sClientMsg = 'Error when creating calculation as copy.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        oReturnObject.calculation = _.clone(_.omit(result.OT_NEW_CALCULATION[0], 'CONTROLLING_AREA_ID'));
        oReturnObject.version = _.clone(result.OT_NEW_CALCULATION_VERSION[0]);
        oReturnObject.items = Array.slice(result.OT_NEW_ITEMS);

        oReturnObject = this.calculationVersion.getReferencedVersionDetails(oReturnObject, sLanguage);

        return oReturnObject;
    };

    /**
	 * Get unique name for calculation
	 * 
	 * @param {object}
	 *            oCalculation - calculation object
	 * @param {integer}
	 *            iCalculationId - calculation ID that was generated using equence
	 * @returns {sCalculationName} - calculation name
	 */
    this.getUniqueNameForCalculation = async function (sCalculationName, iCalculationId) {

        /* Check if the input calculation name ends in "<space><open_bracket><number><close_bracket>", that is, " (1)", " (2)" and so on.
		 * The name of the new calculation will have the prefix + calculation id that is generated with a sequence. */
        var oSplitedCalculationName = await helpers.splitIncrementalString(sCalculationName);

        const sNewCalculationName = oSplitedCalculationName.Prefix + ' (' + iCalculationId + ')';

        return sNewCalculationName;
    };

    /**
	 * Checks whether the calculation version is the current one of a calculation.
	 * 
	 * @param {integer}
	 *            iCalculationVersion - the id of the calculation Version
	 * @throws {PlcException} -
	 *             If iCalculationVersionId is not set correctly
	 * @throws {PlcException} -
	 *             If the execution of the call statement to execute procedure fails.
	 * @returns {integer} - the number of affected rows
	 */
    this.isCurrentVersion = async function (iCalculationVersionId) {
        if (!helpers.isPositiveInteger(iCalculationVersionId)) {
            const sLogMessage = 'iCalculationVersionId must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        try {
            var oStatement = hQuery.statement('select count(*)  as rowcount from  "' + Tables.calculation + '" where current_calculation_version_id = ?');
            var aCount = await oStatement.execute(iCalculationVersionId);

        } catch (e) {
            const sClientMsg = 'Error during checking if calculation version is the current one.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        return parseInt(aCount[0].ROWCOUNT, 10) === 1;
    };

    /**
	 * Retrieve a list of frozen calculation versions by a given calculation id
	 * 
	 *  @param {integer}
	 *            iCalculationId - the id of the calculation 
	 * @throws {PlcException} -
	 *             If the execution of the call statement to execute procedure fails.
	 * @returns {integer} - the number of affected rows
	 */
    this.getFrozenVersions = async function (iCalculationId) {
        await checkCalculationIdIsPositiveInteger(iCalculationId);

        try {

            var oStatement = hQuery.statement('select calculation_version_id from "' + Tables.calculation_version + '"' + ' where is_frozen = 1 and calculation_id = ? ');
            var aResult = await oStatement.execute(iCalculationId);

        } catch (e) {
            const sClientMsg = 'Error during getting frozen calculation versions for calculation.';
            const sServerMsg = `${ sClientMsg } Calculation Id: ${ iCalculationId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        return aResult;
    };

    /**
	 * Gets all versions that are source versions and have master versions in a different calculation.
	 * 
	 * @param {integer}
	 *            iCalculationId - the id of the calculation
	 * @throws {PlcException} -
	 *             If the execution of the select statement fails.
	 * @returns {array} - list of calculation versions that are source versions and have master versions in different calculations
	 */
    this.getSourceVersionsWithMasterVersionsFromDifferentCalculations = async function (iCalculationId) {
        await checkCalculationIdIsPositiveInteger(iCalculationId);

        try {
            //select all the source versions from the calculation
            //search for master versions for the selected source versions that are in different calculations
            var oStatement = hQuery.statement('select distinct calcVers.CALCULATION_VERSION_ID from "' + Tables.calculation_version + '" calcVers inner join ' + '(select REFERENCED_CALCULATION_VERSION_ID, CALCULATION_VERSION_ID from "' + Tables.item + '" union select REFERENCED_CALCULATION_VERSION_ID, CALCULATION_VERSION_ID from "' + Tables.item_temporary + '") item on item.REFERENCED_CALCULATION_VERSION_ID = calcVers.CALCULATION_VERSION_ID and calcVers.CALCULATION_ID = ? inner join "' + Tables.calculation_version + '" calcVers1 on item.CALCULATION_VERSION_ID = calcVers1.CALCULATION_VERSION_ID and calcVers1.CALCULATION_ID != ?');
            var aCalculationVersions = await oStatement.execute(iCalculationId, iCalculationId);

        } catch (e) {
            const sClientMsg = 'Error during selection of source versions that have master versions in a different calculation than given calculation.';
            const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        return aCalculationVersions;
    };
}

Calculation.prototype = await Object.create(Calculation.prototype);
Calculation.prototype.constructor = Calculation;
export default {_,Helper,Misc,helpers,constants,MessageLibrary,PlcException,Code,MessageDetails,Tables,Views,Procedures,Sequences,DefaultValues,Calculation};
