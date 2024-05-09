const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_plant__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_plant__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    plant: {
                        name: "sap.plc.db::basis.t_plant",
                        data: testData.oPlant
                    },
                    plant__text: {
                        name: "sap.plc.db::basis.t_plant__text",
                        data: testData.oPlantText
                    },
                    language: {
                        name: "sap.plc.db::basis.t_language",
                        data: testData.oLanguage
                    },
                    error: {
                        name: "sap.plc.db::map.t_replication_log",
                        data: testData.oError
                    }
                }
            });
        });

        beforeEach(function() {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function() {});

        function pickFromTableData(oTableDataObject, aIndices) {
            var oReturnObject = {};
            _.each(oTableDataObject, function(aValues, sColumnName) {
                // since _.pick returns an object, the result must be converted back to an array
                oReturnObject[sColumnName] = _.toArray(_.pick(aValues, aIndices));
            });
            return oReturnObject;
        }

        it('should not create a plant text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "plant__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PLANT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PLANT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlantText, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new plant text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "plant__text");

            let aInputRows = [{
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "PLANT_DESCRIPTION": "Plant PL3 DE",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "PLANT_DESCRIPTION": "Plant PL3 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where PLANT_ID in ('${aInputRows[0].PLANT_ID}', '${aInputRows[1].PLANT_ID}')`);
            expect(aBeforeResults.columns.PLANT_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "plant__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "PLANT_DESCRIPTION": [aInputRows[0].PLANT_DESCRIPTION, aInputRows[1].PLANT_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PLANT_ID.rows.length).toEqual(0);
        });

        it('should update an existing plant text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "plant__text");

            let aInputRows = [{
                "PLANT_ID": testData.oPlantText.PLANT_ID[2],
                "LANGUAGE": testData.oPlantText.LANGUAGE[2],
                "PLANT_DESCRIPTION": "Updated Plant PL1 DE",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[3],
                "LANGUAGE": testData.oPlantText.LANGUAGE[3],
                "PLANT_DESCRIPTION": "Updated Plant PL1 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where PLANT_ID in ('${aInputRows[0].PLANT_ID}', '${aInputRows[1].PLANT_ID}')
                and _VALID_TO is null`);
            expect(aBeforeResults.columns.PLANT_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "plant__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "PLANT_DESCRIPTION": [aInputRows[0].PLANT_DESCRIPTION, aInputRows[1].PLANT_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "PLANT_DESCRIPTION": [testData.oPlantText.PLANT_DESCRIPTION[2], testData.oPlantText.PLANT_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oPlantText._VALID_FROM[2], testData.oPlantText._VALID_FROM[3]],
                "_SOURCE": [testData.oPlantText._SOURCE[2], testData.oPlantText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "plant__text");

            let aInputRows = [{
                "PLANT_ID": testData.oPlantText.PLANT_ID[2],
                "LANGUAGE": testData.oPlantText.LANGUAGE[2],
                "PLANT_DESCRIPTION": "Updated Plant PL1 DE",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[2],
                "LANGUAGE": testData.oPlantText.LANGUAGE[2],
                "PLANT_DESCRIPTION": "Updated Plant PL1 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PLANT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PLANT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlantText, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "plant__text");

            let aInputRows = [{
                "PLANT_ID": testData.oPlantText.PLANT_ID[6],
                "LANGUAGE": testData.oPlantText.LANGUAGE[6],
                "PLANT_DESCRIPTION": testData.oPlantText.PLANT_DESCRIPTION[6],
                "_SOURCE": testData.oPlantText._SOURCE[6],
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[7],
                "LANGUAGE": testData.oPlantText.LANGUAGE[7],
                "PLANT_DESCRIPTION": testData.oPlantText.PLANT_DESCRIPTION[7],
                "_SOURCE": testData.oPlantText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PLANT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PLANT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlantText, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create a plant text if plant does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            let aInputRows = [{
                "PLANT_ID": 'PL4',
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "PLANT_DESCRIPTION": "Plant PL4 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{plant__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oPlantText, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID'],
                "FIELD_VALUE": [`${aInputRows[0].PLANT_ID}`],
                "MESSAGE_TEXT": ['Unknown Plant ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_plant__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlantText, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a plant text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            let aInputRows = [{
                "PLANT_ID": testData.oPlantText.PLANT_ID[2],
                "LANGUAGE": 'AAA',
                "PLANT_DESCRIPTION": "Updated Plant PL1 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{plant__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oPlantText, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Plant ID '.concat(aInputRows[0].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_plant__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlantText, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two plant texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            let aInputRows = [{
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "PLANT_DESCRIPTION": "Plant PL3 DE",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "PLANT_DESCRIPTION": "Plant PL3 EN",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[2],
                "LANGUAGE": testData.oPlantText.LANGUAGE[2],
                "PLANT_DESCRIPTION": "Updated Plant PL1 DE",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[3],
                "LANGUAGE": testData.oPlantText.LANGUAGE[3],
                "PLANT_DESCRIPTION": "Updated Plant PL1 EN",
                "_SOURCE": 2
            }, {
                "PLANT_ID": 'PL4',
                "LANGUAGE": testData.oPlantText.LANGUAGE[2],
                "PLANT_DESCRIPTION": "Plant PL4 DE",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[2],
                "LANGUAGE": 'AAA',
                "PLANT_DESCRIPTION": "Updated Plant PL1 AAA",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "PLANT_DESCRIPTION": "Plant PL4 FR",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "PLANT_DESCRIPTION": "Plant PL4 FR",
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlantText.PLANT_ID[7],
                "LANGUAGE": testData.oPlantText.LANGUAGE[7],
                "PLANT_DESCRIPTION": testData.oPlantText.PLANT_DESCRIPTION[7],
                "_SOURCE": testData.oPlantText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{plant__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oPlantText, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "plant__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID', 'LANGUAGE'],
                "FIELD_VALUE": [aInputRows[4].PLANT_ID, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Plant ID', 'Unknown Language for Plant ID '.concat(aInputRows[5].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR','ERROR'],
                "TABLE_NAME": ['t_plant__text', 't_plant__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "PLANT_DESCRIPTION": [aInputRows[0].PLANT_DESCRIPTION, aInputRows[1].PLANT_DESCRIPTION, aInputRows[2].PLANT_DESCRIPTION, aInputRows[3].PLANT_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PLANT_ID": [aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "PLANT_DESCRIPTION": [testData.oPlantText.PLANT_DESCRIPTION[2], testData.oPlantText.PLANT_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oPlantText._VALID_FROM[2], testData.oPlantText._VALID_FROM[3]],
                "_SOURCE": [testData.oPlantText._SOURCE[2], testData.oPlantText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{plant__text}}
                where PLANT_ID in ('${aInputRows[6].PLANT_ID}', '${aInputRows[7].PLANT_ID}', '${aInputRows[8].PLANT_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oPlantText, [4, 5, 6, 7]), ["PLANT_ID", "LANGUAGE", "PLANT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}