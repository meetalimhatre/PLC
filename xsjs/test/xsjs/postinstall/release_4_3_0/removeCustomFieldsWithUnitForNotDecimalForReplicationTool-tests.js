const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const RemoveCustomFieldsWithUnitForNotDecimalForReplicationTool = $.import("xs.postinstall.release_4_3_0", "removeCustomFieldsWithUnitForNotDecimalForReplicationTool");

describe("removeCustomFieldsWithUnitForNotDecimalForReplicationTool-tests", () => {
    
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                metadata: "sap.plc.db::basis.t_metadata",
                fieldMapping: "sap.plc.db::map.t_field_mapping"
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
       
    });

    it("should delete the _UNIT custom fields that do not reference DECIMAL parents", () => {
        // arrange
        var sTable = "test_table";

        var oMetadataTestdata = {
            "PATH" :["Activity_Price", "Activity_Price", "Material_Price","Work_Center", "Cost_Center", "Item"],
            "BUSINESS_OBJECT": ["Activity_Price", "Activity_Price", "Material_Price", "Work_Center", "Cost_Center", "Item"],
            "COLUMN_ID" : ["CAPR_TEST", "CAPR_TEST_UNIT", "CMPR_TEST", "CWRC_TEST", "CCEN_TEST", "CUST_TEST"],
            "SEMANTIC_DATA_TYPE": ["BooleanInt", "String", "String", "Decimal", "String", "String"],
            "SEMANTIC_DATA_TYPE_ATTRIBUTES": ["precision=24; scale=7", "length=3", "precision=24; scale=7", "precision=24; scale=7", "precision=24; scale=7", "length=40"],
            "REF_UOM_CURRENCY_COLUMN_ID": [null, "CAPR_TEST_UNIT", null, null, null, null],
            "SIDE_PANEL_GROUP_ID" : [1, 1, 1, 1, 1, 1],
            "REF_UOM_CURRENCY_PATH": [null, "Activity_Price", null, null, null, null],
            "REF_UOM_CURRENCY_BUSINESS_OBJECT": [null, "Activity_Price", null, null, null, null],
            "UOM_CURRENCY_FLAG": [0, 1, 0, 0, 0, 0],
            "IS_CUSTOM": [1, 1, 1, 1, 1, 1],
            "PROPERTY_TYPE": [5, 2, 7, 2, 6, 3],
            "TABLE_DISPLAY_ORDER": [1, 2, 3, 4, 5, 6],
            "DISPLAY_ORDER": [1, 2, 3, 4, 5, 6]
        };
        oMockstar.insertTableData("metadata", oMetadataTestdata);

        var oFieldMappingTestData = {
            "ID": [1, 2, 3, 4, 5, 6, 7, 8],
            "TABLE_NAME": [sTable, sTable, sTable, sTable, sTable, sTable, sTable, sTable],
            "COLUMN_NAME": ["CAPR_TEST_MANUAL","CAPR_TEST_UNIT", "CMPR_TEST_UNIT","CMPR_TEST_MANUAL", "CWRC_TEST_UNIT", "CWRC_TEST_MANUAL", "CCEN_TEST_UNIT", "CUST_TEST_UNIT"],
            "FIELD_TYPE": ["BOOLEANINT", "STRING", "STRING", "STRING","STRING", "DECIMAL", "STRING", "STRING"],
            "FIELD_ORDER": [1, 2, 3, 4, 5, 6, 7, 8],
            "IS_CUSTOM": [1, 1, 1, 1, 1, 1, 1, 1]
        };

        oMockstar.insertTableData("fieldMapping", oFieldMappingTestData);

        // act
        RemoveCustomFieldsWithUnitForNotDecimalForReplicationTool.run(jasmine.dbConnection);

        // assert
        var oUpdatedCFs = oMockstar.execQuery(`select * from {{fieldMapping}} where "IS_CUSTOM" = 1`);
        expect(oUpdatedCFs.columns.COLUMN_NAME.rows.length).toBe(5);
        expect(oUpdatedCFs).toMatchData({
            "COLUMN_NAME": ["CAPR_TEST_MANUAL","CMPR_TEST_MANUAL","CWRC_TEST_UNIT", "CWRC_TEST_MANUAL","CUST_TEST_UNIT"],
            "FIELD_TYPE": ["BOOLEANINT","STRING","STRING","DECIMAL","STRING"],
            "TABLE_NAME": [sTable, sTable, sTable,sTable, sTable]
        }, ["COLUMN_NAME", "FIELD_TYPE", "TABLE_NAME"]);
    });

}).addTags(["All_Unit_Tests"]);