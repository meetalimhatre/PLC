const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_cost_center', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_cost_center", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    cost_center: {
                        name: "sap.plc.db::basis.t_cost_center",
                        data: testData.oCostCenter
                    },
                    cost_center_ext: {
                        name: "sap.plc.db::basis.t_cost_center_ext"
                    },
                    controlling_area: {
                        name: "sap.plc.db::basis.t_controlling_area",
                        data: testData.oControllingArea
                    },
                    metadata: {
                        name: "sap.plc.db::basis.t_metadata"
                    },
                    metadata_attributes: {
                        name: "sap.plc.db::basis.t_metadata_item_attributes"
                    },
                    error: {
                        name: "sap.plc.db::map.t_replication_log",
                        data: testData.oError
                    }
                }
            });
        });

        afterOnce(function() {
            oMockstarPlc.cleanup(); // clean up all test artefacts
        });

        beforeEach(function() {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                oMockstarPlc.insertTableData("cost_center_ext", testData.oCostCenterExt);
            }
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

        it('should not create a cost center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center_ext");
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenter, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oCostCenterExt, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "CCEN_DATE_MANUAL"]
                );
            }
        });

        it('should create a new cost center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aInputRows = [{
                "COST_CENTER_ID": 'CCC4',
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center_ext");
                _.extend(aInputRows[0], {
                    "CCEN_DATE_MANUAL": '2015-04-04T00:00:00.000Z'
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}
                    where COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'`);
                expect(aBeforeResultsExt.columns.COST_CENTER_ID.rows.length).toEqual(0);
            }

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'`);
            expect(aBeforeResults.columns.COST_CENTER_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "cost_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.COST_CENTER_ID.rows.length).toEqual(0);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "cost_center_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                    "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                    "CCEN_DATE_MANUAL": [aInputRows[0].CCEN_DATE_MANUAL]
                }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "CCEN_DATE_MANUAL"]);
            }
        });

        it('should update an existing cost center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center_ext");
                _.extend(aInputRows[0], {
                    "CCEN_DATE_MANUAL": '2015-03-31T00:00:00.000Z'
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}
                    where COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'
                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(aBeforeResultsExt.columns.COST_CENTER_ID.rows.length).toEqual(0);
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.COST_CENTER_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "cost_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "_VALID_FROM": [testData.oCostCenter._VALID_FROM[4]],
                "_SOURCE": [testData.oCostCenter._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "cost_center_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}
                    where COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'
                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                    "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                    "CCEN_DATE_MANUAL": [aInputRows[0].CCEN_DATE_MANUAL]
                }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "CCEN_DATE_MANUAL"]);
            }
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center_ext");
                _.extend(aInputRows[0], {
                    "CCEN_DATE_MANUAL": testData.oCostCenterExt.CCEN_DATE_MANUAL[4]
                });
                _.extend(aInputRows[1], {
                    "CCEN_DATE_MANUAL": testData.oCostCenterExt.CCEN_DATE_MANUAL[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenter, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oCostCenterExt, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "CCEN_DATE_MANUAL"]
                );
            }
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[3],
                "_SOURCE": testData.oCostCenter._SOURCE[3]
            }, {
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": testData.oCostCenter._SOURCE[4]
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center_ext");
                _.extend(aInputRows[0], {
                    "CCEN_DATE_MANUAL": testData.oCostCenterExt.CCEN_DATE_MANUAL[3]
                });
                _.extend(aInputRows[1], {
                    "CCEN_DATE_MANUAL": testData.oCostCenterExt.CCEN_DATE_MANUAL[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenter, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oCostCenterExt, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "CCEN_DATE_MANUAL"]
                );
            }
        });

        it('should not update a cost center if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": '1111',
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CCEN_DATE_MANUAL": '2015-03-31T00:00:00.000Z'
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oCostCenterExt, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "CCEN_DATE_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{cost_center}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oCostCenter, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[0].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Cost Center ID '.concat(aInputRows[0].COST_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_cost_center']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenter, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oCostCenterExt, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "CCEN_DATE_MANUAL"]
                );
            }
        });

        it('should insert two cost centers, update two, add error for one, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "COST_CENTER_ID": 'CCC4',
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": 'CCC5',
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[3],
                "_SOURCE": 3
            }, {
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "_SOURCE": 2,
            }, {
                "COST_CENTER_ID": 'CCC6',
                "CONTROLLING_AREA_ID": '1111',
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": 'CCC7',
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": 'CCC7',
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[0],
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[1],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[1],
                "_SOURCE": testData.oCostCenter._SOURCE[1],
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CCEN_DATE_MANUAL": '2015-04-04T00:00:00.000Z'
                });
                _.extend(aInputRows[1], {
                    "CCEN_DATE_MANUAL": '2015-05-05T00:00:00.000Z'
                });
                _.extend(aInputRows[2], {
                    "CCEN_DATE_MANUAL": '2015-02-22T00:00:00.000Z'
                });
                _.extend(aInputRows[3], {
                    "CCEN_DATE_MANUAL": '2015-03-31T00:00:00.000Z'
                });
                _.extend(aInputRows[4], {
                    "CCEN_DATE_MANUAL": '2015-06-06T00:00:00.000Z'
                });
                _.extend(aInputRows[5], {
                    "CCEN_DATE_MANUAL": '2015-07-07T00:00:00.000Z'
                });
                _.extend(aInputRows[6], {
                    "CCEN_DATE_MANUAL": '2015-07-07T00:00:00.000Z'
                });
                _.extend(aInputRows[7], {
                    "CCEN_DATE_MANUAL": testData.oCostCenterExt.CCEN_DATE_MANUAL[1]
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oCostCenterExt, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "CCEN_DATE_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{cost_center}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oCostCenter, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "cost_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[4].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Cost Center ID '.concat(aInputRows[4].COST_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_cost_center']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID, aInputRows[1].COST_CENTER_ID, aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "COST_CENTER_ID": [aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "_VALID_FROM": [testData.oCostCenter._VALID_FROM[3], testData.oCostCenter._VALID_FROM[4]],
                "_SOURCE": [testData.oCostCenter._SOURCE[3], testData.oCostCenter._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{cost_center}}
                where COST_CENTER_ID in ('${aInputRows[5].COST_CENTER_ID}', '${aInputRows[6].COST_CENTER_ID}', '${aInputRows[7].COST_CENTER_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oCostCenter, [0, 1]), ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 9, "cost_center_ext");
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}
                    where _VALID_FROM < '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oCostCenterExt, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM", "CCEN_DATE_MANUAL"]
                );
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{cost_center_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID, aInputRows[1].COST_CENTER_ID, aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                    "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                    "CCEN_DATE_MANUAL": [aInputRows[0].CCEN_DATE_MANUAL, aInputRows[1].CCEN_DATE_MANUAL, aInputRows[2].CCEN_DATE_MANUAL, aInputRows[3].CCEN_DATE_MANUAL],
                }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "CCEN_DATE_MANUAL"]);
            }
        });

    }).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}