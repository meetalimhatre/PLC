let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_business_area__text', function () {

        let oMockstarPlc = null;

        let sCurrentUser = $.session.getUsername();
        let sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function () {

            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_business_area__text", // procedure or view under test
                    substituteTables:	// substitute all used tables in the procedure or view
                    {
                        business_area__text: {
                            name: "sap.plc.db::basis.t_business_area__text",
                            data: testDataRepl.oBusinessAreaText
                        },
                        business_area: {
                            name: "sap.plc.db::basis.t_business_area",
                            data: testDataRepl.oBusinessArea
                        },
                        language: {
                            name: "sap.plc.db::basis.t_language",
                            data: testDataRepl.oLanguage
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

        it('should not create an Business Area Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{business_area__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.BUSINESS_AREA_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{business_area__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oBusinessAreaText,
                ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]); //check that the final table is identical to the original inserted data

        });

        it('should create a new Business Area Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aInputRows = [{
                "BUSINESS_AREA_ID": 'B3',
                "LANGUAGE": testDataRepl.oBusinessAreaText.LANGUAGE[0],
                "BUSINESS_AREA_DESCRIPTION": testDataRepl.oBusinessAreaText.BUSINESS_AREA_DESCRIPTION[0],
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "business_area__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{business_area__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "BUSINESS_AREA_ID": [aInputRows[0].BUSINESS_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "BUSINESS_AREA_DESCRIPTION": [aInputRows[0].BUSINESS_AREA_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should update an existing Business Area Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aInputRows = [{
                "BUSINESS_AREA_ID": testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[4],
                "LANGUAGE": testDataRepl.oBusinessAreaText.LANGUAGE[4],
                "BUSINESS_AREA_DESCRIPTION": testDataRepl.oBusinessAreaText.BUSINESS_AREA_DESCRIPTION[4],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{business_area__text}} where BUSINESS_AREA_ID = '${aInputRows[0].BUSINESS_AREA_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults).toMatchData({
                "BUSINESS_AREA_ID": [testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[4]],
                "LANGUAGE": [testDataRepl.oBusinessAreaText.LANGUAGE[4]],
                "BUSINESS_AREA_DESCRIPTION": [testDataRepl.oBusinessAreaText.BUSINESS_AREA_DESCRIPTION[4]],
                "_VALID_TO": [testDataRepl.oBusinessAreaText._VALID_TO[4]],
                "_SOURCE": [testDataRepl.oBusinessAreaText._SOURCE[4]],
                "_CREATED_BY": [testDataRepl.oBusinessAreaText._CREATED_BY[4]]
            }, ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "business_area__text");

            let aResultsCount = oMockstarPlc.execQuery(`select * from {{business_area__text}} where BUSINESS_AREA_ID = '${aInputRows[0].BUSINESS_AREA_ID}'`);
            expect(aResultsCount).toBeDefined();
            expect(aResultsCount.columns.BUSINESS_AREA_ID.rows.length).toEqual(2);

            let aResults = oMockstarPlc.execQuery(`select * from {{business_area__text}} where BUSINESS_AREA_ID = '${aInputRows[0].BUSINESS_AREA_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "BUSINESS_AREA_ID": [aInputRows[0].BUSINESS_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "BUSINESS_AREA_DESCRIPTION": [aInputRows[0].BUSINESS_AREA_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the Business Area Text table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aInputRows = [{
                "BUSINESS_AREA_ID": 'B4',
                "LANGUAGE": 'DE',
                "BUSINESS_AREA_DESCRIPTION": 'B3 DE',
                "_SOURCE": 2
            },
            {
                "BUSINESS_AREA_ID": 'B4',
                "LANGUAGE": 'DE',
                "BUSINESS_AREA_DESCRIPTION": 'B3 DE',
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{business_area__text}} where BUSINESS_AREA_ID = '${aInputRows[0].BUSINESS_AREA_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.BUSINESS_AREA_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{business_area__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.BUSINESS_AREA_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{business_area__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oBusinessAreaText,
                ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from Business Area already exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aInputRows = [{
                "BUSINESS_AREA_ID": testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[3],
                "LANGUAGE": testDataRepl.oBusinessAreaText.LANGUAGE[3],
                "BUSINESS_AREA_DESCRIPTION": testDataRepl.oBusinessAreaText.BUSINESS_AREA_DESCRIPTION[3],
                "_SOURCE": testDataRepl.oBusinessAreaText._SOURCE[3]
            }, {
                "BUSINESS_AREA_ID": testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[4],
                "LANGUAGE": testDataRepl.oBusinessAreaText.LANGUAGE[4],
                "BUSINESS_AREA_DESCRIPTION": testDataRepl.oBusinessAreaText.BUSINESS_AREA_DESCRIPTION[4],
                "_SOURCE": testDataRepl.oBusinessAreaText._SOURCE[4]
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{business_area__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.BUSINESS_AREA_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{business_area__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.BUSINESS_AREA_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{business_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oBusinessAreaText, ["BUSINESS_AREA_ID", "_SOURCE"]);
        });

        it('should not update an Business Area Text if language does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aInputRows = [{
                "BUSINESS_AREA_ID": testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[4],
                "LANGUAGE": 'ML',
                "BUSINESS_AREA_DESCRIPTION": testDataRepl.oBusinessAreaText.BUSINESS_AREA_DESCRIPTION[4],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{business_area__text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oBusinessAreaText,
                ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert

            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Business Area ID '.concat(aInputRows[0].BUSINESS_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_business_area__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{business_area__text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oBusinessAreaText,
                ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should insert 2 Business Area Texts, update 1, and skip one due to entry already present in table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "business_area__text");

            let aInputRows = [{
                "BUSINESS_AREA_ID": testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[4],
                "LANGUAGE": testDataRepl.oBusinessAreaText.LANGUAGE[1],
                "BUSINESS_AREA_DESCRIPTION": 'B3 EN',
                "_SOURCE": 2
            },
            {
                "BUSINESS_AREA_ID": testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[4],
                "LANGUAGE": 'ZZ',
                "BUSINESS_AREA_DESCRIPTION": 'B3 ZZ',
                "_SOURCE": 2
            }, {
                "BUSINESS_AREA_ID": testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[2],
                "LANGUAGE": testDataRepl.oBusinessAreaText.LANGUAGE[2],
                "BUSINESS_AREA_DESCRIPTION": 'B2 DE',
                "_SOURCE": 2
            },
            {
                "BUSINESS_AREA_ID": testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[1],
                "LANGUAGE": testDataRepl.oBusinessAreaText.LANGUAGE[1],
                "BUSINESS_AREA_DESCRIPTION": 'B1 EN',
                "_SOURCE": 1
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{business_area__text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oBusinessAreaText,
                ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "business_area__text");

            let aResultsNew = oMockstarPlc.execQuery(`select * from {{business_area__text}} where BUSINESS_AREA_ID = '${aInputRows[0].BUSINESS_AREA_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsNew).toBeDefined();
            expect(aResultsNew.columns.BUSINESS_AREA_ID.rows.length).toEqual(2);

            expect(aResultsNew).toMatchData({
                "BUSINESS_AREA_ID": [aInputRows[0].BUSINESS_AREA_ID, aInputRows[1].BUSINESS_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "BUSINESS_AREA_DESCRIPTION": [aInputRows[0].BUSINESS_AREA_DESCRIPTION, aInputRows[1].BUSINESS_AREA_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{business_area__text}} where BUSINESS_AREA_ID = '${aInputRows[2].BUSINESS_AREA_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsUpdate).toBeDefined();
            expect(aResultsUpdate.columns.BUSINESS_AREA_ID.rows.length).toEqual(1);

            expect(aResultsUpdate).toMatchData({
                "BUSINESS_AREA_ID": [aInputRows[2].BUSINESS_AREA_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE],
                "BUSINESS_AREA_DESCRIPTION": [aInputRows[2].BUSINESS_AREA_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[2]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{business_area__text}} where BUSINESS_AREA_ID = '${aInputRows[3].BUSINESS_AREA_ID}'`);
            expect(aResultsSkip).toBeDefined();
            aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
            expect(aResultsSkip).toMatchData({
                "BUSINESS_AREA_ID": [testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[0], testDataRepl.oBusinessAreaText.BUSINESS_AREA_ID[1]],
                "LANGUAGE": [testDataRepl.oBusinessAreaText.LANGUAGE[0],testDataRepl.oBusinessAreaText.LANGUAGE[1]],
                "BUSINESS_AREA_DESCRIPTION":  [testDataRepl.oBusinessAreaText.BUSINESS_AREA_DESCRIPTION[0],testDataRepl.oBusinessAreaText.BUSINESS_AREA_DESCRIPTION[1]],
                "_SOURCE": [testDataRepl.oBusinessAreaText._SOURCE[0], testDataRepl.oBusinessAreaText._SOURCE[1]],
                "_VALID_TO": [testDataRepl.oBusinessAreaText._VALID_TO[0], testDataRepl.oBusinessAreaText._VALID_TO[1]],
                "_CREATED_BY": [testDataRepl.oBusinessAreaText._CREATED_BY[0], testDataRepl.oBusinessAreaText._CREATED_BY[1]]
            }, ["BUSINESS_AREA_ID", "LANGUAGE", "BUSINESS_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}