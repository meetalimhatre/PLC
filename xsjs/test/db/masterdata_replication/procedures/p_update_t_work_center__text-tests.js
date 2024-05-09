const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_work_center__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_work_center__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    work_center: {
                        name: "sap.plc.db::basis.t_work_center",
                        data: testData.oWorkCenter
                    },
                    work_center__text: {
                        name: "sap.plc.db::basis.t_work_center__text",
                        data: testData.oWorkCenterText
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

        it('should not create a work center text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "work_center__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new work center text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "work_center__text");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "WORK_CENTER_DESCRIPTION": "WC WC3 DE",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "WORK_CENTER_DESCRIPTION": "WC WC3 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where WORK_CENTER_ID in ('${aInputRows[0].WORK_CENTER_ID}', '${aInputRows[1].WORK_CENTER_ID}')`);
            expect(aBeforeResults.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "work_center__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID, aInputRows[1].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "WORK_CENTER_DESCRIPTION": [aInputRows[0].WORK_CENTER_DESCRIPTION, aInputRows[1].WORK_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.WORK_CENTER_ID.rows.length).toEqual(0);
        });

        it('should update an existing work center text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "work_center__text");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[2],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[2],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[2],
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 DE",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[3],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[3],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[3],
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where WORK_CENTER_ID in ('${aInputRows[0].WORK_CENTER_ID}', '${aInputRows[1].WORK_CENTER_ID}')
                and _VALID_TO is null`);
            expect(aBeforeResults.columns.WORK_CENTER_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "work_center__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID, aInputRows[1].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "WORK_CENTER_DESCRIPTION": [aInputRows[0].WORK_CENTER_DESCRIPTION, aInputRows[1].WORK_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID, aInputRows[1].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "WORK_CENTER_DESCRIPTION": [testData.oWorkCenterText.WORK_CENTER_DESCRIPTION[2], testData.oWorkCenterText.WORK_CENTER_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oWorkCenterText._VALID_FROM[2], testData.oWorkCenterText._VALID_FROM[3]],
                "_SOURCE": [testData.oWorkCenterText._SOURCE[2], testData.oWorkCenterText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "work_center__text");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[2],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[2],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[2],
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 DE",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[2],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[2],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[2],
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "work_center__text");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[6],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[6],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[6],
                "WORK_CENTER_DESCRIPTION": testData.oWorkCenterText.WORK_CENTER_DESCRIPTION[6],
                "_SOURCE": testData.oWorkCenterText._SOURCE[6],
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[7],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[7],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[7],
                "WORK_CENTER_DESCRIPTION": testData.oWorkCenterText.WORK_CENTER_DESCRIPTION[7],
                "_SOURCE": testData.oWorkCenterText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create a work center text if work center does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aInputRows = [{
                "WORK_CENTER_ID": 'WC4',
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[0],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "WORK_CENTER_DESCRIPTION": "WC WC4 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['WORK_CENTER_ID'],
                "FIELD_VALUE": [aInputRows[0].WORK_CENTER_ID],
                "MESSAGE_TEXT": ['Unknown Work Center ID for Plant ID '.concat(aInputRows[0].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_work_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a work center text if plant does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[2],
                "PLANT_ID": '1111',
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[2],
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['WORK_CENTER_ID'],
                "FIELD_VALUE": [aInputRows[0].WORK_CENTER_ID],
                "MESSAGE_TEXT": ['Unknown Work Center ID for Plant ID '.concat(aInputRows[0].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_work_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a work center text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[2],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[2],
                "LANGUAGE": 'AAA',
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Work Center ID '.concat(aInputRows[0].WORK_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_work_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two work center texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "WORK_CENTER_DESCRIPTION": "WC WC3 DE",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "WORK_CENTER_DESCRIPTION": "WC WC3 EN",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[2],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[2],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[2],
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 DE",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[3],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[3],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[3],
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 EN",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": 'WC4',
                "PLANT_ID": '1111',
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[2],
                "WORK_CENTER_DESCRIPTION": "WC WC4 DE",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[2],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[2],
                "LANGUAGE": 'AAA',
                "WORK_CENTER_DESCRIPTION": "Updated WC WC1 AAA",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[6],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "WORK_CENTER_DESCRIPTION": "WC WC4 FR",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[6],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "WORK_CENTER_DESCRIPTION": "WC WC4 FR",
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenterText.WORK_CENTER_ID[7],
                "PLANT_ID": testData.oWorkCenterText.PLANT_ID[7],
                "LANGUAGE": testData.oWorkCenterText.LANGUAGE[7],
                "WORK_CENTER_DESCRIPTION": testData.oWorkCenterText.WORK_CENTER_DESCRIPTION[7],
                "_SOURCE": testData.oWorkCenterText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oWorkCenterText, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "work_center__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['WORK_CENTER_ID', 'LANGUAGE'],
                "FIELD_VALUE": [aInputRows[4].WORK_CENTER_ID, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Work Center ID for Plant ID '.concat(aInputRows[4].PLANT_ID), 'Unknown Language for Work Center ID '.concat(aInputRows[5].WORK_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR', 'ERROR'],
                "TABLE_NAME": ['t_work_center__text', 't_work_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID, aInputRows[1].WORK_CENTER_ID, aInputRows[2].WORK_CENTER_ID, aInputRows[3].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "WORK_CENTER_DESCRIPTION": [aInputRows[0].WORK_CENTER_DESCRIPTION, aInputRows[1].WORK_CENTER_DESCRIPTION, aInputRows[2].WORK_CENTER_DESCRIPTION, aInputRows[3].WORK_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[2].WORK_CENTER_ID, aInputRows[3].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "WORK_CENTER_DESCRIPTION": [testData.oWorkCenterText.WORK_CENTER_DESCRIPTION[2], testData.oWorkCenterText.WORK_CENTER_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oWorkCenterText._VALID_FROM[2], testData.oWorkCenterText._VALID_FROM[3]],
                "_SOURCE": [testData.oWorkCenterText._SOURCE[2], testData.oWorkCenterText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{work_center__text}}
                where WORK_CENTER_ID in ('${aInputRows[6].WORK_CENTER_ID}', '${aInputRows[7].WORK_CENTER_ID}', '${aInputRows[8].WORK_CENTER_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oWorkCenterText, [4, 5, 6, 7]), ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}