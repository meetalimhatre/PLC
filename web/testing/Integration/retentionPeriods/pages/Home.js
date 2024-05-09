sap.ui.require(
[
    "sap/ui/test/Opa5",
    "Integration/testingCommonUi5/pages/Common",
    "Integration/retentionPeriods/actions/AddRetentionPeriod",
],
function (Opa5, Common, AddRetentionPeriod) {
    "use strict";

    Opa5.createPageObjects({
        onHomePage: {
            baseClass: Common,
            actions: {
                iAddRetentionPeriod: AddRetentionPeriod.get

            },
            assertions: {

            }
        }
    });
});