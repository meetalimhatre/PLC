const _ = $.require("lodash");
const helpers	= $.require("../util/helpers");

const XRegExp = $.require("xregexp");

const Constants = $.require("../util/constants");
const BusinessObjectTypes = Constants.BusinessObjectTypes;
const MasterDataObjectsAllowedReqBodyEntities = Constants.MasterDataObjectsAllowedReqBodyEntities;

const MessageLibrary = $.require("../util/message");
const MessageDetails = MessageLibrary.Details;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

const BatchOperation = $.require("../util/masterdataResources").BatchOperation;
const BusinessObjectsEntities = $.require("../util/masterdataResources").BusinessObjectsEntities;
const aNotMaintainableBusinessObjects = $.require("../util/masterdataResources").aNotMaintainableBusinessObjects;

const MasterDataObjectHandlerProxy = $.import("xs.db.administration.proxy", "masterDataProxy").MasterDataObjectHandlerProxy;
const MasterdataResource  = $.require("../util/masterdataResources").MasterdataResource;
const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;
var genericSyntaxValidator = new GenericSyntaxValidator();

var trace = $.trace;
/**
 * This class constructs BusinessObjectValidator instances for the Administration business object type. Currently it only checks the
 * filter and autocomplete parameter.
 * 
 * @constructor
 */
function AdministrationValidator(oPersistency, sSessionId, metadataProvider, utils) {
    
    function checkURLParameters(oParameters){
    	
    	//check autocomplete parameter
    	if(!helpers.isNullOrUndefined(oParameters.get("searchAutocomplete"))){
    		var sTextFromAutocomplete = oParameters.get("searchAutocomplete");
    		helpers.checkParameterString(sTextFromAutocomplete, Constants.RegularExpressions.AutoComplete);
    	}
    	//check business_object parameter (cannot be null, checked already before in urlValidator)
    	var sBusinessObjectParameter = oParameters.get("business_object");
    	var MasterDataObjectTypes = Constants.MasterDataObjectTypes;
    	if(!_.includes(_.values(MasterDataObjectTypes), sBusinessObjectParameter)){
            const sLogMessage = `"${sBusinessObjectParameter}" is not a valid value for business object parameter`;
            trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
    	}
    	
        //check filter parameter
    	if(!helpers.isNullOrUndefined(oParameters.get("filter"))){
    		var sTextFromFilter = oParameters.get("filter");
    		
    		var aMetaData = metadataProvider.get(sBusinessObjectParameter, sBusinessObjectParameter, null, null, oPersistency, $.getPlcUsername(), $.getPlcUsername());
    		//for custom fields, add _MANUAL suffix
    		var aCustomFieldsToSetSufix = _.filter(aMetaData, function(oMetadataField) {
				return ((oMetadataField.IS_CUSTOM === 1) && (oMetadataField.UOM_CURRENCY_FLAG !== 1));
			});
			_.each(aCustomFieldsToSetSufix, function (oCustomFieldsToSetSufix) {
				oCustomFieldsToSetSufix.COLUMN_ID = oCustomFieldsToSetSufix.COLUMN_ID + '_MANUAL';
			});
    		
    		//get all field names from the filter string
    		var regExFieldNames = Constants.RegularExpressions.FieldNames;
    		var aFieldNames = [];
    		var aRegExResult;
    		
            var rPattern = XRegExp(regExFieldNames);
    		while((aRegExResult = rPattern.exec(sTextFromFilter))!== null){
    		    aFieldNames.push(aRegExResult[1]);
    		}
    		
    		//check, if fieldnames exist in t_metadata
    		var aValidFieldNames = _.map(aMetaData, 'COLUMN_ID');
    		var aInvalidFieldNames = _.difference(aFieldNames, aValidFieldNames);
    		if(aInvalidFieldNames.length>0){
    		        var sInvalidFieldsList ='' ;
    		        _.each(aInvalidFieldNames, function(sName){sInvalidFieldsList = sInvalidFieldsList.concat(sName,', ');});
					const sLogMessage = "Fieldname parameter contains invalid fields: "+sInvalidFieldsList.slice(0,sInvalidFieldsList.length-2);
					trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
    		}    
    		
    		var sRegEx = Constants.RegularExpressions.FilterString;
            helpers.checkParameterString(sTextFromFilter, sRegEx);
    	}
    }
    
    function validatePostRequest(oRequest, mValidatedParameters){
		//check the autocomplete and filter parameter
		checkURLParameters(oRequest.parameters);
		
		var sBusinessObjectParameter = oRequest.parameters.get("business_object");
		var sIgnoreBadDataParameter = oRequest.parameters.get("ignoreBadData");
		var oRequestBodyData;
		
		try {
			oRequestBodyData = JSON.parse(oRequest.body.asString());
		} catch (e) {
			const sClientMsg = "Cannot parse string to JSON for masterdata.";
			const sServerMsg = `${sClientMsg} Tried to parse: ${oRequest.body.asString()}.`;
			trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
		}
				
		_.each(oRequestBodyData, function(value, key){
			if(_.includes(aNotMaintainableBusinessObjects,sBusinessObjectParameter)){
				const sLogMessage = `Business object ${sBusinessObjectParameter} cannot be maintained!`;
				trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}			
			if (key == BatchOperation.CREATE) {
				checkBusinessObjectinBodyIntegrity(sBusinessObjectParameter, value);
				createCustomChecks(sBusinessObjectParameter, value);
			}else if (key == BatchOperation.UPSERT) {
				checkBusinessObjectinBodyIntegrity(sBusinessObjectParameter, value);
			} else if (key == BatchOperation.UPDATE) {
				checkBusinessObjectinBodyIntegrity(sBusinessObjectParameter, value);
				updateCustomChecks(sBusinessObjectParameter, value);
			} else if (key == BatchOperation.DELETE){
				checkBusinessObjectinBodyIntegrity(sBusinessObjectParameter, value);
			} else {
				const sLogMessage = `Unknown property of the request object for masterdata: ${key}`;
				trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
		});
        
        // Locking the main table of the masterdata to create/update in order to prevent the concurrent creation of masterdata if 2 or more parallel connections create 
        // the same mastedata entity, as happened in connection with the Uploadtool for mastedata; see Internal Incident 1780251711 (https://support..../sap/support/message/1780251711);
        // TODO: This lock is done at a very early stage so that parallel create requests for masterdata will be slowed down significantly; massive use of the Uploadtool, as done by ACGO, 
        // 		 will take a lot longer after check-in; however, as client-side tests show, later locks does not solve the concurrency issue; there is a story defined for V2.3 in order to improve
        // 		 performance with the lock; see https://sapjira..../browse/PLC1-2036 (RF)
        //MK: internal URLs/information are not allowed
        const sMainTable = MasterdataResource[sBusinessObjectParameter].dbobjects.plcTable;
        oPersistency.getConnection().executeUpdate(`lock table "${sMainTable}" in exclusive mode`);
        
        // Locking process work center and activities work center tables to prevent concurrent creation of masterata
        // TODO: Should be refactored in: https://sapjira..../browse/PLC1-2036 (RF)
        //MK: internal URLs/information are not allowed
		if(sBusinessObjectParameter === BusinessObjectTypes.WorkCenter){
            var sWorkCenterProcessTable = MasterdataResource[BusinessObjectTypes.WorkCenterProcess].dbobjects.plcTable;
            oPersistency.getConnection().executeUpdate(`lock table "${sWorkCenterProcessTable}" in exclusive mode`);
            
            var sWorkCenterActivityTable = MasterdataResource[BusinessObjectTypes.WorkCenterActivity].dbobjects.plcTable;
            oPersistency.getConnection().executeUpdate(`lock table "${sWorkCenterActivityTable}" in exclusive mode`);
		}
        
		if((sBusinessObjectParameter === BusinessObjectTypes.AccountGroup)||(sBusinessObjectParameter === BusinessObjectTypes.ComponentSplit)
		||(sBusinessObjectParameter === BusinessObjectTypes.CostingSheet)||(sBusinessObjectParameter === BusinessObjectTypes.CostingSheetRow)
		||(sBusinessObjectParameter === BusinessObjectTypes.ExchangeRateType))
		{
			return oRequestBodyData;
		}
		
		if(sBusinessObjectParameter === BusinessObjectTypes.CurrencyConversion){
		    if(!helpers.isNullOrUndefined(oRequestBodyData.CREATE)){
		        checkCurrency(oRequestBodyData.CREATE);
		    }
		    if(!helpers.isNullOrUndefined(oRequestBodyData.UPDATE)){
		        checkCurrency(oRequestBodyData.UPDATE);
		    }
		    if(!helpers.isNullOrUndefined(oRequestBodyData.UPSERT)){
		        checkCurrency(oRequestBodyData.UPSERT);
		    }
		}
		
		var oMasterDataProxy = new MasterDataObjectHandlerProxy(oPersistency.getConnection(), oPersistency.getHQueryPlc(), sBusinessObjectParameter, sIgnoreBadDataParameter);
		var oValidationResponse = oMasterDataProxy.validateBatch(oRequestBodyData, new Date());
			
		return {
			BODY: oRequestBodyData,
			BOBJECT: oMasterDataProxy,
			VALIDATION: oValidationResponse
		};
		
	}
    
    /**
	 * This function validates the business object to have allowed keys
	 * 
	 * @param sBusinessObjectParameter - business_object parameter from the request URL
	 * @param oValue - object that must be checked for valid properties
	 */
    function checkBusinessObjectinBodyIntegrity(sBusinessObjectParameter, oValue) {   	
    	var keys = Object.keys(oValue);
    	
    	if (helpers.isNullOrUndefined(MasterDataObjectsAllowedReqBodyEntities.get(sBusinessObjectParameter))) {
			const sLogMessage = "There are no objects available in fields defined for business object: " + sBusinessObjectParameter;
			trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
    	}
    	
    	if(_.difference(keys, MasterDataObjectsAllowedReqBodyEntities.get(sBusinessObjectParameter)).length > 0){
            const oMessageDetails = new MessageDetails();
            oMessageDetails.administrationObj = oValue;
            
    	    const sLogMessage = `Object "${sBusinessObjectParameter}" is not a valid because it contains properties that are not allowed to be sent in body request.`;
            trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
    	}
    	
    	return true;
    }    
    
    function validateGetRequest(oRequest){
		//check the autocomplete and filter parameter
		checkURLParameters(oRequest.parameters);
		return utils.checkEmptyBody(oRequest.body);
	}

    function createCustomChecks(sBusinessObjectParameter, oValue) {

		if(sBusinessObjectParameter === BusinessObjectTypes.CostingSheet) {
			createCostingSheetCustomChecks(oValue);
		}
	}

    function validateUseDefaultFixedCostPortion(oRecord) {

		if(!helpers.isNullOrUndefined(oRecord.USE_DEFAULT_FIXED_COST_PORTION)) {
			genericSyntaxValidator.validateValue(oRecord.USE_DEFAULT_FIXED_COST_PORTION, "BooleanInt", false, undefined);
		}
	}

    function validateCreditFixedCostPortion(oRecord) {

		if(!helpers.isNullOrUndefined(oRecord.CREDIT_FIXED_COST_PORTION) && (oRecord.CREDIT_FIXED_COST_PORTION < 0 || oRecord.CREDIT_FIXED_COST_PORTION > 100)) {
			const sClientMsg = "Value must be between 0 and 100";
			const sServerMsg = `${sClientMsg} Value: ${oRecord.CREDIT_FIXED_COST_PORTION}.`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
		}
	}

	function validateCostingSheetRowFormula(oRecord, isCreate){
		if(isCreate){
			if(helpers.isNullOrUndefined(oRecord.FORMULA_STRING) && !helpers.isNullOrUndefined(oRecord.FORMULA_DESCRIPTION)) {
				const sLogMessage = `Formula string is mandatory when comment is added`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
		}
		else{
			if(!helpers.isNullOrUndefined(oRecord.FORMULA_ID) && helpers.isNullOrUndefined(oRecord.FORMULA_STRING) && helpers.isNullOrUndefined(oRecord.OVERHEAD_CUSTOM))
			{
				const sLogMessage = `Missing formula string and/or overhead custom property`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			
			if(helpers.isNullOrUndefined(oRecord.FORMULA_STRING) && !helpers.isNullOrUndefined(oRecord.FORMULA_DESCRIPTION)) {
				const sLogMessage = `Missing formula string property`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
		}
	}

    function createCostingSheetCustomChecks(oValue) {

		var aCostingSheetOverheadItems = oValue[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES];
		_.each(aCostingSheetOverheadItems, function(oRecord) {

			validateUseDefaultFixedCostPortion(oRecord);
		});

		var aCostingSheetOverheadRowItems = oValue[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES];
		_.each(aCostingSheetOverheadRowItems, function(oRecord) {

			validateCreditFixedCostPortion(oRecord);
			validateCostingSheetRowFormula(oRecord,true)
		});
	}

    function updateCustomChecks(sBusinessObjectParameter, oValue) {

		if(sBusinessObjectParameter === BusinessObjectTypes.CostingSheet) {
			updateCostingSheetCustomChecks(oValue);
		}
	}

    function updateCostingSheetCustomChecks(oValue) {

		var aCostingSheetOverheadItems = oValue[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES];
		_.each(aCostingSheetOverheadItems, function(oRecord) {

			validateUseDefaultFixedCostPortion(oRecord);
		});

		var aCostingSheetOverheadRowItems = oValue[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES];
		_.each(aCostingSheetOverheadRowItems, function(oRecord) {

			validateCreditFixedCostPortion(oRecord);
			validateCostingSheetRowFormula(oRecord,false);
		});
	}
	
	/**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 * 
	 * @param oRequest -
	 *         The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *         The parameters for the request. They are validated, i.e. checked if mandatory parameters are there and no unwanted parameters
	 *         are there additionally. Further validation of the parameter values is done here.
	 * @returns
	 *         The validated request.
	 * 
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
	this.validate = function(oRequest, mValidatedParameters) {
		switch (oRequest.method) {
		case $.net.http.GET:
			return validateGetRequest(oRequest);		
		case $.net.http.POST:
			return validatePostRequest(oRequest, mValidatedParameters);		
		default: {
			const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
			trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
	}

		
	};
	/**
	 * This function checks if the "From Currency" property and the "To Currency" property of a currency conversion entity are not the same
	 * 
	 * @param aCurrency -
	 *         The currency conversion entities array
	 */
	function checkCurrency(aCurrency){
	    let aCurrencyConversionEntities = aCurrency.CURRENCY_CONVERSION_ENTITIES;
	    if(_.isArray(aCurrencyConversionEntities) && aCurrencyConversionEntities.length > 0){
	        aCurrencyConversionEntities.forEach((oCurrencyConversion) => {
	            if(oCurrencyConversion.FROM_CURRENCY_ID === oCurrencyConversion.TO_CURRENCY_ID){
		                const sClientMsg = "FROM_CURRENCY_ID and TO_CURRENCY_ID must not be the same value.";
			            trace.error(sClientMsg);
			            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
		            }
	        });
	    }
	}
}
AdministrationValidator.prototype = Object.create(AdministrationValidator.prototype);
AdministrationValidator.prototype.constructor = AdministrationValidator;
