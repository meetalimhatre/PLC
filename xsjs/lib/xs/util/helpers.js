var _ = require('lodash');
var Constants = require('./constants');
var XRegExp = require('xregexp');

var MessageLibrary = require('./message');
var PlcException = MessageLibrary.PlcException;


// TODO: standardize error log format
async function logError(msg) {
    console.error(new Date().toLocaleString(), '[ERROR]', msg);
}
;
async function logInfo(msg) {
    console.log(new Date().toLocaleString(), '[INFO]', msg);
}
;

module.exports = {
    MessageLibrary,
    logError,
    logInfo
};

async function isPositiveInteger(value) {
    if (value === undefined || value === null) {
        return false;
    }
    return /^[1-9]+[0-9]*$/.test(value.toString());
}

async function IsNonNegativeInteger(value) {
    if (value === undefined || value === null) {
        return false;
    }
    return /^(0|[1-9]+[0-9]*)$/.test(value.toString());
}

async function toPositiveInteger(sValue) {
    if (!await isPositiveInteger(sValue)) {
        const sLogMessage = 'sValue contains no valid positive integer.';
        await logError(sLogMessage);
        throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION.code, sLogMessage);
    }
    return parseInt(sValue, 10);
}

async function isNullOrUndefined(value) {
    return _.isNull(value) || _.isUndefined(value);
}

async function isNullOrUndefinedOrEmpty(value) {
    return _.isNull(value) || _.isUndefined(value) || value === '' || _.isEmpty(value);
}

async function isPlainObject(oObject) {
    return _.isObject(oObject) && !_.isArray(oObject) && !await _.isFunction(oObject);
}

async function isEmptyObject(oObject) {
    return await isPlainObject(oObject) && _.isEmpty(oObject);
}

/** Safe method for getting a value from an object by key
 */
async function getValueOnKey(oObject, sKey) {
    if (isNullOrUndefined(oObject)) {
        return null;
    } else {
        if (_.has(oObject, sKey)) {
            return oObject[sKey];
        } else {
            return null;
        }
    }
}

async function arrayToLowerCase(aStringArray) {
    var aLowerCaseArray = [];
    _.each(aStringArray, function (sValue) {
        aLowerCaseArray.push(sValue.toLowerCase());
    });
    return aLowerCaseArray;
}

/** Picks up an object from object of arrays (which are used e.g. for test data)
 */
async function toObject(result, index) {
    //expect(result).toBeDefined();

    var convertedResult = {};
    _.each(result, function (value, key) {
        convertedResult[key] = value[index];
    });

    return convertedResult;
}

function setErrorResponse(iStatusCode, sMessage, oResponse) {
    oResponse.status = iStatusCode;
    oResponse.contentType = 'text/plain';
    oResponse.setBody(sMessage);
}

async function boolToInt(value) {
    if (isNullOrUndefined(value))
        return 0;

    return value === true ? 1 : 0;
}
/**
 * Splits incremental string like: TestVersionName (1) / TestVersionName (2)
 * @param sTextWithIncrement
 */
async function splitIncrementalString(sTextWithIncrement) {
    var sRegexIncremental = '^(.*) \\(([1-9][0-9]*)\\)$';
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
        Prefix: sPrefix,
        StartSuffix: iStartSuffix
    };
}

/**
 * Function used to find first unused numeric suffix (numbers) in an array Of Strings: ["TestVersionName (1)" , "TestVersionName (5)]
 */
async function findFirstUnusedSuffixInStringArray(sPrefix, iStartSuffix, aNamesWithPrefix) {
    var sRegexSufixWithoutText = ' \\(([1-9][0-9]*)\\)';
    var rSuffixPattern = new RegExp(await escapeStringForRegExp(sPrefix) + sRegexSufixWithoutText);

    //Filter an array having "<prefix> (<something>)" names and extract those which actually follow the "<prefix> (<number>)" pattern
    //Then and collect all the <number>s in an array.
    var aSuffixes = [];
    _.each(aNamesWithPrefix, function (sNameWithPrefix, iUnused) {
        var aMatches = rSuffixPattern.exec(sNameWithPrefix);
        if (aMatches) {
            aSuffixes.push(parseInt(aMatches[1]));
        }
    });

    /* Find first unused numeric suffix. */
    var iSuffix = await findFirstUnusedSuffix(aSuffixes, iStartSuffix);

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
async function validatePath(sPath) {
    const pathRegex = /^\d+$|^\d+(\/\d+)+$/;
    if (!pathRegex.test(sPath) || sPath === '') {
        const sClientInfo = 'Invalid path.';
        const sDeveloperInfo = `${ sClientInfo } Path: ${ sPath }`;
        await logError(sDeveloperInfo);
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
async function hasForwardSlash(sPath) {
    return /\//.test(sPath);
}

/**
 * This function returns the integer after the last forward slash "/"
 * @param {string} sPath - input string
 * @returns {integer} returns the number after the last forward slash, if there is no forward slash the number inside the string will be returned.
 */
async function getEntityIdFromPath(sPath) {
    return await hasForwardSlash(sPath) ? parseInt(sPath.substr(sPath.lastIndexOf('/') + 1)) : parseInt(sPath);
}

/**
 * Function used to find first unused numeric suffix (numbers) from a collection of numeric suffixes (numbers)
*/
async function findFirstUnusedSuffix(aAllSuffixes, iStartSuffix) {
    /* Filter values smaller than iStartSuffix, then sort the array. */
    var aSuffixes = aAllSuffixes.filter(function (value, index, array) {
        return value > iStartSuffix;
    });
    if (aSuffixes.length === 0) {
        // special case if no suffixes are greater than iStartSuffix
        return iStartSuffix + 1;
    }
    aSuffixes.sort((a, b) => a - b); // without the lambda function Array.sort() always sorts alphabetically and not by numbers

    for (let i = 1; i < aSuffixes.length; i++) {
        if (aSuffixes[i] - aSuffixes[i - 1] !== 1) {
            return aSuffixes[i - 1] + 1;
        }
    }
    return aSuffixes[aSuffixes.length - 1] + 1;
}

/**
 * Sets the properties in oEntity to the values from oValuesToSet (if they are not empty), if oEntity properties have not been set before
 * @param oProject
 * @param oDefaultSettings
 * @param aPropertiesToSet
 */
async function setNonEmptyProperties(oEntity, oValuesToSet, aPropertiesToSet) {
    // set properties to given values if they are not null
    _.each(aPropertiesToSet, async function (sProperty, iIndex) {
        if (isNullOrUndefined(oEntity[sProperty]) && oValuesToSet[sProperty] !== '' && !await isNullOrUndefined(oValuesToSet[sProperty])) {
            oEntity[sProperty] = oValuesToSet[sProperty];
        }
    });

    //if SALES_PRICE_CURRENCY_ID is not set on project level, then for SALES_PRICE_CURRENCY_ID the REPORT_CURRENCY_ID of the project is taken
    if (_.includes(aPropertiesToSet, 'SALES_PRICE_CURRENCY_ID') && await isNullOrUndefined(oEntity.SALES_PRICE_CURRENCY_ID) && await isNullOrUndefined(oValuesToSet.SALES_PRICE_CURRENCY_ID)) {
        oEntity.SALES_PRICE_CURRENCY_ID = oValuesToSet.REPORT_CURRENCY_ID;
    }

    //set TARGET_COST_CURRENCY_ID for the root item to the REPORT_CURRENCY_ID of the project
    if (_.includes(aPropertiesToSet, 'TARGET_COST_CURRENCY_ID') && await isNullOrUndefined(oEntity.TARGET_COST_CURRENCY_ID)) {
        oEntity.TARGET_COST_CURRENCY_ID = oValuesToSet.REPORT_CURRENCY_ID;
    }
}

/**
 * Sets default values for calculation version.
 */
async function setDefaultValuesForCalculationVersion(oCalculationVersion, oDefaultSettings) {
    // Set default values for calculation version
    await setNonEmptyProperties(oCalculationVersion, oDefaultSettings, [
        'COSTING_SHEET_ID',
        'COMPONENT_SPLIT_ID',
        'CUSTOMER_ID',
        'REPORT_CURRENCY_ID',
        'SALES_PRICE_CURRENCY_ID',
        'SALES_DOCUMENT',
        'START_OF_PRODUCTION',
        'END_OF_PRODUCTION',
        'VALUATION_DATE',
        'EXCHANGE_RATE_TYPE_ID',
        'MATERIAL_PRICE_STRATEGY_ID',
        'ACTIVITY_PRICE_STRATEGY_ID'
    ]);


    await setNonEmptyProperties(oCalculationVersion.ITEMS[0], oDefaultSettings, [
        'BUSINESS_AREA_ID',
        'COMPANY_CODE_ID',
        'PLANT_ID',
        'PROFIT_CENTER_ID',
        'TARGET_COST_CURRENCY_ID'
    ]);


    oCalculationVersion.MASTER_DATA_TIMESTAMP = new Date();


    oCalculationVersion.ITEMS[0].ITEM_CATEGORY_ID = 0;
    oCalculationVersion.ITEMS[0].CHILD_ITEM_CATEGORY_ID = 0;
}




async function validateAddinVersionString(sVersion) {
    if (sVersion === undefined) {
        return;
    }
    var aVersions = sVersion.split('.');

    if (aVersions.length !== 4) {
        const sClientMsg = 'Version string is invalid.';
        const sServerMsg = `${ sClientMsg } String: ${ sVersion }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg);
    }

    _.each(aVersions, async function (sVersionPart, iIndex) {
        if (!await IsNonNegativeInteger(sVersionPart)) {
            const sClientMsg = 'Part of version string is not a valid number.';
            const sServerMsg = `${ sClientMsg } String: ${ sVersion }, invalid part: ${ sVersionPart }.`;
            await logError(sServerMsg);
            throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
    });
}




async function checkParameterString(sParameterValue, sRegEx) {
    var pattern = XRegExp(sRegEx);
    if (!pattern.test(sParameterValue)) {
        const sLogMessage = `${ sParameterValue } does not match valid syntax for parameter.`;
        await logError(sLogMessage);
        throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sLogMessage);
    }
}






async function checkStringSQLInjection(sFilter) {


    var iSearchResult;
    var sValidation_list = '",\'';
    var aValidation = sValidation_list.split(',');
    for (var k = 0, iValidation_length = aValidation.length; k < iValidation_length; k++) {
        iSearchResult = sFilter.search(aValidation[k]);
        if (iSearchResult !== -1) {
            const sClientMsg = 'Inconsistent data in filter string. See log for details.';
            const sServerMsg = `${ sClientMsg } Validation for SQL Injection failed - character found: ${ aValidation[k] }.`;
            await logError(sServerMsg);
            throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
    }
}








async function deepFreeze(oObject) {
    if (Object.isFrozen(oObject) === false) {
        Object.freeze(oObject);
    }
    _.each(oObject, (vValue, oProperty) => {
        var bIsFreezable = vValue !== null && (_.isObject(vValue) ||  _.isFunction(vValue));
        if (bIsFreezable) {
             deepFreeze(vValue);
        }
    });
    return oObject;
}






async function unsuccessfulItemsDbOperation(aBodyItems, aDbResponse) {
    var aItems = _.map(aDbResponse, function (oResult, key) {

        if (oResult !== 1) {
            return aBodyItems[key];
        } else {
            return 'success';
        }
    });

    return _.difference(aItems, ['success']);
}







async function arrayHasDuplicates(aArray) {
    return aArray.length != _.uniq(aArray).length;
}


















async function transposeResultArray(input, bLeaveNullColumns) {
    const output = {};
    if (input.length > 0) {
        const aColumnNames = Object.keys(input[0]);
        aColumnNames.forEach(column => output[column] = new Array(input.length));
        const iterator = input.getIterator();
        let rowNumber = 0;
        while (iterator.next()) {
            const currentRow = iterator.value();
            for (let i = 0; i < aColumnNames.length; i++) {


                output[aColumnNames[i]][rowNumber] = currentRow[aColumnNames[i]];
            }
            rowNumber++;
        }

        if (!bLeaveNullColumns) {
            aColumnNames.forEach(column => {
                if (output[column].findIndex(el => el !== null) === -1) {
                    delete output[column];
                }
            });
        }
    }
    return output;
}

async function transposeResultArrayOfObjects(input, bLeaveNullColumns) {
    const output = {};
    if (input.length > 0) {
        const temp = [];
        const aColumnNames = Object.keys(input[0]);
        aColumnNames.forEach((column, index) => temp[index] = new Array(input.length));


        const colNumbers = aColumnNames.length;
        const rowNumbers = input.length;
        for (let rowIndex = 0; rowIndex < rowNumbers; rowIndex++) {
            const sourceRow = input[rowIndex];
            for (let colIndex = 0; colIndex < colNumbers; colIndex++) {
                temp[colIndex][rowIndex] = sourceRow[aColumnNames[colIndex]];
            }
        }
        if (bLeaveNullColumns) {

            aColumnNames.forEach((column, index) => {
                output[column] = temp[index];
            });
        } else {

            aColumnNames.forEach((column, index) => {
                if (temp[index].findIndex(el => el !== null) !== -1) {
                    output[column] = temp[index];
                }
            });
        }
    }
    return output;
}
















async function Utf8ArrayToStr(utf8Array) {
    var returnString, i, len;
    var char1, char2, char3;

    returnString = '';
    len = utf8Array.byteLength;
    i = 0;
    while (i < len) {
        char1 = utf8Array[i++];
        switch (char1 >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
            returnString += String.fromCharCode(char1);
            break;
        case 12:
        case 13:
            char2 = utf8Array[i++];
            returnString += String.fromCharCode((char1 & 31) << 6 | char2 & 63);
            break;
        case 14:
            char2 = utf8Array[i++];
            char3 = utf8Array[i++];
            returnString += String.fromCharCode((char1 & 15) << 12 | (char2 & 63) << 6 | (char3 & 63) << 0);
            break;
        }
    }
    return returnString;
}
;

async function arrayBufferToString(oArrayBuffer) {
    return await Utf8ArrayToStr(new Uint8Array(oArrayBuffer));
}
;








async function replaceSpecialCharsForSQLLikeRegexpr(sImputString) {
    _.each(Constants.aRegexSpecialChars, function (oRegexSpecialChar, iIndex) {
        var regex = new RegExp(oRegexSpecialChar.specialCharReplacement, 'g');
        sImputString = sImputString.replace(regex, oRegexSpecialChar.specialCharReplacement);
    });

    return sImputString;
}
;









async function checkForNonMasterdataValues(sProperty, sValue) {
    const aBusinessObjectsProperty = [
        'ACCOUNT_GROUP_ID',
        'MATERIAL_GROUP_ID',
        'MATERIAL_TYPE_ID',
        'PLANT_ID',
        'COST_CENTER_ID',
        'ACTIVITY_TYPE_ID',
        'MATERIAL_ID'
    ];
    const aNonMasterdataValues = [
        [
            '-1',
            '-2'
        ],
        [
            '*',
            ''
        ],
        [
            '*',
            ''
        ],
        [
            '*',
            ''
        ],
        [
            '*',
            ''
        ],
        [
            '*',
            ''
        ],
        [
            '*',
            ''
        ]
    ];
    const iNonMasterdataValuesPosition = aBusinessObjectsProperty.indexOf(sProperty);
    if (aNonMasterdataValues[iNonMasterdataValuesPosition].indexOf(sValue) >= 0)
        return true;
    return false;
}

async function prepareSurchargesMasterdataValuesForValidation(aPropertiesToBeChecked, aProjectMaterialPriceSurcharges) {
    let oProjectMasterdata = await transposeResultArrayOfObjects(aProjectMaterialPriceSurcharges);
    oProjectMasterdata = _.pick(oProjectMasterdata, aPropertiesToBeChecked);
    for (property in oProjectMasterdata) {
        oProjectMasterdata[property] = _.uniq(oProjectMasterdata[property]);
        oProjectMasterdata[property] = _.filter(oProjectMasterdata[property], value => ! checkForNonMasterdataValues(property, value.toString()));
    }
    return oProjectMasterdata;
}

async function escapeStringForRegExp(sString) {
    return sString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
export default {_,Constants,XRegExp,MessageLibrary,PlcException,logError,logInfo,isPositiveInteger,IsNonNegativeInteger,toPositiveInteger,isNullOrUndefined,isNullOrUndefinedOrEmpty,isPlainObject,isEmptyObject,getValueOnKey,arrayToLowerCase,toObject,setErrorResponse,boolToInt,splitIncrementalString,findFirstUnusedSuffixInStringArray,validatePath,hasForwardSlash,getEntityIdFromPath,findFirstUnusedSuffix,setNonEmptyProperties,setDefaultValuesForCalculationVersion,validateAddinVersionString,checkParameterString,checkStringSQLInjection,deepFreeze,unsuccessfulItemsDbOperation,arrayHasDuplicates,transposeResultArray,transposeResultArrayOfObjects,Utf8ArrayToStr,arrayBufferToString,replaceSpecialCharsForSQLLikeRegexpr,checkForNonMasterdataValues,prepareSurchargesMasterdataValuesForValidation,escapeStringForRegExp};
