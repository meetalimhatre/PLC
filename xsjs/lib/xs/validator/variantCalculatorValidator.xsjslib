const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const BusinessObjectTypes = $.require('../util/constants').BusinessObjectTypes;
const _ = $.require('lodash');
const MessageDetails = MessageLibrary.Details;
const SQLMaximumInteger = $.require('../util/constants').SQLMaximumInteger;

function VariantCalculatorValidator(oPersistency, oMetadataProvider, oUtils) {
    this.validate = async function validate(oRequest, mValidatedParameters) {
        const getExistingNoTemporaryMasterdata = (oResultSet, sColumnName) => oPersistency.Helper.createValueSetFromResult(oResultSet, sColumnName);
        const oNonTemporaryMasterdata = oPersistency.Variant.getExistingNonTemporaryMasterdata();
        const aExistingCurrencies = getExistingNoTemporaryMasterdata(oNonTemporaryMasterdata.CURRENCIES, 'CURRENCY_ID');
        const aExistingExchangeRates = getExistingNoTemporaryMasterdata(oNonTemporaryMasterdata.EXCHANGE_RATE_TYPES, 'EXCHANGE_RATE_TYPE_ID');
        const aExistingUOMs = getExistingNoTemporaryMasterdata(oNonTemporaryMasterdata.UNIT_OF_MEASURES, 'UOM_ID');

        async function checkNonTemporaryMasterdataReferences(oVariant) {
            await oUtils.checkNonTemporaryMasterdataReferences(oVariant, ['REPORT_CURRENCY_ID'], aExistingCurrencies);
            await oUtils.checkNonTemporaryMasterdataReferences(oVariant, ['EXCHANGE_RATE_TYPE_ID'], aExistingExchangeRates);
            return oVariant;
        }

        async function checkVariant(oVariant, aVariantMetadata) {
            const oVariantToValidate = _.omit(oVariant, 'ITEMS');
            const oSyntacticallyCorrectVariant = oUtils.checkEntity({
                entity: oVariantToValidate,
                categoryId: -1,
                subitemState: -1,
                metadata: aVariantMetadata
            });
            await checkNonTemporaryMasterdataReferences(oSyntacticallyCorrectVariant);
            return oSyntacticallyCorrectVariant;
        }

        async function checkSumVariant(oSumVariant) {
            let aSumVariantMetadata = oMetadataProvider.get(BusinessObjectTypes.SumVariant, BusinessObjectTypes.SumVariant, null, null, oPersistency);

            const oVariantToValidate = _.omit(oSumVariant, 'VARIANTS');
            let oSyntacticallyCorrectVariant = oUtils.checkEntity({
                entity: oVariantToValidate,
                categoryId: -1,
                subitemState: -1,
                metadata: aSumVariantMetadata
            });
            await checkNonTemporaryMasterdataReferences(oSyntacticallyCorrectVariant);
        }

        async function checkVariantItems(aVariantItems, aVariantItemMetadata) {
            const aSyntacticallyCorrectVariantItems = [];
            aVariantItems.forEach(oVariantItem => {
                const oSyntacticallyCorrectItem = oUtils.checkEntity({
                    entity: oVariantItem,
                    categoryId: -1,
                    subitemState: -1,
                    metadata: aVariantItemMetadata
                });
                await oUtils.checkNonTemporaryMasterdataReferences(oSyntacticallyCorrectItem, ['QUANTITY_UOM_ID'], aExistingUOMs);
                aSyntacticallyCorrectVariantItems.push(oSyntacticallyCorrectItem);
            });
            return aSyntacticallyCorrectVariantItems;
        }

        async function changeMandatoryMetadataAttribute(aVariantMetadata, aAttributes, bIsMandatory) {
            const aVariantMetadataAdapted = aVariantMetadata;
            if (aVariantMetadataAdapted) {
                aAttributes.forEach(sAttribute => {
                    const iIndex = aVariantMetadata.indexOf(_.find(aVariantMetadata, oMetadata => oMetadata.COLUMN_ID === sAttribute));
                    aVariantMetadataAdapted[iIndex].ATTRIBUTES[0].IS_MANDATORY = bIsMandatory;
                    aVariantMetadataAdapted[iIndex].ATTRIBUTES[0].IS_READ_ONLY = 0;
                    return aVariantMetadataAdapted;
                });
            }
            return aVariantMetadata;
        }

        async function getVariantItemTableTypeTemplate(iVariantId) {
            return {
                VARIANT_ID: iVariantId,
                ITEM_ID: null,
                IS_INCLUDED: 1,
                QUANTITY: null,
                QUANTITY_UOM_ID: null
            };
        }

        async function getVariantTableTypeTemplate(iCalculationVersionId) {
            return {
                VARIANT_ID: null,
                CALCULATION_VERSION_ID: iCalculationVersionId,
                VARIANT_NAME: null,
                COMMENT: null,
                EXCHANGE_RATE_TYPE_ID: null,
                REPORT_CURRENCY_ID: null,
                SALES_PRICE: null,
                SALES_PRICE_CURRENCY_ID: null,
                VARIANT_ORDER: SQLMaximumInteger,
                IS_SELECTED: 0,
                LAST_REMOVED_MARKINGS_ON: null,
                LAST_REMOVED_MARKINGS_BY: null,
                LAST_MODIFIED_ON: null,
                LAST_MODIFIED_BY: null,
                LAST_CALCULATED_ON: null,
                LAST_CALCULATED_BY: null
            };
        }
        async function transposeCompressedItemsToTableType(oItemValues, iVariantId) {
            const aItemProperties = Object.keys(_.omit(oItemValues, 'VARIANT_ID'));
            if (_.isUndefined(oItemValues.ITEM_ID)) {
                const sClientMsg = 'ITEM_ID is mandatory in the request body of variant items.';
                const sServerMsg = `${ sClientMsg } Please check variant: ${ iVariantId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }
            if (!_.isArray(oItemValues.ITEM_ID)) {
                const oMessageDetails = new MessageDetails().addVariantObjs({ id: iVariantId });
                const sClientMsg = 'Variant items must have a compressed structure.';
                const sServerMsg = `${ sClientMsg } Variant could not be transposed. Please check variant: ${ iVariantId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
            }
            const aItemsTransposed = oItemValues.ITEM_ID.map((iItemId, iIndex) => {
                const oItemTransposed = {};
                aItemProperties.forEach(sPropertyName => {
                    oItemTransposed[sPropertyName] = oItemValues[sPropertyName][iIndex];
                });
                // make sure that the created items satisfy to the table type for variant items
                const oItemTransposedExpanded = _.extend(await getVariantItemTableTypeTemplate(iVariantId), oItemTransposed);
                return oItemTransposedExpanded;
            });
            return aItemsTransposed;
        }

        async function checkVariantHasItems(oVariant) {
            if (!oVariant.ITEMS) {
                const sDeveloperInfo = "Mandatory field 'ITEMS' missing";
                const sClientInfo = 'Mandatory field missing';
                $.trace.error(sDeveloperInfo);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientInfo);
            }
        }
        async function checkItemAttributesLength(aRequestItemsCompressed) {
            const iMaxDifferentLengthsAllowed = 1;
            const oItemAttributesLengthSet = new Set(aRequestItemsCompressed.map(aRequestItemAttribute => aRequestItemAttribute.length));
            if (oItemAttributesLengthSet.size > iMaxDifferentLengthsAllowed) {
                const sDeveloperInfo = 'At least one item attribute has more or less values than others';
                const sClientInfo = 'Item attributes values missmatch. Please check the request body.';
                $.trace.error(sDeveloperInfo);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientInfo);
            }
        }

        async function validatePostRequest() {
            const aVariants = oUtils.tryParseJson(oRequest.body.asString());
            const iCalculationVersionId = mValidatedParameters.calculation_version_id;
            if (!_.isArray(aVariants)) {
                const sMsg = 'The variants which need to be calculated have to be an array';
                $.trace.error(sMsg);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sMsg);
            }
            let aVariantMetadata = oMetadataProvider.get(BusinessObjectTypes.Variant, BusinessObjectTypes.Variant, null, null, oPersistency);
            let aVariantItemMetadata = oMetadataProvider.get(BusinessObjectTypes.VariantItem, BusinessObjectTypes.VariantItem, null, null, oPersistency);
            const aSyntacticallyCorrectVariants = [];
            const aSyntacticallyCorrectVariantItems = [];
            aVariants.forEach(oVariant => {
                await checkVariantHasItems(oVariant);
                aVariantMetadata = await changeMandatoryMetadataAttribute(aVariantMetadata, [
                    'VARIANT_NAME',
                    'REPORT_CURRENCY_ID'
                ], 0);
                aVariantMetadata = await changeMandatoryMetadataAttribute(aVariantMetadata, ['VARIANT_ID'], 1);
                const oSyntacticallyCorrectVariant = await checkVariant(oVariant, aVariantMetadata);
                const oSyntacticallyCorrectVariantExpanded = _.extend(await getVariantTableTypeTemplate(iCalculationVersionId), oSyntacticallyCorrectVariant);
                const oVariantItems = oVariant.ITEMS;
                if (_.isArray(oVariantItems)) {
                    const sClientMsg = 'Variant items have to be an object.';
                    const sServerMsg = `${ sClientMsg } Please check variant: ${ oVariant.VARIANT_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }

                const aVariantItemsValues = _.values(oVariantItems);
                const aVariantItemsKeys = _.keys(oVariantItems);
                if (aVariantItemsKeys.indexOf('VARIANT_ID') >= 0) {
                    const sClientMsg = 'VARIANT_ID is not allowed in the request body of variant items.';
                    const sServerMsg = `${ sClientMsg } Please check variant: ${ oVariant.VARIANT_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }
                await checkItemAttributesLength(aVariantItemsValues);
                const aItemsTransposed = await transposeCompressedItemsToTableType(oVariant.ITEMS, oVariant.VARIANT_ID);
                aVariantItemMetadata = await changeMandatoryMetadataAttribute(aVariantItemMetadata, ['VARIANT_ID'], 1);
                const aSyntacticallyCorrectItems = await checkVariantItems(aItemsTransposed, aVariantItemMetadata);

                aSyntacticallyCorrectVariantItems.push(...aSyntacticallyCorrectItems);
                aSyntacticallyCorrectVariants.push(oSyntacticallyCorrectVariantExpanded);
            });

            return {
                VARIANTS: aSyntacticallyCorrectVariants,
                VARIANT_ITEMS: aSyntacticallyCorrectVariantItems
            };
        }
        async function validatePutRequest() {
            oUtils.checkEmptyBody(oRequest.body);
        }

        validateSumRequest = () => {
            const oSumVariant = oUtils.tryParseJson(oRequest.body.asString());
            const iCalculationVersionId = mValidatedParameters.calculation_version_id;
            if (!_.isArray(oSumVariant.VARIANTS)) {
                const sMsg = 'The variants for which the sum is calculated have to be an array';
                $.trace.error(sMsg);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sMsg);
            }

            await checkSumVariant(oSumVariant);

            let aVariantMetadata = oMetadataProvider.get(BusinessObjectTypes.Variant, BusinessObjectTypes.Variant, null, null, oPersistency);
            const aSyntacticallyCorrectVariants = [];
            oSumVariant.VARIANTS.forEach(oVariant => {
                aVariantMetadata = await changeMandatoryMetadataAttribute(aVariantMetadata, ['VARIANT_ID'], 1);
                aVariantMetadata = await changeMandatoryMetadataAttribute(aVariantMetadata, [
                    'EXCHANGE_RATE_TYPE_ID',
                    'REPORT_CURRENCY_ID',
                    'VARIANT_NAME'
                ], 0);
                oSyntacticallyCorrectVariant = await checkVariant(oVariant, aVariantMetadata);
                aSyntacticallyCorrectVariants.push(oSyntacticallyCorrectVariant);
            });
            return {
                VARIANTS: aSyntacticallyCorrectVariants,
                EXCHANGE_RATE_TYPE_ID: oSumVariant.EXCHANGE_RATE_TYPE_ID,
                REPORT_CURRENCY_ID: oSumVariant.REPORT_CURRENCY_ID
            };
        };
        switch (oRequest.method) {
        case $.net.http.POST:
            return oRequest.queryPath.indexOf('sum') !== -1 ? validateSumRequest() : await validatePostRequest();
        case $.net.http.PUT:
            return await validatePutRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    };
}
VariantCalculatorValidator.prototype = Object.create(VariantCalculatorValidator.prototype);
VariantCalculatorValidator.prototype.constructor = VariantCalculatorValidator;
export default {MessageLibrary,PlcException,BusinessObjectTypes,_,MessageDetails,SQLMaximumInteger,VariantCalculatorValidator};
