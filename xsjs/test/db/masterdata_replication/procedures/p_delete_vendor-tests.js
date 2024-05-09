const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication:p_delete_vendor", function () {

        let oMockstarPlc = null;

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_delete_vendor", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        replication_log: {
                            name: "sap.plc.db::map.t_replication_log",
                            data: testDataRepl.oVendorError
                        },
                        vendor: {
                            name: "sap.plc.db::basis.t_vendor",
                            data: testDataRepl.oVendorDeleteProc
                        },
                        material_price: {
                            name: "sap.plc.db::basis.t_material_price",
                            data: testDataRepl.oVendorMaterialPrice
                        },
                        material_price_ext: {
                            name: "sap.plc.db::basis.t_material_price_ext"
                        },
                        item: {
                            name: "sap.plc.db::basis.t_item",
                            data: testDataRepl.oVendorItem
                        },
                        item_temporary: {
                            name: "sap.plc.db::basis.t_item_temporary",
                            data: testDataRepl.oVendorItemTemporary
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

        it('should delete the vendor from the specified tables', function () {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "vendor");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price");

            //act
            const aInputRows = [
                {
                    "VENDOR_ID": '#V1'
                }
            ];

            //check key exists
            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{vendor}} where VENDOR_ID = '${aInputRows[0].VENDOR_ID}'`);
            expect(aBeforeResults).toBeDefined();
            expect(aBeforeResults.columns.VENDOR_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            procedure(aInputRows);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "vendor");
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "material_price");

            let aItemResults = oMockstarPlc.execQuery(`select * from {{item}} where VENDOR_ID = 'DELETED'`);
            expect(aItemResults).toBeDefined();
            expect(aItemResults.columns.VENDOR_ID.rows.length).toEqual(2);

            let aItemTempResults = oMockstarPlc.execQuery(`select * from {{item_temporary}} where VENDOR_ID = 'DELETED'`);
            expect(aItemTempResults).toBeDefined();
            expect(aItemTempResults.columns.VENDOR_ID.rows.length).toEqual(2);

            let aReplicationLogResults = oMockstarPlc.execQuery(`select * from {{replication_log}} where FIELD_VALUE = 'DELETED' and FIELD_NAME = 'VENDOR_ID'`);
            expect(aReplicationLogResults).toBeDefined();
            expect(aReplicationLogResults.columns.FIELD_VALUE.rows.length).toEqual(1);
        });

        if (jasmine.plcTestRunParameters.generatedFields === true) {
            it('should delete the vendor from the specified tables + CFs', function () {
                //arrange
                oMockstarPlc.insertTableData("material_price_ext", testDataRepl.oVendorMaterialPriceExt);

                mockstarHelpers.checkRowCount(oMockstarPlc, 4, "vendor");
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price");
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price_ext");
    
                //act
                const aInputRows = [
                    {
                        "VENDOR_ID": '#V1'
                    }
                ];
    
                //check key exists
                let aBeforeResults = oMockstarPlc.execQuery(`select * from {{vendor}} where VENDOR_ID = '${aInputRows[0].VENDOR_ID}'`);
                expect(aBeforeResults).toBeDefined();
                expect(aBeforeResults.columns.VENDOR_ID.rows.length).toEqual(1);
    
                //act
                let procedure = oMockstarPlc.loadProcedure();
                procedure(aInputRows);
    
                //assert
                mockstarHelpers.checkRowCount(oMockstarPlc, 3, "vendor");
                mockstarHelpers.checkRowCount(oMockstarPlc, 3, "material_price");
                mockstarHelpers.checkRowCount(oMockstarPlc, 3, "material_price_ext");
    
                let aItemResults = oMockstarPlc.execQuery(`select * from {{item}} where VENDOR_ID = 'DELETED'`);
                expect(aItemResults).toBeDefined();
                expect(aItemResults.columns.VENDOR_ID.rows.length).toEqual(2);
    
                let aItemTempResults = oMockstarPlc.execQuery(`select * from {{item_temporary}} where VENDOR_ID = 'DELETED'`);
                expect(aItemTempResults).toBeDefined();
                expect(aItemTempResults.columns.VENDOR_ID.rows.length).toEqual(2);
    
                let aReplicationLogResults = oMockstarPlc.execQuery(`select * from {{replication_log}} where FIELD_VALUE = 'DELETED' and FIELD_NAME = 'VENDOR_ID'`);
                expect(aReplicationLogResults).toBeDefined();
                expect(aReplicationLogResults.columns.FIELD_VALUE.rows.length).toEqual(1);
            });
		}

    }).addTags(["All_Unit_Tests"]);
}
