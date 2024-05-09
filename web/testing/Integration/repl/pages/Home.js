sap.ui.require(
[
    "sap/ui/test/Opa5",
    "Integration/testingCommonUi5/pages/Common",
],
function (Opa5, Common) {
    "use strict";
    // var sViewName = "landing.LandingPage";

    Opa5.createPageObjects({
        onHomePage: {
            baseClass: Common,
            actions: {

            },
            assertions: {

            }
        }
    });
});