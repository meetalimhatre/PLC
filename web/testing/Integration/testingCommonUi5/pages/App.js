sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5) {
	"use strict";

// var sViewName = "ui";
Opa5.createPageObjects({
	onTheAppPage: {

		actions: {},

		assertions: {

			iShouldSeeTheApp: function (id,sViewName) {
				return this.waitFor({
					id: id,
					viewName: sViewName,
					success: function () {
						Opa5.assert.ok(true, "The App view is displayed");
					},
					errorMessage: "Did not find the App view"
				});
			}
		}
	}
});
});