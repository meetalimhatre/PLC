function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

function run(oConnection) {
    const sCostingSheetRow = "sap.plc.db::basis.t_costing_sheet_row";

    try{
        // set `IS_RELEVANT_FOR_TOTAL2` and `IS_RELEVANT_FOR_TOTAL3` to `1` from `t_costing_sheet_row` table, for all base rows
        oConnection.executeUpdate(`
            UPDATE "${sCostingSheetRow}" 
            SET "IS_RELEVANT_FOR_TOTAL2" = 1, "IS_RELEVANT_FOR_TOTAL3" = 1
            WHERE "COSTING_SHEET_ROW_TYPE" IN (1, 2);
        `);
    } catch(e) {
        console.log("error:", e.message);
		throw new Error(`Setting IS_RELEVANT_FOR_TOTAL (Intercompany) failed: ${e.message}`);
    }

    oConnection.commit();
    return true;
}
