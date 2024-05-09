sap.ui.require(
    [
        "sap/ui/thirdparty/sinon",
        "sap/ui/thirdparty/sinon-qunit",
    ],
    function () {
        "use strict";
        var homeController;
        QUnit.module("3Q", {
            setup: function () {},
            teardown: function () {}
        });

        QUnit.test("3T", function (assert) {
			assert.strictEqual("A", "A", "The long text for status A is correct");
		});

    }
);