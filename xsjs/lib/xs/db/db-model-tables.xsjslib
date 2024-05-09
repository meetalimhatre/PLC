// This is a generated file. DO NOT EDIT!
// Generator: /SAP_Product_Costing/Tools/PowerDesignerConverter
//
// Generation date: 19.06.2016
// Model name:      PLC_DataModel_Version_v1_2
// Model version:   33

var mDataModel ={
	"t_account": {
		"columns":["ACCOUNT_ID","CONTROLLING_AREA_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["ACCOUNT_ID","CONTROLLING_AREA_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_account__text": {
		"columns":["ACCOUNT_ID","CONTROLLING_AREA_ID","LANGUAGE","ACCOUNT_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["ACCOUNT_ID","CONTROLLING_AREA_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_account_account_group": {
		"columns":["FROM_ACCOUNT_ID","TO_ACCOUNT_ID","ACCOUNT_GROUP_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["FROM_ACCOUNT_ID","ACCOUNT_GROUP_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_account_group": {
		"columns":["ACCOUNT_GROUP_ID","CONTROLLING_AREA_ID","COST_PORTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["ACCOUNT_GROUP_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_account_group__text": {
		"columns":["ACCOUNT_GROUP_ID","LANGUAGE","ACCOUNT_GROUP_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["ACCOUNT_GROUP_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_component_split_account_group": {
		"columns":["ACCOUNT_GROUP_ID","COMPONENT_SPLIT_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["ACCOUNT_GROUP_ID","COMPONENT_SPLIT_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_activity_price": {
		"columns":["PRICE_ID","PRICE_SOURCE_ID","CONTROLLING_AREA_ID","COST_CENTER_ID","ACTIVITY_TYPE_ID","PROJECT_ID","VALID_FROM","VALID_TO","VALID_FROM_QUANTITY","VALID_TO_QUANTITY","PRICE_FIXED_PORTION","PRICE_VARIABLE_PORTION","TRANSACTION_CURRENCY_ID","PRICE_UNIT","PRICE_UNIT_UOM_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PRICE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_activity_type": {
		"columns":["ACTIVITY_TYPE_ID","CONTROLLING_AREA_ID","ACCOUNT_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["ACTIVITY_TYPE_ID","CONTROLLING_AREA_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_activity_type__text": {
		"columns":["ACTIVITY_TYPE_ID","CONTROLLING_AREA_ID","LANGUAGE","ACTIVITY_TYPE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["ACTIVITY_TYPE_ID","CONTROLLING_AREA_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_addin_configuration_header": {
		"columns":["ADDIN_GUID","ADDIN_MAJOR_VERSION","ADDIN_MINOR_VERSION","ADDIN_REVISION_NUMBER","ADDIN_BUILD_NUMBER","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY"],
		"primaryKeys":["ADDIN_GUID","ADDIN_MAJOR_VERSION","ADDIN_MINOR_VERSION","ADDIN_REVISION_NUMBER","ADDIN_BUILD_NUMBER"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_addin_configuration_items": {
		"columns":["ADDIN_GUID","ADDIN_MAJOR_VERSION","ADDIN_MINOR_VERSION","ADDIN_REVISION_NUMBER","ADDIN_BUILD_NUMBER","CONFIG_KEY","CONFIG_VALUE"],
		"primaryKeys":["ADDIN_GUID","ADDIN_MAJOR_VERSION","ADDIN_MINOR_VERSION","ADDIN_REVISION_NUMBER","ADDIN_BUILD_NUMBER","CONFIG_KEY"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_addin_version": {
		"columns":["ADDIN_GUID","ADDIN_MAJOR_VERSION","ADDIN_MINOR_VERSION","ADDIN_REVISION_NUMBER","ADDIN_BUILD_NUMBER","NAME","FULL_QUALIFIED_NAME","DESCRIPTION","PUBLISHER","STATUS","CERTIFICATE_ISSUER","CERTIFICATE_SUBJECT","CERTIFICATE_VALID_FROM","CERTIFICATE_VALID_TO","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY"],
		"primaryKeys":["ADDIN_GUID","ADDIN_MAJOR_VERSION","ADDIN_MINOR_VERSION","ADDIN_REVISION_NUMBER","ADDIN_BUILD_NUMBER"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_application_timeout": {
		"columns":["APPLICATION_TIMEOUT_ID","VALUE_IN_SECONDS","TIMEOUT_DESCRIPTION"],
		"primaryKeys":["APPLICATION_TIMEOUT_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_business_area": {
		"columns":["BUSINESS_AREA_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["BUSINESS_AREA_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_business_area__text": {
		"columns":["BUSINESS_AREA_ID","LANGUAGE","BUSINESS_AREA_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["BUSINESS_AREA_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_process": {
		"columns":["PROCESS_ID","CONTROLLING_AREA_ID","ACCOUNT_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PROCESS_ID","CONTROLLING_AREA_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_process__text": {
		"columns":["PROCESS_ID","CONTROLLING_AREA_ID","LANGUAGE","PROCESS_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PROCESS_ID","CONTROLLING_AREA_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_calculation": {
		"columns":["CALCULATION_ID","PROJECT_ID","CALCULATION_NAME","CURRENT_CALCULATION_VERSION_ID","CONTROLLING_AREA_ID","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY"],
		"primaryKeys":["CALCULATION_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_calculation_version": {
		"columns":["CALCULATION_VERSION_ID","CALCULATION_ID","CALCULATION_VERSION_NAME","ROOT_ITEM_ID","CUSTOMER_ID","SALES_DOCUMENT","SALES_PRICE","SALES_PRICE_CURRENCY_ID","REPORT_CURRENCY_ID","COSTING_SHEET_ID","COMPONENT_SPLIT_ID","START_OF_PRODUCTION","END_OF_PRODUCTION","VALUATION_DATE","LAST_MODIFIED_ON","LAST_MODIFIED_BY","MASTER_DATA_TIMESTAMP","IS_FROZEN","EXCHANGE_RATE_TYPE_ID", "MATERIAL_PRICE_STRATEGY_ID", "ACTIVITY_PRICE_STRATEGY_ID"],
		"primaryKeys":["CALCULATION_VERSION_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_calculation_version_temporary": {
		"columns":["SESSION_ID","CALCULATION_VERSION_ID","CALCULATION_ID","CALCULATION_VERSION_NAME","ROOT_ITEM_ID","CUSTOMER_ID","SALES_DOCUMENT","SALES_PRICE","SALES_PRICE_CURRENCY_ID","REPORT_CURRENCY_ID","COSTING_SHEET_ID","COMPONENT_SPLIT_ID","START_OF_PRODUCTION","END_OF_PRODUCTION","VALUATION_DATE","LAST_MODIFIED_ON","LAST_MODIFIED_BY","MASTER_DATA_TIMESTAMP","IS_FROZEN","EXCHANGE_RATE_TYPE_ID"],
		"primaryKeys":["SESSION_ID","CALCULATION_VERSION_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_company_code": {
		"columns":["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COMPANY_CODE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_company_code__text": {
		"columns":["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COMPANY_CODE_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_component_split": {
		"columns":["COMPONENT_SPLIT_ID","CONTROLLING_AREA_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COMPONENT_SPLIT_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_component_split__text": {
		"columns":["COMPONENT_SPLIT_ID","LANGUAGE","COMPONENT_SPLIT_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COMPONENT_SPLIT_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_confidence_level": {
		"columns":["CONFIDENCE_LEVEL_ID"],
		"primaryKeys":["CONFIDENCE_LEVEL_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_confidence_level__text": {
		"columns":["CONFIDENCE_LEVEL_ID","LANGUAGE","CONFIDENCE_LEVEL_DESCRIPTION"],
		"primaryKeys":["CONFIDENCE_LEVEL_ID","LANGUAGE"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_controlling_area": {
		"columns":["CONTROLLING_AREA_ID","CONTROLLING_AREA_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["CONTROLLING_AREA_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_controlling_area__text": {
		"columns":["CONTROLLING_AREA_ID","LANGUAGE","CONTROLLING_AREA_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["CONTROLLING_AREA_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_cost_center": {
		"columns":["COST_CENTER_ID","CONTROLLING_AREA_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COST_CENTER_ID","CONTROLLING_AREA_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_cost_center__text": {
		"columns":["COST_CENTER_ID","CONTROLLING_AREA_ID","LANGUAGE","COST_CENTER_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COST_CENTER_ID","CONTROLLING_AREA_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet": {
		"columns":["COSTING_SHEET_ID","CONTROLLING_AREA_ID","IS_TOTAL_COST2_ENABLED","IS_TOTAL_COST3_ENABLED","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COSTING_SHEET_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet__text": {
		"columns":["COSTING_SHEET_ID","LANGUAGE","COSTING_SHEET_DESCRIPTION","TOTAL_COST2_DESCRIPTION","TOTAL_COST3_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COSTING_SHEET_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet_base": {
		"columns":["COSTING_SHEET_BASE_ID","COST_PORTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COSTING_SHEET_BASE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet_base_row": {
		"columns":["COSTING_SHEET_BASE_ID","ITEM_CATEGORY_ID","SUBITEM_STATE","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY","CHILD_ITEM_CATEGORY_ID"],
		"primaryKeys":["COSTING_SHEET_BASE_ID","ITEM_CATEGORY_ID","_VALID_FROM","CHILD_ITEM_CATEGORY_ID"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet_overhead": {
		"columns":["COSTING_SHEET_OVERHEAD_ID","CREDIT_ACCOUNT_ID","CREDIT_FIXED_COST_PORTION","IS_ROLLED_UP","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COSTING_SHEET_OVERHEAD_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet_overhead_row": {
		"columns":["COSTING_SHEET_OVERHEAD_ROW_ID","COSTING_SHEET_OVERHEAD_ID","VALID_FROM","VALID_TO","CONTROLLING_AREA_ID","COMPANY_CODE_ID","BUSINESS_AREA_ID","PROFIT_CENTER_ID","PLANT_ID","OVERHEAD_GROUP_ID","OVERHEAD_PERCENTAGE","PROJECT_ID","OVERHEAD_QUANTITY_BASED","OVERHEAD_CURRENCY_ID","OVERHEAD_PRICE_UNIT","OVERHEAD_PRICE_UNIT_UOM_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COSTING_SHEET_OVERHEAD_ROW_ID","COSTING_SHEET_OVERHEAD_ID","VALID_FROM","VALID_TO","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet_row": {
		"columns":["COSTING_SHEET_ROW_ID","COSTING_SHEET_ID","COSTING_SHEET_ROW_TYPE","COSTING_SHEET_BASE_ID","ACCOUNT_GROUP_AS_BASE_ID","COSTING_SHEET_OVERHEAD_ID","CALCULATION_ORDER","IS_RELEVANT_FOR_TOTAL","IS_RELEVANT_FOR_TOTAL2","IS_RELEVANT_FOR_TOTAL3","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COSTING_SHEET_ROW_ID","COSTING_SHEET_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet_row__text": {
		"columns":["COSTING_SHEET_ID","COSTING_SHEET_ROW_ID","LANGUAGE","COSTING_SHEET_ROW_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["COSTING_SHEET_ID","COSTING_SHEET_ROW_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_costing_sheet_row_dependencies": {
		"columns":["SOURCE_ROW_ID","TARGET_ROW_ID","COSTING_SHEET_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["SOURCE_ROW_ID","TARGET_ROW_ID","COSTING_SHEET_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_currency": {
		"columns":["CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["CURRENCY_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_currency__text": {
		"columns":["CURRENCY_ID","LANGUAGE","CURRENCY_CODE","CURRENCY_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["CURRENCY_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_currency_conversion": {
		"columns":["EXCHANGE_RATE_TYPE_ID","FROM_CURRENCY_ID","TO_CURRENCY_ID","FROM_FACTOR","TO_FACTOR","RATE","VALID_FROM","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["EXCHANGE_RATE_TYPE_ID","FROM_CURRENCY_ID","TO_CURRENCY_ID","VALID_FROM","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_customer": {
		"columns":["CUSTOMER_ID","CUSTOMER_NAME","COUNTRY","POSTAL_CODE","REGION","CITY","STREET_NUMBER_OR_PO_BOX","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["CUSTOMER_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_default_settings": {
		"columns":["USER_ID","CONTROLLING_AREA_ID","COMPANY_CODE_ID","PLANT_ID","REPORT_CURRENCY_ID","COMPONENT_SPLIT_ID","COSTING_SHEET_ID"],
		"primaryKeys":["USER_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_dimension": {
		"columns":["DIMENSION_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DIMENSION_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_dimension__text": {
		"columns":["DIMENSION_ID","LANGUAGE","DIMENSION_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DIMENSION_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_document": {
		"columns":["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","IS_CREATED_VIA_CAD_INTEGRATION","DOCUMENT_STATUS_ID","DESIGN_OFFICE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_document__text": {
		"columns":["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","LANGUAGE","DOCUMENT_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_document_material": {
		"columns":["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_document_status": {
		"columns":["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_document_status__text": {
		"columns":["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DOCUMENT_STATUS_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_document_type": {
		"columns":["DOCUMENT_TYPE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DOCUMENT_TYPE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_document_type__text": {
		"columns":["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DOCUMENT_TYPE_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_formula": {
		"columns":["FORMULA_ID","PATH","BUSINESS_OBJECT","COLUMN_ID","ITEM_CATEGORY_ID","IS_FORMULA_USED","FORMULA_STRING","FORMULA_DESCRIPTION"],
		"primaryKeys":["FORMULA_ID"],
		"isVersionedTable":false,
		"hasStagingTable":true
	},
	"t_initialization_state": {
		"columns":["PLC_VERSION","GENERATION_TIME"],
		"primaryKeys":[],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_item": {
		"columns":["ITEM_ID","CALCULATION_VERSION_ID","PARENT_ITEM_ID","PREDECESSOR_ITEM_ID","IS_ACTIVE","ITEM_CATEGORY_ID","ITEM_DESCRIPTION","COMMENT","ACCOUNT_ID","DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","DOCUMENT_STATUS_ID","DESIGN_OFFICE_ID","MATERIAL_ID","MATERIAL_TYPE_ID","MATERIAL_GROUP_ID","OVERHEAD_GROUP_ID","VALUATION_CLASS_ID","PURCHASING_GROUP","PURCHASING_DOCUMENT","LOCAL_CONTENT","ACTIVITY_TYPE_ID","PROCESS_ID","LOT_SIZE","LOT_SIZE_CALCULATED","LOT_SIZE_IS_MANUAL","ENGINEERING_CHANGE_NUMBER_ID","COMPANY_CODE_ID","COST_CENTER_ID","PLANT_ID","WORK_CENTER_ID","BUSINESS_AREA_ID","PROFIT_CENTER_ID","QUANTITY","QUANTITY_CALCULATED","QUANTITY_IS_MANUAL","QUANTITY_UOM_ID","TOTAL_QUANTITY","TOTAL_QUANTITY_UOM_ID","TOTAL_QUANTITY_DEPENDS_ON","IS_RELEVANT_TO_COSTING_IN_ERP","BASE_QUANTITY","BASE_QUANTITY_CALCULATED","BASE_QUANTITY_IS_MANUAL","QUANTITY_PER_BASE_UNIT","QUANTITY_PER_BASE_UNIT_UOM_ID","PRICE_FIXED_PORTION","PRICE_FIXED_PORTION_CALCULATED","PRICE_FIXED_PORTION_IS_MANUAL","PRICE_VARIABLE_PORTION","PRICE_VARIABLE_PORTION_CALCULATED","PRICE_VARIABLE_PORTION_IS_MANUAL","PRICE","TRANSACTION_CURRENCY_ID","PRICE_UNIT","PRICE_UNIT_CALCULATED","PRICE_UNIT_IS_MANUAL","PRICE_UNIT_UOM_ID","CONFIDENCE_LEVEL_ID","PRICE_SOURCE_ID","PRICE_SOURCE_TYPE_ID","IS_DISABLING_PRICE_DETERMINATION","VENDOR_ID","TARGET_COST","TARGET_COST_CALCULATED","TARGET_COST_IS_MANUAL","TARGET_COST_CURRENCY_ID","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY","PRICE_FOR_TOTAL_QUANTITY","PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION","PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION","OTHER_COST","OTHER_COST_FIXED_PORTION","OTHER_COST_VARIABLE_PORTION","TOTAL_COST","TOTAL_COST_FIXED_PORTION","TOTAL_COST_VARIABLE_PORTION","CHILD_ITEM_CATEGORY_ID"],
		"primaryKeys":["ITEM_ID","CALCULATION_VERSION_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_item__text": {
		"columns":["ITEM_ID","CALCULATION_VERSION_ID","LANGUAGE","ITEM_DESCRIPTION","COMMENT"],
		"primaryKeys":["ITEM_ID","CALCULATION_VERSION_ID","LANGUAGE"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_item_calculated_values_component_split": {
		"columns":["ITEM_ID","CALCULATION_VERSION_ID","COMPONENT_SPLIT_ID","COST_COMPONENT_ID","ACCOUNT_ID","COST","COST_FIXED_PORTION","COST_VARIABLE_PORTION"],
		"primaryKeys":["ITEM_ID","CALCULATION_VERSION_ID","COMPONENT_SPLIT_ID","COST_COMPONENT_ID","ACCOUNT_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_item_calculated_values_costing_sheet": {
		"columns":["ITEM_ID","CALCULATION_VERSION_ID","COSTING_SHEET_ROW_ID","COSTING_SHEET_OVERHEAD_ROW_ID","ACCOUNT_ID","IS_ROLLED_UP_VALUE","HAS_SUBITEMS","COST","COST_FIXED_PORTION","COST_VARIABLE_PORTION"],
		"primaryKeys":["ITEM_ID","CALCULATION_VERSION_ID","COSTING_SHEET_ROW_ID","COSTING_SHEET_OVERHEAD_ROW_ID","ACCOUNT_ID","IS_ROLLED_UP_VALUE"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_item_category": {
		"columns":["ITEM_CATEGORY_ID","DISPLAY_ORDER","CHILD_ITEM_CATEGORY_ID","ICON","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY"],
		"primaryKeys":["ITEM_CATEGORY_ID","CHILD_ITEM_CATEGORY_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_item_category__text": {
		"columns":["ITEM_CATEGORY_ID","LANGUAGE","ITEM_CATEGORY_DESCRIPTION","CHILD_ITEM_CATEGORY_ID","ITEM_CATEGORY_NAME"],
		"primaryKeys":["ITEM_CATEGORY_ID","LANGUAGE","CHILD_ITEM_CATEGORY_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_item_temporary": {
		"columns":["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID","PARENT_ITEM_ID","PREDECESSOR_ITEM_ID","IS_ACTIVE","ITEM_CATEGORY_ID","ITEM_DESCRIPTION","COMMENT","ACCOUNT_ID","DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","DOCUMENT_STATUS_ID","DESIGN_OFFICE_ID","MATERIAL_ID","MATERIAL_TYPE_ID","MATERIAL_GROUP_ID","OVERHEAD_GROUP_ID","VALUATION_CLASS_ID","PURCHASING_GROUP","PURCHASING_DOCUMENT","LOCAL_CONTENT","ACTIVITY_TYPE_ID","PROCESS_ID","LOT_SIZE","LOT_SIZE_CALCULATED","LOT_SIZE_IS_MANUAL","ENGINEERING_CHANGE_NUMBER_ID","COMPANY_CODE_ID","COST_CENTER_ID","PLANT_ID","WORK_CENTER_ID","BUSINESS_AREA_ID","PROFIT_CENTER_ID","QUANTITY","QUANTITY_CALCULATED","QUANTITY_IS_MANUAL","QUANTITY_UOM_ID","TOTAL_QUANTITY","TOTAL_QUANTITY_UOM_ID","TOTAL_QUANTITY_DEPENDS_ON","IS_RELEVANT_TO_COSTING_IN_ERP","BASE_QUANTITY","BASE_QUANTITY_CALCULATED","BASE_QUANTITY_IS_MANUAL","QUANTITY_PER_BASE_UNIT","QUANTITY_PER_BASE_UNIT_UOM_ID","PRICE_FIXED_PORTION","PRICE_FIXED_PORTION_CALCULATED","PRICE_FIXED_PORTION_IS_MANUAL","PRICE_VARIABLE_PORTION","PRICE_VARIABLE_PORTION_CALCULATED","PRICE_VARIABLE_PORTION_IS_MANUAL","PRICE","TRANSACTION_CURRENCY_ID","PRICE_UNIT","PRICE_UNIT_CALCULATED","PRICE_UNIT_IS_MANUAL","PRICE_UNIT_UOM_ID","CONFIDENCE_LEVEL_ID","PRICE_SOURCE_ID","PRICE_SOURCE_TYPE_ID","IS_DISABLING_PRICE_DETERMINATION","VENDOR_ID","TARGET_COST","TARGET_COST_CALCULATED","TARGET_COST_IS_MANUAL","TARGET_COST_CURRENCY_ID","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY","PRICE_FOR_TOTAL_QUANTITY","PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION","PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION","OTHER_COST","OTHER_COST_FIXED_PORTION","OTHER_COST_VARIABLE_PORTION","TOTAL_COST","TOTAL_COST_FIXED_PORTION","TOTAL_COST_VARIABLE_PORTION","IS_DIRTY","IS_DELETED","CHILD_ITEM_CATEGORY_ID"],
		"primaryKeys":["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_design_office": {
		"columns":["DESIGN_OFFICE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DESIGN_OFFICE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_design_office__text": {
		"columns":["DESIGN_OFFICE_ID","LANGUAGE","DESIGN_OFFICE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["DESIGN_OFFICE_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_language": {
		"columns":["LANGUAGE","TEXTS_MAINTAINABLE","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY","MAPPING_LANGUAGE_ID"],
		"primaryKeys":["LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_layout": {
		"columns":["LAYOUT_NAME","USER_ID"],
		"primaryKeys":["LAYOUT_NAME","USER_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_layout_side_panel": {
		"columns":["LAYOUT_NAME","USER_ID","TABLE_ID","COLUMN_ID","SIDE_PANEL_GROUP_ID","SIDE_PANEL_DISPLAY_ORDER"],
		"primaryKeys":["LAYOUT_NAME","USER_ID","TABLE_ID","COLUMN_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_layout_treetable": {
		"columns":["LAYOUT_NAME","USER_ID","TABLE_ID","COLUMN_ID","TREETABLE_DISPLAY_ORDER","COLUMN_WIDTH"],
		"primaryKeys":["LAYOUT_NAME","USER_ID","TABLE_ID","COLUMN_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_lock": {
		"columns":["LOCK_OBJECT","USER_ID","LAST_UPDATED_ON"],
		"primaryKeys":["LOCK_OBJECT","USER_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_installation_log": {
		"columns":["VERSION","VERSION_SP","VERSION_PATCH","NAME","TIME","EXECUTED_BY","STEP","STATE"],
		"primaryKeys":["VERSION","VERSION_SP","VERSION_PATCH","NAME","TIME"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_material": {
		"columns":["MATERIAL_ID","BASE_UOM_ID","MATERIAL_GROUP_ID","MATERIAL_TYPE_ID","IS_CREATED_VIA_CAD_INTEGRATION","IS_PHANTOM_MATERIAL","IS_CONFIGURABLE_MATERIAL","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["MATERIAL_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_material__text": {
		"columns":["MATERIAL_ID","LANGUAGE","MATERIAL_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["MATERIAL_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_material_account_determination": {
		"columns":["CONTROLLING_AREA_ID","MATERIAL_TYPE_ID","PLANT_ID","VALUATION_CLASS_ID","ACCOUNT_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["CONTROLLING_AREA_ID","MATERIAL_TYPE_ID","PLANT_ID","VALUATION_CLASS_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_material_group": {
		"columns":["MATERIAL_GROUP_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["MATERIAL_GROUP_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_material_group__text": {
		"columns":["MATERIAL_GROUP_ID","LANGUAGE","MATERIAL_GROUP_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["MATERIAL_GROUP_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_material_plant": {
		"columns":["MATERIAL_ID","PLANT_ID","OVERHEAD_GROUP_ID","VALUATION_CLASS_ID","MATERIAL_LOT_SIZE","MATERIAL_LOT_SIZE_UOM_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["MATERIAL_ID","PLANT_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_material_type": {
		"columns":["MATERIAL_TYPE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["MATERIAL_TYPE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_material_type__text": {
		"columns":["MATERIAL_TYPE_ID","LANGUAGE","MATERIAL_TYPE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["MATERIAL_TYPE_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_metadata": {
		"columns":["PATH","BUSINESS_OBJECT","COLUMN_ID","IS_CUSTOM","ROLLUP_TYPE_ID","SIDE_PANEL_GROUP_ID","DISPLAY_ORDER","TABLE_DISPLAY_ORDER","REF_UOM_CURRENCY_PATH","REF_UOM_CURRENCY_BUSINESS_OBJECT","REF_UOM_CURRENCY_COLUMN_ID","UOM_CURRENCY_FLAG","SEMANTIC_DATA_TYPE","SEMANTIC_DATA_TYPE_ATTRIBUTES","VALIDATION_REGEX_ID","PROPERTY_TYPE","IS_IMMUTABLE_AFTER_SAVE","IS_REQUIRED_IN_MASTERDATA","IS_WILDCARD_ALLOWED","IS_USABLE_IN_FORMULA","RESOURCE_KEY_DISPLAY_NAME","RESOURCE_KEY_DISPLAY_DESCRIPTION","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY"],
		"primaryKeys":["PATH","BUSINESS_OBJECT","COLUMN_ID"],
		"isVersionedTable":false,
		"hasStagingTable":true
	},
	"t_metadata__text": {
		"columns":["PATH","COLUMN_ID","LANGUAGE","DISPLAY_NAME","DISPLAY_DESCRIPTION","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY"],
		"primaryKeys":["PATH","COLUMN_ID","LANGUAGE"],
		"isVersionedTable":false,
		"hasStagingTable":true
	},
	"t_metadata_item_attributes": {
		"columns":["PATH","BUSINESS_OBJECT","COLUMN_ID","ITEM_CATEGORY_ID","SUBITEM_STATE","IS_MANDATORY","IS_READ_ONLY","IS_TRANSFERABLE","DEFAULT_VALUE","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY"],
		"primaryKeys":["PATH","BUSINESS_OBJECT","COLUMN_ID","ITEM_CATEGORY_ID","SUBITEM_STATE"],
		"isVersionedTable":false,
		"hasStagingTable":true
	},
	"t_metadata_selection_displayed": {
		"columns":["PATH","BUSINESS_OBJECT","COLUMN_ID","DISPLAY_ORDER","DISPLAYED_PATH","DISPLAYED_BUSINESS_OBJECT","DISPLAYED_COLUMN_ID"],
		"primaryKeys":["PATH","BUSINESS_OBJECT","COLUMN_ID","DISPLAY_ORDER"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_metadata_selection_filter": {
		"columns":["PATH","BUSINESS_OBJECT","COLUMN_ID","FILTER_PATH","FILTER_BUSINESS_OBJECT","FILTER_COLUMN_ID"],
		"primaryKeys":["PATH","BUSINESS_OBJECT","COLUMN_ID","FILTER_PATH","FILTER_BUSINESS_OBJECT","FILTER_COLUMN_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_open_calculation_versions": {
		"columns":["SESSION_ID","CALCULATION_VERSION_ID","IS_WRITEABLE"],
		"primaryKeys":["SESSION_ID","CALCULATION_VERSION_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_open_projects": {
		"columns":["SESSION_ID","PROJECT_ID","IS_WRITEABLE"],
		"primaryKeys":["SESSION_ID","PROJECT_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_overhead_group": {
		"columns":["OVERHEAD_GROUP_ID","PLANT_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["OVERHEAD_GROUP_ID","PLANT_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_overhead_group__text": {
		"columns":["OVERHEAD_GROUP_ID","PLANT_ID","LANGUAGE","OVERHEAD_GROUP_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["OVERHEAD_GROUP_ID","PLANT_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_plant": {
		"columns":["PLANT_ID","COMPANY_CODE_ID","COUNTRY","POSTAL_CODE","REGION","CITY","STREET_NUMBER_OR_PO_BOX","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PLANT_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_plant__text": {
		"columns":["PLANT_ID","LANGUAGE","PLANT_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PLANT_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_material_price": {
		"columns":["PRICE_ID","PRICE_SOURCE_ID","MATERIAL_ID","PLANT_ID","VENDOR_ID","PURCHASING_GROUP","PURCHASING_DOCUMENT","LOCAL_CONTENT","PROJECT_ID","VALID_FROM","VALID_TO","VALID_FROM_QUANTITY","VALID_TO_QUANTITY","PRICE_FIXED_PORTION","PRICE_VARIABLE_PORTION","TRANSACTION_CURRENCY_ID","PRICE_UNIT","PRICE_UNIT_UOM_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PRICE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_price_source": {
		"columns":["PRICE_SOURCE_ID","CONFIDENCE_LEVEL_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PRICE_SOURCE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_price_source__text": {
		"columns":["PRICE_SOURCE_ID","LANGUAGE","PRICE_SOURCE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PRICE_SOURCE_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_profit_center": {
		"columns":["PROFIT_CENTER_ID","CONTROLLING_AREA_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PROFIT_CENTER_ID","CONTROLLING_AREA_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_profit_center__text": {
		"columns":["PROFIT_CENTER_ID","CONTROLLING_AREA_ID","LANGUAGE","PROFIT_CENTER_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["PROFIT_CENTER_ID","CONTROLLING_AREA_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_project": {
		"columns":["PROJECT_ID","REFERENCE_PROJECT_ID","PROJECT_NAME","PROJECT_RESPONSIBLE","CONTROLLING_AREA_ID","CUSTOMER_ID","SALES_DOCUMENT","SALES_PRICE","SALES_PRICE_CURRENCY_ID","COMMENT","COMPANY_CODE_ID","PLANT_ID","BUSINESS_AREA_ID","PROFIT_CENTER_ID","REPORT_CURRENCY_ID","COSTING_SHEET_ID","COMPONENT_SPLIT_ID","START_OF_PROJECT","END_OF_PROJECT","START_OF_PRODUCTION","END_OF_PRODUCTION","VALUATION_DATE","CREATED_ON","CREATED_BY","LAST_MODIFIED_ON","LAST_MODIFIED_BY","EXCHANGE_RATE_TYPE_ID"],
		"primaryKeys":["PROJECT_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_recent_calculation_versions": {
		"columns":["CALCULATION_VERSION_ID","USER_ID","LAST_USED_ON"],
		"primaryKeys":["CALCULATION_VERSION_ID","USER_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_regex": {
		"columns":["VALIDATION_REGEX_ID","VALIDATION_REGEX_VALUE"],
		"primaryKeys":["VALIDATION_REGEX_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_session": {
		"columns":["SESSION_ID","USER_ID","LANGUAGE","LAST_ACTIVITY_TIME"],
		"primaryKeys":["SESSION_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_side_panel_group": {
		"columns":["SIDE_PANEL_GROUP_ID","SIDE_PANEL_GROUP_DISPLAY_ORDER","RESOURCE_KEY_GROUP_DESCRIPTION"],
		"primaryKeys":["SIDE_PANEL_GROUP_ID"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_system_message": {
		"columns":["LANGUAGE","MESSAGE"],
		"primaryKeys":["LANGUAGE"],
		"isVersionedTable":false,
		"hasStagingTable":false
	},
	"t_uom": {
		"columns":["UOM_ID","DIMENSION_ID","NUMERATOR","DENOMINATOR","EXPONENT_BASE10","SI_CONSTANT","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["UOM_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_uom__text": {
		"columns":["UOM_ID","LANGUAGE","UOM_CODE","UOM_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["UOM_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_valuation_class": {
		"columns":["VALUATION_CLASS_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["VALUATION_CLASS_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_valuation_class__text": {
		"columns":["VALUATION_CLASS_ID","LANGUAGE","VALUATION_CLASS_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["VALUATION_CLASS_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_vendor": {
		"columns":["VENDOR_ID","VENDOR_NAME","COUNTRY","POSTAL_CODE","REGION","CITY","STREET_NUMBER_OR_PO_BOX","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["VENDOR_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_work_center": {
		"columns":["WORK_CENTER_ID","PLANT_ID","WORK_CENTER_CATEGORY","COST_CENTER_ID","CONTROLLING_AREA_ID","WORK_CENTER_RESPONSIBLE","EFFICIENCY","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["WORK_CENTER_ID","PLANT_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_work_center__text": {
		"columns":["WORK_CENTER_ID","PLANT_ID","LANGUAGE","WORK_CENTER_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["WORK_CENTER_ID","PLANT_ID","LANGUAGE","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	},
	"t_work_center_activity_type": {
		"columns":["WORK_CENTER_ID","CONTROLLING_AREA_ID","PLANT_ID","ACTIVITY_TYPE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"],
		"primaryKeys":["WORK_CENTER_ID","CONTROLLING_AREA_ID","PLANT_ID","ACTIVITY_TYPE_ID","_VALID_FROM"],
		"isVersionedTable":true,
		"hasStagingTable":false
	}
};
