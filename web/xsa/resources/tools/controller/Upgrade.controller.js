sap.ui.define([ 
    "ui/controller/BaseController",
    "sap/m/Link",
    "sap/m/MessageBox",
], function(Controller,Link,MessageBox) {
    "use strict";
    var INSTANCE_BASED_USERS_REPLACE = "instance based users migration";

    return Controller.extend("ui.controller.Upgrade", {
        onInit: function() {
            this.redirectToLaunchpadOnRefresh();
            this.mode = "upgrade";
        },

        onBeforeRendering: function() {
            this.getView().getModel("info").setProperty("/selectedList", []);
        },

        onAfterRendering: function() {
            var oButton = new Link({
                text: "Show User List",
                width: "150px",
                press: this.handleRoleMigrationPress.bind(this)
            });
            var oFileUploaderView = sap.ui.xmlfragment("ui.view.FileUploader", this);
            this.oFileUploaderView = oFileUploaderView;
            var optionalSteps = this.byId("optional-step-list").getItems();
            optionalSteps.forEach(function(step) {
                if (step.getContent()[0].getItems()[0].getText() === INSTANCE_BASED_USERS_REPLACE) {
                    step.getContent()[0].insertItem(oFileUploaderView, 2);
                }
            });
            if(this.getView().getModel("info").getProperty("/basic_steps") != undefined){
                if (this.getView().getModel("info").getProperty("/basic_steps").total === 0) {
                    this.byId("start-button").bindProperty("enabled", {
                        path: "info>/selectedList/0",
                        formatter: function(value) {
                            return !(value === null || value === undefined); 
                        }
                    });
                }
            }
        },

        onFileChange: function(oEvent) {
            this.oFile = oEvent.getParameters("files").files[0];
        },

        checkPrerequisites: function() {
            var _this = this;
            return new Promise(function(resolve, reject) {
                _this.getUserMappingFile()
                    .then(function(data) {
                        _this.file = data;
                        resolve();
                    })
                    .catch(function(errMsg) {
                        MessageBox.error(errMsg);
                    });
            });
        },

        startClicked: function() {
            this.oFileUploaderView.getItems()[1].setEnabled(false);
        },

        getUserMappingFile: function() {
            var _this = this;

            return new Promise((resolve, reject) => {
                if (_this.oFile === undefined) {
                    resolve("no data");
                }

                var reader = new FileReader();
                reader.onload = function(oEvent) {
                    var csv = oEvent.target.result;
                    resolve(processData(csv));
                };
                
                function processData(csv) {
                    var lines = [];
                    if (csv) {
                        var allTextLines = csv.split(/\r\n|\n/);
                        var lines = [];
                        for (var i = 0; i < allTextLines.length; i++) {
                            var data = allTextLines[i].split(',');
                            var tarr = [];
                            for (var j = 0; j < data.length; j++) {
                                tarr.push(data[j]);
                            }
                            lines.push(tarr);
                        }
                    }
                    return lines;
                }
                reader.onerror = function() {
                    reject('There is a problem with the mapped file. Please select another file.');
                };

                reader.readAsText(_this.oFile);
            });
        },

        handleRoleMigrationPress: function() {
            var _this = this;
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("ui.view.UserRoleDialog", this);
            }

            this.fetchRoleMigrationList()
                .then(this.normalizeData.bind(this))
                .then(function (data) {
                    _this.getView().getModel().setProperty("/aUserRole", data);
                });

            this.getView().addDependent(this._oDialog);
            this._oDialog.open();
        },

        fetchRoleMigrationList: function() {
            return $.ajax({
                url: "/sap/plc/xs/postinstall/rest/getXSCPLCUsers.xsjs",
                method: "GET",
                dataType: "json"
            });
        },

        normalizeData: function(data) {
            var aData = [];
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].xscRoles.length; j++) {
                    aData.push({
                        user: j === 0 ? data[i].user : "",
                        xscRoles: data[i].xscRoles[j],
                        xsaRoleTemplates: data[i].xsaRoleTemplates[j] === "-1" ? "" : data[i].xsaRoleTemplates[j]
                    });
                }
            }
            return aData;
        },

        closeDialog: function() {
            this._oDialog.close();
        },

        pollingStatus: function() {
            var _this = this;
            $.ajax({
                url: "/sap/plc/xs/postinstall/rest/run.xsjs?info=task&id=" + _this.task_id,
                method: "GET",
                dataType: "json"
            }).then(function(data) {
                _this.applyStatusChange(data);
                _this.log(data.PROGRESS_STEP, data.PROGRESS_TOTAL, data.LAST_UPDATED_ON, data.STATUS);
                
                var target = _this.getView().getModel("info").getProperty("/target");
                var dialog; 
                
                if (data.PROGRESS_TOTAL === 0) {
                    if (_this._timer) {
                        window.clearInterval(_this._timer);
                        _this._timer = null;
                    }
                    _this._log = "" + new Date().toLocaleString() + ":  " + 'No optional register is selected. \n';
                    _this.showLogText("complete");
                }

                if (data.PROGRESS_STEP === data.PROGRESS_TOTAL && data.STATUS === 'complete') {
                    if (_this._timer) {
                        window.clearInterval(_this._timer);
                        _this._timer = null;
                    }
                    if (!_this._status) {
                        _this._status = data.STATUS;
                        _this._log = new Date().toLocaleString() + ":  " + 'SAP Product Lifycycle Costing has been upgraded to version ' + target + ' successfully. \n';
                        _this.showLogText("complete");
                    }
                    _this.allowTabClose();
                }
                
                if (data.STATUS === 'failed') {
                    if (_this._timer) {
                        window.clearInterval(_this._timer);
                        _this._timer = null;
                    }
                    if (!_this._status) {
                        _this._status = data.STATUS;
                        if (data.ERROR_DETAILS.indexOf("format exception") != -1) {
                            _this._log = new Date().toLocaleString() + ": " + "There is a problem with the user mapping. Please exclude column headers and ensure that emails are limited to the following characters: a-z,A-Z,0-9,&,@,-,_";
                        } else {
                            _this._log = new Date().toLocaleString() + ": " + 'An error occurred that ended the upgrade. Please see the log file for details and contact your system administrator. \n';
                            _this._log += "Error message: " + data.ERROR_DETAILS;
                        }
                        _this.showLogText("failed");
                    }
                    _this.allowTabClose();
                }
            });
        }
    });
});