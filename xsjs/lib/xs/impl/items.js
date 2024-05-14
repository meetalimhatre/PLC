const helpers = require('../util/helpers');
const _ = require('lodash');
const Constants = require('../util/constants');
const MessageLibrary = require('../util/message');
const PriceSourceType = Constants.PriceSourceType;
const ServiceParameters = Constants.ServiceParameters;
const BusinessObjectsEntities = require('../util/masterdataResources').BusinessObjectsEntities;
const MapStandardFieldsWithFormulas = Constants.mapStandardFieldsWithFormulas;

const ItemService = require('../service/itemService');
const getCachedOldItemsInUpdateValidation = require('../validator/itemValidator').getCachedOldItemsInUpdateValidation;

const Provider = require('../metadata/metadataProvider').MetadataProvider;
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const ItemCategory = Constants.ItemCategory;
const Uom = Constants.Uom;

const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;


module.exports.Items = function ($) {
    const that = this;
    var sUserId;
    const sSessionId = sUserId = $.getPlcUsername();

    var metadataProvider = new Provider();

    const aMasterdataRelatedFields = [
        'ACCOUNT_ID',
        'DOCUMENT_ID',
        'DOCUMENT_TYPE_ID',
        'DOCUMENT_STATUS_ID',
        'DESIGN_OFFICE_ID',
        'MATERIAL_ID',
        'MATERIAL_TYPE_ID',
        'MATERIAL_GROUP_ID',
        'OVERHEAD_GROUP_ID',
        'VALUATION_CLASS_ID',
        'ACTIVITY_TYPE_ID',
        'PROCESS_ID',
        'COMPANY_CODE_ID',
        'COST_CENTER_ID',
        'PLANT_ID',
        'WORK_CENTER_ID',
        'BUSINESS_AREA_ID',
        'PROFIT_CENTER_ID',
        'VENDOR_ID',
        'IS_DISABLING_ACCOUNT_DETERMINATION'
    ];

    const aPropertiesTriggerValueDetermination = [
        'ITEM_CATEGORY_ID',
        'PRICE_SOURCE_ID',
        'PRICE_SOURCE_TYPE_ID',
        'PRICE_FIXED_PORTION',
        'PRICE_VARIABLE_PORTION',
        'TRANSACTION_CURRENCY_ID',
        'PRICE_UNIT',
        'PRICE_UNIT_UOM_ID',
        'IS_DISABLING_PRICE_DETERMINATION'
    ].concat(aMasterdataRelatedFields);
    var iParentId = 0;

    /**
 * Setting reference version values for all updated reference calculation version items.
 * @param {array}
 *      aItemToUpdateReferencedVersion: An array containing all reference version items to be updated
 * @param {object}
 *      mItemsForPayload: A map that will get all item_ids as keys that have been updated successfully to be returned
 * @param {object}
 *      oPersistency - Instance of Persistency to access data base.
 * @return {object}
 *      mItemsForPayload: A map containing all item_ids as keys that have been updated successfully
 */
    async function updateReferencedCalculationVersions(aItemToUpdateReferencedVersion, mItemsForPayload, oPersistency) {

        //return if no items are to be updated
        if (helpers.isNullOrUndefined(aItemToUpdateReferencedVersion) || aItemToUpdateReferencedVersion.length === 0) {
            return mItemsForPayload;
        }

        // Referenced calculation version setting
        oPersistency.Item.updateReferencedCalculationVersionID(aItemToUpdateReferencedVersion, sSessionId);
        _.each(aItemToUpdateReferencedVersion, function (iItemToUpdateReferencedVersion) {
            mItemsForPayload[iItemToUpdateReferencedVersion.ITEM_ID] = iItemToUpdateReferencedVersion.ITEM_ID;
        });
        return mItemsForPayload;
    }

    /**
 *
 * Business logic to update item entities (rows) in t_item_temporary. Method accepts an array of JS objects, whereas each object only
 * contains the changes on an item entity (property key = column id; property value = column value for row). The properties
 * <code>ITEM_ID</code> and <code>CALCULATUON_VERSION_ID</code> are used to identify the item entity and must be contained in each
 * object within the array.
 *
 * @param {array}
 *            aBodyItems - An array containing JS objects for every item entity that shall be updated. Those objects need to contain only
 *            properties with changed values, except <code>ITEM_ID</code> and <code>CALCULATION_VERSION_ID</code> which are used to
 *            identify the entity.
 *
 * @param {array}
 *            aParameters - List of request parameters.
 * @param {object}
 *            oServiceOutput - Object encapsulating any payload of the response (also status).
 * @param {object}
 *            oPersistency - Instance of Persistency to access data base.
 */
    this.update = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        var iCvId = aBodyItems[0].CALCULATION_VERSION_ID;
        const bOmitItems = aParameters.omitItems || false;
        var aCachedOldItems = getCachedOldItemsInUpdateValidation(aBodyItems, sSessionId);
        // since this is an update request, the entities that shall be updated must exist; check that all items are in the database and that they reference the same version; 
        //use only mDbItems to access items for the sake of performance, it contains additional properties, which are not included in the request object
        var mDbItems = await checkItemsForUpdate(aBodyItems, iCvId, oPersistency, aCachedOldItems);

        that.setDefaultValueForIsManualField(aBodyItems, oPersistency, mDbItems);

        // map item_id -> item_id to store ids of items that must be included in the response
        // use JS object as hash set, store item_id as value as well to have access to the integer value; keys would be escaped as strings
        var mItemsForPayload = {};

        //decide the processing steps, skip the unnecessary steps
        var oProcessingSteps = await determineProcessingSteps(aBodyItems, mDbItems);
        var aItemsToChangeActiveState = oProcessingSteps.changeActiveState;
        var aItemsWithSameActiveState = oProcessingSteps.sameActiveState;
        var aItemsToUpdate = oProcessingSteps.updateItems;
        var aItemsUpdateMasterdata = oProcessingSteps.updateMasterdata;

        // enable delta update for calculation engine, return results only for changed items
        oPersistency.Item.insertChangedItemIdForAFL(aBodyItems);

        // Special case: if nothing has changed and nothings needs to be done, just return
        if (aItemsToChangeActiveState.length === 0 && aItemsWithSameActiveState.length === 0 && aItemsToUpdate.length === 0 && aItemsUpdateMasterdata.length === 0)
            return;

        // trigger activate/deactivate procedure for items with changed active state
        if (aItemsToChangeActiveState.length > 0) {
            var aItemsActiveStateChanged = oPersistency.Item.setActiveStates(aItemsToChangeActiveState, iCvId, sSessionId);

            _.each(aItemsActiveStateChanged, function (oItemChangedActiveState) {
                mItemsForPayload[oItemChangedActiveState.ITEM_ID] = oItemChangedActiveState.ITEM_ID;
            });
        }
        if (aItemsWithSameActiveState.length > 0) {
            _.each(aItemsWithSameActiveState, function (iItemId) {
                mItemsForPayload[iItemId] = iItemId;
            });
        }

        await setDefaultValueForManualAndUnitFields(aItemsToUpdate, mDbItems, iCvId, oPersistency);

        await setQuantityUomIdByMaterialBaseUomId(aItemsToUpdate, oPersistency);


        await triggerUpdate(aItemsToUpdate, mDbItems, iCvId, sSessionId, mItemsForPayload, oServiceOutput, oPersistency);


        await updateReferencedCalculationVersions(oProcessingSteps.updateReferncedVersion, mItemsForPayload, oPersistency);

        var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);




        var aUpdatedItemsDb = bOmitItems ? [] : oPersistency.Item.getItems(_.values(mItemsForPayload), iCvId, sSessionId, aParameters.compressedResult);
        oServiceOutput.setTransactionalData(aUpdatedItemsDb);

        await addReferencesDataToResponse(mSessionDetails, oServiceOutput, oPersistency);


        if (aItemsUpdateMasterdata.length > 0) {
            await addMasterdataToResponse(aItemsUpdateMasterdata, iCvId, mSessionDetails, sSessionId, oServiceOutput, oPersistency);
        }

        var iCvIsDirty = aUpdatedItemsDb.length > 0 ? 1 : 0;
        oPersistency.CalculationVersion.setDirty(iCvId, sSessionId, sUserId, iCvIsDirty);
    };





    async function checkItemsForUpdate(aBodyItems, iCvId, oPersistency, aCachedOldItems) {
        var aOldItems = aCachedOldItems;
        if (helpers.isNullOrUndefined(aOldItems)) {


            aOldItems = oPersistency.Item.getItems(_.map(aBodyItems, function (item) {
                return item.ITEM_ID;
            }), iCvId, sSessionId);
        }

        var mDbItems = {};
        _.each(aOldItems, function (oItem) {
            mDbItems[oItem.ITEM_ID] = oItem;
        });

        var aMissingItemsInDb = [];
        var aItemsInOtherVersion = [];
        _.each(aBodyItems, function (oBodyItem) {
            if (!_.has(mDbItems, oBodyItem.ITEM_ID)) {
                aMissingItemsInDb.push(oBodyItem);
            }
            if (oBodyItem.CALCULATION_VERSION_ID !== iCvId) {
                aItemsInOtherVersion.push(oBodyItem);
            }
        });
        if (aMissingItemsInDb.length > 0) {
            const sClientMsg = 'Error while updating items: cannot find items.';
            const sServerMsg = `${ sClientMsg } items ${ _.map(aMissingItemsInDb, 'ITEM_ID').join(', ') } for version ${ iCvId } (session id ${ sSessionId }).`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }
        if (aItemsInOtherVersion.length > 0) {
            const sClientMsg = 'Error while updating items: items reference a different version.';
            const sServerMsg = `${ sClientMsg } Items ${ _.map(aMissingItemsInDb, 'ITEM_ID').join(', ') } reference a different version than ${ iCvId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
        return mDbItems;
    }





    function DecimalsNotEqual(dRequest, dDatabase) {
        return !(Number.parseFloat(dRequest).toFixed(7) === Number.parseFloat(dDatabase).toFixed(7));
    }





    function determineProcessingSteps(aBodyItems, mDbItems) {
        var aItemsToChangeActiveState = [];
        var aItemsWithSameActiveState = [];
        var aItemsToUpdate = [];
        var aItemsUpdateMasterdata = [];
        var aItemToUpdateReferencedVersion = [];
        const aDecimalList = [
            'LOCAL_CONTENT',
            'LOT_SIZE',
            'LOT_SIZE_CALCULATED',
            'EFFICIENCY',
            'QUANTITY',
            'QUANTITY_CALCULATED',
            'TOTAL_QUANTITY',
            'BASE_QUANTITY',
            'BASE_QUANTITY_CALCULATED',
            'QUANTITY_PER_BASE_UNIT',
            'PRICE_FIXED_PORTION',
            'PRICE_FIXED_PORTION_CALCULATED',
            'PRICE_VARIABLE_PORTION',
            'PRICE_VARIABLE_PORTION_CALCULATED',
            'PRICE',
            'PRICE_UNIT',
            'PRICE_UNIT_CALCULATED',
            'SURCHARGE',
            'TARGET_COST',
            'TARGET_COST_CALCULATED',
            'PRICE_FOR_TOTAL_QUANTITY',
            'PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION',
            'PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION',
            'OTHER_COST',
            'OTHER_COST_FIXED_PORTION',
            'OTHER_COST_VARIABLE_PORTION',
            'TOTAL_COST',
            'TOTAL_COST_FIXED_PORTION',
            'TOTAL_COST_VARIABLE_PORTION',
            'TOTAL_COST_PER_UNIT',
            'TOTAL_COST_PER_UNIT_FIXED_PORTION',
            'TOTAL_COST_PER_UNIT_VARIABLE_PORTION'
        ];

        this.checkIfIsActiveChanged = function (oBodyItem) {
            if (_.has(oBodyItem, 'IS_ACTIVE')) {
                if (oBodyItem.IS_ACTIVE === mDbItems[oBodyItem.ITEM_ID].IS_ACTIVE) {
                    aItemsWithSameActiveState.push(oBodyItem.ITEM_ID);
                } else {
                    const oActivateProcedureInput = _.pick(_.extend({}, mDbItems[oBodyItem.ITEM_ID], oBodyItem), [
                        'SESSION_ID',
                        'ITEM_ID',
                        'CALCULATION_VERSION_ID',
                        'IS_ACTIVE',
                        'PARENT_ITEM_ID'
                    ]);

                    aItemsToChangeActiveState.push(oActivateProcedureInput);
                }
            }
        };

        this.checkIfDisablingAccountDeterminationIsNeeded = function (oBodyItem) {
            if (_.has(oBodyItem, 'ACCOUNT_ID') && !_.has(oBodyItem, 'IS_DISABLING_ACCOUNT_DETERMINATION')) {
                oBodyItem.IS_DISABLING_ACCOUNT_DETERMINATION = 1;
            }
        };

        this.checkIfSomethingElseChanged = async function (oBodyItem) {
            const aItemKeys = _.keys(_.omit(oBodyItem, [
                'ITEM_ID',
                'CALCULATION_VERSION_ID',
                'IS_ACTIVE'
            ]));
            let bSomethingElseChanged = false;
            for (var i = 0; i < aItemKeys.length - 1; i++) {
                const bKeyExistsInDecimalList = aDecimalList.includes(aItemKeys[i]);
                if (bKeyExistsInDecimalList && await DecimalsNotEqual(oBodyItem[aItemKeys[i]], mDbItems[oBodyItem.ITEM_ID][aItemKeys[i]])) {
                    bSomethingElseChanged = true;
                    break;
                } else if (bKeyExistsInDecimalList) {
                    continue;
                }
                if (oBodyItem[aItemKeys[i]] !== mDbItems[oBodyItem.ITEM_ID][aItemKeys[i]]) {
                    bSomethingElseChanged = true;
                    break;
                }
            }
            return bSomethingElseChanged;
        };

        _.each(aBodyItems, async function (oBodyItem) {

            this.checkIfIsActiveChanged(oBodyItem);
            this.checkIfDisablingAccountDeterminationIsNeeded(oBodyItem);

            if (_.has(oBodyItem, 'REFERENCED_CALCULATION_VERSION_ID')) {
                if (this.checkIfSomethingElseChanged(oBodyItem)) {

                    aItemToUpdateReferencedVersion.push(oBodyItem);


                    aItemsUpdateMasterdata.push(oBodyItem);
                }
            } else {
                var bSomethingElseChanged = _.keys(_.omit(oBodyItem, [
                    'ITEM_ID',
                    'CALCULATION_VERSION_ID',
                    'IS_ACTIVE'
                ])).length > 0;
                if (bSomethingElseChanged === true) {


                    aItemsToUpdate.push(oBodyItem);



                    var bMasterdataUpdated = await isMasterdataChangeContained(oBodyItem);
                    if (bMasterdataUpdated === true) {
                        aItemsUpdateMasterdata.push(oBodyItem);
                    }
                }
            }
        });
        return {
            changeActiveState: aItemsToChangeActiveState,
            sameActiveState: aItemsWithSameActiveState,
            updateItems: aItemsToUpdate,
            updateMasterdata: aItemsUpdateMasterdata,
            updateReferncedVersion: aItemToUpdateReferencedVersion
        };
    }











    function isMasterdataChangeContained(oBodyItem) {
        const aMasterdataKeys = _.intersection(_.keys(oBodyItem), aMasterdataRelatedFields);
        const bMasterdataChanged = _.some(aMasterdataKeys, sKey => oBodyItem[sKey] !== null);
        return bMasterdataChanged;
    }

    async function triggerUpdate(aItemsToUpdate, mDbItems, iCvId, sSessionId, mItemsForPayload, oServiceOutput, oPersistency) {
        if (aItemsToUpdate.length > 0) {
            var mAutomaticallyDeterminedValues = {};


            var aInputValueDetermination = await getItemsRequireValueDetermination(aItemsToUpdate, mDbItems);
            if (aInputValueDetermination.length > 0) {
                var oAutomaticallyDeterminedValuesResult = oPersistency.Item.automaticValueDetermination(aInputValueDetermination, iCvId, sSessionId);

                _.each(oAutomaticallyDeterminedValuesResult.VALUES, function (oDeterminedValuesItem) {
                    mAutomaticallyDeterminedValues[oDeterminedValuesItem.ITEM_ID] = oDeterminedValuesItem;
                });
                await ItemService.processValueDeterminationMessages(oAutomaticallyDeterminedValuesResult.MESSAGES, oServiceOutput);
            }


            await updateItems(aItemsToUpdate, mItemsForPayload, mDbItems, mAutomaticallyDeterminedValues, oPersistency);
        }
    }






    async function updateItems(aItems, mItemsForPayload, mDbItems, mAutomaticallyDeterminedValues, oPersistency) {
        let mValidColumnsPerCategory;
        const bMassUpdate = aItems.length > 1;
        let oParentItemIds = new Set();
        const aTextItemsInputDecimalList = [
            'LOT_SIZE',
            'BASE_QUANTITY',
            'PRICE_FIXED_PORTION',
            'PRICE_VARIABLE_PORTION',
            'TARGET_COST'
        ];
        const aCalculatedValues = [
            'OTHER_COST',
            'OTHER_COST_FIXED_PORTION',
            'OTHER_COST_VARIABLE_PORTION',
            'PRICE',
            'PRICE_FOR_TOTAL_QUANTITY',
            'PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION',
            'PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION',
            'TOTAL_COST',
            'TOTAL_COST_FIXED_PORTION',
            'TOTAL_COST_PER_UNIT',
            'TOTAL_COST_PER_UNIT_FIXED_PORTION',
            'TOTAL_COST_PER_UNIT_VARIABLE_PORTION',
            'TOTAL_COST_VARIABLE_PORTION'
        ];

        if (bMassUpdate) {


            const iCvId = aItems[0].CALCULATION_VERSION_ID;
            oParentItemIds = new Set(await oPersistency.Item.getParentItemIds(iCvId, sSessionId));
            aItems.forEach(oItem => {
                if (oItem.PARENT_ITEM_ID !== undefined && oItem.PARENT_ITEM_ID !== null) {
                    oParentItemIds.add(oItem.PARENT_ITEM_ID);
                }
            });
        } else if (oPersistency.Item.hasItemChildren(aItems[0], sSessionId)) {
            oParentItemIds.add(aItems[0].ITEM_ID);
        }
        const oChangedPropertiesSet = new Set();

        aItems.forEach((oItem, index) => {
            let iNewCategoryId;
            let iOldCategoryId;



            let oInvalidPropertiesForNewCategory = {};
            if (_.has(oItem, 'ITEM_CATEGORY_ID')) {

                if (mValidColumnsPerCategory === undefined) {
                    mValidColumnsPerCategory = metadataProvider.getColumnsForCategories(BusinessObjectTypes.Item, BusinessObjectTypes.Item, oPersistency);
                }
                iNewCategoryId = oItem.ITEM_CATEGORY_ID;
                iOldCategoryId = mDbItems[oItem.ITEM_ID].ITEM_CATEGORY_ID;
                oInvalidPropertiesForNewCategory = await getInvalidPropertiesForNewCategory(iNewCategoryId, iOldCategoryId, mValidColumnsPerCategory);
            }

            const oAutomaticallyDeterminedItemValues = mAutomaticallyDeterminedValues[oItem.ITEM_ID] || {};
            _.extend(oItem, oAutomaticallyDeterminedItemValues, oInvalidPropertiesForNewCategory);


            if (!helpers.isNullOrUndefined(iNewCategoryId) && iNewCategoryId !== iOldCategoryId && iNewCategoryId === ItemCategory.TextItem) {
                aTextItemsInputDecimalList.forEach(column => {
                    oItem[column] = null;
                    oItem[column + '_IS_MANUAL'] = 0;

                });
                aCalculatedValues.forEach(column => {
                    oItem[column] = null;
                });
            }


            oItem.IS_DIRTY = 1;
            oItem.IS_DELETED = 0;

            const bHasItemChildren = oParentItemIds.has(oItem.ITEM_ID);
            if (!helpers.isNullOrUndefined(oItem.TOTAL_QUANTITY_UOM_ID) && bHasItemChildren === true) {
                oItem.PRICE_UNIT_UOM_ID = oItem.TOTAL_QUANTITY_UOM_ID;
            }


            if (!helpers.isNullOrUndefined(oItem.QUANTITY_UOM_ID) && bHasItemChildren === true) {
                oItem.TOTAL_QUANTITY_UOM_ID = oItem.QUANTITY_UOM_ID;
                oItem.PRICE_UNIT_UOM_ID = oItem.QUANTITY_UOM_ID;
            }
            if (bMassUpdate) {



                Object.keys(oItem).forEach(property => oChangedPropertiesSet.add(property));
            } else {
                await ItemService.doUpdate(oItem, oPersistency, sSessionId, null, iOldCategoryId, iNewCategoryId);
            }
            mItemsForPayload[oItem.ITEM_ID] = oItem.ITEM_ID;
        });

        if (bMassUpdate) {



            const aChangedProperties = [...oChangedPropertiesSet];
            aItems.forEach(oItem => {
                const oDbItem = mDbItems[oItem.ITEM_ID];

                const aMissingProperties = aChangedProperties.filter(property => !oItem.hasOwnProperty(property));

                aMissingProperties.forEach(property => oItem[property] = oDbItem[property]);
            });

            oPersistency.Item.massUpdate(aItems, sSessionId);
        }
    }


















    function getItemsRequireValueDetermination(aItemsToUpdate, mDbItems) {
        var aItemsRequireValueDetermination = [];
        _.each(aItemsToUpdate, function (oBodyItem) {
            var bItemRequireValueDetermination = _.some(oBodyItem, function (value, key) {
                return _.includes(aPropertiesTriggerValueDetermination, key);
            });
            if (bItemRequireValueDetermination === true) {



                var oInputForValueDetermination = _.extend({}, mDbItems[oBodyItem.ITEM_ID], oBodyItem);
                aItemsRequireValueDetermination.push(oInputForValueDetermination);
            }
        });
        return aItemsRequireValueDetermination;
    }













    function getInvalidPropertiesForNewCategory(iNewCategoryId, iOldCategoryId, mValidPropertiesPerCategory) {
        var aColumnsNewCategory = mValidPropertiesPerCategory[iNewCategoryId];
        var aColumnsOldCategory = mValidPropertiesPerCategory[iOldCategoryId];

        var aInvalidColumns = _.difference(aColumnsOldCategory, aColumnsNewCategory);
        var aNullValues = _.map(aInvalidColumns, _.constant(null));
        return _.zipObject(aInvalidColumns, aNullValues);
    }










    this.create = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        var iCvId = aBodyItems[0].CALCULATION_VERSION_ID;




        var mPayloadItems = {
            Items: [],
            CompressedItems: {}
        };
        var aItemsToCreate = aBodyItems;

        var bImport = false;


        if (aParameters.mode === ServiceParameters.mode.values.replace) {
            aItemsToCreate = await importItems(aBodyItems, iCvId, mPayloadItems, oServiceOutput, oPersistency);
            bImport = true;
        }

        that.setDefaultValueForIsManualField(aItemsToCreate, oPersistency);

        var iImport = bImport === true ? 1 : 0;


        var aCreatedItems = await createItems(aParameters, aItemsToCreate, iCvId, iImport, mPayloadItems, oServiceOutput, oPersistency);

        var aItems = await itemValues(mPayloadItems.Items);
        var oPayloadItems = mPayloadItems.CompressedItems;

        var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
        let bAddResponseBody = await helpers.isNullOrUndefined(aParameters.noResponseBody) || aParameters.noResponseBody === false;




        const aItemsWithMasterdataChanges = _.filter(aBodyItems, oBodyItem => await isMasterdataChangeContained(oBodyItem));
        if (aItemsWithMasterdataChanges.length > 0 && bAddResponseBody) {
            await addMasterdataToResponse(aItems, iCvId, mSessionDetails, sSessionId, oServiceOutput, oPersistency);
        }

        var iIsDirty = aCreatedItems.length > 0 ? 1 : 0;

        oPersistency.CalculationVersion.setDirty(iCvId, sSessionId, sUserId, iIsDirty);



        oServiceOutput.setStatus(aCreatedItems.length > 0 ? $.net.http.CREATED : $.net.http.OK);
        if (bAddResponseBody) {
            oServiceOutput.setTransactionalData(aParameters.compressedResult && aCreatedItems.length > 0 ? oPayloadItems : aItems);
        }

        await addReferencesDataToResponse(mSessionDetails, oServiceOutput, oPersistency);

    };





    function itemValues(obj) {
        var keys = Object.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    }







    async function importItems(aBodyItems, iCvId, mPayloadItems, oServiceOutput, oPersistency) {


        var aParentItems = _.filter(aBodyItems, function (oBodyItem) {
            return oBodyItem.ITEM_ID >= 0;
        });
        if (aParentItems.length !== 1) {
            const sLogMessage = `Error during replacing child items: expected exactly 1 parent item with ITEM_ID > 0 in request but found ${ aParentItems.length }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }


        var oRequestParent = aParentItems[0];
        _.extend(oRequestParent, {
            'IS_DIRTY': 1,
            'IS_DELETED': 0,
            'CREATED_ON': new Date(),
            'CREATED_BY': sUserId,
            'LAST_MODIFIED_ON': new Date(),
            'LAST_MODIFIED_BY': sUserId
        });
        var mDbItem = await checkItemsForUpdate([oRequestParent], iCvId, oPersistency);

        var aInputValueDetermination = await getItemsRequireValueDetermination([oRequestParent], mDbItem);
        var aAutomaticallyDeterminedValuesResult = oPersistency.Item.automaticValueDetermination(aInputValueDetermination, iCvId, sSessionId);
        if (aAutomaticallyDeterminedValuesResult.VALUES.length === 1) {
            aAutomaticallyDeterminedValuesResult.VALUES[0].ITEM_DESCRIPTION = oRequestParent.ITEM_DESCRIPTION;
            _.extend(oRequestParent, aAutomaticallyDeterminedValuesResult.VALUES[0]);
            await ItemService.processValueDeterminationMessages(aAutomaticallyDeterminedValuesResult.MESSAGES, oServiceOutput);
        }






        var oParentUpdateObject = _.omit(oRequestParent, ['ITEM_CATEGORY_ID']);
        var iModificationCount = await oPersistency.Item.update(oParentUpdateObject, sSessionId);
        if (iModificationCount !== 1) {
            const sClientMsg = 'Error during replacing child items: unable to find parent item in db.';
            const sServerMsg = `${ sClientMsg } Parent item id ${ oRequestParent.ITEM_ID } (calculation version: ${ iCvId }, session: ${ sSessionId }, modification count: ${ iModificationCount }).`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);

        }


        oPersistency.Item.markItemForDeletion(sSessionId, oRequestParent, false);

        mPayloadItems[oRequestParent.ITEM_ID] = oPersistency.Item.getItem(oRequestParent.ITEM_ID, iCvId, sSessionId);
        var aItemsToCreate = _.reject(aBodyItems, function (oBodyItem) {
            return oBodyItem.ITEM_ID === oRequestParent.ITEM_ID;
        });
        iParentId = oRequestParent.ITEM_ID;
        return aItemsToCreate;
    }






    async function createItems(aParameters, aItemsToCreate, iCvId, iImport, mPayloadItems, oServiceOutput, oPersistency) {
        const bOmitItems = aParameters.omitItems || false;
        let iSetDefaultValues = null, iUpdateMasterDataAndPrices = null;
        switch (aParameters.mode) {
        case ServiceParameters.mode.values.updateMasterDataAndPrices:
            iSetDefaultValues = 0;
            iUpdateMasterDataAndPrices = 1;
            break;
        case ServiceParameters.mode.values.noUpdateMasterDataAndPrices:
            iSetDefaultValues = 0;
            iUpdateMasterDataAndPrices = 0;
            break;
        case ServiceParameters.mode.values.replace:
            iSetDefaultValues = 1;
            iUpdateMasterDataAndPrices = 1;
            break;
        case ServiceParameters.mode.values.normal:
            iSetDefaultValues = 1;
            iUpdateMasterDataAndPrices = 1;
            break;
        default: {
                const sLogMessage = `Create Item: Mode parameter value is not valid: ${ aParameters.mode }`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }




        if (aItemsToCreate.length > 0) {
            var oDefaultSettings = oPersistency.CalculationVersion.getProjectPropertiesForCalculationVersion(aItemsToCreate[0].CALCULATION_VERSION_ID);
            if (!helpers.isNullOrUndefined(oDefaultSettings.REPORT_CURRENCY_ID)) {
                _.each(aItemsToCreate, async function (oItem) {
                    await helpers.setNonEmptyProperties(oItem, oDefaultSettings, ['TARGET_COST_CURRENCY_ID']);
                });
            }
        }









        var bCompressedResult = aParameters.compressedResult || false;
        var oProcedureResult = await oPersistency.Item.create(aItemsToCreate, sSessionId, iCvId, iImport, iSetDefaultValues, iUpdateMasterDataAndPrices, bCompressedResult);
        let aCreatedItems = [];
        let aUpdatedItems = [];
        let aMessages = [];

        if (!bOmitItems && aItemsToCreate.length > 0) {
            aCreatedItems = Array.from(oProcedureResult.OT_NEW_ITEMS);
            aUpdatedItems = Array.from(oProcedureResult.OT_UPDATED_ITEMS);
            aMessages = Array.from(oProcedureResult.OT_MESSAGES);
        }

        await ItemService.processValueDeterminationMessages(aMessages, oServiceOutput);

        if (bCompressedResult) {
            let oCreatedItemsCompressed = await helpers.transposeResultArray(oProcedureResult.OT_NEW_ITEMS, true);
            let oResult = oCreatedItemsCompressed;

            _.keys(oCreatedItemsCompressed).forEach(oKey => {
                if (aUpdatedItems.length > 0) {
                    for (let i = 0; i < aUpdatedItems.length; i++) {


                        oResult[oKey] = oCreatedItemsCompressed[oKey].concat(aUpdatedItems[i][oKey]);
                    }
                }
                if (_.has(oProcedureResult.OT_CUSTOM_FIELDS_FROM_REQUEST, oKey)) {
                    oProcedureResult.OT_CUSTOM_FIELDS_FROM_REQUEST[oKey].forEach(oItem => {
                        var index = _.indexOf(oResult.HANDLE_ID, oItem.ITEM_ID);
                        oResult[oKey][index] = oItem.VALUE;
                    });
                } else {
                    if (oResult[oKey].findIndex(el => el !== null) === -1) {
                        delete oResult[oKey];
                    }
                }
            });

            mPayloadItems.CompressedItems = oResult;
        }

        _.union(aCreatedItems, aUpdatedItems).forEach(oItem => {
            mPayloadItems.Items[oItem.ITEM_ID] = oItem;
        });


        if (aParameters.mode === ServiceParameters.mode.values.replace && aUpdatedItems.length === 0) {
            mPayloadItems.Items.push(mPayloadItems[iParentId]);
            var aProperties = Object.keys(mPayloadItems.CompressedItems);
            aProperties.forEach(property => mPayloadItems.CompressedItems[property].push(mPayloadItems[iParentId][property]));
        }

        return aCreatedItems;
    }





    this.remove = function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        var iIsDirty = 0;
        var iCalcVersionId = aBodyItems[0].CALCULATION_VERSION_ID;


        var mItemsForPayload = {};
        var aItemsCheckActiveState = [];
        var aParentItem = [];

        var aPriceSourceIds = oPersistency.Item.getPriceSourceBySourceType(PriceSourceType.Manual);
        var sPriceSourceId = aPriceSourceIds[0].PRICE_SOURCE_ID;
        _.each(aBodyItems, async function (oBodyItem, iIndex) {

            var oDeletedItemInfo = await deleteItem(oBodyItem, sPriceSourceId, mItemsForPayload, oPersistency);
            aParentItem.push(oDeletedItemInfo.parentItem);


            aItemsCheckActiveState.push(oDeletedItemInfo.itemDb);
        });



        var aChangedActiveState = oPersistency.Item.setActiveStates(aItemsCheckActiveState, iCalcVersionId, sSessionId);
        _.each(aChangedActiveState, function (oItemChangedActiveState) {
            mItemsForPayload[oItemChangedActiveState.ITEM_ID] = oItemChangedActiveState.ITEM_ID;
        });



        var aItemIdsForPayload = _.values(mItemsForPayload);
        if (aItemIdsForPayload.length > 0) {
            oServiceOutput.setTransactionalData(oPersistency.Item.getItems(_.values(mItemsForPayload), iCalcVersionId, sSessionId));
        }


        iIsDirty = 1;
        oPersistency.CalculationVersion.setDirty(iCalcVersionId, sSessionId, sUserId, iIsDirty);


        oPersistency.Item.insertChangedItemIdForAFL(aParentItem);

        oServiceOutput.setStatus($.net.http.OK);
    };





    async function deleteItem(oBodyItem, sPriceSourceId, mItemsForPayload, oPersistency) {
        var oItemDb = oPersistency.Item.getItem(oBodyItem.ITEM_ID, oBodyItem.CALCULATION_VERSION_ID, sSessionId);
        var oResult = oPersistency.Item.markItemForDeletion(sSessionId, oBodyItem, true);
        if (oResult.DELETED_ITEM_COUNT === 0) {
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addItemObjs({ id: oBodyItem.ITEM_ID });

            const sClientMsg = 'Could not find item to delete.';
            const sServerMsg = `${ sClientMsg } Item id ${ oBodyItem.ITEM_ID }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        }
        var oParentItem = oPersistency.Item.getItem(oItemDb.PARENT_ITEM_ID, oBodyItem.CALCULATION_VERSION_ID, sSessionId);
        var bParentItemSubitemState = oPersistency.Item.hasItemChildren(oParentItem, sSessionId);


        if (bParentItemSubitemState === false) {





            var oCustomFieldsWithRollupToReset = metadataProvider.getRollupCustomFieldsAsObjectToReset(BusinessObjectTypes.Item, BusinessObjectTypes.Item, oParentItem.ITEM_CATEGORY_ID, oPersistency);

            oParentItem = _.extend({}, oParentItem, {
                PRICE: 0,
                PRICE_FIXED_PORTION: 0,
                PRICE_VARIABLE_PORTION: 0,
                PRICE_FOR_TOTAL_QUANTITY: 0,
                PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION: null,
                PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION: null,
                PRICE_SOURCE_ID: sPriceSourceId,
                PRICE_SOURCE_TYPE_ID: PriceSourceType.Manual,
                PRICE_UNIT: 1,
                CONFIDENCE_LEVEL_ID: 1
            }, oCustomFieldsWithRollupToReset);


            await ItemService.doUpdate(oParentItem, oPersistency, sSessionId);
            mItemsForPayload[oParentItem.ITEM_ID] = oParentItem.ITEM_ID;
        }

        return {
            parentItem: oParentItem,
            itemDb: oItemDb
        };
    }




    function addMasterdataToResponse(aItems, iCvId, mSessionDetails, sSessionId, oServiceOutput, oPersistency) {
        const aItemIds = _.map(aItems, function (oItem) {
            return _.pick(oItem, 'ITEM_ID');
        });
        const mItemMasterdata = oPersistency.Administration.getMasterdataOnItemLevel(iCvId, mSessionDetails.language, sSessionId, aItemIds);

        oServiceOutput.addMasterdata(mItemMasterdata);
    }




    function addReferencesDataToResponse(mSessionDetails, oServiceOutput, oPersistency) {
        var oReferenceVersions = {
            referencesdata: {
                PROJECTS: [],
                CALCULATIONS: [],
                CALCULATION_VERSIONS: [],
                MASTERDATA: {}
            }
        };
        var oReferencedVersios = oPersistency.CalculationVersion.getReferencedVersionDetails(oReferenceVersions, mSessionDetails.language);
        oServiceOutput.setReferencesData(oReferencedVersios.referencesdata);
    }




    this.get = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {

        var oPricesForItem = {};
        oPricesForItem[BusinessObjectsEntities.MATERIAL_PRICE_ENTITIES] = [];
        oPricesForItem[BusinessObjectsEntities.ACTIVITY_PRICE_ENTITIES] = [];

        if (aParameters.getPrices === true) {
            var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
            oPricesForItem = oPersistency.Item.getPricesForItem(sSessionId, aParameters.calculation_version_id, aParameters.id, mSessionDetails.language);
        }
        oServiceOutput.setMasterdata(oPricesForItem.masterdata);
        oServiceOutput.setTransactionalData(oPricesForItem.transactionaldata);

        return oServiceOutput;
    };















    this.setDefaultValueForIsManualField = async function (aItems, oPersistency, mDbItems) {
        if (aItems.length == 0) {

            return;
        }



        const oMetadata = oPersistency.Item.getFormulasAndRollupsForStandardAndCustomFields();

        const oParentItemIds = new Set(await oPersistency.Item.getParentItemIds(aItems[0].CALCULATION_VERSION_ID, sSessionId));
        _.each(aItems, oItem => {
            if (oItem.PARENT_ITEM_ID !== undefined && oItem.PARENT_ITEM_ID !== null) {
                oParentItemIds.add(oItem.PARENT_ITEM_ID);
            }
        });

        mDbItems = mDbItems || {};




        const aIsManualValueRules = [
            {
                hasFormula: false,
                isRolledUp: false,
                isAssembly: false,
                validValues: [1],
                defaultValue: 1
            },
            {
                hasFormula: false,
                isRolledUp: false,
                isAssembly: true,
                validValues: [1],
                defaultValue: 1
            },
            {
                hasFormula: false,
                isRolledUp: true,
                isAssembly: false,
                validValues: [1],
                defaultValue: 1
            },
            {
                hasFormula: false,
                isRolledUp: true,
                isAssembly: true,
                validValues: [0],
                defaultValue: 0
            },
            {
                hasFormula: true,
                isRolledUp: false,
                isAssembly: false,
                validValues: [
                    0,
                    1
                ],
                defaultValue: 0
            },
            {
                hasFormula: true,
                isRolledUp: false,
                isAssembly: true,
                validValues: [
                    0,
                    1
                ],
                defaultValue: 0
            },
            {
                hasFormula: true,
                isRolledUp: true,
                isAssembly: false,
                validValues: [
                    0,
                    1
                ],
                defaultValue: 0
            },
            {
                hasFormula: true,
                isRolledUp: true,
                isAssembly: true,
                validValues: [0],
                defaultValue: 0
            }
        ];

        _.each(aItems, async function (oItem) {
            const iItemCategory = !helpers.isNullOrUndefined(oItem.ITEM_CATEGORY_ID) ? oItem.ITEM_CATEGORY_ID : mDbItems[oItem.ITEM_ID].ITEM_CATEGORY_ID;
            for (let sFieldName in oMetadata[iItemCategory]) {
                const sIsManualFieldName = MapStandardFieldsWithFormulas.has(sFieldName) ? MapStandardFieldsWithFormulas.get(sFieldName) : sFieldName + '_IS_MANUAL';
                const oFieldData = oMetadata[iItemCategory][sFieldName];
                const bItemIsAssembly = oParentItemIds.has(oItem.ITEM_ID);
                const oIsManualRule = aIsManualValueRules.find(oValueDefinition => {
                    return oValueDefinition.hasFormula === oFieldData.hasFormula && oValueDefinition.isRolledUp === oFieldData.isRolledUp && oValueDefinition.isAssembly === bItemIsAssembly;
                });
                if (!oIsManualRule) {
                    const sLogMessage = `Cannot find a definition for the value of ${ sIsManualFieldName } (hasFormula: ${ oFieldData.hasFormula },  isRolledUp: ${ oFieldData.isRolledUp },  isAssembly: ${ bItemIsAssembly })`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                }

                let iIsManualValue = oItem[sIsManualFieldName];
                if (helpers.isNullOrUndefined(iIsManualValue) && !helpers.isNullOrUndefined(mDbItems[oItem.ITEM_ID]) && mDbItems[oItem.ITEM_ID].ITEM_CATEGORY_ID === iItemCategory) {
                    iIsManualValue = mDbItems[oItem.ITEM_ID][sIsManualFieldName];
                    if (oItem[sIsManualFieldName] === null) {

                        oItem[sIsManualFieldName] = iIsManualValue;
                    }
                }

                const bItemHasValidValue = oIsManualRule.validValues.indexOf(iIsManualValue) > -1;
                if (!bItemHasValidValue) {

                    oItem[sIsManualFieldName] = oIsManualRule.defaultValue;

                    if (oItem.hasOwnProperty(sIsManualFieldName)) {



                        await $.trace.warning(`Invalid value ${ oItem[sIsManualFieldName] } for ${ sIsManualFieldName } in context hasFormula: ${ oFieldData.hasFormula },  isRolledUp: ${ oFieldData.isRolledUp },  isAssembly: ${ bItemIsAssembly }.` + ` Resetting to default value ${ oIsManualRule.defaultValue }.`);
                    }
                }
            }
        });
    };









    async function setQuantityUomIdByMaterialBaseUomId(aItems, oPersistency) {

        let aMaterialIds = [];
        aItems.forEach(oItem => {
            if (oItem.ITEM_CATEGORY_ID === ItemCategory.InternalActivity && await helpers.isNullOrUndefined(oItem.QUANTITY_UOM_ID)) {
                oItem.QUANTITY_UOM_ID = Uom.Hour;
                oItem.PRICE_UNIT_UOM_ID = Uom.Hour;
            } else {
                aMaterialIds.push(oItem.MATERIAL_ID);
            }
        });

        let aMaterialBaseUomIds = oPersistency.Item.getExistingMaterialBaseUomIds(new Date(), aMaterialIds);

        aItems.forEach(oItem => {

            if (!helpers.isNullOrUndefined(oItem.MATERIAL_ID) && !helpers.isNullOrUndefined(aMaterialBaseUomIds) && aMaterialBaseUomIds.length > 0 && await helpers.isNullOrUndefined(oItem.QUANTITY_UOM_ID)) {

                let oMaterialBaseUomId = _.find(aMaterialBaseUomIds, function (oMaterialBaseUomId) {
                    return oMaterialBaseUomId.MATERIAL_ID = oItem.MATERIAL_ID;
                });

                if (!helpers.isNullOrUndefined(oMaterialBaseUomId.BASE_UOM_ID)) {
                    oItem.QUANTITY_UOM_ID = oMaterialBaseUomId.BASE_UOM_ID;
                    oItem.PRICE_UNIT_UOM_ID = oMaterialBaseUomId.BASE_UOM_ID;
                } else {
                    oItem.QUANTITY_UOM_ID = Uom.Piece;
                    oItem.PRICE_UNIT_UOM_ID = Uom.Piece;
                }
            }
        });
    }













    async function setDefaultValueForManualAndUnitFields(aItems, mDbItems, iCvId, oPersistency) {


        let mValidCustomFieldsWithDefaultValuesPerCategory;
        let oGeneralDefaultValues = {};
        aItems.forEach((oItem, index) => {
            let iNewCategoryId;
            let iOldCategoryId;
            let oNewValidCustomFieldsWithDefaultValuesForNewCategory = {};
            if (_.has(oItem, 'ITEM_CATEGORY_ID')) {

                if (mValidCustomFieldsWithDefaultValuesPerCategory === undefined) {
                    oGeneralDefaultValues.ReportingCurrency = oPersistency.CalculationVersion.getWithoutItems([iCvId], sSessionId)[0].REPORT_CURRENCY_ID;
                    mValidCustomFieldsWithDefaultValuesPerCategory = metadataProvider.getCustomFieldsWithDefaultValuesForCategories(BusinessObjectTypes.Item, BusinessObjectTypes.Item, oPersistency, oGeneralDefaultValues);
                }
                iNewCategoryId = oItem.ITEM_CATEGORY_ID;
                iOldCategoryId = mDbItems[oItem.ITEM_ID].ITEM_CATEGORY_ID;
                oNewValidCustomFieldsWithDefaultValuesForNewCategory = await getNewValidCustomFieldsWithDefaultValuesForNewCategory(iNewCategoryId, iOldCategoryId, mValidCustomFieldsWithDefaultValuesPerCategory, _.keys(oItem));
                _.extend(oItem, oNewValidCustomFieldsWithDefaultValuesForNewCategory);
            }
        });
    }















    function getNewValidCustomFieldsWithDefaultValuesForNewCategory(iNewCategoryId, iOldCategoryId, mValidCustomFieldsWithDefaultValuesPerCategory, aOmitColumns) {
        const aColumnsNewCategory = _.keys(mValidCustomFieldsWithDefaultValuesPerCategory[iNewCategoryId]);
        const aColumnsOldCategory = _.keys(mValidCustomFieldsWithDefaultValuesPerCategory[iOldCategoryId]);

        const oDefaultValuesNewCategory = mValidCustomFieldsWithDefaultValuesPerCategory[iNewCategoryId];


        const aNewValidCustomColumns = _.difference(aColumnsNewCategory, aColumnsOldCategory);


        let oCustomFieldsWithDefault = _.pick(oDefaultValuesNewCategory, aNewValidCustomColumns);


        oCustomFieldsWithDefault = _.omit(oCustomFieldsWithDefault, aOmitColumns);

        return oCustomFieldsWithDefault;
    }

};
export default {helpers,_,Constants,MessageLibrary,PriceSourceType,ServiceParameters,BusinessObjectsEntities,MapStandardFieldsWithFormulas,ItemService,getCachedOldItemsInUpdateValidation,Provider,BusinessObjectTypes,ItemCategory,Uom,PlcException,Code,MessageDetails};
