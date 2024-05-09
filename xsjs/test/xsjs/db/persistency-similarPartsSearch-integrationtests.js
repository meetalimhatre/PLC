
const _ = require("lodash");
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const testData = require("../../testdata/testdata").data;
const PersistencyImport = $.import("xs.db", "persistency");
const Persistency = PersistencyImport.Persistency;
const InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const SimilarPartsSearchImport = require("../../../lib/xs/db/persistency-similarPartsSearch").Tables;
const BusinessObjectTypes = require("../../../lib/xs/db/persistency-similarPartsSearch").SupportedBusinessObjectTypes;

const DbArtefactController = require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;

const MessageLibrary = require("../../../lib/xs/util/message");
const oExpectedErrorUnexpectedException = MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION;

const sUserId = testData.sTestUser;

if (jasmine.plcTestRunParameters.mode === 'all') {
    describe("xsjs.db.persistency-similarpartssearch-integrationtests", function() {

        describe('search', function() {
            let persistency = null;
            let oMockstar = null;
            const SimilarPartsSourceTypes = {
                CalculationVersions: "calculationversions",
                MasterData: "masterdata"
            };

            // Create test table "sap.plc.db::basis.t_test_item" to replace t_item table,
            // Because we will test boolean/decimal/text column on t_item table
            function createTestItemTable() {
                // Use jasmine.suitedbConnection for test suite
                oDbArtefactController = new DbArtefactController($, jasmine.suitedbConnection);
                let aUpsertList = [
                    {
                        PATH: 'src/dynamic/db/item_test.hdbtable',
                        CONTENT: `COLUMN TABLE "sap.plc.db::basis.t_test_item"(
                            "ITEM_ID" INTEGER NOT NULL,
                            "CALCULATION_VERSION_ID" INTEGER NOT NULL,
                            "MATERIAL_ID" NVARCHAR(40),
                            "PRICE_UNIT_UOM_ID" NVARCHAR(3),
                            "PRICE" DECIMAL(28,7),
                            "TRANSACTION_CURRENCY_ID" NVARCHAR(3),
                            "VENDOR_ID" NVARCHAR(10),
                            "PRICE_UNIT" DECIMAL(28, 7),
                            "PRICE_FIXED_PORTION" DECIMAL(28, 7),
                            "PRICE_VARIABLE_PORTION" DECIMAL(28, 7),
                            "ITEM_DESCRIPTION" NVARCHAR(250),
                            "CREATED_ON" LONGDATE NOT NULL,
                            TEST_BOOLEAN BOOLEAN DEFAULT TRUE,
                            TEST_FLOAT DECIMAL,
                            TEST_TEXT TEXT,
                            PRIMARY KEY ("ITEM_ID", "CALCULATION_VERSION_ID"))`
                    }
                ];
                oDbArtefactController.hdiUpsertFiles(aUpsertList);
            }

            /**-----------------------------------------------------------------
             * Prepare Test Data
             *----------------------------------------------------------------*/
            let oItemTestData = _.pick(JSON.parse(JSON.stringify(testData.oItemTestData)),
                        ['ITEM_ID', 'CALCULATION_VERSION_ID', 'MATERIAL_ID', 'PRICE_UNIT_UOM_ID', "PRICE",
                        'TRANSACTION_CURRENCY_ID', 'VENDOR_ID', 'PRICE_UNIT', 'PRICE_FIXED_PORTION',
                        'PRICE_VARIABLE_PORTION', 'ITEM_DESCRIPTION', 'CREATED_ON']);
            _.extend(oItemTestData, {
                "ITEM_DESCRIPTION": ["description 01", "description 02", "description 03", "description 04", "description 05"],
                "MATERIAL_ID": testData.oMaterialTestDataPlc.MATERIAL_ID.slice(0, 5),
                "PRICE_UNIT": [1, 100, 100, 100, 1],
                "TEST_TEXT": ['one', 'one two', 'one two three', 'one two three '.repeat(500), 'one'],
                "VENDOR_ID": ['V1', 'V2', 'V3', 'V1', 'V2']
            });

            beforeOnce(function() {
                createTestItemTable();
                SimilarPartsSearchImport.item = 'sap.plc.db::basis.t_test_item';
                oMockstar = new MockstarFacade({
                    substituteTables: {
                        project: "sap.plc.db::basis.t_project",
                        calculation: "sap.plc.db::basis.t_calculation",
                        calculation_version: "sap.plc.db::basis.t_calculation_version",
                        item: {
                            name: SimilarPartsSearchImport.item,
                            data: oItemTestData
                        },
                        material_price: SimilarPartsSearchImport.material_price,
                        material_price_ext: SimilarPartsSearchImport.material_price_ext,
                        material: SimilarPartsSearchImport.material,
                        material_ext: SimilarPartsSearchImport.material_ext,
                        material__text: SimilarPartsSearchImport.material__text,
                        item_ext: SimilarPartsSearchImport.item_ext,
                        vendor: SimilarPartsSearchImport.vendor,
                        authorization: "sap.plc.db::auth.t_auth_project"
                    }
                });
            });

            afterOnce(() => {
                oDbArtefactController.hdiDeleteFiles(['src/dynamic/db/item_test.hdbtable']);
                SimilarPartsSearchImport.item = 'sap.plc.db::basis.t_item';
            });

            let sProjectSourceId = 'PLC_PROJECT_PRICE';
            let oPriceTestData = JSON.parse(JSON.stringify(testData.oMaterialPriceTestDataPlc));
            _.extend(oPriceTestData, {
                "PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
                "PRICE_SOURCE_ID": [ sProjectSourceId, sProjectSourceId, sProjectSourceId, sProjectSourceId ],
                "PROJECT_ID": testData.oProjectTestData.PROJECT_ID.concat('PR4'),
                "VENDOR_ID": ['V1', 'V2', 'V3', 'V3']
            });
            let oPriceExtTestData = _.cloneDeep(testData.oMaterialPriceExtTestDataPlc);

            // Add PropertyMap (generated from validator) to Attribute
            function mockPropertyMapForAttribute(sDataType, sSourceType, sBusinessObject, bIsCustom) {
                return {
                    "DataType": sDataType,
                    "SourceType": sSourceType,
                    "Metadata": [
                        {
                            "BUSINESS_OBJECT": sBusinessObject,
                            "IS_CUSTOM": bIsCustom
                        }
                    ]
                };
            }

             /**-----------------------------------------------------------------
             * Similar Search Request Attributes
             *----------------------------------------------------------------*/
            // standard attribute | fuzzy search | calculation versions
            let oItemDescriptionAttribute = {
                "Name": "ITEM_DESCRIPTION",
                "Value": "description",
                "Weight": 1,
                "IsFuzzySearch": 1,
                "TableSource": [ SimilarPartsSearchImport.item ],
                "PropertyMap": [ mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 0) ]
            };

            // standard attribute | fuzzy search | master data
            let oMaterialDescriptionAttribute = {
                "Name": "MATERIAL_DESCRIPTION",
                "Value": "Material MAT",
                "Weight": 1,
                "IsFuzzySearch": 1,
                "TableSource": [ SimilarPartsSearchImport.material ],
                "PropertyMap": [ mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.Material, 0) ]
            };

            // common attribute for two data sources
            let oMaterialIdAttribute = {
                "Name": "MATERIAL_ID",
                "Value": "",
                "Weight": 1,
                "IsFuzzySearch": 1,
                "TableSource": [ SimilarPartsSearchImport.item, SimilarPartsSearchImport.material ],
                "PropertyMap": [
                    mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 0),
                    mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.Material, 0)
                ]
            };

            // custom field | string pattern compare | calculation versions
            let oCustFunctionGroupAttribute = {
                "Name": "CUST_STRING_MANUAL",
                "Value": "Test 1",
                "Weight": 1,
                "IsFuzzySearch": 0,
                "PropertyMap": [ mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 1) ],
                "TableSource": [ SimilarPartsSearchImport.item_ext ],
                "Pattern": {
                    "Value": "([a-zA-Z]{4}) ([0-9]{1})",
                    "Groups": [
                        {
                            "Index": 1,
                            "Name": "M_TYPE",
                            "Weight": 1,
                            "Dict": [
                                {
                                    "Key": [ "Test" ],
                                    "Value": "Test"
                                }
                            ]
                        }
                    ]
                }
            };

            // custom filed | fuzzy search | master data
            let oCustFunctionFuzzyAttribute = {
                "Name": "CMAT_STRING_MANUAL",
                "Value": "Test 1",
                "Weight": 1,
                "IsFuzzySearch": 1,
                "TableSource": [ SimilarPartsSearchImport.material_ext ],
                "PropertyMap": [ mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.Material, 1) ]
            };

            // custom field | string pattern compare | master data
            let oCustFunctionGroupMasterAttribute = {
                "Name": "CMAT_STRING_MANUAL",
                "Value": "Test String 1",
                "Weight": 1,
                "IsFuzzySearch": 0,
                "PropertyMap": [ mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.Material, 1) ],
                "TableSource": [ SimilarPartsSearchImport.material_ext ],
                "Pattern": {
                    "Value": "([a-zA-Z]{4}) ([a-zA-Z]{6}) ([0-9]{1})",
                    "Groups": [
                        {
                            "Index": 1,
                            "Name": "M_TYPE",
                            "Weight": 1,
                            "Dict": [
                                {
                                    "Key": [ "Test" ],
                                    "Value": "Test"
                                }
                            ]
                        }
                    ]
                }
            };

            beforeEach(function() {
                // set autocommit off because of dynamic procedure generation
                jasmine.dbConnection.executeUpdate("SET TRANSACTION AUTOCOMMIT DDL OFF");
                oMockstar.clearAllTables();

                oMockstar.insertTableData("project", testData.oProjectTestData);
                oMockstar.insertTableData("item", oItemTestData);
                oMockstar.insertTableData("calculation", testData.oCalculationTestData);
                oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
                oMockstar.insertTableData("material", testData.oMaterialTestDataPlc);
                oMockstar.insertTableData("material__text", testData.oMaterialTextTestDataPlc);
                oMockstar.insertTableData('material_price', oPriceTestData);
                oMockstar.insertTableData("vendor", testData.oVendorTestDataPlc);
                if (jasmine.plcTestRunParameters.generatedFields === true) {
                    oMockstar.insertTableData("item_ext", testData.oItemExtData);
                    oMockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
                    oMockstar.insertTableData("material_price_ext", oPriceExtTestData);
                }
                oMockstar.insertTableData("authorization", {
                    PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0]], // PR1
                    USER_ID      : [sUserId],
                    PRIVILEGE    : [InstancePrivileges.READ]
                });
                persistency = new Persistency(jasmine.dbConnection);
            });

            afterEach(() => {
                oMockstar.clearAllTables();
            });

            /**
             * Assert search result's structure, and specify the columns that must be included
             * @param {object}
             *              oResult - similar parts search result
             */
            function expectResultStructure(oResult) {
                expect(oResult.SCORE).toBeDefined();
                expect(oResult.MATERIAL_ID).toBeDefined();
                expect(oResult.PRICE_UNIT_UOM_ID).toBeDefined();
                expect(oResult.PRICE_UNIT).toBeDefined();
                expect(oResult.TRANSACTION_CURRENCY_ID).toBeDefined();
                expect(oResult.PRICE_VARIABLE_PORTION).toBeDefined();
                expect(oResult.PRICE_FIXED_PORTION).toBeDefined();
                expect(oResult.ITEM_DESCRIPTION).toBeDefined();
                expect(oResult.MATERIAL_DESCRIPTION).toBeDefined();
                expect(oResult.FREQUENCY).toBeDefined();
                expect(oResult.VENDOR_ID).toBeDefined();
                expect(oResult.VENDOR_NAME).toBeDefined();

                expect(oResult.Source).toBeDefined();
                expect(oResult.Attributes).toBeDefined();
            }

            /**
             *-------------------------------------------------------------------------------------
             * Implementation Notes for Similar Parts Unit Testing
             *-------------------------------------------------------------------------------------
             * + Key points in each case (or each similar parts request):
             * 1) standard field or custom field
             * 2) fuzzy search or string pattern compare
             * 3) calculation versions or master data
             * 4) exist or non-exist attribute value
             *
             * + MATERIAL_ID is one special attribute (important metadata attribute, and can also
             * be query attribute), need add cases for it.
             *
             * + Notes for other issues:
             * 1) similar search parameters
             *      i) calculation versions source, e.g. ProjectIds
             *      ii) master data source, e.g. MaterialGroups
             *      iii) time range
             * 2) Matching relation of query attribute and data source
             * 3) instance privilege
             * 4) Guarantee of result structure and values
             */

            it('should return similar items when fuzzy search ITEM_DESCRIPTION with "description" from calculation versions', function() {
                // arrange
                let oSimilarParameter = {
                    Attributes: [
                        oItemDescriptionAttribute
                    ],
                    Source: {
                        CalculationVersions: {}
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                expect(aResult).toBeDefined();
                expect(aResult.length).toBeGreaterThan(0);
                expect(aResult[0].Source).toBe("CalculationVersions");
                expectResultStructure(aResult[0]);
            });

            it('should return no data when fuzzy search ITEM_DESCRIPTION with "not exist" from calculation versions', function() {
                // arrange
                let oItemDescriptionNotExist = _.cloneDeep(oItemDescriptionAttribute);
                oItemDescriptionNotExist.Value = "not exist";

                let oSimilarParameter = {
                    Attributes: [
                        oItemDescriptionNotExist
                    ],
                    Source: { CalculationVersions: {} }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                // For column 'ITEM_DESCRIPTION', fuzzy search threshold is 0.6, where 'not exist' is not similar to 'description 0' very much,
                // so return no similar items.
                expect(aResult).toBeDefined();
                expect(aResult.length).toBe(0);
            });

            it('should return similar materials when fuzzy search MATERIAL_DESCRIPTION with "Material MTA" from master data', function() {
                // arrange
                // Take 'MATERIAL_DESCRIPTION' (from t_material__text) as fuzzy search column from master data
                // Take testdata.oMaterialTextTestDataPlc as test data.
                let oSimilarParameter = {
                    Attributes: [
                        oMaterialDescriptionAttribute
                    ],
                    Source: {
                        MasterData: {}
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                expect(aResult).toBeDefined();
                expect(aResult.length).toBeGreaterThan(0);
                expect(aResult[0].Source).toBe("MasterData");
                expectResultStructure(aResult[0]);
            });

            it('should return similar materials when fuzzy search MATERIAL_ID with ""(empty value) from master data', function() {
                // arrange
                let oSimilarParameter = {
                    Attributes: [
                        oMaterialIdAttribute
                    ],
                    Source: {
                        MasterData: {}
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                expect(aResult).toBeDefined();
                expect(aResult.length).toBeGreaterThan(0);
                expect(aResult[0].Source).toBe("MasterData");
                expectResultStructure(aResult[0]);
            });

            it('should return no data when fuzzy search ITEM_DESCRIPTION from calculation versions (limited ProjectIds)', function() {
                // arrange
                // specify calculation versions must from ('#P1', '#P2')
                let oSimilarParameter = {
                    Attributes: [
                        oItemDescriptionAttribute
                    ],
                    Source: {
                        CalculationVersions: {
                            ProjectIds: ["#P1", "#P2"]
                        }
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                // should return empty similar items, because all items come from
                // project ('PR1', 'PR2', 'PRR').
                expect(aResult).toBeDefined();
                expect(aResult.length).toBe(0);
            });

            it('should return no data when fuzzy search MATERIAL_DESCRIPTION from master data (limited material groups)', function() {
                // arrange
                // specify all masterials data must from group ('#MP1', '#MP2')
                let oSimilarParameter = {
                    Attributes: [
                        oMaterialDescriptionAttribute
                    ],
                    Source: {
                        MasterData: {
                            MaterialGroups: ["#MP1", "#MP2"]
                        }
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                // should return empty similar materials because all materials come from group ('MG1', 'MG2', 'MG3')
                expect(aResult).toBeDefined();
                expect(aResult.length).toBe(0);
            });

            it('should return no data when fuzzy search ITEM_DESCRIPTION from calculation versions (invalid time range)', function() {
                // arrange
                // specify all calculation data of all calculation versions
                // must be from '1970-08-18' to '1970-08-19'
                let oSimilarParameter = {
                    Attributes: [
                        oItemDescriptionAttribute
                    ],
                    Source: {
                        CalculationVersions: {
                        },
                        TimeRange: {
                            FromTime: new Date("1970-08-18T00:00:00.000Z").toJSON(),
                            ToTime: new Date("1970-08-19T00:00:00.000Z").toJSON()
                        }
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                // should return empty items because all calculation versions are calculated just now.
                // In test data, expected date is 'new Date().toJSON()'.
                expect(aResult).toBeDefined();
                expect(aResult.length).toBe(0);
            });

            it('should return similar items and materials when fuzzy search MATERIAL_ID from calculation versions and master data', function() {
                // arrange
                // Take 'MATERIAL_ID' as fuzzy search column, which is common attribute of two data sources.
                let oSimilarParameter = {
                    Attributes: [
                        oMaterialIdAttribute
                    ],
                    Source: {
                        CalculationVersions: {},
                        MasterData: {}
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                // returned search results must contain 'CalculationVersions' and 'MasterData'
                expect(aResult).toBeDefined();
                let aSources = _.uniq(aResult.map(r => r.Source));
                expect(aSources).toContain('CalculationVersions');
                expect(aSources).toContain('MasterData');
                expectResultStructure(aResult[0]);
            });

            it('should throw exception when search attribute ITEM_DESCRIPTION doesn\'t match data source master data', function() {
                // arrange
                // Take 'ITEM_DESCRIPTION' as fuzzy search attribute, and 'MasterData' as data source
                let oSimilarParameter = {
                    Attributes: [
                        oItemDescriptionAttribute
                    ],
                    Source: {
                        MasterData: {}
                    }
                };
                // act
                let oException;
                try {
                    persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");
                } catch (e) {
                    oException = e;
                }
                // assert
                // should catch exception, becuase 'MasterData' doesn't contain column 'ITEM_DESCRIPTION'
                expect(oException).toBeDefined();
                expect(oException.code).toEqual(oExpectedErrorUnexpectedException);
            });

            it('should return no data when user has no privilege to read one calculation', function() {
                // arrange
                // specify test project in table 't_auth_project'
                oMockstar.clearTable('authorization');
                oMockstar.insertTableData("authorization", {
                    PROJECT_ID   : [ 'PR4' ],
                    USER_ID      : [ sUserId ],
                    PRIVILEGE    : [ InstancePrivileges.READ ]
                });
                let oSimilarParameter = {
                    Attributes: [
                        oItemDescriptionAttribute
                    ],
                    Source: {
                        OnlyCurrent: 1,
                        CalculationVersions: {}
                    }
                };
                // calculation version id 5809 comes from 'PR3'.
                let iCalculationVersionId = 5809;
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE", iCalculationVersionId);

                // assert
                // should return empty items because tester has no privilege to read specific calculation version
                expect(aResult).toBeDefined();
                expect(aResult.length).toBe(0);
            });

            it('should return expected property values when fuzzy search ITEM_DESCRIPTION from calculation versions', function() {
                // arrange
                let oSimilarParameter = {
                    Attributes: [
                        oItemDescriptionAttribute
                    ],
                    Source: {
                        CalculationVersions: {}
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                expect(aResult).toBeDefined();
                expect(aResult.length).toBeGreaterThan(0);
                expect(aResult[0].Source).toBe("CalculationVersions");
                expectResultStructure(aResult[0]);

                // assert property values
                expect(aResult).toMatchData({
                    'MATERIAL_ID'         : ['MAT1',             'MAT2', 'MAT3', 'MAT4'],
                    'VENDOR_ID'           : ['V1',               'V2',   'V3',   'V1'],
                    'VENDOR_NAME'         : ['N1',               'N2',   null,   'N1'],  // For Vendor Id 'V3', its _VALID_TO < MASTER_DATA_TIMESTAMP
                    'MATERIAL_DESCRIPTION': ['Material MAT1 DE', null,   null,   null]   // Other material ids have description only in 'EN', not 'DE'
                }, ['MATERIAL_ID']);
            });

            it('should return expected property values when fuzzy search MATERIAL_DESCRIPTION from master data', function() {
                // arrange
                let oSimilarParameter = {
                    Attributes: [
                        oMaterialDescriptionAttribute
                    ],
                    Source: {
                        MasterData: {}
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                expect(aResult).toBeDefined();
                expect(aResult.length).toBeGreaterThan(0);
                expect(aResult[0].Source).toBe("MasterData");
                expectResultStructure(aResult[0]);

                // assert property values
                // In test data t_material_price, 'MAT1' shows in project 'PR1', which is
                // the only project tester has privilege to read
                expect(aResult).toMatchData({
                    'MATERIAL_ID'         : [ 'MAT1'],
                    'VENDOR_ID'           : [ 'V1' ],
                    'VENDOR_NAME'         : [ 'N1' ],
                    'MATERIAL_DESCRIPTION': [ 'Material MAT1 DE']
                }, ['MATERIAL_ID']);
            });

            it('should return similar materials when fuzzy search PRICE_FIXED_PORTION from material prices', function() {
                // arrange
                // Take 'PRICE_FIXED_PORTION' as fuzzy search attribute, which is price-related standard field from material prices
                let oSimilarParameter = {
                    Attributes: [
                        {
                            "Name": "PRICE_FIXED_PORTION",
                            "Value": 120,
                            "Weight": 1,
                            "IsFuzzySearch": 1,
                            "TableSource": [ SimilarPartsSearchImport.material_price ],
                            "Option": { "scoreFunction": "gaussian", "scoreFunctionScale": 123.45, "scoreFunctionDecay": 0.5, "scoreFunctionOffset": 0 },
                            "PropertyMap": [ mockPropertyMapForAttribute("FixedDecimal", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.MaterialPrice, 0) ]
                        }
                    ],
                    Source: {
                        MasterData: {}
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert
                expect(aResult).toMatchData({
                    "MATERIAL_ID":              [ "MAT1"    ],
                    "PRICE_FIXED_PORTION":      [ "123.45"    ],
                    "PRICE_VARIABLE_PORTION":   [ "234.56"    ],
                    "MATERIAL_DESCRIPTION":     [ "Material MAT1 DE"]
                }, ["MATERIAL_ID"]);
                expect(aResult[0].Attributes).toMatchData({
                    "Name":     [ "PRICE_FIXED_PORTION" ],
                    "Value":    [ "123.4500000 (1)"     ]
                }, ["Name"]);
            });

            it('should return similar materials when string pattern search TRANSACTION_CURRENCY_ID from material prices', function() {
                // arrange
                // Take 'TRANSACTION_CURRENCY_ID' as fuzzy search attribute, which is price-related standard field from master prices
                let oSimilarParameter = {
                    Attributes: [
                        {
                            "Name": "TRANSACTION_CURRENCY_ID",
                            "Value": "EUR",
                            "Weight": 1,
                            "IsFuzzySearch": 0,
                            "TableSource": [ SimilarPartsSearchImport.material_price ],
                            "PropertyMap": [ mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.MaterialPrice, 0) ],
                            "Pattern": {
                                "Value": "([a-zA-Z]{1})([a-zA-Z]{1})([a-zA-Z]{1})",
                                "Groups": [
                                    {
                                        "Index": 2,
                                        "Name": "EUR",
                                        "Weight": 1,
                                        "Dict": [
                                            {
                                                "Key": [ "U" ],
                                                "Value": "U"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ],
                    Source: {
                        MasterData: {}
                    }
                };
                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                // assert

                expect(aResult).toMatchData({
                    "MATERIAL_ID":              [ "MAT1"    ],
                    "PRICE_FIXED_PORTION":      [ "123.45"    ],
                    "PRICE_VARIABLE_PORTION":   [ "234.56"    ],
                    "MATERIAL_DESCRIPTION":     [ "Material MAT1 DE"]
                }, ["MATERIAL_ID"]);
                expect(aResult[0].Attributes).toMatchData({
                    "Name":     [ "EUR" ],
                    "Value":    [ "U (1)" ]
                }, ["Name"]);
            });

            //-------------------------------------------------------------------------------------
            // Test Cases for Supported Data Types
            //-------------------------------------------------------------------------------------
            it('should return similar items when fuzzy search boolean column from calculation versions', function() {
                // arrange
                let oSimilarParameter = {
                    Attributes: [
                        {
                            "Name": "TEST_BOOLEAN",
                            "Value": 1,
                            "Weight": 1,
                            "IsFuzzySearch": 1,
                            "PropertyMap": [ mockPropertyMapForAttribute("BOOLEAN", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 0) ]
                        }
                    ],
                    Source: {
                        CalculationVersions: {}
                    }
                };

                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, 'DE');

                // assert
                expect(aResult[0].Source).toBe("CalculationVersions");
                expectResultStructure(aResult[0]);
                // should return similar items, with boolean- column 'TEST_BOOLEAN',
                // whose values must be specific value and frequency
                _.each(aResult, function(oResult) {
                    expect(oResult.Attributes).toMatchData({
                        'Name'  : [ 'TEST_BOOLEAN'],
                        'Value' : [ 'true (1)']
                    }, ["Name"]);
                });
            });

            it('should return similar items when fuzzy search date column from calculation versions', function() {
                // arrange
                // take date- column 'CREATED_ON' as fuzzy search attribute,
                // and set 'IsFuzzySearch' to be 1 to specify fuzzy search method
                let oSimilarParameter = {
                    Attributes: [
                        {
                            "Name": "CREATED_ON",
                            "Value": testData.sExpectedDate,
                            "Weight": 1,
                            "IsFuzzySearch": 1,
                            "TableSource": [ SimilarPartsSearchImport.item ],
                            "Option": { "scoreFunction": "gaussian", "scoreFunctionScale": 365, "scoreFunctionDecay": 0.5, "scoreFunctionOffset": 0 },
                            "PropertyMap": [ mockPropertyMapForAttribute("TIMESTAMP", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 0) ]
                        }
                    ],
                    Source: {
                        CalculationVersions: {}
                    }
                };

                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, 'DE');

                // assert
                expect(aResult[0].Source).toBe("CalculationVersions");
                expectResultStructure(aResult[0]);
                // should return similar items, with date column 'CREATED_ON',
                // whose values must be specific value and frequency
                let sExpectedLocalDate = testData.sExpectedDate + ' (1)';
                sExpectedLocalDate = sExpectedLocalDate.replace('T', ' ').replace('Z', '0000');
                _.each(aResult, function(oResult) {
                    expect(oResult.Attributes).toMatchData({
                        'Name'  : [ 'CREATED_ON' ],
                        'Value' : [ sExpectedLocalDate ]
                    }, ["Name"]);
                });
            });

            it('should return similar items when fuzzy search text column from calculation versions', function() {
                // arrange
                let oSimilarParameter = {
                    Attributes: [
                        {
                            "Name": "TEST_TEXT",
                            "Value": "one two",
                            "Weight": 1,
                            "IsFuzzySearch": 1,
                            "TableSource": [ SimilarPartsSearchImport.item ],
                            "PropertyMap": [ mockPropertyMapForAttribute("TEXT", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 0) ]
                        }
                    ],
                    Source: {
                        CalculationVersions: {}
                    }
                };

                // act
                let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, 'DE');

                // assert
                expect(aResult.length).toBe(3);
                // should return similar items, with text- column 'TEST_TEXT'
                _.each(aResult, function(oResult) {
                    expectResultStructure(oResult);
                    expect(oResult.Source).toBe("CalculationVersions");
                    expect(oResult.Attributes[0].Score).toBeGreaterThan(0.5);
                });
                // If length of text colum's value is bigger than 5000, checkout the output.
                expect(aResult[0].Attributes[0].Value).toBe("one two three ".repeat(500).substr(0, 5000) + " (1)");
            });


            function runDecimalScoreFunctions(searchOption, testData) {
                it(`should return nearly equality when fuzzy search DECIMAL and DECIMAL(<precision>, <scale>) column for ${searchOption.scoreFunction} score function`, function() {
                    // arrange
                    let oItemTestDataTest = _.cloneDeep(oItemTestData);
                    const oPriceTestData = {
                        "PRICE":       testData, // Price should be greater than 0. Here is just for testing.
                        "TEST_FLOAT":  testData
                    };
                    _.extend(oItemTestDataTest, oPriceTestData);
                    oMockstar.clearTable("item");
                    oMockstar.insertTableData("item", oItemTestDataTest);
                    let oSimilarParameter = {
                        Attributes: [
                            {
                                "Name": "PRICE",
                                "Value": 10,
                                "Weight": 1,
                                "IsFuzzySearch": 1,
                                "TableSource": [ SimilarPartsSearchImport.item ],
                                "PropertyMap": [ mockPropertyMapForAttribute("FixedDecimal", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 0) ],
                                "Option": searchOption
                            }, {
                                "Name": "TEST_FLOAT",
                                "Value": 10,
                                "Weight": 1,
                                "IsFuzzySearch": 1,
                                "TableSource": [ SimilarPartsSearchImport.item ],
                                "PropertyMap": [ mockPropertyMapForAttribute("DECIMAL", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 0) ],
                                "Option": searchOption
                            }
                        ],
                        Source: {
                            CalculationVersions: {}
                        }
                    };

                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                    // assert
                    expect(aResult[0].Source).toBe("CalculationVersions");
                    _.each(aResult, function(oResult, index) {
                        expectResultStructure(oResult);
                        expect(oResult.Attributes).toMatchData({
                            'Name'  : [ 'PRICE', 'TEST_FLOAT' ],
                            'Value' : [ oPriceTestData.PRICE[index].toFixed(7) + ' (1)', oPriceTestData.TEST_FLOAT[index] + ' (1)', ]
                        }, ["Name"]);
                        expect(Math.abs(oResult.Attributes[0].Score - oResult.Attributes[1].Score)).toBeLessThan(1e-6);
                    });
                });
            }

            [
                [{"scoreFunction": 'linear', "scoreFunctionScale": 10, "scoreFunctionDecay": 0.5, "scoreFunctionOffset": 0}, [5, 1, 0, -1,  20]],
                [{"scoreFunction": 'gaussian', "scoreFunctionScale": 5, "scoreFunctionDecay": 0.5, "scoreFunctionOffset": 0}, [10, 1, 0, -1, 30]],
                [{"scoreFunction": 'logarithmic', "scoreFunctionOffset": 5, "scoreFunctionBase": 6}, [5, 10, 1, -1, 30]]
            ].map(function(arr) {
                runDecimalScoreFunctions(arr[0], arr[1]);
            });

            //-------------------------------------------------------------------------------------
            // Test Cases for Custom Fields
            // Test points are data sources and search methods
            //-------------------------------------------------------------------------------------
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                it('should return similar items when fuzzy search CUST_STRING_MANUAL with "Test" from calculation versions', function() {
                    // arrange
                    // take column 'CUST_STRING_MANUAL' (from testdata.oItemExtData) as fuzzy search attribute
                    // take 'Test' as fuzzy search value, and set 'IsFuzzySearch' to be 1 to specify fuzzy search method
                    let oSimilarParameter = {
                        Attributes: [
                            {
                                "Name": "CUST_STRING_MANUAL",
                                "Value": "Test",
                                "Weight": 1,
                                "IsFuzzySearch": 1,
                                "TableSource": [ SimilarPartsSearchImport.item_ext ],
                                "PropertyMap": [ mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 1) ],
                            }
                        ],
                        Source: {
                            CalculationVersions: {}
                        }
                    };
                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                    // assert fuzzy search result
                    // should return similar items, with which column 'CUST_STRING_MANUAL' fuzzy like 'Test'
                    expect(aResult).toBeDefined();
                    expect(aResult.length).toBeGreaterThan(0);
                    expect(aResult[0].Source).toBe("CalculationVersions");
                    expectResultStructure(aResult[0]);
                    expect(aResult).toMatchData({
                        'MATERIAL_ID'         : [ 'MAT1',               'MAT2',             'MAT3',             'MAT4'          ],
                        'VENDOR_ID'           : [ 'V1',                 'V2',               'V3',               'V1'            ],
                        'VENDOR_NAME'         : [ 'N1',                 'N2',               null,               'N1'            ],
                        'MATERIAL_DESCRIPTION': [ 'Material MAT1 DE',   null,               null,               null            ],
                        'ITEM_DESCRIPTION'    : [ 'description 01',     'description 02',   'description 03',   'description 04']
                    }, ['MATERIAL_ID']);

                    // assert splitted subfields
                    // value of 'CUST_STRING_MANUAL' must be specific value and frequency
                    let iIndex = aResult.findIndex((element) => element.MATERIAL_ID === 'MAT1');

                    expect(aResult[iIndex].Attributes).toMatchData({
                        'Name'  : [ 'CUST_STRING_MANUAL' ],
                        'Value' : [ 'Test 1 (1)' ]
                    }, ['Name', 'Value']);
                });

                it('should return similar items when fuzzy search numeric columns from calculation versions', function() {
                    // arrange
                    // take decimal- column 'CUST_DECIMAL_WITHOUT_REF_MANUAL' (from testdata.oItemExtData) and
                    // int- column 'CUST_INT_WITHOUT_REF_MANUAL' as fuzzy search attributes,
                    // and set 'IsFuzzySearch' to be 1 to specify fuzzy search method
                    let oSimilarParameter = {
                        Attributes: [
                            {
                                "Name": "CUST_DECIMAL_WITHOUT_REF_MANUAL",
                                "Value": 50.88,
                                "Weight": 1,
                                "IsFuzzySearch": 1,
                                "TableSource": [ SimilarPartsSearchImport.item_ext ],
                                "Option": { "scoreFunction": "gaussian", "scoreFunctionScale": 50.88, "scoreFunctionDecay": 0.5, "scoreFunctionOffset": 0 },
                                "PropertyMap": [ mockPropertyMapForAttribute("FixedDecimal", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 1) ],
                            }, {
                                "Name": "CUST_INT_WITHOUT_REF_MANUAL",
                                "Value": 50,
                                "Weight": 1,
                                "IsFuzzySearch": 1,
                                "TableSource": [ SimilarPartsSearchImport.item_ext ],
                                "Option": { "scoreFunction": "gaussian", "scoreFunctionScale": 50, "scoreFunctionDecay": 0.5, "scoreFunctionOffset": 0 },
                                "PropertyMap": [ mockPropertyMapForAttribute("INTEGER", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 1) ],
                            }
                        ],
                        Source: {
                            CalculationVersions: {}
                        }
                    };

                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, 'DE');

                    // assert
                    expect(aResult[0].Source).toBe("CalculationVersions");
                    expectResultStructure(aResult[0]);
                    // should return similar items, with numeric columns 'CUST_DECIMAL_WITHOUT_REF_MANUAL'
                    // and 'CUST_INT_WITHOUT_REF_MANUAL', whose values must be specific value and frequency
                    expect(aResult[0].Attributes).toMatchData({
                        'Name'  : [ 'CUST_DECIMAL_WITHOUT_REF_MANUAL', 'CUST_INT_WITHOUT_REF_MANUAL' ],
                        'Value' : [ '50.8800000 (1)', '50 (1)']
                    }, ['Name']);
                    expect(aResult[1].Attributes).toMatchData({
                        'Name'  : [ 'CUST_DECIMAL_WITHOUT_REF_MANUAL', 'CUST_INT_WITHOUT_REF_MANUAL' ],
                        'Value' : [ '60.9600000 (1)', '60 (1)']
                    }, ['Name']);
                    expect(aResult[2].Attributes).toMatchData({
                        'Name'  : [ 'CUST_DECIMAL_WITHOUT_REF_MANUAL', 'CUST_INT_WITHOUT_REF_MANUAL' ],
                        'Value' : [ '30.0000000 (1)', '30 (1)']
                    }, ['Name']);
                    expect(aResult[3].Attributes).toMatchData({
                        'Name'  : [ 'CUST_DECIMAL_WITHOUT_REF_MANUAL', 'CUST_INT_WITHOUT_REF_MANUAL' ],
                        'Value' : [ '400.5000000 (1)', '40 (1)']
                    }, ['Name']);
                });

                it('should return similar materials when fuzzy search CMAT_STRING_MANUAL with "Test" from master data', function() {
                    // arrange
                    // Take 'CMAT_STRING_MANUAL' as fuzzy search attribute, which is a custom field from master data
                    let oSimilarParameter = {
                        Attributes: [
                            oCustFunctionFuzzyAttribute
                        ],
                        Source: {
                            MasterData: {}
                        }
                    };
                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                    // assert
                    expect(aResult).toBeDefined();
                    expect(aResult.length).toBeGreaterThan(0);
                    expect(aResult[0].Source).toBe("MasterData");
                    expect(aResult[0].Attributes.length).toBe(1);
                    expectResultStructure(aResult[0]);
                    expect(aResult).toMatchData({
                        'MATERIAL_ID'         : [ 'MAT1'            ],
                        'VENDOR_ID'           : [ 'V1'              ],
                        'MATERIAL_DESCRIPTION': [ 'Material MAT1 DE'],
                        'ITEM_DESCRIPTION'    : [ null              ]
                    }, ['MATERIAL_ID']);

                    // assert splitted subfield
                    expect(aResult[0].Attributes).toMatchData({
                        'Name'  : [ 'CMAT_STRING_MANUAL' ],
                        'Value' : [ 'Test String 1 (1)' ]
                    }, ['Name']);
                });

                it('should return similar items when pattern compare CUST_STRING_MANUAL from calculation versions', function() {
                    // arrange
                    // Take 'CUST_STRING_MANUAL' as search attribute, which must follow one string pattern
                    let oSimilarParameter = {
                        Attributes: [
                            oCustFunctionGroupAttribute
                        ],
                        Source: {
                            CalculationVersions: {}
                        }
                    };
                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                    // assert
                    expect(aResult).toBeDefined();
                    expect(aResult.length).toBeGreaterThan(0);
                    expect(aResult[0].Source).toBe("CalculationVersions");
                    expectResultStructure(aResult[0]);

                    // assert splitted subfield
                    // returned search attribute must be 'M_TYPE', which is a subfield from input 'CUST_STRING_MANUAL'
                    expect(aResult[0].Attributes).toMatchData({
                        'Name'  : [ 'M_TYPE'    ],
                        'Value' : [ 'Test (1)'  ],
                        'Score' : [ 1           ]
                    }, ['Name']);
                });

                it('should return similar materials when string pattern compare CMAT_STRING_MANUAL from master data', function() {
                    // arrange
                    // Take 'CMAT_STRING_MANUAL' as search attribute, which must follow one string pattern
                    let oSimilarParameter = {
                        Attributes: [
                            oCustFunctionGroupMasterAttribute
                        ],
                        Source: {
                            MasterData: {}
                        }
                    };
                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                    // assert
                    expect(aResult).toBeDefined();
                    expect(aResult.length).toBeGreaterThan(0);
                    expect(aResult[0].Source).toBe("MasterData");
                    expectResultStructure(aResult[0]);
                    expect(aResult).toMatchData({
                        'MATERIAL_ID'         : [ 'MAT1'],
                        'VENDOR_ID'           : [ 'V1' ],
                        'VENDOR_NAME'         : [ 'N1' ],
                        'MATERIAL_DESCRIPTION': [ 'Material MAT1 DE']
                    }, ['MATERIAL_ID']);

                    // assert splitted subfield
                    // returned search attribute must be 'M_TYPE', which is a subfield from input 'CMAT_STRING_MANUAL'
                    expect(aResult[0].Attributes).toMatchData({
                        'Name'  : [ 'M_TYPE' ],
                        'Value' : [ 'Test (1)' ]
                    }, ['Name']);
                });

                it('should return similar materials when fuzzy search CMPR_DECIMAL_WITH_CURRENCY_MANUAL with 200 from material prices', function() {
                    // arrange
                    // Take 'CMPR_DECIMAL_WITH_CURRENCY_MANUAL' as fuzzy search attribute, which is price-related custom field from master data
                    let oSimilarParameter = {
                        Attributes: [
                            {
                                "Name": "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                                "Value": 200,
                                "Weight": 1,
                                "IsFuzzySearch": 1,
                                "TableSource": [ SimilarPartsSearchImport.material_price_ext ],
                                "Option": { "scoreFunction": "gaussian", "scoreFunctionScale": 200, "scoreFunctionDecay": 0.5, "scoreFunctionOffset": 0 },
                                "PropertyMap": [ mockPropertyMapForAttribute("FixedDecimal", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.MaterialPrice, 1) ]
                            }
                        ],
                        Source: {
                            MasterData: {}
                        }
                    };
                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");
                    // assert
                    expect(aResult).toMatchData({
                        "MATERIAL_ID":              [ "MAT1"    ],
                        "PRICE_FIXED_PORTION":      [ "123.45"    ],
                        "PRICE_VARIABLE_PORTION":   [ "234.56"    ],
                        "MATERIAL_DESCRIPTION":     [ "Material MAT1 DE"]
                    }, ["MATERIAL_ID"]);
                    expect(aResult[0].Attributes).toMatchData({
                        "Name":     [ "CMPR_DECIMAL_WITH_CURRENCY_MANUAL" ],
                        "Value":    [ "234.5600000 (1)" ]
                    }, ["Name"]);
                });

                it('should return similar items and material prices when fuzzy search CMPR_DECIMAL_MANUAL with 123.45 from two data sources', function() {
                    // arrange
                    // Take 'CMPR_DECIMAL_WITH_CURRENCY_MANUAL' as fuzzy search attribute, which is price-related custom field
                    // from table t_material_price_ext, and also from table t_item_ext
                    oMockstar.execSingle("UPDATE {{item_ext}} SET CMPR_DECIMAL_MANUAL = 123.45;");
                    let oSimilarParameter = {
                        Attributes: [
                            {
                                "Name": "CMPR_DECIMAL_MANUAL",
                                "Value": 123.45,
                                "Weight": 1,
                                "IsFuzzySearch": 1,
                                "TableSource": [ SimilarPartsSearchImport.item_ext, SimilarPartsSearchImport.material_price_ext ],
                                "Option": { "scoreFunction": "gaussian", "scoreFunctionScale": 123.45, "scoreFunctionDecay": 0.5, "scoreFunctionOffset": 0 },
                                "PropertyMap": [
                                    mockPropertyMapForAttribute("FixedDecimal", SimilarPartsSourceTypes.CalculationVersions, BusinessObjectTypes.Item, 1),
                                    mockPropertyMapForAttribute("FixedDecimal", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.MaterialPrice, 1) ]
                            }
                        ],
                        Source: {
                            CalculationVersions: {},
                            MasterData: {}
                        }
                    };
                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");
                    // assert
                    expect(aResult).toMatchData({
                        "MATERIAL_ID":              [ "MAT1",       "MAT1",                "MAT2",                "MAT3",                "MAT4"],
                        "Source":                   [ "MasterData", "CalculationVersions", "CalculationVersions", "CalculationVersions", "CalculationVersions"],
                        "PRICE_FIXED_PORTION":      [ "123.45",       "0",                     "2772.36",               "2246.88",               "2590.96"],
                        "PRICE_VARIABLE_PORTION":   [ "234.56",       "0",                     "0",                     "415.66",                "371.11"]
                    }, ["MATERIAL_ID", "Source"]);
                    _.each(aResult, oResult => {
                        expect(oResult.Attributes).toMatchData({
                            "Name":     [ "CMPR_DECIMAL_MANUAL" ],
                            "Value":    [ "123.4500000 (1)" ]
                        }, ["Name"]);
                    });
                });

                it('should return similar materials when string pattern compare CMPR_DECIMAL_WITH_CURRENCY_UNIT from master data', function() {
                    // arrange
                    // Take 'CMPR_DECIMAL_WITH_CURRENCY_UNIT' as search attribute, which must follow one string pattern
                    let oSimilarParameter = {
                        Attributes: [
                            {
                                "Name": "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                                "Value": "EUR",
                                "Weight": 1,
                                "IsFuzzySearch": 0,
                                "TableSource": [ SimilarPartsSearchImport.material_price_ext ],
                                "PropertyMap": [ mockPropertyMapForAttribute("NVARCHAR", SimilarPartsSourceTypes.MasterData, BusinessObjectTypes.MaterialPrice, 1) ],
                                "Pattern": {
                                    "Value": "([a-zA-Z]{1})([a-zA-Z]{1})([a-zA-Z]{1})",
                                    "Groups": [
                                        {
                                            "Index": 1,
                                            "Name": "EUR",
                                            "Weight": 1,
                                            "Dict": [
                                                {
                                                    "Key": [ "E" ],
                                                    "Value": "E"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ],
                        Source: {
                            MasterData: {}
                        }
                    };
                    // act
                    let aResult = persistency.SimilarPartsSearch.search(oSimilarParameter, sUserId, "DE");

                    // assert
                    expectResultStructure(aResult[0]);
                    expect(aResult).toMatchData({
                        'MATERIAL_ID'         : [ 'MAT1'],
                        'VENDOR_ID'           : [ 'V1' ],
                        'VENDOR_NAME'         : [ 'N1' ],
                        'MATERIAL_DESCRIPTION': [ 'Material MAT1 DE']
                    }, ['MATERIAL_ID']);

                    // assert splitted subfield
                    // returned search attribute must be 'EUR', which is a subfield from input 'CMPR_DECIMAL_WITH_CURRENCY_UNIT'
                    expect(aResult[0].Attributes).toMatchData({
                        'Name'  : [ 'EUR' ],
                        'Value' : [ 'E (1)' ]
                    }, ['Name']);
                });
            }
        });

    }).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}
