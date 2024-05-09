const _ = require("lodash");
const constants = require("../util/constants");
const Helpers = require("../util/helpers");

const CalculationVersionService = require("../service/calculationVersionService");
const ServiceOutput = require("../util/serviceOutput");
const AuthorizationManager = require("../authorization/authorization-manager");
const InternalException = require("../xslib/exceptions").InternalException;
const isCloud = require("../../platform/platformSpecificImports.js").isCloud;

const HttpMethodMapping = constants.HttpMethodMapping;
const BusinessObjectTypes = constants.BusinessObjectTypes;
const MasterDataObjectTypes = constants.MasterDataObjectTypes;
const CalculationServiceParameters = constants.CalculationServiceParameters;
const GlobalSearchSortedColumns = constants.globalSearchSortedColumns;
const GlobalSearchDirection = constants.globalSearchDirection;
const GlobalSearchEntityType = constants.globalSearchEntityType;
const ServiceParameters = constants.ServiceParameters;
const AddinServiceParameters = constants.AddinServiceParameters;
const CalculationVersionParameters = constants.CalculationVersionParameters;

const MessageLibrary = require("../util/message");
const PlcMessage = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;
const Severity = MessageLibrary.Severity;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;


const UrlParameterInfo = require("../validator/urlParameterInfo").UrlParameterInfo;
const urlParameterAction = new UrlParameterInfo("action", "String", true);
urlParameterAction.validValues = constants.parameterActionValidValues;

const urlParameterCalculationAction = new UrlParameterInfo("action", "String", true);
urlParameterCalculationAction.validValues = constants.parameterCalculationActionValidValues;;

const urlGlobalSearchSortedColumn = new UrlParameterInfo("sortedColumnId", "String", false);
urlGlobalSearchSortedColumn.validValues = GlobalSearchSortedColumns;

const urlGlobalSearchSortedDirection = new UrlParameterInfo("sortedDirection", "String", false);
urlGlobalSearchSortedDirection.validValues = GlobalSearchDirection;

const urlGlobalSearchEntityType = new UrlParameterInfo("type", "String", false);
urlGlobalSearchEntityType.validValues = GlobalSearchEntityType;

const InstancePrivileges = AuthorizationManager.Privileges;

// the reason for lazy importing of .js files is they requires the $ context as a parameter
const addinConfigurations = function($) { return new (require("./addin-configurations").AddinConfigurations)($); };
const addins              = function($) { return new (require("./addins").Addins)($); };
const administration      = function($) { return new (require("./administration").Administration)($); };
const applicationdata     = function($) { return new (require("./applicationdata").Applicationdata)($); };
const auth                = function($) { return new (require("./auth").Auth)($); };
const plcExtensionsGreet  = function($) { return new (require("./plcExtensionsGreet").GreetImpl)($); };
const calculatedResults   = function($) { return new (require("./calculated-results").CalculatedResults)($); };
const calculationVersions = function($) { return new (require("./calculation-versions").CalculationVersions)($); };
const calculations        = function($) { return new (require("./calculations").Calculations)($); };
const dataProtection      = function($) { return new (require("./data-protection").DataProtection)($); };
const defaultSettings     = function($) { return new (require("./default-settings").DefaultSettings)($); };
const frontendSettings    = function($) { return new (require("./frontend-settings").FrontendSettings)($); };
const globalSearch        = function($) { return new (require("./global-search").GlobalSearch)($); };
const initialization      = function($) { return new (require("./init-session").InitSession)($); };
const items               = function($) { return new (require("./items").Items)($); };
const layout              = function($) { return new (require("./layout").Layout)($); };
const lock                = function($) { return new (require("./lock").Lock)($); };
const logout              = function($) { return new (require("./logout").Logout)($); };
const masterdata          = function($) { return new (require("./masterdata").Masterdata)($); };
const metadata            = function($) { return new (require("./metadata").Metadata)($); };
const ping                = function($) { return new (require("./ping").Ping)($); };
const privilege           = function($) { return new (require("./privileges").Privileges)($); };
const projects            = function($) { return new (require("./projects").Projects)($); };
const similarPartsSearch  = function($) { return new (require("./similar-parts-search").SimilarPartsSearch)($); };
const task                = function($) { return new (require("./task").Task)($); };
const transportation      = function($) { return new (require("./transportation").Transportation)($); };
const variantCalculator   = function($) { return new (require("./variant-calculator").VariantCalculator)($); };
const variantGenerator    = function($) { return new (require("./variant-generator").VariantGenerator)($); };
const variants            = function($) { return new (require("./variants").Variants)($); };
const group               = function($) { return new (require("../authorization/groups").Groups)($); };
const plcUsers            = function($) { return new (require("../authorization/plc-users").PlcUsers)($); };
const retentionPeriods    = function($) { return new (require("./retention-periods").RetentionPeriods)($);};

let sVersionId;

const Privileges = Object.freeze({
    BASE_ACCESS : "Base",
    EXT_GREET : "ExtGreet",

    ADDIN_EDIT : "AddinE",
    ADDIN_READ_ACTIVATED : "AddinRActiv",
    ADDIN_READ_ALL : "AddinRAll",

    CALCULATIONS_READ : "CalcR",
    CALCULATIONS_DELETE : "CalcD",
    CALCULATIONS_CREATE_UPDATE : "CalcCU",

    CALCULATION_VERSIONS_OPEN : "CalcVerOpen",
    CALCULATION_VERSIONS_DELETE : "CalcVerD",
    CALCULATION_VERSIONS_CREATE_UPDATE : "CalcVerCU",
    CALCULATION_VERSIONS_FREEZE: "CalcVerFreeze",

    PROJECTS_OPEN : "PrjOpen",
    PROJECTS_READ : "PrjR",
    PROJECTS_DELETE : "PrjD",
    PROJECTS_CREATE : "PrjC",
    PROJECTS_UPDATE : "PrjU",

    FOLDER_READ: "FldR",

    GROUPS_READ: "GrpR",
    GROUPS_EDIT: "GrpE",

    CORPORATE_LAYOUT_EDIT: "CorpLayoutE",

    CUSTOM_FIELDS_FORMULA_CREATE_UPDATE : "CFFCU",

    GLOBAL_DEFAULT_SETTINGS_EDIT : "GlobalDfltSetE",
    USER_DEFAULT_SETTINGS_EDIT : "UserDfltSetE",
    USERS_READ : "UsersR",

    TRANSPORTATION_IMPORT : "TransImp",
    TRANSPORTATION_EXPORT : "TransExp",
    TASKS_READ : "TasksR",

    ACCOUNT_EDIT : "AcctE",
    ACCOUNT_GROUP_EDIT : "AcctGrpE",
    ACCOUNT_GROUP_READ : "AcctGrpR",
    ACCOUNT_READ : "AcctR",
    ACTIVITY_PRICE_READ : "ActPriceR",
    ACTIVITY_TYPE_EDIT : "ActTypeE",
    ACTIVITY_TYPE_READ : "ActTypeR",
    BUSINESS_AREA_EDIT : "BizAreaE",
    BUSINESS_AREA_READ : "BizAreaR",
    PROCESS_EDIT : "ProcE",
    PROCESS_READ : "ProcR",
    COMPANY_CODE_EDIT : "CompanyCodeE",
    COMPANY_CODE_READ : "CompanyCodeR",
    COMPONENT_SPLIT_EDIT : "CompoSplitE",
    COMPONENT_SPLIT_READ : "CompoSplitR",
    CONFIDENCE_LEVEL_READ : "ConfLevelR",
    CONTROLLING_AREA_EDIT : "CAE",
    CONTROLLING_AREA_READ : "CAR",
    COST_CENTER_EDIT : "CostCenterE",
    COST_CENTER_READ : "CostCenterR",
    COSTING_SHEET_EDIT : "CostingSheetE",
    COSTING_SHEET_READ : "CostingSheetR",
    CURRENCY_CONVERSION_EDIT : "CurrencyCnvE",
    CURRENCY_CONVERSION_READ : "CurrencyCnvR",
    CURRENCY_EDIT : "CurrencyE",
    CUSTOMER_EDIT : "CustE",
    CUSTOMER_READ : "CustR",
    DOCUMENT_EDIT : "DocE",
    DOCUMENT_READ : "DocR",
    DOCUMENT_STATUS_READ : "DocStatusR",
    DOCUMENT_TYPE_EDIT : "DocTypeE",
    DOCUMENT_TYPE_READ : "DocTypeR",
    EXCHANGE_RATE_TYPE_EDIT : "ExcgRateTypeE",
    EXCHANGE_RATE_TYPE_READ : "ExcgRateTypeR",
    LANGUAGE_EDIT : "LangE",
    MATERIAL_ACCOUNT_DETERMINATION_EDIT : "MatAcctDetE",
    MATERIAL_ACCOUNT_DETERMINATION_READ : "MatAcctDetR",
    MATERIAL_EDIT : "MatlE",
    MATERIAL_GROUP_EDIT : "MatlGrpE",
    MATERIAL_GROUP_READ : "MatlGrpR",
    MATERIAL_PLANT_EDIT : "MatlPlantE",
    MATERIAL_PLANT_READ : "MatlPlantR",
    MATERIAL_PRICE_READ : "MatlPriceR",
    MATERIAL_READ : "MatlR",
    MATERIAL_TYPE_EDIT : "MatlTypeE",
    MATERIAL_TYPE_READ : "MatlTypeR",
    OVERHEAD_GROUP_EDIT : "OvhdGrpE",
    OVERHEAD_GROUP_READ : "OvhdGrpR",
    PLANT_EDIT : "PlantE",
    PLANT_READ : "PlantR",
    PRICE_SOURCE_DELETE : "PriceSrcD",
    PRICE_SOURCE_READ : "PriceSrcR",
    PROFIT_CENTER_EDIT : "ProfitCenterE",
    PROFIT_CENTER_READ : "ProfitCenterR",
    SALES_ORGANIZATION_EDIT : "SalesOrgE",
    SALES_ORGANIZATION_READ : "SalesOrgR",
    UNIT_OF_MEASURE_EDIT : "UOME",
    VALUATION_CLASS_EDIT : "ValuationClsE",
    VALUATION_CLASS_READ : "ValuationClsR",
    VENDOR_EDIT : "VendorE",
    VENDOR_READ : "VendorR",
    WORK_CENTER_EDIT : "WorkCenterE",
    WORK_CENTER_READ : "WorkCenterR",
    FRONTEND_SETTINGS_CORPORATE_EDIT : "FrontendSetCorpE",
    PERSONAL_DATA_READ : "PersonalDataR",
    PERSONAL_DATA_DELETE : "PersonalDataD",
    RETENTION_PERIODS_READ: "RetPeriodsR",
    RETENTION_PERIODS_EDIT: "RetPeriodsE"

});
module.exports.Privileges = Privileges;

// projects and calculation versions reference master data; if during update or create requests, references are changed, the response contains the newly
// referenced master data entities; in order to prevent enumeration attacks, update and create requests for calculation versions and projects need to
//  have read privileges for all the master data entities they reference; those are listed here and used in the resource definition below
const aEditProjectsMasterdataPrivileges = Object.freeze([
    Privileges.COSTING_SHEET_READ,
    Privileges.COMPONENT_SPLIT_READ,
    Privileges.PLANT_READ,
    Privileges.CUSTOMER_READ,
    Privileges.CONTROLLING_AREA_READ,
    Privileges.COMPANY_CODE_READ,
    Privileges.PROFIT_CENTER_READ,
    Privileges.BUSINESS_AREA_READ,
    Privileges.MATERIAL_TYPE_READ,
    Privileges.MATERIAL_GROUP_READ,
    Privileges.ACCOUNT_GROUP_READ,
    Privileges.COST_CENTER_READ,
    Privileges.ACTIVITY_PRICE_READ,
    Privileges.MATERIAL_READ
]);

const aEditCalculationVersionMasterdataPrivileges = Object.freeze([
    Privileges.MATERIAL_PRICE_READ,
    Privileges.ACTIVITY_PRICE_READ,
    Privileges.ACCOUNT_READ,
    Privileges.ACCOUNT_GROUP_READ,
    Privileges.MATERIAL_ACCOUNT_DETERMINATION_READ,
    Privileges.VALUATION_CLASS_READ,
    Privileges.PROCESS_READ,
    Privileges.COSTING_SHEET_READ,
    Privileges.COMPONENT_SPLIT_READ,
    Privileges.PLANT_READ,
    Privileges.WORK_CENTER_READ,
    Privileges.MATERIAL_TYPE_READ,
    Privileges.MATERIAL_GROUP_READ,
    Privileges.MATERIAL_READ,
    Privileges.MATERIAL_PLANT_READ,
    Privileges.DOCUMENT_READ,
    Privileges.DOCUMENT_TYPE_READ,
    Privileges.CUSTOMER_READ,
    Privileges.VENDOR_READ,
    Privileges.COMPANY_CODE_READ,
    Privileges.PROFIT_CENTER_READ,
    Privileges.BUSINESS_AREA_READ,
    Privileges.COST_CENTER_READ,
    Privileges.ACTIVITY_TYPE_READ,
    Privileges.SALES_ORGANIZATION_READ,
    Privileges.DOCUMENT_STATUS_READ
]);


// For each "businessLogic", the value is changed from array of callbacks to a function. In this way, the passed in callbacks in array are imported
// only when actually invoked, instead of the timepoint when Resources object is initialized.
module.exports.Resources = Object.freeze({
    "auth" : {
        "GET" : {
            parameters : [], // add late client parameter - see init-session
            businessObjectType : BusinessObjectTypes.Auth,
            businessLogic: function ($) { return [auth($).hello] },
            privilege : [Privileges.BASE_ACCESS],
            isSessionRequired : false
        }
    },
     "plcExtensionsGreet" : {
         "GET" : {
             parameters : [],
             businessObjectType : BusinessObjectTypes.PlcExtensionsGreet,
             businessLogic: function ($) { return [plcExtensionsGreet($).greet] },
             privilege : [Privileges.EXT_GREET],
             isSessionRequired : false
         }
     },
    "init-session" : {
        "POST" : {
            parameters : [ new UrlParameterInfo("language", "String", true) ], // add late client parameter - see init-session
            businessObjectType : BusinessObjectTypes.InitSession,
            businessLogic: function ($) { return [initialization($).init] },
            privilege : [Privileges.BASE_ACCESS],
            isSessionRequired : false
        }
    },
    "logout" : {
        "POST" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Logout,
            businessLogic: function ($) { return [logout($).logout] },
            privilege : [Privileges.BASE_ACCESS]
        }
    },
    "addins" : {
        "GET" : {
            parameters : [new UrlParameterInfo("status", "String", true, AddinServiceParameters.Status.Values)],
            businessObjectType : BusinessObjectTypes.Addin,
            businessLogic: function ($) { return [addins($).get] },
            privilege : {
                parameterName : "status",
                parameterPrivilegeMap : [ {
                    parameterValues : [ AddinServiceParameters.Status.Values.All ],
                    requiredPrivilege : [Privileges.ADDIN_READ_ALL]
                },
                {
                    parameterValues : [ AddinServiceParameters.Status.Values.Activated ],
                    requiredPrivilege : [Privileges.ADDIN_READ_ACTIVATED]
                },
                ]
            }
        },
        "POST" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Addin,
            businessLogic: function ($) { return [addins($).register] },
            privilege : [Privileges.ADDIN_EDIT]
        },
        "DELETE" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Addin,
            businessLogic: function ($) { return [addins($).unregister] },
            privilege : [Privileges.ADDIN_EDIT]
        },
        "PUT" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Addin,
            businessLogic: function ($) { return [addins($).updateStatus] },
            privilege : [Privileges.ADDIN_EDIT]
        }
    },
    "addin-configurations" : {
        "GET" : {
            parameters : [
                        new UrlParameterInfo("guid", "String", true),
                        new UrlParameterInfo("version", "String", true),
                        new UrlParameterInfo("use_previous_version", "Boolean", false),
                    ],
            businessObjectType : BusinessObjectTypes.AddinConfiguration,
            businessLogic: function ($) { return [addinConfigurations($).get] },
            privilege : [Privileges.ADDIN_READ_ACTIVATED]
        },
        "POST" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.AddinConfiguration,
            businessLogic: function ($) { return [addinConfigurations($).create] },
            privilege : [Privileges.ADDIN_EDIT]
        },
        "PUT" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.AddinConfiguration,
            businessLogic: function ($) { return [addinConfigurations($).update] },
            privilege : [Privileges.ADDIN_EDIT]
        }
    },
    "applicationdata/currentuser" : {
        "GET" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.ApplicationData,
            businessLogic: function ($) { return [applicationdata($).getCurrentUser] },
            privilege : [Privileges.BASE_ACCESS],
            isSessionRequired : false
        }
    },
    "applicationdata/languages" : {
        "GET" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.ApplicationData,
            businessLogic: function ($) { return [applicationdata($).getLanguages] },
            privilege : [Privileges.BASE_ACCESS],
            isSessionRequired : false
        }
    },
    "calculations" : {
        "GET" : {
            parameters: [ new UrlParameterInfo("project_id", "String", false),
                          new UrlParameterInfo("calculation_id", "String", false),
                          new UrlParameterInfo("topPerProject", "PositiveInteger", false),
                          new UrlParameterInfo("searchAutocomplete", "String", false),
                          new UrlParameterInfo("top", "PositiveInteger", false)],
            businessObjectType : BusinessObjectTypes.Calculation,
            businessLogic: function ($) { return [calculations($).get] },
            privilege : [Privileges.CALCULATIONS_READ]
        },
        "POST" : {
            parameters : [ urlParameterCalculationAction, new UrlParameterInfo("calculate", "Boolean", false), new UrlParameterInfo("id", "PositiveInteger", false),
                new UrlParameterInfo("compressedResult", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.Calculation,
            businessLogic: function ($) { return [calculations($).handlePostRequest] },
            privilege: {
                parameterName: "action",
                parameterPrivilegeMap: [{
                    parameterValues: ["create", "copy-version"],
                    // since create calculation also creates a version, enumeration attacks on the referenced masterdata by the version and the root item are possible;
                    // if a version got copied to a different controlling area, this is also possible for this operation; for this reason the action to create or copy
                    // a version requires read-privileges on all the potentially referenced masterdata of the versions
                    requiredPrivilege: [Privileges.CALCULATIONS_CREATE_UPDATE].concat(aEditCalculationVersionMasterdataPrivileges),
                    instancePrivilege: InstancePrivileges.CREATE_EDIT
                }]
            }
        },
        "DELETE" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Calculation,
            businessLogic: function ($) { return [calculations($).remove] },
            privilege : [Privileges.CALCULATIONS_DELETE],
            instancePrivilege : InstancePrivileges.FULL_EDIT
        },
        "PUT" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Calculation,
            businessLogic: function ($) { return [calculations($).update] },
            privilege : [Privileges.CALCULATIONS_CREATE_UPDATE],
            instancePrivilege : InstancePrivileges.CREATE_EDIT
        }
    },
    "calculated-results" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("id", "PositiveInteger", true), new UrlParameterInfo("calculate", "Boolean", false), new UrlParameterInfo("compressedResult", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.CalculatedResults,
            businessLogic: function ($) { return [calculatedResults($).get] },
            privilege : [Privileges.CALCULATION_VERSIONS_OPEN],
            instancePrivilege : InstancePrivileges.READ
        }
    },
    "calculation-versions" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("calculation_id", "String", false), new UrlParameterInfo("top", "PositiveInteger", false),
                           new UrlParameterInfo("project_id", "String", false),
                           new UrlParameterInfo("recently_used", "Boolean", false), new UrlParameterInfo("id", "PositiveInteger", false),
                           new UrlParameterInfo("loadMasterdata", "Boolean", false),
                           new UrlParameterInfo("current", "Boolean", false),
                           new UrlParameterInfo("search", "Boolean", false), new UrlParameterInfo("filter", "String", false),
                           new UrlParameterInfo("sortingColumn", "String", false), new UrlParameterInfo("sortingDirection", "String", false),
                           new UrlParameterInfo("omitItems", "Boolean", false), new UrlParameterInfo("returnLifecycle", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.CalculationVersion,
            businessLogic: function ($) { return [calculationVersions($).get] },
            privilege : [Privileges.CALCULATION_VERSIONS_OPEN]
        },
        "PUT" : {
            parameters : [ new UrlParameterInfo("calculate", "Boolean", false), new UrlParameterInfo("loadMasterdata", "Boolean", false),
                           new UrlParameterInfo("updateMasterdataTimestamp", "Boolean", false), new UrlParameterInfo("compressedResult", "Boolean", false),
                           new UrlParameterInfo("omitItems", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.CalculationVersion,
            businessLogic: function ($) { return [calculationVersions($).update] },
            // in order to prevent enumeration attacks on masterdata, editing calculation versions require read-privileges on referenced master data
            privilege : [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE].concat(aEditCalculationVersionMasterdataPrivileges),
            instancePrivilege : InstancePrivileges.CREATE_EDIT
        },
        "POST" : {
            parameters : [ urlParameterAction, new UrlParameterInfo("calculate", "Boolean", false),  new UrlParameterInfo("id", "PositiveInteger", false),
                           new UrlParameterInfo("loadMasterdata", "Boolean", false),  new UrlParameterInfo("compressedResult", "Boolean", false),
                           new UrlParameterInfo("omitItems", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.CalculationVersion,

            businessLogic: function ($) { return [calculationVersions($).handlePostRequest] },
            privilege : {
                parameterName : "action",
                parameterPrivilegeMap : [ {
                    parameterValues: ["copy", "save", "save-as" ],
                    requiredPrivilege : [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
                    instancePrivilege : InstancePrivileges.CREATE_EDIT
                },
                {
                    parameterValues: ["create"],
                    // enumeration attacks on masterdata are also possible for create of versions, since root items can reference masterdata;
                    // for this reason, read-privileges for potentially referenced masterdata are required
                    requiredPrivilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE].concat(aEditCalculationVersionMasterdataPrivileges),
                    instancePrivilege: InstancePrivileges.CREATE_EDIT
                },
                {
                    parameterValues : [ "open" ],
                    requiredPrivilege : [Privileges.CALCULATION_VERSIONS_OPEN],
                    instancePrivilege : InstancePrivileges.READ
                }, {
                    parameterValues : [ "close" ],
                    requiredPrivilege : [Privileges.CALCULATION_VERSIONS_OPEN]
                }, {
                    parameterValues : [ "freeze" ],
                    requiredPrivilege : [Privileges.CALCULATION_VERSIONS_FREEZE],
                    instancePrivilege : InstancePrivileges.FULL_EDIT
                }]
            }
        },
        "DELETE" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.CalculationVersion,
            businessLogic: function ($) { return [calculationVersions($).remove] },
            privilege : [Privileges.CALCULATION_VERSIONS_DELETE],
            instancePrivilege : InstancePrivileges.FULL_EDIT
        }
    },
    "calculation-versions/{calculation_version_id}": {
        pathVariables: [
            new UrlParameterInfo("calculation_version_id", "PositiveInteger", true)
        ],
        "GET": {
            parameters: [ new UrlParameterInfo(CalculationVersionParameters.expand.name, "String", true, CalculationVersionParameters.expand.values)],
            businessObjectType: BusinessObjectTypes.CalculationVersion,
            businessLogic: function ($) { return [calculationVersions($).getSingle] },
            privilege: [Privileges.CALCULATION_VERSIONS_OPEN],
            instancePrivilege : InstancePrivileges.READ
        },
        "PATCH": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.CalculationVersion,
            businessLogic: function ($) { return [calculationVersions($).patchSingle] },
            privilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
            instancePrivilege : InstancePrivileges.READ
        }
    },
    "calculation-versions/{calculation_version_id}/lifecycles": {
        pathVariables: [
            new UrlParameterInfo("calculation_version_id", "PositiveInteger", true)
        ],
        "GET": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.CalculationVersion,
            businessLogic: function ($) { return [calculationVersions($).get] },
            privilege: [Privileges.CALCULATION_VERSIONS_OPEN],
            instancePrivilege : InstancePrivileges.READ
        }
    },
    "calculation-versions/{calculation_version_id}/variants": {
        pathVariables: [
            new UrlParameterInfo("calculation_version_id", "PositiveInteger", true)
        ],
        "GET": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.Variant,
            businessLogic: function ($) { return [variants($).get] },
            privilege: [Privileges.CALCULATION_VERSIONS_OPEN],
            instancePrivilege : InstancePrivileges.READ
        },
        "PATCH": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.Variant,
            businessLogic: function ($) { return [variants($).updateVariantsOrder] },
            privilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
            instancePrivilege: InstancePrivileges.CREATE_EDIT
        },
        "POST": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.Variant,
            businessLogic: function ($) { return [variants($).createVariant] },
            privilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
            instancePrivilege: InstancePrivileges.CREATE_EDIT
        }
    },
    "calculation-versions/{calculation_version_id}/variant-calculator": {
        pathVariables: [
            new UrlParameterInfo("calculation_version_id", "PositiveInteger", true)
        ],
        "POST": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.VariantCalculator,
            businessLogic: function ($) { return [variantCalculator($).calculateTransient] },
            // POST triggers a transient calculation without changing any values; for this reason this operation is allowed with read privileges.
            privilege: [Privileges.CALCULATION_VERSIONS_OPEN],
            instancePrivilege: InstancePrivileges.READ
        }
    },
    "calculation-versions/{calculation_version_id}/variant-calculator/{variant_id}": {
        pathVariables: [
            new UrlParameterInfo("calculation_version_id", "PositiveInteger", true),
            new UrlParameterInfo("variant_id", "PositiveInteger", true),
        ],
        "PUT": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.VariantCalculator,
            businessLogic: function ($) { return [variantCalculator($).calculatePersistent] },
            privilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
            instancePrivilege: InstancePrivileges.CREATE_EDIT
        }
    },
    "calculation-versions/{calculation_version_id}/variant-calculator/calculate/sum": {
        pathVariables: [
            new UrlParameterInfo("calculation_version_id", "PositiveInteger", true),
        ],
        "POST": {
            parameters: [new UrlParameterInfo("persist", "Boolean", false)],
            businessObjectType: BusinessObjectTypes.VariantCalculator,
            businessLogic: function ($) { return [variantCalculator($).calculateSumVariant] },
            privilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
            instancePrivilege: InstancePrivileges.CREATE_EDIT
        }
    },
    "calculation-versions/{calculation_version_id}/variants/{variant_id}": {
        pathVariables: [
            new UrlParameterInfo("calculation_version_id", "PositiveInteger", true),
            new UrlParameterInfo("variant_id", "PositiveInteger", true),
        ],
        "GET": {
            parameters: [new UrlParameterInfo(CalculationVersionParameters.expand.name, "String", false, CalculationVersionParameters.expand.values)],
            businessObjectType: BusinessObjectTypes.Variant,
            businessLogic: function ($) { return [variants($).get] },
            instancePrivilege: InstancePrivileges.READ,
            privilege: [Privileges.CALCULATION_VERSIONS_OPEN]
        },
        "PATCH": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.Variant,
            businessLogic: function ($) { return [variants($).update] },
            privilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
            instancePrivilege: InstancePrivileges.CREATE_EDIT
        },
        "DELETE": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.Variant,
            businessLogic: function ($) { return [variants($).remove] },
            privilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
            instancePrivilege: InstancePrivileges.CREATE_EDIT
        }
    },
    "calculation-versions/{calculation_version_id}/variant-generator/{variant_id}": {
        pathVariables: [
            new UrlParameterInfo("calculation_version_id", "PositiveInteger", true),
            new UrlParameterInfo("variant_id", "PositiveInteger", true),
        ],
        "POST": {
            parameters: [new UrlParameterInfo("target_calculation_id", "PositiveInteger", false)],
            businessObjectType: BusinessObjectTypes.VariantGenerator,
            businessLogic: function ($) { return [variantGenerator($).generateCalculationVersion] },
            privilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE],
            instancePrivilege: InstancePrivileges.CREATE_EDIT
        }
    },
    "recover-calculation-versions" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("top", "PositiveInteger", false)],
            businessObjectType : BusinessObjectTypes.CalculationVersionRecover,
            businessLogic: function ($) { return [calculationVersions($).recover] },
            privilege : [Privileges.CALCULATION_VERSIONS_OPEN]
        }
    },
    "global-search" : {
        "GET" : {
            parameters : [ urlGlobalSearchSortedColumn , urlGlobalSearchSortedDirection ,
                           new UrlParameterInfo("filter", "String", false), urlGlobalSearchEntityType,
                           new UrlParameterInfo("top", "PositiveInteger", false)],
            businessObjectType : BusinessObjectTypes.GlobalSearch,
            businessLogic: function ($) { return [globalSearch($).get] },
            privilege : {
                parameterName : "type",
                parameterPrivilegeMap : [ {
                    parameterValues : [ "project" ],
                    requiredPrivilege : [Privileges.PROJECTS_READ]
                }, {
                    parameterValues : [ "calculation" ],
                    requiredPrivilege : [Privileges.CALCULATIONS_READ]
                },
                {
                    parameterValues : [ "calculationVersion" ],
                    requiredPrivilege : [Privileges.CALCULATION_VERSIONS_OPEN]
                },
                {
                    parameterValues : [ "all" ],
                    requiredPrivilege : [Privileges.PROJECTS_READ, Privileges.CALCULATIONS_READ, Privileges.CALCULATION_VERSIONS_OPEN]
                }]
            },
            isSessionRequired : false
        }
    },
    "items" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("getPrices", "Boolean", false),
                           new UrlParameterInfo("calculation_version_id", "PositiveInteger", true),
                           new UrlParameterInfo("id", "PositiveInteger", true)],
            businessObjectType : BusinessObjectTypes.Item,
            businessLogic: function ($) { return [items($).get] },
            privilege : [Privileges.MATERIAL_PRICE_READ, Privileges.ACTIVITY_PRICE_READ]
        },
        "PUT" : {
            parameters : [ new UrlParameterInfo("calculate", "Boolean", true),
                           new UrlParameterInfo("compressedResult", "Boolean", false), new UrlParameterInfo("omitItems", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.Item,
            businessLogic: function ($) { return [items($).update] },
            // in order to prevent enumeration attacks on masterdata, editing items require read-privileges on referenceable master data for versions
            privilege : [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE].concat(aEditCalculationVersionMasterdataPrivileges),
        },
        "POST" : {
            parameters : [ new UrlParameterInfo("calculate", "Boolean", true),
                           new UrlParameterInfo("mode", "String", true, ServiceParameters.mode.values),
                           new UrlParameterInfo("compressedResult", "Boolean", false),
                           new UrlParameterInfo("omitItems", "Boolean", false),
                           new UrlParameterInfo("noResponseBody", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.Item,
            businessLogic: function ($) { return [items($).create] },
            // in order to prevent enumeration attacks on masterdata, creating items require read-privileges on referenceable master data for versions
            privilege : [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE].concat(aEditCalculationVersionMasterdataPrivileges),
        },
        "DELETE" : {
            parameters : [ new UrlParameterInfo("calculate", "Boolean", true), new UrlParameterInfo("compressedResult", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.Item,
            businessLogic: function ($) { return [items($).remove] },
            privilege : [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE]
        }
    },
    "projects" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("filter", "String", false), new UrlParameterInfo("top", "PositiveInteger", false),
                           new UrlParameterInfo("searchAutocomplete", "String", false) , new UrlParameterInfo("folderId", "PositiveInteger", false)],
            businessObjectType : BusinessObjectTypes.Project,
            businessLogic: function ($) { return [projects($).get] },
            privilege : [Privileges.PROJECTS_READ, Privileges.FOLDER_READ]
        },
        "PUT" : {
            parameters : [ ],
            businessObjectType : BusinessObjectTypes.Project,
            businessLogic: function ($) { return [projects($).update] },
            // in order to prevent enumeration attacks on masterdata, editing projects require read-privileges on referenceable master data
            privilege : [Privileges.PROJECTS_UPDATE, Privileges.FOLDER_READ].concat(aEditProjectsMasterdataPrivileges),
            instancePrivilege : InstancePrivileges.CREATE_EDIT
        },
        "POST" : {
            parameters : [ new UrlParameterInfo("id", "String", false), new UrlParameterInfo("action", "String", true, _.values(constants.ProjectServiceParameters.action.values)),
            new UrlParameterInfo("overwriteManualVersions", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.Project,
            businessLogic: function ($) { return [projects($).handlePostRequest] },
            privilege : {
                parameterName : "action",
                parameterPrivilegeMap : [ {
                    parameterValues : [ "create"],
                    // in order to prevent enumeration attacks on masterdata, create projects require read-privileges on referenceable master data
                    requiredPrivilege : [Privileges.PROJECTS_CREATE, Privileges.FOLDER_READ].concat(aEditProjectsMasterdataPrivileges)
                }, {
                    parameterValues : [ "open" ],
                    requiredPrivilege : [Privileges.PROJECTS_OPEN],
                    instancePrivilege : InstancePrivileges.READ
                }, {
                    parameterValues : [ "close" ],
                    requiredPrivilege : [Privileges.PROJECTS_OPEN]
                }, {
                    parameterValues   : [ constants.ProjectServiceParameters.action.values.calculate_lifecycle_versions ],
                    // due to the changed masterdata data timestamp of calculated lifecycle versions, enumeration attacks on masterdata are possible
                    // (when masterdata was created in the future); for this reason read-privileges on potential referenced masterdata are required
                    requiredPrivilege: [Privileges.CALCULATION_VERSIONS_CREATE_UPDATE].concat(aEditCalculationVersionMasterdataPrivileges),
                    instancePrivilege : InstancePrivileges.CREATE_EDIT
                }]
            }
        },
        "DELETE" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Project,
            businessLogic: function ($) { return [projects($).remove] },
            privilege : [Privileges.PROJECTS_DELETE, Privileges.FOLDER_READ],
            instancePrivilege : InstancePrivileges.FULL_EDIT

        }
    },
    "projects/activity-price-surcharges" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("id", "String", true) ],
            businessObjectType : BusinessObjectTypes.ProjectActivityPriceSurcharges,
            businessLogic: function ($) { return [projects($).getActivityPriceSurcharges] },
            privilege : [Privileges.PROJECTS_READ],
            instancePrivilege : InstancePrivileges.READ
        },
        "PUT" : {
            parameters : [ new UrlParameterInfo("id", "String", true) ],
            businessObjectType : BusinessObjectTypes.ProjectActivityPriceSurcharges,
            businessLogic: function ($) { return [projects($).updateActivityPriceSurcharges] },
            // when defining activity type surcharges enumeration attacks on used masterdata are possible; for this reason, this operation requires
            // read-privileges on all masterdata referenceable masterdata
            privilege : [Privileges.PROJECTS_UPDATE].concat(aEditProjectsMasterdataPrivileges),
            instancePrivilege : InstancePrivileges.CREATE_EDIT
        }
    },
    "projects/material-price-surcharges" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("id", "String", true) ],
            businessObjectType : BusinessObjectTypes.ProjectMaterialPriceSurcharges,
            businessLogic: function ($) { return [projects($).getMaterialPriceSurcharges] },
            privilege : [Privileges.PROJECTS_READ],
            instancePrivilege : InstancePrivileges.READ
        },
        "PUT" : {
            parameters : [ new UrlParameterInfo("id", "String", true) ],
            businessObjectType : BusinessObjectTypes.ProjectMaterialPriceSurcharges,
            businessLogic: function ($) { return [projects($).updateMaterialPriceSurcharges] },
            // when defining material-based surcharges enumeration attacks on used masterdata are possible (account group, ...)
            // for this reason, this operation requires read-privileges on all masterdata referenceable masterdata
            privilege: [Privileges.PROJECTS_UPDATE].concat(aEditProjectsMasterdataPrivileges),
            instancePrivilege : InstancePrivileges.CREATE_EDIT
        }
    },
    "privileges" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("entity_type", "String", true, [ "Project" ]), new UrlParameterInfo("entity_id", "String", true) ],
            businessObjectType : BusinessObjectTypes.Privilege,
            businessLogic: function ($) { return [privilege($).get] },
            privilege : [Privileges.PROJECTS_OPEN],
            instancePrivilege : InstancePrivileges.READ

        },
        "POST" : {
            parameters : [ ],
            businessObjectType : BusinessObjectTypes.Privilege,
            businessLogic: function ($) { return [privilege($).edit] },
            privilege : [Privileges.PROJECTS_OPEN],
            instancePrivilege : InstancePrivileges.ADMINISTRATE
        }
    },
    "groups": {
        "GET": {
            parameters: [new UrlParameterInfo("id", "String", false), new UrlParameterInfo("lock", "Boolean", false),
                         new UrlParameterInfo("searchAutocomplete", "String", false), ],
            businessObjectType: BusinessObjectTypes.Group,
            businessLogic: function ($) { return [group($).get] },
            privilege: [Privileges.GROUPS_READ]
        },
        "POST": {
            parameters: [],
            businessObjectType: BusinessObjectTypes.Group,
            businessLogic: function ($) { return [group($).edit] },
            privilege: [Privileges.GROUPS_EDIT]
        }
    },
    "layouts" : {
        "GET" : {
                parameters : [new UrlParameterInfo("layout_type", "PositiveInteger", false)],
                businessObjectType : BusinessObjectTypes.Layout,
                businessLogic: function ($) { return [layout($).get] },
                privilege : [Privileges.BASE_ACCESS],
                isSessionRequired : false
              },
        "POST" : {
                parameters : [new UrlParameterInfo("is_corporate", "Boolean", true)],
                businessObjectType : BusinessObjectTypes.Layout,
                businessLogic: function ($) { return [layout($).create] },
                privilege : {
                    parameterName : "is_corporate",
                    parameterPrivilegeMap : [ {
                        parameterValues : ["true"],
                        requiredPrivilege : [Privileges.CORPORATE_LAYOUT_EDIT]
                    },
                    {
                        parameterValues : ["false"],
                        requiredPrivilege : [Privileges.BASE_ACCESS]
                    },
                    ]
                },
                isSessionRequired : false
            },
        "DELETE" : {
                parameters : [new UrlParameterInfo("is_corporate", "Boolean", true)],
                businessObjectType : BusinessObjectTypes.Layout,
                businessLogic: function ($) { return [layout($).remove] },
                privilege : {
                    parameterName : "is_corporate",
                    parameterPrivilegeMap : [ {
                        parameterValues : ["true"],
                        requiredPrivilege : [Privileges.CORPORATE_LAYOUT_EDIT]
                    },
                    {
                        parameterValues : ["false"],
                        requiredPrivilege : [Privileges.BASE_ACCESS]
                    },
                    ]
                },
                isSessionRequired : false
            },
        "PUT" : {
                parameters : [new UrlParameterInfo("is_corporate", "Boolean", true)],
                businessObjectType : BusinessObjectTypes.Layout,
                businessLogic: function ($) { return [layout($).update] },
                privilege : {
                    parameterName : "is_corporate",
                    parameterPrivilegeMap : [ {
                        parameterValues : ["true"],
                        requiredPrivilege : [Privileges.CORPORATE_LAYOUT_EDIT]
                    },
                    {
                        parameterValues : ["false"],
                        requiredPrivilege : [Privileges.BASE_ACCESS]
                    },
                    ]
                },
                isSessionRequired : false
            },
        },
    "frontend-settings" : {
        "GET" : {
                parameters : [new UrlParameterInfo("type", "String", true)],
                businessObjectType : BusinessObjectTypes.FrontendSettings,
                businessLogic: function ($) { return [frontendSettings($).get] },
                privilege : [Privileges.BASE_ACCESS]
              },
        "POST" : {
                parameters : [new UrlParameterInfo("is_corporate", "Boolean", true)],
                businessObjectType : BusinessObjectTypes.FrontendSettings,
                businessLogic : function ($) {return [ frontendSettings($).create ]},
                privilege : {
                    parameterName : "is_corporate",
                    parameterPrivilegeMap : [ {
                        parameterValues : ["true"],
                        requiredPrivilege : [Privileges.FRONTEND_SETTINGS_CORPORATE_EDIT]
                        },
                        {
                        parameterValues : ["false"],
                        requiredPrivilege : [Privileges.BASE_ACCESS]
                        }
                    ]
                }
            },
        "DELETE" : {
                parameters : [new UrlParameterInfo("is_corporate", "Boolean", true)],
                businessObjectType : BusinessObjectTypes.FrontendSettings,
                businessLogic: function ($) {return [ frontendSettings($).remove ]},
                privilege : {
                    parameterName : "is_corporate",
                    parameterPrivilegeMap : [ {
                        parameterValues : ["true"],
                        requiredPrivilege : [Privileges.FRONTEND_SETTINGS_CORPORATE_EDIT]
                        },
                        {
                        parameterValues : ["false"],
                        requiredPrivilege : [Privileges.BASE_ACCESS]
                        }
                    ]
                }
            },
        "PUT" : {
            parameters : [new UrlParameterInfo("is_corporate", "Boolean", true)],
            businessObjectType : BusinessObjectTypes.FrontendSettings,
            businessLogic: function ($) { return [frontendSettings($).update] },
            privilege : {
                parameterName : "is_corporate",
                parameterPrivilegeMap : [ {
                        parameterValues : ["true"],
                        requiredPrivilege : [Privileges.FRONTEND_SETTINGS_CORPORATE_EDIT]
                        },
                        {
                        parameterValues : ["false"],
                        requiredPrivilege : [Privileges.BASE_ACCESS]
                        }
                    ]
                }
            }
        },
    "masterdata": {
        "GET": {
            parameters: [new UrlParameterInfo("calculation_version_id", "PositiveInteger", true)],
            businessObjectType: BusinessObjectTypes.Masterdata,
            businessLogic: function ($) { return [masterdata($).getMasterdata] },
            instancePrivilege: InstancePrivileges.READ,
            privilege: [Privileges.CALCULATION_VERSIONS_OPEN].concat(aEditCalculationVersionMasterdataPrivileges)
        }
    },
    "administration" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("business_object", "String", true), new UrlParameterInfo("filter", "String", false),
                    new UrlParameterInfo("top", "PositiveInteger", false), new UrlParameterInfo("searchAutocomplete", "String", false),
                    new UrlParameterInfo("lock", "Boolean", false), new UrlParameterInfo("masterdataTimestamp", "UTCTimestamp", false),
                    new UrlParameterInfo("skip", "PositiveInteger", false)],
            businessObjectType : BusinessObjectTypes.Administration,
            businessLogic: function ($) { return [administration($).get] },
            privilege : {
                parameterName : "business_object",
                parameterPrivilegeMap : [ {
                    parameterValues : [ MasterDataObjectTypes.CurrencyConversion ],
                    requiredPrivilege : [Privileges.CURRENCY_CONVERSION_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Account ],
                    requiredPrivilege : [Privileges.ACCOUNT_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.AccountGroup ],
                    requiredPrivilege : [Privileges.ACCOUNT_GROUP_READ, Privileges.ACCOUNT_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.MaterialAccountDetermination ],
                    requiredPrivilege : [Privileges.MATERIAL_ACCOUNT_DETERMINATION_READ, Privileges.CONTROLLING_AREA_READ, Privileges.MATERIAL_TYPE_READ, Privileges.PLANT_READ, Privileges.COMPANY_CODE_READ, Privileges.VALUATION_CLASS_READ, Privileges.ACCOUNT_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.OverheadGroup ],
                    requiredPrivilege : [Privileges.OVERHEAD_GROUP_READ, Privileges.PLANT_READ, Privileges.COMPANY_CODE_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ValuationClass ],
                    requiredPrivilege : [Privileges.VALUATION_CLASS_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Process ],
                    requiredPrivilege : [Privileges.PROCESS_READ, Privileges.CONTROLLING_AREA_READ, Privileges.ACCOUNT_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.CostingSheet ],
                    requiredPrivilege : [Privileges.COSTING_SHEET_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.CostingSheetRow ],
                    requiredPrivilege : [Privileges.COSTING_SHEET_READ, Privileges.CONTROLLING_AREA_READ, Privileges.ACCOUNT_GROUP_READ, Privileges.ACCOUNT_READ, Privileges.COMPANY_CODE_READ, Privileges.BUSINESS_AREA_READ, Privileges.PROFIT_CENTER_READ, Privileges.PLANT_READ, Privileges.OVERHEAD_GROUP_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ComponentSplit ],
                    requiredPrivilege : [Privileges.COMPONENT_SPLIT_READ, Privileges.ACCOUNT_GROUP_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Plant ],
                    requiredPrivilege : [Privileges.PLANT_READ, Privileges.COMPANY_CODE_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.WorkCenter ],
                    requiredPrivilege : [Privileges.WORK_CENTER_READ, Privileges.CONTROLLING_AREA_READ, Privileges.COST_CENTER_READ, Privileges.PLANT_READ, Privileges.COMPANY_CODE_READ, Privileges.PROCESS_READ, Privileges.ACTIVITY_TYPE_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.MaterialType ],
                    requiredPrivilege : [Privileges.MATERIAL_TYPE_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.MaterialGroup ],
                    requiredPrivilege : [Privileges.MATERIAL_GROUP_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Material ],
                    requiredPrivilege : [Privileges.MATERIAL_READ, Privileges.MATERIAL_GROUP_READ, Privileges.MATERIAL_TYPE_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.MaterialPlant ],
                    requiredPrivilege : [Privileges.MATERIAL_PLANT_READ, Privileges.MATERIAL_READ, Privileges.PLANT_READ, Privileges.OVERHEAD_GROUP_READ, Privileges.VALUATION_CLASS_READ, Privileges.COMPANY_CODE_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Document ],
                    requiredPrivilege : [Privileges.DOCUMENT_READ, Privileges.DOCUMENT_TYPE_READ, Privileges.DOCUMENT_STATUS_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.DocumentType ],
                    requiredPrivilege : [Privileges.DOCUMENT_TYPE_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Customer ],
                    requiredPrivilege : [Privileges.CUSTOMER_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Vendor ],
                    requiredPrivilege : [Privileges.VENDOR_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ControllingArea ],
                    requiredPrivilege : [Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.CompanyCode ],
                    requiredPrivilege : [Privileges.COMPANY_CODE_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ProfitCenter ],
                    requiredPrivilege : [Privileges.PROFIT_CENTER_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.BusinessArea ],
                    requiredPrivilege : [Privileges.BUSINESS_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.CostCenter ],
                    requiredPrivilege : [Privileges.COST_CENTER_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ActivityType ],
                    requiredPrivilege : [Privileges.ACTIVITY_TYPE_READ, Privileges.ACCOUNT_READ, Privileges.CONTROLLING_AREA_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Language ],
                    requiredPrivilege : [Privileges.BASE_ACCESS]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Currency ],
                    requiredPrivilege : [Privileges.BASE_ACCESS]
                }, {
                    parameterValues : [ MasterDataObjectTypes.UnitOfMeasure ],
                    requiredPrivilege : [Privileges.BASE_ACCESS]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ExchangeRateType ],
                    requiredPrivilege : [Privileges.BASE_ACCESS]
                }, {
                    parameterValues : [ MasterDataObjectTypes.SalesOrganization ],
                    requiredPrivilege : [Privileges.SALES_ORGANIZATION_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ConfidenceLevel ],
                    requiredPrivilege : [Privileges.CONFIDENCE_LEVEL_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.DocumentStatus ],
                    requiredPrivilege : [Privileges.DOCUMENT_STATUS_READ, Privileges.DOCUMENT_TYPE_READ]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Dimension ],
                    requiredPrivilege : [Privileges.BASE_ACCESS]
                }, {
                    parameterValues : [ MasterDataObjectTypes.DesignOffice ],
                    requiredPrivilege : [Privileges.DOCUMENT_READ]
                }
                ]
            }
        },
        "POST" : {
            parameters : [ new UrlParameterInfo("business_object", "String", true), new UrlParameterInfo("ignoreBadData", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.Administration,
            businessLogic: function ($) { return [administration($).edit] },
            privilege : {
                parameterName : "business_object",
                parameterPrivilegeMap : [ {
                    parameterValues : [ MasterDataObjectTypes.CurrencyConversion ],
                    requiredPrivilege : [Privileges.CURRENCY_CONVERSION_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Account ],
                    requiredPrivilege : [Privileges.ACCOUNT_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.AccountGroup ],
                    requiredPrivilege : [Privileges.ACCOUNT_GROUP_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.MaterialAccountDetermination ],
                    requiredPrivilege : [Privileges.MATERIAL_ACCOUNT_DETERMINATION_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.OverheadGroup ],
                    requiredPrivilege : [Privileges.OVERHEAD_GROUP_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ValuationClass ],
                    requiredPrivilege : [Privileges.VALUATION_CLASS_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Process ],
                    requiredPrivilege : [Privileges.PROCESS_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.CostingSheet, MasterDataObjectTypes.CostingSheetRow ],
                    requiredPrivilege : [Privileges.COSTING_SHEET_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ComponentSplit ],
                    requiredPrivilege : [Privileges.COMPONENT_SPLIT_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Plant ],
                    requiredPrivilege : [Privileges.PLANT_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.WorkCenter ],
                    requiredPrivilege : [Privileges.WORK_CENTER_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.MaterialType ],
                    requiredPrivilege : [Privileges.MATERIAL_TYPE_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.MaterialGroup ],
                    requiredPrivilege : [Privileges.MATERIAL_GROUP_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Material ],
                    requiredPrivilege : [Privileges.MATERIAL_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.MaterialPlant ],
                    requiredPrivilege : [Privileges.MATERIAL_PLANT_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Document ],
                    requiredPrivilege : [Privileges.DOCUMENT_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.DocumentType ],
                    requiredPrivilege : [Privileges.DOCUMENT_TYPE_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Customer ],
                    requiredPrivilege : [Privileges.CUSTOMER_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Vendor ],
                    requiredPrivilege : [Privileges.VENDOR_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ControllingArea ],
                    requiredPrivilege : [Privileges.CONTROLLING_AREA_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.CompanyCode ],
                    requiredPrivilege : [Privileges.COMPANY_CODE_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ProfitCenter ],
                    requiredPrivilege : [Privileges.PROFIT_CENTER_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.BusinessArea ],
                    requiredPrivilege : [Privileges.BUSINESS_AREA_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.CostCenter ],
                    requiredPrivilege : [Privileges.COST_CENTER_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ActivityType ],
                    requiredPrivilege : [Privileges.ACTIVITY_TYPE_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Language ],
                    requiredPrivilege : [Privileges.LANGUAGE_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.Currency ],
                    requiredPrivilege : [Privileges.CURRENCY_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.UnitOfMeasure ],
                    requiredPrivilege : [Privileges.UNIT_OF_MEASURE_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.ExchangeRateType ],
                    requiredPrivilege : [Privileges.EXCHANGE_RATE_TYPE_EDIT]
                }, {
                    parameterValues : [ MasterDataObjectTypes.SalesOrganization ],
                    requiredPrivilege : [Privileges.SALES_ORGANIZATION_EDIT]
                }]
            }
        }
    },

    "ping" : {
        "GET" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Ping,
            businessLogic: function ($) { return [ping($).get] },
            privilege : [Privileges.BASE_ACCESS]
        }
    },
    "customfieldsformula" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("path", "String", false), new UrlParameterInfo("business_object", "String", false),
                    new UrlParameterInfo("column", "String", false), new UrlParameterInfo("is_custom", "Boolean", false), new UrlParameterInfo("lock", "Boolean", false) ],
            businessObjectType : BusinessObjectTypes.Customfieldsformula,
            businessLogic: function ($) { return [metadata($).get] },
            privilege : [Privileges.BASE_ACCESS]
        },
        "POST" : {
            parameters : [ new UrlParameterInfo("checkCanExecute", "Boolean", false)],
            businessObjectType : BusinessObjectTypes.Customfieldsformula,
            businessLogic: function ($) { return [metadata($).setLockOnMetadataObj] },
            privilege : [Privileges.CUSTOM_FIELDS_FORMULA_CREATE_UPDATE]
        }
    },
    "lock" : {
        "DELETE" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.Lock,
            businessLogic: function ($) { return [lock($).remove] },
            privilege : [Privileges.BASE_ACCESS]
        }
    },
    "default-settings" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("type", "String", true), new UrlParameterInfo("lock", "Boolean", false) ],
            businessObjectType : BusinessObjectTypes.DefaultSettings,
            businessLogic: function ($) { return [defaultSettings($).get] },
            privilege : [Privileges.BASE_ACCESS]
        },
        "POST" : {
            parameters : [ new UrlParameterInfo("type", "String", true) ],
            businessObjectType : BusinessObjectTypes.DefaultSettings,
            businessLogic: function ($) { return [defaultSettings($).create] },
            privilege : {
                parameterName : "type",
                parameterPrivilegeMap : [ {
                    parameterValues : [ "global" ],
                    requiredPrivilege : [Privileges.GLOBAL_DEFAULT_SETTINGS_EDIT]
                }, {
                    parameterValues : [ "user" ],
                    requiredPrivilege : [Privileges.USER_DEFAULT_SETTINGS_EDIT]
                } ]
            }
        },
        "PUT" : {
            parameters : [ new UrlParameterInfo("type", "String", true) ],
            businessObjectType : BusinessObjectTypes.DefaultSettings,
            businessLogic: function ($) { return [defaultSettings($).update] },
            privilege : {
                parameterName : "type",
                parameterPrivilegeMap : [ {
                    parameterValues : [ "global" ],
                    requiredPrivilege : [Privileges.GLOBAL_DEFAULT_SETTINGS_EDIT]
                }, {
                    parameterValues : [ "user" ],
                    requiredPrivilege : [Privileges.USER_DEFAULT_SETTINGS_EDIT]
                } ]
            }
        },
        "DELETE" : {
            parameters : [ new UrlParameterInfo("type", "String", true) ],
            businessObjectType : BusinessObjectTypes.DefaultSettings,
            businessLogic: function ($) { return [defaultSettings($).remove] },
            privilege : {
                parameterName : "type",
                parameterPrivilegeMap : [ {
                    parameterValues : [ "global" ],
                    requiredPrivilege : [Privileges.GLOBAL_DEFAULT_SETTINGS_EDIT]
                }, {
                    parameterValues : [ "user" ],
                    requiredPrivilege : [Privileges.USER_DEFAULT_SETTINGS_EDIT]
                } ]
            }
        }
    },
    "transportation": {
        "GET": {
            parameters: [new UrlParameterInfo("businessObjects", "String", true, ["customizing"])],
            businessObjectType: BusinessObjectTypes.Transportation,
            businessLogic: function ($) { return [transportation($).exportData] },
            privilege: [Privileges.TRANSPORTATION_EXPORT],
            isSessionRequired: false
        },
        "POST": {
            parameters: [new UrlParameterInfo("mode", "String", true, ["replace", "append"])],
            businessObjectType: BusinessObjectTypes.Transportation,
            businessLogic: function ($) { return [transportation($).createTaskAndProvideFollowUp] },
            privilege: [Privileges.TRANSPORTATION_IMPORT],
            isSessionRequired: false
        }
    },
    "tasks" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("id", "Integer", false) ],
            businessObjectType : BusinessObjectTypes.Task,
            businessLogic: function ($) { return [task($).get] },
            privilege : [Privileges.TASKS_READ],
            isSessionRequired: false
        }
    },
    "plc-users" : {
        "GET" : {
            parameters : [ new UrlParameterInfo("searchAutocomplete", "String", false), new UrlParameterInfo("top", "Integer", false)],
            businessObjectType : BusinessObjectTypes.PlcUsers,
            businessLogic: function ($) { return [plcUsers($).get] },
            privilege : [Privileges.USERS_READ]
        }
    },
    "data-protection" : {
        "DELETE" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.DataProtection,
            businessLogic: function ($) { return [dataProtection($).remove] },
            privilege : [Privileges.PERSONAL_DATA_DELETE],
            isSessionRequired: false
        },
        "POST" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.DataProtection,
            businessLogic: function ($) { return [dataProtection($).post] },
            privilege : [Privileges.PERSONAL_DATA_READ],
            isSessionRequired: false
        }
    },
    "retention-periods" : {
        "GET" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.RetentionPeriods,
            businessLogic: function ($) { return [retentionPeriods($).get] },
            privilege : [Privileges.RETENTION_PERIODS_READ],
            isSessionRequired: false
          },
        "POST" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.RetentionPeriods,
            businessLogic: function ($) { return [retentionPeriods($).create] },
            privilege : [Privileges.RETENTION_PERIODS_EDIT],
            isSessionRequired: false
        },
        "PUT" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.RetentionPeriods,
            businessLogic: function ($) { return [retentionPeriods($).update] },
            privilege : [Privileges.RETENTION_PERIODS_EDIT],
            isSessionRequired: false
        },
        "DELETE" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.RetentionPeriods,
            businessLogic: function ($) { return [retentionPeriods($).remove] },
            privilege : [Privileges.RETENTION_PERIODS_EDIT],
            isSessionRequired: false
        }
    },
    "similar-parts-search" : {
        "POST" : {
            parameters : [],
            businessObjectType : BusinessObjectTypes.SimilarPartsSearch,
            businessLogic: function ($) { return [similarPartsSearch($).handlePostRequest] },
            privilege : [ Privileges.CALCULATIONS_READ,
                          Privileges.CALCULATION_VERSIONS_OPEN,
                          Privileges.MATERIAL_READ,
                          Privileges.MATERIAL_PRICE_READ,
                          Privileges.VENDOR_READ,
                          Privileges.CUSTOMER_READ,
                          Privileges.PROJECTS_READ ]
        }
    }
});

// Prepare the parameters for Dispatcher.
module.exports.prepareDispatch = function ($) {
    // Get a DB connection and initialize persistency layer
    let Connection = new (require("../db/connection/connection")).ConnectionFactory($);
    let Persistency = $.import("xs.db", "persistency").Persistency;
    let persistency = new Persistency(Connection.getConnection());
    return {
        xsjsContext: $,
        Connection: Connection,
        persistency: persistency
    };
}

//NOTE (RF): oValidator only present to enable unit testing; maybe there is a better option to inject?
function Dispatcher(oContext, oRequest, oResponse, oValidator) {
	const $ = oContext.xsjsContext;
	$.getPlcUsername = () => ($.session.getUsername() || 'TECHNICAL_USER');
	const Connection = oContext.Connection;
    const persistency = oContext.persistency;
    const Resources = module.exports.Resources; // Resources can be mocked in testing

	this.dispatch = function(doCommit) {
		var oServiceOutput = new ServiceOutput();

		// set commit mode in connection
		Connection.bCommitMode = doCommit;

		try {
            persistency.Session.clearTemporaryTables($.getPlcUsername());
		   	execute(oRequest, oServiceOutput, doCommit);
			oServiceOutput.setStatus(oServiceOutput.status || $.net.http.OK);

			let oFollowUp = oServiceOutput.getFollowUp();
			if(!Helpers.isNullOrUndefined(oFollowUp)){
				oResponse.followUp(oFollowUp);
			}

			if (doCommit) {
				persistency.getConnection().commit();
			}
		} catch (e) { // catch known type of error / message
			if (e instanceof PlcException) {
				const oMessage = PlcMessage.fromPlcException(e);
				if(oMessage.code !== Code.BATCH_OPPERATION_ERROR.code){
				    //for  masterdata we need to deliver more messages
				    oServiceOutput.clearMessages().addMessage(oMessage);
				}
				oServiceOutput.setStatus(e.code.responseCode || $.net.http.INTERNAL_SERVER_ERROR);
			} else {
                const sLogMessage = `Unexpected error occurred: ${e.message || e.msg || e} - stack: ${e.stack || '' }`;
				$.trace.error(sLogMessage);
				const oMessage = new PlcMessage(Code.GENERAL_UNEXPECTED_EXCEPTION, Severity.ERROR);
				oServiceOutput.clearMessages().addMessage(oMessage);
				oServiceOutput.setStatus(Code.GENERAL_UNEXPECTED_EXCEPTION.responseCode);
			}
		} finally {
			setResponse(oResponse, oServiceOutput);
			var conn = persistency.getConnection();
			if (conn && _.isFunction(conn.close)) {
				conn.close();
			}
		}
	};

	function execute(oRequest, oServiceOutput,doCommit) {
		const sRequestedResource = oRequest.queryPath || ""; // fall-back only needed for tests, if they define queryPath as null/undefinded
		let sResourceDefinitionKey = null; // e.g. "/calculation-versions/{calculation_version_id}"
		// definition for pathVariables and all supported methods;e.g. object bound to the object key
		// "/calculation-versions/{calculation_version_id}"
		let oResourceDefinition = null;

		// since path variables are supported by the dispatcher, there needs to be no direct match
		// definition in Resources and the query path of the request
		// the following codes implements the mapping between resource definitions with path variables and the
		// concreate requested resource: /calculation-versions/1 => /calculation-versions/{calculation_version_id}
		const aRequestSegments = sRequestedResource.split("/");
		const sTopLevelResource = aRequestSegments[0];
		// in oder to limit the amount of more complex checks (below), the list of all resource definitions is narrowed down
		// to a list of potential matches; for this
		// 	1. all resource definitions (Object.keys(Resources)) are filtered if the definition starts with the name of sTopLevelResource
		//  2. the filtered definitions are split by the path separator "/" (map)
		//  3. only definitions which have the same amount of segments as the request (2nd filter)
		const aPotentialResourcePaths = Object.keys(Resources).filter(sDefinitionName => sDefinitionName.startsWith(sTopLevelResource))
			.map(sDefinitionName => sDefinitionName.split("/"))
			.filter(aDefinitionSegments => aDefinitionSegments.length === aRequestSegments.length);

		// after determining the potential definitions for the request, every potential match is investigated if the request can be mapped
		// to it; the requested URL /calculation-versions/1 must be mapped to the definition /calculation-versions/{calculation_version_id};
		// for this each segment of the requested URL is investigated and checked if the segment correspond to the same segment of the
		// potential definition or is a path variable
		aPotentialResourcePaths.forEach(aDefinitionSegments => {
			let aPotentialMatch = aDefinitionSegments;

			aDefinitionSegments.forEach((sSegment, iIndex) => {
				const bResourceMatch = sSegment === aRequestSegments[iIndex];
				const bIsPathVariable = sSegment.startsWith("{") && sSegment.endsWith("}");
				if (bResourceMatch === false && bIsPathVariable === false) {
					aPotentialMatch = null;
				}
			});

			if (aPotentialMatch !== null) {
				if (oResourceDefinition == null) {
					const sDefinitionKey = aPotentialMatch.join("/");
					oResourceDefinition = Resources[sDefinitionKey];
					sResourceDefinitionKey = sDefinitionKey;
				} else {
					const sDeveloperInfo = `Found more than one matching resource definitions for ${aPotentialMatch.join("/")}`;
					$.trace.error(sDeveloperInfo);
					throw new PlcException(Code.GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR, sDeveloperInfo);
				}
			}
		});

		if (oResourceDefinition === null) {
			const sLogMessage = `Service resource not found: ${sRequestedResource}`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR, sLogMessage);
		}

		const sRequestMethod = HttpMethodMapping[oRequest.method];
		if(Helpers.isNullOrUndefined(sRequestMethod)){
			const  sLogMessage = `Unknown request method ${oRequest.method}`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_METHOD_NOT_ALLOWED_ERROR, sLogMessage);
		}
		if (!_.has(oResourceDefinition, sRequestMethod)) {
			const sLogMessage = `Method ${oRequest.method} not allowed for resource ${sResourceDefinitionKey}`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_METHOD_NOT_ALLOWED_ERROR, sLogMessage);
		}

		// in contrast to oResourceDefinition, the request definition is the definition for a concrete HTTP method;
		// all further processing bases on oRequestDefinition
		const oRequestDefinition = oResourceDefinition[sRequestMethod];

        // update last activity for user only in cloud environment
        if (isCloud()){
            updateUserActivity();
        }
		//update Last Activity Time in the session table, if service requires a session to be in place, otherwise skip this step
		if (oRequestDefinition.isSessionRequired !== false) {
		    updateActivityTime();
		}
		if (doCommit) {
			//commit to not lock the user record in the t_session table for the whole transaction. This enables handling multiple requests of a user in parallel.
			persistency.getConnection().commit();
		}

		const LibValidator = $.import("xs.validator", "validator");
		const ValidatorInput = LibValidator.ValidatorInput;
		const Validator = LibValidator.Validator;
		var oValidatorInput = new ValidatorInput(oRequest, sResourceDefinitionKey);
		var validator = oValidator || new Validator(persistency, $.getPlcUsername(), Resources);
		var oValidatedRequestContent = validator.validate(oValidatorInput, oServiceOutput);

		// privilege checks
		var oPrivileges = getRequiredPrivileges(oRequestDefinition, oRequest.parameters);
		checkPrivilege(oPrivileges.privilege);
		checkInstancePrivilege(oPrivileges.instancePrivilege, oRequestDefinition.businessObjectType, oValidatedRequestContent);

		// check if system is locked
        var aLockUsers = persistency.Misc.getLockingUsers(BusinessObjectTypes.Metadata, $.getPlcUsername());
        var { bIsThereAnyActiveTask, oActiveTaskSessionId } = persistency.Task.isTaskInProgress(constants.TaskType.METADATA_CUSTOM_FIELDS);
		if ( aLockUsers.length > 0 || bIsThereAnyActiveTask ) {

            if ((oRequest.queryPath === "tasks" &&  $.getPlcUsername() === oActiveTaskSessionId) === false)
            {
                var oMessageDetails = new MessageDetails();
                const sLogMessage = `System is locked for custom field operations: ${$.net.http.SERVICE_UNAVAILABLE}.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.SERVICE_UNAVAILABLE_ERROR, sLogMessage, oMessageDetails);
            }
		}

        persistency.Task.cancelTasksWithStatusAndLastUpdatedOlderThan(constants.TaskStatus.INACTIVE, constants.TaskType.METADATA_CUSTOM_FIELDS,  30);

		// call business logic and add content to service output
		_.forEach(oRequestDefinition.businessLogic($), function(fCallback, iIndex) {
			fCallback.call(this, oValidatedRequestContent.data, oValidatedRequestContent.parameters, oServiceOutput, persistency);
		});

        CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, persistency,
            $.getPlcUsername(), $.getPlcUsername());

		return oServiceOutput;
	}

	function getRequiredPrivileges(oRequestDefinition, aParameters) {
		if (Helpers.isNullOrUndefined(oRequestDefinition.privilege)) {
			throw new new InternalException("privileges not defined" + $.net.http.INTERNAL_SERVER_ERROR, 500);
		}
		var aPrivilege;
		var sInstancePrivilege;
		if (oRequestDefinition.privilege.parameterName !== undefined) {
			_.each(aParameters, function(parameter) {
				if (parameter.name === oRequestDefinition.privilege.parameterName) {
					_.each(oRequestDefinition.privilege.parameterPrivilegeMap, function(mapping) {
						if (_.includes(Helpers.arrayToLowerCase(mapping.parameterValues), parameter.value.toLowerCase())) {
							aPrivilege = mapping.requiredPrivilege;
							sInstancePrivilege = mapping.instancePrivilege;
						}
					});
				}
			});
			if (Helpers.isNullOrUndefined(aPrivilege)) {
				const sLogMessage = `Parameter '${oRequestDefinition.privilege.parameterName}' not set or set with invalid value. 
				    Required privilege cannot be determined ${$.net.http.INTERNAL_SERVER_ERROR}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, "Invalid Request");
			}
		} else {
			aPrivilege = oRequestDefinition.privilege;
			sInstancePrivilege = oRequestDefinition.instancePrivilege;
		}
		return { privilege : aPrivilege,
				 instancePrivilege : sInstancePrivilege
			   };
	}

	function checkPrivilege(aPrivilege) {
		if (Helpers.isNullOrUndefined(aPrivilege) || !_.isArray(aPrivilege)) {
			const sLogMessage = "aPrivilege must be an array.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		if (aPrivilege.length === 0) {
			const sLogMessage = "aPrivilege must be a non-empty array.";
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		_.each(aPrivilege, function(sPrivilege, iIndex) {
			if (!$.session.hasAppPrivilege(sPrivilege)) {
				const sClientMsg = `User does not have the required privilege.`;
				const sServerMsg = `${sClientMsg} User: ${$.getPlcUsername()}, required privilege: ${sPrivilege}.`;
				$.trace.error(sServerMsg);
				throw new PlcException(Code.GENERAL_ACCESS_DENIED, sClientMsg);
			}
		});
	}

	function checkInstancePrivilege(sInstancePrivilege, sRequestBusinessObjectType, oRequestContent) {
		if (sInstancePrivilege !== undefined) {
			var sBusinessObjectId;
			var sBusinessObjectType;
			// In order to could check the instance-based privilege for a newly created/copied calculation version or calculation
			// the business object type of calculation it's Project and for calculation version it's Calculation because the business object id it's not yet defined.
			// In this way the authorization manager will return the instance-based privilege of the business object type from one level above.
			// For the newly created projects the user will get the ADMINISTRATE instance-based privilege in the business logic.
			// From authorization manager point of view:
			//			- the business object type of project/quantities service it's Project;
			// 			- the business object type of calculated-results service it's Calculation_Version.
			if (oRequestContent.parameters.action === CalculationServiceParameters.Create || oRequestContent.parameters.action === CalculationServiceParameters.CopyVersion) {
				if (sRequestBusinessObjectType === BusinessObjectTypes.CalculationVersion) {
					sBusinessObjectType = BusinessObjectTypes.Calculation;
				} else {
					sBusinessObjectType = BusinessObjectTypes.Project;
				}
			} else {
				if (sRequestBusinessObjectType === BusinessObjectTypes.CalculatedResults || sRequestBusinessObjectType === BusinessObjectTypes.Variant || sRequestBusinessObjectType === BusinessObjectTypes.Masterdata || sRequestBusinessObjectType === BusinessObjectTypes.VariantCalculator || sRequestBusinessObjectType === BusinessObjectTypes.VariantGenerator) {
					sBusinessObjectType = BusinessObjectTypes.CalculationVersion;
				} else if (sRequestBusinessObjectType === BusinessObjectTypes.ProjectQuantities
							|| sRequestBusinessObjectType === BusinessObjectTypes.ProjectActivityPriceSurcharges
							|| sRequestBusinessObjectType === BusinessObjectTypes.ProjectMaterialPriceSurcharges) {
					sBusinessObjectType = BusinessObjectTypes.Project;
				} else {
					sBusinessObjectType = sRequestBusinessObjectType;
				}
			}
			switch (sBusinessObjectType) {
				case AuthorizationManager.BusinessObjectTypes.Project:
					if (Helpers.isNullOrUndefined(oRequestContent.parameters.id) || _.includes(CalculationServiceParameters, oRequestContent.parameters.action)) {
						sBusinessObjectId =  Helpers.isNullOrUndefined(_.result(oRequestContent.data, 'PROJECT_ID')) ?
								_.result(_.find(oRequestContent.data, 'PROJECT_ID'), 'PROJECT_ID') : _.result(oRequestContent.data, 'PROJECT_ID');
					} else {
						sBusinessObjectId = oRequestContent.parameters.id;
					}
					break;
				case AuthorizationManager.BusinessObjectTypes.Calculation:
					sBusinessObjectId = _.result(_.find(oRequestContent.data, 'CALCULATION_ID'), 'CALCULATION_ID');
					break;
				case AuthorizationManager.BusinessObjectTypes.CalculationVersion:
					// 2 parameter names for the id are in use for calculation version (both need to be considered):
					// 	id: for query parameter
					//  calculation_version_id: for path variables
					sBusinessObjectId = oRequestContent.parameters.id ||
										oRequestContent.parameters.calculation_version_id ||
										_.result(_.find(oRequestContent.data, 'CALCULATION_VERSION_ID'),'CALCULATION_VERSION_ID');
					break;
				case AuthorizationManager.BusinessObjectTypes.Privilege:
					sBusinessObjectId = Helpers.isNullOrUndefined(oRequestContent.parameters.entity_id) ?
							Helpers.getValueOnKey(oRequestContent.data, 'ENTITY_ID') : oRequestContent.parameters.entity_id;
					//the business object type of privilege it's Project
					sBusinessObjectType = BusinessObjectTypes.Project;
					break;
				default: {
					const sLogMessage = `Instance-based privilege not defined for business object ${sBusinessObjectType}.`;
					$.trace.error(sLogMessage);
					throw new InternalException(sLogMessage + $.net.http.INTERNAL_SERVER_ERROR, 500);
				}
			}
			AuthorizationManager.checkPrivilege(sBusinessObjectType, sBusinessObjectId, sInstancePrivilege, persistency.getConnection(), $.getPlcUsername());
		}
	}

	function setResponse(oResponse, oServiceOutput) {
		oResponse.status = oServiceOutput.status;
		oResponse.contentType = 'application/json';

		// set dynamically the version indicator to HTTP header
		if (sVersionId === undefined) {
			sVersionId = persistency.ApplicationManagement.getApplicationVersion(MTA_METADATA);
		}
		oResponse.headers.set("SAP-PLC-API-VERSION", sVersionId);

		var sResponse = JSON.stringify(oServiceOutput.payload);
		oResponse.setBody(sResponse);
	}

	function updateActivityTime() { // update LAST_ACTIVITY_TIME in the datebase only after this number of seconds
		const sUserId = $.getPlcUsername();
		const sSessionId = $.getPlcUsername();

		const details = persistency.Session.getSessionDetails(sSessionId, sUserId);
		if (details.lifetime > constants.ActivityTimeUpdateFrequency) {
			persistency.Session.updateLastActivity(sSessionId, sUserId);
		}
    }

    function updateUserActivity() {
        const sUserId = $.getPlcUsername();
        const sCurrentDate = new Date();// constant added in order for tests to be made

	    persistency.Session.updateLastUserActivity(sUserId, sCurrentDate);
    }
}

Dispatcher.prototype = Object.create(Dispatcher.prototype);
Dispatcher.prototype.constructor = Dispatcher;

module.exports.Dispatcher = Dispatcher;
module.exports.clearVersion = function(){
    sVersionId = undefined;
}
