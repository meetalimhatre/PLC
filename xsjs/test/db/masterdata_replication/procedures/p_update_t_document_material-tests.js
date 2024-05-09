const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;

if(jasmine.plcTestRunParameters.mode === 'all'){
    describe('db.masterdata_replication:p_update_t_document_material',function() {
        
        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_document_material", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{	
                            document_type: "sap.plc.db::basis.t_document_type",
                            document_material: "sap.plc.db::basis.t_document_material",
                            document: "sap.plc.db::basis.t_document",
                            material: "sap.plc.db::basis.t_material",
                            error: "sap.plc.db::map.t_replication_log"
						}
					});
        });

        beforeEach(function() {
			oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
			oMockstarPlc.insertTableData("document_type", testData.oDocumentType);
			oMockstarPlc.insertTableData("document_material", testData.oDocumentMaterial);
			oMockstarPlc.insertTableData("document", testData.oDocument);
			oMockstarPlc.insertTableData("material", testData.oMaterial);
			oMockstarPlc.insertTableData("error", testData.oError);
        });
		afterEach(function() {
        });

        it('should not create a document material', function() {
			//arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
            
			//act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0)
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
			let aResults = oMockstarPlc.execQuery(`select * from {{document_material}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oDocumentMaterial,["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});

		it('should create a new document material', function() {
			//arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");

			const aInputRows = [{
                    "DOCUMENT_TYPE_ID":'DT4',
                    "DOCUMENT_ID":'D1',
                    "DOCUMENT_VERSION":'V1',
                    "DOCUMENT_PART":'DP1', 
                    "MATERIAL_ID":'MAT1',
                    "_SOURCE": 2
			}];

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1)
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_material");
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
			
			let aResults = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);

			expect(aResults).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [aInputRows[0].DOCUMENT_ID],
				"DOCUMENT_VERSION": [aInputRows[0].DOCUMENT_VERSION],
				"DOCUMENT_PART": [aInputRows[0].DOCUMENT_PART],
				"MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
            },["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

		});
		
        it('should update a document material', function() {
			//arrange

            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
 			
			const aInputRows = [{
                    "DOCUMENT_TYPE_ID":'DT1',
                    "DOCUMENT_ID":'D1',
                    "DOCUMENT_VERSION":'V2',
                    "DOCUMENT_PART":'DP1', 
                    "MATERIAL_ID":'MAT1',
                    "_SOURCE": 2
			}];

			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();

			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
			expect(aBeforeResults).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[0].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [testData.oDocumentMaterial.DOCUMENT_ID[0],testData.oDocumentMaterial.DOCUMENT_ID[1]],
				"DOCUMENT_VERSION": [testData.oDocumentMaterial.DOCUMENT_VERSION[0],testData.oDocumentMaterial.DOCUMENT_VERSION[1]],
				"DOCUMENT_PART": [testData.oDocumentMaterial.DOCUMENT_PART[0],testData.oDocumentMaterial.DOCUMENT_PART[1]],
				"MATERIAL_ID": [testData.oDocumentMaterial.MATERIAL_ID[0],testData.oDocumentMaterial.MATERIAL_ID[1]],
				"_VALID_TO": [testData.oDocumentMaterial._VALID_TO[0],testData.oDocumentMaterial._VALID_TO[1]],
				"_SOURCE": [testData.oDocumentMaterial._SOURCE[0],testData.oDocumentMaterial._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentMaterial._CREATED_BY[0],testData.oDocumentMaterial._CREATED_BY[1]]
            },["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);



			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(1)
			mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document_material");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            
            let aResults = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aResults).toBeDefined();
			expect(aResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(3);

			let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResultsUpdated).toBeDefined();
			aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);

			expect(aResultsUpdated).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [aInputRows[0].DOCUMENT_ID],
				"DOCUMENT_VERSION": [aInputRows[0].DOCUMENT_VERSION],
				"DOCUMENT_PART": [aInputRows[0].DOCUMENT_PART],
				"MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[0]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
            },["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);

			let aResultsOld = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}' and _VALID_FROM < '${sMasterdataTimestamp}'`);
			expect(aResultsOld).toBeDefined();
			aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);
			
			expect(aResultsOld).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[0].DOCUMENT_TYPE_ID,aInputRows[0].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [testData.oDocumentMaterial.DOCUMENT_ID[0],testData.oDocumentMaterial.DOCUMENT_ID[1]],
				"DOCUMENT_VERSION": [testData.oDocumentMaterial.DOCUMENT_VERSION[0],testData.oDocumentMaterial.DOCUMENT_VERSION[1]],
				"DOCUMENT_PART": [testData.oDocumentMaterial.DOCUMENT_PART[0],testData.oDocumentMaterial.DOCUMENT_PART[1]],
				"MATERIAL_ID": [testData.oDocumentMaterial.MATERIAL_ID[0],testData.oDocumentMaterial.MATERIAL_ID[1]],
				"_VALID_FROM": [testData.oDocumentMaterial._VALID_FROM[0],testData.oDocumentMaterial._VALID_FROM[1]],
				"_SOURCE": [testData.oDocumentMaterial._SOURCE[0],testData.oDocumentMaterial._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentMaterial._CREATED_BY[0],sCurrentUser]
            },["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM","_SOURCE","_CREATED_BY"]);

		});
		
        it('should return error: Unknown Material ID', function() {
			//arrange

		  mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
		
			const aInputRows = [{
                    "DOCUMENT_TYPE_ID":'DT4',
                    "DOCUMENT_ID":'D1',
                    "DOCUMENT_VERSION":'V1',
                    "DOCUMENT_PART":'DP1', 
                    "MATERIAL_ID":'MAT6',
                    "_SOURCE": 2
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0)
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            
			let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();

			aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['MATERIAL_ID'],
				"FIELD_VALUE": [aInputRows[0].MATERIAL_ID],
				"MESSAGE_TEXT": ['Unknown Material ID for Document ID '.concat(aInputRows[0].DOCUMENT_ID)],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_material'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);
			
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
			let aResults = oMockstarPlc.execQuery(`select * from {{document_material}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oDocumentMaterial,["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data
			

		});

        it('should return error: Unknown Document ID', function() {
			//arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");

			const aInputRows = [{
				"DOCUMENT_TYPE_ID":'DT4',
				"DOCUMENT_ID":'D9',
				"DOCUMENT_VERSION":'V1',
				"DOCUMENT_PART":'DP1', 
				"MATERIAL_ID":'MAT2',
				"_SOURCE": 2
			}];
			
			let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeResults).toBeDefined();
			expect(aBeforeResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0)
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            
			let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();

			aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['DOCUMENT_ID'],
				"FIELD_VALUE": [aInputRows[0].DOCUMENT_ID],
				"MESSAGE_TEXT": ['Unknown Document ID for Document Type ID '.concat(aInputRows[0].DOCUMENT_TYPE_ID)],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_material'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);
			
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
			let aResults = oMockstarPlc.execQuery(`select * from {{document_material}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oDocumentMaterial,["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data
			
        });
        it('should return error: Unknown Document Type ID', function() {
			//arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
			
			const aInputRows = [{
                    "DOCUMENT_TYPE_ID":'DT9',
                    "DOCUMENT_ID":'D1',
                    "DOCUMENT_VERSION":'V1',
                    "DOCUMENT_PART":'DP1', 
                    "MATERIAL_ID":'MAT2',
                    "_SOURCE": 2
			}];

			
		let aBeforeResults = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
		expect(aBeforeResults).toBeDefined();
		expect(aBeforeResults.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

		//act
		let procedure = oMockstarPlc.loadProcedure();
		let procreturn = procedure(aInputRows);

		//assert
		expect(procreturn.OV_PROCESSED_ROWS).toBe(0)
		mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
		
		let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
		expect(aErrorResults).toBeDefined();

		aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
		expect(aErrorResults).toMatchData({
			"FIELD_NAME": ['DOCUMENT_TYPE_ID'],
			"FIELD_VALUE": [aInputRows[0].DOCUMENT_TYPE_ID],
			"MESSAGE_TEXT": ['Unknown Document Type ID for Document ID '.concat(aInputRows[0].DOCUMENT_ID)],
			"MESSAGE_TYPE": ['ERROR'],
			"TABLE_NAME": ['t_document_material'],
		},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","TABLE_NAME"]);
		
		mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
		let aResults = oMockstarPlc.execQuery(`select * from {{document_material}}`);
		expect(aResults).toBeDefined();
		aResults = mockstarHelpers.convertResultToArray(aResults);
		expect(aResults).toMatchData(testData.oDocumentMaterial,["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data
		
		});

		it('should not do anything because of DUPLICATE_KEY_COUNT', function() {
			//arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");

			const aInputRows = [{
                    "DOCUMENT_TYPE_ID":'DT4',
                    "DOCUMENT_ID":'D1',
                    "DOCUMENT_VERSION":'V1',
                    "DOCUMENT_PART":'DP1', 
                    "MATERIAL_ID":'MAT1',
                    "_SOURCE": 2
			},{
					"DOCUMENT_TYPE_ID":'DT4',
					"DOCUMENT_ID":'D1',
					"DOCUMENT_VERSION":'V1',
					"DOCUMENT_PART":'DP1', 
					"MATERIAL_ID":'MAT1',
					"_SOURCE": 2
			}];

			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(0)
			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
			mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

			let aResults = oMockstarPlc.execQuery(`select * from {{document_material}}`);
			expect(aResults).toBeDefined();
			aResults = mockstarHelpers.convertResultToArray(aResults);
			expect(aResults).toMatchData(testData.oDocumentMaterial,["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM","_VALID_TO","_SOURCE","_CREATED_BY"]); //check that the final table is identical to the original inserted data

		});
		it('should create one document material,update one, skip one because of entry already in table, and error one because mat_id not existing', function() {

			//arrange

			mockstarHelpers.checkRowCount(oMockstarPlc, 5, "document_material");
 			
			const aInputRows = [{
				"DOCUMENT_TYPE_ID":'DT4', //insert
				"DOCUMENT_ID":'D1',
				"DOCUMENT_VERSION":'V1',
				"DOCUMENT_PART":'DP1', 
				"MATERIAL_ID":'MAT1',
				"_SOURCE": 2
			},{
				"DOCUMENT_TYPE_ID":'DT1', //update
				"DOCUMENT_ID":'D1',
				"DOCUMENT_VERSION":'V2',
				"DOCUMENT_PART":'DP1', 
				"MATERIAL_ID":'MAT1',
				"_SOURCE": 2
			},{
				"DOCUMENT_TYPE_ID":'DT2', //skip
				"DOCUMENT_ID":'D2',
				"DOCUMENT_VERSION":'V2',
				"DOCUMENT_PART":'DP1', 
				"MATERIAL_ID":'MAT1',
				"_SOURCE": 2
			},{
				"DOCUMENT_TYPE_ID":'DT4',
				"DOCUMENT_ID":'D1',
				"DOCUMENT_VERSION":'V1',
				"DOCUMENT_PART":'DP1', 
				"MATERIAL_ID":'MAT6',
				"_SOURCE": 2
			}];
			
			var aBeforeInsert = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[0].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeInsert).toBeDefined();
			expect(aBeforeInsert.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(0);

			let aBeforeUpdate = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}'`);
			expect(aBeforeUpdate).toBeDefined();
			
			aBeforeUpdate = mockstarHelpers.convertResultToArray(aBeforeUpdate);
			expect(aBeforeUpdate).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[1].DOCUMENT_TYPE_ID,aInputRows[1].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [testData.oDocumentMaterial.DOCUMENT_ID[0],testData.oDocumentMaterial.DOCUMENT_ID[1]],
				"DOCUMENT_VERSION": [testData.oDocumentMaterial.DOCUMENT_VERSION[0],testData.oDocumentMaterial.DOCUMENT_VERSION[1]],
				"DOCUMENT_PART": [testData.oDocumentMaterial.DOCUMENT_PART[0],testData.oDocumentMaterial.DOCUMENT_PART[1]],
				"MATERIAL_ID": [testData.oDocumentMaterial.MATERIAL_ID[0],testData.oDocumentMaterial.MATERIAL_ID[1]],
				"_VALID_TO": [testData.oDocumentMaterial._VALID_TO[0],testData.oDocumentMaterial._VALID_TO[1]],
				"_SOURCE": [testData.oDocumentMaterial._SOURCE[0],testData.oDocumentMaterial._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentMaterial._CREATED_BY[0],testData.oDocumentMaterial._CREATED_BY[1]]
			},["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
			
			var aBeforeSkip = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and DOCUMENT_ID  = '${aInputRows[2].DOCUMENT_ID}' and DOCUMENT_VERSION  = '${aInputRows[2].DOCUMENT_VERSION}' and DOCUMENT_PART = '${aInputRows[2].DOCUMENT_PART}' and MATERIAL_ID = '${aInputRows[2].MATERIAL_ID}' and _SOURCE = '${aInputRows[2]._SOURCE}'`);
			expect(aBeforeSkip).toBeDefined();
			expect(aBeforeSkip.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(1);

			aBeforeSkip = mockstarHelpers.convertResultToArray(aBeforeSkip);
			expect(aBeforeSkip).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[2].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [testData.oDocumentMaterial.DOCUMENT_ID[3]],
				"DOCUMENT_VERSION": [testData.oDocumentMaterial.DOCUMENT_VERSION[3]],
				"DOCUMENT_PART": [testData.oDocumentMaterial.DOCUMENT_PART[3]],
				"MATERIAL_ID": [testData.oDocumentMaterial.MATERIAL_ID[3]],
				"_VALID_TO": [testData.oDocumentMaterial._VALID_TO[3]],
				"_SOURCE": [testData.oDocumentMaterial._SOURCE[3]],
				"_CREATED_BY": [testData.oDocumentMaterial._CREATED_BY[3]]
			},["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
			
			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);
			
			//assert
			expect(procreturn.OV_PROCESSED_ROWS).toBe(2)
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "document_material");
			mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
						
			let aResultsAfterUpdate = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}'`);
			expect(aResultsAfterUpdate).toBeDefined();
			expect(aResultsAfterUpdate.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(3);
			
			let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
			expect(aResultsUpdated).toBeDefined();
			aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);
			
			expect(aResultsUpdated).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[1].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [aInputRows[1].DOCUMENT_ID],
				"DOCUMENT_VERSION": [aInputRows[1].DOCUMENT_VERSION],
				"DOCUMENT_PART": [aInputRows[1].DOCUMENT_PART],
				"MATERIAL_ID": [aInputRows[1].MATERIAL_ID],
				"_VALID_TO": [null],
				"_SOURCE": [aInputRows[1]._SOURCE],
				"_CREATED_BY": [sCurrentUser]
			},["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
			
			let aResultsUpdatedOld = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[1].DOCUMENT_TYPE_ID}' and _VALID_FROM < '${sMasterdataTimestamp}'`);
			expect(aResultsUpdatedOld).toBeDefined();
			aResultsUpdatedOld = mockstarHelpers.convertResultToArray(aResultsUpdatedOld);
						
			expect(aResultsUpdatedOld).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[1].DOCUMENT_TYPE_ID,aInputRows[1].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [testData.oDocumentMaterial.DOCUMENT_ID[0],testData.oDocumentMaterial.DOCUMENT_ID[1]],
				"DOCUMENT_VERSION": [testData.oDocumentMaterial.DOCUMENT_VERSION[0],testData.oDocumentMaterial.DOCUMENT_VERSION[1]],
				"DOCUMENT_PART": [testData.oDocumentMaterial.DOCUMENT_PART[0],testData.oDocumentMaterial.DOCUMENT_PART[1]],
				"MATERIAL_ID": [testData.oDocumentMaterial.MATERIAL_ID[0],testData.oDocumentMaterial.MATERIAL_ID[1]],
				"_VALID_FROM": [testData.oDocumentMaterial._VALID_FROM[0],testData.oDocumentMaterial._VALID_FROM[1]],
				"_SOURCE": [testData.oDocumentMaterial._SOURCE[0],testData.oDocumentMaterial._SOURCE[1]],
				"_CREATED_BY": [testData.oDocumentMaterial._CREATED_BY[0],sCurrentUser]
			},["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_FROM","_SOURCE","_CREATED_BY"]);
			
			var aAfterSkip = oMockstarPlc.execQuery(`select * from {{document_material}} where DOCUMENT_TYPE_ID = '${aInputRows[2].DOCUMENT_TYPE_ID}' and DOCUMENT_ID  = '${aInputRows[2].DOCUMENT_ID}' and DOCUMENT_VERSION  = '${aInputRows[2].DOCUMENT_VERSION}' and DOCUMENT_PART = '${aInputRows[2].DOCUMENT_PART}' and MATERIAL_ID = '${aInputRows[2].MATERIAL_ID}' and _SOURCE = '${aInputRows[2]._SOURCE}'`);
			expect(aAfterSkip).toBeDefined();
			expect(aAfterSkip.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(1);

			aAfterSkip = mockstarHelpers.convertResultToArray(aAfterSkip);
			expect(aAfterSkip).toMatchData({
				"DOCUMENT_TYPE_ID": [aInputRows[2].DOCUMENT_TYPE_ID],
				"DOCUMENT_ID": [testData.oDocumentMaterial.DOCUMENT_ID[3]],
				"DOCUMENT_VERSION": [testData.oDocumentMaterial.DOCUMENT_VERSION[3]],
				"DOCUMENT_PART": [testData.oDocumentMaterial.DOCUMENT_PART[3]],
				"MATERIAL_ID": [testData.oDocumentMaterial.MATERIAL_ID[3]],
				"_VALID_TO": [testData.oDocumentMaterial._VALID_TO[3]],
				"_SOURCE": [testData.oDocumentMaterial._SOURCE[3]],
				"_CREATED_BY": [testData.oDocumentMaterial._CREATED_BY[3]]
			},["DOCUMENT_TYPE_ID","DOCUMENT_ID","DOCUMENT_VERSION","DOCUMENT_PART","MATERIAL_ID","_VALID_TO","_SOURCE","_CREATED_BY"]);
			
			let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
			expect(aErrorResults).toBeDefined();

			aErrorResults = mockstarHelpers.convertResultToArray(aErrorResults);
			expect(aErrorResults).toMatchData({
				"FIELD_NAME": ['MATERIAL_ID'],
				"FIELD_VALUE": [aInputRows[3].MATERIAL_ID],
				"MESSAGE_TEXT": ['Unknown Material ID for Document ID '.concat(aInputRows[3].DOCUMENT_ID)],
				"MESSAGE_TYPE": ['ERROR'],
				"TABLE_NAME": ['t_document_material'],
        	},["FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT", "MESSAGE_TYPE", "MESSAGE_TYPE", "TABLE_NAME"]);
			
		});
    }).addTags(["All_Unit_Tests"]);
}