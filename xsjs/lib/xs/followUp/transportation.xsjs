const oConnectionFactory = new ($.require("../db/connection/connection")).ConnectionFactory($);
const Persistency = $.import("xs.db", "persistency").Persistency;
const TaskService = $.require("../service/taskService").TaskService;
const Transportation = $.import("xs.followUp", "transportation").Transportation;

/**
 * Triggers the transportation logic to import data. This function is directly invoked by the WebResponse's Follow-up.
 *
 * The Follow-up requires an xsjs-file, which is not testable. For this reason the function only creates an instance of {@link Transportation}
 * located in a testable xsjslib file. The entire orchestration logic for the calculation should be there. This function should contain as less
 * logic as possible.
 *
 * @param  {type} mParameters Map of parameters passed by the Follow-up. Must contain a property TASK_ID (check in {@link Transportation}).
 */
function transportation(mParameters){
    let iTaskId      = mParameters.TASK_ID;
    let oPersistency = new Persistency(oConnectionFactory.getConnection());
    let oTaskService = new TaskService($, oPersistency);
    let oBodyData = mParameters.A_BODY_META;

    new Transportation(iTaskId, oPersistency, oConnectionFactory, oTaskService).importData(oBodyData);
}
