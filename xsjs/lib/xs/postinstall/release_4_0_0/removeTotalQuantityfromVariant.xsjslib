/*
Script that moves the values of TOTAL_QUANTITY and TOTAL_QUANTITY_UOM fields from the table t_variant and 
write it on the QUANTITY, TOTAL_QUANTITY AND QUANTITY_UOM of the table t_variant_item.
This changes are done before the data migration.
*/

const sXSCSchema = 'SAP_PLC';
const oTables = {
    'Variant': 'sap.plc.db::basis.t_variant',
    'VariantItems': 'sap.plc.db::basis.t_variant_item',
    'CalculationVersion': 'sap.plc.db::basis.t_calculation_version'
};
var oConnection = null;

async function check(oCurrentConnection) {
    try {
        oConnection = await $.hdb.getConnection({
            'sqlcc': 'xsjs.sqlcc_config',
            'pool': true,
            'treatDateAsUTC': true
        });
        return true;
    } catch (e) {
        throw e;
    }
}

async function run(oCurrentConnection) {
    let oConnection = await getConnection();
    let aOldValues = await oConnection.executeQuery(`select 
                    variant.VARIANT_ID, variant.TOTAL_QUANTITY, variant.TOTAL_QUANTITY_UOM_ID, calculation_version.ROOT_ITEM_ID 
                    from "${ sXSCSchema }"."${ oTables.Variant }" as variant 
                    inner join 
                    "${ sXSCSchema }"."${ oTables.CalculationVersion }" as calculation_version 
                    on variant.CALCULATION_VERSION_ID = calculation_version.CALCULATION_VERSION_ID`);
    if (aOldValues.length > 0) {
        const sStmt = `
                update "${ sXSCSchema }"."${ oTables.VariantItems }" set 
                QUANTITY = ? ,
                QUANTITY_UOM_ID = ?,
                TOTAL_QUANTITY = ? 
                where VARIANT_ID = ? and ITEM_ID = ?`;

        const aValues = aOldValues.map(oItemValues => {
            let aItemValues = [];
            aItemValues.push(oItemValues.TOTAL_QUANTITY);
            aItemValues.push(oItemValues.TOTAL_QUANTITY_UOM_ID);
            aItemValues.push(oItemValues.TOTAL_QUANTITY);
            aItemValues.push(oItemValues.VARIANT_ID);
            aItemValues.push(oItemValues.ROOT_ITEM_ID);
            return aItemValues;
        });

        const output = await oConnection.executeUpdate(sStmt, aValues);
        await oConnection.commit();
    }

    return true;
}

async function getConnection() {
    if (oConnection == null) {
        await check();
    }
    return oConnection;

}

function clean(oConnection) {
    return true;
}
export default {sXSCSchema,oTables,oConnection,check,run,getConnection,clean};
