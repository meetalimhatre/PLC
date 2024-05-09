sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Dialog",
            id: {
                value: "export",
                isRegex: false
            },

            see: function (sTitle) {
                return {
                    id: this.id,
                    title: sTitle
                };
            }

        };

    });