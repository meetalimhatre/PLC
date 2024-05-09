const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const SetStandardContentForCustomItemCategoryTables = $.import("xs.postinstall.release_4_4_0", "setStandardContentForItemCategoryTables");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");
const sValidFrom = '2015-01-01T15:39:09.691Z';


describe("setStandardContentForItemCategoryTables-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                itemCategory: {
                    name: "sap.plc.db::basis.t_item_category",
                    data: testdata.oItemCategory
                },
                itemCategoryText: {
                    name: "sap.plc.db::basis.t_item_category__text",
                    data: testdata.oItemCategoryText
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should remove the value for t_item_category (CHILD_ITEM_CATEGORY_ID = 0 and ITEM_CATEGORY_ID != 0)", () => {
        // arrange
        var oItemCategory = oMockstar.execQuery(`select * from {{itemCategory}}`);
        // act
        SetStandardContentForCustomItemCategoryTables.run(jasmine.dbConnection);
        // assert
        oItemCategory = oMockstar.execQuery(`select * from {{itemCategory}}`);

        var oExpectedItemCategory = {
            "ITEM_CATEGORY_ID": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "DISPLAY_ORDER": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "CHILD_ITEM_CATEGORY_ID": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "ICON": ['\\ue1d7', '\\ue1b4', '\\ue080', '\\ue0a6', '\\ue078', '\\ue0c7', '\\ue13f', '\\ue002', '\\ue206', '\\ue1a3', '\\ue1d1'],
            "CREATED_ON": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "CREATED_BY": ['user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1'],
            "LAST_MODIFIED_ON": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "LAST_MODIFIED_BY": ['user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1'],
            "ITEM_CATEGORY_CODE": ['CALCULATION VERSION', 'DOCUMENT', 'MATERIAL', 'INTERNAL ACTIVITY', 'EXTERNAL ACTIVITY', 'PROCESS', 'SUBCONTRACTING', 'RESOURCES AND TOOLS', 'VARIABLE ITEM', 'TEXT ITEM', 'REFERENCED VERSION']

        }

        const oActualValuesForItemCategoryColumns = oMockstar.execQuery(`SELECT * FROM {{itemCategory}}`);
        expect(oActualValuesForItemCategoryColumns.columns.CHILD_ITEM_CATEGORY_ID.rows.length).toBe(11);
        expect(oActualValuesForItemCategoryColumns.columns.CHILD_ITEM_CATEGORY_ID.rows).toEqual(oExpectedItemCategory.CHILD_ITEM_CATEGORY_ID);
        expect(oActualValuesForItemCategoryColumns.columns.ICON.rows.length).toBe(11);
        expect(oActualValuesForItemCategoryColumns.columns.ICON.rows).toEqual(oExpectedItemCategory.ICON);
        expect(oActualValuesForItemCategoryColumns.columns.DISPLAY_ORDER.rows.length).toBe(11);
        expect(oActualValuesForItemCategoryColumns.columns.DISPLAY_ORDER.rows).toEqual(oExpectedItemCategory.DISPLAY_ORDER);
        expect(oActualValuesForItemCategoryColumns.columns.ITEM_CATEGORY_CODE.rows).toEqual(oExpectedItemCategory.ITEM_CATEGORY_CODE);

    });

    it("should remove the value for t_item_category__text (CHILD_ITEM_CATEGORY_ID = 0 and ITEM_CATEGORY_ID != 0)", () => {

        // arrange
        var oItemCategoryText = oMockstar.execQuery(`select * from {{itemCategoryText}}`);
        // act
        SetStandardContentForCustomItemCategoryTables.run(jasmine.dbConnection);
        // assert
        oItemCategoryText = oMockstar.execQuery(`select * from {{itemCategoryText}}`);

        var oExpectItemCategoryText = {
            "ITEM_CATEGORY_ID": [0],
            "LANGUAGE": ['EN'],
            "ITEM_CATEGORY_DESCRIPTION": ['Calculation version'],
            "CHILD_ITEM_CATEGORY_ID": [0],
            "ITEM_CATEGORY_NAME": ['Calculation version'],
        }


        const oActualValuesForItemCategoryTextColumns = oMockstar.execQuery(`SELECT * FROM {{itemCategoryText}}`);
        expect(oActualValuesForItemCategoryTextColumns.columns.CHILD_ITEM_CATEGORY_ID.rows.length).toBe(1);
        expect(oActualValuesForItemCategoryTextColumns.columns.CHILD_ITEM_CATEGORY_ID.rows).toEqual(oExpectItemCategoryText.CHILD_ITEM_CATEGORY_ID);
        expect(oActualValuesForItemCategoryTextColumns.columns.ITEM_CATEGORY_NAME.rows).toEqual(oExpectItemCategoryText.ITEM_CATEGORY_NAME);
    });

}).addTags(["All_Unit_Tests"]); 