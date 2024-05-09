const _ = require('lodash');
const BusinessObjectsEntities = require('./masterdataResources').BusinessObjectsEntities;

// The function from other lib is copied here to avoid circular imports
async function deepFreeze(oObject) {
    if (Object.isFrozen(oObject) === false) {
        await Object.freeze(oObject);
    }
    _.each(oObject, vValue => {
        var bIsFreezable = vValue !== null && (_.isObject(vValue) || await _.isFunction(vValue));
        if (bIsFreezable) {
            await deepFreeze(vValue);
        }
    });
    return oObject;
}

module.exports.BusinessObjectsEntities = BusinessObjectsEntities;

//TODO VV: replace var X = Object.freeze(...) with var X=...
module.exports.ServiceMetaInformation = await deepFreeze({
    CalculationId: 'CALCULATION_ID',
    CalculationVersionId: 'CALCULATION_VERSION_ID',
    UserId: 'USER_ID',
    IsDirty: 'IS_DIRTY',
    IsLocked: 'IS_LOCKED',
    IsWritable: 'IS_WRITEABLE',
    LockStatus: 'LOCK_STATUS',
    LockActiveStatus: 'LOCK_ACTIVE_USERS_STATUS',
    Metadata: 'metadata',
    DefaultSettings: 'Default_Settings',
    CostingSheet: 'costingSheet',
    CostingSheetRow: 'costingSheetRow',
    ComponentSplit: 'componentSplit',
    AccountGroup: 'accountGroup',
    ServerVersion: 'SERVER_VERSION',
    CalculationVersionsMetadata: 'CalculationVersions'
});

var TansactionalObjectTyps = await deepFreeze({
    ApplicationData: 'ApplicationData',
    Calculation: 'Calculation',
    CalculatedResults: 'Calculated_Results',
    CalculationVersion: 'Calculation_Version',
    InitSession: 'Init_Session',
    Logout: 'Logout',
    Item: 'Item',
    Ping: 'Ping',
    Project: 'Project',
    ProjectActivityPriceSurcharges: 'Project_ActivityPriceSurcharges',
    ProjectMaterialPriceSurcharges: 'Project_MaterialPriceSurcharges',
    ProjectQuantities: 'Project_Quantities',
    DefaultSettings: 'Default_Settings',
    Lock: 'Lock',
    Administration: 'Administration',
    Customfieldsformula: 'Customfieldsformula',
    GlobalSearch: 'Global_Search',
    CalculationVersionRecover: 'Calculation_Version_Recover',
    Layout: 'Layout',
    Privilege: 'Privilege',
    Task: 'Task',
    PlcUsers: 'Plc_Users',
    FrontendSettings: 'FrontendSettings',
    SimilarPartsSearch: 'SimilarPartsSearch',
    Variant: 'Variant',
    Status: 'Status',
    Masterdata: 'Masterdata',
    VariantItem: 'Variant_Item',
    VariantCalculator: 'Variant_Calculator',
    SumVariant: 'Sum_Variant'
});
module.exports.TansactionalObjectTyps = TansactionalObjectTyps;

module.exports.AuthObjectTypes = await deepFreeze({
    groupObject: 'groupObject',
    privilegeObject: 'privilegeObject',
    Group: 'Usergroup'
});

var MasterDataObjectTypes = await deepFreeze({
    Account: 'Account',
    AccountGroup: 'Account_Group',
    ActivityPrice: 'Activity_Price',
    ActivityType: 'Activity_Type',
    BusinessArea: 'Business_Area',
    Process: 'Process',
    CompanyCode: 'Company_Code',
    ComponentSplit: 'Component_Split',
    ConfidenceLevel: 'Confidence_Level',
    ControllingArea: 'Controlling_Area',
    CostCenter: 'Cost_Center',
    CostingSheet: 'Costing_Sheet',
    CostingSheetRow: 'Costing_Sheet_Row',
    Currency: 'Currency',
    CurrencyConversion: 'Currency_Conversion',
    Customer: 'Customer',
    Dimension: 'Dimension',
    Document: 'Document',
    DocumentStatus: 'Document_Status',
    DocumentType: 'Document_Type',
    ExchangeRateType: 'Exchange_Rate_Type',
    Language: 'Language',
    Material: 'Material',
    MaterialAccountDetermination: 'Material_Account_Determination',
    MaterialGroup: 'Material_Group',
    MaterialPlant: 'Material_Plant',
    MaterialPrice: 'Material_Price',
    MaterialType: 'Material_Type',
    OverheadGroup: 'Overhead_Group',
    Plant: 'Plant',
    PriceSource: 'Price_Source',
    ProfitCenter: 'Profit_Center',
    SalesOrganization: 'Sales_Organization',
    UnitOfMeasure: 'Unit_Of_Measure',
    User: 'User',
    ValuationClass: 'Valuation_Class',
    Vendor: 'Vendor',
    WorkCenter: 'Work_Center',
    WorkCenterProcess: 'Work_Center_Process',
    WorkCenterActivity: 'Work_Center_Activity',
    DesignOffice: 'Design_Office',
    Metadata: 'metadata',
    Folder: 'folder',
    Group: 'group',
    Layout: 'layout',
    LayoutSidepane: 'layout_sidepane',
    LayoutTreetable: 'layout_treetable',
    Price: 'Price',
    PurchasingGroup: 'purchasing_group',
    PurchasingOrganization: 'purchasing_organization',
    SystemMessage: 'system_message',
    Transportation: 'Transportation'
});
module.exports.MasterDataObjectTypes = MasterDataObjectTypes;

module.exports.MasterDataObjectsAllowedReqBodyEntities = function () {
    var returnedMap = new Map();

    returnedMap.set(MasterDataObjectTypes.Account, [
        BusinessObjectsEntities.ACCOUNT_ENTITIES,
        BusinessObjectsEntities.ACCOUNT_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.AccountGroup, [
        BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES,
        BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES,
        BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.ActivityType, [
        BusinessObjectsEntities.ACTIVITY_TYPE_ENTITIES,
        BusinessObjectsEntities.ACTIVITY_TYPE_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.BusinessArea, [
        BusinessObjectsEntities.BUSINESS_AREA_ENTITIES,
        BusinessObjectsEntities.BUSINESS_AREA_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.Process, [
        BusinessObjectsEntities.PROCESS_ENTITIES,
        BusinessObjectsEntities.PROCESS_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.CompanyCode, [
        BusinessObjectsEntities.COMPANY_CODE_ENTITIES,
        BusinessObjectsEntities.COMPANY_CODE_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.ComponentSplit, [
        BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES,
        BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES,
        BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.ConfidenceLevel, [
        BusinessObjectsEntities.CONFIDENCE_LEVEL_ENTITIES,
        BusinessObjectsEntities.CONFIDENCE_LEVEL_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.ControllingArea, [
        BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES,
        BusinessObjectsEntities.CONTROLLING_AREA_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.ControllingVersion, [
        BusinessObjectsEntities.CONTROLLING_VERSION_ENTITIES,
        BusinessObjectsEntities.CONTROLLING_VERSION_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.CostCenter, [
        BusinessObjectsEntities.COST_CENTER_ENTITIES,
        BusinessObjectsEntities.COST_CENTER_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.CostingSheet, [
        BusinessObjectsEntities.COSTING_SHEET_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.CostingSheetRow, [
        BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES,
        BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.Currency, [
        BusinessObjectsEntities.CURRENCY_ENTITIES,
        BusinessObjectsEntities.CURRENCY_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.CurrencyConversion, [BusinessObjectsEntities.CURRENCY_CONVERSION_ENTITIES]);
    returnedMap.set(MasterDataObjectTypes.Customer, [BusinessObjectsEntities.CUSTOMER_ENTITIES]);
    returnedMap.set(MasterDataObjectTypes.Dimension, [
        BusinessObjectsEntities.DIMENSION_ENTITIES,
        BusinessObjectsEntities.DIMENSION_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.Document, [
        BusinessObjectsEntities.DOCUMENT_ENTITIES,
        BusinessObjectsEntities.DOCUMENT_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.DocumentStatus, [
        BusinessObjectsEntities.DOCUMENT_STATUS_ENTITIES,
        BusinessObjectsEntities.DOCUMENT_STATUS_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.DocumentType, [
        BusinessObjectsEntities.DOCUMENT_TYPE_ENTITIES,
        BusinessObjectsEntities.DOCUMENT_TYPE_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.ExchangeRateType, [
        BusinessObjectsEntities.EXCHANGE_RATE_TYPE_ENTITIES,
        BusinessObjectsEntities.EXCHANGE_RATE_TYPE_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.Language, [BusinessObjectsEntities.LANGUAGE_ENTITIES]);
    returnedMap.set(MasterDataObjectTypes.Material, [
        BusinessObjectsEntities.MATERIAL_ENTITIES,
        BusinessObjectsEntities.MATERIAL_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.MaterialAccountDetermination, [BusinessObjectsEntities.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES]);
    returnedMap.set(MasterDataObjectTypes.MaterialGroup, [
        BusinessObjectsEntities.MATERIAL_GROUP_ENTITIES,
        BusinessObjectsEntities.MATERIAL_GROUP_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.MaterialPlant, [BusinessObjectsEntities.MATERIAL_PLANT_ENTITIES]);
    returnedMap.set(MasterDataObjectTypes.MaterialType, [
        BusinessObjectsEntities.MATERIAL_TYPE_ENTITIES,
        BusinessObjectsEntities.MATERIAL_TYPE_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.OverheadGroup, [
        BusinessObjectsEntities.OVERHEAD_GROUP_ENTITIES,
        BusinessObjectsEntities.OVERHEAD_GROUP_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.Plant, [
        BusinessObjectsEntities.PLANT_ENTITIES,
        BusinessObjectsEntities.PLANT_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.PriceSource, [
        BusinessObjectsEntities.PRICE_SOURCE_ENTITIES,
        BusinessObjectsEntities.PRICE_SOURCE_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.ProfitCenter, [
        BusinessObjectsEntities.PROFIT_CENTER_ENTITIES,
        BusinessObjectsEntities.PROFIT_CENTER_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.UnitOfMeasure, [
        BusinessObjectsEntities.UOM_ENTITIES,
        BusinessObjectsEntities.UOM_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.ValuationClass, [
        BusinessObjectsEntities.VALUATION_CLASS_ENTITIES,
        BusinessObjectsEntities.VALUATION_CLASS_TEXT_ENTITIES
    ]);
    returnedMap.set(MasterDataObjectTypes.Vendor, [BusinessObjectsEntities.VENDOR_ENTITIES]);
    returnedMap.set(MasterDataObjectTypes.WorkCenter, [
        BusinessObjectsEntities.WORK_CENTER_ENTITIES,
        BusinessObjectsEntities.WORK_CENTER_TEXT_ENTITIES,
        BusinessObjectsEntities.WORK_CENTER_PROCESS_ENTITIES,
        BusinessObjectsEntities.WORK_CENTER_ACTIVITY_ENTITIES
    ]);
    return returnedMap;
}();

var HelperObjectTypes = await deepFreeze({
    AccountAccountGroup: 'Account_Account_Group',
    ComponentSplitAccountGroup: 'Component_Split_Account_Group',
    Addin: 'Addin',
    AddinConfiguration: 'Addin_Configuration',
    AddinVersion: 'Addin_Version',
    AddinConfigurationHeader: 'Addin_Configuration_Header',
    AddinConfigurationItem: 'Addin_Configuration_Item',
    CostingSheetBase: 'Costing_Sheet_Base',
    CostingSheetBaseRow: 'Costing_Sheet_Base_Row',
    CostingSheetRowDependencies: 'Costing_Sheet_Row_Dependencies',
    CostingSheetOverHead: 'Costing_Sheet_Overhead',
    CostingSheetOverHeadRow: 'Costing_Sheet_Overhead_Row',
    WorkCenterActivityType: 'Work_Center_Activity',
    Standard: 'Standard',
    DataProtection: 'DataProtection',
    RetentionPeriods: 'RetentionPeriods',
    Auth: 'Auth',
    PlcExtensionsGreet: 'PlcExtensionsGreet'
});
module.exports.HelperObjectTypes = HelperObjectTypes;








var BusinessObjectTypes = {};
_.extend(BusinessObjectTypes, MasterDataObjectTypes, HelperObjectTypes, TansactionalObjectTyps);
await deepFreeze(BusinessObjectTypes);
module.exports.BusinessObjectTypes = BusinessObjectTypes;

module.exports.FallbackLanguages = await Object.freeze([
    'EN',
    'DE'
]);
module.exports.LanguageFields = await Object.freeze([
    'LANGU',
    'LANGUAGE'
]);


module.exports.ServiceParameters = await deepFreeze({
    Save: 'save',
    SaveAs: 'save-as',
    Close: 'close',
    Copy: 'copy',
    Create: 'create',
    Open: 'open',
    Freeze: 'freeze',
    calculate: {
        name: 'calculate',
        resources: [
            'items.xsjslib',
            'calculation-versions.xsjslib'
        ]
    },
    mode: {
        name: 'mode',
        resources: ['items.xsjslib'],
        values: {
            normal: 'normal',
            replace: 'replace',
            updateMasterDataAndPrices: 'updatemasterdataandprices',
            noUpdateMasterDataAndPrices: 'noupdatemasterdataandprices'
        }
    },
    compressedResult: {
        name: 'compressedResult',
        resources: [
            'items.xsjslib',
            'calculation-versions.xsjslib'
        ]
    }
});

module.exports.AddinServiceParameters = await deepFreeze({
    Status: {
        Name: 'status',
        Values: {
            All: 'all',
            Activated: 'activated'
        }
    }
});

module.exports.ProjectServiceParameters = await deepFreeze({
    action: {
        name: 'action',
        values: {
            open: 'open',
            close: 'close',
            create: 'create',
            calculate_lifecycle_versions: 'calculate_lifecycle_versions'
        }
    },
    id: { name: 'id' },
    overwriteManualVersions: { name: 'overwriteManualVersions' }
});

module.exports.CalculationVersionParameters = await deepFreeze({
    expand: {
        name: 'expand',
        values: { items: 'ITEMS' }
    }
});

module.exports.CalculationServiceParameters = await deepFreeze({
    Create: 'create',
    CopyVersion: 'copy-version'
});
module.exports.parameterCalculationActionValidValues = await Object.freeze([
    'create',
    'copy-version'
]);

module.exports.parameterActionValidValues = await Object.freeze([
    'save',
    'save-as',
    'close',
    'copy',
    'create',
    'open',
    'freeze'
]);

module.exports.AddinStates = await deepFreeze({
    Activated: 'activated',
    Registered: 'registered'
});

module.exports.parameterCalculationTopValues = await deepFreeze({
    defaultTopPerProject: 100,
    maximumTopPerProject: 100000
});

module.exports.DefaultSettings = await deepFreeze({
    CONTROLLING_AREA: 'CONTROLLING_AREA',
    COMPANY_CODE: 'COMPANY_CODE',
    PLANT: 'PLANT',
    CURRENCY: 'CURRENCY',
    COMPONENT_SPLIT: 'COMPONENT_SPLIT',
    COSTING_SHEET: 'COSTING_SHEET'
});

module.exports.DefaultSettingsMasterDataColumns = await Object.freeze({
    controllingAreaId: 'CONTROLLING_AREA_ID',
    companyCodeId: 'COMPANY_CODE_ID',
    plantId: 'PLANT_ID',
    componentSplitId: 'COMPONENT_SPLIT_ID',
    costingSheetId: 'COSTING_SHEET_ID'
});

module.exports.ItemCategory = await deepFreeze({
    CalculationVersion: 0,
    Document: 1,
    Material: 2,
    InternalActivity: 3,
    ExternalActivity: 4,
    Process: 5,
    Subcontracting: 6,
    ResourcesAndTools: 7,
    VariableItem: 8,
    TextItem: 9,
    ReferencedVersion: 10,
    CustomItemCategory: 'Custom_Item_Categories'
});

module.exports.CalculationVersionType = await deepFreeze({
    Base: 1,
    Lifecycle: 2,
    VariantBase: 4,
    GeneratedFromVariant: 8,
    ManualLifecycleVersion: 16
});

module.exports.CalculationNameMaxLength = 500;
module.exports.ActivityTimeUpdateFrequency = 60;

module.exports.CustomFieldDisplayGroup = await deepFreeze({
    Organization: 102,
    Prices: 104,
    Material: 110
});

module.exports.PriceSource = await deepFreeze({
    PlcStandardPrice: '101',
    ErpStandardPrice: '201',
    PlcStandardRate: '301',
    ManualPrice: '901',
    CalculatedPrice: '902',
    ManualRate: '903'
});

module.exports.PriceSourceType = await deepFreeze({
    Material: 1,
    Activity: 2,
    Manual: 3,
    Calculated: 4
});

module.exports.ApplicationTimeout = await deepFreeze({ SessionTimeout: 'SessionTimeout' });

module.exports.SemanticDataTypeAttributes = await deepFreeze({
    String: 'length=5000',
    Link: 'length=2000',
    StringUOM: 'length=3',
    Decimal: 'precision=24; scale=7',
    Integer: null,
    BooleanInt: null,
    LocalDate: null
});

module.exports.PropertyTypes = await deepFreeze({
    String: 3,
    Decimal: 2,
    Integer: 2,
    BooleanInt: 5,
    LocalDate: 12,
    Price: 1,
    Link: 22
});

module.exports.RegexIds = await deepFreeze({ LINK: 'LINK' });

module.exports.ProjectSurchargeStrategies = {
    NoSurcharges: 'NO_SURCHARGES',
    WithPriceDetermination: 'WITH_PRICE_DETERMINATION',
    WithoutPriceDetermination: 'WITHOUT_PRICE_DETERMINATION',
    IfNoPriceFound: 'IF_NO_PRICE_FOUND'
};

module.exports.RegularExpressions = await Object.freeze({
    FilterString: '^[\\w_]+(!=|=|<=|>=|<|>)[\\pL\\dT:Z_#+`)(|/.%\\s-]+(&[\\w_]+(!=|=|<=|>=|<|>)[\\pL\\dT:Z_#+`)(|/.%\\s-]+)*$',
    FieldNames: /([\w]*)?(!=|=|<=|>=|<|>)[^&?]*/g,
    AutoComplete: '^[\\pL\\d_#/. +`:|)(%-]*$'
});

var globalSearchTypeValues = await deepFreeze({
    All: 'All',
    Calculation: 'Calculation',
    CalculationVersion: 'CalculationVersion',
    Project: 'Project'
});
module.exports.globalSearchTypeValues = globalSearchTypeValues;

module.exports.globalSearchSortedColumns = await Object.freeze([
    'ENTITY_TYPE',
    'ENTITY_NAME',
    'ENTITY_ID',
    'CUSTOMER_NAME',
    'TOTAL_COST',
    'TOTAL_QUANTITY',
    'CREATED_ON',
    'CREATED_BY',
    'LAST_MODIFIED_ON',
    'LAST_MODIFIED_BY'
]);
module.exports.globalSearchDirection = await Object.freeze([
    'Ascending',
    'Descending'
]);
module.exports.globalSearchEntityType = await Object.freeze([
    globalSearchTypeValues.All,
    globalSearchTypeValues.Calculation,
    globalSearchTypeValues.CalculationVersion,
    globalSearchTypeValues.Project
]);

module.exports.globalSearchDefaultValues = await deepFreeze({
    SortedColumnId: 'LAST_MODIFIED_ON',
    SortedDirection: 'DESC',
    Filter: '*',
    Type: globalSearchTypeValues.All,
    LocalDate: 12,
    MaxQueryResults: 1000000
});



var aMandatoryPropertiesMetadata = [
    'PATH',
    'BUSINESS_OBJECT',
    'COLUMN_ID',
    'SEMANTIC_DATA_TYPE',
    'SIDE_PANEL_GROUP_ID'
];
var aMandatoryPropertiesMetadataAttributes = [
    'PATH',
    'BUSINESS_OBJECT',
    'COLUMN_ID',
    'ITEM_CATEGORY_ID'
];
var aMandatoryPropertiesMetadataText = [
    'PATH',
    'COLUMN_ID',
    'LANGUAGE'
];
var aMandatoryPropertiesMetadataKeys = [
    'PATH',
    'BUSINESS_OBJECT',
    'COLUMN_ID'
];
module.exports.aMandatoryPropertiesMetadata = aMandatoryPropertiesMetadata;
module.exports.aMandatoryPropertiesMetadataAttributes = aMandatoryPropertiesMetadataAttributes;
module.exports.aMandatoryPropertiesMetadataText = aMandatoryPropertiesMetadataText;
module.exports.aMandatoryPropertiesMetadataKeys = aMandatoryPropertiesMetadataKeys;

module.exports.aValidPropertiesMetadata = _.union(aMandatoryPropertiesMetadata, [
    'ROLLUP_TYPE_ID',
    'TEXT',
    'ATTRIBUTES',
    'FORMULAS',
    'REF_UOM_CURRENCY_PATH',
    'REF_UOM_CURRENCY_BUSINESS_OBJECT',
    'REF_UOM_CURRENCY_COLUMN_ID',
    'UOM_CURRENCY_FLAG',
    'IS_USABLE_IN_FORMULA',
    'SEMANTIC_DATA_TYPE_ATTRIBUTES',
    'PROPERTY_TYPE'
]);
module.exports.aValidPropertiesMetadataAttributes = _.union(aMandatoryPropertiesMetadataAttributes, [
    'DEFAULT_VALUE',
    'IS_MANDATORY',
    'IS_READ_ONLY'
]);
module.exports.aValidPropertiesMetadataText = _.union(aMandatoryPropertiesMetadataText, [
    'DISPLAY_NAME',
    'DISPLAY_DESCRIPTION'
]);
module.exports.aMandatoryPropertiesFormula = [
    'PATH',
    'BUSINESS_OBJECT',
    'COLUMN_ID',
    'ITEM_CATEGORY_ID'
];
module.exports.aValidPropertiesFormula = [
    'FORMULA_ID',
    'PATH',
    'BUSINESS_OBJECT',
    'COLUMN_ID',
    'ITEM_CATEGORY_ID',
    'IS_FORMULA_USED',
    'FORMULA_STRING',
    'FORMULA_DESCRIPTION'
];

module.exports.isFrozen = 1;
module.exports.calculationVersionSearchDefaultValues = await deepFreeze({
    SortingColumn: 'CALCULATION_VERSION_NAME',
    SortingDirection: 'ASC',
    MaxQueryResults: 100
});

module.exports.maxQueryResults = 100;



module.exports.aRegexSpecialChars = await Object.freeze([
    {
        'specialChar': '\\',
        'specialCharReplacement': '\\\\'
    },
    {
        'specialChar': '^',
        'specialCharReplacement': '\\^'
    },
    {
        'specialChar': '$',
        'specialCharReplacement': '\\$'
    },
    {
        'specialChar': '.',
        'specialCharReplacement': '\\.'
    },
    {
        'specialChar': '|',
        'specialCharReplacement': '\\|'
    },
    {
        'specialChar': '?',
        'specialCharReplacement': '\\?'
    },
    {
        'specialChar': '*',
        'specialCharReplacement': '\\*'
    },
    {
        'specialChar': '+',
        'specialCharReplacement': '\\+'
    },
    {
        'specialChar': '(',
        'specialCharReplacement': '\\('
    },
    {
        'specialChar': ')',
        'specialCharReplacement': '\\)'
    },
    {
        'specialChar': '[',
        'specialCharReplacement': '\\['
    },
    {
        'specialChar': '{',
        'specialCharReplacement': '\\{'
    }
]);

module.exports.aCustomFieldMasterdataBusinessObjects = await Object.freeze([
    'Material',
    'Material_Price',
    'Material_Plant',
    'Cost_Center',
    'Work_Center',
    'Activity_Price'
]);

module.exports.TaskType = await deepFreeze({
    CALCULATE_LIFECYCLE_VERSIONS: 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS',
    TRANSPORTATION_IMPORT: 'TRANSPORTATION_IMPORT',
    METADATA_CUSTOM_FIELDS: 'METADATA_CUSTOM_FIELDS'
});

module.exports.TaskStatus = await deepFreeze({
    INACTIVE: 'INACTIVE',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELED: 'CANCELED',
    FAILED: 'FAILED'
});

module.exports.FollowUp = await deepFreeze({
    CALCULATE_LIFECYCLE_VERSIONS: {
        URI: 'xs.followUp:lifecycleCalculator.xsjs',
        FUNCTION_NAME: 'calculateLifecycleVersions'
    },
    METADATA: {
        URI: 'xs.followUp:metadata.xsjs',
        FUNCTION_NAME: 'metadata'
    },
    TRANSPORTATION_IMPORT: {
        URI: 'xs.followUp:transportation.xsjs',
        FUNCTION_NAME: 'transportation'
    }
});

module.exports.LifecycleInterval = await deepFreeze({
    YEARLY: 12,
    QUARTERLY: 3,
    MONTHLY: 1
});

module.exports.mapStandardFieldsWithFormulas = function () {
    var returnedMap = new Map();

    returnedMap.set('BASE_QUANTITY', 'BASE_QUANTITY_IS_MANUAL');
    returnedMap.set('LOT_SIZE', 'LOT_SIZE_IS_MANUAL');
    returnedMap.set('PRICE_FIXED_PORTION', 'PRICE_FIXED_PORTION_IS_MANUAL');
    returnedMap.set('PRICE_VARIABLE_PORTION', 'PRICE_VARIABLE_PORTION_IS_MANUAL');
    returnedMap.set('PRICE_UNIT', 'PRICE_UNIT_IS_MANUAL');
    returnedMap.set('QUANTITY', 'QUANTITY_IS_MANUAL');
    returnedMap.set('TARGET_COST', 'TARGET_COST_IS_MANUAL');

    return returnedMap;
}();

module.exports.SQLMaximumInteger = 2147483647;

module.exports.HttpMethodMapping = await deepFreeze({
    1: 'GET',
    3: 'POST',
    4: 'PUT',
    5: 'DELETE',
    8: 'PATCH'
});

module.exports.VariantItemQuantityState = await deepFreeze({
    CALCULATED_VALUE: 0,
    MANUAL_VALUE: 1,
    LINKED_VALUE: 2
});

module.exports.WorkCenterCategories = [
    'MACHINE',
    'MACHINE_GROUP',
    'LABOR',
    'LABOR_GROUP',
    'PRODUCTION_LINE',
    'WORK_CENTER_ON_PRODUCTION_LINE',
    'PROCESSING_UNIT',
    'TRANSPORTATION_UNIT',
    'STORAGE_UNIT',
    'PLANT_MAINTENANCE',
    'ZONE',
    'STATION',
    'DESIGN_AND_DEVELOPMENT',
    'EXTERNAL_PROCESSING_UNIT'
];

module.exports.sDefaultExchangeRateType = 'STANDARD';

module.exports.SurchargePlaceholders = await deepFreeze({
    ANY_ACCOUNT_GROUP: -2,
    NO_ACCOUNT_GROUP: -1,
    ANY_MATERIAL_GROUP: '*',
    ANY_MATERIAL_TYPE: '*',
    ANY_PLANT: '*',
    NO_PLANT: '',
    ANY_COST_CENTER: '*',
    ANY_ACTIVITY_TYPE: '*',
    NO_ACTIVITY_TYPE: '',
    ANY_MATERIAL_ID: '*'
});

module.exports.CalculationVersionLockContext = await deepFreeze({
    CALCULATION_VERSION: 'calculation_version',
    VARIANT_MATRIX: 'variant_matrix'
});

module.exports.aSidePanelGroupsItemCustomFields = [
    101,
    102,
    103,
    104,
    105,
    106,
    107,
    109,
    110,
    113,
    115
];
module.exports.PriceStrategiesTypes = await deepFreeze({
    Material: 1,
    Activity: 2
});

module.exports.Uom = await deepFreeze({
    Hour: 'H',
    Piece: 'PC'
});

module.exports.EntityTypes = await deepFreeze({
    Project: 'P',
    Folder: 'F',
    Calculation: 'C'
});

module.exports.PriceDeterminationScenarios = await deepFreeze({
    MaterialPriceDeterminationScenario: 'MATERIAL_PRICE_DETERMINATION_SCENARIO',
    ActivityPriceDeterminationScenario: 'ACTIVITY_PRICE_DETERMINATION_SCENARIO',
    AllCategoriesScenario: 'ALL_CATEGORIES_SCENARIO'
});

module.exports.MaxNoOfVariantsSettingType = 'VARIANTSSETTINGS';

module.exports.OneTimeCostItemDescription = 'Distributed Costs';


module.exports.CalculationVersionCostingSheetTotals = await Object.freeze([
    'TOTAL_COST',
    'TOTAL_COST2',
    'TOTAL_COST3'
]);
export default {_,BusinessObjectsEntities,deepFreeze,TansactionalObjectTyps,MasterDataObjectTypes,HelperObjectTypes,BusinessObjectTypes,globalSearchTypeValues,aMandatoryPropertiesMetadata,aMandatoryPropertiesMetadataAttributes,aMandatoryPropertiesMetadataText,aMandatoryPropertiesMetadataKeys};
