const sLayoutColumnTable = "sap.plc.db::basis.t_layout_column";
const sLayoutHiddenFieldTable = "sap.plc.db::basis.t_layout_hidden_field";
const _ = $.require("lodash");
var oConnection = null;

const aRenamedColumns = [
    ["BUSINESS_PROCESS_ID", "PROCESS_ID"],
    ["CREATED_AT", "CREATED_ON"],
    ["LAST_MODIFIED_AT", "LAST_MODIFIED_ON"],
    ["LAST_MODIFIED_BY_USER_ID", "LAST_MODIFIED_BY"],
    ["CREATED_BY_USER_ID", "CREATED_BY"],
    ["_CREATED_BY_USER_ID", "_CREATED_BY"],
    ["_CREATED_BY_USER_ID_FIRST_VERSION", "_CREATED_BY_FIRST_VERSION"],
    ["IF_AN_AGGREGATE", "SUBITEM_STATE"],
    ["OVERHEAD_PRICE_UOM_ID", "OVERHEAD_PRICE_UNIT_UOM_ID"],
    ["LABORATORY_DESIGN_OFFICE_ID", "DESIGN_OFFICE_ID"],
    ["PRICE_APPLIED_SURCHARGE", "SURCHARGE"],
    ["PRICE_SOURCE_TYPE", "PRICE_SOURCE_TYPE_ID"],
    ["PRICE_TRANSACTION_CURRENCY_ID", "TRANSACTION_CURRENCY_ID"],
    ["QUANTITY_DEPENDENCY_MODE", "TOTAL_QUANTITY_DEPENDS_ON"],
    ["QUANTITY_FOR_ONE_ASSEMBLY", "QUANTITY"],
    ["QUANTITY_FOR_ONE_ASSEMBLY_UOM_ID", "QUANTITY_UOM_ID"],
    ["QUANTITY_FOR_ONE_ASSEMBLY_CALCULATED", "QUANTITY_CALCULATED"],
    ["QUANTITY_FOR_ONE_ASSEMBLY_IS_MANUAL", "QUANTITY_IS_MANUAL"],
    ["IS_AN_AGGREGATION", "HAS_SUBITEMS"],
    ["IS_ROLLED_UP", "IS_ROLLED_UP_VALUE"],
    ["COSTING_LOT_SIZE", "LOT_SIZE"],
    ["COSTING_LOT_SIZE_CALCULATED", "LOT_SIZE_CALCULATED"],
    ["COSTING_LOT_SIZE_IS_MANUAL", "LOT_SIZE_IS_MANUAL"],
    ["MATERIAL_COSTING_LOT_SIZE", "MATERIAL_LOT_SIZE"],
    ["MATERIAL_COSTING_LOT_SIZE_UOM_ID", "MATERIAL_LOT_SIZE_UOM_ID"],
    ["LAST_SAVED_AT", "LAST_MODIFIED_ON"],
    ["LAST_SAVED_BY_USER_ID", "LAST_MODIFIED_BY"]
];

const aRenamedBusinessObjects = [
    ["Account_Group_Cost_Component", "Component_Split_Account_Group"],
    ["Business_Process", "Process"],
    ["Material_Account", "Material_Account_Determination"],
    ["Laboratory_Design_Office", "Design_Office"],
];

const aRenamedPaths = [
    "Account_Group_Cost_Component",
    "Business_Process",
    "Material_Account",
    "Laboratory_Design_Office",
];
const mRenamedColumns = new Map(aRenamedColumns);
const mRenamedBusinessObjects = new Map(aRenamedBusinessObjects);

function check(oCurrentConnection){
    try{
        oConnection = $.hdb.getConnection({"sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC" : true});
        return true;
    } catch(e) {
        throw(e);
    }
}

/**
 * Adapts COLUMN_ID, PATH, BUSINESS_OBJECT for each layout if it contains values modified by the data model change
 * Return an array that contains only the layouts that needed adaptions
 * If the layouts are from the table t_layout_hidden_field, with the adapted layout will be kept also the old keys (BUSINESS_OBJECT, COLUMN_ID, PATH)
 * in order to be used for update conditions
 * @param {array}
 *               aDatabaseLayouts - layouts found in the database
 * @param {bool}
 *               [isHiddenField] - flag used to differentiate between t_layout_column and t_layout_hidden_field
 *               default value = false
 */
function adaptLayout(aDatabaseLayouts, isHiddenField = false) {
    const aLayoutsAdapted = [];
    aDatabaseLayouts.forEach((oLayoutColumn) => {
        const oLayoutColumnAdapted = JSON.parse(JSON.stringify(oLayoutColumn));
        oLayoutColumnAdapted.BUSINESS_OBJECT = mRenamedBusinessObjects.get(oLayoutColumn.BUSINESS_OBJECT) || oLayoutColumn.BUSINESS_OBJECT;
        oLayoutColumnAdapted.COLUMN_ID = mRenamedColumns.get(oLayoutColumn.COLUMN_ID) || oLayoutColumn.COLUMN_ID;
        if (oLayoutColumn.PATH) {
            aRenamedPaths.forEach((sRenamedPath) => {
                oLayoutColumnAdapted.PATH = oLayoutColumnAdapted.PATH.replace(sRenamedPath.toUpperCase(), mRenamedBusinessObjects.get(sRenamedPath).toUpperCase());
            });
        }
        if (!_.isEqual(oLayoutColumnAdapted, oLayoutColumn)) {
            if (isHiddenField) {
                oLayoutColumnAdapted.OLD_BUSINESS_OBJECT = oLayoutColumn.BUSINESS_OBJECT;
                oLayoutColumnAdapted.OLD_COLUMN_ID = oLayoutColumn.COLUMN_ID;
                oLayoutColumnAdapted.OLD_PATH = oLayoutColumn.PATH;
            }
            aLayoutsAdapted.push(oLayoutColumnAdapted);
        }
    });
    return aLayoutsAdapted;
}
/**
 * Create and execute a bulk update statement for the table t_layout_column
 */
function updateLayoutColumn(oConnection, aLayoutColumnsAdapted, sCurrentSchema) {
    const sUpdateStatement = ` update "${sCurrentSchema}"."${sLayoutColumnTable}" 
                        set PATH = ?, BUSINESS_OBJECT = ?, COLUMN_ID = ?
                        where LAYOUT_ID = ? and DISPLAY_ORDER = ? `;

    const aValues = [];
    aLayoutColumnsAdapted.forEach((oLayout) => {
        const aLayoutValues = [];
        aLayoutValues.push(oLayout.PATH);
        aLayoutValues.push(oLayout.BUSINESS_OBJECT);
        aLayoutValues.push(oLayout.COLUMN_ID);
        aLayoutValues.push(oLayout.LAYOUT_ID);
        aLayoutValues.push(oLayout.DISPLAY_ORDER);
        aValues.push(aLayoutValues);
    });
    oConnection.executeUpdate(sUpdateStatement, aValues);
}

/**
 * Create and execute a bulk update statement for the table t_layout_hidden_field
 */
function updateLayoutHiddenField(oConnection, aLayoutHiddenFieldsAdapted, sCurrentSchema) {
    const sUpdateStatement = ` update "${sCurrentSchema}"."${sLayoutHiddenFieldTable}" 
                        set PATH = ?, BUSINESS_OBJECT = ?, COLUMN_ID = ?
                        where LAYOUT_ID = ? and PATH = ? and BUSINESS_OBJECT = ? and COLUMN_ID = ? `;

    const aValues = [];
    aLayoutHiddenFieldsAdapted.forEach((oLayout) => {
        const aLayoutValues = [];
        aLayoutValues.push(oLayout.PATH);
        aLayoutValues.push(oLayout.BUSINESS_OBJECT);
        aLayoutValues.push(oLayout.COLUMN_ID);
        aLayoutValues.push(oLayout.LAYOUT_ID);
        aLayoutValues.push(oLayout.OLD_PATH);
        aLayoutValues.push(oLayout.OLD_BUSINESS_OBJECT);
        aLayoutValues.push(oLayout.OLD_COLUMN_ID);
        aValues.push(aLayoutValues);
    });
    oConnection.executeUpdate(sUpdateStatement, aValues);
}

function run(oCurrentConnection) {
    // Adaptions for t_layout_column
    const sCurrentSchema = getCurrentSchema(oCurrentConnection);
    const aDatabaseLayoutColumns = Array.from(oCurrentConnection.executeQuery(`select LAYOUT_ID, DISPLAY_ORDER, PATH, BUSINESS_OBJECT, COLUMN_ID
                                                                                    from "${sCurrentSchema}"."${sLayoutColumnTable}"`));
    const aLayoutColumnsAdapted = adaptLayout(aDatabaseLayoutColumns);
    if (aLayoutColumnsAdapted.length > 0) {
        updateLayoutColumn(oCurrentConnection, aLayoutColumnsAdapted, sCurrentSchema);
    }

    // Adaptions for t_layout_hidden_field
    const aDatabaseLayoutHiddenFields = Array.from(oCurrentConnection.executeQuery(`select LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID
                                                                                         from "${sCurrentSchema}"."${sLayoutHiddenFieldTable}"`));
    const isHiddenField = true;
    const aLayoutHiddenFieldsAdapted = adaptLayout(aDatabaseLayoutHiddenFields, isHiddenField);
    if (aLayoutHiddenFieldsAdapted.length > 0) {
        updateLayoutHiddenField(oCurrentConnection, aLayoutHiddenFieldsAdapted, sCurrentSchema);
    }
    return true;
}

function getCurrentSchema(oCurrentConnection) {
    return oCurrentConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
}

function closeSqlConnection(oConnection) {
    if (oConnection.close) {
        oConnection.close();
    }
}

function clean(oCurrentConnection) {
    closeSqlConnection(oConnection)
    return true;
}
