const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const ResponseObjectStub = require("../../testtools/responseObjectStub").ResponseObjectStub;
const TestData = require("../../testdata/testdata").data;
const DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLibrary.Dispatcher;
const oCtx = DispatcherLibrary.prepareDispatch($);
const Persistency = $.import("xs.db", "persistency").Persistency;
const MessageLibrary = require("../../../lib/xs/util/message");
const oMessageCode = MessageLibrary.Code;

let oMockstar = null;
const sDeletePlaceholder = "DELETED";
const sUserId = TestData.sTestUser;
const sTestUserID = "TESTUSER1";
const sCustomerId1 = "TCUS1";
const sCustomerId2 = "TCUS2";
const sVendorId = "TVENDOR1";
const sProjectId = TestData.oCalculationTestData.PROJECT_ID[0];
const sStandardPriceDeterminationStrategy = TestData.oPriceDeterminationStrategyTestData.PRICE_DETERMINATION_STRATEGY_ID[0];
let oResponseStub;
let oRequestBody;
var dDate = new Date();
var sDate = dDate.toJSON();
const sDefaultPriceDeterminationStrategy = TestData.sStandardPriceStrategy;

describe("xsjs.impl.data-protection-componenttests", () => {
    const oVendorTestData = {
        VENDOR_ID: [sVendorId, "TESTER2"],
        VENDOR_NAME: ["V5", "V55"],
        COUNTRY: ["C1", "C2"],
        POSTAL_CODE: ["1", "2"],
        REGION: ["A", "B"],
        CITY: ["X", "Y"],
        STREET_NUMBER_OR_PO_BOX: ["11", "22"],
        _VALID_FROM: [sDate, sDate],
        _VALID_TO: [null, null],
        _SOURCE: [1, 1],
        _CREATED_BY: [sUserId, sUserId],
    };

    const oUserTestData = {
        USERGROUP_ID: ["TESTGROUP", "TESTGROUP"],
        USER_ID: [sTestUserID, sCustomerId2],
    };

    const oCustomerTestData = {
        CUSTOMER_ID: [sCustomerId1, sCustomerId2],
        CUSTOMER_NAME: ["C2", "C3"],
        COUNTRY: ["US", "US"],
        POSTAL_CODE: ["1234", "1234"],
        REGION: ["W", "W"],
        CITY: ["Palo Alto", "Palo Alto"],
        STREET_NUMBER_OR_PO_BOX: ["7890", "7890"],
        _VALID_FROM: [sDate, sDate],
        _VALID_TO: [sDate, sDate],
        _SOURCE: [2, 2],
        _CREATED_BY: [sUserId, sUserId],
    };

    function createFormulaTestData(sEntity) {
        return {
            FORMULA_ID: ["1", "2"],
            PATH: ["Item", "Item"],
            BUSINESS_OBJECT: ["Item", "Item"],
            COLUMN_ID: ["CUST_STRING_FORMULA", "CUST_STRING_FORMULA"],
            ITEM_CATEGORY_ID: [7, 7],
            IS_FORMULA_USED: [1, 1],
            FORMULA_STRING: [
                "IF(IS_CALCULATION_VERSION()=1; '" + sEntity + "'; 'USER2')",
                "IF(IS_CALCULATION_VERSION()=1; '" + sTestUserID + "'; 'USER2')",
            ],
        };
    }

    const oProjectTestData = {
        PROJECT_ID: [sProjectId, "2"],
        ENTITY_ID: [1,  2],
        CONTROLLING_AREA_ID: ["#CA1", "#CA1"],
        CREATED_BY: [sTestUserID, sTestUserID],
        LAST_MODIFIED_ON: [sDate, sDate],
        LAST_MODIFIED_BY: [sTestUserID, sTestUserID],
        CUSTOMER_ID: [sCustomerId1, sCustomerId2],
        PROJECT_RESPONSIBLE: [sCustomerId1, sCustomerId2],
        MATERIAL_PRICE_STRATEGY_ID:     [sStandardPriceDeterminationStrategy, sStandardPriceDeterminationStrategy],
		ACTIVITY_PRICE_STRATEGY_ID:     [sStandardPriceDeterminationStrategy, sStandardPriceDeterminationStrategy]
    };

    const oCalculationTestData = {
        CALCULATION_ID: [TestData.iCalculationId],
        PROJECT_ID: [sProjectId],
        CALCULATION_NAME: ["CALCULATION 1"],
        CREATED_ON: [TestData.sExpectedDate],
        CREATED_BY: [sTestUserID],
        LAST_MODIFIED_ON: [TestData.sExpectedDate],
        LAST_MODIFIED_BY: [sTestUserID]
    };

    const oCalculationVersionTestData = {
        CALCULATION_VERSION_ID: [TestData.iCalculationVersionId],
        CALCULATION_ID: [TestData.iCalculationId],
        CALCULATION_VERSION_NAME: ["CALC VERSION 1"],
        CALCULATION_VERSION_TYPE: [1],
        ROOT_ITEM_ID: [3001],
        CUSTOMER_ID: [sCustomerId1],
        SALES_PRICE_CURRENCY_ID: ["EUR"],
        REPORT_CURRENCY_ID: ["EUR"],
        VALUATION_DATE: [TestData.sExpectedDateWithoutTime],
        LAST_MODIFIED_ON: [TestData.sExpectedDate],
        LAST_MODIFIED_BY: [sTestUserID],
        MASTER_DATA_TIMESTAMP: [TestData.sMasterdataTimestampDate],
        VARIANT_ID: [TestData.iVariantId],
        MATERIAL_PRICE_STRATEGY_ID: sDefaultPriceDeterminationStrategy,
        ACTIVITY_PRICE_STRATEGY_ID: sDefaultPriceDeterminationStrategy
    };

    const oItemTestData = {
        VENDOR_ID: [sVendorId, sVendorId, "user", "user"],
        ITEM_ID: [1, 2, 3, 4],
        CALCULATION_VERSION_ID: [TestData.iCalculationVersionId, TestData.iCalculationVersionId, 3, 4],
        IS_ACTIVE: [1, 1, 1, 1],
        ITEM_CATEGORY_ID: [1, 2, 3, 4],
        CHILD_ITEM_CATEGORY_ID: [1, 2, 3, 4],
        CREATED_ON: [sDate, sDate, sDate, sDate],
        CREATED_BY: [sTestUserID, sTestUserID, "user", "user"],
        LAST_MODIFIED_ON: [sDate, sDate, sDate, sDate],
        LAST_MODIFIED_BY: [sTestUserID, sTestUserID, "user", "user"],
    };

    const oVariantTestData = {
        VARIANT_ID: [TestData.iVariantId, TestData.iVariantId],
        CALCULATION_VERSION_ID: [TestData.iCalculationVersionId, TestData.iCalculationVersionId],
        VARIANT_NAME: ["VARIANT 1", "VARIANT 2"],
        EXCHANGE_RATE_TYPE_ID: ["STANDARD", "STANDARD"],
        REPORT_CURRENCY_ID: ["EUR", "EUR"],
        IS_SELECTED: [1, 1],
        LAST_REMOVED_MARKINGS_BY: [sTestUserID, sTestUserID],
        LAST_MODIFIED_BY: [sTestUserID, sTestUserID],
        LAST_CALCULATED_BY: [sTestUserID, sTestUserID],
    };

    const oProjectData = {
        PROJECT_ID: ["1", "2", "3", "4"],
        ENTITY_ID: [5,6,7,8],
        CONTROLLING_AREA_ID: ["#CA1", "#CA1", "#CA1", "#CA1"],
        CREATED_BY: ["user", "USeR", "uSeR", "usEr"],
        LAST_MODIFIED_ON: [sDate, sDate, sDate, sDate],
        LAST_MODIFIED_BY: ["tmoder", "tMoDer", "tmoDER", "TMOder"],
        CUSTOMER_ID: ["tcust", "tCuSt", "TCust", "tcUST"],
        PROJECT_RESPONSIBLE: ["user", "USeR", "uSeR", "usEr"],
        MATERIAL_PRICE_STRATEGY_ID:[sStandardPriceDeterminationStrategy,sStandardPriceDeterminationStrategy,sStandardPriceDeterminationStrategy,sStandardPriceDeterminationStrategy],
        ACTIVITY_PRICE_STRATEGY_ID:[sStandardPriceDeterminationStrategy,sStandardPriceDeterminationStrategy,sStandardPriceDeterminationStrategy,sStandardPriceDeterminationStrategy]
    };

    const oFolderTestData = {
        ENTITY_ID: [111,222,333],
        FOLDER_NAME:  ["Folder 1", "Folder 2", "Folder 3"],
        CREATED_BY:  ["user", "user", "uSeR"],
        MODIFIED_BY: ["tmoder", "user", "tmoDER"],
        CREATED_ON:  [sDate, sDate, sDate, sDate],
        MODIFIED_ON: [sDate, sDate, sDate, sDate]
    };

    var oEntityTagsTestData = {
            "TAG_ID" : [1, 2],
            "ENTITY_TYPE" : ["V", "C"],
            "ENTITY_ID" : [TestData.iCalculationVersionId, TestData.iCalculationId],
            "CREATED_ON" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
            "CREATED_BY" : [sTestUserID, sTestUserID]
    };

    var oOneTimeProjectCostTestData ={
		ONE_TIME_COST_ID:[1,2,3,4],
        PROJECT_ID:[sProjectId,sProjectId,"PR111",sProjectId],
        ACCOUNT_ID:["AC1","AC1","AC2","AC3"],
        COST_DESCRIPTION:["C1","C1","C2","C3"],
        COST_TO_DISTRIBUTE:[11,12,13,14],
        COST_NOT_DISTRIBUTED:[11,12,13,14],
        COST_CURRENCY_ID:["EUR","EUR","EUR","EUR"],
		FIXED_COST_PORTION:[1,2,3,4],
		DISTRIBUTION_TYPE:[0,0,0,0],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUserID, "sTestUser2", sTestUserID, "sTestUser2"]
	};

	var oOneTimeProductCostTestData ={
		ONE_TIME_COST_ID:[1,2,3,4],
        CALCULATION_ID:[TestData.iCalculationId,TestData.iCalculationId,123,TestData.iCalculationId],
        COST_TO_DISTRIBUTE:[11,12,13,14],
        COST_NOT_DISTRIBUTED:[11,12,13,14],
		DISTRIBUTION_TYPE:[0,0,0,0],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUserID, "sTestUser2", sTestUserID, "sTestUser2"]
	};

	var oProjectTotalQuatitiesTestData ={
		RULE_ID:[1,2,3,4],
        CALCULATION_ID:[TestData.iCalculationId,123,TestData.iCalculationId,TestData.iCalculationId],
        CALCULATION_VERSION_ID:[11,12,13,14],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUserID, "sTestUser2", sTestUserID, "sTestUser2"]
	};

	var oProjectLifecycleConfigurationTestData ={
        PROJECT_ID:[sProjectId,"PR2",sProjectId,"PR2"],
        CALCULATION_ID:[TestData.iCalculationId,300,232,1222],
        CALCULATION_VERSION_ID:[11,12,13,14],
        IS_ONE_TIME_COST_ASSIGNED:[1,1,1,1],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUserID, sTestUserID, "sTestUser2", "sTestUser2"]
	};

	var oProjectLifecyclePeriodTypeTestData ={
		PROJECT_ID:[sProjectId,"PR2",sProjectId,sProjectId],
		YEAR:[2021,2020,2022,2023],
		IS_YEAR_SELECTED:[1,1,1,1],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUserID, "sTestUser2", sTestUserID, "sTestUser2"]
	};

	var oProjectMonthlyLifecyclePeriodTypeTestData ={
		PROJECT_ID:[sProjectId,"PR2",sProjectId,sProjectId,"PR2","PP","PR2"],
		YEAR:[2021,2020,2022,2023,2024,2025,2026],
		SELECTED_MONTH: [2,4,6,7,8,6,9],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUserID, "sTestUser2", sTestUserID, "sTestUser2",sTestUserID, sTestUserID, "sTestUser2"]
	};

	var oProjectLifecyclePeriodQuantityValueTestData ={
		PROJECT_ID:[sProjectId,"PR2",sProjectId,sProjectId,sProjectId,sProjectId],
		CALCULATION_ID:[TestData.iCalculationId,300,TestData.iCalculationId,221,TestData.iCalculationId,TestData.iCalculationId],
		LIFECYCLE_PERIOD_FROM:[2021,2020,2022,2023,2024,2025],
		VALUE:[134,341,45,341,456,789],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUserID, "sTestUser2", sTestUserID, "sTestUser2",sTestUserID, "sTestUser2"]
    };
    
    var oVendorReplTestData = {
        MANDT:   ["1", "2", "1"],
        LIFNR:   [sVendorId, sVendorId, "VEN98"],
        LAND1:   ["DE", "EN","RO"]
    };

    var oCustomerReplTestData = {
        MANDT:   ["1", "2", "1"],
        KUNNR:   [sCustomerId1, sCustomerId1, sCustomerId2],
        LAND1:   ["DE", "EN","RO"]
    };

    var oReplicationRunTestData = {
        RUN_ID:  ["A", "B", "C"],
        MANUAL:  [1, 2, 1],
        USER_ID: ["TESTTT", sTestUserID, sTestUserID],
    };

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                vendor: {
                    name: "sap.plc.db::basis.t_vendor",
                    data: oVendorTestData,
                },
                usergroup_user: {
                    name: "sap.plc.db::auth.t_usergroup_user",
                    data: oUserTestData,
                },
                customer: {
                    name: "sap.plc.db::basis.t_customer",
                    data: oCustomerTestData,
                },
                variant: {
                    name: "sap.plc.db::basis.t_variant",
                    data: oVariantTestData,
                },
                variant_temporary: {
                    name: "sap.plc.db::basis.t_variant_temporary",
                    data: oVariantTestData,
                },
                calculation: {
                    name: "sap.plc.db::basis.t_calculation",
                    data: oCalculationTestData,
                },
                formula: {
                    name: "sap.plc.db::basis.t_formula",
                },
                project: {
                    name: "sap.plc.db::basis.t_project",
                    data: oProjectTestData,
                },
                item: {
                    name: "sap.plc.db::basis.t_item",
                    data: oItemTestData,
                },
                calculation_version: {
                    name: "sap.plc.db::basis.t_calculation_version",
                    data: oCalculationVersionTestData,
                },
                folder: {
                    name: "sap.plc.db::basis.t_folder",
                    data: oFolderTestData,
                },
                entity_tags: {
                    name: "sap.plc.db::basis.t_entity_tags",
                    data: oEntityTagsTestData,
                },
                one_time_project_cost: {
					name: "sap.plc.db::basis.t_one_time_project_cost",
					data: oOneTimeProjectCostTestData
				},
    			one_time_product_cost: {
					name: "sap.plc.db::basis.t_one_time_product_cost",
					data: oOneTimeProductCostTestData
				},
				project_total_quantities: {
					name: "sap.plc.db::basis.t_project_total_quantities",
					data: oProjectTotalQuatitiesTestData
				},
    			project_lifecycle_configuration: {
					name: "sap.plc.db::basis.t_project_lifecycle_configuration",
					data: oProjectLifecycleConfigurationTestData
				},
				project_lifecycle_period_type: {
					name: "sap.plc.db::basis.t_project_lifecycle_period_type",
					data: oProjectLifecyclePeriodTypeTestData
				},
    			project_monthly_lifecycle_period: {
					name: "sap.plc.db::basis.t_project_monthly_lifecycle_period",
					data: oProjectMonthlyLifecyclePeriodTypeTestData
				},
    			project_lifecycle_period_quantity_value: {
					name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
					data: oProjectLifecyclePeriodQuantityValueTestData
                },
                customer_replication: {
                    name: "sap.plc.db::repl_st.t_kna1",
                    data: oCustomerReplTestData
                },
                vendor_replication: {
                    name: "sap.plc.db::repl_st.t_lfa1",
                    data: oVendorReplTestData
                },	
                replication_run: {
                    name: "sap.plc.db::map.t_replication_run",
                    data: oReplicationRunTestData
                }	
            },
        });
    });

    function RequestBody() {
        this.setUserId = (sUserIdBodyValue) => {
            this.USER_ID = sUserIdBodyValue;
            return this;
        };
        this.setCustomerId = (sCustomerIdBodyValue) => {
            this.CUSTOMER_ID = sCustomerIdBodyValue;
            return this;
        };
        this.setVendorId = (sVendorIdBodyValue) => {
            this.VENDOR_ID = sVendorIdBodyValue;
            return this;
        };
        this.setProjectId = (sProjectIdBodyValue) => {
            this.PROJECT_ID = sProjectIdBodyValue;
            return this;
        };
        this.asString = () => JSON.stringify(this);
    }

    RequestBody.prototype = Object.create(RequestBody.prototype);
    RequestBody.prototype.constructor = RequestBody;

    beforeEach(() => {
        const oPersistency = new Persistency(jasmine.dbConnection);
        oCtx.persistency = oPersistency;
        oResponseStub = new ResponseObjectStub();
        oMockstar.initializeData();
        oRequestBody = new RequestBody();
    });

    afterEach(() => {
        oMockstar.clearAllTables();
    });

    function getResponseBody() {
        return oResponseStub.getParsedBody().body;
    }

    function prepareRequest(sPostMethod, sPostBody, sPostQueryPath) {
        const oRequest = {
            queryPath: sPostQueryPath || "data-protection",
            method: sPostMethod || $.net.http.DEL,
            body: sPostBody || oRequestBody,
        };
        return oRequest;
    }

    describe("DELETE - remove personal data", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should successfully replace a valid user id with a placeholder", () => {
            // arrange
            oRequestBody.setUserId(sTestUserID);
            const oRequest = prepareRequest();
            const sGetVariant = `select * from {{variant}} where VARIANT_ID = ${TestData.iVariantId}`;
            const sGetVariantTemp = `select * from {{variant_temporary}} where VARIANT_ID = ${TestData.iVariantId}`;

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oVariant = oMockstar.execQuery(sGetVariant).columns;
            const oVariantTemp = oMockstar.execQuery(sGetVariantTemp).columns;

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(getResponseBody()).toEqualObject({});
            expect(oVariant.LAST_CALCULATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oVariant.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oVariant.LAST_REMOVED_MARKINGS_BY.rows[0]).toBe(sDeletePlaceholder);

            expect(oVariantTemp.LAST_CALCULATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oVariantTemp.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oVariantTemp.LAST_REMOVED_MARKINGS_BY.rows[0]).toBe(sDeletePlaceholder);
        });

        it("should successfully replace a valid user id that is project responsible with a placeholder", () => {
            // arrange
            const oProjData = oProjectTestData;
            oProjData.PROJECT_RESPONSIBLE[0] = sTestUserID;
            oMockstar.clearTable("project");
            oMockstar.insertTableData("project", oProjData);
            oRequestBody.setUserId(sTestUserID);
            const oRequest = prepareRequest();
            const sGetProjectData = `select PROJECT_RESPONSIBLE from {{project}} where PROJECT_ID = '${oProjectTestData.PROJECT_ID[0]}'`;

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oProjectTData = oMockstar.execQuery(sGetProjectData).columns;

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(getResponseBody()).toEqualObject({});
            expect(oProjectTData.PROJECT_RESPONSIBLE.rows[0]).toBe(sDeletePlaceholder);
        });

        it("should successfully replace a user id with a placeholder - case-insensitive test", () => {
            // arrange
            oMockstar.clearTable("project");
            oMockstar.insertTableData("project", oProjectData);
            oRequestBody.setUserId(oProjectData.PROJECT_RESPONSIBLE[0]);
            const oRequest = prepareRequest();
            const sProjectIds = oProjectData.PROJECT_ID.map(a => `${a}`).toString();
            const sFoldertIds = oFolderTestData.ENTITY_ID.map(a => `${a}`).toString();
            const sGetProjectData = `select PROJECT_RESPONSIBLE, CREATED_BY from {{project}} where PROJECT_ID in (${sProjectIds})`;
            const sGetFoldertData = `select CREATED_BY, MODIFIED_BY from {{folder}} where ENTITY_ID in (${sFoldertIds})`;


            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oProjectTData = oMockstar.execQuery(sGetProjectData).columns;
            const oFolderTData = oMockstar.execQuery(sGetFoldertData).columns;

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(getResponseBody()).toEqualObject({});
            expect(oProjectTData.PROJECT_RESPONSIBLE.rows[0]).toBe(sDeletePlaceholder);
            expect(oProjectTData.PROJECT_RESPONSIBLE.rows[1]).toBe(sDeletePlaceholder);
            expect(oProjectTData.PROJECT_RESPONSIBLE.rows[2]).toBe(sDeletePlaceholder);
            expect(oProjectTData.PROJECT_RESPONSIBLE.rows[3]).toBe(sDeletePlaceholder);

            expect(oProjectTData.CREATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oProjectTData.CREATED_BY.rows[1]).toBe(sDeletePlaceholder);
            expect(oProjectTData.CREATED_BY.rows[2]).toBe(sDeletePlaceholder);
            expect(oProjectTData.CREATED_BY.rows[3]).toBe(sDeletePlaceholder);

            expect(oFolderTData.CREATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oFolderTData.CREATED_BY.rows[2]).toBe(sDeletePlaceholder);

            expect(oFolderTData.MODIFIED_BY.rows[2]).toBe(sDeletePlaceholder);
        });

        it("should return a message indicating that a user is still used in a formula deleting personal data", () => {
            // arrange
            oRequestBody.setUserId(sTestUserID);
            oMockstar.insertTableData("formula", createFormulaTestData(sTestUserID));
            const oRequest = prepareRequest();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().head.messages[0].code).toBe(oMessageCode.PERSONAL_DATA_IN_FORMULA.code);
            expect(getResponseBody()).toEqualObject({});
        });

        it("should successfully replace a valid customer with a placeholder", () => {
            // arrange
            oRequestBody.setCustomerId(sCustomerId1);
            const oRequest = prepareRequest();
            const sGetCustomer = "select CUSTOMER_ID from {{customer}}";
            const sGetProject = "select CUSTOMER_ID from {{project}}";
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oCustomer = oMockstar.execQuery(sGetCustomer).columns;
            const oProject = oMockstar.execQuery(sGetProject).columns;
            
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oCustomer.CUSTOMER_ID.rows.length).toBe(oCustomerTestData.CUSTOMER_ID.length - 1);
            expect(oProject.CUSTOMER_ID.rows[1]).toBe(sDeletePlaceholder);
        });

        it("should return a message indicating that customer-data is still used in a formula deleting personal data", () => {
            // arrange
            oRequestBody.setCustomerId(sCustomerId1);
            oMockstar.insertTableData("formula", createFormulaTestData(sCustomerId1));
            const oRequest = prepareRequest();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().head.messages[0].code).toBe(oMessageCode.PERSONAL_DATA_IN_FORMULA.code);
        });

        it("should successfully replace a valid vendor with a placeholder", () => {
            // arrange
            oRequestBody.setVendorId(sVendorId);
            const oRequest = prepareRequest();
            const sGetVendor = "select VENDOR_ID from {{vendor}}";
            const sGetItem = "select VENDOR_ID from {{item}}";

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oVendor = oMockstar.execQuery(sGetVendor).columns;
            const oItem = oMockstar.execQuery(sGetItem).columns;

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oVendor.VENDOR_ID.rows.length).toBe(oVendorTestData.VENDOR_ID.length - 1);
            expect(oItem.VENDOR_ID.rows[2]).toBe(sDeletePlaceholder);
        });

        it("should return a message indicating that vendor-data is still used in a formula deleting personal data", () => {
            // arrange
            oRequestBody.setVendorId(sVendorId);
            oMockstar.insertTableData("formula", createFormulaTestData(sVendorId));
            const oRequest = prepareRequest();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().head.messages[0].code).toBe(oMessageCode.PERSONAL_DATA_IN_FORMULA.code);
        });

        it("should return a message indicating that user data is still used in a formula deleting personal data - item level", () => {
            // arrange
            const sUserIdInList = "sUserId1";
            oRequestBody.setVendorId(sUserIdInList);
            const oFormulaData = createFormulaTestData(sUserIdInList);
            oFormulaData.FORMULA_STRING = [
                "If($CREATED_BY='SUSERID .. SUSERID10'; 1 ; 0)",
                "If($ACCOUNT_ID='ABC'; 1 ; 0)",
                "If($DOCUMENT_ID='123'; 1 ; 0)",
            ];
            oMockstar.clearTable("formula");
            oMockstar.insertTableData("formula", oFormulaData);
            const oRequest = prepareRequest();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().head.messages[0].code).toBe(oMessageCode.PERSONAL_DATA_IN_FORMULA.code);
        });

        it("should return a message indicating that user data is still used in a formula deleting personal data - calculation version level", () => {
            // arrange
            const sUserIdInList = "SUSERID1";
            oRequestBody.setVendorId(sUserIdInList);
            const oFormulaData = createFormulaTestData(sUserIdInList);
            oFormulaData.FORMULA_STRING = [
                "If($Version.LAST_MODIFIED_BY='SUSERID .. SUSERID10'; 1 ; 0)",
                "If($Version.SALES_DOCUMENT='ABC'; 1 ; 0)",
                "If($Version.COMPONENT_SPLIT_ID='123'; 1 ; 0)",
            ];
            oMockstar.insertTableData("formula", oFormulaData);
            const oRequest = prepareRequest();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().head.messages[0].code).toBe(oMessageCode.PERSONAL_DATA_IN_FORMULA.code);
        });

        it("should return a message indicating that user data is still used in a formula deleting personal data - calculation level", () => {
            // arrange
            const sUserIdInList = "SUSERID1";
            oRequestBody.setVendorId(sUserIdInList);
            const oFormulaData = createFormulaTestData(sUserIdInList);
            oFormulaData.FORMULA_STRING = [
                "If($Calculation.CREATED_BY='SUSERID .. SUSERID10'; 1 ; 0)",
                "If($Calculation.CALCULATION_NAME='ABC'; 1 ; 0)",
                "If($Calculation.PROJECT_ID='123'; 1 ; 0)",
            ];
            oMockstar.insertTableData("formula", oFormulaData);
            const oRequest = prepareRequest();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().head.messages[0].code).toBe(oMessageCode.PERSONAL_DATA_IN_FORMULA.code);
        });

        it("should return ok status and replace personal data in a valid project", () => {
            // arrange
            oRequestBody.setProjectId(sProjectId);
            const oRequest = prepareRequest();
            const sProjectStmt = `select CUSTOMER_ID, PROJECT_RESPONSIBLE, CREATED_BY, LAST_MODIFIED_BY from {{project}} where PROJECT_ID = '${sProjectId}'`;
            const sCalculationStmt = `select CREATED_BY, LAST_MODIFIED_BY from {{calculation}} where PROJECT_ID = '${sProjectId}'`;
            const sCalculationVersionStmt = `select CUSTOMER_ID, LAST_MODIFIED_BY from {{calculation_version}} where CALCULATION_ID = '${TestData.iCalculationId}'`;
            const sItemStmt = `select VENDOR_ID, CREATED_BY, LAST_MODIFIED_BY from {{item}} where CALCULATION_VERSION_ID = '${TestData.iCalculationVersionId}'`;
            const sVariantStmt = `select LAST_CALCULATED_BY, LAST_MODIFIED_BY, LAST_REMOVED_MARKINGS_BY from {{variant}} where CALCULATION_VERSION_ID = '${TestData.iCalculationVersionId}'`;
            const sVariantTempStmt = `select LAST_CALCULATED_BY, LAST_MODIFIED_BY, LAST_REMOVED_MARKINGS_BY from {{variant_temporary}} where CALCULATION_VERSION_ID = '${TestData.iCalculationVersionId}'`;
            const sEntityTagsStmt = `select CREATED_BY from {{entity_tags}} where (ENTITY_ID = '${TestData.iCalculationVersionId}' AND ENTITY_TYPE = 'V') OR (ENTITY_ID = '${TestData.iCalculationId}' AND ENTITY_TYPE = 'C')`;
            const oEntityOneTimeProjectCostStmt = `select LAST_MODIFIED_BY from {{one_time_project_cost}} where PROJECT_ID = '${sProjectId}'`;
            const oEntityOneTimeProductCostStmt = `select LAST_MODIFIED_BY from {{one_time_product_cost}} where CALCULATION_ID = '${TestData.iCalculationId}'`;
            const oEntityProjectTotalQuatitiesStmt = `select LAST_MODIFIED_BY from {{project_total_quantities}} where CALCULATION_ID = '${TestData.iCalculationId}'`;
            const oEntityProjectLifecycleConfigStmt = `select LAST_MODIFIED_BY from {{project_lifecycle_configuration}} where PROJECT_ID = '${sProjectId}'`;
            const oEnitityProjectLifecyclePeriodTypeStmt = `select LAST_MODIFIED_BY from {{project_lifecycle_period_type}} where PROJECT_ID = '${sProjectId}'`;
            const oEnitityProjectMonthlyLifecyclePeriodStmt = `select LAST_MODIFIED_BY from {{project_monthly_lifecycle_period}} where PROJECT_ID = '${sProjectId}'`;
            const oEnitityProjectLifecyclePeriodQuantityStmt = `select LAST_MODIFIED_BY from {{project_lifecycle_period_quantity_value}} where PROJECT_ID = '${sProjectId}'`;

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oProjectData = oMockstar.execQuery(sProjectStmt).columns;
            const oCalcData = oMockstar.execQuery(sCalculationStmt).columns;
            const oCalcVersionData = oMockstar.execQuery(sCalculationVersionStmt).columns;
            const oItemData = oMockstar.execQuery(sItemStmt).columns;
            const oVariantData = oMockstar.execQuery(sVariantStmt).columns;
            const oVariantTempData = oMockstar.execQuery(sVariantTempStmt).columns;
            const oEntityTagsData = oMockstar.execQuery(sEntityTagsStmt).columns;

            const oEntityOneTimeProjectCostData = oMockstar.execQuery(oEntityOneTimeProjectCostStmt).columns;
            const oEntityOneTimeProductCostData = oMockstar.execQuery(oEntityOneTimeProductCostStmt).columns;
            const oEntityProjectTotalQuatitiesData = oMockstar.execQuery(oEntityProjectTotalQuatitiesStmt).columns;
            const oEntityProjectLifecycleConfigData = oMockstar.execQuery(oEntityProjectLifecycleConfigStmt).columns;
            const oEnitityProjectLifecyclePeriodTypeData = oMockstar.execQuery(oEnitityProjectLifecyclePeriodTypeStmt).columns;
            const oEnitityProjectMonthlyLifecyclePeriodData = oMockstar.execQuery(oEnitityProjectMonthlyLifecyclePeriodStmt).columns;
            const oEnitityProjectLifecyclePeriodQuantityData = oMockstar.execQuery(oEnitityProjectLifecyclePeriodQuantityStmt).columns;

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);

            expect(oProjectData.CUSTOMER_ID.rows[0]).toBe(sDeletePlaceholder);
            expect(oProjectData.PROJECT_RESPONSIBLE.rows[0]).toBe(sDeletePlaceholder);
            expect(oProjectData.CREATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oProjectData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);

            expect(oCalcData.CREATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oCalcData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);

            expect(oCalcVersionData.CUSTOMER_ID.rows[0]).toBe(sDeletePlaceholder);
            expect(oCalcVersionData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);

            expect(oItemData.VENDOR_ID.rows[0]).toBe(sDeletePlaceholder);
            expect(oItemData.CREATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oItemData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);

            expect(oVariantData.LAST_CALCULATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oVariantData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oVariantData.LAST_REMOVED_MARKINGS_BY.rows[0]).toBe(sDeletePlaceholder);

            expect(oVariantTempData.LAST_CALCULATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oVariantTempData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oVariantTempData.LAST_REMOVED_MARKINGS_BY.rows[0]).toBe(sDeletePlaceholder);

            expect(oEntityTagsData.CREATED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEntityTagsData.CREATED_BY.rows[1]).toBe(sDeletePlaceholder);

            expect(oEntityOneTimeProjectCostData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEntityOneTimeProductCostData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEntityProjectTotalQuatitiesData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEntityProjectTotalQuatitiesData.LAST_MODIFIED_BY.rows[2]).toBe(sDeletePlaceholder);
            expect(oEntityProjectLifecycleConfigData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEnitityProjectLifecyclePeriodTypeData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEnitityProjectLifecyclePeriodTypeData.LAST_MODIFIED_BY.rows[2]).toBe(sDeletePlaceholder);
            expect(oEnitityProjectLifecyclePeriodTypeData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEnitityProjectMonthlyLifecyclePeriodData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEnitityProjectLifecyclePeriodQuantityData.LAST_MODIFIED_BY.rows[0]).toBe(sDeletePlaceholder);
            expect(oEnitityProjectLifecyclePeriodQuantityData.LAST_MODIFIED_BY.rows[2]).toBe(sDeletePlaceholder);
            expect(oEnitityProjectLifecyclePeriodQuantityData.LAST_MODIFIED_BY.rows[4]).toBe(sDeletePlaceholder);

        });

        it("should return message if you provide all parameters", () => {
            // arrange
            oRequestBody.setUserId(sUserId)
                .setCustomerId(sCustomerId1)
                .setVendorId(sVendorId)
                .setProjectId(sProjectId);
            const oRequest = prepareRequest();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);

            // check data from the response
            expect(getResponseBody()).toEqualObject({});
        });

        it("should return a validation error if the request is malformed", () => {
            // arrange
            oRequestBody.setProjectId(sProjectId);
            const oRequest = prepareRequest();
            oRequest.body.INVALID_FIELD = "INVALID_VALUE";

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            expect(oResponseStub.getParsedBody().head.messages[0]).toEqualObject({
                code: "GENERAL_VALIDATION_ERROR",
                severity: "Error",
                details: {
                    messageTextObj: "Found invalid properties during validation of DataProtection: INVALID_FIELD.",
                },
            });
        });

        it("should return an error message if the request body is empty", () => {
            // arrange
            const oRequest = prepareRequest();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            expect(oResponseStub.getParsedBody().head.messages[0]).toEqualObject({
                code: "GENERAL_VALIDATION_ERROR",
                severity: "Error",
                details: {
                    messageTextObj: "Request body of the data protection deletion service must not be empty.",
                },
            });
        });

        it("should successfully replace the replication run user with a placeholder", () => {
             // arrange
             oRequestBody.setUserId(sTestUserID);
             const oRequest = prepareRequest();
             const sGetReplicationRunData = `select RUN_ID, USER_ID from {{replication_run}}`; 
 
             // act
             new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
             const oReplicationRun = oMockstar.execQuery(sGetReplicationRunData).columns;
 
             // assert
             expect(oResponseStub.status).toBe($.net.http.OK);
             expect(oReplicationRun.USER_ID.rows[1]).toBe(sDeletePlaceholder);
             expect(oReplicationRun.USER_ID.rows[2]).toBe(sDeletePlaceholder);
             
        });
    });

    describe("POST - Retrieve personal data", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });
        const sPostMethod = $.net.http.POST;
        const oEntityType = { CUSTOMER: "CUSTOMER", VENDOR: "VENDOR", USER: "USER", lowercaseVendor: "vendor" };
        const sDateWithTimezone = `${dDate.toDateString()} ${dDate.toTimeString()}`;

        const aExpectedVendorResult = {
            "occurrences" : [{
                TABLE_NAME: "t_item",
                COLUMN_NAME: "VENDOR_ID",
                ENTITY: "TVENDOR1",
                COUNTER: 2,
            },
            {
                COLUMN_NAME: "VENDOR_ID",
                COUNTER: 1,
                ENTITY: sVendorId,
                TABLE_NAME: "t_vendor",
            },
            {
                COLUMN_NAME: "LIFNR",
                COUNTER: 2,
                ENTITY: sVendorId,
                TABLE_NAME: "t_lfa1",
            }
        ],
            "retention" : {
                "metadata" : "VENDOR_ID;VENDOR_NAME;COUNTRY;POSTAL_CODE;REGION;CITY;STREET_NUMBER_OR_PO_BOX;_VALID_FROM;_VALID_TO;_SOURCE",
                "data" :[`TVENDOR1;V5;C1;1;A;X;11;${sDateWithTimezone};;1`]
            }
        }

        function createPostBody(sEntityId, sEntityType) {
            const sPostBody = {
                asString() {
                    return JSON.stringify({ ENTITY: sEntityId, ENTITY_TYPE: sEntityType });
                },
            };
            return sPostBody;
        }

        it("should return all the personal data for the given vendor id", () => {
            // arrange
            const oRequest = prepareRequest(sPostMethod, createPostBody(oVendorTestData.VENDOR_ID[0], oEntityType.VENDOR));
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().body).toEqualObject(aExpectedVendorResult);
        });

        it("should return all the personal data for the given user id - case-insensitive test", () => {
            // arrange
            const aExpectedResult = {
                "occurrences" : [{
                    TABLE_NAME: "t_project",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TMODER",
                    COUNTER: 4,
                },
                { 
                    TABLE_NAME: 't_folder',
                    COLUMN_NAME: 'MODIFIED_BY',
                    ENTITY: 'TMODER',
                    COUNTER: 2 }],
                "retention" : {
                    "metadata" : "",
                    "data" :[]
                }
            }
            oMockstar.clearTable("project");
            oMockstar.insertTableData("project", oProjectData);
            const oRequest = prepareRequest(sPostMethod, createPostBody(oProjectData.LAST_MODIFIED_BY[0], oEntityType.USER));
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().body).toEqualObject(aExpectedResult);
        });

        it("should return all the personal data for the given vendor id if the ENTITY_TYPE is send with a lowercase", () => {
            // arrange
            const oRequest = prepareRequest(sPostMethod, createPostBody(oVendorTestData.VENDOR_ID[0], oEntityType.lowercaseVendor));
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().body).toEqualObject(aExpectedVendorResult);
        });

        it("should return all the personal data for the given user id", () => {
            // arrange
            const oRequest = prepareRequest(sPostMethod, createPostBody(oUserTestData.USER_ID[0], oEntityType.USER));
            const aExpectedResult = {
                "occurrences" : [{
                    TABLE_NAME: "t_calculation",
                    COLUMN_NAME: "CREATED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_calculation",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_calculation_version",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_item",
                    COLUMN_NAME: "CREATED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2
                },
                {
                    TABLE_NAME: "t_item",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2
                },
                {
                    TABLE_NAME: "t_project",
                    COLUMN_NAME: "CREATED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2
                },
                {
                    TABLE_NAME: "t_project",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2
                },
                {
                    TABLE_NAME: "t_project",
                    COLUMN_NAME: "PROJECT_RESPONSIBLE",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                { 
                    TABLE_NAME: "t_project_lifecycle_configuration",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2 
                },
                { 
                    TABLE_NAME: "t_one_time_project_cost",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2 
                },
                 { 
                    TABLE_NAME: "t_one_time_product_cost",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2 
                },
                {   
                    TABLE_NAME: "t_project_total_quantities",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2 
                },
                { 
                    TABLE_NAME: "t_project_lifecycle_configuration",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2 
                },
                { 
                    TABLE_NAME: "t_project_lifecycle_period_type",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2 
                },
                { 
                    TABLE_NAME: "t_project_monthly_lifecycle_period",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 4 
                },
                { 
                    TABLE_NAME: "t_project_lifecycle_period_quantity_value",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 3 
                },
                {
                    TABLE_NAME: "t_variant",
                    COLUMN_NAME: "LAST_CALCULATED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_variant",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_variant",
                    COLUMN_NAME: "LAST_REMOVED_MARKINGS_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_variant_temporary",
                    COLUMN_NAME: "LAST_CALCULATED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_variant_temporary",
                    COLUMN_NAME: "LAST_MODIFIED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_variant_temporary",
                    COLUMN_NAME: "LAST_REMOVED_MARKINGS_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1
                },
                {
                    TABLE_NAME: "t_entity_tags",
                    COLUMN_NAME: "CREATED_BY",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2
                },
                { 
                    TABLE_NAME: "t_usergroup_user",
                    COLUMN_NAME: "USER_ID",
                    ENTITY: "TESTUSER1",
                    COUNTER: 1 
                },
                { 
                    TABLE_NAME: "t_replication_run",
                    COLUMN_NAME: "USER_ID",
                    ENTITY: "TESTUSER1",
                    COUNTER: 2 
                }],
                "retention" : {
                    "metadata" : '',
                    "data" : []
                }
            }
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().body).toEqualObject(aExpectedResult);
            expect(oResponseStub.getParsedBody().body.occurrences.length).toBe(aExpectedResult.occurrences.length);
        });

        it("should return all the personal data for the given customer id", () => {
            // arrange
            const oRequest = prepareRequest(sPostMethod, createPostBody(oCustomerTestData.CUSTOMER_ID[0], oEntityType.CUSTOMER));
            const aExpectedResult = {
                "occurrences" : [{
                TABLE_NAME: "t_calculation_version",
                COLUMN_NAME: "CUSTOMER_ID",
                ENTITY: "TCUS1",
                COUNTER: 1
            },
            {
                TABLE_NAME: "t_project",
                COLUMN_NAME: "CUSTOMER_ID",
                ENTITY: "TCUS1",
                COUNTER: 1,
            },
            {
                COLUMN_NAME: "CUSTOMER_ID",
                COUNTER: 1,
                ENTITY: sCustomerId1,
                TABLE_NAME: "t_customer",
            },
            {
                COLUMN_NAME: "KUNNR",
                COUNTER: 2,
                ENTITY: sCustomerId1,
                TABLE_NAME: "t_kna1",
            }],
            "retention" : {
                "metadata" : "CUSTOMER_ID;CUSTOMER_NAME;COUNTRY;POSTAL_CODE;REGION;CITY;STREET_NUMBER_OR_PO_BOX;_VALID_FROM;_VALID_TO;_SOURCE",
                "data" : [`TCUS1;C2;US;1234;W;Palo Alto;7890;${sDateWithTimezone};${sDateWithTimezone};2`]
            }
        };
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().body).toEqualObject(aExpectedResult);
            expect(oResponseStub.getParsedBody().body.occurrences.length).toBe(4);
        });

        it("should return an empty array when there is no personal data in the system", () => {
            // arrange
            oMockstar.clearAllTables();
            const oRequest = prepareRequest(sPostMethod, createPostBody(oVendorTestData.VENDOR_ID[0], oEntityType.VENDOR));
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().body).toEqualObject({"occurrences": [],"retention": { "metadata": "","data": []}});
        });

        it("should return an empty array when there is no personal data for the given entity id", () => {
            // arrange
            oMockstar.clearTable("usergroup_user");
            oMockstar.clearTable("calculation");
            oMockstar.clearTable("calculation_version");
            oMockstar.clearTable("item");
            oMockstar.clearTable("project");
            oMockstar.clearTable("variant");
            oMockstar.clearTable("variant_temporary");
            oMockstar.clearTable("entity_tags");
            oMockstar.clearTable("one_time_project_cost");
            oMockstar.clearTable("one_time_product_cost");
            oMockstar.clearTable("project_total_quantities");
            oMockstar.clearTable("project_lifecycle_configuration");
            oMockstar.clearTable("project_lifecycle_period_type");
            oMockstar.clearTable("project_monthly_lifecycle_period");
            oMockstar.clearTable("project_lifecycle_period_quantity_value");
            oMockstar.clearTable("replication_run");
            const oRequest = prepareRequest(sPostMethod, createPostBody(oUserTestData.USER_ID[0], oEntityType.USER));
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oResponseStub.getParsedBody().body).toEqualObject({"occurrences": [],"retention": { "metadata": "","data": []}});
        });

        it("should return GENERAL_VALIDATION_ERROR when the request contains parameters", () => {
            // arrange
            const oRequest = prepareRequest(sPostMethod, createPostBody(oVendorTestData.VENDOR_ID[1]));
            oRequest.parameters = [];
            oRequest.parameters.push({ name: "invalidParameter", value: "0" });
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("should return GENERAL_VALIDATION_ERROR when the request contains an empty body", () => {
            // arrange
            const oRequest = prepareRequest(sPostMethod, {
                asString() {
                    return JSON.stringify({});
                },
            });
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("should return GENERAL_VALIDATION_ERROR when the request contains a body that does not contain ENTITY", () => {
            // arrange
            const oRequest = prepareRequest(sPostMethod, {
                asString() {
                    return JSON.stringify({ INVALID_FIELD: "INVALID_FIELD" });
                },
            });
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("should return GENERAL_VALIDATION_ERROR when the request contains a body that has other properties except ENTITY", () => {
            // arrange
            const oRequest = prepareRequest(sPostMethod, {
                asString() {
                    return JSON.stringify({ ENTITY: oVendorTestData.VENDOR_ID[1], INVALID_FIELD: "INVALID_FIELD" });
                },
            });
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
    });
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
