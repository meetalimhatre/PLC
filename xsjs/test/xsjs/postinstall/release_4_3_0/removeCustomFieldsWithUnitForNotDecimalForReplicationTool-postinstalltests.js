const sMetadataTable = "sap.plc.db::basis.t_metadata";
const sFieldMappingTable = "sap.plc.db::map.t_field_mapping";
var oConnection = null;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
const sTestUser = "TEST_USER_POSTINSTALL";

describe("removeCustomFieldsWithUnitForNotDecimalForReplicationTool-postinstalltests", () => {
    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    var sTable = "test_table";

    if (jasmine.plcTestRunParameters.mode === "prepare") {

        const aMetadata = [
            ['Activity_Price', 'Activity_Price', 'CAPR_TEST', 'BooleanInt', 'precision=24; scale=7', null, 1, null, null, 0, 1, 5, 1, sTestUser], 
            ['Activity_Price', 'Activity_Price', 'CAPR_TEST_UNIT', 'String', 'length=3', 'CAPR_TEST_UNIT', 1, 'Activity_Price', 'Activity_Price', 1, 1, 2, 2, sTestUser], 
            ['Material_Price', 'Material_Price', 'CMPR_TEST', 'String', 'precision=24; scale=7', null, 1, null, null, 0, 1, 7, 3, sTestUser], 
            ['Work_Center', 'Work_Center', 'CWRC_TEST', 'Decimal', 'precision=24; scale=7', null, 1, null, null, 0, 1, 2, 4, sTestUser], 
            ['Cost_Center', 'Cost_Center', 'CCEN_TEST', 'String', 'precision=24; scale=7', null, 1, null, null, 0, 1, 2, 5, sTestUser], 
            ['Item', 'Item', 'CUST_TEST', 'String', 'precision=24; scale=7', null, 1, null, null, 0, 1, 6, 6, sTestUser]    
        ];

        const aFieldMapping= [
            [1, sTable, "CAPR_TEST_MANUAL", "BOOLEANINT", 1, 1],
            [2, sTable, "CAPR_TEST_UNIT", "STRING", 2, 1],
            [3, sTable, "CMPR_TEST_UNIT", "STRING", 3, 1],
            [4, sTable, "CMPR_TEST_MANUAL", "STRING", 4, 1],
            [5, sTable, "CWRC_TEST_UNIT", "STRING", 5, 1],
            [6, sTable, "CWRC_TEST_MANUAL", "DECIMAL", 6, 1],
            [7, sTable, "CCEN_TEST_UNIT", "STRING", 7, 1],
            [8, sTable, "CUST_TEST_UNIT", "STRING", 8, 1]
        ];

        it("Prepare the testdata", () => {

            oConnection.executeUpdate(`DELETE FROM "${sMetadataTable}" WHERE "IS_CUSTOM" = 1`);
            oConnection.executeUpdate(`DELETE FROM "${sFieldMappingTable}" WHERE "IS_CUSTOM" = 1`);

            oConnection.executeUpdate(`INSERT INTO "${sMetadataTable}" (
                    PATH, BUSINESS_OBJECT, COLUMN_ID, SEMANTIC_DATA_TYPE, SEMANTIC_DATA_TYPE_ATTRIBUTES, 
                    REF_UOM_CURRENCY_COLUMN_ID, SIDE_PANEL_GROUP_ID, REF_UOM_CURRENCY_PATH, REF_UOM_CURRENCY_BUSINESS_OBJECT, 
                    UOM_CURRENCY_FLAG, IS_CUSTOM, PROPERTY_TYPE, DISPLAY_ORDER, CREATED_BY) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, aMetadata);
            
            oConnection.executeUpdate(`INSERT INTO "${sFieldMappingTable}"(
                    ID,TABLE_NAME, COLUMN_NAME, FIELD_TYPE, FIELD_ORDER, IS_CUSTOM) VALUES(?, ?, ?, ?, ?, ?)`, aFieldMapping);

            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should delete custom fields with unit when parent custom fields are not decimal for masterdata replication tool", () => {
            let oUpdatedCFs = oConnection.executeQuery(`SELECT * FROM "${sFieldMappingTable}" WHERE "IS_CUSTOM" = 1`);
            oUpdatedCFs = mockstar_helpers.convertResultToArray(oUpdatedCFs);
            expect(oUpdatedCFs.COLUMN_NAME.length).toBe(5);
            expect(oUpdatedCFs).toMatchData({
                "COLUMN_NAME": ["CAPR_TEST_MANUAL","CMPR_TEST_MANUAL","CWRC_TEST_UNIT", "CWRC_TEST_MANUAL","CUST_TEST_UNIT"],
                "FIELD_TYPE": ["BOOLEANINT","STRING","STRING","DECIMAL","STRING"],
                "TABLE_NAME": [sTable, sTable, sTable,sTable, sTable]
            }, ["COLUMN_NAME", "FIELD_TYPE", "TABLE_NAME"]);

            oConnection.executeUpdate(`DELETE FROM "${sMetadataTable}" WHERE "CREATED_BY" = '${sTestUser}'`);
            oConnection.executeUpdate(`DELETE FROM "${sFieldMappingTable}" WHERE "IS_CUSTOM" = 1`);
            oConnection.commit();
        });
    }

});
