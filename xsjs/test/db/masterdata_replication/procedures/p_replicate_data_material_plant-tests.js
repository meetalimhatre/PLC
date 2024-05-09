const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication.procedures.p_replicate_data_material_plant-tests", function () {

        let oMockstarPlc = null;
        const sRunId = 'NON_CLUSTERED160611756088';
        const sValidFrom = '2015-01-01T15:39:09.691Z';
        const sValidTo = '2015-06-01T15:39:09.691Z';
        const oMessageTypes = {I:"INFO", E:"ERROR"};
        const oStatuses = {S: "SUCCESS"};
        const oMessages = {ReplStarted:"Replication started",
                           ChangePLCSource: "Changed to PLC source",
                           ReplEnded:"Replication ended",
                           UnknownOverhead:"Unknown Overhead Group ID for Plant ID ",
                           UnknownValuationClass:"Unknown Valuation Class ID",
                           UnknownMaterial:"Unknown Material ID"
                           };
        const oOperations = {ReplProc:"Replication_Process",ReplDel:"Replication_Delete", ReplUpd:"Replication_Update"};

        let oPlant = {
            "PLANT_ID" : ['0001' , '0003', '1010', '1710', '1720', '1730'],
            "COMPANY_CODE_ID" : ['#CC1', '#CC2', '0003', '0001', '1010', '1710'],
            "COUNTRY" : ['SPA', 'GER', 'US', 'DE', 'US','DE'],
            "POSTAL_CODE" : ['4324', '2345', '2654', '2345','2654', '2345'],
            "REGION" : ['REG1', 'REG3','REG4','REG5', 'REG4','REG5'],
            "CITY" : ['Berlin', 'Bucharest','Paris', 'Madrid','Palo Alto','Berlin'],
            "STREET_NUMBER_OR_PO_BOX" : ['4', '3','2','1','2','1'],
            "_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "_VALID_TO" : [null, null, null, null, null, null],
            "_SOURCE" :[2, 2, 2, 2, 2, 2],
            "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000002', 'U000003'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
        };

        let oMaterial = {
            "MATERIAL_ID": ['FG111','FG126','FG129','FG00','FG111','FG136','FG100'],
            "BASE_UOM_ID": ["PC", "PC", "PC", "PC", "PC", "PC", "PC"],
            "MATERIAL_GROUP_ID": ['#MG1', '#MG2', '#MG3', '#MG3', 'L004', 'L004','L004'],
            "MATERIAL_TYPE_ID": ['#MT1', '#MT2', '#MT3', '#MT2', 'FERT', 'FERT', 'FERT'],
            "IS_CREATED_VIA_CAD_INTEGRATION": [1, 1, null, null, null, 1, 1],
            "IS_PHANTOM_MATERIAL": [0, 0, 1, 1, 0, 0, 0],
            "IS_CONFIGURABLE_MATERIAL": [0, 0, 0, 0, 1, 0, 0],
            "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom],
            "_VALID_TO": [null, null, null, null, null, null,null],
            "_SOURCE": [2, 2, 2, 2, 2, 2, 2],
            "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
        };    

        var oMaterialPlant = {
            "MATERIAL_ID": ['#MAT1', '#MAT1', '#MAT2', 'FG129', 'FG136'],
            "PLANT_ID": ['PL1', 'PL1', 'PL2', '1710', '1730'],
            "OVERHEAD_GROUP_ID": ['O1', 'O1', 'O2', 'OG5', 'OG5'],
            "VALUATION_CLASS_ID": ['V1', 'V1', 'V2', 'V2', 'VC4'],
            "MATERIAL_LOT_SIZE": ["10.0000000", "11.0000000", "20.0000000", "22.0000000", "33.0000000"],
            "MATERIAL_LOT_SIZE_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
            "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
            "_VALID_TO": [sValidTo, null, sValidTo, null, null],
            "_SOURCE": [1, 1, 1, 2, 2],
            "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null]
        };

        let oOverheadGroup = {
            "OVERHEAD_GROUP_ID": ['#OG1', '#OG2', 'OG3', 'OG4', 'OG5'],
            "PLANT_ID": ['#PT2', '#PT1', '#PT3', '#PT4', '#PT2'],
            "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
            "_VALID_TO": [null, null, null, null, null],
            "_SOURCE": [1, 1, 2, 2, 2],
            "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
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

        let oMbew = {
            "MANDT":['800','800','800','800','800','800','800','100','800'],
            "MATNR":['FG111','FG111','FG126','FG126','FG129','FG129','FG00','FG100','FG766'],
            "BWKEY":['1010','1710','1010','1710','1010','1710','1010','1010','1010'],
            "BWTAR":['','','','','','','','',''],
            "LVORM":['','','','','','','X','',''],
            "VERPR":['0.00','5.50','0.00','10.50','0.00','10.00','0.00','0.00','0.00'],
            "VPRSV":['S','S','S','S','S','S','S','S','S'],
            "STPRS":['19.50','20.00','14.50','15.00','12.56','11.56','12.44','10.05','11.96'],
            "PEINH":['1','2','1','2','1','2','1','1','1'],
            "BKLAS":['VC1','VC1','V3','V3','VC2','VC2','VC1','VC1','VC1'],
            "LFGJA":['2019','2020','2019','2020','2018','2021','2020','2020','2020'],
            "LFMON":['01','01','03','07','01','10','01','01','01'],
            "ZPLP1":['10.50','0.00','15.5','0.00','0.00','0.00','0.00','0.00','11'],
            "ZPLP2":['0.00','5.56','0.00','3.50','0.00','0.00','0.00','0.00','0.12'],
            "ZPLP3":['0.00','0.00','0.00','0.00','0.00','0.00','0.00','0.00','0.00'],
            "ZPLD1":['20150109','','20151111','','','','','',''],
            "ZPLD2":['','20151111','','20151212','','','','',''],
            "ZPLD3":['','','','','','','','',''],
            "KOSGR":['OG3','OG3','OG4','OG4','OG5','OG5','OG5','OG5','OGF']
        };

        let oMara = {
            "MANDT":['800','800','800','800','100','800'],
            "MATNR":['FG111','FG126','FG129','FG00','FG100','FG766'],
            "MTART":['FERT','FERT','FERT','FERT','FERT','FERT'],
            "MATKL":['L004','L004','L004','L004','L004','L004'],
            "MEINS":['ST','ST','ST','XX','ST','ST'],
            "CADKZ":['','','','','',''],
            "KZKFG":['','','','','',''],
            "LVORM":['','','','X','','']
        };

        let oMarc= {
            "MANDT":['800','800','800','800','800','800','800','100', '800'],
            "MATNR":['FG111','FG111','FG126','fg126','FG129','FG129',' FG00','FG100', 'FG766'],
            "WERKS":['1010','1710','1010','1710','1010','1710','1010','1010', '1010'],
            "EKGRP":['001','','002','','','','','', ''],
            "LOSGR":[null,null,null,null,null,null,null,null,null],
            "LVORM":['','','','','','','','','']
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
                        plant: {
                            name: "sap.plc.db::basis.t_plant",
                            data: oPlant
                        },
                        valuationClass: {
                            name: "sap.plc.db::basis.t_valuation_class",
                            data: oValuationClass
                        },
                        material:{
                            name: "sap.plc.db::basis.t_material",
                            data: oMaterial
                        },
                        uom: {
                            name: "sap.plc.db::basis.t_uom",
                            data :  testDataRepl.mReplCsvFiles.uom
                        },
                        uomMapping: {
                            name: "sap.plc.db::map.t_uom_mapping",
                            data :  testDataRepl.mReplCsvFiles.uom_mapping
                        },
                        overheadGroup: {
                            name: "sap.plc.db::basis.t_overhead_group",
                            data: oOverheadGroup
                        },
                        material_plant: {
                            name: "sap.plc.db::basis.t_material_plant",
                            data: oMaterialPlant
                        },
                        marc_staging:{
                            name: "sap.plc.db::repl_st.t_marc",
                            data: oMarc
                        },
                        mbew_staging:{
                            name: "sap.plc.db::repl_st.t_mbew",
                            data: oMbew
                        },
                        mara_staging:{
                            name: "sap.plc.db::repl_st.t_mara",
                            data: oMara
                        },          
                        t001w_staging: {
                            name: "sap.plc.db::repl_st.t_t001w",
                            data: oT001w
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

 
        it('should insert/modify/delete material plant as expected', function () {

            let sEntity = 't_material_plant';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_plant");
            //get data for one material account with source 2 which was migrated before from erp, client 800
            let oOldEntrySourceERP = oMockstarPlc.execQuery(`select * from {{material_plant}} where  _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{material_plant}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{material_plant}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{material_plant}} where  _valid_to is null`);
  
            expect(oEntriesSourcePlcResult.columns.MATERIAL_ID.rows.length).toEqual(3);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "MATERIAL_ID": [oMaterialPlant.MATERIAL_ID[0],oMaterialPlant.MATERIAL_ID[1],oMaterialPlant.MATERIAL_ID[2]],
                "PLANT_ID": [oMaterialPlant.PLANT_ID[0],oMaterialPlant.PLANT_ID[1],oMaterialPlant.PLANT_ID[2]],
                "OVERHEAD_GROUP_ID": [oMaterialPlant.OVERHEAD_GROUP_ID[0],oMaterialPlant.OVERHEAD_GROUP_ID[1],oMaterialPlant.OVERHEAD_GROUP_ID[2]],
                "VALUATION_CLASS_ID": [oMaterialPlant.VALUATION_CLASS_ID[0],oMaterialPlant.VALUATION_CLASS_ID[1],oMaterialPlant.VALUATION_CLASS_ID[2]],
                "MATERIAL_LOT_SIZE": [oMaterialPlant.MATERIAL_LOT_SIZE[0],oMaterialPlant.MATERIAL_LOT_SIZE[1],oMaterialPlant.MATERIAL_LOT_SIZE[2]],
                "MATERIAL_LOT_SIZE_UOM_ID": [oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[0],oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[1],oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[2]],
                "_SOURCE": [1,1,1],
                "DELETED_FROM_SOURCE": [null,null,null]
            }, []);

            expect(oEntriesSourceErpResult.columns.MATERIAL_ID.rows.length).toEqual(6);

            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "MATERIAL_ID": [oMaterialPlant.MATERIAL_ID[4],oMaterialPlant.MATERIAL_ID[3],oMbew.MATNR[0],oMbew.MATNR[4],oMbew.MATNR[5],oMbew.MATNR[1]],
                "PLANT_ID": [oMaterialPlant.PLANT_ID[4],oMaterialPlant.PLANT_ID[3],oMarc.WERKS[2],oMarc.WERKS[4],oMarc.WERKS[5],oMarc.WERKS[1]],
                 "OVERHEAD_GROUP_ID": [oMaterialPlant.OVERHEAD_GROUP_ID[4],oMaterialPlant.OVERHEAD_GROUP_ID[3],oMbew.KOSGR[0],oMbew.KOSGR[4],oMbew.KOSGR[5],oMbew.KOSGR[1]],
                 "VALUATION_CLASS_ID": [oMaterialPlant.VALUATION_CLASS_ID[4],oMaterialPlant.VALUATION_CLASS_ID[3],oMbew.BKLAS[0],oMbew.BKLAS[4],oMbew.BKLAS[5],oMbew.BKLAS[1]],
                 "MATERIAL_LOT_SIZE": [oMaterialPlant.MATERIAL_LOT_SIZE[4],oMaterialPlant.MATERIAL_LOT_SIZE[3],oMarc.LOSGR[2],oMarc.LOSGR[4],oMarc.LOSGR[5],oMarc.LOSGR[1]],
                 "MATERIAL_LOT_SIZE_UOM_ID": [oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[4],oMaterialPlant.MATERIAL_LOT_SIZE_UOM_ID[3],"PC","PC", "PC", "PC"],
                "_SOURCE": [2,2,2,2,2,2],
                "DELETED_FROM_SOURCE": [null,null,null,null,null,null]
            }, ["MATERIAL_ID","PLANT_ID" ]);  //,"PLANT_ID","OVERHEAD_GROUP_ID","VALUATION_CLASS_ID"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_plant");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //one entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(4); //3 entries were added 1 entry was updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(6); //5 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["","MATERIAL_ID","OVERHEAD_GROUP_ID", "VALUATION_CLASS_ID",""],
                "FIELD_VALUE": ["","FG766","OGF",'V3',""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownMaterial.concat(" for Plant ID ").concat(oPlant.PLANT_ID[2]), 
                    oMessages.UnknownOverhead.concat(oPlant.PLANT_ID[2]), 
                    oMessages.UnknownValuationClass.concat(" for Plant ID ").concat(oPlant.PLANT_ID[2]), 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "replication_log");
         });

    }).addTags(["All_Unit_Tests"]);
}
