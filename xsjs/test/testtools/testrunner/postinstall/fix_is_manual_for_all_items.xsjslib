/* eslint-disable no-unused-vars */
const whoAmI = "testtools.testrunner.postinstall.fix_is_manual_for_all_items";
const trace = $.import("xs.xslib", "trace");
const PersistencyMetadata = $.require("../../../../lib/xs/db/persistency-metadata").Metadata;
const MapStandardFieldsWithFormulas = $.require("../../../../lib/xs/util/constants").mapStandardFieldsWithFormulas;

function check(oConnection) {
    return true;
}

function run(oConnection) {
    function processResult(result) {
        const mCustomFields = {};
        Object.keys(result).forEach((row) => {
            let aCustomField = mCustomFields[result[row].COLUMN_ID];
            if (typeof aCustomField === "undefined") {
                // create a new entry for the custom field (empty array)
                aCustomField = [];
                mCustomFields[result[row].COLUMN_ID] = aCustomField;
            }
            // add item category to the custom field
            aCustomField.push(result[row].ITEM_CATEGORY_ID);
        });
        return mCustomFields;
    }

    /**
     * Update the IS_CUSTOM fields of item custom fields in t_item_ext to the new value
     *
     * @param {string}
     *            sFieldName - name of custom field
     * @param {array}
     *            aFieldCategories - item category ids for which the values have to be updated
     * @param {string}
     *            sLeafItemMode - indicates which items should be updated:
     *              'all' - all items,
     *              'leaf' - only leaves,
     *              'non-leaf' - only non-leaf items (assemblies and root node)
     * @param {boolean}
     *            bCheckNull - indicates if values should be checked before:
     *              true - Check for null values. Only null values are set to given value.
     *              false - Do not check for null values. All values are just overwritten.
     * @param {int}
     *            iIsManual - is_manual value to be set (0 or 1)
     */
    function updateCustomField(sFieldName, aFieldCategories, sLeafItemMode, bCheckNull, iIsManual) {
        // As default, the statement is applied on all items
        let sLeafStmt = "";
        let sLeafWhereStmt = "";
        switch (sLeafItemMode) {
            case "nonleaf":
                sLeafStmt = `inner join "sap.plc.db::basis.t_item" child
                            on item.calculation_version_id = child.calculation_version_id and item.item_id = child.parent_item_id`;
                break;
            case "leaf":
                sLeafStmt = `left outer join "sap.plc.db::basis.t_item" child 
                                on child.calculation_version_id = item.calculation_version_id and child.parent_item_id = item.item_id`;
                sLeafWhereStmt = "and child.item_id is null";
                break;
            default:
        }
        const sCheckNullStmt = bCheckNull === true
            ? `and item_ext.${sFieldName}_IS_MANUAL is null`
            : `and ifnull(item_ext.${sFieldName}_IS_MANUAL, -1) <> ${iIsManual}`;

        const sUpdateStmnt
            = `update "sap.plc.db::basis.t_item_ext" item_ext
                set item_ext.${sFieldName}_IS_MANUAL = ${iIsManual}
                from "sap.plc.db::basis.t_item_ext" item_ext
                inner join "sap.plc.db::basis.t_item" item
                    on item.calculation_version_id = item_ext.calculation_version_id and item.item_id = item_ext.item_id
                ${sLeafStmt}
                where item.item_category_id in (${aFieldCategories.join(",")}) 
                    ${sCheckNullStmt}
                    ${sLeafWhereStmt}`;
        oConnection.executeUpdate(sUpdateStmnt);
    }

    /**
     * Sets the is_manual value of custom fields. See also descriptions of parameters in updateCustomField().
     * @param {boolean}
     *            bHasFormula - if the field is calculated (=1) or not calculated (=0)
     * @param {boolean}
     *            bRolledUp - if the field is rolled up (=1) or not (=0)
     *
     */
    function setIsManual(bHasFormula, bRolledUp, sLeafItemMode, bCheckNull, iIsManual) {
        let sFormulaStmt;
        let sItemCategorySource;
        if (bHasFormula === true) {
            sFormulaStmt = " and is_formula_used = 1";
            sItemCategorySource = "formula";
        } else {
            sFormulaStmt = " and ifnull(is_formula_used, 0) = 0";
            sItemCategorySource = "attr";
        }

        let sLeafStmt = "";
        switch (sLeafItemMode) {
            case "nonleaf":
                sLeafStmt = " and subitem_state in (-1, 1)";
                break;
            case "leaf":
                sLeafStmt = " and subitem_state in (-1, 0)";
                break;
            default:
        }

        const sRolledUpStmt = bRolledUp === true ? " and rollup_type_id > 0" : " and rollup_type_id = 0";

        // find custom fields with given attributes
        const sFieldsStmnt
            = `select distinct meta.column_id, ${sItemCategorySource}.item_category_id from "sap.plc.db::basis.t_metadata" meta
                inner join "sap.plc.db::basis.t_metadata_item_attributes" attr 
                    on meta.column_id = attr.column_id and meta.business_object = attr.business_object and meta.path = attr.path
                left outer join "sap.plc.db::basis.t_formula" formula 
                    on meta.column_id = formula.column_id 
                where is_custom = 1 and property_type in (1, 2, 3, 5)
                    and meta.column_id like 'CUST_%' -- to filter out the master data fields  
                    ${sFormulaStmt} ${sRolledUpStmt} ${sLeafStmt}
                order by meta.column_id, ${sItemCategorySource}.item_category_id`;
        const result = oConnection.executeQuery(sFieldsStmnt);
        const mCustomFields = processResult(result);

        Object.keys(mCustomFields).forEach((sFieldName) => {
            const aFieldCategories = mCustomFields[sFieldName];
            // set is_manual column of custom fields in rolled-up non-leaf items to 0
            updateCustomField(sFieldName, aFieldCategories, sLeafItemMode, bCheckNull, iIsManual);
        });
    }

    function setIsManualInStandardFields() {
        const oPersistencyMetadata = new PersistencyMetadata($, null, oConnection, $.session.getUsername());

        // Set is_manual for standard fields with formulas
        MapStandardFieldsWithFormulas.forEach((value, key) => {
            oPersistencyMetadata.updateManualFieldForStandardFields({
                PATH: "Item",
                BUSINESS_OBJECT: "Item",
                COLUMN_ID: key,
            });
        });
    }

    // ///////////////////////////////////////////////////////
    // Main logic
    // ///////////////////////////////////////////////////////
    setIsManualInStandardFields();
    // bHasFormula, bRolledUp, sLeafItemMode, bCheckNull, iIsManual
    setIsManual(false, false, "all", false, 1);
    setIsManual(false, true, "leaf", false, 1);
    setIsManual(false, true, "nonleaf", false, 0);
    setIsManual(true, false, "all", true, 0);
    setIsManual(true, true, "leaf", true, 0);
    setIsManual(true, true, "nonleaf", false, 0);

    return true;
}

function clean(oConnection) {
    return true;
}

function info(line) {
    trace.info(whoAmI, line);
}
