var _ 						= $.require("lodash");
var helpers    				= $.require("../../util/helpers");
var Resources        		= $.require("../../util/masterdataResources").MasterdataResource;
var Limits           		= $.require("../../util/masterdataResources").Limits;
var Helper     				= $.require("../persistency-helper").Helper;
var Metadata   				= $.require("../persistency-metadata").Metadata;
var apiHelpers 		 		= $.import("xs.db.administration", "api-helper");
var UrlToSqlConverter 		= $.require("../../util/urlToSqlConverter").UrlToSqlConverter;

const MessageLibrary   		= $.require("../../util/message");
const MessageOperation 		= MessageLibrary.Operation;
const PlcException     		= MessageLibrary.PlcException;
const Code      		= MessageLibrary.Code;


function MasterdataBase(dbConnection, hQuery, hQueryRepl, oConfiguration) {

	this.helper = new Helper($, hQuery, dbConnection);
	this.metadata = new Metadata($, hQuery, null, $.getPlcUsername());
	this.aMetadataFields = this.metadata.getMetadataFields(oConfiguration.sObjectName, oConfiguration.sObjectName, null);
	this.converter = new UrlToSqlConverter();
	var that = this;

	/*************************************************************************************************************************
	 * Get
	 *************************************************************************************************************************/

	/**
	 * Get data (this method is called from persistency-administration.xsjslib)
	 *
	 * @param   {object} oGetParameters - object with parameters (determined from URL)
	 * @param   {string} sLanguage      - language (taken from Session)
	 * @returns {object} oReturnObject  - object containing the main entities, referenced entities and texts
	 */
	MasterdataBase.prototype.get = function(oGetParameters, sLanguage, sMasterDataDate) {

		var oReturnObject = {}; 
		var sTextFromAutocomplete = '';
		var iNoRecords = Limits.Top;
		var sSQLstring = '';
				
		if(!helpers.isNullOrUndefined(oGetParameters.searchAutocomplete)){
			sTextFromAutocomplete = oGetParameters.searchAutocomplete;
		}
		
 		if(!helpers.isNullOrUndefined(oGetParameters.filter)){
 			sSQLstring = this.converter.convertToSqlFormat(oGetParameters.filter, this.aMetadataFields);
 		}

		if(!helpers.isNullOrUndefined(oGetParameters.top)){
			iNoRecords = parseInt(oGetParameters.top);
		}
 		
 		if(!helpers.isNullOrUndefined(oGetParameters.masterdataTimestamp)){
 			sMasterDataDate = oGetParameters.masterdataTimestamp;
 		}
 		
		oReturnObject = this.getDataUsingSqlProcedure(oGetParameters, sLanguage, sMasterDataDate, sTextFromAutocomplete, iNoRecords, sSQLstring);

		return oReturnObject;

	};
	
	/**
	 * Get data using sql procedure
	 *
	 * @param   {object} oGetParameters        - object with parameters - used in case that other parameters are send beside the standard one
	 * @param   {string} sLanguage             - language 
	 * @param   {string} sMasterDataDate       - current data
	 * @param   {string} sTextFromAutocomplete - search text used for autocomplete
	 * @param   {string} iNoRecords            - number of records that should be selected
	 * @param   {string} sSQLstring            - sql string used for filtering
	 * @returns {object} oReturnObject         - object containing the main entities, referenced entities and texts
	 */
	MasterdataBase.prototype.getDataUsingSqlProcedure = function(oGetParameters, sLanguage, sMasterDataDate, sTextFromAutocomplete, iNoRecords, sSQLstring){
		return {};
	};
	
	/*************************************************************************************************************************
	 * Delete
	 *************************************************************************************************************************/
    
	/**
	 * Delete data (this method is called from persistency-administration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of masterdata objects
	 * @param   {string} sMasterDataDate       - current data
	 * @returns {object}  oResult     - deleted entries / errors
	 */
	MasterdataBase.prototype.remove = function(oBatchItems, sMasterDataDate){

		var oResult = {
				entities:{},
				hasErrors: false,
				errors:[]    	    
		};

		var aBatchMainItems = oBatchItems[oConfiguration.MainEntitiesSection];
		oResult.entities[oConfiguration.MainEntitiesSection] = [];
		_.each(aBatchMainItems, function(oRecord){ 
			try {
				that.checkMainRowRemove(oRecord,sMasterDataDate);
				var oResultDelete = that.removeMainRow(oRecord, sMasterDataDate);
				oResult.entities[oConfiguration.MainEntitiesSection].push(oResultDelete);
			} catch (e) {
				oResult.hasErrors = true;
				apiHelpers.createResponse(oRecord,oConfiguration.MainEntitiesSection, e, MessageOperation.DELETE, oResult);
			} 
		});

		if((!helpers.isNullOrUndefined(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable))&&
				(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable !== ""))
		{
			var aBatchTextItems = oBatchItems[oConfiguration.TextEntitiesSection];
			oResult.entities[oConfiguration.TextEntitiesSection] = [];
			_.each(aBatchTextItems, function(oRecord){ 
				try {
					that.checkTextRowRemove(oRecord, sMasterDataDate);
					var oTextResultDelete = that.removeTextRow(oRecord, sMasterDataDate);
					oResult.entities[oConfiguration.TextEntitiesSection].push(oTextResultDelete);
				} catch (e) {
					oResult.hasErrors = true;
					apiHelpers.createResponse(oRecord,oConfiguration.TextEntitiesSection, e, MessageOperation.DELETE, oResult);
				} 
			});
		}
		
		this.checkAfterRemove(oResult);

		return oResult;

	};
	
	/**
	 * Checks main row before delete
	 *
	 * @param   {object} oObject          - deleted entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
	MasterdataBase.prototype.checkMainRowRemove = function(oObject, sMasterDataDate){
		apiHelpers.checkColumns(oObject,this.aMetadataFields); //check if the row can be deleted	
	};
	
	/**
	 * Checks text row before delete
	 *
	 * @param   {object} oObjectText      - deleted text entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
	MasterdataBase.prototype.checkTextRowRemove = function(oObjectText, sMasterDataDate){
		apiHelpers.checkColumns(oObjectText,this.aMetadataFields);
	};

	/**
	 * Delete main row
	 *
	 * @param   {object}   oObject        - main entry that is deleted
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
	MasterdataBase.prototype.removeMainRow = function(oObject,sMasterDataDate){
		return apiHelpers.removeRow(oObject,sMasterDataDate,oConfiguration,hQuery);
	};

	/**
	 * Delete text row
	 *
	 * @param   {object}   oObjectText      - deleted text entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
	MasterdataBase.prototype.removeTextRow = function(oObjectText,sMasterDataDate){
		return apiHelpers.removeTextRow(oObjectText,sMasterDataDate,oConfiguration,hQuery);
	};
	
	/**
	 * General check after deleting (main+text) entities
	 */
	MasterdataBase.prototype.checkAfterRemove = function(oObject){
	};
		
	/*************************************************************************************************************************
	 * Insert
	 *************************************************************************************************************************/
	
	/**
	 * Insert data (this method is called from persistency-administration.xsjslib)
	 *
	 * @param   {objects} oBatchItems          - object containing an array of masterdata objects + an array of masterdata object texts
	 * @param   {string} sMasterDataDate       - current data
	 * @returns {object}  oResult              - inserted entries / errors
	 */
	MasterdataBase.prototype.insert = function(oBatchItems, sMasterDataDate){

		var oResult = {
				entities:{},
				hasErrors: false,
				errors:[]    	    
		};
		
		var aChangedObjectsKeys = [];

		var aBatchMainItems = oBatchItems[oConfiguration.MainEntitiesSection];
		oResult.entities[oConfiguration.MainEntitiesSection] = [];
		_.each(aBatchMainItems, function(oRecord){ 
			try {
				that.checkMainRowInsert(oRecord, sMasterDataDate);
				var oMainResultInsert = that.insertMainRow(oRecord, sMasterDataDate);
				oResult.entities[oConfiguration.MainEntitiesSection].push(oMainResultInsert);
			} catch (e) {
				oResult.hasErrors = true;
				apiHelpers.createResponse(oRecord,oConfiguration.MainEntitiesSection, e, MessageOperation.CREATE, oResult);
			} 
		});

		if((!helpers.isNullOrUndefined(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable))&&
				(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable !== ""))
		{
			var aBatchTextItems = oBatchItems[oConfiguration.TextEntitiesSection];
			oResult.entities[oConfiguration.TextEntitiesSection] = [];
			_.each(aBatchTextItems, function(oRecord){ 
				try {
					that.checkTextRowInsert(oRecord, sMasterDataDate);
					var oTextResultInsert = that.insertTextRow(oRecord, sMasterDataDate);
					if(oConfiguration.bIsVersioned)
						aChangedObjectsKeys.push(_.pick(oTextResultInsert,oConfiguration.aPartialKeyPlcTableColumns));
					oResult.entities[oConfiguration.TextEntitiesSection].push(oTextResultInsert);
				} catch (e) {
					oResult.hasErrors = true;
					apiHelpers.createResponse(oRecord,oConfiguration.TextEntitiesSection, e, MessageOperation.CREATE, oResult);
				} 
			});		
	
			if(oConfiguration.bIsVersioned){
		 		if((oResult.hasErrors==false)&&(aChangedObjectsKeys.length > 0)){
		 			//we need to copy the entries if we create a text for an entity that already exists
		 			var oCopiedObjects = apiHelpers.copyUnchangedRows(aChangedObjectsKeys, oConfiguration, sMasterDataDate, hQuery, this.helper);
		 			oResult.entities[oConfiguration.MainEntitiesSection] = oResult.entities[oConfiguration.MainEntitiesSection].concat(oCopiedObjects.main);
		 			oResult.entities[oConfiguration.TextEntitiesSection] = oResult.entities[oConfiguration.TextEntitiesSection].concat(oCopiedObjects.texts);
		 		}
		    }
		}
		
		this.checkAfterInsert(oResult);

		return oResult;

	};
	
	/**
	 * Checks main row before insert
	 *
	 * @param   {object} oObject          - inserted entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - inserted entry
	 */
	MasterdataBase.prototype.checkMainRowInsert = function(oObject, sMasterDataDate){
		apiHelpers.checkColumns(oObject,this.aMetadataFields);
	};
	
	/**
	 * Checks text row before insert
	 *
	 * @param   {object} oObjectText      - inserted text entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - inserted entry
	 */
	MasterdataBase.prototype.checkTextRowInsert = function(oObjectText, sMasterDataDate){
		apiHelpers.checkColumns(oObjectText,this.aMetadataFields);
	};

	/**
	 * General check after inserting (main+text) entities
	 */
	MasterdataBase.prototype.checkAfterInsert = function(oObject){
	};

	/**
	 * Insert main row
	 *
	 * @param   {object} oObject        - inserted main entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - inserted entry
	 */
	MasterdataBase.prototype.insertMainRow = function(oObject,sMasterDataDate){

		var oResult = apiHelpers.insertRow(oObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,this.helper);

		//check if the reference objects data exists in PLC; if it does not exist in PLC, check if the reference objects data exists in ERP; 
		//if exists, create in in PLC
		this.checkCreateReferenceObjects(oResult, sMasterDataDate);

		return oResult;

	};

	/**
	 * Check if the referenced objects exists; if they do not exist, then create them
	 *
	 * @param   {object} oObject - entry that is checked
	 * @param   {string} sMasterDataDate  - master data timestamp
	 */
	MasterdataBase.prototype.checkCreateReferenceObjects = function(oObject, sMasterDataDate) {

	};
    
	/**
	 * Copy an entry(+ corresponding texts) from ERP tables to PLC tables (+checks)
	 * 
	 * @param   {array}  aKeyFieldsPlcTable         - array of (partial) key columns
	 * @param   {array}  aKeyFieldsValuesPlcTable   - array of (partial) key column values
	 * @param   {string} sMasterDataDate            - master data timestamp
	 * @returns {object} oResult                    - object containing copied entity
	 */
	MasterdataBase.prototype.copyDataFromErp = function(aKeyFieldsPlcTable, aKeyFieldsValuesPlcTable, sMasterDataDate) {

		//copy data from ERP
		var oResult = apiHelpers.copyDataFromErp(aKeyFieldsPlcTable, aKeyFieldsValuesPlcTable, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, this.helper);

		//apply the transitive closure
		this.checkCreateReferenceObjects(oResult, sMasterDataDate);

		return oResult;

	};

	/**
	 * Insert text row
	 *
	 * @param {object}   oObjectText      - inserted text entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - inserted entry
	 */
	MasterdataBase.prototype.insertTextRow = function(oObjectText,sMasterDataDate){
		return apiHelpers.insertTextRow(oObjectText,sMasterDataDate,oConfiguration,hQuery,this.helper);
	};
	
	/*************************************************************************************************************************
	 * Update
	 *************************************************************************************************************************/

	/**
	 * Update data (this method is called from persistency-administration.xsjslib)
	 *
	 * @param   {objects} oBatchItems          - object containing an array of company codes + an array of company code texts
	 * @param   {string} sMasterDataDate       - current data
	 * @returns {object}  oResult              - updated entries / errors
	 */
	MasterdataBase.prototype.update = function(oBatchItems, sMasterDataDate){

		var oResult = {
				entities:{},
				hasErrors: false,
				errors:[]    	    
		};
		
		var aChangedObjectsKeys = [];

		var aBatchMainItems = oBatchItems[oConfiguration.MainEntitiesSection];
		oResult.entities[oConfiguration.MainEntitiesSection] = [];
		_.each(aBatchMainItems, function(oRecord){ 
			try {
				that.checkMainRowUpdate(oRecord, sMasterDataDate);
				var oMainResultUpdate = that.updateMainRow(oRecord, sMasterDataDate);
				if(oConfiguration.bIsVersioned)
					aChangedObjectsKeys.push(_.pick(oMainResultUpdate,oConfiguration.aPartialKeyPlcTableColumns));
				oResult.entities[oConfiguration.MainEntitiesSection].push(oMainResultUpdate);
			} catch (e) {
				oResult.hasErrors = true;
				apiHelpers.createResponse(oRecord,oConfiguration.MainEntitiesSection, e, MessageOperation.UPDATE, oResult);
			} 
		});

		if((!helpers.isNullOrUndefined(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable))&&
				(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable !== ""))
		{
			var aBatchTextItems = oBatchItems[oConfiguration.TextEntitiesSection];
			oResult.entities[oConfiguration.TextEntitiesSection] = [];
			_.each(aBatchTextItems, function(oRecord){ 
				try {
					that.checkTextRowUpdate(oRecord, sMasterDataDate);
					var oTextResultUpdate = that.updateTextRow(oRecord, sMasterDataDate);
					if(oConfiguration.bIsVersioned)
						aChangedObjectsKeys.push(_.pick(oTextResultUpdate,oConfiguration.aPartialKeyPlcTableColumns));
					oResult.entities[oConfiguration.TextEntitiesSection].push(oTextResultUpdate);
				} catch (e) {
					oResult.hasErrors = true;
					apiHelpers.createResponse(oRecord,oConfiguration.TextEntitiesSection, e, MessageOperation.UPDATE, oResult);
				} 
			});
			
			if(oConfiguration.bIsVersioned){
		 		if((oResult.hasErrors==false)&&(aChangedObjectsKeys.length > 0)){
		 			//we need to copy the entries if we create a text for an entity that already exists
		 			var oCopiedObjects = apiHelpers.copyUnchangedRows(aChangedObjectsKeys, oConfiguration, sMasterDataDate, hQuery, this.helper);
		 			oResult.entities[oConfiguration.MainEntitiesSection] = oResult.entities[oConfiguration.MainEntitiesSection].concat(oCopiedObjects.main);
		 			oResult.entities[oConfiguration.TextEntitiesSection] = oResult.entities[oConfiguration.TextEntitiesSection].concat(oCopiedObjects.texts);
		 		}
			}
		}
		
		this.checkAfterUpdate(oResult);
		
		return oResult;

	};
	
	/**
	 * Checks main row before update
	 *
	 * @param   {object} oObject          - updated entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - updated entry
	 */
	MasterdataBase.prototype.checkMainRowUpdate = function(oObject, sMasterDataDate){
		apiHelpers.checkColumns(oObject,this.aMetadataFields);
	};
	
	/**
	 * Checks text row before update
	 *
	 * @param   {object} oObjectText      - updated text entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - updated entry
	 */
	MasterdataBase.prototype.checkTextRowUpdate = function(oObjectText, sMasterDataDate){
		apiHelpers.checkColumns(oObjectText,this.aMetadataFields);
	};
	
	/**
	 * General check after updating (main+text) entities
	 */
	MasterdataBase.prototype.checkAfterUpdate = function(oObject){
	};

	/**
	 * Update main row
	 *
	 * @param   {object}   oObject        - updated main entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - updated entry
	 */
	MasterdataBase.prototype.updateMainRow = function(oObject,sMasterDataDate){

		var oResult = apiHelpers.updateRow(oObject,sMasterDataDate,oConfiguration,hQuery,this.helper);

		//check if the reference objects data exists in PLC; if it does not exist in PLC, check if the reference objects data exists in ERP; 
		//if exists, create in in PLC
		this.checkCreateReferenceObjects(oResult, sMasterDataDate);

		return oResult;

	};

	/**
	 * Update text row
	 *
	 * @param {object}   oObjectText - updated text entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - updated entry
	 */
	MasterdataBase.prototype.updateTextRow = function(oObjectText,sMasterDataDate){
		return apiHelpers.updateTextRow(oObjectText,sMasterDataDate,oConfiguration,hQuery,this.helper);
	};

	/**
	 * Check/create referenced masterdata objects
	 *
	 * @param {objects} oObject - masterdata object object
	 * 
	 *  the parameters will be filled like this: 

  		var oObject = {"COMPANY_CODE_ID":"0001"}; 
  		new CompanyCode(...).checkCreateReferenceObject(oObject,sMasterDataDate);

	 */
	MasterdataBase.prototype.checkCreateReferenceObject = function(oObject, sMasterDataDate) {

		if (!_.isObject(oObject)) {
			const sLogMessage = `oObject must be a valid object: ${JSON.stringify(oObject)}.`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}

		var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;

		if(!apiHelpers.areAllFieldsEmpty(aPartialKeyPlcTableColumns, oObject)){
			var aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aPartialKeyPlcTableColumns, oObject);
			var aFoundPlcRecords = apiHelpers.findValidEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTable, aPartialKeyPlcTableColumns, aFieldsValuesMainPlcTable, sMasterDataDate, hQuery); 
			if (aFoundPlcRecords.length === 0) {
				//copy data from ERP(if does not exit=>error; if exists=>insert it in PLC)
				if((helpers.isNullOrUndefined(Resources[oConfiguration.sObjectName].dbobjects.erpTable))||(Resources[oConfiguration.sObjectName].dbobjects.erpTable === "")){
					const sLogMessage = `ERP table was not specified for business object ${oConfiguration.sObjectName}.`;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
				}else{
					this.copyDataFromErp(aPartialKeyPlcTableColumns, aFieldsValuesMainPlcTable, sMasterDataDate);  
				}    
			}
		}
	};
		
}

MasterdataBase.prototype = Object.create(MasterdataBase.prototype);
MasterdataBase.prototype.constructor = MasterdataBase;
