function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

async function run(oConnection) {

    const sItemCategoryTable = 'sap.plc.db::basis.t_item_category';
    const sItemCategoryTextTable = 'sap.plc.db::basis.t_item_category__text';

    try {
        oConnection.executeUpdate(`DELETE FROM "${ sItemCategoryTable }" WHERE CHILD_ITEM_CATEGORY_ID = 0 and ITEM_CATEGORY_ID != 0;`);
        oConnection.executeUpdate(`DELETE FROM "${ sItemCategoryTextTable }" WHERE CHILD_ITEM_CATEGORY_ID = 0 and ITEM_CATEGORY_ID != 0;`);
    } catch (e) {
        await console.log('error:', e.message);
        throw new Error(`Failed to update table, Error: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {check,clean,run};