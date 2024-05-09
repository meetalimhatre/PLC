const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === 'all') {

	describe('db.masterdata_replication:p_update_t_controlling_area',function() {

		let oMockstarPlc = null;
		const sCurrentUser = $.session.getUsername();
		const sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_controlling_area", // procedure or view under test
						substituteTables:	// substitute all used tables in the procedure or view
						{	
							controlling_area: {
								name: "sap.plc.db::basis.t_controlling_area",
								data: testData.oControllingArea
                            },
                            controlling_area_currency: {
								name: "sap.plc.db::basis.t_currency",
								data: testData.oCurrency
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

		afterEach(function() {
		});

		it('should not create a controlling area', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure([]);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
			
			const aNewResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aNewResults).toBeDefined();
			expect(aNewResults.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

			let aResults = oMockstarPlc.execQuery(`select * from {{controlling_area}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oControllingArea,
				["CONTROLLING_AREA_ID","CONTROLLING_AREA_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should create a new controlling area', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
			
			const aInputRows = [{
				"CONTROLLING_AREA_ID": '4000',
				"CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[0],
				"_SOURCE": testData.oControllingArea._SOURCE[0]
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "controlling_area");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
				"CONTROLLING_AREA_CURRENCY_ID": [aInputRows[0].CONTROLLING_AREA_CURRENCY_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["CONTROLLING_AREA_ID","CONTROLLING_AREA_CURRENCY_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should not create due to DUPLICATE_KEY_COUNT in the input table', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
			
			const aInputRows = [{
				"CONTROLLING_AREA_ID": '4000',
				"CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[0],
				"_SOURCE": testData.oControllingArea._SOURCE[0]
			},{
				"CONTROLLING_AREA_ID": '4000',
				"CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[0],
				"_SOURCE": testData.oControllingArea._SOURCE[0]
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{controlling_area}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testData.oControllingArea,
				["CONTROLLING_AREA_ID","CONTROLLING_AREA_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should update an existing controlling area', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
			
			const aInputRows = [{
				"CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[3],
				"CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[3],
				"_SOURCE": 3
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			
			expect(aBeforeResults).toMatchData({
				"CONTROLLING_AREA_ID": [testData.oControllingArea.CONTROLLING_AREA_ID[2], testData.oControllingArea.CONTROLLING_AREA_ID[3]],
				"CONTROLLING_AREA_CURRENCY_ID": [testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[2], testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oControllingArea._VALID_FROM[2], testData.oControllingArea._VALID_FROM[3]],
				"_VALID_TO": [testData.oControllingArea._VALID_TO[2], testData.oControllingArea._VALID_TO[3]],
				"_SOURCE": [testData.oControllingArea._SOURCE[2], testData.oControllingArea._SOURCE[3]],
				"_CREATED_BY": [testData.oControllingArea._CREATED_BY[2], testData.oControllingArea._CREATED_BY[3]]
			},["CONTROLLING_AREA_ID","CONTROLLING_AREA_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "controlling_area");
			
			let aResultsCount = oMockstarPlc.execQuery(`select * from {{controlling_area}} where CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'`);
			expect(aResultsCount).toBeDefined();
			expect(aResultsCount.columns.CONTROLLING_AREA_ID.rows.length).toEqual(3);

			let aResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
				"CONTROLLING_AREA_CURRENCY_ID": [aInputRows[0].CONTROLLING_AREA_CURRENCY_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["CONTROLLING_AREA_ID","CONTROLLING_AREA_CURRENCY_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should not update a controlling area if currency id does not exist', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");

			var aInputRows = [{
				"CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[3],
				"CONTROLLING_AREA_CURRENCY_ID": 'XXX',
				"_SOURCE": testData.oControllingArea._SOURCE[0]
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			
			expect(aBeforeResults).toMatchData({
				"CONTROLLING_AREA_ID": [testData.oControllingArea.CONTROLLING_AREA_ID[2], testData.oControllingArea.CONTROLLING_AREA_ID[3]],
				"CONTROLLING_AREA_CURRENCY_ID": [testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[2], testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oControllingArea._VALID_FROM[2], testData.oControllingArea._VALID_FROM[3]],
				"_VALID_TO": [testData.oControllingArea._VALID_TO[2], testData.oControllingArea._VALID_TO[3]],
				"_SOURCE": [testData.oControllingArea._SOURCE[2], testData.oControllingArea._SOURCE[3]],
				"_CREATED_BY": [testData.oControllingArea._CREATED_BY[2], testData.oControllingArea._CREATED_BY[3]]
			},["CONTROLLING_AREA_ID","CONTROLLING_AREA_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			var procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
			
			let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_CURRENCY_ID'],
                "FIELD_VALUE": [aInputRows[0].CONTROLLING_AREA_CURRENCY_ID],
				"MESSAGE_TEXT": ['Unknown Currency ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
				"MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_controlling_area']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{controlling_area}} where CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			
			expect(aResults).toMatchData({
				"CONTROLLING_AREA_ID": [testData.oControllingArea.CONTROLLING_AREA_ID[2], testData.oControllingArea.CONTROLLING_AREA_ID[3]],
				"CONTROLLING_AREA_CURRENCY_ID": [testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[2], testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oControllingArea._VALID_FROM[2], testData.oControllingArea._VALID_FROM[3]],
				"_VALID_TO": [testData.oControllingArea._VALID_TO[2], testData.oControllingArea._VALID_TO[3]],
				"_SOURCE": [testData.oControllingArea._SOURCE[2], testData.oControllingArea._SOURCE[3]],
				"_CREATED_BY": [testData.oControllingArea._CREATED_BY[2], testData.oControllingArea._CREATED_BY[3]]
			},["CONTROLLING_AREA_ID","CONTROLLING_AREA_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should insert two controlling areas, update two, add error for one, skip two due to multiple input and skip one due to entry already exist', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controlling_area");
			
			const aInputRows = [{
                "CONTROLLING_AREA_ID": '4000',
                "CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[0],
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": '5000',
                "CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[0],
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[3],
                "CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[3],
                "_SOURCE": 3,
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[4],
                "CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[4],
                "_SOURCE": 2,
            }, {
                "CONTROLLING_AREA_ID": '6000',
                "CONTROLLING_AREA_CURRENCY_ID": 'XXX',
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": '7000',
                "CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[0],
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": '7000',
                "CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[0],
                "_SOURCE": 2
            }, {
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[1],
                "CONTROLLING_AREA_CURRENCY_ID": testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[1],
                "_SOURCE": testData.oControllingArea._SOURCE[1],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{controlling_area}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oControllingArea, ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "controlling_area");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_CURRENCY_ID'],
                "FIELD_VALUE": [aInputRows[4].CONTROLLING_AREA_CURRENCY_ID],
				"MESSAGE_TEXT": ['Unknown Currency ID for Controlling Area ID '.concat(aInputRows[4].CONTROLLING_AREA_ID)],
				"MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_controlling_area']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{controlling_area}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "CONTROLLING_AREA_CURRENCY_ID": [aInputRows[0].CONTROLLING_AREA_CURRENCY_ID, aInputRows[1].CONTROLLING_AREA_CURRENCY_ID, aInputRows[2].CONTROLLING_AREA_CURRENCY_ID, aInputRows[3].CONTROLLING_AREA_CURRENCY_ID],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{controlling_area}}
            	where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "CONTROLLING_AREA_CURRENCY_ID": [aInputRows[2].CONTROLLING_AREA_CURRENCY_ID, aInputRows[3].CONTROLLING_AREA_CURRENCY_ID],
                "_VALID_FROM": [testData.oControllingArea._VALID_FROM[3], testData.oControllingArea._VALID_FROM[4]],
                "_SOURCE": [testData.oControllingArea._SOURCE[3], testData.oControllingArea._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{controlling_area}}
                where CONTROLLING_AREA_ID in ('${aInputRows[5].CONTROLLING_AREA_ID}', '${aInputRows[6].CONTROLLING_AREA_ID}', '${aInputRows[7].CONTROLLING_AREA_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData({
                "CONTROLLING_AREA_ID": [testData.oControllingArea.CONTROLLING_AREA_ID[0], testData.oControllingArea.CONTROLLING_AREA_ID[1]],
                "CONTROLLING_AREA_CURRENCY_ID": [testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[0], testData.oControllingArea.CONTROLLING_AREA_CURRENCY_ID[1]],
                "_VALID_FROM": [testData.oControllingArea._VALID_FROM[0], testData.oControllingArea._VALID_FROM[1]],
                "_VALID_TO": [testData.oControllingArea._VALID_TO[0], testData.oControllingArea._VALID_TO[1]],
                "_SOURCE": [testData.oControllingArea._SOURCE[0], testData.oControllingArea._SOURCE[1]],
                "_CREATED_BY": [testData.oControllingArea._CREATED_BY[0], testData.oControllingArea._CREATED_BY[1]]
            }, ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

	}).addTags(["All_Unit_Tests"]);
}