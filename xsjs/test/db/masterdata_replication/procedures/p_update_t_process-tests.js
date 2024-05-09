let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_update_t_process", function () {

        let oMockstarPlc = null;
        const sMasterdataTimestamp = NewDateAsISOString();
        const sCurrentUser = $.session.getUsername();

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_process", // procedure under test

                    substituteTables: {
                        process: {
                            name: "sap.plc.db::basis.t_process",
                            data: testDataRepl.oProcess
                        },
                        account: {
                            name: "sap.plc.db::basis.t_account",
                            data: testDataRepl.oAccount
                        },
                        controlling_area: {
                            name: "sap.plc.db::basis.t_controlling_area",
                            data: testDataRepl.oControllingArea
                        },
                        error: {
                            name: "sap.plc.db::map.t_replication_log",
                            data: testDataRepl.oError
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

        it('should not create a Process', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aResults = oMockstarPlc.execQuery(`select * from {{process}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();

            //check that the final table is identical to the original inserted data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{process}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oProcess,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should create a new Process', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aInputRows = [{
                "PROCESS_ID": 'P4',
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[0],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[0],
                "COMMENT": "Created from test",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.PROCESS_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "process");

            let aResults = oMockstarPlc.execQuery(`select * from {{process}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "PROCESS_ID": [aInputRows[0].PROCESS_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID],
                "COMMENT": [aInputRows[0].COMMENT],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_SOURCE", "_CREATED_BY"]);

        });

        it('should update an existing Process', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcess.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[4],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[4],
                "COMMENT": testDataRepl.oProcess.COMMENT[4],
                "_SOURCE": 2,
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults).toMatchData({
                "PROCESS_ID": [testDataRepl.oProcess.PROCESS_ID[4]],
                "CONTROLLING_AREA_ID": [testDataRepl.oProcess.CONTROLLING_AREA_ID[4]],
                "ACCOUNT_ID": [testDataRepl.oProcess.ACCOUNT_ID[4]],
                "COMMENT": [testDataRepl.oProcess.COMMENT[4]],
                "_SOURCE": [testDataRepl.oProcess._SOURCE[4]],
                "_CREATED_BY": [testDataRepl.oProcess._CREATED_BY[4]]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "process");

            let aResultsCount = oMockstarPlc.execQuery(`select * from {{process}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}'`);
            expect(aResultsCount).toBeDefined();
            expect(aResultsCount.columns.PROCESS_ID.rows.length).toEqual(2);

            let aResults = oMockstarPlc.execQuery(`select * from {{process}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "PROCESS_ID": [aInputRows[0].PROCESS_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID],
                "COMMENT": [aInputRows[0].COMMENT],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_SOURCE", "_CREATED_BY"]);

        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the Process table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aInputRows = [{
                "PROCESS_ID": 'P4',
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[0],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[0],
                "COMMENT": testDataRepl.oProcess.COMMENT[0],
                "_SOURCE": 2
            },
            {
                "PROCESS_ID": 'P4',
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[0],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[0],
                "COMMENT": testDataRepl.oProcess.COMMENT[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.PROCESS_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aResults = oMockstarPlc.execQuery(`select * from {{process}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.PROCESS_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{process}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oProcess,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should not do any insert / update since all data from input table already exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcess.PROCESS_ID[3],
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[3],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[3],
                "COMMENT": testDataRepl.oProcess.COMMENT[3],
                "_SOURCE": testDataRepl.oProcess._SOURCE[3]
            }, {
                "PROCESS_ID": testDataRepl.oProcess.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[4],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[4],
                "COMMENT": testDataRepl.oProcess.COMMENT[4],
                "_SOURCE": testDataRepl.oProcess._SOURCE[4]
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{process}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PROCESS_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{process}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROCESS_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{process}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oProcess, ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Process if controlling area does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcess.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": '1111',
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[4],
                "COMMENT": testDataRepl.oProcess.COMMENT[4],
                "_SOURCE": testDataRepl.oProcess._SOURCE[4]
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oProcess,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[0].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Process ID '.concat(aInputRows[0].PROCESS_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_process']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{process}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oProcess,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Process if account id does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcess.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[4],
                "ACCOUNT_ID": 'X1',
                "COMMENT": testDataRepl.oProcess.COMMENT[4],
                "_SOURCE": testDataRepl.oProcess._SOURCE[4]
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oProcess,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['ACCOUNT_ID'],
                "FIELD_VALUE": [aInputRows[0].ACCOUNT_ID],
                "MESSAGE_TEXT": ['Unknown Account ID for Process ID '.concat(aInputRows[0].PROCESS_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_process']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{process}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oProcess,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert 2 activity types, update 1, and skip one due to entry already present in table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");

            let aInputRows = [{
                "PROCESS_ID": 'P4',
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[0],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[0],
                "COMMENT": "Created from test",
                "_SOURCE": 2
            },
            {
                "PROCESS_ID": 'P5',
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[0],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[0],
                "COMMENT": "Created from test 2",
                "_SOURCE": 2
            }, {
                "PROCESS_ID": testDataRepl.oProcess.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[4],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[4],
                "COMMENT": testDataRepl.oProcess.COMMENT[4],
                "_SOURCE": 2
            }
            ,{
                "PROCESS_ID": testDataRepl.oProcess.PROCESS_ID[1],
                "CONTROLLING_AREA_ID": testDataRepl.oProcess.CONTROLLING_AREA_ID[1],
                "ACCOUNT_ID": testDataRepl.oProcess.ACCOUNT_ID[1],
                "COMMENT": testDataRepl.oProcess.COMMENT[1],
                "_SOURCE": testDataRepl.oProcess._SOURCE[1]
            }
        ];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oProcess,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "process");

            let aResultsNew = oMockstarPlc.execQuery(`select * from {{process}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}' or PROCESS_ID = '${aInputRows[1].PROCESS_ID}'`);
            expect(aResultsNew).toBeDefined();
            expect(aResultsNew.columns.PROCESS_ID.rows.length).toEqual(2);

            expect(aResultsNew).toMatchData({
                "PROCESS_ID": [aInputRows[0].PROCESS_ID, aInputRows[1].PROCESS_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID, aInputRows[1].ACCOUNT_ID],
                "COMMENT": [aInputRows[0].COMMENT, aInputRows[1].COMMENT],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{process}} where PROCESS_ID = '${aInputRows[2].PROCESS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsUpdate).toBeDefined();
            expect(aResultsUpdate.columns.PROCESS_ID.rows.length).toEqual(1);

            expect(aResultsUpdate).toMatchData({
                "PROCESS_ID": [aInputRows[2].PROCESS_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID],
                "ACCOUNT_ID": [aInputRows[2].ACCOUNT_ID],
                "COMMENT": [aInputRows[2].COMMENT],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[2]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{process}} where PROCESS_ID = '${aInputRows[3].PROCESS_ID}'`);
            expect(aResultsSkip).toBeDefined();
            aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
            expect(aResultsSkip).toMatchData({
                "PROCESS_ID": [testDataRepl.oProcess.PROCESS_ID[0], testDataRepl.oProcess.PROCESS_ID[1]],
                "CONTROLLING_AREA_ID": [testDataRepl.oProcess.CONTROLLING_AREA_ID[0], testDataRepl.oProcess.CONTROLLING_AREA_ID[1]],
                "ACCOUNT_ID": [testDataRepl.oProcess.ACCOUNT_ID[0], testDataRepl.oProcess.ACCOUNT_ID[1]],
                "COMMENT": [testDataRepl.oProcess.COMMENT[0], testDataRepl.oProcess.COMMENT[1]],
                "_VALID_TO": [testDataRepl.oProcess._VALID_TO[0], testDataRepl.oProcess._VALID_TO[1]],
                "_SOURCE": [testDataRepl.oProcess._SOURCE[0], testDataRepl.oProcess._SOURCE[1]],
                "_CREATED_BY": [testDataRepl.oProcess._CREATED_BY[0], testDataRepl.oProcess._CREATED_BY[1]]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "ACCOUNT_ID", "COMMENT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

    }).addTags(["All_Unit_Tests"]);
}
