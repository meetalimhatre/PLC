//This is the main driving script which calls other scripts in the framework
//This script reads the register.xsjslib file and executes the scripts in the given order.
//The execution status of each script in maitained in "SAP_PLC"."sap.plc.db::basis.t_installation_log" table
//In case of failure of any script the execution stops and a log is written into the "SAP_PLC"."sap.plc.db::basis.t_installation_log" table
const task = await $.import('xs.postinstall.xslib', 'task');
const oTask = $.require('../../db/persistency-task');
const isCloud = $.require('../../../platform/platformSpecificImports.js').isCloud;

const target = MTA_METADATA.version;
var [version, version_sp, version_patch] = target.split('.').map(d => +d);

var {aDatabaseSetup, aPreDatabaseSetUpUpgradeSteps, aPostDatabaseSetupUpgradeSteps, aOptionalUpgradeSteps, aPreDatabaseSetupInstallSteps, aPostDatabaseSetupInstallSteps, aOptionalInstallSteps, oRegisterDescription} = isCloud() ? await $.import('xs.postinstall.xslib', 'register-cf') : await $.import('xs.postinstall.xslib', 'register-xsa');

function getConnectionUsername(oConnection) {
    return await oConnection.executeQuery('select current_user from DUMMY')[0].CURRENT_USER;
}

function setRegister(name, register) {
    this[name] = register;
}

async function overrideRegister(register, oConnection) {

    aDatabaseSetup = register.aDatabaseSetup || [];
    aPreDatabaseSetUpUpgradeSteps = register.aPreDatabaseSetUpUpgradeSteps || [];
    aPostDatabaseSetupUpgradeSteps = register.aPostDatabaseSetupUpgradeSteps || [];
    aOptionalUpgradeSteps = register.aOptionalUpgradeSteps || [];
    aPreDatabaseSetupInstallSteps = register.aPreDatabaseSetupInstallSteps || [];
    aPostDatabaseSetupInstallSteps = register.aPostDatabaseSetupInstallSteps || [];
    aOptionalInstallSteps = register.aOptionalInstallSteps || [];
    return await getMappedRegister(false, oConnection);
}


const traceWrapper = await $.import('xs.postinstall.xslib', 'traceWrapper');
const trace = await $.import('xs.postinstall.xslib', 'trace');
const whoAmI = 'xs.postinstall.xslib.driver';
const lockError = 'Lock for current schema cannot be obtained';

async function error(line) {
    await trace.error(whoAmI, line);
}
async function info(line) {
    await trace.info(whoAmI, line);
}
async function debug(line) {
    await trace.debug(whoAmI, line);
}
async function commit(oConnection) {
    await oConnection.commit();
}
async function rollback(oConnection) {
    await oConnection.rollback();
}

async function createSessionID(oConnection) {
    return await oConnection.executeQuery('SELECT TO_VARCHAR(SYSUUID) as SESSIONID FROM DUMMY')[0].SESSIONID;
}

async function getCurrentTimestamp(oConnection) {
    return await oConnection.executeQuery('SELECT CURRENT_TIMESTAMP FROM DUMMY')[0].CURRENT_TIMESTAMP;
}

async function log(sVersion, sVersionSp, sVersionPatch, sName, sStep, sState, oConnection) {
    var sLogStatement = 'insert into "sap.plc.db::basis.t_installation_log" (version, version_sp, version_patch, name, time, executed_by, step, state)' + '    values (?, ?, ?, ?, current_utctimestamp, ?, ?, ?)';
    await oConnection.executeUpdate(sLogStatement, sVersion, sVersionSp, sVersionPatch, sName, $.getPlcUsername(), sStep, sState);
}

async function readBaseRelease(oConnection) {
    // determine last successfully upgraded path or default to 0.0.0
    const sBaseReleaseQuery = 'select top 1' + '    VERSION       as "version",' + '    VERSION_SP    as "version_sp",' + '    VERSION_PATCH as "version_patch"' + 'from "sap.plc.db::basis.t_installation_log"' + "where name like '%xs.postinstall.release_independent.99_setup_completed' and state = 'finished'" + 'order by "version" desc, "version_sp" desc, "version_patch" desc';

    const aResult = await oConnection.executeQuery(sBaseReleaseQuery);
    var oResult;
    if (aResult.length) {
        oResult = {
            version: aResult[0].version,
            version_sp: aResult[0].version_sp,
            version_patch: aResult[0].version_patch
        };
    } else {
        oResult = {
            version: 0,
            version_sp: 0,
            version_patch: 0
        };
    }
    await info('base release: ' + JSON.stringify(oResult));
    return oResult;
}

async function readLastAction(oConnection) {
    // read last action
    const sLastActionQuery = `SELECT 
            TOP 1 
            "NAME",
            "STEP",
            "STATE" 
        FROM 
            "sap.plc.db::basis.t_installation_log"
        ORDER BY 
            VERSION DESC, VERSION_SP DESC, VERSION_PATCH DESC, TIME DESC`;

    const aResult = await oConnection.executeQuery(sLastActionQuery);
    var oResult;
    if (aResult.length) {
        oResult = {
            name: aResult[0].NAME,
            step: aResult[0].STEP,
            state: aResult[0].STATE
        };
    } else {
        await $.trace.info('Could not find any records in "sap.plc.db::basis.t_installation_log"');
    }
    return oResult;
}



async function setResponse(response, status, contentType, body) {
    response.status = status;
    response.contentType = contentType;
    response.setBody(body);
    return body;
}


// iterate the "relevant" steps
// a step is upgrade relevant if
//    - it belongs to a release after the base release
// relevant steps may be filtered
//    - by default steps that were run successful will not be processed
//        - a step was run successful if it is in the log as "run finished"
//          AND it has no successive log entry for "clean".
//    - if steps are explicitly filtered by means of URL parameters no check of their relevance will happen
async function execute(request, response, sMethod, bTrace, bRunInBackground, oConnection) {

    await trace.setTransientMode('i');

    var register = await obtainFinalSteps(request, oConnection);
    var task = await createTask(register, 0, sMethod, oConnection);
    const oParam = await processParameters(request);
    await runBackgroundTask(response, register, task, sMethod, bTrace, oParam, bRunInBackground);
    await setResponse(response, $.net.http.OK, 'text/plain', JSON.stringify({
        task_id: task.TASK_ID,
        status: task.TASK_ID ? 'SUCCESS' : 'FAILED',
        steps: register,
        task: task
    }));
    return task;
}

async function wrap(request, response, sMethod, bRunInBackground, oConnection) {
    try {
        var result = await execute(request, response, sMethod, true, bRunInBackground, oConnection);
        return result.TASK_ID;
    } catch (e) {
        await $.trace.info(JSON.stringify(e));
        var errorMessage = 'There was an error during the installation. Please check the logs for more details. {' + e.message + '};{' + e.stack + '}';
        await setResponse(response, $.net.http.INTERNAL_SERVER_ERROR, 'text/plain', errorMessage);
    }

}

async function driver(request, response) {
    processRequest(request, response);
}

async function run(request, response, bRunInBackground = false, oConnection) {
    return await wrap(request, response, 'run', bRunInBackground, oConnection);
}

async function check(request, response, bRunInBackground = false.oConnection) {
    return await wrap(request, response, 'check', bRunInBackground);
}

async function clean(request, response, bRunInBackground = false, oConnection) {
    return await wrap(request, response, 'clean', bRunInBackground);
}

async function createTask(register, currentStep, sMethod, oConnection) {
    var curTime = await getCurrentTimestamp(oConnection);

    return await (await new oTask.Task(oConnection)).create({
        TASK_ID: null,
        SESSION_ID: await createSessionID(oConnection),
        TASK_TYPE: sMethod,
        PARAMETERS: null,
        STATUS: 'active',
        PROGRESS_STEP: currentStep,
        PROGRESS_TOTAL: register.length,
        STARTED: curTime,
        LAST_UPDATED_ON: curTime,
        ERROR_CODE: '0',
        ERROR_DETAILS: null
    });
}

async function runBackgroundTask(response, register, oFollowUp, sMethod, bTrace, oParam, bRunInBackground) {
    const oParams = {
        followUp: oFollowUp,
        filterLibs: register,
        method: sMethod,
        traceFlag: bTrace,
        requestArg: oParam
    };
    if (bRunInBackground) {
        response.followUp({
            uri: 'xs.postinstall.rest:backgroundTask.xsjs',
            functionName: 'runBackgroundTask',
            parameter: oParams
        });
    } else {
        await task.runBackgroundTask(oParams);
    }

}

async function processParameters(request) {
    const params = request.parameters;
    const oParam = {};
    for (let i = 0; i < params.length; i++) {
        if (params[i].name === 'optional' || params[i].name === 'file' && params[i].value !== 'no data') {
            oParam[params[i].name] = JSON.parse(params[i].value);
        } else {
            oParam[params[i].name] = params[i].value;
        }
    }
    return oParam;
}

async function isFreshInstallation(request) {
    const oParam = await processParameters(request);
    return oParam.mode === 'freshInstallation';
}

async function getFreshInstallationRegister() {
    return [
        ...aPreDatabaseSetupInstallSteps,
        ...aDatabaseSetup,
        ...aPostDatabaseSetupInstallSteps
    ].map(library_full_name => {
        const aPath = library_full_name.split('.');
        const sName = aPath.pop();
        const sPackage = aPath.join('.');
        return {
            library_full_name,
            library_package: sPackage,
            library_name: sName,
            version,
            version_sp,
            version_patch,
            description: oRegisterDescription[library_full_name] ? oRegisterDescription[library_full_name] : null
        };
    });
}


async function getCurrentStep(aRegister, oConnection) {
    const sErrorStepName = await getLatestErrorStep(oConnection);
    return aRegister.map(oRigister => oRigister.library_full_name).indexOf(sErrorStepName) + 1;
}

async function getLatestErrorStep(oConnection) {
    const oRes = await oConnection.executeQuery(`
        select top 1 * 
            from "sap.plc.db::basis.t_installation_log"
            where step != 'clean' and state = 'error'
            order by version desc, version_sp desc, version_patch desc
        `)[0];
    return oRes && oRes.NAME;
}

async function getUpgradeRegisters(oConnection, oBaseRelease = await readBaseRelease(oConnection)) {
    const oUpgradeRegisters = [
        ...await mapUpgradeRegister(aPreDatabaseSetUpUpgradeSteps),
        ...aDatabaseSetup.map(library_full_name => {
            const aPath = library_full_name.split('.');
            const sName = aPath.pop();
            const sPackage = aPath.join('.');
            return {
                version,
                version_sp,
                version_patch,
                library_full_name,
                library_package: sPackage,
                library_name: sName,
                description: oRegisterDescription[library_full_name] ? oRegisterDescription[library_full_name] : null
            };
        }),
        ...await mapUpgradeRegister(aPostDatabaseSetupUpgradeSteps)
    ];
    return oUpgradeRegisters.filter(oRegisterEntry => {
        return oRegisterEntry.version > oBaseRelease.version || oRegisterEntry.version >= oBaseRelease.version && (oRegisterEntry.version_sp > oBaseRelease.version_sp || oRegisterEntry.version_sp >= oBaseRelease.version_sp && oRegisterEntry.version_patch > oBaseRelease.version_patch);
    });
}


async function getMappedRegister(bIsFreshInstallation, oConnection) {
    return bIsFreshInstallation ? await getFreshInstallationRegister(oConnection) : await getUpgradeRegisters(oConnection);
}

async function mapUpgradeRegister(steps) {
    if (steps.length === 0) {
        return steps;
    }
    return steps.reduce((prev, next) => {
        return [
            ...prev,
            ...next.library.map(library_full_name => {
                const aPath = library_full_name.split('.');
                const sName = aPath.pop();
                const sPackage = aPath.join('.');
                return {
                    version: next.version,
                    version_sp: next.version_sp,
                    version_patch: next.version_patch,
                    library_full_name,
                    library_package: sPackage,
                    library_name: sName,
                    description: oRegisterDescription[library_full_name] ? oRegisterDescription[library_full_name] : null
                };
            })
        ];
    }, []);
}

async function obtainFinalSteps(request, oConnection) {
    try {
        var strError = '';
        const oParam = await processParameters(request);
        const bIsFreshInstallation = await isFreshInstallation(request);
        const aMappedRegister = await getMappedRegister(bIsFreshInstallation, oConnection);
        const aOptionalRegister = await getOptionalRegister(oParam.optional, bIsFreshInstallation);
        const aMappedFreshInstallRegisters = [
            ...aMappedRegister,
            ...aOptionalRegister
        ];
        const currentStep = await getCurrentStep(aMappedFreshInstallRegisters, oConnection);

        if (currentStep === 0) {
            return aMappedFreshInstallRegisters;
        } else {
            strError += 'aMappedFreshInstallRegisters.slice started.';
            return aMappedFreshInstallRegisters.slice(currentStep - 1);
        }
    } catch (e) {
        await $.trace.info(JSON.stringify(e));
        var strErrorOutput = '#' + e.message + '#' + e.stack + '#' + strError + '#';
        throw new Error(strErrorOutput);
    }
}

async function getOptionalRegister(aOptionID, bIsFreshInstallation) {
    return await getMappedOptionalRegister(bIsFreshInstallation ? aOptionalInstallSteps : aOptionalUpgradeSteps, aOptionID);
}


async function getMappedOptionalRegister(steps, aOptionID) {
    if (aOptionID === undefined) {
        return steps.reduce((prev, next) => {
            return [
                ...prev,
                ...next.library.map(library_full_name => {
                    const aPath = library_full_name.split('.');
                    const sName = aPath.pop();
                    const sPackage = aPath.join('.');
                    return {
                        library_full_name,
                        library_package: sPackage,
                        library_name: sName,
                        version,
                        version_sp,
                        version_patch,
                        description: oRegisterDescription[library_full_name] ? oRegisterDescription[library_full_name] : null
                    };
                })
            ];
        }, []);
    }
    return steps.filter(step => aOptionID.indexOf(step.id) !== -1).reduce((prev, next) => {
        return [
            ...prev,
            ...next.library.map(library_full_name => {
                const aPath = library_full_name.split('.');
                const sName = aPath.pop();
                const sPackage = aPath.join('.');
                return {
                    library_full_name,
                    library_package: sPackage,
                    library_name: sName,
                    version,
                    version_sp,
                    version_patch,
                    description: oRegisterDescription[library_full_name] ? oRegisterDescription[library_full_name] : null
                };
            })
        ];
    }, []);
}
export default {task,oTask,isCloud,target,,,getConnectionUsername,setRegister,overrideRegister,traceWrapper,trace,whoAmI,lockError,error,info,debug,commit,rollback,createSessionID,getCurrentTimestamp,log,readBaseRelease,readLastAction,setResponse,execute,wrap,driver,run,check,clean,createTask,runBackgroundTask,processParameters,isFreshInstallation,getFreshInstallationRegister,getCurrentStep,getLatestErrorStep,getUpgradeRegisters,getMappedRegister,mapUpgradeRegister,obtainFinalSteps,getOptionalRegister,getMappedOptionalRegister};
