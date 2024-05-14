const _ = $.require('lodash');
const GenericSyntaxValidator = $.require('./genericSyntaxValidator').GenericSyntaxValidator;
const helpers = $.require('../util/helpers');

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;

const PersistencySimilarParts = $.require('../db/persistency-similarPartsSearch');

const aMandatoryPropertiesMetadata = [
    'Attributes',
    'Source'
];
const aMandatoryPropertiesMetadataAttributes = [
    'Name',
    'Value',
    'Weight',
    'IsFuzzySearch'
];
const aMandatoryPropertiesMetadataPattern = [
    'Value',
    'Groups'
];
const aMandatoryPropertiesMetadataGroup = [
    'Index',
    'Name',
    'Weight',
    'Dict'
];
const aMandatoryPropertiesMetadataDict = [
    'Key',
    'Value'
];
const aMandatoryPropertiesMetadataTimeRange = [
    'FromTime',
    'ToTime'
];

async function SimilarPartsSearchValidator(oPersistency, metadataProvider, utils) {

    // Supported fuzzy search tables
    const SupportedCalculationVersionTables = _.values(PersistencySimilarParts.CalculationVersionTables);
    const SupportedMasterDataTables = _.values(PersistencySimilarParts.MasterDataTables);

    // Supported business object types
    const BusinessObjectTypes = PersistencySimilarParts.SupportedBusinessObjectTypes;

    // Supported sql types in similar parts search
    const SupportedSqlTypes = _.values(PersistencySimilarParts.SupportedSqlTypes).join(',').split(',');
    const SupportedDateTypes = _.values(PersistencySimilarParts.SupportedSqlTypes.Date).join(',').split(',');

    const SimilarPartsSourceTypes = PersistencySimilarParts.SimilarPartsSourceTypes;

    // Supported score functions for numeric numbers
    const SupportedScoreFunctions = PersistencySimilarParts.SupportedScoreFunctions;
    const DefaultScoreFunction = PersistencySimilarParts.DefaultScoreFunction;

    let genericSyntaxValidator = await new GenericSyntaxValidator();
    this.validate = async function (oRequest) {
        switch (oRequest.method) {
        case $.net.http.POST:
            return await validateSearchRequests();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        async function validateSearchRequests() {
            let aSearchRequests;
            let aValidSearchRequests = [], bIsBatchSearch = false;
            try {
                aSearchRequests = utils.tryParseJson(oRequest.body.asString());
            } catch (e) {
                const sLogMessage = `Cannot parse string to JSON for metadata. Tried to parse: ${ oRequest.body.asString() }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }

            await validateIsNonEmptyArray(aSearchRequests, 'RequestBody');

            if (aSearchRequests.length > 1) {
                bIsBatchSearch = true;
            }

            _.each(aSearchRequests, async function (oSearchRequest) {
                let aAttributeNames = [];
                await utils.checkMandatoryProperties(oSearchRequest, aMandatoryPropertiesMetadata);


                if (bIsBatchSearch) {
                    await utils.checkMandatoryProperties(oSearchRequest, ['CALCULATION_VERSION_ID']);
                }
                if (!helpers.isNullOrUndefined(oSearchRequest.CALCULATION_VERSION_ID)) {
                    await validateValue(oSearchRequest.CALCULATION_VERSION_ID, 'Integer', 'CALCULATION_VERSION_ID');
                }
                if (!helpers.isNullOrUndefined(oSearchRequest.ITEM_ID)) {
                    await validateValue(oSearchRequest.ITEM_ID, 'Integer', 'ITEM_ID');
                }
                await validateIsNonEmptyArray(oSearchRequest.Attributes, 'Attributes');
                await validateSupportedColumnsAndDataTypes(oSearchRequest.Attributes);
                _.each(oSearchRequest.Attributes, async function (oAttribute) {
                    await validateAttribute(oAttribute, aAttributeNames);
                });

                let oSource = oSearchRequest.Source;
                if (!helpers.isPlainObject(oSource) || _.isEmpty(oSource)) {
                    const sLogMessage = 'Source is an empty object.';
                    await throwErrors(oSource, ['Source'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }
                await validateSource(oSource, oSearchRequest);
                aValidSearchRequests.push(oSearchRequest);
            });
            return aValidSearchRequests;
        }

        async function validateAttribute(oAttribute, aAttributeNames) {
            let oPattern = oAttribute.Pattern;
            await utils.checkMandatoryProperties(oAttribute, aMandatoryPropertiesMetadataAttributes);

            await validateValue(oAttribute.Name, 'String', 'Attribute.Name');
            aAttributeNames.push(oAttribute.Name);
            await validateDuplicatedAttributeNames(aAttributeNames);
            await validateWeight(oAttribute.Weight);
            await validateValue(oAttribute.IsFuzzySearch, 'BooleanInt', 'IsFuzzySearch');


            if (oAttribute.IsFuzzySearch === 0) {
                await utils.checkMandatoryProperties(oAttribute, ['Pattern']);
                await utils.checkMandatoryProperties(oPattern, aMandatoryPropertiesMetadataPattern);
                await validateValue(oPattern.Value, 'String', 'Pattern.Value');
                if (!oPattern.Value.match(/\([^()]+\)/g) || !oAttribute.Value.match(new RegExp(oPattern.Value))) {
                    const sLogMessage = 'Value of Pattern is not a valid substring_regexpr.';
                    await throwErrors(oPattern.Value, ['Pattern.Value'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }

                await validateIsNonEmptyArray(oPattern.Groups, 'oPattern.Groups');
                let iMatchedGroupsLength = oAttribute.Value.match(new RegExp(oPattern.Value)).length - 1;
                if (iMatchedGroupsLength < oPattern.Groups.length) {
                    const sLogMessage = "Value of Pattern doesn't match Groups length.";
                    await throwErrors(oPattern, [
                        'Pattern.Value',
                        'Pattern.Groups'
                    ], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }
                _.each(oPattern.Groups, async function (oGroup) {
                    await validateGroup(oGroup, aAttributeNames, iMatchedGroupsLength);
                });
            }

            if (!helpers.isNullOrUndefined(oAttribute.Option)) {
                await validateSearchOptions(oAttribute.Option);
            }

            await validateSearchValueAndSetupDefaultOptions(oAttribute);
        }







        async function getMetadataForSupportedBussinesObjects() {
            let oItemMetadata = metadataProvider.get(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null, null, oPersistency, $.getPlcUsername(), $.getPlcUsername());
            let oMaterialMetadata = metadataProvider.get(BusinessObjectTypes.Material, BusinessObjectTypes.Material, null, null, oPersistency, $.getPlcUsername(), $.getPlcUsername());
            let oMaterialPriceMetadata = metadataProvider.get(BusinessObjectTypes.MaterialPrice, BusinessObjectTypes.MaterialPrice, null, null, oPersistency, $.getPlcUsername(), $.getPlcUsername());
            let oSupportedMetadata = _.union(oItemMetadata, oMaterialMetadata, oMaterialPriceMetadata);
            return utils.extendMetadataCustomFields(oSupportedMetadata);
        }







        async function getColumnPropertyForInputAttributes(aAttributes) {
            let aColumnNames = aAttributes.map(oAttr => {
                return oAttr.Name;
            });
            let sQueryStatement = `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE_NAME, SCALE FROM SYS.TABLE_COLUMNS
					WHERE SCHEMA_NAME = CURRENT_SCHEMA
					AND TABLE_NAME IN ('${ SupportedCalculationVersionTables.join("', '") }', '${ SupportedMasterDataTables.join("', '") }')
					AND COLUMN_NAME IN ('${ aColumnNames.join("', '") }')`;
            let oResult = (await oPersistency.getConnection()).executeQuery(sQueryStatement);
            let oIterator = oResult.getIterator();
            let aConvertedAttributes = [];
            while (oIterator.next()) {
                let oRow = oIterator.value();
                let sDataType = oRow['DATA_TYPE_NAME'] === 'DECIMAL' && oRow['SCALE'] !== null ? 'FixedDecimal' : oRow['DATA_TYPE_NAME'];

                if (!_.includes(SupportedSqlTypes, sDataType)) {
                    const sLogMessage = `Similar parts search doesn't support ${ sDataType } on column name ${ oRow['COLUMN_NAME'] }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                }
                oRow.SourceType = _.includes(SupportedCalculationVersionTables, oRow['TABLE_NAME']) ? SimilarPartsSourceTypes.CalculationVersions : SimilarPartsSourceTypes.MasterData;
                oRow.DataType = sDataType;
                aConvertedAttributes.push(oRow);
            }
            return aConvertedAttributes;
        }





























        async function validateSupportedColumnsAndDataTypes(aAttributes) {
            let oMetadata = await getMetadataForSupportedBussinesObjects();
            let aConvertedAttributes = await getColumnPropertyForInputAttributes(aAttributes);
            _.each(aAttributes, async function (oAttr) {

                let aSourceBusinessObjects = _.filter(oMetadata, function (oPropertyMetadata) {
                    return oPropertyMetadata.COLUMN_ID === oAttr.Name;
                });
                if (aSourceBusinessObjects.length === 0) {
                    const sLogMessage = `Not able to find property ${ oAttr.Name } in metadata.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }

                let oPropertyMetadata = _.uniq(_.map(aSourceBusinessObjects, oBusinessObject => _.pick(oBusinessObject, 'BUSINESS_OBJECT', 'IS_CUSTOM')), 'BUSINESS_OBJECT', 'IS_CUSTOM');


                let aAttrProperties = _.filter(aConvertedAttributes, oRow => oRow.COLUMN_NAME === oAttr.Name);
                if (aAttrProperties.length === 0) {
                    const sLogMessage = `Not able to find property ${ oAttr.Name } in items or master data tables.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }

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








        async function validateSearchOptions(oOption) {
            let sScoreFunctionName = oOption.scoreFunction;
            if (!helpers.isNullOrUndefined(oOption.scoreFunction)) {
                if (!_.includes(_.values(SupportedScoreFunctions), oOption.scoreFunction)) {
                    const sLogMessage = `Similar parts search doesn't support ${ oOption.scoreFunction } as score function for numeric columns.`;
                    await throwErrors(oOption, ['Option'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }
            } else {
                sScoreFunctionName = DefaultScoreFunction;
            }

            if (validateNumericValue(oOption.scoreFunctionScale, 'Option.scoreFunctionScale')) {
                if ((SupportedScoreFunctions.Linear === sScoreFunctionName || SupportedScoreFunctions.Gaussian === sScoreFunctionName) && oOption.scoreFunctionScale <= 0) {
                    await throwNumericErrors(oOption.scoreFunctionScale, 'Option.scoreFunctionScale', 'scale > 0', sScoreFunctionName);
                }
            }
            if (validateNumericValue(oOption.scoreFunctionDecay, 'Option.scoreFunctionDecay')) {
                if (SupportedScoreFunctions.Linear === sScoreFunctionName && (oOption.scoreFunctionDecay < 0 || oOption.scoreFunctionDecay >= 1)) {
                    await throwNumericErrors(oOption.scoreFunctionDecay, 'Option.scoreFunctionDecay', '0 <= decay < 1', sScoreFunctionName);
                } else if (SupportedScoreFunctions.Gaussian === sScoreFunctionName && (oOption.scoreFunctionDecay <= 0 || oOption.scoreFunctionDecay >= 1)) {
                    await throwNumericErrors(oOption.scoreFunctionDecay, 'Option.scoreFunctionDecay', '0 < decay < 1', sScoreFunctionName);
                }
            }
            if (validateNumericValue(oOption.scoreFunctionBase, 'Option.scoreFunctionBase') && (SupportedScoreFunctions.Logarithmic === sScoreFunctionName && oOption.scoreFunctionBase <= 1)) {
                await throwNumericErrors(oOption.scoreFunctionBase, 'Option.scoreFunctionBase', 'base > 1', sScoreFunctionName);
            }
            if (validateNumericValue(oOption.scoreFunctionOffset, 'Option.scoreFunctionOffset') && oOption.scoreFunctionOffset < 0) {
                await throwNumericErrors(oOption.scoreFunctionOffset, 'Option.scoreFunctionOffset', 'offset >= 0', sScoreFunctionName);
            }

            async function throwNumericErrors(inputValue, optionName, optionPossibleValue, scoreFunctionName) {
                const sLogMessage = `${ optionName } ${ inputValue } must satisfy for '${ optionPossibleValue }' for ${ scoreFunctionName } score function.`;
                await throwErrors(inputValue, [optionName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
            }
        }










        async function validateSearchValueAndSetupDefaultOptions(oAttribute) {
            oAttribute.Option = _.defaults(await helpers.isNullOrUndefined(oAttribute.Option) ? {} : oAttribute.Option, { 'scoreFunction': DefaultScoreFunction });


            if (_.includes(SupportedDateTypes, oAttribute.PropertyMap[0].DataType)) {
                _.defaults(oAttribute.Option, {
                    'scoreFunctionScale': 365,
                    'scoreFunctionOffset': 182,
                    'scoreFunctionDecay': 0.5
                });
                return;
            }
            _.defaults(oAttribute.Option, { 'scoreFunctionOffset': 0 });
            if (oAttribute.Option.scoreFunction == SupportedScoreFunctions.Logarithmic && await helpers.isNullOrUndefined(oAttribute.Option.scoreFunctionBase)) {



                if (oAttribute.Value <= oAttribute.Option.scoreFunctionOffset || oAttribute.Value <= 0) {
                    const sLogMessage = `Input search value ${ oAttribute.Value } must bigger than 0 and bigger than input scoreFunctionOffset for logarithmic score function.`;
                    await throwErrors(oAttribute.Value, ['Attribute.Value'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                } else {
                    _.defaults(oAttribute.Option, { 'scoreFunctionBase': 1 + (oAttribute.Value - oAttribute.Option.scoreFunctionOffset) });
                }
            } else if (oAttribute.Option.scoreFunction == SupportedScoreFunctions.Gaussian || oAttribute.Option.scoreFunction == SupportedScoreFunctions.Linear) {
                _.defaults(oAttribute.Option, { 'scoreFunctionDecay': 0.5 });
                if (helpers.isNullOrUndefined(oAttribute.Option.scoreFunctionScale)) {
                    if (oAttribute.Value <= 0) {
                        const sLogMessage = `Input search value ${ oAttribute.Value } must > 0 (when scoreFunctionScale is unset) for linear or gaussian score function.`;
                        await throwErrors(oAttribute.Value, ['Attribute.Value'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                    } else {
                        _.defaults(oAttribute.Option, { 'scoreFunctionScale': oAttribute.Value });
                    }
                }
            }
        }

        async function validateGroup(oGroup, aAttributeNames, iMatchedGroupsLength) {
            await utils.checkMandatoryProperties(oGroup, aMandatoryPropertiesMetadataGroup);
            await validateGroupIndex(oGroup.Index, 'oGroup.Index', iMatchedGroupsLength);
            await validateValue(oGroup.Name, 'String', 'Group.Name');
            aAttributeNames.push(oGroup.Name);
            await validateDuplicatedAttributeNames(aAttributeNames);
            await validateWeight(oGroup.Weight);
            await validateIsNonEmptyArray(oGroup.Dict, 'Group.Dict');
            _.each(oGroup.Dict, async function (oDict) {
                await utils.checkMandatoryProperties(oDict, aMandatoryPropertiesMetadataDict);
                await validateIsNonEmptyArray(oDict.Key, 'Dict.Key');
                await validateArrayItemsDataType(oDict.Key, 'Dict.Key', 'String');
                await validateValue(oDict.Value, 'String', 'Dict.Value');
            });
        }

        async function validateSource(oSource, oSearchRequest) {

            if (!helpers.isNullOrUndefined(oSource.TimeRange)) {
                await utils.checkMandatoryProperties(oSource.TimeRange, aMandatoryPropertiesMetadataTimeRange);
                let fromTime = await genericSyntaxValidator.validateValue(oSource.TimeRange.FromTime, 'UTCTimestamp', undefined, false);
                let toTime = await genericSyntaxValidator.validateValue(oSource.TimeRange.ToTime, 'UTCTimestamp', undefined, false);
                if (fromTime > toTime) {
                    const sLogMessage = 'ToTime should be larger than FromTime. Cannot validate TimeRange.';
                    await throwErrors(oSource.TimeRange, ['TimeRange'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }
            }

            if (!helpers.isPlainObject(oSource.MasterData) && !helpers.isPlainObject(oSource.CalculationVersions)) {
                const sLogMessage = 'Either valid MasterData or valid CalculationVersions should be defined.';
                await throwErrors(oSource, ['oSource'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
            }
            await validateMasterData(oSource.MasterData);
            await validateCalculationVersions(oSource.CalculationVersions, oSearchRequest);
        }

        async function validateMasterData(oMasterData) {
            if (!helpers.isNullOrUndefined(oMasterData)) {
                if (helpers.isPlainObject(oMasterData)) {
                    let aMasterDataFields = [
                        {
                            'Name': 'MaterialTypes',
                            'Value': oMasterData.MaterialTypes,
                            'DataType': 'String'
                        },
                        {
                            'Name': 'MaterialGroups',
                            'Value': oMasterData.MaterialGroups,
                            'DataType': 'String'
                        }
                    ];
                    _.each(aMasterDataFields, async function (oField) {

                        if (!helpers.isNullOrUndefined(oField.Value)) {
                            await validateIsArray(oField.Value, oField.Name);
                            await validateArrayItemsDataType(oField.Value, oField.Name, oField.DataType);
                        }
                    });
                } else {
                    const sLogMessage = 'MasterData should be a plain object.';
                    await throwErrors(oMasterData, ['MasterData'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }
            }
        }

        async function validateCalculationVersions(oCalculationVersions, oSearchRequest) {
            if (!helpers.isNullOrUndefined(oCalculationVersions)) {
                if (helpers.isPlainObject(oCalculationVersions)) {
                    let aCalculationVersionsFields = [
                        {
                            'Name': 'ProjectIds',
                            'Value': oCalculationVersions.ProjectIds,
                            'DataType': 'String'
                        },
                        {
                            'Name': 'CalculationIds',
                            'Value': oCalculationVersions.CalculationIds,
                            'DataType': 'Integer'
                        },
                        {
                            'Name': 'CalculationVersionIds',
                            'Value': oCalculationVersions.CalculationVersionIds,
                            'DataType': 'Integer'
                        },
                        {
                            'Name': 'ExcludeCalculationVersionIds',
                            'Value': oCalculationVersions.ExcludeCalculationVersionIds,
                            'DataType': 'Integer'
                        }
                    ];
                    _.each(aCalculationVersionsFields, async function (oField) {

                        if (!helpers.isNullOrUndefined(oField.Value)) {
                            await validateIsArray(oField.Value, oField.Name);
                            await validateArrayItemsDataType(oField.Value, oField.Name, oField.DataType);
                        }
                    });
                    if (!helpers.isNullOrUndefined(oCalculationVersions.OnlyCurrent)) {
                        await genericSyntaxValidator.validateValue(oCalculationVersions.OnlyCurrent, 'BooleanInt', undefined, false);
                        if (oCalculationVersions.OnlyCurrent) {
                            await utils.checkMandatoryProperties(oSearchRequest, ['CALCULATION_VERSION_ID']);
                        }
                    }
                } else {
                    const sLogMessage = 'CalculationVersions should be a plain object.';
                    await throwErrors(oCalculationVersions, ['CalculationVersions'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }
            }
        }

        async function validateDuplicatedAttributeNames(aArray) {
            if (hasRepeatedItems(aArray)) {
                const sLogMessage = 'Attributes Name and Groups Name should not be duplicated.';
                await throwErrors(aArray, [
                    'Attributes.Name',
                    'Groups.Name'
                ], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
            }
        }

        async function validateWeight(fWeight) {
            if (!(typeof fWeight === 'number') || fWeight < 0 || fWeight > 1) {
                const sLogMessage = 'Weight should be a float ranging from 0 to 1. Cannot validate Weight.';
                await throwErrors(fWeight, ['Weight'], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
            }
        }

        function hasRepeatedItems(aArray) {
            return !(_.uniq(aArray).length === aArray.length);
        }

        function validateArrayItemsDataType(aArray, sFieldName, sDataType) {
            if (aArray.length > 0) {
                _.each(aArray, async function (item) {
                    await validateValue(item, sDataType, sFieldName);
                });
            }
        }

        async function validateValue(value, sDataType, sFieldName) {
            switch (sDataType) {
            case 'String':
                if (!_.isString(value)) {
                    const sLogMessage = `${ sFieldName } should be string.`;
                    await throwErrors(value, [sFieldName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }
                return await genericSyntaxValidator.validateValue(value, sDataType, undefined, false);
            case 'Integer' || 'PositiveInteger' || 'BooleanInt':
                if (!await _.isNumber(value)) {
                    const sLogMessage = `${ sFieldName } is not a ${ sDataType }.`;
                    await throwErrors(value, [sFieldName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
                }
                return await genericSyntaxValidator.validateValue(value, sDataType, undefined, false);
            default:
                return await genericSyntaxValidator.validateValue(value, sDataType, undefined, false);
            }
        }

        async function validateNumericValue(value, sFieldName) {
            if (!helpers.isNullOrUndefined(value) && !await _.isNumber(value)) {
                const sLogMessage = `${ sFieldName } should be numeric.`;
                await throwErrors(value, [sFieldName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
            }
            return true;
        }

        async function validateIsNonEmptyArray(aArray, sArrayName) {
            if (!_.isArray(aArray) || aArray.length === 0) {
                const sLogMessage = `${ sArrayName } is an array with at least 1 entry. Cannot validate.`;
                await throwErrors(aArray, [sArrayName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
            }
        }

        async function validateIsArray(aArray, sArrayName) {
            if (!_.isArray(aArray)) {
                const sLogMessage = `${ sArrayName } is not an array.`;
                await throwErrors(aArray, [sArrayName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
            }
        }

        async function validateGroupIndex(iValue, sFieldName, iMatchedGroupsLength) {
            await genericSyntaxValidator.validateValue(iValue, 'PositiveInteger', undefined, false);
            if (iValue === 0 || iValue > iMatchedGroupsLength) {
                const sLogMessage = `${ sFieldName } should be a non zero positive integer and not larger than Groups length.`;
                await throwErrors(iValue, [sFieldName], ValidationInfoCode.VALUE_ERROR, sLogMessage, Code.GENERAL_VALIDATION_ERROR);
            }
        }

        async function throwErrors(oMetadataObjs, aColumnIds, sValidationInfoCode, sLogMessage, oCode) {
            let oMessageDetails = new MessageDetails();

            oMessageDetails.validationObj = {
                'columnIds': aColumnIds.map(function (sColumnId) {
                    return { 'columnId': sColumnId };
                }),
                'validationInfoCode': sValidationInfoCode,
                'validationMessage': sLogMessage
            };
            $.trace.error(sLogMessage);
            throw new PlcException(oCode, sLogMessage, oMessageDetails);
        }

    };
}

SimilarPartsSearchValidator.prototype =  Object.create(SimilarPartsSearchValidator.prototype);
SimilarPartsSearchValidator.prototype.constructor = SimilarPartsSearchValidator;
export default {_,GenericSyntaxValidator,helpers,MessageLibrary,PlcException,Code,MessageDetails,ValidationInfoCode,PersistencySimilarParts,aMandatoryPropertiesMetadata,aMandatoryPropertiesMetadataAttributes,aMandatoryPropertiesMetadataPattern,aMandatoryPropertiesMetadataGroup,aMandatoryPropertiesMetadataDict,aMandatoryPropertiesMetadataTimeRange,SimilarPartsSearchValidator};
