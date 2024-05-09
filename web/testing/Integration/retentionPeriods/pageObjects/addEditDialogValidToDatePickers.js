sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.DatePicker",
            id: {
                value: "AddEditDialogValidToDatePickers",
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