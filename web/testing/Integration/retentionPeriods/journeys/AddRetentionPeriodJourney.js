sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/opaQunit",
    "Integration/retentionPeriods/pages/Home",
    "Integration/testingCommonUi5/pages/Common"
], function (Opa5, opaTest) {
    "use strict";

    QUnit.module("retentionPeriodsTest");
    opaTest("Add Retention Period", function (Given, When, Then) {
        Given.iStartMyApp({
            hash: ""
        }, "app=retentionperiods.ui&bundleUrl=/base/tools/commonUi5/i18n/i18n.properties");
        When.onHomePage.iLookAtTheScreen();
        When.onHomePage.iAddRetentionPeriod(When, Then, {Entity: "USER", SUBJECT: "test USER", VALID_TO: "2024-08-08", VALID_FOR: null});
        When.onHomePage.iAddRetentionPeriod(When, Then, {Entity: "VENDOR", SUBJECT: "test VENDOR", VALID_TO: "2024-08-08", VALID_FOR: null});
        When.onHomePage.iAddRetentionPeriod(When, Then, {Entity: "VENDOR", SUBJECT: "*", VALID_TO: null, VALID_FOR: "99"});
        When.onHomePage.iAddRetentionPeriod(When, Then, {Entity: "PROJECT", SUBJECT: "test PROJECT", VALID_TO: "2024-08-08", VALID_FOR: null});
        When.onHomePage.iAddRetentionPeriod(When, Then, {Entity: "PROJECT", SUBJECT: "*", VALID_TO: null, VALID_FOR: "99"});
        When.onHomePage.iAddRetentionPeriod(When, Then, {Entity: "CUSTOMER", SUBJECT: "test CUSTOMER", VALID_TO: "2024-08-08", VALID_FOR: null});
        When.onHomePage.iAddRetentionPeriod(When, Then, {Entity: "CUSTOMER", SUBJECT: "*", VALID_TO: null, VALID_FOR: "99"});
        Then.onHomePage.iTeardownMyAppFrame();
    });

   
});