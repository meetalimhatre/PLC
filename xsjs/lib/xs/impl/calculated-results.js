const helpers = require('../util/helpers');

module.exports.CalculatedResults = function ($) {
    /**
 * Handles a HTTP GET request to get the calculated results for the given calculation version, without transactional data. 
 * The calculated results are set in the dispatcher for the parameter calculate = true; 
 * If calculate!=true, the calculated results are read from the tables;
 */

    this.get = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {
        var iCalculationVersionId = await helpers.toPositiveInteger(mParameters.id);

        if (await helpers.isNullOrUndefined(mParameters.calculate) || mParameters.calculate !== true) {
            const oResult = oPersistency.CalculationVersion.getSavedCalculationResults(iCalculationVersionId);
            let oCalculationResult = {};
            if (mParameters.compressedResult) {
                oCalculationResult = {
                    ITEM_CALCULATED_FIELDS_COMPRESSED: await helpers.transposeResultArray(oResult.ITEM_CALCULATED_FIELDS),
                    ITEM_CALCULATED_VALUES_COSTING_SHEET_COMPRESSED: await helpers.transposeResultArray(oResult.ITEM_CALCULATED_VALUES_COSTING_SHEET),
                    ITEM_CALCULATED_VALUES_COMPONENT_SPLIT_COMPRESSED: await helpers.transposeResultArray(oResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT)
                };
            } else {
                oCalculationResult = {
                    ITEM_CALCULATED_FIELDS: Array.from(oResult.ITEM_CALCULATED_FIELDS),
                    ITEM_CALCULATED_VALUES_COSTING_SHEET: Array.from(oResult.ITEM_CALCULATED_VALUES_COSTING_SHEET),
                    ITEM_CALCULATED_VALUES_COMPONENT_SPLIT: Array.from(oResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT)
                };
            }

            // Add custom fields currency values to calculated values from the AFL side
            if (mParameters.compressedResult) {
                oPersistency.CalculationVersion.addCurrencyUnitsToCalculationResults(iCalculationVersionId, oCalculationResult.ITEM_CALCULATED_FIELDS_COMPRESSED, oPersistency, true);
            } else {
                oPersistency.CalculationVersion.addCurrencyUnitsToCalculationResults(iCalculationVersionId, oCalculationResult.ITEM_CALCULATED_FIELDS, oPersistency, false);
            }

            oServiceOutput.setCalculationResult(oCalculationResult);
        }

        return oServiceOutput;
    };

};
export default {helpers};
