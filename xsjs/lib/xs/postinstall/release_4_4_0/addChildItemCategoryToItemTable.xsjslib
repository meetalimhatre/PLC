function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

function run(oConnection) {

    const sItemTable = "sap.plc.db::basis.t_item";
    const sCostingSheetBaseRowTable = "sap.plc.db::basis.t_costing_sheet_base_row";

    try {
        oConnection.executeUpdate(`UPDATE "${sItemTable}" SET CHILD_ITEM_CATEGORY_ID = ITEM_CATEGORY_ID;`);
        oConnection.executeUpdate(`UPDATE "${sCostingSheetBaseRowTable}" SET CHILD_ITEM_CATEGORY_ID = ITEM_CATEGORY_ID;`);
    } catch (e) {
        console.log("error:", e.message);
        throw new Error(`Failed to set CHILD_ITEM_CATEGORY_ID, Error: ${e.message}`);
    }

    oConnection.commit();
    return true;
}
