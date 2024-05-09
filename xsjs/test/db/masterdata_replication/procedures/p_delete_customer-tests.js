const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_delete_customer", function () {

        let oMockstarPlc = null;

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_delete_customer", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        replication_log: {
                            name: "sap.plc.db::map.t_replication_log",
                            data: testDataRepl.oCustomerError
                        },
                        customer: {
                            name: "sap.plc.db::basis.t_customer",
                            data: testDataRepl.oCustomerDeleteProc
                        },
                        material_price: {
                            name: "sap.plc.db::basis.t_material_price",
                            data: testDataRepl.oCustomerMaterialPrice
                        },
                        material_price_ext: {
                            name: "sap.plc.db::basis.t_material_price_ext"
                        },
                        activity_price: {
                            name: "sap.plc.db::basis.t_activity_price",
                            data: testDataRepl.oCustomerActivityPrice
                        },
                        activity_price_ext: {
                            name: "sap.plc.db::basis.t_activity_price_ext"
                        },
                        calculation_version: {
                            name: "sap.plc.db::basis.t_calculation_version",
                            data: testDataRepl.oCustomerCalculationVersion
                        },
                        calculation_version_temporary: {
                            name: "sap.plc.db::basis.t_calculation_version_temporary",
                            data: testDataRepl.oCustomerCalculationVersionTemporary
                        },
                        project: {
                            name: "sap.plc.db::basis.t_project",
                            data: testDataRepl.oCustomerProject
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

        it('should delete the customer from the specified tables', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price");

            //act
            const aInputRows = [
                {
                    "CUSTOMER_ID": '#CU1'
                }
            ];

            //check key exists
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{customer}} where CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.CUSTOMER_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            procedure(aInputRows);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "customer");
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "material_price");
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "activity_price");

            let aCalcVersResults = oMockstarPlc.execQuery(`select * from {{calculation_version}} where CUSTOMER_ID = 'DELETED'`);
            expect(aCalcVersResults).toBeDefined();
            expect(aCalcVersResults.columns.CUSTOMER_ID.rows.length).toEqual(2);

            let aCalcVersTempResults = oMockstarPlc.execQuery(`select * from {{calculation_version_temporary}} where CUSTOMER_ID = 'DELETED'`);
            expect(aCalcVersTempResults).toBeDefined();
            expect(aCalcVersTempResults.columns.CUSTOMER_ID.rows.length).toEqual(2);

            let aProjectResults = oMockstarPlc.execQuery(`select * from {{project}} where CUSTOMER_ID = 'DELETED'`);
            expect(aProjectResults).toBeDefined();
            expect(aProjectResults.columns.CUSTOMER_ID.rows.length).toEqual(2);

            let aReplicationLogResults = oMockstarPlc.execQuery(`select * from {{replication_log}} where FIELD_VALUE = 'DELETED' and FIELD_NAME = 'CUSTOMER_ID'`);
            expect(aReplicationLogResults).toBeDefined();
            expect(aReplicationLogResults.columns.FIELD_VALUE.rows.length).toEqual(1);
        });

        if (jasmine.plcTestRunParameters.generatedFields === true) {
            it('should delete the customer from the specified tables + CFs', function () {
                //arrange
                oMockstarPlc.insertTableData("material_price_ext", testDataRepl.oCustomerMaterialPriceExt);
                oMockstarPlc.insertTableData("activity_price_ext", testDataRepl.oCustomerActivityPriceExt);

                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "customer");
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price");
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price_ext");
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price");
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price_ext");
    
                //act
                const aInputRows = [
                    {
                        "CUSTOMER_ID": '#CU1'
                    }
                ];
    
                //check key exists
                let aBeforeResults = oMockstarPlc.execQuery(`select * from {{customer}} where CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'`);
                expect(aBeforeResults).toBeDefined();
                expect(aBeforeResults.columns.CUSTOMER_ID.rows.length).toEqual(1);
    
                //act
                let procedure = oMockstarPlc.loadProcedure();
                procedure(aInputRows);
    
                //assert
                mockstarHelpers.checkRowCount(oMockstarPlc, 4, "customer");
                mockstarHelpers.checkRowCount(oMockstarPlc, 3, "material_price");
                mockstarHelpers.checkRowCount(oMockstarPlc, 3, "material_price_ext");
                mockstarHelpers.checkRowCount(oMockstarPlc, 3, "activity_price");
                mockstarHelpers.checkRowCount(oMockstarPlc, 3, "activity_price_ext");
    
                let aCalcVersResults = oMockstarPlc.execQuery(`select * from {{calculation_version}} where CUSTOMER_ID = 'DELETED'`);
                expect(aCalcVersResults).toBeDefined();
                expect(aCalcVersResults.columns.CUSTOMER_ID.rows.length).toEqual(2);
    
                let aCalcVersTempResults = oMockstarPlc.execQuery(`select * from {{calculation_version_temporary}} where CUSTOMER_ID = 'DELETED'`);
                expect(aCalcVersTempResults).toBeDefined();
                expect(aCalcVersTempResults.columns.CUSTOMER_ID.rows.length).toEqual(2);
    
                let aProjectResults = oMockstarPlc.execQuery(`select * from {{project}} where CUSTOMER_ID = 'DELETED'`);
                expect(aProjectResults).toBeDefined();
                expect(aProjectResults.columns.CUSTOMER_ID.rows.length).toEqual(2);
    
                let aReplicationLogResults = oMockstarPlc.execQuery(`select * from {{replication_log}} where FIELD_VALUE = 'DELETED' and FIELD_NAME = 'CUSTOMER_ID'`);
                expect(aReplicationLogResults).toBeDefined();
                expect(aReplicationLogResults.columns.FIELD_VALUE.rows.length).toEqual(1);
            });
		}

    }).addTags(["All_Unit_Tests"]);
}