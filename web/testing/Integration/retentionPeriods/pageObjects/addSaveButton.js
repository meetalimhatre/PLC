sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {
            controlType: "sap.m.Button",
            id: {
                value: "addSaveButton",
                isRegex: false
            },
            see: function () {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        text: "save"
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