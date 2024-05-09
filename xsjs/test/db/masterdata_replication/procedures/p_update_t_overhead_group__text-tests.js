const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_overhead_group__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_overhead_group__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    overhead_group: {
                        name: "sap.plc.db::basis.t_overhead_group",
                        data: testData.oOverheadGroup
                    },
                    overhead_group__text: {
                        name: "sap.plc.db::basis.t_overhead_group__text",
                        data: testData.oOverheadGroupText
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

        it('should not create an overhead_group_text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "overhead_group__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
        					where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
        					where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new overhead_group_text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "overhead_group__text");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "OVERHEAD_GROUP_DESCRIPTION": "Overhead O3 P2 DE",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "OVERHEAD_GROUP_DESCRIPTION": "Overhead O3 P2 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where OVERHEAD_GROUP_ID in ('${aInputRows[0].OVERHEAD_GROUP_ID}', '${aInputRows[1].OVERHEAD_GROUP_ID}')`);
            expect(aBeforeResults.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "overhead_group__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID, aInputRows[1].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "OVERHEAD_GROUP_DESCRIPTION": [aInputRows[0].OVERHEAD_GROUP_DESCRIPTION, aInputRows[1].OVERHEAD_GROUP_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);
        });

        it('should update an existing overhead_group_text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "overhead_group__text");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[2],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[2],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[2],
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 P1 DE",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[3],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[3],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[3],
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 P1 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
        		where OVERHEAD_GROUP_ID in ('${aInputRows[0].OVERHEAD_GROUP_ID}', '${aInputRows[1].OVERHEAD_GROUP_ID}')
        		and _VALID_TO is null`);
            expect(aBeforeResults.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "overhead_group__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
        		where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID, aInputRows[1].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "OVERHEAD_GROUP_DESCRIPTION": [aInputRows[0].OVERHEAD_GROUP_DESCRIPTION, aInputRows[1].OVERHEAD_GROUP_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
        		where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID, aInputRows[1].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "OVERHEAD_GROUP_DESCRIPTION": [testData.oOverheadGroupText.OVERHEAD_GROUP_DESCRIPTION[2], testData.oOverheadGroupText.OVERHEAD_GROUP_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oOverheadGroupText._VALID_FROM[2], testData.oOverheadGroupText._VALID_FROM[3]],
                "_SOURCE": [testData.oOverheadGroupText._SOURCE[2], testData.oOverheadGroupText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "overhead_group__text");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[2],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[2],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[2],
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 P1 DE",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[2],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[2],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[2],
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 P1 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "overhead_group__text");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[6],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[6],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[6],
                "OVERHEAD_GROUP_DESCRIPTION": testData.oOverheadGroupText.OVERHEAD_GROUP_DESCRIPTION[6],
                "_SOURCE": testData.oOverheadGroupText._SOURCE[6],
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[7],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[7],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[7],
                "OVERHEAD_GROUP_DESCRIPTION": testData.oOverheadGroupText.OVERHEAD_GROUP_DESCRIPTION[7],
                "_SOURCE": testData.oOverheadGroupText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create an overhead_group_text if overhead_group_id does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": 'O4',
                "PLANT_ID": testData.oPlant.PLANT_ID[0],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "OVERHEAD_GROUP_DESCRIPTION": "Overhead O4 P1 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID'],
                "FIELD_VALUE": [aInputRows[0].PLANT_ID],
                "MESSAGE_TEXT": ['Unknown Plant ID for Overhead Group ID '.concat(aInputRows[0].OVERHEAD_GROUP_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_overhead_group__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update an overhead_group_text if plant_id does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[2],
                "PLANT_ID": 'PL99',
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[2],
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 PL99 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID'],
                "FIELD_VALUE": [aInputRows[0].PLANT_ID],
                "MESSAGE_TEXT": ['Unknown Plant ID for Overhead Group ID '.concat(aInputRows[0].OVERHEAD_GROUP_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_overhead_group__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update an overhead_group_text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[2],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[2],
                "LANGUAGE": 'AAA',
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 P1 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Overhead Group ID '.concat(aInputRows[0].OVERHEAD_GROUP_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_overhead_group__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two overhead_group_texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "OVERHEAD_GROUP_DESCRIPTION": "Overhead O3 P3 DE",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "OVERHEAD_GROUP_DESCRIPTION": "Overhead O3 P3 EN",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[2],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[2],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[2],
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 P1 DE",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[3],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[3],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[3],
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 P1 EN",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": 'O4',
                "PLANT_ID": 'PL99',
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[2],
                "OVERHEAD_GROUP_DESCRIPTION": "Overhead O4 PL99 DE",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[2],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[2],
                "LANGUAGE": 'AAA',
                "OVERHEAD_GROUP_DESCRIPTION": "Updated Overhead O1 P1 AAA",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[6],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "OVERHEAD_GROUP_DESCRIPTION": "Overhead O2 P2 FR",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[6],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "OVERHEAD_GROUP_DESCRIPTION": "Overhead O2 P2 FR",
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroupText.OVERHEAD_GROUP_ID[7],
                "PLANT_ID": testData.oOverheadGroupText.PLANT_ID[7],
                "LANGUAGE": testData.oOverheadGroupText.LANGUAGE[7],
                "OVERHEAD_GROUP_DESCRIPTION": testData.oOverheadGroupText.OVERHEAD_GROUP_DESCRIPTION[7],
                "_SOURCE": testData.oOverheadGroupText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oOverheadGroupText, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "overhead_group__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID', 'LANGUAGE'],
                "FIELD_VALUE": [aInputRows[4].PLANT_ID, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Plant ID for Overhead Group ID '.concat(aInputRows[4].OVERHEAD_GROUP_ID), 'Unknown Language for Overhead Group ID '.concat(aInputRows[5].OVERHEAD_GROUP_ID)],
                "MESSAGE_TYPE": ['ERROR','ERROR'],
                "TABLE_NAME": ['t_overhead_group__text', 't_overhead_group__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID, aInputRows[1].OVERHEAD_GROUP_ID, aInputRows[2].OVERHEAD_GROUP_ID, aInputRows[3].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "OVERHEAD_GROUP_DESCRIPTION": [aInputRows[0].OVERHEAD_GROUP_DESCRIPTION, aInputRows[1].OVERHEAD_GROUP_DESCRIPTION, aInputRows[2].OVERHEAD_GROUP_DESCRIPTION, aInputRows[3].OVERHEAD_GROUP_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
				where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[2].OVERHEAD_GROUP_ID, aInputRows[3].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "OVERHEAD_GROUP_DESCRIPTION": [testData.oOverheadGroupText.OVERHEAD_GROUP_DESCRIPTION[2], testData.oOverheadGroupText.OVERHEAD_GROUP_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oOverheadGroupText._VALID_FROM[2], testData.oOverheadGroupText._VALID_FROM[3]],
                "_SOURCE": [testData.oOverheadGroupText._SOURCE[2], testData.oOverheadGroupText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{overhead_group__text}}
                where OVERHEAD_GROUP_ID in ('${aInputRows[6].OVERHEAD_GROUP_ID}', '${aInputRows[7].OVERHEAD_GROUP_ID}', '${aInputRows[8].OVERHEAD_GROUP_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oOverheadGroupText, [4, 5, 6, 7]), ["OVERHEAD_GROUP_ID", "PLANT_ID", "LANGUAGE", "OVERHEAD_GROUP_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}