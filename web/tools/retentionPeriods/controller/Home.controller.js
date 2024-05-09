sap.ui.define([
	"retentionperiods/ui/controller/BaseController",
    "core/utils/CommonComponent",
    "core/utils/Router",
    "core/utils/ResourceBundle",
    "core/header/Logout",
    "core/toolBarMessages/ToolBarMessages",
    "sap/ui/core/Fragment",
    'sap/ui/model/json/JSONModel',
    "core/utils/Models",
    "core/connector/BackendConnector",
    "core/utils/MessageHelpers",
    "core/utils/Constants",
    "sap/ui/core/library",
    "sap/ui/core/format/DateFormat",
], function (Controller, CommonComponent, Router, ResourceBundle, Logout, ToolBarMessages, Fragment, JSONModel, Models, BackendConnector, MessageHelpers, Constants, library,DateFormat) {
    "use strict";
    
    Date.prototype.getUTCTime = function(){ 
        return this.getTime()-(this.getTimezoneOffset()*60000); 
      };

	return Controller.extend("retentionperiods.ui.controller.Home", {

        MessageType: library.MessageType,
        Logout:Logout,
        ToolBarMessages: ToolBarMessages,
        filters: [],
        addEditRetentionPeriodDialogItemEmpty: {
            ENTITY: "",
            SUBJECT: "*",
            VALID_TO: "",
            VALID_FOR: "",
        },

        onAfterRendering: function(){
            this.ValidToColumn=this.getView().byId("VALID_TO");
            this.oTable = this.getView().byId("rententionsTable");
            var height = this.getView().$().height()-200;
            var rowCount = height/50;
            this.oTable.setVisibleRowCount(Math.floor(rowCount));
        },

		onInit: function () {
            Controller.prototype.onInit.call(this);
            this.jsonModel = new JSONModel({
                RetentionPeriods: [],
                EntityTypes: Constants.RETENTION_PERIODS_ENTITY_TYPES,
                SelectedForDeletionRetentionPeriods:[],
                AddEditRetentionsPeriodDialogHeader: "",
                deleteDialogVisibleRowCount:1,
                addEditRetentionPeriodDialogItem: JSON.parse(JSON.stringify(this.addEditRetentionPeriodDialogItemEmpty)),
                tableBusy:true,
                deleteDialogBusy:false,
                addEditDialogBusy:false,
                bDeleteRetentionPeriodBtnIsEnabled:false
            });

            this.jsonModel.setSizeLimit(1000000);
            Models.setModel.call(this,this.jsonModel, "view");	
            Router.getRouter.call(this).getRoute("Home").attachMatched(this.HomeRoute.bind(this));
            this.oButtonPopover = this.byId("buttonMessagePopover");
        },

        HomeRoute: function(){
            this.refreshTable();
        },

        refreshTable:function(){
            Models.setProperty.call(this,"view", "/tableBusy", true);
            BackendConnector.doGet({
                    constant: "RETENTION_PERIODS"
                },
                oResponse => {
                    Models.setProperty.call(this,"view", "/RetentionPeriods", oResponse.body);
                    Models.setProperty.call(this,"view", "/tableBusy", false);
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_tableLoadedSuccessfully"), this.MessageType.Success, this.oButtonPopover);
                },
                oResponse => {
                    Models.setProperty.call(this,"view", "/tableBusy", false);
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_" + oResponse.status.toString()), this.MessageType.Error, this.oButtonPopover);
                },
                false,
                null
            );
        },
        
        openDialog: function(DialogName){
            var oView = this.getView();
            Fragment.load({
                containingView: oView,
                name: "retentionperiods.ui.view.fragments."+DialogName,
                controller: this,
                id: oView.getId()
            }).then(function (oDialog) {
                // connect dialog to the root view of this component (models, lifecycle)
                oView.addDependent(oDialog);
                oDialog.open();
                return oDialog;
            });
        },

        openAddDialog: function(){
            Models.setProperty.call(this, "view", "/EntityEnabled", true);
            Models.setProperty.call(this, "view", "/SubjectEnabled", true);
            Models.setProperty.call(this, "view", "/ValidToEnabled", false);
            Models.setProperty.call(this, "view", "/ValidForEnabled", true);
            Models.setProperty.call(this, "view", "/valueStateVALID_TO", "None");
            Models.setProperty.call(this, "view", "/valueTextVALID_TO", "");
            Models.setProperty.call(this, "view", "/valueStateVALID_FOR", "None");
            Models.setProperty.call(this, "view", "/valueTextVALID_FOR", "");
            Models.setProperty.call(this, "view", "/valueStateSUBJECT", "None");
            Models.setProperty.call(this, "view", "/valueTextSUBJECT", "");
            Models.setProperty.call(this, "view", "/addEditRetentionPeriodDialogItem", JSON.parse(JSON.stringify(this.addEditRetentionPeriodDialogItemEmpty)));
            Models.setProperty.call(this, "view", "/AddEditRetentionsPeriodDialogHeader", ResourceBundle.getResourceBundleText.call(this,"XFLD_AddRetentionPeriodsForPersonalData"));
            this.addOrEdit = "add";
            this.openDialog("RetentionPeriodAddEditDialog");
        },

        openEditRowDialog: function(oEvent){
            Models.setProperty.call(this, "view", "/addEditRetentionPeriodDialogItem", this.addEditRetentionPeriodDialogItemEmpty);
            var rowSelected = Models.getProperty.call(this, "view", oEvent.getParameter("row").oBindingContexts.view.sPath);
            rowSelected = JSON.parse(JSON.stringify(rowSelected));
            Models.setProperty.call(this, "view", "/EntityEnabled", false);
            Models.setProperty.call(this, "view", "/SubjectEnabled", false);
            Models.setProperty.call(this, "view", "/valueStateVALID_TO", "None");
            Models.setProperty.call(this, "view", "/valueTextVALID_TO", "");
            Models.setProperty.call(this, "view", "/valueStateVALID_FOR", "None");
            Models.setProperty.call(this, "view", "/valueTextVALID_FOR", "");
            Models.setProperty.call(this, "view", "/valueStateSUBJECT", "None");
            Models.setProperty.call(this, "view", "/valueTextSUBJECT", "");
            if(rowSelected.VALID_TO){
                Models.setProperty.call(this, "view", "/ValidToEnabled", true);
                Models.setProperty.call(this, "view", "/ValidForEnabled", false);
            }
            else if(rowSelected.VALID_FOR){
                Models.setProperty.call(this, "view", "/ValidToEnabled", false);
                Models.setProperty.call(this, "view", "/ValidForEnabled", true);
            }
            if(rowSelected.VALID_TO){
                rowSelected.VALID_TO = rowSelected.VALID_TO.replace("T00:00:00.000Z", "");
            }            
            Models.setProperty.call(this, "view", "/addEditRetentionPeriodDialogItem", rowSelected)
            Models.setProperty.call(this, "view", "/AddEditRetentionsPeriodDialogHeader", ResourceBundle.getResourceBundleText.call(this,"XFLD_EditRetentionPeriodsForPersonalData"));
            this.addOrEdit = "edit";
            this.openDialog("RetentionPeriodAddEditDialog");
        },

        openDeleteMultipleDialog: function(){
            var aIndices = this.byId("rententionsTable").getSelectedIndices();
            var deletedObjects = [];
            var retentions = Models.getProperty.call(this, "view", "/RetentionPeriods");
            for (var i = 0; i < aIndices.length; i++) {
                var element = aIndices[i];
                deletedObjects.push(retentions[element]);
            }
            Models.setProperty.call(this, "view", "/SelectedForDeletionRetentionPeriods", deletedObjects);
            Models.setProperty.call(this, "view", "/deleteDialogVisibleRowCount", deletedObjects.length> 10 ? 10 : deletedObjects.length);
            this.openDialog("DeleteDialog");
        },

        openDeleteSingleRowDialog: function(oEvent){
            var rowSelected = Models.getProperty.call(this, "view", oEvent.getParameter("row").oBindingContexts.view.sPath);
            rowSelected = JSON.parse(JSON.stringify(rowSelected))
            Models.setProperty.call(this, "view", "/SelectedForDeletionRetentionPeriods", [rowSelected]);
            Models.setProperty.call(this, "view", "/deleteDialogVisibleRowCount", 1);
            this.openDialog("DeleteDialog");
        },

        sortValidToDateAscending: function(){
            this.sortValidToDate(sap.ui.table.SortOrder.Ascending, false)
        },

        sortValidToDateDescending: function(){
            this.sortValidToDate(sap.ui.table.SortOrder.Descending, true)
        },

        sortValidToDate: function(SortOrder,sorter){
            var oSorter = new sap.ui.model.Sorter(this.ValidToColumn.getSortProperty(), sorter);
            oSorter.fnCompare=this.compareValidToDate.bind(this);
            this.oTable.getBinding("rows").sort(oSorter);
           
            for (var i=0;i<this.oTable.getColumns().length; i++) {
                this.oTable.getColumns()[i].setSorted(false); 
            }               
            this.ValidToColumn.setSorted(true);
            this.ValidToColumn.setSortOrder(SortOrder);
        },

        compareValidToDate: function(value1, value2){
            if ((value1 == null || value1 == undefined || value1 == '') &&
            (value2 == null || value2 == undefined || value2 == '')) return 0;
            if ((value1 == null || value1 == undefined || value1 == '')) return -1;
            if ((value2 == null || value2 == undefined || value2 == '')) return 1;
            value1 = new Date(value1).getTime();
            value2 = new Date(value2).getTime();
            if(parseInt(value1) < parseInt(value2)) return -1;
            if(parseInt(value1) == parseInt(value2)) return 0;
            if(parseInt(value1) > parseInt(value2)) return 1;  
        },

        openfilterByValidToDateDialog: function(){
            this.openDialog("FilterByDateDialog");
        },

        filterByDate: function(){
            var dateFrom = this.getView().getModel("view").getProperty("/dateFromFilter");
            var dateTo = this.getView().getModel("view").getProperty("/dateToFilter");
            this.filters = this.filters.filter(function(value){ 
                return "VALID_TO" != value.column;
            }.bind(this));
            if((dateTo != "" && dateTo !== undefined) || (dateFrom != ""  && dateFrom !== undefined)){
                if(dateFrom == "" || dateFrom == undefined){
                    dateFrom = "1/1/01";
                }
                if(dateTo == "" || dateTo == undefined){
                    dateTo = "9/9/9999";
                }
                dateFrom = new Date(dateFrom).getUTCTime();
                dateTo = new Date(dateTo).getUTCTime();
                var oFilter1 = new sap.ui.model.Filter({
                    path: this.activeColumnFiltered, 
                    test: function(oValue) {
                        if(!$.isEmptyObject(oValue.VALID_TO)){
                            var newOValue = new Date(oValue.VALID_TO).getTime();
                            return newOValue >= dateFrom && newOValue <= dateTo;
                        }
                        return false;
                    },
                });
                this.filters.push(oFilter1);
                this.byId("rententionsTable").getBinding("rows").filter(this.filters, sap.ui.model.FilterType.Application);
                this.byId("VALID_TO").setFiltered(true);
                this.onClose('FilterByDate');
                return;
            }
            
            this.byId("rententionsTable").getBinding("rows").filter(this.filters, sap.ui.model.FilterType.Application);
            this.byId("VALID_TO").setFiltered(false);
            this.onClose('FilterByDate');
            return;
            
        },

        onClose: function (name) {
            if (!this.byId(name)) {
                return;
            }
            this.byId(name).close();
            this.byId(name).destroy();
        },

        deleteRetentionPeriod: function(){
            var selectedRetentionPeriods = Models.getProperty.call(this, "view", "/SelectedForDeletionRetentionPeriods");
            var body = [];
            for (let i = 0; i < selectedRetentionPeriods.length; i++) {
                body.push({
                    ENTITY: selectedRetentionPeriods[i].ENTITY,
                    SUBJECT: selectedRetentionPeriods[i].SUBJECT
                });
            }
            Models.setProperty.call(this,"view", "/deleteDialogBusy", true);

            BackendConnector.doDelete({
                constant: "RETENTION_PERIODS",
            },
            body,
            oResponse => {
                this.byId("rententionsTable").clearSelection();
                Models.setProperty.call(this,"view", "/deleteDialogBusy", false);
                this.onClose("DeleteRetentionPeriod");
                this.refreshTable();
                MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataDeleted"), this.MessageType.Success, this.oButtonPopover);
            },
            function(oXHR, sTextStatus, sErrorThrown) {
                Models.setProperty.call(this,"view", "/deleteDialogBusy", false);
                this.onClose("DeleteRetentionPeriod");
                MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
            }.bind(this)
        );
        },

        saveRetentionPeriod: function(){

            if(this.addOrEdit == "add"){
                this.createNewRetentionPeriod();
            }
            else{
                this.updateRetentionPeriod();
            }
        },

        createNewRetentionPeriod: function(){
            var body = Models.getProperty.call(this, "view", "/addEditRetentionPeriodDialogItem");
            if(!this.validateBody(body)){
                return
            };
            if(body.VALID_FOR == 0){
                body.VALID_FOR = null;
            }
            if(body.VALID_TO != null){
                body.VALID_TO += "T00:00:00.000Z"
            }
            Models.setProperty.call(this,"view", "/addEditDialogBusy", true);
            BackendConnector.doPost({
                    constant: "RETENTION_PERIODS",
                },
                [body],
                oResponse => {
                    Models.setProperty.call(this,"view", "/addEditDialogBusy", false);
                    this.onClose("AddEditRetentionPeriod");
                    this.refreshTable();
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataSaved"), this.MessageType.Success, this.oButtonPopover);
                },
                function(oXHR, sTextStatus, sErrorThrown) {	 
                    Models.setProperty.call(this,"view", "/addEditDialogBusy", false);
                    this.onClose("AddEditRetentionPeriod");
                    MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
                }.bind(this)
            );
        },

        updateRetentionPeriod: function(){
            var body = Models.getProperty.call(this, "view", "/addEditRetentionPeriodDialogItem");
            if(!this.validateBody(body)){
                return
            };
            if(body.VALID_FOR == 0){
                body.VALID_FOR = null;
            }
            if(body.VALID_TO != null){
                body.VALID_TO += "T00:00:00.000Z"
            }
            Models.setProperty.call(this,"view", "/addEditDialogBusy", true);
            BackendConnector.doPut({
                    constant: "RETENTION_PERIODS",
                },
                [body],
                oResponse => {
                    Models.setProperty.call(this,"view", "/addEditDialogBusy", false);
                    this.onClose("AddEditRetentionPeriod");
                    this.refreshTable();
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataSaved"), this.MessageType.Success, this.oButtonPopover);
                },
                function(oXHR, sTextStatus, sErrorThrown) {	 
                    this.onClose("AddEditRetentionPeriod");
                    MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
                }.bind(this)
            );
        },

        validateBody: function(body){
            Models.setProperty.call(this, "view", "/valueStateVALID_FOR", "None");
            Models.setProperty.call(this, "view", "/valueTextVALID_FOR", "");
            Models.setProperty.call(this, "view", "/valueStateVALID_TO", "None");
            Models.setProperty.call(this, "view", "/valueTextVALID_TO", "");
            Models.setProperty.call(this, "view", "/valueStateSUBJECT", "None");
            Models.setProperty.call(this, "view", "/valueTextSUBJECT", "");
            if(body.SUBJECT == "*" && body.VALID_TO != "" && body.VALID_TO != null){
                Models.setProperty.call(this, "view", "/valueStateVALID_FOR", "Error");
                Models.setProperty.call(this, "view", "/valueTextVALID_FOR", "");
                Models.setProperty.call(this, "view", "/addEditRetentionPeriodDialogItem/VALID_TO", null);
                return false;
            }
            if(body.SUBJECT != "*" && body.VALID_FOR != 0 && body.VALID_FOR != null){
                Models.setProperty.call(this, "view", "/valueStateVALID_TO", "Error");
                Models.setProperty.call(this, "view", "/valueTextVALID_TO", "");
                Models.setProperty.call(this, "view", "/addEditRetentionPeriodDialogItem/VALID_FOR", null);
                return false;
            }
            if(body.ENTITY == "USER" && body.SUBJECT == "*"){
                Models.setProperty.call(this, "view", "/valueStateSUBJECT", "Error");
                Models.setProperty.call(this, "view", "/valueTextSUBJECT", ResourceBundle.getResourceBundleText.call(this, "XTOL_UserStar"));
                return false;
            }
            if((body.SUBJECT == "" || body.SUBJECT == null) && body.ENTITY !== "User" ){
                Models.setProperty.call(this, "view", "/valueStateSUBJECT", "Error");
                Models.setProperty.call(this, "view", "/valueTextSUBJECT", ResourceBundle.getResourceBundleText.call(this, "XTOL_SubjectEmpty"));
                return false;
            }
            if(body.ENTITY == "USER" && (body.VALID_TO == "" || body.VALID_TO == null)){
                Models.setProperty.call(this, "view", "/valueStateVALID_TO", "Error");
                Models.setProperty.call(this, "view", "/valueTextVALID_TO", ResourceBundle.getResourceBundleText.call(this, "XTOL_UserValidTo"));
                return false;
            }
            
            if((body.VALID_FOR == 0 || body.VALID_FOR == null || body.VALID_FOR > 600) && (body.VALID_TO == "" || body.VALID_TO == null || !this.byId('AddEditDialogValidToDatePickers').isValidValue())){
                var validFor = Models.getProperty.call(this, "view", "/ValidForEnabled");
                var validTo = Models.getProperty.call(this, "view", "/ValidToEnabled");
                if(validFor){
                    Models.setProperty.call(this, "view", "/valueStateVALID_FOR", "Error");
                    var errorMessage = ((body.VALID_FOR > 600) ? "XMSG_VALID_FOR_Description_Maximum_Number" : "XMSG_VALID_FOR_Description_0");
                    Models.setProperty.call(this, "view", "/valueTextVALID_FOR", ResourceBundle.getResourceBundleText.call(this, errorMessage));
                }
                if(validTo){
                    Models.setProperty.call(this, "view", "/valueStateVALID_TO", "Error");
                    Models.setProperty.call(this, "view", "/valueTextVALID_TO", ResourceBundle.getResourceBundleText.call(this, "XTOL_UserValidTo"));
                }
                return false;
            }
            return true;
        },
        
        onChangeValidForOrValidTo: function(path){
            Models.setProperty.call(this, "view", "/addEditRetentionPeriodDialogItem/"+path, null);
        },

        onEntityTypeChanged: function(oEvent){
            if(oEvent.getParameter("selectedItem").getKey() == "User"){
                Models.setProperty.call(this, "view", "/addEditRetentionPeriodDialogItem/SUBJECT", null);
                Models.setProperty.call(this, "view", "/SubjectEnabled", false);
                Models.setProperty.call(this, "view", "/ValidForEnabled", false);
                Models.setProperty.call(this, "view", "/ValidToEnabled", true);
            }else{
                Models.setProperty.call(this, "view", "/addEditRetentionPeriodDialogItem/SUBJECT", "*");
                Models.setProperty.call(this, "view", "/SubjectEnabled", true);
                Models.setProperty.call(this, "view", "/ValidForEnabled", true);
                Models.setProperty.call(this, "view", "/ValidToEnabled", false);
            }
        },

        SubjectChanged: function(oEvent){
            if(oEvent.getParameter("value") == "*"){
                Models.setProperty.call(this, "view", "/ValidForEnabled", true);
                Models.setProperty.call(this, "view", "/ValidToEnabled", false);
            }else{
                Models.setProperty.call(this, "view", "/ValidForEnabled", false);
                Models.setProperty.call(this, "view", "/ValidToEnabled", true);
            }
        },

        formatValidTo: function(validTo){
            if(validTo==null){
                return;
            }
            var oDateFormat = DateFormat.getDateInstance({
                style: "short"
            }, new sap.ui.core.Locale(sap.ui.getCore().getConfiguration().getLanguage()));
            return oDateFormat.format(new Date(validTo));
        },

        clearAllTableFilters : function(){
            var iColCounter = 0;
            this.oTable.clearSelection();
            var iTotalCols = this.oTable.getColumns().length;
            var oListBinding = this.oTable.getBinding();
            if (oListBinding) {
                oListBinding.aSorters = "";
                oListBinding.aFilters = "";
                oListBinding.oCombinedFilter = "";
            }
            this.oTable.getBinding().getModel('HearingsModel').refresh(true);
            for ( iColCounter = 0; iColCounter < iTotalCols; iColCounter++) {
                this.oTable.getColumns()[iColCounter].setSorted(false);
                this.oTable.getColumns()[iColCounter].setFilterValue("");
                this.oTable.getColumns()[iColCounter].setFiltered(false);
            }
            this.oTable.getBinding().refresh(true);
        },


        formatEntityText: function(text){
            return ResourceBundle.getResourceBundleText.call(this, text);
        },

        setRententionPeriodDeleteButtonIsEnabled : function(oEvent){
            if (oEvent.getSource().getSelectedIndices().length < 1){
                Models.setProperty.call(this, "view", "/bDeleteRetentionPeriodBtnIsEnabled", false);
            }
            else {
                Models.setProperty.call(this, "view", "/bDeleteRetentionPeriodBtnIsEnabled", true);
            }
        }
	});
});
