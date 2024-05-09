var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

var oDefaultResponseMock = null;

if (jasmine.plcTestRunParameters.mode === 'all') {
	describe('xsjs.impl.greet-integrationtests', function () {

		var testUser = "greetTestUser";
		var greetUserHeaderName = "x-plc-user-id";
		var notAvailable = "na";
		var expectedBody = `Greetings ${testUser}!`;
		var expectedMessage = JSON.stringify({
			body: expectedBody,
			head: {}
		});

		function prepareRequest() {
			return {
				queryPath: "plcExtensionsGreet",
				method: $.net.http.GET,
				parameters: []
			};
		}

		beforeEach(() => {
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oCtx.xsjsContext.request = {
				headers: {
					get: (headerName) => {
						return headerName == greetUserHeaderName ? testUser : notAvailable;
					}
				}
			};
		});

		it("should return 200 OK and expected payload", function () {
			// arrange
			var oRequest = prepareRequest();

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalledWith(expectedMessage);
		});

	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}