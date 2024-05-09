const _ = require("lodash");
const helpers = require("../util/helpers");

const Constants = require("../util/constants");
const MapStandardFieldsWithFormulas = Constants.mapStandardFieldsWithFormulas;

const MessageLibrary =require("../util/message");
const Operation = MessageLibrary.Operation;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const Severity  = MessageLibrary.Severity;

const oValidItemCustFieldNameRegexp = /^CUST_[A-Z][A-Z0-9_]*$/;
const aFrontendOnlyMetadata = ["PRICE_SPLIT_COMPONENTS"];

var Procedures = Object.freeze({
	p_metadata_get_for_item: "sap.plc.db.administration.procedures::p_metadata_get_for_item"
});

function logError(msg) {
    helpers.logError(msg);
}

/**
 * Processes raw metadata information (stored in external .xsjslib files) and provides access to this processed meta information. The result
 * of the processing are stored inside the created instance to avoid expensive re-calculation. Hence, if possible instances of the
 * MetadataProvider shall be reused.
 * 
 * @constructor
 */
function MetadataProvider() {

    /**
	 * Gets the metadata for all the categories.
	 * 
	 * @param sPath
	 *            {string} - path is used to navigate through the client side models (business objects)
	 * @param sBusinessObject
	 *            {string} - the Business Object's name
	 * @param sColumnId
	 *            {string} - the id of the column
     * @param sSessionId
     *            {string} - the id of the session for which the details shall be retrieved
	 * @param sUserId
	 *            {string} - (current) user id
	 * @returns aReturnedObj {array} - an array containing all the metadata
	 */
    this.get = function(sPath, sBusinessObject, sColumnId, bIsCustom, oPersistency, sSessionId, sUserId) {
        var aReturnedObj = [],
            aDbAttributes = [],
            aText = [],
            aFormulas = [],
            aSelectionFilter = [],
            aSelectionDisplayed = [];
		var aMetadataFields, aMetadataText, aMetadataAttributes, aMetadataFormulas, mSessionDetails,
			aMetadataSelectionFilter, aMetadataSelectionDisplayed;
        
		// Special handling for call from validateItemsUpdate() in itemValidator for performance improvement. The improvement is
		// combine multiple DB select queries into one procedure call
		//   - to reduce DB call time comsumption
		//   - to increase xsjs instance concurrent throughput
		if (Constants.BusinessObjectTypes.Item === sPath && Constants.BusinessObjectTypes.Item === sBusinessObject && null === sColumnId && null === bIsCustom) {
			var fnGetMetadata = oPersistency.getConnection().loadProcedure(Procedures.p_metadata_get_for_item);
			var oResults = fnGetMetadata(sSessionId, sUserId).$resultSets;

			aMetadataFields = oResults[0];
			aMetadataText = oResults[1];
			aMetadataAttributes = oResults[2];
			aMetadataFormulas = oResults[3];
			mSessionDetails = oResults[4];
			aMetadataSelectionFilter = oResults[5];
			aMetadataSelectionDisplayed = oResults[6];
		}
        
		// if metadata are not returned, fall back to default handlings
		if (helpers.isNullOrUndefined(aMetadataFields)) {
			sPath = (sPath === undefined) ? null : sPath;
			sBusinessObject = (sBusinessObject === undefined) ? null : sBusinessObject;
			sColumnId = (sColumnId === undefined) ? null : sColumnId;
			bIsCustom = (bIsCustom === undefined) ? null : bIsCustom;

/*
 * FIXME: D051132 I think this logic of merging the metadata tables is highly inperformant and should be part of the SQL statement. What
 * you're actually doing here is a join of tables. I did not do a performance analysis but I guess the database layer can handle joins much
 * more efficient than the JavaScript code.
 */
			aMetadataFields = oPersistency.Metadata.getMetadataFields(sPath, sBusinessObject, sColumnId, bIsCustom);
			aMetadataText = oPersistency.Metadata.getMetadataText(sPath, sColumnId);
			aMetadataAttributes = oPersistency.Metadata.getMetadataItemAttributes(sPath, sBusinessObject, sColumnId);
			aMetadataFormulas = oPersistency.Metadata.getMetadataFormulas(sPath, sBusinessObject, sColumnId);
			if(aMetadataFormulas.length > 0){
				aMetadataFormulas.forEach((oFormula) => {
					if(oFormula.PATH === "Item" && oFormula.BUSINESS_OBJECT === "Item" && oFormula.COLUMN_ID === "QUANTITY"){
						const oVariantFormula = Object.assign({}, oFormula);
						oVariantFormula.BUSINESS_OBJECT = "Variant_Item";
						oVariantFormula.PATH = "Variant_Item";
						aMetadataFormulas.push(oVariantFormula);
					}
				});
			}
			if (aMetadataText.length !== 0) {
				mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId); // not needed if aMetadataText is empty
			}
			aMetadataSelectionFilter = oPersistency.Metadata.getMetadataSelectionFilter(sPath, sBusinessObject, sColumnId);
			aMetadataSelectionDisplayed = oPersistency.Metadata.getMetadataSelectionDisplayed(sPath, sBusinessObject, sColumnId);
		}

     	// associate properties into objects
        _.each(aMetadataFields, function(metadataObj) {
            
            aText = _.filter(aMetadataText, function(oMetadaText) {
    			return (oMetadaText.COLUMN_ID === metadataObj.COLUMN_ID && 
    					oMetadaText.PATH === metadataObj.PATH);
    		});
            
            _.each(aText, function(oText) {
                if (oText.LANGUAGE === mSessionDetails.language) {
                    metadataObj.DISPLAY_NAME = oText.DISPLAY_NAME;
                    metadataObj.DISPLAY_DESCRIPTION = oText.DISPLAY_DESCRIPTION;
                }
            });

            metadataObj.TEXT = aText;

            // set the attributes; attributes can contain default values; depending on the path origins from Item the metadata should be
			// made explicit
            // this means not -1 for ITEM_CATEGORY_ID; SUBITEM_STATE; this ensures easy consumption of the metadata
            // for other metadata this is not needed because ITEM_CATEGORY_ID; SUBITEM_STATE have no relevance; they just cannot
			// be null because
            // they are key columns in the data base
			var bPathStartsWithItem = metadataObj.PATH.indexOf(Constants.BusinessObjectTypes.Item) === 0;
			function bVariantItemWithQuantity(){
				var aVariantItemMetadata = ["QUANTITY", "QUANTITY_UOM_ID", "IS_INCLUDED"];
				const bPathStartsWithVariantItem = metadataObj.PATH.indexOf(Constants.TansactionalObjectTyps.VariantItem) === 0;
				const bColumnIdIsQuantity = aVariantItemMetadata.includes(metadataObj.COLUMN_ID);
				return bPathStartsWithVariantItem && bColumnIdIsQuantity;
			}
            aDbAttributes = _.filter(aMetadataAttributes, function(oMetadaAttribute) {
    			return (oMetadaAttribute.COLUMN_ID === metadataObj.COLUMN_ID && 
    					oMetadaAttribute.PATH === metadataObj.PATH && 
    					oMetadaAttribute.BUSINESS_OBJECT ===  metadataObj.BUSINESS_OBJECT);
    		});
			metadataObj.ATTRIBUTES = bPathStartsWithItem || bVariantItemWithQuantity() ? computeCompleteItemMetadataAttributes(aDbAttributes) : aDbAttributes;
			if(bVariantItemWithQuantity()){
				metadataObj.ATTRIBUTES.push(aDbAttributes[0]);
			}
            
            aFormulas = _.filter(aMetadataFormulas, function(oMetadaFormula) {
    			return (oMetadaFormula.COLUMN_ID === metadataObj.COLUMN_ID && 
    					oMetadaFormula.PATH === metadataObj.PATH && 
    					oMetadaFormula.BUSINESS_OBJECT ===  metadataObj.BUSINESS_OBJECT);
			});
            metadataObj.FORMULAS = aFormulas;
            
            aSelectionFilter = _.filter(aMetadataSelectionFilter, function(oMetadaSelectionFilter) {
    			return (oMetadaSelectionFilter.COLUMN_ID === metadataObj.COLUMN_ID && 
    					oMetadaSelectionFilter.PATH === metadataObj.PATH && 
    					oMetadaSelectionFilter.BUSINESS_OBJECT ===  metadataObj.BUSINESS_OBJECT);
    		});
            metadataObj.SELECTION_FILTER = aSelectionFilter;
            
            aSelectionDisplayed = _.filter(aMetadataSelectionDisplayed, function(oMetadaSelectionDisplayed) {
    			return (oMetadaSelectionDisplayed.COLUMN_ID === metadataObj.COLUMN_ID && 
    					oMetadaSelectionDisplayed.PATH === metadataObj.PATH && 
    					oMetadaSelectionDisplayed.BUSINESS_OBJECT ===  metadataObj.BUSINESS_OBJECT);
    		});
            metadataObj.SELECTION_DISPLAYED = aSelectionDisplayed;
            
            aReturnedObj.push(metadataObj);
        });
        return aReturnedObj;
    };

    /**
	 * The item attribute metadata stored in the data base contains default attributes, which are valid for all item categories and all
	 * contexts. Default attributes are indicated by having a -1 for ITEM_CATEGORY_ID, SUBITEM_STATE. For clients the metadata
	 * is easier consumable if this implicit knowledge is made explicit. This function create explicit attribute for all item categories and
	 * contexts if a default attribute is found. If no default attribute is found, no computation is needed and the method return the array
	 * containing the attributes directly from the database.
	 * 
	 * Attention: ITEM_CATEGORY_ID, SUBITEM_STATE are only relevant properties for Item-related metadata. Other metadata may
	 * contain -1 for this properties but because the are not relevant for them, this function should not called for this kind of data
	 * (ITEM_CATEGORY_ID, SUBITEM_STATE are key columns in the underlying data base table and therefore, cannot be null)
	 * 
	 * @param aDbMetadataAttributes
	 *            {array} - An array with the item metadata attribute as contained in the data base
	 * @return {array} - An array with the complete set of item metadata attributes for each item category and context if there were any
	 *         default values for this attributes. If there were no default values for this column id, the returned array contains the same
	 *         values as the input array.
	 * @throws{InvalidRequestException} If explicit and default item metadata attributes are mixed
	 */
    function computeCompleteItemMetadataAttributes(aDbMetadataAttributes) {
        var aComputedMetadataAttributes = [];
        var iItemCategoryCount = Object.keys(Constants.ItemCategory).length;
        _.each(aDbMetadataAttributes, function(oDbAttribute) {
            if (oDbAttribute.ITEM_CATEGORY_ID === -1) {
                for (var iCategoryId = 0; iCategoryId < iItemCategoryCount; iCategoryId++) {
                    computeCategroyMetadata(iCategoryId, oDbAttribute);
				}
            } else {
                computeCategroyMetadata(oDbAttribute.ITEM_CATEGORY_ID, oDbAttribute);
            }
        });

        function computeCategroyMetadata(iCategoryId, oDbAttribute) {
            // there's 1 case that could occur: SUBITEM_STATE == -1; no default values
            // the following if/else block checks for this case and generates the explicit data accordingly
            if (oDbAttribute.SUBITEM_STATE === -1) {
                // only SUBITEM_STATE has default values ==> generate 2 explicit objects
                for (let iSubitemState = 0; iSubitemState < 2; iSubitemState++) {
                    let oExplicitMetadataAttribute = _.clone(oDbAttribute);
                    oExplicitMetadataAttribute.ITEM_CATEGORY_ID = iCategoryId;
                    oExplicitMetadataAttribute.SUBITEM_STATE = iSubitemState;
                    aComputedMetadataAttributes.push(oExplicitMetadataAttribute);
                }
            } else {
                // nothing needs to be computed; just add the computed array and clone it as a precaution
                aComputedMetadataAttributes.push(_.clone(oDbAttribute));
            }
        }
        return aComputedMetadataAttributes;
    }
    
    
    /**
	 * Retrieves valid columns for each (item) category defined for the given path and business object, based on metadata attributes. The
	 * metadata allows to specify wild cards (-1) for the (item) category id, which is handled by the method in the following way:
	 * 
	 * <ul>
	 * <li>if columns are defined for specific categories, the columns defined for the wild card category id (-1) are added to the columns
	 * for the specific category; no columns for the wild card id are returned (this is the case for the business object item) </li>
	 * <li>if columns are only defined for the wild card category id, the returned object contains -1 as key and the list of all wild card
	 * columns as value (this is the case for e.g. calculation version for which no categories exist)</li>
	 * <li>if there are no columns for the business object and path are defined, an empty object is returned</li>
	 * </ul>
	 * 
	 * 
	 * @param sPath
	 *            {string} - Metadata path.
	 * @param sBusinessObject
	 *            {string} - Name of the business object.
	 * @param oPersistency
	 *            {object} - instance of persistency
	 * 
	 * @returns {object} - An object which is used as map. It holds the category ids as keys and array of column ids as values (see above
	 *          for more details)
	 */
    this.getColumnsForCategories = function(sPath, sBusinessObject, oPersistency){
    	// persistency returns a flat array with tuples of ITEM_CATEGORY_ID and COLUMN_ID;
    	var aColumnCategoryCombination = oPersistency.Metadata.getColumnsForCategories(sPath, sBusinessObject);
    	
    	var aWildcardColumns = [];
    	var mColumnsPerCategoryWithoutWildCard = {};

    	// persistency returns a flat array with tuples of ITEM_CATEGORY_ID and COLUMN_ID; in a first step wild card columns are identified
		// (id < 0) and columns are collected for each category
    	_.each(aColumnCategoryCombination, function(oColumnCategory){
    		if(oColumnCategory.ITEM_CATEGORY_ID < 0){
    			//performance improving comparators used: ==,!=
    			if(oColumnCategory.IS_CUSTOM === 1 && oColumnCategory.UOM_CURRENCY_FLAG !== 1){
    				//if it's a item custom field (e.g CUST_TEST), we need to generate the fields: CUST_TEST_MANUAL,CUST_TEST_IS_MANUAL
    				aWildcardColumns.push(oColumnCategory.COLUMN_ID + '_MANUAL');
    				if(oValidItemCustFieldNameRegexp.test(oColumnCategory.COLUMN_ID))
    					aWildcardColumns.push(oColumnCategory.COLUMN_ID + '_IS_MANUAL');
    			}else{
    				//if it's a unit custom field (e.g CUST_TEST_UNIT), we do not need to generate nothing
    				aWildcardColumns.push(oColumnCategory.COLUMN_ID);
    			}	
    				
    		} else {
    			if(!_.has(mColumnsPerCategoryWithoutWildCard, oColumnCategory.ITEM_CATEGORY_ID)){
    				mColumnsPerCategoryWithoutWildCard[oColumnCategory.ITEM_CATEGORY_ID] = [];
    			}
    			if(oColumnCategory.IS_CUSTOM === 1 && oColumnCategory.UOM_CURRENCY_FLAG !== 1){
    				//if it's a custom field (e.g CUST_TEST), we need to generate and add the fields: CUST_TEST_MANUAL,CUST_TEST_IS_MANUAL
    				mColumnsPerCategoryWithoutWildCard[oColumnCategory.ITEM_CATEGORY_ID].push(oColumnCategory.COLUMN_ID + '_MANUAL');
    				if(oValidItemCustFieldNameRegexp.test(oColumnCategory.COLUMN_ID))
    					mColumnsPerCategoryWithoutWildCard[oColumnCategory.ITEM_CATEGORY_ID].push(oColumnCategory.COLUMN_ID + '_IS_MANUAL');
    			}
    			else{
					//if it's a unit custom field (e.g CUST_TEST_UNIT), we do not need to generate nothing
					if(!aFrontendOnlyMetadata.includes(oColumnCategory.COLUMN_ID)){
						mColumnsPerCategoryWithoutWildCard[oColumnCategory.ITEM_CATEGORY_ID].push(oColumnCategory.COLUMN_ID);
					}
    			}
    			
    		}
    	});
    	
    	// there are different scenarios for the return value (see function documentation), due to the fact the the item_category_id is only
		// defined for the business object item so far; in case there exist columns for specific categories as well as there are columns for
		// the wild card category, the wild card columns are added to the list columns for specific category ids, in order to get a complete
		// list; if there are only columns defined for the wild card category, categories do not apply for the specified business object;
		// the returned map contains the list of columns under the property -1, which is the wild card identifier
    	var mColumnsPerCategory = {};
    	if(_.keys(mColumnsPerCategoryWithoutWildCard).length > 0){
    		_.each(mColumnsPerCategoryWithoutWildCard, function(aColumnsWithoutWildCard, sCategoryId){
        		mColumnsPerCategory[sCategoryId] = _.union(aWildcardColumns, aColumnsWithoutWildCard);
        	});
    	} else if(aWildcardColumns.length > 0) {
    		mColumnsPerCategory[-1] = aWildcardColumns;
    	}
    	
    	return mColumnsPerCategory;
    };
    
    /**
     * Retrieves all custom fields columns (with their default value) defined for the category of the specified business object and path. 
	 * 
	 * 
	 * @param sPath
	 *            {string} - Metadata path.
	 * @param sBusinessObject
	 *            {string} - Name of the business object.
	 * @param oPersistency
	 *            {object} - instance of persistency
	 * @param oGeneralDefaultValues
	 *            {object} - contains some general default values (e.g reporting currency)
	 * @returns {object} - An object which is used as map. It holds the category ids as keys and array of objects as values 
	 */
    this.getCustomFieldsWithDefaultValuesForCategories = function(sPath, sBusinessObject, oPersistency, oGeneralDefaultValues){
    
    	const aColumnCategoryCombination = oPersistency.Metadata.getCustomFieldsWithDefaultValuesForCategories(sPath, sBusinessObject);
    	
    	let mColumnsPerCategoryWithDefaultValues = {};

        aColumnCategoryCombination.forEach((oColumnCategory, index) => {
            let sColumnName;
            let oDefaultValue;
            
            
			if(!mColumnsPerCategoryWithDefaultValues.hasOwnProperty(oColumnCategory.ITEM_CATEGORY_ID)){
				mColumnsPerCategoryWithDefaultValues[oColumnCategory.ITEM_CATEGORY_ID] = {};
			}
			
			oDefaultValue = oColumnCategory.DEFAULT_VALUE;
			if(oColumnCategory.UOM_CURRENCY_FLAG !== 1){
				//if it's a custom field (e.g CUST_TEST), we need to generate and add the fields: CUST_TEST_MANUAL
				sColumnName = oColumnCategory.COLUMN_ID + `_MANUAL`;
			}
			else{
				//if it's a unit custom field (e.g CUST_TEST_UNIT), no addition is needed to the name
				sColumnName = oColumnCategory.COLUMN_ID;
				// if there is a custom field for item of type currency, then we must use the reporting currency as default value
				if((oColumnCategory.PROPERTY_TYPE === 7) && (oValidItemCustFieldNameRegexp.test(oColumnCategory.COLUMN_ID))){
				    oDefaultValue = oGeneralDefaultValues.ReportingCurrency;
				}
			}
    	    mColumnsPerCategoryWithDefaultValues[oColumnCategory.ITEM_CATEGORY_ID][sColumnName] = oDefaultValue;
    	});
    	
    	return mColumnsPerCategoryWithDefaultValues;
    };

    /**
	 * Executes batch operations of creating, updating, deleting or multiple metadata objects
	 * For master data objects there are maintained entries on Master data level as well as on Item level
	 * 
	 * @param aBodyMeta
	 *            {array} - array of one or more objects which contain the metadata information
	 * @param oPersistency
	 *            {object} - instance of persistency
	 * 
	 * @returns aResultSet {array} - an array which contains the created metadata
	 */
    
    this.batchCreateUpdateDelete = function(aBodyMeta, oPersistency, checkCanExecute) {
    	var aResultSetCreateSuccess = [],	aResultSetCreateFailed = [] ;
    	var aResultSetDeleteSucess = [], 	aResultSetDeleteFailed = [];
    	var aResultSetUpdateSucess = [],	aResultSetUpdateFailed = [];
    	var aResult = {};
        var isBatchSuccess = true;
        var oResult = {};
        let aStandardFieldsWithFormulas = Array.from(MapStandardFieldsWithFormulas.keys());
        
        oPersistency.Metadata.setTransactionAutocommitDDLOff();
        
		/** 
		 * this array will be used to insert into t_item_ext entities and update _UNIT field
		*/
		var aCustomFieldTriggerUnitChange = [];
		/** 
		 * this array will be used to update t_item_ext and set values of IS_MANUAL, MANUAL value and CALCULATED value
		*/
		var aCustomFieldTriggerManualChange = [];
		/** 
		 * this array will be used to update t_item standard fields with formula and set values of IS_MANUAL, MANUAL value and CALCULATED value
		*/
		var aStandardFieldTriggerManualChange = [];
		var aCustomFieldTriggerDefaultValueChange = [];
		
        _.each(aBodyMeta,function(aBatchItems, sItemKey) {
        	if(sItemKey === "CREATE") {	
        		/* generate a value for TABLE_DISPLAY_ORDER property; 
        		 * this is done to ensure that value of TABLE_DISPLAY_ORDER property is always lower for main field than for referenced UoM / Currency field 
        		*/
        		generateTableDisplayOrder(aBatchItems, oPersistency);
        		
        		_.each(aBatchItems, function(oMeta){ 
        			try {
        				var oMetaResponse = createObj(oMeta, oPersistency);
        				aResultSetCreateSuccess.push(oMetaResponse);
        				if (oMetaResponse.IS_CUSTOM === 1) {
        					aCustomFieldTriggerUnitChange.push(oMeta);
        					if (!_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oMetaResponse.BUSINESS_OBJECT)&&(oMetaResponse.UOM_CURRENCY_FLAG === 0)) {
        						aCustomFieldTriggerManualChange.push(oMeta);
        					}
            				//set default value for boolean fields: 
            				// - in all calculation versions (t_item_ext)
            				// - in all corespunding masterdata objects (t_<masterdata>_ext), f it's a masterdata field
            				if(oMetaResponse.SEMANTIC_DATA_TYPE === 'BooleanInt'){
    						    aCustomFieldTriggerDefaultValueChange.push(oMeta);
    						}
        				}
        				
        				// if it is a master data custom field
        				if(_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oMeta.BUSINESS_OBJECT)) {
        					// create custom field on item level
        					var oItemMeta = createItemMetadata(oMeta);
        					var oMasterdataMetaResponse = createObj(oItemMeta, oPersistency);
        				}
    				} catch (e) {
    					isBatchSuccess = false;
    					createResponse(oMeta, e, Operation.CREATE, aResultSetCreateFailed);
    				} 
        		});
        	}
        	if(sItemKey === "UPDATE") { 
        		 _.each(aBatchItems, function(oMeta) {
        	            try {
        	            	var oMetaResponse = {};
        	            	
        	            	// for master data custom fields there are 2 type of entries in metadata: on Item level and on Master data level;
        	            	// in this case it is necessary to update both of them
        	            	if(_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oMeta.BUSINESS_OBJECT)) {
            					// create a copy of the main object on Item level and update it
            					var oItemMeta = createItemMetadata(oMeta);
            					oMetaResponse = updateObj(oItemMeta, oPersistency);
            				}
        	            	// update the main object
        	            	oMetaResponse = updateObj(oMeta, oPersistency);
        	            	aResultSetUpdateSucess.push(_.omit(oMetaResponse,"FORMULAS_TRIGGERS_IS_MANUAL_CHANGE"));
        	            	if (oMetaResponse.IS_CUSTOM === 1) {
        	            		aCustomFieldTriggerUnitChange.push(oMeta);
        	            		if (oMetaResponse.UOM_CURRENCY_FLAG === 0 && oMetaResponse.FORMULAS_TRIGGERS_IS_MANUAL_CHANGE.length > 0) {
        	            			aCustomFieldTriggerManualChange.push(oMeta);
        	            		}
        	            	}
        	            	// in case of formula is changed (disabled or created) for standard fields 
        	            	if (_.includes(aStandardFieldsWithFormulas, oMeta.COLUMN_ID) && oMetaResponse.FORMULAS_TRIGGERS_IS_MANUAL_CHANGE.length > 0) {
        	            		aStandardFieldTriggerManualChange.push(oMeta);
        	            	}
        	            } catch (e) {
        	            	isBatchSuccess = false;
        	            	createResponse(oMeta, e, Operation.UPDATE, aResultSetUpdateFailed);
        				}
        		 });
        	}
        	if(sItemKey === "DELETE") {
        		_.each(aBatchItems, function(oMeta) {
        			try { 
        				// for master data custom fields there are 2 type of entries in metadata: on Item level and on Master data level;
    	            	// in this case it is necessary to delete both of them
        				if(_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oMeta.BUSINESS_OBJECT)) {
        					// create a copy of the main object on Item level and delete it
        					var oItemMeta = JSON.parse(JSON.stringify(oMeta)); // deep clone of the meta data object
        			    	oItemMeta.PATH = "Item";
        			    	oItemMeta.BUSINESS_OBJECT = "Item";
        			    	
        					deleteObj(oItemMeta, oPersistency, aBatchItems, checkCanExecute);
        				}
        				// delete the main object
        				var oMetaResponse = deleteObj(oMeta, oPersistency, aBatchItems, checkCanExecute);
        				aResultSetDeleteSucess.push(oMetaResponse);
        			} catch (e) {
        				isBatchSuccess = false;
        				createResponse(oMeta, e, Operation.DELETE, aResultSetDeleteFailed);
        			}
        		});
        	}
        });
        	
        if (isBatchSuccess === true) {
        	if(helpers.isNullOrUndefined(checkCanExecute) || checkCanExecute === false){
        		aResult.CREATE = aResultSetCreateSuccess;
        		aResult.UPDATE = aResultSetUpdateSucess;
        		aResult.DELETE = aResultSetDeleteSucess;  		
        	}
    	} else {
    		aResult =  _.union(aResultSetCreateFailed, aResultSetUpdateFailed, aResultSetDeleteFailed);
    	}
        
        oResult.isBatchSuccess = isBatchSuccess;
        oResult.batchResults = aResult;
        
        if(helpers.isNullOrUndefined(checkCanExecute) || checkCanExecute === false ){
        	// trigger generation only if DB operations were succeded and there are other operations except update, and there is at least one custom field
        	if(isBatchSuccess) {
        		try {
        			// generate all DB artefacts
        			oPersistency.Metadata.createDeleteAndGenerate();
        		} catch (e) {
					var oMessageDetails = new MessageDetails();
        			_.each(aBodyMeta,function(aBatchItems, sItemKey) {
        				if(sItemKey === "CREATE") {
        					_.each(aBatchItems, function(oMeta){ 
        						oMessageDetails.addMetadataObjs(oMeta);
        					});
        				}
        				if(sItemKey === "UPDATE") { 
        					_.each(aBatchItems, function(oMeta) {
        						oMessageDetails.addMetadataObjs(oMeta);  
        					});
        				}
        				if(sItemKey === "DELETE") {
        					_.each(aBatchItems, function(oMeta) {
        						oMessageDetails.addMetadataObjs(oMeta);
        					});
        				}
        			});
        			
                    const sClientMsg = "Exception when generating custom fields using DbArtefactController.";
                    const sServerMsg = `${sClientMsg} \nException: ${e}`;                   
                    logError(sServerMsg);        			
        			throw new PlcException(Code.GENERAL_GENERATION_EXCEPTION, sClientMsg, oMessageDetails);
        		}
        	}
        	
        	if (isBatchSuccess === true && aCustomFieldTriggerUnitChange.length > 0) {
        		/**
        		 * copy all items that are in t_item and not in t_item_ext to t_item_ext
        		 * update _UNIT field from t_item_ext for all items
        		 * update _IS_MANUAL and MANUAL and CALCULATED values
        		 */
        		oPersistency.Metadata.copyItemsToItemExt();
        		
        		//copy all entries from masterdata main table to masterdata extension table
        		const aMasterdataBusinessObjectsToCopy = _.without(_.uniq(_.map(aCustomFieldTriggerUnitChange,'BUSINESS_OBJECT')),'Item');
			    aMasterdataBusinessObjectsToCopy.forEach((sBusinessObject, index) => {
			    	oPersistency.Metadata.copyMasterdataToMasterdataExt(sBusinessObject);
                });
        		
        		aCustomFieldTriggerUnitChange.forEach((oMetaTriggerUnitChange, index) =>{ 
        			oPersistency.Metadata.updateUnitField(oMetaTriggerUnitChange);      					
        		});
        		
        		_.each(aCustomFieldTriggerManualChange, function(oMetaTriggerManualChange){ 
        			if (oMetaTriggerManualChange.PATH === "Item" && oMetaTriggerManualChange.BUSINESS_OBJECT === "Item"  ) {
        				oPersistency.Metadata.updateManualField(oMetaTriggerManualChange);      					
        			}
        		});
        	}
        	
        	if (isBatchSuccess === true && aStandardFieldTriggerManualChange.length > 0) {
        		_.each(aStandardFieldTriggerManualChange, function(oMetaStandardField){ 
        			if (oMetaStandardField.PATH === "Item" && oMetaStandardField.BUSINESS_OBJECT === "Item"  ) {
        				oPersistency.Metadata.updateManualFieldForStandardFields(oMetaStandardField);      					
        			}
        		});
        	}
        	
			if(isBatchSuccess === true && aCustomFieldTriggerDefaultValueChange.length > 0) {
				aCustomFieldTriggerDefaultValueChange.forEach((oMetaTriggerBooleanChange, index) => {
                    oPersistency.Metadata.updateFieldWithDefaultValue(oMetaTriggerBooleanChange);
                });
			}
			
			/** remove layout data if at least one custom field was deleted */
			if (isBatchSuccess === true && aResultSetDeleteSucess.length > 0) {
				oPersistency.Metadata.removeLayoutData();
			}
        }
          
        return oResult;
    };
    
    
    /** 
     * Generate a value for TABLE_DISPLAY_ORDER property of each object(masterdata custom field) from aBatchItems array; 
	 * this is done to ensure that value of TABLE_DISPLAY_ORDER property is always lower for main field than for referenced UoM / Currency field.
	 * It is used in batchCreateUpdateDelete() function.
	 *
	 * @param aBatchItems
	 *            {array} - array of objects which contain the metadata information (custom fields)
	 */
    function generateTableDisplayOrder(aBatchItems, oPersistency) {
    	var oRefField = {};
		var iTableDisplayOrder = 0;
		var aFields = _.filter(aBatchItems, function(oMeta) { return oMeta.UOM_CURRENCY_FLAG !== 1; });
		
		if(!helpers.isNullOrUndefined(aBatchItems[0])){
			iTableDisplayOrder = oPersistency.Metadata.getTableDisplayOrder(aBatchItems[0]);
		}

		_.each(aFields, function(oField) {
			if(_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oField.BUSINESS_OBJECT) && oField.BUSINESS_OBJECT !== "Work_Center") {
				// set TABLE_DISPLAY_ORDER for the main field
				oField.TABLE_DISPLAY_ORDER = iTableDisplayOrder;
				iTableDisplayOrder++;
				
				if(!helpers.isNullOrUndefined(oField.REF_UOM_CURRENCY_COLUMN_ID) && oField.REF_UOM_CURRENCY_COLUMN_ID !== '' ) {
					// set TABLE_DISPLAY_ORDER for referenced field as well
					oRefField = _.find(aBatchItems, function(oMeta) { return oMeta.PATH === oField.REF_UOM_CURRENCY_PATH && oMeta.BUSINESS_OBJECT === oField.REF_UOM_CURRENCY_BUSINESS_OBJECT && oMeta.COLUMN_ID === oField.REF_UOM_CURRENCY_COLUMN_ID; });
					oRefField.TABLE_DISPLAY_ORDER = iTableDisplayOrder;
					iTableDisplayOrder++;
				}
			} else oField.TABLE_DISPLAY_ORDER = null;
		});
    }
    
    
    /**
	 * Generate metadata object on Item level - used in batch operations
	 * 
	 * @param oMeta
	 *            {object} - object which contain the metadata information (masterdata custom field)
	 * 
	 * @returns oMetaItem {object} - object which contain the metadata object on Item level (masterdata custom field on Item level)
	 * 
	 * @throws {PlcException}
	 *             if the metadata object does exist already in the database
	 */
    function createItemMetadata(oMeta) {
    	var oItemCategory = Constants.ItemCategory;
    	var oMetaItem = JSON.parse(JSON.stringify(oMeta)); // deep clone of the meta data object
    	oMetaItem.PATH = "Item"; // path of the new object
    	oMetaItem.BUSINESS_OBJECT = "Item";
    	oMetaItem.TABLE_DISPLAY_ORDER = null;
    	oMetaItem.ATTRIBUTES = oMetaItem.ATTRIBUTES.slice();
    	oMetaItem.ATTRIBUTES[0].PATH = "Item";
    	oMetaItem.ATTRIBUTES[0].BUSINESS_OBJECT = "Item";
    	
    	if(oMetaItem.UOM_CURRENCY_FLAG === 0 && !helpers.isNullOrUndefined(oMetaItem.REF_UOM_CURRENCY_COLUMN_ID)) {
    		oMetaItem.REF_UOM_CURRENCY_PATH = "Item";
    		oMetaItem.REF_UOM_CURRENCY_BUSINESS_OBJECT = "Item";
    	}
    	
    	_.each(oMetaItem.TEXT, function(oText){
			oText.PATH = "Item";
		});
    	
    	switch(oMeta.BUSINESS_OBJECT) {
    		case "Material":
    		case "Material_Plant":
    			oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Material;
    			
    			// create item attributes with specific item categories for Material and Material Plant
    			oMetaItem.ATTRIBUTES = _.times(7, function(){
    				return _.clone(oMetaItem.ATTRIBUTES[0]);
    			});
    			oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.CalculationVersion;
    			oMetaItem.ATTRIBUTES[1].ITEM_CATEGORY_ID = oItemCategory.Document;
    			oMetaItem.ATTRIBUTES[2].ITEM_CATEGORY_ID = oItemCategory.Material;
    			oMetaItem.ATTRIBUTES[3].ITEM_CATEGORY_ID = oItemCategory.ExternalActivity;
    			oMetaItem.ATTRIBUTES[4].ITEM_CATEGORY_ID = oItemCategory.Subcontracting;
    			oMetaItem.ATTRIBUTES[5].ITEM_CATEGORY_ID = oItemCategory.VariableItem;
    			oMetaItem.ATTRIBUTES[6].ITEM_CATEGORY_ID = oItemCategory.ReferencedVersion;
    			break;
    		case "Material_Price":
    			oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Prices;
    			
    			// create item attributes with specific item categories for Material Price
    			oMetaItem.ATTRIBUTES = _.times(4, function(){
    				return _.clone(oMetaItem.ATTRIBUTES[0]);
    			});
    			oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.Document;
    			oMetaItem.ATTRIBUTES[1].ITEM_CATEGORY_ID = oItemCategory.Material;
    			oMetaItem.ATTRIBUTES[2].ITEM_CATEGORY_ID = oItemCategory.ExternalActivity;
    			oMetaItem.ATTRIBUTES[3].ITEM_CATEGORY_ID = oItemCategory.Subcontracting;
    			break;
    		case "Cost_Center":
    			oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Organization;
    			
    			// create item attributes with specific item categories for Cost Center
    			oMetaItem.ATTRIBUTES = _.times(2, function(){
    				return _.clone(oMetaItem.ATTRIBUTES[0]);
    			});
    			oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.InternalActivity;
    			oMetaItem.ATTRIBUTES[1].ITEM_CATEGORY_ID = oItemCategory.VariableItem;
    			break;
    		case "Work_Center":
    			oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Organization;
    			
    			// create item attributes with specific item categories for Cost Center
    			oMetaItem.ATTRIBUTES = _.times(3, function(){
    				return _.clone(oMetaItem.ATTRIBUTES[0]);
    			});
    			oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.InternalActivity;
    			oMetaItem.ATTRIBUTES[1].ITEM_CATEGORY_ID = oItemCategory.Process;
    			oMetaItem.ATTRIBUTES[2].ITEM_CATEGORY_ID = oItemCategory.VariableItem;
    			break;
    		case "Activity_Price":
    			oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Prices;
    			
    			// create item attributes with specific item categories for Cost Center
    				oMetaItem.ATTRIBUTES = _.times(1, function(){
    				return _.clone(oMetaItem.ATTRIBUTES[0]);
    			});
    			
    			oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.InternalActivity;
    			break;
    		default: {
    			const sLogMessage = `Custom fields are not maintainable for this masterdata object.`;
				logError(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
    	}
    	return oMetaItem;
    }
    
    
    /**
	 * Creates one metadata object - used in batch operations
	 * 
	 * @param oMeta
	 *            {object} - object which contain the metadata information
	 * @param oPersistency
	 *            {object} - instance of persistency
	 * 
	 * @returns oMeta {object} - object which contain the metadata information and the operation
	 * 
	 * @throws {PlcException}
	 *             if the metadata object does exist already in the database
	 */
    function createObj(oMeta, oPersistency) {
    	var oMetaResponse;
	
    	// Check if the object already exists. If it does exist an exception will be
        // thrown.
        var bMetaExists = oPersistency.Metadata.checkMetadataExists(oMeta);
        if (bMetaExists) {
			var oMessageDetails = new MessageDetails();
        	oMessageDetails.addMetadataObjs(oMeta);
			const sLogMessage = `An entry for column ${oMeta.COLUMN_ID} of ${oMeta.BUSINESS_OBJECT} object with the path ${oMeta.PATH} already exists in the database.`;
        	logError(sLogMessage);
    		throw new PlcException(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR, sLogMessage, oMessageDetails);
		}
    	
		oMetaResponse = oPersistency.Metadata.create(oMeta);
		return oMetaResponse;
    }   
    
    /**
	 * Updates one metadata object - used in batch operations
	 * 
	 * @param oMeta
	 *            {object} - object which contain the metadata information
	 * @param oPersistency
	 *            {object} - instance of persistency
	 * 
	 * @returns oMetaResponse {object} - object which contain the metadata information and the operation
	 * 
	 * @throws {PlcException}
	 *             if the metadata object doesn't exist
	 */
    function updateObj(oMeta, oPersistency) {
    	var oMetaResponse;

        // Check if the object already exists in order to be updated. If it doesn't exist an exception will be
        // thrown.
        var bMetaExists = oPersistency.Metadata.checkMetadataExists(oMeta);
        if (!bMetaExists) {
			var oMessageDetails = new MessageDetails();
        	oMessageDetails.addMetadataObjs(oMeta);
			const sLogMessage = `There is no entry for column ${oMeta.COLUMN_ID} of ${oMeta.BUSINESS_OBJECT} object with the path ${oMeta.PATH}.`;
        	logError(sLogMessage);
    		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }
		
		if(!helpers.isNullOrUndefined(oMeta.FORMULAS) && !_.isEmpty(oMeta.FORMULAS)){
			checkIsUsedInCostingSheetFormula(oMeta, oPersistency);
			checkIsUsedAsOverheadCustom(oMeta, oPersistency);
		}

        oMetaResponse = oPersistency.Metadata.update(oMeta);
        return oMetaResponse;
    }
    
    /**
	 * Deletes one metadata object - used in batch operations
	 * 
	 * @param oMeta
	 *            {object} - object which contain the metadata information
	 * @param oPersistency
	 *            {object} - instance of persistency
	 * 
	 * @returns oMeta {object} - object which contain the metadata information and the operation
	 * 
	 * @throws {PlcException}
	 *             if the metadata object doesn't exist
	 */
    function deleteObj(oMeta, oPersistency, aBatchItems, checkCanExecute) {
        var sPath = oMeta.PATH;
        var sObject = oMeta.BUSINESS_OBJECT;
        var sColumn = oMeta.COLUMN_ID;
        
        // Check if the object already exists in order to be deleted. If it doesn't exist an exception will be
        // thrown.
        var bMetaExists = oPersistency.Metadata.checkMetadataExists(oMeta);
        if (!bMetaExists) {
			var oMessageDetails = new MessageDetails();
        	oMessageDetails.addMetadataObjs(oMeta);
			const sLogMessage = `There is no entry for column ${sColumn} of ${sObject} object with the path ${sPath}.`;
        	logError(sLogMessage);
        	throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }
        
        var aIsUsedInFormulas = oPersistency.Metadata.checkIsUsedInFormula(oMeta, aBatchItems);
        if (aIsUsedInFormulas.length > 0) {
			var oMessageDetails = new MessageDetails();
        	_.each(aIsUsedInFormulas, function(oIsUsedInFormula) {
        		var formulaUsed = {};
        		formulaUsed.COLUMN_ID = oIsUsedInFormula.COLUMN_ID;
        		formulaUsed.PATH = oIsUsedInFormula.COLUMN_ID;
        		formulaUsed.BUSINESS_OBJECT = oIsUsedInFormula.BUSINESS_OBJECT;
        		oMessageDetails.addFormulaObjs(formulaUsed);
            });

        	const sClientMsg = `Cannot delete field ${oMeta} since it used in other formulas`;
        	const sServerMsg = `${sClientMsg} Used in formulas: ${oMessageDetails.formulaObjs}.`;
        	logError(sServerMsg);
    		throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
		}

		checkIsUsedInCostingSheetFormula(oMeta, oPersistency);
		checkIsUsedAsOverheadCustom(oMeta, oPersistency);
        
        if(helpers.isNullOrUndefined(checkCanExecute) || checkCanExecute === false){
        	oPersistency.Metadata.remove(oMeta); 
        }
        return oMeta;
    }
    
	function checkIsUsedInCostingSheetFormula(oMeta, oPersistency) {

		var aIsUsedInCostingSheetFormula = oPersistency.Metadata.checkIsUsedInCostingSheetFormula(oMeta.COLUMN_ID);
        if (aIsUsedInCostingSheetFormula.length > 0) {
					
			const sClientMsg = `The field ${oMeta.COLUMN_ID} is referenced in a costing sheet overhead rule formula.`;
        	const sServerMsg = `${sClientMsg} Costing sheet overhead rules: ${JSON.stringify(aIsUsedInCostingSheetFormula)}`;
        	logError(sServerMsg);
    		throw new PlcException(Code.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR, sClientMsg);
        }
    }

	function checkIsUsedAsOverheadCustom(oMeta, oPersistency) {

		let aIsUsedAsOverheadCustom = oPersistency.Metadata.checkIsUsedAsOverheadCustom(oMeta);
		if (aIsUsedAsOverheadCustom.length > 0){
			if (aIsUsedAsOverheadCustom[0].OVERHEAD_CUSTOM === oMeta.COLUMN_ID) {

				let oMessageDetails = new MessageDetails();
				oMessageDetails.addMetadataObjs(oMeta);
				const sLogMessage = `The field ${oMeta.COLUMN_ID} is referenced in a costing sheet overhead custom.`;
				logError(sLogMessage);
				throw new PlcException(Code.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_OVERHEAD_ERROR, sLogMessage, oMessageDetails)
			}
		}
	}
    
    /**
	 * Creates response that must be added to batch request
	 * 
	 * @param oMeta
	 *            {object} - object which contain the metadata information
	 * @param e
	 *            {error} - error that is thrown       
	 * @param operation
	 *            {string} - what operation was done for that metadata object, create, update, delete
	 * @param aResultSet
	 *            {array} - array that is filled with errors / success 
	 * 
	 * @returns nothing -  modifies array aResultSet
	 */
    function createResponse(oMeta, e, operation, aResultSet) {
    	var oResult = {} ;
    	oResult.code = e.code.code;
    	oResult.operation = operation;
    	oResult.severity = Severity.ERROR;
    	if (!helpers.isNullOrUndefined(e.details)) {
    		oResult.details = e.details;
    		oResult.details.metadataEntity = oMeta;
    	} else {
    		oResult.details = {};
    		oResult.details.metadataEntity = oMeta;
    	}
    	
		aResultSet.push(oResult);
    }
    
	/**
	 * Get an object containing all custom fields that have rollup and do not have formula for an item category with initial value
	 * 
	 * @param sPath
	 *            {string} - path is used to navigate through the client side models (business objects)
	 * @param sBusinessObject
	 *            {string} - the business object's name which is passed in the URL
	 * @param iItemCategory
	 *            {string}- the item category
	 * 
	 * @returns {array} oFieldsWithRollup - an object containing all custom fields that have rollup and do not have formula for an item category
	 */
    this.getRollupCustomFieldsAsObjectToReset = function(sPath, sBusinessObject, iItemCategory, oPersistency){
		var oFieldsWithRollup = {};
    	var aFieldsWithRollup = oPersistency.Metadata.getRollupCustomFieldsWithoutFormulas(sPath, sBusinessObject, iItemCategory);
    	if (aFieldsWithRollup.length > 0){
        	var aColumns = [];
        	var aValues = [];
	    	_.each(aFieldsWithRollup, function(oField){
				var sIsManualColumn = oField.COLUMN_ID + "_IS_MANUAL";
	    		aColumns.push(sIsManualColumn);
	    		aValues.push(1);
	    	});
	    	oFieldsWithRollup = _.zipObject(aColumns, aValues);
    	}
    	return oFieldsWithRollup;
    };
}
MetadataProvider.prototype = Object.create(MetadataProvider.prototype);
MetadataProvider.prototype.constructor = MetadataProvider;

module.exports.MetadataProvider = MetadataProvider;