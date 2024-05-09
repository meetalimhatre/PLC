const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication.functions:f_build_dynamic_select', function() {

        let oMockstarPlc = null;
        const sMasterdataRegex = "^[\p{L}\d_:#.\/\-\|+`)(](?:[\p{L}\d_:#.\/\-\| +`)(]*[\p{L}\d_:#.\/\-\|+`)(])?$";

        beforeOnce(function() {
            oMockstarPlc = new MockstarFacade({
                substituteTables: {
                    t_field_mapping:{
                        name: "sap.plc.db::map.t_field_mapping",
                        data: {
                            "ID" : [ 1, 2, 3, 4, 5, 6, 7 ],
                            "TABLE_NAME" : [ "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_customer" ],
                            "COLUMN_NAME" : [ "CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX" ],
                            "FIELD_TYPE" : [ '','','','','','','' ],
                            "IS_PK" : [ 1, 0, 0, 0, 0, 0, 0 ],
                            "MAPPED_COLUMN" : [ "KUNNR", "NAME1", "LAND1", "PSTLZ", "REGIO", "ORT01", "STRAS" ],
                            "FIELD_ORDER" : [ 1, 2, 3, 4, 5, 6, 7 ],
                            "IS_MANDATORY" : [ 1, 0, 0, 0, 0, 0, 0 ],
                            "IS_NULLABLE" : [ 0, 1, 1, 1, 1, 1, 1 ],
                            "VALIDATION_REGEX" : [ '','','','','','','' ],
                            "IS_CUSTOM" : [ 0, 0, 0, 0, 0, 0, 0 ],
                            "IS_UPPERCASE" : [ 1, 0, 0, 0, 0, 0, 0 ],
                            "LENGTH" : [ 10, 100, 100, 35, 100, 100, 100 ],
                            "SCALE" : [0, 0, 0, 0, 0, 0, 0],
                            "PRECISION" : [0, 0, 0, 0, 0, 0, 0],
                            "DESCRIPTION" : [ '','','','','','','' ],
                        }
                    },
                    t_destination_entity:{
                        name: "sap.plc.db::map.t_destination_entity",
                        data: {
                            "ID" : [ 1 ],
                            "TABLE_NAME" : [ "t_customer" ],
                            "LABEL" : [ "Customer" ],
                            "DESCRIPTION" : [ '' ],
                            "INPUT_SQL" : [ 'select KUNNR, LAND1, NAME1, ORT01, PSTLZ, REGIO, STRAS from "sap.plc.db::repl.t_kna1"' ],
                            "IS_REPL_MANDATORY" : [ 1 ],
                            "REPL_STATUS" : [ 'ENABLED' ]
                        }
                    },
                    t_regex:{
                        name: "sap.plc.db::basis.t_regex",
                        data:{
                            "VALIDATION_REGEX_ID": ["MASTERDATA"],
                            "VALIDATION_REGEX_VALUE":  [sMasterdataRegex]
                        }
                    }
                }
            });
        });

        beforeEach(function() {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function() {});

        it('ucase function should be added for fields that have is_uppercase = 1 (query without offset)', function() {
            //arrange
            let expectedResult = `select ucase(KUNNR) as CUSTOMER_ID,NAME1 as CUSTOMER_NAME,LAND1 as COUNTRY,PSTLZ as POSTAL_CODE,REGIO as REGION,ORT01 as CITY,STRAS as STREET_NUMBER_OR_PO_BOX, 2 as _SOURCE ` + 
                                 `from (select KUNNR, LAND1, NAME1, ORT01, PSTLZ, REGIO, STRAS from "sap.plc.db::repl.t_kna1")`;
            
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_build_dynamic_select"('t_customer',
            0, NULL).RETSQL AS RETSQL FROM DUMMY;`);
            
            var rest = oMockstarPlc.execQuery(`SELECT * FROM {{t_field_mapping}}`);
            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETSQL.rows[0]).toEqual(expectedResult);
        });

        it('ucase function should be added for fields that have is_uppercase = 1 (query with offset)', function() {
            //arrange
            let expectedResult = `select ucase(KUNNR) as CUSTOMER_ID,NAME1 as CUSTOMER_NAME,LAND1 as COUNTRY,PSTLZ as POSTAL_CODE,REGIO as REGION,ORT01 as CITY,STRAS as STREET_NUMBER_OR_PO_BOX, 2 as _SOURCE ` + 
                                 `from (select KUNNR, LAND1, NAME1, ORT01, PSTLZ, REGIO, STRAS from "sap.plc.db::repl.t_kna1") order by CUSTOMER_ID limit 5 offset 1`;
            
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_build_dynamic_select"('t_customer',
            1, 5).RETSQL AS RETSQL FROM DUMMY;`);
            
            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETSQL.rows[0]).toEqual(expectedResult);
        });

        it('regex check should be added for those fields who does have validation_regex != null (query with offset)', function() {
            
            //arrange
            oMockstarPlc.clearTable('t_field_mapping');
            oMockstarPlc.insertTableData('t_field_mapping',{
                "ID" : [ 1, 2, 3, 4, 5, 6, 7, 8],
                "TABLE_NAME" : [ "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_vendor" ],
                "COLUMN_NAME" : [ "CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX","VENDOR_ID"],
                "FIELD_TYPE" : [ '','','','','','','', '' ],
                "IS_PK" : [ 1, 0, 0, 0, 0, 0, 0, 1 ],
                "MAPPED_COLUMN" : [ "KUNNR", "NAME1", "LAND1", "PSTLZ", "REGIO", "ORT01", "STRAS", "VENDOR_ID"],
                "FIELD_ORDER" : [ 1, 2, 3, 4, 5, 6, 7, 1],
                "IS_MANDATORY" : [ 1, 0, 0, 0, 0, 0, 0 , 1],
                "IS_NULLABLE" : [ 0, 1, 1, 1, 1, 1, 1, 0 ],
                "VALIDATION_REGEX" : [ 'MASTERDATA','','MASTERDATA','','','MASTERDATA','', 'MASTERDATA' ],
                "IS_CUSTOM" : [ 0, 0, 0, 0, 0, 0, 0, 0 ],
                "IS_UPPERCASE" : [ 0, 0, 0, 0, 0, 0, 0, 0 ],
                "LENGTH" : [ 10, 100, 100, 35, 100, 100, 100, 10 ],
                "SCALE" : [0, 0, 0, 0, 0, 0, 0, 0],
                "PRECISION" : [0, 0, 0, 0, 0, 0, 0, 0],
                "DESCRIPTION" : [ '','','','','','','', ''],
            });
            
            let expectedResult = `select KUNNR as CUSTOMER_ID,NAME1 as CUSTOMER_NAME,LAND1 as COUNTRY,PSTLZ as POSTAL_CODE,REGIO as REGION,ORT01 as CITY,STRAS as STREET_NUMBER_OR_PO_BOX, 2 as _SOURCE ` +
                                 `from (select KUNNR, LAND1, NAME1, ORT01, PSTLZ, REGIO, STRAS from "sap.plc.db::repl.t_kna1") ` +
                                 `where KUNNR like_regexpr '${sMasterdataRegex}' flag 'i' and LAND1 like_regexpr '${sMasterdataRegex}' flag 'i' and ORT01 like_regexpr '${sMasterdataRegex}' flag 'i'` +
                                 ` order by CUSTOMER_ID limit 5 offset 1`;
            
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_build_dynamic_select"('t_customer',
            1, 5).RETSQL AS RETSQL FROM DUMMY;`);
            
            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETSQL.rows[0]).toEqual(expectedResult);
        });

        it('regex check should be added for those fields who does have validation_regex != null (query without offset)', function() {
            
            //arrange
            oMockstarPlc.clearTable('t_field_mapping');
            oMockstarPlc.insertTableData('t_field_mapping',{
                "ID" : [ 1, 2, 3, 4, 5, 6, 7, 8],
                "TABLE_NAME" : [ "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_vendor" ],
                "COLUMN_NAME" : [ "CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX","VENDOR_ID"],
                "FIELD_TYPE" : [ '','','','','','','', '' ],
                "IS_PK" : [ 1, 0, 0, 0, 0, 0, 0, 1 ],
                "MAPPED_COLUMN" : [ "KUNNR", "NAME1", "LAND1", "PSTLZ", "REGIO", "ORT01", "STRAS", "VENDOR_ID"],
                "FIELD_ORDER" : [ 1, 2, 3, 4, 5, 6, 7, 1],
                "IS_MANDATORY" : [ 1, 0, 0, 0, 0, 0, 0 , 1],
                "IS_NULLABLE" : [ 0, 1, 1, 1, 1, 1, 1, 0 ],
                "VALIDATION_REGEX" : [ 'MASTERDATA','','MASTERDATA','','','MASTERDATA','', 'MASTERDATA' ],
                "IS_CUSTOM" : [ 0, 0, 0, 0, 0, 0, 0, 0 ],
                "IS_UPPERCASE" : [ 0, 0, 0, 0, 0, 0, 0, 0 ],
                "LENGTH" : [ 10, 100, 100, 35, 100, 100, 100, 10 ],
                "SCALE" : [0, 0, 0, 0, 0, 0, 0, 0],
                "PRECISION" : [0, 0, 0, 0, 0, 0, 0, 0],
                "DESCRIPTION" : [ '','','','','','','', ''],
            });

            let expectedResult = `select KUNNR as CUSTOMER_ID,NAME1 as CUSTOMER_NAME,LAND1 as COUNTRY,PSTLZ as POSTAL_CODE,REGIO as REGION,ORT01 as CITY,STRAS as STREET_NUMBER_OR_PO_BOX, 2 as _SOURCE ` +
                                 `from (select KUNNR, LAND1, NAME1, ORT01, PSTLZ, REGIO, STRAS from "sap.plc.db::repl.t_kna1") ` +
                                 `where KUNNR like_regexpr '${sMasterdataRegex}' flag 'i' and LAND1 like_regexpr '${sMasterdataRegex}' flag 'i' and ORT01 like_regexpr '${sMasterdataRegex}' flag 'i'`;
            
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_build_dynamic_select"('t_customer',
            0, NULL).RETSQL AS RETSQL FROM DUMMY;`);
            
            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETSQL.rows[0]).toEqual(expectedResult);
        });

        it('regex check should not add  checks in where clause if no column has regex associated (query without offset)', function() {
            
            //arrange
            oMockstarPlc.clearTable('t_field_mapping');
            oMockstarPlc.insertTableData('t_field_mapping',{
                "ID" : [ 1, 2, 3, 4, 5, 6, 7, 8],
                "TABLE_NAME" : [ "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_customer", "t_vendor" ],
                "COLUMN_NAME" : [ "CUSTOMER_ID", "CUSTOMER_NAME", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX","VENDOR_ID"],
                "FIELD_TYPE" : [ '','','','','','','', ''],
                "IS_PK" : [ 1, 0, 0, 0, 0, 0, 0, 1],
                "MAPPED_COLUMN" : [ "KUNNR", "NAME1", "LAND1", "PSTLZ", "REGIO", "ORT01", "STRAS", "VENDOR_ID"],
                "FIELD_ORDER" : [ 1, 2, 3, 4, 5, 6, 7, 1],
                "IS_MANDATORY" : [ 1, 0, 0, 0, 0, 0, 0 , 1],
                "IS_NULLABLE" : [ 0, 1, 1, 1, 1, 1, 1, 0 ],
                "VALIDATION_REGEX" : [ '','','','','','','','' ],
                "IS_CUSTOM" : [ 0, 0, 0, 0, 0, 0, 0, 0 ],
                "IS_UPPERCASE" : [ 0, 0, 0, 0, 0, 0, 0, 0 ],
                "LENGTH" : [ 10, 100, 100, 35, 100, 100, 100, 10 ],
                "SCALE" : [0, 0, 0, 0, 0, 0, 0, 0],
                "PRECISION" : [0, 0, 0, 0, 0, 0, 0, 0],
                "DESCRIPTION" : [ '','','','','','','', ''],
            });

            let expectedResult = `select KUNNR as CUSTOMER_ID,NAME1 as CUSTOMER_NAME,LAND1 as COUNTRY,PSTLZ as POSTAL_CODE,REGIO as REGION,ORT01 as CITY,STRAS as STREET_NUMBER_OR_PO_BOX, 2 as _SOURCE ` +
                                 `from (select KUNNR, LAND1, NAME1, ORT01, PSTLZ, REGIO, STRAS from "sap.plc.db::repl.t_kna1")`
            
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_build_dynamic_select"('t_customer',
            0, NULL).RETSQL AS RETSQL FROM DUMMY;`);
            
            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETSQL.rows[0]).toEqual(expectedResult);
        });


    }).addTags(["All_Unit_Tests"]);

}