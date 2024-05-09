const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const addChildItemCategoryToLayoutTable = $.import("xs.postinstall.release_4_4_0", "addChildItemCategoryToLayoutTable");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("addChildItemCategoryToLayoutTable-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                layoutColumn: {
                    name: "sap.plc.db::basis.t_layout_column",
                    data: testdata.oLayoutColumnsTestData
                },
                layoutHiddenFields: {
                    name: "sap.plc.db::basis.t_layout_hidden_field",
                    data: testdata.oLayoutHiddenFieldsTestData
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should update COLUMN_ID, PATH and BUSINESS_OBJECT columns where COLUMN_ID='ITEM_CATEGORY_ID' => t_layout_column table", () => {
        // arrange
        var oResultFromDbBefore = oMockstar.execQuery(`select PATH,BUSINESS_OBJECT,COLUMN_ID,LAYOUT_ID,DISPLAY_ORDER from {{layoutColumn}}`);

        // act
        addChildItemCategoryToLayoutTable.run(jasmine.dbConnection);

        // assert
        var oResultFromDb = oMockstar.execQuery(`select PATH,BUSINESS_OBJECT,COLUMN_ID,LAYOUT_ID,DISPLAY_ORDER from {{layoutColumn}}`);
        expect(oResultFromDbBefore).toMatchData({
            "BUSINESS_OBJECT": [null, 'Item', null, null, 'Item', 'Item', 'Item', 'Item', 'Item', 'Item', 'Item', 'Item', null, 'Item', 'Item'],
            "PATH": [null, 'Item', 'Item', null, null, 'Item', 'Item', 'Item', 'Item', 'Item', 'Item', 'Item', null, 'Item', 'Item'],
            "COLUMN_ID": [null, "ITEM_CATEGORY_ID", "ColB", null, null, "ITEM_CATEGORY_ID", "ColB", "ColC", "ColD", "ColC", "ColA", null, "ColB", "ColE", "ITEM_CATEGORY_ID"],
            "LAYOUT_ID": [1, 1, 1, 2, 2, 2, 2, 3, 4, 5, 5, 5, 6, 7, 7],
            "DISPLAY_ORDER": [0, 1, 2, 0, 1, 2, 3, 1, 1, 1, 2, 3, 1, 1, 2],
        }, ["COLUMN_ID", "LAYOUT_ID", "DISPLAY_ORDER"]);
        expect(oResultFromDb).toMatchData({
            "BUSINESS_OBJECT": [null, null, null, 'Item', 'Item', 'Item', 'Item', 'Item', 'Item', 'Item', null, 'Item', 'Custom_Item_Categories', 'Custom_Item_Categories', 'Custom_Item_Categories'],
            "PATH": [null, 'Item', null, null, 'Item', 'Item', 'Item', 'Item', 'Item', 'Item', null, 'Item', 'ITEM.CUSTOM_ITEM_CATEGORIES', 'ITEM.CUSTOM_ITEM_CATEGORIES', 'ITEM.CUSTOM_ITEM_CATEGORIES'],
            "COLUMN_ID": [null, "ColB", null, null, "ColB", "ColC", "ColD", "ColC", "ColA", null, "ColB", "ColE", "CHILD_ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID"],
            "LAYOUT_ID": [1, 1, 2, 2, 2, 3, 4, 5, 5, 5, 6, 7, 1, 2, 7],
            "DISPLAY_ORDER": [0, 2, 0, 1, 3, 1, 1, 1, 2, 3, 1, 1, 1, 2, 2],
        }, ["COLUMN_ID", "LAYOUT_ID", "DISPLAY_ORDER"]);
    });

    it("should update COLUMN_ID, PATH and BUSINESS_OBJECT columns where COLUMN_ID='ITEM_CATEGORY_ID' => t_layout_hidden_field table", () => {
        // arrange
        var oResultFromDbBefore = oMockstar.execQuery(`select LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID from {{layoutHiddenFields}}`);

        // act
        addChildItemCategoryToLayoutTable.run(jasmine.dbConnection);

        // assert
        var oResultFromDb = oMockstar.execQuery(`select LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID from {{layoutHiddenFields}}`);
        expect(oResultFromDbBefore).toMatchData({
            "LAYOUT_ID": [1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7],
            "PATH": ["Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item"],
            "BUSINESS_OBJECT": ["Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item"],
            "COLUMN_ID": ["ColC", "ITEM_CATEGORY_ID", "ColD", "ColE", "ColA", "ColF", "ColB", "ColD", "ColE", "ColA", "ITEM_CATEGORY_ID"]
        }, ["LAYOUT_ID", "PATH", "BUSINESS_OBJECT", "COLUMN_ID"]);
        expect(oResultFromDb).toMatchData({
            "LAYOUT_ID": [1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7],
            "PATH": ["Item", "ITEM.CUSTOM_ITEM_CATEGORIES", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "ITEM.CUSTOM_ITEM_CATEGORIES"],
            "BUSINESS_OBJECT": ["Item", "Custom_Item_Categories", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Custom_Item_Categories"],
            "COLUMN_ID": ["ColC", "CHILD_ITEM_CATEGORY_ID", "ColD", "ColE", "ColA", "ColF", "ColB", "ColD", "ColE", "ColA", "CHILD_ITEM_CATEGORY_ID"]
        }, ["LAYOUT_ID", "PATH", "BUSINESS_OBJECT", "COLUMN_ID"]);
    });
}).addTags(["All_Unit_Tests"]);
