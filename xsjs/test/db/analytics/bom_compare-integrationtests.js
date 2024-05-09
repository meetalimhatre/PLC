const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../testtools/mockstar_helpers");

var sTestUser = $.session.getUsername();
var sessionApplicationUser = '';
var iCalculationVersionId = 2809;
var iSecondVersionId = 4809;
var sExpectedDate = new Date().toJSON();
var sSecondUser = "SecondTestUser";
var iCalculationId = 1978;
var iSecondCalculationId = 2078;
var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON();
var oTomorrow = new Date();
var sMasterdataTimestampDate = oTomorrow.toJSON();

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.analytics.bom_compare_integrationtests', function () {
        var oMockstarPlc = null;

        beforeOnce(function () {
            oMockstarPlc = new MockstarFacade({
                substituteTables: {
                    item: {
                        name: "sap.plc.db::basis.t_item",
                        data: {
                            "ITEM_ID": [5, 6, 2, 1, 3, 4, 7, 8, 5, 4, 3, 2, 1,7,1],
                            "CALCULATION_VERSION_ID": [1000, 1000, 1000, 1000, 1000, 1000, 2000, 2000, 3000, 3000, 3000, 3000, 3000,1000,2000],
                            "PARENT_ITEM_ID": [2, 5, 1, null, 7, 6, null, 7, 4, 3, 2, 1, null,4,7],
                            "PREDECESSOR_ITEM_ID": [null, null, null, null, 2, 3, null, null, null, null, null, null, null,3,null],
                            "IS_ACTIVE": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,1,1],
                            "ITEM_CATEGORY_ID": [2, 8, 6, 0, 2, 2, 0, 2, 1, 3, 4, 5, 0,2,3],
                            "ACCOUNT_ID": ["#AC12", "#AC12", "#AC12", null, "#AC11", "#AC11", null, "#AC13", null, "#AC11", "#AC11", null, "#AC13", "#AC13", "#AC13"],
                            "DETERMINED_ACCOUNT_ID": ["0", "0", "625000", "0", "0", "#AC12", , "0", "#AC12", "0", "0", "#AC12", , "0", "#AC12", "#AC12", "#AC13"],
                            "DOCUMENT_TYPE_ID": [null, "#DR", null, null, "#DR", "#DR", null, "#DR", "#DR", "#DR", "#DR", null, "#DR", "#DR", "#DR"],
                            "DOCUMENT_ID": [null, "#DOC-100-200", null, null, "#DOC-100-200", "#DOC-100-200", null, "#DOC-100-200", "#DOC-100-200", "#DOC-100-200", "#DOC-100-200", null, "#DOC-100-200", "#DOC-100-200", "#DOC-100-200"],
                            "DOCUMENT_VERSION": [null, "#1", null, null, "#1", "#1", null, "#1", null, "#1", "#1", null, "#1", "#1", "#1"],
                            "DOCUMENT_PART": [null, "#01", null, null, "#01", "#01", null, "#01", null, "#01", "#01", null, "#01", "#01", "#01"],
                            "DOCUMENT_STATUS_ID": [null, "#R", null, null, "#R", "#R", null, "#R", null, "#R", "#R", null, "#R", "#R", "#R"],
                            "DESIGN_OFFICE_ID": [null, "#L2", null, null, "#L2", "#L2", null, "#L2", null, "#L2", "#L2", null, "#L2", "#L2", "#L2"],
                            "MATERIAL_ID": ["#100-223", "#100-200", "#100-300", "", "#100-210", "#100-110", "", "#100-110", "", "", "", "", "", "",""],
                            "MATERIAL_TYPE_ID": ["#SEM", "#SEM", "#SEM", null, "#RAW", "#RAW", null, "#RAW", "", "", "", "", "", "", ""],
                            "MATERIAL_GROUP_ID": ["#MECH", "#MECH", "#MECH", null, "#MECH", "#MECH", null, "#MECH", "", "", "", "", "", "", ""],
                            "IS_PHANTOM_MATERIAL": [0, 0, 0, 0, 0, 0, 0, 0, null, null, null, null, null, null,null],
                            "IS_CONFIGURABLE_MATERIAL": [0, 0, 0, 0, 0, 0, 0, 0, null, null, null, null, null, null,null],
                            "MATERIAL_SOURCE": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "OVERHEAD_GROUP_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "VALUATION_CLASS_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "PURCHASING_GROUP": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "ACTIVITY_TYPE_ID": [null, null, null, null, null, null, null, null, null, "#AT1", null, null, null, null,"AT14"],
                            "PROCESS_ID": [null, null, null, null, null, null, null, null, null, null, null, "#BP1", null, null,null],
                            "LOT_SIZE": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "LOT_SIZE_IS_MANUAL": [1, 1, 1, null, 1, 1, null, 1, 1, 1, 1, 1, 1, null,null],
                            "ENGINEERING_CHANGE_NUMBER_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "COMPANY_CODE_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "COST_CENTER_ID": [null, null, null, null, null, null, null, null, null, "#CC1", null, null, null, null,null],
                            "PLANT_ID": ["#PT1", "#PT1", "#PT1", null, null, null, null, null, null, null, "#PT1", null, null, "#PT7", "#PT2"],
                            "WORK_CENTER_ID": [null, null, null, null, null, null, null, null, null, null, null, "#WCEN111", null, null, null],
                            "BUSINESS_AREA_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "PROFIT_CENTER_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "PURCHASING_DOCUMENT": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "LOCAL_CONTENT": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "QUANTITY": [1.0000000, 1.0000000, 43.0000000, null, 43.0000000, 5.0000000, null, null, 5.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000],
                            "QUANTITY_CALCULATED": [2.0000000, 2.0000000, 2.0000000, null, 2.0000000, 2.0000000, null, 2.0000000, 2.0000000, 2.0000000, 2.0000000, 2.0000000, 2.0000000, 2.0000000, 1.0000000],
                            "QUANTITY_IS_MANUAL": [1, 1, 1, null, 1, 1, null, 1, 1, 1, 1, 1, 1, 1,1],
                            "QUANTITY_UOM_ID": ["PC", "PC", "PC", null, "PC", "PC", null, "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC"],
                            "TOTAL_QUANTITY": [43.0000000, 43.0000000, 43.0000000, 1.0000000, 43.0000000, 5.0000000, 1.0000000, 5.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000],
                            "TOTAL_QUANTITY_UOM_ID": ["PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC"],
                            "TOTAL_QUANTITY_DEPENDS_ON": [1, 1, 1, null, 1, 1, null, 1, null, 1, 1, null, 1, 1,1],
                            "TOTAL_QUANTITY_OF_VARIANTS": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "IS_RELEVANT_TO_COSTING_IN_ERP": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0],
                            "BASE_QUANTITY": [1.0000000, 1.0000000, 1.0000000, null, 1.0000000, 1.0000000, null, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000],
                            "BASE_QUANTITY_CALCULATED": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "BASE_QUANTITY_IS_MANUAL": [1, 1, 1, null, 1, 1, null, 1, null, 1, 1, null, 1, 1,1],
                            "QUANTITY_PER_BASE_UNIT": [1.0000000, 1.0000000, 43.0000000, null, 43.0000000, 5.0000000, null, 5.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000],
                            "QUANTITY_PER_BASE_UNIT_UOM_ID": ["PC", "PC", "PC", null, "PC", "PC", null, "PC", null, "PC", "PC", null, "PC", "PC", "PC"],
                            "PRICE_FIXED_PORTION": [null, 0.0000000, null, null, 43.0000000, 4.0000000, null, 4.0000000, null, null, null, null, 4.0000000, 4.0000000, 4.0000000],
                            "PRICE_FIXED_PORTION_CALCULATED": [0.0000000, null, 0.0000000, 1869.0000000, null, null, 1869.0000000, null, null, null, null, null, 4.0000000, 4.0000000, 4.0000000],
                            "PRICE_FIXED_PORTION_IS_MANUAL": [1, 1, 0, null, 1, 1, null, null, null, null, null, null,null],
                            "PRICE_VARIABLE_PORTION": [null, 0.0000000, null, null, 0.0000000, 0.0000000, null, 0.0000000, null, null, null, null, 0.0000000, 0.0000000, 0.0000000],
                            "PRICE_VARIABLE_PORTION_CALCULATED": [0.0000000, null, 0.0000000, 0.0000000, null, null, 0.0000000, null, null, null, null, null, 0.0000000, 0.0000000, 0.0000000],
                            "PRICE_VARIABLE_PORTION_IS_MANUAL": [1, 1, 0, null, 1, 1, null, 1, null, null, null, null, 1, 1,1],
                            "PRICE": [null, null, null, null, null, null, , null, null, null, null, null, null, null, null,null],
                            "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR"],
                            "PRICE_UNIT": [1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000],
                            "PRICE_UNIT_CALCULATED": [1.0000000, null, 1.0000000, 1.0000000, null, null, 1.0000000, null, 1.0000000, null, null, 1.0000000, 1.0000000, 1.0000000, 1.0000000],
                            "PRICE_UNIT_IS_MANUAL": [1, 1, 0, null, 1, 1, null, 1, null, 1, 1, null, 1, 1,1],
                            "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC", "PC","PC"],
                            "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0],
                            "IS_DISABLING_ACCOUNT_DETERMINATION": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0],
                            "PRICE_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "CONFIDENCE_LEVEL_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "PRICE_SOURCE_ID": ["PLC_CALCULATED_PRICE", "PLC_MANUAL_PRICE", "PLC_CALCULATED_PRICE", "PLC_CALCULATED_PRICE", "PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE", "PLC_CALCULATED_PRICE", "PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE", "PLC_MANUAL_PRICE"],
                            "PRICE_SOURCE_TYPE_ID": [4, 3, 4, 4, 3, 3, 4, 3, 3, 3, 3, 3, 3, 3,3],
                            "IS_DISABLING_PRICE_DETERMINATION": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "VENDOR_ID": ["", null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "TARGET_COST": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "TARGET_COST_CALCULATED": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "TARGET_COST_IS_MANUAL": [1, 1, 1, null, 1, 1, null, 1, null, null, null, null, null, null, null],
                            "TARGET_COST_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR"],
                            "PRICE_FOR_TOTAL_QUANTITY": [0.0000000, 0.0000000, 0.0000000, 2149.3500000, 1849.0000000, 20.0000000, 2149.3500000, 20.0000000, 2149.3500000, 1849.0000000, 20.0000000, 2149.3500000, 20.0000000, 20.0000000, 20.0000000],
                            "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": [0.0000000, 0.0000000, 0.0000000, 2149.3500000, 1849.0000000, 20.0000000, 2149.3500000, 20.0000000, 2149.3500000, 1849.0000000, 20.0000000, 2149.3500000, 20.0000000, 20.0000000, 20.0000000],
                            "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": [0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000],
                            "OTHER_COST": [0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000],
                            "OTHER_COST_FIXED_PORTION": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "OTHER_COST_VARIABLE_PORTION": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "OVERHEAD_GROUP_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null,null],
                            "TOTAL_COST": [0.0000000, 0.0000000, 0.0000000, 2149.3500000, 2126.3500000, 23.0000000, 2149.3500000, 23.0000000, 2149.3500000, 1849.0000000, 20.0000000, 2149.3500000, 20.0000000, 20.0000000, 20.0000000],
                            "TOTAL_COST_FIXED_PORTION": [0.0000000, 0.0000000, 0.0000000, 2149.3500000, 2126.3500000, 23.0000000, 2149.3500000, 23.0000000, 2149.3500000, 1849.0000000, 20.0000000, 2149.3500000, 20.0000000, 20.0000000, 20.0000000],
                            "TOTAL_COST_VARIABLE_PORTION": [0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000],
                            "TOTAL_COST_PER_UNIT_FIXED_PORTION": [0.0000000, 0.0000000, 0.0000000, 2149.3500000, 49.4500000, 4.6000000, 2149.3500000, 3.6000000, 2149.3500000, 1849.0000000, 20.0000000, 2149.3500000, 20.0000000, 20.0000000, 20.0000000],
                            "TOTAL_COST_PER_UNIT_VARIABLE_PORTION": [0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000],
                            "TOTAL_COST_PER_UNIT": [0.0000000, 0.0000000, 0.0000000, 2149.3500000, 49.4500000, 4.6000000, 2149.3500000, 4.6000000, 2149.3500000, 1849.0000000, 20.0000000, 2149.3500000, 20.0000000, 20.0000000, 20.0000000],
                            "CREATED_ON": [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, "2021-02-16 08:53:04.587000000", sExpectedDate, "2021-02-16 08:53:04.587000000", sExpectedDate, "2021-02-16 08:53:04.587000000", sExpectedDate, "2021-02-16 08:53:04.587000000", sExpectedDate, sExpectedDate,sExpectedDate],
                            "CREATED_BY": [`${sTestUser}`, sSecondUser, sSecondUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser,sTestUser],
                            "LAST_MODIFIED_ON": [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, "2021-02-16 08:53:04.587000000", sExpectedDate, "2021-02-16 08:53:04.587000000", sExpectedDate, sExpectedDate, "2021-02-16 08:53:04.587000000", sExpectedDate, "2021-02-16 08:53:04.587000000", "2021-02-16 08:53:04.587000000", "2021-02-16 08:53:04.587000000"],
                            "LAST_MODIFIED_BY": [sTestUser, sSecondUser, sSecondUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser],
                            "ITEM_DESCRIPTION": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "COMMENT": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "REFERENCED_CALCULATION_VERSION_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "SURCHARGE": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "CHILD_ITEM_CATEGORY_ID": [2, 8, 6, 0, 2, 2, 0, 2, 1, 3, 4, 5, 0,30,31]
                        }
                    },
                    itemCategoryText: {
                        name: "sap.plc.db::basis.t_item_category__text",
                        data: {
                            "ITEM_CATEGORY_ID": [0, 1, 2, 3, 4, 5, 6, 8,10, 0, 1, 2, 3, 4, 5, 6, 8,10],
                            "LANGUAGE": ['EN', 'EN', 'EN', 'EN', 'EN', 'EN', 'EN', 'EN', 'EN','DE','DE','DE','DE','DE','DE','DE','DE','DE'],
                            "ITEM_CATEGORY_DESCRIPTION": ["Calculation version", "Document", "Material", "Internal Activity", "External Activity", "Process", "Subcontracting", "Variable Item","Referenced Version",'Kalkulationsversion','Dokument','Material','Eigenleistung','Fremdleistung','Prozess','Lohnbearbeitung','Variable Position','Textposition','Referenzierte Version'],
                            "CHILD_ITEM_CATEGORY_ID": [0, 1, 2, 3, 4, 5, 6, 8,10, 0, 1, 2, 3, 4, 5, 6, 8,10],
                            "ITEM_CATEGORY_NAME": ["Calculation version", "Document", "Material", "Internal Activity", "External Activity", "Process", "Subcontracting", "Variable Item","Referenced Version",'Kalkulationsversion','Dokument','Material','Eigenleistung','Fremdleistung','Prozess','Lohnbearbeitung','Variable Position','Textposition','Referenzierte Version']
                        }
                    },
                    itemCategory: {
                        name: "sap.plc.db::basis.t_item_category",
                        data: {
                            "ITEM_CATEGORY_ID": [2,3],
                            "DISPLAY_ORDER": [30,31],
                            "CHILD_ITEM_CATEGORY_ID": [30,31],
                            "ICON": ["\\ue199","\\ue120"],
                            "ITEM_CATEGORY_CODE": ["TEST CODE","TEST CODE2"]
                        }
                    },
                    language: {
                        name: "sap.plc.db::basis.t_language",
                        data: {
                            "LANGUAGE": ['DE','EN','FR'],
                            "TEXTS_MAINTAINABLE": [1,1,1],
                            "_VALID_FROM": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
                            "_VALID_TO":[null,null,null],
                            "_SOURCE":[1,1,1],
                            "_CREATED_BY":['U000001','U000001','U000001'],
                            "MAPPING_LANGUAGE_ID":['D','E','F']
                        }
                    },
                    authProject: {
                        name: "sap.plc.db::auth.t_auth_project",
                    },
                    calculation: {
                        name: "sap.plc.db::basis.t_calculation",
                        data: {
                            "CALCULATION_ID": [iCalculationId, iSecondCalculationId, 5078, 1000, 2000, 3000],
                            "PROJECT_ID": ["PR1", "PR1", "PR3", "TEST", "TEST1", "TEST2"],
                            "CALCULATION_NAME": ["Kalkulation Pumpe P-100", "Calculation Pump P-100", "Kalkulation Schluesselfinder", "Calculation Pump P-500", "Calculation Pump P-600", "Calculation Pump P-700"],
                            "CURRENT_CALCULATION_VERSION_ID": [2809, iSecondVersionId, 5809, 1000, 2000, 3000],
                            "CREATED_ON": [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
                            "CREATED_BY": [sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser],
                            "LAST_MODIFIED_ON": [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
                            "LAST_MODIFIED_BY": [sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser]
                        }
                    },
                    calculationVersion: {
                        name: "sap.plc.db::basis.t_calculation_version",
                        data: {
                            "CALCULATION_VERSION_ID": [iCalculationVersionId, iSecondVersionId, 5809, 1000, 2000, 3000],
                            "CALCULATION_ID": [iCalculationId, iSecondCalculationId, 5078, 1000, 2000, 3000],
                            "CALCULATION_VERSION_NAME": ["Baseline Version1", "Baseline Version2", "Baseline Version3", "Version 1", "Version 2", "Version 3"],
                            "STATUS_ID": ["DRAFT", "DRAFT", "DRAFT", "DRAFT", "DRAFT", "DRAFT"],
                            "CALCULATION_VERSION_TYPE": [1, 1, 1, 1, 1, 1],
                            "ROOT_ITEM_ID": [3001, 5001, 7001, 1, 1, 1],
                            "CUSTOMER_ID": ["", "", "", null, null, null],
                            "SALES_PRICE": [20.0000000, 10.0000000, 10.0000000, null, null, null],
                            "SALES_PRICE_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR", "EUR"],
                            "REPORT_CURRENCY_ID": ["EUR", "USD", "EUR", "EUR", "EUR", "EUR"],
                            "COSTING_SHEET_ID": ["COGM", "COGM", "COGM", "#COGM", "#COGM", "#COGM"],
                            "COMPONENT_SPLIT_ID": ["1", "1", "1", null, null, null],
                            "SALES_DOCUMENT": ["DOC", "DOC", "DOC", null, null, null],
                            "START_OF_PRODUCTION": [sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, null, null, null],
                            "END_OF_PRODUCTION": [sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, null, null, null],
                            "VALUATION_DATE": [sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime],
                            "LAST_MODIFIED_ON": [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
                            "LAST_MODIFIED_BY": [sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser],
                            "MASTER_DATA_TIMESTAMP": [sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate],
                            "IS_FROZEN": [0, 0, 0, null, null, null],
                            "MATERIAL_PRICE_STRATEGY_ID": ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
                            "ACTIVITY_PRICE_STRATEGY_ID": ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
                            "LIFECYCLE_PERIOD_FROM": [null, null, null, null, null, null]
                        }
                    },
                    itemCalculatedValuesCostingSheet: {
                        name: "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
                        data: {
                            "ITEM_ID": [3001, 3002, 3003, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4],
                            "CALCULATION_VERSION_ID": [iCalculationVersionId, iSecondCalculationId, iSecondCalculationId, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
                            "COSTING_SHEET_ROW_ID": ["CSR_1", "CSR_1", "CSR_1", "DMC", "MOC", "MC", "COGM", "DMC", "MOC", "MC", "MC", "COGM", "COGM", "DMC", "MOC", "MC", "MC", "COGM", "COGM"],
                            "COSTING_SHEET_OVERHEAD_ROW_ID": [-1, -1, -1, -1, -1, -1, -1, -1, 56, -1, -1, -1, -1, -1, 56, -1, -1, -1, -1],
                            "ACCOUNT_ID": ["40", "40", "40", "", "", "", "", "#AC11", "#AC31", "#AC11", "#AC31", "#AC11", "#AC31", "#AC11", "#AC31", "#AC11", "#AC31", "#AC11", "#AC31"],
                            "IS_ROLLED_UP_VALUE": [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            "HAS_SUBITEMS": [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            "COST": [5, 5, 5, 1869.0000000, 280.3500000, 2149.3500000, 2149.3500000, 1849.0000000, 277.3500000, 1849.0000000, 277.3500000, 1849.0000000, 277.3500000, 20.0000000, 3.0000000, 20.0000000, 3.0000000, 20.0000000, 3.0000000],
                            "COST_FIXED_PORTION": [2.0000000, 2.0000000, 2.0000000, 1869.0000000, 280.3500000, 2149.3500000, 2149.3500000, 1849.0000000, 277.3500000, 1849.0000000, 277.3500000, 1849.0000000, 277.3500000, 20.0000000, 3.0000000, 20.0000000, 3.0000000, 20.0000000, 3.0000000],
                            "COST_VARIABLE_PORTION": [0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000, 0.0000000]
                        }
                    },
                    costingSheetRow: {
                        name: "sap.plc.db::basis.t_costing_sheet_row",
                        data: {
                            "COSTING_SHEET_ROW_ID": ["CSR_1", "MGK", "CSR_1", "FGK", "HK", "HH", "MOC", "MOC", "MOC", "MC", "MC", "DMC", "DMC", "DMC", "COGM", "COGM", "COGM"],
                            "COSTING_SHEET_ID": ["COGM", "COGM", "COGM", "COGM", "COGM", "COGM", "#COGSL", "#COGM", "#IC_COGM", "#COGM", "#IC_COGM", "#COGSL", "#COGM", "#IC_COGM", "#COGSL", "#COGM", "#IC_COGM"],
                            "COSTING_SHEET_ROW_TYPE": [1, 3, 1, 3, 4, 2, 3, 3, 3, 4, 4, 1, 1, 1, 4, 4, 4],
                            "COSTING_SHEET_BASE_ID": [, , , , , 1, null, null, null, null, null, null, null, null, null, null, null],
                            "ACCOUNT_GROUP_AS_BASE_ID": [13, 14, 15, 15, 13, 15, null, null, null, null, null, 110, 110, 110, null, null, null],
                            "COSTING_SHEET_OVERHEAD_ID": [, 4, , 5, 6, 7, 11, 24, 30, null, null, null, null, null, null, null, null],
                            "CALCULATION_ORDER": [0, 1, 2, 3, 4, 5, 2, 2, 2, 3, 3, 1, 1, 1, 5, 7, 9],
                            "IS_RELEVANT_FOR_TOTAL": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                            "IS_RELEVANT_FOR_TOTAL2": [1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1],
                            "IS_RELEVANT_FOR_TOTAL3": [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            "_VALID_FROM": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000'],
                            "_VALID_TO": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                            "_SOURCE": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                            "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser]
                        }
                    },
                    project: {
                        name: "sap.plc.db::basis.t_project",
                        data: {
                            "PROJECT_ID": ["TEST", "TEST1", "TEST2"],
                            "ENTITY_ID": [100, 101, 102],
                            "REFERENCE_PROJECT_ID": [null, null, null],
                            "PROJECT_NAME": ["test", "test1", "test2"],
                            "PROJECT_RESPONSIBLE": [null, null, null],
                            "CONTROLLING_AREA_ID": ["#CA1", "#CA2", "#CA3"],
                            "CUSTOMER_ID": [null, null, null],
                            "SALES_DOCUMENT": [null, null, null],
                            "SALES_PRICE": [null, null, null],
                            "SALES_PRICE_CURRENCY_ID": [null, null, null],
                            "COMMENT": [null, null, null],
                            "COMPANY_CODE_ID": [null, null, null],
                            "PLANT_ID": [null, null, null],
                            "BUSINESS_AREA_ID": [null, null, null],
                            "PROFIT_CENTER_ID": [null, null, null],
                            "REPORT_CURRENCY_ID": ["EUR", "EUR", "EUR"],
                            "COSTING_SHEET_ID": [null, null, null],
                            "COMPONENT_SPLIT_ID": [null, null, null],
                            "START_OF_PROJECT": [null, null, null],
                            "END_OF_PROJECT": [null, null, null],
                            "START_OF_PRODUCTION": [null, null, null],
                            "END_OF_PRODUCTION": [null, null, null],
                            "VALUATION_DATE": [null, null, null],
                            "LIFECYCLE_VALUATION_DATE": [null, null, null],
                            "LIFECYCLE_PERIOD_INTERVAL": [12, 12, 12],
                            "CREATED_ON": [sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime],
                            "CREATED_BY": [sTestUser, sTestUser, sTestUser],
                            "LAST_MODIFIED_ON": [sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime],
                            "LAST_MODIFIED_BY": [sTestUser, sTestUser, sTestUser],
                            "EXCHANGE_RATE_TYPE_ID": [null, null, null],
                            "MATERIAL_PRICE_STRATEGY_ID": ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
                            "ACTIVITY_PRICE_STRATEGY_ID": ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"]
                        }
                    }
                }
            });
        });

        beforeEach(function () {
            setSessionApplicationUser(oMockstarPlc);
            oMockstarPlc.clearAllTables();
            oMockstarPlc.insertTableData("authProject", {
                "PROJECT_ID": ["PR1", "PR1", "PR3", "TEST", "TEST1", "TEST2"],
                "USER_ID": [sessionApplicationUser, sessionApplicationUser, sessionApplicationUser, sessionApplicationUser, sessionApplicationUser, sessionApplicationUser],
                "PRIVILEGE": ["ADMINISTRATE", "ADMINISTRATE", "ADMINISTRATE", "ADMINISTRATE", "ADMINISTRATE", "ADMINISTRATE"]
            });
            oMockstarPlc.initializeData();
        });

        it('compare the result for two similar calculation version', function () {
            //arrange
            let table = oMockstarPlc.execQuery(`SELECT * FROM "sap.plc.db::basis.t_item_category__text"`);
            let result = oMockstarPlc.execQuery(`SELECT * FROM "sap.plc.analytics.viewsCF.base::TABLE_FUNCTION_v_bom_compare"(1000,1000,'EN')`);
            result = mockstarHelpers.convertResultToArray(result);

            //assert
            expect(result).toMatchData({
                "CALCULATION_VERSION_ID": [1000, 1000, 1000, 1000, 1000, 1000, 1000],
                "CALCULATION_VERSION_ID_BOMC2": [1000, 1000, 1000, 1000, 1000, 1000, 1000],
                "NODE_ID": ['1000-1', '1000-2', '1000-5', '1000-6', '1000-4', '1000-7', '1000-3'],
                "NODE_ID_BOMC2": ['1000-1', '1000-2', '1000-5', '1000-6', '1000-4', '1000-7', '1000-3'],
                "PARENT_ID": [null, '1000-1', '1000-2', '1000-5', '1000-6', '1000-4', '1000-7'],
                "PARENT_ID_BOMC2": [null, '1000-1', '1000-2', '1000-5', '1000-6', '1000-4', '1000-7'],
                "PARENT_ITEM_ID": [null, 1, 2, 5, 6, 4, 7],
                "PARENT_ITEM_ID_BOMC2": [null, 1, 2, 5, 6, 4, 7],
                "ITEM_ID": [1, 2, 5, 6, 4, 7, 3],
                "ITEM_ID_BOMC2": [1, 2, 5, 6, 4, 7, 3],
                "ITEM_KEY": ['Calculation version', 'Subcontracting#PT1#100-300', 'Material#PT1#100-223', 'Variable Item#PT1#100-200', 'Material#100-110', 'TEST CODE#PT7', 'Material#100-210'],
                "PRICE_FOR_TOTAL_QUANTITY": ['2149.3500000', '0.0000000', '0.0000000', '0.0000000', '20.0000000', '20.0000000', '1849.0000000'],
                "PRICE_FOR_TOTAL_QUANTITY_BOMC2": ['2149.3500000', '0.0000000', '0.0000000', '0.0000000', '20.0000000', '20.0000000', '1849.0000000'],
                "PRICE": ['1869.0000000', '0.0000000', '0.0000000', null, null, '4.0000000', '43.0000000'],
                "PRICE_BOMC2": ['1869.0000000', '0.0000000', '0.0000000', null, null, '4.0000000', '43.0000000'],
                "IS_LEAF": [0, 0, 0, 0, 0, 0, 1],
                "IS_LEAF_BOMC2": [0, 0, 0, 0, 0, 0, 1]
            },
                ["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID_BOMC2", "NODE_ID", "NODE_ID_BOMC2", "PARENT_ID", "PARENT_ID_BOMC2",
                    "PARENT_ITEM_ID", "PARENT_ITEM_ID_BOMC2", "ITEM_ID", "ITEM_ID_BOMC2", "ITEM_KEY", "PRICE_FOR_TOTAL_QUANTITY",
                    "PRICE_FOR_TOTAL_QUANTITY_BOMC2", "PRICE", "PRICE_BOMC2", "IS_LEAF", "IS_LEAF_BOMC2"]);
        });

        it("should compare two diference calculation version 2000 - 1000", function () {
            //arrange
            let result = oMockstarPlc.execQuery(`SELECT * FROM "sap.plc.analytics.viewsCF.base::TABLE_FUNCTION_v_bom_compare"(2000,1000)`);
            result = mockstarHelpers.convertResultToArray(result);

            //assert
            expect(result).toMatchData({
                "CALCULATION_VERSION_ID": [2000, 2000, 2000, null, null, null, null, null, null, null],
                "CALCULATION_VERSION_ID_BOMC2": [null, null, null, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
                "NODE_ID": ['2000-7', '2000-8', '2000-1', null, null, null, null, null, null, null],
                "NODE_ID_BOMC2": [null, null, null, '1000-1', '1000-2', '1000-5', '1000-6', '1000-4', '1000-7', '1000-3'],
                "PARENT_ID": [null, '2000-7', '2000-7', null, null, null, null, null, null, null],
                "PARENT_ID_BOMC2": [null, null, null, null, '1000-1', '1000-2', '1000-5', '1000-6', '1000-4', '1000-7'],
                "PARENT_ITEM_ID": [null, 7, 7, null, null, null, null, null, null, null],
                "PARENT_ITEM_ID_BOMC2": [null, null, null, null, 1, 2, 5, 6, 4, 7],
                "ITEM_ID": [7, 8, 1, null, null, null, null, null, null, null],
                "ITEM_ID_BOMC2": [null, null, null, 1, 2, 5, 6, 4, 7, 3],
                "PRICE_FOR_TOTAL_QUANTITY": ['2149.3500000', '20.0000000', '20.0000000', null, null, null, null, null, null, null],
                "PRICE_FOR_TOTAL_QUANTITY_BOMC2": [null, null, null, '2149.3500000', '0.0000000', '0.0000000', '0.0000000', '20.0000000', '20.0000000', '1849.0000000'],
                "ITEM_KEY": ['Calculation version', 'Material#100-110', 'Test DescriptionAT14', 'Calculation version', 'Subcontracting#PT1#100-300', 'Material#PT1#100-223', 'Variable Item#PT1#100-200', 'Material#100-110', 'TEST CODE#PT7', 'Material#100-210'],
                "PRICE": ['1869.0000000', '4.0000000', '4.0000000', null, null, null, null, null, null, null],
                "PRICE_BOMC2": [null, null, null, '1869.0000000', '0.0000000', '0.0000000', null, null, '4.0000000', '43.0000000'],
                "IS_LEAF": [0, 1, 1, null, null, null, null, null, null, null],
                "IS_LEAF_BOMC2": [null, null, null, 0, 0, 0, 0, 0, 0, 1]
            },
                ["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID_BOMC2", "NODE_ID", "NODE_ID_BOMC2", "PARENT_ID", "PARENT_ID_BOMC2",
                    "PARENT_ITEM_ID", "PARENT_ITEM_ID_BOMC2", "ITEM_ID", "ITEM_ID_BOMC2", "PRICE_FOR_TOTAL_QUANTITY",
                    "PRICE_FOR_TOTAL_QUANTITY_BOMC2", "ITEM_KEY", "PRICE", "PRICE_BOMC2", "IS_LEAF", "IS_LEAF_BOMC2"]);
        });

        it("should compare two diference calculation version 1000 - 3000", function () {
            //arrange
            let result = oMockstarPlc.execQuery(`SELECT * FROM "sap.plc.analytics.viewsCF.base::TABLE_FUNCTION_v_bom_compare"(3000,1000,'DE')`);
            result = mockstarHelpers.convertResultToArray(result);

            //assert
            expect(result).toMatchData({
                "CALCULATION_VERSION_ID": [3000, 3000, 3000, 3000, 3000, null, null, null, null, null, null, null],
                "CALCULATION_VERSION_ID_BOMC2": [null, null, null, null, null, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
                "NODE_ID": ['3000-1', '3000-2', '3000-3', '3000-4', '3000-5', null, null, null, null, null, null, null],
                "NODE_ID_BOMC2": [null, null, null, null, null, '1000-1', '1000-2', '1000-5', '1000-6', '1000-4', '1000-7', '1000-3'],
                "PARENT_ID": [null, '3000-1', '3000-2', '3000-3', '3000-4', null, null, null, null, null, null, null],
                "PARENT_ID_BOMC2": [null, null, null, null, null, null, '1000-1', '1000-2', '1000-5', '1000-6', '1000-4', '1000-7'],
                "PARENT_ITEM_ID": [null, 1, 2, 3, 4, null, null, null, null, null, null, null],
                "PARENT_ITEM_ID_BOMC2":[null, null, null, null, null, null, 1, 2, 5, 6, 4, 7],
                "ITEM_ID": [1, 2, 3, 4, 5, null, null, null, null, null, null, null],
                "ITEM_ID_BOMC2": [null, null, null, null, null, 1, 2, 5, 6, 4, 7, 3],
                "PRICE_FOR_TOTAL_QUANTITY": ['20.0000000', '2149.3500000', '20.0000000', '1849.0000000', '2149.3500000', null, null, null, null, null, null, null],
                "PRICE_FOR_TOTAL_QUANTITY_BOMC2": [null, null, null, null, null, '2149.3500000', '0.0000000', '0.0000000', '0.0000000', '20.0000000', '20.0000000', '1849.0000000'],
                "ITEM_KEY": ['Kalkulationsversion', 'Prozess#BP1#WCEN111', 'Fremdleistung#PT1', 'Eigenleistung#CC1#AT1', 'Dokument#DR#DOC-100-200', 'Kalkulationsversion', 'Lohnbearbeitung#PT1#100-300', 'Material#PT1#100-223', 'Variable Position#PT1#100-200', 'Material#100-110', 'TEST CODE#PT7', 'Material#100-210'],
                "PRICE": ['4.0000000', null, null, null, null, null, null, null, null, null, null, null],
                "PRICE_BOMC2": [null, null, null, null, null, '1869.0000000', '0.0000000', '0.0000000', null, null, '4.0000000', '43.0000000'],
                "IS_LEAF": [0, 0, 0, 0, 1, null, null, null, null, null, null, null],
                "IS_LEAF_BOMC2": [null, null, null, null, null, 0, 0, 0, 0, 0, 0, 1]
            },
                ["CALCULATION_VERSION_ID", "CALCULATION_VERSION_ID_BOMC2", "NODE_ID", "NODE_ID_BOMC2", "PARENT_ID", "PARENT_ID_BOMC2",
                    "PARENT_ITEM_ID", "PARENT_ITEM_ID_BOMC2", "ITEM_ID", "ITEM_ID_BOMC2", "PRICE_FOR_TOTAL_QUANTITY",
                    "PRICE_FOR_TOTAL_QUANTITY_BOMC2", "ITEM_KEY", "PRICE", "PRICE_BOMC2", "IS_LEAF", "IS_LEAF_BOMC2"]);
        });

    }).addTags(["All_Unit_Tests"]);
}

function setSessionApplicationUser(oMockstarPlc) {
    let session = oMockstarPlc.execQuery("select session_context('XS_APPLICATIONUSER') AS USER from dummy;");
    session = mockstarHelpers.convertResultToArray(session);
    sessionApplicationUser = session.USER[0];
}
