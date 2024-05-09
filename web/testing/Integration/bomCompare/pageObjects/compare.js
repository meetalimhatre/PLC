sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {
            controlType: "sap.m.Button",
            id: {
                value: "compare",
                isRegex: false
            },
            see: function () {
                return {
                    controlType: this.controlType,
                    id: this.id
                };
            },

            press: function(){
                return {
                    controlType: this.controlType,
                    id: this.id
                };
            }

        };

    });