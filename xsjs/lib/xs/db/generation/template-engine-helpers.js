var _ = require('lodash');
var helpers = require('../../util/helpers');
var sDecimalDataType = 'decimal(28,7)';

// Helper function for Handle.js to be used in templates
function registerHelpers(Handlebars) {

    // list primary keys of extension tables with data types
    Handlebars.registerHelper('ddl_primaryKeyFields', function ddl_primaryKeyFields(oBusinessObject) {
        return _.map(oBusinessObject.primaryKeys, function (value, key) {
            return '"' + key + '" ' + value.dataType + ' NOT NULL';
        }).join(', ');
    });

    // generate PRIMARY KEY (..) statement, listing all primary key fields
    Handlebars.registerHelper('ddl_primaryKeyDefinition', function ddl_primaryKeyDefinition(oBusinessObject) {
        return 'PRIMARY KEY (' + _.map(oBusinessObject.primaryKeys, function (value, key) {
            return '"' + key + '"';
        }).join(', ') + ')';
    });

    // list custom field names, comma at the beginning
    Handlebars.registerHelper('customFields', function customFields(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sCustomFields += ', ' + key + '_MANUAL' + ', ' + key + '_UNIT';
            if (!value.isMasterdataField) {
                sCustomFields += ', ' + key + '_IS_MANUAL';
            }
        });
        return sCustomFields;
    });

    // select all _UNIT custom fields based on their property type
    Handlebars.registerHelper('unionUnitCustomFields', function unionUnitCustomFields(oBusinessObject, iPropertyType, sTable) {
        let aCustomFields = [];
        _.each(oBusinessObject.customFields, function (value, key) {
            if (iPropertyType === 6 && iPropertyType === value.propertyType)
                aCustomFields.push(' UNION ALL SELECT ' + key + '_UNIT as UOM_ID, MASTER_DATA_TIMESTAMP from ' + sTable);
            else if (iPropertyType === 7 && iPropertyType === value.propertyType)
                aCustomFields.push(' UNION ALL SELECT ' + key + '_UNIT as CURRENCY_ID, MASTER_DATA_TIMESTAMP from ' + sTable);
        });
        const sResult = aCustomFields.join(' ');
        return sResult;
    });

    // list custom field names, comma at the beginning
    Handlebars.registerHelper('customFieldsWhenCreate', function customFieldsWhenCreate(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                sCustomFields += ', CASE when determined.item_id is not null then determined.' + key + '_MANUAL ';
                sCustomFields += ' else items.' + key + '_MANUAL ';
                sCustomFields += ' end as ' + key + '_MANUAL ';
                sCustomFields += ', CASE when determined.item_id is not null then determined.' + key + '_UNIT ';
                sCustomFields += ' else items.' + key + '_UNIT ';
                sCustomFields += ' end as ' + key + '_UNIT ';
            } else {
                sCustomFields += ', ' + key + '_MANUAL' + ', ' + key + '_UNIT' + ', ' + key + '_IS_MANUAL ';
            }
        });
        return sCustomFields;
    });

    // list master data sorted custom field names, comma at the beginning
    Handlebars.registerHelper('masterdataCustomFields', function masterdataCustomFields(oBusinessObject) {
        var aMasterdataCustomFields = [];
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aMasterdataCustomFields.push(key);
            }
        });
        aMasterdataCustomFields.sort();
        var sCustomFields = '';
        _.each(aMasterdataCustomFields, function (sCustomField) {
            sCustomFields += ', ' + sCustomField + '_MANUAL' + ', ' + sCustomField + '_UNIT';
        });
        return sCustomFields;
    });

    // list master data sorted custom field names, comma at the beginning
    // do not add unit fields for non decimal custom fields 
    Handlebars.registerHelper('masterdataCustomFieldsWithoutUnit', function masterdataCustomFieldsWithoutUnit(oBusinessObject) {
        var aMasterdataCustomFields = [];
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aMasterdataCustomFields.push(key);
            }
        });
        aMasterdataCustomFields.sort();
        var sCustomFields = '';
        _.each(aMasterdataCustomFields, function (sCustomField) {
            sCustomFields += ', ' + sCustomField + '_MANUAL';
            if (oBusinessObject.customFields[sCustomField].dataType === sDecimalDataType) {
                sCustomFields += ', ' + sCustomField + '_UNIT';
            }
        });
        return sCustomFields;
    });

    // generate list of conditions with master data custom fields("CMAT_TEST_MANUAL = null")
    Handlebars.registerHelper('setMasterdataCustomFieldsToNull', function setMasterdataCustomFieldsToNull(oBusinessObject) {
        var aCustomFields = [];
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aCustomFields.push(' db.' + key + '_MANUAL = null' + ', db.' + key + '_UNIT = null');
            }
        });
        sCustomFields = aCustomFields.join(', ');
        return sCustomFields;
    });

    // generate sorted prefixed list of master data custom fields("items.CMAT_TEST_MANUAL"), comma at the beginning
    Handlebars.registerHelper('masterdataCustomFieldsWithPrefix', function masterdataCustomFieldsWithPrefix(oBusinessObject, sPrefix) {
        var aMasterdataCustomFields = [];
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aMasterdataCustomFields.push(key);
            }
        });
        aMasterdataCustomFields.sort();
        var sCustomFields = '';
        _.each(aMasterdataCustomFields, function (sCustomField) {
            sCustomFields += ', ' + sPrefix + '.' + sCustomField + '_MANUAL' + ', ' + sPrefix + '.' + sCustomField + '_UNIT';
        });
        return sCustomFields;
    });

    // generate sorted prefixed list of master data custom fields("items.CMAT_TEST_MANUAL"), comma at the beginning\
    // do not add unit fields for not decimal fields
    Handlebars.registerHelper('masterdataCustomFieldsWithPrefixWithoutUnit', function masterdataCustomFieldsWithPrefixWithoutUnit(oBusinessObject, sPrefix) {
        var aMasterdataCustomFields = [];
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aMasterdataCustomFields.push(key);
            }
        });
        aMasterdataCustomFields.sort();
        var sCustomFields = '';
        _.each(aMasterdataCustomFields, function (sCustomField) {

            sCustomFields += ', ' + sPrefix + '.' + sCustomField + '_MANUAL';
            if (oBusinessObject.customFields[sCustomField].dataType === sDecimalDataType) {
                sCustomFields += ', ' + sPrefix + '.' + sCustomField + '_UNIT';
            }
        });
        return sCustomFields;
    });

    // generate prefixed list of conditions with master data custom fields("db.CMAT_TEST_MANUAL = updated.CMAT_TEST_MANUAL"), comma at the end
    Handlebars.registerHelper('setMasterdataCustomFieldsWithPrefixes', function masterdataCustomFieldsWithPrefixes(oBusinessObject, sPrefix1, sPrefix2) {
        var aCustomFields = [];
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aCustomFields.push(sPrefix1 + '.' + key + '_MANUAL = ' + sPrefix2 + '.' + key + '_MANUAL');
                aCustomFields.push(sPrefix1 + '.' + key + '_UNIT = ' + sPrefix2 + '.' + key + '_UNIT');
            }
        });
        sCustomFields = aCustomFields.join(', ');
        return sCustomFields;
    });

    // get all masterdata custom fields (sorted) as null: null as CMAT_TEST_MANUAL, null as CMAT_TEST_UNIT....
    Handlebars.registerHelper('getMasterdataCustomFieldsAsNull', function getMasterdataCustomFieldsAsNull(oBusinessObject) {
        var aMasterdataCustomFields = [];
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aMasterdataCustomFields.push(key);
            }
        });
        aMasterdataCustomFields.sort();
        var sCustomFields = '';
        _.each(aMasterdataCustomFields, function (sCustomField) {
            sCustomFields += ', null AS ' + sCustomField + '_MANUAL' + ', null AS ' + sCustomField + '_UNIT';
        });
        return sCustomFields;
    });


    // list custom field names, comma at the beginning, including calculated field
    Handlebars.registerHelper('customFieldsCalc', function customFieldsCalc(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sCustomFields += ', ' + key + '_MANUAL' + ', ' + key + '_UNIT';
            if (!value.isMasterdataField) {
                sCustomFields += ', ' + key + '_CALCULATED' + ', ' + key + '_IS_MANUAL';
            }
        });
        return sCustomFields;
    });

    // list only calculated custom field names, comma at the beginning
    Handlebars.registerHelper('customFieldsCalculated', function customFields(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (!value.isMasterdataField)
                sCustomFields += ', ' + key;
        });
        return sCustomFields;
    });

    // generate null values for custom fields ("null AS CUST_xxx_MANUAL"), comma at the beginning
    Handlebars.registerHelper('p_listErpExtFields', function p_listErpExtFields(oBusinessObject) {
        var sErpFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sErpFields += ', null AS ' + key + '_MANUAL';
        });
        return sErpFields;
    });

    // generate prefixed list of custom fields ("plcExtTable.CUST_TEST_MANUAL"), comma at the beginning
    Handlebars.registerHelper('customFieldsWithTablePrefix', function customFieldsWithTablePrefix(oBusinessObject) {
        var sPlcFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sPlcFields += ', plcExtTable.' + key + '_MANUAL' + ', plcExtTable.' + key + '_UNIT';
            if (!value.isMasterdataField) {
                sPlcFields += ', plcExtTable.' + key + '_IS_MANUAL';
            }
        });
        return sPlcFields;
    });

    // list custom fields with data types, used in DDL statements
    Handlebars.registerHelper('ddl_customFields', function ddl_customFields(oBusinessObject) {
        return _.map(oBusinessObject.customFields, function (value, key) {
            var sFields = '';
            sFields += '"' + key + '_MANUAL" ' + value.dataType + ', "' + key + '_UNIT" NVARCHAR(3)';
            if (!value.isMasterdataField) {
                sFields += ', "' + key + '_IS_MANUAL" INTEGER';
            }
            return sFields;
        }).join(', ');
    });

    // list custom fields with currency
    Handlebars.registerHelper('ddl_customFieldsCurrency', function ddl_customFieldsCurrency(oBusinessObject) {
        let sFields = '';
        _.each(oBusinessObject.customFields,  function (value, key) {
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '' && value.rollupTypeId !== 0 && value.propertyType === 7) {
                sFields += ', "' + value.refUomCurrencyColumnId + '" NVARCHAR(3)';
            }
        });
        return sFields;
    });

    // list master data sorted custom fields with data types, used in DDL statements
    Handlebars.registerHelper('ddl_masterdataCustomFields', function ddl_masterdataCustomFields(oBusinessObject) {

        var aMasterdataCustomFields = [];
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aMasterdataCustomFields.push(key);
            }
        });
        aMasterdataCustomFields.sort();
        var sCustomFields = '';
        _.each(aMasterdataCustomFields, function (sCustomField) {
            sCustomFields += ', "' + sCustomField + '_MANUAL" ' + oBusinessObject.customFields[sCustomField].dataType + ', "' + sCustomField + '_UNIT" NVARCHAR(3)';
        });
        return sCustomFields;
    });

    // list master data sorted custom fields with data types, used in DDL statements
    // do not add unit fields for non decimal custom fields
    Handlebars.registerHelper('ddl_masterdataCustomFieldsWithoutUnit', function ddl_masterdataCustomFieldsWithoutUnit(oBusinessObject) {

        var aMasterdataCustomFields = [];
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                aMasterdataCustomFields.push(key);
            }
        });
        aMasterdataCustomFields.sort();
        var sCustomFields = '';
        _.each(aMasterdataCustomFields, function (sCustomField) {
            sCustomFields += ', "' + sCustomField + '_MANUAL" ' + oBusinessObject.customFields[sCustomField].dataType;
            if (oBusinessObject.customFields[sCustomField].dataType === sDecimalDataType) {
                sCustomFields += ', "' + sCustomField + '_UNIT" NVARCHAR(3)';
            }
        });
        return sCustomFields;
    });

    // list calculated custom fields with data types, used in DDL statements, comma at the beginning
    Handlebars.registerHelper('ddl_customFieldsCalculated', function ddl_customFields(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (!value.isMasterdataField)
                sCustomFields += ', "' + key + '" ' + value.dataType;
        });
        return sCustomFields;
    });

    // get the name for an extension table of a certain business object (e.g., "t_item_ext")
    Handlebars.registerHelper('t_extensionTable', function t_extensionTable(oBusinessObject) {
        var sExtensionTable = '';
        sExtensionTable += '"' + oBusinessObject.tableName + '_ext"';

        return sExtensionTable;
    });

    // get the name for a temporary extension table of a certain business object (e.g., "t_item_temporary_ext")
    Handlebars.registerHelper('t_temporaryExtensionTable', function t_temporaryExtensionTable(oBusinessObject) {
        var sTempExtensionTable = '';
        sTempExtensionTable += '"' + oBusinessObject.tableName + '_temporary_ext"';

        return sTempExtensionTable;
    });

    // return custom field name
    Handlebars.registerHelper('ddl_updateCustomFieldsCalculated', function condCustomFields(oBusinessObject) {
        var sCustomFieldsCalculated = '';
        var iIndex = 0;
        _.each(oBusinessObject.customFields, function (value, key) {
            if (!value.isMasterdataField) {
                if (iIndex != 0)
                    sCustomFieldsCalculated += ',';
                sCustomFieldsCalculated += ' ' + key + '_CALCULATED = calculated.' + key;
                iIndex++;
            }
        });
        return sCustomFieldsCalculated;
    });

    // set *IS_MANUAL = 0 and *MANUAL = NULL for custom field that have a rollup type > 0
    Handlebars.registerHelper('customFieldsWithRollupType', function rollupCustomFields(oBusinessObject) {
        var sCustomFieldsRollup = '';
        _.each(oBusinessObject.customFields,  function (value, key) {
            if (value.rollupTypeId !== 0) {
                if (value.propertyType == 7) {
                    sCustomFieldsRollup += ` itemExt.${ value.refUomCurrencyColumnId } = :lv_report_currency_id,`;
                }
                sCustomFieldsRollup += ' itemExt.' + key + '_MANUAL = CASE ';
                sCustomFieldsRollup += ' WHEN item.ITEM_CATEGORY_ID IN ' + getItemCategories(value.itemCategories);
                sCustomFieldsRollup += ' THEN NULL ';
                sCustomFieldsRollup += ' ELSE itemExt.' + key + '_MANUAL ';
                sCustomFieldsRollup += ' END,';
                sCustomFieldsRollup += ' itemExt.' + key + '_IS_MANUAL = CASE ';
                sCustomFieldsRollup += ' WHEN item.ITEM_CATEGORY_ID IN ' + getItemCategories(value.itemCategories);
                sCustomFieldsRollup += ' THEN 0 ';
                sCustomFieldsRollup += ' ELSE itemExt.' + key + '_IS_MANUAL ';
                sCustomFieldsRollup += ' END,';
            }
        });
        if (sCustomFieldsRollup !== '')
            sCustomFieldsRollup = sCustomFieldsRollup.slice(0, -1);
        return sCustomFieldsRollup;
    });

    /**
	 * Generate UPDATE SET statement for custom fields
	 */
    Handlebars.registerHelper('updateCustomFieldsWithCurrency', function updateCustomFieldsWithCurrency(oBusinessObject, iCalcId) {
        let sFields = '';
        let sFinalStmt = '';
        let iIndex = 0;

        _.each(oBusinessObject.customFields,  function (value, key) {
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '' && value.rollupTypeId !== 0 && value.propertyType === 7) {
                if (iIndex !== 0) {
                    sFields += ',';
                }
                let sField = `${ key }_IS_MANUAL = 0`;
                sFields += ` T.${ value.refUomCurrencyColumnId } = case when T.${ sField } then :lv_report_currency_id  else T.${ value.refUomCurrencyColumnId } end`;
                iIndex++;
            }
        });
        if (sFields !== '') {
            sFinalStmt = `UPDATE "sap.plc.db::basis.t_item_temporary_ext" T SET ${ sFields } 
			FROM "sap.plc.db::basis.t_item_temporary_ext" T INNER JOIN :lt_assemblies P on P.parent_item_id = T.item_id 
			WHERE T.session_id =:lv_session_id AND T.calculation_version_id = :iv_cv_id;`;
        }
        return sFinalStmt;
    });

    Handlebars.registerHelper('customFieldsWithCurrency', function customFieldsWithCurrency(oBusinessObject) {
        let sFields = '';
        _.each(oBusinessObject.customFields,  function (value, key) {
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '' && value.rollupTypeId !== 0 && value.propertyType === 7) {
                sFields += ` ,"${ value.refUomCurrencyColumnId }" `;
            }
        });
        return sFields;
    });

    // set default values for: *_MANUAL(if it's not a calculated value), *_IS_MANUAL, *_UNIT(report_currency_id or default unit of measure)
    Handlebars.registerHelper('customFieldsDefaultValuesSelect', function defaultValuesCustomFieldsSelect(oBusinessObject) {
        var sCustomDefaultValues = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            var itemsCategoriesManual = value.itemCategories;
            if (value.itemCategoriesFormula !== undefined) {
                itemsCategoriesManual = _.difference(itemsCategoriesManual, value.itemCategoriesFormula);
            }
            //set *_MANUAL
            if (_.size(itemsCategoriesManual) !== 0 && value.defaultValue !== null) {
                sCustomDefaultValues += ', CASE ';
                sCustomDefaultValues += ' WHEN items.ITEM_CATEGORY_ID IN ' + getItemCategories(itemsCategoriesManual);
                sCustomDefaultValues += ' AND ' + key + '_MANUAL IS NULL ';
                sCustomDefaultValues += ' AND :iv_setDefaultValues = 1 ';
                sCustomDefaultValues += ' THEN ';
                if (value.semanticDataType == 'String' || value.semanticDataType == 'LocalDate' || value.semanticDataType == 'Link')
                    sCustomDefaultValues += "'" + value.defaultValue + "'";
                else
                    sCustomDefaultValues += value.defaultValue;
                sCustomDefaultValues += ' ELSE ' + key + '_MANUAL ';
                sCustomDefaultValues += ' END AS ' + key + '_MANUAL';
            } else {
                sCustomDefaultValues += ', ' + key + '_MANUAL';
            }
            //set *_UNIT
            if (value.propertyType === 6 || value.propertyType === 7) {
                sCustomDefaultValues += ', CASE ';
                sCustomDefaultValues += ' WHEN items.ITEM_CATEGORY_ID IN ' + getItemCategories(value.itemCategories);
                sCustomDefaultValues += ' AND ' + key + '_UNIT IS NULL ';
                sCustomDefaultValues += ' AND :iv_setDefaultValues = 1 ';
                if (value.propertyType === 7 && !value.isMasterdataField)
                    //Currency
                    sCustomDefaultValues += ' THEN :lv_report_currency_id ';
                else  //UoM
                if (value.defaultValueUnit !== null)
                    sCustomDefaultValues += " THEN '" + value.defaultValueUnit + "'";
                else
                    sCustomDefaultValues += ' THEN ' + key + '_UNIT ';
                sCustomDefaultValues += ' ELSE ' + key + '_UNIT ';
                sCustomDefaultValues += ' END AS ' + key + '_UNIT';
            } else {
                sCustomDefaultValues += ', ' + key + '_UNIT';
            }
            //set *_IS_MANUAL
            if (!value.isMasterdataField) {
                sCustomDefaultValues += ', CASE ';
                if (_.size(itemsCategoriesManual) !== 0) {
                    sCustomDefaultValues += ' WHEN items.ITEM_CATEGORY_ID IN ' + getItemCategories(itemsCategoriesManual);
                    sCustomDefaultValues += ' AND ' + key + '_IS_MANUAL IS NULL ';
                    sCustomDefaultValues += ' AND :iv_setDefaultValues = 1 ';
                    sCustomDefaultValues += ' THEN 1 ';
                }
                if (value.itemCategoriesFormula !== undefined && _.size(value.itemCategoriesFormula) !== 0) {
                    sCustomDefaultValues += ' WHEN items.ITEM_CATEGORY_ID IN ' + getItemCategories(value.itemCategoriesFormula);
                    sCustomDefaultValues += ' AND ' + key + '_IS_MANUAL IS NULL ';
                    sCustomDefaultValues += ' AND :iv_setDefaultValues = 1 ';
                    sCustomDefaultValues += ' THEN 0 ';
                }
                sCustomDefaultValues += ' ELSE ' + key + '_IS_MANUAL ';
                sCustomDefaultValues += ' END AS ' + key + '_IS_MANUAL';
            }
        });
        return sCustomDefaultValues;
    });
    // set default values for: one time cost
    Handlebars.registerHelper('customFieldsOneTimeCost', function defaultValuesCustomFieldsSelect(oBusinessObject) {
        var sCustomOneTimeCost = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            var itemsCategoriesManual = value.itemCategories;
            if (value.itemCategoriesFormula !== undefined) {
                itemsCategoriesManual = _.difference(itemsCategoriesManual, value.itemCategoriesFormula);
            }
            //set *_MANUAL -> null as CUST_<*>_MANUAL,				
            if (!helpers.isNullOrUndefinedOrEmpty(value.itemCategories) && value.itemCategories.includes(8) && !helpers.isNullOrUndefined(value.defaultValue))
                	// item category 8 - Variable Item used for One Time Cost			 
                sCustomOneTimeCost += `, '${ value.defaultValue }' AS ${ key }_MANUAL`;
            else
                sCustomOneTimeCost += `, null AS ${ key }_MANUAL`;


            //set *_UNIT -> CUST_<*>_UNIT,
            if (!helpers.isNullOrUndefinedOrEmpty(value.itemCategories) && value.itemCategories.includes(8)) {
	// item category 8 - Variable Item used for One Time Cost
                if (value.propertyType === 6 || value.propertyType === 7) {
                    if (value.propertyType === 7 && helpers.isNullOrUndefined(value.defaultValueUnit))
                        sCustomOneTimeCost += ', calculation_versions_one_time_toCreate.report_currency_id';
                    else
                        sCustomOneTimeCost += `, '${ value.defaultValueUnit }'`;
                } else
                    sCustomOneTimeCost += ', null';
            } else
                sCustomOneTimeCost += ', null';

            sCustomOneTimeCost += ` AS ${ key }_UNIT`;

            //set *_IS_MANUAL -> 0 as CUST_*_IS_MANUAL				
            if (!value.isMasterdataField) {
                if (!helpers.isNullOrUndefinedOrEmpty(value.itemCategories) && value.itemCategories.includes(8)) {
                    if (!helpers.isNullOrUndefinedOrEmpty(value.itemCategoriesFormula) && value.itemCategoriesFormula.includes(8))
                         // item category 8 - Variable Item used for One Time Cost
                        sCustomOneTimeCost += `, 0 AS ${ key }_IS_MANUAL`;
                    else
                        sCustomOneTimeCost += `, 1 AS ${ key }_IS_MANUAL`;
                } else
                    sCustomOneTimeCost += `, null AS ${ key }_IS_MANUAL`;
            }
        });
        return sCustomOneTimeCost;
    });

    // Get Item Categories in the following format: (1,2)
    function getItemCategories(aItemCategories) {
        var sItemCategories = ' ( ';
        var iItCatNo = _.size(aItemCategories);
        var iIndex = 0;
        _.each(aItemCategories, function (itemCategory) {
            sItemCategories += itemCategory.toString();
            iIndex++;
            if (iIndex < iItCatNo) {
                sItemCategories += ' , ';
            }
        });
        sItemCategories += ' ) ';
        return sItemCategories;
    }

    // calculation views: used in table function, list custom fields with data types output
    Handlebars.registerHelper('cv_customFieldsTableFunctList', function cv_customFieldsTableFunctList(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sCustomFields += ', "' + key + '" ' + value.dataType.toUpperCase();
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '') {
                sCustomFields += ', "' + value.refUomCurrencyColumnId + '" NVARCHAR(3)';
            }
        });
        return sCustomFields;
    });

    // calculation views: used in table function, list custom fields with data types output
    Handlebars.registerHelper('cv_customFieldsTableFunctListBomCompare', function cv_customFieldsTableFunctListBomCompare(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sCustomFields += ', "' + key + '" ' + value.dataType.toUpperCase();
        });
        return sCustomFields;
    });

    // calculation views: used in table function, list custom fields with data types output
    Handlebars.registerHelper('cv_customFieldsTableFunctListBomCompareSecondVersion', function cv_customFieldsTableFunctListBomCompareSecondVersion(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sCustomFields += ', "' + key + '_BOMC2" ' + value.dataType.toUpperCase();
        });
        return sCustomFields;
    });

    /* 
	 * calculation views: used in table function, select clause
	 * 		does the (case) in the select query to return the Calculated or the Manual value of the Custom field, depending on the Is_Manual field
	 */
    Handlebars.registerHelper('cv_customFieldsTableFunctSelect', function cv_customFieldsTableFunct(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                sCustomFields += ', plcExtTable.' + key + '_MANUAL as ' + key;
            } else {
                sCustomFields += ', (CASE plcExtTable.' + key + '_IS_MANUAL when 1 then plcExtTable.' + key + '_MANUAL ';
                sCustomFields += 'ELSE plcExtTable.' + key + '_CALCULATED END) as ' + key;
            }
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '') {
                sCustomFields += ', plcExtTable.' + value.refUomCurrencyColumnId;
            }
        });
        return sCustomFields;
    });


    /* 
	 * calculation views: used in table function, select clause
	 * 		does the (case) in the select query to return the Calculated or the Manual value of the Custom field, depending on the Is_Manual field
	 */
    Handlebars.registerHelper('cv_customFieldsTableSelectBomCompare', function cv_customFieldsTableSelectBomCompare(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                sCustomFields += ', plcExtTable.' + key + '_MANUAL as ' + key;
            } else {
                sCustomFields += ', (CASE plcExtTable.' + key + '_IS_MANUAL when 1 then plcExtTable.' + key + '_MANUAL ';
                sCustomFields += 'ELSE plcExtTable.' + key + '_CALCULATED END) as ' + key;
            }
        });
        return sCustomFields;
    });

    /* 
	 * calculation views: used in table function, select clause
	 * 		does the (case) in the select query to return the custom field for second calculation version
	 */
    Handlebars.registerHelper('cv_customFieldsTableSelectBomCompareSecondVersion', function cv_customFieldsTableSelectBomCompareSecondVersion(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                sCustomFields += ', plcExtTable.' + key + '_MANUAL as ' + key + '_BOMC2';
            } else {
                sCustomFields += ', (CASE plcExtTable.' + key + '_IS_MANUAL when 1 then plcExtTable.' + key + '_MANUAL ';
                sCustomFields += 'ELSE plcExtTable.' + key + '_CALCULATED END) as ' + key + '_BOMC2';
            }
        });
        return sCustomFields;
    });

    /*
	 *  calculation views: adds the custom field as <attribute …> in the XML file (base views)
	 */
    Handlebars.registerHelper('cv_customFieldsAttrXml', function cv_customFieldsAttrXml(oBusinessObject) {
        var sCustomFields = '';
        var sObjectName = oBusinessObject.fileName;
        _.each(oBusinessObject.customFields, function (value, key) {
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '') {
                sCustomFields += '<attribute id="' + value.refUomCurrencyColumnId + '" attributeHierarchyActive="false" displayAttribute="false">\n';
                sCustomFields += '<descriptions defaultDescription="' + value.refUomCurrencyColumnId + '"/>\n';
                sCustomFields += '<keyMapping columnObjectName="TABLE_FUNCTION_' + sObjectName + '" columnName="' + value.refUomCurrencyColumnId + '"/>\n';
                sCustomFields += '</attribute>\n';
            } else {
                sCustomFields += '<attribute id="' + key + '" attributeHierarchyActive="false" displayAttribute="false">\n';
                sCustomFields += '<descriptions defaultDescription="' + value.displayName + '"/>\n';
                sCustomFields += '<keyMapping columnObjectName="TABLE_FUNCTION_' + sObjectName + '" columnName="' + key + '"/>\n';
                sCustomFields += '</attribute>\n';
            }
        });
        return sCustomFields;
    });

    /*
	 * calculation views: adds the custom field as <measure …> in the XML file (base views)
	 * 		depending on the data from the Context it will be set as Quantity or Amount
	 * 		propertyType - 6 -> CF has UOM, 7 -> CF has Currency
	 */
    Handlebars.registerHelper('cv_customFieldsMeasureXml', function cv_customFieldsMeasureXml(oBusinessObject) {
        var sCustomFields = '';
        var sObjectName = oBusinessObject.fileName;
        _.each(oBusinessObject.customFields, function (value, key) {
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '') {
                if (value.propertyType == 6) {
                    sCustomFields += '<measure id="' + key + '" semanticType="quantity" aggregationType="sum" measureType="quantity">\n';
                } else if (value.propertyType == 7) {
                    sCustomFields += '<measure id="' + key + '" semanticType="amount" aggregationType="sum" measureType="amount">\n';
                }
                sCustomFields += '<descriptions defaultDescription="' + value.displayName + '"/>\n';
                sCustomFields += '<unitCurrencyAttribute attributeName="' + value.refUomCurrencyColumnId + '"/>\n';
                sCustomFields += '<measureMapping columnObjectName="TABLE_FUNCTION_' + sObjectName + '" columnName="' + key + '"/>\n';
                sCustomFields += '</measure>\n';
            }
        });
        return sCustomFields;
    });

    /*
	 * calculation views: adds the custom field as <viewAttribute …> in the XML file
	 */
    Handlebars.registerHelper('cv_customFieldsViewAttrXml', function cv_customFieldsViewAttrXml(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sCustomFields += '<viewAttribute id="' + key + '"/>\n';
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '') {
                sCustomFields += '<viewAttribute id="' + value.refUomCurrencyColumnId + '"/>\n';
            }
        });
        return sCustomFields;
    });

    /*
	 * calculation views: adds mapping <mapping xsi:type="Calculation:AttributeMapping …> in the XML file
	 */
    Handlebars.registerHelper('cv_customFieldsMappingXml', function cv_customFieldsMappingXml(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            sCustomFields += '<mapping xsi:type="Calculation:AttributeMapping" target="' + key + '" source="' + key + '"/>\n';
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '') {
                sCustomFields += '<mapping xsi:type="Calculation:AttributeMapping" target="' + value.refUomCurrencyColumnId + '" source="' + value.refUomCurrencyColumnId + '"/>\n';
            }
        });
        return sCustomFields;
    });

    /*
	 * calculation view: adds the custom field as <attribute …> in the XML file
	 */
    Handlebars.registerHelper('cv_customFieldsAttrVXml', function cv_customFieldsVAttrXml(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (!helpers.isNullOrUndefined(value.refUomCurrencyColumnId) && value.refUomCurrencyColumnId !== '') {
                sCustomFields += '<attribute id="' + value.refUomCurrencyColumnId + '" attributeHierarchyActive="false" displayAttribute="false">\n';
                sCustomFields += '<descriptions defaultDescription="' + value.refUomCurrencyColumnId + '"/>\n';
                sCustomFields += '<keyMapping columnObjectName="Fact_table" columnName="' + value.refUomCurrencyColumnId + '"/>\n';
                sCustomFields += '</attribute>\n';
            } else if (value.semanticDataType != 'Integer' && value.semanticDataType != 'Decimal') {
                sCustomFields += '<attribute id="' + key + '" attributeHierarchyActive="false" displayAttribute="false">\n';
                sCustomFields += '<descriptions defaultDescription="' + value.displayName + '"/>\n';
                sCustomFields += '<keyMapping columnObjectName="Fact_table" columnName="' + key + '"/>\n';
                sCustomFields += '</attribute>\n';
            }
        });
        return sCustomFields;
    });

    Handlebars.registerHelper('cv_customFieldsAttributesBomCompare', function cv_customFieldsAttributesBomCompare(oBusinessObject) {
        var sPlcFields = '';
        _.each(oBusinessObject.customFields,  function (value, key) {
            let sBomVersion2DisplayName = !helpers.isNullOrUndefined(value.displayName) && value.displayName.length > 0 ? `${ value.displayName }_BOMC2` : `${ key }_BOMC2`;
            sPlcFields += `<attribute id="${ key }"  displayAttribute="false" attributeHierarchyActive="false">
							<descriptions defaultDescription="${ value.displayName }"/>
							<keyMapping columnObjectName="Fact_table" columnName="${ key }"/>
						</attribute>
							<attribute id="${ key }_BOMC2"  displayAttribute="false" attributeHierarchyActive="false">
								<descriptions defaultDescription="${ sBomVersion2DisplayName }"/>
								<keyMapping columnObjectName="Fact_table" columnName="${ key }_BOMC2"/>
							</attribute>`;
        });
        return sPlcFields;
    });

    /* calculation views: adds the custom field as <measure …> in the XML file
	 *		depending on the data from the Context it will be set as Quantity or Amount, for Decimal CF
	 *  	propertyType - 6 -> CF has UOM, 7 -> CF has Currency
	 */
    Handlebars.registerHelper('cv_customFieldsMeasureVXml', function cv_customFieldsMeasureVXml(oBusinessObject) {
        var sCustomFields = '';
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.semanticDataType == 'Integer' || value.semanticDataType == 'Decimal') {
                if (value.propertyType == 6) {
                    sCustomFields += '<measure id="' + key + '" semanticType="quantity" aggregationType="min" engineAggregation="min" measureType="quantity">\n';
                    sCustomFields += '<descriptions defaultDescription="' + value.displayName + '"/>\n';
                    sCustomFields += '<unitCurrencyAttribute attributeName="' + key + '_UNIT"/>\n';
                    sCustomFields += '<measureMapping columnObjectName="Fact_table" columnName="' + key + '"/>\n';
                    sCustomFields += '</measure>\n';
                } else if (value.propertyType == 7) {
                    sCustomFields += '<measure id="' + key + '" semanticType="amount" aggregationType="min" engineAggregation="min" measureType="amount">\n';
                    sCustomFields += '<descriptions defaultDescription="' + value.displayName + '"/>\n';
                    sCustomFields += '<unitCurrencyAttribute attributeName="' + key + '_UNIT"/>\n';
                    sCustomFields += '<measureMapping columnObjectName="Fact_table" columnName="' + key + '"/>\n';
                    sCustomFields += '</measure>\n';
                } else {
                    sCustomFields += '<measure id="' + key + '" aggregationType="min" engineAggregation="min" measureType="simple">\n';
                    sCustomFields += '<descriptions defaultDescription="' + value.displayName + '"/>\n';
                    sCustomFields += '<measureMapping columnObjectName="Fact_table" columnName="' + key + '"/>\n';
                    sCustomFields += '</measure>\n';
                }
            }
        });
        return sCustomFields;
    });

    Handlebars.registerHelper('updateAllCustomFields_referencedCvId', function condCustomFields(oBusinessObject) {
        var sCustomFieldsCalculated = '';
        var iIndex = 0;
        var iPropNo = _.size(oBusinessObject.customFields);
        _.each(oBusinessObject.customFields, function (value, key) {
            if (value.isMasterdataField) {
                sCustomFieldsCalculated += ' ' + key + '_MANUAL = source_root_item_ext.' + key + '_MANUAL,' + ' ' + key + '_UNIT = source_root_item_ext.' + key + '_UNIT';
            } else {
                sCustomFieldsCalculated += ' ' + key + '_CALCULATED = source_root_item_ext.' + key + '_CALCULATED,' + ' ' + key + '_MANUAL = CASE  WHEN  source_root_item_ext.' + key + '_IS_MANUAL = 1 THEN source_root_item_ext.' + key + '_MANUAL ' + ' ' + 'ELSE source_root_item_ext.' + key + '_CALCULATED END,' + ' ' + key + '_UNIT = source_root_item_ext.' + key + '_UNIT,' + ' ' + key + '_IS_MANUAL = 1';
            }
            iIndex++;
            if (iIndex < iPropNo) {
                sCustomFieldsCalculated += ',';
            }
        });
        return sCustomFieldsCalculated;
    });

    /* Add logical functions to Handlerbars so we can use it in template
	 *  	ex. (or Material_Price.customFields Activity_Price.customFields)
	 */
    Handlebars.registerHelper({
        eq: function (v1, v2) {
            return v1 === v2;
        },
        ne: function (v1, v2) {
            return v1 !== v2;
        },
        lt: function (v1, v2) {
            return v1 < v2;
        },
        gt: function (v1, v2) {
            return v1 > v2;
        },
        lte: function (v1, v2) {
            return v1 <= v2;
        },
        gte: function (v1, v2) {
            return v1 >= v2;
        },
        and: function (v1, v2) {
            return v1 && v2;
        },
        or: function (v1, v2) {
            return v1 || v2;
        }
    });
}

module.exports.registerHelpers = registerHelpers;
export default {_,helpers,sDecimalDataType,registerHelpers};
