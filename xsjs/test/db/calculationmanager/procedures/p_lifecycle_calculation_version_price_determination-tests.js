const _               = require("lodash");
const ItemCategory    = require("../../../../lib/xs/util/constants").ItemCategory;
const MockstarFacade  = require("../../../testtools/mockstar_facade").MockstarFacade;
const MockstarHelpers = require("../../../testtools/mockstar_helpers");
const testdata        = require("../../../testdata/testdata").data;
const TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;



describe("p_lifecycle_calculation_version_price_determination-tests", function() {

    // the following test data will be arranged
    // CALCULATION_VERSION_ID       LIFECYCLE_PERIOD_FROM       VERSION_TYPE        BASE_VERSION_ID
    //      2809                        null                    1                   null
    //      1001                        1404 (2017)             2                   2809
    //      1002                        1416 (2018)             2                   2809            <---- used for price determination tests
    //      1003                        1428 (2019)             2                   2809
    // 
    // Each item version has the 3 items: has 3 items 3001 <- 3002 <- 3003; 3003 is the leaf item 
    // Price determination should only affect the leaf item 3003 of each version

    const aTestVersions = [];

    const iBaseVersionId = testdata.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
    const iCalculationId = testdata.oCalculationVersionTestData.CALCULATION_ID[0];
    const iLifecycleVersionIdBefore = 1001;
    const iLifecycleVersionIdForTest = 1002;
    const iLifecycleVersionIdAfter = 1003;
    const sProjectId = testdata.oProjectTestData.PROJECT_ID[0];
    const sControllingAreaId = testdata.oProjectTestData.CONTROLLING_AREA_ID[0];
    const sExpectedPriceSourceId = "PLC_SURCHARGED_PRICE";
    const iExpectedPriceSourceType = 5;
    
    var mockstar;
    const dDayBeforeYesterday = new Date();
    dDayBeforeYesterday.setDate(dDayBeforeYesterday.getDate() - 2);
    // first definition of group 100 is used to ensure that _valid from/to is handled correctly
    // group 1000 is defined in another controlling area and used to check that the logic is handling this correctly
    const oAccountAccountGroupData = {
        ACCOUNT_GROUP_ID   : [                100,                 100,                  150,                  1000],
        FROM_ACCOUNT_ID    : [           "ZZZZZZ",               "100",                "150",                 "100"],
        TO_ACCOUNT_ID      : [               null,               "190",                "199",                 "200"],
        _VALID_FROM        : [dDayBeforeYesterday, testdata.oYesterday,  testdata.oYesterday,   testdata.oYesterday],
        _VALID_TO          : [testdata.oYesterday,                null,                 null,                  null],
        _SOURCE            : [                  1,                   1,                    1,                     1],
        _CREATED_BY: [ testdata.sTestUser,  testdata.sTestUser,   testdata.sTestUser,    testdata.sTestUser]
    };

     // a bug was caused by a missing check on _valid_from/to of t_account group; for this reason it's important to maintain also outdated data for this test
    const oAccountGroupData = {
        ACCOUNT_GROUP_ID    : [                       100,                 100,                        150,                 150,                 1000],
        CONTROLLING_AREA_ID : [        sControllingAreaId,  sControllingAreaId,         sControllingAreaId,  sControllingAreaId,               "C_NA"],
        COST_PORTION        : [                         '0.0000000',                   '0.0000000',                          '0.0000000',                   '0.0000000',                    '0.0000000'],
        _VALID_FROM         : ["2017-01-01T00:00:00.000Z", testdata.oYesterday, "2017-01-01T00:00:00.000Z", testdata.oYesterday, testdata.oYesterday,],
        _VALID_TO           : [       testdata.oYesterday,                null,        testdata.oYesterday,                null,                null,],
        _SOURCE             : [                         1,                   1,                          1,                   1,                   1,],
        _CREATED_BY : [        testdata.sTestUser,  testdata.sTestUser,         testdata.sTestUser,  testdata.sTestUser,  testdata.sTestUser,]
    };
    
    // For each lifecycle version in test the following items structure is inserted:
    //                   0
    //               /      \
    //              1       2
    //            /  \      |
    //          11   12     21
    // The values of the items differ between in version in order to make sure that the procedure is not overriding values which should be preserved across the versions
    // 
    // The different items in the version have the following purpose: 
    // - Expected Surcharges for items 11 and 21
    // - For item 11 the price determination will find a price; for 21 not
    // - Item 12 is a leaf item but of a category that should not be affected by price determination/surcharges (or copy of values to future versions)
    const oItems = {
        ITEM_ID                         : [0,         1,      11,      12,      2,   21,       0,         1,      11,      12,      2,      21,      0,         1,      11,      12,      2,      21],
        CALCULATION_VERSION_ID          : [1001,   1001,    1001,    1001,   1001, 1001,       1002,   1002,    1002,    1002,   1002,    1002,      1003,   1003,    1003,    1003,   1003,    1003],
        ITEM_CATEGORY_ID                : [0   ,      2,       2,      10,      1,    2,       0   ,      2,       2,      10,      1,       2,      0   ,      2,       2,      10,      1,       2],
        PARENT_ITEM_ID                  : [null,      0,       1,       1,      0,    2,       null,      0,       1,       1,      0,       2,      null,      0,       1,       1,      0,       2],
        MATERIAL_ID                     : [null,   null,    null,    null,   null, null,       null,   null,    null,    null,   null,    null,      null,   null,    null,    null,   null,    null],
        MATERIAL_GROUP_ID               : [null,   null,    null,    null,   null, null,       null,   null,    null,    null,   null,    null,      null,   null,    null,    null,   null,    null],
        MATERIAL_TYPE_ID                : [null,   null,    null,    null,   null, null,       null,   null,    null,    null,   null,    null,      null,   null,    null,    null,   null,    null],
        PLANT_ID                        : [null,   null,    null,    null,   null, null,       null,   null,    null,    null,   null,    null,      null,   null,    null,    null,   null,    null],
        VENDOR_ID                       : [null,   null,    null,    null,   null, null,       null,   null,    null,    null,   null,    null,      null,   null,    null,    null,   null,    null],
        ACTIVITY_TYPE_ID                : [null,   null,    null,    null,   null, null,       null,   null,    null,    null,   null,    null,      null,   null,    null,    null,   null,    null],
        COST_CENTER_ID                  : [null,   null,    null,    null,   null, null,       null,   null,    null,    null,   null,    null,      null,   null,    null,    null,   null,    null],
        PRICE_SOURCE_ID                 : [null,   null,    null,    "P1",   null, null,       null,   null,    null,    "P2",   null,    null,      null,   null,    null,    "P3",   null,    null],
        PRICE_SOURCE_TYPE_ID            : [null,   null,    null,     250,   null, null,       null,   null,    null,     251,   null,    null,      null,   null,    null,     252,   null,    null],
        IS_PRICE_SPLIT_ACTIVE           : [0,         0,      0,      0,      0,   0,       0,         0,      0,      0,      0,      0,      0,         0,      0,      0,      0,      0],
        PRICE_ID                        : [null,   null,    null,    null,   null, null,       null,   null,    null,    null,   null,    null,      null,   null,    null,    null,   null,    null],
        CONFIDENCE_LEVEL_ID             : [null,   null,    null,       1,   null, null,       null,   null,    null,       2,   null,    null,      null,   null,    null,       3,   null,    null],
        PRICE_FIXED_PORTION             : [null,   null,    "11.0000000",    "-2.0000000",   null, "21.0000000",       null,   null,    "11.0000000",    "-6.0000000",   null,    "21.0000000",      null,   null,    "11.0000000",   "-10.0000000",   null,    "21.0000000"],
        PRICE_VARIABLE_PORTION          : [null,   null,   "1.1000000",    "-3.0000000",   null,"2.1000000",       null,   null,   "1.1000000",    "-7.0000000",   null,   "2.1000000",      null,   null,   "1.1000000",   "-11.0000000",   null,   "2.1000000"],
        TRANSACTION_CURRENCY_ID         : [null,   null,    null,    "T1",   null, null,       null,   null,    null,    "T2",   null,    null,      null,   null,    null,    "T3",   null,    null],
        PRICE_UNIT                      : [null,   null,    "11.0000000",    "-4.0000000",   null, null,       null,   null,    "11.0000000",    "-8.0000000",   null,    null,      null,   null,    "11.0000000",   "-12.0000000",   null,    null],
        PRICE_UNIT_UOM_ID               : [null,   null,    null,    "R1",   null, null,       null,   null,    null,    "R2",   null,    null,      null,   null,    null,    "R3",   null,    null],
        IS_DISABLING_PRICE_DETERMINATION: [null,   null,    null,       1,   null, null,       null,   null,    null,       0,   null,    null,      null,   null,    null,       1,   null,    null],
        PURCHASING_GROUP                : [null,   null,    null,    "G1",   null, null,       null,   null,    null,    "G2",   null,    null,      null,   null,    null,    "G3",   null,    null],
        PURCHASING_DOCUMENT             : [null,   null,    null,    "D1",   null, null,       null,   null,    null,    "D2",   null,    null,      null,   null,    null,    "D3",   null,    null],
        LOCAL_CONTENT                   : [null,   null,    null,    "-5.0000000",   null, null,       null,   null,    null,    "-9.0000000",   null,    null,      null,   null,    null,   "-13.0000000",   null,    null],
        BASE_QUANTITY                   : [ "1.0000000",    "1.0000000",     "1.0000000",     "1.0000000",    "1.0000000",  "1.0000000",        "1.0000000",    "1.0000000",     "1.0000000",     "1.0000000",    "1.0000000",     "1.0000000",       "1.0000000",    "1.0000000",     "1.0000000",     "1.0000000",    "1.0000000",     "1.0000000"]
    };
    
    const oPriceDeterminationOutput = {
        ITEM_ID                      : [11],
        VENDOR_ID                    : ["VEN_1"],
        PRICE_FIXED_PORTION          : ['100.0000000'],
        PRICE_VARIABLE_PORTION       : ["200.0000000"],
        TRANSACTION_CURRENCY_ID: ["USD"],
        PRICE_UNIT                   : ["1.0000000"],
        PRICE_UNIT_UOM_ID            : ["PC"],
        IS_PRICE_SPLIT_ACTIVE        : [0],
        PRICE_ID                     : ["683444444444"],
        CONFIDENCE_LEVEL_ID          : [2],
        PRICE_SOURCE_ID              : ["SOURCE_1"],
        PRICE_SOURCE_TYPE_ID            : [3],
        PURCHASING_GROUP             : ["GROUP_1"],
        PURCHASING_DOCUMENT          : ["DOC_1"],
        LOCAL_CONTENT                : ["4.0000000"],
    };
    if (jasmine.plcTestRunParameters.generatedFields === true) {
        _.extend(oPriceDeterminationOutput, {
            CMPR_BOOLEAN_INT_MANUAL          : [1],
            CMPR_BOOLEAN_INT_UNIT            : ['A'],
            CMPR_DECIMAL_MANUAL              : ["2.1000000"],
            CMPR_DECIMAL_UNIT                : ['B'],
            CMPR_DECIMAL_WITH_CURRENCY_MANUAL: ["3.1000000"],
            CMPR_DECIMAL_WITH_CURRENCY_UNIT  : ['C'],
            CMPR_DECIMAL_WITH_UOM_MANUAL     : ["4.1000000"],
            CMPR_DECIMAL_WITH_UOM_UNIT       : ['D']
        });
    }
    
    const oTotalQuantitiesData = {
       PROJECT_ID                          : ['PR1'],
       CALCULATION_ID                   : [    iCalculationId],
       CALCULATION_VERSION_ID           : [    iBaseVersionId], 
       MATERIAL_PRICE_SURCHARGE_STRATEGY: [   "NO_SURCHARGES"],
       ACTIVITY_PRICE_SURCHARGE_STRATEGY: [   "NO_SURCHARGES"],
       LAST_MODIFIED_ON                 : [        new Date()],
       LAST_MODIFIED_BY         : [testdata.sTestUser]
    };

    const oProjectLifecyclePeriodTypeData = {
        "PROJECT_ID":		[ 'PR1', 'PR1', 'PR1' ],
        "YEAR":				[ 2017, 2018, 2019 ],
        "PERIOD_TYPE" :		[ 'YEARLY', 'YEARLY', 'YEARLY' ],
        "LAST_MODIFIED_ON": [ "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000" ],
        "LAST_MODIFIED_BY": [ "#CONTROLLER", "#CONTROLLER", "#CONTROLLER" ]
    };

    const oProjectMonthlyLifecyclePeriod = {
        "PROJECT_ID": ['PR1', 'PR1', 'PR1'],
        "YEAR": [2017, 2018, 2019],
        "SELECTED_MONTH": [1, 1, 3],
        "MONTH_DESCRIPTION": ["M1", "M1", "M3"],
        "LAST_MODIFIED_ON": ["2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000"],
        "LAST_MODIFIED_BY": ["#CONTROLLER", "#CONTROLLER", "#CONTROLLER"]
    };

    beforeOnce(function() {

        mockstar = new MockstarFacade({
            // testmodel: "sap.plc.db.calculationmanager.procedures/p_lifecycle_calculation_version_price_determination",
            testmodel: {
                isTemplateProc: true,
                createTemplateEngineContextObject: true,
                name: "db.calculationmanager.procedures::p_lifecycle_calculation_version_price_determination",
                testProc: "sap.plc_test.db.calculationmanager.procedures::p_lifecycle_calculation_version_price_determination"
            },
            substituteTemplateProcs: [{
                    name: "sap.plc.db.calculationmanager.procedures::p_item_price_determination_all",
                    testProc: "sap.plc_test.db.calculationmanager.procedures::p_item_price_determination_all_fake"
                }
            ],
            substituteTables: {
                calculation: {
                    name: "sap.plc.db::basis.t_calculation",
                    data: testdata.oCalculationTestData
                },
                project: {
                    name: "sap.plc.db::basis.t_project",
                    data: testdata.oProjectTestData
                },
                calculation_version: {
                    name: "sap.plc.db::basis.t_calculation_version",
                },
                item: {
                    name: "sap.plc.db::basis.t_item"
                },
                item_ext: {
                    name: "sap.plc.db::basis.t_item_ext",
                },
                material: {
                    name: "sap.plc.db::basis.t_material",
                    data: testdata.oMaterialTestDataPlc
                },
                account_group: {
                    name: "sap.plc.db::basis.t_account_group",
                    data: oAccountGroupData
                },
                account_account_group: {
                    name: "sap.plc.db::basis.t_account_account_group",
                    data: oAccountAccountGroupData
                },
                material_price_surcharges: {
                    name: "sap.plc.db::basis.t_project_material_price_surcharges",
                },
                material_price_surcharge_values: {
                    name: "sap.plc.db::basis.t_project_material_price_surcharge_values",
                },
                activity_price_surcharges: {
                    name: "sap.plc.db::basis.t_project_activity_price_surcharges",
                },
                activity_price_surcharge_values: {
                    name: "sap.plc.db::basis.t_project_activity_price_surcharge_values",
                },
                project_lifecycle_configuration: {
                    name: "sap.plc.db::basis.t_project_lifecycle_configuration",
                },
                project_lifecycle_period_type: {
                    name: "sap.plc.db::basis.t_project_lifecycle_period_type",
                    data: oProjectLifecyclePeriodTypeData
                },
                project_monthly_lifecycle_period: {
                    name: "sap.plc.db::basis.t_project_monthly_lifecycle_period",
                    data: oProjectMonthlyLifecyclePeriod
                }
            }
        });
    });

    afterOnce(function() {
        mockstar.cleanup();
    });

    beforeEach(function() {
        mockstar.clearAllTables();
        mockstar.initializeData();
        insertTestVersions();
    });

    function insertTestVersions() {
        if (aTestVersions.length === 0) {
            const oVersionBuilder = new TestDataUtility(testdata.oCalculationVersionTestData);
            const oBaseVersion = oVersionBuilder.getObject(0);
            aTestVersions.push(oBaseVersion);
        [[iLifecycleVersionIdBefore, 1404], [iLifecycleVersionIdForTest, 1416], [iLifecycleVersionIdAfter, 1428]].forEach(aVersionData => {
                const [iCvId, iLifecyclePeriodFrom] = aVersionData;
                const oLifecycleVersion = oVersionBuilder.getObject(0);
                oLifecycleVersion.BASE_VERSION_ID = oBaseVersion.CALCULATION_VERSION_ID;
                oLifecycleVersion.CALCULATION_VERSION_ID = iCvId;
                oLifecycleVersion.CALCULATION_VERSION_NAME = "Calc version " + iCvId;
                oLifecycleVersion.CALCULATION_VERSION_TYPE = 2;
                oLifecycleVersion.LIFECYCLE_PERIOD_FROM = iLifecyclePeriodFrom;
                oLifecycleVersion.VALUATION_DATE = new Date(iLifecyclePeriodFrom/12+1900, 0, 1).toJSON();
                aTestVersions.push(oLifecycleVersion);
            });
        }
        mockstar.insertTableData("calculation_version", aTestVersions);
    }

    function insertTestItems(oConfig) {
        mockstar.clearTable("item");
        const aItemsToInsert = [];
        const oItemSkeleton = new TestDataUtility(testdata.oItemTestData).getObject(0);
        const aTestItems = new TestDataUtility(oConfig.itemData || oItems).getObjects();
        const oChangesBuilder = new TestDataUtility(oConfig.itemChanges);

        aTestItems.forEach(oTestItem => {
            const oPreparedItem = _.extend({}, oItemSkeleton, oTestItem);
            // checking if oConfig.itemChanges contains property values that shall be overridden from oTestItem
            const iChangeIndex = getItemIdIndex(oConfig.itemChanges, oTestItem.ITEM_ID);
            if (iChangeIndex >= 0) {
                _.extend(oPreparedItem, oChangesBuilder.getObject(iChangeIndex));
            }
            aItemsToInsert.push(oPreparedItem);
        });
        mockstar.insertTableData("item", aItemsToInsert);
        
        if (jasmine.plcTestRunParameters.generatedFields === true) {
            mockstar.clearTable("item_ext");
            const aItemsExtToInsert = [];
            const oItemExtSkeleton = new TestDataUtility(testdata.oItemExtData).getObject(0);
            aItemsToInsert.forEach(oInsertItem => {
                const oInsertItemExt = _.extend({}, oItemExtSkeleton, {
                    ITEM_ID: oInsertItem.ITEM_ID,
                    CALCULATION_VERSION_ID: oInsertItem.CALCULATION_VERSION_ID
                });
                aItemsExtToInsert.push(oInsertItemExt);
            })
            mockstar.insertTableData("item_ext", aItemsExtToInsert);
        }
        return aItemsToInsert;
    }

    function getDbItems(iCvId) {
        var sWhereClause = iCvId ? `calculation_version_id = ${iCvId}` : "1=1";
        var oItemValues = MockstarHelpers.convertResultToArray(mockstar.execQuery(`select * from {{item}} where ${sWhereClause} order by item_id, calculation_version_id`));
        if (jasmine.plcTestRunParameters.generatedFields === true) {
            var oItemExtValues = MockstarHelpers.convertResultToArray(mockstar.execQuery(`select * from {{item_ext}} where ${sWhereClause} order by item_id, calculation_version_id`));
            _.extend(oItemValues, oItemExtValues);
        }
        return oItemValues;
    }

    function getItemIdIndex(oData, iId) {
        return oData.ITEM_ID.indexOf(iId);
    }
    
    const aTestSurchargeStrategies = ["NO_SURCHARGES", "WITH_PRICE_DETERMINATION", "WITHOUT_PRICE_DETERMINATION", "IF_NO_PRICE_FOUND"];
    const aMaterialPriceSurchargeCategories = [
            ItemCategory.CalculationVersion, 
            ItemCategory.Document, 
            ItemCategory.Material, 
            ItemCategory.ExternalActivity,
            ItemCategory.Subcontracting, 
            ItemCategory.VariableItem
    ];
    const aActivityPriceSurchargeCategories = [
            ItemCategory.InternalActivity,
            ItemCategory.Process
    ];
    
    function runTestSuite(sSurchargeType, aTestConfigs) {
        aTestSurchargeStrategies.forEach(sStrategy => {
            describe(sStrategy, () => {
                beforeEach(() => {
                    mockstar.clearTable("project_lifecycle_configuration");
                    const aSurchargeStrategies = _.map(oTotalQuantitiesData.CALCULATION_VERSION_ID, () => sStrategy);
                    const aNoSurcharges = _.map(oTotalQuantitiesData.CALCULATION_VERSION_ID, () => "NO_SURCHARGES");
                    
                    
                    const oTotalQuantitiesBuilder = new TestDataUtility(oTotalQuantitiesData);
                    if(sSurchargeType === "MATERIAL_PRICE_SURCHARGES"){
                        oTotalQuantitiesBuilder.replaceValue("MATERIAL_PRICE_SURCHARGE_STRATEGY", aSurchargeStrategies)
                    }else if(sSurchargeType === "ACTIVITY_PRICE_SURCHARGES"){
                        oTotalQuantitiesBuilder.replaceValue("ACTIVITY_PRICE_SURCHARGE_STRATEGY", aSurchargeStrategies)
                    }
                    const oTotalQuantitiesWithSurchargesData =    oTotalQuantitiesBuilder.build();
                    mockstar.insertTableData("project_lifecycle_configuration", oTotalQuantitiesWithSurchargesData);
                });
            
            const aCategoriesToTest = sSurchargeType === "MATERIAL_PRICE_SURCHARGES" ? aMaterialPriceSurchargeCategories : aActivityPriceSurchargeCategories;
            aCategoriesToTest.forEach(iCategoryId => {
                    describe(`item category ${iCategoryId}`, () => {
                        aTestConfigs.forEach(oConfig => {
                            it(oConfig.testName, () => {
                                oConfig.itemChanges.ITEM_CATEGORY_ID = oConfig.itemChanges.ITEM_ID.map(() => iCategoryId);
                                runTest(oConfig, sStrategy);
                            })
                        });
                    });
                });
            });
        });
    }

    function runTest(oConfig, sUsedStrategy) {
        // arrange
        const aInsertItems = insertTestItems(oConfig);

        // act
        executeProcedure();

        // assert
        const iVersionToCheck = oConfig.versionIdToCheck || iLifecycleVersionIdForTest;
        const oDbItems = getDbItems(iVersionToCheck);    
        expect(oDbItems.ITEM_ID.length).toBeGreaterThan(0);
        const oDbItemsMap = new Map(new TestDataUtility(oDbItems).getObjects().map(oItem => [oItem.ITEM_ID, oItem]));
        
        const aExpectedItems = aInsertItems.filter(oItem => oItem.CALCULATION_VERSION_ID === iVersionToCheck);
        const oExpectedChanges = oConfig.expectedChanges[sUsedStrategy]
        const oChangesBuilder = new TestDataUtility(oExpectedChanges);
        const oPriceDetDataBuilder = new TestDataUtility(oPriceDeterminationOutput);
        aExpectedItems.forEach(oExpectedItem => {
            const bPriceDeterminationIsExpected = oConfig.expectPriceDeterminationFor[sUsedStrategy].indexOf(oExpectedItem.ITEM_ID) >= 0;
            if(bPriceDeterminationIsExpected){
                const iPriceDeterminationDataIndex = getItemIdIndex(oPriceDeterminationOutput, oExpectedItem.ITEM_ID);
                _.extend(oExpectedItem, oPriceDetDataBuilder.getObject(iPriceDeterminationDataIndex));
            }
            
            const iExpectedChangesIndex = getItemIdIndex(oExpectedChanges, oExpectedItem.ITEM_ID);
            if(iExpectedChangesIndex >= 0){
                _.extend(oExpectedItem, oChangesBuilder.getObject(iExpectedChangesIndex));
            }
            
            Object.keys(oExpectedItem).forEach((sProperty) => {
                const vActual = oDbItemsMap.get(oExpectedItem.ITEM_ID)[sProperty];
                const vExpected = oExpectedItem[sProperty];

                if(vActual != vExpected){
                    jasmine.log(`Error while checking item ${oExpectedItem.ITEM_ID}. Expect ${sProperty} to be ${vExpected} and is ${vActual}`);
                }
                expect(vActual).toEqual(vExpected);
            });
            
            
        });
    }
    
    function executeProcedure() {
        mockstar.call(iLifecycleVersionIdForTest);
    }

    describe("material price surcharges", () => {
        
        describe("simple surcharge definitions", () => {
            
            const oMaterialPriceSurchargeData = {
                ACCOUNT_GROUP_ID : [      -2,      -2,      100,          -2,         -2,        100,         -2,         -2,         -2,        150,          100,        100],
                PLANT_ID         : [   "1000",      "*",   "1000",      "1000",     "1000",        "*",        "*",        "*",     "1000",     "1000",       "1000",   "1001"],
                MATERIAL_GROUP_ID: [      "*",      "*",      "*",       "MG1",        "*",        "*",      "MG1",        "*",        "*",        "*",          "*",      "*"],
                MATERIAL_TYPE_ID : [      "*",      "*",      "*",         "*",      "MT1",        "*",        "*",      "MT1",        "*",        "*",          "*",      "*"],
                RULE_ID          : [        1,        2,        3,           4,          5,          6,          7,          8,          9,          10,            11,     12],
                PROJECT_ID       : [sProjectId,sProjectId,sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, "other_proj",sProjectId],
                MATERIAL_ID      : [    "MAT1",    "MAT1",       "*",        "*",        "*",        "*",        "*",        "*",        "*",        "*",          "*",     "*"]
            };
            
            const oMaterialPriceSurchargeValueData = {
                RULE_ID              : [   1,    1,    1,    2,    2,    2,    3,    3,    3,    4,    4,    4,    5,    5,    5,    6,    6,    6,    7,    7,    7,    8,    8,    8,    9,    9,    9,    10,    10,    10,    11,    11,    11,   12,    12,    12],
                LIFECYCLE_PERIOD_FROM: [1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428],
                VALUE                : [ -50,   5,  -50, -55,   15,  -55, -50,   10,  -50,  -50,   20,  -50,  -50,   30,  -50,  -50,   40,  -50,  -50,   50,  -50,  -50,   60,  -50,  -50,   70,  -50,  -50,   80,  -50,  -50,   90,  -50,  -50,   100,  -50]
            };

            beforeEach(() => {
                mockstar.clearTables(["material_price_surcharges", "material_price_surcharge_values"]);
            
                mockstar.insertTableData("material_price_surcharges", oMaterialPriceSurchargeData);
                mockstar.insertTableData("material_price_surcharge_values", oMaterialPriceSurchargeValueData);
            });
            
            runTestSuite("MATERIAL_PRICE_SURCHARGES", [
                {
                    // rule 1 => surcharge 5%
                    testName: "should apply surcharge rule 1 to leaf items if material_id is MAT1 and plant_id is 1000",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_ID: ["MAT1", "MAT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["105.0000000", "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["210.0000000", "2.2050000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["5.0000000", "5.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["11.5500000", "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["1.1550000", "2.2050000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["5.0000000", "5.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.2050000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "5.0000000"]
                        }
                    }
                },
                {
                    // rule 8 => surcharge 5%
                    testName: "should apply surcharge rule 8 to leaf items if material_type_id is MAT1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"],
                        PRICE_SOURCE_ID: [null, "PLC_MANUAL_PRICE"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["160.0000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["320.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["17.6000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["1.7600000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "60.0000000"]
                        }
                    }
                },
                {
                    // rule 2 => surcharge 15%
                    testName: "should apply surcharge rule 2 to leaf items if material_id is MAT1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        MATERIAL_ID: ["MAT1", "MAT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["115.0000000", "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["230.0000000", "2.4150000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["15.0000000", "15.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.6500000", "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["1.2650000", "2.4150000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["15.0000000", "15.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.4150000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "15.0000000"]
                        }
                    }
                },
                {
                    // rule 2 => surcharge 15%
                    testName: "should apply surcharge rule 2 to leaf items if material_id is MAT1 but different plant is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1001", "1001"],
                        MATERIAL_ID: ["MAT1", "MAT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["115.0000000", "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["230.0000000", "2.4150000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["15.0000000", "15.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.6500000", "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["1.2650000", "2.4150000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["15.0000000", "15.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.4150000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "15.0000000"]
                        }
                    }
                },
                {
                    // rule 3 => surcharge 10%
                    testName: "should apply surcharge rule 3 to leaf items if plant_id is 1000 and account_id is 100",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACCOUNT_ID: ["100", "100"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["110.0000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["220.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.1000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["1.2100000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "10.0000000"]
                        }
                    }
                },
                {
                    // account 150 is in account group 100 and 150; with this the rules 1 and 8 apply; the sum of
                    // the surcharge to apply is 10 + 80
                    testName: "should apply sum of surcharge values to leaf items if they have account_id 150, which has overlaps",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACCOUNT_ID: ["150", "150"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["190.0000000", "39.9000000"],
                            PRICE_VARIABLE_PORTION: ["380.0000000", "3.9900000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["90.0000000", "90.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["20.9000000", "39.9000000"],
                            PRICE_VARIABLE_PORTION: ["2.0900000", "3.9900000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["90.0000000", "90.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "39.9000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.9900000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "90.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 4 to leaf items if plant_id is 1000 and material_group_id is MG1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["120.0000000", "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["240.0000000", "2.5200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["20.0000000", "20.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["13.2000000", "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["1.3200000", "2.5200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["20.0000000", "20.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.5200000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "20.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 5 to leaf items if plant_id is 1000 and material_type_id is MT1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["130.0000000", "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["260.0000000", "2.7300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["30.0000000", "30.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["14.3000000", "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["1.4300000", "2.7300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["30.0000000", "30.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.7300000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "30.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 6 to leaf items if account_id is 100",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["140.0000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["280.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["15.4000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["1.5400000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "40.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 7 to leaf items if material_group_id is MG1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["150.0000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["300.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["16.5000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["1.6500000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "50.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 8 to leaf items if material_type_id is MT1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["160.0000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["320.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["17.6000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["1.7600000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "60.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 9 to leaf items if plant_id is 1000",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["170.0000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["340.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["18.7000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["1.8700000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "70.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 9 to leaf items if plant_id is 1000 but account_id is not in group 100",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACCOUNT_ID: ["AC1", "AC2"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["170.0000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["340.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["18.7000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["1.8700000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "70.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 9 to leaf items if plant_id is 1000 but material_id is different",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_ID: ["MA2", "MA2"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["170.0000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["340.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["18.7000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["1.8700000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "70.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 9 to leaf items if plant_id is 1000 but different material group is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["#MG", "#MG"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["170.0000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["340.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["18.7000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["1.8700000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "70.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 9 to leaf items if plant_id is 1000 but different material type is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_TYPE_ID: ["#MT", "#MT"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["170.0000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["340.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["18.7000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["1.8700000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "70.0000000"]
                        }
                    }
                },
                {
                    testName: "should not apply surcharges to leaf items if different plant and account group is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"],
                        ACCOUNT_ID: ["AC_NA", "AC_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not apply surcharges to leaf items if different plant and material group is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"],
                        MATERIAL_GROUP_ID: ["MG_NA", "MG_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not apply surchargesto leaf items if different plant and material type is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"],
                        MATERIAL_TYPE_ID: ["T_NA", "T_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not apply surcharges to leaf items if different account group is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["A_NA", "A_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not apply surcharges to leaf items if different material group",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        MATERIAL_GROUP_ID: ["G_NA", "G_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not apply surcharges to leaf items if different material type",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        MATERIAL_TYPE_ID: ["T_NA", "T_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not apply surcharges to leaf items if different plant and material is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"],
                        MATERIAL_ID: ["M_NA", "M_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not apply surcharges to leaf items if different material is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        MATERIAL_ID: ["M_NA", "M_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not apply surcharges to leaf items if different plant",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
            }]); // end runTestSuite
        });

        describe("null-based surcharge definitions", () => {
            
            // negative surcharge values; also also 0
            const oMaterialPriceSurchargeData = {
                ACCOUNT_GROUP_ID : [      -1,          100,         -2,        -2,          -2,         -2,         -1,         -2,         -2,         -2],
                PLANT_ID         : [   "1000",          "",     "1000",         "",     "1000",         "",        "*",        "*",        "*",         ""],
                MATERIAL_GROUP_ID: [      "*",         "*",         "",      "MG1",        "*",        "*",        "*",         "",        "*",        "*"],
                MATERIAL_TYPE_ID : [      "*",         "*",        "*",        "*",        "",       "MT1",        "*",        "*",         "",        "*"],
                RULE_ID          : [        1,           2,          3,          4,          5,          6,          7,          8,          9,         10],
                PROJECT_ID       : [sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId],
                MATERIAL_ID      : [       "*",        "*",        "*",        "*",        "*",        "*",        "*",        "*",        "*",        "*"]
            };
            
            const oMaterialPriceSurchargeValuesData = {
                RULE_ID              : [   1,    1,    1,    2,    2,    2,    3,    3,    3,    4,    4,    4,    5,    5,    5,    6,    6,    6,    7,    7,    7,    8,    8,    8,    9,    9,    9,   10,   10,   10],
                LIFECYCLE_PERIOD_FROM: [1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428],
                VALUE                : [-100,  -10, -100, -100,  -20, -100, -100,  -30, -100, -100,  -40, -100, -100,  -50, -100, -100,  -60, -100, -100,  -70, -100, -100,  -80, -100, -100,  -90, -100, -110, -100, -110]
            };

            beforeEach(() => {
                mockstar.clearTables(["material_price_surcharges", "material_price_surcharge_values"]);
            
                mockstar.insertTableData("material_price_surcharges", oMaterialPriceSurchargeData);
                mockstar.insertTableData("material_price_surcharge_values", oMaterialPriceSurchargeValuesData);
            });

            runTestSuite("MATERIAL_PRICE_SURCHARGES", [{
                    // surcharge value for rule 1 = -10
                    testName: "should apply surcharge rule 1 to leaf items if account_id is null and plant_id 1000",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACCOUNT_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ["100.0000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["90.0000000", "18.9000000"],
                            PRICE_VARIABLE_PORTION: ["180.0000000", "1.8900000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-10.0000000", "-10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["9.9000000", "18.9000000"],
                            PRICE_VARIABLE_PORTION: ["0.9900000", "1.8900000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-10.0000000", "-10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["100.0000000", "18.9000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.8900000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-10.0000000"]
                        }
                    }
                },
                {
                    // the rules with account_group_id = -1 should only apply if items have no accounts set and not if they have an
                    // account set, which is in now account group
                    testName: "should not apply surcharge rule 1 to leaf items if account_id is not null but not in any account group",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["NOT_IN_G", "NOT_IN_G"],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["G_NA", "G_NA"], // needed because otherwise rule 8 would apply
                        MATERIAL_TYPE_ID: ["T_NA", "T_NA"], // needed because otherwise rule 7 would apply
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ["100.0000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    // surcharge value for rule 2 = -20
                    testName: "should apply surcharge rule 2 to leaf items if plant_id is null and account_id 100",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: [null, null],
                        ACCOUNT_ID: ["100", "100"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["80.0000000", "16.8000000"],
                            PRICE_VARIABLE_PORTION: ["160.0000000", "1.6800000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-20.0000000", "-20.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["8.8000000", "16.8000000"],
                            PRICE_VARIABLE_PORTION: ["0.8800000", "1.6800000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-20.0000000", "-20.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "16.8000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.6800000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-20.0000000"]
                        },
                    }
               },
                {
                    // surcharge value for rule 3 = -30
                    testName: "should apply surcharge rule 3 to leaf items if material_group_id is null and plant_id is 1000",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["70.0000000", "14.7000000"],
                            PRICE_VARIABLE_PORTION: ["140.0000000", "1.4700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-30.0000000", "-30.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["7.7000000", "14.7000000"],
                            PRICE_VARIABLE_PORTION: ["0.7700000", "1.4700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-30.0000000", "-30.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "14.7000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.4700000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-30.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 4 = -40
                    testName: "should apply surcharge rule 4 to leaf items if material_group_id is MG1 and plant_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: [null, null],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["60.0000000", "12.6000000"],
                            PRICE_VARIABLE_PORTION: ["120.0000000", "1.2600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-40.0000000", "-40.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["6.6000000", "12.6000000"],
                            PRICE_VARIABLE_PORTION: ["0.6600000", "1.2600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-40.0000000", "-40.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "12.6000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.2600000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-40.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 5 = -50
                    testName: "should apply surcharge rule 5 to leaf items if material_type_id is null and plant_id is 1000",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"], // needed because otherwise rule 1 would apply (account_group_id = null)
                        MATERIAL_GROUP_ID: ["MG1", "MG1"], // needed because otherwise rule 3 would apply (material_group_id = null)
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_TYPE_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["50.0000000", "10.5000000"],
                            PRICE_VARIABLE_PORTION: ['100.0000000', "1.0500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-50.0000000", "-50.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["5.5000000", "10.5000000"],
                            PRICE_VARIABLE_PORTION: ["0.5500000", "1.0500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-50.0000000", "-50.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "10.5000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.0500000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-50.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 6 = -60
                    testName: "should apply surcharge rule 6 to leaf items if material_type_id is MT1 and plant_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],

                        PLANT_ID: [null, null],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["40.0000000", "8.4000000"],
                            PRICE_VARIABLE_PORTION: ["80.0000000", "0.8400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-60.0000000", "-60.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["4.4000000", "8.4000000"],
                            PRICE_VARIABLE_PORTION: ["0.4400000", "0.8400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-60.0000000", "-60.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "8.4000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "0.8400000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-60.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 7 = -70
                    testName: "should apply surcharge rule 7 to leaf items if account is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["30.0000000", "6.3000000"],
                            PRICE_VARIABLE_PORTION: ["60.0000000", "0.6300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-70.0000000", "-70.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["3.3000000", "6.3000000"],
                            PRICE_VARIABLE_PORTION: ["0.3300000", "0.6300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-70.0000000", "-70.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "6.3000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "0.6300000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-70.0000000"]
                        }
                    }
                },
                {
                    // the rules with account_group_id = -1 should only apply if items have no accounts set and not if they have an
                    // account set, which is in now account group
                    testName: "should not apply surcharge rule 7 to leaf items if account_id in not null but not in any account group",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["NOT_IN_G", "NOT_IN_G"],
                        MATERIAL_GROUP_ID: ["G_NA", "G_NA"], // needed because otherwise rule 8 would apply
                        MATERIAL_TYPE_ID: ["T_NA", "T_NA"], // needed because otherwise rule 7 would apply
                        PLANT_ID: ["2000", "2000"], // needed because otherwise rule 10 would apply
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    // surcharge value for rule 8 = -80
                    testName: "should apply surcharge rule 8 to leaf items if material_group_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["199", "199"], // needed since otherwise rule 7 would apply
                        PLANT_ID: ["2000", "2000"], // needed because other wise rule 3 would apply
                        MATERIAL_GROUP_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["20.0000000", "4.2000000"],
                            PRICE_VARIABLE_PORTION: ["40.0000000", "0.4200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-80.0000000", "-80.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["2.2000000", "4.2000000"],
                            PRICE_VARIABLE_PORTION: ["0.2200000", "0.4200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-80.0000000", "-80.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "4.2000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "0.4200000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-80.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 9 = -90
                    testName: "should apply surcharge rule 9 to leaf items if material_type_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["199", "199"], // needed since otherwise rule 7 would apply
                        PLANT_ID: ["2000", "2000"], // needed because other wise rule 3 would apply
                        MATERIAL_GROUP_ID: ["MG1", "MG1"], // needed because otherwise rule 8 would apply
                        MATERIAL_TYPE_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["10.0000000", "2.1000000"],
                            PRICE_VARIABLE_PORTION: ["20.0000000", "0.2100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-90.0000000", "-90.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["1.1000000", "2.1000000"],
                            PRICE_VARIABLE_PORTION: ["0.1100000", "0.2100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-90.0000000", "-90.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "2.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "0.2100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-90.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 10 = -100
                    testName: "should apply surcharge rule 10 to leaf items if plant_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["199", "199"], // needed because otherwise rule 7 would apply
                        MATERIAL_GROUP_ID: ["G_NA", "G_NA"], // needed because otherwise rule 8 would apply
                        MATERIAL_TYPE_ID: ["T_NA", "T_NA"], // needed because otherwise rule 7 would apply
                        PLANT_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["0.0000000", "0.0000000"],
                            PRICE_VARIABLE_PORTION: ["0.0000000", "0.0000000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-100.0000000", "-100.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["0.0000000", "0.0000000"],
                            PRICE_VARIABLE_PORTION: ["0.0000000", "0.0000000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-100.0000000", "-100.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "0.0000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "0.0000000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-100.0000000"]
                        }
                    }
                }
            ]); // end runTestSuite
        });
    
        describe("advanced surcharge tests", () => {
            
            const oMaterialPriceSurchargeData = {
                ACCOUNT_GROUP_ID : [       -2,       -2,      100,          -2,         -2,        100,         -2,         -2,         -2,         -2,        150,       1000],
                PLANT_ID         : [   "1000",      "*",   "1000",      "1000",     "1000",        "*",        "*",        "*",     "1000",     "2000",        "*",        "*"],
                MATERIAL_GROUP_ID: [      "*",      "*",      "*",       "MG1",        "*",        "*",      "MG1",        "*",        "*",        "*",        "*",        "*"],
                MATERIAL_TYPE_ID : [      "*",     "*",      "*",         "*",      "MT1",        "*",        "*",      "MT1",        "*",        "*",        "*",        "*"],
                RULE_ID          : [        1,       2,        3,           4,          5,          6,          7,          8,          9,          10,          11,         12],
                PROJECT_ID       : [sProjectId,sProjectId,sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId],
                MATERIAL_ID      : [    "MAT1",    "MAT1",       "*",        "*",        "*",        "*",        "*",        "*",        "*",        "*",        "*",        "*"]
            };
            
            const oMaterialPriceSurchargeValuesData = {
                RULE_ID              : [   1,    1,    1,   2,    2,    2,   3,    3,    3,    4,    4,    4,    5,    5,    5,    6,    6,    6,    7,    7,    7,    8,    8,    8,    9,    9,    9,    10,    10,    10,    11,    11,    11,   12,   12,   12],
                LIFECYCLE_PERIOD_FROM: [1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428],
                VALUE                : [-104,    5, -104, -105,   15, -105, -100,   10, -100, -100,   20, -100, -100,   30, -100, -100,   40, -100, -100,   50, -100, -100,   60, -100, -100,   70, -100, -100,   0, -100, -100,   90, -100, -110,  100, -110]
            };
            
            beforeEach(() => {
                mockstar.clearTables(["material_price_surcharges", "material_price_surcharge_values"]);
            
                mockstar.insertTableData("material_price_surcharges", oMaterialPriceSurchargeData);
                mockstar.insertTableData("material_price_surcharge_values", oMaterialPriceSurchargeValuesData);
            });

            runTestSuite("MATERIAL_PRICE_SURCHARGES", [
                {
                    testName: "should apply rule 1 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_ID: ["MAT1", "MAT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["105.0000000", "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["210.0000000", "2.2050000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["5.0000000", "5.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["11.5500000", "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["1.1550000", "2.2050000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["5.0000000", "5.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.2050000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "5.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 2 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1001", "1001"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"],
                        MATERIAL_ID: ["MAT1", "MAT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["115.0000000", "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["230.0000000", "2.4150000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["15.0000000", "15.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.6500000", "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["1.2650000", "2.4150000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["15.0000000", "15.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "24.1500000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.4150000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "15.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 3 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["110.0000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["220.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.1000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["1.2100000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "10.0000000"]
                        }
                    }
                },
                {
                    // account 150 is in group 100 and 150; for the combination PLANT_ID 1000 + ACCOUNT_GROUP_ID 100 rule is defined; for ACCOUNT_GROUP_ID 150 rule 9
                    // is defined; even though we have an overlap in account groups here, only rule shall be applied and not rule 9 because it has a lower priority;
                    // this is done because otherwise it might be confusing for user which rules apply
                    testName: "should only apply rule 3 if account 150, even though rule 9 could be applied but has lower priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACCOUNT_ID: ["150", "150"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["110.0000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["220.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.1000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["1.2100000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "10.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 4 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["200", "200"],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["120.0000000", "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["240.0000000", "2.5200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["20.0000000", "20.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["13.2000000", "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["1.3200000", "2.5200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["20.0000000", "20.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.5200000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "20.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 5 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["A_NA", "A_NA"],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["G_NA", "G_NA"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["130.0000000", "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["260.0000000", "2.7300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["30.0000000", "30.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["14.3000000", "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["1.4300000", "2.7300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["30.0000000", "30.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.7300000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "30.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 6 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["P_NA", "P_NA"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["140.0000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["280.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["15.4000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["1.5400000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "40.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 7 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["A_NA", "A_NA"],
                        PLANT_ID: ["P_NA", "P_NA"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["150.0000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["300.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["16.5000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["1.6500000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "50.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 8 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["A_NA", "A_NA"],
                        PLANT_ID: ["P_NA", "P_NA"],
                        MATERIAL_GROUP_ID: ["G_NA", "G_NA"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["160.0000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["320.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["17.6000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["1.7600000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "60.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 9 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["A_NA", "A_NA"],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["G_NA", "G_NA"],
                        MATERIAL_TYPE_ID: ["T_NA", "T_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["170.0000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["340.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["18.7000000", "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["1.8700000", "3.5700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["70.0000000", "70.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "35.7000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.5700000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "70.0000000"]
                        }
                    }
                },
                {
                    testName: "should not apply any surcharge if the surcharge value is 0 (rule 10)",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["2000", "2000"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should copy surcharged prices (rule 3) to future lifecycle versions",
                    versionIdToCheck: iLifecycleVersionIdAfter,
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ['100', '100'],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["110.0000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["220.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.1000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["1.2100000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "10.0000000"]
                        }
                    }
                },
                {
                    testName: "should copy surcharged prices (rule 1) to future lifecycle versions",
                    versionIdToCheck: iLifecycleVersionIdAfter,
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_ID: ["MAT1", "MAT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["105.0000000", "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["210.0000000", "2.2050000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["5.0000000", "5.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["11.5500000", "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["1.1550000", "2.2050000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["5.0000000", "5.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "22.0500000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.2050000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "5.0000000"]
                        }
                    }
                },
                {
                    testName: "should not copy surcharged prices (rule 3) to lifecycle versions before",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1000", "1000"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [],
                        WITH_PRICE_DETERMINATION: [],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: []
                    },
                    versionIdToCheck: iLifecycleVersionIdBefore,
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11, 21]
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should not copy surcharged prices (rule 2) to lifecycle versions before",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1001", "1001"],
                        MATERIAL_GROUP_ID: ["MG1", "MG1"],
                        MATERIAL_TYPE_ID: ["MT1", "MT1"],
                        MATERIAL_ID: ["MAT1", "MAT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [],
                        WITH_PRICE_DETERMINATION: [],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: []
                    },
                    versionIdToCheck: iLifecycleVersionIdBefore,
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11, 21]
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                }
            ]); // end runTestSuite
        })
    });
    
    describe("activity price surcharges", () => {

        describe("simple surcharge definitions", () => {
            
            const oActivityPriceSurchargeData = {
                ACCOUNT_GROUP_ID : [      100,          -2,        100,         -2,         -2,         -2,        150,          100],
                PLANT_ID         : [   "1000",         "*",        "*",        "*",        "*",     "1000",     "1000",       "1000"],
                ACTIVITY_TYPE_ID : [      "*",       "AT1",        "*",      "AT1",        "*",        "*",        "*",          "*"],
                COST_CENTER_ID   : [      "*",       "CC1",        "*",        "*",      "CC1",        "*",        "*",          "*"],
                RULE_ID          : [        1,           2,          3,          4,          5,          6,          7,            8],
                PROJECT_ID       : [sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, "other_proj"]
            };
            
            const oActivityPriceSurchargeValueData = {
                RULE_ID              : [   1,    1,    1,    2,    2,    2,    3,    3,    3,    4,    4,    4,    5,    5,    5,    6,    6,    6,    7,    7,    7,    8,    8,    8],
                LIFECYCLE_PERIOD_FROM: [1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428],
                VALUE                : [ -50,   10,  -50,  -50,   20,  -50,  -50,   30,  -50,  -50,   40,  -50,  -50,   50,  -50,  -50,   60,  -50,  -50,  70,  -50,  -50,  100,  -50]
            };

            beforeEach(() => {
                mockstar.clearTables(["activity_price_surcharges", "activity_price_surcharge_values"]);
            
                mockstar.insertTableData("activity_price_surcharges", oActivityPriceSurchargeData);
                mockstar.insertTableData("activity_price_surcharge_values", oActivityPriceSurchargeValueData);
            });
            
            runTestSuite("ACTIVITY_PRICE_SURCHARGES", [
                {
                    // rule 1 => surcharge 10%
                    testName: "should apply surcharge rule 1 to leaf items if plant_id is 1000 and account_id is 100",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACCOUNT_ID: ["100", "100"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["110.0000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["220.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.1000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["1.2100000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "10.0000000"]
                        }
                    }
            },
                {
                    // account 150 is in account group 100 and 150; with this the rules 1 and 7 apply; the sum of
                    // the surcharge to apply is 10 + 70
                    testName: "should apply sum of surcharge values to leaf items if they have account_id 150, which has overlaps",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACCOUNT_ID: ["150", "150"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["180.0000000", "37.8000000"],
                            PRICE_VARIABLE_PORTION: ["360.0000000", "3.7800000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["80.0000000", "80.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["19.8000000", "37.8000000"],
                            PRICE_VARIABLE_PORTION: ["1.9800000", "3.7800000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["80.0000000", "80.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "37.8000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.7800000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "80.0000000"]
                        }
                    }
            },
                {
                    testName: "should apply rule 2 to leaf items if cost_center_id is CC1 and and activity_type_id is AT1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["120.0000000", "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["240.0000000", "2.5200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["20.0000000", "20.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["13.2000000", "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["1.3200000", "2.5200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["20.0000000", "20.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.5200000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "20.0000000"]
                        }
                    }
            },
                {
                    testName: "should apply rule 3 to leaf items if account_id is 100",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["130.0000000", "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["260.0000000", "2.7300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["30.0000000", "30.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["14.3000000", "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["1.4300000", "2.7300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["30.0000000", "30.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.7300000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "30.0000000"]
                        }
                    }
            },
                {
                    testName: "should apply rule 4 to leaf items if activity_type_id is AT1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["140.0000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["280.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["15.4000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["1.5400000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "40.0000000"]
                        }
                    }
            },
                {
                    testName: "should apply rule 5 to leaf items if cost_center_id is CC1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["150.0000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["300.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["16.5000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["1.6500000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "50.0000000"]
                        }
                    }
            },
                {
                    testName: "should apply rule 6 to leaf items if plant_id is 1000",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["160.0000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["320.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["17.6000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["1.7600000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "60.0000000"]
                        }
                    }
            },
                {
                    testName: "should apply rule 5 to leaf items if cost_center_id is CC1 but different activity_type_id is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        COST_CENTER_ID: ["CC1", "CC1"],
                        ACTIVITY_TYPE_ID: ["A_NA", "A_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["150.0000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["300.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["16.5000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["1.6500000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "50.0000000"]
                        }
                    }
            },
                {
                    testName: "should apply rule 4 to leaf items if activity_type_id is AT1 but different cost_center_id is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["C_NA", "C_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["140.0000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["280.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["15.4000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["1.5400000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "40.0000000"]
                        }
                    }
            },
                {
                    testName: "should not apply surcharges to leaf items if different plant and account group is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"],
                        ACCOUNT_ID: ["AC_NA", "AC_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
            },
                {
                    testName: "should not apply surcharges to leaf items if different plant and activity_type_id is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"],
                        ACTIVITY_TYPE_ID: ["A_NA", "A_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
            },
                {
                    testName: "should not apply surchargesto leaf items if different cost_center_id is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"],
                        COST_CENTER_ID: ["C_NA", "C_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
            },
                {
                    testName: "should not apply surcharges to leaf items if different account group is used",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["A_NA", "A_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
            },
                {
                    testName: "should not apply surcharges to leaf items if different plant",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["NA", "NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
            }]); // end runTestSuite
        });

        describe("null-based surcharge definitions", () => {
            
            // negative surcharge values; also also 0
            const oActivityPriceSurchargeData = {
                ACCOUNT_GROUP_ID : [      -1,          100,         -2,        -2,          -1,         -2,         -2,         -2],
                PLANT_ID         : [   "1000",          "",        "*",        "*",        "*",        "*",        "*",         ""],
                ACTIVITY_TYPE_ID : [      "*",         "*",         "",      "AT1",        "*",         "",        "*",        "*"],
                COST_CENTER_ID   : [      "*",         "*",       "CC1",        "",        "*",        "*",         "",        "*"],
                RULE_ID          : [        1,           2,          3,          4,          5,          6,          7,          8],
                PROJECT_ID       : [sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId]
            };
            
            const oActivityPriceSurchargeValueData = {
                RULE_ID              : [   1,    1,    1,    2,    2,    2,    3,    3,    3,    4,    4,    4,    5,    5,    5,    6,    6,    6,    7,    7,    7,    8,    8,    8],
                LIFECYCLE_PERIOD_FROM: [1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428],
                VALUE                : [-100,  -10, -100, -100,  -20, -100, -100,  -30, -100, -100,  -40, -100, -100,  -50, -100, -100,  -60, -100, -100,  -70, -100, -100,  -80, -100]
            };

            beforeEach(() => {
                mockstar.clearTables(["activity_price_surcharges", "activity_price_surcharge_values"]);
            
                mockstar.insertTableData("activity_price_surcharges", oActivityPriceSurchargeData);
                mockstar.insertTableData("activity_price_surcharge_values", oActivityPriceSurchargeValueData);
            });

            runTestSuite("ACTIVITY_PRICE_SURCHARGES", [{
                    // surcharge value for rule 1 = -10
                    testName: "should apply surcharge rule 1 to leaf items if account_id is null and plant_id 1000",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACCOUNT_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["90.0000000", "18.9000000"],
                            PRICE_VARIABLE_PORTION: ["180.0000000", "1.8900000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-10.0000000", "-10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["9.9000000", "18.9000000"],
                            PRICE_VARIABLE_PORTION: ["0.9900000", "1.8900000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-10.0000000", "-10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "18.9000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.8900000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-10.0000000"]
                        }
                    }
                },
                {
                    // the rules with account_group_id = -1 should only apply if items have no accounts set and not if they have an
                    // account set, which is in now account group
                    testName: "should not apply surcharge rule 1 to leaf items if account_id is not null but not in any account group",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["NOT_IN_G", "NOT_IN_G"],
                        PLANT_ID: ["1000", "1000"],
                        COST_CENTER_ID: ["C_NA", "C_NA"], // needed because otherwise rule 8 would apply
                        ACTIVITY_TYPE_ID: ["T_NA", "T_NA"], // needed because otherwise rule 7 would apply
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    // surcharge value for rule 2 = -20
                    testName: "should apply surcharge rule 2 to leaf items if plant_id is null and account_id 100",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: [null, null],
                        ACCOUNT_ID: ["100", "100"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["80.0000000", "16.8000000"],
                            PRICE_VARIABLE_PORTION: ["160.0000000", "1.6800000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-20.0000000", "-20.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["8.8000000", "16.8000000"],
                            PRICE_VARIABLE_PORTION: ["0.8800000", "1.6800000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-20.0000000", "-20.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "16.8000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.6800000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-20.0000000"]
                        },
                    }
               },
                {
                    // surcharge value for rule 3 = -30
                    testName: "should apply surcharge rule 3 to leaf items if activity_type_id is null and cost_center_id is CC1",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["1000", "1000"],
                        ACTIVITY_TYPE_ID: [null, null],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["70.0000000", "14.7000000"],
                            PRICE_VARIABLE_PORTION: ["140.0000000", "1.4700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-30.0000000", "-30.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["7.7000000", "14.7000000"],
                            PRICE_VARIABLE_PORTION: ["0.7700000", "1.4700000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-30.0000000", "-30.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "14.7000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.4700000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-30.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 4 = -40
                    testName: "should apply surcharge rule 4 to leaf items if activity_type_id is AT1 and cost_center_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: [null, null],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: [null, null],
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["60.0000000", "12.6000000"],
                            PRICE_VARIABLE_PORTION: ["120.0000000", "1.2600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-40.0000000", "-40.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["6.6000000", "12.6000000"],
                            PRICE_VARIABLE_PORTION: ["0.6600000", "1.2600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-40.0000000", "-40.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "12.6000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.2600000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-40.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 5 = -50
                    testName: "should apply surcharge rule 5 to leaf items if account_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: [null, null],
                        PLANT_ID: ["2000", "2000"], // needed because otherwise rule 1 would apply (account_group_id = null)
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["50.0000000", "10.5000000"],
                            PRICE_VARIABLE_PORTION: ['100.0000000', "1.0500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-50.0000000", "-50.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["5.5000000", "10.5000000"],
                            PRICE_VARIABLE_PORTION: ["0.5500000", "1.0500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-50.0000000", "-50.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "10.5000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "1.0500000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-50.0000000"]
                        }
                    }
                },
                {
                    // the rules with account_group_id = -1 should only apply if items have no accounts set and not if they have an
                    // account set, which is in now account group
                    testName: "should not apply surcharge rule 5 to leaf items if account_id in not null but not in any account group",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["NOT_IN_G", "NOT_IN_G"],
                        ACTIVITY_TYPE_ID: ["T_NA", "T_NA"], // otherwise rule 6 would apply
                        COST_CENTER_ID: ["C_NA", "C_NA"], // otherwise rule 7 would apply
                        PLANT_ID: ["2000", "2000"],
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    // surcharge value for rule 6 = -60
                    testName: "should apply surcharge rule 6 to leaf items if activity_type_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACTIVITY_TYPE_ID: [null, null],
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["40.0000000", "8.4000000"],
                            PRICE_VARIABLE_PORTION: ["80.0000000", "0.8400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-60.0000000", "-60.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["4.4000000", "8.4000000"],
                            PRICE_VARIABLE_PORTION: ["0.4400000", "0.8400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-60.0000000", "-60.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "8.4000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "0.8400000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-60.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 7 = -70
                    testName: "should apply surcharge rule 7 to leaf items if cost_center_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACTIVITY_TYPE_ID: ["T_NA", "T_NA"], // otherwise rule 6 would apply
                        COST_CENTER_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["30.0000000", "6.3000000"],
                            PRICE_VARIABLE_PORTION: ["60.0000000", "0.6300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-70.0000000", "-70.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["3.3000000", "6.3000000"],
                            PRICE_VARIABLE_PORTION: ["0.3300000", "0.6300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-70.0000000", "-70.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "6.3000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "0.6300000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-70.0000000"]
                        }
                    }
                },
                {
                    // surcharge value for rule 8 = -80
                    testName: "should apply surcharge rule 8 to leaf items if plant_id is null",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["199", "199"], // needed since otherwise rule 5 would apply
                        ACTIVITY_TYPE_ID: ["T_NA", "T_NA"], // otherwise rule 6 would apply
                        COST_CENTER_ID: ["C_NA", "C_NA"], // otherwise rule 7 would apply
                        PLANT_ID: [null, null]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["20.0000000", "4.2000000"],
                            PRICE_VARIABLE_PORTION: ["40.0000000", "0.4200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-80.0000000", "-80.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["2.2000000", "4.2000000"],
                            PRICE_VARIABLE_PORTION: ["0.2200000", "0.4200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["-80.0000000", "-80.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "4.2000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "0.4200000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "-80.0000000"]
                        }
                    }
                }
            ]); // end runTestSuite
        });
    
        describe("advanced surcharge tests", () => {
            
            const oActivityPriceSurchargeData = {
                ACCOUNT_GROUP_ID : [      100,          -2,        100,         -2,         -2,         -2,         -2,        150,       1000],
                PLANT_ID         : [   "1000",         "*",        "*",        "*",        "*",     "1000",     "2000",        "*",        "*"],
                ACTIVITY_TYPE_ID : [      "*",       "AT1",        "*",      "AT1",        "*",        "*",        "*",        "*",        "*"],
                COST_CENTER_ID   : [      "*",       "CC1",        "*",        "*",      "CC1",        "*",        "*",        "*",        "*"],
                RULE_ID          : [        1,           2,          3,          4,          5,          6,          7,          8,          9],
                PROJECT_ID       : [sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId]
            };
            
            const oActivityPriceSurchargeValueData = {
                RULE_ID              : [   1,    1,    1,    2,    2,    2,    3,    3,    3,    4,    4,    4,    5,    5,    5,    6,    6,    6,    7,    7,    7,    8,   8,     8,    9,   9,     9],
                LIFECYCLE_PERIOD_FROM: [1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428],
                VALUE                : [-100,   10, -100, -100,   20, -100, -100,   30, -100, -100,   40, -100, -100,   50, -100, -100,   60, -100, -100,    0, -100, -100,   80, -100, -100,   90, -100]
            };
            
            beforeEach(() => {
                mockstar.clearTables(["activity_price_surcharges", "activity_price_surcharge_values"]);
            
                mockstar.insertTableData("activity_price_surcharges", oActivityPriceSurchargeData);
                mockstar.insertTableData("activity_price_surcharge_values", oActivityPriceSurchargeValueData);
            });

            runTestSuite("ACTIVITY_PRICE_SURCHARGES", [
                {
                    testName: "should apply rule 1 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1000", "1000"],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["110.0000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["220.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.1000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["1.2100000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "10.0000000"]
                        }
                    }
                },
                {
                    // account 150 is in group 100 and 150; for the combination PLANT_ID 1000 + ACCOUNT_GROUP_ID 100 rule is defined; for ACCOUNT_GROUP_ID 150 rule 9
                    // is defined; even though we have an overlap in account groups here, only rule shall be applied and not rule 9 because it has a lower priority;
                    // this is done because otherwise it might be confusing for user which rules apply
                    testName: "should only apply rule 1 if account 150, even though rule 8 could be applied but has lower priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["150", "150"],
                        PLANT_ID: ["1000", "1000"],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["110.0000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["220.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.1000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["1.2100000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "10.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 2 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["200", "200"],
                        PLANT_ID: ["1000", "1000"],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["120.0000000", "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["240.0000000", "2.5200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["20.0000000", "20.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["13.2000000", "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["1.3200000", "2.5200000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["20.0000000", "20.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "25.2000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.5200000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "20.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 3 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["2000", "2000"],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["C_NA", "C_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["130.0000000", "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["260.0000000", "2.7300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["30.0000000", "30.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["14.3000000", "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["1.4300000", "2.7300000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["30.0000000", "30.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "27.3000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.7300000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "30.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 4 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["200", "200"],
                        PLANT_ID: ["P_NA", "P_NA"],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["C_NA", "C_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["140.0000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["280.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["15.4000000", "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["1.5400000", "2.9400000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["40.0000000", "40.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "29.4000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.9400000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "40.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 5 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["A_NA", "A_NA"],
                        PLANT_ID: ["P_NA", "P_NA"],
                        ACTIVITY_TYPE_ID: ["T_NA", "T_NA"],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["150.0000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["300.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["16.5000000", "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["1.6500000", "3.1500000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["50.0000000", "50.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "31.5000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.1500000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "50.0000000"]
                        }
                    }
                },
                {
                    testName: "should apply rule 6 because it has the highest priority",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["A_NA", "A_NA"],
                        PLANT_ID: ["1000", "1000"],
                        ACTIVITY_TYPE_ID: ["T_NA", "T_NA"],
                        COST_CENTER_ID: ["C_NA", "C_NA"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["160.0000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["320.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["17.6000000", "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["1.7600000", "3.3600000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["60.0000000", "60.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "33.6000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "3.3600000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "60.0000000"]
                        }
                    }
                },
                {
                    testName: "should not apply any surcharge if the surcharge value is 0 (rule 7)",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        PLANT_ID: ["2000", "2000"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                },
                {
                    testName: "should copy surcharged prices (rule 1) to future lifecycle versions",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1000", "1000"],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [11],
                        WITH_PRICE_DETERMINATION: [11],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: [11]
                    },
                    versionIdToCheck: iLifecycleVersionIdAfter,
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11],
                            PRICE_FIXED_PORTION: ['100.0000000'],
                            PRICE_VARIABLE_PORTION: ["200.0000000"],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["110.0000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["220.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ["12.1000000", "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["1.2100000", "2.3100000"],
                            PRICE_SOURCE_ID: [sExpectedPriceSourceId, sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [iExpectedPriceSourceType, iExpectedPriceSourceType],
                            SURCHARGE: ["10.0000000", "10.0000000"]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21],
                            PRICE_FIXED_PORTION: ['100.0000000', "23.1000000"],
                            PRICE_VARIABLE_PORTION: ["200.0000000", "2.3100000"],
                            PRICE_SOURCE_ID: ["SOURCE_1", sExpectedPriceSourceId],
                            PRICE_SOURCE_TYPE_ID: [3, iExpectedPriceSourceType],
                            SURCHARGE: [null, "10.0000000"]
                        }
                    }
                },
                {
                    testName: "should not copy surcharged prices (rule 1) to lifecycle versions before",
                    itemChanges: {
                        ITEM_ID: [11, 21],
                        ACCOUNT_ID: ["100", "100"],
                        PLANT_ID: ["1000", "1000"],
                        ACTIVITY_TYPE_ID: ["AT1", "AT1"],
                        COST_CENTER_ID: ["CC1", "CC1"]
                    },
                    expectPriceDeterminationFor: {
                        NO_SURCHARGES: [],
                        WITH_PRICE_DETERMINATION: [],
                        WITHOUT_PRICE_DETERMINATION: [],
                        IF_NO_PRICE_FOUND: []
                    },
                    versionIdToCheck: iLifecycleVersionIdBefore,
                    expectedChanges: {
                        NO_SURCHARGES: {
                            ITEM_ID: [11, 21],
                        },
                        WITH_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        WITHOUT_PRICE_DETERMINATION: {
                            ITEM_ID: [11, 21]
                        },
                        IF_NO_PRICE_FOUND: {
                            ITEM_ID: [11, 21]
                        }
                    }
                }
            ]); // end runTestSuite
        })
    });
}).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);