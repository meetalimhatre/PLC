sap.ui.define([
    "ui/controller/BaseController",
    "core/header/Logout",
    "core/utils/CommonComponent"
], function (Controller, Logout, CommonComponent) {
    "use strict";
    return Controller.extend("ui.controller.App", {

        Logout: Logout,
        onInit: function() {
            this.getView().addStyleClass(CommonComponent.getContentDensityClass.call(this));
        },
    });
});
