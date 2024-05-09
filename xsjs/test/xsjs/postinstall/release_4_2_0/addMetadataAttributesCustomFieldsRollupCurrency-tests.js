const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const AddMetadataAttributesCustomFieldsRollupCurrency = $.import("xs.postinstall.release_4_2_0", "addMetadataAttributesCustomFieldsRollupCurrency");
const oTestData = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("AddMetadataAttributesCustomFieldsRollupCurrency-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                metadata: "sap.plc.db::basis.t_metadata",
                metadata_item_attributes: "sap.plc.db::basis.t_metadata_item_attributes"
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should update the metadata item attributes table to allow the currency to be readonly when it's assembly and has rollup", () => {
        // arrange
        const sCustomField = "CUST_ROLLUP_CURRENCY_UNIT";
        oMockstar.insertTableData("metadata", oTestData.oMetadataCustTestData);
        oMockstar.insertTableData("metadata_item_attributes", oTestData.oMetadataItemAttributesCustTestData);
        oMockstar.execSingle(`UPDATE {{metadata_item_attributes}} SET SUBITEM_STATE = -1 WHERE IS_READ_ONLY = 0 AND COLUMN_ID = '${sCustomField}'`);
        oMockstar.execSingle(`DELETE FROM {{metadata_item_attributes}} WHERE SUBITEM_STATE = 1 AND COLUMN_ID = '${sCustomField}'`);

        // act
        AddMetadataAttributesCustomFieldsRollupCurrency.run(jasmine.dbConnection);

        // assert
        let iCountNumberOfZeroes = oMockstar.execQuery(`SELECT COUNT(*) AS COUNTER FROM {{metadata_item_attributes}} WHERE SUBITEM_STATE = 0 AND IS_READ_ONLY = 0 AND COLUMN_ID = '${sCustomField}';`);
        let iCountNumberOfOnes = oMockstar.execQuery(`SELECT COUNT(*) AS COUNTER FROM {{metadata_item_attributes}} WHERE SUBITEM_STATE = 1 AND IS_READ_ONLY = 1 AND COLUMN_ID = '${sCustomField}';`);
        iCountNumberOfOnes = iCountNumberOfOnes.columns.COUNTER.rows[0]
        iCountNumberOfZeroes = iCountNumberOfZeroes.columns.COUNTER.rows[0]
        expect(iCountNumberOfZeroes).toEqual(iCountNumberOfOnes);
    });
}).addTags(["All_Unit_Tests"]);
