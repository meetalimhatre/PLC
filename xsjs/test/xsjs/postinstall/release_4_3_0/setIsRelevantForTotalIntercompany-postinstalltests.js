const sCostingSheetRowTable = "sap.plc.db::basis.t_costing_sheet_row";
const sPostinstallTestUser = "POSTINSTALL_TEST_USER";
var oConnection = null;

describe("Set IS_RELEVANT_FOR_TOTAL2/3 to 1 for base rows", () => {
    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        var sExpectedDate = new Date("2019-08-20T00:00:00.000Z").toJSON();
        const oCostingSheetRowTestData = [
            [1, 1, 3, 1, sExpectedDate, sPostinstallTestUser],
            [2, 2, 1, 2, sExpectedDate, sPostinstallTestUser],
            [3, 3, 2, 3, sExpectedDate, sPostinstallTestUser],
            [4, 1, 4, 4, sExpectedDate, sPostinstallTestUser],
            [5, 2, 2, 5, sExpectedDate, sPostinstallTestUser],
            [6, 3, 1, 6, sExpectedDate, sPostinstallTestUser]
        ];

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`delete from "${sCostingSheetRowTable}" where "_CREATED_BY" = '${sPostinstallTestUser}';`);
            oConnection.executeUpdate(`INSERT INTO "${sCostingSheetRowTable}" (COSTING_SHEET_ROW_ID, COSTING_SHEET_ID, COSTING_SHEET_ROW_TYPE, CALCULATION_ORDER, _VALID_FROM, _CREATED_BY)
                                       VALUES (?, ?, ?, ?, ?, ?)`, oCostingSheetRowTestData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should set IS_RELEVANT_FOR_TOTAL2/3 to 1 from t_costing_sheet_row table, for base rows", () => {
            var oIsReleventForTotal2NotZero = oConnection.executeQuery(`select * from "${sCostingSheetRowTable}" where "IS_RELEVANT_FOR_TOTAL2" = 1;`);
            var oIsReleventForTotal2Zero = oConnection.executeQuery(`select * from "${sCostingSheetRowTable}" where "IS_RELEVANT_FOR_TOTAL2" = 0;`);
            var oIsReleventForTotal3NotZero = oConnection.executeQuery(`select * from "${sCostingSheetRowTable}" where "IS_RELEVANT_FOR_TOTAL3" = 1;`);
            var oIsReleventForTotal3Zero = oConnection.executeQuery(`select * from "${sCostingSheetRowTable}" where "IS_RELEVANT_FOR_TOTAL3" = 0;`);

            expect(oIsReleventForTotal2NotZero.length).toBe(4);
            expect(oIsReleventForTotal4Zero.length).toBe(2);
            expect(oIsReleventForTotal3NotZero.length).toBe(4);
            expect(oIsReleventForTotal3Zero.length).toBe(2);
            
            oConnection.executeUpdate(`delete from "${sCostingSheetRowTable}" where "_CREATED_BY" = '${sPostinstallTestUser}';`);
        });
    }

});
