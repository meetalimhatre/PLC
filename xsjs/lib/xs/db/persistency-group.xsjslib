const _ = $.require('lodash');
const helpers = $.require('../util/helpers');
const authorizationUnroller = $.require('../authorization/authorization-unroller');

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;
const Code = MessageLibrary.Code;

var Tables = Object.freeze({
    usergroup: 'sap.plc.db::auth.t_usergroup',
    usergroup_user: 'sap.plc.db::auth.t_usergroup_user',
    usergroup_usergroup: 'sap.plc.db::auth.t_usergroup_usergroup',
    group_authorization: 'sap.plc.db::auth.t_auth_usergroup'
});

/**
 * Provides persistency operations for groups.
 */

function Group(dbConnection) {

    /**
	 * Gets all the user groups from the system, or an array of groups according to the input parameters when defined.
	 *
	 * @param {aGroupId}
	 *            aGroupId - an array of groups
	 *
	 ** @param {sFilter}
	 *            sGroupId - the group id
	 *            
	 * @returns {oReturnObject} -  contains the user group ids and the description
	 *
	 */
    this.getGroups = async function (aGroupId, sFilter) {

        var stmt = `select USERGROUP_ID as GROUP_ID, DESCRIPTION from "${ Tables.usergroup }"`;
        if (!helpers.isNullOrUndefined(aGroupId)) {
            stmt += ` where USERGROUP_ID in (${ aGroupId }) order by USERGROUP_ID`;
            return await dbConnection.executeQuery(stmt);
        }

        if (!helpers.isNullOrUndefined(sFilter)) {
            stmt += ` where UPPER(USERGROUP_ID) like concat(?,'%') order by USERGROUP_ID`;
            return await dbConnection.executeQuery(stmt, sFilter.toUpperCase());
        }

        stmt += ` order by USERGROUP_ID`;

        return await dbConnection.executeQuery(stmt);

    };

    /**
	 * Gets all the user groups members from the system
	 *
	 * @param {sGroupId}
	 *            sGroupId - the group id
	 *
	 * @returns {oReturnObject} -  contains all the users and the subgroups of the group
	 *
	 */

    this.getGroupMembers = function (sGroupId) {

        var stmtSubgroups = `select usergroup.USERGROUP_ID as GROUP_ID, usergroup.DESCRIPTION from "${ Tables.usergroup }" usergroup
		inner join "${ Tables.usergroup_usergroup }" subgroups on subgroups.CHILD_USERGROUP_ID = usergroup.USERGROUP_ID 
		and subgroups.PARENT_USERGROUP_ID = ?`;
        var stmtUsers = `select USER_ID from "${ Tables.usergroup_user }" where USERGROUP_ID = ?`;

        var aGroupMembers = await dbConnection.executeQuery(stmtSubgroups, sGroupId);
        var aUserMembers = await dbConnection.executeQuery(stmtUsers, sGroupId);

        return {
            'GROUPS': aGroupMembers,
            'USERS': aUserMembers
        };
    };

    /**
	 * Creates new user groups
	 * @param {array}
	 *            aUsergroups - the array of user groups that will be created
	 *            			- the array contains objects that have  USERGROUP_ID and DESCRIPTION as properties
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {array} - an array of objects that could not be inserted into the table
	 */
    this.insertUsergroups = async function (aUsergroups) {
        var aUsergroupsColumn = [];
        _.each(aUsergroups, function (oUsergroup) {
            var oUsergroupColumn = [
                oUsergroup.GROUP_ID.toUpperCase(),
                oUsergroup.DESCRIPTION
            ];
            aUsergroupsColumn.push(oUsergroupColumn);
        });

        try {
            var aInsertResult = await dbConnection.executeUpdate(`INSERT INTO "${ Tables.usergroup }" (USERGROUP_ID, DESCRIPTION) VALUES (?,?)`, aUsergroupsColumn);
        } catch (e) {
            const sClientMsg = 'Error during inserting of user groups into table';
            const sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        //return an array of object that could not be inserted -> 1 means successful operation
        return await helpers.unsuccessfulItemsDbOperation(aUsergroups, aInsertResult);

    };

    /**
	 * Creates new user membership
	 * @param {array}
	 *            aUserMembers - the array of user members that will be created
	 *            			- the array contains objects that have USER_ID and USERGROUP_ID as properties
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {array} - an array of objects that could not be inserted into the table
	 */
    this.insertUserMembership = async function (aUserMembers) {
        var touchedGroups = new Set();
        var aUserMembersColumn = [];
        _.each(aUserMembers, function (oUserMember) {
            var oUserMembersColumn = [
                oUserMember.GROUP_ID.toUpperCase(),
                oUserMember.USER_ID.toUpperCase()
            ];
            aUserMembersColumn.push(oUserMembersColumn);
            touchedGroups.add(oUserMember.GROUP_ID);
        });

        try {
            var aInsertResult = await dbConnection.executeUpdate(`INSERT INTO "${ Tables.usergroup_user }" (USERGROUP_ID, USER_ID) VALUES (?,?)`, aUserMembersColumn);
            for (let groupId of touchedGroups) {
                await authorizationUnroller.unrollPrivilegesOnGroupUpdate(dbConnection, groupId);
            }
        } catch (e) {
            const sClientMsg = 'Error during inserting of user membership into table.';
            const sServerMsg = `${ sClientMsg } ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        //return an array of object that could not be inserted -> 1 means successful operation
        return await helpers.unsuccessfulItemsDbOperation(aUserMembers, aInsertResult);
    };

    /**
	 * Creates new group membership
	 * @param {array}
	 *            aGroupMembers - the array of group members (subgroups) that will be created
	 *            			- the array contains objects that have USER_ID and USERGROUP_ID as properties
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 * @returns {array} - an array of objects that could not be inserted into the table
	 */
    this.insertGroupMembership = async function (aGroupMembers) {
        var touchedGroups = new Set();
        var aGroupMembersColumn = [];
        _.each(aGroupMembers, function (oGroupMember) {
            var oUserMembersColumn = [
                oGroupMember.GROUP_ID.toUpperCase(),
                oGroupMember.SUBGROUP_ID.toUpperCase()
            ];
            aGroupMembersColumn.push(oUserMembersColumn);
            touchedGroups.add(oGroupMember.SUBGROUP_ID);
        });

        try {
            var aInsertResult = await dbConnection.executeUpdate(`INSERT INTO "${ Tables.usergroup_usergroup }" (PARENT_USERGROUP_ID, CHILD_USERGROUP_ID) VALUES (?,?)`, aGroupMembersColumn);
            for (let groupId of touchedGroups) {
                await authorizationUnroller.unrollPrivilegesOnGroupUpdate(dbConnection, groupId);
            }
        } catch (e) {
            const sClientMsg = 'Error during inserting of subgroup membership into table.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }

        //return an array of object that could not be inserted -> 1 means successful operation
        return await helpers.unsuccessfulItemsDbOperation(aGroupMembers, aInsertResult);
    };

    /**
	 * Deletes groups from the input array
	 * @param {array}
	 *            aGroups - the array of user groups
	 * @returns {array} - an array of objects that could not be deleted from the table
	 */

    this.deleteUsergroups = async function (aGroups) {
        var touchedGroups = new Set();
        var aGroupColumn = [];
        _.each(aGroups, function (oGroup) {
            var oGroupColumn = [oGroup.GROUP_ID.toUpperCase()];
            aGroupColumn.push(oGroupColumn);
            touchedGroups.add(oGroup.GROUP_ID);
        });

        var aDeleteResult = await dbConnection.executeUpdate(`delete from "${ Tables.usergroup }" where USERGROUP_ID = ?`, aGroupColumn);

        //returns an array with the objects that could not be deleted, 1 means deletion was successful and 0 not successful
        var aGroupsNotDeleted = await helpers.unsuccessfulItemsDbOperation(aGroups, aDeleteResult);
        if (aGroupsNotDeleted.length === 0) {

            //remove privileges inherited from the deleted group
            var objectsFromGroupPrivileges = new Set();
            for (let groupId of touchedGroups) {
                var aObjects = await authorizationUnroller.getObjectsFromGroupPrivileges(dbConnection, groupId);
                for (let i = 0; i < aObjects.length; i++) {
                    objectsFromGroupPrivileges.add({
                        OBJECT_TYPE: aObjects[i].OBJECT_TYPE,
                        OBJECT_ID: aObjects[i].OBJECT_ID
                    });
                }
            }

            await authorizationUnroller.unrollPrivileges(dbConnection, Array.from(objectsFromGroupPrivileges));


            await dbConnection.executeUpdate(`delete from "${ Tables.usergroup_user }" where USERGROUP_ID = ?`, aGroupColumn);
            await dbConnection.executeUpdate(`delete from "${ Tables.usergroup_usergroup }" where PARENT_USERGROUP_ID = ?`, aGroupColumn);

            await dbConnection.executeUpdate(`delete from "${ Tables.group_authorization }" where USERGROUP_ID = ?`, aGroupColumn);
        }

        return aGroupsNotDeleted;
    };








    this.deleteUserMembership = async function (aUserMembers) {
        var touchedGroups = new Set();
        var aUserMembersColumn = [];
        _.each(aUserMembers, function (oUserMember) {
            var oUserMembersColumn = [
                oUserMember.GROUP_ID.toUpperCase(),
                oUserMember.USER_ID.toUpperCase()
            ];
            aUserMembersColumn.push(oUserMembersColumn);
            touchedGroups.add(oUserMember.GROUP_ID);
        });

        var aDeleteResult = await dbConnection.executeUpdate(`delete from "${ Tables.usergroup_user }" where (USERGROUP_ID, USER_ID) = (?,?)`, aUserMembersColumn);
        for (let groupId of touchedGroups) {
            await authorizationUnroller.unrollPrivilegesOnGroupUpdate(dbConnection, groupId);
        }


        return await helpers.unsuccessfulItemsDbOperation(aUserMembers, aDeleteResult);
    };








    this.deleteGroupMembership = async function (aGroupMembers) {
        var touchedGroups = new Set();
        var aGroupMembersColumn = [];
        _.each(aGroupMembers, function (oGroupMember) {
            var oUserMembersColumn = [
                oGroupMember.GROUP_ID.toUpperCase(),
                oGroupMember.SUBGROUP_ID.toUpperCase()
            ];
            aGroupMembersColumn.push(oUserMembersColumn);
            touchedGroups.add(oGroupMember.GROUP_ID);
        });

        var aDeleteResult = await dbConnection.executeUpdate(`delete from "${ Tables.usergroup_usergroup }" where (PARENT_USERGROUP_ID, CHILD_USERGROUP_ID) = (?,?)`, aGroupMembersColumn);
        for (let groupId of touchedGroups) {
            await authorizationUnroller.unrollPrivilegesOnGroupUpdate(dbConnection, groupId);
        }


        return await helpers.unsuccessfulItemsDbOperation(aGroupMembers, aDeleteResult);
    };








    this.updateUsergroups = async function (aGroups) {
        var aGroupColumn = [];
        _.each(aGroups, function (oGroup) {
            var oGroupColumn = [
                oGroup.DESCRIPTION,
                oGroup.GROUP_ID.toUpperCase()
            ];
            aGroupColumn.push(oGroupColumn);
        });

        var aUpdateResult = await dbConnection.executeUpdate(`UPDATE "${ Tables.usergroup }" SET DESCRIPTION = ? where USERGROUP_ID = ?`, aGroupColumn);


        return await helpers.unsuccessfulItemsDbOperation(aGroups, aUpdateResult);
    };
}

Group.prototype = Object.create(Group.prototype);
Group.prototype.constructor = Group;
export default {_,helpers,authorizationUnroller,MessageLibrary,PlcException,ValidationInfoCode,Code,Tables,Group};
