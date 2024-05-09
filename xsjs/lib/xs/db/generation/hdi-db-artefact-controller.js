const _ = require("lodash");
const fs = require('fs');
const path = require('path');
const metadataLibrary = require("./custom_fields_metadata");
const TemplateEngine = require("./template-engine").TemplateEngine;
var oTemplateEngine = new TemplateEngine();
const helpers = require("../../util/helpers");

const isCloud = require("../../../platform/platformSpecificImports.js").isCloud;
const MessageLibrary = require("../../util/message");

const PlcException = MessageLibrary.PlcException;
const messageCode = MessageLibrary.Code;

const HDIClient = require("../../xslib/hdiClient").HDIClient;
const sContainerSrcRootPath = "src/dynamic/";


module.exports.mDbArtefactsMetadata = metadataLibrary.mDbArtefactsMetadata;
module.exports.mBusinessObjectsMetadata = metadataLibrary.mBusinessObjectsMetadata;
// below functions are provided in case mDbArtefactsMetadata and mBusinessObjectsMetadata are mocked in testing
function getDbArtefactsMetadata() {
    return module.exports.mDbArtefactsMetadata;
}
function getBusinessObjectsMetadata() {
    return module.exports.mBusinessObjectsMetadata;
}


var Tables = Object.freeze({
    lock: 'sap.plc.db::basis.t_lock',
    log: 'sap.plc.db::basis.t_generation_log',
    metadata: 'sap.plc.db::basis.t_metadata',
    metadata_text: 'sap.plc.db::basis.t_metadata__text',
    metadataItemAttributes: "sap.plc.db::basis.t_metadata_item_attributes",
    formula: "sap.plc.db::basis.t_formula"
});

/**
 * DbArtefactController coordinates DB changes required for custom fields CRUD operations.
 * It creates extension tables, adds and deletes custom fields, checks the status of custom fields,
 * and generates dynamic DB artefacts (SQLScript, table types, views).
 */
function DbArtefactController($, dbConnection) {

    let that = this;
    // context object passed to template engine
    let oContext;
    // has an exclusive lock already been acquired (only required for changing operations)
    let bIsLocked = false;
    // regular expression object for parsing length for String in semanticDataTypeAttributes
    let oParseStringRegexp = /^length=(\d+)$/;
    // regular expression for a valid database table name
    let oValidTableNameRegexp = /^[a-z][a-z0-9_\.\:]*$/i;

    // hdi client
    let oHDIClient = null;
    // hdi open flag
    let bHDIOpened = false;

    /**
     * Map semantic data types used in t_metadata table to SQL data types.
     */
    function mapSemanticToSqlDatatype(sSemanticDatatype, sSemanticDatatypeAttributes) {
        let parseResult;

        switch (sSemanticDatatype) {
            case 'Integer':
                return 'integer';
            case 'UTCTimestamp':
                return 'timestamp';
            case 'LocalDate':
                return 'date';
            case 'BooleanInt':
                return 'integer';
            case 'Link':
            case 'String':
                parseResult = oParseStringRegexp.exec(sSemanticDatatypeAttributes);
                return 'nvarchar(' + parseResult[1] + ')';
            case 'Decimal':
                return 'decimal(28,7)'; // always use precision 28, scale 7 for Decimal fields
        }
        let developerInfo = "semantic datatype is unknown: " + sSemanticDatatype;
        $.trace.error(developerInfo);
        throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
    }

    /**
     * Check if a table name is valid according to an regexp.
     * Otherwise, an exception is thrown.
     */
    function checkTableName(sTableName) {
        if (!oValidTableNameRegexp.test(sTableName)) {
            let developerInfo = "table has an invalid name: " + sTableName;
            $.trace.error(developerInfo);
            throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        }
    }

    /**
     * Get the list of custom field form db for a given table.
     * @return object with column names as keys and SQL data type name as value
     */
    function getDbCustomField(sFullTableName) {
        if (helpers.isNullOrUndefined(sFullTableName)) {
            let developerInfo = "parameter sFullTableName is missing in DbArtefactController.getDbCustomField()";
            $.trace.error(developerInfo);
            throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        }
        let mKeys = {};
        let result = dbConnection.executeQuery('select column_name, data_type_name, length, scale, index_type from sys.table_columns where schema_name=CURRENT_SCHEMA and table_name=?',
            sFullTableName);

        for (let row in result) {
            let sDataType = result[row].DATA_TYPE_NAME;
            if (sDataType === 'NVARCHAR') {
                sDataType += '(' + result[row].LENGTH + ')';
            } else if (sDataType === 'DECIMAL') {
                sDataType += '(' + result[row].LENGTH + ',' + result[row].SCALE + ')';
            }  else if (sDataType === 'BINARY') {
                sDataType += '(' + result[row].LENGTH + ')';
            }  else if (sDataType === 'VARBINARY') {
                sDataType += '(' + result[row].LENGTH + ')';
            }
            mKeys[result[row].COLUMN_NAME] = sDataType;
        }

        let mCusField = {};
        for (let sColumnName in mKeys) {
            let isMasterdataField = true;
            let bCheckDataType = false;
            let sFieldName = "";
            if (sColumnName.endsWith('_CALCULATED')) {
                sFieldName = sColumnName.substr(0, sColumnName.lastIndexOf('_CALCULATED'));
                if (helpers.isNullOrUndefined(mKeys[sFieldName + '_IS_MANUAL'])
                    || helpers.isNullOrUndefined(mKeys[sFieldName + '_UNIT'])
                    || helpers.isNullOrUndefined(mKeys[sFieldName + '_MANUAL'])) {
                    let developerInfo = `${sColumnName} in ${sFullTableName} was inconsistent`;
                    $.trace.error(developerInfo);
                    throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
                }
                isMasterdataField = false;
                bCheckDataType = true;
            } else if (sColumnName.endsWith('_IS_MANUAL')) {
                sFieldName = sColumnName.substr(0, sColumnName.lastIndexOf('_IS_MANUAL'));
                if (helpers.isNullOrUndefined(mKeys[sFieldName + '_CALCULATED'])
                    || helpers.isNullOrUndefined(mKeys[sFieldName + '_UNIT'])
                    || helpers.isNullOrUndefined(mKeys[sFieldName + '_MANUAL'])
                    || mKeys[sColumnName] !== "TINYINT") {
                    let developerInfo = `${sFieldName} in ${sFullTableName} was inconsistent`;
                    $.trace.error(developerInfo);
                    throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
                }
                isMasterdataField = false;
            } else if (sColumnName.endsWith('_MANUAL')) {
                sFieldName = sColumnName.substr(0, sColumnName.lastIndexOf('_MANUAL'));
                if (helpers.isNullOrUndefined(mKeys[sFieldName + '_UNIT'])) {
                    let developerInfo = `${sColumnName} in ${sFullTableName} was inconsistent`;
                    $.trace.error(developerInfo);
                    throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
                }
                bCheckDataType = true;
            } else if (sColumnName.endsWith('_UNIT')) {
                sFieldName = sColumnName.substr(0, sColumnName.lastIndexOf('_UNIT'));
                if (helpers.isNullOrUndefined(mKeys[sFieldName + '_MANUAL']) || mKeys[sColumnName] !== "NVARCHAR(3)") {
                    let developerInfo = `${sColumnName} in ${sFullTableName} was inconsistent`;
                    $.trace.error(developerInfo);
                    throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
                }
                // the field ending with 'unit' provides no dataType or isMasterdataField message, so we only check if it's valid
                continue;
            } else {
                continue;
            }
            let oOldCus = mCusField[sFieldName];
            if (!helpers.isNullOrUndefined(oOldCus)) {
                if (bCheckDataType && oOldCus.dataType !== mKeys[sColumnName]) {
                    let developerInfo = `${sColumnName} in ${sFullTableName} is inconsistent`;
                    $.trace.error(developerInfo);
                    throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
                }
                if (!isMasterdataField) {
                    oOldCus.isMasterdataField = false;
                }
            } else {
                mCusField[sFieldName] = {
                    dataType: mKeys[sColumnName],
                    isMasterdataField: isMasterdataField
                }
            }
        }

        return mCusField;
    }


    /**
     * Get the list of primary key columns for a given table.
     * @return object with column names as keys and SQL data type name as value
     */
    function getPrimaryKeys(sFullTableName) {
        if (helpers.isNullOrUndefined(sFullTableName)) {
            const developerInfo = "parameter sFullTableName is missing in DbArtefactController.getPrimaryKeys()";
            $.trace.error(developerInfo);
            throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        }
        let mKeys = {};
        let result = dbConnection.executeQuery('select columns.column_name, data_type_name, length, scale from sys.table_columns columns inner join sys.index_columns indices ' +
            'on columns.column_name = indices.column_name and columns.table_name = indices.table_name and columns.schema_name = indices.schema_name ' +
            'where columns.schema_name=CURRENT_SCHEMA and columns.table_name=? and constraint=\'PRIMARY KEY\'', sFullTableName);
        for (let row in result) {
            var sDataType = result[row].DATA_TYPE_NAME;
            if (result[row].DATA_TYPE_NAME === 'NVARCHAR') {
                sDataType += '(' + result[row].LENGTH + ')';
            } else if (result[row].DATA_TYPE_NAME === 'DECIMAL') {
                sDataType += '(' + result[row].LENGTH + ',' + result[row].SCALE + ')';
            } else if (result[row].DATA_TYPE_NAME === 'BINARY') {
                sDataType += '(' + result[row].LENGTH + ')';
            } else if (result[row].DATA_TYPE_NAME === 'VARBINARY') {
                sDataType += '(' + result[row].LENGTH + ')';
            } 
            mKeys[result[row].COLUMN_NAME] = sDataType;
        }

        return mKeys;
    }

    /**
     * Create and fill context object with available business objects and custom fields from t_metadata. Is is later passed to the template engine.
     * 
     * @returns {object} Returns the created context object. See example for structure of the object.
     * @example
     * //example structure of the context object:
     *   { 
     *     Item: {
     *               tableName: 'sap.plc.db::basis.t_item',
     *               hasTemporaryTable: true,
     *               hasStagingTable: true,
     *               isMasterdataObject: false,
     *               customField: {
     *				               field1: {
	 *					                      dataType: "integer",
	 *					                      semanticDataType: "Integer",
	 *					                      propertyType:6,
	 *					                      refUomCurrencyColumnId: "CUST_TEST_UNIT",
	 *					                      displayName: "TEST"
	 *				               },
	 *				               field2: {
	 *					                      dataType: "nvarchar(23)",
	 *					                      semanticDataType: "String",
	 *					                      semanticDataTypeAttributes: "length=23",
	 *					                      refUomCurrencyColumnId: undefined,
	 *					                      propertyType:null,
	 *					                      displayName: "TEST1"
	 *				              }                             
     *               }
     *               primaryKeys: { 
     *                              CALCULATION_VERSION_ID: 'INTEGER', 
     *                              ITEM_ID: 'INTEGER' 
     *               }
     *            }
     *   }
     */
    this.createContextObject = function () {
        let result = dbConnection.executeQuery('select a.business_object, a.column_id, a.rollup_type_id, a.semantic_data_type, a.semantic_data_type_attributes, a.ref_uom_currency_column_id, b.property_type, c.display_name from "'
            + Tables.metadata + '" a left outer join "' + Tables.metadata + '" b on b.column_id = a.ref_uom_currency_column_id '
            + 'left outer join "' + Tables.metadata_text + '" c on c.column_id = a.column_id and c.path = a.path '
            + 'where a.is_custom=1 and (a.uom_currency_flag IS NULL or a.uom_currency_flag <> 1) and c.language = \'EN\'');
        let context = {};
        // copy static metadata about BOs into context object
        let mBusinessObjectsMetadata = getBusinessObjectsMetadata();
        for (let boName in mBusinessObjectsMetadata) {

            context[boName] = {
                tableName: mBusinessObjectsMetadata[boName].tableName,
                hasTemporaryTable: mBusinessObjectsMetadata[boName].hasTemporaryTable,
                hasStagingTable: mBusinessObjectsMetadata[boName].hasStagingTable,
                isMasterdataObject: mBusinessObjectsMetadata[boName].isMasterdataObject,
                primaryKeys: getPrimaryKeys(mBusinessObjectsMetadata[boName].tableName)
            };
        }

        // add all custom fields to context object
        let field, row, boMetadata;
        for (let rowName in result) {
            row = result[rowName];
            boMetadata = context[row.BUSINESS_OBJECT]; // get static metadata about the BO
            if (helpers.isNullOrUndefined(boMetadata)) {
                let developerInfo = `Metadata for business object ${row.BUSINESS_OBJECT} was not found`;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }
            if (boMetadata.customFields === undefined) {
                boMetadata.customFields = {};
            }
            if (boMetadata.hasRollups === undefined) {
                boMetadata.hasRollups = false;
            }
            if (boMetadata.customFields[row.COLUMN_ID] === undefined) {
                boMetadata.customFields[row.COLUMN_ID] = {};
            }
            if (boMetadata.hasCalculatedCustomFields === undefined) {
                boMetadata.hasCalculatedCustomFields = false;
            }
            if (boMetadata.hasMasterdataCustomFields === undefined) {
                boMetadata.hasMasterdataCustomFields = false;
            }
            field = boMetadata.customFields[row.COLUMN_ID];
            field.semanticDataType = row.SEMANTIC_DATA_TYPE;
            field.semanticDataTypeAttributes = row.SEMANTIC_DATA_TYPE_ATTRIBUTES;
            field.rollupTypeId = row.ROLLUP_TYPE_ID;
            if (field.rollupTypeId !== 0) {
                boMetadata.hasRollups = true;
            }
            field.dataType = mapSemanticToSqlDatatype(row.SEMANTIC_DATA_TYPE, row.SEMANTIC_DATA_TYPE_ATTRIBUTES);
            field.refUomCurrencyColumnId = row.REF_UOM_CURRENCY_COLUMN_ID;
            field.propertyType = row.PROPERTY_TYPE;
            field.displayName = row.DISPLAY_NAME;
            let isNotMasterdataField = row.COLUMN_ID.startsWith("CUST_");
            field.isMasterdataField = !isNotMasterdataField;
            if (isNotMasterdataField) {
                boMetadata.hasCalculatedCustomFields = true;
            } else {
                boMetadata.hasMasterdataCustomFields = true;
            }
        }

        let resultAttributes = dbConnection.executeQuery('select distinct meta.path, meta.business_object, meta.column_id, attr.item_category_id, attr.default_value, ' +
            'attrUnit.default_value as default_value_unit, metaUnit.property_type  ' + 'from "' + Tables.metadata + '" as meta ' + 'inner join "' + Tables.metadataItemAttributes +
            '" as attr ' + 'on meta.business_object = attr.business_object ' + 'and meta.path = attr.path ' + 'and meta.column_id = attr.column_id ' + 'left outer join "' + Tables.metadata +
            '" as metaUnit ' + 'on meta.ref_uom_currency_business_object = metaUnit.business_object ' + 'and meta.ref_uom_currency_path = metaUnit.path ' +
            'and meta.ref_uom_currency_column_id = metaUnit.column_id ' + 'and metaUnit.is_custom=1 ' + 'left outer join "' + Tables.metadataItemAttributes + '" as attrUnit ' +
            'on metaUnit.business_object = attrUnit.business_object ' + 'and metaUnit.path = attrUnit.path ' + 'and metaUnit.column_id = attrUnit.column_id ' + 'where meta.is_custom=1 ' +
            'and (meta.uom_currency_flag IS NULL or meta.uom_currency_flag <> 1)');

        for (let rowName in resultAttributes) {
            row = resultAttributes[rowName];
            boMetadata = context[row.BUSINESS_OBJECT]; // get static metadata about the BO
            if (helpers.isNullOrUndefined(boMetadata)) {
                let developerInfo = `Metadata for business object ${row.BUSINESS_OBJECT} was not found`;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }
            if (boMetadata.customFields[row.COLUMN_ID] === undefined) {
                let developerInfo = `Metadata for business object ${row.BUSINESS_OBJECT} was not found`;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }
            field = boMetadata.customFields[row.COLUMN_ID];
            if (field.itemCategories === undefined) {
                field.itemCategories = [];
            }
            field.itemCategories.push(row.ITEM_CATEGORY_ID);
            field.defaultValue = row.DEFAULT_VALUE;
            field.defaultValueUnit = row.DEFAULT_VALUE_UNIT;
            field.propertyType = row.PROPERTY_TYPE;
        }

        let resultFormula = dbConnection.executeQuery('select meta.PATH,meta.BUSINESS_OBJECT,meta.COLUMN_ID, formula.ITEM_CATEGORY_ID ' + 'from "' + Tables.metadata + '" as meta ' +
            'inner join "' + Tables.formula + '" as formula ' + 'on meta.path=formula.path ' + 'and meta.business_object=formula.business_object ' +
            'and meta.column_id=formula.column_id ' + ' where meta.is_custom=1 ' + 'and (meta.uom_currency_flag IS NULL or meta.uom_currency_flag <> 1) ' +
            'and formula.is_formula_used = 1');


        for (let rowName in resultFormula) {
            row = resultFormula[rowName];
            boMetadata = context[row.BUSINESS_OBJECT]; // get static metadata about the BO
            if (helpers.isNullOrUndefined(boMetadata)) {
                let developerInfo = `Metadata for business object ${row.BUSINESS_OBJECT} was not found`;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }
            if (boMetadata.customFields[row.COLUMN_ID] === undefined) {
                let developerInfo = `Metadata for business object ${row.BUSINESS_OBJECT} was not found`;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }
            field = boMetadata.customFields[row.COLUMN_ID];
            if (field.itemCategoriesFormula === undefined) {
                field.itemCategoriesFormula = [];
            }
            field.itemCategoriesFormula.push(row.ITEM_CATEGORY_ID);
        }

        return context;
    };

    /**
     * Return filtered String
     */
    function getBetterName(sName) {
        sName = sName.replace(/sap\.plc\./g, '');
        let sSubName = sName.split("::");
        let sPath = sSubName[0].replace(/\./g, '\/');
        return sContainerSrcRootPath + sPath + "/" + sSubName[1];
    }

    /**
     * Generate a column table content with the given set of primary keys.
     * For temporary tables "SESSION_ID" is added to the set of primary keys.
     * sTableNameSuffix    "_ext", "_temporary_ext", "_ext_staging"
     */
    function hdiGenerateTableContent(oBusinessObject, sTableNameSuffix, bDoDelete) {
        let mPrimaryKeys = oBusinessObject.primaryKeys;

        checkTableName(oBusinessObject.tableName + sTableNameSuffix);
        // Only create table if it does not exist yet.
        let sSql = "column table \"" + oBusinessObject.tableName + sTableNameSuffix + "\" (";
        if (sTableNameSuffix === "_temporary_ext") {
            // add SESSION_ID as primary key for temporary tables
            sSql += "SESSION_ID NVARCHAR(50), ";
        }

        _.forEach(mPrimaryKeys, function (value, keyName) {
            sSql += keyName + " " + value + ", ";
        });

        let oCusFields = bDoDelete ? oBusinessObject.customFields : oBusinessObject.customFieldsEXT;
        _.forEach(oCusFields, function (value, keyName) {
            sSql += keyName + "_MANUAL " + value.dataType + ", ";

            if (!value.isMasterdataField) {
                // create field for calculated values
                sSql += keyName + "_CALCULATED " + value.dataType + ", ";
                // create field for switch between calculated and manually entered values
                sSql += keyName + "_IS_MANUAL tinyint, ";
            }

            // create field for UoM/currencies
            sSql += keyName + "_UNIT NVARCHAR(3), ";
        });

        sSql += "primary key(" + Object.keys(mPrimaryKeys).join(', '); // add list of primary keys
        if (sTableNameSuffix === "_temporary_ext") {
            // add SESSION_ID as part of primary key for temporary tables
            sSql += ", SESSION_ID";
        }
        sSql += "))";

        return sSql;
    }

    function prepareExtensionTables(aUpsertList, bDoDelete) {
        for (let sBusinessObjectName in oContext) {
            let oBusinessObject = oContext[sBusinessObjectName];
            if (helpers.isNullOrUndefined(oBusinessObject.tableName)) {
                let developerInfo = "extension table name was not defined for business object " + sBusinessObjectName;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }

            $.trace.info("processing extension tables for business object " + sBusinessObjectName);
            if (helpers.isNullOrUndefined(oBusinessObject.primaryKeys)) {
                let developerInfo = "extension table was not defined for business object " + sBusinessObjectName;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }

            let sPathInContainer = getBetterName(oBusinessObject.tableName + "_ext.hdbtable");
            let sContent = hdiGenerateTableContent(oBusinessObject, "_ext", bDoDelete);
            aUpsertList.push({PATH: sPathInContainer, CONTENT: sContent});

            sPathInContainer = getBetterName(oBusinessObject.tableName + "_temporary_ext.hdbtable");
            if (oBusinessObject.hasTemporaryTable) {
                let sContent = hdiGenerateTableContent(oBusinessObject, "_temporary_ext", bDoDelete);
                aUpsertList.push({PATH: sPathInContainer, CONTENT: sContent});
            }

            sPathInContainer = getBetterName(oBusinessObject.tableName + "_ext_staging.hdbtable");
            if (oBusinessObject.hasStagingTable) {
                let sContent = hdiGenerateTableContent(oBusinessObject, "_ext_staging", bDoDelete);
                aUpsertList.push({PATH: sPathInContainer, CONTENT: sContent});
            }
        }
    }

    function prepareDbArtefact(sDbArtifactName, aUpsertList, sSuffix) {
        let mDbArtefactsMetadata = getDbArtefactsMetadata();
        let oDbArtefact = mDbArtefactsMetadata[sDbArtifactName];
        $.trace.info("processing prepare db artefacts " + sDbArtifactName);
        if (helpers.isNullOrUndefinedOrEmpty(oDbArtefact.templateName) || helpers.isNullOrUndefinedOrEmpty(oDbArtefact.packageName)) {
            let developerInfo = "DB artefact " + sDbArtifactName + " has no defined template";
            $.trace.error(developerInfo);
            throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        }
        const sArtefactName = oDbArtefact.name || sDbArtifactName;
        const sBaseDir = sArtefactName.startsWith("sap.plc_test") ? "test" : "lib";
        const templatePath = path.resolve(appRoot, sBaseDir, oDbArtefact.packageName.replace(/\./g, "/"), oDbArtefact.templateName);
        const sTemplate = fs.readFileSync(templatePath, { encoding: 'utf8' });
        let sContent = oTemplateEngine.compile(sTemplate, oContext);
        let sPathInContainer = null;
        if (oDbArtefact.type === "AFL") {
            sPathInContainer = sContainerSrcRootPath + "afl/" + oDbArtefact.name + sSuffix;
        } else {
            if (helpers.isNullOrUndefined(oDbArtefact.name)) {
                sPathInContainer = getBetterName(oDbArtefact.packageName + "::" + sDbArtifactName + sSuffix);
            } else {
                sPathInContainer = getBetterName(oDbArtefact.name + sSuffix);
            }
        }
        aUpsertList.push({PATH: sPathInContainer, CONTENT: sContent});
    }

    /**
     * Helper function to add specific types of dynamic artifacts to HDI aDeleteList[] before upgrade
     */
    function deleteDbArtefact(sDbArtifactName, aDeleteList, sSuffix) {
        let mDbArtefactsMetadata = getDbArtefactsMetadata();
        let oDbArtefact = mDbArtefactsMetadata[sDbArtifactName];
        $.trace.info("processing delete db artefacts " + sDbArtifactName);
        if (helpers.isNullOrUndefinedOrEmpty(oDbArtefact.templateName) || helpers.isNullOrUndefinedOrEmpty(oDbArtefact.packageName)) {
            let developerInfo = "DB artefact " + sDbArtifactName + " has no defined template";
            $.trace.error(developerInfo);
            insertInstallationLogsOnUpgrade("error");
            throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        }

        let sPathInContainer = null;
        if (oDbArtefact.type === "AFL") {
            sPathInContainer = sContainerSrcRootPath + "afl/" + oDbArtefact.name + sSuffix;
        } else {
            if (helpers.isNullOrUndefined(oDbArtefact.name)) {
                sPathInContainer = getBetterName(oDbArtefact.packageName + "::" + sDbArtifactName + sSuffix);
            } else {
                sPathInContainer = getBetterName(oDbArtefact.name + sSuffix);
            }
        }
        aDeleteList.push(sPathInContainer);
    }

    /**
     * Helper function to check if there are no custom fields for the specified business object;
     * In this case the extension tables should be cleared.
     */
    this.clearExtensionTables = function (oBusinessObject, bDoDelete) {
        let oCusFields = bDoDelete ? oBusinessObject.customFields : oBusinessObject.customFieldsEXT;
        if (helpers.isNullOrUndefined(oCusFields) || helpers.isEmptyObject(oCusFields)) {
            // clear the content of the extension table
            let sSql = 'delete from "' + oBusinessObject.tableName + '_ext"';
            dbConnection.executeUpdate(sSql);

            if (oBusinessObject.hasTemporaryTable) {
                // clear the content of the temporary extension table
                let sSql = 'delete from "' + oBusinessObject.tableName + '_temporary_ext"';
                dbConnection.executeUpdate(sSql);
            }
            if (oBusinessObject.hasStagingTable) {
                // clear the content of the staging extension table
                let sSql = 'delete from "' + oBusinessObject.tableName + '_ext_staging"';
                dbConnection.executeUpdate(sSql);
            }
        }
    };

    function loadAndCheckCustomFields() {
        for (let sBusinessObjectName in oContext) {
            let oBusinessObject = oContext[sBusinessObjectName];
            if (helpers.isNullOrUndefined(oBusinessObject.tableName)) {
                let developerInfo = "extension table name was not defined for business object " + sBusinessObjectName;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }

            let mCusFieldEXT = getDbCustomField(oBusinessObject.tableName + "_ext");

            if (oBusinessObject.hasTemporaryTable) {
                let mCusFieldTmpEXT = getDbCustomField(oBusinessObject.tableName + "_temporary_ext");
                if (!_.isEqual(mCusFieldEXT, mCusFieldTmpEXT)) {
                    let developerInfo = "custom field was inconsistent for extension table " + oBusinessObject.tableName + "_temporary_ext and " + oBusinessObject.tableName + "_ext";
                    $.trace.error(developerInfo);
                    throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
                }
            }

            if (oBusinessObject.hasStagingTable) {
                let mCusFieldTmpEXTStg = getDbCustomField(oBusinessObject.tableName + "_ext_staging");
                if (!_.isEqual(mCusFieldEXT, mCusFieldTmpEXTStg)) {
                    let developerInfo = "custom field was inconsistent for extension tables " + oBusinessObject.tableName + "_ext_staging and " + oBusinessObject.tableName + "_ext";
                    $.trace.error(developerInfo);
                    throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
                }
            }

            oBusinessObject.customFieldsEXT = Object.assign({}, mCusFieldEXT, oBusinessObject.customFields);
        }
    }

    /**
     * Set oContext if it has not been done.
     */
    function setContext() {
        if (helpers.isNullOrUndefined(oContext)) {
            oContext = that.createContextObject();
        }
    }

    /**
     * Get an exclusive lock.
     */
    function acquireExclusiveLock() {
        if (!bIsLocked) {
            // deactivate DDL auto commit for the current connection/session
            //TODO: test db-artefacts-generation work
            //dbConnection.executeUpdate("SET TRANSACTION AUTOCOMMIT DDL off");
            // get the lock, this table MUST NOT BE USED in any artifacts which will be deployed !!!
            // Note: a HDI deployment will kills those database sessions which are blocking the deployment
            dbConnection.executeUpdate('LOCK TABLE "' + Tables.lock + '" IN EXCLUSIVE MODE NOWAIT');
            bIsLocked = true;
        }
    }

    /**
     * upsert & delete of files by hdiClient
     */
    function hdiModifyFiles(aUpsertList, aDeleteList, sWhatRunnedIt) {
        if (!_.isArray(aUpsertList) || !_.isArray(aDeleteList)) {
            let developerInfo = "hdiModifyFiles error: aUpsertList and aDeleteList is not an array";
            if(!helpers.isNullOrUndefined(sWhatRunnedIt) && sWhatRunnedIt == "PreUpgrade"){
                insertInstallationLogsOnUpgrade("error");
            }
            throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        }
        if ((aUpsertList.length == 0) && (aDeleteList.length == 0)) {
            return;
        }

        try {
            openHDIConnection();
            if (aUpsertList.length > 0) {
                oHDIClient.upsert(aUpsertList);
                $.trace.info("upserted " + aUpsertList.length + " Files");
            }
            if (aDeleteList.length > 0) {
                oHDIClient.delete(aDeleteList, false);
                $.trace.info("deleted " + aDeleteList.length + " Files");
            }
            /*
             * Generally we use 'src/dynamic' for all dynamic artifacts, however, we still
             * have 'src/analytics/views/ap_analytics_general.hdbanalyticprivilege' and other
             * possible path from test case or tool. so we use "/" to ensure all the changed
             * files will be deployed.
             */
            oHDIClient.make("/");
            if(!helpers.isNullOrUndefined(sWhatRunnedIt) && sWhatRunnedIt == "PreUpgrade"){
                insertInstallationLogsOnUpgrade("finished");
            }
            closeHDIConnection(false);          
        } catch (err) {
            $.trace.error("error hdiModifyFiles: " + err);
            if(!helpers.isNullOrUndefined(sWhatRunnedIt) && sWhatRunnedIt == "PreUpgrade"){
                insertInstallationLogsOnUpgrade("error");
            }
            closeHDIConnection(true);
            oContext = null;
            let developerInfo = "hdiModifyFiles error: " + err;
            throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        }
    }

    /**
     * upsert a list of files by hdiClient
     */
    this.hdiUpsertFiles = function (aUpsertList) {
        hdiModifyFiles(aUpsertList, []);
    };

    /**
     * delete a list of files by hdiClient
     */
    this.hdiDeleteFiles = function (aDeleteList) {
        hdiModifyFiles([], aDeleteList);
    };

    /**
     * Get an HDI connection.
     */
    function openHDIConnection() {
        if (helpers.isNullOrUndefined(oHDIClient)) {
            oHDIClient = new HDIClient($, getSchema(), getHDICredentials());
            oHDIClient.openConnection();
            bHDIOpened = true;
        }
    }

    function closeHDIConnection(bError) {
        if (bError) {
            if (bHDIOpened) {
                try {
                    oHDIClient.restore("/");
                } catch (serr) {
                    // nothing
                }
            }
        }
        if (oHDIClient) {
            oHDIClient.closeConnection();
            oHDIClient = null;
        }
        bHDIOpened = false;
    }

    function prepareAnalyticPrivilege(aUpsertList, bDummy) {
        var sViewPrivilege = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<Privilege:analyticPrivilege xmlns:Privilege=\"http://www.sap.com/ndb/BiModelPrivilege.ecore\" id=\"sap.plc.analytics.viewsCF::ap_analytics_general_cust\" privilegeType=\"SQL_ANALYTIC_PRIVILEGE\" schemaVersion=\"1.1\">\n" +
            "<descriptions defaultDescription=\"ap_analytics_general_cust\"/>\n" +
            "<securedModels>\n" +
            "    <modelUri>sap.plc.analytics.viewsCF::V_EXT_DUMMY_CUST</modelUri>\n";

        if (!bDummy) {
            let mDbArtefactsMetadata = getDbArtefactsMetadata();
            for (let sDbArtifactName in mDbArtefactsMetadata) {
                let oDbArtefact = mDbArtefactsMetadata[sDbArtifactName];

                if ((oDbArtefact.type === "hdbcalculationview") && (oDbArtefact.packageName.startsWith("analytics.viewsCF"))) {
                    sViewPrivilege += "    <modelUri>" + "sap.plc." +oDbArtefact.packageName + "::" + sDbArtifactName + "</modelUri>\n";
                }
            }
        }

        sViewPrivilege += "</securedModels>\n" + "</Privilege:analyticPrivilege>";

        /* this file also has static ones, so keep path consistency */
        aUpsertList.push({
            PATH: "src/analytics/viewsCF/ap_analytics_general_cust.hdbanalyticprivilege",
            CONTENT: sViewPrivilege
        });
    }

    function hdiGenerateFilesInternal(bDoDelete) {
        setContext();
        acquireExclusiveLock();

        // define pending list for hdi operation
        let aUpsertList = [];

        // process extension tables
        if (!bDoDelete) {
            loadAndCheckCustomFields();
        }
        prepareExtensionTables(aUpsertList, bDoDelete);

        // process db artefacts metadata related
        let mDbArtefactsMetadata = getDbArtefactsMetadata();
        for (let sDbArtifactName in mDbArtefactsMetadata) {
            let oDbArtefact = mDbArtefactsMetadata[sDbArtifactName];

            if (oDbArtefact.type === "hdbcalculationview") {
                prepareDbArtefact(sDbArtifactName, aUpsertList, ".hdbcalculationview");
            } else if (oDbArtefact.type === "hdbfunction") {
                prepareDbArtefact(sDbArtifactName, aUpsertList, ".hdbfunction");
            } else if (oDbArtefact.type === "SQLScript") {
                prepareDbArtefact(sDbArtifactName, aUpsertList, ".hdbprocedure");
            } else if (oDbArtefact.type === "Table") {
                if (sDbArtifactName.startsWith("gtt_")) {
                    prepareDbArtefact(sDbArtifactName, aUpsertList, ".hdbdropcreatetable");
                } else {
                    prepareDbArtefact(sDbArtifactName, aUpsertList, ".hdbtable");
                }
            } else if (oDbArtefact.type === "TableType" || oDbArtefact.type === "Structure") {
                prepareDbArtefact(sDbArtifactName, aUpsertList, ".hdbtabletype");
            } else if (oDbArtefact.type === "SQLView") {
                prepareDbArtefact(sDbArtifactName, aUpsertList, ".hdbview");
            } else if (oDbArtefact.type === "AFL") {
                prepareDbArtefact(sDbArtifactName, aUpsertList, ".hdbafllangprocedure");
            } else {
                let developerInfo = "unknown DB artefact type: " + oDbArtefact.type;
                $.trace.error(developerInfo);
                throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
            }
        }

        prepareAnalyticPrivilege(aUpsertList, false);

        aUpsertList.push({
            PATH: sContainerSrcRootPath + ".hdinamespace",
            CONTENT: "{\"name\": \"sap.plc\",\"subfolder\": \"append\"}"
        });
        aUpsertList.push({
            PATH: sContainerSrcRootPath + "sap/plc_test/.hdinamespace",
            CONTENT: "{\"name\": \"sap.plc_test\",\"subfolder\": \"append\"}"
        });
        aUpsertList.push({
            PATH: sContainerSrcRootPath + "afl/.hdinamespace",
            CONTENT: "{\"name\": \"\",\"subfolder\": \"append\"}"
        });

        hdiModifyFiles(aUpsertList, []);

        for (let boName in oContext) {
            that.clearExtensionTables(oContext[boName], bDoDelete);
        }
        oContext = null;
    }

    function getSchema() {
        return dbConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
    }

    function getHDICredentials() {
        if (isCloud()) {
            if (typeof dbConnection.getHDICredentials === "function") {
                // used for post install in multi-tenancy
                return dbConnection.getHDICredentials();
            } else {
                // used for normal case in multi-tenancy
                if (!$.hdb._options) {
                    $.hdb.getConnection({"treatDateAsUTC" : true, "enableColumnIndices": false});
                }
                return {
                    host: $.hdb._options.host,
                    port: $.hdb._options.port,
                    user: $.hdb._options.hdi_user,
                    password: $.hdb._options.hdi_password,
                    ca: $.hdb._options.certificate
                };
            }
        } else {
            // for on-premise use
            const xsenv = require('@sap/xsenv');
            let oRuntimeCredentialsXsa = xsenv.getServices({hana: {label: "hana"}});
            return {
                host: oRuntimeCredentialsXsa.hana.host,
                port: oRuntimeCredentialsXsa.hana.port,
                user: oRuntimeCredentialsXsa.hana.hdi_user,
                password: oRuntimeCredentialsXsa.hana.hdi_password
            };
        }
    }

    function insertInstallationLogsOnUpgrade(mode){
        try{
            let oVersionInfo = dbConnection.executeQuery(`
            SELECT 
                TOP 1 "VERSION",
                "VERSION_SP",
                "VERSION_PATCH"
            FROM 
                "sap.plc.db::basis.t_installation_log"
            ORDER BY 
                VERSION DESC, VERSION_SP DESC, VERSION_PATCH DESC, TIME DESC
            `);

            if(helpers.isNullOrUndefined(oVersionInfo)){
                throw 'No version was found in "sap.plc.db::basis.t_installation_log"';
            }
            
            let sSqlStatement = `INSERT INTO "sap.plc.db::basis.t_installation_log" 
                    (VERSION, VERSION_SP, VERSION_PATCH, NAME, TIME, EXECUTED_BY, STEP, STATE)
                    values (?,?,?,?,?,?,?,?)`;
        
                dbConnection.executeUpdate(sSqlStatement, oVersionInfo[0].VERSION, oVersionInfo[0].VERSION_SP, oVersionInfo[0].VERSION_PATCH, "PreUpgrade", new Date().toISOString(), $.getPlcUsername(),"", mode);
                dbConnection.commit();
        }  catch (e) {
            $.trace.error("insert data to t_installation_log table failed, can\"t log pre upgrade data to database");
            $.trace.error(e.message);
        }
    }

    function hdiPrepareUpgrade(sWhatRunnedIt) {
        acquireExclusiveLock();
        insertInstallationLogsOnUpgrade("running");

        // define pending list for hdi operation
        let aDeleteList = [];
        let aUpsertList = [];

        let mDbArtefactsMetadata = getDbArtefactsMetadata();
        // remove below type of dynamic artifacts before upgrade
        for (let sDbArtifactName in mDbArtefactsMetadata) {
            let oDbArtefact = mDbArtefactsMetadata[sDbArtifactName];

            if (oDbArtefact.type === "SQLScript") {
                deleteDbArtefact(sDbArtifactName, aDeleteList, ".hdbprocedure");
            } else if (oDbArtefact.type === "hdbcalculationview") {
                deleteDbArtefact(sDbArtifactName, aDeleteList, ".hdbcalculationview");
            } else if (oDbArtefact.type === "hdbfunction") {
                deleteDbArtefact(sDbArtifactName, aDeleteList, ".hdbfunction");
            } else if (oDbArtefact.type === "SQLView") {
                deleteDbArtefact(sDbArtifactName, aDeleteList, ".hdbview");
            } else if (oDbArtefact.type === "AFL") {
                deleteDbArtefact(sDbArtifactName, aDeleteList, ".hdbafllangprocedure");
            }
        }
        prepareAnalyticPrivilege(aUpsertList, true);

        // activate change via HDI
        hdiModifyFiles(aUpsertList, aDeleteList, sWhatRunnedIt);
    }

    /**
     * Read information about custom fields in t_metadata, check status of extension tables and custom fields.
     * If required, create extension tables, add custom fields, and regenerate DB artefacts.
     */
    this.generateAllFiles = function () {
        $.trace.info("Started checking and creating of extension tables and fields, and generating dynamic DB artefacts");
        hdiGenerateFilesInternal(false);
        $.trace.info("Finished checking and creating of extension tables and fields, and generating dynamic DB artefacts");
    };

    /**
     * Read information about custom fields in t_metadata, check status of extension tables and custom fields.
     * If required, create extension tables, add AND DELETE custom fields, and regenerate DB artefacts.
     *
     * Due to the potential deletion of custom fields, this API should not be called from productive code.
     */
    this.generateAllFilesExt = function () {
        $.trace.info("Started checking, creating and deleting of extension tables and fields, and generating dynamic DB artefacts");
        hdiGenerateFilesInternal(true);
        $.trace.info("Finished checking, creating and deleting of extension tables and fields, and generating dynamic DB artefacts");
    };

    /**
     * In upgrade case, to break the connection between static db artifacts and dynamic db artifacts, 5 types (
     * "SQLScript", "hdbcalculationview", "hdbfunction", "SQLView", "AFL" ) of dynamic artifacts should be temporary
     * removed before execute upgrade, those dynamic artifacts will be re-generated in later post install tool execution
     */
    this.prepareUpgrade = function (sWhatRunnedIt) {
        $.trace.info("Started upgrading of extension tables and fields, and generating dynamic DB artefacts");
        hdiPrepareUpgrade(sWhatRunnedIt);
        $.trace.info("Finished upgrading of extension tables and fields, and generating dynamic DB artefacts");
    };

    this.commit = function () {
        dbConnection.commit();
    };
}

DbArtefactController.prototype = Object.create(DbArtefactController.prototype);
DbArtefactController.prototype.constructor = DbArtefactController;

module.exports.DbArtefactController = DbArtefactController;