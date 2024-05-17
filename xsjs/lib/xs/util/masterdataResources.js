var MasterdataResource = Object.freeze({
    'Account': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_account',
            plcTextTable: 'sap.plc.db::basis.t_account__text',
            plcExtensionTable: 't_account_ext',
            erpTable: 'sap.plc.db.replication.views::v_cskb',
            erpTextTable: 'sap.plc.db::repl.t_csku_tka01',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_account',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_account__text'
        },
        configuration: {
            aKeyColumns: [
                'ACCOUNT_ID',
                'CONTROLLING_AREA_ID'
            ],
            aTextColumns: ['ACCOUNT_DESCRIPTION'],
            aKeyErpTableColumns: [
                'KSTAR',
                'KOKRS'
            ],
            oMappingMainErpPlc: {
                'KSTAR': 'ACCOUNT_ID',
                'KOKRS': 'CONTROLLING_AREA_ID'
            },
            oMappingTextErpPlc: {
                'KSTAR': 'ACCOUNT_ID',
                'KOKRS': 'CONTROLLING_AREA_ID',
                'KTEXT': 'ACCOUNT_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'ACCOUNT_ENTITIES',
            TextEntitiesSection: 'ACCOUNT_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Process',
                    'FieldsName': [[
                            'ACCOUNT_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                },
                {
                    'BusinessObjectName': 'Activity_Type',
                    'FieldsName': [[
                            'ACCOUNT_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                },
                {
                    'BusinessObjectName': 'Material_Account_Determination',
                    'FieldsName': [[
                            'ACCOUNT_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                }
            ],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                }]
        }
    },
    'Account_Group': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_account_group',
            plcTextTable: 'sap.plc.db::basis.t_account_group__text',
            erpTable: '',
            erpTextTable: ''
        },
        configuration: {
            aKeyColumns: ['ACCOUNT_GROUP_ID'],
            aTextColumns: ['ACCOUNT_GROUP_DESCRIPTION'],
            MainEntitiesSection: 'ACCOUNT_GROUP_ENTITIES',
            TextEntitiesSection: 'ACCOUNT_GROUP_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Component_Split',
                    'TableName': 'sap.plc.db::basis.t_component_split_account_group',
                    'FieldsName': [['ACCOUNT_GROUP_ID']]
                },
                {
                    'BusinessObjectName': 'Costing_Sheet',
                    'TableName': 'sap.plc.db::basis.t_costing_sheet_row',
                    'FieldsName': [['ACCOUNT_GROUP_AS_BASE_ID']]
                }
            ],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                }]
        }
    },
    'Account_Account_Group': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_account_account_group',
            plcTextTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Component_Split_Account_Group': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_component_split_account_group',
            plcTextTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Activity_Price': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_activity_price',
            plcTextTable: '',
            plcExtensionTable: 'sap.plc.db::basis.t_activity_price_ext',
            erpTable: '',
            erpTextTable: '',
            tempTable: '',
            tempTextTable: ''
        },
        configuration: {
            aKeyColumns: ['PRICE_ID'],
            MainEntitiesSection: 'ACTIVITY_PRICE_ENTITIES',
            aOtherMandatoryColumns: [
                'TRANSACTION_CURRENCY_ID',
                'PRICE_UNIT_UOM_ID',
                'PRICE_SOURCE_ID',
                'CONTROLLING_AREA_ID',
                'COST_CENTER_ID',
                'ACTIVITY_TYPE_ID',
                'PROJECT_ID',
                'VALID_FROM',
                'CUSTOMER_ID',
                'VALID_FROM_QUANTITY'
            ],
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Cost_Center',
                    'FieldsName': [[
                            'COST_CENTER_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                },
                {
                    'BusinessObjectName': 'Activity_Type',
                    'FieldsName': [[
                            'ACTIVITY_TYPE_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                },
                {
                    'BusinessObjectName': 'Unit_Of_Measure',
                    'FieldsName': [['PRICE_UNIT_UOM_ID']]
                },
                {
                    'BusinessObjectName': 'Currency',
                    'FieldsName': [['TRANSACTION_CURRENCY_ID']]
                },
                {
                    'BusinessObjectName': 'Customer',
                    'FieldsName': [['CUSTOMER_ID']]
                },
                {
                    'BusinessObjectName': 'Project',
                    'FieldsName': [['PROJECT_ID']],
                    'TableName': 'sap.plc.db::basis.t_project',
                    'IsVersioned': false
                }
            ]
        }
    },
    'Activity_Type': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_activity_type',
            plcTextTable: 'sap.plc.db::basis.t_activity_type__text',
            plcExtensionTable: 't_activity_type_ext',
            erpTable: 'sap.plc.db.replication.views::v_csla',
            erpTextTable: 'sap.plc.db.replication.views::v_cslt',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_activity_type',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_activity_type__text'
        },
        configuration: {
            aKeyColumns: [
                'ACTIVITY_TYPE_ID',
                'CONTROLLING_AREA_ID'
            ],
            aTextColumns: ['ACTIVITY_TYPE_DESCRIPTION'],
            aKeyErpTableColumns: [
                'LSTAR',
                'KOKRS'
            ],
            oMappingMainErpPlc: {
                'LSTAR': 'ACTIVITY_TYPE_ID',
                'KOKRS': 'CONTROLLING_AREA_ID',
                'VKSTA': 'ACCOUNT_ID'
            },
            oMappingTextErpPlc: {
                'LSTAR': 'ACTIVITY_TYPE_ID',
                'KOKRS': 'CONTROLLING_AREA_ID',
                'KTEXT': 'ACTIVITY_TYPE_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'ACTIVITY_TYPE_ENTITIES',
            TextEntitiesSection: 'ACTIVITY_TYPE_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Work_Center_Activity',
                    'FieldsName': [[
                            'ACTIVITY_TYPE_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                },
                {
                    'BusinessObjectName': 'Activity_Price',
                    'FieldsName': [[
                            'ACTIVITY_TYPE_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                }
            ],
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Account',
                    'FieldsName': [[
                            'ACCOUNT_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                }
            ]
        }
    },
    'Business_Area': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_business_area',
            plcTextTable: 'sap.plc.db::basis.t_business_area__text',
            plcExtensionTable: 't_business_area_ext',
            erpTable: 'sap.plc.db::repl.tgsb',
            erpTextTable: 'sap.plc.db::repl.t_tgsbt',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_business_area',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_business_area__text'
        },
        configuration: {
            aKeyColumns: ['BUSINESS_AREA_ID'],
            aTextColumns: ['BUSINESS_AREA_DESCRIPTION'],
            aKeyErpTableColumns: ['GSBER'],
            oMappingMainErpPlc: { 'GSBER': 'BUSINESS_AREA_ID' },
            oMappingTextErpPlc: {
                'GSBER': 'BUSINESS_AREA_ID',
                'GTEXT': 'BUSINESS_AREA_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'BUSINESS_AREA_ENTITIES',
            TextEntitiesSection: 'BUSINESS_AREA_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [['BUSINESS_AREA_ID']],
                    'IsVersioned': false
                }]
        }
    },
    'Process': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_process',
            plcTextTable: 'sap.plc.db::basis.t_process__text',
            plcExtensionTable: 't_process_ext',
            erpTable: 'sap.plc.db.replication.views::v_cbpr',
            erpTextTable: 'sap.plc.db.replication.views::v_cbpt',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_process',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_process__text'
        },
        configuration: {
            aKeyColumns: [
                'PROCESS_ID',
                'CONTROLLING_AREA_ID'
            ],
            aTextColumns: ['PROCESS_DESCRIPTION'],
            aKeyErpTableColumns: [
                'PRZNR',
                'KOKRS'
            ],
            oMappingMainErpPlc: {
                'PRZNR': 'PROCESS_ID',
                'KOKRS': 'CONTROLLING_AREA_ID'
            },
            oMappingTextErpPlc: {
                'PRZNR': 'PROCESS_ID',
                'KOKRS': 'CONTROLLING_AREA_ID',
                'KTEXT': 'PROCESS_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'PROCESS_ENTITIES',
            TextEntitiesSection: 'PROCESS_TEXT_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Account',
                    'FieldsName': [[
                            'ACCOUNT_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                }
            ],
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Work_Center_Process',
                    'TableName': 'sap.plc.db::basis.t_work_center_process',
                    'FieldsName': [[
                            'PROCESS_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                }]
        }
    },
    'Confidence_Level': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_confidence_level',
            plcTextTable: 'sap.plc.db::basis.t_confidence_level__text',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        },
        configuration: {
            aKeyColumns: ['CONFIDENCE_LEVEL_ID'],
            aTextColumns: ['CONFIDENCE_LEVEL_DESCRIPTION'],
            MainEntitiesSection: 'CONFIDENCE_LEVEL_ENTITIES',
            TextEntitiesSection: 'CONFIDENCE_LEVEL_TEXT_ENTITIES',
            IsVersioned: false,
            ReferencedObjects: [{
                    'BusinessObjectName': 'Price_Source',
                    'FieldsName': [['CONFIDENCE_LEVEL_ID']]
                }]
        }
    },
    'Company_Code': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_company_code',
            plcTextTable: 'sap.plc.db::basis.t_company_code__text',
            plcExtensionTable: 't_company_code_ext',
            erpTable: 'sap.plc.db::repl.t_t001_tka02',
            erpTextTable: 'sap.plc.db::repl.t_t001__text',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_company_code',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_company_code__text'
        },
        configuration: {
            aKeyColumns: ['COMPANY_CODE_ID'],
            aTextColumns: ['COMPANY_CODE_DESCRIPTION'],
            aReadOnlyColumns: ['CONTROLLING_AREA_ID'],
            aOtherMandatoryColumns: ['CONTROLLING_AREA_ID'],
            aKeyErpTableColumns: ['BUKRS'],
            oMappingMainErpPlc: {
                'BUKRS': 'COMPANY_CODE_ID',
                'KOKRS': 'CONTROLLING_AREA_ID',
                'WAERS': 'COMPANY_CODE_CURRENCY_ID'
            },
            oMappingTextErpPlc: {
                'BUKRS': 'COMPANY_CODE_ID',
                'BUTXT': 'COMPANY_CODE_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'COMPANY_CODE_ENTITIES',
            TextEntitiesSection: 'COMPANY_CODE_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Plant',
                    'FieldsName': [['COMPANY_CODE_ID']]
                },
                {
                    'BusinessObjectName': 'Costing_Sheet',
                    'TableName': 'sap.plc.db::basis.t_costing_sheet_overhead_row',
                    'FieldsName': [['COMPANY_CODE_ID']]
                },
                {
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [['COMPANY_CODE_ID']],
                    'IsVersioned': false
                }
            ],
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Currency',
                    'FieldsName': [['COMPANY_CODE_CURRENCY_ID']]
                }
            ]
        }
    },
    'Component_Split': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_component_split',
            plcTextTable: 'sap.plc.db::basis.t_component_split__text',
            erpTable: '',
            erpTextTable: ''
        },
        configuration: {
            aKeyColumns: ['COMPONENT_SPLIT_ID'],
            aTextColumns: ['COMPONENT_SPLIT_DESCRIPTION'],
            MainEntitiesSection: 'COMPONENT_SPLIT_ENTITIES',
            TextEntitiesSection: 'COMPONENT_SPLIT_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [['COMPONENT_SPLIT_ID']],
                    'IsVersioned': false
                }],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                }]
        }
    },
    'Controlling_Area': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_controlling_area',
            plcTextTable: 'sap.plc.db::basis.t_controlling_area__text',
            plcExtensionTable: 't_controlling_area_ext',
            erpTable: 'sap.plc.db::repl.tka01',
            erpTextTable: 'sap.plc.db::repl.t_tka01__text',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_controlling_area',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_controlling_area__text'
        },
        configuration: {
            aKeyColumns: ['CONTROLLING_AREA_ID'],
            aTextColumns: ['CONTROLLING_AREA_DESCRIPTION'],
            aKeyErpTableColumns: ['KOKRS'],
            oMappingMainErpPlc: {
                'KOKRS': 'CONTROLLING_AREA_ID',
                'WAERS': 'CONTROLLING_AREA_CURRENCY_ID'
            },
            oMappingTextErpPlc: {
                'KOKRS': 'CONTROLLING_AREA_ID',
                'BEZEI': 'CONTROLLING_AREA_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'CONTROLLING_AREA_ENTITIES',
            TextEntitiesSection: 'CONTROLLING_AREA_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Account',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Activity_Type',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Activity_Price',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Process',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Company_Code',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Component_Split',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Cost_Center',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Costing_Sheet',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Costing_Sheet',
                    'TableName': 'sap.plc.db::basis.t_costing_sheet_overhead_row',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Account_Determination',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Profit_Center',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Work_Center',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Work_Center_Activity',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [['CONTROLLING_AREA_ID']],
                    'IsVersioned': false
                }
            ],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Currency',
                    'FieldsName': [['CONTROLLING_AREA_CURRENCY_ID']]
                }]
        }
    },
    'Cost_Center': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_cost_center',
            plcTextTable: 'sap.plc.db::basis.t_cost_center__text',
            plcExtensionTable: 'sap.plc.db::basis.t_cost_center_ext',
            erpTable: 'sap.plc.db.replication.views::v_csks',
            erpTextTable: 'sap.plc.db.replication.views::v_cskt',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_cost_center',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_cost_center__text'
        },
        configuration: {
            aKeyColumns: [
                'COST_CENTER_ID',
                'CONTROLLING_AREA_ID'
            ],
            aTextColumns: ['COST_CENTER_DESCRIPTION'],
            aKeyErpTableColumns: [
                'KOSTL',
                'KOKRS'
            ],
            oMappingMainErpPlc: {
                'KOSTL': 'COST_CENTER_ID',
                'KOKRS': 'CONTROLLING_AREA_ID'
            },
            oMappingTextErpPlc: {
                'KOSTL': 'COST_CENTER_ID',
                'KOKRS': 'CONTROLLING_AREA_ID',
                'KTEXT': 'COST_CENTER_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'COST_CENTER_ENTITIES',
            TextEntitiesSection: 'COST_CENTER_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Work_Center',
                    'FieldsName': [[
                            'COST_CENTER_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                },
                {
                    'BusinessObjectName': 'Activity_Price',
                    'FieldsName': [[
                            'COST_CENTER_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                }
            ],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                }]
        }
    },
    'Costing_Sheet': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet',
            plcTextTable: 'sap.plc.db::basis.t_costing_sheet__text',
            erpTable: '',
            erpTextTable: ''
        },
        configuration: {
            aKeyColumns: ['COSTING_SHEET_ID'],
            aTextColumns: [
                'COSTING_SHEET_DESCRIPTION',
                'TOTAL_COST2_DESCRIPTION',
                'TOTAL_COST3_DESCRIPTION'
            ],
            MainEntitiesSection: 'COSTING_SHEET_ENTITIES',
            TextEntitiesSection: 'COSTING_SHEET_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [['COSTING_SHEET_ID']],
                    'IsVersioned': false
                }],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                }]
        }
    },
    'Costing_Sheet_Row': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_row',
            plcTextTable: 'sap.plc.db::basis.t_costing_sheet_row__text',
            erpTable: '',
            erpTextTable: ''
        },
        configuration: {
            aKeyColumns: [
                'COSTING_SHEET_ID',
                'COSTING_SHEET_ROW_TYPE',
                'COSTING_SHEET_BASE_ID',
                'CALCULATION_ORDER'
            ],
            aTextColumns: ['COSTING_SHEET_ROW_ID'],
            MainEntitiesSection: 'COSTING_SHEET_ROW_ENTITIES',
            TextEntitiesSection: 'COSTING_SHEET_ROW_TEXT_ENTITIES',
            IsVersioned: true
        }
    },
    'Costing_Sheet_Base_Row': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_base_row',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Base': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_base',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Overhead': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_overhead',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Overhead_Row': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_overhead_row',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Overhead_Row_Formula': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_overhead_row_formula',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Row_Dependencies': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_row_dependencies',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Currency': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_currency',
            plcTextTable: 'sap.plc.db::basis.t_currency__text',
            plcExtensionTable: 't_currency_ext',
            erpTable: '',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_currency',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_currency__text'
        },
        configuration: {
            aKeyColumns: ['CURRENCY_ID'],
            aTextColumns: [
                'CURRENCY_CODE',
                'CURRENCY_DESCRIPTION'
            ],
            MainEntitiesSection: 'CURRENCY_ENTITIES',
            TextEntitiesSection: 'CURRENCY_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Company_Code',
                    'FieldsName': [['COMPANY_CODE_CURRENCY_ID']]
                },
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_CURRENCY_ID']]
                },
                {
                    'BusinessObjectName': 'Currency_Conversion',
                    'FieldsName': [
                        ['FROM_CURRENCY_ID'],
                        ['TO_CURRENCY_ID']
                    ]
                },
                {
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [
                        ['SALES_PRICE_CURRENCY_ID'],
                        ['REPORT_CURRENCY_ID']
                    ],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Calculation_Version',
                    'TableName': 'sap.plc.db::basis.t_calculation_version',
                    'FieldsName': [
                        ['SALES_PRICE_CURRENCY_ID'],
                        ['REPORT_CURRENCY_ID']
                    ],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Calculation_Version',
                    'TableName': 'sap.plc.db::basis.t_calculation_version_temporary',
                    'FieldsName': [
                        ['SALES_PRICE_CURRENCY_ID'],
                        ['REPORT_CURRENCY_ID']
                    ],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Item',
                    'TableName': 'sap.plc.db::basis.t_item',
                    'FieldsName': [
                        ['TRANSACTION_CURRENCY_ID'],
                        ['TARGET_COST_CURRENCY_ID']
                    ],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Item',
                    'TableName': 'sap.plc.db::basis.t_item_temporary',
                    'FieldsName': [
                        ['TRANSACTION_CURRENCY_ID'],
                        ['TARGET_COST_CURRENCY_ID']
                    ],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Variant',
                    'TableName': 'sap.plc.db::basis.t_variant',
                    'FieldsName': [
                        ['SALES_PRICE_CURRENCY_ID'],
                        ['REPORT_CURRENCY_ID']
                    ],
                    'IsVersioned': false
                }
            ]
        }
    },
    'Currency_Conversion': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_currency_conversion',
            plcExtensionTable: 't_currency_conversion_ext',
            erpTable: 'sap.plc.db.replication.views::v_tcurr_tcurf',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_currency_conversion',
            tempTextTable: ''
        },
        configuration: {
            aKeyColumns: [
                'EXCHANGE_RATE_TYPE_ID',
                'FROM_CURRENCY_ID',
                'TO_CURRENCY_ID',
                'VALID_FROM'
            ],
            aKeyErpTableColumns: [
                'FCURR',
                'TCURR',
                'ERP_DATE'
            ],
            oMappingMainErpPlc: {
                'FCURR': 'FROM_CURRENCY_ID',
                'TCURR': 'TO_CURRENCY_ID',
                'ERP_DATE': 'VALID_FROM',
                'FFACT': 'FROM_FACTOR',
                'TFACT': 'TO_FACTOR',
                'UKURS': 'RATE'
            },
            MainEntitiesSection: 'CURRENCY_CONVERSION_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [{
                    'BusinessObjectName': 'Currency',
                    'FieldsName': [
                        ['FROM_CURRENCY_ID'],
                        ['TO_CURRENCY_ID']
                    ]
                }]
        }
    },
    'Customer': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_customer',
            plcTextTable: '',
            plcExtensionTable: 't_customer_ext',
            erpTable: 'sap.plc.db::repl.t_kna1',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_customer',
            tempTextTable: ''
        },
        configuration: {
            aKeyColumns: ['CUSTOMER_ID'],
            aKeyErpTableColumns: ['KUNNR'],
            oMappingMainErpPlc: {
                'KUNNR': 'CUSTOMER_ID',
                'NAME1': 'CUSTOMER_NAME',
                'LAND1': 'COUNTRY',
                'PSTLZ': 'POSTAL_CODE',
                'REGIO': 'REGION',
                'ORT01': 'CITY',
                'STRAS': 'STREET_NUMBER_OR_PO_BOX'
            },
            MainEntitiesSection: 'CUSTOMER_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [['CUSTOMER_ID']],
                    'IsVersioned': false
                }]
        }
    },
    'Dimension': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_dimension',
            plcTextTable: 'sap.plc.db::basis.t_dimension__text',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_dimension',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_dimension__text'
        },
        configuration: {
            aKeyColumns: ['DIMENSION_ID'],
            aTextColumns: ['DIMENSION_DESCRIPTION'],
            MainEntitiesSection: 'DIMENSION_ENTITIES',
            TextEntitiesSection: 'DIMENSION_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Unit_Of_Measure',
                    'FieldsName': [['DIMENSION_ID']]
                }]
        }
    },
    'Document': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_document',
            plcTextTable: 'sap.plc.db::basis.t_document__text',
            plcExtensionTable: 't_document_ext',
            erpTable: 'sap.plc.db::repl.draw',
            erpTextTable: 'sap.plc.db::repl.t_drat',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_document',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_document__text'
        },
        configuration: {
            aKeyColumns: [
                'DOCUMENT_TYPE_ID',
                'DOCUMENT_ID',
                'DOCUMENT_VERSION',
                'DOCUMENT_PART'
            ],
            aTextColumns: ['DOCUMENT_DESCRIPTION'],
            aKeyErpTableColumns: [
                'DOKAR',
                'DOKNR',
                'DOKVR',
                'DOKTL'
            ],
            oMappingMainErpPlc: {
                'DOKAR': 'DOCUMENT_TYPE_ID',
                'DOKNR': 'DOCUMENT_ID',
                'DOKVR': 'DOCUMENT_VERSION',
                'DOKTL': 'DOCUMENT_PART',
                'DOKST': 'DOCUMENT_STATUS_ID',
                'LABOR': 'DESIGN_OFFICE_ID'
            },
            oMappingTextErpPlc: {
                'DOKAR': 'DOCUMENT_TYPE_ID',
                'DOKNR': 'DOCUMENT_ID',
                'DOKVR': 'DOCUMENT_VERSION',
                'DOKTL': 'DOCUMENT_PART',
                'DKTXT': 'DOCUMENT_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'DOCUMENT_ENTITIES',
            TextEntitiesSection: 'DOCUMENT_TEXT_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Document_Type',
                    'FieldsName': [['DOCUMENT_TYPE_ID']]
                },
                {
                    'BusinessObjectName': 'Document_Status',
                    'FieldsName': [[
                            'DOCUMENT_TYPE_ID',
                            'DOCUMENT_STATUS_ID'
                        ]]
                }
            ]
        }
    },
    'Document_Type': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_document_type',
            plcTextTable: 'sap.plc.db::basis.t_document_type__text',
            plcExtensionTable: 't_document_type_ext',
            erpTable: 'sap.plc.db::repl.tdwa',
            erpTextTable: 'sap.plc.db::repl.t_tdwat',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_document_type',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_document_type__text'
        },
        configuration: {
            aKeyColumns: ['DOCUMENT_TYPE_ID'],
            aTextColumns: ['DOCUMENT_TYPE_DESCRIPTION'],
            aKeyErpTableColumns: ['DOKAR'],
            oMappingMainErpPlc: { 'DOKAR': 'DOCUMENT_TYPE_ID' },
            oMappingTextErpPlc: {
                'DOKAR': 'DOCUMENT_TYPE_ID',
                'DARTXT': 'DOCUMENT_TYPE_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'DOCUMENT_TYPE_ENTITIES',
            TextEntitiesSection: 'DOCUMENT_TYPE_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Document',
                    'FieldsName': [['DOCUMENT_TYPE_ID']]
                },
                {
                    'BusinessObjectName': 'Document_Status',
                    'FieldsName': [['DOCUMENT_TYPE_ID']]
                }
            ]
        }
    },
    'Document_Status': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_document_status',
            plcTextTable: 'sap.plc.db::basis.t_document_status__text',
            plcExtensionTable: 't_document_status_ext',
            erpTable: 'sap.plc.db::repl.tdws',
            erpTextTable: 'sap.plc.db::repl.t_tdwst',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_document_status',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_document_status__text'
        },
        configuration: {
            aKeyColumns: [
                'DOCUMENT_TYPE_ID',
                'DOCUMENT_STATUS_ID'
            ],
            aTextColumns: ['DOCUMENT_STATUS_DESCRIPTION'],
            aKeyErpTableColumns: [
                'DOKAR',
                'DOKST'
            ],
            oMappingMainErpPlc: {
                'DOKAR': 'DOCUMENT_TYPE_ID',
                'DOKST': 'DOCUMENT_STATUS_ID'
            },
            oMappingTextErpPlc: {
                'DOKST': 'DOCUMENT_STATUS_ID',
                'DOSTX': 'DOCUMENT_STATUS_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'DOCUMENT_STATUS_ENTITIES',
            TextEntitiesSection: 'DOCUMENT_STATUS_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Document',
                    'FieldsName': [[
                            'DOCUMENT_TYPE_ID',
                            'DOCUMENT_STATUS_ID'
                        ]]
                }],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Document_Type',
                    'FieldsName': [['DOCUMENT_TYPE_ID']]
                }]
        }
    },
    'Exchange_Rate_Type': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_exchange_rate_type',
            plcTextTable: 'sap.plc.db::basis.t_exchange_rate_type__text',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_exchange_rate_type',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_exchange_rate_type__text'
        },
        configuration: {
            aKeyColumns: ['EXCHANGE_RATE_TYPE_ID'],
            aTextColumns: ['EXCHANGE_RATE_TYPE_DESCRIPTION'],
            aOtherMandatoryColumns: [],
            MainEntitiesSection: 'EXCHANGE_RATE_TYPE_ENTITIES',
            TextEntitiesSection: 'EXCHANGE_RATE_TYPE_TEXT_ENTITIES',
            IsVersioned: false,
            UsedInBusinessObjects: []
        }
    },
    'Design_Office': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_design_office',
            plcTextTable: 'sap.plc.db::basis.t_design_office__text',
            erpTable: '',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_design_office',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_design_office__text'
        },
        configuration: {
            aKeyColumns: ['DESIGN_OFFICE_ID'],
            aTextColumns: ['DESIGN_OFFICE_DESCRIPTION'],
            MainEntitiesSection: 'DESIGN_OFFICE_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Document',
                    'FieldsName': [['DESIGN_OFFICE_ID']]
                }]
        }
    },
    'Language': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_language',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_language',
            tempTextTable: ''
        },
        configuration: {
            aKeyColumns: ['LANGUAGE'],
            MainEntitiesSection: 'LANGUAGE_ENTITIES',
            IsVersioned: true
        }
    },
    'Material': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_material',
            plcTextTable: 'sap.plc.db::basis.t_material__text',
            plcExtensionTable: 'sap.plc.db::basis.t_material_ext',
            erpTable: 'sap.plc.db::repl.t_mara_t006',
            erpTextTable: 'sap.plc.db::repl.t_makt_t006',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_material',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_material__text'
        },
        configuration: {
            aKeyColumns: ['MATERIAL_ID'],
            aTextColumns: ['MATERIAL_DESCRIPTION'],
            aKeyErpTableColumns: ['MATNR'],
            oMappingMainErpPlc: {
                'MATNR': 'MATERIAL_ID',
                'MEINS': 'BASE_UOM_ID',
                'MTART': 'MATERIAL_TYPE_ID',
                'CADKZ': 'IS_CREATED_VIA_CAD_INTEGRATION',
                'KZKFG': 'IS_CONFIGURABLE_MATERIAL'
            },
            oMappingTextErpPlc: {
                'MATNR': 'MATERIAL_ID',
                'MAKTX': 'MATERIAL_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'MATERIAL_ENTITIES',
            TextEntitiesSection: 'MATERIAL_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Material_Plant',
                    'FieldsName': [['MATERIAL_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Price',
                    'FieldsName': [['MATERIAL_ID']]
                },
                {
                    'BusinessObjectName': 'Project_MaterialPriceSurcharges',
                    'TableName': 'sap.plc.db::basis.t_project_material_price_surcharges',
                    'FieldsName': [['MATERIAL_ID']],
                    'IsVersioned': false
                }
            ],
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Material_Group',
                    'FieldsName': [['MATERIAL_GROUP_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Type',
                    'FieldsName': [['MATERIAL_TYPE_ID']]
                },
                {
                    'BusinessObjectName': 'Unit_Of_Measure',
                    'FieldsName': [['BASE_UOM_ID']]
                }
            ]
        }
    },
    'Material_Account_Determination': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_material_account_determination',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: 'sap.plc.db.replication.views::v_t030_t001w',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_material_account_determination',
            tempTextTable: ''
        },
        configuration: {
            aKeyColumns: [
                'CONTROLLING_AREA_ID',
                'MATERIAL_TYPE_ID',
                'PLANT_ID',
                'VALUATION_CLASS_ID'
            ],
            aOtherMandatoryColumns: ['ACCOUNT_ID'],
            aKeyErpTableColumns: [
                'KOKRS',
                'MTART',
                'WERKS',
                'BKLAS'
            ],
            oMappingMainErpPlc: {
                'KOKRS': 'CONTROLLING_AREA_ID',
                'MTART': 'MATERIAL_TYPE_ID',
                'WERKS': 'PLANT_ID',
                'BKLAS': 'VALUATION_CLASS_ID',
                'KONTS': 'ACCOUNT_ID'
            },
            MainEntitiesSection: 'MATERIAL_ACCOUNT_DETERMINATION_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Type',
                    'FieldsName': [['MATERIAL_TYPE_ID']]
                },
                {
                    'BusinessObjectName': 'Plant',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Valuation_Class',
                    'FieldsName': [['VALUATION_CLASS_ID']]
                },
                {
                    'BusinessObjectName': 'Account',
                    'FieldsName': [[
                            'ACCOUNT_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                }
            ]
        }
    },
    'Material_Group': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_material_group',
            plcTextTable: 'sap.plc.db::basis.t_material_group__text',
            plcExtensionTable: 't_material_group_ext',
            erpTable: 'sap.plc.db::repl.t023',
            erpTextTable: 'sap.plc.db::repl.t_t023t',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_material_group',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_material_group__text'
        },
        configuration: {
            aKeyColumns: ['MATERIAL_GROUP_ID'],
            aTextColumns: ['MATERIAL_GROUP_DESCRIPTION'],
            aKeyErpTableColumns: ['MATKL'],
            oMappingMainErpPlc: { 'MATKL': 'MATERIAL_GROUP_ID' },
            oMappingTextErpPlc: {
                'MATKL': 'MATERIAL_GROUP_ID',
                'WGBEZ': 'MATERIAL_GROUP_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'MATERIAL_GROUP_ENTITIES',
            TextEntitiesSection: 'MATERIAL_GROUP_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Material',
                    'FieldsName': [['MATERIAL_GROUP_ID']]
                },
                {
                    'BusinessObjectName': 'Project_MaterialPriceSurcharges',
                    'TableName': 'sap.plc.db::basis.t_project_material_price_surcharges',
                    'FieldsName': [['MATERIAL_GROUP_ID']],
                    'IsVersioned': false
                }
            ]
        }
    },
    'Material_Type': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_material_type',
            plcTextTable: 'sap.plc.db::basis.t_material_type__text',
            plcExtensionTable: 't_material_type_ext',
            erpTable: 'sap.plc.db::repl.t134',
            erpTextTable: 'sap.plc.db::repl.t_t134t',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_material_type',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_material_type__text'
        },
        configuration: {
            aKeyColumns: ['MATERIAL_TYPE_ID'],
            aTextColumns: ['MATERIAL_TYPE_DESCRIPTION'],
            aKeyErpTableColumns: ['MTART'],
            oMappingMainErpPlc: { 'MTART': 'MATERIAL_TYPE_ID' },
            oMappingTextErpPlc: {
                'MTART': 'MATERIAL_TYPE_ID',
                'MTBEZ': 'MATERIAL_TYPE_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'MATERIAL_TYPE_ENTITIES',
            TextEntitiesSection: 'MATERIAL_TYPE_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Material',
                    'FieldsName': [['MATERIAL_TYPE_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Account_Determination',
                    'FieldsName': [['MATERIAL_TYPE_ID']]
                },
                {
                    'BusinessObjectName': 'Project_MaterialPriceSurcharges',
                    'TableName': 'sap.plc.db::basis.t_project_material_price_surcharges',
                    'FieldsName': [['MATERIAL_TYPE_ID']],
                    'IsVersioned': false
                }
            ]
        }
    },
    'Material_Plant': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_material_plant',
            plcTextTable: '',
            plcExtensionTable: 'sap.plc.db::basis.t_material_plant_ext',
            erpTable: 'sap.plc.db::repl.t_marc_mbew',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_material_plant',
            tempTextTable: ''
        },
        configuration: {
            aKeyColumns: [
                'MATERIAL_ID',
                'PLANT_ID'
            ],
            aKeyErpTableColumns: [
                'MATNR',
                'WERKS'
            ],
            oMappingMainErpPlc: {
                'MATNR': 'MATERIAL_ID',
                'WERKS': 'PLANT_ID',
                'LOSGR': 'MATERIAL_LOT_SIZE',
                'BKLAS': 'VALUATION_CLASS_ID',
                'KOSGR': 'OVERHEAD_GROUP_ID',
                'MEINS': 'MATERIAL_LOT_SIZE_UOM_ID'
            },
            MainEntitiesSection: 'MATERIAL_PLANT_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Material',
                    'FieldsName': [['MATERIAL_ID']]
                },
                {
                    'BusinessObjectName': 'Plant',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Overhead_Group',
                    'FieldsName': [[
                            'OVERHEAD_GROUP_ID',
                            'PLANT_ID'
                        ]]
                },
                {
                    'BusinessObjectName': 'Valuation_Class',
                    'FieldsName': [['VALUATION_CLASS_ID']]
                },
                {
                    'BusinessObjectName': 'Unit_Of_Measure',
                    'FieldsName': [['MATERIAL_LOT_SIZE_UOM_ID']]
                }
            ]
        }
    },
    'Material_Price': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_material_price',
            plcTextTable: '',
            plcExtensionTable: 'sap.plc.db::basis.t_material_price_ext',
            erpTable: 'sap.plc.db::repl.t_mbew_marc',
            erpTextTable: '',
            tempTable: '',
            tempTextTable: ''
        },
        configuration: {
            aKeyColumns: ['PRICE_ID'],
            aOtherMandatoryColumns: [
                'TRANSACTION_CURRENCY_ID',
                'PRICE_UNIT_UOM_ID',
                'PRICE_SOURCE_ID',
                'MATERIAL_ID',
                'PLANT_ID',
                'VENDOR_ID',
                'PROJECT_ID',
                'VALID_FROM',
                'VALID_FROM_QUANTITY',
                'CUSTOMER_ID'
            ],
            aKeyErpTableColumns: [
                'PRICE_SOURCE_ID',
                'MATNR',
                'WERKS',
                'VENDOR_ID',
                'PROJECT_ID',
                'VALID_FROM',
                'VALID_FROM_QUANTITY'
            ],
            oMappingMainErpPlc: {
                'PRICE_SOURCE_ID': 'PRICE_SOURCE_ID',
                'MATNR': 'MATERIAL_ID',
                'WERKS': 'PLANT_ID',
                'VENDOR_ID': 'VENDOR_ID',
                'PROJECT_ID': 'PROJECT_ID',
                'VALID_FROM': 'VALID_FROM',
                'VALID_TO': 'VALID_TO',
                'VALID_FROM_QUANTITY': 'VALID_FROM_QUANTITY',
                'VALID_TO_QUANTITY': 'VALID_TO_QUANTITY',
                'PURCHASING_GROUP': 'PURCHASING_GROUP',
                'PURCHASING_DOCUMENT': 'PURCHASING_DOCUMENT',
                'LOCAL_CONTENT': 'LOCAL_CONTENT',
                'STPRS': 'PRICE_FIXED_PORTION',
                'WAERS': 'TRANSACTION_CURRENCY_ID',
                'PEINH': 'PRICE_UNIT',
                'MEINS': 'PRICE_UNIT_UOM_ID'
            },
            MainEntitiesSection: 'MATERIAL_PRICE_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Material',
                    'FieldsName': [['MATERIAL_ID']]
                },
                {
                    'BusinessObjectName': 'Plant',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Vendor',
                    'FieldsName': [['VENDOR_ID']]
                },
                {
                    'BusinessObjectName': 'Project',
                    'FieldsName': [['PROJECT_ID']],
                    'TableName': 'sap.plc.db::basis.t_project',
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Unit_Of_Measure',
                    'FieldsName': [['PRICE_UNIT_UOM_ID']]
                },
                {
                    'BusinessObjectName': 'Currency',
                    'FieldsName': [['TRANSACTION_CURRENCY_ID']]
                },
                {
                    'BusinessObjectName': 'Customer',
                    'FieldsName': [['CUSTOMER_ID']]
                }
            ]
        }
    },
    'Overhead_Group': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_overhead_group',
            plcTextTable: 'sap.plc.db::basis.t_overhead_group__text',
            plcExtensionTable: 't_overhead_group_ext',
            erpTable: 'sap.plc.db::repl.t_tck14_t001w',
            erpTextTable: 'sap.plc.db::repl.t_tck15_t001w',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_overhead_group',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_overhead_group__text'
        },
        configuration: {
            aKeyColumns: [
                'OVERHEAD_GROUP_ID',
                'PLANT_ID'
            ],
            aTextColumns: ['OVERHEAD_GROUP_DESCRIPTION'],
            aKeyErpTableColumns: [
                'KOSGR',
                'WERKS'
            ],
            oMappingMainErpPlc: {
                'KOSGR': 'OVERHEAD_GROUP_ID',
                'WERKS': 'PLANT_ID'
            },
            oMappingTextErpPlc: {
                'KOSGR': 'OVERHEAD_GROUP_ID',
                'WERKS': 'PLANT_ID',
                'TXZSCHL': 'OVERHEAD_GROUP_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'OVERHEAD_GROUP_ENTITIES',
            TextEntitiesSection: 'OVERHEAD_GROUP_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Material_Plant',
                    'FieldsName': [[
                            'OVERHEAD_GROUP_ID',
                            'PLANT_ID'
                        ]]
                }],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Plant',
                    'FieldsName': [['PLANT_ID']]
                }]
        }
    },
    'Plant': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_plant',
            plcTextTable: 'sap.plc.db::basis.t_plant__text',
            plcExtensionTable: 't_material_ext',
            erpTable: 'sap.plc.db::repl.t_t001w_t001k',
            erpTextTable: 'sap.plc.db::repl.t_t001w__text',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_plant',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_plant__text'
        },
        configuration: {
            aKeyColumns: ['PLANT_ID'],
            aTextColumns: ['PLANT_DESCRIPTION'],
            aReadOnlyColumns: ['COMPANY_CODE_ID'],
            aOtherMandatoryColumns: ['COMPANY_CODE_ID'],
            aKeyErpTableColumns: ['WERKS'],
            oMappingMainErpPlc: {
                'WERKS': 'PLANT_ID',
                'BUKRS': 'COMPANY_CODE_ID',
                'LAND1': 'COUNTRY',
                'PSTLZ': 'POSTAL_CODE',
                'REGIO': 'REGION',
                'ORT01': 'CITY',
                'STRAS': 'STREET_NUMBER_OR_PO_BOX'
            },
            oMappingTextErpPlc: {
                'WERKS': 'PLANT_ID',
                'NAME1': 'PLANT_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'PLANT_ENTITIES',
            TextEntitiesSection: 'PLANT_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Overhead_Group',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Work_Center',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Plant',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Work_Center_Activity',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Price',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Account_Determination',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Costing_Sheet',
                    'TableName': 'sap.plc.db::basis.t_costing_sheet_overhead_row',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [['PLANT_ID']],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Project_ActivityPriceSurcharges',
                    'TableName': 'sap.plc.db::basis.t_project_activity_price_surcharges',
                    'FieldsName': [['PLANT_ID']],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Project_MaterialPriceSurcharges',
                    'TableName': 'sap.plc.db::basis.t_project_material_price_surcharges',
                    'FieldsName': [['PLANT_ID']],
                    'IsVersioned': false
                }
            ],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Company_Code',
                    'FieldsName': [['COMPANY_CODE_ID']]
                }]
        }
    },
    'Price_Source': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_price_source',
            plcTextTable: 'sap.plc.db::basis.t_price_source__text',
            plcExtensionTable: 't_price_source_ext',
            erpTable: '',
            erpTextTable: ''
        },
        configuration: {
            aKeyColumns: [
                'PRICE_SOURCE_ID',
                'PRICE_SOURCE_TYPE_ID'
            ],
            aTextColumns: ['PRICE_SOURCE_DESCRIPTION'],
            MainEntitiesSection: 'PRICE_SOURCE_ENTITIES',
            TextEntitiesSection: 'PRICE_SOURCE_TEXT_ENTITIES',
            IsVersioned: false,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Activity_Price',
                    'FieldsName': [['PRICE_SOURCE_ID']],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Material_Price',
                    'FieldsName': [['PRICE_SOURCE_ID']],
                    'IsVersioned': false
                }
            ]
        }
    },
    'Profit_Center': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_profit_center',
            plcTextTable: 'sap.plc.db::basis.t_profit_center__text',
            plcExtensionTable: 't_profit_center_ext',
            erpTable: 'sap.plc.db.replication.views::v_cepc',
            erpTextTable: 'sap.plc.db.replication.views::v_cepct',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_profit_center',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_profit_center__text'
        },
        configuration: {
            aKeyColumns: [
                'PROFIT_CENTER_ID',
                'CONTROLLING_AREA_ID'
            ],
            aTextColumns: ['PROFIT_CENTER_DESCRIPTION'],
            aKeyErpTableColumns: [
                'PRCTR',
                'KOKRS'
            ],
            oMappingMainErpPlc: {
                'PRCTR': 'PROFIT_CENTER_ID',
                'KOKRS': 'CONTROLLING_AREA_ID'
            },
            oMappingTextErpPlc: {
                'PRCTR': 'PROFIT_CENTER_ID',
                'KOKRS': 'CONTROLLING_AREA_ID',
                'KTEXT': 'PROFIT_CENTER_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'PROFIT_CENTER_ENTITIES',
            TextEntitiesSection: 'PROFIT_CENTER_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Project',
                    'TableName': 'sap.plc.db::basis.t_project',
                    'FieldsName': [[
                            'PROFIT_CENTER_ID',
                            'CONTROLLING_AREA_ID'
                        ]],
                    'IsVersioned': false
                }],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                }]
        }
    },
    'Unit_Of_Measure': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_uom',
            plcTextTable: 'sap.plc.db::basis.t_uom__text',
            plcExtensionTable: 't_uom_ext',
            erpTable: 'sap.plc.db::repl.t006',
            erpTextTable: 'sap.plc.db::repl.t_t006a_t006',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_unit_of_measure',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_unit_of_measure__text'
        },
        configuration: {
            aKeyColumns: ['UOM_ID'],
            aTextColumns: [
                'UOM_CODE',
                'UOM_DESCRIPTION'
            ],
            aKeyErpTableColumns: ['MSEHI'],
            oMappingMainErpPlc: {
                'MSEHI': 'UOM_ID',
                'DIMID': 'DIMENSION_ID',
                'ZAEHL': 'NUMERATOR',
                'NENNR': 'DENOMINATOR',
                'EXP10': 'EXPONENT_BASE10',
                'ADDKO': 'SI_CONSTANT'
            },
            oMappingTextErpPlc: {
                'LANGU': 'LANGUAGE',
                'MSEHI': 'UOM_ID',
                'MSEHT': 'UOM_DESCRIPTION',
                'MSEH3': 'UOM_CODE'
            },
            MainEntitiesSection: 'UNIT_OF_MEASURE_ENTITIES',
            TextEntitiesSection: 'UNIT_OF_MEASURE_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Material_Plant',
                    'FieldsName': [['MATERIAL_LOT_SIZE_UOM_ID']]
                },
                {
                    'BusinessObjectName': 'Material',
                    'FieldsName': [['BASE_UOM_ID']]
                },
                {
                    'BusinessObjectName': 'Item',
                    'TableName': 'sap.plc.db::basis.t_item',
                    'FieldsName': [
                        ['QUANTITY_UOM_ID'],
                        ['TOTAL_QUANTITY_UOM_ID'],
                        ['PRICE_UNIT_UOM_ID']
                    ],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Item',
                    'TableName': 'sap.plc.db::basis.t_item_temporary',
                    'FieldsName': [
                        ['QUANTITY_UOM_ID'],
                        ['TOTAL_QUANTITY_UOM_ID'],
                        ['PRICE_UNIT_UOM_ID']
                    ],
                    'IsVersioned': false
                },
                {
                    'BusinessObjectName': 'Variant_Item',
                    'TableName': 'sap.plc.db::basis.t_variant_item',
                    'FieldsName': [['QUANTITY_UOM_ID']],
                    'IsVersioned': false
                }
            ],
            ReferencedObjects: [{
                    'BusinessObjectName': 'Dimension',
                    'FieldsName': [['DIMENSION_ID']]
                }]
        }
    },
    'Valuation_Class': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_valuation_class',
            plcTextTable: 'sap.plc.db::basis.t_valuation_class__text',
            plcExtensionTable: 't_valuation_class_ext',
            erpTable: 'sap.plc.db::repl.t025',
            erpTextTable: 'sap.plc.db::repl.t_t025t',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_valuation_class',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_valuation_class__text'
        },
        configuration: {
            aKeyColumns: ['VALUATION_CLASS_ID'],
            aTextColumns: ['VALUATION_CLASS_DESCRIPTION'],
            aKeyErpTableColumns: ['BKLAS'],
            oMappingMainErpPlc: { 'BKLAS': 'VALUATION_CLASS_ID' },
            oMappingTextErpPlc: {
                'BKLAS': 'VALUATION_CLASS_ID',
                'BKBEZ': 'VALUATION_CLASS_DESCRIPTION',
                'LANGU': 'LANGUAGE'
            },
            MainEntitiesSection: 'VALUATION_CLASS_ENTITIES',
            TextEntitiesSection: 'VALUATION_CLASS_TEXT_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [
                {
                    'BusinessObjectName': 'Material_Plant',
                    'FieldsName': [['VALUATION_CLASS_ID']]
                },
                {
                    'BusinessObjectName': 'Material_Account_Determination',
                    'FieldsName': [['VALUATION_CLASS_ID']]
                }
            ]
        }
    },
    'Vendor': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_vendor',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: 'sap.plc.db::repl.t_lfa1',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_vendor',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_vendor__text'
        },
        configuration: {
            aKeyColumns: ['VENDOR_ID'],
            aKeyErpTableColumns: ['LIFNR'],
            oMappingMainErpPlc: {
                'LIFNR': 'VENDOR_ID',
                'NAME1': 'VENDOR_NAME',
                'LAND1': 'COUNTRY',
                'PSTL2': 'POSTAL_CODE',
                'REGIO': 'REGION',
                'STRAS': 'STREET_NUMBER_OR_PO_BOX'
            },
            MainEntitiesSection: 'VENDOR_ENTITIES',
            IsVersioned: true,
            UsedInBusinessObjects: [{
                    'BusinessObjectName': 'Material_Price',
                    'FieldsName': [['MATERIAL_ID']]
                }]
        }
    },
    'Work_Center': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_work_center',
            plcTextTable: 'sap.plc.db::basis.t_work_center__text',
            plcExtensionTable: 'sap.plc.db::basis.t_work_center_ext',
            erpTable: '',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_work_center',
            tempTextTable: 'sap.plc.db.administration::texttemporarytables.gtt_batch_work_center__text'
        },
        configuration: {
            aKeyColumns: [
                'WORK_CENTER_ID',
                'PLANT_ID'
            ],
            aTextColumns: ['WORK_CENTER_DESCRIPTION'],
            aOtherMandatoryColumns: [
                'COST_CENTER_ID',
                'CONTROLLING_AREA_ID'
            ],
            MainEntitiesSection: 'WORK_CENTER_ENTITIES',
            TextEntitiesSection: 'WORK_CENTER_TEXT_ENTITIES',
            WorkCenterProcessSection: 'WORK_CENTER_PROCESS_ENTITIES',
            WorkCenterActivitySection: 'WORK_CENTER_ACTIVITY_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Plant',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Cost_Center',
                    'FieldsName': [[
                            'COST_CENTER_ID',
                            'CONTROLLING_AREA_ID'
                        ]]
                }
            ]
        }
    },
    'Work_Center_Activity': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_work_center_activity_type',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_work_center_activity'
        },
        configuration: {
            aKeyColumns: [
                'ACTIVITY_TYPE_ID',
                'WORK_CENTER_ID',
                'CONTROLLING_AREA_ID',
                'PLANT_ID',
                'PROCESS_ID'
            ],
            MainEntitiesSection: 'WORK_CENTER_ACTIVITY_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Plant',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Work_Center',
                    'FieldsName': [['WORK_CENTER_ID']]
                },
                {
                    'BusinessObjectName': 'Activity_Type',
                    'FieldsName': [['ACTIVITY_TYPE_ID']]
                }
            ]
        }
    },
    'Work_Center_Process': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_work_center_process',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: '',
            tempTable: 'sap.plc.db.administration::maintemporarytables.gtt_batch_work_center_process'
        },
        configuration: {
            aKeyColumns: [
                'PROCESS_ID',
                'WORK_CENTER_ID',
                'CONTROLLING_AREA_ID',
                'PLANT_ID'
            ],
            MainEntitiesSection: 'WORK_CENTER_PROCESS_ENTITIES',
            IsVersioned: true,
            ReferencedObjects: [
                {
                    'BusinessObjectName': 'Controlling_Area',
                    'FieldsName': [['CONTROLLING_AREA_ID']]
                },
                {
                    'BusinessObjectName': 'Plant',
                    'FieldsName': [['PLANT_ID']]
                },
                {
                    'BusinessObjectName': 'Work_Center',
                    'FieldsName': [['WORK_CENTER_ID']]
                },
                {
                    'BusinessObjectName': 'Process',
                    'FieldsName': [['PROCESS_ID']]
                }
            ]
        }
    }
});

var CostingSheetResources = Object.freeze({
    'Costing_Sheet_Overhead_Row': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_overhead_row',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Overhead_Row_Formula': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_overhead_row_formula',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Overhead': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_overhead',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Base': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_base',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    },
    'Costing_Sheet_Base_Row': {
        dbobjects: {
            plcTable: 'sap.plc.db::basis.t_costing_sheet_base_row',
            plcTextTable: '',
            plcExtensionTable: '',
            erpTable: '',
            erpTextTable: ''
        }
    }
});

var Source = Object.freeze([
    1,
    2
]);
var BatchOperation = Object.freeze({
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    UPSERT: 'UPSERT'
});
var Limits = Object.freeze({
    Top: 100000,
    Skip: 100
});

var BusinessObjectsEntities = Object.freeze({
    ACCOUNT_ENTITIES: 'ACCOUNT_ENTITIES',
    ACCOUNT_TEXT_ENTITIES: 'ACCOUNT_TEXT_ENTITIES',
    ACCOUNT_GROUP_ENTITIES: 'ACCOUNT_GROUP_ENTITIES',
    ACCOUNT_GROUP_TEXT_ENTITIES: 'ACCOUNT_GROUP_TEXT_ENTITIES',
    ACCOUNT_RANGES_ENTITIES: 'ACCOUNT_RANGES_ENTITIES',
    ACTIVITY_PRICE_ENTITIES: 'ACTIVITY_PRICE_ENTITIES',
    ACTIVITY_TYPE_ENTITIES: 'ACTIVITY_TYPE_ENTITIES',
    ACTIVITY_TYPE_TEXT_ENTITIES: 'ACTIVITY_TYPE_TEXT_ENTITIES',
    BUSINESS_AREA_ENTITIES: 'BUSINESS_AREA_ENTITIES',
    BUSINESS_AREA_TEXT_ENTITIES: 'BUSINESS_AREA_TEXT_ENTITIES',
    PROCESS_ENTITIES: 'PROCESS_ENTITIES',
    PROCESS_TEXT_ENTITIES: 'PROCESS_TEXT_ENTITIES',
    COMPANY_CODE_ENTITIES: 'COMPANY_CODE_ENTITIES',
    COMPANY_CODE_TEXT_ENTITIES: 'COMPANY_CODE_TEXT_ENTITIES',
    COMPONENT_SPLIT_ENTITIES: 'COMPONENT_SPLIT_ENTITIES',
    COMPONENT_SPLIT_TEXT_ENTITIES: 'COMPONENT_SPLIT_TEXT_ENTITIES',
    CONFIDENCE_LEVEL_ENTITIES: 'CONFIDENCE_LEVEL_ENTITIES',
    CONFIDENCE_LEVEL_TEXT_ENTITIES: 'CONFIDENCE_LEVEL_TEXT_ENTITIES',
    CONTROLLING_AREA_ENTITIES: 'CONTROLLING_AREA_ENTITIES',
    CONTROLLING_AREA_TEXT_ENTITIES: 'CONTROLLING_AREA_TEXT_ENTITIES',
    COST_CENTER_ENTITIES: 'COST_CENTER_ENTITIES',
    COST_CENTER_TEXT_ENTITIES: 'COST_CENTER_TEXT_ENTITIES',
    COSTING_SHEET_ENTITIES: 'COSTING_SHEET_ENTITIES',
    COSTING_SHEET_TEXT_ENTITIES: 'COSTING_SHEET_TEXT_ENTITIES',
    COSTING_SHEET_ROW_ENTITIES: 'COSTING_SHEET_ROW_ENTITIES',
    COSTING_SHEET_BASE_TEXT_ENTITIES: 'COSTING_SHEET_BASE_TEXT_ENTITIES',
    COSTING_SHEET_OVERHEAD_ENTITIES: 'COSTING_SHEET_OVERHEAD_ENTITIES',
    COSTING_SHEET_OVERHEAD_TEXT_ENTITIES: 'COSTING_SHEET_OVERHEAD_TEXT_ENTITIES',
    COSTING_SHEET_OVERHEAD_ROW_ENTITIES: 'COSTING_SHEET_OVERHEAD_ROW_ENTITIES',
    COSTING_SHEET_ROW_TEXT_ENTITIES: 'COSTING_SHEET_ROW_TEXT_ENTITIES',
    COSTING_SHEET_BASE_ENTITIES: 'COSTING_SHEET_BASE_ENTITIES',
    COSTING_SHEET_BASE_ROW_ENTITIES: 'COSTING_SHEET_BASE_ROW_ENTITIES',
    COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES: 'COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES',
    CURRENCY_ENTITIES: 'CURRENCY_ENTITIES',
    CURRENCY_TEXT_ENTITIES: 'CURRENCY_TEXT_ENTITIES',
    CURRENCY_CONVERSION_ENTITIES: 'CURRENCY_CONVERSION_ENTITIES',
    CUSTOMER_ENTITIES: 'CUSTOMER_ENTITIES',
    DIMENSION_ENTITIES: 'DIMENSION_ENTITIES',
    DIMENSION_TEXT_ENTITIES: 'DIMENSION_TEXT_ENTITIES',
    DOCUMENT_ENTITIES: 'DOCUMENT_ENTITIES',
    DOCUMENT_TEXT_ENTITIES: 'DOCUMENT_TEXT_ENTITIES',
    DOCUMENT_TYPE_ENTITIES: 'DOCUMENT_TYPE_ENTITIES',
    DOCUMENT_TYPE_TEXT_ENTITIES: 'DOCUMENT_TYPE_TEXT_ENTITIES',
    DOCUMENT_STATUS_ENTITIES: 'DOCUMENT_STATUS_ENTITIES',
    DOCUMENT_STATUS_TEXT_ENTITIES: 'DOCUMENT_STATUS_TEXT_ENTITIES',
    EXCHANGE_RATE_TYPE_ENTITIES: 'EXCHANGE_RATE_TYPE_ENTITIES',
    EXCHANGE_RATE_TYPE_TEXT_ENTITIES: 'EXCHANGE_RATE_TYPE_TEXT_ENTITIES',
    LANGUAGE_ENTITIES: 'LANGUAGE_ENTITIES',
    DESIGN_OFFICE_ENTITIES: 'DESIGN_OFFICE_ENTITIES',
    DESIGN_OFFICE_TEXT_ENTITIES: 'DESIGN_OFFICE_TEXT_ENTITIES',
    MATERIAL_ENTITIES: 'MATERIAL_ENTITIES',
    MATERIAL_TEXT_ENTITIES: 'MATERIAL_TEXT_ENTITIES',
    MATERIAL_ACCOUNT_DETERMINATION_ENTITIES: 'MATERIAL_ACCOUNT_DETERMINATION_ENTITIES',
    MATERIAL_GROUP_ENTITIES: 'MATERIAL_GROUP_ENTITIES',
    MATERIAL_GROUP_TEXT_ENTITIES: 'MATERIAL_GROUP_TEXT_ENTITIES',
    MATERIAL_PLANT_ENTITIES: 'MATERIAL_PLANT_ENTITIES',
    MATERIAL_PRICE_ENTITIES: 'MATERIAL_PRICE_ENTITIES',
    MATERIAL_TYPE_ENTITIES: 'MATERIAL_TYPE_ENTITIES',
    MATERIAL_TYPE_TEXT_ENTITIES: 'MATERIAL_TYPE_TEXT_ENTITIES',
    OVERHEAD_GROUP_ENTITIES: 'OVERHEAD_GROUP_ENTITIES',
    OVERHEAD_GROUP_TEXT_ENTITIES: 'OVERHEAD_GROUP_TEXT_ENTITIES',
    PLANT_ENTITIES: 'PLANT_ENTITIES',
    PLANT_TEXT_ENTITIES: 'PLANT_TEXT_ENTITIES',
    PRICE_COMPONENT_ENTITIES: 'PRICE_COMPONENT_ENTITIES',
    PRICE_SOURCE_ENTITIES: 'PRICE_SOURCE_ENTITIES',
    PRICE_SOURCE_TEXT_ENTITIES: 'PRICE_SOURCE_TEXT_ENTITIES',
    PROFIT_CENTER_ENTITIES: 'PROFIT_CENTER_ENTITIES',
    PROFIT_CENTER_TEXT_ENTITIES: 'PROFIT_CENTER_TEXT_ENTITIES',
    UOM_ENTITIES: 'UNIT_OF_MEASURE_ENTITIES',
    SELECTED_ACCOUNT_GROUPS_ENTITIES: 'SELECTED_ACCOUNT_GROUPS_ENTITIES',
    UOM_TEXT_ENTITIES: 'UNIT_OF_MEASURE_TEXT_ENTITIES',
    VALUATION_CLASS_ENTITIES: 'VALUATION_CLASS_ENTITIES',
    VALUATION_CLASS_TEXT_ENTITIES: 'VALUATION_CLASS_TEXT_ENTITIES',
    VENDOR_ENTITIES: 'VENDOR_ENTITIES',
    WORK_CENTER_ENTITIES: 'WORK_CENTER_ENTITIES',
    WORK_CENTER_TEXT_ENTITIES: 'WORK_CENTER_TEXT_ENTITIES',
    WORK_CENTER_PROCESS_ENTITIES: 'WORK_CENTER_PROCESS_ENTITIES',
    WORK_CENTER_ACTIVITY_ENTITIES: 'WORK_CENTER_ACTIVITY_ENTITIES'
});

var MasterdataReadProcedures = Object.freeze({
    'Account': 'sap.plc.db.administration.procedures::p_account_read',
    'Account_Group': 'sap.plc.db.administration.procedures::p_account_group_read',
    'Activity_Price': 'sap.plc.db.administration.procedures::p_activity_price_read',
    'Activity_Type': 'sap.plc.db.administration.procedures::p_activity_type_read',
    'Business_Area': 'sap.plc.db.administration.procedures::p_business_area_read',
    'Process': 'sap.plc.db.administration.procedures::p_process_read',
    'Confidence_Level': 'sap.plc.db.administration.procedures::p_confidence_level_read',
    'Company_Code': 'sap.plc.db.administration.procedures::p_company_code_read',
    'Component_Split': 'sap.plc.db.administration.procedures::p_component_split_read',
    'Controlling_Area': 'sap.plc.db.administration.procedures::p_controlling_area_read',
    'Cost_Center': 'sap.plc.db.administration.procedures::p_cost_center_read',
    'Costing_Sheet': 'sap.plc.db.administration.procedures::p_costing_sheet_read',
    'Costing_Sheet_Row': 'sap.plc.db.administration.procedures::p_costing_sheet_row_read',
    'Currency': 'sap.plc.db.administration.procedures::p_currency_read',
    'Currency_Conversion': 'sap.plc.db.administration.procedures::p_currency_conversion_read',
    'Customer': 'sap.plc.db.administration.procedures::p_customer_read',
    'Dimension': 'sap.plc.db.administration.procedures::p_dimension_read',
    'Document': 'sap.plc.db.administration.procedures::p_document_read',
    'Document_Type': 'sap.plc.db.administration.procedures::p_document_type_read',
    'Document_Status': 'sap.plc.db.administration.procedures::p_document_status_read',
    'Exchange_Rate_Type': 'sap.plc.db.administration.procedures::p_exchange_rate_type_read',
    'Design_Office': 'sap.plc.db.administration.procedures::p_design_office_read',
    'Language': 'sap.plc.db.administration.procedures::p_language_read',
    'Material': 'sap.plc.db.administration.procedures::p_material_read',
    'Material_Account_Determination': 'sap.plc.db.administration.procedures::p_material_account_determination_read',
    'Material_Group': 'sap.plc.db.administration.procedures::p_material_group_read',
    'Material_Type': 'sap.plc.db.administration.procedures::p_material_type_read',
    'Material_Plant': 'sap.plc.db.administration.procedures::p_material_plant_read',
    'Material_Price': 'sap.plc.db.administration.procedures::p_material_price_read',
    'Overhead_Group': 'sap.plc.db.administration.procedures::p_overhead_group_read',
    'Plant': 'sap.plc.db.administration.procedures::p_plant_read',
    'Profit_Center': 'sap.plc.db.administration.procedures::p_profit_center_read',
    'Unit_Of_Measure': 'sap.plc.db.administration.procedures::p_unit_of_measures_read',
    'Valuation_Class': 'sap.plc.db.administration.procedures::p_valuation_class_read',
    'Vendor': 'sap.plc.db.administration.procedures::p_vendor_read',
    'Work_Center': 'sap.plc.db.administration.procedures::p_work_center_read'
});

var aNotMaintainableBusinessObjects = Object.freeze([
    'Confidence_Level',
    'Dimension',
    'Document',
    'Document_Type',
    'Document_Status',
    'Design_Office'
]);


module.exports.MasterdataResource = MasterdataResource;
module.exports.CostingSheetResources = CostingSheetResources;
module.exports.Source = Source;
module.exports.BatchOperation = BatchOperation;
module.exports.Limits = Limits;
module.exports.BusinessObjectsEntities = BusinessObjectsEntities;
module.exports.MasterdataReadProcedures = MasterdataReadProcedures;
module.exports.aNotMaintainableBusinessObjects = aNotMaintainableBusinessObjects;
//module.exports = MasterdataResource,CostingSheetResources,Source,BatchOperation,Limits,BusinessObjectsEntities,MasterdataReadProcedures,aNotMaintainableBusinessObjects;
