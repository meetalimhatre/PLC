sap.ui.define([
    "mdr/ui/controller/BaseController",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/library",
    "core/utils/Constants",
    'mdr/ui/model/configSchemas',
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/m/Text",
    "core/utils/Router",
    "core/utils/ResourceBundle",
    "core/utils/MessageHelpers",
    "core/toolBarMessages/ToolBarMessages",
    "core/connector/BackendConnector"
], function (Controller, Sorter, JSONModel, library, Constants, ConfigSchemas, Dialog, 
    DialogType, Button, ButtonType, Text, Router, ResourceBundle, MessageHelpers, ToolBarMessages, BackendConnector) {
    "use strict";

    return Controller.extend("mdr.ui.controller.ConfigViewOverview", {
        MessageType: library.MessageType,
        bVisitedDetails:false,
        bIsForbidden: false,
        ToolBarMessages: ToolBarMessages,
        
        onInit: function () {
            Router.getRouter.call(this).getRoute("config").attachMatched(this.onRouteMatchedForbidden, this);
            Router.getRouter.call(this).getRoute("config").attachMatched(this._onRouteMatchedConfigured, this);
        },

        onAfterRendering: function () {
            this.oTable = this.byId("configTable");
            this.oDestinationsColumn = this.byId("destinationsCol");
            this.oSortBtn = this.byId("sortBtn");
            this.oModel = new JSONModel();
            this.oSchema = ConfigSchemas.configOverviewSchema;
            this.oButtonPopover = this.byId("buttonMessagePopover");
            this.loadData(true);
        },

        setUiVisibility: function(visible) {
            this.getView().byId("configTable").setVisible(visible);
            this.getView().byId("detailsBtn").setVisible(visible);
            this.getView().byId("resetBtn").setVisible(visible);
            this.getView().byId("sortBtn").setVisible(visible);
        },

        loadData: function(initial = false) {
            this.setAppIsBusy(true);
            BackendConnector.doGet({
                    constant: "ENTITIES"
                },
                function (oData, sStatus) {
					this.setAppIsBusy(false);
                    this.setUiVisibility(true);

                    this._translateModel(oData);
                    this.oSchema.ConfigurationTable = oData;
                    this.oModel.setData(this.oSchema);
                    this.oTable.setModel(this.oModel);

                    if (initial == true){
                        MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataLoaded"), this.MessageType.Success, this.oButtonPopover);
                        this.oTable.sort(this.oDestinationsColumn, sap.ui.table.SortOrder.Ascending, false);
                        this._setSortButtonPressed(true);
                    }
                }.bind(this),
                function (oXHR, sTextStatus, sErrorThrown) {
					this.setAppIsBusy(false);
                    if (oXHR.status == 403){
                        this.bIsForbidden = true;
                        this.setUiVisibility(false);
                        MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_403"), this.MessageType.Error, this.oButtonPopover);
                    }
                    else{
                        MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
                    }
                }.bind(this)
            );
        },

        onNavToDetails: function () {
            var iIndex = this.oTable.getSelectedIndex();

            if (iIndex < 0) {
                MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_pleaseChooseRow"), this.MessageType.Error, this.oButtonPopover);
            } else {

                var model = this.oTable.getModel();
                var actualIndex = this.oTable.getBinding("rows").aIndices[iIndex]; // because the table may be sorted
                var currentRow = model.getData("ConfigurationModel").ConfigurationTable[actualIndex];
                
                this.bVisitedDetails = true;
                Router.getRouter.call(this).navTo("configDetails", {
                    filter: currentRow.id
                });
            }
        },

        changeReplicationState: function (sEntity, sReplStatus, oComboBox, sOldReplStatus) {
            let sAction;
            let sEntityId = sEntity.id;
            let sEntityLabel = sEntity.label;
            switch (sReplStatus) {
                case Constants.TOGGLE_REPLICATION_STATUS.ENABLED:
                    sAction = Constants.TOGGLE_REPLICATION_ACTION.ENABLED;
                    break;
                case Constants.TOGGLE_REPLICATION_STATUS.DISABLED:
                    sAction = Constants.TOGGLE_REPLICATION_ACTION.DISABLED;
                    break;
                case Constants.TOGGLE_REPLICATION_STATUS.LOCAL:
                    sAction = Constants.TOGGLE_REPLICATION_ACTION.LOCAL;
                    break;
            }

            BackendConnector.doPatch({
                    constant: "TOGGLE_REPLICATION",
                    parameters: {
                        entityId: sEntityId,
                        action: sAction
                    }
                },
                null,
                function (oData, sStatus) {
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_replicationToggled", [sEntityLabel, sReplStatus]), this.MessageType.Success, this.oButtonPopover);
                    this.loadData();
                }.bind(this),
                function (oXHR, sTextStatus, sErrorThrown) {
                    oComboBox.setSelectedKey(sOldReplStatus);
                    this.oTable.getModel().refresh(true);

                    this._adjustToggleReplicationResponseArgs(oXHR);
                    MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
                }.bind(this)
            );

        },

        handleStateChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sOldReplStatus = oComboBox._lastValue;
            var sNewReplStatus = oEvent.mParameters.selectedItem.mProperties.key;

            //get index of row where dropdown is selected
            var path = oEvent.getSource().getBindingContext().sPath;
            var iLastPositionOfSlash = path.lastIndexOf("/");
            var index = path.substr(iLastPositionOfSlash + 1);

            var model = this.oTable.getModel().getData("ConfigurationModel").ConfigurationTable;
            var currentRow = model[index];

            this.changeReplicationState(currentRow, sNewReplStatus, oComboBox, sOldReplStatus);
        },

        onResetToDefault: function () {
            var iIndex = this.oTable.getSelectedIndex();
            
            if (iIndex < 0) {
                MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_pleaseChooseRow"), this.MessageType.Error, this.oButtonPopover);
            } else {
                var actualIndex = this.oTable.getBinding("rows").aIndices[iIndex]; // because the table may be sorted
                var model = this.oTable.getModel();
                var currentRow = model.getData("ConfigurationModel").ConfigurationTable[actualIndex];

                let oApproveDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Reset To Default",
                    content: new Text({ text: ResourceBundle.getResourceBundleText.call(this, "XMSG_entityResetConfirmationMessage", [currentRow.label]) }),
                    beginButton: new Button({
                        text: "Yes",
                        press: function () {
                            BackendConnector.doPatch({
                                    constant: "RESET_TO_DEFAULT",
                                    parameters: {
                                        entityId: currentRow.id,
                                    }
                                },
                                null,
                                function (oData, sStatus) {
                                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_entityReset"), this.MessageType.Success, this.oButtonPopover);
                                }.bind(this),
                                function (oXHR, sTextStatus, sErrorThrown) {
                                    MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
                                }.bind(this)
                            );
                            oApproveDialog.close();
                        }.bind(this)
                    }),
                    endButton: new Button({
                        type: ButtonType.Emphasized,
                        text: "No",
                        press: function () {
                            oApproveDialog.close();
                        }.bind(this)
                    })
                });
                oApproveDialog.open();
            }
        },

        sortColumn: function(oEvent) {
            var oCurrentColumn = oEvent.getParameter("column");
            this.sCurrSortOrder = oEvent.getParameter("sortOrder");

			var oSorter = new Sorter(oCurrentColumn.getSortProperty(), this.sCurrSortOrder === sap.ui.table.SortOrder.Descending);
            this.oTable.getBinding("rows").sort(oSorter);
            this._setSortButtonPressed(true);
        },

        onSortPress : function(oEvent) {
            if (oEvent.getSource().getPressed() == true){
                this.oTable.sort(this.oDestinationsColumn, this.sCurrSortOrder, false);
            }
            else{
                this.oTable.getBinding("rows").sort(null);
                this._resetSortingState();
                this._setSortButtonPressed(false);
            }
        },

        _resetSortingState : function() {
            var aColumns = this.oTable.getColumns();
            for (var i = 0; i < aColumns.length; i++) {
                aColumns[i].setSorted(false);
            }
        },

        _setSortButtonPressed : function(bPressed) {
            this.oSortBtn.setPressed(bPressed);

            if (bPressed == true){
                this.oSortBtn.setTooltip(ResourceBundle.getResourceBundleText.call(this, "XTOL_clearSorting"));
            }
            else{
                this.oSortBtn.setTooltip(ResourceBundle.getResourceBundleText.call(this, "XTOL_restoreSorting"));
            }
        },

        _translateModel : function(oJsonModel) {
            for (var i=0; i<oJsonModel.length; i++){
                oJsonModel[i]["label"] = ResourceBundle.getResourceBundleText.call(this, oJsonModel[i]["label"]);
                oJsonModel[i]["description"] = ResourceBundle.getResourceBundleText.call(this, oJsonModel[i]["description"]);
                oJsonModel[i]["configured"] = ResourceBundle.getResourceBundleText.call(this, "XFLD_" + oJsonModel[i]["configured"]);
                this._translateDependencies(oJsonModel, i);
            }
        },

        _translateDependencies: function(oJsonModel, i) {
            var messageKey = "";
            var dependentsSet = [];

            switch (oJsonModel[i]["replicationStatus"]) {
                case Constants.TOGGLE_REPLICATION_STATUS.ENABLED:
                    messageKey = "XMSG_" + Constants.mapErrorCodes.MAP_REPL_DISABLE_IS_REQ;
                    dependentsSet = oJsonModel[i]["requiredBy"];
                    break;
                case Constants.TOGGLE_REPLICATION_STATUS.DISABLED:
                    messageKey = "XMSG_" + Constants.mapErrorCodes.MAP_REPL_ENABLE_MISS_DEPS;
                    dependentsSet = oJsonModel[i]["dependsOn"];
                    break;
                default:
            }

            var isMessageSet = false;

            if (messageKey != ""){

                var concatenatedDependents = "";
                for (var j=0; j<dependentsSet.length; j++){
                    concatenatedDependents += this.encloseInQuotes(ResourceBundle.getResourceBundleText.call(this, dependentsSet[j]));
                    if (j < dependentsSet.length - 1){
                        concatenatedDependents += ", ";
                    }
                }
                
                if (concatenatedDependents != ""){
                    // Each error message only has one placeholder, so we need to provide only one argument
                    concatenatedDependents = [concatenatedDependents];

                    oJsonModel[i]["replChangeDisabledMessage"] = ResourceBundle.getResourceBundleText.call(this, messageKey, concatenatedDependents);
                    isMessageSet = true;
                }
            }

            if (isMessageSet == false) {
                oJsonModel[i]["replChangeDisabledMessage"] = "";
            }
        },

        _onRouteMatchedConfigured : function() {
            ToolBarMessages.removeAllMessages();
            if (this.bVisitedDetails){
                this.loadData();
                this.bVisitedDetails = false;
            }
        },

        _adjustToggleReplicationResponseArgs : function(oXHR){ 
            var concatenatedDependents = "";
            if (oXHR.responseJSON && oXHR.responseJSON.args && oXHR.responseJSON.args.length != 0) {
                var separators = [" ", ","];
                oXHR.responseJSON.args = oXHR.responseJSON.args[0].split(new RegExp("[" + separators.join("") + "]", "g"));

                for (var i=0; i<oXHR.responseJSON.args.length; i++){
                    if (oXHR.responseJSON.args[i] === "") {
                        continue;
                    }
                    concatenatedDependents += this.encloseInQuotes(ResourceBundle.getResourceBundleText.call(this, oXHR.responseJSON.args[i]));
                    if (i < oXHR.responseJSON.args.length - 1){
                        concatenatedDependents += ", ";
                    }
                }

                oXHR.responseJSON.args = [concatenatedDependents];
            }
        }
    }
    );
});