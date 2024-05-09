var _ = require("lodash");
var Constants = require("./constants");
var XRegExp = require("xregexp");

var MessageLibrary = require("./message");
var PlcException = MessageLibrary.PlcException;


// TODO: standardize error log format
function logError(msg) {
    console.error(new Date().toLocaleString(), "[ERROR]", msg);
};
function logInfo(msg) {
    console.log(new Date().toLocaleString(), "[INFO]", msg);
};

module.exports = {
    MessageLibrary,
    logError,
    logInfo
};

function isPositiveInteger(value) {
    if(value === undefined || value === null){
        return false;
    }
    return (/^[1-9]+[0-9]*$/).test(value.toString());
}

function IsNonNegativeInteger(value) {
    if(value === undefined || value === null){
        return false;
    }
    return (/^(0|[1-9]+[0-9]*)$/).test(value.toString());
}

function toPositiveInteger(sValue){
    if(!isPositiveInteger(sValue)){
    	const sLogMessage = "sValue contains no valid positive integer.";
    	logError(sLogMessage);
		throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION.code, sLogMessage);
    }
    return parseInt(sValue, 10);
}

function isNullOrUndefined(value) {
    return _.isNull(value) || _.isUndefined(value);
}

function isNullOrUndefinedOrEmpty(value) {
    return _.isNull(value) || _.isUndefined(value) || value === "" || _.isEmpty(value);
}

function isPlainObject(oObject) {
    return _.isObject(oObject) && !_.isArray(oObject) && !_.isFunction(oObject);
}

function isEmptyObject(oObject) {
	return isPlainObject(oObject) && _.isEmpty(oObject);
}

/** Safe method for getting a value from an object by key
 */
function getValueOnKey (oObject, sKey){
    if(isNullOrUndefined(oObject)) {
        return null;
    } else {
        if(_.has(oObject, sKey)){
            return oObject[sKey];
        } else {
            return null;
        }
    }
}

function arrayToLowerCase(aStringArray){
    var aLowerCaseArray = [];
    _.each(aStringArray,function(sValue){
        aLowerCaseArray.push(sValue.toLowerCase());
    });
    return aLowerCaseArray;
}

/** Picks up an object from object of arrays (which are used e.g. for test data)
 */
function toObject(result, index) {
    //expect(result).toBeDefined();

    var convertedResult = {};
    _.each(result, function(value, key){
        convertedResult[key] = value[index];
    });

    return convertedResult;
}

function setErrorResponse(iStatusCode, sMessage, oResponse) {
	oResponse.status = iStatusCode;
	oResponse.contentType = "text/plain";
	oResponse.setBody(sMessage);
}

function boolToInt(value) {
	if (isNullOrUndefined(value))
		return 0;

	return value === true ? 1 : 0 ;
}
/**
 * Splits incremental string like: TestVersionName (1) / TestVersionName (2)
 * @param sTextWithIncrement
 */
function splitIncrementalString(sTextWithIncrement){
	var sRegexIncremental = "^(.*) \\(([1-9][0-9]*)\\)$";
	var rPattern = new RegExp(sRegexIncremental);
	var aMatches = rPattern.exec(sTextWithIncrement);
	var sPrefix = sTextWithIncrement;
	var iStartSuffix = 1;

	// Check if a text ends in "<space><open_bracket><number><close_bracket>", that is, " (1)", " (2)"
	if (aMatches) {
		sPrefix = aMatches[1];
		iStartSuffix = parseInt(aMatches[2]);
	}
	return {
		Prefix : sPrefix,
		StartSuffix : iStartSuffix
	};
}

/**
 * Function used to find first unused numeric suffix (numbers) in an array Of Strings: ["TestVersionName (1)" , "TestVersionName (5)]
 */
function findFirstUnusedSuffixInStringArray(sPrefix, iStartSuffix, aNamesWithPrefix){
	var sRegexSufixWithoutText = " \\(([1-9][0-9]*)\\)";
	var rSuffixPattern = new RegExp(escapeStringForRegExp(sPrefix) + sRegexSufixWithoutText);

	//Filter an array having "<prefix> (<something>)" names and extract those which actually follow the "<prefix> (<number>)" pattern
	//Then and collect all the <number>s in an array.
	var aSuffixes = [];
	_.each(aNamesWithPrefix, function(sNameWithPrefix, iUnused)
	{
		var aMatches = rSuffixPattern.exec(sNameWithPrefix);
		if (aMatches) {
			aSuffixes.push(parseInt(aMatches[1]));
		}
	} );

	/* Find first unused numeric suffix. */
	var iSuffix = findFirstUnusedSuffix(aSuffixes, iStartSuffix);

	return iSuffix;
}

/**
 * This function validates the if the path has the correct format
 * Format should be number/number/number/number/number ...
 * Regex: (\d is equivalent to [0-9])
 * First part: ^\d+$
 * This checks that the string contains only one positive number.
 * Second part: ^\d+(\/\d+)+$
 * This checks that we always have first a positive number followed by the repeating pattern "/number"
 * @param {string} sPath - input string that needs to be validated
 * @returns {string} sPath - returns the vaidated path
 * @throws {PlcException} - if the path is invalid
 */
function validatePath(sPath) {
    const pathRegex = /^\d+$|^\d+(\/\d+)+$/;
    if(!pathRegex.test(sPath) || sPath === "") {
    	const sClientInfo = "Invalid path.";
        const sDeveloperInfo = `${sClientInfo} Path: ${sPath}`;
        logError(sDeveloperInfo);
        throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientInfo);
    }
    return sPath;
}

/**
 * This function checks if the input string contains a forward slash "/"
 * Regex: /\//
 * @param {string} sPath - input string that needs to be checked
 * @returns {boolean} true if string contains forward slash, false if it doesn't
 */
function hasForwardSlash(sPath) {
    return /\//.test(sPath);
}

/**
 * This function returns the integer after the last forward slash "/"
 * @param {string} sPath - input string
 * @returns {integer} returns the number after the last forward slash, if there is no forward slash the number inside the string will be returned.
 */
function getEntityIdFromPath(sPath) {
    return hasForwardSlash(sPath) ? parseInt(sPath.substr(sPath.lastIndexOf("/") + 1)) : parseInt(sPath);
}

/**
 * Function used to find first unused numeric suffix (numbers) from a collection of numeric suffixes (numbers)
*/
function findFirstUnusedSuffix(aAllSuffixes, iStartSuffix)
{
	/* Filter values smaller than iStartSuffix, then sort the array. */
	var aSuffixes = aAllSuffixes.filter(function(value, index, array) { return value > iStartSuffix; });
	if (aSuffixes.length === 0) {
		// special case if no suffixes are greater than iStartSuffix
		return iStartSuffix + 1;
	}
	aSuffixes.sort((a,b) => a - b); // without the lambda function Array.sort() always sorts alphabetically and not by numbers

	for (let i=1; i < aSuffixes.length; i++) {
		if (aSuffixes[i] - aSuffixes[i-1] !== 1) {
			return aSuffixes[i-1] + 1;
		}
	}
	return aSuffixes[aSuffixes.length-1] + 1;
}

/**
 * Sets the properties in oEntity to the values from oValuesToSet (if they are not empty), if oEntity properties have not been set before
 * @param oProject
 * @param oDefaultSettings
 * @param aPropertiesToSet
 */
function setNonEmptyProperties(oEntity, oValuesToSet, aPropertiesToSet) {
		// set properties to given values if they are not null
		_.each(aPropertiesToSet, function(sProperty, iIndex) {
			if (isNullOrUndefined(oEntity[sProperty])
						&& oValuesToSet[sProperty] !== '' 
							&& ! isNullOrUndefined(oValuesToSet[sProperty])) {
				oEntity[sProperty] = oValuesToSet[sProperty];
			}
		});
		
		//if SALES_PRICE_CURRENCY_ID is not set on project level, then for SALES_PRICE_CURRENCY_ID the REPORT_CURRENCY_ID of the project is taken
		if(_.includes(aPropertiesToSet, "SALES_PRICE_CURRENCY_ID") && isNullOrUndefined(oEntity.SALES_PRICE_CURRENCY_ID) && isNullOrUndefined(oValuesToSet.SALES_PRICE_CURRENCY_ID)) {
			oEntity.SALES_PRICE_CURRENCY_ID = oValuesToSet.REPORT_CURRENCY_ID;
		}
		
		//set TARGET_COST_CURRENCY_ID for the root item to the REPORT_CURRENCY_ID of the project
		if(_.includes(aPropertiesToSet, "TARGET_COST_CURRENCY_ID") && isNullOrUndefined(oEntity.TARGET_COST_CURRENCY_ID)) {
			oEntity.TARGET_COST_CURRENCY_ID = oValuesToSet.REPORT_CURRENCY_ID;
		}
}

/**
 * Sets default values for calculation version.
 */
function setDefaultValuesForCalculationVersion(oCalculationVersion, oDefaultSettings) {
	// Set default values for calculation version
	setNonEmptyProperties(oCalculationVersion, oDefaultSettings, ["COSTING_SHEET_ID", "COMPONENT_SPLIT_ID", "CUSTOMER_ID", "REPORT_CURRENCY_ID", "SALES_PRICE_CURRENCY_ID", "SALES_DOCUMENT", "START_OF_PRODUCTION", "END_OF_PRODUCTION", "VALUATION_DATE", "EXCHANGE_RATE_TYPE_ID", "MATERIAL_PRICE_STRATEGY_ID", "ACTIVITY_PRICE_STRATEGY_ID"]);

	// set default values for the root item
	setNonEmptyProperties(oCalculationVersion.ITEMS[0], oDefaultSettings, ["BUSINESS_AREA_ID", "COMPANY_CODE_ID", "PLANT_ID", "PROFIT_CENTER_ID", "TARGET_COST_CURRENCY_ID"]);
	
	// initialize read-only master data timestamp; valuation and explosion date are set on client-side (mandatory properties)
	oCalculationVersion.MASTER_DATA_TIMESTAMP = new Date();
	
	// root item can only have category 0; since metadata prohibit transmission of this property for the root item, it must be set here
    oCalculationVersion.ITEMS[0].ITEM_CATEGORY_ID = 0;
    oCalculationVersion.ITEMS[0].CHILD_ITEM_CATEGORY_ID = 0;
}

/**
 * Addins: Checks if version string is valid, i.e. it has format '<int>.<int>.<int>.<int>', e.g. '1.2.3.4'.
 */
function validateAddinVersionString(sVersion) {
  if (sVersion === undefined) {
    return;
  }
  var aVersions = sVersion.split(".");

  if (aVersions.length !== 4) {
        const sClientMsg = "Version string is invalid.";
        const sServerMsg = `${sClientMsg} String: ${sVersion}.`;
        logError(sServerMsg);
        throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg);
  }

  _.each(aVersions, function(sVersionPart, iIndex) {
    if(!IsNonNegativeInteger(sVersionPart)){
          const sClientMsg = "Part of version string is not a valid number.";
          const sServerMsg = `${sClientMsg} String: ${sVersion}, invalid part: ${sVersionPart}.`;
          logError(sServerMsg);
          throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg);          
    }
  });
}

/**
 * Check if regex is maintained in metadata for this field and validate value against regex
 */
function checkParameterString(sParameterValue, sRegEx){
	var pattern = XRegExp(sRegEx);
	if (!pattern.test(sParameterValue)) {
		const sLogMessage = `${sParameterValue} does not match valid syntax for parameter.`;
        logError(sLogMessage);
        throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sLogMessage);
	}
}

/**
 * Function checkStringSQLInjection throws an exception if a string contains SQL injection.
 * 
 * @param   {string} sFilter - filtering string sent from frontend
 **/
function checkStringSQLInjection(sFilter) {
//	perform validation for SQL Injection
//	search for values from sValidation_list in string received from front-end
	var iSearchResult;
	var sValidation_list = "\",'";
	var aValidation = sValidation_list.split(",");
	for (var k=0, iValidation_length = aValidation.length; k < iValidation_length; k++){
		iSearchResult = sFilter.search(aValidation[k]);
		if(iSearchResult !== -1){
	        const sClientMsg = "Inconsistent data in filter string. See log for details.";
	        const sServerMsg = `${sClientMsg} Validation for SQL Injection failed - character found: ${aValidation[k]}.`;
	        logError(sServerMsg);
	        throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
		}
	}
}


/**
 * Recursively freezes (deep freeze) objects using {@link Object.freeze}
 *  
 * @param  {object} oObject - The object to be deep-frozen 
 * @return {object} The deep-frozen object
 */ 
function deepFreeze(oObject) {
	if (Object.isFrozen(oObject) === false) {
		Object.freeze(oObject);
	}
	_.each(oObject, (vValue, oProperty) => {
		var bIsFreezable = vValue !== null && (_.isObject(vValue) || _.isFunction(vValue));
		if (bIsFreezable) {
			deepFreeze(vValue);
		}
	});
    return oObject;
}

/**
 * Function returnUnsuccessfulItems returns the objects that were not successfully inserted/updated/deleted.
 * 
 * @param   {string} sFilter - filtering string sent from frontend
 **/
function unsuccessfulItemsDbOperation(aBodyItems, aDbResponse) {
	var aItems = _.map(aDbResponse, function(oResult, key) {
	    // 1 is successful operation
		if(oResult !== 1) {
	        return aBodyItems[key];
	    } else {
	    	return "success";
	    }
	});
	
	return _.difference(aItems, ["success"]);
}

/**
 * Returns true if an array has duplicates or false if not
 *  
 * @param  {array} aArray - Array that will be checked if has duplicates 
 * @return {bool} tru if array has duplicates . false otherwise
 */ 
function arrayHasDuplicates(aArray){
    return (aArray.length != _.uniq(aArray).length);
}

/**
 * Function to convert a result set to an object that contains arrays for each property.
 * Used for compressing the response for items.
 *  
 * @param  {array} aArray - Result Set
 * @return {object} - An object
 * 
 *  Ex: transposeResultArray => 
 *  			{   ITEM_ID : [1, 2],
 *        			CALCULATION_VERSION_ID : [1, 1]
 *      		}
 * 
 * This function is highly optimized for speed.
 * Different combinations of for loops, Array.forEach(), and Array.push() have been tested
 * and this was the fasted combination.
 * See also https://jsperf.com/push-method-vs-setting-via-key 
 */ 
function transposeResultArray(input, bLeaveNullColumns) {
	const output = {};
	if (input.length > 0) {
		const aColumnNames = Object.keys(input[0]);
		aColumnNames.forEach(column => output[column] = new Array(input.length));
		const iterator = input.getIterator();
		let rowNumber = 0;
		while(iterator.next()) {
			const currentRow = iterator.value();
		    for (let i=0; i < aColumnNames.length; i++) {
		    	//TODO: workaround for decimal value issue
		    	//output[aColumnNames[i]][rowNumber] = currentRow[i];
		    	output[aColumnNames[i]][rowNumber] = currentRow[aColumnNames[i]];
		    }
		    rowNumber++;
		}
		// only output columns with at least one non-null value
		if(!bLeaveNullColumns) {
			aColumnNames.forEach(column => {
			    if (output[column].findIndex(el => el !== null) === -1) {
					delete output[column];
				} 
			});
		}
	}	
	return output;
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


/* TODO: write test
 * UTF-8 - description taken from https://en.wikipedia.org/wiki/UTF-8
 * 
 * Bits of code point    First code point    Last code point     Bytes in sequence     Byte 1     Byte 2    Byte 3    Byte 4    Byte 5    Byte 6
 * 7                     U+0000                U+007F                1                 0xxxxxxx    
 * 11                    U+0080                U+07FF                2                 110xxxxx   10xxxxxx
 * 16                    U+0800                U+FFFF                3                 1110xxxx   10xxxxxx  10xxxxxx
 * 
 * implementation is not made for 21, 26, 31 , only for standard chars (chinese chars not supported )
 * 21                    U+10000                U+1FFFFF             4                 11110xxx   10xxxxxx  10xxxxxx  10xxxxxx
 * 26                    U+200000               U+3FFFFFF            5                 111110xx   10xxxxxx  10xxxxxx  10xxxxxx  10xxxxxx
 * 31                    U+4000000              U+7FFFFFFF           6                 1111110x   10xxxxxx  10xxxxxx  10xxxxxx  10xxxxxx  10xxxxxx
 * function converts an UTF8 array to string
 */
function Utf8ArrayToStr(utf8Array) {
    var returnString, i, len;
    var char1, char2, char3;

    returnString = "";
    len = utf8Array.byteLength;
    i = 0;
    while(i < len) {
        char1 = utf8Array[i++];
        switch(char1 >> 4)
        {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            /*
                * Bits of code point    First code point    Last code point     Bytes in sequence     Byte 1        Byte 2    Byte 3    Byte 4    Byte 5    Byte 6
                * 7                     U+0000                U+007F                1                 0xxxxxxx
                * read Byte 1
            */    
            returnString += String.fromCharCode(char1);
            break;
            case 12: case 13:
            /*
                * Bits of code point    First code point    Last code point     Bytes in sequence     Byte 1        Byte 2    Byte 3    Byte 4    Byte 5    Byte 6
                * 11                    U+0080                U+07FF                2                 110xxxxx      10xxxxxx
                * read (Byte 1 & 111111) left shifted with 6 => xxxxx000000 and concatenate with (Byte 2 & 11111)
            */
            char2 = utf8Array[i++];
            returnString += String.fromCharCode(((char1 & 0x1F) << 6) | (char2 & 0x3F));
            break;
            case 14:
            /*
                * Bits of code point    First code point    Last code point     Bytes in sequence     Byte 1        Byte 2    Byte 3    Byte 4    Byte 5    Byte 6
                * 16                    U+0800                U+FFFF                3                 1110xxxx     10xxxxxx   10xxxxxx
                * read (Byte 3 & 11111) and concatenate with (Byte 2 & 11111) left shifted with 6 and Byte 1
            */
            char2 = utf8Array[i++];
            char3 = utf8Array[i++];
            returnString += String.fromCharCode(((char1 & 0x0F) << 12) |
                            ((char2 & 0x3F) << 6) |
                            ((char3 & 0x3F) << 0));
            break;
        }
    }
    return returnString;
};

function arrayBufferToString(oArrayBuffer) {
    return Utf8ArrayToStr(new Uint8Array(oArrayBuffer));
};

/*
 * Special Characters meaningful for regex must be escaped in order to be right interpreted by LIKE_REGEXPR sql operator. 
 * This function is does this replacement based on a constant array that contains all these chars - > see Constants.aRegexSpecialChars
 * 
 * LIKE_REGEXPR - https://help.sap.com/saphelp_hanaplatform/helpdata/en/b4/0d483dd34d47aa9cc89b4d8a6e617e/content.htm
 * special chars meaningful for regex: http://www.regular-expressions.info/characters.html
 */
function replaceSpecialCharsForSQLLikeRegexpr(sImputString) {
    _.each(Constants.aRegexSpecialChars, function (oRegexSpecialChar, iIndex) {
        var regex = new RegExp(oRegexSpecialChar.specialCharReplacement, "g");
        sImputString = sImputString.replace(regex, oRegexSpecialChar.specialCharReplacement);
    });

    return sImputString;
};

/**
 * Check if the given combination of sProperty and sValue matches one of the rules defined below.
 * For example, `PLANT_ID` and `*` returns `true`, while `PLANT_ID` and `#P1` returns `false`.
 * @param {string} sProperty (e.g. ACCOUNT_GROUP_ID, PLANT_ID)
 * @param {string} sValue  (e.g. -2, *)
 * 
 * @returns {boolean}
 */
function checkForNonMasterdataValues(sProperty, sValue) {
    const aBusinessObjectsProperty = ['ACCOUNT_GROUP_ID', 'MATERIAL_GROUP_ID', 'MATERIAL_TYPE_ID', 'PLANT_ID', 'COST_CENTER_ID', 'ACTIVITY_TYPE_ID', 'MATERIAL_ID'];
    const aNonMasterdataValues = [['-1', '-2'], ['*', ''], ['*', ''], ['*', ''], ['*', ''], ['*', ''], ['*', '']];
    const iNonMasterdataValuesPosition = aBusinessObjectsProperty.indexOf(sProperty);
    if (aNonMasterdataValues[iNonMasterdataValuesPosition].indexOf(sValue) >= 0)
        return true;
    return false;
}

function prepareSurchargesMasterdataValuesForValidation(aPropertiesToBeChecked, aProjectMaterialPriceSurcharges) {
    let oProjectMasterdata = transposeResultArrayOfObjects(aProjectMaterialPriceSurcharges);
    oProjectMasterdata = _.pick(oProjectMasterdata, aPropertiesToBeChecked);
    for (property in oProjectMasterdata) {
        oProjectMasterdata[property] = _.uniq(oProjectMasterdata[property]);
        oProjectMasterdata[property] = _.filter(oProjectMasterdata[property], value => !checkForNonMasterdataValues(property, value.toString()));
    }
    return oProjectMasterdata;
}

function escapeStringForRegExp(sString) {
    return sString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

module.exports = _.extend(module.exports, {
    isPositiveInteger,
    IsNonNegativeInteger,
    toPositiveInteger,
    isNullOrUndefined,
    isNullOrUndefinedOrEmpty,
    isPlainObject,
    isEmptyObject,
    getValueOnKey,
    arrayToLowerCase,
    toObject,
    boolToInt,
    splitIncrementalString,
    findFirstUnusedSuffixInStringArray,
    setNonEmptyProperties,
    setDefaultValuesForCalculationVersion,
    validateAddinVersionString,
    checkParameterString,
    checkStringSQLInjection,
    deepFreeze,
    unsuccessfulItemsDbOperation,
    arrayHasDuplicates,
    transposeResultArray,
    transposeResultArrayOfObjects,
    arrayBufferToString,
    replaceSpecialCharsForSQLLikeRegexpr,
    validatePath,
    hasForwardSlash,
    getEntityIdFromPath,
    checkForNonMasterdataValues,
    prepareSurchargesMasterdataValuesForValidation,
    escapeStringForRegExp
});
