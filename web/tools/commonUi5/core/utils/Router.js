sap.ui.define([
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
], function (History, UIComponent) {
    "use strict";

    var Router = {
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        redirectToLaunchpadOnRefresh: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash == undefined) {
                Router.getRouter.call(this).navTo("Home", {}, true /*no history*/ );
            }
        },

        onNavBack: function () {
            var oHistory, sPreviousHash;

            oHistory = History.getInstance();
            sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                Router.getRouter.call(this).navTo("", {}, true /*no history*/ );
            }
        },

    }
    return Router;
});