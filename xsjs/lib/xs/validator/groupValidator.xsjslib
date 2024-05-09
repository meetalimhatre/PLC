const _ = $.require("lodash");

const MessageLibrary = $.require("../util/message");
const AuthObjectTypes = $.require("../util/constants").AuthObjectTypes;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const validationCode = MessageLibrary.ValidationInfoCode;
const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;

/**
 * This class constructs BusinessObjectValidator instances for the  business object type. It
 * validates the data in the body of a request. For this, the validation distinguishes the different CRUD operations
 * which can be done upon the business object.
 *
 * @constructor
 */

function GroupValidator(oPersistency, oMetadataProvider, utils) {	

	//mandatory and valid properties for the object
    const aValidPropertiesOperation = ["CREATE", "DELETE", "UPDATE"];
    const aValidPropertiesBatch = ["GROUPS", "MEMBERS", "SUBGROUPS"];
    const aValidPropertiesUpdateBatch = ["GROUPS"];

    const aMandatoryPropertiesGroup = ["GROUP_ID"];
    const aValidPropertiesGroup = ["GROUP_ID", "DESCRIPTION"]; 
    const aMandatoryPropertiesSubgroup = ["GROUP_ID", "SUBGROUP_ID"];
    const aMandatoryPropertiesMember = ["GROUP_ID", "USER_ID"];
	var aUserMembers = []; var aGroupMembers = [];
	let aGroupMetadata = oMetadataProvider.get(AuthObjectTypes.Group, AuthObjectTypes.Group, null, null, oPersistency);
	var genericSyntaxValidator = new GenericSyntaxValidator();

	/**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 *
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *            Validated request parameters.
	 * @returns
	 *			{oGroup} 
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
			var oGroup = utils.tryParseJson(oRequest.body.asString());

			//check invalid operations 
			utils.checkInvalidProperties(oGroup, aValidPropertiesOperation);			
			//check that on the request has at least one operation
			if(!_.has(oGroup, "CREATE") && !_.has(oGroup, "UPDATE") && !_.has(oGroup, "DELETE")) {
				const sLogMessage = "No valid operation (e.g. create, update, delete) found for group post service.";
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}			

			var aResultErrors = [];
			//check the batch operations
			if(_.has(oGroup, "CREATE")) {
				validateBodyForOperation(oGroup.CREATE, MessageLibrary.Operation.CREATE, aResultErrors);
			}
			if(_.has(oGroup, "DELETE")) {
				validateBodyForOperation(oGroup.DELETE, MessageLibrary.Operation.DELETE, aResultErrors);
			}	
			
			//UPDATE - can be done only for group description
			if(_.has(oGroup, "UPDATE")){
				try {
					utils.checkInvalidProperties(oGroup.UPDATE, aValidPropertiesUpdateBatch);
				} catch (e) {
					utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, MessageLibrary.Operation.UPDATE, AuthObjectTypes.groupObject, oGroup.UPDATE, validationCode.INVALID_PROPERTY, aResultErrors);
				}
				
				if(_.has(oGroup.UPDATE, "GROUPS")) {
				    if(!_.isArray(oGroup.UPDATE.GROUPS)) {
				    	utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, MessageLibrary.Operation.UPDATE, AuthObjectTypes.groupObject, oGroup.UPDATE, validationCode.NOT_ARRAY, aResultErrors);
				    } else {
						checkMandatoryAndInvalidPropertiesForObjects(oGroup.UPDATE.GROUPS, MessageLibrary.Operation.UPDATE, aMandatoryPropertiesGroup, aValidPropertiesGroup, aResultErrors);
						oGroup.UPDATE.GROUPS.forEach(oGroup => {
							try {
								checkPropertiesValues(oGroup);
							} catch (e) {
								utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, MessageLibrary.Operation.UPDATE, AuthObjectTypes.groupObject, oGroup, validationCode.VALUE_ERROR, aResultErrors);
							}
						});
				    }
				}				
			}	
			
			//TODO: check for cycles for create subgroups

			if(aResultErrors.length > 0) {
				oServiceOutput.setStatus($.net.http.BAD_REQUEST);
				_.each(aResultErrors, function(oMsg){ 
					oServiceOutput.addMessage(oMsg);
				});
				const sLogMessage = `Errors during validation checks.`;
				throw new PlcException(Code.BATCH_OPPERATION_ERROR, sLogMessage);
			} else {
				checkIfUnique(aUserMembers, "USER_ID");
				checkIfUnique(aGroupMembers, "SUBGROUP_ID");
			}

			return oGroup;
		}

		/**
	 * This function validates the properties values of the give user group
	 *
	 * @param oEntity -
	 *            The object to be validated
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */

		function checkPropertiesValues(oEntity) {
			let oGroup = JSON.parse(JSON.stringify(oEntity));
			oGroup.USERGROUP_ID =  oGroup.GROUP_ID;
			delete oGroup.GROUP_ID;
			Object.keys(oGroup).forEach( key => {
				aPropertyMetadata = _.filter(aGroupMetadata, function(oPropertyMetadataEntry) {
					return oPropertyMetadataEntry.COLUMN_ID === key;
				});
				if(aPropertyMetadata[0]){
					genericSyntaxValidator.validateValue(oGroup[key], aPropertyMetadata[0].SEMANTIC_DATA_TYPE,
						aPropertyMetadata[0].SEMANTIC_DATA_TYPE_ATTRIBUTES, false, aPropertyMetadata[0].VALIDATION_REGEX_VALUE);
				}
			});
		}


		function validateBodyForOperation(oObject, operation, aResultErrors) {
			try {
				utils.checkInvalidProperties(oObject, aValidPropertiesBatch);
			} catch (e) {
				return utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.groupObject, oObject, validationCode.INVALID_PROPERTY, aResultErrors);
			}

			if(_.has(oObject, "GROUPS")) {
				checkMandatoryAndInvalidPropertiesForObjects(oObject.GROUPS, operation, aMandatoryPropertiesGroup, aValidPropertiesGroup, aResultErrors);
				oObject.GROUPS.forEach(oGroup => {
					try {
						checkPropertiesValues(oGroup);
					} catch (e) {
						utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.groupObject, oGroup, validationCode.VALUE_ERROR, aResultErrors);
					}
				});
			}

			if(_.has(oObject, "MEMBERS")) {
				checkMandatoryAndInvalidPropertiesForObjects(oObject.MEMBERS, operation, aMandatoryPropertiesMember, aMandatoryPropertiesMember, aResultErrors);
				aUserMembers = _.union(aUserMembers, oObject.MEMBERS);
			}

			if(_.has(oObject, "SUBGROUPS")) {
				checkMandatoryAndInvalidPropertiesForObjects(oObject.SUBGROUPS, operation, aMandatoryPropertiesSubgroup, aMandatoryPropertiesSubgroup,aResultErrors);
				aGroupMembers = _.union(aGroupMembers, oObject.SUBGROUPS);
			}
		}

		function checkMandatoryAndInvalidPropertiesForObjects(aObject, operation, oMandatoryProperties, oValidProperties, aResultErrors){
			if(!_.isArray(aObject)){
				utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.groupObject, aObject, validationCode.NOT_ARRAY, aResultErrors);
			} else {
				_.each(aObject, function(oObjectEntity) {
					try {
						utils.checkMandatoryProperties(oObjectEntity, oMandatoryProperties);
					} catch (e) {
						utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.groupObject, oObjectEntity, validationCode.MISSING_MANDATORY_PROPERTY, aResultErrors);
					}
					try {
						utils.checkInvalidProperties(oObjectEntity, oValidProperties);
					} catch (e) {
						utils.createMultipleValidationErrorsResponse(Code.GENERAL_VALIDATION_ERROR.code, operation, AuthObjectTypes.groupObject, oObjectEntity, validationCode.INVALID_PROPERTY, aResultErrors);
					}
					utils.checkUserId(oObjectEntity, operation, AuthObjectTypes.groupObject, aResultErrors);
				});
			}
		}

		function checkIfUnique(aItems, object){
			let aGroupsIds = _.uniq(_.map(aItems, "GROUP_ID"));
			_.each(aGroupsIds, function(obj) {
				let aMembers = _.map(_.filter(aItems, function(member) {
					if( member.GROUP_ID === obj) {
						return member[object];
					}
				}), object);
				if(_.uniq(aMembers).length !== aMembers.length) {
					const sLogMessage = "Users/Subgroups appear multiple times for the same group.";
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
				}
			});
		}

	};
}

GroupValidator.prototype = Object.create(GroupValidator.prototype);
GroupValidator.prototype.constructor = GroupValidator;