const testData = require("../../../testdata/testdata").data;
const XSCPlcSchema = "SAP_PLC";

describe("Remove total quantity from variant to the root item", () => {

    const oTables = {
        "Variant" : "sap.plc.db::basis.t_variant",
        "VariantItems" : "sap.plc.db::basis.t_variant_item",
        "CalculationVersion" : "sap.plc.db::basis.t_calculation_version"
    };

    const aVariantsData = [
        [11, 2809, "STANDARD", "EUR", 1, 100.5000000, "PC"],
        [22, 4809, "STANDARD", "EUR", 1, 200.5000000, "PC"],
        [33, 5809, "STANDARD", "EUR", 1, 300.5000000, "PC"]
    ];

    const aCalculationVersionData = [
        [2809, 1978, "VariantTestVersion1", 4, 3001, "EUR", "2011-08-20T00:00:00.000Z", "2011-08-20T00:00:00.000Z", testData.sTestUser, testData.oTomorrow],
        [4809, 1978, "VariantTestVersion2", 4, 4001, "EUR", "2011-08-20T00:00:00.000Z", "2011-08-20T00:00:00.000Z", testData.sTestUser, testData.oTomorrow],
        [5809, 1978, "VariantTestVersion3", 4, 5001, "EUR", "2011-08-20T00:00:00.000Z", "2011-08-20T00:00:00.000Z", testData.sTestUser, testData.oTomorrow]
    ];

    const aVariantItemData = [
        [11, 3001, 1,5555555],
        [22, 4001, 1,6666666],
        [33, 5001, 1,7777777]
    ];

    const aRootItemIds = [3001, 4001, 5001];

    const aExpectedData = [
        {
            "ITEM_ID": 3001, 
            "VARIANT_ID": 11,           
            "QUANTITY": "100.5000000",
            "QUANTITY_UOM_ID":"PC",
            "TOTAL_QUANTITY":"100.5000000"
        },
        {
            "ITEM_ID": 4001, 
            "VARIANT_ID": 22,           
            "QUANTITY": "200.5000000",
            "QUANTITY_UOM_ID":"PC",
            "TOTAL_QUANTITY":"200.5000000"
        },
        {
            "ITEM_ID": 5001, 
            "VARIANT_ID": 33,           
            "QUANTITY": "300.5000000",
            "QUANTITY_UOM_ID":"PC",
            "TOTAL_QUANTITY":"300.5000000"
        }
    ];

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
        clearTables(oConnection);
    });

    function clearTables(oConnection){
        //Clear data
        oConnection.executeUpdate(`DELETE from ${XSCPlcSchema}."${oTables.Variant}"`);
        oConnection.executeUpdate(`DELETE from ${XSCPlcSchema}."${oTables.VariantItems}"`);
        oConnection.executeUpdate(`DELETE from ${XSCPlcSchema}."${oTables.CalculationVersion}"`);

        oConnection.commit();
    }


    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it("Insert data in tables", () => {
            // Insert test data
            oConnection.executeUpdate(`INSERT INTO ${XSCPlcSchema}."${oTables.Variant}"("VARIANT_ID", "CALCULATION_VERSION_ID", "EXCHANGE_RATE_TYPE_ID", "REPORT_CURRENCY_ID", "IS_SELECTED", "TOTAL_QUANTITY", "TOTAL_QUANTITY_UOM_ID") VALUES (?,?,?,?,?,?,?)`, aVariantsData);
            oConnection.executeUpdate(`INSERT INTO ${XSCPlcSchema}."${oTables.CalculationVersion}"("CALCULATION_VERSION_ID", "CALCULATION_ID","CALCULATION_VERSION_NAME", "CALCULATION_VERSION_TYPE", "ROOT_ITEM_ID", "REPORT_CURRENCY_ID", "VALUATION_DATE", "LAST_SAVED_AT", "LAST_SAVED_BY_USER_ID", "MASTER_DATA_TIMESTAMP") VALUES (?,?,?,?,?,?,?,?,?,?)`, aCalculationVersionData);
            oConnection.executeUpdate(`INSERT INTO ${XSCPlcSchema}."${oTables.VariantItems}"("VARIANT_ID", "ITEM_ID", "IS_INCLUDED", "TOTAL_COST") VALUES (?,?,?,?)`, aVariantItemData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("Should have moved the total quantity from variant headear to root item", () => {
            const rootItemsAfterUpdate = jasmine.dbConnection.executeQuery(`select ITEM_ID, VARIANT_ID, QUANTITY, QUANTITY_UOM_ID, TOTAL_QUANTITY from "${oTables.VariantItems}" where ITEM_ID in (${aRootItemIds})`);
        
            expect(rootItemsAfterUpdate).toMatchData(aExpectedData, ["ITEM_ID"]);

            clearTables(oConnection);
        });
    }
});