//This is the main driving script which calls other scripts in the framework
//This script reads the register.xsjslib file and executes the scripts in the given order.
//The execution status of each script in maitained in "SAP_PLC"."sap.plc.db::basis.t_installation_log" table
//In case of failure of any script the execution stops and a log is written into the "SAP_PLC"."sap.plc.db::basis.t_installation_log" table
const task = $.import("xs.postinstall.xslib", "task");
const oTask = $.require("../../db/persistency-task");
const isCloud = $.require("../../../platform/platformSpecificImports.js").isCloud;

const target = MTA_METADATA.version;
var [ version, version_sp, version_patch ] = target.split('.').map(d => +d);

var { 
    aDatabaseSetup, 
    aPreDatabaseSetUpUpgradeSteps, aPostDatabaseSetupUpgradeSteps, aOptionalUpgradeSteps,
    aPreDatabaseSetupInstallSteps, aPostDatabaseSetupInstallSteps, aOptionalInstallSteps,
    oRegisterDescription
} = isCloud() ? $.import("xs.postinstall.xslib", "register-cf") : $.import("xs.postinstall.xslib", "register-xsa");

function getConnectionUsername(oConnection)
{
    return oConnection.executeQuery('select current_user from DUMMY')[0].CURRENT_USER;
}

function setRegister(name, register) {
    this[name] = register;
}

function overrideRegister(register, oConnection) {
 
    aDatabaseSetup = register.aDatabaseSetup || [];
    aPreDatabaseSetUpUpgradeSteps = register.aPreDatabaseSetUpUpgradeSteps || [];
    aPostDatabaseSetupUpgradeSteps = register.aPostDatabaseSetupUpgradeSteps || [];
    aOptionalUpgradeSteps = register.aOptionalUpgradeSteps || [];
    aPreDatabaseSetupInstallSteps = register.aPreDatabaseSetupInstallSteps || [];
    aPostDatabaseSetupInstallSteps = register.aPostDatabaseSetupInstallSteps || [];
    aOptionalInstallSteps = register.aOptionalInstallSteps || [];
    return getMappedRegister(false, oConnection);
}


const traceWrapper = $.import("xs.postinstall.xslib", "traceWrapper");
const trace = $.import("xs.postinstall.xslib", "trace");
const whoAmI = 'xs.postinstall.xslib.driver';
const lockError="Lock for current schema cannot be obtained";

function error(line) { trace.error(whoAmI, line); }
function info(line)  { trace.info(whoAmI, line);  }
function debug(line) { trace.debug(whoAmI, line); }
function commit(oConnection)   { oConnection.commit(); }
function rollback(oConnection) { oConnection.rollback(); }

function createSessionID(oConnection) {
    return oConnection.executeQuery('SELECT TO_VARCHAR(SYSUUID) as SESSIONID FROM DUMMY')[0].SESSIONID;
}

function getCurrentTimestamp(oConnection) {
    return oConnection.executeQuery('SELECT CURRENT_TIMESTAMP FROM DUMMY')[0].CURRENT_TIMESTAMP;
}

function log(sVersion, sVersionSp, sVersionPatch, sName, sStep, sState, oConnection) {
    var sLogStatement =
        'insert into "sap.plc.db::basis.t_installation_log" (version, version_sp, version_patch, name, time, executed_by, step, state)' +
        '    values (?, ?, ?, ?, current_utctimestamp, ?, ?, ?)';
    oConnection.executeUpdate(sLogStatement, sVersion, sVersionSp, sVersionPatch, sName, $.getPlcUsername(), sStep, sState);
}

function readBaseRelease(oConnection) {
    // determine last successfully upgraded path or default to 0.0.0
    const sBaseReleaseQuery =
        'select top 1' +
        '    VERSION       as "version",' +
        '    VERSION_SP    as "version_sp",' +
        '    VERSION_PATCH as "version_patch"' +
        'from "sap.plc.db::basis.t_installation_log"' +
        "where name like '%xs.postinstall.release_independent.99_setup_completed' and state = 'finished'" +
        'order by "version" desc, "version_sp" desc, "version_patch" desc';

    const aResult = oConnection.executeQuery(sBaseReleaseQuery); 
    var oResult;
    if (aResult.length) {
        oResult={version: aResult[0].version, version_sp: aResult[0].version_sp, version_patch: aResult[0].version_patch};
    } else {
        oResult={version: 0, version_sp: 0, version_patch: 0 };
    }
    info("base release: " + JSON.stringify(oResult));
    return oResult;
}

function readLastAction(oConnection) {
    // read last action
    const sLastActionQuery =
        `SELECT 
            TOP 1 
            "NAME",
            "STEP",
            "STATE" 
        FROM 
            "sap.plc.db::basis.t_installation_log"
        ORDER BY 
            VERSION DESC, VERSION_SP DESC, VERSION_PATCH DESC, TIME DESC`;

    const aResult = oConnection.executeQuery(sLastActionQuery); 
    var oResult;
    if (aResult.length) {
        oResult={name: aResult[0].NAME, step: aResult[0].STEP, state: aResult[0].STATE};
    } else{
        $.trace.info('Could not find any records in "sap.plc.db::basis.t_installation_log"');
    }
    return oResult
}



function setResponse(response, status, contentType, body) {
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
function execute(request, response, sMethod, bTrace, bRunInBackground, oConnection) {

    trace.setTransientMode('i');

    var register = obtainFinalSteps(request, oConnection);
    var task = createTask(register, 0, sMethod, oConnection);
    const oParam = processParameters(request);
    runBackgroundTask(response, register, task, sMethod, bTrace, oParam, bRunInBackground);
    setResponse(response, $.net.http.OK, 'text/plain', JSON.stringify({
         task_id: task.TASK_ID,
         status: task.TASK_ID ? 'SUCCESS' : 'FAILED',
         steps: register,
         task: task
     }));
    return task;
}

function wrap(request, response, sMethod, bRunInBackground, oConnection) {
    try {
        var result = execute(request, response, sMethod, true, bRunInBackground, oConnection);
        return result.TASK_ID;
    } catch(e) {
        $.trace.info(JSON.stringify(e));
        var errorMessage = 'There was an error during the installation. Please check the logs for more details. {' + e.message + '};{' + e.stack + '}';
        setResponse(response, $.net.http.INTERNAL_SERVER_ERROR, 'text/plain', errorMessage);
    }

}

function driver(request, response) {
    processRequest(request, response);
}

function run(request, response, bRunInBackground = false, oConnection) 
{
    return wrap(request, response, 'run', bRunInBackground, oConnection);
}

function check(request, response, bRunInBackground = false. oConnection) {
    return wrap(request, response, 'check', bRunInBackground);
}

function clean(request, response, bRunInBackground = false, oConnection) {
    return wrap(request, response, 'clean', bRunInBackground);
}
    
function createTask(register, currentStep, sMethod, oConnection) {
    var curTime = getCurrentTimestamp(oConnection);
    
    return new oTask.Task(oConnection).create({
        TASK_ID: null,
        SESSION_ID: createSessionID(oConnection),
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
    
function runBackgroundTask(response, register, oFollowUp, sMethod, bTrace, oParam, bRunInBackground) {
    const oParams = {
        followUp : oFollowUp,
        filterLibs : register,
        method: sMethod,
        traceFlag: bTrace,
        requestArg: oParam
    };
    if (bRunInBackground) {
        response.followUp({
            uri : "xs.postinstall.rest:backgroundTask.xsjs",
            functionName : "runBackgroundTask",
            parameter : oParams
        });
    } else {
        task.runBackgroundTask(oParams);
    }

}

function processParameters(request) {
    const params = request.parameters;
    const oParam = {};
    for (let i = 0; i < params.length; i++) {
        if (params[i].name === 'optional' || (params[i].name === 'file' && params[i].value !== "no data")) {
            oParam[params[i].name] = JSON.parse(params[i].value);
        } else {
            oParam[params[i].name] = params[i].value;
        }
    }
    return oParam;
}

function isFreshInstallation(request) {
    const oParam = processParameters(request);
    return oParam.mode === 'freshInstallation';
}

function getFreshInstallationRegister() {
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


function getCurrentStep(aRegister, oConnection) {
    const sErrorStepName = getLatestErrorStep(oConnection);
    return aRegister.map(oRigister => oRigister.library_full_name).indexOf(sErrorStepName) + 1;
}

function getLatestErrorStep(oConnection) {
    const oRes = oConnection.executeQuery(`
        select top 1 * 
            from "sap.plc.db::basis.t_installation_log"
            where step != 'clean' and state = 'error'
            order by version desc, version_sp desc, version_patch desc
        `
    )[0];
    return oRes && oRes.NAME;
}

function getUpgradeRegisters(oConnection, oBaseRelease = readBaseRelease(oConnection)) {
    const oUpgradeRegisters = [
        ...mapUpgradeRegister(aPreDatabaseSetUpUpgradeSteps),
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
        ...mapUpgradeRegister(aPostDatabaseSetupUpgradeSteps)
    ];
    return oUpgradeRegisters.filter(oRegisterEntry => {
        return oRegisterEntry.version > oBaseRelease.version ||
            oRegisterEntry.version >= oBaseRelease.version && (
            oRegisterEntry.version_sp > oBaseRelease.version_sp ||
            oRegisterEntry.version_sp >= oBaseRelease.version_sp &&
            oRegisterEntry.version_patch > oBaseRelease.version_patch)
    });
}
 

function getMappedRegister(bIsFreshInstallation, oConnection) {
    return bIsFreshInstallation
        ? getFreshInstallationRegister(oConnection)
        : getUpgradeRegisters(oConnection);
        }
             
function mapUpgradeRegister(steps) {
    if (steps.length === 0) {
        return steps;
    }
    return steps.reduce((prev, next) => {
        return [ ...prev, ...next.library.map(library_full_name => {
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
        })];
    }, []);
            }

function obtainFinalSteps(request, oConnection) {
    try {
        var strError = '';
        const oParam = processParameters(request);
        const bIsFreshInstallation = isFreshInstallation(request);
        const aMappedRegister = getMappedRegister(bIsFreshInstallation, oConnection);
        const aOptionalRegister = getOptionalRegister(oParam.optional, bIsFreshInstallation);
        const aMappedFreshInstallRegisters = [ ...aMappedRegister, ...aOptionalRegister ];
        const currentStep = getCurrentStep(aMappedFreshInstallRegisters, oConnection);

        if (currentStep === 0) {
            return aMappedFreshInstallRegisters;
        } else {
            strError += 'aMappedFreshInstallRegisters.slice started.';
            return aMappedFreshInstallRegisters.slice(currentStep - 1);
        }
    } catch (e) {
        $.trace.info(JSON.stringify(e));
        var strErrorOutput = '#' + e.message + '#' + e.stack + '#' + strError + '#';
        throw new Error(strErrorOutput);
    }
}

function getOptionalRegister(aOptionID, bIsFreshInstallation) {
    return getMappedOptionalRegister(
        bIsFreshInstallation ? aOptionalInstallSteps : aOptionalUpgradeSteps,
        aOptionID
    );
}


function getMappedOptionalRegister(steps, aOptionID) {
    if (aOptionID === undefined) {
        return steps
            .reduce((prev, next) => {
                return [ ...prev, ...next.library.map(library_full_name => {
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
                })];
            }, []);
    }
    return steps
        .filter(step => aOptionID.indexOf(step.id) !== -1)
        .reduce((prev, next) => {
            return [ ...prev, ...next.library.map(library_full_name => {
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
            })];
        }, []);
}
