const _ = require("lodash");

/**
 * This library is the collection of helpers that can be used in mockstar tests and that have not been integrated into
 * the main mockstar functionality.
 */

/**
 * Build Http request from given URL parameters, http method and request body
 */

function buildRequest(sQueryPath, params, iHttpMethod, oBody) {
	// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
	params.get = function (sArgument) {
		var oSearchedParam = _.find(params, function (oParam) {
			return sArgument === oParam.name
		});

		return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
	};

	var oRequest = {
		queryPath: sQueryPath,
		method: iHttpMethod,
		parameters: params,
		body: oBody
	};
	return oRequest;
}

/**
 * Retrieves the row count of a given table (sTableId), as it is defined in mockstar.
 *
 * The second way to call the function is to additionally give the where statement, so that row counts are retrieved for
 * the given statement.
 */
function getRowCount(oMockstar, sTableId, sWhereStatement) {
	expect(oMockstar).toBeDefined();
	expect(sTableId).toBeDefined();
	expect(sTableId).not.toEqual("");

	var result = null;
	if (sWhereStatement === undefined) {
		result = oMockstar.execQuery("SELECT COUNT(*) AS COUNT FROM {{" + sTableId + "}}");
	} else {
		result = oMockstar.execQuery("SELECT COUNT(*) AS COUNT FROM {{" + sTableId + "}} WHERE " + sWhereStatement);
	}

	expect(result).toBeDefined;
	return parseInt(result.columns.COUNT.rows[0].toString(), 10);
}

function checkRowCount(oMockstar, iExpectedCount, sTableId, iCalculationVersionId, sSessionId) {
	expect(iExpectedCount).toBeDefined();
	expect(iExpectedCount).toBeGreaterThan(-1);
	expect(sTableId).toBeDefined();
	expect(sTableId).not.toEqual("");

	var result = null;
	if (iCalculationVersionId === undefined || sSessionId === undefined) {
		result = oMockstar.execQuery("SELECT COUNT(*) AS COUNT FROM {{" + sTableId + "}}");
	} else {
		result = oMockstar.execQuery("SELECT COUNT(*) AS COUNT FROM {{" + sTableId + "}} WHERE session_id = '" + sSessionId + "' AND calculation_version_id = " + iCalculationVersionId);
	}

	expect(result).toBeDefined;
	var expectedResultJsonData = {
		COUNT: [iExpectedCount]
	};
	expect(result).toMatchData(expectedResultJsonData, ['COUNT']);
}

function convertResultToArray(result) {
	expect(result).toBeDefined();
	var convertedResult = {};

	if (result.columns !== undefined) {
		_.each(result.columns, function (value, sCurrentColumnName) {
			convertedResult[sCurrentColumnName] = [];
			_.each(result.columns[sCurrentColumnName].rows, function (value, key) {
				if (value instanceof Date) {
					convertedResult[sCurrentColumnName].push(value.toJSON());
				} else {
					convertedResult[sCurrentColumnName].push(value);
				}
			});
	
		});
	} else  if (result.columnInfo !== undefined) {
		_.each(result.columnInfo, function (columnvalue, index) {
			convertedResult[columnvalue.columnName] = [];
			_.each(result, function (obj, index) {
				_.each(obj, function (value, key) {
					if(columnvalue.columnName === key) {
						if (value instanceof Date) {
							convertedResult[key].push(value.toJSON());
						} else {
							convertedResult[key].push(value);
						}
					}
				});	
			});
		});
	}
	return convertedResult;
}

function transposeResultArrayOfObjects(input, bLeaveNullColumns) {
    const output = {};
	if (input.length > 0) {
        const temp = []; // use Array first to create output as this is faster than Object
        const aColumnNames = Object.keys(input[0]);
        aColumnNames.forEach((column, index) => temp[index] = new Array(input.length));
        // for loop is much faster than Array.forEach
        // every possible computation is moved out from the inner loop
        const colNumbers = aColumnNames.length;
        const rowNumbers = input.length;
        for (let rowIndex = 0; rowIndex < rowNumbers; rowIndex++) {
            const sourceRow = input[rowIndex];
            for (let colIndex = 0; colIndex < colNumbers; colIndex++) {
                temp[colIndex][rowIndex] = sourceRow[aColumnNames[colIndex]];
            }
        }
        if (bLeaveNullColumns) {
            // copy all columns
            aColumnNames.forEach((column, index) => { output[column] = temp[index]; });
        } else {
            // copy only output columns with at least one non-null value
            aColumnNames.forEach((column, index) => {
                if (temp[index].findIndex(el => el !== null) !== -1) {
                    output[column] = temp[index];
				} 
			});
		}
	}	
	return output;
}


/**
 * Takes an object that contains multiple values for a property in an array (as it's often use to initialize table data)
 * and transform it into an array of objects with the same keys as the input object but only with single values. <br />
 *
 * This function become handy if you want use objects used to initialize table data to be used as SQLScript procedure
 * parameters.
 *
 * @param oObjectToTranspose
 * @returns {Array}
 */

function transpose(oObjectToTranspose, bFilterNullValues) {
	var bFilter = bFilterNullValues || false;
	var aReturnArray = [];
	_.each(oObjectToTranspose, function (aValues, sKey) {
		_.each(aValues, function (value, iIndex) {
			if (aReturnArray.length <= iIndex) {
				aReturnArray.push({});
			}
			var oValueObject = aReturnArray[iIndex];
			if (bFilter === true && value === null) {
				return;
			}
			oValueObject[sKey] = value;
		});
	});
	return aReturnArray;
}

// Adds a row to a table represented as object with column names as keys and rows as arrays
// Example: { col1: [1, 2] } + { col1: 3 } = { col1: [1,2,3] }

/**
 * Converts array of objects to object of arrays.
 * Example: [ {key1:1, key2:2}] => {key1:[1], key2:[2]}
 * It can be useful e.g. for comparing of test data with results of services.
 */
function convertArrayOfObjectsToObjectOfArrays(oArrayToConvert) {
	var oReturn = {};
	_.each(oArrayToConvert, function (oObject, iIndex) {
		_.each(oObject, function (value, sKey) {
			if (oReturn[sKey] === undefined) {
				oReturn[sKey] = [];
			}
			oReturn[sKey].push(value);
		});
	});
	return oReturn;
}

/**
 * Pick objects from object of arrays according to their indexes.
 * Example: [ {key1:1, key2:2}, {key1:2, key2:3}] => {key1:[1], key2:[2]}
 * It can be useful e.g. for picking of one object from test data.
 */
function pickObjectFromObjectOfArrays(oOriginObject, aIndexes) {
	var oReturn = {};
	var aOriginProperties = _.keys(oOriginObject);
	_.each(aOriginProperties, function (sPropertyKey) {
		oReturn[sPropertyKey] = [];
		_.each(oOriginObject[sPropertyKey], function (value, iIndex) {
			if (_.includes(aIndexes, iIndex)) {
				oReturn[sPropertyKey].push(value);
			}
		});
	});
	return oReturn;
}


function isComplexObject(oObject) {
	return (_.isObject(oObject) || _.isArray(oObject)) && (!_.isDate(oObject) && !_.isNumber(oObject) && !_.isFunction(oObject));
}

function checkComplexData(oActual, oExpected, aPrimaryMatchingFields, aMatchingFields) {
	var aComplexProperties = [];
	_.each(_.keys(oExpected), function (sPropertyKey) {
		//if( oExpected[sPropertyKey][0]=== undefined
		var oElement = oExpected[sPropertyKey];
		if (_.isArray(oExpected[sPropertyKey]) || _.isObject(oExpected[sPropertyKey])) {
			if (_.isArray(oElement)) {
				if (isComplexObject(oExpected[sPropertyKey][0])) {
					aComplexProperties.push(sPropertyKey);
				}
			}
		}
	});

	var oActualFiltered = _.omit(oActual, aComplexProperties);
	var oExpectedFiltered = _.omit(oExpected, aComplexProperties);
	if (_.isArray(oActual)) {
		oActualFiltered = convertArrayOfObjectsToObjectOfArrays(oActualFiltered);
		oExpectedFiltered = convertArrayOfObjectsToObjectOfArrays(oExpectedFiltered);
	}
	var oActualParsed = JSON.parse(JSON.stringify(oActualFiltered));
	var oExpectedParsed = JSON.parse(JSON.stringify(oExpectedFiltered));
	expect(oActualParsed).toMatchData(oExpectedParsed, aPrimaryMatchingFields);

	_.each(aComplexProperties, function (sProperty) {
		if (aMatchingFields[sProperty] !== undefined) {
			var oActualComplex = oActual[sProperty];
			var oExpectedComplex = oExpected[sProperty];

			checkComplexData(oActualComplex, oExpectedComplex, aMatchingFields[sProperty], aMatchingFields);
		}
	});
}


function convertToObject(oObjectWithArrayValues, iIndex) {
	var oPlainObject = {};
	_.each(oObjectWithArrayValues, function (aValues, sKey) {
		oPlainObject[sKey] = aValues[iIndex];
	});
	return oPlainObject;
}

// convert an object containing arrays as values for keys to array of object
// Example: { col1: [1,2] } --> [ {col1: 1}, {col1:2} ]
function convertObjectWithArraysToArrayOfObjects(oObjectWithArrayValues, iIndex) {
	var result = [];
	var firstObject;
	// get the first "column" in the object
	for (var prop in oObjectWithArrayValues) {
		firstObject = oObjectWithArrayValues[prop];
		break;
	}
	if (firstObject !== undefined && _.isArray(firstObject)) {
		var rowCount = firstObject.length;
		for (var i = 0; i < rowCount; i++) {
			result.push(convertToObject(oObjectWithArrayValues, i));
		}
	}
	return result;
}

// Adds a row to a table represented as object with column names as keys and rows as arrays
// Example: { col1: [1, 2] } + { col1: 3 } = { col1: [1,2,3] }
function addRowToTableData(table, row) {
	var newTable = {};
	for (var col in table) {
		var rows = table[col];
		if (_.isArray(rows)) {
			newTable[col] = Array.slice(rows);
			if (_.isArray(row[col])) {
				_.forEach(row[col], function (value) {
					newTable[col].push(value);
				});
			} else {
				newTable[col].push(row[col]);
			}
		}
	}
	return newTable;
}


/**
 * fillWithNull - Takes an JS object and adds all properties that are necessary to match the given table type. Existing properties of the item are lept,
 * added properties have null as value.
 *
 * @param  {object} oMockstar Mockstar instance
 * @param  {object} oObjectToFill The JS object should be expanded to table type
 * @param  {string} sTableName    Name of the table type
 * @return {object}               The expanded JS object
 */
function fillWithNull(oMockstar, oObjectToFill, sTableName) {
	var aObjectKeys = _.keys(oObjectToFill);
	var iValueArraySize = oObjectToFill[aObjectKeys[0]].length;

	var aTableColumns = oMockstar.execQuery(`select column_name from sys.table_columns where schema_name=CURRENT_SCHEMA and table_name='${sTableName}' order by position`).columns["COLUMN_NAME"].rows;
	var aColumnsToAdd = _.reject(aTableColumns, function (sColumnName) {
		return _.includes(aObjectKeys, sColumnName);
	})

	var oObjectToReturn = _.clone(oObjectToFill);
	_.each(aColumnsToAdd, function (sColumnName) {
		oObjectToReturn[sColumnName] = _.range(iValueArraySize).map(function () {
			return null;
		})
	});
	return oObjectToReturn;
}

/**
 * Takes an object that contains multiple values for a property in an array or a single value
 * and returns the WHERE statement. Dates keys of the test data object are omitted from the WHERE statement.
 */
function createWhereStmt(oTestData) {
	var aDateKeys = ["CREATED_ON","LAST_MODIFIED_ON","LAST_MODIFIED_ON","LAST_USED_ON","LAST_ACTIVITY_TIME","LAST_UPDATED_ON","STARTED",
	                 "MASTER_DATA_TIMESTAMP","_VALID_FROM","_VALID_TO","_VALID_FROM_FIRST_VERSION","VALID_FROM","VALID_TO",
	                 "START_OF_PRODUCTION","END_OF_PRODUCTION","VALUATION_DATE","START_OF_PROJECT","END_OF_PROJECT","LIFECYCLE_VALUATION_DATE",
	                 "CERTIFICATE_VALID_FROM","CERTIFICATE_VALID_TO","GENERATION_TIME","LAST_UPDATED_ON","TIME"];
	var aTestDataKeys = _.difference(_.keys(oTestData),aDateKeys);
	var sWhereStmt = "";
	if (aTestDataKeys.length === 0) {
		return sWhereStmt += " 1=1 ";
	}
	_.each(aTestDataKeys, function(sKey, iIndex){
		if (!_.isArray(oTestData[sKey])) {
			sWhereStmt += oTestData[sKey] === null ? sKey + " is null" : sKey + " = '" + oTestData[sKey] + "'";
		} else {
			let values = _.uniq(_.map(_.without(oTestData[sKey], null), value => { return "'" + value + "'" }));
			if (_.includes(oTestData[sKey], null)) {
				if (oTestData[sKey].length > 1 && values.length > 1) {
					sWhereStmt += "( " + sKey + " is null or " + sKey + " in (" + values.join(', ') + ") )";
				} else if (oTestData[sKey].length > 1 && values.length === 1){
					sWhereStmt += "( " + sKey + " is null or " + sKey + " = " + values[0] + " )";
				} else {
					sWhereStmt += sKey + " is null";
				}
			} else {
				if (oTestData[sKey].length > 1 && values.length > 1) {
					sWhereStmt += sKey + " in (" + values.join(', ') + ")";
				} else {
					sWhereStmt += sKey + " = " + values[0];
				}
			}
		}
		if(aTestDataKeys.length - 1 > iIndex )
			sWhereStmt += " AND ";
	});
	return sWhereStmt;
}

/**
 * Takes an object or an array of objects (this objects could contain multiple values for a property in an array or a single value)
 * as it's often use to initialize table data and deletes the entry/entries form the specified table.
 */
function deleteTestData(oMockstar, sTableName, testData){

	if (_.isArray(testData)) {
		_.each(testData, function(oTestData) {
			let sWhereStmt = createWhereStmt(oTestData);
			oMockstar.execSingle("delete from {{"+sTableName+"}} where " + sWhereStmt);
		});
	} else {
		let sWhereStmt = createWhereStmt(testData);
		oMockstar.execSingle("delete from {{"+sTableName+"}} where " + sWhereStmt);
	}

}


/**
 * Checks if a table in the given schema exists and returns true if this is the case. "SYS"."TABLE_COLUMNS" is used to determine the
 * existence the table
 *
 * @param {object} oMockstar Instance of mockstar to perform the query
 * @param {string} sTableName Name of the table
 * @returns True if the table exists, false otherwise
 */
function tableExists(oMockstar, sTableName) {
    const result = oMockstar.execQuery(`
      select distinct table_name
        from "TABLES"
        where       schema_name = CURRENT_SCHEMA
                and table_name = '${sTableName}'
    `);
    return result.getRowCount() > 0;
}

module.exports = {
	buildRequest,
	getRowCount,
	checkRowCount,
	convertResultToArray,
	transpose,
	transposeResultArrayOfObjects,
	convertArrayOfObjectsToObjectOfArrays,
	convertToObject,
	convertObjectWithArraysToArrayOfObjects,
	addRowToTableData
};
