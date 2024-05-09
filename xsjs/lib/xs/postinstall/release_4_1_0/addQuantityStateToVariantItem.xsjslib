const Constants = $.require("../../util/constants");
const sVariantItemTable = "sap.plc.db::basis.t_variant_item";
const sVariantTable = "sap.plc.db::basis.t_variant";
const sItemTable = "sap.plc.db::basis.t_item";
const iStateManualValue = Constants.VariantItemQuantityState.MANUAL_VALUE;

function check(oConnection) {
    return true;
}

function getCurrentSchemaName(oConnection) {
    return oConnection.executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;
}

function run(oConnection) {
    const sCurrentSchema = getCurrentSchemaName(oConnection);
    // Add data to the new columns
    oConnection.executeUpdate(`UPDATE "${sCurrentSchema}"."${sVariantItemTable}" SET QUANTITY_STATE = ${iStateManualValue};`);
    oConnection.commit();

    return true;
}

function clean(oConnection) {
    return true;
}