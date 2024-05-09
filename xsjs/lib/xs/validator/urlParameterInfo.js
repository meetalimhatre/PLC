/**
 * Instances of this class encapsulate data to describe a valid parameter for service request. Currently supported are only name, data 
 * type and isMandatory, but the implementation of the UrlValidator can be easily extended to also support the other properties.
 *
 * @constructor
 *
 * @param {string}
 *            sName - The name of the URL parameter (to access its content)
 * @param {string}
 *            sDataType - The data type of the URL parameter (String, Boolean, PositiveInteger, UTCTimestamp, ...)
 * @param {boolean}
 *            bMandatory - Define if the URL parameter is mandatory for the request execution
 * @param {object|array}
 *            oServiceParameterValues - An object or array defining the valid value enumeration for the URL parameter,
 *                                      e.g. ['value 1', 'value 2'] or {Value1: 'value 1', Value2: 'value 2'}
 */
function UrlParameterInfo(sName, sDataType, bMandatory, oServiceParameterValues) {
    
    this.name = sName;
    this.dataType = sDataType;
    this.isMandatory = bMandatory;
    this.upperBound = undefined;
    this.lowerBound = undefined;
    this.validValues = oServiceParameterValues || {};
}

UrlParameterInfo.prototype = Object.create(UrlParameterInfo.prototype);
UrlParameterInfo.prototype.constructor = UrlParameterInfo;

module.exports.UrlParameterInfo = UrlParameterInfo;