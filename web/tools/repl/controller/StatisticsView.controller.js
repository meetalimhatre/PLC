sap.ui.define([
	"mdr/ui/controller/BaseController",
    "sap/ui/core/library",
    "core/utils/ResourceBundle",
    "core/utils/MessageHelpers",
    "core/utils/Router",
    "core/toolBarMessages/ToolBarMessages"
], function (Controller, library, ResourceBundle, MessageHelpers, Router, ToolBarMessages) {
	"use strict";

    
	return Controller.extend("mdr.ui.controller.StatisticsView", {
        bIsForbidden: false,
        MessageType: library.MessageType,
        ToolBarMessages: ToolBarMessages,
		onInit: function () {
			var oView = this.getView();
			var oModel = this.getOwnerComponent().getModel("StatisticsOdataModel");

			var oSmartFilterBar = oView.byId("sfbStatistics");
			var oSmartTable = oView.byId("stStatistics");

			this.oButtonPopover = this.byId("buttonMessagePopover");
			
			//Change default button names for GO & Adapt Filter
			this.overrideDefaultSmartFilterButtons(oSmartFilterBar, "XBUT_filterGoButton", "XBUT_filterAdaptFilterButton");
			
			Router.getRouter.call(this).getRoute("statistics").attachMatched(this.onRouteMatchedForbidden, this);

			oModel.metadataLoaded(true).then(
				//resolved
				function (oEvent) {
					oSmartFilterBar.setVisible(true);
					oSmartTable.setVisible(true);

					oSmartFilterBar.setModel(oModel);
					oSmartFilterBar.setEntitySet("StatisticsOdata");
					oSmartTable.setModel(oModel);
					oSmartTable.setEntitySet("StatisticsOdata");
					oSmartTable.setInitiallyVisibleFields(this.getHeaderColumns("StatisticsOdata"));
					oSmartTable.applyVariant({
						sort: {
							sortItems: [{ 
								columnKey: "START_TIME", 
								operation:"Descending"
							}]
						}
					});

					var oTable = oSmartTable.getTable();
					oTable.setAlternateRowColors(true);
					oTable.setGrowing(true);

					Router.getRouter.call(this).getRoute("statistics").attachMatched(this.onRouteMatchedReset, this);
				}.bind(this),
				//rejected
				function (oEvent) {
					oSmartFilterBar.setVisible(false);
					oSmartTable.setVisible(false);
					
					if (oEvent.statusCode == 403){
						this.bIsForbidden = true;
					}
					else{
						MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_noMetadataLoaded"), this.MessageType.Error, this.oButtonPopover);
					}
				}.bind(this));

				oModel.attachRequestSent(this.setAppIsBusy.bind(this, true));
	
				oModel.attachRequestCompleted(this.setAppIsBusy.bind(this, false));
		},

		onRouteMatchedReset: function() {
			this.getView().byId("stStatistics").rebindTable();
		},
	});
});
