const _ = $.require("lodash");
const helpers = $.require("../util/helpers");
const BusinessObjectTypes 	= $.require("../util/constants").BusinessObjectTypes;
const ServiceMetaInformation  = $.require("../util/constants").ServiceMetaInformation;
const Resources = $.require("../util/masterdataResources").MasterdataResource;
const BusinessObjectsEntities = $.require("../util/masterdataResources").BusinessObjectsEntities;

const MessageLibrary = $.require("../util/message");
const MessageDetails = MessageLibrary.Details;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

// for lazy import of xsjslibs
var imps = {
    get Misc() {
        return $.require("./persistency-misc").Misc;
    },
    get AccountGroup() {
        return $.import("xs.db.administration", "api-accountGroup").AccountGroup;
    },
    get ComponentSplit() {
        return $.import("xs.db.administration", "api-componentSplit").ComponentSplit;
    },
    get CostingSheet() {
        return $.import("xs.db.administration", "api-costingSheet").CostingSheet;
    },
    get CostingSheetRow() {
        return $.import("xs.db.administration", "api-costingSheetRow").CostingSheetRow;
    },
    get ExchangeRateTypeImport() {
        return $.import("xs.db.administration", "api-exchangeRateType");
    },
    get ExchangeRateType() {
        return this.ExchangeRateTypeImport.ExchangeRateType;
    },
    get MasterDataObjectHandlerProxy() {
        return $.import("xs.db.administration.proxy", "masterDataProxy").MasterDataObjectHandlerProxy;
    }
};

const Procedures = Object.freeze({
	calculation_configuration_masterdata_read : 'sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read',
	check_formulas_costing_sheet_overhead_row : 'sap.plc.db.administration.procedures::p_check_formulas_costing_sheet_overhead_row'
});

const TempTables = Object.freeze({
	t_item_ids : 'sap.plc.db::temp.t_item_ids'
});

var sUserId;
const sSessionId = sUserId = $.getPlcUsername();


function Administration(dbConnection, hQuery, hQueryRepl) {

	this.misc = new imps.Misc($, hQuery, sUserId, dbConnection);
	var that = this;
	

	/**
	 * Get data
	 *
	 * @param   {object} oGetParameters - object with parameters (determined from URL)
	 * @param   {string} sLanguage      - language (taken from Session)
	 * @returns {object} oReturnObject  - object containing the main entities, referenced entities and texts
	 */
	this.getAdministration = function(oGetParameters, sLanguage, sMasterDataDate) {
		var vLock = oGetParameters.lock;
		var parentScope = this;
		var oReturnObjects;
		
		/**
		 * Gets lock information of business object and sets the lock status. 
		 */
		function setLockStatus(sBusinessObjectType){
			var oLockStatus = {};
			if (vLock === true || vLock === "true") {
				var aLockObjects = parentScope.getLock(sBusinessObjectType);
				if(aLockObjects.length > 0) {
					oLockStatus[ServiceMetaInformation.UserId] = aLockObjects[0][ServiceMetaInformation.UserId];
					oLockStatus[ServiceMetaInformation.IsLocked] = 1;
				} else {
					parentScope.setLock([sBusinessObjectType]);
					oLockStatus[ServiceMetaInformation.IsLocked] = 0;	
				}
			}
			if( helpers.isNullOrUndefined( oReturnObjects[ServiceMetaInformation.LockStatus] ) ) {
				if( _.isEmpty(oLockStatus) === false){
					oReturnObjects[ServiceMetaInformation.LockStatus] = oLockStatus;
				}
			}
		}

		switch (oGetParameters.business_object) {
		case BusinessObjectTypes.ExchangeRateType:
			return new imps.ExchangeRateType(dbConnection, hQuery, hQueryRepl, imps.ExchangeRateTypeImport.oConfiguration).get(oGetParameters, sLanguage, sMasterDataDate);
		case BusinessObjectTypes.AccountGroup:
			oReturnObjects = new imps.AccountGroup(dbConnection, hQuery, hQueryRepl).get(oGetParameters, sLanguage, sMasterDataDate);
			setLockStatus(oGetParameters.business_object);
			return oReturnObjects;
		case BusinessObjectTypes.ComponentSplit:
			oReturnObjects = new imps.ComponentSplit(dbConnection, hQuery, hQueryRepl).get(oGetParameters, sLanguage, sMasterDataDate);
			setLockStatus(oGetParameters.business_object);
			return oReturnObjects;
		case BusinessObjectTypes.CostingSheet:
			oReturnObjects = new imps.CostingSheet(dbConnection, hQuery, hQueryRepl).get(oGetParameters, sLanguage, sMasterDataDate);
			setLockStatus(oGetParameters.business_object);
			return oReturnObjects;
		case BusinessObjectTypes.CostingSheetRow:
			oReturnObjects = new imps.CostingSheetRow(dbConnection, hQuery, hQueryRepl).get(oGetParameters, sLanguage, sMasterDataDate);
			setLockStatus(BusinessObjectTypes.CostingSheet);
			setLockStatus(BusinessObjectTypes.CostingSheetRow);
			return oReturnObjects;
		default:
			return new imps.MasterDataObjectHandlerProxy(dbConnection, hQuery, oGetParameters.business_object).get(oGetParameters, sLanguage, sMasterDataDate);
		}

	};

	/**
	 * Delete data
	 *
	 * @param   {string} sObjectName  - business object name
	 * @param   {objects} oBatchItems - object containing different arrays of entities
	 * @returns {object}  oResult     - deleted entries / errors
	 */
	//I055799 - If Costing Sheet, Component Split, Account Group, Price Source will be refactored, the method can be removed
	this.deleteAdministration = function(sObjectName, oBatchItems, sMasterDataDate) {

		switch (sObjectName) {
			case BusinessObjectTypes.AccountGroup:
				if(this.getLock(BusinessObjectTypes.AccountGroup).length > 0) {
					this.throwLockedError(BusinessObjectTypes.AccountGroup);
				} else {
					this.setLock([BusinessObjectTypes.AccountGroup]);
					return new imps.AccountGroup(dbConnection, hQuery, hQueryRepl).remove(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
			case BusinessObjectTypes.ComponentSplit:
				if(this.getLock(BusinessObjectTypes.ComponentSplit).length > 0) {
					this.throwLockedError(BusinessObjectTypes.ComponentSplit);
				} else {
					this.setLock([BusinessObjectTypes.ComponentSplit]);
					return new imps.ComponentSplit(dbConnection, hQuery, hQueryRepl).remove(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
			case BusinessObjectTypes.CostingSheet:
				if(this.getLock(BusinessObjectTypes.CostingSheet).length > 0) {
					this.throwLockedError(BusinessObjectTypes.CostingSheet);
				} else {
					this.setLock([BusinessObjectTypes.CostingSheet, BusinessObjectTypes.CostingSheetRow]);
					return new imps.CostingSheet(dbConnection, hQuery, hQueryRepl).remove(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
			case BusinessObjectTypes.CostingSheetRow:
				if(this.getLock([BusinessObjectTypes.CostingSheet, BusinessObjectTypes.CostingSheetRow]).length > 0) {
					this.throwLockedError(BusinessObjectTypes.CostingSheetRow);
				} else {
					this.setLock([BusinessObjectTypes.CostingSheet, BusinessObjectTypes.CostingSheetRow]);
					return new imps.CostingSheetRow(dbConnection, hQuery, hQueryRepl).remove(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
	    	case BusinessObjectTypes.ExchangeRateType:
	        	return new imps.ExchangeRateType(dbConnection, hQuery, hQueryRepl, imps.ExchangeRateTypeImport.oConfiguration).remove(oBatchItems, sMasterDataDate);
			default: {
				const sLogMessage = `Business Object not maintained.`;
				const oMessageDetails = new MessageDetails();
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
			}
		}
	};

	/**
	 * Insert data
	 *
	 * @param   {string} sObjectName  - business object name
	 * @param   {objects} oBatchItems - object containing different arrays of entities
	 * @returns {object}  oResult     - inserted entries / errors
	 */
	//I055799 - If Costing Sheet, Component Split, Account Group, Price Source will be refactored, the method can be removed
	this.insertAdministration = function(sObjectName, oBatchItems, sMasterDataDate) {

		switch (sObjectName) {
			case BusinessObjectTypes.AccountGroup:
				if(this.getLock(BusinessObjectTypes.AccountGroup).length > 0) {
					this.throwLockedError(BusinessObjectTypes.AccountGroup);
				} else {
					this.setLock([BusinessObjectTypes.AccountGroup]);
					return new imps.AccountGroup(dbConnection, hQuery, hQueryRepl).insert(oBatchItems, sMasterDataDate);
				}			
				break; // to avoid eslint warning
			case BusinessObjectTypes.ComponentSplit:
				if(this.getLock(BusinessObjectTypes.ComponentSplit).length > 0) {
					this.throwLockedError(BusinessObjectTypes.ComponentSplit);
				} else {
					this.setLock([BusinessObjectTypes.ComponentSplit]);
					return new imps.ComponentSplit(dbConnection, hQuery, hQueryRepl).insert(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
			case BusinessObjectTypes.CostingSheet:
				if(this.getLock(BusinessObjectTypes.CostingSheet).length > 0) {
					this.throwLockedError(BusinessObjectTypes.CostingSheet);
				} else {
					this.setLock([BusinessObjectTypes.CostingSheet, BusinessObjectTypes.CostingSheetRow]);
					return new imps.CostingSheet(dbConnection, hQuery, hQueryRepl).insert(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
			case BusinessObjectTypes.CostingSheetRow:
				if(this.getLock(BusinessObjectTypes.CostingSheetRow).length > 0) {
					this.throwLockedError(BusinessObjectTypes.CostingSheetRow);
				} else {
					this.setLock([BusinessObjectTypes.CostingSheet, BusinessObjectTypes.CostingSheetRow]);
					return new imps.CostingSheetRow(dbConnection, hQuery, hQueryRepl).insert(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
	    	case BusinessObjectTypes.ExchangeRateType:
	        	return new imps.ExchangeRateType(dbConnection, hQuery, hQueryRepl, imps.ExchangeRateTypeImport.oConfiguration).insert(oBatchItems, sMasterDataDate);
			default: {
				const sLogMessage = `Business Object '${sObjectName}' not maintained.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

	};

	/**
	 * Update data
	 *
	 * @param   {string} sObjectName  - business object name
	 * @param   {objects} oBatchItems - object containing different arrays of entities
	 * @returns {object}  oResult     - updated entries / errors
	 */
	//I055799 - If Costing Sheet, Component Split, Account Group, Price Source will be refactored, the method can be removed
	this.updateAdministration = function(sObjectName, oBatchItems, sMasterDataDate) {

		switch (sObjectName) {
			case BusinessObjectTypes.AccountGroup:
				if(this.getLock(sObjectName).length > 0) {
					this.throwLockedError(sObjectName);
				} else {
					this.setLock([BusinessObjectTypes.AccountGroup]);
					return new imps.AccountGroup(dbConnection, hQuery, hQueryRepl).update(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
			case BusinessObjectTypes.ComponentSplit:
				if(this.getLock(sObjectName).length > 0) {
					this.throwLockedError(sObjectName);
				} else {
				    this.setLock([BusinessObjectTypes.ComponentSplit]);
					return new imps.ComponentSplit(dbConnection, hQuery, hQueryRepl).update(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
			case BusinessObjectTypes.CostingSheet:
				if(this.getLock(sObjectName).length > 0) {
					this.throwLockedError(sObjectName);
				} else {
					this.setLock([BusinessObjectTypes.CostingSheet, BusinessObjectTypes.CostingSheetRow]);
					return new imps.CostingSheet(dbConnection, hQuery, hQueryRepl).update(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
			case BusinessObjectTypes.CostingSheetRow:
				if(this.getLock(sObjectName).length > 0) {
					this.throwLockedError(sObjectName);
				} else {
					this.setLock([BusinessObjectTypes.CostingSheet, BusinessObjectTypes.CostingSheetRow]);
					return new imps.CostingSheetRow(dbConnection, hQuery, hQueryRepl).update(oBatchItems, sMasterDataDate);
				}
				break; // to avoid eslint warning
		    case BusinessObjectTypes.ExchangeRateType:
	    	    return new imps.ExchangeRateType(dbConnection, hQuery, hQueryRepl, imps.ExchangeRateTypeImport.oConfiguration).update(oBatchItems, sMasterDataDate);
			default: {
                const sLogMessage = `Business Object '${sObjectName}' not maintained.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

	};
	
	/**
	 * Process batch data data
	 *
	 * @param   {string} sObjectName  - business object name
	 * @param   {objects} oBatchItems - object containing different arrays of entities
	 * @returns {object}  oResult     - updated entries / errors
	 */
	this.batchAdministration = function(oMasterDataProxy) {
		return oMasterDataProxy.processBatch();
	};
	
	/**
	 * Get masterdata for a calculation version
	 * 
	 * @param   {integer} iCvId  - calculation version id
	 * @param   {string} sLanguage  - language id
	 * @param   {string} sSessionId  - session id
	 * @param	{array} aBusinessObjectsEntities - array which contains the business object required, if it's empty or undefined all entities will be retrieved
	*/
	this.getMasterdataForCalculationVersion = function(iCvId, sLanguage, sSessionId, aBusinessObjectsEntities) {

		try {
			var procedure = dbConnection.loadProcedure(Procedures.calculation_configuration_masterdata_read);
			var oProcResult = procedure(sLanguage, iCvId, sSessionId);
			var mMasterdataContainer = this.fillResultContainer(oProcResult);
			if(aBusinessObjectsEntities){
				Object.keys(mMasterdataContainer).forEach(key => {
					if(!aBusinessObjectsEntities.includes(key)){
						delete mMasterdataContainer[key];
					}
				});
			}
			return mMasterdataContainer;
		} catch (e) {
			const sClientMsg = `Unable to load masterdata for calculation version with language ${sLanguage}.`;
			const sServerMsg = `${sClientMsg} Calculation version id: ${iCvId}, Error: ${e.message || e.msg}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, null, null, e);
		}
	};
	
	/**
	 * Get masterdata for an array of items
	 * 
	 * @param   {integer} iCvId  - calculation version id
	 * @param   {string} sLanguage  - language id
	 * @param   {string} sSessionId  - session id
	 * @param   {array} aItems  - array with the items for which masterdata should be returned
	*/
	this.getMasterdataOnItemLevel = function(iCvId, sLanguage, sSessionId, aItems) {

		try {
			var procedure = dbConnection.loadProcedure(Procedures.calculation_configuration_masterdata_read);
			
			//fill temporary table with items ids: "sap.plc.db::temp.t_item_ids"
			var aStmtBuilderDelete = [ 'DELETE FROM "' + TempTables.t_item_ids + '" ' ];
			var deleteStmt = hQuery.statement(aStmtBuilderDelete.join(""));
			var iAffectedRowsDelete = deleteStmt.execute();
			if(aItems.length > 0){

				var aStmtBuilder = [ 'insert into  "' + TempTables.t_item_ids + '" (ITEM_ID) ' ];
				aStmtBuilder.push(" VALUES( ? ) ");
	
				// in order to enable batch insert of items, the values of aItems must be converted in an array of arrays
				var aInsertValues = [];
				_.each(aItems, function (oItem, iIndex) {
					var aItemValues = [oItem.ITEM_ID];
					aInsertValues.push(aItemValues);
				});
	
				var sStmt = aStmtBuilder.join(" ");
				dbConnection.executeUpdate(sStmt, aInsertValues);			
			}
			
			var oProcResult = procedure(sLanguage, iCvId, sSessionId);
			var mMasterdataContainer = this.fillResultContainer(oProcResult);
			return mMasterdataContainer;
			
		} catch (e) {
	         const sClientMsg = `Unable to load masterdata on item level for calculation version with language ${sLanguage}.`;
             const sServerMsg = `${sClientMsg} Calculation version id: ${iCvId}, Error: ${e.message || e.msg}`;
             $.trace.error(sServerMsg);
	         throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, null, null, e);
		}
	};

	/**
	 * 
	 * @param sObjectName - valid only for 'CostingSheet'
	 * @param oBatchItemsInsert - array with items related to costing sheet entities that should be inserted
	 * @param oBatchItemsUpdate - array with items related to costing sheet entities that should be updated
	 * @param sMasterDataDate 
	 */
	this.checkIfTotalFieldsAreValidForCostingSheetRows = function(sObjectName, oBatchItemsInsert, oBatchItemsUpdate, sMasterDataDate){
		
		if(sObjectName !== BusinessObjectTypes.CostingSheet){
			const sLogMessage = 'Checkin costing sheet rows is valid only for business object CostingSheet';
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		
		return new imps.CostingSheetRow(dbConnection, hQuery, hQueryRepl).checkIfTotalFieldsAreValidForCostingSheetRows(oBatchItemsInsert,oBatchItemsUpdate, sMasterDataDate);
	}

			
	 /**
	 * get an array with information about locked object
	 * 
	 * @param   {string} sObjectName  - business object name
	*/
	this.getLock = function(sObjectName) {
		return that.misc.getLock(sObjectName, sUserId);
	};
	
	/**
	 * set lock on a object
	 * 
	 * @param   {string} sObjectName  - business object name
	*/
	this.setLock = function(aObjectNames) {
		that.misc.lockTableTLockExclusive();
		_.each(aObjectNames, function(sObjectName, iIndex) {
			that.misc.setLock(sObjectName, sUserId);
		});
	};
	
	/**
	 * Throw an error when an object is locked by another user
	 * 
	 * @param   {string} sObjectName  - business object name
	*/
	this.throwLockedError = function(sObjectName) {
		const sLogMessage = `Business Object ${sObjectName} is locked. Cannot be modified.`;
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
	};
	
	/**
	 * Fill masterdata container from the result
	 * 
	 * @param   {object} oReadResult  - result returned from procedure that reads masterdata
	*/
	this.fillResultContainer = function(oReadResult){
		
		var mMasterdataContainer = {};
		mMasterdataContainer[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES] = Array.slice(oReadResult.OT_COMPONENT_SPLIT);
		mMasterdataContainer[BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES] = Array.slice(oReadResult.OT_COMPONENT_SPLIT_ACCOUNT_GROUP);
		mMasterdataContainer[BusinessObjectsEntities.COSTING_SHEET_ENTITIES] = Array.slice(oReadResult.OT_COSTING_SHEET);
		mMasterdataContainer[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES] = Array.slice(oReadResult.OT_COSTING_SHEET_ROW);
		mMasterdataContainer[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES] = Array.slice(oReadResult.OT_COSTING_SHEET_BASE);
		mMasterdataContainer[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES] = Array.slice(oReadResult.OT_COSTING_SHEET_BASE_ROW);
		mMasterdataContainer[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES] = Array.slice(oReadResult.OT_COSTING_SHEET_OVERHEAD);
		mMasterdataContainer[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES] = Array.slice(oReadResult.OT_COSTING_SHEET_OVERHEAD_ROW);
		mMasterdataContainer[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES] = Array.slice(oReadResult.OT_COSTING_SHEET_ROW_DEPENDENCIES);
		mMasterdataContainer[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = Array.slice(oReadResult.OT_ACCOUNT_GROUPS);
		mMasterdataContainer[BusinessObjectsEntities.PRICE_COMPONENT_ENTITIES] = Array.slice(oReadResult.OT_PRICE_COMPONENTS);
		mMasterdataContainer[BusinessObjectsEntities.WORK_CENTER_ENTITIES] = Array.slice(oReadResult.OT_WORK_CENTER);
		mMasterdataContainer[BusinessObjectsEntities.PROCESS_ENTITIES] = Array.slice(oReadResult.OT_PROCESS);
		mMasterdataContainer[BusinessObjectsEntities.OVERHEAD_GROUP_ENTITIES] = Array.slice(oReadResult.OT_OVERHEAD_GROUP);
		mMasterdataContainer[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(oReadResult.OT_PLANT);
		mMasterdataContainer[BusinessObjectsEntities.COST_CENTER_ENTITIES] = Array.slice(oReadResult.OT_COST_CENTER);
		mMasterdataContainer[BusinessObjectsEntities.PROFIT_CENTER_ENTITIES] = Array.slice(oReadResult.OT_PROFIT_CENTER);
		mMasterdataContainer[BusinessObjectsEntities.ACTIVITY_TYPE_ENTITIES] = Array.slice(oReadResult.OT_ACTIVITY_TYPE);
		mMasterdataContainer[BusinessObjectsEntities.ACCOUNT_ENTITIES] = Array.slice(oReadResult.OT_ACCOUNTS);
		mMasterdataContainer[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(oReadResult.OT_COMPANY_CODE);
		mMasterdataContainer[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(oReadResult.OT_CONTROLLING_AREA);
		mMasterdataContainer[BusinessObjectsEntities.BUSINESS_AREA_ENTITIES] = Array.slice(oReadResult.OT_BUSINESS_AREA);
		mMasterdataContainer[BusinessObjectsEntities.PROCESS_ENTITIES] = Array.slice(oReadResult.OT_PROCESS);
		mMasterdataContainer[BusinessObjectsEntities.MATERIAL_ENTITIES] = Array.slice(oReadResult.OT_MATERIAL);
		mMasterdataContainer[BusinessObjectsEntities.MATERIAL_GROUP_ENTITIES] = Array.slice(oReadResult.OT_MATERIAL_GROUP);
		mMasterdataContainer[BusinessObjectsEntities.MATERIAL_PLANT_ENTITIES] = Array.slice(oReadResult.OT_MATERIAL_PLANT);
		mMasterdataContainer[BusinessObjectsEntities.MATERIAL_TYPE_ENTITIES] = Array.slice(oReadResult.OT_MATERIAL_TYPE);
		mMasterdataContainer[BusinessObjectsEntities.VALUATION_CLASS_ENTITIES] = Array.slice(oReadResult.OT_VALUATION_CLASS);
		mMasterdataContainer[BusinessObjectsEntities.VENDOR_ENTITIES] = Array.slice(oReadResult.OT_VENDOR);
		mMasterdataContainer[BusinessObjectsEntities.CUSTOMER_ENTITIES] = Array.slice(oReadResult.OT_CUSTOMER);
		mMasterdataContainer[BusinessObjectsEntities.DOCUMENT_ENTITIES] = Array.slice(oReadResult.OT_DOCUMENT);
		mMasterdataContainer[BusinessObjectsEntities.DOCUMENT_TYPE_ENTITIES] = Array.slice(oReadResult.OT_DOCUMENT_TYPE);
		mMasterdataContainer[BusinessObjectsEntities.DOCUMENT_STATUS_ENTITIES] = Array.slice(oReadResult.OT_DOCUMENT_STATUS);
		mMasterdataContainer[BusinessObjectsEntities.DESIGN_OFFICE_ENTITIES] = Array.slice(oReadResult.OT_DESIGN_OFFICE);
		mMasterdataContainer[BusinessObjectsEntities.UOM_ENTITIES] = Array.slice(oReadResult.OT_UOM);
		mMasterdataContainer[BusinessObjectsEntities.CURRENCY_ENTITIES] = Array.slice(oReadResult.OT_CURRENCY);
        mMasterdataContainer[BusinessObjectsEntities.EXCHANGE_RATE_TYPE_ENTITIES] = Array.from(oReadResult.OT_EXCHANGE_RATE_TYPE);
        
		return mMasterdataContainer;
		
	};
}

Administration.prototype = Object.create(Administration.prototype);
Administration.prototype.constructor = Administration;