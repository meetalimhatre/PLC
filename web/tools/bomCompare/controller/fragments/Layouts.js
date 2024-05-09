sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "core/connector/BackendConnector",
    "sap/ui/core/Fragment",
    "sap/ui/core/library",
    "core/utils/Constants",
    "core/utils/MessageHelpers",
    "core/utils/Models",
    "core/utils/ResourceBundle"
], function (JSONModel, Filter, FilterOperator, BackendConnector, Fragment, library, Constants, MessageHelpers, Models, ResourceBundle) {
    "use strict";
    var layouts;
    var dontRunAgain;
    var MessageType = library.MessageType;
    
    layouts = {

        fragmentOpened: "",
        currentViewThis: "",
        rowClicks: 0,
        lastSelectedRowPath: "",
        
        sortLayoutsColumns: function (layouts) {
            for (let layout of layouts) {
                layout.LAYOUT_COLUMNS.sort((a, b) => {
                    if (a.DISPLAY_ORDER < b.DISPLAY_ORDER) {
                        return -1;
                    }
                    if (a.DISPLAY_ORDER > b.DISPLAY_ORDER) {
                        return 1;
                    }
                    return 0;
                }) 
            }
        },

        updateLayoutsWithTableWidths: function () {
            var layoutColumns = Models.getProperty.call(this,"view", "/Layout");
            var treeTable = this.byId("treeTable");
            var columns = treeTable.getColumns();

            var updatedLayout = [];

            // First update the Item Key column width
            var currentColumnLabel = columns[0].mAggregations.label.mProperties.text;
            var correspondingLayoutColumn = layoutColumns.find(layoutColumn => layoutColumn.name === currentColumnLabel);
            var width = columns[0].mProperties.width;

            correspondingLayoutColumn.COLUMN_WIDTH = parseInt(width.replace("px", ""));
            updatedLayout.push(correspondingLayoutColumn);
            
            // Then update all the other column widths
            for (var i = 2; i < columns.length; i += 2) {

                var currentColumnLabel, numberOfLabels;
                if (columns[i].mAggregations.multiLabels.length > 0) {
                    currentColumnLabel = columns[i].mAggregations.multiLabels[0].mProperties.text;
                    numberOfLabels = columns[i].mAggregations.multiLabels.length;
                }
                else{
                    currentColumnLabel = columns[i].mAggregations.label.mProperties.text;
                    numberOfLabels = 1;
                }
                var correspondingLayoutColumn = layoutColumns.find(layoutColumn => layoutColumn.name === currentColumnLabel);
                var width = columns[i].mProperties.width;

                correspondingLayoutColumn.COLUMN_WIDTH = width.replace("px", "") * numberOfLabels;
                updatedLayout.push(correspondingLayoutColumn);
            }

            Models.setProperty.call(this,"view", "/Layout", updatedLayout);

             // also update the updated layout in the list of layouts
            var layouts = Models.getProperty.call(this,"view", "/Layouts");
            layouts = layouts.map(layout => {
                if (layout.LAYOUT_ID === Models.getProperty.call(this,"view", "/LayoutId")) {
                    layout.LAYOUT_COLUMNS = updatedLayout;
                }

                return layout;
            });
            Models.setProperty.call(this,"view", "/Layouts", layouts);
        },

        openLayoutFragment: function (fragment, currentViewThis) {
            var fragmentOpened = "";
            var fragmentName = "ui.view.fragments.layouts.";
            var functionToRunOnLoad = "";
            switch (fragment) {
                case "edit":
                    fragmentOpened = "Columns";
                    functionToRunOnLoad = this.editStart.bind(this);
                    break;
                case "change":
                    fragmentOpened = "SearchLayouts";
                    functionToRunOnLoad = this.changeStart.bind(this);
                    break;
                case "delete":
                    fragmentOpened = "Delete";
                    functionToRunOnLoad = this.deleteStart.bind(this);
                    break;
                case "new":
                    fragmentOpened = "Columns";
                    functionToRunOnLoad = this.newStart.bind(this);
                    break;
                default:
                    break;
            }
            fragmentName += fragmentOpened;
            this.currentViewThis = currentViewThis;
            var oView = this.currentViewThis.getView();
            if (!this.currentViewThis.byId(fragmentOpened)) {
                Fragment.load({
                    containingView: oView,
                    name: fragmentName,
                    controller: this,
                    id: oView.getId()
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    oDialog.open();
                    return oDialog;
                }.bind(this));
            } else {
                this.currentViewThis.byId(fragmentOpened).open();
            }

            functionToRunOnLoad();
        },

        editStart: function () {
            this.saveType = "Update";
            Models.setProperty.call(this.currentViewThis, "view", "/NELayoutName", Models.getProperty.call(this.currentViewThis, "view", "/LayoutName"));
            Models.setProperty.call(this.currentViewThis, "view", "/ColumnsTitle", ResourceBundle.getResourceBundleText.call(this.currentViewThis, "XTIT_EditLayout"));

            var layout = Models.getProperty.call(this.currentViewThis,"view", "/Layout");
            var availableColumns = Models.getProperty.call(this.currentViewThis,"view", "/AvailableColumns");
            var selectedColumns = layout.filter(layoutCol => availableColumns.find(selectableCol => layoutCol.COLUMN_ID === selectableCol.COLUMN_ID));
            var notSelectedColumns = availableColumns.filter(selectableCol => !layout.find(layoutCol => layoutCol.COLUMN_ID === selectableCol.COLUMN_ID));
            
            Models.setProperty.call(this.currentViewThis,"view", "/SelectedColumns", selectedColumns);
            Models.setProperty.call(this.currentViewThis,"view", "/NotSelectedColumns", notSelectedColumns);

            var columnsTable = this.currentViewThis.getView().byId("columnsTable");
            var layoutCount = layout.length - 1; // don't include the item key

            if (layoutCount == 0) {
                columnsTable.setSelectionInterval(-1, -1);
            } else {
                columnsTable.setSelectionInterval(-1, layoutCount);
            }
        },

        changeStart: function () {

        },

        deleteStart: function () {

        },

        newStart: function () {
            this.saveType = "save";
            Models.setProperty.call(this.currentViewThis,"view", "/NELayoutName", "");
            Models.setProperty.call(this.currentViewThis,"view", "/ColumnsTitle", ResourceBundle.getResourceBundleText.call(this.currentViewThis, "XTIT_newLayout"));

            var selectedColumns = [];
            var notSelectedColumns = Models.getProperty.call(this.currentViewThis,"view", "/AvailableColumns");
            
            Models.setProperty.call(this.currentViewThis,"view", "/SelectedColumns", selectedColumns);
            Models.setProperty.call(this.currentViewThis,"view", "/NotSelectedColumns", notSelectedColumns);

            var columnsTable = this.currentViewThis.getView().byId("columnsTable");
            columnsTable.setSelectionInterval(-1, -1);
        },

        onSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("LAYOUT_NAME", FilterOperator.Contains, sValue);
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        onSearchDialogClose: function (oEvent) {
            var item = oEvent.getParameter("rowContext");
            layouts.setupLayoutAndCreateColumns.call(this, Models.getProperty.call(this,"view", item.sPath));
        },

        setupLayoutAndCreateColumns: function (item) {
            var baseColumns = Models.getProperty.call(this,"view", "/BaseColumns");
            var layoutModified = [];
            var layoutColumns = item.LAYOUT_COLUMNS;
            layoutColumns.forEach(layoutColumn => {
                baseColumns.forEach(baseColumn => {
                    if (baseColumn.COLUMN_ID === layoutColumn.COLUMN_ID) {
                        baseColumn.COLUMN_WIDTH = layoutColumn.COLUMN_WIDTH
                        layoutModified.push(baseColumn);
                        return; 
                    }
                });
            });
            Models.setProperty.call(this,"view", "/Layout", layoutModified);
            Models.setProperty.call(this,"view", "/LayoutName", item.LAYOUT_NAME);
            Models.setProperty.call(this,"view", "/LayoutId", item.LAYOUT_ID);
            Models.setProperty.call(this,"view", "/is_corporate", item.IS_CORPORATE == 0 ? false : true);
            if (this.byId("Columns")) {
                this.onClose("Columns");
            }
            this.createColumns();
            var results = Models.getProperty.call(this,"view", "/BomCalculations");
            results = layouts.resetStatus(results, layoutModified);
            results = this.setupStatusBasedOnColumns(results);
            Models.setProperty.call(this,"view", "/BomCalculations", results);
        },

        resetStatus: function(results, layoutModified){
            results.map(bomCalculation => {
                if (bomCalculation.Status != "Success" && bomCalculation.Status != "Error") {
                    bomCalculation.Status = "None";
                }
                if(Object.keys(bomCalculation).includes("children") && bomCalculation["children"].length > 0){
                    bomCalculation["children"] = layouts.resetStatus(bomCalculation["children"],layoutModified)
                }
            });
            return results
        },

        deleteLayout: function () {
            var data = {
                "LAYOUT_ID": Models.getProperty.call(this,"view", "/LayoutId")
            };
            BackendConnector.doDelete({
                    constant: "LAYOUTS_CREATE_UPDATE",
                    parameters: {
                        is_corporate: Models.getProperty.call(this,"view", "/is_corporate")
                    }
                }, data,
                oResponse => {
                    this.onClose("Delete");
                    Models.setProperty.call(this,"view", "/LayoutsBusy", true);
                    var layouts = Models.getProperty.call(this,"view", "/Layouts");
                    var defaultLayout = layouts.find(element => element['LAYOUT_NAME'] = Constants.SAP_DEFAULT_LAYOUT_NAME);
                    layouts = layouts.filter(layout => layout.LAYOUT_ID !== Models.getProperty.call(this,"view", "/LayoutId"));
                    Models.setProperty.call(this,"view", "/Layouts", layouts);
                    Models.setProperty.call(this,"view", "/LayoutsBusy", false);
                    this.layouts.setupLayoutAndCreateColumns.call(this, Models.getProperty.call(this,"view", "/Layouts/" + layouts.findIndex(layout => layout == defaultLayout)));
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_successfulLayoutDelete"), MessageType.Success, this.oButtonPopover);
                    this.openLayoutFragment('change');
                },
                oResponse => {
                    this.onClose("Delete");
                    Models.setProperty.call(this,"view", "/LayoutsBusy", false);
                    MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage(oResponse.status), MessageType.Error, this.oButtonPopover);
                }
            );
        },

        save: function () {
            if (Models.getProperty.call(this,"view", "/NELayoutName").length < 1) {
                Models.setProperty.call(this,"view", "/ValidateLayoutName", "Error");
                return;
            }
            Models.setProperty.call(this,"view", "/ValidateLayoutName", "None");
            var selectedColumnsWithItemKey;
            if (layouts.saveType === "Update") {
                selectedColumnsWithItemKey = [Models.getProperty.call(this,"view", "/Layout").find(col => col.COLUMN_ID === "ITEM_KEY")];
            }
            else{
                selectedColumnsWithItemKey = [Models.getProperty.call(this,"view", "/BaseColumns").find(col => col.COLUMN_ID === "ITEM_KEY")];
            }
            selectedColumnsWithItemKey.push(...Models.getProperty.call(this,"view", "/SelectedColumns"));
            Models.setProperty.call(this,"view", "/columnsBusy", true);
            if (layouts.saveType === "Update") {
                layouts.applyLayoutEditChanges.call(this, selectedColumnsWithItemKey);
            } else {
                var sendingLayout = layouts.buildLayoutToSend.call(this, Models.getProperty.call(this,"view", "/NELayoutName"), selectedColumnsWithItemKey);
                layouts.create.call(this, sendingLayout);
            }
        },

        applyLayoutEditChanges: function (columns) {
            columns = this.layouts.buildLayoutToSend.call(this, Models.getProperty.call(this,"view", "/NELayoutName"), columns);
            Models.setProperty.call(this,"view", "/Layout", columns.LAYOUT_COLUMNS);
            Models.setProperty.call(this,"view", "/LayoutName", columns.LAYOUT_NAME);

            columns.LAYOUT_ID = Models.getProperty.call(this,"view", "/LayoutId");
            columns.IS_CORPORATE = Models.getProperty.call(this,"view", "/is_corporate");

            this.layouts.setupLayoutAndCreateColumns.call(this, columns);
            Models.setProperty.call(this,"view", "/columnsBusy", false);
            Models.setProperty.call(this,"view", "/LayoutHasEdits", true);
            this.onClose("Columns");
        },

        buildLayoutToSend: function (layoutName, layout) {
            var sendingLayout = {
                "LAYOUT_ID": 0,
                "LAYOUT_NAME": layoutName,
                "IS_CURRENT": 0,
                "LAYOUT_TYPE": 2,
                "LAYOUT_COLUMNS": []
            };
            
            var count = 0;
            if (Array.isArray(layout)) {
                layout.forEach(columns => {
                    sendingLayout.LAYOUT_COLUMNS.push({
                        "DISPLAY_ORDER": count,
                        "PATH": "Item",
                        "BUSINESS_OBJECT": "Item",
                        "COLUMN_ID": columns.COLUMN_ID,
                        "COLUMN_WIDTH": columns.COLUMN_WIDTH ?? 320
                    });
                    count++;
                });
            }
            return sendingLayout;
        },

        update: function (sendingLayout) {
            sendingLayout.LAYOUT_ID = Models.getProperty.call(this,"view", "/LayoutId");
            var is_corporate = Models.getProperty.call(this,"view", "/is_corporate");
            BackendConnector.doPut({
                    constant: "LAYOUTS_CREATE_UPDATE",
                    parameters: {
                        is_corporate: is_corporate
                    }
                },
                sendingLayout,
                oResponse => {
                    Models.setProperty.call(this,"view", "/LayoutHasEdits", false);
                    layouts.createUpdateGetId.call(this, sendingLayout.LAYOUT_NAME, oResponse);
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_successfulLayoutUpdate"), MessageType.Success, this.oButtonPopover);
                },
                oResponse => {
                    Models.setProperty.call(this,"view", "/columnsBusy", false);
                    Models.setProperty.call(this,"view", "/treeBusy", false);
                    if (oResponse.status === 409) {
                        MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_layoutNameConflict"), MessageType.Error, this.oButtonPopover);
                    }
                    else {
                        MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage(oResponse.status), MessageType.Error, this.oButtonPopover);
                    }
                }
            );
        },

        create: function (sendingLayout) {
            var is_corporate = Models.getProperty.call(this,"view", "/is_corporate");
            BackendConnector.doPost({
                    constant: "LAYOUTS_CREATE_UPDATE",
                    parameters: {
                        is_corporate: is_corporate
                    }
                },
                sendingLayout,
                oResponse => {
                    layouts.createUpdateGetId.call(this, sendingLayout.LAYOUT_NAME, oResponse);
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this,"XMSG_successfulLayoutCreate"), MessageType.Success, this.oButtonPopover);
                },
                oResponse => {
                    Models.setProperty.call(this,"view", "/columnsBusy", false);
                    Models.setProperty.call(this,"view", "/treeBusy", false);
                    if (oResponse.status === 409) {
                        MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_layoutNameConflict"), MessageType.Error, this.oButtonPopover);
                    }
                    else {
                        MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage(oResponse.status), MessageType.Error, this.oButtonPopover);
                    }
                }
            );
        },

        createUpdateGetId: function (LAYOUT_NAME, oResponse) {
            var LAYOUT_ID = oResponse.body.LAYOUT_ID;
            Models.setProperty.call(this,"view", "/LayoutName", LAYOUT_NAME)
            BackendConnector.doGet({
                    constant: "LAYOUTS"
                },
                oResponse => layouts.createLayoutObjectAndCreateColumns.call(this, LAYOUT_ID, oResponse)
            );
        },

        createLayoutObjectAndCreateColumns: function (LAYOUT_ID, oResponse) {
            var oLayouts = oResponse.body.LAYOUTS;
            layouts.prepareLayouts.call(this, oLayouts);
            
            Models.setProperty.call(this, "view", "/Layouts", oLayouts);
            Models.setProperty.call(this,"view", "/LayoutId", LAYOUT_ID);

            oLayouts.forEach(Layout => {
                if (Layout.LAYOUT_ID == LAYOUT_ID) {
                    layouts.setupLayoutAndCreateColumns.call(this, Layout);
                }
            });
            
            Models.setProperty.call(this,"view", "/columnsBusy", false);
            Models.setProperty.call(this,"view", "/treeBusy", false);
        },

        removeCurrentLayout: function (oLayouts) {
            var currentLayout = oLayouts.find(layout => layout.IS_CURRENT === 1);
            if (currentLayout) {
                Models.setProperty.call(this,"view", "/CurrentLayoutId", currentLayout.LAYOUT_ID);
                Models.setProperty.call(this,"view", "/LayoutToDisplayInitiallyId", parseInt(currentLayout.LAYOUT_NAME));
                oLayouts.splice(oLayouts.indexOf(currentLayout), 1);
            }
        },

        onMoveTop: function (oEvent) {
            var boundArray = Models.getProperty.call(this, "view", "/SelectedColumns");
            var selectedIndex = parseInt(oEvent.getSource().getParent().oBindingContexts.view.sPath.split("/SelectedColumns/")[1]);

            boundArray.splice(0, 0, boundArray.splice(selectedIndex, 1)[0]);
            layouts.deselectTableRows.call(this);
            Models.getModel.call(this, "view").refresh();
        },

        onMoveUp: function (oEvent) {
            var boundArray = Models.getProperty.call(this, "view", "/SelectedColumns");
            var selectedIndex = parseInt(oEvent.getSource().getParent().oBindingContexts.view.sPath.split("/SelectedColumns/")[1]);

            boundArray.splice(selectedIndex - 1, 0, boundArray.splice(selectedIndex, 1)[0]);
            layouts.deselectTableRows.call(this);
            Models.getModel.call(this, "view").refresh();
        },

        onMoveDown: function (oEvent) {
            var boundArray = Models.getProperty.call(this, "view", "/SelectedColumns");
            var selectedIndex = parseInt(oEvent.getSource().getParent().oBindingContexts.view.sPath.split("/SelectedColumns/")[1]);

            boundArray.splice(selectedIndex + 1, 0, boundArray.splice(selectedIndex, 1)[0]);
            layouts.deselectTableRows.call(this);
            Models.getModel.call(this, "view").refresh();
        },

        onMoveBottom: function (oEvent) {
            var boundArray = Models.getProperty.call(this, "view", "/SelectedColumns");
            var selectedIndex = parseInt(oEvent.getSource().getParent().oBindingContexts.view.sPath.split("/SelectedColumns/")[1]);

            boundArray.splice(boundArray.length - 1, 0, boundArray.splice(selectedIndex, 1)[0]);
            layouts.deselectTableRows.call(this);
            Models.getModel.call(this, "view").refresh();
        },

        deselectTableRows: function() {
            var columnsTable = this.getView().byId("columnsTable");
            var columnsTable2= this.getView().byId("columnsTable2");
            dontRunAgain = true;
            columnsTable.setSelectionInterval(-1, -1);
            columnsTable2.setSelectionInterval(-1, -1);
            dontRunAgain = false;
        },

        identifyEventSourceTable: function (oEvent) {
            var boundArrayName;
            var tableId = oEvent.getSource().sId.split("--")[2];

            if (tableId === "columnsTable2") {
                boundArrayName = "SelectedColumns";
            }
            else {
                boundArrayName = "NotSelectedColumns";
            }

            return boundArrayName;
        },

        onSelectionChange: function (oEvent) {
            let nRowIndex = oEvent.getParameter('rowIndex');
            if (nRowIndex != Constants.BOM_COMPARE.TABLE_NO_ROW_SELECTED) {
            var sSelectedItemPath = oEvent.getParameter("rowContext").sPath;

            if (layouts.rowClicks === 0 || layouts.lastSelectedRowPath != sSelectedItemPath)
            {
                layouts.lastSelectedRowPath = sSelectedItemPath;
                layouts.rowClicks = 1;
                setTimeout(() => {
                    if (layouts.lastSelectedRowPath === sSelectedItemPath) {
                        layouts.rowClicks = 0;
                    }
                }, 500);
            }
            else if (layouts.rowClicks === 1) {
                layouts.rowClicks = 0;
                layouts.handleRowDoubleClick.call(this, oEvent);
            } }

        },

        handleRowDoubleClick: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("rowContext");
            
            if (oSelectedItem == undefined) {
                return;
            }
            if (dontRunAgain) {
                return;
            }

            var boundArrayName = layouts.identifyEventSourceTable(oEvent);
            var boundArray = Models.getProperty.call(this, "view", "/" + boundArrayName);
            var elementIndex = oSelectedItem.sPath.split("/" + boundArrayName + "/")[1];

            if (boundArrayName === "SelectedColumns") {
                var targetArray = Models.getProperty.call(this, "view", "/NotSelectedColumns");
                targetArray.splice(targetArray.length, 0, boundArray[elementIndex]);
                targetArray.sort(function(a, b) {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                });
            } else {
                var targetArray = Models.getProperty.call(this, "view", "/SelectedColumns");
                targetArray.splice(targetArray.length, 0, boundArray[elementIndex]);
            }
            
            boundArray.splice(elementIndex, 1);
            Models.getModel.call(this, "view").refresh();
        },

        selectAllColumns: function () {
            var notSelectedColumns = Models.getProperty.call(this, "view", "/NotSelectedColumns");
            var selectedColumns = Models.getProperty.call(this, "view", "/SelectedColumns");
            selectedColumns.push(...notSelectedColumns);
            notSelectedColumns.splice(0, notSelectedColumns.length);
            Models.getModel.call(this, "view").refresh();
        },

        deSelectAllColumns: function () {
            var notSelectedColumns = Models.getProperty.call(this, "view", "/NotSelectedColumns");
            var selectedColumns = Models.getProperty.call(this, "view", "/SelectedColumns");
            notSelectedColumns.push(...selectedColumns);
            selectedColumns.splice(0, selectedColumns.length);
            Models.getModel.call(this, "view").refresh();
        },

        showColumnsInLayout: function (oEvent) {
            var oRow = oEvent.getParameter("row");
            var layout = Models.getProperty.call(this,"view", oRow.oBindingContexts.view.sPath).LAYOUT_COLUMNS;
            var displayColumns = [];
            layout.forEach(column => {
                displayColumns.push({
                    ColumnName: ResourceBundle.getResourceBundleText.call(this, "XCOL_column." + column.COLUMN_ID)
                })
            });
            Models.setProperty.call(this, "view", "/ShowLayout", displayColumns);
        },

        translateLayouts: function (oLayouts) {
            for (var i=0; i<oLayouts.length; i++) {
                var currLayout = oLayouts[i];
                var isCurrLayoutCorporate = currLayout.IS_CORPORATE;
                if (isCurrLayoutCorporate == 1) {
                    currLayout["IS_CORPORATE_translated"] = ResourceBundle.getResourceBundleText.call(this, "XFLD_yes");
                } 
                else {
                    currLayout["IS_CORPORATE_translated"] = ResourceBundle.getResourceBundleText.call(this, "XFLD_no")
                }
            }
        },

        prepareLayouts: function (oLayouts) {
            layouts.removeCurrentLayout.call(this, oLayouts);
            layouts.sortLayoutsColumns.call(this, oLayouts);
            layouts.translateLayouts.call(this, oLayouts);
            var defaultLayoutIndex = oLayouts.findIndex(layout => layout.LAYOUT_NAME === Constants.SAP_DEFAULT_LAYOUT_NAME);
            oLayouts.splice(0, 0, oLayouts.splice(defaultLayoutIndex, 1)[0]);
        }
    };

    return layouts;
});