const helpers = require("../util/helpers");
const _ = require("lodash");
const Constants = require("../util/constants")
const MessageLibrary = require("../util/message");
const PriceSourceType = Constants.PriceSourceType;
const ServiceParameters = Constants.ServiceParameters;
const BusinessObjectsEntities = require("../util/masterdataResources").BusinessObjectsEntities;
const MapStandardFieldsWithFormulas = Constants.mapStandardFieldsWithFormulas;

const ItemService = require("../service/itemService");
const getCachedOldItemsInUpdateValidation = require("../validator/itemValidator").getCachedOldItemsInUpdateValidation;

const Provider = require("../metadata/metadataProvider").MetadataProvider;
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const ItemCategory = Constants.ItemCategory;
const Uom = Constants.Uom;

const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;


module.exports.Items = function($) {
const that = this;
var sUserId;
const sSessionId = sUserId = $.getPlcUsername();

var metadataProvider = new Provider();

const aMasterdataRelatedFields = [ "ACCOUNT_ID", "DOCUMENT_ID", "DOCUMENT_TYPE_ID", "DOCUMENT_STATUS_ID", "DESIGN_OFFICE_ID", 
                                 "MATERIAL_ID", "MATERIAL_TYPE_ID", "MATERIAL_GROUP_ID", "OVERHEAD_GROUP_ID", "VALUATION_CLASS_ID",
                                 "ACTIVITY_TYPE_ID", "PROCESS_ID", "COMPANY_CODE_ID",
                                 "COST_CENTER_ID", "PLANT_ID", "WORK_CENTER_ID", "BUSINESS_AREA_ID", "PROFIT_CENTER_ID", "VENDOR_ID", "IS_DISABLING_ACCOUNT_DETERMINATION" ];

const aPropertiesTriggerValueDetermination = [ "ITEM_CATEGORY_ID", "PRICE_SOURCE_ID","PRICE_SOURCE_TYPE_ID", "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION",
		"TRANSACTION_CURRENCY_ID", "PRICE_UNIT", "PRICE_UNIT_UOM_ID", "IS_DISABLING_PRICE_DETERMINATION" ].concat(aMasterdataRelatedFields);
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
function updateReferencedCalculationVersions(aItemToUpdateReferencedVersion, mItemsForPayload, oPersistency){

	//return if no items are to be updated
	if(helpers.isNullOrUndefined(aItemToUpdateReferencedVersion) || aItemToUpdateReferencedVersion.length === 0){
		return mItemsForPayload;
	}

	// Referenced calculation version setting
	oPersistency.Item.updateReferencedCalculationVersionID(aItemToUpdateReferencedVersion, sSessionId);
	_.each(aItemToUpdateReferencedVersion, function(iItemToUpdateReferencedVersion){
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
this.update = function(aBodyItems, aParameters, oServiceOutput, oPersistency) {
	var iCvId = aBodyItems[0].CALCULATION_VERSION_ID;
	const bOmitItems = aParameters.omitItems || false;
	var aCachedOldItems = getCachedOldItemsInUpdateValidation(aBodyItems, sSessionId);
	// since this is an update request, the entities that shall be updated must exist; check that all items are in the database and that they reference the same version; 
	//use only mDbItems to access items for the sake of performance, it contains additional properties, which are not included in the request object
    var mDbItems = checkItemsForUpdate(aBodyItems, iCvId, oPersistency, aCachedOldItems);
		
    that.setDefaultValueForIsManualField(aBodyItems, oPersistency, mDbItems);

	// map item_id -> item_id to store ids of items that must be included in the response
	// use JS object as hash set, store item_id as value as well to have access to the integer value; keys would be escaped as strings
	var mItemsForPayload = {};

	//decide the processing steps, skip the unnecessary steps
    var oProcessingSteps = determineProcessingSteps(aBodyItems, mDbItems);
	var aItemsToChangeActiveState = oProcessingSteps.changeActiveState;
	var aItemsWithSameActiveState = oProcessingSteps.sameActiveState;
	var aItemsToUpdate = oProcessingSteps.updateItems;
	var aItemsUpdateMasterdata = oProcessingSteps.updateMasterdata;

    // enable delta update for calculation engine, return results only for changed items
	oPersistency.Item.insertChangedItemIdForAFL(aBodyItems);

    // Special case: if nothing has changed and nothings needs to be done, just return
    if (aItemsToChangeActiveState.length === 0 && 
        aItemsWithSameActiveState.length === 0 &&
        aItemsToUpdate.length === 0 &&
        aItemsUpdateMasterdata.length === 0) return;

	// trigger activate/deactivate procedure for items with changed active state
	if (aItemsToChangeActiveState.length > 0) {
		var aItemsActiveStateChanged = oPersistency.Item.setActiveStates(aItemsToChangeActiveState, iCvId, sSessionId);

		_.each(aItemsActiveStateChanged, function(oItemChangedActiveState) {
			mItemsForPayload[oItemChangedActiveState.ITEM_ID] = oItemChangedActiveState.ITEM_ID;
		});
	}
	if (aItemsWithSameActiveState.length > 0) {
		_.each(aItemsWithSameActiveState, function(iItemId) {
			mItemsForPayload[iItemId] = iItemId;
		});
	}	
	
	setDefaultValueForManualAndUnitFields(aItemsToUpdate, mDbItems, iCvId, oPersistency );

	setQuantityUomIdByMaterialBaseUomId(aItemsToUpdate, oPersistency);
	
	// trigger update logic for items with changed properties besides IS_ACTIVE
	triggerUpdate(aItemsToUpdate, mDbItems, iCvId, sSessionId, mItemsForPayload, oServiceOutput, oPersistency);

	// trigger logic to set values for updated reference version items (if any)
	updateReferencedCalculationVersions(oProcessingSteps.updateReferncedVersion, mItemsForPayload, oPersistency);

	var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);

	// retrieve the modified items from the table; is necessary since activate/deactivate would just transmit a minimal item (almost all
	// properties are read-only if an item is deactivated); if the response solely relies on the request items too few information is given
	// back to the client, which would delete the missing values; subsequent activation of the item would cause validation errors
	var aUpdatedItemsDb = bOmitItems ? [] : oPersistency.Item.getItems(_.values(mItemsForPayload), iCvId, sSessionId, aParameters.compressedResult);
	oServiceOutput.setTransactionalData(aUpdatedItemsDb);

	addReferencesDataToResponse(mSessionDetails, oServiceOutput, oPersistency);

	// retrieve masterdata for all items which updated masterdata references during the request
	if (aItemsUpdateMasterdata.length > 0) {
		addMasterdataToResponse(aItemsUpdateMasterdata, iCvId, mSessionDetails, sSessionId, oServiceOutput, oPersistency);
	}

	var iCvIsDirty = aUpdatedItemsDb.length > 0 ? 1 : 0;
	oPersistency.CalculationVersion.setDirty(iCvId, sSessionId, sUserId, iCvIsDirty);
}

/**
 * Helper function which checks that all the items are found in the database for the specified version 
 * and that all the items reference the same version.	   
 */
function checkItemsForUpdate(aBodyItems, iCvId, oPersistency, aCachedOldItems) {
	var aOldItems = aCachedOldItems;
	if (helpers.isNullOrUndefined(aOldItems)) {
		//retrieving the current state of the entities here in order to determine if non-existing entities shall be updated and 
		//in order to access additional properties, which are not included in the request object if needed
		aOldItems = oPersistency.Item.getItems(_.map(aBodyItems, function (item) {
			return item.ITEM_ID;
		}), iCvId, sSessionId);
	}

	var mDbItems = {}; // map item_id -> item
	_.each(aOldItems, function(oItem) {
		mDbItems[oItem.ITEM_ID] = oItem;
	});

	var aMissingItemsInDb = [];
	var aItemsInOtherVersion = [];
	_.each(aBodyItems, function(oBodyItem) {
		if (!_.has(mDbItems, oBodyItem.ITEM_ID)) {
			aMissingItemsInDb.push(oBodyItem);
		}
		if (oBodyItem.CALCULATION_VERSION_ID !== iCvId) {
			aItemsInOtherVersion.push(oBodyItem);
		}
	});
	if (aMissingItemsInDb.length > 0) {
		const sClientMsg = "Error while updating items: cannot find items.";
		const sServerMsg = `${sClientMsg} items ${_.map(aMissingItemsInDb, "ITEM_ID").join(", ")} for version ${iCvId} (session id ${sSessionId}).`;
		$.trace.error(sServerMsg);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
	}
	if (aItemsInOtherVersion.length > 0) {
		const sClientMsg = "Error while updating items: items reference a different version.";
		const sServerMsg = `${sClientMsg} Items ${_.map(aMissingItemsInDb, "ITEM_ID").join(", ")} reference a different version than ${iCvId}.`;
		$.trace.error(sServerMsg);
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
	}
	return mDbItems;
}

/**
 * Helper function that checks if two decimal numbers are not equal.
 * Returns true if they are not equal and false if they have the same value.
 */
function DecimalsNotEqual(dRequest, dDatabase){
	return !(Number.parseFloat(dRequest).toFixed(7) === Number.parseFloat(dDatabase).toFixed(7));
}

/**
 * Helper function which investigates the request items and decide which processing steps are necessary.
 * This is necessary since some processing steps such as automatic value determination or update item are expensive.
 */
function determineProcessingSteps(aBodyItems, mDbItems) {
	var aItemsToChangeActiveState = [];
	var aItemsWithSameActiveState = [];	
	var aItemsToUpdate = [];
	var aItemsUpdateMasterdata = [];
	var aItemToUpdateReferencedVersion = [];
	const aDecimalList = ["LOCAL_CONTENT", "LOT_SIZE", "LOT_SIZE_CALCULATED", "EFFICIENCY", "QUANTITY", "QUANTITY_CALCULATED", "TOTAL_QUANTITY", "BASE_QUANTITY", "BASE_QUANTITY_CALCULATED", "QUANTITY_PER_BASE_UNIT", "PRICE_FIXED_PORTION", "PRICE_FIXED_PORTION_CALCULATED", "PRICE_VARIABLE_PORTION", "PRICE_VARIABLE_PORTION_CALCULATED", "PRICE", "PRICE_UNIT", "PRICE_UNIT_CALCULATED", "SURCHARGE", "TARGET_COST", "TARGET_COST_CALCULATED", "PRICE_FOR_TOTAL_QUANTITY", "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION", "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION", "OTHER_COST", "OTHER_COST_FIXED_PORTION", "OTHER_COST_VARIABLE_PORTION", "TOTAL_COST", "TOTAL_COST_FIXED_PORTION", "TOTAL_COST_VARIABLE_PORTION", "TOTAL_COST_PER_UNIT", "TOTAL_COST_PER_UNIT_FIXED_PORTION", "TOTAL_COST_PER_UNIT_VARIABLE_PORTION"];

	this.checkIfIsActiveChanged = function(oBodyItem){
		if (_.has(oBodyItem, "IS_ACTIVE")) {
			if(oBodyItem.IS_ACTIVE === mDbItems[oBodyItem.ITEM_ID].IS_ACTIVE){
				aItemsWithSameActiveState.push(oBodyItem.ITEM_ID);
			} else {
				const oActivateProcedureInput = _.pick(_.extend({}, mDbItems[oBodyItem.ITEM_ID], oBodyItem), [ "SESSION_ID", "ITEM_ID",
				"CALCULATION_VERSION_ID", "IS_ACTIVE", "PARENT_ITEM_ID" ]);
				// collect items which only need to be handed over to the activate/deactivate procedures; only IS_ACTIVE is changed
				aItemsToChangeActiveState.push(oActivateProcedureInput);
			}
		}
	};
	// If the account is changed and is_disabling_account_determination is not, then set field is_disabling_account_determination to 1
	this.checkIfDisablingAccountDeterminationIsNeeded = function(oBodyItem){
		if (_.has(oBodyItem, "ACCOUNT_ID") &&  !_.has(oBodyItem, "IS_DISABLING_ACCOUNT_DETERMINATION")  ) {
			oBodyItem.IS_DISABLING_ACCOUNT_DETERMINATION = 1;
		}
	};

	this.checkIfSomethingElseChanged = function (oBodyItem) {
		const aItemKeys = _.keys(_.omit(oBodyItem, ["ITEM_ID", "CALCULATION_VERSION_ID", "IS_ACTIVE"]));
		let bSomethingElseChanged = false;
		for (var i = 0; i < aItemKeys.length - 1; i++) {
			const bKeyExistsInDecimalList = aDecimalList.includes(aItemKeys[i]);
			if (bKeyExistsInDecimalList && DecimalsNotEqual(oBodyItem[aItemKeys[i]], mDbItems[oBodyItem.ITEM_ID][aItemKeys[i]])) {
				bSomethingElseChanged = true;
				break;
			} else if (bKeyExistsInDecimalList) { //if exists in decimal list and value is the same as in the db continue
				continue;
			}
			if (oBodyItem[aItemKeys[i]] !== mDbItems[oBodyItem.ITEM_ID][aItemKeys[i]]) { // check all non decimal values
				bSomethingElseChanged = true;
				break;
			}
		}
		return bSomethingElseChanged;
	};

	_.each(aBodyItems, function(oBodyItem) {

		this.checkIfIsActiveChanged(oBodyItem);
		this.checkIfDisablingAccountDeterminationIsNeeded(oBodyItem);
		//if referenced calculation  version is set
		if (_.has(oBodyItem, "REFERENCED_CALCULATION_VERSION_ID")) {
			if (this.checkIfSomethingElseChanged(oBodyItem)) {
				// add items with set referenced calculation version
				aItemToUpdateReferencedVersion.push(oBodyItem);
				// masterdata will be changed also, as all values from source (referenced) calculation version's root item will
				//overwrite item values in master calculation version
				aItemsUpdateMasterdata.push(oBodyItem);
			}
		} else {
			var bSomethingElseChanged = _.keys(_.omit(oBodyItem, [ "ITEM_ID", "CALCULATION_VERSION_ID", "IS_ACTIVE" ])).length > 0;
			if (bSomethingElseChanged === true) {
				// items added aItemsToUpdate have changes different to IS_ACTIVE => need to perform complete update business logic; items can
				// be contained in aItemsChangedActiveState and aItemsToUpdate if besides IS_ACTIVE other properties are changed
				aItemsToUpdate.push(oBodyItem);

				// if an update request contains masterdata references, masterdata needs to be retrieved from the backend later; in order to 
				// retrieve the data later, the items with such references are saved 
				var bMasterdataUpdated = isMasterdataChangeContained(oBodyItem);
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


/**
 * Function is supposed to be used to determine if new masterdata needs to be delivered to the client with a create or update request. 
 * For this it checks if the request object contains any masterdata properties with the value != null (if masterdata references are set to null
*  no new masterdata records need to be deleted)
 *  
 * @param  {object} oBodyItem The request object to be checked for new masterdata references. There is no check against the db state. So if a masterdata 
 *                            property with a value is contained in the request object the function yield true.
 * @return {boolean}          True if the object contains a masterdata property with value != null, false otherwise. 
 */ 
function isMasterdataChangeContained(oBodyItem){
    const aMasterdataKeys = _.intersection(_.keys(oBodyItem), aMasterdataRelatedFields);
    const bMasterdataChanged = _.some(aMasterdataKeys, sKey => oBodyItem[sKey] !== null);
    return bMasterdataChanged;
}

function triggerUpdate(aItemsToUpdate, mDbItems, iCvId, sSessionId, mItemsForPayload, oServiceOutput, oPersistency){
	if (aItemsToUpdate.length > 0) {
		var mAutomaticallyDeterminedValues = {};
		// automatic value determination is an expensive operation, shall only be performed if there are changes on the item entity that
		// require a re-run of the procedure
		var aInputValueDetermination = getItemsRequireValueDetermination(aItemsToUpdate, mDbItems);
		if (aInputValueDetermination.length > 0) {
			var oAutomaticallyDeterminedValuesResult = oPersistency.Item.automaticValueDetermination(aInputValueDetermination, iCvId,
					sSessionId);
	
			_.each(oAutomaticallyDeterminedValuesResult.VALUES, function(oDeterminedValuesItem) {
				mAutomaticallyDeterminedValues[oDeterminedValuesItem.ITEM_ID] = oDeterminedValuesItem;
			});
			ItemService.processValueDeterminationMessages(oAutomaticallyDeterminedValuesResult.MESSAGES, oServiceOutput);
		}

		//actual update
		updateItems(aItemsToUpdate, mItemsForPayload, mDbItems, mAutomaticallyDeterminedValues, oPersistency);
	}
}

/**
 * Helper function which does the update of the items.
 * It contains the actual update logic, which combines automatically determined values and the JS object from the request 
 * and writes the result into the database.
 */
function updateItems(aItems, mItemsForPayload, mDbItems, mAutomaticallyDeterminedValues, oPersistency) {
	let mValidColumnsPerCategory;
	const bMassUpdate = aItems.length > 1; // flag for mass updates
	let oParentItemIds = new Set(); // store parentItemIds to identify assembly and leaf items
	const aTextItemsInputDecimalList = ["LOT_SIZE", "BASE_QUANTITY", "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TARGET_COST"];
	const aCalculatedValues = ["OTHER_COST", "OTHER_COST_FIXED_PORTION", "OTHER_COST_VARIABLE_PORTION", "PRICE", "PRICE_FOR_TOTAL_QUANTITY", "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION", "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION",
							   "TOTAL_COST", "TOTAL_COST_FIXED_PORTION", "TOTAL_COST_PER_UNIT", "TOTAL_COST_PER_UNIT_FIXED_PORTION", "TOTAL_COST_PER_UNIT_VARIABLE_PORTION", "TOTAL_COST_VARIABLE_PORTION"];

	if (bMassUpdate) {
		// for mass updates we need an efficient way to determine if items are assembly or leaf items
		// constructing a set containing all parent item ids, in order to decide if an item is an assembly;
		const iCvId = aItems[0].CALCULATION_VERSION_ID;
		oParentItemIds = new Set(oPersistency.Item.getParentItemIds(iCvId, sSessionId));
		aItems.forEach(oItem => {
			if (oItem.PARENT_ITEM_ID !== undefined && oItem.PARENT_ITEM_ID !== null) {
				oParentItemIds.add(oItem.PARENT_ITEM_ID);
			}
		});
	}
	// for single items we can just use a single SQL statement
	else if (oPersistency.Item.hasItemChildren(aItems[0], sSessionId)) {
		oParentItemIds.add(aItems[0].ITEM_ID);
	}
	const oChangedPropertiesSet = new Set(); // stores all properties that are changed in at least one item

	aItems.forEach((oItem, index) => {
		let iNewCategoryId;
		let iOldCategoryId;

		// not all columns in t_item_temporary are valid for every item category; if the user changes a category, the values for the new
		// category's invalid columns, shall be set to null in order to keep the data model consistent;
		let oInvalidPropertiesForNewCategory = {};
		if (_.has(oItem, "ITEM_CATEGORY_ID")) {
			// lazy loading of valid columns, only if it's needed (for performance reasons)
			if (mValidColumnsPerCategory === undefined) {
				mValidColumnsPerCategory = metadataProvider.getColumnsForCategories(BusinessObjectTypes.Item, BusinessObjectTypes.Item,
						oPersistency);
			}
			iNewCategoryId = oItem.ITEM_CATEGORY_ID;
			iOldCategoryId = mDbItems[oItem.ITEM_ID].ITEM_CATEGORY_ID;
			oInvalidPropertiesForNewCategory = getInvalidPropertiesForNewCategory(iNewCategoryId, iOldCategoryId,
					mValidColumnsPerCategory);
		}

		const oAutomaticallyDeterminedItemValues = mAutomaticallyDeterminedValues[oItem.ITEM_ID] || {};
		_.extend(oItem, oAutomaticallyDeterminedItemValues, oInvalidPropertiesForNewCategory);

		// when we update to text item category we have to get rid of the input values for decimal fields
		if(!helpers.isNullOrUndefined(iNewCategoryId) && iNewCategoryId !== iOldCategoryId && iNewCategoryId === ItemCategory.TextItem) { 
			aTextItemsInputDecimalList.forEach(column => {
				oItem[column] = null;
				oItem[column + "_IS_MANUAL"] = 0;

			});
			aCalculatedValues.forEach(column => {
				oItem[column] = null;
			});
		}	

		// since the value determination could modify every property, all other modifications (hard-coded) should be done afterwards
		oItem.IS_DIRTY = 1;
		oItem.IS_DELETED = 0;

		const bHasItemChildren = oParentItemIds.has(oItem.ITEM_ID);
		if (!helpers.isNullOrUndefined(oItem.TOTAL_QUANTITY_UOM_ID) && bHasItemChildren === true) {
			oItem.PRICE_UNIT_UOM_ID = oItem.TOTAL_QUANTITY_UOM_ID;
		}

		// synchronized the uom fields when the QUANTITY_UOM_ID was updated for assembly items
		if (!helpers.isNullOrUndefined(oItem.QUANTITY_UOM_ID) && bHasItemChildren === true) {
			oItem.TOTAL_QUANTITY_UOM_ID = oItem.QUANTITY_UOM_ID;
			oItem.PRICE_UNIT_UOM_ID = oItem.QUANTITY_UOM_ID;
		}
		if (bMassUpdate) {
			// Add all changed properties to overall set of changed properties.
			// Important: This must be done after automatic value determination because it can
			// indirectly change additional item properties.
			Object.keys(oItem).forEach(property => oChangedPropertiesSet.add(property));
		}
		else {			
			ItemService.doUpdate(oItem, oPersistency, sSessionId, null, iOldCategoryId, iNewCategoryId);
		}
		mItemsForPayload[oItem.ITEM_ID] = oItem.ITEM_ID;
	});

	if (bMassUpdate) {
		// Special handling for efficient mass update
		// We now again need to iterate over all items and copy properties that are changed by any other item,
		// but not the current one, from database to the item. This is required to do a mass SQL update later on.
		const aChangedProperties = [...oChangedPropertiesSet];
		aItems.forEach((oItem) => {
			const oDbItem = mDbItems[oItem.ITEM_ID];
			// determine which properties are missing for an item (difference: oChangedPropertiesSet - properties of item)
			const aMissingProperties = aChangedProperties.filter(property => !oItem.hasOwnProperty(property));
			// copy missing properties from DB values
			aMissingProperties.forEach(property => oItem[property] = oDbItem[property]);
		});
	
		oPersistency.Item.massUpdate(aItems, sSessionId);
	}
}

/**
 * Helper function to determine which update operations on an item would require a re-run of the automatic value determination. The function
 * takes an array of JS objects containing the changed properties for the entity, as passed to the update() function. It also prepares the
 * input for the value determination procedure by merging the db state of the item with the object passed to update. This step is necessary
 * since the objects passed to update() must not contain all property value to run the procedure. The map with the current data base state
 * for all items is passed to this function in order to avoid an unnecessary retrieval from the db.
 *
 * @param {array}
 *            aItemsToUpdate - The items for which an update is requested, and for this the value determination maybe must be executed.
 * @param {objec}
 *            mDbItems - A JS object used as map, containing the current db state for every item to be updated. Used to construct the
 *            necessary input for the value determination procedure.
 * @returns {Array} An array containing all items for which a run of the value determination procedure is necessary. The properties of the
 *          object's are the current db state of the item merged with the update request. So, the return item objects are different to the
 *          objects in aItemsToUpdate but can be directly handed over to oPersistency.Item.automaticValueDetermination(). An object from
 *          aItemsToUpdate might not contain all necessary properties.
 */
function getItemsRequireValueDetermination(aItemsToUpdate, mDbItems) {
	var aItemsRequireValueDetermination = [];
	_.each(aItemsToUpdate, function(oBodyItem) {
		var bItemRequireValueDetermination = _.some(oBodyItem, function(value, key) {
			return _.includes(aPropertiesTriggerValueDetermination, key);
		});
		if (bItemRequireValueDetermination === true) {
			// since oBodyItem only contains the changed properties for the entity and maybe other values are needed to run the value
			// determination, the current db state of item is merged with oBodyItem; it's important that oBodyItem overwrites values of the
			// db item!
			var oInputForValueDetermination = _.extend({}, mDbItems[oBodyItem.ITEM_ID], oBodyItem);
			aItemsRequireValueDetermination.push(oInputForValueDetermination);
		}
	});
	return aItemsRequireValueDetermination;
}

/**
 * Helper method to determine the properties (column names), which are invalid after a category change.
 *
 * @param iNewCategoryId
 *            {integer} - The id of the new category (after the change)
 * @param iOldCategoryId
 *            {integer} - The id of the old category (before the change)
 * @param mValidPropertiesPerCategory
 *            {object} - An object that maps the item category ids to arrays of valid columns per category.
 * @returns {object} - An object that contains all invalid properties for the new categroy as properties. The value for each property is
 *          <code>null</code>, to that the returned object can directly be used to extend the JS object send to the persistency layer.
 */
function getInvalidPropertiesForNewCategory(iNewCategoryId, iOldCategoryId, mValidPropertiesPerCategory) {
	var aColumnsNewCategory = mValidPropertiesPerCategory[iNewCategoryId];
	var aColumnsOldCategory = mValidPropertiesPerCategory[iOldCategoryId];

	var aInvalidColumns = _.difference(aColumnsOldCategory, aColumnsNewCategory);
	var aNullValues = _.map(aInvalidColumns, _.constant(null));
	return _.zipObject(aInvalidColumns, aNullValues);
}

/**
 * Handles a HTTP POST requests to add a new item. The implementation inserts the new data base entry in t_item_temporary based on JSON data
 * the client gives in the request body. The calculation id and parent item id are mandatory parameters in the JSON string. This update uses
 * a opt-in approach, which means only properties that are contained in the request are updated. Properties that shall be set to
 * <code>NULL</code> must be explicitly set to to <code>null</code> in the request data. After updating the method triggers the
 * calculation engine (TBD), selects the referenced calculation version of the item together with all its items and gives the result (as
 * stringified JSON data) back to client.
 *
 */
this.create = function(aBodyItems, aParameters, oServiceOutput, oPersistency) {
	var iCvId = aBodyItems[0].CALCULATION_VERSION_ID;
	// it could be that updated items are returned from the procedure and are also updated by the code below; to avoid duplications
	// of items a JS object is used as map; currently it's assumed that it's safe to override items in this map later, since the code
	// below retrieves the items from the db, where the procedure has already persisted all values

	var mPayloadItems = {
	    Items: [],
	    CompressedItems: {}
	};
	var aItemsToCreate = aBodyItems;

	var bImport = false;

	// if the parameter mode=replace is set an import is executed
	if (aParameters.mode === ServiceParameters.mode.values.replace) {
		aItemsToCreate = importItems(aBodyItems, iCvId, mPayloadItems, oServiceOutput, oPersistency);
		bImport = true;
	}

	that.setDefaultValueForIsManualField(aItemsToCreate, oPersistency);
	
	var iImport = bImport === true ? 1 : 0;

	//create items
	var aCreatedItems = createItems(aParameters, aItemsToCreate, iCvId, iImport, mPayloadItems, oServiceOutput, oPersistency);

    var aItems = itemValues(mPayloadItems.Items);
    var oPayloadItems = mPayloadItems.CompressedItems;
    
	var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
	let bAddResponseBody = helpers.isNullOrUndefined(aParameters.noResponseBody) || aParameters.noResponseBody === false;

	// get masterdata on item level - this should only be called if the request changes masterdata to another entity, since this is an
    // expensive operation; it masterdata references are set to null no new masterdata needed on clients side => no masterdata will be 
    // delivered
    const aItemsWithMasterdataChanges = _.filter(aBodyItems, oBodyItem => isMasterdataChangeContained(oBodyItem));
	if (aItemsWithMasterdataChanges.length > 0 && bAddResponseBody) {
		addMasterdataToResponse(aItems, iCvId, mSessionDetails, sSessionId, oServiceOutput, oPersistency);
	}

	var iIsDirty = aCreatedItems.length > 0 ? 1 : 0;
	// TODO: check if this should be done for all items operations, since the dirty flag seems not to be used in the moment.
	oPersistency.CalculationVersion.setDirty(iCvId, sSessionId, sUserId, iIsDirty);

	// if mode=replace but only the parent item is transmitted this would cause that this item is updated and all chilren are deleted;
	// there are no items created and hence the status should not be set to CREATED
	oServiceOutput.setStatus(aCreatedItems.length > 0 ? $.net.http.CREATED : $.net.http.OK);
	if(bAddResponseBody) {
		oServiceOutput.setTransactionalData(aParameters.compressedResult && aCreatedItems.length > 0 ? oPayloadItems : aItems);
	}

	addReferencesDataToResponse(mSessionDetails, oServiceOutput, oPersistency);

}

/**
 * Simulate the behavior of underscore's values() function.
 * Note lodash's behavior is different when parameter passed in is an array
 */
function itemValues(obj) {
	var keys = Object.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
        values[i] = obj[keys[i]];
    }
    return values;
}

/**
 * Helper function which does item import.
 * The request must contain a parent item for the import, which has an existing, positive id; 
 * for this existing parent item an update must be performed; this update logic is contained in the block below;
 * additionally, all existing child items are deleted from the parent and the new items in the request are added to the parent
 */
function importItems(aBodyItems, iCvId, mPayloadItems, oServiceOutput, oPersistency) {

	// find 1 parent item
	var aParentItems = _.filter(aBodyItems, function(oBodyItem) {
		return oBodyItem.ITEM_ID >= 0;
	});
	if (aParentItems.length !== 1) {
		const sLogMessage = `Error during replacing child items: expected exactly 1 parent item with ITEM_ID > 0 in request but found ${aParentItems.length}.`;
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);		
	}

	// prepare parent item and run value determination for it
	var oRequestParent = aParentItems[0];
	_.extend(oRequestParent, {
		"IS_DIRTY" : 1,
		"IS_DELETED" : 0,
		"CREATED_ON" : new Date(),
		"CREATED_BY" : sUserId,
		"LAST_MODIFIED_ON" : new Date(),
		"LAST_MODIFIED_BY" : sUserId
	});
	var mDbItem = checkItemsForUpdate([ oRequestParent ], iCvId, oPersistency);

    var aInputValueDetermination = getItemsRequireValueDetermination([ oRequestParent ], mDbItem);
	var aAutomaticallyDeterminedValuesResult = oPersistency.Item.automaticValueDetermination(aInputValueDetermination, iCvId, sSessionId);
	if (aAutomaticallyDeterminedValuesResult.VALUES.length === 1) {
		aAutomaticallyDeterminedValuesResult.VALUES[0].ITEM_DESCRIPTION = oRequestParent.ITEM_DESCRIPTION;
		_.extend(oRequestParent, aAutomaticallyDeterminedValuesResult.VALUES[0]);
		ItemService.processValueDeterminationMessages(aAutomaticallyDeterminedValuesResult.MESSAGES, oServiceOutput);
	}

	// update parent item:
	// currently automaticValueDetermination returns the complete table type of item; a lot of properties are just set to null;
	// with the change of the update item, those values are written to the date base; this is not possible for all columns;
	// that's we have to remove some columns from the extended request object; this can be changed after the refactoring
	// of the value determination procedure (return type)
	var oParentUpdateObject = _.omit(oRequestParent, [ "ITEM_CATEGORY_ID" ]);
	var iModificationCount = oPersistency.Item.update(oParentUpdateObject, sSessionId);
	if (iModificationCount !== 1) {
		const sClientMsg = "Error during replacing child items: unable to find parent item in db.";
		const sServerMsg = `${sClientMsg} Parent item id ${oRequestParent.ITEM_ID} (calculation version: ${iCvId}, session: ${sSessionId}, modification count: ${iModificationCount}).`;
		$.trace.error(sServerMsg);
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
		
	}

	// mark child Items for deletion
	oPersistency.Item.markItemForDeletion(sSessionId, oRequestParent, false);

	mPayloadItems[oRequestParent.ITEM_ID] = oPersistency.Item.getItem(oRequestParent.ITEM_ID, iCvId, sSessionId);
	var aItemsToCreate = _.reject(aBodyItems, function(oBodyItem) {
		return oBodyItem.ITEM_ID === oRequestParent.ITEM_ID;
	});
	iParentId = oRequestParent.ITEM_ID;
	return aItemsToCreate;
}

/**
 * Helper function which does create items.
 * All items are created for the same calculation version.
 * The mode parameter determines if the value determination is done.
 */
function createItems(aParameters, aItemsToCreate, iCvId, iImport, mPayloadItems, oServiceOutput, oPersistency) {
    const bOmitItems = aParameters.omitItems || false;
	let iSetDefaultValues = null,
		iUpdateMasterDataAndPrices = null;
	switch (aParameters.mode) {
		case ServiceParameters.mode.values.updateMasterDataAndPrices: //paste into different calculation version
			iSetDefaultValues = 0;
			iUpdateMasterDataAndPrices = 1;
			break;
		case ServiceParameters.mode.values.noUpdateMasterDataAndPrices: //paste into same calculation version
			iSetDefaultValues = 0;
			iUpdateMasterDataAndPrices = 0;
			break;
		case ServiceParameters.mode.values.replace:
			iSetDefaultValues = 1;
			iUpdateMasterDataAndPrices = 1;
			break;
		case ServiceParameters.mode.values.normal:
			// use of back-end API and addin framework demand, that value determination (dependent fields, account & price determination)
			// is executed for a normal create (clients can set set all values needed for this determination with in the create request)
			// for this reason	iUpdateMasterDataAndPrices is set to 1
			iSetDefaultValues = 1;
			iUpdateMasterDataAndPrices = 1;
			break;
		default: {
			const sLogMessage = `Create Item: Mode parameter value is not valid: ${aParameters.mode}`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
	}

	//all items are created for the same calculation version
	//get the defaults settings of the project in which the items are created
	//and set the target cost currency to the reporting currency of the project
	if(aItemsToCreate.length > 0) {
		var oDefaultSettings = oPersistency.CalculationVersion.getProjectPropertiesForCalculationVersion(aItemsToCreate[0].CALCULATION_VERSION_ID);
		if (!helpers.isNullOrUndefined(oDefaultSettings.REPORT_CURRENCY_ID)) {
			_.each(aItemsToCreate, function(oItem) {
				helpers.setNonEmptyProperties(oItem, oDefaultSettings, ["TARGET_COST_CURRENCY_ID"]);
			});
		}
	}

	// calling the create procedure does:
	// 1. generates ids for new items; old handles are available via HANDLE_ID property after procedure
	// 2. Price determination
	// 3. Account determination
	// 4. Copy of masterdata
	// 5. Set dependent fields
	// 6. Change active state of parents if necessary (new items added to an inactive hierarchy)

	var bCompressedResult = aParameters.compressedResult || false;
	var oProcedureResult = oPersistency.Item.create(aItemsToCreate, sSessionId, iCvId, iImport, iSetDefaultValues, iUpdateMasterDataAndPrices, bCompressedResult);
	let aCreatedItems = [];
	let aUpdatedItems = [];
	let aMessages = [];
	
	if(!bOmitItems && aItemsToCreate.length> 0) {
	    	aCreatedItems = Array.from(oProcedureResult.OT_NEW_ITEMS);
	        aUpdatedItems = Array.from(oProcedureResult.OT_UPDATED_ITEMS);
	        aMessages = Array.from(oProcedureResult.OT_MESSAGES);
	}
	
	ItemService.processValueDeterminationMessages(aMessages, oServiceOutput);
	
	if(bCompressedResult){	     
		let oCreatedItemsCompressed = helpers.transposeResultArray(oProcedureResult.OT_NEW_ITEMS, true);
		let oResult = oCreatedItemsCompressed;
		//the input of transposeResultArray is a result set => it cannot be used here
		_.keys(oCreatedItemsCompressed).forEach(oKey => {
	           if(aUpdatedItems.length > 0) {
	               for (let i=0; i < aUpdatedItems.length; i++) {
	            	    //if the property does not exist for updated items a null is put for each item 
	            	   //for ex. if we have item 3 created and 1,2 updated, we have HANDLE_ID: [-1, null, null]
                        oResult[oKey] = (oCreatedItemsCompressed[oKey]).concat(aUpdatedItems[i][oKey]);
	               }
	            }
	        if( _.has(oProcedureResult.OT_CUSTOM_FIELDS_FROM_REQUEST, oKey)){
	            oProcedureResult.OT_CUSTOM_FIELDS_FROM_REQUEST[oKey].forEach(oItem =>{
	                var index = _.indexOf(oResult.HANDLE_ID, oItem.ITEM_ID);
	                oResult[oKey][index] = oItem.VALUE;
	            });
	        } else {   
             if ( oResult[oKey].findIndex(el => el !== null) === -1) {
                  delete oResult[oKey];
            }}
          });
	
	   mPayloadItems.CompressedItems = oResult;
	}
	
	_.union(aCreatedItems, aUpdatedItems).forEach(oItem => {
         mPayloadItems.Items[oItem.ITEM_ID] = oItem;
     });
	
	//if there was no item updated, add the root item from the request
    if(aParameters.mode === ServiceParameters.mode.values.replace && aUpdatedItems.length === 0){
        mPayloadItems.Items.push(mPayloadItems[iParentId]);
        var aProperties = Object.keys(mPayloadItems.CompressedItems);
        aProperties.forEach(property => mPayloadItems.CompressedItems[property].push((mPayloadItems[iParentId])[property]));
    }

	return aCreatedItems;
}

/**
 * Handles a HTTP DELETE requests to delete an item and all its children.
 *
 */
this.remove = function(aBodyItems, aParameters, oServiceOutput, oPersistency) {
	var iIsDirty = 0;
	var iCalcVersionId = aBodyItems[0].CALCULATION_VERSION_ID;
	// map item_id -> item_id to store ids of items that must be included in the response
	// use JS object as hash set, store item_id as value as well to have access to the integer value; keys would be escaped as strings
	var mItemsForPayload = {};
	var aItemsCheckActiveState = [];
	var aParentItem = [];

	var aPriceSourceIds = oPersistency.Item.getPriceSourceBySourceType(PriceSourceType.Manual);
	var sPriceSourceId = aPriceSourceIds[0].PRICE_SOURCE_ID;
	_.each(aBodyItems, function(oBodyItem, iIndex) {
		//delete item
		var oDeletedItemInfo = deleteItem(oBodyItem, sPriceSourceId, mItemsForPayload, oPersistency);
		aParentItem.push(oDeletedItemInfo.parentItem);
		// safe all items to check their active state in bulk later on; because PARENT_ITEM_ID and IS_ACTIVE needed by the procedure to check the active state for items, the db item must used,
		// since oBodyItem lacks the necessary properties
		aItemsCheckActiveState.push(oDeletedItemInfo.itemDb);
	});

	// check the active state of all parents of the deleted items; if the last active child of an assembly is deleted, the parent (assembly) must be marked
	// as inactive as well
	var aChangedActiveState = oPersistency.Item.setActiveStates(aItemsCheckActiveState, iCalcVersionId, sSessionId);
	_.each(aChangedActiveState, function(oItemChangedActiveState) {
		mItemsForPayload[oItemChangedActiveState.ITEM_ID] = oItemChangedActiveState.ITEM_ID;
	});

	// if some parents were updated, those items need to retrieved from the database in order to update the client;
	// only in some parents were changed a payload may be set
	var aItemIdsForPayload = _.values(mItemsForPayload);
	if (aItemIdsForPayload.length > 0) {
		oServiceOutput.setTransactionalData(oPersistency.Item.getItems(_.values(mItemsForPayload), iCalcVersionId, sSessionId));
	}

	// set calculation version dirty
	iIsDirty = 1;
	oPersistency.CalculationVersion.setDirty(iCalcVersionId, sSessionId, sUserId, iIsDirty);

	//add parent item ids of the deleted items to the global table sent to AFL
	oPersistency.Item.insertChangedItemIdForAFL(aParentItem);

	oServiceOutput.setStatus($.net.http.OK);
}

/**
 * Helper function which contains the logic for deleting an item.
 * It returns the deleted item with all the information taken from the database and the parent item.
 */
function deleteItem(oBodyItem, sPriceSourceId, mItemsForPayload, oPersistency) {
	var oItemDb = oPersistency.Item.getItem(oBodyItem.ITEM_ID, oBodyItem.CALCULATION_VERSION_ID, sSessionId);
	var oResult = oPersistency.Item.markItemForDeletion(sSessionId, oBodyItem, true);
	if (oResult.DELETED_ITEM_COUNT === 0) {
		var oMessageDetails = new MessageDetails();
		oMessageDetails.addItemObjs({
			id : oBodyItem.ITEM_ID
		});

		const sClientMsg = "Could not find item to delete.";
		const sServerMsg = `${sClientMsg} Item id ${oBodyItem.ITEM_ID}.`;
		$.trace.error(sServerMsg);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
	}
	var oParentItem = oPersistency.Item.getItem(oItemDb.PARENT_ITEM_ID, oBodyItem.CALCULATION_VERSION_ID, sSessionId);
	var bParentItemSubitemState = oPersistency.Item.hasItemChildren(oParentItem, sSessionId);
	// update former parent item in case the last child item was deleted; in this case the price information
	// must be reset
	if (bParentItemSubitemState === false) {
		// reset price fields:
		// 1. set calculation related price to 0 (calculation error if set to null!); others could be null
		// 2. set the price source to manual price/rate depending on the category
		// 3. confidence level must be set to 1

		var oCustomFieldsWithRollupToReset = metadataProvider.getRollupCustomFieldsAsObjectToReset(BusinessObjectTypes.Item, BusinessObjectTypes.Item, oParentItem.ITEM_CATEGORY_ID, oPersistency);

		oParentItem = _.extend({},oParentItem, {
			PRICE : 0,
			PRICE_FIXED_PORTION : 0,
			PRICE_VARIABLE_PORTION : 0,
			PRICE_FOR_TOTAL_QUANTITY : 0,
			PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION : null,
			PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION : null,
			PRICE_SOURCE_ID : sPriceSourceId,
			PRICE_SOURCE_TYPE_ID: PriceSourceType.Manual,
			PRICE_UNIT : 1.0,
			CONFIDENCE_LEVEL_ID : 1
		}, oCustomFieldsWithRollupToReset);

		// finally, trigger update (similarly to explicit client update service call)
		ItemService.doUpdate(oParentItem, oPersistency, sSessionId);
		mItemsForPayload[oParentItem.ITEM_ID] = oParentItem.ITEM_ID;
	}

	return {
		parentItem: oParentItem,
		itemDb: oItemDb
	};
}

/**
 * Helper function which adds the masterdata related information to the response.
 */
function addMasterdataToResponse(aItems, iCvId, mSessionDetails, sSessionId, oServiceOutput, oPersistency) {
	const aItemIds = _.map(aItems, function(oItem) {
		return _.pick(oItem, "ITEM_ID");
	});
	const mItemMasterdata = oPersistency.Administration.getMasterdataOnItemLevel(iCvId, mSessionDetails.language, sSessionId,
			aItemIds);

	oServiceOutput.addMasterdata(mItemMasterdata);
}

/**
 * Helper function which adds the information about the referenced versions to the response.
 */
function addReferencesDataToResponse(mSessionDetails, oServiceOutput, oPersistency) {
	var oReferenceVersions = {	referencesdata: {	PROJECTS: [],
		CALCULATIONS: [],
		CALCULATION_VERSIONS: [],
		MASTERDATA: {}
	}};
	var oReferencedVersios = oPersistency.CalculationVersion.getReferencedVersionDetails(oReferenceVersions, mSessionDetails.language);
	oServiceOutput.setReferencesData(oReferencedVersios.referencesdata);
}
/**
 * Handles a HTTP GET requests to get the prices for an item.
 *
 */
this.get = function(aBodyItems, aParameters, oServiceOutput, oPersistency) {

	var oPricesForItem = {};
	oPricesForItem[BusinessObjectsEntities.MATERIAL_PRICE_ENTITIES] = [];
	oPricesForItem[BusinessObjectsEntities.ACTIVITY_PRICE_ENTITIES] = [];

	if(aParameters.getPrices === true){
		var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());   
		oPricesForItem = oPersistency.Item.getPricesForItem(sSessionId,aParameters.calculation_version_id,aParameters.id,mSessionDetails.language);
	} 	
	oServiceOutput.setMasterdata(oPricesForItem.masterdata);
	oServiceOutput.setTransactionalData(oPricesForItem.transactionaldata);

	return oServiceOutput;
}
/**
 * Helper method that sets *_IS_MANUAL flags for standard and custom fields for a set of items. It can be called for creating or updating items (in case of update,
 * parameter mDbItems must be set). In both cases the *_IS_MANUAL flags are initialized if not part of the request or checked for validity. In case a invalid value is
 * part of a request object, the value is correct in favor of a default value. No exception is thrown in order to keep the client running (this might change in future).
 * 
 * Note: This function sets the value for *_IS_MANUAL on the request objects and does not save the changes to the data base tables directly. Hence it's important that it
 *       is called before inserting or updating the items in the table.
 * @param aItems
 *            {array} - Array of items for which the *_IS_MANUAL flags will be set.
 * @param oPersistency
 *            {object} - persistency object
 * @param mDbItems
 *            {object} - An object that maps the item id to item object. This is not passed in case of calling this method from create items and passed when calling from update
 *            
 */ 
this.setDefaultValueForIsManualField = function(aItems, oPersistency, mDbItems) {
    if(aItems.length == 0){
        // there is nothing to do if no items created/updated; this could happen in some import scenarios without replaced items (only update on root of import)
        return;
    }

    // get the metadata for custom fields and standard fields with potential custom formulas to decide if they have a roll-up or formula defined; 
    // this information is used to compute the correct values for *_IS_MANUAL flags
    const oMetadata = oPersistency.Item.getFormulasAndRollupsForStandardAndCustomFields();
    // constructing a set containing all parent item ids, in order to decide if an item is an assembly;
    const oParentItemIds = new Set(oPersistency.Item.getParentItemIds(aItems[0].CALCULATION_VERSION_ID, sSessionId));
    _.each(aItems, oItem => {
        if (oItem.PARENT_ITEM_ID !== undefined && oItem.PARENT_ITEM_ID !== null) {
            oParentItemIds.add(oItem.PARENT_ITEM_ID);
        }
    });
    // optional parameter; needs to be initialized if not set
    mDbItems = mDbItems || {}; 

    // this array contains the rules for *_IS_MANUAL flags; it's kept this way in order to enable a more declarative implementation approach (for the sake of readability);
    // "validValues" contain values which are allowed to be part of the request object in this context; if no values is set, or the value in the request is invalid, the value
    // defined for "defaultValue" is used
    const aIsManualValueRules = [
        { hasFormula: false, isRolledUp: false, isAssembly: false, validValues: [1],    defaultValue: 1 },
        { hasFormula: false, isRolledUp: false, isAssembly: true,  validValues: [1],    defaultValue: 1 },
        { hasFormula: false, isRolledUp: true,  isAssembly: false, validValues: [1],    defaultValue: 1 },
        { hasFormula: false, isRolledUp: true,  isAssembly: true,  validValues: [0],    defaultValue: 0 },
        { hasFormula: true,  isRolledUp: false, isAssembly: false, validValues: [0, 1], defaultValue: 0 },
        { hasFormula: true,  isRolledUp: false, isAssembly: true,  validValues: [0, 1], defaultValue: 0 },
        { hasFormula: true,  isRolledUp: true,  isAssembly: false, validValues: [0, 1], defaultValue: 0 },
        { hasFormula: true,  isRolledUp: true,  isAssembly: true,  validValues: [0],    defaultValue: 0 },
    ];

    _.each(aItems, function(oItem) {
        const iItemCategory = !helpers.isNullOrUndefined(oItem.ITEM_CATEGORY_ID) ? oItem.ITEM_CATEGORY_ID : mDbItems[oItem.ITEM_ID].ITEM_CATEGORY_ID;
        for (let sFieldName in oMetadata[iItemCategory]) {
            const sIsManualFieldName = MapStandardFieldsWithFormulas.has(sFieldName) ? MapStandardFieldsWithFormulas.get(sFieldName) : sFieldName + '_IS_MANUAL';
            const oFieldData = oMetadata[iItemCategory][sFieldName];
            const bItemIsAssembly = oParentItemIds.has(oItem.ITEM_ID);
            const oIsManualRule = aIsManualValueRules.find(oValueDefinition => {
                return oValueDefinition.hasFormula === oFieldData.hasFormula && oValueDefinition.isRolledUp === oFieldData.isRolledUp && oValueDefinition.isAssembly === bItemIsAssembly;
            });
            if (!oIsManualRule){
                const sLogMessage = `Cannot find a definition for the value of ${sIsManualFieldName} (hasFormula: ${oFieldData.hasFormula},  isRolledUp: ${oFieldData.isRolledUp},  isAssembly: ${bItemIsAssembly})`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
            
            let iIsManualValue = oItem[sIsManualFieldName];
            if (helpers.isNullOrUndefined(iIsManualValue) && !helpers.isNullOrUndefined(mDbItems[oItem.ITEM_ID]) && mDbItems[oItem.ITEM_ID].ITEM_CATEGORY_ID === iItemCategory) {
                iIsManualValue = mDbItems[oItem.ITEM_ID][sIsManualFieldName];
				if (oItem[sIsManualFieldName] === null) {
					// if the value for IS_MANUAL in the request is explicitly set to null, override it with value from DB
					oItem[sIsManualFieldName] = iIsManualValue;
				}
            }
            
            const bItemHasValidValue = oIsManualRule.validValues.indexOf(iIsManualValue) > -1;
            if (!bItemHasValidValue){
                // initialize or override the *_IS_MANUAL value; this the set values will be written to db in the course of the create and update logic after calling the function
                oItem[sIsManualFieldName] = oIsManualRule.defaultValue;

                if (oItem.hasOwnProperty(sIsManualFieldName)) {
                    // in case correct value for *_IS_MANUAL is set in request object, only warning is written to the log; since we are close to release and also the client logic had some issues in the past, we decided 
                    // against throwing an exception; this might change in the future;
                    // warning is also only written if the request object contains a invalid value (see hasOwnProperty); otherwise the warning would appear for every created/updated item that does not contain any value
                    $.trace.warning(`Invalid value ${oItem[sIsManualFieldName]} for ${sIsManualFieldName} in context hasFormula: ${oFieldData.hasFormula},  isRolledUp: ${oFieldData.isRolledUp},  isAssembly: ${bItemIsAssembly}.` +
                        ` Resetting to default value ${oIsManualRule.defaultValue}.`);
                }
            }
        } 
    });
}

/**
 * Helper method that updates the item's QUANTITY_UOM_ID based on the material's BASE_UOM_ID or defaults to 'PC'
 * 
 * @param aItems
 *            {array} - Array of items
 * @param oPersistency
 *            {object} - Persistency object
 */ 
function setQuantityUomIdByMaterialBaseUomId(aItems, oPersistency) {

    let aMaterialIds = [];
	aItems.forEach((oItem) => {
	    if(oItem.ITEM_CATEGORY_ID === ItemCategory.InternalActivity
		    && helpers.isNullOrUndefined(oItem.QUANTITY_UOM_ID)) {
            oItem.QUANTITY_UOM_ID = Uom.Hour;
            oItem.PRICE_UNIT_UOM_ID = Uom.Hour;
        } else {
            aMaterialIds.push(oItem.MATERIAL_ID);
        }
	});

	let aMaterialBaseUomIds = oPersistency.Item.getExistingMaterialBaseUomIds(new Date(), aMaterialIds);

	aItems.forEach((oItem) => {

		if(!helpers.isNullOrUndefined(oItem.MATERIAL_ID)
		    && !helpers.isNullOrUndefined(aMaterialBaseUomIds)
		    && aMaterialBaseUomIds.length > 0
		    && helpers.isNullOrUndefined(oItem.QUANTITY_UOM_ID)) {

            let oMaterialBaseUomId = _.find(aMaterialBaseUomIds, function(oMaterialBaseUomId){ return oMaterialBaseUomId.MATERIAL_ID = oItem.MATERIAL_ID; });

			if(!helpers.isNullOrUndefined(oMaterialBaseUomId.BASE_UOM_ID)) {
				oItem.QUANTITY_UOM_ID = oMaterialBaseUomId.BASE_UOM_ID;
				oItem.PRICE_UNIT_UOM_ID = oMaterialBaseUomId.BASE_UOM_ID;
			} else {
				oItem.QUANTITY_UOM_ID = Uom.Piece;
				oItem.PRICE_UNIT_UOM_ID = Uom.Piece;
			}
		}
	});
}

/**
 * Helper method that sets default value for valid *_MANUAL and *_UNIT custom fields. 
 * When item category is changed, new custom fields will be active and default value should be set for them
 * @param aItems
 *            {array} - Array of items for which the default value will be set for valid *_MANUAL and *_UNIT custom fields.
 * @param mDbItems
 *            {object} - An object that maps the item id to item object
 * @param iCvId
 *            {int} - Calculation version id (used to select the reporting currency)
 * @param oPersistency
 *            {object} - Persistency object
 */ 
function setDefaultValueForManualAndUnitFields(aItems, mDbItems, iCvId, oPersistency) {
    //Get the custom field properties that were not valid for old item category and are valid for new item category
	//Set those properties with default values
	let mValidCustomFieldsWithDefaultValuesPerCategory;
	let oGeneralDefaultValues = {};
	aItems.forEach((oItem, index) => {
		let iNewCategoryId;
		let iOldCategoryId;
		let oNewValidCustomFieldsWithDefaultValuesForNewCategory = {};
		if (_.has(oItem, "ITEM_CATEGORY_ID")) {
			// lazy loading of valid columns, only if it's needed (for performance reasons)
			if (mValidCustomFieldsWithDefaultValuesPerCategory === undefined) {
			    oGeneralDefaultValues.ReportingCurrency = oPersistency.CalculationVersion.getWithoutItems([iCvId], sSessionId)[0].REPORT_CURRENCY_ID;
				mValidCustomFieldsWithDefaultValuesPerCategory = metadataProvider.getCustomFieldsWithDefaultValuesForCategories(BusinessObjectTypes.Item, BusinessObjectTypes.Item,
						oPersistency, oGeneralDefaultValues);
			}
			iNewCategoryId = oItem.ITEM_CATEGORY_ID;
			iOldCategoryId = mDbItems[oItem.ITEM_ID].ITEM_CATEGORY_ID;
			oNewValidCustomFieldsWithDefaultValuesForNewCategory = getNewValidCustomFieldsWithDefaultValuesForNewCategory(iNewCategoryId, iOldCategoryId,
					mValidCustomFieldsWithDefaultValuesPerCategory, _.keys(oItem));
			_.extend(oItem,oNewValidCustomFieldsWithDefaultValuesForNewCategory);
		}
	});
}

/**
 * Helper method to determine the custom fields, which are new and valid after a category change.
 *
 * @param iNewCategoryId
 *            {integer} - The id of the new category (after the change)
 * @param iOldCategoryId
 *            {integer} - The id of the old category (before the change)
 * @param mValidCustomFieldsWithDefaultValuesPerCategory
 *            {object} - An object that maps the item category ids to: arrays of valid columns per category and an object with default values.
 * @param aOmitColumns
 *            {object} - An array that contains the fields that should be omited (because are contained in the request)
 * @returns {object} - An object that contains new valid custom properties for the new categroy as properties. New properties
 *                     will be filled with default values
 */
function getNewValidCustomFieldsWithDefaultValuesForNewCategory(iNewCategoryId, iOldCategoryId, mValidCustomFieldsWithDefaultValuesPerCategory, aOmitColumns) {
	const aColumnsNewCategory = _.keys(mValidCustomFieldsWithDefaultValuesPerCategory[iNewCategoryId]);
	const aColumnsOldCategory = _.keys(mValidCustomFieldsWithDefaultValuesPerCategory[iOldCategoryId]);
	
	const oDefaultValuesNewCategory = mValidCustomFieldsWithDefaultValuesPerCategory[iNewCategoryId];
	
	//get only new valid custom fields
	const aNewValidCustomColumns = _.difference(aColumnsNewCategory,aColumnsOldCategory);
	
	//get default values for new valid cutom fiels in an object
    let oCustomFieldsWithDefault = _.pick(oDefaultValuesNewCategory, aNewValidCustomColumns);
    
    //omit the values that are set in the request; update service can contain item category change and a MANUAL/UNIT value change
    oCustomFieldsWithDefault = _.omit(oCustomFieldsWithDefault,aOmitColumns);
    
	return oCustomFieldsWithDefault;
}

}; // end of module.exports.Items