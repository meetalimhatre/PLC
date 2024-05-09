function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

function run(oConnection) {

    const sLayoutColumnTable = "sap.plc.db::basis.t_layout_column";
    const sLayoutHiddenFieldTable = "sap.plc.db::basis.t_layout_hidden_field";

    try {
        oConnection.executeUpdate(`UPDATE "${sLayoutColumnTable}" SET COLUMN_ID = 'CHILD_ITEM_CATEGORY_ID', BUSINESS_OBJECT='Custom_Item_Categories', PATH='ITEM.CUSTOM_ITEM_CATEGORIES' WHERE COLUMN_ID = 'ITEM_CATEGORY_ID';`);
        oConnection.executeUpdate(`UPDATE "${sLayoutHiddenFieldTable}" SET COLUMN_ID = 'CHILD_ITEM_CATEGORY_ID', BUSINESS_OBJECT='Custom_Item_Categories',PATH='ITEM.CUSTOM_ITEM_CATEGORIES' WHERE COLUMN_ID = 'ITEM_CATEGORY_ID';`);
    } catch (e) {
        console.log("error:", e.message);
        throw new Error(`Failed to set CHILD_ITEM_CATEGORY_ID, Error: ${e.message}`);
    }

    oConnection.commit();
    return true;
}
