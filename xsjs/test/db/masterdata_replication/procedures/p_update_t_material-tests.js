const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_material', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    material: {
                        name: "sap.plc.db::basis.t_material",
                        data: testData.oMaterial
                    },
                    material_ext: {
                        name: "sap.plc.db::basis.t_material_ext"
                    },
                    material_type: {
                        name: "sap.plc.db::basis.t_material_type",
                        data: testData.oMaterialType
                    },
                    material_group: {
                        name: "sap.plc.db::basis.t_material_group",
                        data: testData.oMaterialGroup
                    },
                    uom: {
                        name: "sap.plc.db::basis.t_uom",
                        data: testData.oUom
                    },
                    error: {
                        name: "sap.plc.db::map.t_replication_log",
                        data: testData.oError
                    },
                    metadata: {
                        name: "sap.plc.db::basis.t_metadata"
                    },
                    metadata_attributes: {
                        name: "sap.plc.db::basis.t_metadata_item_attributes"
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
                oMockstarPlc.insertTableData("material_ext", testData.oMaterialExt);
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

        it('should not create a material', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_ext");
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }
        });

        it('should create a new material', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aInputRows = [{
                "MATERIAL_ID": 'MAT4',
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[0],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[0],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[0],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[0],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[0],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[0],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_ext");
                _.extend(aInputRows[0], {
                    "CMAT_STRING_MANUAL": 'Test String 4'
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}
                    where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'`);
                expect(aBeforeResultsExt.columns.MATERIAL_ID.rows.length).toEqual(0);
            }

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material}}
                where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'`);
            expect(aBeforeResults.columns.MATERIAL_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "BASE_UOM_ID": [aInputRows[0].BASE_UOM_ID],
                "MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID],
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
                "IS_CREATED_VIA_CAD_INTEGRATION": [aInputRows[0].IS_CREATED_VIA_CAD_INTEGRATION],
                "IS_PHANTOM_MATERIAL": [aInputRows[0].IS_PHANTOM_MATERIAL],
                "IS_CONFIGURABLE_MATERIAL": [aInputRows[0].IS_CONFIGURABLE_MATERIAL],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                "IS_CONFIGURABLE_MATERIAL", "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                    "CMAT_STRING_MANUAL": [aInputRows[0].CMAT_STRING_MANUAL]
                }, ["MATERIAL_ID", "CMAT_STRING_MANUAL"]);
            }
        });

        it('should update an existing material', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[4],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[4],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[4],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[4],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[4],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_ext");
                _.extend(aInputRows[0], {
                    "CMAT_STRING_MANUAL": 'Updated String 3'
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}
                    where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(aBeforeResultsExt.columns.MATERIAL_ID.rows.length).toEqual(0);
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material}}
                where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.MATERIAL_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material}}
                where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "BASE_UOM_ID": [aInputRows[0].BASE_UOM_ID],
                "MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID],
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
                "IS_CREATED_VIA_CAD_INTEGRATION": [aInputRows[0].IS_CREATED_VIA_CAD_INTEGRATION],
                "IS_PHANTOM_MATERIAL": [aInputRows[0].IS_PHANTOM_MATERIAL],
                "IS_CONFIGURABLE_MATERIAL": [aInputRows[0].IS_CONFIGURABLE_MATERIAL],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                "IS_CONFIGURABLE_MATERIAL", "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material}}
                where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "BASE_UOM_ID": [aInputRows[0].BASE_UOM_ID],
                "MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID],
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
                "IS_CREATED_VIA_CAD_INTEGRATION": [aInputRows[0].IS_CREATED_VIA_CAD_INTEGRATION],
                "IS_PHANTOM_MATERIAL": [aInputRows[0].IS_PHANTOM_MATERIAL],
                "IS_CONFIGURABLE_MATERIAL": [aInputRows[0].IS_CONFIGURABLE_MATERIAL],
                "_VALID_FROM": [testData.oMaterial._VALID_FROM[4]],
                "_SOURCE": [testData.oMaterial._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_ext}}
                    where MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                    "CMAT_STRING_MANUAL": [aInputRows[0].CMAT_STRING_MANUAL]
                }, ["MATERIAL_ID", "CMAT_STRING_MANUAL"]);
            }
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[4],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[4],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[4],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[4],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[4],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[4],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[4],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[4],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[4],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[4],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[4],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_ext");
                _.extend(aInputRows[0], {
                    "CMAT_STRING_MANUAL": testData.oMaterialExt.CMAT_STRING_MANUAL[4]
                });
                _.extend(aInputRows[1], {
                    "CMAT_STRING_MANUAL": testData.oMaterialExt.CMAT_STRING_MANUAL[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[3],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[3],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[3],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[3],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[3],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[3],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[3],
                "_SOURCE": testData.oMaterial._SOURCE[3]
            }, {
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[4],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[4],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[4],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[4],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[4],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[4],
                "_SOURCE": testData.oMaterial._SOURCE[4]
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_ext");
                _.extend(aInputRows[0], {
                    "CMAT_STRING_MANUAL": testData.oMaterialExt.CMAT_STRING_MANUAL[3]
                });
                _.extend(aInputRows[1], {
                    "CMAT_STRING_MANUAL": testData.oMaterialExt.CMAT_STRING_MANUAL[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }
        });

        it('should not update a material if material group does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[4],
                "MATERIAL_GROUP_ID": '1111',
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[4],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[4],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[4],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMAT_STRING_MANUAL": 'Updated String 3'
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['MATERIAL_GROUP_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_GROUP_ID],
                "MESSAGE_TEXT": ['Unknown Material Group ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }
        });

        it('should not update a material if material type does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[4],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[4],
                "MATERIAL_TYPE_ID": '1111',
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[4],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[4],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMAT_STRING_MANUAL": 'Updated String 3'
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['MATERIAL_TYPE_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_TYPE_ID],
                "MESSAGE_TEXT": ['Unknown Material Type ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }
        });

        it('should not update a material if unit of measure does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "BASE_UOM_ID": '111',
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[4],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[4],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[4],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[4],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMAT_STRING_MANUAL": 'Updated String 3'
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['BASE_UOM_ID'],
                "FIELD_VALUE": [aInputRows[0].BASE_UOM_ID],
                "MESSAGE_TEXT": ['Unknown UOM ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }
        });

        it('should insert two materials, update two, add error for three, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "MATERIAL_ID": 'MAT4',
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[0],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[0],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[0],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[0],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[0],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": 'MAT5',
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[0],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[0],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[0],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[0],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[0],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[3],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[3],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[3],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[3],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[3],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[3],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[3],
                "_SOURCE": 3
            }, {
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[4],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[4],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[4],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[4],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[4],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[4],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[4],
                "_SOURCE": 2,
            }, {
                "MATERIAL_ID": 'MAT6',
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[0],
                "MATERIAL_GROUP_ID": '1111',
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[0],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[0],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[0],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": 'MAT6',
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[0],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[0],
                "MATERIAL_TYPE_ID": '1111',
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[0],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[0],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": 'MAT6',
                "BASE_UOM_ID": '111',
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[0],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[0],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[0],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[0],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": 'MAT7',
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[0],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[0],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[0],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[0],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[0],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": 'MAT7',
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[0],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[0],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[0],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[0],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[0],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[0],
                "_SOURCE": 2
            }, {
                "MATERIAL_ID": testData.oMaterial.MATERIAL_ID[1],
                "BASE_UOM_ID": testData.oMaterial.BASE_UOM_ID[1],
                "MATERIAL_GROUP_ID": testData.oMaterial.MATERIAL_GROUP_ID[1],
                "MATERIAL_TYPE_ID": testData.oMaterial.MATERIAL_TYPE_ID[1],
                "IS_CREATED_VIA_CAD_INTEGRATION": testData.oMaterial.IS_CREATED_VIA_CAD_INTEGRATION[1],
                "IS_PHANTOM_MATERIAL": testData.oMaterial.IS_PHANTOM_MATERIAL[1],
                "IS_CONFIGURABLE_MATERIAL": testData.oMaterial.IS_CONFIGURABLE_MATERIAL[1],
                "_SOURCE": testData.oMaterial._SOURCE[1],
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMAT_STRING_MANUAL": 'Test String 4'
                });
                _.extend(aInputRows[1], {
                    "CMAT_STRING_MANUAL": 'Test String 5'
                });
                _.extend(aInputRows[2], {
                    "CMAT_STRING_MANUAL": 'Updated String 2'
                });
                _.extend(aInputRows[3], {
                    "CMAT_STRING_MANUAL": 'Updated String 3'
                });
                _.extend(aInputRows[4], {
                    "CMAT_STRING_MANUAL": 'Updated String 6'
                });
                _.extend(aInputRows[5], {
                    "CMAT_STRING_MANUAL": 'Updated String 6'
                });
                _.extend(aInputRows[6], {
                    "CMAT_STRING_MANUAL": 'Updated String 6'
                });
                _.extend(aInputRows[7], {
                    "CMAT_STRING_MANUAL": 'Updated String 7'
                });
                _.extend(aInputRows[8], {
                    "CMAT_STRING_MANUAL": 'Updated String 7'
                });
                _.extend(aInputRows[9], {
                    "CMAT_STRING_MANUAL": testData.oMaterialExt.CMAT_STRING_MANUAL[1]
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterial, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['MATERIAL_GROUP_ID', 'MATERIAL_TYPE_ID', 'BASE_UOM_ID'],
                "FIELD_VALUE": [aInputRows[4].MATERIAL_GROUP_ID, aInputRows[5].MATERIAL_TYPE_ID, aInputRows[6].BASE_UOM_ID],
                "MESSAGE_TEXT": ['Unknown Material Group ID for Material ID '.concat(aInputRows[4].MATERIAL_ID), 
                'Unknown Material Type ID for Material ID '.concat(aInputRows[5].MATERIAL_ID), 
                'Unknown UOM ID for Material ID '.concat(aInputRows[6].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR', 'ERROR', 'ERROR'],
                "TABLE_NAME": ['t_material', 't_material', 't_material']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID, aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                "BASE_UOM_ID": [aInputRows[0].BASE_UOM_ID, aInputRows[1].BASE_UOM_ID, aInputRows[2].BASE_UOM_ID, aInputRows[3].BASE_UOM_ID],
                "MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID, aInputRows[1].MATERIAL_GROUP_ID, aInputRows[2].MATERIAL_GROUP_ID, aInputRows[3].MATERIAL_GROUP_ID],
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID, aInputRows[1].MATERIAL_TYPE_ID, aInputRows[2].MATERIAL_TYPE_ID, aInputRows[3].MATERIAL_TYPE_ID],
                "IS_CREATED_VIA_CAD_INTEGRATION": [aInputRows[0].IS_CREATED_VIA_CAD_INTEGRATION, aInputRows[1].IS_CREATED_VIA_CAD_INTEGRATION, aInputRows[2].IS_CREATED_VIA_CAD_INTEGRATION, aInputRows[3].IS_CREATED_VIA_CAD_INTEGRATION],
                "IS_PHANTOM_MATERIAL": [aInputRows[0].IS_PHANTOM_MATERIAL, aInputRows[1].IS_PHANTOM_MATERIAL, aInputRows[2].IS_PHANTOM_MATERIAL, aInputRows[3].IS_PHANTOM_MATERIAL],
                "IS_CONFIGURABLE_MATERIAL": [aInputRows[0].IS_CONFIGURABLE_MATERIAL, aInputRows[1].IS_CONFIGURABLE_MATERIAL, aInputRows[2].IS_CONFIGURABLE_MATERIAL, aInputRows[3].IS_CONFIGURABLE_MATERIAL],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                "IS_CONFIGURABLE_MATERIAL", "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "MATERIAL_ID": [aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                "BASE_UOM_ID": [aInputRows[2].BASE_UOM_ID, aInputRows[3].BASE_UOM_ID],
                "MATERIAL_GROUP_ID": [aInputRows[2].MATERIAL_GROUP_ID, aInputRows[3].MATERIAL_GROUP_ID],
                "MATERIAL_TYPE_ID": [aInputRows[2].MATERIAL_TYPE_ID, aInputRows[3].MATERIAL_TYPE_ID],
                "IS_CREATED_VIA_CAD_INTEGRATION": [aInputRows[2].IS_CREATED_VIA_CAD_INTEGRATION, aInputRows[3].IS_CREATED_VIA_CAD_INTEGRATION],
                "IS_PHANTOM_MATERIAL": [aInputRows[2].IS_PHANTOM_MATERIAL, aInputRows[3].IS_PHANTOM_MATERIAL],
                "IS_CONFIGURABLE_MATERIAL": [aInputRows[2].IS_CONFIGURABLE_MATERIAL, aInputRows[3].IS_CONFIGURABLE_MATERIAL],
                "_VALID_FROM": [testData.oMaterial._VALID_FROM[3], testData.oMaterial._VALID_FROM[4]],
                "_SOURCE": [testData.oMaterial._SOURCE[3], testData.oMaterial._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material}}
                where MATERIAL_ID in ('${aInputRows[7].MATERIAL_ID}', '${aInputRows[8].MATERIAL_ID}', '${aInputRows[9].MATERIAL_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oMaterial, [0, 1]), ["MATERIAL_ID", "BASE_UOM_ID", "MATERIAL_GROUP_ID",
                    "MATERIAL_TYPE_ID", "IS_CREATED_VIA_CAD_INTEGRATION", "IS_PHANTOM_MATERIAL",
                    "IS_CONFIGURABLE_MATERIAL", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_ext");
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_ext}}
                    where _VALID_FROM < '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialExt, ["MATERIAL_ID", "_VALID_FROM", "CMAT_STRING_MANUAL"]
                );
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID, aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                    "CMAT_STRING_MANUAL": [aInputRows[0].CMAT_STRING_MANUAL, aInputRows[1].CMAT_STRING_MANUAL, aInputRows[2].CMAT_STRING_MANUAL, aInputRows[3].CMAT_STRING_MANUAL]
                }, ["MATERIAL_ID", "CMAT_STRING_MANUAL"]);
            }
        });

    }).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}