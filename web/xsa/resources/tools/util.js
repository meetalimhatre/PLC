$(function() {
    // anti clickJack
    if (self === top) {
        var antiClickjack = document.getElementById("clickJack");
        antiClickjack.parentNode.removeChild(antiClickjack);
    } else {
        top.location = self.location;
    }
    // init ui5 component
    sap.ui.getCore().attachInit(function() {
        new sap.ui.core.ComponentContainer({
            name: 'ui',
            height: '100%'
        }).placeAt('content');
    });
    // one time fetch of CSRF token
    $.ajax({
        type: "GET",
        url: "/sap/plc/xs/rest/dispatcher.xsjs/auth",
        headers: {"X-Csrf-Token": "fetch"},
        success: function(res, status, xhr) {
            var sHeaderCsrfToken = "X-Csrf-Token";
            var sCsrfToken = xhr.getResponseHeader(sHeaderCsrfToken);
            // for POST, PUT, and DELETE requests, add the CSRF token to the header
            $(document).ajaxSend(function(event, jqxhr, settings) {
                if (settings.type==="POST" || settings.type==="PUT" || settings.type==="DELETE") {
                    jqxhr.setRequestHeader(sHeaderCsrfToken, sCsrfToken);
                }
            });
        }
    });
});