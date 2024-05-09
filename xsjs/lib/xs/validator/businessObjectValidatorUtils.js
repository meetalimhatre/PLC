const _ = require("lodash");
const helpers = require("../util/helpers");
const GenericSyntaxValidator = require("./genericSyntaxValidator").GenericSyntaxValidator;

const MessageLibrary = require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;
const MessageDetails = MessageLibrary.Details;

const sIsManualRegex = /^CUST_[A-Z][A-Z0-9_]*_IS_MANUAL$/;
const sUserIdRegex = /((^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*)(@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7})?$)/;
const iUserIdMaxLen = 256;

function logError(msg) {
    helpers.logError(msg);
}

function BusinessObjectValidatorUtils(sBusinessObject, oGenericSyntaxValidator) {

	var genericSyntaxValidator = oGenericSyntaxValidator || new GenericSyntaxValidator();

	this.tryParseJson = function(sToParse) {
		try {
			var oBody = JSON.parse(sToParse);
		} catch (e) {
			const sLogMessage = `Cannot parse string during validation of ${sBusinessObject}. Error: ${e.message}`;
			logError(sLogMessage);
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
		}
		return oBody;
	};
	 
	this.checkEmptyBody = function(oBody) {
		if (oBody === undefined || oBody === null) {
			return;
		}
		var sBodyContent = _.isFunction(oBody.asString) ? oBody.asString() : oBody.toString();
		if (sBodyContent !== "") {
			const sLogMessage = `Expected an empty body during validation of ${sBusinessObject}, but the body contained ${sBodyContent.length} characters.`;
			logError(sLogMessage);
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
		}
	};

	/**
	 * Checks if an entity contains a set of mandatory properties. Two different check modes are distinguished in order to support the
	 * different requirements for updating (mandatory properties must not set to null) or creating (mandatory properties must be contained)
	 * an entity. See <code>sMode</code> parameter for details.
	 * 
	 * @param oEntity -
	 *            The entity that needs to be checked for mandatory properties.
	 * @param aMandatoryProperites -
	 *            List of mandatory properties for the entity.
	 * @param sMode?
	 *            {string} - Following modes are allowed:
	 *            <code>included</code> the mandatory property must be contained in <code>oEntity</code> with a value which is not null. 
	 *			  <code>notNull</code> the value for this property in <code>oEntity</code> cannot be null, but it is not required that <code>oEntity</code> contains the property. This parameter is optional. If not set
	 *            	<code>included</code> is assumed as mode.
	 *            <code>includedWithBlanks</code> like included, but blanks (like "") are allowed 
	 *            
	 * 
	 * @throws {PlcException} -
	 *             if a mandatory property is missing or set to null
	 */
	this.checkMandatoryProperties = function(oEntity, aMandatoryProperites, sMode) {
		sMode = sMode || "included";
		if (!_.includes([ "included", "notNull", "includedWithBlanks" ], sMode)) {
			const sLogMessage = `Unsupported check mode for mandatory properties: ${sMode}.`;
			logError(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}

		var fChecker;
		switch (sMode){
			case "included":
				fChecker = function(oEntity, sProperty) {
					return _.has(oEntity, sProperty) && oEntity[sProperty] !== null && oEntity[sProperty] !== "";
				};
				break;
			case "notNull":
				fChecker = function(oEntity, sProperty) {
					if (_.has(oEntity, sProperty)) {
						return oEntity[sProperty] !== null && oEntity[sProperty] !== "";
					}
					return true;
				};
				break;
			case "includedWithBlanks":
				fChecker = function(oEntity, sProperty) {
					return _.has(oEntity, sProperty) && oEntity[sProperty] !== null;
				};
			break;			
		}

		_.each(aMandatoryProperites, function(sMandatoryProperty) {
			if (!fChecker(oEntity, sMandatoryProperty)) {
				const sLogMessage = `Mandatory property ${sMandatoryProperty} ${sMode === 'included' ? 'is missing' : 'was set to null'} (business object: ${sBusinessObject}). The mandatory properties are ${aMandatoryProperites.toString()}.`;
				logError(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
		});
	};

	this.checkInvalidProperties = function(oEntity, aValidProperties) {
		var aInvalidProperties = _.keys(_.omit(oEntity, aValidProperties));

		if (aInvalidProperties.length > 0) {
			const sLogMessage = `Found invalid properties during validation of ${sBusinessObject}: ${aInvalidProperties.toString()}.`;
			logError(sLogMessage);
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
		}
	};

	/**
	 * If the object contains USER_ID, then check whether user id is valid, including: 
	 * - if the use id exceeds the max length 256
	 * - if the user id doesn't match the IDP email address regular expression
	 * 
	 * @param oObject -
	 *            The object who may contains user id that needs to be checked for max length and regular expression.
	 * @param operation -
	 *            The operation such as: CREATE, READ, UPDATE, DELETE
	 * @param sObjectType -
	 * 			  The object type such as: privilegeObject or groupObject.
	 * @param aResultErrors -
	 *            The array used to collect errors.
	 * 
	 */

	this.checkUserId = function(oObject, operation, sObjectType, aResultErrors) {
		if (_.has(oObject, "USER_ID")) {
			const sUserId = oObject.USER_ID;
			if (sUserId.length > iUserIdMaxLen) {
				const sLogMessage = `User Id ${sUserId} exceeds the maximum length 256.`;
				logError(sLogMessage);
				this.createMultipleValidationErrorsResponse(
					Code.GENERAL_VALIDATION_ERROR.code,
					operation,
					sObjectType,
					oObject,
					ValidationInfoCode.VALUE_ERROR,
					aResultErrors
				);
				return;
			}
			if (!sUserIdRegex.test(sUserId)) {
				const sLogMessage = `User Id ${sUserId} doesn't match the regular expression.`;
				logError(sLogMessage);
				this.createMultipleValidationErrorsResponse(
					Code.GENERAL_VALIDATION_ERROR.code,
					operation,
					sObjectType,
					oObject,
					ValidationInfoCode.VALUE_ERROR,
					aResultErrors
				);
			}
		}
	};

	
	/**
	 * Collect error info in an array container.
	 * 
	 * @param errorMessageCode -
	 *            The error message code such as GENERAL_VALIDATION_ERROR
	 * @param operation -
	 *            The operation such as: CREATE, READ, UPDATE, DELETE
	 * @param sObjectType -
	 * 			  The object type such as: privilegeObject or groupObject.
	 * @param oObject -
	 * 			  The object entity.
	 * @param validationInfoCode -
	 * 			  The validation info code such as: VALUE_ERROR.
	 * @param aResultErrors -
	 *            The array used to collect errors.
	 * 
	 */
	
	this.createMultipleValidationErrorsResponse = function(errorMessageCode, operation, sObjectType, oObject, validationInfoCode, aResultErrors) {
		var oResult = {};
		oResult.code = errorMessageCode;
		oResult.severity = MessageLibrary.Severity.ERROR;
		oResult.operation = operation;
		oResult.details = {};
		oResult.details[sObjectType] = {};
		oResult.details[sObjectType] = oObject;
		oResult.validationInfoCode = validationInfoCode;
		aResultErrors.push(oResult);
	}
	
	/**
	 * Makes common checks of entity properties, including:
	 * - if mandatory properties are available. The check of mandatory fields is done with the option "includedWithBlanks", which means that also the blanks ("") are accepted as value.
	 * - if no other properties than valid are available
	 * - if the properties of the entity have certain format
	 * 
	 * @param oEntity -
	 *            The entity (object from request), for which the properties are checked.
	 * @param aMandatoryProperites -
	 *            list with names of mandatory properties for the entity.
	 * @param aValidProperties - 
	 * 			list with names of valid properties
	 * @param oValidPropertyFormat - 
	 * 			object describing the the format of the properties. It has following format:
	 * 			{<Property>: [<param1>, <param2>, <param3>]}, where param1...param3 are parameters expected by genericSyntaxValidator 
	 * 
	 * @throws {PlcException} -
	 *             if a some property is not valid
	 */	
	this.checkArrayProperties = function(oEntity, aMandatoryProperites, aValidProperties, oValidPropertyFormat) {
		this.checkMandatoryProperties(oEntity, aMandatoryProperites, "includedWithBlanks");
		this.checkInvalidProperties(oEntity, aValidProperties);
		
		// check if property values have the valid format
		_.mapValues(oEntity, function(val, key) {
			if(oValidPropertyFormat.hasOwnProperty(key)){
				let aFormatProperties = oValidPropertyFormat[key];
				oEntity[key] = genericSyntaxValidator.validateValue(val, aFormatProperties[0], aFormatProperties[1], aFormatProperties[2]);
			}
		});
	};
	
	/** 
	 * Parses the project details request and makes common checks of it
	 * 
	 * @param oRequest - 
	 * 			request object
	 * @param bEmptyArrayAllowed - 
	 * 			sets if empty array allowed for details
	 * @returns -
	 * 			parsed array of request objects 
	 */
	this.parseCheckProjectDetails = function(oRequest, bEmptyArrayAllowed) {
		bEmptyArrayAllowed = bEmptyArrayAllowed || false;
		var aProjectDetails = this.tryParseJson(oRequest.body.asString());
		
		if (!_.isArray(aProjectDetails)) {
			const sClientMsg = `Cannot validate because the request body is not an array. `;
			const sServerMsg = `${sClientMsg} ${oRequest.body.asString()}`;
			logError(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
		}
		
		if (bEmptyArrayAllowed === true && aProjectDetails.length === 0) {
			const sLogMessage = `Request body must be a non empty array.`;
			logError(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		
		return aProjectDetails;
	};

    this.getMetadataAttributeKey = function(oInput, sPropertyKey) {
        return [sPropertyKey, oInput.metadata[0].PATH, oInput.categoryId, oInput.subitemState].toString();
    };
	const oPropertyMetadataCache = new Map();
	const oPropertyMetadataAttributesCache = new Map();
    /**
	 * Validates the structure of a given object based on metadata properties.
	 * An object is valid if:
	 *  - each of its attributes correspond to the metadata structure defined for it
	 *  - it contains all the mandatory fields
	 *  - the values for each attribute are correct and valid for their data type
	 *  - it doesn't contain any read only fields that are not allowed
	 * @param {object}
	 *            oInput - the object that needs to be validated
	 *
	 * @throws {PlcException} -
	 *              if any attributes of the object are invalid (are not found in the metadata, are found multiple times in the metadata)
	 *              if any attributes of the object are not allowed in the given context
	 *              if the given object contains any read only fields
	 * 
	 * OBS:
	 * In order to improve performance of checkEntity there were used maps with the role of caching already valiated property keys and attributes.
	 * The map oPropertyMetadataCache contains the property metadata of a given column id.
	 * The map oPropertyMetadataAttributesCache contains the property metadata attributes of the combination of COLUMN_ID, CATEGORY_ID, SUBITEM_STATE.
	 * These maps are only updated if no errors occur durring the validation. They were used in order to avoid costing filtering over the whole metadata.
	 * This object should be given to garbage collection, if it's not needed anymore due to the high memory footprint of the caching
	*/
	this.checkEntity = function(oInput) {
	    const that = this;
		if (oInput.entity === undefined || oInput.categoryId === undefined || oInput.subitemState === undefined || oInput.metadata === undefined) {
			const sLogMessage = "Malformed input object for this function. Please check if all properties are correctly set.";
			logError(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
        
		var oValidatedEnity = {};
		_.each(oInput.entity, function(oPropertyValue, sPropertyKey) {
		    var aPropertyMetadata = null;
		    var aPropertyMetadataAttributes = null;
		    const sMetadataAttributeKey = that.getMetadataAttributeKey(oInput, sPropertyKey);
		    if(oPropertyMetadataAttributesCache.has(sMetadataAttributeKey)) {
		        aPropertyMetadata = oPropertyMetadataCache.get(sPropertyKey);
                aPropertyMetadataAttributes = oPropertyMetadataAttributesCache.get(sMetadataAttributeKey);
		    } else {
                aPropertyMetadata = _.filter(oInput.metadata, function(oPropertyMetadataEntry) {
				    return oPropertyMetadataEntry.COLUMN_ID === sPropertyKey;
			    });
    			if (aPropertyMetadata.length === 0) {
    				const sLogMessage = `Not able to find property ${sPropertyKey} in metadata during validation of ${sBusinessObject}.`;
    				logError(sLogMessage);
    				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
    			}
    			if (aPropertyMetadata.length > 1) {
    				const sLogMessage = `Ambiguous metadata and column_id ${sPropertyKey} during validation of ${sBusinessObject}.`;
    				logError(sLogMessage);
    				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
    			}
                aPropertyMetadataAttributes = _.filter(aPropertyMetadata[0].ATTRIBUTES, function(oAttributeMetadata) {
    			    return oAttributeMetadata.ITEM_CATEGORY_ID == oInput.categoryId && oAttributeMetadata.SUBITEM_STATE === oInput.subitemState;
    		    });
    			if (aPropertyMetadataAttributes.length === 0) {
    				const sLogMessage = `Property ${sPropertyKey} not allowed in current context (category: ${oInput.categoryId}, SUBITEM_STATE: ${oInput.subitemState}) during the validation of ${sBusinessObject}.`;
    				logError(sLogMessage);
    
    				// TODO Vladimir: Workaround: we do not throw an exception here since otherwise the metadata for all attributes should be
    				// available. Instead, we ignore this and remove the attribute from the object.
    				delete oInput.entity[sPropertyKey];
    				return;
    			}
    			if (aPropertyMetadataAttributes.length > 1) {
    				const sLogMessage = `Ambiguous metadata attributes for property ${sPropertyKey} not allowed in current context (category: ${oInput.categoryId},SUBITEM_STATE: ${oInput.subitemState}) during the validation of ${sBusinessObject}.`;
    				logError(sLogMessage);
    				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
    			}
    
    			// is property allowed to be contained in the request even it is a known one?; => check if it is read-only and transferable
    			// property
    			if (aPropertyMetadataAttributes[0].IS_READ_ONLY === 1 && aPropertyMetadataAttributes[0].IS_TRANSFERABLE !== 1) {
    				if(aPropertyMetadataAttributes[0].SUBITEM_STATE !==1 || aPropertyMetadata[0].ROLLUP_TYPE_ID === 0 || 
    				aPropertyMetadata[0].IS_CUSTOM !==1 || (!sIsManualRegex.exec(aPropertyMetadata[0].COLUMN_ID)) || oPropertyValue !== 0){
    				const sLogMessage = `Property ${sPropertyKey} is read-only for current context (category: ${oInput.categoryId}, SUBITEM_STATE: ${oInput.subitemState}) during the validation of ${sBusinessObject}.`;
    				logError(sLogMessage);
    				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
    			}
    			}
    			oPropertyMetadataCache.set(sPropertyKey, aPropertyMetadata);
                oPropertyMetadataAttributesCache.set(sMetadataAttributeKey, aPropertyMetadataAttributes);
            }

			// validate syntactical correctness using the GenericSyntaxValidator
			oValidatedEnity[sPropertyKey] = genericSyntaxValidator.validateValue(oPropertyValue, aPropertyMetadata[0].SEMANTIC_DATA_TYPE,
					aPropertyMetadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES, false, aPropertyMetadata[0].VALIDATION_REGEX_VALUE);
		});

		// final check is to ensure that no mandatory properties are missing; for this the metadata is re-iterated and all mandatory
		// properties are collected in a list; the validated entity is checked against this list to ensure that all mandatory are present
		var aManadatoryProperties = [];
		oInput.metadata.forEach(oPropertyMetadata => {
		    var bIsMandatory = _.some(oPropertyMetadata.ATTRIBUTES, function(oPropertyMetadataAtttribute) {
				return oPropertyMetadataAtttribute.ITEM_CATEGORY_ID === oInput.categoryId && // 
				oPropertyMetadataAtttribute.SUBITEM_STATE === oInput.subitemState && // 
				oPropertyMetadataAtttribute.IS_MANDATORY === 1;
			});
			if (bIsMandatory === true) {
				aManadatoryProperties.push(oPropertyMetadata.COLUMN_ID);
			}
		});
		this.checkMandatoryProperties(oValidatedEnity, aManadatoryProperties, oInput.mandatoryPropertyCheckMode);

		return oValidatedEnity;
	};

	this.checkNonTemporaryMasterdataReferences = function(oEntity, aMasterdataProperties, oValidValuesSet) {
		aMasterdataProperties.forEach(sMasterdataProperty => {
			var mdValue = oEntity[sMasterdataProperty];
			if (mdValue !== undefined && mdValue !== null && !oValidValuesSet.has(mdValue)) {
				const sLogMessage = `Error while checking masterdata reference of property ${sMasterdataProperty}. The value '${mdValue}' is not valid. Temporary values are not allowed.`;
				logError(sLogMessage);
				throw new PlcException(Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR, sLogMessage);
			}
		});
	};
	
	this.checkNonTemporaryMasterdataReferencesForItems = (oEntity, aMasterdataProperties, oValidValuesSet, businessObjectType) => {
	    let aErrors = [];
		aMasterdataProperties.forEach(sMasterdataProperty => {
			var mdValue = oEntity[sMasterdataProperty];
			if (mdValue !== undefined && mdValue !== null && !oValidValuesSet.has(mdValue)) {
			    aErrors.push({itemId : oEntity.ITEM_ID, businessObjectType: businessObjectType, columnId: sMasterdataProperty});
			}
        });
		return aErrors;
	};
	
    /**
	 * This function receives a metadata object containing standard and custom fields.
	 * The custom fields are stored in metadata as : CUST_FLD, CUST_FLD_UNIT. From the frontend, when a custom field is updated,
	 * we can receive fields like: CUST_FLD_MANUAL, CUST_FLD_UNIT, CUST_FLD_IS_MANUAL. We need to extend the metadata array, in order to add
	 * CUST_FLD_MANUAL and CUST_FLD_IS_MANUAL. In this way we can do the checks (valid property checks, type checks)
	 * 
	 * @param oMetaData
	 *            {object} - metadata object containing standard and custom fields.
	 * 
	 * @returns {object} - metadata object containing standard and all custom fields (containing *MANUAL,*IS_MANUAL)
	 */
	this.extendMetadataCustomFields = function(oMetaData) {
		
		const sColRegex = /^CUST_[A-Z][A-Z0-9_]*$/;
        var aCustomFields = _.filter(oMetaData, function(oPropertyMetadata) {
            return oPropertyMetadata.IS_CUSTOM == 1 && oPropertyMetadata.UOM_CURRENCY_FLAG != 1;
        });               
        _.each (aCustomFields, function(oPropertyValue) {
            
            var columnName =  oPropertyValue.COLUMN_ID;
            var aCustAttr = _.clone(oPropertyValue.ATTRIBUTES);
             _.each (oPropertyValue.ATTRIBUTES, function(oPropertyValueAttr, index) {
                 oPropertyValue.ATTRIBUTES[index].COLUMN_ID = oPropertyValueAttr.COLUMN_ID + '_MANUAL';
             });
             
            oPropertyValue.COLUMN_ID = columnName + '_MANUAL';
            
            if(sColRegex.exec(oPropertyValue.COLUMN_ID)) {
            	var oCustField = {};
                oCustField.COLUMN_ID = columnName + '_IS_MANUAL';
                oCustField.SEMANTIC_DATA_TYPE = 'BooleanInt';
                oCustField.IS_CUSTOM = oPropertyValue.IS_CUSTOM;
                oCustField.ROLLUP_TYPE_ID = oPropertyValue.ROLLUP_TYPE_ID;
                _.each (aCustAttr, function(oPropertyValueAttr, index) {
                	aCustAttr[index].COLUMN_ID = oPropertyValueAttr.COLUMN_ID + '_IS_MANUAL';
                });
                oCustField.ATTRIBUTES = aCustAttr;
                oMetaData.push(oCustField);
            }
        });
        
        return oMetaData;
	};

	/*
	 * Get Unit Custom Fields
	 */
	this.getUnitFields = function(oMetaData,propertyType){
		var aCustomFields = _.filter(oMetaData, function(oPropertyMetadata) {
            return oPropertyMetadata.IS_CUSTOM == 1 && oPropertyMetadata.UOM_CURRENCY_FLAG == 1 && oPropertyMetadata.PROPERTY_TYPE == propertyType;
        });
		var aFields = [];
		_.each (aCustomFields, function(oPropertyValue){
			aFields.push(oPropertyValue.COLUMN_ID);
		});
		return aFields;
	};
	
	/*
	 * Get Unit Of Measure Custom Fields
	 */
	this.getCustomUoMFields = function(oMetaData){
		return this.getUnitFields(oMetaData,6);
	};
	
	/*
	 * Get Currency Custom Fields
	 */
	this.getCustomCurrencyFields = function(oMetaData){
		return this.getUnitFields(oMetaData,7);
	};
	
	
	/**
	 * Check a column and its value using metadata object
	 *
	 * @param  aMetadata  {object}          - metadata object
	 * @param  sColumnName  {string}        - column name
	 * @param  oColumnValue {primary type}  - column value
	 * @throws {PlcException}               - if column name or column value type are invalid
	 */
	this.checkColumn = function(aMetadata,sColumnName,oColumnValue, bCheckRegEx){		 
		 var aColumnMetadata = _.filter(aMetadata, function(oMetadataEntry) {
			 return oMetadataEntry.COLUMN_ID === sColumnName;
	     });
		
		 if (aColumnMetadata.length === 0) {
	         const oMessageDetails = new MessageDetails();
	         oMessageDetails.validationObj = {"columnId":sColumnName, "validationInfoCode": ValidationInfoCode.METADATA_ERROR};
	             
	 		 const sLogMessage = `Unknown property: ${sColumnName}.`;
			  logError(sLogMessage);
			 throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);		 
	     }
		 
		 if (aColumnMetadata.length > 1) {
             const oMessageDetails = new MessageDetails();
             oMessageDetails.validationObj = {"columnId":sColumnName, "validationInfoCode": ValidationInfoCode.METADATA_ERROR};
             
	 		 const sLogMessage = `Ambiguous metadata for column_id ${sColumnName}`;
			  logError(sLogMessage);
			 throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
	     }
	    
	    if (helpers.isNullOrUndefined(bCheckRegEx)) 
	        bCheckRegEx = true; 
	    if(bCheckRegEx){
	        genericSyntaxValidator.validateValue(oColumnValue, aColumnMetadata[0].SEMANTIC_DATA_TYPE, aColumnMetadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES, false, aColumnMetadata[0].VALIDATION_REGEX_VALUE);
	    }else{
	        genericSyntaxValidator.validateValue(oColumnValue, aColumnMetadata[0].SEMANTIC_DATA_TYPE, aColumnMetadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES, false, null);
	    }       
	};
}
BusinessObjectValidatorUtils.prototype = Object.create(BusinessObjectValidatorUtils.prototype);
BusinessObjectValidatorUtils.prototype.constructor = BusinessObjectValidatorUtils;

module.exports.BusinessObjectValidatorUtils = BusinessObjectValidatorUtils;