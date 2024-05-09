sap.ui.define([ 
    "ui/controller/BaseController",
    "sap/m/MessageBox",
], function(Controller, MessageBox) {
    "use strict";
    return Controller.extend("ui.controller.Launchpad", {
        
        onInit: function() {
            Controller.prototype.onInit();
        },

        initPostInstallationView: function(mode) {
            var _this = this;
            //_this.getView().byId("page").removeAllContent();
            switch(mode){
                case 'freshInstallation':
                    _this.getRouter().navTo("freshInstall");
                   
                    break;
                case 'prepareForUpgrade':
                    _this.getRouter().navTo("preUpgrade");
                    break;
                case 'upgrade':
                    _this.getRouter().navTo("upgrade");
                    break;
                default:
            }
            _this.getView().byId("page").setBusy(false);
        },

        setInfoToModel: function(data) {
            var _this = this;

            return new Promise(function(resolve, reject) {
                if (data.status) {
                    reject(data);
                } else {
                    _this.getView().getModel("info").setData(data);
                    resolve();
                }
            });
        },

        getPostInstallationInformation: function(mode) {
            return new Promise(function(resolve, reject) {
                $.ajax({
                    url: "/sap/plc/xs/postinstall/rest/run.xsjs?info=env&mode=" + mode,
                    method: "GET",
                    dataType: "json"
                }).done(resolve)
                  .fail(reject);
            })
        },

        handleMessage: function(data) {
            
            
            if (data.status === 401) {
                this.handleErrorMessage({
                    message: "You are not authorized to perform the selected operation."
                });
            }
            else if (data.status === 500){
                this.handleErrorMessage({
                    message: data.responseJSON.message
                })
            }
            else if (data.type === 'info') {
                this.handleInfoMessage(data);
            } else {
                this.handleErrorMessage(data);
            }
        },

        handleErrorMessage: function(data) {
            this.getView().byId("page").setBusy(false);
            MessageBox.error(data.message);
   
        },

        handleInfoMessage: function(data) {
            this.getView().byId("page").setBusy(false);

            MessageBox.information(data.message);
        },
        freshInstallHandler: function() {
            this.handleModeSelect("freshInstallation");
        },

        prepareForUpgradeHandler: function(){
            this.handleModeSelect("prepareForUpgrade");
        },

        upgradeHandler: function() {
            this.handleModeSelect("upgrade");
        },

        handleModeSelect: function(mode) {
            this.getView().byId("page").setBusy(true);

            this.fetchPreviousInstallation()
                .then(this.previousInstallationHandling.bind(this, mode))
                .then(this.getPostInstallationInformation.bind(this, mode))
                .then(this.setInfoToModel.bind(this))
                .then(this.initPostInstallationView.bind(this, mode))
                .catch(this.handleMessage.bind(this));
        },
         
        fetchPreviousInstallation: function() {
            return new Promise(function(resolve, reject) {
                $.ajax({
                    url: "/sap/plc/xs/postinstall/rest/run.xsjs?info=check",
                    method: "GET"
                }).done(resolve)
                  .fail(reject);
            });
        },

        previousInstallationHandling: function(mode, data) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                _this.getView().byId("page").setBusy(false);
                
                if (data !== 'null') {
                    
                    if(mode == 'prepareForUpgrade'){
                        var message = 'The previous upgrade is still running. Please wait...';
                    }else{
                        var message = 'The previous installation is still running. Current step is ' + data.NAME + '. Please wait...';
                    }

                    return reject({
                        type: 'info',
                        message: message
                    });
                }

                return resolve();
            });
        },
        
        ping: function() {
            $.ajax({
                type: "GET",
                url: "/sap/plc/xs/rest/dispatcher.xsjs/auth"
            });
        }
    })
});