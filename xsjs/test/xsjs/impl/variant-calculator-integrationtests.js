const oTestData = require("../../testdata/testdata").data;
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const ResponseObjectStub = require("../../testtools/responseObjectStub").ResponseObjectStub;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
const _ = require("lodash");
const InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const Persistency = $.import("xs.db", "persistency").Persistency;
const DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLibrary.Dispatcher;
const oCtx = DispatcherLibrary.prepareDispatch($);
const MessageLibrary = require("../../../lib/xs/util/message");
const oMessageCode = MessageLibrary.Code;
const testHelpers = require("../../testtools/test_helpers");
const Constants = require("../../../lib/xs/util/constants");
const VariantLockContext = Constants.CalculationVersionLockContext.VARIANT_MATRIX;
const CalculationVersionType = Constants.CalculationVersionType;
const testData = require("../../testdata/testdata").data;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;
describe("xsjs.impl.variant-calculator-integrationtests", () => {
    const iIdOfVersionWithVariants = testData.iCalculationVersionId;
    const iValidVariantId = testData.iVariantId;
    const iSecondVariantId = testData.iSecondVariantId;
    let oMockstar = null;
    let oResponseStub = null;
    const sUserId = $.session.getUsername();
    const sDate = new Date().toJSON();
    const oOpenCalculationVersions = {
        SESSION_ID: ["testUser", "testUser"],
        CALCULATION_VERSION_ID: [iIdOfVersionWithVariants, 2],
        IS_WRITEABLE: [1, 1],
        CONTEXT: [VariantLockContext, VariantLockContext],
    };
    const oCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
    const oItemTestData = new TestDataUtility(testData.oItemTestData).build();
    const oVariantItemTestData = new TestDataUtility(testData.oVariantItemTestData).build();
    const oVariantItemTemporaryTestData = new TestDataUtility(testData.oVariantItemTemporaryTestData).build();
    const oVariantTestData = new TestDataUtility(testData.oVariantTestData).build();
    const oCalculationTestData = new TestDataUtility(testData.oCalculationForVariantTestData).build();
    const oVersionItemTestData = new TestDataUtility(testData.oItemTestData).build();
    const oSumVariantTestData = _.extend(new TestDataUtility(testData.oVariantTestData).getObjects([0])[0], {
        VARIANT_TYPE: 1,
        VARIANT_ID: 99
    });
    var oSumVariantItemTestData = new TestDataUtility(testData.oVariantItemTestData).getObjects([0,1,2]);
    oSumVariantItemTestData.forEach(oItem => {
        _.extend(oItem, { VARIANT_ID : 99 })
    });

    const oProjectTestData = {
        PROJECT_ID: ["VariantTestProject"],
        ENTITY_ID: [101],
        CONTROLLING_AREA_ID: ["CA"],
        REPORT_CURRENCY_ID: ["EUR"],
        LIFECYCLE_PERIOD_INTERVAL: [1],
        EXCHANGE_RATE_TYPE_ID: ["STANDARD"],
        CREATED_ON: [sDate],
        CREATED_BY: ["user"],
        LAST_MODIFIED_ON: [sDate],
        LAST_MODIFIED_BY: ["user"],
        MATERIAL_PRICE_STRATEGY_ID:[sStandardPriceStrategy],
        ACTIVITY_PRICE_STRATEGY_ID:[sStandardPriceStrategy]
    };

    const oAuthorizationTestDataRead = {
        PROJECT_ID: ["VariantTestProject"],
        USER_ID: [$.session.getUsername()],
        PRIVILEGE: [InstancePrivileges.READ],
    };

    const oAuthorizationTestDataCreate = {
        PROJECT_ID: ["VariantTestProject"],
        USER_ID: [$.session.getUsername()],
        PRIVILEGE: [InstancePrivileges.CREATE_EDIT],
    };

    const oFormulaTestData = {
        FORMULA_ID:       [ 99999 ],
        PATH:             ["Item"],
        BUSINESS_OBJECT:  ["Item"],
        COLUMN_ID:        ["QUANTITY"],
        ITEM_CATEGORY_ID: [3],
        IS_FORMULA_USED:  [1],
        FORMULA_STRING:   ["111+222+333"]
    };

    const oFrontendSettingsData = {
        SETTING_ID: [100],
        SETTING_NAME: ['MaximumNumberOfVariantsInSum'],
        SETTING_TYPE: ['VARIANTSSETTINGS'],
        SETTING_CONTENT: ['100'],
        USER_ID: [null] 
    };

    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            schema: "SAP_PLC",
            substituteTables: {
                variant: {
                    name: "sap.plc.db::basis.t_variant",
                    data: oVariantTestData,
                },
                variant_temporary: {
                    name: "sap.plc.db::basis.t_variant_temporary",
                    data: oVariantTestData,
                },
                variant_item: {
                    name: "sap.plc.db::basis.t_variant_item",
                    data: oVariantItemTestData,
                },
                variant_temporary: {
                    name: "sap.plc.db::basis.t_variant_temporary",
                    data: oVariantTestData,
                },
                variant_item_temporary: {
                    name: "sap.plc.db::basis.t_variant_item_temporary",
                    data: oVariantItemTemporaryTestData
                },
                version_item: {
                    name: "sap.plc.db::basis.t_item",
                    data: oVersionItemTestData,
                },
                account: {
                    name: "sap.plc.db::basis.t_account",
                    data: testData.oAccountForItemTestData,
                },
                calculationVersion: {
                    name: "sap.plc.db::basis.t_calculation_version",
                    data: oCalculationVersionTestData,
                },
                open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions",
                calculation: {
                    name: "sap.plc.db::basis.t_calculation",
                    data: oCalculationTestData,
                },
                project: {
                    name: "sap.plc.db::basis.t_project",
                    data: oProjectTestData,
                },
                authorization: {
                    name: "sap.plc.db::auth.t_auth_project",
                    data: oAuthorizationTestDataCreate,
                },
                exchange_rate_type: {
                    name: "sap.plc.db::basis.t_exchange_rate_type",
                },
                session: {
                    name: "sap.plc.db::basis.t_session",
                    data: oTestData.oSessionTestData,
                },
                formula : {
                    name: "sap.plc.db::basis.t_formula",
                    data: oFormulaTestData
                },
                frontend_settings: {
                    name: "sap.plc.db::basis.t_frontend_settings"
                },
                currency_conversion: {
                    name: "sap.plc.db::basis.t_currency_conversion"
                }
            },
        });
    });

    beforeEach(() => {
        const oPersistency = new Persistency(jasmine.dbConnection);
        oCtx.persistency = oPersistency;
        oResponseStub = new ResponseObjectStub();

        oMockstar.initializeData();
    });

    afterEach(() => {
        oMockstar.clearAllTables();
    });

    describe("POST - calculate sum variant", () => {

        function prepareCalculateSumRequest(oBody, nVersionId, persist) {
            const params = [{
                "name": "persist",
                "value": true
            }];

            params.get = function(sArgument) {
				var value;
				_.each(this, function(oParameter) {
					if (oParameter.name === sArgument) {
						value = oParameter.value;
					}
				});
				return value;
			};
            const oRequest = {
                queryPath: `calculation-versions/${nVersionId}/variant-calculator/calculate/sum`,
                method: $.net.http.POST,
                body: {
                    asString() {
                        return JSON.stringify(oBody);
                    },
                },
            };
            if(persist){
                oRequest.parameters = params;   
            }
            return oRequest;
        }

        const aRequestForCalculation = {
            EXCHANGE_RATE_TYPE_ID: "STANDARD",
            REPORT_CURRENCY_ID: "EUR",
            VARIANTS: [{
                VARIANT_ID: iValidVariantId
            }, {
                VARIANT_ID: iSecondVariantId
            }]
        };

        it("should return calculated sum variant for given variants", () => {
            //arrange
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, false);

            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oResponseStub.getParsedBody().body.calculated;
            // check variant sum calculated fields
          expect(aCalculatedVariants[0].TOTAL_COST).toBe("788.1118400");
            expect(aCalculatedVariants[0].SALES_PRICE).toBe("20.0000000");
            // check variant items calculate fields
            expect(aCalculatedVariants[0].ITEMS.TOTAL_COST[0]).toBe("788.1118400");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_COST[1]).toBe("788.1118400");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_QUANTITY[0]).toBe("30.0000000");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_QUANTITY[1]).toBe("160.0000000");
        });

        it("should return calculated sum variant for given variants using the provided report currency", () => {
            //arrange
            const aCustomRequest = {
                EXCHANGE_RATE_TYPE_ID: "STANDARD",
                REPORT_CURRENCY_ID: "USD",
                VARIANTS: [{
                    VARIANT_ID: iValidVariantId
                }, {
                    VARIANT_ID: iSecondVariantId
                }]
            };
            const oRequest = prepareCalculateSumRequest(aCustomRequest, iIdOfVersionWithVariants, false);
            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oResponseStub.getParsedBody().body.calculated;
            // check variant sum calculated fields
            expect(aCalculatedVariants[0].TOTAL_COST).toBe("859.9876398");
            expect(aCalculatedVariants[0].SALES_PRICE).toBe("20.0000000");
            // check variant items calculate fields
            expect(aCalculatedVariants[0].ITEMS.TOTAL_COST[0]).toBe("859.9876398");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_COST[1]).toBe("859.9876398");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_QUANTITY[0]).toBe("30.0000000");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_QUANTITY[1]).toBe("160.0000000");
        });

        it("should throw GENERAL_ENTITY_NOT_FOUND_ERROR if the settings fot the maximum number of variants doesn't exist", () => {
            // arrange
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, false);
            oMockstar.clearTable("frontend_settings");
            
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });

        it("should throw NUMBER_OF_VARIANTS_ERROR if the number of variants exceeds the number set in the settings", () => {
            // arrange
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, false);
            const oFrontendSettings = {
                SETTING_ID: 100,
                SETTING_NAME: 'MaximumNumberOfVariantsInSum',
                SETTING_TYPE: 'VARIANTSSETTINGS',
                SETTING_CONTENT: '0',
                USER_ID: null 
            };
            oMockstar.clearTable("frontend_settings");
            oMockstar.insertTableData("frontend_settings", oFrontendSettings);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.NUMBER_OF_VARIANTS_ERROR.code);
        });

        it("should only return the sum variant if formula is not defined", () => {
            //arrange
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, false);

            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oResponseStub.getParsedBody().body.calculated;
            // check variant sum calculated fields
            expect(aCalculatedVariants.length).toBe(1);
          expect(aCalculatedVariants[0].TOTAL_COST).toBe("788.1118400");
            expect(aCalculatedVariants[0].SALES_PRICE).toBe("20.0000000");
        });

        it("should return the sum variant together with the newly added item in base version", () => {
            //arrange
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, false);
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch(); //calculate the sum variant
            //add a new item in base calculation version
            const oNewItemTestData = _.extend(new TestDataUtility(testData.oItemTestData).getObject(2), {
                ITEM_ID: 9999
            });
            oMockstar.insertTableData("version_item", oNewItemTestData);

            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch(); //calculate the sum variant again

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oResponseStub.getParsedBody().body.calculated;
            // check variant sum calculated fields
            expect(aCalculatedVariants[0].ITEMS.ITEM_ID.length).toBe(4);
        });

        it("should return all variants when formula for TOTAL_QUANTITY_OF_VARIANTS is used", () => {
            //arrange
            let oFormulaData = {
                FORMULA_ID:       [ 99998 ],
                PATH:             ["Item"],
                BUSINESS_OBJECT:  ["Item"],
                COLUMN_ID:        ["QUANTITY"],
                ITEM_CATEGORY_ID: [3],
                IS_FORMULA_USED:  [1],
                FORMULA_STRING:   ["$TOTAL_QUANTITY_OF_VARIANTS"]
            };
            oMockstar.insertTableData("formula", oFormulaData);
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, false);

            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oResponseStub.getParsedBody().body.calculated;
            // check variant sum calculated fields
            expect(aCalculatedVariants.length).toBe(3);
            expect(aCalculatedVariants[2].TOTAL_COST).toBe("15.3835644");
            expect(aCalculatedVariants[2].SALES_PRICE).toBe("20.0000000");
        });

        it("should set TOTAL_QUANTITY_OF_VARIANTS for all items", () => {
            //arrange
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, true);
            oMockstar.insertTableData("variant", oSumVariantTestData);
            oMockstar.insertTableData("variant_temporary", oSumVariantTestData);
            oMockstar.insertTableData("variant_item", oSumVariantItemTestData);
            const oSumVariantItemTestDataCopy = JSON.parse(JSON.stringify(oSumVariantItemTestData));
            oSumVariantItemTestDataCopy.forEach(oItem => {
                _.extend(oItem, { CALCULATION_VERSION_ID : iIdOfVersionWithVariants});
            });
            oMockstar.insertTableData("variant_item_temporary", oSumVariantItemTestDataCopy);

            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);

            var oResultVariantsItems = oMockstar.execQuery(`select * from {{variant_item}} where variant_id = 99`);
            var oResultItems = oMockstar.execQuery(`select ITEM_ID, TOTAL_QUANTITY_OF_VARIANTS from {{version_item}} where calculation_version_id = ${iIdOfVersionWithVariants}`);
            expect(oResultVariantsItems.columns.TOTAL_QUANTITY.rows[0]).toBe(oResultItems.columns.TOTAL_QUANTITY_OF_VARIANTS.rows[0]);
            expect(oResultVariantsItems.columns.TOTAL_QUANTITY.rows[1]).toBe(oResultItems.columns.TOTAL_QUANTITY_OF_VARIANTS.rows[1]);
            expect(oResultVariantsItems.columns.TOTAL_QUANTITY.rows[2]).toBe(oResultItems.columns.TOTAL_QUANTITY_OF_VARIANTS.rows[2]);

        });

        it("should return calculated sum variant for given variants and persist the variants in main tables", () => {
            //arrange
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, true);
            oMockstar.insertTableData("variant", oSumVariantTestData);
            oMockstar.insertTableData("variant_temporary", oSumVariantTestData);
            oMockstar.insertTableData("variant_item", oSumVariantItemTestData);
            oSumVariantItemTestData.forEach(oItem => {
                _.extend(oItem, { CALCULATION_VERSION_ID : iIdOfVersionWithVariants});
            });
            oMockstar.insertTableData("variant_item_temporary", oSumVariantItemTestData);

            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);

            var oResultVariants = oMockstar.execQuery(`select * from {{variant}} where variant_id = 99`);
            var oResultVariantItems = oMockstar.execQuery(`select * from {{variant_item}} where variant_id = 99`);
            expect(oResultVariants.columns.TOTAL_COST.rows[0]).toBe("788.1118400");
            expect(oResultVariants.columns.SALES_PRICE.rows[0]).toBe("20.0000000");

            // check variant items calculate fields
            expect(oResultVariantItems.columns.TOTAL_COST.rows[0]).toBe("788.1118400");
            expect(oResultVariantItems.columns.TOTAL_COST.rows[1]).toBe("788.1118400");
            expect(oResultVariantItems.columns.TOTAL_QUANTITY.rows[0]).toBe("30.0000000");
            expect(oResultVariantItems.columns.TOTAL_QUANTITY.rows[1]).toBe("160.0000000");
        });

        it("should throw GENERAL_ENTITY_NOT_FOUND_ERROR if sum variant has not been previously saved", () => {
            //arrange
            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, true);
            //oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);

            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.NOT_FOUND);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
            expect(oResponseMessages.details.messageTextObj.toString()).toContain("No variant exists for the given id");

        });

        it("should throw GENERAL_VALIDATION_ERROR if request body is invalid", () => {
            //arrange
            var aInvalidRequest = [{
                    ID: iValidVariantId
            }, {
                    ID: iSecondVariantId
            }];

            const oRequest = prepareCalculateSumRequest(aInvalidRequest, iIdOfVersionWithVariants, true);
            
            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseMessages.details.messageTextObj.toString()).toContain("The variants for which the sum is calculated have to be an array");
        });

        it("should throw GENERAL_VALIDATION_ERROR if VARIANTS property is invalid", () => {
            //arrange
            const aRequestForCalculation = {
                EXCHANGE_RATE_TYPE_ID: "STANDARD",
                REPORT_CURRENCY_ID: "EUR",
                VARIANTS: [{
                    ID: iValidVariantId
                }, {
                    ID: iSecondVariantId
                }]
            };

            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, true);
            
            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseMessages.details.messageTextObj.toString()).toContain("Not able to find property ID");
        });

        it("should throw GENERAL_VALIDATION_ERROR if exchange rate type is not found in masterdata", () => {
            //arrange
            const aRequestForCalculation = {
                EXCHANGE_RATE_TYPE_ID : "TST",
                REPORT_CURRENCY_ID: "EUR",
                VARIANTS: [{
                    VARIANT_ID: iValidVariantId
                }, {
                    VARIANT_ID: iSecondVariantId
                }]
            };

            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, true);
            
            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR.code);
            expect(oResponseMessages.details.messageTextObj.toString()).toContain("Error while checking masterdata reference of property");
        });

        it("should throw GENERAL_VALIDATION_ERROR if exchange rate type is missing from request body", () => {
            //arrange
            const aRequestForCalculation = {
                REPORT_CURRENCY_ID: "EUR",
                VARIANTS: [{
                    VARIANT_ID: iValidVariantId
                }, {
                    VARIANT_ID: iSecondVariantId
                }]
            };

            const oRequest = prepareCalculateSumRequest(aRequestForCalculation, iIdOfVersionWithVariants, true);
            
            //act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseMessages.details.messageTextObj.toString()).toContain("Mandatory property EXCHANGE_RATE_TYPE_ID is missing");
        });

    });

    describe("POST - calculate variant transient", () => {
        // TODO: Test data is still inconsistent and produces calculation warnings.
        function prepareCalculateRequest(oBody, nVersionId) {
            const oRequest = {
                queryPath: `calculation-versions/${nVersionId}/variant-calculator`,
                method: $.net.http.POST,
                body: {
                    asString() {
                        return JSON.stringify(oBody);
                    },
                },
            };
            return oRequest;
        }

        const aRequestForCalculation = [{
            VARIANT_ID: iValidVariantId,
            REPORT_CURRENCY_ID: "EUR",
            SALES_PRICE_CURRENCY_ID: "EUR",
            EXCHANGE_RATE_TYPE_ID: "STANDARD",
            SALES_PRICE: 10000,
            IS_SELECTED: 1,
            VARIANT_TYPE: 0,
            ITEMS: {
                ITEM_ID: [3001, 3002, 3003],
                IS_INCLUDED: [1, 1, 1],
                QUANTITY: [10, 10, 10],
                QUANTITY_STATE: [1, 1, 0],
                QUANTITY_UOM_ID: ["PC", "PC", "H"],
            },
        }, {
            VARIANT_ID: iSecondVariantId,
            REPORT_CURRENCY_ID: "EUR",
            SALES_PRICE_CURRENCY_ID: "EUR",
            EXCHANGE_RATE_TYPE_ID: "STANDARD",
            SALES_PRICE: 10000,
            IS_SELECTED: 1,
            VARIANT_TYPE: 0,
            ITEMS: {
                ITEM_ID: [3001, 3002, 3003],
                IS_INCLUDED: [1, 1, 1],
                QUANTITY: [20, 3, 6],
                QUANTITY_STATE: [1, 1, 0],
                QUANTITY_UOM_ID: ["PC", "PC", "H"],
            },
        }];

        it("should return correct values for the calculated variant headers and items", () => {
            // arrange
            const oRequest = prepareCalculateRequest(aRequestForCalculation, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oResponseStub.getParsedBody().body.calculated;
            // check variant calculated fields
            expect(aCalculatedVariants[0].TOTAL_COST).toBe("492.5699000");
            expect(aCalculatedVariants[0].SALES_PRICE).toBe("10000.0000000");
            // check variant items calculate fields
            expect(aCalculatedVariants[0].ITEMS.TOTAL_COST[0]).toBe("492.5699000");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_COST[1]).toBe("492.5699000");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_QUANTITY[0]).toBe("10.0000000");
            expect(aCalculatedVariants[0].ITEMS.TOTAL_QUANTITY[1]).toBe("100.0000000");
            // check that for the root item, after calculation TOTAL_QUANTITY equals QUANTITY
            expect(parseInt(aCalculatedVariants[0].ITEMS.TOTAL_QUANTITY[0])).toBe(aRequestForCalculation[0].ITEMS.QUANTITY[0]);

            expect(aCalculatedVariants[1].ITEMS.TOTAL_COST[0]).toBe("295.5419400");
            expect(aCalculatedVariants[1].ITEMS.TOTAL_COST[1]).toBe("295.5419400");
            expect(aCalculatedVariants[1].ITEMS.TOTAL_QUANTITY[0]).toBe("20.0000000");
            expect(aCalculatedVariants[1].ITEMS.TOTAL_QUANTITY[1]).toBe("60.0000000");
            // check that for the root item, after calculation TOTAL_QUANTITY equals QUANTITY
            expect(parseInt(aCalculatedVariants[1].ITEMS.TOTAL_QUANTITY[0])).toBe(aRequestForCalculation[1].ITEMS.QUANTITY[0]);

            // check if the result where stored in the t_variant_item_temporary too
            const oResultVariantItems = oMockstar.execQuery(`SELECT VARIANT_ID, ITEM_ID, TOTAL_COST, TOTAL_QUANTITY
                                                             FROM {{variant_item_temporary}}
                                                             WHERE VARIANT_ID = ${iValidVariantId} ORDER BY ITEM_ID ASC;`);
            const oResultVariant = oMockstar.execQuery(`SELECT *
                                                        FROM {{variant_temporary}}
                                                        WHERE VARIANT_ID = ${iValidVariantId};`);
            expect(oResultVariant.columns.TOTAL_COST.rows[0]).toBe("492.5699000");
            expect(oResultVariantItems.columns.TOTAL_COST.rows[0]).toBe("492.5699000");
            expect(oResultVariantItems.columns.TOTAL_COST.rows[1]).toBe("492.5699000");
            expect(oResultVariantItems.columns.TOTAL_QUANTITY.rows[0]).toBe("10.0000000");
            expect(oResultVariantItems.columns.TOTAL_QUANTITY.rows[1]).toBe("100.0000000");
        });
        it("should return correct values for the calculated items based on formula", () => {
            // arrange
            const oRequest = prepareCalculateRequest(aRequestForCalculation, iIdOfVersionWithVariants);
            var aExpectedCalculatedData = {
                ITEM_ID: [3001,3002,3003],
                QUANTITY_CALCULATED:["10.0000000", "10.0000000", "0.1850000"]
            };
            if(jasmine.plcTestRunParameters.generatedFields === true){
                oMockstar.clearTable("formula");
				oMockstar.insertTableData("formula", oFormulaTestData);
			}
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariantItems = oResponseStub.getParsedBody().body.calculated[0].ITEMS;
            expect(aCalculatedVariantItems).toMatchData(aExpectedCalculatedData, ["ITEM_ID"]);
        });
        it("should set is_included to 0 in variant item temporary table for variant items which are not included for calculation", () => {
            // arrange
            let aRequestCopy = JSON.parse(JSON.stringify(aRequestForCalculation));
            Object.keys(aRequestCopy[0].ITEMS).forEach(key => {
                aRequestCopy[0].ITEMS[key].splice(-1, 1);
            });
            const oRequest = prepareCalculateRequest(aRequestCopy, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            // check if the result where stored in the t_variant_item_temporary too
            const oResultVariantItems = oMockstar.execQuery(`SELECT VARIANT_ID, ITEM_ID, TOTAL_COST, TOTAL_QUANTITY, IS_INCLUDED
                    FROM {{variant_item_temporary}}
                    WHERE VARIANT_ID = ${iValidVariantId} ORDER BY ITEM_ID ASC;`);

            expect(oResultVariantItems.columns.IS_INCLUDED.rows[2]).toBe(0);
            
        });
        it("should return only the calculated fields for variant headers", () => {
            // arrange
            const oRequest = prepareCalculateRequest(aRequestForCalculation, iIdOfVersionWithVariants);
            const aExpectedColumnsOnHeaderResponse = ["VARIANT_ID", "VARIANT_TYPE", "SALES_PRICE", "TOTAL_COST", "LAST_CALCULATED_ON", "LAST_CALCULATED_BY", "ITEMS"];
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariantHeaders = oResponseStub.getParsedBody().body.calculated;
            const aActualColumnsOnHeaderResponse = Object.keys(aCalculatedVariantHeaders[0]);
            expect(_.difference(aActualColumnsOnHeaderResponse, aExpectedColumnsOnHeaderResponse).length).toEqual(0);
        });
        it("should return only the calculated fields for variant items", () => {
            // arrange
            const oRequest = prepareCalculateRequest(aRequestForCalculation, iIdOfVersionWithVariants);
            const aExpectedColumnsOnItemsResponse = ["VARIANT_ID", "ITEM_ID", "TOTAL_QUANTITY", "TOTAL_COST", "QUANTITY_CALCULATED"];
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariantItems = oResponseStub.getParsedBody().body.calculated[0].ITEMS;
            const aActualColumnsOnItemsResponse = Object.keys(aCalculatedVariantItems);
            expect(_.difference(aActualColumnsOnItemsResponse, aExpectedColumnsOnItemsResponse).length).toEqual(0);
        });
        it("should return updated LAST_CALCULATED_ON and LAST_CALCULATED_BY", () => {
            // arrange
            const dStart = new Date();
            const oRequest = prepareCalculateRequest(aRequestForCalculation, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oResponseStub.getParsedBody().body.calculated;
            const dLastCalculated = Date.parse(aCalculatedVariants[0].LAST_CALCULATED_ON);
            expect(aCalculatedVariants[0].LAST_CALCULATED_BY).toBe(sUserId);
            expect(dStart <= dLastCalculated).toBe(true);
            const dEnd = new Date().getTime();
            expect(dLastCalculated <= dEnd).toBe(true);
        });
        it("should return variant items compressed", () => {
            // arrange
            const oRequest = prepareCalculateRequest(aRequestForCalculation, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oResponseStub.getParsedBody().body.calculated;
            _.values(aCalculatedVariants[0].ITEMS).forEach((aItemAttribute) => {
                expect(_.isArray(aItemAttribute)).toBe(true);
            });
        });
        it("should return GENERAL_VALIDATION_ERROR if the body contains invalid fields", () => {
            // arrange
            const oVariantData = new TestDataUtility(aRequestForCalculation).build();
            oVariantData[0].INVALID_FIELD = "INVALID_FIELD";
            const oRequest = prepareCalculateRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseMessages.details.messageTextObj.toString()).toContain("INVALID_FIELD");
        });
        it("should return GENERAL_VALIDATION_ERROR if a variant header has a mandatory field missing", () => {
            // arrange
            const oVariantData = new TestDataUtility(aRequestForCalculation).build();
            delete oVariantData[0].VARIANT_ID;
            const oRequest = prepareCalculateRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseMessages.details.messageTextObj.toString()).toContain("VARIANT_ID");
        });
        it("should return GENERAL_VALIDATION_ERROR if a variant items has a mandatory field missing", () => {
            // arrange
            const oVariantData = new TestDataUtility(aRequestForCalculation).build();
            delete oVariantData[0].ITEMS.ITEM_ID;
            const oRequest = prepareCalculateRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR the CALCULATION_VERSION_ID is present in a variant header body", () => {
            // arrange
            const oVariantData = new TestDataUtility(aRequestForCalculation).build();
            oVariantData[0].CALCULATION_VERSION_ID = iIdOfVersionWithVariants;
            const oRequest = prepareCalculateRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
            expect(oResponseMessages.details.messageTextObj.toString()).toContain("CALCULATION_VERSION_ID");
        });
        it("should return GENERAL_VALIDATION_ERROR if a variant is sent without the ITEMS", () => {
            // arrange
            const oVariantData = new TestDataUtility(aRequestForCalculation).build();
            delete oVariantData[0].ITEMS;
            const oRequest = prepareCalculateRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR if an invalid value is assigned for quantity state for root item", () => {
            // arrange
            const oVariantData = new TestDataUtility(aRequestForCalculation).build();
            oVariantData[0].ITEMS.QUANTITY_STATE[0] = 2; //root item must have 1 as quantity state
            const oRequest = prepareCalculateRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_VALIDATION_ERROR if an invalid value is assigned for quantity state for leaf item", () => {
            // arrange
            const oVariantData = new TestDataUtility(aRequestForCalculation).build();
            oVariantData[0].ITEMS.QUANTITY_STATE[1] = 9; //leaf item must have 0,1 or 2 as quantity state
            const oRequest = prepareCalculateRequest(oVariantData, iIdOfVersionWithVariants);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(oMessageCode.GENERAL_VALIDATION_ERROR.code);
        });
        it("should return GENERAL_ACCESS_DENIED when the user has no instance privilege to calculate the variant", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oRequest = prepareCalculateRequest(aRequestForCalculation, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the given calculation version id does not exist", () => {
            // arrange
            // arrange
            const oRequest = prepareCalculateRequest(aRequestForCalculation, 1234);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is locked by another user in the same context", () => {
            // arrange
            oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);
            const oRequest = prepareCalculateRequest(aRequestForCalculation, iIdOfVersionWithVariants);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
    });

    describe("PUT - calculate variant persistent", () => {
        beforeEach(() => {
            oMockstar.clearTable("authorization");
            oMockstar.insertTableData("authorization", oAuthorizationTestDataCreate);
        });

        function preparePutRequest(iCalculationVersionId, iVariantId) {
            const oRequest = {
                queryPath: `calculation-versions/${iCalculationVersionId}/variant-calculator/${iVariantId}`,
                method: $.net.http.PUT,
            };
            return oRequest;
        }

        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the given calculation version id does not exist", () => {
            // arrange
            // arrange
            const oRequest = preparePutRequest(1234, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });
        it("should return GENERAL_ENTITY_NOT_FOUND_ERROR when the given variant id does not exist", () => {
            // arrange
            // arrange
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, 1234);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
        });
        it("should return GENERAL_ACCESS_DENIED when the user has no instance privilege to calculate the variant", () => {
            // arrange
            oMockstar.clearTable("authorization");
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, 1);

            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe(oMessageCode.GENERAL_ACCESS_DENIED.responseCode);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.head.messages[0].code).toBe(oMessageCode.GENERAL_ACCESS_DENIED.code);
            expect(oResponseBody.body.transactionaldata).toBeUndefined();
        });
        it("should return a empty body if the calculation was successful", () => {
            // arrange
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const oResponseBody = oResponseStub.getParsedBody();
            expect(oResponseBody.body).toEqual({});
        });
        it("should correctly update the variant with the calculated fields", () => {
            // arrange
            const oRequest =preparePutRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oMockstar.execQuery(`select * from {{variant_temporary}} where VARIANT_ID = ${iValidVariantId}`).columns;
            // check variant calculated fields
            expect(aCalculatedVariants.TOTAL_COST.rows[0]).toBe("492.5699000");
        });
        it("should not update other fields thant the calculated ones for variant", () => {
            // arrange
            const aVariantBeforeCalculation = oMockstar.execQuery(`select * from {{variant}} where VARIANT_ID = ${iValidVariantId}`).columns;
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oMockstar.execQuery(`select * from {{variant}} where VARIANT_ID = ${iValidVariantId}`).columns;
            // check variant calculated fields
            expect(aCalculatedVariants.VARIANT_NAME.rows[0]).toBe(aVariantBeforeCalculation.VARIANT_NAME.rows[0]);
            expect(aCalculatedVariants.COMMENT.rows[0]).toBe(aVariantBeforeCalculation.COMMENT.rows[0]);
            expect(aCalculatedVariants.IS_SELECTED.rows[0]).toBe(aVariantBeforeCalculation.IS_SELECTED.rows[0]);
        });
        it("should correctly update the variant items with the calculated fields", () => {
            // arrange
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const sQuery = `select * from {{variant_item_temporary}} where VARIANT_ID = ${iValidVariantId} and ITEM_ID in (3001, 3002)`;
            const aCalculatedVariantItems = oMockstar.execQuery(sQuery).columns;
            // check variant items calculate fields
            expect(aCalculatedVariantItems.TOTAL_COST.rows[0]).toBe("492.5699000");
            expect(aCalculatedVariantItems.TOTAL_COST.rows[1]).toBe("492.5699000");
            // because the QUANTITY of the root item is 11
            expect(aCalculatedVariantItems.TOTAL_QUANTITY.rows[0]).toBe("10.0000000");
            expect(aCalculatedVariantItems.TOTAL_QUANTITY.rows[1]).toBe("100.0000000");
        });
        it("should not update other fields than the calculated ones for variant items", () => {
            // arrange
            const sQuery = `select * from {{variant_item}} where VARIANT_ID = ${iValidVariantId} and ITEM_ID in (3001, 3002)`;
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, iValidVariantId);
            const aBeforeVariantItems = oMockstar.execQuery(sQuery).columns;
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);

            const aCalculatedVariantItems = oMockstar.execQuery(sQuery).columns;
            // check variant items calculate fields
            expect(aCalculatedVariantItems.IS_INCLUDED.rows[0]).toBe(aBeforeVariantItems.IS_INCLUDED.rows[0]);
            expect(aCalculatedVariantItems.IS_INCLUDED.rows[1]).toBe(aBeforeVariantItems.IS_INCLUDED.rows[1]);
            expect(aCalculatedVariantItems.QUANTITY_UOM_ID.rows[0]).toBe(aBeforeVariantItems.QUANTITY_UOM_ID.rows[0]);
            expect(aCalculatedVariantItems.QUANTITY_UOM_ID.rows[1]).toBe(aBeforeVariantItems.QUANTITY_UOM_ID.rows[1]);
            expect(aCalculatedVariantItems.QUANTITY.rows[0]).toBe(aBeforeVariantItems.QUANTITY.rows[0]);
            expect(aCalculatedVariantItems.QUANTITY.rows[1]).toBe(aBeforeVariantItems.QUANTITY.rows[1]);
        });
        it("should correctly update LAST_CALCULATED_ON and LAST_CALCULATED_BY", () => {
            // arrange
            const dStart = new Date();
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, iValidVariantId);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.OK);
            const aCalculatedVariants = oMockstar.execQuery(`select * from {{variant_temporary}} where VARIANT_ID = ${iValidVariantId}`).columns;
            const dEnd = new Date();
            const dLastCalculated = aCalculatedVariants.LAST_CALCULATED_ON.rows[0];
            testHelpers.checkDateIsBetween(dLastCalculated, dStart, dEnd);
            expect(aCalculatedVariants.LAST_CALCULATED_BY.rows[0]).toBe(sUserId);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is locked by another user in the same context", () => {
            // arrange
            oMockstar.insertTableData("open_calculation_versions", oOpenCalculationVersions);
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, 1);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();
            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is a lifecycle version", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.CALCULATION_VERSION_TYPE[0] = CalculationVersionType.Lifecycle;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, 1);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
        it("should throw ENTITY_NOT_WRITABLE_ERROR if the base version is frozen", () => {
            // arrange
            const oCVTestData = new TestDataUtility(testData.oCalculationVersionForVariantTestData).build();
            oCVTestData.IS_FROZEN[0] = 1;
            oMockstar.clearTable("calculationVersion");
            oMockstar.insertTableData("calculationVersion", oCVTestData);
            const oRequest = preparePutRequest(iIdOfVersionWithVariants, 1);
            // act
            new Dispatcher(oCtx, oRequest, oResponseStub).dispatch();

            // assert
            expect(oResponseStub.status).toBe($.net.http.BAD_REQUEST);
            const oResponseMessages = oResponseStub.getParsedBody().head.messages[0];
            expect(oResponseMessages.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR.code);
        });
    });
}).addTags(["All_Unit_Tests"]);
