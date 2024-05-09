const _ = require("lodash");

/**
 * Checks if a given Date instance is between 2 other given Dates and can be
 * used if a date has the correct time zone.
 * 
 * Due to overflow of seconds, hours, etc. it's not possible to compare the date
 * components directly. However, if a test creates a date instance at the start
 * of the test and after the execution of the production code, the date the
 * production code produced must be between the start and end. Is it smaller as
 * the start or bigger as the end, it might be that the time zone of the date
 * returned by the production code is wrong.
 * 
 * @param dToCheck
 *            {Date} - the Date instance that should be checked
 * @param dStart
 *            {Date} - start of the time span dToCheck must be in 
 * @param dEnd
 *            {Date} - end of the time span dToCheck must be in 
 */
function checkDateIsBetween(dToCheck, dStart, dEnd) {
	var iStartTime = dStart.getTime();
	var iEndTime = dEnd.getTime();
	var iCheckTime = dToCheck.getTime();

	expect(iStartTime < iCheckTime).toBe(true, `expect ${dStart.toISOString()} < ${dToCheck.toISOString()}`);
	expect(iCheckTime < iEndTime).toBe(true, `expect ${dToCheck.toISOString()} < ${dEnd.toISOString()}`);
}

/**
 * Checks if the date fields from aFieldsToCheck of object have been updated shortly before.
 * 
 * It is useful e.g. to check if the time fields "..._AT" are correct
 */
function checkDatesUpdated(oObject, aFieldsToCheck) {
	var dEnd = new Date();
	var dStart = new Date();
	dStart.setSeconds(dStart.getSeconds() - 10);

	_.each(aFieldsToCheck, function(sField, iIndex) {
		var fieldValue = oObject[sField];
		var dToCheck = new Date(Date.parse(fieldValue));
		checkDateIsBetween(dToCheck, dStart, dEnd);
	});
}


/**
 * Create request used for testing the validators - for example
 */
function createRequest(oQueryPath, oBody, oHTTPMethod, params) {
	var oRequest = {
		queryPath : oQueryPath,
		method : oHTTPMethod,
		body : ( function (oBody) {
			if (oBody === null) {
				return null;
			} else {
				return { asString : function() {
					return JSON.stringify(oBody);
					}
				}
			}
			
		} (oBody) ),
		parameters : params
	};
	return oRequest;
}

/**
 * Helper function to compare a row from db with the expected one. It also checks if the returned dates are correct.
 */
function compareDbResultWithExpected(result, oExpectedResult, aPropertiesToExclude) {
	expect(result).toBeDefined;

	if (aPropertiesToExclude !== undefined) {
		oExpectedResult = _.omit(oExpectedResult, aPropertiesToExclude);
	}
	var aKeysToCheck = _.keys(oExpectedResult);
	// compare the values from db with expected ones
	_.each(aKeysToCheck, function(sKey, iIndex) {
		var oDbValue = result.columns[sKey].rows[0];
		var oExpectedValue = oExpectedResult[sKey];
		if (oDbValue instanceof Date) {
			expect((new Date(oDbValue)).getTime() - (new Date(oExpectedValue)).getTime()).toBeLessThan(86400000);
		} else {
			expect(oDbValue).toEqual(oExpectedValue);
		}
	});
}

module.exports = {
	checkDateIsBetween,
	checkDatesUpdated,
	createRequest,
	compareDbResultWithExpected
};
