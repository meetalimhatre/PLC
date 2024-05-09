sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/opaQunit",
    "Integration/bomCompare/pageObjects/allObjects",
    "Integration/bomCompare/pages/Home",
    "Integration/testingCommonUi5/pages/Common"
], function (Opa5, opaTest, allObjects) {
    "use strict";

    QUnit.module("BomCompareTests");
    opaTest("Open App With No Parameters", function (Given, When, Then) {

        Given.iStartMyApp({
            hash: ""
        }, "app=ui&bundleUrl=/base/tools/commonUi5/i18n/i18n.properties");
        When.onHomePage.iLookAtTheScreen();
        Then.onHomePage.iShouldSeeTheProperty(allObjects.frmTitle.see());
        Then.onHomePage.iShouldSeeTheProperty(allObjects.lblPrimaryCalcVersion.see());
        Then.onHomePage.iShouldSeeTheProperty(allObjects.lblSecondaryCalcVersion.see());
        Then.onHomePage.iShouldSeeTheProperty(allObjects.CalVersionInput1.seeWithPlaceholder('Enter Calculation Version'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.CalVersionInput2.seeWithPlaceholder('Enter Calculation Version'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.tblAccessibilitySwitch.see(false));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.txtSelectedLayout.see('Layout: #SAP Default for BoM Compare'));
        Then.onHomePage.press(allObjects.btnSettingsMenu.press());
        Then.onHomePage.iShouldSeeTheProperty(allObjects.btnSettingsMenuOption.see('New', true, 'sap-icon://add-document'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.btnSettingsMenuOption.see('Edit', false, 'sap-icon://edit'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.btnSettingsMenuOption.see('Select', true, 'sap-icon://complete'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.btnSettingsMenuOption.see('Delete', false, 'sap-icon://delete'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.btnSaveLayout.see(false));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.btnExportExcel.see(false));
        Then.onHomePage.iShouldSeeATreeTableWithShownShownNoOfRows(allObjects.treeTable.checkNoOfShownTableRows(0));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.buttonMessagePopover.see('sap-icon://message-success', '1'));
        Then.onHomePage.press(allObjects.buttonMessagePopover.press('sap-icon://message-success', '1'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.see());
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.checkMessageByTextContent('Application loaded successfully.'));
        Then.onHomePage.iTeardownMyAppFrame();
    });

    opaTest("Open App With One Parameter", function (Given, When, Then) {

        Given.iStartMyApp({
            hash: "1"
        }, "app=ui&bundleUrl=/base/tools/commonUi5/i18n/i18n.properties");
        When.onHomePage.iLookAtTheScreen();
        Then.onHomePage.iShouldSeeTheProperty(allObjects.CalVersionInput1.seeWithText('1 - #Version 1'));
        Then.onHomePage.press(allObjects.buttonMessagePopover.press('sap-icon://message-success', '1'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.see());
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.checkMessageByTextContent('Application loaded successfully.'));
        Then.onHomePage.iTeardownMyAppFrame();
    });

    opaTest("Open App With Two Parameters", function (Given, When, Then) {

        Given.iStartMyApp({
            hash: "1/2"
        }, "app=ui&bundleUrl=/base/tools/commonUi5/i18n/i18n.properties");
        When.onHomePage.iLookAtTheScreen();
        Then.onHomePage.iShouldSeeTheProperty(allObjects.CalVersionInput1.seeWithText('1 - #Version 1'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.CalVersionInput2.seeWithText('2 - #Version 1'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.tblAccessibilitySwitch.see(false));
        Then.onHomePage.iShouldSeeATreeTableWithShownShownNoOfRows(allObjects.treeTable.checkNoOfShownTableRows(6));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.buttonMessagePopover.see('sap-icon://message-success', '2'));
        Then.onHomePage.press(allObjects.buttonMessagePopover.press('sap-icon://message-success', '2'));
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.see());
        Then.onHomePage.iShouldSeeTheProperty(allObjects.messagePopoverBox.checkMessageByTextContent('Application loaded successfully.'));
        Then.onHomePage.iTeardownMyAppFrame();
    });

});