const _ = require('lodash');
const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const Code = MessageLibrary.Code;
const PlcException = MessageLibrary.PlcException;
const MessageDetails = MessageLibrary.Details;


/**
 * Privileges that can be set for instance-based access.
 */
var Privileges = Object.freeze({
    READ: 'READ',
    CREATE_EDIT: 'CREATE_EDIT',
    FULL_EDIT: 'FULL_EDIT',
    ADMINISTRATE: 'ADMINISTRATE'
});

var PrivilegeOrder = Object.freeze([
    Privileges.READ,
    Privileges.CREATE_EDIT,
    Privileges.FULL_EDIT,
    Privileges.ADMINISTRATE
]);

/**
 * Tables used to determine privileges. For projects, it is directly in the t_auth_project, for other objects they 
 * need to be joined with the business object tables.
 */
var Tables = Object.freeze({
    Project_Auth: '"sap.plc.db::auth.t_auth_project"',
    Project: '"sap.plc.db::basis.t_project"',
    Calculation: '"sap.plc.db::basis.t_calculation"',
    Calculation_Version: '"sap.plc.db::basis.t_calculation_version"',
    Version_Temporary: '"sap.plc.db::basis.t_calculation_version_temporary"'
});

/**
 * Supported business objects for instance-based privileges. Needed to determine the casdasdorrect prepared statement.
 */
var BusinessObjectTypes = Object.freeze({
    Project: 'Project',
    Calculation: 'Calculation',
    CalculationVersion: 'Calculation_Version',
    Privilege: 'Privilege'
});

/**
 * Prepared statements to be used by the getUserPrivilege function dependent on the BusinessObjectType passed.
 */
var PreparedStatements = Object.freeze({
    Project: 'select privilege from ' + Tables.Project_Auth + ' where user_id = ? and project_id= ?',
    Calculation: 'select privilege from ( ' + Tables.Project_Auth + '  as auth ' + 'inner join ' + Tables.Calculation + ' as calculation ' + 'on auth.project_id = calculation.project_id' + ') where auth.user_id = ? and calculation.calculation_id = ? ',
    Calculation_Version: 'select privilege from ( ' + Tables.Project_Auth + ' as auth ' + 'inner join ' + '(' + 'select calculation.project_id, version.calculation_version_id from ' + Tables.Calculation + ' as calculation ' + 'inner join ' + '(' + 'select calculation_version_id, calculation_id from ' + Tables.Calculation_Version + ' union ' + 'select calculation_version_id, calculation_id from ' + Tables.Version_Temporary + ' where session_id = ? ' + ') as version ' + 'on calculation.calculation_id = version.calculation_id ' + ') calculation_join ' + 'on auth.project_id = calculation_join.project_id ' + ') ' + 'where auth.user_id = ? and calculation_join.calculation_version_id = ?'
});

/**
 * Determines and returns the instance-based privilege a user has for a given instance of a given business object
 * type. 
 * @param {string} 
 * 		sBusinessObjectType : A business object type defined in the BusinessObjectTypes object.
 * @param {string}
 * 		sBusinessObjectId : The ID of the business object for which the privileges of the user shall be returned.
 * @param {dbConnection} 
 * 		oConnection : A DB-connection used to read privilege information.
 * @param {sUsername} 
 * 		sUsername : The user name in session.
 * @throws {PlcException}
 * 		If the user has no instance based privilege for the business object instance.
 * @throws {PlcException}
 * 		If the business object id does not exists in corresponding table.
 * @returns {string}
 * 		The privilege the user has for the business object instance. (on of the privileges defined in the Privileges object)
 */
async function getUserPrivilege(sBusinessObjectType, sBusinessObjectId, oConnection, sUsername, bThrowException = true) {

    if (!_.includes(BusinessObjectTypes, sBusinessObjectType)) {
        let oMessageDetails = new MessageDetails();
        const sLogMessage = `Invalid BusinessObjectType passed: (${ sBusinessObjectType }).`;
        await logError(sLogMessage);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }

    var stmt = PreparedStatements[sBusinessObjectType];
    var result;
    if (sBusinessObjectType === BusinessObjectTypes.CalculationVersion) {
        result = await oConnection.executeQuery(stmt, sUsername, sUsername, sBusinessObjectId);
    } else {
        result = await oConnection.executeQuery(stmt, sUsername, sBusinessObjectId);
    }

    if (result.length === 0 && bThrowException) {
        var sStmt, aCount, sClientMsg, sServerMsg;
        var oMessageDetails = new MessageDetails();
        // check if business object id exists
        switch (sBusinessObjectType) {
        case BusinessObjectTypes.Project:
            sStmt = 'select count(*) as rowcount from ' + Tables.Project + ' where PROJECT_ID = ? ';
            aCount = await oConnection.executeQuery(sStmt, sBusinessObjectId);
            oMessageDetails.addProjectObjs({ id: sBusinessObjectId });
            sClientMsg = `Project not found.`;
            sServerMsg = `${ sClientMsg } Project id: ${ sBusinessObjectId }.`;
            break;
        case BusinessObjectTypes.Calculation:
            sStmt = 'select count(*) as rowcount from ' + Tables.Calculation + ' where CALCULATION_ID = ? ';
            aCount = await oConnection.executeQuery(sStmt, sBusinessObjectId);
            oMessageDetails.addCalculationObjs({ id: sBusinessObjectId });
            sClientMsg = `Calculation not found.`;
            sServerMsg = `${ sClientMsg } Calculation id: ${ sBusinessObjectId }.`;
            break;
        case BusinessObjectTypes.CalculationVersion:
            sStmt = 'select count(*) as rowcount from ( ' + ' select calculation_version_id from ' + Tables.Calculation_Version + ' where CALCULATION_VERSION_ID = ? ' + ' union ' + ' select calculation_version_id from ' + Tables.Version_Temporary + ' where CALCULATION_VERSION_ID = ? and SESSION_ID = ? )';
            aCount = await oConnection.executeQuery(sStmt, sBusinessObjectId, sBusinessObjectId, sUsername);
            oMessageDetails.addCalculationVersionObjs({ id: sBusinessObjectId });
            sClientMsg = `Calculation version not found.`;
            sServerMsg = `${ sClientMsg } Calculation version id: ${ sBusinessObjectId }.`;
            break;
        }

        if (parseInt(aCount[0].ROWCOUNT) === 0) {
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        } else {
            let oMessageDetails = new MessageDetails();
            const sClientMsg = `User does not have any privilege for the requested object of type ${ sBusinessObjectType }.`;
            const sServerMsg = `${ sClientMsg } Object id: ${ sBusinessObjectId }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_ACCESS_DENIED, sClientMsg, oMessageDetails);
        }

    }
    return result.length === 0 ? '' : result[0].PRIVILEGE;

}

/**
 * Checks if a user has the requested instance-based privilege for a given instance of a given business object
 * type. 
 * 
 * @param {string} 
 * 		sBusinessObjectType : A business object type defined in the BusinessObjectTypes object.
 * @param {string}
 * 		sBusinessObjectId : The ID of the business object for which the privileges of the user shall be returned.
 * @param {string}
 * 		sPrivilege : The privilege to be checked if the user has it for the given business object instance.
 * @param {dbConnection} 
 * 		oConnection : A DB-connection used to read privilege information.
 * @param {sUsername} 
 * 		sUsername : The user name in session.
 * @throws {PlcException}
 * 		If the user does not have the instance based privilege for the business object instance.
 */
async function checkPrivilege(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection, sUsername) {

    if (!_.has(Privileges, sPrivilege)) {
        let oMessageDetails = new MessageDetails();
        const sClientMsg = `Invalid Privilege passed: (${ sPrivilege }).`;
        await logError(sClientMsg);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
    }

    var result = getUserPrivilege(sBusinessObjectType, sBusinessObjectId, oConnection, sUsername);

    if (PrivilegeOrder.indexOf(result) < PrivilegeOrder.indexOf(sPrivilege)) {
        let oMessageDetails = new MessageDetails();

        const sClientMsg = `User does not have the required privilege (${ sPrivilege }) for the requested object of type ${ sBusinessObjectType }.`;
        const sServerMsg = `${ sClientMsg } Id: ${ sBusinessObjectId }.`;
        await logError(sServerMsg);
        throw new PlcException(Code.GENERAL_ACCESS_DENIED, sClientMsg, oMessageDetails);
    }

}

async function logError(msg) {
    helpers.logError(msg);
}

module.exports.BusinessObjectTypes = BusinessObjectTypes;
module.exports.Privileges = Privileges;
module.exports.getUserPrivilege = getUserPrivilege;
module.exports.checkPrivilege = checkPrivilege;
export default {_,helpers,MessageLibrary,Code,PlcException,MessageDetails,Privileges,PrivilegeOrder,Tables,BusinessObjectTypes,PreparedStatements,getUserPrivilege,checkPrivilege,logError};
