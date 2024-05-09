sap.ui.define([ 
    "ui/controller/BaseController"
], function(Controller) {
    "use strict";
    return Controller.extend("ui.controller.PrepareForUpgrade", {
        onInit: function() {
            this.redirectToLaunchpadOnRefresh();
            this.mode = "prepareForUpgrade";
        },

        startClick: function() {
            var _this = this;
            this.checkPrerequisites()
                .then(function() {
                    _this.preventTabClose();
                    _this.getView().byId("start-button").setEnabled(false);
        
                    var oIcon = _this.getView().byId("upgrade-icon");
                    if (oIcon) {
                        oIcon.addStyleClass('synchronize');
                        oIcon.setSrc(_this._statusIconMap.active);
                    }
        
                    $.ajax({
                        url: "/sap/plc/xs/preupgrade/rest/run.xsjs",
                        method: "POST",
                        success: function(res, status, xhr){
                            oIcon.removeStyleClass('synchronize');
                            oIcon.setSrc(_this._statusIconMap.complete);
                            _this._log = new Date().toLocaleString() + ": Database Pre Upgrade runned succesfully. \n";
                            _this.showLogText("complete");
                        },
                        error: function(xhr, status, err){
                            oIcon.removeStyleClass('synchronize');
                            oIcon.setSrc(_this._statusIconMap.failed);
                            _this._log = new Date().toLocaleString() + ":  " + 'An error occurred that prevented installation. Please see the log file for details and contact your system administrator. \n';
                            _this.showLogText("failed");
                        }
                    })
                });
        },
  
    });
});