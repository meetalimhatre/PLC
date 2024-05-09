sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
    "core/utils/Constants",
    "core/connector/BackendConnector",
    "core/utils/CommonComponent",
    "core/utils/Models",
	"core/utils/ResourceBundle"
], function (UIComponent, Device, Constants, BackendConnector, CommonComponent, Models, ResourceBundle) {
	"use strict";

	return UIComponent.extend("mdr.ui.Component", {

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
            this.getModel("headerModel").setProperty("/HeaderText", ResourceBundle.getResourceBundleText.call(this, "XTIT_ReplHeader"));
			let oSchedulerModel = {};

            // init properties for scheduler view
            BackendConnector.doGet({
                    constant: "BASE_URL_SCHEDULER",
                },
                function(oData, sStatus) {
					var oDate = new Date();
					oDate.setUTCHours(oData.triggerSpecification.hour);
					oDate.setUTCMinutes(oData.triggerSpecification.minute);
					oDate.setSeconds(0);
					oSchedulerModel.date = oDate;

					switch(oData.triggerType){
						case Constants.SCHEDULER_PATTERNS.DAILY.toUpperCase():
							Constants.WEEK_DAYS.forEach(value => {
								oSchedulerModel[value] = oData.triggerSpecification["runOn" + value[0].toUpperCase() + value.substring(1)]
							});
							break;
						case Constants.SCHEDULER_PATTERNS.WEEKLY.toUpperCase():
							oSchedulerModel.dayOfTheWeek = oData.triggerSpecification.dayOfTheWeek;
							break;
						case Constants.SCHEDULER_PATTERNS.MONTHLY.toUpperCase():
							oSchedulerModel.dayMonth = oData.triggerSpecification.dayOfMonth;
							break;
						default:
					}
					oSchedulerModel.type = oData.triggerType;
					this.setModel.call(this,Models.createModel.call(this,oSchedulerModel),"scheduler");
				}.bind(this),
                function(oXHR, sTextStatus, sErrorThrown) {
                    oSchedulerModel.oXHR = oXHR;
                    this.setModel.call(this,Models.createModel.call(this,oSchedulerModel),"scheduler");
                }.bind(this)
            );
		},

	});
});