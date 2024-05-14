const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const BusinessObjectTypes = $.require('../util/constants').BusinessObjectTypes;
const _ = $.require('lodash');
const GenericSyntaxValidator = $.require('./genericSyntaxValidator').GenericSyntaxValidator;
const helpers = $.require('../util/helpers');

function VariantValidator(oPersistency, oMetadataProvider, oUtils) {
    this.validate = async function validate(oRequest, mValidatedParameters) {
        function validateGetRequest() {
            oUtils.checkEmptyBody(oRequest.body);
        }
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
            const bChangesAccepted = oVariant.CHANGES_ACCEPTED;
            const oVariantToValidate = _.omit(oVariant, [
                'ITEMS',
                'CHANGES_ACCEPTED'
            ]);
            const oSyntacticallyCorrectVariant = oUtils.checkEntity({
                entity: oVariantToValidate,
                categoryId: -1,
                subitemState: -1,
                metadata: aVariantMetadata
            });
            await checkNonTemporaryMasterdataReferences(oSyntacticallyCorrectVariant);
            if (!helpers.isNullOrUndefined(bChangesAccepted)) {
                const genericSyntaxValidator = await new GenericSyntaxValidator();
                oSyntacticallyCorrectVariant.CHANGES_ACCEPTED = await genericSyntaxValidator.validateValue(bChangesAccepted, 'BooleanInt', null, false);
            }
            return oSyntacticallyCorrectVariant;
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
        async function validateUpdateOrderRequest(oBody) {
            const genericSyntaxValidator = await new GenericSyntaxValidator();
            const aValidatedVariantIds = [];
            oBody.forEach(oVariantId => {
                await oUtils.checkMandatoryProperties(oVariantId, [
                    'VARIANT_ID',
                    'LAST_MODIFIED_ON'
                ]);
                oUtils.checkInvalidProperties(oVariantId, [
                    'VARIANT_ID',
                    'LAST_MODIFIED_ON'
                ]);

                const oValidatedVariant = {};
                oValidatedVariant.VARIANT_ID = await genericSyntaxValidator.validateValue(oVariantId.VARIANT_ID, 'PositiveInteger', null, true);
                oValidatedVariant.LAST_MODIFIED_ON = await genericSyntaxValidator.validateValue(oVariantId.LAST_MODIFIED_ON, 'UTCTimestamp', null, true);
                aValidatedVariantIds.push(oValidatedVariant);
            });
            return aValidatedVariantIds;
        }
        async function changeMandatoryMetadataAttribute(aVariantMetadata, sAttribute, bIsMandatory) {
            const aVariantMetadataAdapted = aVariantMetadata;
            if (aVariantMetadataAdapted) {
                const iIndex = aVariantMetadata.indexOf(_.find(aVariantMetadata, oMetadata => oMetadata.COLUMN_ID === sAttribute));
                aVariantMetadataAdapted[iIndex].ATTRIBUTES[0].IS_MANDATORY = bIsMandatory;
                aVariantMetadataAdapted[iIndex].ATTRIBUTES[0].IS_READ_ONLY = 0;
                return aVariantMetadataAdapted;
            }
            return aVariantMetadata;
        }
        async function getPatchVariantMetadata(oBody) {
            let aVariantMetadata = oMetadataProvider.get(BusinessObjectTypes.Variant, BusinessObjectTypes.Variant, null, null, oPersistency);

            /*
            * Even though REPORT_CURRENCY_ID, EXCHANGE_RATE_TYPE_ID are usually mandatory in metadata,
            * for PATCH request they are not because only the fields needed for update are sent in the body
            */
            if (aVariantMetadata) {
                const aFieldsNotMandatoryForPatch = [
                    'VARIANT_NAME',
                    'REPORT_CURRENCY_ID',
                    'EXCHANGE_RATE_TYPE_ID'
                ];
                aFieldsNotMandatoryForPatch.forEach(sField => {
                    if (_.isUndefined(oBody[sField])) {
                        aVariantMetadata = await changeMandatoryMetadataAttribute(aVariantMetadata, sField, 0);
                    }
                });
                aVariantMetadata = await changeMandatoryMetadataAttribute(aVariantMetadata, 'LAST_MODIFIED_ON', 1);
            }

            return aVariantMetadata;
        }
        /**
        * Validates the PATCH request
        * There are two possible validations:
        *   - if there are two path variables: calculation_version_id and variant_id then
        *     the PATCH is used to update a variant and/or its items so the body is validated using metadata
        *     since any row can be present in the request (besides VARIANT_ID and CALCULATION_VERSION_ID)
        *   - if there is only one path variable: calculation_version_id, then the request is for update order
        *     and it only contains VARIANT_IDs
        */
        async function validatePatchRequest() {
            const oBody = oUtils.tryParseJson(oRequest.body.asString());
            const bIsPatchUpdateOrder = mValidatedParameters.calculation_version_id && !mValidatedParameters.variant_id;
            const bIsPatchUpdateVariant = mValidatedParameters.calculation_version_id && mValidatedParameters.variant_id;

            if (bIsPatchUpdateOrder) {
                return await validateUpdateOrderRequest(oBody);
            }

            if (bIsPatchUpdateVariant) {
                const aVariantMetadata = await getPatchVariantMetadata(oBody);
                const oSyntacticallyCorrectVariant = await checkVariant(oBody, aVariantMetadata);

                if (oBody.ITEMS) {
                    const aVariantItemMetadata = oMetadataProvider.get(BusinessObjectTypes.VariantItem, BusinessObjectTypes.VariantItem, null, null, oPersistency); //eslint-disable-line
                    oSyntacticallyCorrectVariant.ITEMS = await checkVariantItems(oBody.ITEMS, aVariantItemMetadata);
                }

                return oSyntacticallyCorrectVariant;
            }
            const sLogMessage = `Cannot determine the type of PATCH request: ${ oRequest.queryPath }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        async function checkVariantHasItems(oVariant) {
            if (!oVariant.ITEMS) {
                const sDeveloperInfo = "Mandatory field 'ITEMS' missing";
                const sClientInfo = 'Mandatory field missing';
                $.trace.error(sDeveloperInfo);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientInfo);
            }
        }

        async function validatePostRequest() {
            const oVariant = oUtils.tryParseJson(oRequest.body.asString());
            const aVariantMetadata = oMetadataProvider.get(BusinessObjectTypes.Variant, BusinessObjectTypes.Variant, null, null, oPersistency);
            const aVariantItemMetadata = oMetadataProvider.get(BusinessObjectTypes.VariantItem, BusinessObjectTypes.VariantItem, null, null, oPersistency); //eslint-disable-line

            await checkVariantHasItems(oVariant);

            if (_.isNull(oVariant.IS_SELECTED)) {
                const sDeveloperInfo = "Field 'IS_SELECTED' is not nullable";
                const sClientInfo = 'Field contains invalid value';
                $.trace.error(sDeveloperInfo);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientInfo);
            }

            const oSyntacticallyCorrectVariant = await checkVariant(oVariant, aVariantMetadata);
            oSyntacticallyCorrectVariant.ITEMS = await checkVariantItems(oVariant.ITEMS, aVariantItemMetadata);
            // check to see if is_selected is on the request, if it is null -> decline request
            return oSyntacticallyCorrectVariant;
        }
        async function validateDeleteRequest() {
            oUtils.checkEmptyBody(oRequest.body);
        }

        switch (oRequest.method) {
        case $.net.http.GET:
            return await validateGetRequest();
        case $.net.http.PATCH:
            return await validatePatchRequest();
        case $.net.http.POST:
            return await validatePostRequest();
        case $.net.http.DEL:
            return await validateDeleteRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    };
}
VariantValidator.prototype = Object.create(VariantValidator.prototype);
VariantValidator.prototype.constructor = VariantValidator;
export default {MessageLibrary,PlcException,BusinessObjectTypes,_,GenericSyntaxValidator,helpers,VariantValidator};
