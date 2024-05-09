const oConnectionFactory  = new ($.require("../db/connection/connection")).ConnectionFactory($);
const Persistency         = $.import("xs.db", "persistency").Persistency; 
const TaskService	      = $.require("../service/taskService").TaskService;
const LifecycleCalculator = $.import("xs.followUp", "lifecycleCalculator").LifecycleVersionCalculator;
const helpers 			  = $.require("../util/helpers");
const Constants 		  = $.require("../util/constants");

/**
 * Triggers the calculation of lifecylce versions. This function is directly invoked by the WebReponses Follow-up. 
 * 
 * The Follow-up requires a xsjs-file, which is not testable. For this reason the function only creates an instance of {@link LifecycleCalculator} 
 * located in a testable xsjslib file. The entire orchestration logic for the calculation should be there. This function should contain as less 
 * logic as possible.
 *  
 * @param  {type} mParameters Map of parameters passed by the Follow-up. Must contain a property TASK_ID (check in {@link LifecycleCalculator}).
 */ 
function calculateLifecycleVersions(mParameters){
	var iTaskId      = mParameters.TASK_ID;
	var oPersistency = new Persistency(oConnectionFactory.getConnection());
	var oTaskService = new TaskService($, oPersistency);
	var bOverwriteManualVersions = mParameters.OVERWRITE_MANUAL_VERSION;
	var sOneTimeCostItemDescription = helpers.isNullOrUndefinedOrEmpty(mParameters.ONE_TIME_COST_ITEM_DESCRIPTION) === true ? Constants.OneTimeCostItemDescription : mParameters.ONE_TIME_COST_ITEM_DESCRIPTION;
	
	new LifecycleCalculator(iTaskId, oPersistency, oConnectionFactory, oTaskService, bOverwriteManualVersions, sOneTimeCostItemDescription).calculate();
}