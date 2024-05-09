/* exported calculateTransient, calculatePersistent */

const _ = require("lodash");
const helpers = require("../util/helpers");
const VariantService = require("../service/variantService");
const MessageLibrary = require("../util/message");
const Constants = require("../util/constants");
const PlcException = MessageLibrary.PlcException;
const MessageDetails = MessageLibrary.Details;
const MessageCode = MessageLibrary.Code;
const CalcEngineErrors = MessageLibrary.FormulaInterpreterErrorMapping;
const PlcMessage = MessageLibrary.Message;
const Severity = MessageLibrary.Severity;

module.exports.VariantCalculator = function($) {

function handleCalcEngineErrors(aCalcEngineErrors, oServiceOutput) {
    aCalcEngineErrors.forEach((error) => {
        const oDetails = new MessageDetails();
        let oCalcEngineDetails = {};
        if (_.has(error, "ERROR_DETAILS") && error.ERROR_DETAILS !== null) {
            oCalcEngineDetails = JSON.parse(`{${error.ERROR_DETAILS}}`);
        }
        oDetails.calculationEngineObj = oCalcEngineDetails;
        oDetails.calculationEngineObj.itemId = error.ITEM_ID;
        oDetails.calculationEngineObj.variantId = error.VARIANT_ID;
        let oErrorCode = {};
        if (_.has(CalcEngineErrors, error.ERROR_CODE)) {
            oErrorCode = CalcEngineErrors[error.ERROR_CODE];
        } else {
            const sLogMessage = `Invalid error code. See backend log for details. Invalid error code: ${error.ERROR_CODE}.`;
            $.trace.error(sLogMessage);
            throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        const oError = new PlcMessage(oErrorCode, Severity.WARNING, oDetails, "Calculate");
        oServiceOutput.addMessage(oError);
    });
}

this.calculateTransient = function(oRequestVariantsAndItems, mParameters, oServiceOutput, oPersistency) {
    const iCalculationVersionId = mParameters.calculation_version_id;
    VariantService.checkCalculationVersionExists(oPersistency, iCalculationVersionId);
    VariantService.checkConcurrentVariantMatrixLock(oPersistency, iCalculationVersionId);
    VariantService.checkQuantityStateValues(oPersistency, oRequestVariantsAndItems.VARIANT_ITEMS, iCalculationVersionId);

    const oProcedureResult = oPersistency.Variant.calculateVariant(iCalculationVersionId, oRequestVariantsAndItems.VARIANTS, oRequestVariantsAndItems.VARIANT_ITEMS);
    const mCalculatedVariantItems = new Map();
    Array.from(oProcedureResult.CALCULATED_VARIANT_ITEMS).forEach((oCalculatedVariantItem) => {
        if (!mCalculatedVariantItems.has(oCalculatedVariantItem.VARIANT_ID)) {
            mCalculatedVariantItems.set(oCalculatedVariantItem.VARIANT_ID, []);
        }
        mCalculatedVariantItems.get(oCalculatedVariantItem.VARIANT_ID).push(oCalculatedVariantItem);
    });

    const oCalculatedVariantResult = Array.from(oProcedureResult.CALCULATED_VARIANT_HEADER).map((oCalculatedVariant) => {
        const oVariant = _.clone(oCalculatedVariant);
        oVariant.LAST_CALCULATED_ON = new Date();
        oVariant.LAST_CALCULATED_BY = $.getPlcUsername();
        oVariant.ITEMS = helpers.transposeResultArrayOfObjects(mCalculatedVariantItems.get(oVariant.VARIANT_ID), false);
        return _.omit(oVariant, "VARIANT_ORDER");
    });

    const aErrors = Array.from(oProcedureResult.ERRORS);
    handleCalcEngineErrors(aErrors, oServiceOutput);
    oServiceOutput.setCalculationResult(oCalculatedVariantResult);
}

this.calculatePersistent = function(oEmptyBody, mParameters, oServiceOutput, oPersistency) {
    const iCalculationVersionId = mParameters.calculation_version_id;
    const iVariantId = mParameters.variant_id;
    VariantService.checkCalculationVersionExists(oPersistency, iCalculationVersionId);
    VariantService.checkConcurrentVariantMatrixLock(oPersistency, iCalculationVersionId);
    VariantService.checkVersionIsNotFrozen(oPersistency, iCalculationVersionId);
    VariantService.checkVersionIsNotLifecycleVersion(oPersistency, iCalculationVersionId);
    const oExistingVariant = oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId);
    if (_.isUndefined(oExistingVariant)) {
        const sClientMsg = "No variant exists for the given id.";
        const sServerMsg = `${sClientMsg} Variant id: ${iVariantId}.`;
        $.trace.error(sServerMsg);
        throw new PlcException(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
    }
    const aVariantReadOnlyFields = ["TOTAL_COST", "TOTAL_SALES_PRICE",
        // LAST_GENERATED_VERSION_ID and LAST_GENERATED_CALCULATION_ID are transient fields generated by the
        // select in getVariant(); they need to be removed because they don't exists in the table type either
        "LAST_GENERATED_VERSION_ID", "LAST_GENERATED_CALCULATION_ID"];
    const aVariantToBeCalculated = [_.omit(oExistingVariant, aVariantReadOnlyFields)];

    const aExistingVariantItems = oPersistency.Variant.getVariantItems(iVariantId);
    const aVariantItemReadOnlyFields = ["TOTAL_QUANTITY", "TOTAL_COST", "QUANTITY_CALCULATED", "CALCULATION_VERSION_ID"];
    const aVariantItemsToBeCalculated = aExistingVariantItems.map(oCurrentItem => _.omit(oCurrentItem, aVariantItemReadOnlyFields));

    const oProcedureResult = oPersistency.Variant.calculateVariant(iCalculationVersionId, aVariantToBeCalculated, aVariantItemsToBeCalculated);
    const aCalculatedVariantResult = Array.from(oProcedureResult.CALCULATED_VARIANT_HEADER);
    aCalculatedVariantResult[0].LAST_CALCULATED_ON = new Date();
    aCalculatedVariantResult[0].LAST_CALCULATED_BY = $.getPlcUsername();
    oPersistency.Variant.update(aCalculatedVariantResult, aVariantToBeCalculated, iCalculationVersionId);

    const aCalculatedVariantItems = Array.from(oProcedureResult.CALCULATED_VARIANT_ITEMS);
    const aItemsToUpdate = aCalculatedVariantItems.map(oItemCalculationResult => _.omit(oItemCalculationResult, "VARIANT_ID"));
    oPersistency.Variant.updateVariantItems(iVariantId, aItemsToUpdate);

    const aErrors = Array.from(oProcedureResult.ERRORS);
    handleCalcEngineErrors(aErrors, oServiceOutput);
}

/**
 * Calculates a sum variant based on the input.
 * @param {object} oRequestVariants - contains the variants for which the sum is calculated
 * @param {map} mParameters - map with the parameters the service uses
 * @param {object} oServiceOutput - object used to set the requests response
 * @param {object} oPersistency - object used to persist the calculated variants
 */
this.calculateSumVariant = (oRequestVariants, mParameters, oServiceOutput, oPersistency) => {
    const iCalculationVersionId = mParameters.calculation_version_id;
    VariantService.checkCalculationVersionExists(oPersistency, iCalculationVersionId);
    VariantService.checkConcurrentVariantMatrixLock(oPersistency, iCalculationVersionId);
    const bIsFormulaUsed = oPersistency.Metadata.checkIfFormulaContainsString("$TOTAL_QUANTITY_OF_VARIANTS");
    const oMaximumNumberOfVariants = oPersistency.FrontendSettings.getFrontendSettings(Constants.MaxNoOfVariantsSettingType, null);
    if (oMaximumNumberOfVariants.length === 0) {
        const oDetails = new MessageDetails();
        oDetails.addSettingsObj({
            id : Constants.MaxNoOfVariantsSettingType
        });
        const sLogMessage = "The maximum number of variants setting doesn't exist.";
        $.trace.error(sLogMessage);
        throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oDetails)
    }
    const iMaximumNumberOfVariants = parseInt(oMaximumNumberOfVariants[0].SETTING_CONTENT);
    if (oRequestVariants.VARIANTS.length > iMaximumNumberOfVariants) {
        const oDetails = new MessageDetails();
        oDetails.addCalculationVersionObjs({
            id : iCalculationVersionId
        });
        const sLogMessage = "The calculation version exceeds the allowed number of variants.";
        $.trace.error(sLogMessage);
        throw new PlcException(MessageCode.NUMBER_OF_VARIANTS_ERROR, sLogMessage, oDetails);
    }
    const oProcedureResult = oPersistency.Variant.calculateSumVariant(iCalculationVersionId, oRequestVariants.EXCHANGE_RATE_TYPE_ID, oRequestVariants.REPORT_CURRENCY_ID, oRequestVariants.VARIANTS);
    var aCalculatedVariantResult = Array.from(oProcedureResult.OT_CALCULATED_VARIANT_HEADER);
    if(!bIsFormulaUsed){
        aCalculatedVariantResult = aCalculatedVariantResult.filter(oVariant => oVariant.VARIANT_TYPE === 1 );
    }
    if(mParameters.persist)
    {
        aCalculatedVariantResult.forEach(oVariant => {
            persistVariantsAfterRecalculation(oVariant, iCalculationVersionId, oPersistency);
            const aCalculatedVariantItems = Array.from(oProcedureResult.OT_CALCULATED_VARIANT_ITEMS).filter(oItemCalculationResult => oItemCalculationResult.VARIANT_ID === oVariant.VARIANT_ID);
            const aItemsToUpdate = aCalculatedVariantItems.map(oItemCalculationResult => _.omit(oItemCalculationResult, "VARIANT_ID"));
            oPersistency.Variant.updateVariantItems(oVariant.VARIANT_ID, aItemsToUpdate);
            if(oVariant.VARIANT_TYPE === 1){
                oPersistency.Item.setTotalQuantityOfVariants(iCalculationVersionId, oVariant.VARIANT_ID);
                oPersistency.Variant.addQuantityUomToItems(oVariant.VARIANT_ID);
            }
        });
    } else {
        const mCalculatedVariantItems = new Map();
        Array.from(oProcedureResult.OT_CALCULATED_VARIANT_ITEMS).forEach((oCalculatedVariantItem) => {
            if (!mCalculatedVariantItems.has(oCalculatedVariantItem.VARIANT_ID)) {
                mCalculatedVariantItems.set(oCalculatedVariantItem.VARIANT_ID, []);
            }
            mCalculatedVariantItems.get(oCalculatedVariantItem.VARIANT_ID).push(oCalculatedVariantItem);
        });
    
        aCalculatedVariantResult = aCalculatedVariantResult.map((oCalculatedVariant) => {
            const oVariant = _.clone(oCalculatedVariant);
            oVariant.LAST_CALCULATED_ON = new Date();
            oVariant.LAST_CALCULATED_BY = $.getPlcUsername();
            oVariant.ITEMS = helpers.transposeResultArrayOfObjects(mCalculatedVariantItems.get(oVariant.VARIANT_ID), false);
            return _.omit(oVariant, "VARIANT_ORDER");
        });
    
        const aErrors = Array.from(oProcedureResult.OT_ERRORS);
        handleCalcEngineErrors(aErrors, oServiceOutput);
        oServiceOutput.setCalculationResult(aCalculatedVariantResult);
    }
}
    
function persistVariantsAfterRecalculation(oVariant, iCalculationVersionId, oPersistency) {
    const oExistingVariant = oPersistency.Variant.getVariant(iCalculationVersionId, oVariant.VARIANT_ID);
    if (_.isUndefined(oExistingVariant)) {
        const sClientMsg = "No variant exists for the given id.";
        const sServerMsg = `${sClientMsg} Variant id: ${oVariant.VARIANT_ID}.`;
        $.trace.error(sServerMsg);
        throw new PlcException(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
    }
    oVariant.LAST_CALCULATED_ON = new Date();
    oVariant.LAST_CALCULATED_BY = $.getPlcUsername();
    oPersistency.Variant.update([oVariant], [oExistingVariant], iCalculationVersionId);
}
}; // end of module.exports.VariantCalculatorwh
