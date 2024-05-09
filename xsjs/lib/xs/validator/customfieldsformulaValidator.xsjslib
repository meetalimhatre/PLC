const _ = $.require('lodash');
const helpers = $.require('../util/helpers');
var constants = $.require('../util/constants');

const ValidationException = $.require('../xslib/exceptions').ValidationException;
const GenericSyntaxValidator = $.require('./genericSyntaxValidator').GenericSyntaxValidator;
const MessageLibrary = $.require('../util/message');
const MessageDetails = MessageLibrary.Details;

const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;

const sUserId = $.getPlcUsername();
const sSessionId = $.getPlcUsername();

/**
 * This class constructs BusinessObjectValidator instances for the Customfieldsformula business object type. It validates the data in the body of a request. 
 * For this, the validation distinguishes the different CRUD operations which can be done upon the business object (example: for a GET request no 
 * body is allowed, but for POST and DELETE the body is mandatory).
 *  
 * @constructor
 */

async function CustomfieldsformulaValidator(persistency, sessionId, metadataProvider, utils) {

    var genericSyntaxValidator = await new GenericSyntaxValidator();


    /**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on oRequest.method a different 
	 * validation procedure is chosen. 
	 * 
	 * @param oRequest - The $.request object which carries the body data 
	 * @param oPersistency - An instance of Persistency to enable access to the data base and retrieve trustworthy data in order to validate 
	 *              reference IDs given in the request
	 * @param sSessionId - The session id of the request which is necessary for database queries. 
	 * @returns
	 * 
	 * @throws {ValidationException} If the request body can not be parsed as JSON array, mandatory item properties are missing or the property 
	 *              values cannot be validated against the 
		data types provided in the meta data. 
	 */
    this.validate = async function (oRequest, mValidatedParameters) {
        var aMandatoryPropertiesMetadata = constants.aMandatoryPropertiesMetadata;
        var aMandatoryPropertiesMetadataAttributes = constants.aMandatoryPropertiesMetadataAttributes;
        var aMandatoryPropertiesMetadataText = constants.aMandatoryPropertiesMetadataText;
        var aMandatoryPropertiesMetadataKeys = constants.aMandatoryPropertiesMetadataKeys;
        var aValidPropertiesMetadata = constants.aValidPropertiesMetadata;
        var aValidPropertiesMetadataAttributes = constants.aValidPropertiesMetadataAttributes;
        var aValidPropertiesMetadataText = constants.aValidPropertiesMetadataText;
        var aValidPropertiesFormula = constants.aValidPropertiesFormula;
        var aMandatoryPropertiesFormula = constants.aMandatoryPropertiesFormula;

        var aSemanticDataTypes = [
            'String',
            'BooleanInt',
            'Integer',
            'Decimal',
            'LocalDate',
            'Link'
        ]; //Semantic Data Types		
        var aMaintainedLanguages = await getMaintainableLanguages();
        var aBusinessObjects = _.union(['Item'], constants.aCustomFieldMasterdataBusinessObjects); // for version 2.1; extend for future versions with the other business objects
        var aRollupType = [
            0,
            2,
            3
        ]; //for String, LocalDate and UTCTimestamp
        var aValidStandardFieldsForFormula = [
            'QUANTITY',
            'PRICE_FIXED_PORTION',
            'PRICE_VARIABLE_PORTION',
            'PRICE_UNIT',
            'TARGET_COST',
            'LOT_SIZE',
            'BASE_QUANTITY',
            'BOM_COMPARE_KEY'
        ];
        var colRegex = /^(CUST|CMAT|CMPR|CMPL|CCEN|CWCE|CAPR)_[A-Z][A-Z0-9_]*$/;
        var colRegexUnit = /^(CUST|CMAT|CMPR|CMPL|CCEN|CWCE|CAPR)_[A-Z][A-Z0-9_]*_UNIT$/;
        var sLinkRegexValue = persistency.Helper.getRegexValue(constants.RegexIds['LINK']);

        switch (oRequest.method) {
        case $.net.http.GET:
            return utils.checkEmptyBody(oRequest.body);
        case $.net.http.POST:
            return await validateBatchRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        async function validateBatchRequest() {
            var oBodyData;
            try {
                oBodyData = JSON.parse(oRequest.body.asString());
            } catch (e) {
                const sClientMsg = 'Cannot parse string to JSON for metadata.';
                const sServerMsg = `${ sClientMsg } Tried to parse: ${ oRequest.body.asString() }`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }

            if (!_.isObject(oBodyData) || _.isEmpty(oBodyData)) {
                const sClientMsg = 'Content needs to be a non-empty JSON object for validation of metadata.';
                const sServerMsg = `${ sClientMsg } Body: ${ oRequest.body.asString() }`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }

            if (!helpers.isNullOrUndefined(mValidatedParameters) && !helpers.isNullOrUndefined(mValidatedParameters.checkCanExecute) && mValidatedParameters.checkCanExecute === false) {
                const sLogMessage = `Value for parameter checkCanExecute cannot be false, but value is: ${ mValidatedParameters.checkCanExecute }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }
            _.each(oBodyData, async function (value, key) {
                if (!helpers.isNullOrUndefined(mValidatedParameters) && !helpers.isNullOrUndefined(mValidatedParameters.checkCanExecute)) {
                    if (mValidatedParameters.checkCanExecute === true && (key == 'CREATE' || key == 'UPDATE') && value.length != 0) {
                        const sClientMsg = 'Body content for CREATE or UPDATE must to be empty.';
                        const sServerMsg = `${ sClientMsg } Body: ${ oRequest.body.asString() }`;
                        $.trace.error(sServerMsg);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                    }
                }
                if (key == 'CREATE') {
                    await validateCreateCF(value);
                } else if (key == 'UPDATE') {
                    await validateUpdateCF(value);
                } else if (key == 'DELETE') {
                    await validateDeleteCF(value);
                } else {
                    const sLogMessage = `Unknown property of the request object for metadata: ${ key }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
            });

            return oBodyData;
        }

        async function validateCreateCF(aCreatedFields) {
            var aValidatedItems = [];
            if (_.isArray(aCreatedFields) && aCreatedFields.length > 0) {
                _.each(aCreatedFields, async function (oBodyItem, iIndex) {
                    await utils.checkMandatoryProperties(oBodyItem, _.union(aMandatoryPropertiesMetadata, ['UOM_CURRENCY_FLAG']));
                    utils.checkInvalidProperties(oBodyItem, aValidPropertiesMetadata);
                    if (colRegexUnit.exec(oBodyItem.COLUMN_ID)) {
                        if (await helpers.isNullOrUndefined(oBodyItem.PROPERTY_TYPE) && oBodyItem.UOM_CURRENCY_FLAG === 1) {
                            const oMessageDetails = new MessageDetails();
                            oMessageDetails.addMetadataObjs(oBodyItem);
                            oMessageDetails.validationObj = {
                                'columnIds': [{ 'columnId': 'PROPERTY_TYPE' }],
                                'validationInfoCode': ValidationInfoCode.MISSING_MANDATORY_ENTRY
                            };
                            const sLogMessage = `Create Metadata ${ oBodyItem.COLUMN_ID } failed - Property type needs to be defined for uom or currency.`;
                            $.trace.error(sLogMessage);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                        }
                    }

                    //BUSINESS_OBJECT must be one of the defined Business Objects
                    if (!_.includes(aBusinessObjects, oBodyItem.BUSINESS_OBJECT)) {
                        const oMessageDetails = new MessageDetails();
                        oMessageDetails.addMetadataObjs(oBodyItem);
                        oMessageDetails.validationObj = {
                            'columnIds': [
                                { 'columnId': 'PATH' },
                                { 'columnId': 'BUSINESS_OBJECT' }
                            ],
                            'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                        };
                        const sLogMessage = `Create Metadata - Path: ${ oBodyItem.PATH } or Business Object: ${ oBodyItem.BUSINESS_OBJECT } incorrect.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                    }

                    //COLUMN_ID name must start with CUST_ and can contain upper and lower case letters, numbers 0-9 and underscore character
                    if (!colRegex.exec(oBodyItem.COLUMN_ID)) {
                        const oMessageDetails = new MessageDetails();
                        oMessageDetails.addMetadataObjs(oBodyItem);
                        oMessageDetails.validationObj = {
                            'columnIds': [{ 'columnId': 'COLUMN_ID' }],
                            'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                        };
                        const sLogMessage = `Column name is incorrect: ${ oBodyItem.COLUMN_ID }.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                    }

                    //SEMANTIC_DATA_TYPE must be one of the defined Data Types
                    if (!_.includes(aSemanticDataTypes, oBodyItem.SEMANTIC_DATA_TYPE)) {
                        const oMessageDetails = new MessageDetails();
                        oMessageDetails.addMetadataObjs(oBodyItem);
                        oMessageDetails.validationObj = {
                            'columnIds': [{ 'columnId': 'SEMANTIC_DATA_TYPE' }],
                            'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                        };
                        const sLogMessage = `Semantic data type is incorrect ${ oBodyItem.SEMANTIC_DATA_TYPE }.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                    }

                    //CF can only reference UOM or Currency if it is Integer or Decimal, rollup type of CF and Unit should be the same 
                    if (!helpers.isNullOrUndefined(oBodyItem.REF_UOM_CURRENCY_COLUMN_ID) && oBodyItem.REF_UOM_CURRENCY_COLUMN_ID !== '') {
                        if (oBodyItem.SEMANTIC_DATA_TYPE != 'Decimal' && oBodyItem.SEMANTIC_DATA_TYPE != 'Integer') {
                            const oMessageDetails = new MessageDetails();
                            oMessageDetails.addMetadataObjs(oBodyItem);
                            oMessageDetails.validationObj = {
                                'columnIds': [{ 'columnId': 'SEMANTIC_DATA_TYPE' }],
                                'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                            };
                            const sLogMessage = `Cannot have currency or uom for semantic data type ${ oBodyItem.SEMANTIC_DATA_TYPE }.`;
                            $.trace.error(sLogMessage);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                        }
                        var checkRef = _.find(aCreatedFields, function (oItemUnit) {
                            return oItemUnit.COLUMN_ID === oBodyItem.REF_UOM_CURRENCY_COLUMN_ID && oItemUnit.ROLLUP_TYPE_ID === oBodyItem.ROLLUP_TYPE_ID && (oItemUnit.PROPERTY_TYPE === 6 || oItemUnit.PROPERTY_TYPE === 7);
                        });
                        if (!checkRef) {
                            const oMessageDetails = new MessageDetails();
                            oMessageDetails.addMetadataObjs(oBodyItem);
                            oMessageDetails.validationObj = {
                                'columnIds': [{ 'columnId': 'SEMANTIC_DATA_TYPE' }],
                                'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                            };
                            const sLogMessage = `Referenced currency or uom ${ oBodyItem.REF_UOM_CURRENCY_COLUMN_ID } does not exist on the request, or different rollup types for CF and reference.`;
                            $.trace.error(sLogMessage);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                        } else if (oBodyItem.SEMANTIC_DATA_TYPE === 'Integer' && checkRef.PROPERTY_TYPE !== 6) {
                            const oMessageDetails = new MessageDetails();
                            oMessageDetails.addMetadataObjs(oBodyItem);
                            oMessageDetails.validationObj = {
                                'columnIds': [{ 'columnId': 'SEMANTIC_DATA_TYPE' }],
                                'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                            };
                            const sLogMessage = `Wrong property type: ${ checkRef.PROPERTY_TYPE }. Integer can have only uom - property type 6.`;
                            $.trace.error(sLogMessage);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                        }
                    }

                    // check that rollup type is valid for the semantic data type
                    if (!helpers.isNullOrUndefined(oBodyItem.ROLLUP_TYPE_ID) && !colRegexUnit.exec(oBodyItem.COLUMN_ID)) {
                        await checkRollupType(oBodyItem.ROLLUP_TYPE_ID, oBodyItem.SEMANTIC_DATA_TYPE);
                    }

                    // check that custom fields support rollup type
                    if (_.includes(constants.aCustomFieldMasterdataBusinessObjects, oBodyItem.BUSINESS_OBJECT) && oBodyItem.ROLLUP_TYPE_ID != 0) {
                        const oMessageDetails = new MessageDetails();
                        oMessageDetails.addMetadataObjs(oBodyItem);
                        oMessageDetails.validationObj = {
                            'columnIds': [{ 'columnId': 'ROLLUP_TYPE_ID' }],
                            'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                        };
                        const sLogMessage = `Rollup type is not supported for custom fields on ${ oBodyItem.BUSINESS_OBJECT } level.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                    }

                    //validate the texts
                    await validateTexts(oBodyItem);


                    var aAttributes = oBodyItem.ATTRIBUTES;
                    if (!_.isArray(aAttributes) || aAttributes.length < 1) {
                        const sLogMessage = `Content must be a non-empty JSON array for validation of Attributes for Metadata Create.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                    if (_.includes(constants.aCustomFieldMasterdataBusinessObjects, oBodyItem.BUSINESS_OBJECT) && aAttributes.length > 1) {
                        const sLogMessage = `Masterdata custom fields can have only 1 attribute.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                    _.each(aAttributes, async function (oAttribute, iIndex) {
                        await checkAttribute(oAttribute, oBodyItem);
                    });


                    await checkSidePanelGroupId(oBodyItem);


                    var aFormulas = oBodyItem.FORMULAS;
                    if (!helpers.isNullOrUndefined(aFormulas) && _.isArray(aFormulas) && aFormulas.length > 0) {
                        _.each(aFormulas, async function (oFormula, iIndex) {
                            if (_.includes(constants.aCustomFieldMasterdataBusinessObjects, oFormula.BUSINESS_OBJECT)) {
                                const oMessageDetails = new MessageDetails();
                                oMessageDetails.addMetadataObjs(oFormula);
                                oMessageDetails.validationObj = {
                                    'columnIds': [{ 'columnId': 'FORMULA_ID' }],
                                    'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                                };
                                const sLogMessage = `Formulas are not supported for custom fields on ${ oFormula.BUSINESS_OBJECT } level.`;
                                $.trace.error(sLogMessage);
                                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                            } else
                                await checkFormula(oFormula, oBodyItem);
                        });
                    }

                    aValidatedItems.push(oBodyItem);
                });
            }

            return aValidatedItems;
        }

        async function validateUpdateCF(aUpdatedFields) {
            var aValidatedItems = [];
            var oMetaData;

            if (_.isArray(aUpdatedFields) && aUpdatedFields.length > 0) {
                _.each(aUpdatedFields, async function (oBodyItem, iIndex) {
                    await utils.checkMandatoryProperties(oBodyItem, aMandatoryPropertiesMetadataKeys);
                    utils.checkInvalidProperties(oBodyItem, _.difference(aValidPropertiesMetadata, ['SEMANTIC_DATA_TYPE']));


                    if (!_.isUndefined(oBodyItem.SIDE_PANEL_GROUP_ID)) {
                        await checkSidePanelGroupId(oBodyItem);
                    }


                    if (!helpers.isNullOrUndefined(oBodyItem.ROLLUP_TYPE_ID) && !colRegexUnit.exec(oBodyItem.COLUMN_ID)) {
                        oMetaData = metadataProvider.get(oBodyItem.PATH, oBodyItem.BUSINESS_OBJECT, oBodyItem.COLUMN_ID, null, persistency, sSessionId, sUserId);
                        if (oMetaData !== undefined) {
                            await checkRollupType(oBodyItem.ROLLUP_TYPE_ID, oMetaData[0].SEMANTIC_DATA_TYPE);
                        } else {
                            const oMessageDetails = new MessageDetails();
                            oMessageDetails.addMetadataObjs(oMetaData);
                            const sLogMessage = `Field not found in metadata table ${ oBodyItem.COLUMN_ID }.`;
                            $.trace.error(sLogMessage);
                            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
                        }
                    }


                    await validateTexts(oBodyItem);


                    var aAttributes = oBodyItem.ATTRIBUTES;
                    if (_.isArray(aAttributes) || aAttributes.length > 0) {
                        if (await helpers.isNullOrUndefined(oMetaData)) {
                            oMetaData = metadataProvider.get(oBodyItem.PATH, oBodyItem.BUSINESS_OBJECT, oBodyItem.COLUMN_ID, null, persistency, sSessionId, sUserId);
                            if (oMetaData === undefined || oMetaData.length === 0) {
                                const oMessageDetails = new MessageDetails();
                                oMessageDetails.addMetadataObjs(oMetaData);
                                const sLogMessage = `Field not found in metadata table ${ oBodyItem.COLUMN_ID }.`;
                                $.trace.error(sLogMessage);
                                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
                            }
                        }
                        _.each(aAttributes, async function (oAttribute, iIndex) {
                            await checkAttribute(oAttribute, oBodyItem, oMetaData);
                        });
                    }





                    if (!helpers.isNullOrUndefined(oBodyItem.FORMULAS)) {
                        var aFormulas = oBodyItem.FORMULAS;
                        if (_.isArray(aFormulas) || aFormulas.length > 0) {
                            if (!colRegex.exec(oBodyItem.COLUMN_ID)) {
                                if (!_.includes(aValidStandardFieldsForFormula, oBodyItem.COLUMN_ID)) {
                                    const oMessageDetails = new MessageDetails();
                                    oMessageDetails.addMetadataObjs(oBodyItem);
                                    const sLogMessage = `Cannot change formula for standard field ${ oBodyItem.COLUMN_ID }.`;
                                    $.trace.error(sLogMessage);
                                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                                }
                            }
                            _.each(aFormulas, async function (oFormula, iIndex) {
                                await checkFormula(oFormula, oBodyItem, oMetaData);
                            });
                        }
                    }
                    aValidatedItems.push(oBodyItem);
                });
            }

            return aValidatedItems;
        }

        async function validateDeleteCF(aDeletedFields) {
            var aValidatedItems = [];
            if (_.isArray(aDeletedFields) || aDeletedFields.length < 0) {
                _.each(aDeletedFields, async function (oBodyItem, iIndex) {

                    await utils.checkMandatoryProperties(oBodyItem, aMandatoryPropertiesMetadataKeys);
                    utils.checkInvalidProperties(oBodyItem, aMandatoryPropertiesMetadataKeys);

                    aValidatedItems.push(oBodyItem);
                });
            }
            return aValidatedItems;
        }

        async function checkRollupType(iRollupType, iSemanticDataType) {

            await genericSyntaxValidator.validateValue(iRollupType, 'Integer', undefined, true);
            if (iRollupType < 0 || iRollupType > 5) {
                const oMessageDetails = new MessageDetails();
                oMessageDetails.validationObj = {
                    'columnIds': [{ 'columnId': 'ROLLUP_TYPE' }],
                    'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                };
                const sLogMessage = `Rollup Type: ${ iRollupType } is incorrect, it should be between 0-5.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }
            if ((iSemanticDataType == 'BooleanInt' || iSemanticDataType == 'LocalDate' || iSemanticDataType == 'Link') && iRollupType != 0) {
                const oMessageDetails = new MessageDetails();
                oMessageDetails.validationObj = {
                    'columnIds': [{ 'columnId': 'ROLLUP_TYPE' }],
                    'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                };
                const sLogMessage = `Rollup Type: ${ iRollupType } not defined for Semantic Data Type: ${ iSemanticDataType }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }

            if (iSemanticDataType === 'String' || iSemanticDataType === 'UTCTimestamp') {
                if (!_.includes(aRollupType, iRollupType)) {
                    const oMessageDetails = new MessageDetails();
                    oMessageDetails.validationObj = {
                        'columnIds': [{ 'columnId': 'ROLLUP_TYPE' }],
                        'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                    };
                    const sLogMessage = `Rollup Type: ${ iRollupType } not defined for Semantic Data Type: ${ iSemanticDataType }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                }
            }
        }

        async function checkAttribute(oAttribute, oBodyItem, oMetaData) {
            await utils.checkMandatoryProperties(oAttribute, aMandatoryPropertiesMetadataAttributes);
            utils.checkInvalidProperties(oAttribute, aValidPropertiesMetadataAttributes);
            if (oAttribute.PATH != oBodyItem.PATH || oAttribute.BUSINESS_OBJECT != oBodyItem.BUSINESS_OBJECT || oAttribute.COLUMN_ID != oBodyItem.COLUMN_ID) {
                const oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oMetaData);
                oMessageDetails.validationObj = {
                    'columnIds': [{ 'columnId': 'ROLLUP_TYPE' }],
                    'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                };
                const sLogMessage = `Unknown attribute key for metadata ${ oBodyItem.COLUMN_ID }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }

            if (oAttribute.ITEM_CATEGORY_ID == 0) {
                var existingAttribute = _.find(oBodyItem.ATTRIBUTES, function (entry) {
                    return oAttribute.PATH == entry.PATH && oAttribute.BUSINESS_OBJECT == entry.BUSINESS_OBJECT && oAttribute.COLUMN_ID == entry.COLUMN_ID && entry.ITEM_CATEGORY_ID == 10;
                });
                if (existingAttribute === undefined) {
                    const sLogMessage = `There is no entry with item category 10.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
            }

            let sSemanticDataType = 'String';
            if (oBodyItem.UOM_CURRENCY_FLAG !== 1) {
                sSemanticDataType = oBodyItem.SEMANTIC_DATA_TYPE ? oBodyItem.SEMANTIC_DATA_TYPE : oMetaData[0].SEMANTIC_DATA_TYPE;
            } else {
                if (oBodyItem.PROPERTY_TYPE === 6 && oAttribute.hasOwnProperty('DEFAULT_VALUE')) {

                    if (!persistency.Helper.uomExists(oAttribute.DEFAULT_VALUE, new Date())) {
                        const sLogMessage = `UOM does not exist.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                } else if (oBodyItem.PROPERTY_TYPE === 7 && oAttribute.hasOwnProperty('DEFAULT_VALUE')) {

                    if (!persistency.Helper.currencyExists(oAttribute.DEFAULT_VALUE, new Date())) {
                        const sLogMessage = `Currency does not exist.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                }
            }


            if (!helpers.isNullOrUndefined(oAttribute.DEFAULT_VALUE)) {
                try {
                    if (sSemanticDataType === 'Decimal') {
                        await genericSyntaxValidator.validateValue(oAttribute.DEFAULT_VALUE, sSemanticDataType, constants.SemanticDataTypeAttributes.Decimal, true);
                    } else if (sSemanticDataType === 'String') {
                        await genericSyntaxValidator.validateValue(oAttribute.DEFAULT_VALUE, sSemanticDataType, constants.SemanticDataTypeAttributes.String, true);
                    } else if (sSemanticDataType === 'Link') {
                        await genericSyntaxValidator.validateValue(oAttribute.DEFAULT_VALUE, sSemanticDataType, constants.SemanticDataTypeAttributes.Link, true, sLinkRegexValue);
                    } else {
                        await genericSyntaxValidator.validateValue(oAttribute.DEFAULT_VALUE, sSemanticDataType, undefined, true);
                    }
                } catch (e) {
                    if (e.code.code === Code.GENERAL_VALIDATION_ERROR.code) {
                        const oMessageDetails = new MessageDetails();
                        oMessageDetails.validationObj = {
                            'columnId': 'DEFAULT_VALUE',
                            'validationInfoCode': ValidationInfoCode.VALUE_ERROR
                        };
                        const sLogMessage = `Default value ${ oAttribute.DEFAULT_VALUE } is not valid.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
                    } else
                        throw e;
                }
            }


            if (sSemanticDataType === 'BooleanInt' && await helpers.isNullOrUndefined(oAttribute.DEFAULT_VALUE)) {
                const sLogMessage = `Default value needs to be set for boolean custom fields.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }

            if (!helpers.isNullOrUndefined(oAttribute.DEFAULT_VALUE) && oAttribute.DEFAULT_VALUE.length > 5000) {
                const sLogMessage = `The default value has more than 250 characters.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }
        }

        async function checkFormula(oFormula, oBodyItem, oMetaData) {
            await utils.checkMandatoryProperties(oFormula, aMandatoryPropertiesFormula);
            utils.checkInvalidProperties(oFormula, aValidPropertiesFormula);
            if (oFormula.PATH != oBodyItem.PATH || oFormula.BUSINESS_OBJECT != oBodyItem.BUSINESS_OBJECT || oFormula.COLUMN_ID != oBodyItem.COLUMN_ID) {
                const oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oMetaData);
                const sLogMessage = `Unknown formula key for metadata ${ oBodyItem.COLUMN_ID }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }

            if (oFormula.ITEM_CATEGORY_ID == 10) {
                const sLogMessage = `There is no entry with item category 10.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }

            var existingAttribute = _.find(oBodyItem.ATTRIBUTES, function (entry) {
                return entry.ITEM_CATEGORY_ID === oFormula.ITEM_CATEGORY_ID;
            });

            if (existingAttribute === undefined) {
                const oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oMetaData);
                oMessageDetails.validationObj = {
                    'columnIds': [{ 'itemCategoryId': 'ITEM_CATEGORY_ID' }],
                    'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                };
                const sLogMessage = `Cannot add formula to field because there is no attribute defined for this category ${ oFormula.ITEM_CATEGORY_ID }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }

            var sSemanticDataType = oBodyItem.SEMANTIC_DATA_TYPE ? oBodyItem.SEMANTIC_DATA_TYPE : oMetaData[0].SEMANTIC_DATA_TYPE;


            if (sSemanticDataType != 'Decimal' && sSemanticDataType != 'Integer' && sSemanticDataType != 'String' && sSemanticDataType != 'Link') {
                const oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oMetaData);
                oMessageDetails.validationObj = {
                    'columnIds': [{ 'columnId': 'SEMANTIC_DATA_TYPE' }],
                    'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                };
                const sLogMessage = `Cannot add formula to field with semantic data type ${ oBodyItem.SEMANTIC_DATA_TYPE }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }
        }

        async function validateTexts(oBodyItem) {
            var aTexts = oBodyItem.TEXT;
            if (_.isArray(aTexts)) {
                _.each(aTexts, async function (oText, iIndex) {
                    await utils.checkMandatoryProperties(oText, aMandatoryPropertiesMetadataText);
                    utils.checkInvalidProperties(oText, aValidPropertiesMetadataText);
                    await validateTextMaxLength(oText);
                    if (oText.PATH != oBodyItem.PATH || oText.COLUMN_ID != oBodyItem.COLUMN_ID) {
                        const sClientMsg = 'Unknown text key for body metadata.';
                        const sServerMsg = `${ sClientMsg } oBodyItem: ${ oBodyItem }`;
                        $.trace.error(sServerMsg);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                    }
                    if (!_.includes(aMaintainedLanguages, oText.LANGUAGE)) {
                        const sLogMessage = `Language ${ oText.LANGUAGE } is not maintained in the system.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                });
            }
        }

        async function validateTextMaxLength(oText) {
            if (oText.hasOwnProperty('DISPLAY_NAME') && oText.DISPLAY_NAME.lenght > 250) {
                const sLogMessage = `The name ${ oText.DISPLAY_NAME } of the custom field is too long. Maximum length allowed is 250 characters.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }
            if (oText.hasOwnProperty('DISPLAY_DESCRIPTION') && oText.DISPLAY_DESCRIPTION.lenght > 5000) {
                const sLogMessage = `The description ${ oText.DISPLAY_DESCRIPTION } of the custom field is too long. Maximum length allowed is 5000 characters.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }
        }

        async function getMaintainableLanguages() {
            var oParameters = {};
            oParameters.business_object = constants.BusinessObjectTypes.Language;
            oParameters.filter = 'TEXTS_MAINTAINABLE=1';
            var mSessionDetails = persistency.Session.getSessionDetails(sSessionId, sUserId);

            var aLanguages = persistency.Administration.getAdministration(oParameters, mSessionDetails.language, new Date())[constants.BusinessObjectsEntities.LANGUAGE_ENTITIES];

            return _.map(aLanguages, 'LANGUAGE');
        }

        async function checkSidePanelGroupId(oBodyItem) {
            let bInvalidId;
            switch (oBodyItem.BUSINESS_OBJECT) {
            case constants.TansactionalObjectTyps.Item:
                if (!_.includes(constants.aSidePanelGroupsItemCustomFields, oBodyItem.SIDE_PANEL_GROUP_ID)) {
                    bInvalidId = true;
                }
                break;
            case constants.MasterDataObjectTypes.WorkCenter:
                if (oBodyItem.SIDE_PANEL_GROUP_ID !== 504) {
                    bInvalidId = true;
                }
                break;
            default:
                if (oBodyItem.SIDE_PANEL_GROUP_ID !== 501) {
                    bInvalidId = true;
                }
            }

            if (bInvalidId) {
                const oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oBodyItem);
                oMessageDetails.validationObj = {
                    'columnIds': [{ 'columnId': 'SIDE_PANEL_GROUP_ID' }],
                    'validationInfoCode': ValidationInfoCode.METADATA_ERROR
                };
                const sLogMessage = `Side panel group id is incorrect: ${ oBodyItem.SIDE_PANEL_GROUP_ID }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }
        }
    };
}

CustomfieldsformulaValidator.prototype = await Object.create(CustomfieldsformulaValidator.prototype);
CustomfieldsformulaValidator.prototype.constructor = CustomfieldsformulaValidator;
export default {_,helpers,constants,ValidationException,GenericSyntaxValidator,MessageLibrary,MessageDetails,PlcException,Code,ValidationInfoCode,sUserId,sSessionId,CustomfieldsformulaValidator};
