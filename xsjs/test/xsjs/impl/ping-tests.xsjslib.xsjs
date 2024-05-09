if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.ping-tests', function() {

		var InvalidRequestException = $.require("../../../lib/xs/xslib/exceptions").InvalidRequestException;
		var oPersistencyMock = null;
		var oUnitUnderTest = null;

		beforeEach(function() {
			oUnitUnderTest = $.require("../../../lib/xs/impl/ping");

			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "ping" ]);
			oUnitUnderTest.persistency = oPersistencyMock;
		});

		it("should return ", function() {
			// arrange
			oPersistencyMock.ping.and.returnValue({
				userId : "userId",
				sessionId : "sessionId",
				language : "DE"
			});

			// act
			try {
				oUnitUnderTest.ping();
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception instanceof InvalidRequestException).toBe(true);
		});

		it("should return ", function() {
			// arrange
			oPersistencyMock.ping.and.returnValue([{DUMMY: "X"}]);

			// act
			var result = oUnitUnderTest.ping();

			// assert
			expect(result.status).toBe(200);
		});
	});
}