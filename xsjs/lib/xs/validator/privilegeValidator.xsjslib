const _ = $.require("lodash");

const MessageLibrary = $.require("../util/message");
const AuthObjectTypes = $.require("../util/constants").AuthObjectTypes;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;

/**
 * This class constructs BusinessObjectValidator instances for the  business object type. It
 * validates the data in the body of a request. For this, the validation distinguishes the different CRUD operations
 * which can be done upon the business object.
 *
 * @constructor
 */

function PrivilegeValidator(oPersistency, utils) {	
	//valid properties for batch operations
	var aValidPropertiesPrivilege = ["USER_PRIVILEGES", "GROUP_PRIVILEGES"]; 

	/**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 *
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *            Validated request parameters.
	 * @returns
	 *			{oPrivilege} 
	 *				Validated  object
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
	this.validate = function(oRequest, mValidatedParameters, oServiceOutput) {
		switch (oRequest.method) {
			case $.net.http.GET:
				return utils.checkEmptyBody(oRequest.body);
			case $.net.http.POST:
				return validateBatchRequest();
			default: {
				const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		function validateBatchRequest() {
			var oPrivilege = utils.tryParseJson(oRequest.body.asString());
			//mandatory and valid properties for the object
			var aMandatoryProperties = ["ENTITY_TYPE", "ENTITY_ID"];
			var aValidProperties = ["ENTITY_TYPE", "ENTITY_ID", "CREATE", "UPDATE", "DELETE"];
			
			var aValidPropertiesCreateUpdateUser = ["USER_ID", "PRIVILEGE"];
			var aValidPropertiesDeleteUser = ["USER_ID"];
			var aValidPropertiesCreateUpdateGroup = ["GROUP_ID", "PRIVILEGE"];
			var aValidPropertiesDeleteGroup = ["GROUP_ID"];

			//check mandatory properties and invalid properties for privilege object
			utils.checkMandatoryProperties(oPrivilege, aMandatoryProperties);
			utils.checkInvalidProperties(oPrivilege, aValidProperties);

			//check that on the request we have at least one operation
			if(!_.has(oPrivilege, "CREATE") && !_.has(oPrivilege, "UPDATE") && !_.has(oPrivilege, "DELETE")) {
				const sLogMessage = `No operation found (create,update,delete) for privileges post service.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}			

			var aResultErrors = [];
			var oIdsCreate = { USERS: [],
							   GROUPS: []
							}; 
			var oIdsUpdate = { USERS: [],
					   		   GROUPS: []
							};  
			var oIdsDelete ={ USERS: [],
					   		  GROUPS: []
							}; 
			
			//check the batch operations
			if(_.has(oPrivilege, "CREATE")) {
				oIdsCreate = validateBodyForOperation(oPrivilege.CREATE, aValidPropertiesCreateUpdateUser, aValidPropertiesCreateUpdateGroup, MessageLibrary.Operation.CREATE, aResultErrors);
			}
			if(_.has(oPrivilege, "UPDATE")) {
				oIdsUpdate = validateBodyForOperation(oPrivilege.UPDATE, aValidPropertiesCreateUpdateUser, aValidPropertiesCreateUpdateGroup, MessageLibrary.Operation.UPDATE, aResultErrors);
			}
			if(_.has(oPrivilege, "DELETE")) {
				oIdsDelete = validateBodyForOperation(oPrivilege.DELETE, aValidPropertiesDeleteUser, aValidPropertiesDeleteGroup, MessageLibrary.Operation.DELETE, aResultErrors);
			}			

			if(aResultErrors.length > 0) {
				oServiceOutput.setStatus($.net.http.BAD_REQUEST);
				_.each(aResultErrors, function(oMsg){ 
					oServiceOutput.addMessage(oMsg);
				});
				const sLogMessage = `Errors during validation checks for privileges.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.BATCH_OPPERATION_ERROR, sLogMessage);
			} else {
				var aAllUserIds =_.union(oIdsCreate.USERS, oIdsUpdate.USERS, oIdsDelete.USERS);
	
				//check that the current user is not on the request
				if(_.includes(aAllUserIds,$.getPlcUsername())) {
					const sLogMessage = `A user cannot change his own privilege.`;
					$.trace.error(sLogMessage);			
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, aResultErrors);
				}
	
				//check that no user appears 2 times on the request
				if(aAllUserIds.length !== (oIdsCreate.USERS.length + oIdsUpdate.USERS.length + oIdsDelete.USERS.length)) {
					const sLogMessage = `A user cannot appear 2 times in the request.`;
					$.trace.error(sLogMessage);			
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, aResultErrors);
				}
				
				//check that no group appears 2 times on the request
				var aAllDifferentGroupIds =_.union(oIdsCreate.GROUPS, oIdsUpdate.GROUPS, oIdsDelete.GROUPS);
				if(aAllDifferentGroupIds.length !== (oIdsCreate.GROUPS.length + oIdsUpdate.GROUPS.length + oIdsDelete.GROUPS.length)) {
					const sLogMessage = `A group cannot appear 2 times in the request.`;
					$.trace.error(sLogMessage);			
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, aResultErrors);
				}
			}
			
			return oPrivilege;
		}

		function validateBodyForOperation(oObject, aMandatoryPropertiesUser, aMandatoryPropertiesGroup, operation, aResultErrors) {
			var aUserIds = [];
			var aGroupIds = [];

			try {
				utils.checkInvalidProperties(oObject, aValidPropertiesPrivilege);
			} catch (e) {
				utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.privilegeObject, oObject, ValidationInfoCode.INVALID_PROPERTY, aResultErrors);
			}

			if(_.has(oObject, "USER_PRIVILEGES")) {
				if(!_.isArray(oObject.USER_PRIVILEGES)){
					utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.privilegeObject, oObject, ValidationInfoCode.NOT_ARRAY, aResultErrors);
				} else {
					
					_.each(oObject.USER_PRIVILEGES, function(oObjectPrivilege) {
						checkMandatoryAndInvalidProperties(oObjectPrivilege, aMandatoryPropertiesUser, operation, aResultErrors);
						utils.checkUserId(oObjectPrivilege, operation, AuthObjectTypes.privilegeObject, aResultErrors);
						if (aResultErrors.length === 0) {
						    aUserIds.push(oObjectPrivilege.USER_ID.toUpperCase());
						}
					});
				}
			}
			
			if(_.has(oObject, "GROUP_PRIVILEGES")) {
				if(!_.isArray(oObject.GROUP_PRIVILEGES)){
					utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.privilegeObject, oObject, ValidationInfoCode.NOT_ARRAY, aResultErrors);
				} else {
					_.each(oObject.GROUP_PRIVILEGES, function(oObjectPrivilege) {
						checkMandatoryAndInvalidProperties(oObjectPrivilege, aMandatoryPropertiesGroup, operation, aResultErrors);
						if (aResultErrors.length === 0) {
						    aGroupIds.push(oObjectPrivilege.GROUP_ID.toUpperCase());
						}
					});
				}
			}
			
			return 	{ USERS: aUserIds,
					  GROUPS: aGroupIds
					};
		}
		
		function checkMandatoryAndInvalidProperties(oObjectPrivilege, aMandatoryProperties, operation, aResultErrors){
			try {
				utils.checkMandatoryProperties(oObjectPrivilege, aMandatoryProperties);
			} catch (e) {
				utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.privilegeObject, oObjectPrivilege, ValidationInfoCode.MISSING_MANDATORY_PROPERTY, aResultErrors);
			}
			try {
				utils.checkInvalidProperties(oObjectPrivilege, aMandatoryProperties);
			} catch (e) {
				utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.privilegeObject, oObjectPrivilege, ValidationInfoCode.INVALID_PROPERTY, aResultErrors);
			}
		}

	};
}

PrivilegeValidator.prototype = Object.create(PrivilegeValidator.prototype);
PrivilegeValidator.prototype.constructor = PrivilegeValidator;