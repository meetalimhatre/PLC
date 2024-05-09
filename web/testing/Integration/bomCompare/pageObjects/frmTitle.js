sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.ui.core.Title",

            see: function () {
                return {
                    controlType: this.controlType,
                    attributes: [{
                        text: "Side-by-Side Comparison of Calculation Versions"
                    }]
                };
            }

        };

    });