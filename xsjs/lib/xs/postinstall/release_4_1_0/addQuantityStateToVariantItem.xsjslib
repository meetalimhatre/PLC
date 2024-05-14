const Constants = $.require('../../util/constants');
const sVariantItemTable = 'sap.plc.db::basis.t_variant_item';
const sVariantTable = 'sap.plc.db::basis.t_variant';
const sItemTable = 'sap.plc.db::basis.t_item';
const iStateManualValue = Constants.VariantItemQuantityState.MANUAL_VALUE;

function check(oConnection) {
    return true;
}

async function getCurrentSchemaName(oConnection) {
    return await oConnection.executeQuery('SELECT CURRENT_SCHEMA FROM "sap.plc.db::DUMMY"')[0].CURRENT_SCHEMA;
}

async function run(oConnection) {
    const sCurrentSchema = await getCurrentSchemaName(oConnection);
    // Add data to the new columns
    await oConnection.executeUpdate(`UPDATE "${ sCurrentSchema }"."${ sVariantItemTable }" SET QUANTITY_STATE = ${ iStateManualValue };`);
    await oConnection.commit();

    return true;
}

function clean(oConnection) {
    return true;
}
export default {Constants,sVariantItemTable,sVariantTable,sItemTable,iStateManualValue,check,getCurrentSchemaName,run,clean};
