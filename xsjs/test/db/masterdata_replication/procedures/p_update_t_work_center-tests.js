const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_work_center', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_work_center", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    work_center: {
                        name: "sap.plc.db::basis.t_work_center",
                        data: testData.oWorkCenter
                    },
                    work_center_ext: {
                        name: "sap.plc.db::basis.t_work_center_ext"
                    },
                    cost_center: {
                        name: "sap.plc.db::basis.t_cost_center",
                        data: testData.oCostCenter
                    },
                    controlling_area: {
                        name: "sap.plc.db::basis.t_controlling_area",
                        data: testData.oControllingArea
                    },
                    plant: {
                        name: "sap.plc.db::basis.t_plant",
                        data: testData.oPlant
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
                oMockstarPlc.insertTableData("work_center_ext", testData.oWorkCenterExt);
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

        it('should not create a work center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center_ext");
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }
        });

        it('should create a new work center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aInputRows = [{
                "WORK_CENTER_ID": 'WC4',
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[0],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[0],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[0],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[0],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[0],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[0],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center_ext");
                _.extend(aInputRows[0], {
                    "CWCE_DECIMAL_MANUAL": "44.0000000",
                    "CWCE_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}
                    where WORK_CENTER_ID = '${aInputRows[0].WORK_CENTER_ID}'`);
                expect(aBeforeResultsExt.columns.WORK_CENTER_ID.rows.length).toEqual(0);
            }

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{work_center}}
                where WORK_CENTER_ID = '${aInputRows[0].WORK_CENTER_ID}'`);
            expect(aBeforeResults.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "work_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "WORK_CENTER_CATEGORY": [aInputRows[0].WORK_CENTER_CATEGORY],
                "WORK_CENTER_RESPONSIBLE": [aInputRows[0].WORK_CENTER_RESPONSIBLE],
                "EFFICIENCY": [aInputRows[0].EFFICIENCY],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                "EFFICIENCY", "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "work_center_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID],
                    "PLANT_ID": [aInputRows[0].PLANT_ID],
                    "CWCE_DECIMAL_MANUAL": [aInputRows[0].CWCE_DECIMAL_MANUAL],
                    "CWCE_DECIMAL_UNIT": [aInputRows[0].CWCE_DECIMAL_UNIT]
                }, ["WORK_CENTER_ID", "PLANT_ID", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]);
            }
        });

        it('should update an existing work center', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[4],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[4],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[4],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center_ext");
                _.extend(aInputRows[0], {
                    "CWCE_DECIMAL_MANUAL": "33.3300000",
                    "CWCE_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}
                    where WORK_CENTER_ID = '${aInputRows[0].WORK_CENTER_ID}'
                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(aBeforeResultsExt.columns.WORK_CENTER_ID.rows.length).toEqual(0);
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center}}
                where WORK_CENTER_ID = '${aInputRows[0].WORK_CENTER_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.WORK_CENTER_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "work_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center}}
                where WORK_CENTER_ID = '${aInputRows[0].WORK_CENTER_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "WORK_CENTER_CATEGORY": [aInputRows[0].WORK_CENTER_CATEGORY],
                "WORK_CENTER_RESPONSIBLE": [aInputRows[0].WORK_CENTER_RESPONSIBLE],
                "EFFICIENCY": [aInputRows[0].EFFICIENCY],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                "EFFICIENCY", "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center}}
                where WORK_CENTER_ID = '${aInputRows[0].WORK_CENTER_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "WORK_CENTER_CATEGORY": [aInputRows[0].WORK_CENTER_CATEGORY],
                "WORK_CENTER_RESPONSIBLE": [aInputRows[0].WORK_CENTER_RESPONSIBLE],
                "EFFICIENCY": [aInputRows[0].EFFICIENCY],
                "_VALID_FROM": [testData.oWorkCenter._VALID_FROM[4]],
                "_SOURCE": [testData.oWorkCenter._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                "EFFICIENCY", "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "work_center_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}
                    where WORK_CENTER_ID = '${aInputRows[0].WORK_CENTER_ID}'
                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID],
                    "PLANT_ID": [aInputRows[0].PLANT_ID],
                    "CWCE_DECIMAL_MANUAL": [aInputRows[0].CWCE_DECIMAL_MANUAL],
                    "CWCE_DECIMAL_UNIT": [aInputRows[0].CWCE_DECIMAL_UNIT]
                }, ["WORK_CENTER_ID", "PLANT_ID", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]);
            }
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[4],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[4],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[4],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[4],
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[4],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[4],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[4],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center_ext");
                _.extend(aInputRows[0], {
                    "CWCE_DECIMAL_MANUAL": testData.oWorkCenterExt.CWCE_DECIMAL_MANUAL[4],
                    "CWCE_DECIMAL_UNIT": testData.oWorkCenterExt.CWCE_DECIMAL_UNIT[4]
                });
                _.extend(aInputRows[1], {
                    "CWCE_DECIMAL_MANUAL": testData.oWorkCenterExt.CWCE_DECIMAL_MANUAL[4],
                    "CWCE_DECIMAL_UNIT": testData.oWorkCenterExt.CWCE_DECIMAL_UNIT[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[3],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[3],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[3],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[3],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[3],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[3],
                "_SOURCE": testData.oWorkCenter._SOURCE[3]
            }, {
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[4],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[4],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[4],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[4],
                "_SOURCE": testData.oWorkCenter._SOURCE[4]
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "work_center_ext");
                _.extend(aInputRows[0], {
                    "CWCE_DECIMAL_MANUAL": testData.oWorkCenterExt.CWCE_DECIMAL_MANUAL[3],
                    "CWCE_DECIMAL_UNIT": testData.oWorkCenterExt.CWCE_DECIMAL_UNIT[3]
                });
                _.extend(aInputRows[1], {
                    "CWCE_DECIMAL_MANUAL": testData.oWorkCenterExt.CWCE_DECIMAL_MANUAL[4],
                    "CWCE_DECIMAL_UNIT": testData.oWorkCenterExt.CWCE_DECIMAL_UNIT[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.WORK_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update a work center if cost center does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "COST_CENTER_ID": '1111',
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[4],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[4],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[4],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CWCE_DECIMAL_MANUAL": "33.3300000",
                    "CWCE_DECIMAL_UNIT": testData.oWorkCenterExt.CWCE_DECIMAL_UNIT[4]
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COST_CENTER_ID'],
                "FIELD_VALUE": [aInputRows[0].COST_CENTER_ID],
                "MESSAGE_TEXT": ['Unknown Cost Center ID for Work Center ID '.concat(aInputRows[0].WORK_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_work_center']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update a work center if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": '1111',
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[4],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[4],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CWCE_DECIMAL_MANUAL": "33.3300000",
                    "CWCE_DECIMAL_UNIT": testData.oWorkCenterExt.CWCE_DECIMAL_UNIT[4]
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
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
                "MESSAGE_TEXT": ['Unknown Controlling Area ID for Work Center ID '.concat(aInputRows[0].WORK_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_work_center']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update a work center if plant does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": '1111',
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[4],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[4],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[4],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CWCE_DECIMAL_MANUAL": "33.3300000",
                    "CWCE_DECIMAL_UNIT": testData.oWorkCenterExt.CWCE_DECIMAL_UNIT[4]
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID'],
                "FIELD_VALUE": [aInputRows[0].PLANT_ID],
                "MESSAGE_TEXT": ['Unknown Plant ID for Work Center ID '.concat(aInputRows[0].WORK_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_work_center']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }
        });

        it('should insert two work centers, update two, add error for three, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "WORK_CENTER_ID": 'WC4',
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[0],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[0],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[0],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[0],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[0],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[0],
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": 'WC5',
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[0],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[0],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[0],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[0],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[0],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[0],
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[3],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[3],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[3],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[3],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[3],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[3],
                "_SOURCE": 3
            }, {
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[4],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[4],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[4],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[4],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[4],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[4],
                "_SOURCE": 2,
            }, {
                "WORK_CENTER_ID": 'WC6',
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[0],
                "COST_CENTER_ID": '1111',
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[0],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[0],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[0],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[0],
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": 'WC6',
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[0],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[0],
                "CONTROLLING_AREA_ID": '1111',
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[0],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[0],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[0],
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": 'WC6',
                "PLANT_ID": '1111',
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[0],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[0],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[0],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[0],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[0],
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": 'WC7',
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[0],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[0],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[0],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[0],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[0],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[0],
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": 'WC7',
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[0],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[0],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[0],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[0],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[0],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[0],
                "_SOURCE": 2
            }, {
                "WORK_CENTER_ID": testData.oWorkCenter.WORK_CENTER_ID[1],
                "PLANT_ID": testData.oWorkCenter.PLANT_ID[1],
                "COST_CENTER_ID": testData.oWorkCenter.COST_CENTER_ID[1],
                "CONTROLLING_AREA_ID": testData.oWorkCenter.CONTROLLING_AREA_ID[1],
                "WORK_CENTER_CATEGORY": testData.oWorkCenter.WORK_CENTER_CATEGORY[1],
                "WORK_CENTER_RESPONSIBLE": testData.oWorkCenter.WORK_CENTER_RESPONSIBLE[1],
                "EFFICIENCY": testData.oWorkCenter.EFFICIENCY[1],
                "_SOURCE": testData.oWorkCenter._SOURCE[1],
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CWCE_DECIMAL_MANUAL": "44.0000000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[1], {
                    "CWCE_DECIMAL_MANUAL": "55.0000000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[2], {
                    "CWCE_DECIMAL_MANUAL": "22.2200000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[3], {
                    "CWCE_DECIMAL_MANUAL": "33.3300000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[4], {
                    "CWCE_DECIMAL_MANUAL": "66.6600000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[5], {
                    "CWCE_DECIMAL_MANUAL": "66.6600000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[6], {
                    "CWCE_DECIMAL_MANUAL": "66.6600000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[7], {
                    "CWCE_DECIMAL_MANUAL": "77.7700000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[8], {
                    "CWCE_DECIMAL_MANUAL": "77.7700000",
                    "CWCE_DECIMAL_UNIT": null
                });
                _.extend(aInputRows[9], {
                    "CWCE_DECIMAL_MANUAL": testData.oWorkCenterExt.CWCE_DECIMAL_MANUAL[1],
                    "CWCE_DECIMAL_UNIT": testData.oWorkCenterExt.CWCE_DECIMAL_UNIT[1],
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{work_center}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oWorkCenter, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "work_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COST_CENTER_ID', 'CONTROLLING_AREA_ID', 'PLANT_ID'],
                "FIELD_VALUE": [aInputRows[4].COST_CENTER_ID, aInputRows[5].CONTROLLING_AREA_ID, aInputRows[6].PLANT_ID],
                "MESSAGE_TEXT": ['Unknown Cost Center ID for Work Center ID '.concat(aInputRows[4].WORK_CENTER_ID)
                , 'Unknown Controlling Area ID for Work Center ID '.concat(aInputRows[5].WORK_CENTER_ID),
                 'Unknown Plant ID for Work Center ID '.concat(aInputRows[6].WORK_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR', 'ERROR', 'ERROR'],
                "TABLE_NAME": ['t_work_center', 't_work_center', 't_work_center']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID, aInputRows[1].WORK_CENTER_ID, aInputRows[2].WORK_CENTER_ID, aInputRows[3].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID, aInputRows[1].COST_CENTER_ID, aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "WORK_CENTER_CATEGORY": [aInputRows[0].WORK_CENTER_CATEGORY, aInputRows[1].WORK_CENTER_CATEGORY, aInputRows[2].WORK_CENTER_CATEGORY, aInputRows[3].WORK_CENTER_CATEGORY],
                "WORK_CENTER_RESPONSIBLE": [aInputRows[0].WORK_CENTER_RESPONSIBLE, aInputRows[1].WORK_CENTER_RESPONSIBLE, aInputRows[2].WORK_CENTER_RESPONSIBLE, aInputRows[3].WORK_CENTER_RESPONSIBLE],
                "EFFICIENCY": [aInputRows[0].EFFICIENCY, aInputRows[1].EFFICIENCY, aInputRows[2].EFFICIENCY, aInputRows[3].EFFICIENCY],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                "EFFICIENCY", "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{work_center}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "WORK_CENTER_ID": [aInputRows[2].WORK_CENTER_ID, aInputRows[3].WORK_CENTER_ID],
                "PLANT_ID": [aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "COST_CENTER_ID": [aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "WORK_CENTER_CATEGORY": [aInputRows[2].WORK_CENTER_CATEGORY, aInputRows[3].WORK_CENTER_CATEGORY],
                "WORK_CENTER_RESPONSIBLE": [aInputRows[2].WORK_CENTER_RESPONSIBLE, aInputRows[3].WORK_CENTER_RESPONSIBLE],
                "EFFICIENCY": [aInputRows[2].EFFICIENCY, aInputRows[3].EFFICIENCY],
                "_VALID_FROM": [testData.oWorkCenter._VALID_FROM[3], testData.oWorkCenter._VALID_FROM[4]],
                "_SOURCE": [testData.oWorkCenter._SOURCE[3], testData.oWorkCenter._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                "EFFICIENCY", "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{work_center}}
                where WORK_CENTER_ID in ('${aInputRows[7].WORK_CENTER_ID}', '${aInputRows[8].WORK_CENTER_ID}', '${aInputRows[9].WORK_CENTER_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oWorkCenter, [0, 1]), ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID",
                    "CONTROLLING_AREA_ID", "WORK_CENTER_CATEGORY", "WORK_CENTER_RESPONSIBLE",
                    "EFFICIENCY", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 9, "work_center_ext");
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}
                    where _VALID_FROM < '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oWorkCenterExt, ["WORK_CENTER_ID", "PLANT_ID", "_VALID_FROM", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]
                );
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{work_center_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "WORK_CENTER_ID": [aInputRows[0].WORK_CENTER_ID, aInputRows[1].WORK_CENTER_ID, aInputRows[2].WORK_CENTER_ID, aInputRows[3].WORK_CENTER_ID],
                    "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                    "CWCE_DECIMAL_MANUAL": [aInputRows[0].CWCE_DECIMAL_MANUAL, aInputRows[1].CWCE_DECIMAL_MANUAL, aInputRows[2].CWCE_DECIMAL_MANUAL, aInputRows[3].CWCE_DECIMAL_MANUAL],
                    "CWCE_DECIMAL_UNIT": [aInputRows[0].CWCE_DECIMAL_UNIT, aInputRows[1].CWCE_DECIMAL_UNIT, aInputRows[2].CWCE_DECIMAL_UNIT, aInputRows[3].CWCE_DECIMAL_UNIT],
                }, ["WORK_CENTER_ID", "PLANT_ID", "CWCE_DECIMAL_MANUAL", "CWCE_DECIMAL_UNIT"]);
            }
        });

    }).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}