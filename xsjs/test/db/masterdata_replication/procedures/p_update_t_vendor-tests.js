const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;


if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_update_t_vendor", function () {

        let oMockstarPlc = null;
        const sMasterdataTimestamp = NewDateAsISOString();
        const sCurrentUser = $.session.getUsername();

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_vendor", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        vendor: {
                            name: "sap.plc.db::basis.t_vendor",
                            data: testDataRepl.oVendor
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
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "vendor");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]); //send empty or duplicate key

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "vendor");

            let aResults = oMockstarPlc.execQuery(`select * from {{vendor}} where _VALID_FROM > '${sMasterdataTimestamp}' OR _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.VENDOR_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original inserted data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{vendor}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);

            expect(aResultsFullTable).toMatchData(testDataRepl.oVendor, ["VENDOR_ID", "VENDOR_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        /*--- Send 2 entries with the same key (DUPLICATE_KEY_COUNT <> 1) ---*/
        it('should not insert 2 entries with the same key', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "vendor");

            //act
            const aInputRows = [
                {
                    "VENDOR_ID": 'V9',
                    "VENDOR_NAME": testDataRepl.oVendor.VENDOR_NAME[0],
                    "COUNTRY": testDataRepl.oVendor.COUNTRY[0],
                    "POSTAL_CODE": testDataRepl.oVendor.POSTAL_CODE[0],
                    "REGION": testDataRepl.oVendor.REGION[0],
                    "CITY": testDataRepl.oVendor.CITY[0],
                    "STREET_NUMBER_OR_PO_BOX": testDataRepl.oVendor.STREET_NUMBER_OR_PO_BOX[0],
                    "_SOURCE": 2
                },
                {
                    "VENDOR_ID": 'V9',
                    "VENDOR_NAME": testDataRepl.oVendor.VENDOR_NAME[1],
                    "COUNTRY": testDataRepl.oVendor.COUNTRY[1],
                    "POSTAL_CODE": testDataRepl.oVendor.POSTAL_CODE[1],
                    "REGION": testDataRepl.oVendor.REGION[1],
                    "CITY": testDataRepl.oVendor.CITY[1],
                    "STREET_NUMBER_OR_PO_BOX": testDataRepl.oVendor.STREET_NUMBER_OR_PO_BOX[1],
                    "_SOURCE": 2
                }
            ];

            //check key does not exist
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{vendor}} where VENDOR_ID = '${aInputRows[0].vendor_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.VENDOR_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "vendor");

            let aResults = oMockstarPlc.execQuery(`select * from {{vendor}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();
            expect(aResults.columns.VENDOR_ID.rows.length).toEqual(0);

            //check that the final table is identical to the original data
            let aResultsFullTable = oMockstarPlc.execQuery(`select * from {{vendor}}`);
            expect(aResultsFullTable).toBeDefined();
            aResultsFullTable = mockstarHelpers.convertResultToArray(aResultsFullTable);
            expect(aResultsFullTable).toMatchData(testDataRepl.oVendor, ["VENDOR_ID", "VENDOR_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should insert a new vendor', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "vendor");

            const aInputRows = [{
                "VENDOR_ID": 'V5',
                "VENDOR_NAME": 'Cyupy',
                "COUNTRY": 'Romania',
                "POSTAL_CODE": '1234',
                "REGION": 'Ilfov',
                "CITY": 'Bucharest',
                "STREET_NUMBER_OR_PO_BOX": 'Ceahlaul 22',
                "_SOURCE": 2
            }];

            //check that Vendor to be inserted does not exist
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{vendor}} where VENDOR_ID = '${aInputRows[0].VENDOR_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.VENDOR_ID.rows.length).toEqual(0);


            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "vendor");

            let aResults = oMockstarPlc.execQuery(`select * from {{vendor}} where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();

            aResults = mockstarHelpers.convertResultToArray(aResults);

            expect(aResults).toMatchData({
                "VENDOR_ID": [aInputRows[0].VENDOR_ID],
                "VENDOR_NAME": [aInputRows[0].VENDOR_NAME],
                "COUNTRY": [aInputRows[0].COUNTRY],
                "POSTAL_CODE": [aInputRows[0].POSTAL_CODE],
                "REGION": [aInputRows[0].REGION],
                "CITY": [aInputRows[0].CITY],
                "STREET_NUMBER_OR_PO_BOX": [aInputRows[0].STREET_NUMBER_OR_PO_BOX],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["VENDOR_ID", "VENDOR_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

        });

        it('should update an existing entry', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "vendor");

            //Update vendor postal code 
            const aInputRows = [{
                "VENDOR_ID": testDataRepl.oVendor.VENDOR_ID[0],
                "VENDOR_NAME": testDataRepl.oVendor.VENDOR_NAME[0],
                "COUNTRY": testDataRepl.oVendor.COUNTRY[0],
                "POSTAL_CODE": '777',
                "REGION": testDataRepl.oVendor.REGION[0],
                "CITY": testDataRepl.oVendor.CITY[0],
                "STREET_NUMBER_OR_PO_BOX": testDataRepl.oVendor.STREET_NUMBER_OR_PO_BOX[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{vendor}}`);
            expect(aBeforeResults).toBeDefined();

            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);

            //check old value before update
            expect(aBeforeResults).toMatchData(testDataRepl.oVendor, ["VENDOR_ID", "VENDOR_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "vendor");

            let aResults = oMockstarPlc.execQuery(`select * from {{vendor}} where VENDOR_ID = '${aInputRows[0].VENDOR_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResults).toBeDefined();

            aResults = mockstarHelpers.convertResultToArray(aResults);

            expect(aResults).toMatchData({
                "VENDOR_ID": [aInputRows[0].VENDOR_ID],
                "VENDOR_NAME": [aInputRows[0].VENDOR_NAME],
                "COUNTRY": [aInputRows[0].COUNTRY],
                "POSTAL_CODE": [aInputRows[0].POSTAL_CODE],
                "REGION": [aInputRows[0].REGION],
                "CITY": [aInputRows[0].CITY],
                "STREET_NUMBER_OR_PO_BOX": [aInputRows[0].STREET_NUMBER_OR_PO_BOX],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["VENDOR_ID", "VENDOR_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });


        it('should insert 1 entry, and update 1', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "vendor");

            const aInputRows = [{
                "VENDOR_ID": 'V7',
                "VENDOR_NAME": 'Name TEST',
                "COUNTRY": 'Romania',
                "POSTAL_CODE": '1234',
                "REGION": 'Ilfov',
                "CITY": 'Bucharest',
                "STREET_NUMBER_OR_PO_BOX": 'Ceahlaul 22',
                "_SOURCE": 2
            },
            {
                "VENDOR_ID": testDataRepl.oVendor.VENDOR_ID[0],
                "VENDOR_NAME": testDataRepl.oVendor.VENDOR_NAME[0],
                "COUNTRY": testDataRepl.oVendor.COUNTRY[0],
                "POSTAL_CODE": '777',
                "REGION": testDataRepl.oVendor.REGION[0],
                "CITY": testDataRepl.oVendor.CITY[0],
                "STREET_NUMBER_OR_PO_BOX": testDataRepl.oVendor.STREET_NUMBER_OR_PO_BOX[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{vendor}}`);
            expect(aBeforeResults).toBeDefined();
            aBeforeResults = mockstarHelpers.convertResultToArray(aBeforeResults);

            expect(aBeforeResults).toMatchData(testDataRepl.oVendor, ["VENDOR_ID", "VENDOR_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
            
            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "vendor");

       
            let aResultsNew = oMockstarPlc.execQuery(`select * from {{vendor}} where (VENDOR_ID = '${aInputRows[0].VENDOR_ID}'
            OR VENDOR_ID = '${aInputRows[1].VENDOR_ID}') and _VALID_FROM > '${sMasterdataTimestamp}' `);
            expect(aResultsNew).toBeDefined();
            
            expect(aResultsNew.columns.VENDOR_ID.rows.length).toEqual(2);
            aResultsNew = mockstarHelpers.convertResultToArray(aResultsNew);
            
            //1 new inserts for V7 and one updated V1
            expect(aResultsNew).toMatchData({
                "VENDOR_ID": [aInputRows[0].VENDOR_ID, aInputRows[1].VENDOR_ID],
                "VENDOR_NAME": [aInputRows[0].VENDOR_NAME, aInputRows[1].VENDOR_NAME],
                "COUNTRY": [aInputRows[0].COUNTRY, aInputRows[1].COUNTRY],
                "POSTAL_CODE": [aInputRows[0].POSTAL_CODE, aInputRows[1].POSTAL_CODE],
                "REGION": [aInputRows[0].REGION, aInputRows[1].REGION],
                "CITY": [aInputRows[0].CITY, aInputRows[1].CITY],
                "STREET_NUMBER_OR_PO_BOX": [aInputRows[0].STREET_NUMBER_OR_PO_BOX, aInputRows[1].STREET_NUMBER_OR_PO_BOX],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["VENDOR_ID", "VENDOR_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
            
        });
    }).addTags(["All_Unit_Tests"]);
}
