const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication.procedures.p_replicate_data_finance-tests", function () {

        let oMockstarPlc = null;
        const sRunId = 'NON_CLUSTERED160611756088';
        const oMessageTypes = {I:"INFO", E:"ERROR"};
        const oStatuses = {S: "SUCCESS"};
        const oMessages = {ReplStarted:"Replication started",
                           ChangePLCSource: "Changed to PLC source",
                           ReplEnded:"Replication ended",
                           UnknownContrAr:"Unknown Controlling Area ID",
                           UnknownCompCod:"Unknown Company Code ID",
                           UnknownAccIdContr:"Unknown Account ID for Controlling Area ID ",
                           UnknownPlant:"Unknown Plant ID",
                           UnknownOverheadPlant:"Unknown Plant ID for Overhead Group ID "
                           };
        const oOperations = {ReplProc:"Replication_Process",ReplDel:"Replication_Delete", ReplUpd:"Replication_Update"};

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade(
                {
                    testmodel: "sap.plc.db.masterdata_replication.procedures/p_replicate_data", // procedure under test

                    substituteTables: { // substitute all used tables in the procedure 
                        currency: {
                            name: "sap.plc.db::basis.t_currency",
                            data :  testDataRepl.oCurrency
                        },
                        language: {
                            name: "sap.plc.db::basis.t_language",
                            data :  testDataRepl.oLanguage
                        },
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
                        controllingArea: {
                            name: "sap.plc.db::basis.t_controlling_area",
                            data: testDataRepl.oControllingAreaRepl
                        },
                        controllingAreaText: {
                            name: "sap.plc.db::basis.t_controlling_area__text",
                            data: testDataRepl.oControllingAreaTextRepl
                        },
                        companyCode: {
                            name: "sap.plc.db::basis.t_company_code",
                            data: testDataRepl.oCompanyCodeRepl
                        },
                        companyCodeText: {
                            name: "sap.plc.db::basis.t_company_code__text",
                            data: testDataRepl.oCompanyCodeTextRepl
                        },
                        account: {
                            name: "sap.plc.db::basis.t_account",
                            data: testDataRepl.oAccountRepl
                        },
                        accountText: {
                            name: "sap.plc.db::basis.t_account__text",
                            data: testDataRepl.oAccountTextRepl
                        },
                        tka01 : { // controlling area
                            name: "sap.plc.db::repl_st.t_tka01",
                            data: testDataRepl.oTKA01
                        },
                        tka02 : { // company code
                            name: "sap.plc.db::repl_st.t_tka02",
                            data: testDataRepl.oTKA02
                        },
                        t001 : { // company code text
                            name: "sap.plc.db::repl_st.t_t001",
                            data: testDataRepl.oT001
                        },
                        cskb : { // account
                            name: "sap.plc.db::repl_st.t_cskb",
                            data: testDataRepl.oCSKB
                        },
                        csku : { // account text
                            name: "sap.plc.db::repl_st.t_csku",
                            data: testDataRepl.oCSKU
                        },
                        overheadGroup: {
                            name: "sap.plc.db::basis.t_overhead_group",
                            data: testDataRepl.oOverheadGroupRepl
                        },
                        overheadGroupText: {
                            name: "sap.plc.db::basis.t_overhead_group__text",
                            data: testDataRepl.oOverheadGroupTextRepl
                        },
                        t001w: {
                            name: "sap.plc.db::repl_st.t_t001w",
                            data: testDataRepl.oT001w_TCK14
                        },
                        tck14: {
                            name: "sap.plc.db::repl_st.t_tck14",
                            data: testDataRepl.oTCK14
                        },
                        tck15: {
                            name: "sap.plc.db::repl_st.t_tck15",
                            data: testDataRepl.oTCK15
                        },
                        tcurf:{
                            name: "sap.plc.db::repl_st.t_tcurf",
                            data:testDataRepl.oTCURF
                        },
                        tcurr:{
                            name: "sap.plc.db::repl_st.t_tcurr",
                            data:testDataRepl.oTCURR
                        },
                        currencyConversion:{
                            name: "sap.plc.db::basis.t_currency_conversion",
                            data: testDataRepl.oCurrencyConversionRepl
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

        it('should insert/modify/delete controlling area as expected', function() {
            //arrange
            let sEntity = 't_controlling_area';
            let sFieldName = 'CONTROLLING_AREA_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "controllingArea");
            //get data for 2 controlling areas with source 2 which were migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{controllingArea}} where controlling_area_id in ('${testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3]}','${testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[4]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{controllingArea}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{controllingArea}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{controllingArea}} where controlling_area_id in ('${testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3]}','${testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[4]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.CONTROLLING_AREA_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "CONTROLLING_AREA_ID": [testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[0],testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[1],testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[2],testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[4]],
                "_SOURCE": [1,1,1,1],
                "DELETED_FROM_SOURCE": [null, null, null, 1]
            }, ["CONTROLLING_AREA_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.CONTROLLING_AREA_ID.rows.length).toEqual(7);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "CONTROLLING_AREA_ID": [testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[4], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[0], testDataRepl.oTKA01.KOKRS[1], testDataRepl.oTKA01.KOKRS[2], testDataRepl.oTKA01.KOKRS[3], testDataRepl.oTKA01.KOKRS[6]],
                "_SOURCE": [2,2,2,2,2,2,2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
            }, ["CONTROLLING_AREA_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for controlling area after procedure runs
            mockstarHelpers.checkRowCount(oMockstarPlc, 11, "controllingArea");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(5); //5 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(5); //5 entries were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,""],
                "FIELD_NAME": ["",sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[4],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
        });

        it('should insert/modify/delete controlling area text as expected', function() {
            //arrange
            let sEntity = 't_controlling_area__text';
            let sFieldName = 'CONTROLLING_AREA_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "controllingAreaText");
        
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{controllingAreaText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{controllingAreaText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.CONTROLLING_AREA_ID.rows.length).toEqual(6);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "CONTROLLING_AREA_ID": [testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[0],testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[1],
                                        testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[2],testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[0],
                                        testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[1],testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[2]],
                "LANGUAGE": ["DE", "EN", "DE", "EN", "DE", "EN"],
                "CONTROLLING_AREA_DESCRIPTION": [testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[0],testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[1],
                                                 testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[2],testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[5],
                                                 testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[6],testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[7]],
                "_SOURCE": [1,1,1,1,1,1]
            }, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.CONTROLLING_AREA_ID.rows.length).toEqual(12);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "CONTROLLING_AREA_ID": [testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[0], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[0], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[0], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[0],
                                        testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3],
                                        testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[3], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[4], testDataRepl.oControllingAreaRepl.CONTROLLING_AREA_ID[4]],
                "LANGUAGE": ["EN", "DE", "FR", "ZZ", "EN", "DE", "FR", "ZZ", "EN", "DE", "EN", "DE"],
                "CONTROLLING_AREA_DESCRIPTION": [testDataRepl.oTKA01.BEZEI[0], testDataRepl.oTKA01.BEZEI[0], testDataRepl.oTKA01.BEZEI[0], testDataRepl.oTKA01.BEZEI[0],
                                                 testDataRepl.oTKA01.BEZEI[4], testDataRepl.oTKA01.BEZEI[4], testDataRepl.oTKA01.BEZEI[4], testDataRepl.oTKA01.BEZEI[4],
                                                 testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[3],  testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[3],  testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[4],  testDataRepl.oControllingAreaTextRepl.CONTROLLING_AREA_DESCRIPTION[4]],
                "_SOURCE": [2,2,2,2,2,2,2,2,2,2,2,2]
            }, ["CONTROLLING_AREA_ID", "LANGUAGE", "CONTROLLING_AREA_DESCRIPTION", "_SOURCE"]);

            //check source field for controlling area after procedure runs
            mockstarHelpers.checkRowCount(oMockstarPlc, 18, "controllingAreaText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(8); //8 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(20); //20 entries were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oTKA01.KOKRS[1],testDataRepl.oTKA01.KOKRS[1],testDataRepl.oTKA01.KOKRS[1],testDataRepl.oTKA01.KOKRS[1],testDataRepl.oTKA01.KOKRS[2],testDataRepl.oTKA01.KOKRS[2],testDataRepl.oTKA01.KOKRS[2],testDataRepl.oTKA01.KOKRS[2],testDataRepl.oTKA01.KOKRS[3],testDataRepl.oTKA01.KOKRS[3],testDataRepl.oTKA01.KOKRS[3],testDataRepl.oTKA01.KOKRS[3],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownContrAr, oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr,oMessages.UnknownContrAr, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 14, "replication_log");
        });

        it('should insert/modify/delete company code as expected', function() {
            //arrange
            let sEntity = 't_company_code';
            let sFieldName = 'COMPANY_CODE_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "companyCode");
            //get data for 1 company code with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{companyCode}} where company_code_id in ('${testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{companyCode}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{companyCode}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{companyCode}} where controlling_area_id in ('${testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.COMPANY_CODE_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "COMPANY_CODE_ID": [testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[0],testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[1],testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[2],testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[3]],
                "_SOURCE": [1,1,1,1],
                "DELETED_FROM_SOURCE": [null, null, null, 1]
            }, ["COMPANY_CODE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.COMPANY_CODE_ID.rows.length).toEqual(5);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "COMPANY_CODE_ID": [testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[0], testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[3], testDataRepl.oTKA02.BUKRS[1], testDataRepl.oTKA02.BUKRS[3], testDataRepl.oTKA02.BUKRS[5]],
                "_SOURCE": [2,2,2,2,2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null]
            }, ["COMPANY_CODE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "companyCode");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(4); //4 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,""],
                "FIELD_NAME": ["",sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[3],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
        });

        it('should insert/modify/delete company code text as expected', function() {
            //arrange
            let sEntity = 't_company_code__text';
            let sFieldName = 'COMPANY_CODE_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "companyCodeText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{companyCodeText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{companyCodeText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.COMPANY_CODE_ID.rows.length).toEqual(6);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "COMPANY_CODE_ID": [testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[0],testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[0],
                                    testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[1],testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[1],
                                    testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[2],testDataRepl.oCompanyCodeRepl.COMPANY_CODE_ID[2]],
                "LANGUAGE": ["EN", "DE", "EN", "DE", "EN", "DE"],
                "COMPANY_CODE_DESCRIPTION": [testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_DESCRIPTION[0],testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_DESCRIPTION[4],
                                                 testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_DESCRIPTION[1],testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_DESCRIPTION[5],
                                                 testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_DESCRIPTION[2],testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_DESCRIPTION[6]],
                "_SOURCE": [1,1,1,1,1,1]
            }, ["COMPANY_CODE_ID", "LANGUAGE", "COMPANY_CODE_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.COMPANY_CODE_ID.rows.length).toEqual(6);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "COMPANY_CODE_ID": [testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_ID[0], testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_ID[0], testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_ID[0],
                                    testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_ID[0], testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_ID[3], testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_ID[3]],
                "LANGUAGE": ["EN", "DE", "FR", "ZZ", "EN", "DE"],
                "COMPANY_CODE_DESCRIPTION": [testDataRepl.oT001.BUTXT[0], testDataRepl.oT001.BUTXT[0], testDataRepl.oT001.BUTXT[0],
                                             testDataRepl.oT001.BUTXT[0], testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_DESCRIPTION[3], testDataRepl.oCompanyCodeTextRepl.COMPANY_CODE_DESCRIPTION[3]],
                "_SOURCE": [2,2,2,2,2,2]
            }, ["COMPANY_CODE_ID", "LANGUAGE", "COMPANY_CODE_DESCRIPTION", "_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "companyCodeText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entry were deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(4); //4 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(16); //16 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oTKA02.BUKRS[1],testDataRepl.oTKA02.BUKRS[1],testDataRepl.oTKA02.BUKRS[1],testDataRepl.oTKA02.BUKRS[1],testDataRepl.oTKA02.BUKRS[3],testDataRepl.oTKA02.BUKRS[3],testDataRepl.oTKA02.BUKRS[3],testDataRepl.oTKA02.BUKRS[3],testDataRepl.oTKA02.BUKRS[5],testDataRepl.oTKA02.BUKRS[5],testDataRepl.oTKA02.BUKRS[5],testDataRepl.oTKA02.BUKRS[5],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownCompCod, oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod,oMessages.UnknownCompCod, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 14, "replication_log");
        });

        it('should insert/modify/delete account as expected', function() {
            //arrange
            let sEntity = 't_account';
            let sFieldName = 'ACCOUNT_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "account");
            
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{account}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{account}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.ACCOUNT_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "ACCOUNT_ID": ['#AC1', 'AC4', '#AC2', 'AC8'],
                "_SOURCE": [1,1,1,1],
                "DELETED_FROM_SOURCE": [null, null, 1, 1]
            }, ["ACCOUNT_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.ACCOUNT_ID.rows.length).toEqual(6);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "ACCOUNT_ID": ["#AC1","AC2","AC3","AC4","#AC2","AC8"],
                "_SOURCE": [2,2,2,2,2,2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
            }, ["ACCOUNT_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "account");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2);
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3);
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,""],
                "FIELD_NAME": ["","ACCOUNT_ID & CONTROLLING_AREA_ID","ACCOUNT_ID & CONTROLLING_AREA_ID",""],
                "FIELD_VALUE": ["",'AC8 | #CA1','#AC2 | #CA1',""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ChangePLCSource, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");
        });

        it('should insert/modify/delete account text as expected', function() {
            //arrange
            let sEntity = 't_account__text';
            let sFieldName = 'ACCOUNT_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "accountText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{accountText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{accountText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.ACCOUNT_ID.rows.length).toEqual(6);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "ACCOUNT_ID": ["#AC3","#AC3","#AC1","#AC1","#AC2","#AC2"],
                "LANGUAGE": ["EN","DE","EN","DE","EN","DE"],
                "ACCOUNT_DESCRIPTION": ["#AC3","#AC3","#AC1","#AC1","#AC2","#AC2"],
                "_SOURCE": [1,1,1,1,1,1]
            }, ["ACCOUNT_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.ACCOUNT_ID.rows.length).toEqual(8);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "ACCOUNT_ID": ["AC4","#AC1","#AC2","#AC1","#AC2","AC4","AC8","AC8"],
                "LANGUAGE": ["EN","EN","EN","DE","DE","DE","EN","DE"],
                "ACCOUNT_DESCRIPTION" :["AC4", "#AC1 Repl", "#AC2 Repl", "#AC1 Repl", "#AC2 Repl", "AC4", "AC8", "AC8"],
                "_SOURCE": [2,2,2,2,2,2,2,2]
            }, ["ACCOUNT_ID", "LANGUAGE", "ACCOUNT_DESCRIPTION", "_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 14, "accountText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(3); //2 entry were deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(4); //4 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(8); //16 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["", "ACCOUNT_ID", "ACCOUNT_ID", "ACCOUNT_ID", "ACCOUNT_ID", ""],
                "FIELD_VALUE": ["", "AC3", "AC4", "AC3", "AC4", ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownAccIdContr.concat("#CA1"), 
                    oMessages.UnknownAccIdContr.concat("#CA1"),
                    oMessages.UnknownAccIdContr.concat("#CA1"),
                    oMessages.UnknownAccIdContr.concat("#CA1"),
                    oMessages.ReplEnded
                ],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E,oMessageTypes.E,oMessageTypes.E,oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplUpd,oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "replication_log");
        });

        it('should insert/modify/delete overhead group as expected', function () {
            //arrange
            let sEntity = 't_overhead_group';
            let sFieldName = 'OVERHEAD_GROUP_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "overheadGroup");

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{overheadGroup}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{overheadGroup}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(5);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "OVERHEAD_GROUP_ID": ['#OG1', '#OG2', '#OG3', '#OG4', 'OG5'],
                "_SOURCE": [1, 1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, null, null, 1]
            }, ["OVERHEAD_GROUP_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(7);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "OVERHEAD_GROUP_ID": [testDataRepl.oTCK14.KOSGR[0], testDataRepl.oTCK14.KOSGR[0],
                testDataRepl.oTCK14.KOSGR[3], testDataRepl.oTCK14.KOSGR[3],
                testDataRepl.oTCK14.KOSGR[1], testDataRepl.oTCK14.KOSGR[2], testDataRepl.oTCK14.KOSGR[4]],
                "_SOURCE": [2, 2, 2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
            }, ["OVERHEAD_GROUP_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "overheadGroup");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(6); //6 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(7); //7 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, ""],
                "FIELD_NAME": ["", "PLANT_ID", sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oT001w_TCK14.WERKS[6], testDataRepl.oOverheadGroupRepl.OVERHEAD_GROUP_ID[4], ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownPlant.concat(" for Overhead Group ID ").concat(testDataRepl.oTCK14.KOSGR[9]), 
                    oMessages.ChangePLCSource, 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I,  oMessageTypes.E, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplDel, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");
        })

        it('should insert/modify/delete overhead group text as expected', function () {
            //arrange
            oMockstarPlc.clearTable('overheadGroup');
            oMockstarPlc.insertTableData('overheadGroup', testDataRepl.oOverheadGroupReplForText);
            let sEntity = 't_overhead_group__text';
            let sFieldName = 'OVERHEAD_GROUP_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "overheadGroupText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{overheadGroupText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{overheadGroupText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(2);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "OVERHEAD_GROUP_ID": [testDataRepl.oOverheadGroupTextRepl.OVERHEAD_GROUP_ID[0], testDataRepl.oOverheadGroupTextRepl.OVERHEAD_GROUP_ID[1]],
                "_SOURCE": [1, 1],
                "OVERHEAD_GROUP_DESCRIPTION": [testDataRepl.oOverheadGroupTextRepl.OVERHEAD_GROUP_DESCRIPTION[0],
                testDataRepl.oOverheadGroupTextRepl.OVERHEAD_GROUP_DESCRIPTION[1]]
            }, ["OVERHEAD_GROUP_ID", "_SOURCE", "OVERHEAD_GROUP_DESCRIPTION"]);

           expect(oEntriesSourceErpResult.columns.OVERHEAD_GROUP_ID.rows.length).toEqual(6);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "OVERHEAD_GROUP_ID": [testDataRepl.oTCK14.KOSGR[4], testDataRepl.oTCK14.KOSGR[4],
                testDataRepl.oTCK14.KOSGR[4], testDataRepl.oTCK14.KOSGR[7],
                testDataRepl.oTCK14.KOSGR[0], testDataRepl.oTCK14.KOSGR[1]],
                "_SOURCE": [2, 2, 2, 2, 2, 2],
                "LANGUAGE": ['EN', 'EN', 'EN', 'EN', 'DE', 'DE']
            }, ["OVERHEAD_GROUP_ID", "_SOURCE", "LANGUAGE"]);

             mockstarHelpers.checkRowCount(oMockstarPlc, 6, "overheadGroup");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(0); //0 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(5); //4 entries were added 1 entry was updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(7); //7 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, ""],
                "FIELD_NAME": ["", "PLANT_ID", "PLANT_ID", ""],
                "FIELD_VALUE": ["", "#PT4","#PT4", ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownOverheadPlant.concat(testDataRepl.oTCK14.KOSGR[7]), 
                    oMessages.UnknownOverheadPlant.concat(testDataRepl.oTCK14.KOSGR[0]), 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");
        })

        it('should insert/modify/delete currency conversion as expected', function () {
            //arrange
            oMockstarPlc.clearTable('currency');
            oMockstarPlc.insertTableData('currency', testDataRepl.oCurrencyRepl);
            let sEntity = 't_currency_conversion';
            let sFieldName = 'EXCHANGE_RATE_TYPE_ID & FROM_CURRENCY_ID & TO_CURRENCY_ID & VALID_FROM';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "currencyConversion");          

            let procedure = oMockstarPlc.loadProcedure();
            procedure();
            
            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{currencyConversion}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{currencyConversion}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(6);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "EXCHANGE_RATE_TYPE_ID": ['STANDARD', 'STANDARD', 'STANDARD', 'STANDARD', 'STANDARD', 'STANDARD'],
                "_SOURCE": [1, 1, 1, 1, 1, 1],
                "FROM_CURRENCY_ID": ['USD', 'USD', 'USD', 'USD', 'USD', 'CHF'],
                "TO_CURRENCY_ID": ['CNY', 'EUR', 'GBP', 'INR', 'RUB', 'BRL'],
                "RATE": ['6.2023500', '0.9164000', '0.6560500', '63.1475000', '52.0305000', '3.0000000']
            }, ["EXCHANGE_RATE_TYPE_ID", "_SOURCE", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "RATE"]);

            expect(oEntriesSourceErpResult.columns.EXCHANGE_RATE_TYPE_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "EXCHANGE_RATE_TYPE_ID": ['STANDARD', 'STANDARD', 'STANDARD', 'STANDARD'],
                "_SOURCE": [2, 2, 2, 2],
                "FROM_CURRENCY_ID": ['BRL', 'CAD', 'CHF', 'CHF'],
                "TO_CURRENCY_ID": ['CAD', 'BRL', 'BRL', 'BRL'],
                "RATE": ['0.4000000', '2.4000000', '3.0000000', '3.0000000']
            }, ["EXCHANGE_RATE_TYPE_ID", "_SOURCE", "FROM_CURRENCY_ID", "TO_CURRENCY_ID", "RATE"]);


            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //3 entries were added
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
                "FIELD_VALUE": ["", 'STANDARD | CHF | BRL | 2015-01-01', ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
        })
    }).addTags(["All_Unit_Tests"]);
}