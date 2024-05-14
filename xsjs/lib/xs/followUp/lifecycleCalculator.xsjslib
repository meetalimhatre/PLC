const helpers = $.require('../util/helpers');
const _ = $.require('lodash');
const TaskStatus = $.require('../util/constants').TaskStatus;
const TaskType = $.require('../util/constants').TaskType;
const Message = $.require('../util/message').Code;


/**
 * This class is responsible for orchestrating the calculation and initial processing of lifecycle calculation versions. The following steps are executed for the lifecycle version calculation:
 * 		1. Clone base versions and update references
 * 		2. Run price determination for created lifecycle versions
 * 		3. Run calculation engine for created lifecycle versions
 * Since the calculation is a very long-running task, the class updates the task defined for the calculation of lifecycle versions after each step to inform about the progress of the calculation. 
 * 
 * The Calculator is meant to be executed within the context of a XS Follow-up. For this reason not the common exception handling via PlcException can be applied, but errors and details are persisted 
 * within the task for the calculation. By this, clients can get information about failures. An execution via Follow-up also prevents any debugging in a production like scenario (=outside of a test). 
 * For this reason the Calculator performing detailed error detection and reporting.
 * 
 * NOTE: All dependencies are passed as constructor arguments in order to enable unit testing. Since the calculation is a very long-running procedure,
 * 		 we should not to heavily rely on integration tests for the sake of test performance.
 *
 * @constructor
 * 
 * @param  {type} iTaskId            The id of the task defined for the calculation.
 * @param  {type} oPersistency       The persistency instance used to trigger the process steps. Also contains the default transaction (connection) used to execute the lifecycle calculation.
 * @param  {type} oConnectionFactory A factory to create new connections. Needed since the modifications to the task shall be commited immediately outside 
 * 									 of transaction context of the calculation.
 * @param  {type} oTaskService       The service to modify tasks.
 * @param  {type} bOverwriteManualVersions       Is a flag, true means that the manual lifecycle versions can be overwritten, false means that the manual lifecycle versions are not to be overwritten
 * @param  {type} sOneTimeCostItemDescription    Translated text for "Distributed Costs".
 */
function LifecycleVersionCalculator(iTaskId, oPersistency, oConnectionFactory, oTaskService, bOverwriteManualVersions, sOneTimeCostItemDescription) {

    /**	
	 * Executes the calculation. See class comment for further details.	
	 */
    this.calculate = async () => {
        $.trace.info(`Starting calculation of lifecycle versions for task id ${ iTaskId }.`);

        let oCalculationTask = oTaskService.getById(iTaskId);
        try {
            if (helpers.isNullOrUndefined(oCalculationTask)) {
                const sLogMessage = `Cannot calculate lifecycle versions for task with id ${ iTaskId } since the task cannot be found.`;
                $.trace.error(sLogMessage);
                setTaskToFailed(oCalculationTask, sLogMessage);
                return;
            }
            if (oCalculationTask.STATUS !== TaskStatus.INACTIVE) {
                const sLogMessage = `Cannot calculate lifecycle versions for task with id ${ iTaskId }, since the task has the wrong status (expected: ${ TaskStatus.INACTIVE }, actual: ${ oCalculationTask.STATUS }).`;
                $.trace.error(sLogMessage);
                setTaskToFailed(oCalculationTask, sLogMessage);
                return;
            }
            if (oCalculationTask.TASK_TYPE !== TaskType.CALCULATE_LIFECYCLE_VERSIONS) {
                const sLogMessage = `Cannot calculate lifecycle versions for task with id ${ iTaskId }, since the task has the wrong type (expected: ${ TaskType.CALCULATE_LIFECYCLE_VERSIONS }, actual: ${ oCalculationTask.TASK_TYPE }).`;
                $.trace.error(sLogMessage);
                setTaskToFailed(oCalculationTask, sLogMessage);
                return;
            }
            if (helpers.isNullOrUndefined(oCalculationTask.PARAMETERS)) {
                const sLogMessage = `Cannot calculation lifecycle versions for task with id ${ iTaskId }, since the task defined has no parameters.`;
                $.trace.error(sLogMessage);
                setTaskToFailed(oCalculationTask, sLogMessage);
                return;
            }

            try {
                var mParameters = JSON.parse(oCalculationTask.PARAMETERS);
            } catch (e) {
                const sLogMessage = `Cannot calculate lifecycle versions for task with id ${ iTaskId }, since parameters cannot be parsed as JSON.`;
                $.trace.error(sLogMessage + ` (${ e.message || e.msg }) `);
                setTaskToFailed(oCalculationTask, sLogMessage);
                return;
            }
            var sProjectId = mParameters.PROJECT_ID;
            if (helpers.isNullOrUndefined(sProjectId)) {
                const sLogMessage = `Cannot calculate lifecycle versions for task with id ${ iTaskId }, since the task parameters have no property PROJECT_ID.`;
                $.trace.error(sLogMessage);
                setTaskToFailed(oCalculationTask, sLogMessage);
                return;
            }
            if (!oPersistency.Project.exists(sProjectId)) {
                const sLogMessage = `Cannot calculate lifecycle versions for project ${ sProjectId } (task id ${ iTaskId }), since the project cannot be found or accessed.`;
                $.trace.error(sLogMessage);
                setTaskToFailed(oCalculationTask, sLogMessage);
                return;
            }

            // check if the lifecycle versions have valid one time costs when using MANUAL_DISTRIBUTION
            var oneTimeCostsAreValid = oPersistency.Project.checkManualOneTimeCosts(sProjectId);
            if (!oneTimeCostsAreValid) {
                const sLogMessage = `Cannot calculate lifecycle versions for project ${ sProjectId } (task id ${ iTaskId }), due to improper manual values for one time costs.`;
                $.trace.error(sLogMessage);
                oTaskService.updateTask(oCalculationTask, {
                    STATUS: TaskStatus.FAILED,
                    ERROR_CODE: Message.PROJECT_CALCULATE_LIFECYCLE_MAN_DISTRIB_ERROR.code,
                    ERROR_DETAILS: sLogMessage
                }, oConnectionFactory);
                return;
            }

            // initialize task and set it to active, even though no PROGRESS_STEP is set (=means the first step is calculated)
            oTaskService.updateTask(oCalculationTask, {
                STATUS: TaskStatus.ACTIVE,
                STARTED: new Date(),
                PROGRESS_TOTAL: 3
            }, oConnectionFactory);

            var oCreatedLifecycleVersions = oPersistency.Project.createLifecycleVersions(sProjectId, oCalculationTask.SESSION_ID, bOverwriteManualVersions, sOneTimeCostItemDescription);
            await updateTaskProgress(oCalculationTask, 1);




            _.each(oCreatedLifecycleVersions, oCreatedLifecycleVersion => oPersistency.CalculationVersion.priceDetermination(oCreatedLifecycleVersion.CALCULATION_VERSION_ID));
            await updateTaskProgress(oCalculationTask, 2);

            oPersistency.Project.calculteLifecycleVersions(sProjectId, bOverwriteManualVersions);


            await oPersistency.getConnection().commit();

            oTaskService.updateTask(oCalculationTask, {
                PROGRESS_STEP: 3,
                STATUS: TaskStatus.COMPLETED
            }, oConnectionFactory);

            $.trace.info(`Calculation of lifecycle versions for task id ${ iTaskId } (prokect id ${ sProjectId }) finished. Number of created lifecycle versions: ${ oCreatedLifecycleVersions.length }`);
        } catch (e) {

            await oPersistency.getConnection().rollback();



            const sBaseMessage = `Error occured during lifecycle calculation for project ${ sProjectId } (task id: ${ iTaskId }).`;
            const sExternalMessage = `${ sBaseMessage } Please see server-side log file for further details.`;
            let sInternalMessage = sBaseMessage;
            if (e instanceof Error) {
                sInternalMessage += ` Error message: ${ e.msg || e.message } - stacktrace: ${ e.stack }`;
            } else {
                sInternalMessage += JSON.stringify(e);
            }

            $.trace.error(sInternalMessage);
            setTaskToFailed(oCalculationTask, sExternalMessage);
        }
    };

    async function setTaskToFailed(oTask, sMessage) {
         oTaskService.updateTask(oTask, {
            STATUS: TaskStatus.FAILED,
            ERROR_CODE: Message.PROJECT_CALCULATE_LIFECYCLEVERSION_ERROR.code,
            ERROR_DETAILS: sMessage
        }, oConnectionFactory);
    }

    async function updateTaskProgress(oTask, iProgressStep) {
         oTaskService.updateTask(oTask, { PROGRESS_STEP: iProgressStep }, oConnectionFactory);
    }
}
LifecycleVersionCalculator.prototype = Object.create(LifecycleVersionCalculator.prototype);
LifecycleVersionCalculator.prototype.constructor = LifecycleVersionCalculator;
export default {helpers,_,TaskStatus,TaskType,Message,LifecycleVersionCalculator};
