sap.ui.define([
    "sap/ui/core/UIComponent",
    "core/utils/CommonComponent",
    "core/utils/ResourceBundle"
], function (UIComponent, CommonComponent, ResourceBundle) {
    "use strict";

    var Component = UIComponent.extend("ui.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            CommonComponent.startUp.call(this, UIComponent);
            this.bundle = this.getModel("i18n").getResourceBundle();
            this.getModel("headerModel").setProperty("/HeaderText", ResourceBundle.getResourceBundleText.call(this, "XTIT_BomCompareHeader"));
        },

       
    });

     return Component;
});
