sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/opaQunit",
    "Integration/retentionPeriods/pages/Home",
    "Integration/testingCommonUi5/pages/Common"
], function (Opa5, opaTest) {
    "use strict";

    QUnit.module("retentionPeriodsTest");
    opaTest("Edit Retention Period", function (Given, When, Then) {
        Given.iStartMyApp({
            hash: ""
        }, "app=retentionperiods.ui&bundleUrl=/base/tools/commonUi5/i18n/i18n.properties");
        When.onHomePage.iLookAtTheScreen();
        When.onHomePage.iDeleteSingleRetentionPeriod(When, Then, {Entity: "USER"});
        Then.onHomePage.iTeardownMyAppFrame();
    });
});