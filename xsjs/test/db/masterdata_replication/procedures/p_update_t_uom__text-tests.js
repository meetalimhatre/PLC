const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_update_t_uom__text", function () {

        let oMockstarPlc = null;
        const sMasterdataTimestamp = NewDateAsISOString();
        const sCurrentUser = $.session.getUsername();

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_uom__text", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        uom: {
                            name: "sap.plc.db::basis.t_uom",
                            data: testDataRepl.oUom
                        },
                        uom__text: {
                            name: "sap.plc.db::basis.t_uom__text",
                            data: testDataRepl.oUomText
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
                }
            );
        });

        beforeEach(function () {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function () {
        });

        it('should not insert a new entry', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]); //empty or duplicate key

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{uom__text}} where _VALID_FROM > '${sMasterdataTimestamp}' or _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.UOM_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original inserted data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{uom__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);

            expect(aResultsFullTable).toMatchData(testDataRepl.oUomText, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        /*--- Send 2 entries with the same key (DUPLICATE_KEY_COUNT <> 1) ---*/
        it('should not insert 2 entries with the same key', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //act
            const aInputRows = [
                {
                    "UOM_ID": 'KG',
                    "LANGUAGE": testDataRepl.oUomText.LANGUAGE[0],
                    "UOM_CODE": 'KG',
                    "UOM_DESCRIPTION": 'Kilograms',
                    "_SOURCE": 2
                },
                {
                    "UOM_ID": 'KG',
                    "LANGUAGE": testDataRepl.oUomText.LANGUAGE[0],
                    "UOM_CODE": 'KG',
                    "UOM_DESCRIPTION": 'Kilograms',
                    "_SOURCE": 2
                }
            ];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID = '${aInputRows[0].UOM_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.UOM_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{uom__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.UOM_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{uom__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oUomText, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should insert a new entry for ST in DE', function () {

            const aInputRows = [{
                "UOM_ID": testDataRepl.oUomText.UOM_ID[0],
                "LANGUAGE": testDataRepl.oUomText.LANGUAGE[1],
                "UOM_CODE": testDataRepl.oUomText.UOM_CODE[0],
                "UOM_DESCRIPTION": 'Stein',
                "_SOURCE": 2
            }];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            //check there is no entry for uom ST in language DE
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID = '${aInputRows[0].UOM_ID}'
            and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.UOM_ID.rows.length).toEqual(0);


            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "uom__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID = '${aInputRows[0].UOM_ID}'
            and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.UOM_ID.rows.length).toEqual(1);

            aResults = mockstarHelpers.convertResultToArray(aResults);

            expect(aResults).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "UOM_CODE": [aInputRows[0].UOM_CODE],
                "UOM_DESCRIPTION": [aInputRows[0].UOM_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should update an existing entry', function () {

            //update uom description
            const aInputRows = [{
                "UOM_ID": testDataRepl.oUomText.UOM_ID[0],
                "LANGUAGE": testDataRepl.oUomText.LANGUAGE[0],
                "UOM_CODE": testDataRepl.oUomText.UOM_CODE[0],
                "UOM_DESCRIPTION": '6.35 Kilos',
                "_SOURCE": 2
            }];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID = '${aInputRows[0].UOM_ID}'
            and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);

            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "UOM_CODE": [aInputRows[0].UOM_CODE],
                "UOM_DESCRIPTION": [testDataRepl.oUomText.UOM_DESCRIPTION[0]], //to update
                "_VALID_TO": [testDataRepl.oUomText._VALID_TO[0]],
                "_SOURCE": [testDataRepl.oUomText._SOURCE[0]],
                "_CREATED_BY": [testDataRepl.oUomText._CREATED_BY[0]],
            }, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"]);


            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "uom__text");

            //check updated entry
            let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID = '${aInputRows[0].UOM_ID}'
            and LANGUAGE = '${aInputRows[0].LANGUAGE}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsUpdated).toBeDefined();

            expect(aResultsUpdated).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "UOM_CODE": [aInputRows[0].UOM_CODE],
                "UOM_DESCRIPTION": [aInputRows[0].UOM_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //check old entry
            let aResultsOld = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID = '${aInputRows[0].UOM_ID}'
            and LANGUAGE = '${aInputRows[0].LANGUAGE}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsOld).toBeDefined();
            aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);

            expect(aResultsOld).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "UOM_CODE": [aInputRows[0].UOM_CODE],
                "UOM_DESCRIPTION": [testDataRepl.oUomText.UOM_DESCRIPTION[0]], //to update
                "_VALID_FROM": [testDataRepl.oUomText._VALID_FROM[0]],
                "_SOURCE": [testDataRepl.oUomText._SOURCE[0]],
                "_CREATED_BY": [sCurrentUser],
            }, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION",
                "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

        });

        it('should not insert an entry if uom does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            //insert new uom STT
            const aInputRows = [{
                "UOM_ID": "STT",
                "LANGUAGE": testDataRepl.oUomText.LANGUAGE[0],
                "UOM_CODE": testDataRepl.oUomText.UOM_CODE[0],
                "UOM_DESCRIPTION": '6.35 Kilos',
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            var aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(aErrorResults.columns.FIELD_VALUE.rows.length).toEqual(1);
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['UOM_ID'],
                "FIELD_VALUE": [aInputRows[0].UOM_ID],
                "MESSAGE_TEXT": ['Unknown UOM ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_uom__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);


            //check entry was not added
            let aResults = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID = 'STT'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.UOM_ID.rows.length).toEqual(0);

        });

        it('should not update an entry if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            const aInputRows = [{
                "UOM_ID": testDataRepl.oUomText.UOM_ID[0],
                "LANGUAGE": 'ML',
                "UOM_CODE": testDataRepl.oUomText.UOM_CODE[0],
                "UOM_DESCRIPTION": 'Descr AAA',
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{uom__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testDataRepl.oUomText, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for UOM ID '.concat(aInputRows[0].UOM_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_uom__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{uom__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oUomText, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });        

        /*--- Update 1 entry, create 1 new and skip one with non-valid uom ---*/
        it('should update 1 entry, create one, and skip one due to invalid dimension', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "UOM_ID": testDataRepl.oUomText.UOM_ID[0],
                "LANGUAGE": testDataRepl.oUomText.LANGUAGE[0],
                "UOM_CODE": testDataRepl.oUomText.UOM_CODE[0],
                "UOM_DESCRIPTION": 'Stein', //update
                "_SOURCE": 2
            },
            {
                "UOM_ID": 'EA', //new
                "LANGUAGE": testDataRepl.oUomText.LANGUAGE[0],
                "UOM_CODE": testDataRepl.oUomText.UOM_CODE[0],
                "UOM_DESCRIPTION": 'EA desc',
                "_SOURCE": 2
            },
            {
                "UOM_ID": "STT", //invalid
                "LANGUAGE": testDataRepl.oUomText.LANGUAGE[0],
                "UOM_CODE": testDataRepl.oUomText.UOM_CODE[0],
                "UOM_DESCRIPTION": '6.35 Kilos',
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID = '${aInputRows[0].UOM_ID}' or
            UOM_ID = '${aInputRows[1].UOM_ID}' or UOM_ID = '${aInputRows[2].UOM_ID}'`);

            expect(aBeforeResults).toBeDefined();         
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom__text");

            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "UOM_CODE": [aInputRows[0].UOM_CODE],
                "UOM_DESCRIPTION": [testDataRepl.oUomText.UOM_DESCRIPTION[0]], //to update
                "_VALID_TO": [testDataRepl.oUomText._VALID_TO[0]],
                "_SOURCE": [testDataRepl.oUomText._SOURCE[0]],
                "_CREATED_BY": [testDataRepl.oUomText._CREATED_BY[0]],
            }, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
       
            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "uom__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");

            //check error table
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['UOM_ID'],
                "FIELD_VALUE": [aInputRows[2].UOM_ID],
                "MESSAGE_TEXT": ['Unknown UOM ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_uom__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);


            let aResultsNew = oMockstarPlc.execQuery(`select * from {{uom__text}} where UOM_ID in ('${aInputRows[0].UOM_ID}', 
                    '${aInputRows[1].UOM_ID}', '${aInputRows[2].UOM_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsNew).toBeDefined();

            expect(aResultsNew.columns.UOM_ID.rows.length).toEqual(2);
            aResultsNew = mockstarHelpers.convertResultToArray(aResultsNew);
            //1 new inserts for CM and one updated ST


            expect(aResultsNew).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID, aInputRows[1].UOM_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "UOM_CODE": [aInputRows[0].UOM_CODE, aInputRows[1].UOM_CODE],
                "UOM_DESCRIPTION": [aInputRows[0].UOM_DESCRIPTION, aInputRows[1].UOM_DESCRIPTION],
                "_VALID_TO": [null,null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });
    }).addTags(["All_Unit_Tests"]);
}
