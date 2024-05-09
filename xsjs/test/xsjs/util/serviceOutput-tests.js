if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.util.serviceOutput-tests', function() {

		var ServiceOutput = require("../../../lib/xs/util/serviceOutput");

		var oServiceOutput;

		beforeEach(function() {
			oServiceOutput = new ServiceOutput();
		});

		it("methods should be chainable", function() {
			//arrange
			var sMessage = "message one";
			var oTransactionalData = {TEST : 'Test'};
			var sMetaInfoKey = "key one";
			var sMetaInfoValue = "value one";
			var iStatus = $.net.http.OK;

			//act 
			oServiceOutput.addMessage(sMessage)
			.setTransactionalData(oTransactionalData)
			.addMetadata(sMetaInfoKey,sMetaInfoValue)
			.setStatus(iStatus);

			//assert
			expect(oServiceOutput.payload.head.messages[0]).toBe(sMessage);
			expect(oServiceOutput.payload.body.transactionaldata).toEqual([oTransactionalData]);
			expect(oServiceOutput.payload.head.metadata[sMetaInfoKey]).toBe(sMetaInfoValue);
			expect(oServiceOutput.status).toBe(iStatus);
		});

		it("setTransactionalData(): transactional data should be set and accessible via payload.body.transactionaldata property as array", function() {
			//arrange
			var oPayload = {TEST : 'Test'};

			//act 
			oServiceOutput.setTransactionalData(oPayload);

			//assert
			expect(oServiceOutput.payload.body.transactionaldata).toEqual([oPayload]);
		});

		it("setCalculationResult(): calculated result should be set and accessible via payload.body.calculated property", function() {
			//arrange
			var oPayload = {TEST : 'Test'};

			//act 
			oServiceOutput.setCalculationResult(oPayload);

			//assert
			expect(oServiceOutput.payload.body.calculated).toEqual(oPayload);
		});

		it("addMetadata(): meta information should be set and accessible via payload.head.metadata property", function() {
			//arrange
			var sMetaInfoKey1 = "key one";
			var sMetaInfoValue1 = "value one";
			var sMetaInfoKey2 = "key two";
			var sMetaInfoValue2 = "value two";

			//act 
			oServiceOutput.addMetadata(sMetaInfoKey1, sMetaInfoValue1).addMetadata(sMetaInfoKey2, sMetaInfoValue2);

			//assert
			expect(oServiceOutput.payload.head.metadata[sMetaInfoKey1]).toBe(sMetaInfoValue1);
			expect(oServiceOutput.payload.head.metadata[sMetaInfoKey2]).toBe(sMetaInfoValue2);
		});

		it("addMessage(): messages added should be set and accessible via payload.head.messages property", function() {
			//arrange
			var sMessage1 = "message one";
			var sMessage2 = "message two";

			//act 
			oServiceOutput.addMessage(sMessage1).addMessage(sMessage2);

			//assert
			expect(oServiceOutput.payload.head.messages[0]).toBe(sMessage1);
			expect(oServiceOutput.payload.head.messages[1]).toBe(sMessage2);
		});

		it("setStatus(): status set should be accessible via status property", function() {
			//arrange
			var iStatus = $.net.http.OK;

			//act 
			oServiceOutput.setStatus(iStatus);

			//assert
			expect(oServiceOutput.status).toBe(iStatus);
		});

		it("setStatus(): should throw Exception if status is not an HTTP status code", function() {
			//arrange
			var iInvalidStatus = 31337;
			var exception;

			//act 
			try {
				oServiceOutput.setStatus(iInvalidStatus);
			} catch (e) {
				exception = e;
			}

			//assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});   

	}).addTags(["All_Unit_Tests"]);
}