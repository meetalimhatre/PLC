sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {
            controlType: "sap.m.Button",
            id: {
                value: "Button_Add",
                isRegex: false
            },
            see: function () {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        icon: "sap-icon://add"
                    }]
                }
            },

            press: function(){
                return {
                    controlType: this.controlType,
                    id: this.id
                }
            },
            
        }

    });