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
                        text: "Primary Calculation Version (#1)"
                    }]
                };
            }

        };

    });