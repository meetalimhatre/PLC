var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var MessageLibrary = require("../../../lib/xs/util/message");
var PlcMessage = MessageLibrary.Message;
var Code = MessageLibrary.Code;
var PlcException = MessageLibrary.PlcException;
var testData = require("../../testdata/testdata").data;

var authorizationManager = require("../../../lib/xs/authorization/authorization-manager");
var authorizationUnroller = require("../../../lib/xs/authorization/authorization-unroller");
	
xdescribe('authorization-unroller-tests', function() {
	
	var oMockstar = null;
	var sCurrentUser = $.session.getUsername();
	
	/*--------------------------------------------------------------------------------------------------------
	// Note: For hierarchy views there is currently no way for creation other than SQL DDL statements. 
	// That way the views can only be read by the creator. We create them by templates with the db-generator 
	// that is called in init-plc (i.e., with the technical user). We later call them from the service 
	// (again, with the technical user).
	// For the tests (including the tests at gated check-in), the test-user needs to create the views
	// in order to be able to call them. We therefore call the template strings and attach some 
	// prefix (_TESTCOPY)      
	//--------------------------------------------------------------------------------------------------------
	*/
	
	var artefacts = [
		"V_GROUP_HIERARCHY",
		"ts_privilege_object_filter",
		"p_unroll_privileges",
		"p_unroll_privileges_on_object_update",
		"p_unroll_privileges_on_group_update"
	];
	
	var copyPostfix = "_TESTCOPY_for_" + sCurrentUser;
	
	var artefactsMetadata = {};
	
	function prepateArtefactsMetadata()
	{
		var dbArtefactControllerLibrary = require("../../../lib/xs/db/generation/hdi-db-artefact-controller");
		
		for (let i = 0; i < artefacts.length; i++)
		{
			var artefact = artefacts[i];
			
			artefactsMetadata[artefact] = {};
			
			//load template
			artefactsMetadata[artefact].packageName = dbArtefactControllerLibrary.mDbArtefactsMetadata[artefact].packageName;
			artefactsMetadata[artefact].templateName = dbArtefactControllerLibrary.mDbArtefactsMetadata[artefact].templateName;
			artefactsMetadata[artefact].name = dbArtefactControllerLibrary.mDbArtefactsMetadata[artefact].name;
			
			artefactsMetadata[artefact].template = $.import(
					artefactsMetadata[artefact].packageName,
					artefactsMetadata[artefact].templateName
			).template;
						
			//add test postfix to artefact
			for (let j = 0; j < artefacts.length; j++)
			{
				artefactsMetadata[artefact].template = artefactsMetadata[artefact].template.replace(artefacts[j] + "\"", artefacts[j] + copyPostfix + "\"");	
			}
			
			//copy SQL type
			switch (dbArtefactControllerLibrary.mDbArtefactsMetadata[artefact].type)
			{
			case "Structure":
				artefactsMetadata[artefact].sqlType = "TYPE";
				break;
			case "SQLScript":
				artefactsMetadata[artefact].sqlType = "PROCEDURE";
				break;
			case "SQLView":
				artefactsMetadata[artefact].sqlType = "VIEW";
				break;
			default:
				;
			}
		}
	}
	
	prepateArtefactsMetadata();
	
	var originalAuthorizationUnrollerViews = authorizationUnroller.Views;
	var originalAuthorizationUnrollerProcedures = authorizationUnroller.Procedures;
	
	function prepareCopiesOfArtefacts()
	{
		cleanUpCopiesOfArtefacts();
		
		var copyAuthorizationUnrollerViews = {};
		var viewNames = Object.keys(originalAuthorizationUnrollerViews);
		for (let i = 0; i < viewNames.length; i++)
		{
			copyAuthorizationUnrollerViews[viewNames[i]] = originalAuthorizationUnrollerViews[viewNames[i]] + copyPostfix;
		}
		authorizationUnroller.Views = Object.freeze(copyAuthorizationUnrollerViews);	
		
		var copyAuthorizationUnrollerProcedures = {};
		var procedureNames = Object.keys(originalAuthorizationUnrollerProcedures);
		for (let i = 0; i < procedureNames.length; i++)
		{
			copyAuthorizationUnrollerProcedures[procedureNames[i]] = originalAuthorizationUnrollerProcedures[procedureNames[i]] + copyPostfix;
		}
		authorizationUnroller.Procedures = Object.freeze(copyAuthorizationUnrollerProcedures);

		for (let i = 0; i < artefacts.length; i++)
		{
		    var createStmt = artefactsMetadata[artefacts[i]].template;
			jasmine.dbConnection.executeUpdate(createStmt);	
		}
	}
	
	function cleanUpCopiesOfArtefacts()
	{
		for (let i = 0; i < artefacts.length; i++)
		{
			try 
			{
                var dropStmt = `DROP ${artefactsMetadata[artefacts[i]].sqlType} "${artefactsMetadata[artefacts[i]].name}${copyPostfix}"`;
				jasmine.dbConnection.executeUpdate(dropStmt);				
			} catch (e) 
			{
			    let i = 1;
			}
		}
		
		authorizationUnroller.Views = originalAuthorizationUnrollerViews;
		authorizationUnroller.Procedures = originalAuthorizationUnrollerProcedures;
	}

	beforeOnce(function() {

		prepareCopiesOfArtefacts();		

		oMockstar = new MockstarFacade(   // Initialize Mockstar
		{
			substituteTables:             // substitute all used tables in the procedure or view
			{
				Auth_Project : {
					name: 'sap.plc.db::auth.t_auth_project'
				},
				Auth_User : {
					name: 'sap.plc.db::auth.t_auth_user'
				},
				Auth_Usergroup : {
					name: 'sap.plc.db::auth.t_auth_usergroup'
				},
				Usergroup : {
					name: 'sap.plc.db::auth.t_usergroup'
				},
				Usergroup_User : {
					name: 'sap.plc.db::auth.t_usergroup_user'
				},
				Usergroup_Usergroup : {
					name: 'sap.plc.db::auth.t_usergroup_usergroup'
				}
			},
			csvPackage : testData.sCsvPackage				
		});
	});
	
	afterOnce(function(){				
		oMockstar.cleanup();
		cleanUpCopiesOfArtefacts();
	});

	beforeEach(function() {
		oMockstar.clearAllTables(); // clear all specified substitute tables and views
		oMockstar.initializeData();
	});

	function addGroup(aGroupId) {
		oMockstar.insertTableData("Usergroup",{
			USERGROUP_ID : aGroupId,
			DESCRIPTION  : [""]
		});
	}
	
	function removeGroup(sGroupId) {
		
		jasmine.dbConnection.executeUpdate("delete from \"sap.plc.db::auth.t_usergroup\" where USERGROUP_ID='" + sGroupId + "'");
		jasmine.dbConnection.executeUpdate("delete from \"sap.plc.db::auth.t_usergroup_usergroup\" where PARENT_USERGROUP_ID='" + sGroupId + "'");
		jasmine.dbConnection.executeUpdate("delete from \"sap.plc.db::auth.t_usergroup_user\" where USERGROUP_ID='" + sGroupId + "'");
		jasmine.dbConnection.executeUpdate("delete from \"sap.plc.db::auth.t_auth_usergroup\" where USERGROUP_ID='" + sGroupId + "'");
	}
	
	function addUserToGroup(aUserId, aGroupId) {
		oMockstar.insertTableData("Usergroup_User",{
			USERGROUP_ID : aGroupId,
			USER_ID      : aUserId
		});
	}
	
	function removeUserFromGroup(aUserId, sGroupId) {
		
		jasmine.dbConnection.executeUpdate("delete from \"sap.plc.db::auth.t_usergroup_user\" where USERGROUP_ID='" + sGroupId + "' and USER_ID='" + aUserId + "'");
	}
	
	function addGroupToGroup(aChildGroupId, aParentGroupId) {
		oMockstar.insertTableData("Usergroup_Usergroup",{
			CHILD_USERGROUP_ID   : aChildGroupId,
			PARENT_USERGROUP_ID  : aParentGroupId
		});
	}

	function removeGroupFromGroup(sChildGroupId, sParentGroupId) {
		
		jasmine.dbConnection.executeUpdate("delete from \"sap.plc.db::auth.t_usergroup_usergroup\" where CHILD_USERGROUP_ID='" + sChildGroupId + "' and PARENT_USERGROUP_ID='" + sParentGroupId + "'");
	}

	function addUserPrivilege(aObjectType, aObjectId, aUserId, aPrivilege) {
		oMockstar.insertTableData("Auth_User",{
			OBJECT_TYPE	: aObjectType,
			OBJECT_ID    : aObjectId,
			USER_ID      : aUserId,
			PRIVILEGE    : aPrivilege
		});
	}
	
	function removeUserPrivilege(sObjectType, sObjectId, sUserId, sPrivilege) {

		jasmine.dbConnection.executeUpdate("delete from \"sap.plc.db::auth.t_auth_user\" where OBJECT_TYPE='" + sObjectType + "' and OBJECT_ID='" + sObjectId + "' and USER_ID='" + sUserId + "' and PRIVILEGE='" + sPrivilege + "'");
	}
	
	function addGroupPrivilege(aObjectType, aObjectId, aGroupId, aPrivilege) {
		oMockstar.insertTableData("Auth_Usergroup",{
			OBJECT_TYPE	: aObjectType,
			OBJECT_ID    : aObjectId,
			USERGROUP_ID : aGroupId,
			PRIVILEGE    : aPrivilege
		});
	}
	
	function removeGroupPrivilege(sObjectType, sObjectId, sGroupId, sPrivilege) {
		
		jasmine.dbConnection.executeUpdate("delete from \"sap.plc.db::auth.t_auth_usergroup\" where OBJECT_TYPE='" + sObjectType + "' and OBJECT_ID='" + sObjectId + "' and USERGROUP_ID='" + sGroupId + "' and PRIVILEGE='" + sPrivilege + "'");
	}

    
	function prepareGroupSettingOneSingleParentGraphAsListUnorderedPrivileges(sBusinessObjectType, sBusinessObjectId) {
		
		addGroup(["G1", "G2", "G3"]);
		
		addGroupToGroup(
				["G3", "G2"],
				["G2", "G1"]
				);
		
		addGroupPrivilege(
				[sBusinessObjectType, sBusinessObjectType, sBusinessObjectType],
				[sBusinessObjectId, sBusinessObjectId, sBusinessObjectId],
				["G1", "G2", "G3"],
				[authorizationManager.Privileges.CREATE_EDIT, authorizationManager.Privileges.ADMINISTRATE, authorizationManager.Privileges.READ]
				);
		
		addUserToGroup([sCurrentUser], ["G3"]);
	}
	
	function prepareGroupSettingOneSingleParentGraphAsListOrderedPrivileges(sBusinessObjectType, sBusinessObjectId) {
		
		addGroup(["G1", "G2", "G3"]);
		
		addGroupToGroup(
				["G3", "G2"], 
				["G2", "G1"]
				);
		
		addGroupPrivilege(
				[sBusinessObjectType, sBusinessObjectType, sBusinessObjectType],
				[sBusinessObjectId, sBusinessObjectId, sBusinessObjectId],
				["G1", "G2", "G3"],
				[authorizationManager.Privileges.ADMINISTRATE, authorizationManager.Privileges.CREATE_EDIT, authorizationManager.Privileges.READ]
				);
		
		addUserToGroup([sCurrentUser], ["G3"]);
	}

	function prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId) {
		
		addGroup(["G1", "G2", "G3", "G4", "G5"]);
		
		addGroupToGroup(
				["G3", "G4", "G2", "G5"], 
				["G2", "G2", "G1", "G1"]
				);
		
		addGroupPrivilege(
				[sBusinessObjectType, sBusinessObjectType, sBusinessObjectType],
				[sBusinessObjectId, sBusinessObjectId, sBusinessObjectId],
				["G1", "G2", "G3"],
				[authorizationManager.Privileges.ADMINISTRATE, authorizationManager.Privileges.CREATE_EDIT, authorizationManager.Privileges.READ]
				);
		
		addUserToGroup([sCurrentUser], ["G4"]);
	}

	function prepareGroupSettingTwoSingleParentGraphs(sBusinessObjectType, sBusinessObjectId) {
		
		addGroup(["G1L", "G2L", "G3L", "G4L", "G5L", "G1R", "G2R", "G3R", "G4R", "G5R"]);
			
		addGroupToGroup(
				["G3L", "G4L", "G2L", "G5L", "G3R", "G4R", "G2R", "G5R"], 
				["G2L", "G2L", "G1L", "G1L", "G2R", "G2R", "G1R", "G1R"]
				);
		
		addGroupPrivilege(
				[sBusinessObjectType, sBusinessObjectType, sBusinessObjectType],
				[sBusinessObjectId, sBusinessObjectId, sBusinessObjectId],
				["G1L", "G2L", "G3L"],
				[authorizationManager.Privileges.ADMINISTRATE, authorizationManager.Privileges.CREATE_EDIT, authorizationManager.Privileges.READ]
				);
		
		addUserToGroup([sCurrentUser], ["G4L"]);
	}

	function prepareGroupSettingOneSingleParentGraphOneSeparateGroup(sBusinessObjectType, sBusinessObjectId) {
		
		addGroup(["G1", "G2", "G3", "G4", "G5", "G6"]);
		
		addGroupToGroup(
				["G3", "G4", "G2", "G5"], 
				["G2", "G2", "G1", "G1"]
				);
		
		addGroupPrivilege(
				[sBusinessObjectType, sBusinessObjectType, sBusinessObjectType, sBusinessObjectType],
				[sBusinessObjectId, sBusinessObjectId, sBusinessObjectId, sBusinessObjectId],
				["G1", "G2", "G3", "G6"],
				[authorizationManager.Privileges.ADMINISTRATE, authorizationManager.Privileges.CREATE_EDIT, authorizationManager.Privileges.READ, authorizationManager.Privileges.ADMINISTRATE]
				);
		
		addUserToGroup([sCurrentUser], ["G6"]);
	}

	function prepareGroupSettingOneMultiParentGraph(sBusinessObjectType, sBusinessObjectId) {

		addGroup(["G1L", "G1R", "G2", "G3"]);
			
		addGroupToGroup(
				["G2", "G2", "G3"], 
				["G1L", "G1R", "G2"]
				);
		
		addGroupPrivilege(
				[sBusinessObjectType, sBusinessObjectType, sBusinessObjectType],
				[sBusinessObjectId, sBusinessObjectId, sBusinessObjectId],
				["G1L", "G1R", "G3"],
				[authorizationManager.Privileges.CREATE_EDIT, authorizationManager.Privileges.ADMINISTRATE, authorizationManager.Privileges.READ]
				);
				
		addUserToGroup([sCurrentUser], ["G3"]);
	}

	xdescribe("unrollPrivilege", function() {
	    
		it("should throw exception unrolling privilege for unsupported business object type", function(){
		
			//arrange	
			var sBusinessObjectType = "unsupportedBusinessObjectType";
			var sBusinessObjectId = "P1";
			
			//act
			var e;
			try
			{
			    var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			} catch(exception) 
			{
			    e = exception;
			}
			
			//assert	    	
			expect(e).toBeDefined();
			expect(e instanceof PlcException).toBeTruthy();
			expect(PlcMessage.fromPlcException(e).code).toEqual(Code.GENERAL_UNEXPECTED_EXCEPTION.code);
		
		});
		
		it("should return with error when unrolling privilege for cyclic graph", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			addGroup(["G1", "G2", "G3"]);
			
			addGroupToGroup(
					["G3", "G2", "G1"], 
					["G2", "G1", "G3"]
					);
			
			//act
			var bContainsCycle = authorizationUnroller.containsCycle(jasmine.dbConnection); 
		    var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			expect(bContainsCycle).toBeTruthy();
			expect(withErrors).toBeTruthy();
		});
		

		it("should unroll privilege to user via user privilege (no groups)", function(){
		
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			addUserPrivilege(sBusinessObjectType, sBusinessObjectId, sCurrentUser, authorizationManager.Privileges.READ);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.READ);
		
		});
		
		it("should unroll privilege to user via group privilege (empty groups)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			addUserPrivilege(sBusinessObjectType, sBusinessObjectId, sCurrentUser, authorizationManager.Privileges.READ);
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			oMockstar.clearTable("Usergroup_User");
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.READ);
		
		});

		it("should unroll privilege to user via group privilege", function(){
		
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			addGroup(["G1"]);
			
			addUserToGroup([sCurrentUser], ["G1"]);
			
			addGroupPrivilege([sBusinessObjectType], [sBusinessObjectId], ["G1"], [authorizationManager.Privileges.READ]);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.READ);
		
		});
		
		it("should unroll privilege to user via user privilege over-ruling group privilege", function(){
		
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			addUserPrivilege(sBusinessObjectType, sBusinessObjectId, sCurrentUser, authorizationManager.Privileges.CREATE_EDIT);
			
			addGroup(["G1"]);
			
			addUserToGroup([sCurrentUser], ["G1"]);
			
			addGroupPrivilege([sBusinessObjectType], [sBusinessObjectId], ["G1"], [authorizationManager.Privileges.READ]);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.CREATE_EDIT);
		
		});
		
		it("should unroll privilege to user via group privilege over-ruling user privilege", function(){
		
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			addUserPrivilege(sBusinessObjectType, sBusinessObjectId, sCurrentUser, authorizationManager.Privileges.READ);
			
			addGroup(["G1"]);
			
			addUserToGroup([sCurrentUser], ["G1"]);
			
			addGroupPrivilege([sBusinessObjectType], [sBusinessObjectId], ["G1"], [authorizationManager.Privileges.CREATE_EDIT]);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.CREATE_EDIT);
		
		});

		it("should unroll privilege to user via group privilege (one single-parent graph as list with unordered privileges)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraphAsListUnorderedPrivileges(sBusinessObjectType, sBusinessObjectId);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via group privilege (one single-parent graph as list with ordered privileges)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraphAsListOrderedPrivileges(sBusinessObjectType, sBusinessObjectId);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via group privilege (one single-parent graph, one user in one group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via group privilege (one single-parent graph, user not in group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			removeUserFromGroup(sCurrentUser, "G4");
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual("");
		
		});
		
		it("should unroll privilege to user via group privilege (one single-parent graph, multiple users in one group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			addUserToGroup(['Alice', 'Bob', 'Charlie'], ["G3", "G3", "G3"]);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via group privilege (one single-parent graph, multiple users in multiple group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			addUserToGroup(['Alice', 'Bob', 'Charlie'], ["G1", "G2", "G3"]);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via group privilege (two single-parent graphs)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingTwoSingleParentGraphs(sBusinessObjectType, sBusinessObjectId);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via group privilege (one single-parent graph one separate group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraphOneSeparateGroup(sBusinessObjectType, sBusinessObjectId);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via group privilege (one multi-parent graph)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneMultiParentGraph(sBusinessObjectType, sBusinessObjectId);
			
			//act
			var withErrors = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert	    	
			var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			expect(withErrors).toBeFalsy();
			expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via user privilege on user privileges update (add user privilege)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			addGroup(["G1"]);
			
			addUserToGroup([sCurrentUser], ["G1"]);
			
			addGroupPrivilege([sBusinessObjectType], [sBusinessObjectId], ["G1"], [authorizationManager.Privileges.READ]);
			
			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			addUserPrivilege(sBusinessObjectType, sBusinessObjectId, sCurrentUser, authorizationManager.Privileges.CREATE_EDIT);
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual(authorizationManager.Privileges.READ);

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual(authorizationManager.Privileges.CREATE_EDIT);
		
		});
		
		it("should unroll privilege to user via user privilege on user privileges update (remove user privilege)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			addUserPrivilege(sBusinessObjectType, sBusinessObjectId, sCurrentUser, authorizationManager.Privileges.CREATE_EDIT);
			
			addGroup(["G1"]);
			
			addUserToGroup([sCurrentUser], ["G1"]);
			
			addGroupPrivilege([sBusinessObjectType], [sBusinessObjectId], ["G1"], [authorizationManager.Privileges.READ]);
			
			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			removeUserPrivilege([sBusinessObjectType], [sBusinessObjectId], [sCurrentUser], [authorizationManager.Privileges.CREATE_EDIT]);
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual(authorizationManager.Privileges.CREATE_EDIT);

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual(authorizationManager.Privileges.READ);
		
		});
		
		it("should unroll privilege to user via group privilege on group update (add user to group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			removeUserFromGroup(sCurrentUser, "G4");
			
			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			addUserToGroup([sCurrentUser], ["G4"]);
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivilegesOnGroupUpdate(jasmine.dbConnection, "G4");
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual("");

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});

		it("should unroll privilege to user via group privilege on group update (remove user from group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			removeUserFromGroup(sCurrentUser, "G4");
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivilegesOnGroupUpdate(jasmine.dbConnection, "G4");
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual(authorizationManager.Privileges.ADMINISTRATE);

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual("");
		
		});
		
		it("should unroll privilege to user via group privilege on group update (add sub-group to group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			removeGroupFromGroup("G4", "G2");
			
			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			addGroupToGroup("G4", "G2")
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivilegesOnGroupUpdate(jasmine.dbConnection, "G4");
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual("");

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
	    
		it("should unroll privilege to user via group privilege on group update (remove sub-group from group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			
			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			removeGroupFromGroup("G4", "G2");
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivilegesOnGroupUpdate(jasmine.dbConnection, "G2");
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual(authorizationManager.Privileges.ADMINISTRATE);

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual("");

		});
		
		
		it("should unroll privilege to user via group privilege on group update (remove group)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			
			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);

			var objectsFromGroupPrivileges = authorizationUnroller.getObjectsFromGroupPrivileges(jasmine.dbConnection, "G1");
			removeGroup("G1");
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivileges(jasmine.dbConnection, objectsFromGroupPrivileges.aObjects).withErrors;
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual(authorizationManager.Privileges.ADMINISTRATE);

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual(authorizationManager.Privileges.CREATE_EDIT);
		
		});

		it("should unroll privilege to user via group privilege on group privileges update (add group privilege)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);
			removeGroupPrivilege(sBusinessObjectType, sBusinessObjectId, "G1", authorizationManager.Privileges.ADMINISTRATE);
			
			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			addGroupPrivilege([sBusinessObjectType], [sBusinessObjectId], ["G1"], [authorizationManager.Privileges.ADMINISTRATE]);
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual(authorizationManager.Privileges.CREATE_EDIT);

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual(authorizationManager.Privileges.ADMINISTRATE);
		
		});
		
		it("should unroll privilege to user via group privilege on group privileges update (remove group privilege)", function(){
			
			//arrange	
			var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
			var sBusinessObjectId = "P1";
			
			prepareGroupSettingOneSingleParentGraph(sBusinessObjectType, sBusinessObjectId);

			var withErrors1 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			var result1 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			removeGroupPrivilege(sBusinessObjectType, sBusinessObjectId, "G1", authorizationManager.Privileges.ADMINISTRATE);
			
			//act
			var withErrors2 = authorizationUnroller.unrollPrivilegesOnObjectUpdate(jasmine.dbConnection, sBusinessObjectType, sBusinessObjectId);
			
			//assert
			var result2 = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, jasmine.dbConnection, sCurrentUser, false);
			
			expect(withErrors1).toBeFalsy();
			expect(result1).toEqual(authorizationManager.Privileges.ADMINISTRATE);

			expect(withErrors2).toBeFalsy();
			expect(result2).toEqual(authorizationManager.Privileges.CREATE_EDIT);
		
		});
	    
	});
	
	
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);