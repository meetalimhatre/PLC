sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Input",
            id: {
                value: "AddEditDialogEntityIdInput",
                isRegex: false
            },
            see: function (text) {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        text: text
                    }]
                }
            },

            enterText: function(text){
                return {
                    controlType: this.controlType,
                    id: this.id,
                    actionText: text
                }
            },
            
        }

    });