const _                      = require("lodash");
const MockstarFacade         = require("../../testtools/mockstar_facade").MockstarFacade;
const TestDataUtility        = require("../../testtools/testDataUtility").TestDataUtility;
const MockstarHelpers        = require("../../testtools/mockstar_helpers");

const Persistency            = ($.import("xs.db", "persistency")).Persistency;
const TaskService            = require("../../../lib/xs/service/taskService").TaskService;
const TaskType               = require("../../../lib/xs/util/constants").TaskType;
const TaskStatus             = require("../../../lib/xs/util/constants").TaskStatus;
const CalculationVersionType = require("../../../lib/xs/util/constants").CalculationVersionType;
const LifecycleCalculator    = ($.import("xs.followUp", "lifecycleCalculator")).LifecycleVersionCalculator;


const oTestConnectionFactory = {
    getConnection: function() {
        var oConnection = jasmine.dbConnection;
        oConnection.commit = () => {}; // override commit since production code is calling a commit, but nothing should be committed to db tables!
        return oConnection;
    }
};

if (jasmine.plcTestRunParameters.mode === 'all' && jasmine.plcTestRunParameters.generatedFields === false) {
    describe('xsjs.followUp.lifecycleCalculator-integrationtests', () => {

        const iTaskId = 1;
        const sProjectId = "#P1";

        var oMockstar = null;

        const oTotalQuantitiesData = {
            "PROJECT_ID"                          : ['#P1'],
            "CALCULATION_ID"                   : [4],
            "CALCULATION_VERSION_ID"           : [4],
            "LAST_MODIFIED_ON"                 : ["2000-01-01 00:00:00.0000000"],
            "LAST_MODIFIED_BY"         : ["#CONTROLLER"]

        }
        const oLifecyclePeriodValueData = {
            "PROJECT_ID"                          : ['#P1', '#P1', '#P1', '#P1', '#P1', '#P1', '#P1', '#P1'],
            "CALCULATION_ID"                   : [4, 4, 4, 4, 4, 4, 4, 4],
            "LIFECYCLE_PERIOD_FROM": [1404, 1416, 1418, 1420, 1428, 1440, 1452, 1464],
            "VALUE"                : [500, 500, 500, 500, 1000, 1000, 500, 500],
            "LAST_MODIFIED_ON"                 : ["2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000"],
            "LAST_MODIFIED_BY"         : ["#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER" ]
        };

        var oProjectLifecyclePeriodTypeData = {
            "PROJECT_ID":		[ '#P1', '#P1', '#P1', '#P1', '#P1', '#P1' ],
            "YEAR":				[ 2017, 2018, 2019, 2020, 2021, 2022 ],
            "PERIOD_TYPE" :		[ 'YEARLY', 'MONTHLY', 'YEARLY', 'YEARLY', 'YEARLY', 'YEARLY' ],
            "LAST_MODIFIED_ON": ["2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000"],
            "LAST_MODIFIED_BY": ["#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER" ]
        };

        let oProjectMonthlyLifecyclePeriod = {
            "PROJECT_ID": ['#P1', '#P1', '#P1', '#P1', '#P1', '#P1', '#P1', '#P1'],
            "YEAR": [2017, 2018, 2018, 2018, 2019, 2020, 2021, 2022],
            "SELECTED_MONTH": [1, 1, 3, 5, 1, 1, 1, 1],
            "MONTH_DESCRIPTION": ["M1", "M1", "M3", "M5", "M1", "M1", "M1", "M1"],
            "LAST_MODIFIED_ON": ["2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000", "2000-01-01 00:00:00.0000000"],
            "LAST_MODIFIED_BY": ["#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER"]
        };


        /**
         * Creates a task object, which can be used to insert data into t_task.
         *
         * @param  {string} sTaskType   Type of the task
         * @param  {string} sTaskStatus Status of the task
         * @param  {object} sParameters Parameters as serialized JSON object.
         */
        function createTask(sTaskType, sTaskStatus, mParameters) {
            return {
                "TASK_ID": iTaskId,
                "SESSION_ID": $.session.getUsername(),
                "TASK_TYPE": sTaskType,
                "STATUS": sTaskStatus,
                "PARAMETERS": mParameters,
                "PROGRESS_STEP": 0,
                "PROGRESS_TOTAL": 4,
                "STARTED": new Date(),
                "LAST_UPDATED_ON": new Date(),
                "ERROR_CODE": null,
                "ERROR_DETAILS": null
            }
        };

        /**
         * Executes the LifecycleCalculator (unit under test), to create lifecycle versions.
         */
        function calculateLifecycle() {
            const sParameters = JSON.stringify({
                PROJECT_ID: sProjectId
            });

            const oPersistency = new Persistency(oTestConnectionFactory.getConnection());
            const oTaskService = new TaskService($, oPersistency);

            const oTask = createTask(TaskType.CALCULATE_LIFECYCLE_VERSIONS, TaskStatus.INACTIVE, sParameters);
            oMockstar.insertTableData("task", oTask);

            new LifecycleCalculator(iTaskId, oPersistency, oTestConnectionFactory, oTaskService).calculate();
        };

        beforeOnce(function() {
            oMockstar = new MockstarFacade({
                substituteTables: {
                    project: {
                        name: "sap.plc.db::basis.t_project",
                        data: "t_project.csv"
                    },
                    calculation: {
                        name: "sap.plc.db::basis.t_calculation",
                        data: "t_calculation.csv"
                    },
                    calculation_version: {
                        name: "sap.plc.db::basis.t_calculation_version",
                        data: "t_calculation_version.csv"
                    },
                    item: {
                        name: "sap.plc.db::basis.t_item",
                        data: "t_item.csv"
                    },
                    item_ext: {
                        name: "sap.plc.db::basis.t_item_ext",
                    },
                    costing_sheet: {
                        name: "sap.plc.db::basis.t_costing_sheet",
                        data: "t_costing_sheet.csv"
                    },
                    costing_sheet_row: {
                        name: "sap.plc.db::basis.t_costing_sheet_row",
                        data: "t_costing_sheet_row.csv"
                    },
                    costing_sheet_row_dependencies: {
                        name: "sap.plc.db::basis.t_costing_sheet_row_dependencies",
                        data: "t_costing_sheet_row_dependencies.csv"
                    },
                    costing_sheet_base: {
                        name: "sap.plc.db::basis.t_costing_sheet_base"
                    },
                    costing_sheet_base_row: {
                        name: "sap.plc.db::basis.t_costing_sheet_base_row"
                    },
                    costing_sheet_overhead: {
                        name: "sap.plc.db::basis.t_costing_sheet_overhead",
                        data: "t_costing_sheet_overhead.csv"
                    },
                    costing_sheet_overhead_row: {
                        name: "sap.plc.db::basis.t_costing_sheet_overhead_row",
                        data: "t_costing_sheet_overhead_row.csv"
                    },
                    component_split: {
                        name: "sap.plc.db::basis.t_component_split",
                        data: "t_component_split.csv"
                    },
                    component_split_account_group: {
                        name: "sap.plc.db::basis.t_component_split_account_group",
                        data: "t_component_split_account_group.csv"
                    },
                    uom: {
                        name: "sap.plc.db::basis.t_uom",
                        data: "t_uom.csv"
                    },
                    currency_conversion: {
                        name: "sap.plc.db::basis.t_currency_conversion",
                        data: "t_currency_conversion.csv"
                    },
                    task: {
                        name: "sap.plc.db::basis.t_task"
                    },
                    project_lifecycle_configuration: {
                        name: "sap.plc.db::basis.t_project_lifecycle_configuration",
                    },
                    lifecycle_period_value: {
                        name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
                        data: oLifecyclePeriodValueData
                    },
                    project_lifecycle_period_type: {
                        name: "sap.plc.db::basis.t_project_lifecycle_period_type",
                        data: oProjectLifecyclePeriodTypeData
                    },
                    project_monthly_lifecycle_period: {
                        name: "sap.plc.db::basis.t_project_monthly_lifecycle_period",
                        data: oProjectMonthlyLifecyclePeriod
                    },
                    project_one_time_project_cost:{
                        name: "sap.plc.db::basis.t_one_time_project_cost",
                    },
                    project_one_time_product_cost:{
                        name: "sap.plc.db::basis.t_one_time_product_cost",
                    },
                    project_one_time_cost_lifecycle_value:{
                        name: "sap.plc.db::basis.t_one_time_cost_lifecycle_value",
                    },
                    material_price_surcharges: {
                        name: "sap.plc.db::basis.t_project_material_price_surcharges",
                        data: "t_project_material_price_surcharges.csv"
                    },
                    material_price_surcharge_values: {
                        name: "sap.plc.db::basis.t_project_material_price_surcharge_values",
                        data: "t_project_material_price_surcharge_values.csv"
                    },
                    activity_price_surcharges: {
                        name: "sap.plc.db::basis.t_project_activity_price_surcharges",
                        data: "t_project_activity_price_surcharges.csv"
                    },
                    activity_price_surcharge_values: {
                        name: "sap.plc.db::basis.t_project_activity_price_surcharge_values",
                        data: "t_project_activity_price_surcharge_values.csv"
                    },
                    plant: {
                        name: "sap.plc.db::basis.t_plant",
                        data: "t_plant.csv"
                    },
                    material: {
                        name: "sap.plc.db::basis.t_material",
                        data: "t_material.csv"
                    },
                    material_plant: {
                        name: "sap.plc.db::basis.t_material_plant",
                        data: "t_material_plant.csv"
                    },
                    account_group: {
                        name: "sap.plc.db::basis.t_account_group",
                        data: "t_account_group.csv"
                    },
                    account_account_group: {
                        name: "sap.plc.db::basis.t_account_account_group",
                        data: "t_account_account_group.csv"
                    },

                },
                csvPackage: "db.content"
            });

        });

        afterOnce(function() {
            oMockstar.cleanup();
        });


        /**
         * Executes a lifecycle creation test suite for a provided config. The suite encompasses tests for
         *  - successfull task completion
         *  - creation of the right amount lifecycle versions
         *  - for each lifecycle version:
         *      - checking if a version was created for the right period
         *      - checking if the name of the lifecycle is correctly set
         *      - check of the valuation date
         *      - check of total quantity
         *      - check of total costs (surcharge test)
         *      - test for specific items in the lifecyle version
         * @param  {object} oConfig Configuration object containg expected values and surcharge strategies
         */
        function runTestSuite(oConfig) {

            describe(`Surcharge Strategies: ${oConfig.materialPriceSurchargeStrategy} (MS), ${oConfig.activityPriceSurchargeStrategy} (AS)`, () => {

                var oTaskTableData = null;
                var oCalculationVersionTableData = null;
                var oItemsTableData = null;

                beforeOnce(() => {
                    oMockstar.clearAllTables();
                    oMockstar.initializeData();
                    const oTotalQuantitiesForSuite = _.extend({}, oTotalQuantitiesData, {
                        MATERIAL_PRICE_SURCHARGE_STRATEGY : [oConfig.materialPriceSurchargeStrategy],
                        ACTIVITY_PRICE_SURCHARGE_STRATEGY : [oConfig.activityPriceSurchargeStrategy]
                    })
                    oMockstar.insertTableData("project_lifecycle_configuration", oTotalQuantitiesForSuite);

                    // directly calculate the lifecylcle here, because it only needs to be done once and would take a lot of time if done for every test case;
                    // since separated test cases for every acceptance criteria are desired, this accelerates the execution significantly
                    calculateLifecycle();

                    // due to connection isolation, test cases cannot make use mockstar to make queries (result sets would always be empty, dunno why exactly); for
                    // this reason all the table contents needed for the test cases are captured here and bound to variables, which are used by the test cases
                    oTaskTableData = MockstarHelpers.convertResultToArray(oMockstar.execQuery(`select * from {{task}} where task_id = ${iTaskId}`));
                    oCalculationVersionTableData = MockstarHelpers.convertResultToArray(oMockstar.execQuery(
                        `
                    select cv.* 
                    from {{calculation_version}} as cv
                        inner join {{calculation}} as c
                            on cv.calculation_id = c.calculation_id
                    where c.project_id = '${sProjectId}'`
                    ));
                    const iIndexOf2018M3 = oCalculationVersionTableData.CALCULATION_VERSION_NAME.indexOf('#Version 1 - 2018 - M3');
                    const iIndexOf2018M5 = oCalculationVersionTableData.CALCULATION_VERSION_NAME.indexOf('#Version 1 - 2018 - M5');
                    oCalculationVersionTableData.LIFECYCLE_PERIOD_FROM[iIndexOf2018M3] = 1418;
                    oCalculationVersionTableData.LIFECYCLE_PERIOD_FROM[iIndexOf2018M5] = 1420;
                    oItemsTableData = MockstarHelpers.convertResultToArray(oMockstar.execQuery(`select * from {{item}}`));

                });

                it("should set task for calculating life cycle to COMPLETED", () => {
                    expect(oTaskTableData.TASK_ID.length).toEqual(1);
                    expect(oTaskTableData.TASK_ID[0]).toEqual(iTaskId);
                    expect(oTaskTableData.STATUS[0]).toEqual(TaskStatus.COMPLETED);
                });

                it(`should create ${oConfig.expectedLifecycleVersions.length} lifecycle calculation versions`, () => {
                    const iActualLifecycleVersionCount = oCalculationVersionTableData.CALCULATION_VERSION_TYPE.filter(iType => iType === CalculationVersionType.Lifecycle)
                        .length;
                    const iExpectedLifecycleVersionCount = oConfig.expectedLifecycleVersions.length;
                    expect(iActualLifecycleVersionCount).toEqual(iExpectedLifecycleVersionCount);
                });

                function getVersionForPeriod(iPeriod) {
                    const aVersionsForPeriod = new TestDataUtility(oCalculationVersionTableData).getObjects((oVersion, iIndex) => oVersion.LIFECYCLE_PERIOD_FROM === iPeriod);
                    expect(aVersionsForPeriod.length).toBe(1);
                    return aVersionsForPeriod[0];
                }

                function getRootItemForPeriod(iPeriod) {
                    const oVersionForPeriod = getVersionForPeriod(iPeriod);
                    return getItemByIdForPeriod(iPeriod, oVersionForPeriod.ROOT_ITEM_ID);
                }

                function getItemByIdForPeriod(iPeriod, iItemId){
                    const oVersionForPeriod = getVersionForPeriod(iPeriod);
                    const aItems = new TestDataUtility(oItemsTableData).getObjects((oItem, iIndex) =>
                        oItem.ITEM_ID === iItemId && oItem.CALCULATION_VERSION_ID === oVersionForPeriod.CALCULATION_VERSION_ID);
                    expect(aItems.length).toBe(1);
                    return aItems[0];
                }

                oConfig.expectedLifecycleVersions.forEach(oExpectedVersion => {

                    describe(`Checking period ${oExpectedVersion.LIFECYCLE_PERIOD_FROM}`, () => {
                        var oVersionForPeriod = null;
                        beforeEach(() => {
                            oVersionForPeriod = getVersionForPeriod(oExpectedVersion.LIFECYCLE_PERIOD_FROM);
                        })

                        it(`should create lifecycle version for period`, () => {
                            expect(oVersionForPeriod).toBeDefined();
                        });

                        it( `should set name of lifecycle version ending with "- ${oExpectedVersion.LIFECYCLE_YEAR}"`, () => {
                            if (oExpectedVersion.LIFECYCLE_YEAR === 2018) {
                                const iExpectedMonth = oExpectedVersion.LIFECYCLE_PERIOD_FROM % 12 + 1;
                                expect(oVersionForPeriod.CALCULATION_VERSION_NAME.endsWith(`- ${oExpectedVersion.LIFECYCLE_YEAR} - M${iExpectedMonth}`)).toBe(true);
                            } else {
                                expect(oVersionForPeriod.CALCULATION_VERSION_NAME.endsWith(`- ${oExpectedVersion.LIFECYCLE_YEAR}`)).toBe(true);
                            }
                        });

                        it(`should set valuation date to ${oExpectedVersion.VALUATION_DATE}`, () => {
                            expect(oVersionForPeriod.VALUATION_DATE).toEqual(oExpectedVersion.VALUATION_DATE);
                        });

                        it(`should set total quantity of lifecycle version to ${oExpectedVersion.TOTAL_QUANTITY}`, () => {
                            const oRootItem = getRootItemForPeriod(oExpectedVersion.LIFECYCLE_PERIOD_FROM);
                            expect(oRootItem.TOTAL_QUANTITY).toEqual(oExpectedVersion.TOTAL_QUANTITY);
                        });

                        it(`should set total cost of lifecycle version to ${oExpectedVersion.TOTAL_COST}`, () => {
                            const oRootItem = getRootItemForPeriod(oExpectedVersion.LIFECYCLE_PERIOD_FROM);
                            expect(oRootItem.TOTAL_COST).toEqual(oExpectedVersion.TOTAL_COST);
                        });

                        if(oExpectedVersion.ITEMS && oExpectedVersion.ITEMS.length > 0){
                            oExpectedVersion.ITEMS.forEach(oExpectedItem => {
                                it(`should set price of item with description "${oExpectedItem.ITEM_DESCRIPTION}" (id: ${oExpectedItem.ITEM_ID}) to ${oExpectedItem.PRICE_FIXED_PORTION}, ${oExpectedItem.PRICE_VARIABLE_PORTION}`, () => {
                                    const oItem = getItemByIdForPeriod(oExpectedVersion.LIFECYCLE_PERIOD_FROM, oExpectedItem.ITEM_ID);
                                    expect(oItem.PRICE_FIXED_PORTION).toEqual(oExpectedItem.PRICE_FIXED_PORTION);
                                    expect(oItem.PRICE_VARIABLE_PORTION).toEqual(oExpectedItem.PRICE_VARIABLE_PORTION);
                                })
                            })
                        }
                    });
                });
            });
        }


        /**
         * Execute the test suite for surcharge strategy NO_SURCHARGES. This ensures that surcharges are computed correctly.
         */
        runTestSuite({
            materialPriceSurchargeStrategy: "NO_SURCHARGES",
            activityPriceSurchargeStrategy: "NO_SURCHARGES",
            expectedLifecycleVersions: [{
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1404,
                LIFECYCLE_YEAR: 2017,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "44334.6000000",
                VALUATION_DATE: '2017-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1416,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54207.2000000",
                VALUATION_DATE: '2018-01-01T00:00:00.000Z',
                ITEMS: [{
                    ITEM_ID: 15, //#CC1, #AT2, "turn impeller according to drawing" (labor)
                    ITEM_DESCRIPTION: "turn impeller according to drawing (labor)",
                    PRICE_FIXED_PORTION: "65.0000000",
                    PRICE_VARIABLE_PORTION: "55.0000000"
                }]
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1418,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54207.2000000",
                VALUATION_DATE: '2018-03-01T00:00:00.000Z',
                ITEMS: [{
                    ITEM_ID: 15, //#CC1, #AT2, "turn impeller according to drawing" (labor)
                    ITEM_DESCRIPTION: "turn impeller according to drawing (labor)",
                    PRICE_FIXED_PORTION: "65.0000000",
                    PRICE_VARIABLE_PORTION: "55.0000000"
                }]
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1420,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54207.2000000",
                VALUATION_DATE: '2018-05-01T00:00:00.000Z',
                ITEMS: [{
                    ITEM_ID: 15, //#CC1, #AT2, "turn impeller according to drawing" (labor)
                    ITEM_DESCRIPTION: "turn impeller according to drawing (labor)",
                    PRICE_FIXED_PORTION: "65.0000000",
                    PRICE_VARIABLE_PORTION: "55.0000000"
                }]
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1428,
                LIFECYCLE_YEAR: 2019,
                TOTAL_QUANTITY: "1000.0000000",
                TOTAL_COST: "110607.2000000",
                VALUATION_DATE: '2019-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1440,
                LIFECYCLE_YEAR: 2020,
                TOTAL_QUANTITY: "1000.0000000",
                TOTAL_COST: "101407.2000000",
                VALUATION_DATE: '2020-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1452,
                LIFECYCLE_YEAR: 2021,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "51857.2000000",
                VALUATION_DATE: '2021-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1464,
                LIFECYCLE_YEAR: 2022,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "51857.2000000",
                VALUATION_DATE: '2022-05-01T00:00:00.000Z'
            }
            ]});

        /**
         * Execute the test suite for surcharge strategy WITH_PRICE_DETERMINATION. This ensures that surcharges are computed correctly
         * for this strategy.
         */
        runTestSuite({
            materialPriceSurchargeStrategy: "WITH_PRICE_DETERMINATION",
            activityPriceSurchargeStrategy: "WITH_PRICE_DETERMINATION",
            expectedLifecycleVersions: [{
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1404,
                LIFECYCLE_YEAR: 2017,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "46911.5800000",
                VALUATION_DATE: '2017-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1416,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "58141.5600000",
                VALUATION_DATE: '2018-01-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1418,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "58141.5600000",
                VALUATION_DATE: '2018-03-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1420,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "58141.5600000",
                VALUATION_DATE: '2018-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1428,
                LIFECYCLE_YEAR: 2019,
                TOTAL_QUANTITY: "1000.0000000",
                TOTAL_COST: "119025.5600000",
                VALUATION_DATE: '2019-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1440,
                LIFECYCLE_YEAR: 2020,
                TOTAL_QUANTITY: "1000.0000000",
                TOTAL_COST: "110557.9200000",
                VALUATION_DATE: '2020-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1452,
                LIFECYCLE_YEAR: 2021,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54018.0640000",
                VALUATION_DATE: '2021-05-01T00:00:00.000Z',
                ITEMS: [{
                    ITEM_ID: 15, //#CC1, #AT2, "turn impeller according to drawing" (labor)
                    ITEM_DESCRIPTION: "turn impeller according to drawing (labor)",
                    PRICE_FIXED_PORTION: "60.0000000",
                    PRICE_VARIABLE_PORTION: "120.0000000"
                }]
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1464,
                LIFECYCLE_YEAR: 2022,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54018.1360000",
                VALUATION_DATE: '2022-05-01T00:00:00.000Z'
            }
            ]});

        /**
         * Execute the test suite for surcharge strategy WITHOUT_PRICE_DETERMINATION. This ensures that surcharges are computed correctly
         * for this strategy.
         */
        runTestSuite({
            materialPriceSurchargeStrategy: "WITHOUT_PRICE_DETERMINATION",
            activityPriceSurchargeStrategy: "WITHOUT_PRICE_DETERMINATION",
            expectedLifecycleVersions: [{
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1404,
                LIFECYCLE_YEAR: 2017,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "50615.5600000",
                VALUATION_DATE: '2017-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1416,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54726.1980000",
                VALUATION_DATE: '2018-01-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1418,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54726.1980000",
                VALUATION_DATE: '2018-03-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1420,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54726.1980000",
                VALUATION_DATE: '2018-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1428,
                LIFECYCLE_YEAR: 2019,
                TOTAL_QUANTITY: "1000.0000000",
                TOTAL_COST: "118868.2023000",
                VALUATION_DATE: '2019-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1440,
                LIFECYCLE_YEAR: 2020,
                TOTAL_QUANTITY: "1000.0000000",
                TOTAL_COST: "131621.0125620",
                VALUATION_DATE: '2020-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1452,
                LIFECYCLE_YEAR: 2021,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "68862.4038528",
                VALUATION_DATE: '2021-05-01T00:00:00.000Z',
                ITEMS: [{
                    ITEM_ID: 15, //#CC1, #AT2, "turn impeller according to drawing" (labor)
                    ITEM_DESCRIPTION: "turn impeller according to drawing (labor)",
                    PRICE_FIXED_PORTION: "65.5826544",
                    PRICE_VARIABLE_PORTION: "131.1653088"
                }]
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1464,
                LIFECYCLE_YEAR: 2022,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "72275.4975103",
                VALUATION_DATE: '2022-05-01T00:00:00.000Z'
            }
            ]});

        /**
         * Execute the test suite for surcharge strategy IF_NO_PRICE_FOUND. This ensures that surcharges are computed correctly
         * for this strategy.
         */
        runTestSuite({
            materialPriceSurchargeStrategy: "IF_NO_PRICE_FOUND",
            activityPriceSurchargeStrategy: "IF_NO_PRICE_FOUND",
            expectedLifecycleVersions: [{
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1404,
                LIFECYCLE_YEAR: 2017,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "44334.6000000",
                VALUATION_DATE: '2017-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1416,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54207.2000000",
                VALUATION_DATE: '2018-01-01T00:00:00.000Z',
                ITEMS: [{
                    ITEM_ID: 15, //#CC1, #AT2, "turn impeller according to drawing" (labor)
                    ITEM_DESCRIPTION: "turn impeller according to drawing (labor)",
                    PRICE_FIXED_PORTION: "65.0000000",
                    PRICE_VARIABLE_PORTION: "55.0000000"
                }]
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1418,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54207.2000000",
                VALUATION_DATE: '2018-03-01T00:00:00.000Z',
                ITEMS: [{
                    ITEM_ID: 15, //#CC1, #AT2, "turn impeller according to drawing" (labor)
                    ITEM_DESCRIPTION: "turn impeller according to drawing (labor)",
                    PRICE_FIXED_PORTION: "65.0000000",
                    PRICE_VARIABLE_PORTION: "55.0000000"
                }]
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1420,
                LIFECYCLE_YEAR: 2018,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "54207.2000000",
                VALUATION_DATE: '2018-05-01T00:00:00.000Z',
                ITEMS: [{
                    ITEM_ID: 15, //#CC1, #AT2, "turn impeller according to drawing" (labor)
                    ITEM_DESCRIPTION: "turn impeller according to drawing (labor)",
                    PRICE_FIXED_PORTION: "65.0000000",
                    PRICE_VARIABLE_PORTION: "55.0000000"
                }]
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1428,
                LIFECYCLE_YEAR: 2019,
                TOTAL_QUANTITY: "1000.0000000",
                TOTAL_COST: "110607.2000000",
                VALUATION_DATE: '2019-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1440,
                LIFECYCLE_YEAR: 2020,
                TOTAL_QUANTITY: "1000.0000000",
                TOTAL_COST: "101407.2000000",
                VALUATION_DATE: '2020-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1452,
                LIFECYCLE_YEAR: 2021,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "51857.2000000",
                VALUATION_DATE: '2021-05-01T00:00:00.000Z'
            }, {
                BASE_VERSION_ID: 4,
                LIFECYCLE_PERIOD_FROM: 1464,
                LIFECYCLE_YEAR: 2022,
                TOTAL_QUANTITY: "500.0000000",
                TOTAL_COST: "51857.2000000",
                VALUATION_DATE: '2022-05-01T00:00:00.000Z'
            }
            ]});
    }).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}