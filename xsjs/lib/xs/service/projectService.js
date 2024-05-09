const _ = require('lodash');
const helpers = require('../util/helpers');

const MessageLibrary = require('../util/message');
const MessageCode = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const Message = MessageLibrary.Message;
const Severity = MessageLibrary.Severity;
const PlcException = MessageLibrary.PlcException;

const Constants = require('../util/constants');
const TaskType = Constants.TaskType;
const TaskStatus = Constants.TaskStatus;
const LifecycleInterval = Constants.LifecycleInterval;

async function logError(msg) {
    await helpers.logError(msg);
}
async function logInfo(msg) {
    await helpers.logInfo(msg);
}

/**
 * Checks if the start (e.g. of production or project) is earlier than end for the given project. If not, an error is thrown.
 */
async function checkProjectTimes(sProjectId, sStart, sEnd) {

    // do following checks only if both inputs are dates
    if (await helpers.isNullOrUndefined(sStart) === true || await helpers.isNullOrUndefined(sEnd) === true) {
        return;
    }

    var dStart = new Date(sStart);
    var dEnd = new Date(sEnd);
    if (dStart.getTime() > dEnd.getTime()) {
        const sClientMsg = `Wrong properties for project: start ${ dStart } is later than end ${ dEnd }.`;
        const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sClientMsg);
    }
}

/**
 * Checks if lifecycle calculation runs for the given project.
 */
async function checkLifecycleCalculationRunningForProject(oPersistency, sProjectId) {
    let aExistingCalculationTasks = oPersistency.Task.get(null, TaskType.CALCULATE_LIFECYCLE_VERSIONS, null);
    let oRunningTasksForProject = await getCalculationTasksForProject(aExistingCalculationTasks, sProjectId);

    if (!helpers.isNullOrUndefined(oRunningTasksForProject)) {
        let oMessageDetails = new MessageDetails().addProjectObjs({ id: sProjectId });
        const sClientMsg = 'Calculation version/calculation/project cannot not be deleted because project is running lifecycle calculation.';
        const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_ENTITY_PART_OF_CALCULATION_ERROR, sClientMsg, oMessageDetails);
    }
}


/**
 * Checks if the list of existing calculation tasks contains the given project.
 */
function getCalculationTasksForProject(aExistingCalculationTasks, sProjectId) {
    if (aExistingCalculationTasks.length > 0) {
        let oRunningTasksForProject = _.find(aExistingCalculationTasks, oExistingTask => {
            var bIsInactive = oExistingTask.STATUS === TaskStatus.INACTIVE;
            var bIsActive = oExistingTask.STATUS === TaskStatus.ACTIVE;
            var bIsForProject = JSON.parse(oExistingTask.PARAMETERS).PROJECT_ID === sProjectId;
            // note: also inactive tasks needs to be considered, since they are scheduled even if not started yet
            return (bIsInactive || bIsActive) && bIsForProject;
        });
        return oRunningTasksForProject;
    }
}

async function getCalculationTaskForProjectSplitedByUsers(aExistingCalculationTasks, sProjectId, sUserName) {
    if (aExistingCalculationTasks.length > 0) {
        let oRunningTasksForProjectStartedByCurrentUser = _.find(aExistingCalculationTasks, oExistingTask => {
            var bIsInactive = oExistingTask.STATUS === TaskStatus.INACTIVE;
            var bIsActive = oExistingTask.STATUS === TaskStatus.ACTIVE;
            var bIsForProject = JSON.parse(oExistingTask.PARAMETERS).PROJECT_ID === sProjectId;
            var bSessionId = oExistingTask.SESSION_ID === sUserName;
            // note: also inactive tasks needs to be considered, since they are scheduled even if not started yet
            return (bIsInactive || bIsActive) && bIsForProject && bSessionId;
        });

        if (!helpers.isNullOrUndefined(oRunningTasksForProjectStartedByCurrentUser)) {
            return { oRunningTasksForProjectStartedByCurrentUser };
        }
        let oRunningTasksForProjectStartedByOtherUser = _.find(aExistingCalculationTasks, oExistingTask => {
            var bIsInactive = oExistingTask.STATUS === TaskStatus.INACTIVE;
            var bIsActive = oExistingTask.STATUS === TaskStatus.ACTIVE;
            var bIsForProject = JSON.parse(oExistingTask.PARAMETERS).PROJECT_ID === sProjectId;
            var bSessionId = oExistingTask.SESSION_ID != sUserName;
            // note: also inactive tasks needs to be considered, since they are scheduled even if not started yet
            return (bIsInactive || bIsActive) && bIsForProject && bSessionId;
        });
        return {
            oRunningTasksForProjectStartedByCurrentUser,
            oRunningTasksForProjectStartedByOtherUser
        };
    }
}


/**
 * The column lifecycle_period_from in t_project_lifecycle_period_quantity_value stores the start of a period as the number of months from 1900-01-01. Depending on the lifecycle interval, 
 * the lifecycle_period_from must calculated differently:
 *  - Yearly: lifecycle_period_from must point to the first month of the year, since this is the start of the period (regardless the month)
 *  - Quarterly: lifecycle_period_from must point to the first month of the quarter, since this is the start of the period
 *  - Monthly: lifecycle_period_from must point to the exact month of the date
 * 
 * This utility function is taking care of the calculation.
 *  
 * @param  {date} dDate The Date object from which the lifecycle_period_from shall be calculated
 * @param  {type} iLifecycleInterval The {@link LifecycleInterval} for which the lifecycle_period_from shall be calculated
 * @return {number}    The lifecycle_period_from value (integer with the number of months from 1900-01-01)
 */
function calculateLifecyclePeriodFrom(dDate, iLifecycleInterval) {
    iLifecycleInterval = iLifecycleInterval || LifecycleInterval.YEARLY;
    var iPeriodForFirstOfJanuary = (dDate.getFullYear() - 1900) * 12;
    switch (iLifecycleInterval) {
    case LifecycleInterval.YEARLY:
        return iPeriodForFirstOfJanuary;
    case LifecycleInterval.QUARTERLY: {
            let iMonthInQuater = dDate.getMonth() % 3;
            let iFirstMonthOfQuater = dDate.getMonth() - iMonthInQuater;
            return iPeriodForFirstOfJanuary + iFirstMonthOfQuater;
        }
    case LifecycleInterval.MONTHLY:
        return iPeriodForFirstOfJanuary + dDate.getMonth();
    default:
        throw new Error(`Unknown LifecycleInterval ${ iLifecycleInterval }`);
    }
}

/**
 * Utility function to check if a project for given id exists. Throws an exception 
 * with code GENERAL_ENTITY_NOT_FOUND_ERROR if the project does not exists.
 *  
 * @param  {string} sProjectId   The id of the project that is checked for existence.  
 * @param  {object} oPersistency Instance of the persistency library to perform the check.  
 * @throws {PlcException}		 If the project does not exist (code GENERAL_ENTITY_NOT_FOUND_ERROR)
 */
async function checkExists(sProjectId, oPersistency) {
    if (oPersistency.Project.exists(sProjectId) === false) {
        const sClientMsg = 'Project cannot be found.';
        const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
    }
}


/**
 * Utility function to check if a project is opened in read/write-mode. Throws an exception with
 * code PROJECT_NOT_WRITABLE_ERROR if the project is not writable.
 *  
 * @param  {type} sProjectId   		Id of the project, which is checked for writability for a specific user
 * @param  {type} sUserId      		Id of the user, who must have the project open in write-mode
 * @param  {object} oPersistency 	Instance of the persistency library to perform the check.  
 * @throws {PlcException} 			If the project does not exist (code PROJECT_NOT_WRITABLE_ERROR)
 */
async function checkIsWritable(sProjectId, sUserId, oPersistency) {
    if (oPersistency.Project.isOpenedInSession(sProjectId, sUserId, true) === false) {
        const sClientMsg = 'Project is not opened in write-mode. Quantities cannot be updated.';
        const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId } `;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.PROJECT_NOT_WRITABLE_ERROR, sClientMsg);
    }
}

/**
 * Checks if the project details (e.g. total quantities, surcharges) are defined within the project lifetime.
 * if quantities would be defined out of it, lifecycle versions would be created before or after the project, which is not permitted.
 * The method ensures that sent lifecycle period values are within START_OF_PROJECT and END_OF_PROJECT, and that those are defined for the project.
 */
async function checkLifetimeLimitsForProjectDetails(aBodyData, sProjectId, oPersistency) {
    var oDbProject = oPersistency.Project.getProjectProperties(sProjectId);
    if (await helpers.isNullOrUndefined(oDbProject.START_OF_PROJECT) || await helpers.isNullOrUndefined(oDbProject.END_OF_PROJECT)) {
        const sClientMsg = 'Values for total quantities can only be defined if START_OF_PROJECT and END_OF_PROJECT are set. Currently at least one is undefined for project.';
        const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
    }
    var iLowestValidPeriodFrom = await this.calculateLifecyclePeriodFrom(oDbProject.START_OF_PROJECT, LifecycleInterval.YEARLY);
    var iHighestValidPeriodFrom = await this.calculateLifecyclePeriodFrom(oDbProject.END_OF_PROJECT, LifecycleInterval.YEARLY);
    var aPeriodsFromRequest = [];
    _.each(aBodyData, oQuantity => {
        aPeriodsFromRequest = aPeriodsFromRequest.concat(_.map(oQuantity.PERIOD_VALUES, 'LIFECYCLE_PERIOD_FROM'));
    });
    var aPeriodsOutOfProject = _.filter(aPeriodsFromRequest, iPeriodFrom => iPeriodFrom < iLowestValidPeriodFrom || iPeriodFrom > iHighestValidPeriodFrom);
    if (aPeriodsOutOfProject.length > 0) {
        const sClientMsg = 'Values for project lifetime details can only be defined between START_OF_PROJECT and END_OF_PROJECT. Some values are not.';
        const sServerMsg = `${ sClientMsg } Project id: ${ sProjectId }, LIFECYCLE_PERIOD_FROM values: ${ aPeriodsOutOfProject.join(', ') }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sClientMsg);
    }
}

/**
 * Checks if there are overlapping accounts in the account groups of the project and if yes adds a warning
 */
async function checkOverlappingAccountsInAccountGroups(sProjectId, sBusinessObjectType, oServiceOutput, oPersistency) {
    var aDbOverlappingAccountsAndGroups = oPersistency.Project.getOverlappingAccountsInProjectSurcharges(sProjectId, sBusinessObjectType);
    if (aDbOverlappingAccountsAndGroups.length > 0) {
        // Get an array with unique overlapping account groups
        let aOverlappingAccountGroups = _.keys(_.groupBy(aDbOverlappingAccountsAndGroups, function (oOverlappingAccountGroup) {
            return oOverlappingAccountGroup.ACCOUNT_GROUP_ID;
        }));

        await logInfo(`Account groups '${ aOverlappingAccountGroups.join(',') }' have overlapping accounts.`);

        let oMessageDetails = new MessageDetails().setLifecycleSurchargeDetailsObj({ ACCOUNT_GROUPS_WITH_OVERLAPS: aOverlappingAccountGroups });
        let oMessage = await new Message(MessageCode.PROJECT_SURCHARGES_ACCOUNT_GROUPS_OVERLAPPING_WARNING, Severity.WARNING, oMessageDetails);
        oServiceOutput.addMessage(oMessage);
    }
}

/**
 * Checks that only unique combinations of dependencies in surcharge definitions are available. Otherwise, an error is thrown.
 * 
 * The check is needed since the unique constraint violation mechanism of db does not work when inserting mass entries as it is done in persistency-project.createSurcharges(): 
 * 		the db does not produce any error in this case, but just stores the last value of the duplicated data.  
 * 
 * @param  {array} aSurchargeDefinitions   	Surcharge definitions from request
 * @param  {array} aDefinitionProperties    Names of surcharge definition dependencies that should be checked
 */
async function checkUniqueSurchargeDefinitionDependencyCombination(aSurchargeDefinitions, aDefinitionProperties) {
    if (aSurchargeDefinitions.length > 0) {

        // Get an object with unique dependency combinations and their count
        var mGroupedByDefinitions = _.countBy(aSurchargeDefinitions, oSurchargeDefinition => {
            let oPrimaryKeys = _.pick(oSurchargeDefinition, aDefinitionProperties);
            // The impression Object.keys(...).sort() ensures that the json is stringified in the given sequence, so that primary key sets remain comparable.
            return JSON.stringify(oPrimaryKeys, Object.keys(oPrimaryKeys).sort());
        });

        var bAnyDuplicatedDefinition = _.some(_.values(mGroupedByDefinitions), function (iGroupCount) {
            return iGroupCount > 1;
        });

        if (bAnyDuplicatedDefinition === true) {
            var aDuplicatedDefinitions = _.mapValues(mGroupedByDefinitions, function (val, key) {
                if (val > 1) {
                    return key;
                } else {
                    return null;
                }
            });
            aDuplicatedDefinitions = _.filter(aDuplicatedDefinitions, function (val) {
                return val !== null;
            });

            const sClientMsg = 'Cannot save since there are duplicated surcharge definitions.';
            const sServerMsg = `${ sClientMsg } Duplicated definitions: ${ aDuplicatedDefinitions }.`;
            await logError(sServerMsg);
            throw new PlcException(MessageCode.GENERAL_UNIQUE_CONSTRAINT_VIOLATED_ERROR, sClientMsg);
        }

    }
}

module.exports.checkProjectTimes = checkProjectTimes;
module.exports.checkLifecycleCalculationRunningForProject = checkLifecycleCalculationRunningForProject;
module.exports.getCalculationTasksForProject = getCalculationTasksForProject;
module.exports.getCalculationTaskForProjectSplitedByUsers = getCalculationTaskForProjectSplitedByUsers;
module.exports.calculateLifecyclePeriodFrom = calculateLifecyclePeriodFrom;
module.exports.checkExists = checkExists;
module.exports.checkIsWritable = checkIsWritable;
module.exports.checkLifetimeLimitsForProjectDetails = checkLifetimeLimitsForProjectDetails;
module.exports.checkOverlappingAccountsInAccountGroups = checkOverlappingAccountsInAccountGroups;
module.exports.checkUniqueSurchargeDefinitionDependencyCombination = checkUniqueSurchargeDefinitionDependencyCombination;
export default {_,helpers,MessageLibrary,MessageCode,MessageDetails,Message,Severity,PlcException,Constants,TaskType,TaskStatus,LifecycleInterval,logError,logInfo,checkProjectTimes,checkLifecycleCalculationRunningForProject,getCalculationTasksForProject,getCalculationTaskForProjectSplitedByUsers,calculateLifecyclePeriodFrom,checkExists,checkIsWritable,checkLifetimeLimitsForProjectDetails,checkOverlappingAccountsInAccountGroups,checkUniqueSurchargeDefinitionDependencyCombination};
