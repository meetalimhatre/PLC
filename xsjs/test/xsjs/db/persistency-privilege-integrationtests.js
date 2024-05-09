var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;

var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var authorizationUnroller = require("../../../lib/xs/authorization/authorization-unroller");

var sUser = testData.sTestUser;

describe('xsjs.db.persistency-privilege-integrationtests', function() {

	
	var mockstar = null;
	var persistency;
	var sEntityType = 'Project';

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables : {
				project: 'sap.plc.db::basis.t_project',
				user_privileges: 'sap.plc.db::auth.t_auth_user',
				group_privileges: 'sap.plc.db::auth.t_auth_usergroup',
				usergroup: 'sap.plc.db::auth.t_usergroup',
				authorization: 'sap.plc.db::auth.t_auth_project'
			}
		});
	});

	beforeEach(function() {
		persistency = new Persistency(jasmine.dbConnection);
		spyOn(authorizationUnroller, 'unrollPrivilegesOnObjectUpdate').and.callFake(function() { return true; });
	});
	
	afterOnce(function() {
		mockstar.cleanup();
	});

	describe('get user privileges', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("user_privileges", testData.oPrivilege);
			mockstar.insertTableData("authorization", {
														"PROJECT_ID": ['PR1', 'PR1'],
														"USER_ID": [sUser, 'SYSTEM'],
														"PRIVILEGE": ['ADMINISTRATE', 'ADMINISTRATE']
									});
		});

		it('should return all user privileges for a given project id', function() {
			// arrange
			var sEntityId = 'PR1';
			var iPrivilege =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");

			//act
			var oRetrievedObject = persistency.Privilege.getUserPrivileges(sEntityType, sEntityId, sUser);

			// assert
			//check that the returned number of privileges is the same as records in table
			expect(oRetrievedObject.length).toEqual(iPrivilege);			
		});

		it('should return emtpy object if the project is not found in the privileges table', function() {
			// arrange
			var sEntityId = 'PR6';

			//act
			var oRetrievedObject = persistency.Privilege.getUserPrivileges(sEntityType, sEntityId, sUser);

			// assert
			//check that the returned number of privileges is the same as records in table
			expect(oRetrievedObject.length).toEqual(0);	
		});
		
		it('should return the privilege from the rolled up table (t_auth_project) for the current user', function() {
			// arrange
			var sEntityId = 'PR1';
			var iPrivilege =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");

			//act
			var oRetrievedObject = persistency.Privilege.getUserPrivileges(sEntityType, sEntityId, 'SYSTEM');

			// assert
			//check that the returned number of privileges is the same as records in table
			expect(oRetrievedObject.length).toEqual(iPrivilege);	
			//check if the SYSTEM user has the privilege form the rollup table
			expect(oRetrievedObject[1].USER_ID).toEqual('SYSTEM');
			expect(oRetrievedObject[1].PRIVILEGE).toEqual('ADMINISTRATE');
		});
	});

	describe('insert user privileges', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
		});

		it('should create the privileges from the input array', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"USER_ID": "TEST1",
								"PRIVILEGE": "READ"
							},
							{"USER_ID": "Usr4",
								"PRIVILEGE": "READ"
							}];
			var iPrivilegeBefore =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");
			
			//act
			var result = persistency.Privilege.insertUserPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			//check that 2 new records were created
			var iPrivilegeAfter =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");
			expect(iPrivilegeAfter).toEqual(iPrivilegeBefore+2);	
			expect(result.length).toEqual(0);
			expect(authorizationUnroller.unrollPrivilegesOnObjectUpdate).toHaveBeenCalled();
		});	
		
		it('should return the objects that could not be inserted', function() {
			// arrange
			//add test example to the table
			mockstar.insertTableData("user_privileges", testData.oPrivilege);
			var sEntityId = 'PR1';
			var aPrivileges = [{"USER_ID": "TEST1",
								"PRIVILEGE": "READ"
							},
							{"USER_ID": "Usr4", //already exists
								"PRIVILEGE": "READ"
							}];
			var iPrivilegeBefore =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");

			//act
			var result = persistency.Privilege.insertUserPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			expect(result.length).toEqual(1);			
		});	

		it('should throw unexpected exception when the user has already a privilege for the project', function() {
			// arrange
			mockstar.insertTableData("user_privileges", testData.oPrivilege);

			var sEntityId = 'PR1';
			var aPrivileges = [{ "USER_ID": "Usr1",
								"PRIVILEGE": "READ"
							}];
			var exception;
			
			//act
			try {
				persistency.Privilege.insertUserPrivileges(aPrivileges, sEntityType, sEntityId);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});
	});

	describe('delete user privileges', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("user_privileges", testData.oPrivilege);
		});

		it('should delete the privileges from the input array and return empty array', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"USER_ID": "Usr4"
								},
								{"USER_ID": "Usr1"
								}];
			var iPrivilegeBefore =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");

			//act
			var result = persistency.Privilege.deleteUserPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			//check that 3 records were deleted from the table
			var iPrivilegeAfter =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");
			expect(iPrivilegeAfter).toEqual(iPrivilegeBefore-2);	
			expect(result.length).toBe(0);
			expect(authorizationUnroller.unrollPrivilegesOnObjectUpdate).toHaveBeenCalled();
		});	

		it('should not delete any privilege if the key does not exist, should return the objects that could not be deleted', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"USER_ID": "Usr5"
								}];
			var iPrivilegeBefore =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");

			//act
			var result = persistency.Privilege.deleteUserPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			var iPrivilegeAfter =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "'");
			expect(iPrivilegeAfter).toEqual(iPrivilegeBefore);
			expect(result.length).toEqual(1);
		});	
	});

	describe('update user privileges', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("user_privileges", testData.oPrivilege);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should update the privileges with the data from the input array, and return empty array if update was successful for all', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"USER_ID": "USR4",
								"PRIVILEGE": "ADMINISTRATE"
							},
							{"USER_ID": "USR1",
								"PRIVILEGE": "READ"
							},
							{"USER_ID": "SYSTEM",
								"PRIVILEGE": "READ"
							}];

			//act
			var result = persistency.Privilege.updateUserPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			//check that the records were update
			var iPrivilege1 =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "' and user_id = 'USR4' and privilege = 'ADMINISTRATE'");
			var iPrivilege2 =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "' and user_id = 'USR1' and privilege = 'READ'");
			var iPrivilege3 =  mockstar_helpers.getRowCount(mockstar, "user_privileges", "OBJECT_ID='" + sEntityId + "' and user_id = 'SYSTEM' and privilege = 'READ'");
			expect(iPrivilege1).toEqual(1);	
			expect(iPrivilege2).toEqual(1);
			expect(iPrivilege3).toEqual(1);
			expect(result.length).toBe(0);
			expect(authorizationUnroller.unrollPrivilegesOnObjectUpdate).toHaveBeenCalled();
		});	
		
		it('should update only the existing items and return the objects that were not updated', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"USER_ID": "Usr4",
								"PRIVILEGE": "ADMINISTRATE"
							},
							{"USER_ID": "Usr1",
								"PRIVILEGE": "READ"
							},
							{"USER_ID": "lallaa",
								"PRIVILEGE": "READ"
							}];

			//act
			var result = persistency.Privilege.updateUserPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			expect(result.length).toEqual(1);
		});	
	});
	
	describe('get group privileges', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("group_privileges", testData.oGroupPrivilege);
		});

		it('should return all user privileges for a given project id', function() {
			// arrange
			var sEntityId = 'PR1';
			var iPrivilege =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'PROJECT' and OBJECT_ID='" + sEntityId + "'");

			//act
			var oRetrievedObject = persistency.Privilege.getGroupPrivileges(sEntityType, sEntityId);

			// assert
			//check that the returned number of privileges is the same as records in table
			expect(oRetrievedObject.length).toEqual(iPrivilege);			
		});

		it('should return emtpy object if the project is not found in the privileges table', function() {
			// arrange
			var sEntityId = 'PR6';

			//act
			var oRetrievedObject = persistency.Privilege.getGroupPrivileges(sEntityType, sEntityId);

			// assert
			expect(oRetrievedObject.length).toEqual(0);	
		});
	});
	
	describe('insert group privileges', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("usergroup", testData.oUserGroups);
		});

		it('should create the privileges from the input array', function() {
			// arrange
			var sEntityId = 'PR2';
			var aPrivileges = [{"GROUP_ID": "USRGR1",
								"PRIVILEGE": "READ"
							},
							{"GROUP_ID": "USRGR5",
								"PRIVILEGE": "READ"
							}];
			var iPrivilegeBefore =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'PROJECT' and OBJECT_ID='" + sEntityId + "'");

			//act
			var result = persistency.Privilege.insertGroupPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			//check that 2 new records were created
			var iPrivilegeAfter =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'PROJECT' and OBJECT_ID='" + sEntityId + "'");
			expect(iPrivilegeAfter).toEqual(iPrivilegeBefore+2);	
			expect(result.length).toEqual(0);
		});	
		
		it('should return the objects that could not be inserted', function() {
			// arrange
			//add test example to the table
			mockstar.insertTableData("group_privileges", testData.oGroupPrivilege);
			var sEntityId = 'PR1';
			var aPrivileges = [{"GROUP_ID": "UGr2",
								"PRIVILEGE": "READ"
							},
							{"GROUP_ID": "UsrGr1", //already exists
								"PRIVILEGE": "READ"
							},
							{"GROUP_ID": "ugg", //already exists
								"PRIVILEGE": "READ"
							}];
			
			//act
			var result = persistency.Privilege.insertGroupPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			expect(result.length).toEqual(2);	
			expect(result[0]).toMatchData({"GROUP_ID": "UsrGr1",
								            "PRIVILEGE": "READ",
								            "ERROR": "notUnique"
							                }, ["GROUP_ID"]);
			expect(result[1]).toMatchData({"GROUP_ID": "ugg",
								            "PRIVILEGE": "READ",
								            "ERROR": "groupNotExist"
							                }, ["GROUP_ID"]);
		});	
		
		it('should return the second object that could not be inserted because of uniq constraint violation', function() {
			// arrange
			//add test example to the table
			mockstar.insertTableData("group_privileges", testData.oGroupPrivilege);
			var sEntityId = 'PR1';
			var aPrivileges = [{"GROUP_ID": "UGr2",
								"PRIVILEGE": "READ"
							},
							{"GROUP_ID": "ugr2",
								"PRIVILEGE": "READ"
							}];
			
			//act
			var result = persistency.Privilege.insertGroupPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			expect(result.length).toEqual(1);	
			expect(result[0]).toMatchData({"GROUP_ID": "ugr2",
								            "PRIVILEGE": "READ",
								            "ERROR": "notUnique"
							                }, ["GROUP_ID"]);
		});	

		it('should throw unexpected exception when the user has already a privilege for the project', function() {
			// arrange
			mockstar.insertTableData("group_privileges", testData.oGroupPrivilege);

			var sEntityId = 'PR1';
			var aPrivileges = [{ "GROUP_ID": "UsrGr1",
								"PRIVILEGE": "READ"
							}];
			var exception;
			
			//act
			try {
				persistency.Privilege.insertGroupPrivileges(aPrivileges, sEntityType, sEntityId);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});
	});
	
	describe('delete group privileges', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("group_privileges", testData.oGroupPrivilege);
		});

		it('should delete the privileges from the input array and return empty array', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"GROUP_ID": "USRGR1"
								},
								{"GROUP_ID": "USRGR5"
								}];
			var iPrivilegeBefore =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'PROJECT' and OBJECT_ID='" + sEntityId + "'");

			//act
			var result = persistency.Privilege.deleteGroupPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			//check that 3 records were deleted from the table
			var iPrivilegeAfter =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'PROJECT' and OBJECT_ID='" + sEntityId + "'");
			expect(iPrivilegeAfter).toEqual(iPrivilegeBefore-2);	
			expect(result.length).toBe(0);
		});	

		it('should not delete any privilege if the key does not exist, should return the objects that could not be deleted', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"GROUP_ID": "UsrGg5"
								}];
			var iPrivilegeBefore =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'Project' and OBJECT_ID='" + sEntityId + "'");

			//act
			var result = persistency.Privilege.deleteGroupPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			var iPrivilegeAfter =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'Project' and OBJECT_ID='" + sEntityId + "'");
			expect(iPrivilegeAfter).toEqual(iPrivilegeBefore);
			expect(result.length).toEqual(1);
		});	
	});	
	
	describe('update group privileges', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("group_privileges", testData.oGroupPrivilege);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should update the privileges with the data from the input array, and return empty array if update was successful for all', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"GROUP_ID": "USRGR1",
								"PRIVILEGE": "READ"
							},
							{"GROUP_ID": "USRGR5",
								"PRIVILEGE": "FULL_EDIT"
							},
							{"GROUP_ID": "USRGR3",
								"PRIVILEGE": "FULL_EDIT"
							}];

			//act
			var result = persistency.Privilege.updateGroupPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			//check that the records were update
			var iPrivilege1 =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'PROJECT' and OBJECT_ID='" + sEntityId + "'and USERGROUP_ID = 'USRGR1' and privilege = 'READ'");
			var iPrivilege2 =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'PROJECT' and OBJECT_ID='" + sEntityId + "'and USERGROUP_ID = 'USRGR5' and privilege = 'FULL_EDIT'");
			var iPrivilege3 =  mockstar_helpers.getRowCount(mockstar, "group_privileges", "OBJECT_TYPE = 'PROJECT' and OBJECT_ID='" + sEntityId + "'and USERGROUP_ID = 'USRGR3' and privilege = 'FULL_EDIT'");
			expect(iPrivilege1).toEqual(1);	
			expect(iPrivilege2).toEqual(1);
			expect(iPrivilege3).toEqual(1);
			expect(result.length).toBe(0);
		});	
		
		it('should update only the existing items and return the objects that were not updated', function() {
			// arrange
			var sEntityId = 'PR1';
			var aPrivileges = [{"GROUP_ID": "UsrGr1",
								"PRIVILEGE": "READ"
							},
							{"GROUP_ID": "UsrGr5",
								"PRIVILEGE": "READ"
							},
							{"GROUP_ID": "testt",
								"PRIVILEGE": "FULL_EDIT"
							}];

			//act
			var result = persistency.Privilege.updateGroupPrivileges(aPrivileges, sEntityType, sEntityId);

			// assert
			expect(result.length).toEqual(1);
		});	
	});
	
	describe('adminstratorExists', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("user_privileges", { "OBJECT_TYPE": ['PROJECT', 'PROJECT', 'PROJECT', 'PROJECT'],
														  "OBJECT_ID": ['PR1', 'PR1', 'PR2', 'PR2'],
														  "USER_ID": ['USR1', 'SYSTEM', 'USR1', 'USR1'],
														  "PRIVILEGE": ['ADMINISTRATE', 'CREATE_EDIT', 'CREATE_EDIT', 'READ']
				});
		});

		it('should return true if at least one user with administrate privilege exists for project', function() {
			// arrange
			var sEntityType= 'PROJECT';
			var sEntityId = 'PR1';

			//act
			var result = persistency.Privilege.adminstratorExists(sEntityType, sEntityId);

			// assert
			expect(result).toBe(true);
		});	
		
		it('should return false if no user with administrate privilege exists for project', function() {
			// arrange
			var sEntityType= 'PROJECT';
			var sEntityId = 'PR2';

			//act
			var result = persistency.Privilege.adminstratorExists(sEntityType, sEntityId);

			// assert
			expect(result).toBe(false);		
		});
	});

}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);