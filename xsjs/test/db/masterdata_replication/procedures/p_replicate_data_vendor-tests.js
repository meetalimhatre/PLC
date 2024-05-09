const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication.procedures.p_replicate_data-tests", function () {
        var sValidFrom = '2015-01-01T15:39:09.691Z';
        var sValidTo = '2015-06-01T15:39:09.691Z';
        let oMockstarPlc = null;
        const sRunId = 'NON_CLUSTERED160611756088';
        const oStatuses = {S: "SUCCESS"};

        var oVendorReplTool = {
            "VENDOR_ID": ['#V1', '#V2', 'V3', '#V4'],
            "VENDOR_NAME": ['Ven1', 'Ven2', 'Ven3', 'Delete Vendor'],
            "COUNTRY": ['C1', 'C2', 'C3', 'C3'],
            "POSTAL_CODE": ['1', '2', '3', '4'],
            "REGION": ['A', 'C', 'D', 'B'],
            "CITY": ['Paris', 'Berlin', 'Constanta', 'Bucharest'],
            "STREET_NUMBER_OR_PO_BOX": ['1', '2', '3', '4'],
            "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo],
            "_VALID_TO": [null, null, null, null],
            "_SOURCE": [1, 1, 2, 2],
            "_CREATED_BY": ['U000001', 'U000002', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, ],
            "IS_PERSONAL_DATA":[0, 0, 0, 1]
        };

        var oLfa1 = {
            "MANDT": ['100', '800', '800', '800', '100','800', '800'],
            "LIFNR": ['V3', 'v5', 'V6', '#\3', 'N4', 'V8', 'v9'],
            "LAND1": ['L3', 'L4', 'L5', 'L6', 'L7','L3', 'L4'],
            "NAME1": ['Vendor', 'Vendor', 'Vendor', 'Vendor', 'Vendor', 'Vendor', 'Vendor'],
            "ORT01": ['Praga', 'Cluj', 'London', 'Sibiu', 'Paris', 'Cluj', 'London'],
            "PSTL2": ['55', '33', '88', '22', '88', '33', '88'],
            "REGIO": ['1', '2', '3', '4', '5', '2', '3'],
            "STRAS": ['stras1', 'stras2', 'stras3', 'stras5', 'stras4', 'stras2', 'stras3'],
            "NAME2": ['3', '5', '5', '2', 'n4', '5', '5'],
            "NAME3": ['name', 'name', 'name', 'name', 'name', 'name', 'name'],
            "NAME4": ['U000001', 'U000002', 'U000001', 'U000001', 'U000001', 'U000002', 'U000001'],
            "LOEVM": [' ', ' ', ' ', ' ', ' ', 'X', ' '],
            "CVP_XBLCK": [' ', ' ', ' ', ' ', ' ', ' ', 'X'],
            "STKZN": ['', '', '', '', '', '', '']
        };

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_replicate_data", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 

                        destination_entity: {
                            name: "sap.plc.db::map.t_destination_entity",
                            data :  testDataRepl.mReplCsvFiles.destination_entity
                        },
                        field_mapping: {
                            name: "sap.plc.db::map.t_field_mapping",
                            data :  testDataRepl.mReplCsvFiles.field_mapping
                        },
                        scheduler_log: {
                            name: "sap.plc.db::map.t_scheduler_log",
                            data: testDataRepl.oSchedlog
                        },
                        replication_run: {
                            name: "sap.plc.db::map.t_replication_run",
                        },
                        replication_log: {
                            name: "sap.plc.db::map.t_replication_log"
                        },
                        statistics: {
                            name: "sap.plc.db::map.t_statistics"
                        },
                        lfa1_staging: {
                            name: "sap.plc.db::repl_st.t_lfa1",
                            data: oLfa1
                        },
                        vendor: {
                            name: "sap.plc.db::basis.t_vendor",
                            data: oVendorReplTool
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

        function prepareEntity(entity){
            let oResultInputSqlDefault = oMockstarPlc.execQuery(`select INPUT_SQL_DEFAULT from {{destination_entity}} where TABLE_NAME = '${entity}'`);
            oResultInputSqlDefault = mockstarHelpers.convertResultToArray(oResultInputSqlDefault);
            oMockstarPlc.execSingle(`update {{destination_entity}} set INPUT_SQL = '${oResultInputSqlDefault.INPUT_SQL_DEFAULT[0]}', REPL_STATUS = 'ENABLED' where TABLE_NAME = '${entity}'`); 
           
            let oResultEntityColumns = oMockstarPlc.execQuery(`select COLUMN_NAME from {{field_mapping}} where TABLE_NAME = '${entity}'`);
            aEntityColumns = mockstarHelpers.convertResultToArray(oResultEntityColumns);
            for (let step = 0; step < aEntityColumns.COLUMN_NAME.length; step++) {
                oMockstarPlc.execSingle(`update {{field_mapping}} set MAPPED_COLUMN = (select MAPPED_COLUMN_DEFAULT from {{field_mapping}} where table_name = '${entity}' and column_name = '${aEntityColumns.COLUMN_NAME[step]}') where TABLE_NAME = '${entity}' and column_name = '${aEntityColumns.COLUMN_NAME[step]}'`);
              }
        }

        it('should insert/modify/delete vendor as expected', function () {

            let sEntity = 't_vendor';
            let sFieldName = 'VENDOR_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "vendor");
            //get data for 1 vendor with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{vendor}} where vendor_id = '${testDataRepl.oVendorReplTool.VENDOR_ID[3]}' and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{vendor}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{vendor}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            
            expect(oEntriesSourcePlcResult.columns.VENDOR_ID.rows.length).toEqual(3);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
               "VENDOR_ID": ['#V1', '#V2', 'V3'],
                "VENDOR_NAME": ['Ven1', 'Ven2', 'Ven3'],
                "COUNTRY": ['C1', 'C2', 'C3'],
                "POSTAL_CODE": ['1', '2', '3'],
                "REGION": ['A', 'C', 'D'],
                "CITY": ['Paris', 'Berlin', 'Constanta'],
                "STREET_NUMBER_OR_PO_BOX": ['1', '2', '3'],                
                "_SOURCE": [1,1,1],
                "DELETED_FROM_SOURCE": [null, null, 1],
                "IS_PERSONAL_DATA":[0, 0, 0]
            }, []);

            expect(oEntriesSourceErpResult.columns.VENDOR_ID.rows.length).toEqual(3);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "VENDOR_ID": ['V5', 'V6', 'V3'],
                "VENDOR_NAME":['Vendor 5', 'Vendor 5', 'Ven3'],
                "COUNTRY":['L4', 'L5', 'C3'],
                "POSTAL_CODE":['33', '88', '3'],
                "REGION": ['2', '3', 'D'],
                "CITY":['Cluj', 'London', 'Constanta'],
                "STREET_NUMBER_OR_PO_BOX": ['stras2', 'stras3', '3'],
                "_SOURCE": [2,2,2],
                "DELETED_FROM_SOURCE": [null, null, null]
            }, ["VENDOR_ID","VENDOR_NAME","COUNTRY","POSTAL_CODE", "REGION","CITY","STREET_NUMBER_OR_PO_BOX","_SOURCE","DELETED_FROM_SOURCE" ]);

             //check source field for vendor after procedure runs
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "vendor");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2);
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,""],
               "FIELD_NAME": ["", sFieldName,""],
               "FIELD_VALUE": ['', 'V3', ''],
               "MESSAGE_TEXT": ['Replication started', 'Changed to PLC source', 'Replication ended'],
               "MESSAGE_TYPE": ['INFO', 'INFO', 'INFO'],
               "OPERATION": ['Replication_Process', 'Replication_Delete', 'Replication_Process']
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");           
        });

    }).addTags(["All_Unit_Tests"]);
}