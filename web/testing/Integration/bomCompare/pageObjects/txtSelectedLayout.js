sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Text",

            see: function (sText) {
                return {
                    controlType: this.controlType,
                    attributes: [{
                        text: sText
                    }]
                };
            }

        };

    });