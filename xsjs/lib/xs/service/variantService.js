const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const MessageDetails = MessageLibrary.Details;
const MessageCode = MessageLibrary.Code;
const helpers = require('../util/helpers');
const _ = require('lodash');
const Constants = require('../util/constants');


module.exports = {
    checkCalculationVersionExists,
    checkVariantExists,
    checkConcurrentVariantMatrixLock,
    isVariantNameUnique,
    checkVersionIsNotLifecycleVersion,
    checkVersionIsNotFrozen,
    checkQuantityStateValues,
    checkSumVariantIsNotDuplicated
};

async function logError(msg) {
    await helpers.logError(msg);
}
async function logInfo(msg) {
    await helpers.logInfo(msg);
}

async function checkCalculationVersionExists(oPersistency, iCalculationVersionId) {
    if (!oPersistency.CalculationVersion.exists(iCalculationVersionId)) {
        const sClientMsg = 'No calculation version exists for the given id.';
        const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
    }
}

async function checkVariantExists(oPersistency, iCalculationVersionId, iVariantId) {
    const oVariant = await oPersistency.Variant.getVariant(iCalculationVersionId, iVariantId);
    if (_.isUndefined(oVariant)) {
        const sClientMsg = 'No variant exists for the given id.';
        const sServerMsg = `${ sClientMsg } Variant id: ${ iVariantId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
    }
}

/**
 * Checks if there is a lock set to the base version of the variant on which the user is trying to perform CRUP operations
 * If someone except the current user is locking the calculation version in the context of variant matrix, then the current request is not allowed
 * @throws {ENTITY_NOT_WRITABLE_ERROR}
 */
async function checkConcurrentVariantMatrixLock(oPersistency, iCalculationVersionId) {
    const bIsVariantMatrixLocked = oPersistency.Variant.isLockedInAConcurrentVariantContext(iCalculationVersionId);
    if (bIsVariantMatrixLocked === true) {
        const oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
        const sServerMsg = `The variant matrix is currently locked by another user. Base Version id: ${ iCalculationVersionId }.`;
        await logError(sServerMsg);
        oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_BY_ANOTHER_USER);
        throw new PlcException(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR, oMessageDetails);
    }
}

/**
* Checks whether the variant name is unique within (in scope of) the provided calculation version identified by id. The name is
* considered unique if it exists for the same variant-id.
* @param {string}
*            sVariantName - the name of the variant to be checked for uniqueness
* @param {integer}
*            iCalculationVersion - the id of the calculation version
* @param {integer}
*            [iVariantId] - the id of the variant
*                         - the variant id-parameter is not used when this function is called in scope of creating variants
*                         - the variant id-parameter is used in the scope of updating variant headers
*                           since the variant name can be present in the request even if it wasn't changed
*                           so in this case it is allowed that the name is "duplicated" but for the same id
*/
async function isVariantNameUnique(sVariantName, iCalculationVersion, oPersistency, iVariantId) {
    let oCalculationVersionVariant = null;
    const isUpdateRequest = iVariantId;
    const aCalculationVersionVariants = await oPersistency.Variant.getVariants(iCalculationVersion);
    if (isUpdateRequest) {
        oCalculationVersionVariant = aCalculationVersionVariants.find(oVariant => oVariant.VARIANT_NAME === sVariantName && oVariant.VARIANT_ID !== iVariantId);
    } else {
        // Variant name validation for the create request
        oCalculationVersionVariant = aCalculationVersionVariants.find(oVariant => oVariant.VARIANT_NAME === sVariantName);
    }

    if (!helpers.isNullOrUndefined(oCalculationVersionVariant)) {
        const oMessageDetails = new MessageDetails().addVariantObjs({ id: iVariantId });
        const sClientMsg = 'Variant name is not unique.';
        const sServerMsg = `${ sClientMsg } variant name: ${ sVariantName }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageLibrary.Code.VARIANT_NAME_NOT_UNIQUE_ERROR, sClientMsg, oMessageDetails);
    }
}

/**
 * Checks wheather a calculation version is Lifecycle Version.
 * In the context of varinat matrix, a version is editable when: is not a lifecycle version.
 * If the version is a lifecycle version then the current request is not allowed
 * @param oPersistency
 * @param iCalculationVersionId - the id of the calculation version
 * @throws {ENTITY_NOT_WRITABLE_ERROR}
 */
async function checkVersionIsNotLifecycleVersion(oPersistency, iCalculationVersionId) {
    const bIsLifecycleVersion = oPersistency.CalculationVersion.isLifecycleVersion(iCalculationVersionId);
    if (bIsLifecycleVersion === true) {
        const sNotWriteableEntityDetailsCode = MessageLibrary.NotWriteableEntityDetailsCode.IS_LIFECYCLE_VERSION;
        const oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
        const sClientMsg = "Calculation version is not editable as it's a lifecycle version.";
        const sServerMsg = `${ sClientMsg } Id: ${ iCalculationVersionId } `;
        oMessageDetails.setNotWriteableEntityDetailsObj(sNotWriteableEntityDetailsCode);
        await logInfo(sServerMsg);
        throw new PlcException(MessageCode.ENTITY_NOT_WRITABLE_ERROR, sClientMsg, oMessageDetails);
    }
}

/**
 * Checks wheather a calculation version is editable.
 * In the context of varinat matrix, a version is editable when: is not frozen.
 * If the version is frozen then the current request is not allowed
 * @param oPersistency
 * @param iCalculationVersionId - the id of the calculation version
 * @throws {ENTITY_NOT_WRITABLE_ERROR}
 */
async function checkVersionIsNotFrozen(oPersistency, iCalculationVersionId) {
    const bIsFrozenVersion = oPersistency.CalculationVersion.isFrozen(iCalculationVersionId);
    if (bIsFrozenVersion === true) {
        const sNotWriteableEntityDetailsCode = MessageLibrary.NotWriteableEntityDetailsCode.IS_FROZEN;
        const oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
        const sClientMsg = "Calculation version is not editable as it's frozen.";
        const sServerMsg = `${ sClientMsg } Id: ${ iCalculationVersionId } `;
        oMessageDetails.setNotWriteableEntityDetailsObj(sNotWriteableEntityDetailsCode);
        await logInfo(sServerMsg);
        throw new PlcException(MessageCode.ENTITY_NOT_WRITABLE_ERROR, sClientMsg, oMessageDetails);
    }
}

/**
 * Checks wheather a valid values has been assigned to QUANTITY_STATE.
 * Item category text and root item must have the property set to MANUAL ( 1 )
 * @param aVariantsItems
 * @param oPersistency
 * @param iCalculationVersionId - the id of the calculation version
 * @throws {GENERAL_VALIDATION_ERROR}
 */
async function checkQuantityStateValues(oPersistency, aVariantsItems, iCalculationVersionId) {
    var iRootItemId = oPersistency.CalculationVersion.getVersionRootItemId(iCalculationVersionId)[0].ROOT_ITEM_ID;
    var aTextItems = oPersistency.Item.getItemIdsOfCategory(Constants.ItemCategory.TextItem, iCalculationVersionId);
    var aValidValues = _.values(Constants.VariantItemQuantityState);

    aVariantsItems.forEach(oItem => {
        if (oItem.ITEM_ID === iRootItemId || aTextItems.includes(oItem.ITEM_ID)) {
            if (oItem.QUANTITY_STATE !== Constants.VariantItemQuantityState.MANUAL_VALUE) {
                const oMessageDetails = new MessageDetails().addItemObjs({ id: oItem.ITEM_ID });
                const sClientMsg = 'Quantity state value is not valid for category text or root for';
                const sServerMsg = `${ sClientMsg } ITEM_ID: ${ oItem.ITEM_ID }.`;
                await logError(sServerMsg);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
            }
        } else {
            var bValidValue = aValidValues.includes(oItem.QUANTITY_STATE);
            if (!bValidValue) {
                const oMessageDetails = new MessageDetails().addItemObjs({ id: oItem.ITEM_ID });
                const sClientMsg = 'Quantity state value is not valid for';
                const sServerMsg = `${ sClientMsg } ITEM_ID: ${ oItem.ITEM_ID }.`;
                await logError(sServerMsg);
                throw new PlcException(MessageLibrary.Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
            }
        }
    });
}

async function checkSumVariantIsNotDuplicated(oPersistency, iCalculationVersionId) {
    const bSumVariantAlreadyExists = oPersistency.Variant.checkSumVariantExists(iCalculationVersionId);
    if (bSumVariantAlreadyExists) {
        const oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
        const sClientMsg = 'A sum variant for requested calculation version already exist';
        const sServerMsg = `${ sClientMsg } Id: ${ iCalculationVersionId } `;
        await logInfo(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
    }
}
;
export default {MessageLibrary,PlcException,MessageDetails,MessageCode,helpers,_,Constants,logError,logInfo,checkCalculationVersionExists,checkVariantExists,checkConcurrentVariantMatrixLock,isVariantNameUnique,checkVersionIsNotLifecycleVersion,checkVersionIsNotFrozen,checkQuantityStateValues,checkSumVariantIsNotDuplicated};
