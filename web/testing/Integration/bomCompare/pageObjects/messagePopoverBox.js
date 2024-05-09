sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.m.MessagePopover",
            id: {
                value: "messagePopoverBox",
                isRegex: false
            },

            see: function () {
                return {
                    controlType: this.controlType,
                    id: this.id
                };
            },

            checkMessageByTextContent : function(sText){
                return {
                    controlType: 'sap.m.MessageListItem',
                    attributes: [
                        {title: sText}
                    ]
                };
            }

        };

    });