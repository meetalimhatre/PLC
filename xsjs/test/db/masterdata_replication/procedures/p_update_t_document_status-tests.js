const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;

if(jasmine.plcTestRunParameters.mode === 'all'){
    describe('db.masterdata_replication:p_update_t_document_status',function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_document_status", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{	
							document_type:  "sap.plc.db::basis.t_document_type",
							document_status: "sap.plc.db::basis.t_document_status",
							error: "sap.plc.db::map.t_replication_log"
						}
					});
        });
        beforeEach(function() {
			oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
			oMockstarPlc.insertTableData("document_type", testData.oDocumentType);
			oMockstarPlc.insertTableData("document_status", testData.oDocumentStatus);
			oMockstarPlc.insertTableData("error", testData.oError);
        });
		afterEach(function() {
        });
		it('should not create a document status', function() {
			//arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");
            
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");
			let aResults = oMockstarPlc.execQuery(`select * from {{document_status}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0); 	//check no new timestamp is added 

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document_status}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testData.oDocumentStatus,["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});

		it('should create a new document status', function() {
			//arrange

			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT4',
				"DOCUMENT_STATUS_ID": 'S9',
				"_SOURCE": 2
			}];

			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_status}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID],
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            },["DOCUMENT_TYPE_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_status}} where _VALID_FROM < '${sMasterdataTimestamp}'`);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);
			expect(aResultsOld).toMatchData(testData.oDocumentStatus,["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that old data was not changed

		});

		it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
			//arrange

			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT1',
				"DOCUMENT_STATUS_ID": 'S9',
				"_SOURCE": 2
			},{
				"DOCUMENT_TYPE_ID": 'DT1',
				"DOCUMENT_STATUS_ID": 'S9',
				"_SOURCE": 2
			}];

			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_status}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_status}} where _VALID_FROM < '${sMasterdataTimestamp}'`);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);
			expect(aResultsOld).toMatchData(testData.oDocumentStatus,["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that old data was not changed

		});

		it('should update an existing document status', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");

			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT1',
				"DOCUMENT_STATUS_ID": 'S1',
				"_SOURCE": 2
			}];
						
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);

			expect(aBeforeResults).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID, aInputRows[0].DOCUMENT_TYPE_ID],
				"DOCUMENT_STATUS_ID": [testData.oDocumentStatus.DOCUMENT_STATUS_ID[0], testData.oDocumentStatus.DOCUMENT_STATUS_ID[1]],
				"_VALID_FROM": [testData.oDocumentStatus._VALID_FROM[0], testData.oDocumentStatus._VALID_FROM[1]],
				"_VALID_TO": [testData.oDocumentStatus._VALID_TO[0], testData.oDocumentStatus._VALID_TO[1]],
				"_SOURCE": [testData.oDocumentStatus._SOURCE[0], testData.oDocumentStatus._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentStatus._CREATED_BY[0], testData.oDocumentStatus._CREATED_BY[1]]
			},["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);


			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status");
			
			let aResultsCount = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aResultsCount).toBeDefined();
			expect(aResultsCount.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(3);

			let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResultsUpdated).toBeDefined();
			aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);

			expect(aResultsUpdated).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
				"DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);

			expect(aResultsOld).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
				"DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID],
                "_VALID_FROM": [testData.oDocumentStatus._VALID_FROM[1]],
                "_SOURCE": testData.oDocumentStatus._SOURCE[1],
                "_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_SOURCE","_CREATED_BY"]);
		});

		it('should not create a new document status for a unknown document type', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT9',
				"DOCUMENT_STATUS_ID": 'S9',
				"_SOURCE": 2
			}];
			
			var aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");

			let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();

			aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['DOCUMENT_TYPE_ID'],
				"FIELD_VALUE": [aInputRows[0].DOCUMENT_TYPE_ID],
				"MESSAGE_TEXT": ['Unknown Document Type ID for Document Status ID '.concat(aInputRows[0].DOCUMENT_STATUS_ID)],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_status'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);

			var aResults = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);
		});
		
		it('should not create a new document status because of already existing entry in table', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");
			var aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT3',
				"DOCUMENT_STATUS_ID": 'S3',
				"_SOURCE": 1
			}];
			
			var aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(1);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");

			let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document_status}}`);
			expect(aResultsFullTable).toBeDefined();
			aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			expect(aResultsFullTable).toMatchData(testData.oDocumentStatus,["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data
		});

		it('should create one document status, update one, and skip one because of unknown document type', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_status");
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT4',	//insert
				"DOCUMENT_STATUS_ID": 'S9',
				"_SOURCE": 2
			},{
				"DOCUMENT_TYPE_ID": 'DT1',	//update
				"DOCUMENT_STATUS_ID": 'S1',
				"_SOURCE": 2
			},{
				"DOCUMENT_TYPE_ID": 'DT9',	//skip 
				"DOCUMENT_STATUS_ID": 'S8',
				"_SOURCE": 3
			}];

			var aBeforeInsert = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeInsert).toBeDefined();
			expect(aBeforeInsert.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			var aBeforeUpdate = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}' and DOCUMENT_STATUS_ID = '${aInputRows[1].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeUpdate).toBeDefined();
			expect(aBeforeUpdate.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(2);
			aBeforeUpdate = mockstarHelpers.convertResultToArray(aBeforeUpdate);

			expect(aBeforeUpdate).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[1].DOCUMENT_TYPE_ID, aInputRows[1].DOCUMENT_TYPE_ID],
				"DOCUMENT_STATUS_ID": [aInputRows[1].DOCUMENT_STATUS_ID, aInputRows[1].DOCUMENT_STATUS_ID],
				"_VALID_FROM": [testData.oDocumentStatus._VALID_FROM[0], testData.oDocumentStatus._VALID_FROM[1]],
				"_VALID_TO": [testData.oDocumentStatus._VALID_TO[0], testData.oDocumentStatus._VALID_TO[1]],
				"_SOURCE": [testData.oDocumentStatus._SOURCE[0], testData.oDocumentStatus._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentStatus._CREATED_BY[0], testData.oDocumentStatus._CREATED_BY[1]]
			},["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]);

			var aBeforeSkip = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and DOCUMENT_STATUS_ID = '${aInputRows[2].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeSkip).toBeDefined();
			expect(aBeforeSkip.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_status");
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");

			var aAfterInsertResults = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aAfterInsertResults).toBeDefined();
			expect(aAfterInsertResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(1);

			aAfterInsertResults = mockstarHelpers.convertResultToArray(aAfterInsertResults);
			expect(aAfterInsertResults).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
				"DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aAfterUpdateResultsNew = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}'  and DOCUMENT_STATUS_ID = '${aInputRows[1].DOCUMENT_STATUS_ID}'  and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aAfterUpdateResultsNew).toBeDefined();
			expect(aAfterUpdateResultsNew.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(1); 

			aAfterUpdateResultsNew = mockstarHelpers.convertResultToArray(aAfterUpdateResultsNew);
			expect(aAfterUpdateResultsNew).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[1].DOCUMENT_TYPE_ID],
				"DOCUMENT_STATUS_ID": [aInputRows[1].DOCUMENT_STATUS_ID],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[1]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aAfterUpdateResultsold = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}'  and DOCUMENT_STATUS_ID = '${aInputRows[1].DOCUMENT_STATUS_ID}'  and _VALID_TO > '${sMasterdataTimestamp}'`);
			expect(aAfterUpdateResultsold).toBeDefined();
			expect(aAfterUpdateResultsold.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(1); 

			aAfterUpdateResultsold = mockstarHelpers.convertResultToArray(aAfterUpdateResultsold);
			expect(aAfterUpdateResultsold).toMatchData({
                "DOCUMENT_TYPE_ID": [testData.oDocumentStatus.DOCUMENT_TYPE_ID[1]],
				"DOCUMENT_STATUS_ID": [testData.oDocumentStatus.DOCUMENT_STATUS_ID[1]],
				"_VALID_FROM": [testData.oDocumentStatus._VALID_FROM[1]],
				"_SOURCE": [testData.oDocumentStatus._SOURCE[1]],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","DOCUMENT_STATUS_ID","_VALID_FROM","_SOURCE","_CREATED_BY"]);

			var aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();

			aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['DOCUMENT_TYPE_ID'],
				"FIELD_VALUE": [aInputRows[2].DOCUMENT_TYPE_ID],
				"MESSAGE_TEXT": ['Unknown Document Type ID for Document Status ID '.concat(aInputRows[2].DOCUMENT_STATUS_ID)],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_status'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);

			var aAfterSkip = oMockstarPlc.execQuery(`select * from {{document_status}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and DOCUMENT_STATUS_ID = '${aInputRows[2].DOCUMENT_STATUS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aAfterSkip).toBeDefined();
			expect(aAfterSkip.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

		});

    }).addTags(["All_Unit_Tests"]);
}