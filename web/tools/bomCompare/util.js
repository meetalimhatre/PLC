$(function () {
    'use strict';
    // init ui5 component
    var hasIds = false, idsString = "ids=";

    if (window.location.href.includes(idsString)) {
        hasIds = true;
        var hrefBeforeIds = window.location.href.split(idsString)[0];
        var charPreceedingIds = hrefBeforeIds.substr(hrefBeforeIds.length - 1);
        idsString = charPreceedingIds + idsString;
    }

    if (hasIds) {
        var ids = window.location.href.split(idsString)[1];
        if (ids != null) {

            var aIds=ids.split(",");

            if (aIds.length == 1) {
                window.location.href = window.location.href.replace(idsString + aIds[0], "#/" + aIds[0]);
            }
            else if (aIds.length == 2) {
                window.location.href = window.location.href.replace(idsString + aIds[0] + "," + aIds[1], "#/" + aIds[0] + "/" + aIds[1]);
            }
        }
    }

    var language;

    if(window.location.href.includes("?sap-language=") === true) {
        language = window.location.href.split("?sap-language=")[1].split("#")[0];
    }
    else {
        language = navigator.language;
    }

    sap.ui.getCore().getConfiguration().setLanguage(language);
    sap.ui.loader.config({
        paths: {
            'core': '/ui5/common/core',
        }
    });
    sap.ui.getCore().attachInit(function () {
        new sap.ui.core.ComponentContainer({
            name: 'ui',
            height: '100%'
        }).placeAt('content');
    });
});