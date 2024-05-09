sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
    "sap/m/Image", 
    "sap/m/HBox", 
    "sap/m/Text"
], function(Controller,History, UIComponent, Image, HBox, Text) {
    "use strict";

    var BaseController = Controller.extend("ui.controller.BaseController", {
        onInit: function() {
            this._optionalSelectedList = [];
            this._statusColorMap = {
                "complete": "green",
                "active": "orange",
                "failed": "red"
            };
            this._statusIconMap = {
                "complete": "sap-icon://accept",
                "active": "sap-icon://synchronize",
                "failed": "sap-icon://decline"
            }
            this._log = "";
            this._current = -1;
            this._status = null;
        },

        getRouter : function () {
			return UIComponent.getRouterFor(this);
        },
        
        redirectToLaunchpadOnRefresh: function(){
            var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash == undefined) {
				this.getRouter().navTo("launchpad", {}, true /*no history*/);
			}
        },

        onLogout: function () {
            let sProtocol = window.location.protocol;
            let sPort = window.location.port;
            let sHostname = sProtocol + "//" + window.location.hostname + ((sPort !== "") ? (":" + sPort) : "");
            let sLogoutUrl = sHostname + "/logout";
            window.location.href = sLogoutUrl;
		},

		onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("launchpad", {}, true /*no history*/);
			}
		},

        checkBoxSelect: function(oEvent) {
            var oParams = oEvent.getParameters();
            var bSelected = oParams.selected;
            var iId = +oEvent.getSource().getName();

            if (bSelected) {
                this._optionalSelectedList.push(iId);
            } else {
                var iIndex = this._optionalSelectedList.indexOf(iId);
                if (iIndex !== -1) {
                    this._optionalSelectedList.splice(iIndex, 1);
                }
            }
            this.getView().getModel("info").setProperty("/selectedList", this._optionalSelectedList);
        },

        checkPrerequisites: function() {
            return Promise.resolve();
        },

        startClick: function() {
            var _this = this;
            this.checkPrerequisites()
                .then(function() {
                    _this.preventTabClose();
                    _this.getView().byId("start-button").setEnabled(false);
        
                    var oParams = {
                        optional: JSON.stringify(_this._optionalSelectedList),
                        mode: _this.mode
                    };
                    if (_this.file) {
                        oParams["file"] = _this.file==="no data" ? _this.file :JSON.stringify(_this.file);
                    }
        
                    if (_this.getView().byId("required-step-list").getItems()[0]) {
                        var oIcon = _this.getView().byId("required-step-list").getItems()[0].getContent()[0].getItems()[1];
                        oIcon.addStyleClass('synchronize');
                        oIcon.setSrc(_this._statusIconMap.active);
                    }
        
                    $.ajax({
                        url: "/sap/plc/xs/postinstall/rest/run.xsjs",
                        method: "POST",
                        data: oParams,
                        dataType: "json"
                    }).then(function(data) {
                        if (data.status === "FAILED") {
                         //   alert(data.error);TO DO Replace alert with error handling message / messagebox or some other alert functionality
                        }
                    
                        _this.task_id = data.task_id;
                        _this.getView().getModel().setProperty("/stepCollection", data.steps);
                        _this.startPollingStatus();
                    });
        
                    _this.startClicked();
                });
        },

        startClicked: function() {},

        preventTabClose: function(e) {
            window.onbeforeunload = function(e) {
                e = e || window.event;

                // IE8, FF4
                if (e) {
                    e.returnValue = '';
                }

                return '';
            }
        },

        allowTabClose: function() {
            window.onbeforeunload = null;
        },

        startPollingStatus: function() {
            this._timer = setInterval(this.pollingStatus.bind(this), 1000);
        },

        log: function(iCurrent, iTotal, oDate, status) {
            var steps = this.getView().getModel().getProperty("/stepCollection");
            if (this._current < iCurrent) {
                for (var i = this._current + 1; i < iCurrent; i++) {
                    this._current = i;
                    this._log = new Date(oDate).toLocaleString() + ":  " + steps[i].description + " runs succesfully. \n";
                    this.showLogText("complete");
                }
            }
        },

        showLogText: function(icon) {
            var that = this;
            var logMessage = this.getView().byId("log-message");
            var hbox = new HBox();
            var log = new Text({ text: this._log });
            logMessage.addItem(hbox);
            if (icon) {
              var logIcon = new Image();
              if (icon == "failed") {
                logIcon.setSrc("css/images/MessageError.png");
              } else if (icon == "complete") {
                logIcon.setSrc("css/images/MessageSuccess.png");
              }
              logIcon.addStyleClass("log-icon");
              hbox.addItem(logIcon);
            }
            hbox.addItem(log);
        },

        checkCurrentStep : function(iProgressStep) {
            var _optionalSelectedList = this._optionalSelectedList;
            var oData = this.getView().getModel("info").getData();
            var aRequiredSteps = oData.required_steps;
            var aOptionalSteps = 
                oData.optional_steps
                    .filter(function(item, i) {
                        if (_optionalSelectedList.indexOf(item.id) === -1) {
                            return false;
                        } 
                        return true;
                    });
            var aOptionalStepLength = aOptionalSteps.map(function(item, i) {
                var iCount = aRequiredSteps.length;
                for (var j = 0; j <= i; j++) {
                    iCount += aOptionalSteps[j].library.length;
                }
                return iCount;
            });
            if (iProgressStep <= aRequiredSteps.length) {
                return iProgressStep;
            } else {
                for (var i = 0; i < aOptionalSteps.length; i++) {
                    if (i === 0 && iProgressStep < aOptionalStepLength[i]) {
                        return {
                            optionalStepId: aOptionalSteps[i].id
                        }
                    }
                    if (i === aOptionalSteps.length && iProgressStep <= aOptionalStepLength[i]) {
                        return {
                            optionalStepId: aOptionalSteps[i].id
                        }
                    }
                    if (iProgressStep > aOptionalStepLength[i - 1] && iProgressStep <  aOptionalStepLength[i]) {
                        return {
                            optionalStepId: aOptionalSteps[i].id
                        }
                    }
                }
            }
        },

        applyStatusChange: function(data) {
            var _this = this;
            var aRequiredListItems = this.getView().byId("required-step-list").getItems(),
                aOptionalListItems = [];
            if (data.MODE == 'freshInstallation') {
                aOptionalListItems = this.getView().byId("optional-step-list").getItems().filter(function (item, i) {
                    if (_this._optionalSelectedList.indexOf(+item.getContent()[0].getItems()[0].getName()) === -1) {
                        return false;
                    }
                    return true;
                });
            }
            var aListItems = aRequiredListItems.concat(aOptionalListItems);

            if (data.STATUS === 'failed') {
                aListItems.map(function(item, i) {
                    if  (i < _this.checkCurrentStep(data.PROGRESS_STEP)) {
                        item.getContent()[0].getItems()[1].removeStyleClass('synchronize');
                        item.getContent()[0].getItems()[1].setSrc(_this._statusIconMap.complete);
                    }
                    if (i === _this.checkCurrentStep(data.PROGRESS_STEP)) {
                        item.getContent()[0].getItems()[1].removeStyleClass('synchronize');
                        item.getContent()[0].getItems()[1].setSrc(_this._statusIconMap.failed);
                    }
                });
                
            } else if (data.STATUS === 'complete') {
                aListItems.map(function(item, i) {
                    item.getContent()[0].getItems()[1].removeStyleClass('synchronize');
                    item.getContent()[0].getItems()[1].setSrc(_this._statusIconMap[data.STATUS]);
                });
            } else if (data.STATUS === 'active') {
                aListItems.map(function(item, i) {
                    if (i < _this.checkCurrentStep(data.PROGRESS_STEP)) {
                        item.getContent()[0].getItems()[1].removeStyleClass('synchronize');
                        item.getContent()[0].getItems()[1].setSrc(_this._statusIconMap.complete);
                    }
                    if (i === _this.checkCurrentStep(data.PROGRESS_STEP)) {
                        item.getContent()[0].getItems()[1].addStyleClass('synchronize');
                        item.getContent()[0].getItems()[1].setSrc(_this._statusIconMap.active);
                    }
                });
            }
        }
    });

    return BaseController;
});
