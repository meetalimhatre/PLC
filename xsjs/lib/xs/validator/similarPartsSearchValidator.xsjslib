const _ = $.require("lodash");
const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;
const helpers = $.require("../util/helpers");

const MessageLibrary = $.require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;

const PersistencySimilarParts = $.require("../db/persistency-similarPartsSearch");

const aMandatoryPropertiesMetadata = ["Attributes", "Source"];
const aMandatoryPropertiesMetadataAttributes = ["Name", "Value", "Weight", "IsFuzzySearch"];
const aMandatoryPropertiesMetadataPattern = ["Value", "Groups"];
const aMandatoryPropertiesMetadataGroup = ["Index", "Name", "Weight", "Dict"];
const aMandatoryPropertiesMetadataDict = ["Key", "Value"];
const aMandatoryPropertiesMetadataTimeRange = ["FromTime", "ToTime"];

function SimilarPartsSearchValidator(oPersistency, metadataProvider, utils) {

	// Supported fuzzy search tables
	const SupportedCalculationVersionTables = _.values(PersistencySimilarParts.CalculationVersionTables);
	const SupportedMasterDataTables = _.values(PersistencySimilarParts.MasterDataTables);

	// Supported business object types
	const BusinessObjectTypes = PersistencySimilarParts.SupportedBusinessObjectTypes;

	// Supported sql types in similar parts search
	const SupportedSqlTypes = _.values(PersistencySimilarParts.SupportedSqlTypes).join(",").split(",");
	const SupportedDateTypes = _.values(PersistencySimilarParts.SupportedSqlTypes.Date).join(",").split(",");

	const SimilarPartsSourceTypes = PersistencySimilarParts.SimilarPartsSourceTypes;

	// Supported score functions for numeric numbers
	const SupportedScoreFunctions = PersistencySimilarParts.SupportedScoreFunctions;
	const DefaultScoreFunction = PersistencySimilarParts.DefaultScoreFunction;

	let genericSyntaxValidator = new GenericSyntaxValidator();
	this.validate = function(oRequest) {
		switch (oRequest.method) {
			case $.net.http.POST:
				return validateSearchRequests();
			default:
			{
				const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		function validateSearchRequests() {
			let aSearchRequests;
			let aValidSearchRequests = [],
				bIsBatchSearch = false;
			try {
				aSearchRequests = utils.tryParseJson(oRequest.body.asString());
			} catch (e) {
				const sLogMessage = `Cannot parse string to JSON for metadata. Tried to parse: ${oRequest.body.asString()}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}

			validateIsNonEmptyArray(aSearchRequests, "RequestBody");

			if (aSearchRequests.length > 1) {
				bIsBatchSearch = true;
			}

			_.each(aSearchRequests, function(oSearchRequest) {
				let aAttributeNames = [];
				utils.checkMandatoryProperties(oSearchRequest, aMandatoryPropertiesMetadata);

				//for batch Search, CALCULATION_VERSION_ID is required
				if (bIsBatchSearch) {
					utils.checkMandatoryProperties(oSearchRequest, ["CALCULATION_VERSION_ID"]);
				}
				if (!helpers.isNullOrUndefined(oSearchRequest.CALCULATION_VERSION_ID)) {
					validateValue(oSearchRequest.CALCULATION_VERSION_ID, "Integer", "CALCULATION_VERSION_ID");
				}
				if (!helpers.isNullOrUndefined(oSearchRequest.ITEM_ID)) {
					validateValue(oSearchRequest.ITEM_ID, "Integer", "ITEM_ID");
				}
				validateIsNonEmptyArray(oSearchRequest.Attributes, "Attributes");
				validateSupportedColumnsAndDataTypes(oSearchRequest.Attributes);
				_.each(oSearchRequest.Attributes, function(oAttribute) {
					validateAttribute(oAttribute, aAttributeNames);
				});

				let oSource = oSearchRequest.Source;
				if (!helpers.isPlainObject(oSource) || _.isEmpty(oSource)) {
					const sLogMessage = "Source is an empty object.";
					throwErrors(oSource, ["Source"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
				}
				validateSource(oSource, oSearchRequest);
				aValidSearchRequests.push(oSearchRequest);
			});
			return aValidSearchRequests;
		}

		function validateAttribute(oAttribute, aAttributeNames) {
			let oPattern = oAttribute.Pattern;
			utils.checkMandatoryProperties(oAttribute, aMandatoryPropertiesMetadataAttributes);

			validateValue(oAttribute.Name, "String", "Attribute.Name");
			aAttributeNames.push(oAttribute.Name);
			validateDuplicatedAttributeNames(aAttributeNames);
			validateWeight(oAttribute.Weight);
			validateValue(oAttribute.IsFuzzySearch, "BooleanInt", "IsFuzzySearch");

			//check valid pattern when IsFuzzySearch === 0
			if (oAttribute.IsFuzzySearch === 0) {
				utils.checkMandatoryProperties(oAttribute, ["Pattern"]);
				utils.checkMandatoryProperties(oPattern, aMandatoryPropertiesMetadataPattern);
				validateValue(oPattern.Value, "String", "Pattern.Value");
				if (!oPattern.Value.match(/\([^()]+\)/g) || !oAttribute.Value.match(new RegExp(oPattern.Value))) {
					const sLogMessage = "Value of Pattern is not a valid substring_regexpr.";
					throwErrors(oPattern.Value, ["Pattern.Value"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
				}

				validateIsNonEmptyArray(oPattern.Groups, "oPattern.Groups");
				let iMatchedGroupsLength = oAttribute.Value.match(new RegExp(oPattern.Value)).length - 1;
				if (iMatchedGroupsLength < oPattern.Groups.length) {
					const sLogMessage = "Value of Pattern doesn't match Groups length.";
					throwErrors(oPattern, ["Pattern.Value", "Pattern.Groups"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
				}
				_.each(oPattern.Groups, function(oGroup) {
					validateGroup(oGroup, aAttributeNames, iMatchedGroupsLength);
				});
			}

			if (!helpers.isNullOrUndefined(oAttribute.Option)) {
				validateSearchOptions(oAttribute.Option);
			}
			// Setup default values for unset options using input value
			validateSearchValueAndSetupDefaultOptions(oAttribute);
		}

		/**
		 * Get metadata information for supported business objects in similar parts request by metadataProvider.
		 *
		 * @param {array}
		 * 			aAttributes	- attributes in similar parts request
		 */
		function getMetadataForSupportedBussinesObjects() {
			let oItemMetadata = metadataProvider.get(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null, null, oPersistency, $.getPlcUsername(), $.getPlcUsername());
			let oMaterialMetadata = metadataProvider.get(BusinessObjectTypes.Material, BusinessObjectTypes.Material, null, null, oPersistency, $.getPlcUsername(), $.getPlcUsername());
			let oMaterialPriceMetadata = metadataProvider.get(BusinessObjectTypes.MaterialPrice, BusinessObjectTypes.MaterialPrice, null, null, oPersistency, $.getPlcUsername(), $.getPlcUsername());
			let oSupportedMetadata = _.union(oItemMetadata, oMaterialMetadata, oMaterialPriceMetadata);
			return utils.extendMetadataCustomFields(oSupportedMetadata);
		}

		/**
		 * Get database information for input attributes in similar parts request, and check supported data types.
		 *
		 * @param {array}
		 * 			aAttributes	- attributes in similar parts request
		 */
		function getColumnPropertyForInputAttributes(aAttributes) {
			let aColumnNames = aAttributes.map(oAttr => { return oAttr.Name; });
			let sQueryStatement = `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE_NAME, SCALE FROM SYS.TABLE_COLUMNS
					WHERE SCHEMA_NAME = CURRENT_SCHEMA
					AND TABLE_NAME IN ('${SupportedCalculationVersionTables.join("', '")}', '${SupportedMasterDataTables.join("', '")}')
					AND COLUMN_NAME IN ('${aColumnNames.join("', '")}')`;
			let oResult = oPersistency.getConnection().executeQuery(sQueryStatement);
			let oIterator = oResult.getIterator();
			let aConvertedAttributes = [];
			while (oIterator.next()) {
				let oRow = oIterator.value();
				let sDataType = (oRow["DATA_TYPE_NAME"] === "DECIMAL" && oRow["SCALE"] !== null) ? "FixedDecimal" : oRow["DATA_TYPE_NAME"];
				// Check attribute's data types, and throw exception if similar parts doesn't support this type.
				if (!_.includes(SupportedSqlTypes, sDataType)) {
					const sLogMessage = `Similar parts search doesn't support ${sDataType} on column name ${oRow["COLUMN_NAME"]}.`;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
				}
				oRow.SourceType = _.includes(SupportedCalculationVersionTables, oRow["TABLE_NAME"]) ? 
					SimilarPartsSourceTypes.CalculationVersions : SimilarPartsSourceTypes.MasterData;
				oRow.DataType = sDataType;
				aConvertedAttributes.push(oRow);
			}
			return aConvertedAttributes;
		}

		/**
		 * Check data type, source table, and metadata information of attributes in similar parts request,
		 * and validate whether data type is supported.
		 * This step will add some properties for input attributes. The updated attributes look like:
		 * [
		 * 	{
		 * 		"Name": "MATERIAL_ID",
		 * 		"Value": "A 504 700 00 01",
		 * 		"Weight": 0.551589726091116,
		 * 		"IsFuzzySearch": 1,
		 * 		"PropertyMap": [
		 * 			{
		 * 				"SourceType": "calculationversions",
		 * 				"DataType": "NVARCHAR",
		 * 				"Metadata": [{BUSINESS_OBJECT: "Item", IS_CUSTOM: 0}]
		 * 			},
		 * 			{
		 * 				"SourceType": "masterdata",
		 * 				"DataType": "NVARCHAR",
		 * 				"Metadata": [{BUSINESS_OBJECT: "Material", IS_CUSTOM: 0}]
		 * 			}
		 * 		],
		 * 		"TableSource": [ 'item', 'material']
		 * 	}
		 * ]
		 * @param {array}
		 * 			aAttributes	- attributes in similar parts request
		 */
		function validateSupportedColumnsAndDataTypes(aAttributes) {
			let oMetadata = getMetadataForSupportedBussinesObjects();
			let aConvertedAttributes = getColumnPropertyForInputAttributes(aAttributes);
			_.each(aAttributes, function(oAttr) {
				// Verify whether the attribute is from metadata
				let aSourceBusinessObjects = _.filter(oMetadata, function(oPropertyMetadata) {
					return oPropertyMetadata.COLUMN_ID === oAttr.Name;
				});
				if (aSourceBusinessObjects.length === 0) {
					const sLogMessage = `Not able to find property ${oAttr.Name} in metadata.`;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
				}
				// Select 'BUSINESS_OBJECT' and 'IS_CUSTOM' property from metadata for the attribute
				let oPropertyMetadata = _.uniq(
					_.map(aSourceBusinessObjects, oBusinessObject => _.pick(oBusinessObject, 'BUSINESS_OBJECT', 'IS_CUSTOM')),
					'BUSINESS_OBJECT', 'IS_CUSTOM');

				// Verify whether the attribute is from supported tables
				let aAttrProperties = _.filter(aConvertedAttributes, oRow => oRow.COLUMN_NAME === oAttr.Name);
				if (aAttrProperties.length === 0) {
					const sLogMessage = `Not able to find property ${oAttr.Name} in items or master data tables.`;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
				}
				// Select 'SourceType' and 'DataType' property from converted attributes
				let aColumnProperties = _.uniq(_.map(aAttrProperties, oAttrProp => _.pick(oAttrProp, 'SourceType', 'DataType')), 'SourceType', 'DataType');
				_.each(aColumnProperties, oColumnProp => {
					if (oColumnProp.SourceType === SimilarPartsSourceTypes.CalculationVersions) {
						oColumnProp.Metadata = _.filter(oPropertyMetadata, oMetadata => oMetadata.BUSINESS_OBJECT === BusinessObjectTypes.Item);
					} else {
						oColumnProp.Metadata = _.filter(oPropertyMetadata, oMetadata => oMetadata.BUSINESS_OBJECT != BusinessObjectTypes.Item);
					}
				});
				oAttr.PropertyMap = aColumnProperties;
				oAttr.TableSource = _.uniq(_.map(aAttrProperties, 'TABLE_NAME'));
			});
		}

		/**
		 * Check validity of search options in score functions.
		 * Reference: https://help.sap.com/viewer/691cb949c1034198800afde3e5be6570/2.0.02/en-US/b977e9cd6fa444f28ff80aadc5cddee3.html
		 *
		 * @param {object}
		 * 			oOption	- search option for score functions
		 */
		function validateSearchOptions(oOption) {
			let sScoreFunctionName = oOption.scoreFunction;
			if (!helpers.isNullOrUndefined(oOption.scoreFunction)) {
				if(!_.includes(_.values(SupportedScoreFunctions), oOption.scoreFunction)) {
					const sLogMessage = `Similar parts search doesn't support ${oOption.scoreFunction} as score function for numeric columns.`;
					throwErrors(oOption, ["Option"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
				}
			} else {
				sScoreFunctionName = DefaultScoreFunction;
			}

			if (validateNumericValue(oOption.scoreFunctionScale, "Option.scoreFunctionScale")) {
				if ((SupportedScoreFunctions.Linear === sScoreFunctionName || SupportedScoreFunctions.Gaussian === sScoreFunctionName) &&
					(oOption.scoreFunctionScale <= 0)) {
					throwNumericErrors(oOption.scoreFunctionScale, "Option.scoreFunctionScale", 'scale > 0', sScoreFunctionName);
				}
			}
			if (validateNumericValue(oOption.scoreFunctionDecay, "Option.scoreFunctionDecay")) {
				if (SupportedScoreFunctions.Linear === sScoreFunctionName && (oOption.scoreFunctionDecay < 0 || oOption.scoreFunctionDecay >= 1)) {
					throwNumericErrors(oOption.scoreFunctionDecay, "Option.scoreFunctionDecay", '0 <= decay < 1', sScoreFunctionName);
				} else if (SupportedScoreFunctions.Gaussian === sScoreFunctionName && (oOption.scoreFunctionDecay <= 0 || oOption.scoreFunctionDecay >= 1)) {
					throwNumericErrors(oOption.scoreFunctionDecay, "Option.scoreFunctionDecay", '0 < decay < 1', sScoreFunctionName);
				}
			}
			if (validateNumericValue(oOption.scoreFunctionBase, "Option.scoreFunctionBase") &&
					(SupportedScoreFunctions.Logarithmic === sScoreFunctionName && oOption.scoreFunctionBase <= 1)) {
				throwNumericErrors(oOption.scoreFunctionBase, "Option.scoreFunctionBase", 'base > 1', sScoreFunctionName);
			}
			if (validateNumericValue(oOption.scoreFunctionOffset, "Option.scoreFunctionOffset") && oOption.scoreFunctionOffset < 0) {
				throwNumericErrors(oOption.scoreFunctionOffset, "Option.scoreFunctionOffset", 'offset >= 0', sScoreFunctionName);
			}

			function throwNumericErrors(inputValue, optionName, optionPossibleValue, scoreFunctionName) {
				const sLogMessage = `${optionName} ${inputValue} must satisfy for '${optionPossibleValue}' for ${scoreFunctionName} score function.`;
				throwErrors(inputValue, [optionName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
			}
		}

		/**
		 * Validate input search value and setup default search options for score function.
		 * Note: If request doesn't provide the search options, will use their default values;
		 * but some default values depend on search values, and so need to be validated again.
		 * Refer to: https://help.sap.com/viewer/691cb949c1034198800afde3e5be6570/2.0.02/en-US/b977e9cd6fa444f28ff80aadc5cddee3.html
		 *
		 * @param {object}
		 * 			oAttribute	- 	search attribute
		 */
		function validateSearchValueAndSetupDefaultOptions(oAttribute) {
			oAttribute.Option = _.defaults(helpers.isNullOrUndefined(oAttribute.Option) ? {} : oAttribute.Option, {
				"scoreFunction": DefaultScoreFunction
			});
			// When search attributes are DATE columns, the search option "scoreFunctionScale" and "scoreFunctionOffset" are
			// given in days, not the value of search attribute.
			if (_.includes(SupportedDateTypes, oAttribute.PropertyMap[0].DataType)) {
				_.defaults(oAttribute.Option, { "scoreFunctionScale": 365, "scoreFunctionOffset": 182, "scoreFunctionDecay": 0.5 });
				return;
			}
			_.defaults(oAttribute.Option, {"scoreFunctionOffset": 0});
			if (oAttribute.Option.scoreFunction == SupportedScoreFunctions.Logarithmic && helpers.isNullOrUndefined(oAttribute.Option.scoreFunctionBase)) {
				// If scoreFunctionBase is unset, the default value will be set to 1 + (value - scoreFunctionOffset).
				// To keep scoreFunctionBase > 1, input value must be bigger than scoreFunctionOffset (if user provides
				// scoreFunctionOffset), or input value must be bigger than 0 (if user doesn't provide scoreFunctionOffset).
				if (oAttribute.Value <= oAttribute.Option.scoreFunctionOffset || oAttribute.Value <= 0) {
					const sLogMessage = `Input search value ${oAttribute.Value} must bigger than 0 and bigger than input scoreFunctionOffset for logarithmic score function.`;
					throwErrors(oAttribute.Value, ["Attribute.Value"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
				} else {
					_.defaults(oAttribute.Option, { "scoreFunctionBase": 1 + (oAttribute.Value - oAttribute.Option.scoreFunctionOffset) });
				}
			} else if (oAttribute.Option.scoreFunction == SupportedScoreFunctions.Gaussian || oAttribute.Option.scoreFunction == SupportedScoreFunctions.Linear) {
				_.defaults(oAttribute.Option, {"scoreFunctionDecay": 0.5});
				if (helpers.isNullOrUndefined(oAttribute.Option.scoreFunctionScale)) {
					if (oAttribute.Value <= 0) {
						const sLogMessage = `Input search value ${oAttribute.Value} must > 0 (when scoreFunctionScale is unset) for linear or gaussian score function.`;
						throwErrors(oAttribute.Value, ["Attribute.Value"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
					} else {
						_.defaults(oAttribute.Option, { "scoreFunctionScale": oAttribute.Value });
					}
				}
			}
		}

		function validateGroup(oGroup, aAttributeNames, iMatchedGroupsLength) {
			utils.checkMandatoryProperties(oGroup, aMandatoryPropertiesMetadataGroup);
			validateGroupIndex(oGroup.Index, "oGroup.Index", iMatchedGroupsLength);
			validateValue(oGroup.Name, "String", "Group.Name");
			aAttributeNames.push(oGroup.Name);
			validateDuplicatedAttributeNames(aAttributeNames);
			validateWeight(oGroup.Weight);
			validateIsNonEmptyArray(oGroup.Dict, "Group.Dict");
			_.each(oGroup.Dict, function(oDict) {
				utils.checkMandatoryProperties(oDict, aMandatoryPropertiesMetadataDict);
				validateIsNonEmptyArray(oDict.Key, "Dict.Key");
				validateArrayItemsDataType(oDict.Key, 'Dict.Key', "String");
				validateValue(oDict.Value, "String", "Dict.Value");
			});
		}

		function validateSource(oSource, oSearchRequest) {
			//check timeRange is valid
			if (!helpers.isNullOrUndefined(oSource.TimeRange)) {
				utils.checkMandatoryProperties(oSource.TimeRange, aMandatoryPropertiesMetadataTimeRange);
				let fromTime = genericSyntaxValidator.validateValue(oSource.TimeRange.FromTime, "UTCTimestamp", undefined, false);
				let toTime = genericSyntaxValidator.validateValue(oSource.TimeRange.ToTime, "UTCTimestamp", undefined, false);
				if (fromTime > toTime) {
					const sLogMessage = "ToTime should be larger than FromTime. Cannot validate TimeRange.";
					throwErrors(oSource.TimeRange, ["TimeRange"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
				}
			}

			if (!helpers.isPlainObject(oSource.MasterData) && !helpers.isPlainObject(oSource.CalculationVersions)) {
				const sLogMessage = "Either valid MasterData or valid CalculationVersions should be defined.";
				throwErrors(oSource, ["oSource"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
			}
			validateMasterData(oSource.MasterData);
			validateCalculationVersions(oSource.CalculationVersions, oSearchRequest);
		}

		function validateMasterData(oMasterData) {
			if (!helpers.isNullOrUndefined(oMasterData)) {
				if (helpers.isPlainObject(oMasterData)) {
					let aMasterDataFields = [{
						"Name": "MaterialTypes",
						"Value": oMasterData.MaterialTypes,
						"DataType": "String"
					}, {
						"Name": "MaterialGroups",
						"Value": oMasterData.MaterialGroups,
						"DataType": "String"
					}];
					_.each(aMasterDataFields, function(oField) {
						//MaterialType, MaterialGroup could be undefined
						if (!helpers.isNullOrUndefined(oField.Value)) {
							validateIsArray(oField.Value, oField.Name);
							validateArrayItemsDataType(oField.Value, oField.Name, oField.DataType);
						}
					});
				} else {
					const sLogMessage = "MasterData should be a plain object.";
					throwErrors(oMasterData, ["MasterData"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
				}
			}
		}

		function validateCalculationVersions(oCalculationVersions, oSearchRequest) {
			if (!helpers.isNullOrUndefined(oCalculationVersions)) {
				if (helpers.isPlainObject(oCalculationVersions)) {
					let aCalculationVersionsFields = [{
						"Name": "ProjectIds",
						"Value": oCalculationVersions.ProjectIds,
						"DataType": "String"
					}, {
						"Name": "CalculationIds",
						"Value": oCalculationVersions.CalculationIds,
						"DataType": "Integer"
					}, {
						"Name": "CalculationVersionIds",
						"Value": oCalculationVersions.CalculationVersionIds,
						"DataType": "Integer"
					}, {
						"Name": "ExcludeCalculationVersionIds",
						"Value": oCalculationVersions.ExcludeCalculationVersionIds,
						"DataType": "Integer"
					}];
					_.each(aCalculationVersionsFields, function(oField) {
						//ProjectIds, CalculationIds, CalculationVersionIds, ExcludeCalculationVersionIDs could be undefined
						if (!helpers.isNullOrUndefined(oField.Value)) {
							validateIsArray(oField.Value, oField.Name);
							validateArrayItemsDataType(oField.Value, oField.Name, oField.DataType);
						}
					});
					if (!helpers.isNullOrUndefined(oCalculationVersions.OnlyCurrent)) {
						genericSyntaxValidator.validateValue(oCalculationVersions.OnlyCurrent, "BooleanInt", undefined, false);
						if (oCalculationVersions.OnlyCurrent) {
							utils.checkMandatoryProperties(oSearchRequest, ["CALCULATION_VERSION_ID"]);
						}
					}
				} else {
					const sLogMessage = "CalculationVersions should be a plain object.";
					throwErrors(oCalculationVersions, ["CalculationVersions"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
				}
			}
		}

		function validateDuplicatedAttributeNames(aArray) {
			if (hasRepeatedItems(aArray)) {
				const sLogMessage = "Attributes Name and Groups Name should not be duplicated.";
				throwErrors(aArray, ["Attributes.Name", "Groups.Name"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
			}
		}

		function validateWeight(fWeight) {
			if (!(typeof(fWeight) === "number") || fWeight < 0 || fWeight > 1) {
				const sLogMessage = "Weight should be a float ranging from 0 to 1. Cannot validate Weight.";
				throwErrors(fWeight, ["Weight"], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
			}
		}

		function hasRepeatedItems(aArray) {
			return !(_.uniq(aArray).length === aArray.length);
		}

		function validateArrayItemsDataType(aArray, sFieldName, sDataType) {
			if (aArray.length > 0) {
				_.each(aArray, function(item) {
					validateValue(item, sDataType, sFieldName);
				});
			}
		}

		function validateValue(value, sDataType, sFieldName) {
			switch (sDataType) {
				case "String":
					if (!_.isString(value)) {
						const sLogMessage = `${sFieldName} should be string.`;
						throwErrors(value, [sFieldName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
					}
					return genericSyntaxValidator.validateValue(value, sDataType, undefined, false);
				case "Integer" || "PositiveInteger" || "BooleanInt":
					if (!_.isNumber(value)) {
						const sLogMessage = `${sFieldName} is not a ${sDataType}.`;
						throwErrors(value, [sFieldName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
					}
					return genericSyntaxValidator.validateValue(value, sDataType, undefined, false);
				default:
					return genericSyntaxValidator.validateValue(value, sDataType, undefined, false);
			}
		}

		function validateNumericValue(value, sFieldName) {
			if (!helpers.isNullOrUndefined(value) && !_.isNumber(value)) {
				const sLogMessage = `${sFieldName} should be numeric.`;
				throwErrors(value, [sFieldName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
			}
			return true;
		}

		function validateIsNonEmptyArray(aArray, sArrayName) {
			if (!_.isArray(aArray) || aArray.length === 0) {
				const sLogMessage = `${sArrayName} is an array with at least 1 entry. Cannot validate.`;
				throwErrors(aArray, [sArrayName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
			}
		}

		function validateIsArray(aArray, sArrayName) {
			if (!_.isArray(aArray)) {
				const sLogMessage = `${sArrayName} is not an array.`;
				throwErrors(aArray, [sArrayName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
			}
		}

		function validateGroupIndex(iValue, sFieldName, iMatchedGroupsLength) {
			genericSyntaxValidator.validateValue(iValue, "PositiveInteger", undefined, false);
			if (iValue === 0 || iValue > iMatchedGroupsLength) {
				const sLogMessage = `${sFieldName} should be a non zero positive integer and not larger than Groups length.`;
				throwErrors(iValue, [sFieldName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
			}
		}

		function throwErrors(oMetadataObjs, aColumnIds, sValidationInfoCode, sLogMessage, oCode) {
			let oMessageDetails = new MessageDetails();
			//oMessageDetails.addMetadataObjs(oMetadataObjs);
			oMessageDetails.validationObj = {
				"columnIds": aColumnIds.map(function(sColumnId) {
					return {
						"columnId": sColumnId
					};
				}),
				"validationInfoCode": sValidationInfoCode,
				"validationMessage": sLogMessage
			};
			$.trace.error(sLogMessage);
			throw new PlcException(oCode, sLogMessage, oMessageDetails);
		}

	};
}

SimilarPartsSearchValidator.prototype = Object.create(SimilarPartsSearchValidator.prototype);
SimilarPartsSearchValidator.prototype.constructor = SimilarPartsSearchValidator;
