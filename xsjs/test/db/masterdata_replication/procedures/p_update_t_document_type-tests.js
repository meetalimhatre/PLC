const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;

if(jasmine.plcTestRunParameters.mode === 'all'){
    describe('db.masterdata_replication:p_update_t_document_type',function() {
        
        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_document_type", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{	
							document_type: {
								name: "sap.plc.db::basis.t_document_type",
								data: testData.oDocumentType
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
		
		it('should not create a document type', function() {
			//arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_type");
            
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_type");
			let aResults = oMockstarPlc.execQuery(`select * from {{document_type}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0); 	//check no new timestamp is added 

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document_type}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testData.oDocumentType,["DOCUMENT_TYPE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});

		it('should create a new document type', function() {
			//arrange

			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT9',
				"_SOURCE": 2
			}];

			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_type");
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_type}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["DOCUMENT_TYPE_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_type}} where _VALID_FROM < '${sMasterdataTimestamp}'`);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);
			expect(aResultsOld).toMatchData(testData.oDocumentType,["DOCUMENT_TYPE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that old data was not changed

		});

		it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_type");
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT9',
				"_SOURCE": 2
			},
			{
				"DOCUMENT_TYPE_ID": 'DT9',
				"_SOURCE": 2
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_type");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_type}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document_type}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testData.oDocumentType,["DOCUMENT_TYPE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});

		it('should update an existing document type', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_type");
			
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT2',
				"_SOURCE": 3
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);

			expect(aBeforeResults).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID, aInputRows[0].DOCUMENT_TYPE_ID],
				"_VALID_FROM": [testData.oDocumentType._VALID_FROM[2], testData.oDocumentType._VALID_FROM[3]],
				"_VALID_TO": [testData.oDocumentType._VALID_TO[2], testData.oDocumentType._VALID_TO[3]],
				"_SOURCE": [testData.oDocumentType._SOURCE[2], testData.oDocumentType._SOURCE[3]],
				"_CREATED_BY": [testData.oDocumentType._CREATED_BY[2], testData.oDocumentType._CREATED_BY[3]]
			},["DOCUMENT_TYPE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);


			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type");
			
			let aResultsCount = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aResultsCount).toBeDefined();
			expect(aResultsCount.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(3);

			let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResultsUpdated).toBeDefined();
			aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);

			expect(aResultsUpdated).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);

			expect(aResultsOld).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
                "_VALID_FROM": [testData.oDocumentType._VALID_FROM[3]],
                "_SOURCE": testData.oDocumentType._SOURCE[3],
                "_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","_VALID_FROM","_SOURCE","_CREATED_BY"]);

		});

		it('should insert two document types, update two, and skip one due to entry already present in table', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_type");

			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT7', //Insert
				"_SOURCE": 2
			},
			{
				"DOCUMENT_TYPE_ID": 'DT8', //Insert
				"_SOURCE": 2
			},
			{
				"DOCUMENT_TYPE_ID": 'DT2', //Update
				"_SOURCE": 3
			},
			{
				"DOCUMENT_TYPE_ID": 'DT3', //Update
				"_SOURCE": 3
			},
			{
				"DOCUMENT_TYPE_ID": 'DT1', //Fail
				"_SOURCE": 1
			},];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' or DOCUMENT_TYPE_ID = '${aInputRows[3].DOCUMENT_TYPE_ID}' `);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);

			expect(aBeforeResults).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[2].DOCUMENT_TYPE_ID, aInputRows[2].DOCUMENT_TYPE_ID, aInputRows[3].DOCUMENT_TYPE_ID],
				"_VALID_FROM": [testData.oDocumentType._VALID_FROM[2], testData.oDocumentType._VALID_FROM[3],testData.oDocumentType._VALID_FROM[4]],
				"_VALID_TO": [testData.oDocumentType._VALID_TO[2], testData.oDocumentType._VALID_TO[3], testData.oDocumentType._VALID_TO[4]],
				"_SOURCE": [testData.oDocumentType._SOURCE[2], testData.oDocumentType._SOURCE[3], testData.oDocumentType._SOURCE[4]],
				"_CREATED_BY": [testData.oDocumentType._CREATED_BY[2], testData.oDocumentType._CREATED_BY[3], testData.oDocumentType._CREATED_BY[4]]
			},["DOCUMENT_TYPE_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
			mockstarHelpers.checkRowCount(oMockstarPlc, 10, "document_type");
			
			let aResultsNew = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' or  DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}'`);
			expect(aResultsNew).toBeDefined();
			expect(aResultsNew.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(2);

			expect(aResultsNew).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[1].DOCUMENT_TYPE_ID],
                "_VALID_TO": [null,null],
                "_SOURCE": [aInputRows[0]._SOURCE,aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser,sCurrentUser]
			},["DOCUMENT_TYPE_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsUpdate = oMockstarPlc.execQuery(`select * from {{document_type}} where (DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' or  DOCUMENT_TYPE_ID = '${aInputRows[3].DOCUMENT_TYPE_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
			expect(aResultsUpdate).toBeDefined();
			expect(aResultsUpdate.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(2);
	
			expect(aResultsUpdate).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[2].DOCUMENT_TYPE_ID,aInputRows[3].DOCUMENT_TYPE_ID],
                "_VALID_TO": [null,null],
                "_SOURCE": [aInputRows[2]._SOURCE,aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser,sCurrentUser]
			},["DOCUMENT_TYPE_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_type}} where (DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' or  DOCUMENT_TYPE_ID = '${aInputRows[3].DOCUMENT_TYPE_ID}') and _VALID_TO > '${sMasterdataTimestamp}' `);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);

			expect(aResultsOld).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[2].DOCUMENT_TYPE_ID,aInputRows[3].DOCUMENT_TYPE_ID],
                "_VALID_FROM": [testData.oDocumentType._VALID_FROM[3],testData.oDocumentType._VALID_FROM[4]],
                "_SOURCE": [testData.oDocumentType._SOURCE[3],testData.oDocumentType._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser,sCurrentUser]
			},["DOCUMENT_TYPE_ID","_VALID_FROM","_SOURCE","_CREATED_BY"]);

			let aResultsSkip = oMockstarPlc.execQuery(`select * from {{document_type}} where DOCUMENT_TYPE_ID = '${aInputRows[4].DOCUMENT_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' `);
			expect(aResultsSkip).toBeDefined();
			expect(aResultsSkip.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

		});
		
    }).addTags(["All_Unit_Tests"]);
}