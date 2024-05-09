const authorizationManager = require('./authorization-manager');
const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const Code = MessageLibrary.Code;
const PlcException = MessageLibrary.PlcException;
const MessageDetails = MessageLibrary.Details;

module.exports = {
    unrollPrivilegesOnObjectUpdate,
    unrollPrivilegesOnGroupUpdate,
    unrollPrivileges,
    getObjectsFromGroupPrivileges,
    containsCycle
};

async function logError(msg) {
    await helpers.logError(msg);
}

var Views = Object.freeze({ V_GROUP_HIERARCHY: 'sap.plc.db.authorization.views::auth.V_GROUP_HIERARCHY' });

var Procedures = Object.freeze({
    p_unroll_privileges_on_object_update: 'sap.plc.db.authorization.procedures::p_unroll_privileges_on_object_update',
    p_unroll_privileges_on_group_update: 'sap.plc.db.authorization.procedures::p_unroll_privileges_on_group_update',
    p_unroll_privileges: 'sap.plc.db.authorization.procedures::p_unroll_privileges'
});

/**
 * Unrolls privileges for a business object
 * @param {object}
 * 	sObjectType	-	the type of the business object (e.g., 'Project')
 * 	sObjectId	-	the id of the business object (e.g., 'P1')
 * @throws {PlcException}
 * 	if the requested type is unknown
 * @returns {boolean} - true if call to the actual SQL procedure was successfully, otherwise false
 */
async function unrollPrivilegesOnObjectUpdate(oConnection, sObjectType, sObjectId) {
    if (sObjectType.toUpperCase() !== authorizationManager.BusinessObjectTypes.Project.toUpperCase()) {
        const oMessageDetails = new MessageDetails();
        const sLogMessage = `Object type ${ sObjectId } for privileges not supported.`;
        await logError(sLogMessage);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }

    var p_unroll_privileges_on_object_update = await oConnection.loadProcedure(Procedures.p_unroll_privileges_on_object_update);
    var withError;

    try {
        p_unroll_privileges_on_object_update(sObjectType, sObjectId);
        withError = false;
    } catch (e) {
        const sLogMessage = `Error occured on unrolling privileges for type ${ sObjectType } and id ${ sObjectId } (cf. SQL log).`;
        await logError(sLogMessage);
        withError = true;
    }

    return withError;
}

/**
 * Unrolles privileges for a group (related business objects are derived from group id)
 * @param {object}
 * 	sUsergroupId	-	the id of a certain group (e.g., 'CONTROLLERS')
 * @returns {boolean} - true if call to the actual SQL procedure was successfully, otherwise false
 */
async function unrollPrivilegesOnGroupUpdate(oConnection, sUsergroupId) {
    var p_unroll_privileges_on_group_update = await oConnection.loadProcedure(Procedures.p_unroll_privileges_on_group_update);
    var withError;

    try {
        p_unroll_privileges_on_group_update(sUsergroupId);
        withError = false;
    } catch (e) {
        const sLogMessage = `Error occured on unrolling privileges for group ${ sUsergroupId } (cf. SQL log).`;
        await logError(sLogMessage);
        withError = true;
    }

    return withError;
}

/**
 * Unrolles privileges for a set of business object
 * @param {array}
 * 	aObjects	-	array of objects carrying the type (attribute OBJECT_TYPE) of the business object (e.g., 'Project') and the id (attribute OBJECT_ID) of the business object (e.g., 'P1')
 * @returns {boolean} - true if call to the actual SQL procedure was successfully, otherwise false
 */
async function unrollPrivileges(oConnection, aObjects) {
    var p_unroll_privileges = await oConnection.loadProcedure(Procedures.p_unroll_privileges);
    var withError;

    try {
        p_unroll_privileges(aObjects);
        withError = false;
    } catch (e) {
        const sLogMessage = `Error occured on unrolling privileges for objects ${ aObjects } (cf. SQL log).`;
        await logError(sLogMessage);
        withError = true;
    }

    return withError;
}

/**
 * Returns related objects for a group
 * @param {object}
 * 	sUsergroupId		-	the id of a certain group (e.g., 'CONTROLLERS')
 * @returns {object} 	-	attribute withError is true if call to the actual SQL procedure was successfully, otherwise false
 * 						-	attribute {aObjects} is an array of objects with attributes OBJECT_TYPE and OBJECT_ID carrying the related business objects with type and id
 */
async function getObjectsFromGroupPrivileges(oConnection, sUsergroupId) {
    var stmt = `
	SELECT 
		auth_g.OBJECT_TYPE,
		auth_g.OBJECT_ID
	FROM 
		"${ Views.V_GROUP_HIERARCHY }" ( expression => 'ascendantsOrSelf("${ sUsergroupId }")') AS hier
	LEFT OUTER JOIN 
		"sap.plc.db::auth.t_auth_usergroup" AS auth_g
	ON 
		hier.RESULT_NODE = auth_g.USERGROUP_ID
	WHERE 
		OBJECT_ID IS NOT NULL 
		AND 
		OBJECT_TYPE IS NOT NULL
	GROUP BY 
		auth_g.OBJECT_TYPE, 
		auth_g.OBJECT_ID
	`;

    var oRet = { aObjects: [] };

    try {
        var oReturn = await oConnection.executeQuery(stmt);

        for (let i = 0; i < oReturn.length; i++) {
            oRet.aObjects.push({
                OBJECT_TYPE: oReturn[i].OBJECT_TYPE,
                OBJECT_ID: oReturn[i].OBJECT_ID
            });
        }

        oRet['withError'] = false;
    } catch (e) {
        const sLogMessage = `Error occured on reading objects for usergroup ${ sUsergroupId } (cf. SQL log).`;
        await logError(sLogMessage);
        oRet['withError'] = true;
    }

    return oRet;
}

/**
 * Returns whether group cycle does exist
 * @param {object}
 * @returns {boolean} 	-	true if cycle exists, otherwise false
 */
async function containsCycle(oConnection) {
    var stmt = `
	SELECT 
		auth_g.OBJECT_TYPE,
		auth_g.OBJECT_ID
	FROM 
		"${ Views.V_GROUP_HIERARCHY }" ( expression => 'ascendantsOrSelf(*)') AS hier
	LEFT OUTER JOIN 
		"sap.plc.db::auth.t_auth_usergroup" AS auth_g
	ON 
		hier.RESULT_NODE = auth_g.USERGROUP_ID
	WHERE 
		OBJECT_ID IS NOT NULL 
		AND 
		OBJECT_TYPE IS NOT NULL
	GROUP BY 
		auth_g.OBJECT_TYPE, 
		auth_g.OBJECT_ID
	`;

    try {
        await oConnection.executeQuery(stmt);
    } catch (e) {
        const sLogMessage = `Error occured reading group relations (e.g., cycle detected) (cf. SQL log).`;
        await logError(sLogMessage);
        return true;
    }
    return false;
}
export default {authorizationManager,helpers,MessageLibrary,Code,PlcException,MessageDetails,logError,Views,Procedures,unrollPrivilegesOnObjectUpdate,unrollPrivilegesOnGroupUpdate,unrollPrivileges,getObjectsFromGroupPrivileges,containsCycle};
