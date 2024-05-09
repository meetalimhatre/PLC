sap.ui.define([
	"core/utils/BaseController",
	"sap/ui/core/library",
    "core/utils/Router",
    "core/utils/ResourceBundle",
    "core/utils/MessageHelpers",
	"core/utils/Models"
], function (Controller, library, Router, ResourceBundle, MessageHelpers, Models) {
	"use strict";

	return Controller.extend("mdr.ui.controller.BaseController", {

        _oMessagePopover: null,
        MessageType: library.MessageType,
		
		onInit: function() {
			Controller.prototype.onInit.call(this);
		},

		getConfig: function (){
			var oConfigModel = new sap.ui.model.json.JSONModel();
			oConfigModel.loadData('app_config/config.json', {}, false);
			oConfigModel.setDefaultBindingMode("OneWay");
			return oConfigModel.oData;
		},
		
		getEndpointUrl: function(){
			var oConfigData = this.getConfig();
			return oConfigData.URL_START + oConfigData.API_VERSION + oConfigData.APP_NAME;
		},

		onRouteMatchedForbidden: function () {
            var oButtonPopover = this.getView().byId("buttonMessagePopover");
            
			if (this.bIsForbidden == true){
				MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_403"), this.MessageType.Error, oButtonPopover);
			}
		},

		getHeaderColumns: function (sOdata) {
			var sHeaderFields = "";

			var oModel = this.getOwnerComponent().getModel(sOdata + "Model");
			var oMeta = oModel.getServiceMetadata();
			//if oMeta is not available (due to errors/not being available) then the table won't have any headers
			if(oMeta){
				var index = oMeta.dataServices.schema[0].entityContainer[0].entitySet.map(function (e) {
					return e.name;
				}).indexOf(sOdata);

				for (var i = 0; i < oMeta.dataServices.schema[0].entityType[index].property.length; i++) {
					var property = oMeta.dataServices.schema[0].entityType[index].property[i];
					sHeaderFields += property.name + ",";
				}
				sHeaderFields = sHeaderFields.substring(0, sHeaderFields.length - 1);
			}
			else{
				var oButtonPopover = this.getView().byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_noMetadataLoaded"), this.MessageType.Error, oButtonPopover);
			}
			return sHeaderFields;
		},

		onSmartFilterBarInitialized: function (sTableId) {
			var oSmartTable = this.getView().byId(sTableId);
			oSmartTable.rebindTable();
		},

		onPanelOverflowToolbarPress: function(sPanelId) {
			var oPanel = this.getView().byId(sPanelId);
			oPanel.setExpanded(!oPanel.getExpanded());
		},

		overrideDefaultSmartFilterButtons: function(oFilter, goButton, filterButton) {
			oFilter.addEventDelegate({
				"onAfterRendering": function(oEvent) {
					var oGoButton = oEvent.srcControl._oSearchButton;
					var oFilterButton = oEvent.srcControl._oFiltersButton;
					oGoButton.setText(ResourceBundle.getResourceBundleText.call(this,goButton));
					oFilterButton.setText(ResourceBundle.getResourceBundleText.call(this,filterButton));
				}.bind(this)
			});
		},

		onSeeAllEntries: function (sView) {
			this.oTableSearchState = [];
			this.getView().byId("sfb" + sView).clear();
			this.getView().byId("st" + sView).applyVariant({});
			this.getView().byId("st" + sView).rebindTable();

			this.getView().byId("btnSeeAllEntries").setVisible(false);
			Router.getRouter.call(this).navTo(sView.slice(0,-1).toLowerCase() + "Filter");
		},

		onBeforeRebindSmartTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			if (this.oTableSearchState !== undefined && this.oTableSearchState.length > 0) {
				if (bindingParams.filters.length > 0) {
					bindingParams.filters.push(this.oTableSearchState[0]);
				} else {
					bindingParams.filters = this.oTableSearchState;
				}
			}
		},

		encloseInQuotes: function (sString) {
			return "\"" + sString + "\"";
		}
	});

});
