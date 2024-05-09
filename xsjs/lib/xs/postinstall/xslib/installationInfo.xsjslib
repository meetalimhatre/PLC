const _ = $.require('lodash');
const [ target, version, version_sp, version_patch ] = MTA_METADATA.version.split('"');
const driver = $.import("xs.postinstall.xslib", "driver");
const helpers = $.require("../../util/helpers");

function postInstallationInfo(request, response, oConnection) {
    
    let info = driver.isFreshInstallation(request, oConnection)
        ? getFreshInstallationInfo(request, oConnection)
        : request.parameters.get("mode") === 'prepareForUpgrade' 
        ? getPrepareForUpgradeInfo(request, oConnection)
        : getUpgradeInfo(request, oConnection);

    
    if (info.status === "error") {
        $.trace.error(info.logs);
        response.status = $.net.http.INTERNAL_SERVER_ERROR;
    } else {
        response.status = $.net.http.OK;
    }   
    response.setBody(JSON.stringify(_.omit(info,"logs")));
}

function checkPreviousInstallationRun(response, oConnection) {

    let errOrFinishResult = oConnection.executeQuery(`
        SELECT 
            TOP 1 "VERSION",
            "VERSION_SP",
            "VERSION_PATCH",
            "NAME",
            "TIME",
            "EXECUTED_BY",
            "STEP",
            "STATE" 
        FROM 
            "sap.plc.db::basis.t_installation_log"
        ORDER BY 
            VERSION DESC, VERSION_SP DESC, VERSION_PATCH DESC, TIME DESC
    `);
    response.status = $.net.http.OK;
    
    if(!errOrFinishResult.length || errOrFinishResult[0].STATE == 'error' || errOrFinishResult[0].STEP == 'clean'){
        response.setBody(null);
    } else if(errOrFinishResult[0].STATE =='finished' && 
             (errOrFinishResult[0].NAME.includes('99_setup_completed') || errOrFinishResult[0].NAME.includes('PreUpgrade'))
            ){
        response.setBody(null);
    } else{
        response.setBody(JSON.stringify(errOrFinishResult[0]));
    }
}

function getFreshInstallationInfo(request, oConnection) {
    let oBaseRelease = driver.readBaseRelease(oConnection);
    // If fresh installtion has been finished and user choose fresh installation mode, it returns an error object
    if (oBaseRelease.version !== 0 || oBaseRelease.version_sp !== 0 || oBaseRelease.version_patch !== 0) {
        var sMessage = `Current version is ${oBaseRelease.version}.${oBaseRelease.version_sp}.${oBaseRelease.version_patch}. You don't need fresh installation.`;
        return {
            status: 'error',
            message: sMessage,
            logs: sMessage
        }
    }

    const aRegister = driver.getFreshInstallationRegister();
    const total = aRegister.length;
    const current = getCurrentStep(aRegister, oConnection);
    return {
        version: null,
        target,
        basic_steps: {
            total,
            current
        },
        required_steps: aRegister.slice(current === 0 ? 0 : current - 1),
        optional_steps: driver.aOptionalInstallSteps
    };
}

function getPrepareForUpgradeInfo(request, oConnection){
    let bLogEmpty = isLogEmpty(oConnection);
    if (bLogEmpty) {
        let oSecondaryConnection;
        try {
            oSecondaryConnection = $.hdb.getConnection({"sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC" : true});
            oSecondaryConnection.setAutoCommit(true);
            const iCopyResult = copyLog(oSecondaryConnection);
            // If SAP_PLC t_installation_log is empty, returns an error object
            if (iCopyResult === 0) {
                var sMessage =  'An error occurred when checking version information of previous PLC. Details: '
                + 'No entry found in ';
                return {
                    status: 'error',
                    message: sMessage + 'logs table. Check system logs for more details.',
                    logs: sMessage + '"SAP_PLC"."sap.plc.db::basis.t_log".'
                };
            } else {
                return getPrepareForUpgradeInfo(request, oConnection);
            }
        } catch (e) {
            var sMessage = 'An error occurred when checking version information of previous PLC. ';
            return {
                status: 'error',
                message: sMessage + 'Check system logs for more details.',
                logs: sMessage + 'Details: ' + e.message
            };
        } finally {
            if (oSecondaryConnection) {
                oSecondaryConnection.close();
            }
        }
    } else {
        let oBaseRelease = driver.readBaseRelease(oConnection);
        // t_installation_log is not empty, and fresh installation is not finished, could not run upgrade
        if (oBaseRelease.version === 0 && oBaseRelease.version_sp === 0 && oBaseRelease.version_patch === 0) {
            var sMessage = 'Fresh installation is not finished yet, please run fresh installation first!';
            return {
                status: 'error',
                message: sMessage,
                logs: sMessage
            };
        } else {
            let oLastAction = driver.readLastAction(oConnection);
            if(helpers.isNullOrUndefined(oLastAction)){
                var sMessage = 'Could not found any records in installation logs';
                return {
                    status: 'error',
                    message: sMessage,
                    logs: sMessage
                };
            }
            var sMessage = 'The previous installation has not run succesfully. Please redo it before you run prepare for upgrade again.'
            if (oLastAction.name != "PreUpgrade" && !oLastAction.name.includes('99_setup_completed')){
                return{
                    status: 'error',
                    message: sMessage,
                    logs: sMessage
                }
            } else if(oLastAction.name.includes('99_setup_completed') && oLastAction.state != 'finished'){
                return{
                    status: 'error',
                    message: sMessage,
                    logs: sMessage
                }
            } else{
                return {
                    version: `${oBaseRelease.version}.${oBaseRelease.version_sp}.${oBaseRelease.version_patch}`,
                };     
            }       
        }
    }
}

function getUpgradeInfo(request, oConnection) {
    let bLogEmpty = isLogEmpty(oConnection);
    if (bLogEmpty) {
        let oSecondaryConnection;
        try {
            oSecondaryConnection = $.hdb.getConnection({"sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC" : true});
            oSecondaryConnection.setAutoCommit(true);
            const iCopyResult = copyLog(oSecondaryConnection);
            // If SAP_PLC t_installation_log is empty, returns an error object
            if (iCopyResult === 0) {
                var sMessage =  'An error occurred when checking version information of previous PLC. Details: '
                    + 'No entry found in ';
                return {
                    status: 'error',
                    message: sMessage + 'logs table. Check system logs for more details.',
                    logs: sMessage + '"SAP_PLC"."sap.plc.db::basis.t_log".'
                };
            } else {
                return getUpgradeInfo(request, oConnection);
            }
        } catch (e) {
            var sMessage = 'An error occurred when checking version information of previous PLC. ';
            return {
                status: 'error',
                message: sMessage + 'Check system logs for more details.',
                logs: sMessage + 'Details: ' + e.message
            };
        } finally {
            if (oSecondaryConnection) {
                oSecondaryConnection.close();
            }
        }
    } else {
        let oBaseRelease = driver.readBaseRelease(oConnection);
        // t_installation_log is not empty, and fresh installation is not finished, could not run upgrade
        if (oBaseRelease.version === 0 && oBaseRelease.version_sp === 0 && oBaseRelease.version_patch === 0) {
            var sMessage = 'Fresh installation is not finished yet, please run fresh installation first!';
            return {
                status: 'error',
                message: sMessage,
                logs: sMessage
            };
        } else {
            let oLastAction = driver.readLastAction(oConnection);
            if(helpers.isNullOrUndefined(oLastAction)){
                var sMessage = 'Could not found any records in installation logs';
                return {
                    status: 'error',
                    message: sMessage,
                    logs: sMessage
                };
            }
            if (oLastAction.name == "PreUpgrade" && oLastAction.state == "error"){
                var sMessage = 'Prepare for Upgrade was not run successfully. Please redo it before you run upgrade again.'
                return{
                    status: 'error',
                    message: sMessage,
                    logs: sMessage
                }
            }
            const aRegister = driver.getUpgradeRegisters(oConnection, oBaseRelease);
            const current = getCurrentStep(aRegister, oConnection);
            return {
                version: `${oBaseRelease.version}.${oBaseRelease.version_sp}.${oBaseRelease.version_patch}`,
                target,
                basic_steps: {
                    total: aRegister.length,
                    current
                },
                required_steps: aRegister.slice(current === 0 ? 0 : current - 1),
                optional_steps: driver.aOptionalUpgradeSteps
            };            
        }
    }
}

function getCurrentStep(aRegister, oConnection) {
    const sErrorStepName = getLatestErrorStep(oConnection);
    return aRegister.map(oRigister => oRigister.library_full_name).indexOf(sErrorStepName) + 1;
}

function getLatestErrorStep(oConnection) {
    const aResult = oConnection.executeQuery(`
        select top 1 * 
            from "sap.plc.db::basis.t_installation_log"
            where step != 'clean' and state = 'error'
            order by version desc, version_sp desc, version_patch desc
        `
    );
    const iterator = aResult.getIterator(); 
    if (iterator.next()) {
        return aResult[0].NAME;
    } else {
        return null;   
    }
}

// If t_installation_log is empty, return true
function isLogEmpty(oConnection) {
    const aResult = oConnection.executeQuery(`
            select * from "sap.plc.db::basis.t_installation_log"
        `
    );
    return aResult.length === 0;
}

function copyLog(oConnection) {
    return oConnection.executeUpdate(`
        insert into "sap.plc.db::basis.t_installation_log"
        select * from "SAP_PLC"."sap.plc.db::basis.t_log"
    `);
}
