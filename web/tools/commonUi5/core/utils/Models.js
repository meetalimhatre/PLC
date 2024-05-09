sap.ui.define([
	"sap/ui/model/json/JSONModel",
], function (JSONModel) {
    "use strict";

    var models = {
        getProperty: function (model, path) {
            return this.getView().getModel(model).getProperty(path);
        },

        setProperty: function (model, path, value) {
            this.getView().getModel(model).setProperty(path, value);
            this.getView().getModel(model).refresh(true);
        },

        setPropertys: function (model, pathAndValues) {
            pathAndValues.forEach(pathAndValue => {
                models.setProperty.call(this,model, pathAndValue.path, pathAndValue.value)
            });
        },

        getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

        createModel : function(oData){
			var oModel = new JSONModel(oData);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}
    }
    return models;
});