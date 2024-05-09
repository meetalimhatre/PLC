sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"core/toolBarMessages/ToolBarMessages",
], function (Controller, ToolBarMessages) {
	"use strict";

	return Controller.extend("ui5.common.core.utils.BaseController", {

		onInit: function() {
			ToolBarMessages.initialiseMessagePopover.call(this);
		},

		setAppIsBusy: function(bAppIsBusy){
			this.getOwnerComponent().getModel('AppModel').setProperty('/showBusyIndicator', bAppIsBusy);
			this.getOwnerComponent().getModel('AppModel').setProperty('/contentIsEnabled', !bAppIsBusy);
		}

	});

});