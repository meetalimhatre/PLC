/* exported generateCalculationVersion */

const _ = require("lodash");
const VariantService = require("../service/variantService");
const AuthorizationManager = require("../authorization/authorization-manager");

module.exports.VariantGenerator = function($) {

const that = this;

/**
* Function that retrieves the calculation id for a given version id and variant id.
* This function can return either the last generated calculation id of a given variant
* or it can return the base calculation id (the parent of the variant matrix for the given variant id).
* The last generated calculation id must be used instead of the base calculation id.
*/
this.getBaseOrLastGeneratedCalculationId = function(oPersistency, iCalculationVersionId, iVariantId) {
    const oVariant = oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId);
    let iCalculationId;
    if (_.isNull(oVariant.LAST_GENERATED_CALCULATION_ID)) {
        const oCalculationVersion = oPersistency.CalculationVersion.getWithoutItemsPersistent([iCalculationVersionId]);
        iCalculationId = oCalculationVersion.length !== 0 ? oCalculationVersion[0].CALCULATION_ID : -1;
    } else {
        iCalculationId = oVariant.LAST_GENERATED_CALCULATION_ID;
        // check instance-based privilege for the last generated calculation
        AuthorizationManager.checkPrivilege(AuthorizationManager.BusinessObjectTypes.Calculation, iCalculationId, AuthorizationManager.Privileges.CREATE_EDIT, oPersistency.getConnection(), $.getPlcUsername()); //eslint-disable-line
    }
    return iCalculationId;
}

/**
* Generates a new calculation version name (<Variant Base Version name> + <Variant name>)
*/
this.generateNewVersionName = function(oPersistency, iCalculationVersionId, iVariantId) {
    const oCalculationVersion = oPersistency.CalculationVersion.getWithoutItemsPersistent([iCalculationVersionId]);
    const oVariant = oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId);
    let sReturnedName;
    if (oCalculationVersion.length === 0 || _.isUndefined(oVariant)) {
        sReturnedName = "";
    } else {
        sReturnedName = `${oCalculationVersion[0].CALCULATION_VERSION_NAME} - ${oVariant.VARIANT_NAME}`;
    }
    return sReturnedName;
}
 /**
 * Used to correct predecessors for the items that are linked to an item that was excluded before generation
 * Foreach wrong predecessor from the array, a possibly correct replacement is searched in the map.
 * While the possibly correct replacement is found in the map as a key the searching continues.
 * When the searching stops, it means that the right replacement was found.
 */
function getPredecessorConditions(mExcludedVariantItems, aVersionItemsInexistentPredecessor) {
    const aItemsToUpdatePredecessor = [];
    aVersionItemsInexistentPredecessor.forEach((oInexistentItemPredecessor) => {
        const iInexistentItemPredecessorId = oInexistentItemPredecessor.PREDECESSOR_ITEM_ID;
        let iCorrectPredecessor = mExcludedVariantItems.get(iInexistentItemPredecessorId);
        while (!_.isUndefined(mExcludedVariantItems.get(iCorrectPredecessor))) {
            iCorrectPredecessor = mExcludedVariantItems.get(iCorrectPredecessor);
        }
        aItemsToUpdatePredecessor.push({
            CORRECT_PREDECESSOR: iCorrectPredecessor,
            PREDECESSOR_TO_CHANGE: iInexistentItemPredecessorId,
        });
    });
    return aItemsToUpdatePredecessor;
}

/**
* Function that returns a unique calculation version name.
* If the function doesn't recieve a requested version name a new name will be generated from the persistency layer.
* If the function recieves a specific requested version name, it will be used in favor of the name generated
* in the persistency layer.
* Before returning the name it is checked that it is unique. If it is not unique a sequence is added to the end
* of the version name.
*/
this.getCalculationVersionName = function(oPersistency, mParameters, sReqVersionName, iCalculationId) {
    let sequence = 0;
    const sVersionName = sReqVersionName || that.generateNewVersionName(oPersistency, mParameters.calculation_version_id, mParameters.variant_id);
    let sReturnedName = sVersionName;
    while (!oPersistency.CalculationVersion.isNameUnique(iCalculationId, mParameters.calculation_version_id, sReturnedName)) {
        sequence += 1;
        sReturnedName = `${sVersionName} (${sequence})`;
    }
    return sReturnedName;
}

/**
* Handles a HTTP POST request to generate a calculation version from a variant.
*/
this.generateCalculationVersion = function(oBody, mParameters, oServiceOutput, oPersistency) {
    const iCalculationVersionId = mParameters.calculation_version_id;
    const iVariantId = mParameters.variant_id;
    const iTargetCalculationId = oBody.TARGET_CALCULATION_ID;
    if (!_.isUndefined(iTargetCalculationId)) {
        // check instance-based privilege for the target calculation. This check also throws an exception if the iTargetCalculationId doesn't exist.
        AuthorizationManager.checkPrivilege(AuthorizationManager.BusinessObjectTypes.Calculation, iTargetCalculationId, AuthorizationManager.Privileges.CREATE_EDIT, oPersistency.getConnection(), $.getPlcUsername()); //eslint-disable-line
    }
    VariantService.checkVariantExists(oPersistency, iCalculationVersionId, iVariantId);
    const iCalculationId = iTargetCalculationId || that.getBaseOrLastGeneratedCalculationId(oPersistency, iCalculationVersionId, iVariantId);
    const sCalculationVersionName = that.getCalculationVersionName(oPersistency, mParameters, oBody.CALCULATION_VERSION_NAME, iCalculationId);

    const iGeneratedCalculationVersionId = oPersistency.Variant.generateCalculationVersion(iVariantId, iCalculationId, sCalculationVersionName);
    oPersistency.Variant.generateCalculationVersionItems(iGeneratedCalculationVersionId, iVariantId);
    const aVersionItemsInexistentPredecessor = oPersistency.Variant.getVersionItemsWrongPredecessor(iGeneratedCalculationVersionId, iVariantId);
    if (aVersionItemsInexistentPredecessor.length > 0) {
        const aExcludedVariantItems = oPersistency.Variant.getExcludedVariantItems(iCalculationVersionId, iVariantId);
        const mExcludedVariantItems = new Map(aExcludedVariantItems.map(oExcludedItem => [oExcludedItem.ITEM_ID, oExcludedItem.PREDECESSOR_ITEM_ID]));
        const aItemsToUpdatePredecessor = getPredecessorConditions(mExcludedVariantItems, aVersionItemsInexistentPredecessor);
        oPersistency.Variant.updateVersionItemsPredecessors(iGeneratedCalculationVersionId, aItemsToUpdatePredecessor);
    }
    // after generating the new version, it need to be calculated in order to calculated values correctly in accordance to the selected UoM and
    // quantities in the variant
    oPersistency.CalculationVersion.calculatePersistent(iGeneratedCalculationVersionId);

    const oOutputVariant = _.omit(oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId), "VARIANT_ORDER");
    oServiceOutput.setStatus($.net.http.CREATED);
    oServiceOutput.addTransactionalData(oOutputVariant);
}

}; // end of module.exports.VariantGenerator