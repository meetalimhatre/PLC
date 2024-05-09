const sFrontendSettingsTable = "sap.plc.db::basis.t_frontend_settings";
const sSettingType = "APPLICATIONHELP";
const sSettingName = "SapProvidedHelpLink";
const sProvidedHelpLink = "http://help.sap.com/plc_ce";

function check(oConnection) {
    return true;
}

function getCurrentSchemaName(oConnection) {
    return oConnection.executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;
}

function run(oConnection) {
    const sCurrentSchema = getCurrentSchemaName(oConnection);
    oConnection.executeUpdate(`update "${sCurrentSchema}"."${sFrontendSettingsTable}" set SETTING_CONTENT = '${sProvidedHelpLink}' where SETTING_TYPE = '${sSettingType}' and SETTING_NAME= '${sSettingName}'`);
    oConnection.commit();
    return true;
}

function clean(oConnection) {
    return true;
}