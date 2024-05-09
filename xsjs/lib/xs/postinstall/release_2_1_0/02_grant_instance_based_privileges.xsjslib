// Grant ADMINISTRATE instance-based privilege for existing projects to all PLC users.

var authorizationUnroller = $.require('../../authorization/authorization-unroller');

const whoAmI = 'xs.postinstall.release_2_1_0.02_grant_instance_based_privileges.xsjslib';

var Tables = await Object.freeze({
    project: 'sap.plc.db::basis.t_project',
    auth_group: 'sap.plc.db::auth.t_auth_usergroup',
    auth_user: 'sap.plc.db::auth.t_auth_user',
    usergroup: 'sap.plc.db::auth.t_usergroup',
    usergroup_user: 'sap.plc.db::auth.t_usergroup_user'
});

async function update(oConnection, sUserList) {

    var sUserGroupId = 'ALL_USERS_OF_PLC_VERSION_3_0';
    var sPrivilege = 'ADMINISTRATE';

    //setup group
    var sUpsertGroup = `upsert "${ Tables.usergroup }" (usergroup_id, description) values ('${ sUserGroupId }', '') where usergroup_id = '${ sUserGroupId }'`;
    oConnection.executeUpdate(sUpsertGroup);

    //setup group members
    var sUpsertUsergroupUsers = `
		UPSERT 
			"${ Tables.usergroup_user }"
		VALUES 
			(?, ?)
		WITH PRIMARY KEY`;

    var oUserList = sUserList.split(';').map(function (item) {
        return [
            sUserGroupId,
            item
        ];
    });
    await console.log(oUserList);
    oConnection.executeUpdate(sUpsertUsergroupUsers, oUserList);

    //setup group privilege
    var sUpsertAuthGroup = `
		upsert "${ Tables.auth_group }"
		select UCASE('Project') as OBJECT_TYPTE, PROJECT_ID as OBJECT_ID, '${ sUserGroupId }' as USERGROUP_ID, 'ADMINISTRATE' as PRIVILEGE from  "sap.plc.db::basis.t_project" 
		`;
    oConnection.executeUpdate(sUpsertAuthGroup);

    //add privilege to user who created a project
    var sUpsertUser = `
		upsert "${ Tables.auth_user }"
		select UCASE('Project') as OBJECT_TYPTE, PROJECT_ID as OBJECT_ID, CREATED_BY as USER_ID, 'ADMINISTRATE' as PRIVILEGE from "sap.plc.db::basis.t_project" 
		`;
    oConnection.executeUpdate(sUpsertUser);

    //unroll privileges for related objects
    var withErrors = await authorizationUnroller.unrollPrivilegesOnGroupUpdate(oConnection, sUserGroupId);

    return !withErrors;
}
export default {authorizationUnroller,whoAmI,Tables,update};
