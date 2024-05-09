const testData = require("../../testdata/testdata").data;
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
const _ = require("lodash");
const PersistencyImport = $.import("xs.db", "persistency");
const Persistency = PersistencyImport.Persistency;
const mockstarHelpers = require("../../testtools/mockstar_helpers");
const Constants = require("../../../lib/xs/util/constants");
const CalculationVersionLockContext = Constants.CalculationVersionLockContext.CALCULATION_VERSION;
const CalculationVersionType = require("../../../lib/xs/util/constants").CalculationVersionType;
const InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const MessageLibrary = require("../../../lib/xs/util/message");

const VariantLockContext = Constants.CalculationVersionLockContext.VARIANT_MATRIX;

describe("xsjs.db.persistency-variant-integrationtests", () => {
    let oMockstar = null;
    let oPersistency = null;
    const iValidVariantId = testData.iVariantId;
    const iSecondVariantId = testData.iSecondVariantId;
    const iThirdVariantId = testData.iThirdVariantId;
    const sUserId = testData.sTestUser;
    const iCalculationVersionId = testData.iCalculationVersionId;
    const iCalculationId = testData.iCalculationId;
    const iSecondCalculationId = testData.iSecondCalculationId;
    const iSecondVersionId = testData.iSecondVersionId;
    const oVariantTestData = new TestDataUtility(testData.oVariantTestData).build();
    const oVariantItemTestData = new TestDataUtility(testData.oVariantItemTestData).build();
    const oCalculationTestData = new TestDataUtility(testData.oCalculationForVariantTestData).build();
    const oVariantItemTemporaryTestData = new TestDataUtility(testData.oVariantItemTemporaryTestData).build();
    const oCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
    const oCalculationVersionItemTestData = new TestDataUtility(testData.oItemTestData).build();

    const oAuthorizationPostTestData = {
        PROJECT_ID: ["VariantTestProject"],
        USER_ID: [$.session.getUsername()],
        PRIVILEGE: [InstancePrivileges.CREATE_EDIT],
    };
    /*
    expected values (because of LAST_MODIFIED_ON)
    for VARIANT_ID = 11: LAST_GENERATED_VERSION_ID = 113, LAST_GENERATED_CALCULATION_ID=1978
    for VARIANT_ID = 22: LAST_GENERATED_VERSION_ID = 222, LAST_GENERATED_CALCULATION_ID=2078
    for VARIANT_ID = 33+44: LAST_GENERATED_VERSION_ID = null, LAST_GENERATED_CALCULATION_ID = null; they haven't been generated
    const oCalculationVersionItemTestData = new TestDataUtility(testData.oItemTestData).build();

    */
    const oExpectedVariantData = _.extend(JSON.parse(JSON.stringify(oVariantTestData)), {
        LAST_GENERATED_VERSION_ID: [113, 222, null, null],
        LAST_GENERATED_CALCULATION_ID: [iCalculationId, iSecondCalculationId, null, null],
    });
    const sCalculationVersionName = `${oCalculationVersionTestData.CALCULATION_VERSION_NAME[0]} - ${oVariantTestData.VARIANT_NAME[0]}`;
    const sExpectedDate = testData.sExpectedDate;
    const sTestUser = testData.sTestUser;

    const oItemGeneratedTestData = new TestDataUtility(testData.oItemTestData).build();
    oItemGeneratedTestData.CALCULATION_VERSION_ID = [iCalculationVersionId, iCalculationVersionId, iCalculationVersionId,
        iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iSecondVersionId];
    oItemGeneratedTestData.ITEM_ID = [3001, 3002, 3003, 4001, 4002, 4003, 4004, 4005, 5001];
    oItemGeneratedTestData.PREDECESSOR_ITEM_ID = [null, 3001, 3002, null, 4001, 4002, 4003, 4004, null];
    oItemGeneratedTestData.IS_ACTIVE = Array(9).fill(1);
    oItemGeneratedTestData.ITEM_CATEGORY_ID = Array(9).fill(1);
    oItemGeneratedTestData.CHILD_ITEM_CATEGORY_ID = Array(9).fill(1);
    oItemGeneratedTestData.CREATED_ON = Array(9).fill(sExpectedDate);
    oItemGeneratedTestData.CREATED_BY = Array(9).fill(sTestUser);
    oItemGeneratedTestData.LAST_MODIFIED_ON = Array(9).fill(sExpectedDate);
    oItemGeneratedTestData.LAST_MODIFIED_BY = Array(9).fill(sTestUser);

    const oExcludedVariantItemsTestData = new TestDataUtility(testData.oVariantItemTestData).build();
    // VARIANT_ID: [ 11, 11, 11, 22, 22, 22, 22, 22, 33 ]
    oExcludedVariantItemsTestData.IS_INCLUDED = [1, 1, 1, 1, 0, 0, 0, 1, 0];
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                variant: {
                    name: "sap.plc.db::basis.t_variant",
                    data: oVariantTestData,
                },
                variant_temporary: {
                    name: "sap.plc.db::basis.t_variant_temporary",
                    data: oVariantTestData,
                },
                open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions",
                variant_item: {
                    name: "sap.plc.db::basis.t_variant_item",
                    data: oVariantItemTestData,
                },
                variant_item_temporary: {
                    name: "sap.plc.db::basis.t_variant_item_temporary",
                    data: oVariantItemTemporaryTestData,
                },
                calculation: {
                    name: "sap.plc.db::basis.t_calculation",
                    data: oCalculationTestData,
                },
                calculation_version: {
                    name: "sap.plc.db::basis.t_calculation_version",
                    data: oCalculationVersionTestData,
                },
                calculation_version_item: {
                    name: "sap.plc.db::basis.t_item",
                    data: oCalculationVersionItemTestData,
                },
                auth_project: {
                    name: "sap.plc.db::auth.t_auth_project",
                    data: oAuthorizationPostTestData,
                },
                version_item: "sap.plc.db::basis.t_item",
                calculation_version_item_ext : "sap.plc.db::basis.t_item_ext",
                metadata : {
					name : "sap.plc.db::basis.t_metadata",
					data : testData.mCsvFiles.metadata
				},
				metadata_item_attributes: {
					name : "sap.plc.db::basis.t_metadata_item_attributes",
					data : testData.mCsvFiles.metadata_item_attributes
                },
                session: {
                    name : "sap.plc.db::basis.t_session"
                }
            },
            csvPackage : testData.sCsvPackage
        });
    });

    beforeEach(() => {
        oPersistency = new Persistency(jasmine.dbConnection);
    });

    describe("getVariants", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        const nonExistentIdOfVersion = 999;

        it("should return the variants for the specified version id as an array", () => {
            // act
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId);
            const aOmit = ["LAST_REMOVED_MARKINGS_ON", "LAST_MODIFIED_ON", "LAST_CALCULATED_ON"];
            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iCalculationVersionId;
            const aExpected = new TestDataUtility(oVariantTestData).getObjects(fPredicate);
            //sequence of result set is random
            expect(_.omit(aVariants[0], aOmit)).toMatchData(_.omit(aExpected.filter(value => value.VARIANT_ID === aVariants[0].VARIANT_ID)[0], aOmit), ["VARIANT_ID", "CALCULATION_VERSION_ID"]);
            expect(_.omit(aVariants[1], aOmit)).toMatchData(_.omit(aExpected.filter(value => value.VARIANT_ID === aVariants[1].VARIANT_ID)[0], aOmit), ["VARIANT_ID", "CALCULATION_VERSION_ID"]);
            expect(Array.isArray(aVariants)).toBeTruthy();
        });

        it("should return an empty array when no variants for the specified version id are known", () => {
            // act
            const aVariants = oPersistency.Variant.getVariants(3);

            // assert
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toEqual(0);
        });

        it("should return an empty array when the calculation version does not exist", () => {
            // act
            const aVariants = oPersistency.Variant.getVariants(nonExistentIdOfVersion);

            // assert
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toEqual(0);
        });

        it("should return an empty array when the variant table is empty", () => {
            // arrange
            oMockstar.clearTable("variant");

            // act
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId);

            // assert
            expect(aVariants.length).toEqual(0);
            expect(Array.isArray(aVariants)).toBeTruthy();
        });

        it("should return the requested variant for the specified version id as an array", () => {
            // act
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId, [iValidVariantId]);

            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iCalculationVersionId && oObject.VARIANT_ID === iValidVariantId;
            const aExpected = new TestDataUtility(oExpectedVariantData).getObjects(fPredicate);
            expect(aVariants.VARIANT_ID).toEqual(aExpected.VARIANT_ID);
            expect(aVariants.CALCULATION_VERSION_ID).toEqual(aExpected.CALCULATION_VERSION_ID);
            expect(aVariants.REPORT_CURRENCY_ID).toEqual(aExpected.REPORT_CURRENCY_ID);
            expect(aVariants.LAST_GENERATED_VERSION_ID).toEqual(aExpected.LAST_GENERATED_VERSION_ID);
            expect(aVariants.LAST_GENERATED_CALCULATION_ID).toEqual(aExpected.LAST_GENERATED_CALCULATION_ID);
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toBe(1);
            expect(aVariants[0].VARIANT_ID).toBe(iValidVariantId);
        });

        it("should return a variant that has never been used to generate a new calculation version", () => {
            // The LAST_GENERATED_VERSION_ID and LAST_GENERATED_CALCULATION_ID properties should have the value null
            // act
            const aVariants = oPersistency.Variant.getVariants(iSecondVersionId, [iThirdVariantId]);

            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iSecondVersionId && oObject.VARIANT_ID === iThirdVariantId;
            const aExpected = new TestDataUtility(oExpectedVariantData).getObjects(fPredicate);
            expect(aVariants[0].LAST_GENERATED_VERSION_ID).toEqual(aExpected[0].LAST_GENERATED_VERSION_ID);
            expect(aVariants[0].LAST_GENERATED_CALCULATION_ID).toEqual(aExpected[0].LAST_GENERATED_CALCULATION_ID);
            expect(aVariants[0].VARIANT_ID).toBe(iThirdVariantId);
        });

        it("should return the requested variants for the specified version id as an array", () => {
            // act
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId, [iValidVariantId, iSecondVariantId]);

            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iCalculationVersionId;
            const aExpected = new TestDataUtility(oExpectedVariantData).getObjects(fPredicate);
            expect(aVariants.VARIANT_ID).toEqual(aExpected.VARIANT_ID);
            expect(aVariants.CALCULATION_VERSION_ID).toEqual(aExpected.CALCULATION_VERSION_ID);
            expect(aVariants.REPORT_CURRENCY_ID).toEqual(aExpected.REPORT_CURRENCY_ID);
            expect(aVariants.LAST_GENERATED_VERSION_ID).toEqual(aExpected.LAST_GENERATED_VERSION_ID);
            expect(aVariants.LAST_GENERATED_CALCULATION_ID).toEqual(aExpected.LAST_GENERATED_CALCULATION_ID);
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toBe(2);
            //sequence of result set is random
            // expect(aVariants[0].VARIANT_ID).toBe(iValidVariantId);
            // expect(aVariants[1].VARIANT_ID).toBe(iSecondVariantId);
            expect([aVariants[0].VARIANT_ID, aVariants[1].VARIANT_ID].sort()).toEqual([iValidVariantId, iSecondVariantId].sort())
        });

        it("should return an empty array when the requested variant id does not exist for the given calculation version", () => {
            // act
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId, [1234]);

            // assert
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toBe(0);
        });

        it("should return only the variants that exist for the given calculation version", () => {
            // act
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId, [iValidVariantId, 1234]);

            // assert
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toBe(1);
        });

        it("should return the variants ordered by VARIANT_ORDER", () => {
            // arrange
            const oNotOrderedData = new TestDataUtility(testData.oVariantTestData).build();
            oNotOrderedData.CALCULATION_VERSION_ID = Array(4).fill(iCalculationVersionId);
            const aOrderForVariants = [2, 3, 1, 0];
            oNotOrderedData.VARIANT_ORDER = aOrderForVariants;
            oMockstar.clearTable("variant");
            oMockstar.insertTableData("variant", oNotOrderedData);
            // act
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId);
            // assert
            const aSortedOrder = aOrderForVariants.sort();
            aVariants.forEach((oReturnedVariant, iIndex) => {
                expect(oReturnedVariant.VARIANT_ORDER).toBe(aSortedOrder[iIndex]);
            });
        });
    });

    describe("getVariantsInternal", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should return VARIANT_TYPE property", () => {
            //act
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId);

            //assert
            expect(aVariants[0].VARIANT_TYPE).toBe(0);
        });

        it("should return an empty array when the requested variant id does not exist for the given calculation version", () => {
            // act
            const aVariants = oPersistency.Variant.getVariantsInternal(iCalculationVersionId, [1234]);

            // assert
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toBe(0);
        });

        it("should return only the variants that exist for the given calculation version", () => {
            // act
            const aVariants = oPersistency.Variant.getVariantsInternal(iCalculationVersionId, [iValidVariantId, 1234]);

            // assert
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toBe(1);
        });

        it("should return an empty array when no variants for the specified version id have their LAST_MODIFIED_ON field set to null", () => {
            // act
            let aVariantIds;
            const aCopiedVariants = oPersistency.Variant.getVariantsInternal(iCalculationVersionId, aVariantIds, true);
            // assert
            expect(Array.isArray(aCopiedVariants)).toBeTruthy();
            expect(aCopiedVariants.length).toEqual(0);
        });
    });

    describe("getVariant", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should return the variant header for the specified version id and variant id", () => {
            // act
            const aOmit = ["LAST_REMOVED_MARKINGS_ON", "LAST_MODIFIED_ON", "LAST_CALCULATED_ON"];
            const oVariant = oPersistency.Variant.getVariant(iCalculationVersionId, iValidVariantId);

            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iCalculationVersionId && oObject.VARIANT_ID === iValidVariantId;
            const aExpected = new TestDataUtility(oExpectedVariantData).getObjects(fPredicate);
            expect(_.omit(oVariant, aOmit)).toMatchData(_.omit(aExpected[0], aOmit), ["VARIANT_ID", "CALCULATION_VERSION_ID"]);
            expect(_.isObject(oVariant)).toBeTruthy();
        });

        it("should not return anything when the variant id doesn't exist for the specified calculation version id", () => {
            // act
            const oVariant = oPersistency.Variant.getVariant(iCalculationVersionId, 55);

            // assert
            expect(_.isUndefined(oVariant)).toBeTruthy();
        });
    });

    describe("getCopiedVariants", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should return the variants for the given version id that have their LAST_MODIFIED_ON field set to null", () => {
            // act
            oMockstar.clearTable("variant");
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iCalculationVersionId;
            const aVariants = new TestDataUtility(oVariantTestData).getObjects(fPredicate);
            const aCopiedVariants = aVariants.map((oCopiedVariant) => {
                const oVariantNullModidifed = oCopiedVariant;
                oVariantNullModidifed.LAST_MODIFIED_ON = null;
                return oVariantNullModidifed;
            });
            oMockstar.insertTableData("variant", aCopiedVariants);
            const aReturnedVariants = oPersistency.Variant.getCopiedVariants(iCalculationVersionId);
            // assert
            const aOmitFields = ["LAST_REMOVED_MARKINGS_ON", "LAST_CALCULATED_ON"];
            const aKeyFields = ["VARIANT_ID", "CALCULATION_VERSION_ID", "LAST_MODIFIED_ON"];
            expect(Array.isArray(aReturnedVariants)).toBeTruthy();
            //sequence of result set is random
            // expect(_.omit(aReturnedVariants[0], aOmitFields)).toMatchData(_.omit(aCopiedVariants[0], aOmitFields), aKeyFields);
            // expect(_.omit(aReturnedVariants[1], aOmitFields)).toMatchData(_.omit(aCopiedVariants[1], aOmitFields), aKeyFields);
            expect(_.omit(aReturnedVariants[0], aOmitFields)).toMatchData(_.omit(aCopiedVariants.filter(value => value.VARIANT_ID === aReturnedVariants[0].VARIANT_ID)[0], aOmitFields), aKeyFields);
            expect(_.omit(aReturnedVariants[1], aOmitFields)).toMatchData(_.omit(aCopiedVariants.filter(value => value.VARIANT_ID === aReturnedVariants[1].VARIANT_ID)[0], aOmitFields), aKeyFields);
            expect(aReturnedVariants.length).toBe(aCopiedVariants.length);
        });

        it("should return an empty array when no variants for the specified version id have their LAST_MODIFIED_ON field set to null", () => {
            // act
            const aCopiedVariants = oPersistency.Variant.getCopiedVariants(iCalculationVersionId);
            // assert
            expect(Array.isArray(aCopiedVariants)).toBeTruthy();
            expect(aCopiedVariants.length).toEqual(0);
        });

        it("should return an empty array when the calculation version does not exist", () => {
            // act
            const aVariants = oPersistency.Variant.getCopiedVariants(1234);
            // assert
            expect(Array.isArray(aVariants)).toBeTruthy();
            expect(aVariants.length).toEqual(0);
        });

        it("should return an empty array when the variant table is empty", () => {
            // arrange
            oMockstar.clearTable("variant_temporary");
            // act
            const aVariants = oPersistency.Variant.getCopiedVariants(iCalculationVersionId);
            // assert
            expect(aVariants.length).toEqual(0);
            expect(Array.isArray(aVariants)).toBeTruthy();
        });
    });

    describe("getVariantItems", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("check if the non-temporary table is used if the variant is opened by another user", () => {
            // arrange
            const aVariants = oPersistency.Variant.getVariants(iCalculationVersionId);

            oMockstar.execSingle(`UPDATE {{variant_item}} SET QUANTITY = 10;`);
            oMockstar.execSingle(`UPDATE {{variant_item_temporary}} SET QUANTITY = 20;`);
            oMockstar.execSingle(`INSERT INTO {{open_calculation_versions}} VALUES ('SOMEONE', ${iCalculationVersionId}, 'variant_matrix', 1);`);

            // act
            const aVariantItems = oPersistency.Variant.getVariantItems(aVariants[0].VARIANT_ID);

            // assert
            expect(aVariantItems[0].QUANTITY).toBe('10.0000000');
            oMockstar.execSingle(`DELETE FROM {{open_calculation_versions}} WHERE SESSION_ID = 'TESTER';`);
        });

        it("should return an array of variant items for the specified variant", () => {
            // act
            const aVariants = oPersistency.Variant.getVariantItems(iValidVariantId);

            // assert
            const fPredicate = oObject => oObject.VARIANT_ID === iValidVariantId;
            const aExpected = new TestDataUtility(oVariantItemTestData).getObjects(fPredicate);
            expect(aVariants).toMatchData(aExpected, ["VARIANT_ID", "ITEM_ID"]);
        });

        it("should return an array of variant items for the specified variant if passed array for item ids is empty", () => {
            // act
            const aVariants = oPersistency.Variant.getVariantItems(iValidVariantId, []);

            // assert
            const fPredicate = oObject => oObject.VARIANT_ID === iValidVariantId;
            const aExpected = new TestDataUtility(oVariantItemTestData).getObjects(fPredicate);
            expect(aVariants).toMatchData(aExpected, ["VARIANT_ID", "ITEM_ID"]);
        });

        it("should return an empty array when the the combination of variant id and item id does not exist", () => {
            // act
            const aVariants = oPersistency.Variant.getVariantItems(iSecondVariantId, [123]);

            // assert
            expect(aVariants.length).toEqual(0);
            expect(Array.isArray(aVariants)).toBeTruthy();
        });

        it("should return an array of variant items for the specified variant and variant id", () => {
            // act
            const aVariants = oPersistency.Variant.getVariantItems(iSecondVariantId, [2]);

            // assert
            const fPredicate = oObject => oObject.VARIANT_ID === iSecondVariantId && oObject.ITEM_ID === 2;
            const aExpected = new TestDataUtility(oVariantItemTestData).getObjects(fPredicate);
            expect(aVariants).toMatchData(aExpected, ["VARIANT_ID", "ITEM_ID"]);
        });

        it("should return an array of variant items for the given variant id and item ids", () => {
            // arrange
            const fPredicate = oObject => oObject.VARIANT_ID === iSecondVariantId;
            const aItemIds = _.map(new TestDataUtility(oVariantItemTestData).getObjects(fPredicate), "ITEM_ID");
            const iRemovedId = aItemIds.pop();

            // act
            const aVariants = oPersistency.Variant.getVariantItems(iSecondVariantId, aItemIds);

            // assert
            const aExpected = new TestDataUtility(oVariantItemTestData).getObjects(fPredicate);
            const oMissingItem = aExpected.pop();
            expect(aVariants).toMatchData(aExpected, ["VARIANT_ID", "ITEM_ID"]);
            expect(oMissingItem.ITEM_ID).toBe(iRemovedId);
        });

        it("should return only the variant items for which the combination of variant id and item id exists", () => {
            // act
            const fPredicate = oObject => oObject.VARIANT_ID === iSecondVariantId;
            const aItemIds = _.map(new TestDataUtility(oVariantItemTestData).getObjects(fPredicate), "ITEM_ID");
            aItemIds.push(12345);
            const aVariants = oPersistency.Variant.getVariantItems(iSecondVariantId, aItemIds);

            // assert
            const aExpected = new TestDataUtility(oVariantItemTestData).getObjects(fPredicate);
            expect(aVariants).toMatchData(aExpected, ["VARIANT_ID", "ITEM_ID"]);
            expect(aVariants.length).toBe(aItemIds.length - 1);
        });

        it("should return an empty array when the item table is empty", () => {
            // arrange
            oMockstar.clearTable("variant_item");

            // act
            const aVariants = oPersistency.Variant.getVariantItems(iValidVariantId);

            // assert
            expect(aVariants.length).toEqual(0);
            expect(Array.isArray(aVariants)).toBeTruthy();
        });

        it("should return an empty array when in the item table are items for another variant", () => {
            // act
            const aVariants = oPersistency.Variant.getVariantItems(44);

            // assert
            expect(aVariants.length).toEqual(0);
            expect(Array.isArray(aVariants)).toBeTruthy();
        });
    });

    describe("getBaseVersionItems", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should return valid base items for a given calculation version", () => {
            // act
            const aBaseVersionItems = oPersistency.Variant.getBaseVersionItems(iCalculationVersionId);

            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iCalculationVersionId;
            const aExpected = new TestDataUtility(oCalculationVersionItemTestData).getObjects(fPredicate);
            expect(aBaseVersionItems.length).toBe(aExpected.length);
            expect(aBaseVersionItems[0]).toBe(aExpected[0].ITEM_ID);
            expect(aBaseVersionItems[1]).toBe(aExpected[1].ITEM_ID);
        });

        it("should return an empty array when trying to get the items for an unexistent calculation version id", () => {
            // act
            const aBaseVersionItems = oPersistency.Variant.getBaseVersionItems(321);

            // assert
            expect(aBaseVersionItems.length).toBe(0);
        });
    });

    describe("createVariant", () => {
        const iIdOfCalculationVersion = 99;
        const oBodyVariant = {
            VARIANT_NAME: "Variant Version 99",
            COMMENT: "Example Variant Version",
            EXCHANGE_RATE_TYPE_ID: "STANDARD",
            TOTAL_COST: "81150168.0000000",
            REPORT_CURRENCY_ID: "EUR",
            SALES_PRICE: "10000.0000000",
            SALES_PRICE_CURRENCY_ID: "EUR",
            IS_SELECTED: 0,
        };
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should create a variant", () => {
            // act
            const iResult = oPersistency.Variant.createVariant(oBodyVariant, iIdOfCalculationVersion);
            const sGetInsertedVariantStmt = `select * from {{variant_temporary}} where CALCULATION_VERSION_ID = ${iIdOfCalculationVersion} 
                                             and TOTAL_COST = ${oBodyVariant.TOTAL_COST}`;
            const oVariant = oMockstar.execQuery(sGetInsertedVariantStmt).columns;
            // assert
            expect(iResult).toEqual(oVariant.VARIANT_ID.rows[0]);
            expect(oVariant.CALCULATION_VERSION_ID.rows[0]).toEqual(iIdOfCalculationVersion);
            expect(oVariant.VARIANT_NAME.rows[0]).toEqual(oBodyVariant.VARIANT_NAME);
            expect(oVariant.COMMENT.rows[0]).toEqual(oBodyVariant.COMMENT);
            expect(oVariant.EXCHANGE_RATE_TYPE_ID.rows[0]).toEqual(oBodyVariant.EXCHANGE_RATE_TYPE_ID);
            expect(oVariant.TOTAL_COST.rows[0]).toEqual(oBodyVariant.TOTAL_COST.toString());
            expect(oVariant.REPORT_CURRENCY_ID.rows[0]).toEqual(oBodyVariant.REPORT_CURRENCY_ID);
            expect(oVariant.SALES_PRICE.rows[0]).toEqual(oBodyVariant.SALES_PRICE.toString());
            expect(oVariant.SALES_PRICE_CURRENCY_ID.rows[0]).toEqual(oBodyVariant.SALES_PRICE_CURRENCY_ID);
            expect(oVariant.IS_SELECTED.rows[0]).toEqual(oBodyVariant.IS_SELECTED);
        });
    });

    describe("upsertVariantItems", () => {
        const aItems = [{
            VARIANT_ID: iValidVariantId,
            ITEM_ID: 1234,
            IS_INCLUDED: 0,
            QUANTITY: 12345,
            QUANTITY_UOM_ID: "PC",
            TOTAL_QUANTITY: "100",
            TOTAL_COST: "300",
        },
        {
            VARIANT_ID: iValidVariantId,
            ITEM_ID: 1235,
            IS_INCLUDED: 1,
            QUANTITY: 1,
            QUANTITY_UOM_ID: "PC",
            TOTAL_QUANTITY: "1",
            TOTAL_COST: "1",
        },
        ];

        beforeEach(() => {
            oMockstar.clearAllTables();
        });

        it("should create the items for a variant", () => {
            // act
            const sStmt = "select * from {{variant_item}}";
            const oBeforeVariantItems = oMockstar.execQuery(sStmt).columns;
            oPersistency.Variant.upsertVariantItems(oVariantItemTestData.VARIANT_ID[0], aItems, iCalculationVersionId);
            const oAfterVariantItems = oMockstar.execQuery(sStmt).columns;

            // assert
            expect(oBeforeVariantItems.IS_INCLUDED.rows.length).toEqual(0);
            expect(oAfterVariantItems.IS_INCLUDED.rows.length).toEqual(2);
            expect(oAfterVariantItems.VARIANT_ID.rows[0]).toEqual(aItems[0].VARIANT_ID);
            expect(oAfterVariantItems.ITEM_ID.rows[0]).toEqual(aItems[0].ITEM_ID);
        });

        it("should create the items for a variant if second input object have different property sets", () => {
            // arrange
            const aValidItems = [{
                VARIANT_ID: iValidVariantId,
                ITEM_ID: 1234,
                IS_INCLUDED: 0,
                QUANTITY: 12345,
                QUANTITY_UOM_ID: "PC",
                TOTAL_QUANTITY: 100,
                TOTAL_COST: 300,
            },
            {
                VARIANT_ID: iValidVariantId,
                ITEM_ID: 1235,
                IS_INCLUDED: 1,
            },
            ];

            // act
            oPersistency.Variant.upsertVariantItems(oVariantItemTestData.VARIANT_ID[0], aValidItems, iCalculationVersionId);

            // assert
            const oDbResult = oMockstar.execQuery("select * from {{variant_item}}");
            expect(oDbResult).toMatchData({
                VARIANT_ID: [iValidVariantId, iValidVariantId],
                ITEM_ID: [1234, 1235],
                IS_INCLUDED: [0, 1],
                QUANTITY: ['12345.0000000', null],
                QUANTITY_UOM_ID: ["PC", null],
                TOTAL_QUANTITY: ['100.0000000', null],
                TOTAL_COST: ['300.0000000', null],
            }, ["VARIANT_ID", "ITEM_ID"]);
        });

        it("should create the items for a variant if first input object have different property sets", () => {
            // arrange
            const aValidItems = [{
                VARIANT_ID: iValidVariantId,
                ITEM_ID: 1235,
                IS_INCLUDED: 1,
            }, {
                VARIANT_ID: iValidVariantId,
                ITEM_ID: 1234,
                IS_INCLUDED: 0,
                QUANTITY: 12345,
                QUANTITY_UOM_ID: "PC",
                TOTAL_QUANTITY: 100,
                TOTAL_COST: 300,
            },
            ];

            // act
            oPersistency.Variant.upsertVariantItems(oVariantItemTestData.VARIANT_ID[0], aValidItems, iCalculationVersionId);

            // assert
            const oDbResult = oMockstar.execQuery("select * from {{variant_item}}");
            expect(oDbResult).toMatchData({
                VARIANT_ID: [iValidVariantId, iValidVariantId],
                ITEM_ID: [1234, 1235],
                IS_INCLUDED: [0, 1],
                QUANTITY: ['12345.0000000', null],
                QUANTITY_UOM_ID: ["PC", null],
                TOTAL_QUANTITY: ['100.0000000', null],
                TOTAL_COST: ['300.0000000', null],
            }, ["VARIANT_ID", "ITEM_ID"]);
        });


        it("should update the variant items when sending a correct object", () => {
            // act
            const sStmt = `select * from {{variant_item}} where variant_id= ${iValidVariantId} and item_id= ${1}`;
            const aItem = [{
                VARIANT_ID: iValidVariantId,
                ITEM_ID: 1,
                IS_INCLUDED: 0,
                QUANTITY: "12345.0000000",
                QUANTITY_UOM_ID: "PC",
                TOTAL_QUANTITY: "100.0000000",
                TOTAL_COST: "300.0000000",
            }];

            oPersistency.Variant.upsertVariantItems(iValidVariantId, aItem, iCalculationVersionId);
            let aVariantAfterUpdate = oMockstar.execQuery(sStmt);
            aVariantAfterUpdate = mockstarHelpers.convertResultToArray(aVariantAfterUpdate);
            expect(aVariantAfterUpdate.VARIANT_ID[0]).toBe(aItem[0].VARIANT_ID);
            expect(aVariantAfterUpdate.ITEM_ID[0]).toBe(aItem[0].ITEM_ID);
            expect(aVariantAfterUpdate.IS_INCLUDED[0]).toBe(aItem[0].IS_INCLUDED);
            expect(aVariantAfterUpdate.QUANTITY[0]).toBe(aItem[0].QUANTITY.toString());
            expect(aVariantAfterUpdate.QUANTITY_UOM_ID[0]).toBe(aItem[0].QUANTITY_UOM_ID);
            expect(aVariantAfterUpdate.TOTAL_COST[0]).toBe(aItem[0].TOTAL_COST.toString());
        });

        it("should insert a variant item when item id does not exist", () => {
            // act
            const aItem = [{
                VARIANT_ID: iValidVariantId,
                ITEM_ID: 1234,
                IS_INCLUDED: 0,
                QUANTITY: "12345.0000000",
                QUANTITY_UOM_ID: "PC",
                TOTAL_QUANTITY: "100.0000000",
                TOTAL_COST: "300.0000000",
            }];
            const sStmt = `select * from {{variant_item}} where variant_id= ${iValidVariantId} and item_id= ${aItem[0].ITEM_ID}`;

            const aVariantBeforeUpdate = oMockstar.execQuery(sStmt).columns;
            oPersistency.Variant.upsertVariantItems(iValidVariantId, aItem, iCalculationVersionId);
            let aVariantAfterUpdate = oMockstar.execQuery(sStmt);
            expect(aVariantAfterUpdate.columns.ITEM_ID.rows.length).toBe(aVariantBeforeUpdate.ITEM_ID.rows.length + 1);
            aVariantAfterUpdate = mockstarHelpers.convertResultToArray(aVariantAfterUpdate);
            expect(aVariantAfterUpdate.VARIANT_ID[0]).toBe(aItem[0].VARIANT_ID);
            expect(aVariantAfterUpdate.ITEM_ID[0]).toBe(aItem[0].ITEM_ID);
            expect(aVariantAfterUpdate.IS_INCLUDED[0]).toBe(aItem[0].IS_INCLUDED);
            expect(aVariantAfterUpdate.QUANTITY[0]).toBe(aItem[0].QUANTITY.toString());
            expect(aVariantAfterUpdate.QUANTITY_UOM_ID[0]).toBe(aItem[0].QUANTITY_UOM_ID);
            expect(aVariantAfterUpdate.TOTAL_COST[0]).toBe(aItem[0].TOTAL_COST.toString());
        });
    });

    describe("update", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should update the variant when sending a correct object", () => {
            // act
            const sStmt = `select * from {{variant}} where variant_id= ${iValidVariantId}`;
            const aVariant = [{
                VARIANT_ID: iValidVariantId,
                CALCULATION_VERSION_ID: iCalculationVersionId,
                REPORT_CURRENCY_ID: "USD",
            }];
            let aVariantBeforeUpdate = oMockstar.execQuery(sStmt).columns;
            oPersistency.Variant.update(aVariant, aVariantBeforeUpdate, iCalculationVersionId);
            let aVariantAfterUpdate = oMockstar.execQuery(sStmt).columns;

            expect(aVariantAfterUpdate.REPORT_CURRENCY_ID.rows[0]).toBe("USD");
            aVariantBeforeUpdate = _.omit(aVariantBeforeUpdate, ["LAST_MODIFIED_ON", "REPORT_CURRENCY_ID", "LAST_MODIFIED_BY"]);
            aVariantAfterUpdate = _.omit(aVariantAfterUpdate, ["LAST_MODIFIED_ON", "REPORT_CURRENCY_ID", "LAST_MODIFIED_BY"]);
            expect(JSON.parse(JSON.stringify(aVariantBeforeUpdate))).toEqualObject(JSON.parse(JSON.stringify(aVariantAfterUpdate)));
        });

        it("should not update variant when variant_id does not exist", () => {
            // act
            const aUnexistentVariant = [{
                VARIANT_ID: 66,
                CALCULATION_VERSION_ID: 1,
                REPORT_CURRENCY_ID: "EUR",
            }];
            const sStmt = `select * from {{variant}} where variant_id= ${aUnexistentVariant[0].VARIANT_ID}`;
            const aVariantBeforeUpdate = oMockstar.execQuery(sStmt).columns;
            oPersistency.Variant.update(aUnexistentVariant, aVariantBeforeUpdate, 1);
            const aVariantAfterUpdate = oMockstar.execQuery(sStmt).columns;

            // expect no change in the data
            expect(JSON.parse(JSON.stringify(aVariantBeforeUpdate))).toEqualObject(JSON.parse(JSON.stringify(aVariantAfterUpdate)));
        });
    });

    describe("getBaseVersionLastModifiedOn", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should return the valid LAST_MODIFIED_ON for a given calculation version", () => {
            // act
            const oLastModifiedOn = oPersistency.Variant.getBaseVersionLastModifiedOn(iCalculationVersionId);

            // assert
            const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iCalculationVersionId;
            const aExpected = new TestDataUtility(oCalculationVersionTestData).getObjects(fPredicate);
            expect(oLastModifiedOn.toJSON()).toBe(aExpected[0].LAST_MODIFIED_ON);
        });
    });

    describe("deleteNotMatchingVariantItems", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should delete variant items that don't have a match in the base version", () => {
            // act
            const oVariantItemTestDataNoIdMatch = new TestDataUtility(testData.oVariantItemTestData).build();
            oVariantItemTestDataNoIdMatch.ITEM_ID[oVariantItemTestDataNoIdMatch.ITEM_ID.indexOf(3001)] = 1001;
            oVariantItemTestDataNoIdMatch.ITEM_ID[oVariantItemTestDataNoIdMatch.ITEM_ID.indexOf(3002)] = 1002;
            oVariantItemTestDataNoIdMatch.ITEM_ID[oVariantItemTestDataNoIdMatch.ITEM_ID.indexOf(3003)] = 1003;
            oMockstar.clearTable("variant_item");
            oMockstar.insertTableData("variant_item", oVariantItemTestDataNoIdMatch);
            const sStmt = `select * from {{variant_item}} where VARIANT_ID = ${iValidVariantId}`;
            const aBeforeVariantItems = oMockstar.execQuery(sStmt).columns.ITEM_ID;
            oPersistency.Variant.deleteNotMatchingVariantItems(iCalculationVersionId, iValidVariantId);
            const aAfterVariantItems = oMockstar.execQuery(sStmt).columns.ITEM_ID;
            // assert
            expect(aAfterVariantItems.rows.length).toBe(0);
            expect(aBeforeVariantItems.rows.length).toBe(3);
            expect(aBeforeVariantItems.rows[0]).toBe(oVariantItemTestDataNoIdMatch.ITEM_ID[0]);
        });
    });

    describe("deleteVariant", () => {
        const iIdOfCalculationVersion = 99;
        const iNonExistentVariantId = 333;
        const iIdOfVariant = 222;
        const oBodyVariantToDelete = {
            CALCULATION_VERSION_ID: iIdOfCalculationVersion,
            VARIANT_ID: 222,
            VARIANT_NAME: "Variant Version 101",
            COMMENT: "Example Variant Version to Delete",
            EXCHANGE_RATE_TYPE_ID: "STANDARD",
            TOTAL_COST: 81150168,
            REPORT_CURRENCY_ID: "EUR",
            SALES_PRICE: 10000,
            SALES_PRICE_CURRENCY_ID: "EUR",
            IS_SELECTED: 0,
        };

        beforeEach(() => {
            oMockstar.clearAllTables();
        });

        it("should delete a variant", () => {
            // act
            oMockstar.insertTableData("variant", oBodyVariantToDelete);
            const oVariantBefore = oMockstar.execQuery("select * from {{variant}}").columns;
            const iDeleteResult = oPersistency.Variant.deleteVariant(iIdOfCalculationVersion, iIdOfVariant);
            const oVariantAfter = oMockstar.execQuery("select * from {{variant}}").columns;
            // assert
            expect(oVariantBefore.CALCULATION_VERSION_ID.rows.length).toEqual(1);
            expect(oVariantAfter.CALCULATION_VERSION_ID.rows.length).toEqual(0);
            expect(iDeleteResult).toEqual(1);
        });

        it("should not delete a variant if the variant id does not exist for the given calculation version", () => {
            // act
            oMockstar.insertTableData("variant", oBodyVariantToDelete);
            const oVariantBefore = oMockstar.execQuery("select * from {{variant}}").columns;
            const iDeleteResult = oPersistency.Variant.deleteVariant(111, iNonExistentVariantId);
            const oVariantAfter = oMockstar.execQuery("select * from {{variant}}").columns;
            // assert
            expect(oVariantBefore.CALCULATION_VERSION_ID.rows.length).toEqual(oVariantAfter.CALCULATION_VERSION_ID.rows.length);
            expect(iDeleteResult).toEqual(0);
        });
    });

    describe("deleteVariantItems", () => {
        const iNonExistentVariantId = 333;
        const iIdOfVariant = 222;
        const iIdOfSecondVariant = 299;
        const aItemsToDelete = [{
            VARIANT_ID: iIdOfVariant,
            ITEM_ID: 1234,
            IS_INCLUDED: 0,
            QUANTITY: 12345,
            QUANTITY_UOM_ID: "PC",
            TOTAL_QUANTITY: 100,
            TOTAL_COST: 300,
        },
        {
            VARIANT_ID: 222,
            ITEM_ID: 1235,
            IS_INCLUDED: 1,
            QUANTITY: 1,
            QUANTITY_UOM_ID: "PC",
            TOTAL_QUANTITY: 1,
            TOTAL_COST: 1,
        },
        {
            VARIANT_ID: iIdOfSecondVariant,
            ITEM_ID: 5421,
            IS_INCLUDED: 1,
            QUANTITY: 1,
            QUANTITY_UOM_ID: "PC",
            TOTAL_QUANTITY: 1,
            TOTAL_COST: 1,
        },
        ];

        beforeEach(() => {
            oMockstar.clearAllTables();
        });

        it("should delete a variant's items", () => {
            // act
            oMockstar.insertTableData("variant_item", aItemsToDelete);
            const oVariantBefore = oMockstar.execQuery("select * from {{variant_item}}").columns;
            const iDeleteResult = oPersistency.Variant.deleteVariantItems(iIdOfVariant);
            const oVariantAfter = oMockstar.execQuery("select * from {{variant_item}}").columns;
            // assert
            expect(oVariantBefore.VARIANT_ID.rows.length).toEqual(3);
            expect(oVariantAfter.VARIANT_ID.rows.length).toEqual(1);
            expect(iDeleteResult).toEqual(2);
        });
        it("should leave other variant items untouched when deleting a variant's items", () => {
            // act
            oMockstar.insertTableData("variant_item", aItemsToDelete);
            oPersistency.Variant.deleteVariantItems(iIdOfVariant);
            const oVariantAfter = oMockstar.execQuery("select * from {{variant_item}}").columns;
            // assert
            expect(oVariantAfter.VARIANT_ID.rows[0]).toEqual(iIdOfSecondVariant);
        });
        it("should not delete a variant's items if the variant id does not exist", () => {
            // act
            oMockstar.insertTableData("variant_item", aItemsToDelete);
            const oVariantBefore = oMockstar.execQuery("select * from {{variant_item}}").columns;
            const iDeleteResult = oPersistency.Variant.deleteVariantItems(iNonExistentVariantId);
            const oVariantAfter = oMockstar.execQuery("select * from {{variant_item}}").columns;
            // assert
            expect(oVariantBefore.VARIANT_ID.rows.length).toEqual(oVariantAfter.VARIANT_ID.rows.length);
            expect(iDeleteResult).toEqual(0);
        });
    });

    describe("updateVariantItems", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.insertTableData("variant", oVariantTestData);
            oMockstar.insertTableData("variant_item", oVariantItemTestData);
            oMockstar.insertTableData("variant_temporary", oVariantTestData);
            oMockstar.insertTableData("variant_item_temporary", oVariantItemTemporaryTestData);
        });

        it("should update the variant items when sending a correct incomplete variant item", () => {
            // act
            const sStmt = `select * from {{variant_item}} where variant_id= ${iValidVariantId} and item_id= ${3001}`;
            const oItem = [{
                ITEM_ID: 3001,
                QUANTITY: "12345.0000000",
            }];

            let beforeUpdate = oMockstar.execQuery(sStmt).columns;
            oPersistency.Variant.updateVariantItems(iValidVariantId, oItem);
            let afterUpdate = oMockstar.execQuery(sStmt).columns;

            expect(afterUpdate.QUANTITY.rows[0]).toBe(oItem[0].QUANTITY.toString());
            beforeUpdate = _.omit(beforeUpdate, ["QUANTITY"]);
            afterUpdate = _.omit(afterUpdate, ["QUANTITY"]);
            expect(JSON.parse(JSON.stringify(beforeUpdate))).toEqualObject(JSON.parse(JSON.stringify(afterUpdate)));
        });
        it("should update the variant items when sending a correct complete variant item", () => {
            // act
            const sStmt = `select * from {{variant_item}} where variant_id= ${iValidVariantId} and item_id= ${3001}`;
            const oItem = [{
                ITEM_ID: 3001,
                IS_INCLUDED: 1,
                QUANTITY: "12345.0000000",
                QUANTITY_STATE: 1,
                QUANTITY_UOM_ID: "PC",
                TOTAL_QUANTITY: "2828.0000000",
                TOTAL_COST: "10000.0000000",
            }];
            oPersistency.Variant.updateVariantItems(iValidVariantId, oItem);
            const afterUpdate = oMockstar.execQuery(sStmt).columns;
            expect(afterUpdate.ITEM_ID.rows[0]).toBe(oItem[0].ITEM_ID);
            expect(afterUpdate.IS_INCLUDED.rows[0]).toBe(oItem[0].IS_INCLUDED);
            expect(afterUpdate.QUANTITY.rows[0]).toBe(oItem[0].QUANTITY.toString());
            expect(afterUpdate.TOTAL_COST.rows[0]).toBe(oItem[0].TOTAL_COST.toString());
            expect(afterUpdate.TOTAL_QUANTITY.rows[0]).toBe(oItem[0].TOTAL_QUANTITY.toString());
            expect(afterUpdate.QUANTITY_UOM_ID.rows[0]).toBe(oItem[0].QUANTITY_UOM_ID);
        });
        it("should not update variant when item id does not exist", () => {
            // act
            const sStmt = `select * from {{variant_item}} where variant_id= ${iValidVariantId} and item_id= ${12322}`;
            const oItem = [{
                ITEM_ID: 12322,
                QUANTITY: 12345,
            }];
            const beforeUpdate = oMockstar.execQuery(sStmt).columns;
            oPersistency.Variant.updateVariantItems(iValidVariantId, oItem);
            const afterUpdate = oMockstar.execQuery(sStmt).columns;
            // expect no change in the data
            expect(JSON.parse(JSON.stringify(beforeUpdate))).toEqualObject(JSON.parse(JSON.stringify(afterUpdate)));
        });
        it("should not update variant when variant id does not exist", () => {
            // act
            const sStmt = `select * from {{variant_item}} where variant_id= ${1234} and item_id= ${12322}`;
            const oItem = [{
                ITEM_ID: 12322,
                QUANTITY: 12345,
            }];
            const beforeUpdate = oMockstar.execQuery(sStmt).columns;
            oPersistency.Variant.updateVariantItems(1234, oItem);
            const afterUpdate = oMockstar.execQuery(sStmt).columns;
            // expect no change in the data
            expect(JSON.parse(JSON.stringify(beforeUpdate))).toEqualObject(JSON.parse(JSON.stringify(afterUpdate)));
        });
    });

    describe("isLockedInAConcurrentVariantContext()", () => {
        const oOpenCalculationVersions = {
            SESSION_ID: [sUserId, sUserId, "testUser"],
            CALCULATION_VERSION_ID: [1, 2, 3],
            IS_WRITEABLE: [1, 1, 1],
            CONTEXT: [VariantLockContext, CalculationVersionLockContext, VariantLockContext],
        };
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);
        });

        it("should return true if the base version of the variant matrix is locked in the context of variant_matrix by another user", () => {
            const bIsLocked = oPersistency.Variant.isLockedInAConcurrentVariantContext(3);
            expect(bIsLocked).toBe(true);
        });
        it("should return false if the base version of the variant matrix is not locked at all", () => {
            const bIsLocked = oPersistency.Variant.isLockedInAConcurrentVariantContext(4);
            expect(bIsLocked).toBe(false);
        });
        it("should return false if the base version of the variant matrix is locked by the same user", () => {
            const bIsLocked = oPersistency.Variant.isLockedInAConcurrentVariantContext(1);
            expect(bIsLocked).toBe(false);
        });
        it("should return false if the base version of the variant matrix is not locked in the context of variant_matrix", () => {
            const bIsLocked = oPersistency.Variant.isLockedInAConcurrentVariantContext(2);
            expect(bIsLocked).toBe(false);
        });
    });

    describe("generateCalculationVersion", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });
        const iInvalidVariantId = 987;
        const iNumberOfVersionsTestData = oCalculationVersionTestData.CALCULATION_VERSION_ID.length;
        it("should create a new calculation version using the given variant id", () => {
            // act

            const iCalculationVersionsBefore = oMockstar.execQuery("select * from {{calculation_version}}").columns;
            const iGeneratedCVId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            const iCalculationVersionsAfter = oMockstar.execQuery("select * from {{calculation_version}}").columns;
            // assert
            expect(iCalculationVersionsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestData);
            expect(iCalculationVersionsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestData + 1);
            expect(iCalculationVersionsAfter.CALCULATION_VERSION_TYPE.rows[3]).toEqual(CalculationVersionType.GeneratedFromVariant);
            expect(iGeneratedCVId).toBeGreaterThan(0);
        });
        it("should create a new calculation version for a variant that already had a version generated", () => {
            // act

            // create a new calculation version with the default name
            oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            const iNumberOfVersionsTestDataPlusOne = iNumberOfVersionsTestData + 1;
            const iCalculationVersionsBefore = oMockstar.execQuery("select * from {{calculation_version}}").columns;
            const sTestDataCVName = `${oCalculationVersionTestData.CALCULATION_VERSION_NAME[0]} - ${oVariantTestData.VARIANT_NAME[0]}`;
            // create another calculation version using the default name (and as it is already used added 1 to the end of the name)
            const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, `${sCalculationVersionName}1`);
            const iCalculationVersionsAfter = oMockstar.execQuery("select * from {{calculation_version}}").columns;

            // assert
            expect(iCalculationVersionsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestDataPlusOne);
            expect(iCalculationVersionsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestDataPlusOne + 1);
            expect(iCalculationVersionsAfter.CALCULATION_VERSION_TYPE.rows[4]).toEqual(CalculationVersionType.GeneratedFromVariant);
            expect(iNewVersionId).toBeGreaterThan(0);
            expect(sCalculationVersionName).toEqual(sTestDataCVName);
        });
        it("should throw GENERAL_UNEXPECTED_EXCEPTION if the variant id doesn't exist", () => {
            // arrange
            let exception;
            const iCalculationVersionsBefore = oMockstar.execQuery("select * from {{calculation_version}}").columns;

            // act
            try {
                oPersistency.Variant.generateCalculationVersion(iInvalidVariantId, iCalculationId, sCalculationVersionName);
            } catch (e) {
                exception = e;
            }
            const iCalculationVersionsAfter = oMockstar.execQuery("select * from {{calculation_version}}").columns;

            // assert
            expect(exception.code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION);
            expect(iCalculationVersionsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestData);
            expect(iCalculationVersionsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestData);
        });
        it("should get the correct values from the variant when generating a new calculation version", () => {
            // act
            const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            const oGeneratedCalculationVersion = oMockstar.execQuery(`select SALES_PRICE, SALES_PRICE_CURRENCY_ID, REPORT_CURRENCY_ID,
                EXCHANGE_RATE_TYPE_ID, VARIANT_ID, BASE_VERSION_ID from {{calculation_version}} where
                CALCULATION_VERSION_ID = ${iNewVersionId}`).columns;
            const oVariantBase = oPersistency.Variant.getVariant(iCalculationVersionId, iValidVariantId);

            // assert
            expect(oGeneratedCalculationVersion.SALES_PRICE.rows[0]).toEqual(oVariantBase.SALES_PRICE);
            expect(oGeneratedCalculationVersion.SALES_PRICE_CURRENCY_ID.rows[0]).toEqual(oVariantBase.SALES_PRICE_CURRENCY_ID);
            expect(oGeneratedCalculationVersion.REPORT_CURRENCY_ID.rows[0]).toEqual(oVariantBase.REPORT_CURRENCY_ID);
            expect(oGeneratedCalculationVersion.EXCHANGE_RATE_TYPE_ID.rows[0]).toEqual(oVariantBase.EXCHANGE_RATE_TYPE_ID);
            expect(oGeneratedCalculationVersion.VARIANT_ID.rows[0]).toEqual(oVariantBase.VARIANT_ID);
            expect(oGeneratedCalculationVersion.BASE_VERSION_ID.rows[0]).toEqual(oVariantBase.CALCULATION_VERSION_ID);
        });
        it("should get the correct values from the base calculation version when generating a new calculation version", () => {
            // act
            const aOmitColumns = [
                "CALCULATION_VERSION_ID", "CALCULATION_ID", "CALCULATION_VERSION_NAME", "CALCULATION_VERSION_TYPE", "LAST_MODIFIED_ON",
                "SALES_PRICE", "SALES_PRICE_CURRENCY_ID", "REPORT_CURRENCY_ID", "VARIANT_ID", "EXCHANGE_RATE_TYPE_ID", "BASE_VERSION_ID",
            ];
            const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            const iBaseCVId = oMockstar.execQuery(`select CALCULATION_VERSION_ID from {{variant}}
                where VARIANT_ID = ${iValidVariantId}`).columns.CALCULATION_VERSION_ID.rows[0];
            const oGeneratedCalculationVersion = _.omit(oMockstar.execQuery(`select * from {{calculation_version}}
                where CALCULATION_VERSION_ID = ${iNewVersionId}`).columns, aOmitColumns);
            const oBaseCalculationVersion = _.omit(oMockstar.execQuery(`select * from {{calculation_version}}
                where CALCULATION_VERSION_ID = ${iBaseCVId}`).columns, aOmitColumns);

            // assert
            expect(oGeneratedCalculationVersion).toEqual(oBaseCalculationVersion);
        });
        it("should throw GENERAL_UNEXPECTED_EXCEPTION if the user doesn't have the READ privilege for the given calculation", () => {
            // arrange
            oMockstar.clearTable("auth_project");
            let exception;
            const iCalculationVersionsBefore = oMockstar.execQuery("select * from {{calculation_version}}").columns;

            // act
            try {
                oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            } catch (e) {
                exception = e;
            }
            const iCalculationVersionsAfter = oMockstar.execQuery("select * from {{calculation_version}}").columns;

            // assert
            expect(exception.code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION);
            expect(iCalculationVersionsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestData);
            expect(iCalculationVersionsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestData);
        });
        it("should throw GENERAL_UNEXPECTED_EXCEPTION if the user doesn't have the READ privilege for the given calculation parent project", () => {
            // arrange
            oMockstar.clearTable("calculation");
            let exception;
            const iCalculationVersionsBefore = oMockstar.execQuery("select * from {{calculation_version}}").columns;

            // act
            try {
                oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            } catch (e) {
                exception = e;
            }
            const iCalculationVersionsAfter = oMockstar.execQuery("select * from {{calculation_version}}").columns;

            // assert
            expect(exception.code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION);
            expect(iCalculationVersionsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestData);
            expect(iCalculationVersionsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionsTestData);
        });
    });

    describe("generateCalculationVersionItems", () => {
        const iIdOfNewCalculationVersion = 10;
        const iInvalidVariantId = 987;
        const oVariantItemIsIncludedTestData = {
            VARIANT_ID: [iValidVariantId, iValidVariantId, iValidVariantId, 33],
            ITEM_ID: [3001, 3002, 3003, 5001],
            IS_INCLUDED: [1, 1, 0, 0],
            QUANTITY: [1, 1, 1, 1],
            QUANTITY_STATE:[2,1,0,2],
            QUANTITY_CALCULATED:["1.0000000","2.0000000","3.0000000","4.0000000"],
            QUANTITY_UOM_ID: ["pc", "pc", "pc", "pc"],
            TOTAL_QUANTITY: [100, 200, 300, 400],
            TOTAL_COST: [1, 1, 1, 1],
        };
        
        beforeEach(() => {
            oMockstar.clearAllTables();
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                oMockstar.insertTableData("metadata", testData.oMetadataCustTestData);
                oMockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				oMockstar.insertTableData("calculation_version_item_ext", testData.oItemExtData);
			}
            oMockstar.initializeData();
        });

        const iNumberOfVersionItemsTestData = oCalculationVersionItemTestData.CALCULATION_VERSION_ID.length;
        it("should create version items in the given calculation version", () => {
            // act
            const iInitalRowNo = 5;
            const iAddedItemsNo = 3;
            const iCalculationVersionsBefore = oMockstar.execQuery("select * from {{calculation_version_item}}").columns.CALCULATION_VERSION_ID.rows.length;
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                var iCalculationVersionsItemExtBefore = oMockstar.execQuery("select * from {{calculation_version_item_ext}}").columns.CALCULATION_VERSION_ID.rows.length;
            }
            const iCreatedItems = oPersistency.Variant.generateCalculationVersionItems(iIdOfNewCalculationVersion, iValidVariantId);
            const iCalculationVersionsAfter = oMockstar.execQuery("select * from {{calculation_version_item}}").columns.CALCULATION_VERSION_ID.rows.length;
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                var iCalculationVersionsItemExtAfter = oMockstar.execQuery("select * from {{calculation_version_item_ext}}").columns.CALCULATION_VERSION_ID.rows.length;
            }
            // assert
            expect(iCalculationVersionsBefore).toEqual(iInitalRowNo);
            expect(iCalculationVersionsAfter).toEqual(iCalculationVersionsBefore+iAddedItemsNo);
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                expect(iCalculationVersionsItemExtBefore).toEqual(iInitalRowNo);
                expect(iCalculationVersionsItemExtAfter).toEqual(iCalculationVersionsItemExtBefore+iAddedItemsNo);
            }
            expect(iCreatedItems).toEqual(iAddedItemsNo);
        });
        it("should throw GENERAL_UNEXPECTED_EXCEPTION if the variant id doesn't exist", () => {
            // arrange
            let exception;
            const iCalculationVersionItemsBefore = oMockstar.execQuery("select * from {{calculation_version_item}}").columns;

            // act
            try {
                oPersistency.Variant.generateCalculationVersionItems(iIdOfNewCalculationVersion, iInvalidVariantId);
            } catch (e) {
                exception = e;
            }
            const iCalculationVersionItemsAfter = oMockstar.execQuery("select * from {{calculation_version_item}}").columns;

            // assert
            expect(exception.code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION);
            expect(iCalculationVersionItemsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionItemsTestData);
            expect(iCalculationVersionItemsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionItemsTestData);
        });
        it("should throw GENERAL_UNEXPECTED_EXCEPTION if the variant item and calculation version item tables are empty", () => {
            // arrange
            oMockstar.clearTable("variant_item_temporary");
            oMockstar.clearTable("calculation_version_item");
            let exception;
            const iCalculationVersionItemsBefore = oMockstar.execQuery("select * from {{calculation_version_item}}").columns;

            // act
            try {
                oPersistency.Variant.generateCalculationVersionItems(iIdOfNewCalculationVersion, iInvalidVariantId);
            } catch (e) {
                exception = e;
            }
            const iCalculationVersionItemsAfter = oMockstar.execQuery("select * from {{calculation_version_item}}").columns;

            // assert
            expect(exception.code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION);
            expect(iCalculationVersionItemsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(0);
            expect(iCalculationVersionItemsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(0);
        });

        it("should set the correct values for the version items quantity fields, when generating a new version", () => {
            //arrange
            oMockstar.clearTable("variant_item");
            oVariantItemIsIncludedTestData.IS_INCLUDED = [1, 1, 1, 1];
            oMockstar.insertTableData("variant_item", oVariantItemIsIncludedTestData);
            var aExpectedQuantityFields = {
                QUANTITY_IS_MANUAL: [oCalculationVersionItemTestData.QUANTITY_IS_MANUAL[0], oVariantItemIsIncludedTestData.QUANTITY_STATE[1], oVariantItemIsIncludedTestData.QUANTITY_STATE[2]],
                QUANTITY_CALCULATED: [oVariantItemIsIncludedTestData.QUANTITY_CALCULATED[0], oVariantItemIsIncludedTestData.QUANTITY_CALCULATED[1], oVariantItemIsIncludedTestData.QUANTITY_CALCULATED[2]]
            };
            // act
            const aOmitColumns = [
                "CALCULATION_VERSION_ID", "COMMENT", "QUANTITY", "QUANTITY_UOM_ID",
                "TOTAL_QUANTITY", "TOTAL_QUANTITY_UOM_ID", "CREATED_ON", "CREATED_BY", "TOTAL_COST", "PRICE_UNIT_UOM_ID", "QUANTITY_CALCULATED", "QUANTITY_IS_MANUAL", "TOTAL_QUANTITY_OF_VARIANTS"
            ];
            const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            oPersistency.Variant.generateCalculationVersionItems(iNewVersionId, iValidVariantId);
            const iBaseCVId = oMockstar.execQuery(`select CALCULATION_VERSION_ID from {{variant}}
                where VARIANT_ID = ${iValidVariantId}`).columns.CALCULATION_VERSION_ID.rows[0];
            const oGeneratedCalculationVersionItems = _.omit(oMockstar.execQuery(`select * from {{calculation_version_item}}
                where CALCULATION_VERSION_ID = ${iNewVersionId}`).columns, aOmitColumns);
            const oCalculationVersionBaseItems = _.omit(oMockstar.execQuery(`select * from {{calculation_version_item}}
                where CALCULATION_VERSION_ID = ${iBaseCVId}`).columns, aOmitColumns);
            const oActualValuesForQuantityFields = oMockstar.execQuery(`select ITEM_ID, QUANTITY, QUANTITY_CALCULATED, QUANTITY_IS_MANUAL from {{calculation_version_item}}
                                                where CALCULATION_VERSION_ID = ${iNewVersionId}`).columns;

            // assert
            expect(oGeneratedCalculationVersionItems).toEqual(oCalculationVersionBaseItems);
            expect(oActualValuesForQuantityFields.QUANTITY_CALCULATED.rows).toEqual(aExpectedQuantityFields.QUANTITY_CALCULATED);
            expect(oActualValuesForQuantityFields.QUANTITY_IS_MANUAL.rows).toEqual(aExpectedQuantityFields.QUANTITY_IS_MANUAL);
        });
        it("should set the correct values for the version items, when generating a new version", () => {
            // arrange
            const oVariantItemsDb = new TestDataUtility(testData.oVariantItemTestData)
                .pickValues(o => o.VARIANT_ID === iValidVariantId);
            const oExpectedValues = _.pick(oVariantItemsDb, ["ITEM_ID", "VARIANT_ID", "QUANTITY",
                "QUANTITY_UOM_ID", "TOTAL_QUANTITY",
            ]);
            // for the root item QUANTITY/_UOM_ID MUST not be copied from the variants; modify expected data,
            // to match base version data
            oExpectedValues.QUANTITY[0] = oCalculationVersionItemTestData.QUANTITY[0];
            oExpectedValues.QUANTITY_UOM_ID[0] = oCalculationVersionItemTestData.QUANTITY_UOM_ID[0];

            // act
            const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            oExpectedValues.VARIANT_ID = oExpectedValues.VARIANT_ID.map(() => iNewVersionId);
            oPersistency.Variant.generateCalculationVersionItems(iNewVersionId, iValidVariantId);
            // rename calculation_version_id to variant_id in order to use toMatchData matcher
            const oGeneratedCalculationVersionItems = oMockstar.execQuery(`
                    select  item_id,
                            calculation_version_id as variant_id,
                            quantity, quantity_calculated, quantity_is_manual, quantity_uom_id,
                            total_quantity, total_quantity_uom_id, comment from {{calculation_version_item}}
                    where calculation_version_id = ${iNewVersionId}`);

            // assert
            expect(oGeneratedCalculationVersionItems).toMatchData(oExpectedValues, ["ITEM_ID", "VARIANT_ID"]);
            // for the root item COMMENT must be copied form the Variant header
            expect(oGeneratedCalculationVersionItems.columns.COMMENT.rows[0]).toMatch(testData.oVariantTestData.COMMENT[0]);
            expect(oGeneratedCalculationVersionItems.columns.COMMENT.rows[1]).toEqual("");
        });
        it("should get the correct item values from the base calculation version when generating new version", () => {
            // act
            const aOmitColumns = [
                "CALCULATION_VERSION_ID", "COMMENT", "QUANTITY", "QUANTITY_UOM_ID",
                "TOTAL_QUANTITY", "TOTAL_QUANTITY_UOM_ID", "CREATED_ON", "CREATED_BY", "TOTAL_COST", "PRICE_UNIT_UOM_ID", "QUANTITY_CALCULATED", "QUANTITY_IS_MANUAL"
            ];
            const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            oPersistency.Variant.generateCalculationVersionItems(iNewVersionId, iValidVariantId);
            const iBaseCVId = oMockstar.execQuery(`select CALCULATION_VERSION_ID from {{variant}}
                where VARIANT_ID = ${iValidVariantId}`).columns.CALCULATION_VERSION_ID.rows[0];
            const oGeneratedCalculationVersionItems = _.omit(oMockstar.execQuery(`select * from {{calculation_version_item}}
                where CALCULATION_VERSION_ID = ${iNewVersionId}`).columns, aOmitColumns);
            const oCalculationVersionBaseItems = _.omit(oMockstar.execQuery(`select * from {{calculation_version_item}}
                where CALCULATION_VERSION_ID = ${iBaseCVId}`).columns, aOmitColumns);

            // assert
            expect(oGeneratedCalculationVersionItems).toEqual(oCalculationVersionBaseItems);
        });
        it("should get the correct parent and child item price_unit_uom_id when generating new version", () => {
        // act
        // Change the UOM for the parent variant items
        oMockstar.clearTable("variant_item");
        const oTestDataVariantItem = testData.oVariantItemTestData;
        oTestDataVariantItem.QUANTITY_UOM_ID[0] = "EA";
        oTestDataVariantItem.QUANTITY_UOM_ID[1] = "EA";
        oTestDataVariantItem.QUANTITY_UOM_ID[2] = "MIN";
        oMockstar.insertTableData("variant_item", oTestDataVariantItem);
        const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
        oPersistency.Variant.generateCalculationVersionItems(iNewVersionId, iValidVariantId);
        const oGeneratedCalculationVersionItems = oMockstar.execQuery(`select PRICE_UNIT_UOM_ID from {{calculation_version_item}}
            where CALCULATION_VERSION_ID = ${iNewVersionId}`).columns;
        
        // assert
        // check to see if the parent UOM ids are the same as the ones from the variant items they were generated from
        expect(oGeneratedCalculationVersionItems.PRICE_UNIT_UOM_ID.rows[0]).toEqual(oTestDataVariantItem.QUANTITY_UOM_ID[0]);
        expect(oGeneratedCalculationVersionItems.PRICE_UNIT_UOM_ID.rows[1]).toEqual(oTestDataVariantItem.QUANTITY_UOM_ID[1]);
        // check to see if the child UOM id is the same as the one from the base version item
        expect(oGeneratedCalculationVersionItems.PRICE_UNIT_UOM_ID.rows[2]).toEqual(oCalculationVersionItemTestData.PRICE_UNIT_UOM_ID[2]);
        });
        it("should get only the items that have the variant property IS_INCLUDED set to 1 when generating new version", () => {
            // act
            oMockstar.clearTable("variant_item");
            oMockstar.insertTableData("variant_item", oVariantItemIsIncludedTestData);
            const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            oPersistency.Variant.generateCalculationVersionItems(iNewVersionId, iValidVariantId);
            const oGeneratedCalculationVersionItems = oMockstar.execQuery(`select QUANTITY, QUANTITY_UOM_ID,
                TOTAL_QUANTITY, TOTAL_QUANTITY_UOM_ID, TOTAL_COST from {{calculation_version_item}}
                where CALCULATION_VERSION_ID = ${iNewVersionId}`).columns;

            // assert (exemplarily check root item)
            expect(oGeneratedCalculationVersionItems.QUANTITY.rows[0])
                .toEqual(oCalculationVersionItemTestData.QUANTITY[0]);
            expect(oGeneratedCalculationVersionItems.QUANTITY_UOM_ID.rows[0])
                .toEqual(oCalculationVersionItemTestData.QUANTITY_UOM_ID[0]);
        });
        it("should throw GENERAL_UNEXPECTED_EXCEPTION if all variant items have the property IS_INCLUDED set to 0 when generating items", () => {
            // arrange
            // all of the variant items have the is_included set to 0
            // last variant item does not belong to the variant used to generate.
            oVariantItemIsIncludedTestData.IS_INCLUDED = [0, 0, 0, 1];
            oMockstar.clearTable("variant_item");
            oMockstar.insertTableData("variant_item", oVariantItemIsIncludedTestData);
            const iNewVersionId = oPersistency.Variant.generateCalculationVersion(iValidVariantId, iCalculationId, sCalculationVersionName);
            let exception;
            const iCalculationVersionItemsBefore = oMockstar.execQuery("select * from {{calculation_version_item}}").columns;

            // act
            try {
                oPersistency.Variant.generateCalculationVersionItems(iNewVersionId, iValidVariantId);
            } catch (e) {
                exception = e;
            }
            const iCalculationVersionItemsAfter = oMockstar.execQuery("select * from {{calculation_version_item}}").columns;

            // assert
            expect(exception.code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION);
            expect(iCalculationVersionItemsBefore.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionItemsTestData);
            expect(iCalculationVersionItemsAfter.CALCULATION_VERSION_ID.rows.length).toEqual(iNumberOfVersionItemsTestData);
        });
    });

    describe("copyToTemporaryTables", () => {
        beforeEach(() => {
            oMockstar.clearAllTables();
            oMockstar.initializeData();
        });

        it("should move the variant header and variant items for the specified version id into the temporary tables", () => {
            // act
            oPersistency.Variant.copyToTemporaryTables(iCalculationVersionId);
            // assert
            const aParentVariantHeaders = oMockstar.execQuery(`select * from {{variant}} where calculation_version_id = ${iCalculationVersionId}`);
            const aParentVariantItems = oMockstar.execQuery(`select * from {{variant_item}} where variant_id = ${iValidVariantId}`);
            const aMovedVariantHeaders = oMockstar.execQuery(`select * from {{variant_temporary}} where calculation_version_id = ${iCalculationVersionId}`);
            const aMovedVariantItems = oMockstar.execQuery(`select * from {{variant_item_temporary}} where variant_id = ${iValidVariantId}`);
            expect(aParentVariantHeaders).toMatchData(aMovedVariantHeaders, ["VARIANT_ID", "CALCULATION_VERSION_ID"]);
            delete aMovedVariantItems.columns.CALCULATION_VERSION_ID;
            expect(aParentVariantItems).toMatchData(aMovedVariantItems, ["VARIANT_ID"]);
        });
    });

    describe("getExcludedVariantItems", () => {
            beforeEach(() => {
                oMockstar.clearAllTables();
                oMockstar.initializeData();
                oMockstar.clearTable("variant_item");
                oMockstar.insertTableData("variant_item", oExcludedVariantItemsTestData);
                oMockstar.insertTableData("version_item", oItemGeneratedTestData);
            });

            it("should return an empty array if no variant items were excluded", () => {
                // act
                const aExcludedVariantItems = oPersistency.Variant.getExcludedVariantItems(testData.iCalculationVersionId, testData.iVariantId);
                // assert
                expect(aExcludedVariantItems.length).toBe(0);
            });

            it("should return an array with only 1 item if only 1 item was excluded from the variant", () => {
                // act
                const aExcludedVariantItems = oPersistency.Variant.getExcludedVariantItems(testData.iSecondVersionId, testData.iThirdVariantId);
                // assert
                expect(aExcludedVariantItems.length).toBe(1);
                expect(aExcludedVariantItems[0].ITEM_ID).toBe(5001);
                expect(aExcludedVariantItems[0].PREDECESSOR_ITEM_ID).toBe(null);
            });

            it("should return an array with 2 items that were excluded", () => {
                // act
                const aExcludedVariantItems = oPersistency.Variant.getExcludedVariantItems(testData.iCalculationVersionId, testData.iSecondVariantId);
                // assert
                expect(aExcludedVariantItems.length).toBe(2);
                expect(aExcludedVariantItems[0].ITEM_ID).toBe(3002);
                expect(aExcludedVariantItems[0].PREDECESSOR_ITEM_ID).toBe(3001);
                expect(aExcludedVariantItems[1].ITEM_ID).toBe(3003);
                expect(aExcludedVariantItems[1].PREDECESSOR_ITEM_ID).toBe(3002);
            });

            it("should return an empty array if the given variant does not exist", () => {
                // act
                const aExcludedVariantItems = oPersistency.Variant.getExcludedVariantItems(testData.iCalculationVersionId, 1234);
                // assert
                expect(aExcludedVariantItems.length).toBe(0);
            });

            it("should return an empty array if the given version does not exist", () => {
                // act
                const aExcludedVariantItems = oPersistency.Variant.getExcludedVariantItems(12344, testData.iVariantId);
                // assert
                expect(aExcludedVariantItems.length).toBe(0);
            });
        });
        describe("getVersionItemsWrongPredecessor", () => {
            beforeEach(() => {
                oMockstar.clearAllTables();
                oMockstar.initializeData();
                oMockstar.clearTable("variant_item");
                oMockstar.insertTableData("variant_item", oExcludedVariantItemsTestData);
                oMockstar.insertTableData("version_item", oItemGeneratedTestData);
            });

            it("should return an empty array if no variant items were excluded", () => {
                // act
                const aItemsWrongPredecessor = oPersistency.Variant.getVersionItemsWrongPredecessor(testData.iCalculationVersionId, testData.iVariantId);
                // assert
                expect(aItemsWrongPredecessor.length).toBe(0);
            });
            it("should return an empty array if only the last item was excluded", () => {
                // act
                const aItemsWrongPredecessor = oPersistency.Variant.getVersionItemsWrongPredecessor(testData.iSecondVersionId, testData.iThirdVariantId);
                // assert
                expect(aItemsWrongPredecessor.length).toBe(0);
            });
            it("should return all PREDECESSOR_ITEM_IDs that represent items that were excluded before generation from a variant", () => {
                // act
                const aWrongPredecessor = oPersistency.Variant.getVersionItemsWrongPredecessor(testData.iCalculationVersionId, testData.iSecondVariantId);
                // assert
                expect(aWrongPredecessor.length).toBe(1);
                expect(aWrongPredecessor[0].PREDECESSOR_ITEM_ID).toBe(3002);
            });
            it("should return an empty array if the given variant doesn't exist", () => {
                // act
                const aItemsWrongPredecessor = oPersistency.Variant.getVersionItemsWrongPredecessor(testData.iCalculationVersionId, 21211);
                // assert
                expect(aItemsWrongPredecessor.length).toBe(0);
            });
        });
        describe("updateVersionItemsPredecessors", () => {
            beforeEach(() => {
                oMockstar.clearAllTables();
                oMockstar.initializeData();
                oMockstar.insertTableData("version_item", oItemGeneratedTestData);
            });
            const aUpdatePredecessorItems = [{
                CORRECT_PREDECESSOR: 4001,
                PREDECESSOR_TO_CHANGE: 4002,
            }, {
                CORRECT_PREDECESSOR: 4003,
                PREDECESSOR_TO_CHANGE: 4004,
            }];
            it("should not update anything if the given version does not exist", () => {
                // act
                const aUpdatedRows = oPersistency.Variant.updateVersionItemsPredecessors(1234, aUpdatePredecessorItems);
                // assert
                expect(aUpdatedRows[0]).toBe(0);
            });
            it("should correctly update the PREDECESSOR_ITEM_ID for the given items", () => {
                // act
                const aUpdatedRows = oPersistency.Variant.updateVersionItemsPredecessors(testData.iCalculationVersionId, aUpdatePredecessorItems);
                // assert
                expect(aUpdatedRows[0]).toBe(1);
                expect(aUpdatedRows[1]).toBe(1);
                const sGetCurrentPredecessorStmt = `select PREDECESSOR_ITEM_ID from {{version_item}} 
                                                        where CALCULATION_VERSION_ID = ${testData.iCalculationVersionId} 
                                                            and ITEM_ID = 4003 or ITEM_ID = 4005 order by ITEM_ID`;
                const aCorrectPredecessors = oMockstar.execQuery(sGetCurrentPredecessorStmt).columns.PREDECESSOR_ITEM_ID.rows;
                expect(aCorrectPredecessors[0]).toBe(aUpdatePredecessorItems[0].CORRECT_PREDECESSOR);
                expect(aCorrectPredecessors[1]).toBe(aUpdatePredecessorItems[1].CORRECT_PREDECESSOR);
            });
        });
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
