const _ = $.require("lodash");
const DefaultSettingsMasterDataColumns = $.require("../util/constants").DefaultSettingsMasterDataColumns;

const MessageLibrary = $.require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

/**
 * This class constructs BusinessObjectValidator instances for the Default Settings business object type. It
 * validates the data in the body of a request. For this, the validation distinguishes the different CRUD operations
 * which can be done upon the business object (example: for a GET request no body is allowed, but for POST, PUT and
 * DELETE the body is mandatory).
 * 
 * @constructor
 */

function DefaultSettingsValidator(utils) {
	
    const oLockTypes = {
		global: "GLOBAL", 
		user: "USER"
	};
	
	// tuples that are mandatory to exist together in the request body as are interdependent
    const oCreateUpdateMandatoryTuples = {
			companyCodeTuple: ["CONTROLLING_AREA_ID", "COMPANY_CODE_ID"], 
			plantTuple: ["CONTROLLING_AREA_ID", "COMPANY_CODE_ID", "PLANT_ID"],
			componentSplitTuple: ["CONTROLLING_AREA_ID", "COMPONENT_SPLIT_ID"],
			costingSheetTuple: ["CONTROLLING_AREA_ID", "COSTING_SHEET_ID"]
	};
	
	/**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 * 
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *            The $.request parameters            
	 * @returns
	 * 
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
	this.validate = function(oRequest, mValidatedParameters) {
		switch (oRequest.method) {
			case $.net.http.GET:
				utils.checkEmptyBody(oRequest.body);
				return validateSelectRequest();
			case $.net.http.POST:
				return validateCreateUpdateRequest();
			case $.net.http.PUT:
				return validateCreateUpdateRequest();
			case $.net.http.DEL:
				utils.checkEmptyBody(oRequest.body);
				return checkType(mValidatedParameters);
			default: {
				const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
				
			}
		}
		
		function validateSelectRequest() {
			checkType(mValidatedParameters);
			if (mValidatedParameters.type.toUpperCase() === oLockTypes.global) {
				if (mValidatedParameters.lock !== undefined) {
					if (mValidatedParameters.lock !== true &&  mValidatedParameters.lock !== "true" && mValidatedParameters.lock !== false &&  mValidatedParameters.lock !== "false") {
						const sLogMessage = "GET requests for default settings, for global type, are only valid if lock/no lock is specified. Cannot validate.";
						$.trace.error(sLogMessage);
						throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
					}
				}
			}
			return;
		}

		function validateCreateUpdateRequest() {
			var oBodyEntities;
			try {
				oBodyEntities = JSON.parse(oRequest.body.asString());
			} catch (e) {
				const sClientMsg = "Cannot parse string during validation of DefaultSettings.";
				const sServerMsg = `${sClientMsg} Tried to parse: ${oRequest.body.asString()}.`;
				$.trace.error(sServerMsg);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
			}
			
			// verify each inter-dependent tuples, such as "COMPANY_CODE_ID" and "CONTROLLING_AREA_ID"
			_.each(_.keys(oBodyEntities), function(property) {
				switch (property) {
				case DefaultSettingsMasterDataColumns.companyCodeId:
					checkRequiredProperties(oBodyEntities, oCreateUpdateMandatoryTuples.companyCodeTuple);
					break;
				case DefaultSettingsMasterDataColumns.plantId:
					checkRequiredProperties(oBodyEntities, oCreateUpdateMandatoryTuples.plantTuple);
					break;
				case DefaultSettingsMasterDataColumns.componentSplitId:
					checkRequiredProperties(oBodyEntities, oCreateUpdateMandatoryTuples.componentSplitTuple);
					break;
				case DefaultSettingsMasterDataColumns.costingSheetId:
					checkRequiredProperties(oBodyEntities, oCreateUpdateMandatoryTuples.costingSheetTuple);
					break;
				}
			});
			return oBodyEntities;
		}
		
		function checkRequiredProperties(oEntity, aProperties) {
			_.each(aProperties, function(property) {
				if (!_.has(oEntity, property)) {
					const sLogMessage = `Mandatory property ${property} is not present in entity ${JSON.stringify(oEntity)}.`;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
				}
				return;
			});
		}
		
		function checkType(mValidatedParameters) {
		    const sLogMessage = "GET/DELETE requests for default settings are valid only if type is specified (either GLOBAL or USER). Cannot validate.";
		    
			if ((typeof mValidatedParameters.type == "undefined") || mValidatedParameters.type === "" ) {
			    $.trace.error(sLogMessage);
			    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			
			if (!(_.includes(_.values(oLockTypes), mValidatedParameters.type.toUpperCase()))) {
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);	
			}

			return;
		}
	};
}

DefaultSettingsValidator.prototype = Object.create(DefaultSettingsValidator.prototype);
DefaultSettingsValidator.prototype.constructor = DefaultSettingsValidator;