const _ = require("lodash");
const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
let dbArtefactControllerLibrary = require("../../../../lib/xs/db/generation/hdi-db-artefact-controller");
let DbArtefactController = dbArtefactControllerLibrary.DbArtefactController;

if (jasmine.plcTestRunParameters.mode === 'all') {
    describe('xsjs.db.generation.hdi-db-artefact-controller-tests', function () {

        let oDbArtefactController;
        let oMockstar;
        const sTestTable = 'sap.plc.db::db_artefact_controller_test';
        const sExtensionTable = sTestTable + '_ext';
        const sTempExtensionTable = sTestTable + '_temporary_ext';
        const sStagingExtensionTable = sTestTable + '_ext_staging';
        const sMasterdataTable = 'sap.plc.db::t_masterdata_test';
        let origDbArtefactsMetadata;
        let origBusinessObjectsMetadata;

        /**
         * Check if the given db artifact already exists in the database.
         */
        function doesFileExist(sFileName, sType) {
            let result = jasmine.dbConnection.executeQuery(`select * from ${sType}s where schema_name = current_schema and ${sType}_name=?`, sFileName);
            return result.length > 0;

        }

        /**
         * Check if the table column exist
         */
        function doesTableColumnExist(sTableName, sColumnName) {
            let result = jasmine.dbConnection.executeQuery(`select * from table_columns where schema_name = current_schema and table_name=? and column_name=?`, sTableName, sColumnName);
            return result.length > 0;
        }

        beforeAll(function () {
            origDbArtefactsMetadata = dbArtefactControllerLibrary.mDbArtefactsMetadata;
            origBusinessObjectsMetadata = dbArtefactControllerLibrary.mBusinessObjectsMetadata;

            // replace custom field metadata by faked metadata for testing
            // fake templates are in the same package as this test
            dbArtefactControllerLibrary.mBusinessObjectsMetadata = {
                "Item": {
                    tableName: sTestTable,
                    hasTemporaryTable: true,
                    hasStagingTable: false,
                    dependencies: [
                        "t_item",
                        "tt_item",
                        "p_item",
                        "v_item",
                        "cv_item"
                    ]
                },
                "Material": {
                    tableName: sMasterdataTable,
                    hasTemporaryTable: false,
                    hasStagingTable: false,
                    isMasterdataObject: true,
                    dependencies: [
                        "t_material",
                        "tt_material",
                        "p_material"
                    ]
                }
            };

            dbArtefactControllerLibrary.mDbArtefactsMetadata = {
                "p_item": {
                    type: "SQLScript",
                    name: "sap.plc_test.xs.db.generation::p_item",
                    packageName: "xsjs.db.generation",
                    templateName: "db-artefact-controller-tests-procedure.template",
                    dependencies: [
                        "tt_item",
                        "v_item",
                        "afl"
                    ]
                },
                "t_item": {
                    type: "Table",
                    name: "sap.plc_test.xs.db.generation::t_item",
                    packageName: "xsjs.db.generation",
                    templateName: "db-artefact-controller-tests-table.template",
                    dependencies: []
                },
                "tt_item": {
                    type: "TableType",
                    name: "sap.plc_test.xs.db.generation::tt_item",
                    packageName: "xsjs.db.generation",
                    templateName: "db-artefact-controller-tests-tabletype.template",
                    dependencies: []
                },
                "v_item": {
                    type: "SQLView",
                    name: "sap.plc_test.xs.db.generation::v_item",
                    packageName: "xsjs.db.generation",
                    templateName: "db-artefact-controller-tests-view.template",
                    dependencies: ["tt_item"]
                },
                "cv_item": {
                    type: "hdbcalculationview",
                    name: "sap.plc_test.xs.db.generation::cv_item",
                    packageName: "xsjs.db.generation",
                    templateName: "db-artefact-controller-tests-calculationview.template",
                    dependencies: []
                },
                "p_material": {
                    type: "SQLScript",
                    name: "sap.plc_test.xs.db.generation::p_material",
                    packageName: "xsjs.db.generation",
                    templateName: "db-artefact-controller-masterdata-tests-procedure.template",
                    dependencies: [
                        "tt_material",
                        "afl"
                    ]
                },
                "t_material": {
                    type: "Table",
                    name: "sap.plc_test.xs.db.generation::t_material",
                    packageName: "xsjs.db.generation",
                    templateName: "db-artefact-controller-masterdata-tests-table.template",
                    dependencies: []
                },
                "tt_material": {
                    type: "TableType",
                    name: "sap.plc_test.xs.db.generation::tt_material",
                    packageName: "xsjs.db.generation",
                    templateName: "db-artefact-controller-masterdata-tests-tabletype.template",
                    dependencies: []
                }
            };

            oMockstar = new MockstarFacade( // Initialize Mockstar
                {
                    substituteTables: {
                        metadata: {
                            name: "sap.plc.db::basis.t_metadata",
                            // create 6 different custom fields with different data types, the last entry is about a UOM entry and must be ignored
                            data: {
                                PATH: ["", "", "", "", "", "", "", ""],
                                BUSINESS_OBJECT: ["Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item"],
                                COLUMN_ID: ["CUST_TEST", "CUST_STRING", "CUST_TIMESTAMP", "CUST_DATE", "CUST_BOOL", "CUST_DECIMAL", "CUST_TEST_UNIT","CUST_LINK"],
                                IS_CUSTOM: [1, 1, 1, 1, 1, 1, 1, 1],
                                SEMANTIC_DATA_TYPE: ["Integer", "String", "UTCTimestamp", "LocalDate", "BooleanInt", "Decimal", "Integer", "Link"],
                                SEMANTIC_DATA_TYPE_ATTRIBUTES: [null, "length=5", null, null, null, "precision=24; scale=7", null, "length=100"],
                                UOM_CURRENCY_FLAG: [null, null, null, 0, 0, 0, 1, null],
                                ROLLUP_TYPE_ID: [1, 0, 0, 0, 0, 0, 1, 0],
                                PROPERTY_TYPE: [2, 2, 2, 2, 2, 2, 6, 22],
                                REF_UOM_CURRENCY_PATH: ["", null, null, null, null, null, null, null],
                                REF_UOM_CURRENCY_BUSINESS_OBJECT: ["Item", null, null, null, null, null, null, null],
                                REF_UOM_CURRENCY_COLUMN_ID: ["CUST_TEST_UNIT", null, null, null, null, null, null, null]
                            }
                        },
                        metadataItem: {
                            name: "sap.plc.db::basis.t_metadata_item_attributes",
                            data: {
                                PATH: ["", "", "", "", "", "", "", "", ""],
                                BUSINESS_OBJECT: ["Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item"],
                                COLUMN_ID: ["CUST_TEST", "CUST_TEST", "CUST_TEST", "CUST_TEST", "CUST_TEST_UNIT", "CUST_TEST_UNIT", "CUST_DECIMAL", "CUST_DECIMAL", "CUST_LINK"],
                                ITEM_CATEGORY_ID: [1, 1, 1, 1, 1, 1, 1, 1, 1],
                                SUBITEM_STATE: [1, 1, 0, 0, -1, -1, -1, -1,-1],
                                DEFAULT_VALUE: [10, 10, 10, 10, "M", "M", null, null, "https://www.sap.com"]
                            }
                        },
                        metadataFormula: {
                            name: "sap.plc.db::basis.t_formula",
                            data: {
                                FORMULA_ID: [1],
                                PATH: [""],
                                BUSINESS_OBJECT: ["Item"],
                                COLUMN_ID: ["CUST_DECIMAL"],
                                ITEM_CATEGORY_ID: [1],
                                IS_FORMULA_USED: [1],
                                FORMULA_STRING: ["1+e()"]
                            }
                        },
                        metadata_text: {
                            name: "sap.plc.db::basis.t_metadata__text",
                            data: {
                                PATH: ["", "", "", "", "", "", "", ""],
                                COLUMN_ID: ["CUST_TEST", "CUST_STRING", "CUST_TIMESTAMP", "CUST_DATE", "CUST_BOOL", "CUST_DECIMAL", "CUST_TEST_UNIT", "CUST_LINK"],
                                LANGUAGE: ["EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN"],
                                DISPLAY_NAME: ["Test Name", "String Name", "Timestamp Name", "Date Name", "Bool Name", "Decimal Name", "Integer Name", "Link Name"]
                            }
                        }
                    }
                });

            oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
            oDbArtefactController.prepareUpgrade();

            let aUpsertList = [
                {
                    PATH: 'src/dynamic/db/' + sTestTable.split("::")[1] + '.hdbtable',
                    CONTENT: `column table "${sTestTable}" (item_id integer, calculation_version_id integer, primary key(item_id, calculation_version_id))`
                },
                {
                    PATH: 'src/dynamic/db/' + sMasterdataTable.split("::")[1] + '.hdbtable',
                    CONTENT: `column table "${sMasterdataTable}" (material_id integer, _valid_from integer, primary key(material_id, _valid_from))`
                }];
            oDbArtefactController.hdiUpsertFiles(aUpsertList);
        });

        afterAll(function () {
            dbArtefactControllerLibrary.mDbArtefactsMetadata = origDbArtefactsMetadata;
            dbArtefactControllerLibrary.mBusinessObjectsMetadata = origBusinessObjectsMetadata;
        });

        describe('createContextObject', function () {

            beforeEach(function () {
                oMockstar.clearAllTables();
            });

            it('should correctly initialize Context object for template engine if custom fields exist', function () {
                oMockstar.initializeData();
                // act
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);

                let oContext = oDbArtefactController.createContextObject();
                let oExpectedContext = {
                    Item: {
                        tableName: sTestTable,
                        hasTemporaryTable: true,
                        hasStagingTable: false,
                        isMasterdataObject: undefined,
                        customFields: {
                            "CUST_TEST": {
                                semanticDataType: "Integer",
                                semanticDataTypeAttributes: null,
                                rollupTypeId: 1,
                                dataType: "integer",
                                refUomCurrencyColumnId: 'CUST_TEST_UNIT',
                                propertyType: 6,
                                displayName: "Test Name",
                                isMasterdataField: false,
                                itemCategories: [1],
                                defaultValue: '10',
                                defaultValueUnit: 'M'
                            },
                            "CUST_STRING": {
                                semanticDataType: "String",
                                semanticDataTypeAttributes: "length=5",
                                rollupTypeId: 0,
                                dataType: "nvarchar(5)",
                                refUomCurrencyColumnId: null,
                                propertyType: null,
                                displayName: "String Name",
                                isMasterdataField: false
                            },
                            "CUST_TIMESTAMP": {
                                semanticDataType: "UTCTimestamp",
                                semanticDataTypeAttributes: null,
                                rollupTypeId: 0,
                                dataType: "timestamp",
                                refUomCurrencyColumnId: null,
                                propertyType: null,
                                displayName: "Timestamp Name",
                                isMasterdataField: false
                            },
                            "CUST_DATE": {
                                semanticDataType: "LocalDate",
                                semanticDataTypeAttributes: null,
                                rollupTypeId: 0,
                                dataType: "date",
                                refUomCurrencyColumnId: null,
                                propertyType: null,
                                displayName: "Date Name",
                                isMasterdataField: false
                            },
                            "CUST_BOOL": {
                                semanticDataType: "BooleanInt",
                                semanticDataTypeAttributes: null,
                                rollupTypeId: 0,
                                dataType: "integer",
                                refUomCurrencyColumnId: null,
                                propertyType: null,
                                displayName: "Bool Name",
                                isMasterdataField: false
                            },
                            "CUST_DECIMAL": {
                                semanticDataType: "Decimal",
                                semanticDataTypeAttributes: "precision=24; scale=7",
                                rollupTypeId: 0,
                                dataType: "decimal(28,7)",
                                refUomCurrencyColumnId: null,
                                propertyType: null,
                                displayName: "Decimal Name",
                                isMasterdataField: false,
                                itemCategories: [1],
                                defaultValue: null,
                                defaultValueUnit: null,
                                itemCategoriesFormula: [1]
                            },
                            "CUST_LINK": {
                                semanticDataType: "Link",
                                semanticDataTypeAttributes: "length=100",
                                rollupTypeId: 0,
                                dataType: "nvarchar(100)",
                                refUomCurrencyColumnId: null,
                                propertyType: null,
                                displayName: "Link Name",
                                isMasterdataField: false,
                                itemCategories: [1],
                                defaultValue: "https://www.sap.com",
                                defaultValueUnit: null
                            }
                        },
                        hasRollups: true,
                        hasCalculatedCustomFields: true,
                        hasMasterdataCustomFields: false,
                        primaryKeys: {CALCULATION_VERSION_ID: 'INTEGER', ITEM_ID: 'INTEGER'}
                    },
                    Material: {
                        tableName: sMasterdataTable,
                        hasTemporaryTable: false,
                        hasStagingTable: false,
                        isMasterdataObject: true,
                        primaryKeys: {MATERIAL_ID: 'INTEGER', _VALID_FROM: 'INTEGER'}
                    }
                };

                // assert
                expect(_.isEqual(oContext, oExpectedContext)).toBe(true);
            });

            it('should correctly initialize Context object for template engine if no custom field exist', function () {
                // act
                // use empty t_metadata table
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
                let oContext = oDbArtefactController.createContextObject();

                // assert
                expect(_.isEqual(oContext, {
                    Item: {
                        tableName: sTestTable,
                        hasTemporaryTable: true,
                        hasStagingTable: false,
                        isMasterdataObject: undefined,
                        primaryKeys: {CALCULATION_VERSION_ID: 'INTEGER', ITEM_ID: 'INTEGER'}
                    },
                    Material: {
                        tableName: sMasterdataTable,
                        hasTemporaryTable: false,
                        hasStagingTable: false,
                        isMasterdataObject: true,
                        primaryKeys: {MATERIAL_ID: 'INTEGER', _VALID_FROM: 'INTEGER'}
                    }
                })).toBe(true);
            });

        });

        describe("hdiUpsertFiles", function () {
            beforeAll(function () {
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
                oDbArtefactController.hdiDeleteFiles(['src/dynamic/db/' + sTestTable.split("::")[1] + '.hdbtable']);
            });

            it("should clear the content of extension tables if all custom fields are deleted", function () {

                // arrange
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);

                // act
                let aUpsertList = [{
                    PATH: 'src/dynamic/db/' + sTestTable.split("::")[1] + '.hdbtable',
                    CONTENT: `column table "${sTestTable}" (item_id integer, calculation_version_id integer, primary key(item_id, calculation_version_id))`
                }];
                oDbArtefactController.hdiUpsertFiles(aUpsertList);

                // assert
                let result = doesFileExist(sTestTable, "table");
                expect(result).toBe(true);
                result = doesTableColumnExist(sTestTable, "ITEM_ID");
                expect(result).toBe(true);

                oDbArtefactController.hdiUpsertFiles([{
                    PATH: 'src/dynamic/db/' + sTestTable.split("::")[1] + '.hdbtable',
                    CONTENT: `column table "${sTestTable}" (item_id integer, calculation_version_id integer, new_field integer, primary key(item_id, calculation_version_id))`
                }]);
                result = doesTableColumnExist(sTestTable, "NEW_FIELD");
                expect(result).toBe(true);
            });
        });

        describe("hdiDeleteFiles", function () {
            afterAll(function () {
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
                oDbArtefactController.hdiUpsertFiles([{
                    PATH: 'src/dynamic/db/' + sTestTable.split("::")[1] + '.hdbtable',
                    CONTENT: `column table "${sTestTable}" (item_id integer, calculation_version_id integer, primary key(item_id, calculation_version_id))`
                }]);
            });

            it("should clear the content of extension tables if all custom fields are deleted", function () {
                // arrange
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);

                // act
                let aUpsertList = [{
                    PATH: 'src/dynamic/db/' + sTestTable.split("::")[1] + '.hdbtable',
                    CONTENT: `column table "${sTestTable}" (item_id integer, calculation_version_id integer, primary key(item_id, calculation_version_id))`
                }];
                oDbArtefactController.hdiUpsertFiles(aUpsertList);
                oDbArtefactController.hdiDeleteFiles(['src/dynamic/db/' + sTestTable.split("::")[1] + '.hdbtable']);

                // assert
                let result = doesFileExist(sTestTable, "table");
                expect(result).toBe(false);
                oDbArtefactController.hdiDeleteFiles(['src/dynamic/db/' + sTestTable.split("::")[1] + '.hdbtable']);
                result = doesFileExist(sTestTable, "table");
                expect(result).toBe(false);
            });
        });

        describe("clearExtensionTables", function () {
            function dropExtensionTable() {
                let aDeleteList = ['src/dynamic/db/' + sExtensionTable.split("::")[1] + '.hdbtable', 'src/dynamic/db/' + sTempExtensionTable.split("::")[1] + '.hdbtable', 'src/dynamic/db/' + sStagingExtensionTable.split("::")[1] + '.hdbtable'];
                oDbArtefactController.hdiDeleteFiles(aDeleteList);
            }

            // creates extension tables for an business object and fill them with entries
            function createTablesAndContent() {
                let aUpsertList = [
                    {
                        PATH: 'src/dynamic/db/' + sExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sExtensionTable}" (item_id integer, calculation_version_id integer, primary key(item_id, calculation_version_id))`
                    },
                    {
                        PATH: 'src/dynamic/db/' + sTempExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sTempExtensionTable}" (session_id nvarchar(10), item_id integer, calculation_version_id integer, primary key(session_id, item_id, calculation_version_id))`
                    },
                    {
                        PATH: 'src/dynamic/db/' + sStagingExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sStagingExtensionTable}" (item_id integer, calculation_version_id integer, primary key(item_id, calculation_version_id))`
                    }
                ];
                oDbArtefactController.hdiUpsertFiles(aUpsertList);

                jasmine.dbConnection.executeUpdate('insert into "' + sExtensionTable + '" values(123,456)');
                jasmine.dbConnection.executeUpdate('insert into "' + sTempExtensionTable + '" values(\'I305774\',123,456)');
                jasmine.dbConnection.executeUpdate('insert into "' + sStagingExtensionTable + '" values(123,456)');
            }

            beforeEach(function () {
                oMockstar.clearAllTables();
            });

            afterAll(function () {
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
                oDbArtefactController.hdiDeleteFiles([
                    'src/dynamic/db/' + sExtensionTable.split("::")[1] + '.hdbtable',
                    'src/dynamic/db/' + sTempExtensionTable.split("::")[1] + '.hdbtable',
                    'src/dynamic/db/' + sStagingExtensionTable.split("::")[1] + '.hdbtable',
                ]);
            });

            it("should clear the content of extension tables if all custom fields are deleted", function () {
                // arrange
                // declare a context which doesn't contain any custom field
                let oBusinessObject = {
                    tableName: sTestTable,
                    hasTemporaryTable: true,
                    hasStagingTable: true,
                    isMasterdataObject: true
                };

                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
                oDbArtefactController.prepareUpgrade();

                // act
                dropExtensionTable();
                let result = doesFileExist(sExtensionTable, "table");
                expect(result).toBe(false);

                createTablesAndContent();
                result = jasmine.dbConnection.executeQuery(`select * from "${sExtensionTable}"`);
                expect(result[0]).not.toBeUndefined();

                oDbArtefactController.clearExtensionTables(oBusinessObject, true);

                // assert
                // the extension tables should be empty since the business object doesn't have any custom field
                result = jasmine.dbConnection.executeQuery(`select * from "${sExtensionTable}"`);
                expect(result[0]).toBeUndefined();
                result = jasmine.dbConnection.executeQuery(`select * from "${sTempExtensionTable}"`);
                expect(result[0]).toBeUndefined();
                result = jasmine.dbConnection.executeQuery(`select * from "${sStagingExtensionTable}"`);
                expect(result[0]).toBeUndefined();
            });
        });

        describe('generateAllFiles without delete existed custom fields', function () {
            beforeEach(function () {
                oMockstar.clearAllTables();
            });

            afterAll(function () {
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
                oDbArtefactController.prepareUpgrade();
                oDbArtefactController.hdiDeleteFiles([
                    'src/dynamic/db/' + sExtensionTable.split("::")[1] + '.hdbtable',
                    'src/dynamic/db/' + sTempExtensionTable.split("::")[1] + '.hdbtable',
                    'src/dynamic/db/' + sStagingExtensionTable.split("::")[1] + '.hdbtable',
                ]);
            });

            it('should create all dynamic artefacts(include calculation views) , with custom fields merge from db and mBusinessObjectsMetadata ', function () {
                oMockstar.initializeData();
                // arrange
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);

                oDbArtefactController.prepareUpgrade();
                oDbArtefactController.hdiDeleteFiles([
                    'src/dynamic/db/' + sExtensionTable.split("::")[1] + '.hdbtable',
                    'src/dynamic/db/' + sTempExtensionTable.split("::")[1] + '.hdbtable',
                    'src/dynamic/db/' + sStagingExtensionTable.split("::")[1] + '.hdbtable',
                ]);

                /* add the custom fields--CUST_REMAIN and it should exist in regenerated table */
                let aUpsertFiles = [
                    {
                        PATH: 'src/dynamic/db/' + sExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sExtensionTable}" (item_id integer, calculation_version_id integer, CUST_REMAIN_CALCULATED nvarchar(5), CUST_REMAIN_IS_MANUAL tinyint, CUST_REMAIN_MANUAL nvarchar(5), CUST_REMAIN_UNIT NVARCHAR(3), primary key(item_id, calculation_version_id))`
                    },
                    {
                        PATH: 'src/dynamic/db/' + sTempExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sTempExtensionTable}" (SESSION_ID NVARCHAR(50), item_id integer, calculation_version_id integer, CUST_REMAIN_CALCULATED nvarchar(5), CUST_REMAIN_IS_MANUAL tinyint, CUST_REMAIN_MANUAL nvarchar(5), CUST_REMAIN_UNIT NVARCHAR(3), primary key(item_id, calculation_version_id, SESSION_ID))`
                    },
                    {
                        PATH: 'src/dynamic/db/' + sStagingExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sStagingExtensionTable}" (item_id integer, calculation_version_id integer, CUST_REMAIN_CALCULATED nvarchar(5), CUST_REMAIN_IS_MANUAL tinyint, CUST_REMAIN_MANUAL nvarchar(5), CUST_REMAIN_UNIT NVARCHAR(3), primary key(item_id, calculation_version_id))`
                    }
                ];

                oDbArtefactController.hdiUpsertFiles(aUpsertFiles);
                // act
                oDbArtefactController.generateAllFiles();

                // assert
                let bExist = doesFileExist("sap.plc_test.xs.db.generation::cv_item", "view");
                expect(bExist).toBe(true);
                bExist = doesTableColumnExist(sExtensionTable, "CUST_REMAIN_CALCULATED");
                expect(bExist).toBe(true);
                bExist = doesTableColumnExist(sExtensionTable, "CUST_TEST_MANUAL");
                expect(bExist).toBe(true);
                bExist = doesTableColumnExist(sExtensionTable, "CUST_STRING_MANUAL");
                expect(bExist).toBe(true);
                bExist = doesTableColumnExist(sExtensionTable, "CUST_STRING_CALCULATED");
                expect(bExist).toBe(true);
            });
        });

        describe('generateAllFilesExt deleting the existed custom fields', function () {
            beforeEach(function () {
                oMockstar.clearAllTables();
            });

            it('should create missing extension tables, create custom fields and generate DB artefacts', function () {
                oMockstar.initializeData();
                // arrange
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);
                oDbArtefactController.prepareUpgrade();
                oDbArtefactController.hdiDeleteFiles([
                    'src/dynamic/db/' + sExtensionTable.split("::")[1] + '.hdbtable',
                    'src/dynamic/db/' + sTempExtensionTable.split("::")[1] + '.hdbtable',
                    'src/dynamic/db/' + sStagingExtensionTable.split("::")[1] + '.hdbtable',
                ]);

                /* add the custom fields--CUST_REMAIN and it should not exist in regenerated table */
                let aUpsertFiles = [
                    {
                        PATH: 'src/dynamic/db/' + sExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sExtensionTable}" (item_id integer, calculation_version_id integer, CUST_REMAIN_CALCULATED nvarchar(5), CUST_REMAIN_IS_MANUAL tinyint, CUST_REMAIN_MANUAL nvarchar(5), CUST_REMAIN_UNIT NVARCHAR(3), primary key(item_id, calculation_version_id))`
                    },
                    {
                        PATH: 'src/dynamic/db/' + sTempExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sTempExtensionTable}" (SESSION_ID NVARCHAR(50), item_id integer, calculation_version_id integer, CUST_REMAIN_CALCULATED nvarchar(5), CUST_REMAIN_IS_MANUAL tinyint, CUST_REMAIN_MANUAL nvarchar(5), CUST_REMAIN_UNIT NVARCHAR(3), primary key(item_id, calculation_version_id, SESSION_ID))`
                    },
                    {
                        PATH: 'src/dynamic/db/' + sStagingExtensionTable.split("::")[1] + '.hdbtable',
                        CONTENT: `column table "${sStagingExtensionTable}" (item_id integer, calculation_version_id integer, CUST_REMAIN_CALCULATED nvarchar(5), CUST_REMAIN_IS_MANUAL tinyint, CUST_REMAIN_MANUAL nvarchar(5), CUST_REMAIN_UNIT NVARCHAR(3), primary key(item_id, calculation_version_id))`
                    }
                ];

                oDbArtefactController.hdiUpsertFiles(aUpsertFiles);
                // act
                oDbArtefactController.generateAllFilesExt();

                // assert
                let bExist = doesFileExist("sap.plc_test.xs.db.generation::cv_item", "view");
                expect(bExist).toBe(true);
                bExist = doesTableColumnExist(sExtensionTable, "CUST_REMAIN_CALCULATED");
                expect(bExist).toBe(false);
                bExist = doesTableColumnExist(sExtensionTable, "CUST_TEST_MANUAL");
                expect(bExist).toBe(true);
                bExist = doesTableColumnExist(sExtensionTable, "CUST_STRING_MANUAL");
                expect(bExist).toBe(true);
            });
        });

        describe('prepareUpgrade', function () {
            beforeEach(function () {
                oMockstar.clearAllTables();
            });

            it('should delete dynamic DB artifacts', function () {
                oMockstar.initializeData();
                // arrange
                oDbArtefactController = new DbArtefactController($, jasmine.dbConnection);

                // act
                oDbArtefactController.generateAllFiles();
                oDbArtefactController.prepareUpgrade();

                // assert
                let bExist = doesFileExist("sap.plc_test.xs.db.generation::cv_item", "view");
                expect(bExist).toBe(false);
                bExist = doesFileExist("sap.plc_test.xs.db.generation::p_item", "procedure");
                expect(bExist).toBe(false);
                bExist = doesFileExist("sap.plc_test.xs.db.generation::v_item", "view");
                expect(bExist).toBe(false);
                bExist = doesFileExist("sap.plc_test.xs.db.generation::p_material", "procedure");
                expect(bExist).toBe(false);

            });
        });

    }).addTags(["All_Unit_Tests"]);
}