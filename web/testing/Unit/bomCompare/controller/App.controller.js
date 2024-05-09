sap.ui.require(
[
    "retentionperiods/ui/controller/App.controller",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
],
function (App) {
    "use strict";

    QUnit.module("App.controller.js", {
        setup: function () {
            this.app = new App();
        },
        teardown: function () {
            this.app.destroy();
        }
    });

}
);