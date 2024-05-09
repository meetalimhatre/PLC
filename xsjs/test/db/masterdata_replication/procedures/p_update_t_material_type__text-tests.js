let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_material_type__text', function () {

        let oMockstarPlc = null;

        let sCurrentUser = $.session.getUsername();
        let sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function () {

            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material_type__text", // procedure or view under test
                    substituteTables:	// substitute all used tables in the procedure or view
                    {
                        material_type__text: {
                            name: "sap.plc.db::basis.t_material_type__text",
                            data: testDataRepl.oMaterialTypeText
                        },
                        material_type: {
                            name: "sap.plc.db::basis.t_material_type",
                            data: testDataRepl.oMaterialType
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

        it('should not create a Material Type Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_type__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialTypeText,
                ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should create a new Material Type Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aInputRows = [{
                "MATERIAL_TYPE_ID": 'MT3',
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[1],
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'`);
            expect(aBeforeResults).toBeDefined();

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "material_type__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "MATERIAL_TYPE_DESCRIPTION": [aInputRows[0].MATERIAL_TYPE_DESCRIPTION],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_VALID_TO": [null],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

        });

        it('should update an existing Material Type Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aInputRows = [{
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[8],
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[8],
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[8],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults).toMatchData({
                "MATERIAL_TYPE_ID": [testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[8]],
                "LANGUAGE": [testDataRepl.oMaterialTypeText.LANGUAGE[8]],
                "MATERIAL_TYPE_DESCRIPTION": [testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[8]],
                "_SOURCE": [testDataRepl.oMaterialTypeText._SOURCE[8]],
                "_VALID_TO": [testDataRepl.oMaterialTypeText._VALID_TO[8]],
                "_CREATED_BY": [testDataRepl.oMaterialTypeText._CREATED_BY[8]]
            }, ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "material_type__text");

            let aResultsCount = oMockstarPlc.execQuery(`select * from {{material_type__text}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'`);
            expect(aResultsCount).toBeDefined();
            expect(aResultsCount.columns.MATERIAL_TYPE_ID.rows.length).toEqual(2);

            //Check Updated entry
            let aResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "MATERIAL_TYPE_DESCRIPTION": [aInputRows[0].MATERIAL_TYPE_DESCRIPTION],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_VALID_TO": [null],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the Material Type Text table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aInputRows = [{
                "MATERIAL_TYPE_ID": 'MT3',
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[1],
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[0],
                "_SOURCE": 2
            },
            {
                "MATERIAL_TYPE_ID": 'MT3',
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[1],
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'`);
            expect(aBeforeResults).toBeDefined();

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_type__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialTypeText,
                ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

        });

        it('should not do any insert / update since all data from Material Type Text already exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aInputRows = [{
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[6],
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[6],
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[6],
                "_SOURCE": 2
            },
            {
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[7],
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[7],
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[7],
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_type__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_type__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_type__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oMaterialTypeText, ["MATERIAL_TYPE_ID", "_SOURCE"]);
        });

        it('should not update a Material Type Text if language id does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aInputRows = [{
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[8],
                "LANGUAGE": 'ML',
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[8],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oMaterialTypeText,
                ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Material Type ID '.concat(aInputRows[0].MATERIAL_TYPE_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_type__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{material_type__text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oMaterialTypeText,
                ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Material Type Text if Material Type does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aInputRows = [{
                "MATERIAL_TYPE_ID": 'MT7',
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[8],
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[8],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_type__text}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oMaterialTypeText,
                ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let test = oMockstarPlc.execQuery(`select * from {{material_type__text}} `);
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['MATERIAL_TYPE_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_TYPE_ID],
                "MESSAGE_TEXT": ['Unknown Material Type ID' ],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_type__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{material_type__text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oMaterialTypeText,
                ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert 2 Material Type Text, update 1, and skip one due to entry already present in table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_type__text");

            let aInputRows = [{
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[8],
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[1],
                "MATERIAL_TYPE_DESCRIPTION": '1 test',//testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[8],
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[2],
                "MATERIAL_TYPE_DESCRIPTION": '2 test',//testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[2],
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[2],
                "MATERIAL_TYPE_DESCRIPTION": 'Updated MG' + testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[2],//,
                "_SOURCE": 2
            }
                , {
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[7],
                "LANGUAGE": testDataRepl.oMaterialTypeText.LANGUAGE[7],
                "MATERIAL_TYPE_DESCRIPTION": testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[7],
                "_SOURCE": 2
            }
            ];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_type__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testDataRepl.oMaterialTypeText, ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "material_type__text");

            let aResultsNew = oMockstarPlc.execQuery(`select * from {{material_type__text}} where (MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}' or MATERIAL_TYPE_ID = '${aInputRows[1].MATERIAL_TYPE_ID}') and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsNew).toBeDefined();
            expect(aResultsNew.columns.MATERIAL_TYPE_ID.rows.length).toEqual(2);

            expect(aResultsNew).toMatchData({
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID, aInputRows[1].MATERIAL_TYPE_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "MATERIAL_TYPE_DESCRIPTION": [aInputRows[0].MATERIAL_TYPE_DESCRIPTION, aInputRows[1].MATERIAL_TYPE_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

            let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{material_type__text}} where MATERIAL_TYPE_ID = '${aInputRows[2].MATERIAL_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsUpdate).toBeDefined();
            expect(aResultsUpdate.columns.MATERIAL_TYPE_ID.rows.length).toEqual(1);

            expect(aResultsUpdate).toMatchData({
                "MATERIAL_TYPE_ID": [aInputRows[2].MATERIAL_TYPE_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE],
                "MATERIAL_TYPE_DESCRIPTION": [aInputRows[2].MATERIAL_TYPE_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[2]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material_type__text}} where MATERIAL_TYPE_ID = '${aInputRows[3].MATERIAL_TYPE_ID}'`);
            expect(aResultsSkip).toBeDefined();
            aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
            expect(aResultsSkip).toMatchData({
                "MATERIAL_TYPE_ID": [testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[4], testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[5], testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[6], testDataRepl.oMaterialTypeText.MATERIAL_TYPE_ID[7]],
                "LANGUAGE": [testDataRepl.oMaterialTypeText.LANGUAGE[4], testDataRepl.oMaterialTypeText.LANGUAGE[5], testDataRepl.oMaterialTypeText.LANGUAGE[6], testDataRepl.oMaterialTypeText.LANGUAGE[7]],
                "MATERIAL_TYPE_DESCRIPTION": [testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[4], testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[5], testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[6], testDataRepl.oMaterialTypeText.MATERIAL_TYPE_DESCRIPTION[7]],
                "_SOURCE": [testDataRepl.oMaterialTypeText._SOURCE[4], testDataRepl.oMaterialTypeText._SOURCE[5], testDataRepl.oMaterialTypeText._SOURCE[6], testDataRepl.oMaterialTypeText._SOURCE[7]],
                "_VALID_TO": [testDataRepl.oMaterialTypeText._VALID_TO[4], testDataRepl.oMaterialTypeText._VALID_TO[5], testDataRepl.oMaterialTypeText._VALID_TO[6], testDataRepl.oMaterialTypeText._VALID_TO[7]],
                "_CREATED_BY": [testDataRepl.oMaterialTypeText._CREATED_BY[4], testDataRepl.oMaterialTypeText._CREATED_BY[5], testDataRepl.oMaterialTypeText._CREATED_BY[6], testDataRepl.oMaterialTypeText._CREATED_BY[7]]
            }, ["MATERIAL_TYPE_ID", "LANGUAGE", "MATERIAL_TYPE_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}