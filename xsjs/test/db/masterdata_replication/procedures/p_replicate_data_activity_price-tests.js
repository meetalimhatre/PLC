const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication.procedures.p_replicate_data_activity_price-tests", function () {

        let oMockstarPlc = null;
        const sRunId = 'NON_CLUSTERED160611756088';
        const sValidFrom = '2015-01-01T15:39:09.691Z';
        const sValidFromActivityPrice = "2021-01-01T02:00:00.000Z";
        const sValidTo = '2015-06-01T15:39:09.691Z';
        const oMessageTypes = {I:"INFO", E:"ERROR"};
        const oStatuses = {S: "SUCCESS"};
        const oMessages = {ReplStarted:"Replication started",
                           ChangePLCSource: "Changed to PLC source",
                           ReplEnded:"Replication ended",
                           UnknownPrcSrcId:"Unknown Price Source ID"
                           };
        const oOperations = {ReplProc:"Replication_Process",ReplDel:"Replication_Delete", ReplUpd:"Replication_Update"};

        var dCurrentDate = new Date();
        var sDATBI = new Date(dCurrentDate.setFullYear(dCurrentDate.getFullYear() + 1)).toISOString();

        var oCSLA = {
            "MANDT": ["800", "800", "800", "800", "800", "800"],
            "KOKRS": ["#CA1", "#CA", "#CA1", "#CA1", "#CA1", "#CA2"],
            "LSTAR": ["#AT1", "AT6", "AT7", "AT8", "AT9", "at10"],
            "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI, sDATBI, sDATBI],
            "VKSTA": ["#AC11", "#AC11", "#AC", "#AC11", "#AC11", "#AC11"],
            "LEINH": ["ST", "ST", "ST", "ST", "ST", "ST"]
        };

        var oCSKS = {
            "MANDT": ["800", "800", "800", "800", "800"],
            "KOKRS": ["#CA1", "#CA1", "#CA2", "#CA1", "#CA"],
            "KOSTL": ["#CC1", "CC4", "cc5", "0CC7", "CC10"],
            "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI, sDATBI],
            "WAERS": ["EUR", "EUR", "EUR", "EUR", "EUR"]
        };

        var oCSSL = {
            "MANDT": ["800",],
            "KOKRS": ["#CA1",],
            "KOSTL": ["#CC1"],
            "LSTAR": ["#AT1"],
            "GJAHR": ["2021"],
            "OBJNR": ["333"]
        };

        var oCOST = {
            "MANDT": ["800",],
            "LEDNR": ["m",],
            "OBJNR": ["333"],
            "GJAHR": ["2021"],
            "WRTTP": ["t"],
            "VERSN": ["3"],
            "TARKZ": ["3"],
            "PERBL": ["3"],
            "TOG001": ["20"],
            "TOG002": ["20"],
            "TOG003": ["20"],
            "TOG004": ["20"],
            "TOG005": ["20"],
            "TOG006": ["20"],
            "TOG007": ["20"],
            "TOG008": ["20"],
            "TOG009": ["20"],
            "TOG010": ["20"],
            "TOG011": ["20"],
            "TOG012": ["20"],
            "TOF001": ["10"],
            "TOF002": ["10"],
            "TOF003": ["10"],
            "TOF004": ["10"],
            "TOF005": ["10"],
            "TOF006": ["10"],
            "TOF007": ["10"],
            "TOF008": ["10"],
            "TOF009": ["10"],
            "TOF010": ["10"],
            "TOF011": ["10"],
            "TOF012": ["10"],
            "TOE001": ["1"],
        };

        var oActivityPriceRepl = {
            "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2C0055E0B2BDB9671600A4000936462B", "2A0055E0B2BDB9671600A4000936462B"],
            "_VALID_FROM": [sValidFromActivityPrice, sValidFromActivityPrice, sValidFromActivityPrice],
            "PRICE_SOURCE_ID": ["ERP_STANDARD_PRICE", "ERP_STANDARD_PRICE", "ERP_STANDARD_PRICE"],
            "CONTROLLING_AREA_ID": ["#CA1", "CA5", "CA7"],
            "COST_CENTER_ID": ["#CC1", "CC4", "CC6"],
            "ACTIVITY_TYPE_ID": ["#AT1", "#AT1", "#AT1"],
            "PROJECT_ID": ["*", "*", "*"],
            "CUSTOMER_ID": ["*", "*", "*"],
            "VALID_FROM": [sValidFromActivityPrice, sValidFromActivityPrice, sValidFromActivityPrice],
            "VALID_TO": [sValidTo, sValidTo, sValidTo],
            "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000"],
            "VALID_TO_QUANTITY": [null, null, null],
            "PRICE_FIXED_PORTION": ["30.0000000", "10.0000000", "10.0000000"],
            "PRICE_VARIABLE_PORTION": ["30.0000000", "10.0000000", "10.0000000"],
            "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR"],
            "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000"],
            "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC"],
            "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0],
            "_VALID_TO": [null, null, null],
            "_SOURCE": [1, 2, 2],
            "_CREATED_BY": ["TEST_USER_1", "TEST_USER_1", "TEST_USER_1"],
            "DELETED_FROM_SOURCE": [null, null, null]
        };
    
        var oCostCenterRepl = {
            "COST_CENTER_ID": ["#CC1", "#CC2", "CC4", "CC6"],
            "CONTROLLING_AREA_ID": ["#CA1", "#CA2", "#CA1", "#CA1"],
            "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "_VALID_TO": [null, null, null, null],
            "_SOURCE": [1, 1, 2, 2],
            "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null]
        };

        var oControllingAreaRepl = {
            "CONTROLLING_AREA_ID": ['#CA1', '#CA2', '#CA3', 'CA5', 'CA7'],
            "CONTROLLING_AREA_CURRENCY_ID": ['EUR', 'EUR', 'USD', 'EUR', 'EUR'],
            "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "_VALID_TO": [null, sValidTo, null, null, null],
            "_SOURCE": [1, 1, 1, 2, 2],
            "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null]
        };

        var oActivityTypeRepl = {
            "ACTIVITY_TYPE_ID": ["#AT1", "#AT2", "AT3", "AT4", "AT5"],
            "CONTROLLING_AREA_ID": ["#CA1", "#CA1", "#CA1", "#CA1", "#CA1"],
            "ACCOUNT_ID": ["#AC1", "#AC2", "#AC11", "#AC11", "#AC11"],
            "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "_VALID_TO": [null, null, null, null, null],
            "_SOURCE": [1, 1, 2, 2, 2],
            "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null]
        };

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
            "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null, null]
        };

        var oPriceSource = {
            "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "ERP_MOVING_PRICE", "ERP_PLANNED_PRICE1", "ERP_STANDARD_PRICE"],
            "PRICE_SOURCE_TYPE_ID": [1, 1, 1, 2],
            "CONFIDENCE_LEVEL_ID": [3, 3, 1, 1],
            "DETERMINATION_SEQUENCE": [3, 4, 3, 3],
            "CREATED_ON": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001'],
            "LAST_MODIFIED_ON": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "LAST_MODIFIED_BY": ['U000001', 'U000001', 'U000001', 'U000001']
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
                        csla_staging : { 
                            name: "sap.plc.db::repl_st.t_csla",
                            data: oCSLA
                        },
                        csks_staging: {
                            name: "sap.plc.db::repl_st.t_csks",
                            data: oCSKS
                        },
                        cssl_staging: {
                            name: "sap.plc.db::repl_st.t_cssl",
                            data: oCSSL
                        },
                        cost_staging:{
                            name: "sap.plc.db::repl_st.t_cost",
                            data: oCOST
                        },  
                        activityPrice: {
                            name: "sap.plc.db::basis.t_activity_price",
                            data: oActivityPriceRepl
                        },                  
                        activityType: {
                            name: "sap.plc.db::basis.t_activity_type",
                            data: oActivityTypeRepl
                        },
                        costCenter: {
                            name: "sap.plc.db::basis.t_cost_center", 
                            data: oCostCenterRepl
                        },
                        customer: {
                            name: "sap.plc.db::basis.t_customer",
                            data: oCustomerRepl
                        },
                        project: {
                            name: "sap.plc.db::basis.t_project"
                        },
                        priceSource: {
                            name: "sap.plc.db::basis.t_price_source",
                            data: oPriceSource
                        },
                        controllingArea:{
                            name: "sap.plc.db::basis.t_controlling_area",
                            data: oControllingAreaRepl
                        },
                        uom: {
                            name: "sap.plc.db::basis.t_uom",
                            data :  testDataRepl.mReplCsvFiles.uom
                        },
                        uom_mapping: {
                            name: "sap.plc.db::map.t_uom_mapping",
                            data :  testDataRepl.mReplCsvFiles.uom_mapping
                        },
                        currency:{
                            name: "sap.plc.db::basis.t_currency",
                            data :  testDataRepl.mReplCsvFiles.currency
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
 
        it('should insert/modify/delete activity price as expected', function () {

            let sEntity = 't_activity_price';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "activityPrice");
            
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{activityPrice}} where _source = 1 order by PRICE_ID`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{activityPrice}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            
            expect(oEntriesSourcePlcResult.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(1);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult.PRICE_ID[0]).toEqual(oActivityPriceRepl.PRICE_ID[0]);
            expect(oEntriesSourcePlcResult.PRICE_SOURCE_ID[0]).toEqual(oActivityPriceRepl.PRICE_SOURCE_ID[0]);
            expect(oEntriesSourcePlcResult.COST_CENTER_ID[0]).toEqual(oActivityPriceRepl.COST_CENTER_ID[0]);
            expect(oEntriesSourcePlcResult.ACTIVITY_TYPE_ID[0]).toEqual(oActivityPriceRepl.ACTIVITY_TYPE_ID[0]);
            expect(oEntriesSourcePlcResult.PROJECT_ID[0]).toEqual(oActivityPriceRepl.PROJECT_ID[0]);
            expect(oEntriesSourcePlcResult.CUSTOMER_ID[0]).toEqual(oActivityPriceRepl.CUSTOMER_ID[0]);
            expect(oEntriesSourcePlcResult.VALID_FROM_QUANTITY[0]).toEqual(oActivityPriceRepl.VALID_FROM_QUANTITY[0]);
            expect(oEntriesSourcePlcResult.VALID_TO_QUANTITY[0]).toEqual(oActivityPriceRepl.VALID_TO_QUANTITY[0]);
            expect(oEntriesSourcePlcResult.PRICE_FIXED_PORTION[0]).toEqual(oActivityPriceRepl.PRICE_FIXED_PORTION[0]);
            expect(oEntriesSourcePlcResult.PRICE_VARIABLE_PORTION[0]).toEqual(oActivityPriceRepl.PRICE_VARIABLE_PORTION[0]);
            expect(oEntriesSourcePlcResult.TRANSACTION_CURRENCY_ID[0]).toEqual(oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0]);
            expect(oEntriesSourcePlcResult.PRICE_UNIT[0]).toEqual(oActivityPriceRepl.PRICE_UNIT[0]);
            expect(oEntriesSourcePlcResult.PRICE_UNIT_UOM_ID[0]).toEqual(oActivityPriceRepl.PRICE_UNIT_UOM_ID[0]);
            expect(oEntriesSourcePlcResult.IS_PRICE_SPLIT_ACTIVE[0]).toEqual(oActivityPriceRepl.IS_PRICE_SPLIT_ACTIVE[0]);
            expect(oEntriesSourcePlcResult._SOURCE[0]).toEqual(1);
            expect(oEntriesSourcePlcResult.DELETED_FROM_SOURCE[0]).toEqual(null);
            
            expect(oEntriesSourceErpResult.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(14);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);

            expect(oEntriesSourceErpResult).toMatchData({
                "PRICE_SOURCE_ID": [oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3],
                                    oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3],
                                    oPriceSource.PRICE_SOURCE_ID[3], oPriceSource.PRICE_SOURCE_ID[3]],
                "CONTROLLING_AREA_ID": [oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[0], 
                                        oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[0], 
                                        oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[0], 
                                        oActivityPriceRepl.CONTROLLING_AREA_ID[0], oActivityPriceRepl.CONTROLLING_AREA_ID[1], oActivityPriceRepl.CONTROLLING_AREA_ID[2]],
                "COST_CENTER_ID": [oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], 
                                   oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], 
                                   oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[0], oActivityPriceRepl.COST_CENTER_ID[1], oActivityPriceRepl.COST_CENTER_ID[2]],
                "ACTIVITY_TYPE_ID": [oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0],
                                     oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0],
                                     oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0], oActivityPriceRepl.ACTIVITY_TYPE_ID[0]],
                "PROJECT_ID": [oActivityPriceRepl.PROJECT_ID[0], "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*"],
                "CUSTOMER_ID": [oActivityPriceRepl.CUSTOMER_ID[0], "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*"],
                "VALID_FROM": ["2021-01-01T00:00:00.000Z", "2021-02-01T00:00:00.000Z", "2021-03-01T00:00:00.000Z", "2021-04-01T00:00:00.000Z", "2021-05-01T00:00:00.000Z", "2021-06-01T00:00:00.000Z", "2021-07-01T00:00:00.000Z",
                    "2021-08-01T00:00:00.000Z", "2021-09-01T00:00:00.000Z", "2021-10-01T00:00:00.000Z", "2021-11-01T00:00:00.000Z", "2021-12-01T00:00:00.000Z", "2021-01-01T00:00:00.000Z", "2021-01-01T00:00:00.000Z"],
                "VALID_TO": ["2021-01-31T00:00:00.000Z", "2021-02-28T00:00:00.000Z", "2021-03-31T00:00:00.000Z", "2021-04-30T00:00:00.000Z", "2021-05-31T00:00:00.000Z", "2021-06-30T00:00:00.000Z",
                    "2021-07-31T00:00:00.000Z", "2021-08-31T00:00:00.000Z", "2021-09-30T00:00:00.000Z", "2021-10-31T00:00:00.000Z", "2021-11-30T00:00:00.000Z", "2021-12-31T00:00:00.000Z", "2015-06-01T00:00:00.000Z", "2015-06-01T00:00:00.000Z"],
                "VALID_FROM_QUANTITY": [oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0],
                                         oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0], 
                                         oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0],
                                          oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0], oActivityPriceRepl.VALID_FROM_QUANTITY[0]],
                "VALID_TO_QUANTITY": [oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0],
                                     oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0],
                                     oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0], oActivityPriceRepl.VALID_TO_QUANTITY[0]],
                "PRICE_FIXED_PORTION": [oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1],
                                         oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1],
                                          oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1], oActivityPriceRepl.PRICE_FIXED_PORTION[1]],
                "PRICE_VARIABLE_PORTION": [oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1],
                                             oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1],
                                             oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1],
                                              oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1], oActivityPriceRepl.PRICE_VARIABLE_PORTION[1]],
                "TRANSACTION_CURRENCY_ID": [oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0],
                                             oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], 
                                             oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0],
                                              oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0], oActivityPriceRepl.TRANSACTION_CURRENCY_ID[0]],
                "PRICE_UNIT": [oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0],
                             oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0],
                              oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0], oActivityPriceRepl.PRICE_UNIT[0]],
                "PRICE_UNIT_UOM_ID": [oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0],
                                     oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0],
                                     oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0], oActivityPriceRepl.PRICE_UNIT_UOM_ID[0]],
                "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "_SOURCE": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null, null, null, null, null, null, null, null]
            }
            ,["PRICE_SOURCE_ID","CONTROLLING_AREA_ID","COST_CENTER_ID","ACTIVITY_TYPE_ID","PROJECT_ID","CUSTOMER_ID", "VALID_TO", "VALID_FROM", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY", "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID", "PRICE_UNIT", "PRICE_UNIT_UOM_ID", "IS_PRICE_SPLIT_ACTIVE", "_SOURCE", "DELETED_FROM_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 15, "activityPrice");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //two entries were deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(12); //11 entries were added, 1 updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(12); //12 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",""],
               "FIELD_NAME": ["", ""],
               "FIELD_VALUE": ["", ""],
               "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT", ,"MESSAGE_TEXT", "MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 2, "replication_log");
        });

    }).addTags(["All_Unit_Tests"]);
}