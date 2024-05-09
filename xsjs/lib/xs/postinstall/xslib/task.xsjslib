//this file create background task to execute register library
const HQuery = $.require("../../xslib/hQuery").HQuery;
const installTrace = $.import("xs.postinstall.xslib", "trace");
const pTask = $.require("../../db/persistency-task");
const whoAmI = "xs.postinstall.xslib.task";
const _ = $.require("lodash");
const sFinishRegister = "xs.postinstall.release_independent.99_setup_completed";
const oTarget = MTA_METADATA.version;
const [iVersion, iVersion_sp, iVersion_patch] = oTarget.split('.').map(d => +d);
const Misc = $.require("../../db/persistency-misc").Misc;
const sBusinessObjectTypes = $.require("../../util/constants").BusinessObjectTypes;
const isCloud = $.require("../../../platform/platformSpecificImports.js").isCloud;
const sPlatformConnection = $.require("../../../platform/platformSpecificImports.js").getPostinstallConnection().postInstallConnection;


var task;
var oMisc;
var oConnection;
var sNameTechnicalUser;
var oHQuerySecondary;
var sTenantID = null;


var taskObj = null;
var currentLibCount = 0;

function error(line) {
    installTrace.error(whoAmI, line);
}

function info(line) {
    installTrace.info(whoAmI, line);
}

function debug(line) {
    installTrace.debug(whoAmI, line);
}

function commit() {
    oConnection.commit();
}

function rollback() {
    oConnection.rollback();
}

function getTask() {
    return taskObj;
}

function resetData() {
    taskObj = null;
    currentLibCount = 0;
}

function getConnectionUsername(oConnection) {
    return oConnection.executeQuery("SELECT CURRENT_USER FROM DUMMY")[0].CURRENT_USER;
}

function getCurrentTimestamp(oConnection) {
    return oConnection.executeQuery("SELECT CURRENT_TIMESTAMP FROM DUMMY")[0].CURRENT_TIMESTAMP;
}

function log(sVersion, sVersionSp, sVersionPatch, sName, sStep, sState) {
    if (oConnection.close) {
        oConnection.close();
    }
    try {
        oConnection = getConnection(sTenantID);
        var sLogStatement =
            `insert into "sap.plc.db::basis.t_installation_log" (version, version_sp, version_patch, name, time, executed_by, step, state) values (?, ?, ?, ?, current_utctimestamp, ?, ?, ?)`;
        oConnection.executeUpdate(sLogStatement, sVersion, sVersionSp, sVersionPatch, sName, sNameTechnicalUser, sStep, sState);
        commit();
    } catch (e) {
        error("insert data to t_installation_log table failed, can\"t log post-install data to database");
        throw new Error("Can't log upgrade info to database");
    }
}

function getConnection(sTenantid) {
    return $.import(sPlatformConnection.substr(0, sPlatformConnection.lastIndexOf(".")), sPlatformConnection.substr(sPlatformConnection.lastIndexOf(".") + 1)).getConnection(null, sTenantid);
}

function lockLog(sUserId) {
    try {
        oMisc.lockTableTLockExclusive();
        oMisc.setLock(sBusinessObjectTypes.Customfieldsformula, sUserId);
    } catch (ex) {
        throw (ex);
    }
}

function deleteLogEntry(sUserId) {
    if (sUserId) {
        oMisc.releaseLock(sUserId);
    }
}


function updateTaskStatus(oTask, oConnection) {
    task = new pTask.Task(oConnection);
    taskObj = task.update(oTask);
    oConnection.commit();
    oConnection.close();
}

function padLeft(sString) {
    return (sString + "     ").slice(0, 16);
}

function genericCall(bTrace, oLibraryMeta, sMethod, requestArg) {
    log(oLibraryMeta.version, oLibraryMeta.version_sp, oLibraryMeta.version_patch, oLibraryMeta.library_full_name, sMethod, "started");

    info(padLeft("execute " + sMethod + ": ") + oLibraryMeta.library_full_name);
    var currentTimestamp = getCurrentTimestamp(oConnection);
    try {
        var bOK = oLibraryMeta.library[sMethod](oConnection, oLibraryMeta, requestArg);

        if (bOK && sMethod === "run") {
            commit();
            currentLibCount++;
            var status = (currentLibCount === taskObj.PROGRESS_TOTAL ? "complete" : "active");
            if (status === "complete") {
                log(oLibraryMeta.version, oLibraryMeta.version_sp, oLibraryMeta.version_patch, oLibraryMeta.library_full_name, sMethod, "finished");
            }
            Object.assign(taskObj, {
                TASK_ID: taskObj.TASK_ID,
                SESSION_ID: taskObj.SESSION_ID,
                TASK_TYPE: taskObj.TASK_TYPE,
                PARAMETERS: taskObj.PARAMETERS,
                STATUS: status,
                PROGRESS_STEP: currentLibCount,
                PROGRESS_TOTAL: taskObj.PROGRESS_TOTAL,
                STARTED: convertDateToString(taskObj.STARTED),
                LAST_UPDATED_ON: convertDateToString(currentTimestamp),
                ERROR_CODE: "0",
                ERROR_DETAILS: null
            });
            updateTaskStatus(taskObj, oConnection);
        }
        else if (!bOK && sMethod !== "clean") {
            Object.assign(taskObj, {
                TASK_ID: taskObj.TASK_ID,
                SESSION_ID: taskObj.SESSION_ID,
                TASK_TYPE: taskObj.TASK_TYPE,
                PARAMETERS: taskObj.PARAMETERS,
                STATUS: "failed",
                PROGRESS_STEP: currentLibCount,
                PROGRESS_TOTAL: taskObj.PROGRESS_TOTAL,
                STARTED: convertDateToString(taskObj.STARTED),
                LAST_UPDATED_ON: convertDateToString(currentTimestamp),
                ERROR_CODE: "-1",
                ERROR_DETAILS: `${oLibraryMeta.description} ${sMethod} failed returning false`
            });
            rollback();
            updateTaskStatus(taskObj, oConnection);
        }
    } catch (e) {
        bOK = false;
        var error_detail = `${oLibraryMeta.description} ${sMethod} failed returning exception: ${e.message || e.developerMessage || ""}`;
        Object.assign(taskObj, {
            TASK_ID: taskObj.TASK_ID,
            SESSION_ID: taskObj.SESSION_ID,
            TASK_TYPE: taskObj.TASK_TYPE,
            PARAMETERS: taskObj.PARAMETERS,
            STATUS: "failed",
            PROGRESS_STEP: currentLibCount,
            PROGRESS_TOTAL: taskObj.PROGRESS_TOTAL,
            STARTED: convertDateToString(taskObj.STARTED),
            LAST_UPDATED_ON: convertDateToString(currentTimestamp),
            ERROR_CODE: "-1",
            ERROR_DETAILS: error_detail.length > 200 ? error_detail.slice(0, 197) + ".." : error_detail
        });
        rollback();
        updateTaskStatus(taskObj, oConnection);
        error("execution terminated with an exception");
        log(oLibraryMeta.version, oLibraryMeta.version_sp, oLibraryMeta.version_patch, oLibraryMeta.library_full_name, sMethod, "error");
        if (sMethod === "run") {
            genericCall(bTrace, oLibraryMeta, "clean", requestArg);
        }
    }
    var sResultState = bOK ? "finished" : "error";
    var sOut = padLeft(sMethod + " " + sResultState + ": ") + oLibraryMeta.library_full_name;
    (bOK ? info : error)(sOut);
    log(oLibraryMeta.version, oLibraryMeta.version_sp, oLibraryMeta.version_patch, oLibraryMeta.library_full_name, sMethod, sResultState);
    return bOK;
}

/**
 * convert date type to String for timestamp insert to CF DB
 * @param {Date} Date format timestamp
 * @returns {Object} return string format timestamp
 */
function convertDateToString(oDate) {
    if (oDate && typeof(oDate) !== "string") {
        return oDate.toJSON();
    }
    return oDate;
}


function resetLockTable(oConnection, sUserId) {
    var sSchema = oConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
    oHQuerySecondary = new HQuery(oConnection).setSchema(sSchema);
    oMisc = new Misc($, oHQuerySecondary, sUserId, oConnection);
}

function execute(followUp, bTrace, aFilteredLibraries, sMethod, requestArg) {
    resetData();

    oConnection = getConnection(sTenantID);
    oConnection.setAutoCommit(true);
    sNameTechnicalUser = getConnectionUsername(oConnection);
    resetLockTable(oConnection, sNameTechnicalUser);
    lockLog(sNameTechnicalUser);
    task = new pTask.Task(oConnection);

    //mock task data
    currentLibCount = followUp.PROGRESS_STEP
    taskObj = followUp;
    var bOK = _.every(aFilteredLibraries, function executeAndHandleExceptions(oLibraryMeta) {
        var bOK;
        try {
            if (sMethod === "run") {
                bOK = genericCall(bTrace, oLibraryMeta, "check", requestArg) &&
                    (genericCall(bTrace, oLibraryMeta, "run", requestArg) || genericCall(bTrace, oLibraryMeta, "clean", requestArg) && false);
            }
            else {
                bOK = genericCall(bTrace, oLibraryMeta, sMethod, requestArg);
            }
        } catch (e) {
            bOK = false;
            rollback();
            resetLockTable(oConnection, sNameTechnicalUser);
            deleteLogEntry(sNameTechnicalUser);

            if (e.code === 146) {
                // 146 - resource busy and acquire with NOWAIT specified
                error(`table "sap.plc.db::basis.t_installation_log" is locked - probably the setup is already running`)
                throw new Error(`Unable to perform the operation. Probably the setup is already running`);
            } else {
                error("execution terminated with an internal exception:" + e.message);
                throw new Error("Eecution terminated with an internal exception. Check logs for more details");
                
            }
        }
        return bOK;
    });
    if (bOK) {
        if (isCloud()) {
            updateTenantStatus(requestArg.tenantid, 3);
        }
        log(iVersion, iVersion_sp, iVersion_patch, sFinishRegister, "", "finished");
    }
    resetLockTable(oConnection, sNameTechnicalUser);
    deleteLogEntry(sNameTechnicalUser);
    oConnection.commit();
    if (oConnection.close) {
        oConnection.close();
    }
    return bOK;
}

function updateTenantStatus(sTenantID, sStatus) {
    const TenancyConnection = $.require("../../ops/util/tenantUtil-cf");
    TenancyConnection.updateTenantStatus(sTenantID, sStatus);
}

function runBackgroundTask(args) {
    var release = [];
    sTenantID = args.requestArg.tenantid;
    try {
        args.filterLibs.forEach(function (lib) {
            release.push({
                library: $.import(lib.library_package, lib.library_name),
                library_full_name: lib.library_full_name,
                version: lib.version,
                version_sp: lib.version_sp,
                version_patch: lib.version_patch,
                description: lib.description
            });
        });
        return execute(args.followUp, args.traceFlag, release, args.method, args.requestArg);
    }
    catch (e) {
        $.trace.info(JSON.stringify(e));
        args.followUp.STATUS = "failed";
        args.followUp.ERROR_CODE = "-1";
        args.followUp.ERROR_DETAILS = e.message || "Run background task failed, please check your post-install tool configuration";
        args.followUp.STARTED = convertDateToString(args.followUp.STARTED);
        args.followUp.LAST_UPDATED_ON = convertDateToString(args.followUp.LAST_UPDATED_ON);
        var odbConnection = getConnection(sTenantID);
        var oTask = new pTask.Task(odbConnection).update(args.followUp);
        odbConnection.commit();
        odbConnection.close();
        if (isCloud()) {
            updateTenantStatus(sTenantID, 4);
        }
        return oTask;
    }
}


function taskInfo(request) {
    const aTask = getTaskInfo(request);
    $.response.setBody(JSON.stringify(aTask));
}

function getTaskInfo(request) {
    const oParam = processParameters(request);
    const odbConnection = getConnection(request.parameters.get("tenantid"));
    const oRes = odbConnection.executeQuery(`
        select * 
        from "sap.plc.db::basis.t_task"
        where TASK_ID=${oParam.id}
        `
    );
    if (Object.keys(oRes).length === 0) {
        return {
            error: "NOT exist this task"
        };
    }
    const { TASK_ID, STATUS, PROGRESS_STEP, PROGRESS_TOTAL, STARTED_TIME, LAST_UPDATED_ON, ERROR_CODE, ERROR_DETAILS } = oRes[0];
    return { TASK_ID, STATUS, PROGRESS_STEP, PROGRESS_TOTAL, STARTED_TIME, LAST_UPDATED_ON, ERROR_CODE, ERROR_DETAILS };
}

function processParameters(request) {
    const params = request.parameters;
    const oParam = {};
    for (let i = 0; i < params.length; i++) {
        oParam[params[i].name] = params[i].name === "optional" ? JSON.parse(params[i].value) : params[i].value;
    }
    return oParam;
}

