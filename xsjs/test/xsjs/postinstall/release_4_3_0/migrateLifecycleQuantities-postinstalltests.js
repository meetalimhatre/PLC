const sLifecyclePeriodValues = "sap.plc.db::basis.t_lifecycle_period_value";
const sTotalQuantitiesTable = "sap.plc.db::basis.t_project_total_quantities";
const sCalculationTable = "sap.plc.db::basis.t_calculation";
const sProjectTable =  "sap.plc.db::basis.t_project";
const sLifecyclePeriodType = "sap.plc.db::basis.t_project_lifecycle_period_type";
const sLifecyclePeriodQuantityValue= "sap.plc.db::basis.t_project_lifecycle_period_quantity_value";
const sLifecycleConfiguration= "sap.plc.db::basis.t_project_lifecycle_configuration";
var oConnection = null;

describe("Migrate lifecycle quantities after data model", () => {
    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        var sExpectedDate = new Date("2019-08-20T00:00:00.000Z").toJSON()
        const sTestUser = $.session.getUsername();
        const oLifecyclePeriodValueTestData = [
            [ 1, 1404, '3.0000000' ],
            [ 1, 1416, '4.0000000' ],
            [ 1, 1428, '5.0000000' ],
            [ 2, 1404, 5 ],
            [ 2, 1416, 10 ]
        ];
        const oTotalQuantitiesTestData = [
            [ 1, 1978, 2809, "NO_SURCHARGES", "NO_SURCHARGES", sExpectedDate, sTestUser ],
            [ 2, 2078, 4809, "NO_SURCHARGES", "NO_SURCHARGES", sExpectedDate, sTestUser ]
        ];
        const oCalculationTestData = [
            [1978, "PR1", "TestCalculation", 2809, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
            [2078, 'PR1', "TestCalc2", 4809, sExpectedDate, sTestUser, sExpectedDate, sTestUser ],
        ];

        const oProjectTestData = [
            ["PR1", "CA1", "EUR", 12, '2017-08-20T00:00:00.000Z', sExpectedDate,sExpectedDate, sTestUser, sExpectedDate, sTestUser, 1, 'PLC_STANDARD', 'PLC_STANDARD'],
            ["PR2", "CA1", "EUR", 12, '2014-08-20T00:00:00.000Z', sExpectedDate,sExpectedDate, sTestUser, sExpectedDate, sTestUser, 1, 'PLC_STANDARD', 'PLC_STANDARD']
        ]
        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`INSERT INTO "${sLifecyclePeriodValues}" (RULE_ID, LIFECYCLE_PERIOD_FROM, VALUE)
                                       VALUES (?, ?, ?)`, oLifecyclePeriodValueTestData);
            oConnection.executeUpdate(`INSERT INTO "${sTotalQuantitiesTable}" (RULE_ID, CALCULATION_ID, CALCULATION_VERSION_ID, MATERIAL_PRICE_SURCHARGE_STRATEGY, ACTIVITY_PRICE_SURCHARGE_STRATEGY, LAST_MODIFIED_ON, LAST_MODIFIED_BY )
                                       VALUES (?, ?, ?, ?, ?, ?, ?)`, oTotalQuantitiesTestData);
            oConnection.executeUpdate(`INSERT INTO "${sCalculationTable}" (CALCULATION_ID, PROJECT_ID, CALCULATION_NAME, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
                                       VALUES (?, ?, ?, ?, ?, ?, ?)`, oCalculationTestData);
            oConnection.executeUpdate(`INSERT INTO "${sProjectTable}" (PROJECT_ID, CONTROLLING_AREA_ID, REPORT_CURRENCY_ID,LIFECYCLE_PERIOD_INTERVAL, START_OF_PROJECT, END_OF_PROJECT, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY, ENTITY_ID, MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, oProjectTestData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should have the data copied in new tables", () => {
            let aLifecycleConfiguration = oConnection.executeQuery(`SELECT * FROM "${sLifecyclePeriodQuantityValue}" WHERE PROJECT_ID in ('PR1', 'PR2')`);
            let aPeriodValues = oConnection.executeQuery(`SELECT * FROM "${sLifecycleConfiguration}" WHERE PROJECT_ID IN ('PR1', 'PR2')`);
            let aPeriodType = oConnection.executeQuery(`SELECT * FROM "${sLifecyclePeriodType}" WHERE PROJECT_ID IN ('PR1', 'PR2')`);
            expect(aLifecycleConfiguration.columns.PROJECT_ID.rows.length).toBe(2);
            expect(aPeriodValues.columns.PROJECT_ID.rows.length).toBe(5);
            expect(aPeriodType.columns.PROJECT_ID.rows.length).toBe(9);
            oConnection.executeUpdate(`delete from "${sLifecyclePeriodType}" where project_id in ('PR1', 'PR2')`);
            oConnection.executeUpdate(`delete from "${sLifecyclePeriodQuantityValue}" where project_id in ('PR1', 'PR2')`);
            oConnection.executeUpdate(`delete from "${sLifecycleConfiguration}" where project_id in ('PR1', 'PR2')`);

        });
    }

});