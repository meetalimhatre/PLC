var mockstar_helpers = require("../../../testtools/mockstar_helpers");

const sItemTable = "sap.plc.db::basis.t_item";
const sCostingSheetBaseRowTable = "sap.plc.db::basis.t_costing_sheet_base_row";

var oConnection = null;

var user = $.session.getUsername();
var sExpectedDate = new Date().toISOString();
var sTestUser = $.session.getUsername();

describe("Set CHILD_ITEM_CATEGORY_ID to ITEM_CATEGORY_ID", () => {

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        const oItemTestData = [
            [ 3001, 100, null, 1, 0, -1, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [ 3002, 100, 3001, 1, 1, -1, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [ 3003, 100, 3002, 1, 2, -1, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [ 5001, 200, null, 1, 3, -1, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [ 7001, 200, 5001, 1, 4, -1, sExpectedDate, sTestUser, sExpectedDate, sTestUser ]
        ];

        const oCostinSheetBaseRowTestData = [
            [ 1001, 1, 1, sExpectedDate, null, 1, sTestUser, -1 ]
        ];

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`DELETE from "${sItemTable}" where ITEM_ID in (3001, 3002, 3003, 5001, 7001)`);
            oConnection.executeUpdate(`DELETE from "${sCostingSheetBaseRowTable}" where COSTING_SHEET_BASE_ID in (1001)`);

            oConnection.executeUpdate(`INSERT INTO "${sItemTable}" (ITEM_ID, CALCULATION_VERSION_ID, PARENT_ITEM_ID, IS_ACTIVE, ITEM_CATEGORY_ID, CHILD_ITEM_CATEGORY_ID, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, oItemTestData);
            oConnection.executeUpdate(`INSERT INTO "${sCostingSheetBaseRowTable}" (COSTING_SHEET_BASE_ID, ITEM_CATEGORY_ID, SUBITEM_STATE, _VALID_FROM, _VALID_TO, _SOURCE, _CREATED_BY, CHILD_ITEM_CATEGORY_ID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, oCostinSheetBaseRowTestData);

            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should update CHILD_ITEM_CATEGORY_ID to ITEM_CATEGORY_ID for t_item table", () => {
            var oResultFromDb = oConnection.executeQuery(`select ITEM_ID, CHILD_ITEM_CATEGORY_ID, ITEM_CATEGORY_ID from "${sItemTable}" where ITEM_ID in (3001, 3002, 3003, 5001, 7001)`);
            oResultFromDb = mockstar_helpers.convertResultToArray(oResultFromDb);
            expect(oResultFromDb).toMatchData({
                "ITEM_ID": [3001, 3002, 3003, 5001, 7001],
                "ITEM_CATEGORY_ID": [0, 1, 2, 3, 4],
                "CHILD_ITEM_CATEGORY_ID": [0, 1, 2, 3, 4]
            }, ["ITEM_ID", "ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID"]);

            oConnection.executeUpdate(`DELETE from "${sItemTable}" where ITEM_ID in (3001, 3002, 3003, 5001, 7001)`);

            oConnection.commit();
        });
        it("should update CHILD_ITEM_CATEGORY_ID to ITEM_CATEGORY_ID for t_costing_sheet_base_row table", () => {
            var oResultFromDb = oConnection.executeQuery(`select COSTING_SHEET_BASE_ID, CHILD_ITEM_CATEGORY_ID, ITEM_CATEGORY_ID from "${sCostingSheetBaseRowTable}" where COSTING_SHEET_BASE_ID in (1001)`);
            oResultFromDb = mockstar_helpers.convertResultToArray(oResultFromDb);
            expect(oResultFromDb).toMatchData({
                "COSTING_SHEET_BASE_ID": [1001],
                "ITEM_CATEGORY_ID": [1],
                "CHILD_ITEM_CATEGORY_ID": [1]
            }, ["COSTING_SHEET_BASE_ID", "ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID"]);

            oConnection.executeUpdate(`DELETE from "${sCostingSheetBaseRowTable}" where COSTING_SHEET_BASE_ID in (1001)`);

            oConnection.commit();
        });
    }
});