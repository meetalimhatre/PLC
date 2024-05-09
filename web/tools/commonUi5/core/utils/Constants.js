sap.ui.define([], function() {
    'use strict';

    var constants = {
            
        INFOMESSAGES: {
            ERROR: "Error",
            WARNING: "Warning",
            INFORMATION: "Information",
            NONE: "None",
            SUCCESS: "Success"
        },

        SAP_ICONS: {
            ERROR: "sap-icon://message-error",
            WARNING: "sap-icon://message-warning",
            SUCCESS: "sap-icon://message-success",
            INFORMATION: "sap-icon://message-information"
        },

        SAP_BUTTON_TYPE: {
            ERROR: "Negative",
            WARNING: "Critical",
            SUCCESS: "Success",
            INFORMATION: "Neutral"
        },
        timeout: {
            SESSION_TIMEOUT: 60000,
            TEN_SECONDS: 10000
        },
        headers: {
            CONTENT_TYPE_JSON: "application/json; charset=utf-8"
        },
        previewErrorCodes: {
            MAP_ENTITY_VALIDATION: "MAP_ENTITY_VALIDATION",
            MAP_DATA_PREVIEW_ERROR: "MAP_DATA_PREVIEW_ERROR",
            MAP_DATA_PREVIEW_MANDATORY_COLUMN_ERROR: "MAP_DATA_PREVIEW_MANDATORY_COLUMN_ERROR"
        },
        mapErrorCodes: {
            MAP_REPL_DISABLE_IS_REQ: "MAP_REPL_DISABLE_IS_REQ",
            MAP_REPL_ENABLE_MISS_DEPS: "MAP_REPL_ENABLE_MISS_DEPS",
        },
        
        // scheduler constants
        WEEK_DAYS: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
        SCHEDULER_PATTERNS:{
            NONE:"None",
            DAILY:"Daily",
            WEEKLY:"Weekly",
            MONTHLY:"Monthly"
        },

        TOGGLE_REPLICATION_STATUS: {
            ENABLED: "ENABLED",
            DISABLED: "DISABLED",
            LOCAL: "LOCAL"
        },

        TOGGLE_REPLICATION_ACTION: {
            ENABLED: "ENABLE",
            DISABLED: "DISABLE",
            LOCAL: "LOCAL"
        },

        CONTENT_DENSITY: {
            COMPACT: "sapUiSizeCompact",
            COZY: "sapUiSizeCozy"
        },

        SAP_DEFAULT_LAYOUT_NAME: "#SAP Default for BoM Compare",

        RETENTION_PERIODS_ENTITY_TYPES: [{
            key: "CUSTOMER",
            text: "XFLD_CUSTOMER"
        },{
            key: "VENDOR",
            text: "XFLD_VENDOR"
        },{
            key: "PROJECT",
            text: "XFLD_PROJECT"
        },{
            key: "USER",
            text: "XFLD_USER"
        }],

        BOM_COMPARE_EXPORT: {
            BACKEND_REQUESTS_DIVIDER : 1000
        },

        BOM_COMPARE: {
            BACKEND_REQUESTS_DIVIDER : 100,
            TABLE_NO_ROW_SELECTED: -1
        },

    };

    return constants;
});
