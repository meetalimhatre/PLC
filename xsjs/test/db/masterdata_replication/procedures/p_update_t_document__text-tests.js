const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_update_t_document__text", function () {

        let oMockstarPlc = null;
        const sMasterdataTimestamp = NewDateAsISOString();
        const sCurrentUser = $.session.getUsername();

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_document__text", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        document_type: {
                            name: "sap.plc.db::basis.t_document_type",
                            data: testDataRepl.oDocumentType
                        },
                        error: {
                            name: "sap.plc.db::map.t_replication_log",
                            data: testDataRepl.oError
                        },
                        document: {
                            name: "sap.plc.db::basis.t_document",
                            data: testDataRepl.oDocument
                        },
                        document__text: {
                            name: "sap.plc.db::basis.t_document__text",
                            data: testDataRepl.oDocumentText
                        },
                        language: {
                            name: "sap.plc.db::basis.t_language",
                            data: testDataRepl.oLanguage
                        },
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

        /*--- Send empty body ---*/
        it('should not insert an empty entry', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResults = oMockstarPlc.execQuery(`select * from {{document__text}} where _VALID_FROM > '${sMasterdataTimestamp}' OR _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.DOCUMENT_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original inserted data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);

            expect(aResultsFullTable).toMatchData(testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        /*--- Send 2 entries with the same key (DUPLICATE_KEY_COUNT <> 1) ---*/
        it('should not insert 2 entries with the same key', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //act
            const aInputRows = [
                {
                    "DOCUMENT_TYPE_ID": 'DT4',
                    "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[0],
                    "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[0],
                    "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[0],
                    "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[0],
                    "DOCUMENT_DESCRIPTION": testDataRepl.oDocumentText.DOCUMENT_DESCRIPTION[0],
                    "_SOURCE": 2
                },
                {
                    "DOCUMENT_TYPE_ID": 'DT4',
                    "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[0],
                    "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[0],
                    "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[0],
                    "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[0],
                    "DOCUMENT_DESCRIPTION": testDataRepl.oDocumentText.DOCUMENT_DESCRIPTION[0],
                    "_SOURCE": 2
                }
            ];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document__text}} where DOCUMENT_ID = '${aInputRows[0].DOCUMENT_ID}'
            and DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.DOCUMENT_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{document__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.DOCUMENT_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        /*--- Try to update an entry with a non valid document id ---*/
        it('should not update an entry if document id does not exist', function () {
            const aInputRows = [
                {
                    "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[0],
                    "DOCUMENT_ID": 'D4',
                    "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[0],
                    "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[0],
                    "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[0],
                    "DOCUMENT_DESCRIPTION": testDataRepl.oDocumentText.DOCUMENT_DESCRIPTION[0],
                    "_SOURCE": 2
                }
            ];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");

            //check error table
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['DOCUMENT_ID'],
                "FIELD_VALUE": [aInputRows[0].DOCUMENT_ID],
                "MESSAGE_TEXT": ['Unknown Document ID for Document Type ID '.concat(aInputRows[0].DOCUMENT_TYPE_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_document__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);


            //check old entries were not changed
            let aResults = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(aResults).toBeDefined();

            aResultsOld = mockstarHelpers.convertResultToArray(aResults);
            expect(aResultsOld).toMatchData(testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        /*--- Try to update an entry with a non valid document type id ---*/
        it('should not update an entry if document type id does not exist', function () {
            const aInputRows = [
                {
                    "DOCUMENT_TYPE_ID": 'DT5',
                    "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[0],
                    "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[0],
                    "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[0],
                    "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[0],
                    "DOCUMENT_DESCRIPTION": testDataRepl.oDocumentText.DOCUMENT_DESCRIPTION[0],
                    "_SOURCE": 2
                }
            ];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");

            //check error table
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['DOCUMENT_TYPE_ID'],
                "FIELD_VALUE": [aInputRows[0].DOCUMENT_TYPE_ID],
                "MESSAGE_TEXT": ['Unknown Document Type ID for Document ID '.concat(aInputRows[0].DOCUMENT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_document__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);


            //check old entries were not changed
            let aResults = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(aResults).toBeDefined();

            aResultsOld = mockstarHelpers.convertResultToArray(aResults);
            expect(aResultsOld).toMatchData(testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        /*--- Try to update an entry with a non valid language ---*/
        it('should not update an entry if language does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");

            const aInputRows = [{
                "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[0],
                "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[0],
                "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[0],
                "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[0],
                "LANGUAGE": 'ML',
                "DOCUMENT_DESCRIPTION": 'Description in ML',
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Document ID '.concat(aInputRows[0].DOCUMENT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_document__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        /*--- Insert new entry ---*/
        it('should insert a new entry in FR for D1', function () {

            const aInputRows = [
                {
                    "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[0],
                    "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[0],
                    "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[0],
                    "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[0],
                    "LANGUAGE": 'FR',
                    "DOCUMENT_DESCRIPTION": 'Desc D1 in FR',
                    "_SOURCE": 2
                }
            ];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //check entry to be inserted does not exist
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document__text}} where DOCUMENT_ID = '${aInputRows[0].DOCUMENT_ID}' 
            and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.DOCUMENT_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResults = oMockstarPlc.execQuery(`select * from {{document__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();

            aResults = mockstarHelpers.convertResultToArray(aResults);

            expect(aResults).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
                "DOCUMENT_ID": [aInputRows[0].DOCUMENT_ID],
                "DOCUMENT_VERSION": [aInputRows[0].DOCUMENT_VERSION],
                "DOCUMENT_PART": [aInputRows[0].DOCUMENT_PART],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "DOCUMENT_DESCRIPTION": [aInputRows[0].DOCUMENT_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        /*--- Update document description ---*/
        it('should update an existing entry', function () {

            const aInputRows = [
                {
                    "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[1],
                    "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[1],
                    "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[1],
                    "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[1],
                    "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[1],
                    "DOCUMENT_DESCRIPTION": 'New Description for D1',
                    "_SOURCE": 2
                }
            ];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document__text}} where DOCUMENT_ID = '${aInputRows[0].DOCUMENT_ID}'
            and DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and DOCUMENT_VERSION = '${aInputRows[0].DOCUMENT_VERSION}'`);

            //check old entry
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData({
                "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[1],
                "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[1],
                "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[1],
                "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[1],
                "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[1],
                "DOCUMENT_DESCRIPTION": testDataRepl.oDocumentText.DOCUMENT_DESCRIPTION[1],
                "_VALID_FROM": testDataRepl.oDocumentText._VALID_FROM[1],
                "_VALID_TO": testDataRepl.oDocumentText._VALID_TO[1],
                "_SOURCE": testDataRepl.oDocumentText._SOURCE[1],
                "_CREATED_BY": testDataRepl.oDocumentText._CREATED_BY[1],
            }, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //check if we have 1 old entry and one new updated
            let aResults = oMockstarPlc.execQuery(`select * from {{document__text}} where DOCUMENT_ID = '${aInputRows[0].DOCUMENT_ID}'
            and DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and DOCUMENT_VERSION = '${aInputRows[0].DOCUMENT_VERSION}'`);

            expect(aResults).toBeDefined();
            expect(aResults.columns.DOCUMENT_ID.rows.length).toEqual(2);

            //check updated entry
            let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{document__text}} where DOCUMENT_ID = '${aInputRows[0].DOCUMENT_ID}'
            and DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and DOCUMENT_VERSION = '${aInputRows[0].DOCUMENT_VERSION}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsUpdated).toBeDefined();
            aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);

            expect(aResultsUpdated).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
                "DOCUMENT_ID": [aInputRows[0].DOCUMENT_ID],
                "DOCUMENT_VERSION": [aInputRows[0].DOCUMENT_VERSION],
                "DOCUMENT_PART": [aInputRows[0].DOCUMENT_PART],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "DOCUMENT_DESCRIPTION": [aInputRows[0].DOCUMENT_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //check old entry
            let aResultsOld = oMockstarPlc.execQuery(`select * from {{document__text}} where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsOld).toBeDefined();
            aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);

            expect(aResultsOld).toMatchData({
                "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[1],
                "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[1],
                "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[1],
                "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[1],
                "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[1],
                "DOCUMENT_DESCRIPTION": testDataRepl.oDocumentText.DOCUMENT_DESCRIPTION[1],
                "_SOURCE": testDataRepl.oDocumentText._SOURCE[1],
                "_CREATED_BY": sCurrentUser,
            }, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_SOURCE", "_CREATED_BY"]);

        });

        /*--- Update 1 entry, create 1 new and skip one with non-valid document id ---*/
        it('should update 1 entry, create 1, and skip one due to invalid document id', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[1],
                "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[1],
                "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[1],
                "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[1],
                "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[1],
                "DOCUMENT_DESCRIPTION": 'New Description for D1', //update
                "_SOURCE": 2
            },
            {
                "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[0],
                "DOCUMENT_ID": testDataRepl.oDocumentText.DOCUMENT_ID[0],
                "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[0],
                "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[0],
                "LANGUAGE": 'FR', //insert
                "DOCUMENT_DESCRIPTION": 'Desc D1 in FR',  
                "_SOURCE": 2
            },
            {
                "DOCUMENT_TYPE_ID": testDataRepl.oDocumentText.DOCUMENT_TYPE_ID[0],
                "DOCUMENT_ID": 'D4', //invalid
                "DOCUMENT_VERSION": testDataRepl.oDocumentText.DOCUMENT_VERSION[0],
                "DOCUMENT_PART": testDataRepl.oDocumentText.DOCUMENT_PART[0],
                "LANGUAGE": testDataRepl.oDocumentText.LANGUAGE[0],
                "DOCUMENT_DESCRIPTION": testDataRepl.oDocumentText.DOCUMENT_DESCRIPTION[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document__text}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oDocumentText, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document__text");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");

            //check error table
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['DOCUMENT_ID'],
                "FIELD_VALUE": [aInputRows[2].DOCUMENT_ID],
                "MESSAGE_TEXT": ['Unknown Document ID for Document Type ID '.concat(aInputRows[2].DOCUMENT_TYPE_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_document__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            
            let aResultsNew = oMockstarPlc.execQuery(`select * from {{document__text}} where DOCUMENT_ID in ('${aInputRows[0].DOCUMENT_ID}', 
            '${aInputRows[1].DOCUMENT_ID}', '${aInputRows[2].DOCUMENT_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsNew).toBeDefined();

            expect(aResultsNew.columns.DOCUMENT_ID.rows.length).toEqual(2);
            aResultsNew = mockstarHelpers.convertResultToArray(aResultsNew);

            //1 new inserts and 1 update
            expect(aResultsNew).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID, aInputRows[1].DOCUMENT_TYPE_ID],
                "DOCUMENT_ID": [aInputRows[0].DOCUMENT_ID, aInputRows[1].DOCUMENT_ID],
                "DOCUMENT_VERSION": [aInputRows[0].DOCUMENT_VERSION, aInputRows[1].DOCUMENT_VERSION],
                "DOCUMENT_PART": [aInputRows[0].DOCUMENT_PART, aInputRows[1].DOCUMENT_PART],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "DOCUMENT_DESCRIPTION": [aInputRows[0].DOCUMENT_DESCRIPTION, aInputRows[1].DOCUMENT_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

    }).addTags(["All_Unit_Tests"]);
}
