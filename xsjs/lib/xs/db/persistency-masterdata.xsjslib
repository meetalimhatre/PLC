/* eslint no-var: 0, no-unused-vars: 0 */
const Administration = $.import('xs.db', 'persistency-administration').Administration;
const Procedures = Object.freeze({ p_calculation_version_get_masterdata: 'sap.plc.db.calculationmanager.procedures::p_calculation_version_get_masterdata' });
let administration;

/**
 * Provides persistency operations of masterdata.
 */
function Masterdata(dbConnection, hQuery) {
    this.administration = new Administration(dbConnection, hQuery);
    /**
     * Gets masterdata for a calculation version
     * @param {string} sLanguage - the logon language
     * @param {integer} iCalculationVersionId - the calculation version id
     * @param {string} sUserId - the user id
     *
     *  @returns {oReturnObject} -  Returns an object containing all the masterdata objects,
     *                              found in the database for the calculation version.
     */
    this.getMasterdata = async (sLanguage, iCalculationVersionId, sUserId) => {
        const aCalculationVersionIds = [];
        aCalculationVersionIds.push({ CALCULATION_VERSION_ID: iCalculationVersionId });
        const calculationVersionMasterdata = dbConnection.loadProcedure(Procedures.p_calculation_version_get_masterdata);
        const result = await calculationVersionMasterdata(sLanguage, aCalculationVersionIds, sUserId);

        const oReturnObject = this.administration.fillResultContainer(result);
        return oReturnObject;
    };
}

Masterdata.prototype = Object.create(Masterdata.prototype);
Masterdata.prototype.constructor = Masterdata;
export default {Administration,Procedures,administration,Masterdata};
