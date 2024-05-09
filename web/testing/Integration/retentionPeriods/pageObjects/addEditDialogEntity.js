
sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {
            controlType: "sap.m.Label",
            id: {
                value: "AddEditDialogEntity",
                isRegex: false
            },
            see: function () {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        text: "Entity"
                    }]
                }
            }
            
        }

    });