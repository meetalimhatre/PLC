const sFormulaTable = "sap.plc.db::basis.t_formula";
const _ = require("lodash");

var oConnection = null;
const aFormulaId = [100, 110, 120, 130, 140, 150, 160];
const aFormulaData = [
    [aFormulaId[0], "Item", "Item", "CUST_INT_FORMULA", 1, 1, "ABS($CUST_DECIMAL_WITHOUT_REF)*2", ""],
    [aFormulaId[1], "Item", "Item", "QUANTITY_FOR_ONE_ASSEMBLY", 1, 1, "$CUST_INT_FORMULA + 1", ""],
    [aFormulaId[2], "Item", "Item", "QUANTITY_FOR_ONE_ASSEMBLY", 1, 1, "$CUST_INT_FORMULA + 1", ""],
    [aFormulaId[3], "Item", "Item", "COSTING_LOT_SIZE", 1, 1, "ABS($CUST_DECIMAL_WITHOUT_REF)*2", ""],
    [aFormulaId[4], "Item", "Item", "COSTING_LOT_SIZE", 1, 1, "IF (IS_INTERNAL_ACTIVITY(); 2; 1)", ""],
    [aFormulaId[5], "Item", "Item", "COSTING_LOT_SIZE", 1, 1, "IF (IS_EXTERNAL_ACTIVITY(); 5; 1)", ""],
    [aFormulaId[6], "Item", "Item", "PRICE_FIXED_PORTION", 1, 1, "IF (IS_MATERIAL(); 10; 1)", ""],
];

const aExpectedFormulaData = [
    [aFormulaId[0], "Item", "Item", "CUST_INT_FORMULA", 1, 1, "ABS($CUST_DECIMAL_WITHOUT_REF)*2", ""],
    [aFormulaId[1], "Item", "Item", "QUANTITY", 1, 1, "$CUST_INT_FORMULA + 1", ""],
    [aFormulaId[2], "Item", "Item", "QUANTITY", 1, 1, "$CUST_INT_FORMULA + 1", ""],
    [aFormulaId[3], "Item", "Item", "LOT_SIZE", 1, 1, "ABS($CUST_DECIMAL_WITHOUT_REF)*2", ""],
    [aFormulaId[4], "Item", "Item", "LOT_SIZE", 1, 1, "IF (IS_INTERNAL_ACTIVITY(); 2; 1)", ""],
    [aFormulaId[5], "Item", "Item", "LOT_SIZE", 1, 1, "IF (IS_EXTERNAL_ACTIVITY(); 5; 1)", ""],
    [aFormulaId[6], "Item", "Item", "PRICE_FIXED_PORTION", 1, 1, "IF (IS_MATERIAL(); 10; 1)", ""],
];
describe('rename COLUMN_ID in t_formula table', ()=>{
    beforeAll(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    afterAll(() => {
        if (oConnection) {
            oConnection.close();
        }
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it ("insert values into t_formula", () => {
            oConnection.executeUpdate(`INSERT INTO "${sFormulaTable}" (FORMULA_ID, PATH, BUSINESS_OBJECT, COLUMN_ID, ITEM_CATEGORY_ID, IS_FORMULA_USED, FORMULA_STRING, FORMULA_DESCRIPTION)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, aFormulaData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it ("Should have updated the COLUMN_ID to QUANTITY/LOT_SIZE when it's value is QUANTITY_FOR_ONE_ASSEMBLY/COSTING_LOT_SIZE", () => {
            const aFormulasXSA = oConnection.executeQuery(`select FORMULA_ID, PATH, BUSINESS_OBJECT, COLUMN_ID, ITEM_CATEGORY_ID, IS_FORMULA_USED, FORMULA_STRING, FORMULA_DESCRIPTION
                                                                from "${sFormulaTable}"
                                                            where FORMULA_ID in (${aFormulaId.join()}) order by FORMULA_ID`);
            aFormulasXSA.forEach((oFormula, iIndex) => {
                expect(_.values(oFormula).toString()).toBe(aExpectedFormulaData[iIndex].toString());
            });
            // cleanup
            oConnection.executeUpdate(`delete from "${sFormulaTable}" where FORMULA_ID in (${aFormulaId.join()})`);
            oConnection.commit();
        });
    }
});