const sMetadataTable = "sap.plc.db::basis.t_metadata";
const sMetadataTextTable = "sap.plc.db::basis.t_metadata__text";
const sMetadataitemAttributesTable = "sap.plc.db::basis.t_metadata_item_attributes";
var oConnection = null;

// test data
const aMetadata = [
    ["Item","Item","CUST_ROLLUP_CURRENCY",1,4,101,502,null,"Item","Item","CUST_ROLLUP_CURRENCY_UNIT",0,"Decimal","precision=24; scale=7",null,1,null,null,null,1,null,null,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY_UNIT",1,4,null,null,null,null,null,null,1,"String","length=3",null, 7,null,null,null,1,null,null,null, null, null, null]
];

const aMetadataText = [
    ["Item", "CUST_ROLLUP_CURRENCY", "EN"],
    ["Item", "CUST_ROLLUP_CURRENCY_UNIT", "EN"]
];

const aMetadataItemAttributes = [
    ["Item","Item","CUST_ROLLUP_CURRENCY",1,0,null,0,null,99999999999.99999,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY",1,1,null,1,null,99999999999.99999,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY",2,0,null,0,null,99999999999.99999,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY",2,1,null,1,null,99999999999.99999,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY",3,0,null,0,null,99999999999.99999,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY",3,1,null,1,null,99999999999.99999,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY_UNIT",1,-1,null,0,null,null,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY_UNIT",2,-1,null,0,null,null,null,null,null,null],
    ["Item","Item","CUST_ROLLUP_CURRENCY_UNIT",3,-1,null,0,null,null,null,null,null,null]
];
const sCustomField = "CUST_ROLLUP_CURRENCY_UNIT";

describe("Add metadata item attributes so the currency of the custom fields can be read only", () => {
    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it("should prepare metadata for testing", () => {
            oConnection.executeUpdate(`INSERT INTO "${sMetadataTable}"
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, aMetadata);
            oConnection.executeUpdate(`INSERT INTO "${sMetadataTextTable}"
                                       COLUMNS(PATH,COLUMN_ID,LANGUAGE) VALUES (?, ?, ?)`, aMetadataText);
            oConnection.executeUpdate(`INSERT INTO "${sMetadataitemAttributesTable}"
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, aMetadataItemAttributes);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should update the metadata item attributes table", () => {
            const iCountNumberOfZeroes = oConnection.executeQuery(`SELECT COUNT(COLUMN_ID) AS COUNTER FROM "${sMetadataitemAttributesTable}" WHERE SUBITEM_STATE = 0 AND IS_READ_ONLY = 0 AND COLUMN_ID = '${sCustomField}'`)[0].COUNTER;
            const iCountNumberOfOnes = oConnection.executeQuery(`SELECT COUNT(COLUMN_ID) AS COUNTER FROM "${sMetadataitemAttributesTable}" WHERE SUBITEM_STATE = 1 AND IS_READ_ONLY = 1 AND COLUMN_ID = '${sCustomField}'`)[0].COUNTER;
            expect(parseInt(iCountNumberOfZeroes)).toEqual(3);
            expect(parseInt(iCountNumberOfOnes)).toEqual(3);
        });
    }
});