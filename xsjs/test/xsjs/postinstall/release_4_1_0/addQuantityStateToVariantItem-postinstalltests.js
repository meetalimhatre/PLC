const sVariantItemTable = "sap.plc.db::basis.t_variant_item";
const sVariantTable = "sap.plc.db::basis.t_variant";
const sItemTable = "sap.plc.db::basis.t_item";
const oVariantItem = require("../../../testdata/testdata").data.oVariantItemTestData;
var oConnection = null;

describe("Add quantity calculated and quantity state to variant item", () => {
    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        const sExpectedDate = new Date().toJSON();
        const sTestUser = $.session.getUsername();
        const oItemTestData = [
            [ 3001, 100, null, 1, 0, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [ 3002, 100, 3001, 1, 0, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [ 3003, 100, 3002, 1, 0, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [ 5001, 200, null, 1, 0, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [ 5001, 200, 5001, 1, 0, sExpectedDate, sTestUser, sExpectedDate, sTestUser ]
        ];
        const oVariantItemTestData = [
            [ 10, 3001, 1 ],
            [ 10, 3002, 1 ],
            [ 10, 3003, 1 ],
            [ 20, 5001, 1 ],
            [ 20, 5001, 1 ]
        ];
        const oVariantTestData = [
            [10, 100, "STANDARD", "EUR", 1 ],
            [20, 200, "STANDARD", "EUR", 1 ],
        ];
        it("Prepare the variant item table", () => {
            oConnection.executeUpdate(`INSERT INTO "${sItemTable}" (ITEM_ID, CALCULATION_VERSION_ID, PARENT_ITEM_ID, IS_ACTIVE, ITEM_CATEGORY_ID, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, oItemTestData);
            oConnection.executeUpdate(`INSERT INTO "${sVariantItemTable}" (VARIANT_ID, ITEM_ID, IS_INCLUDED)
                                       VALUES (?, ?, ?)`, oVariantItemTestData);
            oConnection.executeUpdate(`INSERT INTO "${sVariantTable}" (VARIANT_ID, CALCULATION_VERSION_ID, EXCHANGE_RATE_TYPE_ID, REPORT_CURRENCY_ID, IS_SELECTED)
                                       VALUES (?, ?, ?, ?, ?)`, oVariantTestData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should update the variant item table with two new columns", () => {
            let aVariantItemAfterQCalculated = oConnection.executeQuery(`SELECT QUANTITY_CALCULATED FROM "${sVariantItemTable}" WHERE VARIANT_ID IN (10, 20)`);
            let aVariantItemAfterQState = oConnection.executeQuery(`SELECT QUANTITY_STATE FROM "${sVariantItemTable}" WHERE VARIANT_ID IN (10, 20)`);
            aVariantItemAfterQCalculated = aVariantItemAfterQCalculated.map(iValue => iValue.QUANTITY_CALCULATED);
            aVariantItemAfterQState = aVariantItemAfterQState.map(iValue => iValue.QUANTITY_STATE !== null ? parseInt(iValue.QUANTITY_STATE) : iValue.QUANTITY_STATE);
            expect(aVariantItemAfterQCalculated).toEqual([null, null, null, null]);
            expect(aVariantItemAfterQState).toEqual([1, 1, 1, 1]);
        });
    }

});