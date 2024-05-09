// this unit test must config sqlcc step, for detail, please see post-install tool user manual.
var dataMigration = $.import('xs.postinstall.release_4_0_0', 'upgrade_data_migration');
const XSCSchema = "SAP_PLC";
const insertCommonTable = "sap.plc.db::basis.t_confidence_level__text";
const insertCommonRow = ["'-1'","'CN'","'test'"];
const insertMetaDataTable = "sap.plc.db::basis.t_metadata";
const insertMetaDataRow = ["'ProjectTest'","'ProjectTest'","'PROJECTTEST_ID'","'0'","'0'","'401'","'1'","NULL","NULL","NULL","NULL","NULL","NULL","'String'","'length=35; uppercase=1'","'MASTERDATA'","'3'","'1'","NULL","NULL","NULL","NULL","'XFLD_Project_ProjectId'","'XTOL_Project_ProjectId'","NULL","NULL","NULL","NULL"];
const insertTempTable = "sap.plc.db.administration::maintemporarytables.gtt_batch_account";
const insertTempRow = ["'-1'","'-1'","NULL","NULL","NULL","NULL","NULL","NULL","NULL","NULL"];
var sysConnection = null;

function joinResult(oResultRow) {
    var result = ``;
    var keys = Object.keys(oResultRow);
    for (var index in keys) {
        if (oResultRow[keys[index]] === null) {
            result += "NULL,";
        } else {
            result += `'${oResultRow[keys[index]]}',`;
        }
    } 
    return result.slice(0, -1);
}

function cleanEnvironment(oConnection) {
    oConnection.executeUpdate(`DELETE FROM "${insertCommonTable}" WHERE CONFIDENCE_LEVEL_ID = ${insertCommonRow[0]}`);
    oConnection.executeUpdate(`DELETE FROM "${XSCSchema}"."${insertCommonTable}" WHERE CONFIDENCE_LEVEL_ID = ${insertCommonRow[0]}`); 
    oConnection.executeUpdate(`DELETE FROM "${insertMetaDataTable}" 
        WHERE PATH = ${insertMetaDataRow[0]} 
        AND BUSINESS_OBJECT = ${insertMetaDataRow[1]} 
        AND COLUMN_ID = ${insertMetaDataRow[2]} 
    `);
    oConnection.executeUpdate(`DELETE FROM "${XSCSchema}"."${insertMetaDataTable}" 
        WHERE PATH = ${insertMetaDataRow[0]} 
        AND BUSINESS_OBJECT = ${insertMetaDataRow[1]} 
        AND COLUMN_ID = ${insertMetaDataRow[2]}
    `);
    oConnection.executeUpdate(`DELETE FROM "${insertTempTable}" WHERE ACCOUNT_ID = ${insertTempRow[0]}`);
    oConnection.executeUpdate(`DELETE FROM "${XSCSchema}"."${insertTempTable}" WHERE ACCOUNT_ID = ${insertTempRow[0]}`); 
}

xdescribe('upgrade_data_migration-tests', function() {
    
    beforeAll(function() {
        dataMigration.check(jasmine.dbConnection);
        sysConnection = dataMigration.getCurrentConnection();
        cleanEnvironment(sysConnection);
    });

    afterAll(function() {
        cleanEnvironment(sysConnection);
        dataMigration.clean(jasmine.dbConnection);
    });

    xit('test custrom field consistent', function(){
        //TODO: test whether table structures are consistent in XSA and XSC after custom fields generation
        expect(true).toEqual(true);
    });

    xit('test metadata table consistent', function(){
        //TODO: test t_metadata table consistent in XSC and XSA
        expect(true).toEqual(true);
    });
    
    // migrate common table
    xit('migrate "sap.plc.db::basis.t_confidence_level__text" table data from xsc to xsa', function(){
        sysConnection.executeUpdate(`INSERT INTO "${XSCSchema}"."${insertCommonTable}" VALUES (${insertCommonRow.join(",")});`);
        sysConnection.executeUpdate(`INSERT INTO "${insertCommonTable}" SELECT * FROM "${XSCSchema}"."${insertCommonTable}" WHERE CONFIDENCE_LEVEL_ID = ${insertCommonRow[0]}`);
        var result = sysConnection.executeQuery(`SELECT * FROM "${insertCommonTable}" WHERE CONFIDENCE_LEVEL_ID = ${insertCommonRow[0]}`);
        expect(joinResult(result[0])).toEqual(insertCommonRow.join(",")); // no columns should be found
    });
    
    // migrate metadata table
    xit('migrate "sap.plc.db::basis.t_metadata" table data from xsc to xsa', function(){
        sysConnection.executeUpdate(`INSERT INTO "${XSCSchema}"."${insertMetaDataTable}" VALUES (${insertMetaDataRow.join(",")});`);
        sysConnection.executeUpdate(`
            INSERT INTO "${insertMetaDataTable}" SELECT * FROM "${XSCSchema}"."${insertMetaDataTable}" 
            WHERE PATH = ${insertMetaDataRow[0]} 
            AND BUSINESS_OBJECT = ${insertMetaDataRow[1]} 
            AND COLUMN_ID = ${insertMetaDataRow[2]}
        `);
        var result = sysConnection.executeQuery(`SELECT * FROM "${insertMetaDataTable}" 
            WHERE PATH = ${insertMetaDataRow[0]} 
            AND BUSINESS_OBJECT = ${insertMetaDataRow[1]} 
            AND COLUMN_ID = ${insertMetaDataRow[2]}
        `);
        expect(joinResult(result[0])).toEqual(insertMetaDataRow.join(","));
    });

    //migrate temporary table
    xit('migrate "sap.plc.db.administration::maintemporarytables.gtt_batch_account" table data from xsc to xsa', function(){
        sysConnection.executeUpdate(`INSERT INTO "${XSCSchema}"."${insertTempTable}" VALUES (${insertTempRow.join(",")});`);
        sysConnection.executeUpdate(`INSERT INTO "${insertTempTable}" SELECT * FROM "${XSCSchema}"."${insertTempTable}" WHERE ACCOUNT_ID = ${insertTempRow[0]}`);
        var result = sysConnection.executeQuery(`SELECT * FROM "${insertTempTable}" WHERE ACCOUNT_ID = ${insertTempRow[0]}`);
        expect(joinResult(result[0])).toEqual(insertTempRow.join(","));
    });

}).addTags(["All_Unit_Tests"]);