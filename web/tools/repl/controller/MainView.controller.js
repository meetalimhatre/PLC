sap.ui.define([
	"mdr/ui/controller/BaseController",
    'mdr/ui/model/configSchemas',
    "core/utils/CommonComponent",
    "core/utils/Router",
    "core/utils/ResourceBundle",
    "core/header/Logout",
    "core/toolBarMessages/ToolBarMessages",
	"sap/ui/model/json/JSONModel",
    "core/utils/Models"
], function (Controller, ConfigSchemas, CommonComponent, Router, ResourceBundle, Logout, ToolBarMessages, JSONModel, Models) {
	"use strict";

	return Controller.extend("mdr.ui.controller.MainView", {

        Logout:Logout,
        ToolBarMessages: ToolBarMessages,

		onInit: function () {
			this.getView().addStyleClass(CommonComponent.getContentDensityClass.call(this));

            Models.setModel.call(this, new JSONModel({
				appBusy: false,
				sideContentIsEnabled: true
			}), "view");

			this._translateModel(ConfigSchemas);

			var sRawSelectedKey = window.URI()._parts.fragment;

			if(sRawSelectedKey) {
				var sPreviousSelectedKey = sRawSelectedKey.substring(1);
				this.getView().byId("sideNavigation").setSelectedKey(sPreviousSelectedKey);
			} else {
				this.getView().byId("sideNavigation").setSelectedKey("home");
				Router.getRouter.call(this).navTo("home");
			}

			Controller.prototype.onInit.call(this);
		},

		onItemSelect: function (oEvent) {
			var sKey = oEvent.getParameter("item").getKey();
			if (sKey === "log") {
				Router.getRouter.call(this).navTo(sKey, {
					filter: "null"
				});
			}
			ToolBarMessages.removeAllMessages();
			Router.getRouter.call(this).navTo(sKey);
		},

		onCollapseExpandPress: function () {
			var oToolPage = this.byId("toolPage");
			oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
		},

		_translateModel: function (ConfigSchemas) {
			var oSchema = ConfigSchemas.configOverviewSchema;
			for (var i = 0; i < oSchema["ReplState"].length; i++) {
				oSchema["ReplState"][i]["text"] = ResourceBundle.getResourceBundleText.call(this, "XFLD_" + oSchema["ReplState"][i]["text"]);
			}
		}
	});
});
