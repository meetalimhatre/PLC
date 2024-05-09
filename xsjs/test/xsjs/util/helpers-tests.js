if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.util.helpers-tests', function() {
		var _ = require("lodash");

		// unit under test
		var oUnitUnderTest = require("../../../lib/xs/util/helpers");

		var aPositiveIntegers = ["3000", 3001, '3002'];
		var aInvalidIntegers = ["", "-1", "-1234567", "1234.23", ".1", "123456a", "a34567", "a", "asdasfa",
		                        "?!?", "23456?action=blub", Number.MAX_VALUE.toString(), Number.MIN_VALUE.toString(), undefined, null
		                        ];

		it("isPositiveInteger_validParameters_returnTrue", function() {
			// arrange

			_.each(aPositiveIntegers, function(integer, iIndex) {
				// act
				var result = oUnitUnderTest.isPositiveInteger(integer);

				// assert
				expect(result).toBe(true);
			});
		});

		it("isPositiveInteger_invalidParameters_returnFalse", function() {
			// arrange

			_.each(aInvalidIntegers, function(oInvalidQueryPath, iIndex) {
				// act
				var result = oUnitUnderTest.isPositiveInteger(oInvalidQueryPath);

				// assert
				expect(result).toBe(false);
			});
		});

		it("isNonNegativeInteger_validParameters_returnTrue", function() {
			// arrange
			var aValidValues = Array.prototype.push.apply([0, "0", "1"], aPositiveIntegers);
			_.each(aValidValues, function(value, iIndex) {
				// act
				var result = oUnitUnderTest.IsNonNegativeInteger(value);

				// assert
				expect(result).toBe(true);
			});
		});

		it("isNonNegativeInteger_invalidParameters_returnFalse", function() {
			// arrange
			var aInvalidValues = Array.prototype.push.apply([-1, "-1"], aInvalidIntegers);
			_.each(aInvalidValues, function(value, iIndex) {
				// act
				var result = oUnitUnderTest.IsNonNegativeInteger(value);

				// assert
				expect(result).toBe(false);
			});
		});

		it("toPositiveInteger_validParameters_returnInteger", function() {
			// arrange
			_.each(aPositiveIntegers, function(integer, iIndex) {
				// act
				var iResult = oUnitUnderTest.toPositiveInteger(integer);

				// assert
				expect(Number.isInteger(iResult)).toBe(true);
				expect(iResult > 0).toBe(true);
			});
		});

		it("toPositiveInteger_invalidParameters_throwException", function() {
			_.each(aInvalidIntegers, function(oInvalidQueryPath, iIndex) {
				var exception;
				// act
				try {
					oUnitUnderTest.toPositiveInteger(oInvalidQueryPath);
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
			});
		});

		it("isNullOrUndefined_nullValue_returnTrue", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefined(null);

			//assert
			expect(bReturnValue).toBe(true);
		});

		it("isNullOrUndefined_UndefinedValue_returnTrue", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefined(undefined);

			//assert
			expect(bReturnValue).toBe(true);
		});

		it("isNullOrUndefined_numberValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefined(3.0);

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isNullOrUndefined_stringValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefined("s");

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isNullOrUndefined_arrayValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefined([]);

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isNullOrUndefined_objectValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefined({});

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isNullOrUndefined_functionValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefined(function() {});

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isNullOrUndefinedOrEmpty_functionValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefinedOrEmpty('Test');

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isNullOrUndefinedOrEmpty_functionObject_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefinedOrEmpty({iProperty : 'Test'});

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isNullOrUndefinedOrEmpty_functionObject_returnTrue", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefinedOrEmpty({});

			//assert
			expect(bReturnValue).toBe(true);
		});

		it("isNullOrUndefinedOrEmpty_functionValue_returnTrue", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isNullOrUndefinedOrEmpty('');

			//assert
			expect(bReturnValue).toBe(true);
		});

		it("isPlainObject_plainObject_returnTrue", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isPlainObject({});

			//assert
			expect(bReturnValue).toBe(true);
		});

		it("isPlainObject_nullValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isPlainObject(null);

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isPlainObject_undefinedValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isPlainObject(undefined);

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isPlainObject_functionValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isPlainObject(function() {});

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isPlainObject_arrayValue_returnFalse", function() {
			// arrange  + act
			var bReturnValue = oUnitUnderTest.isPlainObject([]);

			//assert
			expect(bReturnValue).toBe(false);
		});

		it("isPlainObject_scalarValues_returnFalse", function() {
			//arrange
			var aScalarValues = [1, -1, "string", 0, true, false, 3.00];
			_.each(aScalarValues, function(scalarValue, iIndex) {
				// act
				var bReturnValue = oUnitUnderTest.isPlainObject(scalarValue);

				//assert
				expect(bReturnValue).toBe(false);
			});
		});

		it("validateAddinVersionString_invalidParameters_throwException", function() {
			//arrange
			var aInvalidAddinVersions = ['false', 'null', '1.0.2.false', '1', '1.2', '1.2.3', '1.2.3.4.5', '-1.0.2.3'];
			_.each(aInvalidAddinVersions, function(sInvalidAddinVersion, iIndex) {
				var exception;

				// act
				try {
					oUnitUnderTest.validateAddinVersionString(sInvalidAddinVersion);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oUnitUnderTest.MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
		});
		
		describe("findFirstUnusedSuffixInStringArray", () => {
			it("should find the first unused numeric suffix from a list of suffixes containing one entry", function() {
				// arrange
				var sPrefix = "name";
				var iStartSuffix = 1;
				var aNamesWithPrefix = [ "name (1)"];
				
				// act
				var result = oUnitUnderTest.findFirstUnusedSuffixInStringArray(sPrefix, iStartSuffix, aNamesWithPrefix);
				
				//assert
				expect(result).toBe(2);
			});
	
			it("should find the first unused numeric suffix from a list of suffixes containing more than 10 entries", function() {
				// arrange
				var sPrefix = "n";
				var iStartSuffix = 1;
				var aNamesWithPrefix = [ "n (1)", "n (2)", "n (3)", "n (4)", "n (5)", "n (6)", "n (7)", "n (8)", "n (9)", "n (10)"];
				
				// act
				var result = oUnitUnderTest.findFirstUnusedSuffixInStringArray(sPrefix, iStartSuffix, aNamesWithPrefix);
				
				//assert
				expect(result).toBe(11);
			});

			it("should return startSuffix + 1 if the list of suffixes is empty", function() {
				// arrange
				var sPrefix = "n";
				var iStartSuffix = 3;
				var aNamesWithPrefix = [];
				
				// act
				var result = oUnitUnderTest.findFirstUnusedSuffixInStringArray(sPrefix, iStartSuffix, aNamesWithPrefix);
				
				//assert
				expect(result).toBe(iStartSuffix + 1);
			});
		});
		
		describe("deepFreeze", () => {

			it("deep freeze object with literal values => object is frozen and returned", () => {
				// arrange
				var oToFreeze = {
					first: "FIRST",
					second: 2
				};

				// act
				var oFrozen = oUnitUnderTest.deepFreeze(oToFreeze);

				// assert
				expect(Object.isFrozen(oFrozen)).toBe(true);
				expect(oFrozen).toBe(oToFreeze);
			});
			
			it("deep freeze object frozen object => no excepiton", () => {
				// arrange
				var oToFreeze = {};

				// act
				var oFrozen = oUnitUnderTest.deepFreeze(oToFreeze);

				// assert
				expect(Object.isFrozen(oFrozen)).toBe(true);
			});
			
			it("deep freeze object with complex property values => object hierarchy is frozen", () => {
				// arrange
				var fFunction = () => {};
				var oToFreeze = {
					literal : "literal",
					complex : {
						other_literal : "other_literal"
					},
					func : fFunction
				};

				// act
				var oFrozen = oUnitUnderTest.deepFreeze(oToFreeze);

				// assert
				expect(Object.isFrozen(oFrozen)).toBe(true);
				expect(Object.isFrozen(oFrozen.complex)).toBe(true);
				expect(Object.isFrozen(oFrozen.func)).toBe(true);
				
				expect(oFrozen.complex).toBe(oToFreeze.complex);
				expect(oFrozen.func).toBe(oToFreeze.func);
			});

		});

        describe("transposeResultArrayOfObjects", () => {
            it("should return empty object for empty input", () => {
                // arrange
                const input = [];

                // act
                const result1 = oUnitUnderTest.transposeResultArrayOfObjects(input, true);
                const result2 = oUnitUnderTest.transposeResultArrayOfObjects(input, false);

                // assert
                expect(result1).toEqual({});
                expect(result2).toEqual({});
            });

            it("should transpose single object", () => {
                // arrange
                const input = [{
                    key1: "value1",
                    key2: "value2",
                    key3: 3
                }];

                // act
                const result1 = oUnitUnderTest.transposeResultArrayOfObjects(input, true);
                const result2 = oUnitUnderTest.transposeResultArrayOfObjects(input, false);

                // assert
                const expectedResult = {
                    key1: ["value1"],
                    key2: ["value2"],
                    key3: [3]
                };
                
                expect(result1).toEqual(expectedResult);
                expect(result2).toEqual(expectedResult);
            });

            it("should transpose multiple objects", () => {
                // arrange
                const input = [{
                    key1: "value11",
                    key2: "value12",
                    key3: 13
                },
                {
                    key1: "value21",
                    key2: "value22",
                    key3: 23
                },
                {
                    key1: "value31",
                    key2: "value32",
                    key3: 33
                }];

                // act
                const result1 = oUnitUnderTest.transposeResultArrayOfObjects(input, true);
                const result2 = oUnitUnderTest.transposeResultArrayOfObjects(input, false);

                // assert
                const expectedResult = {
                    key1: ["value11", "value21", "value31"],
                    key2: ["value12", "value22", "value32"],
                    key3: [13, 23, 33]
                };
                expect(result1).toEqual(expectedResult);
                expect(result2).toEqual(expectedResult);
            });
        });
        it("should transpose multiple objects, correctly handle empty columns", () => {
            // arrange
            const input = [{
                key1: null,
                key2: "value12",
                key3: 13
            },
            {
                key1: null,
                key2: "value22",
                key3: 23
            },
            {
                key1: null,
                key2: "value32",
                key3: 33
            }];

            // act
            const result1 = oUnitUnderTest.transposeResultArrayOfObjects(input, true);
            const result2 = oUnitUnderTest.transposeResultArrayOfObjects(input, false);

            // assert
            expect(result1).toEqual({
                key1: [null, null, null],
                key2: ["value12", "value22", "value32"],
                key3: [13, 23, 33]
            }); //  do not remove empty columns
            expect(result2).toEqual({
                key2: ["value12", "value22", "value32"],
                key3: [13, 23, 33]
            }); // remove empty columns  
        });

        describe("arrayBufferToString", function() {

            it("should return string from ArrayBuffer", function() {
                // arrange
                var sString = 'foobar';

                var oBuffer = new ArrayBuffer(sString.length); // 2 bytes for each char
                var oArrayBuffer = new Uint8Array(oBuffer);
                for (var i=0, strLen=sString.length; i<strLen; i++) {
                    oArrayBuffer[i] = sString.charCodeAt(i);
                }

                // act
                var sReturnValue = oUnitUnderTest.arrayBufferToString(oArrayBuffer);

                // assert
                //TODO: this comparison does not work, although the strings are equal
                expect(sReturnValue).toEqual(sString);
            });
		});
		
		describe("validatePath", function() {

            it("should return the validated path if the path string is valid", function() {
                // arrange
				const sPath = "1/2/3/4";
				
                // act
                const sValidatedPath = oUnitUnderTest.validatePath(sPath);

                // assert
                expect(sValidatedPath).toEqual(sPath);
			});

			it("should return the validated path if the path contains zero", function() {
                // arrange
				const sPath = "0";
				
                // act
                const sValidatedPath = oUnitUnderTest.validatePath(sPath);

                // assert
                expect(sValidatedPath).toEqual(sPath);
			});
			
			it("should return throw an error if the paht contains a string", function() {
                // arrange
				const sPath = "1/2A";
				
                let exception;

				// act
				try {
					oUnitUnderTest.validatePath(sPath);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oUnitUnderTest.MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return throw an error if the paht contains multiple backslashes", function() {
                // arrange
				const sPath = "1///2";
				
                let exception;

				// act
				try {
					oUnitUnderTest.validatePath(sPath);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oUnitUnderTest.MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should return throw an error if the paht contains special characters", function() {
                // arrange
				const sPath = "1/2@";
				
                let exception;

				// act
				try {
					oUnitUnderTest.validatePath(sPath);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oUnitUnderTest.MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
		});
		
		describe("hasForwardSlash", function() {

            it("should return true if the input string has a forward slash", function() {
                // arrange
				const sPath = "1/2/3/4";
                // assert
                expect(oUnitUnderTest.hasForwardSlash(sPath)).toBe(true);
			});

			it("should return false if the input string doesn't contain a forward slash", function() {
                // arrange
				const sPath = "0";

                // assert
                expect(oUnitUnderTest.hasForwardSlash(sPath)).toBe(false);
			});
		});
		
		describe("getEntityIdFromPath", function() {

            it("should return the number after the last forward slash", function() {
				// arrange
				const iNumber = 4;
				const sPath = `1/2/3/${iNumber}`;
                // assert
                expect(oUnitUnderTest.getEntityIdFromPath(sPath)).toBe(iNumber);
			});

			it("should return the number after the last forward slash having a long test integer", function() {
				// arrange
				const iNumber = 58755;
				const sPath = `1/2/3/${iNumber}`;
                // assert
                expect(oUnitUnderTest.getEntityIdFromPath(sPath)).toBe(iNumber);
			});

			it("should return 0 if the input string doesn't contain a forward slash", function() {
                // arrange
				const sPath = "0";

                // assert
                expect(oUnitUnderTest.getEntityIdFromPath(sPath)).toBe(0);
			});
        });

	}).addTags(["All_Unit_Tests"]);
}