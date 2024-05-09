const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const renameColumnIdFormula = $.import("xs.postinstall.release_4_0_0", "rename_formula_column_id");
const sXSCSchema = "SAP_PLC";
const _ = require("lodash");

describe("rename_formula_column_id-tests", () => {
    let oMockstar;

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            schema: sXSCSchema,
            substituteTables: {
                formula: "sap.plc.db::basis.t_formula",
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
    });

    it("should rename COSTING_LOT_SIZE to LOT_SIZE, QUANTITY_FOR_ONE_ASSEMBLY to QUANTITY when appears as value in field COLUMN_ID", () => {
        // arrange
        const oFormula = {
            FORMULA_ID: [0, 1, 2, 3, 4, 5, 6],
            PATH: ["Item", "Item", "Item", "Item", "Item", "Item", "Item"],
            BUSINESS_OBJECT: ["Item", "Item", "Item", "Item", "Item", "Item", "Item"],
            COLUMN_ID: ["CUST_INT_FORMULA", "QUANTITY_FOR_ONE_ASSEMBLY", "QUANTITY_FOR_ONE_ASSEMBLY", "COSTING_LOT_SIZE", "COSTING_LOT_SIZE", "COSTING_LOT_SIZE", "PRICE_FIXED_PORTION"],
            ITEM_CATEGORY_ID: [1, 1, 2, 2, 1, 3, 1],
            IS_FORMULA_USED: [1, 1, 1, 1, 1, 1, 1],
            FORMULA_STRING: ["ABS($CUST_DECIMAL_WITHOUT_REF)*2", "$CUST_INT_FORMULA + 1", "$CUST_INT_FORMULA + 1", "ABS($CUST_DECIMAL_WITHOUT_REF)*2",
                "IF (IS_INTERNAL_ACTIVITY(); 2; 1)", "IF (IS_EXTERNAL_ACTIVITY(); 5; 1)", "IF (IS_MATERIAL(); 10; 1)"],
            FORMULA_DESCRIPTION: ["", "", "", "", "", "", ""],
        };

        oMockstar.insertTableData("formula", oFormula);
        jasmine.dbConnection.commit();

        // act
        renameColumnIdFormula.run(jasmine.dbConnection);

        // assert
        const oFormulaAfter = oMockstar.execQuery(` select FORMULA_ID, PATH, BUSINESS_OBJECT, ITEM_CATEGORY_ID, IS_FORMULA_USED, FORMULA_STRING, FORMULA_DESCRIPTION
                                                      from {{formula}}
                                                    where FORMULA_ID in (${oFormula.FORMULA_ID}) order by FORMULA_ID`);
        expect(oFormulaAfter).toMatchData(_.omit(oFormula, "COLUMN_ID"), ["FORMULA_ID", "PATH", "BUSINESS_OBJECT", "ITEM_CATEGORY_ID", "IS_FORMULA_USED", "FORMULA_STRING"]);

        const aFormulaColumnIdAfter = oMockstar.execQuery(`select COLUMN_ID from {{formula}} where FORMULA_ID in (${oFormula.FORMULA_ID}) order by FORMULA_ID`).columns.COLUMN_ID.rows;
        const aExpectedColumnId = ["CUST_INT_FORMULA", "QUANTITY", "QUANTITY", "LOT_SIZE", "LOT_SIZE", "LOT_SIZE", "PRICE_FIXED_PORTION"];
        expect(aFormulaColumnIdAfter.join()).toBe(aExpectedColumnId.join());
    });
}).addTags(["All_Unit_Tests"]);
