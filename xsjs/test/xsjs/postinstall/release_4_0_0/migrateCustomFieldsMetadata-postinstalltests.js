const _ = require("lodash");
const sMetadataTable = "sap.plc.db::basis.t_metadata";
const sMetadataTextTable = "sap.plc.db::basis.t_metadata__text";
const sMetadataAttributesTable = "sap.plc.db::basis.t_metadata_item_attributes";
const sActivityPriceExtTable = "sap.plc.db::basis.t_activity_price_ext";
const sItemExtTable = "sap.plc.db::basis.t_item_ext";
const sItemTemporaryExtTable = "sap.plc.db::basis.t_item_temporary_ext";
const sCostCenterExtTable = "sap.plc.db::basis.t_cost_center_ext";
const sMaterialPlantExtTable = "sap.plc.db::basis.t_material_plant_ext";
const sWorkCenterExtTable = "sap.plc.db::basis.t_work_center_ext";

const sXSCSchema = "SAP_PLC";
var oConnection = null;

const aMetadata = [
    // PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,ROLLUP_TYPE_ID,SIDE_PANEL_GROUP_ID,DISPLAY_ORDER,TABLE_DISPLAY_ORDER,REF_UOM_CURRENCY_PATH,REF_UOM_CURRENCY_BUSINESS_OBJECT,REF_UOM_CURRENCY_COLUMN_ID,DIMENSION_ID,UOM_CURRENCY_FLAG,SEMANTIC_DATA_TYPE,SEMANTIC_DATA_TYPE_ATTRIBUTES,VALIDATION_REGEX_ID,PROPERTY_TYPE,IS_IMMUTABLE_AFTER_SAVE,IS_REQUIRED_IN_MASTERDATA,IS_WILDCARD_ALLOWED,IS_USABLE_IN_FORMULA,TRIGGERS_CALC_ENGINE,RESOURCE_KEY_DISPLAY_NAME,RESOURCE_KEY_DISPLAY_DESCRIPTION,CREATED_AT,CREATED_BY_USER_ID,LAST_MODIFIED_AT,LAST_MODIFIED_BY_USER_ID
    ["Activity_Price", "Activity_Price" , "CAPR_TESTA"   ,1     ,0      ,501        ,513,          519,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Item"          , "Item"           , "CAPR_TESTA"   ,1     ,0      ,104        ,507          ,null,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Activity_Price", "Activity_Price" , "CAPR_TESTB"   ,1     ,0      ,501        ,514          ,520,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Item"          , "Item"           , "CAPR_TESTB"   ,1     ,0      ,104        ,508          ,null,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Activity_Price", "Activity_Price" , "CAPR_TESTC"   ,1     ,0      ,501        ,515          ,521,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Item"          , "Item"           , "CAPR_TESTC"   ,1     ,0      ,104        ,509          ,null,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Cost_Center"   , "Cost_Center"    , "CCEN_TEST"    ,1     ,0      ,501        ,504          ,522,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Item"          , "Item"           , "CCEN_TEST"    ,1     ,0      ,102        ,509          ,null,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"], 
    ["Cost_Center"   , "Cost_Center"    , "CCEN_TESTB"   ,1     ,0      ,501        ,505          ,523,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Item"          , "Item"           , "CCEN_TESTB"   ,1     ,0      ,102        ,510          ,null,     null,       null,       null,       null,       null,  "String",       "length=250",       null,       5,  null,       null,       null,       1,  1,  null,       null,       "2000-01-01T00:00:00.000Z",  "TestPostinstall", "2000-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Material_Plant", "Material_Plant" , "CMPL_TEST"    ,1     ,0      ,501        ,506          ,524,     null,       null,       null,       null,       null,  "Integer",       null,       null,       2,  null,       null,       null,       1,  1,  null,       null,       "2018-01-01T00:00:00.000Z",  "TestPostinstall", "2018-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Item"          , "Item"           , "CMPL_TEST"    ,1     ,0      ,110        ,525          ,null,     null,       null,       null,       null,       null,  "Integer",       null,       null,       2,  null,       null,       null,       1,  1,  null,       null,       "2018-01-01T00:00:00.000Z",  "TestPostinstall", "2018-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Item"          , "Item"           , "CWCE_TEST"    ,1     ,0      ,102        ,511          ,null,     null,       null,       null,       null,       null,  "Integer",       null,       null,       2,  null,       null,       null,       1,  1,  null,       null,       "2018-01-01T00:00:00.000Z",  "TestPostinstall", "2018-01-01T00:00:00.000Z",  "TestPostinstall"],
    ["Work_Center"   , "Work_Center"    , "CWCE_TEST"    ,1     ,0      ,504        ,501          ,null,     null,       null,       null,       null,       null,  "Integer",       null,       null,       2,  null,       null,       null,       1,  1,  null,       null,       "2018-01-01T00:00:00.000Z",  "TestPostinstall", "2018-01-01T00:00:00.000Z",  "TestPostinstall"],
];
// PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,HAS_CHILDREN,IS_ACTIVE,IS_READ_ONLY,DEFAULT_VALUE
const aMetadataItemAttributes = [
    ["Item",    "Item",     "CAPR_TESTA",    3 ,    -1,     1,      0,      0],
    ["Item",    "Item",     "CAPR_TESTB",    2 ,    -1,     1,      0,      0],
    ["Item",    "Item",     "CAPR_TESTA",    3 ,    -1,     0,      0,      0],
    ["Item",    "Item",     "CAPR_TESTB",    2 ,    -1,     0,      0,      0],
    ["Item",    "Item",     "CAPR_TESTC",    2 ,    -1,     -1,      0,      0],
    ["Item",    "Item",     "CCEN_TEST",    2 ,    -1,     -1,      0,      0],
    ["Item",    "Item",     "CCEN_TESTB",    2 ,    -1,     1,      0,      0],
    ["Item",    "Item",     "CMPL_TEST",    2 ,    -1,     1,      0,      0],
    ["Item",    "Item",     "CWCE_TEST",    2 ,    -1,     1,      0,      0],
    ["Activity_Price",    "Activity_Price",     "CAPR_TESTA",    3 ,    -1,     1,      0,      0],  
    ["Activity_Price",    "Activity_Price",     "CAPR_TESTA",    3 ,    -1,     0,      0,      0],  
    ["Activity_Price",    "Activity_Price",     "CAPR_TESTB",    2 ,    -1,     1,      0,      0],  
    ["Activity_Price",    "Activity_Price",     "CAPR_TESTC",    2 ,    -1,     1,      0,      0],  
    ["Cost_Center",    "Cost_Center",     "CCEN_TEST",    2 ,    -1,     1,      0,      0],  
    ["Cost_Center",    "Cost_Center",     "CCEN_TESTB",    2 ,    -1,     1,      0,      0],  
    ["Material_Plant",    "Material_Plant",     "CMPL_TEST",    2 ,    -1,     -1,      0,      0],  
    ["Work_Center",    "Work_Center",     "CWCE_TEST",    2 ,    -1,     -1,      0,      0] 
];
const aMetadataText = [
    // PATH;COLUMN_ID;LANGUAGE;DISPLAY_NAME;DISPLAY_DESCRIPTION;CREATED_ON;CREATED_BY;LAST_MODIFIED_ON;LAST_MODIFIED_BY
    ["Activity_Price",    "CAPR_TESTA", "EN", "Test",    "Test","2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Activity_Price",    "CAPR_TESTB", "EN", "Test",       "Test" ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Activity_Price",    "CAPR_TESTC", "EN", "Test",       "Test" ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Cost_Center",    "CCEN_TEST", "EN", "Test",      "Test"  ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Cost_Center",    "CCEN_TESTB", "EN", "Test",       "Test" ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Item",    "CAPR_TESTA", "EN", "Test",      "Test"  ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Item",    "CAPR_TESTB", "EN", "Test",      "Test"  ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Item",    "CAPR_TESTC", "EN", "Test",       "Test" ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Item",    "CCEN_TEST", "EN", "Test",       "Test" ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Item",    "CCEN_TESTB", "EN", "Test",      "Test"  ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Item",    "CMPL_TEST", "EN", "Test",      "Test"  ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Item",    "CWCE_TEST", "EN", "Test",     "Test"   ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"],
    ["Material_Plant",    "CMPL_TEST", "EN", "Test",      "Test"  ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"], 
    ["Work_Center",    "CWCE_TEST", "EN", "Test",      "Test"  ,"2000-01-01T00:00:00.000Z","Test"    ,"2000-01-01T00:00:00.000Z","TestPostinstall"]
];
const aExpectedMetadataItemAttributes = [
    // PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,SUBITEM_STATE,IS_READ_ONLY,DEFAULT_VALUE
    ["Activity_Price",    "Activity_Price",     "CAPR_TESTA",    3 ,    -1,     0,      0], 
    ["Item",    "Item",     "CAPR_TESTA",    3 ,    -1,     0,      0],
    ["Activity_Price",    "Activity_Price",     "CAPR_TESTB",    2 ,    -1,     0,      0],  
    ["Item",    "Item",     "CAPR_TESTB",    2 ,    -1,     0,      0], 
    ["Activity_Price",    "Activity_Price",     "CAPR_TESTC",    2 ,    -1,     0,      0],  
    ["Item",    "Item",     "CAPR_TESTC",    2 ,    -1,     0,      0],
    ["Cost_Center",    "Cost_Center",     "CCEN_TEST",    2 ,    -1,     0,      0],  
    ["Item",    "Item",     "CCEN_TEST",    2 ,    -1,     0,      0],
    ["Cost_Center",    "Cost_Center",     "CCEN_TESTB",    2 ,    -1,     0,      0],  
    ["Item",    "Item",     "CCEN_TESTB",    2 ,    -1,     0,      0],
    ["Item",    "Item",     "CMPL_TEST",    2 ,    -1,     0,      0],
    ["Material_Plant",    "Material_Plant",     "CMPL_TEST",    2 ,    -1,     0,      0],  
    ["Item",    "Item",     "CWCE_TEST",    2 ,    -1,     0,      0],
    ["Work_Center",    "Work_Center",     "CWCE_TEST",    2 ,    -1,     0,      0] 
];
const aExpectedMetadata = [
    ["Activity_Price", "Activity_Price" , "CAPR_TESTA"   ,1     ,0      ,501        ,513,          519,     null,       null,        null,  null,  "String",       "length=250",       null,       5, null,   null,       null,  1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Item"          , "Item"           , "CAPR_TESTA"   ,1     ,0      ,104        ,507          ,null,     null,       null,       null,  null,  "String",       "length=250",       null,       5, null,     null,       null,  1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Activity_Price", "Activity_Price" , "CAPR_TESTB"   ,1     ,0      ,501        ,514          ,520,     null,       null,        null,  null,  "String",       "length=250",       null,       5, null,     null,      null,   1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Item"          , "Item"           , "CAPR_TESTB"   ,1     ,0      ,104        ,508          ,null,     null,       null,       null,  null,  "String",       "length=250",       null,       5, null,    null,       null,  1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Activity_Price", "Activity_Price" , "CAPR_TESTC"   ,1     ,0      ,501        ,515          ,521,     null,       null,        null,  null,  "String",       "length=250",       null,       5, null,     null,       null,  1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Item"          , "Item"           , "CAPR_TESTC"   ,1     ,0      ,104        ,509          ,null,     null,       null,       null,  null,  "String",       "length=250",       null,       5, null,      null,       null,  1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Cost_Center"   , "Cost_Center"    , "CCEN_TEST"    ,1     ,0      ,501        ,504          ,522,     null,       null,        null,  null,  "String",       "length=250",       null,       5, null,       null,      null,  1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Item"          , "Item"           , "CCEN_TEST"    ,1     ,0      ,102        ,509          ,null,     null,       null,       null,  null,  "String",       "length=250",       null,       5, null,      null,       null,  1, null,       null, "TestPostinstall", "TestPostinstall"], 
    ["Cost_Center"   , "Cost_Center"    , "CCEN_TESTB"   ,1     ,0      ,501        ,505          ,523,     null,       null,        null,  null,  "String",       "length=250",       null,       5, null,      null,       null,  1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Item"          , "Item"           , "CCEN_TESTB"   ,1     ,0      ,102        ,510          ,null,     null,       null,       null,  null,  "String",       "length=250",       null,       5, null,      null,       null,  1, null,       null, "TestPostinstall", "TestPostinstall"],
    ["Item"          , "Item"           , "CMPL_TEST"    ,1     ,0      ,110        ,525          ,null,     null,       null,       null,  null,  "Integer",       null,       null,       2, null, null,         null,  1,null,       null, "TestPostinstall", "TestPostinstall"],
    ["Material_Plant", "Material_Plant" , "CMPL_TEST"    ,1     ,0      ,501        ,506          ,524,     null,       null,        null,  null,  "Integer",       null,       null,       2, null,  null,         null,  1,   null,     null, "TestPostinstall", "TestPostinstall"],
    ["Item"          , "Item"           , "CWCE_TEST"    ,1     ,0      ,102        ,511          ,null,     null,       null,       null,  null,  "Integer",       null,       null,       2, null, null,         null,  1,null,       null, "TestPostinstall", "TestPostinstall"],
    ["Work_Center"   , "Work_Center"    , "CWCE_TEST"    ,1     ,0      ,504        ,501          ,null,     null,       null,       null,  null,  "Integer",       null,       null,       2, null,      null,      null,   1,  null,      null, "TestPostinstall", "TestPostinstall"],
];

describe('migrate custom fields from XSC to XSA', ()=>{
    beforeAll(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });
    afterAll(() => {
        if (oConnection) {
            oConnection.close();
        }
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it ("insert values into t_metadata in XSC", () => {
            oConnection.executeUpdate(`INSERT INTO "${sXSCSchema}"."${sMetadataTable}" (PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,ROLLUP_TYPE_ID,SIDE_PANEL_GROUP_ID,DISPLAY_ORDER,
                                                                                        TABLE_DISPLAY_ORDER,REF_UOM_CURRENCY_PATH,REF_UOM_CURRENCY_BUSINESS_OBJECT,REF_UOM_CURRENCY_COLUMN_ID,DIMENSION_ID,
                                                                                        UOM_CURRENCY_FLAG,SEMANTIC_DATA_TYPE,SEMANTIC_DATA_TYPE_ATTRIBUTES,VALIDATION_REGEX_ID,PROPERTY_TYPE,IS_IMMUTABLE_AFTER_SAVE,
                                                                                        IS_REQUIRED_IN_MASTERDATA,IS_WILDCARD_ALLOWED,IS_USABLE_IN_FORMULA,TRIGGERS_CALC_ENGINE,RESOURCE_KEY_DISPLAY_NAME,RESOURCE_KEY_DISPLAY_DESCRIPTION,
                                                                                        CREATED_AT,CREATED_BY_USER_ID,LAST_MODIFIED_AT,LAST_MODIFIED_BY_USER_ID)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, aMetadata);
            oConnection.commit();
        });
        it ("insert values into t_metadata_item_attributes in XSC", () => {
            oConnection.executeUpdate(`INSERT INTO "${sXSCSchema}"."${sMetadataAttributesTable}" (PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,HAS_CHILDREN,IS_ACTIVE,IS_READ_ONLY,DEFAULT_VALUE)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, aMetadataItemAttributes);
            oConnection.commit();
        });

        it ("insert values into t_metadata__text in XSC", () => {
            oConnection.executeUpdate(`INSERT INTO "${sXSCSchema}"."${sMetadataTextTable}" (PATH, COLUMN_ID, LANGUAGE, DISPLAY_NAME, DISPLAY_DESCRIPTION, CREATED_AT, CREATED_BY_USER_ID, LAST_MODIFIED_AT, LAST_MODIFIED_BY_USER_ID)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, aMetadataText);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it ("Should have migrated correctly custom fields(t_metadata) from XSC to XSA", () => {
            const aMetadataXSA = oConnection.executeQuery(`select   PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,ROLLUP_TYPE_ID,SIDE_PANEL_GROUP_ID,DISPLAY_ORDER,TABLE_DISPLAY_ORDER,
                                                                    REF_UOM_CURRENCY_PATH,REF_UOM_CURRENCY_BUSINESS_OBJECT,REF_UOM_CURRENCY_COLUMN_ID,UOM_CURRENCY_FLAG,
                                                                    SEMANTIC_DATA_TYPE,SEMANTIC_DATA_TYPE_ATTRIBUTES,VALIDATION_REGEX_ID,PROPERTY_TYPE,IS_IMMUTABLE_AFTER_SAVE,
                                                                    IS_REQUIRED_IN_MASTERDATA,IS_WILDCARD_ALLOWED,IS_USABLE_IN_FORMULA,RESOURCE_KEY_DISPLAY_NAME,
                                                                    RESOURCE_KEY_DISPLAY_DESCRIPTION,CREATED_BY,LAST_MODIFIED_BY
                                                                from "${sMetadataTable}"
                                                            where IS_CUSTOM = 1 and LAST_MODIFIED_BY = 'TestPostinstall' order by COLUMN_ID, PATH`);
            aMetadataXSA.forEach((oMetadata, iIndex) => {
                expect(_.values(oMetadata).toString()).toBe(aExpectedMetadata[iIndex].toString());
            });
            expect(aMetadataXSA.length).toBe(aExpectedMetadata.length);
        });

        it ("Should have migrated correctly custom fields(t_metadata_item_attributes) from XSC to XSA ", () => {
            const aMetadataItemAttributesXSA = oConnection.executeQuery(`select PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,SUBITEM_STATE,IS_READ_ONLY,DEFAULT_VALUE
                                                                                from "${sMetadataAttributesTable}"
                                                                            where COLUMN_ID like ('%TEST%') order by COLUMN_ID, BUSINESS_OBJECT`);
            expect(aMetadataItemAttributesXSA.length).toBe(aExpectedMetadataItemAttributes.length);
            aMetadataItemAttributesXSA.forEach((oMetadataItemAttributes, iIndex) => {
                expect(_.values(oMetadataItemAttributes).toString()).toBe(aExpectedMetadataItemAttributes[iIndex].toString());
            });
        });

        it ("Should cleanup data in XSC ", () => {
           oConnection.executeUpdate(`delete from "${sXSCSchema}"."${sMetadataAttributesTable}" where COLUMN_ID like ('%TEST%')`);
           oConnection.commit();
           oConnection.executeUpdate(`delete from "${sXSCSchema}"."${sMetadataTable}"where IS_CUSTOM = 1 and LAST_MODIFIED_BY_USER_ID = 'TestPostinstall'`);
           oConnection.commit();
           oConnection.executeUpdate(`delete from "${sXSCSchema}"."${sMetadataTextTable}"where LAST_MODIFIED_BY_USER_ID = 'TestPostinstall'`);
           oConnection.commit();
        });

        it ("Should cleanup data in XSA ", () => {
            // cleanup
           oConnection.executeUpdate(`delete from "${sMetadataAttributesTable}" where COLUMN_ID like ('%TEST%')`);
           oConnection.commit();
           oConnection.executeUpdate(`delete from "${sMetadataTable}"where IS_CUSTOM = 1 and LAST_MODIFIED_BY = 'TestPostinstall'`);
           oConnection.commit();
           oConnection.executeUpdate(`delete from "${sMetadataTextTable}"where LAST_MODIFIED_BY = 'TestPostinstall'`);
           oConnection.commit();

           const sAlterPriceExt = `ALTER TABLE "${sActivityPriceExtTable}" DROP (
                CAPR_TESTA_MANUAL,
                CAPR_TESTA_UNIT,
                CAPR_TESTB_MANUAL,
                CAPR_TESTB_UNIT,
                CAPR_TESTC_MANUAL,
                CAPR_TESTC_UNIT
            )`;
            oConnection.executeUpdate(sAlterPriceExt);
            // alter t_item_ext
            const sAlterItemExt = `ALTER TABLE "${sItemExtTable}" DROP (
                CAPR_TESTA_MANUAL,
                CAPR_TESTA_UNIT,
                CAPR_TESTB_MANUAL,
                CAPR_TESTB_UNIT,
                CAPR_TESTC_MANUAL,
                CAPR_TESTC_UNIT,
                CCEN_TEST_MANUAL,
                CCEN_TEST_UNIT,
                CCEN_TESTB_MANUAL,
                CCEN_TESTB_UNIT,
                CMPL_TEST_MANUAL,
                CMPL_TEST_UNIT,
                CWCE_TEST_MANUAL,
                CWCE_TEST_UNIT
            )`;
            oConnection.executeUpdate(sAlterItemExt);
            // alter t_item_temporary_ext
            const sAlterItemTemporaryExt = `ALTER TABLE "${sItemTemporaryExtTable}" DROP (
                CAPR_TESTA_MANUAL,
                CAPR_TESTA_UNIT,
                CAPR_TESTB_MANUAL,
                CAPR_TESTB_UNIT,
                CAPR_TESTC_MANUAL,
                CAPR_TESTC_UNIT,
                CCEN_TEST_MANUAL,
                CCEN_TEST_UNIT,
                CCEN_TESTB_MANUAL,
                CCEN_TESTB_UNIT,
                CMPL_TEST_MANUAL,
                CMPL_TEST_UNIT,
                CWCE_TEST_MANUAL,
                CWCE_TEST_UNIT
            )`;
            oConnection.executeUpdate(sAlterItemTemporaryExt);
            // alter t_cost_center_ext
            const sAlterCostCenterExt = `ALTER TABLE "${sCostCenterExtTable}" DROP (
                CCEN_TEST_MANUAL,
                CCEN_TEST_UNIT,
                CCEN_TESTB_MANUAL,
                CCEN_TESTB_UNIT
            )`;
            oConnection.executeUpdate(sAlterCostCenterExt);
            // alter t_material_plant_ext
            const sAlterMaterialPlantExt = `ALTER TABLE "${sMaterialPlantExtTable}" DROP (
                CMPL_TEST_MANUAL,
                CMPL_TEST_UNIT
            )`;
            oConnection.executeUpdate(sAlterMaterialPlantExt);
            // alter t_work_center_ext
            const sAlterWorkCenterExt = `ALTER TABLE "${sWorkCenterExtTable}" DROP (
                CWCE_TEST_MANUAL,
                CWCE_TEST_UNIT
            )`;
            oConnection.executeUpdate(sAlterWorkCenterExt);
        });
    }
});