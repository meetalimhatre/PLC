CALL SYS.EXECUTE_MDS_DEV(METHOD=>'Analytics', SCHEMA_NAME=>'_SYS_BIC', PACKAGE_NAME=>'sap.plc.analytics.views', OBJECT_NAME=>'V_EXT_PROJECT_COMPONENT_SPLIT', DATASOURCE_TYPE=>'OLAP', REQUEST=>'{
  "Analytics": {
    "Capabilities": [
      "SP9",
      "SupportsEncodedResultSet2",
      "ReturnResultSetSizeWhenResultSetExceeded",
      "SupportsSetOperand",
      "ResultSetCellMeasure",
      "HierarchyNavigationDeltaMode",
      "ResultSetHierarchyLevel",
      "HierarchyKeyTextName",
      "UniqueAttributeNames",
      "HierarchyDataAndExcludingFilters",
      "HierarchyTrapezoidFilter",
      "ExpandHierarchyBottomUp",
      "ReturnedDataSelection"
    ],
    "Definition": {
      "Dimensions": [
        {
          "Attributes": [
            {
              "Name": "[Measures].[Measures]"
            },
            {
              "Name": "[Measures].[Description]"
            }
          ],
          "Axis": "Columns",
          "Name": "CustomDimension1",
          "NonEmpty": true,
          "ResultStructure": [
            {
              "Result": "Members",
              "Visibility": "Visible"
            }
          ],
          "Members": [
            {
              "Name": "COST",
              "Selection": {
                "MeasureOperand": "COST"
              },
              "NumericScale": 7
            },
            {
              "Name": "COST_FIXED_PORTION",
              "Selection": {
                "MeasureOperand": "COST_FIXED_PORTION"
              },
              "NumericScale": 7
            },
            {
              "Name": "COST_VARIABLE_PORTION",
              "Selection": {
                "MeasureOperand": "COST_VARIABLE_PORTION"
              },
              "NumericScale": 7
            },
            {
              "Name": "COST_PER_UNIT",
              "Selection": {
                "MeasureOperand": "COST_PER_UNIT"
              },
              "NumericScale": 7
            },
            {
              "Name": "COST_FIXED_PER_UNIT",
              "Selection": {
                "MeasureOperand": "COST_FIXED_PER_UNIT"
              },
              "NumericScale": 7
            },
            {
              "Name": "COST_VARIABLE_PER_UNIT",
              "Selection": {
                "MeasureOperand": "COST_VARIABLE_PER_UNIT"
              },
              "NumericScale": 7
            },
            {
              "Name": "TOTAL_QUANTITY",
              "Selection": {
                "MeasureOperand": "TOTAL_QUANTITY"
              },
              "NumericScale": 7
            },
            {
              "Name": "TARGET_COST",
              "Selection": {
                "MeasureOperand": "TARGET_COST"
              },
              "NumericScale": 7
            },
            {
              "Name": "SALES_PRICE",
              "Selection": {
                "MeasureOperand": "SALES_PRICE"
              },
              "NumericScale": 7
            },
            {
              "Name": "PROJECT_SALES_PRICE",
              "Selection": {
                "MeasureOperand": "PROJECT_SALES_PRICE"
              },
              "NumericScale": 7
            }
          ]
        }
      ],
      "ResultSetFeatureRequest": {
        "ResultEncoding": "Auto",
        "ResultFormat": "Version2",
        "SubSetDescription": {
          "ColumnFrom": 0,
          "ColumnTo": -1,
          "RowFrom": 0,
          "RowTo": -1
        },
        "ReturnedDataSelection": {
          "ValuesFormatted": false,
          "Actions": false,
          "TupleElementIds": false,
          "InputEnabled": false,
          "UnitDescriptions": false
        },
        "UseDefaultAttributeKey": false,
        "MaxResultRecords": 500000
      },
      "FixedFilter": {
        "Selection": {
          "Operator": {
            "Code": "And",
            "SubSelections": [
              {
                "SetOperand": {
                  "Elements": [
                    {
                      "IsExcluding": false,
                      "Low": "VAR_PROJECT",
                      "Comparison": "=",
                      "LowIs": "Variable"
                    }
                  ],
                  "FieldName": "[PROJECT_ID].[PROJECT_ID]"
                }
              }
            ]
          }
        }
      },
      "Variables": [
        {
          "Name": "VAR_PROJECT",
          "Values": {
            "Selection": {
              "SetOperand": {
                "Elements": [
                  {
                    "IsExcluding": false,
                    "Low": "#P4",
                    "Comparison": "=",
                    "LowIs": "Value"
                  }
                ],
                "FieldName": "[PROJECT_ID].[PROJECT_ID]"
              }
            }
          }
        },
        {
          "Name": "VAR_ONLY_CURRENT",
          "OptionValues": [
            "0"
          ]
        },
        {
          "Name": "VAR_LANGUAGE",
          "Values": {
            "Selection": {
              "SetOperand": {
                "Elements": [
                  {
                    "IsExcluding": false,
                    "Low": "EN",
                    "Comparison": "=",
                    "LowIs": "Value"
                  }
                ],
                "FieldName": "[$$_SYS_BIC:sap.plc.analytics.views.base/v_bas_help_language_LANGUAGE$$].[$$_SYS_BIC:sap.plc.analytics.views.base/v_bas_help_language_LANGUAGE$$]"
              }
            }
          }
        }
      ]
    },
    "DataSource": {
      "InstanceId": "58FE5CA1E64A138FE10000000A618EE9",
      "ObjectName": "V_EXT_PROJECT_COMPONENT_SPLIT",
      "PackageName": "sap.plc.analytics.views"
    },
    "Expand": [
      "Grid",
      "Items"
    ]
  },
  "Description": "ResultSetRequest",
  "Language": ""
}', RESPONSE=>?);
