const helpers = require('../util/helpers');
const _ = require('lodash');
const constants = require('../util/constants');
const ServiceParameters = constants.ServiceParameters;

const GenericSyntaxValidator = require('./genericSyntaxValidator').GenericSyntaxValidator;
const BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;

const MessageLibrary = require('../util/message');
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const PlcException = MessageLibrary.PlcException;

var authorizationManager = require('../authorization/authorization-manager');

// To have a cache for old items here is not a beautiful design, but it is necessary for performance. Details are:
// - The previous design does not provide methods to communication between validator and impl
// - Caculation (items-PUT) is most frequently used service, which have redundant DB calls to get items with the identical parameters and results, 
//     one is from validator update, the other is from items update before updating happens
let oCachedOldItemsInUpdateValidation = {};
var getCachedOldItemsInUpdateValidation = async function (aBodyItems, sessionId) {
    let oResult = undefined;
    if (!helpers.isNullOrUndefined(sessionId) && sessionId in oCachedOldItemsInUpdateValidation) {
        let oCachedItems = oCachedOldItemsInUpdateValidation[sessionId];

        if (aBodyItems.length === oCachedItems.aBodyItems.length && aBodyItems[0].CALCULATION_VERSION_ID === oCachedItems.aBodyItems[0].CALCULATION_VERSION_ID) {
            let convert = function (item) {
                return item.ITEM_ID;
            };
            if (_.isEqual(_.map(aBodyItems, convert), _.map(oCachedItems.aBodyItems, convert))) {
                oResult = oCachedItems.aOldItems;
            }
        }
    }

    // it is for sure no other clients are calling this function. Hence just clean the cache.
    clearCachedOldItemsInUpdateValidation(sessionId);
    return oResult;
};

let setCachedOldItemsInUpdateValidation = async function (aBodyItems, sessionId, aOldItems) {
    if (!helpers.isNullOrUndefined(sessionId)) {
        oCachedOldItemsInUpdateValidation[sessionId] = {
            aBodyItems: aBodyItems,
            aOldItems: aOldItems
        };
    }
};

let clearCachedOldItemsInUpdateValidation = async function (sessionId) {
    if (!helpers.isNullOrUndefined(sessionId)) {
        if (sessionId in oCachedOldItemsInUpdateValidation) {
            delete oCachedOldItemsInUpdateValidation[sessionId];
        }
    }
};

/**
 * This class constructs BusinessObjectValidator instances for the Item business object type. It validates the data in the body of a
 * request. For this, the validation distinguishes the different CRUD operations which can be done upon the business object (example: for a
 * GET request no body is allowed, but for POST and PUT has to be an array of items in the body). During the validation an instance of the
 * Persistency class is used to get access to data base tables in order to check the given user input against trustworthy server values.
 * 
 * @constructor
 */
async function ItemValidator($, persistency, sessionId, userName, metadataProvider, utils) {
    clearCachedOldItemsInUpdateValidation(sessionId);

    var aMandatoryPropertiesStatic = [
        'ITEM_ID',
        'CALCULATION_VERSION_ID'
    ];
    var aMandatoryPropertiesStaticCreate = _.union(aMandatoryPropertiesStatic, ['IS_ACTIVE']);
    var aMandatoryPropertiesStaticReferencedVersion = _.union(aMandatoryPropertiesStatic, ['REFERENCED_CALCULATION_VERSION_ID']);
    var genericSyntaxValidator = await new GenericSyntaxValidator();

    /**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on oRequest.method a
	 * different validation procedure is chosen. Metadata provided the MetadataProvider is used to determine if the value of an item
	 * property correspond to a specific data type.
	 * 
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param oPersistency -
	 *            An instance of Persistency to enable access to the data base and retrieve trustworthy data in order to validate reference
	 *            IDs given in the request
	 * @param sSessionId -
	 *            The session id of the request which is necessary for database queries.
	 * @returns
	 * 
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the property values cannot
	 *             be validated against the data types provided in the meta data.
	 */
    this.validate = async function (oRequest, mValidatedParameters) {
        //used to count items in the update item request
        var iCount;
        // self needed, because this context needed from outside of the nested functions
        const self = this;
        switch (oRequest.method) {
        case $.net.http.DEL:
            return await validateDeleteRequests();
        case $.net.http.GET:
            return await validateGetRequest(oRequest);
        case $.net.http.POST:
            return await validateCreateRequest();
        case $.net.http.PUT:
            return await validateUpdateRequest();
        default: {
                const sClientMsg = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sClientMsg);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
            }
        }

        async function validateGetRequest(oRequest) {
            await checkURLParameters();
            return utils.checkEmptyBody(oRequest.body);
        }

        async function checkURLParameters() {
            if (helpers.isNullOrUndefined(mValidatedParameters.getPrices)) {
                const sLogMessage = 'Missing the getItems parameter.';
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);

            } else {
                await genericSyntaxValidator.validateValue(mValidatedParameters.getPrices, 'Boolean', undefined, true);
            }

            if (helpers.isNullOrUndefined(mValidatedParameters.calculation_version_id)) {
                const sLogMessage = 'Missing the calculation version id of the item parameter.';
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            } else {
                await genericSyntaxValidator.validateValue(mValidatedParameters.calculation_version_id, 'PositiveInteger', undefined, true);
            }

            if (helpers.isNullOrUndefined(mValidatedParameters.id)) {
                const sLogMessage = 'Missing the item id parameter.';
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            } else {
                await genericSyntaxValidator.validateValue(mValidatedParameters.id, 'PositiveInteger', undefined, true);
            }


        }
        async function checkCalculationVersion(aBodyItems) {
            var aItemsRefDifferentCv = _.filter(aBodyItems, async function (oBodyItem) {
                if (helpers.isNullOrUndefined(oBodyItem.CALCULATION_VERSION_ID)) {
                    const sClientMsg = `Missing mandatory property "CALCULATION_VERSION_ID" during validation.`;
                    $.trace.error(sClientMsg);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }
                return aBodyItems[0].CALCULATION_VERSION_ID !== oBodyItem.CALCULATION_VERSION_ID;
            });
            if (aItemsRefDifferentCv.length > 0) {
                const sClientMsg = 'Some items in the request body reference another calculation version as the first item in the array.';
                const sServerMsg = `${ sClientMsg } Items: ${ _.map(aItemsRefDifferentCv, function (oItem) {
                    return oItem.ITEM_ID;
                }).toString() }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }
            // check if version is opened in current session
            if (!persistency.CalculationVersion.isOpenedInSessionAndContext(sessionId, aBodyItems[0].CALCULATION_VERSION_ID)) {
                const sClientMsg = 'Calculation Version not opened in current session.';
                const sServerMsg = `${ sClientMsg } Id: ${ aBodyItems[0].CALCULATION_VERSION_ID }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }
        }

        /**
		 * This check is implemented for all items containing the mandatory properties
		 * ("REFERENCED_CALCULATION_VERSION_ID" and "ITEM_CATEGORY_ID")
		 * for setting referenced calculation version (also in case of using batch operation).
		 * 
		 * @param {array}
		 *            aBodyItems - An array containing JS objects for every item entity that shall be updated.
		 */
        async function checkReferencedCalculationVersion(aBodyItems) {
            _.each(aBodyItems, async function (oBodyItem) {
                if (_.has(oBodyItem, 'ITEM_CATEGORY_ID') && await genericSyntaxValidator.validateValue(oBodyItem.ITEM_CATEGORY_ID, 'PositiveInteger', undefined, true) === constants.ItemCategory.ReferencedVersion) {

                    await utils.checkMandatoryProperties(oBodyItem, aMandatoryPropertiesStaticReferencedVersion);
                    var iReferencedVersionId = await genericSyntaxValidator.validateValue(oBodyItem.REFERENCED_CALCULATION_VERSION_ID, 'PositiveInteger', undefined, true);
                    // Check for self-reference
                    if (oBodyItem.CALCULATION_VERSION_ID === iReferencedVersionId) {
                        const sClientMsg = `The selected calculation version cannot be referenced because this would lead to a circular dependency. ` + `Please select another calculation version.`;
                        const sServerMsg = `${ sClientMsg } Selected Calculation Version Id: ${ iReferencedVersionId }.`;
                        $.trace.error(sServerMsg);
                        throw new PlcException(Code.REFERENCED_CALCULATION_VALIDATION_ERROR, sClientMsg);
                    }

                    //check instance-based privilege for referenced version
                    await authorizationManager.checkPrivilege(authorizationManager.BusinessObjectTypes.CalculationVersion, iReferencedVersionId, authorizationManager.Privileges.READ, await persistency.getConnection(), userName);
                }
            });
        }

        /**
		 * This check is implemented for all items with "ITEM_CATEGORY_ID" = 10 (ReferencedVersion).
		 * The controlling area of the referenced version must be the same with the controlling area of the version where the new item is added.
		 * 
		 * @param {array}
		 *            aBodyItems - An array containing JS objects for every item entity that shall be updated.
		 */
        async function checkControllingAreaOfReferencedCalculationVersion(aBodyItems) {
            var aItemsRefCalcVers = _.filter(aBodyItems, function (oBodyItem) {
                return oBodyItem.ITEM_CATEGORY_ID === constants.ItemCategory.ReferencedVersion;
            });
            if (aItemsRefCalcVers.length > 0) {
                // get controlling area of current opened calculation version
                var oDefaultSettings = persistency.CalculationVersion.getProjectPropertiesForCalculationVersion(aBodyItems[0].CALCULATION_VERSION_ID, true);
                if (helpers.isNullOrUndefined(oDefaultSettings)) {
                    const sClientMsg = 'Default settings for calculation version not found in project.';
                    const sServerMsg = `${ sClientMsg } Calculation Version Id: ${ aBodyItems[0].CALCULATION_VERSION_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
                }

                var aCalculationVersionIds = _.map(aItemsRefCalcVers, 'REFERENCED_CALCULATION_VERSION_ID');

                // get distinct controlling area of referenced calculation versions
                var aControllingAreas = persistency.CalculationVersion.getControllingAreasForCalculationVersions(aCalculationVersionIds);

                var aDifferentControllingAreas = _.filter(aControllingAreas, function (sControllingArea) {
                    return sControllingArea !== oDefaultSettings.CONTROLLING_AREA_ID;
                });

                if (aDifferentControllingAreas.length > 0) {
                    const sClientMsg = 'Different controlling areas in referenced and opened calculation versions.';
                    const sServerMsg = `${ sClientMsg } Referenced calculation version: ${ aDifferentControllingAreas[0] }; current opened calculation version: ${ oDefaultSettings.CONTROLLING_AREA_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.DIFFERENT_CONTROLLING_AREA_IN_TARGET_CALCULATION_VERSION, sClientMsg);
                }
            }
        }

        async function validateDeleteRequests() {
            var aBodyItems = utils.tryParseJson(oRequest.body.asString());
            await checkCalculationVersion(aBodyItems);

            var aValidatedItems = [];
            _.each(aBodyItems, async function (oBodyItem, iIndex) {

                await utils.checkMandatoryProperties(oBodyItem, aMandatoryPropertiesStatic);
                utils.checkInvalidProperties(oBodyItem, aMandatoryPropertiesStatic);

                // run syntax check on properties and construct return object
                var oValidatedItem = {};
                oValidatedItem.ITEM_ID = await genericSyntaxValidator.validateValue(oBodyItem.ITEM_ID, 'PositiveInteger', undefined, true);
                oValidatedItem.CALCULATION_VERSION_ID = await genericSyntaxValidator.validateValue(oBodyItem.CALCULATION_VERSION_ID, 'PositiveInteger', undefined, true);

                aValidatedItems.push(oValidatedItem);
            });

            return aValidatedItems;
        }

        async function validateCreateRequest() {
            var aBodyItems = utils.tryParseJson(oRequest.body.asString());

            await checkCalculationVersion(aBodyItems);

            var oItemTree = await createItemsTree(aBodyItems);
            await validateItemStructure(aBodyItems, oItemTree);
            await checkReferencedCalculationVersion(aBodyItems);
            await checkControllingAreaOfReferencedCalculationVersion(aBodyItems);
            return await validateItemsCreate(aBodyItems, oItemTree.itemTree);
        }

        async function validateUpdateRequest() {
            var aBodyItems = utils.tryParseJson(oRequest.body.asString());
            await checkCalculationVersion(aBodyItems);
            await checkReferencedCalculationVersion(aBodyItems);
            return await validateItemsUpdate(aBodyItems);
        }

        /**
         * Counts all items reachable in the tree starting from the top node. 
         */
        async function countItems(mItems, iItemId) {
            iCount++;
            var value = mItems.get(iItemId);

            value.aChildren.forEach(async function (oItem) {
                await countItems(mItems, oItem.iItemId);
            });
        }

        /**
         * Checks if the number of items in the tree is equal to the number of items 
         * in the request body.
         */
        async function checkItemsTree(aBodyItems, oItemTree) {
            //build map Item->Children
            var iTopNodeId = oItemTree.topNodeId;

            //count reachable children from top node
            iCount = 0;
            await countItems(oItemTree.itemTree, iTopNodeId);
            if (iCount !== aBodyItems.length) {
                const sClientMsg = `Item structure to be created is not a valid tree structure.`;
                $.trace.error(`${ sClientMsg } Expected ${ aBodyItems.length } items in tree, found ${ iCount }.`);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }
        }

        async function validateItemStructure(aBodyItems, oItemTree) {
            // Hierarchy Check: Only one tree of items may be created at once Only "replace" mode is supported currently
            if (aBodyItems.length > 1) {
                if (mValidatedParameters[ServiceParameters.mode.name] !== ServiceParameters.mode.values.normal) {
                    // only mode='replace' is supported for creating multiple items
                    // also modes 'updatemasterdataandprices' and 'noupdatemasterdataandprices' have been added
                    if (!(_.has(mValidatedParameters, ServiceParameters.mode.name) && (mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.replace || mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.updateMasterDataAndPrices || mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.noUpdateMasterDataAndPrices))) {
                        const sLogMessage = "Item import with different mode than 'replace', 'updatemasterdataandprices' and 'noupdatemasterdataandprices' is not supported.";
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }

                    // only for mode = 'replace'
                    if (mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.replace) {
                        // ensure, that there is exactly one root item with a positive ID (the ID of the item to be replaced)
                        var aRootItems = _.filter(aBodyItems, function (oItem) {
                            return oItem.ITEM_ID >= 0;
                        });
                        if (aRootItems.length !== 1) {
                            const sLogMessage = 'Item structure to be created has multiple or no root items.';
                            $.trace.error(sLogMessage);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                        }

                        // ensure that root item exists and position is not changed
                        await compareWithItemToReplace(aRootItems[0]);
                    }

                    // make sure that no item is in the list twice (e.g. to have two parents) and that PREDECESSOR_ITEM_IDs are valid if
                    // provided
                    var oItemIDs = {};
                    var oPredecessorIDs = {};
                    _.each(aBodyItems, async function (oItem) {
                        if (oItemIDs.hasOwnProperty(oItem.ITEM_ID)) {
                            const sClientMsg = `Item structure to be created is not a valid tree structure. It contains loops by having two parents on one item. Item Id: ${ oItem.ITEM_ID }.`;
                            $.trace.error(sClientMsg);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                        }

                        if (oPredecessorIDs.hasOwnProperty(oItem.PREDECESSOR_ITEM_ID)) {
                            const sClientMsg = `Item structure to be created is not a valid tree structure. It contains loops by having two items with the same predecessor id. Predecessor Id: ${ oItem.PREDECESSOR_ITEM_ID }.`;
                            $.trace.error(sClientMsg);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                        }

                        oItemIDs[oItem.ITEM_ID] = 1;
                        if (!helpers.isNullOrUndefined(oItem.PREDECESSOR_ITEM_ID)) {
                            oPredecessorIDs[oItem.PREDECESSOR_ITEM_ID] = 1;
                        }
                    });

                    await checkItemsTree(aBodyItems, oItemTree);
                } else {
                    let aItemParents = [];
                    let iPositiveParent = 0;
                    let oItemIds = {};
                    aBodyItems.forEach(oItem => {
                        if (!oItem.hasOwnProperty('PARENT_ITEM_ID')) {
                            const sLogMessage = "Item structure to be created is not valid since 'normal' mode does not allow to send items with no PARENT_ITEM_ID set.";
                            $.trace.error(sLogMessage);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                        } else {
                            aItemParents.push(oItem.PARENT_ITEM_ID);
                            if (oItem.PARENT_ITEM_ID > 0) {
                                if (iPositiveParent === 0) {
                                    iPositiveParent = oItem.PARENT_ITEM_ID;
                                }
                                if (iPositiveParent !== oItem.PARENT_ITEM_ID) {
                                    const sLogMessage = "Item structure to be created is not valid since 'normal' mode does not allow to create structure with more then one positive parent.";
                                    $.trace.error(sLogMessage);
                                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                                }
                            }
                            if (!oItemIds.hasOwnProperty(oItem.ITEM_ID)) {
                                oItemIds[oItem.ITEM_ID] = oItem.ITEM_ID;
                            } else {
                                const sLogMessage = "Item structure cannot be created since 'normal' mode does not allow to send items with same ITEM_IDs.";
                                $.trace.error(sLogMessage);
                                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                            }
                        }
                    });

                    if (iPositiveParent === 0) {
                        const sLogMessage = "Item structure to be created is not valid since 'normal' mode does not allow to create a structure that it is not attached to a parent root.";
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }

                    aItemParents.forEach(iParent => {
                        if (iParent < 0) {
                            if (!oItemIds.hasOwnProperty(iParent)) {
                                const sLogMessage = 'Item structure to be created is not valid as all the parent ids should reffere to an existing item or an item created in this structure.';
                                $.trace.error(sLogMessage);
                                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                            }
                        }
                    });
                }
            }
        }

        /**
		 * Compares the new item with the old one to be replaced. Checks, that the old item actually exists and that PARENT_ITEM_ID,
		 * PREDECESSOR_ITEM_ID and ITEM_CATEGORY_ID are not changed.
		 */
        async function compareWithItemToReplace(oNewItem) {
            // find all referenced existing items in the calculation-version, i.e. make sure the old item exists and references the same
            // items
            var oExistingRootItem = persistency.Item.getItem(oNewItem.ITEM_ID, oNewItem.CALCULATION_VERSION_ID, sessionId);
            // ensure that parent and predecessor have not been changed
            // check if either both (new and old item) have a parent / predecessor set or both have not
            const sClientMsg = 'Item must not change its position on import.';
            const sServerMsg = `${ sClientMsg } Item Id: ${ oNewItem.ITEM_ID }; Calculation Version Id: ${ oNewItem.CALCULATION_VERSION_ID }.`;

            if (helpers.isNullOrUndefined(oNewItem.PARENT_ITEM_ID) !== helpers.isNullOrUndefined(oExistingRootItem.PARENT_ITEM_ID) || helpers.isNullOrUndefined(oNewItem.PREDECESSOR_ITEM_ID) !== helpers.isNullOrUndefined(oExistingRootItem.PREDECESSOR_ITEM_ID)) {
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
            }
            // if a parent is set, it has to be the same for both items (old and new)
            if (!helpers.isNullOrUndefined(oNewItem.PARENT_ITEM_ID)) {
                if (oExistingRootItem.PARENT_ITEM_ID !== oNewItem.PARENT_ITEM_ID) {
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }
            }
            // if a predecessor is set, it has to be the same for both items (old and new)
            if (!helpers.isNullOrUndefined(oNewItem.PREDECESSOR_ITEM_ID)) {
                if (oExistingRootItem.PREDECESSOR_ITEM_ID !== oNewItem.PREDECESSOR_ITEM_ID) {
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }
            }

            // it's not allowed to change the item category during import; => if the ITEM_CATEGORY_ID is set in the new item and it's
            // different to the value stored in the db => throw an exception
            if (!helpers.isNullOrUndefined(oNewItem.ITEM_CATEGORY_ID)) {
                if (oExistingRootItem.ITEM_CATEGORY_ID !== oNewItem.ITEM_CATEGORY_ID) {
                    const sClientMsg = 'Category of item should not be changed during import.';
                    const sServerMsg = `${ sClientMsg } Item Id: ID ${ oNewItem.ITEM_ID }; Calculation Version Id: ${ oNewItem.CALCULATION_VERSION_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }
            }
        }

        /**
		 * Helper function to get a set of all parent item IDs in a particular calculation version.
		 *
		 * @param {array} aBodyItems - array of Item objects
		 * @param {number} iCalculationVersionId - CalculationVersionId
		 * @returns {set} set of all parent item IDs in a particular calculation version
		 */
        async function getParentItemIds(aBodyItems, iCalculationVersionId) {
            const oParentItemIds = new Set(await persistency.Item.getParentItemIds(iCalculationVersionId, sessionId));
            aBodyItems.forEach(oItem => {
                if (oItem.PARENT_ITEM_ID !== undefined && oItem.PARENT_ITEM_ID !== null) {
                    oParentItemIds.add(oItem.PARENT_ITEM_ID);
                }
            });
            return oParentItemIds;
        }

        /**
		 * Creates a map of items containing the item-id as key and an object with the 
		 *      {   item-id, 
		 *          array of children
		 *          and the parent-id
		 *      }
		 *  as value. This is used to faster validate item structures for create item.
		 */
        async function createItemsTree(aBodyItems) {
            var iTopNodeId;
            var bTopNodeFound = false;
            var mItems = new Map();

            var bModeReplace = mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.replace;
            var bModeNotReplace = mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.updateMasterDataAndPrices || mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.noUpdateMasterDataAndPrices;

            aBodyItems.forEach(function (oItem) {

                if (bModeReplace && oItem.ITEM_ID >= 0 || bModeNotReplace && oItem.PARENT_ITEM_ID >= 0) {
                    if (!bTopNodeFound) {
                        iTopNodeId = oItem.ITEM_ID;
                        bTopNodeFound = true;
                    } else {
                        const sClientMsg = 'Item structure to be created is not a valid tree structure. More than one top node available.';
                        const sServerMsg = `${ sClientMsg } Item Id: ${ oItem.ITEM_ID }.`;
                        $.trace.error(sServerMsg);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                    }
                }
                mItems.set(oItem.ITEM_ID, {
                    iItemId: oItem.ITEM_ID,
                    aChildren: [],
                    iParentItemId: oItem.PARENT_ITEM_ID
                });
            });

            //build tree
            for (var value of mItems.values()) {
                if (!helpers.isNullOrUndefined(value.iParentItemId)) {
                    var oValue = mItems.get(value.iParentItemId);
                    //could be undefined for top node
                    if (!helpers.isNullOrUndefined(oValue)) {
                        oValue.aChildren.push(value);
                    }
                }
            }

            return {
                itemTree: mItems,
                topNodeId: iTopNodeId
            };
        }

        async function validateItemsUpdate(aBodyItems) {
            var aValidatedItems = [];
            var oMetaData = metadataProvider.get(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null, null, persistency, sessionId, userName);
            var oMetaDataCF = utils.extendMetadataCustomFields(oMetaData);
            const oValidItemCategoryIds = await persistency.Item.getItemCategories();

            // the version id is set definitely (has been checked before)
            var iCvId = aBodyItems[0].CALCULATION_VERSION_ID;
            var aOldItems = persistency.Item.getItems(_.map(aBodyItems, function (item) {
                return item.ITEM_ID;
            }), iCvId, sessionId);
            setCachedOldItemsInUpdateValidation(aBodyItems, sessionId, aOldItems);
            const mDbItems = new Map(aOldItems.map(oItem => [
                oItem.ITEM_ID,
                oItem
            ]));

            // it's important that the retrieval of non-temporary masterdata is NOT done inside the loop, because the masterdata would be
            // retrieved for every item; this would have a major impact on the performance
            const oExistingNonTemporaryMasterdata = persistency.CalculationVersion.getExistingNonTemporaryMasterdata({
                calculation_version_id: iCvId,
                session_id: sessionId
            });

            // constructing a set containing all parent item ids, in order to decide if an item is an assembly;
            const oParentItemIds = await getParentItemIds(aBodyItems, iCvId);

            _.each(aBodyItems, function (oBodyItem) {
                utils.checkMandatoryProperties(oBodyItem, aMandatoryPropertiesStatic, 'included');
                var oDbItem = mDbItems.get(oBodyItem.ITEM_ID);

                if (oDbItem === undefined) {
                    const sClientMsg = 'Error while validating update request. Item cannot be found in the data base.';
                    const sServerMsg = `${ sClientMsg } Item Id: ${ oBodyItem.ITEM_ID }, Calculation Version Id: ${ iCvId }, Session Id: ${ sessionId }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
                }

                if (oDbItem.ITEM_CATEGORY_ID === constants.ItemCategory.CalculationVersion && _.has(oBodyItem, 'ITEM_CATEGORY_ID') && oBodyItem.ITEM_CATEGORY_ID !== constants.ItemCategory.CalculationVersion) {
                    const sClientMsg = 'Item category of root item should not be changed.';
                    const sServerMsg = `${ sClientMsg } Item Id: ${ oBodyItem.ITEM_ID }, Calculation Version Id: ${ oBodyItem.CALCULATION_VERSION_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }

                var iCategoryId = _.has(oBodyItem, 'ITEM_CATEGORY_ID') ? genericSyntaxValidator.validateValue(oBodyItem.ITEM_CATEGORY_ID, 'PositiveInteger', undefined, true) : oDbItem.ITEM_CATEGORY_ID;

                //check child item category
                var iChildCategoryId = _.has(oBodyItem, 'CHILD_ITEM_CATEGORY_ID') ? genericSyntaxValidator.validateValue(oBodyItem.CHILD_ITEM_CATEGORY_ID, 'PositiveInteger', undefined, true) : constants.ItemCategory.CalculationVersion;
                if (oDbItem.CHILD_ITEM_CATEGORY_ID !== iChildCategoryId && _.has(oBodyItem, 'CHILD_ITEM_CATEGORY_ID') || oDbItem.ITEM_CATEGORY_ID !== iCategoryId) {
                    if (oValidItemCategoryIds.hasOwnProperty(iChildCategoryId) === false || oValidItemCategoryIds[iChildCategoryId] !== iCategoryId) {
                        let oMessageDetails = new MessageDetails();
                        const sClientMsg = 'Child item category id is not valid';
                        const sServerMsg = `${ sClientMsg } Item id: ${ oBodyItem.ITEM_ID }, Child item category id: ${ oBodyItem.CHILD_ITEM_CATEGORY_ID }.`;
                        oMessageDetails.businessObj = constants.ItemCategory.CustomItemCategory;
                        $.trace.error(sServerMsg);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
                    }
                }

                // Check if the current ITEM_ID is in the set of PARENT_ITEM_IDs. If yes, it means the item is an assembly, otherwise a leaf item.
                var iSubitemState = oParentItemIds.has(oBodyItem.ITEM_ID) ? 1 : 0;

                var oSyntacticallyCorrectItem = utils.checkEntity({
                    entity: oBodyItem,
                    categoryId: iCategoryId,
                    subitemState: iSubitemState,
                    metadata: oMetaDataCF,
                    mandatoryPropertyCheckMode: 'notNull'
                });
                aValidatedItems.push(oSyntacticallyCorrectItem);

                //Check if local content is between 0 and 100
                if (oBodyItem.LOCAL_CONTENT > 100 || oBodyItem.LOCAL_CONTENT < 0) {
                    const sClientMsg = 'Local content must have a value between 0 and 100.';
                    const sServerMsg = `${ sClientMsg } Item Id: ${ oBodyItem.ITEM_ID }, Calculation Version Id ${ oBodyItem.CALCULATION_VERSION_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }

            });

            // checking if the item has only valid references to non-temporary masterdata
            self.checkMasterdataReferences(aValidatedItems, oExistingNonTemporaryMasterdata, oMetaDataCF);
            return aValidatedItems;
        }

        async function validateItemsCreate(aBodyItems, mItems) {
            var aValidatedItems = [];
            var oMetaData = metadataProvider.get(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null, null, persistency, sessionId, userName);
            var oMetaDataCF = utils.extendMetadataCustomFields(oMetaData);

            var bModeReplace = mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.replace;
            var bModeNotReplace = mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.updateMasterDataAndPrices || mValidatedParameters[ServiceParameters.mode.name] === ServiceParameters.mode.values.noUpdateMasterDataAndPrices;

            // it's important that the retrieval of non-temporary masterdata is NOT done inside the loop, because the masterdata would be
            // retrieved for every item; this would have a major impact on the performance
            const iCvId = aBodyItems[0].CALCULATION_VERSION_ID; // note: it's already ensured that all items have the same cvId
            const oExistingNonTemporaryMasterdata = persistency.CalculationVersion.getExistingNonTemporaryMasterdata({
                calculation_version_id: iCvId,
                session_id: sessionId
            });

            // constructing a set containing all parent item ids in the calculation version,
            // in order to later decide if an item is an assembly or leaf item.
            const oDbParentItemIds = new Set(await persistency.Item.getParentItemIds(iCvId, sessionId));

            // constructing a set containing all item ids that are referened as parent_item_id in the body items of the request
            const oRequestParentItemIds = new Set();
            aBodyItems.forEach(oItem => {
                if (oItem.PARENT_ITEM_ID !== undefined && oItem.PARENT_ITEM_ID !== null) {
                    oRequestParentItemIds.add(oItem.PARENT_ITEM_ID);
                }
            });

            // check if all referenced parent_item_ids really exist in the calculation version
            const aRefParentItemIds = [...oRequestParentItemIds].filter(id => id > 0); // filter out all negative item_ids
            const oValidItemIds = new Set(persistency.Item.getValidItemIds(aRefParentItemIds, iCvId, sessionId));
            const oValidItemCategoryIds = await persistency.Item.getItemCategories();

            aBodyItems.forEach(oBodyItem => {
                // as a first step, this function call ensures that all properties that are necessary to run any further
                // validation; the check for mandatory properties is conducted again below, whereas then the list of
                // mandatory properties is taken from the meta data; these properties are necessary to select the
                // correct property meta data and their correctness must be ensured beforehand
                 utils.checkMandatoryProperties(oBodyItem, aMandatoryPropertiesStaticCreate);

                var iCategoryId = _.has(oBodyItem, 'ITEM_CATEGORY_ID') ?  genericSyntaxValidator.validateValue(oBodyItem.ITEM_CATEGORY_ID, 'PositiveInteger', undefined, true) : constants.ItemCategory.CalculationVersion;


                if (iCategoryId !== constants.ItemCategory.CalculationVersion && (oBodyItem.PARENT_ITEM_ID === null || oBodyItem.PARENT_ITEM_ID === undefined)) {

                    // item has no parents and is not calculation version -> error 
                    const sClientMsg = 'Item category of root item must be CALCULATION_VERSION.';
                    const sServerMsg = `${ sClientMsg } Item Id: ${ oBodyItem.ITEM_ID }, Calculation Version Id: ${ oBodyItem.CALCULATION_VERSION_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }

                if (iCategoryId !== constants.ItemCategory.CalculationVersion && oBodyItem.PARENT_ITEM_ID > 0) {
                    if (!oValidItemIds.has(oBodyItem.PARENT_ITEM_ID)) {
                        const sClientMsg = 'Parent item id is not valid';
                        const sServerMsg = `${ sClientMsg } Item Id: ${ oBodyItem.ITEM_ID }, Parent Item Id: ${ oBodyItem.PARENT_ITEM_ID }.`;
                        $.trace.error(sServerMsg);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                    }
                }

                //check child item category
                var iChildCategoryId = _.has(oBodyItem, 'CHILD_ITEM_CATEGORY_ID') ?  genericSyntaxValidator.validateValue(oBodyItem.CHILD_ITEM_CATEGORY_ID, 'PositiveInteger', undefined, true) : constants.ItemCategory.CalculationVersion;

                if (oValidItemCategoryIds.hasOwnProperty(iChildCategoryId) === false || oValidItemCategoryIds[iChildCategoryId] !== iCategoryId) {
                    const sClientMsg = 'Child item category id is not valid';
                    const sServerMsg = `${ sClientMsg } Item id: ${ oBodyItem.ITEM_ID }, Child item category id: ${ oBodyItem.CHILD_ITEM_CATEGORY_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
                }

                // depending if an update of a single item shall be updated or a mass update is requested iSubitemState
                // must be determined differently; for mass update look in the request if an item has children; for
                // simple update => look in db
                var iSubitemState;
                if (_.has(mValidatedParameters, ServiceParameters.mode.name) && (bModeReplace || bModeNotReplace)) {
                    var oItemValue = mItems.get(oBodyItem.ITEM_ID);
                    iSubitemState = oItemValue.aChildren.length > 0 ? 1 : 0;
                } else {
                    // Check if the current ITEM_ID is in the set of PARENT_ITEM_IDs, both in the request items and in the DB.
                    // If yes, it means the item is an assembly, otherwise a leaf item.
                    iSubitemState = oDbParentItemIds.has(oBodyItem.ITEM_ID) || oRequestParentItemIds.has(oBodyItem.ITEM_ID) ? 1 : 0;
                }

                var oSyntacticallyCorrectItem = utils.checkEntity({
                    entity: oBodyItem,
                    categoryId: iCategoryId,
                    subitemState: iSubitemState,
                    metadata: oMetaDataCF,
                    mandatoryPropertyCheckMode: 'included'
                });

                if (iCategoryId === constants.ItemCategory.CalculationVersion) {
                    // for root item, the item category property should be set since it is not sent in request 
                    oSyntacticallyCorrectItem.ITEM_CATEGORY_ID = constants.ItemCategory.CalculationVersion;
                }

                aValidatedItems.push(oSyntacticallyCorrectItem);
            });

            self.checkMasterdataReferences(aValidatedItems, oExistingNonTemporaryMasterdata, oMetaDataCF);
            return aValidatedItems;
        }
    };

    /**
	 * Checks if a given set of items references only existing masterdata that cannot contain references to non-existing (also often called temporary) masterdata.
	 * 
	 * This function is used for large item sets in case of mass update or import scenarios. For this reason it's paramount that it scales well and unnecessary steps are avoided.
	 * 
	 * @param aItems The array of items to check for invalid masterdata references.
	 * @param oNonTemporaryMasterdata The ResultSet object containing all allowed values for masterdata references. This is a parameter because the data should be retrieved only once per validation.
	 * @param oMetaData Object containing metadata. Needed to determine custom fields with masterdata references. This is a parameter in order to re-use already retrieved metadata.
	 */
    this.checkMasterdataReferences = async function (aItems, oNonTemporaryMasterdata, oMetaData) {
        const aCustomUoMs = utils.getCustomUoMFields(oMetaData);
        const aCustomCurrencies = utils.getCustomCurrencyFields(oMetaData);

        // references of multiple properties per item must be checked; this array contains the information which item property is to be checked against
        // which set of allowed values; 
        // NOTE: oNonTemporaryMasterdata contains all allowed values in an ResultSet object; because of it's array-based nature, repeated look-ups are costly;
        // for that reason, the result set is transformed into a Set, which provides much better lookup-performance; FOR THE SAKE OF PERFORMANCE IT'S IMPORTANT
        // TO ONLY TO THIS TRANSFORMATION ONCE
        const aPropertiesToCheckConfiguration = [
            {
                propertiesToValidate: ['ACCOUNT_ID'],
                businessObjectType: BusinessObjectTypes.Account,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.ACCOUNTS, 'ACCOUNT_ID')
            },
            {
                propertiesToValidate: ['PRICE_SOURCE_ID'],
                businessObjectType: BusinessObjectTypes.PriceSource,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.PRICE_SOURCES, 'PRICE_SOURCE_ID')
            },
            {
                propertiesToValidate: _.union([
                    'QUANTITY_UOM_ID',
                    'TOTAL_QUANTITY_UOM_ID',
                    'PRICE_UNIT_UOM_ID',
                    'QUANTITY_PER_BASE_UNIT_UOM_ID'
                ], aCustomUoMs),
                businessObjectType: BusinessObjectTypes.UnitOfMeasure,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.UNIT_OF_MEASURES, 'UOM_ID')
            },
            {
                propertiesToValidate: _.union([
                    'TRANSACTION_CURRENCY_ID',
                    'TARGET_COST_CURRENCY_ID'
                ], aCustomCurrencies),
                businessObjectType: BusinessObjectTypes.Currency,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.CURRENCIES, 'CURRENCY_ID')
            },
            {
                propertiesToValidate: ['DOCUMENT_TYPE_ID'],
                businessObjectType: BusinessObjectTypes.DocumentType,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.DOCUMENT_TYPES, 'DOCUMENT_TYPE_ID')
            },
            {
                propertiesToValidate: ['DOCUMENT_STATUS_ID'],
                businessObjectType: BusinessObjectTypes.DocumentStatus,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.DOCUMENT_STATUSES, 'DOCUMENT_STATUS_ID')
            },
            {
                propertiesToValidate: ['MATERIAL_TYPE_ID'],
                businessObjectType: BusinessObjectTypes.MaterialType,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.MATERIAL_TYPES, 'MATERIAL_TYPE_ID')
            },
            {
                propertiesToValidate: ['MATERIAL_GROUP_ID'],
                businessObjectType: BusinessObjectTypes.MaterialGroup,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.MATERIAL_GROUPS, 'MATERIAL_GROUP_ID')
            },
            {
                propertiesToValidate: ['OVERHEAD_GROUP_ID'],
                businessObjectType: BusinessObjectTypes.OverheadGroup,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.OVERHEADS, 'OVERHEAD_GROUP_ID')
            },
            {
                propertiesToValidate: ['VALUATION_CLASS_ID'],
                businessObjectType: BusinessObjectTypes.ValuationClass,
                valueSet: persistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.VALUATION_CLASSES, 'VALUATION_CLASS_ID')
            }
        ];

        const aAllErrors = [];
        aPropertiesToCheckConfiguration.forEach(oConfigObject => {
            aItems.forEach(oItem => {
                const aItemErrors = utils.checkNonTemporaryMasterdataReferencesForItems(oItem, oConfigObject.propertiesToValidate, oConfigObject.valueSet, oConfigObject.businessObjectType);
                if (aItemErrors.length > 0) {
                    // use of the spread-operator (...aItemErrors) is handy to enable to push all errors at once
                    aAllErrors.push(...aItemErrors);
                }
            });
        });

        if (aAllErrors.length > 0) {
            const oMsgDetails = new MessageDetails();
            oMsgDetails.invalidNonTemporaryMasterdataObj = aAllErrors;
            const sClientMsg = `Error while checking masterdata reference. Temporary values are not allowed.`;
            const sServerMsg = `Error while checking masterdata reference. Temporary values are not allowed. For more information, please see response messages`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR, sClientMsg, oMsgDetails);
        }
    };
}

ItemValidator.prototype = Object.create(ItemValidator.prototype);
ItemValidator.prototype.constructor = ItemValidator;


module.exports.authorizationManager = authorizationManager;
module.exports.getCachedOldItemsInUpdateValidation = getCachedOldItemsInUpdateValidation;
module.exports.ItemValidator = ItemValidator;
export default {helpers,_,constants,ServiceParameters,GenericSyntaxValidator,BusinessObjectTypes,MessageLibrary,Code,MessageDetails,PlcException,authorizationManager,oCachedOldItemsInUpdateValidation,getCachedOldItemsInUpdateValidation,setCachedOldItemsInUpdateValidation,clearCachedOldItemsInUpdateValidation,ItemValidator};
