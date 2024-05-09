const task = $.import('xs.postinstall.xslib', 'task');
const initTask = require("../../../../lib/xs/db/persistency-task");
let oConnection;

const failureReleaseLib = [
	{library_full_name : 'xsjs.postinstall.dummy_setup_method.setup_dummy_always_success', version: '2', version_sp: '2', version_patch: '0', library_package: "xsjs.postinstall.dummy_setup_method", library_name: "setup_dummy_always_success"},
	{library_full_name : 'xsjs.postinstall.dummy_setup_method.setup_dummy_run_and_clean_failure', version: '2', version_sp: '2', version_patch: '0', library_package: "xsjs.postinstall.dummy_setup_method", library_name: "setup_dummy_run_and_clean_failure"}	  
];

const successfullyReleaseLib = [
	{library_full_name : 'xsjs.postinstall.dummy_setup_method.setup_dummy_always_success', version: '2', version_sp: '2', version_patch: '0', library_package: "xsjs.postinstall.dummy_setup_method", library_name: "setup_dummy_always_success"},
	{library_full_name : 'xsjs.postinstall.dummy_setup_method.setup_dummy_always_success', version: '2', version_sp: '2', version_patch: '0', library_package: "xsjs.postinstall.dummy_setup_method", library_name: "setup_dummy_always_success"}
];

const taskTable = "sap.plc.db::basis.t_task";
var oTask = {};
var pTask;

function convertDateToString(oDate) {
    if (oDate && typeof(oDate) !== "string") {
        return oDate.toJSON();
    }
    return oDate;
}

function getSessionID() {
	return oConnection.executeQuery(`SELECT TO_VARCHAR(SYSUUID) as SESSIONID FROM "sap.plc.db::DUMMY"`)[0].SESSIONID;
}

function getCurrentTimestamp() {
    return oConnection.executeQuery(`SELECT CURRENT_TIMESTAMP FROM "sap.plc.db::DUMMY"`)[0].CURRENT_TIMESTAMP;
}


function wipeLog() {
    oConnection.executeUpdate('DELETE FROM "sap.plc.db::basis.t_installation_log"');
    oConnection.commit();
}

function getReleaseLibs(oReleaseLibs){
	var release = [];
	oReleaseLibs.forEach(function(lib) {
		release.push({
			library: $.import(lib.library_package, lib.library_name),
			library_full_name: lib.library_full_name,
            version: lib.version,
            version_sp: lib.version_sp,
            version_patch: lib.version_patch
		});
	});
	return release;
}

function closeConnection() {
    oConnection.close();
}

function getTaskResult() {
    var result = oConnection.executeQuery(`SELECT * FROM "${taskTable}" WHERE TASK_ID = ${oTask.TASK_ID}`)[0];
	return {
		TASK_ID : result.TASK_ID,
		SESSION_ID : result.SESSION_ID,
        TASK_TYPE : result.TASK_TYPE,
        PARAMETERS : result.PARAMETERS,
        STATUS : result.STATUS,
        PROGRESS_STEP : result.PROGRESS_STEP,
        PROGRESS_TOTAL : result.PROGRESS_TOTAL,
		STARTED : result.STARTED,
		LAST_UPDATED_ON : convertDateToString(result.LAST_UPDATED_ON),
		ERROR_CODE : result.ERROR_CODE,
		ERROR_DETAILS : result.ERROR_DETAILS
	}
}

function setTaskValue() {
	oTask.TASK_ID = task.getTask().TASK_ID;
    oTask.LAST_UPDATED_ON = task.getTask().LAST_UPDATED_ON;
    oTask.STARTED = task.getTask().STARTED;
    oTask.SESSION_ID = task.getTask().SESSION_ID;
    oTask.TASK_TYPE = task.getTask().TASK_TYPE;
    oTask.PARAMETERS = task.getTask().PARAMETERS;
    oTask.ERROR_CODE = task.getTask().ERROR_CODE;
    oTask.ERROR_DETAILS = task.getTask().ERROR_DETAILS;
}


describe('test background task of libraries install or upgrade', function(){
    beforeEach(function() {
    	oTask = {
                TASK_ID: null,
                SESSION_ID: getSessionID(),
                TASK_TYPE: '',
                PARAMETERS: null,
                STATUS: 'active',
                PROGRESS_STEP: 0,
                PROGRESS_TOTAL: 2,
                STARTED: null,
                LAST_UPDATED_ON: null,
                ERROR_CODE: '0',
                ERROR_DETAILS: null
		};
    	oTask = pTask.create(oTask);
    	oConnection.commit();
    	wipeLog();
    });
    afterEach(wipeLog);
    beforeAll(function() {
        oConnection = $.hdb.getConnection();
        pTask = new initTask.Task(oConnection);
    });
    afterAll(closeConnection);
    
    it('test task complete successfully', function() {
        var bOK = task.execute(oTask, true, getReleaseLibs(successfullyReleaseLib), 'run', {});
        setTaskValue();
        oTask.STATUS = 'complete';
        oTask.PROGRESS_STEP = 2;
        expect(oTask).toEqual(getTaskResult());
        expect(bOK).toEqual(true);
    });
    
    it('test task complete failure', function() {
        var bOK = task.execute(oTask, true, getReleaseLibs(failureReleaseLib), 'run', {});
        setTaskValue();
        oTask.SESSION_ID = task.getTask().SESSION_ID;
        oTask.STATUS = 'failed';
        oTask.PROGRESS_STEP = 1;
        expect(oTask).toEqual(getTaskResult());
        expect(bOK).toEqual(false);
   });
}).addTags(["All_Unit_Tests"]);;