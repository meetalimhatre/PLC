const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_controlling_area__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_controlling_area__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    controlling_area: {
                        name: "sap.plc.db::basis.t_controlling_area",
                        data: testData.oControllingArea
                    },
                    controlling_area__text: {
                        name: "sap.plc.db::basis.t_controlling_area__text",
                        data: testData.oControllingAreaText
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

        it('should not create a controlling area text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "controlling_area__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
        					where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
        					where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oControllingAreaText, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new controlling area text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "controlling_area__text");

            const aInputRows = [{
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "CONTROLLING_AREA_DESCRIPTION": "CArea 3000 DE",
                "_SOURCE": 2
            }, {
                
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "CONTROLLING_AREA_DESCRIPTION": "CArea 3000 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where CONTROLLING_AREA_ID in ('${aInputRows[0].CONTROLLING_AREA_ID}', '${aInputRows[1].CONTROLLING_AREA_ID}')`);
            expect(aBeforeResults.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "controlling_area__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "CONTROLLING_AREA_DESCRIPTION": [aInputRows[0].CONTROLLING_AREA_DESCRIPTION, aInputRows[1].CONTROLLING_AREA_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);
        });

        it('should update an existing controlling area text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "controlling_area__text");

            const aInputRows = [{
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[2],
                "CONTROLLING_AREA_DESCRIPTION": "Updated CArea 1000 DE",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[3],
                "CONTROLLING_AREA_DESCRIPTION": "Updated CArea 1000 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
        		where CONTROLLING_AREA_ID in ('${aInputRows[0].CONTROLLING_AREA_ID}', '${aInputRows[1].CONTROLLING_AREA_ID}')
        		and _VALID_TO is null`);
            expect(aBeforeResults.columns.CONTROLLING_AREA_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "controlling_area__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
        		where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "CONTROLLING_AREA_DESCRIPTION": [aInputRows[0].CONTROLLING_AREA_DESCRIPTION, aInputRows[1].CONTROLLING_AREA_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
        		where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "CONTROLLING_AREA_DESCRIPTION": [testData.oControllingAreaText.CONTROLLING_AREA_DESCRIPTION[2], testData.oControllingAreaText.CONTROLLING_AREA_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oControllingAreaText._VALID_FROM[2], testData.oControllingAreaText._VALID_FROM[3]],
                "_SOURCE": [testData.oControllingAreaText._SOURCE[2], testData.oControllingAreaText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "controlling_area__text");

            const aInputRows = [{
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[2],
                "CONTROLLING_AREA_DESCRIPTION": "Updated CArea 1000 DE",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[2],
                "CONTROLLING_AREA_DESCRIPTION": "Updated CArea 1000 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oControllingAreaText, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "controlling_area__text");

            const aInputRows = [{
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[6],
                "CONTROLLING_AREA_DESCRIPTION": testData.oControllingAreaText.CONTROLLING_AREA_DESCRIPTION[6],
                "_SOURCE": testData.oControllingAreaText._SOURCE[6],
            }, {
                
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[7],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[7],
                "CONTROLLING_AREA_DESCRIPTION": testData.oControllingAreaText.CONTROLLING_AREA_DESCRIPTION[7],
                "_SOURCE": testData.oControllingAreaText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oControllingAreaText, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create a controlling area text if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

            const aInputRows = [{
                "CONTROLLING_AREA_ID": 4000,
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "CONTROLLING_AREA_DESCRIPTION": "CArea C4 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oControllingAreaText, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [`${aInputRows[0].CONTROLLING_AREA_ID}`],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_controlling_area__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oControllingAreaText, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a controlling area text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

            const aInputRows = [{
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'AAA',
                "CONTROLLING_AREA_DESCRIPTION": "Updated CArea 1000 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oControllingAreaText, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_controlling_area__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oControllingAreaText, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two controlling area texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

            const aInputRows = [{
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "CONTROLLING_AREA_DESCRIPTION": "CArea 3000 DE",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "CONTROLLING_AREA_DESCRIPTION": "CArea 3000 EN",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[2],
                "CONTROLLING_AREA_DESCRIPTION": "Updated CArea 1000 DE",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[3],
                "CONTROLLING_AREA_DESCRIPTION": "Updated CArea 1000 EN",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": '4000',
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[2],
                "CONTROLLING_AREA_DESCRIPTION": "CArea 4000 DE",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'AAA',
                "CONTROLLING_AREA_DESCRIPTION": "Updated CArea 1000 AAA",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "CONTROLLING_AREA_DESCRIPTION": "CArea 2000 FR",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "CONTROLLING_AREA_DESCRIPTION": "CArea 2000 FR",
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingAreaText.CONTROLLING_AREA_ID[7],
                "LANGUAGE": testData.oControllingAreaText.LANGUAGE[7],
                "CONTROLLING_AREA_DESCRIPTION": testData.oControllingAreaText.CONTROLLING_AREA_DESCRIPTION[7],
                "_SOURCE": testData.oControllingAreaText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oControllingAreaText, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "controlling_area__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID', 'LANGUAGE'],
                "FIELD_VALUE": [`${aInputRows[4].CONTROLLING_AREA_ID}`, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID', 'Unknown Language for Controlling Area ID '.concat(aInputRows[5].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR', 'ERROR'],
                "TABLE_NAME": ['t_controlling_area__text', 't_controlling_area__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "CONTROLLING_AREA_DESCRIPTION": [aInputRows[0].CONTROLLING_AREA_DESCRIPTION, aInputRows[1].CONTROLLING_AREA_DESCRIPTION, aInputRows[2].CONTROLLING_AREA_DESCRIPTION, aInputRows[3].CONTROLLING_AREA_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
				where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "CONTROLLING_AREA_DESCRIPTION": [testData.oControllingAreaText.CONTROLLING_AREA_DESCRIPTION[2], testData.oControllingAreaText.CONTROLLING_AREA_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oControllingAreaText._VALID_FROM[2], testData.oControllingAreaText._VALID_FROM[3]],
                "_SOURCE": [testData.oControllingAreaText._SOURCE[2], testData.oControllingAreaText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{controlling_area__text}}
                where CONTROLLING_AREA_ID in ('${aInputRows[6].CONTROLLING_AREA_ID}', '${aInputRows[7].CONTROLLING_AREA_ID}', '${aInputRows[8].CONTROLLING_AREA_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oControllingAreaText, [4, 5, 6, 7]), ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}