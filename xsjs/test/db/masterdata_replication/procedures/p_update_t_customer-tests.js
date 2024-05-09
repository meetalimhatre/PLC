const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_update_t_customer", function () {

        let oMockstarPlc = null;
        const sMasterdataTimestamp = NewDateAsISOString();
        const sCurrentUser = $.session.getUsername();

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_customer", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        customer: {
                            name: "sap.plc.db::basis.t_customer",
                            data: testDataRepl.oCustomer
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

        it('should not insert a new entry', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]); //send empty or duplicate key

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");

            let aResults = oMockstarPlc.execQuery(`select * from {{customer}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.CUSTOMER_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original inserted data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{customer}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);

            expect(aResultsFullTable).toMatchData(testDataRepl.oCustomer, ["CUSTOMER_ID"]);

        });

        /*--- Send 2 entries with the same key (DUPLICATE_KEY_COUNT <> 1) ---*/
        it('should not insert 2 entries with the same key', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");

            //act
            const aInputRows = [
                {
                    "CUSTOMER_ID": 'C9',
                    "CUSTOMER_NAME": testDataRepl.oCustomer.CUSTOMER_NAME[0],
                    "COUNTRY": testDataRepl.oCustomer.COUNTRY[0],
                    "POSTAL_CODE": testDataRepl.oCustomer.POSTAL_CODE[0],
                    "REGION": testDataRepl.oCustomer.REGION[0],
                    "CITY": testDataRepl.oCustomer.CITY[0],
                    "STREET_NUMBER_OR_PO_BOX": testDataRepl.oCustomer.STREET_NUMBER_OR_PO_BOX[0],
                    "_SOURCE": 2
                },
                {
                    "CUSTOMER_ID": 'C9',
                    "CUSTOMER_NAME": testDataRepl.oCustomer.CUSTOMER_NAME[1],
                    "COUNTRY": testDataRepl.oCustomer.COUNTRY[1],
                    "POSTAL_CODE": testDataRepl.oCustomer.POSTAL_CODE[1],
                    "REGION": testDataRepl.oCustomer.REGION[1],
                    "CITY": testDataRepl.oCustomer.CITY[1],
                    "STREET_NUMBER_OR_PO_BOX": testDataRepl.oCustomer.STREET_NUMBER_OR_PO_BOX[1],
                    "_SOURCE": 2
                }
            ];

            //check key does not exist
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{customer}} where CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.CUSTOMER_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");

            let aResults = oMockstarPlc.execQuery(`select * from {{customer}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.CUSTOMER_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{customer}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oCustomer, ["CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should insert a new customer', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{customer}} `);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.CUSTOMER_ID.rows.length).toEqual(5);

            const aInputRows = [{
                "CUSTOMER_ID": '#CU5',
                "CUSTOMER_NAME": 'Cyupy',
                "COUNTRY": 'Romania',
                "POSTAL_CODE": '1234',
                "REGION": 'Ilfov',
                "CITY": 'Bucharest',
                "STREET_NUMBER_OR_PO_BOX": 'Ceahlaul 22',
                "_SOURCE": 2
            }];

            //check that Customer to be inserted does not exist
            let aBeforeResultsSpec = oMockstarPlc.execQuery(`select * from {{customer}} where CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'`);
            expect(aBeforeResultsSpec).toBeDefined();
            expect(aBeforeResultsSpec.columns.CUSTOMER_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "customer");

            let aResults = oMockstarPlc.execQuery(`select * from {{customer}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            aResults = mockstarHelpers.convertResultToArray(aResults);

            expect(aResults).toMatchData({
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID],
                "CUSTOMER_NAME": [aInputRows[0].CUSTOMER_NAME],
                "COUNTRY": [aInputRows[0].COUNTRY],
                "POSTAL_CODE": [aInputRows[0].POSTAL_CODE],
                "REGION": [aInputRows[0].REGION],
                "CITY": [aInputRows[0].CITY],
                "STREET_NUMBER_OR_PO_BOX": [aInputRows[0].STREET_NUMBER_OR_PO_BOX],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should update an existing entry', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");

            //Update customer postal code 
            const aInputRows = [{
                "CUSTOMER_ID": testDataRepl.oCustomer.CUSTOMER_ID[0],
                "CUSTOMER_NAME": testDataRepl.oCustomer.CUSTOMER_NAME[0],
                "COUNTRY": testDataRepl.oCustomer.COUNTRY[0],
                "POSTAL_CODE": '999',
                "REGION": testDataRepl.oCustomer.REGION[0],
                "CITY": testDataRepl.oCustomer.CITY[0],
                "STREET_NUMBER_OR_PO_BOX": testDataRepl.oCustomer.STREET_NUMBER_OR_PO_BOX[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{customer}} where CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);

            //check old value before update
            expect(aBeforeResults).toMatchData({
                "CUSTOMER_ID": [testDataRepl.oCustomer.CUSTOMER_ID[0]],
                "CUSTOMER_NAME": [testDataRepl.oCustomer.CUSTOMER_NAME[0]],
                "COUNTRY": [testDataRepl.oCustomer.COUNTRY[0]],
                "POSTAL_CODE": [testDataRepl.oCustomer.POSTAL_CODE[0]],
                "REGION": [testDataRepl.oCustomer.REGION[0]],
                "CITY": [testDataRepl.oCustomer.CITY[0]],
                "STREET_NUMBER_OR_PO_BOX": [testDataRepl.oCustomer.STREET_NUMBER_OR_PO_BOX[0]],
                "_VALID_TO": [testDataRepl.oCustomer._VALID_TO[0]],
                "_SOURCE": [testDataRepl.oCustomer._SOURCE[0]],
                "_CREATED_BY": [testDataRepl.oCustomer._CREATED_BY[0]],
            }, ["CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);


            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "customer");

            let aResults = oMockstarPlc.execQuery(`select * from {{customer}} WHERE CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();

            aResults = mockstarHelpers.convertResultToArray(aResults);
            expect(aResults).toMatchData({
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID],
                "CUSTOMER_NAME": [aInputRows[0].CUSTOMER_NAME],
                "COUNTRY": [aInputRows[0].COUNTRY],
                "POSTAL_CODE": [aInputRows[0].POSTAL_CODE],
                "REGION": [aInputRows[0].REGION],
                "CITY": [aInputRows[0].CITY],
                "STREET_NUMBER_OR_PO_BOX": [aInputRows[0].STREET_NUMBER_OR_PO_BOX],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert 1 entry, and update 1', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");

            const aInputRows = [{
                "CUSTOMER_ID": 'C7',
                "CUSTOMER_NAME": 'Name TEST',
                "COUNTRY": 'Romania',
                "POSTAL_CODE": '1234',
                "REGION": 'Ilfov',
                "CITY": 'Bucharest',
                "STREET_NUMBER_OR_PO_BOX": 'Ceahlaul 22',
                "_SOURCE": 2
            },
            {
                "CUSTOMER_ID": testDataRepl.oCustomer.CUSTOMER_ID[0],
                "CUSTOMER_NAME": testDataRepl.oCustomer.CUSTOMER_NAME[0],
                "COUNTRY": testDataRepl.oCustomer.COUNTRY[0],
                "POSTAL_CODE": '777',
                "REGION": testDataRepl.oCustomer.REGION[0],
                "CITY": testDataRepl.oCustomer.CITY[0],
                "STREET_NUMBER_OR_PO_BOX": testDataRepl.oCustomer.STREET_NUMBER_OR_PO_BOX[0],
                "_SOURCE": 2
            }];

            let aBeforeResultsInsert = oMockstarPlc.execQuery(`select * from {{customer}} where CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'`);
            expect(aBeforeResultsInsert).toBeDefined();
            expect(aBeforeResultsInsert.columns.CUSTOMER_ID.rows.length).toEqual(0);

            let aBeforeResultsUpdate = oMockstarPlc.execQuery(`select * from {{customer}} where CUSTOMER_ID = '${aInputRows[1].CUSTOMER_ID}'`);
            expect(aBeforeResultsUpdate).toBeDefined();
            expect(aBeforeResultsUpdate.columns.CUSTOMER_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "customer");

       
            let aResultsNew = oMockstarPlc.execQuery(`select * from {{customer}} where (CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
            OR CUSTOMER_ID = '${aInputRows[1].CUSTOMER_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsNew).toBeDefined();
            
            expect(aResultsNew.columns.CUSTOMER_ID.rows.length).toEqual(2);
            aResultsNew = mockstarHelpers.convertResultToArray(aResultsNew);
            
            //1 new inserts for C7 and one updated 
            expect(aResultsNew).toMatchData({
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID, aInputRows[1].CUSTOMER_ID],
                "CUSTOMER_NAME": [aInputRows[0].CUSTOMER_NAME, aInputRows[1].CUSTOMER_NAME],
                "COUNTRY": [aInputRows[0].COUNTRY, aInputRows[1].COUNTRY],
                "POSTAL_CODE": [aInputRows[0].POSTAL_CODE, aInputRows[1].POSTAL_CODE],
                "REGION": [aInputRows[0].REGION, aInputRows[1].REGION],
                "CITY": [aInputRows[0].CITY, aInputRows[1].CITY],
                "STREET_NUMBER_OR_PO_BOX": [aInputRows[0].STREET_NUMBER_OR_PO_BOX, aInputRows[1].STREET_NUMBER_OR_PO_BOX],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
            
        });
    }).addTags(["All_Unit_Tests"]);
}
