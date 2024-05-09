const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_profit_center', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_profit_center", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    profit_center: {
                        name: "sap.plc.db::basis.t_profit_center",
                        data: testData.oProfitCenter
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

        it('should not create a profit_center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenter, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new profit_center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aInputRows = [{
                "PROFIT_CENTER_ID": 'P4',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where PROFIT_CENTER_ID = '${aInputRows[0].PROFIT_CENTER_ID}'`);
            expect(aBeforeResults.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "profit_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[0].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);
        });

        it('should update an existing profit_center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where PROFIT_CENTER_ID = '${aInputRows[0].PROFIT_CENTER_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.PROFIT_CENTER_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "profit_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where PROFIT_CENTER_ID = '${aInputRows[0].PROFIT_CENTER_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[0].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where PROFIT_CENTER_ID = '${aInputRows[0].PROFIT_CENTER_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[0].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_FROM": [testData.oProfitCenter._VALID_FROM[4]],
                "_SOURCE": [testData.oProfitCenter._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenter, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profit_center");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[3],
                "_SOURCE": testData.oProfitCenter._SOURCE[3],
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": testData.oProfitCenter._SOURCE[4],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PROFIT_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenter, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a profit_center if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": '1111',
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{profit_center}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oProfitCenter, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[0].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Profit Center ID '.concat(aInputRows[0].PROFIT_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_profit_center']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{profit_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oProfitCenter, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two profit_centers, update two, add error for one, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PROFIT_CENTER_ID": 'P4',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": 'P5',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[3],
                "_SOURCE": 3,
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }, {
                "PROFIT_CENTER_ID": 'P6',
                "CONTROLLING_AREA_ID": '1111',
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": 'P7',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": 'P7',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "PROFIT_CENTER_ID": testData.oProfitCenter.PROFIT_CENTER_ID[1],
                "CONTROLLING_AREA_ID": testData.oProfitCenter.CONTROLLING_AREA_ID[1],
                "_SOURCE": testData.oProfitCenter._SOURCE[1],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{profit_center}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oProfitCenter, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "profit_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[4].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Profit Center ID '.concat(aInputRows[4].PROFIT_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_profit_center']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[0].PROFIT_CENTER_ID, aInputRows[1].PROFIT_CENTER_ID, aInputRows[2].PROFIT_CENTER_ID, aInputRows[3].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PROFIT_CENTER_ID": [aInputRows[2].PROFIT_CENTER_ID, aInputRows[3].PROFIT_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "_VALID_FROM": [testData.oProfitCenter._VALID_FROM[3], testData.oProfitCenter._VALID_FROM[4]],
                "_SOURCE": [testData.oProfitCenter._SOURCE[3], testData.oProfitCenter._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{profit_center}}
                where PROFIT_CENTER_ID in ('${aInputRows[5].PROFIT_CENTER_ID}', '${aInputRows[6].PROFIT_CENTER_ID}', '${aInputRows[7].PROFIT_CENTER_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oProfitCenter, [0, 1]), ["PROFIT_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}