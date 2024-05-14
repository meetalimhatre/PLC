//this file create background task to execute register library
const HQuery = $.require('../../xslib/hQuery').HQuery;
const installTrace = $.import('xs.postinstall.xslib', 'trace');
const pTask = $.require('../../db/persistency-task');
const whoAmI = 'xs.postinstall.xslib.task';
const _ = $.require('lodash');
const sFinishRegister = 'xs.postinstall.release_independent.99_setup_completed';
const oTarget = MTA_METADATA.version;
const [iVersion, iVersion_sp, iVersion_patch] = oTarget.split('.').map(d => +d);
const Misc = $.require('../../db/persistency-misc').Misc;
const sBusinessObjectTypes = $.require('../../util/constants').BusinessObjectTypes;
const isCloud = $.require('../../../platform/platformSpecificImports.js').isCloud;
const sPlatformConnection = $.require('../../../platform/platformSpecificImports.js').getPostinstallConnection().postInstallConnection;


var task;
var oMisc;
var oConnection;
var sNameTechnicalUser;
var oHQuerySecondary;
var sTenantID = null;


var taskObj = null;
var currentLibCount = 0;

async function error(line) {
    await installTrace.error(whoAmI, line);
}

async function info(line) {
    await installTrace.info(whoAmI, line);
}

async function debug(line) {
    await installTrace.debug(whoAmI, line);
}

async function commit() {
    await oConnection.commit();
}

async function rollback() {
    await oConnection.rollback();
}

function getTask() {
    return taskObj;
}

async function resetData() {
    taskObj = null;
    currentLibCount = 0;
}

async function getConnectionUsername(oConnection) {
    return await oConnection.executeQuery('SELECT CURRENT_USER FROM DUMMY')[0].CURRENT_USER;
}

async function getCurrentTimestamp(oConnection) {
    return await oConnection.executeQuery('SELECT CURRENT_TIMESTAMP FROM DUMMY')[0].CURRENT_TIMESTAMP;
}

async function log(sVersion, sVersionSp, sVersionPatch, sName, sStep, sState) {
    if (oConnection.close) {
        await oConnection.close();
    }
    try {
        oConnection = await getConnection(sTenantID);
        var sLogStatement = `insert into "sap.plc.db::basis.t_installation_log" (version, version_sp, version_patch, name, time, executed_by, step, state) values (?, ?, ?, ?, current_utctimestamp, ?, ?, ?)`;
        await oConnection.executeUpdate(sLogStatement, sVersion, sVersionSp, sVersionPatch, sName, sNameTechnicalUser, sStep, sState);
        await commit();
    } catch (e) {
        await error('insert data to t_installation_log table failed, can"t log post-install data to database');
        throw new Error("Can't log upgrade info to database");
    }
}

async function getConnection(sTenantid) {
    return $.import(sPlatformConnection.substr(0, sPlatformConnection.lastIndexOf('.')), sPlatformConnection.substr(sPlatformConnection.lastIndexOf('.') + 1)).getConnection(null, sTenantid);
}

async function lockLog(sUserId) {
    try {
        oMisc.lockTableTLockExclusive();
        oMisc.setLock(sBusinessObjectTypes.Customfieldsformula, sUserId);
    } catch (ex) {
        throw ex;
    }
}

async function deleteLogEntry(sUserId) {
    if (sUserId) {
        oMisc.releaseLock(sUserId);
    }
}


async function updateTaskStatus(oTask, oConnection) {
    task = new pTask.Task(oConnection);
    taskObj = await task.update(oTask);
    await oConnection.commit();
    await oConnection.close();
}

async function padLeft(sString) {
    return (sString + '     ').slice(0, 16);
}

async function genericCall(bTrace, oLibraryMeta, sMethod, requestArg) {
    await log(oLibraryMeta.version, oLibraryMeta.version_sp, oLibraryMeta.version_patch, oLibraryMeta.library_full_name, sMethod, 'started');

    await info(await padLeft('execute ' + sMethod + ': ') + oLibraryMeta.library_full_name);
    var currentTimestamp = await getCurrentTimestamp(oConnection);
    try {
        var bOK = oLibraryMeta.library[sMethod](oConnection, oLibraryMeta, requestArg);

        if (bOK && sMethod === 'run') {
            await commit();
            currentLibCount++;
            var status = currentLibCount === taskObj.PROGRESS_TOTAL ? 'complete' : 'active';
            if (status === 'complete') {
                await log(oLibraryMeta.version, oLibraryMeta.version_sp, oLibraryMeta.version_patch, oLibraryMeta.library_full_name, sMethod, 'finished');
            }
            Object.assign(taskObj, {
                TASK_ID: taskObj.TASK_ID,
                SESSION_ID: taskObj.SESSION_ID,
                TASK_TYPE: taskObj.TASK_TYPE,
                PARAMETERS: taskObj.PARAMETERS,
                STATUS: status,
                PROGRESS_STEP: currentLibCount,
                PROGRESS_TOTAL: taskObj.PROGRESS_TOTAL,
                STARTED: await convertDateToString(taskObj.STARTED),
                LAST_UPDATED_ON: await convertDateToString(currentTimestamp),
                ERROR_CODE: '0',
                ERROR_DETAILS: null
            });
            await updateTaskStatus(taskObj, oConnection);
        } else if (!bOK && sMethod !== 'clean') {
            Object.assign(taskObj, {
                TASK_ID: taskObj.TASK_ID,
                SESSION_ID: taskObj.SESSION_ID,
                TASK_TYPE: taskObj.TASK_TYPE,
                PARAMETERS: taskObj.PARAMETERS,
                STATUS: 'failed',
                PROGRESS_STEP: currentLibCount,
                PROGRESS_TOTAL: taskObj.PROGRESS_TOTAL,
                STARTED: await convertDateToString(taskObj.STARTED),
                LAST_UPDATED_ON: await convertDateToString(currentTimestamp),
                ERROR_CODE: '-1',
                ERROR_DETAILS: `${ oLibraryMeta.description } ${ sMethod } failed returning false`
            });
            await rollback();
            await updateTaskStatus(taskObj, oConnection);
        }
    } catch (e) {
        bOK = false;
        var error_detail = `${ oLibraryMeta.description } ${ sMethod } failed returning exception: ${ e.message || e.developerMessage || '' }`;
        Object.assign(taskObj, {
            TASK_ID: taskObj.TASK_ID,
            SESSION_ID: taskObj.SESSION_ID,
            TASK_TYPE: taskObj.TASK_TYPE,
            PARAMETERS: taskObj.PARAMETERS,
            STATUS: 'failed',
            PROGRESS_STEP: currentLibCount,
            PROGRESS_TOTAL: taskObj.PROGRESS_TOTAL,
            STARTED: await convertDateToString(taskObj.STARTED),
            LAST_UPDATED_ON: await convertDateToString(currentTimestamp),
            ERROR_CODE: '-1',
            ERROR_DETAILS: error_detail.length > 200 ? error_detail.slice(0, 197) + '..' : error_detail
        });
        await rollback();
        await updateTaskStatus(taskObj, oConnection);
        await error('execution terminated with an exception');
        await log(oLibraryMeta.version, oLibraryMeta.version_sp, oLibraryMeta.version_patch, oLibraryMeta.library_full_name, sMethod, 'error');
        if (sMethod === 'run') {
            await genericCall(bTrace, oLibraryMeta, 'clean', requestArg);
        }
    }
    var sResultState = bOK ? 'finished' : 'error';
    var sOut = await padLeft(sMethod + ' ' + sResultState + ': ') + oLibraryMeta.library_full_name;
    (bOK ? info : error)(sOut);
    await log(oLibraryMeta.version, oLibraryMeta.version_sp, oLibraryMeta.version_patch, oLibraryMeta.library_full_name, sMethod, sResultState);
    return bOK;
}

/**
 * convert date type to String for timestamp insert to CF DB
 * @param {Date} Date format timestamp
 * @returns {Object} return string format timestamp
 */
async function convertDateToString(oDate) {
    if (oDate && typeof oDate !== 'string') {
        return oDate.toJSON();
    }
    return oDate;
}


async function resetLockTable(oConnection, sUserId) {
    var sSchema = await oConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
    oHQuerySecondary = new HQuery(oConnection).setSchema(sSchema);
    oMisc = new Misc($, oHQuerySecondary, sUserId, oConnection);
}

async function execute(followUp, bTrace, aFilteredLibraries, sMethod, requestArg) {
    await resetData();

    oConnection = await getConnection(sTenantID);
    oConnection.setAutoCommit(true);
    sNameTechnicalUser = await getConnectionUsername(oConnection);
    await resetLockTable(oConnection, sNameTechnicalUser);
    await lockLog(sNameTechnicalUser);
    task = new pTask.Task(oConnection);

    //mock task data
    currentLibCount = followUp.PROGRESS_STEP;
    taskObj = followUp;
    var bOK = _.every(aFilteredLibraries, async function executeAndHandleExceptions(oLibraryMeta) {
        var bOK;
        try {
            if (sMethod === 'run') {
                bOK = await genericCall(bTrace, oLibraryMeta, 'check', requestArg) && (await genericCall(bTrace, oLibraryMeta, 'run', requestArg) || await genericCall(bTrace, oLibraryMeta, 'clean', requestArg) && false);
            } else {
                bOK = await genericCall(bTrace, oLibraryMeta, sMethod, requestArg);
            }
        } catch (e) {
            bOK = false;
            await rollback();
            await resetLockTable(oConnection, sNameTechnicalUser);
            await deleteLogEntry(sNameTechnicalUser);

            if (e.code === 146) {
                // 146 - resource busy and acquire with NOWAIT specified
                await error(`table "sap.plc.db::basis.t_installation_log" is locked - probably the setup is already running`);
                throw new Error(`Unable to perform the operation. Probably the setup is already running`);
            } else {
                await error('execution terminated with an internal exception:' + e.message);
                throw new Error('Eecution terminated with an internal exception. Check logs for more details');

            }
        }
        return bOK;
    });
    if (bOK) {
        if (isCloud()) {
            await updateTenantStatus(requestArg.tenantid, 3);
        }
        await log(iVersion, iVersion_sp, iVersion_patch, sFinishRegister, '', 'finished');
    }
    await resetLockTable(oConnection, sNameTechnicalUser);
    await deleteLogEntry(sNameTechnicalUser);
    await oConnection.commit();
    if (oConnection.close) {
        await oConnection.close();
    }
    return bOK;
}

async function updateTenantStatus(sTenantID, sStatus) {
    const TenancyConnection = $.require('../../ops/util/tenantUtil-cf');
    await TenancyConnection.updateTenantStatus(sTenantID, sStatus);
}

async function runBackgroundTask(args) {
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
        return await execute(args.followUp, args.traceFlag, release, args.method, args.requestArg);
    } catch (e) {
        await $.trace.info(JSON.stringify(e));
        args.followUp.STATUS = 'failed';
        args.followUp.ERROR_CODE = '-1';
        args.followUp.ERROR_DETAILS = e.message || 'Run background task failed, please check your post-install tool configuration';
        args.followUp.STARTED = await convertDateToString(args.followUp.STARTED);
        args.followUp.LAST_UPDATED_ON = await convertDateToString(args.followUp.LAST_UPDATED_ON);
        var odbConnection = await getConnection(sTenantID);
        var oTask = new pTask.Task(odbConnection).update(args.followUp);
        await odbConnection.commit();
        await odbConnection.close();
        if (isCloud()) {
            await updateTenantStatus(sTenantID, 4);
        }
        return oTask;
    }
}


async function taskInfo(request) {
    const aTask = await getTaskInfo(request);
    $.response.setBody(JSON.stringify(aTask));
}

async function getTaskInfo(request) {
    const oParam = await processParameters(request);
    const odbConnection = await getConnection(request.parameters.get('tenantid'));
    const oRes = await odbConnection.executeQuery(`
        select * 
        from "sap.plc.db::basis.t_task"
        where TASK_ID=${ oParam.id }
        `);
    if (Object.keys(oRes).length === 0) {
        return { error: 'NOT exist this task' };
    }
    const {TASK_ID, STATUS, PROGRESS_STEP, PROGRESS_TOTAL, STARTED_TIME, LAST_UPDATED_ON, ERROR_CODE, ERROR_DETAILS} = oRes[0];
    return {
        TASK_ID,
        STATUS,
        PROGRESS_STEP,
        PROGRESS_TOTAL,
        STARTED_TIME,
        LAST_UPDATED_ON,
        ERROR_CODE,
        ERROR_DETAILS
    };
}

async function processParameters(request) {
    const params = request.parameters;
    const oParam = {};
    for (let i = 0; i < params.length; i++) {
        oParam[params[i].name] = params[i].name === 'optional' ? JSON.parse(params[i].value) : params[i].value;
    }
    return oParam;
}
export default {HQuery,installTrace,pTask,whoAmI,_,sFinishRegister,oTarget,,Misc,sBusinessObjectTypes,isCloud,sPlatformConnection,task,oMisc,oConnection,sNameTechnicalUser,oHQuerySecondary,sTenantID,taskObj,currentLibCount,error,info,debug,commit,rollback,getTask,resetData,getConnectionUsername,getCurrentTimestamp,log,getConnection,lockLog,deleteLogEntry,updateTaskStatus,padLeft,genericCall,convertDateToString,resetLockTable,execute,updateTenantStatus,runBackgroundTask,taskInfo,getTaskInfo,processParameters};
