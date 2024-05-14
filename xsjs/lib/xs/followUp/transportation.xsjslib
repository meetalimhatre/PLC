const helpers = $.require('../util/helpers');
const TaskStatus = $.require('../util/constants').TaskStatus;
const TaskType = $.require('../util/constants').TaskType;
const Code = $.require('../util/message').Code;

const TransportationImpl = $.require('../impl/transportation').Transportation;

async function Transportation(iTaskId, oPersistency, oConnectionFactory, oTaskService) {

    this.importData = oBodyData => {
        await $.trace.info(`Starting the transportation importData for task ${ iTaskId }.`);

        const oTransportationTask = oTaskService.getById(iTaskId);

        if (helpers.isNullOrUndefined(oTransportationTask)) {
            const sLogMessage = `Cannot perform transportation import. Task with id ${ iTaskId } cannot be found`;
            $.trace.error(sLogMessage);
            await setTaskToFailed(oTransportationTask, sLogMessage);
            return;
        }
        if (oTransportationTask.STATUS !== TaskStatus.INACTIVE) {
            const sLogMessage = `Cannot import data to transportation tool for task with id ${ iTaskId }, since the task has the wrong status ` + `(expected: ${ TaskStatus.INACTIVE }, actual: ${ oTransportationTask.STATUS }).`;
            $.trace.error(sLogMessage);
            await setTaskToFailed(oTransportationTask, sLogMessage);
            return;
        }
        if (oTransportationTask.TASK_TYPE !== TaskType.TRANSPORTATION_IMPORT) {
            const sLogMessage = `Cannot import data to transportation tool for task with id ${ iTaskId }, since the task has the wrong type ` + `(expected: ${ TaskType.TRANSPORTATION_IMPORT }, actual: ${ oTransportationTask.TASK_TYPE }).`;
            $.trace.error(sLogMessage);
            await setTaskToFailed(oTransportationTask, sLogMessage);
            return;
        }
        if (helpers.isNullOrUndefined(oTransportationTask.PARAMETERS)) {
            const sLogMessage = `Cannot import data to transportation tool for task with id ${ iTaskId }, ` + `since the task defined has no parameters`;
            $.trace.error(sLogMessage);
            await setTaskToFailed(oTransportationTask, sLogMessage);
            return;
        }
        let oParameters = {};
        try {
            oParameters = JSON.parse(oTransportationTask.PARAMETERS);
        } catch (e) {
            const sLogMessage = `Cannot import data to transportation tool for task with id ${ iTaskId }, ` + `since the task parameters cannot be parsed as JSON.`;
            $.trace.error(sLogMessage + ` (${ e.message || e.msg }) `);
            await setTaskToFailed(oTransportationTask, sLogMessage);
            return;
        }

        new TransportationImpl($).importData(iTaskId, oBodyData, oParameters, oPersistency);
    };

    async function setTaskToFailed(oTask, sMessage) {
        await oTaskService.updateTask(oTask, {
            STATUS: TaskStatus.FAILED,
            ERROR_CODE: Code.TRANSPORTATION_IMPORT_DATA_ERROR.code,
            ERROR_DETAILS: sMessage
        }, oConnectionFactory);
    }
}
export default {helpers,TaskStatus,TaskType,Code,TransportationImpl,Transportation};
