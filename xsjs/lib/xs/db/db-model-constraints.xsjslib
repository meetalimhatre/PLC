// This is a generated file. DO NOT EDIT!
// Generator: /SAP_Product_Costing/Tools/PowerDesignerConverter
//
// Generation date: 14.06.2016
// Model name:      PLC_DataModel_Version_v1_2
// Model version:   33

/**
 * mForeignKeyConstraints stores all foreign key relationships in the data model.
 * It has the folling structure:
 * "tableName(with foreign keys)": [
 *   {
 *     "targetTable": "tableName(has Primary Key)",
 *     "fields": [
 *       ["sourceColumnName1", "targetColumnName1"],
 *       ["sourceColumnName2", "targetColumnName2"]
 *     ]
 *   }
 * ]
 */
var mForeignKeyConstraints ={
	"t_account": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_account__text": [
		{
			"targetTable": "t_account",
			"fields": [
						["ACCOUNT_ID", "ACCOUNT_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_account_account_group": [
		{
			"targetTable": "t_account",
			"fields": [
						["FROM_ACCOUNT_ID", "ACCOUNT_ID"]
					]
		},
		{
			"targetTable": "t_account_group",
			"fields": [
						["ACCOUNT_GROUP_ID", "ACCOUNT_GROUP_ID"]
					]
		},
		{
			"targetTable": "t_account",
			"fields": [
						["TO_ACCOUNT_ID", "ACCOUNT_ID"]
					]
		}
	],
	"t_account_group": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_account_group__text": [
		{
			"targetTable": "t_account_group",
			"fields": [
						["ACCOUNT_GROUP_ID", "ACCOUNT_GROUP_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_component_split_account_group": [
		{
			"targetTable": "t_account_group",
			"fields": [
						["ACCOUNT_GROUP_ID", "ACCOUNT_GROUP_ID"]
					]
		},
		{
			"targetTable": "t_component_split",
			"fields": [
						["COMPONENT_SPLIT_ID", "COMPONENT_SPLIT_ID"]
					]
		}
	],
	"t_activity_price": [
		{
			"targetTable": "t_price_source",
			"fields": [
						["PRICE_SOURCE_ID", "PRICE_SOURCE_ID"]
					]
		},
		{
			"targetTable": "t_cost_center",
			"fields": [
						["COST_CENTER_ID", "COST_CENTER_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		},
		{
			"targetTable": "t_activity_type",
			"fields": [
						["ACTIVITY_TYPE_ID", "ACTIVITY_TYPE_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		},
		{
			"targetTable": "t_project",
			"fields": [
						["PROJECT_ID", "PROJECT_ID"]
					]
		}
	],
	"t_activity_type": [
		{
			"targetTable": "t_account",
			"fields": [
						["ACCOUNT_ID", "ACCOUNT_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_activity_type__text": [
		{
			"targetTable": "t_activity_type",
			"fields": [
						["ACTIVITY_TYPE_ID", "ACTIVITY_TYPE_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_addin_configuration_header": [
		{
			"targetTable": "t_addin_version",
			"fields": [
						["ADDIN_GUID", "ADDIN_GUID"],
						["ADDIN_MAJOR_VERSION", "ADDIN_MAJOR_VERSION"],
						["ADDIN_MINOR_VERSION", "ADDIN_MINOR_VERSION"],
						["ADDIN_REVISION_NUMBER", "ADDIN_REVISION_NUMBER"],
						["ADDIN_BUILD_NUMBER", "ADDIN_BUILD_NUMBER"]
					]
		}
	],
	"t_addin_configuration_items": [
		{
			"targetTable": "t_addin_configuration_header",
			"fields": [
						["ADDIN_GUID", "ADDIN_GUID"],
						["ADDIN_MAJOR_VERSION", "ADDIN_MAJOR_VERSION"],
						["ADDIN_MINOR_VERSION", "ADDIN_MINOR_VERSION"],
						["ADDIN_REVISION_NUMBER", "ADDIN_REVISION_NUMBER"],
						["ADDIN_BUILD_NUMBER", "ADDIN_BUILD_NUMBER"]
					]
		}
	],
	"t_business_area__text": [
		{
			"targetTable": "t_business_area",
			"fields": [
						["BUSINESS_AREA_ID", "BUSINESS_AREA_ID"]
					]
		}
	],
	"t_process__text": [
		{
			"targetTable": "t_process",
			"fields": [
						["PROCESS_ID", "PROCESS_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_calculation": [
		{
			"targetTable": "t_project",
			"fields": [
						["PROJECT_ID", "PROJECT_ID"]
					]
		}
	],
	"t_calculation_version": [
		{
			"targetTable": "t_component_split",
			"fields": [
						["COMPONENT_SPLIT_ID", "COMPONENT_SPLIT_ID"]
					]
		},
		{
			"targetTable": "t_costing_sheet",
			"fields": [
						["COSTING_SHEET_ID", "COSTING_SHEET_ID"]
					]
		},
		{
			"targetTable": "t_customer",
			"fields": [
						["CUSTOMER_ID", "CUSTOMER_ID"]
					]
		}
	],
	"t_company_code": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_company_code__text": [
		{
			"targetTable": "t_company_code",
			"fields": [
						["COMPANY_CODE_ID", "COMPANY_CODE_ID"]
					]
		}
	],
	"t_component_split": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_component_split__text": [
		{
			"targetTable": "t_component_split",
			"fields": [
						["COMPONENT_SPLIT_ID", "COMPONENT_SPLIT_ID"]
					]
		}
	],
	"t_confidence_level__text": [
		{
			"targetTable": "t_confidence_level",
			"fields": [
						["CONFIDENCE_LEVEL_ID", "CONFIDENCE_LEVEL_ID"]
					]
		}
	],
	"t_controlling_area": [
		{
			"targetTable": "t_currency",
			"fields": [
						["CONTROLLING_AREA_CURRENCY_ID", "CURRENCY_ID"]
					]
		}
	],
	"t_controlling_area__text": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_cost_center": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_cost_center__text": [
		{
			"targetTable": "t_cost_center",
			"fields": [
						["COST_CENTER_ID", "COST_CENTER_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_costing_sheet": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_costing_sheet__text": [
		{
			"targetTable": "t_costing_sheet",
			"fields": [
						["COSTING_SHEET_ID", "COSTING_SHEET_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_costing_sheet_base_row": [
		{
			"targetTable": "t_item_category",
			"fields": [
						["ITEM_CATEGORY_ID", "ITEM_CATEGORY_ID"],
						["CHILD_ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID"]
					]
		}
	],
	"t_costing_sheet_overhead": [
		{
			"targetTable": "t_account",
			"fields": [
						["CREDIT_ACCOUNT_ID", "ACCOUNT_ID"]
					]
		}
	],
	"t_costing_sheet_overhead_row": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		},
		{
			"targetTable": "t_plant",
			"fields": [
						["PLANT_ID", "PLANT_ID"]
					]
		},
		{
			"targetTable": "t_profit_center",
			"fields": [
						["PROFIT_CENTER_ID", "PROFIT_CENTER_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		},
		{
			"targetTable": "t_business_area",
			"fields": [
						["BUSINESS_AREA_ID", "BUSINESS_AREA_ID"]
					]
		},
		{
			"targetTable": "t_company_code",
			"fields": [
						["COMPANY_CODE_ID", "COMPANY_CODE_ID"]
					]
		},
		{
			"targetTable": "t_overhead_group",
			"fields": [
						["OVERHEAD_GROUP_ID", "OVERHEAD_GROUP_ID"],
						["PLANT_ID", "PLANT_ID"]
					]
		},
		{
			"targetTable": "t_project",
			"fields": [
						["PROJECT_ID", "PROJECT_ID"]
					]
		},
		{
			"targetTable": "t_currency",
			"fields": [
						["OVERHEAD_CURRENCY_ID", "CURRENCY_ID"]
					]
		},
		{
			"targetTable": "t_uom",
			"fields": [
						["OVERHEAD_PRICE_UNIT_UOM_ID", "UOM_ID"]
					]
		}
	],
	"t_costing_sheet_row": [
		{
			"targetTable": "t_costing_sheet",
			"fields": [
						["COSTING_SHEET_ID", "COSTING_SHEET_ID"]
					]
		},
		{
			"targetTable": "t_account_group",
			"fields": [
						["ACCOUNT_GROUP_AS_BASE_ID", "ACCOUNT_GROUP_ID"]
					]
		}
	],
	"t_costing_sheet_row__text": [
		{
			"targetTable": "t_costing_sheet_row",
			"fields": [
						["COSTING_SHEET_ROW_ID", "COSTING_SHEET_ROW_ID"],
						["COSTING_SHEET_ID", "COSTING_SHEET_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_costing_sheet_row_dependencies": [
		{
			"targetTable": "t_costing_sheet_row",
			"fields": [
						["TARGET_ROW_ID", "COSTING_SHEET_ROW_ID"],
						["COSTING_SHEET_ID", "COSTING_SHEET_ID"]
					]
		},
		{
			"targetTable": "t_costing_sheet_row",
			"fields": [
						["SOURCE_ROW_ID", "COSTING_SHEET_ROW_ID"],
						["COSTING_SHEET_ID", "COSTING_SHEET_ID"]
					]
		}
	],
	"t_currency__text": [
		{
			"targetTable": "t_language",
			"fields": [
						["LANGUAGE", "LANGUAGE"]
					]
		},
		{
			"targetTable": "t_currency",
			"fields": [
						["CURRENCY_ID", "CURRENCY_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_currency_conversion": [
		{
			"targetTable": "t_currency",
			"fields": [
						["FROM_CURRENCY_ID", "CURRENCY_ID"]
					]
		},
		{
			"targetTable": "t_currency",
			"fields": [
						["TO_CURRENCY_ID", "CURRENCY_ID"]
					]
		}
	],
	"t_default_settings": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		},
		{
			"targetTable": "t_company_code",
			"fields": [
						["COMPANY_CODE_ID", "COMPANY_CODE_ID"]
					]
		},
		{
			"targetTable": "t_plant",
			"fields": [
						["PLANT_ID", "PLANT_ID"]
					]
		},
		{
			"targetTable": "t_costing_sheet",
			"fields": [
						["COSTING_SHEET_ID", "COSTING_SHEET_ID"]
					]
		},
		{
			"targetTable": "t_component_split",
			"fields": [
						["COMPONENT_SPLIT_ID", "COMPONENT_SPLIT_ID"]
					]
		},
		{
			"targetTable": "t_currency",
			"fields": [
						["REPORT_CURRENCY_ID", "CURRENCY_ID"]
					]
		}
	],
	"t_dimension__text": [
		{
			"targetTable": "t_dimension",
			"fields": [
						["DIMENSION_ID", "DIMENSION_ID"]
					]
		}
	],
	"t_document": [
		{
			"targetTable": "t_document_type",
			"fields": [
						["DOCUMENT_TYPE_ID", "DOCUMENT_TYPE_ID"]
					]
		},
		{
			"targetTable": "t_document_status",
			"fields": [
						["DOCUMENT_TYPE_ID", "DOCUMENT_TYPE_ID"],
						["DOCUMENT_STATUS_ID", "DOCUMENT_STATUS_ID"]
					]
		},
		{
			"targetTable": "t_design_office",
			"fields": [
						["DESIGN_OFFICE_ID", "DESIGN_OFFICE_ID"]
					]
		}
	],
	"t_document__text": [
		{
			"targetTable": "t_document",
			"fields": [
						["DOCUMENT_TYPE_ID", "DOCUMENT_TYPE_ID"],
						["DOCUMENT_ID", "DOCUMENT_ID"],
						["DOCUMENT_VERSION", "DOCUMENT_VERSION"],
						["DOCUMENT_PART", "DOCUMENT_PART"]
					]
		}
	],
	"t_document_material": [
		{
			"targetTable": "t_material",
			"fields": [
						["MATERIAL_ID", "MATERIAL_ID"]
					]
		},
		{
			"targetTable": "t_document",
			"fields": [
						["DOCUMENT_TYPE_ID", "DOCUMENT_TYPE_ID"],
						["DOCUMENT_ID", "DOCUMENT_ID"],
						["DOCUMENT_VERSION", "DOCUMENT_VERSION"],
						["DOCUMENT_PART", "DOCUMENT_PART"]
					]
		}
	],
	"t_document_status__text": [
		{
			"targetTable": "t_document_status",
			"fields": [
						["DOCUMENT_STATUS_ID", "DOCUMENT_STATUS_ID"]
					]
		}
	],
	"t_document_type__text": [
		{
			"targetTable": "t_document_type",
			"fields": [
						["DOCUMENT_TYPE_ID", "DOCUMENT_TYPE_ID"]
					]
		}
	],
	"t_formula": [
		{
			"targetTable": "t_metadata_item_attributes",
			"fields": [
						["PATH", "PATH"],
						["BUSINESS_OBJECT", "BUSINESS_OBJECT"],
						["COLUMN_ID", "COLUMN_ID"],
						["ITEM_CATEGORY_ID", "ITEM_CATEGORY_ID"]
					]
		}
	],
	"t_item": [
		{
			"targetTable": "t_material",
			"fields": [
						["MATERIAL_ID", "MATERIAL_ID"]
					]
		},
		{
			"targetTable": "t_cost_center",
			"fields": [
						["COST_CENTER_ID", "COST_CENTER_ID"]
					]
		},
		{
			"targetTable": "t_plant",
			"fields": [
						["PLANT_ID", "PLANT_ID"]
					]
		},
		{
			"targetTable": "t_company_code",
			"fields": [
						["COMPANY_CODE_ID", "COMPANY_CODE_ID"]
					]
		},
		{
			"targetTable": "t_business_area",
			"fields": [
						["BUSINESS_AREA_ID", "BUSINESS_AREA_ID"]
					]
		},
		{
			"targetTable": "t_profit_center",
			"fields": [
						["PROFIT_CENTER_ID", "PROFIT_CENTER_ID"]
					]
		},
		{
			"targetTable": "t_account",
			"fields": [
						["ACCOUNT_ID", "ACCOUNT_ID"]
					]
		},
		{
			"targetTable": "t_activity_type",
			"fields": [
						["ACTIVITY_TYPE_ID", "ACTIVITY_TYPE_ID"]
					]
		},
		{
			"targetTable": "t_work_center",
			"fields": [
						["WORK_CENTER_ID", "WORK_CENTER_ID"],
						["PLANT_ID", "PLANT_ID"]
					]
		},
		{
			"targetTable": "t_vendor",
			"fields": [
						["VENDOR_ID", "VENDOR_ID"]
					]
		},
		{
			"targetTable": "t_price_source",
			"fields": [
						["PRICE_SOURCE_ID", "PRICE_SOURCE_ID"]
					]
		},
		{
			"targetTable": "t_process",
			"fields": [
						["PROCESS_ID", "PROCESS_ID"]
					]
		},
		{
			"targetTable": "t_item_category",
			"fields": [
						["ITEM_CATEGORY_ID", "ITEM_CATEGORY_ID"],
						["CHILD_ITEM_CATEGORY_ID","CHILD_ITEM_CATEGORY_ID"]
					]
		},
		{
			"targetTable": "t_confidence_level",
			"fields": [
						["CONFIDENCE_LEVEL_ID", "CONFIDENCE_LEVEL_ID"]
					]
		}
	],
	"t_item_category__text": [
		{
			"targetTable": "t_item_category",
			"fields": [
						["ITEM_CATEGORY_ID", "ITEM_CATEGORY_ID"],
						["CHILD_ITEM_CATEGORY_ID","CHILD_ITEM_CATEGORY_ID"]
					]
		}
	],
	"t_design_office__text": [
		{
			"targetTable": "t_design_office",
			"fields": [
						["DESIGN_OFFICE_ID", "DESIGN_OFFICE_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_layout_side_panel": [
		{
			"targetTable": "t_layout",
			"fields": [
						["LAYOUT_NAME", "LAYOUT_NAME"],
						["USER_ID", "USER_ID"]
					]
		},
		{
			"targetTable": "t_metadata",
			"fields": [
						["TABLE_ID", "BUSINESS_OBJECT"],
						["COLUMN_ID", "COLUMN_ID"]
					]
		},
		{
			"targetTable": "t_side_panel_group",
			"fields": [
						["SIDE_PANEL_GROUP_ID", "SIDE_PANEL_GROUP_ID"]
					]
		}
	],
	"t_layout_treetable": [
		{
			"targetTable": "t_layout",
			"fields": [
						["LAYOUT_NAME", "LAYOUT_NAME"],
						["USER_ID", "USER_ID"]
					]
		},
		{
			"targetTable": "t_metadata",
			"fields": [
						["TABLE_ID", "BUSINESS_OBJECT"],
						["COLUMN_ID", "COLUMN_ID"]
					]
		}
	],
	"t_material": [
		{
			"targetTable": "t_material_type",
			"fields": [
						["MATERIAL_TYPE_ID", "MATERIAL_TYPE_ID"]
					]
		},
		{
			"targetTable": "t_material_group",
			"fields": [
						["MATERIAL_GROUP_ID", "MATERIAL_GROUP_ID"]
					]
		}
	],
	"t_material__text": [
		{
			"targetTable": "t_material",
			"fields": [
						["MATERIAL_ID", "MATERIAL_ID"]
					]
		}
	],
	"t_material_account_determination": [
		{
			"targetTable": "t_material_type",
			"fields": [
						["MATERIAL_TYPE_ID", "MATERIAL_TYPE_ID"]
					]
		},
		{
			"targetTable": "t_valuation_class",
			"fields": [
						["VALUATION_CLASS_ID", "VALUATION_CLASS_ID"]
					]
		},
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		},
		{
			"targetTable": "t_account",
			"fields": [
						["ACCOUNT_ID", "ACCOUNT_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		},
		{
			"targetTable": "t_plant",
			"fields": [
						["PLANT_ID", "PLANT_ID"]
					]
		}
	],
	"t_material_group__text": [
		{
			"targetTable": "t_material_group",
			"fields": [
						["MATERIAL_GROUP_ID", "MATERIAL_GROUP_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_material_plant": [
		{
			"targetTable": "t_overhead_group",
			"fields": [
						["OVERHEAD_GROUP_ID", "OVERHEAD_GROUP_ID"],
						["PLANT_ID", "PLANT_ID"]
					]
		},
		{
			"targetTable": "t_material",
			"fields": [
						["MATERIAL_ID", "MATERIAL_ID"]
					]
		},
		{
			"targetTable": "t_plant",
			"fields": [
						["PLANT_ID", "PLANT_ID"]
					]
		},
		{
			"targetTable": "t_valuation_class",
			"fields": [
						["VALUATION_CLASS_ID", "VALUATION_CLASS_ID"]
					]
		},
		{
			"targetTable": "t_uom",
			"fields": [
						["MATERIAL_LOT_SIZE_UOM_ID", "UOM_ID"]
					]
		}
	],
	"t_material_type__text": [
		{
			"targetTable": "t_material_type",
			"fields": [
						["MATERIAL_TYPE_ID", "MATERIAL_TYPE_ID"]
					]
		}
	],
	"t_metadata": [
		{
			"targetTable": "t_metadata",
			"fields": [
						["REF_UOM_CURRENCY_PATH", "PATH"],
						["REF_UOM_CURRENCY_BUSINESS_OBJECT", "BUSINESS_OBJECT"],
						["REF_UOM_CURRENCY_COLUMN_ID", "COLUMN_ID"]
					]
		},
		{
			"targetTable": "t_side_panel_group",
			"fields": [
						["SIDE_PANEL_GROUP_ID", "SIDE_PANEL_GROUP_ID"]
					]
		},
		{
			"targetTable": "t_regex",
			"fields": [
						["VALIDATION_REGEX_ID", "VALIDATION_REGEX_ID"]
					]
		}
	],
	"t_metadata__text": [
		{
			"targetTable": "t_metadata",
			"fields": [
						["PATH", "PATH"],
						["COLUMN_ID", "COLUMN_ID"]
					]
		}
	],
	"t_metadata_item_attributes": [
		{
			"targetTable": "t_metadata",
			"fields": [
						["PATH", "PATH"],
						["BUSINESS_OBJECT", "BUSINESS_OBJECT"],
						["COLUMN_ID", "COLUMN_ID"]
					]
		},
		{
			"targetTable": "t_item_category",
			"fields": [
						["ITEM_CATEGORY_ID", "ITEM_CATEGORY_ID"]
					]
		}
	],
	"t_metadata_selection_displayed": [
		{
			"targetTable": "t_metadata",
			"fields": [
						["PATH", "PATH"],
						["BUSINESS_OBJECT", "BUSINESS_OBJECT"],
						["COLUMN_ID", "COLUMN_ID"]
					]
		}
	],
	"t_metadata_selection_filter": [
		{
			"targetTable": "t_metadata",
			"fields": [
						["PATH", "PATH"],
						["BUSINESS_OBJECT", "BUSINESS_OBJECT"],
						["COLUMN_ID", "COLUMN_ID"]
					]
		}
	],
	"t_open_projects": [
		{
			"targetTable": "t_project",
			"fields": [
						["PROJECT_ID", "PROJECT_ID"]
					]
		}
	],
	"t_overhead_group": [
		{
			"targetTable": "t_plant",
			"fields": [
						["PLANT_ID", "PLANT_ID"]
					]
		}
	],
	"t_overhead_group__text": [
		{
			"targetTable": "t_overhead_group",
			"fields": [
						["OVERHEAD_GROUP_ID", "OVERHEAD_GROUP_ID"],
						["PLANT_ID", "PLANT_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_plant": [
		{
			"targetTable": "t_company_code",
			"fields": [
						["COMPANY_CODE_ID", "COMPANY_CODE_ID"]
					]
		}
	],
	"t_plant__text": [
		{
			"targetTable": "t_plant",
			"fields": [
						["PLANT_ID", "PLANT_ID"]
					]
		}
	],
	"t_material_price": [
		{
			"targetTable": "t_price_source",
			"fields": [
						["PRICE_SOURCE_ID", "PRICE_SOURCE_ID"]
					]
		},
		{
			"targetTable": "t_material",
			"fields": [
						["MATERIAL_ID", "MATERIAL_ID"]
					]
		},
		{
			"targetTable": "t_plant",
			"fields": [
						["PLANT_ID", "PLANT_ID"]
					]
		},
		{
			"targetTable": "t_vendor",
			"fields": [
						["VENDOR_ID", "VENDOR_ID"]
					]
		},
		{
			"targetTable": "t_project",
			"fields": [
						["PROJECT_ID", "PROJECT_ID"]
					]
		}
		
	],
	"t_price_source": [
		{
			"targetTable": "t_confidence_level",
			"fields": [
						["CONFIDENCE_LEVEL_ID", "CONFIDENCE_LEVEL_ID"]
					]
		}
	],
	"t_price_source__text": [
		{
			"targetTable": "t_price_source",
			"fields": [
						["PRICE_SOURCE_ID", "PRICE_SOURCE_ID"]
					]
		}
	],
	"t_profit_center": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_profit_center__text": [
		{
			"targetTable": "t_profit_center",
			"fields": [
						["PROFIT_CENTER_ID", "PROFIT_CENTER_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_project": [
		{
			"targetTable": "t_controlling_area",
			"fields": [
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_uom": [
		{
			"targetTable": "t_dimension",
			"fields": [
						["DIMENSION_ID", "DIMENSION_ID"]
					]
		}
	],
	"t_uom__text": [
		{
			"targetTable": "t_language",
			"fields": [
						["LANGUAGE", "LANGUAGE"]
					]
		},
		{
			"targetTable": "t_uom",
			"fields": [
						["UOM_ID", "UOM_ID"]
					]
		}
	],
	"t_valuation_class__text": [
		{
			"targetTable": "t_valuation_class",
			"fields": [
						["VALUATION_CLASS_ID", "VALUATION_CLASS_ID"]
					]
		}
	],
	"t_work_center": [
		{
			"targetTable": "t_cost_center",
			"fields": [
						["COST_CENTER_ID", "COST_CENTER_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		}
	],
	"t_work_center__text": [
		{
			"targetTable": "t_work_center",
			"fields": [
						["WORK_CENTER_ID", "WORK_CENTER_ID"],
						["PLANT_ID", "PLANT_ID"],
						["_VALID_FROM", "_VALID_FROM"]
					]
		}
	],
	"t_work_center_activity_type": [
		{
			"targetTable": "t_activity_type",
			"fields": [
						["ACTIVITY_TYPE_ID", "ACTIVITY_TYPE_ID"],
						["CONTROLLING_AREA_ID", "CONTROLLING_AREA_ID"]
					]
		},
		{
			"targetTable": "t_work_center",
			"fields": [
						["WORK_CENTER_ID", "WORK_CENTER_ID"],
						["PLANT_ID", "PLANT_ID"]
					]
		}
	]
};


var mSpecialForeignKeyConstraints ={
	"t_calculation": [
		{
			"targetTable": "t_calculation_version",
			"fields": [
						["CURRENT_CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID"]
					]
		}
	],
	"t_calculation_version": [
		{
			"targetTable": "t_calculation",
			"fields": [
						["CALCULATION_ID", "CALCULATION_ID"]
					]
		},
		{
			"targetTable": "t_item",
			"fields": [
						["ROOT_ITEM_ID", "ITEM_ID"],
						["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID"]
					]
		}
	],
	"t_costing_sheet_base_row": [
		{
			"targetTable": "t_costing_sheet_base",
			"fields": [
						["COSTING_SHEET_BASE_ID", "COSTING_SHEET_BASE_ID"]
					]
		}
	],
	"t_costing_sheet_overhead_row": [
		{
			"targetTable": "t_calculation",
			"fields": [
						["CALCULATION_ID", "CALCULATION_ID"]
					]
		},
		{
			"targetTable": "t_costing_sheet_overhead",
			"fields": [
						["COSTING_SHEET_OVERHEAD_ID", "COSTING_SHEET_OVERHEAD_ID"]
					]
		}
	],
	"t_costing_sheet_row": [
		{
			"targetTable": "t_costing_sheet_base",
			"fields": [
						["COSTING_SHEET_BASE_ID", "COSTING_SHEET_BASE_ID"]
					]
		},
		{
			"targetTable": "t_costing_sheet_overhead",
			"fields": [
						["COSTING_SHEET_OVERHEAD_ID", "COSTING_SHEET_OVERHEAD_ID"]
					]
		}
	],
	"t_item": [
		{
			"targetTable": "t_item",
			"fields": [
						["PARENT_ITEM_ID", "ITEM_ID"],
						["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID"]
					]
		},
		{
			"targetTable": "t_calculation_version",
			"fields": [
						["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID"]
					]
		},
		{
			"targetTable": "t_item",
			"fields": [
						["PREDECESSOR_ITEM_ID", "ITEM_ID"],
						["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID"]
					]
		}
	],
	"t_item_calculated_values_component_split": [
		{
			"targetTable": "t_item",
			"fields": [
						["ITEM_ID", "ITEM_ID"],
						["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID"]
					]
		}
	],
	"t_item_calculated_values_costing_sheet": [
		{
			"targetTable": "t_item",
			"fields": [
						["ITEM_ID", "ITEM_ID"],
						["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID"]
					]
		}
	]	
};
		