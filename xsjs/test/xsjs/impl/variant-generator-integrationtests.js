const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const ResponseObjectStub = require("../../testtools/responseObjectStub").ResponseObjectStub;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
const testData = require("../../testdata/testdata").data;
const PersistencyImport = $.import("xs.db", "persistency");
const Persistency = PersistencyImport.Persistency;
const DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLibrary.Dispatcher;
const oCtx = DispatcherLibrary.prepareDispatch($);
const MessageLibrary = require("../../../lib/xs/util/message");
const oMessageCode = MessageLibrary.Code;
const sDefaultPriceDeterminationStrategy = testData.sStandardPriceStrategy;

describe("xsjs.impl.variant-generator-integrationtests", () => {
    let oMockstar = null;
    let oPersistency = null;
    let oResponseStub = null;
    let oAuthorizationPostTestData = null;

    const iValidVariantId = testData.iVariantId;
    const iThirdVariantId = testData.iThirdVariantId;
    const iCalculationId = testData.iCalculationId;
    const iSecondCalculationId = testData.iSecondCalculationId;
    const iCalculationVersionId = testData.iCalculationVersionId;
    const iSecondVersionId = testData.iSecondVersionId;

    const iNewTargetCalculationId = testData.iSecondCalculationId;
    const iNonExistingVariantId = 9837;
    const iNonExistingCalculationVersionId = 7389;


    const oOpenCalcVersionsTestData = {
        SESSION_ID: ["SOMEONE"],
        CALCULATION_VERSION_ID: [iCalculationVersionId],
        CONTEXT: ["variant_matrix"],
        IS_WRITEABLE: [1]
    };

    oAuthorizationPostTestData = {
        PROJECT_ID: [testData.oProjectTestData.PROJECT_ID[0]],
        USER_ID: [$.session.getUsername()],
        PRIVILEGE: [InstancePrivileges.CREATE_EDIT],
    };
    const oVersionItemExpectedGenerateTestData = {
        ITEM_ID: [1, 12, 13, 111, 113, 1112, 1113, 16, 161],
        PREDECESSOR_ITEM_ID: [null, null, 12, null, 111, null, 1112, 13, null],
        PARENT_ITEM_ID: [null, 1, 1, 13, 13, 113, 113, 1, 16],
    };
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            schema: "SAP_PLC",
            substituteTables: {
                account: {
                    name: "sap.plc.db::basis.t_account",
                    data: testData.oAccountForItemTestData,
                },
                variant: {
                    name: "sap.plc.db::basis.t_variant",
                    data: testData.oVariantTestData,
                },
                variant_item: {
                    name: "sap.plc.db::basis.t_variant_item",
                    data: testData.oVariantItemTestData,
                },
                variant_temporary: {
                    name: "sap.plc.db::basis.t_variant_temporary",
                    data: testData.oVariantTestData,
                },
                variant_item_temporary: {
                    name: "sap.plc.db::basis.t_variant_item_temporary",
                    data: testData.oVariantItemTestData,
                },
                project: {
                    name: "sap.plc.db::basis.t_project",
                    data: testData.oProjectTestData,
                },
                calculation: {
                    name: "sap.plc.db::basis.t_calculation",
                    data: testData.oCalculationTestData,
                },
                calculation_version: {
                    name: "sap.plc.db::basis.t_calculation_version",
                    data: testData.oCalculationVersionTestData,
                },
                calculation_version_item: {
                    name: "sap.plc.db::basis.t_item",
                    data: testData.oItemTestData,
                },
                authorization: {
                    name: "sap.plc.db::auth.t_auth_project",
                    data: oAuthorizationPostTestData,
                },
                session: {
                    name: "sap.plc.db::basis.t_session",
                    data: testData.oSessionTestData,
                },
                open_calculation_versions: {
                    name: "sap.plc.db::basis.t_open_calculation_versions",
                    data: oOpenCalcVersionsTestData
                },
                calculation_version_item_ext : "sap.plc.db::basis.t_item_ext",
                metadata : {
					name : "sap.plc.db::basis.t_metadata",
					data : testData.mCsvFiles.metadata
				},
				metadata_item_attributes: {
					name : "sap.plc.db::basis.t_metadata_item_attributes",
					data : testData.mCsvFiles.metadata_item_attributes
				}
             },	             
            csvPackage : testData.sCsvPackage
        });
    });

    beforeEach(() => {
        oPersistency = new Persistency(jasmine.dbConnection);
        oCtx.persistency = oPersistency;
        oResponseStub = new ResponseObjectStub();
        oMockstar.initializeData();
    });

    afterEach(() => {
        oMockstar.clearAllTables();
    });

    describe("POST - generate variant", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
                oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
                oMockstar.insertTableData("calculation_version_item_ext", testData.oItemExtData);
            }
            oMockstar.initializeData();

            spyOn(oPersistency.CalculationVersion, "calculatePersistent").and.callThrough();
        });
        function prepareGenerateRequest(nVersionId, nVariantId, nTargetCalculationId, sCalculationVersionName) {
            const oRequest = {
                queryPath: `calculation-versions/${nVersionId}/variant-generator/${nVariantId}`,
                method: $.net.http.POST,
                body: {},
            };

            const oBody = {};
            if (nTargetCalculationId) {
                oBody.TARGET_CALCULATION_ID = nTargetCalculationId;
            }
            if (sCalculationVersionName) {
                oBody.CALCULATION_VERSION_NAME = sCalculationVersionName;
            }
            oRequest.body = {
                asString() {
                    return JSON.stringify(oBody);
                },
            };

            return oRequest;
        }
        function getVersionName(iCVersionId, iIdVariant) {
            const fPredicateVersion = oObject => oObject.CALCULATION_VERSION_ID === iCVersionId;
            const fPredicateVariant = oObject => oObject.VARIANT_ID === iIdVariant;
            const aVersionName = new TestDataUtility(testData.oCalculationVersionTestData).getObjects(fPredicateVersion)[0].CALCULATION_VERSION_NAME;
            const aVariantName = new TestDataUtility(testData.oVariantTestData).getObjects(fPredicateVariant)[0].VARIANT_NAME;
            const aExpectedName = `${aVersionName} - ${aVariantName}`;
            return aExpectedName;
        }
        const sStmtSelectCalculationVersion = "select * from {{calculation_version}}";
        const sStmtSelectVersionItems = "select * from {{calculation_version_item}}";
        it("should generate a new c. version and it's items for a variant base under the default calculation location", () => {
            // arrange
            const oRequest = prepareGenerateRequest(iSecondVersionId, iThirdVariantId);
            const aExpectedName = getVersionName(iSecondVersionId, iThirdVariantId);
            const oCVersionBefore = oMockstar.execQuery(sStmtSelectCalculationVersion).columns;
            const oCVersionItemsBefore = oMockstar.execQuery(sStmtSelectVersionItems).columns;

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            const oCVersionAfter = oMockstar.execQuery(sStmtSelectCalculationVersion).columns;
            const oCVersionItemsAfter = oMockstar.execQuery(sStmtSelectVersionItems).columns;
            const oGeneratedCVersion = oMockstar.execQuery(`select CALCULATION_ID,
                CALCULATION_VERSION_TYPE, BASE_VERSION_ID, VARIANT_ID from {{calculation_version}} where VARIANT_ID = ${iThirdVariantId}`).columns;

            // assert
            const oTransactionalData = oResponseStub.getParsedBody().body.transactionaldata;
            const iGeneratedVersionId = oTransactionalData[0].LAST_GENERATED_VERSION_ID;
            const sStmt = `select * from {{calculation_version}} where CALCULATION_VERSION_ID = ${iGeneratedVersionId}`;
            const oGeneratedVersion = oMockstar.execQuery(sStmt).columns;
            expect(oResponseStub.status).toEqual($.net.http.CREATED);
            expect(oGeneratedVersion.CALCULATION_VERSION_NAME.rows[0]).toEqual(`${aExpectedName}`);
            expect(oGeneratedCVersion.CALCULATION_ID.rows[0]).toEqual(iSecondCalculationId);
            expect(oGeneratedCVersion.CALCULATION_VERSION_TYPE.rows[0]).toEqual(8);
            expect(oGeneratedCVersion.BASE_VERSION_ID.rows[0]).toEqual(iSecondVersionId);
            expect(oGeneratedCVersion.VARIANT_ID.rows[0]).toEqual(iThirdVariantId);
            expect(oCVersionBefore.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID.length);
            expect(oCVersionItemsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oItemTestData.ITEM_ID.length);
            expect(oCVersionAfter.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID.length + 1);
            expect(oCVersionItemsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oItemTestData.ITEM_ID.length + 1);
            expect(oTransactionalData[0].LAST_GENERATED_CALCULATION_ID).toEqual(iSecondCalculationId);

            // make sure that the new generated variant got calculated
            expect(oPersistency.CalculationVersion.calculatePersistent).toHaveBeenCalled();
        });

        it("should generate a new c. version and it's items for a variant base under a given target calculation", () => {
            // arrange
            const sStmtSelectVersionItemExt = "select * from {{calculation_version_item_ext}}";
            const iNoOfNewItems = 3;
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId, iNewTargetCalculationId);
            const oCVersionBefore = oMockstar.execQuery(sStmtSelectCalculationVersion).columns;
            const oCVersionItemsBefore = oMockstar.execQuery(sStmtSelectVersionItems).columns;
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                var oCVersionItemExtBefore = oMockstar.execQuery(sStmtSelectVersionItemExt).columns;
            }
            const aExpectedName = getVersionName(iCalculationVersionId, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            const oCVersionAfter = oMockstar.execQuery(sStmtSelectCalculationVersion).columns;
            const oCVersionItemsAfter = oMockstar.execQuery(sStmtSelectVersionItems).columns;
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                var oCVersionItemExtAfter = oMockstar.execQuery(sStmtSelectVersionItemExt).columns;
            }
            const oGeneratedCVersion = oMockstar.execQuery(`select CALCULATION_ID,
                CALCULATION_VERSION_TYPE, BASE_VERSION_ID, VARIANT_ID from {{calculation_version}} where CALCULATION_VERSION_NAME
                like '${aExpectedName}'`).columns;

            // assert
            const oTransactionalData = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResponseStub.status).toEqual($.net.http.CREATED);
            expect(oGeneratedCVersion.CALCULATION_ID.rows[0]).toEqual(iNewTargetCalculationId);
            expect(oGeneratedCVersion.CALCULATION_VERSION_TYPE.rows[0]).toEqual(8);
            expect(oGeneratedCVersion.BASE_VERSION_ID.rows[0]).toEqual(iCalculationVersionId);
            expect(oGeneratedCVersion.VARIANT_ID.rows[0]).toEqual(iValidVariantId);
            expect(oCVersionBefore.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID.length);
            expect(oCVersionItemsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oItemTestData.ITEM_ID.length);
            expect(oCVersionAfter.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID.length + 1);
            expect(oCVersionItemsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oItemTestData.ITEM_ID.length + iNoOfNewItems);
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                expect(oCVersionItemExtBefore.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oItemExtData.ITEM_ID.length);
                expect(oCVersionItemExtAfter.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oItemExtData.ITEM_ID.length + iNoOfNewItems);
            }
            expect(oTransactionalData[0].LAST_GENERATED_CALCULATION_ID).toEqual(iNewTargetCalculationId);

            // make sure that the new generated variant got calculated
            expect(oPersistency.CalculationVersion.calculatePersistent).toHaveBeenCalled();
        });
        it("should generate a new c. version and it's items for a variant base under the last generated calculation", () => {
            // arrange
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId);
            const oCVersionBefore = oMockstar.execQuery(sStmtSelectCalculationVersion).columns;
            const oCVersionItemsBefore = oMockstar.execQuery(sStmtSelectVersionItems).columns;
            const aExpectedName = getVersionName(iCalculationVersionId, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            const oCVersionAfter = oMockstar.execQuery(sStmtSelectCalculationVersion).columns;
            const oCVersionItemsAfter = oMockstar.execQuery(sStmtSelectVersionItems).columns;
            const oGeneratedCVersion = oMockstar.execQuery(`select CALCULATION_ID,
                CALCULATION_VERSION_TYPE, BASE_VERSION_ID, VARIANT_ID from {{calculation_version}} where CALCULATION_VERSION_NAME
                like '${aExpectedName}'`).columns;

            // assert
            const oTransactionalData = oResponseStub.getParsedBody().body.transactionaldata;
            expect(oResponseStub.status).toEqual($.net.http.CREATED);

            expect(oResponseStub.status).toEqual($.net.http.CREATED);
            expect(oGeneratedCVersion.CALCULATION_ID.rows[0]).toEqual(iCalculationId);
            expect(oGeneratedCVersion.CALCULATION_VERSION_TYPE.rows[0]).toEqual(8);
            expect(oGeneratedCVersion.BASE_VERSION_ID.rows[0]).toEqual(iCalculationVersionId);
            expect(oGeneratedCVersion.VARIANT_ID.rows[0]).toEqual(iValidVariantId);
            expect(oCVersionBefore.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID.length);
            expect(oCVersionItemsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oItemTestData.ITEM_ID.length);
            expect(oCVersionAfter.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID.length + 1);
            expect(oCVersionItemsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(testData.oItemTestData.ITEM_ID.length + 3);
            expect(oTransactionalData[0].LAST_GENERATED_CALCULATION_ID).toEqual(iCalculationId);

            // make sure that the new generated variant got calculated
            expect(oPersistency.CalculationVersion.calculatePersistent).toHaveBeenCalled();
        });
        it("should return GENERAL_VALIDATION_ERROR if the body of the request contains invalid fields", () => {
            // arrange
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId);
            const oBody = {
                TARGET_CALCULATION_ID: iCalculationId,
                CALCULATION_VERSION_NAME: "Baseline Version1 - S-Engine Petrol",
                INVALID_FIELD: "INVALID TEST FIELD",
            };
            oRequest.body = {
                asString() {
                    return JSON.stringify(oBody);
                },
            };

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR if the TARGET_CALCULATION_ID is not a number", () => {
            // arrange
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId);
            const oBody = {
                TARGET_CALCULATION_ID: "target_calculation_id",
            };
            oRequest.body = {
                asString() {
                    return JSON.stringify(oBody);
                },
            };

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_ACCESS_DENIED when the user has no write access to calculation of the base-version", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oRequest = prepareGenerateRequest(iSecondVersionId, iThirdVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
        it("should return GENERAL_ACCESS_DENIED when the user has no write access to the calculation specified under the target-calculation", () => {
            // arrange
            const fPredicateProject1 = oObject => oObject.PROJECT_ID === "VariantTestProject";
            const aCalculation = new TestDataUtility(testData.oCalculationForVariantTestData).getObjects(fPredicateProject1);
            const fPredicateProject2 = oObject => oObject.PROJECT_ID === "PR3";
            aCalculation.push(new TestDataUtility(testData.oCalculationTestData).getObjects(fPredicateProject2)[0]);
            // Authorization data contains two projects. The user doens't have CREATE_EDIT privilege for PR3
            const oAuthorizationTargetCalculation = {
                PROJECT_ID: ["PR1", "PR3"],
                USER_ID: [$.session.getUsername(), $.session.getUsername()],
                PRIVILEGE: [InstancePrivileges.CREATE_EDIT, InstancePrivileges.READ],
            };
            oMockstar.clearTable("authorization");
            oMockstar.clearTable("calculation");
            oMockstar.insertTableData("authorization", oAuthorizationTargetCalculation);
            oMockstar.insertTableData("calculation", aCalculation);
            const oCalculationInDifferentPorject = testData.oCalculationTestData.CALCULATION_ID[2];
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId, oCalculationInDifferentPorject);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
        it("should return GENERAL_ACCESS_DENIED when the user has no write access for the last-generated-version", () => {
            // arrange
            const fPredicateProject1 = oObject => oObject.PROJECT_ID === "VariantTestProject";
            const aCalculation = new TestDataUtility(testData.oCalculationForVariantTestData).getObjects(fPredicateProject1);
            const fPredicateProject2 = oObject => oObject.PROJECT_ID === "PR3";
            aCalculation.push(new TestDataUtility(testData.oCalculationTestData).getObjects(fPredicateProject2)[0]);
            const oCalculationVersionDifferentProjects = {
                CALCULATION_VERSION_ID: [iCalculationVersionId, iSecondVersionId],
                CALCULATION_ID: [iCalculationId, testData.oCalculationTestData.CALCULATION_ID[2]],
                CALCULATION_VERSION_NAME: ["VariantTestVersion1", "VariantTestVersion2"],
                CALCULATION_VERSION_TYPE: [4, 8],
                VARIANT_ID: [null, testData.iVariantId],
                ROOT_ITEM_ID: [3001, 4001],
                CUSTOMER_ID: ["", ""],
                SALES_PRICE: [20, 10],
                SALES_PRICE_CURRENCY_ID: ["EUR", "EUR"],
                REPORT_CURRENCY_ID: ["EUR", "USD"],
                COSTING_SHEET_ID: ["COGM", "COGM"],
                COMPONENT_SPLIT_ID: [testData.sComponentSplitId, testData.sComponentSplitId],
                SALES_DOCUMENT: ["DOC", "DOC"],
                START_OF_PRODUCTION: [testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
                END_OF_PRODUCTION: [testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
                VALUATION_DATE: [testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
                LAST_MODIFIED_ON: [testData.sExpectedDateWithoutTime, testData.sExpectedDateWithoutTime],
                LAST_MODIFIED_BY: [testData.sTestUser, testData.sTestUser],
                MASTER_DATA_TIMESTAMP: [testData.sMasterdataTimestampDate, testData.sMasterdataTimestampDate],
                IS_FROZEN: [0, 0],
                MATERIAL_PRICE_STRATEGY_ID: [sDefaultPriceDeterminationStrategy, sDefaultPriceDeterminationStrategy],
                ACTIVITY_PRICE_STRATEGY_ID: [sDefaultPriceDeterminationStrategy, sDefaultPriceDeterminationStrategy]
            };
            // Authorization data contains two projects. The user doens't have CREATE_EDIT privilege for PR3
            const oAuthorizationLastGeneratedVersion = {
                PROJECT_ID: ["VariantTestProject", "PR3"],
                USER_ID: [$.session.getUsername(), $.session.getUsername()],
                PRIVILEGE: [InstancePrivileges.CREATE_EDIT, InstancePrivileges.READ],
            };
            oMockstar.clearTable("authorization");
            oMockstar.clearTable("calculation");
            oMockstar.clearTable("calculation_version");
            oMockstar.insertTableData("authorization", oAuthorizationLastGeneratedVersion);
            oMockstar.insertTableData("calculation", aCalculation);
            oMockstar.insertTableData("calculation_version", oCalculationVersionDifferentProjects);
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the base calculation doesn't exist for the requested calculation version id", () => {
            // arrange
            oMockstar.clearTable("calculation");
            oMockstar.clearTable("calculation_version");
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the given variant id doesn't exist", () => {
            // arrange
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iNonExistingVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });
        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the given calculation version id doesn't exist", () => {
            // arrange
            const oRequest = prepareGenerateRequest(iNonExistingCalculationVersionId, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });
        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the given target-calculation id doesn't exist", () => {
            // arrange
            oMockstar.clearTable("calculation");
            const fPredicate = oObject => oObject.CALCULATION_ID === iCalculationId;
            const aCalculationTestData = new TestDataUtility(testData.oCalculationTestData).getObjects(fPredicate);
            oMockstar.insertTableData("calculation", aCalculationTestData);
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId, iNewTargetCalculationId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });
        it("should generate a new c. version and increment using a sequence if a calculation version name already exists", () => {
            // arrange
            const oSequenceVersionTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            const aExpectedName = getVersionName(iCalculationVersionId, iValidVariantId);
            oSequenceVersionTestData.CALCULATION_VERSION_ID = [100, 200, 300, 400, 500, 600, 700];
            oSequenceVersionTestData.VARIANT_ID = [null, null, null, null, null, null, null];
            oSequenceVersionTestData.CALCULATION_ID = [iCalculationId, iCalculationId, iCalculationId, iCalculationId,
                iCalculationId, iCalculationId, iCalculationId];
            oSequenceVersionTestData.CALCULATION_VERSION_NAME = [aExpectedName, `${aExpectedName} (1)`, `${aExpectedName} (2)`,
                `${aExpectedName} (3)`, `${aExpectedName} (4)`, `${aExpectedName} (5)`, `${aExpectedName} (6)`];
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId);
            oMockstar.insertTableData("calculation_version", oSequenceVersionTestData);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            const sStmt = `select * from {{calculation_version}} where VARIANT_ID = ${iValidVariantId}
                and BASE_VERSION_ID = ${iCalculationVersionId}`;
            const oGeneratedVersion = oMockstar.execQuery(sStmt).columns;
            expect(oResponseStub.status).toEqual($.net.http.CREATED);
            expect(oGeneratedVersion.CALCULATION_VERSION_NAME.rows[0]).toEqual(`${aExpectedName} (7)`);
        });
        it("should get the current user id when generating the new version items", () => {
            // arrange
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId);
            const sCurrentUserId = $.session.getUsername();

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            const sStmtCV = `select CALCULATION_VERSION_ID from {{calculation_version}} where VARIANT_ID = ${iValidVariantId}
                and BASE_VERSION_ID = ${iCalculationVersionId}`;
            const iGeneratedVersionId = oMockstar.execQuery(sStmtCV).columns.CALCULATION_VERSION_ID.rows[0];

            const sStmtCVItem = `select CREATED_BY from {{calculation_version_item}} where CALCULATION_VERSION_ID = ${iGeneratedVersionId}`;
            const oCVersionItems = oMockstar.execQuery(sStmtCVItem).columns;

            // assert
            expect(oResponseStub.status).toEqual($.net.http.CREATED);
            expect(oCVersionItems.CREATED_BY.rows[0]).toEqual(sCurrentUserId);
        });

        /**
         * Overall image for the test below
         *  ITEM_ID     PREDECESSOR_ITEM_ID     PARENT_ITEM_ID      IS_INCLUDED     CORRECT_PREDECESSOR_AFTER GENERATE
            1           null                    null                1               null
            11          null                    1                   0               -excluded
            12          11                      1                   1               null
            13          12                      1                   1               12
            111         null                    13                  1               null
            112         111                     13                  0               -excluded
            113         112                     13                  1               111
            1111        null                    113                 0               -excluded
            1112        1111                    113                 1               null
            1113        1112                    113                 1               1112
            14          13                      1                   0               -excluded
            15          14                      1                   0               -excluded
            16          15                      1                   1               13
            161         null                    16                  1               null
            162         161                     16                  0               -excluded
         */
        it("should replace the PREDECESSOR_ITEM_ID for items that have as predecessor an item that was excluded from variant before generate", () => {
            // arrange
            oMockstar.clearTable("variant_item");
            oMockstar.clearTable("calculation_version_item");
            oMockstar.insertTableData("variant_item", testData.oVariantItemGenerateTestData);
            oMockstar.insertTableData("calculation_version_item", testData.oVersionItemGenerateTestData);
            const oRequest = prepareGenerateRequest(iCalculationVersionId, iValidVariantId);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            const sStmtCV = `select CALCULATION_VERSION_ID from {{calculation_version}} where VARIANT_ID = ${iValidVariantId}
                and BASE_VERSION_ID = ${iCalculationVersionId}`;
            const iGeneratedVersionId = oMockstar.execQuery(sStmtCV).columns.CALCULATION_VERSION_ID.rows[0];

            const sStmtCVItem = `select ITEM_ID, PREDECESSOR_ITEM_ID, PARENT_ITEM_ID 
                                    from {{calculation_version_item}} where CALCULATION_VERSION_ID = ${iGeneratedVersionId}`;
            const oCVersionItems = oMockstar.execQuery(sStmtCVItem).columns;
            const aItemIds = oCVersionItems.ITEM_ID.rows;
            const aPredecessorItemIds = oCVersionItems.PREDECESSOR_ITEM_ID.rows;
            const aParentItemIds = oCVersionItems.PARENT_ITEM_ID.rows;

            // assert
            expect(aItemIds.length).toBe(oVersionItemExpectedGenerateTestData.ITEM_ID.length);
            aItemIds.forEach((iItemId, iIndex) => {
                const iExpectedItemsIndex = oVersionItemExpectedGenerateTestData.ITEM_ID.indexOf(iItemId);
                expect(iItemId).toBe(oVersionItemExpectedGenerateTestData.ITEM_ID[iExpectedItemsIndex]);
                expect(aPredecessorItemIds[iIndex]).toBe(oVersionItemExpectedGenerateTestData.PREDECESSOR_ITEM_ID[iExpectedItemsIndex]);
                expect(aParentItemIds[iIndex]).toBe(oVersionItemExpectedGenerateTestData.PARENT_ITEM_ID[iExpectedItemsIndex]);
            });
        });
    });
}).addTags(["Project_Calculation_Version_Integration"]);
