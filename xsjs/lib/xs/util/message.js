var _ = require("lodash");

/* types of message severity */
var Severity = Object.freeze({
	INFO : 'Info',
	WARNING : 'Warning',
	ERROR : 'Error'
});

/* types of the methods. We can have CREATE, READ, UPDATE, DELETE, */
var Operation = Object.freeze({
	CREATE : 'Create',
	READ : 'Read',
	UPDATE : 'Update',
	DELETE : 'Delete',
	UPSERT : 'Upsert',
	UNKNOWN : 'Unknown'
});

/**
 * types of the messages code following naming pattern: <category>_<error_name>_<severity> =>
 * CALCULATION_UOM_NOT_FOUND_WARNING
 */
var Code = Object.freeze({
	GENERAL_VALIDATION_ERROR : {
		code : "GENERAL_VALIDATION_ERROR",
		responseCode : 500
	},
	GENERAL_BATCH_VALIDATION_ERROR : {
		code : "GENERAL_BATCH_VALIDATION_ERROR",
		responseCode : 500
	},
	GENERAL_UNEXPECTED_EXCEPTION : {
		code : "GENERAL_UNEXPECTED_EXCEPTION",
		responseCode : 500
	},
	GENERAL_SQL_INJECTION_EXCEPTION : {
		code : "GENERAL_SQL_INJECTION_EXCEPTION",
		responseCode : 500
	},
	/*
	 * 307 Temporary Redirect - used to inform user that must relogin
	 * see https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
	 * Do not define any other code with the same 307 response code
	 */
	GENERAL_SESSION_NOT_FOUND_EXCEPTION : {
		code : "GENERAL_SESSION_NOT_FOUND_EXCEPTION",
		responseCode : 307
	},
	GENERAL_GENERATION_EXCEPTION : {
		code : "GENERAL_GENERATION_EXCEPTION",
		responseCode : 500
	},
	GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR : {
		code : "GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR",
		responseCode : 404
	},
	GENERAL_METHOD_NOT_ALLOWED_ERROR : {
		code : "GENERAL_METHOD_NOT_ALLOWED_ERROR",
		responseCode : 405
	},
	GENERAL_ACCESS_DENIED : {
		code : "GENERAL_ACCESS_DENIED",
		responseCode : 403
	},
	GENERAL_ENTITY_NOT_FOUND_ERROR : {
		code : "GENERAL_ENTITY_NOT_FOUND_ERROR",
		responseCode : 404
	},
	GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR : {
		code : "GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR",
		responseCode : 404
	},
	GENERAL_REF_UOM_CURRENCY_ENTITY_NOT_FOUND_ERROR : {
		code : "GENERAL_REF_UOM_CURRENCY_ENTITY_NOT_FOUND_ERROR",
		responseCode : 404
	},
	GENERAL_ATTRIBUTE_ENTITY_NOT_FOUND_ERROR : {
		code : "GENERAL_ATTRIBUTE_ENTITY_NOT_FOUND_ERROR",
		responseCode : 404
	},
	GENERAL_FORMULA_ENTITY_NOT_FOUND_ERROR : {
		code : "GENERAL_FORMULA_ENTITY_NOT_FOUND_ERROR",
		responseCode : 404
	},
	GENERAL_ENTITY_ALREADY_EXISTS_ERROR : {
		code : "GENERAL_ENTITY_ALREADY_EXISTS_ERROR",
		responseCode : 422
	},
	GENERAL_ENTITY_NOT_CURRENT_ERROR : {
		code : "GENERAL_ENTITY_NOT_CURRENT_ERROR",
		responseCode : 400
	},
	GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR : {
		code : "GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR",
		responseCode : 400
	},
	GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR : {
		code : "GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR",
		responseCode : 403
	},
	GENERAL_SYSTEMMESSAGE_INFO : {
		code : "GENERAL_SYSTEMMESSAGE_INFO",
		responseCode : 200
	},
	GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR : {
		code : "GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR",
		responseCode : 500
	},
	GENERAL_ENTITY_PART_OF_CALCULATION_ERROR : {
		code : "GENERAL_ENTITY_PART_OF_CALCULATION_ERROR",
		responseCode : 400
	},
	// Code has to be used in special when no error handling for this case is expected in client
	GENERAL_UNIQUE_CONSTRAINT_VIOLATED_ERROR : {
		code : "GENERAL_UNIQUE_CONSTRAINT_VIOLATED_ERROR",
		responseCode : 400
	},
	CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR : {
		code : "CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR",
		responseCode : 500
	},
	CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_OVERHEAD_ERROR : {
		code : "CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_OVERHEAD_ERROR",
		responseCode : 500
	},
	ADDIN_STATUS_ALREADY_SET_INFO : {
		code : "ADDIN_STATUS_ALREADY_SET_INFO",
		responseCode : 200
	},
	STATUS_NOT_ACTIVE_ERROR : {
		code : "STATUS_NOT_ACTIVE_ERROR",
		responseCode : 500
	},
	CALCULATION_NAME_NOT_UNIQUE_ERROR : {
		code : "CALCULATION_NAME_NOT_UNIQUE_ERROR",
		responseCode : 409
	},
	CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR : {
		code : "CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_NOT_WRITABLE_ERROR : {
		code : "CALCULATIONVERSION_NOT_WRITABLE_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_IS_STILL_OPENED_ERROR : {
		code : "CALCULATIONVERSION_IS_STILL_OPENED_ERROR",
		responseCode : 400
	},
	LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR : {
		code : "LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR",
		responseCode : 400
	},
	CALCULATION_VERSION_NOT_OPEN_ERROR : {
		code : "CALCULATION_VERSION_NOT_OPEN_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_IS_FROZEN_ERROR : {
		code : "CALCULATIONVERSION_IS_FROZEN_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR : {
		code : "CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_IS_SINGLE_ERROR : {
		code : "CALCULATIONVERSION_IS_SINGLE_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_IS_TEMPORARY_ERROR : {
		code : "CALCULATIONVERSION_IS_TEMPORARY_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR : {
		code : "CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR",
		responseCode : 400
	},
	LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR : {
		code : "LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_IS_SOURCE_VERSION_INFO : {
		code : "CALCULATIONVERSION_IS_SOURCE_VERSION_INFO",
		responseCode : 200
	},
	CALCULATIONVERSION_NOT_SAVED_ERROR : {
		code : "CALCULATIONVERSION_NOT_SAVED_ERROR",
		responseCode : 400
	},
	CALCULATIONVERSION_COSTING_SHEET_SET_TO_NULL_WARNING : {
		code : "CALCULATIONVERSION_COSTING_SHEET_SET_TO_NULL_WARNING",
		responseCode : 200
	},
	CALCULATIONVERSION_COMPONENT_SPLIT_SET_TO_NULL_WARNING : {
		code : "CALCULATIONVERSION_COMPONENT_SPLIT_SET_TO_NULL_WARNING",
		responseCode : 200
	},
	CALCULATIONVERSION_ALREADY_FROZEN_INFO : {
		code : "CALCULATIONVERSION_ALREADY_FROZEN_INFO",
		responseCode : 200
	},
	CALCULATIONVERSION_ACCOUNTS_SET_TO_NULL_WARNING : {
		code : "CALCULATIONVERSION_ACCOUNTS_SET_TO_NULL_WARNING",
		responseCode : 200
	},
	DELETE_CURRENT_VERSION_ERROR : {
		code : "DELETE_CURRENT_VERSION_ERROR",
		responseCode : 400
	},
	FIRST_CALCULATIONVERSION_NOT_SAVED: {
		code : "FIRST_CALCULATIONVERSION_NOT_SAVED",
		responseCode : 400
	},
	PRICEDETERMINATION_SEQUENCE_ERROR : {
		code : "PRICEDETERMINATION_SEQUENCE_ERROR",
		responseCode : 400
	},
	DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO : {
		code : "DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO",
		responseCode : 200
	},
	DEPENDENTFIELDSDETERMINATION_PLANTS_SET_FOR_CHANGED_COMPANY_CODES_INFO : {
		code : "DEPENDENTFIELDSDETERMINATION_PLANTS_SET_FOR_CHANGED_COMPANY_CODES_INFO",
		responseCode : 200
	},
	DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO : {
		code : "DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO",
		responseCode : 200
	},
	DEPENDENTFIELDSDETERMINATION_COST_CENTER_SET_FOR_CHANGED_WORK_CENTER_INFO : {
		code : "DEPENDENTFIELDSDETERMINATION_COST_CENTER_SET_FOR_CHANGED_WORK_CENTER_INFO",
		responseCode : 200
	},
	PRICEDETERMINATION_REQUESTED_PRICESOURCE_SET_INFO : {
		code : "PRICEDETERMINATION_REQUESTED_PRICESOURCE_SET_INFO",
		responseCode : 200
	},
	PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO : {
		code : "PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO",
		responseCode : 200
	},
	PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING : {
		code : "PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING",
		responseCode : 200
	},
	PRICEDETERMINATION_NO_PRICE_FOR_PRICESOURCE_FOUND_WARNING : {
		code : "PRICEDETERMINATION_NO_PRICE_FOR_PRICESOURCE_FOUND_WARNING",
		responseCode : 200
	},
	PROJECT_IS_STILL_OPENED_ERROR : {
		code : "PROJECT_IS_STILL_OPENED_ERROR",
		responseCode : 400
	},
	ENTITY_NOT_WRITEABLE_INFO : {
		code : "ENTITY_NOT_WRITEABLE_INFO",
		responseCode : 200
	},
	ENTITY_NOT_WRITABLE_ERROR : {
		code : "ENTITY_NOT_WRITABLE_ERROR",
		responseCode : 400
	},
	PROJECT_NOT_WRITABLE_ERROR : {
		code : "PROJECT_NOT_WRITABLE_ERROR",
		responseCode : 400
	},
	PROJECT_OPEN_BY_OTHERS_INFO : {
		code : "PROJECT_OPEN_BY_OTHERS_INFO",
		responseCode : 200
	},
	PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR : {
		code : "PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR",
		responseCode : 409
	},
	PROJECT_CALCULATE_LIFECYCLEVERSION_ERROR : {
		code : "PROJECT_CALCULATE_LIFECYCLEVERSION_ERROR",
		responseCode : 500
	},
	PROJECT_CALCULATE_LIFECYCLE_MAN_DISTRIB_ERROR: {
		code: "PROJECT_CALCULATE_LIFECYCLE_MAN_DISTRIB_ERROR",
		responseCode: 400
	},
	PROJECT_SURCHARGES_ACCOUNT_GROUPS_OVERLAPPING_WARNING : {
		code : "PROJECT_SURCHARGES_ACCOUNT_GROUPS_OVERLAPPING_WARNING",
		responseCode : 200
	},
	DIFFERENT_CONTROLLING_AREA_IN_TARGET_PROJECT : {
		code : "DIFFERENT_CONTROLLING_AREA_IN_TARGET_PROJECT",
		responseCode : 400
	},
	DIFFERENT_CONTROLLING_AREA_IN_TARGET_CALCULATION_VERSION : {
		code : "DIFFERENT_CONTROLLING_AREA_IN_TARGET_CALCULATION_VERSION",
		responseCode : 400
	},
	ACCOUNTDETERMINATION_ACCOUNT_SET_INFO : {
		code : "ACCOUNTDETERMINATION_ACCOUNT_SET_INFO",
		responseCode : 200
	},
	BATCH_OPPERATION_ERROR : {
		code : "BATCH_OPPERATION_ERROR",
		responseCode : 400
	},
	VERSION_PATTERN_NOT_SUPPORTED_ERROR : {
		code : "VERSION_PATTERN_NOT_SUPPORTED_ERROR",
		responseCode : 400
	},
	UPGRADE_PREPARATION_NOT_SUPPORTED_ERROR : {
		code : "UPGRADE_PREPARATION_NOT_SUPPORTED_ERROR",
		responseCode : 500
	},
	LOGON_LANGUAGE_NOT_SUPPORTED_ERROR : {
		code : "LOGON_LANGUAGE_NOT_SUPPORTED_ERROR",
		responseCode : 400
	},
	GENERAL_ENTITY_DUPLICATE_ERROR : {
		code : "GENERAL_ENTITY_DUPLICATE_ERROR",
		responseCode : 400
	},
	SERVICE_UNAVAILABLE_ERROR : {
		code : "SERVICE_UNAVAILABLE_ERROR",
		responseCode : 503
	},
	CALCULATIONENGINE_UOM_NOT_FOUND_WARNING : {
		code : "CALCULATIONENGINE_UOM_NOT_FOUND_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_DIMENSION_NOT_FOUND_WARNING : {
		code : "CALCULATIONENGINE_DIMENSION_NOT_FOUND_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_DIMENSIONS_DO_NOT_MATCH_WARNING : {
		code : "CALCULATIONENGINE_DIMENSIONS_DO_NOT_MATCH_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_DIVISION_BY_ZERO_WARNING : {
		code : "CALCULATIONENGINE_DIVISION_BY_ZERO_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_EXCHANGERATE_NOT_DEFINED_WARNING : {
		code : "CALCULATIONENGINE_EXCHANGERATE_NOT_DEFINED_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_REQUIRED_FIELD_NOT_DEFINED_WARNING : {
		code : "CALCULATIONENGINE_REQUIRED_FIELD_NOT_DEFINED_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_INVALID_ARGUMENT_ERROR : {
		code : "CALCULATIONENGINE_INVALID_ARGUMENT_ERROR",
		responseCode : 500
	},
	CALCULATIONENGINE_SYNTAX_ERROR_WARNING : {
		code : "CALCULATIONENGINE_SYNTAX_ERROR_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_SEMANTIC_MAPPING_NOT_FOUND_WARNING : {
		code : "CALCULATIONENGINE_SEMANTIC_MAPPING_NOT_FOUND_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_SEMANTIC_MAPPING_UNDEFINED_WARNING : {
		code : "CALCULATIONENGINE_SEMANTIC_MAPPING_UNDEFINED_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_OPERAND_DATATYPES_INCOMPATIBLE_WARNING : {
		code : "CALCULATIONENGINE_OPERAND_DATATYPES_INCOMPATIBLE_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_RECIEVING_FIELD_NOT_DEFINED_WARNING : {
		code : "CALCULATIONENGINE_RECIEVING_FIELD_NOT_DEFINED_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_RECIEVING_FIELD_DATATYPE_MISMATCH_WARNING : {
		code : "CALCULATIONENGINE_RECIEVING_FIELD_DATATYPE_MISMATCH_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING : {
		code : "CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_CYCLIC_OR_UNRESOLVABLE_REFERENCE_DETECTED_WARNING : {
		code : "CALCULATIONENGINE_CYCLIC_OR_UNRESOLVABLE_REFERENCE_DETECTED_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_PRECONDITION_BREAK_FOR_REFERENCED_FIELD_WARNING : {
		code : "CALCULATIONENGINE_PRECONDITION_BREAK_FOR_REFERENCED_FIELD_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_FUNCTION_NOT_FOUND_WARNING : {
		code : "CALCULATIONENGINE_FUNCTION_NOT_FOUND_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_UOM_CONVERSION_NOT_SUPPORTED_WARNING : {
		code : "CALCULATIONENGINE_UOM_CONVERSION_NOT_SUPPORTED_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_CURRENCY_CONVERSION_NOT_SUPPORTED_WARNING : {
		code : "CALCULATIONENGINE_CURRENCY_CONVERSION_NOT_SUPPORTED_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_RESULT_OVERFLOW_WARNING : {
		code : "CALCULATIONENGINE_RESULT_OVERFLOW_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_BASE_VERSION_ITEM_NOT_FOUND_WARNING : {
		code : "CALCULATIONENGINE_BASE_VERSION_ITEM_NOT_FOUND_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_VARIANT_UNDEFINED_VALUE : {
		code : "CALCULATIONENGINE_VARIANT_UNDEFINED_VALUE",
		responseCode : 500
	},
	CALCULATIONENGINE_FIELD_IS_CALCULATED : {
		code : "CALCULATIONENGINE_FIELD_IS_CALCULATED",
		responseCode : 404
	},
	FORMULA_RESULT_NOT_BOOLEAN : {
		code : "FORMULA_RESULT_NOT_BOOLEAN",
		responseCode : 404
	},
	CALCULATIONENGINE_INVALID_VALUE_LINK_WARNING : {
		code : "CALCULATIONENGINE_INVALID_VALUE_LINK_WARNING",
		responseCode : 500
	},
	CALCULATIONENGINE_INVALID_CUSTOM_OVERHEAD_FIELD_REFERENCE : {
		code : "CALCULATIONENGINE_INVALID_CUSTOM_OVERHEAD_FIELD_REFERENCE",
		responseCode: 500
	},
	CALCULATIONENGINE_COSTING_SHEET_OVERHEAD_ROW_FORMULA_DIVISION_BY_ZERO_WARNING : {
		code : "CALCULATIONENGINE_COSTING_SHEET_OVERHEAD_ROW_FORMULA_DIVISION_BY_ZERO_WARNING",
		responseCode: 500
	},
	PLC_NOT_INITIALIZED_ERROR : {
		code : "PLC_NOT_INITIALIZED_ERROR",
		responseCode : 500
	},
	REFERENCED_CALCULATION_VALIDATION_ERROR : {
		code : "REFERENCED_CALCULATION_VALIDATION_ERROR",
		responseCode : 500
	},
	TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED : {
		code : "TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED",
		responseCode : 500
	},
	TRANSPORT_CUSTOM_FIELD_CANNOT_BE_DELETED : {
		code : "TRANSPORT_CUSTOM_FIELD_CANNOT_BE_DELETED",
		responseCode : 500
	},
	TRANSPORT_FORMULA_CANNOT_BE_MODIFIED : {
		code : "TRANSPORT_FORMULA_CANNOT_BE_MODIFIED",
		responseCode : 500
	},
	TRANSPORT_FORMULA_CANNOT_BE_DELETED : {
		code : "TRANSPORT_FORMULA_CANNOT_BE_DELETED",
		responseCode : 500
	},
	WRITE_LAYOUT_NAMING_CONFLICT : {
		code : "WRITE_LAYOUT_NAMING_CONFLICT",
		responseCode : 409
	},
	GROUPS_NOT_WRITABLE_ERROR : {
		code : "GROUPS_NOT_WRITABLE_ERROR",
		responseCode : 400
	},
	PROJECT_WITH_NO_ADMINISTRATOR_ERROR : {
		code : "PROJECT_WITH_NO_ADMINISTRATOR_ERROR",
		responseCode : 400
	},
	GROUP_CYCLE_ERROR : {
		code : "GROUP_CYCLE_ERROR",
		responseCode : 400
	},
	WRITE_FRONTEND_SETTING_NAMING_CONFLICT : {
		code : "WRITE_FRONTEND_SETTING_NAMING_CONFLICT",
		responseCode : 409
	},
	VARIANT_NAME_NOT_UNIQUE_ERROR : {
		code : "VARIANT_NAME_NOT_UNIQUE_ERROR",
		responseCode : 400
	},
	PERSONAL_DATA_IN_FORMULA : {
		code : "PERSONAL_DATA_IN_FORMULA",
		responseCode : 200
	},
	CUSTOM_FIELDS_TEXT_ERROR : {
		code : "CUSTOM_FIELDS_TEXT_ERROR",
		responseCode : 400
	},
	NUMBER_OF_VARIANTS_ERROR: {
		code : "NUMBER_OF_VARIANTS_ERROR",
		responseCode : 500
	},
	TRANSPORTATION_IMPORT_DATA_ERROR: {
		code: "TRANSPORTATION_IMPORT_DATA_ERROR",
		responseCode: 500
	},
});

/**
 * Since p_check_formulas return integer error codes, those must be mapped on real codes
 * This object is used for mapping
 */
var FormulaInterpreterErrorMapping = Object.freeze({
	'1': Code.CALCULATIONENGINE_UOM_NOT_FOUND_WARNING,
	'2': Code.CALCULATIONENGINE_DIMENSION_NOT_FOUND_WARNING,
	'3': Code.CALCULATIONENGINE_DIMENSIONS_DO_NOT_MATCH_WARNING,
	'4': Code.CALCULATIONENGINE_DIVISION_BY_ZERO_WARNING,
	'5': Code.CALCULATIONENGINE_EXCHANGERATE_NOT_DEFINED_WARNING,
	'6': Code.CALCULATIONENGINE_REQUIRED_FIELD_NOT_DEFINED_WARNING,
	'7': Code.CALCULATIONENGINE_INVALID_ARGUMENT_ERROR,
	'8': Code.CALCULATIONENGINE_SYNTAX_ERROR_WARNING,
	'9': Code.CALCULATIONENGINE_SEMANTIC_MAPPING_NOT_FOUND_WARNING,
	'10': Code.CALCULATIONENGINE_SEMANTIC_MAPPING_UNDEFINED_WARNING,
	'11': Code.CALCULATIONENGINE_OPERAND_DATATYPES_INCOMPATIBLE_WARNING,
	'12': Code.CALCULATIONENGINE_RECIEVING_FIELD_NOT_DEFINED_WARNING,
	'13': Code.CALCULATIONENGINE_RECIEVING_FIELD_DATATYPE_MISMATCH_WARNING,
	'14': Code.CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING,
	'15': Code.CALCULATIONENGINE_CYCLIC_OR_UNRESOLVABLE_REFERENCE_DETECTED_WARNING,
	'16': Code.CALCULATIONENGINE_PRECONDITION_BREAK_FOR_REFERENCED_FIELD_WARNING,
	'17': Code.CALCULATIONENGINE_FUNCTION_NOT_FOUND_WARNING,
	'18': Code.CALCULATIONENGINE_UOM_CONVERSION_NOT_SUPPORTED_WARNING,
	'19': Code.CALCULATIONENGINE_CURRENCY_CONVERSION_NOT_SUPPORTED_WARNING,
	'20': Code.CALCULATIONENGINE_RESULT_OVERFLOW_WARNING,
	'21': Code.CALCULATIONENGINE_BASE_VERSION_ITEM_NOT_FOUND_WARNING,
	'22': Code.CALCULATIONENGINE_VARIANT_UNDEFINED_VALUE,
	'23': Code.FORMULA_RESULT_NOT_BOOLEAN,
	'24': Code.CALCULATIONENGINE_FIELD_IS_CALCULATED,
	'25': Code.CALCULATIONENGINE_INVALID_VALUE_LINK_WARNING,
	'26': Code.CALCULATIONENGINE_INVALID_CUSTOM_OVERHEAD_FIELD_REFERENCE,
	/*
	*This error code is used to hide the FAKE_CUSTOM_BOOL columnId that is sent from the AFL
	*When an overhead row formula has a 0 divisor
	*This is assigned manually in the calculationVersionService when the error details contains FAKE_CUSTOM_BOOL
	*/
	'27': Code.CALCULATIONENGINE_COSTING_SHEET_OVERHEAD_ROW_FORMULA_DIVISION_BY_ZERO_WARNING
});

var ValidationInfoCode = Object.freeze({
	SYNTACTIC_ERROR : "SYNTACTIC_ERROR",
	MISSING_MANDATORY_ENTRY : "MISSING_MANDATORY_ENTRY",
	SEMANTIC_ERROR : "SEMANTIC_ERROR",
	DEPENDENCY_ERROR : "DEPENDENCY_ERROR",
	INVALID_CHARACTERS_ERROR : "INVALID_CHARACTERS_ERROR",
	OVERLAPPING_ERROR   : "OVERLAPPING_ERROR",
	METADATA_ERROR      : "METADATA_ERROR",
	SOURCE_ERP          : "SOURCE_ERP",
	READONLY_FIELD_ERROR: "READONLY_FIELD_ERROR",
	VALUE_ERROR : "VALUE_ERROR",
	INVALID_PROPERTY: "INVALID_PROPERTY",
	NOT_ARRAY: "NOT_ARRAY",
	MISSING_MANDATORY_PROPERTY: "MISSING_MANDATORY_PROPERTY"
});

var AdministrationObjType = Object.freeze({
	 MAIN_OBJ : "MainObj",
	 TEXT_OBJ : "TextObj"
});

var NotWriteableEntityDetailsCode = Object.freeze({
	 IS_FROZEN : "IS_FROZEN",
	 IS_OPENED_BY_ANOTHER_USER : "IS_OPENED_BY_ANOTHER_USER",
	 IS_OPENED_IN_ANOTHER_CONTEXT : "IS_OPENED_IN_ANOTHER_CONTEXT",
	 IS_SOURCE : "IS_SOURCE",
	 NOT_AUTHORIZED_TO_EDIT :  "NOT_AUTHORIZED_TO_EDIT",
	 IS_LIFECYCLE_VERSION : "IS_LIFECYCLE_VERSION"
});

/**
 * Object used for message details. Will be instanciated anytime a PLCError or PLCMessage is throw
 */
function Details() {
	var messageTextObj;

	var userObjs;
	/**
	 * calculationObj array will contain objects like: { id: 1, name: "Calculation1" }
	 */
	var calculationObjs;

	var calculationReferenceObjs;

	/**
	 * calculationVersionObj array will contain objects like: { id: 1, name: "Calculation1", openingUsers : [{id : U000,
	 * name : "Hans"}] }
	 */
	var calculationVersionObjs;
	/**
	 * itemObj array will contain objects like: { id: 1, name: "Calculation1" }
	 */
	var calculationVersionReferenceObjs;

	/**
	 * calculationVersionObj array will contain objects like: { id: 1, name: "Calculation1" }
	 */
	var lifecycleCalculationVersionReferenceObjs;

	// contains objects like ":{"ACCOUNT_GROUPS_WITH_OVERLAPS":["120"]}
	var lifecycleSurchargeDetailsObj;

	var itemObjs;

	var projectObjs;

	var projectReferenceObjs;

	var priceDeterminationObj;

	var accountDeterminationObj;

	var dependentFieldDeterminationObj;

	var formulaObjs;

	var metadataObjs;

	var administrationConflictDetailsObj;

	var notWriteableEntityDetailsObj;

	/**
	 * settingsObjendSettingsObjs array will contain objects like: { setting_id: -1, setting_name: "Frontend Setting" }
	 */
	var settingsObj;

	var variantObjs;

	Object.defineProperties(this, {
		"messageTextObj" : {
			get : function() {
				return messageTextObj;
			},
			enumerable : true
		},
		"businessObj" : {
			writable : true,
			enumerable : true
		},
		"preassembledMessage" : {
			writable : true,
			enumerable : true
		},
		"administrationObj" : {
			writable : true,
			enumerable : true
		},
		"administrationObjType" : {
			writable : true,
			enumerable : true
		},
		"calculationEngineObj" : {
			writable : true,
			enumerable : true
		},
		"userObjs" : {
			get : function() {
				return userObjs;
			},
			enumerable : true
		},
		"calculationObjs" : {
			get : function() {
				return calculationObjs;
			},
			enumerable : true
		},
		"calculationReferenceObjs" : {
			get : function() {
				return calculationReferenceObjs;
			},
			enumerable : true
		},
		"calculationVersionObjs" : {
			get : function() {
				return calculationVersionObjs;
			},
			enumerable : true
		},
		"calculationVersionReferenceObjs" : {
			get : function() {
				return calculationVersionReferenceObjs;
			},
			enumerable : true
		},
		"lifecycleCalculationVersionReferenceObjs" : {
			get : function() {
				return lifecycleCalculationVersionReferenceObjs;
			},
			enumerable : true
		},
		"lifecycleSurchargeDetailsObj" : {
			get : function() {
				return lifecycleSurchargeDetailsObj;
			},
			enumerable : true
		},
		"itemObjs" : {
			get : function() {
				return itemObjs;
			},
			enumerable : true
		},
		"projectObjs" : {
			get : function() {
				return projectObjs;
			},
			enumerable : true
		},
		"projectReferenceObjs" : {
			get : function() {
				return projectReferenceObjs;
			},
			enumerable : true
		},
		"formulaObjs" : {
			get : function() {
				return formulaObjs;
			},
			enumerable : true
		},
		"metadataObjs" : {
			get : function() {
				return metadataObjs;
			},
			enumerable : true
		},
		"notWriteableEntityDetailsObj" : {
			get : function() {
				return notWriteableEntityDetailsObj;
			},
			enumerable : true
		},
		"priceDeterminationObj" : {
			get : function() {
				return priceDeterminationObj;
			},
			enumerable : true
		},
		"accountDeterminationObj" : {
			get : function() {
				return accountDeterminationObj;
			},
			enumerable : true
		},
		"dependentFieldDeterminationObj" : {
			get : function() {
				return dependentFieldDeterminationObj;
			},
			enumerable : true
		},
		"validationObj" : {
			writable : true,
			enumerable : true
		},
		"administrationConflictDetailsObj" : {
			writable : true,
			enumerable : true
		},
		"settingsObj" : {
			get : function() {
				return settingsObj;
			},
			enumerable : true
		},
		"variantObjs" : {
			get : function() {
				return variantObjs;
			},
			enumerable : true
		},
	});

	this.setMessageText = function(sMessageText) {
		messageTextObj = sMessageText;
		return this;
	};


	this.addUserObj = function(oUserObj) {
		if (userObjs === undefined) {
			userObjs = [];
		}
		userObjs.push(oUserObj);
		return this;
	};

	this.addCalculationObjs = function(oCalculationObj) {
		if (calculationObjs === undefined) {
			calculationObjs = [];
		}
		calculationObjs.push(oCalculationObj);
		return this;
	};

	this.addCalculationReferenceObjs = function(oCalculationObj) {
		if (calculationReferenceObjs === undefined) {
			calculationReferenceObjs = [];
		}
		calculationReferenceObjs.push(oCalculationObj);
		return this;
	};

    this.addVariantObjs = function(oVariantObj) {
		if (variantObjs === undefined) {
			variantObjs = [];
		}
		variantObjs.push(oVariantObj);
		return this;
	};

	this.addCalculationVersionObjs = function(oCalculationVersionObj) {
		if (calculationVersionObjs === undefined) {
			calculationVersionObjs = [];
		}
		calculationVersionObjs.push(oCalculationVersionObj);
		return this;
	};

	this.addCalculationVersionReferenceObjs = function(oCalculationVersionObj) {
		if (calculationVersionReferenceObjs === undefined) {
			calculationVersionReferenceObjs = [];
		}
		calculationVersionReferenceObjs.push(oCalculationVersionObj);
		return this;
	};

	this.addLifecycleCalculationVersionReferenceObjs = function(oCalculationVersionObj) {
		if (lifecycleCalculationVersionReferenceObjs === undefined) {
			lifecycleCalculationVersionReferenceObjs = [];
		}
		lifecycleCalculationVersionReferenceObjs.push(oCalculationVersionObj);
		return this;
	};

	this.setLifecycleSurchargeDetailsObj = function(oOverlaps) {
		lifecycleSurchargeDetailsObj = oOverlaps;
		return this;
	};

	this.addItemObjs = function(oItemObjs) {
		if (itemObjs === undefined) {
			itemObjs = [];
		}
		itemObjs.push(oItemObjs);
		return this;
	};

	this.addProjectObjs = function(oProjectObjs) {
		if (projectObjs === undefined) {
			projectObjs = [];
		}
		projectObjs.push(oProjectObjs);
		return this;
	};

	this.addProjectReferenceObjs = function(oProjectObjs) {
		if (projectReferenceObjs === undefined) {
			projectReferenceObjs = [];
		}
		projectReferenceObjs .push(oProjectObjs);
		return this;
	};

	this.addFormulaObjs = function(oFormulaObjs) {
		if (formulaObjs === undefined) {
			formulaObjs = [];
		}
		formulaObjs.push(oFormulaObjs);
		return this;
	};

	this.addMetadataObjs = function(oMetadataObjs) {
		if (metadataObjs === undefined) {
			metadataObjs = [];
		}
		metadataObjs.push(oMetadataObjs);
		return this;
	};

	this.setPriceDeterminationObj = function(oPriceDeterminationObj) {
		priceDeterminationObj = oPriceDeterminationObj;
		return this;
	};

	this.setAccountDeterminationObj = function(oAccountDeterminationObj) {
		accountDeterminationObj = oAccountDeterminationObj;
		return this;
	};

	this.setDependentFieldDeterminationObj = function(oDependentFieldDeterminationObj) {
		dependentFieldDeterminationObj = oDependentFieldDeterminationObj;
		return this;
	};

	this.setNotWriteableEntityDetailsObj = function(oNotWriteableEntityDetailsObj) {
		notWriteableEntityDetailsObj = oNotWriteableEntityDetailsObj;
		return this;
	};

	this.addSettingsObj = function(oFrontendSettingsObj) {
		if (settingsObj === undefined) {
			settingsObj = [];
		}
		settingsObj.push(oFrontendSettingsObj);
		return this;
	};
}


/**
 * Base object for all PLC Messages
 *
 * @oCode {message_codes} Message code
 * @sSeverity {string} Message severity
 * @oDetails {JSON} object that will contain PLCCODE, PLCTYPE, MESSAGE and message_details
 * @sOperation operation that has been requested Ex: { "message_code": 500, "message_type": 'Error', "message_severity":
 *             'Error', "message_details": { "CalculationId": 1, "CalculationName": "Test1", "CalculationVersions":
 *             [Calculation1, Calculation2] } }
 */
function Message(oCode, sSeverity, oDetails, sOperation) {

	this.code = oCode.code;
	this.severity = sSeverity;
	this.details = oDetails;
	this.operation = sOperation;
}
Message.prototype = Object.create(Message.prototype);
Message.prototype.constructor = Message;

Message.fromPlcException = function(oPlcException) {
    return new Message(oPlcException.code, Severity.ERROR, oPlcException.details, oPlcException.operation);
};


/**
 * General error. It will be thrown from the the any layer of the application.
 *
 * @oCode {message_codes} Message code
 * @sMessage {string} message used for client log messages
 * @oDetails {JSON} object of type Details that contains PLCCODE, PLCTYPE, MESSAGE and message_details
 * @sOperation CRUD operation that was requested on this entity
 * @oInnerException inner exception passed here
 */
function PlcException(oCode, sMessage, oDetails, sOperation, oInnerException) {
	this.code = oCode;
	this.developerMessage = sMessage;

	this.details = oDetails;
	if( ! (_.isUndefined(sMessage) || _.isNull(sMessage) || sMessage === "")){
	    if(_.isUndefined(this.details) || _.isNull(this.details)) {
			this.details = new Details();
		}
		//TODO: the check was introduced since some services deliver a wrong oDetails object. This should be replaced with the check for oDetails object and adjusting of the services.
		if(this.details.hasOwnProperty("messageTextObj") === true){
		    this.details.setMessageText(sMessage);
		}
	}
	this.operation = sOperation;
	this.innerException = oInnerException;
	if (_.isNull(oInnerException) || _.isUndefined(oInnerException)) {
		this.stack = (new Error()).stack;
	} else {
		this.stack = oInnerException.stack;
	}
}
PlcException.prototype = Object.create(Error.prototype);
PlcException.prototype.constructor = PlcException;


module.exports.Severity = Severity;
module.exports.Operation = Operation;
module.exports.Code = Code;
module.exports.FormulaInterpreterErrorMapping = FormulaInterpreterErrorMapping;
module.exports.ValidationInfoCode = ValidationInfoCode;
module.exports.AdministrationObjType = AdministrationObjType;
module.exports.NotWriteableEntityDetailsCode = NotWriteableEntityDetailsCode;
module.exports.Details = Details;
module.exports.Message = Message;
module.exports.PlcException = PlcException;
