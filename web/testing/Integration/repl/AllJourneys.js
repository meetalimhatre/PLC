sap.ui.loader.config({
    paths: {
      "Integration": "/base/testing/Integration"
    }
  });

sap.ui.define([
    "sap/ui/test/Opa5",
    "Integration/testingCommonUi5/pages/Common",
    "Integration/repl/pages/Home",
    "sap/ui/test/opaQunit"
], function (Opa5, Common) {
    "use strict";
    Opa5.extendConfig({
        arrangements: new Common(),
        viewNamespace: "mdr.ui.",
        autoWait: true
    });
    sap.ui.require([
        "Integration/repl/journeys/HomeJourney"

    ], function () {
        // QUnit.start();
    });
});