var testData = require("../../../testdata/testdata").data;
var mockstarHelpers = require("../../../testtools/mockstar_helpers");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var InstancePrivileges = require("../../../../lib/xs/authorization/authorization-manager").Privileges;
var grantInstanceBasedPrivileges = $.import('xs.postinstall.release_2_1_0', '02_grant_instance_based_privileges');

xdescribe('xsjs.postinstall.release_2_1_0.02_grant_instance_based_privileges-tests', function() {

	var oMockstar;

	beforeOnce(function() {
		oMockstar = new MockstarFacade({
			substituteTables : {
				auth_project : {
					name : 'sap.plc.db::auth.t_auth_project',
				},
				auth_user : {
					name : 'sap.plc.db::auth.t_auth_user',
				},
				auth_usergroup : {
					name : 'sap.plc.db::auth.t_auth_usergroup',
				},
				usergroup : {
					name : 'sap.plc.db::auth.t_usergroup',
				},
				usergroup_user : {
					name : 'sap.plc.db::auth.t_usergroup_user',
				},
				usergroup_usergroup : {
					name : 'sap.plc.db::auth.t_usergroup_usergroup',
				},				
				project : {
					name : 'sap.plc.db::basis.t_project',
					data : testData.oProjectTestData
				}
			}
		});
	});

	afterOnce(function () {
		oMockstar.cleanup();
	});

	beforeEach(function () {
		oMockstar.clearAllTables();
		oMockstar.initializeData();
	});

	it('should grant instance-based privileges for existing projects to all PLC users', function() {
		// arrange
		var oUsers = oMockstar.execQuery('select count(distinct GRANTEE) as rowcount from "SYS"."EFFECTIVE_ROLE_GRANTEES" as roles ' +
				' inner join "SYS"."USERS" as users on roles.grantee = users.user_name ' +
				' where ROLE_NAME = \'sap.plc.authorizations::Base_Viewer\';');
		var iUsersCount = parseInt(oUsers.columns.ROWCOUNT.rows[0], 10);

		var oProjects = oMockstar.execQuery('select count(distinct PROJECT_ID) as rowcount from {{project}}');
		var iProjectsCount = parseInt(oProjects.columns.ROWCOUNT.rows[0], 10);

		// act
		grantInstanceBasedPrivileges.run(jasmine.dbConnection);

		// assert
		expect(mockstarHelpers.getRowCount(oMockstar, "auth_user")).toBe(iProjectsCount);
		expect(mockstarHelpers.getRowCount(oMockstar, "auth_project")).toBe(iUsersCount * iProjectsCount);
	});

	it('should not grant instance-based privileges if no projects exists', function() {
		// arrange
		oMockstar.clearTable("project");

		// act
		grantInstanceBasedPrivileges.run(jasmine.dbConnection);

		// assert
		expect(mockstarHelpers.getRowCount(oMockstar, "auth_project")).toBe(0);
	});

	it('should update the instance-based privilege to ADMINISTRATE for an existing user with CREATE_EDIT instance-based privilege', function() {
		// arrange
		var oUser = oMockstar.execQuery('select top 1 GRANTEE from "SYS"."EFFECTIVE_ROLE_GRANTEES" as roles ' +
				' inner join "SYS"."USERS" as users on roles.grantee = users.user_name ' +
				' where ROLE_NAME = \'sap.plc.authorizations::Base_Viewer\';');
		var sUser = oUser.columns.GRANTEE.rows[0];

		oMockstar.insertTableData("auth_user", {
			OBJECT_TYPE  : ['PROJECT'],
			OBJECT_ID    : [testData.oProjectTestData.PROJECT_ID[0]],
			USER_ID      : [sUser],
			PRIVILEGE    : [InstancePrivileges.CREATE_EDIT]
		});

		var oUsers = oMockstar.execQuery('select count(distinct GRANTEE) as rowcount from "SYS"."EFFECTIVE_ROLE_GRANTEES" as roles ' +
				' inner join "SYS"."USERS" as users on roles.grantee = users.user_name ' +
				' where ROLE_NAME = \'sap.plc.authorizations::Base_Viewer\';');
		var iUsersCount = parseInt(oUsers.columns.ROWCOUNT.rows[0], 10);

		var oProjects = oMockstar.execQuery('select count(distinct PROJECT_ID) as rowcount from {{project}}');
		var iProjectsCount = parseInt(oProjects.columns.ROWCOUNT.rows[0], 10);

		// act
		grantInstanceBasedPrivileges.run(jasmine.dbConnection);

		// assert
		expect(mockstarHelpers.getRowCount(oMockstar, "auth_project")).toBe(iUsersCount * iProjectsCount);
		var oPrivilege = oMockstar.execQuery("select PRIVILEGE from {{auth_project}} where USER_ID = '" + sUser +
				"' and PROJECT_ID = '" + testData.oProjectTestData.PROJECT_ID[0] + "'");
		expect(oPrivilege.columns.PRIVILEGE.rows[0]).toBe(InstancePrivileges.ADMINISTRATE);
	});

}).addTags(["All_Unit_Tests"]);
