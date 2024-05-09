const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_valuation_class', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_valuation_class", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    valuation_class: {
                        name: "sap.plc.db::basis.t_valuation_class",
                        data: testData.oValuationClass
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

        it('should not create a valuation_class', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{valuation_class}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oValuationClass, ["VALUATION_CLASS_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new valuation_class', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aInputRows = [{
                "VALUATION_CLASS_ID": 'V4',
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}'`);
            expect(aBeforeResults.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "valuation_class");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["VALUATION_CLASS_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);
        });

        it('should update an existing valuation_class', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "_SOURCE": 2,
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.VALUATION_CLASS_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "valuation_class");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["VALUATION_CLASS_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "_VALID_FROM": [testData.oValuationClass._VALID_FROM[4]],
                "_SOURCE": [testData.oValuationClass._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["VALUATION_CLASS_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "_SOURCE": 2,
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "_SOURCE": 2,
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{valuation_class}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oValuationClass, ["VALUATION_CLASS_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[3],
                "_SOURCE": testData.oValuationClass._SOURCE[3],
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "_SOURCE": testData.oValuationClass._SOURCE[4],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{valuation_class}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oValuationClass, ["VALUATION_CLASS_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two valuation_classes, update two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "VALUATION_CLASS_ID": 'V4',
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": 'V5',
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[3],
                "_SOURCE": 3,
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "_SOURCE": 2,
            }, {
                "VALUATION_CLASS_ID": 'V7',
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": 'V7',
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[1],
                "_SOURCE": testData.oValuationClass._SOURCE[1],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{valuation_class}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oValuationClass, ["VALUATION_CLASS_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "valuation_class");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID, aInputRows[1].VALUATION_CLASS_ID, aInputRows[2].VALUATION_CLASS_ID, aInputRows[3].VALUATION_CLASS_ID],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["VALUATION_CLASS_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[2].VALUATION_CLASS_ID, aInputRows[3].VALUATION_CLASS_ID],
                "_VALID_FROM": [testData.oValuationClass._VALID_FROM[3], testData.oValuationClass._VALID_FROM[4]],
                "_SOURCE": [testData.oValuationClass._SOURCE[3], testData.oValuationClass._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["VALUATION_CLASS_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{valuation_class}}
                where VALUATION_CLASS_ID in ('${aInputRows[4].VALUATION_CLASS_ID}', '${aInputRows[5].VALUATION_CLASS_ID}', '${aInputRows[6].VALUATION_CLASS_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oValuationClass, [0, 1]), ["VALUATION_CLASS_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}