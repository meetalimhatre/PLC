sap.ui.define([ 
    "ui/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function(Controller, JSONModel, MessageBox) {
    "use strict";
    
    return Controller.extend("ui.controller.InstanceBasedPrivilege", {
        onInit: function() {
            var oData = {
                "userName": "",
            }
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel);
        },

        startClick: function() {
            var oData = this.getView().getModel().getData();
            if (oData.userName.trim() === "" || oData.userName.length > 256) {
                MessageBox.warning("invalid user name input, the user name length must be 0~256");
            } else {
                $.ajax({
                    url: "/sap/plc/xs/postinstall/rest/instanceBasedPrivilege.xsjs",
                    method: "POST",
                    data: oData,
                    dataType: "json"
                }).then(function(data) {
                    console.log(data);
                    if (data.code === 0) {
                        MessageBox.success(data.message);                   
                    } else {
                        MessageBox.warning(data.message);
                    }
                });
            }     
        }
    });
});