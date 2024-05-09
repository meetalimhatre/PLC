const helpers = require("../../../../lib/xs/util/helpers");
const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const frontendSettingsAdaption = $.import("xs.postinstall.release_4_4_0", "update_filter_mass_change_setting_content");

describe("adapt_filter_mass_change_setting_content-tests", () => {
    let oMockstar;

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                frontend_settings: "sap.plc.db::basis.t_frontend_settings",
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
    });

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
    it("01_should adapt correctly all the columns that were affected by data model change when they appear in field SETTING_CONTENT in t_frontend_settings", () => {
        // arrange
        // data before
        const sItemCategoryIdFilter = "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlJlZmVyZW5jZWRWZXJzaW9uIn0seyJPUEVSQVRPUiI6IkdyZWF0ZXJUaGFuIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IlFVQU5USVRZX0ZPUl9PTkVfQVNTRU1CTFkiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IjEifSx7Ik9QRVJBVE9SIjoiSXMiLCJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiSVNfQUNUSVZFIiwiUEFUSCI6IklURU0ifSwiVkFMVUUiOiJUcnVlIn1dfQ==";
        const sItemCategoryIdFilter2 = "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6Ik1hdGVyaWFsIn0seyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlByb2Nlc3MifV19";
        const sItemCategoryIdFilter3 = "eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6Ik1hdGVyaWFsIn1dfQ==";

        const sItemCategoryIdMassChange = "eyJGSUxURVJfQ09ORklHVVJBVElPTiI6eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlJlZmVyZW5jZWRWZXJzaW9uIn0seyJPUEVSQVRPUiI6IkdyZWF0ZXJUaGFuIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IlFVQU5USVRZX0ZPUl9PTkVfQVNTRU1CTFkiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IjEifSx7Ik9QRVJBVE9SIjoiSXMiLCJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiSVNfQUNUSVZFIiwiUEFUSCI6IklURU0ifSwiVkFMVUUiOiJUcnVlIn1dfSwiQ0hBTkdFX0NPTkZJR1VSQVRJT04iOnsiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IkhJR0hMSUdIVF9PUkFOR0UiLCJQQVRIIjoiSVRFTSJ9LCJPUEVSQVRPUiI6IlNldEZpeGVkIiwiUkVQTEFDRV9URVhUX1ZBTFVFIjoiIiwiUkVQTEFDRV9XSVRIX1ZBTFVFIjoiIiwiVkFMVUUiOiJUcnVlIn19";
        const sItemCategoryIdMassChange2 = "eyJGSUxURVJfQ09ORklHVVJBVElPTiI6eyJDT05ESVRJT05TIjpbeyJPUEVSQVRPUiI6IklzIiwiRklFTEQiOnsiQlVTSU5FU1NfT0JKRUNUIjoiSXRlbSIsIkNPTFVNTl9JRCI6IklURU1fQ0FURUdPUllfSUQiLCJQQVRIIjoiSVRFTSJ9LCJWQUxVRSI6IlByb2Nlc3MifV19LCJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMRCI6eyJCVVNJTkVTU19PQkpFQ1QiOiJJdGVtIiwiQ09MVU1OX0lEIjoiSVRFTV9DQVRFR09SWV9JRCIsIlBBVEgiOiJJVEVNIn0sIk9QRVJBVE9SIjoiU2V0Rml4ZWQiLCJSRVBMQUNFX1RFWFRfVkFMVUUiOiIiLCJSRVBMQUNFX1dJVEhfVkFMVUUiOiIiLCJWQUxVRSI6Ik1hdGVyaWFsIn19";

        // data after
        const aExpectedFrontendSettings = [
            "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Custom_Item_Categories\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM.CUSTOM_ITEM_CATEGORIES\"},\"VALUE\":\"10\"},{\"OPERATOR\":\"GreaterThan\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"QUANTITY_FOR_ONE_ASSEMBLY\",\"PATH\":\"ITEM\"},\"VALUE\":\"1\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"IS_ACTIVE\",\"PATH\":\"ITEM\"},\"VALUE\":\"True\"}]}",
            "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Custom_Item_Categories\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM.CUSTOM_ITEM_CATEGORIES\"},\"VALUE\":\"2\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Custom_Item_Categories\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM.CUSTOM_ITEM_CATEGORIES\"},\"VALUE\":\"5\"}]}",
            "{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Custom_Item_Categories\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM.CUSTOM_ITEM_CATEGORIES\"},\"VALUE\":\"2\"}]}",
            "{\"FILTER_CONFIGURATION\":{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Custom_Item_Categories\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM.CUSTOM_ITEM_CATEGORIES\"},\"VALUE\":\"10\"},{\"OPERATOR\":\"GreaterThan\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"QUANTITY_FOR_ONE_ASSEMBLY\",\"PATH\":\"ITEM\"},\"VALUE\":\"1\"},{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"IS_ACTIVE\",\"PATH\":\"ITEM\"},\"VALUE\":\"True\"}]},\"CHANGE_CONFIGURATION\":{\"FIELD\":{\"BUSINESS_OBJECT\":\"Item\",\"COLUMN_ID\":\"HIGHLIGHT_ORANGE\",\"PATH\":\"ITEM\"},\"OPERATOR\":\"SetFixed\",\"REPLACE_TEXT_VALUE\":\"\",\"REPLACE_WITH_VALUE\":\"\",\"VALUE\":\"True\"}}",
            "{\"FILTER_CONFIGURATION\":{\"CONDITIONS\":[{\"OPERATOR\":\"Is\",\"FIELD\":{\"BUSINESS_OBJECT\":\"Custom_Item_Categories\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM.CUSTOM_ITEM_CATEGORIES\"},\"VALUE\":\"5\"}]},\"CHANGE_CONFIGURATION\":{\"FIELD\":{\"BUSINESS_OBJECT\":\"Custom_Item_Categories\",\"COLUMN_ID\":\"CHILD_ITEM_CATEGORY_ID\",\"PATH\":\"ITEM.CUSTOM_ITEM_CATEGORIES\"},\"OPERATOR\":\"SetFixed\",\"REPLACE_TEXT_VALUE\":\"\",\"REPLACE_WITH_VALUE\":\"\",\"VALUE\":\"2\"}}"
        ];

        const oFrontendSettingsTestData = {
            SETTING_ID: [100, 101, 102, 103, 104],
            SETTING_NAME: ["ItemCategoryIdFilter", "ItemCategoryIdFilter2", "ItemCategoryIdFilter3", "ItemCategoryIdMassChange", "ItemCategoryIdMassChange2"],
            SETTING_TYPE: ["FILTER", "FILTER", "FILTER", "MASSCHANGE", "MASSCHANGE"],
            USER_ID: [null, null, null, null, null],
            SETTING_CONTENT: [sItemCategoryIdFilter, sItemCategoryIdFilter2, sItemCategoryIdFilter3, sItemCategoryIdMassChange, sItemCategoryIdMassChange2],
        };
        oMockstar.insertTableData("frontend_settings", oFrontendSettingsTestData);
        jasmine.dbConnection.commit();

        // act
        frontendSettingsAdaption.run(jasmine.dbConnection);

        // assert
        const oFrontendSettingsAfter = oMockstar.execQuery(`select SETTING_ID, SETTING_CONTENT from {{frontend_settings}}
                                                                    where SETTING_ID in (${oFrontendSettingsTestData.SETTING_ID}) order by SETTING_ID`);

        oFrontendSettingsAfter.columns.SETTING_CONTENT.rows.forEach((sFrontendSetting, iIndex) => {
            expect(helpers.arrayBufferToString($.util.codec.decodeBase64(sFrontendSetting))).toBe(aExpectedFrontendSettings[iIndex]);
        });

        oMockstar.clearTable("frontend_settings");
        jasmine.dbConnection.commit();
    });
}).addTags(["All_Unit_Tests"]);
