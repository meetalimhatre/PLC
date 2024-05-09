const iTableThreshold = 10000000;
const plcSchema = "SAP_PLC";
var oSqlccConnection = null;
const sXSCTableName = "sap.plc.db::basis.t_activity_rate";
const sXSATableName = "sap.plc.db::basis.t_activity_price";
const sXSAExtTableName = "sap.plc.db::basis.t_activity_price_ext";
const sXSCExtTableName = "sap.plc.db::basis.t_activity_rate_ext";
const sMetadataTableName = "sap.plc.db::basis.t_metadata";

function removeOldVersionData(sTableName, oConnection) {
    oConnection.executeUpdate(`TRUNCATE TABLE "${plcSchema}"."${sTableName}"`);
    oConnection.commit();
}

function checkTableSize(sTableName, oConnection) {
    return oConnection.executeQuery(`SELECT COUNT(*) as RECORDNUMBER FROM "${plcSchema}"."${sTableName}"`)[0].RECORDNUMBER;
}

function insertByChuncks(iRecordNumber, sUpsertStatement) {
    var iloops = Math.ceil(iRecordNumber / iTableThreshold);
    for (var i = 0; i < iloops; i++) {
        var sLoopSql = sUpsertStatement + ` LIMIT ${iTableThreshold} OFFSET ${i * iTableThreshold}`;
        oSqlccConnection.executeUpdate(sLoopSql);
        oSqlccConnection.commit();
    }
}

function adaptActivityPriceExt(sCurrentSchemaName) {
    const sGetActivityPriceCFF = `SELECT COLUMN_ID
                                    FROM "${sCurrentSchemaName}"."${sMetadataTableName}"
                                  where IS_CUSTOM = 1 and BUSINESS_OBJECT = 'Activity_Price' and PATH='Activity_Price' and UOM_CURRENCY_FLAG = 0  
                                `;
    const aActivityPriceCFF = oSqlccConnection.executeQuery(sGetActivityPriceCFF);
    if (aActivityPriceCFF.length > 0) {
        const aActivityPriceCFFColumns = [];
        aActivityPriceCFF.forEach(oColumn => {
            aActivityPriceCFFColumns.push(oColumn.COLUMN_ID + "_UNIT");
            aActivityPriceCFFColumns.push(oColumn.COLUMN_ID + "_MANUAL");
        });

        const sUpsertActivityPriceExt = ` UPSERT "${sCurrentSchemaName}"."${sXSAExtTableName}" (PRICE_ID, _VALID_FROM, ${aActivityPriceCFFColumns.join()})
                                                    SELECT ActivityPriceXSA.PRICE_ID as PRICE_ID, ActivityPriceExtXSC._VALID_FROM, ActivityPriceExtXSC.${aActivityPriceCFFColumns.join(", ActivityPriceExtXSC.")}
                                          FROM "${plcSchema}"."${sXSCExtTableName}" as ActivityPriceExtXSC
                                          INNER JOIN "${sCurrentSchemaName}"."${sXSATableName}" as ActivityPriceXSA
                                            ON  ActivityPriceExtXSC.PRICE_SOURCE_ID = ActivityPriceXSA.PRICE_SOURCE_ID
                                            AND ActivityPriceExtXSC.CONTROLLING_AREA_ID = ActivityPriceXSA.CONTROLLING_AREA_ID
                                            AND ActivityPriceExtXSC.COST_CENTER_ID = ActivityPriceXSA.COST_CENTER_ID
                                            AND ActivityPriceExtXSC.ACTIVITY_TYPE_ID = ActivityPriceXSA.ACTIVITY_TYPE_ID
                                            AND ActivityPriceExtXSC.PROJECT_ID = ActivityPriceXSA.PROJECT_ID
                                            AND ActivityPriceExtXSC.CUSTOMER_ID = ActivityPriceXSA.CUSTOMER_ID
                                            AND ActivityPriceExtXSC.VALID_FROM = ActivityPriceXSA.VALID_FROM
                                            AND ActivityPriceExtXSC.VALID_FROM_QUANTITY = ActivityPriceXSA.VALID_FROM_QUANTITY                                     
                                            AND ActivityPriceExtXSC._VALID_FROM = ActivityPriceXSA._VALID_FROM
                                        ORDER BY ActivityPriceExtXSC.PRICE_SOURCE_ID, ActivityPriceExtXSC.CONTROLLING_AREA_ID, ActivityPriceExtXSC.COST_CENTER_ID, ActivityPriceExtXSC.ACTIVITY_TYPE_ID,
                                            ActivityPriceExtXSC.PROJECT_ID, ActivityPriceExtXSC.CUSTOMER_ID, ActivityPriceExtXSC.VALID_FROM, ActivityPriceExtXSC.VALID_FROM_QUANTITY, ActivityPriceExtXSC._VALID_FROM
                                    `;
        const iExtRecordNumber = checkTableSize(sXSCExtTableName, oSqlccConnection);
        if(iExtRecordNumber > iTableThreshold) {
            insertByChuncks(iExtRecordNumber, sUpsertActivityPriceExt);
        } else {
            oSqlccConnection.executeUpdate(sUpsertActivityPriceExt);
            oSqlccConnection.commit();
        }
    }
}
function insertUniqueActivityPrice(sCurrentSchemaName) {
    const sUpsertActivityPriceUniqueKey = `
            INSERT INTO "${sCurrentSchemaName}"."${sXSATableName}" (
                PRICE_ID, _VALID_FROM, PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_TO,
                VALID_FROM_QUANTITY, VALID_TO_QUANTITY, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, _VALID_TO, _SOURCE, _CREATED_BY
            )
            SELECT  (SELECT CAST(SYSUUID AS NVARCHAR(32)) from "DUMMY") as PRICE_ID, XSC._VALID_FROM, XSC.PRICE_SOURCE_ID, XSC.CONTROLLING_AREA_ID, XSC.COST_CENTER_ID, XSC.ACTIVITY_TYPE_ID,
                    XSC.PROJECT_ID, XSC.CUSTOMER_ID, XSC.VALID_FROM, XSC.VALID_TO, XSC.VALID_FROM_QUANTITY, XSC.VALID_TO_QUANTITY, XSC.PRICE_FIXED_PORTION,
                    XSC.PRICE_VARIABLE_PORTION, XSC.TRANSACTION_CURRENCY_ID, XSC.PRICE_UNIT, XSC.PRICE_UNIT_UOM_ID, XSC._VALID_TO, XSC._SOURCE, XSC._CREATED_BY
            FROM (
                    SELECT
                        _VALID_FROM, PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_TO, VALID_FROM_QUANTITY,
                        VALID_TO_QUANTITY, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, PRICE_TRANSACTION_CURRENCY_ID as TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, _VALID_TO, _SOURCE, _CREATED_BY_USER_ID as _CREATED_BY,
                        ROW_NUMBER() OVER (PARTITION BY PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY 
                            ORDER BY PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY, _VALID_FROM) as rownumber
                    FROM "${plcSchema}"."${sXSCTableName}"
            ) as XSC
            where rownumber = 1 
            ORDER BY XSC.PRICE_SOURCE_ID, XSC.CONTROLLING_AREA_ID, XSC.COST_CENTER_ID, XSC.ACTIVITY_TYPE_ID, XSC.PROJECT_ID, XSC.CUSTOMER_ID, XSC.VALID_FROM, XSC.VALID_FROM_QUANTITY, XSC._VALID_FROM        
    `;
    const iRecordNumber = checkTableSize(sXSCTableName, oSqlccConnection);
    if(iRecordNumber > iTableThreshold) {
        insertByChuncks(iRecordNumber, sUpsertActivityPriceUniqueKey);
    } else {
        oSqlccConnection.executeUpdate(sUpsertActivityPriceUniqueKey);
        oSqlccConnection.commit();
    }
}

function insertDuplicatesActivityPrice(sCurrentSchemaName) {
    const sUpsertActivityPriceDuplicateKey = `
        INSERT INTO "${sCurrentSchemaName}"."${sXSATableName}" (
            PRICE_ID, _VALID_FROM, PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_TO,
            VALID_FROM_QUANTITY, VALID_TO_QUANTITY, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, _VALID_TO, _SOURCE, _CREATED_BY
        )
        SELECT DISTINCT
            XSA.PRICE_ID, XSC._VALID_FROM, XSC.PRICE_SOURCE_ID, XSC.CONTROLLING_AREA_ID, XSC.COST_CENTER_ID, XSC.ACTIVITY_TYPE_ID, XSC.PROJECT_ID,
            XSC.CUSTOMER_ID, XSC.VALID_FROM, XSC.VALID_TO, XSC.VALID_FROM_QUANTITY, XSC.VALID_TO_QUANTITY, XSC.PRICE_FIXED_PORTION, XSC.PRICE_VARIABLE_PORTION,
            XSC.TRANSACTION_CURRENCY_ID, XSC.PRICE_UNIT, XSC.PRICE_UNIT_UOM_ID, XSC._VALID_TO, XSC._SOURCE, XSC._CREATED_BY
        FROM (
                SELECT
                    _VALID_FROM, PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_TO, VALID_FROM_QUANTITY,
                    VALID_TO_QUANTITY, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, PRICE_TRANSACTION_CURRENCY_ID as TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, _VALID_TO, _SOURCE, _CREATED_BY_USER_ID as _CREATED_BY,
                    ROW_NUMBER() OVER (PARTITION BY PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY
                        ORDER BY PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY, _VALID_FROM) as rownumber
                FROM "${plcSchema}"."${sXSCTableName}"
        ) AS XSC
        INNER JOIN "${sCurrentSchemaName}"."${sXSATableName}" AS XSA
            ON XSA.PRICE_SOURCE_ID = XSC.PRICE_SOURCE_ID
                            AND XSA.CONTROLLING_AREA_ID = XSC.CONTROLLING_AREA_ID
                            AND XSA.COST_CENTER_ID = XSC.COST_CENTER_ID
                            AND XSA.ACTIVITY_TYPE_ID = XSC.ACTIVITY_TYPE_ID
                            AND XSA.PROJECT_ID = XSC.PROJECT_ID
                            AND XSA.CUSTOMER_ID = XSC.CUSTOMER_ID
                            AND XSA.VALID_FROM = XSC.VALID_FROM
                            AND XSA.VALID_FROM_QUANTITY = XSC.VALID_FROM_QUANTITY
        where rownumber > 1
        ORDER BY XSC.PRICE_SOURCE_ID, XSC.CONTROLLING_AREA_ID, XSC.COST_CENTER_ID, XSC.ACTIVITY_TYPE_ID, XSC.PROJECT_ID, XSC.CUSTOMER_ID, XSC.VALID_FROM, XSC.VALID_FROM_QUANTITY, XSC._VALID_FROM     
    `;
    const iRecordNumber = checkTableSize(sXSCTableName, oSqlccConnection);
    if(iRecordNumber > iTableThreshold) {
        insertByChuncks(iRecordNumber, sUpsertActivityPriceDuplicateKey);
    } else {
        oSqlccConnection.executeUpdate(sUpsertActivityPriceDuplicateKey);
        oSqlccConnection.commit();
    }
}
/**
 * In order to move the prices from t_activity_rate (XSC) into t_activity_price (XSA), a special approach was necessary due to the newly added column: PRICE_ID as a primary key.
 * All the prices from t_activity_rate have to be moved based on their old keys: PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY, _VALID_FROM
 * All the prices that have the same combination of PRICE_SOURCE_ID, CONTROLLING_AREA_ID, COST_CENTER_ID, ACTIVITY_TYPE_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY, should therefore have the same PRICE_ID in XSA.
 * 
 * The approach is to give each row a row number based on the keys mentioned before and then:
 *      1) move all of those that have their row number = 1 (they are unique or first of their group) and assign them a new PRICE_ID
 *      2) move all of those that have their row number > 1 (part of a group for which the first entry has already been moved) and assign an existent PRICE_ID
 *      3) move all the custom fields
 */
function migrateActivityPrice(currentSchemaName, oSqlccCon) {
    oSqlccConnection = oSqlccCon;
    let sCurrentState = `Migrating unique values from: ${sXSCTableName};`
    console.log(sCurrentState);
    insertUniqueActivityPrice(currentSchemaName);

    sCurrentState = `Migrating duplicated values from: ${sXSCTableName};`;
    console.log(sCurrentState);
    insertDuplicatesActivityPrice(currentSchemaName);

    sCurrentState = `Migrating custom fields from: ${sXSCExtTableName};`;
    console.log(sCurrentState);
    adaptActivityPriceExt(currentSchemaName);

    sCurrentState = `Removing data from XSC tables: ${sXSCTableName} and ${sXSCExtTableName};`;
    console.log(sCurrentState);
    // remove data from XSC tables t_activity_rate and t_activity_rate_ext
    removeOldVersionData(sXSCTableName, oSqlccConnection);
    removeOldVersionData(sXSCExtTableName, oSqlccConnection);
}