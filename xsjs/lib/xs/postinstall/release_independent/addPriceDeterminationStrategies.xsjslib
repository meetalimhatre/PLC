const sCalculationVersionTable = 'sap.plc.db::basis.t_calculation_version';
const sPriceDeterminationStrategyPriceSourceTable = 'sap.plc.db::basis.t_price_determination_strategy_price_source';
const sPriceDeterminationStrategyTable = 'sap.plc.db::basis.t_price_determination_strategy';
const sPriceDeterminationStrategyTextTable = 'sap.plc.db::basis.t_price_determination_strategy__text';
const sPriceSourceTable = 'sap.plc.db::basis.t_price_source';
const sProjectTable = 'sap.plc.db::basis.t_project';
const defaultPriceDeterminationStrategyID = 'PLC_STANDARD';
const materialTypeID = 1;
const activityTypeID = 2;
const defaultDate = '2000-01-01 00:00:00+02';
const sUser = '#CONTROLLER';

const enTexts = [
    'Standard Price Determination Strategy For Materials (SAP PLC)',
    'Standard Price Determination Strategy For Activities (SAP PLC)'
];
const deTexts = [
    'Standard Preisfindung Materialiensstrategie (SAP PLC)',
    'Standard Preisfindung Materialiensstrategie (SAP PLC)'
];

function check(oConnection) {
    return true;
}

async function getCurrentSchemaName(oConnection) {
    return oConnection.executeQuery('SELECT CURRENT_SCHEMA FROM "sap.plc.db::DUMMY"')[0].CURRENT_SCHEMA;
}

async function run(oConnection) {
    const sCurrentSchema = await getCurrentSchemaName(oConnection);
    var result;

    for (let typeID of [materialTypeID, activityTypeID]) {
        result = await oConnection.executeUpdate(`SELECT "PRICE_DETERMINATION_STRATEGY_ID" FROM "${sCurrentSchema}"."${sPriceDeterminationStrategyTable}"
                WHERE "PRICE_DETERMINATION_STRATEGY_ID"='${defaultPriceDeterminationStrategyID}'
                AND "PRICE_DETERMINATION_STRATEGY_TYPE_ID"=${typeID}`);

        if (result.length == 0) {
            await oConnection.executeUpdate(`INSERT INTO "${sCurrentSchema}"."${sPriceDeterminationStrategyTable}"
                    ("PRICE_DETERMINATION_STRATEGY_ID", "PRICE_DETERMINATION_STRATEGY_TYPE_ID", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY")
                    VALUES ('${defaultPriceDeterminationStrategyID}', ${typeID}, '${defaultDate}', '${sUser}', '${defaultDate}', '${sUser}')`);

            await oConnection.executeUpdate(`INSERT INTO "${sCurrentSchema}"."${sPriceDeterminationStrategyTextTable}"
                    ("PRICE_DETERMINATION_STRATEGY_ID", "PRICE_DETERMINATION_STRATEGY_TYPE_ID", "LANGUAGE", "PRICE_DETERMINATION_STRATEGY_DESCRIPTION") VALUES
                    ('${defaultPriceDeterminationStrategyID}', ${typeID}, 'EN', '${enTexts[typeID - 1]}')`);
            await oConnection.executeUpdate(`INSERT INTO "${sCurrentSchema}"."${sPriceDeterminationStrategyTextTable}"
                    ("PRICE_DETERMINATION_STRATEGY_ID", "PRICE_DETERMINATION_STRATEGY_TYPE_ID", "LANGUAGE", "PRICE_DETERMINATION_STRATEGY_DESCRIPTION") VALUES
                    ('${defaultPriceDeterminationStrategyID}', ${typeID}, 'DE', '${deTexts[typeID - 1]}')`);
        }

        await oConnection.executeUpdate(`DELETE FROM "${sCurrentSchema}"."${sPriceDeterminationStrategyPriceSourceTable}"
                WHERE "PRICE_SOURCE_TYPE_ID"=${typeID}`);

        // Usually PARTITION BY should be done by PRICE_DETERMINATION_STRATEGY_ID and PRICE_SOURCE_TYPE_ID
        // but in this case PRICE_DETERMINATION_STRATEGY_ID will remain the same

        await oConnection.executeUpdate(`INSERT INTO "${sCurrentSchema}"."${sPriceDeterminationStrategyPriceSourceTable}"
                    SELECT '${defaultPriceDeterminationStrategyID}' AS "PRICE_DETERMINATION_STRATEGY_ID",
                        "PRICE_SOURCE_TYPE_ID" as "PRICE_DETERMINATION_STRATEGY_TYPE_ID",	
                        "PRICE_SOURCE_ID",
                        "PRICE_SOURCE_TYPE_ID",
                        "DETERMINATION_SEQUENCE" -1 as "DETERMINATION_SEQUENCE"
                    FROM "${sCurrentSchema}"."${sPriceSourceTable}"
                    WHERE PRICE_SOURCE_TYPE_ID = ${typeID};`);
    };

    await oConnection.executeUpdate(`UPDATE "${sCurrentSchema}"."${sProjectTable}"
        SET MATERIAL_PRICE_STRATEGY_ID = '${defaultPriceDeterminationStrategyID}',
            ACTIVITY_PRICE_STRATEGY_ID = '${defaultPriceDeterminationStrategyID}';`);

    await  oConnection.executeUpdate(`UPDATE "${sCurrentSchema}"."${sCalculationVersionTable}"
        SET MATERIAL_PRICE_STRATEGY_ID = '${defaultPriceDeterminationStrategyID}',
            ACTIVITY_PRICE_STRATEGY_ID = '${defaultPriceDeterminationStrategyID}';`);

    return true;
}

function clean(oConnection) {
    return true;
}
export default { sCalculationVersionTable, sPriceDeterminationStrategyPriceSourceTable, sPriceDeterminationStrategyTable, sPriceDeterminationStrategyTextTable, sPriceSourceTable, sProjectTable, defaultPriceDeterminationStrategyID, materialTypeID, activityTypeID, defaultDate, sUser, enTexts, deTexts, check, getCurrentSchemaName, run, clean };
