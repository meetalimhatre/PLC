let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_update_t_process__text", function () {

        let oMockstarPlc = null;
        const sMasterdataTimestamp = NewDateAsISOString();
        const sCurrentUser = $.session.getUsername();

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_process__text", // procedure under test

                    substituteTables: {
                        process__text: {
                            name: "sap.plc.db::basis.t_process__text",
                            data: testDataRepl.oProcessText
                        },
                        process: {
                            name: "sap.plc.db::basis.t_process",
                            data: testDataRepl.oProcess
                        },
                        language: {
                            name: "sap.plc.db::basis.t_language",
                            data: testDataRepl.oLanguage
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

        it('should not create a Process Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{process__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();

            //check that the final table is identical to the original inserted data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{process__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should create a new Process Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aInputRows = [{
                "PROCESS_ID": 'P3',
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[0],
                "PROCESS_DESCRIPTION": "Created from test",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process__text}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}'`);
            expect(aBeforeResults).toBeDefined();

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "process__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{process__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "PROCESS_ID": [aInputRows[0].PROCESS_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "PROCESS_DESCRIPTION": [aInputRows[0].PROCESS_DESCRIPTION],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_SOURCE", "_CREATED_BY"]);

        });

        it('should update an existing Process Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[4],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[4],
                "_SOURCE": 2,
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process__text}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults).toMatchData({
                "PROCESS_ID": [testDataRepl.oProcessText.PROCESS_ID[4]],
                "CONTROLLING_AREA_ID": [testDataRepl.oProcessText.CONTROLLING_AREA_ID[4]],
                "LANGUAGE": [testDataRepl.oProcessText.LANGUAGE[4]],
                "PROCESS_DESCRIPTION": [testDataRepl.oProcessText.PROCESS_DESCRIPTION[4]],
                "_SOURCE": [testDataRepl.oProcessText._SOURCE[4]],
                "_CREATED_BY": [testDataRepl.oProcessText._CREATED_BY[4]]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "process__text");

            let aResultsCount = oMockstarPlc.execQuery(`select * from {{process__text}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}'`);
            expect(aResultsCount).toBeDefined();
            expect(aResultsCount.columns.PROCESS_ID.rows.length).toEqual(2);

            let aResults = oMockstarPlc.execQuery(`select * from {{process__text}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "PROCESS_ID": [aInputRows[0].PROCESS_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "PROCESS_DESCRIPTION": [aInputRows[0].PROCESS_DESCRIPTION],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_SOURCE", "_CREATED_BY"]);

        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the Process Text table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aInputRows = [{
                "PROCESS_ID": 'P3',
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[1],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[0],
                "_SOURCE": 1
            },
            {
                "PROCESS_ID": 'P3',
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[1],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[0],
                "_SOURCE": 1
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process__text}} where PROCESS_ID = '${aInputRows[0].PROCESS_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.PROCESS_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{process__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.PROCESS_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{process__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should not do any insert / update since all data from input table already exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[3],
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[3],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[3],
                "_SOURCE": testDataRepl.oProcessText._SOURCE[3]
            }, {
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[4],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[4],
                "_SOURCE": testDataRepl.oProcessText._SOURCE[4]
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{process__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PROCESS_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{process__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROCESS_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{process__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oProcessText, ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Process Text if controlling area does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": '1111',
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[4],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[4],
                "_SOURCE": testDataRepl.oProcessText._SOURCE[4]
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process__text}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[0].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Process ID '.concat(aInputRows[0].PROCESS_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_process__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{process__text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Process Text if language id does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[4],
                "LANGUAGE": 'ML',
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[4],
                "_SOURCE": testDataRepl.oProcessText._SOURCE[4]
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process__text}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Process ID '.concat(aInputRows[0].PROCESS_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_process__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{process__text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Process Text if Process does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aInputRows = [{
                "PROCESS_ID": 'P10',
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[4],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[4],
                "_SOURCE": testDataRepl.oProcessText._SOURCE[4]
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process__text}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['PROCESS_ID'],
                "FIELD_VALUE": [aInputRows[0].PROCESS_ID],
                "MESSAGE_TEXT": ['Unknown Process ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID) ],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_process__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{process__text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert 2 activity types, update 1, and skip one due to entry already present in table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process__text");

            let aInputRows = [{
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[1],
                "PROCESS_DESCRIPTION": "Created from test",
                "_SOURCE": 2
            },
            {
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[0],
                "PROCESS_DESCRIPTION": "Created from test",
                "_SOURCE": 2
            }, {
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[2],
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'ZZ',//testDataRepl.oProcessText.LANGUAGE[2],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[2],
                "_SOURCE": 2
            }, {
                "PROCESS_ID": testDataRepl.oProcessText.PROCESS_ID[1],
                "CONTROLLING_AREA_ID": testDataRepl.oProcessText.CONTROLLING_AREA_ID[1],
                "LANGUAGE": testDataRepl.oProcessText.LANGUAGE[1],
                "PROCESS_DESCRIPTION": testDataRepl.oProcessText.PROCESS_DESCRIPTION[1],
                "_SOURCE": testDataRepl.oProcessText._SOURCE[1]
            }
            ];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{process__text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oProcessText,
                ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "process__text");

            let aResultsNew = oMockstarPlc.execQuery(`select * from {{process__text}} where (PROCESS_ID = '${aInputRows[0].PROCESS_ID}' or PROCESS_ID = '${aInputRows[1].PROCESS_ID}') and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsNew).toBeDefined();
            expect(aResultsNew.columns.PROCESS_ID.rows.length).toEqual(2);

            expect(aResultsNew).toMatchData({
                "PROCESS_ID": [aInputRows[0].PROCESS_ID, aInputRows[1].PROCESS_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "PROCESS_DESCRIPTION": [aInputRows[0].PROCESS_DESCRIPTION, aInputRows[1].PROCESS_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{process__text}} where PROCESS_ID = '${aInputRows[2].PROCESS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsUpdate).toBeDefined();
            expect(aResultsUpdate.columns.PROCESS_ID.rows.length).toEqual(1);

            expect(aResultsUpdate).toMatchData({
                "PROCESS_ID": [aInputRows[2].PROCESS_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE],
                "PROCESS_DESCRIPTION": [aInputRows[2].PROCESS_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[2]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{process__text}} where PROCESS_ID = '${aInputRows[3].PROCESS_ID}'`);
            expect(aResultsSkip).toBeDefined();
            aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
            expect(aResultsSkip).toMatchData({
                "PROCESS_ID": [testDataRepl.oProcessText.PROCESS_ID[0], testDataRepl.oProcessText.PROCESS_ID[1]],
                "CONTROLLING_AREA_ID": [testDataRepl.oProcessText.CONTROLLING_AREA_ID[0], testDataRepl.oProcessText.CONTROLLING_AREA_ID[1]],
                "LANGUAGE": [testDataRepl.oProcessText.LANGUAGE[0], testDataRepl.oProcessText.LANGUAGE[1]],
                "PROCESS_DESCRIPTION": [testDataRepl.oProcessText.PROCESS_DESCRIPTION[0], testDataRepl.oProcessText.PROCESS_DESCRIPTION[1]],
                "_VALID_TO": [testDataRepl.oProcessText._VALID_TO[0], testDataRepl.oProcessText._VALID_TO[1]],
                "_SOURCE": [testDataRepl.oProcessText._SOURCE[0], testDataRepl.oProcessText._SOURCE[1]],
                "_CREATED_BY": [testDataRepl.oProcessText._CREATED_BY[0], testDataRepl.oProcessText._CREATED_BY[1]]
            }, ["PROCESS_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

    }).addTags(["All_Unit_Tests"]);
}
