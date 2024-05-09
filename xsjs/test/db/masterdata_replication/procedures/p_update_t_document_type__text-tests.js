const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;

if(jasmine.plcTestRunParameters.mode === 'all'){
    describe('db.masterdata_replication:p_update_t_document_type__text',function() {
        
        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_document_type__text", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{	    
							document_type: {
								name: "sap.plc.db::basis.t_document_type",
								data: testData.oDocumentType
							}, 
							document_type_text: {
								name: "sap.plc.db::basis.t_document_type__text",
								data: testData.oDocumentTypeText
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
        
		it('should not create a document type text', function() {
			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_type");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");
            
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            
			// //assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			 mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");
			 mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			 let aResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            
			 expect(aResults).toBeDefined();
			 expect(aResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0); //check no new timestamp is added 
			 
			 let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document_type_text}}`);
			 expect(aResultsFullTable).toBeDefined();
			 aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			 expect(aResultsFullTable).toMatchData(testData.oDocumentTypeText,["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data
		 });
		 
		it('should create a document type text', function() {
			//arrange
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT1',
				"LANGUAGE": 'ZZ',
				"DOCUMENT_TYPE_DESCRIPTION": 'Test Create DT1',
				"_SOURCE": 2
			}];
			
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);
			
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
			 mockstarHelpers.checkRowCount(oMockstarPlc, 8, "document_type_text");
			 mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
 			let aResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			
			expect(aResults).toBeDefined();
			expect(aResults).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE],
				"DOCUMENT_TYPE_DESCRIPTION": [aInputRows[0].DOCUMENT_TYPE_DESCRIPTION],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);
			
			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_type_text}} where _VALID_FROM < '${sMasterdataTimestamp}'`);
			
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);
			expect(aResultsOld).toMatchData(testData.oDocumentTypeText,["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the old data was not changed
 		});

		it('should update an existing document type text', function() {
			//arrange
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT1',
				"LANGUAGE": 'EN',
				"DOCUMENT_TYPE_DESCRIPTION": 'Test Update DT1',
				"_SOURCE": 2
			}];

			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
            
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			expect(aBeforeResults).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[0].DOCUMENT_TYPE_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE,aInputRows[0].LANGUAGE],
				"DOCUMENT_TYPE_DESCRIPTION": [testData.oDocumentTypeText.DOCUMENT_TYPE_DESCRIPTION[0],testData.oDocumentTypeText.DOCUMENT_TYPE_DESCRIPTION[1]],
				"_VALID_FROM": [testData.oDocumentTypeText._VALID_FROM[0], testData.oDocumentTypeText._VALID_FROM[1]],
				"_VALID_TO": [testData.oDocumentTypeText._VALID_TO[0], testData.oDocumentTypeText._VALID_TO[1]],
				"_SOURCE": [testData.oDocumentTypeText._SOURCE[0],testData.oDocumentTypeText._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentTypeText._CREATED_BY[0],testData.oDocumentTypeText._CREATED_BY[1]]
			},["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
			mockstarHelpers.checkRowCount(oMockstarPlc, 8, "document_type_text");
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

			let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			
			expect(aResultsUpdated).toBeDefined();
			aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);
			expect(aResultsUpdated).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE],
				"DOCUMENT_TYPE_DESCRIPTION": [aInputRows[0].DOCUMENT_TYPE_DESCRIPTION],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);


			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}' and _VALID_FROM < '${sMasterdataTimestamp}'`);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);
			expect(aResultsOld).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[0].DOCUMENT_TYPE_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE,aInputRows[0].LANGUAGE],
				"DOCUMENT_TYPE_DESCRIPTION": [testData.oDocumentTypeText.DOCUMENT_TYPE_DESCRIPTION[0],testData.oDocumentTypeText.DOCUMENT_TYPE_DESCRIPTION[1]],
				"_VALID_FROM": [testData.oDocumentTypeText._VALID_FROM[0], testData.oDocumentTypeText._VALID_FROM[1]],
				"_SOURCE": [testData.oDocumentTypeText._SOURCE[0],testData.oDocumentTypeText._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentTypeText._CREATED_BY[0],sCurrentUser]
			},["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_SOURCE","_CREATED_BY"]);
        });

        it('should not update a document type text if language does not exist ', function() {

			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");

			const aInputRows = [{
                "DOCUMENT_TYPE_ID": 'DT1',
                "LANGUAGE": '88',
                "DOCUMENT_TYPE_DESCRIPTION": 'Test Update DT1',
                "_SOURCE": 2
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			expect(aBeforeResults).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[0].DOCUMENT_TYPE_ID],
				"LANGUAGE": [testData.oDocumentTypeText.LANGUAGE[0],testData.oDocumentTypeText.LANGUAGE[1],testData.oDocumentTypeText.LANGUAGE[2]],
				"DOCUMENT_TYPE_DESCRIPTION": [testData.oDocumentTypeText.DOCUMENT_TYPE_DESCRIPTION[0],testData.oDocumentTypeText.DOCUMENT_TYPE_DESCRIPTION[1],testData.oDocumentTypeText.DOCUMENT_TYPE_DESCRIPTION[2]],
				"_VALID_FROM": [testData.oDocumentTypeText._VALID_FROM[0], testData.oDocumentTypeText._VALID_FROM[1], testData.oDocumentTypeText._VALID_FROM[2]],
				"_VALID_TO": [testData.oDocumentTypeText._VALID_TO[0], testData.oDocumentTypeText._VALID_TO[1], testData.oDocumentTypeText._VALID_TO[2]],
				"_SOURCE": [testData.oDocumentTypeText._SOURCE[0],testData.oDocumentTypeText._SOURCE[1],testData.oDocumentTypeText._SOURCE[2]],
				"_CREATED_BY": [testData.oDocumentTypeText._CREATED_BY[0],testData.oDocumentTypeText._CREATED_BY[1],testData.oDocumentTypeText._CREATED_BY[2]]
			},["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_SOURCE","_CREATED_BY"]);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			 mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			 mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");
			
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);

			expect(aErrorResults).toBeDefined();
			aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['LANGUAGE'],
				"FIELD_VALUE": [aInputRows[0].LANGUAGE],
				"MESSAGE_TEXT": ['Unknown Language for Document Type ID '.concat(aInputRows[0].DOCUMENT_TYPE_ID)],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_type__text'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_type_text}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oDocumentTypeText,["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});
		
        it('should not update a document type text if document type does not exist ', function() {

			//arrange
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");

			const aInputRows = [{
                "DOCUMENT_TYPE_ID": 'DT9',
                "LANGUAGE": 'EN',
                "DOCUMENT_TYPE_DESCRIPTION": 'Test Update DT9',
                "_SOURCE": 2
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");
			
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['DOCUMENT_TYPE_ID'],
				"FIELD_VALUE": [aInputRows[0].DOCUMENT_TYPE_ID],
				"MESSAGE_TEXT": ['Unknown Document Type ID'],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_type__text'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_type_text}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oDocumentTypeText,["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data
		});

		it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
			//arrange
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT1',
				"LANGUAGE": 'ZZ',
				"DOCUMENT_TYPE_DESCRIPTION": 'Test Create DT1',
				"_SOURCE": 2
			},{
				"DOCUMENT_TYPE_ID": 'DT1',
				"LANGUAGE": 'ZZ',
				"DOCUMENT_TYPE_DESCRIPTION": 'Test Create DT1',
				"_SOURCE": 2
			}];
			
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);
			
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
			 mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");
			 mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			 
			 let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{document_type_text}}`);
			 expect(aResultsFullTable).toBeDefined();
			 aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
			 expect(aResultsFullTable).toMatchData(testData.oDocumentTypeText,["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data
		});

		it('should do two inserts, and fail an update due to entry already in the table', function() {
			//arrange
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT1', //Insert
				"LANGUAGE": 'ZZ',
				"DOCUMENT_TYPE_DESCRIPTION": 'DT1 ZZ',
				"_SOURCE": 1
			},{
				"DOCUMENT_TYPE_ID": 'DT2', //Insert
				"LANGUAGE": 'ZZ',
				"DOCUMENT_TYPE_DESCRIPTION": 'DT2 ZZ',
				"_SOURCE": 1
			},{
				"DOCUMENT_TYPE_ID": 'DT1', //Insert Fail
				"LANGUAGE": 'EN',
				"DOCUMENT_TYPE_DESCRIPTION": 'DT1 EN',
				"_SOURCE": 1
			}];
			
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");

			let aBeforeInsert1Results = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aBeforeInsert1Results).toBeDefined();
			expect(aBeforeInsert1Results.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			let aBeforeInsert2Results = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[1].LANGUAGE}'`);
			expect(aBeforeInsert2Results).toBeDefined();
			expect(aBeforeInsert2Results.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			let aBeforeInsert3Results = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[2].LANGUAGE}'`);
			expect(aBeforeInsert3Results).toBeDefined();
			expect(aBeforeInsert3Results.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(2);
			
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
			 mockstarHelpers.checkRowCount(oMockstarPlc, 9, "document_type_text");
			 mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

			 let aAfterInsertResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where (DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' or DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			 expect(aAfterInsertResults).toBeDefined();
			 expect(aAfterInsertResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(2); 
 
			 aAfterInsertResults = mockstarHelpers.convertResultToArray(aAfterInsertResults);
			 expect(aAfterInsertResults).toMatchData({
				 "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[1].DOCUMENT_TYPE_ID],
				 "LANGUAGE": [aInputRows[0].LANGUAGE,aInputRows[1].LANGUAGE],
				 "DOCUMENT_TYPE_DESCRIPTION": [aInputRows[0].DOCUMENT_TYPE_DESCRIPTION,aInputRows[1].DOCUMENT_TYPE_DESCRIPTION],
				 "_VALID_TO": [null,null],
				 "_SOURCE": [aInputRows[0]._SOURCE,aInputRows[1]._SOURCE],
				 "_CREATED_BY": [sCurrentUser,sCurrentUser]
			 },["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);

			 let aAfterInsert3Results = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[2].LANGUAGE}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			 expect(aAfterInsert3Results).toBeDefined();
			 expect(aAfterInsert3Results.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);
			 
			 
		});

		it('should insert two entries, should update one, should skip one for not finding the language', function() {
			//arrange
			const aInputRows = [{
				"DOCUMENT_TYPE_ID": 'DT1', //Insert
				"LANGUAGE": 'ZZ',
				"DOCUMENT_TYPE_DESCRIPTION": 'DT1 ZZ',
				"_SOURCE": 1
			},{
				"DOCUMENT_TYPE_ID": 'DT2', //Insert
				"LANGUAGE": 'ZZ',
				"DOCUMENT_TYPE_DESCRIPTION": 'DT2 ZZ',
				"_SOURCE": 1
			},{
				"DOCUMENT_TYPE_ID": 'DT3', //Update
				"LANGUAGE": 'EN',
				"DOCUMENT_TYPE_DESCRIPTION": 'DT3 EN',
				"_SOURCE": 2
			},{
				"DOCUMENT_TYPE_ID": 'DT1', //Skipped
				"LANGUAGE": '88',
				"DOCUMENT_TYPE_DESCRIPTION": 'DT1 88',
				"_SOURCE": 2
			}];
			
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_type_text");

			let aBeforeInsert1Results = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aBeforeInsert1Results).toBeDefined();
			expect(aBeforeInsert1Results.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			let aBeforeInsert2Results = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[1].LANGUAGE}'`);
			expect(aBeforeInsert2Results).toBeDefined();
			expect(aBeforeInsert2Results.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			let aBeforeUpdateResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and LANGUAGE = '${aInputRows[2].LANGUAGE}'`);
			expect(aBeforeUpdateResults).toBeDefined();
			expect(aBeforeUpdateResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(1);
			
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(3);
			mockstarHelpers.checkRowCount(oMockstarPlc, 10, "document_type_text");
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
			 
			let aAfterInsertResults = oMockstarPlc.execQuery(`select * from {{document_type_text}} where (DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' or DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' and LANGUAGE = '${aInputRows[0].LANGUAGE}'`);
			expect(aAfterInsertResults).toBeDefined();
			expect(aAfterInsertResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(2); 

			aAfterInsertResults = mockstarHelpers.convertResultToArray(aAfterInsertResults);
			expect(aAfterInsertResults).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[1].DOCUMENT_TYPE_ID],
				"LANGUAGE": [aInputRows[0].LANGUAGE,aInputRows[1].LANGUAGE],
				"DOCUMENT_TYPE_DESCRIPTION": [aInputRows[0].DOCUMENT_TYPE_DESCRIPTION,aInputRows[1].DOCUMENT_TYPE_DESCRIPTION],
				"_VALID_TO": [null,null],
				"_SOURCE": [aInputRows[0]._SOURCE,aInputRows[1]._SOURCE],
				"_CREATED_BY": [sCurrentUser,sCurrentUser]
			},["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aAfterUpdateResultsNew = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}' and LANGUAGE = '${aInputRows[2].LANGUAGE}'`);
			expect(aAfterUpdateResultsNew).toBeDefined();
			expect(aAfterUpdateResultsNew.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(1); 

			aAfterUpdateResultsNew = mockstarHelpers.convertResultToArray(aAfterUpdateResultsNew);
			expect(aAfterUpdateResultsNew).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[2].DOCUMENT_TYPE_ID],
				"LANGUAGE": [aInputRows[2].LANGUAGE],
				"DOCUMENT_TYPE_DESCRIPTION": [aInputRows[2].DOCUMENT_TYPE_DESCRIPTION],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[2]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aAfterUpdateResultsOld = oMockstarPlc.execQuery(`select * from {{document_type_text}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and _VALID_TO > '${sMasterdataTimestamp}' and LANGUAGE = '${aInputRows[2].LANGUAGE}'`);
			expect(aAfterUpdateResultsOld).toBeDefined();
			expect(aAfterUpdateResultsOld.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(1); 

			aAfterUpdateResultsOld = mockstarHelpers.convertResultToArray(aAfterUpdateResultsOld);
			expect(aAfterUpdateResultsOld).toMatchData({
                "DOCUMENT_TYPE_ID": [aInputRows[2].DOCUMENT_TYPE_ID],
				"LANGUAGE": [aInputRows[2].LANGUAGE],
				"DOCUMENT_TYPE_DESCRIPTION": [testData.oDocumentTypeText.DOCUMENT_TYPE_DESCRIPTION[5]],
				"_VALID_FROM": [testData.oDocumentTypeText._VALID_FROM[5]],
				"_SOURCE": [testData.oDocumentTypeText._SOURCE[5]],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","LANGUAGE","DOCUMENT_TYPE_DESCRIPTION","_VALID_FROM","_SOURCE","_CREATED_BY"]);

		   let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);

		   expect(aErrorResults).toBeDefined();
		   aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
		   expect(aErrorResults).toMatchData({
			   "FIELD_NAME": ['LANGUAGE'],
			   "FIELD_VALUE": [aInputRows[3].LANGUAGE],
			   "MESSAGE_TEXT": ['Unknown Language for Document Type ID '.concat(aInputRows[3].DOCUMENT_TYPE_ID)],
			   "MESSAGE_TYPE": ['ERROR'],
			   "TABLE_NAME": ['t_document_type__text'],
		   },["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);

		});
		
    }).addTags(["All_Unit_Tests"]);
}