const sFrontendSettings = "sap.plc.db::basis.t_frontend_settings";
var oConnection = null;
const _ = require("lodash");
/*
    Test data input decoded:
    MassChange
    "{\"FILTER_CONFIGURATION\":{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"ReferencedVersion\"},{\"OPERATOR\":\"GreaterThan\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"QUANTITY_FOR_ONE_ASSEMBLY\",\"PATH\":\"ITEM\"},\"VALUE\":\"1\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"IS_ACTIVE\",\"PATH\":\"ITEM\"},\"VALUE\":\"True\"}]},\"CHANGE_CONFIGURATION\":{\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"HIGHLIGHT_ORANGE\",\"PATH\":\"ITEM\"},\"OPERATOR\":\"SetFixed\",\"REPLACE_TEXT_VALUE\":\"\",\"REPLACE_WITH_VALUE\":\"\",\"VALUE\":\"True\"}}",
    "{\"FILTER_CONFIGURATION\":{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"Process\"}]},\"CHANGE_CONFIGURATION\":{\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"OPERATOR\":\"SetFixed\",\"REPLACE_TEXT_VALUE\":\"\",\"REPLACE_WITH_VALUE\":\"\",\"VALUE\":\"Material\"}}"         
    Filters
    "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"ReferencedVersion\"},{\"OPERATOR\":\"GreaterThan\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"QUANTITY_FOR_ONE_ASSEMBLY\",\"PATH\":\"ITEM\"},\"VALUE\":\"1\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"IS_ACTIVE\",\"PATH\":\"ITEM\"},\"VALUE\":\"True\"}]}"
    "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"Material\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"ITEM_CATEGORY_ID\",\"PATH\":"ITEM\"},\"VALUE\":\"Process\"}]}"
    "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"Material\"}]}"
   */
/*  
   Test data output decoded:
   MassChange
   "{\"FILTER_CONFIGURATION\":{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"ReferencedVersion\"},{\"OPERATOR\":\"GreaterThan\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"QUANTITY_FOR_ONE_ASSEMBLY\",\"PATH\":\"ITEM\"},\"VALUE\":\"1\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"IS_ACTIVE\",\"PATH\":\"ITEM\"},\"VALUE\":\"True\"}]},\"CHANGE_CONFIGURATION\":{\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"HIGHLIGHT_ORANGE\",\"PATH\":\"ITEM\"},\"OPERATOR\":\"SetFixed\",\"REPLACE_TEXT_VALUE\":\"\",\"REPLACE_WITH_VALUE\":\"\",\"VALUE\":\"True\"}}"
   "{\"FILTER_CONFIGURATION\":{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"Process\"}]},\"CHANGE_CONFIGURATION\":{\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"OPERATOR\":\"SetFixed\",\"REPLACE_TEXT_VALUE\":\"\",\"REPLACE_WITH_VALUE\":\"\",\"VALUE\":\"Material\"}}"         
   Filters
   "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"ReferencedVersion\"},{\"OPERATOR\":\"GreaterThan\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"QUANTITY_FOR_ONE_ASSEMBLY\",\"PATH\":\"ITEM\"},\"VALUE\":\"1\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"IS_ACTIVE\",\"PATH\":\"ITEM\"},\"VALUE\":\"True\"}]}"
   "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"Material\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":"ITEM\"},\"VALUE\":\"Process\"}]}"
   "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM\"},\"VALUE\":\"Material\"}]}"

*/
const sItemCategoryIdFilter = "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlJlZmVyZW5jZWRWZXJzaW9uIn0seyJPUEVSQVRPUiI6IkdyZWF0ZXJUaGFuIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IlFVQU5USVRZX0ZPUl9PTkVfQVNTRU1CTFkiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IjEifSx7Ik9QRVJBVE9SIjoiSXMiLCJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiSVNfQUNUSVZFIiwiUEFUSCI6IklURU0ifSwiVkFMVUUiOiJUcnVlIn1dfQ==";
const sItemCategoryIdFilter2 = "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6Ik1hdGVyaWFsIn0seyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlByb2Nlc3MifV19";
const sItemCategoryIdFilter3 = "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6Ik1hdGVyaWFsIn1dfQ==";

const sItemCategoryIdMassChange = "eyJGSUxURVJfQ09ORklHVVJBVElPTiI6eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlJlZmVyZW5jZWRWZXJzaW9uIn0seyJPUEVSQVRPUiI6IkdyZWF0ZXJUaGFuIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IlFVQU5USVRZX0ZPUl9PTkVfQVNTRU1CTFkiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IjEifSx7Ik9QRVJBVE9SIjoiSXMiLCJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiSVNfQUNUSVZFIiwiUEFUSCI6IklURU0ifSwiVkFMVUUiOiJUcnVlIn1dfSwiQ0hBTkdFX0NPTkZJR1VSQVRJT04iOnsiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IkhJR0hMSUdIVF9PUkFOR0UiLCJQQVRIIjoiSVRFTSJ9LCJPUEVSQVRPUiI6IlNldEZpeGVkIiwiUkVQTEFDRV9URVhUX1ZBTFVFIjoiIiwiUkVQTEFDRV9XSVRIX1ZBTFVFIjoiIiwiVkFMVUUiOiJUcnVlIn19";
const sItemCategoryIdMassChange2 = "eyJGSUxURVJfQ09ORklHVVJBVElPTiI6eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlByb2Nlc3MifV19LCJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiSVRFTV9DQVRFR09SWV9JRCIsIlBBVEgiOiJJVEVNIn0sIk9QRVJBVE9SIjoiU2V0Rml4ZWQiLCJSRVBMQUNFX1RFWFRfVkFMVUUiOiIiLCJSRVBMQUNFX1dJVEhfVkFMVUUiOiIiLCJWQUxVRSI6Ik1hdGVyaWFsIn19";

// data after
const aFrontendSettingsIds = [100, 101, 102, 103, 104];
const aFrontendSettingsTestData = [
    [aFrontendSettingsIds[0], "ItemCategoryIdFilter", "FILTER", sItemCategoryIdFilter],
    [aFrontendSettingsIds[1], "ItemCategoryIdFilter2", "FILTER", sItemCategoryIdFilter2],
    [aFrontendSettingsIds[2], "ItemCategoryIdFilter3", "FILTER", sItemCategoryIdFilter3],
    [aFrontendSettingsIds[3], "ItemCategoryIdMassChange", "MASSCHANGE", sItemCategoryIdMassChange],
    [aFrontendSettingsIds[4], "ItemCategoryIdMassChange2", "MASSCHANGE", sItemCategoryIdMassChange2],
];

const aExpectedSettingContent = [
    "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiQ3VzdG9tX0l0ZW1fQ2F0ZWdvcmllcyIsIkNPTFVNTl9JRCI6IkNISUxEX0lURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTS5DVVNUT01fSVRFTV9DQVRFR09SSUVTIn0sIlZBTFVFIjoiMTAifSx7Ik9QRVJBVE9SIjoiR3JlYXRlclRoYW4iLCJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiUVVBTlRJVFlfRk9SX09ORV9BU1NFTUJMWSIsIlBBVEgiOiJJVEVNIn0sIlZBTFVFIjoiMSJ9LHsiT1BFUkFUT1IiOiJJcyIsIkZJRUxEIjp7IkJVU0lORVNTX09CSkVDVCI6Ikl0ZW0iLCJDT0xVTU5fSUQiOiJJU19BQ1RJVkUiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlRydWUifV19",
    "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiQ3VzdG9tX0l0ZW1fQ2F0ZWdvcmllcyIsIkNPTFVNTl9JRCI6IkNISUxEX0lURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTS5DVVNUT01fSVRFTV9DQVRFR09SSUVTIn0sIlZBTFVFIjoiMiJ9LHsiT1BFUkFUT1IiOiJJcyIsIkZJRUxEIjp7IkJVU0lORVNTX09CSkVDVCI6IkN1c3RvbV9JdGVtX0NhdGVnb3JpZXMiLCJDT0xVTU5fSUQiOiJDSElMRF9JVEVNX0NBVEVHT1JZX0lEIiwiUEFUSCI6IklURU0uQ1VTVE9NX0lURU1fQ0FURUdPUklFUyJ9LCJWQUxVRSI6IjUifV19",
    "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiQ3VzdG9tX0l0ZW1fQ2F0ZWdvcmllcyIsIkNPTFVNTl9JRCI6IkNISUxEX0lURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTS5DVVNUT01fSVRFTV9DQVRFR09SSUVTIn0sIlZBTFVFIjoiMiJ9XX0=",
    "eyJGSUxURVJfQ09ORklHVVJBVElPTiI6eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiQ3VzdG9tX0l0ZW1fQ2F0ZWdvcmllcyIsIkNPTFVNTl9JRCI6IkNISUxEX0lURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTS5DVVNUT01fSVRFTV9DQVRFR09SSUVTIn0sIlZBTFVFIjoiMTAifSx7Ik9QRVJBVE9SIjoiR3JlYXRlclRoYW4iLCJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiUVVBTlRJVFlfRk9SX09ORV9BU1NFTUJMWSIsIlBBVEgiOiJJVEVNIn0sIlZBTFVFIjoiMSJ9LHsiT1BFUkFUT1IiOiJJcyIsIkZJRUxEIjp7IkJVU0lORVNTX09CSkVDVCI6Ikl0ZW0iLCJDT0xVTU5fSUQiOiJJU19BQ1RJVkUiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlRydWUifV19LCJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiSElHSExJR0hUX09SQU5HRSIsIlBBVEgiOiJJVEVNIn0sIk9QRVJBVE9SIjoiU2V0Rml4ZWQiLCJSRVBMQUNFX1RFWFRfVkFMVUUiOiIiLCJSRVBMQUNFX1dJVEhfVkFMVUUiOiIiLCJWQUxVRSI6IlRydWUifX0=",
    "eyJGSUxURVJfQ09ORklHVVJBVElPTiI6eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiQ3VzdG9tX0l0ZW1fQ2F0ZWdvcmllcyIsIkNPTFVNTl9JRCI6IkNISUxEX0lURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTS5DVVNUT01fSVRFTV9DQVRFR09SSUVTIn0sIlZBTFVFIjoiNSJ9XX0sIkNIQU5HRV9DT05GSUdVUkFUSU9OIjp7IkZJRUxEIjp7IkJVU0lORVNTX09CSkVDVCI6IkN1c3RvbV9JdGVtX0NhdGVnb3JpZXMiLCJDT0xVTU5fSUQiOiJDSElMRF9JVEVNX0NBVEVHT1JZX0lEIiwiUEFUSCI6IklURU0uQ1VTVE9NX0lURU1fQ0FURUdPUklFUyJ9LCJPUEVSQVRPUiI6IlNldEZpeGVkIiwiUkVQTEFDRV9URVhUX1ZBTFVFIjoiIiwiUkVQTEFDRV9XSVRIX1ZBTFVFIjoiIiwiVkFMVUUiOiIyIn19"
];

const aFrontendSettingsExpectedData = [
    [aFrontendSettingsIds[0], "ItemCategoryIdFilter", "FILTER", aExpectedSettingContent[0]],
    [aFrontendSettingsIds[1], "ItemCategoryIdFilter2", "FILTER", aExpectedSettingContent[1]],
    [aFrontendSettingsIds[2], "ItemCategoryIdFilter3", "FILTER", aExpectedSettingContent[2]],
    [aFrontendSettingsIds[3], "ItemCategoryIdMassChange", "MASSCHANGE", aExpectedSettingContent[3]],
    [aFrontendSettingsIds[4], "ItemCategoryIdMassChange2", "MASSCHANGE", aExpectedSettingContent[4]],
];

describe('adapt t_frontend_settings', () => {
    beforeAll(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    afterAll(() => {
        if (oConnection) {
            oConnection.close();
        }
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it("insert values into t_frontend_settings", () => {
            oConnection.executeUpdate(`delete from "${sFrontendSettings}" where SETTING_ID in (${aFrontendSettingsIds.join()})`);
            oConnection.executeUpdate(`INSERT INTO "${sFrontendSettings}" (SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT)
                                       VALUES (?, ?, ?, ?)`, aFrontendSettingsTestData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("Setting content should be updated accordingly after data model change", () => {
            const aFrontendSettingsXSA = oConnection.executeQuery(`select SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT
                                                                    from "${sFrontendSettings}"
                                                               where SETTING_ID in (${aFrontendSettingsIds.join()}) order by SETTING_ID`);
            aFrontendSettingsXSA.forEach((oFrontendSetting, iIndex) => {
                expect(_.values(oFrontendSetting).toString()).toBe(aFrontendSettingsExpectedData[iIndex].toString());
            });
        });

        it("Should clean up test data", () => {
            oConnection.executeUpdate(`delete from "${sFrontendSettings}" where SETTING_ID in (${aFrontendSettingsIds.join()})`);
            oConnection.commit();
        });
    }
});