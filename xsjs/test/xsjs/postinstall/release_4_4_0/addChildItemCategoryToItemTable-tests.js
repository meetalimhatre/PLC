const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const addChildItemCategoryToItemTable = $.import("xs.postinstall.release_4_4_0", "addChildItemCategoryToItemTable");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("addChildItemCategoryToItemTable-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                item: {
                    name: "sap.plc.db::basis.t_item",
                    data: testdata.oItemTestData
                },
                costing_sheet_base_row: {
                    name: "sap.plc.db::basis.t_costing_sheet_base_row",
                    data: testdata.oCostingSheetBaseRowTestData
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should update CHILD_ITEM_CATEGORY_ID to ITEM_CATEGORY_ID for t_item table", () => {
        // arrange
        oMockstar.execSingle(`update {{item}} set CHILD_ITEM_CATEGORY_ID = -1;`);
        var oResultFromDbBefore = oMockstar.execQuery(`select ITEM_ID, CHILD_ITEM_CATEGORY_ID, ITEM_CATEGORY_ID from {{item}}`);
        
        // act
        addChildItemCategoryToItemTable.run(jasmine.dbConnection);

        // assert
        var oResultFromDb = oMockstar.execQuery(`select ITEM_ID, CHILD_ITEM_CATEGORY_ID, ITEM_CATEGORY_ID from {{item}}`);
        expect(oResultFromDbBefore).toMatchData({
            "ITEM_ID": [3001, 3002, 3003, 5001, 7001],
            "ITEM_CATEGORY_ID": [0, 1, 3, 0, 0],
            "CHILD_ITEM_CATEGORY_ID": [-1, -1, -1, -1, -1]
        }, ["ITEM_ID", "ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID"]);
        expect(oResultFromDb).toMatchData({
            "ITEM_ID": [3001, 3002, 3003, 5001, 7001],
            "ITEM_CATEGORY_ID": [0, 1, 3, 0, 0],
            "CHILD_ITEM_CATEGORY_ID": [0, 1, 3, 0, 0]
        }, ["ITEM_ID", "ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID"]);
    });

    it("should update CHILD_ITEM_CATEGORY_ID to ITEM_CATEGORY_ID for t_costing_sheet_base_row table", () => {
        // arrange
        oMockstar.execSingle(`update {{costing_sheet_base_row}} set CHILD_ITEM_CATEGORY_ID = -1;`);
        var oResultFromDbBefore = oMockstar.execQuery(`select COSTING_SHEET_BASE_ID, CHILD_ITEM_CATEGORY_ID, ITEM_CATEGORY_ID from {{costing_sheet_base_row}}`);
        
        // act
        addChildItemCategoryToItemTable.run(jasmine.dbConnection);

        // assert
        var oResultFromDb = oMockstar.execQuery(`select COSTING_SHEET_BASE_ID, CHILD_ITEM_CATEGORY_ID, ITEM_CATEGORY_ID from {{costing_sheet_base_row}}`);
        expect(oResultFromDbBefore).toMatchData({
            "COSTING_SHEET_BASE_ID": [1],
            "ITEM_CATEGORY_ID": [1],
            "CHILD_ITEM_CATEGORY_ID": [-1]
        }, ["COSTING_SHEET_BASE_ID", "ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID"]);
        expect(oResultFromDb).toMatchData({
            "COSTING_SHEET_BASE_ID": [1],
            "ITEM_CATEGORY_ID": [1],
            "CHILD_ITEM_CATEGORY_ID": [1]
        }, ["COSTING_SHEET_BASE_ID", "ITEM_CATEGORY_ID", "CHILD_ITEM_CATEGORY_ID"]);
    });
}).addTags(["All_Unit_Tests"]);
