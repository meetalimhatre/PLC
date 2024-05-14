var aDatabaseSetup = [
    'xs.postinstall.release_independent.98_create_db_artifacts',
    'xs.postinstall.release_independent.030_StandardContent'
];

var aPreDatabaseSetUpUpgradeSteps = [];

var aPostDatabaseSetupUpgradeSteps = [{
        version: 4,
        version_sp: 4,
        version_patch: 15,
        library: ['xs.postinstall.release_4_0_0.updateHelpLink']
    }];

var aPreDatabaseSetupInstallSteps = ['xs.postinstall.release_independent.00_setup_check_prerequisites'];

var aPostDatabaseSetupInstallSteps = [
    'xs.postinstall.release_independent.01_setup_frontend_settings',
    'xs.postinstall.release_independent.02_setup_automated_jobs',
    'xs.postinstall.release_independent.040_UoM_Currencies_ExchangeRates',
    'xs.postinstall.release_4_0_0.updateHelpLink'
];

var aOptionalInstallSteps = [
    {
        id: 1,
        description: 'Import SAP ERP price sources',
        library: ['xs.postinstall.release_independent.110_ERP_PriceSources']
    },
    {
        id: 2,
        description: 'Import example content',
        library: ['xs.postinstall.release_independent.050_ExampleContent']
    }
];

var sCompleteRegister = 'xs.postinstall.release_independent.99_setup_completed';

//description for registers
var oRegisterDescription = {
    'xs.postinstall.release_independent.00_setup_check_prerequisites': 'Perform set-up and check prerequisites',
    'xs.postinstall.release_independent.01_setup_frontend_settings': 'Setup frontend settings',
    'xs.postinstall.release_independent.02_setup_automated_jobs': 'Setup automated jobs',
    'xs.postinstall.release_independent.98_create_db_artifacts': 'Create database artifacts',
    'xs.postinstall.release_independent.030_StandardContent': 'Import standard content',
    'xs.postinstall.release_independent.040_UoM_Currencies_ExchangeRates': 'Import UOMs, currencies, and exchange rates',
    'xs.postinstall.release_independent.99_setup_completed': 'Complete setup',
    'xs.postinstall.hotfix_4_2_3.makeDisplayOrderUniqueForStatus': 'Make the display order unique for statuses',
    'xs.postinstall.hotfix_4_2_3.setValueForDeterminedAccountId': 'Set value for determined account id',
    'xs.postinstall.release_4_3_0.migrateLifecycleQuantities': 'Adapt lifecycle quantities after data model change',
    'xs.postinstall.release_4_3_0.addCustomFieldsForReplicationTool': 'Add custom fields to field mappings for replication tool',
    'xs.postinstall.release_4_3_0.setValueForDeterminedAccountId': 'Set value for determined account id',
    'xs.postinstall.release_4_3_0.setValueForMappingLanguageId': 'Set value for mapping language id',
    'xs.postinstall.release_4_3_0.setIsRelevantForTotalIntercompany': 'Set default value for base costing sheet rows',
    'xs.postinstall.release_4_3_0.removeCustomFieldsWithUnitForNotDecimalForReplicationTool': 'Remove unit fields where the parent custom fields are not of decimal type',
    'xs.postinstall.release_4_4_0.addChildItemCategoryToItemTable': 'Add CHILD_ITEM_CATEGORY_ID to item table',
    'xs.postinstall.release_4_4_0.addChildItemCategoryToLayoutTable': 'Add CHILD_ITEM_CATEGORY_ID to layout tables',
    'xs.postinstall.release_4_4_0.update_filter_mass_change_setting_content': 'Update filter and mass change setting content',
    'xs.postinstall.release_4_4_0.setPriceRuleDefaultSequence': 'Set price rule default sequence',
    'xs.postinstall.release_4_4_0.setStandardContentForItemCategoryTables': 'Set standard content for Item Category',
    'xs.postinstall.release_4_4_0.updateHiddenLayoutField': 'Clean layout hidden fields',
    'xs.postinstall.release_4_3_0.updateLayoutType': 'Insert default layout',
    'xs.postinstall.release_4_5_0.setActiveLanguageId': 'Set Active Language for Portuguese and Russian'
};

var aOptionalUpgradeSteps = [];
export default {aDatabaseSetup,aPreDatabaseSetUpUpgradeSteps,aPostDatabaseSetupUpgradeSteps,aPreDatabaseSetupInstallSteps,aPostDatabaseSetupInstallSteps,aOptionalInstallSteps,sCompleteRegister,oRegisterDescription,aOptionalUpgradeSteps};
