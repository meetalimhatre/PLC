const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication.procedures.p_replicate_data_material_price-tests", function () {

        let oMockstarPlc = null;
        const sRunId = 'NON_CLUSTERED160611756088';
        const sValidFrom = '2015-01-01T15:39:09.691Z';
        const sValidTo = '2015-06-01T15:39:09.691Z';
        const oMessageTypes = {I:"INFO", E:"ERROR"};
        const oStatuses = {S: "SUCCESS"};
        const oMessages = {ReplStarted:"Replication started",
                           ChangePLCSource: "Changed to PLC source",
                           ReplEnded:"Replication ended",
                           UnknownWorkCentId:"Unknown Work Center ID for Plant ID "
                           };
        const oOperations = {ReplProc:"Replication_Process",ReplDel:"Replication_Delete", ReplUpd:"Replication_Update"};

        var dCurrentDate = new Date(Date.now() - 1000000000);
        var sENDDA = new Date(Date.now() + 1000000000);


        var oCRHD = {
            "MANDT": ["800", "800", "800"],
            "OBJTY": ["O1", "O1", "O1"],
            "OBJID": ["OBJID1", "OBJID2", "OBJID3"],
            "BEGDA": [dCurrentDate, dCurrentDate, dCurrentDate],
            "ENDDA": [sENDDA, sENDDA, sENDDA],
            "ARBPL": ["#WCEN111", "WCEN333", "WCEN222"],
            "WERKS": ["#PL1", "#PL2", "#PL2"],
            "VERWE": ["0001", "0002", "0001"],
            "LVORM": ["", "", ""],
            "VERAN": ["VER", "VE2", "VE3"],
            "ZGR01": ["ZGR", "ZGR", "ZGR"]
        };

        var oCRCO = {
            "MANDT": ["800", "800", "800"],
            "OBJTY": ["O1", "O1", "O1"],
            "OBJID": ["OBJID1", "OBJID2", "OBJID3"],
            "LASET": ["LST", "LST", "LST"],
            "ENDDA": [sENDDA, sENDDA, sENDDA],
            "LANUM": ["LN", "LN", "LN"],
            "BEGDA": [dCurrentDate, dCurrentDate, dCurrentDate],
            "KOKRS": ["#CA1", "#CA2", "#CA1"],
            "KOSTL": ["#CC1", "#CC2", "#CC1"]
        };

        var oTC31A = {
            "MANDT": ["800", "800", "800"],
            "ZGRAD": ["ZGR", "ZGR", "ZGR"],
            "DATUB": [sENDDA, sENDDA, sENDDA],
            "ZGKAL": ["30", "20", "30"]
        };

        var oCRTX = {
            "MANDT": ["800", "800", "800"],
            "OBJTY": ["O1", "O1", "O1"],
            "OBJID": ["OBJID1", "OBJID2", "OBJID3"],
            "SPRAS": ["E", "E", "E"],
            "KTEXT": ["WC desc upd", "WC2 desc", "WC added"]
        };

        //un update am

        var oWorkCenterRepl = {
            "WORK_CENTER_ID": ["#WCEN111", "WCEN222", "WCEN111"],
            "PLANT_ID": ["#PL1", "#PL2", "#PL1"],
            "WORK_CENTER_CATEGORY": ["MACHINE", "MACHINE", "MACHINE"],
            "COST_CENTER_ID": ["#CC1", "#CC1", "#CC1"],
            "CONTROLLING_AREA_ID": ["#CA1", "#CA1", "#CA1"],
            "WORK_CENTER_RESPONSIBLE": ["VER", "VER", "VER"],
            "EFFICIENCY": ["20", "20", "20"],
            "_VALID_FROM": [sValidFrom,  sValidFrom, sValidFrom],
            "_VALID_TO": [null, null, null],
            "_SOURCE": [1, 1, 2],
            "_CREATED_BY": ['U000001', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null]
        };

        var oWorkCenterReplText = {
            "WORK_CENTER_ID": ["#WCEN111", "WCEN111"],
            "PLANT_ID": ["#PL1", "#PL1"],
            "LANGUAGE": ["EN", "EN"],
            "WORK_CENTER_DESCRIPTION": ["#WCEN111 desc", "WCEN111 desc"],
            "_VALID_FROM": [sValidFrom, sValidFrom],
            "_VALID_TO": [null, null],
            "_SOURCE": [1, 2],
            "_CREATED_BY": ['U000001','U000001']
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
            "_VALID_TO": [null, null, null, null, null],
            "_SOURCE": [1, 1, 1, 2, 2],
            "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null]
        };
       
        let oPlantRepl = {
            "PLANT_ID" : ['#PL1' , '#PL2', '0003', '0001', '1010', '1710'],
            "COMPANY_CODE_ID" : ['#CC1', '#CC2', '0003', '0001', '1010', '1710'],
            "COUNTRY" : ['SPA', 'GER', 'US', 'DE', 'US','DE'],
            "POSTAL_CODE" : ['4324', '2345', '2654', '2345','2654', '2345'],
            "REGION" : ['REG1', 'REG3','REG4','REG5', 'REG4','REG5'],
            "CITY" : ['Berlin', 'Bucharest','Paris', 'Madrid','Palo Alto','Berlin'],
            "STREET_NUMBER_OR_PO_BOX" : ['4', '3','2','1','2','1'],
            "_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "_VALID_TO" : [null, null, null, null, null, null],
            "_SOURCE" :[1, 1, 2, 2, 2, 2],
            "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000002', 'U000003'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
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
                        crhd_staging: {
                            name: "sap.plc.db::repl_st.t_crhd",
                            data: oCRHD
                        },
                        crco_staging: {
                            name: "sap.plc.db::repl_st.t_crco",
                            data: oCRCO
                        },
                        tc31a_staging: {
                            name: "sap.plc.db::repl_st.t_tc31a",
                            data: oTC31A
                        },
                        crtx_staging: {
                            name: "sap.plc.db::repl_st.t_crtx",
                            data: oCRTX
                        },
                        plant: {
                            name: "sap.plc.db::basis.t_plant",
                            data: oPlantRepl
                        },
                        controllingArea: {
                            name: "sap.plc.db::basis.t_controlling_area",
                            data: oControllingAreaRepl
                        },
                        costCenter: {
                            name: "sap.plc.db::basis.t_cost_center",
                            data: oCostCenterRepl
                        },
                        activityType: {
                            name: "sap.plc.db::basis.t_activity_type",
                            data: oActivityTypeRepl
                        },
                        workCenterText: {
                            name: "sap.plc.db::basis.t_work_center__text",
                            data: oWorkCenterReplText
                        },
                        workCenter: {
                            name: "sap.plc.db::basis.t_work_center",
                            data: oWorkCenterRepl
                        },
                        languages: {
                            name: "sap.plc.db::basis.t_language",
                            data :  testDataRepl.mReplCsvFiles.languages
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

 
        it('should insert/modify/delete work center as expected', function () {

            let sEntity = 't_work_center';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "workCenter");
            
            let procedure = oMockstarPlc.loadProcedure();

            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{workCenter}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{workCenter}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            
            expect(oEntriesSourcePlcResult.columns.WORK_CENTER_ID.rows.length).toEqual(3);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
               "WORK_CENTER_ID": [oWorkCenterRepl.WORK_CENTER_ID[0], oWorkCenterRepl.WORK_CENTER_ID[1], oWorkCenterRepl.WORK_CENTER_ID[2]],
               "_SOURCE": [1, 1, 1],
               "DELETED_FROM_SOURCE": [null, null, 1]
            }, ["WORK_CENTER_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.WORK_CENTER_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "WORK_CENTER_ID": [oCRHD.ARBPL[0], oCRHD.ARBPL[1], oCRHD.ARBPL[2], oWorkCenterRepl.WORK_CENTER_ID[2]],
               "_SOURCE": [2, 2, 2, 2],
               "DELETED_FROM_SOURCE": [null, null, null, null]
            }, ["WORK_CENTER_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "workCenter");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //1 entry was added and 2 updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(3); //3 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,""],
               "FIELD_NAME": ["","WORK_CENTER_ID",""],
               "FIELD_VALUE": ["", oWorkCenterRepl.WORK_CENTER_ID[2], ""],
               "MESSAGE_TEXT": [oMessages.ReplStarted,oMessages.ChangePLCSource, oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I,oMessageTypes.I, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplDel,oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
        });

        it('should insert/modify/delete work center text as expected', function () {

            //arrange
            let sEntity = 't_work_center__text';
            let sFieldName = 'WORK_CENTER_ID';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 2, "workCenterText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{workCenterText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{workCenterText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun =oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.WORK_CENTER_ID.rows.length).toEqual(1);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "WORK_CENTER_ID": [oWorkCenterReplText.WORK_CENTER_ID[0]],
                "LANGUAGE": [oWorkCenterReplText.LANGUAGE[0]],
                "WORK_CENTER_DESCRIPTION": [oWorkCenterReplText.WORK_CENTER_DESCRIPTION[0]],
                "_SOURCE": [1]
            }, ["WORK_CENTER_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.WORK_CENTER_ID.rows.length).toEqual(3);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[0]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[1]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).not.toEqual(null);

            expect(oEntriesSourceErpResult).toMatchData({
                "WORK_CENTER_ID": [oCRHD.ARBPL[0], oCRHD.ARBPL[2], oWorkCenterReplText.WORK_CENTER_ID[1]],
                "LANGUAGE": ["EN", "EN", oWorkCenterReplText.LANGUAGE[1]],
                "WORK_CENTER_DESCRIPTION": [oCRTX.KTEXT[0], oCRTX.KTEXT[2], oWorkCenterReplText.WORK_CENTER_DESCRIPTION[1]],
                "_SOURCE": [2, 2, 2]
            }, ["WORK_CENTER_ID", "LANGUAGE", "WORK_CENTER_DESCRIPTION", "_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "workCenterText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entry was added and 1 updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(3); //3 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, ""],
                "FIELD_NAME": ["", sFieldName, ""],
                "FIELD_VALUE": ["", oCRHD.ARBPL[1], ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted,
                    oMessages.UnknownWorkCentId.concat(oCRHD.WERKS[1]), 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
        });

    }).addTags(["All_Unit_Tests"]);
}