const _               = require("lodash");
const TestDataUtility = require("../testtools/testDataUtility").TestDataUtility;

describe("plc_test.testtools.testDataUtility.xsjslib", function() {

	/**	
	 * Utility function that checks if the function under test is returning the builder instance correctly 
	 * in order to enable function chaning. 
	 * 	 
	 * @param  {object} oBuilderInput - Parameter for the Builder constructor 
	 * @param  {string} sFunctionName - Name of the function under test 
	 * @param  {array} aParameters   - Parameters of the function as an array	 
	 */
	function runMethodChainingTest(oBuilderInput, sFunctionName, aParameters) {
		var oBuilder = new TestDataUtility(oBuilderInput);
		// it's important to set the value of "this" correctly; it must be set the builder object, so that the this is 
		// correctly set inside of the bulder object
		var oReturnedBuilder = oBuilder[sFunctionName].apply(oBuilder, aParameters);

		expect(oReturnedBuilder).toBe(oBuilder);
	}

	describe("build", function() {
		var oInputData = {
			anInteger: 1,
			aBool: true,
			aString: "string",
			aDate: new Date(),
			anArray: [1, 2, 3],
			anArrayWithObject: [{
				anInteger: 4
			}],
			anObject: {
				anInteger: 2,
				anArray: [1, 2, 3],
				aNestedObject: {
					anInteger: 3
				}
			}
		}

		it("should return a new object with the same contents of passed base", function() {
			//act
			// instanciate an builder object, which wrapps the oBaseData; call build to create a new test data object
			var oCreatedTestData = new TestDataUtility(oInputData).build();

			// assert
			// check the oBaseData and oCreatedTestData are not the same objects, since builder should only provide copies,
			// to avoid data maniplulation of the input data by tests
			expect(oInputData === oCreatedTestData).toBe(false);
			// check if both objects are semantically the same (have the same properties and values)
			expect(oInputData).toEqual(oCreatedTestData);
		});

		it("should return 2 independent objects with the same contents if build is called 2 times", function() {
			// arrange
			// create a builder instance, which is used 2 times to build test data
			var oBuilder = new TestDataUtility(oInputData);

			//act
			var oFirstTestData = oBuilder.build();
			var oSecondTestData = oBuilder.build();

			//assert
			expect(oFirstTestData === oSecondTestData).toBe(false);
			expect(oFirstTestData).toEqual(oSecondTestData);
		});

		it("should create a new array with the same primitive values for properties referencing an array", function() {
			// act
			var oBuildTestData = new TestDataUtility(oInputData).build();

			// assert
			expect(oInputData.anArray === oBuildTestData.anArray).toBe(false);
			expect(oBuildTestData.anArray).toEqual(oInputData.anArray);
		});

		it("should not manipulate the original array if a value was pushed to the build array", function() {
			// act
			var oBuildTestData = new TestDataUtility(oInputData).build();
			// modifying the built array; this should not modify the original array
			var sPushedValue = "only in built array";
			oBuildTestData.anArray.push(sPushedValue)

			// assert
			expect(oInputData.anArray).not.toContain(sPushedValue);
		});

		it("should create a clone for an object inside of an array", function() {
			// act
			var oBuildTestData = new TestDataUtility(oInputData).build();

			// assert
			// the cloned array should contain a new object; the reference to the object in the original array must be different to the reference 
			// in the built array
			expect(oInputData.anArrayWithObject === oBuildTestData.anArrayWithObject).toBe(false);
			// however contents of the object must be the same
			expect(oBuildTestData.anArrayWithObject).toEqual(oInputData.anArrayWithObject);
		});

		it("should create new date objects which represent the same timestamp", function() {
			// act
			var oBuildTestData = new TestDataUtility(oInputData).build();

			// assert
			expect(oInputData.aDate === oBuildTestData.aDate).toBe(false);
			expect(oBuildTestData.aDate).toEqual(oInputData.aDate);
		});

		it("should create new object with the same contents for properties referencing an object", function() {
			// act
			var oBuildTestData = new TestDataUtility(oInputData).build();

			// assert
			expect(oInputData.anObject === oBuildTestData.anObject).toBe(false);
			expect(oBuildTestData.anObject).toEqual(oInputData.anObject);
		});

		it("should not manipulate original object if property of nested object is modified", function() {
			// act
			var oBuildTestData = new TestDataUtility(oInputData).build();
			oBuildTestData.anObject.newProperty = "newProperty";

			// assert
			expect(oInputData.anObject).not.toEqual(oBuildTestData.anObject);
			// check if the original object does not have the new property added to the built object 
			expect(_.has(oInputData.anObject, ["newProperty"])).toBe(false);
		});

		it("should create new nested objects with the same contents for nested objects", function() {
			// act
			var oBuildTestData = new TestDataUtility(oInputData).build();

			// assert
			expect(oInputData.anObject.aNestedObject === oBuildTestData.anObject.aNestedObject).toBe(false);
			expect(oBuildTestData.anObject.aNestedObject).toEqual(oInputData.anObject.aNestedObject);
		});
	});

	describe("tests for value array-based objects", function() {

		var oInputData = {
			firstProperty: [1, 2, 3],
			secondProperty: ["foo", "bar", null],
			thirdPropery: [new Date(), null, null]
		};

		function checkObjectPropertyValues(oValueArrayObject, iValueIndex, oObjectToCheck) {
			expect(oObjectToCheck).toBeDefined();

			jasmine.log("Checking if both objects have the same properties");
			// sorting is necessary because a different order in the array would lead to test fail
			var aInputProperties = _.keys(oValueArrayObject).sort();
			var aOutputProperties = _.keys(oObjectToCheck).sort();
			expect(aOutputProperties).toEqual(aInputProperties);

			// iterate over all properties of the object to check (oObjectToCheck); each property value must correspond to the 
			// value stored in the object with value arrays (oValueArrayObject) for the specified index
			_.each(oObjectToCheck, function(vObjectToCheckPropValue, sProperty) {
				var vValueArrayValue = oValueArrayObject[sProperty][iValueIndex];
				jasmine.log(`Checking property value for ${sProperty}: is ${vObjectToCheckPropValue} and should be ${vValueArrayValue}.`);
				expect(vObjectToCheckPropValue).toEqual(vValueArrayValue);
			});
		}

		function runInvalidInputDataTest(sFunctionName, aParameters) {
			// arrange
			// pass a data object to the builder that does not have values array for all properties			
			var oBuilder = new TestDataUtility({
				firstProperty: [1, 2, 3],
				invalidProperty: "foo bar"
			})
            let exception = null;
			// act
			try {
				// calls the specified function with the given parameter array
				oBuilder[sFunctionName].apply(this, aParameters);
            } catch (e) {
			    exception = e;
			} finally {
				// assert
				expect(exception).not.toBe(null);
			}
		}

		function runIndexOutOfBoundsTest(oValueArrayObject, sFunctionName, vFunctionParameter) {
			// arrange
			// if no parameter for the function to test is provided, the array length of the first value array is used;
			// the length of it is already out of bounds since getObject works 0-based; using the length is also an edge case,
			// since it's the first value outside the boundaries
			vFunctionParameter = vFunctionParameter || _.values(oValueArrayObject)[0].length;

			// just checking if the function is throwing anything to indicate the error; since Builder is a test utility this is considered to enough; no need 
			// for a specific error
			let exception = null;
        	// act
			try {
				new TestDataUtility(oValueArrayObject)[sFunctionName].apply(this, [vFunctionParameter]);
            } catch (e) {
			    exception = e;
			} finally {
				// assert
				expect(exception).not.toBe(null);
			}
		}

		describe("getObject", function() {

			it("should return an object only with the first values from the array", function() {
				// arrange
				var iIndex = 0;

				// act
				var oFirstObject = new TestDataUtility(oInputData).getObject(iIndex);

				// assert
				checkObjectPropertyValues(oInputData, iIndex, oFirstObject);

			});

			it("should throw an error if the given index is out bounds for the value arrays", function() {
				runIndexOutOfBoundsTest(oInputData, "getObject");
			});

			it("should throw an error if the input data is not object with value arrays for all properties", function() {
				runInvalidInputDataTest("getObject", [0]);
			});
		});

		describe("getObjects", function() {

			it("should return an array of objects with objects for the entire data set if no indicies parameter is provided", function() {
				// arrange
				var oBuilder = new TestDataUtility(oInputData);

				// act
				var aObjects = oBuilder.getObjects();

				// assert
				expect(aObjects).toBeDefined();

				// expect that the returned array has the same length than first value array of the input data; this shall ensure that
				// no values are forgotten; it's necessary because the subsequent checks iterate over the returned array
				expect(aObjects.length).toEqual(_.values(oInputData)[0].length);

				// iterate over all objects in the returned array; iterate over all properties of each object and check if the property value
				// is equal to the value in the array of input data for this index
				_.each(aObjects, function(oObject, iIndex) {
					jasmine.log("Checking property values for object with index " + iIndex);
					checkObjectPropertyValues(oInputData, iIndex, oObject);
				});
			});
			
			it("should return an array of objects containing property values from the value arrays for the specified indicies in the correct order", function() {
				// arrange
				var aIndices = [0, 1];

				// act
				var aObjects = new TestDataUtility(oInputData).getObjects(aIndices);

				// assert
				_.each(aIndices, function(iIndex) {
					jasmine.log("Checking property values for object with index " + iIndex);
					checkObjectPropertyValues(oInputData, iIndex, aObjects[iIndex]);
				});
			});
			
			it("should call predicate function for each property value in the values arrays", () => {
				// arrange
				// should return first 2 value objects with this predicate
				const fPredicate = jasmine.createSpy("predicate").and.returnValue(false);
				
				// act
				new TestDataUtility(oInputData).getObjects(fPredicate);
				
				// assert
				expect(fPredicate.calls.count()).toEqual(oInputData.firstProperty.length);
			});

			it("should return array of objecs passing the condition of the predicate function", () => {
				// arrange
				// should return first 2 value objects with this predicate
				const fPredicate = (oObject, iIndex) => oObject.firstProperty < 3;
				var aExpectedIndices = [0, 1];
				
				// act
				var aObjects = new TestDataUtility(oInputData).getObjects(fPredicate);
				
				// assert
				_.each(aExpectedIndices, function(iIndex) {
					jasmine.log("Checking property values for object with index " + iIndex);
					checkObjectPropertyValues(oInputData, iIndex, aObjects[iIndex]);
				});
			});

			it("should throw an error argument is neigher array nor function", function() {
				// arrange
				let exception = null;
            	// act
				try {
					new TestDataUtility(oValueArrayObject).getObjects({});
                } catch (e) {
				    exception = e;
				} finally {
					// assert
					expect(exception).not.toBe(null);
				}
			});

			it("should throw an error if one given index is out bounds for the value arrays", function() {
				// arrange
				var iLength = _.values(oInputData)[0].length;

				runIndexOutOfBoundsTest(oInputData, "getObjects", [1, 2, iLength]);
			});

			it("should throw an error if the input data is not object with value arrays for all properties", function() {
				runInvalidInputDataTest("getObjects", [[0, 1]]);
			});		
		});
        
        describe("pickValues", () =>{
            
            it("should return only the values of the specified indicies from the input data", () => {
				// arrange
				let oBuilder = new TestDataUtility(oInputData);
				let oExpectedData = {
					firstProperty: [2, 3],
					secondProperty: ["bar", null],
					thirdPropery: [null, null]
				};

				// act
				var oPickedValues = oBuilder.pickValues([1,2]);

				// assert
				expect(oPickedValues).toEqualObject(oExpectedData);
			});
			
			it("should return only the values of data passing the condition of the predicate function", () => {
				// arrange
				const fPredicate = (oObject, iIndex) => oObject.firstProperty > 1;
				let oExpectedData = {
					firstProperty: [2, 3],
					secondProperty: ["bar", null],
					thirdPropery: [null, null]
				};

				// act
				var oPickedValues = new TestDataUtility(oInputData).pickValues(fPredicate);

				// assert
				expect(oPickedValues).toEqualObject(oExpectedData);
			});
            
            it("should throw an error if one given index is out bounds for the value arrays", () => {
                // arrange
                var iLength = _.values(oInputData)[0].length;

                runIndexOutOfBoundsTest(oInputData, "pickValues", [1, 2, iLength]);
            });

            it("should throw an error if the input data is not object with value arrays for all properties", () => {
                runInvalidInputDataTest("pickValues", [[0, 1]]);
            });		
        });

		describe("getObjectCount", function() {

			it("should return lenght of the value arrays of the input object", function() {
				// arrange
				var iExpectedLength = oInputData.firstProperty.length;

				// act 
				var iReceivedLength = new TestDataUtility(oInputData).getObjectCount();

				// assert
				expect(iReceivedLength).toEqual(iExpectedLength);
			});

			it("should throw an exception if the value arrays of the test data have different length", function() {
				// arrange
				var oInvalidInputData = _.extend({}, oInputData, {
					invalid: [1, 2]
				});
				let exception = null;
            	// act
				try {
					new TestDataUtility(oInvalidInputData).getObjectCount();
                } catch (e) {
				    exception = e;
				} finally {
					// assert
					expect(exception).not.toBe(null);
				}
			});

			it("should throw an error if the input data is not object with value arrays for all properties", function() {
				runInvalidInputDataTest("getObjectCount", []);
			});
		});

		describe("addObject", function() {

			var oObjectsToAdd = {
				firstProperty: 4,
				secondProperty: "new",
				thirdPropery: new Date()
			};

			it("should add the values of the given object to the input data of the builder", function() {
				// act
				// construction of the builder; the test will make use also of other functions of the builder in order to check if addObject is working correctly
				var oBuilder = new TestDataUtility(oInputData);
				// the current length of the input data value arrays; this made to make this test adaptable to test data changes later on
				var iObjectCount = _.values(oInputData)[0].length;
				// now add the object values to the end of the input data 
				oBuilder.addObject(oObjectsToAdd);
				// get the object added before to the data to compare; should have the same values as oObjectsToAdd; since getObject is 0-based, iObjectCount
				// is already the index of the newly added object
				var oAddedObjectValues = oBuilder.getObject(iObjectCount);

				// assert
				expect(oAddedObjectValues).toEqual(oObjectsToAdd);
			});

			it("should return the builder object to enable methodn chaining", function() {
				runMethodChainingTest(oInputData, "addObject", [oObjectsToAdd]);
			});

			it("should throw an exception if object to add contains an unknown property to the input data of the builder", function() {
				// arrange
				var oInvalidObjectToAdd = {
					firstProperty: 4,
					secondProperty: "new",
					thirdPropery: new Date(),
					additionalProperty: "invalid!"
				}
				let exception = null;
            	// act
				try {
					new TestDataUtility(oInputData).addObject(oInvalidObjectToAdd);
                } catch (e) {
				    exception = e;
				} finally {
					// assert
					expect(exception).not.toBe(null);
				}
			});

			it("should throw an exception if object to add lacks a property of the input data of the builder", function() {
				// arrange
				var oInvalidObjectToAdd = {
					firstProperty: 4,
					secondProperty: "new" // missing thridProperty => invalid
				}
                let exception = null;
            	// act
				try {
					new TestDataUtility(oInputData).addObject(oInvalidObjectToAdd);
                } catch (e) {
				    exception = e;
				} finally {
					// assert
					expect(exception).not.toBe(null);
				}
			});

			it("should throw an error if the input data is not object with value arrays for all properties", function() {
				runInvalidInputDataTest("addObject", []);
			});


		});

		describe("deleteObject", function() {

			it("should delete the values for the specified index in the input data of the builder", function() {
				// act
				var oBuilder = new TestDataUtility(oInputData);
				oBuilder.deleteObject(0);
				var oBuiltData = oBuilder.build();

				// assert
				// assert that input and output object have the same properties
				var oInputProperties = _.keys(oInputData);
				var oBuiltDataProperties = _.keys(oBuiltData);
				expect(oBuiltDataProperties).toEqual(oInputProperties);

				// iterate over all properties of the returned object and check if exsiting value still match; since only the first 
				// values were removed, we can just offset the index (iIndex + 1) to make this comparision
				_.each(oBuiltData, function(aValues, sProperty) {
					_.each(aValues, function(vValue, iIndex) {
						expect(vValue).toEqual(oInputData[sProperty][iIndex + 1]);
					});
				});
			});

			it("should return the builder object to enable methodn chaining", function() {
				runMethodChainingTest(oInputData, "deleteObject", [0]);
			});

			it("should throw an error if one given index is out bounds for the value arrays", function() {
				runIndexOutOfBoundsTest(oInputData, "deleteObject");
			});

			it("should throw an error if the input data is not object with value arrays for all properties", function() {
				runInvalidInputDataTest("deleteObject", []);
			});
		});
	});

	describe("addProperty", function() {

		var oInput = {
			initialProperty: "initial"
		};

		it("should add the specified property to input data so that is part of the returned object after calling build", function() {
			// arrange 
			var oBuilder = new TestDataUtility(oInput);
			var oExpectedOutput = _.extend({}, oInput, {
				addedProperty: "added"
			})

			// act
			oBuilder.addProperty("addedProperty", "added");
			var oOutput = oBuilder.build();

			// assert
			expect(oOutput).toEqual(oExpectedOutput);
		});

		it("should throw an exception if it tried to add an existing property", function() {
            let exception = null;
        	// act
			try {
				new TestDataUtility(oInput).addProperty("initialProperty", "value");
            } catch (e) {
			    exception = e;
			} finally {
				// assert
				expect(exception).not.toBe(null);
			}
		});

		it("should return the builder object to enable method chaining", function() {
			runMethodChainingTest(oInput, "replaceValue", ["initialProperty", "changed"]);
		});

		it("should not modify the input data object", function() {
			// arrange 
			var oBuilder = new TestDataUtility(oInput);

			// act
			oBuilder.replaceValue("initialProperty", "changed");

			// assert
			expect(oInput).not.toEqual(jasmine.objectContaining({
				initialProperty: "changed"
			}));
		});
	});
	
	describe("replaceValue", function() {

		var oInput = {
			initialProperty: "initial"
		};

		it("should replace the specified property in input data", function() {
			// arrange 
			var oBuilder = new TestDataUtility(oInput);
			var oExpectedOutput = _.extend({}, oInput, {
				initialProperty: "changed"
			})

			// act
			oBuilder.replaceValue("initialProperty", "changed");
			var oOutput = oBuilder.build();

			// assert
			expect(oOutput).toEqual(oExpectedOutput);
		});

		it("should throw an exception if it tried to replace a non-existing property", function() {
		    let exception = null;
        	// act
			try {
				new TestDataUtility({}).replaceValue("initialProperty", "value");
            } catch (e) {
			    exception = e;
			} finally {
				// assert
				expect(exception).not.toBe(null);
			}
		});

		it("should return the builder object to enable methodn chaining", function() {
			runMethodChainingTest(oInput, "addProperty", ["addedProperty", "added"]);
		});

		it("should not modify the input data object", function() {
			// arrange 
			var oBuilder = new TestDataUtility(oInput);

			// act
			oBuilder.addProperty("addedProperty", "added");

			// assert
			expect(oInput).not.toEqual(jasmine.objectContaining({
				addedProperty: "added"
			}));
		});
	});

	describe("deleteProperty", function() {
		var oInput = {
			firstProperty: "first",
			secondProperty: "second"
		};

		it("should delete the specified property from input data so that is not part of the returned object after calling build", function() {
			// arrange
			var oBuilder = new TestDataUtility(oInput);

			// act
			oBuilder.deleteProperty("firstProperty");
			var oOutput = oBuilder.build();

			// assert 
			expect(oOutput).toEqual({
				secondProperty: "second"
			});
		});

		it("should return the builder object to enable methodn chaining", function() {
			runMethodChainingTest(oInput, "deleteProperty", ["firstProperty"]);
		});

		it("should throw an exception if the property to be deleted does not exist", function() {
		    let exception = null;
        	// act
			try {
				new TestDataUtility(oInput).deleteProperty("unknownProperty");
            } catch (e) {
			    exception = e;
			} finally {
				// assert
				expect(exception).not.toBe(null);
			}
		});

		it("should not modify the input data object", function() {
			// arrange 
			var oOriginalInput = _.clone(oInput);
			var oBuilder = new TestDataUtility(oInput);

			// act
			oBuilder.deleteProperty("firstProperty");

			// assert
			expect(oInput).toEqual(oOriginalInput);
		});

	});

	describe("extend", function() {

		var oInput = {
			initialProperty: "initial"
		};

		var oExtension = {
			addedProperty: "added"
		};

		it("should extend input data with given extension object so that a combination of both objects is return by calling build", function() {
			// arrange 
			var oBuilder = new TestDataUtility(oInput);
			var oExpectedOutput = _.extend({}, oInput, oExtension);

			// act
			oBuilder.extend(oExtension);
			var oOutput = oBuilder.build();

			// assert
			expect(oOutput).toEqual(oExpectedOutput);
		});

		it("should return the builder object to enable methodn chaining", function() {
			runMethodChainingTest(oInput, "extend", [oExtension]);
		});

		it("should not modify the input data object", function() {
			// arrange 
			var oBuilder = new TestDataUtility(oInput);

			// act
			oBuilder.extend(oExtension);

			// assert
			expect(oInput).not.toEqual(jasmine.objectContaining(oExtension));
		});
	});
}).addTags(["All_Unit_Tests"]);