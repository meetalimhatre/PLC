const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testDataRepl = require("../../../testdata/testdata_replication").data;

if (jasmine.plcTestRunParameters.mode === "all") {

    describe("db.masterdata_replication.procedures.p_replicate_data-tests", function () {

        let oMockstarPlc = null;
        const sRunId = 'NON_CLUSTERED160611756088';
        const oMessageTypes = {I:"INFO", E:"ERROR"};
        const oStatuses = {S: "SUCCESS"};
        const oMessages = {ReplStarted:"Replication started",
                           ChangePLCSource: "Changed to PLC source",
                           ReplEnded:"Replication ended",
                           UnknownMatGrp:"Unknown Material Group ID",
                           UnknownMatTyp:"Unknown Material Type ID",
                           UnknownMat:"Unknown Material ID",
                           UnknownBA:"Unknown Business Area ID",
                           UnknownVC:"Unknown Valuation Class ID",
                           UnknownCompCode:"Unknown Company Code ID",
                           UnknownPlnId:"Unknown Plant ID",
                           UnknownUoMId:"Unknown UOM ID",
                           UnknownCAId:"Unknown Controlling Area ID",
                           UnknownCostCenterId: "Unknown Cost Center ID for Controlling Area ID ",
                           UnknownAccId: "Unknown Account ID for Controlling Area ID ",
                           UnknownAId: "Unknown Account ID",
                           UnknownATId: "Unknown Activity Type ID for Controlling Area ID ",
                           UnknownPCId: "Unknown Profit Center ID for Controlling Area ID ",
                           UnknownPRId: "Unknown Process ID",
                           NoEntitiesEnabled: "Replication not started as no entities are currently enabled"
                           };
        const oOperations = {ReplProc:"Replication_Process",ReplDel:"Replication_Delete", ReplUpd:"Replication_Update"};

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
                            data: testDataRepl.oKna1
                        },
                        t023_staging: {
                            name: "sap.plc.db::repl_st.t_t023",
                            data: testDataRepl.oT023
                        },
                        t023t_staging: {
                            name: "sap.plc.db::repl_st.t_t023t",
                            data: testDataRepl.oT023t
                        },
                        t134_staging: {
                            name: "sap.plc.db::repl_st.t_t134",
                            data: testDataRepl.oT134
                        },
                        t134t_staging: {
                            name: "sap.plc.db::repl_st.t_t134t",
                            data: testDataRepl.oT134t
                        },
                        mara_staging: {
                            name: "sap.plc.db::repl_st.t_mara",
                            data: testDataRepl.oMara
                        },
                        makt_staging: {
                            name: "sap.plc.db::repl_st.t_makt",
                            data: testDataRepl.oMakt
                        },
                        t025_staging: {
                            name: "sap.plc.db::repl_st.t_t025",
                            data: testDataRepl.oT025
                        },
                        t025t_staging: {
                            name: "sap.plc.db::repl_st.t_t025t",
                            data: testDataRepl.oT025t
                        },
                        tgsb_staging: {
                            name: "sap.plc.db::repl_st.t_tgsb",
                            data: testDataRepl.oTgsb
                        },
                        tgsbt_staging: {
                            name: "sap.plc.db::repl_st.t_tgsbt",
                            data: testDataRepl.oTgsbt
                        },
                        t001w_staging: {
                            name: "sap.plc.db::repl_st.t_t001w",
                            data: testDataRepl.oT001w
                        },
                        t001k_staging: {
                            name: "sap.plc.db::repl_st.t_t001k",
                            data: testDataRepl.oT001k
                        },
                        t006_staging: {
                            name: "sap.plc.db::repl_st.t_t006",
                            data: testDataRepl.oT006
                        },
                        t006a_staging: {
                            name: "sap.plc.db::repl_st.t_t006a",
                            data: testDataRepl.oT006a
                        },
                        lfa1: {
                            name: "sap.plc.db::repl_st.t_lfa1",
                            data: testDataRepl.oLfa1
                        },
                        csks_staging: {
                            name: "sap.plc.db::repl_st.t_csks",
                            data: testDataRepl.oCSKS
                        },
                        cskt_staging: {
                            name: "sap.plc.db::repl_st.t_cskt",
                            data: testDataRepl.oCSKT
                        },
                        csla_staging: {
                            name: "sap.plc.db::repl_st.t_csla",
                            data: testDataRepl.oCSLA
                        },
                        cslt_staging: {
                            name: "sap.plc.db::repl_st.t_cslt",
                            data: testDataRepl.oCSLT
                        },
                        tdwa_staging: {
                            name: "sap.plc.db::repl_st.t_tdwa",
                            data: testDataRepl.oTDWA
                        },
                        tdwat_staging: {
                            name: "sap.plc.db::repl_st.t_tdwat",
                            data: testDataRepl.oTDWAT
                        },
                        tdws_staging: {
                            name: "sap.plc.db::repl_st.t_tdws",
                            data: testDataRepl.oTDWS
                        },
                        tdwst_staging: {
                            name: "sap.plc.db::repl_st.t_tdwst",
                            data: testDataRepl.oTDWST
                        },
                        draw_staging: {
                            name: "sap.plc.db::repl_st.t_draw",
                            data: testDataRepl.oDRAW
                        },
                        drat_staging: {
                            name: "sap.plc.db::repl_st.t_drat",
                            data: testDataRepl.oDRAT
                        },
                        cepc_staging: {
                            name: "sap.plc.db::repl_st.t_cepc",
                            data: testDataRepl.oCEPC
                        },
                        cepct_staging: {
                            name: "sap.plc.db::repl_st.t_cepct",
                            data: testDataRepl.oCEPCT
                        },
                        cbpr_staging: {
                            name: "sap.plc.db::repl_st.t_cbpr",
                            data: testDataRepl.oCBPR
                        },
                        cbpt_staging: {
                            name: "sap.plc.db::repl_st.t_cbpt",
                            data: testDataRepl.oCBPT
                        },
                        drad_staging: {
                            name: "sap.plc.db::repl_st.t_drad",
                            data: testDataRepl.oDrad
                        },
                        process: {
                            name: "sap.plc.db::basis.t_process",
                            data: testDataRepl.oProcessRepl
                        },
                        processText: {
                            name: "sap.plc.db::basis.t_process__text",
                            data: testDataRepl.oProcessTextRepl
                        },
                        profitCenter: {
                            name: "sap.plc.db::basis.t_profit_center",
                            data: testDataRepl.oProfitCenterRepl
                        },
                        profitCenterText: {
                            name: "sap.plc.db::basis.t_profit_center__text",
                            data: testDataRepl.oProfitCenterTextRepl
                        },
                        activityType: {
                            name: "sap.plc.db::basis.t_activity_type",
                            data: testDataRepl.oActivityTypeRepl
                        },
                        activityTypeText: {
                            name: "sap.plc.db::basis.t_activity_type__text",
                            data: testDataRepl.oActivityTypeTextRepl
                        },
                        costCenter: {
                            name: "sap.plc.db::basis.t_cost_center",
                            data: testDataRepl.oCostCenterRepl
                        },
                        costCenterText: {
                            name: "sap.plc.db::basis.t_cost_center__text",
                            data: testDataRepl.oCostCenterTextRepl
                        },
                        customer: {
                            name: "sap.plc.db::basis.t_customer",
                            data: testDataRepl.oCustomerRepl
                        },
                        document: {
                            name: "sap.plc.db::basis.t_document",
                            data: testDataRepl.oDocumentRepl
                        },
                        documentText: {
                            name: "sap.plc.db::basis.t_document__text",
                            data: testDataRepl.oDocumentTextRepl
                        },
                        documentStatus: {
                            name: "sap.plc.db::basis.t_document_status",
                            data: testDataRepl.oDocumentStatusRepl
                        },
                        documentStatusText: {
                            name: "sap.plc.db::basis.t_document_status__text",
                            data: testDataRepl.oDocumentStatusTextRepl
                        },
                        documentType: {
                            name: "sap.plc.db::basis.t_document_type",
                            data: testDataRepl.oDocumentTypeRepl
                        },
                        documentTypeText: {
                            name: "sap.plc.db::basis.t_document_type__text",
                            data: testDataRepl.oDocumentTypeTextRepl
                        },
                        documentMaterialLoad: {
                            name: "sap.plc.db::basis.t_document_material",
                            data: testDataRepl.oDocumentMaterialLoadRepl
                        },
                        materialGroup: {
                            name: "sap.plc.db::basis.t_material_group",
                            data: testDataRepl.oMaterialGroupRepl
                        },
                        materialGroupText: {
                            name: "sap.plc.db::basis.t_material_group__text",
                            data: testDataRepl.oMaterialGroupTextRepl
                        },
                        materialType: {
                            name: "sap.plc.db::basis.t_material_type",
                            data: testDataRepl.oMaterialTypeRepl
                        },
                        materialTypeText: {
                            name: "sap.plc.db::basis.t_material_type__text",
                            data: testDataRepl.oMaterialTypeTextRepl
                        },
                        material: {
                            name: "sap.plc.db::basis.t_material",
                            data: testDataRepl.oMaterialRepl
                        },
                        materialText: {
                            name: "sap.plc.db::basis.t_material__text",
                            data: testDataRepl.oMaterialTextRepl
                        },
                        businessArea: {
                            name: "sap.plc.db::basis.t_business_area",
                            data: testDataRepl.oBusinessAreaRepl
                        },
                        businessAreaText: {
                            name: "sap.plc.db::basis.t_business_area__text",
                            data: testDataRepl.oBusinessAreaTextRepl
                        },
                        valuationClass: {
                            name: "sap.plc.db::basis.t_valuation_class",
                            data: testDataRepl.oValuationClassRepl
                        },
                        valuationClassText: {
                            name: "sap.plc.db::basis.t_valuation_class__text",
                            data: testDataRepl.oValuationClassTextRepl
                        },
                        languages: {
                            name: "sap.plc.db::basis.t_language",
                            data :  testDataRepl.oLanguageTestDataMdr
                        },
                        uom: {
                            name: "sap.plc.db::basis.t_uom",
                            data :  testDataRepl.mReplCsvFiles.uom
                        },
                        uom_mapping: {
                            name: "sap.plc.db::map.t_uom_mapping",
                            data :  testDataRepl.mReplCsvFiles.uom_mapping
                        },
                        uomText: {
                            name: "sap.plc.db::basis.t_uom__text",
                            data: testDataRepl.oUomTextRepl
                        },
                        plant: {
                            name: "sap.plc.db::basis.t_plant",
                            data: testDataRepl.oPlantRepl
                        },
                        plantText: {
                            name: "sap.plc.db::basis.t_plant__text",
                            data: testDataRepl.oPlantRplText
                        },
                        company_code: {
                            name: "sap.plc.db::basis.t_company_code",
                            data: testDataRepl.oCompanyCodeRepl
                        },
                        vendor: {
                            name: "sap.plc.db::basis.t_vendor",
                            data: testDataRepl.oVendorReplTool
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

        it('should insert/modify/delete process as expected', function () {

            //arrange
            let sEntity = 't_process';
            let sFieldName = 'PROCESS_ID';
            let sSubFieldName1 = "CONTROLLING_AREA_ID";
            let sSubFieldName2 = "ACCOUNT_ID";

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "process");
            //get data for 1 process with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{process}} where process_id in ('${testDataRepl.oProcessRepl.PROCESS_ID[3]}', '${testDataRepl.oProcessRepl.PROCESS_ID[4]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{process}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{process}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{process}} where process_id in ('${testDataRepl.oProcessRepl.PROCESS_ID[3]}', '${testDataRepl.oProcessRepl.PROCESS_ID[4]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.PROCESS_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "PROCESS_ID": [testDataRepl.oProcessRepl.PROCESS_ID[0], testDataRepl.oProcessRepl.PROCESS_ID[1], testDataRepl.oProcessRepl.PROCESS_ID[3], testDataRepl.oProcessRepl.PROCESS_ID[4]],
                "_SOURCE": [1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, 1, 1]
            }, ["PROCESS_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.PROCESS_ID.rows.length).toEqual(5);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "PROCESS_ID": [testDataRepl.oProcessRepl.PROCESS_ID[2], 'PR7', testDataRepl.oCBPR.PRZNR[4], testDataRepl.oProcessRepl.PROCESS_ID[3], testDataRepl.oProcessRepl.PROCESS_ID[4]],
                "_SOURCE": [2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null]
            }, ["PROCESS_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for process after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[1]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "process");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the sources were changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(5); //5 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, sEntity, sEntity, sEntity, ""],
                "FIELD_NAME": ["", sSubFieldName1, sSubFieldName2, sSubFieldName2, sFieldName + " & " + sSubFieldName1, sFieldName + " & " + sSubFieldName1, ""],
                "FIELD_VALUE": ["", testDataRepl.oCBPR.KOKRS[1], testDataRepl.oCBPR.VKSTA[0], testDataRepl.oCBPR.VKSTA[2],  testDataRepl.oProcessRepl.PROCESS_ID[3] + " | " + testDataRepl.oProcessRepl.CONTROLLING_AREA_ID[3], testDataRepl.oProcessRepl.PROCESS_ID[4] + " | " + testDataRepl.oProcessRepl.CONTROLLING_AREA_ID[4], ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, 
                    oMessages.UnknownCAId.concat(" for Process ID ").concat(testDataRepl.oCBPR.PRZNR[1]), 
                    oMessages.UnknownAId.concat(" for Process ID ").concat(testDataRepl.oCBPR.PRZNR[0]), 
                    oMessages.UnknownAId.concat(" for Process ID ").concat(testDataRepl.oCBPR.PRZNR[2]), 
                    oMessages.ChangePLCSource, 
                    oMessages.ChangePLCSource, 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "replication_log");
        });

        it('should insert/modify/delete process text as expected', function () {

            //arrange
            let sEntity = 't_process__text';
            let sFieldName = 'PROCESS_ID';
            let sSubFieldName = 'CONTROLLING_AREA_ID';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "processText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{processText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{processText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.PROCESS_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "PROCESS_ID": [testDataRepl.oProcessTextRepl.PROCESS_ID[0], testDataRepl.oProcessTextRepl.PROCESS_ID[1],testDataRepl.oProcessTextRepl.PROCESS_ID[2],testDataRepl.oProcessTextRepl.PROCESS_ID[3],],
                "LANGUAGE": [testDataRepl.oProcessTextRepl.LANGUAGE[0], testDataRepl.oProcessTextRepl.LANGUAGE[1],testDataRepl.oProcessTextRepl.LANGUAGE[2],testDataRepl.oProcessTextRepl.LANGUAGE[3]],
                "PROCESS_DESCRIPTION": [testDataRepl.oProcessTextRepl.PROCESS_DESCRIPTION[0], testDataRepl.oProcessTextRepl.PROCESS_DESCRIPTION[1],testDataRepl.oProcessTextRepl.PROCESS_DESCRIPTION[2],testDataRepl.oProcessTextRepl.PROCESS_DESCRIPTION[3]],
                "_SOURCE": [1, 1, 1, 1]
            }, ["PROCESS_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.PROCESS_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[0]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[1]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).not.toEqual(null);

            expect(oEntriesSourceErpResult).toMatchData({
                "PROCESS_ID": [testDataRepl.oProcessTextRepl.PROCESS_ID[4], testDataRepl.oCBPT.PRZNR[0], testDataRepl.oCBPT.PRZNR[1], testDataRepl.oProcessTextRepl.PROCESS_ID[5]],
                "LANGUAGE": [testDataRepl.oProcessTextRepl.LANGUAGE[4], "EN", "EN", testDataRepl.oProcessTextRepl.LANGUAGE[5]],
                "PROCESS_DESCRIPTION": [testDataRepl.oProcessTextRepl.PROCESS_DESCRIPTION[4], testDataRepl.oCBPT.KTEXT[0], testDataRepl.oCBPT.KTEXT[1], testDataRepl.oProcessTextRepl.PROCESS_DESCRIPTION[5]],
                "_SOURCE": [2, 2, 2, 2]
            }, ["PROCESS_ID", "LANGUAGE", "PROCESS_DESCRIPTION", "_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "processText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entry was added and 1 updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, ""],
                "FIELD_NAME": ["", sFieldName, sSubFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oCBPT.PRZNR[3], testDataRepl.oCBPT.KOKRS[2], ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownPRId.concat(" for Controlling Area ID ").concat(testDataRepl.oCBPT.KOKRS[3]), 
                    oMessages.UnknownCAId.concat(" for Process ID ").concat(testDataRepl.oCBPT.PRZNR[2]), 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");
        });

        it('should insert/modify/delete profit center as expected', function () {

            //arrange
            let sEntity = 't_profit_center';
            let sFieldName = 'PROFIT_CENTER_ID & CONTROLLING_AREA_ID';
            let sSubFieldName = 'CONTROLLING_AREA_ID';
           
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "profitCenter");
            //get data for 2 profit centers with source 2 which were migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{profitCenter}} where profit_center_id in ('${testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[3]}', '${testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[4]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{profitCenter}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{profitCenter}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{profitCenter}} where profit_center_id in ('${testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[3]}', '${testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[4]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.PROFIT_CENTER_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "PROFIT_CENTER_ID": [testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[0], testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[1], testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[3], testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[4]],
                "_SOURCE": [1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, 1, 1]
            }, ["PROFIT_CENTER_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.PROFIT_CENTER_ID.rows.length).toEqual(6);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "PROFIT_CENTER_ID": [testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[2], "0PC7", "PC8", testDataRepl.oCEPC.PRCTR[4], testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[3], testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[4]],
                "_SOURCE": [2, 2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
            }, ["PROFIT_CENTER_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for profit center after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[1]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "profitCenter");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the sources were changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //3 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(5); //5 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, sEntity, ""],
                "FIELD_NAME": ["", sSubFieldName, sFieldName, sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oCEPC.KOKRS[1], testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[3] + " | " + testDataRepl.oProfitCenterRepl.CONTROLLING_AREA_ID[3],  testDataRepl.oProfitCenterRepl.PROFIT_CENTER_ID[4] + " | " + testDataRepl.oProfitCenterRepl.CONTROLLING_AREA_ID[4], ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownCAId.concat(" for Profit Center ID ").concat(testDataRepl.oCEPC.PRCTR[1]), 
                    oMessages.ChangePLCSource, 
                    oMessages.ChangePLCSource, 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "replication_log");
        });

        it('should insert/modify/delete profit center text as expected', function () {

            //arrange
            let sEntity = 't_profit_center__text';
            let sFieldName = 'PROFIT_CENTER_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "profitCenterText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{profitCenterText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{profitCenterText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.PROFIT_CENTER_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "PROFIT_CENTER_ID": [testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_ID[0], testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_ID[1],testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_ID[2],testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_ID[3],],
                "LANGUAGE": [testDataRepl.oProfitCenterTextRepl.LANGUAGE[0], testDataRepl.oProfitCenterTextRepl.LANGUAGE[1],testDataRepl.oProfitCenterTextRepl.LANGUAGE[2],testDataRepl.oProfitCenterTextRepl.LANGUAGE[3]],
                "PROFIT_CENTER_DESCRIPTION": [testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_DESCRIPTION[0], testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_DESCRIPTION[1],testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_DESCRIPTION[2],testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_DESCRIPTION[3]],
                "_SOURCE": [1, 1, 1, 1]
            }, ["PROFIT_CENTER_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.PROFIT_CENTER_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[0]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[1]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).not.toEqual(null);

            expect(oEntriesSourceErpResult).toMatchData({
                "PROFIT_CENTER_ID": [testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_ID[4], testDataRepl.oCEPCT.PRCTR[0], testDataRepl.oCEPCT.PRCTR[1], testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_ID[5]],
                "LANGUAGE": [testDataRepl.oProfitCenterTextRepl.LANGUAGE[4], "EN", "EN", testDataRepl.oProfitCenterTextRepl.LANGUAGE[5]],
                "PROFIT_CENTER_DESCRIPTION": [testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_DESCRIPTION[4], testDataRepl.oCEPCT.KTEXT[0], testDataRepl.oCEPCT.KTEXT[1], testDataRepl.oProfitCenterTextRepl.PROFIT_CENTER_DESCRIPTION[5]],
                "_SOURCE": [2, 2, 2, 2]
            }, ["PROFIT_CENTER_ID", "LANGUAGE", "PROFIT_CENTER_DESCRIPTION", "_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "profitCenterText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entry was added and 1 updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, ""],
                "FIELD_NAME": ["", sFieldName, sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oCEPCT.PRCTR[2], testDataRepl.oCEPCT.PRCTR[3], ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownPCId.concat(testDataRepl.oCEPCT.KOKRS[2]), 
                    oMessages.UnknownPCId.concat(testDataRepl.oCEPCT.KOKRS[3]), 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");
        });

        it('should insert/modify/delete activity type as expected', function () {

            //arrange
            let sEntity = 't_activity_type';
            let sSubEntity = "t_account__text";
            let sFieldName = 'ACTIVITY_TYPE_ID';
            let sSubFieldName1 = 'CONTROLLING_AREA_ID';
            let sSubFieldName2 = 'ACCOUNT_ID';
           
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activityType");
            //get data for 2 activity types with source 2 which were migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{activityType}} where activity_type_id in ('${testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[3]}', '${testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[4]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{activityType}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{activityType}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{activityType}} where activity_type_id in ('${testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[3]}', '${testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[4]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "ACTIVITY_TYPE_ID": [testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[0], testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[1], testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[3], testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[4]],
                "_SOURCE": [1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, 1, 1]
            }, ["ACTIVITY_TYPE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(6);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "ACTIVITY_TYPE_ID": [testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[2], testDataRepl.oCSLA.LSTAR[3], testDataRepl.oCSLA.LSTAR[4], "AT10", testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[3], testDataRepl.oActivityTypeRepl.ACTIVITY_TYPE_ID[4]],
                "ACCOUNT_ID": [testDataRepl.oActivityTypeRepl.ACCOUNT_ID[2], testDataRepl.oCSLA.VKSTA[3], "#AC11", testDataRepl.oCSLA.VKSTA[5], testDataRepl.oActivityTypeRepl.ACCOUNT_ID[3], testDataRepl.oActivityTypeRepl.ACCOUNT_ID[4]],
                "_SOURCE": [2, 2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
            }, ["ACTIVITY_TYPE_ID", "ACCOUNT_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for activity type after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[1]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "activityType");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the sources were changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //3 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(6); //6 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sSubEntity, sSubEntity, sEntity, sEntity, ""],
                "FIELD_NAME": ["", sSubFieldName1, sSubFieldName2, sSubFieldName2, 'ACTIVITY_TYPE_ID & CONTROLLING_AREA_ID', 'ACTIVITY_TYPE_ID & CONTROLLING_AREA_ID', ""],
                "FIELD_VALUE": ["", testDataRepl.oCSLA.KOKRS[1], testDataRepl.oCSLA.VKSTA[1], testDataRepl.oCSLA.VKSTA[2], 'AT4 | #CA1',
                    'AT5 | #CA1', ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownCAId.concat(" for Activity Type ID ").concat(testDataRepl.oCSLA.LSTAR[1]), 
                    oMessages.UnknownAccId.concat(testDataRepl.oCSLA.KOKRS[1]).concat(" and Activity Type ID ").concat(testDataRepl.oCSLA.LSTAR[1]), 
                    oMessages.UnknownAccId.concat(testDataRepl.oCSLA.KOKRS[2]).concat(" and Activity Type ID ").concat(testDataRepl.oCSLA.LSTAR[2]), 
                    oMessages.ChangePLCSource, 
                    oMessages.ChangePLCSource, 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "replication_log");
        });

        it('should insert/modify/delete activity type text as expected', function () {

            //arrange
            let sEntity = 't_activity_type__text';
            let sFieldName = 'ACTIVITY_TYPE_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "activityTypeText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{activityTypeText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{activityTypeText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "ACTIVITY_TYPE_ID": [testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_ID[0], testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_ID[1],testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_ID[2],testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_ID[3],],
                "LANGUAGE": [testDataRepl.oActivityTypeTextRepl.LANGUAGE[0], testDataRepl.oActivityTypeTextRepl.LANGUAGE[1],testDataRepl.oActivityTypeTextRepl.LANGUAGE[2],testDataRepl.oActivityTypeTextRepl.LANGUAGE[3]],
                "ACTIVITY_TYPE_DESCRIPTION": [testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_DESCRIPTION[0], testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_DESCRIPTION[1],testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_DESCRIPTION[2],testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_DESCRIPTION[3]],
                "_SOURCE": [1, 1, 1, 1]
            }, ["ACTIVITY_TYPE_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.ACTIVITY_TYPE_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[0]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[1]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).not.toEqual(null);

            expect(oEntriesSourceErpResult).toMatchData({
                "ACTIVITY_TYPE_ID": [testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_ID[5], testDataRepl.oCSLT.LSTAR[2], testDataRepl.oCSLT.LSTAR[1], testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_ID[4]],
                "LANGUAGE": [testDataRepl.oActivityTypeTextRepl.LANGUAGE[5], "DE", "EN", testDataRepl.oActivityTypeTextRepl.LANGUAGE[4]],
                "ACTIVITY_TYPE_DESCRIPTION": [testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_DESCRIPTION[5], testDataRepl.oCSLT.KTEXT[2], testDataRepl.oCSLT.KTEXT[1], testDataRepl.oActivityTypeTextRepl.ACTIVITY_TYPE_DESCRIPTION[4]],
                "_SOURCE": [2, 2, 2, 2]
            }, ["ACTIVITY_TYPE_ID", "LANGUAGE", "ACTIVITY_TYPE_DESCRIPTION", "_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "activityTypeText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entry was added and 1 updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, ""],
                "FIELD_NAME": ["", sFieldName, sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oCSLT.LSTAR[0], testDataRepl.oCSLT.LSTAR[3], ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownATId.concat(testDataRepl.oCSLT.KOKRS[0]), 
                    oMessages.UnknownATId.concat(testDataRepl.oCSLT.KOKRS[3]), 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");
        });

        it('should insert/modify/delete cost center as expected', function () {

            //arrange
            let sEntity = 't_cost_center';
            let sFieldName = 'COST_CENTER_ID';
            let sSubFieldName = 'CONTROLLING_AREA_ID';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "costCenter");
            //get data for 1 cost center with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{costCenter}} where cost_center_id in ('${testDataRepl.oCostCenterRepl.COST_CENTER_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{costCenter}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{costCenter}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{costCenter}} where cost_center_id in ('${testDataRepl.oCostCenterRepl.COST_CENTER_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.COST_CENTER_ID.rows.length).toEqual(3);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "COST_CENTER_ID": [testDataRepl.oCostCenterRepl.COST_CENTER_ID[0], testDataRepl.oCostCenterRepl.COST_CENTER_ID[1], testDataRepl.oCostCenterRepl.COST_CENTER_ID[3]],
                "_SOURCE": [1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, 1]
            }, ["COST_CENTER_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.COST_CENTER_ID.rows.length).toEqual(5);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "COST_CENTER_ID": [testDataRepl.oCostCenterRepl.COST_CENTER_ID[2], testDataRepl.oCSKS.KOSTL[0], "CC5", "0CC7", testDataRepl.oCostCenterRepl.COST_CENTER_ID[3]],
                "_SOURCE": [2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null]
            }, ["COST_CENTER_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for cost center after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "costCenter");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //3 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(5); //5 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, ""],
                "FIELD_NAME": ["", sSubFieldName, sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oCSKS.KOKRS[4], testDataRepl.oCostCenterRepl.COST_CENTER_ID[3], ""],
                "MESSAGE_TEXT": [
                    oMessages.ReplStarted, 
                    oMessages.UnknownCAId.concat(" for Cost Center ID ").concat(testDataRepl.oCSKS.KOSTL[4]), 
                    oMessages.ChangePLCSource, 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplDel, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");

        });

        it('should insert/modify/delete cost center text as expected', function () {

            //arrange
            let sEntity = 't_cost_center__text';
            let sFieldName = 'COST_CENTER_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "costCenterText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{costCenterText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{costCenterText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.COST_CENTER_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "COST_CENTER_ID": [testDataRepl.oCostCenterTextRepl.COST_CENTER_ID[0], testDataRepl.oCostCenterTextRepl.COST_CENTER_ID[1], testDataRepl.oCostCenterTextRepl.COST_CENTER_ID[2], testDataRepl.oCostCenterTextRepl.COST_CENTER_ID[3]],
                "LANGUAGE": [testDataRepl.oCostCenterTextRepl.LANGUAGE[0], testDataRepl.oCostCenterTextRepl.LANGUAGE[1], testDataRepl.oCostCenterTextRepl.LANGUAGE[2], testDataRepl.oCostCenterTextRepl.LANGUAGE[3]],
                "COST_CENTER_DESCRIPTION": [testDataRepl.oCostCenterTextRepl.COST_CENTER_DESCRIPTION[0], testDataRepl.oCostCenterTextRepl.COST_CENTER_DESCRIPTION[1], testDataRepl.oCostCenterTextRepl.COST_CENTER_DESCRIPTION[2], testDataRepl.oCostCenterTextRepl.COST_CENTER_DESCRIPTION[3]],
                "_SOURCE": [1, 1, 1, 1]
            }, ["COST_CENTER_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.COST_CENTER_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[0]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[1]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).not.toEqual(null);

            expect(oEntriesSourceErpResult).toMatchData({
                "COST_CENTER_ID": [testDataRepl.oCostCenterTextRepl.COST_CENTER_ID[4], testDataRepl.oCSKT.KOSTL[0], testDataRepl.oCSKT.KOSTL[3], testDataRepl.oCostCenterTextRepl.COST_CENTER_ID[5]],
                "LANGUAGE": [testDataRepl.oCostCenterTextRepl.LANGUAGE[4], "DE", "EN", testDataRepl.oCostCenterTextRepl.LANGUAGE[5]],
                "COST_CENTER_DESCRIPTION": [testDataRepl.oCostCenterTextRepl.COST_CENTER_DESCRIPTION[4], testDataRepl.oCSKT.KTEXT[0], testDataRepl.oCSKT.KTEXT[3], testDataRepl.oCostCenterTextRepl.COST_CENTER_DESCRIPTION[5]],
                "_SOURCE": [2, 2, 2, 2]
            }, ["COST_CENTER_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "costCenterText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entry was added and 1 updated
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, ""],
                "FIELD_NAME": ["", sFieldName, sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oCSKT.KOSTL[2], testDataRepl.oCSKT.KOSTL[1] , ""],
                "MESSAGE_TEXT": 
                [oMessages.ReplStarted, 
                    oMessages.UnknownCostCenterId.concat(testDataRepl.oCSKT.KOKRS[2]), 
                    oMessages.UnknownCostCenterId.concat(testDataRepl.oCSKT.KOKRS[1]), 
                    oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");
        });

        it('should insert/modify/delete document as expected', function () {

            //arrange
            let sEntity = 't_document';
            let sFieldName = 'DOCUMENT_ID & DOCUMENT_TYPE_ID & DOCUMENT_VERSION & DOCUMENT_PART';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "document");
            //get data for 1 document status with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{document}} where document_id in ('${testDataRepl.oDocumentRepl.DOCUMENT_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{document}} where _source = 1 order by DOCUMENT_ID`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{document}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{document}} where document_id in ('${testDataRepl.oDocumentRepl.DOCUMENT_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.DOCUMENT_ID.rows.length).toEqual(5);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "DOCUMENT_ID": [testDataRepl.oDocumentRepl.DOCUMENT_ID[0], testDataRepl.oDocumentRepl.DOCUMENT_ID[1], testDataRepl.oDocumentRepl.DOCUMENT_ID[2],  testDataRepl.oDocumentRepl.DOCUMENT_ID[4],  testDataRepl.oDocumentRepl.DOCUMENT_ID[5]],
                "DOCUMENT_PART": [testDataRepl.oDocumentRepl.DOCUMENT_PART[0], testDataRepl.oDocumentRepl.DOCUMENT_PART[1], testDataRepl.oDocumentRepl.DOCUMENT_PART[2],  testDataRepl.oDocumentRepl.DOCUMENT_PART[4],  testDataRepl.oDocumentRepl.DOCUMENT_PART[5]],
                "DOCUMENT_VERSION": [testDataRepl.oDocumentRepl.DOCUMENT_VERSION[0], testDataRepl.oDocumentRepl.DOCUMENT_VERSION[1], testDataRepl.oDocumentRepl.DOCUMENT_VERSION[2],  testDataRepl.oDocumentRepl.DOCUMENT_VERSION[4],  testDataRepl.oDocumentRepl.DOCUMENT_VERSION[5]],
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentRepl.DOCUMENT_TYPE_ID[0], testDataRepl.oDocumentRepl.DOCUMENT_TYPE_ID[1], testDataRepl.oDocumentRepl.DOCUMENT_TYPE_ID[2],  testDataRepl.oDocumentRepl.DOCUMENT_TYPE_ID[4],  testDataRepl.oDocumentRepl.DOCUMENT_TYPE_ID[5]],
                "DOCUMENT_STATUS_ID": [testDataRepl.oDocumentRepl.DOCUMENT_STATUS_ID[0], testDataRepl.oDocumentRepl.DOCUMENT_STATUS_ID[1], testDataRepl.oDocumentRepl.DOCUMENT_STATUS_ID[2],  testDataRepl.oDocumentRepl.DOCUMENT_STATUS_ID[4],  testDataRepl.oDocumentRepl.DOCUMENT_STATUS_ID[5]],
                "_SOURCE": [1, 1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, 1, null, null]
            }, ["DOCUMENT_TYPE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.DOCUMENT_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "DOCUMENT_ID": [testDataRepl.oDocumentRepl.DOCUMENT_ID[2], "D5", "D4", testDataRepl.oDocumentRepl.DOCUMENT_ID[2]],
                "DOCUMENT_PART": [testDataRepl.oDocumentRepl.DOCUMENT_PART[2], "P5", "P4", testDataRepl.oDocumentRepl.DOCUMENT_PART[2]],
                "DOCUMENT_VERSION": [testDataRepl.oDocumentRepl.DOCUMENT_VERSION[2], "V5", "V4", testDataRepl.oDocumentRepl.DOCUMENT_VERSION[2]],
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentRepl.DOCUMENT_TYPE_ID[2], "DT3", "DT4", testDataRepl.oDocumentRepl.DOCUMENT_TYPE_ID[2]],
                "DOCUMENT_STATUS_ID": [testDataRepl.oDocumentRepl.DOCUMENT_STATUS_ID[2], "D4", "D4", testDataRepl.oDocumentRepl.DOCUMENT_STATUS_ID[2]],
                "_SOURCE": [2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null]
            }, ["DOCUMENT_TYPE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for document status after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "document");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(2); //2 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, ""],
                "FIELD_NAME": ["", sFieldName, ""],
                "FIELD_VALUE": ["", 'D2|DT2|V2|P2', ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, "Changed to PLC source", oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");

        });

        it('should insert/modify/delete document text as expected', function () {

            //arrange
            let sEntity = 't_document__text';
            let sFieldName = 'DOCUMENT_ID';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "documentText");
            //get data for 1 document type with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{documentText}} where document_id in ('${testDataRepl.oDocumentTextRepl.DOCUMENT_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{documentText}} where _source = 1 order by DOCUMENT_ID`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{documentText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{documentText}} where document_id in ('${testDataRepl.oDocumentTextRepl.DOCUMENT_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.DOCUMENT_ID.rows.length).toEqual(5);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "DOCUMENT_ID": [testDataRepl.oDocumentTextRepl.DOCUMENT_ID[0], testDataRepl.oDocumentTextRepl.DOCUMENT_ID[1], testDataRepl.oDocumentTextRepl.DOCUMENT_ID[2], testDataRepl.oDocumentTextRepl.DOCUMENT_ID[5],  testDataRepl.oDocumentTextRepl.DOCUMENT_ID[6]],
                "DOCUMENT_PART": [testDataRepl.oDocumentTextRepl.DOCUMENT_PART[0], testDataRepl.oDocumentTextRepl.DOCUMENT_PART[1], testDataRepl.oDocumentTextRepl.DOCUMENT_PART[2], testDataRepl.oDocumentTextRepl.DOCUMENT_PART[5],  testDataRepl.oDocumentTextRepl.DOCUMENT_PART[6]],
                "DOCUMENT_VERSION": [testDataRepl.oDocumentTextRepl.DOCUMENT_VERSION[0], testDataRepl.oDocumentTextRepl.DOCUMENT_VERSION[1], testDataRepl.oDocumentTextRepl.DOCUMENT_VERSION[2], testDataRepl.oDocumentTextRepl.DOCUMENT_VERSION[5],  testDataRepl.oDocumentTextRepl.DOCUMENT_VERSION[6]],
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentTextRepl.DOCUMENT_TYPE_ID[0], testDataRepl.oDocumentTextRepl.DOCUMENT_TYPE_ID[1], testDataRepl.oDocumentTextRepl.DOCUMENT_TYPE_ID[2], testDataRepl.oDocumentTextRepl.DOCUMENT_TYPE_ID[5],  testDataRepl.oDocumentTextRepl.DOCUMENT_TYPE_ID[6]],
                "LANGUAGE": [testDataRepl.oDocumentTextRepl.LANGUAGE[0], testDataRepl.oDocumentTextRepl.LANGUAGE[1], testDataRepl.oDocumentTextRepl.LANGUAGE[2], testDataRepl.oDocumentTextRepl.LANGUAGE[5], testDataRepl.oDocumentTextRepl.LANGUAGE[6]],
                "DOCUMENT_DESCRIPTION": [testDataRepl.oDocumentTextRepl.DOCUMENT_DESCRIPTION[0], testDataRepl.oDocumentTextRepl.DOCUMENT_DESCRIPTION[1], testDataRepl.oDocumentTextRepl.DOCUMENT_DESCRIPTION[2], testDataRepl.oDocumentTextRepl.DOCUMENT_DESCRIPTION[5], testDataRepl.oDocumentTextRepl.DOCUMENT_DESCRIPTION[6]],
                "_SOURCE": [1, 1, 1, 1, 1]
            }, ["DOCUMENT_ID", "DOCUMENT_PART", "DOCUMENT_VERSION", "DOCUMENT_TYPE_ID", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.DOCUMENT_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "DOCUMENT_ID": [testDataRepl.oDocumentTextRepl.DOCUMENT_ID[3], "D4", "D4", testDataRepl.oDocumentTextRepl.DOCUMENT_ID[4]],
                "DOCUMENT_PART": [testDataRepl.oDocumentTextRepl.DOCUMENT_PART[3], "P4", "P4", testDataRepl.oDocumentTextRepl.DOCUMENT_PART[4]],
                "DOCUMENT_VERSION": [testDataRepl.oDocumentTextRepl.DOCUMENT_VERSION[3], "V4", "V4", testDataRepl.oDocumentTextRepl.DOCUMENT_VERSION[4]],
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentTextRepl.DOCUMENT_TYPE_ID[3], "DT4", "DT4", testDataRepl.oDocumentTextRepl.DOCUMENT_TYPE_ID[4]],
                "LANGUAGE": [testDataRepl.oDocumentTextRepl.LANGUAGE[3], "DE", "EN", testDataRepl.oDocumentTextRepl.LANGUAGE[4]],
                "DOCUMENT_DESCRIPTION": [testDataRepl.oDocumentTextRepl.DOCUMENT_DESCRIPTION[3], "DE DESC", "EN DESC", testDataRepl.oDocumentTextRepl.DOCUMENT_DESCRIPTION[4]],
                "_SOURCE": [2, 2, 2, 2]
            }, ["DOCUMENT_ID", "DOCUMENT_PART", "DOCUMENT_VERSION", "DOCUMENT_TYPE_ID", "LANGUAGE", "DOCUMENT_DESCRIPTION", "_SOURCE"]);

            //check source field for document type after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "documentText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(2); //2 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");
            
            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", ""],
                "FIELD_NAME": ["", ""],
                "FIELD_VALUE": ["", ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 2, "replication_log");

        });
        
        it('should insert/modify/delete document status as expected', function () {

            //arrange
            let sEntity = 't_document_status';
            let sFieldName = "DOCUMENT_TYPE_ID & DOCUMENT_STATUS_ID";

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "documentStatus");
            //get data for 1 document status with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{documentStatus}} where document_status_id in ('${testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{documentStatus}} where _source = 1 order by DOCUMENT_STATUS_ID`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{documentStatus}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{documentStatus}} where document_status_id in ('${testDataRepl.oDocumentStatus.DOCUMENT_STATUS_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(5);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentStatusRepl.DOCUMENT_TYPE_ID[0], testDataRepl.oDocumentStatusRepl.DOCUMENT_TYPE_ID[1], testDataRepl.oDocumentStatusRepl.DOCUMENT_TYPE_ID[2],  testDataRepl.oDocumentStatusRepl.DOCUMENT_TYPE_ID[4],  testDataRepl.oDocumentStatusRepl.DOCUMENT_TYPE_ID[5]],
                "DOCUMENT_STATUS_ID": [testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[0], testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[1], testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[2],  testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[4],  testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[5]],
                "_SOURCE": [1, 1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, 1, null, null]
            }, ["DOCUMENT_TYPE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(3);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentStatusRepl.DOCUMENT_TYPE_ID[2], "DT3", testDataRepl.oDocumentStatusRepl.DOCUMENT_TYPE_ID[2]],
                "DOCUMENT_STATUS_ID": [testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[2], "D5", testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[2]],
                "_SOURCE": [2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null]
            }, ["DOCUMENT_TYPE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for document status after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "documentStatus");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(1); //1 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(1); //1 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, ""],
                "FIELD_NAME": ["", sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oDocumentStatusRepl.DOCUMENT_TYPE_ID[2] + '|' + testDataRepl.oDocumentStatusRepl.DOCUMENT_STATUS_ID[2], ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");

        });

        it('should insert/modify/delete document status text as expected', function () {

            //arrange
            let sEntity = 't_document_status__text';
            let sFieldName = 'DOCUMENT_STATUS_ID';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "documentStatusText");
            //get data for 1 document type with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{documentStatusText}} where document_status_id in ('${testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{documentStatusText}} where _source = 1 order by DOCUMENT_STATUS_ID`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{documentStatusText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{documentStatusText}} where document_status_id in ('${testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(5);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "DOCUMENT_STATUS_ID": [testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[0], testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[1], testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[2], testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[5],  testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[6]],
                "LANGUAGE": [testDataRepl.oDocumentStatusTextRepl.LANGUAGE[0], testDataRepl.oDocumentStatusTextRepl.LANGUAGE[1], testDataRepl.oDocumentStatusTextRepl.LANGUAGE[2], testDataRepl.oDocumentStatusTextRepl.LANGUAGE[5], testDataRepl.oDocumentStatusTextRepl.LANGUAGE[6]],
                "DOCUMENT_STATUS_DESCRIPTION": [testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_DESCRIPTION[0], testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_DESCRIPTION[1], testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_DESCRIPTION[2], testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_DESCRIPTION[5], testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_DESCRIPTION[6]],
                "_SOURCE": [1, 1, 1, 1, 1]
            }, ["DOCUMENT_STATUS_ID", "LANGUAGE", "DOCUMENT_STATUS_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.DOCUMENT_STATUS_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "DOCUMENT_STATUS_ID": [testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[3], "D4", "D4", testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_ID[4]],
                "LANGUAGE": [testDataRepl.oDocumentStatusTextRepl.LANGUAGE[3], "DE", "EN", testDataRepl.oDocumentStatusTextRepl.LANGUAGE[4]],
                "DOCUMENT_STATUS_DESCRIPTION": [testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_DESCRIPTION[3], "DE DESC", "EN DESC", testDataRepl.oDocumentStatusTextRepl.DOCUMENT_STATUS_DESCRIPTION[4]],
                "_SOURCE": [2, 2, 2, 2]
            }, ["DOCUMENT_STATUS_ID", "LANGUAGE", "DOCUMENT_STATUS_DESCRIPTION", "_SOURCE"]);

            //check source field for document type after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "documentStatusText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(2); //2 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");
            
            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", ""],
                "FIELD_NAME": ["", ""],
                "FIELD_VALUE": ["", ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 2, "replication_log");

        });


        it('should insert/modify/delete document type as expected', function () {

            //arrange
            let sEntity = 't_document_type';
            let sFieldName = 'DOCUMENT_TYPE_ID';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "documentType");
            //get data for 1 document type with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{documentType}} where document_type_id in ('${testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{documentType}} where _source = 1 order by DOCUMENT_TYPE_ID`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{documentType}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{documentType}} where document_type_id in ('${testDataRepl.oDocumentType.DOCUMENT_TYPE_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(5);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[0], testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[1], testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[2],  testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[4],  testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[5]],
                "_SOURCE": [1, 1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, 1, null, null]
            }, ["DOCUMENT_TYPE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(3);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[2], "DT5", testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[2]],
                "_SOURCE": [2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null]
            }, ["DOCUMENT_TYPE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for document type after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "documentType");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(1); //1 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(1); //1 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, ""],
                "FIELD_NAME": ["", sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[2], ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");

        });

        it('should insert/modify/delete document type text as expected', function () {

            //arrange
            let sEntity = 't_document_type__text';
            let sFieldName = 'DOCUMENT_TYPE_ID';

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "documentTypeText");
            //get data for 1 document type with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{documentTypeText}} where document_type_id in ('${testDataRepl.oDocumentTypeRepl.DOCUMENT_TYPE_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{documentTypeText}} where _source = 1 order by DOCUMENT_TYPE_ID`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{documentTypeText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{documentTypeText}} where document_type_id in ('${testDataRepl.oDocumentType.DOCUMENT_TYPE_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(5);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_ID[0], testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_ID[1], testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_ID[2], testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_ID[5],  testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_ID[6]],
                "LANGUAGE": [testDataRepl.oDocumentTypeTextRepl.LANGUAGE[0], testDataRepl.oDocumentTypeTextRepl.LANGUAGE[1], testDataRepl.oDocumentTypeTextRepl.LANGUAGE[2], testDataRepl.oDocumentTypeTextRepl.LANGUAGE[5], testDataRepl.oDocumentTypeTextRepl.LANGUAGE[6]],
                "DOCUMENT_TYPE_DESCRIPTION": [testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_DESCRIPTION[0], testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_DESCRIPTION[1], testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_DESCRIPTION[2], testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_DESCRIPTION[5], testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_DESCRIPTION[6]],
                "_SOURCE": [1, 1, 1, 1, 1]
            }, ["DOCUMENT_TYPE_ID", "LANGUAGE", "DOCUMENT_TYPE_DESCRIPTION", "_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_ID[3], "DT4", "DT4", testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_ID[4]],
                "LANGUAGE": [testDataRepl.oDocumentTypeTextRepl.LANGUAGE[3], "DE", "EN", testDataRepl.oDocumentTypeTextRepl.LANGUAGE[4]],
                "DOCUMENT_TYPE_DESCRIPTION": [testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_DESCRIPTION[3], "DE DESC", "EN DESC", testDataRepl.oDocumentTypeTextRepl.DOCUMENT_TYPE_DESCRIPTION[4]],
                "_SOURCE": [2, 2, 2, 2]
            }, ["DOCUMENT_TYPE_ID", "LANGUAGE", "DOCUMENT_TYPE_DESCRIPTION", "_SOURCE"]);

            //check source field for document type after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "documentTypeText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(2); //2 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");
            
            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", ""],
                "FIELD_NAME": ["", ""],
                "FIELD_VALUE": ["", ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 2, "replication_log");

        });

        it('should insert/modify/delete document material as expected', function () {

            //arrange
            let sEntity = 't_document_material';
            let sFieldName = "DOCUMENT_TYPE_ID & DOCUMENT_ID & DOCUMENT_VERSION & DOCUMENT_PART & MATERIAL_ID";

            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "documentMaterialLoad");
            //get data for 1 document type with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{documentMaterialLoad}} where document_type_id in ('${testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_TYPE_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{documentMaterialLoad}} where _source = 1 order by DOCUMENT_TYPE_ID`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{documentMaterialLoad}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{documentMaterialLoad}} where document_type_id in ('${testDataRepl.oDocumentType.DOCUMENT_TYPE_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(2);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "DOCUMENT_TYPE_ID": [ testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_TYPE_ID[1], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_TYPE_ID[1]],
                "DOCUMENT_ID": [ testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_ID[1], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_ID[1]],
                "DOCUMENT_VERSION": [ testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_VERSION[1], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_VERSION[0]],
                "DOCUMENT_PART": [ testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_PART[0], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_PART[1]],
                "MATERIAL_ID": [ testDataRepl.oDocumentMaterialLoadRepl.MATERIAL_ID[0], testDataRepl.oDocumentMaterialLoadRepl.MATERIAL_ID[1]],
                "_SOURCE": [1, 1],
                "DELETED_FROM_SOURCE": [0, 0]
            }, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "MATERIAL_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            expect(oEntriesSourceErpResult.columns.DOCUMENT_TYPE_ID.rows.length).toEqual(4);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "DOCUMENT_TYPE_ID": [testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_TYPE_ID[0], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_TYPE_ID[1], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_TYPE_ID[2], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_TYPE_ID[3]],
                "DOCUMENT_ID": [testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_ID[2], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_ID[2], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_ID[2], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_ID[3]],
                "DOCUMENT_VERSION": [testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_VERSION[3], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_VERSION[3], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_VERSION[2], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_VERSION[3]],
                "DOCUMENT_PART": ['P4', 'P4', testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_PART[2], testDataRepl.oDocumentMaterialLoadRepl.DOCUMENT_PART[3]],
                "MATERIAL_ID": [testDataRepl.oDocumentMaterialLoadRepl.MATERIAL_ID[3], '#MAT2', testDataRepl.oDocumentMaterialLoadRepl.MATERIAL_ID[2], testDataRepl.oDocumentMaterialLoadRepl.MATERIAL_ID[3]],
                "_SOURCE": [2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, 0, 0]
            }, ["DOCUMENT_TYPE_ID", "DOCUMENT_ID", "DOCUMENT_VERSION", "DOCUMENT_PART", "MATERIAL_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);


            //check source field for document type after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "documentMaterialLoad");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(2); //2 entries were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");
            
            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",  ""],
                "FIELD_NAME": ["", ""],
                "FIELD_VALUE": ["",  ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted,  oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I,  oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplProc]
            }, []);
            mockstarHelpers.checkRowCount(oMockstarPlc, 2, "replication_log");
            
        });

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

            mockstarHelpers.checkRowCount(oMockstarPlc, 13, "customer");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            expect(oCustomerSourcePlcResult.columns.CUSTOMER_ID.rows.length).toEqual(6);
            expect(oCustomerSourceErpResult.columns.CUSTOMER_ID.rows.length).toEqual(7);
            //check source field for customer after procedure runs
            expect(oCustomerSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oCustomerSourceERP.columns._SOURCE.rows[0]);

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(testDataRepl.oStatisticsCustomer.DELETED_COUNT[0]);
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(testDataRepl.oStatisticsCustomer.TABLE_NAME[0]);
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(testDataRepl.oStatisticsCustomer.FULL_COUNT[0]);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(testDataRepl.oStatisticsCustomer.UPDATED_COUNT[0]);

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(testDataRepl.oReplRunCustomer.MANUAL[0]);
            expect(oReplicationRun.STATUS[0]).toEqual(testDataRepl.oReplRunCustomer.STATUS[0]);

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": [testDataRepl.oReplLogCustomer.TABLE_NAME[0], testDataRepl.oReplLogCustomer.TABLE_NAME[1], testDataRepl.oReplLogCustomer.TABLE_NAME[2]],
                "FIELD_NAME": [testDataRepl.oReplLogCustomer.FIELD_NAME[0], testDataRepl.oReplLogCustomer.FIELD_NAME[1], testDataRepl.oReplLogCustomer.FIELD_NAME[2]],
                "FIELD_VALUE": [testDataRepl.oReplLogCustomer.FIELD_VALUE[0], testDataRepl.oReplLogCustomer.FIELD_VALUE[1], testDataRepl.oReplLogCustomer.FIELD_VALUE[2]],
                "MESSAGE_TEXT": [testDataRepl.oReplLogCustomer.MESSAGE_TEXT[0], testDataRepl.oReplLogCustomer.MESSAGE_TEXT[1], testDataRepl.oReplLogCustomer.MESSAGE_TEXT[2]],
                "MESSAGE_TYPE": [testDataRepl.oReplLogCustomer.MESSAGE_TYPE[0], testDataRepl.oReplLogCustomer.MESSAGE_TYPE[1], testDataRepl.oReplLogCustomer.MESSAGE_TYPE[2]],
                "OPERATION": [testDataRepl.oReplLogCustomer.OPERATION[0], testDataRepl.oReplLogCustomer.OPERATION[1], testDataRepl.oReplLogCustomer.OPERATION[2]]
            }, []);

            oCustomerSourceErpResult = mockstarHelpers.convertResultToArray(oCustomerSourceErpResult);
            expect(oCustomerSourceErpResult).toMatchData({
                "CUSTOMER_ID": ['CUSTOMER3', 'CUSTOMER4', 'CUSTOMER1', 'CUSTOMER2', 'CUSTOMER3', 'CUSTOMER4', 'CUSTOMER5'],
                "CUSTOMER_NAME": ['Customer3 Repl', 'Customer4 Repl', 'First Customer1', 'Second Customer2', 'Third Customer3', 'Customer4 Repl', 'Customer5 Repl'],
                "CITY": ['City1', 'City2', 'Ilfov', 'GermanyReg', 'Adr3', 'Adr4', 'City3'],
                "REGION": ['Reg1', 'Reg2', 'Ber', 'Dre', 'BRE', 'tst', 'Reg3'],
                "STREET_NUMBER_OR_PO_BOX": ['Addr3', 'Adr5', 'Stras2', 'Stras3', 'Adr3', 'Adr4', 'Adr6'],
                "POSTAL_CODE": ['123', '456', '43', '97', '123', '456', '789'],
                "_SOURCE": [2, 2, 2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
            }, ["CUSTOMER_ID"]);
            
            oCustomerSourcePlcResult = mockstarHelpers.convertResultToArray(oCustomerSourcePlcResult);
            expect(oCustomerSourcePlcResult).toMatchData({
                "CUSTOMER_ID": [testDataRepl.oCustomerRepl.CUSTOMER_ID[0], testDataRepl.oCustomerRepl.CUSTOMER_ID[1], testDataRepl.oCustomerRepl.CUSTOMER_ID[2], testDataRepl.oCustomerRepl.CUSTOMER_ID[3], testDataRepl.oCustomerRepl.CUSTOMER_ID[4], testDataRepl.oCustomerRepl.CUSTOMER_ID[7]],
                "CUSTOMER_NAME": [testDataRepl.oCustomerRepl.CUSTOMER_NAME[0], testDataRepl.oCustomerRepl.CUSTOMER_NAME[1], testDataRepl.oCustomerRepl.CUSTOMER_NAME[2], testDataRepl.oCustomerRepl.CUSTOMER_NAME[3], testDataRepl.oCustomerRepl.CUSTOMER_NAME[4], testDataRepl.oCustomerRepl.CUSTOMER_NAME[7]],
                "COUNTRY": [testDataRepl.oCustomerRepl.COUNTRY[0], testDataRepl.oCustomerRepl.COUNTRY[1], testDataRepl.oCustomerRepl.COUNTRY[2], testDataRepl.oCustomerRepl.COUNTRY[3], testDataRepl.oCustomerRepl.COUNTRY[4], testDataRepl.oCustomerRepl.COUNTRY[7]],
                "POSTAL_CODE": [testDataRepl.oCustomerRepl.POSTAL_CODE[0], testDataRepl.oCustomerRepl.POSTAL_CODE[1], testDataRepl.oCustomerRepl.POSTAL_CODE[2], testDataRepl.oCustomerRepl.POSTAL_CODE[3], testDataRepl.oCustomerRepl.POSTAL_CODE[4], testDataRepl.oCustomerRepl.POSTAL_CODE[7]],
                "REGION": [testDataRepl.oCustomerRepl.REGION[0], testDataRepl.oCustomerRepl.REGION[1], testDataRepl.oCustomerRepl.REGION[2], testDataRepl.oCustomerRepl.REGION[3], testDataRepl.oCustomerRepl.REGION[4], testDataRepl.oCustomerRepl.REGION[7]],
                "CITY": [testDataRepl.oCustomerRepl.CITY[0], testDataRepl.oCustomerRepl.CITY[1], testDataRepl.oCustomerRepl.CITY[2], testDataRepl.oCustomerRepl.CITY[3], testDataRepl.oCustomerRepl.CITY[4], testDataRepl.oCustomerRepl.CITY[7]],
                "STREET_NUMBER_OR_PO_BOX": [testDataRepl.oCustomerRepl.STREET_NUMBER_OR_PO_BOX[0], testDataRepl.oCustomerRepl.STREET_NUMBER_OR_PO_BOX[1], testDataRepl.oCustomerRepl.STREET_NUMBER_OR_PO_BOX[2], testDataRepl.oCustomerRepl.STREET_NUMBER_OR_PO_BOX[3], testDataRepl.oCustomerRepl.STREET_NUMBER_OR_PO_BOX[4], testDataRepl.oCustomerRepl.STREET_NUMBER_OR_PO_BOX[7]],
                "_SOURCE": [1,1,1,1,1,1],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, 1]
            }, ["CUSTOMER_ID"]);

        });

        it('should insert/modify/delete material group as expected', function () {

            //arrange
             let sEntity = 't_material_group';
             let sFieldName = 'MATERIAL_GROUP_ID';
             prepareEntity(sEntity);
             mockstarHelpers.checkRowCount(oMockstarPlc, 7, "materialGroup");
             //get data for 2 material groups with source 2 which were migrated before from erp, client 800
             let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{materialGroup}} where material_group_id in ('${testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[5]}','${testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[6]}') and _valid_to is null`);
             
             let procedure = oMockstarPlc.loadProcedure();
             procedure(); 

             //assert
             let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{materialGroup}} where _source = 1`);
             let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{materialGroup}} where _source = 2`);
             let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
             let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
             let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
             let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{materialGroup}} where material_group_id in ('${testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[5]}','${testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[6]}') and _valid_to is null`);
              
             expect(oEntriesSourcePlcResult.columns.MATERIAL_GROUP_ID.rows.length).toEqual(6);
             oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
             expect(oEntriesSourcePlcResult).toMatchData({
                "MATERIAL_GROUP_ID": [testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[0],testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[1],testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[2],testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[3],testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[5],testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[6]],
                "_SOURCE": [1,1,1,1,1,1],
                "DELETED_FROM_SOURCE": [null, null, null, null, 1, 1]
             }, []);

             expect(oEntriesSourceErpResult.columns.MATERIAL_GROUP_ID.rows.length).toEqual(6);
             oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
             expect(oEntriesSourceErpResult).toMatchData({
                "MATERIAL_GROUP_ID": [testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[4],testDataRepl.oT023.MATKL[0],testDataRepl.oT023.MATKL[1],testDataRepl.oT023.MATKL[2],testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[5],testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[6]],
                "_SOURCE": [2,2,2,2,2,2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
             }, ["MATERIAL_GROUP_ID","_SOURCE","DELETED_FROM_SOURCE"]);

             //check source field for material group after procedure runs
             expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
             expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[1]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);
             mockstarHelpers.checkRowCount(oMockstarPlc, 12, "materialGroup");

             oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
             expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the source was changed from 2->1
             expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
             expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //3 entries were added
             expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
             mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
             
             oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
             expect(oReplicationRun.MANUAL[0]).toEqual(1);
             expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
             mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

             oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
             expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[5],testDataRepl.oMaterialGroupRepl.MATERIAL_GROUP_ID[6],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ChangePLCSource, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
            }, []);
             mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");

        });

        it('should insert/modify/delete material group text as expected', function () {

             //arrange
             let sEntity = 't_material_group__text';
             let sFieldName = 'MATERIAL_GROUP_ID';
             prepareEntity(sEntity);
             mockstarHelpers.checkRowCount(oMockstarPlc, 15, "materialGroupText");

             let procedure = oMockstarPlc.loadProcedure();
             procedure();

             //assert
             let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{materialGroupText}} where _source = 1`);
             let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{materialGroupText}} where _source = 2`);
             let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
             let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
             let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

             expect(oEntriesSourcePlcResult.columns.MATERIAL_GROUP_ID.rows.length).toEqual(8);
             oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
             expect(oEntriesSourcePlcResult).toMatchData({
                "MATERIAL_GROUP_ID": [testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[0], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[1],
                                      testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[2], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[3],
                                      testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[7], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[8],
                                      testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[9], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[10] ],
                "LANGUAGE": [testDataRepl.oMaterialGroupTextRepl.LANGUAGE[0], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[1],
                            testDataRepl.oMaterialGroupTextRepl.LANGUAGE[2], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[3],
                            testDataRepl.oMaterialGroupTextRepl.LANGUAGE[7], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[8],
                            testDataRepl.oMaterialGroupTextRepl.LANGUAGE[9], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[10]],
                "MATERIAL_GROUP_DESCRIPTION" : [testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[0], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[1],
                                                testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[2], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[3],
                                                testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[7], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[8],
                                                testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[9], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[10]],
                "_SOURCE": [1,1,1,1,1,1,1,1]
             }, []);

             expect(oEntriesSourceErpResult.columns.MATERIAL_GROUP_ID.rows.length).toEqual(9);
             oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
             expect(oEntriesSourceErpResult._VALID_TO[1]).not.toEqual(null);
             expect(oEntriesSourceErpResult._VALID_TO[2]).not.toEqual(null);
             expect(oEntriesSourceErpResult._VALID_TO[3]).toEqual(null);
             expect(oEntriesSourceErpResult._VALID_TO[4]).toEqual(null);
             expect(oEntriesSourceErpResult).toMatchData({
                "MATERIAL_GROUP_ID": [testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[4],testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[11],
                                      testDataRepl.oT023t.MATKL[8],testDataRepl.oT023t.MATKL[3],testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[14],
                                      testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[5],testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[6],
                                      testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[12],testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_ID[13]],
                "LANGUAGE": [testDataRepl.oMaterialGroupTextRepl.LANGUAGE[4], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[11],
                            testDataRepl.oMaterialGroupTextRepl.LANGUAGE[11], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[4], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[14],
                            testDataRepl.oMaterialGroupTextRepl.LANGUAGE[5], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[6],
                            testDataRepl.oMaterialGroupTextRepl.LANGUAGE[12], testDataRepl.oMaterialGroupTextRepl.LANGUAGE[13]],
                "MATERIAL_GROUP_DESCRIPTION" : [testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[4], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[11],
                                                testDataRepl.oT023t.WGBEZ[8],testDataRepl.oT023t.WGBEZ[3], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[14],
                                                testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[5], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[6],
                                                testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[12], testDataRepl.oMaterialGroupTextRepl.MATERIAL_GROUP_DESCRIPTION[13]],

                "_SOURCE": [2,2,2,2,2,2,2,2,2]
             }, ["MATERIAL_GROUP_ID","LANGUAGE","MATERIAL_GROUP_DESCRIPTION","_SOURCE"]);

             mockstarHelpers.checkRowCount(oMockstarPlc, 17, "materialGroupText");

             oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
             expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(4); //4 entries were deleted;
             expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
             expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
             expect(oStatisticsResult.FULL_COUNT[0]).toEqual(12); //9 entrties were selected using the sample select
             mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

             oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
             expect(oReplicationRun.MANUAL[0]).toEqual(1);
             expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
             mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

             oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
             expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oT023.MATKL[0],testDataRepl.oT023.MATKL[1],testDataRepl.oT023.MATKL[2],testDataRepl.oT023.MATKL[0],testDataRepl.oT023.MATKL[1],testDataRepl.oT023.MATKL[2],testDataRepl.oT023.MATKL[0],testDataRepl.oT023.MATKL[1],testDataRepl.oT023.MATKL[2],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownMatGrp, oMessages.UnknownMatGrp, oMessages.UnknownMatGrp, oMessages.UnknownMatGrp,oMessages.UnknownMatGrp, oMessages.UnknownMatGrp, oMessages.UnknownMatGrp,oMessages.UnknownMatGrp, oMessages.UnknownMatGrp, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd,oOperations.ReplProc]
            }, []);
             mockstarHelpers.checkRowCount(oMockstarPlc, 11, "replication_log");

        });

        it('should insert/modify/delete material type as expected', function () {

            let sEntity = 't_material_type';
            let sFieldName = 'MATERIAL_TYPE_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "materialType");
            //get data for 2 material types with source 2 which were migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{materialType}} where material_type_id in ('${testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[5]}', '${testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[6]}') and _valid_to is null`);
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{materialType}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{materialType}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{materialType}} where material_type_id in ('${testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[5]}', '${testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[6]}') and _valid_to is null`);
     
            expect(oEntriesSourcePlcResult.columns.MATERIAL_TYPE_ID.rows.length).toEqual(6);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
               "MATERIAL_TYPE_ID": [testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[0],testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[1],testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[2],testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[3],testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[5],testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[6]],
               "_SOURCE": [1,1,1,1,1,1],
               "DELETED_FROM_SOURCE": [null, null, null, null, 1, 1]
            }, []);

            expect(oEntriesSourceErpResult.columns.MATERIAL_TYPE_ID.rows.length).toEqual(6);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
               "MATERIAL_TYPE_ID": [testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[4],testDataRepl.oT134.MTART[0],testDataRepl.oT134.MTART[1],testDataRepl.oT134.MTART[2],testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[5],testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[6]],
               "_SOURCE": [2,2,2,2,2,2],
               "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
            }, ["MATERIAL_TYPE_ID", "_SOURCE", "DELETED_FROM_SOURCE"]);

            //check source field for material type after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[1]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "materialType");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //3 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,sEntity,""],
               "FIELD_NAME": ["",sFieldName,sFieldName,""],
               "FIELD_VALUE": ["",testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[5],testDataRepl.oMaterialTypeRepl.MATERIAL_TYPE_ID[6],""],
               "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ChangePLCSource, oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");

        });

        it('should insert/modify/delete material type text as expected', function () {
            //arrange
            let sEntity = 't_material_type__text';
            let sFieldName = 'MATERIAL_TYPE_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 15, "materialTypeText");
            
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{materialTypeText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{materialTypeText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
                        
            expect(oEntriesSourcePlcResult.columns.MATERIAL_TYPE_ID.rows.length).toEqual(8);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
            "MATERIAL_TYPE_ID": [testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[0], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[1],
                                    testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[2], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[3],
                                    testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[7], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[8],
                                    testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[9], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[10] ],
            "LANGUAGE": [testDataRepl.oMaterialTypeTextRepl.LANGUAGE[0], testDataRepl.oMaterialTypeTextRepl.LANGUAGE[1],
                        testDataRepl.oMaterialTypeTextRepl.LANGUAGE[2], testDataRepl.oMaterialTypeTextRepl.LANGUAGE[3],
                        testDataRepl.oMaterialTypeTextRepl.LANGUAGE[7], testDataRepl.oMaterialTypeTextRepl.LANGUAGE[8],
                        testDataRepl.oMaterialTypeTextRepl.LANGUAGE[9], testDataRepl.oMaterialTypeTextRepl.LANGUAGE[10]],
            "MATERIAL_TYPE_DESCRIPTION" : [testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[0], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[1],
                                            testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[2], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[3],
                                            testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[7], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[8],
                                            testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[9], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[10]],
            "_SOURCE": [1,1,1,1,1,1,1,1]
            }, []);

            expect(oEntriesSourceErpResult.columns.MATERIAL_TYPE_ID.rows.length).toEqual(9);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[1]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[4]).toEqual(null);
            expect(oEntriesSourceErpResult).toMatchData({
            "MATERIAL_TYPE_ID": [testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[4],testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[11],
                                    testDataRepl.oT134t.MTART[8],testDataRepl.oT134t.MTART[3],testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[14],
                                    testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[5],testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[6],
                                    testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[12],testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_ID[13]],
            "LANGUAGE": [testDataRepl.oMaterialTypeTextRepl.LANGUAGE[4], testDataRepl.oMaterialTypeTextRepl.LANGUAGE[11],
                        testDataRepl.oMaterialTypeTextRepl.LANGUAGE[11], testDataRepl.oMaterialTypeTextRepl.LANGUAGE[4],testDataRepl.oMaterialTypeTextRepl.LANGUAGE[14],
                        testDataRepl.oMaterialTypeTextRepl.LANGUAGE[5], testDataRepl.oMaterialTypeTextRepl.LANGUAGE[6],
                        testDataRepl.oMaterialTypeTextRepl.LANGUAGE[12], testDataRepl.oMaterialTypeTextRepl.LANGUAGE[13]],
            "MATERIAL_TYPE_DESCRIPTION" : [testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[4], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[11],
                                            testDataRepl.oT134t.MTBEZ[8],testDataRepl.oT134t.MTBEZ[3],testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[14],
                                            testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[5], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[6],
                                            testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[12], testDataRepl.oMaterialTypeTextRepl.MATERIAL_TYPE_DESCRIPTION[13]],
                        
            "_SOURCE": [2,2,2,2,2,2,2,2,2]
            }, ["MATERIAL_TYPE_ID","LANGUAGE","MATERIAL_TYPE_DESCRIPTION","_SOURCE"]);
            
            mockstarHelpers.checkRowCount(oMockstarPlc, 17, "materialTypeText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(4); //4 entries were deleted; 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(12); //8 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");
        
            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oT134.MTART[0],testDataRepl.oT134.MTART[1],testDataRepl.oT134.MTART[2],testDataRepl.oT134.MTART[0],testDataRepl.oT134.MTART[1],testDataRepl.oT134.MTART[2],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownMatTyp, oMessages.UnknownMatTyp, oMessages.UnknownMatTyp, oMessages.UnknownMatTyp,oMessages.UnknownMatTyp, oMessages.UnknownMatTyp, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd,oOperations.ReplProc]
            }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 11, "replication_log");
        });

        it('should insert/modify/delete material as expected', function () {

            let sEntity = 't_material';
            let sFieldName = 'MATERIAL_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "material");
            //get data for 2 material types with source 2 which were migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{material}} where material_id in ('${testDataRepl.oMaterialRepl.MATERIAL_ID[5]}', '${testDataRepl.oMaterialRepl.MATERIAL_ID[6]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{material}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{material}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{material}} where material_id in ('${testDataRepl.oMaterialRepl.MATERIAL_ID[5]}', '${testDataRepl.oMaterialRepl.MATERIAL_ID[6]}') and _valid_to is null`);
     
            expect(oEntriesSourcePlcResult.columns.MATERIAL_ID.rows.length).toEqual(6);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
               "MATERIAL_ID": [testDataRepl.oMaterialRepl.MATERIAL_ID[0],testDataRepl.oMaterialRepl.MATERIAL_ID[1],
                               testDataRepl.oMaterialRepl.MATERIAL_ID[2],testDataRepl.oMaterialRepl.MATERIAL_ID[3],
                               testDataRepl.oMaterialRepl.MATERIAL_ID[5],testDataRepl.oMaterialRepl.MATERIAL_ID[6]],
                "BASE_UOM_ID": [testDataRepl.oMaterialRepl.BASE_UOM_ID[0],testDataRepl.oMaterialRepl.BASE_UOM_ID[1],
                                testDataRepl.oMaterialRepl.BASE_UOM_ID[2],testDataRepl.oMaterialRepl.BASE_UOM_ID[3],
                                testDataRepl.oMaterialRepl.BASE_UOM_ID[5],testDataRepl.oMaterialRepl.BASE_UOM_ID[6]],
                "MATERIAL_GROUP_ID": [testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[0],testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[1],
                                      testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[2],testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[3],
                                      testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[5],testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[6]],
                "MATERIAL_TYPE_ID": [testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[0],testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[1],
                                    testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[2],testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[3],
                                    testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[5],testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[6]],
                "IS_CREATED_VIA_CAD_INTEGRATION": [testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[0],testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[1],
                                                   testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[2],testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[3],
                                                   testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[5],testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[6]],
                "IS_PHANTOM_MATERIAL": [testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[0],testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[1],
                                        testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[2],testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[3],
                                        testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[5],testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[6]],
                "IS_CONFIGURABLE_MATERIAL": [testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[0],testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[1],
                                             testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[2],testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[3],
                                             testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[5],testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[6]],                
               "_SOURCE": [1,1,1,1,1,1],
               "DELETED_FROM_SOURCE": [null, null, null, null, 1, 1]
            }, []);

            expect(oEntriesSourceErpResult.columns.MATERIAL_ID.rows.length).toEqual(5);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
               "MATERIAL_ID": [testDataRepl.oMaterialRepl.MATERIAL_ID[4],testDataRepl.oMara.MATNR[1],testDataRepl.oMara.MATNR[3],
                               testDataRepl.oMaterialRepl.MATERIAL_ID[5],testDataRepl.oMaterialRepl.MATERIAL_ID[6]],
                "BASE_UOM_ID":[testDataRepl.oMaterialRepl.BASE_UOM_ID[4],testDataRepl.oMara.MEINS[1],testDataRepl.oMara.MEINS[3],
                               testDataRepl.oMaterialRepl.BASE_UOM_ID[5],testDataRepl.oMaterialRepl.BASE_UOM_ID[6]],
                "MATERIAL_GROUP_ID":[testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[4],testDataRepl.oMara.MATKL[1],testDataRepl.oMara.MATKL[3],
                                     testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[5],testDataRepl.oMaterialRepl.MATERIAL_GROUP_ID[6]],
                "MATERIAL_TYPE_ID":[testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[4],testDataRepl.oMara.MTART[1],testDataRepl.oMara.MTART[3],
                                    testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[5],testDataRepl.oMaterialRepl.MATERIAL_TYPE_ID[6]],
                "IS_CREATED_VIA_CAD_INTEGRATION":[testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[4],0,1,
                                                  testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[5],testDataRepl.oMaterialRepl.IS_CREATED_VIA_CAD_INTEGRATION[6]],
                "IS_PHANTOM_MATERIAL":[testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[4],0,0,
                                       testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[5],testDataRepl.oMaterialRepl.IS_PHANTOM_MATERIAL[6]],
                "IS_CONFIGURABLE_MATERIAL":[testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[4],0,0,
                                            testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[5],testDataRepl.oMaterialRepl.IS_CONFIGURABLE_MATERIAL[6]],
               "_SOURCE": [2,2,2,2,2],
               "DELETED_FROM_SOURCE": [null, null, null, null, null]
            }, ["MATERIAL_ID","BASE_UOM_ID","MATERIAL_GROUP_ID","MATERIAL_TYPE_ID","IS_CREATED_VIA_CAD_INTEGRATION","IS_PHANTOM_MATERIAL","IS_CONFIGURABLE_MATERIAL"]);

            //check source field for material type after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[1]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 11, "material");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(3); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,""],
               "FIELD_NAME": ["","MATERIAL_GROUP_ID","MATERIAL_TYPE_ID",sFieldName,sFieldName,""],
               "FIELD_VALUE": ["",testDataRepl.oMara.MATKL[0],testDataRepl.oMara.MTART[0],testDataRepl.oMaterialRepl.MATERIAL_ID[5],testDataRepl.oMaterialRepl.MATERIAL_ID[6],""],
               "MESSAGE_TEXT": [
                   oMessages.ReplStarted, 
                   oMessages.UnknownMatGrp.concat(" for Material ID ").concat(testDataRepl.oMara.MATNR[0]), 
                   oMessages.UnknownMatTyp.concat(" for Material ID ").concat(testDataRepl.oMara.MATNR[0]),
                   oMessages.ChangePLCSource, 
                   oMessages.ChangePLCSource, 
                   oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "replication_log");
        });

        it('should insert/modify/delete material text as expected', function () {
            //arrange
            let sEntity = 't_material__text';
            let sFieldName = 'MATERIAL_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 15, "materialText");
            
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 
  
            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{materialText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{materialText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
                        
            expect(oEntriesSourcePlcResult.columns.MATERIAL_ID.rows.length).toEqual(8);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
            "MATERIAL_ID": [testDataRepl.oMaterialTextRepl.MATERIAL_ID[0], testDataRepl.oMaterialTextRepl.MATERIAL_ID[1],
                                    testDataRepl.oMaterialTextRepl.MATERIAL_ID[2], testDataRepl.oMaterialTextRepl.MATERIAL_ID[3],
                                    testDataRepl.oMaterialTextRepl.MATERIAL_ID[7], testDataRepl.oMaterialTextRepl.MATERIAL_ID[8],
                                    testDataRepl.oMaterialTextRepl.MATERIAL_ID[9], testDataRepl.oMaterialTextRepl.MATERIAL_ID[10] ],
            "LANGUAGE": [testDataRepl.oMaterialTextRepl.LANGUAGE[0], testDataRepl.oMaterialTextRepl.LANGUAGE[1],
                        testDataRepl.oMaterialTextRepl.LANGUAGE[2], testDataRepl.oMaterialTextRepl.LANGUAGE[3],
                        testDataRepl.oMaterialTextRepl.LANGUAGE[7], testDataRepl.oMaterialTextRepl.LANGUAGE[8],
                        testDataRepl.oMaterialTextRepl.LANGUAGE[9], testDataRepl.oMaterialTextRepl.LANGUAGE[10]],
            "MATERIAL_DESCRIPTION" : [testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[0], testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[1],
                                            testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[2], testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[3],
                                            testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[7], testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[8],
                                            testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[9], testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[10]],
            "_SOURCE": [1,1,1,1,1,1,1,1]
            }, []);

            expect(oEntriesSourceErpResult.columns.MATERIAL_ID.rows.length).toEqual(9);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[1]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[4]).toEqual(null);
            expect(oEntriesSourceErpResult).toMatchData({
            "MATERIAL_ID": [testDataRepl.oMaterialTextRepl.MATERIAL_ID[4],testDataRepl.oMaterialTextRepl.MATERIAL_ID[11],
                                    testDataRepl.oMakt.MATNR[8],testDataRepl.oMakt.MATNR[3],testDataRepl.oMaterialTextRepl.MATERIAL_ID[14],
                                    testDataRepl.oMaterialTextRepl.MATERIAL_ID[5],testDataRepl.oMaterialTextRepl.MATERIAL_ID[6],
                                    testDataRepl.oMaterialTextRepl.MATERIAL_ID[12],testDataRepl.oMaterialTextRepl.MATERIAL_ID[13]],
            "LANGUAGE": [testDataRepl.oMaterialTextRepl.LANGUAGE[4], testDataRepl.oMaterialTextRepl.LANGUAGE[11],
                        testDataRepl.oMaterialTextRepl.LANGUAGE[11], testDataRepl.oMaterialTextRepl.LANGUAGE[4],testDataRepl.oMaterialTextRepl.LANGUAGE[14],
                        testDataRepl.oMaterialTextRepl.LANGUAGE[5], testDataRepl.oMaterialTextRepl.LANGUAGE[6],
                        testDataRepl.oMaterialTextRepl.LANGUAGE[12], testDataRepl.oMaterialTextRepl.LANGUAGE[13]],
            "MATERIAL_DESCRIPTION" : [testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[4], testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[11],
                                            testDataRepl.oMakt.MAKTX[8],testDataRepl.oMakt.MAKTX[3], testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[14],
                                            testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[5], testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[6],
                                            testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[12], testDataRepl.oMaterialTextRepl.MATERIAL_DESCRIPTION[13]],
                        
            "_SOURCE": [2,2,2,2,2,2,2,2,2]
            }, ["MATERIAL_ID","LANGUAGE","MATERIAL_DESCRIPTION","_SOURCE"]);
            
            mockstarHelpers.checkRowCount(oMockstarPlc, 17, "materialText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(4); //4 entries were deleted; 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(9); //6 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");
        
            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,sFieldName,sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oMakt.MATNR[0],testDataRepl.oMakt.MATNR[0],testDataRepl.oMakt.MATNR[1],testDataRepl.oMakt.MATNR[1],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownMat, oMessages.UnknownMat, oMessages.UnknownMat, oMessages.UnknownMat, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
            }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "replication_log");
        });

        it('should insert/modify/delete business area as expected', function () {

            let sEntity = 't_business_area';
            let sFieldName = 'BUSINESS_AREA_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "businessArea");
            //get data for 2 business areas with source 2 which were migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{businessArea}} where business_area_id in ('${testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[5]}', '${testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[6]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{businessArea}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{businessArea}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{businessArea}} where business_area_id in ('${testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[5]}', '${testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[6]}') and _valid_to is null`);
     
            expect(oEntriesSourcePlcResult.columns.BUSINESS_AREA_ID.rows.length).toEqual(6);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
               "BUSINESS_AREA_ID": [testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[0],testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[1],testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[2],
                                    testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[3],testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[5],testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[6]],
               "_SOURCE": [1,1,1,1,1,1],
               "DELETED_FROM_SOURCE": [null, null, null, null, 1, 1]
            }, []);

            expect(oEntriesSourceErpResult.columns.BUSINESS_AREA_ID.rows.length).toEqual(6);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
               "BUSINESS_AREA_ID": [testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[4],testDataRepl.oTgsb.GSBER[0],testDataRepl.oTgsb.GSBER[1],
                                    testDataRepl.oTgsb.GSBER[2],testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[5],testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[6]],
               "_SOURCE": [2,2,2,2,2,2],
               "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
            }, []);

            //check source field for business area after the procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[1]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "businessArea");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //3 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,sEntity,""],
               "FIELD_NAME": ["",sFieldName,sFieldName,""],
               "FIELD_VALUE": ["",testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[5],testDataRepl.oBusinessAreaRepl.BUSINESS_AREA_ID[6],""],
               "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ChangePLCSource, oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");

        });

        it('should insert/modify/delete business area text as expected', function () {
            //arrange
            let sEntity = 't_business_area__text';
            let sFieldName = 'BUSINESS_AREA_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 15, "businessAreaText");
            
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{businessAreaText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{businessAreaText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
                        
            expect(oEntriesSourcePlcResult.columns.BUSINESS_AREA_ID.rows.length).toEqual(8);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
            "BUSINESS_AREA_ID": [testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[0], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[1],
                                    testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[2], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[3],
                                    testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[7], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[8],
                                    testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[9], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[10] ],
            "LANGUAGE": [testDataRepl.oBusinessAreaTextRepl.LANGUAGE[0], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[1],
                        testDataRepl.oBusinessAreaTextRepl.LANGUAGE[2], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[3],
                        testDataRepl.oBusinessAreaTextRepl.LANGUAGE[7], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[8],
                        testDataRepl.oBusinessAreaTextRepl.LANGUAGE[9], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[10]],
            "BUSINESS_AREA_DESCRIPTION" : [testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[0], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[1],
                                            testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[2], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[3],
                                            testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[7], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[8],
                                            testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[9], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[10]],
            "_SOURCE": [1,1,1,1,1,1,1,1]
            }, []);

            expect(oEntriesSourceErpResult.columns.BUSINESS_AREA_ID.rows.length).toEqual(9);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[1]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[4]).toEqual(null);
            expect(oEntriesSourceErpResult).toMatchData({
            "BUSINESS_AREA_ID": [testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[4],testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[11],
                                    testDataRepl.oTgsbt.GSBER[8],testDataRepl.oTgsbt.GSBER[3],testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[14],
                                    testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[5],testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[6],
                                    testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[12],testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_ID[13]],
            "LANGUAGE": [testDataRepl.oBusinessAreaTextRepl.LANGUAGE[4], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[11],
                        testDataRepl.oBusinessAreaTextRepl.LANGUAGE[11], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[4], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[14],
                        testDataRepl.oBusinessAreaTextRepl.LANGUAGE[5], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[6],
                        testDataRepl.oBusinessAreaTextRepl.LANGUAGE[12], testDataRepl.oBusinessAreaTextRepl.LANGUAGE[13]],
            "BUSINESS_AREA_DESCRIPTION" : [testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[4], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[11],
                                            testDataRepl.oTgsbt.GTEXT[8],testDataRepl.oTgsbt.GTEXT[3],testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[14],
                                            testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[5], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[6],
                                            testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[12], testDataRepl.oBusinessAreaTextRepl.BUSINESS_AREA_DESCRIPTION[13]],
                        
            "_SOURCE": [2,2,2,2,2,2,2,2,2]
            }, ["BUSINESS_AREA_ID","LANGUAGE","BUSINESS_AREA_DESCRIPTION","_SOURCE"]);
            
            mockstarHelpers.checkRowCount(oMockstarPlc, 17, "businessAreaText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(4); //4 entries were deleted; 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(12); //8 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");
        
            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oTgsb.GSBER[0],testDataRepl.oTgsb.GSBER[1],testDataRepl.oTgsb.GSBER[2],testDataRepl.oTgsb.GSBER[0],testDataRepl.oTgsb.GSBER[1],testDataRepl.oTgsb.GSBER[2],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownBA, oMessages.UnknownBA, oMessages.UnknownBA, oMessages.UnknownBA,oMessages.UnknownBA, oMessages.UnknownBA, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd,oOperations.ReplProc]
            }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 11, "replication_log");
        });

        it('should insert/modify/delete valuation class as expected', function () {

            let sEntity = 't_valuation_class';
            let sFieldName = 'VALUATION_CLASS_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 7, "valuationClass");
            //get data for 2 valuation classes with source 2 which were migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{valuationClass}} where valuation_class_id in ('${testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[5]}', '${testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[6]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{valuationClass}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{valuationClass}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{valuationClass}} where valuation_class_id in ('${testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[5]}', '${testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[6]}') and _valid_to is null`);
     
            expect(oEntriesSourcePlcResult.columns.VALUATION_CLASS_ID.rows.length).toEqual(6);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
               "VALUATION_CLASS_ID": [testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[0],testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[1],
                                      testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[2],testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[3],
                                      testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[5],testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[6]],
               "_SOURCE": [1,1,1,1,1,1],
               "DELETED_FROM_SOURCE": [null, null, null, null, 1, 1]
            }, []);

            expect(oEntriesSourceErpResult.columns.VALUATION_CLASS_ID.rows.length).toEqual(6);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
               "VALUATION_CLASS_ID": [testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[4],testDataRepl.oT025.BKLAS[0],
                                      testDataRepl.oT025.BKLAS[1],testDataRepl.oT025.BKLAS[2],testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[5],
                                      testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[6]],
               "_SOURCE": [2,2,2,2,2,2],
               "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
            }, []);

            //check source field for valuation class after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[1]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[1]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "valuationClass");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //2 entries were deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //3 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(4); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,sEntity,""],
               "FIELD_NAME": ["",sFieldName,sFieldName,""],
               "FIELD_VALUE": ["",testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[5],testDataRepl.oValuationClassRepl.VALUATION_CLASS_ID[6],""],
               "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ChangePLCSource, oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplDel, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");

        });

        it('should insert/modify/delete valuation class text as expected', function () {
            //arrange
            let sEntity = 't_valuation_class__text';
            let sFieldName = 'VALUATION_CLASS_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 15, "valuationClassText");
            
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{valuationClassText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{valuationClassText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
                        
            expect(oEntriesSourcePlcResult.columns.VALUATION_CLASS_ID.rows.length).toEqual(8);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
            "VALUATION_CLASS_ID": [testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[0], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[1],
                                    testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[2], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[3],
                                    testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[7], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[8],
                                    testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[9], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[10] ],
            "LANGUAGE": [testDataRepl.oValuationClassTextRepl.LANGUAGE[0], testDataRepl.oValuationClassTextRepl.LANGUAGE[1],
                        testDataRepl.oValuationClassTextRepl.LANGUAGE[2], testDataRepl.oValuationClassTextRepl.LANGUAGE[3],
                        testDataRepl.oValuationClassTextRepl.LANGUAGE[7], testDataRepl.oValuationClassTextRepl.LANGUAGE[8],
                        testDataRepl.oValuationClassTextRepl.LANGUAGE[9], testDataRepl.oValuationClassTextRepl.LANGUAGE[10]],
            "VALUATION_CLASS_DESCRIPTION" : [testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[0], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[1],
                                            testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[2], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[3],
                                            testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[7], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[8],
                                            testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[9], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[10]],
            "_SOURCE": [1,1,1,1,1,1,1,1]
            }, []);

            expect(oEntriesSourceErpResult.columns.VALUATION_CLASS_ID.rows.length).toEqual(9);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[1]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[4]).toEqual(null);
            expect(oEntriesSourceErpResult).toMatchData({
            "VALUATION_CLASS_ID": [testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[4],testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[11],
                                    testDataRepl.oT025t.BKLAS[8],testDataRepl.oT025t.BKLAS[3],testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[14],
                                    testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[5],testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[6],
                                    testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[12],testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_ID[13]],
            "LANGUAGE": [testDataRepl.oValuationClassTextRepl.LANGUAGE[4], testDataRepl.oValuationClassTextRepl.LANGUAGE[11],
                        testDataRepl.oValuationClassTextRepl.LANGUAGE[11], testDataRepl.oValuationClassTextRepl.LANGUAGE[4], testDataRepl.oValuationClassTextRepl.LANGUAGE[14],
                        testDataRepl.oValuationClassTextRepl.LANGUAGE[5], testDataRepl.oValuationClassTextRepl.LANGUAGE[6],
                        testDataRepl.oValuationClassTextRepl.LANGUAGE[12], testDataRepl.oValuationClassTextRepl.LANGUAGE[13]],
            "VALUATION_CLASS_DESCRIPTION" : [testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[4], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[11],
                                            testDataRepl.oT025t.BKBEZ[8],testDataRepl.oT025t.BKBEZ[3],testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[14],
                                            testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[5], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[6],
                                            testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[12], testDataRepl.oValuationClassTextRepl.VALUATION_CLASS_DESCRIPTION[13]],
                        
            "_SOURCE": [2,2,2,2,2,2,2,2,2]
            }, ["VALUATION_CLASS_ID","LANGUAGE","VALUATION_CLASS_DESCRIPTION","_SOURCE"]);
            
            mockstarHelpers.checkRowCount(oMockstarPlc, 17, "valuationClassText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(4); //4 entries were deleted; 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //2 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(12); //8 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,""],
                "FIELD_VALUE": ["",testDataRepl.oT025.BKLAS[0],testDataRepl.oT025.BKLAS[1],testDataRepl.oT025.BKLAS[2],testDataRepl.oT025.BKLAS[0],testDataRepl.oT025.BKLAS[1],testDataRepl.oT025.BKLAS[2],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownVC, oMessages.UnknownVC, oMessages.UnknownVC, oMessages.UnknownVC,oMessages.UnknownVC, oMessages.UnknownVC, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd,oOperations.ReplProc]
            }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 11, "replication_log");
        });

        
        it('should insert/modify/delete unit of measure as expected', function () {
            // arrange
            oMockstarPlc.clearTable('uom');
            oMockstarPlc.insertTableData('uom', testDataRepl.oUomRepl);

            let sEntity = 't_uom';
            let sFieldName = 'UOM_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "uom");

            //get data for 1 uom with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{uom}} where uom_id in ('${testDataRepl.oUomRepl.UOM_ID[3]}') and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{uom}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{uom}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{uom}} where uom_id in ('${testDataRepl.oUomRepl.UOM_ID[3]}') and _valid_to is null`);

            expect(oEntriesSourcePlcResult.columns.UOM_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "UOM_ID": [testDataRepl.oUomRepl.UOM_ID[0], testDataRepl.oUomRepl.UOM_ID[1],
                testDataRepl.oUomRepl.UOM_ID[4], testDataRepl.oUomRepl.UOM_ID[3]],
                "DIMENSION_ID": [testDataRepl.oUomRepl.DIMENSION_ID[0], testDataRepl.oUomRepl.DIMENSION_ID[1],
                testDataRepl.oUomRepl.DIMENSION_ID[4], testDataRepl.oUomRepl.DIMENSION_ID[3]],
                "NUMERATOR": [testDataRepl.oUomRepl.NUMERATOR[0], testDataRepl.oUomRepl.NUMERATOR[1],
                testDataRepl.oUomRepl.NUMERATOR[4], testDataRepl.oUomRepl.NUMERATOR[3]],
                "DENOMINATOR": [testDataRepl.oUomRepl.DENOMINATOR[0], testDataRepl.oUomRepl.DENOMINATOR[1],
                testDataRepl.oUomRepl.DENOMINATOR[4], testDataRepl.oUomRepl.DENOMINATOR[3]],
                "EXPONENT_BASE10": [testDataRepl.oUomRepl.EXPONENT_BASE10[0], testDataRepl.oUomRepl.EXPONENT_BASE10[1],
                testDataRepl.oUomRepl.EXPONENT_BASE10[4], testDataRepl.oUomRepl.EXPONENT_BASE10[3]],
                "SI_CONSTANT": [testDataRepl.oUomRepl.SI_CONSTANT[0], testDataRepl.oUomRepl.SI_CONSTANT[1],
                testDataRepl.oUomRepl.SI_CONSTANT[4], testDataRepl.oUomRepl.SI_CONSTANT[3]],
                "_SOURCE": [1, 1, 1, 1],
                "DELETED_FROM_SOURCE": [null, null, null, 1]
            }, []);

            expect(oEntriesSourceErpResult.columns.UOM_ID.rows.length).toEqual(8);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);

            expect(oEntriesSourceErpResult).toMatchData({
                "UOM_ID": [testDataRepl.oUomRepl.UOM_ID[5] ,testDataRepl.oUomRepl.UOM_ID[2], testDataRepl.oT006.MSEHI[0], testDataRepl.oT006.MSEHI[1], testDataRepl.oT006.MSEHI[2],
                testDataRepl.oT006.MSEHI[3], 'T0', testDataRepl.oUomRepl.UOM_ID[3]],
                "DIMENSION_ID": [testDataRepl.oUomRepl.DIMENSION_ID[5], testDataRepl.oUomRepl.DIMENSION_ID[2], testDataRepl.oT006.DIMID[0], testDataRepl.oT006.DIMID[1], testDataRepl.oT006.DIMID[2],
                testDataRepl.oT006.DIMID[3], testDataRepl.oT006.DIMID[5], testDataRepl.oUomRepl.DIMENSION_ID[3]],
                "NUMERATOR": [testDataRepl.oUomRepl.NUMERATOR[5], testDataRepl.oUomRepl.NUMERATOR[2], testDataRepl.oT006.ZAEHL[0], testDataRepl.oT006.ZAEHL[1], testDataRepl.oT006.ZAEHL[2],
                testDataRepl.oT006.ZAEHL[3], testDataRepl.oT006.ZAEHL[5], testDataRepl.oUomRepl.NUMERATOR[3]],
                "DENOMINATOR": [testDataRepl.oUomRepl.DENOMINATOR[5], testDataRepl.oUomRepl.DENOMINATOR[2], testDataRepl.oT006.NENNR[0], testDataRepl.oT006.NENNR[1], testDataRepl.oT006.NENNR[2],
                testDataRepl.oT006.NENNR[3], testDataRepl.oT006.NENNR[5], testDataRepl.oUomRepl.DENOMINATOR[3]],
                "EXPONENT_BASE10": [testDataRepl.oUomRepl.EXPONENT_BASE10[5], testDataRepl.oUomRepl.EXPONENT_BASE10[2], testDataRepl.oT006.EXP10[0], testDataRepl.oT006.EXP10[1], testDataRepl.oT006.EXP10[2],
                testDataRepl.oT006.EXP10[3], testDataRepl.oT006.EXP10[5], testDataRepl.oUomRepl.EXPONENT_BASE10[3]],
                "SI_CONSTANT": [testDataRepl.oUomRepl.SI_CONSTANT[5], testDataRepl.oUomRepl.SI_CONSTANT[2], testDataRepl.oT006.ADDKO[0], testDataRepl.oT006.ADDKO[1], testDataRepl.oT006.ADDKO[2],
                testDataRepl.oT006.ADDKO[3], testDataRepl.oT006.ADDKO[5], testDataRepl.oUomRepl.SI_CONSTANT[3]],
                "_SOURCE": [2, 2, 2, 2, 2, 2, 2, 2],
                "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null, null]
            },
                ["UOM_ID", "DIMENSION_ID", "NUMERATOR", "DENOMINATOR", "EXPONENT_BASE10", "SI_CONSTANT", "_SOURCE", "DELETED_FROM_SOURCE"]
            );

            //check source field for uom after procedure runs
            expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "uom");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(5); //4 entries were added was 1 was modified
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(6); //6 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, ""],
                "FIELD_NAME": ["", "UOM_ID", ""],
                "FIELD_VALUE": ["", "ML", ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");
        });

        it('should insert/modify/delete unit of measure text as expected', function () {
            //arrange
            oMockstarPlc.clearTable('uom');
            oMockstarPlc.insertTableData('uom', testDataRepl.oUomRepl);

            let sEntity = 't_uom__text';
            let sFieldName = 'UOM_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "uomText");

            let procedure = oMockstarPlc.loadProcedure();
            procedure();

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{uomText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{uomText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);

            expect(oEntriesSourcePlcResult.columns.UOM_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);

            expect(oEntriesSourcePlcResult).toMatchData({
                "UOM_ID": [testDataRepl.oUomTextRepl.UOM_ID[0], testDataRepl.oUomTextRepl.UOM_ID[1], testDataRepl.oUomTextRepl.UOM_ID[4], testDataRepl.oUomTextRepl.UOM_ID[5]],
                "LANGUAGE": [testDataRepl.oUomTextRepl.LANGUAGE[0], testDataRepl.oUomTextRepl.LANGUAGE[1], testDataRepl.oUomTextRepl.LANGUAGE[4], testDataRepl.oUomTextRepl.LANGUAGE[5],],
                "UOM_CODE": [testDataRepl.oUomTextRepl.UOM_CODE[0], testDataRepl.oUomTextRepl.UOM_CODE[1], testDataRepl.oUomTextRepl.UOM_CODE[4], testDataRepl.oUomTextRepl.UOM_CODE[5],],
                "UOM_DESCRIPTION": [testDataRepl.oUomTextRepl.UOM_DESCRIPTION[0], testDataRepl.oUomTextRepl.UOM_DESCRIPTION[1], testDataRepl.oUomTextRepl.UOM_DESCRIPTION[4], testDataRepl.oUomTextRepl.UOM_DESCRIPTION[5],],
                "_SOURCE": [1, 1, 1, 1]
            }, []);

            expect(oEntriesSourceErpResult.columns.UOM_ID.rows.length).toEqual(8);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[1]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[2]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[3]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[4]).toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[5]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[6]).not.toEqual(null);
            expect(oEntriesSourceErpResult._VALID_TO[7]).not.toEqual(null);

            expect(oEntriesSourceErpResult).toMatchData({
                "UOM_ID": [testDataRepl.oUomTextRepl.UOM_ID[8] ,testDataRepl.oUomTextRepl.UOM_ID[2], testDataRepl.oUomTextRepl.UOM_ID[9], testDataRepl.oT006a.MSEHI[5], "CM3", testDataRepl.oUomTextRepl.UOM_ID[6], testDataRepl.oUomTextRepl.UOM_ID[3], testDataRepl.oUomTextRepl.UOM_ID[7]],
                "LANGUAGE": [testDataRepl.oUomTextRepl.LANGUAGE[8], testDataRepl.oUomTextRepl.LANGUAGE[2],testDataRepl.oUomTextRepl.LANGUAGE[9],"EN", "EN", testDataRepl.oUomTextRepl.LANGUAGE[6], testDataRepl.oUomTextRepl.LANGUAGE[3], testDataRepl.oUomTextRepl.LANGUAGE[7]],
                "UOM_CODE": [testDataRepl.oUomTextRepl.UOM_CODE[8], testDataRepl.oUomTextRepl.UOM_CODE[2], testDataRepl.oUomTextRepl.UOM_CODE[9], testDataRepl.oT006a.MSEH3[5], testDataRepl.oT006a.MSEH3[8],testDataRepl.oUomTextRepl.UOM_CODE[6], testDataRepl.oUomTextRepl.UOM_CODE[3], testDataRepl.oUomTextRepl.UOM_CODE[7]],
                "UOM_DESCRIPTION": [testDataRepl.oUomTextRepl.UOM_DESCRIPTION[8], testDataRepl.oUomTextRepl.UOM_DESCRIPTION[2],testDataRepl.oUomTextRepl.UOM_DESCRIPTION[9], testDataRepl.oT006a.MSEHT[5], testDataRepl.oT006a.MSEHT[8], testDataRepl.oUomTextRepl.UOM_DESCRIPTION[6], testDataRepl.oUomTextRepl.UOM_DESCRIPTION[3], testDataRepl.oUomTextRepl.UOM_DESCRIPTION[7]],
                "_SOURCE": [2, 2, 2, 2, 2, 2, 2, 2]
            }, ["UOM_ID", "LANGUAGE", "UOM_CODE", "UOM_DESCRIPTION", "_SOURCE"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "uomText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(3); //3 entries were deleted; 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(2); //1 entry was added and 1 was modified
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(7); //4 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");

            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["", sEntity, sEntity, ""],
                "FIELD_NAME": ["", sFieldName, sFieldName, ""],
                "FIELD_VALUE": ["", testDataRepl.oT006a.MSEHI[0], testDataRepl.oT006a.MSEHI[2], ""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownUoMId, oMessages.UnknownUoMId, oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
            }, ["TABLE_NAME", "FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "replication_log");
        });


        it('should insert/modify/delete plant as expected', function () {

            let sEntity = 't_plant';
            let sFieldName = 'PLANT_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");
            //get data for 1 plant with source 2 which was migrated before from erp, client 800
            let oOldEntriesSourceERP = oMockstarPlc.execQuery(`select * from {{plant}} where plant_id = '${testDataRepl.oPlantRepl.PLANT_ID[4]}' and _valid_to is null`);

            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{plant}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{plant}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{plant}} where plant_id = '${testDataRepl.oPlantRepl.PLANT_ID[4]}' and _valid_to is null`);
            
            expect(oEntriesSourcePlcResult.columns.PLANT_ID.rows.length).toEqual(3);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
               "PLANT_ID": [testDataRepl.oPlantRepl.PLANT_ID[0],testDataRepl.oPlantRepl.PLANT_ID[1],
                               testDataRepl.oPlantRepl.PLANT_ID[4],],
                "COMPANY_CODE_ID": [testDataRepl.oPlantRepl.COMPANY_CODE_ID[0],testDataRepl.oPlantRepl.COMPANY_CODE_ID[1],
                                testDataRepl.oPlantRepl.COMPANY_CODE_ID[4]],
                "COUNTRY": [testDataRepl.oPlantRepl.COUNTRY[0],testDataRepl.oPlantRepl.COUNTRY[1],
                                      testDataRepl.oPlantRepl.COUNTRY[4]],
                "POSTAL_CODE": [testDataRepl.oPlantRepl.POSTAL_CODE[0],testDataRepl.oPlantRepl.POSTAL_CODE[1],
                                    testDataRepl.oPlantRepl.POSTAL_CODE[4]],
                "REGION": [testDataRepl.oPlantRepl.REGION[0],testDataRepl.oPlantRepl.REGION[1],
                                                   testDataRepl.oPlantRepl.REGION[4]],
                "CITY": [testDataRepl.oPlantRepl.CITY[0],testDataRepl.oPlantRepl.CITY[1],
                                        testDataRepl.oPlantRepl.CITY[4]],
                "STREET_NUMBER_OR_PO_BOX": [testDataRepl.oPlantRepl.STREET_NUMBER_OR_PO_BOX[0],testDataRepl.oPlantRepl.STREET_NUMBER_OR_PO_BOX[1],
                                             testDataRepl.oPlantRepl.STREET_NUMBER_OR_PO_BOX[4]],                
               "_SOURCE": [1,1,1],
               "DELETED_FROM_SOURCE": [null, null, 1]
            }, []);

            expect(oEntriesSourceErpResult.columns.PLANT_ID.rows.length).toEqual(7);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
               "PLANT_ID": [testDataRepl.oPlantRepl.PLANT_ID[2],testDataRepl.oPlantRepl.PLANT_ID[3],testDataRepl.oT001w.WERKS[0],testDataRepl.oT001w.WERKS[1],
                               'PL8', testDataRepl.oT001w.WERKS[5], testDataRepl.oPlantRepl.PLANT_ID[4]],
                "COMPANY_CODE_ID":[testDataRepl.oPlantRepl.COMPANY_CODE_ID[2],testDataRepl.oPlantRepl.COMPANY_CODE_ID[3],testDataRepl.oT001k.BUKRS[0],testDataRepl.oT001k.BUKRS[1],
                               testDataRepl.oT001k.BUKRS[2],testDataRepl.oT001k.BUKRS[3],testDataRepl.oPlantRepl.COMPANY_CODE_ID[4]],
                 "COUNTRY":[testDataRepl.oPlantRepl.COUNTRY[2],testDataRepl.oPlantRepl.COUNTRY[3],testDataRepl.oT001w.LAND1[0],testDataRepl.oT001w.LAND1[1],
                                      testDataRepl.oT001w.LAND1[2], testDataRepl.oT001w.LAND1[5],testDataRepl.oPlantRepl.COUNTRY[4]],
                "POSTAL_CODE":[testDataRepl.oPlantRepl.POSTAL_CODE[2],testDataRepl.oPlantRepl.POSTAL_CODE[3],testDataRepl.oT001w.PSTLZ[0],testDataRepl.oT001w.PSTLZ[1],
                                    testDataRepl.oT001w.PSTLZ[2],testDataRepl.oT001w.PSTLZ[5],testDataRepl.oPlantRepl.POSTAL_CODE[4]],
                "REGION":[testDataRepl.oPlantRepl.REGION[2],testDataRepl.oPlantRepl.REGION[3],testDataRepl.oT001w.REGIO[0],testDataRepl.oT001w.REGIO[1],
                                                  testDataRepl.oT001w.REGIO[2],testDataRepl.oT001w.REGIO[5],testDataRepl.oPlantRepl.REGION[4]],
                "CITY":[testDataRepl.oPlantRepl.CITY[2],testDataRepl.oPlantRepl.CITY[3],testDataRepl.oT001w.ORT01[0],testDataRepl.oT001w.ORT01[1],
                                       testDataRepl.oT001w.ORT01[2],testDataRepl.oT001w.ORT01[5],testDataRepl.oPlantRepl.CITY[4]],
                "STREET_NUMBER_OR_PO_BOX":[testDataRepl.oPlantRepl.STREET_NUMBER_OR_PO_BOX[2],testDataRepl.oPlantRepl.STREET_NUMBER_OR_PO_BOX[3],testDataRepl.oT001w.STRAS[0],
                                            testDataRepl.oT001w.STRAS[1],testDataRepl.oT001w.STRAS[2],testDataRepl.oT001w.STRAS[5],
                                            testDataRepl.oPlantRepl.STREET_NUMBER_OR_PO_BOX[4]],
               "_SOURCE": [2,2,2,2,2,2,2],
               "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
            }, ["PLANT_ID","COMPANY_CODE_ID","COUNTRY","POSTAL_CODE", "REGION","CITY","STREET_NUMBER_OR_PO_BOX" ]);

             //check source field for plant after procedure runs
             expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
             mockstarHelpers.checkRowCount(oMockstarPlc, 10, "plant");

             oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
             expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
             expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
             expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(4); //2 entries were added and 2 entries were modified
             expect(oStatisticsResult.FULL_COUNT[0]).toEqual(5); //5 entrties were selected using the sample select
             mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,sEntity,""],
               "FIELD_NAME": ["","COMPANY_CODE_ID", sFieldName,""],
               "FIELD_VALUE": ["","CC8", testDataRepl.oPlantRepl.PLANT_ID[4],""],
               "MESSAGE_TEXT": [
                    oMessages.ReplStarted,
                    oMessages.UnknownCompCode.concat(" for Plant ID PL9"),
                    oMessages.ChangePLCSource, 
                    oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.I, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplDel, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");           
        });

        it('should insert/modify/delete plant text as expected', function () {
            //arrange
            let sEntity = 't_plant__text';
            let sFieldName = 'PLANT_ID';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plantText");
            oMockstarPlc.execSingle(`delete from {{t001w_staging}} where WERKS in ('${testDataRepl.oT001w.WERKS[2]}', '${testDataRepl.oT001w.WERKS[5]}', '${testDataRepl.oT001w.WERKS[3]}')`);
            
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{plantText}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{plantText}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
                        
            expect(oEntriesSourcePlcResult.columns.PLANT_ID.rows.length).toEqual(4);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
            "PLANT_ID": [testDataRepl.oPlantRplText.PLANT_ID[0], testDataRepl.oPlantRplText.PLANT_ID[1],
                                    testDataRepl.oPlantRplText.PLANT_ID[2], testDataRepl.oPlantRplText.PLANT_ID[3] ],
            "LANGUAGE": [testDataRepl.oPlantRplText.LANGUAGE[0], testDataRepl.oPlantRplText.LANGUAGE[1],
                        testDataRepl.oPlantRplText.LANGUAGE[2], testDataRepl.oPlantRplText.LANGUAGE[3]],
            "PLANT_DESCRIPTION" : [testDataRepl.oPlantRplText.PLANT_DESCRIPTION[0], testDataRepl.oPlantRplText.PLANT_DESCRIPTION[1],
                                            testDataRepl.oPlantRplText.PLANT_DESCRIPTION[2], testDataRepl.oPlantRplText.PLANT_DESCRIPTION[3]],
            "_SOURCE": [1,1,1,1]
            }, []);

            expect(oEntriesSourceErpResult.columns.PLANT_ID.rows.length).toEqual(17);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult._VALID_TO[16]).not.toEqual(null);
            expect(oEntriesSourceErpResult).toMatchData({
            "PLANT_ID": [testDataRepl.oT001w.WERKS[0],testDataRepl.oT001w.WERKS[1],
                                    testDataRepl.oT001w.WERKS[0],testDataRepl.oT001w.WERKS[1],
                                    "PL3", "PL4","PL3", "PL4","PL3", "PL4",
                                    testDataRepl.oT001w.WERKS[0],testDataRepl.oT001w.WERKS[1],
                                    testDataRepl.oT001w.WERKS[0],testDataRepl.oT001w.WERKS[1],
                                    testDataRepl.oT001w.WERKS[0],testDataRepl.oT001w.WERKS[1],testDataRepl.oPlantRplText.PLANT_ID[4]],
            "LANGUAGE": [testDataRepl.oPlantRplText.LANGUAGE[0], testDataRepl.oPlantRplText.LANGUAGE[0],
                        testDataRepl.oPlantRplText.LANGUAGE[1], testDataRepl.oPlantRplText.LANGUAGE[1],
                        "FR", "FR", "IT", "IT", "ES", "ES",
                        testDataRepl.oPlantRplText.LANGUAGE[2], testDataRepl.oPlantRplText.LANGUAGE[2],
                        testDataRepl.oPlantRplText.LANGUAGE[3], testDataRepl.oPlantRplText.LANGUAGE[3],
                        'ZH-HANT', 'ZH-HANT',testDataRepl.oPlantRplText.LANGUAGE[4]],
            "PLANT_DESCRIPTION" : [testDataRepl.oT001w.NAME1[0], testDataRepl.oT001w.NAME1[1],
                                            testDataRepl.oT001w.NAME1[0], testDataRepl.oT001w.NAME1[1],
                                            testDataRepl.oT001w.NAME1[0], testDataRepl.oT001w.NAME1[1],
                                            testDataRepl.oT001w.NAME1[0], testDataRepl.oT001w.NAME1[1],
                                            testDataRepl.oT001w.NAME1[0], testDataRepl.oT001w.NAME1[1],
                                            testDataRepl.oT001w.NAME1[0], testDataRepl.oT001w.NAME1[1],
                                            testDataRepl.oT001w.NAME1[0], testDataRepl.oT001w.NAME1[1],
                                            testDataRepl.oT001w.NAME1[0], testDataRepl.oT001w.NAME1[1],testDataRepl.oPlantRplText.PLANT_DESCRIPTION[4]],
             "_SOURCE": [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            }, ["PLANT_ID","LANGUAGE","PLANT_DESCRIPTION","_SOURCE"]);
            
            mockstarHelpers.checkRowCount(oMockstarPlc, 21, "plantText");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; 
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(16); //10 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(24); //20 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
                "TABLE_NAME": ["",sEntity,sEntity,sEntity,sEntity,sEntity,""],
                "FIELD_NAME": ["",sFieldName,sFieldName,sFieldName,sFieldName,sFieldName,""],
                 "FIELD_VALUE": ["",testDataRepl.oT001w.WERKS[6],testDataRepl.oT001w.WERKS[6],testDataRepl.oT001w.WERKS[6],testDataRepl.oT001w.WERKS[6],testDataRepl.oT001w.WERKS[6],""],
                "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.UnknownPlnId, oMessages.UnknownPlnId, oMessages.UnknownPlnId, oMessages.UnknownPlnId, oMessages.UnknownPlnId,oMessages.ReplEnded],
                "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
                "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
            }, ["TABLE_NAME","FIELD_NAME", "FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "replication_log");
        });

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
            let oEntriesChangedToSourcePLC = oMockstarPlc.execQuery(`select * from {{vendor}} where vendor_id = '${testDataRepl.oVendorReplTool.VENDOR_ID[3]}' and _valid_to is null`);
            
            expect(oEntriesSourcePlcResult.columns.VENDOR_ID.rows.length).toEqual(3);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
               "VENDOR_ID": [testDataRepl.oVendorReplTool.VENDOR_ID[0],testDataRepl.oVendorReplTool.VENDOR_ID[1],
                               testDataRepl.oVendorReplTool.VENDOR_ID[3],],
                "VENDOR_NAME": [testDataRepl.oVendorReplTool.VENDOR_NAME[0],testDataRepl.oVendorReplTool.VENDOR_NAME[1],
                                testDataRepl.oVendorReplTool.VENDOR_NAME[3]],
                "COUNTRY": [testDataRepl.oVendorReplTool.COUNTRY[0],testDataRepl.oVendorReplTool.COUNTRY[1],
                                      testDataRepl.oVendorReplTool.COUNTRY[3]],
                "POSTAL_CODE": [testDataRepl.oVendorReplTool.POSTAL_CODE[0],testDataRepl.oVendorReplTool.POSTAL_CODE[1],
                                    testDataRepl.oVendorReplTool.POSTAL_CODE[3]],
                "REGION": [testDataRepl.oVendorReplTool.REGION[0],testDataRepl.oVendorReplTool.REGION[1],
                                                   testDataRepl.oVendorReplTool.REGION[3]],
                "CITY": [testDataRepl.oVendorReplTool.CITY[0],testDataRepl.oVendorReplTool.CITY[1],
                                        testDataRepl.oVendorReplTool.CITY[3]],
                "STREET_NUMBER_OR_PO_BOX": [testDataRepl.oVendorReplTool.STREET_NUMBER_OR_PO_BOX[0],testDataRepl.oVendorReplTool.STREET_NUMBER_OR_PO_BOX[1],
                                             testDataRepl.oVendorReplTool.STREET_NUMBER_OR_PO_BOX[3]],                
               "_SOURCE": [1,1,1],
               "DELETED_FROM_SOURCE": [null, null, 1]
            }, []);

            expect(oEntriesSourceErpResult.columns.VENDOR_ID.rows.length).toEqual(5);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
               "VENDOR_ID": [testDataRepl.oVendorReplTool.VENDOR_ID[2],testDataRepl.oLfa1.LIFNR[0],'V5',testDataRepl.oLfa1.LIFNR[2],
               testDataRepl.oVendorReplTool.VENDOR_ID[3],],
                "VENDOR_NAME":[testDataRepl.oVendorReplTool.VENDOR_NAME[2],'Vendor 3', 'Vendor 5','Vendor 5',
                               testDataRepl.oVendorReplTool.VENDOR_NAME[3]],
                "COUNTRY":[testDataRepl.oVendorReplTool.COUNTRY[2],testDataRepl.oLfa1.LAND1[0],testDataRepl.oLfa1.LAND1[1],testDataRepl.oLfa1.LAND1[2],
                                      testDataRepl.oVendorReplTool.COUNTRY[3]],
                "POSTAL_CODE":[testDataRepl.oVendorReplTool.POSTAL_CODE[2],testDataRepl.oLfa1.PSTL2[0],testDataRepl.oLfa1.PSTL2[1],testDataRepl.oLfa1.PSTL2[2],
                                    testDataRepl.oVendorReplTool.POSTAL_CODE[3]],
                "REGION":[testDataRepl.oVendorReplTool.REGION[2],testDataRepl.oLfa1.REGIO[0],testDataRepl.oLfa1.REGIO[1],testDataRepl.oLfa1.REGIO[2],
                                                  testDataRepl.oVendorReplTool.REGION[3]],
                "CITY":[testDataRepl.oVendorReplTool.CITY[2],testDataRepl.oLfa1.ORT01[0],testDataRepl.oLfa1.ORT01[1],testDataRepl.oLfa1.ORT01[2],
                                       testDataRepl.oVendorReplTool.CITY[3]],
                "STREET_NUMBER_OR_PO_BOX":[testDataRepl.oVendorReplTool.STREET_NUMBER_OR_PO_BOX[2],testDataRepl.oLfa1.STRAS[0],testDataRepl.oLfa1.STRAS[1],
                                            testDataRepl.oLfa1.STRAS[2],testDataRepl.oVendorReplTool.STREET_NUMBER_OR_PO_BOX[3]],
               "_SOURCE": [2,2,2,2,2],
               "DELETED_FROM_SOURCE": [null, null, null, null, null]
            }, ["VENDOR_ID","VENDOR_NAME","COUNTRY","POSTAL_CODE", "REGION","CITY","STREET_NUMBER_OR_PO_BOX","_SOURCE","DELETED_FROM_SOURCE" ]);

             //check source field for vendor after procedure runs
             expect(oEntriesChangedToSourcePLC.columns._SOURCE.rows[0]).not.toEqual(oOldEntriesSourceERP.columns._SOURCE.rows[0]);
             mockstarHelpers.checkRowCount(oMockstarPlc, 8, "vendor");

             oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
             expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(1); //1 entry was deleted; the source was changed from 2->1
             expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
             expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(3); //2 entries were added and one entry was modified
             expect(oStatisticsResult.FULL_COUNT[0]).toEqual(3); //3 entrties were selected using the sample select
             mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,""],
               "FIELD_NAME": ["", sFieldName,""],
               "FIELD_VALUE": ["", testDataRepl.oVendorReplTool.VENDOR_ID[3],""],
               "MESSAGE_TEXT": [oMessages.ReplStarted, oMessages.ChangePLCSource, oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.I, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplDel, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 3, "replication_log");           
        });

        it('should not execute the run when no entities are enabled', function () {
            //prepare
            oMockstarPlc.execSingle("update {{destination_entity}} set repl_status = 'DISABLED'");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            expect(oReplicationLog.columns.MESSAGE_TEXT.rows[0]).toBe(oMessages.NoEntitiesEnabled);
            expect(oStatisticsResult.columns.RUN_ID.rows.length).toBe(0);
            expect(oReplicationRun.columns.RUN_ID.rows.length).toBe(0);
        });

    }).addTags(["All_Unit_Tests"]);
}