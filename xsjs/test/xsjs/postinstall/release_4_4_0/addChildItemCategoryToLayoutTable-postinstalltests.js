var mockstar_helpers = require("../../../testtools/mockstar_helpers");

const sLayoutColumnTable = "sap.plc.db::basis.t_layout_column";
const sLayoutHiddenFieldTable = "sap.plc.db::basis.t_layout_hidden_field";

var oConnection = null;

describe("update COLUMN_ID, PATH and BUSINESS_OBJECT columns where COLUMN_ID='ITEM_CATEGORY_ID", () => {

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        const oLayoutColumnTable = [
            [98, 0, null, null, null, null, null, 430],
            [98, 1, "Item", "Item", "ITEM_CATEGORY_ID", null, null, 430],
            [98, 2, "Item", "Item", "ColB", null, null, 430],
            [99, 0, null, "Item", null, null, null, 430],
            [99, 1, "Item", "Item", "ITEM_CATEGORY_ID", null, null, 430],
            [99, 2, "Item", "Item", null, null, null, 430],
            [99, 3, "Item", "Item", "ITEM_CATEGORY_ID", null, null, 430],
            [99, 4, "Item", "Item", "ITEM_CATEGORY_ID", null, null, 430]
        ];

        const oLayoutHiddenFieldTable = [
            [5, "Item", "Item", "ITEM_CATEGORY_ID"]
        ];

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`DELETE from "${sLayoutColumnTable}" where LAYOUT_ID in (98, 99)`);
            oConnection.executeUpdate(`DELETE from "${sLayoutHiddenFieldTable}" where LAYOUT_ID in (5)`);

            oConnection.executeUpdate(`INSERT INTO "${sLayoutColumnTable}" (LAYOUT_ID, DISPLAY_ORDER, PATH, BUSINESS_OBJECT, COLUMN_ID, COSTING_SHEET_ROW_ID, COST_COMPONENT_ID, COLUMN_WIDTH)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, oLayoutColumnTable);
            oConnection.executeUpdate(`INSERT INTO "${sLayoutHiddenFieldTable}" (LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID) VALUES (?, ?, ?, ?)`, oLayoutHiddenFieldTable);

            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should update COLUMN_ID, PATH and BUSINESS_OBJECT columns where COLUMN_ID='ITEM_CATEGORY_ID' => t_layout_column table", () => {
            var oResultFromDb = oConnection.executeQuery(`select PATH, BUSINESS_OBJECT, COLUMN_ID, LAYOUT_ID, DISPLAY_ORDER from "${sLayoutColumnTable}" where LAYOUT_ID in (98, 99)`);
            oResultFromDb = mockstar_helpers.convertResultToArray(oResultFromDb);
            expect(oResultFromDb).toMatchData({
                "PATH": [null, 'ITEM.CUSTOM_ITEM_CATEGORIES', 'Item', null, 'ITEM.CUSTOM_ITEM_CATEGORIES', 'Item', 'ITEM.CUSTOM_ITEM_CATEGORIES', 'ITEM.CUSTOM_ITEM_CATEGORIES'],
                "BUSINESS_OBJECT":[null, 'Custom_Item_Categories', 'Item', 'Item', 'Custom_Item_Categories', 'Item', 'Custom_Item_Categories', 'Custom_Item_Categories'],
                "COLUMN_ID": [null, 'CHILD_ITEM_CATEGORY_ID', 'ColB', null, 'CHILD_ITEM_CATEGORY_ID', null, 'CHILD_ITEM_CATEGORY_ID', 'CHILD_ITEM_CATEGORY_ID'],
                "LAYOUT_ID": [98, 98, 98, 99, 99, 99, 99, 99],
                "DISPLAY_ORDER": [0, 1, 2, 0, 1, 2, 3, 4],
            }, ["PATH","BUSINESS_OBJECT","COLUMN_ID", "LAYOUT_ID", "DISPLAY_ORDER"]);

            oConnection.executeUpdate(`DELETE from "${sLayoutColumnTable}" where LAYOUT_ID in (98, 99)`);
            oConnection.commit();
        });

        it("should update COLUMN_ID, PATH and BUSINESS_OBJECT columns where COLUMN_ID='ITEM_CATEGORY_ID' => t_layout_hidden_field table", () => {
            var oResultFromDb = oConnection.executeQuery(`select LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID from "${sLayoutHiddenFieldTable}" where LAYOUT_ID in (5)`);
            oResultFromDb = mockstar_helpers.convertResultToArray(oResultFromDb);
            expect(oResultFromDb).toMatchData({
                "LAYOUT_ID": [5],
                "PATH": ["ITEM.CUSTOM_ITEM_CATEGORIES"],
                "BUSINESS_OBJECT": ["Custom_Item_Categories"],
                "COLUMN_ID": ["CHILD_ITEM_CATEGORY_ID"]
            }, ["LAYOUT_ID", "PATH", "BUSINESS_OBJECT", "COLUMN_ID"]);
        });
    }
});