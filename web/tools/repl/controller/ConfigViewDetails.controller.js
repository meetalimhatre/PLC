sap.ui.define([
	"mdr/ui/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/library',
	'core/utils/Constants',
    'mdr/ui/model/configSchemas',
    "core/utils/ResourceBundle",
    "core/connector/BackendConnector",
    "core/utils/Router",
    "core/utils/MessageHelpers",
    "core/toolBarMessages/ToolBarMessages",
	"core/utils/Models"
], function (Controller, JSONModel, library, Constants, ConfigSchemas, ResourceBundle, BackendConnector, Router, MessageHelpers, ToolBarMessages, Models) {
	"use strict";

	return Controller.extend("mdr.ui.controller.ConfigViewDetails", {
        Router:Router,
        MessageType: library.MessageType,
        ToolBarMessages: ToolBarMessages,

		onInit: function () {
			this.jsonModel = new JSONModel({
				ReplicationRuleStatement: "",
				EnableSave: false,
				IsInitial: true

			});
			this.jsonModel.setSizeLimit(1000000);
            Models.setModel.call(this, this.jsonModel, "view");
			Router.getRouter.call(this).getRoute("configDetails").attachPatternMatched(this._onRouteConfigDetailsMatched, this);
			this.oView = this.getView();
			this.oSchema = ConfigSchemas.configDetailsSchema;
		},


		_onRouteConfigDetailsMatched: function (oEvent) {
			ToolBarMessages.removeAllMessages();
			var oArguments = oEvent.getParameter("arguments");
			this.sEntityId = oArguments.filter;
			Models.setProperty.call(this,"view", "/EnableSave", false);
			Models.setProperty.call(this,"view", "/IsInitial", true);
			this.loadInitialData();
			this.oView.byId("previewItems").setVisible(false);
		},

		onAfterRendering: function () {
			this.oTableMapping = this.getView().byId("entityMappingTable");
			this.oTablePreview = this.getView().byId("dataPreviewTable");
			this.oButtonPopover = this.getView().byId("buttonMessagePopover");
		},

		postPreviewMethod: function(sEntityId, iNumberOfRows, sSelectStmt) {
			this.setAppIsBusy(true);
			const oRequestBody = {
				entityId: sEntityId,
				numberOfRows: iNumberOfRows,
				selectStatement: sSelectStmt
			};
            BackendConnector.doPost({
                    constant: "DATA_PREVIEW",
                },
                oRequestBody,
                function (oData, sStatus) {
                    // set columns from replication rule to dropdowns and table header
                    let aColumnsFromReplicationRule = oData.metadata.columns;
                    let aColumnsForModelBinging = [{"key": "doNotReplicate", "text": ResourceBundle.getResourceBundleText.call(this, "XMSG_notSelected"), "fieldType": "*"}];
                    aColumnsFromReplicationRule.forEach(oColumn => {
                        aColumnsForModelBinging.push({
                            "key": oColumn.columnName,
                            "text": oColumn.columnName,
                            "fieldType": oColumn.fieldType.type
                        });
                    });
                    this.oSchema.ERPFieldNames = aColumnsForModelBinging;
                    this.oTablePreview.bindColumns("/ERPFieldNames", function(sId, oContext) {
                        var sColumnId = oContext.getObject().key;
                        return new sap.ui.table.Column({
                            label: sColumnId,
                            template: new sap.m.Text().bindProperty("text", {path: "row/" + sColumnId}),
                            sortProperty: sColumnId,
                            filterProperty: sColumnId
                        });
                    });

					// hide null column from model
					this.oTablePreview.getColumns()[0].setVisible(false);

                    // bind results of data preview to table
                    this.oSchema.DataPreview = oData;
					this.oModel.setData(this.oSchema);

					// bind the table mappings
					this.updateTableMappings();                    
					this.setAppIsBusy(false);
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_statementExecutedSuccessfully"), this.MessageType.Success, this.oButtonPopover);
                }.bind(this),
                function (oXHR, sTextStatus, sErrorThrown) {
					this.setAppIsBusy(false);
					MessageHelpers.addMessageToPopover.call(this, this._getPreviewErrorMessage(oXHR), this.MessageType.Error, this.oButtonPopover);
                }.bind(this)
            );
		},

		
		onSave: function() {
			let oRequestBody = this.oModel.getData().DataMapping;
			oRequestBody.select = Models.getProperty.call(this, "view", "/ReplicationRuleStatement");
			// the attributes column is not part of the database and should not be sent to the backend
			oRequestBody.mappings.map(mapping => delete mapping.destinationField.attributes);
			this.setAppIsBusy(true);
            BackendConnector.doPut({
                    constant: "MAPPING",
                    parameters: {
                        entityId: this.sEntityId
                    }
                },
                oRequestBody,
                function (oData, sStatus) {
					this.setAppIsBusy(false);
                    MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataSaved"), this.MessageType.Success, this.oButtonPopover);
					Models.setProperty.call(this,"view", "/EnableSave", false);
                }.bind(this),
                function (oXHR, sTextStatus, sErrorThrown) {
					this.setAppIsBusy(false);
                    MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover)
                }.bind(this)
            );
		},

		loadInitialData: function() {
            this.setAppIsBusy(true);
            BackendConnector.doGet({
                    constant: "MAPPING",
                    parameters: {
                        entityId: this.sEntityId
                    }
                },
                function (oData, sStatus) {
					this.setAppIsBusy(false);
					// set columns from replication rule to dropdowns
					let aColumnsFromReplicationRule = oData.mappings;
					let doNotReplicateColumn = {"key": "doNotReplicate", "text": ResourceBundle.getResourceBundleText.call(this, "XMSG_notSelected"), "fieldType": "*"}
					let aColumnsForModelBinding = [doNotReplicateColumn];
					aColumnsFromReplicationRule.forEach(oColumn => {
						if (oColumn.sourceColumnName !== null) {
							aColumnsForModelBinding.push({
								"key": oColumn.sourceColumnName,
								"text": oColumn.sourceColumnName,
								"fieldType": oColumn.destinationField.type.type
							});
						} else {
							oColumn.sourceColumnName = doNotReplicateColumn.key
						}
					});
					this.oSchema.ERPFieldNames = aColumnsForModelBinding;
					//custom logic for the Precision, Scale and Length attributes
					//Attributes column is bound to the attributes property in the oData object
					if(oData.mappings){
						for (var i = 0; i < oData.mappings.length; i++) {
							var length = oData.mappings[i].destinationField.length;
							var precision = oData.mappings[i].destinationField.precision;
							var scale = oData.mappings[i].destinationField.scale;
							
							//if the value is 0 display it in the Attributes column
							if(length || length === 0){
								length = ResourceBundle.getResourceBundleText.call(this, "XFLD_length") + "=" + length;
							}
							if(precision || precision === 0){
								precision = ResourceBundle.getResourceBundleText.call(this, "XFLD_precision") + "=" + precision;
							}
							if(scale || scale === 0){
								scale = ResourceBundle.getResourceBundleText.call(this, "XFLD_scale") + "=" + scale;
							}

							oData.mappings[i].destinationField.attributes = "";

							//text format for length
							if(length){
								oData.mappings[i].destinationField.attributes += length;
								if(precision || scale){
									oData.mappings[i].destinationField.attributes += ", ";
								}
							}
							
							//text format for precision
							if(precision){
								oData.mappings[i].destinationField.attributes += precision;
								if(scale){
									oData.mappings[i].destinationField.attributes += ", ";
								}
							}

							//text format for scale
							if(scale){
								oData.mappings[i].destinationField.attributes += scale;
							}
						  }
					}
					this.oSchema.DataMapping = oData;
					this.oModel = new JSONModel();
					this.oModel.setData(this.oSchema);
					this.oTableMapping.setModel(this.oModel);
					this.oTablePreview.setModel(this.oModel);
					Models.setProperty.call(this, "view", "/ReplicationRuleStatement", this.oSchema.DataMapping.select);
					delete this.oSchema.DataMapping.select;
					MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataLoaded"), this.MessageType.Success, this.oButtonPopover);
                }.bind(this),
                function (oXHR, sTextStatus, sErrorThrown) {
					this.setAppIsBusy(false);
					MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
				}.bind(this)
            )
		},

		onPreview: function () {
			let sReplicationRuleStmt = Models.getProperty.call(this, "view", "/ReplicationRuleStatement");
			this.postPreviewMethod(this.sEntityId, 10, sReplicationRuleStmt);
			var oPreviewItems = this.oView.byId("previewItems");
			if (oPreviewItems.getVisible() === false) {
				oPreviewItems.setVisible(true);
			}
		},

		onGetFieldsForMapping: function() {
			this.setAppIsBusy(true);
			let sReplicationRuleStmt = Models.getProperty.call(this, "view", "/ReplicationRuleStatement");
			const oRequestBody = {
				selectStatement: sReplicationRuleStmt
			};

            BackendConnector.doPost({
                    constant: "GET_FIELDS_FOR_MAPPING",
                },
				oRequestBody,
				function (oData) {
                    // set columns from replication rule to dropdowns 
                    let aColumnsFromReplicationRule = oData;
					let doNotReplicateColumn = {"key": "doNotReplicate", "text": ResourceBundle.getResourceBundleText.call(this, "XMSG_notSelected"), "fieldType": "*"}
                    let aColumnsForModelBinding = [doNotReplicateColumn];
                    aColumnsFromReplicationRule.forEach(oColumn => {
							aColumnsForModelBinding.push({
								"key": oColumn.columnName,
								"text": oColumn.columnName,
								"fieldType": oColumn.fieldType.type
							});
                    });
					this.oSchema.ERPFieldNames = aColumnsForModelBinding;
					this.oModel.setData(this.oSchema);
					this.updateTableMappings()
					this.setAppIsBusy(false);
					MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_statementExecutedSuccessfully"), this.MessageType.Success, this.oButtonPopover);
                    
				}.bind(this),
				function (oXHR, sTextStatus, sErrorThrown) {
					this.setAppIsBusy(false);
					MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
				}.bind(this)
			);
				

		},

		onLiveChange: function(oEvent) {
			this.setAppIsBusy(true);
			let sEventAction = oEvent.mParameters.editorEvent.action;
			let bIsInitial = Models.getProperty.call(this, "view", "/IsInitial");

			if (sEventAction === 'insert' && bIsInitial === true) {
				Models.setProperty.call(this,"view", "/EnableSave", false);
				Models.setProperty.call(this,"view", "/IsInitial", false);
			} else if (bIsInitial === false) {
				Models.setProperty.call(this,"view", "/EnableSave", true);
			}
			this.setAppIsBusy(false);
		},

		onItemChange: function()
		{
			Models.setProperty.call(this,"view", "/EnableSave", true);
		},

		_getPreviewErrorMessage: function(oXHR) {
			if (oXHR.responseJSON != null) {
				
				if (oXHR.responseJSON.code == Constants.previewErrorCodes.MAP_ENTITY_VALIDATION) {	
					if (oXHR.responseJSON.args.length == 1) {
						oXHR.responseJSON.code = oXHR.responseJSON.code + "_PREVIEW";
						oXHR.responseJSON.args = oXHR.responseJSON.args[0].defaultMessage.split(" ");
					}
					else if (oXHR.responseJSON.args.length == 2) {
						oXHR.responseJSON.args[1] = ResourceBundle.getResourceBundleText.call(this, oXHR.responseJSON.args[1]);	
					}
				}	

				if (oXHR.responseJSON.code == Constants.previewErrorCodes.MAP_DATA_PREVIEW_ERROR &&
					oXHR.responseJSON.args.length == 1 &&
					oXHR.responseJSON.args[0].includes("Invalid column")) {
					if (oXHR.responseJSON.args.length == 1) {
						oXHR.responseJSON.code = Constants.previewErrorCodes.MAP_DATA_PREVIEW_MANDATORY_COLUMN_ERROR;
						oXHR.responseJSON.args = oXHR.responseJSON.args[0].split(": ")[1];
					}
				}

			}

			return MessageHelpers.errorMessageJSONHandler.call(this, oXHR);	
		},
		updateTableMappings: function (){
			let mappings = this.oModel.oData.DataMapping.mappings;
			let erpFieldNames = this.oModel.oData.ERPFieldNames;
			let doNotReplicateKey = erpFieldNames[0].key;
			mappings.forEach(mapping => {
			  if (!erpFieldNames.some(erpFieldName => erpFieldName.key === mapping.sourceColumnName)) {
				mapping.sourceColumnName = doNotReplicateKey;
			  }
			});
			this.oModel.refresh();
		  }

		
	});
});