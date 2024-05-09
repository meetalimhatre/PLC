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
                           UnknownPrcSrcId:"Unknown Price Source ID"
                           };
        const oOperations = {ReplProc:"Replication_Process",ReplDel:"Replication_Delete", ReplUpd:"Replication_Update"};
        
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

        let oMara = {
            "MANDT":['800','800','800','800','100'],
            "MATNR":['FG111','FG126','FG129','FG00','FG100'],
            "MTART":['FERT','FERT','FERT','FERT','FERT'],
            "MATKL":['L004','L004','L004','L004','L004'],
            "MEINS":['ST','ST','XXX','ST','ST'],
            "CADKZ":['','','','',''],
            "KZKFG":['','','','',''],
            "LVORM":['','','','X','']
        };

        let oMarc= {
            "MANDT":['800','800','800','800','800','800','800','100'],
            "MATNR":['FG111','FG111','FG126','FG126','FG129','FG129','FG00','FG100'],
            "WERKS":['1010','1710','1010','1710','1010','1710','1010','1010'],
            "EKGRP":['001','','002','','','','',''],
            "LOSGR":[null,null,null,null,null,null,null,null],
            "LVORM":['','','','','','','X','']
        };
        
        let oMbew = {
            "MANDT":['800','800','800','800','800','800','800','100'],
            "MATNR":['FG111','FG111','FG126','FG126','FG129','FG129','FG00','FG100'],
            "BWKEY":['1010','1710','1010','1710','1010','1710','1010','1010'],
            "BWTAR":['','','','','','','',''],
            "LVORM":['','','','','','','X',''],
            "VERPR":['0.99','5.50','0.99','10.50','0.99','10.00','0.00','0.00'],
            "VPRSV":['S','S','S','S','S','S','S','S'],
            "STPRS":['19.50','20.00','14.50','15.00','12.56','11.56','12.44','10.05'],
            "PEINH":['1','2','1','2','1','2','1','1'],
            "BKLAS":['7920','7920','7920','7920','7920','7920','7920','7920'],
            "LFGJA":['2019','2020','2019','2020','2018','2021','2020','2020'],
            "LFMON":['01','01','03','07','01','10','01','01'],
            "ZPLP1":['10.50','0.99','15.5','0.99','0.99','0.99','0.00','0.00'],
            "ZPLP2":['0.99','5.56','0.99','3.50','0.99','0.99','0.00','0.00'],
            "ZPLP3":['0.99','0.99','0.99','0.99','0.99','0.99','0.00','0.00'],
            "ZPLD1":['20150109','','20151111','','','','',''],//date
            "ZPLD2":['','20151111','','20151212','','','',''],
            "ZPLD3":['','','','','','','',''],
            "KOSGR":['','','','','','','','']
        }

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

        var oPriceSource = {
            "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "ERP_MOVING_PRICE", "ERP_PLANNED_PRICE1", "ERP_STANDARD_PRICE"],
            "PRICE_SOURCE_TYPE_ID": [1, 1, 1, 1],
            "CONFIDENCE_LEVEL_ID": [3, 3, 1, 1],
            "DETERMINATION_SEQUENCE": [3, 4, 3, 3],
            "CREATED_ON": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001'],
            "LAST_MODIFIED_ON": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "LAST_MODIFIED_BY": ['U000001', 'U000001', 'U000001', 'U000001']
        };

        var oMaterial = {
            "MATERIAL_ID": ['#MAT1','#MAT2','#MAT3','#MAT3','FG111','FG126','FG129'],
            "BASE_UOM_ID": ["PC", "PC", "PC", "PC", "PC", "PC", "PC"],
            "MATERIAL_GROUP_ID": ['#MG1', '#MG2', '#MG3', '#MG3', 'L004', 'L004','L004'],
            "MATERIAL_TYPE_ID": ['#MT1', '#MT2', '#MT3', '#MT2', 'FERT', 'FERT', 'FERT'],
            "IS_CREATED_VIA_CAD_INTEGRATION": [1, 1, null, null, null, 1, 1],
            "IS_PHANTOM_MATERIAL": [0, 0, 1, 1, 0, 0, 0],
            "IS_CONFIGURABLE_MATERIAL": [0, 0, 0, 0, 1, 0, 0],
            "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom],
            "_VALID_TO": [null, null, sValidTo, null, null, null,null],
            "_SOURCE": [1, 1, 1, 1, 2, 2, 2],
            "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
        };

        var oMaterialPrice = {
            "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
            "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "ERP_MOVING_PRICE", "ERP_MOVING_PRICE", "ERP_STANDARD_PRICE", "ERP_MOVING_PRICE"],
            "MATERIAL_ID": ['#MAT1', '#MAT1', 'FG111', 'FG111', 'FG129'], 
            "PLANT_ID": ['#PL1', '#PL1', '1710', '1710', '1710'],
            "VENDOR_ID": ["*", "*", "*", "*", "*"],
            "PROJECT_ID": ["*", "*", "*", "*", "*"],
            "CUSTOMER_ID": ["*", "*", "*", "*", "*"],
            "PURCHASING_GROUP": [null, null, null, null, null],
            "PURCHASING_DOCUMENT": [null, null, null, null, null],
            "LOCAL_CONTENT": [null, null, null, null, null],
            "VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2020-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
            "VALID_TO": [null, null, null, null, null],
            "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
            "VALID_TO_QUANTITY": [null, null, null, null, null],
            "PRICE_FIXED_PORTION": ["10.0000000", "20.0000000", "30.0000000", "40.0000000", "50.0000000"],
            "PRICE_VARIABLE_PORTION": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
            "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR"],
            "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
            "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
            "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 0],
            "IS_PREFERRED_VENDOR": [0, 0, 0, 0, 0],
            "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "_VALID_TO": [null, null, null, null, null],
            "_SOURCE": [1, 1, 2, 2, 2],
            "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
            "DELETED_FROM_SOURCE": [null, null, null, null, null]
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
                        plant: {
                            name: "sap.plc.db::basis.t_plant",
                            data: oPlant
                        },
                        vendor: {
                            name: "sap.plc.db::basis.t_vendor", 
                            data: testDataRepl.oVendorReplTool
                        },
                        customer: {
                            name: "sap.plc.db::basis.t_customer",
                            data: testDataRepl.oCustomerRepl
                        },
                        project: {
                            name: "sap.plc.db::basis.t_project"
                        },
                        priceSource: {
                            name: "sap.plc.db::basis.t_price_source",
                            data: oPriceSource
                        },
                        material:{
                            name: "sap.plc.db::basis.t_material",
                            data: oMaterial
                        },
                        materialPrice:{
                            name: "sap.plc.db::basis.t_material_price",
                            data: oMaterialPrice
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

        function changeScaleTo7(sDecimalAsString){
            //set scale 7 and return it as string
            return parseFloat(sDecimalAsString).toFixed(7).toString()
        }

 
        it('should insert/modify/delete material price as expected', function () {

            let sEntity = 't_material_price';
            prepareEntity(sEntity);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "materialPrice");
            
            let procedure = oMockstarPlc.loadProcedure();
            procedure(); 

            //assert
            let oEntriesSourcePlcResult = oMockstarPlc.execQuery(`select * from {{materialPrice}} where _source = 1`);
            let oEntriesSourceErpResult = oMockstarPlc.execQuery(`select * from {{materialPrice}} where _source = 2`);
            let oStatisticsResult = oMockstarPlc.execQuery(`select * from {{statistics}} where run_id= '${sRunId}'`);
            let oReplicationLog = oMockstarPlc.execQuery(`select * from {{replication_log}} where run_id = '${sRunId}'`);
            let oReplicationRun = oMockstarPlc.execQuery(`select * from {{replication_run}} where run_id = '${sRunId}'`);
            
            expect(oEntriesSourcePlcResult.columns.MATERIAL_ID.rows.length).toEqual(2);
            oEntriesSourcePlcResult = mockstarHelpers.convertResultToArray(oEntriesSourcePlcResult);
            expect(oEntriesSourcePlcResult).toMatchData({
                "PRICE_ID": [oMaterialPrice.PRICE_ID[0],oMaterialPrice.PRICE_ID[1]],
                "PRICE_SOURCE_ID": [oMaterialPrice.PRICE_SOURCE_ID[0],oMaterialPrice.PRICE_SOURCE_ID[1]],
                "MATERIAL_ID": [oMaterialPrice.MATERIAL_ID[0],oMaterialPrice.MATERIAL_ID[1]],
                "PLANT_ID": [oMaterialPrice.PLANT_ID[0],oMaterialPrice.PLANT_ID[1]],
                "VENDOR_ID": [oMaterialPrice.VENDOR_ID[0],oMaterialPrice.VENDOR_ID[1]],
                "PROJECT_ID": [oMaterialPrice.PROJECT_ID[0],oMaterialPrice.PROJECT_ID[1]],
                "CUSTOMER_ID": [oMaterialPrice.CUSTOMER_ID[0],oMaterialPrice.CUSTOMER_ID[1]],
                "PURCHASING_GROUP": [oMaterialPrice.PURCHASING_GROUP[0],oMaterialPrice.PURCHASING_GROUP[1]],
                "PURCHASING_DOCUMENT": [oMaterialPrice.PURCHASING_DOCUMENT[0],oMaterialPrice.PURCHASING_DOCUMENT[1]],
                "LOCAL_CONTENT": [oMaterialPrice.LOCAL_CONTENT[0],oMaterialPrice.LOCAL_CONTENT[1]],
                "VALID_FROM": [oMaterialPrice.VALID_FROM[0],oMaterialPrice.VALID_FROM[1]],
                "VALID_TO": [oMaterialPrice.VALID_TO[0],oMaterialPrice.VALID_TO[1]],
                "VALID_FROM_QUANTITY": [oMaterialPrice.VALID_FROM_QUANTITY[0],oMaterialPrice.VALID_FROM_QUANTITY[1]],
                "VALID_TO_QUANTITY": [oMaterialPrice.VALID_TO_QUANTITY[0],oMaterialPrice.VALID_TO_QUANTITY[1]],
                "PRICE_FIXED_PORTION": [oMaterialPrice.PRICE_FIXED_PORTION[0],oMaterialPrice.PRICE_FIXED_PORTION[1]],
                "PRICE_VARIABLE_PORTION": [oMaterialPrice.PRICE_VARIABLE_PORTION[0],oMaterialPrice.PRICE_VARIABLE_PORTION[1]],
                "TRANSACTION_CURRENCY_ID": [oMaterialPrice.TRANSACTION_CURRENCY_ID[0],oMaterialPrice.TRANSACTION_CURRENCY_ID[1]],
                "PRICE_UNIT": [oMaterialPrice.PRICE_UNIT[0],oMaterialPrice.PRICE_UNIT[1]],
                "PRICE_UNIT_UOM_ID": [oMaterialPrice.PRICE_UNIT_UOM_ID[0],oMaterialPrice.PRICE_UNIT_UOM_ID[1]],
                "_SOURCE": [1, 1],
                "DELETED_FROM_SOURCE": [null, null]
            }, []);

            expect(oEntriesSourceErpResult.columns.MATERIAL_ID.rows.length).toEqual(11);
            oEntriesSourceErpResult = mockstarHelpers.convertResultToArray(oEntriesSourceErpResult);
            expect(oEntriesSourceErpResult).toMatchData({
                "PRICE_SOURCE_ID": [oMaterialPrice.PRICE_SOURCE_ID[2],
                                    "ERP_PLANNED_PRICE1",
                                    "ERP_STANDARD_PRICE",
                                    "ERP_PLANNED_PRICE1",
                                    "ERP_STANDARD_PRICE",
                                    "ERP_MOVING_PRICE",
                                    "ERP_STANDARD_PRICE",
                                    "ERP_MOVING_PRICE",
                                    "ERP_STANDARD_PRICE",
                                   oMaterialPrice.PRICE_SOURCE_ID[3],oMaterialPrice.PRICE_SOURCE_ID[4]],
                "MATERIAL_ID": [oMaterialPrice.MATERIAL_ID[2],
                                oMbew.MATNR[0],oMbew.MATNR[0],oMbew.MATNR[2],oMbew.MATNR[2],
                                oMbew.MATNR[1],oMbew.MATNR[1],oMbew.MATNR[3],oMbew.MATNR[3],
                                oMaterialPrice.MATERIAL_ID[3],oMaterialPrice.MATERIAL_ID[4]],
                "PLANT_ID": [oMaterialPrice.PLANT_ID[2],
                             oMbew.BWKEY[0],oMbew.BWKEY[0],oMbew.BWKEY[2],oMbew.BWKEY[2],//bwkey=werks(in our example)
                             oMbew.BWKEY[1],oMbew.BWKEY[1],oMbew.BWKEY[3],oMbew.BWKEY[3],
                             oMaterialPrice.PLANT_ID[3],oMaterialPrice.PLANT_ID[4]],
                "VENDOR_ID": [oMaterialPrice.VENDOR_ID[2],
                             '*','*','*','*','*','*','*','*',
                             oMaterialPrice.VENDOR_ID[3],oMaterialPrice.VENDOR_ID[4]],
                "PROJECT_ID": [oMaterialPrice.PROJECT_ID[2],
                              '*','*','*','*','*','*','*','*',
                               oMaterialPrice.PROJECT_ID[3],oMaterialPrice.PROJECT_ID[4]],
                "CUSTOMER_ID": [oMaterialPrice.CUSTOMER_ID[2],
                               '*','*','*','*','*','*','*','*',
                               oMaterialPrice.CUSTOMER_ID[3],oMaterialPrice.CUSTOMER_ID[4]],
                "PURCHASING_GROUP": [oMaterialPrice.PURCHASING_GROUP[2],
                                    oMarc.EKGRP[0],oMarc.EKGRP[0],oMarc.EKGRP[2],oMarc.EKGRP[2],
                                    oMarc.EKGRP[1],oMarc.EKGRP[1],oMarc.EKGRP[3],oMarc.EKGRP[3],
                                    oMaterialPrice.PURCHASING_GROUP[3],oMaterialPrice.PURCHASING_GROUP[4]],
                "PURCHASING_DOCUMENT": [oMaterialPrice.PURCHASING_DOCUMENT[2],
                                        null,null,null,null,
                                        null,null,null,null,
                                        oMaterialPrice.PURCHASING_DOCUMENT[3],oMaterialPrice.PURCHASING_DOCUMENT[4]],
                "LOCAL_CONTENT": [oMaterialPrice.LOCAL_CONTENT[2],
                                 null,null,null,null,
                                 null,null,null,null,
                                 oMaterialPrice.LOCAL_CONTENT[3],oMaterialPrice.LOCAL_CONTENT[4]],
                "VALID_FROM": [oMaterialPrice.VALID_FROM[2],
                               "2015-01-09T00:00:00.000Z",//oMbew.ZPLD1[0]
                               "2019-01-01T00:00:00.000Z", //oMbew.LFGJA[0]-oMbew.LFMON[0]
                               "2015-11-11T00:00:00.000Z",//oMbew.ZPLD1[2]
                               "2019-03-01T00:00:00.000Z",//oMbew.LFGJA[2]-oMbew.LFMON[2]
                               "2020-01-01T00:00:00.000Z",//oMbew.LFGJA[1]-oMbew.LFMON[1]
                               "2020-01-01T00:00:00.000Z",//oMbew.LFGJA[1]-oMbew.LFMON[1]
                               "2020-07-01T00:00:00.000Z",//oMbew.LFGJA[3]-oMbew.LFMON[3]
                               "2020-07-01T00:00:00.000Z",//oMbew.LFGJA[3]-oMbew.LFMON[3]
                              oMaterialPrice.VALID_FROM[3],oMaterialPrice.VALID_FROM[4]],
                "VALID_TO": [oMaterialPrice.VALID_TO[2],
                            null,null,null,null,
                            null,null,null,null,
                            oMaterialPrice.VALID_TO[3],oMaterialPrice.VALID_TO[4]],
                "VALID_FROM_QUANTITY": [oMaterialPrice.VALID_FROM_QUANTITY[2],
                                       "1.0000000", "1.0000000", "1.0000000", "1.0000000", 
                                       "1.0000000","1.0000000", "1.0000000", "1.0000000",
                                       oMaterialPrice.VALID_FROM_QUANTITY[3],oMaterialPrice.VALID_FROM_QUANTITY[4]],
                "VALID_TO_QUANTITY": [oMaterialPrice.VALID_TO_QUANTITY[2],
                                     null,null,null,null,null,null,null,null,
                                     oMaterialPrice.VALID_TO_QUANTITY[3],oMaterialPrice.VALID_TO_QUANTITY[4]],
                "PRICE_FIXED_PORTION": [oMaterialPrice.PRICE_FIXED_PORTION[2],
                                      "0.0000000", "0.0000000", "0.0000000", "0.0000000", 
                                      "0.0000000","0.0000000", "0.0000000", "0.0000000",
                                       oMaterialPrice.PRICE_FIXED_PORTION[3],oMaterialPrice.PRICE_FIXED_PORTION[4]],
                "PRICE_VARIABLE_PORTION": [oMaterialPrice.PRICE_VARIABLE_PORTION[2],
                                            changeScaleTo7(oMbew.ZPLP1[0]),changeScaleTo7(oMbew.STPRS[0]),
                                            changeScaleTo7(oMbew.ZPLP1[2]),changeScaleTo7(oMbew.STPRS[2]),
                                            changeScaleTo7(oMbew.VERPR[1]),changeScaleTo7(oMbew.STPRS[1]),
                                            changeScaleTo7(oMbew.VERPR[3]),changeScaleTo7(oMbew.STPRS[3]),
                                          oMaterialPrice.PRICE_VARIABLE_PORTION[3],oMaterialPrice.PRICE_VARIABLE_PORTION[4]],
                "TRANSACTION_CURRENCY_ID": [oMaterialPrice.TRANSACTION_CURRENCY_ID[2],
                                            oT001.WAERS[3],oT001.WAERS[3],oT001.WAERS[3],oT001.WAERS[3],
                                            oT001.WAERS[2],oT001.WAERS[2],oT001.WAERS[2],oT001.WAERS[2],
                                           oMaterialPrice.TRANSACTION_CURRENCY_ID[3],oMaterialPrice.TRANSACTION_CURRENCY_ID[4]],
                "PRICE_UNIT": [oMaterialPrice.PRICE_UNIT[2],
                              changeScaleTo7(oMbew.PEINH[0]),changeScaleTo7(oMbew.PEINH[0]),                
                              changeScaleTo7(oMbew.PEINH[2]),changeScaleTo7(oMbew.PEINH[2]),
                              changeScaleTo7(oMbew.PEINH[1]),changeScaleTo7(oMbew.PEINH[1]),
                              changeScaleTo7(oMbew.PEINH[3]),changeScaleTo7(oMbew.PEINH[3]),
                              oMaterialPrice.PRICE_UNIT[3],oMaterialPrice.PRICE_UNIT[4]],
                "PRICE_UNIT_UOM_ID": [oMaterialPrice.PRICE_UNIT_UOM_ID[2],
                                      'PC','PC','PC','PC',//from ST
                                      'PC','PC','PC','PC',//from ST
                                     oMaterialPrice.PRICE_UNIT_UOM_ID[3],oMaterialPrice.PRICE_UNIT_UOM_ID[4]],
                "_SOURCE": [2,2,2,2,2,2,2,2,2,2,2],
                "DELETED_FROM_SOURCE": [null, null, null, null,null,null,null,null,null,null,null]
            },["PRICE_SOURCE_ID","MATERIAL_ID","PLANT_ID","VENDOR_ID","PROJECT_ID","CUSTOMER_ID","VALID_FROM","VALID_FROM_QUANTITY"]);

            mockstarHelpers.checkRowCount(oMockstarPlc, 13, "materialPrice");

            oStatisticsResult = mockstarHelpers.convertResultToArray(oStatisticsResult);
            expect(oStatisticsResult.DELETED_COUNT[0]).toEqual(2); //one entry was deleted; the source was changed from 2->1
            expect(oStatisticsResult.TABLE_NAME[0]).toEqual(sEntity);
            expect(oStatisticsResult.UPDATED_COUNT[0]).toEqual(8); //4 entries were added
            expect(oStatisticsResult.FULL_COUNT[0]).toEqual(10); //5 entrties were selected using the sample select
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "statistics");
            
            oReplicationRun = mockstarHelpers.convertResultToArray(oReplicationRun);
            expect(oReplicationRun.MANUAL[0]).toEqual(1);
            expect(oReplicationRun.STATUS[0]).toEqual(oStatuses.S);
            mockstarHelpers.checkRowCount(oMockstarPlc, 1, "replication_run");

            oReplicationLog = mockstarHelpers.convertResultToArray(oReplicationLog);
            expect(oReplicationLog).toMatchData({
               "TABLE_NAME": ["",sEntity,sEntity,""],
               "FIELD_NAME": ["","PRICE_SOURCE_ID","PRICE_SOURCE_ID",""],
               "FIELD_VALUE": ["",'ERP_PLANNED_PRICE2','ERP_PLANNED_PRICE2',""],
               "MESSAGE_TEXT": [
                   oMessages.ReplStarted, 
                   oMessages.UnknownPrcSrcId.concat(" for Material ID ").concat(oMbew.MATNR[0]),
                   oMessages.UnknownPrcSrcId.concat(" for Material ID ").concat(oMbew.MATNR[2]), 
                   oMessages.ReplEnded],
               "MESSAGE_TYPE": [oMessageTypes.I, oMessageTypes.E, oMessageTypes.E, oMessageTypes.I],
               "OPERATION": [oOperations.ReplProc, oOperations.ReplUpd, oOperations.ReplUpd, oOperations.ReplProc]
           }, ["TABLE_NAME","FIELD_NAME","FIELD_VALUE","MESSAGE_TEXT","MESSAGE_TYPE","OPERATION"]);
            mockstarHelpers.checkRowCount(oMockstarPlc, 4, "replication_log");
        });

    }).addTags(["All_Unit_Tests"]);
}