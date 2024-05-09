const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_profit_center__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_profit_center__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    profit_center: {
                        name: "sap.plc.db::basis.t_profit_center",
                        data: testData.oProfitCenter
                    },
                    profit_center__text: {
                        name: "sap.plc.db::basis.t_profit_center__text",
                        data: testData.oProfitCenterText
                    },
                    controlling_area: {
                        name: "sap.plc.db::basis.t_controlling_area",
                        data: testData.oControllingArea
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

        it('should not create a profit_center_text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "profit_center__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new profit_center_text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "profit_center__text");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "PROFIT_CENTER_DESCRIPTION": "Profit P3 DE",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "PROFIT_CENTER_DESCRIPTION": "Profit P3 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where PROFIT_CENTER_ID in ('${aInputRows[0].PROFIT_CENTER_ID}', '${aInputRows[1].PROFIT_CENTER_ID}')`);
            expect(aBeforeResults.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "profit_center__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[0].PROFIT_CENTER_ID, aInputRows[1].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "PROFIT_CENTER_DESCRIPTION": [aInputRows[0].PROFIT_CENTER_DESCRIPTION, aInputRows[1].PROFIT_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);
        });

        it('should update an existing profit_center_text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "profit_center__text");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[2],
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 DE",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[3],
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where PROFIT_CENTER_ID in ('${aInputRows[0].PROFIT_CENTER_ID}', '${aInputRows[1].PROFIT_CENTER_ID}')
                and _VALID_TO is null`);
            expect(aBeforeResults.columns.PROFIT_CENTER_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "profit_center__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[0].PROFIT_CENTER_ID, aInputRows[1].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "PROFIT_CENTER_DESCRIPTION": [aInputRows[0].PROFIT_CENTER_DESCRIPTION, aInputRows[1].PROFIT_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[0].PROFIT_CENTER_ID, aInputRows[1].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "PROFIT_CENTER_DESCRIPTION": [testData.oProfitCenterText.PROFIT_CENTER_DESCRIPTION[2], testData.oProfitCenterText.PROFIT_CENTER_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oProfitCenterText._VALID_FROM[2], testData.oProfitCenterText._VALID_FROM[3]],
                "_SOURCE": [testData.oProfitCenterText._SOURCE[2], testData.oProfitCenterText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "profit_center__text");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[2],
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 DE",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[2],
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "profit_center__text");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[6],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[6],
                "PROFIT_CENTER_DESCRIPTION": testData.oProfitCenterText.PROFIT_CENTER_DESCRIPTION[6],
                "_SOURCE": testData.oProfitCenterText._SOURCE[6],
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[7],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[7],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[7],
                "PROFIT_CENTER_DESCRIPTION": testData.oProfitCenterText.PROFIT_CENTER_DESCRIPTION[7],
                "_SOURCE": testData.oProfitCenterText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create a profit_center_text if profit_center does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aInputRows = [{
                "PROFIT_CENTER_ID": 'P4',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "PROFIT_CENTER_DESCRIPTION": "Profit P4 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PROFIT_CENTER_ID'],
                "FIELD_VALUE": [aInputRows[0].PROFIT_CENTER_ID],
                "MESSAGE_TEXT": ['Unknown Profit Center ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_profit_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a profit_center_text if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[2],
                "CONTROLLING_AREA_ID": '1111',
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[2],
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PROFIT_CENTER_ID'],
                "FIELD_VALUE": [aInputRows[0].PROFIT_CENTER_ID],
                "MESSAGE_TEXT": ['Unknown Profit Center ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_profit_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a profit_center_text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'AAA',
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Profit Center ID '.concat(aInputRows[0].PROFIT_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_profit_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two profit_center_texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "PROFIT_CENTER_DESCRIPTION": "Profit P3 DE",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "PROFIT_CENTER_DESCRIPTION": "Profit P3 EN",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[2],
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 DE",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[3],
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 EN",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": 'P4',
                "CONTROLLING_AREA_ID": '1111',
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[2],
                "PROFIT_CENTER_DESCRIPTION": "Profit P4 DE",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'AAA',
                "PROFIT_CENTER_DESCRIPTION": "Updated Profit P1 AAA",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[6],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "PROFIT_CENTER_DESCRIPTION": "Profit P4 FR",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[6],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "PROFIT_CENTER_DESCRIPTION": "Profit P4 FR",
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenterText.PROFIT_CENTER_ID[7],
                "CONTROLLING_AREA_ID": testData.oProfitCenterText.CONTROLLING_AREA_ID[7],
                "LANGUAGE": testData.oProfitCenterText.LANGUAGE[7],
                "PROFIT_CENTER_DESCRIPTION": testData.oProfitCenterText.PROFIT_CENTER_DESCRIPTION[7],
                "_SOURCE": testData.oProfitCenterText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{profit_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oProfitCenterText, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "profit_center__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PROFIT_CENTER_ID', 'LANGUAGE'],
                "FIELD_VALUE": [aInputRows[4].PROFIT_CENTER_ID, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Profit Center ID for Controlling Area ID '.concat(aInputRows[4].CONTROLLING_AREA_ID),
                 'Unknown Language for Profit Center ID '.concat(aInputRows[5].PROFIT_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR','ERROR'],
                "TABLE_NAME": ['t_profit_center__text', 't_profit_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[0].PROFIT_CENTER_ID, aInputRows[1].PROFIT_CENTER_ID, aInputRows[2].PROFIT_CENTER_ID, aInputRows[3].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "PROFIT_CENTER_DESCRIPTION": [aInputRows[0].PROFIT_CENTER_DESCRIPTION, aInputRows[1].PROFIT_CENTER_DESCRIPTION, aInputRows[2].PROFIT_CENTER_DESCRIPTION, aInputRows[3].PROFIT_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[2].PROFIT_CENTER_ID, aInputRows[3].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "PROFIT_CENTER_DESCRIPTION": [testData.oProfitCenterText.PROFIT_CENTER_DESCRIPTION[2], testData.oProfitCenterText.PROFIT_CENTER_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oProfitCenterText._VALID_FROM[2], testData.oProfitCenterText._VALID_FROM[3]],
                "_SOURCE": [testData.oProfitCenterText._SOURCE[2], testData.oProfitCenterText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{profit_center__text}}
                where PROFIT_CENTER_ID in ('${aInputRows[6].PROFIT_CENTER_ID}', '${aInputRows[7].PROFIT_CENTER_ID}', '${aInputRows[8].PROFIT_CENTER_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oProfitCenterText, [4, 5, 6, 7]), ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}