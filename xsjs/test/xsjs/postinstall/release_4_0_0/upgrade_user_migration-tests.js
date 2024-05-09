// this unit test must config sqlcc step, for detail, please see post-install tool user manual.
var userMigration = $.import("xs.postinstall.release_4_0_0", "getXSCPLCUsers");
//TODO
//This import fails in Jenkins but works locally
//var sysConnection = $.hdb.getConnection({"sqlcc": "xsjs.sqlcc_config", "pool": true });
//sysConnection.setAutoCommit(true);

function getPLCUserResults(users) {
    var results = {
        "userExist" : false,
        "xscRoles"  : [],
        "xsaRoles"  : []
    }
    users.map(function (item){
        if (item.user === "MIGRATION_TEST_USER") {
            results.userExist = true;
            results.xscRoles = item.xscRoles.sort();
            results.xsaRoles = item.xsaRoleTemplates.sort();
        }
    });
    return results;
}

//TODO
//Tests are disabled because they require XS Classic roles which are not available on the Jenkins server that is used for check-in.
xdescribe('upgrade_user_migration-tests', function() {
    
    beforeEach(function() {
        sysConnection.executeUpdate(`CREATE USER MIGRATION_TEST_USER PASSWORD Sap12345`);
    });

    afterEach(function() {
        sysConnection.executeUpdate(`DROP USER MIGRATION_TEST_USER`);
    });

    afterAll(function() {
        sysConnection.executeUpdate(`DROP ROLE "sap.plc.test::user_migration"`);
        sysConnection.close();
    });

    it('test extra XSC users with PLC privileges', function(){
        //TODO: test XSC users who don't include PLC roles but include PLC application privileges will be added in
        expect(true).toEqual(true);
    });

    it('test XSC users with effectived PLC roles', function(){
        sysConnection.executeUpdate(`CALL "_SYS_REPO"."GRANT_ACTIVATED_ROLE"('sap.plc.authorizations::Base_Viewer', 'MIGRATION_TEST_USER')`);
        sysConnection.executeUpdate(`CALL "_SYS_REPO"."GRANT_ACTIVATED_ROLE"('sap.plc.authorizations::Custom_Fields_Formula_Administrator', 'MIGRATION_TEST_USER')`);
        var users = userMigration.getXSCUsers();
        var results = getPLCUserResults(users);
        expect(results.userExist).toEqual(true);
        expect(results.xscRoles).toEqual(["sap.plc.authorizations::Base_Viewer", "sap.plc.authorizations::Custom_Fields_Formula_Administrator"]);
        expect(results.xsaRoles).toEqual(["BaseViewer_RT", "CFFAdministrator_RT"]);
    });

    it('test XSC users with deprecated PLC roles', function(){
        sysConnection.executeUpdate(`CALL "_SYS_REPO"."GRANT_ACTIVATED_ROLE"('sap.plc.authorizations::replication_power_user', 'MIGRATION_TEST_USER')`);
        sysConnection.executeUpdate(`CALL "_SYS_REPO"."GRANT_ACTIVATED_ROLE"('sap.plc.authorizations::Base_Viewer', 'MIGRATION_TEST_USER')`);
        var users = userMigration.getXSCUsers();
        var results = getPLCUserResults(users);
        expect(results.userExist).toEqual(true);
        expect(results.xscRoles).toEqual(["sap.plc.authorizations::Base_Viewer"]);
        expect(results.xsaRoles).toEqual(["BaseViewer_RT"]);
    });

    it('test custom XSC users PLC roles', function(){
        sysConnection.executeUpdate(`CREATE ROLE "sap.plc.test::user_migration"`);
        sysConnection.executeUpdate(`GRANT "sap.plc.test::user_migration" TO "MIGRATION_TEST_USER"`);
        var users = userMigration.getXSCUsers();
        var results = getPLCUserResults(users);
        expect(results.userExist).toEqual(true);
        expect(results.xscRoles).toEqual(["sap.plc.test::user_migration"]);
        expect(results.xsaRoles).toEqual(["-1"]);
    });
    

}).addTags(["All_Unit_Tests"]);