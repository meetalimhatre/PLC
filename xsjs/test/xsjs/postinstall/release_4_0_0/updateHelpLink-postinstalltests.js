const sFrontendSettingTable = "sap.plc.db::basis.t_frontend_settings";
const XSCPlcSchema = "SAP_PLC";
let oConnection = null;

describe("Update the sap provided help link", () => {
    const sSettingType = "APPLICATIONHELP";
    const sSettingName = "SapProvidedHelpLink";
    const sOldProvidedHelpLink = "http://help.sap.com/plc300";
    const sProvidedHelpLink = "http://help.sap.com/plc_ce";
    
    const aFrontendSettingsData = [
        [10000, sSettingName, sSettingType, sOldProvidedHelpLink, null],
    ];

    const sCurrentSchema = jasmine.dbConnection.executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;

    function clearTable(){
        oConnection.executeUpdate(`DELETE FROM "${sCurrentSchema}"."${sFrontendSettingTable}" WHERE SETTING_TYPE = '${sSettingType}'`);
        oConnection.commit();
    }

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it("Insert data in the frontend settings table", () => {
            clearTable();
            // Insert test data
            oConnection.executeUpdate(`INSERT INTO "${sCurrentSchema}"."${sFrontendSettingTable}" ("SETTING_ID", "SETTING_NAME", "SETTING_TYPE", "SETTING_CONTENT", "USER_ID") VALUES (?,?,?,?,?)`, aFrontendSettingsData);
            oConnection.commit();
        });

    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should update the sap provided help link", () => {
            const aFrontendSettingsAfter = oConnection.executeQuery(`select SETTING_CONTENT
                                                                            from "${sCurrentSchema}"."${sFrontendSettingTable}"
                                                                            where SETTING_TYPE = '${sSettingType}' and SETTING_NAME= '${sSettingName}'`);
            expect(aFrontendSettingsAfter[0].SETTING_CONTENT).toBe(sProvidedHelpLink);
        });
    }

});