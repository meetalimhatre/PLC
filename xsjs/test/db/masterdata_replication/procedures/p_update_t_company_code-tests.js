const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === 'all') {

	describe('db.masterdata_replication:p_update_t_company_code',function() {

		let oMockstarPlc = null;
		const sCurrentUser = $.session.getUsername();
		const sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_company_code", // procedure or view under test
						substituteTables:	// substitute all used tables in the procedure or view
						{	
							company_code: {
								name: "sap.plc.db::basis.t_company_code",
								data: testData.oCompanyCode
							},
							controlling_area: {
								name: "sap.plc.db::basis.t_controlling_area",
								data: testData.oControllingArea
                            },
                            company_code_currency: {
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

		it('should not create a company code', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure([]);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");
			
			const aNewResults = oMockstarPlc.execQuery(`select * from {{company_code}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aNewResults).toBeDefined();
			expect(aNewResults.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

			let aResults = oMockstarPlc.execQuery(`select * from {{company_code}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oCompanyCode,
				["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should create a new company code', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");
			
			const aInputRows = [{
				"COMPANY_CODE_ID": 'CC4',
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[0],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[0],
				"_SOURCE": testData.oCompanyCode._SOURCE[0]
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "company_code");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{company_code}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID],
				"CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
				"COMPANY_CODE_CURRENCY_ID": [aInputRows[0].COMPANY_CODE_CURRENCY_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should not create due to DUPLICATE_KEY_COUNT in the input table', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");
			
			const aInputRows = [{
				"COMPANY_CODE_ID": 'CC4',
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[0],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[0],
				"_SOURCE": testData.oCompanyCode._SOURCE[0]
			},{
				"COMPANY_CODE_ID": 'CC4',
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[0],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[0],
				"_SOURCE": testData.oCompanyCode._SOURCE[0]
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{company_code}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{company_code}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testData.oCompanyCode,
				["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should update an existing company code', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");
			
			const aInputRows = [{
				"COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[3],
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[3],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3],
				"_SOURCE": 3
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			
			expect(aBeforeResults).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCode.COMPANY_CODE_ID[2], testData.oCompanyCode.COMPANY_CODE_ID[3]],
				"CONTROLLING_AREA_ID": [testData.oCompanyCode.CONTROLLING_AREA_ID[2], testData.oCompanyCode.CONTROLLING_AREA_ID[3]],
				"COMPANY_CODE_CURRENCY_ID": [testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[2], testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oCompanyCode._VALID_FROM[2], testData.oCompanyCode._VALID_FROM[3]],
				"_VALID_TO": [testData.oCompanyCode._VALID_TO[2], testData.oCompanyCode._VALID_TO[3]],
				"_SOURCE": [testData.oCompanyCode._SOURCE[2], testData.oCompanyCode._SOURCE[3]],
				"_CREATED_BY": [testData.oCompanyCode._CREATED_BY[2], testData.oCompanyCode._CREATED_BY[3]]
			},["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "company_code");
			
			let aResultsCount = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aResultsCount).toBeDefined();
			expect(aResultsCount.columns.COMPANY_CODE_ID.rows.length).toEqual(3);

			let aResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID],
				"CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
				"COMPANY_CODE_CURRENCY_ID": [aInputRows[0].COMPANY_CODE_CURRENCY_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should not update a company_code if controlling area does not exist', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");

			const aInputRows = [{
				"COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[3],
				"CONTROLLING_AREA_ID": '1111',
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3],
				"_SOURCE": testData.oCompanyCode._SOURCE[0]
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			
			expect(aBeforeResults).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCode.COMPANY_CODE_ID[2], testData.oCompanyCode.COMPANY_CODE_ID[3]],
				"CONTROLLING_AREA_ID": [testData.oCompanyCode.CONTROLLING_AREA_ID[2], testData.oCompanyCode.CONTROLLING_AREA_ID[3]],
				"COMPANY_CODE_CURRENCY_ID": [testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[2], testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oCompanyCode._VALID_FROM[2], testData.oCompanyCode._VALID_FROM[3]],
				"_VALID_TO": [testData.oCompanyCode._VALID_TO[2], testData.oCompanyCode._VALID_TO[3]],
				"_SOURCE": [testData.oCompanyCode._SOURCE[2], testData.oCompanyCode._SOURCE[3]],
				"_CREATED_BY": [testData.oCompanyCode._CREATED_BY[2], testData.oCompanyCode._CREATED_BY[3]]
			},["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");
			
			let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[0].CONTROLLING_AREA_ID],
				"MESSAGE_TEXT": ['Unknown Controlling Area ID for Company Code ID '.concat(aInputRows[0].COMPANY_CODE_ID)],
				"MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_company_code']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCode.COMPANY_CODE_ID[2], testData.oCompanyCode.COMPANY_CODE_ID[3]],
				"CONTROLLING_AREA_ID": [testData.oCompanyCode.CONTROLLING_AREA_ID[2], testData.oCompanyCode.CONTROLLING_AREA_ID[3]],
				"COMPANY_CODE_CURRENCY_ID": [testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[2], testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oCompanyCode._VALID_FROM[2], testData.oCompanyCode._VALID_FROM[3]],
				"_VALID_TO": [testData.oCompanyCode._VALID_TO[2], testData.oCompanyCode._VALID_TO[3]],
				"_SOURCE": [testData.oCompanyCode._SOURCE[2], testData.oCompanyCode._SOURCE[3]],
				"_CREATED_BY": [testData.oCompanyCode._CREATED_BY[2], testData.oCompanyCode._CREATED_BY[3]]
			},["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should not update a company_code if currency id does not exist', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");

			var aInputRows = [{
				"COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[3],
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[3],
				"COMPANY_CODE_CURRENCY_ID": 'XXX',
				"_SOURCE": testData.oCompanyCode._SOURCE[0]
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			
			expect(aBeforeResults).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCode.COMPANY_CODE_ID[2], testData.oCompanyCode.COMPANY_CODE_ID[3]],
				"CONTROLLING_AREA_ID": [testData.oCompanyCode.CONTROLLING_AREA_ID[2], testData.oCompanyCode.CONTROLLING_AREA_ID[3]],
				"COMPANY_CODE_CURRENCY_ID": [testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[2], testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oCompanyCode._VALID_FROM[2], testData.oCompanyCode._VALID_FROM[3]],
				"_VALID_TO": [testData.oCompanyCode._VALID_TO[2], testData.oCompanyCode._VALID_TO[3]],
				"_SOURCE": [testData.oCompanyCode._SOURCE[2], testData.oCompanyCode._SOURCE[3]],
				"_CREATED_BY": [testData.oCompanyCode._CREATED_BY[2], testData.oCompanyCode._CREATED_BY[3]]
			},["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");
			
			let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COMPANY_CODE_CURRENCY_ID'],
                "FIELD_VALUE": [aInputRows[0].COMPANY_CODE_CURRENCY_ID],
				"MESSAGE_TEXT": ['Unknown Currency ID for Company Code ID '.concat(aInputRows[0].COMPANY_CODE_ID)],
				"MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_company_code']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			
			expect(aResults).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCode.COMPANY_CODE_ID[2], testData.oCompanyCode.COMPANY_CODE_ID[3]],
				"CONTROLLING_AREA_ID": [testData.oCompanyCode.CONTROLLING_AREA_ID[2], testData.oCompanyCode.CONTROLLING_AREA_ID[3]],
				"COMPANY_CODE_CURRENCY_ID": [testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[2], testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oCompanyCode._VALID_FROM[2], testData.oCompanyCode._VALID_FROM[3]],
				"_VALID_TO": [testData.oCompanyCode._VALID_TO[2], testData.oCompanyCode._VALID_TO[3]],
				"_SOURCE": [testData.oCompanyCode._SOURCE[2], testData.oCompanyCode._SOURCE[3]],
				"_CREATED_BY": [testData.oCompanyCode._CREATED_BY[2], testData.oCompanyCode._CREATED_BY[3]]
			},["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should insert two company codes, update two, skip one due to entry already present in table, add error for invalid currency', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code");
			
			const aInputRows = [{
				"COMPANY_CODE_ID": 'CC4',
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[0],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[0],
				"_SOURCE": 1
			},{
				"COMPANY_CODE_ID": 'CC5',
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[0],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[0],
				"_SOURCE": 1
			},{
				"COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[1],
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[1],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[1],
				"_SOURCE": 3
			},{
				"COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[3],
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[3],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3],
				"_SOURCE": 3
			},{
				"COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[4],
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[4],
				"COMPANY_CODE_CURRENCY_ID": testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[4],
				"_SOURCE": testData.oCompanyCode._SOURCE[4]
			},{
				"COMPANY_CODE_ID": 'CC9',
				"CONTROLLING_AREA_ID": testData.oCompanyCode.CONTROLLING_AREA_ID[4],
				"COMPANY_CODE_CURRENCY_ID": 'XYZ',
				"_SOURCE": 3
			}];

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 9, "company_code");

			let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COMPANY_CODE_CURRENCY_ID'],
                "FIELD_VALUE": [aInputRows[5].COMPANY_CODE_CURRENCY_ID],
				"MESSAGE_TEXT": ['Unknown Currency ID for Company Code ID '.concat(aInputRows[5].COMPANY_CODE_ID)],
				"MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_company_code']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

			let aInsertResults = oMockstarPlc.execQuery(`select * from {{company_code}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}' or COMPANY_CODE_ID = '${aInputRows[1].COMPANY_CODE_ID}' `);
			expect(aInsertResults).toBeDefined();
			expect(aInsertResults.columns.COMPANY_CODE_ID.rows.length).toEqual(2);

			aInsertResults = mockstarHelpers.convertResultToArray(aInsertResults);
			expect(aInsertResults).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID, aInputRows[1].COMPANY_CODE_ID],
				"CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
				"COMPANY_CODE_CURRENCY_ID": [aInputRows[0].COMPANY_CODE_CURRENCY_ID, aInputRows[1].COMPANY_CODE_CURRENCY_ID],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
			},["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
			
			let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{company_code}} where (COMPANY_CODE_ID = '${aInputRows[2].COMPANY_CODE_ID}' or  COMPANY_CODE_ID = '${aInputRows[3].COMPANY_CODE_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
			expect(aResultsUpdate).toBeDefined();
			expect(aResultsUpdate.columns.COMPANY_CODE_ID.rows.length).toEqual(2);

			aResultsUpdate = mockstarHelpers.convertResultToArray(aResultsUpdate);
			expect(aResultsUpdate).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[2].COMPANY_CODE_ID, aInputRows[3].COMPANY_CODE_ID],
				"CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
				"COMPANY_CODE_CURRENCY_ID": [aInputRows[2].COMPANY_CODE_CURRENCY_ID, aInputRows[3].COMPANY_CODE_CURRENCY_ID],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
			},["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{company_code}} where (COMPANY_CODE_ID = '${aInputRows[2].COMPANY_CODE_ID}' or  COMPANY_CODE_ID = '${aInputRows[3].COMPANY_CODE_ID}') and _VALID_TO > '${sMasterdataTimestamp}' `);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);

			expect(aResultsOld).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCode.COMPANY_CODE_ID[1], testData.oCompanyCode.COMPANY_CODE_ID[3]],
				"CONTROLLING_AREA_ID": [testData.oCompanyCode.CONTROLLING_AREA_ID[1], testData.oCompanyCode.CONTROLLING_AREA_ID[3]],
				"COMPANY_CODE_CURRENCY_ID": [testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[1], testData.oCompanyCode.COMPANY_CODE_CURRENCY_ID[3]],
				"_VALID_FROM": [testData.oCompanyCode._VALID_FROM[1], testData.oCompanyCode._VALID_FROM[3]],
                "_SOURCE": [testData.oCompanyCode._SOURCE[1], testData.oCompanyCode._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
			},["COMPANY_CODE_ID","CONTROLLING_AREA_ID","COMPANY_CODE_CURRENCY_ID","_VALID_FROM","_SOURCE","_CREATED_BY"]);

			let aResultsSkip = oMockstarPlc.execQuery(`select * from {{company_code}} where (COMPANY_CODE_ID = '${aInputRows[4].COMPANY_CODE_ID}' or  COMPANY_CODE_ID = '${aInputRows[5].COMPANY_CODE_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
			expect(aResultsSkip).toBeDefined();
			expect(aResultsSkip.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

		});

	}).addTags(["All_Unit_Tests"]);
}