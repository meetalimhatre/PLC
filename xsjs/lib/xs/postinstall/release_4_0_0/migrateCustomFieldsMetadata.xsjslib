const sXSCSchema = 'SAP_PLC';
var oSqlccConnection = null;
var sCurrentSchema = null;
const sMetadataTable = 'sap.plc.db::basis.t_metadata';
const sMetadataAttributesTable = 'sap.plc.db::basis.t_metadata_item_attributes';

async function migrateCustomFieldsMetadataTable() {
    const sMigrationSelect = `UPSERT "${ sCurrentSchema }"."${ sMetadataTable }"("PATH", "BUSINESS_OBJECT", "COLUMN_ID", "IS_CUSTOM", "ROLLUP_TYPE_ID", "SIDE_PANEL_GROUP_ID", "DISPLAY_ORDER",
                                                         "TABLE_DISPLAY_ORDER", "REF_UOM_CURRENCY_PATH", "REF_UOM_CURRENCY_BUSINESS_OBJECT", "REF_UOM_CURRENCY_COLUMN_ID",
                                                         "UOM_CURRENCY_FLAG", "SEMANTIC_DATA_TYPE", "SEMANTIC_DATA_TYPE_ATTRIBUTES", "VALIDATION_REGEX_ID", "PROPERTY_TYPE",
                                                         "IS_IMMUTABLE_AFTER_SAVE", "IS_REQUIRED_IN_MASTERDATA", "IS_WILDCARD_ALLOWED", "IS_USABLE_IN_FORMULA", "RESOURCE_KEY_DISPLAY_NAME",
                                                         "RESOURCE_KEY_DISPLAY_DESCRIPTION", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY")
                                SELECT  "PATH", "BUSINESS_OBJECT", "COLUMN_ID", "IS_CUSTOM", "ROLLUP_TYPE_ID", "SIDE_PANEL_GROUP_ID", "DISPLAY_ORDER", "TABLE_DISPLAY_ORDER",
                                        "REF_UOM_CURRENCY_PATH", "REF_UOM_CURRENCY_BUSINESS_OBJECT", "REF_UOM_CURRENCY_COLUMN_ID", "UOM_CURRENCY_FLAG", "SEMANTIC_DATA_TYPE",
                                        "SEMANTIC_DATA_TYPE_ATTRIBUTES", "VALIDATION_REGEX_ID", "PROPERTY_TYPE", "IS_IMMUTABLE_AFTER_SAVE", "IS_REQUIRED_IN_MASTERDATA",
                                        "IS_WILDCARD_ALLOWED", "IS_USABLE_IN_FORMULA", "RESOURCE_KEY_DISPLAY_NAME", "RESOURCE_KEY_DISPLAY_DESCRIPTION",
                                        "CREATED_AT" as "CREATED_ON", "CREATED_BY_USER_ID" as "CREATED_BY", "LAST_MODIFIED_AT" as "LAST_MODIFIED_ON", "LAST_MODIFIED_BY_USER_ID" as "LAST_MODIFIED_BY"
                                FROM "${ sXSCSchema }"."${ sMetadataTable }" as XSC
                                        WHERE "IS_CUSTOM" = 1`;
    oSqlccConnection.executeUpdate(sMigrationSelect);
    await oSqlccConnection.commit();
}

async function migrateCustomFieldsMetadataAttributesTable() {
    const sMigrationSelect = `UPSERT "${ sCurrentSchema }"."${ sMetadataAttributesTable }" ("PATH", "BUSINESS_OBJECT", "COLUMN_ID", "ITEM_CATEGORY_ID", "SUBITEM_STATE",
                                                                                        "IS_MANDATORY", "IS_READ_ONLY", "IS_TRANSFERABLE", "DEFAULT_VALUE",
                                                                                        "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY")
                                SELECT  "PATH", "BUSINESS_OBJECT", "COLUMN_ID", "ITEM_CATEGORY_ID", "HAS_CHILDREN" as "SUBITEM_STATE", "IS_MANDATORY",
                                        "IS_READ_ONLY", "IS_TRANSFERABLE", "DEFAULT_VALUE", "CREATED_AT" as "CREATED_ON", "CREATED_BY_USER_ID" as "CREATED_BY",
                                        "LAST_MODIFIED_AT" as "LAST_MODIFIED_ON", "LAST_MODIFIED_BY_USER_ID" as "LAST_MODIFIED_BY"
                                FROM "${ sXSCSchema }"."${ sMetadataAttributesTable }" as XSC
                                        WHERE XSC.COLUMN_ID LIKE_REGEXPR '^(CUST|CAPR|CWCE|CMPR|CMPL|CMAT|CCEN)_[A-Z][A-Z0-9_]*$'
                                        AND XSC.IS_ACTIVE IN (-1, 1)`;
    oSqlccConnection.executeUpdate(sMigrationSelect);
    await oSqlccConnection.commit();
}

async function removeOldVersionData() {
    oSqlccConnection.executeUpdate(`TRUNCATE TABLE "${ sXSCSchema }"."${ sMetadataTable }"`);
    await oSqlccConnection.commit();
    oSqlccConnection.executeUpdate(`TRUNCATE TABLE "${ sXSCSchema }"."${ sMetadataAttributesTable }"`);
    await oSqlccConnection.commit();
}

/**
 * Migrate custom fields from XSC tables t_metadata and t_metadata_item_attributes to the HDI container in XSA
 * For t_metadata all the entries with IS_CUSTOM = 1 will be migrated
 * For t_metadata_item_attributes will be migrated only the custom fields with IS_ACTIVE = 1 or IS_ACTIVE = -1 since the column IS_ACTIVE was removed with the data model change
 */
async function migrateMetadataCustomFields(sSchema, oConnection) {
    sCurrentSchema = sSchema;
    oSqlccConnection = oConnection;
    await console.log(sMetadataTable);
    await migrateCustomFieldsMetadataTable();
    await console.log(sMetadataAttributesTable);
    await migrateCustomFieldsMetadataAttributesTable();
    await removeOldVersionData();
}
export default {sXSCSchema,oSqlccConnection,sCurrentSchema,sMetadataTable,sMetadataAttributesTable,migrateCustomFieldsMetadataTable,migrateCustomFieldsMetadataAttributesTable,removeOldVersionData,migrateMetadataCustomFields};
