sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Label",

            see: function () {
                return {
                    controlType: this.controlType,
                    attributes: [{
                        text: "Secondary Calculation Version (#2)"
                    }]
                };
            }

        };

    });