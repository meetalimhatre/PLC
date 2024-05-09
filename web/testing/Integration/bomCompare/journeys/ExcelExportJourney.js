sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/opaQunit",
    "Integration/bomCompare/pageObjects/allObjects",
    "Integration/bomCompare/pages/Home",
    "Integration/testingCommonUi5/pages/Common"
], function (Opa5, opaTest, allObjects) {
    "use strict";

    QUnit.module("BomCompareTests");
    opaTest("Excel Export", function (Given, When, Then) {

        Given.iStartMyApp({
            hash: "1/2"
        }, "app=ui&bundleUrl=/base/tools/commonUi5/i18n/i18n.properties");
        When.onHomePage.iLookAtTheScreen();
        Then.onHomePage.iShouldSeeATreeTableWithShownShownNoOfRows(allObjects.treeTable.checkNoOfShownTableRows(6));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.btnExcelExportMenu.see('', true, 'sap-icon://excel-attachment'));
        Then.onHomePage.press(allObjects.btnExcelExportMenu.see('', true, 'sap-icon://excel-attachment'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.btnExcelExportMenuOption.see('Export', true, 'sap-icon://save'));
        Then.onHomePage.press(allObjects.btnExcelExportMenuOption.see('Export', true, 'sap-icon://save'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.oExport.see('Export Excel File'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.buttonMessagePopover.see('sap-icon://message-success', '3'));
        Then.onHomePage.press(allObjects.buttonMessagePopover.press('sap-icon://message-success', '3'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.see());
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.checkMessageByTextContent('Application loaded successfully.'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.checkMessageByTextContent('Export file created successfully.'));
        Then.onHomePage.iTeardownMyAppFrame();
    });

});