const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_account', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_account", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    account: {
                        name: "sap.plc.db::basis.t_account",
                        data: testData.oAccount
                    },
                    controlling_area: {
                        name: "sap.plc.db::basis.t_controlling_area",
                        data: testData.oControllingArea
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

        it('should not create an account', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccount, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new account', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aInputRows = [{
                "ACCOUNT_ID": 'C4',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{account}}
                where ACCOUNT_ID = '${aInputRows[0].ACCOUNT_ID}'`);
            expect(aBeforeResults.columns.ACCOUNT_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "account");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACCOUNT_ID.rows.length).toEqual(0);
        });

        it('should update an existing account', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{account}}
                where ACCOUNT_ID = '${aInputRows[0].ACCOUNT_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.ACCOUNT_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "account");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account}}
                where ACCOUNT_ID = '${aInputRows[0].ACCOUNT_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account}}
                where ACCOUNT_ID = '${aInputRows[0].ACCOUNT_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_FROM": [testData.oAccount._VALID_FROM[4]],
                "_SOURCE": [testData.oAccount._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }, {
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccount, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[3],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[3],
                "_SOURCE": testData.oAccount._SOURCE[3],
            }, {
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "_SOURCE": testData.oAccount._SOURCE[4],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.ACCOUNT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccount, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update an account if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": '1111',
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{account}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oAccount, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[0].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Account ID '.concat(aInputRows[0].ACCOUNT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_account']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{account}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oAccount, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two accounts, update two, add error for one, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "ACCOUNT_ID": 'C4',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": 'C5',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[3],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[3],
                "_SOURCE": 3,
            }, {
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[4],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }, {
                "ACCOUNT_ID": 'C6',
                "CONTROLLING_AREA_ID": '1111',
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": 'C7',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": 'C7',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "ACCOUNT_ID": testData.oAccount.ACCOUNT_ID[1],
                "CONTROLLING_AREA_ID": testData.oAccount.CONTROLLING_AREA_ID[1],
                "_SOURCE": testData.oAccount._SOURCE[1],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{account}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oAccount, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "account");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[4].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Account ID '.concat(aInputRows[4].ACCOUNT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_account']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID, aInputRows[1].ACCOUNT_ID, aInputRows[2].ACCOUNT_ID, aInputRows[3].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{account}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "ACCOUNT_ID": [aInputRows[2].ACCOUNT_ID, aInputRows[3].ACCOUNT_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "_VALID_FROM": [testData.oAccount._VALID_FROM[3], testData.oAccount._VALID_FROM[4]],
                "_SOURCE": [testData.oAccount._SOURCE[3], testData.oAccount._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{account}}
                where ACCOUNT_ID in ('${aInputRows[5].ACCOUNT_ID}', '${aInputRows[6].ACCOUNT_ID}', '${aInputRows[7].ACCOUNT_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oAccount, [0, 1]), ["ACCOUNT_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}