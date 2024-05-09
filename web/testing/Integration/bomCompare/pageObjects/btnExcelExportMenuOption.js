sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {
            controlType: "sap.ui.unified.MenuItem",

            see: function (sText, bEnabled, sIcon) {
                return {
                    controlType: this.controlType,
                    isEnabled: bEnabled,
                    attributes: [
                        {text: sText},
                        {icon: sIcon}
                    ]
                };
            },

            press: function(sText){
                return {
                    controlType: this.controlType,
                    attributes: [{
                        text: sText
                    }]
                };
            }

        };

    });