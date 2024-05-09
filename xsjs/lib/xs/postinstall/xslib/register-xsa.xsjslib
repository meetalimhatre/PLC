var aDatabaseSetup = ['xs.postinstall.release_independent.98_create_db_artifacts'];

var aPreDatabaseSetUpUpgradeSteps = [
    {
        version: 4,
        version_sp: 0,
        version_patch: 0,
        library: ['xs.postinstall.release_4_0_0.removeTotalQuantityfromVariant']
    },
    {
        version: 4,
        version_sp: 1,
        version_patch: 0,
        library: []
    }
];

var aPostDatabaseSetupUpgradeSteps = [
    {
        version: 4,
        version_sp: 0,
        version_patch: 0,
        library: [
            'xs.postinstall.release_4_0_0.reset_sequence',
            'xs.postinstall.release_4_0_0.upgrade_data_migration',
            'xs.postinstall.release_4_0_0.rename_formula_column_id',
            'xs.postinstall.release_4_0_0.adapt_filter_mass_change_setting_content',
            'xs.postinstall.release_4_0_0.adapt_layout_values',
            'xs.postinstall.release_4_0_0.updateHelpLink',
            'xs.postinstall.release_4_0_0.mergeAnalyticsSettings'
        ]
    },
    {
        version: 4,
        version_sp: 1,
        version_patch: 0,
        library: [
            'xs.postinstall.release_4_1_0.addEntityToProject',
            'xs.postinstall.release_4_1_0.addQuantityStateToVariantItem',
            'xs.postinstall.release_independent.addPriceDeterminationStrategies'
        ]
    },
    {
        version: 4,
        version_sp: 2,
        version_patch: 0,
        library: ['xs.postinstall.release_4_2_0.addMetadataAttributesCustomFieldsRollupCurrency']
    },
    {
        version: 4,
        version_sp: 2,
        version_patch: 3,
        library: [
            'xs.postinstall.hotfix_4_2_3.makeDisplayOrderUniqueForStatus',
            'xs.postinstall.hotfix_4_2_3.setValueForDeterminedAccountId'
        ]
    },
    {
        version: 4,
        version_sp: 3,
        version_patch: 0,
        library: [
            'xs.postinstall.release_4_3_0.migrateLifecycleQuantities',
            'xs.postinstall.release_4_3_0.addCustomFieldsForReplicationTool',
            'xs.postinstall.release_4_3_0.setIsRelevantForTotalIntercompany',
            'xs.postinstall.release_4_3_0.setValueForMappingLanguageId'
        ]
    },
    {
        version: 4,
        version_sp: 3,
        version_patch: 2,
        library: ['xs.postinstall.release_4_3_0.updateLayoutType']
    },
    {
        version: 4,
        version_sp: 4,
        version_patch: 0,
        library: [
            'xs.postinstall.release_4_4_0.addChildItemCategoryToItemTable',
            'xs.postinstall.release_4_4_0.addChildItemCategoryToLayoutTable',
            'xs.postinstall.release_4_4_0.update_filter_mass_change_setting_content',
            'xs.postinstall.release_4_4_0.setPriceRuleDefaultSequence',
            'xs.postinstall.release_4_4_0.setStandardContentForItemCategoryTables',
            'xs.postinstall.release_4_4_0.updateHiddenLayoutField'
        ]
    },
    {
        version: 4,
        version_sp: 4,
        version_patch: 5,
        library: ['xs.postinstall.release_4_5_0.setActiveLanguageId']
    },
    {
        version: 4,
        version_sp: 4,
        version_patch: 9,
        library: [
            'xs.postinstall.release_independent.01_setup_frontend_settings',
            'xs.postinstall.release_independent.02_setup_automated_jobs',
            'xs.postinstall.release_independent.030_StandardContent'
        ]
    }
];

var aPreDatabaseSetupInstallSteps = ['xs.postinstall.release_independent.00_setup_check_prerequisites'];

var aPostDatabaseSetupInstallSteps = [
    'xs.postinstall.release_independent.01_setup_frontend_settings',
    'xs.postinstall.release_independent.02_setup_automated_jobs',
    'xs.postinstall.release_independent.030_StandardContent',
    'xs.postinstall.release_independent.040_UoM_Currencies_ExchangeRates',
    'xs.postinstall.release_independent.addPriceDeterminationStrategies'
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
    'xs.postinstall.release_4_0_0.upgrade_data_migration': 'Migrate customer data for upgrade',
    'xs.postinstall.release_independent.030_StandardContent': 'Import standard content',
    'xs.postinstall.release_independent.040_UoM_Currencies_ExchangeRates': 'Import UOMs, currencies, and exchange rates',
    'xs.postinstall.release_independent.99_setup_completed': 'Complete setup',
    'xs.postinstall.release_4_0_0.reset_sequence': 'Reset Sequence Number',
    'xs.postinstall.release_4_0_0.adapt_layout_values': 'Rename content for layouts after data model change',
    'xs.postinstall.release_4_0_0.rename_formula_column_id': 'Rename content for formula column id after data model change',
    'xs.postinstall.release_4_0_0.adapt_filter_mass_change_setting_content': 'Adapt filters and mass change configurations',
    'xs.postinstall.release_4_0_0.mergeAnalyticsSettings': 'Merge all custom analytics settings',
    'xs.postinstall.release_4_0_0.removeTotalQuantityfromVariant': 'Remove total quantity from variant',
    'xs.postinstall.release_4_0_0.rename_formula_column_id': 'Rename content for formula column id after data model change',
    'xs.postinstall.release_4_0_0.instanceBasedUsers': 'Migrate instance based privileges',
    'xs.postinstall.release_4_0_0.updateHelpLink': 'Update Help Link',
    'xs.postinstall.release_4_1_0.addEntityToProject': 'Add Entity Id to Project',
    'xs.postinstall.release_4_1_0.addQuantityStateToVariantItem': 'Add quantity state to the variant item',
    'xs.postinstall.release_4_2_0.addMetadataAttributesCustomFieldsRollupCurrency': 'Add metadata item attributes so the currency of the custom fields can be read only',
    'xs.postinstall.hotfix_4_2_3.makeDisplayOrderUniqueForStatus': 'Make the display order unique for statuses',
    'xs.postinstall.hotfix_4_2_3.setValueForDeterminedAccountId': 'Set value for determined account id',
    'xs.postinstall.release_4_3_0.migrateLifecycleQuantities': 'Adapt lifecycle quantities after data model change',
    'xs.postinstall.release_4_3_0.addCustomFieldsForReplicationTool': 'Add custom fields to field mappings for replication tool',
    'xs.postinstall.release_4_3_0.setIsRelevantForTotalIntercompany': 'Set default value for base costing sheet rows',
    'xs.postinstall.release_4_3_0.setValueForMappingLanguageId': 'Set value for mapping language id',
    'xs.postinstall.release_4_4_0.addChildItemCategoryToItemTable': 'Add CHILD_ITEM_CATEGORY_ID to item table',
    'xs.postinstall.release_4_4_0.addChildItemCategoryToLayoutTable': 'Add CHILD_ITEM_CATEGORY_ID to layout tables',
    'xs.postinstall.release_4_4_0.update_filter_mass_change_setting_content': 'Update filter and mass change setting content',
    'xs.postinstall.release_4_4_0.setPriceRuleDefaultSequence': 'Set price rule default sequence',
    'xs.postinstall.release_4_4_0.setStandardContentForItemCategoryTables': 'Set standard content for Item Category',
    'xs.postinstall.release_4_4_0.updateHiddenLayoutField': 'Clean layout hidden fields',
    'xs.postinstall.release_independent.addPriceDeterminationStrategies': 'Add Price Determination Strategies',
    'xs.postinstall.release_independent.110_ERP_PriceSources': 'Import SAP ERP price sources',
    'xs.postinstall.release_independent.050_ExampleContent': 'Import example content',
    'xs.postinstall.release_4_3_0.updateLayoutType': 'Insert default layout',
    'xs.postinstall.release_4_5_0.setActiveLanguageId': 'Set Active Language for Portuguese and Russian'
};

var aOptionalUpgradeSteps = [{
        id: 1,
        description: 'instance based users migration',
        library: ['xs.postinstall.release_4_0_0.instanceBasedUsers']
    }];
export default {aDatabaseSetup,aPreDatabaseSetUpUpgradeSteps,aPostDatabaseSetupUpgradeSteps,aPreDatabaseSetupInstallSteps,aPostDatabaseSetupInstallSteps,aOptionalInstallSteps,sCompleteRegister,oRegisterDescription,aOptionalUpgradeSteps};
