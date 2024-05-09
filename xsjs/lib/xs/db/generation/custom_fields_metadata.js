//This will be a generated file.

/**
 * the object store the all metadata about DB artefacts.
 * the structure of object:
 * 	{
 * 		...
 *
 * 		"Item": 	// DB artefact with custom fields
 * 		{
 * 			"type": "Table", 	// or view, tabletype, trigger, AFL wrapper
 * 			"packageName": ""
 * 			"templateName": ""
 * 			"dependencies": [ "proc1", 	// list of dependent DB artefacts
 *							"view1",
 *							"tt1"
 * 						   ]
 * 		},
 *
 *		...
 *
 * 		"proc1":  // DB artefact
 * 		{
 * 			"type": "SQLScript", // or view, tabletype, trigger, AFL wrapper
 * 			"packageName": "db.procedures.proc1"
 * 			"templateName": "proc1.template"
 * 			"dependencies": [ "t_item", "t_material" ]
 * 		},
 *
 * 		...
 *
 * 	}
 **/

// The "Item" and "ts_item_create_output" is manually created.
// The "packageName" and "templateName" properties are manually added for each object.
// The Item dependencies objects are generated with Richard's script.

var mBusinessObjectsMetadata = {
    'Item': {
        'tableName': 'sap.plc.db::basis.t_item',
        'hasTemporaryTable': true,
        'hasStagingTable': false,
        'useSequence': true,
        'isMasterdataObject': false,
        'dependencies': [
            'p_unlock_calculation_version',
            'p_calculation',
            'p_calculation_save_results',
            'p_calculate_project_lifecycle',
            'p_calculate_saved_calculation_version',
            'p_calculate_variant',
            'p_calculate_sum_variant',
            'p_calculation_version_trigger_price_determination',
            'p_calculation_version_delete',
            'p_calculation_open_copy_to_temporary_tables',
            'p_calculation_version_close',
            'p_calculation_version_get_masterdata',
            'p_calculation_version_save',
            'p_calculation_delete',
            'p_calculation_version_open',
            'p_referenced_calculation_version_data_read',
            'p_calculations_versions_read',
            'p_calculations_versions_recover',
            'p_calculation_version_copy',
            'p_calculation_create_as_copy',
            'p_item_create',
            'p_item_create_set_referenced_version',
            'p_item_delete_items_marked_for_deletion',
            'p_item_get_items',
            'p_project_create_lifecycle_versions',
            'p_project_delete',
            'p_item_update_set_referenced_version',
            'p_calculation_version_set_new_id',
            'p_item_get_prices',
            'afl',
            'V_EXT_COMPONENT_SPLIT_CUST',
            'V_EXT_ACTIVITIES_CUST',
            'V_EXT_COSTING_SHEET_CUST',
            'V_EXT_PROJECT_COSTING_SHEET_CUST',
            'V_EXT_PROJECT_COMPONENT_SPLIT_CUST',
            'V_EXT_MATERIAL_LIST_CUST',
            'V_EXT_LINE_ITEMS_CUST',
            'p_unroll_privileges_on_object_update',
            'p_unroll_privileges_on_group_update'
        ],
        'primaryKeys': {
            'ITEM_ID': { dataType: 'integer' },
            'CALCULATION_VERSION_ID': { dataType: 'integer' }
        }
    },
    'Material': {
        'tableName': 'sap.plc.db::basis.t_material',
        'hasTemporaryTable': false,
        'hasStagingTable': false,
        'useSequence': false,
        'isMasterdataObject': true,
        'dependencies': [
            'gtt_batch_material',
            'p_ref_material_read',
            'p_material_read',
            'p_update_t_material',
            'p_load_t_material',
            'p_masterdata_read',
            'p_calculation_configuration_masterdata_read',
            'p_calculation_version_get_masterdata',
            'p_project_read',
            'p_item_get_prices',
            'p_referenced_calculation_version_data_read',
            'p_calculations_versions_read',
            'p_item_determine_dependent_fields',
            'p_item_automatic_value_determination',
            'p_calculation_version_masterdata_timestamp_update',
            'p_item_create',
            'p_data_protection_update_user_ids'
        ],
        'primaryKeys': {
            'MATERIAL_ID': { dataType: 'NVARCHAR(40)' },
            '_VALID_FROM': { dataType: 'timestamp' }
        }
    },
    'Material_Price': {
        'tableName': 'sap.plc.db::basis.t_material_price',
        'hasTemporaryTable': false,
        'hasStagingTable': false,
        'useSequence': false,
        'isMasterdataObject': true,
        'dependencies': [
            'p_item_determine_dependent_fields',
            'p_item_automatic_value_determination',
            'p_calculation_version_masterdata_timestamp_update',
            'p_item_create',
            'p_item_price_determination',
            'p_item_price_determination_trigger',
            'p_item_price_determination_all',
            'p_item_price_determination_material',
            'p_item_price_determination_activity',
            'p_calculation_version_trigger_price_determination',
            'p_lifecycle_calculation_version_price_determination',
            'p_item_get_prices',
            'p_data_protection_update_user_ids',
            'p_calculation_version_get_masterdata',
            'p_update_t_material_price',
            'p_load_t_material_price',
            'V_DATA_PROTECTION_DISPLAY_INFO',
            'p_project_delete'
        ],
        'primaryKeys': {
            'PRICE_ID': { dataType: 'NVARCHAR(32)' },
            '_VALID_FROM': { dataType: 'timestamp' }
        }
    },
    'Material_Plant': {
        'tableName': 'sap.plc.db::basis.t_material_plant',
        'hasTemporaryTable': false,
        'hasStagingTable': false,
        'useSequence': false,
        'isMasterdataObject': true,
        'dependencies': [
            'gtt_batch_material_plant',
            'p_material_plant_read',
            'p_update_t_material_plant',
            'p_load_t_material_plant',
            'p_masterdata_read',
            'p_calculation_configuration_masterdata_read',
            'p_calculation_version_get_masterdata',
            'p_project_read',
            'p_referenced_calculation_version_data_read',
            'p_item_determine_dependent_fields',
            'p_item_automatic_value_determination',
            'p_calculation_version_masterdata_timestamp_update',
            'p_item_create',
            'p_data_protection_update_user_ids'
        ],
        'primaryKeys': {
            'MATERIAL_ID': { dataType: 'NVARCHAR(40)' },
            'PLANT_ID': { dataType: 'NVARCHAR(8)' },
            '_VALID_FROM': { dataType: 'timestamp' }
        }
    },
    'Cost_Center': {
        'tableName': 'sap.plc.db::basis.t_cost_center',
        'hasTemporaryTable': false,
        'hasStagingTable': false,
        'useSequence': false,
        'isMasterdataObject': true,
        'dependencies': [
            'gtt_batch_cost_center',
            'p_cost_center_read',
            'p_ref_cost_center_read',
            'p_update_t_cost_center',
            'p_load_t_cost_center',
            'p_masterdata_read',
            'p_calculation_configuration_masterdata_read',
            'p_calculation_version_get_masterdata',
            'p_project_read',
            'p_referenced_calculation_version_data_read',
            'p_item_get_prices',
            'p_item_determine_dependent_fields',
            'p_item_automatic_value_determination',
            'p_calculation_version_masterdata_timestamp_update',
            'p_item_create',
            'p_work_center_read',
            'p_data_protection_update_user_ids',
            'p_ref_process_read'
        ],
        'primaryKeys': {
            'COST_CENTER_ID': { dataType: 'NVARCHAR(10)' },
            'CONTROLLING_AREA_ID': { dataType: 'NVARCHAR(4)' },
            '_VALID_FROM': { dataType: 'timestamp' }
        }
    },
    'Work_Center': {
        'tableName': 'sap.plc.db::basis.t_work_center',
        'hasTemporaryTable': false,
        'hasStagingTable': false,
        'useSequence': false,
        'isMasterdataObject': true,
        'dependencies': [
            'gtt_batch_work_center',
            'p_ref_cost_center_read',
            'p_update_t_work_center',
            'p_load_t_work_center',
            'p_masterdata_read',
            'p_calculation_configuration_masterdata_read',
            'p_calculation_version_get_masterdata',
            'p_project_read',
            'p_referenced_calculation_version_data_read',
            'p_calculations_versions_read',
            'p_item_determine_dependent_fields',
            'p_item_automatic_value_determination',
            'p_calculation_version_masterdata_timestamp_update',
            'p_item_create',
            'p_ref_work_center_read',
            'p_costing_sheet_row_read'
        ],
        'primaryKeys': {
            'WORK_CENTER_ID': { dataType: 'NVARCHAR(4)' },
            'PLANT_ID': { dataType: 'NVARCHAR(8)' },
            '_VALID_FROM': { dataType: 'timestamp' }
        }
    },
    'Activity_Price': {
        'tableName': 'sap.plc.db::basis.t_activity_price',
        'hasTemporaryTable': false,
        'hasStagingTable': false,
        'useSequence': false,
        'isMasterdataObject': true,
        'dependencies': [
            'p_item_automatic_value_determination',
            'p_item_price_determination',
            'p_item_price_determination_trigger',
            'p_item_price_determination_all',
            'p_item_price_determination_activity',
            'p_item_price_determination_material',
            'p_item_get_prices',
            'p_item_create',
            'p_lifecycle_calculation_version_price_determination',
            'p_calculation_version_trigger_price_determination',
            'p_calculation_version_get_masterdata',
            'p_update_t_activity_price',
            'p_load_t_activity_price',
            'p_project_delete'
        ],
        'primaryKeys': {
            'PRICE_ID': { dataType: 'NVARCHAR(32)' },
            '_VALID_FROM': { dataType: 'timestamp' }
        }
    }
};

var mDbArtefactsMetadata = {
    'PLC_AREA_CALCULATE_FOR_DISPLAY_PROC': {
        'name': 'PLC_AREA_CALCULATE_FOR_DISPLAY_PROC',
        'type': 'AFL',
        'packageName': 'afl',
        'templateName': 'PLC_AREA_CALCULATE_FOR_DISPLAY_PROC.hdbafllangprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'ts_calculate_item_ext',
            'ts_calculate_item_calculated_fields_save',
            'ts_calculate_item_calculated_fields'
        ]
    },
    'PLC_AREA_CALCULATE_FOR_SAVE_PROC': {
        'name': 'PLC_AREA_CALCULATE_FOR_SAVE_PROC',
        'type': 'AFL',
        'packageName': 'afl',
        'templateName': 'PLC_AREA_CALCULATE_FOR_SAVE_PROC.hdbafllangprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'ts_calculate_item_ext',
            'ts_calculate_item_calculated_fields_save',
            'ts_calculate_item_calculated_fields'
        ]
    },
    'PLC_AREA_CALCULATE_VARIANTS_PROC': {
        'name': 'PLC_AREA_CALCULATE_VARIANTS_PROC',
        'type': 'AFL',
        'packageName': 'afl',
        'templateName': 'PLC_AREA_CALCULATE_VARIANTS_PROC.hdbafllangprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'ts_calculate_item_ext',
            'ts_calculate_item_calculated_fields_save',
            'ts_calculate_item_calculated_fields'
        ]
    },
    'gtt_item_temporary': {
        'name': 'sap.plc.db::basis.gtt_item_temporary',
        'type': 'Table',
        'packageName': 'db',
        'templateName': 'gtt_item_temporary.table.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'gtt_item_temporary_with_masterdata_custom_fields': {
        'name': 'sap.plc.db::basis.gtt_item_temporary_with_masterdata_custom_fields',
        'type': 'Table',
        'packageName': 'db',
        'templateName': 'gtt_item_temporary_with_masterdata_custom_fields.table.template',
        'boDependencies': [
            'Material',
            'Material_Price',
            'Material_Plant',
            'Cost_Center',
            'Work_Center',
            'Activity_Price'
        ],
        'dependencies': []
    },
    'ts_item_create_output': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_create_output',
        'type': 'Structure',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_create_output.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'ts_item_custom_fields_currency': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_custom_fields_currency',
        'type': 'Structure',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_custom_fields_currency.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_unlock_calculation_version': {
        'name': 'sap.plc.db.management.procedures::p_unlock_calculation_version',
        'type': 'SQLScript',
        'packageName': 'db.management.procedures',
        'templateName': 'p_unlock_calculation_version.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_calculation': {
        'name': 'sap.plc.db.calcengine.procedures::p_calculation',
        'type': 'SQLScript',
        'packageName': 'db.calcengine.procedures',
        'templateName': 'p_calculation.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'afl',
            'ts_calculate_item_ext',
            'ts_calculate_item_calculated_fields_save',
            'ts_calculate_item_calculated_fields'
        ]
    },
    'p_calculation_save_results': {
        'name': 'sap.plc.db.calcengine.procedures::p_calculation_save_results',
        'type': 'SQLScript',
        'packageName': 'db.calcengine.procedures',
        'templateName': 'p_calculation_save_results.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'afl',
            'ts_calculate_item_ext',
            'ts_calculate_item_calculated_fields_save',
            'ts_calculate_item_calculated_fields'
        ]
    },
    'p_calculate_project_lifecycle': {
        'name': 'sap.plc.db.calcengine.procedures::p_calculate_project_lifecycle',
        'type': 'SQLScript',
        'packageName': 'db.calcengine.procedures',
        'templateName': 'p_calculate_project_lifecycle.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'afl',
            'ts_calculate_item_ext',
            'ts_calculate_item_calculated_fields_save',
            'ts_calculate_item_calculated_fields'
        ]
    },
    'p_calculation_version_trigger_price_determination': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_trigger_price_determination',
        'type': 'SQLScript',
        'templateName': 'p_calculation_version_trigger_price_determination.hdbprocedure.template',
        'dependencies': [
            'ts_item_temporary',
            'ts_item_price_determination_output',
            'p_item_price_determination_all'
        ],
        'packageName': 'db.calculationmanager.procedures',
        'boDependencies': [
            'Item',
            'Material_Price',
            'Activity_Price'
        ]
    },
    'p_calculate_saved_calculation_version': {
        'name': 'sap.plc.db.calcengine.procedures::p_calculate_saved_calculation_version',
        'type': 'SQLScript',
        'packageName': 'db.calcengine.procedures',
        'templateName': 'p_calculate_saved_calculation_version.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'afl',
            'ts_calculate_item_ext',
            'ts_calculate_item_calculated_fields_save',
            'ts_calculate_item_calculated_fields'
        ]
    },
    'p_calculate_variant': {
        'name': 'sap.plc.db.calcengine.procedures::p_calculate_variant',
        'type': 'SQLScript',
        'packageName': 'db.calcengine.procedures',
        'templateName': 'p_calculate_variant.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': ['afl']
    },
    'p_calculate_sum_variant': {
        'name': 'sap.plc.db.calcengine.procedures::p_calculate_sum_variant',
        'type': 'SQLScript',
        'packageName': 'db.calcengine.procedures',
        'templateName': 'p_calculate_sum_variant.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': ['afl']
    },
    'p_calculation_version_delete': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_delete',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_version_delete.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_calculation_open_copy_to_temporary_tables': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_open_copy_to_temporary_tables',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_open_copy_to_temporary_tables.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_calculation_version_close': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_close',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_version_close.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_item_custom_fields_currency_get': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_custom_fields_currency_get',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_custom_fields_currency_get.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': ['ts_item_custom_fields_currency']
    },
    'p_set_reporting_currency_item_custom_fields': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_set_reporting_currency_item_custom_fields',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_set_reporting_currency_item_custom_fields.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_calculation_version_save': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_save',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_version_save.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_calculation_delete': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_delete',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_delete.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_calculation_version_open': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_open',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_version_open.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'ts_item_temporary',
            'p_calculation_open_copy_to_temporary_tables'
        ]
    },
    'p_masterdata_read': {
        'name': 'sap.plc.db.administration.procedures::p_masterdata_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_masterdata_read.hdbprocedure.template',
        'boDependencies': [
            'Material',
            'Material_Plant',
            'Cost_Center'
        ],
        'dependencies': [
            'tt_material',
            'tt_material_plant',
            'tt_cost_center',
            'tt_work_center'
        ]
    },
    'p_referenced_calculation_version_data_read': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_referenced_calculation_version_data_read',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_referenced_calculation_version_data_read.hdbprocedure.template',
        'boDependencies': [
            'Item',
            'Material',
            'Material_Plant',
            'Cost_Center',
            'Work_Center'
        ],
        'dependencies': [
            'ts_item',
            'tt_material',
            'tt_material_plant',
            'tt_cost_center',
            'tt_work_center',
            'p_masterdata_read'
        ]
    },
    'p_lifecycle_calculation_version_price_determination': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_lifecycle_calculation_version_price_determination',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_lifecycle_calculation_version_price_determination.hdbprocedure.template',
        'boDependencies': [
            'Material_Price',
            'Activity_Price'
        ],
        'dependencies': []
    },
    'p_calculations_versions_read': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculations_versions_read',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculations_versions_read.hdbprocedure.template',
        'boDependencies': [
            'Item',
            'Material'
        ],
        'dependencies': [
            'ts_item',
            'tt_material',
            'p_calculation_version_get_masterdata'
        ]
    },
    'p_calculations_versions_recover': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculations_versions_recover',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculations_versions_recover.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': ['ts_item']
    },
    'p_item_create': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_create',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_create.hdbprocedure.template',
        'boDependencies': [
            'Item',
            'Material',
            'Material_Price',
            'Material_Plant',
            'Cost_Center',
            'Activity_Price'
        ],
        'dependencies': [
            'gtt_item_temporary',
            'gtt_item_temporary_with_masterdata_custom_fields',
            'ts_item_create_output',
            'p_item_create_set_referenced_version',
            'p_item_automatic_value_determination'
        ]
    },
    'p_item_create_set_referenced_version': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_create_set_referenced_version',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_create_set_referenced_version.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_item_delete_items_marked_for_deletion': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_delete_items_marked_for_deletion',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_delete_items_marked_for_deletion.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_item_get_items': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_get_items',
        'type': 'SQLScript',
        'templateName': 'p_item_get_items.hdbprocedure.template',
        'dependencies': ['ts_item_temporary'],
        'packageName': 'db.calculationmanager.procedures',
        'boDependencies': ['Item']
    },
    'p_item_get_bom_compare_items': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_get_bom_compare_items',
        'type': 'SQLScript',
        'templateName': 'p_item_get_bom_compare_items.hdbprocedure.template',
        'dependencies': ['ts_bom_compare_items'],
        'packageName': 'db.calculationmanager.procedures',
        'boDependencies': ['Item']
    },
    'p_calculation_version_set_new_id': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_set_new_id',
        'type': 'SQLScript',
        'templateName': 'p_calculation_version_set_new_id.hdbprocedure.template',
        'packageName': 'db.calculationmanager.procedures',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_calculation_version_copy': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_copy',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_version_copy.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': ['ts_item_temporary']
    },
    'p_calculation_create_as_copy': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_create_as_copy',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_create_as_copy.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'ts_item_temporary',
            'p_calculation_version_copy'
        ]
    },
    'p_project_create_lifecycle_versions': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_project_create_lifecycle_versions',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_project_create_lifecycle_versions.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_project_delete': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_project_delete',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_project_delete.hdbprocedure.template',
        'boDependencies': [
            'Item',
            'Material_Price',
            'Activity_Price'
        ],
        'dependencies': []
    },
    'p_item_update_set_referenced_version': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_update_set_referenced_version',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'dependencies': [],
        'boDependencies': ['Item'],
        'templateName': 'p_item_update_set_referenced_version.hdbprocedure.template'
    },
    'p_ref_material_read': {
        'name': 'sap.plc.db.administration.procedures::p_ref_material_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_ref_material_read.hdbprocedure.template',
        'boDependencies': ['Material'],
        'dependencies': ['tt_material']
    },
    'p_material_read': {
        'name': 'sap.plc.db.administration.procedures::p_material_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_material_read.hdbprocedure.template',
        'boDependencies': ['Material'],
        'dependencies': ['tt_material']
    },
    'p_update_t_material': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_update_t_material',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_update_t_material.hdbprocedure.template',
        'boDependencies': ['Material'],
        'dependencies': []
    },
    'p_load_t_material': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_load_t_material',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_load_t_material.hdbprocedure.template',
        'boDependencies': ['Material'],
        'dependencies': ['f_select_t_material']
    },
    'p_material_plant_read': {
        'name': 'sap.plc.db.administration.procedures::p_material_plant_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_material_plant_read.hdbprocedure.template',
        'boDependencies': [
            'Material',
            'Material_Plant'
        ],
        'dependencies': [
            'tt_material_plant',
            'tt_material',
            'p_ref_material_read'
        ]
    },
    'p_update_t_material_plant': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_update_t_material_plant',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_update_t_material_plant.hdbprocedure.template',
        'boDependencies': ['Material_Plant'],
        'dependencies': []
    },
    'p_load_t_material_plant': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_load_t_material_plant',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_load_t_material_plant.hdbprocedure.template',
        'boDependencies': ['Material_Plant'],
        'dependencies': ['f_select_t_material_plant']
    },
    'p_ref_cost_center_read': {
        'name': 'sap.plc.db.administration.procedures::p_ref_cost_center_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_ref_cost_center_read.hdbprocedure.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': ['tt_cost_center']
    },
    'p_cost_center_read': {
        'name': 'sap.plc.db.administration.procedures::p_cost_center_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_cost_center_read.hdbprocedure.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': ['tt_cost_center']
    },
    'p_update_t_cost_center': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_update_t_cost_center',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_update_t_cost_center.hdbprocedure.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': []
    },
    'p_load_t_cost_center': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_load_t_cost_center',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_load_t_cost_center.hdbprocedure.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': ['f_select_t_cost_center']
    },
    'p_ref_process_read': {
        'name': 'sap.plc.db.administration.procedures::p_ref_process_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_ref_process_read.hdbprocedure.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': ['p_masterdata_read']
    },
    'p_calculation_configuration_masterdata_read': {
        'name': 'sap.plc.db.administration.procedures::p_calculation_configuration_masterdata_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_calculation_configuration_masterdata_read.hdbprocedure.template',
        'boDependencies': [
            'Material',
            'Material_Plant',
            'Cost_Center'
        ],
        'dependencies': [
            'tt_material',
            'tt_material_plant',
            'tt_cost_center',
            'tt_work_center',
            'p_masterdata_read'
        ]
    },
    'p_calculation_version_get_masterdata': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_get_masterdata',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_version_get_masterdata.hdbprocedure.template',
        'boDependencies': [
            'Item',
            'Activity_Price',
            'Cost_Center',
            'Material',
            'Material_Plant',
            'Work_Center'
        ],
        'dependencies': [
            'tt_work_center',
            'tt_material',
            'tt_material_plant',
            'tt_cost_center',
            'tt_work_center',
            'p_masterdata_read'
        ]
    },
    'p_update_t_material_price': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_update_t_material_price',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_update_t_material_price.hdbprocedure.template',
        'boDependencies': ['Material_Price'],
        'dependencies': []
    },
    'p_load_t_material_price': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_load_t_material_price',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_load_t_material_price.hdbprocedure.template',
        'boDependencies': ['Material_Price'],
        'dependencies': ['f_select_t_material_price']
    },
    'p_project_read': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_project_read',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_project_read.hdbprocedure.template',
        'boDependencies': [
            'Material',
            'Material_Plant',
            'Cost_Center',
            'Work_Center'
        ],
        'dependencies': ['p_masterdata_read']
    },
    'p_update_t_activity_price': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_update_t_activity_price',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_update_t_activity_price.hdbprocedure.template',
        'boDependencies': ['Activity_Price'],
        'dependencies': []
    },
    'p_load_t_activity_price': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_load_t_activity_price',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_load_t_activity_price.hdbprocedure.template',
        'boDependencies': ['Activity_Price'],
        'dependencies': ['f_select_t_activity_price']
    },
    'p_item_get_prices': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_get_prices',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_get_prices.hdbprocedure.template',
        'boDependencies': [
            'Material',
            'Cost_Center',
            'Material_Price',
            'Item',
            'Activity_Price'
        ],
        'dependencies': [
            'tt_material',
            'tt_cost_center',
            'tt_material_price',
            'tt_activity_price',
            'p_masterdata_read',
            'p_item_price_determination_material',
            'p_item_price_determination_activity'
        ]
    },
    'p_item_determine_dependent_fields': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_determine_dependent_fields',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_determine_dependent_fields.hdbprocedure.template',
        'boDependencies': [
            'Material',
            'Material_Price',
            'Material_Plant',
            'Cost_Center',
            'Work_Center'
        ],
        'dependencies': ['ts_item_determine_dependent_fields']
    },
    'p_item_automatic_value_determination': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_automatic_value_determination',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_automatic_value_determination.hdbprocedure.template',
        'boDependencies': [
            'Material',
            'Material_Price',
            'Material_Plant',
            'Cost_Center',
            'Work_Center',
            'Activity_Price'
        ],
        'dependencies': [
            'ts_item_temporary_with_masterdata_custom_fields',
            'gtt_item_temporary_with_masterdata_custom_fields',
            'p_item_determine_dependent_fields',
            'p_item_price_determination'
        ]
    },
    'p_item_price_determination': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_price_determination',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_price_determination.hdbprocedure.template',
        'boDependencies': [
            'Material_Price',
            'Activity_Price'
        ],
        'dependencies': [
            'ts_item_price_determination_input',
            'ts_item_price_determination_output',
            'p_item_price_determination_all',
            'p_item_price_determination_trigger'
        ]
    },
    'p_item_price_determination_trigger': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_price_determination_trigger',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_price_determination_trigger.hdbprocedure.template',
        'boDependencies': [
            'Material_Price',
            'Activity_Price'
        ],
        'dependencies': [
            'ts_item_price_determination_input',
            'ts_item_price_determination_output',
            'p_item_price_determination_all'
        ]
    },
    'p_item_price_determination_all': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_price_determination_all',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_price_determination_all.hdbprocedure.template',
        'boDependencies': [
            'Material_Price',
            'Activity_Price'
        ],
        'dependencies': [
            'ts_item_price_determination_input',
            'ts_item_price_determination_output',
            'p_item_price_determination_material',
            'p_item_price_determination_activity'
        ]
    },
    'p_item_price_determination_material': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_price_determination_material',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_price_determination_material.hdbprocedure.template',
        'boDependencies': [
            'Material_Price',
            'Activity_Price'
        ],
        'dependencies': [
            'ts_item_price_determination_input',
            'ts_item_price_determination_all_prices_material_input_output'
        ]
    },
    'p_item_price_determination_activity': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_item_price_determination_activity',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_item_price_determination_activity.hdbprocedure.template',
        'boDependencies': [
            'Material_Price',
            'Activity_Price'
        ],
        'dependencies': [
            'ts_item_price_determination_input',
            'ts_item_price_determination_all_prices_activity_input_output'
        ]
    },
    'p_calculation_version_masterdata_timestamp_update': {
        'name': 'sap.plc.db.calculationmanager.procedures::p_calculation_version_masterdata_timestamp_update',
        'type': 'SQLScript',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'p_calculation_version_masterdata_timestamp_update.hdbprocedure.template',
        'boDependencies': [
            'Material',
            'Material_Price',
            'Material_Plant',
            'Cost_Center'
        ],
        'dependencies': [
            'ts_item_temporary_with_masterdata_custom_fields',
            'gtt_item_temporary_with_masterdata_custom_fields',
            'p_item_automatic_value_determination'
        ]
    },
    'p_work_center_read': {
        'name': 'sap.plc.db.administration.procedures::p_work_center_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_work_center_read.hdbprocedure.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': [
            'tt_work_center',
            'tt_cost_center',
            'p_ref_cost_center_read',
            'p_ref_process_read'
        ]
    },
    'p_update_t_work_center': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_update_t_work_center',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_update_t_work_center.hdbprocedure.template',
        'boDependencies': ['Work_Center'],
        'dependencies': []
    },
    'p_delete_vendor': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_delete_vendor',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_delete_vendor.hdbprocedure.template',
        'boDependencies': ['Material_Price'],
        'dependencies': []
    },
    'p_delete_customer': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_delete_customer',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_delete_customer.hdbprocedure.template',
        'boDependencies': [
            'Material_Price',
            'Activity_Price'
        ],
        'dependencies': []
    },
    'p_load_t_work_center': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_load_t_work_center',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_load_t_work_center.hdbprocedure.template',
        'boDependencies': ['Work_Center'],
        'dependencies': ['f_select_t_work_center']
    },
    'p_load_t_customer': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_load_t_customer',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_load_t_customer.hdbprocedure.template',
        'boDependencies': [],
        'dependencies': [
            'f_select_t_customer',
            'p_delete_customer'
        ]
    },
    'p_load_t_vendor': {
        'name': 'sap.plc.db.masterdata_replication.procedures::p_load_t_vendor',
        'type': 'SQLScript',
        'packageName': 'db.masterdata_replication.procedures',
        'templateName': 'p_load_t_vendor.hdbprocedure.template',
        'boDependencies': [],
        'dependencies': [
            'f_select_t_vendor',
            'p_delete_vendor'
        ]
    },
    'p_costing_sheet_row_read': {
        'name': 'sap.plc.db.administration.procedures::p_costing_sheet_row_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_costing_sheet_row_read.hdbprocedure.template',
        'boDependencies': [
            'Work_Center',
            'Cost_Center'
        ],
        'dependencies': [
            'p_ref_work_center_read',
            'tt_cost_center',
            'tt_work_center'
        ]
    },
    'p_ref_work_center_read': {
        'name': 'sap.plc.db.administration.procedures::p_ref_work_center_read',
        'type': 'SQLScript',
        'packageName': 'db.administration.procedures',
        'templateName': 'p_ref_work_center_read.hdbprocedure.template',
        'boDependencies': ['Work_Center'],
        'dependencies': ['tt_work_center']
    },
    
    // Replication Functions
    'f_select_t_material': {
        'name': 'sap.plc.db.masterdata_replication.functions::f_select_t_material',
        'type': 'hdbfunction',
        'packageName': 'db.masterdata_replication.functions',
        'templateName': 'f_select_t_material.hdbfunction.template',
        'boDependencies': ['Material'],
        'dependencies': []
    },
    'f_select_t_material_plant': {
        'name': 'sap.plc.db.masterdata_replication.functions::f_select_t_material_plant',
        'type': 'hdbfunction',
        'packageName': 'db.masterdata_replication.functions',
        'templateName': 'f_select_t_material_plant.hdbfunction.template',
        'boDependencies': ['Material_Plant'],
        'dependencies': []
    },
    'f_select_t_material_price': {
        'name': 'sap.plc.db.masterdata_replication.functions::f_select_t_material_price',
        'type': 'hdbfunction',
        'packageName': 'db.masterdata_replication.functions',
        'templateName': 'f_select_t_material_price.hdbfunction.template',
        'boDependencies': ['Material_Price'],
        'dependencies': []
    },
    'f_select_t_cost_center': {
        'name': 'sap.plc.db.masterdata_replication.functions::f_select_t_cost_center',
        'type': 'hdbfunction',
        'packageName': 'db.masterdata_replication.functions',
        'templateName': 'f_select_t_cost_center.hdbfunction.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': []
    },
    'f_select_t_work_center': {
        'name': 'sap.plc.db.masterdata_replication.functions::f_select_t_work_center',
        'type': 'hdbfunction',
        'packageName': 'db.masterdata_replication.functions',
        'templateName': 'f_select_t_work_center.hdbfunction.template',
        'boDependencies': ['Work_Center'],
        'dependencies': []
    },
    'f_select_t_activity_price': {
        'name': 'sap.plc.db.masterdata_replication.functions::f_select_t_activity_price',
        'type': 'hdbfunction',
        'packageName': 'db.masterdata_replication.functions',
        'templateName': 'f_select_t_activity_price.hdbfunction.template',
        'boDependencies': ['Activity_Price'],
        'dependencies': []
    },
    'gtt_batch_material': {
        'name': 'sap.plc.db.administration::maintemporarytables.gtt_batch_material',
        'type': 'Table',
        'packageName': 'db.administration',
        'templateName': 'gtt_batch_material.table.template',
        'boDependencies': ['Material'],
        'dependencies': []
    },
    'gtt_batch_material_plant': {
        'name': 'sap.plc.db.administration::maintemporarytables.gtt_batch_material_plant',
        'type': 'Table',
        'packageName': 'db.administration',
        'templateName': 'gtt_batch_material_plant.table.template',
        'boDependencies': ['Material_Plant'],
        'dependencies': []
    },
    'gtt_batch_cost_center': {
        'name': 'sap.plc.db.administration::maintemporarytables.gtt_batch_cost_center',
        'type': 'Table',
        'packageName': 'db.administration',
        'templateName': 'gtt_batch_cost_center.table.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': []
    },
    'tt_material': {
        'name': 'sap.plc.db.administration::masterdata.tt_material',
        'type': 'TableType',
        'packageName': 'db.administration',
        'templateName': 'tt_material.tabletype.template',
        'boDependencies': [
            'Material',
            'Material_Plant',
            'Material_Price'
        ],
        'dependencies': []
    },
    'tt_material_plant': {
        'name': 'sap.plc.db.administration::masterdata.tt_material_plant',
        'type': 'TableType',
        'packageName': 'db.administration',
        'templateName': 'tt_material_plant.tabletype.template',
        'boDependencies': ['Material_Plant'],
        'dependencies': []
    },
    'tt_material_price': {
        'name': 'sap.plc.db.administration::masterdata.tt_material_price',
        'type': 'TableType',
        'packageName': 'db.administration',
        'templateName': 'tt_material_price.tabletype.template',
        'boDependencies': ['Material_Price'],
        'dependencies': []
    },
    'tt_cost_center': {
        'name': 'sap.plc.db.administration::masterdata.tt_cost_center',
        'type': 'TableType',
        'packageName': 'db.administration',
        'templateName': 'tt_cost_center.tabletype.template',
        'boDependencies': ['Cost_Center'],
        'dependencies': []
    },
    'tt_work_center': {
        'name': 'sap.plc.db.administration::masterdata.tt_work_center',
        'type': 'TableType',
        'packageName': 'db.administration',
        'templateName': 'tt_work_center.tabletype.template',
        'boDependencies': ['Work_Center'],
        'dependencies': []
    },
    'tt_activity_price': {
        'name': 'sap.plc.db.administration::masterdata.tt_activity_price',
        'type': 'TableType',
        'packageName': 'db.administration',
        'templateName': 'tt_activity_price.tabletype.template',
        'boDependencies': ['Activity_Price'],
        'dependencies': []
    },
    'ts_item_temporary': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_temporary',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_temporary.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'ts_item': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'ts_bom_compare_items': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_bom_compare_items',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_bom_compare_items.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'ts_calculate_item_ext': {
        'name': 'sap.plc.db.calcengine::calcengine_types.ts_calculate_item_ext',
        'type': 'TableType',
        'packageName': 'db.calcengine',
        'templateName': 'ts_calculate_item_ext.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'ts_calculate_item_calculated_fields_save': {
        'name': 'sap.plc.db.calcengine::calcengine_types.ts_calculate_item_calculated_fields_save',
        'type': 'TableType',
        'packageName': 'db.calcengine',
        'templateName': 'ts_calculate_item_calculated_fields_save.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'ts_calculate_item_calculated_fields': {
        'name': 'sap.plc.db.calcengine::calcengine_types.ts_calculate_item_calculated_fields',
        'type': 'TableType',
        'packageName': 'db.calcengine',
        'templateName': 'ts_calculate_item_calculated_fields.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'ts_item_temporary_with_masterdata_custom_fields': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_temporary_with_masterdata_custom_fields',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_temporary_with_masterdata_custom_fields.tabletype.template',
        'boDependencies': [
            'Material',
            'Material_Price',
            'Material_Plant',
            'Cost_Center',
            'Work_Center',
            'Activity_Price'
        ],
        'dependencies': []
    },
    'ts_item_determine_dependent_fields': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_determine_dependent_fields',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_determine_dependent_fields.tabletype.template',
        'boDependencies': [
            'Material',
            'Material_Plant',
            'Cost_Center'
        ],
        'dependencies': []
    },
    'ts_item_price_determination_input': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_price_determination_input',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_price_determination_input.tabletype.template',
        'boDependencies': ['Material_Price'],
        'dependencies': []
    },
    'ts_item_price_determination_output': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_price_determination_output',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_price_determination_output.tabletype.template',
        'boDependencies': ['Material_Price'],
        'dependencies': []
    },
    'ts_item_price_determination_all_prices_material_input_output': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_price_determination_all_prices_material_input_output',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_price_determination_all_prices_material_input_output.tabletype.template',
        'boDependencies': ['Material_Price'],
        'dependencies': []
    },
    'ts_item_price_determination_all_prices_activity_input_output': {
        'name': 'sap.plc.db.calculationmanager.procedures::ts_item_price_determination_all_prices_activity_input_output',
        'type': 'TableType',
        'packageName': 'db.calculationmanager.procedures',
        'templateName': 'ts_item_price_determination_all_prices_activity_input_output.tabletype.template',
        'boDependencies': ['Activity_Price'],
        'dependencies': []
    },
    
    // Calculation views
    'TABLE_FUNCTION_v_bom_compare': {
        'type': 'hdbfunction',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'TABLE_FUNCTION_v_bom_compare.hdbfunction.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'TABLE_FUNCTION_v_bas_meas_component_split_cust': {
        'type': 'hdbfunction',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'TABLE_FUNCTION_v_bas_meas_component_split_cust.hdbfunction.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'TABLE_FUNCTION_v_bas_meas_line_items_cust': {
        'type': 'hdbfunction',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'TABLE_FUNCTION_v_bas_meas_line_items_cust.hdbfunction.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_item_costs_cust']
    },
    'TABLE_FUNCTION_v_bas_meas_costing_sheet_w_costs_and_prices_cust': {
        'type': 'hdbfunction',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'TABLE_FUNCTION_v_bas_meas_costing_sheet_w_costs_and_prices_cust.hdbfunction.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'TABLE_FUNCTION_v_bas_meas_item_costs_cust': {
        'type': 'hdbfunction',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'TABLE_FUNCTION_v_bas_meas_item_costs_cust.hdbfunction.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'TABLE_FUNCTION_v_bas_meas_project_component_split_cust': {
        'type': 'hdbfunction',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'TABLE_FUNCTION_v_bas_meas_project_component_split_cust.hdbfunction.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_item_costs_cust']
    },
    'TABLE_FUNCTION_v_bas_meas_project_costing_sheet_cust': {
        'type': 'hdbfunction',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'TABLE_FUNCTION_v_bas_meas_project_costing_sheet_cust.hdbfunction.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_item_costs_cust']
    },
    'v_bas_meas_costing_sheet_w_costs_and_prices_cust': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'v_bas_meas_costing_sheet_w_costs_and_prices_cust.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['TABLE_FUNCTION_v_bas_meas_costing_sheet_w_costs_and_prices_cust']
    },
    'v_bas_meas_component_split_cust': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'v_bas_meas_component_split_cust.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['TABLE_FUNCTION_v_bas_meas_component_split_cust']
    },
    'v_bas_meas_item_costs_cust': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'v_bas_meas_item_costs_cust.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['TABLE_FUNCTION_v_bas_meas_item_costs_cust']
    },
    'v_bas_meas_line_items_cust': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'v_bas_meas_line_items_cust.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['TABLE_FUNCTION_v_bas_meas_line_items_cust']
    },
    'v_bas_meas_project_component_split_cust': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'v_bas_meas_project_component_split_cust.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['TABLE_FUNCTION_v_bas_meas_project_component_split_cust']
    },
    'v_bas_meas_project_costing_sheet_cust': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF.base',
        'templateName': 'v_bas_meas_project_costing_sheet_cust.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['TABLE_FUNCTION_v_bas_meas_project_costing_sheet_cust']
    },
    'V_EXT_COMPONENT_SPLIT_CUST': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF',
        'templateName': 'V_EXT_COMPONENT_SPLIT_CUST.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_component_split_cust']
    },
    'V_EXT_ACTIVITIES_CUST': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF',
        'templateName': 'V_EXT_ACTIVITIES_CUST.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_item_costs_cust']
    },
    'V_EXT_COSTING_SHEET_CUST': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF',
        'templateName': 'V_EXT_COSTING_SHEET_CUST.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_costing_sheet_w_costs_and_prices_cust']
    },
    'V_EXT_PROJECT_COSTING_SHEET_CUST': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF',
        'templateName': 'V_EXT_PROJECT_COSTING_SHEET_CUST.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_project_costing_sheet_cust']
    },
    'V_EXT_PROJECT_COMPONENT_SPLIT_CUST': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF',
        'templateName': 'V_EXT_PROJECT_COMPONENT_SPLIT_CUST.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_project_component_split_cust']
    },
    'V_EXT_MATERIAL_LIST_CUST': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF',
        'templateName': 'V_EXT_MATERIAL_LIST_CUST.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_item_costs_cust']
    },
    'V_EXT_LINE_ITEMS_CUST': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF',
        'templateName': 'V_EXT_LINE_ITEMS_CUST.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['v_bas_meas_line_items_cust']
    },
    'V_BOM_COMPARE': {
        'type': 'hdbcalculationview',
        'packageName': 'analytics.viewsCF',
        'templateName': 'V_BOM_COMPARE.hdbcalculationview.template',
        'boDependencies': ['Item'],
        'dependencies': ['']
    },
    

    // instance based privileges (hierarchy view and procedure)	    
    'V_GROUP_HIERARCHY': {
        'type': 'SQLView',
        'name': 'sap.plc.db.authorization.views::auth.V_GROUP_HIERARCHY',
        'packageName': 'db.authorization.views',
        'templateName': 'V_GROUP_HIERARCHY.hdbhierarchyview.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'ts_privilege_object_filter': {
        'name': 'sap.plc.db.authorization.procedures::ts_privilege_object_filter',
        'type': 'Structure',
        'packageName': 'db.authorization.procedures',
        'templateName': 'ts_privilege_object_filter.tabletype.template',
        'boDependencies': ['Item'],
        'dependencies': []
    },
    'p_unroll_privileges': {
        'type': 'SQLScript',
        'name': 'sap.plc.db.authorization.procedures::p_unroll_privileges',
        'packageName': 'db.authorization.procedures',
        'templateName': 'p_unroll_privileges.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': [
            'V_GROUP_HIERARCHY',
            'ts_privilege_object_filter'
        ]
    },
    'p_unroll_privileges_on_object_update': {
        'type': 'SQLScript',
        'name': 'sap.plc.db.authorization.procedures::p_unroll_privileges_on_object_update',
        'packageName': 'db.authorization.procedures',
        'templateName': 'p_unroll_privileges_on_object_update.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': ['p_unroll_privileges']
    },
    'p_unroll_privileges_on_group_update': {
        'type': 'SQLScript',
        'name': 'sap.plc.db.authorization.procedures::p_unroll_privileges_on_group_update',
        'packageName': 'db.authorization.procedures',
        'templateName': 'p_unroll_privileges_on_group_update.hdbprocedure.template',
        'boDependencies': ['Item'],
        'dependencies': ['p_unroll_privileges']
    },
    'gtt_batch_work_center': {
        'name': 'sap.plc.db.administration::maintemporarytables.gtt_batch_work_center',
        'type': 'Table',
        'packageName': 'db.administration',
        'templateName': 'gtt_batch_work_center.table.template',
        'boDependencies': ['Work_Center'],
        'dependencies': []
    },
    'p_data_protection_update_user_ids': {
        'type': 'SQLScript',
        'name': 'sap.plc.db.management.procedures::p_data_protection_update_user_ids',
        'packageName': 'db.management.procedures',
        'templateName': 'p_data_protection_update_user_ids.hdbprocedure.template',
        'boDependencies': [
            'Cost_Center',
            'Material',
            'Material_Plant',
            'Material_Price'
        ],
        'dependencies': []
    },
    'V_DATA_PROTECTION_DISPLAY_INFO': {
        'type': 'SQLView',
        'name': 'sap.plc.db.views::V_DATA_PROTECTION_DISPLAY_INFO',
        'packageName': 'db.views',
        'templateName': 'V_DATA_PROTECTION_DISPLAY_INFO.hdbview.template',
        'boDependencies': ['Material_Price'],
        'dependencies': []
    }
};

module.exports.mBusinessObjectsMetadata = mBusinessObjectsMetadata;
module.exports.mDbArtefactsMetadata = mDbArtefactsMetadata;
export default {mBusinessObjectsMetadata,mDbArtefactsMetadata};
