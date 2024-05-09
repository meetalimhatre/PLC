$(function() {
    sap.ui.loader.config({
        paths: {
            'core': '/ui5/common/core'
        }
    });
    sap.ui.getCore().attachInit(function() {
        new sap.m.Shell({
            appWidthLimited: false,
            app: new sap.ui.core.ComponentContainer({
                height : "100%",
                name : "mdr.ui"
            })
        }).placeAt("content");
    });
})