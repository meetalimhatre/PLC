const sPriceDeterminationStrategyTable = "sap.plc.db::basis.t_price_determination_strategy";
const sPriceDeterminationStrategyTextTable = "sap.plc.db::basis.t_price_determination_strategy__text";
const sCalculationVersionTable = "sap.plc.db::basis.t_calculation_version";
const sPriceDeterminationStrategyPriceSourceTable = "sap.plc.db::basis.t_price_determination_strategy_price_source";
const sPriceSourceTable = "sap.plc.db::basis.t_price_source";
const sProjectTable = "sap.plc.db::basis.t_project";
const defaultPriceDeterminationStrategyID = 'PLC_STANDARD';
const dummyValue = 'DUMMY';
let oConnection = null;
var sTestUser = $.session.getUsername();
var sDate = new Date().toJSON();

const projectData = {
    "PROJECT_ID":                ["P1",          "P2",          "P3"      ],
    "ENTITY_ID":                 [1,             2,             3         ],
    "CONTROLLING_AREA_ID":       ['#CA1',        '#CA2',        '#CA3'    ],
    "REPORT_CURRENCY_ID":        ["EUR",         "EUR",         "EUR"     ],
    "LIFECYCLE_PERIOD_INTERVAL": [12,            12,            12        ],
    "CREATED_BY":                [sTestUser,     sTestUser,     sTestUser ],
    "LAST_MODIFIED_ON":          [sDate,         sDate,         sDate     ],
    "LAST_MODIFIED_BY":          [sTestUser,     sTestUser,     sTestUser ],
    "MATERIAL_PRICE_STRATEGY_ID":[dummyValue,    dummyValue,    dummyValue],
    "ACTIVITY_PRICE_STRATEGY_ID":[dummyValue,    dummyValue,    dummyValue]
}

const priceSourceData = {
        "PRICE_SOURCE_ID":        ["300",    "301",    "302",    "303",    "304"],
        "PRICE_SOURCE_TYPE_ID":   [1,         2,       2,        2,        2    ],
        "DETERMINATION_SEQUENCE": [1,         2,       3,        3,        2    ],
};

const cvData = {
    "CALCULATION_VERSION_ID" :    [4444,                   4445,                    4446               ],
    "CALCULATION_ID" :            [5555,                   5556,                    5557               ],
    "CALCULATION_VERSION_NAME" :  ["Baseline Version1",    "Baseline Version2",     "Baseline Version3"],
    "CALCULATION_VERSION_TYPE" :  [1,                      1,                       1                  ],
    "ROOT_ITEM_ID" :              [1,                      1,                       1                  ],
    "REPORT_CURRENCY_ID" :        ["EUR",                  "USD",                   "EUR"              ],
    "VALUATION_DATE" :            [sDate,                  sDate,                   sDate              ],
    "LAST_MODIFIED_ON" :          [sDate,                  sDate,                   sDate              ],
    "LAST_MODIFIED_BY" :          [sTestUser,              sTestUser,               sTestUser          ],
    "MASTER_DATA_TIMESTAMP" :     [sDate,                  sDate,                   sDate              ],
    "EXCHANGE_RATE_TYPE_ID" :     ["",                     "",                      ""                 ],
    "MATERIAL_PRICE_STRATEGY_ID": [dummyValue,             dummyValue,              dummyValue         ],
    "ACTIVITY_PRICE_STRATEGY_ID": [dummyValue,             dummyValue,              dummyValue         ]
};


describe("Add Price Determination Strategies", () => {
    const sCurrentSchema = jasmine.dbConnection
        .executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;

    const projectValues = [
        [projectData.PROJECT_ID[0],projectData.ENTITY_ID[0],projectData.CONTROLLING_AREA_ID[0],projectData.REPORT_CURRENCY_ID[0],projectData.LIFECYCLE_PERIOD_INTERVAL[0],
            projectData.CREATED_BY[0],projectData.LAST_MODIFIED_ON[0],projectData.LAST_MODIFIED_BY[0], projectData.MATERIAL_PRICE_STRATEGY_ID[0], projectData.ACTIVITY_PRICE_STRATEGY_ID[0]],
        [projectData.PROJECT_ID[1],projectData.ENTITY_ID[1],projectData.CONTROLLING_AREA_ID[0],projectData.REPORT_CURRENCY_ID[1],projectData.LIFECYCLE_PERIOD_INTERVAL[1],
            projectData.CREATED_BY[1],projectData.LAST_MODIFIED_ON[1],projectData.LAST_MODIFIED_BY[1], projectData.MATERIAL_PRICE_STRATEGY_ID[1], projectData.ACTIVITY_PRICE_STRATEGY_ID[1]],
        [projectData.PROJECT_ID[2],projectData.ENTITY_ID[2],projectData.CONTROLLING_AREA_ID[0],projectData.REPORT_CURRENCY_ID[2],projectData.LIFECYCLE_PERIOD_INTERVAL[2],
            projectData.CREATED_BY[2],projectData.LAST_MODIFIED_ON[2],projectData.LAST_MODIFIED_BY[2], projectData.MATERIAL_PRICE_STRATEGY_ID[2], projectData.ACTIVITY_PRICE_STRATEGY_ID[2]]
    ]

    const priceSourceValues = [
        [priceSourceData.PRICE_SOURCE_ID[0], priceSourceData.PRICE_SOURCE_TYPE_ID[0], priceSourceData.DETERMINATION_SEQUENCE[0]],
        [priceSourceData.PRICE_SOURCE_ID[1], priceSourceData.PRICE_SOURCE_TYPE_ID[1], priceSourceData.DETERMINATION_SEQUENCE[1]],
        [priceSourceData.PRICE_SOURCE_ID[2], priceSourceData.PRICE_SOURCE_TYPE_ID[2], priceSourceData.DETERMINATION_SEQUENCE[2]]
    ]

    const calculationVersionValues = [
        [cvData.CALCULATION_VERSION_ID[0], cvData.CALCULATION_ID[0], cvData.CALCULATION_VERSION_NAME[0], cvData.CALCULATION_VERSION_TYPE[0], cvData.ROOT_ITEM_ID[0],
            cvData.REPORT_CURRENCY_ID[0], cvData.VALUATION_DATE[0], cvData.LAST_MODIFIED_ON[0], cvData.LAST_MODIFIED_BY[0], cvData.MASTER_DATA_TIMESTAMP[0],
            cvData.EXCHANGE_RATE_TYPE_ID[0], cvData.MATERIAL_PRICE_STRATEGY_ID[0], cvData.ACTIVITY_PRICE_STRATEGY_ID[0]],
        [cvData.CALCULATION_VERSION_ID[1], cvData.CALCULATION_ID[1], cvData.CALCULATION_VERSION_NAME[1], cvData.CALCULATION_VERSION_TYPE[1], cvData.ROOT_ITEM_ID[1],
            cvData.REPORT_CURRENCY_ID[1], cvData.VALUATION_DATE[1], cvData.LAST_MODIFIED_ON[1], cvData.LAST_MODIFIED_BY[1], cvData.MASTER_DATA_TIMESTAMP[1],
            cvData.EXCHANGE_RATE_TYPE_ID[1], cvData.MATERIAL_PRICE_STRATEGY_ID[1], cvData.ACTIVITY_PRICE_STRATEGY_ID[1]],
    ]

    beforeOnce(() => {
            oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if(jasmine.plcTestRunParameters.mode == "prepare") {
        it("Prepare the environment", () => {
            oConnection.executeUpdate(`DELETE FROM "${sPriceSourceTable}" 
                WHERE "PRICE_SOURCE_ID" IN ('${priceSourceData.PRICE_SOURCE_ID[0]}', '${priceSourceData.PRICE_SOURCE_ID[1]}', '${priceSourceData.PRICE_SOURCE_ID[2]}') `);
            oConnection.executeUpdate(`DELETE FROM "${sPriceDeterminationStrategyPriceSourceTable}"`);

            oConnection.executeUpdate(`INSERT INTO "${sProjectTable}" 
                                        (PROJECT_ID, ENTITY_ID, CONTROLLING_AREA_ID, REPORT_CURRENCY_ID, LIFECYCLE_PERIOD_INTERVAL, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY, MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, projectValues);

            oConnection.executeUpdate(`INSERT INTO "${sCalculationVersionTable}" 
                                        (CALCULATION_VERSION_ID, CALCULATION_ID, CALCULATION_VERSION_NAME, CALCULATION_VERSION_TYPE, ROOT_ITEM_ID, REPORT_CURRENCY_ID, VALUATION_DATE, LAST_MODIFIED_ON, LAST_MODIFIED_BY,
                                            MASTER_DATA_TIMESTAMP, EXCHANGE_RATE_TYPE_ID, MATERIAL_PRICE_STRATEGY_ID, ACTIVITY_PRICE_STRATEGY_ID)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, calculationVersionValues);

            oConnection.executeUpdate(`INSERT INTO "${sPriceSourceTable}" 
                                        (PRICE_SOURCE_ID, PRICE_SOURCE_TYPE_ID, DETERMINATION_SEQUENCE)
                                        VALUES (?, ?, ?)`, priceSourceValues);

            oConnection.commit();
        });
    }

    if(jasmine.plcTestRunParameters.mode == "assert") {
        it("Default price strategies should exist in Price Determination Strategy Table", () => {
            let actualResult = oConnection.executeQuery(
                `SELECT PRICE_DETERMINATION_STRATEGY_TYPE_ID FROM "${sCurrentSchema}"."${sPriceDeterminationStrategyTable}"
                WHERE PRICE_DETERMINATION_STRATEGY_ID='${defaultPriceDeterminationStrategyID}'`
            );

            let expectedResult = [{ PRICE_DETERMINATION_STRATEGY_TYPE_ID: 1 },
                { PRICE_DETERMINATION_STRATEGY_TYPE_ID: 2 }];

            expect(expectedResult).toEqual(actualResult);
        });

        it("Texts for default price strategies should exist in Price Determination Strategy Text Table", () => {
            let actualResult = oConnection.executeQuery(
                `SELECT PRICE_DETERMINATION_STRATEGY_TYPE_ID, LANGUAGE FROM "${sCurrentSchema}"."${sPriceDeterminationStrategyTextTable}"
                WHERE PRICE_DETERMINATION_STRATEGY_ID='${defaultPriceDeterminationStrategyID}'`
            );
            
            expect(actualResult).toMatchData({
                "PRICE_DETERMINATION_STRATEGY_TYPE_ID": [1, 1, 2, 2],
                "LANGUAGE": ['EN', 'DE', 'EN', 'DE']
            }, ["PRICE_DETERMINATION_STRATEGY_TYPE_ID", "LANGUAGE", "LANGUAGE"]);
        });

        it("For each material or activity price source, a line should be added in price_determination_strategy_price_source", () => {
            let actualResult = oConnection.executeQuery(
                `SELECT "PRICE_SOURCE_ID", "PRICE_SOURCE_TYPE_ID", "DETERMINATION_SEQUENCE"
                FROM "${sCurrentSchema}"."${sPriceDeterminationStrategyPriceSourceTable}"
                ORDER BY PRICE_SOURCE_ID, PRICE_SOURCE_TYPE_ID`
            );

            let expectedResult = oConnection.executeQuery(
                `SELECT "PRICE_SOURCE_ID", "PRICE_SOURCE_TYPE_ID", "DETERMINATION_SEQUENCE" -1 as "DETERMINATION_SEQUENCE"
                FROM "${sCurrentSchema}"."${sPriceSourceTable}"
                WHERE PRICE_SOURCE_TYPE_ID IN (1,2)
                ORDER BY PRICE_SOURCE_ID, PRICE_SOURCE_TYPE_ID`
            );

            expect(expectedResult).toEqual(actualResult);
        });

        it("In the project table, MATERIAL_PRICE_STRATEGY_ID and ACTIVITY_PRICE_STRATEGY_ID should be default", () => {
            let actualResultForMaterial = oConnection.executeQuery(
                `SELECT "MATERIAL_PRICE_STRATEGY_ID"
                FROM "${sCurrentSchema}"."${sProjectTable}"
                WHERE "PROJECT_ID" IN ('${projectData.PROJECT_ID[0]}', '${projectData.PROJECT_ID[1]}', '${projectData.PROJECT_ID[2]}')`
            );

            let actualResultForActivity = oConnection.executeQuery(
                `SELECT "ACTIVITY_PRICE_STRATEGY_ID"
                FROM "${sCurrentSchema}"."${sProjectTable}"
                WHERE "PROJECT_ID" IN ('${projectData.PROJECT_ID[0]}', '${projectData.PROJECT_ID[1]}', '${projectData.PROJECT_ID[2]}')`
            );

            let expectedResultForMaterial = { MATERIAL_PRICE_STRATEGY_ID: defaultPriceDeterminationStrategyID };
            let expectedResultForActivity = { ACTIVITY_PRICE_STRATEGY_ID: defaultPriceDeterminationStrategyID };

            actualResultForMaterial.forEach(function(entry) {
                expect(expectedResultForMaterial).toEqual(entry);
            });

            actualResultForActivity.forEach(function(entry) {
                expect(expectedResultForActivity).toEqual(entry);
            });
            
        });

        it("In the calculation version table, MATERIAL_PRICE_STRATEGY_ID and ACTIVITY_PRICE_STRATEGY_ID should be default", () => {
            let actualResultForMaterial = oConnection.executeQuery(
                `SELECT "MATERIAL_PRICE_STRATEGY_ID"
                FROM "${sCurrentSchema}"."${sCalculationVersionTable}"
                WHERE "CALCULATION_VERSION_ID" IN (${cvData.CALCULATION_VERSION_ID[0]}, ${cvData.CALCULATION_VERSION_ID[1]}, ${cvData.CALCULATION_VERSION_ID[2]})`
            );

            let actualResultForActivity = oConnection.executeQuery(
                `SELECT "ACTIVITY_PRICE_STRATEGY_ID"
                FROM "${sCurrentSchema}"."${sCalculationVersionTable}"
                WHERE "CALCULATION_VERSION_ID" IN (${cvData.CALCULATION_VERSION_ID[0]}, ${cvData.CALCULATION_VERSION_ID[1]}, ${cvData.CALCULATION_VERSION_ID[2]})`
            );

            let expectedResultForMaterial = { MATERIAL_PRICE_STRATEGY_ID: defaultPriceDeterminationStrategyID };
            let expectedResultForActivity = { ACTIVITY_PRICE_STRATEGY_ID: defaultPriceDeterminationStrategyID };

            actualResultForMaterial.forEach(function(entry) {
                expect(expectedResultForMaterial).toEqual(entry);
            });

            actualResultForActivity.forEach(function(entry) {
                expect(expectedResultForActivity).toEqual(entry);
            });
            
        });
    }
});