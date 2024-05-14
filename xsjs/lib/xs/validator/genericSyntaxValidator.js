const XRegExp = require('xregexp');
const helpers = require('../util/helpers');
const SQLMaximumInteger = require('../util/constants').SQLMaximumInteger;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;

async function logError(msg) {
    helpers.logError(msg);
}

/**
 * Instances of this class check given values if belong to a specified data type. The following data types are supported:
 * <ul>
 * <li>Decimal: fractional numbers with precision and scale (example: Decimal(20, 5) where as 20 is the precision and 5 the scale)</li>
 * <li>String: anything that can be represented as string with a defined max. length (example: String(5) defines a string with the max.
 * length of 5 characters)</li>
 * <li>Boolean: boolean values "true" and "false", everything else is not allowed</li>
 * <li>BooleanInt: boolean values are represented integer values 0 (false) and 1 (true)</li>
 * <li>Integer: any integer number (positive or negative)</li>
 * <li>PositiveInteger: any positive integer number (zero included)</li>
 * <li>NegativeInteger: any negative integer number (zero excluded)</li>
 * <li>UTCTimestamp: any timestamp in the ISO8601 format without timezone offset! </li>
 * <li>LocalDate: any date in the ISO8601 notation for dates (YYYY-MM-DD)</li>
 * </ul>
 *
 * All validations are based on regular expressions and therewith any given value is transformed in its string-based representation first.
 * This approach was chosen due to the limitations of JavaScript when it comes to primitive data type handling. If a value cannot be checked
 * against a given data type a ValidationException is raised.
 *
 * @constructor
 *
 */
async function GenericSyntaxValidator() {


    /**
	 * Validates a given values if they correspond syntactically to a given data type. <code>null</code> or <code>undefined</code>
	 * values are allowed as long the value is not marked as mandatory.
	 *
	 * @param {any}
	 *            value - the value which shall be validated (<code>null</code> or <code>undefined</code> references are possible)
	 * @param {string}
	 *            sDataType - the data type against which shall be validated
	 * @param {boolean}
	 *            bMandatory - indicates if the given value is mandatory, if <code>true</code> and the given value is <code>null</code>
	 *            or <code>undefined</code> a ValidationException is raised; if <code>false</code> and the given value is
	 *            <code>null</code> or <code>undefined</code> the validation is passed without any further checks
	 * @returns {any} returns the validated value in the correct data type (example: if "1" is given as value and it shall be validated
	 *          against the data type Integer validation will succeed and 1 is returned; in case of LocalDate and UTCTimestamp Date-objects
	 *          are returned).
	 *
	 * @throws {PlcException} -
	 *             if the given value is <code>null</code> or <code>undefined</code> but bMandatory is true or if the value cannot be
	 *             validated against the given data type
	 * OBS:
	 * In order to improve performance, for this function were added several maps with the role of caching already validated values and already parsed data types.
	 * To avoid parsing the data type for each call, the already parsed data types are stored in maps and at the time of the call if they exist in the cache, then they are retrieved
	 * Also, for each value that is validated the cache specific for its data type is updated. In this way, there is no need to revalidate a validated value.
	 * This object should be given to garbage collection, if it's not needed anymore due to the high memory footprint of the caching
	 */

    this.validateValue = async function (value, sDataType, sTypeAttributes, bMandatory, sRegex) {
        if (value !== undefined && value !== null) {
            let oTypeDetails = null;
            const sDataTypeTrimmed = sDataType.trim();
            // because the String and Decimal have different type attributes, the key used for them in the caching map is their type attribute
            // since the other data types do not use specific type attribues, they were used as keys for the caching map
            if ((sDataTypeTrimmed === 'Decimal' || sDataTypeTrimmed === 'String' || sDataTypeTrimmed === 'Link') && oParseDataTypeCache.has(sTypeAttributes)) {
                oTypeDetails = oParseDataTypeCache.get(sTypeAttributes);
            } else {
                oTypeDetails = oParseDataTypeCache.get(sDataTypeTrimmed) || await parseDataType(sDataTypeTrimmed, sTypeAttributes);
            }
            switch (oTypeDetails.name) {
            case 'Decimal':
                return oValidateDecimalCache.has(value) ? oValidateDecimalCache.get(value) : await validateDecimal(value, oTypeDetails);
            case 'Link':
            case 'String':
                var sValueKey = value.toString().concat(oTypeDetails.length.toString());
                return oValidateStringCache.has(sValueKey) ? oValidateStringCache.get(sValueKey) : await validateString(value, oTypeDetails, sRegex);
            case 'Boolean':
                return oValidateBooleanCache.has(value) ? oValidateBooleanCache.get(value) : await validateBoolean(value, oTypeDetails);
            case 'BooleanInt':
                return oValidateeBooleanIntCache.has(value) ? oValidateeBooleanIntCache.get(value) : await validateBooleanInt(value, oTypeDetails);
            case 'Integer':
                return oValidateIntegerCache.has(value) ? oValidateIntegerCache.get(value) : await validateInteger(value, oTypeDetails);
            case 'PositiveInteger':
                return oValidatePositiveIntegerCache.has(value) ? oValidatePositiveIntegerCache.get(value) : await validatePositiveInteger(value, oTypeDetails);
            case 'NegativeInteger':
                return oValidateNegativeIntegerCache.has(value) ? oValidateNegativeIntegerCache.get(value) : await validateNegativeInteger(value, oTypeDetails);
            
            // because Date objects are mutable, cloning was needed as a precaution in order to avoid modifying more than 1 date object at once
            case 'UTCTimestamp':
                return oValidateUTCTimestampCache.has(value) ? new Date(oValidateUTCTimestampCache.get(value).getTime()) : await validateUTCTimestamp(value, oTypeDetails);
            case 'LocalDate':
                return oValidateLocalDateCache.has(value) ? new Date(oValidateLocalDateCache.get(value).getTime()) : await validateLocalDate(value, oTypeDetails);
            default: {
                    const sLogMessage = `Cannot validate values of data type '${ oTypeDetails.name }'.`;
                    await logError(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                }
            }
        } else {
            if (bMandatory === true) {
                const sLogMessage = 'Mandatory value was undefined or null.';
                await logError(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }
            // if a value is undefined or null => null should be returned; on
            // the one side the new data base api cannot
            // handle undefined values (they need to be null) and on the other
            // side null is also more semantically
            // correct: a validated value always belongs to a property; this
            // value can be empty (value == null)
            // but the property cannot be unknown (value == undefined)
            return null;
        }
    };
    const oParseDataTypeCache = new Map();
    async function parseDataType(sDataTypeTrimmed, sTypeAttributes) {
        if (sDataTypeTrimmed.indexOf('Decimal') === 0) {
            var aPrecisionMatch = mDataTypeAttributesRegExp.precisionPattern.exec(sTypeAttributes);
            var aScaleMatch = mDataTypeAttributesRegExp.scalePattern.exec(sTypeAttributes);
            if (aPrecisionMatch === null || aScaleMatch === null) {
                const sLogMessage = `Cannot parse data type details ${ sTypeAttributes } for data type ${ sDataTypeTrimmed }.`;
                await logError(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }

            var iPrecision = parseInt(aPrecisionMatch[1], 10);
            var iScale = parseInt(aScaleMatch[1], 10);
            // rule for precision p and scale s: 0 <= s <= p <= 38
            // see: https://help.sap.com/saphelp_hanaplatform/helpdata/en/20/a1569875191014b507cf392724b7eb/content.htm
            if (iPrecision > 38 || iScale > iPrecision || iScale < 0) {
                const sLogMessage = `Invalid precision and/or scale ${ sTypeAttributes } for data type ${ sDataTypeTrimmed } (0 <= s <= p <= 38).`;
                await logError(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
            oParseDataTypeCache.set(sTypeAttributes, {
                name: sDataTypeTrimmed,
                precision: iPrecision,
                scale: iScale
            });
            return {
                name: sDataTypeTrimmed,
                precision: iPrecision,
                scale: iScale
            };
        } else if (sDataTypeTrimmed.indexOf('String') === 0) {
            var iLength = -1;
            var bUppercase = false;
            if (sTypeAttributes !== null && sTypeAttributes !== undefined && sTypeAttributes !== '') {

                var aLengthMatch = mDataTypeAttributesRegExp.lengthPattern.exec(sTypeAttributes);
                var aUppercaseMatch = mDataTypeAttributesRegExp.uppercasePattern.exec(sTypeAttributes);
                if (aLengthMatch == null) {
                    const sLogMessage = `Cannot parse data type details ${ sTypeAttributes } for data type ${ sDataTypeTrimmed }.`;
                    await logError(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                }
                if (sTypeAttributes.indexOf('uppercase') > -1 && aUppercaseMatch == null) {
                    const sLogMessage = `Uppercase value from semantic data type attributes ${ sTypeAttributes } should be 0 or 1.`;
                    await logError(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_ERROR, sLogMessage);
                }
                iLength = parseInt(aLengthMatch[1], 10);
                bUppercase = aUppercaseMatch !== null ? aUppercaseMatch[1] === '1' : false;
            }
            oParseDataTypeCache.set(sTypeAttributes, {
                name: sDataTypeTrimmed,
                length: iLength,
                uppercase: bUppercase
            });
            return {
                name: sDataTypeTrimmed,
                length: iLength,
                uppercase: bUppercase
            };
        } else if (sDataTypeTrimmed.indexOf('Link') === 0) {
            var iLength = -1;
            if (sTypeAttributes !== null && sTypeAttributes !== undefined && sTypeAttributes !== '') {
                var aLengthMatch = mDataTypeAttributesRegExp.lengthPattern.exec(sTypeAttributes);
                if (aLengthMatch == null) {
                    const sLogMessage = `Cannot parse data type details ${ sTypeAttributes } for data type ${ sDataTypeTrimmed }.`;
                    await logError(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                }
                iLength = parseInt(aLengthMatch[1], 10);
            }
            oParseDataTypeCache.set(sTypeAttributes, {
                name: sDataTypeTrimmed,
                length: iLength
            });
            return {
                name: sDataTypeTrimmed,
                length: iLength
            };
        } else if (sDataTypeTrimmed.indexOf('Boolean') === 0 && sDataTypeTrimmed.indexOf('BooleanInt') === -1) {
            oParseDataTypeCache.set(sDataTypeTrimmed, { name: sDataTypeTrimmed });
            return { name: sDataTypeTrimmed };
        } else if (sDataTypeTrimmed.indexOf('BooleanInt') === 0) {
            oParseDataTypeCache.set(sDataTypeTrimmed, { name: sDataTypeTrimmed });
            return { name: sDataTypeTrimmed };
        } else if (sDataTypeTrimmed.indexOf('Integer') === 0) {
            oParseDataTypeCache.set(sDataTypeTrimmed, { name: sDataTypeTrimmed });
            return { name: sDataTypeTrimmed };
        } else if (sDataTypeTrimmed.indexOf('PositiveInteger') === 0) {
            oParseDataTypeCache.set(sDataTypeTrimmed, { name: sDataTypeTrimmed });
            return { name: sDataTypeTrimmed };
        } else if (sDataTypeTrimmed.indexOf('NegativeInteger') === 0) {
            oParseDataTypeCache.set(sDataTypeTrimmed, { name: sDataTypeTrimmed });
            return { name: sDataTypeTrimmed };
        } else if (sDataTypeTrimmed.indexOf('UTCTimestamp') === 0) {
            oParseDataTypeCache.set(sDataTypeTrimmed, { name: sDataTypeTrimmed });
            return { name: sDataTypeTrimmed };
        } else if (sDataTypeTrimmed.indexOf('LocalDate') === 0) {
            oParseDataTypeCache.set(sDataTypeTrimmed, { name: sDataTypeTrimmed });
            return { name: sDataTypeTrimmed };
        } else {
            const sLogMessage = `Unknown data type '${ sDataTypeTrimmed }'.`;
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
    }
    /**
 * For each validate* function there were added maps that are storing the values that are already validated in order to improve the performance
*/
    const oValidateDecimalCache = new Map();
    async function validateDecimal(value, oTypeDetails) {
        var sValue = value.toString();
        if (!mValueRegExp.Decimal.test(sValue)) {
            const sLogMessage = `Value '${ sValue }' cannot be parsed as Decimal.`;
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
        }

        // check precision and scale of the value (use unsigned value for this
        // in case it is negative)
        var sUnsignedValue = sValue.indexOf('-') === 0 ? sValue.substring(1) : sValue;
        var aSplitedNumber = sUnsignedValue.split('.');

        // precision is the number of all digits (whole + fractional digits); hence, whole digits = p - s;
        // the scale is the number of factional digits
        // see https://help.sap.com/saphelp_hanaplatform/helpdata/en/20/a1569875191014b507cf392724b7eb/content.htm
        var iMaxWholeDigits = oTypeDetails.precision - oTypeDetails.scale;
        var iMaxFractionalDigits = oTypeDetails.scale;

        var iValueWholeDigits = aSplitedNumber[0].length;
        var iValueFractionalDigits = aSplitedNumber.length == 2 ? aSplitedNumber[1].length : 0;

        if (iValueWholeDigits > iMaxWholeDigits) {
            const sClientMsg = `Value exceeded the maximum number of ${ iMaxWholeDigits } whole digits (precision = ${ oTypeDetails.precision }, scale = ${ oTypeDetails.scale }).`;
            const sServerMsg = `${ sClientMsg } Value: '${ sValue }'.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        if (iValueFractionalDigits > iMaxFractionalDigits) {
            const sClientMsg = `Value exceeded the maximum number of ${ iMaxFractionalDigits } fractional digits (precision = ${ oTypeDetails.precision }, scale = ${ oTypeDetails.scale }).`;
            const sServerMsg = `${ sClientMsg } Value: '${ sValue }'.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }

        // decimals should be returned as string, since their conversion to float would change the data under some circumstances; also the 
        // new db api treats decimals as string for this reason
        oValidateDecimalCache.set(value, sValue);
        return sValue;
    }

    const oValidateStringCache = new Map();
    async function validateString(value, oTypeDetails, sRegex) {
        var sValueKey = value.toString().concat(oTypeDetails.length.toString());
        var sValue = value.toString();

        // check string length only if the type details length parameter is >0;		
        if (oTypeDetails.length > 0 && sValue.length > oTypeDetails.length) {
            const sClientMsg = `String is too long (max. length: ${ oTypeDetails.length }).`;
            const sServerMsg = `${ sClientMsg } String: '${ sValue }'.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);

        }

        if (oTypeDetails.uppercase === true) {
            var sUpperValue = value.toUpperCase();
            if (value !== sUpperValue) {
                const sClientMsg = `Metadata uppercase value was set to ${ oTypeDetails.uppercase }, but string value is not uppercase.`;
                const sServerMsg = `${ sClientMsg } String: ${ value }.`;
                await logError(sServerMsg);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }
        }

        //check if regex is maintained in metadata for this field and validate value against regex
        if (!helpers.isNullOrUndefined(sRegex)) {
            var pattern = XRegExp(sRegex);
            if (!pattern.test(sValue)) {
                let oMessageDetails = new MessageDetails();
                oMessageDetails.validationObj = { 'validationInfoCode': ValidationInfoCode.INVALID_CHARACTERS_ERROR };

                const sLogMessage = `The entry contains invalid characters. Please use only characters matching the regular expression ${ sRegex }`;
                await logError(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }

        }
        oValidateStringCache.set(sValueKey, sValue);
        return sValue;
    }

    const oValidateBooleanCache = new Map();
    async function validateBoolean(value, oTypeDetails) {
        var sValue = value.toString().trim();
        if (!mValueRegExp.Boolean.test(sValue)) {
            const sClientMsg = 'Value is not a valid Boolean';
            const sServerMsg = `${ sClientMsg } Value: ${ sValue }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        oValidateBooleanCache.set(value, sValue === 'true');
        return sValue === 'true';
    }

    const oValidateeBooleanIntCache = new Map();
    async function validateBooleanInt(value, oTypeDetails) {

        var sValue = value.toString().trim();
        if (!mValueRegExp.BooleanInt.test(sValue)) {
            const sClientMsg = 'Value is not a valid BooleanInt.';
            const sServerMsg = `${ sClientMsg } Value: ${ sValue }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        oValidateeBooleanIntCache.set(value, parseInt(sValue, 10));
        return parseInt(sValue, 10);
    }

    const oValidateIntegerCache = new Map();
    async function validateInteger(value, oTypeDetails) {
        let iValue = null;
        if (typeof value === 'string') {
            // trimming is necessary in order to potential white space characters before or after integer number; 
            // was decided to accept such input
            var sTrimmedValue = value.trim();
            if (!mValueRegExp.Integer.test(sTrimmedValue)) {
                const sClientMsg = 'Value contains illegal characters for an integer.';
                const sServerMsg = `${ sClientMsg } Value: ${ value }.`;
                await logError(sServerMsg);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }
            iValue = parseInt(value, 10);
        } else if (typeof value == 'number') {
            iValue = value;
        } else {
            const sClientMsg = `Value is of type ${ typeof value }, which cannot be handled as integer.`;
            const sServerMsg = `${ sClientMsg } Value: ${ value }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }

        if (isNaN(iValue)) {
            const sClientMsg = `Value cannot be parsed as integer or is NaN.`;
            const sServerMsg = `${ sClientMsg } Value: ${ value }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        if (!Number.isInteger(iValue)) {
            const sClientMsg = `Value is not an integer.`;
            const sServerMsg = `${ sClientMsg } Value: ${ value }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        if (iValue > SQLMaximumInteger || iValue < -SQLMaximumInteger) {
            const sClientMsg = `Numeric overflow - value is not supported by SQL.`;
            const sServerMsg = `${ sClientMsg } Value: ${ value }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        oValidateIntegerCache.set(value, iValue);
        return iValue;
    }

    const oValidatePositiveIntegerCache = new Map();
    async function validatePositiveInteger(value, oTypeDetails) {
        var iValue = await validateInteger(value, oTypeDetails);
        if (iValue < 0) {
            const sClientMsg = `Value is lower than zero and thus not a positive integer.`;
            const sServerMsg = `${ sClientMsg } Value: ${ value }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        oValidatePositiveIntegerCache.set(value, iValue);
        return iValue;
    }

    const oValidateNegativeIntegerCache = new Map();
    async function validateNegativeInteger(value, oTypeDetails) {
        var iValue = await validateInteger(value, oTypeDetails);
        if (iValue >= 0) {
            const sClientMsg = `Value is higher than -1 and thus not a negative integer.`;
            const sServerMsg = `${ sClientMsg } Value: ${ value }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        oValidateNegativeIntegerCache.set(value, iValue);
        return iValue;
    }

    async function checkYearMonthDateMilliseconds(sValue, oUTCDate, iInputYear, iInputMonth, iInputDate, iUTCMilliseconds) {
        // check if the date of Date-object correspond to the given date of
        // sValue
        // this is necessary, because Date.parse() can lead to a date overflow
        // (example Date.parse("2015-02-29") =>
        // 2015-03-01)	    
        if (iInputYear !== oUTCDate.getUTCFullYear()) {
            const sClientMsg = `Value is semantically incorrect (year overflow or invalid).`;
            const sServerMsg = `${ sClientMsg } Value: ${ sValue }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        if (iInputMonth !== oUTCDate.getUTCMonth()) {
            const sClientMsg = `Value is semantically incorrect (month overflow or invalid).`;
            const sServerMsg = `${ sClientMsg } Value: ${ sValue }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        if (iInputDate !== oUTCDate.getUTCDate()) {
            const sClientMsg = `Value is semantically incorrect (date overflow or invalid).`;
            const sServerMsg = `${ sClientMsg } Value: ${ sValue }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
        if (isNaN(iUTCMilliseconds)) {
            const sClientMsg = `Value cannot be converted into a Date-object.`;
            const sServerMsg = `${ sClientMsg } Value: ${ sValue }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
    }

    const oValidateUTCTimestampCache = new Map();
    async function validateUTCTimestamp(value, oTypeDetails) {
        var sValue = value.toString().trim();
        var aUTCParts = mValueRegExp.UTCTimestamp.exec(sValue);

        if (aUTCParts === null) {
            const sClientMsg = `Value cannot be parsed as UTC timestamp.`;
            const sServerMsg = `${ sClientMsg } Value: ${ sValue }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }

        const iInputYear = parseInt(aUTCParts[1], 10);
        const iInputMonth = parseInt(aUTCParts[5], 10) - 1;
        const iInputDate = parseInt(aUTCParts[6], 10);
        // Date.parse recognizes time zone information, if the date string is
        // given in ISO8601; with the RegEx we ensure that only ISO8601
        // complaint WITHOUT time zone information are accepted; Date.parse
        // assumes UTC and returns UTC milliseconds
        const iUTCMilliseconds = Date.parse(sValue);
        var oUTCDate = new Date(iUTCMilliseconds);

        await checkYearMonthDateMilliseconds(sValue, oUTCDate, iInputYear, iInputMonth, iInputDate, iUTCMilliseconds);
        oValidateUTCTimestampCache.set(value, oUTCDate);
        return oUTCDate;
    }

    const oValidateLocalDateCache = new Map();
    async function validateLocalDate(value, oTypeDetails) {
        var sValue = value.toString().trim();
        var aDateParts = mValueRegExp.LocalDate.exec(sValue);

        if (aDateParts === null) {
            const sClientMsg = `Value cannot be parsed as LocalDate.`;
            const sServerMsg = `${ sClientMsg } Value: ${ sValue }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }

        // use explicit parsing of the date values, due to variances in the
        // interpretation (not really 100% relevant for
        // us, but to be on the safe-side);
        // use Date.UTC() to the UTC time stamp for sure and not the server's
        // local time accidently
        const iInputYear = parseInt(aDateParts[1], 10);
        const iInputMonth = parseInt(aDateParts[2], 10) - 1;
        const iInputDate = parseInt(aDateParts[3], 10);
        const iUTCMilliseconds = Date.UTC(iInputYear, iInputMonth, iInputDate);
        var oUTCDate = new Date(iUTCMilliseconds);

        await checkYearMonthDateMilliseconds(sValue, oUTCDate, iInputYear, iInputMonth, iInputDate, iUTCMilliseconds);
        oValidateLocalDateCache.set(value, oUTCDate);
        return oUTCDate;
    }

    var mDataTypeAttributesRegExp = Object.freeze({
        lengthPattern: /length\s*=\s*(\d+)\s*;?/,
        precisionPattern: /precision\s*=\s*(\d+)\s*;?/,
        scalePattern: /scale\s*=\s*(\d+)\s*;?/,
        uppercasePattern: /uppercase\s*=\s*(1|0)\s*;?\s*$/
    });

    var mValueRegExp = Object.freeze({
        'Decimal': /^0$|^(?:\-)?[0-9]+[0-9]*(?:\.[0-9]+)?$/,
        'Boolean': /^true$|^false$/,
        'BooleanInt': /^0$|^1$/,
        'Integer': /^0$|^-?[1-9]+[0-9]*$/,
        'PositiveInteger': /^0$|^[1-9]+[0-9]*$/,
        'NegativeInteger': /^-[1-9]+[0-9]*$/,
        'UTCTimestamp': /^([\+-]?\d{4}(?!\d{2}\b))(-(((0[1-9]|1[0-2])-([12]\d|0[1-9]|3[01])))((([T](([01]\d)|([2][0-3]))):(([0-5]\dZ)|([0-5]\d:[0-5]\dZ)|([0-5]\d:[0-5]\d\.\d{1,3}Z)))|(([T]24)?:(00|(00:00)|(00:00\.0{1,3}[Z])))))$/,
        'LocalDate': /^(\d{4})-(\d{2})-(\d{2})(T00:00:00(.000)?([zZ])?)?$/
    });
}
GenericSyntaxValidator.prototype = Object.create(GenericSyntaxValidator.prototype);
GenericSyntaxValidator.prototype.constructor = GenericSyntaxValidator;

module.exports.GenericSyntaxValidator = GenericSyntaxValidator;
export default {XRegExp,helpers,SQLMaximumInteger,MessageLibrary,PlcException,Code,MessageDetails,ValidationInfoCode,logError,GenericSyntaxValidator};
