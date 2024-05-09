const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_material__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    material: {
                        name: "sap.plc.db::basis.t_material",
                        data: testData.oMaterial
                    },
                    material__text: {
                        name: "sap.plc.db::basis.t_material__text",
                        data: testData.oMaterialText
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

        it('should not create a material text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "material__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialText, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new material text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "material__text");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "MATERIAL_DESCRIPTION": "Mat MAT3 DE",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "MATERIAL_DESCRIPTION": "Mat MAT3 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material__text}}
                where MATERIAL_ID in ('${aInputRows[0].MATERIAL_ID}', '${aInputRows[1].MATERIAL_ID}')`);
            expect(aBeforeResults.columns.MATERIAL_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "material__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "MATERIAL_DESCRIPTION": [aInputRows[0].MATERIAL_DESCRIPTION, aInputRows[1].MATERIAL_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);
        });

        it('should update an existing material text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "material__text");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[2],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[2],
                "MATERIAL_DESCRIPTION": "Updated Mat MAT1 DE",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[3],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[3],
                "MATERIAL_DESCRIPTION": "Updated Mat MAT1 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material__text}}
                where MATERIAL_ID in ('${aInputRows[0].MATERIAL_ID}', '${aInputRows[1].MATERIAL_ID}')
                and _VALID_TO is null`);
            expect(aBeforeResults.columns.MATERIAL_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "material__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "MATERIAL_DESCRIPTION": [aInputRows[0].MATERIAL_DESCRIPTION, aInputRows[1].MATERIAL_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "MATERIAL_DESCRIPTION": [testData.oMaterialText.MATERIAL_DESCRIPTION[2], testData.oMaterialText.MATERIAL_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oMaterialText._VALID_FROM[2], testData.oMaterialText._VALID_FROM[3]],
                "_SOURCE": [testData.oMaterialText._SOURCE[2], testData.oMaterialText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "material__text");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[2],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[2],
                "MATERIAL_DESCRIPTION": "Updated Mat MAT1 DE",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[2],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[2],
                "MATERIAL_DESCRIPTION": "Updated Mat MAT1 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialText, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "material__text");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[6],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[6],
                "MATERIAL_DESCRIPTION": testData.oMaterialText.MATERIAL_DESCRIPTION[6],
                "_SOURCE": testData.oMaterialText._SOURCE[6],
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[7],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[7],
                "MATERIAL_DESCRIPTION": testData.oMaterialText.MATERIAL_DESCRIPTION[7],
                "_SOURCE": testData.oMaterialText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialText, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create a material text if material does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aInputRows = [{
                "MATERIAL_ID": 'MAT4',
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "MATERIAL_DESCRIPTION": "Mat MAT4 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialText, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['MATERIAL_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_ID],
                "MESSAGE_TEXT": ['Unknown Material ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialText, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a material text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[2],
                "LANGUAGE": 'AAA',
                "MATERIAL_DESCRIPTION": "Updated Mat MAT1 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialText, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialText, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two material texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "MATERIAL_DESCRIPTION": "Mat MAT3 DE",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "MATERIAL_DESCRIPTION": "Mat MAT3 EN",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[2],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[2],
                "MATERIAL_DESCRIPTION": "Updated Mat MAT1 DE",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[3],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[3],
                "MATERIAL_DESCRIPTION": "Updated Mat MAT1 EN",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": 'MAT4',
                "LANGUAGE": testData.oMaterialText.LANGUAGE[2],
                "MATERIAL_DESCRIPTION": "Mat MAT4 DE",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[2],
                "LANGUAGE": 'AAA',
                "MATERIAL_DESCRIPTION": "Updated Mat MAT1 AAA",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "MATERIAL_DESCRIPTION": "Mat MAT4 FR",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "MATERIAL_DESCRIPTION": "Mat MAT4 FR",
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialText.MATERIAL_ID[7],
                "LANGUAGE": testData.oMaterialText.LANGUAGE[7],
                "MATERIAL_DESCRIPTION": testData.oMaterialText.MATERIAL_DESCRIPTION[7],
                "_SOURCE": testData.oMaterialText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialText, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "material__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['MATERIAL_ID', 'LANGUAGE'],
                "FIELD_VALUE": [aInputRows[4].MATERIAL_ID, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Material ID', 'Unknown Language for Material ID '.concat(aInputRows[5].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR', 'ERROR'],
                "TABLE_NAME": ['t_material__text', 't_material__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID, aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "MATERIAL_DESCRIPTION": [aInputRows[0].MATERIAL_DESCRIPTION, aInputRows[1].MATERIAL_DESCRIPTION, aInputRows[2].MATERIAL_DESCRIPTION, aInputRows[3].MATERIAL_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "MATERIAL_ID": [aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "MATERIAL_DESCRIPTION": [testData.oMaterialText.MATERIAL_DESCRIPTION[2], testData.oMaterialText.MATERIAL_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oMaterialText._VALID_FROM[2], testData.oMaterialText._VALID_FROM[3]],
                "_SOURCE": [testData.oMaterialText._SOURCE[2], testData.oMaterialText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material__text}}
                where MATERIAL_ID in ('${aInputRows[6].MATERIAL_ID}', '${aInputRows[7].MATERIAL_ID}', '${aInputRows[8].MATERIAL_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oMaterialText, [4, 5, 6, 7]), ["MATERIAL_ID", "LANGUAGE", "MATERIAL_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}