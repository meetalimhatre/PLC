var _ = require('lodash');

// Helper function for Handle.js to be used in templates
function registerHelpers(Handlebars) {

    //context -> temporaryTableName, keyFields, mainTableName, temporaryTextTableName, textTableName

    Handlebars.registerHelper('currentTimestamp', function currentTimestamp(oBusinessObject) {
        return "'" + oBusinessObject.currentTimestamp.toJSON() + "'";
    });

    Handlebars.registerHelper('currentUser', function currentUser(oBusinessObject) {
        return "'" + oBusinessObject.currentUser + "'";
    });

    Handlebars.registerHelper('ignoreBadData', function ignoreBadData(oBusinessObject) {
        return "'" + oBusinessObject.ignoreBadData + "'";
    });

    // get the name for temporary table (e.g., "gtt_batch_cost_center")
    Handlebars.registerHelper('temporaryTable', function temporaryTable(oBusinessObject) {
        return '"' + oBusinessObject.temporaryTableName + '"';
    });

    // get the name for text temporary table (e.g., "gtt_batch_cost_center__text")
    Handlebars.registerHelper('temporaryTextTable', function temporaryTextTable(oBusinessObject) {
        return '"' + oBusinessObject.temporaryTextTableName + '"';
    });

    // get the name for main table (e.g., "sap.plc.db::basis.t_cost_center")
    Handlebars.registerHelper('mainTable', function mainTable(oBusinessObject) {
        return '"' + oBusinessObject.mainTableName + '"';
    });

    // get the name for text table (e.g., "sap.plc.db::basis.t_cost_center__text")
    Handlebars.registerHelper('textTable', function textTable(oBusinessObject) {
        return '"' + oBusinessObject.textTableName + '"';
    });

    // get the name for text table (e.g., "sap.plc.db::basis.t_cost_center_ext")
    Handlebars.registerHelper('extTable', function extTable(oBusinessObject) {
        return '"' + oBusinessObject.extTableName + '"';
    });

    // generate list of key fields (COST_CENTER_ID, CONTROLLING_AREA_ID)
    Handlebars.registerHelper('keyFields', function keyFields(oBusinessObject) {
        return _.map(oBusinessObject.keyFields, function (key) {
            return key;
        }).join(', ');
    });

    // generate list of all fields (without audit fields) (COST_CENTER_ID, CONTROLLING_AREA_ID)
    Handlebars.registerHelper('fieldsMain', function fieldsMain(oBusinessObject) {
        return _.map(oBusinessObject.fieldsMain, function (key) {
            return key;
        }).join(', ');
    });

    // generate list of all fields for text (without audit fields) (COST_CENTER_ID, CONTROLLING_AREA_ID, LANGUAGE, COST_CENTER_DESCRIPTION)
    Handlebars.registerHelper('fieldsText', function fieldsText(oBusinessObject) {
        return _.map(oBusinessObject.fieldsText, function (key) {
            return key;
        }).join(', ');
    });

    // generate list of custom fields
    Handlebars.registerHelper('customFieldsMasterdata', function customFieldsMasterdata(oBusinessObject) {
        return _.map(oBusinessObject.fieldsCustom, function (key) {
            return key;
        }).join(', ');
    });

    // generate prefixed list of key fields (temp_table.COST_CENTER_ID, temp_table.CONTROLLING_AREA_ID)
    Handlebars.registerHelper('keyFieldsWithPrefix', function keyFieldsWithPrefix(oBusinessObject, sPrefix) {
        return _.map(oBusinessObject.keyFields, function (key) {
            return ' ' + sPrefix + '.' + key;
        }).join(', ');
    });

    // generate prefixed list of key fields (temp_table.COST_CENTER_ID, temp_table.CONTROLLING_AREA_ID)
    Handlebars.registerHelper('fieldsMainWithPrefix', function fieldsMainWithPrefix(oBusinessObject, sPrefix) {
        return _.map(oBusinessObject.fieldsMain, function (key) {
            return ' ' + sPrefix + '.' + key;
        }).join(', ');
    });

    // generate prefixed list of key fields (temp_table.COST_CENTER_ID, temp_table.CONTROLLING_AREA_ID)
    Handlebars.registerHelper('fieldsTextWithPrefix', function fieldsTextWithPrefix(oBusinessObject, sPrefix) {
        return _.map(oBusinessObject.fieldsText, function (key) {
            return ' ' + sPrefix + '.' + key;
        }).join(', ');
    });

    // generate prefixed list of custom fields
    Handlebars.registerHelper('customFieldsMasterdataWithPrefix', function customFieldsMasterdataWithPrefix(oBusinessObject, sPrefix) {
        return _.map(oBusinessObject.fieldsCustom, function (key) {
            return ' ' + sPrefix + '.' + key;
        }).join(', ');
    });

    // generate prefixed condition (temp_table.COST_CENTER_ID = main_table.COST_CENTER_ID and temp_table.CONTROLLING_AREA_ID = main_table.CONTROLLING_AREA_ID)
    Handlebars.registerHelper('keyFieldsConditionWithPrefixes', function keyFieldsConditionWithPrefixes(oBusinessObject, sPrefix1, sPrefix2) {
        return _.map(oBusinessObject.keyFields, function (key) {
            return ' ' + sPrefix1 + '.' + key + ' = ' + sPrefix2 + '.' + key;
        }).join(' and ');
    });

    // generate prefixed condition (temp_table.COST_CENTER_ID <> main_table.COST_CENTER_ID or temp_table.CONTROLLING_AREA_ID <> main_table.CONTROLLING_AREA_ID)
    Handlebars.registerHelper('readOnlyFieldsConditionWithPrefixes', function readOnlyFieldsConditionWithPrefixes(oBusinessObject, sPrefix1, sPrefix2) {
        return _.map(oBusinessObject.fieldsReadOnly, function (key) {
            return ' ' + sPrefix1 + '.' + key + ' <> ' + sPrefix2 + '.' + key;
        }).join(' or ');
    });

    // generate prefixed condition (main_table.COST_CENTER_ID = result.COST_CENTER_ID and main_table.CONTROLLING_AREA_ID = result.CONTROLLING_AREA_ID)
    Handlebars.registerHelper('fieldsConditionForDependendFieldsWithPrefixes', function fieldsConditionTempAndMainWithPrefixes(aKeyFields, aDependendtFields, sPrefix1, sPrefix2) {
        return _.map(aDependendtFields, function (aDependency) {
            return _.map(aKeyFields, function (key, iIndex) {
                return ' ' + sPrefix1 + '.' + key + ' = ' + sPrefix2 + '.' + aDependency[iIndex];
            }).join(' and ');
        }).join(' or ');
    });

    Handlebars.registerHelper('tableNameWithQuotes', function tableNameWithQuotes(sTableName) {
        return '"' + sTableName + '"';
    });

    Handlebars.registerHelper('anyStringWithQuotes', function anyStringWithQuotes(sValue) {
        return "'" + sValue + "'";
    });

    // generate prefixed condition (main_table.COST_CENTER_ID = result.COST_CENTER_ID and main_table.CONTROLLING_AREA_ID = result.CONTROLLING_AREA_ID)
    Handlebars.registerHelper('fieldsConditionForReferencedFieldsWithPrefixes', function fieldsConditionForReferencedFieldsWithPrefixes(aKeyFields, aDependendtFields, sPrefix1, sPrefix2) {
        return _.map(aKeyFields, function (key, iIndex) {
            return ' ' + sPrefix1 + '.' + key + ' = ' + sPrefix2 + '.' + aDependendtFields[iIndex];
        }).join(' and ');
    });

    Handlebars.registerHelper('referencedFieldsValueConditions', function referencedFieldsValueConditions(aAllFields, sPrefix) {
        return _.map(aAllFields, function (key) {
            return ' ' + sPrefix + '.' + key + ' is not null and ' + sPrefix + '.' + key + " not in ('','*')";
        }).join(' and ');
    });

}

module.exports.registerHelpers = registerHelpers;
export default {_,registerHelpers};
