sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
	"use strict";

	return Controller.extend("plc.redirect.controller.OpenVersion", {
		onInit: function (oEvent) {

            var complete_url = window.location.href;

            var urlRegex = /^((https?:\/\/){1})(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])(\:{1}([0-9]+))?(\/openVersion){1}\/?((\?id=){1}([0-9]+))$/;
            if(!urlRegex.test(complete_url)) {
                MessageBox.error("Invalid Open Version URL");
                return;
            }

            var host_and_param = complete_url.split("?");
            var param_and_value = host_and_param[1].split("=");
            var versionId = param_and_value[1];

            var host = window.location.host;
            if(!host.includes(":")) {
                host = host + ":443";
            }

            sap.m.URLHelper.redirect("plc://" + host + "/openVersion?id=" + versionId, false);
		}
	});
});