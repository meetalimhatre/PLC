if (jasmine.plcTestRunParameters.mode === 'all') {
	describe('xsjs.impl.greet-tests', function () {

		var ServiceOutput = require("../../../lib/xs/util/serviceOutput");
		var oUnitUnderTest = new (require("../../../lib/xs/impl/plcExtensionsGreet").GreetImpl)($);
		var serviceOutput = new ServiceOutput();

		var testUser = "greetTestUser";
		var greetUserHeaderName = "x-plc-user-id";
		var notAvailable = "na";
		var expectedMessage = `Greetings ${testUser}!`;

		beforeEach(function () {

			$.request = {
			    headers: {
			        get: (headerName) => {
			            return headerName == greetUserHeaderName ? testUser : notAvailable;
			        }
			    }
			};
		});

		it("should return 200 OK and expected payload body", function () {

			// act
			var result = oUnitUnderTest.greet(null, null, serviceOutput, null);

			// assert
			expect(result.status).toBe(200);
			expect(result.payload.body).toBe(expectedMessage);
		});

	}).addTags(["All_Unit_Tests"]);
}