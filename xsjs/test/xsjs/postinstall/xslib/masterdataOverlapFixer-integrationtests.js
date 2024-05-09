const _                      = require("lodash");
const testData               = require("../../../testdata/testdata").data;

const MockstarFacade         = require("../../../testtools/mockstar_facade").MockstarFacade;
const MockstarHelpers        = require("../../../testtools/mockstar_helpers");
const TestDataUtility        = require("../../../testtools/testDataUtility").TestDataUtility;
const MasterdataOverlapFixer = $.import("xs.postinstall.xslib", "masterdataOverlapFixer").MasterdataOverlapFixer;

xdescribe("xsjs.postinstall.xslib.masterdataFixer-integrationtests", () => {
    var oMockstar = null;
    var oResponseMock = null;

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                activity_type : "sap.plc.db::basis.t_activity_type",
                material_price         : "sap.plc.db::basis.t_material_price",
                material      : "sap.plc.db::basis.t_material",
                material__text : "sap.plc.db::basis.t_material__text",
                material_plant: "sap.plc.db::basis.t_material_plant"
            }
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();

        oResponseMock = jasmine.createSpyObj("oResponseMock", ["setBody", "status"]);

    });

    afterOnce(() => {
        // the create table stmts for the backup table are not included in the transaction, but performed immediately; 
        // hence, even the test runner rolls back the transaction, the backup  table would remain in the schema; this 
        // code drops the tables
        const oConnection = jasmine.dbConnection;
        Array.from(oConnection.executeQuery(
            `select table_name
            from "SYS"."TABLES"
            where schema_name = CURRENT_SCHEMA and table_name like_regexpr '__backup$'
        `)).forEach(
            oBackupTable =>
            oConnection.executeUpdate(`drop table "${oBackupTable.TABLE_NAME}"`)
        );
    });

    const runValidToAdaptedTestSuite = (oConfig) => {

        const executeFixer = () => {
            const oConnection = jasmine.dbConnection;
            oConnection.commit = () => {};
            new MasterdataOverlapFixer({}, oResponseMock, oConnection).fix();
        }

        const prepareTest = (aOverlappingEntities) => {
            const oBuilder = new TestDataUtility(oConfig.baseData);
            const oTemplate = oBuilder.getObject(0);

            aOverlappingEntities.forEach(oOverlappingEntity => {
                const oEntityToInsert = _.extend({}, oTemplate, oOverlappingEntity)
                oBuilder.addObject(oEntityToInsert);
            });
            oMockstar.insertTableData(oConfig.entityName, oBuilder.build());
        }
        
        const runValidToAdaptedTest = (aOverlappingEntities) => {
            // arrange
            prepareTest(aOverlappingEntities);

            //act
            executeFixer();

            // assert
            const oResult = MockstarHelpers.convertResultToArray(oMockstar.execQuery(`select * from {{${oConfig.entityName}}}`));
            expect(oResult).toMatchData(oConfig.tableDataAfterFix, oConfig.primaryKeys);
        }


        xdescribe(oConfig.entityName, () => {

            it("should correct overlap with 2 entities have _valid_to = null (case 1)", () => {
                // case 1:
                // entity 1: |--------
                // entity 2:   |--------
                runValidToAdaptedTest([{
                    _VALID_FROM: "2017-08-16T13:01:29.300Z",
                    _VALID_TO: null
                }, {
                    _VALID_FROM: "2017-08-16T13:01:29.400Z",
                    _VALID_TO: null
                }]);
            });

            it("should correct overlaps if the later entity has _valid_to = null (case 2)", () => {
                // case 2:
                // entity 1: |------|
                // entity 2:   |--------
                runValidToAdaptedTest([{
                    _VALID_FROM: "2017-08-16T13:01:29.300Z",
                    _VALID_TO: "2017-08-16T13:01:30.000Z"
                }, {
                    _VALID_FROM: "2017-08-16T13:01:29.400Z",
                    _VALID_TO: null
                }]);
            });

            it("should correct overlaps if the earlier entity has _valid_to = null (case 3)", () => {
                // case 3:
                // entity 1: |-----------------
                // entity 2:   |--------|
                runValidToAdaptedTest([{
                    _VALID_FROM: "2017-08-16T13:01:29.300Z",
                    _VALID_TO: null
                }, {
                    _VALID_FROM: "2017-08-16T13:01:29.400Z",
                    _VALID_TO: "2017-08-16T13:01:30.000Z"
                }]);
            });

            it("should correct overlaps if 2 entities have closed _valid_to but the validity of the later entity ends before the earlier (case 4)", () => {
                // case 4:
                // entity 1: |--------------|
                // entity 2:   |--------|
                runValidToAdaptedTest([{
                    _VALID_FROM: "2017-08-16T13:01:29.300Z",
                    _VALID_TO: "2017-08-16T13:01:35.000Z"
                }, {
                    _VALID_FROM: "2017-08-16T13:01:29.400Z",
                    _VALID_TO: "2017-08-16T13:01:32.000Z"
                }]);
            });

            it("should correct overlaps if 2 entities have closed _valid_to but the validity of the later entity ends after the earlier (case 5)", () => {
                // case 5:
                // entity 1: |------|
                // entity 2:   |--------|
                runValidToAdaptedTest([{
                    _VALID_FROM: "2017-08-16T13:01:29.300Z",
                    _VALID_TO: "2017-08-16T13:01:35.000Z"
                }, {
                    _VALID_FROM: "2017-08-16T13:01:29.400Z",
                    _VALID_TO: "2017-08-16T13:01:36.000Z"
                }]);
            });
            
            it("should correct overlaps if 2 entities have have overlapping _valid_from but same _valid_to (case 6)", () => {
                // case 6:
                // entity 1: |------|
                // entity 2:   |----|
                runValidToAdaptedTest([{
                    _VALID_FROM: "2017-08-16T13:01:29.300Z",
                    _VALID_TO: "2017-08-16T13:01:35.000Z"
                }, {
                    _VALID_FROM: "2017-08-16T13:01:29.400Z",
                    _VALID_TO: "2017-08-16T13:01:36.000Z"
                }]);
            });

            Object.keys(oConfig.valuePropertyChanges).forEach(sPropertyToChange => {
                oConfig.valuePropertyChanges[sPropertyToChange].forEach(vValueToCheck => {
                    it(`should not upate _valid_to one entity has set ${sPropertyToChange} = ${vValueToCheck || "null"}`, () => {
                        // arrange
                        const aOverlappingEntities = [{
                            _VALID_FROM: "2017-08-16T13:01:29.300Z",
                            _VALID_TO: null
                        }, {
                            _VALID_FROM: "2017-08-16T13:01:29.400Z",
                            _VALID_TO: null
                        }];
                        aOverlappingEntities[0][sPropertyToChange] = vValueToCheck;
                        prepareTest(aOverlappingEntities);
                        const oResultBefore = MockstarHelpers.convertResultToArray(oMockstar.execQuery(`select * from {{${oConfig.entityName}}}`));
                        
                        // act 
                        executeFixer();
                         
                        // assert
                        expect(oResponseMock.status).toEqual($.net.http.INTERNAL_SERVER_ERROR);
                        const oResultAfter = MockstarHelpers.convertResultToArray(oMockstar.execQuery(`select * from {{${oConfig.entityName}}}`));
                        expect(oResultAfter).toEqual(oResultBefore, oConfig.primaryKeys);
                    });
                })
            });
            
            it("should create backup table with all data if overlaps detected", () => {
                // arrange
                const aOverlappingEntities = [{
                    _VALID_FROM: "2017-08-16T13:01:29.300Z",
                    _VALID_TO: null
                }, {
                    _VALID_FROM: "2017-08-16T13:01:29.400Z",
                    _VALID_TO: null
                }];
                prepareTest(aOverlappingEntities);
                const oBuilder = new TestDataUtility(oConfig.baseData);
                const oTemplate = oBuilder.getObject(0);
                const sWhereCondition = ` where ${oConfig.primaryKeys.map(sPrimary => `${sPrimary} = '${oTemplate[sPrimary]}'`).join(" and ")}`
                const oResultOrigin = MockstarHelpers.convertResultToArray(oMockstar.execQuery(`select * from {{${oConfig.entityName}}} ${sWhereCondition}`));
                
                // act 
                executeFixer();
                 
                // assert
                const oResultBackup = MockstarHelpers.convertResultToArray(oMockstar.execQuery(
                    `select * from "sap.plc.db::basis.t_${oConfig.entityName}${MasterdataOverlapFixer.BACKUP_SUFFIX}" ${sWhereCondition}`));
                expect(oResultBackup).toMatchData(oResultOrigin, oConfig.primaryKeys);
            });
        });
    }


    runValidToAdaptedTestSuite({
        entityName: "activity_type",
        primaryKeys: ["ACTIVITY_TYPE_ID", "CONTROLLING_AREA_ID"],
        baseData: testData.oActivityTypeTestDataPlc,
        valuePropertyChanges: {
            ACCOUNT_ID: [null, "AC1"]
        },
        tableDataAfterFix: {
            "ACTIVITY_TYPE_ID"   : ['A1', 'A2', 'A3', 'A4', 'A1', 'A1'],
            "CONTROLLING_AREA_ID": ['1000', '1000', '1000', '#CA1', '1000', '1000'],
            "ACCOUNT_ID"         : ['CE1', 'CE2', 'CE1', '11000', 'CE1', 'CE1'],
            "_VALID_FROM"        : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z',
                                    '2017-08-16T13:01:29.300Z', '2017-08-16T13:01:29.400Z'],
            "_VALID_TO"          : ['2017-08-16T13:01:29.300Z', null, '2015-04-30T15:39:09.691Z', null, '2017-08-16T13:01:29.400Z', null],
            "_SOURCE"            : [1, 1, 1, 1, 1, 1],
            "_CREATED_BY": ['U000001', 'U000002', 'U000001', 'U000001', 'U000001', 'U000001']
        }
    });
    
    runValidToAdaptedTestSuite({
        entityName: "material_price",
        primaryKeys: ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID", "PROJECT_ID", "VALID_FROM", "VALID_FROM_QUANTITY"],
        // must use a copy of testData.oMaterialPriceTestDataPlc because it's lacking _VALID_TO property
        baseData: {
            "PRICE_SOURCE_ID"              : ["101", "201", "101", "101"],
            "MATERIAL_ID"                  : ["MAT1", "MATEN", "MAT1", "MAT1"],
            "PLANT_ID"                     : ["PL1", "", "", "PL2"],
            "VENDOR_ID"                    : ["*", "*", "*", "*"],
            "PROJECT_ID"                   : ["*", "*", "*", "*"],
            "VALID_FROM"                   : ["2015-06-19", "2010-01-01", "2010-01-01", "2010-01-01"],
            "VALID_TO"                     : ["2015-06-19", "2010-01-01", "2010-01-01", "2010-01-01"],
            "VALID_FROM_QUANTITY"          : [1, 1, 1, 1],
            "VALID_TO_QUANTITY"            : [1, 1, 1, 1],
            "PRICE_FIXED_PORTION"          : [123.45, 123.88, 121.25, 121.25],
            "PRICE_VARIABLE_PORTION"       : [234.56, 234.98, 200.55, 234.99],
            "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
            "PRICE_UNIT"                   : [1, 100, 1, 2],
            "PRICE_UNIT_UOM_ID"            : ["H", "H", "H", "H"],
            "_VALID_FROM"                  : ["2015-06-19T12:27:23.197Z", "2015-06-19T12:27:23.197Z", "2015-06-19T12:27:23.197Z", "2015-06-19T12:27:23.197Z"],
            "_VALID_TO"                    : [null, null, null, null],
            "_SOURCE"                      : [1, 2, 1, 1],
            "PURCHASING_GROUP"             : ["G1","G1","G1","G1"],
            "PURCHASING_DOCUMENT"          : ["D1","D1","D1","D1"],
            "LOCAL_CONTENT"                : ["1","2","3","4"],
            "_CREATED_BY"          : ["I305774", "U000940", "U000930", "U000920"]
        },
        valuePropertyChanges: {
            VALID_TO_QUANTITY            : [100, null],
            PURCHASING_DOCUMENT          : ["DOC1", null],
            PURCHASING_GROUP             : ["G123", null],
            VALID_TO                     : ["2017-01-01", null],
            LOCAL_CONTENT                : ["123", null],
            // non-nullable columns
            PRICE_FIXED_PORTION          : [100],
            PRICE_VARIABLE_PORTION       : [200],
            TRANSACTION_CURRENCY_ID: ["USD"], 
            PRICE_UNIT                   : [133],
            PRICE_UNIT_UOM_ID            : ["PC"]
            
        },
        tableDataAfterFix: {
            "PRICE_SOURCE_ID"              : ["101","201","101","101","101","101"],
            "MATERIAL_ID"                  : ["MAT1","MATEN","MAT1","MAT1","MAT1","MAT1"],
            "PLANT_ID"                     : ["PL1","","","PL2","PL1","PL1"],
            "VENDOR_ID"                    : ["*","*","*","*","*","*"],
            "PROJECT_ID"                   : ["*", "*", "*", "*", "*", "*"],
            "VALID_FROM"                   : ["2015-06-19T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z","2015-06-19T00:00:00.000Z","2015-06-19T00:00:00.000Z"],
            "VALID_FROM_QUANTITY"          : [1,1,1,1,1,1],
            "PRICE_FIXED_PORTION"          : [123.45,123.88,121.25,121.25,123.45,123.45],
            "PRICE_VARIABLE_PORTION"       : [234.56,234.98,200.55,234.99,234.56,234.56],
            "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR","EUR","EUR"],
            "PRICE_UNIT"                   : [1,100,1,2,1,1],
            "PRICE_UNIT_UOM_ID"            : ["H","H","H","H","H","H"],
            "_VALID_FROM"                  : ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z", '2017-08-16T13:01:29.300Z', '2017-08-16T13:01:29.400Z'],
            "_VALID_TO"                    : ["2017-08-16T13:01:29.300Z",null,null,null,'2017-08-16T13:01:29.400', null],
            "_SOURCE"                      : [1,2,1,1,1,1],
            "_CREATED_BY"          : ["I305774","U000940","U000930","U000920","I305774","I305774"]
        }
    });
    
    runValidToAdaptedTestSuite({
        entityName: "material",
        primaryKeys: ["MATERIAL_ID"],
        baseData: {
            "MATERIAL_ID"                   : ['MAT1', 'MAT2', 'MAT3', 'MAT4', 'MAT5', 'MAT6', 'MAT7', "MATEN", "MATE1"],
            "IS_PHANTOM_MATERIAL"           : [1, 0, 1, null, null, null, null, null, null],
            "IS_CONFIGURABLE_MATERIAL"      : [1, 0, 1, null, null, null, null, null, null],
            "MATERIAL_TYPE_ID"              : ["MT1", "MT2", "MT3", null, null, null, null, null, null],
            "MATERIAL_GROUP_ID"             : ["MG1", "MG2", "MG3", null, null, null, null, null, null],
            "_VALID_FROM"                   : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z','2015-01-01T15:39:09.691Z'],
            "_VALID_TO"                     : [null, null,'2015-06-06T15:39:09.691Z', null, null, null, null, null, null],
            "_SOURCE"                       : [1, 1, 1, 1, 1, 1, 1, 2, 2],
            "_CREATED_BY"           : ['U000001', 'U000003', 'U000002', 'U000002', 'U000003', 'U000003', 'U000003', 'U000003', 'U000003'],
            "BASE_UOM_ID"                   : ["ABC", null, null, null, null, null, null, null, null],
            "IS_CREATED_VIA_CAD_INTEGRATION": [1, null, null, null, null, null, null, null, null]
        },
        valuePropertyChanges: {
            BASE_UOM_ID                   : [null, "PC"],
            MATERIAL_GROUP_ID             : [null, "G1"],
            MATERIAL_TYPE_ID              : [null, "RAW"],
            IS_CREATED_VIA_CAD_INTEGRATION: [null, 0],
            IS_PHANTOM_MATERIAL           : [null, 0],
            IS_CONFIGURABLE_MATERIAL      : [null, 0]
        },
        tableDataAfterFix: {
            "MATERIAL_ID"              : ['MAT1', 'MAT2', 'MAT3', 'MAT4', 'MAT5', 'MAT6', 'MAT7', "MATEN", "MATE1", 'MAT1', 'MAT1'],
            "IS_PHANTOM_MATERIAL"      : [1, 0, 1, null, null, null, null, null, null, 1, 1],
            "IS_CONFIGURABLE_MATERIAL" : [1, 0, 1, null, null, null, null, null, null, 1, 1],
            "MATERIAL_TYPE_ID"         : ["MT1", "MT2", "MT3", null, null, null, null, null, null, "MT1", "MT1"],
            "MATERIAL_GROUP_ID"        : ["MG1", "MG2", "MG3", null, null, null, null, null, null, "MG1", "MG1"],
            "_VALID_FROM"              : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z','2015-01-01T15:39:09.691Z', '2017-08-16T13:01:29.300Z', '2017-08-16T13:01:29.400Z'],
            "_VALID_TO"                : ["2017-08-16T13:01:29.300Z", null,'2015-06-06T15:39:09.691Z', null, null, null, null, null, null, '2017-08-16T13:01:29.400', null],
            "_SOURCE"                  : [1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1],
            "_CREATED_BY"      :['U000001', 'U000003', 'U000002', 'U000002', 'U000003', 'U000003', 'U000003', 'U000003', 'U000003', 'U000001', 'U000001']
        }
    });
    
    runValidToAdaptedTestSuite({
        entityName: "material__text",
        primaryKeys: ["MATERIAL_ID", "LANGUAGE"],
        baseData: testData.oMaterialTextTestDataPlc,
        valuePropertyChanges: {
            MATERIAL_DESCRIPTION: [null, "ABSC"]
        },
        tableDataAfterFix: {
            "MATERIAL_ID"         : ['MAT1', 'MAT1', 'MAT2', 'MAT4', 'MAT5', 'MAT6', 'MAT7', 'MAT1', 'MAT1'],
            "LANGUAGE"            : ['EN', 'DE', 'EN', 'EN', 'DE', 'DE', 'DE', 'EN', 'EN'],
            "MATERIAL_DESCRIPTION": ['Material MAT1 EN', 'Material MAT1 DE', 'Material MAT2 EN', 'Material MAT4 EN', 'Material MAT5 DE', 'Material MAT6 DE','Material MAT7 DE', 'Material MAT1 EN', 'Material MAT1 EN'],
            "_VALID_FROM"         : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z','2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', "2017-08-16T13:01:29.300Z", "2017-08-16T13:01:29.400Z"],
            "_VALID_TO"           : ["2017-08-16T13:01:29.300Z", '2015-05-25T15:39:09.691Z', null, null, '2015-05-25T15:39:09.691Z', null, null, "2017-08-16T13:01:29.400Z", null],
            "_SOURCE"             : [1, 1, 1, 1, 1, 1, 1, 1, 1],
            "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000002', 'U000002', 'U000002', 'U000001', 'U000001']
        }

    });
    
    runValidToAdaptedTestSuite({
        entityName: "material_plant",
        primaryKeys: ["MATERIAL_ID", "PLANT_ID"],
        baseData: {
            "MATERIAL_ID"                      : ['MAT1', 'MAT2', 'MAT3', 'MAT4'],
    		"PLANT_ID"                         : ['PL1','PL3', 'PL3', 'PL1'],
    		"OVERHEAD_GROUP_ID"                : ['O1', 'O2', 'O1', null],
    		"VALUATION_CLASS_ID"               : ['V1', 'V2', 'V2', null],
    		"_VALID_FROM"                      : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
            "MATERIAL_LOT_SIZE"        : ["1", null, null, null ],
            "MATERIAL_LOT_SIZE_UOM_ID" : ["ABC", null, null, null ],
    		"_VALID_TO"                        : [null, null,'2015-06-06T15:39:09.691Z', null ],
    		"_SOURCE"                          : [1, 1, 1, 1],
    		"_CREATED_BY"              :['U000001', 'U000001', 'U000002', 'U000002']
        },
        valuePropertyChanges: {
            OVERHEAD_GROUP_ID               : [null, "O2"],
            VALUATION_CLASS_ID              : [null, "V123"],
            MATERIAL_LOT_SIZE       : [null, "123"],
            MATERIAL_LOT_SIZE_UOM_ID: [null, "PC"]
        },
        tableDataAfterFix: {
            "MATERIAL_ID"         : ['MAT1', 'MAT2', 'MAT3', 'MAT4', "MAT1", "MAT1"],
    		"PLANT_ID"            : ['PL1','PL3', 'PL3', 'PL1', "PL1", "PL1"],
    		"OVERHEAD_GROUP_ID"   : ['O1', 'O2', 'O1', null, "O1", "O1"],
    		"VALUATION_CLASS_ID"  : ['V1', 'V2', 'V2', null, "V1", "V1"],
    		"_VALID_FROM"         : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2017-08-16T13:01:29.300Z', '2017-08-16T13:01:29.400Z'],
    		"_VALID_TO"           : ['2017-08-16T13:01:29.300Z', null,'2015-06-06T15:39:09.691Z', null, '2017-08-16T13:01:29.400Z', null ],
    		"_SOURCE"             : [1, 1, 1, 1, 1, 1],
    		"_CREATED_BY" :['U000001', 'U000001', 'U000002', 'U000002', 'U000001', 'U000001']
        }
    });
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);;