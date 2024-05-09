const _ = require("lodash");
const sLayoutColumnTable = "sap.plc.db::basis.t_layout_column";
const sLayoutHiddenFieldTable = "sap.plc.db::basis.t_layout_hidden_field";

var oConnection = null;
const aLayoutColumnId = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 2000, 2000, 2000, 2000,
                        2000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 4000, 4000, 4000, 5000, 6000, 6000, 6000, 6000];
const aLayoutHiddenFieldId = [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 2000, 2001, 2002, 2003,
    2004, 3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 4000, 4001, 4002, 5000, 6000, 6001, 6002, 6003];
const aLayoutColumnData = [
   [aLayoutColumnId[0],  0, null, "Calculation_Version", "REPORT_CURRENCY_ID"],
   [aLayoutColumnId[1],  1, "ITEM.CALCULATION_VERSION", "Laboratory_Design_Office", "LABORATORY_DESIGN_OFFICE_ID"],
   [aLayoutColumnId[2],  2, "ITEM.LABORATORY_DESIGN_OFFICE", "Document_Status", "DOCUMENT_STATUS_ID"],
   [aLayoutColumnId[3],  3, "ITEM.DOCUMENT_STATUS", "Project", "PROJECT_ID"],
   [aLayoutColumnId[4],  4, "ITEM", "Business_Process", "BUSINESS_PROCESS_ID"],
   [aLayoutColumnId[5],  5, "CALCULATION_VERSION.CALCULATION.PROJECT", "Item", "CREATED_AT"],
   [aLayoutColumnId[6],  6,  "ITEM.BUSINESS_PROCESS", "Item", "LAST_MODIFIED_AT"],
   [aLayoutColumnId[7],  7, "ITEM.MATERIAL", "Item", "LAST_MODIFIED_BY_USER_ID"],
   [aLayoutColumnId[8],  0, null, "Item", "CREATED_BY_USER_ID"],
   [aLayoutColumnId[9],  1, "ITEM.MATERIAL_TYPE", "Item", "_CREATED_BY_USER_ID"],
   [aLayoutColumnId[10], 2, "ITEM.MATERIAL_GROUP", "Item", "_CREATED_BY_USER_ID_FIRST_VERSION"],
   [aLayoutColumnId[11], 3, "ITEM", "Item", "IF_AN_AGGREGATE"],
   [aLayoutColumnId[12], 4, "ITEM", "Item", "OVERHEAD_PRICE_UOM_ID"],
   [aLayoutColumnId[13], 0, null, "Item", "PRICE_APPLIED_SURCHARGE"],
   [aLayoutColumnId[14], 1, "ITEM", "Item", "PRICE_SOURCE_TYPE"],
   [aLayoutColumnId[15], 2, "ITEM.OVERHEAD_GROUP", "Item", "PRICE_TRANSACTION_CURRENCY_ID"],
   [aLayoutColumnId[16], 3, "ITEM.VALUATION_CLASS", "Item", "QUANTITY_DEPENDENCY_MODE"],
   [aLayoutColumnId[17], 4, "ITEM", "Item", "QUANTITY_FOR_ONE_ASSEMBLY"],
   [aLayoutColumnId[18], 5, "ITEM", "Item", "QUANTITY_FOR_ONE_ASSEMBLY_UOM_ID"],
   [aLayoutColumnId[19], 6, "ITEM.COMPANY_CODE", "Item", "QUANTITY_FOR_ONE_ASSEMBLY_CALCULATED"],
   [aLayoutColumnId[20], 7, "ITEM.BUSINESS_AREA", "Calculation_Version", "QUANTITY_FOR_ONE_ASSEMBLY_IS_MANUAL"],
   [aLayoutColumnId[21], 8, "ITEM.COMPANY_CODE", "Item", "IS_AN_AGGREGATION"],
   [aLayoutColumnId[22], 0, null, "Laboratory_Design_Office", "IS_ROLLED_UP"],
   [aLayoutColumnId[23], 1, "ITEM", "Item", "COSTING_LOT_SIZE"],
   [aLayoutColumnId[24], 2, "ITEM.OVERHEAD_GROUP", "Item", "COSTING_LOT_SIZE_CALCULATED"],
   [aLayoutColumnId[25], 3, "ITEM.VALUATION_CLASS", "Item", "COSTING_LOT_SIZE_IS_MANUAL"],
   [aLayoutColumnId[26], 4, "ITEM", "Item", "MATERIAL_COSTING_LOT_SIZE"],
   [aLayoutColumnId[27], 5, "CALCULATION_VERSION.CUSTOMER", "Business_Process", "MATERIAL_COSTING_LOT_SIZE_UOM_ID"],
   [aLayoutColumnId[28], 6, "CALCULATION_VERSION", "Calculation_Version", "LAST_SAVED_AT"],
   [aLayoutColumnId[29], 7, "CALCULATION_VERSION", "Calculation_Version", "LAST_SAVED_BY_USER_ID"]
];

const aExpectedLayoutColumnData = [
   [aLayoutColumnId[0],  0, null, "Calculation_Version", "REPORT_CURRENCY_ID"],
   [aLayoutColumnId[1],  1, "ITEM.CALCULATION_VERSION", "Design_Office", "DESIGN_OFFICE_ID"],
   [aLayoutColumnId[2],  2, "ITEM.DESIGN_OFFICE", "Document_Status", "DOCUMENT_STATUS_ID"],
   [aLayoutColumnId[3],  3, "ITEM.DOCUMENT_STATUS", "Project", "PROJECT_ID"],
   [aLayoutColumnId[4],  4, "ITEM", "Process", "PROCESS_ID"],
   [aLayoutColumnId[5],  5, "CALCULATION_VERSION.CALCULATION.PROJECT", "Item", "CREATED_ON"],
   [aLayoutColumnId[6],  6,  "ITEM.PROCESS", "Item", "LAST_MODIFIED_ON"],
   [aLayoutColumnId[7],  7, "ITEM.MATERIAL", "Item", "LAST_MODIFIED_BY"],
   [aLayoutColumnId[8],  0, null, "Item", "CREATED_BY"],
   [aLayoutColumnId[9],  1, "ITEM.MATERIAL_TYPE", "Item", "_CREATED_BY"],
   [aLayoutColumnId[10], 2, "ITEM.MATERIAL_GROUP", "Item", "_CREATED_BY_FIRST_VERSION"],
   [aLayoutColumnId[11], 3, "ITEM", "Item", "SUBITEM_STATE"],
   [aLayoutColumnId[12], 4, "ITEM", "Item", "OVERHEAD_PRICE_UNIT_UOM_ID"],
   [aLayoutColumnId[13], 0, null, "Item", "SURCHARGE"],
   [aLayoutColumnId[14], 1, "ITEM", "Item", "PRICE_SOURCE_TYPE_ID"],
   [aLayoutColumnId[15], 2, "ITEM.OVERHEAD_GROUP", "Item", "TRANSACTION_CURRENCY_ID"],
   [aLayoutColumnId[16], 3, "ITEM.VALUATION_CLASS", "Item", "TOTAL_QUANTITY_DEPENDS_ON"],
   [aLayoutColumnId[17], 4, "ITEM", "Item", "QUANTITY"],
   [aLayoutColumnId[18], 5, "ITEM", "Item", "QUANTITY_UOM_ID"],
   [aLayoutColumnId[19], 6, "ITEM.COMPANY_CODE", "Item", "QUANTITY_CALCULATED"],
   [aLayoutColumnId[20], 7, "ITEM.BUSINESS_AREA", "Calculation_Version", "QUANTITY_IS_MANUAL"],
   [aLayoutColumnId[21], 8, "ITEM.COMPANY_CODE", "Item", "HAS_SUBITEMS"],
   [aLayoutColumnId[22], 0, null, "Design_Office", "IS_ROLLED_UP_VALUE"],
   [aLayoutColumnId[23], 1, "ITEM", "Item", "LOT_SIZE"],
   [aLayoutColumnId[24], 2, "ITEM.OVERHEAD_GROUP", "Item", "LOT_SIZE_CALCULATED"],
   [aLayoutColumnId[25], 3, "ITEM.VALUATION_CLASS", "Item", "LOT_SIZE_IS_MANUAL"],
   [aLayoutColumnId[26], 4, "ITEM", "Item", "MATERIAL_LOT_SIZE"],
   [aLayoutColumnId[27], 5, "CALCULATION_VERSION.CUSTOMER", "Process", "MATERIAL_LOT_SIZE_UOM_ID"],
   [aLayoutColumnId[28], 6, "CALCULATION_VERSION", "Calculation_Version", "LAST_MODIFIED_ON"],
   [aLayoutColumnId[29], 7, "CALCULATION_VERSION", "Calculation_Version", "LAST_MODIFIED_BY"]
];

const aLayoutHiddenFieldData = [
    [aLayoutHiddenFieldId[0], "ITEM", "Calculation_Version", "REPORT_CURRENCY_ID"],
    [aLayoutHiddenFieldId[1], "ITEM.CALCULATION_VERSION", "Laboratory_Design_Office", "LABORATORY_DESIGN_OFFICE_ID"],
    [aLayoutHiddenFieldId[2], "ITEM.LABORATORY_DESIGN_OFFICE", "Document_Status", "DOCUMENT_STATUS_ID"],
    [aLayoutHiddenFieldId[3], "ITEM.DOCUMENT_STATUS", "Project", "PROJECT_ID"],
    [aLayoutHiddenFieldId[4], "ITEM", "Business_Process", "BUSINESS_PROCESS_ID"],
    [aLayoutHiddenFieldId[5], "CALCULATION_VERSION.CALCULATION.PROJECT", "Item", "CREATED_AT"],
    [aLayoutHiddenFieldId[6], "ITEM.BUSINESS_PROCESS", "Item", "LAST_MODIFIED_AT"],
    [aLayoutHiddenFieldId[7], "ITEM.MATERIAL", "Item", "LAST_MODIFIED_BY_USER_ID"],
    [aLayoutHiddenFieldId[8], "ITEM", "Item", "CREATED_BY_USER_ID"],
    [aLayoutHiddenFieldId[9], "ITEM.MATERIAL_TYPE", "Item", "_CREATED_BY_USER_ID"],
    [aLayoutHiddenFieldId[10], "ITEM.MATERIAL_GROUP", "Item", "_CREATED_BY_USER_ID_FIRST_VERSION"],
    [aLayoutHiddenFieldId[11], "ITEM", "Item", "IF_AN_AGGREGATE"],
    [aLayoutHiddenFieldId[12], "ITEM", "Item", "OVERHEAD_PRICE_UOM_ID"],
    [aLayoutHiddenFieldId[13], "ITEM", "Item", "PRICE_APPLIED_SURCHARGE"],
    [aLayoutHiddenFieldId[14], "ITEM", "Item", "PRICE_SOURCE_TYPE"],
    [aLayoutHiddenFieldId[15], "ITEM.OVERHEAD_GROUP", "Item", "PRICE_TRANSACTION_CURRENCY_ID"],
    [aLayoutHiddenFieldId[16], "ITEM.VALUATION_CLASS", "Item", "QUANTITY_DEPENDENCY_MODE"],
    [aLayoutHiddenFieldId[17], "ITEM", "Item", "QUANTITY_FOR_ONE_ASSEMBLY"],
    [aLayoutHiddenFieldId[18], "ITEM", "Item", "QUANTITY_FOR_ONE_ASSEMBLY_UOM_ID"],
    [aLayoutHiddenFieldId[19], "ITEM.COMPANY_CODE", "Item", "QUANTITY_FOR_ONE_ASSEMBLY_CALCULATED"],
    [aLayoutHiddenFieldId[20], "ITEM.BUSINESS_AREA", "Calculation_Version", "QUANTITY_FOR_ONE_ASSEMBLY_IS_MANUAL"],
    [aLayoutHiddenFieldId[21], "ITEM.COMPANY_CODE", "Item", "IS_AN_AGGREGATION"],
    [aLayoutHiddenFieldId[22], "ITEM", "Laboratory_Design_Office", "IS_ROLLED_UP"],
    [aLayoutHiddenFieldId[23], "ITEM", "Item", "COSTING_LOT_SIZE"],
    [aLayoutHiddenFieldId[24], "ITEM.OVERHEAD_GROUP", "Item", "COSTING_LOT_SIZE_CALCULATED"],
    [aLayoutHiddenFieldId[25], "ITEM.VALUATION_CLASS", "Item", "COSTING_LOT_SIZE_IS_MANUAL"],
    [aLayoutHiddenFieldId[26], "ITEM", "Item", "MATERIAL_COSTING_LOT_SIZE"],
    [aLayoutHiddenFieldId[27], "CALCULATION_VERSION.CUSTOMER", "Business_Process", "MATERIAL_COSTING_LOT_SIZE_UOM_ID"],
    [aLayoutHiddenFieldId[28], "CALCULATION_VERSION", "Calculation_Version", "LAST_SAVED_AT"],
    [aLayoutHiddenFieldId[29], "CALCULATION_VERSION", "Calculation_Version", "LAST_SAVED_BY_USER_ID"]
 ];
 
 const aExpectedLayoutHiddenFieldData = [
    [aLayoutHiddenFieldId[0], "ITEM", "Calculation_Version", "REPORT_CURRENCY_ID"],
    [aLayoutHiddenFieldId[1], "ITEM.CALCULATION_VERSION", "Design_Office", "DESIGN_OFFICE_ID"],
    [aLayoutHiddenFieldId[2], "ITEM.DESIGN_OFFICE", "Document_Status", "DOCUMENT_STATUS_ID"],
    [aLayoutHiddenFieldId[3], "ITEM.DOCUMENT_STATUS", "Project", "PROJECT_ID"],
    [aLayoutHiddenFieldId[4], "ITEM", "Process",  "PROCESS_ID"],
    [aLayoutHiddenFieldId[5], "CALCULATION_VERSION.CALCULATION.PROJECT", "Item", "CREATED_ON"],
    [aLayoutHiddenFieldId[6], "ITEM.PROCESS", "Item", "LAST_MODIFIED_ON"],
    [aLayoutHiddenFieldId[7], "ITEM.MATERIAL", "Item", "LAST_MODIFIED_BY"],
    [aLayoutHiddenFieldId[8],  "ITEM", "Item", "CREATED_BY"],
    [aLayoutHiddenFieldId[9], "ITEM.MATERIAL_TYPE", "Item", "_CREATED_BY"],
    [aLayoutHiddenFieldId[10], "ITEM.MATERIAL_GROUP", "Item", "_CREATED_BY_FIRST_VERSION"],
    [aLayoutHiddenFieldId[11], "ITEM", "Item", "SUBITEM_STATE"],
    [aLayoutHiddenFieldId[12], "ITEM", "Item", "OVERHEAD_PRICE_UNIT_UOM_ID"],
    [aLayoutHiddenFieldId[13], "ITEM", "Item", "SURCHARGE"],
    [aLayoutHiddenFieldId[14], "ITEM", "Item", "PRICE_SOURCE_TYPE_ID"],
    [aLayoutHiddenFieldId[15], "ITEM.OVERHEAD_GROUP", "Item", "TRANSACTION_CURRENCY_ID"],
    [aLayoutHiddenFieldId[16], "ITEM.VALUATION_CLASS", "Item", "TOTAL_QUANTITY_DEPENDS_ON"],
    [aLayoutHiddenFieldId[17], "ITEM", "Item", "QUANTITY"],
    [aLayoutHiddenFieldId[18], "ITEM", "Item", "QUANTITY_UOM_ID"],
    [aLayoutHiddenFieldId[19], "ITEM.COMPANY_CODE", "Item", "QUANTITY_CALCULATED"],
    [aLayoutHiddenFieldId[20], "ITEM.BUSINESS_AREA", "Calculation_Version", "QUANTITY_IS_MANUAL"],
    [aLayoutHiddenFieldId[21], "ITEM.COMPANY_CODE", "Item", "HAS_SUBITEMS"],
    [aLayoutHiddenFieldId[22], "ITEM", "Design_Office", "IS_ROLLED_UP_VALUE"],
    [aLayoutHiddenFieldId[23], "ITEM", "Item", "LOT_SIZE"],
    [aLayoutHiddenFieldId[24], "ITEM.OVERHEAD_GROUP", "Item", "LOT_SIZE_CALCULATED"],
    [aLayoutHiddenFieldId[25], "ITEM.VALUATION_CLASS", "Item", "LOT_SIZE_IS_MANUAL"],
    [aLayoutHiddenFieldId[26], "ITEM", "Item", "MATERIAL_LOT_SIZE"],
    [aLayoutHiddenFieldId[27], "CALCULATION_VERSION.CUSTOMER", "Process", "MATERIAL_LOT_SIZE_UOM_ID"],
    [aLayoutHiddenFieldId[28], "CALCULATION_VERSION", "Calculation_Version", "LAST_MODIFIED_ON"],
    [aLayoutHiddenFieldId[29], "CALCULATION_VERSION", "Calculation_Version", "LAST_MODIFIED_BY"]
 ];
describe('adapt t_layout_column and t_layout_hidden_field acording to the data model changes', ()=>{
    beforeAll(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    afterAll(() => {
        if (oConnection) {
            oConnection.close();
        }
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it ("insert values into t_layout_column and t_layout_hidden_field", () => {
            oConnection.executeUpdate(`INSERT INTO "${sLayoutColumnTable}" (LAYOUT_ID, DISPLAY_ORDER, PATH, BUSINESS_OBJECT, COLUMN_ID)
                                       VALUES (?, ?, ?, ?, ?)`, aLayoutColumnData);
            oConnection.commit();
            oConnection.executeUpdate(`INSERT INTO "${sLayoutHiddenFieldTable}" (LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID)
                                       VALUES (?, ?, ?, ?)`, aLayoutHiddenFieldData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it ("should rename correctly all the columns that were affected by data model change in t_layout_column", () => {
            const aLayoutColumnXSA = oConnection.executeQuery(`select LAYOUT_ID, DISPLAY_ORDER, PATH, BUSINESS_OBJECT, COLUMN_ID
                                                                from "${sLayoutColumnTable}"
                                                            where LAYOUT_ID in (${aLayoutColumnId.join()}) order by LAYOUT_ID, DISPLAY_ORDER`);
            aLayoutColumnXSA.forEach((oLayoutColumn, iIndex) => {
                expect(_.values(oLayoutColumn).toString()).toBe(aExpectedLayoutColumnData[iIndex].toString());
            });
            // cleanup
            oConnection.executeUpdate(`delete from "${sLayoutColumnTable}" where LAYOUT_ID in (${aLayoutColumnId.join()})`);
            oConnection.commit();
        });
        it ("should rename correctly all the columns that were affected by data model change in t_layout_hidden_field", () => {
            const aLayoutColumnXSA = oConnection.executeQuery(`select LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID
                                                                    from "${sLayoutHiddenFieldTable}"
                                                                where LAYOUT_ID in (${aLayoutHiddenFieldId.join()}) order by LAYOUT_ID`);
            aLayoutColumnXSA.forEach((oLayoutColumn, iIndex) => {
                expect(_.values(oLayoutColumn).toString()).toBe(aExpectedLayoutHiddenFieldData[iIndex].toString());
            });
            // cleanup
            oConnection.executeUpdate(`delete from "${sLayoutHiddenFieldTable}" where LAYOUT_ID in (${aLayoutHiddenFieldId.join()})`);
            oConnection.commit();
        });
    }
});