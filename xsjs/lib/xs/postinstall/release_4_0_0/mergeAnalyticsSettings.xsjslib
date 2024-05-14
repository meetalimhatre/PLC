const sFrontendSettingsTable = 'sap.plc.db::basis.t_frontend_settings';

function check(oConnection) {
    return true;
}

async function getCurrentSchemaName(oConnection) {
    return await oConnection.executeQuery('SELECT CURRENT_SCHEMA FROM "sap.plc.db::DUMMY"')[0].CURRENT_SCHEMA;
}

async function addCustomAnalyticsSetting(oConnection, sCurrentSchema, sFrontendSettingsTable) {

    const sStmt = `select * from "${ sCurrentSchema }"."${ sFrontendSettingsTable }"
                    where SETTING_TYPE = 'ANALYTICSINTEGRATION' and SETTING_NAME= 'CustomAnalysisForOfficeAnalyticViews'`;
    if (await oConnection.executeQuery(sStmt).length === 0) {
        await oConnection.executeUpdate(`insert into "${ sCurrentSchema }"."${ sFrontendSettingsTable }"(SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT) VALUES("sap.plc.db.sequence::s_frontend_settings".nextval, 'CustomAnalysisForOfficeAnalyticViews', 'ANALYTICSINTEGRATION','{"DynamicRibbonEntries":[]}')`);
    }
}

async function mergeAnalyticsConfiguration(aAnalyticsFrontendSettings, oDefaultCustomSettings) {
    const oCustomerSettings = JSON.parse(oDefaultCustomSettings.SETTING_CONTENT);
    let aDynamicRibbonEntries = oCustomerSettings.DynamicRibbonEntries;
    aAnalyticsFrontendSettings.forEach(oAnalyticsConfig => {
        let SettingContent = JSON.parse(oAnalyticsConfig.SETTING_CONTENT);
        aDynamicRibbonEntries.push(SettingContent.DynamicRibbonEntries[0]);
    });
    oCustomerSettings.DynamicRibbonEntries = aDynamicRibbonEntries;
    oDefaultCustomSettings.SETTING_CONTENT = JSON.stringify(oCustomerSettings);
}

async function run(oConnection) {

    const sCurrentSchema = await getCurrentSchemaName(oConnection);

    //check if custom analytics setting exists and if not, create it
    await addCustomAnalyticsSetting(oConnection, sCurrentSchema, sFrontendSettingsTable);

    const aAnalyticsFrontendSettings = Array.from(await oConnection.executeQuery(`select *
                                                        from "${ sCurrentSchema }"."${ sFrontendSettingsTable }"
                                                        where SETTING_TYPE = 'ANALYTICSINTEGRATION' and SETTING_NAME not in ('AnalysisForOfficeAnalyticViews', 'CustomAnalysisForOfficeAnalyticViews') order by SETTING_ID`));
    const aCustomSettingContent = await oConnection.executeQuery(`select *
                                                            from "${ sCurrentSchema }"."${ sFrontendSettingsTable }"
                                                            where SETTING_TYPE = 'ANALYTICSINTEGRATION' and SETTING_NAME= 'CustomAnalysisForOfficeAnalyticViews'`);

    if (aAnalyticsFrontendSettings.length > 0) {
        await mergeAnalyticsConfiguration(aAnalyticsFrontendSettings, aCustomSettingContent[0]);
        await oConnection.executeUpdate(`delete from "${ sCurrentSchema }"."${ sFrontendSettingsTable }"  where SETTING_TYPE = 'ANALYTICSINTEGRATION' and SETTING_NAME not in ('CustomAnalysisForOfficeAnalyticViews', 'AnalysisForOfficeAnalyticViews')`);
        await oConnection.executeUpdate(`update "${ sCurrentSchema }"."${ sFrontendSettingsTable }" set SETTING_CONTENT = '${ aCustomSettingContent[0].SETTING_CONTENT }' where SETTING_TYPE = 'ANALYTICSINTEGRATION' and SETTING_NAME= 'CustomAnalysisForOfficeAnalyticViews'`);
        await oConnection.commit();
    }
    return true;
}

function clean(oConnection) {
    return true;
}
export default {sFrontendSettingsTable,check,getCurrentSchemaName,addCustomAnalyticsSetting,mergeAnalyticsConfiguration,run,clean};