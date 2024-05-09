sap.ui.define([
], function () {
    "use strict";

    var resourceBundle = {
        getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
                
        getResourceBundleText: function (text, args) {
            if(this.bundle == null){
                this.bundle = resourceBundle.getResourceBundle.call(this);
            }
            if(args){
			    return this.bundle.getText(text, args);
            }
			return this.bundle.getText(text);
		},
    }
    return resourceBundle;
});