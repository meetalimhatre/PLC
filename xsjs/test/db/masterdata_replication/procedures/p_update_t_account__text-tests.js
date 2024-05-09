const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_account__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_account__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    account: {
                        name: "sap.plc.db::basis.t_account",
                        data: testData.oAccount
                    },
                    account__text: {
                        name: "sap.plc.db::basis.t_account__text",
                        data: testData.oAccountText
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

        it('should not create an account text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "account__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new account text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "account__text");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "ACCOUNT_DESCRIPTION": "Acc C3 DE",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "ACCOUNT_DESCRIPTION": "Acc C3 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{account__text}}
                where ACCOUNT_ID in ('${aInputRows[0].ACCOUNT_ID}', '${aInputRows[1].ACCOUNT_ID}')`);
            expect(aBeforeResults.columns.ACCOUNT_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "account__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID, aInputRows[1].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "ACCOUNT_DESCRIPTION": [aInputRows[0].ACCOUNT_DESCRIPTION, aInputRows[1].ACCOUNT_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACCOUNT_ID.rows.length).toEqual(0);
        });

        it('should update an existing account text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "account__text");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[2],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oAccountText.LANGUAGE[2],
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 DE",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[3],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testData.oAccountText.LANGUAGE[3],
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{account__text}}
                where ACCOUNT_ID in ('${aInputRows[0].ACCOUNT_ID}', '${aInputRows[1].ACCOUNT_ID}')
                and _VALID_TO is null`);
            expect(aBeforeResults.columns.ACCOUNT_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "account__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID, aInputRows[1].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "ACCOUNT_DESCRIPTION": [aInputRows[0].ACCOUNT_DESCRIPTION, aInputRows[1].ACCOUNT_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID, aInputRows[1].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "ACCOUNT_DESCRIPTION": [testData.oAccountText.ACCOUNT_DESCRIPTION[2], testData.oAccountText.ACCOUNT_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oAccountText._VALID_FROM[2], testData.oAccountText._VALID_FROM[3]],
                "_SOURCE": [testData.oAccountText._SOURCE[2], testData.oAccountText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "account__text");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[2],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oAccountText.LANGUAGE[2],
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 DE",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[2],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oAccountText.LANGUAGE[2],
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "account__text");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[6],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oAccountText.LANGUAGE[6],
                "ACCOUNT_DESCRIPTION": testData.oAccountText.ACCOUNT_DESCRIPTION[6],
                "_SOURCE": testData.oAccountText._SOURCE[6],
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[7],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[7],
                "LANGUAGE": testData.oAccountText.LANGUAGE[7],
                "ACCOUNT_DESCRIPTION": testData.oAccountText.ACCOUNT_DESCRIPTION[7],
                "_SOURCE": testData.oAccountText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create an account text if account does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aInputRows = [{
                "ACCOUNT_ID": 'C4',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "ACCOUNT_DESCRIPTION": "Acc C4 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['ACCOUNT_ID'],
                "FIELD_VALUE": [aInputRows[0].ACCOUNT_ID],
                "MESSAGE_TEXT": ['Unknown Account ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_account__text'],
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update an account text if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[2],
                "CONTROLLING_AREA_ID": '1111',
                "LANGUAGE": testData.oAccountText.LANGUAGE[2],
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['ACCOUNT_ID'],
                "FIELD_VALUE": [aInputRows[0].ACCOUNT_ID],
                "MESSAGE_TEXT": ['Unknown Account ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_account__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update an account text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[2],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'AAA',
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_account__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two account texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "ACCOUNT_DESCRIPTION": "Acc C3 DE",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "ACCOUNT_DESCRIPTION": "Acc C3 EN",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[2],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oAccountText.LANGUAGE[2],
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 DE",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[3],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testData.oAccountText.LANGUAGE[3],
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 EN",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": 'C4',
                "CONTROLLING_AREA_ID": '1111',
                "LANGUAGE": testData.oAccountText.LANGUAGE[2],
                "ACCOUNT_DESCRIPTION": "Acc C4 DE",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[2],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'AAA',
                "ACCOUNT_DESCRIPTION": "Updated Acc C1 AAA",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[6],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "ACCOUNT_DESCRIPTION": "Acc C4 FR",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[6],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "ACCOUNT_DESCRIPTION": "Acc C4 FR",
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccountText.ACCOUNT_ID[7],
                "CONTROLLING_AREA_ID": testData.oAccountText.CONTROLLING_AREA_ID[7],
                "LANGUAGE": testData.oAccountText.LANGUAGE[7],
                "ACCOUNT_DESCRIPTION": testData.oAccountText.ACCOUNT_DESCRIPTION[7],
                "_SOURCE": testData.oAccountText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{account__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oAccountText, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "account__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['ACCOUNT_ID' , 'LANGUAGE'],
                "FIELD_VALUE": [aInputRows[4].ACCOUNT_ID, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Account ID for Controlling Area ID '.concat(aInputRows[4].CONTROLLING_AREA_ID), 'Unknown Language'],
                "MESSAGE_TYPE": ['ERROR', 'ERROR'],
                "TABLE_NAME": ['t_account__text', 't_account__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID, aInputRows[1].ACCOUNT_ID, aInputRows[2].ACCOUNT_ID, aInputRows[3].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "ACCOUNT_DESCRIPTION": [aInputRows[0].ACCOUNT_DESCRIPTION, aInputRows[1].ACCOUNT_DESCRIPTION, aInputRows[2].ACCOUNT_DESCRIPTION, aInputRows[3].ACCOUNT_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "ACCOUNT_ID": [aInputRows[2].ACCOUNT_ID, aInputRows[3].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "ACCOUNT_DESCRIPTION": [testData.oAccountText.ACCOUNT_DESCRIPTION[2], testData.oAccountText.ACCOUNT_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oAccountText._VALID_FROM[2], testData.oAccountText._VALID_FROM[3]],
                "_SOURCE": [testData.oAccountText._SOURCE[2], testData.oAccountText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{account__text}}
                where ACCOUNT_ID in ('${aInputRows[6].ACCOUNT_ID}', '${aInputRows[7].ACCOUNT_ID}', '${aInputRows[8].ACCOUNT_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oAccountText, [4, 5, 6, 7]), ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}