var BodilessRequestValidator = require("../../../lib/xs/validator/bodilessRequestValidator").BodilessRequestValidator;
var MessageLibrary = require("../../../lib/xs/util/message");
var PlcException = MessageLibrary.PlcException;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.bodilessRequestValidator-tests', function() {

		var requestValidator;
		var iHttpDefaultMethod = $.net.http.GET;

		beforeEach(function() {
			requestValidator = new BodilessRequestValidator([ iHttpDefaultMethod ]);
		});

		function createRequest(iMethod, sBody) {
			var oBody = sBody === undefined ? undefined : {
				asString : function() {
					return sBody;
				}
			};
			var oRequest = {
					method : iMethod,
					body : oBody
			};
			return oRequest;
		}

		it("request with empty body for configured method -> validation success", function() {
			// arrange
			var oRequest = createRequest(iHttpDefaultMethod, undefined);

			// act
			requestValidator.validate(oRequest);

			// assert
			expect(requestValidator.validationSuccess).toBe(true);
		});

		it("request with non-empty body for configured method -> throws PlcException; no validation success", function() {
			// arrange
			var oRequest = createRequest(iHttpDefaultMethod, "content that shouldn't be there");
			var exception;
			// act
			try {
				requestValidator.validate(oRequest);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception instanceof PlcException).toBe(true);
			expect(requestValidator.validationSuccess).toBe(false);
		});

		it("request with unconfigured method -> throws PlcException; no validation success", function() {
			// arrange
			var oRequest = createRequest($.net.http.CONNECT, undefined);
			var exception;
			// act
			try {
				requestValidator.validate(oRequest);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception instanceof PlcException).toBe(true);
			expect(requestValidator.validationSuccess).toBe(false);
		});
		
	}).addTags(["All_Unit_Tests"]);
}