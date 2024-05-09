sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    var Component = UIComponent.extend("ui.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // call the init function of the parent
            UIComponent.prototype.init.apply(this, arguments);
            this.initModel();
            
            // create the views based on the url/hash
            this.getRouter().initialize();
        },

        initModel: function() {
            var oInfoModel = new JSONModel();
            this.setModel(oInfoModel, "info");
            sap.ui.getCore().setModel(oInfoModel, "info");

            var oStepsModel = new JSONModel();
            oStepsModel.setProperty("/stepCollection", {});
            sap.ui.getCore().setModel(oStepsModel, "steps");
            this.setModel(oStepsModel);
        },

    });

     return Component;
});
