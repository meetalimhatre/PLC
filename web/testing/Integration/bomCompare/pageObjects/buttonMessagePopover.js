sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {
            controlType: "sap.m.Button",
            id: {
                value: "buttonMessagePopover",
                isRegex: false
            },

            see: function (sIcon, sText) {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes:[
                        {icon: sIcon},
                        {text: sText}
                    ]
                };
            },

            press: function(sIcon, sText){
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes:[
                        {icon: sIcon},
                        {text: sText}
                    ]
                };
            }

        };

    });