sap.ui.define([
    "core/utils/BaseController",
    "core/utils/ResourceBundle"
], function (Controller, ResourceBundle) {
    "use strict";

    var BaseController = Controller.extend("ui.controller.BaseController", {
        getErrorMessage: function(sErrorCode) {
            return ResourceBundle.getResourceBundleText.call(this, "XMSG_" + sErrorCode.toString());
        }
    });

    return BaseController;
});