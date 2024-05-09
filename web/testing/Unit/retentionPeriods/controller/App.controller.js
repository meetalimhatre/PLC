sap.ui.require(
[
    "retentionperiods/ui/controller/App.controller",
    "ReuseFunctions/ReuseFunctions",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
],
function (App, ReuseFunctions) {
    "use strict";

    QUnit.module("App.controller.js", {
        setup: function () {
        },
        teardown: function () {   
               
        }
    });

    QUnit.test("onInit", function (assert) {
        var app = new App();
        var oGetViewStub = ReuseFunctions.SetupViewStub({}, "null", "sapUiSizeCozy", assert);
        
        try {
            app.onInit();
            oGetViewStub.restore;
            app.destroy(); 
          } catch (e) {
            // pass
            oGetViewStub.restore;
            app.destroy(); 
          }
    });

}
);