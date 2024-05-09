sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Switch",

            see: function (bState) {
                return {
                    controlType: this.controlType,
                    attributes: [{
                        state: bState
                    }]
                };
            }

        };

    });