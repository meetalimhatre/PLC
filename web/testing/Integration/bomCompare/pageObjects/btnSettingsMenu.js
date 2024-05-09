sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Button",

            see: function () {
                return {
                    controlType: this.controlType,
                    attributes: [{
                        icon: "sap-icon://action-settings"
                    }]
                };
            },

            press: function(){
                return {
                    controlType: this.controlType,
                    attributes: [{
                        icon: "sap-icon://action-settings"
                    }]
                };
            }

        };

    });