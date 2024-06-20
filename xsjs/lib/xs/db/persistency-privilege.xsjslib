const _ = $.require('lodash');
const helpers = $.require('../util/helpers');
const InstancePrivileges = $.require('../authorization/authorization-manager').Privileges;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

const authorizationUnroller = $.require('../authorization/authorization-unroller');

var Tables = Object.freeze({
    authorization: 'sap.plc.db::auth.t_auth_project',
    user_privileges: 'sap.plc.db::auth.t_auth_user',
    group_privileges: 'sap.plc.db::auth.t_auth_usergroup',
    usergroup: 'sap.plc.db::auth.t_usergroup'
});

/**
 * Provides persistency operations for privileges.
 */

function Privilege(dbConnection) {

    /**
	 * Gets user privileges for a project
	 * For the current user take the privilege from the rollup table.
	 *
	 * @param {string} 
	 *            sEntityType - entity type (ex. project)
	 * @param {string} 
	 *            sEntityId - entity id
	 ** @param {string} 
	 *            sUserId - (current) user id
	 *            
	 * @returns {oReturnObject} -  contains the user privileges
	 *
	 */
    this.getUserPrivileges = async function (sEntityType, sEntityId, sUserId) {

        var aPrivileges = await dbConnection.executeQuery(`select USER_ID, PRIVILEGE from "${ Tables.authorization }" 
				 									 where UPPER(PROJECT_ID) = ? and USER_ID = ?
				 									 UNION
													 select USER_ID, PRIVILEGE from "${ Tables.user_privileges }" 
													 where UPPER(OBJECT_TYPE) = ? and UPPER(OBJECT_ID) = ? and USER_ID <> ?`, sEntityId.toUpperCase(), sUserId, sEntityType.toUpperCase(), sEntityId.toUpperCase(), sUserId);

        return aPrivileges;
    };

    /**
	 * Creates new user privileges
	 * @param {array}
	 *            aPrivileges - the array of privileges that will be created
	 *            			- the array contains privilege objects that have USER_ID and PRIVILEGE as properties
	 * @param {string} 
	 *            sEntityType - entity type (ex. project)
	 * @param {string} 
	 *            sEntityId - entity id
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {array} - an array of objects that could not be inserted into the table
	 */
    this.insertUserPrivileges = async function (aPrivileges, sEntityType, sEntityId) {
        var aPrivilegesColumn = [];
        _.each(aPrivileges, function (oPrivilege) {
            var oPrivilegeColumn = [
                sEntityType.toUpperCase(),
                sEntityId.toUpperCase(),
                oPrivilege.USER_ID.toUpperCase(),
                oPrivilege.PRIVILEGE.toUpperCase()
            ];
            aPrivilegesColumn.push(oPrivilegeColumn);
        });

        try {
            var aInsertResult = await dbConnection.executeUpdate(`INSERT INTO "${ Tables.user_privileges }" 
										(OBJECT_TYPE, OBJECT_ID, USER_ID, PRIVILEGE) VALUES (?,?,?,?)`, aPrivilegesColumn);

            authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);

        } catch (e) {
            const sClientMsg = 'Error during inserting of user privileges into table.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        //return an array of object that could not be inserted -> 1 means successful operation
        return helpers.unsuccessfulItemsDbOperation(aPrivileges, aInsertResult);
    };

    /**
	 * Deletes user privileges from the input array
	 * @param {array}
	 *            aPrivileges - the array of privileges
	 * @param {string} 
	 *            sEntityType - entity type (ex. project)
	 * @param {string} 
	 *            sEntityId - entity id
	 *          
	 * @returns {array} - an array of objects that could not be deleted from the table
	 */
    this.deleteUserPrivileges = async function (aPrivileges, sEntityType, sEntityId) {
        var aPrivilegesColumn = [];
        _.each(aPrivileges, function (oPrivilege) {
            var oPrivilegeColumn = [
                sEntityType.toUpperCase(),
                sEntityId.toUpperCase(),
                oPrivilege.USER_ID.toUpperCase()
            ];
            aPrivilegesColumn.push(oPrivilegeColumn);
        });

        var aDeleteResult = await dbConnection.executeUpdate(`delete from "${ Tables.user_privileges }" 
													where (OBJECT_TYPE, OBJECT_ID, USER_ID) = (?,?,?)`, aPrivilegesColumn);
        authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);


        return helpers.unsuccessfulItemsDbOperation(aPrivileges, aDeleteResult);
    };












    this.updateUserPrivileges = async function (aPrivileges, sEntityType, sEntityId) {
        var aPrivilegesColumn = [];
        _.each(aPrivileges, function (oPrivilege) {
            var oPrivilegeColumn = [
                oPrivilege.PRIVILEGE.toUpperCase(),
                sEntityType.toUpperCase(),
                sEntityId.toUpperCase(),
                oPrivilege.USER_ID.toUpperCase()
            ];
            aPrivilegesColumn.push(oPrivilegeColumn);
        });

        var aUpdateResult = await dbConnection.executeUpdate(`UPDATE "${ Tables.user_privileges }" SET PRIVILEGE = ? 
				where (OBJECT_TYPE, OBJECT_ID, USER_ID) = (?,?,?)`, aPrivilegesColumn);

        authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);


        return helpers.unsuccessfulItemsDbOperation(aPrivileges, aUpdateResult);
    };












    this.getGroupPrivileges = async function (sEntityType, sEntityId) {

        var aPrivileges = await dbConnection.executeQuery(`select USERGROUP_ID as GROUP_ID, PRIVILEGE from "${ Tables.group_privileges }" 
										where UPPER(OBJECT_TYPE) = ? and UPPER(OBJECT_ID) = ?`, sEntityType.toUpperCase(), sEntityId.toUpperCase());

        return aPrivileges;

    };














    this.insertGroupPrivileges = async function (aPrivileges, sEntityType, sEntityId) {
        var aPrivilegesColumn = [];
        _.each(aPrivileges, function (oPrivilege) {
            var oPrivilegeColumn = [
                sEntityType.toUpperCase(),
                sEntityId.toUpperCase(),
                oPrivilege.PRIVILEGE.toUpperCase(),
                oPrivilege.GROUP_ID.toUpperCase()
            ];
            aPrivilegesColumn.push(oPrivilegeColumn);
        });

        try {
            var aInsertResult = await dbConnection.executeUpdate(`INSERT INTO "${ Tables.group_privileges }"  
					 	select ? as "OBJECT_TYPE", ? as "OBJECT_ID", USERGROUP_ID as USERGROUP_ID, ? as PRIVILEGE
					 	from "${ Tables.usergroup }" where USERGROUP_ID = ?`, aPrivilegesColumn);

            authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);
        } catch (e) {
            const sClientMsg = 'Error during inserting group privileges into table';
            const sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }





        var aErrorItems = [];
        _.each(aInsertResult, function (oResultItem, key) {
            if (oResultItem === -301) {
                let oItemError = aPrivileges[key];
                oItemError.ERROR = 'notUnique';
                aErrorItems.push(oItemError);
            } else if (oResultItem === 0) {
                let oItemError = aPrivileges[key];
                oItemError.ERROR = 'groupNotExist';
                aErrorItems.push(oItemError);
            }
        });

        return aErrorItems;
    };












    this.deleteGroupPrivileges = async function (aPrivileges, sEntityType, sEntityId) {
        var aPrivilegesColumn = [];
        _.each(aPrivileges, function (oPrivilege) {
            var oPrivilegeColumn = [
                sEntityType.toUpperCase(),
                sEntityId.toUpperCase(),
                oPrivilege.GROUP_ID.toUpperCase()
            ];
            aPrivilegesColumn.push(oPrivilegeColumn);
        });

        var aDeleteResult = await dbConnection.executeUpdate(`delete from "${ Tables.group_privileges }" 
				where (OBJECT_TYPE, OBJECT_ID, USERGROUP_ID) = (?,?,?)`, aPrivilegesColumn);

        authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);


        return helpers.unsuccessfulItemsDbOperation(aPrivileges, aDeleteResult);
    };












    this.updateGroupPrivileges = async function (aPrivileges, sEntityType, sEntityId) {
        var aPrivilegesColumn = [];
        _.each(aPrivileges, function (oPrivilege) {
            var oPrivilegeColumn = [
                oPrivilege.PRIVILEGE.toUpperCase(),
                sEntityType.toUpperCase(),
                sEntityId.toUpperCase(),
                oPrivilege.GROUP_ID.toUpperCase()
            ];
            aPrivilegesColumn.push(oPrivilegeColumn);
        });

        var aUpdateResult = await dbConnection.executeUpdate(`UPDATE "${ Tables.group_privileges }" 
					SET PRIVILEGE = ? where (OBJECT_TYPE, OBJECT_ID, USERGROUP_ID) = (?,?,?)`, aPrivilegesColumn);

        authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);


        return helpers.unsuccessfulItemsDbOperation(aPrivileges, aUpdateResult);
    };












    this.adminstratorExists = async function (sEntityType, sEntityId) {

        var aPrivileges = await dbConnection.executeQuery(`select USER_ID from "${ Tables.user_privileges }" 
													 where OBJECT_TYPE = ? and OBJECT_ID = ? and PRIVILEGE = ?`, sEntityType.toUpperCase(), sEntityId.toUpperCase(), InstancePrivileges.ADMINISTRATE);

        if (aPrivileges.length > 0) {
            return true;
        } else {
            return false;
        }

    };
}

Privilege.prototype = Object.create(Privilege.prototype);
Privilege.prototype.constructor = Privilege;
export default {_,helpers,InstancePrivileges,MessageLibrary,PlcException,Code,authorizationUnroller,Tables,Privilege};
