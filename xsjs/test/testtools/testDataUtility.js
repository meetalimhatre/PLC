const _ = require("lodash");

/**
 * This constructs a utility for test data. It provides the most prominent utility functions to modify test data as currently used in our tests. 
 * 
 * This class applies the Builder pattern and allows step-by-step modifications of an initial set of test data. Where ever it makes sense the provided functions
 * support function chaining for a good usability (see example below).
 * 
 * In general the utility can be used for every test data encapsulated within an object. However, there are special functions that are only applicable if the test
 * data is structure as an object with value arrays ({ property : [1,2,3]}), as used quite often to arrange data for data base tables. See the function documentation
 * to find out if a function is applicable for your current case.
 *  
 * @constructor
 * @param  {object} oInitialData 	The inital set of test data that is then modified by the builder with the provided functions. If you want to get the result of the 
 * 									the data modification call build()
 * 
 * @see {@link https://en.wikipedia.org/wiki/Builder_pattern}
 * 
 * @example <caption>How to use the TestDataUtility</caption>
 *	var TestDataUtility = require("../testtools/testDataUtility").TestDataUtility;
 *	//...
 *
 *	// instantiate the object and modify the input data; 
 *	// NOTE: method chaining can be used to have this modification in a concise matter
 *	var util = new TestDataUtility(oInputData)
 *									.addProperty("prop", [1,2,3])
 *									.addProperty("another_prop", [4,5,6])
 *									.deleteProperty("prop")
 *									.extend({
 *										"extension" : value
 *										//...
 *									});
 *	var oFirstObject = util.getObject(0);
 *	// assuming you only have value arrays as property values in iInputData, you can get the values inside those arrays with these functions:
 *	var aFirstTwoObjects  = util.getObjects([0,1]);
 *	var aAllObjects = util.getObjects();
 *	var iValueCount = util.getObjectCount();
 *
 *	// finally, build the test data object; this can be passed to mockstar; 
 *	// ATTENTION: every modification on oDeepClonedTestData is independent from the builder object; calling .build() again will return a completely new object with the same configuration
 *	var oDeepClonedTestData = util.build();
 * 
 * 
 * @see {@link testtools/testDataUtility.tests.xsjslib} for further usage examples.
 */
function TestDataUtility(oInitialData) {

	var mData;

	var initialize = function() {
		if (!oInitialData || !_.isObject(oInitialData)) {
			throw new Error("parameter needs to be an object");
		}
		mData = _.cloneDeep(oInitialData);
	};


	/**	
	 * Returns a copy of the current test data state. Every time test data is needed this method should be used. Any modification to the test data made by the 
	 * Builder subsequent to calling this function does not modify the returned object. Hence, every time this method is called a completely new object is 
	 * return, independent to all previously built objects.
	 * 	 
	 * @return {any}  A copy of the current test data state.	 
	 */
	this.build = function() {
		// deep cloning here ensures that maniplulation made by clients on the returned object, does not effect the 
		// internal state of mData
		return _.cloneDeep(mData);
	};

	/**	
	 * - This function can only be called if the maintained test data object contains only value arrays as property values! -
	 * 
	 * Creates an object with all properties of the test data. As value for each property the entry inside the value array of the test data with the specified 
	 * index is used.
	 * 	 
	 * @param  {integer} iIndex Index of the values for which the object shall be created.
	 * @return {object}  Object containing the properties of the test data and the values of
	 * @throws If the maintained test data object does not only contains value arrays.
	 * @throws If the given index is out of bounds for a value array of the test data object.
	 */
	this.getObject = function(iIndex) {
		if (containsOnlyValueArrays(mData) === false) {
			throw new Error("function is only applicable if the given data object only contains value arrays");
		}
		
		const oObject = {};
		_.each(mData, function(aValues, sProperty) {
			if (aValues.length - 1 < iIndex) {
				throw new Error(`given index is out of bounds for value array of property ${sProperty}`);
			}
			oObject[sProperty] = aValues[iIndex];
		});

		return oObject;
	};
	
	
	/**	
	 * Helper function to facilitate "function overloading". For some functions, such as getObjects or pickValues,
	 * a predicate function or an array of indicies can be passed. This function creates a iteratee function based
	 * on the passed argument, so that client function can use this iteratee in a harmonized way.
	 * 
	 * Use of function expression in favor of function declaration, because this does not rebind this.
	 */	 
	const _getIteratee = (vParam) => {
		const iObjectCount = this.getObjectCount();
		let fIteratee = null;
		if (_.isFunction(vParam)) {
			fIteratee = vParam;
		} else if (_.isArray(vParam)) {
			// in case the parameter is an array containing the indicies, the iteratee is constructed as function, 
			// that returns true if the index of the object is in the array 
			fIteratee = (oObject, iIndex) => vParam.indexOf(iIndex) > -1;
		} else if (vParam === undefined) {
			// in case the parameter is not provided at all, all objects shall be returned; in this case the iteratee
			// function returns true for every index until it exceeded the object count 
			fIteratee = (oObject, iIndex) => iIndex < iObjectCount;
		} else {
			throw new Error(`unknown parameter type ${typeof vParam}`);
		}
		return fIteratee;
	}

	/**	
	 * - This function can only be called if the maintained test data object contains only value arrays as property values! -
	 * 
	 * Similar to {@link this.getObject} but you can specify an array of indicies or a predicate function to select the plain objects 
	 * from the input data. If no parameter is provided all values of the value arrays are transformed to objects and returned.
	 * 	 
	 * @param  {function|array} [vParam] Optional parameter. If it's not provided the function will create an create an array of objects with all 
	 * 							  values in the value arrays. If it is provided the parameter must either be an array containing indicies of values
	 * 							  or a predicate function. The predicate function is called for every value in the value array and gets the object
	 * 							  for the current values and the index as parameters. It must return true if the object passes the test and false 
	 * 							  otherwise.
	 * @return {array}  Array of objects with the values of the specified indicies or which pass the predicate function.
	 * @throws If the maintained test data object does not only contains value arrays.
	 * @throws If one of the given indicies is out of bounds for a value array of the test data object.
	 */
	this.getObjects = function(vParam) {
		if (containsOnlyValueArrays(mData) === false) {
			throw new Error("function is only applicable if the given data object only contains value arrays");
		}

		const iObjectCount = this.getObjectCount();
		// this is handling the "function overload"; 
		const fIteratee = _getIteratee(vParam);
		var aObjects = [];
		for (var i = 0; i < iObjectCount; i++) {
			const oObject = this.getObject(i);
			if(fIteratee(oObject, i) === true){
				aObjects.push(oObject);
			}	
		}
		return aObjects;
	};

	/**	
	 * - This function can only be called if the maintained test data object contains only value arrays as property values! -
	 * 
	 * Similar to {@link this.getObjects}, but you don't get the value arrays transposed into objects. The returned object still has 
	 * value arrays, whereas only values are present that passes the provided predicate function or are at a certain index.
	 * 	 
	 * @param  {function|array} [vParam] Optional parameter. If it's not provided the function will all values in the value arrays. If it is 
	 * 							  provided the parameter must either be an array containing indicies of values  or a predicate function. The 
	 * 							  predicate function is called for every value in the value array and gets the object for the current values 
	 * 							  and the index as parameters. It must return true if the object passes the test and false otherwise.
	 * @return {object} An new object with the same properties of the input data, but each properties' value array only contains 
	 *                  the values at the specified indicies for values which pass the predicate function.	 
	 * @throws If the maintained test data object does not only contains value arrays.
	 * @throws If one of the given indicies is out of bounds for a value array of the test data object.
	 */
	this.pickValues = function(vParam) {
		if (containsOnlyValueArrays(mData) === false) {
			throw new Error("function is only applicable if the given data object only contains value arrays");
		}
		
		// this is handling the "function overload"; 
		const fIteratee = _getIteratee(vParam);
		const oReturnObject = {};
		const aObjects = this.getObjects();
		aObjects.forEach((oObject, iIndex) => {
			if(fIteratee(oObject, iIndex)) {
				_.each(oObject, (vValue, sKey) => {
					if(!_.has(oReturnObject, sKey)){
						oReturnObject[sKey] = [];
					}
					oReturnObject[sKey].push(vValue);
				});
			}
		});
		return oReturnObject;
	}

	/**	
	 * - This function can only be called if the maintained test data object contains only value arrays as property values! -
	 * 
	 * Count the number of values inside the value arrays. This is similiar to count the number of records or number of rows 
	 * in the test data set. 
	 * 
	 * @return {integer}  Number of values inside of the value arrays.
	 * @throws If the maintained test data object does not only contains value arrays.
	 * @throws If one of the value arrays have a different length than the others
	 */
	this.getObjectCount = function() {
		if (containsOnlyValueArrays(mData) === false) {
			throw new Error("function is only applicable if the given data object only contains value arrays");
		}

		var sPropertyWithDifferentArrayLength = valueArraysHaveSameSize(mData);
		if (sPropertyWithDifferentArrayLength !== undefined) {
			throw new Error(`length of the value array for the following property is different to the length of the other arrays: ${sPropertyWithDifferentArrayLength}`);
		}
		return _.values(mData)[0].length;
	};

	/**	
	 * - This function can only be called if the maintained test data object contains only value arrays as property values! -
	 * 
	 * Adds an set of values to each value arrays of the maintained test data. The provided object must have the same properties as the test data. 
	 * 
	 * @return {Builder}  The builder itself to enable method chaining
	 * @throws If the maintained test data object does not only contains value arrays.
	 * @throws If the provided object does not have the same properties as the maintained test data.
	 */
	this.addObject = function(oValues) {
		if (containsOnlyValueArrays(mData) === false) {
			throw new Error("function is only applicable if the given data object only contains value arrays");
		}

		if (haveSameProperties(mData, oValues) === false) {
			throw new Error("objects with the values to add must have the same properties as the object with value arrays");
		}

		_.each(mData, function(aValues, sProperty) {
			aValues.push(oValues[sProperty]);
		});

		return this;
	};

	/**	
	 * - This function can only be called if the maintained test data object contains only value arrays as property values! -
	 * 
	 * Removes all values with the specified index from each value array.
	 * 
	 * @return {Builder}  The builder itself to enable method chaining
	 * @throws If the maintained test data object does not only contains value arrays.
	 * @throws If the given index is out of bounds for any value array.
	 */
	this.deleteObject = function(iIndex) {
		if (containsOnlyValueArrays(mData) === false) {
			throw new Error("function is only applicable if the given data object only contains value arrays");
		}

		_.each(mData, function(aValues, sProperty) {
			if (aValues.length - 1 < iIndex) {
				throw new Error(`given index is out of bounds for value array of property ${sProperty}`);
			}
			// splice = remove 1 element in the array at the given index
			aValues.splice(iIndex, 1);
		});

		return this;
	};

	/**	
	 * Adds a property with a value to the test data object.
	 * 	 
	 * @param  {string} sProperty Name of the property to add.	 
	 * @param  {any} vValue    Value of the property to add.	 
	 * @return {Builder}  The builder itself to enable method chaining.
	 */
	this.addProperty = function(sProperty, vValue) {
		if (_.has(mData, sProperty)) {
			throw new Error(`the given property already exists in the test data object: ${sProperty}`);
		}
		mData[sProperty] = vValue;

		return this;
	};

	/**	
	 * Replaces the value for a property in the test data object.
	 * 	 
	 * @param  {string} sProperty Name of the property for which the values are replaced.	 
	 * @param  {any} vValue    The new value	 
	 * @return {Builder}  The builder itself to enable method chaining.
	 */
	this.replaceValue = function(sProperty, vValue) {
		if (!_.has(mData, sProperty)) {
			throw new Error(`the given property does not exists in the test data object: ${sProperty}`);
		}
		mData[sProperty] = vValue;

		return this;
	};

	/**	
	 * Extends the test dat object with the given object. Can be used to add multiple properties with values to the test data. If the extension object provides
	 * a property that already exists in the current data set, this property is replaced in the data set. Hence, you can use this function to modify data in 
	 * the data set.
	 * 	 
	 * @param  {type} oExtension Object which extends the test data.	 
	 * @return {Builder}  The builder itself to enable method chaining.
	 */
	this.extend = function(oExtension) {
		_.extend(mData, oExtension);
		return this;
	};


	/**	
	 * Deletes a specified property with all it's values from the test data
	 * 	 
	 * @param  {type} sPropertyName Name of the property to delete.	 
	 * @return {Builder}  The builder itself to enable method chaining.
	 * @throws The specified property does not exist in the test data
	 */
	this.deleteProperty = function(sPropertyName) {
		if (_.has(mData, sPropertyName) === false) {
			throw new Error(`the following property cannot be deleted because it is unknown: ${sPropertyName}`);
		}
		delete mData[sPropertyName];
		return this;
	};

	function containsOnlyValueArrays(oObject) {
		return _.every(oObject, function(aValues) {
			return _.isArray(aValues);
		});
	}

	function haveSameProperties(oFirst, oSecond) {
		var aPropertiesFirst = _.keys(oFirst);
		var aPropertiesSecond = _.keys(oSecond);

		// _.difference only checks which values in the first are not present in the second array; 
		// => additional values in the second array are not detected; => make a second call and exchange
		// arguments to ensure the arrays contain the same values
		return _.difference(aPropertiesFirst, aPropertiesSecond).length === 0 &&
			_.difference(aPropertiesSecond, aPropertiesFirst).length === 0;
	}


	/**		
	 * Utility to check if all value arrays have the same length.	
	 * 
	 * @param  {object} oData Object with the value arrays	 
	 * @return {string|undefined} Returns undefined if all value arrays have the same length. Return the name of the last property with a different length if there is any.
	 */
	function valueArraysHaveSameSize(oData) {
		var iCount = -1;
		var sPropertyWithInvalidArrayLength = undefined;
		_.each(oData, function(aValues, sProperty) {
			if (iCount === -1) {
				iCount = aValues.length;
			}
			if (iCount !== aValues.length) {
				sPropertyWithInvalidArrayLength = sProperty;
			}
		});
		return sPropertyWithInvalidArrayLength;
	}

	initialize.call(this);

}
TestDataUtility.prototype = Object.create(TestDataUtility.prototype);
TestDataUtility.prototype.constructor = TestDataUtility;

module.exports = {
    TestDataUtility
};
