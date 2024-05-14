const _ = require('lodash');
const helpers = require('../util/helpers');
const Constants = require('../util/constants');
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const ProjectServiceParameters = Constants.ProjectServiceParameters;
const TaskType = Constants.TaskType;
const TaskStatus = Constants.TaskStatus;
const FollowUp = Constants.FollowUp;
const LifecycleInterval = Constants.LifecycleInterval;

const CalculationVersionService = require('../service/calculationVersionService');
const ProjectService = require('../service/projectService');
const SessionService = require('../service/sessionService');
const TaskService = require('../service/taskService').TaskService;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;
const Code = MessageLibrary.Code;
const Severity = MessageLibrary.Severity;
const MessageDetails = MessageLibrary.Details;
const oSessions = new Map();


module.exports.Projects = async function ($) {

    const ProjectTables = $.import('xs.db', 'persistency-project').Tables;
    const Tables = Object.freeze({
        folder: 'sap.plc.db::basis.t_folder',
        project: 'sap.plc.db::basis.t_project',
        entity_relation: 'sap.plc.db::basis.t_entity_relation'
    });

    var sSessionId;
    var sUserId;
    sSessionId = sUserId = $.getPlcUsername();

    /**
 * Function that checks the project parent information.
 * The first check is to make sure the entity id exists.
 * The second check is to make sure that for the requested entity id the requested path is the same as
 * the existing path in the database
 * If any of these checks fail, a PlcException will be thrown
 */
    async function checkEntityData(sPath, oPersistency, sTable, sPathType) {
        const oPathCheck = {
            CODE_NOT_FOUND: sPathType === 'PATH' ? Code.GENERAL_ENTITY_NOT_FOUND_ERROR : Code.GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR,
            CODE_NOT_CURRENT: sPathType === 'PATH' ? Code.GENERAL_ENTITY_NOT_CURRENT_ERROR : Code.GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR
        };
        const iEntityId = helpers.getEntityIdFromPath(sPath);
        if (!oPersistency.Helper.entityExists(iEntityId, sTable)) {
            const sClientMsg = "Entity doesn't exists.";
            const sServerMsg = `${ sClientMsg } Entity id: ${ iEntityId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(oPathCheck.CODE_NOT_FOUND, sClientMsg);
        }
        const sFolderPath = oPersistency.Helper.getPath(iEntityId);
        if (sPath !== sFolderPath) {
            const sClientMsg = 'Entity is not current.';
            const sServerMsg = `${ sClientMsg } Path: ${ sPath }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(oPathCheck.CODE_NOT_CURRENT, sClientMsg);
        }
    }


    /**
 * Handles a HTTP POST requests. Can be used for creating, opening or closing of a project.
 */
    this.handlePostRequest = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {

        var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
        var oProject = oBodyData;

        switch (mParameters.action) {
        case ProjectServiceParameters.action.values.close:
            await handleCloseRequest();
            break;
        case ProjectServiceParameters.action.values.create:
            await handleCreateRequest();
            break;
        case ProjectServiceParameters.action.values.open:
            await handleOpenRequest();
            break;
        case ProjectServiceParameters.action.values.calculate_lifecycle_versions:
            await triggerLifecycleVersionCalculation();
            break;
        default: {
                const sLogMessage = `Value ${ mParameters.action } is not supported for parameter "action" for POST request`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        return oServiceOutput;

        /**
	 * Handles the create request for one project. Adds created project to the Service Output Object if
	 * creation was successful.
	 */
        async function handleCreateRequest() {

            SessionService.checkSessionIsOpened(oPersistency, sSessionId, sUserId);

            var sProjectId = oProject.PROJECT_ID;

            if (oProject.PATH && oProject.PATH !== '0') {
                await checkEntityData(oProject.PATH, oPersistency, Tables.folder, 'PATH');
            }

            if (oPersistency.Project.exists(sProjectId) === true) {
                var oExceptionDetails = new MessageDetails().addProjectObjs({ id: sProjectId });

                const sClientMsg = 'Project already exists.';
                const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR, sClientMsg, oExceptionDetails);
            }

            await oPersistency.Project.create(oProject, sSessionId, sUserId);
            await oPersistency.Project.open(oProject.PROJECT_ID, sSessionId, true);

            await setOutputForProject(sProjectId, mSessionDetails.language, oServiceOutput, oPersistency);
            oServiceOutput.setStatus($.net.http.CREATED);

        }

        /**
	 * Handles the open request for one project. It tries at first to open the project as writable.
	 * If this is not possible (e.g. when another project is already open), then it is open as read-only and a message is set.
	 */
        async function handleOpenRequest() {
            var sProjectId = oProject.PROJECT_ID;
            var iIsWriteable;

            const currentSession = {
                projectId: sProjectId,
                sessionUser: sSessionId
            };
            var oReturnObject = { sLockingUser: undefined };

            // check for privilege
            if (oPersistency.Project.hasReadPrivilege(sProjectId) === true) {
                iIsWriteable = 0;
            } else {
                var aLockingUsers = oPersistency.Project.getOpeningUsers(sProjectId, sSessionId, true);
                if (aLockingUsers.length > 0 || oSessions.has(sProjectId) && oSessions.get(sProjectId).sessionUser !== sSessionId) {
                    iIsWriteable = 0;
                    oReturnObject.bIsWriteable = false;
                    oReturnObject.sLockingUser = aLockingUsers.length > 0 && !helpers.isNullOrUndefined(aLockingUsers[0].USER_ID) ? aLockingUsers[0].USER_ID : oSessions.get(sProjectId).sessionUser;
                } else {
                    oSessions.set(sProjectId, currentSession);
                    iIsWriteable = 1;
                    oReturnObject.bIsWriteable = true;
                }
            }
            // Open project as writable if is not opened as writable by another user, and vice versa
            await oPersistency.Project.open(sProjectId, sSessionId, iIsWriteable);

            await setOutputForProject(sProjectId, mSessionDetails.language, oServiceOutput, oPersistency);

            if (!helpers.isNullOrUndefined(oReturnObject.sLockingUser)) {
                let oProjectLockedDetails = new MessageDetails().addProjectObjs({
                    id: sProjectId,
                    openingUsers: [{ id: oReturnObject.sLockingUser }]
                });

                oServiceOutput.addMessage(await new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.INFO, oProjectLockedDetails));
            } else {
                if (!oReturnObject.bIsWriteable) {
                    let oProjectDetails = new MessageDetails().addProjectObjs({ id: sProjectId });

                    oServiceOutput.addMessage(await new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.INFO, oProjectDetails));
                }
            }
        }

        /**
	 * Handles the close request for one project.
	 */
        async function handleCloseRequest() {
            var sProjectId = oProject.PROJECT_ID;

            if (oPersistency.Project.isOpenedInSession(sProjectId, sSessionId) === false) {
                const sClientMsg = 'Project is not opened and cannot be processed.';
                const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
            }

            await oPersistency.Project.close(sProjectId, sSessionId);
            if (oSessions.has(sProjectId) && oSessions.get(sProjectId).sessionUser === sSessionId) {
                oSessions.delete(sProjectId);
            }
        }

        async function triggerLifecycleVersionCalculation() {
            var sProjectId = mParameters[ProjectServiceParameters.id.name];

            await ProjectService.checkExists(sProjectId, oPersistency);
            await ProjectService.checkIsWritable(sProjectId, sSessionId, oPersistency);

            await handleLifecycleLock(sProjectId, oPersistency);
            await checkReferencedLifecycleVersions(sProjectId, oPersistency);


            var taskService = await new TaskService($, oPersistency);
            taskService.lock();


            var oProjectParameters = {
                TASK_TYPE: 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS',
                PARAMETERS: '{"PROJECT_ID":"' + sProjectId + '"}'
            };
            taskService.updateInactiveTasksOnTimeout(null, oProjectParameters);
            let aExistingCalculationTasks = taskService.getByType(TaskType.CALCULATE_LIFECYCLE_VERSIONS);
            let tasks = await ProjectService.getCalculationTaskForProjectSplitedByUsers(aExistingCalculationTasks, sProjectId, $.getPlcUsername());

            if (!helpers.isNullOrUndefined(tasks) && (!helpers.isNullOrUndefined(tasks.oRunningTasksForProjectStartedByCurrentUser) || !helpers.isNullOrUndefined(tasks.oRunningTasksForProjectStartedByOtherUser))) {

                if (!helpers.isNullOrUndefined(tasks.oRunningTasksForProjectStartedByCurrentUser)) {
                    {
                        var oUpdateSet = _.pick(tasks.oRunningTasksForProjectStartedByCurrentUser, [
                            'TASK_ID',
                            'SESSION_ID',
                            'TASK_TYPE'
                        ]);
                        _.extend(oUpdateSet, {
                            STATUS: TaskStatus.CANCELED,
                            STARTED: new Date()
                        });
                        await taskService.updateTask(tasks.oRunningTasksForProjectStartedByCurrentUser, oUpdateSet, oPersistency);
                    }
                } else {
                    const sClientMsg = 'Cannot trigger lifecycle calculation since another user has already started or scheduled a calculation for this project.';
                    const sServerMsg = `${ sClientMsg } Another user id: ${ tasks.oRunningTasksForProjectStartedByOtherUser.SESSION_ID }, project id: ${ sProjectId }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR, sClientMsg);
                }
            }



            let oParameters = { PROJECT_ID: sProjectId };
            let oTask = taskService.createInactiveTaskForCurrentUser({
                TASK_TYPE: TaskType.CALCULATE_LIFECYCLE_VERSIONS,
                PARAMETERS: JSON.stringify(oParameters),
                PROGRESS_TOTAL: 4,
                CREATED_ON: new Date()
            });
            oServiceOutput.setTransactionalData(oTask);

            let oFollowUp = {
                uri: FollowUp.CALCULATE_LIFECYCLE_VERSIONS.URI,
                functionName: FollowUp.CALCULATE_LIFECYCLE_VERSIONS.FUNCTION_NAME,
                parameter: {
                    TASK_ID: oTask.TASK_ID,
                    OVERWRITE_MANUAL_VERSION: mParameters.overwriteManualVersions,
                    ONE_TIME_COST_ITEM_DESCRIPTION: helpers.isNullOrUndefined(oProject) === true ? null : helpers.isNullOrUndefined(oProject[0].oneTimeCostItemDescription) === true ? null : oProject[0].oneTimeCostItemDescription
                }
            };
            oServiceOutput.setFollowUp(oFollowUp);
        }
    };



    async function checkReferencedLifecycleVersions(sProjectId, oPersistency) {
        const aReferencedVersions = Array.from(oPersistency.Project.getReferencedVersions(sProjectId));
        if (aReferencedVersions && aReferencedVersions.length > 0) {
            let oMessageDetails = new MessageDetails();
            let aBaseVersionIds = [...new Set(aReferencedVersions.map(o => o.BASE_CALCULATION_VERSION_ID))];

            oMessageDetails.addProjectObjs({ referencedVersions: aReferencedVersions });

            const sClientMsg = `Calculation of the lifecycle versions is not possible.`;
            const sServerMsg = `The lifecycle versions '${ aBaseVersionIds.join() }' is referenced by another lifecycle versions.`;
            await $.trace.info(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR, sClientMsg, oMessageDetails);
        }
    }





    async function handleLifecycleLock(sProjectId, oPersistency) {

        const aLockedVersions = oPersistency.Project.getOpenedLifecycleVersions(sProjectId);

        if (aLockedVersions && aLockedVersions.length > 0) {
            let oMessageDetails = new MessageDetails();
            let aOpeningUsers = [];

            aLockedVersions.forEach(oLockedLifecycle => {
                let oOpeningUser = { id: oLockedLifecycle.SESSION_ID };
                aOpeningUsers.push(oLockedLifecycle.SESSION_ID);

                oMessageDetails.addProjectObjs({
                    id: oLockedLifecycle.CALCULATION_VERSION_NAME,
                    openingUsers: [oOpeningUser]
                });
            });

            const sClientMsg = `Calculation of the lifecycle versions is not possible.`;
            const sServerMsg = `${ sClientMsg } Lifecycle version is opened by: ${ aOpeningUsers.join() }`;
            await $.trace.info(sServerMsg);
            throw new PlcException(Code.PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR, sClientMsg, oMessageDetails);
        }
        ;
    }





    this.update = async function (oProject, aParameters, oServiceOutput, oPersistency) {

        async function checkProjectDates(sStartProperty, sEndProperty) {
            var sStart = oProject[sStartProperty];
            var sEnd = oProject[sEndProperty];

            if (!(helpers.isNullOrUndefined(sStart) === true && helpers.isNullOrUndefined(sEnd) === true)) {
                sStart = helpers.isNullOrUndefined(sStart) === false ? sStart : oCurrentProject[sStartProperty];
                sEnd = helpers.isNullOrUndefined(sEnd) === false ? sStart : oCurrentProject[sEndProperty];


                await ProjectService.checkProjectTimes(sProjectId, sStart, sEnd);
            }
        }

        async function checkStartEndOfProject() {





            var iDbLowestPeriod = !helpers.isNullOrUndefined(oCurrentProject.START_OF_PROJECT) ? await ProjectService.calculateLifecyclePeriodFrom(oCurrentProject.START_OF_PROJECT, LifecycleInterval.YEARLY) : null;
            var iDbHighestPeriod = !helpers.isNullOrUndefined(oCurrentProject.END_OF_PROJECT) ? await ProjectService.calculateLifecyclePeriodFrom(oCurrentProject.END_OF_PROJECT, LifecycleInterval.YEARLY) : null;


            var iRequestLowestPeriodMonthlyTriggered = !helpers.isNullOrUndefined(oProject.START_OF_PROJECT) ? await ProjectService.calculateLifecyclePeriodFrom(oProject.START_OF_PROJECT, LifecycleInterval.MONTHLY) : null;
            var iRequestHighestPeriodMonthlyTriggered = !helpers.isNullOrUndefined(oProject.END_OF_PROJECT) ? await ProjectService.calculateLifecyclePeriodFrom(oProject.END_OF_PROJECT, LifecycleInterval.MONTHLY) : null;
            var iDbLowestPeriodMonthlyTriggered = !helpers.isNullOrUndefined(oCurrentProject.START_OF_PROJECT) ? await ProjectService.calculateLifecyclePeriodFrom(oCurrentProject.START_OF_PROJECT, LifecycleInterval.MONTHLY) : null;
            var iDbHighestPeriodMonthlyTriggered = !helpers.isNullOrUndefined(oCurrentProject.END_OF_PROJECT) ? await ProjectService.calculateLifecyclePeriodFrom(oCurrentProject.END_OF_PROJECT, LifecycleInterval.MONTHLY) : null;

            var bRemoveLowerPeriods = iRequestLowestPeriodMonthlyTriggered === null || iRequestLowestPeriodMonthlyTriggered !== null && iDbLowestPeriodMonthlyTriggered !== null && iRequestLowestPeriodMonthlyTriggered > iDbLowestPeriodMonthlyTriggered;
            var bRemoveHigherPeriods = iRequestHighestPeriodMonthlyTriggered === null || iRequestHighestPeriodMonthlyTriggered !== null && iDbHighestPeriodMonthlyTriggered !== null && iRequestHighestPeriodMonthlyTriggered < iDbHighestPeriodMonthlyTriggered;
            if (bRemoveLowerPeriods || bRemoveHigherPeriods) {
                oPersistency.Project.deleteLifecyclePeriodsForProject(sProjectId, oProject.START_OF_PROJECT, oProject.END_OF_PROJECT);
            }


            const bValidForUpdate = !helpers.isNullOrUndefined(oProject.START_OF_PROJECT) && !helpers.isNullOrUndefined(oProject.END_OF_PROJECT);
            const bValidForUpdateWhenLowerBoundWasNull = bValidForUpdate && iDbLowestPeriod === null && iDbHighestPeriod !== null;
            const bValidForUpdateWhenUpperBoundWasNull = bValidForUpdate && iDbHighestPeriod === null && iDbLowestPeriod !== null;
            const bValidWhenBothWereNull = bValidForUpdate && iDbLowestPeriod === null && iDbHighestPeriod === null;
            if (bValidForUpdateWhenLowerBoundWasNull || bValidForUpdateWhenUpperBoundWasNull || bValidWhenBothWereNull) {
                oPersistency.Project.createYearlyLifecyclePeriodTypesForProject(sProjectId, oProject.START_OF_PROJECT.getFullYear(), oProject.END_OF_PROJECT.getFullYear());
            }

            var bAddLowerPeriod = bValidForUpdate && iRequestLowestPeriodMonthlyTriggered !== null && iDbLowestPeriodMonthlyTriggered !== null && iRequestLowestPeriodMonthlyTriggered < iDbLowestPeriodMonthlyTriggered;
            var bAddHigherPeriod = bValidForUpdate && iRequestHighestPeriodMonthlyTriggered !== null && iDbHighestPeriodMonthlyTriggered !== null && iRequestHighestPeriodMonthlyTriggered > iDbHighestPeriodMonthlyTriggered;
            if (bAddLowerPeriod || bAddHigherPeriod) {
                oPersistency.Project.addLifecyclePeriodTypeForProject(oProject, iRequestLowestPeriodMonthlyTriggered, iRequestHighestPeriodMonthlyTriggered, iDbLowestPeriodMonthlyTriggered, iDbHighestPeriodMonthlyTriggered);
            }
        }

        var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
        var sProjectId = oProject.PROJECT_ID;
        if (oProject.TARGET_PATH && oProject.PATH) {

            const iSourceEntityId = helpers.getEntityIdFromPath(oProject.PATH);
            oPersistency.Project.checkProjectIdSameAsSourceEntityId(sProjectId, iSourceEntityId);
            if (oProject.TARGET_PATH !== '0') {
                await checkEntityData(oProject.TARGET_PATH, oPersistency, Tables.folder, 'TARGET_PATH');
            }
            await checkEntityData(oProject.PATH, oPersistency, Tables.project, 'PATH');
        }

        var oCurrentProject = oPersistency.Project.getProjectProperties(sProjectId);

        if (helpers.isNullOrUndefined(oCurrentProject)) {
            const sClientMsg = 'Project does not exist and cannot be updated.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        await checkProjectDates('START_OF_PRODUCTION', 'END_OF_PRODUCTION');
        await checkProjectDates('START_OF_PROJECT', 'END_OF_PROJECT');


        if (oPersistency.Project.isOpenedInSession(sProjectId, sSessionId, true) === false) {
            const sClientMsg = 'Project is not opened as writeable and cannot be updated.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.PROJECT_NOT_WRITABLE_ERROR, sClientMsg);
        }


        await checkStartEndOfProject();


        await oPersistency.Project.update(oProject, sSessionId);
        await setOutputForProject(sProjectId, mSessionDetails.language, oServiceOutput, oPersistency);

    };










    this.remove = async function (oProject, aParameters, oServiceOutput, oPersistency) {
        var sProjectId = oProject.PROJECT_ID;

        var aDbOpeningUsers = oPersistency.Project.getOpeningUsers(sProjectId, sSessionId);
        if (aDbOpeningUsers.length > 0) {

            var aOpeningUserDetails = _.map(aDbOpeningUsers, function (oDbOpeningUser) {
                return { id: oDbOpeningUser.USER_ID };
            });

            var oProjectStillOpenDetails = new MessageDetails().addProjectObjs({
                id: sProjectId,
                openingUsers: aOpeningUserDetails
            });

            const sClientMsg = 'Project cannot be deleted. Still opened by other users.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }, opening users: ${ JSON.stringify(oProjectStillOpenDetails) }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.PROJECT_IS_STILL_OPENED_ERROR, sClientMsg, oProjectStillOpenDetails);
        }


        var aFrozenVersions = oPersistency.Project.getFrozenVersions(sProjectId);
        if (aFrozenVersions.length > 0) {
            var oCalculationVersionsFrozenDetails = new MessageDetails();
            _.each(aFrozenVersions, function (oFrozenVersion, index) {
                oCalculationVersionsFrozenDetails.addCalculationVersionObjs({ id: oFrozenVersion.CALCULATION_VERSION_ID });
            });

            const sClientMsg = 'Project cannot be deleted, because it has frozen calculation versions.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_IS_FROZEN_ERROR, sClientMsg, oCalculationVersionsFrozenDetails);
        }







        aDbOpeningUsers = oPersistency.CalculationVersion.getOpenVersionsForProject(sProjectId);
        if (aDbOpeningUsers.length > 0) {
            var oCvStillOpenDetails = new MessageDetails().addProjectObjs({ id: sProjectId });
            await CalculationVersionService.addVersionStillOpenMessageDetails(oCvStillOpenDetails, aDbOpeningUsers);

            const sClientMsg = 'Project cannot be deleted. Underlying calculation versions are opened by other users.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }, opening users: ${ JSON.stringify(aDbOpeningUsers) }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_IS_STILL_OPENED_ERROR, sClientMsg, oCvStillOpenDetails);
        }


        var aSourceVersions = oPersistency.Project.getSourceVersionsWithMasterVersionsFromDifferentProjects(sProjectId);
        if (aSourceVersions.length > 0) {
            aSourceVersions = _.map(aSourceVersions, function (oSourceVersion) {
                return {
                    id: oSourceVersion.CALCULATION_VERSION_ID,
                    name: oSourceVersion.CALCULATION_VERSION_NAME
                };
            });
            var oSourceVersionDetails = new MessageDetails().addProjectReferenceObjs({
                id: sProjectId,
                sourceVersions: aSourceVersions
            });

            const sClientMsg = 'Project cannot be deleted, because it contains source versions used in other projects.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR, sClientMsg, oSourceVersionDetails);
        }


        await ProjectService.checkLifecycleCalculationRunningForProject(oPersistency, sProjectId);




        var affectedRows = oPersistency.Project.remove(sProjectId);
        if (affectedRows < 1) {
            const sClientMsg = 'Project cannot be deleted. Delete affected 0 rows.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR, sClientMsg);
        }


    };




    this.get = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {
        var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
        var oProjects = oPersistency.Project.getAll(mSessionDetails.language, sUserId, mParameters);

        oServiceOutput.setTransactionalData(oProjects.aProjects);
        oServiceOutput.addMasterdata(oProjects.mMasterdata);

        return oServiceOutput;
    };




    this.getQuantities = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {

        var sProjectId = mParameters.id;

        var aProjectTotalQuantities = oPersistency.Project.getTotalQuantities(sProjectId);

        oServiceOutput.setTransactionalData(await prepareServiceOutputForProjectLifecycleDetails(aProjectTotalQuantities, 'CALCULATION_ID'));
    };






    this.updateQuantities = async function (aBodyData, mParameters, oServiceOutput, oPersistency) {
        var sProjectId = mParameters.id;

        await ProjectService.checkExists(sProjectId, oPersistency);
        await ProjectService.checkIsWritable(sProjectId, sSessionId, oPersistency);


        var aCalculationIds = _.map(aBodyData, 'CALCULATION_ID');
        if (!oPersistency.Helper.exists(aCalculationIds, ProjectTables.calculation, 'CALCULATION_ID')) {
            const sClientMsg = 'One or more calculations do not exist in the given project.';
            const sServerMsg = `${ sClientMsg } Calculation ids: ${ aCalculationIds }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        var aExistingCalculationsWithVersions = oPersistency.Project.getCalculationsWithVersions(sProjectId);
        var aExistingCalculationsInProject = _.map(aExistingCalculationsWithVersions, 'CALCULATION_ID');
        if (_.intersection(aExistingCalculationsInProject, aCalculationIds).length !== aCalculationIds.length) {
            const sClientMsg = 'Project does not contain the calculations.';
            const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }, missing calculation ids: ${ aCalculationIds.join(', ') }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        var aQuantitiesWithVersionSet = _.filter(aBodyData, oQuantity => !helpers.isNullOrUndefined(oQuantity.CALCULATION_VERSION_ID));
        if (aQuantitiesWithVersionSet.length > 0) {


            _.each(aQuantitiesWithVersionSet, oQuantityDefinition => {
                var oExistingCalcWithVersion = _.find(aExistingCalculationsWithVersions, oExistingCalcWithVersion => {
                    return oQuantityDefinition.CALCULATION_ID === oExistingCalcWithVersion.CALCULATION_ID && oQuantityDefinition.CALCULATION_VERSION_ID === oExistingCalcWithVersion.CALCULATION_VERSION_ID;
                });
                if (helpers.isNullOrUndefined(oExistingCalcWithVersion)) {
                    const sClientMsg = 'Version does not exist or does not belong to the specified calculation.';
                    const sServerMsg = `${ sClientMsg } Version: ${ oQuantityDefinition.CALCULATION_VERSION_ID }, Calculation: ${ oQuantityDefinition.CALCULATION_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
                }
            });



            var aCvIds = _.map(aQuantitiesWithVersionSet, 'CALCULATION_VERSION_ID');
            var aFrozenVersions = oPersistency.CalculationVersion.areFrozen(aCvIds);
            if (aFrozenVersions.length > 0) {
                let oCvMessageDetails = new MessageDetails();
                _.each(aFrozenVersions, iCvId => oCvMessageDetails.addCalculationVersionObjs({ id: iCvId }));

                const sClientMsg = 'One or more calculation versions are frozen and cannot serve as base versions.';
                const sServerMsg = `${ sClientMsg } Frozen versions: ${ aFrozenVersions.join(', ') }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.CALCULATIONVERSION_IS_FROZEN_ERROR, sClientMsg, oCvMessageDetails);
            }
        }



        await ProjectService.checkLifetimeLimitsForProjectDetails(aBodyData, sProjectId, oPersistency);


        oPersistency.Project.deleteTotalQuantitiesForProject(sProjectId);


        oPersistency.Project.createTotalQuantities(aBodyData, sProjectId);


        var aProjectTotalQuantities = oPersistency.Project.getTotalQuantities(sProjectId);
        oServiceOutput.setTransactionalData(await prepareServiceOutputForProjectLifecycleDetails(aProjectTotalQuantities, 'CALCULATION_ID'));
    };




    this.getActivityPriceSurcharges = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {
        let sProjectId = mParameters.id;

        await ProjectService.checkExists(sProjectId, oPersistency);

        let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
        let aProjectSurcharges = oPersistency.Project.getActivityPriceSurcharges(sProjectId, mSessionDetails.language);

        oServiceOutput.setTransactionalData(await prepareServiceOutputForProjectLifecycleDetails(aProjectSurcharges, 'RULE_ID'));
    };




    this.updateActivityPriceSurcharges = async function (aBodyData, mParameters, oServiceOutput, oPersistency) {
        let sProjectId = mParameters.id;

        await ProjectService.checkExists(sProjectId, oPersistency);
        await ProjectService.checkIsWritable(sProjectId, sSessionId, oPersistency);


        await ProjectService.checkUniqueSurchargeDefinitionDependencyCombination(aBodyData, [
            'PLANT_ID',
            'ACCOUNT_GROUP_ID',
            'COST_CENTER_ID',
            'ACTIVITY_TYPE_ID'
        ]);


        await ProjectService.checkLifetimeLimitsForProjectDetails(aBodyData, sProjectId, oPersistency);


        oPersistency.Project.deleteSurchargesForProject(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges);


        oPersistency.Project.createSurcharges(sProjectId, aBodyData, BusinessObjectTypes.ProjectActivityPriceSurcharges);


        await ProjectService.checkOverlappingAccountsInAccountGroups(sProjectId, BusinessObjectTypes.ProjectActivityPriceSurcharges, oServiceOutput, oPersistency);


        let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
        let aProjectSurcharges = oPersistency.Project.getActivityPriceSurcharges(sProjectId, mSessionDetails.language);

        oServiceOutput.setTransactionalData(await prepareServiceOutputForProjectLifecycleDetails(aProjectSurcharges, 'RULE_ID'));
    };




    this.getMaterialPriceSurcharges = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {
        let sProjectId = mParameters.id;

        await ProjectService.checkExists(sProjectId, oPersistency);

        let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
        let aProjectSurcharges = oPersistency.Project.getMaterialPriceSurcharges(sProjectId, mSessionDetails.language);

        oServiceOutput.setTransactionalData(await prepareServiceOutputForProjectLifecycleDetails(aProjectSurcharges, 'RULE_ID'));
    };




    this.updateMaterialPriceSurcharges = async function (aBodyData, mParameters, oServiceOutput, oPersistency) {
        let sProjectId = mParameters.id;

        await ProjectService.checkExists(sProjectId, oPersistency);
        await ProjectService.checkIsWritable(sProjectId, sSessionId, oPersistency);


        await ProjectService.checkUniqueSurchargeDefinitionDependencyCombination(aBodyData, [
            'ACCOUNT_GROUP_ID',
            'MATERIAL_GROUP_ID',
            'MATERIAL_TYPE_ID',
            'PLANT_ID',
            'MATERIAL_ID'
        ]);


        await ProjectService.checkLifetimeLimitsForProjectDetails(aBodyData, sProjectId, oPersistency);


        oPersistency.Project.deleteSurchargesForProject(sProjectId, BusinessObjectTypes.ProjectMaterialPriceSurcharges);


        oPersistency.Project.createSurcharges(sProjectId, aBodyData, BusinessObjectTypes.ProjectMaterialPriceSurcharges);


        await ProjectService.checkOverlappingAccountsInAccountGroups(sProjectId, BusinessObjectTypes.ProjectMaterialPriceSurcharges, oServiceOutput, oPersistency);


        let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
        let aProjectSurcharges = oPersistency.Project.getMaterialPriceSurcharges(sProjectId, mSessionDetails.language);

        oServiceOutput.setTransactionalData(await prepareServiceOutputForProjectLifecycleDetails(aProjectSurcharges, 'RULE_ID'));
    };


















    function setOutputForProject(sProjectId, sLanguage, oServiceOutput, oPersistency) {
        var oProjectsAndMasterdata = oPersistency.Project.get(sLanguage, sUserId, sProjectId);

        var oOutputProject = _.omit(oProjectsAndMasterdata.aProjects[0], 'CALCULATION_NO');

        oServiceOutput.setTransactionalData(oOutputProject);
        oServiceOutput.addMasterdata(oProjectsAndMasterdata.mMasterdata);
    }








    async function prepareServiceOutputForProjectLifecycleDetails(aProjectTotalQuantities, sGroupingProperty) {
        var aTotalQuantitiesOutput = [];
        _.each(_.groupBy(aProjectTotalQuantities, sGroupingProperty), (aCalculationGroups, iCalculationId) => {
            let oCalculationOutput = _.omit(aCalculationGroups[0], [
                'RULE_ID',
                'LIFECYCLE_PERIOD_FROM',
                'VALUE',
                'LIFECYCLE_PERIOD_FROM_DATE'
            ]);
            oCalculationOutput.PERIOD_VALUES = [];
            _.each(_.groupBy(aCalculationGroups, 'RULE_ID'), aRuleGroups => {
                _.each(aRuleGroups, oRulesGroup => {
                    if (!helpers.isNullOrUndefined(oRulesGroup.VALUE)) {
                        oCalculationOutput.PERIOD_VALUES.push(_.pick(oRulesGroup, 'LIFECYCLE_PERIOD_FROM', 'VALUE', 'LIFECYCLE_PERIOD_FROM_DATE'));
                    }
                });
            });
            aTotalQuantitiesOutput.push(oCalculationOutput);
        });

        return aTotalQuantitiesOutput;
    }
};
export default {_,helpers,Constants,BusinessObjectTypes,ProjectServiceParameters,TaskType,TaskStatus,FollowUp,LifecycleInterval,CalculationVersionService,ProjectService,SessionService,TaskService,MessageLibrary,PlcException,Message,Code,Severity,MessageDetails,oSessions};
