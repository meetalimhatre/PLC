const sFormulaTable = 'sap.plc.db::basis.t_formula';
var oConnection = null;

//check if sqlcc configuration is ok
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
    const sCurrentSchema = await getCurrentSchema(oCurrentConnection);
    oCurrentConnection.executeUpdate(`
                                update "${ sCurrentSchema }"."${ sFormulaTable }"
                                    set COLUMN_ID = 
                                        case when COLUMN_ID = 'QUANTITY_FOR_ONE_ASSEMBLY' then 'QUANTITY'
                                             when COLUMN_ID = 'COSTING_LOT_SIZE' then 'LOT_SIZE'
                                    end
                                where COLUMN_ID in ('QUANTITY_FOR_ONE_ASSEMBLY', 'COSTING_LOT_SIZE')
                             `);
    await oCurrentConnection.commit();
    return true;
}

async function getCurrentSchema(oCurrentConnection) {
    return await  oCurrentConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
}

async function closeSqlConnection(oConnection) {
    if (oConnection.close) {
        await oConnection.close();
    }
}

async function clean(oCurrentConnection) {
    await closeSqlConnection(oConnection);
    return true;
}
export default {sFormulaTable,oConnection,check,run,getCurrentSchema,closeSqlConnection,clean};
