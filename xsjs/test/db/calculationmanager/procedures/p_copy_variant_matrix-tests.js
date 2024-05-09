const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const testData = require("../../../testdata/testdata").data;
const TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;

describe("p_copy_variant_matrix", () => {
    const testPackage = $.session.getUsername().toLowerCase();
    const sCalculationVersionIdSequence = "sap.plc.db.sequence::s_calculation_version";
    let oMockstar = null;

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            testmodel: "sap.plc.db.calculationmanager.procedures/p_copy_variant_matrix",
            substituteTables:
                {
                    calculation_version: "sap.plc.db::basis.t_calculation_version",
                    session: "sap.plc.db::basis.t_session",
                    variant: "sap.plc.db::basis.t_variant",
                    variant_item: "sap.plc.db::basis.t_variant_item",
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

    it("should corectly copy the variants that belong to a calculation version", () => {
        // arrange
        const iBaseCalculationVersionId = testData.iCalculationVersionId;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        const sCopiedVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const sCopiedVariantItemsStmt = `select * from {{variant_item}} variantItem inner join {{variant}} variant 
        on variantItem.variant_id = variant.variant_id where variant.CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const sToCopyVariantItemsStmt = `select * from {{variant_item}} variantItem inner join {{variant}} variant 
        on variantItem.variant_id = variant.variant_id where variant.CALCULATION_VERSION_ID = ${iBaseCalculationVersionId}`;
        const sToCopyVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iBaseCalculationVersionId}`;
        const aToCopyVariants = oMockstar.execQuery(sToCopyVariantsStmt).columns;
        const aToCopyVariantItems = oMockstar.execQuery(sToCopyVariantItemsStmt).columns;
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sTestUser);

        // assert
        const aCopiedVariants = oMockstar.execQuery(sCopiedVariantsStmt).columns;
        const aCopiedVariantItems = oMockstar.execQuery(sCopiedVariantItemsStmt).columns;
        expect(aCopiedVariants.VARIANT_ID.rows).not.toEqual(aToCopyVariants.VARIANT_ID.rows);
        expect(aCopiedVariants.CALCULATION_VERSION_ID.rows).not.toEqual(aToCopyVariants.CALCULATION_VERSION_ID.rows);

        expect(aCopiedVariants.VARIANT_NAME.rows).toEqual(aToCopyVariants.VARIANT_NAME.rows);
        expect(aCopiedVariants.COMMENT.rows).toEqual(aToCopyVariants.COMMENT.rows);
        expect(aCopiedVariants.EXCHANGE_RATE_TYPE_ID.rows).toEqual(aToCopyVariants.EXCHANGE_RATE_TYPE_ID.rows);
        expect(aCopiedVariants.VARIANT_TYPE.rows).toEqual(aToCopyVariants.VARIANT_TYPE.rows);
        expect(aCopiedVariants.TOTAL_COST.rows).toEqual(aToCopyVariants.TOTAL_COST.rows);
        expect(aCopiedVariants.REPORT_CURRENCY_ID.rows).toEqual(aToCopyVariants.REPORT_CURRENCY_ID.rows);
        expect(aCopiedVariants.SALES_PRICE.rows).toEqual(aToCopyVariants.SALES_PRICE.rows);
        expect(aCopiedVariants.SALES_PRICE_CURRENCY_ID.rows).toEqual(aToCopyVariants.SALES_PRICE_CURRENCY_ID.rows);
        expect(aCopiedVariants.VARIANT_ORDER.rows).toEqual(aToCopyVariants.VARIANT_ORDER.rows);
        expect(aCopiedVariants.IS_SELECTED.rows).toEqual(aToCopyVariants.IS_SELECTED.rows);
        expect(aCopiedVariants.LAST_MODIFIED_BY.rows[0]).toBe($.session.getUsername());
        expect(aCopiedVariants.LAST_REMOVED_MARKINGS_BY.rows[0]).toBe($.session.getUsername());
        expect(aCopiedVariantItems.QUANTITY_STATE.rows).toEqual(aToCopyVariantItems.QUANTITY_STATE.rows);
        expect(aCopiedVariantItems.QUANTITY_CALCULATED.rows).toEqual(aToCopyVariantItems.QUANTITY_CALCULATED.rows);
    });

    it("should not copy the LAST_CALCULATED* field from the calculation version", () => {
        // arrange
        const iBaseCalculationVersionId = testData.iCalculationVersionId;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        const sCopiedVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sTestUser);

        // assert
        const aCopiedVariants = oMockstar.execQuery(sCopiedVariantsStmt).columns;
        expect(aCopiedVariants.LAST_CALCULATED_ON.rows[0]).toBe(null);
        expect(aCopiedVariants.LAST_CALCULATED_BY.rows[0]).toBe(null);
        expect(aCopiedVariants.LAST_CALCULATED_ON.rows[1]).toBe(null);
        expect(aCopiedVariants.LAST_CALCULATED_BY.rows[1]).toBe(null);
    });

    it("should set the LAST_MODIFIED_ON field to null to be recognized when first saving the base version", () => {
        // arrange
        const iBaseCalculationVersionId = testData.iCalculationVersionId;
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        const sCopiedVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sTestUser);
        // assert
        const aCopiedVariants = oMockstar.execQuery(sCopiedVariantsStmt).columns;
        expect(aCopiedVariants.LAST_MODIFIED_ON.rows[0]).toBe(null);
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
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sTestUser);
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
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sTestUser);
        // assert
        const sCopiedVariantsStmt = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iNewCalculationVersionId}`;
        const aNewVariantIds = oMockstar.execQuery(sCopiedVariantsStmt).columns.VARIANT_ID.rows;
        const sNewVariantItemssStmt = `select * from {{variant_item}} where VARIANT_ID in (${aNewVariantIds})`;

        const aVariantItemsAfterCopy = oMockstar.execQuery(sNewVariantItemssStmt).columns;
        expect(aVariantItemsAfterCopy.VARIANT_ID.rows.length).toBe(aVariantItemsBeforeCopy.VARIANT_ID.rows.length);
        expect(aVariantItemsAfterCopy.VARIANT_ID.rows).not.toEqual(aVariantItemsBeforeCopy.VARIANT_ID.rows);
        expect(aVariantItemsAfterCopy.ITEM_ID.rows).toEqual(aVariantItemsBeforeCopy.ITEM_ID.rows);
        expect(aVariantItemsAfterCopy.IS_INCLUDED.rows).toEqual(aVariantItemsBeforeCopy.IS_INCLUDED.rows);
        expect(aVariantItemsAfterCopy.QUANTITY.rows).toEqual(aVariantItemsBeforeCopy.QUANTITY.rows);
        expect(aVariantItemsAfterCopy.QUANTITY_UOM_ID.rows).toEqual(aVariantItemsBeforeCopy.QUANTITY_UOM_ID.rows);
        expect(aVariantItemsAfterCopy.TOTAL_QUANTITY.rows).toEqual(aVariantItemsBeforeCopy.TOTAL_QUANTITY.rows);
        expect(aVariantItemsAfterCopy.TOTAL_COST.rows).toEqual(aVariantItemsBeforeCopy.TOTAL_COST.rows);
    });

    it("should not add any new variants if the calculation version doesn't have a variant matrix", () => {
        // arrange
        const iBaseCalculationVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2];
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        const sVariantsStmt = "select * from {{variant}}";
        const aVariantsBeforeCopy = oMockstar.execQuery(sVariantsStmt).columns;
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sTestUser);
        // assert
        const aVariantsAfterCopy = oMockstar.execQuery(sVariantsStmt).columns;
        expect(aVariantsBeforeCopy.VARIANT_ID.rows.length).toBe(aVariantsAfterCopy.VARIANT_ID.rows.length);
    });

    it("should not add any new variant items if the calculation version doesn't have a variant matrix", () => {
        // arrange
        const iBaseCalculationVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2];
        const sGetNextCvIdStmt = `select "${sCalculationVersionIdSequence}".nextval as newCalculationVersionId from dummy`;
        const iNewCalculationVersionId = parseInt(oMockstar.execQuery(sGetNextCvIdStmt).columns.NEWCALCULATIONVERSIONID.rows[0], 10);
        const sVariantItemsStmt = "select * from {{variant_item}}";
        const aVariantItemsBeforeCopy = oMockstar.execQuery(sVariantItemsStmt).columns;
        // act
        oMockstar.call(iBaseCalculationVersionId, iNewCalculationVersionId, testData.sTestUser);
        // assert
        const aVariantItemsAfterCopy = oMockstar.execQuery(sVariantItemsStmt).columns;
        expect(aVariantItemsBeforeCopy.ITEM_ID.rows.length).toBe(aVariantItemsAfterCopy.ITEM_ID.rows.length);
    });
}).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
