
const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const AddQuantityStateToVariantItem = $.import("xs.postinstall.release_4_1_0", "addQuantityStateToVariantItem");
const oTestData = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("AddQuantityStateToVariantItem-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                variant_item: "sap.plc.db::basis.t_variant_item",
                item: "sap.plc.db::basis.t_item",
                variant: "sap.plc.db::basis.t_variant"
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should update the variant item table with a new column", () => {
        // arrange
        const oVariantItem = oTestData.oVariantItemTestData;
        const oVariantItemExpected = JSON.parse(JSON.stringify(oVariantItem));
        oVariantItemExpected.QUANTITY_STATE = [1, 1, 1, 1, 1, 1, 1, 1, 1];
        oMockstar.insertTableData("variant_item", _.omit(oVariantItem, "QUANTITY_STATE"));
        oMockstar.insertTableData("variant", oTestData.oVariantTestData);
        oMockstar.insertTableData("item", oTestData.oItemTestData);

        // act
        AddQuantityStateToVariantItem.run(jasmine.dbConnection);

        // assert
        const oVariantItemaAfter = oMockstar.execQuery(`select QUANTITY_CALCULATED, QUANTITY_STATE from {{variant_item}} order by ITEM_ID`);
        expect(oVariantItemaAfter.columns.QUANTITY_CALCULATED.rows).toEqual(oVariantItemExpected.QUANTITY_CALCULATED);
        expect(oVariantItemaAfter.columns.QUANTITY_STATE.rows).toEqual(oVariantItemExpected.QUANTITY_STATE);
    });
}).addTags(["All_Unit_Tests"]);
