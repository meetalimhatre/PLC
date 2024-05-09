const sXSCSchema = "SAP_PLC";
const sXSATableName =  "sap.plc.db::basis.t_material_price";
const sXSCTableName = "sap.plc.db::basis.t_price";
const sXSAExtTableName =  "sap.plc.db::basis.t_material_price_ext";
const sXSCExtTableName = "sap.plc.db::basis.t_price_ext";
const sMetadataTable = "sap.plc.db::basis.t_metadata";
const sMetadataTextTable = "sap.plc.db::basis.t_metadata__text";
var oConnection = null;

// Prices 1,2 and 5 should have the same PRICE_ID after migration, since the have the same key: PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM, VALID_FROM_QUANTITY
// Prices 2 and 3 should have a different key since they are unique
// so the migration would generate only 3 different PRICE_IDs
const aPriceTestData = [
    /*1*/["TEST_P", "#100-110", "#PT1", "#VD1", "123","1234","50.0000000", "*", "*", "2015-01-01T00:00:00.000Z", "2999-12-31T00:00:00.000Z", "1.0000000", "100.0000000", "0.0000000", "EUR", "1.0000000", "H", "2000-01-01T00:00:00", "2010-01-01T00:00:00", 1, "User1"],
    /*2*/["TEST_P", "#100-110", "#PT1", "#VD1", "123","1234","50.0000000", "*", "*", "2015-01-01T00:00:00.000Z", "2999-12-31T00:00:00.000Z", "1.0000000", "200.0000000", "10.0000000", "EUR", "2.0000000", "H", "2005-01-01T00:00:00", "2020-01-01T00:00:00", 1, "User2"],
    /*3*/["TEST_P", "#100-100", "#PT3", "*", "123","1234","50.0000000", "P1", "*", "2015-01-01T00:00:00.000Z", "2999-12-31T00:00:00.000Z", "3.0000000", "300.0000000", "11.0000000", "UDS", "2.0000000", "PC", "2010-01-01T00:00:00", null, 1, "TestUser"],
    /*4*/["TEST_P", "#100-210", "#PT4", "*", "123","1234","50.0000000", "P100", "*", "2015-01-01T00:00:00.000Z", "2999-12-31T00:00:00.000Z", "4.0000000", "400.0000000", "20.0000000", "BRL", "1.0000000", "MIN", "2015-01-01T00:00:00", null, 1, "TestUser"],
    /*5*/["TEST_P", "#100-110", "#PT1", "#VD1", "123","1234","50.0000000", "*", "*", "2015-01-01T00:00:00.000Z", "2999-12-31T00:00:00.000Z", "1.0000000", "500.0000000", "0.0000000", "EUR", "2.0000000", "H", "2020-01-01T00:00:00", null, 1, "User2"],
];
const aPriceExtTestData = [
    /*1*/["TEST_P", "#100-110", "#PT1", "#VD1", "*", "*", "2015-01-01T00:00:00.000Z","1.0000000", "2000-01-01T00:00:00"],
    /*2*/["TEST_P", "#100-110", "#PT1", "#VD1", "*", "*", "2015-01-01T00:00:00.000Z","1.0000000", "2005-01-01T00:00:00"],
    /*3*/["TEST_P", "#100-100", "#PT3", "*", "P1", "*", "2015-01-01T00:00:00.000Z","3.0000000", "2010-01-01T00:00:00"],
    /*4*/["TEST_P", "#100-210", "#PT4", "*", "P100", "*", "2015-01-01T00:00:00.000Z","4.0000000", "2015-01-01T00:00:00"],
    /*5*/["TEST_P", "#100-110", "#PT1", "#VD1", "*", "*", "2015-01-01T00:00:00.000Z","1.0000000", "2020-01-01T00:00:00"],
];
const aMetadata = [
    ["Material_Price", "Material_Price", "CMPR_TEST", 1, 0, "String", "length=250", 0, "TEST_P"],
    ["Item", "Item", "CMPR_TEST", 1, 0, "String", "length=250", 0, "TEST_P"],
];
const aMetadataText = [
    ["Material_Price", "CMPR_TEST", "EN", "Abc", "TEST_P"],
    ["Item", "CMPR_TEST", "EN", "Abc", "TEST_P"],
];
describe('migrate t_price and t_price_ext from XSC to XSA', ()=>{
    beforeAll(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    afterAll(() => {
        if (oConnection) {
            oConnection.close();
        }
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it ("insert data into XSC table: t_price", () => {
            const sInsertStatement = `INSERT INTO "${sXSCSchema}"."${sXSCTableName}" 
                                            (PRICE_SOURCE_ID,MATERIAL_ID,PLANT_ID,VENDOR_ID,PURCHASING_GROUP,PURCHASING_DOCUMENT,LOCAL_CONTENT,PROJECT_ID,CUSTOMER_ID,VALID_FROM,VALID_TO,
                                            VALID_FROM_QUANTITY,PRICE_FIXED_PORTION,PRICE_VARIABLE_PORTION,PRICE_TRANSACTION_CURRENCY_ID,PRICE_UNIT,
                                            PRICE_UNIT_UOM_ID,_VALID_FROM,_VALID_TO,_SOURCE,_CREATED_BY_USER_ID)
                                      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            oConnection.executeUpdate(sInsertStatement, aPriceTestData);
            oConnection.commit();
        });
        it ("insert custom fields into XSC tables: t_metatada, t_price_ext, t_metadata__text", () => {
            // insert test data into t_metadata
            oConnection.executeUpdate(`upsert "${sXSCSchema}"."${sMetadataTable}" (PATH, BUSINESS_OBJECT, COLUMN_ID, IS_CUSTOM, ROLLUP_TYPE_ID, SEMANTIC_DATA_TYPE, SEMANTIC_DATA_TYPE_ATTRIBUTES, UOM_CURRENCY_FLAG, LAST_MODIFIED_BY_USER_ID) values (?, ?, ?, ?, ?, ?, ?, ?, ?) with primary key`, aMetadata);
            oConnection.executeUpdate(`upsert "${sXSCSchema}"."${sMetadataTextTable}" (PATH, COLUMN_ID, LANGUAGE, DISPLAY_NAME, LAST_MODIFIED_BY_USER_ID) values (?, ?, ?, ?, ?) with primary key`, aMetadataText);
            const sAlterPriceExt = `ALTER TABLE "${sXSCSchema}"."${sXSCExtTableName}" ADD (
                CMPR_TEST_MANUAL  nvarchar(250),
                CMPR_TEST_UNIT  nvarchar(3)
            )`;
            oConnection.executeUpdate(sAlterPriceExt);
            const sInsertStatement = `INSERT INTO "${sXSCSchema}"."${sXSCExtTableName}" 
                                            (PRICE_SOURCE_ID,MATERIAL_ID,PLANT_ID,VENDOR_ID,PROJECT_ID,CUSTOMER_ID,VALID_FROM,VALID_FROM_QUANTITY,_VALID_FROM)
                                      VALUES(?,?,?,?,?,?,?,?,?)`;           
            oConnection.executeUpdate(sInsertStatement, aPriceExtTestData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it ("check tables t_material_price and t_material_price_ext from XSA", () => {
            const aPricesXSA = oConnection.executeQuery(`select PRICE_SOURCE_ID,MATERIAL_ID,PLANT_ID,VENDOR_ID,PURCHASING_GROUP,PURCHASING_DOCUMENT,LOCAL_CONTENT,PROJECT_ID,CUSTOMER_ID,VALID_FROM,VALID_TO,
                                                                VALID_FROM_QUANTITY,PRICE_FIXED_PORTION,PRICE_VARIABLE_PORTION,TRANSACTION_CURRENCY_ID,PRICE_UNIT,
                                                                PRICE_UNIT_UOM_ID,_VALID_FROM,_VALID_TO,_SOURCE,_CREATED_BY
                                                        from "${sXSATableName}" where PRICE_SOURCE_ID = 'TEST_P'
                                                        order by _VALID_FROM`);
            expect(aPricesXSA.length).toEqual(aPriceTestData.length);
            aPricesXSA.forEach((oPrice, iIndex) => {
                const aPriceKeys = ["PRICE_SOURCE_ID","MATERIAL_ID","PLANT_ID","VENDOR_ID","PURCHASING_GROUP","PURCHASING_DOCUMENT","LOCAL_CONTENT","PROJECT_ID",
                                    "CUSTOMER_ID","VALID_FROM","VALID_TO","VALID_FROM_QUANTITY","PRICE_FIXED_PORTION","PRICE_VARIABLE_PORTION","TRANSACTION_CURRENCY_ID",
                                    "PRICE_UNIT","PRICE_UNIT_UOM_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"];
                aPriceKeys.forEach((sKey, sKeyIndex) => {
                    if (sKey !== "VALID_FROM" && sKey !== "VALID_TO" && sKey !== "_VALID_FROM" && sKey !== "_VALID_TO") {
                        expect(oPrice[sKey]).toBe(aPriceTestData[iIndex][sKeyIndex]);
                    }
                });
            });
            // check PRICE_ID was set correctly
            let aPriceIdXSA = oConnection.executeQuery(`select PRICE_ID, _VALID_FROM from "${sXSATableName}"
                                                        where PRICE_SOURCE_ID = 'TEST_P'
                                                        order by _VALID_FROM`);
            expect(aPriceIdXSA[0].PRICE_ID).toBe(aPriceIdXSA[1].PRICE_ID);
            expect(aPriceIdXSA[0].PRICE_ID).toBe(aPriceIdXSA[4].PRICE_ID);
            expect(aPriceIdXSA[0].PRICE_ID).not.toBe(aPriceIdXSA[2].PRICE_ID);
            expect(aPriceIdXSA[2].PRICE_ID).not.toBe(aPriceIdXSA[3].PRICE_ID);

            // check custom fields were migrated correctly
            const aPricesExtXSA = oConnection.executeQuery(`select priceExt.PRICE_ID, priceExt._VALID_FROM, priceExt.CMPR_TEST_MANUAL, priceExt.CMPR_TEST_UNIT
                                                            from "${sXSAExtTableName}" AS priceExt
                                                            INNER JOIN "${sXSATableName}" as price
                                                                ON  price.PRICE_ID = priceExt.PRICE_ID                                 
                                                                AND price._VALID_FROM = priceExt._VALID_FROM
                                                            where price.PRICE_SOURCE_ID = 'TEST_P'
                                                            order by price._VALID_FROM`);
            expect(aPricesExtXSA.length).toEqual(aPricesXSA.length);
            // check PRICE_ID was set correctly
            aPricesExtXSA.forEach((oPriceId, iIndex) => {
                expect(oPriceId.PRICE_ID).toBe(aPriceIdXSA[iIndex].PRICE_ID);
                expect(oPriceId._VALID_FROM.toString()).toBe(aPriceIdXSA[iIndex]._VALID_FROM.toString());
            });
        });
        it ("should clean the test data", () => {
            const aTablesToClean = ["sap.plc.db::basis.t_price", "sap.plc.db::basis.t_metadata", "sap.plc.db::basis.t_metadata__text"];
            const aConditionXSC = ["PRICE_SOURCE_ID", "LAST_MODIFIED_BY_USER_ID", "LAST_MODIFIED_BY_USER_ID" ];
            aTablesToClean.forEach((sTable, iConditionIndex) => {
                const sStmt = `delete from "${sXSCSchema}"."${sTable}" where ${aConditionXSC[iConditionIndex]} = 'TEST_P'`;
                oConnection.executeUpdate(sStmt);
            });
            const aConditionXSA = ["PRICE_SOURCE_ID", "LAST_MODIFIED_BY", "LAST_MODIFIED_BY" ];
            const aXSATablesToClean = ["sap.plc.db::basis.t_material_price", "sap.plc.db::basis.t_metadata", "sap.plc.db::basis.t_metadata__text"];
            aXSATablesToClean.forEach((sTable, iConditionIndex) => {
                const sStmt = `delete from "${sTable}" where ${aConditionXSA[iConditionIndex]} = 'TEST_P'`;
                oConnection.executeUpdate(sStmt);
            });
            const sAlterPriceExt = `ALTER TABLE "${sXSCSchema}"."${sXSCExtTableName}" DROP (
                CMPR_TEST_MANUAL,
                CMPR_TEST_UNIT
            )`;
            oConnection.executeUpdate(sAlterPriceExt);
            const sAlterPriceExtXSA = `ALTER TABLE "${sXSAExtTableName}" DROP (
                CMPR_TEST_MANUAL,
                CMPR_TEST_UNIT
            )`;
            oConnection.executeUpdate(sAlterPriceExtXSA);
        });
    }
});