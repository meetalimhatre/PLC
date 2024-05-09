//TODO: remove tests just testing input parameter validation, instead test functionality, i.e. if request messages are built correctly.
if(jasmine.plcTestRunParameters.mode === 'all'){
	describe("xsjs.xslib.traceHelper tests", function() {
		
		var oUnitUnderTest = $.import("xs.xslib", "traceHelper");

		it("buildRequestMessage_noInstanceOfWebRequest_throwsArgumentException", function() {
		    let exception = null;
        	// act
			try {
				oUnitUnderTest.buildRequestMessage({});
            } catch (e) {
			    exception = e;
			} finally {
			//assert
				expect(exception).not.toBe(null);
			}
		});

		it("buildRequestMessage_undefinedParameter_throwsArgumentException", function() {
		    let exception = null;
        	// act
			try {
				oUnitUnderTest.buildRequestMessage(undefined);
            } catch (e) {
			    exception = e;
			} finally {
			//assert
				expect(exception).not.toBe(null);
			}
		});

		it("buildResponseMessage_undefinedParameter_throwsArgumentException", function() {
		    let exception = null;
        	// act
			try {
				oUnitUnderTest.buildResponseMessage(undefined);
            } catch (e) {
			    exception = e;
			} finally {
			//assert
				expect(exception).not.toBe(null);
			}
		});


		it("buildExceptionMessage_noInstanceOfWebRequest_throwsArgumentException", function() {
		    let exception = null;
        	// act
			try {
				oUnitUnderTest.buildExceptionMessage({}, new Error());
            } catch (e) {
			    exception = e;
			} finally {
			//assert
				expect(exception).not.toBe(null);
			}
		});

		it("buildExceptionMessage_undefinedWebRequest_throwsArgumentException", function() {
		    let exception = null;
        	// act
			try {
				oUnitUnderTest.buildExceptionMessage(undefined, new Error());
            } catch (e) {
			    exception = e;
			} finally {
			//assert
				expect(exception).not.toBe(null);
			}
		});

		it("buildExceptionMessage_noInstanceOfError_throwsArgumentException", function() {
		    let exception = null;
        	// act
			try {
				oUnitUnderTest.buildExceptionMessage(new $.web.WebRequest($.net.http.GET, "/fake/path"), {});
            } catch (e) {
			    exception = e;
			} finally {
			//assert
				expect(exception).not.toBe(null);
			}
		});

		it("buildExceptionMessage_undefinedError_throwsArgumentException", function() {
		    let exception = null;
        	// act
			try {
				oUnitUnderTest.buildExceptionMessage(new $.web.WebRequest($.net.http.GET, "/fake/path"), undefined);
            } catch (e) {
			    exception = e;
			} finally {
			//assert
				expect(exception).not.toBe(null);
			}
		});
		
	}).addTags(["All_Unit_Tests"]);
}