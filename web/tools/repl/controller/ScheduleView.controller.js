sap.ui.define([
	"mdr/ui/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/library",
	"core/utils/Constants",
	"core/utils/Router",
	"core/utils/Models",
	"core/utils/ResourceBundle",
	"core/utils/MessageHelpers",
	"core/connector/BackendConnector",
	"core/toolBarMessages/ToolBarMessages"
], function (Controller, JSONModel, coreLibrary, Constants, Router, Models, ResourceBundle, MessageHelpers, BackendConnector, ToolBarMessages) {
	"use strict";

	return Controller.extend("mdr.ui.controller.ScheduleView", {

		bIsForbidden: false,
		MessageType: coreLibrary.MessageType,

		sBox: "vbox",
		sTime: "time",
		sCheckbox: "chb",

		aSchedulerPatterns: {
			daily: Constants.SCHEDULER_PATTERNS.DAILY,
			weekly: Constants.SCHEDULER_PATTERNS.WEEKLY,
			monthly: Constants.SCHEDULER_PATTERNS.MONTHLY
		},

		ToolBarMessages: ToolBarMessages,

		initJobConfiguration: function (sSchKey, sType, oDate) {
			this._setSchPatternKey(sSchKey);
			this.oView.byId(this.sBox + sType).setVisible(true);
			this.oView.byId(this.sTime + sType).setDateValue(oDate);
		},

		handleDailyJobInit: function (sKey, sType, oModel) {
			this.initJobConfiguration(sKey, sType, oModel.date);
			Constants.WEEK_DAYS.forEach(value => {
				this.oView.byId(this.sCheckbox + value).setSelected(oModel[value]);
			});
		},

		handleWeeklyJobInit: function (sKey, sType, oModel) {
			this.initJobConfiguration(sKey, sType, oModel.date);
			this.oView.byId("weekDays").setSelectedKey(oModel.dayOfTheWeek);
		},

		handleMonthlyJobInit: function (sKey, sType, oModel) {
			this.initJobConfiguration(sKey, sType, oModel.date);
			this.oView.byId("dayMonth").setSelectedKey(oModel.dayMonth);
		},

		onInit: function () {

			this.oView = this.getView();
			var oModel = this.getOwnerComponent().getModel("scheduler");
			let oStaticData = {};
			let oTemp = {};

			this.oComboBoxSchPattern = this.getView().byId("schPattern");
			this.oButtonRun = this.getView().byId("btnRun");

			if (oModel) {
				if (oModel.oData === null) {
					MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataModelNoData"), this.MessageType.Error, this.oButtonPopover);
				}
				//handle errors stored on model
				//anything but 404 goes through; errors are displayed in the message popover
				else if (oModel.oXHR && oModel.oXHR.status !== 404) {
					MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
				}
				else {
					switch (oModel.oData.type) {
						case this.aSchedulerPatterns.daily.toUpperCase():
							this.handleDailyJobInit(1, this.aSchedulerPatterns.daily, oModel.oData);
							break;
						case this.aSchedulerPatterns.weekly.toUpperCase():
							this.handleWeeklyJobInit(2, this.aSchedulerPatterns.weekly, oModel.oData);
							break;
						case this.aSchedulerPatterns.monthly.toUpperCase():
							this.handleMonthlyJobInit(3, this.aSchedulerPatterns.monthly, oModel.oData);
							break;
						default:
							this._setSchPatternKey(0);
					}
				}
			} else {
				this._setSchPatternKey(0);
			}

			var oModel = this.getOwnerComponent().getModel("SchedulerOdataModel");
			var oSmartFilterBar = this.oView.byId("sfbJobs");

			Router.getRouter.call(this).getRoute("schedule").attachMatched(this.onRouteMatchedForbidden, this);

			//if the metadata didn't load for the Scheduler then the filter bar shouldn't be displayed
			oModel.metadataLoaded(true).then(
				//resolved
				function (oEvent) {
					oSmartFilterBar.setModel(oModel);
					oSmartFilterBar.setEntitySet("SchedulerOdata");

					var oSmartTable = this.oView.byId("stJobs");
					oSmartTable.setModel(oModel);
					oSmartTable.setEntitySet("SchedulerOdata");
					oSmartTable.applyVariant({
						sort: {
							sortItems: [{
								columnKey: "FIRED_TIME",
								operation: "Descending"
							}]
						}
					});

					var oTable = oSmartTable.getTable();
					oTable.setEnableBusyIndicator(true);
					oTable.setAlternateRowColors(true);
					oSmartFilterBar.setVisible(true);
				}.bind(this),
				//rejected
				function (oEvent) {
					oSmartFilterBar.setVisible(false);
					this.oView.byId("jobStatus").setVisible(false);
					this.oView.byId("vboxMenu").setVisible(false);
					this.oView.byId("btnSave").setVisible(false);
					this.oView.byId("btnRun").setVisible(false);

					if (oEvent.statusCode == 403) {
						this.bIsForbidden = true;
					}
					else {
						MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oEvent.statusCode), this.MessageType.Error, this.oButtonPopover);
					}
				}.bind(this));

			//Populate model for scheduling patterns dropdown
			oStaticData.SchedulePatterns = [];
			var aSchPatterns = Object.values(Constants.SCHEDULER_PATTERNS).map(value => value.toLowerCase());

			for (var i = 0; i < aSchPatterns.length; i++) {
				oTemp = {};
				oTemp.key = i;
				oTemp.text = ResourceBundle.getResourceBundleText.call(this, "XLST_" + aSchPatterns[i]);
				oStaticData.SchedulePatterns.push(oTemp);
			}

			//Populate model for the weekdays
			oStaticData.WeekDays = [];
			Constants.WEEK_DAYS.forEach(function (value, index) {
				oTemp = {};
				oTemp.key = index + 1;
				oTemp.text = ResourceBundle.getResourceBundleText.call(this, "XCKL_" + value);
				oStaticData.WeekDays.push(oTemp);
			}.bind(this));

			//Populate model for days of the month dropdown
			oStaticData.DaysMonth = [];
			for (i = 1; i <= 31; i++) {
				oTemp = {};
				oTemp.key = i;
				oStaticData.DaysMonth.push(oTemp);
			}

			//Set model for the static data
			var oModelSchedule = new JSONModel(oStaticData);
			Models.setModel.call(this, oModelSchedule);

			//Change default button names for GO & Adapt Filter
			var oFilter = this.getView().byId("sfbJobs");
			this.overrideDefaultSmartFilterButtons(oFilter, "XBUT_filterGoButton", "XBUT_filterAdaptFilterButton");
		},

		onAfterRendering: function () {
			this.oButtonPopover = this.getView().byId("buttonMessagePopover");
		},

		onRouteMatchedReset: function () {
			this.oTableSearchState = [];
			this.getView().byId("sfbJobs").clear();
			this.getView().byId("stJobs").applyVariant({});
			this.getView().byId("stJobs").rebindTable();
		},

		formatStatusToObjectState: function (bStatus) {
			switch (bStatus) {
				case "ERROR":
					return "Error";
				case "DONE":
					return "Success";
				default:
					return "Warning";
			}
		},

		handleJobAction: function (sRunId) {
			sap.ui.getCore().byId("__component0---app--sideNavigation").setSelectedKey("log");
			Router.getRouter.call(this).navTo("logFilter", { query: { runid: sRunId } });
		},

		actionSave: function (oEvent) {
			var vSelectedItem = this.oComboBoxSchPattern.getSelectedKey();
			let requestBody = {};
			let type;
			switch (vSelectedItem) {
				case "1":
					Constants.WEEK_DAYS.forEach(value => {
						requestBody["runOn" + value[0].toUpperCase() + value.substring(1)] = this.oView.byId(this.sCheckbox + value).getSelected();
					});
					type = this.aSchedulerPatterns.daily;
					break;
				case "2":
					var dayOfTheWeek = this.oView.byId("weekDays").getSelectedKey();
					if (dayOfTheWeek === "") {
						MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_weekIsRequired"), this.MessageType.Error, this.oButtonPopover);
						return;
					}
					requestBody["dayOfTheWeek"] = dayOfTheWeek;
					type = this.aSchedulerPatterns.weekly;
					break;
				case "3":
					var dayMonth = this.oView.byId("dayMonth").getSelectedKey();
					if (dayMonth === "") {
						MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_monthIsRequired"), this.MessageType.Error, this.oButtonPopover);
						return;
					}
					requestBody["dayOfMonth"] = dayMonth;
					type = this.aSchedulerPatterns.monthly;
					break;
				default:
			}

			if (vSelectedItem === "0") {
				this.setAppIsBusy(true);
				BackendConnector.doDelete({
					constant: "BASE_URL_SCHEDULER",
				},
					null,
					function (oData, sStatus) {
						this.setAppIsBusy(false);
						Constants.WEEK_DAYS.forEach(value => {
							this.oView.byId(this.sCheckbox + value).setSelected(false);
						});
						this.oView.byId("weekDays").setSelectedKey("");
						this.oView.byId("dayMonth").setSelectedKey("");
						var aTimes = Object.values(this.aSchedulerPatterns);
						aTimes.forEach(value => {
							this.oView.byId(this.sTime + value).setValue(null);
						});
						MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataDeleted"), this.MessageType.Success, this.oButtonPopover);
					}.bind(this),
					function (oXHR, sTextStatus, sErrorThrown) {
						this.setAppIsBusy(false);
						MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
					}.bind(this)
				);
			} else {
				var oDate = this.oView.byId(this.sTime + type).getDateValue();
				if (oDate === null || oDate === undefined) {
					MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_noDate"), this.MessageType.Error, this.oButtonPopover);
				} else {
					requestBody["hour"] = oDate.getUTCHours();
					requestBody["minute"] = oDate.getUTCMinutes();

					if (vSelectedItem !== "0") {
						this.setAppIsBusy(true);
						BackendConnector.doPost({
							constant: "BASE_URL_SCHEDULER_TYPE",
							parameters: {
								type: type.toLowerCase()
							}
						},
							requestBody,
							function (oData, sStatus) {
								this.setAppIsBusy(false);
								MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_dataSaved"), this.MessageType.Success, this.oButtonPopover);
							}.bind(this),
							function (oXHR, sTextStatus, sErrorThrown) {
								MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
								this.setAppIsBusy(false);
							}.bind(this),
							""
						);
					}
				}
			}
		},

		actionRunNow: function (oEvent) {
			this.setAppIsBusy(true);
			BackendConnector.doPost({
				constant: "RUN_NOW_URL_SCHEDULER"
			},
				null,
				function (oData, sStatus) {
					this.setAppIsBusy(false);
					MessageHelpers.addMessageToPopover.call(this, ResourceBundle.getResourceBundleText.call(this, "XMSG_operationSuccessful"), this.MessageType.Success, this.oButtonPopover);
					//trigger another query for smart table since there is a new record
					var oSmartFilterBar = this.oView.byId("sfbJobs");
					oSmartFilterBar.search(false); // false = asynchronous search
				}.bind(this),
				function (oXHR, sTextStatus, sErrorThrown) {
					this.setAppIsBusy(false);
					MessageHelpers.addMessageToPopover.call(this, MessageHelpers.errorMessageJSONHandler.call(this, oXHR), this.MessageType.Error, this.oButtonPopover);
				}.bind(this),
				""
			);
		},

		handleBoxScheduleChange: function (bDailyState, bWeeklyState, bMonthlyState) {
			this.oView.byId(this.sBox + this.aSchedulerPatterns.daily).setVisible(bDailyState);
			this.oView.byId(this.sBox + this.aSchedulerPatterns.weekly).setVisible(bWeeklyState);
			this.oView.byId(this.sBox + this.aSchedulerPatterns.monthly).setVisible(bMonthlyState);

			this.oButtonRun.setEnabled(bDailyState || bWeeklyState || bMonthlyState);
		},

		handleScheduleChange: function (oEvent) {
			var oValidatedComboBox = oEvent.getSource();
			var sSelectedKey = oValidatedComboBox.getSelectedKey();

			switch (sSelectedKey) {
				case "0":
					this.handleBoxScheduleChange(false, false, false);
					break;
				case "1":
					this.handleBoxScheduleChange(true, false, false);
					break;
				case "2":
					this.handleBoxScheduleChange(false, true, false);
					break;
				case "3":
					this.handleBoxScheduleChange(false, false, true);
					break;
			}
		},

		_setSchPatternKey: function (key) {
			this.oComboBoxSchPattern.setSelectedKey(key);
			this.oButtonRun.setEnabled(key != 0);
		}
	});
});
