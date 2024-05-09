let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_material_group__text', function () {

        let oMockstarPlc = null;

        let sCurrentUser = $.session.getUsername();
        let sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function () {

            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material_group__text", // procedure or view under test
                    substituteTables:	// substitute all used tables in the procedure or view
                    {
                        material_group__text: {
                            name: "sap.plc.db::basis.t_material_group__text",
                            data: testDataRepl.oMaterialGroupText
                        },
                        material_group: {
                            name: "sap.plc.db::basis.t_material_group",
                            data: testDataRepl.oMaterialGroup
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

        it('should not create a Material Group Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_group__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialGroupText,
                ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should create a new Material Group Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aInputRows = [{
                "MATERIAL_GROUP_ID": 'MG3',
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[1],
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}'`);
            expect(aBeforeResults).toBeDefined();

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "material_group__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "MATERIAL_GROUP_DESCRIPTION": [aInputRows[0].MATERIAL_GROUP_DESCRIPTION],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_VALID_TO": [null],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

        });

        it('should update an existing Material Group Text', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aInputRows = [{
                "MATERIAL_GROUP_ID": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[8],
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[8],
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[8],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults).toMatchData({
                "MATERIAL_GROUP_ID": [testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[8]],
                "LANGUAGE": [testDataRepl.oMaterialGroupText.LANGUAGE[8]],
                "MATERIAL_GROUP_DESCRIPTION": [testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[8]],
                "_SOURCE": [testDataRepl.oMaterialGroupText._SOURCE[8]],
                "_VALID_TO": [testDataRepl.oMaterialGroupText._VALID_TO[8]],
                "_CREATED_BY": [testDataRepl.oMaterialGroupText._CREATED_BY[8]]
            }, ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "material_group__text");

            let aResultsCount = oMockstarPlc.execQuery(`select * from {{material_group__text}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}'`);
            expect(aResultsCount).toBeDefined();
            expect(aResultsCount.columns.MATERIAL_GROUP_ID.rows.length).toEqual(2);

            //Check Updated entry
            let aResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE],
                "MATERIAL_GROUP_DESCRIPTION": [aInputRows[0].MATERIAL_GROUP_DESCRIPTION],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_VALID_TO": [null],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the Material Group Text table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aInputRows = [{
                "MATERIAL_GROUP_ID": 'MG3',
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[1],
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[0],
                "_SOURCE": 2
            },
            {
                "MATERIAL_GROUP_ID": 'MG3',
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[1],
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}'`);
            expect(aBeforeResults).toBeDefined();
            // expect(aBeforeResults.columns.MATERIAL_GROUP_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_group__text}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialGroupText,
                ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

        });

        it('should not do any insert / update since all data from Material Group Text already exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aInputRows = [{
                "MATERIAL_GROUP_ID": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[6],
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[6],
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[6],
                "_SOURCE": 2
            },
            {
                "MATERIAL_GROUP_ID": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[7],
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[7],
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[7],
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_group__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_group__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oMaterialGroupText, ["MATERIAL_GROUP_ID", "_SOURCE"]);
        });

        it('should not update a Material Group Text if language id does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aInputRows = [{
                "MATERIAL_GROUP_ID": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[8],
                "LANGUAGE": 'ML',
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[8],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oMaterialGroupText,
                ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Material Group ID '.concat(aInputRows[0].MATERIAL_GROUP_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_group__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{material_group__text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oMaterialGroupText,
                ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Material Group Text if Material Group does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aInputRows = [{
                "MATERIAL_GROUP_ID": 'MG7',
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[8],
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[8],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_group__text}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oMaterialGroupText,
                ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['MATERIAL_GROUP_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_GROUP_ID],
                "MESSAGE_TEXT": ['Unknown Material Group ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_group__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{material_group__text}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oMaterialGroupText,
                ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });


        it('should insert 2 Material Group Text, update 1, and skip one due to entry already present in table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_group__text");

            let aInputRows = [{
                "MATERIAL_GROUP_ID": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[8],
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[1],
                "MATERIAL_GROUP_DESCRIPTION": '1 test',//testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_GROUP_ID": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[8],
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[2],
                "MATERIAL_GROUP_DESCRIPTION": '2 test',//testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_GROUP_ID": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[2],
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[2],
                "MATERIAL_GROUP_DESCRIPTION": 'Updated MG' + testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[2],//,
                "_SOURCE": 2
            }
                , {
                "MATERIAL_GROUP_ID": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[7],
                "LANGUAGE": testDataRepl.oMaterialGroupText.LANGUAGE[7],
                "MATERIAL_GROUP_DESCRIPTION": testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[7],
                "_SOURCE": 2
            }
            ];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testDataRepl.oMaterialGroupText, ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "material_group__text");

            let aResultsNew = oMockstarPlc.execQuery(`select * from {{material_group__text}} where (MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}' or MATERIAL_GROUP_ID = '${aInputRows[1].MATERIAL_GROUP_ID}') and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsNew).toBeDefined();
            expect(aResultsNew.columns.MATERIAL_GROUP_ID.rows.length).toEqual(2);

            expect(aResultsNew).toMatchData({
                "MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID, aInputRows[1].MATERIAL_GROUP_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "MATERIAL_GROUP_DESCRIPTION": [aInputRows[0].MATERIAL_GROUP_DESCRIPTION, aInputRows[1].MATERIAL_GROUP_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

            let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{material_group__text}} where MATERIAL_GROUP_ID = '${aInputRows[2].MATERIAL_GROUP_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsUpdate).toBeDefined();
            expect(aResultsUpdate.columns.MATERIAL_GROUP_ID.rows.length).toEqual(1);

            expect(aResultsUpdate).toMatchData({
                "MATERIAL_GROUP_ID": [aInputRows[2].MATERIAL_GROUP_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE],
                "MATERIAL_GROUP_DESCRIPTION": [aInputRows[2].MATERIAL_GROUP_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[2]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material_group__text}} where MATERIAL_GROUP_ID = '${aInputRows[3].MATERIAL_GROUP_ID}'`);
            expect(aResultsSkip).toBeDefined();
            aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
            expect(aResultsSkip).toMatchData({
                "MATERIAL_GROUP_ID": [testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[4], testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[5], testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[6], testDataRepl.oMaterialGroupText.MATERIAL_GROUP_ID[7]],
                "LANGUAGE": [testDataRepl.oMaterialGroupText.LANGUAGE[4], testDataRepl.oMaterialGroupText.LANGUAGE[5], testDataRepl.oMaterialGroupText.LANGUAGE[6], testDataRepl.oMaterialGroupText.LANGUAGE[7]],
                "MATERIAL_GROUP_DESCRIPTION": [testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[4], testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[5], testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[6], testDataRepl.oMaterialGroupText.MATERIAL_GROUP_DESCRIPTION[7]],
                "_SOURCE": [testDataRepl.oMaterialGroupText._SOURCE[4], testDataRepl.oMaterialGroupText._SOURCE[5], testDataRepl.oMaterialGroupText._SOURCE[6], testDataRepl.oMaterialGroupText._SOURCE[7]],
                "_VALID_TO": [testDataRepl.oMaterialGroupText._VALID_TO[4], testDataRepl.oMaterialGroupText._VALID_TO[5], testDataRepl.oMaterialGroupText._VALID_TO[6], testDataRepl.oMaterialGroupText._VALID_TO[7]],
                "_CREATED_BY": [testDataRepl.oMaterialGroupText._CREATED_BY[4], testDataRepl.oMaterialGroupText._CREATED_BY[5], testDataRepl.oMaterialGroupText._CREATED_BY[6], testDataRepl.oMaterialGroupText._CREATED_BY[7]]
            }, ["MATERIAL_GROUP_ID", "LANGUAGE", "MATERIAL_GROUP_DESCRIPTION", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}