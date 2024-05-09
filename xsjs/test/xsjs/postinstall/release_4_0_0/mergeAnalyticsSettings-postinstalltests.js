const sFrontendSettingTable = "sap.plc.db::basis.t_frontend_settings";
const XSCPlcSchema = "SAP_PLC";
let oConnection = null;

describe("Merge custom analytics setting into one entry", () => {
    const AnalysisForOfficeAnalyticViews = "{\"DynamicRibbonEntries\": [{\"RibbonView\": [\"Calculation\", \"Cockpit\", \"Project\"],\"RibbonMenuItems\": [{\"RibbonDetails\": {\"Caption\": {\"ResourceKey\": \"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet\"}},\"Connection\": {\"ConnectionType\": \"HTTP_INA\",\"AuthenticationType\": \"Automatic\",\"Name\": \"sap.plc.analytics.viewsCF/V_EXT_PROJECT_COSTING_SHEET_CUST\",\"ForceRefresh\": \"true\",\"ForcePrompts\": \"false\",\"Prompts\": [{\"Name\": \"VAR_PROJECT\",\"ValueType\": \"Variable\",\"Value\": \"PROJECT_ID\"},{\"Name\": \"VAR_ONLY_CURRENT\",\"ValueType\": \"Value\",\"Value\": \"0\"},{\"Name\": \"VAR_LANGUAGE\",\"ValueType\": \"Variable\",\"Value\": \"LANGUAGE\"}]}}]}]}";
    const sCustomAnalyticsSettings1 = "{\"DynamicRibbonEntries\": [{\"RibbonView\": [\"Calculation\", \"Cockpit\", \"Project\"],\"RibbonMenuItems\": [{\"RibbonDetails\": {\"Caption\": {\"ResourceKey\": \"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet\"}},\"Connection\": {\"ConnectionType\": \"HTTP_INA\",\"AuthenticationType\": \"Automatic\",\"Name\": \"sap.plc.analytics.viewsCF/V_EXT_ACTIVITIES_CUST\",\"ForceRefresh\": \"true\",\"ForcePrompts\": \"false\",\"Prompts\": [{\"Name\": \"VAR_PROJECT\",\"ValueType\": \"Variable\",\"Value\": \"PROJECT_ID\"},{\"Name\": \"VAR_ONLY_CURRENT\",\"ValueType\": \"Value\",\"Value\": \"0\"},{\"Name\": \"VAR_LANGUAGE\",\"ValueType\": \"Variable\",\"Value\": \"LANGUAGE\"}]}}]}]}";
    const sCustomAnalyticsSettings2 = "{\"DynamicRibbonEntries\": [{\"RibbonView\": [\"Calculation\", \"Cockpit\", \"Project\"],\"RibbonMenuItems\": [{\"RibbonDetails\": {\"Caption\": {\"ResourceKey\": \"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet\"}},\"Connection\": {\"ConnectionType\": \"HTTP_INA\",\"AuthenticationType\": \"Automatic\",\"Name\": \"sap.plc.analytics.viewsCF/V_EXT_COMPONENT_SPLIT_CUST\",\"ForceRefresh\": \"true\",\"ForcePrompts\": \"false\",\"Prompts\": [{\"Name\": \"VAR_PROJECT\",\"ValueType\": \"Variable\",\"Value\": \"PROJECT_ID\"},{\"Name\": \"VAR_ONLY_CURRENT\",\"ValueType\": \"Value\",\"Value\": \"0\"},{\"Name\": \"VAR_LANGUAGE\",\"ValueType\": \"Variable\",\"Value\": \"LANGUAGE\"}]}}]}]}";
    const sCustomAnalyticsSettings3 = "{\"DynamicRibbonEntries\": [{\"RibbonView\": [\"Calculation\", \"Cockpit\", \"Project\"],\"RibbonMenuItems\": [{\"RibbonDetails\": {\"Caption\": {\"ResourceKey\": \"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet\"}},\"Connection\": {\"ConnectionType\": \"HTTP_INA\",\"AuthenticationType\": \"Automatic\",\"Name\": \"sap.plc.analytics.viewsCF/V_EXT_LINE_ITEMS_CUST\",\"ForceRefresh\": \"true\",\"ForcePrompts\": \"false\",\"Prompts\": [{\"Name\": \"VAR_PROJECT\",\"ValueType\": \"Variable\",\"Value\": \"PROJECT_ID\"},{\"Name\": \"VAR_ONLY_CURRENT\",\"ValueType\": \"Value\",\"Value\": \"0\"},{\"Name\": \"VAR_LANGUAGE\",\"ValueType\": \"Variable\",\"Value\": \"LANGUAGE\"}]}}]}]}";
    const sCustomAnalysisForOfficeAnalyticViews = "{\"DynamicRibbonEntries\": []}";

    
    const aFrontendSettingsData = [
        [1, "AnalysisForOfficeAnalyticViews", "ANALYTICSINTEGRATION", AnalysisForOfficeAnalyticViews, null],
        [5, "CustomAnalysisForOfficeAnalyticViews", "ANALYTICSINTEGRATION", sCustomAnalysisForOfficeAnalyticViews, null],
        [10, "CustomAnalyticsSettings1", "ANALYTICSINTEGRATION", sCustomAnalyticsSettings1, null],
        [11, "CustomAnalyticsSettings2", "ANALYTICSINTEGRATION", sCustomAnalyticsSettings2, null],
        [12, "CustomAnalyticsSettings3", "ANALYTICSINTEGRATION", sCustomAnalyticsSettings3, null]
    ];
    const sCurrentSchema = jasmine.dbConnection.executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;
    const sAnalysisForOfficeAnalyticViewsExpected = `{"DynamicRibbonEntries":[{"RibbonView":["Calculation","Cockpit","Project"],"RibbonMenuItems":[{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"${sCurrentSchema}.sap.plc.analytics.viewsCF/V_EXT_PROJECT_COSTING_SHEET_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}}]}]}`;
    const sCustomAnalysisForOfficeAnalyticViewsExpected = `{"DynamicRibbonEntries":[{"RibbonView":["Calculation","Cockpit","Project"],"RibbonMenuItems":[{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"${sCurrentSchema}.sap.plc.analytics.viewsCF/V_EXT_ACTIVITIES_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}}]},{"RibbonView":["Calculation","Cockpit","Project"],"RibbonMenuItems":[{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"${sCurrentSchema}.sap.plc.analytics.viewsCF/V_EXT_COMPONENT_SPLIT_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}}]},{"RibbonView":["Calculation","Cockpit","Project"],"RibbonMenuItems":[{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"${sCurrentSchema}.sap.plc.analytics.viewsCF/V_EXT_LINE_ITEMS_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}}]}]}`;      
    
    const oFrontendSettingExpected = {
        SETTING_ID: [1, 5],
        SETTING_NAME: ["AnalysisForOfficeAnalyticViews", "CustomAnalysisForOfficeAnalyticViews"],
        SETTING_TYPE: ["ANALYTICSINTEGRATION", "ANALYTICSINTEGRATION"],
        SETTING_CONTENT: [sAnalysisForOfficeAnalyticViewsExpected, sCustomAnalysisForOfficeAnalyticViewsExpected],
        USER_ID: [null, null],
    };

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it("Insert data in the frontend settings table", () => {
            // Insert test data
            oConnection.executeUpdate(`INSERT INTO "${XSCPlcSchema}"."${sFrontendSettingTable}" ("SETTING_ID", "SETTING_NAME", "SETTING_TYPE", "SETTING_CONTENT", "USER_ID") VALUES (?,?,?,?,?)`, aFrontendSettingsData);

            oConnection.commit();
        });

    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("Should have merged all the custom frontend settings into CustomAnalysisForOfficeAnalyticViews", () => {
            const aFrontendSettingsAfter = jasmine.dbConnection.executeQuery(`select SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT, USER_ID
                                                                            from "${sCurrentSchema}"."${sFrontendSettingTable}"
                                                                            where SETTING_TYPE = 'ANALYTICSINTEGRATION' order by SETTING_ID`);
        
            aFrontendSettingsAfter.forEach((sContent, iIndex) => {
                expect(sContent.SETTING_CONTENT).toBe(oFrontendSettingExpected.SETTING_CONTENT[iIndex]);
            });
            expect(aFrontendSettingsAfter).toMatchData(oFrontendSettingExpected, ["SETTING_ID", "SETTING_NAME", "SETTING_TYPE"]);
        });

        it("Should clean test data", () => {
            oConnection.executeUpdate(`UPDATE "${sCurrentSchema}"."${sFrontendSettingTable}" SET SETTING_CONTENT = '${sCustomAnalysisForOfficeAnalyticViews}' where SETTING_NAME = 'CustomAnalysisForOfficeAnalyticViews'`);
            oConnection.commit();
        });
    }

});