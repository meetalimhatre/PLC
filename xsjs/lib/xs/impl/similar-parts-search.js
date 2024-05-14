const _ = require('lodash');

module.exports.SimilarPartsSearch = function ($) {

    let sSessionId;
    let sUserId;
    sSessionId = sUserId = $.getPlcUsername();

    /**
 * Handle a HTTP POST request. Can be used for searching similar parts depending on input parameters.
 *
 */
    this.handlePostRequest = function (oBodyData, aParameters, oServiceOutput, oPersistency) {

        let aSimilarPartsSearchOutput = [];
        let mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
        _.each(oBodyData, function (oSimilarParameter) {
            let iCalculationVersionId = oSimilarParameter.CALCULATION_VERSION_ID;
            let oSearchOutput = oPersistency.SimilarPartsSearch.search(oSimilarParameter, mSessionDetails.userId, mSessionDetails.language, iCalculationVersionId);
            aSimilarPartsSearchOutput.push(_.extend(
            // filter out other input data (like "ITEM_ID"), as key for batch request
            _.omit(oSimilarParameter, 'CALCULATION_VERSION_ID', 'Attributes', 'Source'), {
                'CALCULATION_VERSION_ID': iCalculationVersionId,
                'SimilarParts': oSearchOutput
            }));
        });
        oServiceOutput.setTransactionalData(aSimilarPartsSearchOutput);
    };

}; // end of module.exports.SimilarPartsSearch
export default {_};
