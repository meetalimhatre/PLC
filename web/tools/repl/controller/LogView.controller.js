sap.ui.define([
	"mdr/ui/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/core/library",
    "sap/ui/model/FilterOperator",
    "core/utils/ResourceBundle",
    "core/utils/MessageHelpers",
    "core/utils/Router",
    "core/toolBarMessages/ToolBarMessages"
], function (Controller, Filter, library, FilterOperator, ResourceBundle, MessageHelpers, Router, ToolBarMessages) {
	"use strict";

	return Controller.extend("mdr.ui.controller.LogView", {
        bIsForbidden: false,
        MessageType: library.MessageType,
        ToolBarMessages: ToolBarMessages,

		onInit: function () {
			var oView = this.getView();
			var oModel = this.getOwnerComponent().getModel("LogsOdataModel");

			var oSmartFilterBar = oView.byId("sfbLogs");
			var oSmartTable = oView.byId("stLogs");

			this.oButtonPopover = this.byId("buttonMessagePopover");

			//Change default button names for GO & Adapt Filter
			this.overrideDefaultSmartFilterButtons(oSmartFilterBar, "XBUT_filterGoButton", "XBUT_filterAdaptFilterButton");

			Router.getRouter.call(this).getRoute("log").attachMatched(this.onRouteMatchedForbidden, this);

			oModel.metadataLoaded(true).then(
				//resolved
				function (oEvent) {
					oSmartFilterBar.setVisible(true);
					oSmartTable.setVisible(true);

					oSmartFilterBar.setModel(oModel);
					oSmartFilterBar.setEntitySet("LogsOdata");

					oSmartTable.setModel(oModel);
					oSmartTable.setEntitySet("LogsOdata");
					oSmartTable.setInitiallyVisibleFields(this.getHeaderColumns("LogsOdata"));
					oSmartTable.applyVariant({
						sort: {
							sortItems: [{ 
								columnKey: "MESSAGE_TIME", 
								operation:"Descending"
							}]
						}
					});

					var oTable = oSmartTable.getTable();
					oTable.setAlternateRowColors(true);

					var oRouter = Router.getRouter.call(this);
					// enable onRouteMatchedReset only if you want to reset all filters when click on Logs tab (will see all entries from Logs smart table)
					oRouter.getRoute("log").attachMatched(this.onRouteMatchedReset, this);
					oRouter.getRoute("logFilter").attachMatched(this.onRouteMatchedFilter, this);
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

		onRouteMatchedReset: function () {
			this.oTableSearchState = [];
			this.getView().byId("sfbLogs").clear();
			this.getView().byId("stLogs").applyVariant({});
			this.getView().byId("stLogs").applyVariant({
				sort: {
					sortItems: [{ 
						columnKey: "MESSAGE_TIME", 
						operation:"Descending"
					}]
				}
			});
			this.getView().byId("stLogs").rebindTable();
		},

		onRouteMatchedFilter: function (oEvent) {
			var oArgs, oQuery;
			oArgs = oEvent.getParameter("arguments");
			oQuery = oArgs["?query"];

			if (oQuery.runid) {
				this.oTableSearchState = [new Filter("RUN_ID", FilterOperator.Contains, oQuery.runid)];
				// reset filters if exists
				this.getView().byId("sfbLogs").clear();
				this.getView().byId("stLogs").applyVariant({});
				this.getView().byId("stLogs").applyVariant({
					sort: {
						sortItems: [{ 
							columnKey: "MESSAGE_TIME", 
							operation:"Descending"
						}]
					}
				});
				// set reset buton visible
				this.getView().byId("btnSeeAllEntries").setVisible(true);
			}

			var oSmartTable = this.getView().byId("stLogs");
			oSmartTable.rebindTable();
		},

		formatRowHighlight: function (oValue) {
			switch(oValue) {
				case "ERROR":
					  return "Error";
				case "INFO":
					  return "Success";
				default: 
					  return "None";
			}
		},
	});
});
