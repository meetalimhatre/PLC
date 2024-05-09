const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_update_t_currency_conversion", function () {

        let oMockstarPlc = null;
        const sMasterdataTimestamp = NewDateAsISOString();
        const sCurrentUser = $.session.getUsername();
       
        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_currency_conversion", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        exchRateType: {
                            name: "sap.plc.db::basis.t_exchange_rate_type",
                            data: testDataRepl.oExchangeRateType
                        },
                        currency: {
                            name: "sap.plc.db::basis.t_currency",
                            data: testDataRepl.oCurrency
                        },
                        error: {
                            name: "sap.plc.db::map.t_replication_log",
                            data: testDataRepl.oError
                        },
                        currencyConv: {
                            name: "sap.plc.db::basis.t_currency_conversion",
                            data: testDataRepl.oCurrencyConversion
                        }
                    }
                }
            );
        });

        beforeEach(function () {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function () {
        });

        /*--- Send 2 entries with the same key (DUPLICATE_KEY_COUNT <> 1) ---*/
        it('should not insert 2 entries with the same key', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //act
            const aInputRows = [
                {
                    "EXCHANGE_RATE_TYPE_ID": testDataRepl.oCurrencyConversion.EXCHANGE_RATE_TYPE_ID[0],
                    "FROM_CURRENCY_ID": testDataRepl.oCurrencyConversion.FROM_CURRENCY_ID[0],
                    "TO_CURRENCY_ID": 'TST',
                    "FROM_FACTOR": testDataRepl.oCurrencyConversion.FROM_FACTOR[0],
                    "TO_FACTOR": testDataRepl.oCurrencyConversion.TO_FACTOR[0],
                    "RATE": '0.1259000',
                    "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                    "_SOURCE": 2
                },
                {
                    "EXCHANGE_RATE_TYPE_ID": testDataRepl.oCurrencyConversion.EXCHANGE_RATE_TYPE_ID[0],
                    "FROM_CURRENCY_ID": testDataRepl.oCurrencyConversion.FROM_CURRENCY_ID[0],
                    "TO_CURRENCY_ID": 'TST',
                    "FROM_FACTOR": testDataRepl.oCurrencyConversion.FROM_FACTOR[0],
                    "TO_FACTOR": testDataRepl.oCurrencyConversion.TO_FACTOR[0],
                    "RATE": '0.1459000',
                    "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                    "_SOURCE": 2
                }
            ];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{currencyConv}} where TO_CURRENCY_ID = '${aInputRows[0].TO_CURRENCY_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");

            let aResults = oMockstarPlc.execQuery(`select * from {{currencyConv}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{currencyConv}}`);

            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oCurrencyConversion, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR","RATE", "TO_FACTOR","VALID_FROM",  "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should insert a new entry', function () {
            const aInputRows = [{
                "EXCHANGE_RATE_TYPE_ID": 'VCC',
                "FROM_CURRENCY_ID": testDataRepl.oCurrency.CURRENCY_ID[1], //USD
                "TO_CURRENCY_ID": testDataRepl.oCurrency.CURRENCY_ID[0],  //EUR
                "FROM_FACTOR": testDataRepl.oCurrencyConversion.FROM_FACTOR[0],
                "TO_FACTOR": testDataRepl.oCurrencyConversion.TO_FACTOR[0],
                "RATE": '1.1410000',
                "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                "_SOURCE": 2
            }];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{currencyConv}} where EXCHANGE_RATE_TYPE_ID = '${aInputRows[0].EXCHANGE_RATE_TYPE_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "currencyConv");

            let aResults = oMockstarPlc.execQuery(`select * from {{currencyConv}} where EXCHANGE_RATE_TYPE_ID = '${aInputRows[0].EXCHANGE_RATE_TYPE_ID}'`);
            expect(aResults).toBeDefined();

            aResults = mockstarHelpers.convertResultToArray(aResults);

            expect(aResults).toMatchData({
                "EXCHANGE_RATE_TYPE_ID": [aInputRows[0].EXCHANGE_RATE_TYPE_ID],
                "FROM_CURRENCY_ID": [aInputRows[0].FROM_CURRENCY_ID],
                "TO_CURRENCY_ID": [aInputRows[0].TO_CURRENCY_ID],
                "FROM_FACTOR": [aInputRows[0].FROM_FACTOR],
                "TO_FACTOR": [aInputRows[0].TO_FACTOR],
                "RATE": [aInputRows[0].RATE],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR",
                "TO_FACTOR", "RATE", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should update an existing entry', function () {
            //update rate
            const aInputRows = [{
                "EXCHANGE_RATE_TYPE_ID": testDataRepl.oCurrencyConversion.EXCHANGE_RATE_TYPE_ID[0],
                "FROM_CURRENCY_ID": testDataRepl.oCurrencyConversion.FROM_CURRENCY_ID[0],
                "TO_CURRENCY_ID": testDataRepl.oCurrencyConversion.TO_CURRENCY_ID[0],
                "FROM_FACTOR": testDataRepl.oCurrencyConversion.FROM_FACTOR[0],
                "TO_FACTOR": testDataRepl.oCurrencyConversion.TO_FACTOR[0],
                "RATE": '1.1510000',
                "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                "_SOURCE": 2
            }];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{currencyConv}} where EXCHANGE_RATE_TYPE_ID = '${aInputRows[0].EXCHANGE_RATE_TYPE_ID}'
                and FROM_CURRENCY_ID = '${aInputRows[0].FROM_CURRENCY_ID}' and TO_CURRENCY_ID = '${aInputRows[0].TO_CURRENCY_ID}' `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);

            expect(aBeforeResults).toMatchData({
                "EXCHANGE_RATE_TYPE_ID": [testDataRepl.oCurrencyConversion.EXCHANGE_RATE_TYPE_ID[0]],
                "FROM_CURRENCY_ID": [testDataRepl.oCurrencyConversion.FROM_CURRENCY_ID[0]],
                "TO_CURRENCY_ID": [testDataRepl.oCurrencyConversion.TO_CURRENCY_ID[0]],
                "FROM_FACTOR": [testDataRepl.oCurrencyConversion.FROM_FACTOR[0]],
                "TO_FACTOR": [testDataRepl.oCurrencyConversion.TO_FACTOR[0]],
                "RATE": [testDataRepl.oCurrencyConversion.RATE[0]], // old 1.0912000
                "_VALID_TO": [testDataRepl.oCurrencyConversion._VALID_TO[0]],
                "_SOURCE": [testDataRepl.oCurrencyConversion._SOURCE[0]],
                "_CREATED_BY": [testDataRepl.oCurrencyConversion._CREATED_BY[0]],
            }, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR",
                "TO_FACTOR", "RATE", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "currencyConv");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{currencyConv}} where EXCHANGE_RATE_TYPE_ID = '${aInputRows[0].EXCHANGE_RATE_TYPE_ID}'
                and FROM_CURRENCY_ID = '${aInputRows[0].FROM_CURRENCY_ID}' and TO_CURRENCY_ID = '${aInputRows[0].TO_CURRENCY_ID}'`);

            expect(aResultsUpdated).toBeDefined();
            aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);
            expect(aResultsUpdated).toMatchData({
                "EXCHANGE_RATE_TYPE_ID": [testDataRepl.oCurrencyConversion.EXCHANGE_RATE_TYPE_ID[0],
                aInputRows[0].EXCHANGE_RATE_TYPE_ID],
                "FROM_CURRENCY_ID": [testDataRepl.oCurrencyConversion.FROM_CURRENCY_ID[0], aInputRows[0].FROM_CURRENCY_ID],
                "TO_CURRENCY_ID": [testDataRepl.oCurrencyConversion.TO_CURRENCY_ID[0], aInputRows[0].TO_CURRENCY_ID],
                "FROM_FACTOR": [testDataRepl.oCurrencyConversion.FROM_FACTOR[0], aInputRows[0].FROM_FACTOR],
                "TO_FACTOR": [testDataRepl.oCurrencyConversion.TO_FACTOR[0], aInputRows[0].TO_FACTOR],
                "RATE": [testDataRepl.oCurrencyConversion.RATE[0], aInputRows[0].RATE],
                "VALID_FROM": [testDataRepl.oCurrencyConversion.VALID_FROM[0], aInputRows[0].VALID_FROM],     
                "_SOURCE": [testDataRepl.oCurrencyConversion._SOURCE[0], aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR",
                "TO_FACTOR", "RATE","VALID_FROM","_SOURCE", "_CREATED_BY"]);

        });

        it('should not update an entry if exchange rate type does not exist', function () {
            const aInputRows = [{
                "EXCHANGE_RATE_TYPE_ID": 'STANDARD1',
                "FROM_CURRENCY_ID": testDataRepl.oCurrencyConversion.FROM_CURRENCY_ID[0],
                "TO_CURRENCY_ID": testDataRepl.oCurrencyConversion.TO_CURRENCY_ID[0],
                "FROM_FACTOR": testDataRepl.oCurrencyConversion.FROM_FACTOR[0],
                "TO_FACTOR": testDataRepl.oCurrencyConversion.TO_FACTOR[0],
                "RATE": '1.1110000',
                "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                "_SOURCE": 2
            }];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{currencyConv}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oCurrencyConversion, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR", "TO_FACTOR", "RATE", "VALID_FROM", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);


            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();

            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['EXCHANGE_RATE_TYPE_ID'],
                "FIELD_VALUE": [aInputRows[0].EXCHANGE_RATE_TYPE_ID],
                "MESSAGE_TEXT": ['Unknown Exchange rate type ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_currency_conversion']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            //check old value was not changed
            let aResults = oMockstarPlc.execQuery(`select * from {{currencyConv}} where FROM_CURRENCY_ID = '${aInputRows[0].FROM_CURRENCY_ID}' and TO_CURRENCY_ID = '${aInputRows[0].TO_CURRENCY_ID}' and VALID_FROM = '${aInputRows[0].VALID_FROM}' `);
            expect(aResults.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(1);
            expect(aResults.columns.RATE.rows[0]).toEqual(testDataRepl.oCurrencyConversion.RATE[0]);

        });

        it('should not update/insert an entry if FROM_CURRENCY_ID does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{currencyConv}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oCurrencyConversion, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR", "TO_FACTOR", "RATE", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            const aInputRows = [{
                "EXCHANGE_RATE_TYPE_ID": 'STANDARD',
                "FROM_CURRENCY_ID": 'CYU',
                "TO_CURRENCY_ID": 'USD',
                "FROM_FACTOR": 1,
                "TO_FACTOR": 1,
                "RATE": '1.1510000',
                "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                "_SOURCE": 2
            }];


            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);

            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['FROM_CURRENCY_ID'],
                "FIELD_VALUE": [aInputRows[0].FROM_CURRENCY_ID],
                "MESSAGE_TEXT": ['Unknown currency ID for Exchange rate type ID '.concat(aInputRows[0].EXCHANGE_RATE_TYPE_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_currency_conversion']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);


            let aResults = oMockstarPlc.execQuery(`select * from {{currencyConv}} where EXCHANGE_RATE_TYPE_ID = '${aInputRows[0].EXCHANGE_RATE_TYPE_ID}'
                and FROM_CURRENCY_ID = '${aInputRows[0].FROM_CURRENCY_ID}' and TO_CURRENCY_ID = '${aInputRows[0].TO_CURRENCY_ID}' `);
            //check if entry with FROM_CURRENCY_ID = 'CYU' was added
            expect(aResults.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(0);


        });

        it('should not update/insert an entry if VALID_FROM is null', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{currencyConv}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oCurrencyConversion, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR", "TO_FACTOR", "RATE", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            const aInputRows = [{
                "EXCHANGE_RATE_TYPE_ID": 'STANDARD',
                "FROM_CURRENCY_ID": 'EUR',
                "TO_CURRENCY_ID": 'TST',
                "FROM_FACTOR": 1,
                "TO_FACTOR": 1,
                "RATE": '1.6510000',
                "VALID_FROM": null,
                "_SOURCE": 2
            }];


            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);

            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['VALID_FROM'],
                "FIELD_VALUE": [null],
                "MESSAGE_TEXT": ['Invalid Valid From for Exchange rate type ID '.concat(aInputRows[0].EXCHANGE_RATE_TYPE_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_currency_conversion']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);


            let aResults = oMockstarPlc.execQuery(`select * from {{currencyConv}} where EXCHANGE_RATE_TYPE_ID = '${aInputRows[0].EXCHANGE_RATE_TYPE_ID}'
                and FROM_CURRENCY_ID = '${aInputRows[0].FROM_CURRENCY_ID}' and TO_CURRENCY_ID = '${aInputRows[0].TO_CURRENCY_ID}' `);
            //check if entry  was added
            expect(aResults.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(0);

        });        

        /*--- Update 1 entry, create 1 new and skip one with non-valid rate type ---*/
        it('should update 1 entry, create 1, and skip one due to invalid rate type', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "currencyConv");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "EXCHANGE_RATE_TYPE_ID": testDataRepl.oCurrencyConversion.EXCHANGE_RATE_TYPE_ID[0],
                "FROM_CURRENCY_ID": testDataRepl.oCurrencyConversion.FROM_CURRENCY_ID[0],
                "TO_CURRENCY_ID": testDataRepl.oCurrencyConversion.TO_CURRENCY_ID[0],
                "FROM_FACTOR": testDataRepl.oCurrencyConversion.FROM_FACTOR[0],
                "TO_FACTOR": testDataRepl.oCurrencyConversion.TO_FACTOR[0],
                "RATE": '1.1510000', //update
                "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                "_SOURCE": 2
            },
            {
                "EXCHANGE_RATE_TYPE_ID": 'VCC', //new
                "FROM_CURRENCY_ID": testDataRepl.oCurrency.CURRENCY_ID[1],
                "TO_CURRENCY_ID": testDataRepl.oCurrency.CURRENCY_ID[0],
                "FROM_FACTOR": testDataRepl.oCurrencyConversion.FROM_FACTOR[0],
                "TO_FACTOR": testDataRepl.oCurrencyConversion.TO_FACTOR[0],
                "RATE": '1.1410000',
                "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                "_SOURCE": 2
            },
            {
                "EXCHANGE_RATE_TYPE_ID": 'STANDARD1', //invalid
                "FROM_CURRENCY_ID": testDataRepl.oCurrencyConversion.FROM_CURRENCY_ID[0],
                "TO_CURRENCY_ID": testDataRepl.oCurrencyConversion.TO_CURRENCY_ID[0],
                "FROM_FACTOR": testDataRepl.oCurrencyConversion.FROM_FACTOR[0],
                "TO_FACTOR": testDataRepl.oCurrencyConversion.TO_FACTOR[0],
                "VALID_FROM": testDataRepl.oCurrencyConversion.VALID_FROM[0],
                "RATE": '1.1110000',
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{currencyConv}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oCurrencyConversion, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR", "TO_FACTOR", "RATE", "VALID_FROM", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "currencyConv");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");

            //check error table
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);

            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['EXCHANGE_RATE_TYPE_ID'],
                "FIELD_VALUE": [aInputRows[2].EXCHANGE_RATE_TYPE_ID],
                "MESSAGE_TEXT": ['Unknown Exchange rate type ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_currency_conversion']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            //check new entries
            let aResultsNew = oMockstarPlc.execQuery(`select * from {{currencyConv}} where  _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsNew).toBeDefined();

            expect(aResultsNew.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(2);
            aResultsNew = mockstarHelpers.convertResultToArray(aResultsNew);
  
            //1 new insert for VCC and one updated STANDARD with new rate
            expect(aResultsNew).toMatchData({
                "EXCHANGE_RATE_TYPE_ID": [aInputRows[0].EXCHANGE_RATE_TYPE_ID, aInputRows[1].EXCHANGE_RATE_TYPE_ID],
                "FROM_CURRENCY_ID": [aInputRows[0].FROM_CURRENCY_ID, aInputRows[1].FROM_CURRENCY_ID],
                "TO_CURRENCY_ID": [aInputRows[0].TO_CURRENCY_ID, aInputRows[1].TO_CURRENCY_ID],
                "FROM_FACTOR": [aInputRows[0].FROM_FACTOR, aInputRows[1].FROM_FACTOR],
                "TO_FACTOR": [aInputRows[0].TO_FACTOR, aInputRows[1].TO_FACTOR],
                "RATE": [aInputRows[0].RATE, aInputRows[1].RATE],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["EXCHANGE_RATE_TYPE_ID", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "FROM_FACTOR",
                "TO_FACTOR", "RATE", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

    }).addTags(["All_Unit_Tests"]);
}
