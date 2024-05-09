const _ = $.require("lodash");
const helpers = $.require("../util/helpers");
const BusinessObjectTypes = $.require("../util/constants").BusinessObjectTypes;

const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;
const ItemValidator = $.require("./itemValidator").ItemValidator;
const constants = $.require("../util/constants");

const MessageLibrary = $.require("../util/message");
const MessageDetails = MessageLibrary.Details;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

/**
 * This class constructs BusinessObjectValidator instances for the Calculation Version business object type. It
 * validates the data in the body of a request. For this, the validation distinguishes the different CRUD operations
 * which can be done upon the business object (example: for a GET request no body is allowed, but for POST, PUT and
 * DELETE the body is mandatory).
 * 
 * @constructor
 */

function CalculationVersionValidator(oPersistency, sSessionId, metadataProvider, utils) {

	var genericSyntaxValidator = new GenericSyntaxValidator();
	const itemValidator = new ItemValidator($, oPersistency, sSessionId, $.getPlcUsername(), metadataProvider, utils);
	var aSaveMandatoryPropertiesStatic = [ "CALCULATION_ID", "CALCULATION_VERSION_ID", "CALCULATION_VERSION_NAME" ];
	var aCloseMandatoryPropertiesStatic = [ "CALCULATION_VERSION_ID" ];
	var aFreezeMandatoryPropertiesStatic = [ "CALCULATION_VERSION_ID" ];
	var aValidSortingColumns = ["PROJECT_NAME", "CALCULATION_NAME", "LAST_MODIFIED_ON"];
	var aValidObjects = ["PROJECT", "CALCULATION", "CALCULATION_VERSION", "CUSTOMER", "MATERIAL", "PLANT"];
	
	/**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 * 
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param oPersistency -
	 *            An instance of Persistency to enable access to the data base and retrieve trustworthy data in order to
	 *            validate reference IDs given in the request
	 * @param sSessionId -
	 *            The session id of the request which is necessary for database queries.
	 * @returns
	 * 
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
	this.validate = function(oRequest, mValidatedParameters) {
	    
	    if(!helpers.isNullOrUndefined(mValidatedParameters) && mValidatedParameters.omitItems === true && mValidatedParameters.compressedResult === true) {
                const sLogMessage = "Cannot use omitItems = true and compressedResult = true in the same request.";
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
		}
		
		// self needed, because this context needed from outside of the nested functions
		const self = this;
		switch (oRequest.method) {
			case $.net.http.GET:
				return validateGetRequest();
			case $.net.http.POST:
				return validatePostRequest();
			case $.net.http.PUT:
				return validateUpdateRequest();
			case $.net.http.PATCH:
					return validatePatchRequest();
			case $.net.http.DEL:
				var aCvs = utils.tryParseJson(oRequest.body.asString());
				return validateCloseDeleteRequests(aCvs);
			default: {
                const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		function validatePostRequest() {
			if (mValidatedParameters.action === undefined) {
                const sLogMessage = "POST requests for the calculation version resource are only valid if an action parameter is specified. Cannot validate.";
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
			const aAllowedActions = ['copy', 'open', 'create'];
			if((mValidatedParameters.compressedResult) && !_.includes(aAllowedActions, mValidatedParameters.action)){
                const sLogMessage = `Request parameter compressedResult is not allowed for action ${mValidatedParameters.action}`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}

			switch (mValidatedParameters.action) {
				case "save":
				case "save-as": {
					const aCvs = utils.tryParseJson(oRequest.body.asString());
					return validateSaveRequests(aCvs);
				}
				case "close": {
					const aCvs = utils.tryParseJson(oRequest.body.asString());
					return validateCloseDeleteRequests(aCvs);
				}
				case "copy":
					return validateCopyRequests();
				case "create": {
					const aCvs = utils.tryParseJson(oRequest.body.asString());
					return validateCreateRequests(aCvs);
				}
				case "open":
					return validateOpenRequests();
				case "freeze": {
					const aCvs = utils.tryParseJson(oRequest.body.asString());
					return validateFreezeRequests(aCvs);
				}
				default: {
					const sLogMessage = `Unknown value for parameter action: ${mValidatedParameters.action}. Cannot validate.`;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);					
				}
			}
		}

		function validateSaveRequests(aCvs) {
			var aValidatedCvs = [];
			_.each(aCvs, function(oCv) {
				utils.checkMandatoryProperties(oCv, aSaveMandatoryPropertiesStatic);
				utils.checkInvalidProperties(oCv, aSaveMandatoryPropertiesStatic);

				var aCvNamePropertyMetadata = metadataProvider.get(BusinessObjectTypes.CalculationVersion, BusinessObjectTypes.CalculationVersion,
						"CALCULATION_VERSION_NAME", null, oPersistency, $.getPlcUsername(), $.getPlcUsername());
				if (aCvNamePropertyMetadata.length !== 1) {
	                const sLogMessage = `Ambiguous or no metadata and column_id ${"CALCULATION_VERSION_NAME"} during validation of ${BusinessObjectTypes.CalculationVersion}`;
	                $.trace.error(sLogMessage);
	                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);	                
				}

				var oValidatedCv = {};
				oValidatedCv.CALCULATION_ID = genericSyntaxValidator.validateValue(oCv.CALCULATION_ID, "PositiveInteger", undefined, true);
				oValidatedCv.CALCULATION_VERSION_ID = genericSyntaxValidator.validateValue(oCv.CALCULATION_VERSION_ID, "PositiveInteger", undefined, true);
				oValidatedCv.CALCULATION_VERSION_NAME = genericSyntaxValidator.validateValue(oCv.CALCULATION_VERSION_NAME,
						aCvNamePropertyMetadata[0].SEMANTIC_DATA_TYPE, aCvNamePropertyMetadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES, true, aCvNamePropertyMetadata[0].VALIDATION_REGEX_VALUE);

				aValidatedCvs.push(oValidatedCv);
			});
			return aValidatedCvs;
		}
		
		function validateFreezeRequests(aCvs) {
			var aValidatedCvs = [];
			_.each(aCvs, function(oCv) {
				utils.checkMandatoryProperties(oCv, aFreezeMandatoryPropertiesStatic);
				utils.checkInvalidProperties(oCv, aFreezeMandatoryPropertiesStatic);

				var oValidatedCv = {};
				oValidatedCv.CALCULATION_VERSION_ID = genericSyntaxValidator.validateValue(oCv.CALCULATION_VERSION_ID, "PositiveInteger", undefined, true);
				aValidatedCvs.push(oValidatedCv);
			});
			return aValidatedCvs;
		}

		function validateCloseDeleteRequests(aCvs) {
			var aValidatedCvs = [];
			_.each(aCvs, function(oCv) {
				utils.checkMandatoryProperties(oCv, aCloseMandatoryPropertiesStatic);
				utils.checkInvalidProperties(oCv, aCloseMandatoryPropertiesStatic);

				var oValidatedCv = {};
				oValidatedCv.CALCULATION_VERSION_ID = genericSyntaxValidator.validateValue(oCv.CALCULATION_VERSION_ID, "PositiveInteger", undefined, true);
				aValidatedCvs.push(oValidatedCv);
			});
			return aValidatedCvs;
		}
		
		function validateCopyRequests() {
			utils.checkEmptyBody(oRequest.body);
			if(helpers.isNullOrUndefined(mValidatedParameters.id)) {
                const sLogMessage = "ID parameter is missing";
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);                
			}
			return [];
		}
		
		function validateCreateRequests(aCvs) {		
			var oCalculationVersionMetadata = 
				metadataProvider.get(BusinessObjectTypes.CalculationVersion, BusinessObjectTypes.CalculationVersion, null, null, oPersistency);
			var oItemMetadata = metadataProvider.get(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());
			var oItemMetadataCF = utils.extendMetadataCustomFields(oItemMetadata);
			var aValidatedCvs = [];
			let aItemInvalidmasterdataReferences = [];
			_.each(aCvs, function(oCv) {
				
				utils.checkMandatoryProperties(oCv, [ "ITEMS" ]);
				if (!(_.isArray(oCv.ITEMS) && oCv.ITEMS.length === 1)) {
	                const sLogMessage = "Inital calculation version does not contain an array with 1 entry named ITEMS. Cannot validate.";
	                $.trace.error(sLogMessage);
	                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
				}
				var oItem = oCv.ITEMS[0];
				
				// the array ITEMS of the calculation version are not
				// maintained in metadata since they don't belong to table columns but are only used to structure the
				// data within the request object; they needed to be filtered out in order to enable a metadata-based
				// validation; the original structure is re-created after successful validation
				var oCvToValidate = _.omit(oCv, [ "ITEMS" ]);
	
				var oSyntacticallyCorrectVersion = utils.checkEntity({
					entity : oCvToValidate,
					categoryId : -1,
					subitemState : -1,
					metadata : oCalculationVersionMetadata
				});
				const oSyntacticallyCorrectItem = utils.checkEntity({
					entity: oItem,
					categoryId: 0,
					subitemState: 0,
					metadata: oItemMetadataCF
				});
				
				self.checkCostingSheetSelectedTotals(oSyntacticallyCorrectVersion, true);

				const oExistingNonTemporaryMasterdata = oPersistency.CalculationVersion.getExistingNonTemporaryMasterdata({
					calculation_id: oSyntacticallyCorrectVersion.CALCULATION_ID					
				});
				self.checkMasterdataReferences(oSyntacticallyCorrectVersion, oExistingNonTemporaryMasterdata);
				itemValidator.checkMasterdataReferences([oSyntacticallyCorrectItem], oExistingNonTemporaryMasterdata, oItemMetadata, oItemMetadataCF);
				
				oSyntacticallyCorrectVersion.ITEMS = [ oSyntacticallyCorrectItem ];								
				aValidatedCvs.push(oSyntacticallyCorrectVersion);
			});
			
			if (aItemInvalidmasterdataReferences.length > 0) {
			    var oMsgDetails = new MessageDetails();
			    oMsgDetails.invalidNonTemporaryMasterdataObj = aItemInvalidmasterdataReferences;
				const sClientMsg = `Error while checking masterdata reference. Temporary values are not allowed.`;
				const sServerMsg = `Error while checking masterdata reference. Temporary values are not allowed. For more information, please see response messages`;
				$.trace.error(sServerMsg);
				throw new PlcException(Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR, sClientMsg, oMsgDetails);
			}

			return aValidatedCvs;
		}

		function validateUpdateRequest() {
			var aCvs = utils.tryParseJson(oRequest.body.asString());
			var aValidatedItems = [];
			
			var oMetadata = metadataProvider.get(BusinessObjectTypes.CalculationVersion, BusinessObjectTypes.CalculationVersion, null, null,
				oPersistency, $.getPlcUsername(), $.getPlcUsername());
			
			_.each(aCvs, function(oCv) {	
			    var oSyntacticallyCorrectVersion = utils.checkEntity({
					entity : oCv,
					categoryId : -1,
					subitemState : -1,
					metadata : oMetadata
				});				

				self.checkCostingSheetSelectedTotals(oSyntacticallyCorrectVersion);
				
				const oExistingNonTemporaryMasterdata = oPersistency.CalculationVersion.getExistingNonTemporaryMasterdata({
					calculation_version_id: oSyntacticallyCorrectVersion.CALCULATION_VERSION_ID,
					session_id: sSessionId
				});
				self.checkMasterdataReferences(oSyntacticallyCorrectVersion, oExistingNonTemporaryMasterdata);				
				aValidatedItems.push(oSyntacticallyCorrectVersion);
			});
            return aValidatedItems;
		}
		
    	function validateOpenRequests(){
			utils.checkEmptyBody(oRequest.body);
			if(helpers.isNullOrUndefined(mValidatedParameters.id)) {
                const sLogMessage = "Parameter 'id' is missing";
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			if(helpers.isNullOrUndefined(mValidatedParameters.calculate)) {
                const sLogMessage = "Parameter 'calculate' is missing";
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			return [];
    	}
		
		function validateGetRequest(){
			// there are 2 ways to get calculation versions:
			//		1. Load a single version with it's item by it's id
			//		2. Load versions for the cockpit or search by using query parameters
			// unfortunately, there is no better way of distinguishing them from each other
			if (mValidatedParameters.calculation_version_id && mValidatedParameters.expand) {
				validateGetSingleVersion();
				// RF: for some strange reason validateCockpitSearch returns an empty array if the validation
				// is successful; doing the same here for safety reasons. 
				return [];
			} else {
				return validateCockpitSearch();
			}
		}

		function validateGetSingleVersion(){
			// in this case nothing special need to be done, since the UrlValidator already ensured that the
			// mandatory parameters are in place
			utils.checkEmptyBody(oRequest.body);
		}
    	
		function validateCockpitSearch(){
			utils.checkEmptyBody(oRequest.body);

			var iParamsCount = 0;
			
			if(!helpers.isNullOrUndefined(mValidatedParameters.current) && helpers.isNullOrUndefined(mValidatedParameters.calculation_id) && helpers.isNullOrUndefined(mValidatedParameters.project_id)) {
                const sLogMessage = "Missing parameters 'current' and/or 'calculation_id' and/or 'project_id' for getting current versions of the calculations.";
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			
			if(!helpers.isNullOrUndefined(mValidatedParameters.calculation_id)) {
                //check that the calculation ids from the list are numbers
                var aCalcIds = mValidatedParameters.calculation_id.toString().split(","); // converted toString since the value can be sent as number when sending only one id ! 
                _.each(aCalcIds, function(sCalcId){
                     genericSyntaxValidator.validateValue(sCalcId, "PositiveInteger", undefined, true);
                });
			}

			if(!helpers.isNullOrUndefined(mValidatedParameters.project_id)) {
                //check that the project ids from the list are strings
                var aProjectIds = mValidatedParameters.project_id.split(",");
                _.each(aProjectIds, function(sProjectId){
                     genericSyntaxValidator.validateValue(sProjectId, "String", undefined, true);
                });
			}
			
			if( !helpers.isNullOrUndefined(mValidatedParameters.id) ) {iParamsCount = iParamsCount + 1;}
			if( !helpers.isNullOrUndefined(mValidatedParameters.recently_used) ) {iParamsCount = iParamsCount + 1;}
			if( !helpers.isNullOrUndefined(mValidatedParameters.calculation_id) ) {iParamsCount = iParamsCount + 1;}
			if( !helpers.isNullOrUndefined(mValidatedParameters.calculation_version_id) ) {iParamsCount = iParamsCount + 1;}
			if( !helpers.isNullOrUndefined(mValidatedParameters.project_id) ) {iParamsCount = iParamsCount + 1;}
			if( iParamsCount == 0 ) {
                const sLogMessage = "Mandatory parameter for get calculation version is missing. Please use only one parameter: 'calculation_id' or 'project_id' or 'recently_used' or 'id' or 'calculation_version_id'";
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			if( iParamsCount > 1 ) {
                const sLogMessage = "Please use only one parameter: 'calculation_id' or 'project_id' or 'recently_used' or 'id'";
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);                
			}	
			
			if(!helpers.isNullOrUndefined(mValidatedParameters.filter) || !helpers.isNullOrUndefined(mValidatedParameters.sortingColumn) || !helpers.isNullOrUndefined(mValidatedParameters.sortingDirection)) {
				if(helpers.isNullOrUndefined(mValidatedParameters.search) || mValidatedParameters.search !== true) {
	                const sLogMessage = "Missing search=true parameter when filters or sorting column or direction is present.";
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);	                
				}
				if(helpers.isNullOrUndefined(mValidatedParameters.id)) {
	                const sLogMessage = "Missing id for the search for reference versions.";
	                $.trace.error(sLogMessage);
	                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);	                
				}
			}
			
			if(!helpers.isNullOrUndefined(mValidatedParameters.sortingDirection) && mValidatedParameters.sortingDirection !== 'asc' && mValidatedParameters.sortingDirection !== 'desc') {
                const sLogMessage = `Sorting direction not valid: ${mValidatedParameters.sortingDirection}, it should be asc or desc.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			
			if(!helpers.isNullOrUndefined(mValidatedParameters.sortingColumn) && !_.includes(aValidSortingColumns, mValidatedParameters.sortingColumn)) {
                const sLogMessage = `Sorting column ${mValidatedParameters.sortingColumn} is not valid.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			
			if(!helpers.isNullOrUndefined(mValidatedParameters.filter)) {
				var aObjectsList = mValidatedParameters.filter.split(",");
			    aObjectsList.forEach(function(obj) {
			    	var sObject = (obj.split("="))[0];
			    	if(!_.includes(aValidObjects, sObject)) {
		                const sLogMessage = `Business Object ${sObject} is not valid.`;
		                $.trace.error(sLogMessage);
		                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);		                
			    	}
			    });
			}
			
			return [];
		}
		
		/*
		 * The patch request is used to lock or unlock a calculation version for additional write accesses 
		 * without the need to explicitly open it (required for variant matrix)
		 */
		function validatePatchRequest() {
			
			// no URL parameters need to be validated since the UrlValidator ensures that the
			// mandatory parameter "calculation version id" is a positive integer

			let aValidPatchAttributes = ['LOCK'];
			let aValidLockAttributes = ['CONTEXT', 'IS_WRITEABLE'];
			let oRequestedPatchSet = utils.tryParseJson(oRequest.body.asString());
			
			utils.checkMandatoryProperties(oRequestedPatchSet, aValidPatchAttributes);
			utils.checkInvalidProperties(oRequestedPatchSet, aValidPatchAttributes);

			utils.checkMandatoryProperties(oRequestedPatchSet.LOCK, aValidLockAttributes);
			utils.checkInvalidProperties(oRequestedPatchSet.LOCK, aValidLockAttributes);

			// genericSyntaxValidator parses IS_WRITEABLE to accept string value ("1", "0") and integer value (1, 0) for IS_WRITEABLE within request body
			oRequestedPatchSet.LOCK.IS_WRITEABLE = genericSyntaxValidator.validateValue(oRequestedPatchSet.LOCK.IS_WRITEABLE, "BooleanInt", undefined, true);
			
			if(!_.includes([constants.CalculationVersionLockContext.CALCULATION_VERSION, constants.CalculationVersionLockContext.VARIANT_MATRIX], oRequestedPatchSet.LOCK.CONTEXT)) {
				const sLogMessage = `Mandatory property LOCK.CONTEXT has wrong format or contains invalid value`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}

			return oRequestedPatchSet;
		}
	};

	this.checkMasterdataReferences = function (oVersion, oNonTemporaryMasterdata) {
		utils.checkNonTemporaryMasterdataReferences(oVersion, ["COSTING_SHEET_ID"], oPersistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.COSTING_SHEETS, "COSTING_SHEET_ID"));
		utils.checkNonTemporaryMasterdataReferences(oVersion, ["COMPONENT_SPLIT_ID"], oPersistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.COMPONENT_SPLITS, "COMPONENT_SPLIT_ID"));
		utils.checkNonTemporaryMasterdataReferences(oVersion, ["REPORT_CURRENCY_ID"], oPersistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.CURRENCIES, "CURRENCY_ID"));
		utils.checkNonTemporaryMasterdataReferences(oVersion, ["EXCHANGE_RATE_TYPE_ID"], oPersistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.EXCHANGE_RATE_TYPES, "EXCHANGE_RATE_TYPE_ID"));
		utils.checkNonTemporaryMasterdataReferences(oVersion, ["MATERIAL_PRICE_STRATEGY_ID"], oPersistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.MATERIAL_PRICE_STRATEGIES, "MATERIAL_PRICE_STRATEGY_ID"));
		utils.checkNonTemporaryMasterdataReferences(oVersion, ["ACTIVITY_PRICE_STRATEGY_ID"], oPersistency.Helper.createValueSetFromResult(oNonTemporaryMasterdata.ACTIVITY_PRICE_STRATEGIES, "ACTIVITY_PRICE_STRATEGY_ID"));       		
	};

	this.checkCostingSheetSelectedTotals = function(oVersion, bOnly_default){		
		
		if(!helpers.isNullOrUndefined(oVersion.SELECTED_TOTAL_COSTING_SHEET)){				
			if((bOnly_default && (oVersion.SELECTED_TOTAL_COSTING_SHEET) != constants.CalculationVersionCostingSheetTotals[0]) 
			|| (!bOnly_default && !constants.CalculationVersionCostingSheetTotals.includes(oVersion.SELECTED_TOTAL_COSTING_SHEET))){
				const sLogMessage = `Property SELECTED_TOTAL_COSTING_SHEET has an invalid value`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
		}

		if(!helpers.isNullOrUndefined(oVersion.SELECTED_TOTAL_COMPONENT_SPLIT)){

			if((bOnly_default && (oVersion.SELECTED_TOTAL_COMPONENT_SPLIT) != constants.CalculationVersionCostingSheetTotals[0])
			|| (!bOnly_default && !constants.CalculationVersionCostingSheetTotals.includes(oVersion.SELECTED_TOTAL_COMPONENT_SPLIT))){
				const sLogMessage = `Property SELECTED_TOTAL_COMPONENT_SPLIT has an invalid value`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);	
			}
		}				
	}	
}

CalculationVersionValidator.prototype = Object.create(CalculationVersionValidator.prototype);
CalculationVersionValidator.prototype.constructor = CalculationVersionValidator;