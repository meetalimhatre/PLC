var testData = require("../../../testdata/testdata").data;
var mockstarHelpers = require("../../../testtools/mockstar_helpers");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var InstancePrivileges = require("../../../../lib/xs/authorization/authorization-manager").Privileges;
var grantInstanceBasedPrivileges = $.import('xs.postinstall.release_2_1_0', '02_grant_instance_based_privileges');

describe('xsjs.postinstall.release_2_1_0.02_grant_instance_based_privileges-tests', function() {

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
		const sUserList = "user1;user2;user3;user4";
		const iUsersCount = sUserList.split(";").length;

		var oProjects = oMockstar.execQuery('select count(distinct PROJECT_ID) as rowcount from {{project}}');
		var iProjectsCount = parseInt(oProjects.columns.ROWCOUNT.rows[0], 10);

		// act
		grantInstanceBasedPrivileges.update(jasmine.dbConnection, sUserList);

		// assert
		expect(mockstarHelpers.getRowCount(oMockstar, "usergroup_user")).toBe(iUsersCount);
		expect(mockstarHelpers.getRowCount(oMockstar, "auth_usergroup")).toBe(iProjectsCount);
		expect(mockstarHelpers.getRowCount(oMockstar, "auth_user")).toBe(iProjectsCount);
	});

	it('should not grant instance-based privileges if no projects exists', function() {
		// arrange
		const sUserList = "user1;user2;user3;user4";
		const iUsersCount = sUserList.split(";").length;
		oMockstar.clearTable("project");

		// act
		grantInstanceBasedPrivileges.update(jasmine.dbConnection, sUserList);

		// assert
		expect(mockstarHelpers.getRowCount(oMockstar, "usergroup_user")).toBe(iUsersCount);
		expect(mockstarHelpers.getRowCount(oMockstar, "auth_usergroup")).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "auth_user")).toBe(0);
	});

	it('should update the instance-based privilege to ADMINISTRATE for all existing user with CREATE_EDIT instance-based privilege', function() {
		// arrange
		const sUsersList = "user1;user2";
		const aUsers = sUsersList.split(";").map(user => user);

		oMockstar.insertTableData("auth_user", {
			OBJECT_TYPE  : ['PROJECT', 'PROJECT'],
			OBJECT_ID    : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1]],
			USER_ID      : [aUsers[0], aUsers[1]],
			PRIVILEGE    : [InstancePrivileges.CREATE_EDIT, InstancePrivileges.CREATE_EDIT]
		});

		// act
		grantInstanceBasedPrivileges.update(jasmine.dbConnection, sUsersList);

		// assert
		let oPrivilege = oMockstar.execQuery("select PRIVILEGE from {{auth_project}} where USER_ID = '" + aUsers[0] +
				"' and PROJECT_ID = '" + testData.oProjectTestData.PROJECT_ID[0] + "'");
		expect(oPrivilege.columns.PRIVILEGE.rows[0]).toBe(InstancePrivileges.ADMINISTRATE);
		oPrivilege = oMockstar.execQuery("select PRIVILEGE from {{auth_project}} where USER_ID = '" + aUsers[1] +
				"' and PROJECT_ID = '" + testData.oProjectTestData.PROJECT_ID[0] + "'");
		expect(oPrivilege.columns.PRIVILEGE.rows[0]).toBe(InstancePrivileges.ADMINISTRATE);
	});

}).addTags(["All_Unit_Tests"]);
