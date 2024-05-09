const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === 'all') {

	describe('db.masterdata_replication:p_update_t_company_code__text',function() {

		let oMockstarPlc = null;
		const sCurrentUser = $.session.getUsername();
		const sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_company_code__text", // procedure or view under test
						substituteTables:	// substitute all used tables in the procedure or view
						{
							company_code__text: {
								name: "sap.plc.db::basis.t_company_code__text",
								data: testData.oCompanyCodeText
							},
							company_code: {
								name: "sap.plc.db::basis.t_company_code",
								data: testData.oCompanyCode
                            },
                            language: {
								name: "sap.plc.db::basis.t_language",
								data: testData.oLanguage
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

		it('should not create a company code text', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure([]);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");
			
			const aNewResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aNewResults).toBeDefined();
			expect(aNewResults.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

			let aResults = oMockstarPlc.execQuery(`select * from {{company_code__text}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oCompanyCodeText,
				["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should create a new company code text', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");
			
			const aInputRows = [{
				"COMPANY_CODE_ID": testData.oCompanyCodeText.COMPANY_CODE_ID[4],
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[1],
				"COMPANY_CODE_DESCRIPTION": testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[1],
				"_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "company_code__text");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE],
				"COMPANY_CODE_DESCRIPTION": [aInputRows[0].COMPANY_CODE_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should not create due to DUPLICATE_KEY_COUNT in the input table', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");
			
			const aInputRows = [{
				"COMPANY_CODE_ID": testData.oCompanyCodeText.COMPANY_CODE_ID[4],
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[4],
				"COMPANY_CODE_DESCRIPTION": testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[4],
				"_SOURCE": 2
			},{
				"COMPANY_CODE_ID": testData.oCompanyCodeText.COMPANY_CODE_ID[4],
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[4],
				"COMPANY_CODE_DESCRIPTION": testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[4],
				"_SOURCE": 2
			}];

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{company_code__text}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testData.oCompanyCodeText,
				["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should update an existing company code text', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");
			
			const aInputRows = [{
				"COMPANY_CODE_ID": testData.oCompanyCodeText.COMPANY_CODE_ID[1],
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[1],
				"COMPANY_CODE_DESCRIPTION": testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[1] + ' NEW',
				"_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			
			expect(aBeforeResults).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCodeText.COMPANY_CODE_ID[0], testData.oCompanyCodeText.COMPANY_CODE_ID[1]],
				"LANGUAGE": [testData.oCompanyCodeText.LANGUAGE[0], testData.oCompanyCodeText.LANGUAGE[1]],
				"COMPANY_CODE_DESCRIPTION": [testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[0], testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[1]],
				"_VALID_FROM": [testData.oCompanyCodeText._VALID_FROM[0], testData.oCompanyCodeText._VALID_FROM[1]],
                "_VALID_TO": [testData.oCompanyCodeText._VALID_TO[0], testData.oCompanyCodeText._VALID_TO[1]],
                "_SOURCE": [testData.oCompanyCodeText._SOURCE[0], testData.oCompanyCodeText._SOURCE[1]],
                "_CREATED_BY": [testData.oCompanyCodeText._CREATED_BY[0], testData.oCompanyCodeText._CREATED_BY[1]]
            },["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "company_code__text");
			
			let aResultsCount = oMockstarPlc.execQuery(`select * from {{company_code__text}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aResultsCount).toBeDefined();
			expect(aResultsCount.columns.COMPANY_CODE_ID.rows.length).toEqual(3);

			let aResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE],
				"COMPANY_CODE_DESCRIPTION": [aInputRows[0].COMPANY_CODE_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should not insert a company_code__text if company code does not exist', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");

			const aInputRows = [{
				"COMPANY_CODE_ID": 'CC9',
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[0],
				"COMPANY_CODE_DESCRIPTION": testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[0],
				"_SOURCE": testData.oCompanyCodeText._SOURCE[0]
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code__text}}`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			
			expect(aBeforeResults).toMatchData(testData.oCompanyCodeText,
				["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");
			
			let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();
            expect(aErrorResults).toMatchData({
                "FIELD_NAME": ['COMPANY_CODE_ID'],
                "FIELD_VALUE": [aInputRows[0].COMPANY_CODE_ID],
				"MESSAGE_TEXT": ['Unknown Company Code ID'],
				"MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_company_code__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{company_code__text}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData(testData.oCompanyCodeText,
				["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should not update a company_code__text if language does not exist', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");

			const aInputRows = [{
				"COMPANY_CODE_ID": testData.oCompanyCodeText.COMPANY_CODE_ID[1],
				"LANGUAGE": 'NG',
				"COMPANY_CODE_DESCRIPTION": testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[1],
				"_SOURCE": testData.oCompanyCodeText._SOURCE[1]
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			
			expect(aBeforeResults).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCodeText.COMPANY_CODE_ID[0], testData.oCompanyCodeText.COMPANY_CODE_ID[1]],
				"LANGUAGE": [testData.oCompanyCodeText.LANGUAGE[0], testData.oCompanyCodeText.LANGUAGE[1]],
				"COMPANY_CODE_DESCRIPTION": [testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[0], testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[1]],
				"_VALID_FROM": [testData.oCompanyCodeText._VALID_FROM[0], testData.oCompanyCodeText._VALID_FROM[1]],
                "_VALID_TO": [testData.oCompanyCodeText._VALID_TO[0], testData.oCompanyCodeText._VALID_TO[1]],
                "_SOURCE": [testData.oCompanyCodeText._SOURCE[0], testData.oCompanyCodeText._SOURCE[1]],
                "_CREATED_BY": [testData.oCompanyCodeText._CREATED_BY[0], testData.oCompanyCodeText._CREATED_BY[1]]
            },["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");
			
			let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();
            expect(aErrorResults).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
				"MESSAGE_TEXT": ['Unknown Language for Company Code ID '.concat(aInputRows[0].COMPANY_CODE_ID)],
				"MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_company_code__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			
			expect(aResults).toMatchData({
				"COMPANY_CODE_ID": [testData.oCompanyCodeText.COMPANY_CODE_ID[0], testData.oCompanyCodeText.COMPANY_CODE_ID[1]],
				"LANGUAGE": [testData.oCompanyCodeText.LANGUAGE[0], testData.oCompanyCodeText.LANGUAGE[1]],
				"COMPANY_CODE_DESCRIPTION": [testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[0], testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[1]],
				"_VALID_FROM": [testData.oCompanyCodeText._VALID_FROM[0], testData.oCompanyCodeText._VALID_FROM[1]],
                "_VALID_TO": [testData.oCompanyCodeText._VALID_TO[0], testData.oCompanyCodeText._VALID_TO[1]],
                "_SOURCE": [testData.oCompanyCodeText._SOURCE[0], testData.oCompanyCodeText._SOURCE[1]],
                "_CREATED_BY": [testData.oCompanyCodeText._CREATED_BY[0], testData.oCompanyCodeText._CREATED_BY[1]]
            },["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);
		});

		it('should insert one company code text, update one, skip one due to entry already present in table, add error for invalid company code', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "company_code__text");
			
			const aInputRows = [{
				"COMPANY_CODE_ID": testData.oCompanyCodeText.COMPANY_CODE_ID[4],
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[1],
				"COMPANY_CODE_DESCRIPTION": 'Company code CC3 DE',
				"_SOURCE": 2
			},{
				"COMPANY_CODE_ID": testData.oCompanyCodeText.COMPANY_CODE_ID[0],
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[0],
				"COMPANY_CODE_DESCRIPTION": 'Updated input 1',
				"_SOURCE": 2
			},{
				"COMPANY_CODE_ID": testData.oCompanyCodeText.COMPANY_CODE_ID[1],
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[1],
				"COMPANY_CODE_DESCRIPTION": testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[1],
				"_SOURCE": testData.oCompanyCodeText._SOURCE[1]
			},{
				"COMPANY_CODE_ID": 'CC9',
				"LANGUAGE": testData.oCompanyCodeText.LANGUAGE[0],
				"COMPANY_CODE_DESCRIPTION": testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[0],
				"_SOURCE": testData.oCompanyCodeText._SOURCE[0]
			}];

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

			let aInsertResults1 = oMockstarPlc.execQuery(`select * from {{company_code__text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aInsertResults1).toBeDefined();

			//assert
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "company_code__text");

			let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();
            expect(aErrorResults).toMatchData({
                "FIELD_NAME": ['COMPANY_CODE_ID'],
                "FIELD_VALUE": [aInputRows[3].COMPANY_CODE_ID],
				"MESSAGE_TEXT": ['Unknown Company Code ID'],
				"MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_company_code__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

			let aInsertResults = oMockstarPlc.execQuery(`select * from {{company_code__text}} where COMPANY_CODE_ID = '${aInputRows[0].COMPANY_CODE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}' `);
			expect(aInsertResults).toBeDefined();
			expect(aInsertResults.columns.COMPANY_CODE_ID.rows.length).toEqual(1);

			aInsertResults = mockstarHelpers.convertResultToArray(aInsertResults);
			expect(aInsertResults).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE],
				"COMPANY_CODE_DESCRIPTION": [aInputRows[0].COMPANY_CODE_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);
			
			let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{company_code__text}} where (COMPANY_CODE_ID = '${aInputRows[1].COMPANY_CODE_ID}' and LANGUAGE = '${aInputRows[1].LANGUAGE}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
			expect(aResultsUpdate).toBeDefined();
			expect(aResultsUpdate.columns.COMPANY_CODE_ID.rows.length).toEqual(1);

			aResultsUpdate = mockstarHelpers.convertResultToArray(aResultsUpdate);
			expect(aResultsUpdate).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[1].COMPANY_CODE_ID],
				"LANGUAGE": [aInputRows[1].LANGUAGE],
				"COMPANY_CODE_DESCRIPTION": [aInputRows[1].COMPANY_CODE_DESCRIPTION],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{company_code__text}} where (COMPANY_CODE_ID = '${aInputRows[1].COMPANY_CODE_ID}' and LANGUAGE = '${aInputRows[1].LANGUAGE}') and _VALID_TO > '${sMasterdataTimestamp}' `);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);

			expect(aResultsOld).toMatchData({
				"COMPANY_CODE_ID": [aInputRows[1].COMPANY_CODE_ID],
				"LANGUAGE": [aInputRows[1].LANGUAGE],
				"COMPANY_CODE_DESCRIPTION": [testData.oCompanyCodeText.COMPANY_CODE_DESCRIPTION[0]],
                "_VALID_FROM": [testData.oCompanyCodeText._VALID_FROM[0]],
                "_SOURCE": [testData.oCompanyCodeText._SOURCE[0]],
                "_CREATED_BY": [sCurrentUser]
            },["COMPANY_CODE_ID","LANGUAGE","COMPANY_CODE_DESCRIPTION","_VALID_FROM","_SOURCE","_CREATED_BY"]);

			let aResultsSkip = oMockstarPlc.execQuery(`select * from {{company_code__text}} where ((COMPANY_CODE_ID = '${aInputRows[2].COMPANY_CODE_ID}' and LANGUAGE = '${aInputRows[2].LANGUAGE}') or (COMPANY_CODE_ID = '${aInputRows[3].COMPANY_CODE_ID}' and LANGUAGE = '${aInputRows[3].LANGUAGE}')) and _VALID_FROM > '${sMasterdataTimestamp}' `);
			expect(aResultsSkip).toBeDefined();
			expect(aResultsSkip.columns.COMPANY_CODE_ID.rows.length).toEqual(0);

		});

	}).addTags(["All_Unit_Tests"]);
}