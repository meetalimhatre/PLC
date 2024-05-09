var persistencyProject = $.import("xs.db", "persistency-project");

describe('02_grant_instance_based_privileges-2_1_0-postinstalltests', function() {
  
  if (jasmine.plcTestRunParameters.mode === 'prepare') {
      
    beforeOnce(function() {	
		jasmine.dbConnection.executeUpdate(`delete from "${persistencyProject.Tables.project}" 
		                                        where project_id = 'UpgradeP1' or
		                                        project_id = 'UpgradeP2'`);
		jasmine.dbConnection.commit();
	});
      
    it ("creates two projects to check instance based privileges after upgrade", function() {
        var oProjects = 
            {
              "PROJECT_ID": ["UpgradeP1","UpgradeP2"],
              "PROJECT_NAME": ["UpgradeP1","UpgradeP2"],
              "CONTROLLING_AREA_ID": ["CA1","CA2"],
              "COMPANY_CODE_ID": ["CC1","CC2"],
              "PLANT_ID": ["P1","P2"],
              "REPORT_CURRENCY_ID": ["EUR","EUR"],
              "CREATED_ON" :[new Date().toJSON(),new Date().toJSON()],
              "CREATED_BY" :["AdminP1","AdminP2"],
              "LAST_MODIFIED_ON" :[new Date().toJSON(),new Date().toJSON()],
              "LAST_MODIFIED_BY" :["UserP1", "UserP2"]
            };
    
        var result = jasmine.dbConnection.executeUpdate(`
            insert into "${persistencyProject.Tables.project}" 
            ("PROJECT_ID","PROJECT_NAME","CONTROLLING_AREA_ID","COMPANY_CODE_ID","PLANT_ID","REPORT_CURRENCY_ID","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY")
            values 
            (
                '${oProjects.PROJECT_ID[0]}',
                '${oProjects.PROJECT_NAME[0]}',
                '${oProjects.CONTROLLING_AREA_ID[0]}',
                '${oProjects.COMPANY_CODE_ID[0]}',
                '${oProjects.PLANT_ID[0]}',
                '${oProjects.REPORT_CURRENCY_ID[0]}',
                '${oProjects.CREATED_ON[0]}',
                '${oProjects.CREATED_BY[0]}',
                '${oProjects.LAST_MODIFIED_ON[0]}',
                '${oProjects.LAST_MODIFIED_BY[0]}'
            )
        `);
    
        var result = jasmine.dbConnection.executeUpdate(`
            insert into "${persistencyProject.Tables.project}" 
            ("PROJECT_ID","PROJECT_NAME","CONTROLLING_AREA_ID","COMPANY_CODE_ID","PLANT_ID","REPORT_CURRENCY_ID","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY")
            values 
            (
                '${oProjects.PROJECT_ID[1]}',
                '${oProjects.PROJECT_NAME[1]}',
                '${oProjects.CONTROLLING_AREA_ID[1]}',
                '${oProjects.COMPANY_CODE_ID[1]}',
                '${oProjects.PLANT_ID[1]}',
                '${oProjects.REPORT_CURRENCY_ID[1]}',
                '${oProjects.CREATED_ON[1]}',
                '${oProjects.CREATED_BY[1]}',
                '${oProjects.LAST_MODIFIED_ON[1]}',
                '${oProjects.LAST_MODIFIED_BY[1]}'
            )
        `);
        jasmine.dbConnection.commit();
    });
  }

  if (jasmine.plcTestRunParameters.mode === 'assert') {
    
    var mockstar_helpers = require("../../../testtools/mockstar_helpers");
    var authorizationManager = require("../../../../lib/xs/authorization/authorization-manager");
    
    it ("checks if a group for all PLC users is created and assigned to all projects", function() {
        //arrange
        var oGroups = jasmine.dbConnection.executeQuery(`
            select groups.USERGROUP_ID, authgroups.OBJECT_TYPE, authgroups.OBJECT_ID, authgroups.PRIVILEGE 
            from "sap.plc.db::auth.t_usergroup" as groups
            left outer join 
            "sap.plc.db::auth.t_auth_usergroup" as authgroups
            on groups.USERGROUP_ID = authgroups.USERGROUP_ID
            where authgroups.object_type = 'PROJECT' and (authgroups.object_id = 'UpgradeP1' or authgroups.object_id = 'UpgradeP2')
            
        `);
        oGroups = mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(oGroups);
		
		// assert
		//a group named ALL_USERS_OF_PLC_VERSION_2_0 should exist.
		expect(oGroups[0][0]).toBe('ALL_USERS_OF_PLC_VERSION_2_0');
		expect(oGroups[0][1]).toBe('ALL_USERS_OF_PLC_VERSION_2_0');
		//the group should have privileges for both Test-Projects
		expect(oGroups[0].length).toBe(2);
		//the privilege level must be "ADMINISTRATE"
		expect(oGroups[3][0]).toBe(authorizationManager.Privileges.ADMINISTRATE);
		expect(oGroups[3][1]).toBe(authorizationManager.Privileges.ADMINISTRATE);
		
    });
    
    it("checks that the creator of existing projects has the ADMINISTRATE privilege assigned directly", function(){
        //arrange
        var oPrivilegeProject1 = jasmine.dbConnection.executeQuery(`
            select user_id, privilege from "sap.plc.db::auth.t_auth_user"
            where object_type = 'PROJECT' and object_id = 'UpgradeP1';
        `);
        var oPrivilegeProject2 = jasmine.dbConnection.executeQuery(`
            select user_id, privilege from "sap.plc.db::auth.t_auth_user"
            where object_type = 'PROJECT' and object_id = 'UpgradeP2';
        `);
        
        //assert
        expect(oPrivilegeProject1[0].USER_ID).toBe("AdminP1");
        expect(oPrivilegeProject2[0].USER_ID).toBe("AdminP2");
        
        expect(oPrivilegeProject1[0].PRIVILEGE).toBe(authorizationManager.Privileges.ADMINISTRATE);
        expect(oPrivilegeProject2[0].PRIVILEGE).toBe(authorizationManager.Privileges.ADMINISTRATE);
    });
  }
});