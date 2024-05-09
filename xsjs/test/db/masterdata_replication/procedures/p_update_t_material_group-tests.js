let MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let mockstarHelpers = require("../../../testtools/mockstar_helpers");
let testDataRepl = require("../../../testdata/testdata_replication").data;
let _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

	describe('db.masterdata_replication:p_update_t_material_group', function () {

		let oMockstarPlc = null;

		let sCurrentUser = $.session.getUsername();
		let sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function () {

			oMockstarPlc = new MockstarFacade(
				{
					testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material_group", // procedure or view under test
					substituteTables:	// substitute all used tables in the procedure or view
					{
						material_group: {
							name: "sap.plc.db::basis.t_material_group",
							data: testDataRepl.oMaterialGroup
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

		it('should not create a Material Group', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_group");

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_group");

			let aResults = oMockstarPlc.execQuery(`select * from {{material_group}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_group}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialGroup,
				 ["MATERIAL_GROUP_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]); 

		});

		it('should create a new Material Group', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_group");

			let aInputRows = [{
				"MATERIAL_GROUP_ID": 'MG4',
				"_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_group}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_group");

			let aResults = oMockstarPlc.execQuery(`select * from {{material_group}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults).toMatchData({
				"MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_VALID_TO": [null],
				"_CREATED_BY": [sCurrentUser]
			}, ["MATERIAL_GROUP_ID", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

		});

		it('should update an existing Material Group', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_group");

			let aInputRows = [{
				"MATERIAL_GROUP_ID": 'MG3',
				"_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_group}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults).toMatchData({
				"MATERIAL_GROUP_ID": [testDataRepl.oMaterialGroup.MATERIAL_GROUP_ID[4]],
				"_SOURCE": [testDataRepl.oMaterialGroup._SOURCE[4]],
				"_VALID_TO": [testDataRepl.oMaterialGroup._VALID_TO[4]],
				"_CREATED_BY": [testDataRepl.oMaterialGroup._CREATED_BY[4]]
			}, ["MATERIAL_GROUP_ID", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_group");

			let aResultsCount = oMockstarPlc.execQuery(`select * from {{material_group}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}'`);
			expect(aResultsCount).toBeDefined();
			expect(aResultsCount.columns.MATERIAL_GROUP_ID.rows.length).toEqual(2);

			//Check Updated entry
			let aResults = oMockstarPlc.execQuery(`select * from {{material_group}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults).toMatchData({
				"MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_VALID_TO": [null],
				"_CREATED_BY": [sCurrentUser]
			}, ["MATERIAL_GROUP_ID", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);

		});

		it('should not do any update due to DUPLICATE_KEY_COUNT in the Material Group table', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_group");

			let aInputRows = [{
				"MATERIAL_GROUP_ID": 'MG4',
				"_SOURCE": 2
			},
			{
				"MATERIAL_GROUP_ID": 'MG4',
				"_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_group}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_group");

			let aResults = oMockstarPlc.execQuery(`select * from {{material_group}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{material_group}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testDataRepl.oMaterialGroup,
				 ["MATERIAL_GROUP_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});

		it('should not do any insert / update since all data from Material Group already exist', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_group");

			let aInputRows = [{
				"MATERIAL_GROUP_ID": testDataRepl.oMaterialGroup.MATERIAL_GROUP_ID[3],
				"_SOURCE": testDataRepl.oMaterialGroup._SOURCE[3]
			}, {
				"MATERIAL_GROUP_ID": testDataRepl.oMaterialGroup.MATERIAL_GROUP_ID[4],
				"_SOURCE": testDataRepl.oMaterialGroup._SOURCE[4]
			}];

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

			let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_group}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResultsValidFrom.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

			let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_group}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
			expect(aResultsValidTo.columns.MATERIAL_GROUP_ID.rows.length).toEqual(0);

			let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_group}}`);
			expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
				testDataRepl.oMaterialGroup, ["MATERIAL_GROUP_ID", "_SOURCE"]);
		});

		it('should insert 2 Material Groups, update 1, and skip one due to entry already present in table', function () {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_group");

			let aInputRows = [{
				"MATERIAL_GROUP_ID": 'MG4',
				"_SOURCE": 2
			},
			{
				"MATERIAL_GROUP_ID": 'MG5',
				"_SOURCE": 2
			}, {
				"MATERIAL_GROUP_ID": testDataRepl.oMaterialGroup.MATERIAL_GROUP_ID[4],
				"_SOURCE": 2
			},
			{
				"MATERIAL_GROUP_ID": testDataRepl.oMaterialGroup.MATERIAL_GROUP_ID[0],
				"_SOURCE": 1
			}];

			let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_group}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testDataRepl.oMaterialGroup, ["MATERIAL_GROUP_ID", "_SOURCE", "_VALID_TO", "_CREATED_BY"]);
			
			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 8, "material_group");

			let aResultsNew = oMockstarPlc.execQuery(`select * from {{material_group}} where MATERIAL_GROUP_ID = '${aInputRows[0].MATERIAL_GROUP_ID}' or MATERIAL_GROUP_ID = '${aInputRows[1].MATERIAL_GROUP_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResultsNew).toBeDefined();
			expect(aResultsNew.columns.MATERIAL_GROUP_ID.rows.length).toEqual(2);

			expect(aResultsNew).toMatchData({
				"MATERIAL_GROUP_ID": [aInputRows[0].MATERIAL_GROUP_ID,aInputRows[1].MATERIAL_GROUP_ID],
				"_VALID_TO": [null, null],
				"_SOURCE": [aInputRows[0]._SOURCE,aInputRows[1]._SOURCE],
				"_CREATED_BY": [sCurrentUser, sCurrentUser]
			}, ["MATERIAL_GROUP_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

			let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{material_group}} where MATERIAL_GROUP_ID = '${aInputRows[2].MATERIAL_GROUP_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
			expect(aResultsUpdate).toBeDefined();
			expect(aResultsUpdate.columns.MATERIAL_GROUP_ID.rows.length).toEqual(1);

			expect(aResultsUpdate).toMatchData({
				"MATERIAL_GROUP_ID": [aInputRows[2].MATERIAL_GROUP_ID],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[2]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			}, ["MATERIAL_GROUP_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

			let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material_group}} where MATERIAL_GROUP_ID = '${aInputRows[3].MATERIAL_GROUP_ID}'`);
			expect(aResultsSkip).toBeDefined();
			aResultsSkip = mockstarHelpers.convertResultToArray(aResultsSkip);
			expect(aResultsSkip).toMatchData({
				"MATERIAL_GROUP_ID": [testDataRepl.oMaterialGroup.MATERIAL_GROUP_ID[0],testDataRepl.oMaterialGroup.MATERIAL_GROUP_ID[1]],
				"_SOURCE": [testDataRepl.oMaterialGroup._SOURCE[0],testDataRepl.oMaterialGroup._SOURCE[1]],
				"_VALID_TO": [testDataRepl.oMaterialGroup._VALID_TO[0],testDataRepl.oMaterialGroup._VALID_TO[1]],
				"_CREATED_BY": [testDataRepl.oMaterialGroup._CREATED_BY[0],testDataRepl.oMaterialGroup._CREATED_BY[1]]
			}, ["MATERIAL_GROUP_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
		});

	}).addTags(["All_Unit_Tests"]);
}