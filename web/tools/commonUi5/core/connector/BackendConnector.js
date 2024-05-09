sap.ui.define([
    "jquery.sap.global",
    "core/connector/BaseConnector",
], function ($, BaseConnector) {
    "use strict";

    var BackendConnector = {
        doGet: function (vURL, fnSuccess, fnError, bSync, dataType, oHeaders) {
            return BaseConnector.doAjaxCall("GET", vURL, null, fnSuccess, fnError, oHeaders, true, bSync, dataType);
        },

        doPost: function (vURL, oData, fnSuccess, fnError, dataType) {
            return BaseConnector.doAjaxCall("POST", vURL, oData, fnSuccess, fnError, null, true, false, dataType);
        },

        doPut: function (vURL, oData, fnSuccess, fnError) {
            return BaseConnector.doAjaxCall("PUT", vURL, oData, fnSuccess, fnError, null, true);
        },

        doDelete: function (vURL, oData, fnSuccess, fnError, bExpectsResponse) {
            return BaseConnector.doAjaxCall("DELETE", vURL, oData, fnSuccess, fnError, null, bExpectsResponse);
        },

        doPatch: function (vURL, oData, fnSuccess, fnError, bExpectsResponse) {
            return BaseConnector.doAjaxCall("PATCH", vURL, oData, fnSuccess, fnError, null, bExpectsResponse);
        },
    };

    return BackendConnector;
});