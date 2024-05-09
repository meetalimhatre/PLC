let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_activity_type__text', function () {

        let oMockstarPlc = null;

        let sCurrentUser = $.session.getUsername();
        let sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function () {

            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_activity_type__text", // procedure or view under test
                    substituteTables:	// substitute all used tables in the procedure or view
                    {
                        activity_type_text: {
                            name: "sap.plc.db::basis.t_activity_type__text",
                            data: testDataRepl.oActivityTypeText
                        },
                        activity_type: {
                            name: "sap.plc.db::basis.t_activity_type",
                            data: testDataRepl.oActivityType
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
                });
        });

        beforeEach(function () {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function () {
        });

        it('should not create an activity type text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");
            let aResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);

            expect(aResults).toBeDefined();
            expect(aResults.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original inserted data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{activity_type_text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oActivityTypeText,
                ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should create a new activity type text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aInputRows = [{
                "ACTIVITY_TYPE_ID": "AT4",
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[0],
                "ACTIVITY_TYPE_DESCRIPTION": "Created from Test",
                "_SOURCE": 2
            }];
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "activity_type_text");

            let aResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "ACTIVITY_TYPE_ID": [aInputRows[0].ACTIVITY_TYPE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "ACTIVITY_TYPE_DESCRIPTION": [aInputRows[0].ACTIVITY_TYPE_DESCRIPTION],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_SOURCE", "_CREATED_BY"]);
        });

        it('should update an existing activity type text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aInputRows = [{
                "ACTIVITY_TYPE_ID": testDataRepl.oActivityTypeText.ACTIVITY_TYPE_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[4],
                "ACTIVITY_TYPE_DESCRIPTION": "Created from Test",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults).toMatchData({
                "ACTIVITY_TYPE_ID": [testDataRepl.oActivityTypeText.ACTIVITY_TYPE_ID[4]],
                "CONTROLLING_AREA_ID": [testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[4]],
                "LANGUAGE": [testDataRepl.oActivityTypeText.LANGUAGE[4]],
                "ACTIVITY_TYPE_DESCRIPTION": [testDataRepl.oActivityTypeText.ACTIVITY_TYPE_DESCRIPTION[4]],
                "_SOURCE": [testDataRepl.oActivityTypeText._SOURCE[4]],
                "_CREATED_BY": [testDataRepl.oActivityTypeText._CREATED_BY[4]]
            }, ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "activity_type_text");

            let aResultsCount = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'`);
            expect(aResultsCount).toBeDefined();
            expect(aResultsCount.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(2);

            let aResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "ACTIVITY_TYPE_ID": [aInputRows[0].ACTIVITY_TYPE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "ACTIVITY_TYPE_DESCRIPTION": [aInputRows[0].ACTIVITY_TYPE_DESCRIPTION],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the activity type text table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aInputRows = [{
                "ACTIVITY_TYPE_ID": 'AT4',
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[0],
                "ACTIVITY_TYPE_DESCRIPTION": "Created from Test",
                "_SOURCE": 2
            },
            {
                "ACTIVITY_TYPE_ID": 'AT4',
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[0],
                "ACTIVITY_TYPE_DESCRIPTION": "Created from Test",
                "_SOURCE": 2
            }];
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{activity_type_text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oActivityTypeText,
                ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aInputRows = [{
                "ACTIVITY_TYPE_ID": testDataRepl.oActivityTypeText.ACTIVITY_TYPE_ID[3],
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[3],
                "_SOURCE": testDataRepl.oActivityTypeText._SOURCE[3]
            }, {
                "ACTIVITY_TYPE_ID": testDataRepl.oActivityTypeText.ACTIVITY_TYPE_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[4],
                "_SOURCE": testDataRepl.oActivityTypeText._SOURCE[4]
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{activity_type_text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{activity_type_text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oActivityTypeText, ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update an activity type text if controlling area does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aInputRows = [{
                "ACTIVITY_TYPE_ID": "AT3",
                "CONTROLLING_AREA_ID": '1111',
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[0],
                "ACTIVITY_TYPE_DESCRIPTION": 'Activity type AT3 DE',
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oActivityTypeText,
                ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['ACTIVITY_TYPE_ID'],
                "FIELD_VALUE": [aInputRows[0].ACTIVITY_TYPE_ID],
                "MESSAGE_TEXT": ['Unknown Activity Type ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_type__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oActivityTypeText, ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should not update an activity type text if language does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aInputRows = [{
                "ACTIVITY_TYPE_ID": testDataRepl.oActivityTypeText.ACTIVITY_TYPE_ID[4],
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[4],
                "LANGUAGE": 'ML',
                "ACTIVITY_TYPE_DESCRIPTION": testDataRepl.oActivityTypeText.ACTIVITY_TYPE_DESCRIPTION[4],
                "_SOURCE": testDataRepl.oActivityTypeText._SOURCE[4],
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oActivityTypeText,
                ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Activity Type ID '.concat(aInputRows[0].ACTIVITY_TYPE_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_type__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oActivityTypeText,
                ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should insert 1 Activity Type Texts, update 1, and skip 1 due to entry already present in table and 1 due to entry not present in activity_type table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_type_text");

            let aInputRows = [{
                "ACTIVITY_TYPE_ID": "AT4",
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[0],
                "ACTIVITY_TYPE_DESCRIPTION": "Created from Test",
                "_SOURCE": 2
            },
            {
                "ACTIVITY_TYPE_ID": "AT5",
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[0],
                "ACTIVITY_TYPE_DESCRIPTION": "Created from Test 2",
                "_SOURCE": 2
            }, {
                "ACTIVITY_TYPE_ID": "AT3",
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testDataRepl.oActivityTypeText.LANGUAGE[4],
                "ACTIVITY_TYPE_DESCRIPTION":  testDataRepl.oActivityTypeText.ACTIVITY_TYPE_DESCRIPTION[4],
                "_SOURCE": 2
            },
            {
                "ACTIVITY_TYPE_ID":  testDataRepl.oActivityTypeText.ACTIVITY_TYPE_ID[0],
                "CONTROLLING_AREA_ID": testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[0],
                "LANGUAGE": 'ML',//testDataRepl.oActivityTypeText.LANGUAGE[0],
                "ACTIVITY_TYPE_DESCRIPTION":  testDataRepl.oActivityTypeText.ACTIVITY_TYPE_DESCRIPTION[0],
                "_SOURCE":  testDataRepl.oActivityTypeText._SOURCE[0]
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{activity_type_text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oActivityTypeText,
                ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "activity_type_text");

            let aResultsNew = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'`);
            expect(aResultsNew).toBeDefined();
            expect(aResultsNew.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(1);

            expect(aResultsNew).toMatchData({
                "ACTIVITY_TYPE_ID": [aInputRows[0].ACTIVITY_TYPE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where ACTIVITY_TYPE_ID = '${aInputRows[2].ACTIVITY_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsUpdate).toBeDefined();
            expect(aResultsUpdate.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(1);

            expect(aResultsUpdate).toMatchData({
                "ACTIVITY_TYPE_ID": [aInputRows[2].ACTIVITY_TYPE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[2]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{activity_type_text}} where ACTIVITY_TYPE_ID = '${aInputRows[3].ACTIVITY_TYPE_ID}' or ACTIVITY_TYPE_ID = '${aInputRows[1].ACTIVITY_TYPE_ID}'`);
            expect(aResultsSkip).toBeDefined();
            aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
            expect(aResultsSkip).toMatchData({
                "ACTIVITY_TYPE_ID": [testDataRepl.oActivityTypeText.ACTIVITY_TYPE_ID[0], testDataRepl.oActivityTypeText.ACTIVITY_TYPE_ID[1]],
                "CONTROLLING_AREA_ID": [testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[0], testDataRepl.oActivityTypeText.CONTROLLING_AREA_ID[1]],
                "LANGUAGE": [testDataRepl.oActivityTypeText.LANGUAGE[0], testDataRepl.oActivityTypeText.LANGUAGE[1]],
                "_VALID_TO": [testDataRepl.oActivityTypeText._VALID_TO[0], testDataRepl.oActivityTypeText._VALID_TO[1]],
                "_SOURCE": [testDataRepl.oActivityTypeText._SOURCE[0], testDataRepl.oActivityTypeText._SOURCE[1]],
                "_CREATED_BY": [testDataRepl.oActivityTypeText._CREATED_BY[0], testDataRepl.oActivityTypeText._CREATED_BY[1]]
            }, ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

    }).addTags(["All_Unit_Tests"]);
}