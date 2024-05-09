const sMetadataTable = "sap.plc.db::basis.t_metadata";
const sFieldMappingTable = "sap.plc.db::map.t_field_mapping";
var oConnection = null;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
const sTestUser = "TEST_USER_POSTINSTALL";

describe("Add custom fields to field mapping for masterdata replication tool", () => {
    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        const aMetadata = [
            ['Activity_Price', 'Activity_Price', 'CAPR_TESTPS', 'BooleanInt', 'precision=24; scale=7', null, 1, null, null, 0, 1, 5, 1, sTestUser], 
            ['Activity_Price', 'Activity_Price', 'CAPR_TESTPS_UNIT', 'String', 'length=3', 'CAPR_TESTPS_UNIT', 1, 'Activity_Price', 'Activity_Price', 1, 1, 2, 2, sTestUser], 
            ['Material_Price', 'Material_Price', 'CMPR_TESTPS', 'String', 'precision=24; scale=7', null, 1, null, null, 0, 1, 7, 3, sTestUser], 
            ['Work_Center', 'Work_Center', 'CWRC_TESTPS', 'Decimal', 'precision=24; scale=7', null, 1, null, null, 0, 1, 2, 4, sTestUser], 
            ['Item', 'Item', 'CUST_TESTPS', 'String', 'precision=24; scale=7', null, 1, null, null, 0, 1, 6, 5, sTestUser], 
            ['Item', 'Item', 'CUST_TESTPS2', 'String', 'length=40', null, 1, null, null, 0, 1, 3, 6, sTestUser]
        ];

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`INSERT INTO "${sMetadataTable}" (
                    PATH, BUSINESS_OBJECT, COLUMN_ID, SEMANTIC_DATA_TYPE, SEMANTIC_DATA_TYPE_ATTRIBUTES, 
                    REF_UOM_CURRENCY_COLUMN_ID, SIDE_PANEL_GROUP_ID, REF_UOM_CURRENCY_PATH, REF_UOM_CURRENCY_BUSINESS_OBJECT, 
                    UOM_CURRENCY_FLAG, IS_CUSTOM, PROPERTY_TYPE, DISPLAY_ORDER, CREATED_BY) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, aMetadata);

            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should add custom fields to field mapping for masterdata replication tool", () => {
            let aCreatedCFs = oConnection.executeQuery(`SELECT * FROM "${sFieldMappingTable}" WHERE "IS_CUSTOM" = 1 AND "COLUMN_NAME" LIKE '%TESTPS%'`);
            let oCreatedCFs = mockstar_helpers.convertResultToArray(aCreatedCFs);
            expect(oCreatedCFs.COLUMN_NAME.length).toBe(4);
            expect(oCreatedCFs).toMatchData({
                "COLUMN_NAME": ["CAPR_TESTPS_MANUAL","CMPR_TESTPS_MANUAL","CWRC_TESTPS_MANUAL","CWRC_TESTPS_UNIT"],
                "FIELD_TYPE": ["BOOLEANINT","STRING","DECIMAL","STRING"],
                "TABLE_NAME": ["t_activity_price","t_material_price","t_work_center", "t_work_center"]
            }, ["COLUMN_NAME", "FIELD_TYPE", "TABLE_NAME"]);

            oConnection.executeUpdate(`DELETE FROM "${sMetadataTable}" WHERE "CREATED_BY" = '${sTestUser}'`);
            oConnection.executeUpdate(`DELETE FROM "${sFieldMappingTable}" WHERE "IS_CUSTOM" = 1`);
        });
    }

});
