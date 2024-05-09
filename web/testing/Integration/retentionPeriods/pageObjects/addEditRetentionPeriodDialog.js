sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {
            controlType: "sap.m.Dialog",
            id: {
                value: "AddEditRetentionPeriod",
                isRegex: false
            },
            see: function () {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        title: "Add Data Retention Period"
                    }]
                }
            },
            
        }

    });