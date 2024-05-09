sap.ui.loader.config({
    paths: {
      "Integration": "/base/testing/Integration"
    }
  });

sap.ui.define([
    "sap/ui/test/Opa5",
    "Integration/testingCommonUi5/pages/Common",
    "Integration/retentionPeriods/pages/Home",
    "sap/ui/test/opaQunit"
], function (Opa5, Common) {
    "use strict";
    Opa5.extendConfig({
        arrangements: new Common(),
        viewNamespace: "retentionperiods.ui.",
        autoWait: true
    });
    sap.ui.require([
        "Integration/retentionPeriods/journeys/AddRetentionPeriodJourney"

    ], function () {
        // QUnit.start();
    });
});