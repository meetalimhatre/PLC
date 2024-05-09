var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstarHelpers = require("../../../testtools/mockstar_helpers");
var testData = require("../../../testdata/testdata_replication").data;

if(jasmine.plcTestRunParameters.mode === 'all'){
    describe('db.masterdata_replication:p_update_t_document_status__text',function() {

        var oMockstarPlc = null;
        var sCurrentUser = $.session.getUsername();
        var sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_document_status__text", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{	                            
                            document_status: "sap.plc.db::basis.t_document_status",
                            document_status_text: "sap.plc.db::basis.t_document_status__text",
                            language: "sap.plc.db::basis.t_language",
                            error: "sap.plc.db::map.t_replication_log"
						}
					});
        });
        beforeEach(function() {
			oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
			oMockstarPlc.insertTableData("document_status", testData.oDocumentStatus);
			oMockstarPlc.insertTableData("document_status_text", testData.oDocumentStatusText);
			oMockstarPlc.insertTableData("language", testData.oLanguage);
        });
		afterEach(function() {
        });
        
		it('should not create a document status text', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");
            
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            
			// //assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			let aResults = oMockstarPlc.execQuery(`select * from {{document_status_text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            
			expect(aResults).toBeDefined();
            expect(aResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);
		 });
		 
		 it('should create a document status text', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");
			
			const aInputRows = [{
				"DOCUMENT_STATUS_ID": 'S1',
				"LANGUAGE": 'ZZ',
				"DOCUMENT_STATUS_DESCRIPTION": 'Test Create S1',
				"_SOURCE": 2
			}];

			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            
			// //assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_status_text");
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
 			var aResults = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			
			expect(aResults).toBeDefined();
			expect(aResults).toMatchData({
                "DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE],
				"DOCUMENT_STATUS_DESCRIPTION": [aInputRows[0].DOCUMENT_STATUS_DESCRIPTION],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);
			
			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_status_text}} where _VALID_FROM < '${sMasterdataTimestamp}'`);
			
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);
			expect(aResultsOld).toMatchData(testData.oDocumentStatusText,["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the old data was not changed
 		});

		it('should update an existing document status text', function() {

			//arrange
			var aInputRows = [{
				"DOCUMENT_STATUS_ID": 'S1',
				"LANGUAGE": 'EN',
				"DOCUMENT_STATUS_DESCRIPTION": 'Test Update S1',
				"_SOURCE": 2
			}];

			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
            
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			expect(aBeforeResults).toMatchData({
                "DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID,aInputRows[0].DOCUMENT_STATUS_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE,aInputRows[0].LANGUAGE],
				"DOCUMENT_STATUS_DESCRIPTION": [testData.oDocumentStatusText.DOCUMENT_STATUS_DESCRIPTION[0],testData.oDocumentStatusText.DOCUMENT_STATUS_DESCRIPTION[1]],
				"_VALID_FROM": [testData.oDocumentStatusText._VALID_FROM[0], testData.oDocumentStatusText._VALID_FROM[1]],
				"_VALID_TO": [testData.oDocumentStatusText._VALID_TO[0], testData.oDocumentStatusText._VALID_TO[1]],
				"_SOURCE": [testData.oDocumentStatusText._SOURCE[0],testData.oDocumentStatusText._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentStatusText._CREATED_BY[0],testData.oDocumentStatusText._CREATED_BY[1]]
			},["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_status_text");
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

			let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			
			expect(aResultsUpdated).toBeDefined();
			aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);

			expect(aResultsUpdated).toMatchData({
				"DOCUMENT_STATUS_ID":               [aInputRows[0].DOCUMENT_STATUS_ID],
				"LANGUAGE":                         [aInputRows[0].LANGUAGE],
				"DOCUMENT_STATUS_DESCRIPTION":      [aInputRows[0].DOCUMENT_STATUS_DESCRIPTION],
				"_VALID_TO":                        [null],
				"_SOURCE":                          [aInputRows[0]._SOURCE],
				"_CREATED_BY": 						[sCurrentUser]
			},["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);


			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}' and _VALID_FROM < '${sMasterdataTimestamp}'`);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);
			expect(aResultsOld).toMatchData({
                "DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID,aInputRows[0].DOCUMENT_STATUS_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE,aInputRows[0].LANGUAGE],
				"DOCUMENT_STATUS_DESCRIPTION": [testData.oDocumentStatusText.DOCUMENT_STATUS_DESCRIPTION[0],testData.oDocumentStatusText.DOCUMENT_STATUS_DESCRIPTION[1]],
				"_VALID_FROM": [testData.oDocumentStatusText._VALID_FROM[0], testData.oDocumentStatusText._VALID_FROM[1]],
				"_SOURCE": [testData.oDocumentStatusText._SOURCE[0],testData.oDocumentStatusText._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentStatusText._CREATED_BY[0],sCurrentUser]
			},["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_FROM","_SOURCE","_CREATED_BY"]);
        });

        it('should return error Unknown Language', function() {

			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");

			var aInputRows = [{
                "DOCUMENT_STATUS_ID": 'S1',
                "LANGUAGE": '88',
                "DOCUMENT_STATUS_DESCRIPTION": 'Test Update S1',
                "_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			expect(aBeforeResults).toMatchData({
                "DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID,aInputRows[0].DOCUMENT_STATUS_ID,aInputRows[0].DOCUMENT_STATUS_ID],
				"LANGUAGE": [testData.oDocumentStatusText.LANGUAGE[0],testData.oDocumentStatusText.LANGUAGE[1],testData.oDocumentStatusText.LANGUAGE[2]],
				"DOCUMENT_STATUS_DESCRIPTION": [testData.oDocumentStatusText.DOCUMENT_STATUS_DESCRIPTION[0],testData.oDocumentStatusText.DOCUMENT_STATUS_DESCRIPTION[1],testData.oDocumentStatusText.DOCUMENT_STATUS_DESCRIPTION[2]],
				"_VALID_FROM": [testData.oDocumentStatusText._VALID_FROM[0], testData.oDocumentStatusText._VALID_FROM[1], testData.oDocumentStatusText._VALID_FROM[2]],
				"_VALID_TO": [testData.oDocumentStatusText._VALID_TO[0], testData.oDocumentStatusText._VALID_TO[1], testData.oDocumentStatusText._VALID_TO[2]],
				"_SOURCE": [testData.oDocumentStatusText._SOURCE[0],testData.oDocumentStatusText._SOURCE[1],testData.oDocumentStatusText._SOURCE[2]],
				"_CREATED_BY": [testData.oDocumentStatusText._CREATED_BY[0],testData.oDocumentStatusText._CREATED_BY[1],testData.oDocumentStatusText._CREATED_BY[2]]
			},["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_FROM","_SOURCE","_CREATED_BY"]);


			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			 mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			 mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");
			
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);

			expect(aErrorResults).toBeDefined();
			aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['LANGUAGE'],
				"FIELD_VALUE": [aInputRows[0].LANGUAGE],
				"MESSAGE_TEXT": ['Unknown Language for Document Status ID '.concat(aInputRows[0].DOCUMENT_STATUS_ID)],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_status__text'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_status_text}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oDocumentStatusText,["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});
		
        it('should return error Unknown Document Status ID', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");

			var aInputRows = [{
                "DOCUMENT_STATUS_ID": 'S9',
                "LANGUAGE": 'ZZ',
                "DOCUMENT_STATUS_DESCRIPTION": 'Test Unknown Document Status ID',
                "_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			 mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			 mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");
			
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);

			expect(aErrorResults).toBeDefined();
			aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['DOCUMENT_STATUS_ID'],
				"FIELD_VALUE": [aInputRows[0].DOCUMENT_STATUS_ID],
				"MESSAGE_TEXT": ['Unknown Document Status ID'],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_status__text'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_status_text}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oDocumentStatusText,["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});

		it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
			//arrange
			const aInputRows = [{
				"DOCUMENT_STATUS_ID": 'S1',
				"LANGUAGE": 'ZZ',
				"DOCUMENT_STATUS_DESCRIPTION": 'Test Create DT1',
				"_SOURCE": 2
			},{
				"DOCUMENT_STATUS_ID": 'S1',
				"LANGUAGE": 'ZZ',
				"DOCUMENT_STATUS_DESCRIPTION": 'Test Create DT1',
				"_SOURCE": 2
			}];
			
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);
			
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			 mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");
			 mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			 
			 let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document_status_text}}`);
			 expect(aResultsFullTable).toBeDefined();
			 aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			 expect(aResultsFullTable).toMatchData(testData.oDocumentStatusText,["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data
		});

		it('should insert two entries, should update one, should skip one for not finding the language', function() {
			//arrange
			const aInputRows = [{
				"DOCUMENT_STATUS_ID": 'S1', //Insert
				"LANGUAGE": 'ZZ',
				"DOCUMENT_STATUS_DESCRIPTION": 'S1 ZZ',
				"_SOURCE": 1
			},{
				"DOCUMENT_STATUS_ID": 'S2', //Insert
				"LANGUAGE": 'ZZ',
				"DOCUMENT_STATUS_DESCRIPTION": 'S2 ZZ',
				"_SOURCE": 1
			},{
				"DOCUMENT_STATUS_ID": 'S3', //Update
				"LANGUAGE": 'EN',
				"DOCUMENT_STATUS_DESCRIPTION": 'S3 EN',
				"_SOURCE": 2
			},{
				"DOCUMENT_STATUS_ID": 'S1', //Skipped
				"LANGUAGE": '88',
				"DOCUMENT_STATUS_DESCRIPTION": 'S1 88',
				"_SOURCE": 2
			}];
			
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_status_text");

			let aBeforeInsert1Results = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aBeforeInsert1Results).toBeDefined();
			expect(aBeforeInsert1Results.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			let aBeforeInsert2Results = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[1].DOCUMENT_STATUS_ID}' and LANGUAGE = '${aInputRows[1].LANGUAGE}'`);
			expect(aBeforeInsert2Results).toBeDefined();
			expect(aBeforeInsert2Results.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(0);

			let aBeforeUpdateResults = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[2].DOCUMENT_STATUS_ID}' and LANGUAGE = '${aInputRows[2].LANGUAGE}'`);
			expect(aBeforeUpdateResults).toBeDefined();
			expect(aBeforeUpdateResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(1);
			
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(3);
			mockstarHelpers.checkRowCount(oMockstarPlc, 9, "document_status_text");
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			 
			let aAfterInsertResults = oMockstarPlc.execQuery(`select * from {{document_status_text}} where (DOCUMENT_STATUS_ID = '${aInputRows[0].DOCUMENT_STATUS_ID}' or DOCUMENT_STATUS_ID = '${aInputRows[1].DOCUMENT_STATUS_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aAfterInsertResults).toBeDefined();
			expect(aAfterInsertResults.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(2); 

			aAfterInsertResults = mockstarHelpers.convertResultToArray(aAfterInsertResults);
			expect(aAfterInsertResults).toMatchData({
                "DOCUMENT_STATUS_ID": [aInputRows[0].DOCUMENT_STATUS_ID,aInputRows[1].DOCUMENT_STATUS_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE,aInputRows[1].LANGUAGE],
				"DOCUMENT_STATUS_DESCRIPTION": [aInputRows[0].DOCUMENT_STATUS_DESCRIPTION,aInputRows[1].DOCUMENT_STATUS_DESCRIPTION],
				"_VALID_TO": [null,null],
				"_SOURCE": [aInputRows[0]._SOURCE,aInputRows[1]._SOURCE],
				"_CREATED_BY": [sCurrentUser,sCurrentUser]
			},["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aAfterUpdateResultsNew = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[2].DOCUMENT_STATUS_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' and LANGUAGE = '${aInputRows[2].LANGUAGE}'`);
			expect(aAfterUpdateResultsNew).toBeDefined();
			expect(aAfterUpdateResultsNew.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(1); 

			aAfterUpdateResultsNew = mockstarHelpers.convertResultToArray(aAfterUpdateResultsNew);
			expect(aAfterUpdateResultsNew).toMatchData({
                "DOCUMENT_STATUS_ID": [aInputRows[2].DOCUMENT_STATUS_ID],
				"LANGUAGE": [aInputRows[2].LANGUAGE],
				"DOCUMENT_STATUS_DESCRIPTION": [aInputRows[2].DOCUMENT_STATUS_DESCRIPTION],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[2]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aAfterUpdateResultsOld = oMockstarPlc.execQuery(`select * from {{document_status_text}} where DOCUMENT_STATUS_ID = '${aInputRows[2].DOCUMENT_STATUS_ID}' and _VALID_TO > '${sMasterdataTimestamp}' and LANGUAGE = '${aInputRows[2].LANGUAGE}'`);
			expect(aAfterUpdateResultsOld).toBeDefined();
			expect(aAfterUpdateResultsOld.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(1); 

			aAfterUpdateResultsOld = mockstarHelpers.convertResultToArray(aAfterUpdateResultsOld);
			expect(aAfterUpdateResultsOld).toMatchData({
                "DOCUMENT_STATUS_ID": [aInputRows[2].DOCUMENT_STATUS_ID],
				"LANGUAGE": [aInputRows[2].LANGUAGE],
				"DOCUMENT_STATUS_DESCRIPTION": [testData.oDocumentStatusText.DOCUMENT_STATUS_DESCRIPTION[5]],
				"_VALID_FROM": [testData.oDocumentStatusText._VALID_FROM[5]],
				"_SOURCE": [testData.oDocumentStatusText._SOURCE[5]],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_STATUS_ID","LANGUAGE","DOCUMENT_STATUS_DESCRIPTION","_VALID_FROM","_SOURCE","_CREATED_BY"]);

		   let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);

		   expect(aErrorResults).toBeDefined();
		   aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
		   expect(aErrorResults).toMatchData({
			   "FIELD_NAME": ['LANGUAGE'],
			   "FIELD_VALUE": [aInputRows[3].LANGUAGE],
			   "MESSAGE_TEXT": ['Unknown Language for Document Status ID '.concat(aInputRows[3].DOCUMENT_STATUS_ID)],
			   "MESSAGE_TYPE": ['ERROR'],
			   "TABLE_NAME": ['t_document_status__text'],
		   },["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);

		});
		
    }).addTags(["All_Unit_Tests"]);
}