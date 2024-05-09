sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.Button",
            see: function (bEnabled) {
                return {
                    controlType: this.controlType,
                    isEnabled: bEnabled,
                    attributes:[
                        {icon: 'sap-icon://excel-attachment'}
                    ]
                };
            }

        };

    });