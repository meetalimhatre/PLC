sap.ui.define([ 
    "ui/controller/BaseController",
], function(Controller) {
    "use strict";
    return Controller.extend("ui.controller.FreshInstallation", {
    
        onInit: function() {
            this.redirectToLaunchpadOnRefresh();
            this.mode = "freshInstallation";
        
        },
        pollingStatus: function() {
            var _this = this;
            $.ajax({
                url: "/sap/plc/xs/postinstall/rest/run.xsjs?info=task&id=" + _this.task_id,
                method: "GET",
                dataType: "json"
            }).then(function(data) {
                data.MODE = 'freshInstallation';
                _this.applyStatusChange(data);
                _this.log(data.PROGRESS_STEP, data.PROGRESS_TOTAL, data.LAST_UPDATED_ON, data.STATUS);
                
                var target = _this.getView().getModel("info").getProperty("/target");
                var dialog; 
                if (data.PROGRESS_STEP === data.PROGRESS_TOTAL && data.STATUS === 'complete') {
                    if (_this._timer) {
                        window.clearInterval(_this._timer);
                        _this._timer = null;
                    }
                    if (!_this._status) {
                        _this._status = data.STATUS;
                        _this._log = new Date().toLocaleString() + ":  " + 'SAP Product Lifycycle Costing version ' + target + ' has been installed successfully. \n';
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
                        _this._log =  new Date().toLocaleString() + ":  " + 'An error occurred that prevented installation. Please see the log file for details and contact your system administrator. \n';
                        _this._log += "Error message: " + data.ERROR_DETAILS;
                        _this.showLogText("failed");
                    }
                    _this.allowTabClose();
                }
            });
        }
    });
});