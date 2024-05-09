sap.ui.define(
    [
        "Integration/retentionPeriods/pageObjects/allObjects",
    ],
    function (allObjects) {
        "use strict";
        var AddRetentionPeriod = {
            get: function (When, Then, Options) {
                When.onHomePage.iShouldSeeTheProperty(allObjects.button_Add.see());
                Then.onHomePage.press(allObjects.button_Add.press());
                Then.onHomePage.iShouldSeeTheProperty(allObjects.addEditRetentionPeriodDialog.see());
                Then.onHomePage.iShouldSeeTheProperty(allObjects.addEditDialogEntity.see());
                Then.onHomePage.press(allObjects.entityTypes.press("CUSTOMER"));
                Then.onHomePage.iShouldSeeTheProperty(allObjects.entityTypes.seeOption("CUSTOMER", "CUSTOMER"));
                Then.onHomePage.iShouldSeeTheProperty(allObjects.entityTypes.seeOption("VENDOR", "VENDOR"));
                Then.onHomePage.iShouldSeeTheProperty(allObjects.entityTypes.seeOption("PROJECT", "PROJECT"));
                Then.onHomePage.iShouldSeeTheProperty(allObjects.entityTypes.seeOption("USER", "USER"));
                Then.onHomePage.press(allObjects.entityTypes.pressOption(Options.Entity));
                Then.onHomePage.iShouldSeeTheProperty(allObjects.entityTypes.see(Options.Entity));
                Then.onHomePage.iShouldSeeTheProperty(allObjects.addEditDialogEntityId.see());
                Then.onHomePage.enterText(allObjects.addEditDialogEntityIdInput.enterText(Options.SUBJECT));
                Then.onHomePage.iShouldSeeTheProperty(allObjects.addEditDialogValidTo.see());
                if (Options.VALID_TO !== null) {
                    Then.onHomePage.press(allObjects.addSaveButton.press());
                    Then.onHomePage.enterText(allObjects.addEditDialogValidToDatePickers.enterText(Options.VALID_TO)); 
                }
                Then.onHomePage.iShouldSeeTheProperty(allObjects.addEditDialogValidFor.see());
                if (Options.VALID_FOR !== null) {
                    Then.onHomePage.press(allObjects.addSaveButton.press());
                    Then.onHomePage.enterText(allObjects.addEditDialogValidForStepInput.enterText(Options.VALID_FOR));
                }
                Then.onHomePage.press(allObjects.addSaveButton.press());
            }
        }
        return AddRetentionPeriod;
    });