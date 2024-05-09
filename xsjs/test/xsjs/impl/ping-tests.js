if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.ping-tests', function() {

		var _ = require("lodash");
		var ServiceOutput = require("../../../lib/xs/util/serviceOutput");
		var MessageLibrary = require("../../../lib/xs/util/message");

		var PlcException = MessageLibrary.PlcException;
		var messageCode = MessageLibrary.Code;

		var oUnitUnderTest = new (require("../../../lib/xs/impl/ping").Ping)($);

		var oPersistencyMock = null;
		var oConnectionMock = null;
		var serviceOutput = new ServiceOutput();
		var oBodyData = [];
		var aParameters =[];

		beforeEach(function() {

			oConnectionMock = jasmine.createSpyObj('oConnectionMock', ['commit']);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);

			var oPersistencyMiscMock = jasmine.createSpyObj("oPersistencyMiscMock", [ "ping" ]);
			oPersistencyMock.Misc = oPersistencyMiscMock;

		});

		it("should return 200 OK", function() {
			// arrange
			oPersistencyMock.Misc.ping.and.returnValue([{DUMMY: "X"}]);

			// act
			var result = oUnitUnderTest.get(oBodyData, aParameters, serviceOutput, oPersistencyMock);

			// assert
			expect(result.status).toBe(200);
		});

		it("should return 500 Internal Server Error because of missing column", function() {
			// arrange
			oPersistencyMock.Misc.ping.and.returnValue([{}]);

			// act
			var result = oUnitUnderTest.get(oBodyData, aParameters, serviceOutput, oPersistencyMock);

			// assert
			expect(result.status).toBe(500);
		});

		it("should return 500 Internal Server Error because of invalid table contents", function() {
			var aInvalidContent = [ "x", "", 1000, -123, {}, [{}] ];
			_.each(aInvalidContent, function(oInvalidContent, iIndex) {
				// arrange
				oPersistencyMock.Misc.ping.and.returnValue([{DUMMY: oInvalidContent}]);

				// act
				var result = oUnitUnderTest.get(oBodyData, aParameters, serviceOutput, oPersistencyMock);

				// assert
				expect(result.status).toBe(500);
			});
		});

		it("should return 500 Internal Server Error because database exception", function() {
			// arrange
			oPersistencyMock.Misc.ping.and.callFake(function() {
				throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION);
			});

			// act
			var result = oUnitUnderTest.get(oBodyData, aParameters, serviceOutput, oPersistencyMock);

			// assert
			expect(result.status).toBe(500);
		});
		
	}).addTags(["All_Unit_Tests"]);
}