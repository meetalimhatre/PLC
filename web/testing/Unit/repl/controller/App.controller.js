sap.ui.require(
[
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
],
function () {
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