/* exported get, createVariant, update, updateVariantsOrder, remove */

const MessageLibrary = require("../util/message");
const Constants = require("../util/constants");
const ExpandParameterItems = Constants.CalculationVersionParameters.expand.values.items;
const PlcException = MessageLibrary.PlcException;
const _ = require("lodash");
const MessageCode = MessageLibrary.Code;
const VariantService = require("../service/variantService");
const SQLMaximumInteger = Constants.SQLMaximumInteger;

module.exports.Variants = function($) {

/*
* Handles a HTTP GET request to get variants.
*/
this.get = function(aBodyItems, mParameters, oServiceOutput, oPersistency) {
    const iCalculationVersionId = mParameters.calculation_version_id;
    

    const iVariantId = mParameters.variant_id;
    const bIsExpandItems = mParameters.expand === ExpandParameterItems;
    VariantService.checkCalculationVersionExists(oPersistency, iCalculationVersionId);

    let aResultVariants = [];
    if (iVariantId) {
        // get a single variant
        const oVariant = oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId);
        if (_.isUndefined(oVariant)) {
            const sClientMsg = "No variant exists for the given id.";
            const sServerMsg = `${sClientMsg} Variant id: ${iVariantId}.`;
            $.trace.error(sServerMsg);
            throw new PlcException(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }
        if (bIsExpandItems) {
            // get items for the single variant
            oVariant.ITEMS = oPersistency.Variant.getVariantItems(iVariantId);
        }
        aResultVariants.push(_.omit(oVariant, "VARIANT_ORDER"));
    } else {
        // return all variants headers
        const aReturnedVariants = oPersistency.Variant.getVariants(iCalculationVersionId);
        aResultVariants = aReturnedVariants.map(oReturnedVariant => _.omit(oReturnedVariant, "VARIANT_ORDER"));
    }

    oServiceOutput.setTransactionalData(aResultVariants);
}

/**
* Function that sets for an ITEM all the default variant item properties.
* This is done because the create and the upsert functions perform batch SQL statements
* and all variant items must have the same properties.
* @param {object}
*           oRequestItem - the item that needs the default properties set
* @param {integer}
*           iVariantId - the id of the variant
* @return {object}
*           oItemToUpsert - item with all default properties set
*/
function expandToDefaultVariantItem(oRequestItem, iVariantId) {
    const oDefaultVariantItem = {
        VARIANT_ID: null,
        ITEM_ID: null,
        IS_INCLUDED: 0,
        QUANTITY: null,
        TOTAL_QUANTITY: null,
        TOTAL_COST: null,
    };
    const oItemToUpsert = _.extend({}, oDefaultVariantItem, oRequestItem);
    oItemToUpsert.VARIANT_ID = iVariantId;
    return oItemToUpsert;
}

/**
 * Handles a HTTP PATCH request to upsert the variant items.
 * In order to maintain the base version in sync with its variants, every patch on variant can contain newly created items
 * If the variant item id from the request body is found in the database, then it is updated according to the request
 * Otherwise, a new variant item will be saved in the database
 */
function upsertItems(aRequestItems, iVariantId, oPersistency, iCalculationVersionId) {
    if (aRequestItems.length === 0) {
        return;
    }
    const aItemsIds = aRequestItems.map(oItem => oItem.ITEM_ID);
    const aDatabaseItems = oPersistency.Variant.getVariantItems(iVariantId, aItemsIds);
    const mDatabaseItems = new Map(aDatabaseItems.map(oItem => [oItem.ITEM_ID, _.clone(oItem)]));

    const aItemsToUpsert = aRequestItems.map((oCurrentItem) => {
        const oDatabaseItem = mDatabaseItems.get(oCurrentItem.ITEM_ID);
        let oItemToUpsert = {};
        if (oDatabaseItem) {
            oItemToUpsert = _.extend(oDatabaseItem, _.omit(oCurrentItem, "VARIANT_ID", "ITEM_ID"));
        } else {
            oItemToUpsert = expandToDefaultVariantItem(oCurrentItem, iVariantId);
        }

        return oItemToUpsert;
    });

    oPersistency.Variant.upsertVariantItems(iVariantId, aItemsToUpsert, iCalculationVersionId);
}
/**
 * Function that checks that before creating the variant and the items that the items in the request
 * map to base version items 1:1.
 * This avoids that variants could be created out of sync with the base version.
 */
function checkItemsMapToBaseVersion(oPersistency, aRequestVariantItems, iCalculationVersionId) {
    const aBaseVersionItemIds = oPersistency.Variant.getBaseVersionItems(iCalculationVersionId);
    if (aBaseVersionItemIds.length !== aRequestVariantItems.length) {
        let sClientMsg = "Variant contains too many or too few items compared to the base version.";
        sClientMsg += "Each base version item must have a correspondent variant item (1:1)";
        $.trace.error(sClientMsg);
        throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sClientMsg);
    }
    const mRequestVariantItems = new Map(aRequestVariantItems.map(oItem => [oItem.ITEM_ID, _.clone(oItem)]));
    _.each(aBaseVersionItemIds, (iCurrentItemId) => {
        const oBaseVersionItemId = mRequestVariantItems.get(iCurrentItemId);
        if (!oBaseVersionItemId) {
            const sClientMsg = "Variant contains items which are not present in the base version.";
            $.trace.error(sClientMsg);
            throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sClientMsg);
        }
    });
}
/**
* Handles a HTTP POST request to create variant.
*
* When first creating variants, the VARIANT_ORDER column is set to the maximum value accepted by SQL
*    (so they are at the end in the order priority since they are not sorted yet).
* If the the given calculation version :calculation_version_id is not of type VariantBase yet,
* the variant to create is the first variant for this version.
* Therefore, it is necessary to update the type of this version :calculation_version_id to "VariantBase" -> 4
*/
this.createVariant = function(oBody, mParameters, oServiceOutput, oPersistency) {
    const iCalculationVersionId = mParameters.calculation_version_id;
    VariantService.checkCalculationVersionExists(oPersistency, iCalculationVersionId);
  
    VariantService.checkConcurrentVariantMatrixLock(oPersistency, iCalculationVersionId);
    VariantService.checkVersionIsNotLifecycleVersion(oPersistency, iCalculationVersionId);
    VariantService.checkVersionIsNotFrozen(oPersistency, iCalculationVersionId);
    if(oBody.VARIANT_TYPE === 1){
        VariantService.checkSumVariantIsNotDuplicated(oPersistency, iCalculationVersionId);
    }

    VariantService.isVariantNameUnique(oBody.VARIANT_NAME, iCalculationVersionId, oPersistency);
    checkItemsMapToBaseVersion(oPersistency, oBody.ITEMS, iCalculationVersionId);
    const iVersionType = oPersistency.CalculationVersion.getVersionType(iCalculationVersionId);
    const bVersionIsVariantBase = iVersionType === Constants.CalculationVersionType.VariantBase;    
    const dCurrentTimestamp = new Date();
    const sUserId = $.getPlcUsername();
    const oVariantToCreate = oBody;
    oVariantToCreate.VARIANT_ORDER = SQLMaximumInteger;
    oVariantToCreate.LAST_REMOVED_MARKINGS_ON = dCurrentTimestamp;
    oVariantToCreate.LAST_MODIFIED_ON = dCurrentTimestamp;
    oVariantToCreate.LAST_REMOVED_MARKINGS_BY = sUserId;
    oVariantToCreate.LAST_MODIFIED_BY = sUserId;
    const iVariantId = oPersistency.Variant.createVariant(_.omit(oVariantToCreate, "ITEMS"), iCalculationVersionId, dCurrentTimestamp);
    if (bVersionIsVariantBase === false) {
        oPersistency.CalculationVersion.updateCalculationVersionType(iCalculationVersionId, Constants.CalculationVersionType.VariantBase);
    }
    /**
     * The upsert is performed as batch SQL statement for the sake of performance;
     * This requires that all variant items have the same properties, which is not ensured since only mandatory
     * properties must be sent;
     * Because of that request variant items are blown up to have all necessary properties.
     */
    const aItemsToUpsert = oVariantToCreate.ITEMS.map((oCurrentItem) => {
        let oItemToUpsert = {};
        oItemToUpsert = expandToDefaultVariantItem(oCurrentItem, iVariantId);
        return oItemToUpsert;
    });
    VariantService.checkQuantityStateValues(oPersistency, aItemsToUpsert, iCalculationVersionId);
    const iVersionRootItemId = oPersistency.CalculationVersion.getVersionRootItemId(iCalculationVersionId)[0].ROOT_ITEM_ID;
    const iRootItemIndex = aItemsToUpsert.findIndex(oRootItem => oRootItem.ITEM_ID === iVersionRootItemId);
    if (iRootItemIndex !== -1) {
        if (aItemsToUpsert[iRootItemIndex].QUANTITY) {
            aItemsToUpsert[iRootItemIndex].TOTAL_QUANTITY = aItemsToUpsert[iRootItemIndex].QUANTITY;
        } else {
            aItemsToUpsert[iRootItemIndex].TOTAL_QUANTITY = aItemsToUpsert[iRootItemIndex].QUANTITY = 0;
        }
    }
    oPersistency.Variant.upsertVariantItems(iVariantId, aItemsToUpsert, iCalculationVersionId);
    oPersistency.Variant.removeTemporaryVariants(iCalculationVersionId);

    const oOutputVariant = _.omit(oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId), "VARIANT_ORDER");
    oServiceOutput.setStatus($.net.http.CREATED);
    oServiceOutput.addTransactionalData(oOutputVariant);
}
/**
 * In order to set an optimistic lock, check if the user is trying to update the latest version of the variant
 */
function checkIsCurrentVersion(aRequestVariants, aDatabaseVariants) {
    const mRequestVariants = new Map(aRequestVariants.map(oVariant => [oVariant.VARIANT_ID, oVariant]));
    const oNotCurrentVariantId = _.find(aDatabaseVariants, (oDatabaseVariant) => {
        const oRequestVariant = mRequestVariants.get(oDatabaseVariant.VARIANT_ID);
        return oDatabaseVariant.LAST_MODIFIED_ON.getTime() !== oRequestVariant.LAST_MODIFIED_ON.getTime();
    });

    if (oNotCurrentVariantId) {
        const sClientMsg = "Error while updating. Variant is not current.";
        const sServerMsg = `${sClientMsg} Variant id: ${oNotCurrentVariantId.VARIANT_ID}.`;
        $.trace.error(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR, sClientMsg);
    }
}

/**
 * In order to maintain the base version and its variants in sync if the base of a variant was modified
 * then it's executed a search to find all variant items that don't have a related base item.
 * The extra variant items are deleted.
 */
function deleteNotMatchingVariantIems(oPersistency, oRequestVariant, iCalculationVersionId, iVariantId) {
    const sBaseVersionLastSaved = oPersistency.Variant.getBaseVersionLastModifiedOn(iCalculationVersionId);
    const isBaseVersionModified = sBaseVersionLastSaved.getTime() > oRequestVariant.LAST_MODIFIED_ON.getTime();
    if (isBaseVersionModified) {
        oPersistency.Variant.deleteNotMatchingVariantItems(iCalculationVersionId, iVariantId);
    }
}

/**
 * Handles a HTTP PATCH request to update the variant.
 */
this.update = function(oRequestVariant, mParameters, oServiceOutput, oPersistency) {
    const iCalculationVersionId = mParameters.calculation_version_id;
    const sUserId = $.getPlcUsername();
    const dTimestamp = new Date();
    const bChangesAccepted = oRequestVariant.CHANGES_ACCEPTED === 1;
    
    VariantService.checkVersionIsNotLifecycleVersion(oPersistency, iCalculationVersionId);
    VariantService.checkVersionIsNotFrozen(oPersistency, iCalculationVersionId);

    const oVariantToUpdate = _.omit(oRequestVariant, ["ITEMS", "CHANGES_ACCEPTED"]);
    const iVariantId = mParameters.variant_id;
    oVariantToUpdate.VARIANT_ID = iVariantId;
    oVariantToUpdate.CALCULATION_VERSION_ID = iCalculationVersionId;
    const oBeforeVariant = oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId);

    if (_.isUndefined(oBeforeVariant)) {
        const sLogMessage = "One or more variants do not exist.";
        $.trace.error(sLogMessage);
        throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
    }
    VariantService.checkConcurrentVariantMatrixLock(oPersistency, iCalculationVersionId);
    checkIsCurrentVersion([oVariantToUpdate], [oBeforeVariant]);

    VariantService.isVariantNameUnique(oVariantToUpdate.VARIANT_NAME, iCalculationVersionId, oPersistency, iVariantId);
    const aItemsToUpdate = oRequestVariant.ITEMS;
    if (aItemsToUpdate && aItemsToUpdate.length > 0) {
        const iVersionRootItemId = oPersistency.CalculationVersion.getVersionRootItemId(iCalculationVersionId)[0].ROOT_ITEM_ID;
        const iRootItemIndex = aItemsToUpdate.findIndex(oItemToUpdate => oItemToUpdate.ITEM_ID === iVersionRootItemId);

        if (iRootItemIndex !== -1 && aItemsToUpdate[iRootItemIndex].QUANTITY) {
            aItemsToUpdate[iRootItemIndex].TOTAL_QUANTITY = aItemsToUpdate[iRootItemIndex].QUANTITY;
        }
        VariantService.checkQuantityStateValues(oPersistency, aItemsToUpdate, iCalculationVersionId);

        const aIdsOfItemsToUpdate = aItemsToUpdate.map(item => item.ITEM_ID);
        const aParrentsOfItemsToUpdate = oPersistency.Item.getParentsForItems(iCalculationVersionId, iVersionRootItemId, aIdsOfItemsToUpdate);

        upsertItems(aItemsToUpdate, iVariantId, oPersistency, iCalculationVersionId);

        if(aParrentsOfItemsToUpdate.length > 0) {
            oPersistency.Variant.updateParentsIsIncludedState(iVariantId, aParrentsOfItemsToUpdate);
        }
    }

    oVariantToUpdate.LAST_MODIFIED_ON = dTimestamp;
    oVariantToUpdate.LAST_MODIFIED_BY = sUserId;
    oVariantToUpdate.VARIANT_ID = iVariantId;

    if (bChangesAccepted === true) {
        oVariantToUpdate.LAST_REMOVED_MARKINGS_ON = dTimestamp;
        oVariantToUpdate.LAST_REMOVED_MARKINGS_BY = sUserId;
    }

    oPersistency.Variant.update([oVariantToUpdate], [oBeforeVariant], iCalculationVersionId);
    deleteNotMatchingVariantIems(oPersistency, oRequestVariant, iCalculationVersionId, iVariantId);

    const oOutputVariant = _.omit(oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId), "VARIANT_ORDER");
    oServiceOutput.addTransactionalData(oOutputVariant);
}

/**
* Sets the VARIANT_ORDER for each VARIANT_ID in the request body.
* The order in the request array determines the VARIANT_ORDER from 0 to n-1 (the length of the array)
* So the first VARIANT_ID from the request would take the position 0 and the last one would have the position length - 1
* The variants of the variant matrix, which are not in the request remain untouched
* this could lead the to situation that variants have the same order indicator.
*
* @param {array}   - aRequestVariantIds - an array of variant ids whose order need to be updated
* @returns {array} - an array containing the ordered VARIANT_IDs and their VARIANT_ORDER
*/
function orderVariants(aRequestVariantIds) {
    return aRequestVariantIds.map((iVariantId, iIndex) => ({
        VARIANT_ID: iVariantId,
        VARIANT_ORDER: iIndex,
    }));
}

/**
 * Handles a HTTP PATCH request to update the variants order.
 */
this.updateVariantsOrder = function(aRequestVariantIds, mParameters, oServiceOutput, oPersistency) {
    const iCalculationVersionId = mParameters.calculation_version_id;
    
    VariantService.checkVersionIsNotLifecycleVersion(oPersistency, iCalculationVersionId);
    VariantService.checkVersionIsNotFrozen(oPersistency, iCalculationVersionId);

    const aVariantIds = aRequestVariantIds.map(oVariant => oVariant.VARIANT_ID);
    const aDatabaseVariants = oPersistency.Variant.getVariants(iCalculationVersionId, aVariantIds);
    if (aRequestVariantIds.length !== aDatabaseVariants.length) {
        const sLogMessage = "One or more variants ids do not exist.";
        $.trace.error(sLogMessage);
        throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
    }
    VariantService.checkConcurrentVariantMatrixLock(oPersistency, iCalculationVersionId);
    checkIsCurrentVersion(aRequestVariantIds, aDatabaseVariants);
    const aOrderedVariants = orderVariants(aVariantIds);
    oPersistency.Variant.update(aOrderedVariants, aDatabaseVariants, iCalculationVersionId);
    const aReturnedVariants = oPersistency.Variant.getVariants(iCalculationVersionId, aVariantIds);
    const oOutputVariants = aReturnedVariants.map(oReturnedVariant => _.omit(oReturnedVariant, "VARIANT_ORDER"));

    oServiceOutput.setTransactionalData(oOutputVariants);
}

/**
 * Handles a HTTP DELETE request to remove a variant and it's items.
 * If the deleted variant is the last variant that belongs to the given version, then the type of version is changed to 1 (Base)
 */
this.remove = function(oRequestVariant, mParameters, oServiceOutput, oPersistency) {
    const iCalculationVersionId = mParameters.calculation_version_id;
   
    VariantService.checkConcurrentVariantMatrixLock(oPersistency, iCalculationVersionId);
    VariantService.checkVersionIsNotLifecycleVersion(oPersistency, iCalculationVersionId);
    VariantService.checkVersionIsNotFrozen(oPersistency, iCalculationVersionId);

    const iVariantId = mParameters.variant_id;
    const iDeleteResult = oPersistency.Variant.deleteVariant(iCalculationVersionId, iVariantId);
    if (iDeleteResult < 1) {
        const sLogMessage = "Variant doesn't exist.";
        $.trace.error(sLogMessage);
        throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
    }
    oPersistency.Variant.deleteVariantItems(iVariantId);

    const bIsLastVariantForVersion = oPersistency.Variant.getVariants(iCalculationVersionId).length === 0;
    if (bIsLastVariantForVersion === true) {
        oPersistency.CalculationVersion.updateCalculationVersionType(iCalculationVersionId, Constants.CalculationVersionType.Base);
    }

    //clear total quantity of variants field when sum variant is deleted
    const bIsSumVariant = oPersistency.Variant.checkSumVariantExists(iCalculationVersionId);
    if(!bIsSumVariant){
        oPersistency.Item.clearTotalQauntityOfVariants(iCalculationVersionId);
    }
}

}; // end of module.exports.Variants