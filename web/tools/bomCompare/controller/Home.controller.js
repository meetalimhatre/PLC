sap.ui.define([
    "ui/controller/BaseController",
    'ui/controller/fragments/Layouts',
    'sap/ui/model/json/JSONModel',
    'sap/ui/export/library',
    "sap/ui/core/library",
    'sap/ui/export/Spreadsheet',
    "core/connector/BackendConnector",
    "sap/ui/core/Fragment",
    "core/utils/Constants",
    "core/utils/Converters",
    "core/utils/MessageHelpers",
    "core/utils/Models",
    "core/utils/Router",
    "core/utils/ResourceBundle",
    "core/toolBarMessages/ToolBarMessages",
    "core/utils/Helpers",
    "sap/m/library"
], function (Controller, Layouts, JSONModel, exportLibrary, library, Spreadsheet, BackendConnector,
    Fragment, Constants, Converters, MessageHelpers, Models, Router, ResourceBundle, ToolBarMessages, Helpers) {
    "use strict";

    var MessageType = library.MessageType;

    return Controller.extend("ui.controller.Home", {

        EdmType: exportLibrary.EdmType,
        layouts: Layouts,
        ToolBarMessages: ToolBarMessages,
        singleLabelledColumnIds: ["ITEM_KEY", "PARENT_KEY"],
        Helpers: Helpers,

        onInit: function () {
            this.jsonModel = new JSONModel({
                SelectedCount: 0,
                TotalCount: 0,
                LayoutName: "",
                LayoutId: "-1",
                LayoutHasEdits: false,
                BaseColumns: [],
                ItemKeyColumn: {},
                Layout: {},
                Layouts: [],
                is_corporate: false,
                SendingLayout: {},
                LayoutsBusy: true,
                ExportName: "Bom_Compare",
                Version1: "",
                Version2: "",
                Version1ID: "",
                Version2ID: "",
                NELayoutName: "",
                ColumnsTitle: "",
                EnableExcel: false,
                EnableExpComp: false,
                BomCalculations: [],
                BomCount: 0,
                currentGathered: 0,
                AllColumns: [],
                columnsBusy: false,
                ShowLayout: [],
                treeBusy: true,
                ValidateLayoutName: "None",
                accessibilityState: false,
                CurrentLayoutId: 0,
                DefaultLayoutId: 0,
                LayoutToDisplayInitiallyId: 0,
                ColumnsButtonText: ResourceBundle.getResourceBundleText.call(this, "XBUT_btnSave"),
                LastInputHelpPressed: {},
                AvailableColumns: [],
                SelectedColumns: [],
                NotSelectedColumns: [],
                TotalNumberOfReceivedSpreadsheetRows: 0,
                TotalNumberOfRows: 0,
                NumOfNodeExportRequests: 0,
                NumOfNodeRequests: 1,
                TotalNumberOfReceivedNodeRows: 0,
                RefCalculationVersion1ID: 0,
                RefCalculationVersion2ID: 0
            });
            this.jsonModel.setSizeLimit(1000000);
            Models.setModel.call(this, this.jsonModel, "view");
            Models.setModel.call(this, new JSONModel(), "spreadsheetRows");
            Models.setModel.call(this, new JSONModel(), "NodeRows");
            Router.getRouter.call(this).getRoute("Home").attachMatched(this.HomeRoute.bind(this));
            Router.getRouter.call(this).getRoute("HomeWith1Id").attachMatched(this.HomeRoute.bind(this));
            Router.getRouter.call(this).getRoute("HomeWith2Ids").attachMatched(this.HomeRoute.bind(this));

            this.byId("treeTable").attachColumnResize(this.onColumnWidthChange.bind(this));

            this.byId("CalVersionInput1").attachLiveChange(this.onVersionLiveChange.bind(this));
            this.byId("CalVersionInput2").attachLiveChange(this.onVersionLiveChange.bind(this));

            this.byId("CalVersionInput1").attachSuggestionItemSelected(this.handleCalculationSelected.bind(this));
            this.byId("CalVersionInput2").attachSuggestionItemSelected(this.handleCalculationSelected.bind(this));

            this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this.oButtonPopover = this.byId("buttonMessagePopover");

            window.onbeforeunload = function (event) {
                this.updateCurrentLayout();
            }.bind(this);

            Controller.prototype.onInit.call(this);
        },

        handleCalculationSelected: function (oEvent) {
            var lastInputUsed = this.getInputControlFromEvent(oEvent);
            var selectedItem = oEvent.mParameters.selectedItem;
            this.setTooltipOnInputWithItem(lastInputUsed, selectedItem);
            var versionID = selectedItem.mProperties.key;
            var versionName = selectedItem.mProperties.additionalText;
            selectedItem.mProperties.text = versionID + " - " + versionName;
        },

        onVersionLiveChange: function (oEvent) {
            var inputControl = this.getInputControlFromEvent(oEvent);
            inputControl.removeAllSuggestionItems();
            inputControl.destroyTooltip();
            var newValue = oEvent.mParameters.newValue;
            if (newValue === "") {
                return;
            }

            setTimeout(function () {
                var currentValue = inputControl.getValue();
                if (currentValue === newValue) {
                    var aFilters = [];
                    aFilters.push(new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter({
                                path: "calculation_version_name",
                                operator: sap.ui.model.FilterOperator.Contains,
                                value1: newValue,
                                value2: null
                            }),
                            new sap.ui.model.Filter({
                                path: "calculation_name",
                                operator: sap.ui.model.FilterOperator.Contains,
                                value1: newValue,
                                value2: null
                            })
                        ],
                        and: false
                    }));

                    var oModel = this.getOwnerComponent().getModel("CalculationsOdataModel");
                    oModel.read("/versionsearch", {
                        urlParameters: {
                            "$top": 50
                        },
                        filters: aFilters,
                        success: function (oData) {
                            this.addCalculationsToSuggestedItems(oData, inputControl);
                        }.bind(this),
                        error: function (oResponse) {
                            this.handleModelReadError(oResponse);
                        }.bind(this)
                    });
                }
            }.bind(this), 500);
        },

        updateCurrentLayout: function () {
            var layoutToSend = this.layouts.buildLayoutToSend.call(this, Models.getProperty.call(this, "view", "/LayoutId").toString(), Models.getProperty.call(this, "view", "/Layout"));
            if (layoutToSend.LAYOUT_NAME === "-1" || layoutToSend.LAYOUT_NAME === null || layoutToSend.LAYOUT_NAME === undefined) {
                return;
            }
            layoutToSend.LAYOUT_ID = Models.getProperty.call(this, "view", "/CurrentLayoutId");
            layoutToSend.IS_CURRENT = 1;


            if (layoutToSend.LAYOUT_ID !== 0) {
                BackendConnector.doPut({
                        constant: "LAYOUTS_CREATE_UPDATE",
                        parameters: {
                            is_corporate: false
                        }
                    },
                    layoutToSend);
            } else {
                BackendConnector.doPost({
                        constant: "LAYOUTS_CREATE_UPDATE",
                        parameters: {
                            is_corporate: false
                        }
                    },
                    layoutToSend);
            }
        },

        initializeLayoutsAndColumns: function () {
            var layouts = Models.getProperty.call(this, "view", "/Layouts");
            if (layouts.length === 0) {
                this.getLayoutsAndSetupColumns();
            }
        },

        HomeRoute: function (oEvent) {
            var oCurrentRouteHash = Router.getRouter.call(this).getHashChanger().getHash().split("/");
            var id1 = oCurrentRouteHash[0];
            var id2 = oCurrentRouteHash[1];

            this.initializeLayoutsAndColumns();

            if (id1 !== "" && id1 !== undefined) {

                let aCalculationSuggestedItems = [];

                aCalculationSuggestedItems.push(this.checkVersionIsValid(id1, "CalVersionInput1"));
                id2 && aCalculationSuggestedItems.push(this.checkVersionIsValid(id2, "CalVersionInput2"));

                $.when(...aCalculationSuggestedItems).done(function () {
                    Models.setProperty.call(this, "view", "/Version1ID", id1);
                    Models.setProperty.call(this, "view", "/Version2ID", id2);
                    this._CallBOMCalculationForRootItem();
                }.bind(this));
            }
        },

        _CallBOMCalculationForRootItem: function () {
            let id1 = Models.getProperty.call(this, "view", "/Version1ID");
            let id2 = Models.getProperty.call(this, "view", "/Version2ID");
            var primaryInput = this.byId("CalVersionInput1");
            var secondaryInput = this.byId("CalVersionInput2");
            var primaryVersion = primaryInput.getSuggestionItems().find(item => item.mProperties.key === id1);
            var secondaryVersion = secondaryInput.getSuggestionItems().find(item => item.mProperties.key === id2);
            if (primaryVersion && secondaryVersion) {
                primaryVersion.destroyTooltip();
                secondaryInput.destroyTooltip();

                if (!$.isEmptyObject(primaryVersion) && !$.isEmptyObject(secondaryVersion)) {
                    this.setTooltipOnInputWithItem(primaryInput, primaryVersion);
                    this.setTooltipOnInputWithItem(secondaryInput, secondaryVersion);
                    Models.setProperty.call(this, "view", "/treeBusy", true);
                    Models.setProperty.call(this, "view", "/EnableExcel", true);
                    this.callForBomCalculations("null", "null");
                }
            }
        },

        checkVersionIsValid: function (id, inputControlId) {
            return new Promise(function (resolve, reject){
                var inputControl = this.byId(inputControlId);
                inputControl.removeAllSuggestionItems();

                var aFilters = [];
                aFilters.push(new sap.ui.model.Filter({
                    path: "calculation_version_id",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: id,
                    value2: null
                }));

                var oModel = this.getOwnerComponent().getModel("CalculationsOdataModel");
                oModel.read("/versionsearch", {
                    filters: aFilters,
                    success: function (oData) {
                        this.addCalculationsToSuggestedItems(oData, inputControl, true);
                        resolve();
                    }.bind(this),
                    error: function (oResponse) {
                        this.handleModelReadError(oResponse);
                        reject();
                    }.bind(this)
                });

            }.bind(this));
        },

        getColumnsAndDisplayLayout: function (layoutToDisplay) {
            BackendConnector.doGet({
                    constant: "METADATA"
                },
                function (oResponse) {
                    this.convertAndSetBaseColumns.call(this, oResponse);
                    this.layouts.setupLayoutAndCreateColumns.call(this, layoutToDisplay);
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_appSuccessfulylInitialized"), MessageType.Success, this.oButtonPopover);
                }.bind(this),
                function (oResponse) {
                    MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage(oResponse.status), MessageType.Error, this.oButtonPopover);
                }.bind(this),
                true,
                "xml"
            );
        },

        convertAndSetBaseColumns: function (oResponse) {
            var responseJson = Converters.convertXmlToJson(oResponse);
            var entityType = responseJson["edmx:Edmx"]["edmx:DataServices"]["Schema"]["EntityType"];
            var V_BOM_COMPAREType = entityType.filter(type => type["@attributes"]["Name"] == "V_BOM_COMPAREType")[0];
            var columns = [];
            V_BOM_COMPAREType.Property.forEach(type => {
                var COLUMN_ID = type["@attributes"].Name;
                if (COLUMN_ID === "ID" || COLUMN_ID.includes("_BOMC2") || COLUMN_ID.includes("IS_LEAF") || COLUMN_ID.includes("ITEM_ORDER")) {
                    return;
                }
                var columnName = ResourceBundle.getResourceBundleText.call(this, "XCOL_column." + COLUMN_ID);
                if (columnName.includes("column.")) {
                    columnName = type["@attributes"]["sap:label"];
                }

                var edmType = Converters.convertStringToEdmType(type["@attributes"]["Type"]);

                columns.push({
                    COLUMN_ID: COLUMN_ID,
                    name: columnName,
                    type: edmType,
                });
            });

            var seen = new Set();
            columns = columns.filter(el => {
                var duplicate = seen.has(el.name);
                seen.add(el.name);
                return !duplicate;
            });

            columns = Array.from(new Set(columns));
            columns.sort(
                function (a, b) {
                    if (a["name"].toUpperCase() < b["name"].toUpperCase()) {
                        return -1;
                    } else if (a["name"].toUpperCase() > b["name"].toUpperCase()) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            );

            Models.setProperty.call(this, "view", "/BaseColumns", columns);
        },

        getLayoutsAndSetupColumns: function () {
            BackendConnector.doGet({
                    constant: "LAYOUTS"
                },
                oResponse => {
                    var oLayouts = oResponse.body.LAYOUTS;
                    this.layouts.prepareLayouts.call(this, oLayouts);

                    var defaultLayout = oLayouts.find(layout => layout.LAYOUT_NAME === Constants.SAP_DEFAULT_LAYOUT_NAME);
                    Models.setProperty.call(this, "view", "/DefaultLayoutId", defaultLayout.LAYOUT_ID);

                    Models.setPropertys.call(this, "view", [{
                            path: "/Layouts",
                            value: oLayouts
                        },
                        {
                            path: "/LayoutsBusy",
                            value: false
                        }
                    ]);

                    var layoutToDisplay = this.getLayoutToDisplay(oLayouts);
                    this.getColumnsAndDisplayLayout(layoutToDisplay);
                },
                oResponse => {
                    Models.setPropertys.call(this, "view", [{
                            path: "/Layouts",
                            value: []
                        },
                        {
                            path: "/LayoutsBusy",
                            value: false
                        }
                    ]);

                    MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage(oResponse.status), MessageType.Error, this.oButtonPopover);
                },
                true
            );
        },

        onCompare: function () {
            var oModel = this.getView().getModel("view");
            Models.setProperty.call(this, "view", "/treeBusy", true);

            var oRouter = Router.getRouter.call(this)

            var oCurrentRouteHash = oRouter.getHashChanger().getHash();
            var oCurrentRouteName = oRouter.getRouteInfoByHash(oCurrentRouteHash).name

            var oModelRouteHash = oModel.getProperty("/Version1ID") + "/" + oModel.getProperty("/Version2ID");

            if (oCurrentRouteName === "HomeWith2Ids" && oCurrentRouteHash === oModelRouteHash) {
                Models.setProperty.call(this, "view", "/treeBusy", false);
            } else {
                oRouter.navTo("HomeWith2Ids", {
                    id1: oModel.getProperty("/Version1ID"),
                    id2: oModel.getProperty("/Version2ID")
                })
            }
        },

        persistLayout: function () {
            Models.setProperty.call(this, "view", "/treeBusy", true);
            this.layouts.updateLayoutsWithTableWidths.call(this);

            var layoutName = Models.getProperty.call(this, "view", "/LayoutName");
            var layout = Models.getProperty.call(this, "view", "/Layout");

            var layoutToSend = this.layouts.buildLayoutToSend.call(this, layoutName, layout);
            this.layouts.update.call(this, layoutToSend);
        },

        openLayoutFragment: function (sFragment) {
            if (sFragment === "new" || sFragment === "edit") {
                var availableColumns = Models.getProperty.call(this, "view", "/BaseColumns").filter(col => col.COLUMN_ID !== "ITEM_KEY");
                Models.setProperty.call(this, "view", "/AvailableColumns", availableColumns);
                this.updateColumnsButtonText(sFragment);
            }

            Layouts.openLayoutFragment(sFragment, this);
        },

        updateColumnsButtonText: function (sFragment) {
            if (sFragment === "edit") {
                Models.setProperty.call(this, "view", "/ColumnsButtonText", ResourceBundle.getResourceBundleText.call(this, "XBUT_btnApply"));
            } else if (sFragment === "new") {
                Models.setProperty.call(this, "view", "/ColumnsButtonText", ResourceBundle.getResourceBundleText.call(this, "XBUT_btnCreate"));
            }
        },

        onClose: function (name) {
            if (!this.byId(name)) {
                return;
            }
            this.byId(name).close();
            this.byId(name).destroy();
            this.fromDialog = false;
        },

        onExport: function (exportName) {
            var oView = this.getView();
            if (!this.byId("generating")) {
                Fragment.load({
                    containingView: oView,
                    name: "ui.view.fragments.GeneratingFile",
                    controller: this,
                    id: oView.getId()
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    oDialog.open();
                    return oDialog;
                });
            } else {
                Models.setProperty.call(this, "view", "/TotalNumberOfReceivedSpreadsheetRows", 0);
                this.byId("generating").open();
            }

            Models.setPropertys.call(this, "view", [{
                path: "/BomCount",
                value: 0
            }, {
                path: "/currentGathered",
                value: 0
            }]);

            setTimeout(function () {
                this.buildExportFile();
            }.bind(this), 1000);
        },

        onExportAs: function () {
            var oView = this.getView();
            this.fromDialog = true;
            Models.setProperty.call(this, "view", "/ExportName", Models.getProperty.call(this, "view", "/Version1") + "_" + Models.getProperty.call(this, "view", "/Version2"));
            if (!oView.byId("export")) {
                Fragment.load({
                    containingView: oView,
                    name: "ui.view.fragments.Export",
                    controller: this,
                    id: oView.getId()
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    oDialog.open();
                    return oDialog;
                });
            } else {
                Models.setProperty.call(this, "view", "/TotalNumberOfReceivedSpreadsheetRows", 0);
                oView.byId("export").open();
            }
        },

        onExpCompAs: function () {
            let oModelRouteHash = Models.getProperty.call(this, "view", "/RefCalculationVersion1ID") + "/" + Models.getProperty.call(this, "view", "/RefCalculationVersion2ID");
            let sLanguageID = sap.ui.getCore().getConfiguration().getLanguage();
            let oModelRouteHashLanguage = "?sap-language=" + sLanguageID + "#/" + oModelRouteHash;
            sap.m.URLHelper.redirect(oModelRouteHashLanguage, true);
        },

        onRowSelect: function (oControlEvent) {
            let sPath = oControlEvent.getParameter("rowContext").getPath();
            let itemCategory1ID = oControlEvent.getParameter("rowContext").getModel().getContext(sPath).getObject().ITEM_CATEGORY_ID;
            let itemCategory2ID = oControlEvent.getParameter("rowContext").getModel().getContext(sPath).getObject().ITEM_CATEGORY_ID_BOMC2;
            let referencedCalculationVersion1ID = oControlEvent.getParameter("rowContext").getModel().getContext(sPath).getObject().REFERENCED_CALCULATION_VERSION_ID;
            let referencedCalculationVersion2ID = oControlEvent.getParameter("rowContext").getModel().getContext(sPath).getObject().REFERENCED_CALCULATION_VERSION_ID_BOMC2;
            if ( itemCategory1ID == 10 || itemCategory2ID == 10 ) {
                Models.setProperty.call(this, "view", "/EnableExpComp", true);
                Models.setProperty.call(this, "view", "/RefCalculationVersion1ID", referencedCalculationVersion1ID);
                Models.setProperty.call(this, "view", "/RefCalculationVersion2ID", referencedCalculationVersion2ID);
            } else {
                Models.setProperty.call(this, "view", "/EnableExpComp", false);
            }
        },

        buildExportFile: function () {
            var iNumOfResultsToSkip = 0;
            this.checkCountOfBackendRecords("BOM_CALCULATIONS_EXPORT_COUNT", null, null, "/NumOfNodeExportRequests", Constants.BOM_COMPARE_EXPORT.BACKEND_REQUESTS_DIVIDER, "/TotalNumberOfRows");
            var iNoOfBackendRequests = Models.getProperty.call(this, "view", "/NumOfNodeExportRequests");
            var version1 = Models.getProperty.call(this, "view", "/Version1ID");
            var version2 = Models.getProperty.call(this, "view", "/Version2ID");
            var aExcelRowCalls = [];

            Models.setProperty.call(this, "spreadsheetRows", "/", []);
            Models.setProperty.call(this, "view", "/TotalNumberOfReceivedSpreadsheetRows", 0);

            for (let i = 0; i < iNoOfBackendRequests; i++) {

                aExcelRowCalls.push(BackendConnector.doGet({
                        constant: "BOM_CALCULATIONS_EXPORT",
                        parameters: {
                            top: Constants.BOM_COMPARE_EXPORT.BACKEND_REQUESTS_DIVIDER,
                            skip: iNumOfResultsToSkip,
                            version1Id: version1,
                            version2Id: version2,
                            languageId: sap.ui.getCore().getConfiguration().getLanguage()
                        }
                    },
                    function (oResponse) {
                        let currentSpreadsheetRows = Models.getProperty.call(this, "spreadsheetRows", "/");
                        let iCurrentRowsReceived = Models.getProperty.call(this, "view", "/TotalNumberOfReceivedSpreadsheetRows");
                        Models.setProperty.call(this, "spreadsheetRows", "/", currentSpreadsheetRows.concat(oResponse.d.results));
                        Models.setProperty.call(this, "view", "/TotalNumberOfReceivedSpreadsheetRows", iCurrentRowsReceived + oResponse.d.results.length);
                    }.bind(this),
                    oResponse => {
                        MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage(oResponse.status), MessageType.Error, this.oButtonPopover);
                    },
                    false).promise());

                iNumOfResultsToSkip += Constants.BOM_COMPARE_EXPORT.BACKEND_REQUESTS_DIVIDER;
            }

            $.when(...aExcelRowCalls).done(function () {
                const aAllReceivedRows = Models.getProperty.call(this, "spreadsheetRows", "/");
                let oBomCompareRootNode = aAllReceivedRows.find((element) => element.PARENT_ID == null && element.PARENT_ID_BOMC2 == null);
                let sRootNodeId = oBomCompareRootNode.NODE_ID;
                let sRootNodeBOMC2 = oBomCompareRootNode.NODE_ID_BOMC2;

                oBomCompareRootNode.LevelForExport = 0;
                let aSpreadsheetRows = [oBomCompareRootNode];
                aSpreadsheetRows[0].HAS_BEEN_EXPORTED = true;
                
                this.findRootNodeChildren(aAllReceivedRows, sRootNodeId, sRootNodeBOMC2, 1, aSpreadsheetRows);
                
                var this_ = this;
                var selectedLayoutColumns = Models.getProperty.call(this, "view", "/Layout");
                aSpreadsheetRows.forEach(function (element){
                    if ((element.NODE_ID === "" || element.NODE_ID == null) && element.NODE_ID_BOMC2.length > 0) {
                        element.STATE = this_.oResourceBundle.getText("XACT_added");
                    } else if (element.NODE_ID.length > 0 && (element.NODE_ID_BOMC2 === "" || element.NODE_ID_BOMC2 == null)) {
                        element.STATE = this_.oResourceBundle.getText("XACT_deleted");
                    } else {
                        element.STATE = "";
            
                        for (let j = 0; j < selectedLayoutColumns.length; j++) {
                            var column = selectedLayoutColumns[j];
                            
                            if (this_.singleLabelledColumnIds.includes(column.COLUMN_ID) === true) {
                                continue;
                            }

                            if (element.STATE === "") {
                                if (element[column.COLUMN_ID] !== element[column.COLUMN_ID + "_BOMC2"]) {
                                    element.STATE = this_.oResourceBundle.getText("XACT_edited");
                                }
                            }
                        }
                    }
                })
                
                const columns = this.getColumnsToExport();
                const oSettings = {
                    workbook: {
                        columns: columns,
                        hierarchyLevel: 'LevelForExport'
                    },
                    dataSource: aSpreadsheetRows,
                    fileName: Models.getProperty.call(this, "view", "/ExportName") + ".xlsx"
                };

                let oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(() => {
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_exportExcelSuccess"), MessageType.Success, this.oButtonPopover);
                    oSheet.destroy;
                });
                Models.setProperty.call(this, "view", "/ExportName", "BomCompare");

                this.byId("generating").close();
                this.onClose("export");
            }.bind(this)).fail(function () {
                this.byId("generating").close();
                this.onClose("export");
            }.bind(this));
        },

        findRootNodeChildren : function(aBomCompareEntries, sParentNodeId, sRootNodeBOMC2, iCount, aSpreadsheetRows){
            aBomCompareEntries.forEach(function (element){
                let bIsChild = false;
                let sNodeId = '';
                let sNodeIdBOMC2 = '';

                if (element.PARENT_ID === sParentNodeId){
                    bIsChild = true;
                } 
                else if (element.PARENT_ID_BOMC2 === sRootNodeBOMC2) {
                    bIsChild = true;
                }

                if (bIsChild) {
                    sNodeId = element.NODE_ID;
                    sNodeId = element.NODE_ID_BOMC2;      
                }

                if (sNodeId !== '' || sNodeIdBOMC2 !== '') {
                    if (!element.HAS_BEEN_EXPORTED) {
                        element["LevelForExport"] = iCount;
                        element.HAS_BEEN_EXPORTED = true;
                        Object.keys(element).filter(function (keyProperty) {
                            if (element[keyProperty] && element[keyProperty].toString().includes("/Date")) {
                                element[keyProperty] = Converters.convertToLocalDateTime(element[keyProperty]);
                            }
                        });
                        aSpreadsheetRows.push(element);
                        if((element.IS_LEAF === 0 || element.IS_LEAF_BOMC2 === 0) || (element.ITEM_CATEGORY_ID === 10 || element.ITEM_CATEGORY_ID_BOMC2 === 10)){
                            this.findRowChildren(aBomCompareEntries, sNodeId, sNodeIdBOMC2, iCount + 1, aSpreadsheetRows);
                        }
                    }
                }
            }, this);

        },

        findRowChildren: function (aBomCompareEntries, sParentNodeId, sParentNodeIdBOMC2, iCount, aSpreadsheetRows) {    
            aBomCompareEntries.forEach(function (key) {
                let sNodeId = '';
                let sNodeIdBOMC2 = '';

                let bIsChild = false;
                if (key.PARENT_ID === sParentNodeId && sParentNodeId !== null){
                    bIsChild = true;
                }
                else if (key.PARENT_ID_BOMC2 === sParentNodeIdBOMC2 && sParentNodeIdBOMC2 !== null) {
                    bIsChild = true;
                }

                if (bIsChild) {
                    sNodeId = key.NODE_ID;
                    sNodeIdBOMC2 = key.NODE_ID_BOMC2;
                }
                
                //We need to also check LEVEL / LEVEL_BOMC2 here as we do not want to process children of the ROOT Node here.
                if ((sNodeId !== '' || sNodeIdBOMC2 !== '') && (key.LEVEL > 2 || key.LEVEL_BOMC2 > 2)) {
                    if (!key.HAS_BEEN_EXPORTED) {
                        key["LevelForExport"] = iCount;
                        key.HAS_BEEN_EXPORTED = true;
                        Object.keys(key).filter(function (keyProperty) {
                            if (key[keyProperty] && key[keyProperty].toString().includes("/Date")) {
                                key[keyProperty] = Converters.convertToLocalDateTime(key[keyProperty]);
                            }
                        });
                        aSpreadsheetRows.push(key);
                        if((key.IS_LEAF === 0 || key.IS_LEAF_BOMC2 === 0) || (key.ITEM_CATEGORY_ID === 10 || key.ITEM_CATEGORY_ID_BOMC2 === 10)){
                            this.findRowChildren(aBomCompareEntries, sNodeId, sNodeIdBOMC2, iCount + 1, aSpreadsheetRows);
                        }
                    }
                }
            }, this);
        },

        getColumnsToExport: function () {
            var columns = [];
            var baseColumns = Models.getProperty.call(this, "view", "/BaseColumns");

            Models.getProperty.call(this, "view", "/Layout").forEach(element => {
                var columnFound = baseColumns.find(column => column.COLUMN_ID == element.COLUMN_ID);
                if (columnFound.type === this.EdmType.DateTime) {
                    // because we want to display the data in Excel exactly as it is displayed on the web
                    // the date values are manipulated in the getInfoForExport method
                    columnFound.type = this.EdmType.String;
                }

                columns.push({
                    label: columnFound.name,
                    property: columnFound.COLUMN_ID,
                    type: columnFound.type
                });

                if (this.singleLabelledColumnIds.includes(columnFound.COLUMN_ID) === false) {
                    columns.push({
                        label: columnFound.name + "_BOMC2",
                        property: columnFound.COLUMN_ID + "_BOMC2",
                        type: columnFound.type
                    });
                }
            });

            columns.splice(1, 0, {
                label: ResourceBundle.getResourceBundleText.call(this, "XCOL_column.State"),
                property: "STATE",
                type: this.EdmType.String
            });

            return columns;
        },

        getLayoutToDisplay: function (oLayouts) {
            var layoutToDisplayInitiallyId = Models.getProperty.call(this, "view", "/LayoutToDisplayInitiallyId");
            var defaultLayoutId = Models.getProperty.call(this, "view", "/DefaultLayoutId");
            var layoutToDisplay;

            if (layoutToDisplayInitiallyId !== 0) {
                layoutToDisplay = oLayouts.find(layout => layout.LAYOUT_ID === layoutToDisplayInitiallyId);
            } else {
                layoutToDisplay = oLayouts.find(layout => layout.LAYOUT_ID === defaultLayoutId);
            }

            return layoutToDisplay;
        },

        createColumns: function () {
            var oTable = this.getView().byId("treeTable");
            oTable.removeAllColumns();
            var selectedLayoutColumns = Models.getProperty.call(this, "view", "/Layout");
            var itemKeyName = ResourceBundle.getResourceBundleText.call(this, "XCOL_column.ITEM_KEY");
            var itemKeyWidth = "320px";

            if (selectedLayoutColumns.length > 0 && selectedLayoutColumns[0].COLUMN_ID === "ITEM_KEY") {
                itemKeyWidth = selectedLayoutColumns[0].COLUMN_WIDTH + "px";
                itemKeyName = selectedLayoutColumns[0].name;
            }

            var text = new sap.m.Text({
                text: "{view>ITEM_KEY}",
            })

            var oCol = new sap.ui.table.Column({
                label: itemKeyName,
                template: new sap.ui.layout.HorizontalLayout({
                    content: [text]
                }),
                width: itemKeyWidth,
            });
            oTable.addColumn(oCol);

            var icon = new sap.ui.core.Icon({
                src: "{view>icon}",
                color: "{view>iconColor}",
                visible: "{= ${view>icon} !== 'sap-icon://less'}",
            });
            text = new sap.m.Text({
                text: "{view>StatusText}",
                visible: "{= ${view>StatusText} !== ''}",
            })
            var oCol = new sap.ui.table.Column({
                label: ResourceBundle.getResourceBundleText.call(this, "XCOL_column.State"),
                visible: "{view>/accessibilityState}",
                hAlign: sap.ui.core.HorizontalAlign.Center,
                template: new sap.ui.layout.VerticalLayout({
                    content: [icon, text]
                }),
                width: "160px",
            });
            oTable.addColumn(oCol);

            for (let index = 1; index < selectedLayoutColumns.length; index++) {
                var selectedLayoutColumn = selectedLayoutColumns[index];
                if (this.singleLabelledColumnIds.includes(selectedLayoutColumn.COLUMN_ID) === true) {
                    this.createSingleLabelledColumn(selectedLayoutColumn, oTable);
                } else {
                    this.createDoubleLabelledColumn(selectedLayoutColumn, oTable);
                }
            }

            var state = Models.getProperty.call(this, "view", "/accessibilityState");
            if (state) {
                oTable.setFixedColumnCount(2);
            } else {
                oTable.setFixedColumnCount(1);
            }

            Models.setProperty.call(this, "view", "/treeBusy", false);
        },

        createSingleLabelledColumn: function (selectedLayoutColumn, oTable) {
            var text = new sap.m.Text({
                text: "{view>" + selectedLayoutColumn.COLUMN_ID + "}",
            });
            var oCol = new sap.ui.table.Column({
                label: selectedLayoutColumn.name,
                template: new sap.ui.layout.HorizontalLayout({
                    content: [text]
                }),
                width: selectedLayoutColumn.COLUMN_WIDTH + "px",
            });
            oTable.addColumn(oCol);
        },

        createDoubleLabelledColumn: function (selectedLayoutColumn, oTable) {
            var text = new sap.m.Text({
                text: "{path: 'view>" + selectedLayoutColumn.COLUMN_ID + "'}",
                tooltip: "{view>" + selectedLayoutColumn.COLUMN_ID + "_Tooltip}"
            })
            var oCol = new sap.ui.table.Column({
                template: new sap.ui.layout.HorizontalLayout({
                    content: [text]
                }),
                width: selectedLayoutColumn.COLUMN_WIDTH / 2 + "px",
                headerSpan: "2",
                multiLabels: [
                    new sap.m.Label({
                        text: selectedLayoutColumn.name,
                        textAlign: "Center",
                        width: "100%"
                    }),
                    new sap.m.Label({
                        text: "#1",
                        textAlign: "Center",
                        width: "100%"
                    })
                ]
            });
            oTable.addColumn(oCol);

            var icon = new sap.ui.core.Icon({
                src: "{view>icons/" + selectedLayoutColumn.COLUMN_ID + "}",
                visible: "{= ${view>icons/" + selectedLayoutColumn.COLUMN_ID + "} !== 'sap-icon://less' }",
                color: "#e9730c"
            }).addStyleClass("sapUiTinyMarginBegin");
            text = new sap.m.Text({
                text: "{i18n>XACT_edited}",
                visible: "{= ${view>icons/" + selectedLayoutColumn.COLUMN_ID + "} !== 'sap-icon://less' && ${view>/accessibilityState}}",
            })
            var verticalLayout = new sap.ui.layout.VerticalLayout({
                content: [icon, text]
            }).addStyleClass("sapUiTinyMarginBegin");
            var text = new sap.m.Text({
                text: "{path: 'view>" + selectedLayoutColumn.COLUMN_ID + "_BOMC2'}",
                tooltip: "{view>" + selectedLayoutColumn.COLUMN_ID + "_BOMC2_Tooltip}"
            })
            var oCol = new sap.ui.table.Column({
                template: new sap.ui.layout.HorizontalLayout({
                    content: [text, verticalLayout]
                }),
                width: selectedLayoutColumn.COLUMN_WIDTH / 2 + "px",
                headerSpan: "2",
                multiLabels: [
                    new sap.m.Label({
                        text: selectedLayoutColumn.name,
                        textAlign: "Center",
                        width: "100%"
                    }),
                    new sap.m.Label({
                        text: "#2",
                        textAlign: "Center",
                        width: "100%"
                    })
                ]
            });
            oTable.addColumn(oCol);
        },

        onColumnWidthChange: function (oEvent) {
            var newWidth = oEvent.mParameters.width;
            var multiLabels = oEvent.mParameters.column.mAggregations.multiLabels;
            Models.setProperty.call(this, "view", "/LayoutHasEdits", true);
            if (multiLabels.length > 0) {
                var columnLabel = multiLabels[0].mProperties.text;
                var columnSubLabel = oEvent.mParameters.column.mAggregations.multiLabels[1].mProperties.text;
                this.updatePairColumn(columnLabel, columnSubLabel, newWidth);
            }
        },

        updatePairColumn: function (columnLabel, columnSubLabel, newWidth) {
            var columnToChangeWidth = this.getView().byId("treeTable").getColumns().find(function (column) {
                var multiLabels = column.mAggregations.multiLabels;
                if (multiLabels && multiLabels.length > 0)
                    return multiLabels[0].mProperties.text === columnLabel && multiLabels[1].mProperties.text !== columnSubLabel;

                return false;
            });

            columnToChangeWidth.mProperties.width = newWidth;
        },

        getChildren: function (oEvent) {
            if (oEvent.getParameter("expanded") == true) {
                var sPath = oEvent.getParameter("rowContext").sPath;
                var nodeId = Models.getProperty.call(this, "view", sPath + "/NODE_ID");
                var nodeId2 = Models.getProperty.call(this, "view", sPath + "/NODE_ID_BOMC2");
                Models.setProperty.call(this, "view", "/treeBusy", true);
                this.callForBomCalculations("'" + nodeId + "'", "'" + nodeId2 + "'", sPath);
            }
        },

        callForBomCalculations: function (parentId, parentId2, sPath) {
            var version1Id = Models.getProperty.call(this, "view", "/Version1ID");
            var version2Id = Models.getProperty.call(this, "view", "/Version2ID");
            if (!version1Id || !version2Id) {
                return;
            }

            parentId != "null" && this.checkCountOfBackendRecords("BOM_CALCULATIONS_COUNT", parentId, parentId2, "/NumOfNodeRequests", Constants.BOM_COMPARE.BACKEND_REQUESTS_DIVIDER, null);
            let iNoOfBackendRequests = Models.getProperty.call(this, "view", "/NumOfNodeRequests");

            let aNodeRequestCalls = [];
            let iNumOfResultsToSkip = 0;
            Models.setProperty.call(this, "NodeRows", "/", []);

            for (var i = 0; i < iNoOfBackendRequests; i++) {

                aNodeRequestCalls.push(
                    BackendConnector.doGet({
                            constant: (parentId === "null" && parentId2 === "null") ? "BOM_CALCULATIONS_ROOT_NODE" : "BOM_CALCULATIONS",
                            parameters: {
                                version1Id: version1Id,
                                version2Id: version2Id,
                                parentId: parentId,
                                parentId2: parentId2,
                                top: Constants.BOM_COMPARE.BACKEND_REQUESTS_DIVIDER,
                                ...(parentId != "null" ? {
                                    skip: iNumOfResultsToSkip
                                } : {
                                    skip: 0
                                }),
                                languageId: sap.ui.getCore().getConfiguration().getLanguage()
                            }
                        },
                        oResponse => {
                            var aCurrentNodeRows = Models.getProperty.call(this, "NodeRows", "/");
                            var iCurrentNodeRowsReceived = Models.getProperty.call(this, "view", "/TotalNumberOfReceivedNodeRows");
                            Models.setProperty.call(this, "NodeRows", "/", aCurrentNodeRows.concat(oResponse.d.results));
                            Models.setProperty.call(this, "view", "/TotalNumberOfReceivedNodeRows", iCurrentNodeRowsReceived + oResponse.d.results.length);
                        },
                        oResponse => {
                            Models.setProperty.call(this, "view", "/treeBusy", false);
                            MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage(oResponse.status), MessageType.Error, this.oButtonPopover);
                        }).promise());

                iNumOfResultsToSkip += Constants.BOM_COMPARE.BACKEND_REQUESTS_DIVIDER;
            }

            $.when(...aNodeRequestCalls).done(function () {
                let aCurrentNodeRows = Models.getProperty.call(this, "NodeRows", "/");
                let aSortedNodeRows = aCurrentNodeRows.sort((a, b) => a.ITEM_ORDER > b.ITEM_ORDER ? 1 : -1);
                this.filterAndAssingData.call(this, parentId, aSortedNodeRows, sPath);
                if (parentId == "null") {
                    var treeTable = this.getView().byId("treeTable");
                    treeTable.expand(0);
                    treeTable.fireToggleOpenState({
                        rowContext: treeTable.getContextByIndex(0),
                        expanded: true
                    });
                }
                if (sPath) {
                    var isExpandingRoot = sPath.split("/")[2] === "0";
                    if (isExpandingRoot) {
                        MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_comparisonLoaded"), MessageType.Success, this.oButtonPopover);
                    }
                }
            }.bind(this)).fail(function () {
                MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage("ExceptionDuringCompareProcess"), MessageType.Error, this.oButtonPopover);
            }.bind(this));
        },

        filterAndAssingData: function (parentId, aResults, sPath) {
            aResults.map(bomCalculation => {
                Object.keys(bomCalculation).filter(function (key) {
                    if (bomCalculation[key] && bomCalculation[key].toString().includes("/Date")) {
                        bomCalculation[key] = Converters.convertToLocalDateTime(bomCalculation[key]);
                    }

                    if (bomCalculation[key] !== null) {
                        bomCalculation[key + "_Tooltip"] = bomCalculation[key].toString();
                    }

                    if (bomCalculation[key] != null && Number.parseFloat(bomCalculation[key]).toFixed(2) != "NaN" && bomCalculation[key].toString().includes(".")) {
                        bomCalculation[key] = Number.parseFloat(bomCalculation[key]).toFixed(2);
                    } else {
                        bomCalculation[key] = bomCalculation[key];
                    }

                }.bind(this));
                //Disable the expand function for reference version
                if ((bomCalculation.IS_LEAF === 0 || bomCalculation.IS_LEAF_BOMC2 === 0) &&
                    (bomCalculation.IS_LEAF !== null || bomCalculation.IS_LEAF_BOMC2 !== null)) {
                    bomCalculation["children"] = [{}];
                } else {
                    bomCalculation["children"] = [];
                }

                if ((bomCalculation.NODE_ID === "" || bomCalculation.NODE_ID == null) && bomCalculation.NODE_ID_BOMC2.length > 0) {
                    bomCalculation.Status = "Success";
                    bomCalculation.icon = "sap-icon://add";
                    bomCalculation.iconColor = "green";
                    bomCalculation.StatusText = ResourceBundle.getResourceBundleText.call(this, "XACT_added");
                } else if (bomCalculation.NODE_ID.length > 0 && (bomCalculation.NODE_ID_BOMC2 === "" || bomCalculation.NODE_ID_BOMC2 == null)) {
                    bomCalculation.Status = "Error";
                    bomCalculation.icon = "sap-icon://delete"
                    bomCalculation.iconColor = "red";
                    bomCalculation.StatusText = ResourceBundle.getResourceBundleText.call(this, "XACT_deleted");
                } else if (bomCalculation.NODE_ID.length > 0 && bomCalculation.NODE_ID_BOMC2.length > 0) {
                    bomCalculation.Status = "None";
                    bomCalculation.icon = "sap-icon://less";
                    bomCalculation.iconColor = "";
                    bomCalculation.StatusText = "";
                }
            });
            aResults = this.setupStatusBasedOnColumns(aResults);
            if (parentId == "null") {
                Models.setProperty.call(this, "view", "/BomCalculations", aResults);
            } else {
                Models.setProperty.call(this, "view", sPath + "/children", aResults)
            }
            Models.setProperty.call(this, "view", "/treeBusy", false);

        },

        setupStatusBasedOnColumns: function (results) {
            var selectedLayoutColumns = Models.getProperty.call(this, "view", "/Layout");
            results = this.setupStatusForChildren(results, selectedLayoutColumns);
            return results;
        },

        setupStatusForChildren: function (results, selectedLayoutColumns) {
            if (!(results.length === 1 && $.isEmptyObject(results[0]))) {
                for (let i = 0; i < results.length; i++) {

                    var bomCalculation = results[i];
                    bomCalculation.icons = {};

                    for (let j = 0; j < selectedLayoutColumns.length; j++) {
                        var column = selectedLayoutColumns[j];
                        bomCalculation.icons[column.COLUMN_ID] = "sap-icon://less";

                        if (this.singleLabelledColumnIds.includes(column.COLUMN_ID) === true) {
                            continue;
                        }

                        if (bomCalculation.Status === "None") {
                            if (bomCalculation[column.COLUMN_ID] !== bomCalculation[column.COLUMN_ID + "_BOMC2"]) {
                                bomCalculation.Status = "Warning";
                                bomCalculation.icons[column.COLUMN_ID] = "sap-icon://user-edit";
                                bomCalculation.icon = "sap-icon://user-edit";
                                bomCalculation.iconColor = "#e9730c";
                                bomCalculation.StatusText = ResourceBundle.getResourceBundleText.call(this, "XACT_edited");
                            }
                        }
                    }

                    if (Object.keys(bomCalculation).includes("children") && bomCalculation["children"].length > 0) {
                        bomCalculation["children"] = this.setupStatusForChildren(bomCalculation["children"], selectedLayoutColumns)
                    }
                }
            }
            return results;
        },

        onValueHelpRequest: function (oEvent) {
            var inputControl = this.getInputControlFromEvent(oEvent);
            Models.setProperty.call(this, "view", "/LastInputHelpPressed", inputControl);
            this.versionIdValueHelp = oEvent.getSource().sId.slice(-1);
            var oView = this.getView();
            if (!this.byId("calculationSearch")) {
                Fragment.load({
                    containingView: oView,
                    name: "ui.view.fragments.CalculationsSearch",
                    controller: this,
                    id: oView.getId()
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    oDialog.open();
                    return oDialog;
                }.bind(this));
            } else {
                this.byId("calculationSearch").open();
            }
        },

        CalculationSelectionChange: function (oEvent) {
            var calculationVersionId = oEvent.getParameter("rowContext").sPath.split(/[()]+/)[1];
            var inputControl = Models.getProperty.call(this, "view", "/LastInputHelpPressed");
            inputControl.removeAllSuggestionItems();
            inputControl.destroyTooltip();
            var aFilters = [];
            aFilters.push(new sap.ui.model.Filter({
                path: "calculation_version_id",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: calculationVersionId,
                value2: null
            }));
            var oModel = this.getOwnerComponent().getModel("CalculationsOdataModel");
            oModel.read("/versionsearch", {
                filters: aFilters,
                success: function (oData) {
                    this.addCalculationsToSuggestedItems(oData, inputControl, true);
                }.bind(this),
                error: function (oResponse) {
                    this.handleModelReadError(oResponse);
                }.bind(this)
            });
            Models.setProperty.call(this, "view", "/Version" + this.versionIdValueHelp + "ID", calculationVersionId);

            setTimeout(function () {
                var selectedItem = inputControl.getSuggestionItems().find(item => item.mProperties.key === calculationVersionId);
                this.setTooltipOnInputWithItem(inputControl, selectedItem);
            }.bind(this), 500);

            this.onClose("calculationSearch");
        },

        setTooltipOnInputWithItem: function (inputControl, selectedItem) {
            var projectName = selectedItem.getCustomData().find(item => item.mProperties.key === "projectName").mProperties.value;
            var calculationName = selectedItem.getCustomData().find(item => item.mProperties.key === "calculationName").mProperties.value;
            inputControl.setTooltip(ResourceBundle.getResourceBundleText.call(this, "XFLD_project") + ": " + projectName + "\n" +
                ResourceBundle.getResourceBundleText.call(this, "XFLD_calculationName") + ": " + calculationName);
        },

        handleModelReadError: function (oResponse) {
            if (oResponse.statusCode === 400) {
                // first remove the auto-generated message, not relevant for the user
                var generatedMessage = sap.ui.getCore().getMessageManager().getMessageModel().oData.pop();
                sap.ui.getCore().getMessageManager().removeMessages([generatedMessage]);
                // then display your error message
                MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_400"), MessageType.Error, this.oButtonPopover);
            }
        },

        changedAccessibilityState: function (oEvent) {
            var oTable = this.getView().byId("treeTable");
            oTable.setBusyIndicatorDelay(0);
            Models.setProperty.call(this, "view", "/treeBusy", true);
            var state = oEvent.getParameters().state;
            if (state) {
                oTable.setFixedColumnCount(2);
            } else {
                oTable.setFixedColumnCount(1);
            }
            Models.setProperty.call(this, "view", "/accessibilityState", state);
            setTimeout(function () {
                Models.setProperty.call(this, "view", "/treeBusy", false);
            }.bind(this), 1000);
        },

        getInputControlFromEvent: function (oEvent) {
            var sourceControlId = oEvent.mParameters.id;

            if (sourceControlId.includes("CalVersionInput1")) {
                return this.byId("CalVersionInput1");
            } else if (sourceControlId.includes("CalVersionInput2")) {
                return this.byId("CalVersionInput2");
            }

            return null;
        },

        addCalculationsToSuggestedItems: function (oData, inputControl, concatenateIdVersion = false) {
            var results;
            if (concatenateIdVersion === false) {
                results = oData.results.map(row => new sap.ui.core.ListItem({
                    text: row.calculation_name,
                    additionalText: row.calculation_version_name,
                    key: row.calculation_version_id,
                    customData: [
                        new sap.ui.core.CustomData({
                            key: "projectName",
                            value: row.project_name
                        }),
                        new sap.ui.core.CustomData({
                            key: "calculationName",
                            value: row.calculation_name
                        })
                    ]
                }));
            } else {
                results = oData.results.map(row => new sap.ui.core.ListItem({
                    text: row.calculation_version_id + " - " + row.calculation_version_name,
                    key: row.calculation_version_id,
                    customData: [
                        new sap.ui.core.CustomData({
                            key: "projectName",
                            value: row.project_name
                        }),
                        new sap.ui.core.CustomData({
                            key: "calculationName",
                            value: row.calculation_name
                        })
                    ]
                }));
            }

            for (var row of results) {
                inputControl.addSuggestionItem(row);
            }
        },

        checkCountOfBackendRecords: function (sUrlConstant, sParentId1, sParentId2, sTotalNumberOfRequestsModelPath, iRequestDivider, sTotalNumberOfRowsModelPath) {
            let sVersionId1 = Models.getProperty.call(this, "view", "/Version1ID");
            let sVersionId2 = Models.getProperty.call(this, "view", "/Version2ID");
            BackendConnector.doGet({
                    constant: sUrlConstant,
                    parameters: {
                        version1Id: sVersionId1,
                        version2Id: sVersionId2,
                        ...(sParentId1 != "null" && {
                            parentId: sParentId1
                        }),
                        ...(sParentId2 != "null" && {
                            parentId2: sParentId2
                        }),
                        languageId: sap.ui.getCore().getConfiguration().getLanguage()
                    }
                },
                function (oResponse) {
                    Models.setProperty.call(this, "view", sTotalNumberOfRequestsModelPath,
                        Helpers.calculateNumberOfPaginatedBackendRequests(oResponse, iRequestDivider));
                    sTotalNumberOfRowsModelPath != null && (Models.setProperty.call(this, "view", sTotalNumberOfRowsModelPath, oResponse));
                }.bind(this),
                function (oResponse) {
                    MessageHelpers.addMessageToPopover.call(this, this.getErrorMessage(oResponse.status), MessageType.Error, this.oButtonPopover);
                }.bind(this),
                true);
        }
    });
});