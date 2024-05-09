const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication.procedures.p_replicate_data_material_account-tests", function () {

        let oMockstarPlc = null;
        const sRunId = 'NON_CLUSTERED160611756088';
        const sValidFrom = '2015-01-01T15:39:09.691Z';
        const sValidTo = '2015-06-01T15:39:09.691Z';
        const oMessageTypes = {I:"INFO", E:"ERROR"};
        const oStatuses = {S: "SUCCESS"};
        const oMessages = {ReplStarted:"Replication started",
                           ChangePLCSource: "Changed to PLC source",
                           ReplEnded:"Replication ended",
                           UnknownAccId:"Unknown Account ID for Controlling Area ID "
                           };
        const oOperations = {ReplProc:"Replication_Process",ReplDel:"Replication_Delete", ReplUpd:"Replication_Update"};

        let oTka02 = {
                "MANDT": ['800', '800', '800', '800', '100'],
                "BUKRS": ['1710', '0001', '0003', '1010', '1710'],
                "GSBER": ['','','','X',''],
                "KOKRS": ['A000', '0001', '0003', 'A000', 'A000']
            };
        let oT001 = {
                "MANDT": ['800', '800', '800', '800', '100'],
                "BUKRS": ['0001', '0003', '1710', '1010', '1710'],
                "WAERS": ['EUR', 'USD', 'USD', 'EUR', 'USD'],
                "BUTXT": ['SAP A.G.', 'SAP US', 'CC 1710', 'CC 1010', 'CC 1710'],
                "KTOPL": ['INT','INT','YCOA','YCOA','INT']
            };
        let oT001w = {
                "MANDT" : ['800', '800' , '800', '800', '100'],
                "WERKS" : ['0001','0003','1010','1710','1720'],
                "STRAS" : ['Berliner Alle 103', '123 main street', '3936 El Centro Rd', 'Neurottstr. 16','3475 Deer Creek'],
                "PSTLZ" : ['10966','94070','95834','69190','94304-1355'],
                "ORT01" : ['Berlin', 'palo alto','Sacramento', 'Walldorf', 'Palo Alto'],
                "LAND1" : ['DE', 'US', 'US', 'DE', 'US'],
                "REGIO" : ['', 'CA', 'CA', 'BW', 'CA'],
                "BWKEY" : ['0001', '0003', '1010', '1710', '1720'],
                "NAME1" : ['Werk 0001' , 'Plant 0003', 'Plant 2 US', 'Plant 1 DE', 'Plant 1 US' ]
            };
        let oT001k = {
                "MANDT" : ['800', '800' , '800', '800', '100'],
                "BUKRS" : ['1010', '1710', '0001','0003', '1710'],
                "BWKEY" : ['1010', '1710', '0001', '0003', '1720'],
                "BWMOD":  ['0001','0001','0001','0001','']
            };
        let oT030 = {
                "MANDT": ['800','800','800','800','800','100','800'],
                "KTOPL": ['INT','INT','YCOA','INT','CABE','INT','INT'],
                "KTOSL": ['GBA','GBB','GBB','GBB','GBB','GBB','GBB'],
                "BWMOD": ['0001','0001','0001','','0001','0001','0001'],
                "KOMOK": ['BSA','VBR','VBR','VBR','VBR','VBR','BSA'],
                "BKLAS": ['VC1','VC2','','VC4','VC1','VC2','VC3'],
                "KONTS": ['00100000','00200000','00300000','00400000','00400001','00400002','00400003']
            };//Only recors 2 and 4 are relevant
        let oPlant = {
                "PLANT_ID" : ['#PL1' , '#PL2', '0003', '0001', '1010', '1710'],
                "COMPANY_CODE_ID" : ['#CC1', '#CC2', '0003', '0001', '1010', '1710'],
                "COUNTRY" : ['SPA', 'GER', 'US', 'DE', 'US','DE'],
                "POSTAL_CODE" : ['4324', '2345', '2654', '2345','2654', '2345'],
                "REGION" : ['REG1', 'REG3','REG4','REG5', 'REG4','REG5'],
                "CITY" : ['Berlin', 'Bucharest','Paris', 'Madrid','Palo Alto','Berlin'],
                "STREET_NUMBER_OR_PO_BOX" : ['4', '3','2','1','2','1'],
                "_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
                "_VALID_TO" : [null, sValidTo, null, null, null, null],
                "_SOURCE" :[1, 1, 2, 2, 2, 2],
                "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000002', 'U000003'],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
            };
        let oControllingArea = {
                "CONTROLLING_AREA_ID": ['#CA1', '#CA2', '0003', '0001', 'A000'],
                "CONTROLLING_AREA_CURRENCY_ID": ['EUR', 'EUR', 'USD', 'EUR', 'EUR'],
                "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
                "_VALID_TO": [null, sValidTo, null, null, null],
                "_SOURCE": [1, 1, 2, 2, 2],
                "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
                "DELETED_FROM_SOURCE": [null, null, null, null, null]
            };
        let oCompanyCode = {
                "COMPANY_CODE_ID": ['#CC1', '#CC2', '0001', '0003', '1010', '1710'],
                "CONTROLLING_AREA_ID": ['#CA1', '#CA2', '0001', '0003', 'A000', 'A000'],
                "COMPANY_CODE_CURRENCY_ID": ['EUR', 'USD', 'EUR', 'USD', 'EUR', 'USD'],
                "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom,sValidFrom,sValidFrom],
                "_VALID_TO": [null, sValidTo, null, null,null,null],
                "_SOURCE": [1, 1, 2, 2,2,2],
                "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000001','U000002', 'U000001'],
                "DELETED_FROM_SOURCE": [null, null, null, null,null,null]
            };
        let oMaterialType = {
                "MATERIAL_TYPE_ID":['#MT1','#MT2','MT4','MT5','MT6'],
                "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom,sValidFrom, sValidFrom],
                "_VALID_TO": [null, sValidTo, null, null, ,null],
                "_SOURCE": [1, 1, 2, 2, 2],
                "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001'],
                "DELETED_FROM_SOURCE": [null, null, null, null, null]
            };
        let oValuationClass = {
                "VALUATION_CLASS_ID":['#VC1','#VC2','VC1','VC2','VC3','VC4'],
                "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom],
                "_VALID_TO": [null, sValidTo, null, null, null, null],
                "_SOURCE": [1, 1, 2, 2, 2, 2],
                "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001'],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
            };
        let oAccount = {
                "ACCOUNT_ID": ['#A1','100000','100000','100000','200000','300000','400000','400001','400003','200000','400000'],
                "CONTROLLING_AREA_ID": ['#CA1', '#CA1','A000','0001', '0001', '0001', '0003','A000','A000','0003','0001'],
                "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom,sValidFrom, sValidFrom, sValidFrom, sValidFrom,sValidFrom,sValidFrom,sValidFrom,sValidFrom],
                "_VALID_TO": [null, null, null, null,null, null, null,null,null,null,null],
                "_SOURCE": [1, 1, 2, 2, 2, 2,2,2,2,2,2],
                "_CREATED_BY": ['U000001', "U000001", "U000001",'U000001', 'U000001', 'U000001', 'U000001', 'U000001','U000001','U000001','U000001'],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null,null, null,null,null,null]
            };
        let oMaterialAccount = {
                "CONTROLLING_AREA_ID": ['#CA1', '#CA1', 'A000', '0001'],
                "MATERIAL_TYPE_ID": ['#MT1', '*', 'MT4','*'],
                "PLANT_ID": ['#PL1', '#PL1', '1010', '0001'],
                "VALUATION_CLASS_ID": ['#VC1', '#VC1', 'VC2','VC2'],
                "ACCOUNT_ID": ['#A1', '100000', '100000','400000'],
                "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [1, 1, 2, 2],
                "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001'],
                "DELETED_FROM_SOURCE": [null, null, null, null]
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
                        tka02_staging : { 
                            name: "sap.plc.db::repl_st.t_tka02",
                            data: oTka02
                        },
                        t001_staging : { 
                            name: "sap.plc.db::repl_st.t_t001",
                            data: oT001
                        },
                        t001w_staging: {
                            name: "sap.plc.db::repl_st.t_t001w",
                            data: oT001w
                        },
                        t001k_staging: {
                            name: "sap.plc.db::repl_st.t_t001k",
                            data: oT001k
                        },
                        t030_staging: {
                            name: "sap.plc.db::repl_st.t_t030",
                            data: oT030
                        }, 
                        plant: {
                            name: "sap.plc.db::basis.t_plant",
                            data: oPlant
                        },
                        controllingArea: {
                            name: "sap.plc.db::basis.t_controlling_area",
                            data: oControllingArea
                        },
                        companyCode: {
                            name: "sap.plc.db::basis.t_company_code",
                            data: oCompanyCode
                        },
                        materialType: {
                            name: "sap.plc.db::basis.t_material_type",
                            data: oMaterialType
                        },
                        valuationClass: {
                            name: "sap.plc.db::basis.t_valuation_class",
                            data: oValuationClass
                        },
                        account: {
                            name: "sap.plc.db::basis.t_account",
                            data: oAccount
                        },
                        materialAccount: {
                            name: "sap.plc.db::basis.t_material_account_determination",
                            data: oMaterialAccount
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

 
        it('should insert/modify/delete material account as expected', function () {

            let sEntity = 't_material_account_determination';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "materialAccount");
            //get data for one material account with source 2 which was migrated before from erp, client 800
            let oOldEntrySourceERP = oMockstarPlc.execQuery(`select * from {{materialAccount}} where controlling_area_id= '${oMaterialAccount.CONTROLLING_AREA_ID[2]}' and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{materialAccount}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{materialAccount}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{materialAccount}} where controlling_area_id= '${oMaterialAccount.CONTROLLING_AREA_ID[2]}' and _valid_to is null`);
  
            expect(oEntriesSourcePlcResult.columns.CONTROLLING_AREA_ID.rows.length).toEqual(2);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "CONTROLLING_AREA_ID": [oMaterialAccount.CONTROLLING_AREA_ID[0],oMaterialAccount.CONTROLLING_AREA_ID[1]],
                "MATERIAL_TYPE_ID": [oMaterialAccount.MATERIAL_TYPE_ID[0],oMaterialAccount.MATERIAL_TYPE_ID[1]],
                "PLANT_ID": [oMaterialAccount.PLANT_ID[0],oMaterialAccount.PLANT_ID[1]],
                "VALUATION_CLASS_ID": [oMaterialAccount.VALUATION_CLASS_ID[0],oMaterialAccount.VALUATION_CLASS_ID[1]],
                "ACCOUNT_ID": [oMaterialAccount.ACCOUNT_ID[0],oMaterialAccount.ACCOUNT_ID[1]],
                "_SOURCE": [1,1],
                "DELETED_FROM_SOURCE": [null,null]
            }, []);

            expect(oEntriesSourceErpResult.columns.CONTROLLING_AREA_ID.rows.length).toEqual(6);

            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "CONTROLLING_AREA_ID": [oMaterialAccount.CONTROLLING_AREA_ID[3],'0001',
                                        '0003','0003',
                                        '0001', oMaterialAccount.CONTROLLING_AREA_ID[2]],
                "MATERIAL_TYPE_ID": [oMaterialAccount.MATERIAL_TYPE_ID[3],'*',
                                    '*','*',
                                    '*', oMaterialAccount.MATERIAL_TYPE_ID[2]],
                "PLANT_ID": [oMaterialAccount.PLANT_ID[3],'0001',
                            '*','0003',
                            '*', oMaterialAccount.PLANT_ID[2]],
                "VALUATION_CLASS_ID": [oMaterialAccount.VALUATION_CLASS_ID[3],'VC2',
                                        'VC4','VC2',
                                        'VC4', oMaterialAccount.VALUATION_CLASS_ID[2]],
                "ACCOUNT_ID": [oMaterialAccount.ACCOUNT_ID[3],'200000',
                                '400000','200000',
                                '400000', oMaterialAccount.ACCOUNT_ID[2]],
                "_SOURCE": [2,2,2,2,2,2],
                "DELETED_FROM_SOURCE": [null,null,null,null,null,null]
            }, ["CONTROLLING_AREA_ID","MATERIAL_TYPE_ID","PLANT_ID","VALUATION_CLASS_ID","ACCOUNT_ID"]);

            //check source field for material account after procedure runs
             expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntrySourceERP.columns._SOURCE.rows[0]);
             mockstarHelpers.checkRowCount(oMockstarPlc, 8, "materialAccount");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //one entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(4); //4 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(5); //5 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,""],
               "FIELD_NAME": ["","ACCOUNT_ID",""],
               "FIELD_VALUE": ["",'300000',""],
               "MESSAGE_TEXT": [
                   oMessages.ReplStarted, 
                   oMessages.UnknownAccId.concat("A000"), 
                   oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
        });

    }).addTags(["All_Unit_Tests"]);
}
