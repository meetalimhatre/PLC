const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication.procedures.p_replicate_data-tests", function () {
        var sValidFrom = '2015-01-01T15:39:09.691Z';
        var sValidTo = '2015-06-01T15:39:09.691Z';
        let oMockstarPlc = null;
        const sRunId = 'NON_CLUSTERED160611756088';
        
        var oCustomerRepl = {
            "CUSTOMER_ID": ['#CU1', '#CU2', '#CU3', '#CU3', '#CU4', 'CUSTOMER3', 'CUSTOMER4', 'CUSTOMER5'],
            "CUSTOMER_NAME": ['Customer1', 'Customer2', 'Customer31', 'Customer32', 'Customer4', 'Customer3 Repl', 'Customer4 Repl', 'Customer5 Repl'],
            "COUNTRY": ['Romania', 'Germany', 'USA', 'USA', 'China', 'US', 'US', 'US'],
            "POSTAL_CODE": ['111', '222', '333', '333', '444', '123', '456', '789'],
            "REGION": ['Ilfov', 'GermanyReg', 'CA', 'CA', 'WuhanRegion', 'Reg1', 'Reg2', 'Reg3'],
            "CITY": ['Bucharest', 'Dresden', 'Palo Alto', 'Palo Alto', 'Wuhan', 'City1', 'City2', 'City3'],
            "STREET_NUMBER_OR_PO_BOX": ['Addr1', 'Addr2', 'Addr3', 'Addr3', 'Addr4', 'Adr3', 'Adr5', 'Adr6'],
            "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "_VALID_TO": [null, null, sValidTo, null, null, null, null, null],
            "_SOURCE": [1, 1, 1, 1, 1, 2, 2, 2],
            "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null, null],
            "IS_PERSONAL_DATA":[0, 0, 0, 0, 0, 0, 0, 1]
        };

        var oKna1 = {
            "MANDT": ['800', '800', '800', '800', '800', '800', '100', '800'],
            "KUNNR": ['Customer1', 'CUSTOMER2', 'CUSTOMER3', 'CUSTOMER4', 'CUSTOMER5', 'CUSTOMER6', 'CUSTOMER7', ' CUSTOMER8'],
            "LAND1": ['FRA', 'GRE', 'US', 'GRE', 'FR', 'GT', 'TG', 'TR'],
            "NAME1": ['First', 'Second', 'Third', 'Customer4', 'CUSTOMER5', 'CUSTOMER6', 'CUSTOMER7', 'CUSTOMER8'],
            "ORT01": ['Ilfov', 'GermanyReg', 'Adr3', 'Adr4', 'Adr5', 'Adr6', 'Adr7', 'Adr8'],
            "PSTLZ": ['43', '97', '123', '456', '789', '655', '678', '754'],
            "REGIO": ['Ber', 'Dre', 'BRE', 'tst', 'reg', 'ter', 'rds', 'BUS'],
            "STRAS": ['Stras2', 'Stras3', 'Adr3', 'Adr4', 'Adr5', 'Adr6', 'Adr7', 'Adr7'],
            "NAME2": ['Customer1', 'Customer2', 'Customer3', 'Repl', '', '', '', ''],
            "LOEVM": [' ', ' ', ' ', 'X', 'X', ' ', ' ', ' '],
            "CVP_XBLCK": [' ', ' ', ' ', ' ', ' ', 'X', ' ', ' '],
            "STKZN": ['', '', '', '', 'X', '', '', '']
        };

        var oReplLogCustomer = {
            "TABLE_NAME": ['', 't_customer', ''],
            "MESSAGE_TIME": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
            "FIELD_NAME": ['', 'CUSTOMER_ID', ''],
            "FIELD_VALUE": ['', 'CUSTOMER4', ''],
            "MESSAGE_TEXT": ['Replication started', 'Changed to PLC source', 'Replication ended'],
            "MESSAGE_TYPE": ['INFO', 'INFO', 'INFO'],
            "OPERATION": ['Replication_Process', 'Replication_Delete', 'Replication_Process'],
            "RUN_ID": ['NON_CLUSTERED160611756088', 'NON_CLUSTERED160611756088', 'NON_CLUSTERED160611756088']
        }; 


        var oStatisticsCustomer = {
            "TABLE_NAME": ['t_customer'],
            "START_TIME": ['2015-01-01T00:00:00.000Z'],
            "FULL_COUNT": [3],
            "UPDATED_COUNT": [3],
            "DELETED_COUNT": [2],
            "END_TIME": ['2015-01-01T00:00:00.000Z'],
            "RUN_TIME_SECONDS": [''],
            "RUN_ID": ['NON_CLUSTERED160611756088']
        }; 

        var oReplRunCustomer = {
            "RUN_ID": ['NON_CLUSTERED160611756088'],
            "MANUAL": [1],
            "USER_ID": ['TEST_USER_1'],
            "START_TIME": ['2015-01-01T00:00:00.000Z'],
            "END_TIME": ['2015-01-01T00:00:00.000Z'],
            "LAST_UPDATE_TIME": ['2015-01-01T00:00:00.000Z'],
            "STATUS": ['SUCCESS']
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
                        kna1_staging: {
                            name: "sap.plc.db::repl_st.t_kna1",
                            data: oKna1
                        },
                        customer: {
                            name: "sap.plc.db::basis.t_customer",
                            data: oCustomerRepl
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

        it('should insert/modify/delete customers as expected', function () {
            //arrange
           prepareEntity('t_customer');
           mockstarHelpers.checkRowCount(oMockstarPlc, 8, "customer");
           //get data for customer before procedure runs
           let oCustomerSourceERP = oMockstarPlc.execQuery(`select * from {{customer}} where customer_id = '${testDataRepl.oCustomerRepl.CUSTOMER_ID[7]}' and _valid_to is null`);
            //act
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oCustomerSourcePlcResult = oMockstarPlc.execQuery(`select * from {{customer}} where _source = 1`);
            let oCustomerSourceErpResult = oMockstarPlc.execQuery(`select * from {{customer}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oCustomerSourcePLC = oMockstarPlc.execQuery(`select * from {{customer}} where customer_id = '${testDataRepl.oCustomerRepl.CUSTOMER_ID[7]}' and _valid_to is null`);

            mockstarHelpers.checkRowCount(oMockstarPlc, 11, "customer");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            expect(oCustomerSourcePlcResult.columns.CUSTOMER_ID.rows.length).toEqual(6);
            expect(oCustomerSourceErpResult.columns.CUSTOMER_ID.rows.length).toEqual(5);
            //check source field for customer after procedure runs
            expect(oCustomerSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oCustomerSourceERP.columns._SOURCE.rows[0]);

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(oStatisticsCustomer.DELETED_COUNT[0]);
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(oStatisticsCustomer.TABLE_NAME[0]);
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(oStatisticsCustomer.FULL_COUNT[0]);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(oStatisticsCustomer.UPDATED_COUNT[0]);

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(oReplRunCustomer.MANUAL[0]);
            expect(oReplicationRun.STATUS[0]).toEqual(oReplRunCustomer.STATUS[0]);

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": [oReplLogCustomer.TABLE_NAME[0], oReplLogCustomer.TABLE_NAME[1], oReplLogCustomer.TABLE_NAME[2]],
                "FIELD_NAME": [oReplLogCustomer.FIELD_NAME[0], oReplLogCustomer.FIELD_NAME[1], oReplLogCustomer.FIELD_NAME[2]],
                "FIELD_VALUE": [oReplLogCustomer.FIELD_VALUE[0], oReplLogCustomer.FIELD_VALUE[1], oReplLogCustomer.FIELD_VALUE[2]],
                "MESSAGE_TEXT": [oReplLogCustomer.MESSAGE_TEXT[0], oReplLogCustomer.MESSAGE_TEXT[1], oReplLogCustomer.MESSAGE_TEXT[2]],
                "MESSAGE_TYPE": [oReplLogCustomer.MESSAGE_TYPE[0], oReplLogCustomer.MESSAGE_TYPE[1], oReplLogCustomer.MESSAGE_TYPE[2]],
                "OPERATION": [oReplLogCustomer.OPERATION[0], oReplLogCustomer.OPERATION[1], oReplLogCustomer.OPERATION[2]]
            }, []);

            oCustomerSourceErpResult = mockstarHelpers.convertResultToArray(oCustomerSourceErpResult);
            expect(oCustomerSourceErpResult).toMatchData({
                "CUSTOMER_ID": ['CUSTOMER3', 'CUSTOMER1', 'CUSTOMER2', 'CUSTOMER3', 'CUSTOMER4'],
                "CUSTOMER_NAME": ['Customer3 Repl', 'First Customer1', 'Second Customer2', 'Third Customer3', 'Customer4 Repl'],
                "CITY": ['City1', 'Ilfov', 'GermanyReg', 'Adr3', 'City2'],
                "REGION": ['Reg1', 'Ber', 'Dre', 'BRE', 'Reg2'],
                "STREET_NUMBER_OR_PO_BOX": ['Adr3', 'Stras2', 'Stras3', 'Adr3', 'Adr5'],
                "POSTAL_CODE": ['123', '43', '97', '123', '456'],
                "_SOURCE": [2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null],
                "IS_PERSONAL_DATA": [0, 0, 0, 0, 0]
            }, ["CUSTOMER_ID"]);
            
            oCustomerSourcePlcResult = mockstarHelpers.convertResultToArray(oCustomerSourcePlcResult);
            expect(oCustomerSourcePlcResult).toMatchData({
                "CUSTOMER_ID": ['#CU1', '#CU2', '#CU3', '#CU3', '#CU4', 'CUSTOMER4'],
                "CUSTOMER_NAME": ['Customer1', 'Customer2', 'Customer31', 'Customer32', 'Customer4', 'Customer4 Repl'],
                "COUNTRY": ['Romania', 'Germany', 'USA', 'USA', 'China', 'US'],
                "POSTAL_CODE": ['111', '222', '333', '333', '444', '456'],
                "REGION": ['Ilfov', 'GermanyReg', 'CA', 'CA', 'WuhanRegion', 'Reg2'],
                "CITY": ['Bucharest', 'Dresden', 'Palo Alto', 'Palo Alto', 'Wuhan', 'City2'],
                "STREET_NUMBER_OR_PO_BOX": ['Addr1', 'Addr2', 'Addr3', 'Addr3', 'Addr4', 'Adr5'],
                "_SOURCE": [1, 1, 1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, 1],
                "IS_PERSONAL_DATA": [0, 0, 0, 0, 0, 0]
            }, ["CUSTOMER_ID"]);

        });

    }).addTags(["All_Unit_Tests"]);
}