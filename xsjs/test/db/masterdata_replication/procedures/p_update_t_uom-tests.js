const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_update_t_uom", function () {

        let oMockstarPlc = null;
        const sMasterdataTimestamp = NewDateAsISOString();
        const sCurrentUser = $.session.getUsername();

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_uom", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        dimension: {
                            name: "sap.plc.db::basis.t_dimension",
                            data: testDataRepl.oDimension
                        },
                        uom: {
                            name: "sap.plc.db::basis.t_uom",
                            data: testDataRepl.oUom
                        },
                        error: {
                            name: "sap.plc.db::map.t_replication_log",
                            data: testDataRepl.oError
                        }
                    }
                }
            );
        });

        beforeEach(function () {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function () {
        });

        /*--- Send empty body ---*/
        it('should not insert an empty entry', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResults = oMockstarPlc.execQuery(`select * from {{uom}} where _VALID_FROM > '${sMasterdataTimestamp}' OR _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.UOM_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original inserted data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{uom}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);

            expect(aResultsFullTable).toMatchData(testDataRepl.oUom, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT","_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        /*--- Send 2 entries with the same key (DUPLICATE_KEY_COUNT <> 1) ---*/
        it('should not insert 2 entries with the same key', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //act
            const aInputRows = [
                {
                    "UOM_ID": 'KG',
                    "DIMENSION_ID": testDataRepl.oUom.DIMENSION_ID[0],
                    "NUMERATOR": testDataRepl.oUom.NUMERATOR[0],
                    "DENOMINATOR": testDataRepl.oUom.DENOMINATOR[0],
                    "EXPONENT_BASE10": testDataRepl.oUom.EXPONENT_BASE10[0],
                    "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[0],
                    "_SOURCE": 2
                },
                {
                    "UOM_ID": 'KG',
                    "DIMENSION_ID": testDataRepl.oUom.DIMENSION_ID[1],
                    "NUMERATOR": testDataRepl.oUom.NUMERATOR[1],
                    "DENOMINATOR": testDataRepl.oUom.DENOMINATOR[1],
                    "EXPONENT_BASE10": testDataRepl.oUom.EXPONENT_BASE10[1],
                    "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[1],
                    "_SOURCE": 2
                }
            ];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID = '${aInputRows[0].UOM_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.UOM_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");

            let aResults = oMockstarPlc.execQuery(`select * from {{uom}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.UOM_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{uom}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oUom, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        /*--- Insert unit of measure (KG) ---*/
        it('should insert a new entry', function () {

            const aInputRows = [{
                "UOM_ID": 'KG',
                "DIMENSION_ID": "DIM2",
                "NUMERATOR": testDataRepl.oUom.NUMERATOR[0],
                "DENOMINATOR": testDataRepl.oUom.DENOMINATOR[0],
                "EXPONENT_BASE10": testDataRepl.oUom.EXPONENT_BASE10[0],
                "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[0],
                "_SOURCE": 2
            }];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID = '${aInputRows[0].UOM_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.UOM_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResults = oMockstarPlc.execQuery(`select * from {{uom}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();

            aResults = mockstarHelpers.convertResultToArray(aResults);

            expect(aResults).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID],
                "DIMENSION_ID": [aInputRows[0].DIMENSION_ID],
                "NUMERATOR": [aInputRows[0].NUMERATOR],
                "DENOMINATOR": [aInputRows[0].DENOMINATOR],
                "EXPONENT_BASE10": [aInputRows[0].EXPONENT_BASE10],
                "SI_CONSTANT": [aInputRows[0].SI_CONSTANT],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        /*--- Update an existing unit of measure (ST) ---*/
        it('should update an existing entry', function () {

            //update numerator and dimension
            const aInputRows = [{
                "UOM_ID": testDataRepl.oUom.UOM_ID[0],
                "DIMENSION_ID": "DIM2",
                "NUMERATOR": 2,
                "DENOMINATOR": testDataRepl.oUom.DENOMINATOR[0],
                "EXPONENT_BASE10": testDataRepl.oUom.EXPONENT_BASE10[0],
                "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[0],
                "_SOURCE": 2
            }];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID = '${aInputRows[0].UOM_ID}'`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData({
                "UOM_ID": [testDataRepl.oUom.UOM_ID[0]],
                "DIMENSION_ID": [testDataRepl.oUom.DIMENSION_ID[0]],
                "NUMERATOR": [testDataRepl.oUom.NUMERATOR[0]],
                "DENOMINATOR": [testDataRepl.oUom.DENOMINATOR[0]],
                "EXPONENT_BASE10": [testDataRepl.oUom.EXPONENT_BASE10[0]],
                "SI_CONSTANT": [testDataRepl.oUom.SI_CONSTANT[0]],
                "_VALID_TO": [testDataRepl.oUom._VALID_TO[0]],
                "_SOURCE": [testDataRepl.oUom._SOURCE[0]],
                "_CREATED_BY": [testDataRepl.oUom._CREATED_BY[0]],
            }, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            //results 2 entries with uom ST
            let aResults = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID = '${aInputRows[0].UOM_ID}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.UOM_ID.rows.length).toEqual(2);

            //check updated entry
            let aResultsUpdated = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID = '${aInputRows[0].UOM_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsUpdated).toBeDefined();
            aResultsUpdated = mockstarHelpers.convertResultToArray(aResultsUpdated);

            expect(aResultsUpdated).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID],
                "DIMENSION_ID": [aInputRows[0].DIMENSION_ID],
                "NUMERATOR": [aInputRows[0].NUMERATOR],
                "DENOMINATOR": [aInputRows[0].DENOMINATOR],
                "EXPONENT_BASE10": [aInputRows[0].EXPONENT_BASE10],
                "SI_CONSTANT": [aInputRows[0].SI_CONSTANT],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //check old entry
            let aResultsOld = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID = '${aInputRows[0].UOM_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsOld).toBeDefined();
            aResultsOld = mockstarHelpers.convertResultToArray(aResultsOld);

            expect(aResultsOld).toMatchData({
                "UOM_ID": [testDataRepl.oUom.UOM_ID[0]],
                "DIMENSION_ID": [testDataRepl.oUom.DIMENSION_ID[0]],
                "NUMERATOR": [testDataRepl.oUom.NUMERATOR[0]],
                "DENOMINATOR": [testDataRepl.oUom.DENOMINATOR[0]],
                "EXPONENT_BASE10": [testDataRepl.oUom.EXPONENT_BASE10[0]],
                "SI_CONSTANT": [testDataRepl.oUom.SI_CONSTANT[0]],
                "_SOURCE": [testDataRepl.oUom._SOURCE[0]],
                "_CREATED_BY": [sCurrentUser]
            }, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT", "_SOURCE", "_CREATED_BY"]);

        });

        /*--- Try to update an entry with a non valid dimension ---*/
        it('should not update an entry if dimension does not exist', function () {
            const aInputRows = [{
                "UOM_ID": testDataRepl.oUom.UOM_ID[0],
                "DIMENSION_ID": "DIM3",
                "NUMERATOR": testDataRepl.oUom.NUMERATOR[0],
                "DENOMINATOR": testDataRepl.oUom.DENOMINATOR[0],
                "EXPONENT_BASE10": testDataRepl.oUom.EXPONENT_BASE10[0],
                "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[0],
                "_SOURCE": 2
            }];

            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);
            expect(aBeforeResults).toMatchData(testDataRepl.oUom, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", 
            "EXPONENT_BASE10", "SI_CONSTANT", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");

            //check error table
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['DIMENSION_ID'],
                "FIELD_VALUE": [aInputRows[0].DIMENSION_ID],
                "MESSAGE_TEXT": ['Unknown Dimension ID for UOM ID '.concat(aInputRows[0].UOM_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_uom']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);


            //check entry was not changed
            let aResults = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID = '${aInputRows[0].UOM_ID}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.UOM_ID.rows.length).toEqual(1);

            aResultsOld = mockstarHelpers.convertResultToArray(aResults);

            expect(aResultsOld).toMatchData({
                "UOM_ID": [testDataRepl.oUom.UOM_ID[0]],
                "DIMENSION_ID": [testDataRepl.oUom.DIMENSION_ID[0]],
                "NUMERATOR": [testDataRepl.oUom.NUMERATOR[0]],
                "DENOMINATOR": [testDataRepl.oUom.DENOMINATOR[0]],
                "EXPONENT_BASE10": [testDataRepl.oUom.EXPONENT_BASE10[0]],
                "SI_CONSTANT": [testDataRepl.oUom.SI_CONSTANT[0]],
                "_VALID_TO": [testDataRepl.oUom._VALID_TO[0]],
                "_SOURCE": [testDataRepl.oUom._SOURCE[0]],
                "_CREATED_BY": [testDataRepl.oUom._CREATED_BY[0]]
            }, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        /*--- Update 1 entry, create 2 new and skip one with non-valid dimension ---*/
        it('should update 1 entry, create two, and skip one due to invalid dimension', function() {
			//arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

			const aInputRows = [{
                "UOM_ID": testDataRepl.oUom.UOM_ID[0],
                "DIMENSION_ID": "DIM2", //to update
                "NUMERATOR": 2, //to update
                "DENOMINATOR": testDataRepl.oUom.DENOMINATOR[0],
                "EXPONENT_BASE10": testDataRepl.oUom.EXPONENT_BASE10[0],
                "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[0],
                "_SOURCE": 2
			},
			{
                "UOM_ID": 'CM', //new
                "DIMENSION_ID": testDataRepl.oUom.DIMENSION_ID[0],
                "NUMERATOR": testDataRepl.oUom.NUMERATOR[0],
                "DENOMINATOR": 100,
                "EXPONENT_BASE10": testDataRepl.oUom.NUMERATOR[3],
                "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[0],
                "_SOURCE": 2
			},
			{
                "UOM_ID": 'CM2', //new
                "DIMENSION_ID": testDataRepl.oUom.DIMENSION_ID[0],
                "NUMERATOR": testDataRepl.oUom.NUMERATOR[0],
                "DENOMINATOR": 10000,
                "EXPONENT_BASE10": testDataRepl.oUom.EXPONENT_BASE10[0],
                "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[0],
                "_SOURCE": 2
			},
			{
                "UOM_ID": 'PC',
                "DIMENSION_ID": "DIM3", //invalid
                "NUMERATOR": testDataRepl.oUom.NUMERATOR[0],
                "NUMERATOR": testDataRepl.oUom.DENOMINATOR[0],
                "EXPONENT_BASE10": testDataRepl.oUom.EXPONENT_BASE10[0],
                "SI_CONSTANT": testDataRepl.oUom.SI_CONSTANT[0],
                "_SOURCE": 2
			}];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID in ('${aInputRows[0].UOM_ID}', 
            '${aInputRows[1].UOM_ID}', '${aInputRows[2].UOM_ID}', '${aInputRows[3].UOM_ID}') `);
			expect(aBeforeResults).toBeDefined();
			aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);

            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "uom");
            expect(aBeforeResults).toMatchData({
                "UOM_ID": [testDataRepl.oUom.UOM_ID[0],testDataRepl.oUom.UOM_ID[1]],
                "DIMENSION_ID": [testDataRepl.oUom.DIMENSION_ID[0],testDataRepl.oUom.DIMENSION_ID[1]],
                "NUMERATOR": [testDataRepl.oUom.NUMERATOR[0],testDataRepl.oUom.NUMERATOR[1]],
                "DENOMINATOR": [testDataRepl.oUom.DENOMINATOR[0],testDataRepl.oUom.DENOMINATOR[1]],
                "EXPONENT_BASE10": [testDataRepl.oUom.EXPONENT_BASE10[0],testDataRepl.oUom.EXPONENT_BASE10[1]],
                "SI_CONSTANT": [testDataRepl.oUom.SI_CONSTANT[0],testDataRepl.oUom.SI_CONSTANT[1]],
                "_VALID_TO": [testDataRepl.oUom._VALID_TO[0],testDataRepl.oUom._VALID_TO[1]],
                "_SOURCE": [testDataRepl.oUom._SOURCE[0],testDataRepl.oUom._SOURCE[1]],
                "_CREATED_BY": [testDataRepl.oUom._CREATED_BY[0],testDataRepl.oUom._CREATED_BY[1]]
            }, ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
            
			//act
			let procedure = oMockstarPlc.loadProcedure();
			let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(3);
			mockstarHelpers.checkRowCount(oMockstarPlc, 7, "uom");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "error");
       
            //check error table
            let aErrorResults = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(aErrorResults).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aErrorResults)).toMatchData({
                "FIELD_NAME": ['DIMENSION_ID'],
                "FIELD_VALUE": [aInputRows[3].DIMENSION_ID],
                "MESSAGE_TEXT": ['Unknown Dimension ID for UOM ID '.concat(aInputRows[3].UOM_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_uom']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);
            

			let aResultsNew = oMockstarPlc.execQuery(`select * from {{uom}} where UOM_ID in ('${aInputRows[0].UOM_ID}', 
            '${aInputRows[1].UOM_ID}', '${aInputRows[2].UOM_ID}', '${aInputRows[3].UOM_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsNew).toBeDefined();
            
			expect(aResultsNew.columns.UOM_ID.rows.length).toEqual(3);
            aResultsNew = mockstarHelpers.convertResultToArray(aResultsNew);
            //2 new inserts for CM and CM2 and one updated ST
			expect(aResultsNew).toMatchData({
                "UOM_ID": [aInputRows[0].UOM_ID, aInputRows[1].UOM_ID, aInputRows[2].UOM_ID],
                "DIMENSION_ID": [aInputRows[0].DIMENSION_ID, aInputRows[1].DIMENSION_ID, aInputRows[2].DIMENSION_ID],
                "NUMERATOR": [aInputRows[0].NUMERATOR, aInputRows[1].NUMERATOR, aInputRows[2].NUMERATOR],
                "DENOMINATOR": [aInputRows[0].DENOMINATOR, aInputRows[1].DENOMINATOR, aInputRows[2].DENOMINATOR],
                "EXPONENT_BASE10": [aInputRows[0].EXPONENT_BASE10, aInputRows[1].EXPONENT_BASE10, aInputRows[2].EXPONENT_BASE10],
                "SI_CONSTANT": [aInputRows[0].SI_CONSTANT, aInputRows[1].SI_CONSTANT, aInputRows[2].SI_CONSTANT],
                "_VALID_TO": [null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser]
            },["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", 
            "SI_CONSTANT", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
            
		});

    }).addTags(["All_Unit_Tests"]);
}
