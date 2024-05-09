var _ = require('lodash');
var BusinessObjectValidatorUtils = require('../validator/businessObjectValidatorUtils').BusinessObjectValidatorUtils;
var helpers = require('./helpers');

function excludeLowerForDates(sProperty) {
    const aDateProperties = [
        '_VALID_FROM',
        '_VALID_TO',
        'CREATED_ON',
        'LAST_MODIFIED_ON'
    ];
    return aDateProperties.includes(sProperty) ? `((${ sProperty })` : `(lower(${ sProperty })`;
}

async function UrlToSqlConverter() {
    var oValidationUtils = await new BusinessObjectValidatorUtils();

    /**
	 * Convert to SQL format and parse data used in filtering selections
	 * 
	 * @param   {string} sFilter - filter string(e.g:(CONTROLLING_AREA=ABC&_VALID_FROM>2000&CONTROLLING_AREA=DEF))
	 * @param	{array} aMetadata - business object's metadata
	 * @returns {string} sResult - parsed string (e.g.: {"(CONTROLLING_AREA LIKE 'ABC' OR CONTROLLING_AREA LIKE 'DEF') AND _VALID_FROM > '2000'"})
	 */
    this.convertToSqlFormat = async function (sFilter, aMetadata) {
        var sResult = '';
        var oParsedString = {};
        sFilter = sFilter.replace(/\*/g, '%');
        //perform aValidation for SQL Injection
        // search sValidation_list in string received from front-end
        await helpers.checkStringSQLInjection(sFilter);

        oParsedString = await parseFilterString(sFilter, aMetadata);

        //build return string sResult
        sResult = await buildSqlString(oParsedString.FieldValueOperator, oParsedString.FieldValueOperatorExclude, oParsedString.StrSplitLength, oParsedString.FieldValueOperatorExcludeLength);
        return sResult;
    };

    /** 
	 * Parse data used in filtering selections
	 * 
	 * @param   {string} sFilter - filter string(e.g:(CONTROLLING_AREA=ABC&_VALID_FROM>2000&CONTROLLING_AREA=DEF))
	 * @param	{array} aMetadata - business object's metadata
	 */
    async function parseFilterString(sFilter, aMetadata) {
        var oResult = {};
        var aStrSplit = sFilter.split('&');     //entries will be separated by &
        var iSearchResult;
        var iStrSplitLength = aStrSplit.length;

        oResult.FieldValueOperator = new Array(iStrSplitLength);
        oResult.FieldValueOperatorExclude = new Array(iStrSplitLength);
        oResult.StrSplitLength = iStrSplitLength;

        iSearchResult = '';
        aStrSplit.sort();

        // build matrix with columns FIELD , VALUE and OPERATOR
        oResult.FieldValueOperator = (await buildStringMatrixAndValidate(aStrSplit, aMetadata)).aFieldValueOperator;
        oResult.FieldValueOperatorExclude = (await buildStringMatrixAndValidate(aStrSplit, aMetadata)).aFieldValueOperatorExclude;
        oResult.FieldValueOperatorExcludeLength = (await buildStringMatrixAndValidate(aStrSplit, aMetadata)).iFieldValueOperatorExcludeLength;

        return oResult;
    }

    /**
	 * Function buildSqlString is building the filtering string used in procedure calls (e.g.: ('CONTROLLING_AREA LIKE ''ABC'' OR CONTROLLING_AREA LIKE ''DEF'') AND _VALID_FROM > ''2000''})
	 * 
	 * @param   {array} 	aFieldValueOperator - two dimensional array with columns Field Value Operator MetadataType - contains all entries exept excluded entries
	 * @param   {array} 	aFieldValueOperatorExclude - two dimensional array with columns Field Value Operator MetadataType - contains only excluded entries
	 * @param   {integer} 	iStrSplitLength - number of filtering conditions
	 * @param   {integer} 	iFieldValueOperatorExcludeLength - number of excluded conditions
	 * @returns {string} 	sResult - filtering string used in procedure calls 
	 */
    async function buildSqlString(aFieldValueOperator, aFieldValueOperatorExclude, iStrSplitLength, iFieldValueOperatorExcludeLength) {
        var sResult = '';
        var bSeparator_open = false;
        var bSeparator_close = false;
        for (var i = 0; i < iStrSplitLength - iFieldValueOperatorExcludeLength; i++) {
            // add brackets where same column is used multiple times
            // if bracket should be closed then add AND separator and reset separator flags
            if (bSeparator_close == true) {
                sResult = sResult.concat(') AND ');
                bSeparator_close = false;
                bSeparator_open = false;
            }
            if (i < iStrSplitLength - iFieldValueOperatorExcludeLength - 1) {
                // if current FIELD is the same as the next one for the first time concatenate ( in result			
                if (aFieldValueOperator[i][0] == aFieldValueOperator[i + 1][0]) {
                    if (bSeparator_open !== true) {
                        bSeparator_open = true;
                        sResult = sResult.concat('(');
                    }
                }
                // if next field is different than current field and separator was opened set flag for closing separator 
                if (aFieldValueOperator[i][0] !== aFieldValueOperator[i + 1][0] && bSeparator_open == true) {
                    bSeparator_close = true;
                }
            }
            if (aFieldValueOperator[i][3] !== 'Decimal') {
                if (aFieldValueOperator[i][2] == '=') {
                    aFieldValueOperator[i][2] = 'LIKE';
                }
                sResult = sResult.concat(`lower(${ aFieldValueOperator[i][0] }) ${ aFieldValueOperator[i][2] } lower('${ aFieldValueOperator[i][1].replace(/_/g, '__') }') ESCAPE '_'`);
            } else {
                aFieldValueOperator[i][1] = await parseDecimal(aFieldValueOperator[i][1]);
                sResult = sResult.concat(`lower(${ aFieldValueOperator[i][0] }) ${ aFieldValueOperator[i][2] } ${ aFieldValueOperator[i][1] }`);
            }

            // logic for last item
            if (i == iStrSplitLength - iFieldValueOperatorExcludeLength - 1) {
                if (bSeparator_close == true || bSeparator_open == true) {
                    sResult = sResult.concat(')');
                    bSeparator_close = false;
                    bSeparator_open = false;
                }
            } else {
                // if brackets are opened and next field is the same as the current, the aOperator used is OR
                if (bSeparator_open == true && bSeparator_close == false) {
                    sResult = sResult.concat(' OR ');
                }
                if (bSeparator_open == false && bSeparator_close == false) {
                    sResult = sResult.concat(' AND ');
                }
            }
        }
        //		add final entries where condition was != ( NOT LIKE ) with AND aOperator	
        for (var m = 0; m < iFieldValueOperatorExcludeLength; m++) {
            if (await isNumber(aFieldValueOperatorExclude[m][3]) === true) {
                if (aFieldValueOperatorExclude[m][2] == '!=') {
                    aFieldValueOperatorExclude[m][2] = '<>';
                }
            } else {
                if (aFieldValueOperatorExclude[m][2] == '!=') {
                    aFieldValueOperatorExclude[m][2] = 'NOT LIKE';
                }
            }
            if (m == 0 && iFieldValueOperatorExcludeLength == iStrSplitLength) {
                if (await isNumber(aFieldValueOperatorExclude[m][3]) === true) {
                    aFieldValueOperatorExclude[m][1] = await parseDecimal(aFieldValueOperatorExclude[m][1]);
                    sResult = sResult.concat(`(lower(${ aFieldValueOperatorExclude[m][0] }) ${ aFieldValueOperatorExclude[m][2] } ${ aFieldValueOperatorExclude[m][1] }`);
                } else {
                    if (aFieldValueOperatorExclude[m][2] === 'LIKE' || aFieldValueOperatorExclude[m][2] === 'NOT LIKE') {
                        sResult = sResult.concat(`${ await excludeLowerForDates(aFieldValueOperatorExclude[m][0]) } ${ aFieldValueOperatorExclude[m][2] } lower('${ aFieldValueOperatorExclude[m][1].replace(/_/g, '__') }') ESCAPE '_'`);
                    } else {
                        sResult = sResult.concat(`${ await excludeLowerForDates(aFieldValueOperatorExclude[m][0]) } ${ aFieldValueOperatorExclude[m][2] } lower('${ aFieldValueOperatorExclude[m][1] }')`);
                    }
                }
            } else {
                if (await isNumber(aFieldValueOperatorExclude[m][3]) === true) {
                    aFieldValueOperatorExclude[m][1] = await parseDecimal(aFieldValueOperatorExclude[m][1]);
                    sResult = sResult.concat(` AND (lower(${ aFieldValueOperatorExclude[m][0] }) ${ aFieldValueOperatorExclude[m][2] } ${ aFieldValueOperatorExclude[m][1] }`);
                } else {
                    if (aFieldValueOperatorExclude[m][2] === 'LIKE' || aFieldValueOperatorExclude[m][2] === 'NOT LIKE') {
                        sResult = sResult.concat(` AND ${ await excludeLowerForDates(aFieldValueOperatorExclude[m][0]) } ${ aFieldValueOperatorExclude[m][2] } lower('${ aFieldValueOperatorExclude[m][1].replace(/_/g, '__') }') ESCAPE '_'`);
                    } else {
                        sResult = sResult.concat(` AND ${ await excludeLowerForDates(aFieldValueOperatorExclude[m][0]) } ${ aFieldValueOperatorExclude[m][2] } lower('${ aFieldValueOperatorExclude[m][1] }')`);
                    }
                }
            }
            if (aFieldValueOperatorExclude[m][2] === '<>' || aFieldValueOperatorExclude[m][2] === 'NOT LIKE') {
                sResult = sResult.concat(` or ${ aFieldValueOperatorExclude[m][0] } is null )`);
            } else {
                sResult = sResult.concat(` ) `);
            }
        }
        return sResult;
    }


    /**Function buildStringMatrixAndValidate returns two arrays that have all filtering conditions in format Field Value Operator
	 * 
	 * @param     {aStrSplit} aFieldValueOperator - each entry from this array is a filtering condition in frontend (eg. CONTROLLING_AREA_ID=1000)
	 * @param     {object}    aMetadata      - metadata object
	 * @returns   {array} 	  aFieldValueOperator - two dimensional array with columns Field Value Operator MetadataType- contains all entries except excluded entries
	 * @returns   {array} 	  aFieldValueOperatorExclude - two dimensional array with columns Field Value Operator - contains only excluded entries
	 **/
    async function buildStringMatrixAndValidate(aStrSplit, aMetadata) {
        // build matrix with columns FIELD , VALUE and OPERATOR	
        var iStrSplitLength = aStrSplit.length;
        var aFieldValueOperator = new Array(iStrSplitLength);
        var aFieldValueOperatorExclude = new Array(iStrSplitLength);
        var sOperator_list = '!=,<=,>=,<,>,=';   //composed values first, simple values last
        var aOperator = sOperator_list.split(',');
        var iFieldValueOperatorExcludeLength = 0;
        var iSearchResult;
        var sValue;
        for (var i = 0; i < iStrSplitLength; i++) {
            // search for aOperator
            for (var j = 0, operator_length = aOperator.length; j < operator_length; j++) {
                iSearchResult = aStrSplit[i].search(aOperator[j]);
                if (iSearchResult !== -1) {
                    break;
                }
            }
            // build final arrays aFieldValueOperator and aFieldValueOperatorExclude
            // in aFieldValueOperatorExclude add fields with aOperator NOT LIKE (!=)
            if (aOperator[j] == '!=' || aOperator[j] == '<=' || aOperator[j] == '>=' || aOperator[j] == '>' || aOperator[j] == '<') {
                aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength] = new Array(3);
                aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength] = aStrSplit[i].split(aOperator[j]);
                // replace % with * when "*" is explicitly searched as value and not as wildcard
                if (aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength][1] == '%') {
                    aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength][1] = '*';
                }
                aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength]['2'] = aOperator[j];  // add operator found in the result
                aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength]['3'] = await getMetadataType(aMetadata, aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength]['0']);
                if (aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength]['3'] !== 'LocalDate' && aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength]['3'] !== 'UTCTimestamp') {
                    sValue = aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength][1];
                    sValue = sValue.replace(/\%/g, '');
                    // hack for bypassing regex when filter is used ( string injection is already checked in administration validator )
                    oValidationUtils.checkColumn(aMetadata, aFieldValueOperatorExclude[iFieldValueOperatorExcludeLength][0], sValue.toUpperCase(), false);
                }
                iFieldValueOperatorExcludeLength++;
            } else {
                aFieldValueOperator[i - iFieldValueOperatorExcludeLength] = new Array(3);
                aFieldValueOperator[i - iFieldValueOperatorExcludeLength] = aStrSplit[i].split(aOperator[j]);
                // replace % with * when "*" is explicitly searched as value and not as wildcard
                if (aFieldValueOperator[i - iFieldValueOperatorExcludeLength][1] == '%') {
                    aFieldValueOperator[i - iFieldValueOperatorExcludeLength][1] = '*';
                }
                aFieldValueOperator[i - iFieldValueOperatorExcludeLength]['2'] = aOperator[j];  // add opeartor found in the result
                aFieldValueOperator[i - iFieldValueOperatorExcludeLength]['3'] = await getMetadataType(aMetadata, aFieldValueOperator[i - iFieldValueOperatorExcludeLength]['0']);
                if (aFieldValueOperator[i - iFieldValueOperatorExcludeLength]['3'] !== 'LocalDate' && aFieldValueOperator[i - iFieldValueOperatorExcludeLength]['3'] !== 'UTCTimestamp') {
                    sValue = aFieldValueOperator[i - iFieldValueOperatorExcludeLength][1];
                    sValue = sValue.replace(/\%/g, '');
                    //  hack for bypassing regex when filter is used ( string injection is already checked in administration validator )
                    oValidationUtils.checkColumn(aMetadata, aFieldValueOperator[i - iFieldValueOperatorExcludeLength][0], sValue.toUpperCase(), false);
                }
            }
        }
        return {
            aFieldValueOperatorExclude: aFieldValueOperatorExclude,
            aFieldValueOperator: aFieldValueOperator,
            iFieldValueOperatorExcludeLength: iFieldValueOperatorExcludeLength
        };
    }


    /**
	 * Parse decimal values for filter
	 *
	 * @param  sValue  {string}             - string containing number
	 * @returns   {string}                  - string containing number with decimal
	 */
    function parseDecimal(sValue) {
        if (sValue.indexOf('.') == -1) {
            sValue = sValue + '.0';
        }
        return sValue;
    }


    /**
	 * Get semantic data type of a column using metadata object and column name
	 *
	 * @param  aMetadata  {object}          - metadata object
	 * @param  sColumnName  {string}        - column name
	 * @returns   {string}                  - semantic data type of a field
	 */
    function getMetadataType(aMetadata, sColumnName) {
        var sSemantincDataType;
        var aColumnMetadata = _.filter(aMetadata, function (oMetadataEntry) {
            return oMetadataEntry.COLUMN_ID === sColumnName;
        });

        return sSemantincDataType = aColumnMetadata[0].SEMANTIC_DATA_TYPE;
    }

    /**
	 * Check if the value used in the filter is a number
	 * @param sPropertyType {string}	- property type of the value to be checked
	 * @returns {boolean}				- true if the value used is a number, false otherwise
	 */
    function isNumber(sPropertyType) {
        return sPropertyType === 'Decimal' || sPropertyType.indexOf('Integer') !== -1;
    }
}
UrlToSqlConverter.prototype = await Object.create(UrlToSqlConverter.prototype);
UrlToSqlConverter.prototype.constructor = UrlToSqlConverter;

module.exports.UrlToSqlConverter = UrlToSqlConverter;
export default {_,BusinessObjectValidatorUtils,helpers,excludeLowerForDates,UrlToSqlConverter};
