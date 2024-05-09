const sItemTable = "sap.plc.db::basis.t_item";
const sItemTemporaryTable = "sap.plc.db::basis.t_item_temporary";

var oConnection = null;

var user = $.session.getUsername();
var iCalculationVersionId = 4350;
var sExpectedDate = new Date().toISOString();
var sTestUser = $.session.getUsername();

describe("Sets value for determined_account_id to have account_id value", () => {

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        var oItemTestData = [
            [3001, iCalculationVersionId, "0", 0, 1, sExpectedDate, sTestUser, sExpectedDate, sTestUser],
            [3002, iCalculationVersionId, "0", 0, 1, sExpectedDate, sTestUser, sExpectedDate, sTestUser],
            [3003, iCalculationVersionId, "625000", 0, 1, sExpectedDate, sTestUser, sExpectedDate, sTestUser],
            [5001, iCalculationVersionId, "0", 0, 1, sExpectedDate, sTestUser, sExpectedDate, sTestUser],
            [7001, 5809, "0", 0, 1, sExpectedDate, sTestUser, sExpectedDate, sTestUser],
        ]

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`DELETE from "${sItemTable}"`)

            oConnection.executeUpdate(`INSERT INTO "${sItemTable}" (ITEM_ID, CALCULATION_VERSION_ID, ACCOUNT_ID, IS_ACTIVE, ITEM_CATEGORY_ID, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, oItemTestData);

            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("determined_account_id should match account_id", () => {

            var oExpectedDeterminedAccId = {
                "DETERMINED_ACCOUNT_ID": ["0", "0", "625000", "0", "0"],
                "ITEM_ID": [3001, 3002, 3003, 5001, 7001],
                "CALCULATION_VERSION_ID": [iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 5809],
            };

            const oActualDeterminedAccId = oConnection.executeQuery(`SELECT ITEM_ID, CALCULATION_VERSION_ID, DETERMINED_ACCOUNT_ID FROM "${sItemTable}"`);

            expect(oActualDeterminedAccId.length).toBe(5);
            expect(oActualDeterminedAccId).toMatchData(oExpectedDeterminedAccId, ["ITEM_ID", "CALCULATION_VERSION_ID"]);

            oConnection.executeUpdate(`DELETE FROM "${sItemTable}"`);

            oConnection.commit();
        });
    }
});