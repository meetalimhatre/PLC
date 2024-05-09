sap.ui.require(
    [
        "ui/controller/Home.controller",
        "sap/ui/thirdparty/sinon",
        "sap/ui/thirdparty/sinon-qunit",
        
    ],
    function (homeController) {
        "use strict";
        QUnit.module("2Q", {
            setup: function () {},
            teardown: function () {}
        });

        QUnit.test("2T", function (assert) {
			assert.strictEqual("A", "A", "The long text for status A is correct");
		});

    }
);