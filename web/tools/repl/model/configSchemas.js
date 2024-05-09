sap.ui.define([],
    function() {
        'use strict';
        var schemas = {
            configDetailsSchema: {
                "DataMapping": [],
                "DataPreview": [],
                "ERPFieldNames": []
            },
            configOverviewSchema: {
                "ConfigurationTable": [],
                "ReplState": [{
                    "key": "LOCAL",
                    "text": "LOCAL"
                }, {
                    "key": "ENABLED",
                    "text": "ENABLED"
                }, {
                    "key": "DISABLED",
                    "text": "DISABLED"
                }]
            }
        };

        return schemas;
    });