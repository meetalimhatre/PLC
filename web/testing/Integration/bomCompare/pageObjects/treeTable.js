sap.ui.define(
    [
    ],
    function () {
        "use strict";
        return {

            controlType: "sap.ui.table.TreeTable",
            id: {
                value: "treeTable",
                isRegex: false
            },

            checkNoOfShownTableRows : function(iNoOfRows){
                return {
                    controlType: this.controlType,
                    id: this.id,
                    aggregationLength: iNoOfRows
                };
            }

        };

    });