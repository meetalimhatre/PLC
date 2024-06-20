//This is a dummy script which can be used to do some pre-requisite tasks before executing the scripts.
const whoAmI = 'sap.plc.init:01_setup_frontend_settings';
const sFrontendSettingsTable = 'sap.plc.db::basis.t_frontend_settings';
const sSettingContent = '{"DynamicRibbonEntries":[{"RibbonView":["Calculation","Cockpit","Project"],"RibbonMenuItems":[{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_InternalActivities"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"{{DBSCHEMA}}.sap.plc.analytics.viewsCF/V_EXT_ACTIVITIES_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name": "VAR_PROJECT","ValueType": "Variable","Value": "PROJECT_ID"},{"Name":"VAR_CALCULATION_VERSION","ValueType":"Variable","Value":"CALCULATION_VERSION_ID"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}},{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ComponentSplit"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"{{DBSCHEMA}}.sap.plc.analytics.viewsCF/V_EXT_COMPONENT_SPLIT_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name": "VAR_PROJECT","ValueType": "Variable","Value": "PROJECT_ID"},{"Name":"VAR_CALCULATION_VERSION","ValueType":"Variable","Value":"CALCULATION_VERSION_ID"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}},{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_CostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"{{DBSCHEMA}}.sap.plc.analytics.viewsCF/V_EXT_COSTING_SHEET_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name": "VAR_PROJECT","ValueType": "Variable","Value": "PROJECT_ID"},{"Name":"VAR_CALCULATION_VERSION","ValueType":"Variable","Value":"CALCULATION_VERSION_ID"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}},{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_LineItems"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"{{DBSCHEMA}}.sap.plc.analytics.viewsCF/V_EXT_LINE_ITEMS_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name": "VAR_PROJECT","ValueType": "Variable","Value": "PROJECT_ID"},{"Name":"VAR_CALCULATION_VERSION","ValueType":"Variable","Value":"CALCULATION_VERSION_ID"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}},{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_Materials"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"{{DBSCHEMA}}.sap.plc.analytics.viewsCF/V_EXT_MATERIAL_LIST_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name": "VAR_PROJECT","ValueType": "Variable","Value": "PROJECT_ID"},{"Name":"VAR_CALCULATION_VERSION","ValueType":"Variable","Value":"CALCULATION_VERSION_ID"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}},{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelComponentSplit"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"{{DBSCHEMA}}.sap.plc.analytics.viewsCF/V_EXT_PROJECT_COMPONENT_SPLIT_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}},{"RibbonDetails":{"Caption":{"ResourceKey":"XMIT_RibbonMenuItem_Analysis_ProjLevelCostingSheet"}},"Connection":{"ConnectionType":"HTTP_INA","AuthenticationType":"Automatic","Name":"{{DBSCHEMA}}.sap.plc.analytics.viewsCF/V_EXT_PROJECT_COSTING_SHEET_CUST","ForceRefresh":"true","ForcePrompts":"false","Prompts":[{"Name":"VAR_PROJECT","ValueType":"Variable","Value":"PROJECT_ID"},{"Name":"VAR_ONLY_CURRENT","ValueType":"Value","Value":"0"},{"Name":"VAR_LANGUAGE","ValueType":"Variable","Value":"LANGUAGE"}]}},{"RibbonDetails":{"Caption":{"ResourceKey": "XMIT_CompareVersions"}},"Connection": {"ConnectionType": "HTTP_INA","AuthenticationType": "Automatic","Name": "{{DBSCHEMA}}.sap.plc.analytics.viewsCF/V_BOM_COMPARE","ForceRefresh": "true","ForcePrompts": "false","Prompts":[{"Name":"versionId1","ValueType":"Variable","Value": "CALCULATION_VERSION_ID"},{"Name":"versionId2","ValueType":"Variable"}]}}]}]}';
const aFrontendSettings = [
    {
        SETTING_NAME: 'SapProvidedHelpLink',
        SETTING_TYPE: 'APPLICATIONHELP',
        SETTING_CONTENT: 'https://help.sap.com/plc_ce'
    },
    {
        SETTING_NAME: 'CustomerProvidedHelpLink',
        SETTING_TYPE: 'APPLICATIONHELP',
        SETTING_CONTENT: ''
    },
    {
        SETTING_NAME: 'MaximumNumberOfImportItems',
        SETTING_TYPE: 'IMPORTSETTINGS',
        SETTING_CONTENT: '30000'
    },
    {
        SETTING_NAME: 'CustomAnalysisForOfficeAnalyticViews',
        SETTING_TYPE: 'ANALYTICSINTEGRATION',
        SETTING_CONTENT: '{"DynamicRibbonEntries":[]}'
    },
    {
        SETTING_NAME: 'MaximumNumberOfVariantsInSum',
        SETTING_TYPE: 'VARIANTSSETTINGS',
        SETTING_CONTENT: '50'
    },
    {
        SETTING_NAME: 'MaximumBatchSizeRepl',
        SETTING_TYPE: 'REPLSETTINGS',
        SETTING_CONTENT: '500000'
    }
];

function check(oConnection) {
    return true;
}

async function run(oConnection) {
    await addStandardAnalyticsSetting(oConnection);
    aFrontendSettings.forEach(async oFrontendSetting => {
    await addFrontendSetting(oFrontendSetting, oConnection);
    });
    return true;
}

function clean(oConnection) {
    return true;
}

async function getCurrentSchemaName(oConnection) {
    return (await oConnection.executeQuery('SELECT CURRENT_SCHEMA FROM "sap.plc.db::DUMMY"'))[0].CURRENT_SCHEMA;
}

addStandardAnalyticsSetting =async oConnection => {
    //check if setting already exists
    let oResult = await oConnection.executeQuery(`select SETTING_ID from "${ sFrontendSettingsTable }" where SETTING_NAME = 'AnalysisForOfficeAnalyticViews'`);

    if (oResult.length > 0) {
         oConnection.executeUpdate(`delete from "${ sFrontendSettingsTable }" where SETTING_NAME = 'AnalysisForOfficeAnalyticViews'`);
    }

    const sCurrentSchemaName = await getCurrentSchemaName(oConnection);

    let sSettingContentToInsert = sSettingContent.split('{{DBSCHEMA}}').join(sCurrentSchemaName);

    await  oConnection.executeUpdate(`INSERT INTO "${ sFrontendSettingsTable }" (SETTING_ID,SETTING_NAME,SETTING_TYPE,USER_ID,SETTING_CONTENT) VALUES ("sap.plc.db.sequence::s_frontend_settings".nextval,'AnalysisForOfficeAnalyticViews','ANALYTICSINTEGRATION',null,'${ sSettingContentToInsert }')`);

};

addFrontendSetting = async (oFrontendSetting, oConnection) => {
    //check if setting already exists
    let oResult = await  oConnection.executeQuery(`select SETTING_ID from "${ sFrontendSettingsTable }" where SETTING_NAME = '${ oFrontendSetting.SETTING_NAME }'`);

    if (oResult.length === 0) {
        await  oConnection.executeUpdate(`INSERT INTO "${ sFrontendSettingsTable }" (SETTING_ID,SETTING_NAME,SETTING_TYPE,USER_ID,SETTING_CONTENT) VALUES ("sap.plc.db.sequence::s_frontend_settings".nextval,'${ oFrontendSetting.SETTING_NAME }','${ oFrontendSetting.SETTING_TYPE }',NULL,'${ oFrontendSetting.SETTING_CONTENT }')`);
    }
};
export default {whoAmI,sFrontendSettingsTable,sSettingContent,aFrontendSettings,check,run,clean,getCurrentSchemaName};
