const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_material_plant', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material_plant", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    material_plant: {
                        name: "sap.plc.db::basis.t_material_plant",
                        data: testData.oMaterialPlant
                    },
                    material_plant_ext: {
                        name: "sap.plc.db::basis.t_material_plant_ext"
                    },
                    material: {
                        name: "sap.plc.db::basis.t_material",
                        data: testData.oMaterial
                    },
                    overhead_group: {
                        name: "sap.plc.db::basis.t_overhead_group",
                        data: testData.oOverheadGroup
                    },
                    valuation_class: {
                        name: "sap.plc.db::basis.t_valuation_class",
                        data: testData.oValuationClass
                    },
                    plant: {
                        name: "sap.plc.db::basis.t_plant",
                        data: testData.oPlant
                    },
                    uom: {
                        name: "sap.plc.db::basis.t_uom",
                        data: testData.oUom
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
                oMockstarPlc.insertTableData("material_plant_ext", testData.oMaterialPlantExt);
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

        it('should not create a material plant', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant");
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant_ext");
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }
        });

        it('should create a new material plant', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4], // 'MAT3'
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[2], // 'PL2'
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant_ext");
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": 44
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}
                    where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                    and PLANT_ID = '${aInputRows[0].PLANT_ID}'`);
                expect(aBeforeResultsExt.columns.MATERIAL_ID.rows.length).toEqual(0);
            }

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and PLANT_ID = '${aInputRows[0].PLANT_ID}'`);
            expect(aBeforeResults.columns.MATERIAL_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_plant");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID],
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "MATERIAL_LOT_SIZE": [aInputRows[0].MATERIAL_LOT_SIZE],
                "MATERIAL_LOT_SIZE_UOM_ID": [aInputRows[0].MATERIAL_LOT_SIZE_UOM_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_plant_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                    "PLANT_ID": [aInputRows[0].PLANT_ID],
                    "CMPL_INTEGER_MANUAL": [aInputRows[0].CMPL_INTEGER_MANUAL]
                }, ["MATERIAL_ID", "PLANT_ID", "CMPL_INTEGER_MANUAL"]);
            }
        });

        it('should update an existing material plant', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant_ext");
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": 33
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}
                    where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                    and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(aBeforeResultsExt.columns.MATERIAL_ID.rows.length).toEqual(0);
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.MATERIAL_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_plant");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID],
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "MATERIAL_LOT_SIZE": [aInputRows[0].MATERIAL_LOT_SIZE],
                "MATERIAL_LOT_SIZE_UOM_ID": [aInputRows[0].MATERIAL_LOT_SIZE_UOM_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID],
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "MATERIAL_LOT_SIZE": [aInputRows[0].MATERIAL_LOT_SIZE],
                "MATERIAL_LOT_SIZE_UOM_ID": [aInputRows[0].MATERIAL_LOT_SIZE_UOM_ID],
                "_VALID_FROM": [testData.oMaterialPlant._VALID_FROM[4]],
                "_SOURCE": [testData.oMaterialPlant._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_plant_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}
                    where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                    and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                    "PLANT_ID": [aInputRows[0].PLANT_ID],
                    "CMPL_INTEGER_MANUAL": [aInputRows[0].CMPL_INTEGER_MANUAL]
                }, ["MATERIAL_ID", "PLANT_ID", "CMPL_INTEGER_MANUAL"]);
            }
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant_ext");
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": testData.oMaterialPlantExt.CMPL_INTEGER_MANUAL[4]               
                });
                _.extend(aInputRows[1], {
                    "CMPL_INTEGER_MANUAL": testData.oMaterialPlantExt.CMPL_INTEGER_MANUAL[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[3],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[3],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[3],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[3],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[3],
                "_SOURCE": testData.oMaterialPlant._SOURCE[3]
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": testData.oMaterialPlant._SOURCE[4]
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant_ext");
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": testData.oMaterialPlantExt.CMPL_INTEGER_MANUAL[3]
                });
                _.extend(aInputRows[1], {
                    "CMPL_INTEGER_MANUAL": testData.oMaterialPlantExt.CMPL_INTEGER_MANUAL[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }
        });

        it('should not update a material plant if overhead group does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": '1111',
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": 33
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['OVERHEAD_GROUP_ID'],
                "FIELD_VALUE": [aInputRows[0].OVERHEAD_GROUP_ID ],
                "MESSAGE_TEXT": ['Unknown Overhead Group ID for Plant ID '.concat(aInputRows[0].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_plant']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }
        });

        it('should not update a material plant if valuation class does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": '1111',
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": 33
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['VALUATION_CLASS_ID'],
                "FIELD_VALUE": [aInputRows[0].VALUATION_CLASS_ID],
                "MESSAGE_TEXT": ['Unknown Valuation Class ID for Plant ID '.concat(aInputRows[0].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_plant']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }
        });

        it('should not update a material plant if unit of measure does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": '111',
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": 33
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['MATERIAL_LOT_SIZE_UOM_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_LOT_SIZE_UOM_ID],
                "MESSAGE_TEXT": ['Unknown Material Lot UOM ID for Plant ID '.concat(aInputRows[0].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_plant']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }
        });

        it('should not update a material plant if plant does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": '2222',
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": 33
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
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
                "MESSAGE_TEXT": ['Unknown Plant ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_plant']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }
        });

        it('should not update a material plant if material does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": '3333',
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": 33
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['MATERIAL_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_ID],
                "MESSAGE_TEXT": ['Unknown Material ID for Plant ID '.concat(aInputRows[0].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_plant']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }
        });

        it('should insert two material plants, update two, add error for three, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4], // 'MAT3'
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[2], // 'PL2'
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[3], // 'MAT2'
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[0], // 'PL1'
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[3],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[3],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[3],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[3],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[3],
                "_SOURCE": 3
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[4],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[4],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[4],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[4],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],
                "_SOURCE": 2,
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[0],
                "OVERHEAD_GROUP_ID": '1111',
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[0],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": '2222',
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[0],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": '333',
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[0],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[0],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[1],
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[1],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[1],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[1],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[1],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[1],
                "_SOURCE": testData.oMaterialPlant._SOURCE[1],
            }, {
                "MATERIAL_ID": testData.oMaterialPlant.MATERIAL_ID[0],
                "PLANT_ID": '4444',
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": '5555',
                "PLANT_ID": testData.oMaterialPlant.PLANT_ID[0],
                "OVERHEAD_GROUP_ID": testData.oMaterialPlant.OVERHEAD_GROUP_ID[0],
                "VALUATION_CLASS_ID": testData.oMaterialPlant.VALUATION_CLASS_ID[0],
                "MATERIAL_LOT_SIZE": testData.oMaterialPlant.MATERIAL_LOT_SIZE[0],
                "MATERIAL_LOT_SIZE_UOM_ID": testData.oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPL_INTEGER_MANUAL": 44
                });
                _.extend(aInputRows[1], {
                    "CMPL_INTEGER_MANUAL": 55
                });
                _.extend(aInputRows[2], {
                    "CMPL_INTEGER_MANUAL": 222
                });
                _.extend(aInputRows[3], {
                    "CMPL_INTEGER_MANUAL": 333
                });
                _.extend(aInputRows[4], {
                    "CMPL_INTEGER_MANUAL": 66
                });
                _.extend(aInputRows[5], {
                    "CMPL_INTEGER_MANUAL": 66
                });
                _.extend(aInputRows[6], {
                    "CMPL_INTEGER_MANUAL": 66
                });
                _.extend(aInputRows[7], {
                    "CMPL_INTEGER_MANUAL": 77
                });
                _.extend(aInputRows[8], {
                    "CMPL_INTEGER_MANUAL": 77
                });
                _.extend(aInputRows[9], {
                    "CMPL_INTEGER_MANUAL": testData.oMaterialPlantExt.CMPL_INTEGER_MANUAL[1]
                });
                _.extend(aInputRows[10], {
                    "CMPL_INTEGER_MANUAL": 88
                });
                _.extend(aInputRows[11], {
                    "CMPL_INTEGER_MANUAL": 88
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_plant}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPlant, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_plant");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID', 'MATERIAL_ID', 'OVERHEAD_GROUP_ID', 'VALUATION_CLASS_ID', 'MATERIAL_LOT_SIZE_UOM_ID'],
                "FIELD_VALUE": [aInputRows[10].PLANT_ID, aInputRows[11].MATERIAL_ID, aInputRows[4].OVERHEAD_GROUP_ID , aInputRows[5].VALUATION_CLASS_ID, aInputRows[6].MATERIAL_LOT_SIZE_UOM_ID],
                "MESSAGE_TEXT": ['Unknown Plant ID for Material ID '.concat(aInputRows[10].MATERIAL_ID),
                 'Unknown Material ID for Plant ID '.concat(aInputRows[11].PLANT_ID),
                  'Unknown Overhead Group ID for Plant ID '.concat(aInputRows[4].PLANT_ID),
                   'Unknown Valuation Class ID for Plant ID '.concat(aInputRows[5].PLANT_ID),
                    'Unknown Material Lot UOM ID for Plant ID '.concat(aInputRows[6].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR'],
                "TABLE_NAME": ['t_material_plant', 't_material_plant', 't_material_plant', 't_material_plant', 't_material_plant']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID, aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "OVERHEAD_GROUP_ID": [aInputRows[0].OVERHEAD_GROUP_ID, aInputRows[1].OVERHEAD_GROUP_ID, aInputRows[2].OVERHEAD_GROUP_ID, aInputRows[3].OVERHEAD_GROUP_ID],
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID, aInputRows[1].VALUATION_CLASS_ID, aInputRows[2].VALUATION_CLASS_ID, aInputRows[3].VALUATION_CLASS_ID],
                "MATERIAL_LOT_SIZE": [aInputRows[0].MATERIAL_LOT_SIZE, aInputRows[1].MATERIAL_LOT_SIZE, aInputRows[2].MATERIAL_LOT_SIZE, aInputRows[3].MATERIAL_LOT_SIZE],
                "MATERIAL_LOT_SIZE_UOM_ID": [aInputRows[0].MATERIAL_LOT_SIZE_UOM_ID, aInputRows[1].MATERIAL_LOT_SIZE_UOM_ID, aInputRows[2].MATERIAL_LOT_SIZE_UOM_ID, aInputRows[3].MATERIAL_LOT_SIZE_UOM_ID],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "MATERIAL_ID": [aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                "PLANT_ID": [aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "OVERHEAD_GROUP_ID": [aInputRows[2].OVERHEAD_GROUP_ID, aInputRows[3].OVERHEAD_GROUP_ID],
                "VALUATION_CLASS_ID": [aInputRows[2].VALUATION_CLASS_ID, aInputRows[3].VALUATION_CLASS_ID],
                "MATERIAL_LOT_SIZE": [aInputRows[2].MATERIAL_LOT_SIZE, aInputRows[3].MATERIAL_LOT_SIZE],
                "MATERIAL_LOT_SIZE_UOM_ID": [aInputRows[2].MATERIAL_LOT_SIZE_UOM_ID, aInputRows[3].MATERIAL_LOT_SIZE_UOM_ID],
                "_VALID_FROM": [testData.oMaterialPlant._VALID_FROM[3], testData.oMaterialPlant._VALID_FROM[4]],
                "_SOURCE": [testData.oMaterialPlant._SOURCE[3], testData.oMaterialPlant._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material_plant}}
                where MATERIAL_ID in ('${aInputRows[7].MATERIAL_ID}', '${aInputRows[8].MATERIAL_ID}', '${aInputRows[9].MATERIAL_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oMaterialPlant, [0, 1]), ["MATERIAL_ID", "PLANT_ID", "OVERHEAD_GROUP_ID",
                    "VALUATION_CLASS_ID", "MATERIAL_LOT_SIZE", "MATERIAL_LOT_SIZE_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_plant_ext");
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}
                    where _VALID_FROM < '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPlantExt, ["MATERIAL_ID", "PLANT_ID", "_VALID_FROM", "CMPL_INTEGER_MANUAL"]
                );
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_plant_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID, aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                    "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                    "CMPL_INTEGER_MANUAL": [aInputRows[0].CMPL_INTEGER_MANUAL, aInputRows[1].CMPL_INTEGER_MANUAL, aInputRows[2].CMPL_INTEGER_MANUAL, aInputRows[3].CMPL_INTEGER_MANUAL]
                }, ["MATERIAL_ID", "PLANT_ID", "CMPL_INTEGER_MANUAL"]);
            }
        });

    }).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}