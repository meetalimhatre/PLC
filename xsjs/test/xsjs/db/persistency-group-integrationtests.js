var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;

var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var authorizationUnroller = require("../../../lib/xs/authorization/authorization-unroller");


describe('xsjs.db.persistency-group-integrationtests', function() {

	
	var mockstar = null;
	var persistency = null;

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables : {
				usergroup: "sap.plc.db::auth.t_usergroup",
				usergroup_user: "sap.plc.db::auth.t_usergroup_user",
				usergroup_usergroup: "sap.plc.db::auth.t_usergroup_usergroup",
				group_privileges: 'sap.plc.db::auth.t_auth_usergroup'
			}
		});
	});

	beforeEach(function() {
		spyOn(authorizationUnroller, 'unrollPrivileges').and.callFake(function() { return true; });
		spyOn(authorizationUnroller, 'unrollPrivilegesOnGroupUpdate').and.callFake(function() { return true; });
	});

	afterOnce(function() {
		mockstar.cleanup();
	});

	describe('get functions', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("usergroup", testData.oUserGroups);
			mockstar.insertTableData("usergroup_user", testData.oUserGroupUser);
			mockstar.insertTableData("usergroup_usergroup", testData.oUserGroupUserGroups);

			persistency = new Persistency(jasmine.dbConnection);
		});

		it('getGroups should return all groups in alphabetical order', function() {
			//act
			var oRetrievedObject = persistency.Group.getGroups();

			// assert
			expect(oRetrievedObject.length).toEqual(7);
			expect(oRetrievedObject[0].GROUP_ID).toBe('UGR2');	
			expect(oRetrievedObject[1].GROUP_ID).toBe('UGR6');
			expect(oRetrievedObject[2].GROUP_ID).toBe('USRGR1');		
		});

		it('getGroups should return a group with description for a given id', function() {
			// arrange
			var sGroupId = '\'UGR6\''; 

			//act
			var oRetrievedObject = persistency.Group.getGroups([sGroupId]);

			// assert
			expect(oRetrievedObject.length).toEqual(1);	
			expect(oRetrievedObject[0].GROUP_ID).toEqual('UGR6');
			expect(oRetrievedObject[0].DESCRIPTION).toEqual('Group 6');
		});

		it('getGroups should return empty if no group is found', function() {
			// arrange
			var sGroupId = '\'USRGR10\'';

			//act
			var oRetrievedObject = persistency.Group.getGroups([sGroupId]);

			// assert
			expect(oRetrievedObject.length).toEqual(0);		
		});

		it('getGroups should return the groups that start with the given string', function() {
			// arrange
			var sFilter = 'UG';

			//act
			var oRetrievedObject = persistency.Group.getGroups(null, sFilter);

			// assert
			expect(oRetrievedObject.length).toEqual(2);		
		});

		it('getGroupMembers should return the user and subgroup members', function() {
			// arrange
			var sGroupId = 'USRGR1';

			//act
			var oRetrievedObject = persistency.Group.getGroupMembers(sGroupId);

			// assert
			expect(oRetrievedObject.GROUPS.length).toEqual(4);
			expect(oRetrievedObject.USERS.length).toEqual(3);
		});

		it('getGroupMembers should return empty when it has no members', function() {
			// arrange
			var sGroupId = 'USRGR5';

			//act
			var oRetrievedObject = persistency.Group.getGroupMembers(sGroupId);

			// assert
			expect(oRetrievedObject.GROUPS.length).toEqual(0);
			expect(oRetrievedObject.USERS.length).toEqual(0);	
		});
	});

	describe('insert', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables

			persistency = new Persistency(jasmine.dbConnection);
		});

		it('Usergroups should create the user groups from the input array', function() {
			// arrange
			var aUsergroups = [{
				"GROUP_ID": "GR1",
				"DESCRIPTION": "Group 1"
			}, {
				"GROUP_ID": "GR2",
				"DESCRIPTION": "Group 2"
			}];
			var iUsergroupsBefore =  mockstar_helpers.getRowCount(mockstar, "usergroup");

			//act
			var result = persistency.Group.insertUsergroups(aUsergroups);

			// assert
			//check that 2 new records were created
			var iUsergroupsAfter =  mockstar_helpers.getRowCount(mockstar, "usergroup");
			expect(iUsergroupsAfter).toEqual(iUsergroupsBefore+2);	
			expect(result.length).toEqual(0);
		});	

		it('Usergroups should return the objects that could not be inserted', function() {
			// arrange
			//add test example to the table
			mockstar.insertTableData("usergroup", testData.oUserGroups);
			var aUsergroups = [{
				"GROUP_ID": "GR1",
				"DESCRIPTION": "Group 1"
			}, {
				"GROUP_ID": "USRGR3",
				"DESCRIPTION": "Group 2"
			}];

			//act
			var result = persistency.Group.insertUsergroups(aUsergroups);

			// assert
			expect(result.length).toEqual(1);			
		});	
		
		it('Usergroups should return the second object that could not be inserted because the ids are not case sensitive', function() {
			// arrange
			//add test example to the table
			mockstar.insertTableData("usergroup", testData.oUserGroups);
			var aUsergroups = [{
				"GROUP_ID": "GR1",
				"DESCRIPTION": "Group 1"
			}, {
				"GROUP_ID": "Gr1",
				"DESCRIPTION": "Group 2"
			}];

			//act
			var result = persistency.Group.insertUsergroups(aUsergroups);

			// assert
			expect(result.length).toEqual(1);			
		});	

		it('UserMembership should create the user membership from the input array', function() {
			// arrange
			var aUserMembers = [{
				"GROUP_ID": "GR1",
				"USER_ID": "Usr1"
			}, {
				"GROUP_ID": "USRGR4",
				"USER_ID": "Usr1"
			}];
			var iUsergroupsBefore =  mockstar_helpers.getRowCount(mockstar, "usergroup_user");

			//act
			var result = persistency.Group.insertUserMembership(aUserMembers);

			// assert
			//check that 2 new records were created
			var iUsergroupsAfter =  mockstar_helpers.getRowCount(mockstar, "usergroup_user");
			expect(iUsergroupsAfter).toEqual(iUsergroupsBefore+2);	
			expect(result.length).toEqual(0);
			expect(authorizationUnroller.unrollPrivilegesOnGroupUpdate).toHaveBeenCalled();
		});	

		it('UserMembership should return the objects that could not be inserted', function() {
			// arrange
			//add test example to the table
			mockstar.insertTableData("usergroup_user", testData.oUserGroupUser);
			var aUserMembers = [{
				"GROUP_ID": "USRGR1",
				"USER_ID": "U1"
			}, {
				"GROUP_ID": "USRGR1",
				"USER_ID": "USR1"
			}];

			//act
			var result = persistency.Group.insertUserMembership(aUserMembers);

			// assert
			expect(result.length).toEqual(1);			
		});	

		it('GroupMembership should create the group membership from the input array', function() {
			// arrange
			var aGroupMembers = [{
				"GROUP_ID": "GR1",
				"SUBGROUP_ID": "USRGR1"
			}, {
				"GROUP_ID": "USRGR4",
				"SUBGROUP_ID": "USRGR1"
			}];
			var iUsergroupsBefore =  mockstar_helpers.getRowCount(mockstar, "usergroup_usergroup");

			//act
			var result = persistency.Group.insertGroupMembership(aGroupMembers);

			// assert
			//check that 2 new records were created
			var iUsergroupsAfter =  mockstar_helpers.getRowCount(mockstar, "usergroup_usergroup");
			expect(iUsergroupsAfter).toEqual(iUsergroupsBefore+2);	
			expect(result.length).toEqual(0);
			expect(authorizationUnroller.unrollPrivilegesOnGroupUpdate).toHaveBeenCalled();
		});	

		it('GroupMembership should return the objects that could not be inserted', function() {
			// arrange
			//add test example to the table
			mockstar.insertTableData("usergroup_usergroup", testData.oUserGroupUserGroups);
			var aGroupMembers = [{
				"GROUP_ID": "USRGR1",
				"SUBGROUP_ID": "UG1"
			}, {
				"GROUP_ID": "USRGR1",
				"SUBGROUP_ID": "USRGR5"
			}];

			//act
			var result = persistency.Group.insertGroupMembership(aGroupMembers);

			// assert
			expect(result.length).toEqual(1);			
		});	
	});
	
	describe('delete', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("usergroup", testData.oUserGroups);
			mockstar.insertTableData("usergroup_user", testData.oUserGroupUser);
			mockstar.insertTableData("usergroup_usergroup", testData.oUserGroupUserGroups);
			mockstar.insertTableData("group_privileges", testData.oGroupPrivilege);
			persistency = new Persistency(jasmine.dbConnection);
		});

		it('Usergroups should delete the user groups from the input array', function() {
			// arrange
			var aUsergroups = [{
				"GROUP_ID": "USRGR1"
			}, {
				"GROUP_ID": "Ugr2"
			}];
			var iUsergroupsBefore =  mockstar_helpers.getRowCount(mockstar, "usergroup");

			//act
			var result = persistency.Group.deleteUsergroups(aUsergroups);

			// assert
			//check that 2 records were deleted
			var iUsergroupsAfter =  mockstar_helpers.getRowCount(mockstar, "usergroup");
			expect(iUsergroupsAfter).toEqual(iUsergroupsBefore-2);	
			expect(result.length).toEqual(0);
			//check that the memberships were also deleted
			expect(mockstar_helpers.getRowCount(mockstar, "usergroup_user", "usergroup_id='UsrGr1' or usergroup_id='UGR2'")).toBe(0);
			expect(mockstar_helpers.getRowCount(mockstar, "usergroup_usergroup", "parent_usergroup_id='UsrGr1' or parent_usergroup_id='UGR2'")).toBe(0);
			//check that the group privileges were also deleted
			expect(mockstar_helpers.getRowCount(mockstar, "group_privileges", "usergroup_id='UsrGr1' or usergroup_id='UGR2'")).toBe(0);
			expect(authorizationUnroller.unrollPrivileges).toHaveBeenCalled();
		});	

		it('Usergroups should return the objects that could not be deleted', function() {
			// arrange
			var aUsergroups = [{
				"GROUP_ID": "UG1"
			}, {
				"GROUP_ID": "USRGR3"
			}];

			//act
			var result = persistency.Group.deleteUsergroups(aUsergroups);

			// assert
			expect(result.length).toEqual(1);			
		});	

		it('UserMembership should delete the user membership from the input array', function() {
			// arrange
			var aUserMembers = [{
				"GROUP_ID": "USRGR1",
				"USER_ID": "USR1"
			}, {
				"GROUP_ID": "USRGR4",
				"USER_ID": "USR4"
			}];
			var iUsergroupsBefore =  mockstar_helpers.getRowCount(mockstar, "usergroup_user");

			//act
			var result = persistency.Group.deleteUserMembership(aUserMembers);

			// assert
			//check that 2 records were deleted
			var iUsergroupsAfter =  mockstar_helpers.getRowCount(mockstar, "usergroup_user");
			expect(iUsergroupsAfter).toEqual(iUsergroupsBefore-2);	
			expect(result.length).toEqual(0);
			expect(authorizationUnroller.unrollPrivilegesOnGroupUpdate).toHaveBeenCalled();
		});	

		it('UserMembership should return the objects that could not be deleted', function() {
			// arrange
			var aUserMembers = [{
				"GROUP_ID": "USRGR1",
				"USER_ID": "U1"
			}, {
				"GROUP_ID": "USRGR1",
				"USER_ID": "USR1"
			}];

			//act
			var result = persistency.Group.deleteUserMembership(aUserMembers);

			// assert
			expect(result.length).toEqual(1);			
		});	

		it('GroupMembership should delete the group membership from the input array', function() {
			// arrange
			var aGroupMembers = [{
				"GROUP_ID": "USRGR1",
				"SUBGROUP_ID": "USRGR5"
			}, {
				"GROUP_ID": "USRGR1",
				"SUBGROUP_ID": "UGR6"
			}];
			var iUsergroupsBefore =  mockstar_helpers.getRowCount(mockstar, "usergroup_usergroup");

			//act
			var result = persistency.Group.deleteGroupMembership(aGroupMembers);

			// assert
			//check that 2 records were deleted
			var iUsergroupsAfter =  mockstar_helpers.getRowCount(mockstar, "usergroup_usergroup");
			expect(iUsergroupsAfter).toEqual(iUsergroupsBefore-2);	
			expect(result.length).toEqual(0);
			expect(authorizationUnroller.unrollPrivilegesOnGroupUpdate).toHaveBeenCalled();
		});	

		it('GroupMembership should return the objects that could not be deleted', function() {
			// arrange
			var aGroupMembers = [{
				"GROUP_ID": "USRGR1",
				"SUBGROUP_ID": "USRGR5"
			}, {
				"GROUP_ID": "USRGR1",
				"SUBGROUP_ID": "UGRr"
			}];

			//act
			var result = persistency.Group.deleteGroupMembership(aGroupMembers);

			// assert
			expect(result.length).toEqual(1);			
		});	
	});
	
	describe('update', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("usergroup", testData.oUserGroups);

			persistency = new Persistency(jasmine.dbConnection);
		});

		it('Usergroups should update the user groups from the input array', function() {
			// arrange
			var aUsergroups = [{
				"GROUP_ID": "USRGR1",
				"DESCRIPTION": "Update description gr 1"
				
			}, {
				"GROUP_ID": "UGR6",
				"DESCRIPTION": "Update description gr 6"
				
			}];

			//act
			var result = persistency.Group.updateUsergroups(aUsergroups);

			// assert
			expect(result.length).toEqual(0);
			//check if the database was updated
			expect(mockstar_helpers.getRowCount(mockstar, "usergroup", "usergroup_id='USRGR1' and description = 'Update description gr 1'")).toBe(1);
			expect(mockstar_helpers.getRowCount(mockstar, "usergroup", "usergroup_id='UGR6' and description = 'Update description gr 6'")).toBe(1);
		});	

		it('Usergroups should return the objects that could not be updated', function() {
			// arrange
			var aUsergroups = [{
				"GROUP_ID": "UG1",
				"DESCRIPTION": "Group updated descr 1"
			}, {
				"GROUP_ID": "USRGR1",
				"DESCRIPTION": "Group updated descr 2"
			}];

			//act
			var result = persistency.Group.updateUsergroups(aUsergroups);

			// assert
			expect(result.length).toEqual(1);			
		});	
	});	
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);