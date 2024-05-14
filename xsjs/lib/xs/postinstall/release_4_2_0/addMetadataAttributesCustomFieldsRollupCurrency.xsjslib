const sMetadataItemAttributesTable = 'sap.plc.db::basis.t_metadata_item_attributes';
const sMetadataTable = 'sap.plc.db::basis.t_metadata';
const sItem = 'Item';
const _ = $.require('lodash');

function check(oConnection) {
    return true;
}

async function getCurrentSchemaName(oConnection) {
    return await oConnection.executeQuery('SELECT CURRENT_SCHEMA FROM "sap.plc.db::DUMMY"')[0].CURRENT_SCHEMA;
}

async function run(oConnection) {
    const sCurrentSchema = await getCurrentSchemaName(oConnection);

    //Get all custom fields with currency and rollup
    const oCustomFieldsCurrencyRollup = await oConnection.executeQuery(`SELECT "COLUMN_ID" FROM "${ sCurrentSchema }"."${ sMetadataTable }"
                                                                    WHERE "IS_CUSTOM" = 1
                                                                    AND "ROLLUP_TYPE_ID" != 0
                                                                    AND "PROPERTY_TYPE" = 7
                                                                    AND "PATH" = '${ sItem }'
                                                                    AND "BUSINESS_OBJECT" = '${ sItem }'
                                                                    AND "UOM_CURRENCY_FLAG" = 1;`);
    if (oCustomFieldsCurrencyRollup != null && oCustomFieldsCurrencyRollup.length > 0) {

        const aColumnNames = _.map(oCustomFieldsCurrencyRollup, obj => {
            return obj.COLUMN_ID;
        });
        const sInCondition = aColumnNames.map(column => `'${ column }'`).join(',');

        // Check if the script was already executed
        const iNumberOfMinusOnes = await oConnection.executeQuery(`SELECT COUNT(*) AS COUNTER
                                                                FROM "${ sCurrentSchema }"."${ sMetadataItemAttributesTable }"
                                                                WHERE "COLUMN_ID" IN (${ sInCondition })
                                                                AND "SUBITEM_STATE" = -1;`)[0].COUNTER;
        if (iNumberOfMinusOnes == 0) {
            return true;
        }

        /** The existing row that is inserted now, should be updated with the value 0 instead of -1
         *  for the SUBITEM_STATE column.
         */
        aColumnNames.forEach(sColumn => {
            await oConnection.executeUpdate(`UPDATE "${ sCurrentSchema }"."${ sMetadataItemAttributesTable }"
                                        SET SUBITEM_STATE = 0 
                                        WHERE "PATH" = '${ sItem }'
                                        AND "BUSINESS_OBJECT" = '${ sItem }'
                                        AND "COLUMN_ID" = '${ sColumn }';`);
        });

        /** It should be inserted one additional row for each item category for which that custom field is valid,
         *  with the value 1 for SUBITEM_STATE and IS_READ_ONLY columns.
         */
        const currentUser = $.getPlcUsername();
        let aExistingRows = await oConnection.executeQuery(`SELECT * FROM "${ sCurrentSchema }"."${ sMetadataItemAttributesTable }" WHERE "PATH" = '${ sItem }' AND "BUSINESS_OBJECT" = '${ sItem }' AND "COLUMN_ID" IN (${ sInCondition });`);
        aExistingRows.forEach(oRow => {
            await oConnection.executeUpdate(`INSERT INTO "${ sCurrentSchema }"."${ sMetadataItemAttributesTable }" 
                                ("PATH", "BUSINESS_OBJECT", "COLUMN_ID", "ITEM_CATEGORY_ID", "SUBITEM_STATE", "IS_MANDATORY", "IS_READ_ONLY", "IS_TRANSFERABLE", "DEFAULT_VALUE", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY")
                                VALUES('${ oRow.PATH }', '${ oRow.BUSINESS_OBJECT }', '${ oRow.COLUMN_ID }', ${ oRow.ITEM_CATEGORY_ID }, 
                                1, ${ oRow.IS_MANDATORY }, 1, ${ oRow.IS_TRANSFERABLE }, 
                                ${ oRow.DEFAULT_VALUE }, CURRENT_TIMESTAMP, '${ currentUser }', CURRENT_TIMESTAMP, '${ currentUser }');`);
        });

        await oConnection.commit();
    }

    return true;
}

function clean(oConnection) {
    return true;
}
export default {sMetadataItemAttributesTable,sMetadataTable,sItem,_,check,getCurrentSchemaName,run,clean};
