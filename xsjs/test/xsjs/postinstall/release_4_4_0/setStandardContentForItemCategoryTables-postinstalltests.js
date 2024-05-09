const aPlcTableNames = ["sap.plc.db::basis.t_item_category", "sap.plc.db::basis.t_item_category__text"];
const oItemCategory = require("../../../testdata/testdata").data.oItemCategory;
const oItemCategoryText = require("../../../testdata/testdata").data.oItemCategoryText;
const oTestDemoData = require("../../../testdata/testdata").data.oTestDemoData;
const data = require("../../../testdata/testdata").data
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var oConnection = null;

describe("Sets value for t_item_category and t_item_category__text tables", () => {

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        var oItemCategoryEntity = [
            [oItemCategory.ITEM_CATEGORY_ID[0], oItemCategory.DISPLAY_ORDER[0], oItemCategory.CHILD_ITEM_CATEGORY_ID[0], oItemCategory.ICON[0], oItemCategory.CREATED_ON[0], oItemCategory.CREATED_BY[0], oItemCategory.LAST_MODIFIED_ON[0], oItemCategory.LAST_MODIFIED_BY[0],oItemCategory.ITEM_CATEGORY_CODE[0]],
            [oItemCategory.ITEM_CATEGORY_ID[1], oItemCategory.DISPLAY_ORDER[1], oItemCategory.CHILD_ITEM_CATEGORY_ID[1], oItemCategory.ICON[1], oItemCategory.CREATED_ON[1], oItemCategory.CREATED_BY[1], oItemCategory.LAST_MODIFIED_ON[1], oItemCategory.LAST_MODIFIED_BY[1],oItemCategory.ITEM_CATEGORY_CODE[1]],
            [oItemCategory.ITEM_CATEGORY_ID[2], oItemCategory.DISPLAY_ORDER[2], oItemCategory.CHILD_ITEM_CATEGORY_ID[2], oItemCategory.ICON[2], oItemCategory.CREATED_ON[2], oItemCategory.CREATED_BY[2], oItemCategory.LAST_MODIFIED_ON[2], oItemCategory.LAST_MODIFIED_BY[2],oItemCategory.ITEM_CATEGORY_CODE[2]],
            [oItemCategory.ITEM_CATEGORY_ID[3], oItemCategory.DISPLAY_ORDER[3], oItemCategory.CHILD_ITEM_CATEGORY_ID[3], oItemCategory.ICON[3], oItemCategory.CREATED_ON[3], oItemCategory.CREATED_BY[3], oItemCategory.LAST_MODIFIED_ON[3], oItemCategory.LAST_MODIFIED_BY[3],oItemCategory.ITEM_CATEGORY_CODE[3]],
            [oItemCategory.ITEM_CATEGORY_ID[4], oItemCategory.DISPLAY_ORDER[4], oItemCategory.CHILD_ITEM_CATEGORY_ID[4], oItemCategory.ICON[4], oItemCategory.CREATED_ON[4], oItemCategory.CREATED_BY[4], oItemCategory.LAST_MODIFIED_ON[4], oItemCategory.LAST_MODIFIED_BY[4],oItemCategory.ITEM_CATEGORY_CODE[4]],
            [oItemCategory.ITEM_CATEGORY_ID[5], oItemCategory.DISPLAY_ORDER[5], oItemCategory.CHILD_ITEM_CATEGORY_ID[5], oItemCategory.ICON[5], oItemCategory.CREATED_ON[5], oItemCategory.CREATED_BY[5], oItemCategory.LAST_MODIFIED_ON[5], oItemCategory.LAST_MODIFIED_BY[5],oItemCategory.ITEM_CATEGORY_CODE[5]],
            [oItemCategory.ITEM_CATEGORY_ID[6], oItemCategory.DISPLAY_ORDER[6], oItemCategory.CHILD_ITEM_CATEGORY_ID[6], oItemCategory.ICON[6], oItemCategory.CREATED_ON[6], oItemCategory.CREATED_BY[6], oItemCategory.LAST_MODIFIED_ON[6], oItemCategory.LAST_MODIFIED_BY[6],oItemCategory.ITEM_CATEGORY_CODE[6]],
            [oItemCategory.ITEM_CATEGORY_ID[7], oItemCategory.DISPLAY_ORDER[7], oItemCategory.CHILD_ITEM_CATEGORY_ID[7], oItemCategory.ICON[7], oItemCategory.CREATED_ON[7], oItemCategory.CREATED_BY[7], oItemCategory.LAST_MODIFIED_ON[7], oItemCategory.LAST_MODIFIED_BY[7],oItemCategory.ITEM_CATEGORY_CODE[7]],
            [oItemCategory.ITEM_CATEGORY_ID[8], oItemCategory.DISPLAY_ORDER[8], oItemCategory.CHILD_ITEM_CATEGORY_ID[8], oItemCategory.ICON[8], oItemCategory.CREATED_ON[8], oItemCategory.CREATED_BY[8], oItemCategory.LAST_MODIFIED_ON[8], oItemCategory.LAST_MODIFIED_BY[8],oItemCategory.ITEM_CATEGORY_CODE[8]],
            [oItemCategory.ITEM_CATEGORY_ID[9], oItemCategory.DISPLAY_ORDER[9], oItemCategory.CHILD_ITEM_CATEGORY_ID[9], oItemCategory.ICON[9], oItemCategory.CREATED_ON[9], oItemCategory.CREATED_BY[9], oItemCategory.LAST_MODIFIED_ON[9], oItemCategory.LAST_MODIFIED_BY[9],oItemCategory.ITEM_CATEGORY_CODE[9]],
            [oItemCategory.ITEM_CATEGORY_ID[10], oItemCategory.DISPLAY_ORDER[10], oItemCategory.CHILD_ITEM_CATEGORY_ID[10], oItemCategory.ICON[10], oItemCategory.CREATED_ON[10], oItemCategory.CREATED_BY[10], oItemCategory.LAST_MODIFIED_ON[10], oItemCategory.LAST_MODIFIED_BY[10],oItemCategory.ITEM_CATEGORY_CODE[10]],
            [oItemCategory.ITEM_CATEGORY_ID[11], oItemCategory.DISPLAY_ORDER[11], oItemCategory.CHILD_ITEM_CATEGORY_ID[11], oItemCategory.ICON[11], oItemCategory.CREATED_ON[11], oItemCategory.CREATED_BY[11], oItemCategory.LAST_MODIFIED_ON[11], oItemCategory.LAST_MODIFIED_BY[11],oItemCategory.ITEM_CATEGORY_CODE[11]]
        ]

        var oItemCategoryTextEntity = [
            [oItemCategoryText.ITEM_CATEGORY_ID[0], oTestDemoData.LANGUAGE[0], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[0], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[0], oItemCategoryText.ITEM_CATEGORY_NAME[0]],
            [oItemCategoryText.ITEM_CATEGORY_ID[1], oTestDemoData.LANGUAGE[1], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[1], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[1], oItemCategoryText.ITEM_CATEGORY_NAME[1]],
            [oItemCategoryText.ITEM_CATEGORY_ID[2], oTestDemoData.LANGUAGE[2], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[2], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[2], oItemCategoryText.ITEM_CATEGORY_NAME[2]],
            [oItemCategoryText.ITEM_CATEGORY_ID[3], oTestDemoData.LANGUAGE[3], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[3], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[3], oItemCategoryText.ITEM_CATEGORY_NAME[3]],
            [oItemCategoryText.ITEM_CATEGORY_ID[4], oTestDemoData.LANGUAGE[4], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[4], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[4], oItemCategoryText.ITEM_CATEGORY_NAME[4]],
            [oItemCategoryText.ITEM_CATEGORY_ID[5], oTestDemoData.LANGUAGE[5], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[5], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[5], oItemCategoryText.ITEM_CATEGORY_NAME[5]],
            [oItemCategoryText.ITEM_CATEGORY_ID[6], oTestDemoData.LANGUAGE[6], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[6], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[6], oItemCategoryText.ITEM_CATEGORY_NAME[6]],
            [oItemCategoryText.ITEM_CATEGORY_ID[7], oTestDemoData.LANGUAGE[7], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[7], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[7], oItemCategoryText.ITEM_CATEGORY_NAME[7]],
            [oItemCategoryText.ITEM_CATEGORY_ID[8], oTestDemoData.LANGUAGE[8], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[8], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[8], oItemCategoryText.ITEM_CATEGORY_NAME[8]],
            [oItemCategoryText.ITEM_CATEGORY_ID[9], oTestDemoData.LANGUAGE[9], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[9], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[9], oItemCategoryText.ITEM_CATEGORY_NAME[9]],
            [oItemCategoryText.ITEM_CATEGORY_ID[10], oTestDemoData.LANGUAGE[10], oItemCategoryText.ITEM_CATEGORY_DESCRIPTION[10], oItemCategoryText.CHILD_ITEM_CATEGORY_ID[10], oItemCategoryText.ITEM_CATEGORY_NAME[10]]
        ]

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`DELETE from "${aPlcTableNames[0]}"`);
            oConnection.executeUpdate(`DELETE from "${aPlcTableNames[1]}"`)


            oConnection.executeUpdate(`INSERT INTO "${aPlcTableNames[0]}" (ITEM_CATEGORY_ID, DISPLAY_ORDER, CHILD_ITEM_CATEGORY_ID, ICON,CREATED_ON,CREATED_BY,LAST_MODIFIED_ON,LAST_MODIFIED_BY,ITEM_CATEGORY_CODE)
                                       VALUES (?, ?, ?, ?,?, ?, ?, ?, ?)`, oItemCategoryEntity);
            oConnection.executeUpdate(`INSERT INTO "${aPlcTableNames[1]}" (ITEM_CATEGORY_ID, LANGUAGE, ITEM_CATEGORY_DESCRIPTION, CHILD_ITEM_CATEGORY_ID,ITEM_CATEGORY_NAME)
                                       VALUES (?, ?, ?, ?,?)`, oItemCategoryTextEntity);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should remove the value for t_item_category (CHILD_ITEM_CATEGORY_ID = 0 and ITEM_CATEGORY_ID != 0)", () => {

            var oExpectItemCategoryColumns = {
                "ITEM_CATEGORY_ID": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                "DISPLAY_ORDER": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                "CHILD_ITEM_CATEGORY_ID": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                "ICON": ['\\ue1d7', '\\ue1b4', '\\ue080', '\\ue0a6', '\\ue078', '\\ue0c7', '\\ue13f', '\\ue002', '\\ue206', '\\ue1a3', '\\ue1d1'],
                "ITEM_CATEGORY_CODE": ['CALCULATION VERSION', 'DOCUMENT', 'MATERIAL', 'INTERNAL ACTIVITY', 'EXTERNAL ACTIVITY', 'PROCESS', 'SUBCONTRACTING', 'RESOURCES AND TOOLS', 'VARIABLE ITEM', 'TEXT ITEM', 'REFERENCED VERSION']
                 };
            const oActualValuesItemCategoryTab = oConnection.executeQuery(`SELECT ITEM_CATEGORY_ID,DISPLAY_ORDER,CHILD_ITEM_CATEGORY_ID,ICON,ITEM_CATEGORY_CODE FROM "${aPlcTableNames[0]}" WHERE ITEM_CATEGORY_ID !=-1`);
            expect(oActualValuesItemCategoryTab).toMatchData(oExpectItemCategoryColumns, ['ITEM_CATEGORY_ID','DISPLAY_ORDER','CHILD_ITEM_CATEGORY_ID','ICON','ITEM_CATEGORY_CODE']);
        });

        it("should remove the value for t_item_category__text (CHILD_ITEM_CATEGORY_ID = 0 and ITEM_CATEGORY_ID != 0)", () => {

            var oExpectItemCategoryText = {
                "ITEM_CATEGORY_ID": [0],
                "LANGUAGE": ['Test0'],
                "ITEM_CATEGORY_DESCRIPTION": ['Calculation version'],
                "CHILD_ITEM_CATEGORY_ID": [0],
                "ITEM_CATEGORY_NAME": ['Calculation version']
            };
            const oActualValuesForItemCategoryTextTab = oConnection.executeQuery(`SELECT ITEM_CATEGORY_ID,LANGUAGE,ITEM_CATEGORY_DESCRIPTION,CHILD_ITEM_CATEGORY_ID,ITEM_CATEGORY_NAME FROM "${aPlcTableNames[1]}" WHERE LANGUAGE LIKE 'Test%'`);

            expect(oActualValuesForItemCategoryTextTab.length).toBe(1);
            expect(oActualValuesForItemCategoryTextTab).toMatchData(oExpectItemCategoryText, ['ITEM_CATEGORY_ID','LANGUAGE','ITEM_CATEGORY_DESCRIPTION','CHILD_ITEM_CATEGORY_ID','ITEM_CATEGORY_NAME']);
            
            oConnection.executeUpdate(`DELETE FROM "${aPlcTableNames[1]}" WHERE LANGUAGE LIKE 'Test%'`);

            oConnection.commit();
        });
    }
}); 