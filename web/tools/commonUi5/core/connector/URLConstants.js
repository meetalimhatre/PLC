sap.ui.define([], function () {

    "use strict";

    var rest = "/sap/plc/xs/rest";
    var dispatcher = rest + "/dispatcher.xsjs";
    var serviceOdata = "/analytics/services.xsodata";
    var bomExecute = serviceOdata + "/BOM_COMPARE(versionId1={version1Id},versionId2={version2Id},languageId='{languageId}')/Execute";
    var scheduler = "/sap/plc/scheduler/api/v1/scheduler";
    var BASE_URL_DATAMAPPER = "/sap/plc/map/api/v1/datamapper";
    var ENTITIES = BASE_URL_DATAMAPPER + "/entities";
    var mURLConstants = {
        GLOBAL_SEARCH: dispatcher + "/global-search?filter=1&type=CalculationVersion",
        LAYOUTS: dispatcher + "/layouts?layout_type=2",
        LAYOUTS_CREATE_UPDATE: dispatcher + "/layouts?is_corporate={is_corporate}",
        METADATA: serviceOdata + "/$metadata",
        BOM_CALCULATIONS: bomExecute + "?$filter=PARENT_ID eq {parentId} or PARENT_ID_BOMC2 eq {parentId2}&$top={top}&$skip={skip}&$orderby=ITEM_ORDER",
        BOM_CALCULATIONS_ROOT_NODE: bomExecute + "?$filter=PARENT_ID eq {parentId} and PARENT_ID_BOMC2 eq {parentId2}&$top={top}&$skip={skip}&$orderby=ITEM_ORDER",
        BOM_CALCULATIONS_COUNT: bomExecute + "/$count/?$filter=PARENT_ID eq {parentId} or PARENT_ID_BOMC2 eq {parentId2}",
        BOM_CALCULATIONS_EXPORT: bomExecute + "/?$top={top}&$skip={skip}&$orderby=ITEM_ORDER",
        BOM_CALCULATIONS_EXPORT_COUNT: bomExecute + "/$count",
        BASE_URL_SCHEDULER: scheduler + "/job/REPLICATION",
        BASE_URL_SCHEDULER_TYPE: scheduler + "/job/REPLICATION/{type}",
        RUN_NOW_URL_SCHEDULER: scheduler +  "/job/REPLICATION/now",
        AUTH_URL: dispatcher + "/auth",
        DATA_PREVIEW: BASE_URL_DATAMAPPER + "/datapreview",
        ENTITIES: ENTITIES,
        MAPPING: ENTITIES + "/{entityId}/mapping",
        TOGGLE_REPLICATION: ENTITIES + "/{entityId}/toggleReplication/{action}",
        RESET_TO_DEFAULT: ENTITIES + "/{entityId}/resetToDefault",
        RETENTION_PERIODS: dispatcher + "/retention-periods",
        GET_FIELDS_FOR_MAPPING: BASE_URL_DATAMAPPER + "/fieldMappings"
    };

    return Object.freeze(mURLConstants);

});