let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

	describe('db.masterdata_replication:p_update_t_material_type', function () {

		let oMockstarPlc = null;

		let sCurrentUser = $.session.getUsername();
		let sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function () {

			oMockstarPlc = new MockstarFacade(
				{
					testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material_type", // procedure or view under test
					substituteTables:	// substitute all used tables in the procedure or view
					{
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

		it('should not create a Material Type', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_type");

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_type");

			let aResults = oMockstarPlc.execQuery(`select * from {{material_type}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_type}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialType,
				 ["MATERIAL_TYPE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]); 

		});

		it('should create a new Material Type', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_type");

			let aInputRows = [{
				"MATERIAL_TYPE_ID": 'MT4',
				"_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_type}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_type");

			let aResults = oMockstarPlc.execQuery(`select * from {{material_type}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults).toMatchData({
				"MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_VALID_TO": [null],
				"_CREATED_BY": [sCurrentUser]
			}, ["MATERIAL_TYPE_ID", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

		});

		it('should update an existing Material Type', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_type");

			let aInputRows = [{
				"MATERIAL_TYPE_ID": 'MT3',
				"_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_type}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults).toMatchData({
				"MATERIAL_TYPE_ID": [testDataRepl.oMaterialType.MATERIAL_TYPE_ID[4]],
				"_SOURCE": [testDataRepl.oMaterialType._SOURCE[4]],
				"_VALID_TO": [testDataRepl.oMaterialType._VALID_TO[4]],
				"_CREATED_BY": [testDataRepl.oMaterialType._CREATED_BY[4]]
			}, ["MATERIAL_TYPE_ID", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_type");

			let aResultsCount = oMockstarPlc.execQuery(`select * from {{material_type}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'`);
			expect(aResultsCount).toBeDefined();
			expect(aResultsCount.columns.MATERIAL_TYPE_ID.rows.length).toEqual(2);

			//Check Updated entry
			let aResults = oMockstarPlc.execQuery(`select * from {{material_type}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults).toMatchData({
				"MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_VALID_TO": [null],
				"_CREATED_BY": [sCurrentUser]
			}, ["MATERIAL_TYPE_ID", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

		});

		it('should not do any update due to DUPLICATE_KEY_COUNT in the Material Type table', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_type");

			let aInputRows = [{
				"MATERIAL_TYPE_ID": 'MT4',
				"_SOURCE": 2
			},
			{
				"MATERIAL_TYPE_ID": 'MT4',
				"_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_type}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_type");

			let aResults = oMockstarPlc.execQuery(`select * from {{material_type}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_type}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialType,
				 ["MATERIAL_TYPE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});

		it('should not do any insert / update since all data from Material Type already exist', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_type");

			let aInputRows = [{
				"MATERIAL_TYPE_ID": testDataRepl.oMaterialType.MATERIAL_TYPE_ID[3],
				"_SOURCE": testDataRepl.oMaterialType._SOURCE[3]
			}, {
				"MATERIAL_TYPE_ID": testDataRepl.oMaterialType.MATERIAL_TYPE_ID[4],
				"_SOURCE": testDataRepl.oMaterialType._SOURCE[4]
			}];

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

			let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_type}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResultsValidFrom.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

			let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_type}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
			expect(aResultsValidTo.columns.MATERIAL_TYPE_ID.rows.length).toEqual(0);

			let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_type}}`);
			expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
				testDataRepl.oMaterialType, ["MATERIAL_TYPE_ID", "_SOURCE"]);
		});

		it('should insert 2 Material Types, update 1, and skip one due to entry already present in table', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_type");

			let aInputRows = [{
				"MATERIAL_TYPE_ID": 'MT4',
				"_SOURCE": 2
			},
			{
				"MATERIAL_TYPE_ID": 'MT5',
				"_SOURCE": 2
			}, {
				"MATERIAL_TYPE_ID": testDataRepl.oMaterialType.MATERIAL_TYPE_ID[4],
				"_SOURCE": 2
			},
			{
				"MATERIAL_TYPE_ID": testDataRepl.oMaterialType.MATERIAL_TYPE_ID[0],
				"_SOURCE": 1
			}];

			let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_type}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testDataRepl.oMaterialType, ["MATERIAL_TYPE_ID", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);
			
			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 8, "material_type");

			let aResultsNew = oMockstarPlc.execQuery(`select * from {{material_type}} where MATERIAL_TYPE_ID = '${aInputRows[0].MATERIAL_TYPE_ID}' or MATERIAL_TYPE_ID = '${aInputRows[1].MATERIAL_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResultsNew).toBeDefined();
			expect(aResultsNew.columns.MATERIAL_TYPE_ID.rows.length).toEqual(2);

			expect(aResultsNew).toMatchData({
				"MATERIAL_TYPE_ID": [aInputRows[0].MATERIAL_TYPE_ID,aInputRows[1].MATERIAL_TYPE_ID],
				"_VALID_TO": [null, null],
				"_SOURCE": [aInputRows[0]._SOURCE,aInputRows[1]._SOURCE],
				"_CREATED_BY": [sCurrentUser, sCurrentUser]
			}, ["MATERIAL_TYPE_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

			let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{material_type}} where MATERIAL_TYPE_ID = '${aInputRows[2].MATERIAL_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
			expect(aResultsUpdate).toBeDefined();
			expect(aResultsUpdate.columns.MATERIAL_TYPE_ID.rows.length).toEqual(1);

			expect(aResultsUpdate).toMatchData({
				"MATERIAL_TYPE_ID": [aInputRows[2].MATERIAL_TYPE_ID],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[2]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			}, ["MATERIAL_TYPE_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

			let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material_type}} where MATERIAL_TYPE_ID = '${aInputRows[3].MATERIAL_TYPE_ID}'`);
			expect(aResultsSkip).toBeDefined();
			aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
			expect(aResultsSkip).toMatchData({
				"MATERIAL_TYPE_ID": [testDataRepl.oMaterialType.MATERIAL_TYPE_ID[0],testDataRepl.oMaterialType.MATERIAL_TYPE_ID[1]],
				"_SOURCE": [testDataRepl.oMaterialType._SOURCE[0],testDataRepl.oMaterialType._SOURCE[1]],
				"_VALID_TO": [testDataRepl.oMaterialType._VALID_TO[0],testDataRepl.oMaterialType._VALID_TO[1]],
				"_CREATED_BY": [testDataRepl.oMaterialType._CREATED_BY[0],testDataRepl.oMaterialType._CREATED_BY[1]]
			}, ["MATERIAL_TYPE_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
		});

	}).addTags(["All_Unit_Tests"]);
}