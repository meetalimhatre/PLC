const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const AddCustomFieldsForReplicationTool = $.import("xs.postinstall.release_4_3_0", "addCustomFieldsForReplicationTool");
const _ = require("lodash");

describe("addCustomFieldsForReplicationTool-tests", () => {
    
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

    it("should copy the CFs to the replication tool", () => {
        // arrange
        var oMetadataTestdata = {
            "PATH" :["Activity_Price", "Activity_Price", "Material_Price","Work_Center", "Item", "Item"],
            "BUSINESS_OBJECT": ["Activity_Price", "Activity_Price", "Material_Price", "Work_Center", "Item", "Item"],
            "COLUMN_ID" : ["CAPR_TEST", "CAPR_TEST_UNIT", "CMPR_TEST", "CWRC_TEST", "CUST_TEST", "CUST_TEST2"],
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

        // act
        AddCustomFieldsForReplicationTool.run(jasmine.dbConnection);

        // assert
        var oCreatedCFs = oMockstar.execQuery(`select * from {{fieldMapping}} where "IS_CUSTOM" = 1`);
        expect(oCreatedCFs.columns.COLUMN_NAME.rows.length).toBe(4);
        expect(oCreatedCFs).toMatchData({
            "COLUMN_NAME": ["CAPR_TEST_MANUAL","CMPR_TEST_MANUAL","CWRC_TEST_MANUAL","CWRC_TEST_UNIT"],
            "FIELD_TYPE": ["BOOLEANINT","STRING","DECIMAL","STRING"],
            "TABLE_NAME": ["t_activity_price","t_material_price","t_work_center","t_work_center"]
        }, ["COLUMN_NAME", "FIELD_TYPE", "TABLE_NAME"]);
    });

}).addTags(["All_Unit_Tests"]);