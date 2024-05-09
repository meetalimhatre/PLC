const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mergeAnalyticsSettings = $.import("xs.postinstall.release_4_0_0", "mergeAnalyticsSettings");

describe("mergeAnalyticsSettings-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                frontend_settings: "sap.plc.db::basis.t_frontend_settings",
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should merge all the custom analytics settings into one entry", () => {
        // arrange
        const sAnalysisForOfficeAnalyticViews = "{\"DynamicRibbonEntries\": [{\"RibbonView\": [\"Calculation\", \"Cockpit\", \"Project\"],\"RibbonMenuItems\": [{\"RibbonDetails\": {\"Caption\": {\"ResourceKey\": \"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet\"}},\"Connection\": {\"ConnectionType\": \"HTTP_INA\",\"AuthenticationType\": \"Automatic\",\"Name\": \"sap.plc.analytics.viewsCF/V_EXT_PROJECT_COSTING_SHEET_CUST\",\"ForceRefresh\": \"true\",\"ForcePrompts\": \"false\",\"Prompts\": [{\"Name\": \"VAR_PROJECT\",\"ValueType\": \"Variable\",\"Value\": \"PROJECT_ID\"},{\"Name\": \"VAR_ONLY_CURRENT\",\"ValueType\": \"Value\",\"Value\": \"0\"},{\"Name\": \"VAR_LANGUAGE\",\"ValueType\": \"Variable\",\"Value\": \"LANGUAGE\"}]}}]}]}";
        const sCustomAnalyticsSettings1 = "{\"DynamicRibbonEntries\": [{\"RibbonView\": [\"Calculation\", \"Cockpit\", \"Project\"],\"RibbonMenuItems\": [{\"RibbonDetails\": {\"Caption\": {\"ResourceKey\": \"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet\"}},\"Connection\": {\"ConnectionType\": \"HTTP_INA\",\"AuthenticationType\": \"Automatic\",\"Name\": \"sap.plc.analytics.viewsCF/V_EXT_ACTIVITIES_CUST\",\"ForceRefresh\": \"true\",\"ForcePrompts\": \"false\",\"Prompts\": [{\"Name\": \"VAR_PROJECT\",\"ValueType\": \"Variable\",\"Value\": \"PROJECT_ID\"},{\"Name\": \"VAR_ONLY_CURRENT\",\"ValueType\": \"Value\",\"Value\": \"0\"},{\"Name\": \"VAR_LANGUAGE\",\"ValueType\": \"Variable\",\"Value\": \"LANGUAGE\"}]}}]}]}";
        const sCustomAnalyticsSettings2 = "{\"DynamicRibbonEntries\": [{\"RibbonView\": [\"Calculation\", \"Cockpit\", \"Project\"],\"RibbonMenuItems\": [{\"RibbonDetails\": {\"Caption\": {\"ResourceKey\": \"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet\"}},\"Connection\": {\"ConnectionType\": \"HTTP_INA\",\"AuthenticationType\": \"Automatic\",\"Name\": \"sap.plc.analytics.viewsCF/V_EXT_COMPONENT_SPLIT_CUST\",\"ForceRefresh\": \"true\",\"ForcePrompts\": \"false\",\"Prompts\": [{\"Name\": \"VAR_PROJECT\",\"ValueType\": \"Variable\",\"Value\": \"PROJECT_ID\"},{\"Name\": \"VAR_ONLY_CURRENT\",\"ValueType\": \"Value\",\"Value\": \"0\"},{\"Name\": \"VAR_LANGUAGE\",\"ValueType\": \"Variable\",\"Value\": \"LANGUAGE\"}]}}]}]}";
        const sCustomAnalyticsSettings3 = "{\"DynamicRibbonEntries\": [{\"RibbonView\": [\"Calculation\", \"Cockpit\", \"Project\"],\"RibbonMenuItems\": [{\"RibbonDetails\": {\"Caption\": {\"ResourceKey\": \"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet\"}},\"Connection\": {\"ConnectionType\": \"HTTP_INA\",\"AuthenticationType\": \"Automatic\",\"Name\": \"sap.plc.analytics.viewsCF/V_EXT_LINE_ITEMS_CUST\",\"ForceRefresh\": \"true\",\"ForcePrompts\": \"false\",\"Prompts\": [{\"Name\": \"VAR_PROJECT\",\"ValueType\": \"Variable\",\"Value\": \"PROJECT_ID\"},{\"Name\": \"VAR_ONLY_CURRENT\",\"ValueType\": \"Value\",\"Value\": \"0\"},{\"Name\": \"VAR_LANGUAGE\",\"ValueType\": \"Variable\",\"Value\": \"LANGUAGE\"}]}}]}]}";
        const sCustomAnalysisForOfficeAnalyticViews = "{\"DynamicRibbonEntries\": []}";
        
        const oFrontendSetting = {
            SETTING_ID: [0, 1, 2, 3, 4],
            SETTING_NAME: ["AnalysisForOfficeAnalyticViews", "CustomAnalyticsSettings1", "CustomAnalyticsSettings2", "CustomAnalyticsSettings3", "CustomAnalysisForOfficeAnalyticViews"],
            SETTING_TYPE: ["ANALYTICSINTEGRATION", "ANALYTICSINTEGRATION", "ANALYTICSINTEGRATION", "ANALYTICSINTEGRATION", "ANALYTICSINTEGRATION"],
            SETTING_CONTENT: [sAnalysisForOfficeAnalyticViews, sCustomAnalyticsSettings1, sCustomAnalyticsSettings2, sCustomAnalyticsSettings3, sCustomAnalysisForOfficeAnalyticViews],
            USER_ID: [null, null, null, null, null],
        };

        //const sAnalysisForOfficeAnalyticViewsExpected = '{"DynamicRibbonEntries": [{"RibbonView": ["Calculation", "Cockpit", "Project"],"RibbonMenuItems": [{"RibbonDetails": {"Caption": {"ResourceKey": "XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection": {"ConnectionType": "HTTP_INA","AuthenticationType": "Automatic","Name": "sap.plc.analytics.viewsCF/V_EXT_PROJECT_COSTING_SHEET_CUST","ForceRefresh": "true","ForcePrompts": "false","Prompts": [{"Name": "VAR_PROJECT","ValueType": "Variable","Value": "PROJECT_ID"},{"Name": "VAR_ONLY_CURRENT","ValueType": "Value","Value": "0"},{"Name": "VAR_LANGUAGE","ValueType": "Variable","Value": "LANGUAGE"}]}}]}]}';
        const sCustomAnalysisForOfficeAnalyticViewsExpected = '{"DynamicRibbonEntries":[{"RibbonView":["Calculation","Cockpit","Project"],"RibbonMenuItems":[{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"sap.plc.analytics.viewsCF/V_EXT_ACTIVITIES_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}}]},{"RibbonView":["Calculation","Cockpit","Project"],"RibbonMenuItems":[{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"sap.plc.analytics.viewsCF/V_EXT_COMPONENT_SPLIT_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}}]},{"RibbonView":["Calculation","Cockpit","Project"],"RibbonMenuItems":[{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"sap.plc.analytics.viewsCF/V_EXT_LINE_ITEMS_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}}]}]}';      
        const oFrontendSettingExpected = {
            SETTING_ID: [0, 4],
            SETTING_NAME: ["AnalysisForOfficeAnalyticViews", "CustomAnalysisForOfficeAnalyticViews"],
            SETTING_TYPE: ["ANALYTICSINTEGRATION", "ANALYTICSINTEGRATION"],
            SETTING_CONTENT: [sAnalysisForOfficeAnalyticViews, sCustomAnalysisForOfficeAnalyticViewsExpected],
            USER_ID: [null, null],
        };
        oMockstar.insertTableData("frontend_settings", oFrontendSetting);
        jasmine.dbConnection.commit();

        // act
        mergeAnalyticsSettings.run(jasmine.dbConnection);

        // assert
        const oFrontendSettingsAfter = oMockstar.execQuery(`select SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT, USER_ID
                                                                from {{frontend_settings}}
                                                            where SETTING_ID in (${oFrontendSetting.SETTING_ID}) order by SETTING_ID`);
        oFrontendSettingsAfter.columns.SETTING_CONTENT.rows.forEach((sContent, iIndex) => {
            expect(sContent).toBe(oFrontendSettingExpected.SETTING_CONTENT[iIndex]);
        });
        expect(oFrontendSettingsAfter).toMatchData(oFrontendSettingExpected, ["SETTING_ID", "SETTING_NAME", "SETTING_TYPE"]);

        
    });
}).addTags(["All_Unit_Tests"]);
