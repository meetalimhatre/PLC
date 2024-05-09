/*current the upgrade schema change support for categories:
 table renameing
 column renaming
" table removal: the mappingTable is null
" column removal: the mappingColumn is null*/
var aSchemaMapping = await Object.freeze([{
        'version': 4,
        'version_sp': 0,
        'version_patch': 0,
        'schema_modification': [
            {
                'originalTable': 'sap.plc.db::basis.t_account__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_formula_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_metadata__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_metadata_item_attributes_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_metadata_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_account_group_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_group__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_group_account_group_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_group_cost_component_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_group_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_activity_type__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_activity_type_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_add_in_configuration_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_addin_configuration_header_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_addin_configuration_items_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_addin_version_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_business_area__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_business_area_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_company_code__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_company_code_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_component_split__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_component_split_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_controlling_area__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_controlling_area_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_center__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_center_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_component__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_component_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_component_values_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_base_row_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_base_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_overhead_row_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_overhead_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_row__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_row_dependencies_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_row_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_default_settings_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_account_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_group__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_group_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_type__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_type_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_overhead_group__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_overhead_group_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_plant__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_plant_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_profit_center__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_profit_center_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_valuation_class__text_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_valuation_class_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_center_ext_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_item_ext_staging',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_group_account_group',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_add_in_configuration',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_component',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_component__text',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_component_values',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_replication_mapping',
                'mappingTable': '',
                'mappingColumns': []
            },
            {
                'originalTable': 'sap.plc.db::basis.t_business_process',
                'mappingTable': 'sap.plc.db::basis.t_process',
                'mappingColumns': [
                    {
                        'originalColumn': 'BUSINESS_PROCESS_ID',
                        'mappingColumn': 'PROCESS_ID'
                    },
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_business_process__text',
                'mappingTable': 'sap.plc.db::basis.t_process__text',
                'mappingColumns': [
                    {
                        'originalColumn': 'BUSINESS_PROCESS_ID',
                        'mappingColumn': 'PROCESS_ID'
                    },
                    {
                        'originalColumn': 'BUSINESS_PROCESS_DESCRIPTION',
                        'mappingColumn': 'PROCESS_DESCRIPTION'
                    },
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_item',
                'mappingTable': 'sap.plc.db::basis.t_item',
                'mappingColumns': [
                    {
                        'originalColumn': 'BUSINESS_PROCESS_ID',
                        'mappingColumn': 'PROCESS_ID'
                    },
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    },
                    {
                        'originalColumn': 'LABORATORY_DESIGN_OFFICE_ID',
                        'mappingColumn': 'DESIGN_OFFICE_ID'
                    },
                    {
                        'originalColumn': 'PRICE_APPLIED_SURCHARGE',
                        'mappingColumn': 'SURCHARGE'
                    },
                    {
                        'originalColumn': 'PRICE_SOURCE_TYPE',
                        'mappingColumn': 'PRICE_SOURCE_TYPE_ID'
                    },
                    {
                        'originalColumn': 'PRICE_TRANSACTION_CURRENCY_ID',
                        'mappingColumn': 'TRANSACTION_CURRENCY_ID'
                    },
                    {
                        'originalColumn': 'QUANTITY_DEPENDENCY_MODE',
                        'mappingColumn': 'TOTAL_QUANTITY_DEPENDS_ON'
                    },
                    {
                        'originalColumn': 'QUANTITY_FOR_ONE_ASSEMBLY',
                        'mappingColumn': 'QUANTITY'
                    },
                    {
                        'originalColumn': 'QUANTITY_FOR_ONE_ASSEMBLY_CALCULATED',
                        'mappingColumn': 'QUANTITY_CALCULATED'
                    },
                    {
                        'originalColumn': 'QUANTITY_FOR_ONE_ASSEMBLY_IS_MANUAL',
                        'mappingColumn': 'QUANTITY_IS_MANUAL'
                    },
                    {
                        'originalColumn': 'QUANTITY_FOR_ONE_ASSEMBLY_UOM_ID',
                        'mappingColumn': 'QUANTITY_UOM_ID'
                    },
                    {
                        'originalColumn': 'COSTING_LOT_SIZE',
                        'mappingColumn': 'LOT_SIZE'
                    },
                    {
                        'originalColumn': 'COSTING_LOT_SIZE_CALCULATED',
                        'mappingColumn': 'LOT_SIZE_CALCULATED'
                    },
                    {
                        'originalColumn': 'COSTING_LOT_SIZE_IS_MANUAL',
                        'mappingColumn': 'LOT_SIZE_IS_MANUAL'
                    },
                    {
                        'originalColumn': 'GROSS_WEIGHT',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'GROSS_WEIGHT_CALCULATED',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'GROSS_WEIGHT_IS_MANUAL',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'NET_WEIGHT',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'NET_WEIGHT_CALCULATED',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'NET_WEIGHT_IS_MANUAL',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME_CALCULATED',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME_IS_MANUAL',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME_UOM_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'WEIGHT_UOM_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'STATUS',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_item_temporary',
                'mappingTable': 'sap.plc.db::basis.t_item_temporary',
                'mappingColumns': [
                    {
                        'originalColumn': 'BUSINESS_PROCESS_ID',
                        'mappingColumn': 'PROCESS_ID'
                    },
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    },
                    {
                        'originalColumn': 'LABORATORY_DESIGN_OFFICE_ID',
                        'mappingColumn': 'DESIGN_OFFICE_ID'
                    },
                    {
                        'originalColumn': 'PRICE_APPLIED_SURCHARGE',
                        'mappingColumn': 'SURCHARGE'
                    },
                    {
                        'originalColumn': 'PRICE_SOURCE_TYPE',
                        'mappingColumn': 'PRICE_SOURCE_TYPE_ID'
                    },
                    {
                        'originalColumn': 'PRICE_TRANSACTION_CURRENCY_ID',
                        'mappingColumn': 'TRANSACTION_CURRENCY_ID'
                    },
                    {
                        'originalColumn': 'QUANTITY_DEPENDENCY_MODE',
                        'mappingColumn': 'TOTAL_QUANTITY_DEPENDS_ON'
                    },
                    {
                        'originalColumn': 'QUANTITY_FOR_ONE_ASSEMBLY',
                        'mappingColumn': 'QUANTITY'
                    },
                    {
                        'originalColumn': 'QUANTITY_FOR_ONE_ASSEMBLY_CALCULATED',
                        'mappingColumn': 'QUANTITY_CALCULATED'
                    },
                    {
                        'originalColumn': 'QUANTITY_FOR_ONE_ASSEMBLY_IS_MANUAL',
                        'mappingColumn': 'QUANTITY_IS_MANUAL'
                    },
                    {
                        'originalColumn': 'QUANTITY_FOR_ONE_ASSEMBLY_UOM_ID',
                        'mappingColumn': 'QUANTITY_UOM_ID'
                    },
                    {
                        'originalColumn': 'COSTING_LOT_SIZE',
                        'mappingColumn': 'LOT_SIZE'
                    },
                    {
                        'originalColumn': 'COSTING_LOT_SIZE_CALCULATED',
                        'mappingColumn': 'LOT_SIZE_CALCULATED'
                    },
                    {
                        'originalColumn': 'COSTING_LOT_SIZE_IS_MANUAL',
                        'mappingColumn': 'LOT_SIZE_IS_MANUAL'
                    },
                    {
                        'originalColumn': 'GROSS_WEIGHT',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'GROSS_WEIGHT_CALCULATED',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'GROSS_WEIGHT_IS_MANUAL',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'NET_WEIGHT',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'NET_WEIGHT_CALCULATED',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'NET_WEIGHT_IS_MANUAL',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME_CALCULATED',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME_IS_MANUAL',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME_UOM_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'WEIGHT_UOM_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'STATUS',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_work_center_activity_type',
                'mappingTable': 'sap.plc.db::basis.t_work_center_activity_type',
                'mappingColumns': [
                    {
                        'originalColumn': 'BUSINESS_PROCESS_ID',
                        'mappingColumn': 'PROCESS_ID'
                    },
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'QUANTITY_DEPENDENCY_MODE',
                        'mappingColumn': 'TOTAL_QUANTITY_DEPENDS_ON'
                    },
                    {
                        'originalColumn': 'COSTING_LOT_SIZE',
                        'mappingColumn': 'LOT_SIZE'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_work_center_process',
                'mappingTable': 'sap.plc.db::basis.t_work_center_process',
                'mappingColumns': [
                    {
                        'originalColumn': 'BUSINESS_PROCESS_ID',
                        'mappingColumn': 'PROCESS_ID'
                    },
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_calculation',
                'mappingTable': 'sap.plc.db::basis.t_calculation',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_addin_configuration_header',
                'mappingTable': 'sap.plc.db::basis.t_addin_configuration_header',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_addin_version',
                'mappingTable': 'sap.plc.db::basis.t_addin_version',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_exchange_rate_type',
                'mappingTable': 'sap.plc.db::basis.t_exchange_rate_type',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_exchange_rate_type__text',
                'mappingTable': 'sap.plc.db::basis.t_exchange_rate_type__text',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_metadata__text',
                'mappingTable': 'sap.plc.db::basis.t_metadata__text',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_price_source',
                'mappingTable': 'sap.plc.db::basis.t_price_source',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    },
                    {
                        'originalColumn': 'PRICE_SOURCE_TYPE',
                        'mappingColumn': 'PRICE_SOURCE_TYPE_ID'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_price_source__text',
                'mappingTable': 'sap.plc.db::basis.t_price_source__text',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'PRICE_SOURCE_TYPE',
                        'mappingColumn': 'PRICE_SOURCE_TYPE_ID'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_project',
                'mappingTable': 'sap.plc.db::basis.t_project',
                'mappingColumns': [
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    },
                    {
                        'originalColumn': 'LAST_SAVED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_SAVED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'IS_FROZEN',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_project_total_quantities',
                'mappingTable': 'sap.plc.db::basis.t_project_total_quantities',
                'mappingColumns': [
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_variant',
                'mappingTable': 'sap.plc.db::basis.t_variant',
                'mappingColumns': [
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_ACCEPTED_AT',
                        'mappingColumn': 'LAST_REMOVED_MARKINGS_ON'
                    },
                    {
                        'originalColumn': 'LAST_CALCULATED_AT',
                        'mappingColumn': 'LAST_CALCULATED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'LAST_ACCEPTED_BY_USER_ID',
                        'mappingColumn': 'LAST_REMOVED_MARKINGS_BY'
                    },
                    {
                        'originalColumn': 'LAST_CALCULATED_BY_USER_ID',
                        'mappingColumn': 'LAST_CALCULATED_BY'
                    },
                    {
                        'originalColumn': 'TOTAL_QUANTITY',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'TOTAL_QUANTITY_UOM_ID',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_calculation_version',
                'mappingTable': 'sap.plc.db::basis.t_calculation_version',
                'mappingColumns': [
                    {
                        'originalColumn': 'LAST_SAVED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_SAVED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'PREDECESSOR_VERSION_ID',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_calculation_version_temporary',
                'mappingTable': 'sap.plc.db::basis.t_calculation_version_temporary',
                'mappingColumns': [
                    {
                        'originalColumn': 'LAST_SAVED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_SAVED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    },
                    {
                        'originalColumn': 'PREDECESSOR_VERSION_ID',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_recent_calculation_versions',
                'mappingTable': 'sap.plc.db::basis.t_recent_calculation_versions',
                'mappingColumns': [{
                        'originalColumn': 'LAST_USED_AT',
                        'mappingColumn': 'LAST_USED_ON'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_task',
                'mappingTable': 'sap.plc.db::basis.t_task',
                'mappingColumns': [{
                        'originalColumn': 'LAST_UPDATED',
                        'mappingColumn': 'LAST_UPDATED_ON'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_lock',
                'mappingTable': 'sap.plc.db::basis.t_lock',
                'mappingColumns': [{
                        'originalColumn': 'LAST_UPDATED_TIME',
                        'mappingColumn': 'LAST_UPDATED_ON'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_dimension',
                'mappingTable': 'sap.plc.db::basis.t_dimension',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_dimension__text',
                'mappingTable': 'sap.plc.db::basis.t_dimension__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_activity_type',
                'mappingTable': 'sap.plc.db::basis.t_activity_type',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_activity_type__text',
                'mappingTable': 'sap.plc.db::basis.t_activity_type__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_laboratory_design_office',
                'mappingTable': 'sap.plc.db::basis.t_design_office',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'LABORATORY_DESIGN_OFFICE_ID',
                        'mappingColumn': 'DESIGN_OFFICE_ID'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_group_cost_component',
                'mappingTable': 'sap.plc.db::basis.t_component_split_account_group',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_account',
                'mappingTable': 'sap.plc.db::basis.t_material_account_determination',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account',
                'mappingTable': 'sap.plc.db::basis.t_account',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account__text',
                'mappingTable': 'sap.plc.db::basis.t_account__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_account_group',
                'mappingTable': 'sap.plc.db::basis.t_account_account_group',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_group',
                'mappingTable': 'sap.plc.db::basis.t_account_group',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_account_group__text',
                'mappingTable': 'sap.plc.db::basis.t_account_group__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_business_area',
                'mappingTable': 'sap.plc.db::basis.t_business_area',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_business_area__text',
                'mappingTable': 'sap.plc.db::basis.t_business_area__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_company_code',
                'mappingTable': 'sap.plc.db::basis.t_company_code',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_company_code__text',
                'mappingTable': 'sap.plc.db::basis.t_company_code__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_component_split',
                'mappingTable': 'sap.plc.db::basis.t_component_split',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'FIELD_REFERENCE_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'TABLE_REFERENCE_ID',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_component_split__text',
                'mappingTable': 'sap.plc.db::basis.t_component_split__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_controlling_area',
                'mappingTable': 'sap.plc.db::basis.t_controlling_area',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_controlling_area__text',
                'mappingTable': 'sap.plc.db::basis.t_controlling_area__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_center',
                'mappingTable': 'sap.plc.db::basis.t_cost_center',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_cost_center__text',
                'mappingTable': 'sap.plc.db::basis.t_cost_center__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet__text',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_base',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet_base',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_base_row',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet_base_row',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'IF_AN_AGGREGATE',
                        'mappingColumn': 'SUBITEM_STATE'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_overhead',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet_overhead',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_overhead_row',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet_overhead_row',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'OVERHEAD_PRICE_UOM_ID',
                        'mappingColumn': 'OVERHEAD_PRICE_UNIT_UOM_ID'
                    },
                    {
                        'originalColumn': 'CALCULATION_ID',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_row',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet_row',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_row__text',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet_row__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_costing_sheet_row_dependencies',
                'mappingTable': 'sap.plc.db::basis.t_costing_sheet_row_dependencies',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_currency',
                'mappingTable': 'sap.plc.db::basis.t_currency',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'DECIMALS_DISPLAYED',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_currency__text',
                'mappingTable': 'sap.plc.db::basis.t_currency__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_currency_conversion',
                'mappingTable': 'sap.plc.db::basis.t_currency_conversion',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_customer',
                'mappingTable': 'sap.plc.db::basis.t_customer',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_document',
                'mappingTable': 'sap.plc.db::basis.t_document',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'LABORATORY_DESIGN_OFFICE_ID',
                        'mappingColumn': 'DESIGN_OFFICE_ID'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_document__text',
                'mappingTable': 'sap.plc.db::basis.t_document__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_document_material',
                'mappingTable': 'sap.plc.db::basis.t_document_material',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_document_status',
                'mappingTable': 'sap.plc.db::basis.t_document_status',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_document_status__text',
                'mappingTable': 'sap.plc.db::basis.t_document_status__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_document_type',
                'mappingTable': 'sap.plc.db::basis.t_document_type',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_document_type__text',
                'mappingTable': 'sap.plc.db::basis.t_document_type__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_laboratory_design_office__text',
                'mappingTable': 'sap.plc.db::basis.t_design_office__text',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'LABORATORY_DESIGN_OFFICE_ID',
                        'mappingColumn': 'DESIGN_OFFICE_ID'
                    },
                    {
                        'originalColumn': 'LABORATORY_DESIGN_OFFICE_DESCRIPTION',
                        'mappingColumn': 'DESIGN_OFFICE_DESCRIPTION'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_language',
                'mappingTable': 'sap.plc.db::basis.t_language',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material',
                'mappingTable': 'sap.plc.db::basis.t_material',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'GROSS_WEIGHT',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'NET_WEIGHT',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'VOLUME_UOM_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'WEIGHT_UOM_ID',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material__text',
                'mappingTable': 'sap.plc.db::basis.t_material__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_group',
                'mappingTable': 'sap.plc.db::basis.t_material_group',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_group__text',
                'mappingTable': 'sap.plc.db::basis.t_material_group__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_plant',
                'mappingTable': 'sap.plc.db::basis.t_material_plant',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'MATERIAL_COSTING_LOT_SIZE',
                        'mappingColumn': 'MATERIAL_LOT_SIZE'
                    },
                    {
                        'originalColumn': 'MATERIAL_COSTING_LOT_SIZE_UOM_ID',
                        'mappingColumn': 'MATERIAL_LOT_SIZE_UOM_ID'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_type',
                'mappingTable': 'sap.plc.db::basis.t_material_type',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_material_type__text',
                'mappingTable': 'sap.plc.db::basis.t_material_type__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_overhead_group',
                'mappingTable': 'sap.plc.db::basis.t_overhead_group',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_overhead_group__text',
                'mappingTable': 'sap.plc.db::basis.t_overhead_group__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_plant',
                'mappingTable': 'sap.plc.db::basis.t_plant',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_plant__text',
                'mappingTable': 'sap.plc.db::basis.t_plant__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_profit_center',
                'mappingTable': 'sap.plc.db::basis.t_profit_center',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_profit_center__text',
                'mappingTable': 'sap.plc.db::basis.t_profit_center__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_uom',
                'mappingTable': 'sap.plc.db::basis.t_uom',
                'mappingColumns': [
                    {
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    },
                    {
                        'originalColumn': 'DECIMALS_DISPLAYED',
                        'mappingColumn': ''
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_uom__text',
                'mappingTable': 'sap.plc.db::basis.t_uom__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_valuation_class',
                'mappingTable': 'sap.plc.db::basis.t_valuation_class',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_valuation_class__text',
                'mappingTable': 'sap.plc.db::basis.t_valuation_class__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_vendor',
                'mappingTable': 'sap.plc.db::basis.t_vendor',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_work_center',
                'mappingTable': 'sap.plc.db::basis.t_work_center',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_work_center__text',
                'mappingTable': 'sap.plc.db::basis.t_work_center__text',
                'mappingColumns': [{
                        'originalColumn': '_CREATED_BY_USER_ID',
                        'mappingColumn': '_CREATED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_log',
                'mappingTable': 'sap.plc.db::basis.t_installation_log',
                'mappingColumns': [{
                        'originalColumn': 'EXECUTED_BY_USER_ID',
                        'mappingColumn': 'EXECUTED_BY'
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_item_calculated_values_costing_sheet',
                'mappingTable': 'sap.plc.db::basis.t_item_calculated_values_costing_sheet',
                'mappingColumns': [
                    {
                        'originalColumn': 'IS_AN_AGGREGATION',
                        'mappingColumn': 'HAS_SUBITEMS'
                    },
                    {
                        'originalColumn': 'IS_ROLLED_UP',
                        'mappingColumn': 'IS_ROLLED_UP_VALUE'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_calculation_version_temporary',
                'mappingTable': 'sap.plc.db::basis.t_calculation_version_temporary',
                'mappingColumns': [{
                        'originalColumn': 'PREDECESSOR_VERSION_ID',
                        'mappingColumn': ''
                    }]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_metadata',
                'mappingTable': 'sap.plc.db::basis.t_metadata',
                'mappingColumns': [
                    {
                        'originalColumn': 'DIMENSION_ID',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'TRIGGERS_CALC_ENGINE',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    }
                ]
            },
            {
                'originalTable': 'sap.plc.db::basis.t_metadata_item_attributes',
                'mappingTable': 'sap.plc.db::basis.t_metadata_item_attributes',
                'mappingColumns': [
                    {
                        'originalColumn': 'HAS_CHILDREN',
                        'mappingColumn': 'SUBITEM_STATE'
                    },
                    {
                        'originalColumn': 'IS_ACTIVE',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'IS_REQUIRED_FOR_COMPLETENESS',
                        'mappingColumn': ''
                    },
                    {
                        'originalColumn': 'CREATED_AT',
                        'mappingColumn': 'CREATED_ON'
                    },
                    {
                        'originalColumn': 'CREATED_BY_USER_ID',
                        'mappingColumn': 'CREATED_BY'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_AT',
                        'mappingColumn': 'LAST_MODIFIED_ON'
                    },
                    {
                        'originalColumn': 'LAST_MODIFIED_BY_USER_ID',
                        'mappingColumn': 'LAST_MODIFIED_BY'
                    }
                ]
            }
        ]
    }]);

const aSchemaModification = aSchemaMapping[0].schema_modification;

// If table is removed on XSA, return false, otherwise true
function tableNotRemoved(sTableName) {
    return !aSchemaModification.some(oSchemaModification => oSchemaModification.originalTable === sTableName && oSchemaModification.mappingTable === '');
}

// Return the target table name
// If the target table name is not the same as original table, return the renamed table name
function getTargetTableName(sTableName) {
    let oTargetTable = sTableName;
    const bTableRenamed = aSchemaModification.some(oSchemaModification => oSchemaModification.originalTable === sTableName && oSchemaModification.mappingTable !== sTableName && !!(oTargetTable = oSchemaModification.mappingTable));
    return oTargetTable;
}

// Get the arrary of deleted columns for table
function getDeletedColumns(sTableName) {
    const aMappingColumns = aSchemaModification.find(oSchemaModification => oSchemaModification.originalTable === sTableName);
    if (!aMappingColumns) {
        return [];
    } else {
        return aMappingColumns.mappingColumns.filter(oMappingColumn => oMappingColumn.mappingColumn === '');
    }
}
;

// Get the array of renamed columns for table
function getRenamedColumns(sTableName) {
    const aMappingColumns = aSchemaModification.find(oSchemaModification => oSchemaModification.originalTable === sTableName);
    if (!aMappingColumns) {
        return [];
    } else {
        return aMappingColumns.mappingColumns.filter(oMappingColumn => oMappingColumn.mappingColumn !== '');
    }
}

function getRenameColumn(sTableName, sColumnName) {
    let oMappingColumn = null;
    let oMappingTable = aSchemaModification.find(oSchemaModification => {
        return oSchemaModification.originalTable === sTableName;
    });
    if (oMappingTable) {
        oMappingColumn = oMappingTable.mappingColumns.find(oMappingColumnItem => {
            return oMappingColumnItem.originalColumn === sColumnName;
        });
    }
    return oMappingColumn ? oMappingColumn.mappingColumn : sColumnName;
}
export default {aSchemaMapping,aSchemaModification,tableNotRemoved,getTargetTableName,getDeletedColumns,getRenamedColumns,getRenameColumn};
