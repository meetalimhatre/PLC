const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const MessageCode = MessageLibrary.Code;

module.exports.Masterdata = function ($) {

    const sUserId = $.getPlcUsername();

    /*
* Handles a HTTP GET request to get masterdata for the given calculation version id.
*/
    this.getMasterdata = async function (aBodyItems, mParameters, oServiceOutput, oPersistency) {
 // eslint-disable-line no-unused-vars
        const mSessionDetails = await oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
        const iCalculationVersionId = mParameters.calculation_version_id;
        if (!oPersistency.CalculationVersion.exists(iCalculationVersionId)) {
            const sClientMsg = 'Calculation version does not exist.';
            const sServerMsg = `${ sClientMsg }. Id of the calculation version: ${ iCalculationVersionId }`;
            await $.trace.info(sServerMsg);
            throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        const oMasterdata = await oPersistency.Masterdata.getMasterdata(mSessionDetails.language, iCalculationVersionId, sUserId);
        oServiceOutput.setMasterdata(oMasterdata);
    };

};
export default {MessageLibrary,PlcException,MessageCode};
