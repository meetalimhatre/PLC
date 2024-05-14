const constants = $.require('../../util/constants');

async function check(oConnection) {
    return true;
}

async function clean(oConnection) {
    return true;
}

async function run(oConnection) {

    const sMetadataTable = 'sap.plc.db::basis.t_metadata';
    const sFieldMappingTable = 'sap.plc.db::map.t_field_mapping';
    let sCustomFieldMasterdataBusinessObjects = "'" + constants.aCustomFieldMasterdataBusinessObjects.join("','") + "'";

    try {
        // create CFs `_MANUAL` columns
        var aCustomFieldsNotDecimal = await oConnection.executeQuery(`
            SELECT  UPPER(COLUMN_ID) as COLUMN_ID
            FROM "${ sMetadataTable }" WHERE "IS_CUSTOM" = 1 AND "UOM_CURRENCY_FLAG" = 0 
                    AND "PATH" IN (${ sCustomFieldMasterdataBusinessObjects })
                    AND "BUSINESS_OBJECT" IN (${ sCustomFieldMasterdataBusinessObjects })
                    AND UPPER("SEMANTIC_DATA_TYPE") <> 'DECIMAL';
         `);

        var aCustomUnitFieldsNotDecimal = aCustomFieldsNotDecimal.map(customField => "'" + customField['COLUMN_ID'] + "_UNIT'");

        // create CFs `_UNIT` columns
        await oConnection.executeUpdate(`
            DELETE FROM "${ sFieldMappingTable }"
            WHERE UPPER(COLUMN_NAME) IN (${ aCustomUnitFieldsNotDecimal.join(',') });
         `);

    } catch (e) {
        console.log('error:', e.message);
        throw new Error(`Failed to remove unit fields where parent custom fields are not decimals: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {constants,check,clean,run};
