let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_material_account_determination', function () {

        let oMockstarPlc = null;

        let sCurrentUser = $.session.getUsername();
        let sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function () {

            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material_account_determination", // procedure or view under test
                    substituteTables:	// substitute all used tables in the procedure or view
                    {
                        material_account_determination: {
                            name: "sap.plc.db::basis.t_material_account_determination",
                            data: testDataRepl.oMaterialAccountDetermination
                        },
                        account: {
                            name: "sap.plc.db::basis.t_account",
                            data: testDataRepl.oAccount
                        },
                        controlling_area: {
                            name: "sap.plc.db::basis.t_controlling_area",
                            data: testDataRepl.oControllingArea
                        },
                        plant: {
                            name: "sap.plc.db::basis.t_plant",
                            data: testDataRepl.oPlant
                        },
                        valuation_class: {
                            name: "sap.plc.db::basis.t_valuation_class",
                            data: testDataRepl.oValuationClass
                        },
                        material_type: {
                            name: "sap.plc.db::basis.t_material_type",
                            data: testDataRepl.oMaterialType
                        },
                        error: {
                            name: "sap.plc.db::map.t_replication_log",
                            data: testDataRepl.oError
                        }
                    }
                });
        });

        beforeEach(function () {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function () {
        });

        it('should not create a Material Account Determination', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should create a new Material Account Determination', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[1],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[4],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where 
                                                            CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                                                            and MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'
                                                            and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                                                            and VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_account_determination");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should create a new Material Account Determination with * for MATERIAL_TYPE_ID,PLANT_ID,VALUATION_CLASS_ID', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": '*',                 //key
                "PLANT_ID": '*',                         //key
                "VALUATION_CLASS_ID": '*',               //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where 
                                                            CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                                                            and MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'
                                                            and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                                                            and VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_account_determination");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should update an existing Material Account Determination', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[4],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[3],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where 
                                                            CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                                                            and MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'
                                                            and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                                                            and VALUATION_CLASS_ID = '${testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[4]}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults).toMatchData({
                "CONTROLLING_AREA_ID": [testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4]],   //key
                "MATERIAL_TYPE_ID": [testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4]],         //key
                "PLANT_ID": [testDataRepl.oMaterialAccountDetermination.PLANT_ID[4]],                         //key
                "VALUATION_CLASS_ID": [testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[4]],     //key
                "ACCOUNT_ID": [testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4]],
                "_VALID_TO": [testDataRepl.oMaterialType._VALID_TO[4]],
                "_SOURCE": [testDataRepl.oMaterialType._SOURCE[4]],
                "_CREATED_BY": [testDataRepl.oMaterialType._CREATED_BY[4]]
            }, ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_account_determination");

            let aResultsCount = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where 
                                                            CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                                                            and MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'
                                                            and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                                                            and VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}'`);
            expect(aResultsCount).toBeDefined();
            expect(aResultsCount.columns.MATERIAL_TYPE_ID.rows.length).toEqual(1);

            //Check Updated entry
            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where 
                                                    CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                                                    and MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'
                                                    and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                                                    and VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}'
                                                    and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID],
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the Material Account Determination table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[4],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[4],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 1
            },
            {
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[4],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[4],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 1
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where 
                                                            CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                                                            and MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'
                                                            and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                                                            and VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}'`);
            expect(aBeforeResults).toBeDefined();

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should not do any insert / update since all data from Material Account Determination already exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[3],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[3],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[3],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[3],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[3],
                "_SOURCE": 2
            },
            {
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[4],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[4],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 1
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_account_determination}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_account_determination}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testDataRepl.oMaterialAccountDetermination, ["MATERIAL_TYPE_ID", "_SOURCE"]);
        });

        it('should not update a Material Account Determination if Material Type does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[0],   //key
                "MATERIAL_TYPE_ID": 'MT8',//testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[0],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[0],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[0],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[0],
                "_SOURCE": testDataRepl.oMaterialAccountDetermination._SOURCE[0],
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let test = oMockstarPlc.execQuery(`select * from {{material_account_determination}} `);
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['MATERIAL_TYPE_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_TYPE_ID],
                "MESSAGE_TEXT": ['Unknown Material Type ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_account_determination']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Material Account Determination if Plant ID does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[0],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[0],         //key
                "PLANT_ID": 'PL7',//testDataRepl.oMaterialAccountDetermination.PLANT_ID[0],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[0],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[0],
                "_SOURCE": testDataRepl.oMaterialAccountDetermination._SOURCE[0],
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let test = oMockstarPlc.execQuery(`select * from {{material_account_determination}} `);
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['PLANT_ID'],
                "FIELD_VALUE": [aInputRows[0].PLANT_ID],
                "MESSAGE_TEXT": ['Unknown Plant ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_account_determination']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Material Account Determination if Valuation Class ID does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[0],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[0],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[0],                         //key
                "VALUATION_CLASS_ID": 'V7',//testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[0],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[0],
                "_SOURCE": testDataRepl.oMaterialAccountDetermination._SOURCE[0],
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let test = oMockstarPlc.execQuery(`select * from {{material_account_determination}} `);
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['VALUATION_CLASS_ID'],
                "FIELD_VALUE": [aInputRows[0].VALUATION_CLASS_ID],
                "MESSAGE_TEXT": ['Unknown Valuation Class ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_account_determination']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a Material Account Determination if Controlling Area ID together with Account ID does not exist', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[0],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[4],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[4],     //key
                "ACCOUNT_ID": 'C5',//testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[0],
                "_SOURCE": testDataRepl.oMaterialAccountDetermination._SOURCE[4],
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}} `);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let test = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['ACCOUNT_ID'],
                "FIELD_VALUE": [aInputRows[0].ACCOUNT_ID],
                "MESSAGE_TEXT": ['Unknown Account ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_account_determination']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResults = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData(testDataRepl.oMaterialAccountDetermination,
                ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert 2 Material Account Determinations, update 1, and skip one due to entry already present in table', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_account_determination");

            let aInputRows = [{
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[1],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[4],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 2
            },
            {
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[4],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[1],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[4],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[4],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[4],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[3],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[4],
                "_SOURCE": 2
            },
            {
                "CONTROLLING_AREA_ID": testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[0],   //key
                "MATERIAL_TYPE_ID": testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[0],         //key
                "PLANT_ID": testDataRepl.oMaterialAccountDetermination.PLANT_ID[0],                         //key
                "VALUATION_CLASS_ID": testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[0],     //key
                "ACCOUNT_ID": testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[0],
                "_SOURCE": testDataRepl.oMaterialAccountDetermination._SOURCE[0]
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_account_determination}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testDataRepl.oMaterialAccountDetermination, ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "material_account_determination");

            let aResultsNew = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where
                                                        (CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                                                        and MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'
                                                        and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                                                        and VALUATION_CLASS_ID = '${aInputRows[0].VALUATION_CLASS_ID}')
                                                        or (CONTROLLING_AREA_ID = '${aInputRows[1].CONTROLLING_AREA_ID}'
                                                        and MATERIAL_TYPE_ID = '${aInputRows[1].MATERIAL_TYPE_ID}'
                                                        and PLANT_ID = '${aInputRows[1].PLANT_ID}'
                                                        and VALUATION_CLASS_ID = '${aInputRows[1].VALUATION_CLASS_ID}')
                                                        and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsNew).toBeDefined();
            expect(aResultsNew.columns.MATERIAL_TYPE_ID.rows.length).toEqual(2);

            expect(aResultsNew).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID, aInputRows[1].MATERIAL_TYPE_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID],
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID, aInputRows[1].VALUATION_CLASS_ID],
                "ACCOUNT_ID": [aInputRows[0].ACCOUNT_ID, aInputRows[1].ACCOUNT_ID],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where
                                                            CONTROLLING_AREA_ID = '${aInputRows[2].CONTROLLING_AREA_ID}'
                                                            and MATERIAL_TYPE_ID = '${aInputRows[2].MATERIAL_TYPE_ID}'
                                                            and PLANT_ID = '${aInputRows[2].PLANT_ID}'
                                                            and VALUATION_CLASS_ID = '${aInputRows[2].VALUATION_CLASS_ID}'
                                                            and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsUpdate).toBeDefined();
            expect(aResultsUpdate.columns.MATERIAL_TYPE_ID.rows.length).toEqual(1);

            expect(aResultsUpdate).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID],
                "MATERIAL_TYPE_ID": [aInputRows[2].MATERIAL_TYPE_ID],
                "PLANT_ID": [aInputRows[2].PLANT_ID],
                "VALUATION_CLASS_ID": [aInputRows[2].VALUATION_CLASS_ID],
                "ACCOUNT_ID": [aInputRows[2].ACCOUNT_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[2]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material_account_determination}} where 
                                                        CONTROLLING_AREA_ID = '${aInputRows[3].CONTROLLING_AREA_ID}'
                                                        and MATERIAL_TYPE_ID = '${aInputRows[3].MATERIAL_TYPE_ID}'
                                                        and PLANT_ID = '${aInputRows[3].PLANT_ID}'
                                                        and VALUATION_CLASS_ID = '${aInputRows[3].VALUATION_CLASS_ID}'`);
            expect(aResultsSkip).toBeDefined();
            aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
            expect(aResultsSkip).toMatchData({
                "CONTROLLING_AREA_ID": [testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[0], testDataRepl.oMaterialAccountDetermination.CONTROLLING_AREA_ID[1]],
                "MATERIAL_TYPE_ID": [testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[0], testDataRepl.oMaterialAccountDetermination.MATERIAL_TYPE_ID[1]],
                "PLANT_ID": [testDataRepl.oMaterialAccountDetermination.PLANT_ID[0], testDataRepl.oMaterialAccountDetermination.PLANT_ID[1]],
                "VALUATION_CLASS_ID": [testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[0], testDataRepl.oMaterialAccountDetermination.VALUATION_CLASS_ID[1]],
                "ACCOUNT_ID": [testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[0], testDataRepl.oMaterialAccountDetermination.ACCOUNT_ID[1]],
                "_VALID_TO": [testDataRepl.oMaterialAccountDetermination._VALID_TO[0], testDataRepl.oMaterialAccountDetermination._VALID_TO[1]],
                "_SOURCE": [testDataRepl.oMaterialAccountDetermination._SOURCE[0], testDataRepl.oMaterialAccountDetermination._SOURCE[1]],
                "_CREATED_BY": [testDataRepl.oMaterialAccountDetermination._CREATED_BY[0], testDataRepl.oMaterialAccountDetermination._CREATED_BY[1]]
            }, ["CONTROLLING_AREA_ID", "MATERIAL_TYPE_ID", "PLANT_ID", "VALUATION_CLASS_ID", "ACCOUNT_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

    }).addTags(["All_Unit_Tests"]);
}