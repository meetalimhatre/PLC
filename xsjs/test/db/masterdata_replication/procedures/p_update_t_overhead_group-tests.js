const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_overhead_group', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_overhead_group", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    overhead_group: {
                        name: "sap.plc.db::basis.t_overhead_group",
                        data: testData.oOverheadGroup
                    },
                    plant: {
                        name: "sap.plc.db::basis.t_plant",
                        data: testData.oPlant
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

        it('should not create an overhead_group', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroup, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new overhead_group', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": 'C4',
                "PLANT_ID": testData.oPlant.PLANT_ID[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where OVERHEAD_GROUP_ID = '${aInputRows[0].OVERHEAD_GROUP_ID}'`);
            expect(aBeforeResults.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "overhead_group");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);
        });

        it('should update an existing overhead_group', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "_SOURCE": 2,
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where OVERHEAD_GROUP_ID = '${aInputRows[0].OVERHEAD_GROUP_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "overhead_group");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group}}
			    where OVERHEAD_GROUP_ID = '${aInputRows[0].OVERHEAD_GROUP_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group}}
				where OVERHEAD_GROUP_ID = '${aInputRows[0].OVERHEAD_GROUP_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "_VALID_FROM": [testData.oOverheadGroup._VALID_FROM[4]],
                "_SOURCE": [testData.oOverheadGroup._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "_SOURCE": 2,
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "_SOURCE": 2,
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroup, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overhead_group");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[3],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[3],
                "_SOURCE": testData.oOverheadGroup.OVERHEAD_GROUP_ID[3],
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "_SOURCE": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroup, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update an overhead_group if plant_id does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": 'XX99',
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{overhead_group}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oOverheadGroup, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID'],
                "FIELD_VALUE": [aInputRows[0].PLANT_ID],
                "MESSAGE_TEXT": ['Unknown Plant ID for Overhead Group ID '.concat(aInputRows[0].OVERHEAD_GROUP_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_overhead_group']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{overhead_group}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oOverheadGroup, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two accounts, update two, add error for one, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "OVERHEAD_GROUP_ID": 'O4',
                "PLANT_ID": testData.oPlant.PLANT_ID[0],
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": 'O5',
                "PLANT_ID": testData.oPlant.PLANT_ID[0],
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[3],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[3],
                "_SOURCE": 3,
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[4],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[4],
                "_SOURCE": 2,
            }, {
                "OVERHEAD_GROUP_ID": 'O6',
                "PLANT_ID": 'XX99',
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": 'O7',
                "PLANT_ID": testData.oPlant.PLANT_ID[0],
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": 'O7',
                "PLANT_ID": testData.oPlant.PLANT_ID[0],
                "_SOURCE": 2
            }, {
                "OVERHEAD_GROUP_ID": testData.oOverheadGroup.OVERHEAD_GROUP_ID[1],
                "PLANT_ID": testData.oOverheadGroup.PLANT_ID[1],
                "_SOURCE": testData.oOverheadGroup._SOURCE[1],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{overhead_group}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oOverheadGroup, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "overhead_group");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID'],
                "FIELD_VALUE": [aInputRows[4].PLANT_ID],
                "MESSAGE_TEXT": ['Unknown Plant ID for Overhead Group ID '.concat(aInputRows[4].OVERHEAD_GROUP_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_overhead_group']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID, aInputRows[1].OVERHEAD_GROUP_ID, aInputRows[2].OVERHEAD_GROUP_ID, aInputRows[3].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{overhead_group}}
            	where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "OVERHEAD_GROUP_ID": [aInputRows[2].OVERHEAD_GROUP_ID, aInputRows[3].OVERHEAD_GROUP_ID],
                "PLANT_ID": [aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "_VALID_FROM": [testData.oOverheadGroup._VALID_FROM[3], testData.oOverheadGroup._VALID_FROM[4]],
                "_SOURCE": [testData.oOverheadGroup._SOURCE[3], testData.oOverheadGroup._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{overhead_group}}
                where OVERHEAD_GROUP_ID in ('${aInputRows[5].OVERHEAD_GROUP_ID}', '${aInputRows[6].OVERHEAD_GROUP_ID}', '${aInputRows[7].OVERHEAD_GROUP_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oOverheadGroup, [0, 1]), ["OVERHEAD_GROUP_ID", "PLANT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}