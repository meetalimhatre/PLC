async function check(oConnection) {
    return true;
}

async function clean(oConnection) {
    return true;
}

async function run(oConnection) {

    const sItemTable = 'sap.plc.db::basis.t_item';
    const sCostingSheetBaseRowTable = 'sap.plc.db::basis.t_costing_sheet_base_row';

    try {
        await oConnection.executeUpdate(`UPDATE "${ sItemTable }" SET CHILD_ITEM_CATEGORY_ID = ITEM_CATEGORY_ID;`);
        await oConnection.executeUpdate(`UPDATE "${ sCostingSheetBaseRowTable }" SET CHILD_ITEM_CATEGORY_ID = ITEM_CATEGORY_ID;`);
    } catch (e) {
        console.log('error:', e.message);
        throw new Error(`Failed to set CHILD_ITEM_CATEGORY_ID, Error: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {check,clean,run};
