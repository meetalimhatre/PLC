const oTestData = require("../../testdata/testdata").data;
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const ResponseObjectStub = require("../../testtools/responseObjectStub").ResponseObjectStub;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
const testData = require("../../testdata/testdata").data;
const _ = require("lodash");
const InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const Persistency = $.import("xs.db", "persistency").Persistency;
const DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLibrary.Dispatcher;
const oCtx = DispatcherLibrary.prepareDispatch($);
const MessageLibrary = require("../../../lib/xs/util/message");
const oMessageCode = MessageLibrary.Code;
const mockstarHelpers = require("../../testtools/mockstar_helpers");
const testHelpers = require("../../testtools/test_helpers");
const Constants = require("../../../lib/xs/util/constants");
const OpenVersionContext = Constants.CalculationVersionLockContext;
const CalculationVersionType = Constants.CalculationVersionType;
const SQLMaximumInteger = Constants.SQLMaximumInteger;

describe("xsjs.impl.variants-integrationtests", () => {
    const iIdOfVersionWithVariants = testData.iCalculationVersionId;
    const iValidVariantId = testData.iVariantId;
    const iIdOfVersionWithoutVariants = 222;
    const sExpandItemsParameter = "ITEMS";
    const iSecondIdOfVersionWithVariants = testData.iSecondVersionId;
    const iThirdVariantId = testData.iThirdVariantId;
    const sVariantDate = testData.oVariantTestData.LAST_MODIFIED_ON[0];
    const sDate = new Date().toJSON();
    let oMockstar = null;
    let oResponseStub = null;
    let oProjectTestData = null;
    let oAuthorizationTestData = null;
    let oAuthorizationPostPatchTestData = null;

    const oMultipleVariantsTestData = {
        VARIANT_ID: [11, 22, 33, 44, 55, 66, 77, 88, 99, 111],
        CALCULATION_VERSION_ID: [iIdOfVersionWithVariants, iIdOfVersionWithVariants, iIdOfVersionWithVariants,
            iIdOfVersionWithVariants, iIdOfVersionWithVariants, iIdOfVersionWithVariants, iIdOfVersionWithVariants,
            iIdOfVersionWithVariants, iIdOfVersionWithVariants, iIdOfVersionWithVariants],
        REPORT_CURRENCY_ID: ["EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "USD"],
        VARIANT_NAME: ["V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"],
        EXCHANGE_RATE_TYPE_ID: ["STANDARD", "STANDARD", "STANDARD", "STANDARD", "STANDARD", "STANDARD", "STANDARD",
            "STANDARD", "STANDARD", "STANDARD"],
        LAST_MODIFIED_ON: [sVariantDate, sVariantDate, sVariantDate, sVariantDate, sVariantDate,
            sVariantDate, sVariantDate, sVariantDate, sVariantDate, sVariantDate],
    };
    const oVariantTestData = new TestDataUtility(testData.oVariantTestData).build();
    const oItemTestData = new TestDataUtility(testData.oVariantItemTestData).build();
    const oItemTestAdditionalData = new TestDataUtility(testData.oItemTestAdditionalData).build();
    const oVariantItemTestAdditionalData = new TestDataUtility(testData.oVariantItemTestAdditionalData).build();
    const oVariantItemTemporaryTestData = new TestDataUtility(testData.oVariantItemTemporaryTestData).build();
    const oCalculationVersionItemTestData = new TestDataUtility(testData.oItemTestData).build();
    const oCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
    const oCalculationTestData = new TestDataUtility(testData.oCalculationForVariantTestData).build();

    const aVariantPostItems = (iVariantId) => {
        const fPredicatePostItems = oObject => oObject.VARIANT_ID === iVariantId;
        const aVariantItemsPost = new TestDataUtility(_.omit(oItemTestData, "QUANTITY_CALCULATED")).getObjects(fPredicatePostItems);
        _.each(aVariantItemsPost, (oVariantItem) => {
            delete oVariantItem.VARIANT_ID; //eslint-disable-line
            delete oVariantItem.QUANTITY_UOM_ID; //eslint-disable-line
            delete oVariantItem.TOTAL_QUANTITY; //eslint-disable-line
            delete oVariantItem.TOTAL_COST; //eslint-disable-line
        });
        return aVariantItemsPost;
    };

    const oVariantPostTestData = {
        VARIANT_NAME: "Variant Post 1",
        REPORT_CURRENCY_ID: "EUR",
        EXCHANGE_RATE_TYPE_ID: testData.oVariantTestData.EXCHANGE_RATE_TYPE_ID[0]
    };

    oAuthorizationTestData = {
        PROJECT_ID: ["VariantTestProject"],
        USER_ID: [$.session.getUsername()],
        PRIVILEGE: [InstancePrivileges.READ],
    };
    const oOpenCalculationVersions = {
        SESSION_ID: ["testUser", "testUser"],
        CALCULATION_VERSION_ID: [iIdOfVersionWithVariants, 2],
        IS_WRITEABLE: [1, 1],
        CONTEXT: [OpenVersionContext.VARIANT_MATRIX, OpenVersionContext.VARIANT_MATRIX],
    };

    oAuthorizationPostPatchTestData = {
        PROJECT_ID: ["VariantTestProject"],
        USER_ID: [$.session.getUsername()],
        PRIVILEGE: [InstancePrivileges.CREATE_EDIT],
    };

    oProjectTestData = {
        PROJECT_ID: ["VariantTestProject"],
        ENTITY_ID: [101],
        CONTROLLING_AREA_ID: ["CA"],
        REPORT_CURRENCY_ID: ["EUR"],
        LIFECYCLE_PERIOD_INTERVAL: [1],
        CREATED_ON: [],
        CREATED_BY: ["user"],
        LAST_MODIFIED_ON: [sDate],
        LAST_MODIFIED_BY: ["user"],
    };

    function buildUpdateRequest(oVariant, iPathVersionId, iPathVariantId) {
        const oRequest = {
            queryPath: `calculation-versions/${iPathVersionId || iIdOfVersionWithVariants}/variants/${iPathVariantId || iValidVariantId}`,
            method: $.net.http.PATCH,
            body: {
                asString() {
                    return JSON.stringify(oVariant);
                },
            },
        };
        return oRequest;
    }

    function buildPatchOrderRequest(aVariantIds, iPathVersionId) {
        const oRequest = {
            queryPath: `calculation-versions/${iPathVersionId || iIdOfVersionWithVariants}/variants`,
            method: $.net.http.PATCH,
            body: {
                asString() {
                    return JSON.stringify(aVariantIds);
                },
            },
        };
        return oRequest;
    }

    const aOmitForUpdate = ["VARIANT_ID", "CALCULATION_VERSION_ID", "TOTAL_COST", "LAST_REMOVED_MARKINGS_ON",
        "LAST_REMOVED_MARKINGS_BY", "LAST_MODIFIED_BY", "LAST_CALCULATED_ON", "LAST_CALCULATED_BY", "VARIANT_ORDER"];
    const fPredicateUpdate = oObject => oObject.VARIANT_ID === iValidVariantId;
    let oUpdateVariant = new TestDataUtility(oVariantTestData).getObjects(fPredicateUpdate)[0];
    oUpdateVariant = _.omit(oUpdateVariant, aOmitForUpdate);
    oUpdateVariant.VARIANT_NAME = "Updated variant name";
    oUpdateVariant.REPORT_CURRENCY_ID = "USD";

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            schema: "SAP_PLC",
            substituteTables: {
                variant: {
                    name: "sap.plc.db::basis.t_variant",
                    data: oVariantTestData,
                },
                variant_item: {
                    name: "sap.plc.db::basis.t_variant_item",
                    data: oItemTestData,
                },
                items: {
                    name: "sap.plc.db::basis.t_item",
                    data: oItemTestData
                },
                variant_temporary: {
                    name: "sap.plc.db::basis.t_variant_temporary",
                    data: oVariantTestData,
                },
                variant_item_temporary: {
                    name: "sap.plc.db::basis.t_variant_item_temporary",
                    data: oVariantItemTemporaryTestData,
                },
                calculationVersion: {
                    name: "sap.plc.db::basis.t_calculation_version",
                    data: oCalculationVersionTestData,
                },
                open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions",
                calculation: {
                    name: "sap.plc.db::basis.t_calculation",
                    data: oCalculationTestData,
                },
                project: {
                    name: "sap.plc.db::basis.t_project",
                    data: oProjectTestData,
                },
                authorization: {
                    name: "sap.plc.db::auth.t_auth_project",
                    data: oAuthorizationTestData,
                },
                currency: {
                    name: "sap.plc.db::basis.t_currency",
                    data: testData.mCsvFiles.currency,
                },
                uom: {
                    name: "sap.plc.db::basis.t_uom",
                    data: testData.mCsvFiles.uom,
                },
                calculation_version_item: {
                    name: "sap.plc.db::basis.t_item",
                    data: oCalculationVersionItemTestData,
                },
                session: {
                    name: "sap.plc.db::basis.t_session",
                    data: oTestData.oSessionTestData,
                },
            },
        });
    });

    beforeEach(() => {
        const oPersistency = new Persistency(jasmine.dbConnection);
        oCtx.persistency = oPersistency;
        oResponseStub = new ResponseObjectStub();
        oMockstar.initializeData();
    });

    afterEach(() => {
        oMockstar.clearAllTables();
    });

    describe("GET", () => {
        function prepareRequest(nVersionId, nVariantId, sExpandItems) {
            const sExpandItemsParam = sExpandItems === "ITEMS" ? sExpandItems : null;
            const iVariantId = nVariantId || null;
            const oRequest = {
                queryPath: `calculation-versions/${nVersionId}/variants`,
                method: $.net.http.GET,
                parameters: [],
            };
            if (iVariantId && !sExpandItemsParam) {
                oRequest.queryPath = `calculation-versions/${nVersionId}/variants/${iVariantId}`;
            }
            if (iVariantId && sExpandItemsParam) {
                oRequest.queryPath = `calculation-versions/${nVersionId}/variants/${iVariantId}`;
                oRequest.parameters.push({ name: "expand", value: sExpandItems });
            }
            if (!iVariantId && !sExpandItemsParam) {
                oRequest.queryPath = `calculation-versions/${nVersionId}/variants`;
            }
            return oRequest;
        }

        it("should return all variants for the given calculation version", () => {
            // arrange
            const oRequest = prepareRequest(iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            
            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iIdOfVersionWithVariants;
            const oExpected = new TestDataUtility(oVariantTestData).getObjects(fPredicate);
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aVariants = oResponseStub.getParsedBody().body.transactionaldata;
            expect(aVariants).toMatchData(oExpected, ["VARIANT_ID", "CALCULATION_VERSION_ID"]);
        });

        it("should return an empty array when no variants for the given calculation version available", () => {
            // arrange
            const oRequest = prepareRequest(iIdOfVersionWithoutVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.body.transactionaldata.length).toBe(0);
        });

        it("should return an empty array when variants table is empty", () => {
            // arrange
            oMockstar.clearTable("variant");
            const oRequest = prepareRequest(iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.body.transactionaldata.length).toEqual(0);
        });

        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the calculation version for that the variants are requested is not existing", () => {
            // arrange
            oMockstar.clearTable("variant");
            const oRequest = prepareRequest(333);

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
            const oRequest = prepareRequest(iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("should return the variant header for the specified calculation version and variant id", () => {
            // arrange
            const oRequest = prepareRequest(iIdOfVersionWithVariants, oVariantTestData.VARIANT_ID[0]);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iIdOfVersionWithVariants
                && oObject.VARIANT_ID === oVariantTestData.VARIANT_ID[0];
            const oExpected = new TestDataUtility(oVariantTestData).getObjects(fPredicate);
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aVariant = oResponseStub.getParsedBody().body.transactionaldata;
            expect(aVariant).toMatchData(oExpected, ["VARIANT_ID", "CALCULATION_VERSION_ID"]);
            expect(aVariant.length).toEqual(1);
        });

        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the specified variant doesn't exist for the given calculation version", () => {
            // arrange
            const oRequest = prepareRequest(iIdOfVersionWithVariants, 33);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });

        it("should return the variant header with the array of items for the specified calculation version and variant id", () => {
            // arrange
            const oRequest = prepareRequest(iIdOfVersionWithVariants, oVariantTestData.VARIANT_ID[0], sExpandItemsParameter);
            oMockstar.insertTableData("variant_item", oItemTestData);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iIdOfVersionWithVariants
                && oObject.VARIANT_ID === oVariantTestData.VARIANT_ID[0];
            const fPredicateItem = oObject => oObject.VARIANT_ID === iValidVariantId;
            const oExpected = new TestDataUtility(oVariantTestData).getObjects(fPredicate);
            const oExpectedItems = new TestDataUtility(oItemTestData).getObjects(fPredicateItem);
            oExpected[0].ITEMS = oExpectedItems;
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aVariant = oResponseStub.getParsedBody().body.transactionaldata;
            expect(aVariant[0].VARIANT_ID).toEqual(oExpected[0].VARIANT_ID);
            expect(aVariant.length).toEqual(1);
            expect(aVariant[0].ITEMS).toMatchData(oExpected[0].ITEMS, ["VARIANT_ID", "ITEM_ID"]);
            expect(Array.isArray(aVariant[0].ITEMS)).toBeTruthy();
        });

        it("should return GENERAL_ACCESS_DENIED when the user has no privilege to read the specified variant", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oRequest = prepareRequest(iIdOfVersionWithVariants, oItemTestData.VARIANT_ID[0]);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("should return GENERAL_VALIDATION_ERROR when the variant id is a string", () => {
            // arrange
            const oRequest = prepareRequest(iIdOfVersionWithVariants);
            oRequest.queryPath += "/string";

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("should return GENERAL_VALIDATION_ERROR when the expand parameter is not a string", () => {
            // arrange
            const oRequest = prepareRequest(iIdOfVersionWithVariants, iValidVariantId);
            oRequest.parameters.push({ name: "expand", value: 10 });

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("should not return the field VARIANT_ORDER", () => {
            // arrange
            const oRequest = prepareRequest(iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aVariants = oResponseStub.getParsedBody().body.transactionaldata;
            aVariants.forEach((oReturnedVariant) => {
                expect(oReturnedVariant.oReturnedVariant).toBeUndefined();
            });
        });
    });

    describe("POST - create a variant", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
            oMockstar.clearTable("authorization");
            oMockstar.insertTableData("authorization", oAuthorizationPostPatchTestData);
        });
        function preparePostRequest(oBody, nVersionId) {
            const oRequest = {
                queryPath: `calculation-versions/${nVersionId}/variants`,
                method: $.net.http.POST,
                body: {
                    asString() {
                        return JSON.stringify(oBody);
                    },
                },
            };
            return oRequest;
        }

        it("should correctly create a variant", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.CREATED);
            const aVariants = oResponseStub.getParsedBody().body.transactionaldata;
            expect(aVariants[0]).toMatchData(_.omit(oVariantData, "ITEMS"), ["VARIANT_NAME", "REPORT_CURRENCY_ID"]);
        });

        it("should set the total quantity value of the root item to the one of quantity", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = [{
                ITEM_ID: 3001,
                IS_INCLUDED: 1,
                QUANTITY: 100,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "H",
            }, {
                ITEM_ID: 3002,
                IS_INCLUDED: 1,
                QUANTITY: 2,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "PC",
            }, {
                ITEM_ID: 3003,
                IS_INCLUDED: 1,
                QUANTITY: 3,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "MIN",
            }];
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.CREATED);
            const oVariant = oResponseStub.getParsedBody().body.transactionaldata[0];
            
            const sStmt = `select * from {{variant_item}} where VARIANT_ID = ${oVariant.VARIANT_ID}`;
            const oVariantItems = oMockstar.execQuery(sStmt).columns;
            expect(parseInt(oVariantItems.TOTAL_QUANTITY.rows[0])).toEqual(oVariantData.ITEMS[0].QUANTITY);
            expect(parseInt(oVariantItems.QUANTITY.rows[0])).toEqual(oVariantData.ITEMS[0].QUANTITY);
            expect(oVariantItems.QUANTITY_UOM_ID.rows[0]).toEqual(oVariantData.ITEMS[0].QUANTITY_UOM_ID);
            expect(oVariantItems.TOTAL_QUANTITY.rows[1]).toBeNull();
            expect(parseInt(oVariantItems.QUANTITY.rows[1])).toEqual(oVariantData.ITEMS[1].QUANTITY);
            expect(oVariantItems.QUANTITY_UOM_ID.rows[1]).toEqual(oVariantData.ITEMS[1].QUANTITY_UOM_ID);
            expect(oVariantItems.TOTAL_QUANTITY.rows[2]).toBeNull();
            expect(parseInt(oVariantItems.QUANTITY.rows[2])).toEqual(oVariantData.ITEMS[2].QUANTITY);
            expect(oVariantItems.QUANTITY_UOM_ID.rows[2]).toEqual(oVariantData.ITEMS[2].QUANTITY_UOM_ID);
        });

        it("should set the total quantity value of the root item to 0 if quantity is null", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = [{
                ITEM_ID: 3001,
                IS_INCLUDED: 1,
                QUANTITY: null,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "H",
            }, {
                ITEM_ID: 3002,
                IS_INCLUDED: 1,
                QUANTITY: 2,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "PC",
            }, {
                ITEM_ID: 3003,
                IS_INCLUDED: 1,
                QUANTITY: 3,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "MIN",
            }];
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.CREATED);
            const oVariant = oResponseStub.getParsedBody().body.transactionaldata[0];
            
            const sStmt = `select * from {{variant_item}} where VARIANT_ID = ${oVariant.VARIANT_ID}`;
            const oVariantItems = oMockstar.execQuery(sStmt).columns;
            expect(parseInt(oVariantItems.TOTAL_QUANTITY.rows[0])).toEqual(0);
        });

        it("should set the total quantity value of the root item to 0 if quantity is undefined", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = [{
                ITEM_ID: 3001,
                IS_INCLUDED: 1,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "H",
            }, {
                ITEM_ID: 3002,
                IS_INCLUDED: 1,
                QUANTITY: 2,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "PC",
            }, {
                ITEM_ID: 3003,
                IS_INCLUDED: 1,
                QUANTITY: 3,
                QUANTITY_STATE:1,
                QUANTITY_UOM_ID: "MIN",
            }];
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.CREATED);
            const oVariant = oResponseStub.getParsedBody().body.transactionaldata[0];
            
            const sStmt = `select * from {{variant_item}} where VARIANT_ID = ${oVariant.VARIANT_ID}`;
            const oVariantItems = oMockstar.execQuery(sStmt).columns;
            expect(parseInt(oVariantItems.TOTAL_QUANTITY.rows[0])).toEqual(0);
        });

        it("should create a variant with a duplicate VARIANT_NAME under a different base versions", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iThirdVariantId);
            oVariantData.VARIANT_NAME = oVariantTestData.VARIANT_NAME[1];
            const oRequest = preparePostRequest(oVariantData, iSecondIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.CREATED);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata[0];
            expect(oResult.VARIANT_NAME).toBe(oVariantData.VARIANT_NAME);
            expect(oResult.CALCULATION_VERSION_ID).toBe(iSecondIdOfVersionWithVariants);
        });
        it("should assign the default value to IS_INCLUDED if an item doesn't contain it", () => {
            // arrange
            oMockstar.clearTable("variant_item");
            const iDefaultIsIncludedValue = 0;
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            delete oVariantData.ITEMS[0].IS_INCLUDED;
            const sStmt = `select * from {{variant_item}} where ITEM_ID = ${oVariantData.ITEMS[0].ITEM_ID}`;
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oVariantItems = oMockstar.execQuery(sStmt).columns;

            // assert
            expect(oResponseStub.status).toBe($.net.http.CREATED);
            expect(oVariantItems.IS_INCLUDED.rows[0]).toEqual(iDefaultIsIncludedValue);
        });
        it("should return VARIANT_NAME_NOT_UNIQUE_ERROR if VARIANT_NAME already exists for the base version", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.VARIANT_NAME = oVariantTestData.VARIANT_NAME[1];
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.VARIANT_NAME_NOT_UNIQUE_ERROR.code);
        });
        it("should return GENERAL_ACCESS_DENIED when the user has no instance privilege to create the variant", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
        it("should return GENERAL_VALIDATION_ERROR if the body contains invalid fields", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.INVALID_FIELD = "INVALID_FIELD";
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR if the VARIANT has a mandatory field missing", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            const oVariantDataWithMissingField = _.omit(oVariantData, ["REPORT_CURRENCY_ID"]);
            oVariantDataWithMissingField.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantDataWithMissingField, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR the VARIANT_ID is present in the body", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.VARIANT_ID = 10;

            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR the CALCULATION_VERSION_ID is present in the body", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.CALCULATION_VERSION_ID = 10;

            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR if the variant is sent without the ITEMS", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseMessages.details.messageTextObj).toBe("Mandatory field missing");
        });
        it("should return GENERAL_VALIDATION_ERROR if an ITEM of the VARIANT has a mandatory field missing", () => {
            // arrange;
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            const aVariantItems = aVariantPostItems(iValidVariantId);
            _.each(aVariantItems, (oVariantItem) => {
                delete oVariantItem.ITEM_ID; //eslint-disable-line
            });
            oVariantData.ITEMS = aVariantItems;
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should throw GENERAL_VALIDATION_ERROR when there are more items on the request than in the base version", () => {
            // arrange
            oMockstar.clearTable("calculation_version_item");
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should throw GENERAL_VALIDATION_ERROR when an item from the request is not found in the base version", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.ITEMS[0].ITEM_ID = 50;
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR if the quantity state of root item is invalid", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.ITEMS[0].QUANTITY_STATE = 2;//invalid QUANTITY_STATE_VALUE for root item
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR if the quantity state of an item is invalid", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.ITEMS[1].QUANTITY_STATE = 999;//invalid QUANTITY_STATE_VALUE
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is locked by another user in the same context", () => {
            // arrange
            oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
        it("should update the base version type to variant base when the created variant is the first variant for the calculation version id", () => {
            // arrange
            // change the type to "base" for a existing calculation version
            oMockstar.clearTable("calculationVersion");
            const oCalculationVersionsWithNormalType = new TestDataUtility(oCalculationVersionTestData).build();
            oCalculationVersionsWithNormalType.CALCULATION_VERSION_TYPE[0] = Constants.CalculationVersionType.Base;
            oMockstar.insertTableData("calculationVersion", oCalculationVersionsWithNormalType);

            const sSelect = `select * from {{calculationVersion}} where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants}`;
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            const oCalculationVersionBefore = oMockstar.execQuery(sSelect).columns;
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oCalculationVersionAfter = oMockstar.execQuery(sSelect).columns;

            // assert
            expect(oCalculationVersionBefore.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.Base);
            expect(oCalculationVersionAfter.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.VariantBase);
        });
        it("should not update the base version type to variant base if an GENERAL_VALIDATION_ERROR is thrown and the variant is not created", () => {
            // arrange
            oMockstar.clearTable("calculationVersion");
            const oCalculationVersionsWithNormalType = new TestDataUtility(oCalculationVersionTestData).build();
            oCalculationVersionsWithNormalType.CALCULATION_VERSION_TYPE[0] = Constants.CalculationVersionType.Base;
            oMockstar.insertTableData("calculationVersion", oCalculationVersionsWithNormalType);

            const sSelect = `select * from {{calculationVersion}} where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants}`;
            // arrange
            // an invalid ITEM_ID is introduced in order to get a GENERAL_VALIDATION_ERROR and the new variant is not inserted
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.ITEMS[0].ITEM_ID = 50;
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            const oCalculationVersionBefore = oMockstar.execQuery(sSelect).columns;
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oCalculationVersionAfter = oMockstar.execQuery(sSelect).columns;

            // assert
            expect(oCalculationVersionBefore.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.Base);
            expect(oCalculationVersionAfter.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.Base);
        });
        it("should throw GENERAL_ENTITY_NOT_FOUND_ERROR if the given calculation version does not exist", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, 123456);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is a lifecycle version", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.CALCULATION_VERSION_TYPE[0] = CalculationVersionType.Lifecycle;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is frozen", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.IS_FROZEN[0] = 1;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
        it("should set the field VARIANT_ORDER to max database integer when first creating it", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.CREATED);
            const iNewVariantId = oResponseStub.getParsedBody().body.transactionaldata[0].VARIANT_ID;
            const sGetVariantOrderStmt = `select VARIANT_ORDER from {{variant_temporary}} where VARIANT_ID = ${iNewVariantId}`;
            const iVariantOrder = oMockstar.execQuery(sGetVariantOrderStmt).columns.VARIANT_ORDER.rows[0];
            expect(iVariantOrder).toBe(SQLMaximumInteger);
        });
        it("should return GENERAL_VALIDATION_ERROR when VARIANT_ORDER is present in the body", () => {
            // arrange
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantData.VARIANT_ORDER = 10;

            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should create a variant with the correct LAST_ACCEPTED* and LAST_MODIFIED* timestamp and user id", () => {
            // arrange
            const dStart = new Date();
            const sUserId = $.session.getUsername();
            const oVariantData = new TestDataUtility(oVariantPostTestData).build();
            oVariantData.ITEMS = aVariantPostItems(iValidVariantId);
            const oRequest = preparePostRequest(oVariantData, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.CREATED);
            const aVariants = oResponseStub.getParsedBody().body.transactionaldata;
            const dLastModified = new Date(aVariants[0].LAST_MODIFIED_ON);
            const dLastAccepted = new Date(aVariants[0].LAST_REMOVED_MARKINGS_ON);
            expect(aVariants[0].LAST_MODIFIED_BY).toEqual(sUserId);
            expect(aVariants[0].LAST_REMOVED_MARKINGS_BY).toEqual(sUserId);
            const dEnd = new Date();
            testHelpers.checkDateIsBetween(dLastModified, dStart, dEnd);
            testHelpers.checkDateIsBetween(dLastAccepted, dStart, dEnd);
        });
        it("should return GENERAL_VALIDATION_ERROR when TOTAL_QUANTITY is present in the ITEMS body", () => {
            // arrange
            const oVariantBodyTestData = {
                VARIANT_NAME: "Variant Post 1",
                IS_SELECTED: 0,
                REPORT_CURRENCY_ID: "EUR",
                EXCHANGE_RATE_TYPE_ID: testData.oVariantTestData.EXCHANGE_RATE_TYPE_ID[0]
            };
            oVariantBodyTestData.ITEMS = aVariantPostItems(iValidVariantId);
            oVariantBodyTestData.ITEMS[0].TOTAL_QUANTITY = 100;

            const oRequest = preparePostRequest(oVariantBodyTestData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseMessages.details.messageTextObj).toContain("TOTAL_QUANTITY");
        });
    });

    describe("PATCH - update variant header", () => {
        beforeEach(() => {
            oMockstar.clearTable("authorization");
            oMockstar.insertTableData("authorization", oAuthorizationPostPatchTestData);
        });

        it("Should throw GENERAL_ENTITY_NOT_FOUND_ERROR when VARIANT_ID requested for update is not found", () => {
            // arrange
            const oNotFoundVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oNotFoundVariant, iIdOfVersionWithVariants, 12345);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            const sError = oResponseStub.getParsedBody().head.messages[0].code;
            expect(sError).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
        });

        it("Should throw GENERAL_ENTITY_NOT_FOUND_ERROR when VARIANT_ID requested for update is not found in the given calculation version", () => {
            // arrange
            const oNotFoundVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oNotFoundVariant, 12345, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            const sError = oResponseStub.getParsedBody().head.messages[0].code;
            expect(sError).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
        });

        it("Should throw VARIANT_NAME_NOT_UNIQUE_ERROR when VARIANT_NAME already exists for the base version", () => {
            // arrange
            const oDuplicatedNameVariant = new TestDataUtility(oUpdateVariant).build();
            oDuplicatedNameVariant.VARIANT_NAME = oVariantTestData.VARIANT_NAME[1];

            const oRequest = buildUpdateRequest(oDuplicatedNameVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const sError = oResponseStub.getParsedBody().head.messages[0].code;
            expect(sError).toBe(MessageLibrary.Code.VARIANT_NAME_NOT_UNIQUE_ERROR.code);
        });

        it("Should allow duplicated names when variant_name does not exist in the same base version", () => {
            // arrange
            const oAllowedDuplicatedNameVariant = new TestDataUtility(oUpdateVariant).build();
            oAllowedDuplicatedNameVariant.VARIANT_NAME = oVariantTestData.VARIANT_NAME[0];

            const oRequest = buildUpdateRequest(oAllowedDuplicatedNameVariant, iSecondIdOfVersionWithVariants, 33);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult[0].VARIANT_ID).toBe(33);
            expect(oResult[0].VARIANT_NAME).toBe(oAllowedDuplicatedNameVariant.VARIANT_NAME);
            expect(oResult[0].CALCULATION_VERSION_ID).toBe(iSecondIdOfVersionWithVariants);
            expect(oResult[0].REPORT_CURRENCY_ID).toBe(oAllowedDuplicatedNameVariant.REPORT_CURRENCY_ID);
        });

        it("Should correctly update a variant", () => {
            // arrange
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            oCorrectVariant.REPORT_CURRENCY_ID = "USD";
            oCorrectVariant.VARIANT_NAME = "Variant X";
            oCorrectVariant.COMMENT = "Variant 11 Comment Changed";
            oCorrectVariant.EXCHANGE_RATE_TYPE_ID = "STANDARD";
            oCorrectVariant.SALES_PRICE = "666.0000000";
            oCorrectVariant.SALES_PRICE_CURRENCY_ID = "USD";
            oCorrectVariant.IS_SELECTED = 1;
            // oCorrectVariant.LAST_MODIFIED_ON = sVariantDate;

            const oRequest = buildUpdateRequest(oCorrectVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata[0];
            expect(oResult.LAST_MODIFIED_BY).toBe($.session.getUsername());
            expect(oResult.REPORT_CURRENCY_ID).toBe(oCorrectVariant.REPORT_CURRENCY_ID);
            expect(oResult.VARIANT_NAME).toBe(oCorrectVariant.VARIANT_NAME);
            expect(oResult.COMMENT).toBe(oCorrectVariant.COMMENT);
            expect(oResult.EXCHANGE_RATE_TYPE_ID).toBe(oCorrectVariant.EXCHANGE_RATE_TYPE_ID);
            expect(oResult.SALES_PRICE).toBe(oCorrectVariant.SALES_PRICE.toString());
            expect(oResult.SALES_PRICE_CURRENCY_ID).toBe(oCorrectVariant.SALES_PRICE_CURRENCY_ID);
            expect(oResult.IS_SELECTED).toBe(oCorrectVariant.IS_SELECTED);
        });

        it("Should correctly update last modified at", () => {
            // arrange
            const dStart = new Date();
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oCorrectVariant);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            const dEnd = new Date();
            const dLastModified = new Date(Date.parse(oResult[0].LAST_MODIFIED_ON));
            testHelpers.checkDateIsBetween(dLastModified, dStart, dEnd);
        });

        it("Should correctly update LAST_REMOVED_MARKINGS_ON if CHANGES_ACCEPTED is send 1 (true)", () => {
            // arrange
            const dStart = new Date();
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            oCorrectVariant.CHANGES_ACCEPTED = 1;
            const oRequest = buildUpdateRequest(oCorrectVariant);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            const dEnd = new Date();
            const dLastModified = new Date(Date.parse(oResult[0].LAST_MODIFIED_ON));
            const dLastAccepted = new Date(Date.parse(oResult[0].LAST_REMOVED_MARKINGS_ON));
            const sUserModified = oResult[0].LAST_MODIFIED_BY;
            const sUserAccepted = oResult[0].LAST_REMOVED_MARKINGS_BY;
            expect(dLastModified.getTime()).toBe(dLastAccepted.getTime());
            expect(sUserAccepted).toBe(testData.sTestUser);
            expect(sUserModified).toBe(sUserAccepted);
            testHelpers.checkDateIsBetween(dLastModified, dStart, dEnd);
        });

        it("Should correctly update LAST_REMOVED_MARKINGS_ON if CHANGES_ACCEPTED is send 0 (false)", () => {
            // arrange
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            oCorrectVariant.CHANGES_ACCEPTED = 0;
            const oRequest = buildUpdateRequest(oCorrectVariant);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            const dLastModified = new Date(Date.parse(oResult[0].LAST_MODIFIED_ON));
            const dLastAccepted = new Date(Date.parse(oResult[0].LAST_REMOVED_MARKINGS_ON));
            expect(dLastModified.getTime()).not.toBe(dLastAccepted.getTime());
            expect(dLastAccepted.toJSON()).toBe(testData.oVariantTestData.LAST_REMOVED_MARKINGS_ON[0]);
        });

        it("Should correctly update LAST_REMOVED_MARKINGS_ON if CHANGES_ACCEPTED is undefined", () => {
            // arrange
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            oCorrectVariant.CHANGES_ACCEPTED = undefined; //eslint-disable-line
            const oRequest = buildUpdateRequest(oCorrectVariant);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            const dLastModified = new Date(Date.parse(oResult[0].LAST_MODIFIED_ON));
            const dLastAccepted = new Date(Date.parse(oResult[0].LAST_REMOVED_MARKINGS_ON));
            expect(dLastModified.getTime()).not.toBe(dLastAccepted.getTime());
            expect(dLastAccepted.toJSON()).toBe(testData.oVariantTestData.LAST_REMOVED_MARKINGS_ON[0]);
        });

        it("Should correctly update LAST_REMOVED_MARKINGS_ON if CHANGES_ACCEPTED is null", () => {
            // arrange
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            oCorrectVariant.CHANGES_ACCEPTED = null;
            const oRequest = buildUpdateRequest(oCorrectVariant);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            const dLastModified = new Date(Date.parse(oResult[0].LAST_MODIFIED_ON));
            const dLastAccepted = new Date(Date.parse(oResult[0].LAST_REMOVED_MARKINGS_ON));
            expect(dLastModified.getTime()).not.toBe(dLastAccepted.getTime());
            expect(dLastAccepted.toJSON()).toBe(testData.oVariantTestData.LAST_REMOVED_MARKINGS_ON[0]);
        });

        it("Should correctly update some variant attributes", () => {
            // arrange
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oCorrectVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult[0].VARIANT_ID).toBe(11);
            expect(oResult[0].VARIANT_NAME).toBe(oCorrectVariant.VARIANT_NAME);
            expect(oResult[0].CALCULATION_VERSION_ID).toBe(iIdOfVersionWithVariants);
            expect(oResult[0].REPORT_CURRENCY_ID).toBe(oCorrectVariant.REPORT_CURRENCY_ID);
        });

        it("Should correctly update a variant when the fields that are usually mandatory in metadata are send in the request", () => {
            // arrange
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            oCorrectVariant.VARIANT_NAME = "VARIANT_NAME";
            oCorrectVariant.REPORT_CURRENCY_ID = "EUR";
            oCorrectVariant.EXCHANGE_RATE_TYPE_ID = "STANDARD";
            const oRequest = buildUpdateRequest(oCorrectVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult[0].VARIANT_ID).toBe(testData.oVariantTestData.VARIANT_ID[0]);
            expect(oResult[0].VARIANT_NAME).toBe(oCorrectVariant.VARIANT_NAME);
            expect(oResult[0].CALCULATION_VERSION_ID).toBe(iIdOfVersionWithVariants);
            expect(oResult[0].REPORT_CURRENCY_ID).toBe(oCorrectVariant.REPORT_CURRENCY_ID);
            expect(oResult[0].EXCHANGE_RATE_TYPE_ID).toBe(oCorrectVariant.EXCHANGE_RATE_TYPE_ID);
        });

        it("Should correctly update a variant when the fields that are usually mandatory in metadata are not send in the request", () => {
            // arrange
            const aFieldsNotMandatoryForPatch = [
                "VARIANT_NAME",
                "REPORT_CURRENCY_ID",
                "EXCHANGE_RATE_TYPE_ID",
            ];
            const oCorrectVariant = _.omit(new TestDataUtility(oUpdateVariant).build(), aFieldsNotMandatoryForPatch);
            const oRequest = buildUpdateRequest(oCorrectVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult[0].VARIANT_ID).toBe(testData.oVariantTestData.VARIANT_ID[0]);
            expect(oResult[0].CALCULATION_VERSION_ID).toBe(iIdOfVersionWithVariants);
            expect(oResult[0].REPORT_CURRENCY_ID).toBe(testData.oVariantTestData.REPORT_CURRENCY_ID[0]);
            expect(oResult[0].EXCHANGE_RATE_TYPE_ID).toBe(testData.oVariantTestData.EXCHANGE_RATE_TYPE_ID[0]);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when trying to update an invalid field", () => {
            // arrange
            const oExtraFieldVariant = new TestDataUtility(oUpdateVariant).build();
            oExtraFieldVariant.INVALID_COLUMN = "ABC";

            const oRequest = buildUpdateRequest(oExtraFieldVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("INVALID_COLUMN")).not.toBe(-1);
            expect(sError.details.messageTextObj.indexOf("Not able to find property")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when path VARIANT_ID is not a positive integer", () => {
            // arrange
            const oRequest = buildUpdateRequest(oUpdateVariant, iIdOfVersionWithVariants, -1);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("positive integer")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when path CALCULATION_VERSION_ID is not a positive integer", () => {
            // arrange
            const oRequest = buildUpdateRequest(oUpdateVariant, -1, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("positive integer")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when sending VARIANT_ID in the body", () => {
            // arrange
            const oExtraFieldVariant = new TestDataUtility(oUpdateVariant).build();
            oExtraFieldVariant.VARIANT_ID = 1;

            const oRequest = buildUpdateRequest(oExtraFieldVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("VARIANT_ID")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when sending CALCULATION_VERSION_ID in the body", () => {
            // arrange
            const oExtraFieldVariant = new TestDataUtility(oUpdateVariant).build();
            oExtraFieldVariant.CALCULATION_VERSION_ID = 1;

            const oRequest = buildUpdateRequest(oExtraFieldVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("CALCULATION_VERSION_ID")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when sending null REPORT_CURRENCY_ID", () => {
            // arrange
            const oExtraFieldVariant = new TestDataUtility(oUpdateVariant).build();
            oExtraFieldVariant.REPORT_CURRENCY_ID = null;

            const oRequest = buildUpdateRequest(oExtraFieldVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("REPORT_CURRENCY_ID")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when sending null VARIANT_NAME", () => {
            // arrange
            const oExtraFieldVariant = new TestDataUtility(oUpdateVariant).build();
            oExtraFieldVariant.VARIANT_NAME = null;

            const oRequest = buildUpdateRequest(oExtraFieldVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
        });


        it("Should throw GENERAL_ACCES_DENIED if user does not have privileges", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oCorrectVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("Should throw GENERAL_VALIDATION_ERROR when not sending LAST MODIFIED AT", () => {
            // arrange
            const oRequest = buildUpdateRequest({ VARIANT_NAME: "Test variant" });

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("LAST_MODIFIED_ON")).not.toBe(-1);
        });

        it("Should throw GENERAL_ENTITY_NOT_CURRENT_ERROR when sending an incorrect LAST_MODIFIED_ON", () => {
            // arrange
            const oInvalidDateVariant = new TestDataUtility(oUpdateVariant).build();
            oInvalidDateVariant.LAST_MODIFIED_ON = new Date();
            const oRequest = buildUpdateRequest(oInvalidDateVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_ENTITY_NOT_CURRENT_ERROR");
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is locked by another user in the same context", () => {
            // arrange
            oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oCorrectVariant);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is a lifecycle version", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.CALCULATION_VERSION_TYPE[0] = CalculationVersionType.Lifecycle;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oCorrectVariant);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is frozen", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.IS_FROZEN[0] = 1;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oCorrectVariant);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when the request body contains VARIANT_ORDER field", () => {
            // arrange
            const oExtraFieldVariant = new TestDataUtility(oUpdateVariant).build();
            oExtraFieldVariant.VARIANT_ORDER = 0;

            const oRequest = buildUpdateRequest(oExtraFieldVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("VARIANT_ORDER")).not.toBe(-1);
            expect(sError.details.messageTextObj.indexOf("Not able to find property")).not.toBe(-1);
        });

        it("Should not update VARIANT_ORDER when updating a variant", () => {
            // arrange
            const oCorrectVariant = new TestDataUtility(oUpdateVariant).build();
            const oRequest = buildUpdateRequest(oCorrectVariant);
            const sGetVariantOrderStmt = `select VARIANT_ORDER from {{variant}} where VARIANT_ID = ${iValidVariantId}`;
            const iVariantOrderBefore = oMockstar.execQuery(sGetVariantOrderStmt).columns.VARIANT_ORDER.rows[0];
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            const iVariantOrderAfter = oMockstar.execQuery(sGetVariantOrderStmt).columns.VARIANT_ORDER.rows[0];
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(iVariantOrderBefore).toBe(iVariantOrderAfter);
        });
    });

    describe("PATCH - update variant header and upsert its items", () => {
        beforeEach(() => {
            oMockstar.clearTable("authorization");
            oMockstar.insertTableData("authorization", oAuthorizationPostPatchTestData);
        });

        const oItem = [{
            ITEM_ID: oItemTestData.ITEM_ID[0],
            IS_INCLUDED: 1,
            QUANTITY_STATE: 1,
            QUANTITY: '100.0000000',
        },
        {
            ITEM_ID: 2,
            QUANTITY_STATE:1,
            QUANTITY: '333.0000000',
        }];

        const oVariantWithItem = new TestDataUtility(oUpdateVariant, iIdOfVersionWithVariants, iValidVariantId).build();
        oVariantWithItem.ITEMS = oItem;

        it("Should correctly update a variant and its items", () => {
            // arrange
            let oAdditionalItem = {
                VARIANT_ID: [iValidVariantId],
                ITEM_ID: [2],
                IS_INCLUDED: [1],
                QUANTITY_STATE:[0],
                QUANTITY: ['100.0000000'],
            };
            oMockstar.insertTableData("variant_item", oAdditionalItem);
            oMockstar.insertTableData("items", oItemTestAdditionalData);
            oAdditionalItem.CALCULATION_VERSION_ID = [iIdOfVersionWithVariants];
            oMockstar.insertTableData("variant_item_temporary", oAdditionalItem);
            const sSelect = `select * from {{variant_item}} where ITEM_ID in (${oVariantWithItem.ITEMS[0].ITEM_ID}, 
                ${oVariantWithItem.ITEMS[1].ITEM_ID}) and VARIANT_ID = ${iValidVariantId} order by ITEM_ID desc`;
            let aBeforeItems = oMockstar.execQuery(sSelect);
            aBeforeItems = mockstarHelpers.convertResultToArray(aBeforeItems);
            oVariantWithItem.ITEMS[1].QUANTITY_STATE = 2;

            const oRequest = buildUpdateRequest(oVariantWithItem);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult[0].VARIANT_ID).toBe(iValidVariantId);
            expect(oResult[0].VARIANT_NAME).toBe(oVariantWithItem.VARIANT_NAME);
            expect(oResult[0].CALCULATION_VERSION_ID).toBe(iIdOfVersionWithVariants);
            expect(oResult[0].REPORT_CURRENCY_ID).toBe(oVariantWithItem.REPORT_CURRENCY_ID);

            let aAfterItems = oMockstar.execQuery(sSelect);
            aAfterItems = mockstarHelpers.convertResultToArray(aAfterItems);

            // check that fields that were not sent in the request, did not change
            expect(aAfterItems.VARIANT_ID).toMatch(iValidVariantId.toString());
            expect(aAfterItems.ITEM_ID).toMatch(aBeforeItems.ITEM_ID.toString());
            expect(aAfterItems.IS_INCLUDED).toMatch(aBeforeItems.IS_INCLUDED.toString());
            expect(aAfterItems.TOTAL_QUANTITY[0]).toBe(oVariantWithItem.ITEMS[0].QUANTITY);
            expect(aAfterItems.TOTAL_QUANTITY[1]).toBe(aBeforeItems.TOTAL_QUANTITY[1]);
            // check that updated fields are correct
            expect(aAfterItems.IS_INCLUDED[0]).toBe(oVariantWithItem.ITEMS[0].IS_INCLUDED);
            expect(aAfterItems.QUANTITY[0]).toBe(oVariantWithItem.ITEMS[0].QUANTITY.toString());
            expect(aAfterItems.QUANTITY[1]).toBe(oVariantWithItem.ITEMS[1].QUANTITY.toString());
            expect(aAfterItems.QUANTITY_STATE[1]).toBe(oVariantWithItem.ITEMS[1].QUANTITY_STATE);
        });

        it("should set the total quantity value of the root item to the one of quantity", () => {
            // arrange
            const oVariantWithItems = new TestDataUtility(oUpdateVariant, iIdOfVersionWithVariants, iValidVariantId).build();
            const aItems = [{
                ITEM_ID: 3001,
                IS_INCLUDED: 1,
                QUANTITY_STATE: 1,
                QUANTITY: '123.0000000',
            },
            {
                ITEM_ID: 3002,
                QUANTITY_STATE: 1,
                QUANTITY: '333.0000000',
            }];
            oVariantWithItems.ITEMS = aItems;
            const sSelect = `select * from {{variant_item}} where ITEM_ID in (3001, 3002) and VARIANT_ID = ${iValidVariantId}`;
            let aBeforeItems = oMockstar.execQuery(sSelect);
            aBeforeItems = mockstarHelpers.convertResultToArray(aBeforeItems);

            const oRequest = buildUpdateRequest(oVariantWithItems);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            let aAfterItems = oMockstar.execQuery(sSelect);
            aAfterItems = mockstarHelpers.convertResultToArray(aAfterItems);
            expect(aAfterItems.ITEM_ID).toMatch(aBeforeItems.ITEM_ID.toString());
            expect(aAfterItems.TOTAL_QUANTITY[0]).toBe(aItems[0].QUANTITY);
            expect(aAfterItems.QUANTITY[0]).toBe(aItems[0].QUANTITY);
            expect(aAfterItems.QUANTITY[1]).toBe(oVariantWithItem.ITEMS[1].QUANTITY.toString());
            expect(aAfterItems.TOTAL_QUANTITY[1]).toBe(aBeforeItems.TOTAL_QUANTITY[1]);
        });

        it("should not modify total quantity value of the root item if the quantity is not updated", () => {
            // arrange
            const oVariantWithItems = new TestDataUtility(oUpdateVariant, iIdOfVersionWithVariants, iValidVariantId).build();
            const aItems = [{
                ITEM_ID: 3001,
                QUANTITY_STATE: 1,
                IS_INCLUDED: 1,
            }];
            oVariantWithItems.ITEMS = aItems;
            const sSelect = `select * from {{variant_item}} where ITEM_ID in (3001, 3002) and VARIANT_ID = ${iValidVariantId} order by ITEM_ID`;
            let aBeforeItems = oMockstar.execQuery(sSelect);
            aBeforeItems = mockstarHelpers.convertResultToArray(aBeforeItems);

            const oRequest = buildUpdateRequest(oVariantWithItems);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            let aAfterItems = oMockstar.execQuery(sSelect);
            aAfterItems = mockstarHelpers.convertResultToArray(aAfterItems);
            expect(aAfterItems.ITEM_ID).toMatch(aBeforeItems.ITEM_ID.toString());
            expect(aAfterItems.TOTAL_QUANTITY[0]).toBe(aBeforeItems.TOTAL_QUANTITY[0]);
            expect(aAfterItems.QUANTITY[0]).toBe(aBeforeItems.QUANTITY[0]);
        });

        it("should include parent of chnaged item if it is not included", () => {

            oMockstar.insertTableData("variant_item", oVariantItemTestAdditionalData);
            oMockstar.insertTableData("items", oItemTestAdditionalData);

            const oVariantWithItems = new TestDataUtility(oUpdateVariant, iIdOfVersionWithVariants, iValidVariantId).build();
            const aItems = [{
                ITEM_ID: 80,
                QUANTITY_STATE: 1,
                IS_INCLUDED: 1,
            }];
            oVariantWithItems.ITEMS = aItems;

            const sSelect = `select * from {{variant_item}} where ITEM_ID = 78 and VARIANT_ID = ${iValidVariantId} order by ITEM_ID`;
            let aBeforeItems = oMockstar.execQuery(sSelect);
            aBeforeItems = mockstarHelpers.convertResultToArray(aBeforeItems);

            const oRequest = buildUpdateRequest(oVariantWithItems);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            let aAfterItems = oMockstar.execQuery(sSelect);
            aAfterItems = mockstarHelpers.convertResultToArray(aAfterItems);
            expect(aBeforeItems.IS_INCLUDED[0]).toBe(0);
            expect(aAfterItems.IS_INCLUDED[0]).toBe(1);
        });

        it("Should correctly update a variant header if ITEMS is empty array", () => {
            // arrange
            const oVariantHeaderOnly = new TestDataUtility(oVariantWithItem).build();
            oVariantHeaderOnly.ITEMS = [];
            const oRequest = buildUpdateRequest(oVariantHeaderOnly);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult[0].VARIANT_ID).toBe(iValidVariantId);
            expect(oResult[0].VARIANT_NAME).toBe(oVariantWithItem.VARIANT_NAME);
            expect(oResult[0].CALCULATION_VERSION_ID).toBe(iIdOfVersionWithVariants);
            expect(oResult[0].REPORT_CURRENCY_ID).toBe(oVariantWithItem.REPORT_CURRENCY_ID);
        });

        it("Should throw GENERAL_VALIDATION_ERROR if QUANTITY_STATE has an invalid value", () => {
            // arrange
            const oVariant = new TestDataUtility(oVariantWithItem).build();
            oVariant.ITEMS[0].QUANTITY_STATE = 99;
            const oRequest = buildUpdateRequest(oVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("Quantity state value")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when a mandatory field (ITEM_ID)for variant item is missing", () => {
            // arrange
            const oItemMissingMangatoryFields = new TestDataUtility(oUpdateVariant).build();
            oItemMissingMangatoryFields.ITEMS = [_.omit(oItem[0], "ITEM_ID")];
            const oRequest = buildUpdateRequest(oItemMissingMangatoryFields);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("ITEM_ID")).not.toBe(-1);
            expect(sError.details.messageTextObj.indexOf("is missing")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when a mandatory field (QUANTITY_STATE) for variant item is missing", () => {
            // arrange
            const oItemMissingMangatoryFields = new TestDataUtility(oUpdateVariant).build();
            oItemMissingMangatoryFields.ITEMS = [_.omit(oItem[0], "QUANTITY_STATE")];
            const oRequest = buildUpdateRequest(oItemMissingMangatoryFields);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("QUANTITY_STATE")).not.toBe(-1);
            expect(sError.details.messageTextObj.indexOf("is missing")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when trying to update an invalid field for variant item", () => {
            // arrange
            const oInvalidVariantItem = new TestDataUtility(oVariantWithItem).build();
            oInvalidVariantItem.ITEMS[0].INVALID_FIELD = "ABC";
            const oRequest = buildUpdateRequest(oInvalidVariantItem);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("INVALID_FIELD")).not.toBe(-1);
            expect(sError.details.messageTextObj.indexOf("Not able to find property")).not.toBe(-1);
        });
        // TODO: will be merged with the 3.0 bug fix; case failed because oNewItem.QUANTITY is undefined which should be oNewItem.ITEMS[0].QUANTITY, test owner will fix this; 
        xit("Should allow inserting new items in t_variant_item", () => {
            // arrange
            const oNewItem = {
                LAST_MODIFIED_ON: sVariantDate,
                ITEMS: [{
                    ITEM_ID: 2,
                    IS_INCLUDED: 1,
                    QUANTITY_STATE: 1,
                    QUANTITY: 100,
                }],
            };
            const sSelect = `select * from {{variant_item}} where ITEM_ID = ${oNewItem.ITEMS[0].ITEM_ID} and VARIANT_ID = ${iValidVariantId}`;
            const oRequest = buildUpdateRequest(oNewItem);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult[0].VARIANT_ID).toBe(iValidVariantId);
            let aAfterItems = oMockstar.execQuery(sSelect);
            aAfterItems = mockstarHelpers.convertResultToArray(aAfterItems);

            expect(aAfterItems.VARIANT_ID).toMatch(iValidVariantId.toString());
            expect(aAfterItems.ITEM_ID).toMatch(oNewItem.ITEM_ID);
            expect(aAfterItems.IS_INCLUDED).toMatch(oNewItem.IS_INCLUDED);
            expect(aAfterItems.QUANTITY).toMatch(oNewItem.QUANTITY);
        });

        it("Should correctly insert new items for a variant", () => {
            // arrange
            const oVariant = {
                LAST_MODIFIED_ON: sVariantDate,
                EXCHANGE_RATE_TYPE_ID: testData.oVariantTestData.EXCHANGE_RATE_TYPE_ID[0],
                ITEMS: [{
                    ITEM_ID: 666,
                    IS_INCLUDED: 1,
                    QUANTITY_STATE: 1,
                    QUANTITY: "100.0000000",
                }, {
                    ITEM_ID: 777,
                    QUANTITY_STATE: 1,
                    IS_INCLUDED: 1,
                }, {
                    ITEM_ID: 888,
                    QUANTITY_STATE: 1,
                }],
            };
            const sSelect = `select * from {{variant_item}} where ITEM_ID IN (666, 777, 888) and VARIANT_ID = ${iValidVariantId}`;
            let aBeforeItem = oMockstar.execQuery(sSelect);
            aBeforeItem = mockstarHelpers.convertResultToArray(aBeforeItem);

            const oRequest = buildUpdateRequest(oVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            let aAfterItems = oMockstar.execQuery(sSelect);
            aAfterItems = mockstarHelpers.convertResultToArray(aAfterItems);
            expect(aAfterItems.ITEM_ID.length).toBe(aBeforeItem.ITEM_ID.length + 3);
            expect(aAfterItems.IS_INCLUDED[0]).toBe(oVariant.ITEMS[0].IS_INCLUDED);
            expect(aAfterItems.QUANTITY[0]).toBe(oVariant.ITEMS[0].QUANTITY.toString());
            expect(aAfterItems.IS_INCLUDED[1]).toBe(oVariant.ITEMS[1].IS_INCLUDED);

            // check not sent properties
            expect(aAfterItems.QUANTITY[3]).not.toBeDefined();
            expect(aAfterItems.QUANTITY_UOM_ID[3]).not.toBeDefined();
        });

        it("Should delete variant items that don't have a correspondent in the base version", () => {
            // arrange
            oMockstar.clearTable("calculationVersion");
            const oCalculationVersionUpdated = new TestDataUtility(oCalculationVersionTestData).build();
            oCalculationVersionUpdated.LAST_MODIFIED_ON[0] = new Date().toJSON();
            oMockstar.insertTableData("calculationVersion", oCalculationVersionUpdated);

            oMockstar.clearTable("calculation_version_item");
            oMockstar.insertTableData("calculation_version_item", oCalculationVersionItemTestData);

            oMockstar.insertTableData("variant_item", {
                VARIANT_ID: testData.oVariantTestData.VARIANT_ID[0],
                ITEM_ID: 1,
                IS_INCLUDED: 1,
                QUANTITY: 100,
            });

            const oVariant = {
                LAST_MODIFIED_ON: sVariantDate,
                EXCHANGE_RATE_TYPE_ID: testData.oVariantTestData.EXCHANGE_RATE_TYPE_ID[0],
                ITEMS: [{
                    ITEM_ID: 666,
                    IS_INCLUDED: 1,
                    QUANTITY_STATE: 1,
                    QUANTITY: 100,
                }],
            };
            const sSelect = `select * from {{variant_item}} where VARIANT_ID = ${iValidVariantId}`;
            let aBeforeItem = oMockstar.execQuery(sSelect);
            aBeforeItem = mockstarHelpers.convertResultToArray(aBeforeItem);

            const oRequest = buildUpdateRequest(oVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            let aAfterItems = oMockstar.execQuery(sSelect);
            aAfterItems = mockstarHelpers.convertResultToArray(aAfterItems);

            // assert
            // the new item 666 was deleted, also variant item 1 because it did not exist in the t_item
            expect(aBeforeItem.ITEM_ID[0]).toBe(3001);
            expect(aAfterItems.ITEM_ID.length).toBe(aBeforeItem.ITEM_ID.length - 1);
            expect(oResponseStub.status).toBe($.net.http.OK);
        });

        it("Should not delete variant items if they have a correspondent in the base version", () => {
            // arrange
            oMockstar.clearTable("calculationVersion");
            const oCalculationVersionUpdated = new TestDataUtility(oCalculationVersionTestData).build();
            oCalculationVersionUpdated.LAST_MODIFIED_ON[0] = new Date().toJSON();
            oMockstar.insertTableData("calculationVersion", oCalculationVersionUpdated);
            oMockstar.clearTable("calculation_version_item");
            oMockstar.clearTable("variant_item");
            oMockstar.insertTableData("calculation_version_item", oCalculationVersionItemTestData);

            const oVariant = {
                LAST_MODIFIED_ON: sVariantDate,
                EXCHANGE_RATE_TYPE_ID: testData.oVariantTestData.EXCHANGE_RATE_TYPE_ID[0],
                ITEMS: [{
                    ITEM_ID: 3002,
                    IS_INCLUDED: 1,
                    QUANTITY_STATE: 1,
                    QUANTITY: 100,
                }, {
                    ITEM_ID: 3003,
                    IS_INCLUDED: 1,
                    QUANTITY_STATE: 1,
                    QUANTITY: 100,
                }],
            };
            const sSelect = `select * from {{variant_item}} where VARIANT_ID = ${iValidVariantId}`;
            let aBeforeItem = oMockstar.execQuery(sSelect);
            aBeforeItem = mockstarHelpers.convertResultToArray(aBeforeItem);

            const oRequest = buildUpdateRequest(oVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            let aAfterItems = oMockstar.execQuery(sSelect);
            aAfterItems = mockstarHelpers.convertResultToArray(aAfterItems);

            // assert
            // both items were kept because they exist in the t_item
            expect(aAfterItems.ITEM_ID.length).toBe(aBeforeItem.ITEM_ID.length + 2);
            expect(oResponseStub.status).toBe($.net.http.OK);
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is locked by another user in the same context", () => {
            // arrange
            oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);
            const oRequest = buildUpdateRequest(oVariantWithItem);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is a lifecycle version", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.CALCULATION_VERSION_TYPE[0] = CalculationVersionType.Lifecycle;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oRequest = buildUpdateRequest(oVariantWithItem);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is frozen", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.IS_FROZEN[0] = 1;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oRequest = buildUpdateRequest(oVariantWithItem);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when the request body contains VARIANT_ORDER", () => {
            // arrange
            const oInvalidVariantItem = new TestDataUtility(oVariantWithItem).build();
            oInvalidVariantItem.VARIANT_ORDER = 0;
            const oRequest = buildUpdateRequest(oInvalidVariantItem);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("VARIANT_ORDER")).not.toBe(-1);
            expect(sError.details.messageTextObj.indexOf("Not able to find property")).not.toBe(-1);
        });
    });

    describe("PATCH - update variants order", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
            oMockstar.clearTable("authorization");
            oMockstar.insertTableData("authorization", oAuthorizationPostPatchTestData);
            oMockstar.clearTable("variant");
            oMockstar.insertTableData("variant", oMultipleVariantsTestData);
            oMockstar.clearTable("variant_temporary");
            oMockstar.insertTableData("variant_temporary", oMultipleVariantsTestData);
        });

        const aVariantsIdsModel = [{
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[1],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[0],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[3],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[2],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[4],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[5],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[6],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[7],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[8],
            LAST_MODIFIED_ON: sVariantDate,
        }, {
            VARIANT_ID: oMultipleVariantsTestData.VARIANT_ID[9],
            LAST_MODIFIED_ON: sVariantDate,
        },
        ];

        it("Should throw GENERAL_ENTITY_NOT_FOUND_ERROR when some VARIANT_IDs requested to be ordered are not found", () => {
            // arrange
            const aVariantsIdsNotFound = new TestDataUtility(aVariantsIdsModel).build();
            aVariantsIdsNotFound.push({ VARIANT_ID: 12345, LAST_MODIFIED_ON: sVariantDate });
            aVariantsIdsNotFound.push({ VARIANT_ID: 6789, LAST_MODIFIED_ON: sVariantDate });
            const oRequest = buildPatchOrderRequest(aVariantsIdsNotFound);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            const sError = oResponseStub.getParsedBody().head.messages[0].code;
            expect(sError).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
        });

        it("Should throw GENERAL_ENTITY_NOT_FOUND_ERROR when the only VARIANT_ID requested to be ordered is not found", () => {
            // arrange
            const oRequest = buildPatchOrderRequest([{ VARIANT_ID: 12345, LAST_MODIFIED_ON: sVariantDate }]);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            const sError = oResponseStub.getParsedBody().head.messages[0].code;
            expect(sError).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
        });

        it("Should throw GENERAL_ENTITY_NOT_FOUND_ERROR when the given CALCULATION_VERSION_ID does not exist", () => {
            // arrange
            const oRequest = buildPatchOrderRequest(aVariantsIdsModel, 333);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            const sError = oResponseStub.getParsedBody().head.messages[0].code;
            expect(sError).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
        });

        it("Should throw GENERAL_VALIDATION_ERROR when sending invalid fields on the request", () => {
            // arrange
            const aExtraFieldVariant = new TestDataUtility(aVariantsIdsModel).build();
            aExtraFieldVariant.push({ VARIANT_ID: 22, ABC: 12345, LAST_MODIFIED_ON: sVariantDate });

            const oRequest = buildPatchOrderRequest(aExtraFieldVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("ABC")).not.toBe(-1);
            expect(sError.details.messageTextObj.indexOf("invalid properties")).not.toBe(-1);
        });

        it("Should throw GENERAL_VALIDATION_ERROR when not sending VARIANT_ID", () => {
            // arrange
            const aMissingFieldVariant = new TestDataUtility(aVariantsIdsModel).build();
            aMissingFieldVariant.push({ ABC: 12345, LAST_MODIFIED_ON: sVariantDate });

            const oRequest = buildPatchOrderRequest(aMissingFieldVariant);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_VALIDATION_ERROR");
            expect(sError.details.messageTextObj.indexOf("VARIANT_ID")).not.toBe(-1);
            expect(sError.details.messageTextObj.indexOf("Mandatory")).not.toBe(-1);
        });

        it("Should throw GENERAL_ACCESS_DENIED if user does not have privileges", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oRequest = buildPatchOrderRequest(aVariantsIdsModel);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });

        it("Should correctly update the order of the variants and return the headers for all variants", () => {
            // arrange
            const oRequest = buildPatchOrderRequest(aVariantsIdsModel);
            const aVariantsIds = aVariantsIdsModel.map(oVariant => oVariant.VARIANT_ID);
            const sGetVariantsOrder = `select * from {{variant_temporary}} where VARIANT_ID in (${aVariantsIds})`;
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult.length).toBe(aVariantsIdsModel.length);
            const aDatabaseVariants = oMockstar.execQuery(sGetVariantsOrder).columns;
            aDatabaseVariants.VARIANT_ID.rows.forEach((iVariantId, iIndex) => {
                const iCorrectIndex = aVariantsIds.indexOf(iVariantId);
                expect(aDatabaseVariants.VARIANT_ORDER.rows[iIndex]).toBe(iCorrectIndex);
            });
        });

        it("Should update the order only for the variants present in the request and the other ones remain the same", () => {
            // arrange
            const oRequest = buildPatchOrderRequest([
                { VARIANT_ID: iValidVariantId, LAST_MODIFIED_ON: sVariantDate },
                { VARIANT_ID: 22, LAST_MODIFIED_ON: sVariantDate },
            ]);
            const aRemaingVariantIds = oMultipleVariantsTestData.VARIANT_ID.slice(2);
            const sStmt = `select * from {{variant}} where variant_id in (${aRemaingVariantIds.join()})`;
            // act
            const aBeforeVariants = oMockstar.execQuery(sStmt);
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aAfterVariants = oMockstar.execQuery(sStmt);
            expect(JSON.parse(JSON.stringify(aAfterVariants))).toEqualObject(JSON.parse(JSON.stringify(aBeforeVariants)));
        });

        it("Should update only VARIANT_ORDER and not the other attributes of the variant", () => {
            // arrange
            const oRequest = buildPatchOrderRequest([{ VARIANT_ID: iValidVariantId, LAST_MODIFIED_ON: sVariantDate }]);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            const fPredicate = oObject => oObject.VARIANT_ID === iValidVariantId;
            const oExpected = new TestDataUtility(oMultipleVariantsTestData).getObjects(fPredicate);

            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResult.length).toBe(1);
            // check that fields that were not sent in the request, did not change
            const aVariantKeys = _.without(_.keys(oMultipleVariantsTestData), "LAST_MODIFIED_ON");
            expect(oResult[0]).toMatchData(_.omit(oExpected[0], "LAST_MODIFIED_ON"), aVariantKeys);
        });

        it("Should not update last modified at and last modified by", () => {
            // arrange
            oMockstar.clearTable("variant");
            oMockstar.clearTable("variant_temporary");
            const sUserId = "ABCD";
            const aVariantTestData = new TestDataUtility(oVariantTestData).build();
            aVariantTestData.LAST_MODIFIED_BY = Array(aVariantTestData.VARIANT_ID.length).fill(sUserId);
            oMockstar.insertTableData("variant", aVariantTestData);
            oMockstar.insertTableData("variant_temporary", aVariantTestData);
            const oRequest = buildPatchOrderRequest([{ VARIANT_ID: iValidVariantId, LAST_MODIFIED_ON: sVariantDate }]);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResult = oResponseStub.getParsedBody().body.transactionaldata;
            expect(Date.parse(oResult[0].LAST_MODIFIED_ON)).toBe(Date.parse(sVariantDate));
            expect(oResult[0].LAST_MODIFIED_BY).toBe(sUserId);
        });

        it("Should throw GENERAL_ENTITY_NOT_CURRENT_ERROR when sending an incorrect current date of variant", () => {
            // arrange
            const oRequest = buildPatchOrderRequest([{ VARIANT_ID: iValidVariantId, LAST_MODIFIED_ON: new Date() }]);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_ENTITY_NOT_CURRENT_ERROR");
        });

        it("Should throw GENERAL_ENTITY_NOT_CURRENT_ERROR when trying to update a variant not using the current timestamp", () => {
            // arrange
            oMockstar.clearTable("variant");
            oMockstar.clearTable("variant_temporary");
            const oYesteday = testData.oYesterday;
            const aVariantTestData = new TestDataUtility(oVariantTestData).build();
            aVariantTestData.LAST_MODIFIED_ON = Array(aVariantTestData.VARIANT_ID.length).fill(oYesteday);
            oMockstar.insertTableData("variant", aVariantTestData);
            oMockstar.insertTableData("variant_temporary", aVariantTestData);

            const oSecondUpdateRequest = buildPatchOrderRequest([{ VARIANT_ID: iValidVariantId, LAST_MODIFIED_ON: sVariantDate }]);

            // act
            new Dispatcher(oCtx, oSecondUpdateRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const sError = oResponseStub.getParsedBody().head.messages[0];
            expect(sError.code).toBe("GENERAL_ENTITY_NOT_CURRENT_ERROR");
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is locked by another user in the same context", () => {
            // arrange
            oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);
            const oRequest = buildPatchOrderRequest(aVariantsIdsModel);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is a lifecycle version", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.CALCULATION_VERSION_TYPE[0] = CalculationVersionType.Lifecycle;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oRequest = buildPatchOrderRequest(aVariantsIdsModel);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is frozen", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.IS_FROZEN[0] = 1;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oRequest = buildPatchOrderRequest(aVariantsIdsModel);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });

        it("Should update VARIANT_ORDER only for the variants present in the request (the other ones remain untouched)", () => {
            // arrange
            const sVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants}
                                                                   and VARIANT_ID != ${iValidVariantId}`;
            const oRequest = buildPatchOrderRequest([{ VARIANT_ID: iValidVariantId, LAST_MODIFIED_ON: sVariantDate }], iIdOfVersionWithVariants);
            // act
            const aVariantsOrderBefore = oMockstar.execQuery(sVariantsStmt).columns.VARIANT_ORDER.rows;
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const aVariantsOrderAfter = oMockstar.execQuery(sVariantsStmt).columns.VARIANT_ORDER.rows;

            // assert
            expect(aVariantsOrderBefore.sort()).toEqual(aVariantsOrderAfter.sort());
        });
    });

    describe("DELETE - delete a variant and it's items", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
            oMockstar.clearTable("authorization");
            oMockstar.insertTableData("authorization", oAuthorizationPostPatchTestData);
        });
        function prepareDeleteRequest(iCalculationVersionId, iVariantId) {
            const oRequest = {
                queryPath: `calculation-versions/${iCalculationVersionId}/variants/${iVariantId}`,
                method: $.net.http.DEL,
            };
            return oRequest;
        }

        it("should correctly delete a variant", () => {
            // arrange
            const oEmptyObject = {};
            const oVariantBefore = oMockstar.execQuery("select * from {{variant}}").columns;
            const oVariantItemsBefore = oMockstar.execQuery("select * from {{variant_item}}").columns;
            const fPredicate = oObject => oObject.VARIANT_ID === iValidVariantId;
            const iTotalItemsForVariantId = new TestDataUtility(oItemTestData).getObjects(fPredicate).length;
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const oVariantAfter = oMockstar.execQuery("select * from {{variant}}").columns;
            const oVariantItemsAfter = oMockstar.execQuery("select * from {{variant_item}}").columns;

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aVariants = oResponseStub.getParsedBody();
            expect(aVariants.head).toEqual(oEmptyObject);
            expect(aVariants.body).toEqual(oEmptyObject);
            expect(oVariantBefore.CALCULATION_VERSION_ID.rows.length).toEqual(oVariantTestData.CALCULATION_VERSION_ID.length);
            expect(oVariantItemsBefore.ITEM_ID.rows.length).toEqual(oItemTestData.ITEM_ID.length);
            expect(oVariantAfter.CALCULATION_VERSION_ID.rows.length).toEqual(oVariantTestData.CALCULATION_VERSION_ID.length - 1);
            expect(oVariantItemsAfter.ITEM_ID.rows.length).toEqual(oItemTestData.ITEM_ID.length - iTotalItemsForVariantId);
        });
        it("should correctly clear the field total_quantity_of_variants", () => {
            // arrange
            oMockstar.execSingle(`update {{calculation_version_item}} set total_quantity_of_variants = 5 where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants}`);
            oMockstar.execSingle(`update {{variant}} set variant_type = 1 where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants} and variant_id = ${iValidVariantId}`);
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            const oItemsAfter = oMockstar.execQuery(`select * from {{calculation_version_item}} where calculation_version_id = ${iIdOfVersionWithVariants}`).columns;

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(oItemsAfter.TOTAL_QUANTITY_OF_VARIANTS.rows[0]).toBeNull();
        });
        it("should throw GENERAL_ENTITY_NOT_FOUND_ERROR if the variant does not exist", () => {
            // arrange
            const iNonExistentVariantId = 888;
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iNonExistentVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });
        it("should return GENERAL_ACCESS_DENIED when the user has no instance privilege to delete the variant", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is locked by another user in the same context", () => {
            // arrange
            oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is a lifecycle version", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.CALCULATION_VERSION_TYPE[0] = CalculationVersionType.Lifecycle;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is frozen", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.IS_FROZEN[0] = 1;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
        it("should change the CALCULATION_VERSION_TYPE to normal for the base version if the deleted variant is its last variant", () => {
            oMockstar.clearTable("variant");
            oMockstar.insertTableData("variant", new TestDataUtility(oVariantTestData).getObject(0));
            // arrange
            const sStmt = `select CALCULATION_VERSION_TYPE from {{calculationVersion}} where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants}`;
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            const iVersionTypeBeforeDeletion = oMockstar.execQuery(sStmt).columns.CALCULATION_VERSION_TYPE.rows[0];
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const iVersionTypeAfterDeletion = oMockstar.execQuery(sStmt).columns.CALCULATION_VERSION_TYPE.rows[0];

            const sStmtVariant = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants}`;
            const iVariantsAfterDelete = oMockstar.execQuery(sStmtVariant).columns.VARIANT_ID.rows.length;
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(iVersionTypeBeforeDeletion).toBe(Constants.CalculationVersionType.VariantBase);
            expect(iVersionTypeAfterDeletion).toBe(Constants.CalculationVersionType.Base);
            expect(iVariantsAfterDelete).toBe(0);
        });
        it("should not change the CALCULATION_VERSION_TYPE to normal for the base version if the deleted variant is not its last variant", () => {
            // arrange
            const sStmt = `select CALCULATION_VERSION_TYPE from {{calculationVersion}} where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants}`;
            const oRequest = prepareDeleteRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            const iVersionTypeBeforeDeletion = oMockstar.execQuery(sStmt).columns.CALCULATION_VERSION_TYPE.rows[0];
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            const iVersionTypeAfterDeletion = oMockstar.execQuery(sStmt).columns.CALCULATION_VERSION_TYPE.rows[0];

            const sStmtVariant = `select * from {{variant_temporary}} where CALCULATION_VERSION_ID = ${iIdOfVersionWithVariants}`;
            const iVariantsAfterDelete = oMockstar.execQuery(sStmtVariant).columns.VARIANT_ID.rows.length;
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            expect(iVersionTypeBeforeDeletion).toBe(Constants.CalculationVersionType.VariantBase);
            expect(iVersionTypeAfterDeletion).toBe(Constants.CalculationVersionType.VariantBase);
            expect(iVariantsAfterDelete).not.toBe(0);
        });
    });
}).addTags(["Administration_NoCF_Integration"]);
