sap.ui.define([
	"sap/ui/core/UIComponent",
    "core/utils/CommonComponent",
    "core/utils/ResourceBundle"
], function (UIComponent,CommonComponent, ResourceBundle) {
	"use strict";

	return UIComponent.extend("retentionperiods.ui.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
            CommonComponent.startUp.call(this, UIComponent);  
            this.bundle = this.getModel("i18n").getResourceBundle();
            this.getModel("headerModel").setProperty("/HeaderText", ResourceBundle.getResourceBundleText.call(this,"XTIT_RetentionPeriodsHeader"));
		},

	});
});