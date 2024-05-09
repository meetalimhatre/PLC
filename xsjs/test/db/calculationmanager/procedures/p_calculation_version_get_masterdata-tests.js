const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const testData = require("../../../testdata/testdata").data;
const InstancePrivileges = require("../../../../lib/xs/authorization/authorization-manager").Privileges;
const _ = require("lodash");
const mockstarHelpers = require("../../../testtools/mockstar_helpers");

if (jasmine.plcTestRunParameters.mode === "all") {
    describe("db.calculationmanager.procedures:p_calculation_version_get_masterdata", () => {
        let oMockstarPlc = null;
        const testPackage = $.session.getUsername().toLowerCase();
        const sTestUser = $.session.getUsername();
        const iCalculationVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
        const sLanguage = "EN";
        const sCalculationVersionDate = new Date().toJSON();
        const sUser = testData.sTestUser;
        const oItemExtData = {
            ITEM_ID: [3001, 3002, 3003],
            CALCULATION_VERSION_ID: [iCalculationVersionId, iCalculationVersionId, iCalculationVersionId],
            CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT: ["BRL", "RUB", "JPY"],
            CMPR_DECIMAL_WITH_UOM_UNIT: ["EA", "CM", "M"],
        };

        const oCalculationVersionTestData = Object.assign({}, testData.oCalculationVersionTestData, { VALUATION_DATE: [sCalculationVersionDate,sCalculationVersionDate,sCalculationVersionDate] });
        
        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_get_masterdata", //  procedure or view under test
                substituteTables: {
                    authorization: "sap.plc.db::auth.t_auth_project",
                    calculation: {
                        name: "sap.plc.db::basis.t_calculation",
                        data: testData.oCalculationTestData,
                    },
                    project: {
                        name: "sap.plc.db::basis.t_project",
                        data: testData.oProjectTestData,
                    },
                    calculation_version: {
                        name: "sap.plc.db::basis.t_calculation_version",
                        data: oCalculationVersionTestData,
                    },
                    item: {
                        name: "sap.plc.db::basis.t_item",
                        data: testData.oItemTestDataWithMasterdata,
                    },
                    document: {
                        name: "sap.plc.db::basis.t_document",
                        data: testData.oDocumentTestDataPlc,
                    },
                    document_type: {
                        name: "sap.plc.db::basis.t_document_type",
                        data: testData.oDocumentTypeTestDataPlc,
                    },
                    document_status: {
                        name: "sap.plc.db::basis.t_document_status",
                        data: testData.oDocumentStatusTestDataPlc,
                    },
                    component_split: {
                        name: "sap.plc.db::basis.t_component_split",
                        data: testData.oComponentSplitTest,
                    },
                    costing_sheet: {
                        name: "sap.plc.db::basis.t_costing_sheet",
                        data: testData.oCostingSheetTestData,
                    },
                    costing_sheet_row: {
                        name: "sap.plc.db::basis.t_costing_sheet_row",
                        data: testData.oCostingSheetRowTestData,
                    },
                    costing_sheet_base: {
                        name: "sap.plc.db::basis.t_costing_sheet_base",
                        data: testData.oCostingSheetBaseTestData,
                    },
                    costing_sheet_base_row: {
                        name: "sap.plc.db::basis.t_costing_sheet_base_row",
                        data: testData.oCostingSheetBaseRowTestData,
                    },
                    costing_sheet_overhead: {
                        name: "sap.plc.db::basis.t_costing_sheet_overhead",
                        data: testData.oCostingSheetOverheadTestData,
                    },
                    costing_sheet_overhead_row: {
                        name: "sap.plc.db::basis.t_costing_sheet_overhead_row",
                        data: testData.oCostingSheetOverheadRowTestData,
                    },
                    costing_sheet_row_dependencies: {
                        name: "sap.plc.db::basis.t_costing_sheet_row_dependencies",
                        data: testData.oCostingSheetRowDependenciesTestData,
                    },
                    currency: {
                        name: "sap.plc.db::basis.t_currency",
                        data: testData.mCsvFiles.currency,
                    },
                    unit_of_measure: {
                        name: "sap.plc.db::basis.t_uom",
                        data: testData.mCsvFiles.uom,
                    },
                    account_group: {
                        name: "sap.plc.db::basis.t_account_group",
                        data: testData.oAccountGroupTest,
                    },
                    work_center: {
                        name: "sap.plc.db::basis.t_work_center",
                        data: testData.oWorkCenterTestDataPlc,
                    },
                    process: {
                        name: "sap.plc.db::basis.t_process",
                        data: testData.oProcessTestDataPlc1,
                    },
                    overhead_group: {
                        name: "sap.plc.db::basis.t_overhead_group",
                        data: testData.oOverheadGroupTestDataPlc,
                    },
                    plant: {
                        name: "sap.plc.db::basis.t_plant",
                        data: testData.oPlantTestDataPlc,
                    },
                    cost_center: {
                        name: "sap.plc.db::basis.t_cost_center",
                        data: testData.oCostCenterTestDataPlc,
                    },
                    profit_center: {
                        name: "sap.plc.db::basis.t_profit_center",
                        data: testData.oProfitCenterTestDataPlc,
                    },
                    activity_type: {
                        name: "sap.plc.db::basis.t_activity_type",
                        data: testData.oActivityTypeTestDataPlc,
                    },
                    account: {
                        name: "sap.plc.db::basis.t_account",
                        data: testData.oAccountTestDataPlc,
                    },
                    company_code: {
                        name: "sap.plc.db::basis.t_company_code",
                        data: testData.oCompanyCodeTestDataPlc,
                    },
                    controlling_area: {
                        name: "sap.plc.db::basis.t_controlling_area",
                        data: testData.oControllingAreaTestDataPlc,
                    },
                    business_area: {
                        name: "sap.plc.db::basis.t_business_area",
                        data: testData.oBusinessAreaTestDataPlc,
                    },
                    design_office: {
                        name: "sap.plc.db::basis.t_design_office",
                        data: testData.oDesignOfficeTestDataPlc,
                    },
                    material: {
                        name: "sap.plc.db::basis.t_material",
                        data: testData.oMaterialTestDataPlc,
                    },
                    material_group: {
                        name: "sap.plc.db::basis.t_material_group",
                        data: testData.oMaterialGroupTestDataPlc,
                    },
                    material_plant: {
                        name: "sap.plc.db::basis.t_material_plant",
                        data: testData.oMaterialPlantTestDataPlc,
                    },
                    material_type: {
                        name: "sap.plc.db::basis.t_material_type",
                        data: testData.oMaterialTypeTestDataPlc,
                    },
                    valuation_class: {
                        name: "sap.plc.db::basis.t_valuation_class",
                        data: testData.oValuationClassTestDataPlc,
                    },
                    vendor: {
                        name: "sap.plc.db::basis.t_vendor",
                        data: testData.oVendorTestDataPlc,
                    },
                    customer: {
                        name: "sap.plc.db::basis.t_customer",
                        data: testData.oCustomerTestDataPlc,
                    },
                    item_ext: "sap.plc.db::basis.t_item_ext",
                    price_component: {
                        name: "sap.plc.db::basis.t_price_component",
                        data: testData.oPriceComponentTestDataPlc
                    },
                    activity_price: {
                        name: "sap.plc.db::basis.t_activity_price",
                        data: testData.oActivityPriceTestDataPlc
                    }
                },
            });
        });
        beforeEach(() => {
            oMockstarPlc.clearAllTables(); //  clear all specified substitute tables and views
            oMockstarPlc.insertTableData("authorization", {
                PROJECT_ID: [testData.oProjectTestData.PROJECT_ID[0]],
                USER_ID: [sTestUser],
                PRIVILEGE: [InstancePrivileges.READ],
            });
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                oMockstarPlc.insertTableData("item_ext", oItemExtData);
            }
            oMockstarPlc.initializeData();
        });

        afterEach(() => {
            oMockstarPlc.cleanup(`${testPackage}sap.plc.db.calculationmanager.procedures`);
        });

        function getResult(iCalculationVersion) {
            const procedure = oMockstarPlc.loadProcedure();
            const oInputCalculationVersionIds = {
                CALCULATION_VERSION_ID: [iCalculationVersion],
            };
            const result = procedure(sLanguage, mockstarHelpers.transpose(oInputCalculationVersionIds), sUser);
            return result;
        }
        it("should not return masterdata if the given calculation id does not exist", () => {
            //  act
            const result = getResult(99999);
            //  assert
            const oResult = _.clone(result);
            _.each(oResult, (value, key) => {
                expect(Array.from(oResult[key]).length).toBe(0);
            });
        });

        it("should not return masterdata if the user has no privileges for the calculation version", () => {
            //  act
            oMockstarPlc.clearTable("authorization");
            const result = getResult(iCalculationVersionId);
            //  assert
            const oResult = _.clone(result);
            _.each(oResult, (value, key) => {
                expect(Array.from(oResult[key]).length).toBe(0);
            });
        });


        it("should return masterdata for a valid calculation version id", () => {
            // act
            const result = getResult(iCalculationVersionId);
            //  assert
            const oResult = _.omit(_.clone(result), "OT_ACCOUNT_GROUPS", "OT_COMPONENT_SPLIT_ACCOUNT_GROUP", "OT_CUSTOMER");
            _.each(oResult, (value, key) => {
                expect(Array.from(oResult[key]).length).not.toBe(0);
            });
        });

        it("should return corect masterdata for an existing calculation version", () => {
            // act
            const result = getResult(iCalculationVersionId);
            // assert
            expect(Array.from(result.OT_ACCOUNTS).length).toBe(2);
            expect(result.OT_ACCOUNTS[0].ACCOUNT_ID).toBe("0");
            expect(result.OT_ACCOUNTS[1].ACCOUNT_ID).toBe("625000");
            expect(Array.from(result.OT_ACCOUNT_GROUPS).length).toBe(0);
            expect(Array.from(result.OT_ACTIVITY_TYPE).length).toBe(1);
            expect(result.OT_ACTIVITY_TYPE[0].ACTIVITY_TYPE_ID).toBe("ACTIVITY2222");
            expect(Array.from(result.OT_BUSINESS_AREA).length).toBe(2);
            expect(result.OT_BUSINESS_AREA[0].BUSINESS_AREA_ID).toBe("B1");
            expect(result.OT_BUSINESS_AREA[1].BUSINESS_AREA_ID).toBe("B3");
            expect(Array.from(result.OT_PROCESS).length).toBe(1);
            expect(result.OT_PROCESS[0].PROCESS_ID).toBe("B1");
            expect(Array.from(result.OT_COMPANY_CODE).length).toBe(1);
            expect(result.OT_COMPANY_CODE[0].COMPANY_CODE_ID).toBe("CC1");
            expect(Array.from(result.OT_COMPONENT_SPLIT).length).toBe(1);
            expect(Array.from(result.OT_CONTROLLING_AREA).length).toBe(1);
            expect(result.OT_CONTROLLING_AREA[0].CONTROLLING_AREA_ID).toBe("1000");
            expect(Array.from(result.OT_COSTING_SHEET).length).toBe(1);
            expect(Array.from(result.OT_COST_CENTER).length).toBe(1);
            expect(result.OT_COST_CENTER[0].COST_CENTER_ID).toBe("CC2");
            expect(Array.from(result.OT_CUSTOMER).length).toBe(0);
            expect(Array.from(result.OT_DOCUMENT).length).toBe(1);
            expect(result.OT_DOCUMENT[0].DOCUMENT_ID).toBe("D1");
            expect(Array.from(result.OT_DOCUMENT_STATUS).length).toBe(1);
            expect(result.OT_DOCUMENT_STATUS[0].DOCUMENT_STATUS_ID).toBe("S1");
            expect(Array.from(result.OT_DOCUMENT_TYPE).length).toBe(1);
            expect(result.OT_DOCUMENT_TYPE[0].DOCUMENT_TYPE_ID).toBe("DT1");
            expect(Array.from(result.OT_EXCHANGE_RATE_TYPE).length).toBe(1);
            expect(result.OT_EXCHANGE_RATE_TYPE[0].EXCHANGE_RATE_TYPE_ID).toBe("STANDARD");
            expect(Array.from(result.OT_DESIGN_OFFICE).length).toBe(1);
            expect(result.OT_DESIGN_OFFICE[0].DESIGN_OFFICE_ID).toBe("L1");
            expect(Array.from(result.OT_MATERIAL).length).toBe(1);
            expect(result.OT_MATERIAL[0].MATERIAL_ID).toBe("MAT1");
            expect(Array.from(result.OT_MATERIAL_TYPE).length).toBe(2);
            expect(result.OT_MATERIAL_TYPE[0].MATERIAL_TYPE_ID).toBe("MT2");
            expect(Array.from(result.OT_MATERIAL_GROUP).length).toBe(1);
            expect(result.OT_MATERIAL_GROUP[0].MATERIAL_GROUP_ID).toBe("MG2");
            expect(Array.from(result.OT_MATERIAL_PLANT).length).toBe(1);
            expect(Array.from(result.OT_OVERHEAD_GROUP).length).toBe(1);
            expect(result.OT_OVERHEAD_GROUP[0].OVERHEAD_GROUP_ID).toBe("O1");
            expect(Array.from(result.OT_PLANT).length).toBe(1);
            expect(result.OT_PLANT[0].PLANT_ID).toBe("PL1");
            expect(Array.from(result.OT_PROFIT_CENTER).length).toBe(1);
            expect(result.OT_PROFIT_CENTER[0].PROFIT_CENTER_ID).toBe("P4");
            expect(Array.from(result.OT_VALUATION_CLASS).length).toBe(1);
            expect(result.OT_VALUATION_CLASS[0].VALUATION_CLASS_ID).toBe("V1");
            expect(Array.from(result.OT_VENDOR).length).toBe(2);
            expect(result.OT_VENDOR[0].VENDOR_ID).toBe("V1");
            expect(result.OT_VENDOR[1].VENDOR_ID).toBe("V2");
            expect(Array.from(result.OT_WORK_CENTER).length).toBe(1);
            expect(result.OT_WORK_CENTER[0].WORK_CENTER_ID).toBe("WC1");
            expect(Array.from(result.OT_PRICE_COMPONENTS).length).toBe(1);
            expect(result.OT_PRICE_COMPONENTS[0].PRICE_ID).toBe("2B0000E0B2BDB9671600A4000936462B");
        });

        it("should return all the valid uoms based on the masterdata timestamp of the given version", () => {
            // act
            const result = getResult(iCalculationVersionId);
            const sMasterdataTimeStmt = `select MASTER_DATA_TIMESTAMP from {{calculation_version}} 
                                            where CALCULATION_VERSION_ID = ${iCalculationVersionId}`;
            const dMasterdataTimestamp = oMockstarPlc.execQuery(sMasterdataTimeStmt).columns.MASTER_DATA_TIMESTAMP.rows[0].toJSON();

            const sGetValidVersionUoms = `select * from {{unit_of_measure}} where _valid_from <= ${"'"}${dMasterdataTimestamp}${"'"} and
                                            ( _valid_to > ${"'"}${dMasterdataTimestamp}${"'"} or _valid_to is null)`;
            const aValidUoms = oMockstarPlc.execQuery(sGetValidVersionUoms).columns;
            const aReturnedUoms = Array.from(result.OT_UOM);
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                expect(aReturnedUoms.length).toBe(aValidUoms.UOM_ID.rows.length);
            } else {
                expect(aReturnedUoms.length).toBe(aValidUoms.UOM_ID.rows.length);
                const aUomIds = Array.from(aValidUoms.UOM_ID.rows);
                aReturnedUoms.forEach((oReturnedUom) => {
                    expect(aUomIds.indexOf(oReturnedUom.UOM_ID) >= 0).toBe(true);
                });
            }
        });

        it("should not return invalid uoms for the given version", () => {
            // act
            const sGreaterValidFrom = "2020-06-02T14:45:50.096Z";
            const oInvalidObject = {
                UOM_ID: ["IN1", "IN2"],
                DIMENSION_ID: ["D2", "TIME"],
                NUMERATOR: [1, 60],
                DENOMINATOR: [1, 1],
                EXPONENT_BASE10: [0, 0],
                SI_CONSTANT: [0, 0],
                _VALID_FROM: [sGreaterValidFrom, "2015-06-02T14:45:50.096Z"],
                _VALID_TO: [null, "2015-06-02T14:45:50.096Z"],
                _SOURCE: [1, 2],
                _CREATED_BY: ["U000", "U000"],
            };
            oMockstarPlc.insertTableData("unit_of_measure", oInvalidObject);
            const result = getResult(iCalculationVersionId);
            const aReturnedUoms = Array.from(result.OT_UOM);

            expect(aReturnedUoms.indexOf(oInvalidObject.UOM_ID[0]) >= 0).toBe(false);
            expect(aReturnedUoms.indexOf(oInvalidObject.UOM_ID[1]) >= 0).toBe(false);
        });

        it("should return all the valid currencies based on the masterdata timestamp of the given version", () => {
            // act
            const result = getResult(iCalculationVersionId);
            const sMasterdataTimeStmt = `select MASTER_DATA_TIMESTAMP from {{calculation_version}} 
                                            where CALCULATION_VERSION_ID = ${iCalculationVersionId}`;
            const dMasterdataTimestamp = oMockstarPlc.execQuery(sMasterdataTimeStmt).columns.MASTER_DATA_TIMESTAMP.rows[0].toJSON();

            const sGetValidCurrencies = `select * from {{currency}} where _valid_from <= ${"'"}${dMasterdataTimestamp}${"'"} and
                                            ( _valid_to > ${"'"}${dMasterdataTimestamp}${"'"} or _valid_to is null)`;
            const aGetValidCurrencies = oMockstarPlc.execQuery(sGetValidCurrencies).columns;
            const aReturnedCurencies = Array.from(result.OT_CURRENCY);
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                expect(aReturnedCurencies.length).toBe(aGetValidCurrencies.CURRENCY_ID.rows.length);
            } else {
                expect(aReturnedCurencies.length).toBe(aGetValidCurrencies.CURRENCY_ID.rows.length);
                const aCurrencyIds = Array.from(aGetValidCurrencies.CURRENCY_ID.rows);
                aReturnedCurencies.forEach((oReturnedCurrency) => {
                    expect(aCurrencyIds.indexOf(oReturnedCurrency.CURRENCY_ID) >= 0).toBe(true);
                });
            }
        });

        it("should not return invalid currencies for the given version", () => {
            // act
            const sGreaterValidFrom = "2020-06-02T14:45:50.096Z";
            const oInvalidObject = {
                CURRENCY_ID: ["IN1", "IN2"],
                _VALID_FROM: [sGreaterValidFrom, "2015-06-02T14:45:50.096Z"],
                _VALID_TO: [null, "2015-06-02T14:45:50.096Z"],
                _SOURCE: [1, 2],
                _CREATED_BY: ["U000", "U000"],
            };
            oMockstarPlc.insertTableData("currency", oInvalidObject);
            const result = getResult(iCalculationVersionId);
            const aReturnedUoms = Array.from(result.OT_CURRENCY);

            expect(aReturnedUoms.indexOf(oInvalidObject.CURRENCY_ID[0]) >= 0).toBe(false);
            expect(aReturnedUoms.indexOf(oInvalidObject.CURRENCY_ID[1]) >= 0).toBe(false);
        });
    }).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}
