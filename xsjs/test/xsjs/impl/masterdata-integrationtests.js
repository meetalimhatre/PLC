const oTestData = require("../../testdata/testdata").data;
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const ResponseObjectStub = require("../../testtools/responseObjectStub").ResponseObjectStub;
const testData = require("../../testdata/testdata").data;
const _ = require("lodash");
const InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const Persistency = $.import("xs.db", "persistency").Persistency;
const DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLibrary.Dispatcher;
const oCtx = DispatcherLibrary.prepareDispatch($);
const MessageLibrary = require("../../../lib/xs/util/message");
const oMessageCode = MessageLibrary.Code;

describe("xsjs.impl.masterdata-integrationtests", () => {
    let oMockstar = null;
    let oResponseStub = null;

    sCalculationVersionDate = new Date().toJSON();

    const oCalculationVersionTestData = Object.assign({}, testData.oCalculationVersionTestData, { VALUATION_DATE: [sCalculationVersionDate,sCalculationVersionDate,sCalculationVersionDate] });

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            schema: "SAP_PLC",
            substituteTables: {
                calculation: {
                    name: "sap.plc.db::basis.t_calculation",
                    data: testData.oCalculationTestData,
                },
                project: {
                    name: "sap.plc.db::basis.t_project",
                    data: testData.oProjectTestData,
                },
                calculationVersion: {
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
                authorization: "sap.plc.db::auth.t_auth_project",
                session: {
                    name: "sap.plc.db::basis.t_session",
                    data: oTestData.oSessionTestData,
                },
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
        oMockstar.clearAllTables();
        const oPersistency = new Persistency(jasmine.dbConnection);
        oCtx.persistency = oPersistency;
        oResponseStub = new ResponseObjectStub();
        oMockstar.insertTableData("authorization", {
            PROJECT_ID: [testData.oProjectTestData.PROJECT_ID[0]],
            USER_ID: [testData.sTestUser],
            PRIVILEGE: [InstancePrivileges.READ],
        });
        oMockstar.initializeData();
    });

    afterEach(() => {
        oMockstar.clearAllTables();
    });

    describe("getMasterdata", () => {
        function prepareRequest(nVersionId) {
            const params = [{
                name: "calculation_version_id",
                value: nVersionId,
            }];
            const oRequest = {
                queryPath: "masterdata",
                method: $.net.http.GET,
                parameters: params,
            };
            return oRequest;
        }

        it("should return all masterdata for the given calculation version", () => {
            // arrange
            const oRequest = prepareRequest(testData.iCalculationVersionId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // arrange
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oReturnedObject = oResponseStub.getParsedBody().body.masterdata;
            // omited properties were not filled
            const oEmptyMasterdata = _.omit(oReturnedObject, "ACCOUNT_GROUP_ENTITIES", "SELECTED_ACCOUNT_GROUPS_ENTITIES", "CUSTOMER_ENTITIES");
            _.each(oEmptyMasterdata, (value, key) => {
                expect(Array.from(oEmptyMasterdata[key]).length).not.toBe(0);
            });
        });

        it("should return an empty array when no masterdata for the given calculation version available", () => {
            // arrange
            const oRequest = prepareRequest(testData.iSecondVersionId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // arrange
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oReturnedObject = oResponseStub.getParsedBody().body.masterdata;
            const oEmptyMasterdata = _.omit(oReturnedObject, "UNIT_OF_MEASURE_ENTITIES", "CURRENCY_ENTITIES", "EXCHANGE_RATE_TYPE_ENTITIES");
            _.each(oEmptyMasterdata, (value, key) => {
                expect(Array.from(oEmptyMasterdata[key]).length).toBe(0);
            });
            expect(oReturnedObject.CURRENCY_ENTITIES.length).not.toBe(0);
            expect(oReturnedObject.EXCHANGE_RATE_TYPE_ENTITIES.length).not.toBe(0);
        });

        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the calculation version does not exist", () => {
            // arrange
            oMockstar.clearTable("calculationVersion");
            const oRequest = prepareRequest(testData.iCalculationVersionId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });

        it("should return GENERAL_ACCESS_DENIED when the user has no instance privilege to read the calculation version ", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oRequest = prepareRequest(testData.iCalculationVersionId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
    });
}).addTags(["Project_Calculation_Version_Integration"]);
