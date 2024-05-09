sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/opaQunit",
    "Integration/repl/pages/Home",
    "Integration/testingCommonUi5/pages/Common"
], function (Opa5, opaTest) {
    "use strict";

    QUnit.module("Repl");
    opaTest("repl", function (Given, When, Then) {
        Given.iStartMyApp({
            hash: ""
        }, "app=mdr.ui&bundleUrl=/base/tools/commonUi5/i18n/i18n.properties");
        When.onHomePage.iLookAtTheScreen();
        Then.onHomePage.iTeardownMyAppFrame();
    });
});