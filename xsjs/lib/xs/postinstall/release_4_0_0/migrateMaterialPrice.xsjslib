const iTableThreshold = 10000000;
const plcSchema = 'SAP_PLC';
var oSqlccConnection = null;
const sXSATableName = 'sap.plc.db::basis.t_material_price';
const sXSAExtTableName = 'sap.plc.db::basis.t_material_price_ext';
const sXSCTableName = 'sap.plc.db::basis.t_price';
const sXSCExtTableName = 'sap.plc.db::basis.t_price_ext';
const sMetadataTableName = 'sap.plc.db::basis.t_metadata';

async function removeOldVersionData(sTableName, oConnection) {
    await oConnection.executeUpdate(`TRUNCATE TABLE "${ plcSchema }"."${ sTableName }"`);
    await oConnection.commit();
}

async function checkTableSize(sTableName, oConnection) {
    return await oConnection.executeQuery(`SELECT COUNT(*) as RECORDNUMBER FROM "${ plcSchema }"."${ sTableName }"`)[0].RECORDNUMBER;
}

async function insertByChuncks(iRecordNumber, sUpsertStatement) {
    var iloops = Math.ceil(iRecordNumber / iTableThreshold);
    for (var i = 0; i < iloops; i++) {
        var sLoopSql = sUpsertStatement + ` LIMIT ${ iTableThreshold } OFFSET ${ i * iTableThreshold }`;
        await oSqlccConnection.executeUpdate(sLoopSql);
        await oSqlccConnection.commit();
    }
}

async function adaptMaterialPriceExt(sCurrentSchemaName) {
    const sGetMaterialPriceCFF = `SELECT COLUMN_ID
                                    FROM "${ sCurrentSchemaName }"."${ sMetadataTableName }" 
                                  where IS_CUSTOM = 1 and BUSINESS_OBJECT = 'Material_Price' and PATH='Material_Price' and UOM_CURRENCY_FLAG = 0   
                                `;
    const aMaterialPriceCFF = oSqlccConnection.executeQuery(sGetMaterialPriceCFF);
    if (aMaterialPriceCFF.length > 0) {
        const aMaterialPriceCFFColumns = [];
        aMaterialPriceCFF.forEach(oColumn => {
            aMaterialPriceCFFColumns.push(oColumn.COLUMN_ID + '_UNIT');
            aMaterialPriceCFFColumns.push(oColumn.COLUMN_ID + '_MANUAL');
        });
        const sUpsertMaterialPriceExt = ` UPSERT "${ sCurrentSchemaName }"."${ sXSAExtTableName }" (PRICE_ID, _VALID_FROM, ${ aMaterialPriceCFFColumns.join() })
                                                    SELECT MaterialPriceXSA.PRICE_ID as PRICE_ID, MaterialPriceExtXSC._VALID_FROM, MaterialPriceExtXSC.${ aMaterialPriceCFFColumns.join(', MaterialPriceExtXSC.') }
                                          FROM "${ plcSchema }"."${ sXSCExtTableName }" as MaterialPriceExtXSC
                                          INNER JOIN "${ sCurrentSchemaName }"."${ sXSATableName }" as MaterialPriceXSA
                                            ON  MaterialPriceExtXSC.PRICE_SOURCE_ID = MaterialPriceXSA.PRICE_SOURCE_ID
                                            AND MaterialPriceExtXSC.MATERIAL_ID = MaterialPriceXSA.MATERIAL_ID
                                            AND MaterialPriceExtXSC.PLANT_ID = MaterialPriceXSA.PLANT_ID
                                            AND MaterialPriceExtXSC.VENDOR_ID = MaterialPriceXSA.VENDOR_ID
                                            AND MaterialPriceExtXSC.PROJECT_ID = MaterialPriceXSA.PROJECT_ID
                                            AND MaterialPriceExtXSC.CUSTOMER_ID = MaterialPriceXSA.CUSTOMER_ID
                                            AND MaterialPriceExtXSC.VALID_FROM = MaterialPriceXSA.VALID_FROM
                                            AND MaterialPriceExtXSC.VALID_FROM_QUANTITY = MaterialPriceXSA.VALID_FROM_QUANTITY                                     
                                            AND MaterialPriceExtXSC._VALID_FROM = MaterialPriceXSA._VALID_FROM                                        
                                    `;
        const iExtRecordNumber = await checkTableSize(sXSCExtTableName, oSqlccConnection);
        if (iExtRecordNumber > iTableThreshold) {
            await insertByChuncks(iExtRecordNumber, sUpsertMaterialPriceExt);
        } else {
            await oSqlccConnection.executeUpdate(sUpsertMaterialPriceExt);
            await oSqlccConnection.commit();
        }
    }
}
async function insertUniqueMaterialPrice(sCurrentSchemaName) {
    const sUpsertMaterialPriceUniqueKey = `
            INSERT INTO "${ sCurrentSchemaName }"."${ sXSATableName }" (
                PRICE_ID, _VALID_FROM, PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PURCHASING_GROUP, PURCHASING_DOCUMENT, LOCAL_CONTENT, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_TO,
                VALID_FROM_QUANTITY, VALID_TO_QUANTITY, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, _VALID_TO, _SOURCE, _CREATED_BY
            )
            SELECT  (SELECT CAST(SYSUUID AS NVARCHAR(32)) from "DUMMY") as PRICE_ID, XSC._VALID_FROM, XSC.PRICE_SOURCE_ID, XSC.MATERIAL_ID, XSC.PLANT_ID, XSC.VENDOR_ID, XSC.PURCHASING_GROUP,
                    XSC.PURCHASING_DOCUMENT, XSC.LOCAL_CONTENT, XSC.PROJECT_ID, XSC.CUSTOMER_ID, XSC.VALID_FROM, XSC.VALID_TO, XSC.VALID_FROM_QUANTITY, XSC.VALID_TO_QUANTITY, XSC.PRICE_FIXED_PORTION,
                    XSC.PRICE_VARIABLE_PORTION, XSC.TRANSACTION_CURRENCY_ID, XSC.PRICE_UNIT, XSC.PRICE_UNIT_UOM_ID, XSC._VALID_TO, XSC._SOURCE, XSC._CREATED_BY
            FROM (
                    SELECT
                        _VALID_FROM, PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PURCHASING_GROUP, PURCHASING_DOCUMENT, LOCAL_CONTENT, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_TO, VALID_FROM_QUANTITY,
                        VALID_TO_QUANTITY, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, PRICE_TRANSACTION_CURRENCY_ID as TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, _VALID_TO, _SOURCE, _CREATED_BY_USER_ID as _CREATED_BY,
                        ROW_NUMBER() OVER (PARTITION BY PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY
                                ORDER BY PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY, _VALID_FROM
                            ) as rownumber
                    FROM "${ plcSchema }"."${ sXSCTableName }"
            ) as XSC
            where rownumber = 1 
            ORDER BY XSC.PRICE_SOURCE_ID, XSC.MATERIAL_ID, XSC.PLANT_ID, XSC.VENDOR_ID, XSC.PROJECT_ID, XSC.CUSTOMER_ID, XSC.VALID_FROM, XSC.VALID_FROM_QUANTITY, XSC._VALID_FROM        
    `;
    const iRecordNumber = await checkTableSize(sXSCTableName, oSqlccConnection);
    if (iRecordNumber > iTableThreshold) {
        await insertByChuncks(iRecordNumber, sUpsertMaterialPriceUniqueKey);
    } else {
        await oSqlccConnection.executeUpdate(sUpsertMaterialPriceUniqueKey);
        await oSqlccConnection.commit();
    }
}

async function insertDuplicatesMaterialPrice(sCurrentSchemaName) {
    const sUpsertStatement = `
        INSERT INTO "${ sCurrentSchemaName }"."${ sXSATableName }" (
            PRICE_ID, _VALID_FROM, PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PURCHASING_GROUP, PURCHASING_DOCUMENT, LOCAL_CONTENT, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_TO,
            VALID_FROM_QUANTITY, VALID_TO_QUANTITY, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, _VALID_TO, _SOURCE, _CREATED_BY
        )
        SELECT DISTINCT
            XSA.PRICE_ID, XSC._VALID_FROM, XSC.PRICE_SOURCE_ID, XSC.MATERIAL_ID, XSC.PLANT_ID, XSC.VENDOR_ID, XSC.PURCHASING_GROUP, XSC.PURCHASING_DOCUMENT, XSC.LOCAL_CONTENT, XSC.PROJECT_ID,
            XSC.CUSTOMER_ID, XSC.VALID_FROM, XSC.VALID_TO, XSC.VALID_FROM_QUANTITY, XSC.VALID_TO_QUANTITY, XSC.PRICE_FIXED_PORTION, XSC.PRICE_VARIABLE_PORTION,
            XSC.TRANSACTION_CURRENCY_ID, XSC.PRICE_UNIT, XSC.PRICE_UNIT_UOM_ID, XSC._VALID_TO, XSC._SOURCE, XSC._CREATED_BY
        FROM (
                SELECT
                    _VALID_FROM, PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PURCHASING_GROUP, PURCHASING_DOCUMENT, LOCAL_CONTENT, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_TO, VALID_FROM_QUANTITY,
                    VALID_TO_QUANTITY, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, PRICE_TRANSACTION_CURRENCY_ID as TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, _VALID_TO, _SOURCE, _CREATED_BY_USER_ID as _CREATED_BY,
                    ROW_NUMBER() OVER (PARTITION BY PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY
                               ORDER BY PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY, _VALID_FROM         
                        ) as rownumber
                FROM "${ plcSchema }"."${ sXSCTableName }"
        ) AS XSC
        INNER JOIN "${ sCurrentSchemaName }"."${ sXSATableName }" AS XSA
            ON XSA.PRICE_SOURCE_ID = XSC.PRICE_SOURCE_ID
                            AND XSA.MATERIAL_ID = XSC.MATERIAL_ID
                            AND XSA.PLANT_ID = XSC.PLANT_ID
                            AND XSA.VENDOR_ID = XSC.VENDOR_ID
                            AND XSA.PROJECT_ID = XSC.PROJECT_ID
                            AND XSA.CUSTOMER_ID = XSC.CUSTOMER_ID
                            AND XSA.VALID_FROM = XSC.VALID_FROM
                            AND XSA.VALID_FROM_QUANTITY = XSC.VALID_FROM_QUANTITY
        where rownumber > 1
        ORDER BY XSC.PRICE_SOURCE_ID, XSC.MATERIAL_ID, XSC.PLANT_ID, XSC.VENDOR_ID, XSC.PROJECT_ID, XSC.CUSTOMER_ID, XSC.VALID_FROM, XSC.VALID_FROM_QUANTITY, XSC._VALID_FROM     
    `;
    const iRecordNumber = await checkTableSize(sXSCTableName, oSqlccConnection);
    if (iRecordNumber > iTableThreshold) {
        await insertByChuncks(iRecordNumber, sUpsertStatement);
    } else {
        await oSqlccConnection.executeUpdate(sUpsertStatement);
        await oSqlccConnection.commit();
    }
}

/**
 * In order to move the prices from t_price (XSC) into t_material_price (XSA), a special approach was necessary due to the newly added column: PRICE_ID as a primary key.
 * All the prices from t_price have to be moved based on their old keys: PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY, _VALID_FROM
 * All the prices that have the same combination of PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY, should therefore have the same PRICE_ID in XSA.
 * 
 * The approach is to give each row a row number based on the keys mentioned before and then:
 *      1) move all of those that have their row number = 1 (they are unique or first of their group) and assign them a new PRICE_ID
 *      2) move all of those that have their row number > 1 (part of a group for which the first entry has already been moved) and assign an existent PRICE_ID
 *      3) move all the custom fields
 */
async function migrateMaterialPrice(currentSchemaName, oSqlccCon) {
    oSqlccConnection = oSqlccCon;
    let sCurrentState = `Migrating unique values from: ${ sXSCTableName };`;
    console.log(sCurrentState);
    await insertUniqueMaterialPrice(currentSchemaName);

    sCurrentState = `Migrating duplicated values from: ${ sXSCTableName };`;
    console.log(sCurrentState);
    await insertDuplicatesMaterialPrice(currentSchemaName);

    sCurrentState = `Migrating custom fields from: ${ sXSCExtTableName };`;
    console.log(sCurrentState);
    await adaptMaterialPriceExt(currentSchemaName);

    sCurrentState = `Removing data from XSC tables: ${ sXSCTableName } and ${ sXSCExtTableName };`;
    console.log(sCurrentState);

    await removeOldVersionData(sXSCTableName, oSqlccConnection);
    await removeOldVersionData(sXSCExtTableName, oSqlccConnection);
}
export default {iTableThreshold,plcSchema,oSqlccConnection,sXSATableName,sXSAExtTableName,sXSCTableName,sXSCExtTableName,sMetadataTableName,removeOldVersionData,checkTableSize,insertByChuncks,adaptMaterialPriceExt,insertUniqueMaterialPrice,insertDuplicatesMaterialPrice,migrateMaterialPrice};
