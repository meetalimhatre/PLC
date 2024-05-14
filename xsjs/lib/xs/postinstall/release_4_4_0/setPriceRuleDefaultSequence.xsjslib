const sPriceRuleTable = 'sap.plc.db::basis.t_price_rule';
const sPriceDetStrategyRuleTable = 'sap.plc.db::basis.t_price_determination_strategy_rule';
const sPriceDetStrategyTable = 'sap.plc.db::basis.t_price_determination_strategy';
const sPriceDetStrategyId = 'PLC_STANDARD';

async function check(oConnection) {
    return true;
}

async function clean(oConnection) {
    return true;
}

async function getCurrentSchemaName(oConnection) {
    return await oConnection.executeQuery('SELECT CURRENT_SCHEMA FROM "sap.plc.db::DUMMY"')[0].CURRENT_SCHEMA;
}

async function run(oConnection) {
    try {
        const sCurrentSchema = await getCurrentSchemaName(oConnection);

        await oConnection.executeUpdate(`DELETE FROM "${ sCurrentSchema }"."${ sPriceDetStrategyRuleTable }"`);
        const aCurrentPriceDeterminationStartegies = await oConnection.executeQuery(`SELECT DISTINCT PRICE_DETERMINATION_STRATEGY_ID, PRICE_DETERMINATION_STRATEGY_TYPE_ID from "${ sCurrentSchema }"."${ sPriceDetStrategyTable }"`);
        const aValues = await oConnection.executeQuery(`SELECT RULE_CODE, RULE_TYPE_ID, DEFAULT_PRIORITY FROM "${ sCurrentSchema }"."${ sPriceRuleTable }"`);
        aCurrentPriceDeterminationStartegies.forEach(oPriceDetStrategy => {
            aValues.forEach(record => {
                if (oPriceDetStrategy.PRICE_DETERMINATION_STRATEGY_TYPE_ID === record.RULE_TYPE_ID) {
                    await oConnection.executeUpdate(`INSERT INTO "${ sCurrentSchema }"."${ sPriceDetStrategyRuleTable }"("PRICE_DETERMINATION_STRATEGY_ID", "PRICE_DETERMINATION_STRATEGY_TYPE_ID", "RULE_CODE", "PRIORITY")
                    VALUES (?, ?, ?, ?)`, [[
                            oPriceDetStrategy.PRICE_DETERMINATION_STRATEGY_ID,
                            record.RULE_TYPE_ID,
                            record.RULE_CODE,
                            record.DEFAULT_PRIORITY
                        ]]);
                }
            });
        });
    } catch (error) {
        console.log('error: ', error.message);
        throw new Error(`Error inserting default sequence for price rules.: ${ error.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {sPriceRuleTable,sPriceDetStrategyRuleTable,sPriceDetStrategyTable,sPriceDetStrategyId,check,clean,getCurrentSchemaName,run};