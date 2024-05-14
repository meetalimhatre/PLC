/* exported generateCalculationVersion */

const _ = require('lodash');
const VariantService = require('../service/variantService');
const AuthorizationManager = require('../authorization/authorization-manager');

module.exports.VariantGenerator = function ($) {

    const that = this;

    /**
* Function that retrieves the calculation id for a given version id and variant id.
* This function can return either the last generated calculation id of a given variant
* or it can return the base calculation id (the parent of the variant matrix for the given variant id).
* The last generated calculation id must be used instead of the base calculation id.
*/
    this.getBaseOrLastGeneratedCalculationId = async function (oPersistency, iCalculationVersionId, iVariantId) {
        const oVariant = await oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId);
        let iCalculationId;
        if (_.isNull(oVariant.LAST_GENERATED_CALCULATION_ID)) {
            const oCalculationVersion = oPersistency.CalculationVersion.getWithoutItemsPersistent([iCalculationVersionId]);
            iCalculationId = oCalculationVersion.length !== 0 ? oCalculationVersion[0].CALCULATION_ID : -1;
        } else {
            iCalculationId = oVariant.LAST_GENERATED_CALCULATION_ID;
            // check instance-based privilege for the last generated calculation
            await AuthorizationManager.checkPrivilege(AuthorizationManager.BusinessObjectTypes.Calculation, iCalculationId, AuthorizationManager.Privileges.CREATE_EDIT, await oPersistency.getConnection(), $.getPlcUsername());
        }
        return iCalculationId;
    };




    this.generateNewVersionName = async function (oPersistency, iCalculationVersionId, iVariantId) {
        const oCalculationVersion = oPersistency.CalculationVersion.getWithoutItemsPersistent([iCalculationVersionId]);
        const oVariant = await oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId);
        let sReturnedName;
        if (oCalculationVersion.length === 0 || _.isUndefined(oVariant)) {
            sReturnedName = '';
        } else {
            sReturnedName = `${ oCalculationVersion[0].CALCULATION_VERSION_NAME } - ${ oVariant.VARIANT_NAME }`;
        }
        return sReturnedName;
    };






    function getPredecessorConditions(mExcludedVariantItems, aVersionItemsInexistentPredecessor) {
        const aItemsToUpdatePredecessor = [];
        aVersionItemsInexistentPredecessor.forEach(oInexistentItemPredecessor => {
            const iInexistentItemPredecessorId = oInexistentItemPredecessor.PREDECESSOR_ITEM_ID;
            let iCorrectPredecessor = mExcludedVariantItems.get(iInexistentItemPredecessorId);
            while (!_.isUndefined(mExcludedVariantItems.get(iCorrectPredecessor))) {
                iCorrectPredecessor = mExcludedVariantItems.get(iCorrectPredecessor);
            }
            aItemsToUpdatePredecessor.push({
                CORRECT_PREDECESSOR: iCorrectPredecessor,
                PREDECESSOR_TO_CHANGE: iInexistentItemPredecessorId
            });
        });
        return aItemsToUpdatePredecessor;
    }









    this.getCalculationVersionName = async function (oPersistency, mParameters, sReqVersionName, iCalculationId) {
        let sequence = 0;
        const sVersionName = sReqVersionName || that.generateNewVersionName(oPersistency, mParameters.calculation_version_id, mParameters.variant_id);
        let sReturnedName = sVersionName;
        while (!await oPersistency.CalculationVersion.isNameUnique(iCalculationId, mParameters.calculation_version_id, sReturnedName)) {
            sequence += 1;
            sReturnedName = `${ sVersionName } (${ sequence })`;
        }
        return sReturnedName;
    };




    this.generateCalculationVersion = async function (oBody, mParameters, oServiceOutput, oPersistency) {
        const iCalculationVersionId = mParameters.calculation_version_id;
        const iVariantId = mParameters.variant_id;
        const iTargetCalculationId = oBody.TARGET_CALCULATION_ID;
        if (!_.isUndefined(iTargetCalculationId)) {

            await AuthorizationManager.checkPrivilege(AuthorizationManager.BusinessObjectTypes.Calculation, iTargetCalculationId, AuthorizationManager.Privileges.CREATE_EDIT, await oPersistency.getConnection(), $.getPlcUsername());
        }
        await VariantService.checkVariantExists(oPersistency, iCalculationVersionId, iVariantId);
        const iCalculationId = iTargetCalculationId || that.getBaseOrLastGeneratedCalculationId(oPersistency, iCalculationVersionId, iVariantId);
        const sCalculationVersionName = that.getCalculationVersionName(oPersistency, mParameters, oBody.CALCULATION_VERSION_NAME, iCalculationId);

        const iGeneratedCalculationVersionId = oPersistency.Variant.generateCalculationVersion(iVariantId, iCalculationId, sCalculationVersionName);
        oPersistency.Variant.generateCalculationVersionItems(iGeneratedCalculationVersionId, iVariantId);
        const aVersionItemsInexistentPredecessor = oPersistency.Variant.getVersionItemsWrongPredecessor(iGeneratedCalculationVersionId, iVariantId);
        if (aVersionItemsInexistentPredecessor.length > 0) {
            const aExcludedVariantItems = oPersistency.Variant.getExcludedVariantItems(iCalculationVersionId, iVariantId);
            const mExcludedVariantItems = new Map(aExcludedVariantItems.map(oExcludedItem => [
                oExcludedItem.ITEM_ID,
                oExcludedItem.PREDECESSOR_ITEM_ID
            ]));
            const aItemsToUpdatePredecessor = await getPredecessorConditions(mExcludedVariantItems, aVersionItemsInexistentPredecessor);
            oPersistency.Variant.updateVersionItemsPredecessors(iGeneratedCalculationVersionId, aItemsToUpdatePredecessor);
        }


        oPersistency.CalculationVersion.calculatePersistent(iGeneratedCalculationVersionId);

        const oOutputVariant = _.omit(await oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId), 'VARIANT_ORDER');
        oServiceOutput.setStatus($.net.http.CREATED);
        oServiceOutput.addTransactionalData(oOutputVariant);
    };

};
export default {_,VariantService,AuthorizationManager};
