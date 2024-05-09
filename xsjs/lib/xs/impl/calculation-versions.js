const _ = require("lodash");
const helpers = require("../util/helpers");
const constants = require("../util/constants");
const MetaInformation = constants.ServiceMetaInformation;
const ServiceParameters = constants.ServiceParameters;
const CalculationVersionService = require("../service/calculationVersionService");
const calculationVersionSearchDefaultValues = constants.calculationVersionSearchDefaultValues;
const sDefaultExchangeRateType = constants.sDefaultExchangeRateType;
const oPriceDeterminationScenarios = constants.PriceDeterminationScenarios;

const MessageLibrary = require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;
const Code = MessageLibrary.Code;
const Severity = MessageLibrary.Severity;
const MessageDetails = MessageLibrary.Details;

const Items = require("./items").Items;
const CalculationVersionSaveHandler = require("../service/calculationVersionSaveHandler").CalculationVersionSaveHandler;


module.exports.CalculationVersions = function($) {

const that = this;
var sUserId;
const sSessionId = sUserId = $.getPlcUsername();
const items = new Items($);

//REMARK (RF): this is a temporary solution for 1.0; we should think about a better solution to determine the
//properties that are protected in a specific contexts; root cause for this that for save and update different objects
//send from the client; maybe also a different implementation of update in the persistency layer can help
var aProtectedColumnsUpdate = [ "SESSION_ID", "CALCULATION_VERSION_ID", "CALCULATION_VERSION_TYPE", "CALCULATION_ID", "MASTER_DATA_TIMESTAMP", "LAST_MODIFIED_ON",
                                "LAST_MODIFIED_BY" ];

/**
 * Handles a HTTP GET request.
 * Gets Calculation Versions: 
 * - it will return all calculations versions from a calculation when parameter calculation_id is used or top "n" calculations when used together with parameter top
 * - it will return recently used calculation versions when parameter recently_used is "true" or top "n" calculations when used together with parameter top
 * - it will always return root item for each calculation version
 * - it will always return masterdata 
 * - it will return project and calculation only when parameter recently_used is "true".
 */
this.get = function(oBodyData, mParameters, oServiceOutput, oPersistency) {

	var iId = helpers.isNullOrUndefined(mParameters.id || mParameters.calculation_version_id) ? null: mParameters.id || mParameters.calculation_version_id;

	if(iId !== null && !oPersistency.CalculationVersion.exists(iId) && mParameters.search !== true){
	    const oMessageDetails = new MessageDetails().addCalculationVersionObjs({
            id : iId
        });
        const sClientMsg = "Calculation version no longer exists.";
        const sServerMsg = `${sClientMsg} Calculation version id: ${iId}`;
        $.trace.error(sServerMsg);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);    
	}

	let sCalculationId = "";

	if(mParameters.project_id) {
		const projects = mParameters.project_id.split(',');
		oPersistency.Project.checkProjectsExist(projects, sUserId);
		const iTop = helpers.isNullOrUndefined(mParameters.top) ? 100000 : mParameters.top;
		const aCalculations = oPersistency.Calculation.getSaved(projects, sUserId, null, iTop, null, iTop);

		sCalculationId = aCalculations.calculations.map(value => value.CALCULATION_ID).join();
	} else {
		sCalculationId = helpers.isNullOrUndefined(mParameters.calculation_id) ? null: mParameters.calculation_id;
	}

	var iCurrent = helpers.isNullOrUndefined(mParameters.current) ? 0 : mParameters.loadMasterdata === false ? 0 : 1;

	if (mParameters.search === true) {
		getFilteredVersions(mParameters, iId);
	} else {
		if (sCalculationId !== null && iCurrent === 0 && !oPersistency.Calculation.exists(parseInt(sCalculationId, 10))){
            let oMessageDetails = new MessageDetails().addCalculationObjs({
                  id : parseInt(sCalculationId, 10)
            }); 

            const sClientMsg = "Calculation no longer exists.";
            const sServerMsg = `${sClientMsg} Calculation id: ${sCalculationId}`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);             
		}
		if(sCalculationId === null || iId === null || iCurrent === 1){
			getCalculationVersions(mParameters, iId, sCalculationId, iCurrent);
		}
	}

	return oServiceOutput;

	/**
	 * Function for getting the calculation versions that match the search criteria.
	 * @param {string}
	 *            mParameters - parameters from the URL of the HTTP GET request (top, filter, sortingColumn, sortingDirection)
	 * @param {string}
	 *            iId - the id of the calculation version that should be retrieved.
	 */
	function getFilteredVersions(mParameters, iId) {

		var iTop = helpers.isNullOrUndefined(mParameters.top) ? calculationVersionSearchDefaultValues.MaxQueryResults : mParameters.top;
		var sFilters = helpers.isNullOrUndefined(mParameters.filter) ? null: mParameters.filter;
		var sSortingColumn = helpers.isNullOrUndefined(mParameters.sortingColumn) ? calculationVersionSearchDefaultValues.SortingColumn : mParameters.sortingColumn;
		var sSortingDirection = helpers.isNullOrUndefined(mParameters.sortingDirection) ? calculationVersionSearchDefaultValues.SortingDirection : mParameters.sortingDirection;
		var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
		var aGetCalculationsVersionsSearchOutput = oPersistency.CalculationVersion.getCalculationVersionsToBeReferenced(iId, sFilters, sSortingColumn, sSortingDirection, iTop, mSessionDetails.language, sUserId);

		oServiceOutput.setTransactionalData(aGetCalculationsVersionsSearchOutput);
	}

	/**
	 * Function for getting:
	 *          - the calculation that has the id iId or
	 *          - the recent calculation versions or
	 *          - the current calculation versions for a list of calculation ids. 
	 */
	function getCalculationVersions(mParameters, iId, sCalculationId, iCurrent){

		var aCalculationVersions = [];
		var iTop = helpers.isNullOrUndefined(mParameters.top) ? null : mParameters.top;
		var iRecentlyUsed = helpers.isNullOrUndefined(mParameters.recently_used) ? 0 : mParameters.recently_used === false ? 0 : 1;
		var iLoadMasterdata = helpers.isNullOrUndefined(mParameters.loadMasterdata) ? 0 : mParameters.loadMasterdata === false ? 0 : 1;
		const bOmitItems = mParameters.omitItems || false;
		const bReturnLifecycle = helpers.isNullOrUndefined(mParameters.returnLifecycle) ? 1 : mParameters.returnLifecycle === false ? 0 : 1;
		const bGetOnlyLifecycles = helpers.isNullOrUndefined(mParameters.calculation_version_id) ? 0 : 1;

		var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
		var oGetCalculationsOutput = oPersistency.CalculationVersion.get(sCalculationId, iTop, iRecentlyUsed, iId, iLoadMasterdata, sUserId, mSessionDetails.language, iCurrent, bReturnLifecycle, bGetOnlyLifecycles, 1);
		_.each(oGetCalculationsOutput.CALCULATION_VERSIONS, function(oCurrentCalculationVersion) {
			var oCalculationVersions = {};
			oCalculationVersions = _.clone(oCurrentCalculationVersion);
			if( oCalculationVersions.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.Lifecycle || oCalculationVersions.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.ManualLifecycleVersion ){
				delete oCalculationVersions.HAS_LIFECYCLES;
			}
			if(bOmitItems === false) {
                oCalculationVersions.ITEMS = _.filter(oGetCalculationsOutput.ITEMS, (oItem) => oItem.CALCULATION_VERSION_ID === oCurrentCalculationVersion.CALCULATION_VERSION_ID);	
			}else{
                oCalculationVersions.ITEMS = [];
            }
			aCalculationVersions.push(oCalculationVersions);
		});

		var aTransactionalData = {
				"CALCULATION_VERSIONS":aCalculationVersions,
				"CALCULATIONS" : oGetCalculationsOutput.CALCULATIONS,
				"PROJECTS" : oGetCalculationsOutput.PROJECTS
		};
		oServiceOutput.setTransactionalData(aTransactionalData);    
		oServiceOutput.addMasterdata(oGetCalculationsOutput.MASTERDATA);
	}
}


/**
 * Gets a single persisted calculation version and writes the results to the service output object. The function is currently used for requests
 * towards /calculation-versions/{calculation-version-id} resource. It uses the parameters calculation_version_id, loadMasterdata and expand. 
 * In case loadMasterdata=false, the masterdata of the transactional data is not part of the response. calculation_version_id and expand are 
 * mandatory parameters.
 * 
 * NOTE:    The function is uses the procedure p_calculations_versions_read (via oPersistency.CalculationVersion.get), which is not an optimal solution.
 *          The procedure always loads masterdata, even when URL parameter loadMasterdata=false. So, here is room for improvement, however it was 
 *          decided, to do the optimization only if we notice bad performance (huge refactoring effort.)
 * 
 * @param {object} oBodyData Data contained in the body of the request. Supposed to be empty for this function.
 * @param {map} mParameters Key-Value pairs for parameters of the request.
 * @param {object} oServiceOutput Object the result of the function is written to. 
 * @param {object} oPersistency Instance of persistency object to access database tables.
 */
this.getSingle = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
	const iCvId = mParameters.calculation_version_id;
	if (!oPersistency.CalculationVersion.exists(iCvId)) {
		const sClientMsg = "Calculation version does not exist.";
		const sServerMsg = `${sClientMsg}. Id of the calculation version: ${iCvId}`;
		$.trace.info(sServerMsg);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
	}

	const iTop = 1,
		iRecentlyUsed = 0,
		iCurrent = 0,
		bReturnLifecycle = 1,
		bGetOnlyLifecycles = 0;
	const mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
	// masterdata shall not be returned by this service call; if clients need masterdata, they need to query another service resource deliver masterdata
	// for the version
	const iLoadMasterdata = 0;
	const oProcedureResult = oPersistency.CalculationVersion.get(null, iTop, iRecentlyUsed, iCvId, iLoadMasterdata, sUserId, mSessionDetails.language, iCurrent, bReturnLifecycle, bGetOnlyLifecycles, 0);

	if (oProcedureResult.CALCULATION_VERSIONS.length < 1) {
		const sClientMsg = "Calculation version does not longer exist. It might have been deleted.";
		const sServerMsg = `${sClientMsg}. Id of the calculation version: ${iCvId}`;
		$.trace.info(sServerMsg);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
	}

	// the object returned from the result set are immutable; for this reason _.clone is used to create a mutable copy
	const oCalculationVersion = _.clone(oProcedureResult.CALCULATION_VERSIONS[0]);
	if (mParameters.expand === "ITEMS") {
		oCalculationVersion.ITEMS = oProcedureResult.ITEMS;
	}
	// if there are no referenced versions, do not write the referencesdata in the response
    if (!helpers.isNullOrUndefined(oProcedureResult.referencesdata)) {
        oServiceOutput.setReferencesData(oProcedureResult.referencesdata);
    }
	oServiceOutput.setTransactionalData(oCalculationVersion);
}

/**
 * Handles a HTTP GET request for recover service.
 * Recover Calculation Versions: 
 * 		-  will return top "n" calculations versions that were opened in a previous session and needs to be recovered
 * 		-  will always return root item for each calculation version
 * 		-  will return projects and calculations that are assigned to calculation versions found.
 */
this.recover = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
    // Remove all locks for variant matrix context which may remain from previous wrong finished sessions.
    oPersistency.CalculationVersion.unlockVariantMatrixVersionsForSession(sSessionId);

	var aCalculationVersions = [];
    const iTop = helpers.isNullOrUndefined(mParameters.top) ? constants.maxQueryResults : mParameters.top;

    const oRecoverCalculationsOutput = oPersistency.CalculationVersion.recover(iTop, sUserId);
	_.each(oRecoverCalculationsOutput.CALCULATION_VERSIONS, function(oCurrentCalculationVersion) {
		var oCalculationVersions = {};
		oCalculationVersions = _.clone(oCurrentCalculationVersion);
		oCalculationVersions.ITEMS = _.filter(oRecoverCalculationsOutput.ITEMS, function(oItem) {
			return (oItem.CALCULATION_VERSION_ID === oCurrentCalculationVersion.CALCULATION_VERSION_ID);
		});
		aCalculationVersions.push(oCalculationVersions);
	});

    const aTransactionalData = {
			"CALCULATION_VERSIONS":aCalculationVersions,
			"CALCULATIONS" : oRecoverCalculationsOutput.CALCULATIONS,
			"PROJECTS" : oRecoverCalculationsOutput.PROJECTS
	};
	oServiceOutput.setTransactionalData(aTransactionalData);

	return oServiceOutput;
}

/**
 * Reads calculation version data for provided CV id and fills output object accordingly.
 */
this.openCalculationVersion = function(oBodyData, mParameters, oServiceOutput, oPersistency, iCalcVersionId, bCopyData) {

	var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
	var bCompressedResult = mParameters.compressedResult ? mParameters.compressedResult : false;
	const bOmitItems = mParameters.omitItems || false;
    
	oPersistency.CalculationVersion.checkLockCalculatingLifecycle(iCalcVersionId);

	var oReadCalculationVersionResult = oPersistency.CalculationVersion.open(iCalcVersionId, sSessionId, sUserId, mSessionDetails.language, bCopyData, bCompressedResult);
	if (_.isEmpty(oReadCalculationVersionResult.version)) {
        const oMessageDetails = new MessageDetails().addCalculationVersionObjs({
            id : iCalcVersionId
        });
   
        const sClientMsg = "Calculation version not found.";
        const sServerMsg = `${sClientMsg} Calculation version id: ${iCalcVersionId}`;
        $.trace.error(sServerMsg);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
	}
	
	var aResultItems;
	var oRootItem = {};
	if(bCompressedResult){
	    aResultItems = oReadCalculationVersionResult.itemsCompressed;
	    // Get the root item since IS_DIRTY is not stored in t_open_calculation_version anymore.
	    if(aResultItems.hasOwnProperty('PARENT_ITEM_ID')) {
	        var iRootItemIndex = aResultItems.PARENT_ITEM_ID.findIndex(el => el ===null);
	        oRootItem.TOTAL_COST = aResultItems.hasOwnProperty('TOTAL_COST') ? aResultItems.TOTAL_COST[iRootItemIndex] : null;
	        oRootItem.TOTAL_QUANTITY = aResultItems.hasOwnProperty('TOTAL_QUANTITY') ? aResultItems.TOTAL_QUANTITY[iRootItemIndex] : null;
	        oRootItem.TOTAL_QUANTITY_UOM_ID = aResultItems.hasOwnProperty('TOTAL_QUANTITY_UOM_ID') ? aResultItems.TOTAL_QUANTITY_UOM_ID[iRootItemIndex] : null;
	        oRootItem.IS_DIRTY = aResultItems.hasOwnProperty('IS_DIRTY') ? (_.includes(aResultItems.IS_DIRTY, 1) ? 1 : 0) : null;
	    }
	} else {
		aResultItems = oReadCalculationVersionResult.items;
		// Get the root item since IS_DIRTY is not stored in t_open_calculation_version anymore.
		oRootItem = _.find(aResultItems, function(oRootItemCandidate) {
		    return helpers.isNullOrUndefined(oRootItemCandidate.PARENT_ITEM_ID);
	    });
	}
	
	// Add TOTAL_COST, TOTAL_QUANTITY and TOTAL_QUANTITY_UOM_ID to the version level (required only in Backend API).
    oReadCalculationVersionResult.version.TOTAL_COST = oRootItem.TOTAL_COST;
    oReadCalculationVersionResult.version.TOTAL_QUANTITY = oRootItem.TOTAL_QUANTITY;
	oReadCalculationVersionResult.version.TOTAL_QUANTITY_UOM_ID = oRootItem.TOTAL_QUANTITY_UOM_ID;
	if (oReadCalculationVersionResult.version.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.Lifecycle || oReadCalculationVersionResult.version.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.ManualLifecycleVersion) {
		oReadCalculationVersionResult.version.LIFECYCLE_PERIOD_DESCRIPTION = oPersistency.CalculationVersion.getLifecyclePeriodDescription(iCalcVersionId);
	}
	
    //This is for the update function. When updateMasterdataTimestamp && omitItems are both true (required only in Backend API).
	if(bOmitItems === true){
        oReadCalculationVersionResult.items = [];
	}

	if (mParameters.loadMasterdata === true) {
		var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(iCalcVersionId, mSessionDetails.language, sSessionId);
		oServiceOutput.addMasterdata(mCalculationMasterdata);
	}

	var oOutputObject = CalculationVersionService.prepareOutput(oReadCalculationVersionResult);

	var iIsWritable = handleVersionLock(oServiceOutput, oPersistency, iCalcVersionId);
	
	oOutputObject[MetaInformation.IsDirty] = oRootItem.IS_DIRTY;
	oOutputObject[MetaInformation.IsWritable] = iIsWritable;

	oServiceOutput.setTransactionalData(oOutputObject);
	oServiceOutput.setReferencesData(oReadCalculationVersionResult.referencesdata);
	
	return oServiceOutput;
}
/**
 * Function that retuns the update scenarion needed for price determination based on the updated columns
 */
function determineUpdateScenario (mTriggerColumnsChanged)  {
	let sUpdateScenario = oPriceDeterminationScenarios.AllCategoriesScenario;
	if (mTriggerColumnsChanged.size === 1 && mTriggerColumnsChanged.get("MATERIAL_PRICE_STRATEGY_ID"))
		sUpdateScenario = oPriceDeterminationScenarios.MaterialPriceDeterminationScenario;
	else if (mTriggerColumnsChanged.size === 1 && mTriggerColumnsChanged.get("ACTIVITY_PRICE_STRATEGY_ID"))
		sUpdateScenario = oPriceDeterminationScenarios.ActivityPriceDeterminationScenario;

	return sUpdateScenario;
};

/**
 * Handles a HTTP PUT requests. The implementation updates the database entry in t_calculation_version_temporary based on JSON data the
 * client gives in the request body. This update uses a opt-in approach, which means only properties that are contained in the request are
 * updated. Properties that shall be set to <code>NULL</code> must be explicitly set to to <code>null</code> in the request data.
 */
this.update = function(oBodyData, aParameters, oServiceOutput, oPersistency) {

	var oMessageDetails = new MessageDetails();
	const bOmitItems = aParameters.omitItems || false;
	// NOTE: opening multiple calculation versions is currently not supported; should we update the code accordingly?

	var aOldCalculationVersions = oPersistency.CalculationVersion.getWithoutItems(_.map(oBodyData, function(version) {
		return version.CALCULATION_VERSION_ID;
	}), sSessionId);

	var mOldCalculationVersions = {};
	_.each(aOldCalculationVersions, function(oVersion) {
		mOldCalculationVersions[oVersion.CALCULATION_VERSION_ID] = oVersion;
	});

	// Check if all CalculationVersionIds have been found in the database.
	if (_.some(oBodyData, function(oVersion) { return mOldCalculationVersions[oVersion.CALCULATION_VERSION_ID] === undefined; })) {
        const sLogMessage = "One or more calculation versions do not exist.";
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
	}

	// Process each calculation version sent in the body.
	_.each(oBodyData, function(oCalculationVersion) {

		var iIsDirty = 0;
		var iCalculationVersionId = helpers.toPositiveInteger(oCalculationVersion.CALCULATION_VERSION_ID);
		oMessageDetails.addCalculationVersionObjs({
			id : iCalculationVersionId
		});

		if(!helpers.isNullOrUndefined(oCalculationVersion.STATUS_ID)) {
			let oStatus = oPersistency.CalculationVersion.getStatusById(oCalculationVersion.STATUS_ID);
			if(helpers.isNullOrUndefined(oStatus)) {
				const sClientMsg = `Calculation version status not found. Status id: ${oCalculationVersion.STATUS_ID}.`;
				$.trace.error(sClientMsg);
				throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
			}

			if(oStatus.IS_ACTIVE === 0) {
				const sClientMsg = `Calculation version status is deactivated. Status id: ${oCalculationVersion.STATUS_ID}.`;
				$.trace.error(sClientMsg);
				throw new PlcException(Code.STATUS_NOT_ACTIVE_ERROR, sClientMsg);
			}
		}

		if (aParameters.updateMasterdataTimestamp === true) {
			// Update timestamp.
			var dTimestamp = new Date();
			oPersistency.CalculationVersion.updateMasterdataTimestamp(iCalculationVersionId, sSessionId, dTimestamp);

			iIsDirty = 1;
			oPersistency.CalculationVersion.setDirty(iCalculationVersionId, sSessionId, sUserId, iIsDirty);
			
			var oUpdatedCalculationVersion = {};
			oUpdatedCalculationVersion[MetaInformation.CalculationVersionId] = iCalculationVersionId;
			oUpdatedCalculationVersion[MetaInformation.IsDirty] = iIsDirty;
			oServiceOutput.setTransactionalData(oUpdatedCalculationVersion);

			that.openCalculationVersion(oBodyData, aParameters, oServiceOutput, oPersistency, iCalculationVersionId, false);

			return;
		}

		var oOldCalculationVersion = mOldCalculationVersions[iCalculationVersionId];
		if (_.some(_.keys(oOldCalculationVersion), function(key) {
			return oOldCalculationVersion[key] !== oCalculationVersion[key];
		})) {
			// Check if calculation version name is unique.
			CalculationVersionService.isNameUnique(oPersistency, oCalculationVersion.CALCULATION_ID, oCalculationVersion.CALCULATION_VERSION_ID, oCalculationVersion.CALCULATION_VERSION_NAME, oMessageDetails);
			// If the calculation version type is manual lifecycle (16) or lifecycle version (2), extend aProtectedColumnsUpdate 
			const iCalculationVersionType = oPersistency.CalculationVersion.getVersionType(oCalculationVersion.CALCULATION_VERSION_ID, sSessionId);
			if ( iCalculationVersionType === constants.CalculationVersionType.Lifecycle || iCalculationVersionType === constants.CalculationVersionType.ManualLifecycleVersion) {
				aProtectedColumnsUpdate.push("LIFECYCLE_PERIOD_FROM", "BASE_VERSION_ID");
			};
			var iAffectedRows = oPersistency.CalculationVersion.update(oCalculationVersion, aProtectedColumnsUpdate, sSessionId);
			// Validate return values of update statement. If 0 rows affected ==> calculation version was not found ==> 404 error.
			if (iAffectedRows === 0) {
                const sClientMsg = "Calculation version wasn't updated and/or does not exist.";
                const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);                
			}
			
			//when CUSTOMER_ID is missing from the request it means that it was deleted or it is not set (property is null)
			if(helpers.isNullOrUndefined(oCalculationVersion.CUSTOMER_ID)) {
			    oCalculationVersion.CUSTOMER_ID = null;
			}
			
			const aPriceDeterminationTriggerColumns = [ "CUSTOMER_ID", "MATERIAL_PRICE_STRATEGY_ID", "ACTIVITY_PRICE_STRATEGY_ID"];
			const mTriggerColumnsChanged = new Map();
			aPriceDeterminationTriggerColumns.forEach(sColumnName => {
				if (oCalculationVersion[sColumnName] && oCalculationVersion[sColumnName] !== oOldCalculationVersion[sColumnName])
					mTriggerColumnsChanged.set(sColumnName, oCalculationVersion[sColumnName]);
			});
			// valuation date is treated separately since in this case time comparing is needed
			if (oCalculationVersion["VALUATION_DATE"].getTime() !== oOldCalculationVersion["VALUATION_DATE"].getTime())
				mTriggerColumnsChanged.set("VALUATION_DATE", oCalculationVersion["VALUATION_DATE"]);			
		
			// Check whether the material price strategy id, activity price strategy id or customer id has changed (if so, trigger price determination for all related items).
			var oOutputCalculationVersion;
			if (mTriggerColumnsChanged.size > 0) {
				oPersistency.CalculationVersion.persistUpdatedColumns(iCalculationVersionId, sSessionId, mTriggerColumnsChanged);
				const sUpdateScenario = determineUpdateScenario(mTriggerColumnsChanged);
				// Get update fields for prices of items.
				var oPriceDeterminationResult = oPersistency.CalculationVersion.triggerPriceDetermination(iCalculationVersionId, sSessionId, sUpdateScenario);

				// Read all items of calculation version.
				var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
				//TODO: it's not clear where the result object oCalculationVersionResult is used. Should we remove it?
				var oCalculationVersionResult = oPersistency.CalculationVersion.open(iCalculationVersionId, sSessionId, sUserId, mSessionDetails.language, false);

				// Construct payload.
				var oCalculationVersionWithUpdatedItemPriceInfo = oCalculationVersion;
				if (bOmitItems === false) {
				    if(aParameters.compressedResult){
    	                oCalculationVersionWithUpdatedItemPriceInfo.ITEMS_COMPRESSED = helpers.transposeResultArrayOfObjects(oPriceDeterminationResult.UPDATED_ITEMS);
    	            }else{
    	                oCalculationVersionWithUpdatedItemPriceInfo.ITEMS = oPriceDeterminationResult.UPDATED_ITEMS;
    	            }
	            }else{
	                oCalculationVersionWithUpdatedItemPriceInfo.ITEMS = [];
	            }
						
				oOutputCalculationVersion = oCalculationVersionWithUpdatedItemPriceInfo;			
			} else {				

				oOutputCalculationVersion = {};
				oOutputCalculationVersion[MetaInformation.CalculationVersionId] = iCalculationVersionId;												
			}

			// when costing sheet is changed the selected total must be TOTAL_COST
			let sSelectedCostingSheet = oCalculationVersion.COSTING_SHEET_ID;
			let sOldSelectedCostingSheet = oOldCalculationVersion.COSTING_SHEET_ID;
			if (helpers.isNullOrUndefined(sSelectedCostingSheet) || sSelectedCostingSheet !== sOldSelectedCostingSheet ){										
				oOutputCalculationVersion.SELECTED_TOTAL_COSTING_SHEET = constants.CalculationVersionCostingSheetTotals[0];
			}

			// when component split is changed the selected total must be TOTAL_COST
			let sSelectedCompSplit = oCalculationVersion.COMPONENT_SPLIT_ID;
			let sOldSelectedCompSplit = oOldCalculationVersion.COMPONENT_SPLIT_ID;
			if (helpers.isNullOrUndefined(sSelectedCompSplit) || sSelectedCompSplit !== sOldSelectedCompSplit ){
				oOutputCalculationVersion.SELECTED_TOTAL_COMPONENT_SPLIT = constants.CalculationVersionCostingSheetTotals[0];
			}				

			// Check whether Report Currency has changed (if so, trigger update TRANSACTION_CURRENCY_ID for all assembly items).
			if (oOldCalculationVersion.REPORT_CURRENCY_ID !== oCalculationVersion.REPORT_CURRENCY_ID) {
				oPersistency.Item.setPriceTransactionCurrencyForAssemblyItems(sSessionId, iCalculationVersionId, oCalculationVersion.REPORT_CURRENCY_ID);
			}

			if (aParameters.loadMasterdata === true) {
				var aBusinessObjectsEntities = ["PRICE_COMPONENT_ENTITIES", "ACCOUNT_ENTITIES"];
				var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
				var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(iCalculationVersionId, mSessionDetails.language, sSessionId, aBusinessObjectsEntities);
				oServiceOutput.addMasterdata(mCalculationMasterdata);
			}

			// Set calculation version dirty.
			iIsDirty = 1;
			oPersistency.CalculationVersion.setDirty(iCalculationVersionId, sSessionId, sUserId, iIsDirty);

			// fill transactional data
			oOutputCalculationVersion[MetaInformation.IsDirty] = iIsDirty;
			
			if( helpers.isNullOrUndefined(oOutputCalculationVersion.ITEMS) === true) {
				// Add items property since it is mandatory in client.
				oOutputCalculationVersion.ITEMS = [];
			}		

			oServiceOutput.addTransactionalData(oOutputCalculationVersion);

		}
	});
}

/**
 * Handles a HTTP POST requests. Can be used for Creation, Saving, or Closing of a calculation version.
 */
this.handlePostRequest = function(oBodyData, aParameters, oServiceOutput, oPersistency) {
    
    const bOmitItems = aParameters.omitItems || false;
    var sActionParameter = aParameters.action;
    switch (sActionParameter) {
        case ServiceParameters.Open:
            open();
            break;
        case ServiceParameters.Close:
            close();
            break;
        case ServiceParameters.Create:
            create();
            break;
        case ServiceParameters.Copy:
            copy();
            break;
        case ServiceParameters.Freeze:
            freeze();
            break;
        case ServiceParameters.Save:
            save();
            break;
        case ServiceParameters.SaveAs:
            saveAs();
            break;
        default: {
            const sLogMessage = `Unknown value ${sActionParameter} of action parameter for POST calculation-version`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
    }
    
    function open() {
    	var iCalcVersionId = parseInt(aParameters.id, 10);
    	// TODO (RF): openCalculationVersion should be moved to calculationVersionService 
    	that.openCalculationVersion(oBodyData, aParameters, oServiceOutput, oPersistency, iCalcVersionId, true);
    }
    
    function close(){
        _.each(oBodyData, (oCalculationVersion) => {
            var iCalculationVersionId = oCalculationVersion.CALCULATION_VERSION_ID;
            try {
                oPersistency.CalculationVersion.close(iCalculationVersionId, sSessionId);						
            } catch (e) {
                // Only log the exception. For now it was decided to return nothing to the client because
                // close is used to drop anything and errors because of wrong parameters don't matter.
                $.trace.warning(`An error occured when closing ${iCalculationVersionId}`);
            }
        });
    }
    
    /**
     * Handle the create request sent via HTTP post for one calculation version. 
     * Adds created version to the Service Output Object if creation was successful.
     */
    function create(){
        var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
        
        _.each(oBodyData, (oCalculationVersion) => {
            var iCalculationId = oCalculationVersion.CALCULATION_ID;
            var iCalculationVersionId = oCalculationVersion.CALCULATION_VERSION_ID;
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addCalculationVersionObjs({
            	id: iCalculationVersionId
            });
            
            // Check if calculation exists.
            CalculationVersionService.checkIfCalculationExists(oPersistency, iCalculationId);
            // Check if the calculation has saved versions.
            if(!oPersistency.CalculationVersion.checkSavedVersion(iCalculationId)){ 
                const sClientMsg = "First calculation version of calculation not saved.";
                const sServerMsg = `${sClientMsg} Calculation Id: ${iCalculationId}.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.FIRST_CALCULATIONVERSION_NOT_SAVED, sClientMsg);                
            }

            function setDefaultValues(oCalculationVersion, sUserId) {
                // Get calculation data in order to get the project ID. 
                var oCalculation = oPersistency.Calculation.getCurrentCalculationData(oCalculationVersion.CALCULATION_ID);
                // Get default values of the project.
                var oDefaultSettings = oPersistency.Project.getProjectProperties(oCalculation.PROJECT_ID);
                if (helpers.isNullOrUndefined(oDefaultSettings)) {   
                    const sClientMsg = "Default settings for calculation not found in project.";
                    const sServerMsg = `${sClientMsg} Calculation id: ${oCalculationVersion.CALCULATION_ID}, project id: ${oCalculation.PROJECT_ID}.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);                    
                } else {
                    if (helpers.isNullOrUndefined(oCalculationVersion.CALCULATION_VERSION_NAME)){
                        oCalculationVersion.CALCULATION_VERSION_NAME = "Version 1";
                    }
                    // Set the default values from the project.
                    helpers.setDefaultValuesForCalculationVersion(oCalculationVersion, oDefaultSettings);
                    if(helpers.isNullOrUndefined(oCalculationVersion.EXCHANGE_RATE_TYPE_ID)){
                    	// set EXCHANGE_RATE_TYPE_ID to "STANDARD", the default value
                    	oCalculationVersion.EXCHANGE_RATE_TYPE_ID = sDefaultExchangeRateType;
                    }
                }
            }

            var aResponseContent = [];
            // Process each calculation version sent in the body.
            _.each([ oCalculationVersion ], function(oCvToCreate) {
                // Set default values for calculation version.
                setDefaultValues(oCvToCreate, sUserId);
                //set default values for root item
                items.setDefaultValueForIsManualField([oCvToCreate.ITEMS[0]], oPersistency);
                // Create calculation version.
                var oResult = oPersistency.CalculationVersion.create(oCvToCreate, sSessionId, sUserId);
                if (_.isNull(oResult)) {
                    oServiceOutput.setStatus($.net.http.CONFLICT);
                } else {
                    // After calculation is created new component split and costing sheet information have to be delivered since the master data time stamp is newer.
                    var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(oCvToCreate.CALCULATION_VERSION_ID, mSessionDetails.language, sSessionId);
                    oServiceOutput.addMasterdata(mCalculationMasterdata);

                    oResult[MetaInformation.IsDirty] = oResult.ITEMS[0].IS_DIRTY;


                    aResponseContent.push(oResult);

                }
            });

            if (aResponseContent.length > 0 && oServiceOutput.status !== $.net.http.CONFLICT) {
                oServiceOutput.setTransactionalData(aResponseContent).setStatus($.net.http.CREATED);
            }
        });
	}
    
    /**
     * Handle the copy request sent via HTTP post for one calculation version. 
     * Adds copied version to the Service Output Object if copying was successful.
     *
     */
    function copy(){
        var iCalculationVersionId = parseInt(aParameters.id, 10);
        var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
        
        var oMessageDetails = new MessageDetails().addCalculationVersionObjs({
            id : iCalculationVersionId
        });
        // Check if calculation version exists (also in temporary table).
        CalculationVersionService.checkIfVersionExists(oPersistency, sSessionId, iCalculationVersionId, oMessageDetails);
        // Copy calculation version.
        const bCompressedResult = aParameters.compressedResult ? aParameters.compressedResult : false;
        const oCopy = oPersistency.CalculationVersion.copy(iCalculationVersionId, sSessionId, sUserId, mSessionDetails.language, bCompressedResult);
        var oCalculationVersion = oCopy.calculation_version;
        if(bOmitItems === false){
            if(bCompressedResult){
                oCalculationVersion.ITEMS_COMPRESSED = oCopy.itemsCompressed;
            }
            else{
                oCalculationVersion.ITEMS = oCopy.items;
            }
        }else{
            oCalculationVersion.ITEMS = [];
        }
        // Get masterdata for newly copied calculation version.
        var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(oCalculationVersion.CALCULATION_VERSION_ID, mSessionDetails.language, sSessionId);
        oServiceOutput.addMasterdata(mCalculationMasterdata);
        oServiceOutput.setReferencesData(oCopy.referencesdata);

        if(bCompressedResult){
            oCalculationVersion[MetaInformation.IsDirty] = oCopy.itemsCompressed.IS_DIRTY[0];
        }
        else{
        	oCalculationVersion[MetaInformation.IsDirty] = oCopy.items[0].IS_DIRTY;
        }

        var aResponseContent = [];
        aResponseContent.push(oCalculationVersion);
        if (aResponseContent.length > 0 && oServiceOutput.status !== $.net.http.CONFLICT) {
            oServiceOutput.setTransactionalData(aResponseContent).setStatus($.net.http.CREATED);
        }
    }
    
    /**
     * Handle the freeze request sent via HTTP post for one calculation version. 
     * Adds IS_FROZEN and "NOT WRITEABLE" message to the Service Output if flag was set successful.
     *
     */
    function freeze(){
        var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
        _.each(oBodyData, (oCalculationVersion) => {
            var iCalcVersionId = oCalculationVersion.CALCULATION_VERSION_ID;
    		var oMessageDetails = new MessageDetails().addCalculationVersionObjs({
    			id : iCalcVersionId
    		});

    		// Check if the version is opened and locked.
    		CalculationVersionService.isOpenedAndLockedInSession(oPersistency, sSessionId, iCalcVersionId, oMessageDetails);

    		if (oPersistency.CalculationVersion.isDirty(iCalcVersionId, sSessionId, sUserId)) {
                const sClientMsg = "Cannot freeze calculation version because it contains unsaved changes.";
                const sServerMsg = `${sClientMsg} Calculation version id: ${iCalcVersionId}.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.CALCULATIONVERSION_NOT_SAVED_ERROR, sClientMsg, oMessageDetails);                
    		}

    		if (oPersistency.CalculationVersion.isFrozen(iCalcVersionId)) {
    			const sLogMessage = `Cannot freeze calculation version ${iCalcVersionId} because it is already frozen`;
    			$.trace.info(sLogMessage);
    			let message = new Message(Code.CALCULATIONVERSION_ALREADY_FROZEN_INFO, Severity.INFO, oMessageDetails);
    			oServiceOutput.addMessage(message);
    			return oServiceOutput;
    		}
    		
    		// Check if version is lifecycle version, since lifecycle version cannot be frozen
    		CalculationVersionService.checkIsLifecycleVersion(oPersistency, sSessionId, iCalcVersionId, true);
    		
    		// Get the ids of lifecycle versions assigned to the calculation version
    		let aLifecycleVersionsIds = oPersistency.CalculationVersion.getLifecycleVersionsIds(iCalcVersionId);

    		oPersistency.CalculationVersion.setFrozenFlags(iCalcVersionId, sSessionId, aLifecycleVersionsIds);

    		var message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.INFO, oMessageDetails);
    		oServiceOutput.addMessage(message);

    		var oReadCalculationVersionResult = oPersistency.CalculationVersion.open(iCalcVersionId, sSessionId, sUserId, mSessionDetails.language, true);
    		var oOutputObject = CalculationVersionService.prepareOutput(oReadCalculationVersionResult, bOmitItems);

    		oServiceOutput.setTransactionalData(oOutputObject);
        });
    }
    
    function save(){
        _.each(oBodyData, (oCalculationVersion) => {
            var oHandler = new CalculationVersionSaveHandler($, oCalculationVersion, CalculationVersionService, oPersistency, oServiceOutput, bOmitItems);
            oHandler.checkSave()
                    .prepareSave()
                    .execute();
        });
    }
    
    function saveAs(){
        _.each(oBodyData, (oCalculationVersion) => {
            var oHandler = new CalculationVersionSaveHandler($, oCalculationVersion, CalculationVersionService, oPersistency, oServiceOutput, bOmitItems);
            oHandler.checkSaveAs()
                    .prepareSaveAs()
                    .execute();
        });
    }
}

/**
 * Handles a HTTP DELETE requests to delete the calculation versions and their associated items. Only closed and non-frozen calculation versions
 * can be deleted. If the calculation version is open, then an error message with ids of users that opened the calculation are sent back. If
 * calculation version is a single calculation version, then it can not be deleted and the method responses with the error message. The
 * expected input is an array with JavaScript objects with calculation version ids, e.g. [{ "CALCULATION_VERSION_ID":1}, {
 * "CALCULATION_VERSION_ID":4}...] The returned object is: 
 * 		a) if the calculation versions have been deleted, then their ids are given back as metadata 
 * 		b) if the calculation versions can not be deleted, then the array of messages with problematic calculation versions is given back.
 */

this.remove = function(oBodyData, aParameters, oServiceOutput, oPersistency) {

	var oMessageDetails = new MessageDetails();

	// Process each calculation version sent in the body.
	_.each(oBodyData, function(oCalculationVersion) {
		var iCalculationVersionId = helpers.toPositiveInteger(oCalculationVersion.CALCULATION_VERSION_ID);
		
		// Check if calculation version exists.
		CalculationVersionService.checkIfVersionExists(oPersistency, sSessionId, iCalculationVersionId, oMessageDetails);
				
		// Check if any calculation version has been opened and get the list of ids of users that have opened.
		// A calculation versions cannot be deleted when it is being edited by other users.
		var aDbOpeningUsers = oPersistency.CalculationVersion.getOpeningUsers(iCalculationVersionId);
		if (aDbOpeningUsers.length > 0) {
			let aOpeningUserDetails = _.map(aDbOpeningUsers, function(oDbOpeneningUser) {
				return {
					id : oDbOpeneningUser.USER_ID
				};
			});
			let oCvStillOpenDetails = new MessageDetails().addCalculationVersionObjs({
				id : iCalculationVersionId,
				openingUsers : aOpeningUserDetails
			});	
            const sClientMsg = "Calculation version cannot be deleted. Still opened by other user(s).";
            const sServerMsg = `${sClientMsg} Calculation version id: '${iCalculationVersionId}', user(s): ${JSON.stringify(oCvStillOpenDetails)}.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_IS_STILL_OPENED_ERROR, sClientMsg, oCvStillOpenDetails);            
		}

		// Check if the calculation version is the only version under calculation. The calculation should always have at least one calculation version.
		if (oPersistency.CalculationVersion.isSingle(iCalculationVersionId)) {
	        const oCvIsSingleDetails = new MessageDetails().addCalculationVersionObjs({
	                id : iCalculationVersionId
	            });
            const sClientMsg = "Calculation version cannot be deleted. The calculation should always have at least one calculation version.";
            const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_IS_SINGLE_ERROR, sClientMsg, oCvIsSingleDetails);
		}
		
		// Check if calculation version is the current one in calculation.
		if (oPersistency.Calculation.isCurrentVersion(iCalculationVersionId)) {
			let oCvIsCurrentDetails = new MessageDetails().addCalculationVersionObjs({
				id : iCalculationVersionId
			});	
            const sClientMsg = "Calculation version cannot be deleted, because it is the current one for the calculation";
            const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.DELETE_CURRENT_VERSION_ERROR, sClientMsg, oCvIsCurrentDetails);            
		} 

		// Check frozen status, since frozen version cannot be deleted.
		CalculationVersionService.checkIsVersionFrozen(oPersistency, iCalculationVersionId);
				
		// Check if version is lifecycle version, since lifecycle version cannot be deleted
		CalculationVersionService.checkIsLifecycleVersion(oPersistency, sSessionId, iCalculationVersionId);
		
		// Check if any lifecycle of this version is opened
		var aOpenLifecycleVersions = oPersistency.CalculationVersion.getOpenLifecycleVersionsForBaseVersion(iCalculationVersionId);
		if (aOpenLifecycleVersions.length > 0) {
			let oOpenLifecycleVersionDetails = new MessageDetails();
			CalculationVersionService.addVersionStillOpenMessageDetails(oOpenLifecycleVersionDetails, aOpenLifecycleVersions);
			
            const sClientMsg = "Calculation version cannot be deleted. It has opened lifecycle calculation version(s).";
            const sServerMsg = `${sClientMsg} Calculation version id: '${iCalculationVersionId}, opened lifecycle calculation version(s): ${JSON.stringify(oOpenLifecycleVersionDetails)}.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR, sClientMsg, oOpenLifecycleVersionDetails);            
		}
		
		// Check if any lifecycle version of the base versions is referenced in any other lifecycle version
		CalculationVersionService.checkLifecycleVersionsOfBaseVersionReferenced(oPersistency, iCalculationVersionId);
		
		// Check if lifecycle calculation is running for the base version
		CalculationVersionService.checkIsLifecycleCalculationRunningForBaseVersion(oPersistency, sSessionId, iCalculationVersionId);
		
		/////////////////////////////////////////////////////////
		// Remove calculation version.
		/////////////////////////////////////////////////////////
		var affectedRows = oPersistency.CalculationVersion.remove(iCalculationVersionId, sUserId);
		if (affectedRows < 1) {
		// No rows have been deleted, make an error message.
			let oCvNotFoundDetails = new MessageDetails().addCalculationVersionObjs({
				id : iCalculationVersionId
			});
            const sClientMsg = "Calculation version cannot be deleted. No db rows have been deleted.";
            const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR, sClientMsg, oCvNotFoundDetails);            
		}
		
		// Check if the version is a referenced/source version and get the list of version where it is referenced.
		// The version cannot be deleted if is a referenced version.
		// When an item of type referenced version is created a row lock for writing is set for the version.
		// In order to not lock the calculation version table, the check is done last.
		var aMasterVersions = oPersistency.CalculationVersion.getMasterVersions(iCalculationVersionId);
		if (aMasterVersions.length > 0) {
			let aMasterVersion = _.map(aMasterVersions, function(oMasterVersion) {
				return oMasterVersion.CALCULATION_VERSION_ID;
			});
			let oSourceVersionDetails = new MessageDetails().addCalculationVersionReferenceObjs({
				id : iCalculationVersionId,
				masterVersionsDetails: aMasterVersion
			});
	
            const sClientMsg = "Calculation version cannot be deleted. It is referenced in other calculation version(s).";
            const sServerMsg = `${sClientMsg} Calculation version id: ${iCalculationVersionId}, referenced in calculation version(s): ${JSON.stringify(oSourceVersionDetails)}.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR, sClientMsg, oSourceVersionDetails);            
		}
	});
}

/**
 * Handles a HTTP PATCH requests for a single calculation version 
 * towards resource /calculation-versions/{calculation-version-id} 
 * 
 * Implementation allows to lock a calculation version for write requests
 * without actively opening a calculation version through service GET calculation-version
 * this is required to lock a calculation version for any changes while 
 * being opened as a base version within a variant matrix in parallel
 * 
 * @param {object} oBodyData Data contained in the request body.
 * @param {map} mParameters Key-Value pairs for parameters of the request.
 * @param {object} oServiceOutput Object the result of the function is written to. 
 * @param {object} oPersistency Instance of persistency object to access database tables.
 */
this.patchSingle = function(oBodyData, mParameters, oServiceOutput, oPersistency) {
	const iCvId = mParameters.calculation_version_id;
	
	if (!oPersistency.CalculationVersion.exists(iCvId)) {
		const sClientMsg = "Calculation version does not exist.";
		const sServerMsg = `${sClientMsg}. Id of the calculation version: ${iCvId}`;
		$.trace.info(sServerMsg);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
	}

	if(oBodyData.LOCK.IS_WRITEABLE == 1) {
		// Request to lock a calculation version
		if(handleVersionLock(oServiceOutput, oPersistency, iCvId, oBodyData.LOCK.CONTEXT) === 1){
			if(oBodyData.LOCK.CONTEXT === constants.CalculationVersionLockContext.VARIANT_MATRIX){
				oPersistency.Variant.copyToTemporaryTables(iCvId);
			}
			oServiceOutput.setStatus($.net.http.OK);
			return oServiceOutput;
		}
	} else {
		// Request to unlock a calculation version
		if(oPersistency.CalculationVersion.unlockVersion(iCvId, sSessionId, oBodyData.LOCK.CONTEXT) === 1) {
			oServiceOutput.setStatus($.net.http.OK);
			return oServiceOutput;
		}
	}

	/*	According to IETF recommendation: Unprocessable request - 
	*	Can be specified with a 422 (Unprocessable
	*	Entity) response ([RFC4918], Section 11.2) when the server
	*	understands the patch document and the syntax of the patch
	*	document appears to be valid, but the server is incapable of
	*	processing the request. 
	*	BUT: $.net.http does not support "UNPROCESSABLE_ENTITY" according
	* 	to https://help.sap.com/doc/3de842783af24336b6305a3c0223a369/2.0.02/en-US/$.net.html
	* 	=> fallback solution for XS Classic: 417 (expectation failed)
	*/
	oServiceOutput.setStatus($.net.http.EXPECTATION_FAILED);
	
	return oServiceOutput;
}


/**
 * Handles the lock of a calculation version. The implementation sets read- or write-access
 * to a calculation version according to the context within the version is being locked 
 * (e.g. use in calculation view or variant matrix)
 * A calculation version can be
 * 		- read-only, because it is referenced by another calculation version 
 * 		- read-only, because it is a lifecyle version
 * 		- read-only, because it has been frozen
 * 		- read-only, because lock-requesting user misses privileges
 * 		- read-only, because another user has locked already it
 * 		- read-only, because lock-requesting user has locked it in another context
 * 		- writeable, if it is not opened at all
 * 		- writeable, if it is already opened in the same locking context by the same user
 * 
 * @param {object} oServiceOutput Object the result of the function is written to. 
 * @param {object} oPersistency Instance of persistency object to access database tables.
 * @param {integer} iCvId Calculation Version ID to lock
 * @param {string} sLockContext Context for requesting the write access (either calculation version or variant matrix)
 * @return {integer} iIsWritable States if calculation version is writeable (1) or not (0)
 */
function handleVersionLock(oServiceOutput, oPersistency, iCvId, sLockContext = constants.CalculationVersionLockContext.CALCULATION_VERSION) {

	let iIsWritable = 0;

	var oMessageDetails = new MessageDetails().addCalculationVersionObjs({
		id : iCvId
	});

	// Returns the locking details such as user and his privileges, read-/write-lock mode,
	// if a calculation version is a referenced version, a life-cycle version, and is version is frozen
	var oLock = oPersistency.CalculationVersion.setVersionLock(iCvId, sSessionId, sUserId, sLockContext);
	
	if (oLock.IsReference === true && oLock.LockingContext !== constants.CalculationVersionLockContext.VARIANT_MATRIX) {
		// Referenced calculation versions are not editable per definition
		// but it is allowed for them to have variant matrix
		const sServerMsg = `Calculation version ${iCvId} is source version.`;
		$.trace.info(sServerMsg);
		oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_SOURCE);
		let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.INFO, oMessageDetails);
		oServiceOutput.addMessage(message);
	} else if(oLock.IsFrozen) {
		// Frozen calculation versions are not editable per definition
		const sServerMsg = `Calculation version ${iCvId} is frozen.`;
		$.trace.info(sServerMsg);
		oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_FROZEN);
		let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.WARNING, oMessageDetails);
		oServiceOutput.addMessage(message);
	} else if (oLock.IsNotPrivileged) {
		// Version is not writable because the user has only READ instance-based privilege
		const sServerMsg = `Calculation version ${iCvId} can be displayed but not edited, because you do not have sufficient privileges to perform the operation.`;
		$.trace.info(sServerMsg);
		oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.NOT_AUTHORIZED_TO_EDIT);
		let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.WARNING, oMessageDetails);
		oServiceOutput.addMessage(message);
	} else if (sUserId !== oLock.LockingUser) {
		// Another user (than the one who requests the lock) is locking the calculation version
		const sServerMsg = `Calculation version ${iCvId} is locked by user ${oLock.LockingUser}.`;
		$.trace.info(sServerMsg);

		oMessageDetails.addUserObj({
			id : oLock.LockingUser
		});
		oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_BY_ANOTHER_USER);
		let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.WARNING, oMessageDetails);
		oServiceOutput.addMessage(message);
	} else if (sUserId === 	oLock.LockingUser &&
							sLockContext === constants.CalculationVersionLockContext.CALCULATION_VERSION &&
							oLock.LockingContext === constants.CalculationVersionLockContext.VARIANT_MATRIX &&
							oLock.LockMode == "write") {
		// Lock requesting already has a lock on the calculation version, but is still not allowed
		// to modify => lock exists in different context than the requested lock contest
		// e.g. calculation version is locked as base version while editing variant matrix and
		// therefore cannot be opened with write-access in calculation view		
		const sServerMsg = `Calculation version ${iCvId} is locked by user himself in different application context (${oLock.LockingContext})`;
		$.trace.info(sServerMsg);
		oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_IN_ANOTHER_CONTEXT);
		let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.WARNING, oMessageDetails);
		oServiceOutput.addMessage(message);
	} else if (sUserId === oLock.LockingUser && oLock.LockMode == "write") {
		// Version is writable, because it is opened and locked by same user and the user has at least CREATE_EDIT instance-based privilege.
		iIsWritable = 1;
	}

	return iIsWritable;
}

}; // end of module.exports.CalculationVersions