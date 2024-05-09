const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const MigrateLifecycleQuantities = $.import("xs.postinstall.release_4_3_0", "migrateLifecycleQuantities");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("migrateLifecycleQUantities-tests", () => {
    var sExpectedDate = new Date().toJSON();

    const oLifecyclePeriodValueTestData = {
        "RULE_ID" : [1, 1, 1,  2, 2, 3],
        "LIFECYCLE_PERIOD_FROM": [1404, 1416, 1428, 1404, 1416, 1428],
        "VALUE": ['3.0000000', '4.0000000', '5.0000000', 5, 10, 2]
    };  

    const oTotalQuantitiesTestData = {
        "RULE_ID": [1, 2, 3],
        "CALCULATION_ID": [ testdata.iCalculationId, testdata.iSecondCalculationId, 5078 ],
        "CALCULATION_VERSION_ID": [ testdata.iCalculationVersionId, testdata.iSecondVersionId, 5809 ],
        "MATERIAL_PRICE_SURCHARGE_STRATEGY": ["NO_SURCHARGES", "NO_SURCHARGES", "NO_SURCHARGES"], 
        "ACTIVITY_PRICE_SURCHARGE_STRATEGY": ["NO_SURCHARGES", "NO_SURCHARGES", "NO_SURCHARGES"],     
        "LAST_MODIFIED_ON": [ sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY": [ "TEST_USER", "TEST_USER", "TEST_USER" ]
    };

    var aExpectedProjects = ["PR1", "PR1", "PR1", "PR1", "PR1", "PRR"]

    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                project: {
                    name: "sap.plc.db::basis.t_project",
                    data: testdata.oProjectTestData
                },
                calculation: {
                    name: "sap.plc.db::basis.t_calculation",
                    data: testdata.oCalculationTestData
                },
                lifecycle_value: {
                    name: "sap.plc.db::basis.t_lifecycle_period_value",
                    data: oLifecyclePeriodValueTestData
                },
                total_quantities: {
                    name: "sap.plc.db::basis.t_project_total_quantities",
                    data:  oTotalQuantitiesTestData
                },
                lifecycle_period_quantity_value: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
                lifecycle_configuration: "sap.plc.db::basis.t_project_lifecycle_configuration",
                lifecycle_period_type: "sap.plc.db::basis.t_project_lifecycle_period_type"
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should copy the values from old tables to the new tables and remove the data from old ones", () => {
        // arrange
        
        // act
        MigrateLifecycleQuantities.run(jasmine.dbConnection);

        // assert
        var oLifecycleValues = oMockstar.execQuery(`select * from {{lifecycle_period_quantity_value}}`);
        var oTotalQuantities = oMockstar.execQuery(`select * from {{lifecycle_configuration}}`); 
        expect(oLifecycleValues.columns.CALCULATION_ID.rows.length).toBe(5);
        expect(oTotalQuantities.columns.CALCULATION_ID.rows.length).toBe(2);
        expect(oLifecycleValues.columns.PROJECT_ID.rows).toEqual(["PR1", "PR1", "PR1", "PR1", "PR1"]);
        expect(oTotalQuantities.columns.PROJECT_ID.rows).toEqual(["PR1", "PR1"]);


        var oOldLifecycleValues = oMockstar.execQuery(`select * from {{lifecycle_value}}`);
        var oOldTotalQuantities = oMockstar.execQuery(`select * from {{total_quantities}}`);
        expect(oOldLifecycleValues.columns.RULE_ID.rows.length).toBe(0);
        expect(oOldTotalQuantities.columns.RULE_ID.rows.length).toBe(0);
    });

    it("should add data for each project in lifecycle_quantity_type", () => {
        // arrange
        oMockstar.execSingle(`update {{project}} set END_OF_PROJECT = '2017-08-20T00:00:00.000Z' where PROJECT_ID = 'PR1'`);
        oMockstar.execSingle(`update {{project}} set END_OF_PROJECT = '2014-08-20T00:00:00.000Z' where PROJECT_ID = 'PRR'`);
        oMockstar.execSingle(`update {{project}} set LIFECYCLE_VALUATION_DATE = '2011-08-20T00:00:00.000Z' where PROJECT_ID = 'PR2'`);
        oMockstar.execSingle(`update {{project}} set LIFECYCLE_VALUATION_DATE = '2011-08-20T00:00:00.000Z' where PROJECT_ID = 'PRR'`);

        // act
        MigrateLifecycleQuantities.run(jasmine.dbConnection);

        // assert
        var oProjectLifecycleQuantityType = oMockstar.execQuery(`select * from {{lifecycle_period_type}}`);
        expect(oProjectLifecycleQuantityType.columns.PROJECT_ID.rows.length).toBe(12);
        expect(oProjectLifecycleQuantityType.columns.YEAR.rows).toEqual([2011,2012,2013,2014,2015,2016,2017,2011,2011,2012,2013,2014,]);
    });

}).addTags(["All_Unit_Tests"]);