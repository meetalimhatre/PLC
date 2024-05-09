sap.ui.define([
    "core/utils/Constants",
    "core/header/Logout",
    "sap/ui/Device",
    'sap/ui/model/json/JSONModel',
    "core/connector/BackendConnector",
], function (Constants, Logout, Device, JSONModel, BackendConnector) {
    "use strict";

    var CommonComponent = {
        startUp: function(UIComponent){
             // call the init function of the parent
            var url = new URL(location.href);
            var bundleUrl = url.searchParams.get("bundleUrl");
             if(bundleUrl == undefined || bundleUrl == null){
                 bundleUrl = "/ui5/common/i18n/i18n.properties"
             }
             var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : bundleUrl,
                fallbackLocale: "en" 
            });
            this.setModel(i18nModel,"i18n");
            this.setModel(new JSONModel({HeaderText:""}), "headerModel");
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();

            this.setModel(new JSONModel({
				showBusyIndicator: false,
				contentIsEnabled: true
			}), 'AppModel');

            Logout._setInactivityTimeout(Constants.timeout.SESSION_TIMEOUT);
            Logout._startInactivityTimer();
            BackendConnector.doGet({
                    constant: "AUTH_URL",
                },
                function(res, status, xhr) {
                    var sHeaderCsrfToken = "X-Csrf-Token";
                    var sCsrfToken = xhr.getResponseHeader(sHeaderCsrfToken);
                    // for POST, PUT, and DELETE requests, add the CSRF token to the header
                    $(document).ajaxSend(function(event, jqxhr, settings) {
                        if (settings.type==="POST" || settings.type==="PUT" || settings.type==="DELETE" || settings.type==="PATCH") {
                            jqxhr.setRequestHeader(sHeaderCsrfToken, sCsrfToken);
                        }
                    });
                },
                null,
                null,
                null,
                {"X-Csrf-Token": "fetch"},
            );
        },

        getContentDensityClass : function () {
		    if (!this._sContentDensityClass) {
		        
		            this._sContentDensityClass = "sapUiSizeCompact";
			    
		    }
            return this._sContentDensityClass;
		},
    }
    return CommonComponent;
});