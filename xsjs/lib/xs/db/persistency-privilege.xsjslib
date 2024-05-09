const _ = $.require("lodash");
const helpers = $.require("../util/helpers");
const InstancePrivileges = $.require("../authorization/authorization-manager").Privileges;

const MessageLibrary = $.require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

const authorizationUnroller = $.require("../authorization/authorization-unroller");

var Tables = Object.freeze({
	authorization: "sap.plc.db::auth.t_auth_project",
	user_privileges: "sap.plc.db::auth.t_auth_user",
	group_privileges: "sap.plc.db::auth.t_auth_usergroup",
	usergroup: "sap.plc.db::auth.t_usergroup"
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
	this.getUserPrivileges = function(sEntityType, sEntityId, sUserId) {

		var aPrivileges = dbConnection.executeQuery(`select USER_ID, PRIVILEGE from "${Tables.authorization}" 
				 									 where UPPER(PROJECT_ID) = ? and USER_ID = ?
				 									 UNION
													 select USER_ID, PRIVILEGE from "${Tables.user_privileges}" 
													 where UPPER(OBJECT_TYPE) = ? and UPPER(OBJECT_ID) = ? and USER_ID <> ?`, sEntityId.toUpperCase(), sUserId, sEntityType.toUpperCase(),sEntityId.toUpperCase(), sUserId);
		
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
	this.insertUserPrivileges = function(aPrivileges, sEntityType, sEntityId) {		
		var aPrivilegesColumn = [];
		_.each(aPrivileges, function (oPrivilege) {		
			var oPrivilegeColumn = [sEntityType.toUpperCase(), sEntityId.toUpperCase(), oPrivilege.USER_ID.toUpperCase(), oPrivilege.PRIVILEGE.toUpperCase()];
			aPrivilegesColumn.push(oPrivilegeColumn);
		});

		try {
			var aInsertResult = dbConnection.executeUpdate(`INSERT INTO "${Tables.user_privileges}" 
										(OBJECT_TYPE, OBJECT_ID, USER_ID, PRIVILEGE) VALUES (?,?,?,?)`, aPrivilegesColumn);
			
			authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);
			
		} catch(e) {
			const sClientMsg = "Error during inserting of user privileges into table.";
			const sServerMsg = `${sClientMsg} Error: ${e.message || e.msg}`;
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
	this.deleteUserPrivileges = function(aPrivileges, sEntityType, sEntityId) {	
		var aPrivilegesColumn = [];
		_.each(aPrivileges, function (oPrivilege) {		
			var oPrivilegeColumn = [sEntityType.toUpperCase(), sEntityId.toUpperCase(), oPrivilege.USER_ID.toUpperCase()];
			aPrivilegesColumn.push(oPrivilegeColumn);
		});
		
		var aDeleteResult = dbConnection.executeUpdate(`delete from "${Tables.user_privileges}" 
													where (OBJECT_TYPE, OBJECT_ID, USER_ID) = (?,?,?)`, aPrivilegesColumn);
		authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);
		
		//returns an array with the objects that could not be deleted, 1 means deletion was successful and 0 not successful
		return helpers.unsuccessfulItemsDbOperation(aPrivileges, aDeleteResult);
	};

	/**
	 * Updates existing user privileges
	 * @param {array}
	 *            aPrivileges - the array of privileges that will be updated
	 * @param {string} 
	 *            sEntityType - entity type (ex. project)
	 * @param {string} 
	 *            sEntityId - entity id
	 * 
	 * @returns {array} - an array of objects that could not be updated
	 */
	this.updateUserPrivileges = function(aPrivileges, sEntityType, sEntityId) {		
		var aPrivilegesColumn = [];
		_.each(aPrivileges, function (oPrivilege) {		
			var oPrivilegeColumn = [oPrivilege.PRIVILEGE.toUpperCase(), sEntityType.toUpperCase(), sEntityId.toUpperCase(), oPrivilege.USER_ID.toUpperCase()];
			aPrivilegesColumn.push(oPrivilegeColumn);
		});

		var aUpdateResult = dbConnection.executeUpdate(`UPDATE "${Tables.user_privileges}" SET PRIVILEGE = ? 
				where (OBJECT_TYPE, OBJECT_ID, USER_ID) = (?,?,?)`, aPrivilegesColumn);	
		
		authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);
		
		//returns an array with the objects that could not be updated, 1 means update was successful and 0 not successful
		return helpers.unsuccessfulItemsDbOperation(aPrivileges, aUpdateResult);
	};
	
	/**
	 * Gets group privileges for a project
	 *
	 * @param {sEntityType}
	 *            sEntityType - the entity type (ex. project)
	 * @param {sEntityId}
	 *            sEntityId - the entity id
	 *
	 * @returns {oReturnObject} -  contains the user privileges
	 *
	 */
	this.getGroupPrivileges = function(sEntityType, sEntityId) {

		var aPrivileges = dbConnection.executeQuery(`select USERGROUP_ID as GROUP_ID, PRIVILEGE from "${Tables.group_privileges}" 
										where UPPER(OBJECT_TYPE) = ? and UPPER(OBJECT_ID) = ?`, sEntityType.toUpperCase(), sEntityId.toUpperCase());

		return aPrivileges;

	};
	
	/**
	 * Creates new group privileges
	 * @param {array}
	 *            aPrivileges - the array of privileges that will be created
	 *            			- the array contains privilege objects that have GROUP_ID and PRIVILEGE as properties
	 * @param {string} 
	 *            sEntityType - entity type (ex. project)
	 * @param {string} 
	 *            sEntityId - entity id
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {array} - an array of objects that could not be inserted into the table
	 */
	this.insertGroupPrivileges = function(aPrivileges, sEntityType, sEntityId) {		
		var aPrivilegesColumn = [];
		_.each(aPrivileges, function (oPrivilege) {		
			var oPrivilegeColumn = [sEntityType.toUpperCase(), sEntityId.toUpperCase(), oPrivilege.PRIVILEGE.toUpperCase(), oPrivilege.GROUP_ID.toUpperCase()];
			aPrivilegesColumn.push(oPrivilegeColumn);
		});

		try {
			var aInsertResult = dbConnection.executeUpdate(`INSERT INTO "${Tables.group_privileges}"  
					 	select ? as "OBJECT_TYPE", ? as "OBJECT_ID", USERGROUP_ID as USERGROUP_ID, ? as PRIVILEGE
					 	from "${Tables.usergroup}" where USERGROUP_ID = ?`, aPrivilegesColumn);
			
			authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);
		} catch(e) {
			const sClientMsg = "Error during inserting group privileges into table";
			const sServerMsg = `${sClientMsg} Error: ${e.msg || e.message}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
		}	
		
		//return an array of object that could not be inserted
		//   0 - could not insert (in our case because group does not exist)
		//	 1 - successful operation
		//-301 - unique constraint violation				
		var aErrorItems = [];
		_.each(aInsertResult, function(oResultItem, key) {
			if(oResultItem  === -301) {
				let oItemError = aPrivileges[key];
				oItemError.ERROR = "notUnique";
				aErrorItems.push(oItemError);
			} else if(oResultItem === 0) {
				let oItemError = aPrivileges[key];
				oItemError.ERROR = "groupNotExist";
				aErrorItems.push(oItemError);
			}
		});
		
		return aErrorItems;
	};
	
	/**
	 * Deletes group privileges from the input array
	 * @param {array}
	 *            aPrivileges - the array of privileges
	 * @param {string} 
	 *            sEntityType - entity type (ex. project)
	 * @param {string} 
	 *            sEntityId - entity id
	 *          
	 * @returns {array} - an array of objects that could not be deleted from the table
	 */
	this.deleteGroupPrivileges = function(aPrivileges, sEntityType, sEntityId) {	
		var aPrivilegesColumn = [];
		_.each(aPrivileges, function (oPrivilege) {		
			var oPrivilegeColumn = [sEntityType.toUpperCase(), sEntityId.toUpperCase(), oPrivilege.GROUP_ID.toUpperCase()];
			aPrivilegesColumn.push(oPrivilegeColumn);
		});
		
		var aDeleteResult = dbConnection.executeUpdate(`delete from "${Tables.group_privileges}" 
				where (OBJECT_TYPE, OBJECT_ID, USERGROUP_ID) = (?,?,?)`, aPrivilegesColumn);
		
		authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);
		
		//returns an array with the objects that could not be deleted, 1 means deletion was successful and 0 not successful
		return helpers.unsuccessfulItemsDbOperation(aPrivileges, aDeleteResult);
	};
	
	/**
	 * Updates existing group privileges
	 * @param {array}
	 *            aPrivileges - the array of privileges that will be updated
	  * @param {string} 
	 *            sEntityType - entity type (ex. project)
	 * @param {string} 
	 *            sEntityId - entity id
	 * 
	 * @returns {array} - an array of objects that could not be updated
	 */
	this.updateGroupPrivileges = function(aPrivileges,sEntityType, sEntityId) {		
		var aPrivilegesColumn = [];
		_.each(aPrivileges, function (oPrivilege) {		
			var oPrivilegeColumn = [oPrivilege.PRIVILEGE.toUpperCase(), sEntityType.toUpperCase(), sEntityId.toUpperCase(), oPrivilege.GROUP_ID.toUpperCase()];
			aPrivilegesColumn.push(oPrivilegeColumn);
		});

		var aUpdateResult = dbConnection.executeUpdate(`UPDATE "${Tables.group_privileges}" 
					SET PRIVILEGE = ? where (OBJECT_TYPE, OBJECT_ID, USERGROUP_ID) = (?,?,?)`, aPrivilegesColumn);	
		
		authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, sEntityType, sEntityId);
		
		//returns an array with the objects that could not be updated, 1 means update was successful and 0 not successful
		return helpers.unsuccessfulItemsDbOperation(aPrivileges, aUpdateResult);
	};
	
	/**
	 * Check if project has users with administrate privilege.
	 *
	 * @param {string} 
	 *            sEntityType - entity type (ex. project)
	 * @param {string} 
	 *            sEntityId - entity id
	 *
	 * @returns {boolean} -  true if at least one administrator exists for the project, otherwise false
	 *
	 */
	this.adminstratorExists = function(sEntityType, sEntityId) {

		var aPrivileges = dbConnection.executeQuery(`select USER_ID from "${Tables.user_privileges}" 
													 where OBJECT_TYPE = ? and OBJECT_ID = ? and PRIVILEGE = ?`, sEntityType.toUpperCase(), sEntityId.toUpperCase(), InstancePrivileges.ADMINISTRATE);

		if(aPrivileges.length > 0) {
			return true;
		} else {
			return false;
		}

	};
}

Privilege.prototype = Object.create(Privilege.prototype);
Privilege.prototype.constructor = Privilege;
