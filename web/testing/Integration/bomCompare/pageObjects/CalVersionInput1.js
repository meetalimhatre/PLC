sap.ui.define(
    [],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Input",
            id: {
                value: "CalVersionInput1",
                isRegex: false
            },

            see: function (sInputValue) {
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
                        value: "/Home--CalVersionInput1-vhi$/",
                        isRegex: true
                    }
                };
            }

        };

    });