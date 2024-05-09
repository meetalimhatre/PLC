const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const testData = require("../../../testdata/testdata").data;
const TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;
const CalculationVersionTypes = require("../../../../lib/xs/util/constants").CalculationVersionType;
const _ = require("lodash");

describe("p_calculation_version_copy", () => {
    const testPackage = $.session.getUsername().toLowerCase();
    const sCalculationVersionIdSequence = "sap.plc.db.sequence::s_calculation_version";
    let oMockstar = null;
    const sSessionIdLong = 'Contributor_with_Admin_CFF_Prices_Finance';

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_copy",
            substituteTables:
                {
                    calculation_version: "sap.plc.db::basis.t_calculation_version",
                    session: "sap.plc.db::basis.t_session",
                    variant: "sap.plc.db::basis.t_variant",
                    variant_item: "sap.plc.db::basis.t_variant_item",
                    calculation_version_temporary: "sap.plc.db::basis.t_calculation_version_temporary",
                },
        });
    });

    afterOnce(() => {
        oMockstar.cleanup(`${testPackage}sap.plc.db.calculationmanager.procedures`);
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
        oMockstar.insertTableData("session", testData.oSessionTestData);
        oMockstar.insertTableData("variant", testData.oVariantTestData);
        oMockstar.insertTableData("variant_item", testData.oVariantItemTestData);
        oMockstar.initializeData();
    });

    it("should copy all the variants that belong to a calculation version", () => {
        // arrange
        const iBaseCalculationVersionId = testData.iCalculationVersionId;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        const sVariantsStmt = "select * from {{variant}}";
        const aVariantsBeforeCopy = oMockstar.execQuery(sVariantsStmt).columns;
        const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iBaseCalculationVersionId;
        const aVersionVariants = new TestDataUtility(testData.oVariantTestData).getObjects(fPredicate);
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sSessionId, null, null);
        // assert
        const aVariantsAfterCopy = oMockstar.execQuery(sVariantsStmt).columns;
        expect(aVariantsBeforeCopy.VARIANT_ID.rows.length + aVersionVariants.length).toBe(aVariantsAfterCopy.VARIANT_ID.rows.length);
    });

    it("should copy all the variant items that belong to a calculation version", () => {
        // arrange
        const iBaseCalculationVersionId = testData.iCalculationVersionId;
        const sVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iBaseCalculationVersionId}`;
        const aOldVariantIds = oMockstar.execQuery(sVariantsStmt).columns.VARIANT_ID.rows;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        const sVariantItemssStmt = `select * from {{variant_item}} where VARIANT_ID in (${aOldVariantIds})`;
        const aVariantItemsBeforeCopy = oMockstar.execQuery(sVariantItemssStmt).columns;
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sSessionId, null, null);
        // assert
        const sCopiedVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const aNewVariantIds = oMockstar.execQuery(sCopiedVariantsStmt).columns.VARIANT_ID.rows;
        const sNewVariantItemssStmt = `select * from {{variant_item}} where VARIANT_ID in (${aNewVariantIds})`;

        const aVariantItemsAfterCopy = oMockstar.execQuery(sNewVariantItemssStmt).columns;
        expect(aVariantItemsAfterCopy.VARIANT_ID.rows.length).toBe(aVariantItemsBeforeCopy.VARIANT_ID.rows.length);
        expect(aVariantItemsAfterCopy.VARIANT_ID.rows).not.toEqual(aVariantItemsBeforeCopy.VARIANT_ID.rows);
        expect(aVariantItemsAfterCopy.ITEM_ID.rows).toEqual(aVariantItemsBeforeCopy.ITEM_ID.rows);
    });
    it("should set the CALCULATION_VERSION_TYPE = 1(Base) when copying a version of type 4 (Generated from variant)", () => {
        // arrange
        oMockstar.clearTable("calculation_version");
        oMockstar.insertTableData("calculation_version", testData.oCalculationVersionForVariantTestData);
        const iCopiedCalculationVersionId = testData.oCalculationVersionForVariantTestData.CALCULATION_VERSION_ID[2];
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        // act
        oMockstar.call(iCopiedCalculationVersionId, iNewCalculationVersionId, testData.sSessionId, null, null);
        // assert
        const sGetNewVersionStmt = `select CALCULATION_VERSION_TYPE from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iNewVersionType = oMockstar.execQuery(sGetNewVersionStmt).columns.CALCULATION_VERSION_TYPE.rows[0];

        const sGetOldVersionStmt = `select CALCULATION_VERSION_TYPE from {{calculation_version}} 
                                        where CALCULATION_VERSION_ID = ${iCopiedCalculationVersionId}`;
        const iOldVersionType = oMockstar.execQuery(sGetOldVersionStmt).columns.CALCULATION_VERSION_TYPE.rows[0];
        expect(iNewVersionType).toBe(CalculationVersionTypes.Base);
        expect(iOldVersionType).toBe(CalculationVersionTypes.GeneratedFromVariant);
    });
    it("should not throw error when session id is 41 characters longs and copy all the variants that belong to a calculation version", () => {
        // arrange
        const iBaseCalculationVersionId = testData.iCalculationVersionId;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        const sVariantsStmt = "select * from {{variant}}";
        const aVariantsBeforeCopy = oMockstar.execQuery(sVariantsStmt).columns;
        const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iBaseCalculationVersionId;
        const aVersionVariants = new TestDataUtility(testData.oVariantTestData).getObjects(fPredicate);
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, sSessionIdLong, null, null);
        // assert
        const aVariantsAfterCopy = oMockstar.execQuery(sVariantsStmt).columns;
        expect(aVariantsBeforeCopy.VARIANT_ID.rows.length + aVersionVariants.length).toBe(aVariantsAfterCopy.VARIANT_ID.rows.length);
    });

    it("should copy MATERIAL_PRICE_STRATEGY_ID and ACTIVITY_PRICE_STRATEGY_ID into t_calculation_version_temporary when copying a version", () => {
        // arrange
        const iBaseCalculationVersionId = testData.iCalculationVersionId;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);

        const sVersionStmt = `select MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID from {{calculation_version}}
                                    where CALCULATION_VERSION_ID = ${iBaseCalculationVersionId}`;
        const iMaterialPriceIdBefore = oMockstar.execQuery(sVersionStmt).columns.MATERIAL_PRICE_STRATEGY_ID.rows[0];
        const iActivityPriceIdBefore = oMockstar.execQuery(sVersionStmt).columns.ACTIVITY_PRICE_STRATEGY_ID.rows[0];
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sSessionId, null, null);
        // assert
        const sCopiedVersionStmt = `select MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID from {{calculation_version_temporary}}
                                    where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iMaterialPriceIdAfter = oMockstar.execQuery(sCopiedVersionStmt).columns.MATERIAL_PRICE_STRATEGY_ID.rows[0];
        const iActivityPriceIdAfter = oMockstar.execQuery(sCopiedVersionStmt).columns.ACTIVITY_PRICE_STRATEGY_ID.rows[0];

        expect(iMaterialPriceIdBefore[0]).toBe(iMaterialPriceIdAfter[0]);
        expect(iActivityPriceIdBefore[0]).toBe(iActivityPriceIdAfter[0]);
    });

    it("should set the CALCULATION_VERSION_TYPE = 1(Base) when copying a version of type 16 (Manual Lifecycle Version)", () => {
        // arrange
        let iManualVersionId = 5899;
        oMockstar.clearTable("calculation_version");
        oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
        let aExistingCalculationManualVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([2]);
		_.extend(aExistingCalculationManualVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iManualVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iManualVersionId,
				"CALCULATION_VERSION_TYPE" : 16,
				"LIFECYCLE_PERIOD_FROM" : 5000,   
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2]
        });	
        oMockstar.insertTableData("calculation_version", aExistingCalculationManualVersionTestData);
        const iCopiedCalculationVersionId = iManualVersionId;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        // act
        oMockstar.call(iCopiedCalculationVersionId, iNewCalculationVersionId, testData.sSessionId, null, null);
        // assert
        const sGetNewVersionStmt = `select CALCULATION_VERSION_TYPE from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iNewVersionType = oMockstar.execQuery(sGetNewVersionStmt).columns.CALCULATION_VERSION_TYPE.rows[0];

        const sGetNewVersionNameStmt = `select CALCULATION_VERSION_NAME from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iNewVersionName = oMockstar.execQuery(sGetNewVersionNameStmt).columns.CALCULATION_VERSION_NAME.rows[0];

        const sGetNewBaseVersionIdStmt = `select BASE_VERSION_ID from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iGetNewBaseVersionId = oMockstar.execQuery(sGetNewBaseVersionIdStmt).columns.BASE_VERSION_ID.rows[0];

        const sGetNewLifecyclePeriodStmt = `select LIFECYCLE_PERIOD_FROM from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iGetNewLifecyclePeriod = oMockstar.execQuery(sGetNewLifecyclePeriodStmt).columns.LIFECYCLE_PERIOD_FROM.rows[0];

        expect(iNewVersionType).toBe(CalculationVersionTypes.Base);
        expect(iNewVersionName).toBe("Calc vers" + iManualVersionId);
        expect(iGetNewBaseVersionId).toBe(null);
        expect(iGetNewLifecyclePeriod).toBe(null);
    });

    it("should set the CALCULATION_VERSION_TYPE = 1(Base) when copying a version of type 2 (Lifecycle Version)", () => {
        // arrange
        let iLifecycleVersionId = 5899; 
        oMockstar.clearTable("calculation_version");
        oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
        let aExistingCalculationManualVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([2]);
		_.extend(aExistingCalculationManualVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iLifecycleVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iLifecycleVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : 5000,   
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2]
        });	
        oMockstar.insertTableData("calculation_version", aExistingCalculationManualVersionTestData);
        const iCopiedCalculationVersionId = iLifecycleVersionId;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        // act
        oMockstar.call(iCopiedCalculationVersionId, iNewCalculationVersionId, testData.sSessionId, null, null);
        // assert
        const sGetNewVersionStmt = `select CALCULATION_VERSION_TYPE from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iNewVersionType = oMockstar.execQuery(sGetNewVersionStmt).columns.CALCULATION_VERSION_TYPE.rows[0];

        const sGetNewVersionNameStmt = `select CALCULATION_VERSION_NAME from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iNewVersionName = oMockstar.execQuery(sGetNewVersionNameStmt).columns.CALCULATION_VERSION_NAME.rows[0];

        const sGetNewBaseVersionIdStmt = `select BASE_VERSION_ID from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iGetNewBaseVersionId = oMockstar.execQuery(sGetNewBaseVersionIdStmt).columns.BASE_VERSION_ID.rows[0];

        const sGetNewLifecyclePeriodStmt = `select LIFECYCLE_PERIOD_FROM from {{calculation_version_temporary}} 
                                        where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const iGetNewLifecyclePeriod = oMockstar.execQuery(sGetNewLifecyclePeriodStmt).columns.LIFECYCLE_PERIOD_FROM.rows[0];

        expect(iNewVersionType).toBe(CalculationVersionTypes.Base);
        expect(iNewVersionName).toBe("Calc vers" + iLifecycleVersionId);
        expect(iGetNewBaseVersionId).toBe(null);
        expect(iGetNewLifecyclePeriod).toBe(null);
    });
}).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
