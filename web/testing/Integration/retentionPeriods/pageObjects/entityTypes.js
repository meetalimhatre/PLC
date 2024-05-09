sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {
            controlType: "sap.m.Select",
            id: {
                value: "EntityTypes",
                isRegex: false
            },
            see: function (selectedKey) {
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        selectedKey: selectedKey
                    }]
                }
            },

            seeOption: function(text,Key){
                return {
                    controlType: "sap.ui.core.Item",
                    attributes: [{
                        text: text,
                        key: Key
                    }]
                }
            },

            press: function(selectedKey){
                return {
                    controlType: this.controlType,
                    id: this.id,
                    attributes: [{
                        selectedKey: selectedKey
                    }]
                }
            },

            pressOption: function(text,Key){
                return {
                    controlType: "sap.ui.core.Item",
                    attributes: [{
                        text: text,
                        key: Key
                    }]
                }
            },
            
        }

    });