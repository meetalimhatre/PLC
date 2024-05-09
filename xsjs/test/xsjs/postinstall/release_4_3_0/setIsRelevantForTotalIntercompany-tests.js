const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const SetIsRelevantForTotalIntercompany = $.import("xs.postinstall.release_4_3_0", "setIsRelevantForTotalIntercompany");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("setIsRelevantForTotalIntercompany-tests", () => {
    var sExpectedDate = new Date().toJSON();

    const oCostingSheetRowTestData = {
        "COSTING_SHEET_ROW_ID" : [1, 2, 3, 4, 5, 6],
        "COSTING_SHEET_ID": [1, 2, 3, 1, 2, 3],
        "COSTING_SHEET_ROW_TYPE": [4, 1, 2, 3, 2, 1],
        "CALCULATION_ORDER": [1, 2, 3, 4, 5, 6],
        "_VALID_FROM": [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate]
    };

    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                costing_sheet_row: {
                    name: "sap.plc.db::basis.t_costing_sheet_row",
                    data: oCostingSheetRowTestData
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should set IS_RELEVANT_FOR_TOTAL2 and IS_RELEVANT_FOR_TOTAL3 to 1 from t_costing_sheet_row table, for base rows", () => {
        // arrange

        // act
        SetIsRelevantForTotalIntercompany.run(jasmine.dbConnection);

        // assert
        var oIsReleventForTotal2NotZero = oMockstar.execQuery(`select COUNT("IS_RELEVANT_FOR_TOTAL2") as ROWCOUNT from {{costing_sheet_row}} where "IS_RELEVANT_FOR_TOTAL2" = 1;`);
        var oIsReleventForTotal2Zero = oMockstar.execQuery(`select COUNT("IS_RELEVANT_FOR_TOTAL2") as ROWCOUNT from {{costing_sheet_row}} where "IS_RELEVANT_FOR_TOTAL2" = 0;`);
        var oIsReleventForTotal3NotZero = oMockstar.execQuery(`select COUNT("IS_RELEVANT_FOR_TOTAL3") as ROWCOUNT from {{costing_sheet_row}} where "IS_RELEVANT_FOR_TOTAL3" = 1;`);
        var oIsReleventForTotal3Zero = oMockstar.execQuery(`select COUNT("IS_RELEVANT_FOR_TOTAL3") as ROWCOUNT from {{costing_sheet_row}} where "IS_RELEVANT_FOR_TOTAL3" = 0;`);
        expect(oIsReleventForTotal2NotZero.columns.ROWCOUNT.rows[0]).toBe(4);
        expect(oIsReleventForTotal2Zero.columns.ROWCOUNT.rows[0]).toBe(2);
        expect(oIsReleventForTotal3NotZero.columns.ROWCOUNT.rows[0]).toBe(4);
        expect(oIsReleventForTotal3Zero.columns.ROWCOUNT.rows[0]).toBe(2);
    });

}).addTags(["All_Unit_Tests"]); 
