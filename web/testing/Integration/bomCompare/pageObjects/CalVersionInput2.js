sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Input",
            id: {
                value: "CalVersionInput2",
                isRegex: false
            },

            see: function (text) {
                return {
                    controlType: this.controlType,
                    id: this.id
                };
            },

            seeWithText: function (sInputValue) {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        value: sInputValue
                    }]
                };
            },

            seeWithPlaceholder: function (sInputValue) {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        placeholder: sInputValue
                    }]
                };
            },

            pressVHI: function () {
                return {
                    id: {
                        value: "/Home--CalVersionInput2-vhi$/",
                        isRegex: true
                    }
                };
            }

        };

    });