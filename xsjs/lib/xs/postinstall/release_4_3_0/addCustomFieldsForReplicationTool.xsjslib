const constants = $.require('../../util/constants');

function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

async function run(oConnection) {
    var sUser = 'postInstall';
    const dDate = new Date().toJSON();
    const sMetadataTable = 'sap.plc.db::basis.t_metadata';
    const sFieldMappingTable = 'sap.plc.db::map.t_field_mapping';
    const sFieldMappingSequence = 'sap.plc.db.sequence::s_field_mapping';
    let sCustomFieldMasterdataBusinessObjects = "'" + constants.aCustomFieldMasterdataBusinessObjects.join("','") + "'";

    try {
        // create CFs `_MANUAL` columns
        oConnection.executeUpdate(`
            INSERT INTO "${ sFieldMappingTable }" ("ID", "TABLE_NAME", "COLUMN_NAME", "IS_PK", "IS_MANDATORY", "IS_NULLABLE", "VALIDATION_REGEX", "FIELD_TYPE", "FIELD_ORDER", "IS_CUSTOM", "IS_UPPERCASE", "LENGTH", "SCALE", "PRECISION")
            SELECT  "${ sFieldMappingSequence }".NEXTVAL AS "ID",
                    CONCAT('t_', LOWER("BUSINESS_OBJECT")) AS "TABLE_NAME",
					CONCAT("COLUMN_ID", '_MANUAL') AS "COLUMN_NAME",
                    0 AS "IS_PK",
                    0 AS "IS_MANDATORY",
                    1 AS "IS_NULLABLE",
                    "VALIDATION_REGEX_ID" AS "VALIDATION_REGEX",
                    UPPER("SEMANTIC_DATA_TYPE") AS "FIELD_TYPE",
                    "DISPLAY_ORDER" AS "FIELD_ORDER",
                    "IS_CUSTOM",
                    0 AS "IS_UPPERCASE",
                    CASE
                        WHEN UPPER("SEMANTIC_DATA_TYPE") = 'LINK'
                            THEN 2000
                        WHEN UPPER("SEMANTIC_DATA_TYPE") = 'STRING' AND "UOM_CURRENCY_FLAG" = 0
                            THEN 5000
                        ELSE NULL
                    END AS "LENGTH",
                    CASE
                        WHEN UPPER("SEMANTIC_DATA_TYPE") = 'DECIMAL'
                            THEN 28
                        ELSE NULL
                    END AS "SCALE",
                    CASE
                        WHEN UPPER("SEMANTIC_DATA_TYPE") = 'DECIMAL'
                            THEN 7
                        ELSE NULL
                    END AS "PRECISION"
            FROM "${ sMetadataTable }" WHERE "IS_CUSTOM" = 1 AND "UOM_CURRENCY_FLAG" = 0 
                    AND "PATH" IN (${ sCustomFieldMasterdataBusinessObjects })
                    AND "BUSINESS_OBJECT" IN (${ sCustomFieldMasterdataBusinessObjects });
         `);

        // create CFs `_UNIT` columns
        oConnection.executeUpdate(`
            INSERT INTO "${ sFieldMappingTable }" ("ID", "TABLE_NAME", "COLUMN_NAME", "IS_PK", "IS_MANDATORY", "IS_NULLABLE", "VALIDATION_REGEX", "FIELD_TYPE", "FIELD_ORDER", "IS_CUSTOM", "IS_UPPERCASE", "LENGTH", "SCALE", "PRECISION")
            SELECT  "${ sFieldMappingSequence }".NEXTVAL AS "ID",
                    CONCAT('t_', LOWER("BUSINESS_OBJECT")) AS "TABLE_NAME",
					CONCAT("COLUMN_ID", '_UNIT') AS "COLUMN_NAME",
                    0 AS "IS_PK",
                    0 AS "IS_MANDATORY",
                    1 AS "IS_NULLABLE",
                    "VALIDATION_REGEX_ID" AS "VALIDATION_REGEX",
                    'STRING' AS "FIELD_TYPE",
                    "DISPLAY_ORDER" AS "FIELD_ORDER",
                    "IS_CUSTOM",
                    0 AS "IS_UPPERCASE",
                    3 AS "LENGTH",
                    NULL AS "SCALE",
                    NULL AS "PRECISION"
            FROM "${ sMetadataTable }" WHERE "IS_CUSTOM" = 1 AND "UOM_CURRENCY_FLAG" = 0 
                    AND "PATH" IN (${ sCustomFieldMasterdataBusinessObjects })
                    AND "BUSINESS_OBJECT" IN (${ sCustomFieldMasterdataBusinessObjects })
                    AND UPPER("SEMANTIC_DATA_TYPE") = 'DECIMAL';
         `);

    } catch (e) {
        await console.log('error:', e.message);
        throw new Error(`Failed to add custom fields to firld mappings for replication tool: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {constants,check,clean,run};
