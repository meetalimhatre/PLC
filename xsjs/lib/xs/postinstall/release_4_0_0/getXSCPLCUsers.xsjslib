const roleTemplateMap = Object.freeze({
    'sap.plc.authorizations::Addin_Administrator': 'AddinAdministrator_RT',
    'sap.plc.authorizations::Addin_User': 'AddinUser_RT',
    'sap.plc.authorizations::Admin_Costing_And_Analysis_Administrator': 'AdminCostingAndAnalysisAdministrator_RT',
    'sap.plc.authorizations::Admin_Costing_And_Analysis_Viewer': 'AdminCostingAndAnalysisViewer_RT',
    'sap.plc.authorizations::Admin_Finance_Administrator': 'AdminFinanceAdministrator_RT',
    'sap.plc.authorizations::Admin_Finance_Viewer': 'AdminFinanceViewer_RT',
    'sap.plc.authorizations::Admin_Global_Settings_Administrator': 'AdminGlobalSetAdministrator_RT',
    'sap.plc.authorizations::Admin_Global_Settings_Viewer': 'AdminGlobalSetViewer_RT',
    'sap.plc.authorizations::Admin_Logistics_Administrator': 'AdminLogisticsAdministrator_RT',
    'sap.plc.authorizations::Admin_Logistics_Viewer': 'AdminLogisticsViewer_RT',
    'sap.plc.authorizations::Admin_Prices_Administrator': 'AdminPricesAdministrator_RT',
    'sap.plc.authorizations::Admin_Prices_Viewer': 'AdminPricesViewer_RT',
    'sap.plc.authorizations::Analytics_General_Viewer': 'AnalyticsViewer_RT',
    'sap.plc.authorizations::Base_Viewer': 'BaseViewer_RT',
    'sap.plc.authorizations::Calculation_Version_Viewer': 'CalcVerViewer_RT',
    'sap.plc.authorizations::Calculation_Viewer': 'CalcViewer_RT',
    'sap.plc.authorizations::Contributor': 'Contributor_RT',
    'sap.plc.authorizations::Controller': 'Controller_RT',
    'sap.plc.authorizations::Custom_Fields_Formula_Administrator': 'CFFAdministrator_RT',
    'sap.plc.authorizations::Data_Protection_Officer_Read': 'DataProtectionOfficerRead_RT',
    'sap.plc.authorizations::Data_Protection_Officer_Delete': 'DataProtectionOfficerDel_RT',
    'sap.plc.authorizations::Power_User': 'PowerUser_RT',
    'sap.plc.authorizations::Project_Viewer': 'PrjViewer_RT',
    'sap.plc.authorizations::Transportation_Administrator': 'TransAdministrator_RT'
});

const deprecatedPLCRoles = [
    'sap.plc.authorizations::replication_power_user',
    'sap.plc.authorizations::replication_viewer',
    'sap.plc.authorizations::technical_user',
    'sap.plc.authorizations::technical_user_repo'
];



async function transformRoletoRT(oRoleName) {
    return roleTemplateMap[oRoleName] === undefined ? '-1' : roleTemplateMap[oRoleName];
}


async function getXSCUsers(oConnection) {
    try {

        var result = await oConnection.executeQuery(`SELECT USER_NAME FROM "USERS" 
            WHERE USER_NAME NOT LIKE '_SYS_%' 
            AND CREATOR != '_SYS_DI_SU' 
            AND CREATOR != 'SYS_XS_SBSS' 
            AND CREATOR NOT IN (SELECT USER_NAME FROM "SYS"."USER_PARAMETERS" WHERE VALUE = 'XS_USER_ADMIN');`);
        var finalMigrateUsers = [];
        for (var index in result) {
            var users = await oConnection.executeQuery(`SELECT DISTINCT USER_NAME, ROLE_NAME FROM "SYS"."EFFECTIVE_ROLES" WHERE USER_NAME = '${ result[index].USER_NAME }';`);
            var validUser = users.filter(function (item, index) {
                if (deprecatedPLCRoles.includes(item.ROLE_NAME)) {
                    return false;
                }
                return item.ROLE_NAME.includes('sap.plc');
            });
            if (validUser.length > 0) {
                var oUserWithRoles = {
                    'user': validUser[0].USER_NAME,
                    'xscRoles': [],
                    'xsaRoleTemplates': []
                };

                validUser.map(async function (item, index) {
                    oUserWithRoles.xscRoles.push(item.ROLE_NAME);
                    oUserWithRoles.xsaRoleTemplates.push(await transformRoletoRT(item.ROLE_NAME));
                });
                finalMigrateUsers.push(oUserWithRoles);
            }
        }
        return finalMigrateUsers;
    } catch (e) {
        return e.message;
    }
}
export default {roleTemplateMap,deprecatedPLCRoles,transformRoletoRT,getXSCUsers};