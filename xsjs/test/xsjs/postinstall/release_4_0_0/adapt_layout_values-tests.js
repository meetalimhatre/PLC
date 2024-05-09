const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const renameColumnIdLayout = $.import("xs.postinstall.release_4_0_0", "adapt_layout_values");
describe("adapt_layout_values-tests", () => {
    let oMockstar;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                layout_column: "sap.plc.db::basis.t_layout_column",
                layout_hidden_field: "sap.plc.db::basis.t_layout_hidden_field",
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
    });

    it("should rename correctly all the columns that were affected by data model change in t_layout_column", () => {
        // arrange
        const oLayoutColumn = {
            LAYOUT_ID: [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 6],
            DISPLAY_ORDER: [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7],
            PATH: [null, "ITEM.CALCULATION_VERSION", "ITEM.LABORATORY_DESIGN_OFFICE", "ITEM.DOCUMENT_STATUS", "ITEM",
                "CALCULATION_VERSION.CALCULATION.PROJECT", "ITEM.BUSINESS_PROCESS", "ITEM.MATERIAL", null,
                "ITEM.MATERIAL_TYPE", "ITEM.MATERIAL_GROUP", "ITEM", "ITEM", null, "ITEM", "ITEM.OVERHEAD_GROUP",
                "ITEM.VALUATION_CLASS", "ITEM", "ITEM", "ITEM.COMPANY_CODE", "ITEM.BUSINESS_AREA", "ITEM.COMPANY_CODE", null,
                "ITEM", "ITEM.OVERHEAD_GROUP", "ITEM.VALUATION_CLASS", "ITEM", "CALCULATION_VERSION.CUSTOMER",
                "CALCULATION_VERSION", "CALCULATION_VERSION"],
            BUSINESS_OBJECT: ["Calculation_Version", "Laboratory_Design_Office", "Document_Status", "Project", "Business_Process",
                "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item",
                "Item", "Calculation_Version", "Item", "Laboratory_Design_Office", "Item", "Item", "Item", "Item", "Business_Process",
                "Calculation_Version", "Calculation_Version"],
            COLUMN_ID: ["REPORT_CURRENCY_ID", "LABORATORY_DESIGN_OFFICE_ID", "DOCUMENT_STATUS_ID", "PROJECT_ID",
                "BUSINESS_PROCESS_ID", "CREATED_AT", "LAST_MODIFIED_AT", "LAST_MODIFIED_BY_USER_ID", "CREATED_BY_USER_ID",
                "_CREATED_BY_USER_ID", "_CREATED_BY_USER_ID_FIRST_VERSION", "IF_AN_AGGREGATE", "OVERHEAD_PRICE_UOM_ID",
                "PRICE_APPLIED_SURCHARGE", "PRICE_SOURCE_TYPE", "PRICE_TRANSACTION_CURRENCY_ID", "QUANTITY_DEPENDENCY_MODE",
                "QUANTITY_FOR_ONE_ASSEMBLY", "QUANTITY_FOR_ONE_ASSEMBLY_UOM_ID", "QUANTITY_FOR_ONE_ASSEMBLY_CALCULATED",
                "QUANTITY_FOR_ONE_ASSEMBLY_IS_MANUAL", "IS_AN_AGGREGATION", "IS_ROLLED_UP", "COSTING_LOT_SIZE", "COSTING_LOT_SIZE_CALCULATED",
                "COSTING_LOT_SIZE_IS_MANUAL", "MATERIAL_COSTING_LOT_SIZE", "MATERIAL_COSTING_LOT_SIZE_UOM_ID",
                "LAST_SAVED_AT", "LAST_SAVED_BY_USER_ID"
            ],
        };
        const oExpectedLayoutColumn = {
            LAYOUT_ID: [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 6],
            DISPLAY_ORDER: [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7],
            PATH: [null, "ITEM.CALCULATION_VERSION", "ITEM.DESIGN_OFFICE", "ITEM.DOCUMENT_STATUS", "ITEM",
                "CALCULATION_VERSION.CALCULATION.PROJECT", "ITEM.PROCESS", "ITEM.MATERIAL", null,
                "ITEM.MATERIAL_TYPE", "ITEM.MATERIAL_GROUP", "ITEM", "ITEM", null, "ITEM", "ITEM.OVERHEAD_GROUP",
                "ITEM.VALUATION_CLASS", "ITEM", "ITEM", "ITEM.COMPANY_CODE", "ITEM.BUSINESS_AREA", "ITEM.COMPANY_CODE", null,
                "ITEM", "ITEM.OVERHEAD_GROUP", "ITEM.VALUATION_CLASS", "ITEM", "CALCULATION_VERSION.CUSTOMER",
                "CALCULATION_VERSION", "CALCULATION_VERSION"],
            BUSINESS_OBJECT: ["Calculation_Version", "Design_Office", "Document_Status", "Project", "Process",
                "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item",
                "Item", "Calculation_Version", "Item", "Design_Office", "Item", "Item", "Item", "Item", "Process",
                "Calculation_Version", "Calculation_Version"],
            COLUMN_ID: ["REPORT_CURRENCY_ID", "DESIGN_OFFICE_ID", "DOCUMENT_STATUS_ID", "PROJECT_ID",
                "PROCESS_ID", "CREATED_ON", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY", "CREATED_BY", "_CREATED_BY",
                "_CREATED_BY_FIRST_VERSION", "SUBITEM_STATE", "OVERHEAD_PRICE_UNIT_UOM_ID",
                "SURCHARGE", "PRICE_SOURCE_TYPE_ID", "TRANSACTION_CURRENCY_ID", "TOTAL_QUANTITY_DEPENDS_ON",
                "QUANTITY", "QUANTITY_UOM_ID", "QUANTITY_CALCULATED", "QUANTITY_IS_MANUAL", "HAS_SUBITEMS",
                "IS_ROLLED_UP_VALUE", "LOT_SIZE", "LOT_SIZE_CALCULATED", "LOT_SIZE_IS_MANUAL", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                "LAST_MODIFIED_ON", "LAST_MODIFIED_BY"
            ],
        };
        oMockstar.insertTableData("layout_column", oLayoutColumn);
        jasmine.dbConnection.commit();

        // act
        renameColumnIdLayout.run(jasmine.dbConnection);

        // assert
        const oLayoutColumnAfter = oMockstar.execQuery(`select LAYOUT_ID, DISPLAY_ORDER, PATH, BUSINESS_OBJECT, COLUMN_ID
                                                             from {{layout_column}}
                                                        where LAYOUT_ID in (${oLayoutColumn.LAYOUT_ID}) order by LAYOUT_ID, DISPLAY_ORDER`);
        expect(oLayoutColumnAfter).toMatchData(oExpectedLayoutColumn, ["LAYOUT_ID", "DISPLAY_ORDER", "PATH", "BUSINESS_OBJECT", "COLUMN_ID"]);
    });

    it("should rename correctly all the columns that were affected by data model change in t_layout_hidden_field", () => {
        // arrange
        const oLayoutHiddenField = {
            LAYOUT_ID: [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 6],
            PATH: ["ITEM", "ITEM.CALCULATION_VERSION", "ITEM.LABORATORY_DESIGN_OFFICE", "ITEM.DOCUMENT_STATUS", "ITEM",
                "CALCULATION_VERSION.CALCULATION.PROJECT", "ITEM.BUSINESS_PROCESS", "ITEM.MATERIAL", "ITEM",
                "ITEM.MATERIAL_TYPE", "ITEM.MATERIAL_GROUP", "ITEM", "ITEM", "ITEM", "ITEM", "ITEM.OVERHEAD_GROUP",
                "ITEM.VALUATION_CLASS", "ITEM", "ITEM", "ITEM.COMPANY_CODE", "ITEM.BUSINESS_AREA", "ITEM.COMPANY_CODE", "ITEM",
                "ITEM", "ITEM.OVERHEAD_GROUP", "ITEM.VALUATION_CLASS", "ITEM", "CALCULATION_VERSION.CUSTOMER",
                "CALCULATION_VERSION", "CALCULATION_VERSION"],
            BUSINESS_OBJECT: ["Calculation_Version", "Laboratory_Design_Office", "Document_Status", "Project", "Business_Process",
                "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item",
                "Item", "Calculation_Version", "Item", "Laboratory_Design_Office", "Item", "Item", "Item", "Item", "Business_Process",
                "Calculation_Version", "Calculation_Version"],
            COLUMN_ID: ["REPORT_CURRENCY_ID", "LABORATORY_DESIGN_OFFICE_ID", "DOCUMENT_STATUS_ID", "PROJECT_ID",
                "BUSINESS_PROCESS_ID", "CREATED_AT", "LAST_MODIFIED_AT", "LAST_MODIFIED_BY_USER_ID", "CREATED_BY_USER_ID",
                "_CREATED_BY_USER_ID", "_CREATED_BY_USER_ID_FIRST_VERSION", "IF_AN_AGGREGATE", "OVERHEAD_PRICE_UOM_ID",
                "PRICE_APPLIED_SURCHARGE", "PRICE_SOURCE_TYPE", "PRICE_TRANSACTION_CURRENCY_ID", "QUANTITY_DEPENDENCY_MODE",
                "QUANTITY_FOR_ONE_ASSEMBLY", "QUANTITY_FOR_ONE_ASSEMBLY_UOM_ID", "QUANTITY_FOR_ONE_ASSEMBLY_CALCULATED",
                "QUANTITY_FOR_ONE_ASSEMBLY_IS_MANUAL", "IS_AN_AGGREGATION", "IS_ROLLED_UP", "COSTING_LOT_SIZE", "COSTING_LOT_SIZE_CALCULATED",
                "COSTING_LOT_SIZE_IS_MANUAL", "MATERIAL_COSTING_LOT_SIZE", "MATERIAL_COSTING_LOT_SIZE_UOM_ID",
                "LAST_SAVED_AT", "LAST_SAVED_BY_USER_ID"
            ],
        };
        const oExpectedLayoutHiddenField = {
            LAYOUT_ID: [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 6],
            PATH: ["ITEM", "ITEM.CALCULATION_VERSION", "ITEM.DESIGN_OFFICE", "ITEM.DOCUMENT_STATUS", "ITEM",
                "CALCULATION_VERSION.CALCULATION.PROJECT", "ITEM.PROCESS", "ITEM.MATERIAL", "ITEM",
                "ITEM.MATERIAL_TYPE", "ITEM.MATERIAL_GROUP", "ITEM", "ITEM", "ITEM", "ITEM", "ITEM.OVERHEAD_GROUP",
                "ITEM.VALUATION_CLASS", "ITEM", "ITEM", "ITEM.COMPANY_CODE", "ITEM.BUSINESS_AREA", "ITEM.COMPANY_CODE", "ITEM",
                "ITEM", "ITEM.OVERHEAD_GROUP", "ITEM.VALUATION_CLASS", "ITEM", "CALCULATION_VERSION.CUSTOMER",
                "CALCULATION_VERSION", "CALCULATION_VERSION"],
            BUSINESS_OBJECT: ["Calculation_Version", "Design_Office", "Document_Status", "Project", "Process",
                "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item",
                "Item", "Calculation_Version", "Item", "Design_Office", "Item", "Item", "Item", "Item", "Process",
                "Calculation_Version", "Calculation_Version"],
            COLUMN_ID: ["REPORT_CURRENCY_ID", "DESIGN_OFFICE_ID", "DOCUMENT_STATUS_ID", "PROJECT_ID",
                "PROCESS_ID", "CREATED_ON", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY", "CREATED_BY", "_CREATED_BY",
                "_CREATED_BY_FIRST_VERSION", "SUBITEM_STATE", "OVERHEAD_PRICE_UNIT_UOM_ID",
                "SURCHARGE", "PRICE_SOURCE_TYPE_ID", "TRANSACTION_CURRENCY_ID", "TOTAL_QUANTITY_DEPENDS_ON",
                "QUANTITY", "QUANTITY_UOM_ID", "QUANTITY_CALCULATED", "QUANTITY_IS_MANUAL", "HAS_SUBITEMS",
                "IS_ROLLED_UP_VALUE", "LOT_SIZE", "LOT_SIZE_CALCULATED", "LOT_SIZE_IS_MANUAL", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                "LAST_MODIFIED_ON", "LAST_MODIFIED_BY"
            ],
        };
        oMockstar.insertTableData("layout_hidden_field", oLayoutHiddenField);
        jasmine.dbConnection.commit();

        // act
        renameColumnIdLayout.run(jasmine.dbConnection);

        // assert
        const oLayoutHiddenFieldAfter = oMockstar.execQuery(`select LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID
                                                             from {{layout_hidden_field}}
                                                        where LAYOUT_ID in (${oLayoutHiddenField.LAYOUT_ID}) order by LAYOUT_ID`);
        expect(oLayoutHiddenFieldAfter).toMatchData(oExpectedLayoutHiddenField, ["LAYOUT_ID", "PATH", "BUSINESS_OBJECT", "COLUMN_ID"]);
    });
}).addTags(["All_Unit_Tests"]);
