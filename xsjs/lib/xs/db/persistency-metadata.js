const helpers = require('../util/helpers');
const _ = require('lodash');
const constants = require('../util/constants');
const masterdataResources = require('../util/masterdataResources').MasterdataResource;
const MapStandardFieldsWithFormulas = constants.mapStandardFieldsWithFormulas;
const Helper = require('./persistency-helper').Helper;
const DbArtefactController = require('./generation/hdi-db-artefact-controller').DbArtefactController;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const MasterDataObjectTypes = require('../util/constants').MasterDataObjectTypes;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const FormulaInterpreterError = MessageLibrary.FormulaInterpreterErrorMapping;
const BusinessObjectTypes = constants.BusinessObjectTypes;


const Sequences = Object.freeze({
    formula: 'sap.plc.db.sequence::s_formula',
    field_mapping: 'sap.plc.db.sequence::s_field_mapping'
});

var Tables = Object.freeze({
    metadata: 'sap.plc.db::basis.t_metadata',
    metadataText: 'sap.plc.db::basis.t_metadata__text',
    metadataItemAttributes: 'sap.plc.db::basis.t_metadata_item_attributes',
    metadataSelectionFilter: 'sap.plc.db::basis.t_metadata_selection_filter',
    metadataSelectionDisplayed: 'sap.plc.db::basis.t_metadata_selection_displayed',
    formula: 'sap.plc.db::basis.t_formula',
    costingSheetOverheadRowFormula: 'sap.plc.db::basis.t_costing_sheet_overhead_row_formula',
    costingSheetOverheadRow: 'sap.plc.db::basis.t_costing_sheet_overhead_row',
    item: 'sap.plc.db::basis.t_item',
    itemExt: 'sap.plc.db::basis.t_item_ext',
    calculationVersion: 'sap.plc.db::basis.t_calculation_version',
    layout_columns: 'sap.plc.db::basis.t_layout_column',
    layout_hidden_fields: 'sap.plc.db::basis.t_layout_hidden_field',
    field_mapping: 'sap.plc.db::map.t_field_mapping'
});

const Procedures = Object.freeze({ checkFormula: 'sap.plc.db.calcengine.procedures::p_check_formulas' });

const BusinessObjectTables = new Map([
    [
        MasterDataObjectTypes.ActivityPrice,
        't_activity_price'
    ],
    [
        MasterDataObjectTypes.CostCenter,
        't_cost_center'
    ],
    [
        MasterDataObjectTypes.Material,
        't_material'
    ],
    [
        MasterDataObjectTypes.MaterialPrice,
        't_material_price'
    ],
    [
        MasterDataObjectTypes.MaterialPlant,
        't_material_plant'
    ],
    [
        MasterDataObjectTypes.WorkCenter,
        't_work_center'
    ]
]);

const aMetadataReadOnlyProperties = [
    'PATH',
    'BUSINESS_OBJECT',
    'COLUMN_ID',
    'IS_CUSTOM',
    'UOM_CURRENCY_FLAG',
    'SEMANTIC_DATA_TYPE',
    'SEMANTIC_DATA_TYPE_ATTRIBUTES',
    'IS_IMMUTABLE_AFTER_SAVE',
    'IS_REQUIRED_IN_MASTERDATA',
    'IS_WILDCARD_ALLOWED',
    'IS_USABLE_IN_FORMULA',
    'REF_UOM_CURRENCY_PATH',
    'REF_UOM_CURRENCY_BUSINESS_OBJECT',
    'REF_UOM_CURRENCY_COLUMN_ID'
];
const aMetadataItemAttributeReadOnlyProperties = [
    'PATH',
    'BUSINESS_OBJECT',
    'SUBITEM_STATE',
    'IS_MANDATORY',
    'IS_READ_ONLY',
    'IS_TRANSFERABLE',
    'COLUMN_ID',
    'LANGUAGE',
    'CREATED_ON',
    'CREATED_BY'
];
const aFormulaReadOnlyProperties = [
    'FORMULA_ID',
    'PATH',
    'BUSINESS_OBJECT',
    'COLUMN_ID',
    'ITEM_CATEGORY_ID'
];


async function Metadata($, hQuery, dbConnection, sUserId) {
    var that = this;
    this.helper = await new Helper($, hQuery, dbConnection);
    var currentdate = new Date();
    var oAuditValues = {
        'CREATED_ON': currentdate,
        'CREATED_BY': sUserId,
        'LAST_MODIFIED_ON': currentdate,
        'LAST_MODIFIED_BY': sUserId
    };

    /**
	 * Function to read all the properties of a Metadata (excluding objects).
	 *
	 * @param sPath
	 *            {string} - path is used to navigate through the client side models (business objects)
	 * @param sBusinessObject
	 *            {string} - the business object's name which is passed in the URL
	 * @param sColumnId
	 *            {string}- the column's id which is passed in the URL
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 *
	 * @returns {array} aMetadataResult - an array containing all data of the metadata (excluding Text, Attributes, Formulas)
	 */
    this.getMetadataFields = function (sPath, sBusinessObject, sColumnId, bIsCustom) {
        var aMetadataResult = [];

        var aStmtBuilder = ['SELECT a.PATH, a.BUSINESS_OBJECT, a.COLUMN_ID, a.IS_CUSTOM, a.ROLLUP_TYPE_ID, a.SIDE_PANEL_GROUP_ID,' + ' a.DISPLAY_ORDER, a.TABLE_DISPLAY_ORDER, a.REF_UOM_CURRENCY_PATH, a.REF_UOM_CURRENCY_BUSINESS_OBJECT,' + ' a.REF_UOM_CURRENCY_COLUMN_ID, a.UOM_CURRENCY_FLAG, a.SEMANTIC_DATA_TYPE, a.SEMANTIC_DATA_TYPE_ATTRIBUTES,' + ' a.PROPERTY_TYPE, a.IS_IMMUTABLE_AFTER_SAVE, a.IS_REQUIRED_IN_MASTERDATA, a.IS_WILDCARD_ALLOWED,' + ' a.IS_USABLE_IN_FORMULA, a.RESOURCE_KEY_DISPLAY_NAME, a.RESOURCE_KEY_DISPLAY_DESCRIPTION,' + ' a.CREATED_ON, a.CREATED_BY, a.LAST_MODIFIED_ON, a.LAST_MODIFIED_BY, a.VALIDATION_REGEX_ID,' + ' b.VALIDATION_REGEX_VALUE FROM "' + Tables.metadata + '" as a left outer join "sap.plc.db::basis.t_regex" as b on a.VALIDATION_REGEX_ID = b.VALIDATION_REGEX_ID'];
        aMetadataResult = this.buildWhereClauseAndExecuteStatement(sPath, sBusinessObject, sColumnId, bIsCustom, aStmtBuilder);

        return aMetadataResult;
    };

    /**
	 * Function to read all the Text Metadata.
	 *
	 * @param sBusinessObject
	 *            {string} - the business object's name which is passed in the URL
	 * @param sColumnId
	 *            {string}- the column's id which is passed in the URL
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 *
	 * @returns {array} aTextResult - an array containing all the Text metadata
	 */
    this.getMetadataText = function (sPath, sColumnId) {
        var aTextResult = [];

        var aStmtBuilder = ['select PATH, COLUMN_ID, LANGUAGE, DISPLAY_NAME, DISPLAY_DESCRIPTION, CREATED_ON, CREATED_BY,' + ' LAST_MODIFIED_ON, LAST_MODIFIED_BY from "' + Tables.metadataText + '" '];
        aTextResult = this.buildWhereClauseAndExecuteStatement(sPath, null, sColumnId, null, aStmtBuilder);

        return aTextResult;
    };

    /**
	 * Function to read all the Attributes Metadata.
	 *
	 * @param sPath
	 *            {string} - path is used to navigate through the client side models (business objects)
	 * @param sBusinessObject
	 *            {string} - the business object's name which is passed in the URL
	 * @param sColumnId
	 *            {string}- the column's id which is passed in the URL
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 *
	 * @returns {array} aAttributesResult - an array containing all the Attributes metadata
	 */
    this.getMetadataItemAttributes = function (sPath, sBusinessObject, sColumnId) {
        var aAttributesResult = [];

        var aStmtBuilder = ['select PATH, BUSINESS_OBJECT, COLUMN_ID, ITEM_CATEGORY_ID, SUBITEM_STATE, IS_MANDATORY,' + 'IS_READ_ONLY, IS_TRANSFERABLE, DEFAULT_VALUE, CREATED_ON, CREATED_BY,' + ' LAST_MODIFIED_ON, LAST_MODIFIED_BY from "' + Tables.metadataItemAttributes + '" '];
        aAttributesResult = this.buildWhereClauseAndExecuteStatement(sPath, sBusinessObject, sColumnId, null, aStmtBuilder);

        return aAttributesResult;
    };

    /**
	 * Returns the names+types+defaultValues of the master data custom fields
	 * @returns {object} oMasterdataCustomFields - an object containing names+types+defaultValues of masterdata custom fields in item_ext table
	 */
    this.getMasterdataCustomFields = function () {

        var oMasterdataCustomFields = {
            COLUMNS: [],
            DATA_TYPES: [],
            DEFAULT_VALUES: []
        };

        const sStmt = `select distinct 
						item.column_id, item.default_value, header.semantic_data_type, header.uom_currency_flag
						from "${ Tables.metadataItemAttributes }" as item
						inner join "${ Tables.metadata }" as header
						on item.path = header.path
						and item.business_object = header.business_object
						and item.column_id = header.column_id
						where item.path = ? and item.business_object = ?
						and header.is_custom = 1
						and item.column_id LIKE_REGEXPR '^(CAPR|CWCE|CMPR|CMPL|CMAT|CCEN)_[A-Z][A-Z0-9_]*$'
						order by column_id`;

        const oQueryResult = await dbConnection.executeQuery(sStmt, BusinessObjectTypes.Item, BusinessObjectTypes.Item);
        var aMetadataFields = Array.from(oQueryResult);

        _.each(aMetadataFields, function (oMetadataField, iIndex) {
            if (oMetadataField.UOM_CURRENCY_FLAG !== 1) {
                oMasterdataCustomFields.COLUMNS.push(oMetadataField.COLUMN_ID + '_MANUAL');
            } else {
                oMasterdataCustomFields.COLUMNS.push(oMetadataField.COLUMN_ID);
            }
            oMasterdataCustomFields.DATA_TYPES.push(oMetadataField.SEMANTIC_DATA_TYPE);
            oMasterdataCustomFields.DEFAULT_VALUES.push(oMetadataField.DEFAULT_VALUE);
        });
        return oMasterdataCustomFields;
    };


    /**
	 * Gets a list of all columns defined for the category of the specified business object and path. *
	 *
	 * @param sPath
	 *            {string} - Metadata path.
	 * @param sBusinessObject
	 *            {string} - Business object for which the columns and categories shall be retrieved
	 * @returns {array} - An array of object with the properties <code>ITEM_CATEGORY_ID</code> and <code>COLUMN_ID</code>. For each
	 *          valid column for a category an object is contained in the array.
	 */
    this.getColumnsForCategories = async function (sPath, sBusinessObject) {
        var aStmtBuilder = `select distinct item.column_id, item.item_category_id, header.is_custom, header.uom_currency_flag
		from "${ Tables.metadataItemAttributes }" as item
		inner join "${ Tables.metadata }" as header
		on item.path = header.path
		and item.business_object = header.business_object
		and item.column_id = header.column_id
		where item.path = ? and item.business_object = ?
		order by item_category_id, column_id`;

        var stmt = hQuery.statement(aStmtBuilder);
        var result = await stmt.execute(sPath, sBusinessObject);
        return result;
    };

    /**
	 * Gets a list of all custom fields columns (with their default value) defined for the category of the specified business object and path. *
	 *
	 * @param sPath
	 *            {string} - Metadata path.
	 * @param sBusinessObject
	 *            {string} - Business object for which the columns and categories shall be retrieved
	 * @returns {array} - An array of objects with the properties <code>ITEM_CATEGORY_ID</code>, <code>COLUMN_ID</code>, <code>DEFAULT_VALUE</code>
	 *                    <code>UOM_CURRENCY_FLAG</code> and <code>PROPERTY_TYPE</code> .
	 */
    this.getCustomFieldsWithDefaultValuesForCategories = (sPath, sBusinessObject) => {
        const sStmt = `select distinct 
		item.column_id, item.item_category_id, item.default_value, header.uom_currency_flag, header.property_type
		from "${ Tables.metadataItemAttributes }" as item
		inner join "${ Tables.metadata }" as header
		on item.path = header.path
		and item.business_object = header.business_object
		and item.column_id = header.column_id
		where item.path = ? and item.business_object = ?
		and header.is_custom = 1
		order by item_category_id, column_id`;

        const oQueryResult = await dbConnection.executeQuery(sStmt, sPath, sBusinessObject);

        return Array.from(oQueryResult);
    };

    /**
	 * Function to read all the Formulas Metadata.
	 *
	 * @param sBusinessObject
	 *            {string} - the business object's name which is passed in the URL
	 * @param sColumnId
	 *            {string}- the column's id which is passed in the URL
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 *
	 * @returns {array} aResult - an array containing all the Formulas metadata
	 */
    this.getMetadataFormulas = function (sPath, sBusinessObject, sColumnId) {
        var aFormulasResult = [];

        var aStmtBuilder = ['select FORMULA_ID, PATH, BUSINESS_OBJECT, COLUMN_ID, ITEM_CATEGORY_ID, IS_FORMULA_USED,' + ' FORMULA_STRING, FORMULA_DESCRIPTION from "' + Tables.formula + '" '];
        aFormulasResult = this.buildWhereClauseAndExecuteStatement(sPath, sBusinessObject, sColumnId, null, aStmtBuilder);

        return aFormulasResult;
    };

    /**
	 * Function to read all the Selection Filters.
	 *
	 * @param sPath
	 *            {string} - path is used to navigate through the client side models (business objects)
	 * @param sBusinessObject
	 *            {string} - the business object's name which is passed in the URL
	 * @param sColumnId
	 *            {string}- the column's id which is passed in the URL
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 *
	 * @returns {array} aSelectionFilterResult - an array containing all the Selection Filters
	 */
    this.getMetadataSelectionFilter = function (sPath, sBusinessObject, sColumnId) {
        var aSelectionFilterResult = [];

        var aStmtBuilder = ['select PATH, BUSINESS_OBJECT, COLUMN_ID, FILTER_PATH, FILTER_BUSINESS_OBJECT, FILTER_COLUMN_ID from "' + Tables.metadataSelectionFilter + '" '];
        aSelectionFilterResult = this.buildWhereClauseAndExecuteStatement(sPath, sBusinessObject, sColumnId, null, aStmtBuilder);

        return aSelectionFilterResult;
    };

    /**
	 * Function to read all the Attributes Metadata.
	 *
	 * @param sPath
	 *            {string} - path is used to navigate through the client side models (business objects)
	 * @param sBusinessObject
	 *            {string} - the business object's name which is passed in the URL
	 * @param sColumnId
	 *            {string}- the column's id which is passed in the URL
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 *
	 * @returns {array} aSelectionDisplayedResult - an array containing all the Selection Displayed
	 */
    this.getMetadataSelectionDisplayed = function (sPath, sBusinessObject, sColumnId) {
        var aSelectionDisplayedResult = [];

        var aStmtBuilder = ['select PATH, BUSINESS_OBJECT, COLUMN_ID, DISPLAY_ORDER, DISPLAYED_PATH, DISPLAYED_BUSINESS_OBJECT, DISPLAYED_COLUMN_ID from "' + Tables.metadataSelectionDisplayed + '" '];
        aSelectionDisplayedResult = this.buildWhereClauseAndExecuteStatement(sPath, sBusinessObject, sColumnId, null, aStmtBuilder);

        return aSelectionDisplayedResult;
    };

    /**
	 * Function that creates where clause depending on parameters sent.
	 *
	 * @param sPath
	 *            {string} - the path which is passed in the URL
	 * @param sBusinessObject
	 *            {string} - the business object's name which is passed in the URL
	 * @param sColumnId
	 *            {string}- the column's id which is passed in the URL
	 * @param bIsCustom
	 *            {boolean}- the is_custom parameters which is passed in the URL
	 * @param aStmtBuilder
	 *            {array}- array that contains previous select statement
	 * @param sWhereClause
	 *            {array}- additional where clase
	 *
	 * @returns {array} aMetadataResult - an array containing all the entities that were requested
	 */
    this.buildWhereClauseAndExecuteStatement = async function (sPath, sBusinessObject, sColumnId, bIsCustom, aStmtBuilder, sWhereClause) {
        var aMetadataResult = [];
        var oGetMetadataStatement;
        var whereClauseParams = [];

        if (helpers.isNullOrUndefined(sWhereClause)) {
            aStmtBuilder.push(' WHERE 1 = 1 ');
        } else {
            aStmtBuilder.push(sWhereClause);
        }

        if (sBusinessObject === 'Masterdata' && bIsCustom) {
            // it will return all the custom fields for master data objects
            var aMasterdataBusinessObjects = [
                'Material',
                'Material_Price',
                'Material_Plant',
                'Cost_Center',
                'Work_Center',
                'Activity_Price'
            ];
            aStmtBuilder.push(" AND PATH in ('" + aMasterdataBusinessObjects.join("', '") + "')");
        }
        if (!helpers.isNullOrUndefined(sBusinessObject) && sBusinessObject !== 'Masterdata') {
            aStmtBuilder.push(' AND BUSINESS_OBJECT = ? ');
            whereClauseParams.push(sBusinessObject);
        }
        if (!helpers.isNullOrUndefined(sPath)) {
            aStmtBuilder.push(' AND PATH = ? ');
            whereClauseParams.push(sPath);
        }
        if (!helpers.isNullOrUndefined(sColumnId)) {
            aStmtBuilder.push(' AND COLUMN_ID = ? ');
            whereClauseParams.push(sColumnId);
        }
        if (!helpers.isNullOrUndefined(bIsCustom)) {
            aStmtBuilder.push(' AND IS_CUSTOM = ? ');
            whereClauseParams.push(await helpers.boolToInt(bIsCustom));
        }
        aStmtBuilder.push(' ORDER BY COLUMN_ID ');
        oGetMetadataStatement = hQuery.statement(aStmtBuilder.join(''));
        aMetadataResult = await oGetMetadataStatement.execute(whereClauseParams);

        return aMetadataResult;
    };

    /**
	 * Create new metadata entry in database
	 *
	 * @param {object}
	 *            oMeta - each object of the array from request with the properties of the new metadata
	 * @returns {object} oResult - created metadata
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.create = async function (oMeta) {
        var oResult;
        var refMetadata;
        // check if referenced UOM exists
        if (oMeta.UOM_CURRENCY_FLAG === 0 && !helpers.isNullOrUndefinedOrEmpty(oMeta.REF_UOM_CURRENCY_PATH) && !helpers.isNullOrUndefinedOrEmpty(oMeta.REF_UOM_CURRENCY_BUSINESS_OBJECT) && !helpers.isNullOrUndefinedOrEmpty(oMeta.REF_UOM_CURRENCY_COLUMN_ID)) {
            refMetadata = that.getRefMetadata(oMeta);
            if (helpers.isNullOrUndefined(refMetadata)) {
                var oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oMeta);
                const sLogMessage = `Referenced UOM OR CURRENCY doesn't exists. REF_UOM_CURRENCY_PATH: ${ oMeta.REF_UOM_CURRENCY_PATH }, REF_UOM_CURRENCY_BUSINESS_OBJECT: ${ oMeta.REF_UOM_CURRENCY_BUSINESS_OBJECT }, REF_UOM_CURRENCY_COLUMN_ID: ${ oMeta.REF_UOM_CURRENCY_COLUMN_ID }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_REF_UOM_CURRENCY_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
            }
        }

        oResult = that.createMetadata(oMeta, refMetadata);
        oResult.TEXT = that.upsertMetadataText(oMeta);
        oResult.ATTRIBUTES = that.createAttributes(oMeta);
        oResult.FORMULAS = that.createFormulas(oMeta);

        return oResult;
    };

    /**
	 * Function to checks if a related metadata exists
	 *
	 * @param oMeta
	 *            {object} - metadata object that is used to see of the reference UOM exists
	 *
	 * @returns {boolean} true if ref UOM exists, false if not
	 */
    this.getRefMetadata = function (oMeta) {
        const sSelectStatementRefMetadata = `select PATH, BUSINESS_OBJECT, COLUMN_ID, IS_CUSTOM, ROLLUP_TYPE_ID, SIDE_PANEL_GROUP_ID, DISPLAY_ORDER, TABLE_DISPLAY_ORDER, REF_UOM_CURRENCY_PATH, REF_UOM_CURRENCY_BUSINESS_OBJECT,
	                                                REF_UOM_CURRENCY_COLUMN_ID, UOM_CURRENCY_FLAG, SEMANTIC_DATA_TYPE, SEMANTIC_DATA_TYPE_ATTRIBUTES, PROPERTY_TYPE, IS_IMMUTABLE_AFTER_SAVE, IS_REQUIRED_IN_MASTERDATA, IS_WILDCARD_ALLOWED,
	                                                IS_USABLE_IN_FORMULA, RESOURCE_KEY_DISPLAY_NAME, RESOURCE_KEY_DISPLAY_DESCRIPTION, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY, VALIDATION_REGEX_ID 
	                                            from "${ Tables.metadata }" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?`;
        const aRefMetadata = await dbConnection.executeQuery(sSelectStatementRefMetadata, oMeta.REF_UOM_CURRENCY_PATH, oMeta.REF_UOM_CURRENCY_BUSINESS_OBJECT, oMeta.REF_UOM_CURRENCY_COLUMN_ID);
        return aRefMetadata[0];
    };

    /**
	 * Function to creates new metadata entity in t_metadata table.
	 *
	 * @param oMeta
	 *            {object} - metadata object that must be inserted into t_metadata table
	 *
	 * @returns {object} object that was inserted into t_metadata table
	 */
    this.createMetadata = function (oMeta, oRefMeta) {
        oMeta.COLUMN_ID = oMeta.COLUMN_ID.toUpperCase();
        var oSettings = {
            TABLE: Tables.metadata,
            PROPERTIES_TO_EXCLUDE: [
                'TEXT',
                'ATTRIBUTES',
                'FORMULAS'
            ],
            GENERATED_PROPERTIES: _.extend(that.getMetadataGeneratedProperties(oMeta, oRefMeta), oAuditValues)
        };
        return that.helper.insertNewEntity(oMeta, oSettings);
    };

    /**
	 * Function that creates attributes in t_metadata_item_attributes table
	 * depends on ROLLUP_TYPE_ID and if the field is UOM or CURRENCY must generate 2 or 4 attributes
	 * For ROLLUP_TYPE_ID > 0 and field is NOT UOM or CURRENCY must generate all these combinations
	 subitem_state, read_only
	 0, 		   0
	 1, 		   1
	 *	For ROLLUP_TYPE_ID = 0 OR field is UOM or CURRENCY must generate all these combinations
	 *	subitem_state, read_only
	 -1,    0
	 * For ITEM_CATEGORY_ID = 10 (referenced version) READ_ONLY should be set to 1
	 *
	 * @param oMeta
	 *            {object} - metadata object that have texts that must be inserted into t_metadata_item_attributes table
	 *
	 * @returns {array} an array of attributes that were inserted into database
	 */
    this.createAttributes = function (oMeta) {
        var aAttributes = [];

        _.each(oMeta.ATTRIBUTES, function (oAttrMeta) {
            aAttributes = _.union(aAttributes, that.createAttribute(oAttrMeta, oMeta.ROLLUP_TYPE_ID, oMeta.UOM_CURRENCY_FLAG, oMeta.PROPERTY_TYPE));
        });

        return aAttributes;
    };

    /**
	 * creates only one attribute for a specific item category, can be 2 or 4 see comments for above method
	 */
    this.createAttribute = function (oAttrMeta, rollup_type_id, uom_currency_flag, property_type) {
        var oSettingsAttributes = {
            TABLE: Tables.metadataItemAttributes,
            PROPERTIES_TO_EXCLUDE: [],
            GENERATED_PROPERTIES: oAuditValues
        };
        var aAttributesByItemCategory = [];
        var oAttrResult = {};

        if (oAttrMeta.PATH !== 'Item' && oAttrMeta.BUSINESS_OBJECT !== 'Item') {
            /* Master data custom fields have only 1 attribute with SUBITEM_STATE = -1
				like in the case of master data standard fields. */
            const oAttrMetaFirst = _.clone(oAttrMeta);
            oAttrMetaFirst.SUBITEM_STATE = -1;
            oAttrMetaFirst.IS_READ_ONLY = oAttrMeta.ITEM_CATEGORY_ID === 10 ? 1 : 0;

            oAttrResult = that.helper.insertNewEntity(oAttrMetaFirst, oSettingsAttributes);
            aAttributesByItemCategory.push(oAttrResult);
        } else if (uom_currency_flag === 1 && property_type === 7 && rollup_type_id !== 0) {
            /* 1th entry*/
            const oAttrMetaFirst = _.clone(oAttrMeta);
            oAttrMetaFirst.SUBITEM_STATE = 0;
            oAttrMetaFirst.IS_READ_ONLY = oAttrMeta.ITEM_CATEGORY_ID === 10 ? 1 : 0;

            oAttrResult = that.helper.insertNewEntity(oAttrMetaFirst, oSettingsAttributes);
            aAttributesByItemCategory.push(oAttrResult);

            /* 2nd entry*/
            const oAttrMetaThird = _.clone(oAttrMeta);
            oAttrMetaThird.SUBITEM_STATE = 1;
            oAttrMetaThird.IS_READ_ONLY = 1;

            oAttrResult = that.helper.insertNewEntity(oAttrMetaThird, oSettingsAttributes);
            aAttributesByItemCategory.push(oAttrResult);
        } else if (uom_currency_flag === 1 || rollup_type_id === 0 && uom_currency_flag === 0) {
            /* 1th entry*/
            const oAttrMetaFirst = _.clone(oAttrMeta);
            oAttrMetaFirst.SUBITEM_STATE = -1;
            oAttrMetaFirst.IS_READ_ONLY = oAttrMeta.ITEM_CATEGORY_ID === 10 ? 1 : 0;

            oAttrResult = that.helper.insertNewEntity(oAttrMetaFirst, oSettingsAttributes);
            aAttributesByItemCategory.push(oAttrResult);
        } else {
            /* 1th entry*/
            const oAttrMetaFirst = _.clone(oAttrMeta);
            oAttrMetaFirst.SUBITEM_STATE = 0;
            oAttrMetaFirst.IS_READ_ONLY = oAttrMeta.ITEM_CATEGORY_ID === 10 ? 1 : 0;

            oAttrResult = that.helper.insertNewEntity(oAttrMetaFirst, oSettingsAttributes);
            aAttributesByItemCategory.push(oAttrResult);

            /* 2nd entry*/
            const oAttrMetaThird = _.clone(oAttrMeta);
            oAttrMetaThird.SUBITEM_STATE = 1;
            oAttrMetaThird.IS_READ_ONLY = 1;

            oAttrResult = that.helper.insertNewEntity(oAttrMetaThird, oSettingsAttributes);
            aAttributesByItemCategory.push(oAttrResult);
        }

        return aAttributesByItemCategory;
    };

    /**
	 * Function to creates new formulas entity in t_formula table.
	 *
	 * @param oMeta
	 *            {object} - metadata object that have formulas that must be inserted into t_formula table
	 *
	 * @returns {array} an array of formulas that were inserted into database
	 */
    this.createFormulas = async function (oMeta) {
        var aFormulas = [];
        var oSettingsFormulas = {
            TABLE: Tables.formula,
            PROPERTIES_TO_EXCLUDE: [],
            GENERATED_PROPERTIES: []
        };
        _.each(oMeta.FORMULAS, oFormula => {

            var iFormulaId = that.helper.getNextSequenceID(Sequences.formula);
            var oFormulaGeneratedValues = {
                'FORMULA_ID': iFormulaId,
                'IS_FORMULA_USED': !helpers.isNullOrUndefined(oFormula.IS_FORMULA_USED) ? oFormula.IS_FORMULA_USED : 1
            };
            checkIfFormulaStringIsEmpty(oFormula);
            oSettingsFormulas.GENERATED_PROPERTIES = oFormulaGeneratedValues;
            var oAttrResult = that.helper.insertNewEntity(oFormula, oSettingsFormulas);

            aFormulas.push(oAttrResult);
        });
        if (!helpers.isNullOrUndefined(oMeta.FORMULAS) && !_.isEmpty(oMeta.FORMULAS)) {
            that.validateFormulaString(oMeta.FORMULAS[0]);
        }
        return aFormulas;
    };

    /**
	 * Sets values that must be set from back-end for a new custom field
	 * IS_CUSTOM = 1
	 * DISPLAY_ORDER maximum value for the group + 1 ,
	 * TABLE_DISPLAY_ORDER = NULL
	 * SEMANTIC_DATA_TYPE_ATTRIBUTES based on SEMANTIC_DATA_TYPE
	 * PROPERTY_TYPE  based on SEMANTIC_DATA_TYPE
	 * IS_IMMUTABLE_AFTER_SAVE set to NULL
	 * IS_REQUIRED_IN_MASTERDATA set to NULL
	 * RESOURCE_KEY_DISPLAY_NAME set to NULL
	 * RESOURCE_KEY_DISPLAY_DESCRIPTION set to NULL
	 * ATTRIBUTES->IS_TRANSFERABLE set to NULL
	 * IS_WILDCARD_ALLOWED set to NULL
	 * DISPLAY_ORDER must not be set for UOM and Currency entities
	 * SIDE_PANEL_GROUP_ID must not be set for UOM and Currency entities
	 *
	 * @param oMeta
	 *            {object} - metadata object that is from request
	 *
	 * @returns {object} object that contains all generated values
	 */
    this.getMetadataGeneratedProperties = function (oMeta, oRefMeta) {
        var bIsUOM = oMeta.UOM_CURRENCY_FLAG === 1;

        var oGeneratedValues = {
            'IS_CUSTOM': 1,
            'DISPLAY_ORDER': oMeta.UOM_CURRENCY_FLAG === 0 ? that.getDisplayOrder(oMeta, null) : null,
            'SEMANTIC_DATA_TYPE_ATTRIBUTES': bIsUOM ? constants.SemanticDataTypeAttributes.StringUOM : that.getSemanticDataTypeAttribute(oMeta.SEMANTIC_DATA_TYPE),
            'PROPERTY_TYPE': bIsUOM ? oMeta.PROPERTY_TYPE : that.getPropertyType(oMeta.SEMANTIC_DATA_TYPE, oRefMeta),
            'IS_IMMUTABLE_AFTER_SAVE': null,
            'IS_REQUIRED_IN_MASTERDATA': null,
            'RESOURCE_KEY_DISPLAY_NAME': null,
            'RESOURCE_KEY_DISPLAY_DESCRIPTION': null,
            'IS_WILDCARD_ALLOWED': null,
            'IS_USABLE_IN_FORMULA': 1,
            'SIDE_PANEL_GROUP_ID': oMeta.UOM_CURRENCY_FLAG === 0 ? oMeta.SIDE_PANEL_GROUP_ID : null,
            'VALIDATION_REGEX_ID': oMeta.SEMANTIC_DATA_TYPE === 'Link' ? constants.RegexIds['LINK'] : null
        };
        return oGeneratedValues;
    };

    /**
	 * @param oMeta
	 *            {object} - metadata object that is from request
	 * @param oOldMeta
	 *            {object} - null for creating custom field, existing entity from database for update
	 *
	 * @returns {object} object that contains all generated values
	 */
    this.getDisplayOrder = async function (oMeta, oOldMeta) {
        var bIsCustom = await helpers.isNullOrUndefined(oOldMeta) ? 1 : oOldMeta.IS_CUSTOM;
        var displayOrder = null;
        var oCheckStatement = hQuery.statement('select top 1 MAX(DISPLAY_ORDER) as MAX_DISPLAY_ORDER, IS_CUSTOM from "' + Tables.metadata + '" where path = ? and business_object = ? and side_panel_group_id = ? ' + ' group by IS_CUSTOM order by MAX(DISPLAY_ORDER) desc ');
        var aMaxValue = await oCheckStatement.execute(oMeta.PATH, oMeta.BUSINESS_OBJECT, await helpers.isNullOrUndefined(oOldMeta) ? oMeta.SIDE_PANEL_GROUP_ID : oOldMeta.SIDE_PANEL_GROUP_ID);

        var iMaxValue = await helpers.isNullOrUndefined(aMaxValue[0]) || await helpers.isNullOrUndefined(aMaxValue[0].MAX_DISPLAY_ORDER) ? null : parseInt(aMaxValue[0].MAX_DISPLAY_ORDER, 10);
        var bIsCustomPrevious = await helpers.isNullOrUndefined(aMaxValue[0]) || await helpers.isNullOrUndefined(aMaxValue[0].IS_CUSTOM) ? null : aMaxValue[0].IS_CUSTOM;

        if (helpers.isNullOrUndefined(iMaxValue)) {
            if (bIsCustom === 1) {
                displayOrder = 500;
            }
        } else {
            if (bIsCustom === 1 && bIsCustomPrevious || bIsCustom === 0) {
                displayOrder = iMaxValue + 1;
            }
            if (bIsCustom === 1 && !bIsCustomPrevious) {
                displayOrder = iMaxValue + 500;
            }
            if (bIsCustom === 0) {
                displayOrder = iMaxValue + 1;
            }
        }

        return displayOrder;
    };


    /**
	 * This function generates values for TABLE_DISPLAY_ORDER field when creating masterdata custom fields
	 * @param oMeta
	 *            {object} - metadata object that is from request
	 *
	 * @returns {object} object that contains all generated values
	 */
    this.getTableDisplayOrder = async function (oMeta) {
        var tableDisplayOrder = null;
        var oCheckStatement = hQuery.statement('select top 1 MAX(TABLE_DISPLAY_ORDER) as MAX_TABLE_DISPLAY_ORDER, IS_CUSTOM from "' + Tables.metadata + '" where path = ? and business_object = ? ' + ' group by IS_CUSTOM order by MAX(TABLE_DISPLAY_ORDER) desc ');
        var aMaxValue = await oCheckStatement.execute(oMeta.PATH, oMeta.BUSINESS_OBJECT);

        var iMaxValue = await helpers.isNullOrUndefined(aMaxValue[0]) || await helpers.isNullOrUndefined(aMaxValue[0].MAX_TABLE_DISPLAY_ORDER) ? null : parseInt(aMaxValue[0].MAX_TABLE_DISPLAY_ORDER, 10);
        var bIsCustomPrevious = await helpers.isNullOrUndefined(aMaxValue[0]) || await helpers.isNullOrUndefined(aMaxValue[0].IS_CUSTOM) ? null : aMaxValue[0].IS_CUSTOM;

        if (helpers.isNullOrUndefined(iMaxValue)) {
            tableDisplayOrder = 500;
        } else {
            tableDisplayOrder = bIsCustomPrevious ? iMaxValue + 1 : iMaxValue + 500;
        }

        return tableDisplayOrder;
    };


    /**
	 * retrieve datatypeattributes based on datatype
	 */
    this.getSemanticDataTypeAttribute = async function (sSemanticDataType) {
        switch (sSemanticDataType) {
        case 'String':
            return constants.SemanticDataTypeAttributes.String;
        case 'Link':
            return constants.SemanticDataTypeAttributes.Link;
        case 'Decimal':
            return constants.SemanticDataTypeAttributes.Decimal;
        case 'Integer':
            return constants.SemanticDataTypeAttributes.Integer;
        case 'BooleanInt':
            return constants.SemanticDataTypeAttributes.BooleanInt;
        case 'LocalDate':
            return constants.SemanticDataTypeAttributes.LocalDate;
        default: {
                const sLogMessage = `Semantic data type '${ sSemanticDataType }' is not valid.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    };

    /**
	 * retrieve datatypeattributes based on datatype
	 */
    this.getPropertyType = async function (sSemanticDataType, oRefMeta) {
        /* in case created field is type currency, set the property type to be Price = 1*/
        if (!helpers.isNullOrUndefined(oRefMeta)) {
            if (oRefMeta.PROPERTY_TYPE === 7) {
                return constants.PropertyTypes.Price;
            }
        }
        switch (sSemanticDataType) {
        case 'String':
            return constants.PropertyTypes.String;
        case 'Link':
            return constants.PropertyTypes.Link;
        case 'Decimal':
            return constants.PropertyTypes.Decimal;
        case 'Integer':
            return constants.PropertyTypes.Integer;
        case 'BooleanInt':
            return constants.PropertyTypes.BooleanInt;
        case 'LocalDate':
            return constants.PropertyTypes.LocalDate;
        default: {
                const sLogMessage = `Semantic data type '${ sSemanticDataType }' is not valid.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    };

    /**
	 * Check if the metadata object exists in the database
	 *
	 * @param {object}
	 *            oMeta - object that must check if exists
	 * @returns {boolean} - returns true if object exists
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 */
    this.checkMetadataExists = async function (oMeta) {
        var sPath = oMeta.PATH;
        var sObject = oMeta.BUSINESS_OBJECT;
        var sColumn = oMeta.COLUMN_ID;

        var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + Tables.metadata + '" where path = ? and business_object = ? and column_id = ?');
        var aCount = await oCheckStatement.execute(sPath, sObject, sColumn);
        var iMetadata = parseInt(aCount[0].ROWCOUNT, 10);

        return iMetadata > 0;
    };

    /**
	 * update an existing metadata in database
	 *
	 * @param {object}
	 *            oMeta - each object of the array from request with the properties of the new metadata
	 * @returns {object} oResult - updated metadata
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 */
    this.update = async function (oMeta) {
        var oResult;
        var sPath = oMeta.PATH;
        var sObject = oMeta.BUSINESS_OBJECT;
        var sColumn = oMeta.COLUMN_ID;
        var refMetadata;

        // check if referenced UOM exists
        if (oMeta.UOM_CURRENCY_FLAG === 0 && !helpers.isNullOrUndefined(oMeta.REF_UOM_CURRENCY_PATH) && !helpers.isNullOrUndefined(oMeta.REF_UOM_CURRENCY_BUSINESS_OBJECT) && !helpers.isNullOrUndefined(oMeta.REF_UOM_CURRENCY_COLUMN_ID) && oMeta.REF_UOM_CURRENCY_PATH !== '' && oMeta.REF_UOM_CURRENCY_BUSINESS_OBJECT !== '' && oMeta.REF_UOM_CURRENCY_COLUMN_ID !== '') {
            refMetadata = that.getRefMetadata(oMeta);
            if (!helpers.isNullOrUndefined(refMetadata)) {
                var oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oMeta);
                const sLogMessage = `Referenced UOM OR CURRENCY doesn't exists. REF_UOM_CURRENCY_PATH: ${ oMeta.REF_UOM_CURRENCY_PATH }, REF_UOM_CURRENCY_BUSINESS_OBJECT: ${ oMeta.REF_UOM_CURRENCY_BUSINESS_OBJECT }, REF_UOM_CURRENCY_COLUMN_ID: ${ oMeta.REF_UOM_CURRENCY_COLUMN_ID }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_REF_UOM_CURRENCY_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
            }
        }

        var oCheckStatement = hQuery.statement('select PATH, BUSINESS_OBJECT, COLUMN_ID, IS_CUSTOM, ROLLUP_TYPE_ID, SIDE_PANEL_GROUP_ID,' + ' DISPLAY_ORDER, TABLE_DISPLAY_ORDER, REF_UOM_CURRENCY_PATH, REF_UOM_CURRENCY_BUSINESS_OBJECT,' + ' REF_UOM_CURRENCY_COLUMN_ID, UOM_CURRENCY_FLAG, SEMANTIC_DATA_TYPE, SEMANTIC_DATA_TYPE_ATTRIBUTES,' + ' PROPERTY_TYPE, IS_IMMUTABLE_AFTER_SAVE, IS_REQUIRED_IN_MASTERDATA, IS_WILDCARD_ALLOWED,' + ' IS_USABLE_IN_FORMULA, RESOURCE_KEY_DISPLAY_NAME, RESOURCE_KEY_DISPLAY_DESCRIPTION,' + ' CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY, VALIDATION_REGEX_ID' + ' from "' + Tables.metadata + '" where path = ? and business_object = ? and column_id = ?');
        var aMetadata = await oCheckStatement.execute(sPath, sObject, sColumn);
        // dont't check here if exists since it is already checked in provider
        var oMetadataOld = aMetadata[0];

        oResult = that.updateMetadata(oMeta, oMetadataOld);
        oResult.TEXT = that.upsertMetadataText(oMeta);
        oResult.ATTRIBUTES = that.updateMetadataAttributes(oMeta, oMetadataOld);
        var oFormulaObj = that.updateFormulas(oMeta);
        oResult.FORMULAS = oFormulaObj.FORMULAS;
        oResult.FORMULAS_TRIGGERS_IS_MANUAL_CHANGE = oFormulaObj.FORMULAS_TRIGGERS_IS_MANUAL_CHANGE;
        return oResult;
    };

    /**
	 * update an existing metadata in t_metadata table
	 *
	 * @param {object}
	 *            oMeta - each object of the array from request with the properties of the new metadata
	 * @param {object}
	 *            oMetadataOld - existing entity from database
	 *
	 * @returns {object} oResult - updated metadata
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 */
    this.updateMetadata = async function (oMeta, oMetadataOld) {
        var oSettings = {
            TABLE: Tables.metadata,
            PROPERTIES_TO_EXCLUDE: aMetadataReadOnlyProperties.concat([
                'TEXT',
                'ATTRIBUTES',
                'FORMULAS'
            ]),
            GENERATED_PROPERTIES: _.omit(oAuditValues, [
                'CREATED_ON',
                'CREATED_BY'
            ])
        };

        // check if sidepanel has been changed, to generate the display order again
        if (oMeta.SIDE_PANEL_GROUP_ID !== oMetadataOld.SIDE_PANEL_GROUP_ID) {
            _.extend(oSettings.GENERATED_PROPERTIES, that.getDisplayOrder(oMeta, oMetadataOld));
        }

        var aPropertiesToExclude = oSettings.PROPERTIES_TO_EXCLUDE;

        // filter all protected columns, which are not allowed to be updated; also exclude arrays and keeps only properties
        var oUpdateSet = _.omit(oMeta, aPropertiesToExclude);
        var aMetaNames = _.union(_.keys(oUpdateSet), _.keys(oSettings.GENERATED_PROPERTIES));
        var aMetaValues = _.values(oUpdateSet).concat(_.values(oSettings.GENERATED_PROPERTIES));
        var aStmtBuilder = ['update "' + oSettings.TABLE + '" set '];

        _.each(aMetaNames, function (sMetaName, iIndex) {
            aStmtBuilder.push(sMetaName + ' = ?');
            if (iIndex < aMetaNames.length - 1) {
                aStmtBuilder.push(', ');
            }
        });

        aStmtBuilder.push(' where path = ? and business_object = ? and column_id = ?');
        aMetaValues.push(oMeta.PATH, oMeta.BUSINESS_OBJECT, oMeta.COLUMN_ID);

        var updateStmt = hQuery.statement(aStmtBuilder.join(' '));
        await updateStmt.execute(aMetaValues);

        var aMetadataField = that.getMetadataFields(oMeta.PATH, oMeta.BUSINESS_OBJECT, oMeta.COLUMN_ID);

        return aMetadataField[0];
    };

    /**
	 * update or insert texts for a given metadata object in in t_metadata__text table
	 *
	 * @param {object}
	 *            oMeta - each object of the array from request with the properties of the new metadata
	 *
	 * @returns {array} - updated texts
	 */
    this.upsertMetadataText = function (oMeta) {
        var oSettingsText = {
            TABLE: Tables.metadataText,
            GENERATED_PROPERTIES: oAuditValues
        };
        var aTexts = [];

        _.each(oMeta.TEXT, async function (oTextMeta) {
            var aKeyNames = [
                'PATH',
                'COLUMN_ID',
                'LANGUAGE'
            ];
            var aKeyValues = [
                oTextMeta.PATH,
                oTextMeta.COLUMN_ID,
                oTextMeta.LANGUAGE
            ];
            var aMetaNames = aKeyNames.concat([
                'DISPLAY_NAME',
                'DISPLAY_DESCRIPTION'
            ], _.keys(oSettingsText.GENERATED_PROPERTIES));
            var aMetaValues = aKeyValues.concat([
                oTextMeta.DISPLAY_NAME || '',
                oTextMeta.DISPLAY_DESCRIPTION || ''
            ], _.values(oSettingsText.GENERATED_PROPERTIES));

            //check if the display description/name containts the '&' character
            //  -- if that's the case, throw an error informing the user the
            //     character is not allowed
            checkCFTextIsValid(oMeta, aMetaNames, aMetaValues, [
                'DISPLAY_NAME',
                'DISPLAY_DESCRIPTION'
            ]);

            //check if the entry already exited and get the creation date and user
            var oExistingValues = await hQuery.statement('SELECT created_on, created_by ' + ' FROM "' + oSettingsText.TABLE + '"' + ' WHERE path = ? and column_id = ? and language = ?').execute(aKeyValues);

            //if the entry already exists, get the values for CREATED_ON and CREATED_BY fields
            if (oExistingValues.length > 0) {
                oSettingsText.GENERATED_PROPERTIES.CREATED_ON = oExistingValues[0].CREATED_ON;
                oSettingsText.GENERATED_PROPERTIES.CREATED_BY = oExistingValues[0].CREATED_BY;
            }

            //prepare the arrays containing the column names and column values
            var aColumns = [];
            var aValuePlaceholders = [];
            _.each(aMetaNames, function (sMetaName) {
                aColumns.push(sMetaName);
                aValuePlaceholders.push('?');
            });

            //build the upsert statement
            var aStmtBuilder = ['UPSERT "' + oSettingsText.TABLE + '"'];
            aStmtBuilder.push('(' + aColumns.join(', ') + ')');
            aStmtBuilder.push('VALUES (' + aValuePlaceholders.join(', ') + ')');
            aStmtBuilder.push('WHERE path = ? and column_id = ? and language = ?');

            //execute the upsert statement
            var oUpsertStatement = hQuery.statement(aStmtBuilder.join(' '));
            await oUpsertStatement.execute(aMetaValues.concat(aKeyValues));

            aTexts.push(oTextMeta);
        });

        return aTexts;
    };

    /**
	 * update attributes or create attributes in case of new item category id for a given metadata object in in t_metadata_item_attributes table
	 * in case of roll_up_type was changed, attributes must be regenerated
	 *
	 * @param {object}
	 *            oMeta - each object of the array from request with the properties of the new metadata
	 *
	 * @returns {array} - updated texts
	 * @throws {PlcException}
	 *             if the given arguments are of wrong type
	 */
    this.updateMetadataAttributes = function (oMeta, oMetadataOld) {
        var aAttributes = [];
        var oSettingsAttributes = {
            TABLE: Tables.metadataItemAttributes,
            PROPERTIES_TO_EXCLUDE: aMetadataItemAttributeReadOnlyProperties,
            GENERATED_PROPERTIES: _.omit(oAuditValues, [
                'CREATED_ON',
                'CREATED_BY'
            ])
        };
        var aPropertiesToExclude = oSettingsAttributes.PROPERTIES_TO_EXCLUDE;

        // if field is custom and roll-up has changed generate again attributes
        if (oMetadataOld.IS_CUSTOM === 1 && oMeta.ROLLUP_TYPE_ID !== oMetadataOld.ROLLUP_TYPE_ID) {
            _.each(oMeta.ATTRIBUTES, async function (oAttrMeta) {
                var oCheckStatement = hQuery.statement('delete from "' + oSettingsAttributes.TABLE + '" where path = ? and business_object = ? and column_id = ? and item_category_id = ?');
                await oCheckStatement.execute(oAttrMeta.PATH, oAttrMeta.BUSINESS_OBJECT, oAttrMeta.COLUMN_ID, oAttrMeta.ITEM_CATEGORY_ID);
            });
            return that.createAttributes(oMeta);
        }

        _.each(oMeta.ATTRIBUTES, async function (oAttrMeta) {
            // check if attribute exists so need to update values or insert
            var oCheckStatement = hQuery.statement('select count(*) as rowcount from "' + oSettingsAttributes.TABLE + '" where path = ? and business_object = ? and column_id = ? and item_category_id = ?');
            var aAttributesCount = await oCheckStatement.execute(oAttrMeta.PATH, oAttrMeta.BUSINESS_OBJECT, oAttrMeta.COLUMN_ID, oAttrMeta.ITEM_CATEGORY_ID);
            var iAttributesCount = parseInt(aAttributesCount[0].ROWCOUNT, 10);

            if (iAttributesCount > 0) {
                // filter all protected columns, which are not allowed to be updated; also exclude arrays and keeps only properties
                var oUpdateSet = _.omit(oAttrMeta, aPropertiesToExclude);
                var aMetaNames = _.keys(oUpdateSet);
                var aMetaValues = _.values(oUpdateSet);
                var aStmtBuilder = ['update "' + oSettingsAttributes.TABLE + '" set '];
                _.each(aMetaNames, function (sMetaName, iIndex) {
                    aStmtBuilder.push(sMetaName + ' = ?');
                    if (iIndex < aMetaNames.length - 1) {
                        aStmtBuilder.push(', ');
                    }
                });

                aStmtBuilder.push(' where path = ? and business_object = ? and column_id = ? and item_category_id = ?');
                aMetaValues.push(oAttrMeta.PATH, oAttrMeta.BUSINESS_OBJECT, oAttrMeta.COLUMN_ID, oAttrMeta.ITEM_CATEGORY_ID);

                var updateStmt = hQuery.statement(aStmtBuilder.join(' '));
                var iAffectedRows = await updateStmt.execute(aMetaValues);
                if (iAffectedRows === 0) {
                    var oMessageDetails = new MessageDetails();
                    oMessageDetails.addMetadataObjs(oMeta);
                    const sLogMessage = `Metadata attribute entity not found: ${ JSON.stringify(oAttrMeta) }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_ATTRIBUTE_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
                }
                var oSelectStatement = hQuery.statement('select PATH, BUSINESS_OBJECT, COLUMN_ID, ITEM_CATEGORY_ID, SUBITEM_STATE, IS_MANDATORY,' + ' IS_READ_ONLY, IS_TRANSFERABLE, DEFAULT_VALUE, CREATED_ON, CREATED_BY,' + ' LAST_MODIFIED_ON, LAST_MODIFIED_BY from "' + oSettingsAttributes.TABLE + '" where path = ? and business_object = ? and column_id = ? and item_category_id = ?');
                var aAttributesUpdated = await oSelectStatement.execute(oAttrMeta.PATH, oAttrMeta.BUSINESS_OBJECT, oAttrMeta.COLUMN_ID, oAttrMeta.ITEM_CATEGORY_ID);
                _.each(aAttributesUpdated, function (oAttributeUpdated) {
                    aAttributes.push(oAttributeUpdated);
                });
            } else {
                aAttributes = _.union(aAttributes, that.createAttribute(oAttrMeta, oMeta.ROLLUP_TYPE_ID, oMeta.UOM_CURRENCY_FLAG, oMeta.PROPERTY_TYPE));
            }

        });

        return aAttributes;
    };

    /**
	 * validates if formula string is empty and if it is, throws exception mapped to CALCULATIONENGINE_SYNTAX_ERROR_WARNING
	 * adds FORMULA_DESCRIPTION to oFormula required for procedure p_check_formulas
	 *
	 * @param {object}
	 *            oFormula - formula to be validated
	 */
    checkIfFormulaStringIsEmpty = oFormula => {
        if (_.isEmpty(oFormula.FORMULA_STRING) && oFormula.IS_FORMULA_USED === 1) {
            var oMessageDetails = new MessageDetails();
            oFormula.FORMULA_ERROR = 'FORMULA_STRING cannot be empty';
            oMessageDetails.addFormulaObjs(oFormula);
            const sServerMsg = `${ oFormula.FORMULA_ERROR } Please check formula: ${ oFormula.FORMULA_ID }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(FormulaInterpreterError[8], sServerMsg, oMessageDetails);
        }


        if (helpers.isNullOrUndefined(oFormula.FORMULA_DESCRIPTION)) {
            oFormula.FORMULA_DESCRIPTION = null;
        }
    };
















    checkCFTextIsValid = async function (oMeta, aMetaNames, aMetaValues, aKeys) {
        aKeys.forEach(sKey => {
            const iDescriptionPosition = aMetaNames.indexOf(sKey);
            const aIllegalChars = ['&'];
            aIllegalChars.forEach(cIllegalChar => {
                if (aMetaValues[iDescriptionPosition].indexOf(cIllegalChar) !== -1) {
                    var oMessageDetails = new MessageDetails();
                    oMessageDetails.addMetadataObjs(oMeta);
                    const sLogMessage = `The field "${ sKey }" contains one or more unallowed characters.`;
                    throw new PlcException(Code.CUSTOM_FIELDS_TEXT_ERROR, sLogMessage, oMessageDetails);
                }
            });
        });
    };











    this.updateFormulas = async function (oMeta) {
        var oFormulaObj = {};
        var aFormulas = [];




        var aFormulasTriggerIsManualChange = [];

        var oSettingsFormulas = {
            TABLE: Tables.formula,
            PROPERTIES_TO_EXCLUDE: aFormulaReadOnlyProperties,
            GENERATED_PROPERTIES: []
        };
        var aPropertiesToExclude = oSettingsFormulas.PROPERTIES_TO_EXCLUDE;

        _.each(oMeta.FORMULAS, oFormula => {
            checkIfFormulaStringIsEmpty(oFormula);
            var oCheckStatement = hQuery.statement('select FORMULA_ID, PATH, BUSINESS_OBJECT, COLUMN_ID, ITEM_CATEGORY_ID,' + ' IS_FORMULA_USED, FORMULA_STRING, FORMULA_DESCRIPTION from "' + oSettingsFormulas.TABLE + '" where path = ? and business_object = ? and column_id = ? and item_category_id = ?');
            var aFormulaResults = await oCheckStatement.execute(oFormula.PATH, oFormula.BUSINESS_OBJECT, oFormula.COLUMN_ID, oFormula.ITEM_CATEGORY_ID);
            if (aFormulaResults.length > 0) {


                var oUpdateSet = _.omit(oFormula, aPropertiesToExclude);
                var aMetaNames = _.union(_.keys(oUpdateSet), _.keys(oSettingsFormulas.GENERATED_PROPERTIES));
                var aMetaValues = _.values(oUpdateSet).concat(_.values(oSettingsFormulas.GENERATED_PROPERTIES));
                var aStmtBuilder = ['update "' + oSettingsFormulas.TABLE + '" set '];
                _.each(aMetaNames, function (sMetaName, iIndex) {
                    aStmtBuilder.push(sMetaName + ' = ?');
                    if (iIndex < aMetaNames.length - 1) {
                        aStmtBuilder.push(', ');
                    }
                });

                aStmtBuilder.push(' where path = ? and business_object = ? and column_id = ? and item_category_id = ?');
                aMetaValues.push(oFormula.PATH, oFormula.BUSINESS_OBJECT, oFormula.COLUMN_ID, oFormula.ITEM_CATEGORY_ID);

                var updateStmt = hQuery.statement(aStmtBuilder.join(' '));
                var iAffectedRows = await updateStmt.execute(aMetaValues);

                if (iAffectedRows > 1) {
                    var oMessageDetails = new MessageDetails();
                    oMessageDetails.addMetadataObjs(oMeta);
                    const sLogMessage = `Formula entity not found: ${ JSON.stringify(oFormula) }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_FORMULA_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
                }
                aFormulas.push(oFormula);

                if (aFormulaResults[0].IS_FORMULA_USED !== oFormula.IS_FORMULA_USED) {
                    aFormulasTriggerIsManualChange.push(oFormula);
                }
            } else {

                var iFormulaId = that.helper.getNextSequenceID(Sequences.formula);
                oSettingsFormulas.PROPERTIES_TO_EXCLUDE = [];
                _.extend(oSettingsFormulas.GENERATED_PROPERTIES, { 'FORMULA_ID': iFormulaId });
                var oFormulaObj = that.helper.insertNewEntity(oFormula, oSettingsFormulas);
                aFormulas.push(oFormulaObj);

                aFormulasTriggerIsManualChange.push(oFormula);
            }
        });

        if (!helpers.isNullOrUndefined(oMeta.FORMULAS) && !_.isEmpty(oMeta.FORMULAS)) {
            that.validateFormulaString(oMeta.FORMULAS[0]);
        }

        oFormulaObj.FORMULAS = aFormulas;
        oFormulaObj.FORMULAS_TRIGGERS_IS_MANUAL_CHANGE = aFormulasTriggerIsManualChange;

        return oFormulaObj;
    };













    this.remove = async function (oMeta) {
        var sPath = oMeta.PATH;
        var sObject = oMeta.BUSINESS_OBJECT;
        var sColumnId = oMeta.COLUMN_ID;

        var stmt = hQuery.statement('select PATH, BUSINESS_OBJECT, COLUMN_ID, IS_CUSTOM, ROLLUP_TYPE_ID, SIDE_PANEL_GROUP_ID,' + ' DISPLAY_ORDER, TABLE_DISPLAY_ORDER, REF_UOM_CURRENCY_PATH, REF_UOM_CURRENCY_BUSINESS_OBJECT,' + ' REF_UOM_CURRENCY_COLUMN_ID, UOM_CURRENCY_FLAG, SEMANTIC_DATA_TYPE, SEMANTIC_DATA_TYPE_ATTRIBUTES,' + ' PROPERTY_TYPE, IS_IMMUTABLE_AFTER_SAVE, IS_REQUIRED_IN_MASTERDATA, IS_WILDCARD_ALLOWED,' + ' IS_USABLE_IN_FORMULA, RESOURCE_KEY_DISPLAY_NAME, RESOURCE_KEY_DISPLAY_DESCRIPTION,' + ' CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY, VALIDATION_REGEX_ID' + ' from "' + Tables.metadata + '" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ? and IS_CUSTOM = 1');
        var aMetadata = await stmt.execute(sPath, sObject, sColumnId);
        var iRowCount = aMetadata.length;

        if (iRowCount > 0) {
            try {

                if (!helpers.isNullOrUndefined(aMetadata[0].REF_UOM_CURRENCY_PATH) && !helpers.isNullOrUndefined(aMetadata[0].REF_UOM_CURRENCY_BUSINESS_OBJECT) && !helpers.isNullOrUndefined(aMetadata[0].REF_UOM_CURRENCY_COLUMN_ID)) {
                    that.removeUOMRelated(aMetadata[0]);
                }

                stmt = hQuery.statement('delete from "' + Tables.formula + '" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?');
                await stmt.execute(sPath, sObject, sColumnId);

                stmt = hQuery.statement('delete from "' + Tables.metadataText + '" where PATH = ? and COLUMN_ID = ?');
                await stmt.execute(sPath, sColumnId);

                stmt = hQuery.statement('delete from "' + Tables.metadataItemAttributes + '" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?');
                await stmt.execute(sPath, sObject, sColumnId);

                stmt = hQuery.statement('delete from "' + Tables.metadata + '" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?');
                await stmt.execute(sPath, sObject, sColumnId);
            } catch (e) {
                var oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oMeta);
                const sClientMsg = `Error during deleting custom field identified by the ${ sObject } business object and the ${ sColumnId } column. `;
                const sServerMsg = `${ sClientMsg } Error message: ${ e.message || e.msg }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
            }
        } else {
            var oMessageDetails = new MessageDetails();
            const sLogMessage = `Error during deleting custom field identified by the ${ sPath } path ${ sObject } business object and the ${ sColumnId } column. Entity not found.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }
        return iRowCount;
    };






    this.removeLayoutData = function () {

        let stmDeletelayoutColumns = `
			delete 
				from "${ Tables.layout_columns }"
			where (UPPER(PATH), UPPER(BUSINESS_OBJECT), UPPER(COLUMN_ID)) not in
			(
				select
					UPPER(PATH), UPPER(BUSINESS_OBJECT), UPPER(COLUMN_ID)
				from
					"${ Tables.metadata }"
			);
		`;

        let stmDeletelayoutHiddenFields = `
			delete 
				from "${ Tables.layout_hidden_fields }"
			where (UPPER(PATH), UPPER(BUSINESS_OBJECT), UPPER(COLUMN_ID)) not in
			(
				select
					UPPER(PATH), UPPER(BUSINESS_OBJECT), UPPER(COLUMN_ID)
				from
					"${ Tables.metadata }"
			);
		`;

        await dbConnection.executeUpdate(stmDeletelayoutColumns);
        await dbConnection.executeUpdate(stmDeletelayoutHiddenFields);
    };









    this.removeUOMRelated = async function (oMeta) {
        var sPath = oMeta.REF_UOM_CURRENCY_PATH;
        var sObject = oMeta.REF_UOM_CURRENCY_BUSINESS_OBJECT;
        var sColumnId = oMeta.REF_UOM_CURRENCY_COLUMN_ID;

        try {

            var stmt = hQuery.statement('delete from "' + Tables.formula + '" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?');
            await stmt.execute(sPath, sObject, sColumnId);

            stmt = hQuery.statement('delete from "' + Tables.metadataText + '" where PATH = ? and COLUMN_ID = ?');
            await stmt.execute(sPath, sColumnId);

            stmt = hQuery.statement('delete from "' + Tables.metadataItemAttributes + '" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?');
            await stmt.execute(sPath, sObject, sColumnId);

            stmt = hQuery.statement('delete from "' + Tables.metadata + '" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?');
            await stmt.execute(sPath, sObject, sColumnId);
        } catch (e) {
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addMetadataObjs(oMeta);
            const sClientMsg = `Error during deleting UOM referenced by custom field identified by the ${ sPath } path ${ sObject } business object and the ${ sColumnId } column.`;
            const sServerMsg = `${ sClientMsg } Error message: ${ e.message || e.msg }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }
    };







    this.checkIsUsedInCostingSheetFormula = function (customField) {
        var oCheckStatement = `SELECT DISTINCT overhead_row.COSTING_SHEET_OVERHEAD_ID, overhead_row.COSTING_SHEET_OVERHEAD_ROW_ID FROM "${ Tables.costingSheetOverheadRowFormula }" formula, "${ Tables.costingSheetOverheadRow }" overhead_row
								WHERE formula.FORMULA_ID = overhead_row.FORMULA_ID AND
								formula.FORMULA_STRING LIKE_REGEXPR to_nvarchar(?)`;

        var sRegularExpression = '\\$' + customField + '([^0-9a-zA-Z_]|$)';

        return await dbConnection.executeQuery(oCheckStatement, sRegularExpression);
    };






    this.checkIsUsedAsOverheadCustom = function (oMeta) {
        let sColumn = oMeta.COLUMN_ID;
        const oCheckStatement = `SELECT TOP 1 formula.OVERHEAD_CUSTOM FROM "${ Tables.costingSheetOverheadRowFormula }" formula
		                          INNER JOIN "${ Tables.costingSheetOverheadRow }" overhead_row
		                          ON formula.FORMULA_ID = overhead_row.FORMULA_ID 
								  WHERE overhead_row._VALID_TO IS NULL AND formula.OVERHEAD_CUSTOM LIKE ?`;
        return await dbConnection.executeQuery(oCheckStatement, sColumn);
    };







    this.checkIsUsedInFormula = async function (oMeta) {
        var oCheckStatement = hQuery.statement(`select count(*) as rowcount, column_id, path, business_object from "${ Tables.formula }" where formula_string LIKE_REGEXPR to_nvarchar(?) and path = ? and business_object = ? group by column_id, path, business_object`);

        var sRegularExpression = '\\$' + oMeta.COLUMN_ID + '([^0-9a-zA-Z_]|$)';
        var aResults = await oCheckStatement.execute(sRegularExpression, oMeta.PATH, oMeta.BUSINESS_OBJECT);
        return aResults;
    };







    this.updateIsManualField = async function (oFormula) {
        var oUpdateStatement = hQuery.statement('update itemExt set itemExt.' + oFormula.COLUMN_ID + '_IS_MANUAL = ? ' + ' from "' + Tables.itemExt + '" itemExt, "' + Tables.item + '" item ' + ' where item.ITEM_ID = itemExt.ITEM_ID and item.CALCULATION_VERSION_ID = itemExt.CALCULATION_VERSION_ID ' + ' and item.ITEM_CATEGORY_ID = ?');
        var aResults = await oUpdateStatement.execute(oFormula.IS_FORMULA_USED, oFormula.ITEM_CATEGORY_ID);
        return aResults;
    };








    this.updateUnitField = async function (oMetaTriggerUnitChange) {



        let oRefMeta, oUpdateStatement, aResults;
        if (oMetaTriggerUnitChange.UOM_CURRENCY_FLAG === 0 && !helpers.isNullOrUndefinedOrEmpty(oMetaTriggerUnitChange.REF_UOM_CURRENCY_PATH) && !helpers.isNullOrUndefinedOrEmpty(oMetaTriggerUnitChange.REF_UOM_CURRENCY_BUSINESS_OBJECT) && !helpers.isNullOrUndefinedOrEmpty(oMetaTriggerUnitChange.REF_UOM_CURRENCY_COLUMN_ID)) {
            oRefMeta = that.getRefMetadata(oMetaTriggerUnitChange);
        }
        if (!helpers.isNullOrUndefinedOrEmpty(oRefMeta)) {
            let sUpdateStatementItemExt, sUpdateStatementMasterdataExt;
            let aResultsMasterdata = [];
            let aResultsItem = [];

            if (oMetaTriggerUnitChange.PATH === constants.BusinessObjectTypes.Item && oMetaTriggerUnitChange.BUSINESS_OBJECT === constants.BusinessObjectTypes.Item && oRefMeta.PROPERTY_TYPE === 7) {

                sUpdateStatementItemExt = `update itemExt set itemExt.${ oMetaTriggerUnitChange.COLUMN_ID }_UNIT = calcV.REPORT_CURRENCY_ID 
			    						   from "${ Tables.itemExt }" itemExt, "${ Tables.calculationVersion }" calcV, "${ Tables.item }" item 
				                           where item.CALCULATION_VERSION_ID = itemExt.CALCULATION_VERSION_ID
				                           and item.ITEM_ID = itemExt.ITEM_ID
				                           and item.CALCULATION_VERSION_ID = calcV.CALCULATION_VERSION_ID
				                           and item.ITEM_CATEGORY_ID in (select distinct ITEM_CATEGORY_ID from "${ Tables.metadataItemAttributes }" 
                                                                         where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ? ) 
										   and itemExt.${ oMetaTriggerUnitChange.COLUMN_ID }_UNIT IS NULL`;
                aResultsItem = await dbConnection.executeUpdate(sUpdateStatementItemExt, oMetaTriggerUnitChange.PATH, oMetaTriggerUnitChange.BUSINESS_OBJECT, oMetaTriggerUnitChange.COLUMN_ID);
            } else {
                if (_.includes(constants.aCustomFieldMasterdataBusinessObjects, oMetaTriggerUnitChange.BUSINESS_OBJECT)) {
                    let sMasterdataExtTable = masterdataResources[oMetaTriggerUnitChange.BUSINESS_OBJECT].dbobjects.plcExtensionTable;
                    sUpdateStatementMasterdataExt = `update "${ sMasterdataExtTable }" set ${ oMetaTriggerUnitChange.COLUMN_ID }_UNIT = 
			                                        (select distinct DEFAULT_VALUE from "${ Tables.metadataItemAttributes }" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?) 
			                                         where ${ oMetaTriggerUnitChange.COLUMN_ID }_UNIT IS NULL`;
                    aResultsMasterdata = await dbConnection.executeUpdate(sUpdateStatementMasterdataExt, oRefMeta.PATH, oRefMeta.BUSINESS_OBJECT, oRefMeta.COLUMN_ID);
                }
                sUpdateStatementItemExt = `update itemExt set itemExt.${ oMetaTriggerUnitChange.COLUMN_ID }_UNIT = 
			    								(select distinct DEFAULT_VALUE from "${ Tables.metadataItemAttributes }" where PATH= ?
			    								and BUSINESS_OBJECT = ? and COLUMN_ID = ? and ITEM_CATEGORY_ID = item.ITEM_CATEGORY_ID)
											from "${ Tables.itemExt }" itemExt, "${ Tables.item }" item
											where item.CALCULATION_VERSION_ID = itemExt.CALCULATION_VERSION_ID
											and item.ITEM_ID = itemExt.ITEM_ID
											and item.ITEM_CATEGORY_ID in (select distinct ITEM_CATEGORY_ID from "${ Tables.metadataItemAttributes }" 
	                                                                      where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ? ) 
											and itemExt.${ oMetaTriggerUnitChange.COLUMN_ID }_UNIT IS NULL`;
                aResultsItem = await dbConnection.executeUpdate(sUpdateStatementItemExt, constants.BusinessObjectTypes.Item, constants.BusinessObjectTypes.Item, oRefMeta.COLUMN_ID, constants.BusinessObjectTypes.Item, constants.BusinessObjectTypes.Item, oMetaTriggerUnitChange.COLUMN_ID);
            }
            return _.union(aResultsMasterdata, aResultsItem);
        }
    };








    this.updateManualField = async function (oMetaTriggerManualChange) {
        var oUpdateStatement, oUpdateStatementParents, oUpdateStatementChildren, aResults;



        if (oMetaTriggerManualChange.ROLLUP_TYPE_ID === 0) {
            oUpdateStatement = hQuery.statement('update itemExt set itemExt.' + oMetaTriggerManualChange.COLUMN_ID + '_IS_MANUAL = ' + ' CASE WHEN (formula.IS_FORMULA_USED IS NULL OR formula.IS_FORMULA_USED = 0 ) THEN 1 ELSE 0 END,  itemExt.' + oMetaTriggerManualChange.COLUMN_ID + '_CALCULATED = ' + ' CASE WHEN (formula.IS_FORMULA_USED IS NULL OR formula.IS_FORMULA_USED = 0 ) THEN NULL ELSE itemExt.' + oMetaTriggerManualChange.COLUMN_ID + '_CALCULATED END' + ' from "' + Tables.itemExt + '" itemExt inner join "' + Tables.item + '" item ' + ' on item.CALCULATION_VERSION_ID = itemExt.CALCULATION_VERSION_ID and item.ITEM_ID = itemExt.ITEM_ID left outer join ' + '(select DISTINCT IS_FORMULA_USED, ITEM_CATEGORY_ID, PATH,BUSINESS_OBJECT,COLUMN_ID from "' + Tables.formula + '" ) formula on item.ITEM_CATEGORY_ID = formula.ITEM_CATEGORY_ID ' + ' and formula.PATH = ? and formula.BUSINESS_OBJECT = ? and formula.COLUMN_ID = ? where item.ITEM_CATEGORY_ID in (select distinct ITEM_CATEGORY_ID from "' + Tables.metadataItemAttributes + '" where PATH=? and BUSINESS_OBJECT=? and COLUMN_ID=? ) ');
            aResults = await oUpdateStatement.execute(oMetaTriggerManualChange.PATH, oMetaTriggerManualChange.BUSINESS_OBJECT, oMetaTriggerManualChange.COLUMN_ID, oMetaTriggerManualChange.PATH, oMetaTriggerManualChange.BUSINESS_OBJECT, oMetaTriggerManualChange.COLUMN_ID);
            return aResults;
        } else {

            oUpdateStatementParents = hQuery.statement('update itemExt set itemExt.' + oMetaTriggerManualChange.COLUMN_ID + '_MANUAL = null,  itemExt.' + oMetaTriggerManualChange.COLUMN_ID + '_IS_MANUAL = 0 ' + ' from "' + Tables.itemExt + '" itemExt, "' + Tables.item + '" item ' + ' where item.CALCULATION_VERSION_ID = itemExt.CALCULATION_VERSION_ID ' + ' and item.ITEM_ID = itemExt.ITEM_ID ' + ' and item.ITEM_CATEGORY_ID in (select distinct ITEM_CATEGORY_ID from "' + Tables.metadataItemAttributes + '" where PATH=? and BUSINESS_OBJECT=? and COLUMN_ID=? ) ' + ' and (item.ITEM_ID, item.calculation_version_id) in (select distinct PARENT_ITEM_ID, calculation_version_id from "' + Tables.item + '" where PARENT_ITEM_ID is not null ) ');
            var aResultsParents = await oUpdateStatementParents.execute(oMetaTriggerManualChange.PATH, oMetaTriggerManualChange.BUSINESS_OBJECT, oMetaTriggerManualChange.COLUMN_ID);







            oUpdateStatementChildren = hQuery.statement('update itemExt set itemExt.' + oMetaTriggerManualChange.COLUMN_ID + '_IS_MANUAL =  CASE WHEN (formula.IS_FORMULA_USED IS NULL OR formula.IS_FORMULA_USED = 0 ) THEN 1 ELSE 0 END ' + ' from "' + Tables.itemExt + '" itemExt inner join "' + Tables.item + '" item ' + ' on item.CALCULATION_VERSION_ID = itemExt.CALCULATION_VERSION_ID and item.ITEM_ID = itemExt.ITEM_ID left outer join ' + '(select DISTINCT IS_FORMULA_USED, ITEM_CATEGORY_ID, PATH,BUSINESS_OBJECT,COLUMN_ID from "' + Tables.formula + '" ) formula on item.ITEM_CATEGORY_ID = formula.ITEM_CATEGORY_ID ' + ' and formula.PATH = ? and formula.BUSINESS_OBJECT = ? and formula.COLUMN_ID = ? where item.ITEM_CATEGORY_ID in (select distinct ITEM_CATEGORY_ID from "' + Tables.metadataItemAttributes + '" where PATH=? and BUSINESS_OBJECT=? and COLUMN_ID=? ) ' + ' and (item.ITEM_ID, item.calculation_version_id) not in (select distinct PARENT_ITEM_ID, calculation_version_id from "' + Tables.item + '" where PARENT_ITEM_ID is not null ) ');

            var aResultsChildren = await oUpdateStatementChildren.execute(oMetaTriggerManualChange.PATH, oMetaTriggerManualChange.BUSINESS_OBJECT, oMetaTriggerManualChange.COLUMN_ID, oMetaTriggerManualChange.PATH, oMetaTriggerManualChange.BUSINESS_OBJECT, oMetaTriggerManualChange.COLUMN_ID);
            aResults = _.union(aResultsParents, aResultsChildren);
            return aResults;
        }
    };









    this.updateManualFieldForStandardFields = function (oMetaStandardField) {


        const sUpdateStatement = `update item 
			set item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } = 1
			from "sap.plc.db::basis.t_item" item
			inner join "sap.plc.db::basis.t_metadata_item_attributes" attr
				on item.item_category_id = attr.item_category_id
					and attr.PATH = ? and attr.BUSINESS_OBJECT = ? and attr.COLUMN_ID = ?
			inner join "sap.plc.db::basis.t_metadata" metadata
			    on attr.PATH = metadata.PATH and attr.BUSINESS_OBJECT =  metadata.BUSINESS_OBJECT and attr.COLUMN_ID = metadata.COLUMN_ID
				    and metadata.ROLLUP_TYPE_ID <> 100
			left outer join "sap.plc.db::basis.t_formula" formula
				on item.ITEM_CATEGORY_ID = formula.ITEM_CATEGORY_ID
					and formula.PATH = attr.path and formula.BUSINESS_OBJECT = attr.business_object
					and formula.COLUMN_ID = attr.column_id
			where (formula.IS_FORMULA_USED IS NULL OR formula.IS_FORMULA_USED = 0) and
				(item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } = 0
				or item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } is null)`;
        const aResults = await dbConnection.executeUpdate(sUpdateStatement, oMetaStandardField.PATH, oMetaStandardField.BUSINESS_OBJECT, oMetaStandardField.COLUMN_ID);


        const sUpdateStatementParents = `update item 
			set item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } = 0
			from "sap.plc.db::basis.t_item" item
			inner join "sap.plc.db::basis.t_item" childitem
                on item.item_id = childitem.parent_item_id and item.calculation_version_id = childitem.calculation_version_id
			inner join "sap.plc.db::basis.t_metadata_item_attributes" attr
				on item.item_category_id = attr.item_category_id
					and attr.PATH = ? and attr.BUSINESS_OBJECT = ? and attr.COLUMN_ID = ?
			inner join "sap.plc.db::basis.t_metadata" metadata
			    on attr.PATH = metadata.PATH and attr.BUSINESS_OBJECT = metadata.BUSINESS_OBJECT
				    and attr.COLUMN_ID = metadata.COLUMN_ID and metadata.ROLLUP_TYPE_ID = 100
			where (item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } = 1
				or item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } is null)`;

        const aResultsParents = await dbConnection.executeUpdate(sUpdateStatementParents, oMetaStandardField.PATH, oMetaStandardField.BUSINESS_OBJECT, oMetaStandardField.COLUMN_ID);


        const sUpdateStatementChildren = `update item 
			set item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } = 1
			from "sap.plc.db::basis.t_item" item
			left join "sap.plc.db::basis.t_item" childitem
                on item.item_id = childitem.parent_item_id and item.calculation_version_id = childitem.calculation_version_id
			inner join "sap.plc.db::basis.t_metadata_item_attributes" attr
				on item.item_category_id = attr.item_category_id
					and attr.PATH = ? and attr.BUSINESS_OBJECT = ? and attr.COLUMN_ID = ?
			inner join "sap.plc.db::basis.t_metadata" metadata
			    on attr.PATH = metadata.PATH and attr.BUSINESS_OBJECT =  metadata.BUSINESS_OBJECT and attr.COLUMN_ID = metadata.COLUMN_ID
				    and metadata.ROLLUP_TYPE_ID = ?
			left outer join "sap.plc.db::basis.t_formula" formula
				on item.ITEM_CATEGORY_ID = formula.ITEM_CATEGORY_ID
					and formula.PATH = attr.path and formula.BUSINESS_OBJECT = attr.business_object
					and formula.COLUMN_ID = attr.column_id
			where (formula.IS_FORMULA_USED IS NULL OR formula.IS_FORMULA_USED = 0) and childitem.item_id is null and
				(item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } = 0
				or item.${ MapStandardFieldsWithFormulas.get(oMetaStandardField.COLUMN_ID) } is null)`;
        const aResultsChildren = await dbConnection.executeUpdate(sUpdateStatementChildren, oMetaStandardField.PATH, oMetaStandardField.BUSINESS_OBJECT, oMetaStandardField.COLUMN_ID, 100);

        return _.union(aResults, _.union(aResultsParents, aResultsChildren));
    };








    this.updateFieldWithDefaultValue = oMetaTriggerChange => {
        let sUpdateStatementItemExt = `update itemExt set`;
        let sUpdateStatementMasterdataExt;
        let aResultsMasterdata = [];
        let sPath = oMetaTriggerChange.PATH;
        let sBusinessObject = oMetaTriggerChange.BUSINESS_OBJECT;

        if (oMetaTriggerChange.PATH === constants.BusinessObjectTypes.Item && oMetaTriggerChange.BUSINESS_OBJECT === constants.BusinessObjectTypes.Item) {
            sUpdateStatementItemExt += ` itemExt.${ oMetaTriggerChange.COLUMN_ID }_IS_MANUAL = IFNULL(itemExt.${ oMetaTriggerChange.COLUMN_ID }_IS_MANUAL, 1),`;
        } else {
            let sMasterdataExtTable = masterdataResources[oMetaTriggerChange.BUSINESS_OBJECT].dbobjects.plcExtensionTable;
            sPath = constants.BusinessObjectTypes.Item;
            sBusinessObject = constants.BusinessObjectTypes.Item;
            if (_.includes(constants.aCustomFieldMasterdataBusinessObjects, oMetaTriggerChange.BUSINESS_OBJECT)) {
                sUpdateStatementMasterdataExt = `update "${ sMasterdataExtTable }" set ${ oMetaTriggerChange.COLUMN_ID }_MANUAL = 
		                                        (select distinct DEFAULT_VALUE from "${ Tables.metadataItemAttributes }" where PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ?) 
		                                         where ${ oMetaTriggerChange.COLUMN_ID }_MANUAL IS NULL`;
                aResultsMasterdata = await dbConnection.executeUpdate(sUpdateStatementMasterdataExt, oMetaTriggerChange.PATH, oMetaTriggerChange.BUSINESS_OBJECT, oMetaTriggerChange.COLUMN_ID);
            }
        }
        sUpdateStatementItemExt += ` itemExt.${ oMetaTriggerChange.COLUMN_ID }_MANUAL = (select distinct DEFAULT_VALUE from  "${ Tables.metadataItemAttributes }" where PATH = ? 
                                    and BUSINESS_OBJECT = ? and COLUMN_ID = ? and ITEM_CATEGORY_ID = item.ITEM_CATEGORY_ID )
				                    from "${ Tables.itemExt }" itemExt, "${ Tables.item }" item
				                    where item.CALCULATION_VERSION_ID = itemExt.CALCULATION_VERSION_ID
				                    and item.ITEM_ID = itemExt.ITEM_ID
				                    and item.ITEM_CATEGORY_ID in (select distinct ITEM_CATEGORY_ID from "${ Tables.metadataItemAttributes }" where PATH= ? and BUSINESS_OBJECT= ? and COLUMN_ID= ?) 
				                    and itemExt.${ oMetaTriggerChange.COLUMN_ID }_MANUAL IS NULL`;

        const aResultsItem = await dbConnection.executeUpdate(sUpdateStatementItemExt, sPath, sBusinessObject, oMetaTriggerChange.COLUMN_ID, sPath, sBusinessObject, oMetaTriggerChange.COLUMN_ID);
        return _.union(aResultsMasterdata, aResultsItem);
    };







    this.copyItemsToItemExt = function () {
        const sInsertStatementItemExt = `insert into "${ Tables.itemExt }" (CALCULATION_VERSION_ID, ITEM_ID) 
									        select CALCULATION_VERSION_ID, ITEM_ID from "${ Tables.item }"
									        	where (CALCULATION_VERSION_ID, ITEM_ID) not in 
									        	(select  CALCULATION_VERSION_ID, ITEM_ID from "${ Tables.itemExt }")`;
        const aResults = await dbConnection.executeUpdate(sInsertStatementItemExt);
        return aResults;
    };






    this.copyMasterdataToMasterdataExt = sBusinessObject => {
        const sMasterdataTable = masterdataResources[sBusinessObject].dbobjects.plcTable;
        const sMasterdataExtTable = masterdataResources[sBusinessObject].dbobjects.plcExtensionTable;
        let aKeyFields = masterdataResources[sBusinessObject].configuration.aKeyColumns;
        aKeyFields = _.union(aKeyFields, ['_VALID_FROM']);

        const sInsertStatementMasterdataExt = `insert into "${ sMasterdataExtTable }" (${ aKeyFields.join(', ') }) 
		                                       select ${ aKeyFields.join(', ') } from "${ sMasterdataTable }"
				                               where (${ aKeyFields.join(', ') }) not in (select  ${ aKeyFields.join(', ') } from "${ sMasterdataExtTable }")`;
        const aResults = await dbConnection.executeUpdate(sInsertStatementMasterdataExt);
        return aResults;
    };







    this.validateFormulaString = async function (oFormula) {

        var dbConnection = await that.getConnection();
        var checkFormulaProcedure = dbConnection.loadProcedure(Procedures.checkFormula);

        var result = checkFormulaProcedure();

        if (_.isArray(result.ERRORS) && result.ERRORS.length > 0) {
            var formulaUsed = {};
            var arrayOfErrors = [];
            formulaUsed.COLUMN_ID = oFormula.COLUMN_ID;
            formulaUsed.PATH = oFormula.PATH;
            formulaUsed.BUSINESS_OBJECT = oFormula.BUSINESS_OBJECT;
            formulaUsed.FORMULA_ERROR = JSON.parse('{' + result.ERRORS[0].ERROR_DETAILS.replace(/'/g, '"') + '}');

            var oMessageDetails = new MessageDetails();
            oMessageDetails.addFormulaObjs(formulaUsed);


            for (let key in formulaUsed.FORMULA_ERROR) {
                if (formulaUsed.FORMULA_ERROR.hasOwnProperty(key)) {
                    arrayOfErrors.push(`'${ key }' = '${ formulaUsed.FORMULA_ERROR[key] }'`);
                }
            }
            ;
            var resultingErrors = arrayOfErrors.join(',');

            const sLogMessage = `Formula string has errors ${ oFormula.FORMULA_STRING } , see details ${ resultingErrors }`;
            $.trace.error(sLogMessage);
            throw new PlcException(FormulaInterpreterError[result.ERRORS[0].ERROR_CODE], sLogMessage, oMessageDetails);
        }
        return result;
    };




    this.getConnection = async function () {
        return await hQuery.getConnection();
    };




    this.createDeleteAndGenerate = async function () {
        var oDBController = await new DbArtefactController($, await that.getConnection());
        oDBController.generateAllFilesExt();
    };




    this.setTransactionAutocommitDDLOff = async function () {
        var connection = await this.getConnection();
        connection.executeUpdate('SET TRANSACTION AUTOCOMMIT DDL off');
    };













    this.getRollupCustomFieldsWithoutFormulas = async function (sPath, sBusinessObject, iItemCategory) {

        var aFieldsWithRollup = [];
        var oStatement = hQuery.statement('select distinct meta.column_id ' + ' from "' + Tables.metadata + '" as meta ' + ' inner join "' + Tables.metadataItemAttributes + '" as attr ' + ' on meta.business_object = attr.business_object ' + ' and meta.path = attr.path ' + ' and meta.column_id = attr.column_id ' + ' where meta.path = ? and meta.business_object = ? and meta.is_custom=1 ' + ' and (meta.uom_currency_flag IS NULL or meta.uom_currency_flag <> 1) ' + ' and meta.rollup_type_id <> 0 and attr.item_category_id = ? ' + ' minus ' + ' select distinct meta.column_id ' + ' from "' + Tables.metadata + '" as meta ' + ' inner join "' + Tables.formula + '" as formula ' + ' on meta.path=formula.path ' + ' and meta.business_object=formula.business_object ' + ' and meta.column_id=formula.column_id ' + ' where meta.path = ? and meta.business_object = ? and meta.is_custom=1 ' + ' and (meta.uom_currency_flag IS NULL or meta.uom_currency_flag <> 1 ) ' + ' and formula.is_formula_used = 1 and meta.rollup_type_id <> 0 and formula.item_category_id = ? ');

        aFieldsWithRollup = await oStatement.execute(sPath, sBusinessObject, iItemCategory, sPath, sBusinessObject, iItemCategory);

        return aFieldsWithRollup;
    };




    this.generateAllFiles = async function () {
        var oDBController = await new DbArtefactController($, await that.getConnection());
        oDBController.generateAllFiles();
    };








    this.getMetadata = function (aBody) {

        var query = 'select PATH, BUSINESS_OBJECT, COLUMN_ID from "' + Tables.metadata + '"';
        if (aBody.length > 0) {
            query += ' where ';
            _.each(aBody, function (oBody, iIndex) {
                query += "(upper(PATH) = upper('" + oBody.PATH + "') and BUSINESS_OBJECT = '" + oBody.BUSINESS_OBJECT + "' and COLUMN_ID = '" + oBody.COLUMN_ID + "')";
                if (iIndex < aBody.length - 1) {
                    query += ' or ';
                }
            });
        }
        return await dbConnection.executeQuery(query);
    };





    this.getAllCustomFieldsNamesAsArray = function () {
        const aAllCustomFields = [];
        const sStmt = `select column_id from "${ Tables.metadata }"
						where path = ? and business_object = ?
						and is_custom = 1 and (uom_currency_flag IS NULL or uom_currency_flag <> 1)
						and column_id LIKE_REGEXPR '^(CUST|CAPR|CWCE|CMPR|CMPL|CMAT|CCEN)_[A-Z][A-Z0-9_]*$'
						order by column_id`;

        const oQueryResult = await dbConnection.executeQuery(sStmt, BusinessObjectTypes.Item, BusinessObjectTypes.Item);
        const aMetadataFields = Array.from(oQueryResult);

        _.each(aMetadataFields, function (oMetadataField, iIndex) {
            aAllCustomFields.push(oMetadataField.COLUMN_ID + '_MANUAL');
            if (oMetadataField.COLUMN_ID.startsWith('CUST_')) {
                aAllCustomFields.push(oMetadataField.COLUMN_ID + '_CALCULATED');
                aAllCustomFields.push(oMetadataField.COLUMN_ID + '_IS_MANUAL');
            }
            aAllCustomFields.push(oMetadataField.COLUMN_ID + '_UNIT');
        });
        return aAllCustomFields;
    };





    this.checkIfFormulaContainsString = function (sString) {
        const sStmt = `select formula_id from "${ Tables.formula }"
						where formula_string like '%${ sString }%'`;

        return await dbConnection.executeQuery(sStmt).length > 0;
    };









    this.createCustomFieldEntriesForReplicationTool = function (aCustomFieldsToCreate) {
        if (aCustomFieldsToCreate.length > 0) {
            let aColumnNames = aCustomFieldsToCreate.map(o => o.COLUMN_ID);
            let sColumns = "'" + aColumnNames.join("','") + "'";
            let sCustomFieldMasterdataBusinessObjects = "'" + constants.aCustomFieldMasterdataBusinessObjects.join("','") + "'";
            let sInsertStmt = `
				INSERT INTO "${ Tables.field_mapping }" ("ID", "TABLE_NAME", "COLUMN_NAME", "IS_PK", "IS_MANDATORY", "IS_NULLABLE", "VALIDATION_REGEX", "FIELD_TYPE", "FIELD_ORDER", "IS_CUSTOM", "IS_UPPERCASE", "LENGTH", "SCALE", "PRECISION")
				SELECT 
					"${ Sequences.field_mapping }".NEXTVAL AS "ID",
					CONCAT('t_', LOWER("BUSINESS_OBJECT")) AS "TABLE_NAME",
					CONCAT("COLUMN_ID", '_MANUAL') AS "COLUMN_NAME",
					0 AS "IS_PK",
                    0 AS "IS_MANDATORY",
                    1 AS "IS_NULLABLE",
                    "VALIDATION_REGEX_ID" AS "VALIDATION_REGEX",
                    UPPER("SEMANTIC_DATA_TYPE") AS "FIELD_TYPE",
                    "DISPLAY_ORDER" AS "FIELD_ORDER",
                    "IS_CUSTOM",
                    0 AS "IS_UPPERCASE",
                    CASE
                        WHEN UPPER("SEMANTIC_DATA_TYPE") = 'LINK'
                            THEN 2000
                        WHEN UPPER("SEMANTIC_DATA_TYPE") = 'STRING'
                            THEN 5000
                        ELSE NULL
                    END AS "LENGTH",
                    CASE
                        WHEN UPPER("SEMANTIC_DATA_TYPE") = 'DECIMAL'
                            THEN 28
                        ELSE NULL
                    END AS "SCALE",
                    CASE
                        WHEN UPPER("SEMANTIC_DATA_TYPE") = 'DECIMAL'
                            THEN 7
                        ELSE NULL
					END AS "PRECISION"
				FROM "${ Tables.metadata }" WHERE "COLUMN_ID" IN (${ sColumns }) AND  "UOM_CURRENCY_FLAG" = 0 
						AND "PATH" IN (${ sCustomFieldMasterdataBusinessObjects })
						AND "BUSINESS_OBJECT" IN (${ sCustomFieldMasterdataBusinessObjects });
			`;

            let sInsertUnitsStmt = `
				INSERT INTO "${ Tables.field_mapping }" ("ID", "TABLE_NAME", "COLUMN_NAME", "IS_PK", "IS_MANDATORY", "IS_NULLABLE", "VALIDATION_REGEX", "FIELD_TYPE", "FIELD_ORDER", "IS_CUSTOM", "IS_UPPERCASE", "LENGTH", "SCALE", "PRECISION")
				SELECT 
					"${ Sequences.field_mapping }".NEXTVAL AS "ID",
					CONCAT('t_', LOWER("BUSINESS_OBJECT")) AS "TABLE_NAME",
					CONCAT("COLUMN_ID", '_UNIT') AS "COLUMN_NAME",
					0 AS "IS_PK",
                    0 AS "IS_MANDATORY",
                    1 AS "IS_NULLABLE",
                    "VALIDATION_REGEX_ID" AS "VALIDATION_REGEX",
                    'STRING' AS "FIELD_TYPE",
                    "DISPLAY_ORDER" AS "FIELD_ORDER",
                    "IS_CUSTOM",
                    0 AS "IS_UPPERCASE",
                    3 AS "LENGTH",
                    NULL AS "SCALE",
                    NULL AS "PRECISION"
				FROM "${ Tables.metadata }" WHERE "COLUMN_ID" IN (${ sColumns }) AND "UOM_CURRENCY_FLAG" = 0 
						AND "PATH" IN (${ sCustomFieldMasterdataBusinessObjects })
						AND "BUSINESS_OBJECT" IN (${ sCustomFieldMasterdataBusinessObjects })
						AND UPPER("SEMANTIC_DATA_TYPE") = 'DECIMAL';

			`;

            await dbConnection.executeUpdate(sInsertStmt);
            await dbConnection.executeUpdate(sInsertUnitsStmt);

        }
    };





    this.deleteCustomFieldEntriesFromReplicationTool = function (aCustomFieldsToDelete) {
        if (aCustomFieldsToDelete.length > 0) {
            let aConditionsForDelete = [];
            let sFieldMappingDeleteStmt = `delete from "${ Tables.field_mapping }" where `;




            aCustomFieldsToDelete.forEach(oCustomField => {
                let sColumnNameManual = oCustomField.COLUMN_ID + '_MANUAL';
                let sColumnNameUnit = oCustomField.COLUMN_ID + '_UNIT';
                let sDestinationEntity = BusinessObjectTables.get(oCustomField.BUSINESS_OBJECT);
                aConditionsForDelete.push(`("TABLE_NAME" = '${ sDestinationEntity }' and "COLUMN_NAME" in ('${ sColumnNameManual }', '${ sColumnNameUnit }'))`);
            });
            let sConcatenatedConditions = aConditionsForDelete.join(' or ');
            sFieldMappingDeleteStmt += sConcatenatedConditions + ';';
            await dbConnection.executeUpdate(sFieldMappingDeleteStmt);
        }
    };

}

module.exports.Tables = Tables;
module.exports.Procedures = Procedures;
module.exports.Metadata = Metadata;
export default {helpers,_,constants,masterdataResources,MapStandardFieldsWithFormulas,Helper,DbArtefactController,MessageLibrary,PlcException,MasterDataObjectTypes,Code,MessageDetails,FormulaInterpreterError,BusinessObjectTypes,Sequences,Tables,Procedures,BusinessObjectTables,aMetadataReadOnlyProperties,aMetadataItemAttributeReadOnlyProperties,aFormulaReadOnlyProperties,Metadata};
